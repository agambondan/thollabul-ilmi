# Mobile UI/UX Review

Tanggal: `2026-05-13`
Scope: Expo mobile app
Status: `REVIEWED`

## Baseline

Mobile export berhasil:

```bash
npx expo export --platform android --dev --output-dir /tmp/thollabul-review-mobile-export
```

Artinya bundle/parse aman pada saat review, tetapi belum membuktikan semua
interaksi device sudah mulus.

## P0 Findings

### 1. Daily Ayah Di Home Berisiko Gagal

Home mobile memakai `getDailyAyah()`, dan client memanggil endpoint yang belum
ada. Detail ada di [contract sync review](./2026-05-13-contract-sync-review.md).

UX impact:

- widget harian bisa kosong.
- user melihat Home kurang hidup walau API Quran sebenarnya tersedia.

Rekomendasi:

- fix kontrak daily ayah dulu sebelum polish visual Home.
- beri skeleton/error state yang spesifik: "Ayat harian belum tersedia" bukan
  error network generik.

### 2. Sholat Tracker Ada Dua Model Status

Mobile `PrayerScreen` sudah memakai status ibadah yang benar:

- `berjamaah`
- `munfarid`
- `qadha`
- `missed`

Namun sholat tracker di Explore/Belajar memakai boolean/checklist dan menyimpan
status `done`.

UX impact:

- user bisa mencatat sholat dari dua tempat dengan hasil statistik berbeda.
- label "selesai" terlalu dangkal dibanding status sholat yang sebenarnya.

Rekomendasi:

- satukan entry point tracker dengan model `PrayerScreen`.
- jika butuh shortcut cepat, default checked ke `munfarid`, lalu sediakan edit
  status.

## P1 Findings

### 3. Global Search Ke Quran Bisa Terasa Glitch Karena Ada Preview Tambahan

Flow saat klik hasil Quran:

- Global Search membuka tab Quran dengan `surahNumber`, `ayahNumber`, dan
  `ayahId`.
- Quran reader membuka surah, lalu menampilkan target preview di header.
- User masih harus menekan "Lihat posisi dalam surah" untuk scroll ke ayat.

UX impact:

- terasa seperti detail ayat terbuka dua kali: preview di atas dan ayat asli di
  list.
- pada surah panjang, loading awal bisa terasa berat karena reader memuat semua
  page sampai target ayah.

Rekomendasi:

- langsung scroll ke target ayah setelah list siap.
- ubah preview menjadi sticky "hasil pencarian" kecil atau toast, bukan render
  ayat penuh.
- untuk surah besar, load page target dulu lalu prefetch sekitar target.

Status: `STRUCTURAL_FIXED_DEVICE_PENDING` pada slice lanjutan. Quran reader
sekarang auto-scroll ke ayat target saat dibuka dari Global Search dan preview
hasil pencarian menjadi banner kecil, bukan render ayat penuh kedua.

### 4. Gesture Quran Masih Punya Risiko Konflik Dengan Scroll Dan Back Gesture

Quran reader memakai kombinasi:

- `PanResponder`
- `onTouchStart`
- `onTouchMove`
- `onTouchEnd`
- edge guard untuk back gesture Android

UX impact:

- gesture bisa terasa kadang jalan kadang tidak.
- ScrollView/FlatList dan PanResponder sama-sama mencoba membaca gesture.

Rekomendasi:

- pilih satu gesture path utama.
- untuk mode mushaf, pertimbangkan horizontal pager per halaman.
- untuk mode non-mushaf, pindah surah lebih aman via tombol/toolbar plus swipe
  yang hanya aktif di area kosong/header, bukan seluruh list ayah.

Status: `STRUCTURAL_FIXED_DEVICE_PENDING` pada slice lanjutan. Quran reader
sekarang hanya memakai touch tracking dengan edge guard untuk swipe, dan
`PanResponder` dilepas dari `FlatList`/`ScrollView` agar scroll/back Android
tidak berebut dengan dua handler gesture.

### 5. Screen Mobile Masih Banyak State Besar Di Satu File

Contoh risiko:

- `QuranScreen.js` mengurus list surah, reader, mushaf, hafalan, murojaah,
  audio, bookmark, notes, tajweed, gesture, dan settings.
- `ExploreScreen.js` mengurus catalog, detail modal, quiz, tasbih, zakat,
  faraidh, feed, wirid, surah content, sholat tracker, notes, dan bookmarks.

UX/engineering impact:

- regression kecil sulit dilokalisasi.
- state yang tidak aktif bisa ikut tertinggal ketika user berpindah fitur.

Rekomendasi:

- lanjutkan ekstraksi shared component, tetapi tahap berikutnya adalah
  ekstraksi hook per domain:
    - `useQuranReader`
    - `useQuranPreferences`
    - `useHadithReader`
    - `useExploreFeatureDetail`
    - `usePrayerTracker`

### 6. Mobile Feature Catalog Memuat Endpoint Yang Butuh Konteks

Contoh:

- `Wirid` memakai `/api/v1/wirid`, padahal API hanya punya
  `/api/v1/wirid/occasion/:occasion`.
- `Imsakiyah` memakai `/api/v1/imsakiyah`, padahal API butuh `lat` dan `lng`.

UX impact:

- user bisa membuka kartu fitur yang tampak valid tetapi gagal karena input
  konteks tidak ada.

Rekomendasi:

- feature catalog jangan hanya berisi endpoint string.
- tambahkan `requiresLocation`, `requiresAuth`, `requiresInput`, dan custom
  loader per feature.

## P2 Findings

### 7. Bottom Tab Disembunyikan Di Seluruh Tab Quran

Saat ini `TabBar` tidak dirender ketika `activeTab === 'quran'`.

UX tradeoff:

- bagus untuk mode baca.
- tetapi pada list surah/settings awal, user kehilangan navigasi utama.

Rekomendasi:

- hide tab bar hanya ketika `selectedSurah` aktif atau reader mode aktif.
- list surah utama tetap boleh menampilkan tab bar.

### 8. Modal Sheet Sudah Shared, Tetapi Footer Belum Fixed

`AppModalSheet` menerima `footer`, tetapi footer ikut masuk ke body scroll.

UX impact:

- action utama bisa terdorong jauh ke bawah pada konten panjang.

Rekomendasi:

- jadikan footer fixed di bawah sheet.
- beri prop `stickyFooter` default `true` untuk form/action sheet.

Status: `STRUCTURAL_FIXED_DEVICE_PENDING` pada slice lanjutan. `AppModalSheet`
sekarang punya footer sticky default lewat `stickyFooter`, dan `AppActionSheet`
meneruskan slot `footer` ke modal sheet agar action/footer tidak ikut scroll.

## Device Smoke Checklist

Jalankan setelah P0 contract fix:

- Home load ayat/hadis harian.
- Global Search query `sabar` -> klik ayat Quran -> langsung ke posisi ayat.
- Quran mode mushaf swipe kanan/kiri pindah halaman.
- Quran mode non-mushaf swipe kanan/kiri pindah surah.
- Ibadah -> Sholat Tracker -> simpan status -> cek Prayer screen/statistik.
- Belajar -> Wirid/Tahlil/Imsakiyah -> tidak boleh endpoint error polos.
- Hadis list -> detail -> sanad/takhrij/perawi.
