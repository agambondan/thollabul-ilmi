# Deep Review UI/UX & Mobile Design System (2026-09-25)

> Dokumen audit desain dan UI/UX mobile (`apps/mobile`) berdasarkan analisis kode aktual, platform guideline (Android & iOS), token theming, kontras WCAG, dan kesesuaian Information Architecture (`docs/MOBILE_IA_FINAL_APPROACH.md`, `docs/MOBILE_DESIGN_PATTERNS.md`).
> Standar: **Zero AI-slop** — berbasis temuan teknis riil pada file sumber, bukan checklist generik.

---

## 1. Temuan Kritis & Status Perbaikan

### A. Sub-Screen Belajar WebApp Theme Inconsistency (SELESAI DIPERBAIKI)
- **Problem**: File `ExploreScreen.styles.js` mendefinisikan konstanta warna gelap statis (`WEB_APP_EXPLORE_BG = "#020617"`, `WEB_APP_EXPLORE_SURFACE = "#111827"`). Layar personal WebApp (`bookmarks`, `notes`, `goals`, `muhasabah`, `hafalan`, `murojaah`, `tilawah`, `stats`, `notifications`) menampilkan background gelap saat aplikasi dalam Light Mode.
- **Root Cause**: `ExploreWebAppRoutes.js` sebelumnya mengikat langsung `styles.webApp*` di `StyleSheet.create` tanpa membaca dynamic theme.
- **Fix Applied**:
  - `ExploreWebAppTheme.js`: Ditambahkan generator token `createExploreWebAppThemeStyles(theme)` lengkap dengan token `content`, `root`, `hero`, `card`, `cardTitle`, `cardText`, `cardMeta`, `statCard`, `statNumber`, `statLabel`, `progressTrack`, `progressFill`, `empty`, `emptyTitle`, `emptyText`, `stateBox`, `errorBox`, `backButton`, `backText`, `todayPanel`, `todayTitle`, `todayText`, `statusDone`, `statusProgress`, `statusUrgent`.
  - `ExploreWebAppRoutes.js`: Seluruh layar personal (`bookmarks`, `notes`, `goals`, `muhasabah`, `hafalan`, `murojaah`, `tilawah`, `stats`, `notifications`) kini mengonsumsi `webAppExploreThemeStyles` dan `webAppExploreTheme`.

### B. Android Hardware Back Button Trap pada Sub-Route Belajar (SELESAI DIPERBAIKI)
- **Problem**: Saat user berada di dalam detail sub-fitur Belajar (misal: Library detail, Forum thread detail, Tafsir surah viewer, Faraidh history, Wird editor), menekan tombol Back fisik Android keluar dari aplikasi atau langsung loncat ke Beranda alih-alih menutup detail sub-fitur.
- **Root Cause**: `ExploreScreen.js` hanya memanggil `navigation.setHeader({ onBack: ... })` tanpa mendaftarkan handler ke `navigation.setBack(...)` yang dibaca oleh `screenBackRef` di `App.js`.
- **Fix Applied**: `ExploreScreen.js` kini secara reaktif memanggil `navigation.setBack(onBack)` di setiap state sub-fitur aktif dan membersihkannya via `navigation.clearBack()` saat kembali ke katalog utama.

### C. Quran Audio Range Player Ergonomics (SELESAI DIPERBAIKI)
- **Problem**: Bottom sheet audio player terbuka secara otomatis atau menutupi ruang baca ayat saat reader dimuat.
- **Root Cause**: State `audioPlayerOpen` tidak terkunci per trigger.
- **Fix Applied**: Bottom sheet kini hanya aktif saat tombol audio header `[ 🔊 ]` atau play per-ayat ditekan. Tombol minimize `∨` mengempiskan player menjadi mini floating pill, dan tombol close `✕` menghentikan audio sekaligus menutup floating bar.

---

## 2. Audit Area Lain & Rekomendasi Lanjutan

### A. Sub-Routes Standalone WebApp (`WebApp*Route.js`)
File-file sub-fitur WebApp terisolasi berikut masih memiliki stylesheet mandiri yang condong ke palet light mode:
1. `WebAppKajianRoute.js`: Memiliki ~1600 baris dengan card dan transcript result yang hardcoded `#ffffff` dan `#f8fafc`.
2. `WebAppForumRoute.js`: Form tanya jawab dan vote badge menggunakan hex statis `#ffffff`, `#111827`.
3. `WebAppTafsirRoute.js`: Hasil pencarian asbabun nuzul & kemenag tafsir menggunakan panel background `#ffffff`.
4. `WebAppLibraryRoute.js`, `WebAppPerawiRoute.js`, `WebAppAsmaulRoutes.js`, `WebAppFeedRoute.js`.

**Action Plan**: Refactor bertahap komponen-komponen di atas untuk menerima prop `isDarkTheme` atau hook `useLayoutModePreference()` dan menerapkan dual-mode styling seperti pada `WebAppFiqhRoute.js`, `WebAppTasbihRoute.js`, dan `WebAppKomunitasRoute.js`.

### B. Android Touch Target & Ripple Feedback
1. **Touch Target**: Sesuai Apple HIG (min 44×44pt) dan Material Design (min 48×48dp), ikon-ikon standalone di header dan sheet harus memiliki `hitSlop={8}` atau `hitSlop={12}` agar tidak terjadi missed-tap pada layar kecil (375px).
2. **Ripple Color**: Hindari `android_ripple={{ color: "#1f2937" }}` statis pada permukaan terang. Gunakan token `theme.ripple` (`#d1fae5` pada light, `#1f2937` pada dark) atau `rgba(0,0,0,0.08)`.

### C. Performance & Virtualization
1. **Search Results & Paginated Lists**: `GlobalSearchScreen.js` dan beberapa sub-route Belajar saat ini menggunakan `ScrollView` dengan `.map()` untuk merender item. Jika hasil pencarian >50 item, ganti ke `FlatList` dengan `initialNumToRender={10}`, `maxToRenderPerBatch={10}`, dan `windowSize={5}` untuk mencegah alokasi memori berlebih pada perangkat low-end.
2. **Arabic Text Rendering**: Pada `QuranScreen` dan `HadithScreen`, pastikan `lineHeight` teks Arab minimal 1.8× dari `fontSize` (misal font 24pt -> lineHeight 44pt) agar harakat tanwin atas/bawah tidak terpotong (clipped di Android).

---

## 3. Hasil Pengujian
- **Test Suites**: 56 passed, 56 total
- **Tests**: 794 passed, 794 total
- **Snapshots**: 0 failed
- **Platform Verification**: React Native Expo (Android / Web / iOS layout modes).
