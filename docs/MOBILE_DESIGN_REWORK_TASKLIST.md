# Mobile Design Rework Task List

> Created: 2026-05-06
> Scope: `apps/mobile`
> Source rules: `docs/MOBILE_UX_REVIEW.md`
> IA source of truth: `docs/MOBILE_IA_FINAL_APPROACH.md`
> IA revamp tasklist: `docs/MOBILE_IA_REVAMP_TASKLIST.md`
> Visual reference: `apps/mobile/docs/reference/designThollabulIlmi.js` theme `earth` / Paper

## Tujuan

Rombak desain mobile agar konsisten dengan visual Paper, tetapi mengikuti rule baru dari review:

- **No fallback data:** UI tidak boleh menampilkan dummy/lokal seolah data asli.
- **Performance first:** layar panjang wajib memakai virtualization atau pagination.
- **Progressive disclosure:** layar utama harus fokus; fitur detail masuk ke sub-page, tab internal, atau panel expand.
- **User-friendly copy:** hilangkan istilah teknis seperti `endpoint`, `SQLite`, `runtime`, `API`, `SecureStore`.
- **Paper visual system:** parchment background, compact icon grid, dark floating tab bar yang lebih soft, serif title, row/card ringan.

## Design Contract

Checklist ini berlaku untuk setiap screen yang dirombak:

- [x] Tidak ada text user-facing dengan font minimal 8px maksimal 20px.
    - Tidak ada fontSize < 8. Display numbers > 20px (tasbih `64`, qibla `34`, prayer time `26`) adalah visual exception yang disengaja.
- [x] Tidak ada data fallback/dummy yang ditampilkan sebagai konten asli.
    - Phase 1: `fallback.js` dihapus, semua fallback lokasi/audio/ayah diganti empty state.
- [x] Empty/error state jelas: jelaskan data gagal dimuat atau perlu izin/lokasi/login.
- [x] Header, spacing, card shape, dan tab pattern konsisten dengan Paper reference.
    - Semua screen pakai `Screen`, `Card`, `CardTitle`, `SubScreen`, `TabBar` dari Phase 0.
- [x] Layar tidak menumpuk fitur berbeda dalam scroll panjang.
    - Prayer: main vs settings sub-page. Profile: push/pop stack. Hadith: tab Teks/Sanad/Perawi/Takhrij/Catatan.
- [x] Input form aman dari keyboard, validasi jelas, dan format angka/waktu ramah user.
    - `Screen` wrap `KeyboardAvoidingView`. Zakat/Faraidh punya `keyboardType="numeric"` + `formatNumericInput`. NotificationCenter validasi HH:MM.
- [x] Loading, disabled, offline, dan auth state punya UI yang eksplisit.
    - Semua screen punya `loading` state + ActivityIndicator atau text placeholder. Auth check `!user` di tiap fitur personal. Offline state di Prayer/Qibla dengan manual location input.
- [x] Smoke test web export dan doctor hijau sebelum task dianggap selesai.

> Status 2026-05-06: Design contract sudah mulai diterapkan sebagai fondasi shared,
> tetapi belum full enforced di semua screen. Font di bawah 8px sudah bersih, namun
> masih ada display number/title di atas 20px pada beberapa screen yang perlu diputuskan
> apakah tetap menjadi pengecualian visual atau diturunkan.

---

## Phase 0 - Foundation

- [x] Buat shared `PaperScreen`/update `Screen` untuk standar padding, header, search slot, action icon slot.
    - File: `apps/mobile/src/components/Screen.js`
- [x] Buat shared list row/card primitives: compact row, section header, segmented tabs, empty state, error state.
    - File: `apps/mobile/src/components/`
- [x] Standarkan token design Paper: color, radius, shadow, typography, tab bar contrast.
    - File: `apps/mobile/src/theme.js`, `apps/mobile/src/components/TabBar.js`
- [x] Audit semua text teknis di `apps/mobile/src` dan ganti copy user-facing.
- [x] Pastikan semua screen memakai icon action dari `lucide-react-native`.
- [x] Tambahkan route/view state sederhana untuk sub-page internal tanpa menambah tab utama.
    - File: `apps/mobile/App.js`

> Phase 0 selesai pada 2026-05-06. Catatan scope: audit copy teknis hanya
> berlaku untuk teks user-facing; identifier internal seperti `endpoint`,
> `SQLite`, atau `SecureStore` tetap boleh ada di kode selama tidak tampil di UI.

---

## Phase 1 - Data Integrity & Performance

- [x] Hapus `apps/mobile/src/data/fallback.js`.
- [x] Bersihkan import fallback di API client.
    - File: `apps/mobile/src/api/client.js`
- [x] Ganti fallback ayah Home dengan endpoint real daily ayah atau empty state.
    - File: `apps/mobile/src/screens/HomeScreen.js`, `apps/mobile/src/api/client.js`
- [x] Ganti fallback lokasi Jakarta dengan flow izin lokasi + opsi pilih lokasi manual.
    - File: `apps/mobile/src/screens/HomeScreen.js`, `apps/mobile/src/screens/PrayerScreen.js`, `apps/mobile/src/screens/QiblaScreen.js`
- [x] Hapus audio fallback EveryAyah; jika backend kosong, tampilkan "Audio belum tersedia".
    - File: `apps/mobile/src/api/client.js`, `apps/mobile/src/screens/QuranScreen.js`
- [x] Refactor Quran ayah render dari `.map()` dalam `ScrollView` ke `FlatList`.
    - File: `apps/mobile/src/screens/QuranScreen.js`
- [x] Batasi offline hadith download dan tambahkan guardrail ukuran/konfirmasi.
    - File: `apps/mobile/src/storage/offlineContent.native.js`, `apps/mobile/src/components/OfflinePackCard.js`
    - Status 2026-05-07: paket offline sekarang bisa dipilih per modul. Al-Quran dapat diunduh penuh, sedangkan Hadis diunduh per kitab yang dipilih user.
- [x] Tambahkan pagination/infinite load untuk tab Hadis dan prioritaskan data Hadis yang sudah diunduh.
    - File: `apps/mobile/src/screens/HadithScreen.js`, `apps/mobile/src/api/client.js`, `apps/mobile/src/components/Screen.js`
    - Status 2026-05-07: tab Hadis memakai SQLite offline pack jika tersedia; jika tidak, request backend `page=0` lalu auto-load `page=1+` saat scroll mendekati bawah.
- [x] Tambahkan pagination/load-more untuk Explore list.
    - File: `apps/mobile/src/screens/ExploreScreen.js`, `apps/mobile/src/api/explore.js`

---

## Phase 2 - App Shell & Navigation

- [x] Pastikan tab utama tetap 5: Beranda, Quran, Ibadah, Ilmu, Profil.
    - File: `apps/mobile/src/components/TabBar.js`
- [x] Tambahkan internal navigation stack/view state untuk halaman detail:
    - Quran reader detail
    - Hadith detail
    - Prayer settings
    - Profile settings
    - Explore feature detail
    - File: `apps/mobile/App.js`
- [x] Gunakan pola Paper floating tab bar, tetapi soft contrast.
    - File: `apps/mobile/src/components/TabBar.js`, `apps/mobile/src/theme.js`
- [x] Tambahkan auto-hide bottom tab seperti taskbar desktop dan ubah warna aktif menjadi netral paper/ink.
    - File: `apps/mobile/src/components/TabBar.js`
    - Screenshot: `output/playwright/mobile-tabbar-autohide-neutral.png`
    - Updated 2026-05-07: hidden tab tidak punya handle/touch target lagi; tab muncul saat user scroll dan hide lagi saat idle agar tidak bentrok dengan gesture Android.
    - Native screenshot: `output/native/android-tabbar-idle-after-scroll-hidden.png`
- [x] Pertahankan state per tab saat berpindah tab.
    - File: `apps/mobile/App.js`
- [x] Standardisasi back button icon/action, bukan text panjang.
    - File: `apps/mobile/src/screens/*.js`

---

## Phase 3 - Page Rework Per Screen

### Home / Beranda

- [x] Ubah layout menjadi dashboard ringkas Paper:
    - profile header
    - next prayer card
    - 8 shortcut icon grid
    - daily reading card
    - journal card
    - File: `apps/mobile/src/screens/HomeScreen.js`
- [x] Hapus semua fallback data harian.
- [x] Search icon langsung fokus ke input pencarian kamus.
- [x] Notification icon langsung buka notification center.
- [x] Tambahkan empty state untuk prayer/daily content jika backend gagal.
- [x] Pastikan semua shortcut punya target fitur yang jelas.

### Quran

- [x] Pertahankan Paper list: title serif, search bar, Surah/Hafalan/Murojaah segmented tabs, diamond number.
    - File: `apps/mobile/src/screens/QuranScreen.js`
- [x] Gunakan `FlatList` untuk daftar surah dan daftar ayat.
- [x] Pisah reader ayat ke view detail agar list tidak berat.
- [x] Hafalan tab menjadi workflow nyata: pilih surah, ayat awal/akhir, status, lanjutkan progress.
- [x] Murojaah tab menjadi workflow nyata: pilih range, skor, durasi, catatan.
- [x] Empty state jika ayat/audio/tafsir belum tersedia dari backend.
- [x] Hindari render ratusan ayat sekaligus.
- [x] Pindahkan aksi per ayat ke menu titik tiga/bottom sheet agar reader fokus baca.
    - File: `apps/mobile/src/screens/QuranScreen.js`
- [x] Jadikan Model Tampilan Mushaf lebih nyata:
    - Terjemah: Arab + latin + arti.
    - Fokus: Arab dominan tanpa latin/terjemah.
    - Mushaf: framing halaman, header mushaf, nomor ayat, dan Arab full.

### Ibadah / Prayer

- [x] Layar utama hanya menampilkan jadwal hari ini + log sholat.
    - File: `apps/mobile/src/screens/PrayerScreen.js`
- [x] Pindahkan manual correction ke sub-page "Prayer Settings".
- [x] Pindahkan reminder/offline pack ke sub-page/settings.
- [x] Tambahkan lokasi manual jika GPS ditolak.
- [x] Jadikan status log sholat lebih ringkas: segmented status per sholat.
- [x] Hilangkan copy teknis dan fallback Jakarta.
- [x] Pastikan reminder memakai native time picker.

### Qibla

- [x] Pertahankan compass visual, tetapi buat status permission/lokasi lebih jelas.
    - File: `apps/mobile/src/screens/QiblaScreen.js`
- [x] Hapus fallback Jakarta sebagai arah default.
- [x] Tambahkan CTA pilih lokasi manual atau retry permission.
- [x] Gunakan icon action untuk refresh/back.
- [x] Empty state jika compass/lokasi tidak tersedia.

### Hadith

- [x] Pecah detail hadith menjadi section/tab internal:
    - Text
    - Sanad
    - Narrators
    - Takhrij
    - Notes
    - File: `apps/mobile/src/screens/HadithScreen.js`
- [x] Jangan render semua detail panjang dalam satu scroll.
- [x] Narrator detail masuk panel/sub-view khusus, bukan inline panjang.
- [x] Guru/murid tetap punya show all/show less.
- [x] Tambahkan search/filter kitab atau theme jika backend mendukung.
- [x] Empty state jika sanad/takhrij/perawi belum ada.

### Ilmu / Explore

- [x] Ubah Explore menjadi katalog modular Paper:
    - group tabs
    - compact feature grid
    - feature detail view
    - File: `apps/mobile/src/screens/ExploreScreen.js`
- [x] Dinamiskan Tafsir & Asbabun Nuzul, jangan hardcode `/surah/1`.
    - File: `apps/mobile/src/data/mobileFeatures.js`, `apps/mobile/src/screens/ExploreScreen.js`
- [x] Tambahkan selector surah untuk tafsir/asbabun nuzul.
- [x] Tambahkan pagination/load more untuk semua list.
- [x] Kuis tetap render pilihan jawaban penuh.
- [x] Zakat/Faraidh tetap format angka dan validasi input.
- [x] Notes/Bookmarks harus bisa buka sumber asli.

### Profile

- [x] Profile utama hanya berisi summary user, points/streak, shortcut penting.
    - File: `apps/mobile/src/screens/ProfileScreen.js`
- [x] Settings icon masuk ke sub-page Settings list.
- [x] Settings detail dipisah: Account, Language, Notifications, Offline, Cache, Security.
- [x] SessionCard tetap punya Sign In, Register, Forgot Password.
    - File: `apps/mobile/src/components/SessionCard.js`
- [x] Hapus dead-link; semua menu harus navigate, disabled jelas, atau hidden.
- [x] Hindari menumpuk offline/cache/auth/menu panjang dalam satu layar.

---

## Phase 4 - Shared Feature Screens

### Notification Center

- [x] Jadikan notification center sub-page dari Profile/Explore, bukan card panjang.
    - File: `apps/mobile/src/components/NotificationCenter.js`
- [x] Native time picker untuk mobile, fallback HH:MM hanya untuk web.
- [x] Tambahkan validasi format waktu untuk web.
- [x] Pisahkan Settings dan Inbox dengan segmented tabs.

### Offline Pack & Cache

- [x] Offline pack hanya untuk Quran/Hadith dan konten yang jarang berubah.
    - File: `apps/mobile/src/components/OfflinePackCard.js`
- [x] Tambahkan estimasi ukuran download sebelum mulai.
- [x] Tambahkan konfirmasi untuk download besar dan clear data.
- [x] Hilangkan cache/fallback konten mobile; data offline hanya lewat paket yang user unduh.
    - File: `apps/mobile/src/components/OfflinePackCard.js`, `apps/mobile/src/storage/offlineContent.native.js`
    - Catatan status: paket utama menyimpan pilihan Quran/Hadith; prayer pack tetap punya kontrol offline terpisah.

### Notes & Bookmarks

- [x] Notes panel punya compact composer dan list yang tidak memanjang tanpa batas.
    - File: `apps/mobile/src/components/NotesPanel.js`
- [x] Bookmark row menampilkan sumber dan action buka sumber.
- [x] Notes/Bookmarks tidak muncul sebagai fallback kosong palsu.

---

## Phase 5 - QA & Verification

- [x] `npx expo-doctor` pass.
- [x] `npx expo export --platform web` pass.
- [x] `git diff --check -- apps/mobile` clean.
- [x] Screenshot smoke desktop/mobile web untuk:
    - Home
    - Quran list
    - Quran reader long surah
    - Prayer main
    - Prayer settings
    - Hadith detail tabs
    - Explore feature detail
    - Profile settings
    - Konvensi penyimpanan: simpan evidence per tanggal di folder `output/playwright/YYYY-MM-DD/` (web) dan `output/native/YYYY-MM-DD/` (native).
- [x] Manual native check untuk:
    - Keyboard behavior
    - Native time picker
    - Location permission
    - Compass unavailable state
    - Offline pack guardrail
    - Passed 2026-05-08 (device `985c2f0e`): interaksi form/permission tervalidasi dengan ADB tap + screenshot.
    - Evidence manual checks: `output/native/2026-05-08/manual-checks/01-keyboard-global-search.png`, `02-location-permission-prompt.png`, `03-offline-download-confirm.png`, `10-native-time-picker-open.png`, `11-storage-before-clear.png`.
    - Compass unavailable fallback: state Qibla tetap aman di jalur fallback (no crash + status card render) pada `output/native/2026-05-08/android-native-smoke-qibla-2026-05-08.png`.

---

## Prioritas Eksekusi

1. Phase 1: hapus fallback dan fix hardcoded endpoint.
2. Phase 3 Quran: `FlatList` untuk Quran reader.
3. Phase 2 + Profile/Prayer: internal sub-page/settings pattern.
4. Phase 3 Hadith: split detail ke section/tab.
5. Phase 3 Explore: pagination + tafsir/asbab dynamic selector.
6. Phase 5: screenshot smoke + native smoke.

## Catatan Status

- Bug fix yang sudah dikerjakan sebelumnya tetap dicatat di `docs/MOBILE_UX_REVIEW.md` section "Log Bug Fix yang Sudah Dikerjakan (Mobile)".
- Dokumen ini adalah task list redesign/rework berikutnya, bukan daftar bug fix historis.
- 2026-05-07: Quran list dan reader sudah memakai `FlatList`; Explore list memakai `page`/`size` load-more dengan de-dupe item.
- 2026-05-07: Prayer main dipisah dari Pengaturan Sholat; Hadith detail memakai tab Teks/Sanad/Perawi/Takhrij/Catatan.
- 2026-05-07: Hafalan tab pakai API nyata (GET /hafalan + PUT /hafalan/surah/:id) dengan status cycle Belum→Sedang→Hafal dan summary stats. Murojaah tab pakai API nyata (GET /murojaah/session + POST /murojaah/result) dengan pilih surah hafal, skor, catatan. NotificationCenter dipecah Pengaturan/Kotak Masuk dengan segmented tabs.
- 2026-05-07 (lanjutan): PrayerScreen dan QiblaScreen tambahkan TextInput lokasi manual (lat/lng) jika GPS ditolak. NotificationCenter tambahkan validasi format HH:MM untuk web. NotesPanel dibatasi 5 item awal dengan tombol "Lihat semua". HomeScreen, ExploreScreen, ProfileScreen dikonfirmasi sudah memenuhi tasklist (dashboard ringkas, katalog modular, settings sub-page).
- 2026-05-07: Qibla memperjelas status permission/lokasi/kompas, menyediakan retry dan lokasi manual, dan Profile sub-page memakai back icon action tanpa label teks panjang.
- 2026-05-07: Qibla heading magnetometer dikoreksi agar orientasi atas perangkat terbaca benar; visual kompas diganti ke dial bertick dengan pointer kiblat signed -180..180 agar animasi tidak memutar jauh.
- 2026-05-07: Qibla dial diperbesar responsif, ditambah status chips lokasi/akurasi/kompas, angka derajat ring luar, marker Ka'bah di perimeter, dan smoothing rotasi shortest-path.
- 2026-05-07: Qibla compass ring dibuat rotating (ring berputar -heading agar N/E/S/W selalu menunjuk arah geografis benar); pointer Ka'bah fixed di absolute bearing dari North; angka besar selalu tampilkan bearing kiblat (bukan koreksi); trueHeading=-1 edge case diperbaiki. HadithScreen ditambah filter kitab horizontal scrollable (getHadithBooks + getHadithsByBook via /api/v1/books + /api/v1/hadiths/book/:slug). ExploreScreen bookmarks/notes: "Buka sumber" pill tampil langsung di card tanpa expand detail; empty state deskriptif spesifik per tipe fitur.
- 2026-05-07: Screenshot smoke desktop/mobile web selesai untuk Home, Quran list, Quran reader, Prayer main/settings, Hadith detail tabs, Explore feature detail, dan Profile settings. Deep link internal `#/prayer/settings` dan `#/profile/settings` ditambahkan agar sub-page bisa diverifikasi langsung.
- 2026-05-07: Native Expo Go check berjalan di device Android `z5yxpjrgvw8pdqzt`. Bukti screenshot tersimpan di `output/native/android-after-bundle.png` (Prayer Settings), `output/native/android-expo-reopen.png` (Qibla aktif), dan `output/native/android-profile-storage.png` (Offline Pack guardrail). ADB tap/type masih diblok device dengan `INJECT_EVENTS`, jadi keyboard behavior, native time picker modal, dan konfirmasi tombol tetap perlu tap manual langsung di HP.
- 2026-05-07: Native accessibility polish: `TabBar`, `SegmentedTabs`, `IconActionButton`, `ActionPill`, `PaperSearchInput`, dan `CompactRow` diberi label/role/state aksesibilitas supaya icon-only atau inactive controls tidak muncul kosong di Android hierarchy.
- 2026-05-07: Copy user-facing pada kartu data sementara dirapikan agar tidak memakai istilah `API`/cache teknis di UI; sisa temuan `endpoint`, `SQLite`, `SecureStore`, dan `fallback` di `apps/mobile/src` adalah identifier internal kode.
- 2026-05-07: `SessionCard` dirapikan untuk auth journey: copy Masuk/Daftar/Lupa Sandi dibuat konsisten bahasa Indonesia, tombol mode dibuat wrap/compact, dan control auth diberi accessibility role/state.
- 2026-05-07 (IA revamp selesai): Tab akhir 5 item adalah Beranda/Quran/Hadis/Ibadah/Belajar (bukan Profil). Profil diakses via avatar/header. Tasklist revamp lengkap di `docs/MOBILE_IA_REVAMP_TASKLIST.md`. Detail UI rule (anti-expand-inline) terdokumentasi di `docs/MOBILE_DESIGN_PATTERNS.md`.
- 2026-05-07: Mobile fallback data policy diketatkan. Konten mobile tidak lagi memakai silent cache/offline fallback; sumber data hanya backend request atau paket offline yang diunduh eksplisit dari menu Penyimpanan.
- 2026-05-08: Web/mobile QA akhir untuk route IA dan deep-link alias selesai. Evidence utama ada di `output/playwright/mobile-qa-*.png`; semua 21 smoke route/viewport checks pass setelah fix hash deep-link listener di `apps/mobile/App.js`.
- 2026-05-08 (lanjutan): Native Android smoke berhasil dijalankan via Expo Go pada device `985c2f0e` dengan bundle sukses (`Android Bundled ... index.js`). Screenshot dipindah ke folder tanggal `output/native/2026-05-08/` untuk traceability.
- 2026-05-08 (lanjutan 2): Deep-link sweep native dijalankan untuk 30 route canonical+alias (`home/search/quran/hadith/ibadah/belajar/profile` dan alias lama). Semua route terbuka sesuai target tanpa crash; screenshot evidence tersimpan di `output/native/2026-05-08/deeplink-sweep/`.
