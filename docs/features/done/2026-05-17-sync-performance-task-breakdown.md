# Sync And Performance Task Breakdown

Status: `VERIFIED_WITH_DEVICE_SMOKE`
Priority: `P0-P2`
Tanggal: `2026-05-17`
Source Review: `docs/reviews/2026-05-17-web-mobile-performance-sync-deep-review.md`

## Objective

Menutup gap sync web/mobile/backend, memperbaiki CTA yang masih misleading,
dan mengurangi risiko performance yang ditemukan pada deep review terbaru.

## Current Status

Task 1-11 sudah `VERIFIED` dan perubahan terkait sudah di-build/test. Device
smoke mobile juga sudah dijalankan pada device fisik setelah device di-unlock.
Verifikasi runtime:

```text
z5yxpjrgvw8pdqzt       device usb:3-9 product:ruby_id model:22101316G device:ruby transport_id:1
make mobile-dev-all
```

Smoke device yang sudah lulus:

- Tab Ibadah -> Khatam.
- Belajar -> Flashcard Asmaul Husna -> Lihat arti.
- Profile -> Achievements detail.
- Quran deep link target ayah jauh `exp://127.0.0.1:19007/--/quran/2/65`.
- Explore infinite scroll / paginated feature list.

## Task 1 - Backend Cache And Test Hardening

Priority: `P0`
Area: `services/api`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Perbaiki `CacheByType` agar cache header dipasang setelah handler selesai.
- Skip cache untuk endpoint auth, personal, dashboard, profile, bookmarks,
  notes, goals, notifications, achievements, stats, dan endpoint mutable.
- Tambahkan coverage test untuk public cacheable route dan private route.
- Update fake tafsir repo di test agar memenuhi interface terbaru.
- Perbaiki route test yang panic karena repo nil/pool protection.
- Perbaiki query dzikir `find by occasion` yang memakai kolom `id` ambigu.

### Acceptance Criteria

- `cd services/api/app && go test ./...` hijau.
- Response public static GET tetap punya cache header yang benar.
- Response private/auth/personal GET tidak diberi `Cache-Control: public`.
- Tidak ada panic di route setup test.

### Verification

- `cd services/api/app && go test ./...` - `PASS`
- Manual check dengan curl untuk satu endpoint public dan satu endpoint
  authenticated/private jika token tersedia.

### Implementation Notes

- `CacheByType` sekarang memasang header cache setelah handler selesai.
- Private/authenticated GET tidak diberi `Cache-Control: public`.
- Prefix static cache ditambah untuk tafsir, siroh, kajian, asbabun nuzul,
  history, tokoh tarikh, dan jarh wa ta'dil.
- `routes_test` tidak lagi salah membaca route debug pprof sebagai root API.
- Fake tafsir repo test sudah mengikuti interface `Search`.
- Query dzikir by occasion memakai kolom qualified agar tidak ambigu saat join
  translation.

## Task 2 - Mobile Khatam Journey

Priority: `P1`
Area: `apps/mobile`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Tentukan apakah mobile akan punya tracker Khatam penuh atau hanya shortcut
  Quran sementara.
- Jika tracker dibuat:
    - tambahkan screen/modal Khatam;
    - tampilkan progress, target, completion, dan CTA lanjut baca;
    - sinkronkan dengan data web/dashboard jika endpoint sudah ada.
- Jika tracker belum dibuat:
    - ubah label CTA agar tidak menjanjikan tracker;
    - tambahkan badge `Segera` atau copy yang jelas.

### Acceptance Criteria

- CTA `Khatam` tidak lagi membuka Quran tab tanpa konteks.
- User mobile paham apakah fitur Khatam sudah tersedia atau masih shortcut.
- Journey tidak bertentangan dengan `/khatam` dan `/dashboard/khatam` di web.

### Verification

- `cd apps/mobile && npm test -- --runInBand` - `PASS`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-khatam-mobile-export` - `PASS`
- Device smoke dari tab Ibadah ke Khatam - `PASS`
    - Evidence: `output/native/2026-05-17/khatam-screen.png`

### Implementation Notes

- Item `Khatam` di tab Ibadah sekarang membuka sub-view `Khatam`, bukan lagi
  redirect langsung ke tab Quran.
- Mobile Khatam membaca `/api/v1/progress/quran`, menampilkan progress ayat,
  sisa ayat, target 30 hari, progress per juz, dan CTA `Lanjutkan baca`.
- CTA `Lanjutkan baca` membuka Quran ke surah/ayat progress terakhir.
- Guest dan akun tanpa progress mendapat empty state eksplisit.

## Task 3 - Mobile Asmaul Husna Flashcard

Priority: `P1`
Area: `apps/mobile`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Tambahkan mode flashcard pada fitur Asmaul Husna.
- Gunakan bottom-sheet modal atau page detail terpisah, sesuai
  `docs/MOBILE_DESIGN_PATTERNS.md`.
- Tambahkan CTA yang jelas dari Asmaul Husna list.
- Pastikan mode ini sync dengan web route:
    - `/asmaul-husna/flashcard`
    - `/dashboard/asmaul-husna/flashcard`

### Acceptance Criteria

- User mobile bisa masuk ke mode flashcard Asmaul Husna.
- Back navigation Android memakai `setBack`/`clearBack`.
- Tidak ada inline expand/collapse.

### Verification

- `node --check apps/mobile/src/screens/ExploreScreen.js` - `PASS`
- `node --check apps/mobile/src/data/mobileFeatures.js` - `PASS`
- `cd apps/mobile && npm test -- --runInBand src/__tests__/exploreScreen.test.js src/__tests__/mobileFeatures.test.js` - `PASS`
- `cd apps/mobile && npm test -- --runInBand` - `PASS`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-asmaul-flashcard-export` - `PASS`
- Device smoke fitur Asmaul Husna Flashcard - `PASS`
    - Evidence: `output/native/2026-05-17/asmaul-flashcard-revealed.png`

### Implementation Notes

- `Flashcard Asmaul Husna` ditambahkan ke katalog Belajar > Referensi sebagai
  mode terpisah dari list Asmaul Husna.
- Mode flashcard memakai detail view `ExploreScreen` yang sudah mengikuti back
  handling parent, bukan inline expand/collapse di list katalog.
- Data memakai `getAsmaulNames()` yang sama dengan mode wirid, lalu dinormalisasi
  agar toleran pada variasi field API.
- CTA `Lihat arti`, `Sembunyikan arti`, `Sebelumnya`, dan `Berikutnya` dibuat
  eksplisit sesuai journey latihan hafalan.

## Task 4 - Mobile Achievements Detail Journey

Priority: `P1`
Area: `apps/mobile`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Tambahkan detail journey untuk achievements dari `ProfileScreen`.
- Tampilkan daftar achievement, progress, unlocked/locked state, dan reward.
- Sinkronkan dengan web dashboard `/dashboard/achievements`.
- Pastikan empty state tidak terdengar seperti error saat data belum ada.

### Acceptance Criteria

- Profile summary punya CTA ke detail Achievements.
- User bisa melihat progress achievement secara lengkap di mobile.
- Label dan state konsisten dengan dashboard web.

### Verification

- `node --check apps/mobile/src/screens/ProfileScreen.js` - `PASS`
- `cd apps/mobile && npm test -- --runInBand src/__tests__/profileScreen.test.js src/__tests__/api-personal.test.js` - `PASS`
- `cd apps/mobile && npm test -- --runInBand` - `PASS`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-achievements-detail-export` - `PASS`
- Device smoke Profile -> Achievements detail - `PASS`
    - Evidence: `output/native/2026-05-17/profile-achievements-detail.png`

### Implementation Notes

- Summary `PENCAPAIAN` di Profile sekarang punya CTA `Lihat semua` dan badge
  card bisa membuka detail.
- Detail `Pencapaian` menampilkan total poin, jumlah badge diperoleh, daftar
  earned/locked, progress untuk kategori streak/hafalan, dan reward poin.
- State public list achievement tidak lagi dianggap otomatis unlocked hanya
  karena payload punya field `achievement`; earned state digabung dari
  `/achievements/mine`.
- Detail memakai stack sub-screen `ProfileScreen`, sehingga Android back tetap
  lewat `setBack`/`clearBack` yang sudah ada.

## Task 5 - Landing Web Feature Discovery Sync

Priority: `P1`
Area: `apps/web`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Update landing/home feature grid agar memasukkan fitur yang sudah ada tetapi
  belum menonjol:
    - Forum
    - Tokoh Tarikh
    - Peta Sejarah
    - Asmaul Husna Flashcard
    - Jarh wa Ta'dil
    - Wirid personal/custom jika diposisikan sebagai personal feature
- Pisahkan CTA public dan personal.
- Untuk personal feature, arahkan ke login/dashboard intent yang sesuai.

### Acceptance Criteria

- Landing web menjadi discovery surface yang sync dengan mobile/public catalog.
- CTA tidak membuka route yang salah konteks.
- Fitur personal tidak dipresentasikan seperti fitur public bebas login.

### Verification

- `cd apps/web && npm run build` - `PASS`
- Browser smoke `http://localhost:23001` - `PASS`
    - `Forum Diskusi` -> `/forum`
    - `Tokoh Tarikh` -> `/tokoh`
    - `Peta Islam` -> `/peta`
    - `Flashcard Asmaul Husna` -> `/asmaul-husna/flashcard`
    - `Jarh wa Ta'dil` -> `/perawi`
    - `Wirid Pribadi` guest -> `/auth/register?next=%2Fdashboard%2Fwirid-custom`

### Implementation Notes

- Landing feature grid sekarang memasukkan Forum, Tokoh Tarikh, Peta Islam,
  Flashcard Asmaul Husna, Perawi/Jarh wa Ta'dil, dan Wirid Pribadi.
- Feature card diberi marker `Publik` atau `Akun` agar user paham apakah CTA
  bisa dibuka tanpa login atau masuk ke journey personal.
- Personal feature `Wirid Pribadi` diarahkan ke dashboard intent melalui
  `personalHref('/dashboard/wirid-custom')`, sehingga guest masuk ke register
  dengan `next` yang tepat.

## Task 6 - Feature Manifest And Parity Check

Priority: `P1`
Area: `apps/web`, `apps/mobile`, `docs`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Buat source of truth feature catalog lintas platform.
- Minimal field:
    - `key`
    - `title`
    - `publicWebRoute`
    - `dashboardWebRoute`
    - `mobileRoute`
    - `authRequired`
    - `ctaLabel`
    - `searchable`
    - `status`
- Tambahkan script/check sederhana untuk mendeteksi route/feature yang hilang
  dari web atau mobile.
- Update docs agar penambahan fitur baru wajib menyentuh manifest.

### Acceptance Criteria

- Ada satu manifest yang bisa dipakai review parity.
- Fitur baru tidak mudah lupa ditambahkan ke landing/mobile/search.
- Alias seperti `peta` vs `historical-map` terdokumentasi.

### Verification

- `node --check scripts/check-feature-parity.js` - `PASS`
- `node -e "JSON.parse(require('fs').readFileSync('docs/features/feature-manifest.json','utf8')); console.log('manifest-json-ok')"` - `PASS`
- `node scripts/check-feature-parity.js` - `PASS`
    - manifest features: `49`
    - mobile feature keys: `42`
    - web app routes scanned: `141`

### Implementation Notes

- Source of truth dibuat di `docs/features/feature-manifest.json`.
- Panduan workflow wajib ditambahkan di `docs/features/FEATURE_MANIFEST.md`
  dan di-link dari `docs/features/README.md`.
- Script `scripts/check-feature-parity.js` memvalidasi field wajib, route web
  public/dashboard, format `mobileRoute`, dan key mobile baru yang belum masuk
  manifest.
- Alias terdokumentasi untuk drift nama seperti web `/peta` dan mobile
  `historical-map`, serta `muroja-ah` vs `murojaah`.

## Task 7 - Web Performance Pass

Priority: `P1`
Area: `apps/web`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Set `turbopack.root` atau rapikan root lockfile warning.
- Refactor `apps/web/src/app/page.js` menjadi server component wrapper dengan
  client islands hanya untuk bagian interaktif.
- Ubah import `html2canvas` di Quran detail menjadi dynamic import.
- Audit route `'use client'` lain yang sebenarnya static/content-heavy.

### Acceptance Criteria

- Build web tetap hijau.
- Warning root lockfile hilang atau terdokumentasi jelas.
- Library screenshot tidak masuk initial bundle Quran detail.

### Verification

- `node --check apps/web/next.config.js` - `PASS`
- `node --check apps/web/src/app/page.js` - `PASS`
- `node --check apps/web/src/app/HomePageClient.js` - `PASS`
- `node --check apps/web/src/app/quran/[...slug]/AyahPage.js` - `PASS`
- `cd apps/web && npm run build` - `PASS`
    - Warning root lockfile/Turbopack tidak muncul lagi.
- `rg -n "html2canvas" apps/web/src/app apps/web/src/components` - `PASS`
    - Semua pemakaian `html2canvas` yang tersisa sudah lewat dynamic import.

### Implementation Notes

- `apps/web/next.config.js` sekarang mem-pin `turbopack.root` dan
  `outputFileTracingRoot` ke folder `apps/web`, sesuai struktur app yang punya
  lockfile sendiri.
- Landing root `apps/web/src/app/page.js` sudah menjadi server component
  wrapper, sementara UI interaktif lama dipindah ke
  `apps/web/src/app/HomePageClient.js`.
- Quran detail tidak lagi static import `html2canvas`; library screenshot baru
  dimuat saat CTA `Copy Image` diklik.
- Audit `use client` menemukan masih banyak route public/dashboard yang
  content-heavy tetapi client-rendered. Refactor penuh route tersebut terlalu
  lebar untuk Task 7 dan sebaiknya dipisah menjadi follow-up performance slice
  setelah mobile performance pass.

## Task 8 - Mobile Quran And Explore Performance Pass

Priority: `P1`
Area: `apps/mobile`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Ubah Quran target ayah load agar tidak request page 0 sampai target page.
- Fetch target page langsung dan prefetch sekitar target secukupnya.
- Split `ExploreScreen` menjadi modul domain agar state tidak terlalu besar.
- Memoize row renderer dan action handler list katalog.
- Pertahankan `FlatList` untuk list panjang.

### Acceptance Criteria

- Membuka target ayah jauh tidak memicu banyak request paralel.
- Explore tetap stabil saat katalog bertambah.
- Tidak ada regresi tab Beranda, Quran, Hadis, Ibadah, Belajar.

### Verification

- `node --check apps/mobile/src/screens/QuranScreen.js` - `PASS`
- `node --check apps/mobile/src/screens/ExploreScreen.js` - `PASS`
- `node --check apps/mobile/src/screens/explore/FeatureCatalog.js` - `PASS`
- `cd apps/mobile && npm test -- --runInBand src/__tests__/quranScreen.test.js src/__tests__/exploreScreen.test.js` - `PASS`
- `cd apps/mobile && npm test -- --runInBand` - `PASS`
    - 39 suites / 544 tests passed.
    - Existing `act(...)` warnings still appear in several mobile tests; they do
      not fail the suite and are tracked separately by Task 10.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-quran-explore-perf-export` - `PASS`
- Automated Quran deep-link regression added:
    - target ayah 65 loads pages `[2, 3, 4]` only, not pages `0..4`.
- Device smoke Quran deep link target ayah `quran/2/65` - `PASS`
    - Evidence: `output/native/2026-05-17/quran-deeplink-2-65.png`
- Device smoke Explore infinite scroll - `PASS`
    - Evidence: `output/native/2026-05-17/explore-scroll.png`

### Implementation Notes

- `QuranScreen` now resolves target ayah IDs when needed, calculates the target
  surah page directly, and prefetches only a small page window around it.
- The far-target loader no longer requests every page from `0` through target.
- Explore catalog rendering moved into
  `apps/mobile/src/screens/explore/FeatureCatalog.js`.
- Catalog rows and pin/open handlers are memoized so the Belajar catalog is less
  sensitive to unrelated state churn as feature count grows.
- Active feature content still uses the existing `Screen` FlatList path for
  paginated lists and infinite scroll.

## Task 9 - Backend Cache Key Coverage

Priority: `P2`
Area: `services/api`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Tambahkan/standarkan cache key untuk:
    - asbabun-nuzul
    - sejarah/history
    - tokoh-tarikh
    - jarh-tadil
    - public forum reads jika aman
- Pastikan TTL mengikuti karakter data.
- Pastikan personal data tidak memakai cache publik.

### Acceptance Criteria

- Cache key domain baru konsisten dengan domain lama.
- Tidak ada cache collision antar domain.
- Invalidation atau TTL terdokumentasi.

### Verification

- `cd services/api/app && go test ./lib ./http/middlewares ./services` - `PASS`
- `cd services/api/app && go test ./...` - `PASS`
- Manual Redis key inspection pada endpoint yang berubah masih bisa dilakukan
  saat runtime/staging aktif.

### Implementation Notes

- `cacheTTLByPrefix` sekarang mengenali prefix Redis:
    - `asbabun-nuzul:*`
    - `history:*`
    - `tokoh-tarikh:*`
    - `jarh-tadil:*`
    - `forum:*`
- Prefix asbabun/history/tokoh/jarh memakai TTL static; `forum:*` memakai TTL
  dynamic karena question list bisa berubah oleh pertanyaan, jawaban, dan vote.
- Service-level cache ditambahkan untuk public read:
    - Asbabun Nuzul list, ayah, dan surah.
    - History list, id, dan slug.
    - Tokoh Tarikh list dan id.
    - Jarh wa Ta'dil list, id, dan perawi.
    - Forum question list saja.
- Forum detail sengaja tidak di-cache karena endpoint itu menaikkan view count
  dan perlu menjaga detail jawaban/vote tetap segar.
- Mutation di domain terkait melakukan invalidation prefix domain masing-masing.
- Middleware cache header tetap membedakan static public content dan dynamic
  forum reads, serta tetap skip private/authenticated request.

## Task 10 - Mobile Test Warning Cleanup

Priority: `P2`
Area: `apps/mobile`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Bersihkan warning `act(...)` dari test HomeScreen, PrayerScreen, QuranScreen,
  GlobalSearch, dan session-related tests.
- Tambahkan helper test async jika pola warning berulang.
- Pastikan warning baru tidak tertutup oleh baseline lama.

### Acceptance Criteria

- Test tetap lulus.
- Warning `act(...)` turun signifikan atau hilang dari area yang disentuh.
- Failure baru lebih mudah dibaca.

### Verification

- `node --check apps/mobile/src/test-utils/async.js` - `PASS`
- `cd apps/mobile && npm test -- --runInBand src/__tests__/homeScreen.test.js src/__tests__/PrayerScreen.test.js src/__tests__/quranScreen.test.js src/__tests__/exploreScreen.test.js src/__tests__/globalSearchScreen.test.js src/__tests__/sessionCard.test.js` - `PASS`
    - 6 suites / 72 tests passed.
    - No `act(...)` warning in targeted Home, Prayer, Quran, Explore,
      GlobalSearch, and SessionCard tests.
- `cd apps/mobile && npm test -- --runInBand src/__tests__/notificationCenter.test.js src/__tests__/offlinePackCard.test.js src/__tests__/notesPanel.test.js src/__tests__/context-session.test.js` - `PASS`
    - 4 suites / 39 tests passed.
    - Low-impact warning cleanup extended to NotificationCenter,
      OfflinePackCard, NotesPanel, and SessionProvider coverage.
- `cd apps/mobile && npm test -- --runInBand` - `PASS`
    - 39 suites / 544 tests passed.
    - Full suite output no longer reports `not wrapped in act(...)`.

### Implementation Notes

- Added shared mobile test helper `apps/mobile/src/test-utils/async.js` for
  flushing async effects inside `act(...)`.
- Home, Prayer, Quran, Explore, GlobalSearch, and SessionCard tests now await
  mount effects or async submit handlers before asserting.
- Low-impact residual warnings found in the full suite were also cleaned:
  NotificationCenter, OfflinePackCard, NotesPanel, and SessionProvider tests now
  wait for async initialization paths.
- The helper intentionally lives outside `src/__tests__` so Jest does not treat
  it as a standalone test file.

## Task 11 - Web Static Route Client Island Pass

Priority: `P2`
Area: `apps/web`
Status: `VERIFIED`
Completed: `2026-05-17`

### Scope

- Lanjutkan follow-up Task 7 untuk route public content-heavy yang masih
  memakai full-page `'use client'`.
- Mulai dari route yang aman dan sudah di-reuse dashboard:
  `/panduan-sholat`, lalu `/tahlil`.
- Pertahankan interaksi accordion/fetch di client island.
- Pastikan dashboard reuse tidak import server page module.

### Acceptance Criteria

- Public `/panduan-sholat` tidak lagi menjadi full client page.
- Public `/tahlil` tidak lagi menjadi full client page.
- Komponen interaktif tetap reusable oleh `/dashboard/panduan-sholat`.
- Komponen interaktif tetap reusable oleh `/dashboard/tahlil`.
- Build web tetap hijau.

### Verification

- `cd apps/web && npm run build` - `PASS`
    - `/panduan-sholat` tetap prerendered static.
    - `/dashboard/panduan-sholat` tetap prerendered static.
    - `/tahlil` tetap prerendered static.
    - `/dashboard/tahlil` tetap prerendered static.
- Device mobile smoke untuk task sebelumnya sudah dilanjutkan setelah device
  di-unlock. Khatam, Asmaul Flashcard, Achievements, Quran deep link, dan
  Explore scroll sudah `PASS`.

### Implementation Notes

- `PanduanSholatContent` dipindahkan ke
  `apps/web/src/app/panduan-sholat/PanduanSholatClient.js`.
- `apps/web/src/app/panduan-sholat/page.js` sekarang server wrapper yang hanya
  memasang navbar, spacing, client island, dan footer.
- `apps/web/src/app/dashboard/panduan-sholat/page.js` sekarang import client
  island langsung, bukan import dari public page module.
- `TahlilContent` dipindahkan ke
  `apps/web/src/app/tahlil/TahlilClient.js`.
- `apps/web/src/app/tahlil/page.js` sekarang server wrapper yang hanya
  memasang navbar, section layout, client island, dan footer.
- `apps/web/src/app/dashboard/tahlil/page.js` sekarang import client island
  langsung, bukan import dari public page module.

## Suggested Execution Order

1. Task 1 - Backend cache and test hardening.
2. Task 2 - Mobile Khatam journey.
3. Task 3 - Mobile Asmaul Husna Flashcard.
4. Task 4 - Mobile Achievements detail journey.
5. Task 5 - Landing web feature discovery sync.
6. Task 6 - Feature manifest and parity check.
7. Task 7 - Web performance pass.
8. Task 8 - Mobile Quran and Explore performance pass.
9. Task 9 - Backend cache key coverage.
10. Task 10 - Mobile test warning cleanup.
11. Task 11 - Web static route client island pass.

## Notes

- Task yang mengubah mobile navigation wajib mengikuti
  `docs/MOBILE_IA_FINAL_APPROACH.md`.
- Detail UI mobile tidak boleh memakai inline expand/collapse; gunakan
  bottom-sheet modal atau page detail.
- Setelah task signifikan selesai, jalankan `chronicle.sync` agar index
  mengikuti repo terbaru.
