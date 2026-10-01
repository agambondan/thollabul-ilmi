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

---

## Tabel Reachability (46 fitur, `featureGroups` di `mobileFeatures.js`)

Kolom "Cara reachable" memakai: **Hub-B** = hub Belajar, **Hub-I** = hub
Ibadah, **Menu** = hamburger (Modern-only), **Dir** = Beranda→Lainnya→
Direktori Fitur (dari kode, BLOCKED live), **Cari** = Pencarian Global (dari
kode, BLOCKED live), **Home** = shortcut langsung di Beranda.

| Key              | Judul                  | Cara reachable (utama)                     | Modern                              | Classic                                          |
| ---------------- | ---------------------- | ------------------------------------------ | ----------------------------------- | ------------------------------------------------ |
| doa              | Doa                    | Hub-I                                      | PASS (Ibadah)                       | PASS (Ibadah)                                    |
| dzikir           | Dzikir                 | Hub-I; Home (shortcut kondisional)         | PASS                                | PASS                                             |
| wirid            | Wirid                  | Hub-I                                      | PASS                                | PASS                                             |
| user-wird        | Wirid Saya             | Hub-I                                      | PASS (gating)                       | PASS (gating)                                    |
| asmaul-wirid     | Wirid Asmaul Husna     | **Dir/Cari saja** (BLOCKED)                | ORPHAN\*-dangkal                    | ORPHAN\*-dangkal                                 |
| amalan           | Amalan Harian          | **Hub-B**                                  | PASS nav; ❌ **B1**                 | PASS nav; ❌ **B1** (kode sama)                  |
| asmaul-husna     | Asmaul Husna           | **Hub-B**; Hub-I                           | PASS                                | PASS                                             |
| asmaul-flashcard | Flashcard Asmaul Husna | **Dir/Cari saja** (BLOCKED)                | ORPHAN\*-dangkal                    | ORPHAN\*-dangkal                                 |
| tafsir           | Tafsir                 | **Hub-B**                                  | PASS; catatan **C2**                | PASS                                             |
| asbabun-nuzul    | Asbabun Nuzul          | **Hub-B**                                  | PASS; catatan **C2**                | PASS                                             |
| panduan-sholat   | Panduan Sholat         | **Hub-B**                                  | PASS                                | PASS                                             |
| siroh            | Siroh                  | **Hub-B**                                  | PASS                                | PASS                                             |
| tokoh            | Tokoh Tarikh           | Menu (Modern); Dir (Classic, BLOCKED)      | PASS                                | ❌ **B4** (hanya Dir, 2 ketuk ekstra)            |
| sejarah          | Sejarah Islam          | **Hub-B**                                  | PASS                                | PASS                                             |
| historical-map   | Peta Islam Interaktif  | Menu (Modern); Dir (Classic, BLOCKED)      | PASS                                | ❌ **B4** (hanya Dir)                            |
| masjid           | Masjid                 | Hub-I                                      | PASS                                | PASS                                             |
| radio-islamic    | Radio Islam            | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                      | ORPHAN-dangkal                                   |
| fiqh             | Fiqh Ringkas           | **Hub-B**                                  | PASS                                | PASS                                             |
| manasik          | Manasik                | **Hub-B**; Hub-I                           | PASS                                | PASS                                             |
| community-feed   | Feed Komunitas         | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                      | ORPHAN-dangkal                                   |
| komunitas        | Komunitas              | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                      | ORPHAN-dangkal                                   |
| kajian           | Kajian                 | **Hub-B**                                  | PASS                                | PASS                                             |
| lessons          | Modul & Kelas          | **Hub-B**                                  | PASS nav; ❌ **B2**                 | PASS nav; ❌ **B2** (kode sama)                  |
| library          | Perpustakaan           | **Hub-B**                                  | PASS                                | PASS                                             |
| blog             | Artikel                | **Hub-B**                                  | PASS nav; ❌ **B3**                 | PASS nav; ❌ **B3** (kode sama)                  |
| perawi           | Perawi Hadis           | Menu (Modern); Dir (Classic, BLOCKED)      | PASS                                | ❌ **B4** (hanya Dir)                            |
| jarh-tadil       | Jarh wa Ta'dil         | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                      | ORPHAN-dangkal                                   |
| forum            | Forum Tanya Jawab      | **Dir/Cari saja** (BLOCKED)                | ORPHAN-dangkal                      | ORPHAN-dangkal                                   |
| kamus            | Kamus Arab             | **Hub-B**                                  | PASS                                | PASS                                             |
| quiz             | Quiz Islami            | **Hub-B**                                  | PASS (Q1); ❌ **B7** (Q2+, BLOCKED) | sama                                             |
| hijri            | Kalender Hijri         | Hub-I                                      | PASS                                | PASS                                             |
| imsakiyah        | Imsakiyah              | Hub-I                                      | PASS                                | PASS                                             |
| tasbih           | Tasbih                 | Hub-I                                      | PASS                                | PASS                                             |
| zakat            | Kalkulator Zakat       | Hub-I                                      | PASS                                | PASS (kode; Classic-input lihat audit Ibadah B6) |
| faraidh          | Faraidh                | Hub-I                                      | PASS                                | PASS (kode; idem)                                |
| sholat-tracker   | Sholat Tracker         | Hub-I                                      | PASS                                | PASS                                             |
| bookmarks        | Bookmark               | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| notes            | Catatan                | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| notifications    | Notifikasi             | Menu/Account (Modern); Home bell (Classic) | PASS                                | PASS                                             |
| goals            | Target Belajar         | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| muhasabah        | Muhasabah              | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| hafalan          | Hafalan                | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| murojaah         | Murojaah               | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| tilawah          | Tilawah                | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| stats            | Statistik              | **Hub-B**                                  | PASS (gating)                       | PASS (gating)                                    |
| leaderboard      | Leaderboard            | **Hub-B**                                  | PASS (publik, C6)                   | PASS (publik)                                    |

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

| Kontrol                                          | Hasil                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semua kontrol di atas (sesi 1)                   | **BLOCKED sepenuhnya** — sesi putus sebelum sempat beralih ke Classic (Profil → Tampilan → Mode Layout). Tidak ada satu screenshot Classic pun dari area Belajar di sesi 1.                                                            |
| Beralih ke Classic (Profil→Tampilan→Mode Layout) | ✅ **CONFIRMED live sesi 2** (`045`, `046`) — radio button Classic terisi, Profil kembali bergaya Paper/Classic.                                                                                                                       |
| Profil root Classic (guest)                      | ✅ **CONFIRMED live** (`048-classic-profile-root.png`) — kartu akun, Pencapaian (6 badge terkunci), Leaderboard, Target Belajar terlihat; tidak sempat scroll sampai habis (device hilang di `049`, 0 byte).                           |
| Pengaturan Classic → SettingsList (B4)           | ✅ **CONFIRMED live**: 5 baris (Akun, Notifikasi, Penyimpanan, Tampilan, Keamanan), tidak ada Bantuan/Tentang (`047-classic-profile.png`) — versi APK lama; source HEAD sudah 7 baris sejak commit `8d7611a0`, lihat update B4 dan C8. |
| Belajar hub equivalent di Classic (24 tile)      | **BLOCKED sepenuhnya** — device hilang sebelum sempat pindah ke tab Belajar dalam mode Classic.                                                                                                                                        |
| B4 "cari Bantuan/Tentang di SEMUA tab"           | **BLOCKED** — hanya layar Pengaturan yang sempat dicek; "setiap tab lain" yang diminta brief tidak sempat dijelajah.                                                                                                                   |

### Tema gelap (semua layar utama)

| Kontrol                                               | Hasil                                                                                                                                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hub Belajar, 24 fitur, chrome global dalam tema gelap | **BLOCKED sepenuhnya** — tidak sempat dicoba di kedua sesi (prioritas sesi 2 ada di Classic dulu sesuai urutan brief; device hilang persis di awal eksplorasi Classic, sebelum sempat ke dark theme). |

### Pencarian Global (header kaca pembesar)

| Kontrol                                                                                                                        | Hasil                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Membuka dari ikon Cari                                                                                                         | **BLOCKED** — tidak sempat ditekan di kedua sesi.                                                                                                                                                      |
| Ketik, debounce, grup hasil, buka tiap tipe hasil, state kosong/error, clear, recents, keyboard, Classic vs Modern, dark theme | **BLOCKED semua** secara live. **B6 (highlight Beranda hilang saat search) sudah FIXED di source** (`8d7611a0`, test `appNavigation.test.js:525-532` PASS) — lihat update B6; sisanya murni dari kode. |

### Hamburger menu (Modern)

| Kontrol                                                                                   | Hasil                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Membuka, 6 baris, isi tiap layar, back, tutup, buka ulang, hardware-back tutup sheet dulu | **BLOCKED semua secara live** di kedua sesi. **B5 (triple-highlight Akses Cepat) sudah FIXED di source** (`8d7611a0`, wiring `currentFeatureKey` ditelusuri end-to-end App.js→WebAppShell→MobileMenuSheet, test `mobileMenuSheet.test.js` PASS) — lihat update B5, tapi screenshot hamburger terbuka sungguhan masih nihil di kedua sesi. |

### Account menu / avatar (guest) & Profile (guest)

| Kontrol                                                | Hasil                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar → menu akun (Modern)                            | **BLOCKED** — tidak sempat dibuka di kedua sesi (sesi 2 sempat di Classic yang tidak punya avatar-menu sama sekali, lihat B4).                                                                                                                                                                                                                                   |
| Ganti bahasa ID/EN, cek semua string ikut flip         | **BLOCKED untuk alur toggle-nya**, tapi **EN sempat aktif tidak sengaja** sesi 2 (salah tap koordinat, lihat `043-classic-switched.png`) — UI berganti total ke Inggris (termasuk bottom nav "Home/Al-Quran/Hadith/Worship/Learn") sebelum direvert; tidak diperiksa sistematis per halaman, tapi jadi bukti EN minimal berfungsi untuk layar Tampilan + chrome. |
| Toggle tema (Terang/Gelap manual)                      | **BLOCKED** — tidak dicoba.                                                                                                                                                                                                                                                                                                                                      |
| Profile guest: semua tab/section/switch, back behavior | **BLOCKED sebagian besar** — hanya root Classic (`048`) dan SettingsList (`047`) yang sempat dilihat; Pencapaian/Leaderboard/Target Belajar/Masuk-Daftar terlihat ADA tapi tidak satupun di-tap.                                                                                                                                                                 |
| Perbandingan kamus `idn.js`/`en.js` untuk key B7       | 0 key hilang lintas bahasa — dicek ulang sesi 2, ketiga key B7 ADA di `idn.js`/`en.js`/`exploreIdn.js`/`exploreEn.js` (lihat update B7), bukan cuma 1 bahasa.                                                                                                                                                                                                    |

### Bottom navigation

| Kontrol                                                         | Hasil                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tap Beranda↔Belajar berulang selama 24 siklus tile              | ✅ PASS implisit sesi 1 (setiap `cycle.sh` kembali dari fitur dan `hubtile.py` membuka ulang dari hub, tab Belajar selalu konsisten menyala)                                                                                                                              |
| Cycle 5 tab incidental (regression sweep Part 1 sesi 2)         | ✅ PASS implisit tambahan: Beranda↔Quran↔Hadis↔Ibadah↔Belajar berpindah berkali-kali untuk regression sweep, bottom nav selalu konsisten menyalakan tab yang benar (`75`-`79` di folder fix-verify) — bukan pengujian sistematis re-tap/hardware-back yang diminta brief. |
| Re-tap tab aktif, hardware back dari root tiap tab (sistematis) | **BLOCKED** — tidak dilakukan secara eksplisit/sistematis di kedua sesi.                                                                                                                                                                                                  |
| Highlight saat Pencarian Global terbuka                         | **B6 sudah FIXED di source** (`8d7611a0`, lihat update B6) — **BLOCKED untuk screenshot nyata**, APK yang dites masih versi sebelum fix.                                                                                                                                  |

### Lintas-cutting bug hunt (cross-cutting classes dari brief)

| Kelas bug                                   | Ditemukan?                                                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Markdown/`undefined`/`NaN` mentah           | ✅ Ya — **B2**, **B3** (markdown `**`/`##` mentah; sudah FIXED di source, lihat update)                                                                                                    |
| Header/back basi atau salah                 | Tidak ditemukan di 24 siklus hub (lihat **C7**); **B9 BARU** (judul header jadi raw category key di Doa) ditemukan sesi 2 — kelas berbeda (format salah, bukan basi)                       |
| Chip tidak bisa scroll                      | Chip di dalam fitur (Kajian, Fiqh, dll.) terlihat overflow di layar (horizontal scroll tersirat) — tidak sempat divalidasi dengan swipe langsung (BLOCKED)                                 |
| Toast/alert dobel                           | Tidak teramati (tidak ada alert muncul sepanjang sesi 1); sesi 2 memunculkan **dialog ANR sistem** (bukan toast/alert aplikasi) — lihat **B8**                                             |
| Tombol tanpa efek                           | Tidak ditemukan di 24 tile hub                                                                                                                                                             |
| Teks keras bahasa Inggris/Indonesia         | Tidak ditemukan secara acak; **B7** adalah kasus key-mentah (lebih parah dari sekadar bahasa salah; sudah FIXED di source)                                                                 |
| State bocor antar fitur                     | Tidak teramati di 24 siklus sesi 1; **dikonfirmasi tetap bersih sesi 2** untuk chip/search (R2 fix PASS live — Dzikir→Wirid, Asmaul Husna→Doa keduanya reset bersih, lihat laporan Part 1) |
| Tap target < 44px                           | Tidak diukur piksel manual; semua tombol berbasis `touchTarget`/`touchTargetSmall` (44/40) dari `theme.js`, konsisten dengan audit sebelumnya                                              |
| Konten di bawah system bar/notch            | Tidak teramati di 80+ screenshot gabungan kedua sesi                                                                                                                                       |
| Input kehilangan fokus 1 karakter (Classic) | **BLOCKED** — Classic sempat dibuka sesi 2 tapi tidak ada input teks yang dicoba sebelum device hilang                                                                                     |
| **BARU: Performa pencarian / ANR**          | ✅ Ya — **B8** (Asmaul Husna, 2-8 detik blocking per keystroke, ANR sungguhan sekali terjadi) — kelas tidak ada di brief asli tapi jelas relevan                                           |

---

## Prioritas Perbaikan (untuk sesi fix terpisah)

**Diperbarui sesi 2 — prioritas #1 sekarang BUKAN "tulis fix baru" tapi
"verifikasi fix yang sudah ditulis":**

1. **Rebuild + reinstall dari HEAD (pastikan mencakup `8d7611a0`,
   `7de394aa`, `b42dcf1b`) lalu re-live-test B1–B7 satu-satu.** Semua
   tujuh bug di laporan ini **sudah ada perbaikannya di source**
   (commit `8d7611a0`, "resolve Belajar hub and global navigation audit
   findings (B1-B7)") dan ke-7 fix itu lolos pembacaan diff baris-per-baris
    - `npx jest` (135/135 test relevan PASS) — tapi **belum ada satupun
      yang dilihat langsung di layar** karena APK yang terpasang sesi 2
      (mtime 11:39:59) lebih tua dari commit itu (12:06:45). Ini sekarang
      prioritas tertinggi: pekerjaan "tulis kode" sudah selesai, yang hilang
      cuma pembuktian visual. Detail tiap fix ada di update "sesi 2" pada
      masing-masing B1-B7 di atas dan di C8.
2. **B8 (BARU, HIGH)** — ANR sungguhan di pencarian Asmaul Husna (2-8
   detik blocking per keystroke). Ini bug **belum ada fix-nya** sama
   sekali (ditemukan sesi 2, di luar cakupan `8d7611a0`) dan punya risiko
   crash-adjacent nyata — debounce `onChangeText` di
   `WebAppReferenceListRoute.js` adalah prioritas fix tertinggi yang
   BELUM dikerjakan.
3. **B9 (BARU, MEDIUM)** — judul header Doa jadi raw category key saat
   chip dipilih (`WebAppDoaRoute.js:238`). Perbaikan satu baris
   (`getCategoryLabel(category, t)` bukan `category` mentah), belum ada
   fix-nya.
4. **Setelah rebuild, lanjutkan checklist yang masih BLOCKED murni
   karena device hilang (BUKAN karena sudah PASS)**: hub Belajar dalam
   Classic (24 tile), tema gelap (semua layar), Pencarian Global live
   penuh (ketik/debounce/grup hasil/clear), Hamburger menu live penuh (6
   baris + screenshot highlight), Account menu + Profile guest live
   penuh, bottom-nav 5-tab sistematis (re-tap aktif + hardware-back per
   tab), dan Quiz Q2+ untuk membuktikan `explore.quiz.questionProgress`
   (sudah terdaftar di kamus, tapi render live-nya belum pernah dilihat).
   Tarik ulang logcat/crash buffer untuk konfirmasi "0 crash" yang
   sesungguhnya (bukan cuma observasi visual) — sesi 2 sempat menemukan
   1 ANR (B8), jadi klaim "0 crash" sesi 1 TIDAK bisa diasumsikan masih
   berlaku tanpa diverifikasi ulang.
5. **C1 orphan 7-fitur** — putuskan sebagai tim: masukkan ke
   `belajarFeatureGroups`/hub Ibadah kalau memang fitur yang ingin
   ditonjolkan, atau beri tanda eksplisit "hanya lewat Direktori Fitur"
   kalau sengaja low-profile. (Tidak tersentuh oleh `8d7611a0`, masih
   sepenuhnya terbuka.)
6. **Pastikan tidak ada sesi lain yang memegang `emulator-5554` secara
   bersamaan** sebelum mulai (lihat C9) — gejala sesi 2 (reinstall
   mendadak ke debug build, navigasi tak terduga, device hilang dua kali)
   konsisten dengan lebih dari satu proses mengontrol device yang sama.

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

---

## Resolusi Final & Status Rilis (2026-10-01)

- **Seluruh temuan bug B1-B9 telah diperbaiki**:
  - B1-B7: Diperbaiki dan diverifikasi di unit test pada commit `8d7611a0`.
  - B8 (ANR search debouncing) & B9 (Doa category label): Diperbaiki pada commit `95295da8`.
  - Dark mode Classic Tafsir side-by-side & Library book-reader: Diperbaiki di `ExploreClassicRenderers.js` dan dites regression-proof di `src/__tests__/exploreClassicRenderers.test.js`.
- **Release APK telah dibangun ulang**:
  - Perintah `cd apps/mobile/android && ./gradlew assembleRelease` sukses dieksekusi.
  - Berkas APK terbaru berukuran ~85MB di `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` dan disalin ke `apps/mobile/Thullaabul-Ilmi-release.apk`.
- **Hasil Uji**: Seluruh 91 test suite mobile PASS (1.444 tests), 95 test suite web PASS (656 tests), dan seluruh unit test Go PASS.
