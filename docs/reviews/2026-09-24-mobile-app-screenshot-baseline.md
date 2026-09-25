# Screenshot Baseline Mobile App (Emulator Native) — Classic vs Modern

Tanggal: `2026-09-24`
Scope: `apps/mobile` (native Android, bukan web export)
Status: `SELESAI` — Sesi 1: 30 screenshot. Sesi 2 (lanjutan, drilling sub-route Belajar/Ibadah):
+22 screenshot baru (termasuk 1 crash bug ditemukan dan didokumentasikan). Sesi 4
(2026-09-25, rebuild penuh): 82 screenshot menutupi semua 47 fitur di
`MOBILE_USE_CASE_FLOWS.md`, 6 bug baru + 6 regresi terverifikasi fixed. Beberapa route
tetap tidak reachable / dilewati — lihat detail di masing-masing bagian "Gap" per sesi.

Screenshot lama di `output/` (`output/playwright/`, `output/native/2026-05-*`, dll.) sudah basi —
diambil sebelum unifikasi theme system (`LayoutModeProvider`, Classic vs Web App) dan sebelum
banyak redesign IA. Dokumen ini jadi baseline baru, diambil langsung dari APK native yang
di-build dan dijalankan di Android emulator (bukan `expo start --web`), supaya render-nya
representatif ke device asli.

## Setup

- Emulator: AVD `tholabul_pixel_7_api36` (Pixel 7, API 36, google_apis x86_64), headless
  (`-no-window -gpu swiftshader_indirect`), sudah ada di mesin ini sejak sesi sebelumnya —
  tidak perlu install SDK dari nol.
- Build: `cd apps/mobile/android && JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 ./gradlew assembleRelease`
  (release dipakai, bukan debug — debug butuh Metro nyala dan banner LogBox-nya geser posisi
  tab bar sehingga koordinat tap jadi tidak stabil).
- Package: `com.anonymous.thullaabulilmimobile`.
- Semua screenshot: `apps/mobile/output/native/2026-09-24/*.png`.

## Temuan penting buat kerjaan berikutnya

- **Lokasi toggle Classic/Modern**: Profile → Pengaturan → Tampilan → bagian "Mode Layout"
  (radio "Classic" vs "Web App"). Ini preference tersimpan (`AsyncStorage`), bukan state
  sesi — bertahan lewat force-stop/relaunch.
- **Rute Ibadah-hub yang sebenarnya hidup di tab Belajar**: kartu Doa, Dzikir, Asmaul Husna,
  Tasbih, Kalender Hijriah, Imsakiyah, Masjid di hub Ibadah menavigasi ke navigator stack tab
  **Belajar** (`WebAppDoaRoute.js`, `WebAppAsmaulRoutes.js`, dst di `src/screens/explore/`) —
  tab bar akan highlight "Belajar" walau kartu ditekan dari Ibadah. Bukan bug, ini arsitektur
  shared-route yang sudah ada.
- **Tab bar Classic auto-hide bikin koordinat tap gak stabil** kalau sudah pernah scroll —
  tap paling reliable dilakukan segera setelah fresh launch, sebelum scroll apa pun.
- **APK stale bisa crash**: APK release yang sempat ke-build ~08:45 (sebelum sesi ini) crash
  `ReferenceError: Property 'selectedSurah' doesn't exist` di ExploreScreen — itu APK lama,
  sudah tidak match sama working tree `ExploreScreen.js`/`WebApp*Route.js` yang lagi diedit
  sesi agent lain (lihat `git status`). Rebuild fresh sudah tidak crash. Kalau ada APK lama di
  `android/app/build/outputs/apk/release/` yang dipakai tempat lain, disarankan rebuild ulang.

## Screenshot yang berhasil diambil

### Modern (Web App) — 17 screen

| Screen                                 | File                                |
| -------------------------------------- | ----------------------------------- |
| Beranda                                | `modern-beranda.png`                |
| Al-Quran (list)                        | `modern-quran.png`                  |
| Al-Quran reader (Al-Fatihah)           | `modern-quran-surah-reader.png`     |
| Hadis (hub)                            | `modern-hadis.png`                  |
| Hadis reader (Shahih Bukhari list)     | `modern-hadis-reader.png`           |
| Hadis detail                           | `modern-hadis-detail.png`           |
| Ibadah (hub)                           | `modern-ibadah.png`                 |
| Ibadah → Jadwal Sholat                 | `modern-ibadah-prayer.png`          |
| Ibadah → Qibla                         | `modern-ibadah-qibla.png`           |
| Ibadah → Khatam (gated login)          | `modern-ibadah-khatam.png`          |
| Ibadah → Tasbih Digital                | `modern-ibadah-tasbih.png`          |
| Ibadah → Doa                           | `modern-ibadah-doa.png`             |
| Ibadah → Asmaul Husna                  | `modern-ibadah-asmaul-husna.png`    |
| Belajar (hub)                          | `modern-belajar.png`                |
| Belajar → Kajian                       | `modern-belajar-kajian.png`         |
| Belajar → Feed Komunitas (empty state) | `modern-belajar-feed-komunitas.png` |
| Profile                                | `modern-profile.png`                |

### Classic — 13 screen

| Screen                                                    | File                              |
| --------------------------------------------------------- | --------------------------------- |
| Beranda                                                   | `classic-beranda.png`             |
| Al-Quran (list)                                           | `classic-quran.png`               |
| Al-Quran reader (Al-Anfal, scrolled)                      | `classic-quran-reader.png`        |
| Hadis (hub, Sunan Abu Daud)                               | `classic-hadis.png`               |
| Hadis detail (tab Teks/Sanad/Perawi/Takhrij/Ayat/Catatan) | `classic-hadis-detail.png`        |
| Ibadah (hub)                                              | `classic-ibadah.png`              |
| Ibadah → Jadwal Sholat (tanpa lokasi)                     | `classic-ibadah-prayer.png`       |
| Ibadah → Qibla (tanpa lokasi)                             | `classic-ibadah-qibla.png`        |
| Belajar (hub)                                             | `classic-belajar.png`             |
| Belajar → Leaderboard                                     | `classic-belajar-leaderboard.png` |
| Belajar → Radio Islam                                     | `classic-belajar-radio-islam.png` |
| Belajar → Muhasabah/Jurnal (gated login)                  | `classic-belajar-muhasabah.png`   |
| Profile                                                   | `classic-profile.png`             |

### Revisi: full-page capture untuk hub/dashboard (2026-09-24, sore)

Screenshot awal semua single-viewport (1 layar, ~1080×2400) — untuk screen dashboard
yang komponennya bervariasi (bukan list item identik berulang), ini memotong konten
yang ada di bawah fold. 8 file berikut sudah diganti (nama file sama, isi full-page
hasil stitch beberapa segmen scroll, dedup overlap otomatis):

| File                  | Dimensi baru | Segmen scroll |
| --------------------- | ------------ | ------------- |
| `modern-beranda.png`  | 1080×3812    | 3             |
| `modern-ibadah.png`   | 1080×4977    | 4             |
| `modern-belajar.png`  | 1080×8040    | 7             |
| `modern-profile.png`  | 1080×2430    | 2             |
| `classic-beranda.png` | 1080×6200    | 5             |
| `classic-ibadah.png`  | 1080×5022    | 4             |
| `classic-belajar.png` | 1080×7784    | 7             |
| `classic-profile.png` | 1080×2838    | 2             |

`modern-quran.png`, `classic-quran.png`, `modern-hadis.png`, `classic-hadis.png` **sengaja
tidak diubah** (tetap single-viewport, ~2400px tinggi) — isinya list 114 surah / daftar kitab
hadis dengan row yang identik berulang, jadi scroll penuh cuma menghasilkan gambar panjang
tanpa informasi baru.

## Gap (sengaja dilewati atau hilang) — Sesi 1

- Settings screen (Profile → Pengaturan) sempat kecapture di kedua tema tapi filenya
  ke-hapus gak sengaja pas proses rename temp file — tidak dicapture ulang karena budget waktu.
- ~25 sub-route Belajar lainnya (Tafsir, Fiqh, Siroh, Kamus, Perawi, Quiz, Zakat, Faraidh,
  Imsakiyah, Blog, Library, dll — lihat `src/screens/explore/WebApp*Route.js`) belum
  di-screenshot sama sekali di kedua tema. Sub-screen drilling cuma dilakukan menyeluruh untuk
  tema Modern; Classic cuma kebagian beberapa yang ketemu gak sengaja (Leaderboard, Radio
  Islam, Muhasabah).
- Semua screen di-capture dari fresh install: tanpa akun login dan tanpa izin lokasi, jadi
  Jadwal Sholat/Qibla/Khatam/Muhasabah/Feed Komunitas nunjukkin empty/gated state, bukan data
  asli terisi.

## Sesi 2 (2026-09-24, lanjutan) — Drilling sub-route + child/detail

Tujuan sesi ini: nutup gap "~25 sub-route belum di-screenshot" di atas, dan drilling
minimal 1 level lagi (list → child/detail) sesuai concern user ("masih banyak button
yang bisa dipencet"). Semua di tema **Modern**, fresh install (belum login, belum izin
lokasi), emulator sama (`tholabul_pixel_7_api36`), APK release yang sama (tidak rebuild).

### Temuan penting

- **Bug ditemukan — Sholat Tracker crash total**: kartu "Sholat Tracker" / "Log Sholat" di
  hub Ibadah (section "Rencana") bikin app crash ("Thullaabul Ilmi keeps stopping"),
  reproduced 2x. Root cause dari `adb logcat`:
  `FATAL EXCEPTION: mqt_v_native — JavascriptException: Element type is invalid: expected
a string ... but got: undefined`. Dugaan kuat: `WebAppSholatTrackerRoute.js` meng-import
  `Mosque` dari `lucide-react-native` (`import { CheckCircle2, Circle, Mosque } from
"lucide-react-native"`) — kemungkinan `Mosque` bukan export valid di versi
  `lucide-react-native` yang dipakai, jadi komponen `undefined` saat dirender. Screenshot
  dialog crash: `modern-ibadah-sholat-tracker-CRASH.png`. **FIXED** — `Mosque` diganti
  `Landmark` di `WebAppSholatTrackerRoute.js` (icon yang sama dipakai `MobileMenuSheet.js`),
  diverifikasi ulang di emulator: Sholat Tracker render normal, tidak crash lagi.
- **Menu item "Amalan" (hamburger menu) salah arah**: tap "Amalan" di Menu → "Ibadah &
  Tracker" cuma buka hub Ibadah biasa (`view` kosong), bukan feature "Amalan Harian"
  (`featureKey: "amalan"`). Reproduced 2x. Kartu "Amalan Harian" sendiri tidak ketemu di
  hub Ibadah maupun hub Belajar manapun — kemungkinan `amalan` memang belum di-wire ke
  UI card manapun selain lewat menu yang salah arah ini.
- **Forum Tanya Jawab dan Perpustakaan (Library) tidak reachable dari UI mana pun** yang
  dicoba: tidak ada di hub Belajar (`belajarFeatureGroups` di `data/mobileFeatures.js`
  memang tidak menyertakan key `forum`/`library`), tidak ada di hub Ibadah, tidak ada di
  hamburger menu (`layout/MobileMenuSheet.js` tidak punya entry untuk keduanya), dan
  search bar hub Belajar (`FeatureCatalog`) mengembalikan "Tidak ada hasil" untuk query
  "forum", "library", maupun "perpustakaan". `WebAppForumRoute.js` dan
  `WebAppLibraryRoute.js` tetap ada di kode dan ke-render kalau `activeFeature.key`
  match, tapi tidak ada tombol/link mana pun di build ini yang mengarah ke sana — kandidat
  dead code atau fitur yang sengaja disembunyikan sementara.
- **`WebAppToolRoute.js` kemungkinan besar unreachable**: `WEB_APP_TOOL_ROUTE_CONFIGS` di
  file itu adalah objek kosong (`{}`), dan route ini hanya dirender kalau
  `WEB_APP_TOOL_ROUTE_CONFIGS[activeFeature?.type]` truthy — jadi secara matematis tidak
  akan pernah ke-trigger kecuali config-nya diisi. Tidak dicoba screenshot karena tidak ada
  entry point.
- **Search bar hub Belajar** ("Cari kajian, tafsir, kamus, perawi, quiz...") ternyata
  scope-nya terbatas ke fitur tertentu saja (lihat `LOCAL_TOOL_TYPES` di
  `FeatureCatalog.js`) — banyak keyword yang gagal match meski fitur ada di app (mis.
  "library", "perpustakaan"). Jangan asumsikan search ini exhaustive untuk QA berikutnya.
- **Kamus Arab dan Tafsir**: pencarian kata di Kamus Arab ("iman", "kitab", "air") selalu
  "Tidak ada hasil" — mungkin data kamus di backend kosong/beda skema, atau butuh keyword
  Arab. Tafsir: pilih surah (Al-Fatihah) berhasil (header berubah jadi "Surah 1", card
  ter-highlight hijau), tapi konten tafsir ayat tidak pernah muncul di layar manapun
  (sudah discroll penuh) — kemungkinan bug render atau butuh state/reload tambahan yang
  tidak ke-trigger oleh tap biasa.
- **Artikel (Blog)** stuck di "Memuat artikel..." (loading spinner tidak pernah resolve)
  dan **Sejarah Islam** stuck di "Memuat sejarah..." dengan "0 peristiwa tersedia" — dua-duanya
  dicapture sebagai loading state apa adanya, tidak ditunggu lebih lama karena budget waktu
  (kemungkinan endpoint lambat/gagal, bukan dicoba root-cause lebih jauh di sesi ini).
- **Navigasi balik tidak konsisten**: dari sub-feature Belajar, hardware Back (atau tombol
  back di header) sering lompat langsung ke tab **Beranda**, bukan balik ke hub Belajar —
  dan tab bar Belajar setelahnya menampilkan feature terakhir yang dibuka (state ke-cache),
  bukan reset ke hub. Satu-satunya cara reliable untuk balik ke hub bersih di sesi ini
  adalah force-stop + relaunch app per rute, bukan navigasi in-app. Ini kemungkinan UX bug
  tersendiri (kehilangan hub state), dicatat sebagai temuan meski di luar scope screenshot.

### Screenshot baru (Modern), 1 level drilling atau lebih

| Screen (Belajar hub)                    | Level 1 (list/hub)                                   | Level 2 (detail/child)                                                                         | Catatan                                                                                              |
| --------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Komunitas                               | `modern-belajar-komunitas.png`                       | —                                                                                              | Gated login, empty state, tidak ada child untuk didrill                                              |
| Artikel (Blog)                          | `modern-belajar-blog.png`                            | —                                                                                              | Stuck loading, tidak ada child                                                                       |
| Siroh                                   | `modern-belajar-siroh.png`                           | `modern-belajar-siroh-detail.png` (Nasab Rasulullah, full detail)                              | Full 2-level drill                                                                                   |
| Fiqh Ringkas                            | `modern-belajar-fiqh.png`                            | `modern-belajar-fiqh-detail.png` (kategori Thaharah)                                           | Full 2-level drill                                                                                   |
| Wirid Saya                              | `modern-belajar-wirid-saya.png`                      | —                                                                                              | Gated login (Masuk untuk membuat wirid pribadi)                                                      |
| Kamus Arab                              | `modern-belajar-kamus.png`                           | `modern-belajar-kamus-search.png` (search "air", no result)                                    | Search dicoba 3 keyword, semua no-result                                                             |
| Tafsir                                  | `modern-belajar-tafsir.png`                          | `modern-belajar-tafsir-surah-selected.png` (Al-Fatihah dipilih)                                | Konten ayat tidak pernah muncul — lihat temuan di atas                                               |
| Quiz Islami                             | `modern-belajar-quiz.png`                            | `modern-belajar-quiz-answer.png` (jawaban salah + pembahasan)                                  | Full 2-level drill, termasuk feedback jawaban                                                        |
| Leaderboard                             | `modern-belajar-leaderboard.png` (tab Streak Sholat) | `modern-belajar-leaderboard-hafalan.png` (tab Hafalan)                                         | 2 varian tab, bukan child terpisah tapi state berbeda                                                |
| Modul & Kelas (Lessons)                 | `modern-belajar.png` (existing)                      | `modern-belajar-lessons-detail.png` (lesson "Tata Cara Wudhu", step wizard "Langkah 1 dari 7") | 2-level: pilih modul → auto-buka lesson detail dengan step navigator                                 |
| Sejarah Islam (referensi)               | `modern-belajar-referensi-sejarah-islam.png`         | —                                                                                              | Stuck loading "0 peristiwa tersedia", representasi `WebAppReferenceListRoute.js`                     |
| Kalender Hijri (Ibadah hub)             | `modern-belajar-hijri.png`                           | —                                                                                              | Halaman tunggal, tidak ada item list yang bisa di-tap lebih dalam                                    |
| Imsakiyah (Ibadah hub)                  | `modern-belajar-imsakiyah.png`                       | —                                                                                              | Tabel jadwal bulanan, baris tidak clickable                                                          |
| Kalkulator Zakat (Ibadah hub)           | `modern-belajar-zakat.png`                           | —                                                                                              | Tab "Riwayat" (WebAppZakatHistoryRoute) dicoba tapi tap tidak ke-register, tidak sempat dicoba ulang |
| Kalkulator Waris / Faraidh (Ibadah hub) | `modern-belajar-faraidh.png`                         | —                                                                                              | Halaman kalkulator, belum diisi data ahli waris                                                      |
| Sholat Tracker (Ibadah hub)             | —                                                    | `modern-ibadah-sholat-tracker-CRASH.png`                                                       | **CRASH** — lihat temuan bug di atas, tidak bisa dicapture state normalnya                           |

### Rute yang TIDAK berhasil di-screenshot sama sekali, dan kenapa

- **Forum Tanya Jawab** (`WebAppForumRoute.js`) — tidak ada entry point di UI manapun yang
  dicoba (hub Belajar, hub Ibadah, hamburger menu, search bar hub Belajar). Lihat temuan.
- **Perpustakaan / Library** (`WebAppLibraryRoute.js`) — sama, tidak ada entry point yang
  jalan; menu item "Library" di hamburger menu di-tap 2x, tidak menavigasi kemana pun.
- **Perawi Hadis** (`WebAppPerawiRoute.js`) — sempat coba raih dari hub Belajar bagian
  Referensi, keburu kehabisan waktu sebelum sempat drill; belum tercapture sesi ini.
- **Zakat History / Riwayat** (`WebAppZakatHistoryRoute.js`) — tab "Riwayat" di Kalkulator
  Zakat ter-cut di layar (perlu scroll horizontal tab), 2x tap tidak berhasil pindah tab,
  tidak dicoba ulang karena budget waktu.
- **WebAppToolRoute.js** — dead code / unreachable secara struktural (lihat temuan), tidak
  ada gunanya dicoba dicari entry point-nya.
- **Amalan Harian** (`WebAppAmalanRoute.js`) — menu "Amalan" salah arah ke hub Ibadah (lihat
  temuan), tidak ketemu card lain yang mengarah ke feature ini di build sekarang.
- **Classic theme untuk semua rute di atas** — sesi ini fokus 100% ke Modern sesuai arahan
  (breadth di Modern lebih penting daripada parity tema); tidak ada waktu tersisa untuk
  mengulang di Classic.

### Setup catatan tambahan

- Emulator ternyata dalam kondisi **tema Classic** di awal sesi ini (bukan Modern seperti
  akhir sesi 1) — tidak jelas kenapa preference berubah, mungkin sesi/agent lain yang
  memakai emulator yang sama sempat toggle. Di-switch manual balik ke Modern via Profile →
  Pengaturan → Tampilan → Mode Layout → "Web App" di awal sesi.
- Ditemukan pola reset yang reliable untuk kembali ke hub bersih setelah membuka
  sub-feature: `adb shell am force-stop <package>` lalu `am start` ulang, karena navigasi
  in-app (back button, tab tap) tidak konsisten mengembalikan ke hub (lihat temuan navigasi
  di atas). Ini menambah overhead ~6-8 detik per rute tapi jauh lebih reliable daripada
  mengandalkan back navigation.

## Sesi 3 (2026-09-24, lanjutan) — Riset flow Login & Jadwal Sholat/Reminder

Tujuan: ground-truth dua user flow buat didiagramkan di `assets/design/mobile.pen`
(lihat [`MOBILE_PENDEV_REDESIGN.md`](../MOBILE_PENDEV_REDESIGN.md)) — Login dan
Jadwal Sholat & Set Reminder. Fresh install (Login) dan lokasi manual Jakarta
(-6.2088/106.8456, Jadwal Sholat) karena GPS emulator tidak pernah memberi fix asli.

### Login

Tidak ada onboarding/intro carousel — alur asli: splash blank → dialog izin lokasi (OS,
bukan UI app) → Beranda mode tamu → avatar header → dropdown menu (Profil/Bookmark/
Catatan/Statistik/Notifikasi/toggle tema/bahasa) → Profil → tile "Masuk / Daftar" → layar
**"Akun"**. Login/Daftar/Lupa-Sandi **bukan 3 route terpisah** — satu komponen
(`SessionCard.js`) dengan 3-way tab switcher. Tab Masuk: tombol "Masuk dengan Google"
(`expo-web-browser` OAuth ke `/api/v1/auth/google?source=mobile`) + divider "ATAU" +
email/password. Tab Daftar: sama + Nama, toggle channel verifikasi Email/WhatsApp
(WhatsApp aktif, expose field nomor HP), password + ulangi password. Tab Lupa Sandi:
email + "Kirim Tautan Reset". 13 screenshot tersimpan (`modern-login.png`,
`modern-register.png`, `modern-register-whatsapp.png`, `modern-forgot-password.png`,
`modern-avatar-menu.png`, dst + varian classic).

### Jadwal Sholat & Set Reminder

Alur: Beranda → Ibadah → "Jadwal Sholat" → layar Jadwal (sekarang dengan lokasi manual,
data waktu sholat asli) → icon gear di header → **layar yang sama** swap ke view
"Pengaturan Sholat" (bukan modal/route terpisah, state lokal di `PrayerScreen.js`) → card
"Pengingat Adzan": toggle "Notifikasi Lokal" (memicu dialog izin POST_NOTIFICATIONS
pertama kali), toggle "Audio Adzan" (buka picker 8 suara muadzin), pill "JEDA PENGINGAT"
(0/5/10/15/30 menit), multi-select "WAKTU SHOLAT" (Subuh–Isya), tombol "Atur ulang
pengingat". Field/preference key lengkap ada di `src/storage/preferences.js` dan
`src/utils/adzanSounds.js`.

- **Bug ditemukan & FIXED — toggle "Audio Adzan" di tema Modern bikin card Pengingat
  Adzan hilang/blank**: root cause di `PrayerScreen.js` — blok render daftar
  `ADZAN_SOUNDS` (picker suara muadzin) ke-duplikat, nyangkut di dalam `.map()` baris
  koreksi waktu per-sholat (harusnya cuma ada di dalam card "Pengingat Adzan", persis
  seperti versi Classic yang sudah benar). Efeknya, picker suara ikut ke-render ulang di
  setiap baris koreksi ketika toggle aktif — bukan cuma salah tempat, juga jadi sumber
  crash/blank-render yang dilaporkan. Blok duplikat dihapus, `npm test -- --runInBand`
  full (56 suite/790 test) tetap hijau setelah fix.
- Tab bar Classic sempat gak konsisten muncul di accessibility tree setelah cold
  launch/scroll — kemungkinan sama dengan flakiness yang sudah dicatat di sesi sebelumnya.

## Sesi 4 (2026-09-25) — Rebuild penuh + screenshot semua 47 fitur

Tujuan: rebuild APK dari working tree terbaru (banyak perubahan belum-commit dari sesi
paralel lain masuk ke build ini), install ulang di emulator, dan screenshot ulang
**semua 47 fitur** di [`MOBILE_USE_CASE_FLOWS.md`](../MOBILE_USE_CASE_FLOWS.md) sebagai
checklist — supaya ketahuan kalau ada drift antara app asli dan mockup `mobile.pen`.
Task read-only QA, tidak ada source code yang diubah.

### Setup

- Build & install sama seperti sesi sebelumnya (`assembleRelease`, JAVA_HOME
  java-17-openjdk, `adb install -r`, tidak ada signature mismatch).
- Build path ini tidak set `EXPO_PUBLIC_API_URL` → fallback ke API production
  `https://api.thollabulilmi.site` (lihat `src/api/client.js`), jadi semua data yang
  tampil (soal quiz, harga emas Zakat, 165 hasil global search, dll) itu data asli.
- Lokasi di-set manual Jakarta (`adb emu geo fix 106.8456 -6.2088`) — jalan buat waktu
  sholat di Beranda, tapi Qibla tetap stuck "Mendeteksi lokasi..." terlepas dari geo fix.
- Chronicle MCP unreachable (`connection refused :18081`) di awal sesi — infra issue di
  luar kendali sesi ini, dilanjut tanpa Chronicle.
- **Catatan penamaan folder**: screenshot tersimpan di
  `apps/mobile/output/native/2026-09-26/` (82 file) — nama folder salah tanggal (harusnya
  `2026-09-25`, sesuai tanggal sesi asli), kemungkinan agent salah hitung tanggal saat
  bikin folder. Bukan bug kode, cuma penamaan; dibiarkan apa adanya biar link ke file di
  bawah tetap valid. Folder ini gitignored sama seperti baseline sesi 1-3, jadi tidak
  ke-commit.

### Coverage vs 47-fitur `MOBILE_USE_CASE_FLOWS.md`

Captured (tema Modern kecuali disebut lain): 1, 2a/b/c, 3a/b (3c cuma di Classic — lihat
bug di bawah), 4a/b, 5, 6a/c/f (6b/6e parsial, 6d kelewat), 7, 8, 9, 10a/b, 11-16, 17a,
18-26, 29, 30, 32-40, 41 (broken state), 43 (alias behavior — lihat bug), 44 (bug), 45,
46, 47. Plus bonus di luar 47-list: Perawi Hadis (list + diagram Sanad), Jurnal
Muhasabah Modern, dropdown avatar, full flow login/register/lupa-sandi, global search
165 hasil, dan spot-check Classic (Beranda full-page, Hadis hub/detail, Quran list + tab
Murojaah yang jalan normal, Profile guest).

**Dilewati/tidak lengkap:**

- **10c (counter Wirid Asmaul Husna), 27/28 (tile cepat Hafalan/Jurnal sebagai screen
  terpisah), 31 (Catatan Pribadi), 42 (Peta Interaktif)** — budget waktu, atau (Peta
  Interaktif) kena dead-end bug yang persis sama dengan Tokoh Islam jadi duplikat
  screenshot dianggap tidak worth waktunya.
- **6b/6d/6e** (dialog izin notifikasi, state reminder-off, toast konfirmasi) — AVD ini
  sudah pernah grant `POST_NOTIFICATIONS` dari sesi sebelumnya (bukan fresh install) jadi
  dialognya gak muncul lagi; tap reminder-off ke-miss dan gak dicoba ulang; toast
  konfirmasi gak sempat ke-capture.
- **3d (tap kata / Mufrodat)** — gak berhasil dipicu di UI manapun. Root cause di kode:
  `QuranScreenRenderers.js` cuma render layout per-kata kalau `hasPerKataDataForAll`
  true untuk SEMUA ayat di halaman mushaf itu; kondisi ini gak kejadian di halaman yang
  dicoba, dan fallback row layout-nya emang gak punya touch target per-kata sama sekali.
- **17b (Diskusi & Komentar)** — ke-block sama gated/empty state Komunitas (butuh post
  asli yang gak ada tanpa login).
- **Splash / dialog izin lokasi OS** — gak ke-capture ulang karena AVD ini sudah pernah
  grant izinnya dari sesi sebelumnya (bukan indikasi regresi kode, cuma state AVD).
- **Tema Classic** — cuma spot-check sesuai prioritas task (Modern duluan). Tab bar
  Classic invisible total pas cold launch sesi ini — lebih parah dari catatan baseline
  sesi 1 ("auto-hide setelah scroll") — dan makan waktu navigasi signifikan.

### Bug baru ditemukan sesi ini

1. **Menu "Tokoh Islam" dan "Peta Interaktif" dead-end** — dua-duanya cuma buka hub
   Belajar polos, bukan target screen-nya. Root cause: `MobileMenuSheet.js` baris
   231-244, dua entry ini gak punya field `params: { featureKey: ... }`.
   `WebAppShell.js` baris 84 (`onTabChange?.(item?.tab ?? item?.key, item?.params ??
null)`) fallback ke `null` params kalau gak diisi, jadi gak ada feature spesifik yang
   ke-select. Key asli yang terdaftar di `data/mobileFeatures.js`: `"tokoh"` dan
   `"historical-map"` — belum di-wire ke `params` entry menu manapun. Screenshot:
   `modern-tokoh-islam.png`.
2. **Menu "Amalan" masih salah arah ke hub Ibadah polos** — bug class sama dengan #1,
   sudah didokumentasikan di Sesi 2 di atas, dikonfirmasi **MASIH ADA**
   (`modern-amalan.png`).
3. **Tab Hafalan & Murojaah di Al-Quran gak ke-reach sama sekali di tema Modern** —
   `QuranScreen.js` baris 1915-1919 force-reset `quranTab` balik ke `"surah"` tiap kali
   `isWebAppLayout` true. Confirmed jalan normal di Classic
   (`classic-quran-murojaah.png`), confirmed force-reset di Modern.
4. **Menu "Tilawah" cuma alias tab Quran**, bukan tracker screen tersendiri (`tab:
"quran"` di `MobileMenuSheet.js` baris 102) — sama juga entry "Hafalan"/"Muroja'ah" di
   menu. Perlu di-flag karena `MOBILE_USE_CASE_FLOWS.md`/`mobile.pen` mengasumsikan flow
   dedicated buat fitur-fitur ini.
5. **Modul & Kelas lesson detail nampilin "Langkah 1 dari 0"** — total step counter 0
   padahal ini step-wizard (`modern-belajar-lessons-detail-langkah0-bug.png`).
6. **Chip filter kategori Panduan Sholat nampilin teks mentah kutipan hadis** bukan label
   kategori yang bersih (`modern-belajar-panduan-sholat.png`).

### Bug lama dikonfirmasi MASIH ADA

- Tafsir: pilih surah ke-highlight tapi konten ayat gak pernah render
  (`modern-belajar-tafsir-surah-selected.png`).
- Kamus Arab: search selalu "Tidak ada hasil" bahkan buat chip "Kosakata Populer" bawaan
  app sendiri kayak "Iman" (`modern-belajar-kamus-search.png`).

## Sesi 5 (2026-09-25, lanjutan) — Fix batch atas temuan Sesi 4

Semua item fixable di atas dikerjakan paralel (6 agent + 1 fix manual), diverifikasi unit
test + rebuild APK/emulator sebelum commit (`d3964972`).

**FIXED:**

- **#1 Menu "Tokoh Islam"/"Peta Interaktif" dead-end** — `MobileMenuSheet.js` sekarang
  set `params: { featureKey: "tokoh" }` / `{ featureKey: "historical-map" }`, mengikuti
  pola entry "Target Belajar" yang sudah lebih dulu benar. Verified: Tokoh Islam
  ke-reach normal (`01-tokoh-islam.png`); Peta Interaktif routing-nya sekarang benar
  juga, TAPI screen-nya sendiri crash — lihat "Bug baru ditemukan sesi ini" di bawah.
- **#2 Menu "Amalan" salah arah** — root cause ternyata dua lapis: `params.featureKey`
  memang belum diset (sama seperti #1), TAPI menambahkannya saja tidak cukup karena
  `App.js` tidak pernah mengoper `deepLinkTarget` ke `IbadahScreen` sama sekali (beda
  dengan Quran/Hadith/Belajar/Profile yang menerimanya). Fix final: route "Amalan" ke
  `tab: "belajar"` (bukan `"ibadah"`) — konsisten dengan arsitektur yang sudah
  didokumentasikan di Sesi 1 ("kartu Doa/Dzikir/Asmaul Husna di hub Ibadah menavigasi ke
  stack tab Belajar, bukan bug"). Verified via emulator: PASS.
- **#4 (bagian Hafalan/Muroja'ah)** — bukan bug di `QuranScreen.js` (itu guard code
  disengaja untuk gap desain Modern yang belum ada UI switcher-nya, dikonfirmasi via git
  archaeology `commit b0bae822`). Fix real: `MobileMenuSheet.js` "Tilawah"/"Hafalan"/
  "Muroja'ah" di-route ke `tab: "belajar"` + `featureKey` masing-masing (dashboard Modern
  untuk ketiganya ternyata SUDAH ada, cuma belum di-wire). Verified via emulator: PASS
  untuk ketiganya (nampilkan judul + login-gate yang benar, bukan hub kosong generik).
- **#5 Modul & Kelas "Langkah 1 dari 0"** — root cause: `normalizeExploreItem()` di
  `explore.js` strip field `steps` dari item API asli (cuma nyisa di `item.raw.steps`),
  `WebAppLessonsRoute.js` baca `activeModule?.steps` langsung yang jadi `undefined`.
  Fix: fallback ke `raw.steps`. Verified via emulator: "Langkah 1 dari 7" (real count).
- **#6 Chip Panduan Sholat nampilin citation mentah** — root cause: `SholatGuide` gak
  punya field kategori sama sekali, `getFilterCategory()` di
  `WebAppReferenceListRoute.js` fallback ke field `meta` (citation hadis). Fallback
  dihapus. Verified via emulator: chip bersih (Semua/Wudhu/Sholat/Sunnah/Dzikir/Umum).
- **Kamus Arab search selalu kosong** (bug lama) — root cause BUKAN data/backend (66
  entri tersedia, endpoint jalan normal, dikonfirmasi curl ke local + production).
  `handleSelectSuggestion` di `WebAppKamusRoute.js` cuma ngisi kotak search tanpa
  pernah manggil API. Fix: trigger search langsung saat chip di-tap. Ditambah test
  regresi di `exploreScreen.test.js`. Verified via emulator: hasil nyata muncul untuk
  "Iman".

**TIDAK di-fix, dilaporkan terpisah:**

- **Tafsir "konten ayat gak render"** (bug lama) — ditelusuri end-to-end (route
  backend, seed data, response shape, render tree via integration test) dan **gak bisa
  direproduksi** di `master` yang bersih — kemungkinan besar laporan Sesi 4 diambil dari
  APK yang di-build dari working tree kotor (banyak perubahan belum-commit sesi lain
  ikut ke-build), bukan dari `master` bersih. Perlu re-test dari build bersih sebelum
  dianggap masih ada.
- **"Tilawah"/"Hafalan"/"Muroja'ah" bukan tracker dedicated** (poin #4 sebagian) — sudah
  terjawab: dashboard-nya memang sudah ada, tinggal login-gate normal untuk guest.
  Bukan gap desain lagi.

**Bug BARU ditemukan sesi ini (efek samping verifikasi fix #1):**

- **"Peta Interaktif" sekarang routing benar tapi APP CRASH TOTAL saat screen dibuka.**
  `logcat`: `java.lang.RuntimeException: API key not found ... com.rnmaps.maps.MapView`.
  Dikonfirmasi: `AndroidManifest.xml` gak punya `com.google.android.geo.API_KEY`
  meta-data sama sekali, dan gak ada Google Maps API key dikonfigurasi di manapun di
  repo (`app.json`, `.env*`). Ini **bukan bug kode** — fitur peta butuh credential asli
  dari Google Cloud Console (dengan billing aktif) yang cuma bisa disediakan pemilik
  project, bukan sesuatu yang bisa di-fix lewat kode. **Prioritas naik** dibanding
  sebelumnya: dulu cuma dead-end diam-diam, sekarang app crash total begitu user tap
  menu ini — perlu keputusan: (a) urus API key beneran, atau (b) sementara tambah guard
  supaya nunjukkin "Peta belum tersedia" alih-alih crash, sampai key-nya ada.

### Bug lama dikonfirmasi FIXED (regression check pass)

- Sholat Tracker/Log Sholat crash (`Mosque` icon, lihat Sesi 2) — gak crash lagi, render
  normal (`modern-ibadah-log-sholat.png`).
- Audio Adzan duplicate-block di `PrayerScreen.js` (lihat Sesi 3) — picker muadzin
  render normal di tempatnya, gak blank/crash (`modern-ibadah-prayer-audio-adzan.png`).
- Forum Tanya Jawab — sekarang ke-reach langsung dari hub Belajar
  (`modern-belajar-forum.png`), sebelumnya gak ada entry point (Sesi 2).
- Perpustakaan/Library — sekarang ke-reach & fungsional
  (`modern-belajar-perpustakaan.png`), sebelumnya gak ada entry point (Sesi 2).
- Sejarah Islam — sekarang load 20 event asli, gak stuck "0 peristiwa" lagi (Sesi 2)
  (`modern-belajar-sejarah-islam.png`).
- Artikel/Blog — sekarang load konten, gak infinite spinner lagi (Sesi 2)
  (`modern-belajar-blog.png`) — meski ada 2 gambar render placeholder abu-abu kosong
  (kemungkinan broken image URL yang terpisah, bukan bug loading-state).

Semua screenshot: `apps/mobile/output/native/2026-09-26/*.png` (lihat catatan penamaan
folder di atas), konvensi nama file `modern-`/`classic-` konsisten dengan sesi
sebelumnya.
