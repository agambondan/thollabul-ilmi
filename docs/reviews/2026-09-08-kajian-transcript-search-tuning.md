# Tuning Pencarian Transkrip Kajian

Tanggal: `2026-09-08`
Scope: `GET /api/v1/kajian/search` (Go), tab **Cari di Transkrip** di web
(`apps/web/src/app/kajian/`) dan mobile (`WebAppKajianRoute.js`)
Status: `DIPERBAIKI & DEPLOYED` — backend + web + mobile diubah, tes lulus.
Versi pertama ikut terbawa deploy sesi lain (2026-09-09 01:25 WIB) dan
memicu insiden hasil kosong di production; akar masalahnya (insert
transkrip gagal sejak kolom `embedding` ada) diperbaiki dan API di-deploy
ulang 2026-09-09 ±10:30 WIB. Production pulih: 79.777 chunk dari 3.013
kajian, semua mode mengembalikan hasil — lihat
[Insiden production](#insiden-production-2026-09-09)

Dipicu pertanyaan user: kenapa hasil "Cari di Transkrip" maksimal 20, dan
kenapa tiga mode pencarian (Hybrid / Teks Persis / Makna) hasilnya sama
semua.

---

## Ringkasan Jawaban

| Pertanyaan                 | Jawaban singkat                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kenapa maksimal 20?        | Web dan mobile hard-code `page=1&limit=20` dan tidak punya tombol muat lebih. Label "20 kajian ditemukan" pun salah: itu 20 _potongan_ (sering 10 dari video yang sama), bukan 20 kajian. API sebenarnya sudah mendukung `page`.                                                                                                                |
| Kenapa Exact = Makna?      | Di kode lama kedua mode lewat cabang yang **sama persis**: regex kata utuh di `text OR title OR topic`. Exact = seluruh frasa, Makna = tiap kata di-AND. Untuk query satu kata hasilnya identik byte-per-byte. Vektor embedding sama sekali tidak dipakai di mode Makna, dan `total` yang dilaporkan cuma `len(results)` (selalu 20 kalau ≥20). |
| Kenapa urutannya aneh?     | `ORDER BY kajian_id ASC, start_seconds ASC` — tidak ada relevansi. Halaman pertama selalu video dengan id terkecil. Kecocokan di **judul** membuat _semua_ chunk video itu ikut jadi hasil, sehingga satu video membanjiri 20 slot.                                                                                                             |
| Hybrid-nya beneran vektor? | Secara praktik tidak. Seeder menghapus dan membuat ulang semua baris transkrip tiap deploy tanpa mengisi `embedding`; backfill hanya lewat flag CLI manual. Dan setelah diuji, embedding hash lokal itu memang **noise** untuk query pendek (lihat bawah).                                                                                      |

---

## Temuan Detail (kode lama)

1. **Tiga mode, satu jalur.** `kajian_repository.go` cabang
   `mode == "exact" || mode == "semantic"` → regex `\mkata\M` yang sama.
   Diverifikasi di production: `riba`, `sabar`, `tauhid` di mode exact dan
   semantic mengembalikan 20 id yang identik dengan urutan identik.
2. **`total` bohong.** Mode exact/semantic melaporkan `total = len(results)`
   → selalu `20` kalau hasilnya ≥ 20. Hybrid melaporkan ukuran set fusi (70,
   139, …) tapi client tidak pernah minta halaman 2.
3. **Tanpa ranking.** Urutan `kajian_id, start_seconds`; RRF di hybrid
   memakai rank dari urutan itu, jadi sisi leksikalnya tidak bermakna.
4. **Ejaan caption ≠ ejaan user.** Caption otomatis YouTube memakai ejaan
   KBBI. Hitungan di `data/static/kajian.json` (5.231 chunk):

    | Ketikan user | Frek. | Di caption | Frek. |
    | ------------ | ----- | ---------- | ----- |
    | sholat       | 0     | salat      | 836   |
    | hadits       | 4     | hadis      | 981   |
    | ustadz       | 12    | ustaz      | 1609  |
    | dzikir       | 0     | zikir      | 69    |
    | wudhu        | 0     | wudu       | 68    |
    | aqidah       | 1     | akidah     | 73    |
    | taubat       | 11    | tobat      | 114   |
    | sunnah       | 7     | sunah      | 353   |

    Akibatnya `sholat`, `wudhu`, `dzikir` di mode exact/semantic lama → **0
    hasil**.

5. **Embedding hash bukan sinyal semantik.** `LocalHashProvider` (FNV atas
   token + trigram, 256 dim). Tetangga cosine terdekat untuk `riba` adalah
   chunk tentang filsafat Yunani; untuk `sholat` chunk tentang tawakal;
   untuk `adab menuntut ilmu` chunk tentang Sultra/Sulbar. Skor top-1 ≈
   0,37–0,53 dan top-40 ≈ 0,28–0,40 — tidak ada pemisahan. Dengan bobot RRF
   0,6 noise ini justru menggeser hit FTS yang benar.
6. **Tombstone soft-delete ikut terbaca.** `KajianTranscript` punya
   `DeletedAt`; seeder memanggil `Delete()` tanpa `Unscoped()` sehingga tiap
   deploy menambah satu salinan tombstone per chunk, dan query search
   (`db.Table(...)`, tanpa scope model) tidak memfilter `deleted_at`.
   Dedupe di service menutupinya, tapi halaman 20 bisa menyusut jadi 2.
7. **Stopword tidak dibuang oleh Postgres.** Konfigurasi FTS `'indonesian'`
   meng-index `yang`, `dan`, `di`; stemmer Snowball-nya juga kadang salah
   (`menikah`→`meni`, `menuntut`→`untut`, `ribawi`→`ribaw`).

---

## Perbaikan

### Backend (`services/api`)

Paket baru `app/lib/textsearch`: normalisasi query, daftar stopword
Indonesia, **peta varian ejaan** (±75 grup: salat/shalat/sholat/solat,
hadis/hadits/hadith, ustaz/ustadz/ustad, riba/ribawi/rente, stres/stress/
cemas/gelisah/galau, …), builder `to_tsquery`, regex frasa, dan
pemotong cuplikan (`Excerpt`) yang memusatkan snippet di kata yang cocok.

`SearchTranscripts` sekarang menarik beberapa **daftar kandidat** dari SQL
lalu menggabungkan, mengurutkan, dan mem-paginate di Go
(`kajian_search_rank.go`, murni Go, ada unit test):

| Daftar | Sumber                                                                                                                                 | Bobot RRF |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Frasa  | `text ~* '\mkata1[\s-]+kata2\M'`, skor = jumlah kemunculan                                                                             | 1,0       |
| FTS    | `to_tsvector('indonesian', text) @@ to_tsquery(...)` dengan varian per konsep; diurutkan `matched_groups DESC, rarity DESC, rank`      | 1,0       |
| Judul  | `title/topic/description` cocok semua konsep → **satu** baris per video (chunk paling awal), digabung ke chunk terbaik video kalau ada | 0,5       |
| Fuzzy  | `pg_trgm` `query <% text` — hanya query satu kata dan hanya kalau kecocokan literal < 20 (typo: `ribaa`, `istikamah` vs `istiqomah`)   | 0,5       |

Arti tiga mode sekarang:

- **Teks Persis** — hanya daftar Frasa. `total` = `COUNT(*)` sungguhan
  (dibatasi 500 baris yang bisa di-paging).
- **Hybrid** — tier 1 frasa persis → tier 2 semua konsep cocok (kata dasar +
  varian) → tier 3 sisanya (sebagian konsep / judul / fuzzy). Dalam tier
  diurutkan skor RRF, lalu **didiversifikasi** maks. 3 potongan per kajian
  per ronde supaya halaman pertama tidak dibanjiri satu video.
- **Makna / Tema** — **satu kartu per kajian**, diurutkan skor topikal
  (jumlah skor potongan yang cocok + bonus judul/topik), menampilkan
  potongan terbaiknya dan `match_count` ("8 potongan cocok").

Respons baru: `match_reason` per hasil (`phrase | all_terms | some_terms |
fuzzy | title`), `match_count`, `matched_terms` (kata yang ditemukan fuzzy),
dan `meta.{mode, total, has_more, kajian_count, truncated, expanded_terms}`.
`match_mode` lama tetap dikirim untuk client lama.

Lain-lain: semua query memfilter `deleted_at IS NULL`; seeder memakai
`Unscoped()` (hard delete); kolom generated `text_tsv tsvector` (stored)
plus index `idx_kajian_transcript_text_tsv` supaya ranking tidak menghitung
ulang `to_tsvector` per baris, dengan fallback ekspresi + index
`idx_kajian_transcript_text_fts` kalau kolomnya belum ada; index
`idx_trgm_kajian_transcript_text`; tie-break deterministik sampai `id`.
Daftar vektor **dicabut** dari ranking (kolom, HNSW index, dan
`-backfill-embeddings` dibiarkan; tidak lagi dipakai search).

### Web (`apps/web/src/app/kajian/`)

- Tombol **Muat lebih banyak** (`meta.has_more`), append + dedupe by id,
  reset saat query/mode/ustadz berubah, response load-more yang basi
  dibuang lewat request counter.
- Label "X dari Y potongan transkrip • N kajian" (mode Makna: "X dari Y
  kajian yang membahas tema ini"); `Y+` kalau `meta.truncated`.
- Badge alasan cocok (Frasa persis / Semua kata / Sebagian kata / Ejaan
  mirip / Judul-topik) menggantikan badge yang cuma mengulang nama mode.
- Highlight memakai `meta.expanded_terms` + `matched_terms` (jadi `salat`
  ikut disorot saat user mengetik `sholat`); bug regex `/g` + `.test()`
  yang melewatkan kecocokan berdampingan diperbaiki.
- Deskripsi mode diperjelas (id/en): "Frasa persis seperti diketik", "Per
  kajian: kata dasar, ejaan lain & topik", "Persis dulu, lalu makna".

### Mobile (`WebAppKajianRoute.js`)

Paritas dengan web: muat lebih, label jumlah, badge alasan, highlight
snippet (komponen `HighlightedText`), deskripsi mode ditampilkan, guard
query kosong (sebelumnya tetap memanggil API dengan `q=`).

---

## Verifikasi

Harness lokal: 5.230 chunk dari `kajian.json` di-seed ke Postgres compose
(port 54320), lalu `SearchTranscripts` dipanggil langsung. Sebelum vs
sesudah (limit 10, halaman 1):

| Query                | Mode     | Sebelum: hasil / total      | Sesudah: hasil / total / kajian                                         | ms  |
| -------------------- | -------- | --------------------------- | ----------------------------------------------------------------------- | --- |
| `riba`               | exact    | 10 / **10** (salah)         | 10 / 33 / 18                                                            | 18  |
| `riba`               | semantic | 10 / 10, identik exact      | 10 / 18 kajian (1 kartu/video)                                          | 15  |
| `riba`               | hybrid   | 10 / 69, 4 kajian di hal.1  | 10 / 34, frasa persis di atas                                           | 68  |
| `sholat`             | exact    | 0                           | 0 (memang tidak ada di caption)                                         | 2   |
| `sholat`             | hybrid   | 10 / 40 (noise vektor)      | 10 / 302 lewat varian `salat`                                           | 59  |
| `wudhu`              | semantic | 0                           | 10 / 19 kajian                                                          | 14  |
| `hadits`             | semantic | 10 / 10                     | 10 / 61 kajian                                                          | 110 |
| `hukum riba`         | hybrid   | 10 / 90 (`hukum` OR `riba`) | 10 / 300+, 3 hit kedua kata dulu, lalu `riba`-saja sebelum `hukum`-saja | 54  |
| `mengatasi stres`    | semantic | 0                           | 10 / 37 kajian                                                          | 12  |
| `ribaa` (typo)       | hybrid   | 0 di exact/semantic         | 10 / 36 lewat fuzzy, snippet di kata `riba`                             | 37  |
| `adab menuntut ilmu` | hybrid   | 10 / 90                     | 10 / 315, `menuntut ilmu` (2/3 konsep) dulu                             | 219 |

Setelah `kajian.json` membesar (scrape sesi lain: 3.028 video, 80.087
chunk di DB lokal), latensi hybrid/semantic 150–440 ms dan exact 5–50 ms
dengan kolom `text_tsv`; tanpa kolom itu 300–860 ms.

Tes: `go test ./...` di `services/api` hijau (termasuk unit test ranker dan
`textsearch`); tes integrasi Postgres opsional
`KAJIAN_SEARCH_PG_DSN=... go test ./app/repository/ -run TestKajianSearchPostgres`
lulus di DB lokal. Web: `eslint src/app/kajian/` bersih; file mobile lolos
`prettier --check`. Swagger **tidak** di-regenerate: `make swagger`
menghasilkan diff ±10 ribu baris karena `docs/` memang sudah lama basi
(bahkan belum memuat `/kajian/search`) — layak commit terpisah.

---

## Insiden production 2026-09-09

**Gejala.** Setelah deploy API oleh sesi lain (image dibuat 01:25 WIB, ikut
membawa working tree perubahan ini), semua mode pencarian mengembalikan
`items: []` dan `GET /kajian/:id/transcripts` kosong untuk semua video.

**Fakta di server** (`ssh sumopod-cf`, DB `thullabul_ilmi`, PG 17.11):
`kajian_transcript` berisi **0 baris** (termasuk yang soft-deleted), `kajian`
173 baris (165 hidup), `kajian.json` di server 166 video / 5.494 chunk,
ekstensi `vector 0.8.6` + `pg_trgm 1.6` ada, index baru sudah terbuat, dan
ada index unik `uq_kajian_transcript_chunk (kajian_id, start_seconds,
end_seconds)` yang dibuat manual di DB (tidak ada di repo).

**Akar masalah.** Field `Embedding pgvector.Vector` bernilai nol
diserialisasi GORM sebagai literal `'[]'`, dan Postgres menolaknya:
`ERROR: vector must have at least 1 dimension (SQLSTATE 22000)`
(direproduksi lokal dengan struct model lama). Jadi **sejak kolom
`embedding` ditambahkan, setiap INSERT transkrip oleh seeder gagal** — dan
errornya dibuang (`_ = db.Create(...)`). Production tetap "punya" transkrip
karena seeder lama hanya soft-delete dan search lama tidak memfilter
`deleted_at`, sehingga yang tampil selama ini adalah tombstone baris lama.
Perubahan ini (hard delete + filter `deleted_at`) membuat kegagalan itu
akhirnya terlihat: tabel benar-benar kosong. DB lokal juga sudah 0 chunk
sebelum harness diisi manual — gejala yang sama.

**Perbaikan.**

- `model.KajianTranscript.Embedding` diberi tag `default:null` sehingga
  GORM melewatkan kolom saat nilainya nol.
- Seeder (`seedKajianFromFile` dan `SeedKajianTranscriptsFromFile`) memakai
  `db.Omit("Embedding").Create(...)`, menghitung INSERT yang gagal, dan
  mencatat contoh errornya + jumlah baris tersimpan di log.
- Verifikasi lokal: struct model lama → error `vector must have at least 1
dimension`; model baru → sukses; `SeedStaticFromFiles` terhadap DB lokal
  menyimpan 80.087 chunk tanpa satu pun gagal.

**Pemulihan production (2026-09-09).** `make thollabul-api` gagal di
langkah sync `services/api/data/static` karena `kajian.json` (46 MB) sedang
ditulis ulang oleh scraper sesi lain (`tar: File shrank`), sehingga salinan
di server sempat korup; salinan valid `data/static/kajian.json` (yang
dibaca container) di-copy balik. Image yang sudah terkirim kemudian
di-migrate + restart tanpa sync (`DEPLOY_SYNC_PATHS=""`). Hasil: 79.777
chunk dari 3.013 kajian tersimpan, `/kajian/search` dan
`/kajian/:id/transcripts` normal lagi. Pelajaran: jangan deploy API saat
scraper masih menulis `kajian.json`.

---

## Catatan & Tindak Lanjut

- Deploy: `do_migrate` di `deploy.sh` menjalankan `-migrate` → seeder
  membuat ulang transkrip (kini hard-delete, embedding di-omit) dan
  `createCompositeIndexes` membuat kolom `text_tsv` + index baru. Tidak ada
  langkah manual.
- Index unik `uq_kajian_transcript_chunk` di production tidak ada di repo;
  kalau memang diinginkan, sebaiknya dipindah ke `createCompositeIndexes`.
- Mode Makna belum "semantik" dalam arti model bahasa; ia = kata dasar +
  varian ejaan + judul/topik + fuzzy, dikelompokkan per kajian. Kalau nanti
  mau semantik sungguhan, perlu model embedding multibahasa (mis. e5) —
  bukan hash lokal.
- Frasa yang terpotong di batas chunk 60 detik tidak akan ketemu di mode
  Teks Persis (bukan bug ranking).
- Kandidat berikutnya: filter ustadz `ILIKE '%nama%'` → equality; `mode`
  ikut di URL share; skeleton yang mengganti seluruh list saat ganti mode;
  daftar varian ejaan bisa ditambah dari kosakata yang sering dicari.
