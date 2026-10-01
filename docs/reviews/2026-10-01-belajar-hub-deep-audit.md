# Deep Audit: Belajar Hub, Global Navigation Chrome & Feature Reachability — 2026-10-01

> Audit MENDALAM satu area: **hub Belajar, chrome navigasi global (header,
> hamburger, account menu, pencarian global, bottom nav), dan reachability
> ~46 fitur** di `apps/mobile`, mengikuti metodologi
> [2026-09-30-ibadah-deep-audit.md](./2026-09-30-ibadah-deep-audit.md). Fitur
> individual di dalam Belajar (Kajian, Siroh, Kamus, Waris, dst.) TIDAK
> dideep-dive isinya — itu scope audit terpisah; di sini hanya dikonfirmasi
> setiap tile terbuka ke layar yang benar dan Back kembali dengan bersih.

**Status interupsi**: sesi emulator (`emulator-5554`) terputus di tengah
audit (environment/VM restart di luar kendali; `adb devices` kembali kosong,
tidak ada device yang bisa disentuh lagi). Sesuai arahan, audit dihentikan di
titik itu — **tidak ada upaya reconnect/relaunch emulator** (berisiko bentrok
dengan sesi lain yang mungkin memilikinya). Semua yang berhasil diuji live
sebelum putus didokumentasikan sebagai **PASS/BUG terverifikasi device**;
sisanya ditandai eksplisit **BLOCKED** (dengan alasan) atau **"dari kode,
belum dikonfirmasi live"**. **7 bug dilaporkan** (1 HIGH, 4 MEDIUM, 2 LOW) —
3 di antaranya terverifikasi langsung di device dengan screenshot, 4 lainnya
adalah temuan kode berkualitas tinggi (absennya komponen/kesalahan logika
yang tidak bergantung pada state runtime) yang **belum sempat dipencet
langsung**. Tidak ada crash yang teramati di ~45 menit interaksi (tidak ada
red box di screenshot manapun), tapi **logcat/crash buffer tidak sempat
ditarik ulang** sebelum sesi putus — jadi "0 crash" di sini adalah observasi
visual, bukan konfirmasi `dumpsys`/DropBox seperti audit Ibadah. Screenshot:
`apps/mobile/output/native/2026-10-01-belajar-hub-deep-audit/*.png` (80
file).

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

### B4. [Classic; BLOCKED — belum sempat diuji live, device hilang sebelum giliran Classic] Classic tidak punya hamburger/account-menu/header pencarian sama sekali → Bantuan & Tentang Aplikasi kehilangan SEMUA jalur in-app — HIGH

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

### C8. Build APK vs HEAD — INFO

Lihat "Setup" — APK yang terpasang 1 commit mobile di belakang HEAD, dan
beda itu murni kosmetik (token tema). Semua temuan logika di atas berlaku
sama di HEAD.

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

| Kontrol               | Hasil                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semua kontrol di atas | **BLOCKED sepenuhnya** — sesi putus sebelum sempat beralih ke Classic (Profil → Tampilan → Mode Layout). Tidak ada satu screenshot Classic pun dari area Belajar di sesi ini. |

### Tema gelap (semua layar utama)

| Kontrol                                               | Hasil                                         |
| ----------------------------------------------------- | --------------------------------------------- |
| Hub Belajar, 24 fitur, chrome global dalam tema gelap | **BLOCKED sepenuhnya** — tidak sempat dicoba. |

### Pencarian Global (header kaca pembesar)

| Kontrol                                                                                                                        | Hasil                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Membuka dari ikon Cari                                                                                                         | **BLOCKED** — tidak sempat ditekan sebelum device hilang.                         |
| Ketik, debounce, grup hasil, buka tiap tipe hasil, state kosong/error, clear, recents, keyboard, Classic vs Modern, dark theme | **BLOCKED semua** — hanya dibaca dari kode (lihat B6, B7 terkait tidak langsung). |

### Hamburger menu (Modern)

| Kontrol                                                                                   | Hasil                                                                                         |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Membuka, 6 baris, isi tiap layar, back, tutup, buka ulang, hardware-back tutup sheet dulu | **BLOCKED semua** — tidak sempat ditekan sebelum device hilang. Temuan B4/B5 murni dari kode. |

### Account menu / avatar (guest) & Profile (guest)

| Kontrol                                                                                        | Hasil                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar → menu akun, ganti bahasa ID/EN cek semua string, toggle tema, Profile semua tab/switch | **BLOCKED semua** — tidak sempat dibuka. Perbandingan kamus `idn.js`/`en.js` (0 key hilang lintas bahasa) dilakukan lewat kode, bukan lewat UI live — lihat B7 untuk key yang hilang dari **keduanya** sekaligus. |

### Bottom navigation

| Kontrol                                                                                                                  | Hasil                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Tap Beranda↔Belajar berulang selama 24 siklus tile                                                                       | ✅ PASS implisit (setiap `cycle.sh` kembali dari fitur dan `hubtile.py` membuka ulang dari hub, tab Belajar selalu konsisten menyala) |
| Tap 5 tab lain (Quran/Hadis/Ibadah), re-tap tab aktif, state tersimpan saat pindah tab, hardware back dari root tiap tab | **BLOCKED** — fokus sesi habis di siklus 24-tile sebelum sempat ke bagian ini.                                                        |
| Highlight saat Pencarian Global terbuka                                                                                  | Dari kode: **tanpa highlight sama sekali** — **B6**, BLOCKED live.                                                                    |

### Lintas-cutting bug hunt (cross-cutting classes dari brief)

| Kelas bug                                   | Ditemukan?                                                                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown/`undefined`/`NaN` mentah           | ✅ Ya — **B2**, **B3** (markdown `**`/`##` mentah)                                                                                                         |
| Header/back basi atau salah                 | Tidak ditemukan di 24 siklus hub (lihat **C7**); belum teruji di luar hub (BLOCKED)                                                                        |
| Chip tidak bisa scroll                      | Chip di dalam fitur (Kajian, Fiqh, dll.) terlihat overflow di layar (horizontal scroll tersirat) — tidak sempat divalidasi dengan swipe langsung (BLOCKED) |
| Toast/alert dobel                           | Tidak teramati (tidak ada alert muncul sepanjang sesi)                                                                                                     |
| Tombol tanpa efek                           | Tidak ditemukan di 24 tile hub                                                                                                                             |
| Teks keras bahasa Inggris/Indonesia         | Tidak ditemukan secara acak; **B7** adalah kasus key-mentah (lebih parah dari sekadar bahasa salah)                                                        |
| State bocor antar fitur                     | Tidak teramati di 24 siklus (tiap `loadFeature` me-reset state lokal — dicek di kode `ExploreScreen.js:518-544`)                                           |
| Tap target < 44px                           | Tidak diukur piksel manual; semua tombol berbasis `touchTarget`/`touchTargetSmall` (44/40) dari `theme.js`, konsisten dengan audit sebelumnya              |
| Konten di bawah system bar/notch            | Tidak teramati di 80 screenshot                                                                                                                            |
| Input kehilangan fokus 1 karakter (Classic) | **BLOCKED** — Classic tidak sempat diuji sama sekali                                                                                                       |

---

## Prioritas Perbaikan (untuk sesi fix terpisah)

1. **B4** (Classic tanpa hamburger/account-menu/search) — dampak terluas:
   2 layar (Bantuan, Tentang) nol-jalur di satu layout penuh. Verifikasi
   dulu di device (BLOCKED sesi ini), baru putuskan fix: entry minimal di
   Profile Settings, atau render ulang menu di Classic.
2. **B1** (pesan error Amalan Harian salah) — perbaikan satu baris
   (`{error}` bukan string hardcoded), confirmed reproducible.
3. **B2 + B3** (markdown mentah di Lessons & Blog) — satu kelas, dua lokasi;
   bungkus lewat `MarkdownView` yang sudah ada, konsisten dengan perbaikan
   serupa yang sudah direkomendasikan untuk Manasik di audit Ibadah.
4. **B6** (bottom-nav tanpa highlight saat Pencarian Global) — perbaikan
   kecil di `getShellActiveTab`/`MobileBottomNav`; verifikasi device dulu.
5. **B7** (3 translation key hilang) — tambahkan ke kamus; jadikan skrip
   pembanding kamus→pemakaian kode (sudah dibuat di scratchpad sesi ini)
   sebagai pengecekan rutin/CI supaya kelas bug ini tidak terus berulang.
6. **B5** (highlight ganda hamburger) — LOW, kosmetik, boleh digabung
   dengan pekerjaan B4.
7. **C1 orphan 7-fitur** — putuskan sebagai tim: masukkan ke
   `belajarFeatureGroups`/hub Ibadah kalau memang fitur yang ingin
   ditonjolkan, atau beri tanda eksplisit "hanya lewat Direktori Fitur"
   kalau sengaja low-profile.
8. **Lanjutan wajib untuk audit berikutnya (BLOCKED murni karena device
   hilang, BUKAN karena sudah PASS)**: seluruh Classic, tema gelap, Pencarian
   Global live, Hamburger menu live, Account menu + Profile guest live,
   bottom-nav 5-tab live, dan tarik ulang logcat/crash buffer untuk
   konfirmasi "0 crash" yang sesungguhnya (bukan cuma observasi visual).

---

## Indeks screenshot pendukung

Semua di `apps/mobile/output/native/2026-10-01-belajar-hub-deep-audit/`
(80 file). Highlight: `000`–`006` (hub scroll penuh), `010`–`034` (24
siklus tile, pola `NNN-modern-<key>-open.png` /
`-after-hdrback.png` / `-after-hwback.png`). Rujuk nama file yang disebut
di tiap temuan di atas untuk bukti spesifik.
