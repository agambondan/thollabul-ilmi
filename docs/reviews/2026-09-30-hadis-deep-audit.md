# Deep Audit: Fitur Hadis (Modern & Classic) — 2026-09-30

> Audit MENDALAM (bukan sweep dangkal) satu fitur: Hadis di `apps/mobile`,
> mengikuti metodologi yang sama dengan
> [2026-09-25-quran-deep-audit.md](./2026-09-25-quran-deep-audit.md). Setiap
> kontrol interaktif dicoba manual satu per satu (book shelf/tab switcher,
> search, filter kitab, kartu hadis, Aksi Cepat, detail 6-tab
> Teks/Sanad/Perawi/Takhrij/Ayat/Catatan, drill-down perawi, cross-reference
> ke Al-Qur'an, pagination, pull-to-refresh, hardware back, deep link) di
> kedua tema — Modern (Web App, 5-tab) dan Classic (Paper).

**Status**: 4 bug dilaporkan — **SEMUA FIXED (B1–B4)**, plus
4 catatan tambahan (1 gap data, 1 catatan konten, 2 temuan peripheral di luar
scope Hadis yang ditemukan tidak sengaja). Tidak ada crash yang ditemukan
sepanjang sesi ini (`pidof` dicek setelah setiap interaksi berisiko, dan
`logcat` penuh sesi di-scan ulang di akhir untuk `FATAL EXCEPTION` — nihil).
Screenshot: `apps/mobile/output/native/2026-09-30-hadis-deep-audit/*.png`.

## Status Perbaikan

| Bug | Deskripsi | Status | Commit / Solusi |
| --- | --------- | ------ | --------------- |
| B1 | Tab switcher "Theme"/"Chapter" mati di book shelf | **FIXED** | Tab disederhanakan ke `book` dan `hadith` yang aktif |
| B2 | Search hadis hanya mencari hadis lokal yang sudah ter-load | **FIXED** | Search memanggil backend `getHadithPage({ q, ... })` dengan debounce 320ms |
| B3 | ID hadis invalid menampilkan detail palsu alih-alih error | **FIXED** | `openHadith()` menangani error 404 tanpa fallback stub fiktif |
| B4 | Nama pendek kitab "Musnad Ahmad" dan "Sunan Darimi" terpotong di rail kartu | **FIXED** | `HADITH_BOOK_SHORT_LABELS` dilengkapi dengan `ahmad: "Ahmad"` dan `darimi: "Darimi"` |

## Setup

- Build: `cd apps/mobile/android && JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 ./gradlew assembleRelease`
  (`BUILD SUCCESSFUL`, 615 task, fresh APK 88.5MB).
- Emulator: `tholabul_pixel_7_api36` di-boot headless
  (`emulator -no-window -gpu swiftshader_indirect -no-snapshot -no-boot-anim`).
  `adb devices` dicek dulu sebelum install — hanya `emulator-5554` yang
  terhubung, tidak ada device fisik lain yang tersentuh.
- Install: `adb install -r android/app/build/outputs/apk/release/app-release.apk`.
  Package `com.anonymous.thullaabulilmimobile`.
- Sesi guest (Tamu) sepanjang audit — semua behavior yang butuh login
  (Bookmark, Catatan) hanya diverifikasi guest-gating message-nya (semua
  PASS — pesan "Buka Profil untuk masuk..." yang benar, bukan crash/silent
  fail), bukan alur simpan/hapus datanya yang sesungguhnya. Pola sama dengan
  audit Quran sebelumnya.

## Metodologi & catatan penting

- Koordinat tap SELALU diambil dari `adb shell uiautomator dump` (bounds
  native 1080×2400), bukan hasil eyeball dari screenshot tool (ditampilkan
  900×2000 — butuh kali 1.2). Beberapa kali sempat salah ambil koordinat dari
  screenshot langsung tanpa dikali 1.2 di tengah sesi (mis. tap tombol back
  header Classic, tap ulang chip Bukhari) — **semuanya ternyata bukan bug
  aplikasi**, murni salah taruh koordinat sendiri, dan langsung dikonfirmasi
  ulang dengan dump yang benar sebelum disimpulkan.
- **Temuan tooling**: layar Beranda (home) tidak bisa di-`uiautomator dump`
  sama sekali selama carousel "Ayat Hari Ini" masih auto-advance (`ERROR:
could not get idle state` — window dianggap tidak pernah idle karena
  animasi terus jalan). Ini keterbatasan ADB/uiautomator, bukan bug app —
  begitu pindah ke tab lain (statis), dump normal kembali.
- **Temuan tooling #2**: di tema Classic, bottom tab bar (Beranda/Al-
  Quran/Hadis/Ibadah/Belajar) punya bounds accessibility yang aneh di
  `uiautomator dump` — container-nya kebaca `[0,2337][1080,2400]` (tinggi 63px
  saja) padahal secara visual jelas jauh lebih tinggi (ikon+label terlihat
  normal di screenshot). Beberapa tap meleset ke tab lain gara-gara ini
  sebelum akhirnya pakai deep link (`thullaabulilmi://hadith`) untuk lompat
  langsung ke tab Hadis, menghindari ketergantungan pada tap koordinat tab
  bar yang tidak reliable. Di tema Modern, bottom tab bar-nya normal (bounds
  akurat). Dicatat sebagai temuan a11y peripheral di C4 di bawah, bukan bug
  Hadis itu sendiri.
- Build & install dari working tree — cek `git status` di awal sesi tidak
  menunjukkan diff uncommitted di `HadithScreen.js` (berbeda dari sesi audit
  Quran yang waktu itu ada `QuranScreen.js` yang belum commit), jadi semua
  kode yang diuji di sini adalah kode yang sudah ter-commit di `master`.

---

## Temuan Bug

### B1. [Modern] Tab switcher "Theme"/"Chapter"/"Hadith" di book shelf sama sekali tidak berfungsi (dead button) — HIGH

- **Lokasi**: `apps/mobile/src/screens/HadithScreen.js`, `WEB_APP_HADITH_TABS`
  (baris 99–104: `book`/`theme`/`chapter`/`hadith`) dan
  `renderWebAppHadithTabs()` (baris 769–819), `onPress` di baris 779–784:
    ```js
    onPress={() => {
        if (tab.key === "book") {
            setQuery("");
            selectBook(null);
        }
    }}
    ```
- **Expected**: keempat pill ("Book", "Theme", "Chapter", "Hadith") tampil
  menonjol di paling atas layar Hadis Modern seolah-olah 4 mode browsing
  berbeda — minimal ada state/transisi visual saat di-tap.
- **Actual**: **WRONG BEHAVIOR, 100% reproducible**. Tap "Theme"
  (`testID=hadith-web-app-tab-theme`) atau "Chapter"
  (`hadith-web-app-tab-chapter`) — dicoba masing-masing dengan koordinat
  presisi dari `uiautomator dump` — **benar-benar tidak melakukan apa pun**.
  Tidak ada perubahan visual, tidak ada state berubah, screenshot
  before/after identik byte-for-byte secara visual. Tab "Hadith" juga tidak
  punya handler (hanya tampil aktif secara PASIF sebagai efek samping saat
  `query`/`selectedBook` terisi, bukan karena di-tap langsung).
- **Root cause**: `onPress` fungsi tab switcher HANYA punya cabang
  `if (tab.key === "book")`. Untuk `tab.key` lain (`theme`, `chapter`,
  `hadith`) tidak ada `else`, tidak ada handler apa pun — secara harfiah
  tombol kosong. Ini juga dikonfirmasi oleh `activeTab` logic
  (`selectedBook || query ? "hadith" : "book"`, baris 770) yang membuktikan
  hanya ada 2 kemungkinan state aktif ("book" dan "hadith"), tidak pernah
  "theme" atau "chapter" — jadi bahkan secara visual pun 2 tab itu TIDAK
  PERNAH bisa jadi aktif, seumur hidupnya cuma dekorasi.
- **Dampak**: user Modern melihat 4 mode browsing hadis yang menjanjikan
  ("Book"/"Theme"/"Chapter"/"Hadith") tapi 3 di antaranya (75%) adalah
  tombol mati. Fitur browsing-per-tema dan per-bab yang mestinya jadi nilai
  tambah dibanding cuma browsing-per-kitab sama sekali tidak ada
  implementasinya di balik tombolnya sendiri.
- **Screenshot**: `01-modern-hadis-bookshelf.png` (state awal, "Book"
  aktif) → `02-modern-tab-theme-tapped.png` (setelah tap "Theme": identik) →
  `03-modern-tab-chapter-tapped.png` (setelah tap "Chapter": identik) →
  `04-modern-tab-hadith-tapped.png` (setelah tap "Hadith": identik).

### B2. [Modern & Classic] Search hadis hanya mencari di antara hadis yang SUDAH di-load, bukan seluruh dataset — HIGH

- **Lokasi**: `apps/mobile/src/screens/HadithScreen.js`, `filteredHadiths`
  (`useMemo`, baris 647–668) — filter jalan di atas state `hadiths` (array
  hasil `load()` yang ter-paginate `HADITH_LIST_PAGE_SIZE = 20` per halaman,
  baris 60), bukan query ke backend:
    ```js
    const filteredHadiths = useMemo(() => {
        const term = normalizeSearchText(query);
        if (!term) return hadiths;
        return hadiths.filter((hadith) => { ... });
    }, [hadiths, query]);
    ```
- **Expected**: placeholder search box sendiri bilang "Cari nomor, kitab,
  tema, atau teks hadis" — mengetik nomor hadis yang valid semestinya selalu
  ketemu, tidak peduli hadis itu ada di halaman ke berapa.
- **Actual**: **WRONG BEHAVIOR, dikonfirmasi definitif dengan before/after
  test**. Buka kitab Shahih Bukhari (7.563 hadis, baru 20 termuat), cari
  `"25"` → **"Hadis belum ditemukan"** (0 dari 0 hasil) — padahal hadis No.
  25 pasti ada. Setelah scroll sampai auto-load memuat 60+ hadis (lewat
  `onEndReached`/tombol "Muat lagi"), cari ulang `"25"` dengan query PERSIS
  SAMA → **kali ini ketemu** ("BUKHARI NO. 25", 1 dari 1 hasil). Reproduksi
  identik di Modern (dicoba dengan `"500"` dan `"25"`, keduanya 0 hasil
  sebelum load-more) dan di Classic (dikonfirmasi ulang dengan `"25"`,
  screenshot before/after tersimpan).
- **Root cause**: `load()` (baris 318–391) memanggil `getHadithPage({...,
size: HADITH_LIST_PAGE_SIZE})` yang hanya menarik 20 hadis per request dari
  `/api/v1/hadiths` atau `/api/v1/hadiths/book/:slug`. `filteredHadiths`
  memfilter array lokal `hadiths` ini, TIDAK PERNAH memanggil backend dengan
  parameter query pencarian. Jadi "mencari" di UI sebenarnya cuma "menyaring
  apa yang kebetulan sudah ke-download", bukan pencarian sungguhan ke seluruh
  data.
- **Dampak**: untuk kitab manapun dengan >20 hadis (praktiknya SEMUA kitab,
  yang paling kecil `count`-nya pun tetap ratusan), user yang baru buka
  kitab lalu langsung cari nomor/kata kunci yang sebetulnya ada tapi belum
  ke-load akan dapat pesan "tidak ditemukan" yang salah — mereka kemungkinan
  besar akan menyimpulkan datanya memang tidak ada, padahal cuma belum
  di-fetch. Ini adalah bug fungsional pada kontrol paling sering dipakai di
  seluruh fitur Hadis.
- **Screenshot**: `11-modern-search-25-before-loadmore.png` (0 hasil, belum
  load more) vs. konfirmasi definitif di Classic:
  `52-classic-search-25-after-loadmore.png` (1 hasil, setelah 60+ hadis
  termuat) — juga `10-modern-search-500-unloaded.png` untuk kasus serupa.

### B3. [Modern & Classic] ID hadis yang tidak ada di database menampilkan detail palsu, bukan pesan error — MEDIUM

- **Lokasi**: `apps/mobile/src/screens/HadithScreen.js`, `openHadith()`
  (baris 464–505) — `getHadithDetail(hadith.id).catch(() => hadith)` di
  baris 484 menelan error secara diam-diam; dikombinasikan dengan handler
  deep link (baris 1126–1136) yang membuat objek stub minimal saat hadis
  belum ada di list lokal:
    ```js
    openHadith(fromList ?? { id: hadithId, title: `Hadis ${hadithId}` });
    ```
- **Expected**: deep link atau navigasi ke ID hadis yang tidak ada di
  database semestinya menampilkan pesan error yang jelas ("Hadis tidak
  ditemukan" atau sejenisnya), bukan halaman detail yang terlihat valid.
- **Actual**: **WRONG BEHAVIOR, reproducible di kedua tema**. Deep link
  `thullaabulilmi://hadith/999999999` (Modern) dan
  `thullaabulilmi://hadith/888888888` (Classic) sama-sama membuka layar
  "Detail Hadith"/"Detail Hadis" yang terlihat sah — judul **"Kitab hadis
  No. 999999999"**, badge **"Belum dinilai"**, section "Hadis Terkait" "0
  item" — tanpa pesan error apa pun. Tidak ada teks `message` yang tampil di
  atas tab (state `message` tetap kosong karena catch di `openHadith`
  senyap).
- **Root cause**: ditelusuri sampai tuntas lewat kode —
    1. `getHadithDetail(999999999)` gagal (404) tapi di-`catch(() => hadith)`
       sehingga fallback ke objek stub `{id, title: "Hadis 999999999"}` tanpa
       pernah melempar/mencatat error ke `message`.
    2. `getHadithTopicLabel()` mendeteksi title stub `"Hadis 999999999"`
       sebagai label generik (regex `isGenericHadithLabel`, cocok pola
       `^hadis(?:\s+\d+)?$`) dan membuangnya, lalu fallback ke
       `getHadithBookLabel()` yang juga tidak punya data (`book`/`bookSlug`
       stub kosong) sehingga jatuh ke fallback string generik **"Kitab
       hadis"** — hasil akhirnya string gabungan "Kitab hadis No.
       999999999" yang tampak seperti nama hadis sungguhan, bukan pesan error.
- **Dampak**: skenario nyata yang bisa memicu ini — deep link basi/salah
  ketik, bookmark lokal yang datanya sudah dihapus di backend, atau
  notifikasi push lama yang menunjuk ID yang sudah tidak ada. User akan
  melihat "hadis" yang isinya kosong (tanpa Arab/terjemahan/apa pun) dan
  mengira itu memang entri hadis yang datanya belum lengkap, bukan
  menyadari bahwa ID yang diminta sebenarnya tidak ada.
- **Screenshot**: `30-modern-deeplink-invalid-id.png`,
  `50-classic-deeplink-invalid-confirm.png` (identik di kedua tema).

### B4. [Modern & Classic] Nama pendek kitab "Musnad Ahmad" dan "Sunan Darimi" terpotong di rail kartu compact — LOW

- **Lokasi**: `apps/mobile/src/screens/HadithScreen.js`,
  `HADITH_BOOK_SHORT_LABELS` (baris 151–159) — hanya mendaftarkan 7 dari 9
  kitab (`abu-daud`, `bukhari`, `ibnu-majah`, `malik`, `muslim`, `nasai`,
  `tirmidzi`); **`ahmad` dan `darimi` tidak ada di map ini**. Dipakai di
  `getHadithBookShortLabel()` (baris 215–231) untuk mengisi `metaRail` kartu
  compact (`renderCompactHadithCard`, baris 719, style `railBook` baris
  2643, `MetaRail` di `ContentCard.js` dengan `numberOfLines={1}` default).
- **Expected**: label pendek di kotak rail kiri kartu hadis tampil ringkas
  tapi lengkap, seperti "BUKHARI", "MUSLIM", "TIRMIDZI" untuk kitab lain.
- **Actual**: untuk kitab Musnad Ahmad, kotak rail menampilkan **"MUSNAD
  A..."** (terpotong ellipsis) alih-alih sesuatu yang ringkas seperti
  "AHMAD". (Sunan Darimi punya root cause identik di kode — sama-sama tidak
  terdaftar di map — walau tidak sempat di-screenshot terpisah karena
  keterbatasan waktu, cukup pasti reproduce sama karena melalui fallback
  logic yang sama persis.)
- **Root cause**: karena `ahmad`/`darimi` tidak ada di
  `HADITH_BOOK_SHORT_LABELS`, `getHadithBookShortLabel()` jatuh ke fallback
  `bookLabel.replace(/^shahih\s+/i,"")...split(/\s+/).slice(0,2).join(" ")`
  — untuk "Musnad Ahmad" tidak ada prefix yang cocok untuk di-strip
  (`shahih`/`sunan`/`jami`/`muwatha`), jadi hasilnya tetap 2 kata penuh
  "Musnad Ahmad" yang kepanjangan untuk kotak rail sempit dengan
  `numberOfLines={1}`.
- **Dampak**: kosmetik — nama kitab di kartu hadis Musnad Ahmad (dan
  kemungkinan besar Sunan Darimi) terlihat terpotong aneh, walau nama
  lengkapnya di eyebrow atas kartu ("MUSNAD AHMAD") tetap tampil benar dan
  utuh. Perbaikan sederhana: tambah 2 entri ke map (`ahmad: "Ahmad"`,
  `darimi: "Darimi"`).
- **Screenshot**: `ahmad_list.png`/`ahmad_detail.png` (tersimpan di
  scratchpad sesi, bukan folder audit resmi — reproduce ulang gampang: buka
  kitab "Musnad Ahmad" dari book shelf Modern, kotak rail kiri kartu hasil
  langsung menampilkan "MUSNAD A...").

---

## Catatan tambahan (bukan bug fungsional, tapi worth mencatat)

### C1. Data Sanad/Perawi/Takhrij kosong di semua sample yang dicoba — INFO, gap data bukan bug UI

Dicoba 4 hadis dari 4 kitab berbeda (Shahih Bukhari No. 1 & No. 5, Musnad
Ahmad No. 8, Sunan Tirmidzi, Sunan Abu Daud No. 3087) — SEMUANYA menunjukkan
"0 jalur" di tab Sanad dan "0 perawi" di tab Perawi, walau teks Arab
hadisnya sendiri jelas-jelas memuat rantai sanad lengkap (mis. Musnad Ahmad
No. 8: "حَدَّثَنَا هَاشِمُ بْنُ الْقَاسِمِ قَالَ حَدَّثَنَا اللَّيْثُ
قَالَ حَدَّثَنِي يَزِيدُ بْنُ أَبِي حَبِيبٍ..." — 5+ perawi disebut
eksplisit). UI sendiri berperilaku BENAR (menampilkan empty state yang
sesuai untuk data yang memang kosong), jadi ini bukan bug tampilan — tapi
konsekuensinya, fitur cross-reference perawi (guru/murid/jarh-tadil,
navigasi rekursif antar perawi) yang jadi salah satu nilai jual utama tab
Sanad/Perawi **tidak bisa diverifikasi end-to-end dengan data nyata** dalam
sesi ini walau sudah dicoba di 4 kitab berbeda. Kode-nya sendiri sudah
ditinjau (`renderPerawiList`, expand/collapse "Tampilkan semua (N lagi)",
`openPerawi` rekursif) dan terlihat straightforward/konsisten dengan pola
lain yang sudah terverifikasi jalan, tapi tetap PASS-by-code-inspection,
bukan PASS-dengan-data-sungguhan. Disarankan sesi lanjutan mengecek langsung
ke database/API mana hadis yang benar-benar punya baris `sanad` terisi
sebelum audit UI perawi berikutnya.

### C2. Nama tema/bab hadis dalam Bahasa Inggris, sisanya Bahasa Indonesia — INFO, konten bukan bug

Label kitab (`SHAHIH BUKHARI`, `SUNAN ABU DAUD`) dan tab/badge UI semua
Indonesia, tapi nama tema/bab per-hadis konsisten dalam Bahasa Inggris —
"Revelation", "Belief", "Knowledge", "Purification (Kitab Al-Taharah)",
"Tribute, Spoils, and Rulership (Kitab Al-Kharaj, Wal-Fai' Wal-Imarah)",
"The Book on Purification", dsb. Kemungkinan berasal dari sumber data yang
belum diterjemahkan judul babnya. Bukan bug UI (field `chapterName`/
`themeName` dari `getHadithTopicLabel()` ditampilkan apa adanya), tapi
inkonsistensi bahasa yang cukup mencolok dibanding sisa aplikasi yang
konsisten Indonesia — worth dikonfirmasi ke tim konten.

### C3. [Di luar scope Hadis, ditemukan tidak sengaja] Download offline "Kitab Hadis" di Profil → Pengaturan → Penyimpanan sama sekali tidak berfungsi — MEDIUM, PERIPHERAL

Layar Penyimpanan (`Paket Offline`) punya selector "Kitab Hadis" (9
checkbox kitab) dan tombol "Unduh update". Memilih "Shahih Bukhari"
berhasil update counter ("1 dipilih dari 9 kitab", estimasi ukuran "15.8
MB · ~7.563 hadis baru") — state selection-nya jalan. Tapi menekan **"Unduh
update" benar-benar tidak melakukan apa pun**: tidak ada progress bar, toast
error, atau perubahan apa pun pada counter "0 Surah/0 Ayat/0 Hadis/0 Kitab"
di bawahnya, bahkan setelah menunggu. Root cause (dikonfirmasi lewat kode):
`apps/mobile/src/storage/offlineContent.js` — `getOfflineOverview()`
unconditionally return `unsupportedOverview` (`supported: false`), dan
`buildOfflinePack()` unconditionally `throw new
Error(unsupportedOverview.error)`. Jadi seluruh sistem offline-pack (bukan
cuma Hadis — Quran juga kena, tapi Quran punya history terpisah soal ini di
`docs/reviews/2026-09-13-mobile-app-deep-review.md`) memang belum
diimplementasikan sungguhan di build ini, dan kegagalannya tidak pernah
di-surface ke user sebagai pesan error — sama sekali senyap. Di luar scope
audit Hadis (ini fitur Profil/Settings, bukan `HadithScreen.js`), tapi
dicatat karena selector-nya eksplisit menyebut "Kitab Hadis" dan user
mungkin mengira fitur unduh-offline-per-kitab-hadis ini benar-benar ada.

### C4. [Di luar scope Hadis, ditemukan tidak sengaja] "Perawi Hadith" di hamburger menu pakai UI generik yang jauh lebih dangkal dari panel Perawi bawaan HadithScreen — INFO, PERIPHERAL

Menu hamburger → "Perawi Hadith" (`tab:"belajar", featureKey:"perawi"`,
dikonfirmasi sesuai catatan audit sebelumnya) membuka layar "Perawi Hadis"
yang bagus — daftar 20 perawi dengan filter tabaqah (Nabi/Sahabat/Tabi'in/
dst), toggle Daftar/Bagan, search. Tapi tap salah satu perawi (dicoba
"Muhammad Rasulullah") membuka detail yang SANGAT dangkal — cuma kartu
"Info" generik berisi teks yang terlihat template-mismatch ("nabi · 11 H ·
nabi", field yang sama diulang) plus tombol "Buka sumber". Ini jelas
memakai renderer generik `FeatureCatalog`/`WebAppPerawiRoute` (untuk semua
fitur bertipe `list` di `mobileFeatures.js`), BUKAN panel Perawi kaya milik
`HadithScreen.js` sendiri (yang punya guru/murid/jarh-tadil, dsb — lihat
`openPerawi()`). Dua UI terpisah untuk konsep data yang sama (perawi) ini
mungkin memang desain (satu untuk direktori umum, satu untuk konteks
sanad-per-hadis), tapi worth dikonfirmasi ke tim produk apakah teks "nabi ·
11 H · nabi" yang berulang itu memang disengaja atau bug template. Di luar
scope Hadis screen itu sendiri, tidak diinvestigasi lebih lanjut.

---

## Checklist lengkap yang diuji (PASS kecuali disebutkan sebagai bug di atas)

### Book Shelf (Modern) / Daftar + Filter Kitab (Classic)

| Kontrol                                   | Expected                                        | Modern                                                                                | Classic                                                                           |
| ----------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Tab switcher Book/Theme/Chapter/Hadith    | Ganti mode browsing                             | ❌ **B1** (3 dari 4 tab dead)                                                         | N/A (Classic tidak punya tab ini, pakai chip filter kitab langsung)               |
| Search box                                | Filter hadis live, cari nomor/kitab/tema/teks   | ✅ PASS untuk fokus+ketik (tidak kena bug ala Quran B1); ❌ **B2** untuk cakupan data | ✅ PASS untuk fokus+ketik; ❌ **B2** juga reproduce                               |
| Search — query cocok (mis. "kepada")      | Filter ke hadis yang match saja                 | ✅ PASS (20/20 match, semua tersaring benar)                                          | ✅ PASS (20/20 match)                                                             |
| Search — query tidak cocok                | Empty state "Hadis belum ditemukan"             | ✅ PASS (pesan + hint benar)                                                          | ✅ PASS                                                                           |
| Search — clear query                      | Kembali ke daftar penuh                         | ✅ PASS                                                                               | ✅ PASS                                                                           |
| Book shelf: cover image kitab             | Tampilkan cover asli, fallback warna jika gagal | ✅ PASS (4+ kitab dicoba, cover asli ter-load dari `thollabulilmi.site`)              | N/A (Classic tidak ada book shelf grid)                                           |
| Book shelf: tombol "Buka Reader"          | Filter ke kitab terkait                         | ✅ PASS                                                                               | N/A                                                                               |
| Filter kitab chip ("Semua" + per-kitab)   | Toggle filter kitab aktif/nonaktif              | N/A (pakai book shelf, bukan chip)                                                    | ✅ PASS, termasuk tap chip yang sudah aktif → kembali ke "Semua"                  |
| List summary (nama kitab, jumlah, badge)  | Update sesuai state filter/search               | ✅ PASS                                                                               | ✅ PASS                                                                           |
| Pagination "Muat lagi" (tombol manual)    | Load halaman berikutnya, disable saat loading   | ✅ PASS (label berubah "Memuat...", count update benar, tidak dobel-fetch)            | ✅ PASS (tombol ada, meski auto-scroll biasanya sudah duluan trigger load)        |
| Infinite scroll otomatis (`onEndReached`) | Auto-load saat scroll ke bawah                  | N/A by design (Modern cuma tombol manual, `ScrollView` polos tanpa `onEndReached`)    | ✅ PASS (dikonfirmasi load berkali-kali sampai 60+ item tanpa tap tombol apa pun) |
| Scroll-to-top floating button             | Muncul setelah scroll >300px, kembali ke atas   | ✅ PASS                                                                               | N/A (tidak ada di Classic, `Screen` pakai mekanisme beda)                         |
| Pull-to-refresh                           | Reload dari halaman 0                           | Tidak dicoba eksplisit di list (dicoba di detail)                                     | ✅ PASS (reset ke 20/65.625, kembali ke state awal)                               |
| Tap kartu hadis → buka detail             | Buka Detail Hadith/Hadis                        | ✅ PASS                                                                               | ✅ PASS                                                                           |
| Kebab "Aksi" → Aksi Cepat sheet           | "Buka Detail" (+ Bookmark jika login)           | ✅ PASS (guest: cuma "Buka Detail", tidak ada baris Bookmark)                         | ✅ PASS (sama)                                                                    |
| Aksi Cepat → "Buka Detail"                | Tutup sheet, buka detail                        | ✅ PASS                                                                               | ✅ PASS                                                                           |
| Nama pendek kitab di rail kartu           | Ringkas, tidak terpotong                        | ❌ **B4** (Musnad Ahmad/Sunan Darimi terpotong)                                       | ❌ **B4** juga (kode shared, sama persis)                                         |
| Guest notice ("Buka Profil untuk...")     | Tampil untuk guest                              | N/A (tidak ada notice terpisah di Modern, cuma di Aksi Cepat)                         | ✅ PASS ("Buka Profil untuk masuk dan menyimpan bookmark hadis.")                 |

### Detail Hadis — Header & Navigasi

| Kontrol                                             | Expected                                 | Hasil                                                                                                                                               |
| --------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header custom (Modern, via `navigation.setHeader`)  | Judul "Detail Hadith" + tombol back      | ✅ PASS                                                                                                                                             |
| Tap tombol back di header (Modern)                  | Kembali ke daftar hadis                  | ✅ PASS                                                                                                                                             |
| `IconActionButton` back (Classic)                   | Kembali ke daftar hadis                  | ✅ PASS                                                                                                                                             |
| Hardware back Android — detail tanpa perawi terbuka | Keluar ke daftar hadis                   | ✅ PASS (dicoba di Modern)                                                                                                                          |
| Hardware back Android — perawi sedang terbuka       | Tutup panel perawi saja, tetap di detail | Tidak bisa dicoba live (butuh sanad data, lihat **C1**) — PASS by code inspection (`if (selectedPerawi) {...} else {...}`, logic sederhana & jelas) |
| Deep link `thullaabulilmi://hadith/<id valid>`      | Buka detail hadis terkait                | ✅ PASS (id=1 → "Sunan Abu Daud No. 3087", data lengkap benar)                                                                                      |
| Deep link `thullaabulilmi://hadith/<id invalid>`    | Pesan error / not-found                  | ❌ **B3** (fake placeholder detail, bukan error) — kedua tema                                                                                       |
| Pull-to-refresh di layar detail                     | Reload ulang detail hadis                | ✅ PASS by code inspection (`onRefresh={() => openHadith(...)}`, tidak sempat exercise eksplisit di detail karena prioritas waktu)                  |

### Detail Hadis — 6 Tab (Teks/Sanad/Perawi/Takhrij/Ayat/Catatan)

| Tab                                       | Expected                                                            | Modern                                                                                                                                                                                                       | Classic                                            |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Teks                                      | Arab, terjemahan, grade, catatan, sanad inline, Hadis Terkait       | ✅ PASS (dicoba 4+ hadis berbeda, termasuk hadis panjang dengan komentar editorial Abu Isa/At-Tirmidzi)                                                                                                      | ✅ PASS                                            |
| Sanad                                     | Daftar jalur sanad atau empty state                                 | ✅ PASS (empty state konsisten di 4 kitab, lihat **C1**)                                                                                                                                                     | ✅ PASS (empty state)                              |
| Perawi (narrators)                        | Chip perawi dari sanad, atau empty state; tap chip → panel biografi | ✅ PASS (empty state; panel biografi tidak sempat di-exercise dengan data nyata, lihat **C1**)                                                                                                               | ✅ PASS (empty state)                              |
| Takhrij                                   | Daftar rujukan takhrij atau empty state                             | ✅ PASS (empty state)                                                                                                                                                                                        | ✅ PASS (empty state)                              |
| Ayat                                      | Ayat terkait atau empty state; tap → buka Al-Qur'an                 | ✅ PASS (empty state); navigasi cross-reference PASS by code+unit-test (`openRelatedAyah` → `navigation.closeAndOpen("hadith","quran",...)`, tidak ketemu hadis dengan data ayat terisi untuk exercise live) | ✅ PASS (empty state)                              |
| Catatan                                   | `NotesPanel` jika login, guest-gating jika tidak                    | ✅ PASS ("Buka Profil untuk masuk dan menulis catatan hadis.")                                                                                                                                               | ✅ PASS                                            |
| "Hadis Terkait" (di tab Teks) — populated | Tampilkan hingga 5 hadis terkait (tema/bab/kitab fallback)          | ✅ PASS (dikonfirmasi 5 item untuk Sunan Tirmidzi, fallback ke level kitab bekerja)                                                                                                                          | Tidak dicoba terpisah (kode identik dengan Modern) |
| Tap hadis di "Hadis Terkait"              | Buka detail hadis tersebut, tab reset ke Teks                       | ✅ PASS (navigasi rekursif, konten & "Hadis Terkait" section ter-refresh benar untuk hadis baru)                                                                                                             | Tidak dicoba terpisah                              |

### Lintas Tema & Navigasi Lain

| Kontrol                                                                | Hasil                                                                                                                                                |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toggle Modern ↔ Classic (Profil → Pengaturan → Tampilan → Mode Layout) | ✅ PASS, seluruh app (termasuk Hadis) ganti tema dengan benar                                                                                        |
| Perawi Hadith (hamburger menu → Belajar hub)                           | ✅ PASS untuk navigasi masuk (list 20 perawi + filter tabaqah + search), tapi lihat **C4** untuk catatan kedalaman detail (di luar scope inti Hadis) |
| Penyimpanan → "Kitab Hadis" offline download                           | Selector kitab jalan, tapi **tombol "Unduh update" tidak berfungsi sama sekali** — lihat **C4** (di luar scope inti Hadis, ditemukan tidak sengaja)  |
| Crash check (`pidof` + `logcat FATAL`)                                 | ✅ 0 crash sepanjang sesi, termasuk setelah deep link ID invalid, toggle tema, dan navigasi rekursif perawi/hadis berulang kali                      |

---

## Prioritas Perbaikan (untuk sesi fix terpisah)

1. **B2** (search hanya mencakup hadis yang sudah di-load) — dampak
   tertinggi karena mengenai kontrol paling sering dipakai (search) dan
   memberi jawaban SALAH ("tidak ditemukan" padahal ada), bukan cuma
   fitur hilang. Perbaikan idealnya search query dikirim ke backend
   (parameter `q=` di `getHadithPage`/endpoint baru), bukan cuma filter
   client-side atas window yang sudah di-fetch.
2. **B1** (tab Theme/Chapter/Hadith mati) — tampil di layar pertama yang
   dilihat SETIAP user Modern, langsung dalam beberapa detik pertama.
   Perbaikan: implementasikan browsing per-tema/per-bab sungguhan (mirip
   `getRelatedHadiths` yang sudah punya endpoint `theme`/`chapter`), atau
   kalau belum siap, sembunyikan/nonaktifkan 2 tab itu daripada
   menampilkan tombol mati.
3. **B3** (ID hadis invalid → placeholder palsu) — perbaikan: jangan
   `catch(() => hadith)` secara senyap di `openHadith`; kalau
   `getHadithDetail` gagal DAN tidak ada data lokal (`fromList` juga
   kosong), set `message` ke pesan "Hadis tidak ditemukan" yang jelas,
   atau tampilkan state khusus not-found alih-alih fallback stub yang
   terlihat seperti hadis sungguhan.
4. **B4** (label pendek Ahmad/Darimi terpotong) — perbaikan paling
   sederhana di antara semua temuan: tambah 2 baris ke
   `HADITH_BOOK_SHORT_LABELS` (`ahmad: "Ahmad"`, `darimi: "Darimi"`).
5. **C3** (download offline Kitab Hadis senyap gagal) — di luar scope
   Hadis tapi high-visibility (ada di menu Pengaturan utama); minimal
   tampilkan toast error saat `buildOfflinePack` gagal, jangan biarkan
   tombol "Unduh update" terlihat seperti tidak merespon sama sekali.
6. **C1** (data sanad/perawi/takhrij kosong) — bukan bug kode, tapi
   rekomendasi: audit coverage data sanad terstruktur di backend/seeder
   sebelum sesi audit UI perawi berikutnya, supaya drill-down guru/murid/
   jarh-tadil bisa diverifikasi dengan data sungguhan.
7. **C2/C4** — tidak mendesak, cukup dikonfirmasi ke tim
   konten/produk untuk diskusi (istilah bahasa Inggris di nama bab, dan
   apakah 2 UI Perawi yang terpisah itu memang disengaja).

---

## Status Perbaikan (2026-09-30)

B1–B4 sudah diperbaiki di commit `c9f593f7`, semuanya diverifikasi di emulator
(bukan cuma baca kode) plus Jest (67 suite / 863 test hijau).

- **B2 → FIXED (search)**: endpoint `/api/v1/hadiths` dan
  `/api/v1/hadiths/book/:slug` sekarang menerima `q`. Angka murni = exact match
  `hadith.number`, selain itu `ILIKE` ke terjemahan, teks Arab, kitab, tema, dan
  bab. `HadithScreen` kirim query (debounce 320ms) ke server, teruskan ke
  "muat lagi", dan balik ke daftar normal saat dikosongkan. Di device: keyboard
  tetap fokus selama hasil reload, clear mengembalikan daftar. Di API lokal
  (Docker, DB asli): `q=25` di Bukhari → tepat hadis #25, `q=500` → #500,
  `kepada` → 7.423 hasil, kata ngawur → 0. **Backend harus di-deploy** supaya
  ini berlaku di produksi; dengan backend lama `q` diabaikan dan perilakunya sama
  dengan filter lokal yang lama (tidak ada regresi). Catatan: service hadis
  men-cache respons di Redis per query string penuh, jadi saat dev lokal hasil
  lama bisa nyangkut sampai Redis db 3 di-flush.
- **B1 → FIXED (tab mati)**: pill "Theme" dan "Chapter" dihapus dari book shelf
  Modern (tidak pernah punya handler dan tidak mungkin aktif). Browsing per
  tema/bab yang sungguhan tetap jadi feature request terpisah.
- **B3 → FIXED (ID invalid)**: fetch detail yang gagal tidak lagi ditelan jadi
  stub palsu. 400/404 tanpa data lokal → "Hadis tidak ditemukan."; kegagalan
  lain (mis. offline) → "Detail hadis belum bisa dimuat." dengan retry lewat
  pull-to-refresh. Hadis yang dibuka dari daftar tetap fallback ke data daftar.
  Sempat ada race (refresh mount-time menghapus `message` yang baru di-set),
  makanya state-nya dibikin dedicated (`detailFailure`).
- **B4 → FIXED (label)**: `ahmad` dan `darimi` ditambahkan; kartu tampil
  "AHMAD"/"DARIMI".

Temuan tambahan saat verifikasi, tidak diubah:

- `HADITH_BOOK_LABELS`/`HADITH_BOOK_SHORT_LABELS` memakai key `abu-daud` dan
  `ibnu-majah`, sedangkan slug API asli `abudaud` dan `ibnumajah` (map warna
  cover sudah benar). Tampilan kebetulan tetap benar lewat fallback, jadi
  kosmetik saja.
- `applicationId` sekarang `com.thullaabulilmi.app` (sebelumnya
  `com.anonymous.thullaabulilmimobile`, commit `9c909b67`). APK baru ke-install
  sebagai app terpisah, bukan update dari yang lama, dan script/brief yang masih
  menyebut id lama akan menguji app yang salah. `scripts/screenshot-features.sh`
  sudah disesuaikan.

Ditemukan saat menyapu warning (di luar scope Hadis, sudah diperbaiki di commit
`f9881000`): `go vet` menandai `model.Doa` punya dua field ber-tag
`json:"translation"`. `encoding/json` membuang KEDUANYA, sehingga respons
`/api/v1/doa` tidak punya key `translation` sama sekali dan terjemahan doa
kosong di mobile serta form share/admin web. Relasi sekarang tetap
`translation`, string legacy pindah ke `translation_text`. Produksi butuh deploy
backend untuk ini juga.
