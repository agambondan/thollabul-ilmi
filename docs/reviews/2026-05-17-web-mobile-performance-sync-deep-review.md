# Web Mobile Sync And Performance Deep Review

Status: `REVIEWED_TASKS_DEVICE_VERIFIED`
Tanggal: `2026-05-17`
Scope: `apps/web`, `apps/mobile`, `services/api`

## Ringkasan Verdict

Update 2026-05-17: task implementasi dari review ini sudah ditutup sampai
Task 11 di `docs/features/progress/2026-05-17-sync-performance-task-breakdown.md`.
Status review sekarang bukan lagi baseline awal. Web, mobile, dan backend sudah
lebih sinkron untuk area yang diaudit. Device smoke mobile sudah selesai
dijalankan pada device fisik setelah device di-unlock.

Verdict teknis setelah Task 1-11:

| Area                         | Status             | Catatan                                                                                                                                                                                                                                  |
| ---------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web build                    | `PASS`             | `cd apps/web && npm run build` berhasil setelah Task 7 dan Task 11. Root lockfile/Turbopack warning sudah ditutup lewat config web.                                                                                                      |
| Mobile unit/integration test | `PASS`             | `cd apps/mobile && npm test -- --runInBand` lulus 39 suites / 544 tests. Full suite tidak lagi melaporkan `act(...)` warning.                                                                                                            |
| Backend test                 | `PASS`             | `cd services/api/app && go test ./...` hijau setelah cache/test hardening dan cache key coverage.                                                                                                                                        |
| Feature parity web/mobile    | `DEVICE_VERIFIED`  | Khatam, Asmaul Flashcard, Achievements, landing discovery, dan feature manifest sudah ditutup dan smoke device lulus.                                                                                                                    |
| Performance readiness        | `PARTIAL_VERIFIED` | Backend cache, Quran deep target, Explore catalog, Quran screenshot dynamic import, landing server wrapper, serta `/panduan-sholat` dan `/tahlil` client island sudah ditutup. Sisa: lanjut client-island pass route content-heavy lain. |

## Resolution Update 2026-05-17

Task breakdown yang menutup review ini:

- Task 1: backend cache middleware dan backend test hardening - `VERIFIED`.
- Task 2: mobile Khatam journey - `VERIFIED`.
- Task 3: mobile Asmaul Husna Flashcard - `VERIFIED`.
- Task 4: mobile Achievements detail journey - `VERIFIED`.
- Task 5: landing web feature discovery sync - `VERIFIED`.
- Task 6: feature manifest dan parity check - `VERIFIED`.
- Task 7: web performance pass awal - `VERIFIED`.
- Task 8: mobile Quran dan Explore performance pass - `VERIFIED`.
- Task 9: backend cache key coverage - `VERIFIED`.
- Task 10: mobile test warning cleanup - `VERIFIED`.
- Task 11: `/panduan-sholat` dan `/tahlil` web client-island pass - `VERIFIED`.

Device smoke sudah selesai pada 2026-05-17 dengan device `22101316G` melalui
`make mobile-dev-all`. Journey yang diverifikasi:

- Ibadah -> Khatam - `PASS`.
- Belajar -> Flashcard Asmaul Husna -> Lihat arti - `PASS`.
- Profile -> Achievements detail - `PASS`.
- Quran deep link target ayah jauh `quran/2/65` - `PASS`.
- Explore infinite scroll / paginated feature list - `PASS`.

## Evidence Review

- Web route audit dilakukan dari `apps/web/src/app`.
- Mobile feature registry diaudit dari `apps/mobile/src/data/mobileFeatures.js`.
- Mobile journey aktif diaudit dari `HomeScreen`, `ExploreScreen`,
  `QuranScreen`, `IbadahScreen`, dan `ProfileScreen`.
- Backend cache dan route behavior diaudit dari `services/api/app/lib/cache.go`,
  `services/api/app/http/middlewares/cache.go`, dan
  `services/api/app/http/routes.go`.
- Existing review yang masih relevan:
  `docs/reviews/2026-05-15-public-dashboard-parity-review.md` dan
  `docs/reviews/2026-05-15-web-journey-cta-review.md`.

## Feature Sync Findings

### P0 - Mobile Khatam CTA Belum Menjadi Fitur Khatam

Status 2026-05-17: `CLOSED_BY_TASK_2_DEVICE_VERIFIED`.

Web sudah punya route public `/khatam` dan dashboard `/dashboard/khatam`.
Mobile menampilkan item `Khatam` di tab Ibadah, tetapi item tersebut hanya
mengarahkan user ke tab Quran. Ini membuat CTA terdengar seperti tracker
khatam, padahal journey mobile tidak membuka pengalaman khatam.

Impact:

- User mengira fitur khatam tersedia di mobile.
- Web dan mobile tidak sync untuk fitur personal Quran completion.
- CTA di mobile tidak sesuai fungsi sebenarnya.

Rekomendasi:

- Implement mobile Khatam tracker setara web/dashboard, atau ubah CTA menjadi
  shortcut Quran yang jelas sampai tracker mobile tersedia.

### P1 - Asmaul Husna Flashcard Belum Sync Ke Mobile

Status 2026-05-17: `CLOSED_BY_TASK_3_DEVICE_VERIFIED`.

Web punya route flashcard public dan dashboard:

- `/asmaul-husna/flashcard`
- `/dashboard/asmaul-husna/flashcard`

Mobile punya Asmaul Husna sebagai katalog, tetapi belum ada entrypoint khusus
untuk mode flashcard. Ini gap kecil secara data, tetapi cukup terasa untuk
journey belajar karena mode flashcard adalah cara pakai yang berbeda, bukan
sekadar detail halaman biasa.

Rekomendasi:

- Tambahkan mode `Flashcard` di fitur Asmaul Husna mobile.
- Jika belum dibuat penuh, tambahkan badge `Segera` dan jangan arahkan CTA ke
  list biasa.

### P1 - Achievements Belum Punya Journey Mobile Penuh

Status 2026-05-17: `CLOSED_BY_TASK_4_DEVICE_VERIFIED`.

Web dashboard punya dedicated route `/dashboard/achievements`. Mobile
`ProfileScreen` menampilkan ringkasan poin/achievement, tetapi belum ada
halaman atau modal detail untuk daftar achievement, progress, dan reward.

Impact:

- Personal motivation loop tidak setara antara web dashboard dan mobile.
- User mobile tidak punya tempat eksplisit untuk melihat apa yang sudah dan
  belum dicapai.

Rekomendasi:

- Tambahkan `Achievements` sebagai screen/modal detail dari Profile.
- Sinkronkan label, progress, dan empty state dengan web dashboard.

### P1 - Landing Web Belum Mengekspos Semua Fitur Baru

Status 2026-05-17: `CLOSED_BY_TASK_5`.

Home web saat ini sudah mengarah ke banyak fitur core, tetapi belum terlihat
mengekspos beberapa fitur yang sudah ada atau sudah ditambahkan belakangan,
seperti:

- Forum
- Tokoh Tarikh
- Peta Sejarah
- Asmaul Husna Flashcard
- Jarh wa Ta'dil
- Wirid personal/custom

Impact:

- User public tidak mudah menemukan fitur baru.
- Mobile terlihat lebih lengkap dibanding landing web untuk discovery.
- CTA discovery di landing belum menjadi source of truth fitur publik.

Rekomendasi:

- Update feature grid landing web agar mencakup fitur baru.
- Pisahkan fitur public dan personal dengan label yang jelas.
- CTA personal dari landing sebaiknya menuju dashboard/login intent, bukan
  route publik yang membuat user kehilangan konteks.

### P1 - Nama Fitur Dan Route Alias Belum Konsisten

Status 2026-05-17: `CLOSED_BY_TASK_6`.

Beberapa fitur punya perbedaan penamaan antara web route, mobile registry, dan
copy UI:

| Domain        | Web / API              | Mobile           | Risiko                                                   |
| ------------- | ---------------------- | ---------------- | -------------------------------------------------------- |
| Peta Sejarah  | `/peta`                | `historical-map` | Search, deep link, dan analytics sulit dibaca konsisten. |
| Wirid Custom  | `/wirid-custom`        | `user-wird`      | Ada typo/alias yang rawan salah mapping.                 |
| Murojaah      | `/dashboard/muroja-ah` | `murojaah`       | Deep link dan docs mudah drift.                          |
| Jadwal Sholat | `/jadwal-sholat`       | Tab/fitur Prayer | Bisa muncul sebagai duplikat atau hilang dari manifest.  |
| Kiblat        | `/kiblat`              | Tab/fitur Qibla  | Sama seperti jadwal sholat.                              |

Rekomendasi:

- Buat manifest feature bersama atau minimal tabel alias resmi.
- Tambahkan test/skrip parity sederhana untuk route web vs feature key mobile.

### P2 - Fitur Ada, Tetapi Entry Point Journey Belum Merata

Status 2026-05-17: `CLOSED_BY_TASK_5_AND_TASK_6`.

Beberapa fitur sudah ada di salah satu permukaan, tetapi entrypoint belum
sekuat fitur lain:

- Forum sudah tersedia di mobile, tetapi landing web belum jelas mengangkatnya.
- Peta sudah tersedia di web dan mobile, tetapi naming discovery berbeda.
- Tokoh Tarikh sudah tersedia, tetapi perlu dipastikan masuk ke semua katalog
  discovery yang relevan.
- Jarh wa Ta'dil ada di mobile catalog, tetapi web landing belum menonjolkannya.
- Daily/personal widgets di dashboard dan mobile perlu punya CTA yang tetap
  berada di konteks dashboard saat user sudah login.

## CTA And Journey Findings

### P1 - CTA Mobile Harus Menjelaskan Destination

Status 2026-05-17: `CLOSED_BY_TASK_2_TO_TASK_4`.

CTA seperti `Khatam` yang membuka Quran tab adalah mismatch. Pola yang sama
perlu dicek untuk semua item katalog:

- Jika CTA membuka fitur penuh, label boleh pakai nama fitur.
- Jika CTA hanya shortcut ke tab induk, copy harus menyebut konteks, misalnya
  `Buka Quran`.
- Jika fitur belum tersedia, gunakan disabled state atau badge `Segera`, bukan
  redirect ke fitur lain.

### P1 - Dashboard Journey Jangan Bocor Ke Public Route

Status 2026-05-17: `PARTIALLY_CLOSED_BY_EXISTING_PUBLIC_DASHBOARD_PARITY_TASKS`.
Risiko ini tetap perlu dijaga lewat smoke dashboard terpisah saat ada perubahan
CTA baru.

Review sebelumnya menemukan banyak risiko CTA dashboard yang mengarah ke route
public. Belum semua area diverifikasi ulang pada review ini, jadi statusnya
tetap perlu dijaga sebagai risiko aktif sampai ada smoke test dashboard
menyeluruh.

Area yang perlu dicek ulang:

- Dashboard search dan result detail.
- Dashboard forum/community detail.
- Dashboard daily ayah/hadith/tafsir card.
- Dashboard bookmark dan reading history.
- Dashboard zakat, asbabun nuzul, dan Asmaul Husna.
- Navbar/footer/settings saat user berada di dashboard.

Rule yang harus dipakai:

- Public feature boleh dipakai tanpa login.
- Dashboard boleh memakai data/fitur public, tetapi detail dan CTA-nya tetap
  harus berada di layout dashboard jika user memulai dari dashboard.

### P2 - Discovery Mobile Dan Web Perlu Source Of Truth

Status 2026-05-17: `CLOSED_BY_TASK_6`.

Mobile punya `mobileFeatures.js`, web punya route dan landing grid sendiri.
Tanpa source of truth, fitur baru mudah masuk ke mobile tapi lupa di landing
web, atau sebaliknya.

Rekomendasi:

- Buat dokumen/manifest `feature-catalog` lintas platform.
- Setiap penambahan fitur wajib mengisi:
    - public web route
    - dashboard web route jika ada
    - mobile route/screen
    - auth requirement
    - CTA label
    - empty state
    - search/discovery inclusion

## Performance Findings

### P0 - Backend Cache Middleware Bisa Memberi Header Public Terlalu Dini

Status 2026-05-17: `CLOSED_BY_TASK_1`.

`CacheByType` di `services/api/app/http/middlewares/cache.go` mengatur header
sebelum `c.Next()` selesai. Karena status response dicek sebelum route handler
berjalan, middleware berpotensi memasang `Cache-Control: public` pada response
GET yang ternyata error, personal, atau authenticated.

Impact:

- Risiko cache policy salah untuk route private/personal.
- Sulit memastikan behavior cache benar saat route memakai auth middleware.
- Bisa membuat debug data stale lebih sulit.

Rekomendasi:

- Jalankan `c.Next()` dulu.
- Setelah handler selesai, set cache header hanya jika method GET, status
  sukses, path public/cacheable, dan response belum punya cache policy khusus.
- Skip path auth, dashboard/personal, user profile, bookmarks, notes, goals,
  notifications, achievements, stats, dan semua endpoint mutable.

### P0 - Backend Test Suite Belum Hijau

Status 2026-05-17: `CLOSED_BY_TASK_1`.

`go test ./...` di `services/api/app` gagal pada tiga area:

- `tafsir_service_test.go`: fake repo belum mengikuti interface terbaru yang
  sekarang membutuhkan `Search`.
- `http/routes_test.go`: route setup test panic karena repo nil dipakai oleh
  pool protection.
- `static_content_repository_test.go`: query dzikir `find by occasion` memakai
  kolom `id` ambigu.

Impact:

- Backend belum bisa disebut stabil setelah penambahan fitur.
- Risiko regresi endpoint/cache tidak tertangkap.

### P1 - Web Build Warning Root Lockfile/Turbopack

Status 2026-05-17: `CLOSED_BY_TASK_7`.

Build web berhasil, tetapi Next.js mendeteksi workspace root dari
`/home/firman/package-lock.json` dan memberi warning karena ada lockfile lain
di `apps/web/package-lock.json`.

Impact:

- Build cache dan file tracing bisa tidak konsisten.
- Warning ini akan terus muncul di CI/dev sampai root diset eksplisit.

Rekomendasi:

- Set `turbopack.root` di `apps/web/next.config.*`, atau rapikan lockfile root
  jika memang tidak dipakai.

### P1 - Landing Web Masih Full Client Component

Status 2026-05-17: `CLOSED_BY_TASK_7`.

`apps/web/src/app/page.js` memakai `'use client'`. Untuk landing page yang
banyak berisi content, CTA, dan widget terbatas, full client component membuat
bundle awal lebih berat dari yang diperlukan.

Rekomendasi:

- Jadikan page utama sebagai server component.
- Pindahkan hanya bagian interaktif ke client islands.
- Pastikan hero, feature grid, dan static content tetap render server-side.

### P1 - Quran Web Mengimpor `html2canvas` Di Top-Level

Status 2026-05-17: `CLOSED_BY_TASK_7`.

`apps/web/src/app/quran/[...slug]/AyahPage.js` mengimpor `html2canvas` di
top-level. Di route hadis detail, pola yang lebih ringan sudah dipakai dengan
dynamic import saat action dibutuhkan.

Rekomendasi:

- Ubah `html2canvas` di Quran detail menjadi dynamic import di handler share/
  export.
- Hindari memasukkan library screenshot ke initial bundle pembaca Quran.

### P1 - Mobile Quran Deep Target Bisa Fan-Out Banyak Request

Status 2026-05-17: `CLOSED_BY_TASK_8_DEVICE_VERIFIED`.

`QuranScreen` punya pola load target ayah yang mengambil page 0 sampai target
page sekaligus. Untuk ayah yang jauh di akhir surah, ini bisa membuat banyak
request paralel hanya untuk membuka target tertentu.

Rekomendasi:

- Fetch target page langsung berdasarkan ayah/page metadata.
- Prefetch page sekitar target secukupnya.
- Hindari memuat semua page sebelumnya hanya untuk positioning awal.

### P1 - ExploreScreen Mobile Masih Menjadi Hotspot Besar

Status 2026-05-17: `PARTIALLY_CLOSED_BY_TASK_8`; catalog rendering sudah
dipisah, split domain lanjutan masih bisa dilakukan bertahap.

Explore sudah lebih baik karena active list memakai `FlatList` lewat shared
`Screen`, tetapi `ExploreScreen` masih memegang banyak state, handler, dan
mode fitur dalam satu file.

Impact:

- Sulit menjaga performa render saat katalog bertambah.
- Risiko regresi antar fitur tinggi karena satu screen mengatur terlalu banyak
  behavior.

Rekomendasi:

- Split handler per domain fitur: catalog list, social/forum, local tools,
  static content detail.
- Memoize row renderer dan action handler yang sering dipakai.
- Pertahankan `FlatList`; jangan kembali ke `items.map` di `ScrollView`.

### P2 - Mobile Test Lulus Tetapi Banyak Warning `act(...)`

Status 2026-05-17: `CLOSED_BY_TASK_10`.

Test mobile lulus 537 test, tetapi warning `act(...)` masih banyak muncul dari
beberapa screen. Ini bukan blocker release langsung, tetapi membuat signal test
lebih bising dan bisa menutupi warning baru.

Rekomendasi:

- Rapikan async test HomeScreen, PrayerScreen, QuranScreen, GlobalSearch, dan
  session-related tests.
- Jadikan warning baru sebagai indikator regresi setelah baseline dibersihkan.

### P2 - Backend Cache Key Coverage Belum Merata

Status 2026-05-17: `CLOSED_BY_TASK_9`.

`services/api/app/lib/cache.go` sudah punya TTL prefix untuk banyak domain,
tetapi fitur baru dan public catalog belum semuanya terlihat setara, seperti:

- asbabun-nuzul
- history/sejarah
- tokoh-tarikh
- jarh-tadil
- public forum reads jika memang boleh cache pendek

Rekomendasi:

- Standarkan cache key per domain dengan format jelas.
- Tambahkan invalidation/TTL sesuai jenis data.
- Hindari cache personal data di key publik.

## Priority Order

1. Fix backend cache middleware dan test suite backend.
2. Rapikan feature parity yang punya CTA mismatch: Khatam, Asmaul Flashcard,
   Achievements.
3. Update landing web agar feature discovery sinkron dengan mobile/public.
4. Tambahkan manifest atau task parity check lintas web/mobile/API.
5. Optimasi web bundle dan mobile Quran deep-load.
6. Bersihkan warning test mobile dan cache key coverage.

## Done Criteria Untuk Menutup Review Ini

- Backend `go test ./...` di `services/api/app` hijau - `DONE`.
- Mobile Khatam tidak lagi misleading - `DONE`.
- Asmaul Flashcard dan Achievements punya journey mobile atau status UI yang
  eksplisit - `DONE`.
- Landing web mengekspos fitur public baru yang sudah tersedia - `DONE`.
- Dashboard CTA tidak keluar dari layout dashboard saat user mulai dari
  dashboard - `PARTIAL`, tetap perlu regression smoke saat CTA baru ditambah.
- Ada manifest/checklist parity yang dipakai saat menambah fitur baru - `DONE`.
- Device smoke mobile untuk Khatam, Asmaul Flashcard, Achievements, Quran deep
  link, dan Explore infinite scroll - `DONE`.
