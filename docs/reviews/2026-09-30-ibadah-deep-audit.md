# Deep Audit: Fitur Ibadah (Modern & Classic) — 2026-09-30

> Audit MENDALAM (bukan sweep dangkal) satu fitur: Ibadah di `apps/mobile`,
> mengikuti metodologi yang sama dengan
> [2026-09-25-quran-deep-audit.md](./2026-09-25-quran-deep-audit.md) dan
> [2026-09-30-hadis-deep-audit.md](./2026-09-30-hadis-deep-audit.md). Setiap
> kontrol interaktif dicoba manual satu per satu: hub Ibadah (16 baris), Jadwal
> Sholat + Pengaturan Sholat (metode, mazhab, koreksi menit, pengingat, audio
> adzan, jadwal offline, lokasi manual, izin), Qibla, Khatam, Tasbih, Sholat
> Tracker, Kalkulator Zakat, Kalkulator Waris, Imsakiyah, Kalender Hijriah, Doa,
> Dzikir, Wirid, Wirid Saya, Asmaul Husna, Masjid, Manasik, deep link, hardware
> back, dan persistensi state. Dua tema diuji: Modern (Web App, 5-tab) dan
> Classic (Paper).

**Status**: 27 bug dilaporkan (7 HIGH, 13 MEDIUM, 7 LOW), plus 14 catatan
tambahan (gap data, temuan tooling/environment, dan beberapa temuan peripheral
di luar scope Ibadah). Sebagian besar bug berlaku di kedua tema karena kodenya
dipakai bersama; yang khusus satu tema ditandai di judul. **Tidak ada crash
aplikasi** sepanjang sesi (`pidof` dicek setelah setiap interaksi berisiko;
crash buffer kosong dan DropBox tidak punya entri crash untuk
`com.thullaabulilmi.app` hari ini). Satu hipotesis dari brief — deep link
`ibadah/prayer` cuma ganti tab — **terbantahkan** (lihat C1). Screenshot:
`apps/mobile/output/native/2026-09-30-ibadah-deep-audit/*.png`.

## Setup

- Build: **tidak di-rebuild**. APK yang terpasang (`lastUpdateTime` 16:53) lebih
  baru dari `app-release.apk` hasil build 16:52, jadi dianggap fresh. Package
  `com.thullaabulilmi.app`; package lama `com.anonymous.thullaabulilmimobile`
  ikut ter-install di emulator tapi **tidak pernah disentuh**.
- Emulator: `tholabul_pixel_7_api36` (Android 16 / API 36, `userdebug`, zona
  waktu Asia/Jakarta) sudah jalan. `adb devices -l` hanya menampilkan
  `emulator-5554`; semua perintah pakai `adb -s emulator-5554` eksplisit. Tidak
  ada device fisik lain yang tersentuh.
- Backend: API produksi `https://api.thollabulilmi.site`. Sesi guest (Tamu)
  sepanjang audit; fitur yang butuh login (Khatam, Sholat Tracker, Wirid Saya)
  hanya diverifikasi guest-gating-nya, bukan alur simpan datanya.
- Lokasi: `adb emu geo fix` **tidak bisa dipakai** (lihat "Temuan tooling #3").
  Dipakai `appops set 2000 android:mock_location allow` +
  `cmd location providers add-test-provider gps|network` + loop latar belakang
  yang mendorong Jakarta (-6.2088, 106.8456) tiap 2 detik. Semuanya dicabut di
  akhir sesi (provider dihapus, appop dikembalikan ke `default`, loop dimatikan).
- Akhir sesi: `pm clear com.thullaabulilmi.app` (supaya alarm yatim dari B1
  tidak terus bunyi di emulator), izin notifikasi + lokasi di-`pm grant` lagi,
  layout kembali ke default **Web App (Modern)**, tema "Ikuti Sistem".

## Metodologi & catatan penting

- Koordinat tap diambil dari `uiautomator dump` (native 1080×2400), bukan
  eyeball dari screenshot. Dua helper dibuat di scratchpad: `ui` (dump + parse
  bounds) dan `hidekb` (tutup keyboard **hanya kalau `mInputShown=true`**).
- **Temuan tooling #1**: layar **Jadwal Sholat utama** tidak bisa di-dump sama
  sekali (`could not get idle state`) karena countdown berdetak tiap detik —
  sama kasusnya dengan carousel Beranda di audit Hadis. Di layar itu koordinat
  diambil dari screenshot × 1.2 lalu dikonfirmasi lewat hasil tap; layar
  Pengaturan Sholat (statis) bisa di-dump normal.
- **Temuan tooling #2**: animasi sistem emulator mati
  (`animator_duration_scale=0`), jadi semua spinner tampil sebagai gambar diam.
  Saya membedakan "loading" vs "ikon statis" lewat perbandingan piksel antar
  screenshot (selisih nol = tidak beranimasi).
- **Temuan tooling #3**: `adb emu geo fix` membalas `OK` tapi tidak mengubah
  lokasi yang dilihat app. Lokasi terakhir emulator menempel di Ukiah,
  California (39.237, -123.150): GNSS HAL baru mempublikasikan fix kalau ada
  client yang meminta GPS, sedangkan `getCurrentPositionAsync({})` (akurasi
  Balanced) tidak pernah menyentuh GPS. Akibatnya kartu jadwal di Beranda
  sempat menampilkan Subuh 19:27 dengan label "UKIAH" — itu **artefak
  emulator, bukan bug app**. Setelah mock provider dipasang pun, tanpa loop
  yang terus mendorong lokasi, `getCurrentPositionAsync` time-out ±20 detik
  (itulah yang memunculkan B7 untuk pertama kali).
- **Bukan bug app** (kesalahan metode sendiri, semuanya dikonfirmasi ulang
  sebelum disimpulkan): (a) beberapa tap jatuh di atas keyboard yang sedang
  terbuka (lng masuk ke kolom lat); (b) `KEYCODE_BACK` saat keyboard sudah
  tertutup diteruskan ke app dan menutup layar; (c) `am kill` lalu `am start -d`
  dengan URL baru membuat deep link itu hilang dan app kembali ke URL
  peluncuran lama (perilaku Android untuk task yang prosesnya mati — dipakai `am force-stop`
  untuk cold start deterministik); (d) tab bar Classic "hilang" — ternyata
  **auto-hide 2,8 detik** by design (`TabBar.js`, `AUTO_HIDE_DELAY = 2800`),
  muncul lagi lewat aktivitas scroll/sentuh; (e) `input text` yang sangat cepat
  sesekali menjatuhkan karakter (dicek di layar lain: tidak terjadi, jadi hanya
  dicatat sebagai bukti di B13 karena terjadi konsisten di layar itu).
- **Kalibrasi jadwal**: jadwal Jakarta dari app (Kemenag/Shafi: Imsak 04:10,
  Subuh 04:20, Terbit 05:38, Dzuhur 11:43, Asr 14:49, Maghrib 17:47, Isya 18:56)
  dicek ulang dengan rumus astronomi (Fajr -20°, Isya -18°, bayangan Asr
  1× Syafi'i / 2× Hanafi, deklinasi ≈ -2,9°, EoT ≈ +10 mnt): semua cocok dalam ±1 menit; Hanafi
  menggeser Asr ke 15:59 (hitungan 16:00); MWL Subuh 04:28. Bearing Qibla Jakarta
  295° dan jarak 7.920 km juga cocok. **Logika waktu sholat tidak bermasalah**;
  masalahnya ada di sekeliling (pengingat, cache, lokasi, dst).
- Bug yang dilaporkan dikonfirmasi lewat sumber independen bila mungkin:
  `dumpsys alarm` / `dumpsys notification` / logcat `notification_enqueue` untuk
  pengingat, `dumpsys audio` untuk adzan, `curl` ke API produksi untuk data
  Dzikir/Doa/Asmaul Husna/Masjid, dan menjalankan `lib/faraidh.js` (salinan di
  scratchpad, sumber **tidak diubah**) di Node untuk kalkulator waris.
- Di Classic, baris hub yang mengarah ke Belajar diuji lewat deep link
  ekuivalen `belajar/<key>` (hub memanggil `onOpenTab("belajar", {featureKey})`
  yang sama persis); Khatam, Qibla, dan Jadwal diketuk dari hub.
- **Lingkungan berubah di tengah sesi**: backend produksi ter-deploy sekitar
  pukul 19:00 (respons `/api/v1/doa` tiba-tiba memuat `translation`; lihat C3).
  Pengamatan sebelum itu ditandai. API juga sempat membalas **HTTP 429** saat
  audit (lihat B7 dan C3) — sebagian besar traffic itu dari audit ini sendiri.
- Build dijalankan dari working tree; `git status` menunjukkan tidak ada diff di
  `apps/mobile` (perubahan yang ada hanya dokumen dari sesi agent lain, tidak
  disentuh).

---

## Temuan Bug

### B1. [Modern & Classic] Pengingat sholat dijadwalkan DUA KALI, dan "Mati" tidak membatalkan semuanya — HIGH

- **Lokasi**: `apps/mobile/src/screens/PrayerScreen.js` — `toggleReminder`
  (baris 632–642), `syncPrayerReminders` (580–630), `useEffect` sinkronisasi
  pengingat (765–781); pola yang sama di `adjustPrayer` (390–400),
  `selectReminderLead` (644–653), `toggleReminderPrayer` (667–679). Penjadwal:
  `apps/mobile/src/utils/prayerNotifications.js` — `schedulePrayerReminders`
  (111–160) dan `cancelPrayerReminders` (74–85).
- **Expected**: menyalakan "Notifikasi Lokal" menjadwalkan **satu** notifikasi
  per waktu sholat terpilih; chip "N aktif" = jumlah alarm sungguhan; "Mati"
  membatalkan semuanya.
- **Actual**: **WRONG BEHAVIOR, 100% reproducible**, juga dari data bersih
  (`pm clear`, pengaturan default: jeda 10 menit, 5 waktu sholat):
    1. Toggle ON → UI "**5 aktif**", tapi `adb shell dumpsys alarm` menunjukkan
       **10 alarm** milik app (5 waktu × 2, tiap pasangan punya `origWhen`
       identik).
    2. "Atur ulang pengingat" saat ON → tetap 10 alarm (yang tercatat
       dibatalkan lalu dijadwalkan ulang, yang yatim tidak tersentuh).
    3. Toggle OFF → UI "**0 aktif / Nonaktif**", tapi **5 alarm masih
       terdaftar** (17:37, 18:46, 04:10, 11:33, 14:39).
    4. Bukti bunyi: alarm yatim 17:37 benar-benar muncul sebagai notifikasi
       "**Maghrib Reminder — Maghrib starts at 17:47.**" (channel
       `prayer-reminders`, logcat `notification_enqueue` 17:48:03.844) padahal
       pengingat sudah Mati sejak 17:19.
    5. Classic: hanya 1 waktu sholat terpilih (Isya) → UI "1 aktif", alarm
       terdaftar 2 (keduanya 18:26).
- **Root cause**: `toggleReminder` melakukan `setReminderEnabled(next)`, lalu
  `await writePreference(...)`, lalu `syncPrayerReminders({ enabled: next })`
  (panggilan **A**; closure lama, `previous = notificationIds = []`). Begitu
  `reminderEnabled` berubah, `useEffect` di baris 765–781 (dependensi
  `reminderEnabled`) memicu `syncPrayerReminders({ silent: true })` (panggilan
  **B**; `previous` juga `[]` karena `setNotificationIds` belum jalan). Keduanya
  menjadwalkan 5 alarm baru; `setNotificationIds` hanya menyimpan hasil yang
  selesai terakhir, jadi 5 ID lain **hilang** dan tidak bisa dibatalkan
  (`cancelPrayerReminders` hanya membatalkan ID yang tersimpan, tidak pernah
  menyapu `getAllScheduledNotificationsAsync()`). Pola "panggilan eksplisit +
  effect" yang sama ada di `adjustPrayer` (dependensi `adjustments`),
  `selectReminderLead`, dan `toggleReminderPrayer` — **diduga** tiap ketukan
  koreksi ±1 saat pengingat aktif membocorkan satu batch alarm yatim lagi
  (dari kode; tidak diuji satu per satu di device).
- **Dampak**: user mematikan pengingat tapi notifikasi tetap datang; di sisi
  lain saat pengingat aktif bisa menerima notifikasi ganda. Tidak ada jalan
  di app untuk membersihkan alarm yatim (hanya "Hapus data" app). Counter "N
  aktif" menyesatkan.
- **Saran fix**: pilih satu jalur saja (buang panggilan eksplisit **atau**
  effect); sebelum menjadwalkan, batalkan semua notifikasi terjadwal dengan
  `content.data.type === "prayer_reminder"`; pakai `identifier` deterministik
  per waktu sholat supaya penjadwalan ulang menimpa, bukan menambah.
- **Screenshot**: `14-modern-settings-reminder-section.png` →
  `15-modern-settings-reminder-on.png` (UI "5 aktif"; hitungan alarm 10 ada di
  log sesi), `372-after-toggle-off-orphans.png` (UI "0 aktif" dengan 5 alarm
  tersisa, data bersih), `371-after-atur-ulang-on.png`,
  `116-orphan-reminder-fired-while-off.png` (notifikasi yatim menyala),
  `272-classic-reminder-on.png` (Classic: 1 aktif / 2 alarm).

### B2. [Modern & Classic (kode sama)] Kalkulator Zakat membuang desimal: "85,5 gram" jadi 855 gram, zakat 10× lipat — HIGH

- **Lokasi**: `apps/mobile/src/screens/ExploreScreen.helpers.js`, `digitsOnly`
  (baris 83) dan `parseNumericInput` (84); dipakai `NumberField`/`Field` di
  `apps/mobile/src/screens/explore/WebAppZakatRoute.js` (baris 53–94) dan versi
  Classic di `ExploreClassicRenderers.js` (baris ±308).
- **Expected**: kolom **Berat emas (gram)**, **Berat perak (gram)**, dan
  **Hasil panen (kg)** menerima bilangan desimal (mis. 85,5 gram).
- **Actual**: **WRONG BEHAVIOR, reproducible**. Tab Emas, ketik `85.5` di
  "Berat emas (gram)" → kolom berubah jadi **`855`** dan hasil "Zakat Emas &
  Perak" = **Rp 51.706.125** (2,5% × 855 g × Rp 2.419.000), padahal 85,5 g
  seharusnya Rp 5.170.612. Tab Tani, ketik `653.5` kg → kolom jadi `6.535` dan
  zakat **Rp 10.456.000** (seharusnya Rp 1.045.600). Koma desimal Indonesia
  (`85,5`) diperlakukan sama (`digitsOnly` membuang semua non-digit). Tidak ada
  peringatan sama sekali.
- **Root cause**: `digitsOnly = value.replace(/[^\d]/g, "")` membuang `.` dan
  `,` sebelum nilai disimpan, lalu `formatNumericInput` memformat ulang sebagai
  bilangan bulat `id-ID`. Helper ini didesain untuk nominal rupiah tapi dipakai
  juga untuk kolom berat.
- **Dampak**: angka zakat (kewajiban ibadah) bisa salah 10× sampai 100× tanpa
  user sadar; kasus desimal justru umum untuk berat emas (mis. 12,5 g).
- **Catatan**: di Classic input-nya sendiri tidak bisa diketik (B6), jadi bug
  ini hanya bisa dipicu di Modern; logika/kode-nya identik.
- **Screenshot**: `200-zakat-emas.png`, `201-zakat-emas-decimal-typed.png`,
  `202-zakat-tani-decimal-6535.png`.

### B3. [Modern; lib dipakai juga Classic & web] Kalkulator Waris salah hitung kasus Umariyyatain — HIGH

- **Lokasi**: `apps/mobile/src/lib/faraidh.js` — `isUmariyyah` (baris 71–76)
  dan bagian ibu (baris 120–141: `fraction: oneThird ? fr(1, 3) : fr(1, 6)`);
  **file yang sama persis** dipakai web (`apps/web/src/lib/faraidh.js`).
- **Expected**: Umariyyatain (ahli waris: ayah + ibu + satu pasangan) — ibu
  mendapat **1/3 dari sisa setelah pasangan**, ayah mengambil sisanya (ayah =
  2× ibu).
- **Actual**: **WRONG BEHAVIOR, reproducible**. Harta Rp 240 juta dengan ahli
  waris Suami, Ayah, dan Ibu:
    - App menampilkan banner "Umariyyatain: ayah mengambil sisa setelah
      pasangan", tapi **Suami 1/2 = Rp 120 jt, Ibu 1/3 = Rp 80 jt, Ayah "Sisa
      16,67%" = Rp 40 jt**. Benar: Suami 120 jt, **Ibu 40 jt**, **Ayah 80 jt**.
    - Varian istri (Istri, Ayah, Ibu): app Istri 60 jt, Ibu 80 jt, Ayah 100 jt;
      benar Istri 60 jt, **Ibu 60 jt (1/3 sisa = 25%)**, **Ayah 120 jt (50%)**.
    - Ibu malah menerima lebih banyak dari ayah — kebalikan dari tujuan kasus
      ini.
- **Root cause**: kasus terdeteksi (`applied.umariyyah = true`, hanya menambah
  note) tapi pecahan ibu tetap `1/3` **dari total harta**, bukan sepertiga dari
  sisa setelah bagian pasangan; ayah lalu menerima sisa yang tersisa. Unit test
  (`apps/mobile/src/__tests__/faraidh.test.js:34-39`) hanya menguji ayah + suami
  (tanpa ibu), jadi bukan kasus Umariyyatain yang sebenarnya.
- **Diduga keliru juga (perlu konfirmasi tim fiqh, tidak saya klaim pasti)**,
  dari menjalankan lib di Node: (1) Suami + Ibu + 2 saudara seibu + 1 saudara
  kandung — saudara seibu **hilang** dari hasil (terblokir oleh saudara kandung,
  `blockedSeibu` di baris ±46–52) dan bagian 1/3 jatuh ke saudara kandung saja,
  flag `musytarakah` tetap `false`; (2) 1 anak perempuan + 1 cucu perempuan —
  cucu tidak mendapat 1/6 (takmilah) melainkan 0, anak perempuan 100% (radd).
- **Dampak**: hasil pembagian waris yang salah, disimpan ke riwayat dan bisa
  dipakai keluarga sebagai rujukan. Layar ini mengiklankan sendiri dukungan
  "Umariyyatain, Musytarakah…" (kartu info di atas form).
- **Screenshot**: `360-faraidh-umariyyatain-wrong-result.png`,
  `361-faraidh-umariyyatain-tree.png`, `217-faraidh-history.png` (ringkasan
  tersimpan "Suami 50%, Ibu 33%, Ayah 17%").

### B4. [Modern] "Diagram Silsilah Waris" menampilkan `undefined/undefined` dan label "Mahjub (Terhalang)" untuk ahli waris yang justru menerima bagian — HIGH

- **Lokasi**: `apps/mobile/src/screens/explore/FaraidhFamilyTreeMobile.js` —
  baris 31 (`isMahjub`), 70–72 (`resultRow.fraction.numerator` dan
  `.denominator`), dan `HEIR_METAS` (baris 6–24).
- **Expected**: node tiap ahli waris menampilkan pecahannya (mis. "1/8") dan
  status Mahjub **hanya** untuk yang terhalang.
- **Actual**: **WRONG BEHAVIOR, reproducible**. Istri + Anak Laki-laki + Anak
  Perempuan (harta Rp 240 jt; tabel hasil benar: Istri 30 jt, Anak L 140 jt,
  Anak P 70 jt): pada diagram, kartu Istri menampilkan badge
  "**undefined/undefined**", sedangkan **Anak Lk dan Anak Pr berlabel merah
  "Mahjub (Terhalang)"** — padahal keduanya menerima Rp 140 jt dan Rp 70 jt.
  Pada kasus Umariyyatain, kartu Ibu juga "undefined/undefined".
- **Root cause**: dua ketidakcocokan nama field. (1) Pecahan disimpan sebagai
  `{ num, den }` (`lib/faraidh.js:1`) tetapi diagram membaca
  `numerator/denominator` → `undefined`. (2) Diagram mengindeks baris hasil dengan
  key camelCase `HEIR_METAS` (`anakL`, `cucuP`, `saudaraL`, …) padahal baris
  ashabah dari kalkulator memakai snake_case (`anak_laki`, `anak_perempuan`,
  `cucu_laki`, `saudara_laki`, `ayah_residue`, …). `rowMap[key]` → `undefined`
  → `isEligible = false` → `isMahjub = true`. Hanya key yang kebetulan sama
  (`suami`, `istri`, `ayah`, `ibu`, `kakek`, `nenek`) yang cocok.
- **Dampak**: diagram menyatakan anak kandung "terhalang" (terminologi fiqh
  untuk yang tidak mewarisi) tepat di bawah tabel yang memberi mereka bagian
  terbesar; layar jadi kontradiktif dan menurunkan kepercayaan pada hasilnya.
- **Screenshot**: `213-faraidh-case1-tree-b.png`, `212-faraidh-case1-result-and-tree-a.png`.

### B5. [Modern] Filter kategori dan pencarian Dzikir / Wirid / Doa / Asmaul Husna hanya mencakup 20 item yang sudah termuat — HIGH

- **Lokasi**: `apps/mobile/src/screens/ExploreScreen.helpers.js:3`
  (`EXPLORE_PAGE_SIZE = 20`), pemuatan fitur di `ExploreScreen.js` (baris
  ±624–700) dan rute daftar referensi Modern
  (`WebAppReferenceListRoute.js` + `WebAppDoaRoute.js`) yang memfilter array
  `items` lokal.
- **Expected**: chip kategori dan kotak cari mencakup seluruh data.
- **Actual**: **WRONG BEHAVIOR, reproducible** (kelas bug yang sama dengan
  Hadis B2). Dicek ke API produksi: Dzikir = **37** item (umum 17, pagi 6,
  petang 5, setelah sholat 4, tidur 4, safar 1), Doa = **82**, Asmaul Husna =
  **99**.
    - Dzikir: header "**20 dzikir tersedia**"; chip **Petang, Setelah Sholat,
      Tidur, Safar** → "**Data tidak ditemukan.**"; Pagi hanya 3 dari 6. Baru
      setelah "Muat lebih banyak" ditekan → "37 dzikir tersedia" dan semua chip
      terisi. Padahal hub menjanjikan "Dzikir pagi, petang, dan setelah
      sholat".
    - Wirid: sama ("Menampilkan 0 dari 20 wirid", chip Petang/Setelah
      Sholat/Tidur/Umum kosong). Chip **"Umum" tidak akan pernah terisi**
      karena kategori datanya `dzikir_umum`.
    - Doa: chip Makan → "Menampilkan 0 dari 20 doa / Tidak ada doa yang
      cocok"; setelah satu kali "Muat doa lain" → "Menampilkan 4 dari 40 doa".
    - Asmaul Husna: cari "**Kuat**" (nama ke-54, "Yang Maha Kuat", ada di
      API) → "Menampilkan 0 dari 20 nama / Data tidak ditemukan".
- **Root cause**: daftar dimuat 20 item per halaman (`page=0&size=20`), filter
  kategori dan pencarian berjalan client-side di atas `items` yang baru ada;
  tombol "Muat lebih banyak" hanya muncul di bawah pesan kosong dan tidak
  dipicu otomatis saat filter tidak menemukan apa-apa. API tidak mendukung
  parameter `category` (`?category=pagi` dibalas 10 item `dzikir_umum`).
- **Dampak**: kategori yang justru paling dicari (Petang, Setelah Sholat,
  Tidur) tampak kosong, user menyimpulkan datanya tidak ada. Dataset-nya kecil
  (37/82/99) — cukup diunduh sekali.
- **Saran**: untuk dataset kecil ambil sekaligus (`size=100`/`200`), atau
  picu `loadMore` otomatis sampai hasil filter ≥ 1 / data habis, atau kirim `q`
  dan `category` ke backend (seperti fix Hadis B2).
- **Screenshot**: `121-dzikir-pagi.png`, `123-dzikir-petang-empty.png`,
  `122-dzikir-list-bottom.png` (tombol "Muat lebih banyak"),
  `130-doa-makan.png`, `184-asmaul-search-kuat.png`, `180-modern-wirid.png`.

### B6. [Classic] Semua input teks pada fitur Belajar (Zakat, Waris, Masjid, …) kehilangan fokus seketika — keyboard tidak bisa dipakai — HIGH

- **Lokasi**: `apps/mobile/src/components/Screen.js` baris 96
  (`ListHeaderComponent={renderHeader}` di cabang FlatList, `renderHeader` adalah
  fungsi inline yang dibuat ulang tiap render) dan
  `apps/mobile/src/screens/ExploreScreen.js:1943`
  (`listData={activeFeature ? visibleItems : undefined}`).
- **Expected**: mengetuk kolom "Total harta" / "Harta warisan" / kotak cari
  Masjid membuka keyboard dan bisa mengetik.
- **Actual**: **WRONG BEHAVIOR, reproducible**. Di layout Classic, mengetuk
  kolom input di **Kalkulator Zakat** (Maal dan Emas), **Kalkulator Waris**, dan
  **pencarian Masjid** tidak menampilkan keyboard; `input text` setelahnya tidak
  masuk. Log IME: `onRequestShow` lalu `onFinishInputView`/`onHidden` dalam
  hitungan milidetik, dan `mServedView` tetap pada tombol kembali (bukan
  EditText). Kontrol pembanding: kotak cari **Hadis Classic** membuka keyboard
  normal; di **Modern** semua input di atas berfungsi. Cold start bersih
  (`force-stop`) → sama.
- **Root cause**: saat fitur aktif, `ExploreScreen` memberi `listData` ke
  `Screen`, sehingga `Screen` memakai cabang `FlatList` dengan
  `ListHeaderComponent={renderHeader}`. Fungsi inline itu dianggap **tipe
  komponen baru** tiap render → seluruh header (termasuk `children`, yaitu UI
  kalkulator beserta TextInput-nya) di-unmount/mount ulang pada setiap re-render.
  Fokus pertama memicu `keyboardDidShow` → `setKeyboardVisible` di `App.js` →
  re-render → remount → fokus hilang → keyboard menutup. Ini **kelas bug yang
  sama persis** dengan Quran B1 (lihat
  [audit Quran](./2026-09-25-quran-deep-audit.md)).
- **Dampak**: di tema Classic, Kalkulator Zakat dan Kalkulator Waris **tidak
  bisa dipakai sama sekali** dan pencarian Masjid mati. Catatan: karena tidak
  bisa diketik, B2/B3/B8 tidak bisa dipicu di Classic walau kodenya sama.
- **Screenshot**: `303-classic-zakat-clean-start-tap.png`,
  `304-classic-faraidh-tap.png`, `302-classic-zakat-maal-tap.png`.

### B7. [Modern & Classic] Jadwal Sholat tanpa cache: kegagalan load (GPS lambat, HTTP 429, jaringan) atau ganti metode menghapus seluruh jadwal — HIGH

- **Lokasi**: `apps/mobile/src/screens/PrayerScreen.js` — `load` (baris
  269–328), efek `refreshAll` (761–763), `selectMethod`/`selectMadhab`
  (380–388); `applyManualLocation` (330–374). `getOfflinePrayerForDate` hanya
  berisi sesuatu kalau user menyimpan paket 30 hari secara manual.
- **Expected**: kalau refresh gagal, jadwal terakhir yang sukses tetap
  ditampilkan (dengan penanda "data lama"); ganti metode/mazhab tidak membuang
  lokasi.
- **Actual**: **WRONG BEHAVIOR, reproducible**:
    1. Refresh saat GPS tidak memberi fix (±20 detik) → pesan "Lokasi belum
       terbaca…", hero berubah jadi "Lokasi belum aktif", **jadwal yang tadi
       tampil hilang** (semua waktu `--:--`) dan muncul form lokasi manual.
    2. API membalas 429 → semua waktu jadi **`--:--`** dengan pesan teknis
       bahasa Inggris **"Request failed: 429"** (Classic, tangkapan
       `323-classic-pull-to-refresh.png`).
    3. Izin lokasi ditolak + lokasi manual Jakarta sudah diterapkan → buka
       Pengaturan, ganti metode (mis. MWL), kembali: **jadwal hilang dan
       lokasi manual terlupa** ("Lokasi belum aktif · MWL", form tampil lagi).
- **Root cause**: `load()` selalu meminta izin + `getCurrentPositionAsync`
  ulang, dan pada error langsung `setCoords(null)` / `setPrayers(null)`. Efek
  `useEffect(() => { refreshAll(); }, [refreshAll])` ikut jalan ulang setiap
  `method`/`madhab` berubah (karena `load` bergantung pada keduanya) — jadi
  **tiap ganti metode menjalankan permintaan GPS + API baru**. Lokasi manual
  hanya hidup di `useState` (`manualLatInput/manualLngInput` tidak persisten
  dan `coords` tertimpa `load`). Tidak ada cache jadwal hari ini terlepas dari
  paket offline.
- **Dampak**: untuk app jadwal sholat, layar inti menjadi kosong tiap ada
  gangguan sementara; user dengan izin lokasi ditolak (memakai lokasi manual)
  harus mengetik ulang koordinat setiap kali mengubah pengaturan atau menarik
  refresh. Kalau jadwal tidak ada, pengingat dan hitung mundur juga mati.
- **Saran**: simpan jadwal terakhir + koordinat (AsyncStorage) dan jadikan
  fallback sebelum menyerah; pisahkan "load lokasi" dari "load jadwal"
  (ganti metode cukup memanggil API, tidak GPS); persist lokasi manual.
- **Screenshot**: `05c-modern-prayer-refresh-wait2.png` (jadwal hilang setelah
  refresh gagal), `63-prayer-after-method-change-manual-location.png`,
  `62-prayer-manual-applied.png` (kondisi sebelum), `323-classic-pull-to-refresh.png`
  (429).

### B8. [Modern; kode Classic serupa] Batas wasiat dihitung dari harta kotor, bukan setelah utang — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppFaraidhRoute.js:480`
  (`const maxBequest = Math.floor(wealth / 3)`).
- **Expected**: wasiat maksimal 1/3 dari harta **setelah dikurangi utang dan
  biaya** (KHI Pasal 195 ayat 2 dan hadis Sa'ad bin Abi Waqqash).
- **Actual**: harta Rp 240 jt, utang Rp 60 jt → label "**Maksimal wasiat: Rp
  80.000.000**" (benar: (240 − 60) / 3 = **Rp 60.000.000**). Wasiat 100 jt
  dipotong ke 80 jt, sehingga yang dibagikan ke ahli waris Rp 100 jt padahal
  seharusnya Rp 120 jt.
- **Root cause**: `maxBequest` memakai `wealth` mentah; `debts` hanya dipakai di
  `distributable = wealth − debts − bequest`.
- **Dampak**: ahli waris dirugikan ketika ada utang dan wasiat besar.
- **Screenshot**: `215-faraidh-wasiat-over-limit.png`.

### B9. [Modern & Classic] Tombol kembali di layar Qibla mati total — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/QiblaScreen.js` — header Modern
  (`navigation.setHeader({ onBack: () => onOpenTab?.("ibadah") })`, baris
  286–294) dan tombol Classic "Kembali ke Ibadah" (baris 269–275,
  `onPress={() => onOpenTab("ibadah")}`). `IbadahScreen.js:434-440` memberi prop
  `onBack={() => navigation?.close?.("ibadah")}` yang **tidak pernah dipakai**
  `QiblaScreen` (tidak ada di destructuring props).
- **Expected**: panah kembali menutup Qibla dan membuka hub Ibadah.
- **Actual**: **WRONG BEHAVIOR, 100% reproducible**: di Modern, ketuk tombol
  "Kembali" di header (3 kali) → tetap di "Arah Kiblat"; di Classic, ketuk
  "Kembali ke Ibadah" (3 kali) → tetap di Qibla. Hanya hardware back / swipe-back
  yang bisa keluar.
- **Root cause**: `onOpenTab("ibadah")` → `openTabState("ibadah", null)` tidak
  menghapus `internalRoutes.ibadah` (route `qibla` tetap ada) sehingga
  `IbadahScreen` terus merender Qibla. Bandingkan Khatam yang memakai
  `navigation.close("ibadah")` dan berfungsi normal di kedua tema.
- **Dampak**: satu-satunya kontrol kembali yang terlihat di layar ini tidak
  berfungsi; user iOS (tanpa tombol back hardware) bisa terjebak kecuali tahu
  gesture swipe.
- **Screenshot**: `41-modern-qibla-after-header-back.png`,
  `281-classic-qibla-after-back-button.png`.

### B10. [Modern] Header "← Arah Kiblat" basi menempel di hub Ibadah setelah keluar dari Qibla — MEDIUM

- **Lokasi**: `QiblaScreen.js` baris 286–294 (efek `navigation.setHeader(...)`
  **tanpa cleanup**); `apps/mobile/App.js` baris 72–81 hanya mereset header
  saat `activeTab` berubah.
- **Expected**: keluar dari Qibla mengembalikan header standar Beranda/Ibadah.
- **Actual**: **WRONG BEHAVIOR, reproducible**. Buka Qibla → tekan hardware back
  → hub Ibadah tampil, tetapi bar atas masih **"← Arah Kiblat"** (dengan tombol
  kembali mati yang sama seperti B9). Baru hilang setelah pindah tab.
- **Root cause**: header config hidup di state `App` (`headerConfig`) dan hanya
  dibersihkan saat ganti tab; `QiblaScreen` tidak memanggil
  `navigation.setHeader(null)` di cleanup efek / saat unmount.
- **Dampak**: hub Ibadah menampilkan judul layar yang sudah tidak dibuka.
- **Screenshot**: `42-modern-qibla-after-hw-back.png`.

### B11. [Modern] "Konversi Tanggal" di Kalender Hijriah palsu: bukan input dan bukan tombol — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppHijriRoute.js` baris
  339–361; style `converterInput` (621) dan `converterButton` (633).
- **Expected**: kolom tanggal bisa diisi/dipilih dan tombol "Konversi"
  menghitung tanggal Hijriah.
- **Actual**: **WRONG BEHAVIOR, 100% reproducible**: kotak "2026-09-30" dan
  tombol hijau "Konversi" tampak interaktif tapi mengetuknya **tidak
  melakukan apa pun** — tidak ada keyboard/picker, screenshot sebelum dan sesudah
  tap identik byte-for-byte. Hasilnya selalu tanggal Hijriah hari ini.
- **Root cause**: keduanya `<Text>` bergaya input/tombol
  (`<Text style={styles.converterInput}>{formatGregorian(todayRaw)}</Text>`
  dan `<Text style={styles.converterButton}>`), tanpa `TextInput`/`Pressable`/
  handler.
- **Dampak**: fitur konversi yang dijanjikan UI tidak ada; dead control kelas
  Hadis B1.
- **Screenshot**: `142-hijri-convert-widget.png`,
  `144-hijri-before-konversi.png` vs `145-hijri-after-konversi.png`.

### B12. [Modern] Imsakiyah: panah bulan mati dan tabel menggulir horizontal per-baris (Asr/Maghrib/Isya tersembunyi) — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppImsakiyahRoute.js` — panah
  bulan baris 140–150; `ScrollView horizontal` per baris di `ImsakiyahRow`
  (baris 86–115).
- **Expected**: panah ← → pindah bulan; kolom waktu sejajar dan terbaca semua.
- **Actual**: **WRONG BEHAVIOR**: (1) ketuk ← dan → (dicoba di device) → label
  tetap "September 2026", tidak ada perubahan; (2) tiap baris punya
  `ScrollView horizontal` sendiri: hanya Imsak/Subuh/Terbit/Dzuhur yang terlihat,
  **Asr/Maghrib/Isya di luar layar** dan swipe horizontal hanya menggeser **satu
  baris** (baris 3 menampilkan Dzuhur/Asr/Maghrib/Isya sementara baris lain tidak
  berubah). Header tabel hanya "No | Jadwal" tanpa judul kolom.
- **Root cause**: panah adalah `<View><Text>←</Text></View>` tanpa handler
  (bulan dihitung dari data: `inferMonthLabel(items)`); scroller horizontal
  dipasang di dalam setiap baris, bukan membungkus seluruh tabel.
- **Dampak**: waktu Maghrib (buka puasa) — inti Imsakiyah — tersembunyi
  secara default; tidak ada cara melihat bulan lain (Ramadan tidak bisa
  dijangkau kalau bukan sedang bulannya).
- **Screenshot**: `150-modern-imsakiyah.png`, `151-imsakiyah-hswipe.png`.

### B13. [Modern & Classic (komponen sama)] Masjid: pencarian diabaikan saat "Masjid Terdekat" aktif, dan tiap ketukan memicu GPS + API — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/MasjidDirectoryContent.js` — efek
  `[search, nearMe]` (baris 89–101), `loadList` (36–51), `loadNearby` (53–86).
- **Expected**: mengetik di kotak cari memfilter daftar (juga saat mode
  terdekat); satu ketukan = satu permintaan (dengan debounce).
- **Actual**: **WRONG BEHAVIOR, reproducible**: dengan "Masjid Terdekat" aktif,
  ketik "istiqlal" → daftar tetap daftar terdekat (Masjid Sunda Kelapa, Cut
  Meutia, …); teks **tidak dipakai**. Karakter ikut hilang ("istiql", "izzz" dari
  "zzzzqq") karena tiap ketukan memicu permintaan baru. Pada satu percobaan,
  daftar macet di loading ±8 menit — bertahan walau layar ditutup lalu dibuka
  lagi — sampai tombol "Masjid Terdekat" ditekan ulang (percobaan ulang dengan
  langkah yang sama tidak lagi memunculkan macet, jadi anggap "terobservasi
  sekali"). Dengan mode terdekat mati, pencarian
  "istiqlal" ke API juga menghasilkan 0 item (`/api/v1/masjids?q=istiqlal` →
  `{"items":[],"total":0}`) padahal "Masjid Istiqlal" ada di hasil terdekat —
  pencarian server memakai field yang lebih sempit dari yang dijanjikan
  placeholder ("nama, kota, atau kecamatan").
- **Root cause**: `loadNearby` tidak membaca `search`; efek tergantung `search`
  sehingga **setiap ketukan** menjalankan `loadNearby` lengkap
  (`requestForegroundPermissionsAsync` + `getCurrentPositionAsync` + API) tanpa
  debounce/pembatalan — beberapa panggilan berjalan bersamaan dan saling
  menimpa `loading`/`items`.
- **Dampak**: pencarian tak berguna saat mode terdekat; boros baterai/kuota;
  tampilan bisa macet.
- **Screenshot**: `162-masjid-search-istiqlal.png`, `163-masjid-search-none.png`,
  `173-masjid-repro-wedge.png`, `166-masjid-search-final.png`.

### B14. [Modern & Classic] Notifikasi "Waktu Sholat" dan adzan hanya jalan kalau layar Jadwal Sholat sedang terbuka — MEDIUM

- **Status**: FIXED
- **Fix**: `apps/mobile/src/hooks/usePrayerTimeMonitor.js` (App-level hook) di `App.js`. Polling waktu sholat tiap 10 detik dan memicu notifikasi serta audio adzan saat waktu masuk, independen dari tab atau screen aktif.
- **Lokasi**: `apps/mobile/App.js:317` (`current: internalRoutes[activeTab]`),
  `apps/mobile/src/screens/IbadahScreen.js:431–458`, dan efek hitung mundur di
  `PrayerScreen.js` (baris 539–570).
- **Expected**: toggle "Audio Adzan" bertuliskan "_Diputar saat waktu masuk dan
  aplikasi terbuka_" — adzan + notifikasi "Waktu Sholat" muncul selama app
  terbuka di tab mana pun.
- **Actual**: **WRONG BEHAVIOR**. Kontrol positif: berada di layar Jadwal
  pukul 17:47:00 (Maghrib) → notifikasi "**Waktu Sholat: Maghrib**" muncul
  (17:47:01), audio adzan diputar (`dumpsys audio`: player baru 17:47:02,
  tombol Stop merah tampil, Stop menghentikan audio). Kontrol negatif: berpindah
  ke tab **Hadis** dan menunggu Isya 18:56:00 → **tidak ada audio, tidak ada
  notifikasi** (`dumpsys audio` 0 player; tidak ada `notification_enqueue` baru).
  Kembali ke tab Ibadah → Jadwal dirender ulang dari awal.
- **Root cause**: `navigation.current` dibangun dari `internalRoutes[activeTab]`
  (tab aktif) dan dioper **sama** ke semua pane, termasuk pane Ibadah yang
  disembunyikan. Begitu tab lain aktif, `IbadahScreen` melihat route tab itu
  (kosong) → merender `IbadahHub`, sehingga `PrayerScreen` (pemilik interval
  hitung mundur, `showPrayerTimeNotification`, `playAdzan`) **ter-unmount**.
- **Dampak**: janji UI ("aplikasi terbuka") tidak terpenuhi; ditambah B1/B15,
  praktis tidak ada jalur alert sholat yang bisa diandalkan.
- **Screenshot**: `111-prayer-maghrib-arrived.png`, `112-prayer-maghrib-plus5s.png`,
  `113-prayer-after-stop.png`, `321-adzan-while-on-hadis-tab.png`.

### B15. [Modern & Classic] Pengingat memakai alarm tak-eksak (terlambat) dan teks notifikasi berbahasa Inggris — MEDIUM

- **Status**: FIXED
- **Fix**: Menambahkan permission `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, dan `RECEIVE_BOOT_COMPLETED` ke `AndroidManifest.xml` dan `app.json`. Teks pengingat dan notifikasi sudah terlokalisasi via `t()` (`prayer.notification.*`).
- **Lokasi**: `apps/mobile/android/app/src/main/AndroidManifest.xml` (hanya 5
  permission: lokasi ×2, `INTERNET`, `POST_NOTIFICATIONS`, `VIBRATE` — **tanpa**
  `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`); `utils/prayerNotifications.js`
  baris 137–151 (trigger `DATE`) dan teks di baris 139–143.
- **Expected**: pengingat berbunyi tepat waktu; teks mengikuti bahasa app.
- **Actual**: di `dumpsys alarm` tiap alarm pengingat bertipe `RTC_WAKEUP` dengan
  `flags=0x20` (allow-while-idle tak-eksak), tanpa `exactAllowReason`, dan
  `window=+13m11s` (yang jauh `window=+1h0m0s`). Alarm yang dijadwalkan **17:37:00**
  baru diantar **17:48:03** — **11 menit telat dan setelah Maghrib (17:47)
  masuk**, dengan isi "Maghrib starts at 17:47." Teks notifikasi hard-coded
  Inggris (`Reminder`, `starts at`, `time is now` di
  `prayerNotifications.js:139-143`), sementara notifikasi waktu sholat
  berbahasa Indonesia ("Waktu Sholat: …") dan memakai channel fallback
  berbeda.
- **Root cause**: tanpa izin alarm eksak, Android 12+ menurunkan `DATE` trigger
  ke alarm tak-eksak dengan jendela yang bisa puluhan menit; string notifikasi
  tidak melewati `t()`.
- **Catatan**: angka 11 menit diamati di emulator Android 16; di device nyata
  bervariasi, tapi tidak ada jaminan.
- **Dampak**: "pengingat 10 menit sebelum adzan" bisa tiba setelah adzan.
- **Screenshot**: `116-orphan-reminder-fired-while-off.png`,
  `80-orphan-notification-check.png`.

### B16. [Modern & Classic] Sholat Tracker memakai tanggal UTC (Subuh masuk ke hari kemarin), dan riwayat 7 hari/heatmap bulan palsu — MEDIUM

- **Lokasi**: `ExploreScreen.js` `togglePrayer` (baris 1204–1231,
  `new Date().toISOString().split("T")[0]`); `WebAppSholatTrackerRoute.js` baris
  9–47 (`todayIso`, `dateOffsetIso`, `buildLastSeven`, `buildMonthDays`).
- **Expected**: tanggal mengikuti waktu lokal user; "7 Hari Terakhir" dan
  heatmap bulan menampilkan data riwayat.
- **Actual**: (1) Klien mengirim tanggal dari `toISOString()` (**UTC**) sedangkan
  backend memakai `time.Now()` di container ber-`TZ=Asia/Jakarta`
  (`services/api/Dockerfile:30`; `sholat_service.go` `LogPrayer`/`GetToday`).
  Untuk WIB pukul **00:00–06:59** tanggal klien = **hari sebelumnya** (Node:
  `05:00 WIB 1 Okt → "2026-09-30"`) sementara "hari ini" versi server = 1 Okt.
  Akibatnya **Subuh (±04:20) yang dicentang tersimpan di tanggal kemarin**
  dan tidak muncul di "hari ini" setelah layar dimuat ulang (dan menimpa status
  Subuh kemarin). (2) `buildLastSeven(doneCount)` dan `buildMonthDays(doneCount)`
  hanya mengisi **hari ini** dengan data asli; enam hari lain dan seluruh
  heatmap selalu **0/5** — endpoint `/api/v1/sholat/history` dan `/sholat/stats`
  ada tapi tidak dipakai. (3) Guest: Modern tidak menampilkan notice login
  (Classic menampilkan "Buka Profil untuk masuk dan melacak sholat.");
  mengetuk "Subuh" di kedua tema hanya memunculkan toast "**Gagal — Log sholat
  belum bisa disimpan.**" tanpa petunjuk login.
- **Root cause**: `toISOString()` (UTC) sebagai kunci tanggal padahal server
  berjalan di WIB; riwayat dibangun dari `doneCount` hari ini, bukan dari API.
- **Dampak**: catatan Subuh — waktu yang paling butuh dilacak — hilang atau salah
  hari untuk pengguna Indonesia; statistik/streak berbasis tanggal ikut salah;
  riwayat yang ditampilkan menyesatkan. Bagian (1)/(2) diverifikasi dari kode
  dan bukti Node karena alur login tidak dicoba (guest only), jadi perlu
  konfirmasi dengan akun uji. Saran: kirim tanggal lokal (`YYYY-MM-DD` dari
  komponen `getFullYear/Month/Date`) dan biarkan `GET /sholat/today` menerima
  `?date=`.
- **Screenshot**: `220-modern-sholat-tracker-guest.png`,
  `222-sholat-tracker-tap-subuh-guest.png`, `310-classic-sholat-tracker.png`,
  `311-classic-sholat-tracker-tap.png`.

### B17. [Modern & Classic] Tasbih: hitungan tidak persisten, dan "Total Hari Ini" reset setiap keluar layar — MEDIUM

- **Lokasi**: `ExploreScreen.js:270` (`useState({ count: 0, target: 33 })`, tanpa
  preferensi); `WebAppTasbihRoute.js:133` (`useState(tasbih.count ?? 0)` untuk
  `totalToday`).
- **Expected**: hitungan dzikir bertahan (subtitle layar: "_Hitung dzikir dengan
  target dan riwayat harian_"); "Total Hari Ini" = total hari ini.
- **Actual**: **WRONG BEHAVIOR, reproducible**. Hitungan 9/target 7 → proses
  app dimatikan Android (`am kill`) → buka ulang: **0 / 33** (target juga balik
  ke 33). "Total Hari Ini" 4 → keluar layar lalu masuk lagi: **0**. Tidak ada
  riwayat harian sama sekali. (Pembanding: hitungan **Wirid Asmaul Husna**
  bertahan setelah cold start, 4 tetap 4.)
- **Root cause**: state hanya di memori; `totalToday` adalah state lokal rute
  yang di-init dari hitungan berjalan, bukan agregat persisten.
- **Dampak**: dzikir panjang (33/99/313) yang terpotong kehilangan progres
  saat proses dimatikan sistem; label "Total Hari Ini" tidak jujur.
- **Screenshot**: `106-tasbih-beyond-target.png`, `108-tasbih-after-process-death.png`,
  `100-modern-tasbih.png`, `293-classic-tasbih.png`.

### B18. [Modern & Classic] 13 dari 16 baris hub Ibadah membuka tab Belajar, dan Back tidak pernah kembali ke Ibadah — MEDIUM

- **Lokasi**: `IbadahScreen.js` `openRow` (baris 223–238,
  `onOpenTab("belajar", { featureKey })`); `apps/mobile/src/navigation/appNavigation.js`
  (`openTabState` tidak menyimpan `returnTo`/`returnTab` untuk route tanpa
  `view`).
- **Expected**: dari hub Ibadah → fitur → Back kembali ke hub Ibadah (pola
  `setBack`/`clearBack` di `CLAUDE.md`).
- **Actual**: **WRONG BEHAVIOR, reproducible** di kedua tema: Ibadah → Doa →
  header "Kembali" (atau hardware back) → **hub Belajar** ("KONTEN ISLAM"); Back
  sekali lagi → **Beranda**. Hub Ibadah tidak pernah tercapai. Saat fitur terbuka,
  tab yang menyala adalah **Belajar**, bukan Ibadah. Classic: tombolnya
  berlabel "**Kembali ke Belajar**" untuk fitur yang baru saja dibuka dari
  Ibadah. Hal serupa: Khatam → "Masuk dari Profil" → Back mendarat di Beranda,
  bukan Khatam.
- **Root cause**: lihat Lokasi; tidak ada return route untuk perpindahan tab
  lewat `featureKey`.
- **Dampak**: 13 baris (Doa, Dzikir, Hijriah, Imsakiyah, Masjid, Wirid, Wirid
  Saya, Asmaul Husna, Tasbih, Zakat, Waris, Log Sholat, Manasik) memutus alur
  Ibadah.
- **Screenshot**: `91-modern-doa-after-header-back.png`,
  `72-modern-khatam-after-profile-back.png`, `90-modern-doa.png`,
  `292-classic-dzikir.png` (label "Kembali ke Belajar").

### B19. [Modern, tema gelap] Pengaturan Sholat: beberapa tombol tak terlihat dan judul nyaris tak terbaca — MEDIUM

- **Lokasi**: `PrayerScreen.js` cabang Web App — tombol "Atur ulang pengingat"
  (baris 1503–1511, teks tanpa `webTheme`), tombol "Pakai hari ini"/"Hapus"
  (1581–1630, `webAppOfflineButton` berlatar `#f8fafc` dengan teks
  `webTheme.text` = putih di mode gelap), label "Notifikasi Lokal"/"Audio
  Adzan" (`styles.webAppPrayerLabel` tanpa warna tema, baris 1280 dan 1322),
  serta pill "Jeda"/"Waktu Sholat" dan daftar muadzin yang memakai warna terang
  statis.
- **Expected**: semua teks terbaca di tema Gelap.
- **Actual**: **WRONG BEHAVIOR**. "Atur ulang pengingat" = kotak kosong (teks
  gelap di latar gelap); "Pakai hari ini" dan "Hapus" = dua kotak putih
  **tanpa teks terlihat** (putih di atas putih); judul "Notifikasi Lokal" dan
  "Audio Adzan" abu-abu gelap nyaris tak terbaca; pill putih dan kartu muadzin
  krem mencolok di UI gelap.
- **Root cause**: gaya statis `WEB_APP_PRAYER_*` (light) dicampur dengan
  `webTheme` dinamis; sebagian elemen tidak ikut tema.
- **Dampak**: di mode gelap fungsi "Pakai hari ini" dan "Hapus" tidak bisa
  dikenali; "Atur ulang pengingat" invisible.
- **Screenshot**: `254-dark-prayer-settings-reminders.png`,
  `255-dark-prayer-settings-reminders-top.png`, `252-dark-prayer-settings-top.png`.

### B20. [Modern & Classic] Kolom lokasi manual tertutup keyboard dan layar tidak menggulir — MEDIUM

- **Lokasi**: `PrayerScreen.js` `renderManualLocationCard` (baris 885–979),
  `QiblaScreen.js` kartu lokasi manual (baris 449–570); `app.json`:
  `android.edgeToEdgeEnabled: true`, `targetSdk 36`.
- **Expected**: kolom yang sedang diketik tetap terlihat di atas keyboard.
- **Actual**: di Jadwal Sholat (izin lokasi ditolak), ketuk kolom "Lintang"
  → keyboard naik dan **kolom itu tepat di bawah keyboard** (hanya garis atas
  yang terlihat); user mengetik tanpa melihat isinya. Kartu Qibla serupa.
- **Root cause**: dengan edge-to-edge (Android 15+), `adjustResize` tidak lagi
  mengecilkan window; `Screen` memakai `KeyboardAvoidingView` dengan
  `behavior={undefined}` di Android dan tidak ada penanganan inset IME.
- **Dampak**: jalur "GPS ditolak → isi koordinat manual" (satu-satunya jalan
  mendapatkan jadwal) sulit dipakai, terutama di layar kecil.
- **Screenshot**: `61-prayer-manual-keyboard-open.png`,
  `53-qibla-manual-keyboard.png`.

### B21. [Modern & Classic] Manasik menampilkan markdown mentah (`##`, `**`) — LOW

- **Lokasi**: konten `/api/v1/manasik` dirender apa adanya oleh
  `WebAppReferenceListRoute`/detail generik dan renderer Classic
  (`ExploreClassicRenderers.js`).
- **Actual**: kartu dan detail menampilkan teks "`## Niat Ihram Haji…`" dan
  "Pada `**8 Dzulhijjah**` (Hari Tarwiyah), …" dengan simbol markdown
  terlihat; daftar `-` terbaca tapi heading/bold tidak ter-render. Tag
  kategori juga mentah ("haji") dan eyebrow detail "ILMU".
- **Dampak**: kosmetik, tapi langkah haji/umrah adalah konten inti layar.
- **Screenshot**: `230-modern-manasik.png`, `231-manasik-card-tapped.png`.

### B22. [Modern & Classic] Deep link/notifikasi `prayer` tidak membawa user keluar dari Pengaturan Sholat — LOW

- **Lokasi**: `PrayerScreen.js` baris 228–232 (hanya menyinkronkan `settings`
  dari `navigation.current`); `view` adalah state lokal.
- **Actual**: buka Pengaturan Sholat, lalu picu
  `thullaabulilmi://ibadah/prayer` (URL yang sama dipakai semua notifikasi
  pengingat/"Waktu Sholat": `thullaabulilmi://prayer`) → layar **tetap di
  Pengaturan**. Arah sebaliknya (`ibadah/settings` saat di jadwal) benar.
- **Dampak**: ketuk notifikasi sholat saat app sedang di Pengaturan tidak
  membawa user ke jadwal.
- **Screenshot**: `30-deeplink-prayer-while-in-settings.png`.

### B23. [Modern] Header "Riwayat Faraidh" basi, dan Back pertama tidak keluar — LOW

- **Lokasi**: `ExploreScreen.js` `updateHeader` (baris 1398–1406, flag
  `showFaraidhHistory` diprioritaskan) — flag tidak di-reset saat berpindah
  fitur (hanya direset oleh handler back-nya sendiri).
- **Actual**: Ibadah → Waris → Riwayat → pindah tab → Ibadah → Log Sholat:
  judul header masih "**Riwayat Faraidh**" di layar Sholat Tracker; Back
  pertama hanya membersihkan flag (judul berganti), baru Back kedua
  keluar ke hub Belajar.
- **Screenshot**: `220-modern-sholat-tracker-guest.png` (judul basi),
  `221-sholat-tracker-after-first-back.png`.

### B24. [Modern & Classic] Zakat: fallback harga emas tersembunyi, angka raksasa, dan label "Rp" pada kolom gram (Classic) — LOW

- **Lokasi**: `WebAppZakatRoute.js:231` (fallback `|| 1050000` pada
  `goldPrice`) dan baris setara di `ExploreClassicRenderers.js` (±2013);
  `NumberField`/`renderCurrencyInput`.
- **Actual**: (1) kosongkan "Harga emas/gram" → kolom menampilkan `0` tapi
  nisab diam-diam memakai Rp 1.050.000 ("Nisab: Rp 89.250.000" alih-alih
  Rp 205.615.000) sehingga harta bersih Rp 200 jt yang seharusnya belum
  mencapai nisab menjadi "wajib zakat Rp 5.000.000"; (2) tidak ada batas
  panjang: 30 digit → "Rp 25.000.000.000.000.002.000.000.000.000" (artefak
  floating point); (3) Classic memberi awalan "**Rp**" pada "Berat emas (gram)"
  dan "Berat perak (gram)".
- **Screenshot**: `192-zakat-gold-price-cleared.png`, `203-zakat-huge-assets.png`,
  `296-classic-zakat-emas-decimal-2.png`.

### B25. [Modern] Tasbih: target "Infinity" dan angka 0 yang "lengket" — LOW

- **Lokasi**: `WebAppTasbihRoute.js` baris 170–171 (`setTarget` →
  `normalizeTarget`), kolom target `value={`${target}`}` (baris 333–339).
- **Actual**: mengetik 25 digit di "Atur Target" menghasilkan "**Infinity**" di
  kolom, statistik Target, dan label aksesibilitas ("0 dari Infinity");
  mengosongkan kolom selalu kembali ke "0" (jadi harus menghapus angka 0 setiap
  kali); setiap perubahan target juga mereset hitungan ke 0. Hitungan boleh
  melewati target ("9 dari 7").
- **Screenshot**: `104-tasbih-target-huge.png`, `106-tasbih-beyond-target.png`.

### B26. [Modern] Waris: Suami dan Istri bisa dipilih bersamaan, salah satunya diabaikan diam-diam — LOW

- **Lokasi**: `lib/faraidh.js` (`if (suami > 0) … else if (istri > 0)`) dan form
  ahli waris `WebAppFaraidhRoute.js`.
- **Actual**: Suami = 1 + Istri = 4 → hasil hanya memuat Suami; 4 istri
  dibuang tanpa peringatan (kombinasi mustahil tapi diterima form).
- **Screenshot**: `214-faraidh-stepper-limits.png`.

### B27. [Modern & Classic] Qibla meminta izin lokasi dua kali beruntun — LOW

- **Lokasi**: `QiblaScreen.js` `load` (baris 225–258) dan
  `utils/compass.js` `watchCompassHeading` (keduanya memanggil
  `requestForegroundPermissionsAsync`).
- **Actual**: setelah izin dicabut, membuka Qibla memunculkan dialog sistem
  **dua kali berturut-turut** (yang kedua dengan tombol "Don't allow" yang
  langsung menjadi penolakan permanen), lalu dua banner pesan sekaligus
  ("Aktifkan lokasi…" dan "Izin lokasi diperlukan untuk mengaktifkan kompas.").
- **Screenshot**: `50-qibla-permission-dialog.png`, `52-qibla-after-second-deny.png`.

---

## Catatan tambahan (bukan bug fungsional, tapi worth mencatat)

### C1. Hipotesis "deep link `ibadah/prayer` cuma ganti tab" — TERBANTAHKAN — INFO

`App.js` memang tidak mengoper `deepLinkTarget` ke `IbadahScreen`, **tetapi**
`handleDeepLink` mengisi `internalRoutes[tab] = { view }` bila `params.view`
ada, dan `IbadahScreen` membaca `navigation.current.view`. Semua varian diuji di
device: `prayer`, `sholat`, `ibadah/jadwal-sholat` → Jadwal utama;
`ibadah/settings`, `prayer/settings` → Pengaturan Sholat; `qibla`, `kiblat`,
`ibadah/qibla` → Qibla; `belajar/<key>` → fitur Belajar. Tidak ada deep link
untuk **Khatam**, **Tasbih**, dll. (`ibadah/khatam`, `ibadah/tasbih` → hanya hub;
tanpa pesan galat). `deepLinkTarget` memang tidak dipakai Ibadah, jadi tidak
ada yang perlu diperbaiki di sana.

### C2. Kondisi lokasi emulator dan tooling (lihat "Metodologi") — INFO

Kartu jadwal di Beranda sempat memakai lokasi basi Ukiah (emulator), dan
`getCurrentPositionAsync({})` tanpa timeout bisa menggantung ±20 detik di
perangkat tanpa fix — bagian dari B7.

### C3. Dua temuan peripheral backend — INFO

(a) **Deploy di tengah audit**: `/api/v1/doa` semula tanpa `translation`
(bug `go vet` tag ganda, perbaikan `f9881000`); pukul ±19:00 respons sudah memuat
`translation_text` dan objek `translation`, dan Modern memang langsung
menampilkan arti doa (dicek ulang). Pengamatan "detail Doa Modern hanya Arab +
Info" pukul ±17:57 adalah kondisi sebelum deploy.
(b) **Rate limit**: API membalas 429 (`{"error":"too many requests"}`) ke
`sholat-times` dan masih membalas 429 dengan `retry-after: 9` dari host saat
audit; sebagian besar traffic itu dari audit ini. **Risiko yang perlu dicek**
(hipotesis, belum diverifikasi): limiter global (`RATE_LIMIT_GLOBAL`, default
300/menit) memakai `c.IP()` dan `fiber.Config` di `main.go:102` tidak punya
`ProxyHeader`; bila API di belakang Cloudflare/tunnel, semua tamu berbagi satu
bucket.

### C4. Picker muadzin: 9 entri, 8 file audio, tanpa pratinjau — INFO

`adzanSounds.js` punya 9 entri; "Default (Makkah)" dan "Adzan Masjidil Haram"
menunjuk file yang sama (`makkah-haram-02.mp3`). Kedelapan file unik ada di CDN
(HTTP 200). Tidak ada tombol putar pratinjau saat memilih; label "Dipilih"
hard-coded (tidak melewati `t()`). Memilih satu per satu berfungsi, tombol
Stop menghentikan audio.

### C5. Jadwal offline 30 hari berfungsi; risiko kunci dan catatan untuk audit Hadis — INFO

Simpan (30 hari, progres, "30 hari jadwal sholat tersimpan."), "Pakai hari ini"
(pesan kosong dan isi), dan "Hapus" PASS. Risiko (dari kode): kunci paket
memakai koordinat dibulatkan 3 desimal (`offlineContent.native.js`
`roundedCoord`, ±110 m), sehingga drift GPS di dekat batas pembulatan bisa
membuat paket offline "tidak ketemu". Catatan silang: file `offlineContent.js`
adalah **stub web**, sedangkan Android memakai `offlineContent.native.js`
(implementasi nyata); akar masalah C3 di audit Hadis ("`getOfflineOverview()`
selalu unsupported") perlu dicek ulang karena Metro memilih varian `.native`.

### C6. Penamaan dan duplikasi konten — INFO

Hub menyebut "**Log Sholat**", fiturnya "Sholat Tracker"; hub "**Faraidh**",
layar "Kalkulator Waris". **Wirid** dan **Dzikir** memakai dataset yang sama
(37 item identik, `/api/v1/wirid` = `/api/v1/dzikir`) dengan subjudul berbeda.
Copy "Wirid Saya": "…dari dashboard" (merujuk dashboard web).

### C7. Imsakiyah: hanya Jakarta, hanya bulan berjalan — INFO

Subjudul tetap "Jakarta (WIB)" (tidak mengikuti lokasi user); Classic menampilkan
tiga waktu per hari **tanpa label** ("04:25 · 04:35 · 17:52") dan mulai dari
tanggal 1 (hari ini ada di dasar daftar, tanpa sorotan).

### C8. Kalender Hijriah — INFO

Catatan kaki Modern sendiri bilang "_Estimasi naive 30 hari/bulan Hijri_"
(selisih beberapa hari dari kalender resmi); daftar peristiwa Classic tidak
kronologis (Tasu'a/Asyura sebelum Nisfu Sya'ban). Tanggal hari ini ("17 Rabiul
Akhir 1448 H") masuk akal (±1 hari).

### C9. Tombol minus pada `decimal-pad` — INFO

Kolom lokasi manual (lintang negatif untuk Indonesia selatan) memakai
`keyboardType='decimal-pad'` (tanpa flag SIGNED di Android). Di Gboard (emulator)
tombol "−" ada, jadi tidak reproduksi; namun keyboard lain dan **iOS** (app
punya target iOS di `app.json`) tidak menyediakan tanda minus pada decimal pad.
Pertimbangkan `numeric`/parser yang menerima "S".

### C10. Format dan kosmetik — INFO

Jarak Qibla `toLocaleString("en-US")` → "7,920 km" (Indonesia: 7.920); jam hero
"17.15" (titik) vs jadwal "17:47" (titik dua); aksen Qibla oranye sedangkan
Jadwal hijau; judul Qibla muncul 4× (header, judul, hero, kartu); Masjid tanpa
padding horizontal (pill dan kartu menempel ke tepi layar); Classic Dzikir
menampilkan key mentah "dzikir_umum"; ikon kecil notifikasi generik (bulatan
abu-abu); "Dipilih" dan sebagian string tidak melewati `t()`.

### C11. Tab bar Classic auto-hide — INFO

`TabBar.js` menyembunyikan bar setelah 2,8 detik (tersisa strip 63 px);
muncul lagi oleh aktivitas scroll/sentuh (`TabActivityContext`). Bukan bug,
tapi alasan di balik temuan a11y "bounds aneh" di audit Hadis; saat bar
tersembunyi `pointerEvents='none'` sehingga mengetuk area bawah tidak
memunculkannya.

### C12. Riwayat Zakat/Waris — INFO

Simpan lokal (guest), tampil di Riwayat dengan pesan "Riwayat lokal tetap
tersimpan di perangkat ini", hapus berfungsi. Badge "Belum Dibayar" pada riwayat
Zakat read-only (tidak ada kontrol menandai sudah dibayar di mobile). Ringkasan
Waris yang tersimpan membawa hasil B3.

### C13. Khatam hanya diverifikasi sebagai guest — INFO

Kondisi login (progress, target hari, peta juz, "Lanjutkan membaca") tidak
diuji. Guest: card "Khatam Tracker / Login untuk melihat progress khatam
Quran-mu." + "Masuk dari Profil" PASS (B18 untuk Back). Menu hamburger di build
ini hanya berisi Tokoh Islam, Peta Interaktif, Perawi Hadith, Pengaturan,
Bantuan, Tentang — tidak ada rute Khatam.

### C14. Persistensi — INFO

Tersimpan setelah cold start: pilihan muadzin, toggle audio adzan, jeda dan waktu
pengingat, status pengingat, hitungan per-nama Wirid Asmaul Husna. Tidak
tersimpan: hitungan Tasbih (B17), indeks nama Asmaul Wirid (selalu kembali ke
#1), lokasi manual (B7).

---

## Checklist lengkap yang diuji (PASS kecuali disebutkan sebagai bug di atas)

### Hub Ibadah (16 baris)

| Kontrol                                  | Tujuan nyata                    | Modern                                                 | Classic                                         |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Hero "Ibadah" / judul + 5 header section | Info saja                       | ✅ PASS                                                | ✅ PASS                                         |
| Jadwal Sholat                            | Jadwal (tab Ibadah)             | ✅ PASS                                                | ✅ PASS                                         |
| Doa                                      | Belajar → Doa                   | ✅ PASS navigasi; ❌ **B18**; ❌ **B5**                | ✅ PASS (terjemahan tampil); ❌ **B18**         |
| Dzikir                                   | Belajar → Dzikir                | ✅ PASS navigasi; ❌ **B5**, **B18**                   | ✅ PASS (key mentah, C10); ❌ **B18**           |
| Qibla                                    | Qibla (tab Ibadah)              | ✅ PASS; ❌ **B9**, **B10**, **B27**                   | ✅ PASS; ❌ **B9**                              |
| Kalender Hijriah                         | Belajar → Hijri                 | ✅ PASS; ❌ **B11**, **B18**                           | ✅ PASS; ❌ **B18**                             |
| Imsakiyah                                | Belajar → Imsakiyah             | ✅ PASS; ❌ **B12**, **B18**                           | ✅ PASS (C7); ❌ **B18**                        |
| Masjid                                   | Belajar → Masjid                | ✅ "Terdekat" PASS; ❌ **B13**, **B18**                | ✅ "Terdekat" PASS; ❌ **B6**, **B13**, **B18** |
| Wirid                                    | Belajar → Wirid                 | ✅ PASS; ❌ **B5** (+ chip "Umum" mati), **B18**       | ✅ PASS; ❌ **B18**                             |
| Wirid Saya                               | Belajar → user-wird (guest)     | ✅ PASS (gating "Login…", tombol "Masuk" → Profil)     | ✅ PASS ("Buka Profil untuk masuk")             |
| Asmaul Husna                             | Belajar → Asmaul Husna          | ✅ PASS; ❌ **B5**, **B18**                            | ✅ PASS; ❌ **B18**                             |
| Tasbih                                   | Belajar → Tasbih                | ✅ PASS; ❌ **B17**, **B25**, **B18**                  | ✅ PASS; ❌ **B17**, **B18**                    |
| Zakat                                    | Belajar → Zakat                 | ✅ PASS; ❌ **B2**, **B24**, **B18**                   | ❌ **B6** (input mati), **B24**                 |
| Faraidh                                  | Belajar → Waris                 | ✅ PASS; ❌ **B3**, **B4**, **B8**, **B26**, **B23**   | ❌ **B6** (input mati)                          |
| Log Sholat                               | Belajar → Sholat Tracker        | ✅ PASS; ❌ **B16**, **B23**                           | ✅ PASS; ❌ **B16**                             |
| Manasik                                  | Belajar → Manasik               | ✅ PASS (buka detail, bukan inline expand); ❌ **B21** | ✅ PASS; ❌ **B21**                             |
| Khatam                                   | Khatam (tab Ibadah)             | ✅ PASS (guest)                                        | ✅ PASS (guest, tombol kembali OK)              |
| Header aplikasi: Cari / Menu / Avatar    | Pencarian global / sheet / akun | ✅ PASS (ketiganya)                                    | N/A (Classic tidak punya header aplikasi)       |

### Jadwal Sholat (layar utama)

| Kontrol                                     | Expected                                   | Modern                                                | Classic                                |
| ------------------------------------------- | ------------------------------------------ | ----------------------------------------------------- | -------------------------------------- |
| Hero (tanggal, koordinat, metode)           | Tampil sesuai lokasi                       | ✅ PASS                                               | ✅ PASS (tanpa hero)                   |
| Jam besar + hitung mundur                   | Tick per detik                             | ✅ PASS (format jam "17.15", C10)                     | ✅ PASS (hanya hitung mundur)          |
| Baris jadwal 7 waktu + "Berikutnya"         | Waktu benar                                | ✅ PASS (dihitung ulang, ±1 mnt)                      | ✅ PASS (tanpa sorotan)                |
| Tombol Muat ulang                           | Reload, disabled saat loading              | ✅ PASS; ❌ **B7** saat gagal                         | ✅ PASS                                |
| Pull-to-refresh                             | Reload                                     | ✅ PASS by `Screen onRefresh`                         | ✅ PASS (memicu 429 → `--:--`, **B7**) |
| Tombol Pengaturan                           | Buka Pengaturan Sholat                     | ✅ PASS                                               | ✅ PASS                                |
| Kartu lokasi manual (izin ditolak)          | Muncul bila tanpa GPS                      | ✅ PASS; ❌ **B20**, **B7**                           | ✅ PASS (kode sama)                    |
| Validasi koordinat manual                   | Menolak di luar rentang (Qibla diuji live) | ✅ PASS ("Masukkan koordinat yang valid…")            | ✅ PASS                                |
| Hitung mundur 0 → notifikasi + adzan        | Bunyi di layar                             | ✅ PASS di layar (17:47); ❌ **B14** di tab lain      | ✅ (kode sama)                         |
| Tombol Stop adzan                           | Hentikan audio                             | ✅ PASS                                               | ✅ PASS by kode                        |
| Hardware back                               | Kembali ke hub                             | ✅ PASS                                               | ✅ PASS                                |
| Tombol kembali on-screen                    | —                                          | N/A (tidak ada; hanya hardware/swipe)                 | N/A (tidak ada)                        |
| Koreksi "+N min" + "Waktu asli"             | Tampil bila koreksi ≠ 0                    | PASS by kode (tidak diverifikasi live di layar utama) | PASS by kode                           |
| Deep link `prayer`/`sholat`/`ibadah/prayer` | Buka Jadwal                                | ✅ PASS                                               | ✅ PASS                                |

### Pengaturan Sholat

| Kontrol                                        | Expected                                 | Modern                                               | Classic                         |
| ---------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| Tombol kembali (→ jadwal)                      | Kembali ke jadwal                        | ✅ PASS                                              | ✅ PASS                         |
| Metode (Kemenag/MWL/Makkah/ISNA)               | Hero "X · Y" berubah, waktu hitung ulang | ✅ PASS (4 pill; MWL Subuh 04:28)                    | ✅ PASS                         |
| Mazhab Ashar (Shafi/Hanafi)                    | Asr bergeser (Hanafi 15:59)              | ✅ PASS                                              | ✅ PASS                         |
| Koreksi ±1 × 7 baris                           | Nilai berubah                            | ✅ PASS (7 baris)                                    | ✅ PASS                         |
| Batas koreksi ±30                              | Berhenti di ±30                          | ✅ PASS (32 ketukan → +30/−30)                       | ✅ PASS by kode                 |
| Reset koreksi                                  | Semua 0                                  | ✅ PASS                                              | ✅ PASS by kode                 |
| Toggle Notifikasi Lokal                        | Jadwalkan/batalkan pengingat             | ❌ **B1**, **B15**                                   | ❌ **B1**                       |
| Toggle Audio Adzan                             | Munculkan picker                         | ✅ PASS                                              | ✅ PASS                         |
| Picker muadzin (9 entri)                       | Satu terpilih ("Dipilih")                | ✅ PASS (9 entri dipilih satu per satu; C4)          | ✅ PASS                         |
| Jeda pengingat (5 pill)                        | Satu terpilih                            | ✅ PASS (visual)                                     | ✅ PASS                         |
| Waktu sholat pengingat (5 chip, min. 1)        | Toggle; tidak boleh kosong               | ✅ PASS (Isya tidak bisa dicopot, tanpa umpan balik) | ✅ PASS                         |
| Atur ulang pengingat                           | Jadwalkan ulang bersih                   | ❌ **B1** (ON: tetap 10 alarm; yatim tak tersentuh)  | —                               |
| Jadwal offline: Simpan 30 hari                 | Progres → "30 hari"                      | ✅ PASS                                              | ✅ PASS by kode                 |
| Jadwal offline: Pakai hari ini                 | Muat dari offline / pesan kosong         | ✅ PASS (kedua kondisi)                              | ✅ PASS by kode                 |
| Jadwal offline: Hapus                          | "0 hari"                                 | ✅ PASS                                              | ✅ PASS by kode                 |
| Tema gelap                                     | Semua teks terbaca                       | ❌ **B19**                                           | N/A (dark Classic tidak dicoba) |
| Hardware back                                  | Kembali ke jadwal                        | ✅ PASS                                              | ✅ PASS                         |
| Deep link `ibadah/settings`, `prayer/settings` | Buka Pengaturan                          | ✅ PASS                                              | ✅ PASS                         |

### Izin dan lokasi

| Skenario                                         | Expected                         | Hasil                                                                   |
| ------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------- |
| Jadwal, izin ditolak                             | Pesan + kartu lokasi manual      | ✅ PASS ("Aktifkan lokasi untuk memuat jadwal sholat sesuai tempatmu.") |
| Jadwal, lokasi manual valid (-6,2088 / 106,8456) | Jadwal Jakarta tampil            | ✅ PASS; ❌ **B7** (hilang saat ganti metode), **B20**                  |
| Qibla, izin ditolak                              | Pesan + kartu manual             | ✅ PASS; ❌ **B27** (dua dialog)                                        |
| Qibla, koordinat manual: 95/10 (invalid)         | "Masukkan koordinat yang valid…" | ✅ PASS                                                                 |
| Qibla, koma desimal ("-6,2088"/"106,8456")       | Diterima                         | ✅ PASS (295°)                                                          |
| Qibla, GPS mock                                  | Bearing/jarak benar              | ✅ PASS (295°, 7.920 km; format "en-US", C10)                           |
| Qibla, Muat ulang                                | Reload                           | ✅ PASS                                                                 |
| Kompas (heading)                                 | Memutar cincin                   | Tidak bisa diuji (emulator tanpa sensor: "Kalibrasi kompas")            |

### Tasbih, Zakat, Waris

| Kontrol                                             | Expected                        | Modern                                                     | Classic                                 |
| --------------------------------------------------- | ------------------------------- | ---------------------------------------------------------- | --------------------------------------- |
| Tasbih: tombol hitung, Reset, Reset Semua           | Count naik; reset               | ✅ PASS                                                    | ✅ PASS (tanpa Reset Semua)             |
| Tasbih: target chip / preset (8)                    | Target berubah, hitung 0        | ✅ PASS (33/99/100/313/1000/Tanpa Batas; 8 preset)         | ✅ PASS (33/99/100)                     |
| Tasbih: toggle Getar                                | On/Off                          | ✅ PASS                                                    | N/A                                     |
| Tasbih: target manual                               | Angka valid                     | ❌ **B25**                                                 | N/A                                     |
| Tasbih: persistensi                                 | Bertahan                        | ❌ **B17**                                                 | ❌ **B17** (sesi ya, proses mati tidak) |
| Zakat: 6 tab (Maal/Fitrah/Dagang/Tani/Emas/Riwayat) | Ganti tab                       | ✅ PASS                                                    | ✅ PASS (tab bisa diketuk)              |
| Zakat Maal: harta vs nisab, utang, haul             | 2,5% bila ≥ nisab & haul        | ✅ PASS (300 jt → 7,5 jt; −100 jt utang → 0; haul off → 0) | ❌ **B6** (tak bisa mengisi)            |
| Zakat Fitrah: stepper jiwa, harga/kg                | 2,5 kg × harga × jiwa           | ✅ PASS (min 1, tanpa maks; 4 jiwa = 160.000)              | —                                       |
| Zakat Dagang                                        | 2,5% (modal+stok+piutang−utang) | ✅ PASS (280 jt → 7 jt)                                    | —                                       |
| Zakat Tani: nisab 653 kg; irigasi 5%/10%            | Batas 653                       | ✅ PASS (652 → 0; 653 → Rp 1.044.800); ❌ **B2** desimal   | —                                       |
| Zakat Emas/Perak                                    | Nisab emas 85 g / perak 595 g   | ✅ PASS (integer); ❌ **B2** desimal; ❌ **B24**           | ❌ **B6**; ❌ **B24**                   |
| Zakat: Simpan (guest) → Riwayat → Hapus             | Tersimpan lokal; hapus          | ✅ PASS; badge status read-only (C12)                      | —                                       |
| Waris: steppers (16 jenis ahli waris)               | Batas wajar                     | ✅ PASS (suami/ayah/ibu maks 1, istri maks 4); ❌ **B26**  | ❌ **B6**                               |
| Waris: Istri + Anak L + Anak P                      | 1/8; 2:1 sisa                   | ✅ PASS (30 jt / 140 jt / 70 jt)                           | —                                       |
| Waris: Suami + 2 saudari ('aul)                     | 3/7 dan 4/7                     | ✅ PASS (Node)                                             | —                                       |
| Waris: Umariyyatain                                 | Ibu 1/3 sisa                    | ❌ **B3**                                                  | —                                       |
| Waris: diagram silsilah                             | Pecahan & status benar          | ❌ **B4**                                                  | N/A (tidak ada diagram di Classic)      |
| Waris: batas wasiat                                 | 1/3 dari harta bersih           | ❌ **B8**                                                  | —                                       |
| Waris: Simpan/Riwayat/Hapus                         | Tersimpan lokal                 | ✅ PASS                                                    | —                                       |

### Bacaan dan referensi

| Kontrol                                           | Expected                          | Modern                                                  | Classic                       |
| ------------------------------------------------- | --------------------------------- | ------------------------------------------------------- | ----------------------------- |
| Doa: kartu → detail (halaman terpisah)            | Buka detail, tombol Kembali       | ✅ PASS (arti doa tampil setelah deploy, C3)            | ✅ PASS (arti tampil)         |
| Doa: chip kategori / cari                         | Semua data                        | ❌ **B5**                                               | N/A (tanpa filter)            |
| Dzikir/Wirid: chip + cari + "Muat lebih banyak"   | Semua data                        | ❌ **B5**                                               | ✅ daftar; filter tidak ada   |
| Asmaul Husna: daftar + cari + "Muat lebih banyak" | Semua 99 nama                     | ❌ **B5**                                               | ✅ daftar                     |
| Flashcard Asmaul Husna (deep link)                | Balik kartu, prev/next, acak      | ✅ PASS (1/99 → …; Acak; prev disabled di 1)            | —                             |
| Wirid Asmaul Husna (deep link)                    | Hitung per nama; prev/next; reset | ✅ PASS; hitungan per nama persisten setelah cold start | —                             |
| Wirid Saya (guest)                                | Gating login                      | ✅ PASS                                                 | ✅ PASS                       |
| Hijri: hari ini, puasa sunnah, akan datang        | Tampil                            | ✅ PASS; ❌ **B11** konversi                            | ✅ PASS (daftar)              |
| Imsakiyah: tabel bulan berjalan                   | Tampil, hari ini disorot          | ✅ PASS (hari ini disorot); ❌ **B12**                  | ✅ PASS (C7)                  |
| Masjid: daftar, "Masjid Terdekat"                 | Urut jarak                        | ✅ PASS (Sunda Kelapa 1,7 km …)                         | ✅ PASS                       |
| Masjid: pencarian                                 | Filter                            | ❌ **B13**                                              | ❌ **B6**, **B13**            |
| Manasik: daftar 17 langkah, chip Haji/Umrah       | Filter + detail                   | ✅ PASS navigasi; ❌ **B21**                            | ✅ PASS; ❌ **B21**           |
| Sholat Tracker (guest)                            | Gating login                      | ✅ tampil; ❌ **B16**                                   | ✅ notice + toast; ❌ **B16** |

### Navigasi lintas fitur, persistensi, dan lintas tema

| Kontrol                                                                                                                           | Hasil                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Toggle Modern ↔ Classic (Profil → Pengaturan → Tampilan → Mode Layout)                                                            | ✅ PASS; tema Gelap/Ikuti Sistem juga diuji                                                         |
| Hardware back: Jadwal utama → hub; Pengaturan → Jadwal                                                                            | ✅ PASS                                                                                             |
| Hardware back: Qibla/Khatam → hub                                                                                                 | ✅ PASS (tombol on-screen Qibla ❌ **B9**)                                                          |
| Hardware back: fitur Belajar (dari hub Ibadah) → hub Belajar → Beranda                                                            | ❌ **B18**                                                                                          |
| Swipe-back di layar dalam                                                                                                         | Tidak diuji terpisah (gesture `SwipeBackView`)                                                      |
| Deep link: `prayer/sholat/ibadah/prayer`, `ibadah/settings`, `qibla/kiblat`, `belajar/<key>`, tanpa deep link untuk Khatam/Tasbih | ✅ PASS (C1)                                                                                        |
| Notifikasi `prayer`/"Waktu Sholat": tap membuka Jadwal                                                                            | ✅ PASS dari background (deep link sama); ❌ **B22** saat di Pengaturan                             |
| Tab bar Classic auto-hide                                                                                                         | Bukan bug (C11)                                                                                     |
| Persistensi pengaturan sholat setelah cold start                                                                                  | ✅ PASS (muadzin, audio, jeda, waktu, status pengingat); lokasi manual ❌ **B7**; Tasbih ❌ **B17** |
| Crash check (`pidof` + crash buffer + DropBox)                                                                                    | ✅ 0 crash app sepanjang sesi, termasuk setelah cabut izin, `am kill`, dan `pm clear`               |

### Indeks screenshot pendukung (selain yang sudah disebut di tiap bug)

Semua ada di `apps/mobile/output/native/2026-09-30-ibadah-deep-audit/`.

- **Hub & umum**: `00-launch-home.png` (Beranda dengan lokasi basi "UKIAH",
  artefak emulator), `01-modern-ibadah-hub-top.png`,
  `02-modern-ibadah-hub-mid.png`, `03-modern-ibadah-hub-bottom.png`,
  `263-classic-hub-top.png`, `240-modern-hamburger-menu.png`,
  `350-header-search.png`, `351-header-avatar-menu.png`,
  `250-profile-appearance.png`, `251-dark-theme-selected.png`,
  `260-classic-selected.png`, `341-final-state-home.png`,
  `380-final-clean-home.png`.
- **Jadwal Sholat / Pengaturan**: `04-modern-deeplink-ibadah-prayer.png`,
  `05f-prayer-refresh-with-gps-loop.png`,
  `06-modern-prayer-schedule-scrolled.png`, `64-prayer-gps-restored.png`,
  `10-modern-prayer-settings-top.png`, `11-modern-settings-method-mwl.png`,
  `12-modern-settings-corrections-clamped.png`,
  `13-modern-settings-corrections-all-rows.png`,
  `16-modern-settings-adzan-picker.png`,
  `17-modern-settings-adzan-last-selected.png`,
  `18-modern-lead-30-selected.png`, `19-modern-prayers-4-deselected.png`,
  `20-modern-prayers-try-deselect-last.png`,
  `21-modern-settings-bottom-offline.png`,
  `22-modern-offline-pakai-hari-ini-empty.png`,
  `23-modern-offline-download-progress.png`,
  `24-modern-offline-download-done.png`, `25-modern-offline-cleared.png`,
  `31-hw-back-from-settings.png`, `110-prayer-before-maghrib.png`,
  `114-prayer-after-stop-2s.png`, `115-prayer-kemenag-hanafi.png`,
  `270-classic-prayer.png`, `271-classic-settings-scrolled.png`,
  `320-classic-prayer-before-isya.png`, `322-back-to-ibadah-after-isya.png`,
  `324-classic-after-pull.png`, `370-modern-settings-clean-state.png`,
  `373-atur-ulang-while-off.png`.
- **Izin & lokasi manual**: `50`–`56` (Qibla: dialog, ditolak, manual
  valid/invalid), `60-prayer-permission-denied.png`,
  `62-prayer-manual-applied.png`.
- **Qibla / Khatam**: `40-modern-qibla.png`, `43-modern-qibla-bottom.png`,
  `44-modern-qibla-refresh-loading.png`, `280-classic-qibla.png`,
  `70-modern-khatam-guest.png`, `71-modern-khatam-masuk-profil.png`,
  `282-classic-khatam-guest.png`, `283-classic-khatam-guest.png`.
- **Tasbih**: `101-modern-tasbih-lower.png`, `102-tasbih-target-chips.png`,
  `103-tasbih-target-5.png`, `105-tasbih-preset-hasbunallah.png`,
  `107-tasbih-after-kill.png`.
- **Zakat / Waris**: `190-modern-zakat.png`, `191-zakat-maal-net-below-nisab.png`,
  `193-zakat-haul-off.png`, `194-zakat-saved-msg.png`, `195-zakat-history.png`,
  `197-zakat-history-after-delete.png`, `198-zakat-fitrah.png`,
  `199-zakat-dagang.png`, `294-classic-zakat.png`, `210-modern-faraidh.png`,
  `211-faraidh-bottom-empty.png`, `216-faraidh-saved.png`.
- **Bacaan & referensi**: `120-modern-dzikir.png`, `131-doa-list-end.png`,
  `132-doa-detail.png`, `340-modern-doa-after-deploy.png`,
  `181-modern-user-wird-guest.png`, `183-modern-asmaul-husna.png`,
  `185-asmaul-flashcard.png`, `186-asmaul-flashcard-state.png`,
  `187-asmaul-wirid.png`, `188-asmaul-wirid-after-coldstart.png`,
  `330-classic-doa.png`, `330-classic-wirid.png`,
  `330-classic-user-wird.png`, `330-classic-asmaul-husna.png`,
  `292-classic-dzikir.png`.
- **Hijri / Imsakiyah / Masjid**: `140-modern-hijri.png`,
  `143-hijri-date-field-tapped.png`, `290-classic-hijri.png`,
  `152-imsakiyah-bottom.png`, `291-classic-imsakiyah.png`,
  `160-modern-masjid.png`, `161-masjid-terdekat.png`,
  `164-masjid-search-istiqlal-nearme-off.png`,
  `171-masjid-toggle-nearme.png`, `172-masjid-toggle-off-again.png`.

---

## Prioritas Perbaikan (untuk sesi fix terpisah)

1. **B1** (pengingat dobel + alarm yatim) — satu-satunya bug yang membuat app
   bertindak di luar kendali user (notifikasi tetap datang setelah dimatikan).
   Perbaikan kecil: satu jalur penjadwalan, bersihkan semua notifikasi
   `prayer_reminder` sebelum menjadwalkan, identifier deterministik. Kerjakan
   bersama **B14** dan **B15** (alert sholat hanya hidup di layar Jadwal;
   tambahkan izin alarm eksak atau minimal beri tahu user; terjemahkan teks).
2. **B2** (Zakat membuang desimal) — angka kewajiban ibadah salah 10×;
   pisahkan input berat (desimal) dari input rupiah. Sekalian **B24**.
3. **B3 + B4 + B8** (Kalkulator Waris) — satu paket: Umariyyatain (mother =
   1/3 sisa), key/field diagram (`num/den`, snake_case), batas wasiat dari
   harta bersih; libnya dipakai bareng web, jadi perbaiki di kedua tempat dan
   tambahkan unit test kasus Umariyyatain, Musytarakah, dan cucu perempuan +
   satu anak perempuan (minta review ustadz/tim fiqh).
4. **B6** (Classic: input Belajar kehilangan fokus) — `Screen.js` jangan
   memberi `renderHeader` inline sebagai `ListHeaderComponent` (memo/elemen
   stabil); satu perbaikan memulihkan Zakat, Waris, Masjid di Classic dan
   menutup kelas bug yang sama dengan Quran B1.
5. **B5** (filter/cari 20 item) — dataset Dzikir/Doa/Asmaul kecil: ambil sekali
   (`size=100–200`) atau `q`/`category` di backend.
6. **B7** (jadwal tanpa cache) — cache jadwal terakhir + koordinat, pisahkan
   load GPS dari load jadwal, persist lokasi manual; turunkan frekuensi
   request (juga mengurangi risiko 429, lihat C3).
7. **B9 + B10 + B18** (navigasi) — Qibla pakai `navigation.close("ibadah")` dan
   bersihkan header saat unmount; beri `returnTo` untuk baris hub yang lompat
   ke tab Belajar supaya Back kembali ke Ibadah.
8. **B16** (Sholat Tracker: tanggal lokal + riwayat nyata via `/sholat/history`).
9. **B11 + B12 + B13** (dead control Hijri, panah/scroll Imsakiyah, pencarian
   Masjid saat mode terdekat + debounce).
10. **B17 + B19 + B20** (Tasbih persisten, dark mode Pengaturan Sholat, IME
    inset pada input lokasi manual).
11. **B21–B27** (LOW: markdown Manasik, deep link prayer, header basi, dst).
12. **C3(b)** — cek apakah limiter global memakai IP proxy; ini mengenai
    seluruh app bila benar.
13. **C5/C9** — catatan untuk tim: verifikasi ulang C3 audit Hadis (varian
    `.native`), dan ganti `decimal-pad` untuk koordinat (iOS tanpa minus).
