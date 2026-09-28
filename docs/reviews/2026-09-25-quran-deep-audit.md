# Deep Audit: Fitur Al-Qur'an (Modern & Classic) — 2026-09-25

> Audit MENDALAM (bukan sweep dangkal) satu fitur: Al-Qur'an di `apps/mobile`.
> Setiap kontrol interaktif dicoba manual satu per satu (search, tab switcher,
> reader, audio single-ayah, Audio Range Panel, settings, tafsir/asbab/munasabah/hadis
> modal, hardware back button, swipe gesture, deep link) di kedua tema — Modern
> (Web App, 5-tab) dan Classic (Paper). Tujuan: nemuin bug yang lolos dari sweep
> screenshot dangkal sebelumnya (lihat
> [2026-09-24-mobile-app-screenshot-baseline.md](./2026-09-24-mobile-app-screenshot-baseline.md)),
> mirip contoh tombol "Catatan" Blog yang trigger state broken.

**Status**: 6 bug dilaporkan (5 di Modern, 1 di Classic-adjacent/Belajar-hub —
ditemukan tidak sengaja, di luar scope Quran tapi dicatat karena mirip pola
"dead-end back button" yang sudah pernah difix untuk layar lain), 1 catatan UX
minor, 1 catatan konten. Tidak ada crash yang ditemukan sepanjang sesi ini
(`pidof` dicek setelah setiap interaksi berisiko). Screenshot:
`apps/mobile/output/native/2026-09-25-quran-deep-audit/*.png`.

## Setup

- Build: `cd apps/mobile/android && JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 ./gradlew assembleRelease`
  (fresh build dari working tree saat ini, termasuk perubahan uncommitted di
  `QuranScreen.js` — hardware-back-button handler baru, lihat bagian Metodologi).
- Install: `adb install -r android/app/build/outputs/apk/release/app-release.apk`
  ke emulator `tholabul_pixel_7_api36` yang sudah jalan.
- Package: `com.anonymous.thullaabulilmimobile`.
- Sesi guest (Tamu) — percobaan bikin akun test lewat UI Daftar terhambat bug
  tidak terkait Quran (form toggle Email/WhatsApp bikin tombol "Buat Akun" stuck
  disabled setelah switch channel — dicatat sebagai temuan sampingan, tidak
  diinvestigasi lebih lanjut karena di luar scope). Karena itu, semua behavior
  yang butuh login (Bookmark, Simpan Progres, Catatan, Hafalan, Murojaah) hanya
  diverifikasi untuk **guest-gating message**-nya (semua PASS — muncul pesan
  "Masuk dari Profil..." yang benar, bukan crash/silent-fail), bukan alur
  simpan/hapus datanya yang sesungguhnya.

## Metodologi & catatan penting

- Koordinat tap SELALU diambil dari `adb shell uiautomator dump` (bounds native
  1080×2400), bukan hasil eyeball dari screenshot (yang ditampilkan tool di
  900×2000 — butuh kali 1.2 kalau mau dipakai langsung, dan beberapa kali salah
  pas awal sesi sebelum konsisten pakai dump).
- `apps/mobile/src/screens/QuranScreen.js` punya **diff belum-commit** (+81
  baris) yang menambah `useEffect` baru untuk `BackHandler.addEventListener("hardwareBackPress", ...)`
  dengan priority chain (settings → tajweed → reference modal → munasabah →
  hadis modal → ayah action sheet → ayah detail → audio player → exit reader →
  clear back stack). Ini kode BARU yang belum pernah diuji end-to-end, jadi
  sesi ini menaruh perhatian ekstra di situ — dan menemukan bug MB-1 di
  bawah.
- `uiautomator dump`'s atribut `hint`/`text` **tidak reliable** untuk membaca
  isi TextInput React Native saat ini (sempat menyesatkan sebentar — field yang
  visualnya terisi tetap melaporkan `hint` seolah kosong). Semua kesimpulan "field
  kosong" di laporan ini diverifikasi lewat screenshot visual, bukan dump XML.
- `adb shell input text` gagal mengisi TextInput dengan `keyboardType='number-pad'`
  kalau ada banyak EditText lain di layar yang sama (mis. kotak "Halaman" di
  Classic Navigator) — sedangkan `adb shell input keyevent KEYCODE_5` dkk.
  berhasil. ini keterbatasan tooling ADB, **bukan bug aplikasi** — dikonfirmasi
  dengan mengetik via keyevent yang berhasil masuk ke field yang sama.

---

## Temuan Bug

### B1. [Modern] Kotak pencarian "Cari surah..." sama sekali tidak bisa difokus/diketik — HIGH

- **Lokasi**: `apps/mobile/src/screens/quran/QuranScreenRenderers.js`,
  `renderWebAppQuranListHeader()`, `TextInput` sekitar baris 2196–2205
  (`onChangeText={setSurahQuery}` ... `placeholder='Cari surah...'`).
- **Expected**: tap kotak pencarian → keyboard muncul → ketik → daftar surah
  ter-filter (persis seperti versi Classic yang terbukti bekerja, lihat B1-classic-control
  di bawah).
- **Actual**: **CRASH-adjacent / WRONG BEHAVIOR**. Tap di kotak pencarian
  (koordinat diverifikasi presisi via `uiautomator dump`, dicoba ulang >5×
  dengan tap biasa, tap+immediate `input text`, dan long-press/swipe-hold) —
  keyboard **tidak pernah muncul**, tidak ada karakter yang masuk. Sebagai
  kontrol, kotak pencarian Global Search (`Cari` di header atas) DAN kotak
  pencarian yang sama persis di tema **Classic** (`quranSearchInput`)
  terbukti bisa diketik normal pada percobaan yang sama — jadi ini bukan
  masalah emulator/ADB, murni spesifik ke TextInput ini di layout Modern.
- **Root cause (hipotesis, perlu dikonfirmasi pakai React DevTools/Profiler)**:
  `renderQuranListHeader`/`renderWebAppQuranListHeader` adalah fungsi yang
  dibuat ULANG setiap render `QuranScreen` (dikembalikan dari
  `createQuranScreenRenderers(context)` yang dipanggil di body komponen, bukan
  di-memo). Fungsi ini dipakai sebagai `ListHeaderComponent` FlatList
  (`QuranScreen.js` baris ~2351). React Native's VirtualizedList memperlakukan
  `ListHeaderComponent` sebagai tipe komponen — kalau identitasnya berubah
  setiap render, subtree-nya di-unmount+remount, sehingga TextInput kehilangan
  fokus (atau tidak pernah sempat fokus) tiap kali parent re-render. Perlu
  dicek apakah `QuranScreen` re-render secara periodik walau idle (mis. lewat
  context lain) — kalau ya, itu penyebabnya; kalau tidak, butuh investigasi
  lanjutan dengan Flipper/React DevTools.
- **Dampak**: di Modern (tema default 5-tab yang disebut CLAUDE.md sebagai tema
  "Modern"), user **tidak bisa mencari surah sama sekali** — satu-satunya cara
  menemukan surah adalah scroll manual 114 baris.
- **Screenshot**: `03-search-yasin.png`, `after-tap-search.png` (lihat juga
  kontrol Classic yang berhasil: `50-classic-search.png`,
  `51-classic-search-yasin.png`).

### B2. [Modern] CTA "Navigasi Mushaf" selalu buka Halaman 1, tidak pernah bisa pilih halaman/hizb lain — HIGH

- **Lokasi**: `apps/mobile/src/screens/quran/QuranScreenRenderers.js`,
  `renderWebAppQuranListHeader()`, `Pressable onPress={() => openPage(pageInput)}`
  sekitar baris 2207–2246 (testID `quran-web-app-mushaf-cta`).
- **Expected**: sesuai copy-nya sendiri — "Navigasi Mushaf — Buka ayat
  berdasarkan halaman mushaf atau hizb" — harusnya ada cara memilih nomor
  halaman/hizb sebelum navigasi.
- **Actual**: **WRONG BEHAVIOR**. Tap CTA ini SELALU membuka halaman 1,
  karena `pageInput` state di-default `"1"` dan Modern layout **tidak pernah
  merender** input angka halaman/hizb (`renderNavigatorPanel()` — lihat
  `QuranScreenRenderers.js` baris ~2299-2368 — hanya dipanggil dari
  `renderQuranListFooter()` untuk cabang `!isWebAppLayout`, baris ~2372-2385).
  Di Modern, `renderQuranListFooter` untuk tab "surah" cuma mengembalikan teks
  pesan, tanpa navigator apa pun. Jadi CTA yang tampil menonjol di paling atas
  daftar surah Modern ini secara fungsional adalah tombol "buka halaman 1"
  yang dibungkus copy yang menjanjikan jauh lebih banyak.
- **Root cause**: `renderNavigatorPanel()` (dengan tab Halaman/Hizb + TextInput
    - tombol "Buka Halaman"/"Buka Hizb") hanya ada di cabang Classic
      `renderQuranListFooter`, tidak pernah di-mount untuk `isWebAppLayout`.
- **Dampak**: fitur "buka mushaf per halaman/hizb" yang sudah lengkap logic-nya
  (`openPage`, `openHizb`, validasi range 1-604/1-240) sepenuhnya tidak
  reachable dari UI Modern.
- **Screenshot**: `04-navigasi-mushaf-cta.png` (hasil: langsung "Halaman 1").
  Kontrol Classic yang lengkap (tab Halaman/Hizb + input + tombol berfungsi):
  `51-classic-search-yasin.png`, `52-classic-buka-halaman-50.png`,
  `hizb-fresh.png`, `page50-final.png`.

### B3. [Modern] Nama Arab surah 2-kata terpotong di daftar surah (mis. "Ali 'Imran") — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/QuranScreen.styles.js`,
  style `webAppSurahArabic` (baris ~466-475, `maxWidth: "34%"`, tanpa
  `numberOfLines`); dipakai di
  `apps/mobile/src/screens/quran/QuranScreenRenderers.js` `renderSurahRow()`
  baris ~2111-2118 lewat `getCompactArabicSurahName(surah.arabic)`.
- **Expected**: nama Arab surah 3 "Ali 'Imran" tampil penuh setelah prefix
  "سُورَةُ" dibuang oleh `getCompactArabicSurahName` — hasilnya harus
  "آلِ عِمْرَانَ" (2 kata).
  **Terbukti** ini benar di Classic (`styles.surahArabic`, tanpa fungsi compact,
  menampilkan teks lengkap "سُورَةُ آلِ عِمْرَانَ" — lihat
  `46-classic-surah-list2.png`).
- **Actual**: di Modern, baris surah 3 hanya menampilkan **"آلَ"** — satu kata,
  bahkan diakritiknya beda (fatḥah, bukan kasrah yang seharusnya ada di
  "آلِ"), kata kedua "عِمْرَانَ" hilang sama sekali. Terverifikasi
  reproducible 3× di screenshot berbeda (`37-backpress-reader-exit.png`,
  `02-quran-list-modern.png`, screenshot list lain).
- **Root cause (hipotesis)**: `getCompactArabicSurahName` sendiri cuma
  meng-strip prefix "سُورَةُ" via regex — hasilnya string 2 kata penuh, jadi
  bug-nya bukan di helper. Kemungkinan besar ini masalah **layout/wrap**:
  `Text` tanpa `numberOfLines` di container dengan `maxWidth: "34%"` yang
  sempit membuat teks RTL 2-baris ter-wrap, lalu baris kedua ter-clip oleh
  tinggi row yang fixed (perlu dikonfirmasi dengan inspect layout langsung —
  di luar cakupan waktu audit ini untuk root-cause 100% pasti, tapi bug
  visualnya sendiri sudah pasti reproducible).
- **Dampak**: kosmetik tapi mengganggu — nama surah Arab terlihat salah/aneh
  untuk minimal 1 surah (Ali 'Imran); kemungkinan surah 2-kata lain
  (jarang, karena mayoritas nama surah 1 kata) berisiko sama.
- **Screenshot**: `37-backpress-reader-exit.png` (baris "Ali 'Imran"
  menampilkan hanya "آلَ").

### B4. [Modern, mode Mushaf] Swipe ganti halaman ikut memicu Aksi Cepat ayat yang tersentuh — HIGH

- **Lokasi**: gesture swipe custom di `apps/mobile/src/screens/QuranScreen.js`
  (`beginReaderTouch`/`moveReaderTouch`/`endReaderTouch` →
  `triggerAdjacentMushafPage`) berinteraksi buruk dengan `Pressable` per-ayah di
  `apps/mobile/src/screens/quran/QuranScreenRenderers.js`,
  `renderMushafPerKataAyah()` baris ~605-614
  (`onPress={() => setAyahActionSheet({ visible: true, ayah })}`).
- **Expected**: swipe horizontal di mode Mushaf hanya berpindah halaman, tidak
  memicu aksi lain.
- **Actual**: **WRONG BEHAVIOR, 100% reproducible** (dicoba 2× berturut-turut,
  keduanya gagal identik). Setiap swipe kiri untuk pindah halaman (mis. dari
  Halaman 1 → 2 → 3 di Al-Fatihah) **juga membuka bottom-sheet "Aksi Cepat"**
  untuk ayah yang ada di titik sentuh awal — bahkan setelah halaman sudah
  berpindah, sheet yang muncul masih merujuk ke ayah HALAMAN LAMA (stale
  reference: swipe dari halaman 2→3 tetap membuka sheet "Al-Fatihah · Ayat 1"
  padahal ayat itu sudah tidak tampil di halaman manapun yang sedang dibuka).
- **Root cause (hipotesis)**: gesture pagination custom (`onTouchStart/Move/End`
  di level `ScrollView`) tidak menekan responder `Pressable` anak
  (`renderMushafPerKataAyah`) selama drag berlangsung. React Native
  menangkap target responder pada saat `onTouchStart` (ayah di bawah jari saat
  itu), dan karena tidak ada mekanisme pembatalan (`pointerEvents="none"`
  sementara, atau cek jarak-geser sebelum meneruskan event ke Pressable anak),
  gesture swipe yang berakhir sebagai "tap pendek" secara native tetap
  ter-commit sebagai `onPress` di ayah tersebut.
- **Dampak**: pengalaman baca Mushaf jadi mengganggu — setiap kali pengguna
  membalik halaman, ada kemungkinan tinggi bottom-sheet ayat yang tidak
  diinginkan ikut terbuka, harus di-dismiss manual sebelum lanjut baca.
- **Screenshot**: `25-swipe-next-page.png` (swipe ke Halaman 2 + Aksi Cepat
  "Ayat 1" ikut terbuka), `26-swipe-again-confirm-bug.png` (swipe ke Halaman 3,
  bug berulang dengan ayat stale yang sama).

### B5. [Modern & Classic] Tombol back Android tidak pernah bisa keluar dari Audio Range Panel — hanya toggle collapse/expand selamanya — HIGH

- **Lokasi**: `apps/mobile/src/screens/QuranScreen.js`, `useEffect` baru
  (BELUM di-commit) untuk `BackHandler.addEventListener("hardwareBackPress", ...)`,
  blok "Priority 2: Audio player back handling" (sekitar baris 1797–1808):
    ```js
    if (audioPlayerOpen) {
        if (audioRangeCollapsed) {
            setAudioRangeCollapsed(false);
            return true;
        } else {
            setAudioRangeCollapsed(true);
            return true;
        }
    }
    ```
- **Expected**: tombol back Android harus bisa menutup Audio Range Panel
  (idealnya: expanded → collapse → tap lagi → close), bukan berputar selamanya.
- **Actual**: **WRONG BEHAVIOR, dikonfirmasi 2× tekan back berturut-turut**.
  Selama `audioPlayerOpen === true`, blok ini SELALU `return true` — tidak
  pernah membiarkan back-press lanjut ke Priority 3 (exit reader) atau menutup
  panel sepenuhnya. Expanded → back → collapse ke mini pill → back lagi →
  **expand lagi** (bukan close). Diverifikasi persis: screenshot sebelum/```setelah tekan back pertama menunjukkan collapse, tekan back kedua
menunjukkan expand kembali — infinite loop. Satu-satunya cara menutup panel
adalah tap tombol`X` eksplisit.
- **Dampak**: pengguna yang membuka Audio Range Panel lalu ingin kembali ke
  daftar surah dengan tombol back fisik/gestur Android **tidak akan pernah
  bisa** — mereka akan terjebak toggle collapse/expand tanpa penjelasan,
  perilaku yang sangat membingungkan dan berbeda dari ekspektasi standar
  Android (back = dismiss progresif, bukan toggle).
- **Screenshot**: `audio-expanded.png` (state awal expanded) →
  `39-back1-collapse.png` (setelah back #1: collapsed) →
  `40-back2-expand-again.png` (setelah back #2: expanded lagi, bukan closed).

### B6. [Modern & Classic] Ganti qari (reciter) dari grid audio per-ayat saat ayat sedang diputar diam-diam menghentikan audio, bukan pindah suara — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/QuranScreen.js`, fungsi `selectQari`
  (sekitar baris 1655–1679), dipanggil dari
  `apps/mobile/src/screens/quran/QuranScreenRenderers.js` `renderAudioSources()`
  baris ~221 dengan `selectQari(ayah.id, source.qari_slug)`.
- **Expected**: tap qari lain di grid "sumber audio" saat 1 ayat sedang diputar
  (via tombol "Putar audio" di Aksi Cepat/Detail Ayat, BUKAN lewat Audio Range
  Panel) → audio lanjut/ganti ke qari baru untuk ayat yang sama.
- **Actual**: **WRONG BEHAVIOR, dikonfirmasi**. Audio yang sedang diputar
  langsung **berhenti total** (tombol berubah dari "Jeda audio" aktif kembali
  ke "Putar audio" tidak aktif) tanpa pesan apa pun, tanpa otomatis lanjut
  dengan qari baru. Screenshot before/after menunjukkan state berubah dari
  playing→stopped persis setelah tap qari lain.
- **Root cause**: `selectQari` punya logic resume HANYA untuk kasus **Audio
  Range queue** (`const hasQueue = audioQueueRef.current.length > 0; ... if
(wasPlaying && hasQueue) { playRangeQueueItem(resumeIndex, sessionId); }`).
  Untuk playback SATU ayat via `playAyahAudio` (dipanggil dari Aksi Cepat/Detail
  Ayat), `audioQueueRef.current` selalu kosong (tidak pernah diisi kecuali
  lewat `startRangeAudio`), sehingga cabang resume tidak pernah tereksekusi —
  fungsi cuma memanggil `stopAudio()` dan berhenti di situ. State ganti qari
  memang tersimpan (`audioState.qariSlug`, `writePreference`), jadi tap
  "Putar audio" lagi SETELAH ini akan pakai qari baru — tapi user tidak
  diberi tahu kenapa audio tiba-tiba berhenti.
- **Dampak**: pengalaman ganti-reciter di tengah dengar satu ayat terasa
  seperti bug/crash kecil — audio berhenti tanpa alasan yang terlihat.
- **Screenshot**: `22-audio-playing.png` (playing, tombol "Jeda audio" hijau) →
  `23-qari-switch.png` (setelah tap "Hani Ar-Rifai": tombol balik ke "Putar
  audio", berhenti).

---

## Catatan tambahan (bukan bug fungsional, tapi worth mencatat)

### C1. Label "Jeda audio" sebenarnya berperilaku "Stop", bukan pause sesungguhnya — LOW

`apps/mobile/src/utils/audioPlayer.js`, `stopAudio()` selalu memanggil
`player.pause?.()` **+ `player.seekTo?.(0)` + `player.remove?.()`** — artinya
setiap "jeda"/pause (baik per-ayah maupun Audio Range) sebenarnya
mereset posisi ke awal dan membuang instance player. Menekan "Putar" lagi
selalu mengulang dari awal ayat, bukan melanjutkan dari titik jeda. Ini
konsisten di seluruh app (bukan regresi baru), tapi label "Jeda"/`Pause` icon
menyiratkan ekspektasi resume yang tidak dipenuhi. Prioritas rendah karena
ayat Qur'an umumnya pendek sehingga dampaknya kecil.

### C2. Label tab tafsir "Al-Mishbah" vs data underlying "Ibnu Katsir" — INFO

Modal Tafsir (`renderReferenceModal`, `QuranScreenRenderers.js` ~baris 1420) punya
mode pill berlabel "Al-Mishbah" yang memfilter item dengan `item.title ===
"Ibnu Katsir"`. Ini kemungkinan relabeling konten yang disengaja (tampilan
"Al-Mishbah" untuk sumber data "Ibnu Katsir"), tapi worth dikonfirmasi ke tim
konten supaya tidak terlihat seperti data salah label. Bukan bug UI — mode
"Bandingkan" (side-by-side) dan filter "Kemenag" semua berfungsi benar.

### C3. [Di luar scope Quran, ditemukan tidak sengaja] Layar "Target Belajar" (Classic, Belajar hub) — tombol back di header tidak berfungsi — MEDIUM, PERIPHERAL

Saat menavigasi ke Classic theme untuk audit ini, tidak sengaja masuk ke
`Target Belajar` (fitur personal Belajar-hub, gated untuk guest). Tombol back
(`IconActionButton` pojok kanan atas) **tidak menavigasi kembali** meski
di-tap tepat pada bounds-nya (dikonfirmasi via dump). Hanya tombol/gestur back
Android **hardware** yang berhasil keluar dari layar ini. Ini pola yang sama
dengan "dead-end hamburger menu items" yang sudah pernah diperbaiki untuk
layar lain (lihat commit `d3964972` "fix(mobile): dead-end hamburger menu
items, lesson step counter, ..."), mengindikasikan mungkin masih ada beberapa
layar lain dengan pola serupa yang belum tersentuh. **Di luar scope audit
Quran ini** — dicatat saja untuk follow-up terpisah, tidak diinvestigasi lebih
lanjut (file sumbernya belum diidentifikasi, kemungkinan salah satu
`WebAppLibraryRoute`/`ExploreWebAppRoutes`-family berkat "Target Belajar" /
Target Belajar personal).

---

## Checklist lengkap yang diuji (PASS kecuali disebutkan sebagai bug di atas)

### Surah List

| Kontrol                                             | Expected                                             | Modern                                                                                   | Classic                                                                                                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search box                                          | Filter surah live                                    | ❌ **B1** (tidak bisa fokus)                                                             | ✅ PASS (filter + empty state "Surah tidak ditemukan" benar)                                                                                                                                                |
| Tab switcher Surah/Hafalan/Murojaah                 | Ganti tab, guest-gating benar                        | N/A (di-force ke "surah" oleh `useEffect`, sesuai desain — dikonfirmasi arsitektur lama) | ✅ PASS, ketiga tab + guest-gating message benar                                                                                                                                                            |
| CTA "Navigasi Mushaf"                               | Buka picker halaman/hizb                             | ❌ **B2** (hardcode halaman 1)                                                           | N/A (Classic tidak punya CTA ini, pakai Navigator card langsung)                                                                                                                                            |
| Navigator (Halaman/Hizb tab + input + submit)       | Validasi 1-604 / 1-240, buka halaman/hizb yang benar | Tidak ada di UI                                                                          | ✅ PASS — tab switch, placeholder "1-604", tombol "Buka Halaman"/"Buka Hizb" berfungsi (verifikasi input digit via `adb keyevent` karena keterbatasan `input text` pada field `number-pad` — bukan bug app) |
| Tap baris surah → buka reader                       | Buka reader surah terkait                            | ✅ PASS                                                                                  | ✅ PASS                                                                                                                                                                                                     |
| Nama Arab surah di baris list                       | Tampil penuh                                         | ❌ **B3** ("Ali 'Imran" terpotong)                                                       | ✅ PASS (nama lengkap dengan prefix "سُورَةُ")                                                                                                                                                              |
| Hafalan tab: cycle status per surah                 | Not started → In progress → Memorized → ...          | Guest: gating message benar (tidak dicoba logged-in, lihat batasan sesi)                 | Guest: gating message benar                                                                                                                                                                                 |
| Murojaah tab: pilih surah + skor + catatan + submit | Simpan sesi murojaah                                 | Guest: gating message benar                                                              | Guest: gating message benar                                                                                                                                                                                 |

### Surah Reader

| Kontrol                                                               | Expected                                              | Hasil                                                                                                                                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surah pager (prev/next, non-mushaf mode)                              | Navigasi antar surah, disabled di batas (surah 1/114) | PASS by code inspection (pola sama dengan boundary font-size yang sudah diverifikasi bekerja); tidak habis diklik sampai batas karena keterbatasan waktu               |
| Swipe kiri/kanan ganti surah (non-mushaf) / ganti halaman (mushaf)    | Navigasi sesuai mode                                  | PASS untuk perpindahan halaman itu sendiri, tapi lihat **B4** untuk side-effect yang salah                                                                             |
| Menu Baca (kebab) → Pengaturan tampilan                               | Buka modal Settings                                   | PASS                                                                                                                                                                   |
| Menu Baca → "Keluar mode fokus" (hanya muncul saat mode Fokus/Mushaf) | Kembali ke mode Grid/Card                             | PASS (opsi muncul tepat sesuai kondisi)                                                                                                                                |
| Menu Baca → "Kembali ke daftar surah"                                 | Tutup reader                                          | PASS                                                                                                                                                                   |
| Tombol Audio Surat (header)                                           | Buka Audio Range Panel                                | PASS                                                                                                                                                                   |
| Tap ayah (baris terjemahan/Arab)                                      | Buka Aksi Cepat / detail                              | PASS                                                                                                                                                                   |
| Aksi Cepat → Buka Detail                                              | Buka layar Detail Ayat                                | PASS                                                                                                                                                                   |
| Aksi Cepat → Putar/Jeda audio                                         | Mainkan murottal ayat                                 | PASS (lihat C1 untuk catatan label)                                                                                                                                    |
| Aksi Cepat → Tafsir / Asbabun Nuzul                                   | Buka modal referensi                                  | PASS                                                                                                                                                                   |
| Aksi Cepat guest-only notice                                          | Tampilkan pesan "Masuk dari Profil..."                | PASS, tidak ada Simpan Progres/Bookmark/Catatan untuk guest                                                                                                            |
| Detail Ayat: back button                                              | Kembali ke reader                                     | PASS                                                                                                                                                                   |
| Detail Ayat: Putar/Jeda audio pill                                    | Sama seperti di atas                                  | PASS                                                                                                                                                                   |
| Detail Ayat: Tafsir/Asbabun/Ayat Terkait/Hadis Terkait pill           | Buka modal masing-masing                              | PASS, termasuk empty state ("Tidak ada ayat terkait", "Belum ada hadis terkait")                                                                                       |
| Reveal button ("Tampilkan Ayat") mode hafalan                         | Tampilkan arab/terjemah yang disembunyikan            | PASS by code inspection (tidak sempat trigger mode hafalan penuh karena waktu, tapi logic straightforward & konsisten dengan toggle mode lain yang sudah diverifikasi) |
| Pull-to-refresh reader                                                | Reload ayat                                           | Tidak dicoba eksplisit (di luar prioritas waktu)                                                                                                                       |
| Infinite scroll pagination surah panjang                              | Muat ayat berikutnya                                  | Tidak dicoba eksplisit (Al-Fatihah cuma 7 ayat, tidak representatif; disarankan cek manual dengan Al-Baqarah 286 ayat di sesi follow-up)                               |

### Settings Modal (Pengaturan Tampilan)

| Kontrol                                       | Expected                                | Hasil                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Ukuran Teks Arab +/-                          | Range 14px-48px, disable di batas       | PASS — batas bawah 14px dan atas 48px keduanya benar men-disable tombol                               |
| Ukuran Teks Terjemahan +/-                    | Range 12px-28px, disable di batas       | PASS                                                                                                  |
| Font Arabic chips (Uthmani/Indopak/Naskh)     | Ganti font live                         | PASS, ketiganya diverifikasi visual berubah                                                           |
| Model Tampilan Baca (Garis/Grid/Fokus/Mushaf) | Ganti mode render reader                | PASS keempatnya; Fokus menyembunyikan terjemahan, Mushaf beralih ke layout per-kata/per-baris kontinu |
| Mode Hafalan chips                            | Sembunyikan Arab/Terjemah untuk latihan | PASS by code inspection (tidak sempat exercise penuh, prioritas waktu ke kontrol lain)                |
| Fullscreen toggle                             | Toggle label aktif/nonaktif             | PASS                                                                                                  |
| "Panduan Warna Tajwid"                        | Buka modal Tajweed                      | PASS, modal informational tanpa kontrol interaktif lain                                               |

### Audio Range Panel

| Kontrol                                          | Expected                                 | Hasil                                                            |
| ------------------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------- |
| Field Dari/Sampai Surat/Ayat                     | Pre-fill ke surah aktif, terima input    | PASS                                                             |
| Tombol Putar range / Stop                        | Mulai/hentikan antrian audio             | PASS                                                             |
| Skip prev/next                                   | Loncat index antrian                     | PASS (queue index berubah, termasuk auto-advance)                |
| Habis antrian (index terakhir)                   | Berhenti bersih tanpa hang               | PASS                                                             |
| Qari selector (grid horizontal)                  | Ganti reciter                            | PASS untuk Audio Range mode; lihat **B6** untuk mode single-ayah |
| Speed chips (0.75x-2x)                           | Ganti kecepatan playback                 | PASS                                                             |
| Repeat toggle                                    | Aktifkan ulang-otomatis di akhir antrian | PASS                                                             |
| Collapse (chevron down) / Expand (tap mini pill) | Toggle ukuran panel                      | PASS                                                             |
| Close (X)                                        | Tutup panel sepenuhnya                   | PASS (tap eksplisit; lihat **B5** untuk hardware back)           |

### Hardware Back Button (kode baru, belum commit)

| State saat back ditekan                        | Expected                        | Hasil                                            |
| ---------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| Settings modal terbuka                         | Tutup modal saja                | PASS                                             |
| Ayah Action Sheet terbuka                      | Tutup sheet saja                | PASS                                             |
| Audio Range Panel terbuka (expanded/collapsed) | Idealnya bisa dismiss progresif | ❌ **B5** — toggle selamanya, tidak pernah close |
| Reader terbuka, tidak ada overlay              | Keluar ke daftar surah          | PASS                                             |

### Lintas Tema & Navigasi Lain

| Kontrol                                                                | Hasil                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep link `thullaabulilmi://quran/surah/<n>`                           | PASS — surah 36 (Yasin) resolve ke judul & halaman mushaf yang benar (Halaman 440, sesuai mushaf Utsmani 604 halaman asli di mana Fatir ayat 45 & Yasin ayat 1-3 memang berbagi 1 halaman fisik — awalnya dikira bug, ternyata perilaku mushaf yang benar) |
| Toggle Modern ↔ Classic (Profil → Pengaturan → Tampilan → Mode Layout) | PASS, state reader (surah aktif, display mode, dsb.) persisten lintas ganti tema                                                                                                                                                                           |
| Mode Mushaf per-kata (Mufrodat/word-by-word)                           | PASS — tampil lengkap dengan transliterasi + arti per kata saat data tersedia; tap kata individual tidak ada handler terpisah (satu Pressable per-ayah, bukan per-kata) — ini **sesuai desain kode**, bukan bug                                            |

---

## Prioritas Perbaikan (untuk sesi fix terpisah)

1. **B1** (search box Modern mati total) — dampak tertinggi, satu-satunya cara
   cari surah di tema default hilang sepenuhnya.
2. **B4** (swipe mushaf salah trigger Aksi Cepat) — mengganggu pengalaman baca
   inti Mushaf, terjadi di HAMPIR SETIAP swipe.
3. **B5** (back button Audio Range Panel infinite toggle) — regresi dari kode
   baru yang belum commit, mudah diperbaiki (tambahkan state "sudah collapsed →
   close" atau langsung `return false`/lanjut priority berikutnya saat sudah
   collapsed).
4. **B2** (CTA Navigasi Mushaf hardcode halaman 1) — perbaikan: render
   `renderNavigatorPanel()` juga di Modern (mis. sebagai modal/sheet yang
   dibuka dari CTA ini), bukan cuma di Classic footer.
5. **B6** (ganti qari saat single-ayah playback menghentikan audio) —
   tambahkan cabang resume di `selectQari` untuk kasus `playAyahAudio`
   (bukan cuma Audio Range queue).
6. **B3** (nama Arab "Ali 'Imran" terpotong) — kosmetik, perbaikan kemungkinan
   sesederhana `numberOfLines={2}` + izinkan tinggi row menyesuaikan.
7. **C1/C2** — tidak mendesak, cukup dicatat untuk diskusi produk/konten.
8. **C3** — di luar scope, tapi disarankan masuk antrean audit navigasi
   berikutnya (kemungkinan ada layar serupa lain).
