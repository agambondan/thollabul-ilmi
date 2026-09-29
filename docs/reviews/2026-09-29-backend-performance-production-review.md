# Backend Performance Deep Review — Production-Verified — 29 Sep 2026

## Ruang Lingkup & Metode

Review ini berbeda dari dua dokumen lain yang ditulis hari yang sama —
[`2026-09-29-native-query-optimization-benchmark.md`](./2026-09-29-native-query-optimization-benchmark.md)
(40 repository Preload→raw-SQL, diukur via Go benchmark/SQLite) dan
[`2026-09-29-mobile-performance-post-fix-deep-review.md`](./2026-09-29-mobile-performance-post-fix-deep-review.md)
(sisi mobile) — karena seluruh temuan di sini diverifikasi langsung ke
**production** (`sumopod-1`, container `tholabul-ilmi-tholabul-ilmi-postgres-1`
& `-api-1`) lewat `pg_stat_statements`, `EXPLAIN ANALYZE`, dan endpoint
`/metrics` yang sesungguhnya — bukan benchmark sintetis. Dua lensa ini saling
melengkapi: benchmark doc membuktikan raw-SQL lebih cepat secara komputasi;
dokumen ini membuktikan query mana yang **benar-benar mahal di data produksi
asli** dan kenapa.

Trigger awal: laporan user "mobile app lama muncul." Root-cause pertama
(instrumentasi produksi nol) membuka jalan ke temuan-temuan berikutnya.

---

## Bagian A — Sudah Diperbaiki, Dideploy, dan Diverifikasi

### A1. Endpoint `/metrics` rusak (cardinality bug)

**Temuan:** `MetricsMiddleware` memberi label Prometheus `path` dari `c.Path()`
— path konkret dengan ID dinamis, sekaligus buffer fasthttp yang dipakai ulang
antar-request. Hasilnya: 15.060 error "collected metric was collected before
with the same name and label values", payload `/metrics` membengkak ke ~8 MB
isinya spam error, bukan angka valid.
**Fix:** ganti ke `c.Route().Path` (pattern statis, cardinality terbatas ke
jumlah route terdaftar), dipindah ke setelah `c.Next()`.
**Verified:** `/metrics` sekarang 200 OK, ~2-24 KB tergantung trafik, 0 error.
Commit `0c19ac7d`.

### A2. `api_db_query_duration_seconds` dan log latency selalu kosong

**Temuan:** Histogram durasi query DB sudah didefinisikan tapi
`ObserveDBQuery()` tidak pernah dipanggil (dead code) — nol data sejak
pertama dibuat. Terpisah, `StructuredLog()` menulis field `"latency"` dengan
`c.Response().Header.Peek(ContentLength)` (bug copy-paste), bukan durasi
— selalu string kosong di setiap baris log request.
**Fix:** `RegisterDBMetrics()` (baru) mendaftarkan callback GORM
`Before("*")`/`After("*")` di Create/Query/Update/Delete/Row/Raw, dipasang
di `NewPostgresql()`. `StructuredLog` sekarang menghitung `time.Since(start)`
sungguhan sebagai `latency_ms`.
**Verified:** `api_db_query_duration_seconds_count` naik sesuai trafik nyata
(cth. 48 setelah beberapa request manual); log baris `"latency_ms":91` dst,
bukan lagi string kosong. Test baru: `TestRegisterDBMetricsObservesQueryDuration`.
Commit `0c492303`.

### A3. Hadith-of-the-day: 1 query bisa 2.2 detik

**Temuan:** Widget "Hadis Hari Ini" (`hadith_service.go:154`,
`offset = dayOfYear % totalHadithCount`) memanggil `FindByOffset`, yang
men-skip `offset` baris **lewat join 5 tabel penuh** (Book/Theme/Chapter/
Translation ×2) sebelum sampai ke 1 baris yang diminta. Karena offset
tersebar acak sepanjang ~65.625 baris tabel `hadith`, biaya join dikalikan
jumlah baris yang dibuang. `pg_stat_statements`: 18 call, mean 816 ms, **max
2.204 detik**. `EXPLAIN ANALYZE` membuktikan langsung: 0.77 ms di offset 0
vs **369 ms di offset 50.000** — 480x lebih lambat, murni karena offset,
bukan volume data (hadith cuma 65k baris, kecil untuk Postgres).
**Fix:** `FindByOffset` sekarang resolve `id` dulu lewat scan ringan tanpa
join (`SELECT id ... OFFSET n LIMIT 1`, kena index PK langsung), baru
delegasikan ke `FindById` yang sudah terbukti cepat (2.4 ms, equality
lookup).
**Verified di production:** `GET /api/v1/hadiths/daily` mendarat di offset
57.523 (dekat kasus terburuk) → **51 ms** total (dulu akan >2 detik).
Query pattern baru di `pg_stat_statements`: `SELECT "id" FROM "hadith" ...`
15 ms. Test baru: `TestHadithFindByOffsetReturnsRowAtPosition` +
`TestHadithFindByOffsetOutOfRange`. Commit `6f202c91`.

---

## Bagian B — Temuan Baru, Belum Diperbaiki (Prioritas)

### B1. 🔴 Seeder `kajian_transcript`: insert satu-baris-satu-transaksi

**Data:** `pg_stat_statements` — `INSERT INTO "kajian_transcript" (...)`:
**749.866 call, total 3.239.715 ms (≈54 menit kumulatif), mean 4.32 ms, max
41.767 ms (41,7 DETIK untuk satu INSERT)**. Ini angka DB-time terbesar di
seluruh sistem, jauh di atas temuan A3.

**Kenapa:** `app/db/migrations/seeder_kajian_transcript.go:123` — loop
`for _, chunk := range item.Transcripts { ... db.Omit("Embedding").Create(&t) }`
memanggil `.Create()` satu baris per statement, tanpa dibungkus
`.Transaction()` atau `.CreateInBatches()`. `NewPostgresql()` men-set
`SkipDefaultTransaction: true` (dimaksudkan untuk request path, bukan untuk
seeder), jadi setiap `INSERT` = satu commit + fsync WAL sendiri-sendiri.
Dengan ratusan ribu chunk transkrip, biaya fsync-per-baris inilah yang
mendominasi — bukan komputasi query itu sendiri (kolom `text_tsv` generated
`tsvector` per baris juga menambah, tapi jauh lebih kecil dari overhead
commit). Max 41,7 detik untuk 1 statement mengindikasikan ada momen
tunggu lock/I/O, bukan cuma jumlah kerja normal.

**Kenapa ini penting:** ini bukan cuma soal waktu deploy. Migrate step
berjalan lewat `docker compose run` **sebelum** container API lama
di-recreate — artinya proses seeding yang lambat ini terjadi **sambil
container lama masih melayani trafik user sungguhan**, berbagi instance
Postgres yang sama. Efek langsungnya sudah saya alami sendiri sesi ini:
percobaan deploy pertama mati kena timeout 5 menit karena migrate belum
selesai — bukan karena banyak yang diseed, tapi karena pola insert ini
lambat secara struktural.

**Rekomendasi:** batch insert per video (`CreateInBatches(chunks, 200)`
atau satu `.Transaction()` membungkus semua chunk 1 video) alih-alih per
baris. Ekspektasi: penurunan drastis (pola well-known di Postgres — batching
insert biasa memberi speedup satu-hingga-dua-order-of-magnitude dibanding
autocommit-per-baris). **Belum diimplementasikan** — di luar scope
perbaikan reaktif sesi ini, butuh keputusan eksplisit karena menyentuh
seeder yang sensitif (lihat `project_kajian_transcript_fabrication` di
memory — riwayat insiden data kajian).

### B2. 🟠 `translation.en` tanpa index untuk equality match

**Data:** `UPDATE translation SET idn=$1 WHERE en=$2 AND (...)` — 3192 call,
mean 10.81 ms, max 1225 ms.
**Kenapa:** tabel `translation` (104.006 baris) hanya punya
`idx_trgm_translation_en` — index **GIN trigram**, dioptimasi untuk
`ILIKE`/similarity, bukan exact-match (`en = ?`). Setiap panggilan backfill
ini kemungkinan jatuh ke sequential-scan-effective di 104k baris.
**Rekomendasi:** tambah B-tree biasa `CREATE INDEX idx_translation_en_btree
ON translation (en)` di samping index trigram yang sudah ada (keduanya bisa
hidup berdampingan, tidak saling gantikan). Dampak utama di deploy-time
(seeder), bukan request path — sama seperti B1. **Belum diimplementasikan.**

### B3. 🟡 `ayah` (6.236 baris): 50 juta tuple dibaca via sequential scan

**Data:** `pg_stat_user_tables` — `ayah`: 8.067 seq_scan, **50.006.532
seq_tup_read kumulatif** (≈8.067 × 6.236, konsisten dengan full-table-scan
berulang), sementara `idx_scan` = 19.287 (campuran — sebagian query sudah
pakai index, sebagian tidak).
**Catatan:** tabel ini kecil (6.236 baris), jadi per-scan individual
kemungkinan tetap sub-millisecond — ini BUKAN bug yang sudah terverifikasi
lambat seperti B1/A3, tapi pola yang layak diselidiki lebih lanjut: repo
method mana yang masih full-scan `ayah` alih-alih pakai index yang tersedia
akan makin terasa kalau tabel ini tumbuh (mis. multi-riwayat qiraat). Belum
diidentifikasi method spesifiknya — perlu `EXPLAIN` per method `ayah_repository.go`
kalau mau ditindaklanjuti.

### B4. 🟢 Production 5 commit di belakang HEAD saat review ini ditulis

**Data:** container API berjalan sejak commit `6f202c91` (09:59 UTC);
`git log` menunjukkan `f27850bd` s.d. `359e0560` (5 commit batch 7-8 raw-SQL
rewrite dari [`native-query-optimization-benchmark.md`](./2026-09-29-native-query-optimization-benchmark.md))
sudah di-commit tapi belum di-deploy per waktu penulisan.
**Catatan:** bukan bug, murni observasi status — perlu di-deploy (lewat
`make thollabul-api` dari clean worktree, pola yang sudah dipakai
berulang kali sesi ini) sebelum benchmark di dokumen itu benar-benar aktif
di production dan sebelum sweep `pg_stat_statements` berikutnya dianggap
mewakili kondisi terbaru.

### B5. 🟢 Disk I/O Postgres: 58 GB baca / 75.7 GB tulis dalam ~2.5 jam

**Data:** `docker stats` pada container postgres sejak restart terakhir
(09:59) menunjukkan BLOCK I/O 58.1 GB read / 75.7 GB write — jauh melebihi
ukuran data aktual (~ratusan MB). Kemungkinan besar kombinasi B1 (commit-
per-baris = WAL churn tinggi) dan beberapa kali migrate ulang dalam sesi
ini. VPS ini shared dengan 2 project lain (`eduplay`, `wedding`) dan disk
sudah di ~73% usage saat sesi dimulai — worth dipantau kalau seeding
sebesar ini jadi rutin (bukan cuma insiden sesi ini).

---

## Bagian C — Baseline Observability (Baru Aktif Hari Ini)

Sebelum sesi ini, **tidak ada** cara mengukur durasi query di production —
`pg_stat_statements` off, `log_min_duration_statement=-1`, GORM logger
`Silent` di prod, histogram DB kosong. Semua temuan di Bagian B di atas
hanya bisa ditemukan KARENA baseline ini sekarang aktif:

| Instrumen                       | Status                   | Cara pakai                                                                             |
| ------------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `pg_stat_statements`            | ✅ Aktif                 | `SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC` di container postgres |
| `api_db_query_duration_seconds` | ✅ Aktif, terisi nyata   | Histogram Prometheus di `/metrics`                                                     |
| `api_request_duration_seconds`  | ✅ Aktif (bounded label) | Per method+route pattern, `/metrics`                                                   |
| Structured log `latency_ms`     | ✅ Aktif, angka asli     | `docker logs tholabul-ilmi-tholabul-ilmi-api-1`                                        |
| `ObserveDBQuery()` wiring       | ✅ Aktif                 | `RegisterDBMetrics()` di `db/postgresql.go`                                            |

**Belum ada:** alerting otomatis (Temuan #28 di
`2026-09-28-mobile-performance-deep-review.md` masih relevan — metrik
sekarang valid, tapi tidak ada yang memantau otomatis kalau
`api_slow_requests_total` naik).

---

## Prioritas Tindak Lanjut

| #   | Temuan                                                  | Dampak                                       | Effort         | Status    |
| --- | ------------------------------------------------------- | -------------------------------------------- | -------------- | --------- |
| B1  | Batch insert `kajian_transcript` seeder                 | 🔴 Tinggi (deploy time + shared DB load)     | 2-3j           | ⏳ Belum  |
| B4  | Deploy 5 commit tertunda ke production                  | 🔴 Tinggi (fix belum aktif)                  | 15m            | ⏳ Belum  |
| B2  | B-tree index `translation.en`                           | 🟠 Sedang (seeder-time)                      | 15m            | ⏳ Belum  |
| B3  | Audit method `ayah_repository.go` full-scan             | 🟡 Rendah-Sedang (belum kritis, tabel kecil) | 1j investigasi | ⏳ Belum  |
| B5  | Pantau disk I/O growth                                  | 🟢 Rendah (observasi)                        | -              | 👁️ Pantau |
| —   | Alerting `api_slow_requests_total`/`pg_stat_statements` | 🟠 Sedang (mencegah insiden berulang)        | 2j             | ⏳ Belum  |

Semua di Bagian A sudah selesai + terverifikasi live. Bagian B murni
temuan+rekomendasi (tidak diimplementasikan otomatis) — sesuai arahan sesi
ini untuk fokus ke review, bukan siklus fix-deploy lanjutan.
