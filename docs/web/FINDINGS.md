# Register Temuan — Audit Thollabul 'Ilmi

Daftar hidup semua temuan dari audit yang dimulai 28 Agustus 2026.
Analisis lengkap tiap item ada di [UI_MATURITY_AUDIT_2026-08-28.md](UI_MATURITY_AUDIT_2026-08-28.md).

**Perbarui tabel ini setiap kali ada temuan baru atau status berubah.**

## Arti status

| Status | Arti |
|---|---|
| ✅ Selesai | Sudah diperbaiki dan diverifikasi |
| 📋 Terbuka | Sudah dikonfirmasi, belum dikerjakan |
| ⏸️ Menunggu | Butuh keputusan produk/ops sebelum bisa jalan |
| ❌ Dicabut | Ternyata bukan bug — artefak metodologi audit |

## Ringkasan

| Status | Jumlah |
|---|---|
| ✅ Selesai | 45 |
| 📋 Terbuka | 3 |
| ⏸️ Menunggu | 0 |
| ❌ Dicabut | 10 |
| **Total** | **58** |

Catatan: 7 dari 45 temuan ternyata **bukan bug** — semuanya berasal dari cara
audit dilakukan (G1: crawler memotret sebelum data datang), bukan dari aplikasi.

---

## A. Crash & endpoint mati

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| A1 | `/komunitas` + `/dashboard/komunitas` crash — objek author dirender sebagai React child (React #31) | web | ✅ Selesai | `getAuthorName()` mengikuti pola `blog/page.js` |
| A2 | `/khatam` crash — `progress` null tanpa guard saat auth bootstrap | web | ✅ Selesai | Guard `loading \|\| (isAuthenticated && !progress)` |
| A3 | `/leaderboard/hafalan` HTTP 500 — `JOIN users` (tabel `user`) + `users.id` text vs `user_id` uuid | api | ✅ Selesai | `JOIN "user" … ::text` |
| A4 | `/leaderboard/streak` HTTP 500 — `FROM user_activities` (tabel `user_activity`) | api | ✅ Selesai | idem |
| A5 | `/wirid/occasion/*` HTTP 500 — `dzikirs.occasion` (tabel `dzikir`) | api | ✅ Selesai | Awalnya salah didiagnosis sebagai drift skema |
| A6 | `/forum/questions` HTTP 500 — `Preload` pada field bertag `gorm:"-"` | api | ✅ Selesai | Author dihidrasi lewat query terpisah |
| A7 | `/fiqh/{slug}/{id}` selalu "Not found" — `fiqh_categories`/`fiqh_items` (tabel singular) | api | ✅ Selesai | Tersamar karena controller memetakan semua error jadi 404 |
| A8 | Analitik page-view — `JOIN users` ×2 dengan masalah tipe yang sama | api | ✅ Selesai | — |
| A9 | `/zakat/history` crash di mobile | web | ❌ Dicabut | Tidak bisa direproduksi; artefak crawler |

## B. Fitur tidak berfungsi

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| B1 | `/dashboard/quiz` tidak menampilkan opsi jawaban — `options` string JSON, `correct_answer` teks bukan indeks | web | ✅ Selesai | Penilaian juga rusak (`NaN`), jawaban benar selalu dihitung salah |
| B2 | `/dashboard/fiqh` merender kategori sebagai materi | web+api | ✅ Selesai | Endpoint `/fiqh/items` dibuka; chip kategori diturunkan dari data |
| B3 | Admin terlempar ke landing saat `/auth/me` gagal sesaat | web | ✅ Selesai | Guard menyamakan "belum termuat" dengan "bukan admin" |
| B4 | Hapus pesan chat tanpa cek kepemilikan — **setiap user bisa hapus pesan siapa pun** | api | ✅ Selesai | Kepemilikan didorong ke query; ada test |
| B5 | `/dashboard/hadith`, `/dashboard/perawi`, `/dashboard/manasik` kosong | web | ❌ Dicabut | Race 600 ms di crawler, bukan bug |
| B6 | 6 route admin render landing page di mobile | web | ❌ Dicabut | Gejala dari B3, bukan masalah viewport |
| B7 | `/admin/users` nyangkut di "Memuat…" | web | ❌ Dicabut | Race crawler; sudah tampil normal |

## C. Data & konten

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| C1 | `/kamus` — 40 kata Arab hardcoded di komponen halaman, terpisah dari kamus backend | web+api | ✅ Selesai | Dipindah ke `islamic_term`; +kolom `arabic/latin/root`, kategori `kosakata` |
| C2 | Guard seeder `count > 0` membekukan DB terdeploy — entri baru di file tidak pernah masuk | api | ✅ Selesai | Jadi `count >= len(rows)`, idempoten |
| C3 | `data/static` tidak masuk image Docker + runtime tanpa `WORKDIR` → **23 seeder file diam-diam mati** | infra | ✅ Selesai | Termasuk membuat `data/locations.json` tak terbaca |
| C10 | Compose mem-bind `./data:/app/data:ro`, jadi seed di image **tertimpa** salinan host yang basi | ops | ✅ Selesai | Ketahuan saat deploy: kamus tetap 28 padahal image berisi 66. `DEPLOY_SYNC_PATHS` kini menyalin `data/static` sebelum migrasi |
| C4 | Chip kategori fiqh hardcoded dan melenceng (`umum` tidak ada; `nikah`/`jenazah` hilang) | web | ✅ Selesai | Diturunkan dari data |
| C5 | `/fiqh` publik menampilkan "0 topik" untuk semua kategori sebelum dibuka | web | ✅ Selesai | Materi di-preload; ikut memperbaiki C8 |
| C6 | Seeder istilah duplikat — 28 entri hardcoded di `seeder_tier3.go` sama persis dengan JSON | api | ✅ Selesai | `seedIslamicTerms` dihapus; JSON (66 entri) jadi satu-satunya sumber |
| C7 | Materi fiqh "belum di-seed / 0 topik" | api | ❌ Dicabut | Ada 27 materi; yang salah tampilannya (C5) |
| C8 | Search di `/fiqh` publik tidak menemukan apa pun di kategori yang belum dibuka | web | ✅ Selesai | Bug laten, ketahuan saat memperbaiki C5 |
| C9 | `/fiqh/items` tidak menyertakan `translation` → `/dashboard/fiqh` kehilangan localization EN | api | ✅ Selesai | Regresi dari perbaikan B2; mapper controller yang membuangnya |

## D. UI & responsif

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| D1 | Panel admin tak terpakai di mobile — sidebar fixed 240px tanpa breakpoint | web | ✅ Selesai | Jadi off-canvas drawer di bawah `md` |
| D2 | 16 tabel admin tanpa kontainer scroll horizontal | web | ✅ Selesai | Kemudian diabstraksi jadi `DataPanel` oleh refactor lain |
| D3 | Tombol & aksen biru di forum/feed padahal aplikasi serba emerald | web | ✅ Selesai | Biru di `dashboard/hadith/[slug]` sengaja dibiarkan (aksen informasi) |
| D4 | Toast "Aktifkan lokasi & notifikasi" muncul di semua route, tak pernah hilang | web | ❌ Dicabut | Dismiss berfungsi, TTL 24 jam; crawler tak pernah klik |
| D5 | Tab strip `/dashboard/panduan-sholat` terpotong di mobile | web | ✅ Selesai | Fade tepi kanan (`.scroll-x-fade`). `no-scrollbar` ternyata class mati — tak pernah didefinisikan |
| D6 | Label bottom nav terpotong ("Pusat Bela…") | web | ✅ Selesai | Label pendek khusus bottom nav (`link.belajar_short`); grid 5 kolom ternyata sudah benar |
| D7 | Route detail blank tanpa pesan: `/hadith/theme/[slug]`, `/siroh/[id]`, `/dashboard/siroh/[slug]` | web | ✅ Selesai | Siroh: 404 tetap parse JSON jadi `.catch` tak pernah jalan. Hadith theme: tidak ada empty state |
| D8 | Copy error menyesatkan — 4xx/429 dilaporkan sebagai "server tidak dapat dijangkau" | web | ✅ Selesai | 8 string di 2 bahasa; berhenti menyuruh pengunjung menyalakan backend |
| D9 | 404 di `/dashboard/hadith/[slug]/[number]` menggantikan seluruh shell dashboard | web | ✅ Selesai | Tambah `app/dashboard/not-found.js`. **Verifikasi visual tertunda** — password admin berubah di tengah sesi |
| D10 | 9 pasang route publik/dashboard byte-identik | web | ❌ Dicabut | Kesembilan route publik **sudah** stub `redirect()` ke versi dashboard — screenshot identik justru bukti redirect bekerja, bukan duplikasi kode |

## E. Performa

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| E1 | `/admin/asbabun-nuzul` render 11.675px — 216 entri tanpa paginasi | web | ✅ Selesai | `PanelPagination` (25/halaman) → 1.632px; search tetap menjangkau seluruh data |
| E2 | `/quran` & `/dashboard/quran` 114 surah tanpa virtualisasi | web | 📋 Terbuka | Mobile sampai 10.952px |
| E3 | 22 statement `CREATE INDEX` dianggap gagal semua | api | ❌ Dicabut | Salah diagnosis saya; nama tabel sudah benar |

## F. Keamanan

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| F1 | Kredensial admin produksi ter-commit di `capture-all-routes-vps.mjs` | infra | ✅ Selesai | Dipindah ke env var |
| F2 | Password admin produksi `Admin@123` masih aktif & ada di histori git | ops | ✅ Selesai | Diganti di luar sesi ini — login lama kini 401 di prod maupun API langsung |
| F3 | `GET /api/v1/blog/posts` membocorkan email admin lewat objek `author` | api | ✅ Selesai | Hook `AfterFind` di `BlogPost` + `ToPublic()`; ada test |
| F4 | `/forum/questions` ikut membocorkan email lewat author yang saya hidrasi (A6) | api | ✅ Selesai | Regresi dari perbaikan sendiri, ketahuan saat menggarap F3 |
| F5 | `User.ToPublic()` dead code yang justru menyertakan email | api | ✅ Selesai | Dijadikan sanitizer resmi |

## G. Perkakas & proses

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| G1 | Crawler screenshot memotret 600 ms setelah `domcontentloaded` → banyak false positive | tooling | ✅ Selesai | Jadi `networkidle`; sumber A9/B5/B6/B7/D4 |
| G2 | Test repository membuka GORM tanpa naming strategy aplikasi — menguji skema yang tak pernah ada | api | ✅ Selesai | Helper dzikir/fiqh disamakan; ini yang membongkar A7 |
| G3 | AutoMigrate tidak jalan saat aplikasi start untuk Postgres — skema prod bisa drift diam-diam | ops | ✅ Selesai | `DEPLOY_MIGRATE_CMD` di `deploy.sh`, jalan sebelum restart; gagal migrasi = rollout batal |
| G4 | Helper test lain (`bookmark`, `library_book`, `audio`, `delete_result`) masih tanpa `SingularTable` | api | ✅ Selesai | Semua helper test kini seragam dengan konfigurasi aplikasi |
| G5 | ESLint rusak — `@typescript-eslint` gagal load | tooling | ✅ Selesai | `typescript@7.0.2` masuk lewat `--legacy-peer-deps` padahal peer-nya `<6.1.0`; dipin ke `^5.9.3` |
| G8 | 155 masalah lint pre-existing (140 error) baru terlihat setelah G5 beres | web | 📋 Terbuka | Mayoritas `react-hooks/set-state-in-effect`; perlu garapan tersendiri |
| G6 | Docker lokal `No space left on device` padahal host 64G kosong | env | 📋 Terbuka | Docker Desktop jalan di VM berdisk terbatas; build cache sempat 42GB |
| G7 | Proxy `/api/v1/[...path]` mengirim `duplex: "half"` untuk semua non-GET → undici `expected non-null body source` | web | ✅ Selesai | Mematikan **semua POST/PUT/DELETE di dev**. Produksi lolos, tapi jalur yang sama rapuh untuk request tanpa body |

## H. Infrastruktur VPS

| ID | Temuan | Area | Status | Catatan |
|---|---|---|---|---|
| H1 | Stack `affiliate-radar` (10 container) masih jalan dan memakan disk | ops | ✅ Selesai | `compose down` — container & image dihapus, **6 volume termasuk `postgres_data` sengaja dipertahankan** |
| H2 | Versi Postgres/Redis terlihat beragam di `docker images` | ops | ❌ Dicabut | Ketiga project sudah sama (`pgvector:pg17` + `redis:8-alpine`). Yang terlihat itu image sisa, bukan drift konfigurasi |
| H3 | Image sisa tak terpakai: `pgvector:pg16`, `postgres:16/18-alpine`, `redis:7-alpine`, `vault`, `caddy`, `tei` | ops | ✅ Selesai | Dihapus setelah dipastikan 0 container memakainya |
| H4 | Image web membawa libvips glibc yang tak mungkin jalan di runtime musl | infra | ✅ Selesai | thollabul 385→358MB, eduplay 369→344MB |
| H5 | Disk VPS 58% terpakai | ops | ✅ Selesai | Turun ke 46% (22G → 18G) |
| H6 | `wedding-fe` tidak punya `@img` sama sekali (Next 14) | infra | ❌ Dicabut | Perubahan di-revert karena no-op |
