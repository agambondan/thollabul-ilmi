# Mobile Quran Reader Polish

Status: `IN_PROGRESS`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Merapikan pengalaman baca Al-Quran di mobile supaya terasa seperti reader
utama, bukan list data biasa.

## Scope

- Mobile:
  - mode baca Quran: normal, clean/line, grid/card, dan mushaf
  - font Quran yang relevan untuk Arab, bukan font generik seperti sans/mono
  - ukuran Arab yang bisa turun sampai ukuran kecil sesuai preferensi user
  - ayah marker yang rapi dan tidak keluar dari baris
  - gesture kanan/kiri:
    - mode mushaf untuk pindah halaman
    - mode selain mushaf untuk pindah surah
  - tab bar disembunyikan ketika reader Quran aktif agar tidak mengganggu
  - hasil Global Search ke Quran langsung mengarah ke ayat target tanpa
    preview ayat penuh ganda di header
- API:
  - tetap memakai endpoint Quran existing seperti `GET /ayah/page/:page` dan
    `GET /ayah/surah/number/:number`
- Data:
  - tajweed color dan mapping mushaf page perlu tetap divalidasi dari dataset

## Current Baseline

- Quran sudah first-class tab.
- Reader sudah punya surah list, detail ayah, navigator, hafalan, murojaah,
  progress, bookmark, notes, tafsir/asbab/settings modal.
- Mode mushaf sudah dieksplor, tetapi layout mushaf asli punya batas teknis
  karena rendering text reflow tidak sama dengan image mushaf cetak.

## Task List

1. Rapikan marker ayah dan angka Arab pada mode non-mushaf.
2. Pastikan font selector hanya menawarkan font Arab yang masuk akal.
3. Validasi kembali tajweed color pada data dan renderer.
4. Jaga gesture tidak bentrok dengan back gesture Android.
5. Smoke test di device Expo yang aktif.

## Acceptance Criteria

- font Quran benar-benar berubah saat dipilih
- ukuran Arab bisa turun di bawah 22px
- marker ayah tidak keluar dari teks
- arti muncul saat mode hafalan `Normal`
- mode mushaf berpindah halaman dengan swipe, bukan scroll panjang
- mode selain mushaf berpindah surah dengan swipe

## Evidence

- Backend Quran lookup hardening:
  - `services/api/app/repository/ayah_repository.go` sekarang memakai order
    column qualified (`"ayah".id`) pada query join Translation/Surah agar tidak
    rawan ambiguous `id` saat paginated Quran endpoint dipanggil.
  - `GET /api/v1/ayah/daily` sekarang memilih ayah harian dari jumlah ayat
    aktual di DB melalui service, bukan angka hardcoded `6236` di controller.
  - `services/api/app/repository/ayah_repository_test.go` menutup query
    `FindAll`, `FindByNumber`, `FindBySurahNumber`, `FindByPage`,
    `FindByHizbQuarter`, dan `FindDaily`.
  - `services/api/app/services/ayah_service_test.go` menjaga daily ayah tetap
    berada dalam range count DB dan error saat count kosong.
- Mobile search-to-reader hardening:
  - `apps/mobile/src/screens/QuranScreen.js` sekarang auto-scroll sekali ke
    ayat target setelah Global Search membuka reader surah.
  - preview hasil pencarian di reader diubah menjadi banner kecil, bukan
    render ayat penuh kedua, sehingga ayat target hanya dibaca dari daftar
    utama.
- Mobile gesture hardening:
  - Quran reader sekarang memakai satu jalur gesture swipe berbasis touch
    tracking dengan edge guard, bukan kombinasi `PanResponder` plus touch
    handler yang bisa berebut dengan `FlatList`/`ScrollView`.
- Mobile ayah action hardening:
  - teks ayat di mode non-mushaf bisa diketuk untuk membuka halaman detail
    penuh.
  - menu 3-dot ayat menjadi `Aksi Cepat` dan menaruh `Buka Detail` sebagai
    aksi utama, sedangkan tafsir, asbabun nuzul, audio, progres, bookmark, dan
    catatan tetap berupa aksi cepat.
- `cd services/api && go test ./app/repository` `PASS`.
- `cd services/api && go test ./app/controllers ./app/services ./app/repository ./app/http`
  `PASS`.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-search-target-export`
  `PASS`.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-quran-gesture-export`
  `PASS`.
- Refactor hook tahap pertama:
  - preference reader Quran diekstrak ke
    `apps/mobile/src/hooks/useQuranReaderPreferences.js`.
  - hook mengelola ukuran font Arab, pilihan font Arab, mode tampilan, dan
    mode hafalan.
  - `QuranScreen` tetap memegang audio/qari, data reader, bookmark, notes, dan
    gesture agar behavior runtime tidak berubah besar dalam satu slice.
  - `node --check apps/mobile/src/hooks/useQuranReaderPreferences.js` `PASS`.
  - `node --check apps/mobile/src/screens/QuranScreen.js` `PASS`.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-step5-quran-hook-export`
    `PASS`.
- `node --check apps/mobile/src/screens/QuranScreen.js` `PASS`.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-global-action-sheet-export`
  `PASS`.
- 2026-05-18: Edge guard increased to 48px to avoid collision with Android back gesture. All 575 mobile tests pass.
- Device smoke 2026-05-14:
  - `adb devices -l` mendeteksi `POCOPHONE_F1`.
  - `make mobile-status` menunjukkan Expo `exp://10.13.55.208:19007`,
    API `http://localhost:9900`, dan `adb reverse` aktif untuk `19007`/`9900`.
  - Deep link `exp://10.13.55.208:19007/--/quran/2` membuka Al-Baqara tanpa
    fatal/redbox/network error pada logcat snapshot.
  - Screenshot evidence: `/tmp/thollabul-smoke/quran-2-2026-05-14.png`.
  - Hasil visual smoke: nama surat sebelum/sesudah tampil, arti muncul di mode
    normal, marker ayat tidak keluar dari teks pada viewport yang dicek, dan
    tajweed color terlihat.
- Device smoke gesture kanan/kiri masih belum bisa divalidasi otomatis karena
  MIUI memblokir `adb shell input tap/swipe/keyevent` dengan `INJECT_EVENTS`.
- Device probe 2026-05-16:
  - Device `985c2f0e` terdeteksi oleh ADB, tetapi masih `no permissions`.
  - `make mobile-status` gagal di `adb reverse` karena `insufficient
    permissions for device`, jadi smoke ulang reader Quran pada device belum
    valid untuk menggantikan evidence 2026-05-14.

## Source of Truth

- `docs/MOBILE_IA_FINAL_APPROACH.md`
- `docs/MOBILE_FEATURE_REFERENCE.md`
- `apps/mobile/src/screens/QuranScreen.js`
