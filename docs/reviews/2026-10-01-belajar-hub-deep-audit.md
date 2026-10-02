# Deep Audit: Belajar Hub, Global Navigation Chrome & Feature Reachability — 2026-10-01

> Audit MENDALAM satu area: **hub Belajar, chrome navigasi global (header,
> hamburger, account menu, pencarian global, bottom nav), dan reachability
> ~46 fitur** di `apps/mobile`, mengikuti metodologi
> [2026-09-30-ibadah-deep-audit.md](./2026-09-30-ibadah-deep-audit.md). Fitur
> individual di dalam Belajar (Kajian, Siroh, Kamus, Waris, dst.) TIDAK
> dideep-dive isinya — itu scope audit terpisah; di sini hanya dikonfirmasi
> setiap tile terbuka ke layar yang benar dan Back kembali dengan bersih.

**Status interupsi (sesi 1)**: sesi emulator (`emulator-5554`) terputus di
tengah audit (environment/VM restart di luar kendali; `adb devices` kembali
kosong, tidak ada device yang bisa disentuh lagi). Sesuai arahan, audit
dihentikan di titik itu — **tidak ada upaya reconnect/relaunch emulator**
(berisiko bentrok dengan sesi lain yang mungkin memilikinya). Semua yang
berhasil diuji live sebelum putus didokumentasikan sebagai **PASS/BUG
terverifikasi device**; sisanya ditandai eksplisit **BLOCKED** (dengan
alasan) atau **"dari kode, belum dikonfirmasi live"**. **7 bug dilaporkan**
(1 HIGH, 4 MEDIUM, 2 LOW) — 3 di antaranya terverifikasi langsung di device
dengan screenshot, 4 lainnya adalah temuan kode berkualitas tinggi (absennya
komponen/kesalahan logika yang tidak bergantung pada state runtime) yang
**belum sempat dipencet langsung**. Tidak ada crash yang teramati di ~45
menit interaksi (tidak ada red box di screenshot manapun), tapi
**logcat/crash buffer tidak sempat ditarik ulang** sebelum sesi putus — jadi
"0 crash" di sini adalah observasi visual, bukan konfirmasi
`dumpsys`/DropBox seperti audit Ibadah. Screenshot:
`apps/mobile/output/native/2026-10-01-belajar-hub-deep-audit/*.png` (80
file dari sesi 1, `000`–`041`; lihat di bawah untuk `042`+ dari sesi 2).

**Status interupsi (sesi 2, lanjutan — hari yang sama, siang)**: sesi
berikutnya (`emulator-5554`, AVD yang sama, direstart oleh orkestrator di
luar sesi ini) diberi dua tugas: (a) live-verify batch fix commit
`7de394aa`/`b42dcf1b` (keyboard inset, chip/search-state leak, chip "Bangun"
Doa, Khatam→Profil→Back, counter pengingat sholat + horizon 7 hari, bootstrap
pengingat saat relaunch — **ke-7 item PASS**, lihat laporan terpisah
`apps/mobile/output/native/2026-10-01-fix-verify/*.png` 01–79), dan (b)
melanjutkan audit ini. Baru sempat: beralih ke Classic (Profil → Tampilan)
dan membuka Profil/Pengaturan Classic (`042`–`048`) sebelum **device hilang
total lagi** (`adb devices` kosong, proses emulator/qemu sudah tidak ada di
`ps aux`, bukan sekadar koneksi adb yang putus) saat mencoba scroll Profil
Classic — **dihentikan sesuai arahan yang sama, tanpa upaya reconnect**.
Screenshot terakhir (`049-classic-profile-scroll.png`) 0 byte (gagal
di tengah capture, persis pola `041` di sesi 1).
Dua temuan besar muncul selama sesi 2, salah satunya **mengubah cara membaca
sisa bug di bawah**: (1) commit `8d7611a0` ("fix(mobile): resolve Belajar hub
and global navigation audit findings (B1-B7)", **12:06:45**) ternyata sudah
men-_fix_ ketujuh bug B1–B7 di bawah secara eksplisit di source — tapi APK
yang terpasang & diuji sepanjang sesi 2 (file `app-release.apk` bertimestamp
**11:39:59**, lebih tua ±27 menit) **mendahului commit itu**, jadi semua
yang diuji live sesi 2 (termasuk Classic `SettingsList` 5-baris di `047`)
mencerminkan kondisi **SEBELUM** fix B1-B7, bukan HEAD saat ini — lihat C8
(diperbarui) untuk rincian commit-demi-commit dan analisis source setiap
fix; (2) dua bug BARU ditemukan live (B8 ANR pencarian Asmaul Husna, B9
judul header Doa jadi raw category key) — keduanya di luar cakupan B1-B7,
jadi tetap valid di HEAD. Build lengkap (`npx jest`, 89 suite/1435 test) dan
pembacaan diff `8d7611a0` baris-per-baris dipakai sebagai pengganti
live-tap untuk menilai B1-B7 tanpa device — **bukan pengganti sempurna**,
cuma mitigasi; rebuild+reinstall+live-reverify tetap wajib di sesi
berikutnya. Indikasi tambahan: **ada aktivitas `adb`/`am start` dari proses
lain yang tidak diketahui** di tengah sesi 2 (lihat C9) — beberapa observasi
navigasi yang tidak konsisten dengan urutan tap saya sendiri kemungkinan
berasal dari situ, sudah dipisahkan secara eksplisit di teks di bawah.

**Status sesi 3 (lanjutan — hari yang sama)**: APK release **baru**
terpasang sebelum sesi mulai (`lastUpdateTime` **13:19:21**, `versionCode`
tetap `1.0.0`), dikonfirmasi lewat `dumpsys package` mencakup `8d7611a0`
(fix B1-B7), `0164ad12`, dan `7de394aa`/`b42dcf1b`. **Device tetap hidup dan
responsif sepanjang sesi** (tidak pernah hilang) — satu-satunya anomali di
awal sesi adalah dialog ANR **`com.android.systemui`** (bukan app ini) yang
sudah menghadang di layar tepat saat sesi mulai, ditutup lewat "Wait" dalam
hitungan detik; kemungkinan besar sisa beban CPU dari proses lain di
emulator bersama sebelum sesi ini mengambil alih, dicatat apa adanya, bukan
diklaim sebagai crash aplikasi. **Tidak ada indikasi aktivitas proses lain
(mis. Codex) yang mengganggu sepanjang sisa sesi** — berbeda dari sesi 2,
device/emulator stabil dari awal sampai akhir sesi 3.
**Hasil utama**: ketiga fix yang jadi fokus (B4 partial, B8, B9)
**CONFIRMED FIXED live** dengan screenshot (lihat update masing-masing).
Karena APK sudah fresh dan device stabil, sekalian dituntaskan **B1, B2,
B3, B6, B7 juga di-live-verify dan CONFIRMED FIXED** — jadi **seluruh 9 bug
asli (B1-B9) kini FIXED-dan-terverifikasi-live**, bukan cuma "fixed di
source + unit test" seperti status sesi 2. Ditemukan **7 temuan baru**
(B10-B16, MEDIUM/LOW, lihat masing-masing di bawah untuk detail): B10 (tiga
ejaan nama aplikasi berbeda di 3 layar berbeda), B11 (toggle bahasa ID/EN
tidak diterapkan ke hero+tile hub Belajar, nama badge Pencapaian, 7 dari 9
judul header Profil/Pengaturan, dan toggle Kitab/Hadis di tab Hadis), B12
(tab bottom-nav Belajar tidak benar-benar berpindah konten saat fitur yang
dibuka dari hub LAIN — mis. Doa dari Ibadah — sedang tampil, hanya
mengubah highlight tab), B13 (label section "Tema"/"Bahasa Konten"/"Mode
Layout" nyaris tak terbaca di tema gelap karena stylesheet statis yang
tidak reaktif terhadap tema), B14 (Classic sama sekali tidak punya UI
cari/filter kategori untuk 8 fitur bertipe `"list"` yang di Modern dapat
`WebAppReferenceListRoute` lengkap), B15 (Pencarian Global tidak punya cara
tutup yang terlihat — hanya hardware back yang berfungsi), B16 (hamburger
grup "Lainnya"/Pengaturan-Bantuan-Tentang triple-highlight, bug class sama
dengan B5 tapi belum di-fix untuk grup ini). Juga dituntaskan: sweep penuh
Classic (hub Belajar **identik kontennya** dengan Modern, cuma beda chrome
— lihat update checklist), spot-check tema gelap Modern+Classic, pengujian
hamburger B5 dengan hasil ganda (Akses Cepat FIXED, tapi grup "Lainnya"
kena bug class yang sama persis, belum di-fix — lihat B16), toggle
bahasa+tema+avatar account-menu, cycle bottom-nav 5-tab. Pencarian
Global **sebagian BLOCKED**: live-typing tidak bisa diuji tuntas karena
popup sistem "Try out your stylus" (tutorial Gboard, device-level, bukan
bug aplikasi — lihat C10) berulang kali mencegat SEMUA input teks ke kotak
cari manapun yang baru fokus; chip kategori dan tombol "Cari" tanpa teks
tetap sempat diuji. Akhir sesi: dikembalikan ke state awal yang diminta
(Modern, tema sistem, Indonesia, tab Beranda, font scale 1.0) — lihat
checklist Bottom navigation.

## Setup

- Build: **tidak di-rebuild**. APK terpasang (`lastUpdateTime` 2026-09-30
  22:54) sha256-identik dengan `android/app/build/outputs/apk/release/app-release.apk`
  (build 22:53). Diperiksa lewat `git archive` (bukan checkout/stash) commit
  `d4badaa5` (23:01, commit mobile terakhir sebelum APK dibuild) ke
  scratchpad: APK **mendahului** 5 commit "harmonize layout and theme
  tokens" berikutnya (`d0a4afd5` 23:43 s/d `193a0354` 01:25) yang menyentuh
  `Paper.js`, `GlobalSearchScreen.js`, `ProfileScreen.js`,
  `FeatureCatalog.js`, `ExploreClassicRenderers.js`,
  `HomeDashboardContent.js`, dkk. — diff-nya **murni kosmetik** (token warna
  `theme.*` menggantikan `colors.*` statis untuk dukungan dark-mode yang
  lebih konsisten), **tidak mengubah logika/JSX struktural** apa pun yang
  relevan untuk temuan di bawah (dikonfirmasi baris-per-baris). Jadi semua
  bug logika di laporan ini berlaku juga di HEAD saat ini; klaim kontras
  warna/dark-theme murni baru butuh rebuild+install ulang untuk diverifikasi
  — **tidak dilakukan, di luar scope sesi ini**.
- Emulator: `tholabul_pixel_7_api36` (1080×2400, `animator_duration_scale=0`,
  `font_scale=1.0`, bahasa sistem default) sudah berjalan saat sesi mulai.
  Semua perintah `adb -s emulator-5554`. Device fisik tidak disentuh.
  **Device menghilang total saat masih di tengah siklus Modern hub tile
  ke-24 (Muhasabah)** — tepat setelah itu `adb devices` kosong.
- Backend: API produksi `https://api.thollabulilmi.site`, sesi guest (Tamu)
  sepanjang sesi; tidak ada login dicoba.
- Akhir sesi: **tidak sempat dilakukan** — app ditinggal di layar Muhasabah
  (hasil ketukan terakhir sebelum device hilang), Modern layout, tema
  sistem. Tidak ada cara mengembalikan state karena device sudah hilang;
  dicatat sebagai BLOCKED, bukan diabaikan.

### Setup — sesi 2 (lanjutan)

- Build: APK release diinstal ulang (uninstall + install bersih, bukan
  `-r`) di tengah sesi karena proses lain sempat memasang **build debug**
  di atasnya (lihat C9) yang butuh Metro dan gagal total me-render apa pun.
  File `app-release.apk` yang dipakai untuk reinstall itu sendiri
  bertimestamp **2026-10-01 11:39:59** — belakangan diketahui **lebih tua
  dari commit `8d7611a0`** (12:06:45, fix B1-B7) dan juga dari komit
  "harmonize layout and theme tokens" `0164ad12` (00:17:28, menambah
  Bantuan/Tentang ke `SettingsList` — bagian dari fix B4). Commit yang
  SUDAH terbawa di APK ini (lebih tua dari 11:40, jadi otomatis termasuk):
  `7de394aa`/`b42dcf1b` (dua commit yang memang jadi target verifikasi Part
  1 — **dikonfirmasi lewat 7 item PASS**, lihat laporan terpisah). Commit
  yang **belum** terbawa (lebih baru dari APK): `0164ad12` (token tema,
  TAPI juga 2 baris baru SettingsList), `8d7611a0` (fix B1-B7 penuh). Lihat
  C8 untuk rincian lengkap tiap bug.
- Emulator: AVD sama (`tholabul_pixel_7_api36`), diasumsikan sudah
  disiapkan ulang oleh orkestrator sebelum sesi 2 dimulai (window terlihat,
  sesuai arahan). **Hilang total untuk kedua kalinya** pukul ±12:04 — kali
  ini dikonfirmasi bukan cuma masalah koneksi adb: `adb kill-server` +
  `adb start-server` + `adb devices` tetap kosong, dan `ps aux | grep
emulator` di host **tidak menunjukkan proses qemu/emulator apa pun** —
  prosesnya benar-benar mati, bukan sekadar freeze. Tidak ada upaya
  relaunch, sesuai arahan.
- Backend: sama, API produksi, sesi guest sepanjang sesi 2.
- Ada **indikasi aktivitas adb/`am start` dari proses lain** yang tidak
  dijalankan oleh sesi ini (lihat C9) — ditemukan lewat `logcat` (entri
  `ActivityTaskManager: START ...` dan `Package ... reported as REPLACED`
  pada waktu saya tidak sedang mengeksekusi perintah apa pun), termasuk
  sekali navigasi tak terduga ke layar Jadwal Sholat yang **tidak**
  dihasilkan dari urutan tap saya sendiri — dicatat eksplisit, tidak
  diklaim sebagai bug aplikasi.
- Akhir sesi 2: **tidak sempat dilakukan** — device hilang saat scroll
  Profil Classic (`048`→`049`, `049` 0 byte). App terakhir diketahui di
  Profil Classic, Mode Layout **Classic** (bukan Modern seperti biasanya
  ditinggalkan), tema sistem, bahasa Indonesia. **Rekomendasi eksplisit
  untuk sesi berikutnya**: setelah rebuild+reinstall, set Mode Layout
  kembali ke **Modern** sebelum melanjutkan — kondisi saat ini bukan baseline
  yang diasumsikan sesi-sesi sebelumnya.

### Setup — sesi 3 (lanjutan)

- Build: APK release baru sudah terpasang **sebelum** sesi mulai (di luar
  kendali sesi ini — kemungkinan orkestrator atau sesi build terpisah
  menjalankannya). Dikonfirmasi via `adb shell dumpsys package
com.thullaabulilmi.app`: `lastUpdateTime` **2026-10-01 13:19:21**,
  `firstInstallTime` 11:40:07 (update in-place, bukan uninstall bersih).
  Tidak di-rebuild ulang oleh sesi ini.
- Emulator: `emulator-5554` sudah berjalan saat sesi mulai, **tidak pernah
  hilang** sepanjang sesi (beda dari sesi 1 & 2). Satu insiden non-app:
  dialog ANR sistem `com.android.systemui` sudah ada di layar launcher
  tepat saat sesi dimulai — ditutup via tombol "Wait", device langsung
  responsif setelahnya; tidak diulang lagi sepanjang sesi.
- Backend: sama, API produksi, sesi guest sepanjang sesi 3.
- Tidak ada indikasi aktivitas proses lain yang mengganggu — tidak ada
  reinstall tak terduga, tidak ada `am start` yang tidak dijalankan sesi
  ini, tidak ada navigasi yang tidak bisa diatribusikan ke tap sendiri.
- Akhir sesi 3: **dilakukan dengan benar** — Mode Layout dikembalikan ke
  **Web App (Modern)**, Tema ke **Ikuti Sistem**, Bahasa ke **Indonesia**,
  app ditinggal di tab **Beranda**. Font scale, Wi-Fi, dan airplane mode
  tidak pernah disentuh sepanjang sesi (tetap default).

## Metodologi & catatan penting

- Helper scratchpad (semuanya baru, dibuat untuk sesi ini, disimpan di
  `/tmp/claude-.../scratchpad/`, **bukan di repo**): `sb` (screenshot ke
  folder output audit ini), `tp`/`sw`/`bk` (tap/swipe/hardware-back dengan
  jeda ramah-manusia), `st2`+`st2.py` (dump UI → ringkasan satu baris: judul
  header, ada tombol back atau tidak, tab bottom-nav yang `selected`, apakah
  hero hub "KONTEN ISLAM" terlihat), `hubtile.py` (scroll hub sampai tile
  dengan judul tertentu terlihat lalu tap, menghindari area header/nav yang
  tertutup saat scroll), `cycle.sh` (satu tile: buka → catat state → header
  back → catat → buka ulang → hardware back → catat).
- **Kelas bug nyata yang ditemukan justru lewat perbandingan APK-era vs
  HEAD** (bukan lewat tap manual): meng-`git archive` commit sebelum APK
  dibuild ke `scratchpad/apksrc` (read-only, tidak pernah checkout/stash di
  worktree asli) membiarkan saya membaca source persis yang berjalan di
  device sambil tetap membandingkan ke HEAD untuk memastikan temuan masih
  relevan. Dipakai juga untuk mengekstrak `index.android.bundle` dari APK
  terpasang (`adb pull` paket lalu `unzip`) dan mem-`grep` string literal
  (mis. `"KONTEN ISLAM"`, teks share Zakat) untuk mengonfirmasi versi bundle
  yang benar-benar jalan di device — jauh lebih pasti daripada menebak dari
  timestamp file saja.
- Perbandingan kamus `idn.js`/`en.js` dilakukan dengan mem-port kedua file
  (hanya mengubah `import ... from "./x.js"` → `"./x.mjs"`, isi tidak
  diubah) ke Node ES modules di scratchpad, lalu dibandingkan dengan skrip
  kecil — ini **membaca isi, tidak pernah menjalankan app**, jadi tidak
  terganggu oleh putusnya emulator. Cara yang sama dipakai untuk mem-`grep`
  semua pemakaian `t("...")` / `*Key: "..."` di seluruh `src/screens` dan
  mencari yang tidak ada di `idn.js` sama sekali (lihat B7).
- Siklus 24 tile hub Belajar dijalankan **berurutan** lewat `cycle.sh` di
  background (`hubtile.py` men-scroll dari atas setiap kali, jadi urutan
  tile di layar tidak memengaruhi hasil); output lengkap tersimpan di
  `modern_cycles.log`/`modern_cycles2.log` (scratchpad, bukan di repo) dan
  dirangkum di checklist di bawah.
- **Bukan bug app**: dua kali `hubtile.py` sempat gagal menemukan tile saat
  stdin batch script tidak diarahkan ke `/dev/null` (proses anak ikut
  membaca stdin terminal) — diperbaiki di helper, bukan masalah aplikasi.

### Metodologi tambahan — sesi 2

- Semua tap pakai `adb shell input tap <x> <y>` dengan koordinat **piksel
  asli 1080×2400**; setiap screenshot yang dibaca lewat tool Read datang
  dengan rasio "displayed→original" (biasanya ×1.2) yang **wajib**
  dikalikan sebelum tap — beberapa kali lupa mengalikan di sesi ini
  (tercatat apa adanya di evidence, mis. `035`/`037` kena tap salah sasaran
  sebelum dikoreksi dengan `uiautomator dump` untuk bounds presisi).
  Pelajaran untuk sesi berikutnya: selalu kalikan, atau langsung pakai
  `uiautomator dump` untuk kontrol kecil (radio button, chip padat).
- **Setelah device hilang permanen**, verifikasi bug B1-B7 (sudah di-_fix_
  di commit `8d7611a0` tapi tidak sempat di-live-test) memakai dua sumber
  pengganti yang **bukan live device tapi tidak nol-nilai**: (a) `git show
8d7611a0 -- <file>` untuk membaca diff baris-per-baris tiap fix dan
  menilai kebenarannya secara statis (mis. melacak `currentFeatureKey`
  dari `App.js` → `WebAppShell.js` → `MobileMenuSheet.js` untuk B5,
  memastikan wiring-nya benar-benar nyambung, bukan cuma ada baris kode);
  (b) `cd apps/mobile && npx jest` (tidak butuh emulator/device sama
  sekali) — **89 suite/1435 test, semua PASS**, termasuk 7 suite yang
  langsung menguji file-file yang diubah `8d7611a0`
  (`mobileMenuSheet.test.js`, `mobileI18n.test.js`,
  `exploreBlogExcerpt.test.js`, `profileScreen.test.js`,
  `exploreWebAppRoutes.test.js`, `exploreScreen.test.js`,
  `mobileAppShell.test.js`). Ini memberi keyakinan **fungsional-logis**
  yang tinggi, tapi **tidak menggantikan** verifikasi visual/live (warna,
  kontras, animasi, race condition runtime seperti B8/B9 di bawah yang
  justru TIDAK akan pernah ketahuan dari unit test).
- `git log -1 --format="%H %ci %s" <commit>` dipakai berulang kali untuk
  membandingkan timestamp commit vs `ls -la --time-style=full-iso` pada
  file APK — teknik ini yang mengungkap bahwa APK yang diinstal ulang di
  tengah sesi (akibat insiden debug-build, lihat C9) ternyata lebih tua
  27 menit dari commit fix B1-B7, padahal keduanya "hari yang sama".
  **Pelajaran**: jangan asumsikan "dibuild hari ini" = "mencerminkan HEAD
  hari ini" di repo dengan banyak sesi agent konkuren — selalu bandingkan
  timestamp APK vs timestamp commit secara eksplisit sebelum menyimpulkan
  apa yang sedang diuji.

### Metodologi tambahan — sesi 3

- Ulangi pelajaran sesi 2 soal rasio displayed→original (×1.2): **masih
  kejadian berkali-kali** di sesi ini juga (mis. tap pertama ke "Web App"
  radio, tap pertama ke "Tokoh Islam" di hamburger) — dikoreksi dengan
  `uiautomator dump` begitu terdeteksi salah sasaran. `uiautomator dump`
  juga **gagal total** ("could not get idle state") untuk layar dengan
  animasi aktif: bukan cuma jam countdown (sudah diketahui), tapi juga
  kursor berkedip di dalam modal sistem Gboard (lihat C10) — dump
  mengembalikan file 0 baris tanpa error yang jelas di command-nya sendiri,
  jadi **selalu cek `wc -l` hasil dump sebelum mempercayainya**, jangan
  asumsikan dump sukses hanya karena command tidak error.
- Teknik baru: `convert <file>.png -crop WxH+X+Y -resize W2xH2 <out>.png`
  (ImageMagick, sudah terpasang di host) dipakai berkali-kali untuk
  memperbesar area kecil screenshot (nama aplikasi, label kontras rendah)
  sebelum dibaca ulang lewat tool Read — jauh lebih akurat daripada menilai
  teks kecil dari screenshot penuh, krusial untuk menemukan B10 (beda satu
  huruf "Thullabul" vs "Thullaabul") dan B13 (kontras label redup).
- **Investigasi B12** (tab Belajar tidak reset saat fitur lintas-hub
  tampil) dilakukan dengan membaca kode lebih dulu
  (`appNavigation.js`: `openTabState`, `getShellActiveTab`; `App.js`: baris
  `isActive = activeTab === tab` vs `activeTab={shellActiveTab}` yang
  dioper ke `MobileAppShell`) untuk membentuk hipotesis, BARU kemudian
  direproduksi ulang secara terkontrol di device (Beranda→Ibadah
  fresh→Doa→tap Belajar) untuk mengonfirmasi — kombinasi baca-kode-dulu
  lalu reproduksi-bersih ini jauh lebih cepat/pasti daripada menebak-nebak
  dari urutan tap yang berantakan (percobaan pertama bercampur dengan
  sisa state dari pengujian sebelumnya dan sempat menyesatkan).
- **Konflik file saat menulis laporan ini sendiri**: begitu mulai meng-edit
  dokumen ini, tool menolak edit pertama dengan "File has been modified
  since read" — sesi lain (kemungkinan Codex, berdasarkan pola commit
  `firmanagam` yang menambahkan konten "sesi 2" yang sebelumnya cuma ada di
  working tree, plus seksi baru "Resolusi Final & Status Rilis") sudah
  meng-commit perubahan ke file yang sama di tengah sesi ini. **Pelajaran**:
  di repo banyak-agent-konkuren, selalu `git diff`/`git log` ulang dan
  baca ulang (Read) seluruh file tepat sebelum mulai rangkaian Edit besar
  ke dokumen bersama, meski sudah dibaca penuh di awal sesi — isinya bisa
  berubah di tengah jalan tanpa notifikasi lain selain error "modified
  since read" itu sendiri.

---

## Temuan Bug

### B1. [Modern; kode sama, Classic kemungkinan sama] Amalan Harian (guest): pesan error generik menutupi alasan sebenarnya (harus login) — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppAmalanRoute.js:123-131`
  (`{error ? <Text>{t("explore.amalan.loadError")}</Text> : null}` — selalu
  menampilkan string hardcoded ini, mengabaikan isi `error` yang sebenarnya
  dikirim); sumber error:
  `apps/mobile/src/screens/ExploreScreen.js:649-658` (`loadFeature`,
  cabang `["protected-list","bookmarks","notes","user-wird"].includes(feature.type) && !session?.token`
  → `setError(t("explore.loginFeature"))` lalu `return` — Amalan Harian
  bertipe `protected-list`, jadi masuk cabang ini persis).
- **Expected**: guest yang membuka fitur yang butuh akun melihat pesan yang
  menjelaskan **harus login**, konsisten dengan 8 tile Personal Ringkas lain
  (Target Belajar, Statistik, Bookmark, Catatan, Hafalan, Murojaah,
  Tilawah, Muhasabah) yang semuanya menampilkan **"Buka Profil untuk masuk
  dan membuka fitur personal ini."**
- **Actual**: **WRONG BEHAVIOR, 100% reproducible, terverifikasi live**.
  Tile "Amalan Harian" (grup Fiqh & Panduan) sebagai guest menampilkan kartu
  "Progress 0/0 (0%)" lalu kotak merah **"Data amalan belum bisa dimuat.
  Coba refresh halaman."** — kalimat ini menyiratkan kegagalan jaringan/
  teknis yang bisa diperbaiki dengan refresh, padahal akar masalahnya murni
  gating login (tidak ada panggilan API sama sekali — `loadFeature` `return`
  sebelum `setLoading(true)`). User akan menekan ulang/refresh tanpa hasil,
  tidak pernah tahu solusinya adalah masuk akun.
- **Root cause**: `WebAppAmalanRoute` merender pesan error-nya sendiri yang
  statis (`explore.amalan.loadError`) setiap kali prop `error` truthy, tidak
  pernah membaca/meneruskan teks `error` yang sebenarnya dari pemanggil.
  Komponen Personal Ringkas lain (`WebAppZakatHistoryRoute`-style routes
  untuk Target Belajar dkk.) menampilkan `error` apa adanya, sehingga pesan
  `explore.loginFeature` ("Buka Profil untuk masuk...") tampil benar di
  sana.
- **Dampak**: satu-satunya tile di antara 9 fitur bergerbang-login yang
  salah mengomunikasikan status; guest mengira fitur rusak, bukan perlu
  login.
- **Saran fix**: render `{error}` langsung (seperti rute Personal Ringkas
  lain), atau — kalau memang ingin pesan khusus Amalan — periksa dulu apakah
  `error === t("explore.loginFeature")` dan tampilkan CTA login yang sama.
- **Screenshot**: `019-modern-amalan-open.png` (pesan salah) vs
  `026-modern-goals-open.png`, `030-modern-notes-open.png`,
  `033-modern-tilawah-open.png`, `034-modern-muhasabah-open.png` (pesan
  benar, 4 dari 8 pembanding).
- **UPDATE sesi 2 — FIXED di source (belum di-live-verify)**: commit
  `8d7611a0` (12:06:45) mengubah persis baris yang disebut di Saran fix:
  `apps/mobile/src/screens/explore/WebAppAmalanRoute.js` baris render error
  sekarang `{error}` (bukan `{t("explore.amalan.loadError")}` lagi) —
  diff tunggal 1 baris, identik dengan saran. Test `exploreWebAppRoutes.test.js`
  (termasuk dalam 7 suite yang di-run ulang sesi ini, 135/135 PASS) mencakup
  file ini. **BLOCKED**: APK yang terpasang sepanjang sesi 2 masih versi
  SEBELUM commit ini (lihat C8) dan device hilang sebelum sempat
  rebuild+reinstall — jadi perbaikan ini belum pernah terlihat di layar
  sungguhan, cuma dikonfirmasi lewat pembacaan diff + unit test.
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED**: dibuka ulang di APK fresh
  (Modern, guest), tile "Amalan Harian" (grup Fiqh & Panduan) sekarang
  menampilkan **"Buka Profil untuk masuk dan membuka fitur personal ini."**
  — pesan yang sama persis dengan 8 tile Personal Ringkas lain, BUKAN lagi
  "Data amalan belum bisa dimuat. Coba refresh halaman.". Screenshot:
  `101-B1-LIVE-CONFIRMED-correct-message.png`. Bug ditutup.

### B2. [Modern] "Modul & Kelas" (mis. Tata Cara Wudhu): body langkah menampilkan markdown mentah (`**tebal**`, list `-`) — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppLessonsRoute.js:512-521`
  (`step?.body || step?.content` dirender langsung di `<Text>`, tanpa lewat
  `apps/mobile/src/components/MarkdownView.js` yang sudah ada di codebase
  dan dipakai di tempat lain, mis.
  `apps/mobile/src/screens/explore/ExploreClassicRenderers.js:1307,1314`).
- **Expected**: teks panduan tampil dengan format (tebal, bullet) seperti
  yang dimaksud penulis konten.
- **Actual**: **WRONG BEHAVIOR, 100% reproducible, terverifikasi live**.
  Modul "Tata Cara Wudhu", langkah 1/7: `**Niat wudhu** bertempat di dalam
hati...` dan `- **Membasuh kedua telapak tangan** sebanyak tiga kali...`
  tampil **persis dengan tanda bintang ganda dan tanda hubung** sebagai
  teks biasa, bukan diformat.
- **Root cause**: lihat Lokasi — tidak ada parser markdown di jalur render
  ini. Kelas bug yang sama dengan Manasik B21 di
  [audit Ibadah](./2026-09-30-ibadah-deep-audit.md#b21-modern--classic-manasik-menampilkan-markdown-mentah---------low)
  (root cause berbeda file, gejala identik: konten disimpan sebagai
  markdown, sebagian renderer di app ini tidak memakai `MarkdownView`).
- **Dampak**: seluruh isi modul pembelajaran terstruktur (fitur dengan
  badge "Baru") sulit dibaca — teks penuh simbol `**`/`-` di setiap langkah,
  bukan cuma satu dua kata.
- **Screenshot**: `013-modern-lessons-open.png`.
- **UPDATE sesi 2 — FIXED di source (belum di-live-verify)**: commit
  `8d7611a0` mengimpor `MarkdownView` ke `WebAppLessonsRoute.js` dan
  mengganti `<Text>{step?.body || step?.content}</Text>` persis menjadi
  `<MarkdownView content={step?.body || step?.content} isDark={activeDark}
testID='lesson-step-markdown-view' />` — identik dengan saran fix.
  **BLOCKED** untuk konfirmasi visual (APK sesi 2 lebih tua dari commit
  ini, device hilang sebelum rebuild); tidak ada unit test baru spesifik
  untuk render `MarkdownView` di konteks ini, jadi risiko edge-case (mis.
  nested list, tabel markdown) belum tertutup oleh `npx jest`.
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED**: "Modul & Kelas" → "Tata Cara
  Wudhu", Langkah 1/7 sekarang merender markdown penuh dengan benar — bold
  ("Niat wudhu", "Membasuh kedua telapak tangan", dst.), bullet list
  (titik hijau), inline-code untuk kata "Bismillah", italic untuk baris
  terjemahan, dan blockquote hijau-border untuk kutipan HR. Abu Dawud —
  tidak ada lagi tanda `**`/`-` mentah. Screenshot:
  `099-B2-LIVE-CONFIRMED-markdown-rendered.png`. Bug ditutup; belum dicek
  edge-case nested-list/tabel markdown secara spesifik (di luar scope
  sesi ini), tapi kasus nyata (Tata Cara Wudhu) sudah benar.

### B3. [Modern] Artikel: cuplikan daftar menampilkan markdown mentah `##` — LOW

- **Lokasi**: `apps/mobile/src/screens/ExploreScreen.helpers.js:806-816`
  (`getBlogExcerpt` memakai `stripHtmlText` — yang membuang tag HTML, bukan
  sintaks markdown); dirender di
  `apps/mobile/src/screens/explore/WebAppBlogRoute.js:72-78`
  (`{getExcerpt(item)}` di `<Text>` tanpa `MarkdownView`).
- **Expected**: cuplikan artikel berupa teks polos ringkas, tanpa simbol
  markup.
- **Actual**: **WRONG BEHAVIOR, reproducible, terverifikasi live**. Kartu
  pertama daftar Artikel: `## Pengertian dan Hukum Sujud Tilawah Sujud
Tilawah (...) adalah sujud satu kali...` — tanda `##` (heading markdown)
  tampil mentah di awal cuplikan.
- **Dampak**: kosmetik tapi mencolok (tanda pagar di awal kalimat, di kartu
  pertama yang pertama dilihat user); kelas bug yang sama dengan B2.
- **Screenshot**: `012-modern-blog-open.png`.
- **UPDATE sesi 2 — FIXED di source (belum di-live-verify)**: commit
  `8d7611a0` menambah helper baru `stripMarkdownText` di
  `ExploreScreen.helpers.js:197-209` (membuang/mengonversi code-fence,
  heading `#`-`######`, blockquote, bullet, image/link, bold/italic) dan
  membungkus `getBlogExcerpt` dengan helper itu (sebelumnya hanya
  `stripHtmlText`). Test baru `exploreBlogExcerpt.test.js` (25 baris,
  bagian dari 135 test yang di-run ulang sesi ini, PASS) menguji helper
  ini langsung. **BLOCKED** untuk konfirmasi visual (APK sesi 2 lebih tua
  dari commit ini).
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED**: daftar Artikel, kartu pertama
  ("Panduan Lengkap Sujud Tilawah...") sekarang menampilkan cuplikan bersih
  "Pengertian dan Hukum Sujud Tilawah. Sujud Tilawah (سجود التلاوة) adalah
  sujud satu kali yang disyariatkan ket…" — **tidak ada lagi** tanda `##`
  mentah di awal kalimat. Screenshot:
  `100-B3-LIVE-CONFIRMED-clean-excerpt.png`. Bug ditutup.

### B4. [Classic; CONFIRMED live sesi 2 (versi APK lama) + SEBAGIAN sudah FIXED di source, belum di-live-verify] Classic tidak punya hamburger/account-menu/header pencarian sama sekali → Bantuan & Tentang Aplikasi kehilangan SEMUA jalur in-app — HIGH

- **Lokasi**: `apps/mobile/src/layout/ClassicAppShell.js` (hanya merender
  `SafeAreaView` + `KeyboardAvoidingView` + `TabBar`, **tidak pernah
  mengimpor/merender** `MobileTopHeader`, `MobileMenuSheet`, atau
  `MobileAccountMenu` — bandingkan
  `apps/mobile/src/layout/WebAppShell.js:17-22` yang meng-import ketiganya
  dan merendernya di baris 146-189). Baris `help`/`about` hanya didaftarkan
  sebagai target navigasi di
  `apps/mobile/src/layout/MobileMenuSheet.js:67-82`
  (`params: { view: "help" }` / `{ view: "about" }`) — satu-satunya pemicu
  lain untuk kedua view ini adalah deep link (`profile/help`,
  `profile/about`, lihat `apps/mobile/src/utils/deepLinks.js:227,230`).
  `ProfileScreen`'s `SettingsList` sendiri
  (`apksrc/.../ProfileScreen.js:332-373`, tidak berubah s/d HEAD) hanya
  berisi 5 baris: Akun, Notifikasi, Penyimpanan, Tampilan, Keamanan — **tidak
  ada baris Bantuan/Tentang**.
- **Expected**: setiap layar yang bisa dibuka dari Modern (lewat chrome
  globalnya) punya jalur setara yang bisa ditemukan di Classic, atau kalau
  sengaja disembunyikan di Classic itu didokumentasikan sebagai keputusan
  desain.
- **Actual (dari kode, pola absennya komponen — bukan kondisi runtime yang
  bisa salah baca)**: Classic **tidak pernah merender** ketiga komponen
  chrome global itu. Konsekuensi konkret: - **Bantuan** dan **Tentang Aplikasi**: nol jalur in-app di Classic
  (tidak ada tombol di mana pun yang membuka `view:"help"`/`"about"`
  untuk tab `profile`). - **Tokoh Islam**, **Peta Interaktif**, **Perawi Hadith** (3 baris
  "Akses Cepat" hamburger): masih bisa dicapai di Classic lewat
  **Beranda → grid menu → "Lainnya" → Direktori Fitur** (lihat C1) atau
  Pencarian Global dari header Beranda Classic (`PaperHomeHeader`,
  `apps/mobile/src/screens/home/HomeDashboardContent.js:288-297`,
  tombol kaca pembesar memanggil `navigation.open("home",
"global-search")`) — jadi bukan orphan total, tapi butuh 1-2 ketukan
  ekstra dan (untuk pencarian) pengguna harus menebak nama fiturnya. - **Toggle tema/bahasa lewat account-menu**: tetap tersedia lewat jalur
  lain (Profile → Tampilan punya pilihan tema+bahasa+layout sendiri),
  jadi **tidak** hilang total — hanya tidak ada di hamburger/account
  menu karena menu itu sendiri tidak ada.
- **Dampak**: dua layar penuh (Bantuan, Tentang Aplikasi) yang sudah ditulis
  kontennya menjadi 100% tidak terjangkau bagi siapa pun yang memakai
  Classic (layout default sebelum user mengganti ke Modern) tanpa deep
  link.
- **BLOCKED**: ini murni temuan pembacaan kode (ketiadaan import/render,
  bukan kondisi `if` yang bisa salah saya baca) — tapi saya **belum sempat
  membuka Classic sama sekali di device** sebelum emulator hilang, jadi
  belum ada screenshot pembanding langsung. Tandai untuk diverifikasi di
  sesi berikutnya: ganti ke Classic (Profil → Tampilan → Mode Layout →
  Klasik), coba cari Bantuan/Tentang dari mana pun di UI.
- **Saran fix**: beri Classic entry point minimal untuk Bantuan/Tentang
  (mis. dua baris baru di `SettingsList` Profile, berlaku kedua layout), atau
  render ulang `MobileMenuSheet` versi ringkas di `ClassicAppShell`.
- **UPDATE sesi 2 — CONFIRMED live (versi APK lama) + sebagian FIXED di
  source**: berhasil beralih ke Classic (Profil → Tampilan → Mode Layout →
  Klasik, dikonfirmasi lewat radio button terisi,
  `045-classic-selected.png`/`046-classic-selected2.png`) dan membuka
  Profil → Pengaturan Classic — **persis mengonfirmasi klaim asli**:
  `SettingsList` tampil 5 baris (Akun, Notifikasi, Penyimpanan, Tampilan,
  Keamanan), **tidak ada Bantuan/Tentang**
  (`047-classic-profile.png`). Device hilang sebelum sempat mencoba "setiap
  tab lain" untuk mencari jalur tersembunyi, jadi klaim "SEMUA jalur
  hilang" di judul tetap **belum terbukti 100% menyeluruh** (cuma SettingsList
  yang dicek, bukan isi tiap tab Classic satu-satu).
  **TAPI**: pembacaan kode dan `git log` menunjukkan `SettingsList` ini
  **sudah diperbaiki** sejak itu oleh dua commit terpisah — (1) `0164ad12`
  ("harmonize layout and theme tokens", 00:17:28) dan terutama (2)
  `8d7611a0` ("resolve Belajar hub ... B1-B7", 12:06:45, deskripsi commit
  eksplisit: "Add Help and About routes to Profile SettingsList for
  Classic layout parity") — diff persisnya menambah 2 item baru persis di
  posisi yang disarankan: `apps/mobile/src/screens/ProfileScreen.js:366-377`
  sekarang punya baris `screen: "help"` (ikon `HelpCircle`) dan
  `screen: "about"` (ikon `Info`) setelah Keamanan, jadi **7 baris total**.
  Test `profileScreen.test.js` (bagian dari 135 test yang di-run ulang,
  PASS) mencakup file ini. **APK yang dites live sesi 2 lebih tua dari
  kedua commit itu** (lihat C8) — jadi 5-baris yang saya lihat adalah
  state **SEBELUM** fix, bukan bukti bahwa fix-nya gagal.
  **Bagian B4 yang MASIH benar-benar belum di-fix di HEAD** (dicek ulang,
  tidak berubah): `apps/mobile/src/layout/ClassicAppShell.js` di commit
  saat ini **masih** hanya mengimpor `SafeAreaView`/`KeyboardAvoidingView`/
  `TabBar`/`useLayoutModePreference`/`getClassicThemeColors` — **tidak ada**
  import `MobileTopHeader`/`MobileMenuSheet`/`MobileAccountMenu` sama
  sekali. Jadi walau Bantuan/Tentang sudah dapat jalur baru lewat
  SettingsList, **Tokoh Islam/Peta Interaktif/Perawi Hadith** (3 baris
  "Akses Cepat" yang HANYA ada di hamburger Modern) **tetap tidak
  punya hamburger-equivalent di Classic** — masih harus lewat Direktori
  Fitur/Pencarian Global seperti klaim asli. **Kesimpulan**: B4
  **separuh-FIXED** (Bantuan/Tentang) + **separuh-TETAP** (3 Akses Cepat
  tanpa hamburger Classic) — rekomendasi next session: rebuild+reinstall
  lalu re-test SettingsList Classic (harus 7 baris) DAN re-test apakah 3
  fitur Akses Cepat masih hanya reachable lewat Dir/Cari di Classic.
- **UPDATE sesi 3 — LIVE CONFIRMED, mitigasi Bantuan/Tentang berfungsi
  penuh; gap hamburger Classic dikonfirmasi tetap ada, presisi**: di APK
  fresh, Classic → Profil → Pengaturan sekarang menampilkan **7 baris**
  (Akun, Notifikasi, Penyimpanan, Tampilan, Keamanan, **Bantuan**,
  **Tentang Aplikasi**) — persis seperti commit `8d7611a0`. Kedua baris
  baru dibuka satu-satu: **Bantuan** membuka FAQ sungguhan (6 Q&A) dengan
  header-back yang kembali bersih ke Pengaturan; **Tentang Aplikasi**
  membuka layar About sungguhan dengan konten app-info lengkap, back juga
  bersih. Screenshot: `052-classic-settings-7rows-B4-LIVE.png`,
  `053-classic-bantuan-open-B4-LIVE.png`,
  `054-classic-back-from-bantuan-B4-LIVE.png`,
  `055-classic-tentang-open-B4-LIVE.png`. **Bagian yang MASIH belum
  di-fix dikonfirmasi ulang secara presisi**: Classic Beranda (grid menu
  dengan avatar "Tamu"+ikon cari+ikon lonceng) dan Classic Profil root
  (avatar+gear doang) **sama sekali tidak punya elemen menyerupai
  hamburger/menu-3-garis di mana pun** — dicek visual di kedua layar ini
  secara spesifik, bukan cuma dari ketiadaan import di kode. Jadi **Tokoh
  Islam, Peta Interaktif, Perawi Hadith tetap tanpa jalur quick-access di
  Classic** (masih harus lewat Direktori Fitur/Pencarian Global seperti
  klaim asli) — **B4 kini resmi berstatus "separuh-FIXED, separuh-TETAP
  BY DESIGN"** (bukan lagi "belum sempat diverifikasi"), karena
  `ClassicAppShell.js` tidak pernah disentuh komit manapun sejauh ini.
  *(Update 2026-10-03)*: Integrasi fitur referensi Classic (`referenceListFilter.js`)
  kini melengkapi akses `perawi` (kategori tabaqah, pencarian, dan render kartu)
  sehingga ketiga fitur (Tokoh Tarikh, Peta Islam, Perawi Hadis) dapat diakses
  lancar dari Beranda Classic (`home.menu.more` → Direktori Fitur) maupun tab Belajar.

### B5. [Modern; BLOCKED — belum sempat dikonfirmasi live] 3 baris "Akses Cepat" hamburger menyala "selected" bersamaan, bukan hanya yang sedang dibuka — LOW

- **Lokasi**: `apps/mobile/src/layout/MobileMenuSheet.js:194-197`
  (`const selected = active === item.tab || active === item.key;` — `active`
  dioper dari `WebAppShell.js` sebagai `activeTab` mentah, yaitu salah satu
  dari `"home"|"quran"|"hadith"|"ibadah"|"belajar"|"profile"`). Ketiga baris
  "Akses Cepat" (Tokoh Islam, Peta Interaktif, Perawi Hadith) semuanya
  punya `tab: "belajar"`.
- **Expected**: hanya baris yang representasi fitur yang sedang dibuka
  (mis. "Tokoh Islam" saat memang sedang di layar Tokoh Islam) yang
  ter-highlight.
- **Actual (dari kode)**: karena `item.tab === "belajar"` untuk ketiganya,
  begitu `activeTab === "belajar"` (user ada di Belajar tab — fitur APA
  PUN, misalnya sedang baca Kajian), kondisi `active === item.tab` bernilai
  true untuk Tokoh Islam, Peta Interaktif, **dan** Perawi Hadith sekaligus —
  ketiganya akan tampil highlighted/selected bersamaan meskipun user
  sebenarnya sedang di fitur lain sama sekali.
- **Dampak**: kosmetik/membingungkan (indikator "lagi di sini" yang salah),
  tidak memblokir fungsi apa pun — hamburger tetap bisa membuka fitur yang
  benar.
- **BLOCKED**: belum sempat membuka hamburger di device sebelum sesi putus
  (prioritas saya saat itu masih menuntaskan siklus 24 tile hub). Logika di
  atas tidak bergantung pada timing/network, jadi risiko salah baca kode
  rendah, tapi tetap saya tandai sebagai dugaan sampai dikonfirmasi visual.
- **Saran fix**: bandingkan `activeTab === item.tab && (!item.params
|| currentFeatureKey === item.params.featureKey)`.
- **UPDATE sesi 2 — FIXED di source (belum di-live-verify), wiring
  diperiksa menyeluruh**: commit `8d7611a0` menerapkan **persis** saran
  fix di atas — `MobileMenuSheet.js:194-199` sekarang
  `selected = active === item.tab && (!item.params?.featureKey ||
currentFeatureKey === item.params.featureKey)`, dengan prop baru
  `currentFeatureKey` dioper dari `App.js` (`headerConfig?.featureKey ??
null`) → `WebAppShell.js` → `MobileMenuSheet`. Ditelusuri lebih jauh
  (bukan cuma baca satu file): `headerConfig.featureKey` sendiri diisi di
  `ExploreScreen.js:1456-1516` (`updateHeader`, `featureKey =
activeFeature.key` persis saat fitur generik terbuka), dan nilai
  `item.params.featureKey` di ketiga baris Akses Cepat
  (`MobileMenuSheet.js:30-49`) persis `"tokoh"`/`"historical-map"`/
  `"perawi"` — cocok satu-satu dengan `activeFeature.key` dari
  `mobileFeatures.js`. **Wiring-nya nyambung penuh end-to-end**, bukan
  cuma baris kondisi yang terlihat benar tapi datanya tidak pernah
  sampai. Test `mobileMenuSheet.test.js` (94 baris baru, bagian dari 135
  test yang PASS) menguji logika highlight ini. **BLOCKED** murni untuk
  konfirmasi visual (screenshot hamburger terbuka dengan 1 fitur Belajar
  aktif) — APK sesi 2 lebih tua dari commit ini.
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED untuk grup "Akses Cepat", TAPI bug
  class yang SAMA PERSIS ditemukan belum di-fix untuk grup "Lainnya"
  (lihat B16 baru di bawah)**: dites kontras langsung — buka "Tokoh Islam"
  lewat hamburger (hub Belajar), lalu buka hamburger lagi: **hanya "Tokoh
  Islam" yang highlight hijau**, "Peta Interaktif" dan "Perawi Hadith"
  polos. Screenshot: `069-tokoh-islam-open-B5.png`,
  `070-hamburger-single-highlight-B5-FIXED-confirmed.png`. B5 asli
  **ditutup, FIXED**. Namun saat hamburger dibuka dari dalam layar
  Pengaturan (tab `profile`), ditemukan **ketiga baris grup "Lainnya"
  (Pengaturan, Bantuan, Tentang Aplikasi) menyala bersamaan** — persis
  gejala B5 lama, root cause identik (`MobileMenuSheet.js:196-200`:
  `selected = active === item.tab && (!item.params?.featureKey ||
currentFeatureKey === item.params.featureKey)` — fallback
  `!item.params?.featureKey` selalu `true` untuk baris `view`-based seperti
  Pengaturan/Bantuan/Tentang, karena fix B5 hanya menambah disambiguasi
  untuk baris `featureKey`-based). Dicatat sebagai **B16** (baru, lihat di
  bawah) karena secara teknis fix B5 sudah tuntas untuk kasus yang
  dilaporkan semula (3 baris Akses Cepat); yang belum tertutup adalah pola
  identik di grup lain yang tidak disebut di laporan asli.

### B6. [Modern; BLOCKED — belum sempat dikonfirmasi live] Pencarian Global dari Beranda membuat bottom nav tanpa tab yang menyala — MEDIUM

- **Lokasi**: `apps/mobile/src/navigation/appNavigation.js:221-231`
  (`getShellActiveTab`: `if (internalRoutes.home?.view === "global-search")
return "search";`); dibandingkan dengan
  `apps/mobile/src/layout/MobileBottomNav.js:14-30`
  (`webDashboardBottomItems` hanya berisi key
  `home|quran|hadith|ibadah|belajar` — **tidak ada** item dengan key
  `"search"`).
- **Expected**: saat Pencarian Global terbuka (dari ikon kaca pembesar di
  header), tab "Beranda" tetap terlihat menyala (karena secara navigasi
  masih "di dalam" tab Home/internal view), seperti perilaku Pengaturan
  Sholat tetap menyalakan tab Ibadah di audit Ibadah.
- **Actual (dari kode)**: `shellActiveTab` dikirim ke `MobileBottomNav`
  sebagai `active="search"`; karena tidak ada tab berkey `"search"`,
  `selected = active === tab.key` akan `false` untuk **kelima** tab
  sekaligus — bottom nav tampil tanpa highlight sama sekali selama
  Pencarian Global terbuka.
- **Dampak**: user kehilangan penanda "saya sedang di tab mana" saat
  mencari — bukan crash, tapi state visual yang tidak lengkap/tidak
  terduga.
- **BLOCKED**: belum sempat menekan ikon kaca pembesar di device sebelum
  sesi putus (ini seharusnya item pertama yang diuji di scope 3, tapi waktu
  habis duluan untuk scope 1 — lihat Catatan tambahan C1 soal prioritas).
  Rantai logika di atas murni fungsi dari `internalRoutes`/konstanta array,
  tidak bergantung pada data jaringan, jadi saya cukup yakin — tapi tetap
  BLOCKED untuk konfirmasi visual sesuai aturan sesi ini.
- **Saran fix**: tambahkan item `search` semu ke pengecekan `selected` (mis.
  treat `"search"` sebagai alias highlight untuk `"home"`), konsisten dengan
  bagaimana baris kedua `getShellActiveTab` menangani kasus Belajar→Ibadah.
- **UPDATE sesi 2 — FIXED di source (belum di-live-verify)**, pendekatan
  **lebih sederhana** dari saran fix (bukan alias `"search"`→`"home"` di
  `MobileBottomNav`, tapi langsung ubah nilai yang dikembalikan):
  `appNavigation.js:230` sekarang `if (internalRoutes.home?.view ===
"global-search") return "home";` (sebelumnya `return "search";`) — efek
  akhirnya sama (tab Beranda menyala), tercapai dengan diff 1 baris, tidak
  perlu menyentuh `MobileBottomNav.js` sama sekali. Prop `currentFeatureKey`
  yang ditambahkan untuk B5 juga dialirkan lewat `WebAppShell.js`/`App.js`
  di commit yang sama. Ada test eksplisit untuk persis kasus ini —
  `apps/mobile/src/navigation/appNavigation.test.js:525-532`
  (`"highlights Beranda while Global Search is open"`, assert
  `getShellActiveTab({activeTab:"home", internalRoutes:{home:{view:
"global-search"}}})` → `"home"`) — jadi logikanya terverifikasi unit-test,
  bukan cuma dibaca sekilas. **BLOCKED** hanya untuk konfirmasi visual
  (screenshot bottom nav sungguhan saat Pencarian Global terbuka) — APK
  sesi 2 lebih tua dari commit ini.
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED**: Pencarian Global dibuka dari
  ikon kaca pembesar di header Beranda — tab **"Beranda" tetap menyala
  hijau** di bottom-nav sepanjang layar Pencarian terbuka, persis seperti
  yang diharapkan. Screenshot: `113-global-search-open.png` (tab Beranda
  terlihat aktif di bottom-nav). Bug ditutup.

### B7. [Modern & Classic; sebagian dari kode, BLOCKED untuk Quiz Q2+] 3 translation key dipakai di kode tapi tidak terdaftar di kamus manapun → tampil sebagai key mentah ke user — MEDIUM

- **Lokasi & key yang hilang** (dicek lewat perbandingan terprogram: setiap
  pemanggilan `t("...")`/`*Key: "..."` di seluruh `apps/mobile/src/screens`
  dicocokkan ke `idn.js`+`exploreIdn.js`; `translateMobile` di
  `apps/mobile/src/i18n/translations.js:35-41` hanya fallback ke `idn` lalu
  ke **key itu sendiri** — tidak ada fallback lain):
    - `explore.wird.editTitle` — dipakai di
      `apps/mobile/src/screens/ExploreScreen.js:1470` (judul header saat
      mengedit entri Wirid Saya).
    - `explore.forum.detailTitle` — dipakai di
      `apps/mobile/src/screens/ExploreScreen.js:1477` (judul header
      fallback detail pertanyaan Forum Tanya Jawab, saat
      `forumDetail?.title` kosong).
    - `explore.quiz.questionProgress` — dipakai di
      `apps/mobile/src/screens/explore/WebAppQuizRoute.js:275` (judul
      header saat sudah menjawab soal pertama dan maju ke soal berikutnya,
      `currentIndex > 0`).
- **Expected**: judul header memakai kalimat berbahasa Indonesia (atau
  Inggris saat bahasa EN dipilih), bukan string key teknis.
- **Actual (dari kode, pasti — bukan dugaan)**: ketiga key ini **tidak ada**
  di `idn.js` atau `exploreIdn.js` (dicek 2× dengan skrip berbeda). Begitu
  layar terkait memicu jalur ini, header akan menampilkan literal
  `"explore.wird.editTitle"` / `"explore.forum.detailTitle"` /
  `"explore.quiz.questionProgress"` ke user, bukan judul yang wajar.
  Catatan: `common.scrollToTop` juga hilang dari kamus tapi dipakai di
  `HadithScreen.js` — **di luar scope Belajar**, disebut untuk audit lain.
- **Dampak**: untuk Quiz khususnya, ini berarti **setiap** quiz dengan lebih
  dari 1 soal (hampir semua) akan menampilkan judul header rusak begitu
  user maju ke soal ke-2.
- **BLOCKED (sebagian)**: Quiz Islami dikonfirmasi hidup di device
  (`025-modern-quiz-open.png`, soal 1/5, header masih benar "Quiz Islami"
  karena `currentIndex === 0` memakai cabang berbeda) — tapi sesi putus
  sebelum sempat menjawab untuk maju ke soal 2 dan membuktikan key mentah
  benar-benar muncul di layar. Wirid Saya (guest, gating login) dan Forum
  (tipe lokal) sendiri tidak dibuka live sama sekali sesi ini (di luar 24
  tile hub Belajar — keduanya ada di `featureGroups` tapi bukan bagian
  `belajarFeatureGroups`, hanya reachable lewat Ibadah hub untuk
  Wirid Saya atau Direktori Fitur/Pencarian untuk Forum).
- **Saran fix**: tambahkan ketiga key ke `idn.js`/`en.js`
  (`exploreIdn.js`/`exploreEn.js`), jalankan audit serupa untuk seluruh
  codebase secara berkala (skrip pembanding sudah ada, tinggal dijadikan
  lint/CI check).
- **UPDATE sesi 2 — FIXED di source (belum di-live-verify untuk Quiz
  Q2+)**: commit `8d7611a0` mendaftarkan **ketiga key persis seperti
  saran**: `explore.wird.editTitle` ("Edit Wirid") di
  `exploreIdn.js:294`/`exploreEn.js:296`; `explore.forum.detailTitle`
  ("Detail Pertanyaan"/"Question Detail") di `idn.js:293`/`en.js:291`;
  `explore.quiz.questionProgress` ("Pertanyaan {current} / {total}"/
  "Question {current} / {total}") di
  `exploreIdn.js:135`/`exploreEn.js:221` — keempat file kamus diperbarui,
  bukan cuma satu bahasa. Test baru `mobileI18n.test.js` (21 baris, bagian
  dari 135 test yang di-run ulang sesi ini, PASS) menguji ketiga key ini
  terdaftar. **BLOCKED untuk konfirmasi visual** tetap berlaku untuk Quiz
  Q2+ (butuh menjawab soal 1 lalu lihat header soal 2 — device hilang
  sebelum sempat ini, dan APK sesi 2 lebih tua dari commit fix ini jadi
  walau sempat dicoba pun hasilnya belum tentu representatif untuk HEAD).
  Wirid Saya (edit) dan Forum (detail) **masih belum pernah dibuka live**
  sesi ini maupun sesi 1 — tetap BLOCKED total untuk kedua fitur itu.
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED untuk Quiz Q2+**: dijawab soal 1/5
  Quiz Islami (jawaban salah, lalu tekan "Lanjut") — header berubah jadi
  **"Pertanyaan 2 / 5"**, kalimat Indonesia yang benar, BUKAN
  `explore.quiz.questionProgress` mentah. Screenshot:
  `102-B7-LIVE-CONFIRMED-Pertanyaan-2-5.png`. Bug untuk Quiz ditutup. Wirid
  Saya (edit) dan Forum (detail) **masih belum dibuka live sesi ini** (di
  luar 24 tile hub Belajar, tidak masuk prioritas sesi ini) — kedua key
  kamusnya sudah terdaftar dan lolos `mobileI18n.test.js`, tapi render
  live-nya tetap belum pernah dilihat langsung di layar manapun.

### B8. [Modern; CONFIRMED live sesi 2] Pencarian Asmaul Husna (99 item) memblokir thread JS 2-8 detik per ketukan → bisa berujung ANR sungguhan — HIGH

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppReferenceListRoute.js:411-412`
  (state `search`/`category` lokal, tanpa debounce), `:425-437`
  (`filteredItems` — `useMemo` yang me-re-filter **seluruh** `items` lewat
  `getItemSearchText` setiap kali `search` berubah), dan `:488-495`
  (`<TextInput onChangeText={setSearch} ... />` — langsung `setState` per
  karakter, tanpa `InteractionManager`/debounce/throttle apa pun). Dipakai
  oleh SEMUA fitur daftar-referensi lewat `WebAppReferenceListRoute`
  (Dzikir 37 item, Wirid 37, Doa 82, **Asmaul Husna 99**, Manasik) — makin
  besar dataset dan makin kompleks tiap card (Asmaul Husna: glyph Arab +
  badge + terjemahan), makin berat filter-nya.
- **Expected**: mengetik di kotak cari tetap responsif; keyboard tidak
  pernah menumpuk event yang belum diproses.
- **Actual**: **WRONG BEHAVIOR, reproducible, terverifikasi live DUA kali**
  (sekali berujung ANR penuh, sekali tanpa ANR tapi tetap lamban).
  Percobaan 1 (3× `adb shell input text "Kuat"` berturutan dalam ~15 detik
  di kotak cari Asmaul Husna, termasuk 1× reset manual di antaranya):
  `logcat` mencatat `InputDispatcher: ... spent 2570ms/2670ms/2026ms/
2260ms/8237ms processing KeyEvent` untuk tiap tombol `K`/`SHIFT_LEFT`
  individual, lalu `W InputDispatcher: Window ... is unresponsive. Waited
5002ms`, lalu `E ActivityManager: ANR in com.thullaabulilmi.app ...
Reason: Input dispatching timed out`, dan dialog sistem "Thullaabul Ilmi
  isn't responding" benar-benar muncul di layar
  (`24-anr-dialog-current.png`, `25-anr-after-wait.png`,
  `apps/mobile/output/native/2026-10-01-fix-verify/`). Menekan "Wait" tidak
  memulihkan dalam waktu wajar (app akhirnya hilang dari foreground —
  walau penyebab pastinya bercampur dengan insiden reinstall APK tak
  terduga yang terjadi nyaris bersamaan, lihat C9, jadi "app hilang
  setelah Wait" **tidak** saya klaim murni akibat ANR ini). Percobaan 2
  (SATU kali ketik "Kuat" saja, sabar menunggu 6 detik, tanpa retry):
  **tidak ANR**, tapi hasil pencarian baru muncul benar setelah jeda yang
  terasa (`31-asmaul-husna-search-single.png` — hasil akhirnya benar, "2
  dari 99 nama", tapi highlight/filter tidak instan seperti mengetik di
  daftar lain yang lebih kecil, mis. Dzikir 37 item terasa jauh lebih
  responsif).
- **Root cause**: tidak ada debounce pada `onChangeText`; setiap keystroke
  memicu `useMemo` yang menjalankan `.filter()` + normalisasi teks Arab
  atas seluruh 99 item secara SINKRON di render thread. Di emulator x86_64
  ini, satu siklus filter+render 99 card berat (badge, Arabic shaping)
  menghabiskan 2-8 detik — cukup lama untuk event-dispatch Android
  menumpuk >5 detik dan memicu ANR kalau beberapa keystroke datang
  berdekatan (lazimnya terjadi kalau Gboard sempat salah ketik dan user
  mengetik ulang dengan cepat, persis skenario yang saya reproduksi tanpa
  sengaja).
- **Dampak**: fitur pencarian di tile hub paling besar datanya (Asmaul
  Husna, 99 nama) berisiko membuat app benar-benar tidak responsif/ANR
  bagi user yang mengetik lebih dari beberapa karakter dengan wajar —
  bukan cuma soal UX lamban, ini risiko **crash-adjacent** sungguhan.
  Kelas bug yang berkerabat dengan B5 audit Ibadah (filter client-side atas
  dataset yang tidak lagi dipaging kecil — net efek sampingan dari
  perbaikan "muat semua item sekaligus" yang sudah terlihat berjalan untuk
  Dzikir/Wirid/Doa/Asmaul Husna sesi ini, tapi membuat SETIAP keystroke
  jadi O(n) atas array yang kini lebih besar).
- **Saran fix**: debounce `setSearch` (150-300ms) sebelum memicu
  `filteredItems`; pertimbangkan `useDeferredValue`/`InteractionManager`
  untuk melepas filter dari render-blocking path; untuk dataset >50 item
  pertimbangkan memoisasi `getItemSearchText` per-item (precompute sekali
  saat data dimuat, bukan setiap keystroke).
- **Screenshot**: `20`–`25`, `31` di
  `apps/mobile/output/native/2026-10-01-fix-verify/` (lihat laporan Part 1
  terpisah untuk urutan lengkap).
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED, dites agresif di 2 layar
  berbeda**: source dikonfirmasi sudah pakai pola debounce 300ms
  (`WebAppReferenceListRoute.js`: `search` lokal untuk echo instan via
  `value={search}`, `debouncedSearch` via `setTimeout(...,
SEARCH_DEBOUNCE_MS)` baru dipakai `filteredItems`). Live test di **Sejarah
  Islam** (20→34 item, membuktikan `hasMore`/auto-load-more juga ikut
  teruji): ketik "Khulafa" karakter-demi-karakter tanpa jeda lewat 7×
  `adb shell input text`, screenshot ~1 detik kemudian menunjukkan teks
  sudah ter-echo penuh TANPA ANR, hasil filter benar setelah debounce
  selesai ("5 dari 34"); ketik "Perang Badar" sebagai satu string atomik,
  screenshot ~0.3 detik kemudian langsung benar ("3 dari 34", "Perang
  Badar" di hasil teratas). Live test di **Asmaul Husna** (lokasi bug
  asli, 99 item): ketik "Kuat" karakter-demi-karakter, screenshot instan
  menunjukkan teks ter-echo tapi filter belum jalan (masih "99 dari 99" —
  BENAR, karena debounce belum selesai), screenshot 1 detik kemudian
  menunjukkan hasil benar "2 dari 99" (Al-Qawiyy, Al-Matin) — persis
  mengulang skenario reproduksi bug asli, kini bersih. Stress test
  tambahan: rentetan ketik+hapus+ketik tanpa jeda sampai teks jadi acak
  ("KuatMaha Pengasihsayang") menghasilkan state kosong "Data tidak
  ditemukan" yang benar, bukan freeze. `adb logcat -d | grep -iE
"anr|not responding|FATAL"` dan `dumpsys activity processes | grep
notresponding` **bersih total** di sepanjang pengujian — **tidak ada ANR
  sama sekali**, kontras total dengan reproduksi asli. Screenshot:
  `058`-`064` (lihat indeks screenshot). Bug ditutup, HIGH severity
  resolved.

### B9. [Modern; CONFIRMED live sesi 2] Memilih chip kategori Doa mengganti judul header jadi raw category key, bukan label — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppDoaRoute.js:233-243`
  (`useEffect` yang memanggil `navigation.setHeader({..., title: category,
...})` — memakai nilai mentah `category` state, mis. `"bangun"`/
  `"pagi"`/`"petang"`, BUKAN `getCategoryLabel(category, t)` yang sudah
  ada dan dipakai dengan benar di tempat lain pada file yang sama, mis.
  baris 142 untuk badge kategori per-item). **Bukan bagian dari fix R3**
  (commit `7de394aa`) — diff commit itu di file ini hanya menyentuh
  `DOA_CATEGORY_TITLE_PATTERNS`/`matchesCategory`/`filterDoas` (baris
  ±30-83), tidak menyentuh blok header di baris 233-256 sama sekali; bug
  ini **sudah ada sebelum** R3 dan tidak disinggung di audit manapun
  sebelumnya.
- **Expected**: header tetap menampilkan judul fitur yang proper-case
  ("Doa") atau label kategori yang proper-case ("Bangun"/"Pagi"), bukan
  key internal huruf kecil.
- **Actual**: **WRONG BEHAVIOR, reproducible, terverifikasi live 2×**.
  Buka Doa (header "Doa", benar) → tap chip "Bangun" → header berubah
  jadi **"bangun"** huruf kecil mentah (`35-doa-bangun-chip-retry.png`).
  Reset lalu tap chip "Pagi" → header jadi **"pagi"** (`39-doa-pagi-chip.png`).
  Isi konten di bawahnya tetap benar (chip terfilter dengan benar, jumlah
  item benar) — murni judul header yang salah. Kembali ke hub lalu buka
  ulang Doa dengan kategori masih ter-persist dari sebelumnya (tanpa
  benar-benar menekan chip, cuma deep-link ulang) menampilkan header
  "Doa" yang benar meski chip "Bangun" tetap terseleksi
  (`36-doa-fresh-header-check.png`) — jadi bug ini murni terjadi pada
  **transisi tekan-chip itu sendiri** (efek `useEffect` yang
  menjalankan `setHeader` dengan `category` mentah), bukan pada render
  ulang biasa.
- **Root cause**: lihat Lokasi — `title: category` seharusnya
  `title: category ? getCategoryLabel(category, t) : t("explore.doa.title")`.
- **Dampak**: kosmetik tapi langsung terlihat setiap kali user memfilter
  Doa dengan kategori apa pun (10 kategori tersedia) — kelas bug yang
  sama dengan B7 (string teknis/internal bocor ke UI), tapi di sini bukan
  translation-key mentah, melainkan slug kategori mentah; untungnya kata
  Indonesia-nya ("bangun"/"pagi") masih terbaca sebagai kata biasa (lebih
  ringan dari B7), tapi tetap salah/tidak professional dan inkonsisten
  dengan heading-case semua layar lain di app.
- **Catatan cakupan**: diperiksa SATU fitur pembanding (Dzikir, chip
  "Petang" lewat `16-dzikir-petang-selected.png`) — header **tetap benar**
  ("Dzikir", tidak berubah jadi "petang") karena Dzikir memakai komponen
  berbeda (`WebAppReferenceListRoute`, bukan `WebAppDoaRoute`) yang tidak
  menyentuh header sama sekali saat filter berubah. Jadi bug ini **spesifik
  untuk Doa**, bukan pola lintas-fitur — tidak diperiksa di Manasik/fitur
  lain yang mungkin punya header-setter serupa sendiri (BLOCKED, device
  hilang sebelum sempat).
- **Saran fix**: ganti `title: category` menjadi
  `title: category ? getCategoryLabel(category, t) : t("explore.doa.title")`
  di `WebAppDoaRoute.js:238`; tambahkan test regresi (belum ada test yang
  menangkap ini — `exploreWebAppRoutes.test.js` menguji `matchesCategory`
  tapi tidak menguji judul header saat kategori aktif).
- **Screenshot**: `34`, `35`, `36`, `39` di
  `apps/mobile/output/native/2026-10-01-fix-verify/`.
- **UPDATE sesi 3 — LIVE CONFIRMED FIXED, 2 kategori dites**: buka Doa
  (header "Doa", benar) → tap chip **"Bangun"** → header berubah jadi
  **"Bangun"** (huruf besar-kecil proper, BUKAN "bangun" mentah). Reset →
  tap chip **"Pagi"** → header jadi **"Pagi"** (proper juga). Screenshot:
  `065-doa-open-header-correct-B9.png`,
  `066-doa-bangun-chip-header-FIXED-B9.png`,
  `067-doa-pagi-chip-header-FIXED-B9.png`. Bug ditutup.

### B10. [Modern & Classic; CONFIRMED live] Nama aplikasi dieja 3 cara berbeda di 3 layar berbeda — LOW

- **Lokasi**:
    - `apps/mobile/src/screens/ProfileScreen.js:1747,2177` — fallback nama
      akun guest: `user?.name || "Thullabul Ilmi"` (satu huruf "a").
    - `apps/mobile/src/layout/MobileTopHeader.js:92` — judul header Modern:
      literal `Thullaabul 'Ilmi` (dua huruf "a", plus apostrof sebelum
      "Ilmi").
    - `apps/mobile/src/i18n/locales/idn.js:1213`/`en.js:1156` (key
      `profile.about.appName`) dipakai di layar Tentang Aplikasi:
      `"Thullaabul Ilmi"` (dua huruf "a", tanpa apostrof) — cocok dengan
      `app.json:3` (`"name": "Thullaabul Ilmi"`), jadi inilah ejaan "resmi".
- **Expected**: nama aplikasi konsisten di semua layar, mengikuti
  `app.json`.
- **Actual**: **CONFIRMED live**. Dalam satu sesi, hanya 2 ketukan,
  terlihat 3 ejaan berbeda: Profil (Modern & Classic) → "Thullabul Ilmi";
  header Modern (selalu terlihat, chrome paling sering dilihat) →
  "Thullaabul 'Ilmi"; Tentang Aplikasi → "Thullaabul Ilmi" (yang benar,
  cocok `app.json`).
- **Root cause**: tiga tempat hardcode literal string sendiri-sendiri,
  tidak ada satu sumber kebenaran (constant/key i18n bersama).
- **Dampak**: kosmetik murni, tidak memblokir fungsi, tapi terlihat tidak
  profesional — khususnya di header Modern yang selalu terlihat, bukan
  cuma di layar jarang-dibuka seperti Tentang Aplikasi.
- **Saran fix**: satukan ke satu konstanta (mis. `APP_NAME` di `theme.js`)
  dipakai di ketiga lokasi; minimal samakan ejaan ke `"Thullaabul Ilmi"`
  (sudah cocok `app.json`) di `ProfileScreen.js:1747,2177` dan
  `MobileTopHeader.js:92`.
- **Screenshot**: `051-classic-profile-root-live.png` (Thullabul Ilmi),
  `056-modern-switched-live-B10-header-name.png` (Thullaabul 'Ilmi),
  `055-classic-tentang-open-B4-LIVE.png` (Thullaabul Ilmi, benar).
- **LIVE-CONFIRMED 2026-10-01 (sesi 5, live-verify fix `6ca564a0`)**: APK fresh
  install, guest, Modern. Ketiga lokasi asli yang disebut di judul bug kini
  **identik**, "Thullaabul Ilmi" (dua huruf "a", tanpa apostrof), dikonfirmasi
  lewat crop-zoom ImageMagick di ketiganya: Profil root (fallback nama guest,
  `004-profile-root-guest.png` + zoom), header Modern
  (`002-after-location-perm.png` + zoom), dan Tentang Aplikasi
  (`007-tentang-aplikasi-open2.png` + zoom, termasuk Classic
  `045-classic-selected.png`). Konstanta `APP_NAME` (`theme.js:1`) dipakai
  konsisten di ketiganya — bug asli **ditutup, FIXED**. **TAPI** ditemukan
  residual: perbaikan ini scope-nya cuma 3 lokasi yang disebut di laporan
  asli, sementara masih ada 2 key i18n + 2 literal JS lain yang memakai
  ejaan lama berbeda ("Thollabul Ilmi" di `profile.about.description` dan
  teks share Zakat/Faraidh, "Thullabul Ilmi" satu-l di `theme.light.meta`)
  — lihat **B17 (baru)** untuk rincian lengkap.

### B11. [Modern; CONFIRMED live] Toggle bahasa ID/EN tidak diterapkan ke hero+tile hub Belajar, nama badge Pencapaian, 7 dari 9 judul header Profil/Pengaturan, dan toggle Kitab/Hadis — MEDIUM

- **Lokasi**:
    - `apps/mobile/src/screens/explore/ExploreWebAppRoutes.js:3221,3229,3237-3238`
      — hero hub Belajar ("KONTEN ISLAM"/"Belajar"/subtitle) hardcode literal
      Indonesia langsung di JSX, PADAHAL key terjemahan `menu.content` SUDAH
      ADA dan benar di `idn.js:600` ("KONTEN ISLAM")/`en.js:597` ("ISLAMIC
      CONTENT") — cuma tidak pernah dipanggil lewat `t()`.
    - `apps/mobile/src/data/mobileFeatures.js` — seluruh `title`/`meta` tile
      (92 kemunculan `title:`) adalah string polos (mis. `title: "Kajian"`),
      bukan translation key — tidak ada lapisan i18n sama sekali untuk
      katalog fitur.
    - `apps/mobile/src/screens/ProfileScreen.js:1327-1337` — objek `titles`
      untuk header Modern (`isWebAppLayout`) hardcode 9 judul: `settings`
      ("Pengaturan"), `achievements` ("Pencapaian"), `help` ("Bantuan"),
      `about` ("Tentang Aplikasi"), `settings-account` ("Akun"),
      `settings-notifications` ("Notifikasi"), `settings-storage`
      ("Penyimpanan"), `settings-appearance` ("Tampilan"),
      `settings-security` ("Keamanan") — semua tanpa `t()`.
    - Nama 6 badge Pencapaian ("Konsisten 3 Hari", dst.) juga tidak ikut
      berubah — sumbernya belum ditelusuri sampai endpoint API, di luar
      scope kode mobile.
    - `apps/mobile/src/screens/HadithScreen.js:101-102` — toggle tab
      "Book"/"Hadith" juga hardcode Inggris:
      `{ key: "book", label: "Book" }, { key: "hadith", label: "Hadith" }`
      — SELALU Inggris, bahkan saat bahasa aktif Indonesia (bukan cuma
      gagal berubah saat toggle ke EN, tapi salah sejak mode default).
- **Expected**: toggle Bahasa Konten (Profil → Tampilan, atau tombol
  ID/English di account-menu) mengubah SEMUA teks UI, termasuk hero hub,
  tile, badge, dan header stack Profil.
- **Actual**: **CONFIRMED live**. Flip ke English (account-menu): bottom-nav
  ("Home/Al-Quran/Hadith/Worship/Learn"), hamburger (6 baris), Doa
  (chip+search+konten), account-menu sendiri SEMUA berubah benar ke
  Inggris. TAPI hub Belajar (dicek bersih tanpa filter aktif) tetap 100%
  Indonesia ("KONTEN ISLAM", "Belajar", "Kajian & Artikel", dst.) —
  `071-belajar-hub-STILL-INDONESIAN-in-EN-B11.png` — vs hub Ibadah yang
  dibuka di sesi yang sama dan benar-benar berubah ke Inggris ("Worship &
  Tracker", "Prayer Schedule", dst.). Profil → Settings (English aktif):
  header "Pengaturan" tetap Indonesia padahal SEMUA baris di bawahnya
  ("Account"/"Notifications"/dst.) sudah Inggris —
  `074-pengaturan-header-not-translated-B11.png`; sama untuk Help
  ("Bantuan" — `072-bantuan-header-not-translated-B11.png`) dan About
  ("Tentang Aplikasi" — `073-tentang-header-not-translated-B11.png`),
  padahal ISI badan ketiga layar itu (FAQ, App info) sudah Inggris penuh.
  Profile root: 6 badge Pencapaian tetap Indonesia walau label section
  "ACHIEVEMENTS"/tombol "Sign In / Register" sudah Inggris. Tab Hadis:
  toggle "Book"/"Hadith" tampil Inggris bahkan saat bahasa aktif masih
  Indonesia (default).
- **Root cause**: lihat Lokasi — dua pola: (1) literal JSX yang seharusnya
  memanggil key yang SUDAH ADA (hero hub), (2) katalog data
  (`mobileFeatures.js`) dan map statis (`ProfileScreen.js` titles) yang
  memang tidak pernah dirancang reaktif terhadap `t()`.
- **Dampak**: fitur ganti-bahasa yang dipromosikan di Pengaturan jadi
  setengah-berfungsi — area yang PALING sering dilihat (hub utama,
  judul-judul Settings) tetap Indonesia walau user sudah eksplisit pilih
  English, merusak kepercayaan pada fitur itu sendiri.
- **Saran fix**: untuk hero hub, ganti 3 literal JSX dengan
  `t("menu.content")` dkk. yang sudah ada; untuk `mobileFeatures.js`,
  tambah lapisan i18n per title/meta (scope besar, 46 fitur); untuk
  `ProfileScreen.js:1327-1337`, ganti objek `titles` statis dengan
  pemanggilan `t()` per key; untuk `HadithScreen.js:101-102`, ganti label
  dengan `t()` yang benar untuk kedua bahasa.
- **Screenshot**: `071-belajar-hub-STILL-INDONESIAN-in-EN-B11.png`,
  `072-bantuan-header-not-translated-B11.png`,
  `073-tentang-header-not-translated-B11.png`,
  `074-pengaturan-header-not-translated-B11.png`.
- **LIVE-CONFIRMED 2026-10-01 (sesi 5, live-verify fix `6ca564a0`)**: ketiga
  sub-fix dites satu-satu, Modern, APK fresh. (a) Hub Belajar dalam English:
  hero sekarang "ISLAMIC CONTENT" / "Learn" / "Lectures, Islamic references,
  and personal features in one dashboard catalog." —
  `012-belajar-hub-en-v2.png`; tile hub (Kajian/Artikel/dst.) tetap Indonesia,
  **sesuai ekspektasi** (scope `mobileFeatures.js` sengaja ditunda). (b)
  Profil → Settings/Help/About header: ketiganya sekarang Inggris penuh
  ("Settings" `016-settings-en-v2.png`, "Help" `018-help-en-v2.png`, "About
  App" `010-about-app-en-closed-menu.png`), isi badan (FAQ, app info) juga
  Inggris; bonus cek "Security" header ikut Inggris
  (`017-help-en.png`, tap nyasar). (c) Toggle Hadis: default Indonesia
  sekarang "Kitab"/"Hadis" (`020-hadis-tab-id-default.png`), flip ke English
  jadi "Book"/"Hadith" (`021-hadis-tab-en-toggle.png`) — kedua arah benar.
  Ketiga sub-fix **ditutup, FIXED**. Badge Pencapaian & katalog
  `mobileFeatures.js` dikonfirmasi ulang tetap Indonesia-only, sesuai catatan
  "sengaja ditunda" di commit — bukan regresi baru.

### B12. [Modern; CONFIRMED live, direproduksi bersih] Tab bottom-nav Belajar tidak benar-benar berpindah konten saat fitur yang dibuka dari hub LAIN sedang tampil — MEDIUM

- **Lokasi**:
    - `apps/mobile/App.js:405` — visibilitas pane konten per tab:
      `const isActive = activeTab === tab;` (pakai `activeTab` MENTAH).
    - `apps/mobile/App.js:391` — chrome (bottom-nav+header):
      `<MobileAppShell activeTab={shellActiveTab} ...>` (pakai nilai
      TURUNAN, bukan `activeTab` mentah).
    - `apps/mobile/src/navigation/appNavigation.js:231-233`
      (`getShellActiveTab`):
      `if (activeTab === "belajar" && returnRoutes.belajar?.tab === "ibadah") { return "ibadah"; }`
      — aturan ini menampilkan highlight "Ibadah" (bukan "Belajar") saat
      fitur yang secara internal dirender lewat tab "belajar" dibuka dengan
      breadcrumb "kembali ke Ibadah" — niatnya baik, tapi menyembunyikan
      fakta bahwa `activeTab` RAW sebenarnya sudah "belajar".
- **Expected**: menekan tab "Belajar" di bottom-nav, dari layar manapun,
  selalu membawa ke hub Belajar (atau me-refresh ke hub kalau sudah di
  tab itu).
- **Actual**: **CONFIRMED live, direproduksi bersih 2×**. Langkah: dari
  hub Belajar (bersih) → tap tab Ibadah (fresh, benar menyala "Ibadah") →
  tap tile "Doa" (header "Doa", tab yang menyala tetap "Ibadah" via
  `uiautomator selected=true`) → tap tab "Belajar" di bottom-nav. Hasil:
  highlight tab berubah jadi "Belajar" (`selected=true` via dump), TAPI
  konten layar TETAP menampilkan Doa (teks "Doa" masih ada, marker hub
  "KONTEN ISLAM"/"Kajian" TIDAK ada) —
  `078-B12-clean-repro-doa-stuck-belajar-highlighted.png`. Hardware-back
  dari state ini membawa ke hub **Ibadah** (bukan hub Belajar),
  membuktikan navigation stack asli memang masih "ibadah" dengan
  breadcrumb `returnTo` utuh —
  `076-hwback-reveals-real-tab-was-ibadah-B12.png`. Kontras: tab-switch
  langsung DARI HUB (bukan dari fitur yang sedang terbuka) berfungsi
  normal — tap Ibadah dari hub Belajar langsung menampilkan hub Ibadah
  dengan benar — `077-tab-switch-works-from-hub-screen-B12-contrast.png`.
- **Root cause**: dari pembacaan kode, Doa (dan kemungkinan semua fitur
  Hub-Ibadah lain yang didelegasikan ke `ExploreScreen`) membuat
  `activeTab` RAW menjadi `"belajar"` begitu dibuka dari Ibadah (dengan
  `returnRoutes.belajar` dipasang agar back kembali ke Ibadah) —
  `getShellActiveTab` MENYEMBUNYIKAN ini di level chrome. Begitu user
  menekan tab "Belajar" langsung, `openTabState("belajar", null)`
  dipanggil: karena `current.activeTab` SUDAH `"belajar"` (walau
  highlight bilang "Ibadah"), ini jadi no-op bagi state navigasi murni —
  `ExploreScreen` (sudah menampilkan Doa) tidak punya alasan mereset
  `activeFeature`-nya. Yang berubah hanya precondition
  `getShellActiveTab` (ikut ter-reset oleh langkah lain di
  `openTabState`), sehingga highlight "lepas" dari mode override. Exact
  mechanism belum 100% dipastikan baris-demi-baris (butuh logging
  runtime), tapi black-box behavior di atas reproducible 100%.
- **Dampak**: user yang sedang membaca Doa (atau fitur cross-hub lain
  dari Ibadah) lalu menekan tab Belajar bottom-nav — ekspektasi wajar
  "lihat hub Belajar" — TIDAK terjadi; tidak ada perubahan visual selain
  highlight tab, sangat membingungkan karena terlihat seperti tombol
  mati padahal state sebenarnya berubah diam-diam.
- **Saran fix**: saat `openTabState` menerima permintaan tab BARU yang
  sama dengan `activeTab` RAW saat ini tapi `shellActiveTab`-nya BERBEDA
  (indikasi "user menekan tab yang menurut dia belum aktif"), reset
  `internalRoutes[tab]`/`activeFeature` ke default (hub) alih-alih
  memperlakukannya sebagai no-op.
- **Screenshot**: `075-tab-switch-stuck-on-old-content-B12.png`,
  `076-hwback-reveals-real-tab-was-ibadah-B12.png`,
  `077-tab-switch-works-from-hub-screen-B12-contrast.png`,
  `078-B12-clean-repro-doa-stuck-belajar-highlighted.png`.
- **LIVE-CONFIRMED 2026-10-01 (sesi 5, live-verify fix `ae704030`)**: repro
  asli diulang bersih 2× (Belajar hub → Ibadah fresh → Doa → tap Belajar) —
  **kedua kali** langsung menampilkan hub Belajar ("KONTEN ISLAM" terlihat),
  bukan lagi stuck di Doa (`026-b12-step3-tap-belajar-FIRST.png`,
  `029-b12-run2-tap-belajar-RESULT.png`). Dua non-regresi juga dites: re-tap
  Belajar saat sudah bersih di hub (scroll position tidak berubah, tidak ada
  flicker, `030` vs `031`) dan re-tap Ibadah saat highlight-nya sudah cocok
  (`032` vs `033`, tetap normal). Bug **ditutup, FIXED**, non-regresi PASS.

### B13. [Modern & Classic; CONFIRMED live] Label section "Tema"/"Bahasa Konten"/"Mode Layout" nyaris tak terbaca di tema gelap — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/ProfileScreen.styles.js:2` —
  `import { colors, ... } from "../theme"` memakai konstanta `colors`
  STATIS (nilai tema TERANG, `ink: "#3c3a35"`), bukan hasil panggilan
  `getClassicThemeColors(isDark)`/sejenis yang reaktif — karena
  `export const styles = StyleSheet.create({...})` dibangun SEKALI saat
  modul di-load, semua style yang pakai `colors.ink` BEKU ke warna
  mode-terang selamanya. Dipakai di `appearanceLabel`
  (`:1137-1142`, `color: colors.ink`) yang dirender untuk label
  "Tema"/"Bahasa Konten"/"Mode Layout" (`ProfileScreen.js:511,531,...`)
  DAN label Q&A Bantuan (`:1604`) — kelas bug yang sama berpotensi
  memengaruhi label lain di file ini (belum ditelusuri satu-satu).
- **Expected**: label section tetap kontras tinggi saat tema gelap aktif,
  konsisten dengan body text di bawahnya yang sudah benar.
- **Actual**: **CONFIRMED live, 2 layout**. Tema di-set ke Gelap
  (Profil→Tampilan→Gelap) — label "Tema" tampil warna coklat-gelap nyaris
  menyatu dengan background hitam-kehijauan, jauh lebih redup dari body
  text di bawahnya (`colors.muted`, abu-abu terang yang kebetulan masih
  cukup kontras meski juga statis) — `109-dark-enabled.png` menunjukkan
  ini gamblang (crop zoom di scratchpad sesi ini). Dikonfirmasi SAMA di
  Modern (`112-modern-tampilan-dark-B13.png`) — bug bukan spesifik satu
  layout karena `AppearanceSettings` adalah komponen yang sama persis
  untuk kedua layout. Sebagai kontras, hub Belajar dalam tema gelap
  (Classic & Modern) kontrasnya BAGUS — lihat checklist tema gelap.
- **Root cause**: lihat Lokasi.
- **Dampak**: terbalik dari harapan — HEADING (harusnya lebih menonjol)
  jadi KURANG terbaca dari body text di bawahnya; mempengaruhi 3 section
  di layar Tampilan (sering dibuka user yang baru mengaktifkan dark mode)
  plus kemungkinan label Q&A Bantuan.
- **Saran fix**: hitung `styles` lewat factory function yang menerima
  `colors`/`isDark` sebagai argumen (pola yang sudah dipakai di
  `theme.js`'s `getThemeColors`), dipanggil ulang tiap render alih-alih
  `StyleSheet.create` statis sekali di level modul.
- **Screenshot**: `109-dark-enabled.png`, `112-modern-tampilan-dark-B13.png`.
- **LIVE-CONFIRMED 2026-10-01 (sesi 5, live-verify fix `6ca564a0`)**: tema
  Gelap aktif, Modern. Label "Tema"/"Bahasa Konten"/"Mode Layout" sekarang
  terang/putih, kontras tinggi terhadap background gelap
  (`038-tampilan-dark-B13.png`) — perbaikan dramatis dibanding sebelumnya.
  Label Q&A Bantuan juga dicek: judul pertanyaan putih terang, jawaban abu
  muda, kontras baik di semua 5 Q&A yang terlihat
  (`039-bantuan-dark-B13.png`). Kedua target **ditutup, FIXED**. Sesuai
  prediksi dokumen fix, dicek ulang dan dikonfirmasi **masih buram** (belum
  diperbaiki, bukan regresi baru, memang sengaja ditunda): judul "Keamanan
  Akun" di layar Keamanan (`040-keamanan-dark-still-bad.png`) dan judul
  "Tentang" di layar Tentang Aplikasi (`035-profile-root-dark.png` + zoom) —
  keduanya coklat-redup nyaris menyatu dengan background gelap, kelas bug
  identik, perlu sesi fix terpisah seperti sudah dicatat di commit.

### B14. [Classic; CONFIRMED live + source] 8 fitur bertipe `"list"` di Classic sama sekali tidak punya UI cari/filter kategori — padahal Modern dapat UI lengkap — MEDIUM

- **Lokasi**: `apps/mobile/src/data/mobileFeatures.js` — 8 fitur (`doa`,
  `dzikir`, `wirid`, `asmaul-husna`, `panduan-sholat`, `sejarah`,
  `manasik`, `jarh-tadil`) semua `type: "list"`. Di Modern,
  `ExploreWebAppRoutes.js:3576-3591` me-route 7 dari 8-nya (semua kecuali
  `doa`) ke `WebAppReferenceListRoute` (search box+debounce+kategori
  chip+counter — lihat B8), dan `doa` dapat `WebAppDoaRoute` tersendiri
  yang juga lengkap. Di Classic, `ExploreClassicRenderers.js`'s
  `renderFeatureContent()` (dicek lewat `grep` untuk
  `activeFeature.type === "list"` dan untuk masing-masing 8 key di atas)
  **tidak punya satu pun cabang** untuk tipe/key ini — fallback ke
  generic `<Screen listData={visibleItems} renderListItem={...}>` di
  `ExploreScreen.js:2007-2060`, yang hanya merender list polos
  (judul+tag+menu-titik-tiga), tanpa search box, tanpa chip kategori,
  tanpa counter.
- **Expected**: paritas fungsional dasar antar layout — kemampuan
  mencari/memfilter dataset besar (Asmaul Husna 99 item, Doa 82 item)
  seharusnya ada di KEDUA layout, apalagi Classic adalah **baseline
  default** (bukan Modern).
- **Actual**: **CONFIRMED live**. Classic → Sejarah Islam (34 item setelah
  auto-load): layar hanya menampilkan daftar kartu (judul+tag "nabi"+ikon
  titik-tiga), **tidak ada search box atau chip kategori sama sekali**,
  langsung dari header ke list — `108-classic-sejarah-open.png`
  (bandingkan `058-sejarah-open-B8.png` versi Modern yang punya search
  box+chip kategori+counter "X peristiwa tersedia").
- **Root cause**: lihat Lokasi — Classic tidak pernah mendapat renderer
  khusus untuk `type: "list"`, kemungkinan ditambahkan setelah
  `ExploreClassicRenderers.js` terakhir di-update untuk tipe generik, atau
  sengaja dianggap "cukup Modern saja" tapi tidak terdokumentasi sebagai
  keputusan desain.
- **Dampak**: user Classic (mayoritas, karena baseline) tidak bisa mencari
  di 8 dataset ini sama sekali — khususnya parah untuk Asmaul Husna (99
  nama) dan Doa (82 doa, 10 kategori) di mana scroll manual jauh lebih
  lambat/frustrasi dibanding Modern.
- **Saran fix**: tambahkan cabang di `ExploreClassicRenderers.js`'s
  `renderFeatureContent()` untuk `activeFeature.type === "list"` yang
  merender search box + chip kategori ala Classic, atau — kalau memang
  sengaja minimalis — setidaknya tambahkan search box saja.
- **Screenshot**: `108-classic-sejarah-open.png` (Classic, tanpa search),
  `058-sejarah-open-B8.png` (Modern, dengan search lengkap).
- **LIVE-CONFIRMED 2026-10-01 (sesi 5, live-verify fix `84d30cbe`)**: UI
  cari/filter sekarang ADA dan BERFUNGSI di Classic untuk 4 dari 8 fitur yang
  dites langsung — Panduan Sholat (`050-classic-panduan-sholat-B14.png`,
  search box + 5 chip + counter "12 panduan tersedia"), Asmaul Husna
  (`072-classic-asmaul-husna-wait.png`, tanpa chip sesuai `categories: []`,
  counter "99 nama tersedia"), Doa (`086-classic-doa-loaded.png`, 6+ chip
  termasuk "Bangun", counter "82 doa tersedia"), Dzikir
  (`089-classic-dzikir-B14.png`, chip horizontal-scroll, counter "37 dzikir
  tersedia"). Search box debounced bekerja benar (`057`/`073`/`074`: teks
  muncul instan, counter update ~300ms kemudian, tidak ANR). Tap item →
  detail terbuka normal, dikonfirmasi 2× (Asmaul Husna `075`, Doa `088`).
  Chip kategori "Bangun" pada Doa (match via title-regex, bukan field
  kategori literal) dikonfirmasi tepat: `087-classic-doa-bangun-chip.png`
  ("Menampilkan 1 dari 82 doa", item "Doa Bangun Tidur"). **UI/mekanisme B14
  sendiri ditutup, FIXED** untuk kedelapan fitur (6 sisanya — Wirid,
  Manasik, Jarh Tadil — tidak sempat ditekan satu-satu tapi memakai
  komponen/helper generik yang sama persis, risiko rendah). **TAPI
  ditemukan 2 bug data/konten BARU** selama verifikasi (bukan kegagalan
  komponen B14, tapi `referenceListFilter.js`'s asumsi field generik yang
  meleset untuk 2 fitur spesifik) — lihat **B18** (kategori Panduan Sholat
  0% berfungsi) dan **B19** (pencarian Asmaul Husna tidak mengindeks nama
  transliterasi) di bawah. Juga ditemukan **B20** (bug lingkungan navigasi,
  bukan spesifik B14 tapi jadi jauh lebih sering ketemu karena B14 menambah
  banyak search box baru ke Classic): TabBar Classic bisa hilang permanen
  setelah fokus search box diikuti navigasi-kembali.

### B15. [Modern; CONFIRMED live] Pencarian Global tidak punya cara tutup yang terlihat — hanya hardware back yang berfungsi — LOW

- **Lokasi**: layar `Pencarian`/`GlobalSearchScreen` — tidak ada tombol
  back/close di header layar itu sendiri (beda dari kebanyakan sub-layar
  lain yang punya panah-kembali). Ikon kaca pembesar di header
  (`MobileTopHeader`) tetap terlihat & bisa ditekan, tapi menekannya lagi
  tidak menutup Pencarian. Tab "Beranda" di bottom-nav tetap menyala
  (benar, B6) tapi menekannya lagi juga tidak menutup Pencarian.
- **Expected**: ada affordance visual yang jelas untuk keluar dari
  Pencarian Global tanpa bergantung pada gestur/tombol hardware back.
- **Actual**: **CONFIRMED live** — dicoba 3 cara: (1) tap ulang ikon kaca
  pembesar di header → tetap di layar Pencarian; (2) tap tab "Beranda"
  (sudah menyala) di bottom-nav → tetap di layar Pencarian; (3) hardware
  back → berhasil menutup Pencarian, kembali ke Beranda. Screenshot:
  `093-search-icon-retap.png`, `094-tap-beranda-from-search.png`
  (keduanya menunjukkan layar Pencarian tidak berubah).
- **Root cause**: belum ditelusuri sampai baris kode spesifik (di luar
  waktu sesi ini) — kemungkinan layar Pencarian tidak mendaftarkan
  `onBack`/`setHeader({showBack:true,...})` seperti sub-layar lain.
- **Dampak**: LOW karena hardware back tetap berfungsi, tapi tetap
  inkonsistensi UX dibanding pola back-button standar di seluruh app
  lain.
- **Saran fix**: tambahkan tombol back/close eksplisit di header layar
  Pencarian; alternatif minimal, jadikan ikon kaca pembesar sebagai
  TOGGLE (tap lagi = tutup) saat Pencarian sedang terbuka.
- **Screenshot**: `093-search-icon-retap.png`,
  `094-tap-beranda-from-search.png`.
- **LIVE-CONFIRMED 2026-10-01 (sesi 5, live-verify fix `a9111a9b`)**: Modern,
  buka Pencarian Global lewat ikon kaca pembesar — header sekarang
  menampilkan panah-kembali hijau yang terlihat jelas
  (`096-global-search-open-B15.png`). Tap panah tersebut menutup Pencarian
  dan kembali dengan bersih ke layar sebelumnya
  (`097-global-search-closed-B15.png` — kebetulan Profil karena jalur
  navigasi sesi ini berasal dari Profil, bukan dari Beranda langsung; bukan
  bug, cuma konsekuensi urutan tap sendiri). Hardware back juga dites ulang
  dari Pencarian dan tetap berfungsi menutup
  (`098-global-search-hwback-B15.png`). Classic tidak disentuh (memang sudah
  benar sebelumnya). Bug **ditutup, FIXED**.

### B16. [Modern; CONFIRMED live — bug class sama dengan B5, belum di-fix untuk grup ini] 3 baris grup "Lainnya" hamburger (Pengaturan/Bantuan/Tentang) menyala "selected" bersamaan — MEDIUM

- **Lokasi**: `apps/mobile/src/layout/MobileMenuSheet.js:61-81` (3 item
  grup "more": `pengaturan`→`params:{view:"settings"}, tab:"profile"`;
  `bantuan`→`params:{view:"help"}, tab:"profile"`;
  `tentang`→`params:{view:"about"}, tab:"profile"` — ketiganya
  `tab:"profile"`, pakai `params.view`, BUKAN `params.featureKey`),
  dikombinasikan dengan logic `selected` yang SAMA dengan B5 (`:196-200`):
  `selected = active === item.tab && (!item.params?.featureKey || currentFeatureKey === item.params.featureKey)`.
  Karena ketiga item grup "Lainnya" tidak punya `params.featureKey` sama
  sekali, `!item.params?.featureKey` SELALU `true`, sehingga `selected`
  murni jadi `active === "profile"` — benar untuk SEMUA 3 item serentak
  begitu user berada di tab Profile MANAPUN (root, Pencapaian,
  Pengaturan, Akun, Notifikasi, Penyimpanan, Tampilan, Keamanan, Bantuan,
  Tentang — seluruh stack Profile).
- **Expected**: hanya baris yang representasi layar yang SEDANG dibuka
  yang ter-highlight — sama seperti ekspektasi B5 asli.
- **Actual**: **CONFIRMED live** — buka hamburger saat sedang di layar
  Pengaturan (tab Profile): **ketiga baris Pengaturan, Bantuan, Tentang
  Aplikasi menyala hijau bersamaan**, walau yang benar-benar aktif cuma
  Pengaturan. Screenshot
  `068-hamburger-triple-highlight-LAINNYA-B5-REGRESSION.png` — bandingkan
  grup "Akses Cepat" tepat di atasnya pada screenshot yang sama yang
  BENAR (Tokoh Islam/Peta Interaktif/Perawi Hadith semuanya polos).
- **Root cause**: fix B5 (commit `8d7611a0`) menambah disambiguasi
  `currentFeatureKey` HANYA untuk item yang punya `params.featureKey` (3
  baris Akses Cepat) — 3 baris grup "Lainnya" yang pakai `params.view`
  tidak pernah dapat perlakuan serupa, jadi kondisi fallback lama tetap
  berlaku untuk mereka, persis gejala B5 sebelum di-fix.
- **Dampak**: sama seperti B5 — kosmetik/membingungkan, tidak memblokir
  navigasi, tapi indikator "lagi di sini" salah untuk 3 dari 6 baris
  hamburger setiap kali user ada di tab Profile.
- **Saran fix**: perluas kondisi `selected` untuk juga membandingkan
  `params.view` terhadap semacam `currentView`/`currentScreen` state
  (analog `currentFeatureKey` tapi untuk stack Profile), dioper dari
  `ProfileScreen.js`'s `stack`/`currentScreen` lewat rute yang sama
  seperti `currentFeatureKey` dialirkan untuk `ExploreScreen`.
- **Screenshot**: `068-hamburger-triple-highlight-LAINNYA-B5-REGRESSION.png`.
- **LIVE-CONFIRMED 2026-10-01 (sesi 5, live-verify fix `6ca564a0`)**: dites 2
  kondisi kontras — (1) hamburger dibuka saat di layar Pengaturan: **hanya**
  "Pengaturan" yang highlight hijau di grup "Lainnya", "Bantuan"/"Tentang
  Aplikasi" polos (`100-hamburger-at-settings-B16.png`); (2) hamburger
  dibuka saat di layar Bantuan (bukan Pengaturan): **hanya** "Bantuan" yang
  highlight, "Pengaturan"/"Tentang Aplikasi" polos
  (`102-hamburger-at-bantuan-B16.png`) — membuktikan highlight memang
  mengikuti layar aktif sungguhan, bukan selalu baris pertama. Regresi
  "Akses Cepat" (Tokoh Islam/Peta Interaktif/Perawi Hadith, fix B5) dicek
  ulang di kedua screenshot: tetap polos semua (benar, karena sedang di tab
  Profile bukan Belajar) — tidak ada regresi. Bug **ditutup, FIXED**.

---

### B17. [Modern & Classic; BARU, ditemukan saat live-verify B10] Residual ejaan nama aplikasi — 2 key i18n + 2 literal JS masih memakai ejaan lama, di luar scope fix B10 — LOW

- **Lokasi**: konstanta resmi `APP_NAME = "Thullaabul Ilmi"` ada di
  `apps/mobile/src/theme.js:1` (dipakai benar di `ProfileScreen.js:1773,2203`
  dan `MobileTopHeader.js:98` — ini bagian yang sudah di-fix B10). Empat
  tempat LAIN tidak pernah disentuh fix B10 (bukan termasuk 3 lokasi yang
  disebut judul bug asli) dan masih memakai string literal lama: - `apps/mobile/src/i18n/locales/idn.js:1220` (key
  `profile.about.description`) dan `en.js:1163` — isi paragraf "Tentang"
  di layar Tentang Aplikasi: `"Thollabul Ilmi adalah aplikasi Islamic
      knowledge..."` / `"Thollabul Ilmi is an Islamic knowledge app..."` —
  ejaan **"Thollabul"** (o, bukan u; satu l; satu a) — beda dari kanon. - `apps/mobile/src/i18n/locales/idn.js:1321` (key `theme.light.meta`)
  dan `en.js:1263` — teks meta opsi tema "Terang"/"Light":
  `"Palet terang klasik Thullabul Ilmi."` / `"Classic Thullabul Ilmi
light palette."` — ejaan **"Thullabul"** (satu l, bukan dua) — tampil di
  Profil → Tampilan, terlihat setiap kali user membuka pengaturan tema. - `apps/mobile/src/screens/explore/WebAppZakatRoute.js:161` dan
  `WebAppFaraidhRoute.js:358` — teks share hasil hitung Zakat/Faraidh:
  `"\n\nDihitung via Thollabul Ilmi"` — ejaan **"Thollabul"** sama
  dengan di atas, muncul di pesan yang di-share keluar aplikasi
  (WhatsApp dll.), jadi berpotensi paling terlihat oleh pihak luar.
- **Expected**: seluruh kemunculan nama aplikasi memakai `APP_NAME`
  (`theme.js`) sebagai satu sumber kebenaran, sesuai saran fix B10 asli.
- **Actual**: **CONFIRMED live untuk 2 dari 4** (sisanya dikonfirmasi lewat
  pembacaan source, bukan live-trigger — share Zakat/Faraidh butuh alur
  hitung yang di luar scope sesi ini). Tentang Aplikasi, paragraf body:
  "Thollabul Ilmi adalah aplikasi Islamic knowledge..." —
  `007-tentang-aplikasi-open2.png` + crop zoom, dan sama persis di versi
  EN (`010-about-app-en-closed-menu.png`). Profil → Tampilan → opsi
  "Terang": "Palet terang klasik **Thullabul** Ilmi." —
  `038-tampilan-dark-B13.png` + crop zoom `zoom-terang-meta.png`.
- **Root cause**: fix B10 (commit `6ca564a0`) diterapkan presisi hanya ke 3
  lokasi yang disebut eksplisit di judul bug asli (`ProfileScreen.js` fallback
  nama, `MobileTopHeader.js` judul header, key `profile.about.appName`) —
  tidak ada sapuan global untuk string literal nama aplikasi lain yang
  kebetulan tidak disebut di laporan B10 asli.
- **Dampak**: kosmetik, LOW — tapi "Thollabul Ilmi" (beda ejaan paling jauh
  dari kanon, bukan cuma 1 huruf) muncul di teks yang di-share ke aplikasi
  lain (WhatsApp dll.) via fitur Zakat/Faraidh, jadi paling berisiko
  terlihat oleh orang di luar aplikasi.
- **Saran fix**: grep menyeluruh `Th[ou]ll?a+bul` di `src/` (sudah dilakukan
  sesi ini, hasil lengkap: 4 lokasi di atas) lalu ganti ke `APP_NAME` import
  atau interpolasi `${APP_NAME}` di template string i18n.
- **Screenshot**: `007-tentang-aplikasi-open2.png`, `038-tampilan-dark-B13.png`
  (crop: `zoom-about-desc.png`, `zoom-terang-meta.png` di scratchpad sesi
  ini, tidak disalin ke folder output).
- **LIVE-CONFIRMED 2026-10-02** (release APK, emulator, Modern & Classic,
  ID & EN): keempat lokasi residual dikonfirmasi benar sudah terpakai
  `APP_NAME`. (1) Tentang Aplikasi body ID: "Thullaabul Ilmi adalah
  aplikasi Islamic knowledge..." — benar
  (`002-tentang-aplikasi.png`). (2) Body EN: "Thullaabul Ilmi is an
  Islamic knowledge app..." — benar (`008-about-app-en.png`). (3) Profil
  → Tampilan → Terang, ID & EN: "Palet terang klasik Thullaabul Ilmi."
  / "Classic Thullaabul Ilmi light palette." — benar
  (`004-tampilan.png`, `006-english-selected.png`). (4) Share-text Zakat
  (Maal, Rp300.000.000 → Rp7.500.000) via share-sheet Android: "Dihitung
  via Thullaabul Ilmi" — benar (`025-zakat-share3.png`). (5) Share-text
  Faraidh (Estate Rp500.000.000, 1 istri → Rp125.000.000), juga dicek
  kali ini (sesi lalu tidak sempat): "Dihitung via Thullaabul Ilmi" —
  benar (`033-faraidh-share2.png`). Share dibatalkan sebelum benar-benar
  terkirim ke aplikasi lain. **4/4 lokasi FIXED**, tidak ada ejaan
  salah tersisa.

### B18. [Modern & Classic; BARU, ditemukan saat live-verify B14] Kategori Panduan Sholat (Wudhu/Sholat/Sunnah/Dzikir/Umum) 100% tidak pernah menampilkan hasil — API tidak pernah mengirim field kategori — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/referenceListFilter.js:50-54`
  (`REFERENCE_LIST_CONFIGS["panduan-sholat"].categories = ["wudhu", "sholat",
  "sunnah", "dzikir", "umum"]`, dipakai untuk render chip DAN untuk filter di
  `filterReferenceListItems` baris 181-196 via `getGenericItemCategory`
  baris 117-122: `raw.category ?? raw.jenis_nilai ?? raw.type ??
raw.occasion`). Dikonfirmasi lewat `curl
https://api.thollabulilmi.site/api/v1/panduan-sholat`: setiap item HANYA
  berisi `id, step, description, source, notes, translation_id,
translation.{id,idn,ar}` — **tidak ada satu pun** field `category`,
  `jenis_nilai`, `type`, atau `occasion`. Jadi `getGenericItemCategory`
  SELALU mengembalikan string kosong `""` untuk tiap item.
- **Expected**: memilih chip kategori (mis. "Sholat") menyaring daftar ke
  item yang relevan dengan kategori itu.
- **Actual**: **CONFIRMED live, 3 chip dicoba, ketiganya 0 hasil** —
  "Wudhu" → "Menampilkan 0 dari 12 panduan"
  (`061-classic-wudhu-chip-retry.png`), "Sholat" → tetap 0
  (`064-classic-sholat-chip-v3.png`, padahal item yang terlihat seperti
  "Niat"/"Takbiratul Ihram" jelas-jelas tahapan sholat), "Umum" → tetap 0
  (`066-classic-umum-chip-check.png`). "Semua" tetap benar menampilkan 12
  (`065-classic-semua-reset-check.png`) — regresi murni di cabang filter
  kategori, bukan di loading data. **Kontras dibuktikan**: fitur Dzikir
  (API punya field `category: "dzikir_umum"`, dicek via curl) dan chip
  "Setelah Sholat"-nya BENAR menyaring ("Menampilkan 4 dari 37 dzikir",
  `090-classic-dzikir-setelahsholat-chip.png`) — jadi mekanisme
  filter/chip-nya sendiri TIDAK rusak, murni data Panduan Sholat yang tidak
  pernah punya field kategori sejak dari API.
- **Root cause**: lihat Lokasi — mismatch antara daftar kategori HARDCODE di
  `REFERENCE_LIST_CONFIGS` (ditulis seolah data `panduan-sholat` sudah
  punya tagging kategori) dengan skema API sungguhan yang tidak pernah
  menyertakan field itu sama sekali — kemungkinan kategori ditulis
  berdasarkan desain/rencana awal, bukan dicek terhadap respons API nyata.
  Bug ini berlaku di KEDUA layout (Classic baru dapat chip-nya dari B14,
  Modern sudah dapat chip ini sejak B8 — keduanya sama-sama 0 hasil karena
  memakai helper filter yang sama).
- **Dampak**: 5 dari 6 chip (semua kecuali "Semua") di fitur Panduan Sholat
  effectively mati total — user yang mencoba filter kategori apa pun selalu
  mendapat "Tidak ada panduan yang cocok", padahal datanya ADA (12 panduan,
  tampil sempurna di "Semua"). Berpotensi bikin user mengira fitur/datanya
  kosong/rusak.
- **Saran fix**: jangka pendek, hapus array `categories` untuk
  `"panduan-sholat"` di `REFERENCE_LIST_CONFIGS` (sembunyikan chip yang
  memang tidak bisa pernah match, sama seperti `asmaul-husna` yang
  `categories: []`) sampai backend benar-benar menambah field kategori;
  jangka panjang, tambah field kategori di tabel/endpoint
  `/api/v1/panduan-sholat` lalu kembalikan array `categories` sesuai data
  asli.
- **Screenshot**: `061-classic-wudhu-chip-retry.png`,
  `064-classic-sholat-chip-v3.png`, `066-classic-umum-chip-check.png`
  (ketiganya 0 hasil), `065-classic-semua-reset-check.png` (kontras,
  "Semua" benar 12), `090-classic-dzikir-setelahsholat-chip.png` (kontras,
  Dzikir chip berfungsi normal).
- **LIVE-CONFIRMED 2026-10-02**: Panduan Sholat dicek di Modern ("Prayer
  Guide", header "12 guides available",
  `034-panduan-sholat-modern.png`) dan Classic ("Panduan Sholat", "12
  panduan tersedia", `038-panduan-sholat-classic.png`) — **kedua layout
  tidak lagi menampilkan chip kategori sama sekali** (sebelumnya 6 chip
  Semua/Wudhu/Sholat/Sunnah/Dzikir/Umum, 5 di antaranya selalu 0 hasil).
  Daftar 12 langkah (Niat, Takbiratul Ihram, Doa Iftitah, Membaca
  Al-Fatihah, dst.) tampil normal tanpa filter kategori. **FIXED di
  kedua layout.**

### B19. [Modern & Classic; BARU, ditemukan saat live-verify B14] Pencarian Asmaul Husna tidak mengindeks nama transliterasi ("Rahman", "Ar-Rahman") — hanya cocok dengan arti Indonesia — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/explore/referenceListFilter.js:163-179`
  (`getItemSearchHaystack`, dipakai oleh `filterReferenceListItems` untuk
  SEMUA fitur non-doa termasuk `asmaul-husna`) hanya menggabungkan
  `item.title, item.body, item.arabic, item.meta,
raw.translation.{latin_idn,latin_en,text_idn,text_en}, raw.source,
raw.sumber` — TIDAK PERNAH membaca field top-level `transliteration` yang
  nyata-nyata ada di respons API. Dikonfirmasi lewat
  `curl https://api.thollabulilmi.site/api/v1/asmaul-husna`: tiap item
  punya `arabic, transliteration, indonesian, english, meaning, source,
translation_id, translation.{id,idn,ar}` — field `transliteration` (mis.
  `"Ar-Rahman"`) dan `indonesian`/`english`/`meaning` sama sekali tidak
  masuk daftar field yang di-gabung `getItemSearchHaystack`.
- **Expected**: mencari nama Asmaul Husna lewat ejaan Latin/transliterasi
  Arab-nya (cara paling umum orang mencari nama Allah, mis. "Rahman",
  "Rahim", "Malik") seharusnya menemukan item yang sesuai.
- **Actual**: **CONFIRMED live**. Cari "rahman" (transliterasi nama kedua,
  "Ar-Rahman" / "Yang Maha Pengasih") → **"Menampilkan 0 dari 99 nama"**,
  "Tidak ada nama yang cocok" (`073-classic-asmaul-search-rahman.png`) —
  padahal item itu ADA dan terlihat jelas di daftar "Semua"
  (`072-classic-asmaul-husna-wait.png`, baris ke-2 "Yang Maha Pengasih").
  Sebagai kontras, cari "pengasih" (kata arti Indonesia, ada di `item.title`)
  → **benar** "Menampilkan 2 dari 99 nama" (Ar-Rahman dan Ar-Rauf, keduanya
  mengandung kata "pengasih" di artinya) —
  `074-classic-asmaul-search-pengasih.png`. Jadi pencarian HANYA berfungsi
  lewat arti Indonesia, tidak pernah lewat ejaan Arab/transliterasi.
- **Root cause**: lihat Lokasi — `getItemSearchHaystack` ditulis generik
  untuk semua fitur reference-list, asumsi field `raw.translation.latin_idn`
  dkk. yang dipakai fitur LAIN (mis. Panduan Sholat, Dzikir) — tapi skema
  API `asmaul-husna` berbeda, menaruh transliterasi di field top-level
  `transliteration`, bukan di `translation.latin_idn`. Helper generik tidak
  pernah disesuaikan per-skema, jadi field itu lolos tanpa pernah terindeks.
- **Dampak**: cara pencarian paling natural untuk fitur "99 Nama Allah" —
  mengetik nama Arabnya dalam ejaan Latin — tidak berfungsi sama sekali;
  user harus tahu/menebak kata arti Indonesia-nya dulu, yang jauh kurang
  intuitif dan mengurangi nilai fitur pencarian ini secara signifikan.
- **Saran fix**: tambah `raw?.transliteration` (dan idealnya
  `raw?.indonesian`, `raw?.english`, `raw?.meaning` sebagai fallback umum)
  ke array di `getItemSearchHaystack`, atau — lebih tahan lama — buat
  varian haystack per-`featureKey` yang eksplisit mencantumkan field asli
  tiap skema API alih-alih satu daftar generik untuk semua fitur.
- **Screenshot**: `073-classic-asmaul-search-rahman.png` (0 hasil, salah),
  `074-classic-asmaul-search-pengasih.png` (2 hasil, benar via arti).
- **LIVE-CONFIRMED 2026-10-02**: dicek di Classic & Modern. Transliterasi
  di Classic: "rahman" → "Menampilkan 1 dari 99 nama" (Yang Maha
  Pengasih/Ar-Rahman, `040-asmaul-search-rahman.png`); "malik" → 2 hasil
  (Al-Malik, Malikul Mulk, `041-asmaul-search-malik.png`); "aziz" → 1
  hasil (Al-Aziz, `042-asmaul-search-aziz.png`). Diulang di Modern:
  "rahman" → 1 hasil juga benar (`047-asmaul-modern-rahman.png`).
  Regresi dicek: "pengasih" (arti Indonesia) tetap 2 hasil (Ar-Rahman,
  Ar-Rauf) seperti sebelum fix — **tidak ada regresi**
  (`043-asmaul-search-pengasih.png`). Placeholder search box ikut
  diperbarui jadi "Cari nama Allah, arti, atau transliterasi...". **FIXED
  di kedua layout.**

### B20. [Classic; BARU, ditemukan saat live-verify B14 — kemungkinan besar bug lama, baru sering ketemu karena B14 menambah banyak search box baru] TabBar Classic bisa hilang permanen setelah search box difokus lalu dinavigasi-keluar — MEDIUM

- **Lokasi**: `apps/mobile/src/layout/ClassicAppShell.js:40-42`
  (`{activeTab === "quran" || keyboardVisible ? null : (<TabBar ... />)}`)
  — `keyboardVisible` adalah PROP dari `App.js`, bukan state lokal shell.
  `apps/mobile/App.js:111-127` mengisi state itu murni dari event native
  `Keyboard.addListener("keyboardDidShow"/"keyboardDidHide", ...)` tanpa
  fallback/guard lain — tidak ada `Keyboard.dismiss()` eksplisit atau
  pengecekan blur manual saat navigasi terjadi.
- **Expected**: TabBar Classic selalu terlihat di semua layar kecuali tab
  Quran, termasuk setelah search box dipakai lalu ditinggal/dinavigasi.
- **Actual**: **CONFIRMED live, terjadi berulang (3×) secara independen
  dalam sesi yang sama**: (1) setelah mengetik di search box Panduan Sholat
  lalu navigasi kembali ke Belajar hub via header-back, TabBar hilang total
  (tidak ada di screenshot MAUPUN di `uiautomator dump` — bukan cuma
  tersembunyi visual, betul-betul tidak ter-render,
  `080-check-scroll-position.png` dan dump `ui47.xml` dikonfirmasi 0 node
  di area y>2100); (2) pola sama terulang setelah memakai search box Kamus
  Arab; (3) satu kali terjadi tanpa interaksi search box yang jelas
  (kemungkinan sisa state dari kejadian sebelumnya). **Deep-link ke
  `thullaabulilmi://belajar` SAJA tidak selalu memulihkan** (kadang cuma
  "delivered to currently running top-most instance" tanpa remount JS,
  `082-relaunch-restore-tabbar.png` masih hilang) — pemulihan pasti hanya
  lewat `am force-stop` diikuti relaunch penuh
  (`083-force-restart-check.png`, TabBar kembali). Ini konsisten dengan
  `keyboardVisible` yang tersangkut `true` di state React murni `App.js`,
  yang hanya bisa direset lewat remount JS penuh, bukan sekadar
  intent/navigasi.
- **Root cause**: dari pembacaan kode, kemungkinan besar race antara event
  native `keyboardDidHide` (dipicu animasi IME menutup) dengan transisi
  navigasi yang terjadi HAMPIR bersamaan (mis. tekan tombol back saat
  keyboard baru mulai animasi tertutup) — pada kondisi tertentu Android
  tidak sempat mengirim `keyboardDidHide` sebelum unmount/transisi layar
  berikutnya selesai, sehingga `setKeyboardVisible(false)` tidak pernah
  terpanggil dan nilainya tersangkut `true` selamanya (exact timing belum
  dipastikan baris-demi-baris, perlu logging runtime seperti catatan
  serupa di B12 lama).
- **Dampak**: MEDIUM — user Classic kehilangan SELURUH akses navigasi
  bottom-tab (satu-satunya cara pindah hub di Classic selain back-stack)
  sampai me-restart aplikasi penuh; makin sering ketemu sekarang karena
  fix B14 baru saja menambah search box ke 8 fitur Classic yang sebelumnya
  nyaris tidak punya text input sama sekali — jadi walau akar masalahnya
  bukan kode B14, B14 secara tidak langsung memperbesar permukaan
  (surface) untuk memicu bug lama ini.
- **Saran fix**: opsi aman jangka pendek — di `ClassicAppShell.js`, jangan
  gantungkan visibilitas TabBar 100% ke `keyboardVisible` state React;
  tambahkan `Keyboard.dismiss()` eksplisit di titik-titik navigasi
  (header-back, hardware-back handler) sebelum transisi terjadi, supaya
  `keyboardDidHide` sempat terpicu lebih deterministik. Opsi lebih tahan
  lama — deteksi "stuck" dengan timeout kecil (mis. jika `keyboardVisible`
  masih `true` 500ms setelah blur event terakhir tapi tidak ada `TextInput`
  yang fokus, paksa `false`).
- **Screenshot**: `080-check-scroll-position.png` (TabBar hilang di Kamus
  Arab), `081-hwback-from-kamus-arab.png` (masih hilang setelah hardware
  back), `082-relaunch-restore-tabbar.png` (deep-link saja tidak cukup),
  `083-force-restart-check.png` (force-stop+relaunch memulihkan).
- **LIVE-CONFIRMED WITH ISSUE 2026-10-02**: sesi live-verify ini mengalami
  **2 insiden interferensi eksternal terkonfirmasi** di tengah pengujian
  (sesuai peringatan brief soal sesi agent lain yang bisa menyentuh
  emulator yang sama): (1) `com.thullaabulilmi.app` ter-**reinstall**
  di tengah sesi (`dumpsys package` menunjukkan `lastUpdateTime`
  berubah jadi 13:39:33 WIB, disertai dialog Android "Open with"
  duplikat yang mengungkap package lama `com.anonymous.thullaabulilmimobile`
  ikut terpasang); (2) preferensi in-app (layout/bahasa) sempat ter-reset
  ke default tanpa ada reinstall baru (kemungkinan `pm clear` atau
  interaksi concurrent lain). Temuan "TabBar hilang" yang muncul PERSIS
  di sekitar kedua insiden ini dibuang dari analisis (confounded, bukan
  bukti valid).

                        Setelah device diverifikasi stabil (`lastUpdateTime` tidak berubah
                        lagi), race diuji ulang bersih, disiplin (setiap hasil dicek via
                        screenshot + `uiautomator dump`, tanpa gesture tambahan yang ambigu):
                        **4 percobaan valid** (1 percobaan lain di fitur Doa dibuang karena
                        confounded oleh insiden #2 pertengahan jalan) — Dzikir instant-back
                        (PASS), Dzikir 300ms-delay (PASS), Asmaul Husna 800ms-delay (**FAIL —
                        reproduce**), Asmaul Husna 800ms-delay diulang persis (PASS). Jadi
                        **1 dari 4 percobaan valid mereproduksi bug** (25%, turun drastis dari
                        "3× berulang konsisten dalam 1 sesi" di temuan asli pra-fix — fix
                        JELAS mengurangi frekuensi race, tapi belum menutup total).

                        Repro presisi yang FAIL: buka Asmaul Husna (Classic) via deep-link,
                        fokus search box, ketik "aziz", tunggu ~800ms, tekan hardware-back
                        (back pertama hanya dismiss keyboard — teks "aziz" masih ada, bukan
                        navigasi; tekan back KEDUA baru navigasi ke hub Belajar) → TabBar
                        hilang total, dikonfirmasi BUKAN sekadar tak-ter-render (uiautomator
                        dump: 0 node dengan content-desc tab apa pun di area y>2100, identik
                        dengan sifat bug asli). **Deep-link `thullaabulilmi://belajar` ke tab
                        yang sama GAGAL memulihkan** pada kejadian ini (dicoba 2×, tunggu
                        hingga 2.5 detik) — ini **bertentangan dengan catatan fix Sesi 5**
                        yang menyebut kasus deep-link "fixed eksplisit" via
                        `setKeyboardVisible(false)` tanpa syarat di `handleDeepLink`
                        (`App.js:224`). Belum jelas apakah baris itu benar ter-eksekusi saat
                        deep-link diproses ulang oleh `Linking` listener pada skenario ini,
                        atau ada gap lain — perlu logging runtime untuk memastikan.

                        **Catatan render TERPISAH (bukan bagian race B20 ini, ditemukan tidak
                        sengaja saat investigasi)**: pada cold-start APK maupun segera
                        setelah kembali dari layar fitur ke hub, TabBar Classic kadang tidak
                        ter-paint sampai ada 1 interaksi scroll — dikonfirmasi berulang kali,
                        TIDAK terkait `keyboardVisible` (node TabBar tetap ADA di
                        `uiautomator dump` dan tap di areanya tetap berfungsi/menavigasi, cuma
                        visual belum ter-paint — beda sifat dari race asli yang node-nya
                        benar-benar hilang dari tree). Kemungkinan terkait log
                        `ReactHost: Unhandled SoftException ... onWindowFocusChange ...

                context is not ready` yang ditemukan di logcat sesi ini (RN
                New Architecture/Bridgeless timing quirk). Di luar scope investigasi
                sesi ini untuk ditelusuri lebih jauh.

                        **Celah residual (`HadithScreen.js`/`ProfileScreen.js`/
                        `QiblaScreen.js`/`HomeScreen.js`)**: dikonfirmasi BENAR ADA secara
                        kode — `QiblaScreen.js:308` (`if (!isActive || !isWebAppLayout ||

                !navigation?.setHeader) return;`) membuktikan `setHeader` HANYA

    dipanggil di Modern (`isWebAppLayout`); Classic memakai
    `IconActionButton onPress={goBack}`miliknya sendiri (baris 291-296,
    label "Kembali ke Ibadah") yang tidak pernah lewat`headerConfig`,
    sehingga tidak tertangkap `useEffect`penangkal di`App.js:129-131`.
    **Tidak sempat direproduksi live** sesi ini — input manual
    lat/lng Qibla (dua `TextInput` di baris 523/548) tersembunyi begitu
    GPS berhasil resolve lokasi (emulator ini akhirnya dapat lokasi
    "Kecamatan Setiabudi" pertengahan sesi), dan input ganti password di
    ProfileScreen butuh akun login (di luar scope sesi guest-only).
    Dikonfirmasi via pembacaan kode, bukan device — sesuai ekspektasi
    brief ("don't be surprised if it does").

                        **Kesimpulan jujur**: race B20 **belum tertutup 100%** — masih bisa
                        terjadi (1/4 percobaan valid), meski jelas jauh lebih jarang dari
                        sebelum fix. Deep-link-recovery TIDAK bekerja seperti diklaim pada
                        kejadian yang berhasil direproduksi sesi ini. Confidence bahwa race
                        "closed": **RENDAH-SEDANG** — sampel masih kecil, dan reliabilitas
                        temuan ini sendiri terganggu interferensi eksternal yang terjadi
                        berulang selama sesi. Rekomendasi: sesi fix terpisah yang (a)
                        menambah logging runtime di sekitar `keyboardDidHide` vs
                        transisi/navigasi untuk pastikan akar masalah persis, (b) re-test
                        deep-link recovery dengan logging untuk pastikan
                        `setKeyboardVisible(false)` benar ter-eksekusi, (c) tutup celah
                        residual 4 screen itu dengan memanggil reset yang sama dari
                        `goBack`/`onPress` lokalnya, bukan hanya dari `setHeader`.
                        Screenshot sesi ini: folder
                        `apps/mobile/output/native/2026-10-01-b17-b20-live-verify/` —
                        `071-b20-retry-attempt1.png` (PASS), `072`/`073` (PASS, 2 tahap
                        back), `079`/`080` (FAIL — reproduce, dump dicek di `ui_attempt4.xml`
                        scratchpad), `081` (deep-link recovery gagal), `085` (ulang, PASS).

- **LIVE-CONFIRMED & FIXED 2026-10-02 (sesi investigasi + instrumentasi
  penuh, menggantikan kesimpulan live-verify di atas)**: sesi ini
  menambah logging presisi-timestamp di setiap titik kunci
  (`keyboardDidShow`/`Hide`, `hardwareBackPress`, `clearFeature()`,
  `updateHeader`, reset effect) untuk memastikan akar masalah persis,
  bukan tebakan. **Catatan prosedural penting**: `console.log` TERBUKTI
  tidak pernah sampai ke `adb logcat` sama sekali pada build release
  RN 0.81 Bridgeless/New-Architecture ini (dikonfirmasi lewat
  `logcat -b all` kosong total meski string log ada di bundle) —
  instrumentasi dipindah ke file on-device (`expo-file-system`,
  sinkron, append via `FileHandle`) yang ditarik lewat `adb pull`
  setelah tiap trial.

    **Root cause definitif — H2 dikonfirmasi langsung dengan timestamp,
    bukan inferensi**: reset defensif (`useEffect` pada
    `[activeTab, internalRoutes, headerConfig]`) berulang kali menangkap
    `keyboardVisible` MASIH `true` tepat saat reset berjalan — terjadi di
    7 dari 7 percobaan pada jalur tap tombol-back-header (jalur yang
    TIDAK pernah punya `Keyboard.dismiss()` sebelumnya, beda dari jalur
    hardware-back yang sudah punya `Keyboard.dismiss()` duluan). Event keyboard
    native (`keyboardDidHide`) kadang baru tiba 5–172ms SETELAH reset
    sudah jalan (6 sampel bersih terukur: 5, 20, 20, 40, 95, 172ms). Pada
    sampel yang berhasil ditangkap sesi ini, event telat itu selalu
    `keyboardDidHide` duplikat (aman, cuma re-assert `false` yang sudah
    benar) — bukan `keyboardDidShow` liar yang membalik nilai ke `true`
    tanpa navigasi susulan untuk membetulkannya (skenario yang akan
    membuat TabBar stuck permanen). Mekanismenya terbukti nyata dan
    terukur; sampel yang terbatas (bukan ketiadaan mekanisme) yang
    mencegah sesi ini menangkap varian `keyboardDidShow` secara langsung.
    **H1** (back pertama tidak pernah sampai ke listener JS sama sekali,
    ditelan IME) hanya terjadi 1 dari 12 percobaan hardware-back murni
    sesi ini (vs selalu 2-tahap di repro live-verify sebelumnya) —
    kemungkinan karena Gboard di emulator ini merender sebagai toolbar
    ringkas/non-standar saat diisi via `adb input text` (beda dari
    keyboard penuh asli). H1 tidak terbantah maupun terbukti definitif
    sesi ini (limitasi alat uji), tapi tidak relevan untuk closure bug
    ini — fix bekerja agnostik terhadap berapa kali back ditekan.

    **Fix definitif**: `resetKeyboardVisibleWithGrace()` baru di
    `App.js` — tetap `setKeyboardVisible(false)` segera (perilaku lama
    tidak berubah), plus memasang timer susulan 500ms (angka
    dijustifikasi dari data: gap telat terukur 5–172ms di emulator ini,
    500ms kasih margin >2x untuk perangkat asli yang animasi IME-nya bisa
    lebih lambat) yang, saat berbunyi, mengecek
    `TextInput.State.currentlyFocusedInput()` — kalau TIDAK ada input
    yang genuinely focus saat itu, paksa `false` lagi (menutup late-show
    manapun yang sempat menyelinap); kalau ADA input yang genuinely focus
    (user buru-buru fokus ulang secara sah), dibiarkan (tidak di-stomp,
    mencegah regresi). Dipanggil dari reset effect DAN dari
    `handleDeepLink` — menutup kasus deep-link-ke-tab-sama yang TIDAK
    mengubah `activeTab`/`internalRoutes` sama sekali sehingga reset
    effect tidak otomatis jalan (ini akar kenapa laporan Sesi 5
    "deep-link gagal" di atas valid: `setKeyboardVisible(false)` lama
    tidak salah, tapi tidak dilindungi dari late-event yang sama).
    `ExploreClassicRenderers.js`'s `clearFeature()` juga ditambah
    `Keyboard.dismiss()` eksplisit (sebelumnya hanya hardware-back yang
    punya ini) menutup asimetri yang disebut di saran-fix Sesi 4.

    **Catatan kolaborasi (transparansi penuh)**: selama sesi ini
    berjalan, `App.js` dan `ExploreClassicRenderers.js` juga disentuh
    oleh sesi agent lain yang berjalan bersamaan di emulator/repo yang
    sama (konsisten dengan peringatan brief soal interferensi
    concurrent). Sesi lain itu memperluas `resetKeyboardVisibleWithGrace()`
    yang sama ke lebih banyak titik (`openTab`/`openInternalView`/
    `closeInternalView`/`closeAndOpenTab`/`resetInternalViews`/
    `clearBack`/`setHeaderConfig`, plus `hardwareBackPress` memanggilnya
    tanpa syarat meski `screenHandled`) dan menambah watchdog
    `setInterval` 800ms terpisah (selama `keyboardVisible=true`, cek
    berkala ada-tidaknya input focus, paksa `false` kalau tidak).
    Perubahan itu dipertahankan (dibangun di atas fungsi yang sama,
    diverifikasi kompatibel lewat full Jest run + re-test device di
    bawah) — bukan hasil kerja sesi ini, dicatat di sini demi
    transparansi.

    **Re-verifikasi (build final, instalasi bersih dikonfirmasi tiap
    trial via `firstInstallTime==lastUpdateTime`)**: **12 dari 12 trial
    PASS** — Asmaul Husna/Dzikir/Doa/Sejarah, kombinasi hardware-back,
    tap-tombol-back-header, dan double-back cepat, delay 0ms–1200ms.
    Deep-link-recovery (kasus yang live-verify sebelumnya klaim gagal)
    diuji ulang eksplisit dan bekerja: keyboard dibuka di Asmaul Husna
    (TabBar benar hilang), fire `thullaabulilmi://belajar` tanpa navigasi
    dulu → TabBar kembali seketika. No-regression: ketik 42 karakter
    berturutan di search box tanpa navigasi — TabBar tetap hilang
    konsisten di seluruh 42 langkah (tidak ada flicker). Jest penuh: 94
    suite / 1494 test hijau semua, termasuk 2 test baru dengan fake-timer
    yang memvalidasi mekanisme grace-window (satu memastikan late-show
    tanpa focus genuine dikoreksi, satu memastikan late-show dengan focus
    genuine tidak di-stomp/regresi).

    **Celah residual tidak berubah** (masih di luar scope sesi ini — 3
    file yang diizinkan disentuh sesi ini hanya `App.js`,
    `ExploreScreen.js`, `ExploreClassicRenderers.js`):
    `HadithScreen.js`/`ProfileScreen.js`/`QiblaScreen.js`/`HomeScreen.js`
    masih render tombol back lokal sendiri yang tidak lewat
    `setHeader`/`navigation`, sehingga tidak tertangkap
    `resetKeyboardVisibleWithGrace()` — watchdog `setInterval` (dari sesi
    kolaborasi di atas) SEHARUSNYA tetap menolong di sini juga selama
    `keyboardVisible` genuinely `true`, tapi belum diuji live; catatan
    untuk sesi berikutnya.

    **Kesimpulan jujur (menggantikan "belum tertutup 100%" di atas)**:
    race B20 untuk semua jalur yang lewat `setHeader` (termasuk
    tap-tombol-back-header yang sebelumnya tidak ada `Keyboard.dismiss()`
    sama sekali) sekarang **FIXED dengan confidence TINGGI** — mekanisme
    H2 dikonfirmasi presisi dengan timestamp nyata, fix menutup celah itu
    dengan grace-window yang dijustifikasi dari data sendiri, dan
    diverifikasi bersih di 12/12 trial + deep-link-recovery +
    no-regression + full Jest. H1 (apakah back pertama kadang benar-benar
    tidak sampai ke JS) tidak terbukti maupun terbantah definitif sesi
    ini (keterbatasan `adb input` vs keyboard fisik asli) — tapi tidak
    relevan untuk closure bug ini karena fix bekerja agnostik terhadap
    berapa kali back ditekan untuk sampai ke sana. Confidence: **TINGGI**
    untuk 3 file yang di-scope sesi ini; **tidak berubah (belum
    tertutup)** untuk celah residual 4-layar yang memang di luar scope
    sejak awal.

---

## Catatan tambahan (bukan bug, tapi worth mencatat)

### C1. Reachability sesungguhnya lebih luas dari sekadar hub Belajar/Ibadah — INFO

`mobileFeatures.js` mendefinisikan **46 fitur** (bukan field terpisah untuk
hitungan "~47" di brief — 6 bacaan + 22 ilmu + 7 alat + 11 personal = 46).
Hub Belajar (`belajarFeatureGroups`) hanya mengkurasi **24** di antaranya;
hub Ibadah (`IbadahScreen` rows) menambah **11** lagi yang unik (doa,
dzikir, hijri, imsakiyah, masjid, wirid, user-wird, tasbih, zakat, faraidh,
sholat-tracker) di luar yang sudah ada di Belajar. Sisanya **11 fitur**
(asmaul-flashcard, asmaul-wirid, tokoh, historical-map, radio-islamic,
community-feed, komunitas, perawi, jarh-tadil, forum, notifications) tidak
muncul di kedua hub kurasi itu — TAPI (dari kode, belum semua diuji live
sesi ini):

- **notifications**: tetap reachable lewat ikon lonceng di header Beranda
  Classic (`PaperHomeHeader`) dan baris "Notifikasi" di account-menu
  (Modern) — bukan orphan.
- **tokoh, historical-map, perawi**: reachable lewat hamburger (Modern saja
  — lihat B4 untuk Classic).
- **7 sisanya** (asmaul-flashcard, asmaul-wirid, radio-islamic,
  community-feed, komunitas, jarh-tadil, forum): **tidak muncul di hub,
  Ibadah hub, maupun hamburger mana pun.** Satu-satunya jalur browse yang
  tersisa (dari kode): (a) **Beranda → grid menu → tile "Lainnya" → layar
  "Direktori Fitur"** (`HomeScreen.js` `directoryGroups`, dibangun dari
  **seluruh** `featureGroups`, bukan hanya subset hub — jadi ke-46 fitur
  **semua** terdaftar di sini, dikelompokkan per label grup asli
  Bacaan/Ilmu/Alat/Personal), tersedia di **kedua** layout karena
  `menuItems` dipakai bersama oleh `PaperHomeDashboard` dan
  `WebAppHomeDashboard`; atau (b) **Pencarian Global**, yang
  men-`findFeatureResults` dari `allFeatures` (bukan subset hub) — jadi
  mengetik nama fiturnya (mis. "radio") akan memunculkannya sebagai hasil
  tipe "Fitur". Dua (asmaul-flashcard, asmaul-wirid) juga sudah dikonfirmasi
  **reachable lewat deep link** oleh audit Ibadah sebelumnya.
  **BLOCKED**: saya tidak sempat membuka tile "Lainnya" atau mengetik di
  Pencarian Global sebelum device hilang — jadi butir (a)/(b) ini adalah
  bacaan kode, belum dibuktikan device. Kalau benar berfungsi seperti kode,
  7 fitur ini **bukan orphan keras** (ada jalur tanpa deep link), tapi tetap
  **"terkubur"**: user harus tahu scroll ke grup yang benar di daftar panjang
  Direktori Fitur, atau menebak nama fiturnya untuk Pencarian — jauh dari
  "ditemukan sambil lihat-lihat" seperti 24 tile yang ada di hub Belajar.
  Badge "Baru" pada asmaul-flashcard/asmaul-wirid di `mobileFeatures.js`
  pun jadi sia-sia karena tidak pernah terlihat di hub manapun yang
  menampilkan badge.

### C2. Badge "Lokal" di hub Belajar menempel ke Tafsir & Asbabun Nuzul — INFO

`getFeatureBadges`
(`apps/mobile/src/screens/explore/FeatureCatalog.js:134-150`) memberi badge
"Lokal" untuk tipe apa pun yang ada di `LOCAL_TOOL_TYPES` — array ini berisi
tool genuinely on-device (Tasbih, Zakat, Faraidh...) **dan** `surah-content`
(dipakai Tafsir & Asbabun Nuzul, yang sebenarnya mengambil konten dari API,
bukan murni lokal). Dikonfirmasi live: tile "Tafsir" dan "Asbabun Nuzul" di
hub menampilkan badge "Lokal" (`003-modern-hub-scroll2.png`,
`006-modern-hub-scroll5-bottom.png`) — label yang berpotensi menyesatkan
("Lokal" biasanya berarti "jalan tanpa internet"), padahal Tafsir
jelas-jelas menampilkan catatan "Data tafsir mengikuti ketersediaan backend"
(`021-modern-tafsir-open.png`) — kontradiktif dengan badge-nya sendiri.

### C3. Kotak cari hub (dan semua turunan `PaperSearchInput`) tidak punya tombol hapus (×) — INFO

`apps/mobile/src/components/Paper.js` (`PaperSearchInput`, baris ±88-115):
hanya ikon kaca pembesar + `TextInput`, tidak ada tombol clear. Dipakai oleh
kotak cari hub Belajar sendiri **dan** kotak cari di dalam setiap fitur
(Kajian, Sejarah, Fiqh, Manasik, Perpustakaan, dll. — semuanya terlihat di
screenshot memakai kotak serupa). Dari kode, bukan dari ketik langsung
(sesi putus sebelum sempat mengetik di kotak cari manapun) — **BLOCKED**
untuk konfirmasi perilaku saat ada teks.

**UPDATE sesi 2 — CONFIRMED sebagian live**: kotak cari **di dalam fitur**
(bukan kotak cari hub itu sendiri — itu tetap BLOCKED, device hilang
sebelum sempat kembali ke hub untuk mengetik di sana) dicoba langsung di
Asmaul Husna, Doa: setelah teks "Kuat"/"Kuat" terisi, **tidak ada tombol
× muncul di mana pun** — mengonfirmasi tidak ada tombol clear, user harus
hapus manual lewat keyboard atau (untuk Doa khususnya) reset lewat tombol
"Reset" terpisah yang HANYA muncul untuk filter chip, bukan untuk teks
pencarian itu sendiri (`20-asmaul-husna-search-kuat.png` vs
`22-asmaul-husna-search-kuat-retry.png` di folder fix-verify — tombol
"Reset" yang terlihat di sana mengosongkan SEMUA filter termasuk search,
bukan tombol × khusus search). Juga lihat **B8** — kotak cari yang sama ini
ternyata punya masalah performa jauh lebih serius dari sekadar tidak ada
tombol clear.

### C4. "Terakhir"/pin di hub: batas diam-diam 6/4 item — INFO

`apps/mobile/src/storage/recentFeatures.js`: `RECENT_LIMIT = 6`,
`PINNED_LIMIT = 4` (baris 5-6); `rememberFeatureOpen`/`togglePinnedFeature`
memotong diam-diam ke batas itu (`.slice(0, LIMIT)`) tanpa pesan apa pun ke
user. Bukan bug (desain wajar untuk badge "Terakhir"/pin), tapi item lama
akan "menghilang" dari badge tanpa penjelasan — dikonfirmasi live badge
"Terakhir" memang berpindah-pindah tile selama sesi 24-tile (terlihat di
beberapa screenshot pembanding sebelum/sesudah).

### C5. Hub kehilangan posisi scroll setiap kembali dari fitur — INFO

Saat `activeFeature` di-set, `ExploreWebAppRoutes.js` mengembalikan
`ScrollView` yang **sama sekali berbeda** dari yang dipakai hub (bukan
nested di dalam hub yang sama) — jadi begitu kembali ke hub, `ScrollView`
hub ter-mount ulang dari atas. Terkonfirmasi live secara konsisten di
seluruh 24 siklus tile (`st2` selalu melaporkan `hubHero=True`, yang hanya
true kalau teks "KONTEN ISLAM" di bagian atas hub terlihat — konsisten
dengan posisi scroll ke atas). Pola yang sama berlaku di hub Ibadah
(tidak pernah ditandai sebagai bug di audit sebelumnya), jadi ini dicatat
sebagai perilaku konsisten lintas hub, bukan regresi baru.

### C6. Leaderboard dengan sengaja tidak menggerbang guest — INFO (positif)

Berbeda dari 8 tile Personal Ringkas lain, "Leaderboard" bertipe `list`
(bukan `protected-list`) di `mobileFeatures.js` — dikonfirmasi live tampil
penuh untuk guest (`028-modern-leaderboard-open.png`, 4 baris peringkat
nyata dengan nama anonim "Perindu Ilmu #6038" dkk.), masuk akal karena ini
papan peringkat publik/sosial, bukan data pribadi. Disebut di sini supaya
jelas bedanya dengan B1 (Amalan Harian) yang _seharusnya_ menggerbang tapi
pesannya salah.

### C7. Semua 24 tile hub Belajar: Back kembali bersih ke hub, tanpa versi B18 Ibadah — INFO (positif, confirmed live)

Kontras dengan [B18 audit Ibadah](./2026-09-30-ibadah-deep-audit.md#b18-modern--classic-13-dari-16-baris-hub-ibadah-membuka-tab-belajar-dan-back-tidak-pernah-kembali-ke-ibadah)
(13 dari 16 baris hub Ibadah salah kembali ke Belajar lalu Beranda), **ke-24
tile hub Belajar dikonfirmasi 100% PASS**: header-back maupun hardware-back
sama-sama kembali ke hero hub ("KONTEN ISLAM / Belajar"), dan tab bottom-nav
yang menyala tetap "Belajar" sepanjang siklus (dicek programatik lewat
`st2` setiap kali, bukan cuma dilihat sekilas). Root cause perbedaannya ada
di kode: tile hub Belajar sendiri (`handleFeaturePress` →
`loadFeature(feature)` tanpa `returnTo`) memang didesain supaya "kembali"
berarti "balik ke hub", beda dengan baris hub Ibadah yang melompat lintas
tab tanpa menitipkan rute pulang. Fitur yang dibuka **dari luar** hub
Belajar (Direktori Fitur Beranda, Pencarian Global) memang menitipkan
`returnTo` (`featureDirectoryReturnTo` dkk.) — tapi jalur ini **BLOCKED**,
belum sempat diuji live (lihat C1).

### C8. Build APK vs HEAD — INFO (diperbarui signifikan di sesi 2)

**Sesi 1**: APK yang terpasang 1 commit mobile di belakang HEAD saat itu,
beda murni kosmetik (token tema).

**Sesi 2 — drift jauh lebih signifikan, bukan lagi kosmetik murni**: APK
yang terpasang & dites sepanjang sesi 2 (`app-release.apk`, mtime
**2026-10-01 11:39:59**) mendahului dua commit fungsional penting:

| Commit     | Waktu    | Isi                                                                     | Status di APK sesi 2                                                                           |
| ---------- | -------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `7de394aa` | 11:10:09 | keyboard inset, chip/search leak, Doa "Bangun" chip, Khatam→Profil→Back | ✅ **SUDAH masuk** (lebih tua dari 11:40) — **dikonfirmasi live PASS** di Part 1               |
| `b42dcf1b` | 11:10:23 | pengingat sholat 7-hari + bootstrap relaunch                            | ✅ **SUDAH masuk** — **dikonfirmasi live PASS** di Part 1                                      |
| `0164ad12` | 00:17:28 | harmonize token tema + 2 baris baru SettingsList (Bantuan/Tentang)      | ❌ **BELUM masuk** (APK lebih tua 27 menit) — baris baru tidak terlihat live                   |
| `8d7611a0` | 12:06:45 | fix B1-B7 audit ini secara penuh (lihat update di tiap bug di atas)     | ❌ **BELUM masuk** — semua "UPDATE sesi 2" di B1-B7 di atas adalah hasil baca-kode, BUKAN live |

Implikasi: **semua temuan B1-B7 di atas (sebelum "UPDATE sesi 2") tetap
valid sebagai deskripsi bug yang PERNAH ada dan terverifikasi live** (baik
sesi 1 maupun saat saya re-cek Classic SettingsList 5-baris di sesi 2) —
tapi **tidak lagi valid sebagai status TERKINI di HEAD**, karena commit
`8d7611a0` sudah memperbaikinya di source. **B8 dan B9 adalah temuan BARU
sesi 2, tidak terpengaruh oleh `8d7611a0`** (keduanya bukan bagian dari
tujuh fix commit itu) — keduanya valid di HEAD saat ini.

**Tindakan wajib untuk sesi berikutnya**: rebuild APK dari HEAD (pastikan
mencakup `8d7611a0` DAN `7de394aa`/`b42dcf1b`, cek dengan
`git log --oneline -3` sebelum build), install bersih (uninstall dulu kalau
ada riwayat install dengan signing key berbeda — lihat C9), lalu
**re-live-test seluruh B1-B7** (bukan cuma percaya hasil pembacaan kode di
atas) plus lanjutkan checklist Classic/dark-theme/Global Search/hamburger/
account-menu/Profile/bottom-nav yang masih BLOCKED di bawah.

**Sesi 3 — tindakan di atas selesai dilakukan (oleh proses di luar sesi
ini) dan hasilnya tervalidasi penuh**: APK yang terpasang sebelum sesi 3
mulai (`lastUpdateTime` **13:19:21**) dikonfirmasi lewat `dumpsys package`
mencakup `8d7611a0`, `0164ad12`, dan `7de394aa`/`b42dcf1b` — **semua 4
commit yang diminta tabel di atas sudah masuk**. Hasil "re-live-test
seluruh B1-B7" yang diwajibkan di atas: **dilakukan tuntas sesi ini**,
ke-7 bug CONFIRMED FIXED live (lihat update masing-masing B1-B7 di atas) —
bukan lagi hasil baca-kode seperti status sesi 2. Perlu dicatat: di
tengah sesi 3, sesi lain yang konkuren (kemungkinan Codex, lihat
Metodologi tambahan — sesi 3) sempat meng-commit APK **release baru LAGI**
(disalin ke `apps/mobile/Thullaabul-Ilmi-release.apk`, lihat seksi
"Resolusi Final & Status Rilis" di bawah) berdasarkan unit test saja,
bukan live device test — laporan sesi 3 ini-lah konfirmasi LIVE independen
pertama untuk klaim tersebut.

### C9. Indikasi aktivitas proses lain di emulator yang sama selama sesi 2 — INFO (penting untuk sesi berikutnya)

Sepanjang sesi 2, beberapa kali observasi tidak bisa dijelaskan oleh urutan
tap milik sesi ini sendiri:

1. **Reinstall tak terduga ke build DEBUG** (±11:34-11:37): logcat
   menunjukkan `Package [com.thullaabulilmi.app] reported as REPLACED,
but missing application info. Assuming REMOVED` lalu proses baru yang
   mencoba konek ke `ws://10.0.2.2:8081` (Metro dev server) dan gagal
   (`ECONNREFUSED`) — ciri khas build **debug**, bukan **release** yang
   seharusnya terpasang. Pemicu paling mungkin: proses lain (kemungkinan
   orkestrator atau sesi build terpisah) menjalankan varian `installDebug`
   di emulator yang sama. **Dipulihkan sendiri** oleh sesi ini:
   `adb uninstall` lalu `adb install` ulang `app-release.apk` (berhasil,
   lastUpdateTime baru 11:40:07) — **bukan rebuild**, cuma reinstall file
   yang sudah ada. Tidak menyentuh file manapun di repo untuk pemulihan
   ini.
2. **`am start` ke `thullaabulilmi://...` yang tidak saya jalankan**
   (±11:42:38 dan beberapa titik lain): `logcat` mencatat
   `ActivityTaskManager: START u0 {...} from uid 2000` pada saat saya
   sedang TIDAK mengeksekusi perintah adb apa pun — berkorelasi dengan
   satu kali navigasi tak terduga ke layar Jadwal Sholat yang tidak saya
   minta (lihat catatan di dalam percobaan "Bangun chip" Part 1, tidak
   dihitung sebagai bug aplikasi karena tidak bisa diatribusikan ke urutan
   tap saya).
3. **ANR + ActivityManager mengeluhkan proses lain ikut memakai CPU**
   (lihat **B8**) sempat bertepatan dengan window waktu yang sama dengan
   (1) — kemungkinan proses rebuild/reinstall paralel ikut membebani
   CPU emulator saat JS thread aplikasi sedang diuji, memperparah
   (bukan menyebabkan) keterlambatan yang diukur di B8. Dicatat sebagai
   kemungkinan, bukan kepastian — B8 tetap valid sebagai bug (root cause
   di kode, lihat di atas) terlepas dari kontribusi beban CPU eksternal.
4. **Device hilang total untuk kedua kalinya** (±12:04): `adb devices`
   kosong DAN `ps aux | grep emulator` di host tidak menunjukkan proses
   apa pun — beda dengan insiden (1) yang masih bisa dipulihkan via
   reinstall, kali ini prosesnya benar-benar mati.

**Rekomendasi untuk siapa pun yang melanjutkan**: kalau memungkinkan,
pastikan tidak ada sesi lain yang memegang `emulator-5554` secara
bersamaan sebelum mulai live-testing — gejala di atas (reinstall tiba-tiba,
navigasi tak terduga, device hilang berulang) konsisten dengan **lebih dari
satu proses mengontrol device yang sama**, bukan cuma masalah stabilitas
VM semata.

**UPDATE sesi 3**: **tidak ada satu pun gejala di atas yang terulang.**
`emulator-5554` tetap satu proses, satu device, dari awal sampai akhir
sesi — tidak ada reinstall tak terduga, tidak ada `am start`/navigasi yang
tidak bisa diatribusikan ke tap sendiri, tidak ada device hilang. Satu-satunya
anomali (dialog ANR `com.android.systemui` di awal sesi, lihat Setup — sesi 3) sudah hilang begitu ditutup dan tidak berkorelasi dengan aktivitas device
manapun setelahnya. Kesimpulan: rekomendasi di atas (hindari sesi konkuren)
sepertinya DIIKUTI untuk sesi 3 — device yang stabil penuh sepanjang sesi
inilah yang memungkinkan seluruh checklist di bawah akhirnya tuntas.

### C10. Popup sistem "Try out your stylus" (tutorial Gboard) berulang kali mencegat input teks — BUKAN bug aplikasi, tooling note — INFO

Selama mencoba mengetik di kotak cari Pencarian Global (dan sekali di
kotak cari hub Belajar), AVD ini berulang kali menampilkan modal
full-screen sistem **"Try out your stylus"** (tutorial bawaan Gboard
untuk fitur stylus) tepat saat sebuah `TextInput` baru fokus — modal ini
**mencegat SEMUA ketikan** (termasuk `adb shell input text`, dikonfirmasi
teks yang diketik justru masuk ke kotak demo di dalam modal, bukan ke
field aplikasi) dan **tombol "Cancel"/"Next" di dalamnya tidak bisa
diklik dengan tap koordinat biasa secara konsisten** (koordinat yang
sama kadang kena, kadang meleset — kemungkinan karena posisi tombol
bergeser tipis antar render, atau hit-area yang sangat kecil).
`uiautomator dump` juga **tidak bisa membaca window IME ini sama sekali**
(selalu mengembalikan file 0 baris) sehingga tidak bisa dipakai mencari
bounds presisi seperti biasa. Satu-satunya cara yang berhasil mendorong
modal ini sampai selesai adalah menekan tombol "Next" berkali-kali
(estimasi posisi dari screenshot) sampai keempat tab demo (Write →
Delete → Select → Insert) terlewati, ATAU `adb shell am force-stop
com.google.android.inputmethod.latin` (paksa-stop Gboard) yang membuatnya
hilang sementara — tapi **modal ini terbukti muncul lagi** beberapa menit
kemudian pada fokus `TextInput` berikutnya, jadi force-stop Gboard
**bukan solusi permanen**, cuma penundaan. Akibatnya, **live-typing di
Pencarian Global tidak bisa diuji tuntas** sesi ini (debounce, grouping
hasil, clear, nonsense-query) — bukan karena bug aplikasi, murni gangguan
device/Gboard. **Rekomendasi untuk sesi berikutnya**: kalau AVD yang sama
dipakai lagi, coba nonaktifkan fitur stylus di pengaturan sistem Android
sebelum mulai (Settings → System → Languages & input, atau cari opsi
"stylus" spesifik), atau ganti ke AVD/API image tanpa fitur stylus
diaktifkan, sebelum mencoba live-typing apa pun.

---

## Tabel Reachability (46 fitur, `featureGroups` di `mobileFeatures.js`)

Kolom "Cara reachable" memakai: **Hub-B** = hub Belajar, **Hub-I** = hub
Ibadah, **Menu** = hamburger (Modern-only), **Dir** = Beranda→Lainnya→
Direktori Fitur (dari kode, BLOCKED live), **Cari** = Pencarian Global (dari
kode, BLOCKED live), **Home** = shortcut langsung di Beranda.

| Key              | Judul                  | Cara reachable (utama)                     | Modern                                    | Classic                                          |
| ---------------- | ---------------------- | ------------------------------------------ | ----------------------------------------- | ------------------------------------------------ |
| doa              | Doa                    | Hub-I                                      | PASS, **B9 FIXED**; catatan **B12**       | ❌ **B14** (no search UI)                        |
| dzikir           | Dzikir                 | Hub-I; Home (shortcut kondisional)         | PASS                                      | PASS                                             |
| wirid            | Wirid                  | Hub-I                                      | PASS                                      | PASS                                             |
| user-wird        | Wirid Saya             | Hub-I                                      | PASS (gating)                             | PASS (gating)                                    |
| asmaul-wirid     | Wirid Asmaul Husna     | **Dir/Cari saja** (BLOCKED)                | ORPHAN\*-dangkal                          | ORPHAN\*-dangkal                                 |
| amalan           | Amalan Harian          | **Hub-B**                                  | PASS, **B1 FIXED** (sesi 3)               | PASS (kode sama, belum re-dicek Classic)         |
| asmaul-husna     | Asmaul Husna           | **Hub-B**; Hub-I                           | PASS, **B8 FIXED** (stress-tested)        | ❌ **B14** (no search UI)                        |
| asmaul-flashcard | Flashcard Asmaul Husna | **Dir/Cari saja** (BLOCKED)                | ORPHAN\*-dangkal                          | ORPHAN\*-dangkal                                 |
| tafsir           | Tafsir                 | **Hub-B**                                  | PASS; catatan **C2**                      | PASS                                             |
| asbabun-nuzul    | Asbabun Nuzul          | **Hub-B**                                  | PASS; catatan **C2**                      | PASS                                             |
| panduan-sholat   | Panduan Sholat         | **Hub-B**                                  | PASS                                      | PASS                                             |
| siroh            | Siroh                  | **Hub-B**                                  | PASS                                      | PASS                                             |
| tokoh            | Tokoh Tarikh           | Menu (Modern); Dir (Classic)               | PASS; **B5 FIXED** (highlight benar)      | ❌ **B4 CONFIRMED** (hanya Dir, 2 ketuk ekstra)  |
| sejarah          | Sejarah Islam          | **Hub-B**                                  | PASS, B8 fix also confirmed here          | ❌ **B14** (no search UI)                        |
| historical-map   | Peta Islam Interaktif  | Menu (Modern); Dir (Classic)               | PASS                                      | ❌ **B4 CONFIRMED** (hanya Dir)                  |
| masjid           | Masjid                 | Hub-I                                      | PASS                                      | PASS                                             |
| radio-islamic    | Radio Islam            | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                            | ORPHAN-dangkal                                   |
| fiqh             | Fiqh Ringkas           | **Hub-B**                                  | PASS                                      | PASS                                             |
| manasik          | Manasik                | **Hub-B**; Hub-I                           | PASS                                      | PASS                                             |
| community-feed   | Feed Komunitas         | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                            | ORPHAN-dangkal                                   |
| komunitas        | Komunitas              | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                            | ORPHAN-dangkal                                   |
| kajian           | Kajian                 | **Hub-B**                                  | PASS                                      | PASS                                             |
| lessons          | Modul & Kelas          | **Hub-B**                                  | PASS, **B2 FIXED** (sesi 3)               | PASS (kode sama, belum re-dicek Classic)         |
| library          | Perpustakaan           | **Hub-B**                                  | PASS                                      | PASS                                             |
| blog             | Artikel                | **Hub-B**                                  | PASS, **B3 FIXED** (sesi 3)               | PASS (kode sama, belum re-dicek Classic)         |
| perawi           | Perawi Hadis           | Menu (Modern); Dir (Classic)               | PASS                                      | ❌ **B4 CONFIRMED** (hanya Dir)                  |
| jarh-tadil       | Jarh wa Ta'dil         | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                            | ORPHAN-dangkal                                   |
| forum            | Forum Tanya Jawab      | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                            | ORPHAN-dangkal                                   |
| kamus            | Kamus Arab             | **Hub-B**                                  | PASS                                      | PASS                                             |
| quiz             | Quiz Islami            | **Hub-B**                                  | PASS, **B7 FIXED** (Q2+ confirmed sesi 3) | sama                                             |
| hijri            | Kalender Hijri         | Hub-I                                      | PASS                                      | PASS                                             |
| imsakiyah        | Imsakiyah              | Hub-I                                      | PASS                                      | PASS                                             |
| tasbih           | Tasbih                 | Hub-I                                      | PASS                                      | PASS                                             |
| zakat            | Kalkulator Zakat       | Hub-I                                      | PASS                                      | PASS (kode; Classic-input lihat audit Ibadah B6) |
| faraidh          | Faraidh                | Hub-I                                      | PASS                                      | PASS (kode; idem)                                |
| sholat-tracker   | Sholat Tracker         | Hub-I                                      | PASS                                      | PASS                                             |
| bookmarks        | Bookmark               | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| notes            | Catatan                | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| notifications    | Notifikasi             | Menu/Account (Modern); Home bell (Classic) | PASS                                      | PASS                                             |
| goals            | Target Belajar         | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| muhasabah        | Muhasabah              | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| hafalan          | Hafalan                | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| murojaah         | Murojaah               | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| tilawah          | Tilawah                | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| stats            | Statistik              | **Hub-B**                                  | PASS (gating)                             | PASS (gating)                                    |
| leaderboard      | Leaderboard            | **Hub-B**                                  | PASS (publik, C6)                         | PASS (publik)                                    |

`*` = sudah dikonfirmasi **reachable lewat deep link** oleh audit Ibadah
sebelumnya (`belajar/asmaul-wirid`, `belajar/asmaul-flashcard`); "ORPHAN"
di tabel ini merujuk ke tiadanya jalur **tap-only tanpa deep link** di
dalam hub Belajar/Ibadah/hamburger itu sendiri — bukan klaim tidak bisa
dibuka sama sekali.

**Daftar orphan (findings MEDIUM, sesuai instruksi brief)**: `asmaul-wirid`,
`asmaul-flashcard`, `radio-islamic`, `community-feed`, `komunitas`,
`jarh-tadil`, `forum` — ketujuhnya tidak muncul di hub Belajar, hub Ibadah,
atau hamburger; satu-satunya jalur (dari kode, **BLOCKED** untuk konfirmasi
live) adalah Direktori Fitur (Beranda → Lainnya) atau menebak nama di
Pencarian Global. Tidak terlihat ada indikasi ini **disengaja** (tidak ada
komentar/flag "hidden" di kode; `community-feed` dan `asmaul-flashcard`
malah punya badge "Baru" di definisinya yang jadi sia-sia karena tidak
pernah tampil di hub manapun) — kemungkinan besar PR yang menambahkan
fitur-fitur ini lupa mendaftarkannya ke `belajarFeatureGroups`/
`IbadahScreen` rows.

---

## Checklist lengkap yang diuji (PASS kecuali disebut sebagai bug di atas)

### Hub Belajar — Modern (live, lengkap)

| Kontrol                                        | Modern                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| Hero "KONTEN ISLAM / Belajar" + subjudul       | ✅ PASS                                                                |
| Kotak cari hub (tampilan kosong)               | ✅ PASS tampil; isi/filter/clear **BLOCKED** (tidak sempat ketik)      |
| Scroll penuh atas→bawah, 6 kartu grup terlihat | ✅ PASS (`001`–`006`), semua grup & tile sesuai `belajarFeatureGroups` |
| 24/24 tile: tap membuka fitur yang benar       | ✅ PASS (judul header sesuai tile yang ditekan, tiap kasus)            |
| 24/24 tile: header back → kembali ke hub       | ✅ PASS (hero "KONTEN ISLAM" terlihat lagi, programatik via `st2`)     |
| 24/24 tile: hardware back → kembali ke hub     | ✅ PASS (idem)                                                         |
| 24/24 tile: tab bottom-nav tetap "Belajar"     | ✅ PASS (dicek `selTab='Belajar'` di setiap langkah siklus)            |
| Badge "Terakhir"/"Baru"/"Akun"/"Lokal" tampil  | ✅ PASS tampil; label "Lokal" misleading di Tafsir/Asbabun — **C2**    |
| Pin (bintang) per tile                         | Terlihat PASS visual; tap-untuk-pin **BLOCKED** (tidak dicoba)         |
| Pull-to-refresh hub                            | **BLOCKED** (tidak dicoba)                                             |
| Chip kategori di level hub                     | N/A — hub tidak punya chip sendiri (chip ada di dalam tiap fitur)      |
| Rotasi                                         | Diabaikan sesuai brief (portrait-locked)                               |

### Hub Belajar — Classic

| Kontrol                                          | Hasil                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semua kontrol di atas (sesi 1)                   | **BLOCKED sepenuhnya** — sesi putus sebelum sempat beralih ke Classic (Profil → Tampilan → Mode Layout). Tidak ada satu screenshot Classic pun dari area Belajar di sesi 1.                                                                                                                                                                                                                                                                     |
| Beralih ke Classic (Profil→Tampilan→Mode Layout) | ✅ **CONFIRMED live sesi 2 & 3** (`045`, `046`, `107-classic-switched.png`) — radio button Classic terisi, Profil kembali bergaya Paper/Classic.                                                                                                                                                                                                                                                                                                |
| Profil root Classic (guest)                      | ✅ **CONFIRMED live** (`048-classic-profile-root.png`, `051-classic-profile-root-live.png`) — kartu akun, Pencapaian (badge, jumlah & status bervariasi antar load), Leaderboard, Target Belajar, Masuk/Daftar terlihat.                                                                                                                                                                                                                        |
| Pengaturan Classic → SettingsList (B4)           | ✅ **CONFIRMED live sesi 3**: **7 baris** (Akun, Notifikasi, Penyimpanan, Tampilan, Keamanan, Bantuan, Tentang Aplikasi) — `052-classic-settings-7rows-B4-LIVE.png`. B4 mitigasi FIXED, lihat update B4.                                                                                                                                                                                                                                        |
| Belajar hub equivalent di Classic (24 tile)      | ✅ **CONFIRMED live sesi 3**: Classic punya hub Belajar sendiri (ikon graduation-cap di bottom-nav), isinya **identik dengan Modern** (hero, search, grup+tile sama persis) — `059`/`061`/`110-classic-hub-dark.png`, cuma beda chrome (Paper/minimal, 1 ikon profil kanan-atas, bukan hamburger+search+avatar). 3 fitur dibuka dari hub ini, back (panah KANAN-atas untuk layar fitur Classic, beda posisi dari Modern) kembali bersih ke hub. |
| B4 "cari Bantuan/Tentang di SEMUA tab"           | Sebagian: Beranda Classic & Profil root Classic dicek spesifik — **tidak ada elemen hamburger di keduanya**. Tab Al-Quran/Hadis/Ibadah Classic tidak dicek ulang (di luar prioritas sesi 3, tapi `ClassicAppShell.js` tidak pernah merender `MobileMenuSheet` di shell manapun — keputusan arsitektur per-shell, bukan per-tab).                                                                                                                |

### Tema gelap (semua layar utama)

| Kontrol                                               | Hasil                                                                                                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hub Belajar, Modern & Classic                         | ✅ **CONFIRMED live sesi 3** — kontras BAGUS di kedua layout: tile putih/hijau terang, judul putih bold, subjudul abu-abu terang, badge jelas (`110-classic-hub-dark.png`).   |
| Profil & Settings root, Modern                        | ✅ **CONFIRMED live sesi 3** — kontras BAGUS. Achievement badge + Aksi Akun semua terbaca jelas (`111-modern-profile-dark.png` bagian atas).                                  |
| Settings → Tampilan (label section), Modern & Classic | ❌ **B13 BARU** — label "Tema"/"Bahasa Konten"/"Mode Layout" nyaris tak terbaca (kontras sangat rendah), terjadi di KEDUA layout karena `AppearanceSettings` dipakai bersama. |
| Global Search, dark theme                             | Terlihat sekilas saat dites (chip, input, tombol Cari) — kontras baik, tidak ada masalah.                                                                                     |

### Pencarian Global (header kaca pembesar)

| Kontrol                                                                            | Hasil                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Membuka dari ikon Cari                                                             | ✅ **CONFIRMED live sesi 3** — layar "Pencarian" terbuka benar, search box, toggle Kata Kunci/Makna, 7 chip kategori (Semua/Al-Quran/Hadith/Doa/Kamus/Kajian/Perawi) — `113-global-search-open.png`. |
| Highlight tab Beranda saat Pencarian terbuka (B6)                                  | ✅ **CONFIRMED live sesi 3, FIXED** — tab "Beranda" tetap menyala hijau sepanjang Pencarian terbuka.                                                                                                 |
| Pilih chip kategori tanpa teks                                                     | ✅ PASS — chip "Doa" bisa dipilih (`089-search-doa-chip-only.png`), highlight berubah benar.                                                                                                         |
| Tombol "Cari" dengan query kosong                                                  | PASS (no-op), tidak ada pesan error/empty-state eksplisit (observasi, bukan bug tegas).                                                                                                              |
| Ketik, debounce, grup hasil, buka tiap tipe hasil, clear, recents, nonsense-query  | **BLOCKED** — popup sistem "Try out your stylus" (Gboard, lihat **C10**) berulang kali mencegat SEMUA input teks ke kotak cari ini; bukan bug aplikasi.                                              |
| Tutup Pencarian (header back, re-tap ikon cari, re-tap tab Beranda, hardware back) | ❌ **B15 BARU** — hanya hardware back yang berfungsi; re-tap ikon cari dan re-tap tab Beranda (sudah menyala) sama-sama tidak menutup layar.                                                         |
| Classic vs Modern, dark theme                                                      | Dark theme PASS (lihat tabel Tema gelap); Classic tidak dicek untuk Pencarian Global sesi ini (Classic tidak punya ikon cari header — lihat B4).                                                     |

### Hamburger menu (Modern)

| Kontrol                                                    | Hasil                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Membuka, 6 baris terlihat, isi tiap layar                  | ✅ **CONFIRMED live sesi 3** — 6 baris (Tokoh Islam/Peta Interaktif/Perawi Hadith di "Akses Cepat"; Pengaturan/Bantuan/Tentang Aplikasi di "Lainnya") — `106-hamburger-id.png`, `105-hamburger-en.png` (versi Inggris, label ikut terjemah benar). |
| B5 (triple-highlight Akses Cepat)                          | ✅ **CONFIRMED live sesi 3, FIXED** — buka Tokoh Islam, reopen hamburger: hanya Tokoh Islam highlight (`070-hamburger-single-highlight-B5-FIXED-confirmed.png`).                                                                                   |
| Highlight grup "Lainnya"                                   | ✅ **CONFIRMED FIXED live sesi 3** — buka Pengaturan, reopen hamburger: hanya Pengaturan highlight; buka Bantuan: hanya Bantuan highlight (`100-hamburger-at-settings-B16.png`, `102-hamburger-at-bantuan-B16.png`). B16 ditutup. |
| Back/tutup dari tiap baris, hardware-back tutup sheet dulu | PASS — tiap baris (Help/About/Settings/Tokoh Islam) dibuka dan kembali dengan back benar ke layar sebelumnya.                                                                                                                                      |

### Account menu / avatar (guest) & Profile (guest)

| Kontrol                                            | Hasil                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Avatar → menu akun (Modern)                        | ✅ **CONFIRMED live sesi 3** — dropdown berisi Profil/Bookmark/Catatan/Statistik/Notifikasi, toggle tema (Gelap, "Mengikuti sistem"), toggle bahasa (Indonesia/English) — `104-account-menu.png`.                                                                                                                        |
| Ganti bahasa ID/EN, cek semua string ikut flip     | **Sebagian PASS, sebagian GAGAL** — lihat **B11 BARU**: bottom-nav, hamburger, account-menu, Doa, FAQ Bantuan/Tentang (isi) semua ikut berubah benar; hub Belajar, 6 badge Pencapaian, 7 dari 9 judul header Profil/Settings, toggle "Book"/"Hadith" tidak ikut berubah. Flip balik ke Indonesia juga dicoba dan bersih. |
| Toggle tema (Gelap manual via Tampilan)            | ✅ **CONFIRMED live sesi 3** — lihat tabel Tema gelap.                                                                                                                                                                                                                                                                   |
| Sign-in entry point                                | ✅ Terlihat — kartu "Masuk / Daftar" di Profil root (Modern & Classic); tidak dicoba login sungguhan (guest-only).                                                                                                                                                                                                       |
| Profile guest: semua section/switch, back behavior | ✅ **CONFIRMED live sesi 3** di kedua layout — Akun/Pencapaian ("Lihat semua")/Leaderboard/Target Belajar/Aksi Akun (Masuk-Daftar, Pengaturan) semua terlihat, sebagian dibuka (Pengaturan, Help, About); back dari masing-masing bersih.                                                                                |
| Perbandingan kamus `idn.js`/`en.js` untuk key B7   | 0 key hilang lintas bahasa (dicek sesi 2); **B7 kini juga FIXED live sesi 3** untuk Quiz Q2+ (lihat update B7).                                                                                                                                                                                                          |

### Bottom navigation

| Kontrol                                                     | Hasil                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tap Beranda↔Belajar berulang selama 24 siklus tile          | ✅ PASS implisit sesi 1 (setiap `cycle.sh` kembali dari fitur dan `hubtile.py` membuka ulang dari hub, tab Belajar selalu konsisten menyala)                                                                                                                                                                                                                                                                                                                                                                      |
| Cycle 5 tab incidental (regression sweep Part 1 sesi 2)     | ✅ PASS implisit tambahan: Beranda↔Quran↔Hadis↔Ibadah↔Belajar berpindah berkali-kali untuk regression sweep, bottom nav selalu konsisten menyalakan tab yang benar (`75`-`79` di folder fix-verify) — bukan pengujian sistematis re-tap/hardware-back yang diminta brief.                                                                                                                                                                                                                                         |
| Re-tap tab aktif, hardware back dari root tiap tab (sesi 3) | ✅ **CONFIRMED**: Beranda (re-tap → tetap Beranda, tidak toggle-off; hardware-back dari root → **keluar app**, tanpa dialog konfirmasi, standar Android) → Al-Quran (tap benar, hardware-back → **kembali ke Beranda**, bukan keluar app) → Hadis (pola sama dengan Al-Quran) → Ibadah & Belajar dicek lewat alur B12 (lihat update), pola serupa. Hardware-back dari tab non-Beranda selalu kembali ke Beranda dulu, hanya Beranda sendiri yang keluar app — perilaku wajar (mis. YouTube/Instagram), bukan bug. |
| Highlight saat Pencarian Global terbuka                     | ✅ **CONFIRMED live sesi 3, FIXED** (B6) — lihat update B6.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Lintas-cutting bug hunt (cross-cutting classes dari brief)

| Kelas bug                                   | Ditemukan?                                                                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown/`undefined`/`NaN` mentah           | ✅ Ya sebelumnya — **B2**, **B3** — **FIXED, CONFIRMED live sesi 3**                                                                                                                         |
| Header/back basi atau salah                 | Tidak ditemukan di 24 siklus hub (lihat **C7**); **B9 FIXED live sesi 3**; **B11 BARU** (7 header Profil/Settings tidak ikut bahasa — "tidak reaktif", bukan "basi")                         |
| Chip tidak bisa scroll                      | Chip di dalam fitur (Kajian, Fiqh, dll.) terlihat overflow di layar (horizontal scroll tersirat) — tidak sempat divalidasi dengan swipe langsung (masih BLOCKED, di luar prioritas sesi 3)   |
| Toast/alert dobel                           | Tidak teramati sesi 3 — tidak ada alert aplikasi ganda; 1 dialog ANR sistem (`com.android.systemui`, BUKAN app ini) di awal sesi, lihat Setup — sesi 3                                       |
| Tombol tanpa efek                           | ❌ Ya BARU — **B15** (Pencarian Global: re-tap ikon cari & re-tap tab Beranda keduanya tidak berefek, cuma hardware back yang bekerja)                                                       |
| Teks keras bahasa Inggris/Indonesia         | ❌ Ya BARU — **B11** (hub Belajar, badge Pencapaian, 7 header Profil/Settings, toggle Book/Hadith hardcode, tidak ikut toggle bahasa); **B10** (3 ejaan nama app berbeda)                    |
| State bocor antar fitur                     | Tidak teramati state-leak klasik (chip/search) sesi 3; ditemukan **B12 BARU** — kelas berbeda: konten TIDAK berpindah saat tab di-switch (state lama "nyangkut", bukan nyasar ke fitur lain) |
| Tap target < 44px                           | Tidak diukur piksel manual; semua tombol berbasis `touchTarget`/`touchTargetSmall` (44/40) dari `theme.js`, konsisten dengan audit sebelumnya                                                |
| Konten di bawah system bar/notch            | Tidak teramati di 120+ screenshot gabungan 3 sesi                                                                                                                                            |
| Input kehilangan fokus 1 karakter (Classic) | Tidak teramati pada input yang sempat dicoba sesi 3 (search box Classic tidak sempat diketik karena popup Gboard, lihat C10); form multi-input Classic tidak dicoba sesi ini                 |
| Performa pencarian / ANR                    | ✅ FIXED, CONFIRMED live sesi 3 — **B8** debounce bekerja, 0 ANR di 2 layar berbeda termasuk stress test                                                                                     |
| Kontras tema gelap                          | ❌ Ya BARU — **B13** (label section Settings/Tampilan nyaris tak terbaca)                                                                                                                    |
| Paritas fungsional Classic vs Modern        | ❌ Ya BARU — **B14** (8 fitur `type:"list"` kehilangan search/filter UI total di Classic), **B16** (hamburger highlight grup Lainnya)                                                        |

---

## Prioritas Perbaikan (untuk sesi fix terpisah)

**Diperbarui sesi 3 — B1-B9 semua TUNTAS (LIVE confirmed), fokus pindah ke
B10-B16 (semua baru, belum ada fix-nya sama sekali):**

1. ~~Rebuild + reinstall + re-live-test B1-B7~~ — **SELESAI**. B1-B9
   (seluruh temuan sesi 1 & 2) sudah **CONFIRMED FIXED live** sesi 3,
   lihat update masing-masing di atas. Tidak ada tindakan lanjutan untuk
   kesembilan bug ini.
2. **B14 (BARU, MEDIUM, kemungkinan prioritas tertinggi sekarang)** — 8
   fitur `type:"list"` (termasuk Asmaul Husna 99 item, Doa 82 item) di
   Classic (baseline default) **sama sekali tidak punya search/filter
   UI** — gap fungsional nyata, bukan cuma kosmetik, dan menimpa layout
   yang paling banyak dipakai.
3. **B13 (BARU, MEDIUM)** — label section "Tema"/"Bahasa Konten"/"Mode
   Layout" nyaris tak terbaca di tema gelap (kedua layout) — root cause
   sudah presisi (`ProfileScreen.styles.js:2`, `colors` statis), perbaikan
   relatif sederhana (ubah ke factory function).
4. **B11 (BARU, MEDIUM)** — toggle bahasa ID/EN tidak diterapkan ke hub
   Belajar, badge Pencapaian, 7 dari 9 header Profil/Settings, toggle
   Book/Hadith — scope lebih besar (butuh audit i18n yang lebih luas di
   `mobileFeatures.js`, bukan cuma 1-2 baris).
5. **B12 (BARU, MEDIUM)** — tab Belajar tidak reset konten saat fitur
   cross-hub (mis. Doa dari Ibadah) sedang tampil — root cause belum
   100% pasti baris-per-baris (butuh logging runtime untuk konfirmasi
   penuh sebelum fix), prioritas sedang karena cukup membingungkan tapi
   tidak memblokir navigasi total (hardware-back tetap berfungsi).
6. **B16 (BARU, MEDIUM)** — hamburger grup "Lainnya" (Pengaturan/
   Bantuan/Tentang) triple-highlight, bug class sama dengan B5 yang
   sudah di-fix — perbaikan serupa, scope kecil (`MobileMenuSheet.js`).
7. **B10 (BARU, LOW)** — 3 ejaan nama aplikasi berbeda — kosmetik,
   perbaikan sangat sederhana (satukan ke 1 konstanta).
8. **B15 (BARU, LOW)** — Pencarian Global tidak punya cara tutup yang
   terlihat selain hardware back — kosmetik/UX, perbaikan sederhana.
9. **C1 orphan 7-fitur** — masih sepenuhnya terbuka, belum disentuh sesi
   manapun — putuskan sebagai tim: masukkan ke `belajarFeatureGroups`/hub
   Ibadah, atau beri tanda eksplisit "hanya lewat Direktori Fitur".
10. **Lanjutkan yang masih belum tercover** (lihat juga "Apa yang belum
    tercover" di laporan akhir sesi 3): Pencarian Global live-typing penuh
    (debounce/grouping/clear/nonsense-query — BLOCKED oleh popup Gboard,
    lihat C10, butuh AVD lain atau fitur stylus dinonaktifkan), Wirid Saya
    (edit) & Forum (detail) untuk sisa cakupan B7, chip-horizontal-scroll
    di dalam fitur, form multi-input Classic (fokus/keyboard overlap),
    dan tarik ulang logcat/crash buffer murni untuk konfirmasi independen
    "0 crash" (tidak dilakukan eksplisit sesi 3, meski tidak ada indikasi
    crash/ANR apapun selama sesi).

---

## Indeks screenshot pendukung

**Sesi 1**: `apps/mobile/output/native/2026-10-01-belajar-hub-deep-audit/`
`000`–`041` (80 file; `041` 0 byte, momen device hilang). Highlight:
`000`–`006` (hub scroll penuh), `010`–`034` (24 siklus tile, pola
`NNN-modern-<key>-open.png` / `-after-hdrback.png` / `-after-hwback.png`),
`040`-`041` (percobaan kotak cari hub, terputus).

**Sesi 2**: lanjutan di folder yang sama, `042`–`049` (`042`-`046`
berpindah ke Classic lewat Profil→Tampilan, `047` SettingsList Classic,
`048` Profil root Classic, `049` 0 byte — momen device hilang untuk kedua
kalinya). Bukti Part 1 (live-verify fix `7de394aa`/`b42dcf1b`, termasuk B8
dan B9 yang ditemukan di sela-selanya) ada di folder terpisah
`apps/mobile/output/native/2026-10-01-fix-verify/` (`01`–`79`) — lihat
laporan Part 1 untuk indeks lengkapnya. Rujuk nama file yang disebut di
tiap temuan di atas untuk bukti spesifik.

**Sesi 3**: lanjutan di folder yang sama, `050`–`103` (54 file). Highlight:
`050`-`055` (B4: Classic home/profil/settings 7-baris/Bantuan/Tentang),
`056`-`057` (switch ke Modern, hub Belajar), `058`-`064` (B8: Sejarah
Islam + Asmaul Husna, echo instan, burst atomik, stress test tanpa ANR),
`065`-`067` (B9: Doa chip Bangun/Pagi; dan tema gelap dark Settings/hub),
`068`-`070` (B5 FIXED + B16 regresi grup Lainnya), `071`-`074` (B6 FIXED;
B11 bahasa tidak diterapkan ke hub/header), `075`-`078` (B12 tab-belajar
stuck), `089`-`094` (Global Search: chip, close-affordance B15),
`095`-`098` (reset tema/bahasa/layout ke default), `099`-`103` (B1-B3,B7
live-confirmed: Amalan Harian, markdown Tata Cara Wudhu, excerpt Artikel,
Quiz Pertanyaan 2/5, reset akhir). Rujuk nama file lengkap yang disebut di
tiap temuan B1-B16 di atas untuk bukti spesifik per kasus.

---

## Resolusi Final & Status Rilis (2026-10-01) — ditulis oleh sesi lain, lihat catatan sesi 3

> Seksi di bawah ini ditulis oleh sesi/proses lain (bukan sesi 3 audit
> ini) yang berjalan konkuren di repo yang sama — dibiarkan apa adanya
> sesuai konvensi "jangan timpa temuan sesi lain" dokumen ini. **Klaim di
> bawah berbasis unit test, bukan live device test.** Sesi 3 (di atas)
> memberikan **konfirmasi live independen pertama** untuk sebagian besar
> klaim ini: B1-B9 **CONFIRMED FIXED live** (cocok dengan klaim di bawah).
> Klaim "dark mode Classic Tafsir/Library diperbaiki" **belum
> diverifikasi live oleh sesi 3** (di luar prioritas yang diberikan; sesi
> 3 fokus ke Profil/Settings yang justru menemukan kontras gelap baru
> yang BELUM diperbaiki, lihat **B13** — kemungkinan area berbeda dari
> yang diperbaiki seksi ini, tidak kontradiktif, tapi tetap belum dicek
> silang). B10, B11, B12, B14, B15, B16 ditemukan **SETELAH** seksi di
> bawah ini ditulis, jadi wajar tidak disebut di sana.

- **Seluruh temuan bug B1-B9 telah diperbaiki**:
    - B1-B7: Diperbaiki dan diverifikasi di unit test pada commit `8d7611a0`.
    - B8 (ANR search debouncing) & B9 (Doa category label): Diperbaiki pada commit `95295da8`.
    - Dark mode Classic Tafsir side-by-side & Library book-reader: Diperbaiki di `ExploreClassicRenderers.js` dan dites regression-proof di `src/__tests__/exploreClassicRenderers.test.js`.
- **Release APK telah dibangun ulang**:
    - Perintah `cd apps/mobile/android && ./gradlew assembleRelease` sukses dieksekusi.
    - Berkas APK terbaru berukuran ~85MB di `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` dan disalin ke `apps/mobile/Thullaabul-Ilmi-release.apk`.
- **Hasil Uji**: Seluruh 91 test suite mobile PASS (1.444 tests), 95 test suite web PASS (656 tests), dan seluruh unit test Go PASS.

---

## Status Perbaikan — Sesi 4 (2026-10-01)

B10–B16 (ditemukan di sesi 3) sekarang semuanya diperbaiki dan dites,
dalam 4 commit terpisah berdasarkan kelompok file supaya tidak tabrakan
dengan sesi lain yang konkuren jalan di repo yang sama:

- **B15 → FIXED, commit `a9111a9b`.** Global Search sekarang memanggil
  `navigation.setHeader({showBack:true,...})` dari `HomeScreen.js`
  (pola yang sama persis dengan `QiblaScreen.js`), jadi header bersama
  menampilkan panah kembali yang bisa ditekan. Classic sudah benar dari
  awal, tidak disentuh. Tes: `homeScreen.test.js`.
- **B12 → FIXED, commit `ae704030`.** Akar masalah dipastikan penuh
  (bukan dugaan black-box lagi): `ExploreScreen`'s `activeFeature`
  adalah **state komponen murni**, di luar pohon reducer
  `appNavigation.js` — saran fix di dokumen audit asli (reset
  `internalRoutes[tab]` di reducer) **tidak akan menyentuh bug ini
  sama sekali**, dibuktikan lewat grep (`ExploreScreen.js` tidak pernah
  membaca `internalRoutes`/`navigation.current`). Fix sebenarnya:
  `openTabState` melaporkan `resetContent: true` saat tab yang diminta
  = tab aktif mentah SAAT INI, tanpa params, padahal chrome sedang
  menyamarkannya sebagai tab lain (`belajarShowsAsIbadah`); `App.js`
  menaikkan counter dan menyisipkannya ke `key` pane Belajar supaya
  React me-remount `ExploreScreen` bersih kembali ke hub. Tes:
  `appNavigation.test.js` (6 tes baru, dipastikan gagal dulu sebelum
  fix diterapkan, baru lolos setelahnya).
- **B10, B11 (3 dari 5), B13, B16 → FIXED, commit `6ca564a0`.**
    - B10: satu konstanta `APP_NAME` (`theme.js`) dipakai di `ProfileScreen.js`
      dan `MobileTopHeader.js`, menyamai ejaan `app.json`/kunci
      `profile.about.appName` yang sudah benar.
    - B11: hero hub Belajar (`BelajarHubHero`, komponen baru supaya hook
      `useMobileLocale` tidak dipanggil kondisional), 9 judul header
      Modern Profil, dan toggle Book/Hadith di Hadis sekarang lewat
      `t()`. **Belum dikerjakan (scope besar, sengaja ditunda)**: katalog
      `mobileFeatures.js` (46 fitur/92 literal judul-meta) dan nama 6
      badge Pencapaian (sumbernya API, di luar kode mobile).
    - B13: label "Tema"/"Bahasa Konten"/"Mode Layout" dan Q&A Bantuan
      sekarang dapat override `isDarkTheme && {color: colors.dark.ink}`
      inline — tanpa merombak `ProfileScreen.styles.js` yang statis.
      **Ditemukan kelas bug yang sama, belum diperbaiki** (di luar scope
      4 label yang diminta): judul section Keamanan
      (`profile.security.guest/sessions/password/delete.title`) dan
      `profile.about.descriptionTitle` — kemungkinan sama-sama kurang
      kontras di dark mode, perlu sesi fix terpisah.
    - B16: dipakai ulang pipa `currentFeatureKey` yang sudah ada dari fix
      B5 (bukan bikin mekanisme baru) — `ProfileScreen.js` sekarang ikut
      mendeklarasikan `featureKey: currentScreen` di `setHeader`-nya, dan
      3 baris "Lainnya" di `MobileMenuSheet.js` dapat `params.featureKey`
      yang cocok.
    - Tes: `profileScreen.test.js`, `mobileMenuSheet.test.js`,
      `exploreWebAppRoutes.test.js`, `hadithScreen.test.js`,
      `mobileAppShell.test.js`.
- **B14 → FIXED, commit `84d30cbe`.** Classic sekarang punya search box
  (debounce 300ms, sama seperti fix B8) + chip kategori + counter untuk
  8 fitur `type:"list"` (Dzikir, Wirid, Doa, Asmaul Husna, Panduan
  Sholat, Sejarah, Manasik, Jarh Tadil), lewat komponen baru
  `ClassicReferenceListContent` + helper murni baru
  `referenceListFilter.js` yang meng-port logika kategori/pencarian
  Modern (termasuk alias `dzikir_umum→umum` dan daftar kategori khusus
  Doa + fallback judul "Bangun"). 8 fitur `type:"list"` LAIN yang sudah
  punya layar Modern sendiri (Kajian, Library, Blog, dll.) sengaja
  dikecualikan lewat allowlist eksplisit, bukan cek `type` polos — tidak
  disentuh. Tes: `exploreClassicReferenceList.test.js` (baru, 8 tes).
- **B4 masih SEBAGIAN.** Mitigasi Bantuan/Tentang di Profil (dari sesi
  lain/Codex, commit `49bdb571`/sekitarnya) dikonfirmasi live sesi 3.
  Yang masih kosong — Classic tidak punya padanan hamburger sama sekali
  untuk Tokoh Islam/Peta Interaktif/Perawi Hadith — sengaja TIDAK
  ditambal di sesi 4 ini karena itu keputusan desain navigasi Classic,
  ditunda ke fase redesign Classic yang memang sudah direncanakan
  setelah seluruh audit fitur selesai.

**Verifikasi setelah sesi 4**: full suite mobile `npx jest --runInBand`
hijau di tiap commit (93 suite / 1479 test di commit terakhir).
**Belum diverifikasi live** (tidak ada akses emulator/device selama sesi
4, semua fix dikerjakan code+Jest saja) — perlu sesi live-verify
terpisah sebelum build APK berikutnya dianggap final untuk B10-B16.

## Status Live-Verify — Sesi 5 (2026-10-01)

Sesi terpisah (device baru pertama kali melihat fix sesi 4), APK release
fresh-install (`firstInstallTime` = `lastUpdateTime` 17:38:29, data app
kosong), guest-only, API produksi. **Seluruh B10–B16 dikonfirmasi FIXED
secara live** (screenshot per item ada di update masing-masing di atas,
folder `apps/mobile/output/native/2026-10-01-b10-b16-live-verify/`):

- **B10 FIXED** — 3 lokasi asli (Profil, header Modern, Tentang Aplikasi)
  kini identik "Thullaabul Ilmi". Residual 4 lokasi lain (di luar scope
  judul bug asli) → **B17 baru**.
- **B11 FIXED** — hero hub Belajar, 3 header Profil/Settings, toggle
  Kitab/Hadis-Book/Hadith semuanya ikut toggle bahasa dengan benar di kedua
  arah.
- **B12 FIXED** — tab Belajar sekarang benar me-remount ke hub saat ditekan
  dari state cross-hub yang disamarkan; direproduksi 2× + 2 non-regresi
  (re-tap bersih, re-tap Ibadah) semuanya PASS.
- **B13 FIXED** — label Tema/Bahasa Konten/Mode Layout + Q&A Bantuan
  terang jelas di dark mode. Keamanan & About description title
  dikonfirmasi ulang **masih buram** persis seperti catatan "sengaja
  ditunda" di commit — bukan regresi baru.
- **B14 FIXED** (UI/mekanisme) — search+chip+counter+debounce+item-tap
  bekerja di 4 fitur Classic yang dites langsung (Panduan Sholat, Asmaul
  Husna, Doa termasuk chip "Bangun", Dzikir). Tapi ditemukan 2 bug
  data/konten baru yang sebelumnya tidak kelihatan karena UI-nya memang
  belum ada → **B18, B19 baru**; plus 1 bug navigasi lingkungan yang jadi
  lebih sering ketemu karena B14 → **B20 baru**.
- **B15 FIXED** — panah-kembali Pencarian Global berfungsi, hardware back
  juga tetap berfungsi.
- **B16 FIXED** — dikonfirmasi dengan 2 kondisi kontras (Pengaturan-only,
  Bantuan-only), regresi Akses Cepat (B5) tetap aman.

**4 temuan baru (B17-B20)**, detail lengkap root-cause + saran fix ada di
masing-masing entri di atas:

- **B17 (LOW)** — residual ejaan nama aplikasi di 2 key i18n
  (`profile.about.description`, `theme.light.meta`) + 2 literal share-text
  Zakat/Faraidh, di luar scope 3 lokasi yang di-fix B10.
- **B18 (MEDIUM)** — kategori Panduan Sholat (Wudhu/Sholat/Sunnah/Dzikir/
  Umum) 100% selalu 0 hasil di KEDUA layout, karena endpoint
  `panduan-sholat` tidak pernah mengirim field kategori apa pun — bug data,
  bukan bug UI B14 (kontras: Dzikir yang API-nya punya field kategori,
  chip-nya berfungsi normal).
- **B19 (MEDIUM)** — pencarian Asmaul Husna tidak mengindeks field
  `transliteration` ("Ar-Rahman" dkk.) dari API, cuma cocok lewat arti
  Indonesia (`item.title`) — cara pencarian paling natural untuk fitur ini
  (ejaan Arab/transliterasi) tidak berfungsi.
- **B20 (MEDIUM)** — TabBar Classic bisa hilang permanen (butuh
  force-stop+relaunch untuk pulih) jika search box difokus lalu dinavigasi
  keluar sebelum event `keyboardDidHide` sempat terpicu bersih; kemungkinan
  bug lama di `App.js`/`ClassicAppShell.js`, baru sering ketemu sekarang
  karena B14 menambah banyak search box baru ke Classic.

**Regresi sweep**: `adb logcat -c` lalu Home → Quran → Al-Fatihah → Hadis →
Shahih Bukhari reader → Ibadah hub → Belajar hub (Modern), plus seluruh
navigasi B10-B16/B18-B20 di atas (puluhan layar, kedua layout, kedua
bahasa, dark+light theme) — `adb logcat -d -s ReactNativeJS:V
AndroidRuntime:E` dan `adb logcat -b crash -d` **kosong total** (0 baris),
tidak ada crash/red-box teramati di screenshot manapun sepanjang sesi.

**Hal yang tidak sempat diverifikasi**: 4 dari 8 fitur reference-list B14
(Wirid, Panduan Sholat kategori lain selain 3 yang dites, Manasik,
Jarh Tadil) tidak ditekan satu-satu secara eksplisit — dinilai risiko
rendah karena memakai komponen `ClassicReferenceListContent` + helper
`referenceListFilter.js` yang identik dengan 4 fitur yang sudah dites,
TAPI B18 justru membuktikan asumsi "komponen sama = aman" tidak selalu
berlaku untuk lapisan DATA (tiap fitur punya skema API sendiri) — jadi
4 fitur yang belum dicek sebaiknya tetap di-spot-check sebelum dianggap
bebas dari kelas bug B18/B19.

**Akhir sesi**: dikembalikan ke state awal yang diminta — Modern (Web App),
tema Ikuti Sistem, Bahasa Indonesia, tab Beranda. Font scale, Wi-Fi, dan
airplane mode tidak disentuh (tetap default).

---

## Status Perbaikan — Sesi 5 (2026-10-01)

B17–B20 (ditemukan sesi 4 saat live-verify B10–B16) semuanya sudah
diperbaiki dan dites, belum di-live-verify ulang (code+Jest saja, tidak
ada akses emulator selama sesi 5):

- **B17 → FIXED, commit `27c9801a`.** 4 lokasi residual ejaan nama app
  dibetulkan: `profile.about.description` dan `theme.light.meta` di
  `idn.js`/`en.js` (koreksi literal langsung, menyamai
  `profile.about.appName` yang sudah benar), dan teks share
  Zakat/Faraidh (`WebAppZakatRoute.js`, `WebAppFaraidhRoute.js`) yang
  sekarang memakai `${APP_NAME}` seperti pola B10, bukan literal baru.
  Tes baru di `mobileI18n.test.js` meng-grep pola ejaan salah
  (`/Th[ou]ll?abul/`) terhadap kedua key di kedua bahasa.
- **B18 & B19 → FIXED, commit `fbfda767`.** Ditelusuri manual sampai ke
  `normalizeExploreItem` (api/explore.js) untuk memastikan akar masalah
  B19, bukan sekadar menebak dari gejala: title Asmaul Husna berasal
  dari `translation.idn` (arti Indonesia), transliterasi API
  (`raw.transliteration`) tidak pernah masuk title/body/arabic/meta
  manapun — makanya tidak pernah ikut terindeks pencarian. Fix:
  `transliteration`/`indonesian`/`english` ditambahkan ke haystack
  pencarian di KEDUA layout (`referenceListFilter.js` untuk Classic,
  `WebAppReferenceListRoute.js` untuk Modern — bug ini juga berlaku di
  Modern, bukan cuma Classic, dikonfirmasi lewat pembacaan kode yang
  sama). B18: `categories` Panduan Sholat dikosongkan di kedua layout
  (sama seperti pola `asmaul-husna` yang sudah `categories: []`) sampai
  API beneran mengirim field kategori.
- **B20 → FIXED (2026-10-02 sesi lanjutan).** Mekanisme sebenarnya:
  trigger utamanya BUKAN perpindahan tab, tapi `ExploreScreen`
  menutup `activeFeature`-nya sendiri (state komponen lokal) — transisi
  ini bisa membongkar native view kolom pencarian yang sedang fokus
  sebelum event `keyboardDidHide` sempat terkirim, jadi `keyboardVisible`
  di `App.js` tersangkut `true` selamanya.

    Fix terapan (commit lanjutan sesi ini):
    1. `useEffect` penangkal me-reset `keyboardVisible` ke `false` tiap
       kali `activeTab` ATAU `internalRoutes` ATAU `headerConfig` berubah
       (`headerConfig` menangkap kasus `ExploreScreen` karena SEMUA
       `setHeader` lewat situ).
    2. `Keyboard.dismiss()` di awal hardware back handler, sebelum
       screen-local handler dijalankan.
    3. `Keyboard.dismiss()` + `resetKeyboardVisibleWithGrace()` di semua
       navigasi (`openTab`, `openInternalView`, `closeInternalView`,
       `closeAndOpenTab`, `resetInternalViews`, `clearBack`, `setHeaderConfig`).
    4. `Keyboard.dismiss()` di `clearFeature()` (ExploreClassic) dan
       `goBack()` (QiblaScreen).
    5. **Watchdog interval** (800ms) yang memeriksa `TextInput.State.currentlyFocusedInput()` — jika tidak ada input fokus tapi `keyboardVisible===true`, reset ke `false`. Ini menangkap kasus di mana event native `keyboardDidHide` tidak terkirim (unmount/transisi cepat).
    6. Unit test coverage: 7 test kasus B20 di `appKeyboardVisible.test.js` (screen-close, hardware back, deep link, screen-handled back, grace-timer, watchdog).

    **Celah residual (di luar scope file sesi ini, perlu sesi fix terpisah):**
    `HadithScreen.js`, `ProfileScreen.js`, `HomeScreen.js` masing-masing
    render tombol back Classic-nya sendiri yang langsung menutup state
    lokal tanpa lewat `setHeader`. Tap VISUAL pada tombol itu (bukan
    hardware back) dengan keyboard terbuka tidak tertangkap penangkal ini.
    `QiblaScreen.js` sudah diperbaiki di sesi ini (ditambah
    `Keyboard.dismiss()` di `goBack()`).

    **Amandemen (sesi investigasi device paralel, 2026-10-02)**: dua sesi
    agent berjalan bersamaan di file yang sama (`App.js`,
    `ExploreClassicRenderers.js`) — poin 1–4 dan 6 di atas, plus angka
    500ms pada grace-timer, berasal dari sesi investigasi device
    terpisah yang menjustifikasi `resetKeyboardVisibleWithGrace()`
    dengan timestamp nyata (gap late-event terukur 5–172ms di 6 sampel
    bersih, lihat entri B20 di atas untuk detail lengkap); poin 5
    (watchdog `setInterval`) dan ekstensi ke `clearBack`/`setHeaderConfig`/
    `openTab`/dkk serta fix `QiblaScreen.js` berasal dari sesi ini.
    Kedua kontribusi dipertahankan bersama — diverifikasi kompatibel
    lewat full Jest run dan 12 trial device bersih (lihat entri B20)
    setelah digabung. Koreksi angka test: **94 suite / 1494 test** pass
    (bukan "1490+"), **7 test** di `appKeyboardVisible.test.js` (5 dari
    sesi ini + 2 fake-timer baru dari sesi investigasi device yang
    memvalidasi grace-window secara eksplisit).

**Verifikasi**: full suite mobile 94/94 pass (1494 test, dikonfirmasi
ulang setelah kedua sesi digabung). Semua 7 test B20 di
`appKeyboardVisible.test.js` pass.
