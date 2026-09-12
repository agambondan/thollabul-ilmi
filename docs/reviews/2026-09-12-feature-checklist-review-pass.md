# Feature Checklist Review Pass — 2026-09-12

Sesi lanjutan `docs/reviews/2026-09-08-feature-route-inventory.md` §4. Tujuan:
kerjakan sebanyak mungkin dari 57 baris checklist yang belum pernah direview
("apakah fitur ini benar jalan", bukan cuma "apakah route-nya ada"). Mobile
(`apps/mobile`) di luar scope ronde ini — hanya web + API yang diverifikasi.

## Cakupan

Backend API live di `http://localhost:29900/api/v1` (docker container
`tholabul-ilmi-tholabul-ilmi-api-1`). Endpoint public dites lewat `curl`
langsung; endpoint JWT-gated cukup dikonfirmasi 401 (perilaku benar tanpa
token) lalu kodenya dibaca. Web dicek dengan membaca komponen halaman —
fokus pada shape response API vs cara komponen mengonsumsinya (unwrap
`items`, null-check, `Array.isArray`, dsb).

**Total baris yang tersentuh sesi ini: 31 dari 57** (di luar #24/#25 yang
sudah selesai sebelumnya). Rincian per baris ada di tabel §4 dokumen
inventaris (sudah di-update in-place).

## Bug ditemukan & diperbaiki (2)

1. **Hadith-Ayah cross-reference — backend 500 di semua request** (baris
   #9). `GET /hadiths/:id/ayahs` dan `GET /ayahs/:id/hadiths` selalu
   mengembalikan `{"status":500,"message":"Internal server error"}` untuk
   setiap id yang dicoba (hadith 1/2/3/10/50; ayah 1/6/50/100/255).
   Root cause: `services/api/app/model/hadith_ayah.go` — field
   `Hadith *Hadith` dan `Ayah *Ayah` ditag `gorm:"-"` (artinya field itu
   sepenuhnya diabaikan GORM, termasuk sebagai relasi), tapi
   `app/repository/hadith_ayah_repository.go` tetap memanggil
   `.Preload("Hadith")` / `.Preload("Ayah")` — preload ke field yang bukan
   relasi valid bikin GORM error, jadi 500 di setiap request.
   **Fix**: hapus tag `gorm:"-"` di kedua field (pola ini sama dengan
   `Hadith.Book`/`Ayah.Surah` yang sudah benar di model lain, tidak perlu
   tag khusus karena GORM auto-infer BelongsTo dari `HadithID`/`AyahID`).
   UI web (`AyahPage.js` panel "Hadis Terkait" dan `HadithPage.js`
   `HadithAyahPanel`) sudah benar sejak awal — cuma keblokir backend 500 ini.
   **Belum diverifikasi ulang secara live** — container API jalan sebagai
   binary hasil build produksi (bukan hot-reload), rebuild+restart di luar
   scope audit read-only sesi ini karena container dipakai bersama sesi lain
   yang sedang aktif. Perlu direstart lalu di-retest.

2. **Search "load more" pagination silently drops Ayah/Hadith results**
   (baris #55). `apps/web/src/app/search/SearchClient.js`, fungsi
   `mergeResults()` (dipanggil saat user klik "Muat Lainnya" di hasil
   pencarian) mengecek key `"ayah"` dan `"hadith"` (singular) untuk
   menggabungkan halaman baru dengan halaman sebelumnya. Response API asli
   (`GET /search?q=...`) memakai key **plural**: `ayahs`, `hadiths`,
   `dictionaries`, `doas`, `kajians`, `perawis` (dikonfirmasi langsung dari
   response live). Karena `next["ayah"]` selalu `undefined`, kondisi
   `if (next[key] && prev[key])` untuk dua kategori itu tidak pernah
   terpenuhi — jadi tiap "Muat Lainnya" di kategori Ayat/Hadis **mengganti**
   hasil sebelumnya alih-alih menambahkannya (4 kategori lain — Dictionary/
   Doa/Kajian/Perawi — sudah benar pakai key plural, cuma dua ini yang typo).
   Ketahuan karena file yang sama punya helper `getItems(data, key)` yang
   sudah defensif fallback ke `${key}s`, jadi jelas bentuk key asli itu
   plural. **Fix**: ganti `"ayah"`/`"hadith"` jadi `"ayahs"`/`"hadiths"` di
   array key `mergeResults()`.

## Temuan non-bug yang layak dicatat

- **Munasabah (#5)** — kode backend dan web sudah benar (`AyahPage.js`
  panel "Ayat Terkait", loading/error/empty state lengkap lewat
  `useAsyncResource`), tapi **datanya kosong total**. Dites 6 ayah id
  berbeda (1, 2, 6, 50, 100, 255, 500), semua balas `{"items":[]}`. Ini gap
  konten (belum pernah di-seed), bukan defect kode — perlu keputusan produk
  apakah munasabah mau diisi atau fiturnya di-deprioritaskan.
- **Khatam (#41)** — dikonfirmasi memang client-local by design: halaman
  `/khatam` menghitung progress dari `progressApi.getQuran()` (posisi
  bacaan tersimpan di backend) + `khatamHelper.js` (matematika ayat/juz
  murni di klien), dan cuma tanggal target yang disimpan — di
  `localStorage`, bukan lintas device. Tidak butuh tabel backend
  terpisah; `GoalType "khatam"` sudah ada di `/goals` buat yang mau
  tracking lebih formal. Bukan gap, cuma catatan UX minor (target tidak
  sinkron lintas device kalau user ganti perangkat).
- Beberapa list endpoint publik balas array/pagination kosong tapi dengan
  shape yang benar (Forum Q&A, Komunitas Chat, Feed) — ini konten belum
  di-seed, bukan bug kode. Response shape-nya sudah dicek konsisten dengan
  yang dikonsumsi web.

## Yang diverifikasi OK (tanpa temuan)

Al-Quran core, Tafsir, Hadith (list), Perawi, Doa, Dzikir, Wirid, Asmaul
Husna, Siroh, Sejarah/History, Tokoh Tarikh, Peta Islam/Locations, Fiqh
Ringkas, Kamus, Manasik, Lessons, Kajian (list), Blog, Library, Amalan
Harian, Leaderboard, Achievements, Panduan Sholat, Jadwal Sholat/Imsakiyah/
Hijri, Kiblat, Reminders, Bookmark (dashboard page), Notes (dashboard page,
sinkron lokal+API rapi), User Settings/sync. Detail per baris ada di tabel
inventaris.

## Sengaja dilewati sesi ini

- **Zakat (#48) & Faraidh (#49)** — sesuai arahan, dua fitur ini baru saja
  ditangani sesi lain hari ini, tidak diulang di sini.
- **Semua fitur mobile-only atau kolom Mobile** — di luar scope ronde ini
  per instruksi eksplisit; kolom Mobile di tabel inventaris tidak disentuh
  kecuali baris #24/#25 yang memang sudah selesai sebelumnya.

## Belum tersentuh sama sekali — PR/sesi berikutnya mulai dari sini

Auth & Users (#1), Quiz & Flashcard (#22, `GET /quiz` balas 405 — perlu
baca controller buat tahu alur session yang benar sebelum di-test),
Comments/Diskusi generik (#31), Reading Progress (#33, cuma dicek tidak
langsung lewat halaman Khatam), Hafalan (#34), Streak & Activity (#35),
Tilawah Tracker (#36), Muroja'ah (#38), Muhasabah (#39), Goals (#40),
Stats (#42), Content Correction Reports (#51), Admin Audit Logs (#52),
Analytics write path (#57, cuma dicek GET-nya 405 sesuai ekspektasi, belum
dicoba POST asli), Open API/Developer Partner (#58), Admin: User
Management (#59). Sebagian besar ini JWT/admin-gated — butuh token asli
buat exercise end-to-end, bukan cuma baca kode.

## File yang diubah

- `services/api/app/model/hadith_ayah.go` — hapus `gorm:"-"` di field
  `Hadith`/`Ayah` (fix 500).
- `apps/web/src/app/search/SearchClient.js` — perbaiki key `mergeResults()`
  dari `ayah`/`hadith` ke `ayahs`/`hadiths` (fix silent-drop saat load more).
- `docs/reviews/2026-09-08-feature-route-inventory.md` — checklist §4
  di-update in-place per baris yang direview sesi ini.

## Catatan concurrency

`docs/reviews/README.md` sudah dirty dari sesi lain (belum di-commit) saat
sesi ini mulai — **tidak diedit** di sini sesuai aturan "skip file yang
sudah dirty dari sesi lain". Dokumen ini (`2026-09-12-feature-checklist-review-pass.md`)
perlu didaftarkan manual ke `docs/reviews/README.md` begitu sesi lain
selesai commit.
