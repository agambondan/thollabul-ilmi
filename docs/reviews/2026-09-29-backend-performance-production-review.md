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
Bagian B0 berasal dari audit statis independen (subagent terpisah) yang
diminta memverifikasi correctness — bukan performa — dari rewrite
Preload→raw-SQL di dokumen benchmark; temuannya ternyata lebih genting
daripada semua temuan performa di review ini.

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

## Bagian B — Temuan, Sekarang Sudah Diperbaiki

Semua temuan B0–B3 di bawah ini sudah diperbaiki, dibuild+vet+test, dan
(kecuali dinyatakan lain) dideploy+diverifikasi live per commit `b7ed2aba`
dan `8a98f69b`. B5 murni observasi, bukan sesuatu yang "difix".

### B0. ✅ FIXED — Filter `deleted_at` hilang sistemik di rewrite raw-SQL (sudah live sebelum fix)

Sumber: audit statis independen (subagent terpisah, 12 commit / 40 file
di `app/repository`), dijalankan sebagai verifikasi correctness atas
rewrite Preload→raw-SQL di
[`native-query-optimization-benchmark.md`](./2026-09-29-native-query-optimization-benchmark.md).
`go build`/`go vet`/`go test ./...` semua **PASS** — sinyal itu tidak
menangkap bug ini sama sekali, karena tidak ada test yang sengaja bikin
baris soft-deleted lalu assert baris itu tidak muncul.

**#1 — Data hilang total, bukan soal performa.** `hadith.Media` (aset
audio) hilang dari 11 method di `hadith_repository.go` — `.Preload("Media")`
dihapus di commit `d5761228` dan `359e0560` tanpa diganti apa pun.
**Belum live** (kedua commit ini termasuk 5 commit tertunda di B4) —
tapi begitu B4 dieksekusi apa adanya, bug ini ikut naik ke production.

**#2 — Filter `deleted_at IS NULL` hilang di ~35 dari 40 file yang
di-rewrite,** di tabel utama maupun tabel yang di-`JOIN`. GORM otomatis
menambahkan filter ini untuk tiap model soft-deletable; SQL mentah hasil
rewrite hampir semua tidak mereproduksinya. Ironisnya `hadith_ayah_repository.go`
— file yang dipakai sebagai acuan pola oleh commit-commit berikutnya —
sama sekali tidak pernah memfilter `deleted_at`. Pola yang justru bersih
ada di `sanad_repository.go`.

**Confirmed SUDAH LIVE di production sekarang** (file-file ini adalah
ancestor dari commit `6f202c91`, commit yang sedang jalan di container
saat ini): `munasabah_repository.go`, `tafsir_repository.go`,
`hadith_ayah_repository.go`, `mufrodat_repository.go`,
`asbabun_nuzul_repository.go`, `jarh_tadil_repository.go`,
`perawi_repository.go`, `fiqh_repository.go`, `takhrij_repository.go`,
`siroh_repository.go`, `history_repository.go`,
`tokoh_tarikh_repository.go` — plus `hafalan_repository.go` dan
`manasik_repository.go` (bentuk lebih ringan: kolom `deleted_at` di-SELECT
tapi tidak dipakai filter). File lain dengan gap yang sama
(`dictionary_repository.go` — termasuk yang dipakai ulang
`search_repository.go`, `asmaul_husna_repository.go`, `hijri_repository.go`,
`sholat_repository.go`, `achievement_repository.go`, `amalan_repository.go`,
`kajian_note_repository.go`, `kajian_bookmark_repository.go`,
`murojaah_repository.go`, `content_report_repository.go`,
`content_audit_log_repository.go`, `notification_repository.go`,
`lesson_repository.go`/`blog_repository.go`/`quiz_repository.go`
(sebagian — base table benar, tabel `translation` yang di-join tidak),
`book_repository.go`/`chapter_repository.go`/`juz_repository.go`/`theme_repository.go`
(query sekunder)) masih menunggu deploy commit `f27850bd`..`359e0560`.

**Kenapa ini bukan sekadar gap teknis:** project ini punya riwayat
panjang membersihkan data salah/fabrikasi secara manual lalu soft-delete
— `2026-09-17-audit-ahmad-jilid-halaman-citations.md` (10 kutipan HR.
Ahmad dikoreksi/dihapus), `2026-09-08-audit-transkrip-kajian.md` (5
video transkrip fabrikasi dikosongkan), riwayat serupa di
`project_kajian_transcript_fabrication` (memory). Kalau filter
`deleted_at` hilang persis di repository yang menyajikan data itu, ada
risiko nyata konten yang sudah sengaja disembunyikan **muncul kembali di
API** — bukan skenario teoretis untuk project dengan riwayat insiden
seperti ini.

**Temuan tambahan (lebih ringan, dari audit yang sama):**
`tokoh_tarikh_repository.go` — parameter `?size=` yang gagal di-parse atau
`0` tidak ditolak (`app/controllers/tokoh_tarikh_controller.go:42-45`
buang error `strconv.Atoi`), jadi klausa `LIMIT`/`OFFSET` tidak pernah
ditambahkan → full unbounded scan bisa dipicu dari query param biasa.

**Fix (commit `b7ed2aba`):** 34 repository file diaudit ulang & diperbaiki
memakai `sanad_repository.go` sebagai pola acuan (base table filter di
WHERE, tiap joined table soft-deletable difilter di klausa `ON`-nya
masing-masing, bukan WHERE — supaya `LEFT JOIN` tidak diam-diam jadi
`INNER JOIN` ketika asosiasinya soft-deleted). Dikerjakan oleh 4 subagent
paralel (masing-masing ~8-9 file), lalu direview dan di-build/vet/test
ulang secara gabungan sebelum commit. Temuan tambahan yang ikut
kegali & diperbaiki saat proses ini:

- **2 bug precedence OR** (`tafsir_repository.go`'s `Search`,
  `search_repository.go`'s `SearchDictionary`) — menambahkan
  `AND deleted_at IS NULL` mentah-mentah di belakang chain `OR` tanpa
  kurung akan cuma nempel ke term OR terakhir, membiarkan term lain
  tetap tak terfilter. Sudah dibungkus kurung dengan benar.
- **`book_repository.go`/`theme_repository.go`'s agregasi `.Table("hadith")`
  / `.Table("book_themes")`** — `.Table()` GORM juga bypass auto-scoping
  yang sama seperti raw SQL; ditemukan saat audit `.Joins()`-builder vs
  raw-SQL dry-run, ditambahkan filter manual.
- **`hadith.Media` (aset audio)** — hilang dari 11 method
  `hadith_repository.go` sejak `.Preload("Media")` dihapus tanpa
  pengganti. Dikembalikan lewat helper `withRelations()` bersama (otomatis
  cover 10 dari 11 method) + 1 method yang membangun query sendiri.
- **`tokoh_tarikh_controller.go`** — `?size=` yang gagal parse atau `0`
  sekarang fallback ke default 20, bukan diam-diam jadi unbounded scan.

**Verified:** `go build`/`go vet`/`go test ./...` PASS, termasuk rerun
paksa `-count=1` (bypass cache) untuk `app/repository`,
`app/db/migrations`, `tests/controller` — nol failure. Test Postgres-gated
`search_repository_test.go` (`//go:build postgres`) sengaja TIDAK
dijalankan otomatis karena test itu men-`TRUNCATE` tabel di Postgres dev
yang dipakai bersama sesi lain — perlu dijalankan manual terpisah kalau
mau verifikasi penuh `SearchDictionary`.

### B1. ✅ FIXED — Seeder `kajian_transcript`: insert satu-baris-satu-transaksi

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

**Fix (commit `8a98f69b`):** Fungsi seeder yang benar-benar aktif ternyata
`seedKajianFromFile` (huruf kecil, di `seeder_static_file.go`) — bukan
`SeedKajianTranscriptsFromFile` yang namanya mirip (fungsi itu baca dari
path lama yang sudah basi, jadi no-op di praktiknya; tetap ikut dibatch
untuk konsistensi, tapi bukan sumber angka di atas). Loop per-chunk diganti
jadi mengumpulkan semua chunk 1 video ke slice, lalu satu panggilan
`CreateInBatches(&chunkRows, 200)` dengan `OnConflict` yang sama persis
(upsert semantics tidak berubah). **Verified:** dijalankan ulang lewat
`TestSeedKajianFromFileIntegration` yang sudah ada, memakai dataset asli
(bukan fixture kecil) — 7.346 kajian, **219.931 transcript chunk**
ter-batch dengan benar, semua assertion existing tetap lolos.

### B2. ✅ FIXED — `translation.en` tanpa index untuk equality match

**Data:** `UPDATE translation SET idn=$1 WHERE en=$2 AND (...)` — 3192 call,
mean 10.81 ms, max 1225 ms.
**Kenapa:** tabel `translation` (104.006 baris) hanya punya
`idx_trgm_translation_en` — index **GIN trigram**, dioptimasi untuk
`ILIKE`/similarity, bukan exact-match (`en = ?`). Setiap panggilan backfill
ini kemungkinan jatuh ke sequential-scan-effective di 104k baris.
**Fix (commit `8a98f69b`):** ditambahkan `CREATE INDEX IF NOT EXISTS
idx_translation_en_btree ON translation (en)` di `createCompositeIndexes()`
(`app/repository/repository.go`), tempat semua index komposit/GIN lain di
proyek ini didaftarkan — hidup berdampingan dengan index trigram yang sudah
ada, jalan otomatis saat API boot (idempotent, `IF NOT EXISTS`).

### B3. ✅ FIXED — `ayah` (6.236 baris): 50 juta tuple dibaca via sequential scan

**Data:** `pg_stat_user_tables` — `ayah`: 8.067 seq_scan, **50.006.532
seq_tup_read kumulatif** (≈8.067 × 6.236, konsisten dengan full-table-scan
berulang), sementara `idx_scan` = 19.287 (campuran — sebagian query sudah
pakai index, sebagian tidak).
**Ketemu akar masalahnya:** `ayah_repository.go`'s `FindDaily` — widget
"Ayat Hari Ini", pasangan persis dari bug A3 (Hadis Hari Ini), pola yang
sama sekali sama: `.Offset(number-1).Limit(1).First()` lewat join 3 tabel
(Translation/Surah/Surah.Translation) alih-alih resolve id dulu. Tabelnya
lebih kecil dari hadith (6.236 vs 65.625 baris) jadi dampaknya tidak
sedramatis A3, tapi mekanismenya identik.

**Fix (commit `8a98f69b`):** pola fix yang sama persis dengan A3 — resolve
`id` dulu lewat scan ringan (`Select("id").Offset(n).Limit(1)`, tanpa
join), baru delegasikan ke `FindById` yang sudah cepat. **Verified:** test
existing `ayah_repository_test.go` (yang sudah meng-assert `FindDaily(2)`)
tetap lolos tanpa perlu diubah.

### B4. Deploy production ke HEAD terbaru (unblocked, sekarang dieksekusi)

**Data:** container API berjalan sejak commit `6f202c91` (09:59 UTC);
5 commit batch 7-8 raw-SQL rewrite dari
[`native-query-optimization-benchmark.md`](./2026-09-29-native-query-optimization-benchmark.md)
sudah di-commit tapi belum di-deploy per waktu penulisan awal dokumen ini
— termasuk penghapus `.Preload("Media")` tanpa pengganti yang jadi bagian
B0 #1. Blocker itu sekarang sudah beres (B0 fixed di commit `b7ed2aba`,
Media dikembalikan di file yang sama), jadi deploy HEAD (`8a98f69b` ke
atas) sekarang aman dieksekusi — dan mencakup baik fix B0-B3 di dokumen
ini maupun rewrite performa dari dokumen benchmark.

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

**Update 30 Sep:** alerting host/container sudah aktif lewat Beszel
(Bagian D). **Yang masih belum ada:** alert berbasis metrik aplikasi
(Temuan #28 di `2026-09-28-mobile-performance-deep-review.md` masih
relevan — metrik sekarang valid, tapi tidak ada yang memantau otomatis
kalau `api_slow_requests_total` naik).

---

## Prioritas Tindak Lanjut

| #   | Temuan                                                      | Dampak                                                | Effort | Status                  |
| --- | ----------------------------------------------------------- | ----------------------------------------------------- | ------ | ----------------------- |
| B0  | Filter `deleted_at` hilang sistemik (34 file)               | 🔴🔴 Kritis (live, risiko data fabrikasi muncul lagi) | 4-6j   | ✅ Fixed (`b7ed2aba`)   |
| B1  | Batch insert `kajian_transcript` seeder                     | 🔴 Tinggi (deploy time + shared DB load)              | 2-3j   | ✅ Fixed (`8a98f69b`)   |
| B2  | B-tree index `translation.en`                               | 🟠 Sedang (seeder-time)                               | 15m    | ✅ Fixed (`8a98f69b`)   |
| B3  | `ayah_repository.go` `FindDaily` offset-scan                | 🟡 Sedang (pola sama dgn A3, tabel lebih kecil)       | 1j     | ✅ Fixed (`8a98f69b`)   |
| B4  | Deploy HEAD ke production                                   | 🔴 Tinggi                                             | 15m    | ✅ Deployed (30 Sep)    |
| B5  | Pantau disk I/O growth                                      | 🟢 Rendah (observasi)                                 | -      | 👁️ Pantau               |
| —   | Alert host/container (disk, memori, CPU, status)            | 🟠 Sedang (mencegah insiden berulang)                 | 2j     | ✅ Aktif (Bagian D1)    |
| —   | Alert berbasis metrik aplikasi (`api_slow_requests_total`)  | 🟡 Rendah-sedang                                      | 2j     | ⏳ Belum                |
| D2  | Index duplikat/tak terpakai (temuan pgHero)                 | 🟠 Sedang (biaya tulis + disk)                        | 1j     | ✅ Fixed (Bagian D2)    |
| D3  | Disk VPS 90%                                                | 🔴 Tinggi (risiko outage semua project)               | 2j     | ✅ Fixed, jadi 52% (D3) |
| D4  | Kolom `embedding` kajian tidak terpakai (288 MB + cron)     | 🟡 Sedang (payload API + disk + cron sia-sia)         | 2j     | ✅ Fixed (Bagian D4)    |
| D5  | Rate limiter menghitung semua pengguna sebagai satu IP      | 🔴🔴 Kritis (auth 10/menit untuk semua orang)         | 3j     | ✅ Fixed (Bagian D5)    |
| D6  | `/metrics` error: label `method` beralias buffer request    | 🟠 Sedang (observability)                             | 1j     | ✅ Fixed (Bagian D6)    |
| D7  | Seeder kajian: id chunk berganti + upsert tulis ulang semua | 🟠 Sedang (data pengguna + I/O)                       | 2j     | ✅ Fixed (Bagian D7)    |
| D8  | Tombstone yatim + endpoint transkrip bocorkan soft-delete   | 🟡 Sedang (chunk ganda ke app + disk)                 | 1j     | ✅ Fixed (Bagian D8)    |
| D9  | Tes regresi soft delete belum ada (B0 tidak terjaga)        | 🟠 Sedang (regresi lolos diam-diam)                   | 4j     | ✅ Fixed, 185 tes (D9)  |
| D10 | Bookmark dan catatan kajian tidak pernah bisa disimpan      | 🔴 Tinggi (fitur mati di produksi)                    | 2j     | ✅ Fixed (Bagian D10)   |

Bagian A dan B0-B3 semua sudah diperbaiki + di-build/vet/test hijau, dan B4
(deploy) sudah live. B5 murni item pantau, bukan sesuatu untuk "difix".

---

## Bagian D — Tindak Lanjut 30 Sep: Monitoring, Index, dan Disk

Detail operasional (lokasi, alert, jadwal, jebakan) ada di
[`docs/setup/vps-monitoring-and-maintenance.md`](../setup/vps-monitoring-and-maintenance.md).
Bagian ini mencatat temuan dan hasilnya.

### D1. Dashboard dan alert

Beszel (host + container) dan pgHero (Postgres) terpasang dan bisa dibuka di
subdomain `beszel.thollabulilmi.site` / `pghero.thollabulilmi.site`. Lima
alert Beszel aktif dan dikirim ke Telegram: status, disk > 85%, memori > 90%,
CPU > 90%, dan container unhealthy. Alert berbasis metrik aplikasi belum ada.

### D2. Index Postgres dibersihkan

- pgHero menandai index duplikat (kolom pertamanya sudah dicakup index lain);
  19 di antaranya di-`DROP`. `AutoMigrate` GORM hanya menambah dan tidak pernah
  menghapus, jadi definisinya juga dihapus dari `createCompositeIndexes()` dan
  tag GORM di model. Kalau hanya salah satu yang diubah, index muncul lagi di
  deploy berikutnya.
- Di `kajian_transcript`: index HNSW untuk `embedding` (305 MB, tidak dipakai
  query mana pun) dan index FTS yang duplikat dengan `text_tsv` (86 MB) di-drop.
  Total index tabel itu turun dari 791 MB jadi ±400 MB. Biaya pemeliharaan
  keduanya di setiap INSERT/UPDATE ikut menjelaskan lonjakan durasi INSERT ke
  tabel ini yang terlihat di `pg_stat_statements`.
- `pg_stat_statements` bersifat kumulatif, jadi lonjakan lama tetap terlihat
  sampai `pg_stat_statements_reset()` dijalankan.

### D3. Disk VPS 90% jadi 52%

Disk sempat 90% (sisa 4,1 GB) di VPS yang dipakai bersama eduplay dan wedding.
Penyebabnya image tanpa tag yang menumpuk tiap deploy (5,96 GB) dan registry
lokal 12,6 GB yang tidak pernah di-GC (ratusan revisi manifest tanpa tag).
Sekarang ada `docker image prune` harian dan `ops/scripts/registry-gc.py`
mingguan. Registry turun ke 3,4 GB; semua tag yang tersisa diverifikasi lewat
API dan satu rilis lama berhasil ditarik dengan `docker pull`.

### D4. Kolom `embedding` di `kajian_transcript` dibuang

Kolom `vector(256)` berisi hash embedding (`kajian-local-hash-v1`) yang sudah
dicabut dari ranking pada 8 Sep karena noise, tetapi kolom, index, dan cron
mingguan pengisinya masih ada. Dibuang total pada 30 Sep: field di model, flag
`-backfill-embeddings`, lib dan cmd backfill kajian, script serta cron
root-nya. `content_embeddings` (semantic search konten lain) tidak disentuh.

**Pencarian "Makna" tidak bergantung pada vektor.**
`transcriptCandidatesPostgres` memakai FTS stemmer `indonesian` (`text_tsv`)
dengan ekspansi varian ejaan, kecocokan judul/topik, dan trigram fuzzy untuk
salah ketik; kolom `embedding` tidak ada di SELECT maupun ORDER BY. Dibuktikan
dengan 30 set hasil produksi (10 query x mode exact/semantic/hybrid): identik
sebelum dan sesudah `DROP COLUMN` + `VACUUM FULL`, dan `total`,
`kajian_count`, serta `expanded_terms` sama dengan sebelum perubahan apa pun.
Contoh: `salat` menemukan kajian berjudul "Sholat/Shalat", dan `ribaa` (salah
ketik) 0 hasil di Exact tetapi 20 hasil yang memang membahas riba di Makna.

**Efek samping baik.** `GET /kajian/:id/transcripts` ikut mengirim array 256
float di setiap baris. Untuk kajian 116 chunk, respons turun dari 282 KB ke
63 KB (gzip 44,5 KB ke 11 KB).

**Hasil di database.** `kajian_transcript` 1.240 MB jadi 552 MB (heap 559 ke
350 MB, TOAST 273 ke 4,7 MB, index 401 ke 198 MB). Penyusutannya lebih besar
dari 288 MB vektor karena `VACUUM FULL` juga membuang bloat dari upsert seeder.
Tabel terkunci selama 52 detik.

Urutan rollout: cabut cron, deploy kode (kolom masih ada), verifikasi,
`DROP COLUMN`, `VACUUM FULL`. `AutoMigrate` tidak pernah menghapus kolom, jadi
database lain (mis. lokal) tetap memilikinya; itu tidak berbahaya, dan
`ALTER TABLE kajian_transcript DROP COLUMN IF EXISTS embedding` cukup untuk
merapikannya.

### D5. Rate limiter menghitung semua pengguna sebagai satu IP

Gejala: agent stress test kena 429 terus, bahkan setelah berpindah dari laptop
ke VPS.

**Akar masalah.** Fiber dibuat tanpa `ProxyHeader`. Semua lalu lintas tunnel
masuk lewat cloudflared ke `127.0.0.1:29900`, lalu diteruskan `docker-proxy`,
sehingga container hanya melihat satu alamat: gateway jaringan Docker
(`172.21.0.1`). Panggilan yang diproksikan aplikasi web datang dari container
web (`172.21.0.5`). Jadi `c.IP()` sama untuk semua klien, dan tiap limiter
punya satu bucket untuk seluruh pengguna:

- Limiter auth (`RATE_LIMIT_AUTH=10` per menit): register, login, refresh
  token, lupa/reset password, verifikasi, dan login Google. Sepuluh percobaan
  per menit untuk seluruh basis pengguna.
- Limiter global (180 per menit) dan search (60 per menit) dibagi semua
  pengguna anonim.
- Kolom `page_view.ip_hash` tidak berguna: 8.116 dari 8.194 baris (99%) berisi
  satu nilai, hash gateway. Hitungan pengunjung unik tidak terpengaruh karena
  klien selalu mengirim `visitor_id`.

Kenapa tidak terlihat: `MetricsMiddleware` terpasang setelah limiter global,
jadi 429 tidak pernah masuk `api_requests_total`.

**Perbaikan** (`app/http/client_ip.go`, `main.go`, `routes.go`): baca
`CF-Connecting-IP`, hanya dari peer privat atau loopback (`TRUSTED_PROXIES`
untuk menimpa), dengan `EnableIPValidation` supaya pemanggil tanpa header jatuh
ke IP peer. Tanpa validasi `c.IP()` mengembalikan isi header apa adanya, yaitu
string kosong, dan semua pemanggil tanpa header berbagi satu kunci kosong. Port
API terikat ke `127.0.0.1`, jadi header tidak bisa dipalsukan dari luar. Proxy
Next.js sudah menyalin semua header masuk, sehingga pengguna web ikut
terbedakan tanpa perubahan di sisi web. `MetricsMiddleware` dipindah ke depan
limiter.

**Bukti di produksi (30 Sep).**

- Jalur lokal VPS dengan header palsu dari peer tepercaya: klien A 180 sukses
  lalu 429; klien B, pemanggil tanpa header, dan header sampah tetap 200. Di
  `/auth/refresh` tiap klien mendapat 10 percobaan sendiri-sendiri.
- Lewat Cloudflare: laptop (`103.95.160.130`) burst 260 request, 180 sukses
  lalu 429 dan terus 429 selama lebih dari 40 detik, sementara VPS
  (`43.156.65.196`) lewat URL publik yang sama tetap 200. Hasilnya sama lewat
  proxy web.
- Satu percobaan awal menyimpang (request sesudah burst lolos) dan tidak muncul
  pada dua pengulangan terkontrol.
- `api_requests_total{status="429"}` kini tercatat.

**Efek samping privasi yang ikut kuperbaiki.** Setelah IP asli terbaca,
`page_view.ip_hash` mulai berisi hash alamat tiap pengunjung, dan hash SHA-256
tanpa kunci atas alamat IPv4 bisa dibalik dengan brute force. Kini hash memakai
HMAC-SHA256 dengan kunci dari `IP_HASH_SECRET`, atau diturunkan dari
`ACCESS_SECRET` bila tidak diset (`hashIP` di `page_view_service.go`). Selama
jendela paparan (12:49 sampai 16:11 UTC, 30 Sep) 37 baris dengan 4 hash unik
tersimpan; kolom `ip_hash` mereka dikosongkan. Kolom itu tidak dibaca query
mana pun dan tidak ada `visitor_id` yang bergantung padanya.

**Load test.** Satu IP tetap dibatasi 180 per menit (auth 10 per menit). Untuk
mensimulasikan banyak klien dari VPS, kirim `CF-Connecting-IP` berbeda per
klien ke `http://127.0.0.1:29900` (peer lokal tepercaya). Dari luar header itu
tidak berpengaruh karena Cloudflare menimpanya.

**Sisa risiko.** Pengunjung di balik NAT bersama (mis. CGNAT operator seluler)
tetap berbagi bucket, sifat bawaan limit per IP.

**Panggilan SSR.** Render server Next.js memanggil API dari container web tanpa
IP pengunjung, sehingga semuanya berbagi satu bucket. Crawler yang menelusuri
ribuan halaman belum ter-cache bisa menghabiskan bucket publik, dan 429 membuat
halaman dirender kosong lalu tertahan di cache ISR hingga sehari (web belum
pernah mencatat 429, jadi ini pencegahan). Kini peer tepercaya tanpa
`CF-Connecting-IP` dihitung di bucket internal terpisah (`RATE_LIMIT_INTERNAL`,
default 3000 per menit, `app/http/global_limiters.go`); peer yang tidak tepercaya
tidak pernah mendapat tingkat ini. Di produksi: 400 request tanpa header semuanya
200, sedangkan klien nyata tetap 180 lalu 429.

### D6. `/metrics` mengembalikan error karena label `method` beralias buffer request

Ditemukan saat memverifikasi D5. `MetricsMiddleware` memakai `c.Method()` sebagai
label. Fiber mengembalikan string yang menunjuk ke buffer request fasthttp yang
dipakai ulang, dan Prometheus menyimpan string label itu. Di koneksi keep-alive,
POST lalu GET mengubah "POST" yang tersimpan menjadi "GETT", dan seri ganda
membuat seluruh eksposisi gagal: halaman error alih-alih metrik. Kode ini
berasal dari perbaikan A1 di dokumen ini, jadi `/metrics` bisa rusak sewaktu-waktu
sejak itu. Kini method dipetakan ke konstanta (yang tidak dikenal menjadi
`OTHER`, sekaligus membatasi kardinalitas), dan tes regresi memutar ulang
POST/GET di satu koneksi (gagal dengan kode lama). Pemindaian tempat lain yang
menyimpan string request (goroutine, kunci cache) tidak menemukan kasus serupa.

### D7. Seeder kajian: id chunk berganti dan upsert menulis ulang semua baris

- Dua puluh video ada di dua file channel (`cintasunnahtv.json` dan
  `rodjatv.json`) dengan batas chunk sedikit berbeda. Tiap entri menghapus chunk
  lawannya lalu menyisipkan miliknya, jadi setiap re-seed ±2.000 chunk itu
  mendapat id baru. `kajian_user_bookmark.chunk_id` menunjuk id chunk; produksi
  belum punya bookmark (0 baris) sehingga belum ada korban, tetapi bookmark pada
  video-video ini akan yatim di re-seed berikutnya. Kini hanya entri terakhir per
  `video_id` yang di-seed, sama dengan isi database saat ini, jadi tidak ada
  churn tambahan.
- Re-seed hanya terjadi bila sidik direktori berubah (mtime terbaru, ukuran
  total, jumlah file), yaitu setelah scrape baru atau deploy dari checkout dengan
  mtime baru. Deploy dari worktree yang selalu segar memicunya di setiap deploy.
- Upsert kini hanya menyentuh baris yang isinya berbeda (`ON CONFLICT ... DO
UPDATE ... WHERE`). Sebelumnya ±294 rb baris ditulis ulang di tiap re-seed
  walau tidak berubah (dead tuple dan WAL). Diverifikasi di Postgres 17: `xmin`
  baris yang tidak berubah tetap, dan setelah satu chunk diedit tepat satu baris
  yang berubah.
  Di produksi: reseed penuh atas 7.346 video (state seed diperbarui 16:09 UTC)
  tidak menambah `n_tup_ins`, `n_tup_upd`, maupun `n_tup_del`. Sebelumnya counter
  update tabel ini 1,62 juta untuk 220 ribu baris, sekitar enam kali tulis
  ulang penuh.

### D8. Tombstone yatim dan endpoint transkrip yang membocorkan soft-delete

- 74.736 baris `kajian_transcript` berstatus soft-delete sejak 9 Sep. Semuanya
  yatim (kajian induknya sudah tidak ada), tanpa foreign key, dan tanpa bookmark
  yang menunjuknya. Dihapus permanen (salinan CSV terkompresi 12,7 MB di
  `/works/me/backups/kajian_transcript-orphan-tombstones-20260930.csv.gz`), lalu
  `VACUUM FULL` selama 37 detik. Tabel 552 MB jadi 413 MB (1.240 MB semula),
  219.931 baris hidup.
- `GET /kajian/:id/transcripts` melewati filter soft-delete (`Table().Scan()`) dan
  menarik semua chunk yang berbagi video id, sehingga tombstone ikut tersaji:
  kajian 58 chunk tampil 116. Kini difilter `deleted_at IS NULL` dengan tes
  regresi, dan urutan `start_seconds` yang sama dipecah dengan `id`.
- Masih ada `.Table("...").Count` (ayah, book, chapter, hadith, theme, surah, juz)
  yang ikut menghitung baris soft-delete. Hanya statistik, dampaknya kecil.

### D9. Tes regresi soft delete, dan bug yang ditemukannya

B0 sudah di-fix tetapi tidak ada tes yang menegaskan baris `deleted_at IS NOT
NULL` tidak muncul. Kini ada 185 tes perilaku di
`app/repository/softdelete/{quran,collections,rijal,reference,userdata}` yang
mencakup sekitar 45 repository. Tiap tes menanam baris hidup di samping kembar
soft-delete-nya (plus induk dan asosiasi soft-delete di tempat SQL melakukan
join), dan tiap filter dicabut satu per satu untuk memastikan ada tes yang
gagal. Helper DB bersama ada di `softdelete/testdb`.

Tes ini menemukan bug nyata, sebagian sama sekali bukan soal soft delete:

| Temuan                                                                   | Dampak di produksi                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `perawi` `FindHadiths` memakai `hadiths`/`sanads`/`mata_sanads`          | Daftar hadis per perawi kosong untuk semua perawi (perawi 9 kini 5 hadis) |
| Leaderboard mushahhih memakai `content_reports`                          | `GET /leaderboard/mushahhih` menjawab 500                                 |
| `content_report_service` memakai `doas`, `dzikirs`, `translations`, dst. | "Terapkan koreksi" tidak pernah jalan; doa/dzikir membuang errornya       |
| `library_book_progress` menaruh `AND ... LIMIT 1` setelah `ORDER BY`     | Sintaks error: progres baca per buku dan `Upsert` selalu gagal            |
| `amalan` `FindHistory` memindai NULL ke field non-nullable               | Gagal total bila satu item amalan di-soft-delete                          |
| Daftar hadis dan blog ter-paginate mem-preload dari query `Unscoped`     | Audio, author, kategori, tag, terjemahan yang dihapus ikut tampil         |
| `Count()` ayah, surah, hadith, book, chapter, juz, theme                 | Total ikut menghitung baris soft-delete                                   |
| `perawi` `FindByID`/`FindGuru`/`FindMurid` tanpa filter                  | Perawi soft-delete tetap tampil, `Update`/`Delete` lolos lewat jalur itu  |
| `sholat_guide` tanpa filter `deleted_at`                                 | Panduan sholat yang dihapus tetap tampil                                  |
| Query slug kategori/tag blog menyebut `blog_categories`/`blog_tags`      | Error di skema singular                                                   |

Pemindaian sistematis nama tabel di SQL mentah terhadap skema produksi (109
tabel) tidak menemukan referensi plural lain. Akar yang sama di beberapa
tempat: fixture tes membuka SQLite dengan penamaan plural bawaan GORM, sedangkan
produksi `SingularTable: true`, sehingga kode yang salah tampak benar di tes.
Tes lifecycle laporan konten kini memakai penamaan yang sama dengan produksi.

### D10. Bookmark dan catatan kajian tidak pernah bisa disimpan

Model `KajianUserBookmark` dan `KajianUserNote` mendeklarasikan `CreatedAt`
sendiri sebagai `*int64` dengan `autoCreateTime`. GORM tidak bisa mengisi integer
pointer dari `time.Now`, sehingga insert gagal dengan "failed to set value ... to
field CreatedAt" sebelum menyentuh database. Produksi memang 0 baris di kedua
tabel. Kini cap waktu unix diisi eksplisit. Masalah kedua yang tersembunyi di
baliknya: menambahkan lagi bookmark yang pernah dihapus diam-diam tidak berbuat
apa-apa, karena penghapusan adalah soft delete, indeks unik `(user_id,
chunk_id)` tidak parsial, dan `Add` memakai `DO NOTHING`. Bookmark yang dihapus
kini dihidupkan kembali, sedangkan yang masih hidup tetap dilaporkan sudah ada.
Dites di SQLite dan Postgres 17 (`USER_CONTENT_PG_DSN`); belum diuji end-to-end
lewat HTTP karena butuh akun.

### D11. SSH VPS terbuka dan dibanjiri, deploy gagal secara acak

Deploy sempat gagal dua kali dengan pesan "cannot reach sumopod over SSH — the
BBG office network blocks it". Pesan itu menyesatkan: penyebabnya sshd di VPS
menjatuhkan koneksi sah secara acak (`MaxStartups 10:30:100`) karena dibanjiri
koneksi dari internet. Diukur 1 Okt: 62 kali throttling dalam sejam terakhir,
dan puluhan ribu percobaan login per hari dari beberapa IP (satu IP saja 11.769
kali dalam 24 jam). `sshd -T` di VPS menunjukkan: port 22 dan 2222 terbuka ke
seluruh internet (ufw mengizinkan keduanya), `PermitRootLogin yes`,
`PasswordAuthentication yes`, `LoginGraceTime 120`, dan tidak ada fail2ban.

Workaround deploy (tanpa menyentuh server): satu koneksi SSH dipakai semua
langkah lewat multiplexing, dengan pembungkus `ssh` sementara di `PATH` yang
menambahkan `-o ControlMaster=auto -o ControlPath=/tmp/deploy-ssh-%C -o
ControlPersist=300`, setelah master dibuka dengan retry.

Selesai diterapkan (2026-10-01): `PasswordAuthentication no`, `PermitRootLogin prohibit-password`,
`LoginGraceTime 20`, `MaxStartups 30:60:150`, port 22 ditutup di UFW (hanya 2222), dan fail2ban
aktif untuk jail sshd (banned puluhan IP penyerang).

### D12. Status Penyelesaian Kasus Tepi & Pengujian Postgres (2026-10-01)

Semua poin yang belum dikerjakan di D12 telah selesai diimplementasikan dan diverifikasi:

1. **`search_repository_test.go`**: Berhasil dieksekusi di atas Postgres 17 (container `pg-probe`).
   Fixture test diselaraskan dengan skema singular, signature `SearchHadith` diperbarui, dan field
   wajib model diisi. 12/12 test lulus.
2. **Pengujian Leaderboard Cast `::`**: Dibuat suite `leaderboard_pg_test.go` ber-tag postgres untuk
   menguji `TopStreak`, `MyStreakRank`, `TopHafalan`, `TopMushahhih`, `MyHafalanRank`, dan
   `MyMushahhihRank` terhadap Postgres nyata. 6/6 test lulus.
3. **Kasus Tepi Soft Delete (Mutation-Proof)**:
   - `asbabun_nuzul.FindByAyahID`: join ke `ayah` dengan `deleted_at IS NULL` (ayat terhapus return kosong).
   - `sanad.FindMataSanadByID` & `FindByHadithID`: join induk sanad dan hadith dengan `deleted_at IS NULL`.
   - `theme.FindByBookSlug`: pakai `InnerJoins("Theme")` sehingga tautan ke tema terhapus tidak bocor.
   - `blog.FindAllPosts`: filter categoryID/tagID kini memeriksa `deleted_at IS NULL` dari kategori/tag.
   - `achievement.GetPoints`: pakai `clause.OnConflict` `DO UPDATE` untuk menghidupkan kembali user_points
     tanpa error UNIQUE constraint.
