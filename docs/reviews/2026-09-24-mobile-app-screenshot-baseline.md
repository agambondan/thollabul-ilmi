# Screenshot Baseline Mobile App (Emulator Native) — Classic vs Modern

Tanggal: `2026-09-24`
Scope: `apps/mobile` (native Android, bukan web export)
Status: `SELESAI` — Sesi 1: 30 screenshot. Sesi 2 (lanjutan, drilling sub-route Belajar/Ibadah):
+22 screenshot baru (termasuk 1 crash bug ditemukan dan didokumentasikan). Beberapa route
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
  dialog crash: `modern-ibadah-sholat-tracker-CRASH.png`. **Perlu di-fix**, bukan cuma
  dicatat — ini blocking, bukan sekadar UI gap.
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
