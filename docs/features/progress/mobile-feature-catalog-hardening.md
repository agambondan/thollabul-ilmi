# Mobile Feature Catalog Hardening

Status: `VERIFIED_STRUCTURAL`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Menjadikan katalog fitur mobile sebagai source of truth yang konsisten untuk
Beranda, Semua Fitur, Belajar, Global Search, dan deep link feature.

## Scope Slice Ini

- Wording katalog dirapikan:
    - `Doa harian dan pilihan`
    - `Perawi Hadis`
    - `Quran dan hadis tersimpan`
- Directory Home menambahkan icon khusus untuk:
    - Doa
    - Dzikir
    - Faraidh
- Sholat Tracker di Explore memakai key API `subuh`, bukan legacy `shubuh`.
- Response `/api/v1/sholat/today` dinormalisasi dari object log server ke
  boolean state UI.
- Cross-tab shortcut seperti Home -> Qibla sekarang menyimpan `returnTab`,
  sehingga tombol back/tutup internal route balik ke tab asal, bukan root tab
  target.
- Status lokasi di Home sekarang memisahkan koordinat GPS dari reverse geocode:
  jika koordinat tersedia tapi nama kota gagal dibaca, UI tetap menampilkan
  `LOKASI AKTIF` dan jadwal sholat tetap dicoba dari koordinat tersebut.
- Home memakai fallback last-known location dan refresh ulang saat tab Home
  aktif kembali dari state `LOKASI NONAKTIF` / `LOKASI BELUM TERSEDIA`.
- Tab Ibadah menghapus shortcut hero `Jadwal Sholat` dan `Qibla` di bagian
  atas karena keduanya sudah tersedia di group menu `Harian` dan `Arah & Waktu`.
- Detail fitur di tab Belajar sekarang memakai judul fitur aktif di header,
  misalnya `Tafsir`, `Kamus Arab`, atau `Perawi Hadis`, bukan selalu `Belajar`.
- Tafsir di mobile membaca data ayat dan penjelasan dari response nested,
  menampilkan panel `Tafsir Jalalain` dan `Tafsir Quraish Shihab`, membuka
  akses semua 114 surah lewat pencarian selector, dan menghapus copy teknikal
  dari empty/instruction state.
- Card konten Belajar sekarang bisa diketuk untuk membuka halaman detail penuh;
  menu 3-dot dipersempit menjadi action sheet aksi cepat seperti buka detail,
  bookmark, dan buka sumber.
- Pattern action sheet 3-dot diseragamkan dengan Hadis: judul sheet menjadi
  `Aksi Cepat`, sementara detail tetap dibuka dari tap card atau aksi
  `Buka Detail`.
- Katalog konten mobile sekarang mengirim `limit` dan `offset` bersama
  `page`/`size`, lalu memuat halaman berikutnya otomatis saat scroll mendekati
  bawah. Tombol manual `Muat lebih banyak` dihapus agar tidak tampil ketika
  semua data sudah terload.
- Infinite scroll membaca `meta.has_more` saat API mengirim `meta=1`; endpoint
  yang memakai paginator lama seperti Feed/Kajian/Blog/Siroh/Perawi dibaca dari
  payload page, sedangkan Doa, Dzikir, Tahlil, Fiqh, Manasik, Sejarah, Asmaul
  Husna, Jarh wa Ta'dil, Tafsir, dan Asbabun Nuzul punya response meta opt-in.
- Explore list aktif dirender lewat mode `FlatList` di shared `Screen`, bukan
  `items.map` di dalam `ScrollView`, agar list panjang lebih stabil di Android.

## Evidence

- `node --check apps/mobile/src/data/mobileFeatures.js`
- `node --check apps/mobile/src/screens/HomeScreen.js`
- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `node --check apps/mobile/src/api/explore.js`
- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-infinite-scroll-export`
- `node --check apps/mobile/src/components/Screen.js`
- `node --check apps/mobile/src/api/social.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-pagination-flatlist-export`
- `cd services/api && go test ./app/repository ./app/services ./app/controllers ./app/http`
- `git diff --check`
- `node --check apps/mobile/src/screens/HadithScreen.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-global-action-sheet-export`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-step4-mobile-export`
- `node --check apps/mobile/App.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-qibla-back-fix-export`
- `node --check apps/mobile/src/screens/HomeScreen.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-home-location-fix-export`
- `node --check apps/mobile/src/screens/IbadahScreen.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-ibadah-dedupe-export`
- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-belajar-title-export`
- `node --check apps/mobile/src/api/explore.js`
- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-tafsir-mobile-polish-export`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-tafsir-mobile-polish-export-2`
- `adb shell am start -a android.intent.action.VIEW -d exp://10.102.116.208:19007/--/belajar/tafsir`
- `adb exec-out screencap -p > /tmp/thollabul-tafsir-mobile-selector.png`
- `node --check apps/mobile/src/screens/ExploreScreen.js`

## Remaining

- Device smoke tap manual untuk Semua Fitur, Belajar deep link, Tafsir content,
  dan Sholat Tracker masih perlu dilakukan karena ADB input presisi diblok MIUI.
- Device smoke infinite scroll belum dijalankan pada slice ini karena `adb devices`
  tidak menampilkan device tersambung.
- Perlu audit lanjutan agar semua endpoint catalog yang butuh auth punya badge
  dan empty state yang eksplisit.
