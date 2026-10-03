# Deep Audit: Fitur Blog / Artikel (Modern & Classic) — 2026-10-03

> Audit MENDALAM (bukan sweep dangkal) satu fitur: **Blog/Artikel** (`mobileFeatures.js`
> key `"blog"`) di `apps/mobile`, mengikuti metodologi yang sama dengan
> [2026-09-30-ibadah-deep-audit.md](./2026-09-30-ibadah-deep-audit.md) dan
> [2026-10-01-belajar-hub-deep-audit.md](./2026-10-01-belajar-hub-deep-audit.md).
> Fitur ini dipilih karena memicu seluruh kampanye audit ini beberapa minggu
> lalu: user melaporkan "klik button Catatan di Blog langsung force close" di
> Redmi fisiknya. Setiap kontrol dicoba satu per satu: hub/daftar Artikel
> (pencarian, filter kategori, pagination), detail artikel (markdown, gambar,
> link sitasi hadis, meta), **investigasi Catatan/crash** (section khusus di
> bawah), Bookmark, "Buka sumber", navigasi, dark theme, Bahasa Inggris. Dua
> tema diuji: Modern (Web App) dan Classic (Paper).

**Status**: 10 bug dilaporkan (2 HIGH, 7 MEDIUM, 1 LOW). **Investigasi Catatan:
TIDAK BISA direproduksi — BLOCKED secara struktural, bukan "sudah
fixed" dan bukan "bukan bug"**: tombol Catatan **tidak pernah dirender sama
sekali** untuk artikel Blog di HEAD saat ini (Modern maupun Classic), jadi
tidak ada kontrol untuk diklik sampai crash. Akar masalah dan kronologi
lengkap ada di bagian "Investigasi Khusus" di bawah. **Tidak ada crash**
sepanjang sesi (PID `com.thullaabulilmi.app` tetap sama, 4368, dari awal
sampai akhir; `adb logcat -b crash -d` kosong dan `AndroidRuntime:E` kosong
di setiap pengecekan). Temuan paling signifikan **bukan** soal Catatan,
melainkan **B1**: link sitasi hadis di dalam artikel Blog membuka hadis yang
**salah total** (dibuktikan lewat perbandingan langsung ke API produksi).
Screenshot: `apps/mobile/output/native/2026-10-03-blog-deep-audit/*.png`.

## Status Perbaikan (sesi fix 2026-10-03, sore)

**Semua B1–B10 FIXED dan live-verified.** Investigasi Catatan **DISELESAIKAN
secara positif**, bukan lagi "blocked" — lihat update di bagian "Investigasi
Khusus" di bawah. Commit: `7471637d` (B1–B10 + Catatan via `ref_slug`),
`4ebca457` (perbaikan susulan B3 yang ketahuan saat verifikasi live sesi ini
sendiri — lihat detail di bawah). Suite mobile penuh: 94/94 suite, 1517/1517
test pass (naik dari baseline 1496 — 21 test baru/diperbarui untuk bug-bug
ini). Bukti visual before/after:
[`docs/media/before-after/2026-10-03-blog-audit-fixes/`](../media/before-after/2026-10-03-blog-audit-fixes/README.md).

| Bug | Status | Verifikasi |
| --- | --- | --- |
| B1 (hadis salah total) | **FIXED** (`7471637d`) | Live: sitasi "HR. Bukhari no. 1073" sekarang membuka hadis Bukhari No. 1073 yang benar (sebelumnya membuka "Sunan Abu Daud No. 3322 — Oaths and Vows", kitab lain sama sekali). Pasangan 03. + unit test `hadithScreen.test.js`, `client.test.js`. |
| B2 (back nyasar) | **FIXED** (`7471637d`) | `handleBlogLink` mengirim `returnTo` di 3 cabang. Test reducer langsung (`exploreClassicRenderers.test.js`) memeriksa parameter `onOpenTab`. **Tidak ada bukti visual hardware-back** — lihat alasan di README folder bukti (`BackHandler.hardwareBackPress` tidak ada di Expo web export; emulator yang berjalan pakai APK release lama tanpa Metro, rebuild native tidak dilakukan karena emulator kemungkinan dipakai sesi lain). |
| B3 (Modern tanpa bookmark) | **FIXED** (`7471637d` + perbaikan susulan `4ebca457`) | Commit pertama memasang `onLongPress` tapi lupa me-render `{renderItemActionSheet()}` di route Blog (pola yang sudah dipakai 9 kali di tempat lain) — state berubah tapi sheet tidak kelihatan. Ketahuan saat verifikasi live sesi ini sendiri, diperbaiki di commit susulan. Live-verified setelah fix kedua. Pasangan 05. |
| B4 (meta "published") | **FIXED** (`7471637d`) | Live di 3 titik (subjudul detail, kartu Classic, sheet Aksi Cepat) + baris "Rujukan: blog #uuid" disembunyikan. Pasangan 01, 02. |
| B5 ("Buka sumber" mati) | **FIXED** (`7471637d`) | Live: `window.open` terpanggil dengan `https://thollabulilmi.site/blog/panduan-lengkap-sujud-tilawah` (sebelumnya array kosong). Pasangan 06. |
| B6 (excerpt + a11y leak) | **FIXED** (`7471637d`) | Live: kartu Modern sekarang pakai `raw.excerpt` API (sebelumnya awal `body`). Pasangan 04. A11y label diverifikasi lewat kode + unit test (tidak kelihatan di screenshot). |
| B7 (Classic markdown mentah) | **FIXED** (`7471637d`) | Live: kartu Classic bersih dari "##". Pasangan 01. |
| B8 (i18n chrome detail) | **FIXED** (`7471637d`) | Live: "Kembali"→"Back", "Buka sumber"→"Open source", eyebrow grup "ILMU"→"KNOWLEDGE". Pasangan 07, 08. |
| B9 (header Modern + kategori) | **FIXED** (`7471637d`) | Live: header app bar sekarang "Islamic Articles" (sinkron dengan H1, sebelumnya "Artikel"). Kategori memilih varian `translation.en` saat tersedia, fallback ke Indonesia saat tidak (diverifikasi unit test terpisah untuk kasus yang punya `translation.en` — artikel demo di pasangan 08 kebetulan kategorinya tidak punya terjemahan Inggris di data backend, jadi screenshot itu menunjukkan fallback, bukan match). Pasangan 08. |
| B10 (tanggal hardcode id-ID) | **FIXED** (`7471637d`) | Live: "3 Oktober 2026"→"October 3, 2026" di kedua layout. Pasangan 07, 08. |

Lihat juga pembaruan status di [`docs/reviews/README.md`](./README.md) dan
entri baru di [`docs/AGENT_KNOWLEDGE.md`](../AGENT_KNOWLEDGE.md) untuk gotcha
teknis yang ditemukan sesi ini (resolusi hadis per-kitab vs id global,
pola render action sheet Modern yang mudah terlewat, dan verifikasi Catatan
butuh rebuild API lokal).

## Setup

- Build: **fresh install**, bukan hasil sesi ini. `adb shell dumpsys package
com.thullaabulilmi.app`: `firstInstallTime` 2026-10-03 14:53:54,
  `lastUpdateTime` 2026-10-03 15:04:34 (update in-place ~11 menit setelah
  install pertama) — keduanya di hari audit ini berjalan (brief menyebut "fresh release APK just installed, built
  from current HEAD" — termasuk fix Play Store readiness, perawi classic
  filter, dan commit lain dari sesi konkuren, semuanya di luar scope Blog).
  Package `com.thullaabulilmi.app`. Tidak ada rebuild oleh sesi ini.
- Emulator: `emulator-5554` (1080×2400, `sdk_gphone64_x86_64`) sudah berjalan
  saat sesi mulai. Semua perintah eksplisit `adb -s emulator-5554`. Tidak ada
  device fisik yang tersentuh (device fisik user — Redmi — memang tidak
  terhubung, sesuai arahan brief).
- Backend: API produksi `https://api.thollabulilmi.site`. Sesi **guest**
  (Tamu) sepanjang audit — tidak ada login/registrasi, sesuai batasan brief.
  Endpoint Blog: `/api/v1/blog/posts?page=0&size=20` (dari
  `apps/mobile/src/data/mobileFeatures.js:183-189`) — dataset nyata **15
  artikel total** (`total:15` dari API, lebih kecil dari `size=20`), jadi
  tidak ada kelas bug "pagination memotong data" (beda dari Dzikir/Doa di
  audit Ibadah B5).
- Akhir sesi: **dikembalikan dengan benar** — Mode Layout **Web App
  (Modern)**, Tema **Ikuti Sistem**, Bahasa **Indonesia**, font scale
  dikonfirmasi tetap `1.0` (`adb shell settings get system font_scale`), app
  ditinggal di tab **Beranda**. Device ditemukan dalam keadaan Modern di awal
  sesi (bukan Classic seperti yang diwanti-wanti brief — kemungkinan sudah
  dikembalikan sesi sebelumnya atau fresh install memakai default), jadi
  tidak perlu koreksi di awal.

## Metodologi & catatan penting

- Koordinat tap diambil dari `uiautomator dump` (native 1080×2400) via helper
  scratchpad (`sb`/`tp`/`sw`/`bk`/`dump`/`crashcheck`/`pidcheck`), bukan
  eyeball dari screenshot. Screenshot yang dibaca lewat tool Read datang pada
  resolusi tampil 900×2000 — **faktor skala ×1.2** wajib dikalikan sebelum tap
  (`displayed × 1.2 = native`); dilanggar sendiri sekali (tap meleset ke
  "Terang"/area kosong alih-alih tab Beranda) dan langsung dikoreksi dengan
  dump ulang begitu terdeteksi.
- **Temuan tooling**: `wc -l` pada hasil `uiautomator dump` HAMPIR SELALU
  melaporkan `0` (termasuk untuk dump yang **berhasil penuh**) karena XML-nya
  satu baris panjang tanpa newline — `0` dari `wc -l` **bukan** tanda dump
  gagal, itu cuma artefak format. Cara yang benar untuk mengecek dump
  berhasil: `wc -c` (ukuran byte) atau langsung `grep` pola yang dicari. Dump
  betul-betul gagal (mis. saat countdown jam atau kursor Gboard berkedip)
  menghasilkan file yang jauh lebih kecil (puluhan byte) — beda jelas dari
  dump sukses (puluhan ribu byte).
- Dua kali hardware back ditekan saat kotak cari fokus dan toolbar mengambang
  Gboard (ikon mic/backspace/centang/emoji/hamburger — bukan QWERTY penuh)
  masih terlihat → back **langsung menutup seluruh layar Artikel**, bukan
  cuma keyboard. Ini **bukan bug app**: pola yang sama persis sudah
  didokumentasikan sebagai "bukan bug" di
  [audit Ibadah](./2026-09-30-ibadah-deep-audit.md) ("KEYCODE_BACK saat
  keyboard sudah tertutup diteruskan ke app") — toolbar mengambang itu
  rupanya tidak dihitung Android sebagai IME yang "showing" sehingga back
  diteruskan ke app. Dicatat di sini juga karena muncul berkali-kali selama
  pengujian pencarian Blog.
- Root-cause dikonfirmasi lewat `curl` langsung ke API produksi (read-only)
  untuk SETIAP klaim data (jumlah artikel, field `id`/`category`/`author`
  sesungguhnya, endpoint hadis per-buku vs per-id) — bukan ditebak dari
  perilaku UI saja. Ini yang mengungkap root cause presisi untuk **B1**, **B4**,
  dan **B6**.
- `git log -S'canAddNote'` dan `git show <commit> -- <file>` dipakai untuk
  melacak kapan kondisi yang menyembunyikan tombol Catatan untuk Blog
  diperkenalkan (`983775bf`, 2026-09-29 09:30) — teknik yang sama seperti
  "APK-era vs HEAD" di audit Belajar hub, tapi di sini dipakai untuk
  membandingkan **commit vs commit** guna merekonstruksi sejarah satu
  kondisi boolean, bukan APK vs source.

---

## Investigasi Khusus: Tombol Catatan di Blog (alasan audit ini ada)

> **Update sesi fix 2026-10-03 (sore), commit `7471637d`:** Catatan untuk
> Blog **berhasil diaktifkan kembali dan diverifikasi end-to-end**, bukan lagi
> "blocked". Backend sudah lebih dulu menambahkan dukungan `ref_type:
> "article"` + `ref_slug` pada Notes (commit `3e3b52e7`/`2717c551`, paralel
> dengan pola Bookmark yang sudah ada). Sisi mobile: `mobileFeatures.js`
> mendeklarasikan `refType: "article"` untuk fitur Blog (sebelumnya tidak ada
> field ini sama sekali, sehingga jatuh ke `feature.key` = `"blog"`, tidak
> pernah match whitelist manapun); `canAddNote` (`ExploreClassicRenderers.js`)
> mendapat cabang baru — `ref.refType === "article"` DENGAN syarat slug tidak
> kosong — berdampingan dengan whitelist numerik lama (`ayah/hadith/
> library/library_book`) yang tidak diubah; `NotesPanel`/`createNote`/
> `getNotes` (`api/personal.js`) mengirim `ref_slug` alih-alih `ref_id` saat
> tersedia. Diverifikasi live lewat Expo web export dengan akun admin seed
> lokal: tombol "Catatan" muncul di layar detail artikel, panel terbuka,
> menulis dan menyimpan catatan berhasil ("✓ Berhasil — Catatan disimpan."),
> dan dikonfirmasi tersimpan di backend lewat `curl` langsung
> (`GET /api/v1/notes?ref_type=article&ref_slug=...`) sebelum dibersihkan
> lagi. Detail lengkap + screenshot: pasangan 09 di
> [`docs/media/before-after/2026-10-03-blog-audit-fixes/README.md`](../media/before-after/2026-10-03-blog-audit-fixes/README.md).
> Keputusan produk yang direkomendasikan di bagian "Kesimpulan investigasi"
> di bawah (apakah Blog seharusnya bisa diberi catatan) **sudah dijalankan**:
> dibuka kembali lewat jalur slug, bukan dipertahankan tertutup. Narasi asli
> di bawah ini **dipertahankan apa adanya** sebagai catatan sejarah investigasi
> (akar masalah dan kronologi masih akurat untuk menjelaskan MENGAPA tombolnya
> hilang sebelum fix ini).

**Hasil (sebelum fix sesi ini): TIDAK BISA direproduksi karena kontrolnya
sendiri tidak ada — BLOCKED secara struktural pada HEAD saat itu, bukan
"fixed" dan bukan "bukan bug".**

### Apa yang sebenarnya terjadi di kode

Layar detail artikel (dipakai bersama oleh Modern & Classic — fungsi
`renderDetailScreen` di `apps/mobile/src/screens/explore/ExploreClassicRenderers.js:952`,
meski nama filenya "Classic") hanya menampilkan tombol **Catatan** jika
`canAddNote` bernilai true:

```js
// apps/mobile/src/screens/explore/ExploreClassicRenderers.js:956-959
const canAddNote =
    ["ayah", "hadith", "library", "library_book"].includes(ref.refType) &&
    Number.isFinite(Number(ref.refId)) &&
    Number(ref.refId) > 0;
```

`ref.refType` untuk Blog dihasilkan oleh `getItemRef`
(`apps/mobile/src/screens/ExploreScreen.helpers.js:987-1001`):
`feature?.refType ?? feature?.key ?? "explore"`. Konfigurasi Blog di
`apps/mobile/src/data/mobileFeatures.js:183-189` **tidak** mendefinisikan
`refType`, jadi `ref.refType` jatuh ke `feature.key` = **`"blog"`** —
yang **tidak ada** di whitelist `["ayah", "hadith", "library",
"library_book"]`. Akibatnya `canAddNote` selalu `false` untuk artikel Blog,
di KEDUA tema (fungsi detailnya sama persis), dan baris ini:

```js
// apps/mobile/src/screens/explore/ExploreClassicRenderers.js:1486-1507
<View style={styles.detailActions}>
    {canAddNote && activeFeature?.type !== "feed" ? (
        <ActionPill Icon={StickyNote} ... label='Catatan' .../>
    ) : null}
    <ActionPill Icon={ExternalLink} label='Buka sumber' onPress={...} />
</View>
{canAddNote && activeNoteRef === noteKey ? (
    <NotesPanel refType={ref.refType} refId={ref.refId} />
) : null}
```

...tidak pernah merender tombol Catatan maupun `<NotesPanel>` untuk Blog.
**Dikonfirmasi live**: screenshot `011-article-detail-top.png` dan
`012-article-scrolled-mid.png` (Modern) serta `031-classic-article-detail.png`
dan `032-classic-detail-bottom.png` (Classic) — baris aksi di bawah artikel
HANYA berisi "Buka sumber", tidak ada "Catatan" di kedua tema.

### Kronologi: kapan dan kenapa tombol ini hilang

Sebelum commit `983775bf` ("feat(mobile+api): implement Phase 1-3
performance, caching, security & resilience optimizations", **2026-09-29
09:30:19**), syarat render tombol Catatan hanyalah
`activeFeature?.type !== "feed"` — Blog (tipe `"list"`) **lolos syarat ini**,
jadi tombol Catatan **memang tampil** untuk artikel Blog sebelum tanggal
tersebut. Commit yang sama inilah yang memperkenalkan whitelist
`canAddNote` di atas, secara eksplisit MENGECUALIKAN `"blog"`. Commit ini
juga tanggal **4 hari sebelum** audit ini berjalan — artinya **sejak Senin
lalu, tidak ada build apa pun (termasuk APK yang beberapa sesi audit
sebelumnya pakai) yang masih bisa memicu tombol Catatan untuk Blog.**

Mengapa `"blog"` dikecualikan (bukti dari API produksi, bukan tebakan):
`id` artikel Blog adalah **UUID string**
(`"958fe3e3-f7f5-42d7-be14-401b34fc249d"`, dikonfirmasi lewat
`curl https://api.thollabulilmi.site/api/v1/blog/posts`), sedangkan model
backend untuk Notes dan Bookmark keduanya mewajibkan **`int`**:
`services/api/app/model/note.go:17` (`RefID int`) dan
`services/api/app/model/bookmark.go:18` (`RefID int ... gorm:"not null"`).
Mengirim UUID string ke field JSON ber-tipe `int` akan gagal di-unmarshal
backend — kelas masalah yang **sama persis** dengan yang dicatat sudah
pernah terjadi di commit jauh lebih lama, `cbb00714` (2026-09-12): "`getItemRef()`
built ref_id as a String, but the backend's Bookmark/Note models require an
int ... Now sends a Number." Pola ini sangat mendukung dugaan: `canAddNote`
adalah **guard yang disengaja** terhadap crash/error kelas ini untuk tipe
konten yang ID-nya bukan integer bersih (Blog pakai UUID) — bukan regresi
tak sengaja.

### Yang sudah dicoba untuk mencari jalan lain ke Catatan — semua nihil

1. **Action row di layar detail** (kedua tema) — hanya "Buka sumber", lihat
   di atas.
2. **Long-press / kebab di kartu daftar Modern** (`WebAppBlogRoute.js`,
   `BlogCard` baris 17-104) — **tidak ada** `onLongPress` sama sekali, beda
   dengan rute Modern lain (`WebAppReferenceListRoute` dkk. di
   `ExploreWebAppRoutes.js` yang mewarnai belasan baris dengan
   `onLongPress={() => setItemActionSheet(...)}`). Modern/Blog memang tidak
   mungkin memicu action sheet apa pun dari daftar (lihat juga **B3**).
3. **Long-press / kebab di kartu daftar Classic** — **ADA** ("Aksi Cepat"
   via tombol "⋮", `renderDefaultListCard`,
   `ExploreClassicRenderers.js:656-680`), dicoba live
   (`027-classic-aksi-sheet.png`): sheet-nya hanya berisi **"Buka Detail"**
   dan **"Bookmark"** — tidak ada opsi Catatan di sana juga.
4. **Deep link** — `grep -n "blog\|notes\|catatan"
apps/mobile/src/utils/deepLinks.js` nihil total; tidak ada target deep link
   yang membuka `view=notes` untuk fitur apa pun, apalagi Blog secara
   spesifik.
5. **Baca `NotesPanel.js` baris-per-baris (339 baris) untuk petunjuk "layout
   tinggi negatif"** yang disebut sesi sebelumnya — **tidak ditemukan
   perhitungan tinggi dinamis sama sekali**. Semua style (`panel`, `input`,
   `note`, dst.) di `apps/mobile/src/components/NotesPanel.js:228-339` adalah
   `StyleSheet.create` statis (`marginTop`, `paddingTop`, `minHeight: 86`
   pada `TextInput`) — tidak ada `Dimensions.get`, tidak ada pengurangan
   (`-`) yang bisa menghasilkan nilai negatif, tidak ada `flex` yang
   dihitung dari variabel runtime. Dua situs pemakaian `NotesPanel` lain yang
   masih hidup di app (`HadithScreen.js:1908`, dibungkus `<Card>`;
   `QuranScreenRenderers.js:2129` dibungkus `<Card>` dan `:2284` dibungkus
   `<AppModalSheet>`) juga tidak memberi height eksplisit ke `NotesPanel`.
   **Tidak ada bukti di source saat ini** untuk hipotesis "tinggi negatif"
   — tapi karena jalur Blog→Catatan itu sendiri sudah tidak ada sejak
   `983775bf`, kode yang dirender pun sudah berbeda dari apa yang
   kemungkinan dilihat sesi sebelumnya (jika sesi itu memakai APK yang lebih
   tua dari 29 September).

### Kesimpulan investigasi

- **Crash TIDAK direproduksi** — bukan karena sudah "fixed" dengan sengaja
  menutup bug itu, melainkan karena **kontrol yang memicunya sudah tidak
  pernah dirender** untuk Blog sejak `983775bf` (29 September), jauh sebelum
  audit ini maupun laporan user asli kemungkinan terjadi.
- **Temuan "layout NotesPanel tinggi negatif" dari sesi sebelumnya TIDAK
  BISA dikonfirmasi ulang** di sini karena panel itu sendiri tidak bisa
  dibuka untuk Blog di HEAD — bukan disangkal, hanya tidak bisa diverifikasi
  dengan source saat ini. Pembacaan source `NotesPanel.js` sendiri (statis,
  tanpa kalkulasi dinamis) membuat hipotesis itu kurang mungkin **untuk versi
  komponen saat ini**, tapi tidak bisa 100% dikesampingkan untuk versi lama.
- **Butuh salah satu dari berikut untuk menuntaskan investigasi ini
  sepenuhnya**: (a) device fisik Redmi milik user (untuk membedakan
  crash device-specific vs regresi yang sudah tertutup), atau (b) APK/commit
  dari SEBELUM `983775bf` (2026-09-29 09:30) dijalankan ulang secara
  terkontrol untuk melihat apakah tombol Catatan + `NotesPanel` pada versi
  itu benar menghasilkan layout/renderer yang rusak dan/atau crash.
- **Rekomendasi untuk tim produk** (bukan klaim bug, murni observasi): status
  `canAddNote` saat ini berarti **Blog adalah satu-satunya tipe konten
  `"list"` yang sama sekali tidak bisa diberi catatan pribadi** — baik ini
  dipertahankan (karena UUID vs int) atau dibuka kembali (dengan backend
  Notes/Bookmark diubah menerima `ref_id` string, atau Blog diberi surrogate
  key integer), keputusan ini sebaiknya didokumentasikan secara sadar, bukan
  menjadi efek samping commit performa yang tidak disebutkan di pesan
  commit-nya.

---

## Temuan Bug

### B1. [Modern & Classic] Link sitasi hadis di dalam artikel Blog membuka hadis yang SALAH TOTAL — HIGH — ✅ FIXED (`7471637d`)

- **Lokasi**: `apps/mobile/src/screens/explore/ExploreClassicRenderers.js`
  `handleBlogLink` (sekitar baris 979-990, cabang `hadithMatch`):
  `js
    const hadithMatch = cleanUrl.match(/^\/hadith\/([a-zA-Z0-9_-]+)\/(\d+)/i);
    if (hadithMatch && onOpenTab) {
        const hadithNumber = Number(hadithMatch[2]);
        onOpenTab("hadith", {
            bookSlug: hadithMatch[1].toLowerCase(),
            hadithNumber,
            hadithId: hadithNumber,
        });
    }
    `
  dikonsumsi oleh `apps/mobile/src/screens/HadithScreen.js` (sekitar baris
  1217-1225) yang HANYA membaca `params.hadithId` dan mencocokkannya ke
  `item.id` (primary key global), tidak pernah memanggil endpoint
  per-buku+nomor yang sebenarnya tersedia:
  `services/api/app/http/routes.go:426`
  (`master.Get("/hadiths/book/:slug/number/:number",
newHadithController.FindByBookSlugNumber)`).
- **Expected**: menyitir "HR. Abu Dawud no. 1414" di artikel membuka hadis
  Abu Dawud nomor 1414 (hadis doa sujud tilawah riwayat Aisyah).
- **Actual**: **WRONG BEHAVIOR, 100% reproducible, dibuktikan lewat
  perbandingan langsung ke API produksi**. Artikel "Panduan Lengkap Sujud
  Tilawah" (markdown sumber: `[HR. Abu Dawud no. 1414](/hadith/abu-daud/1414)`,
  dikonfirmasi lewat `curl` ke `/api/v1/blog/posts`), tap link tersebut di
  device → membuka **"Sunan Abu Daud No. 1201 — Prayer (Kitab Al-Salat):
  Detailed Rules of Law about the Prayer during Journey"** — hadis tentang
  sholat safar, SAMA SEKALI tidak berhubungan dengan sujud tilawah.
  Dikonfirmasi lewat API: `GET /api/v1/hadiths/1414` (lookup by **global id**)
  mengembalikan persis hadis "No. 1201" yang tampil di layar; sedangkan
  endpoint yang BENAR, `GET /api/v1/hadiths/book/abudaud/number/1414`
  (lookup **per-buku+nomor**), mengembalikan hadis yang **benar-benar
  dikutip** di artikel (teks "Sajada wajhiya lilladzii khalaqahu..." cocok
  persis dengan kutipan di body artikel).
- **Root cause**: `handleBlogLink` memperlakukan nomor sitasi per-buku
  ("Abu Dawud no. 1414") sebagai **ID database global** (`hadithId:
hadithNumber`), padahal keduanya adalah ruang penomoran yang berbeda total
  — hadis dengan id global 1414 kebetulan adalah hadis per-buku nomor 1201
  di kitab yang sama. Backend sudah punya endpoint yang benar
  (`/hadiths/book/:slug/number/:number`) tapi tidak pernah dipanggil dari
  jalur ini.
- **Temuan sekunder yang memperparah** (dicatat sebagai bagian dari akar
  masalah, bukan bug terpisah): slug buku di markdown artikel ("abu-daud",
  pakai tanda hubung) **juga tidak cocok** dengan slug asli di backend
  ("abudaud", tanpa tanda hubung) — `GET
/api/v1/hadiths/book/abu-daud/number/1414` membalas 404. Jadi walau
  `handleBlogLink` diperbaiki untuk memanggil endpoint per-buku+nomor, slug
  di konten Abu Dawud juga perlu dikoreksi (slug Bukhari di konten sudah
  cocok: "bukhari" ↔ "bukhari", jadi ini bukan masalah semua buku, hanya Abu
  Dawud yang teridentifikasi sejauh ini).
- **Dampak**: artikel ini sendiri punya **26 link sitasi hadis**; untuk app
  yang audiensnya belajar agama, menampilkan hadis yang salah di balik
  sitasi yang terlihat meyakinkan ("HR. Abu Dawud no. 1414" dengan teks
  terjemahan yang benar persis di artikel) berisiko menyesatkan pemahaman
  user tentang dalil yang sedang dibahas.
- **Saran fix**: ubah `handleBlogLink`'s hadith branch untuk memanggil
  `/api/v1/hadiths/book/:slug/number/:number` (sudah ada di backend) alih-alih
  menyamakan nomor kutipan dengan id global; sekalian audit/koreksi slug
  "abu-daud" → "abudaud" di seeder/CMS konten Blog.
- **Screenshot**: `013-after-tap-buka-sumber.png` (artikel sebelum tap, teks
  kutipan "HR. Abu Dawud no. 1414" terlihat), `015-after-tap-hadith-link.png`
  (hasil: "Sunan Abu Daud No. 1201", topik berbeda total).
- **Addendum — slug "abu-daud" → "abudaud" dikoreksi**: dikonfirmasi ulang
  langsung ke API produksi (`GET
  /api/v1/hadiths/book/abudaud/number/1414` → 200, slug asli di respons
  `"book":{"slug":"abudaud",...}`; `/book/abu-daud/...` → 404). Ditemukan
  **23 occurrence** total dari pola `/hadith/abu-daud/<nomor>` di dua seeder
  konten Blog (`services/api/app/db/migrations/seeder_tier4_blog_articles.go`,
  22, dan `seeder_tier4.go`'s `seedBlogPosts`, 1) — semua diganti ke
  `/hadith/abudaud/<nomor>` secara literal (nomor kutipan itu sendiri sudah
  benar per artikel, dikonfirmasi lewat spot-check 6 nomor acak ke API
  produksi, semua 200). Karena seeder di proyek ini **insert-only** (lihat
  entry terkait di [`AGENT_KNOWLEDGE.md`](../AGENT_KNOWLEDGE.md)), 8 baris
  `blog_post.content` dan 8 baris `translation.description_idn` yang sudah
  ter-seed di Postgres dev lokal juga ditambal langsung (UPDATE
  ter-verifikasi lewat dry-run transaksi yang di-rollback dulu, baru
  commit). **Residual kecil, sengaja tidak disentuh**: 14 baris
  `content_embeddings.chunk_text` (index pencarian semantik turunan, bukan
  sumber konten) masih menyimpan teks lama — bukan mekanisme yang dipakai
  B1 (link sitasi tidak membaca tabel ini), akan ikut benar sendiri begitu
  pipeline embedding re-index ulang. **Database produksi belum disentuh**
  sama sekali (di luar scope "local dev only" sesi ini) — konten Blog yang
  live di `https://api.thollabulilmi.site` masih mengandung slug salah
  sampai proses deploy/migrasi data yang sesuai dijalankan terpisah.

### B2. [Modern & Classic] Hardware back setelah tap link sitasi dari Blog TIDAK kembali ke artikel — nyasar ke daftar kitab Hadis — HIGH — ✅ FIXED (`7471637d`, lihat catatan "tidak ada bukti visual" di README bukti)

- **Lokasi**: `apps/mobile/src/navigation/appNavigation.js`, `openTabState`
  baris 111-115 — `returnRoutes[tab]` hanya diisi jika pemanggil mengirim
  `params.returnTo` secara eksplisit:
    ```js
    if (params?.returnTo && !params?.view) {
        next.returnRoutes[tab] = params.returnTo;
    } else {
        delete next.returnRoutes[tab];
    }
    ```
    `handleBlogLink` (`ExploreClassicRenderers.js`, cabang hadith/quran/doa,
    sekitar baris 972-994) memanggil `onOpenTab("hadith", {...})` **tanpa**
    `returnTo`/`returnTab` sama sekali, sehingga `returnRoutes["hadith"]`
    dihapus, bukan diisi.
- **Expected**: dari artikel Blog, tap link sitasi → buka Hadis → hardware
  back → kembali ke artikel Blog yang tadi dibaca, di posisi scroll yang
  sama (pola yang sama seperti fix "Khatam→Profil→Back" yang sudah ada di
  app, disebut di
  [audit Belajar hub](./2026-10-01-belajar-hub-deep-audit.md)).
- **Actual**: **WRONG BEHAVIOR, 100% reproducible**. Dari artikel "Panduan
  Lengkap Sujud Tilawah", tap sitasi hadis manapun → `activeTab` berpindah
  penuh ke `"hadith"` (bottom nav ikut highlight "Hadis") → tekan hardware
  back sekali → mendarat di **layar daftar kitab Hadis** ("Kitab"/"Hadis"
  tab, daftar Shahih Bukhari/Muslim/Sunan Abu Daud/dst.) — BUKAN kembali ke
  artikel, BUKAN kembali ke daftar Artikel, bahkan bukan ke hub Belajar.
  Satu-satunya cara kembali ke artikel adalah navigasi manual penuh dari
  awal (tab Belajar → Artikel → scroll/cari ulang → buka ulang artikel).
- **Root cause**: lihat kode di atas — mekanisme `returnTo` sudah ada dan
  dipakai fitur lain, tapi `handleBlogLink` tidak pernah mengisinya untuk
  ketiga jenis link yang ia tangani (hadith/quran/doa).
- **Dampak**: artikel dengan banyak sitasi (lazimnya artikel fiqh/hadis)
  pasti kehilangan pembaca di tengah jalan begitu satu link dicoba; tidak
  ada indikasi visual bahwa "tempat kembali" telah hilang sampai back
  ditekan.
- **Saran fix**: sertakan `returnTo: { tab: "belajar", params: { featureKey:
"blog" } }` (atau mekanisme serupa yang dipakai Khatam) di ketiga cabang
  `handleBlogLink`.
- **Screenshot**: `015-after-tap-hadith-link.png` → `016-back-to-article.png`
  (hasil back: daftar kitab Hadis, bukan artikel).

### B3. [Modern] Blog sama sekali tidak punya cara untuk di-bookmark — tidak ada long-press, kebab, atau tombol aksi — MEDIUM — ✅ FIXED (`7471637d` + perbaikan susulan `4ebca457`)

- **Lokasi**: `apps/mobile/src/screens/explore/WebAppBlogRoute.js`,
  komponen `BlogCard` (baris 17-104) — `Pressable` hanya diberi
  `onPress={() => onOpen(item)}`, **tidak ada** `onLongPress`. Bandingkan
  rute Modern lain seperti `WebAppReferenceListRoute`-style di
  `apps/mobile/src/screens/explore/ExploreWebAppRoutes.js` yang mewarnai
  `onLongPress={() => setItemActionSheet({ visible: true, item })}` di
  banyak tempat (baris 325, 583, 872, 1215, 1535, 1937, 2299). Layar detail
  (shared, `ExploreClassicRenderers.js:1486-1504`) juga tidak punya tombol
  Bookmark tersendiri — Bookmark hanya pernah dipasang lewat action sheet
  "Aksi Cepat" dari daftar.
- **Expected**: user bisa men-tap-tahan (atau tombol serupa) sebuah artikel
  di daftar Blog Modern untuk memunculkan opsi Bookmark, seperti fitur list
  lain.
- **Actual**: **WRONG BEHAVIOR, reproducible**. Di Modern, tap-tahan kartu
  artikel tidak memunculkan apa pun (dicoba live); tidak ada ikon "⋮" di
  kartu; layar detail Blog hanya punya "Buka sumber" (lihat **B5**). Sebagai
  pembanding, **Classic** (fitur sama, kode berbeda jalur render) PUNYA
  tombol "⋮" di tiap kartu (`renderDefaultListCard`,
  `ExploreClassicRenderers.js:656-680`, `onMenuPress`) yang membuka "Aksi
  Cepat" berisi "Buka Detail" + "Bookmark" — dicoba live, berfungsi benar
  (lihat Checklist, PASS dengan pesan login).
- **Root cause**: `WebAppBlogRoute.js` adalah komponen Modern khusus-Blog
  (bukan `WebAppReferenceListRoute` generik yang dipakai fitur lain), dan
  pembuatnya tidak menambahkan wiring `onLongPress`/`setItemActionSheet`
  yang didapat fitur lain "gratis" lewat komponen generik tersebut.
- **Dampak**: salah satu dari dua tema utama app (yang justru diposisikan
  sebagai "opt-in" lebih modern) membuat fitur Bookmark untuk Blog
  benar-benar tidak terjangkau, bukan cuma ter-gate login.
- **Saran fix**: tambahkan `onLongPress` ke `BlogCard` yang memicu
  `setItemActionSheet`, atau tambahkan tombol Bookmark eksplisit di action
  row layar detail (berlaku untuk semua tipe konten, bukan cuma Blog).
- **Screenshot**: tidak ada efek untuk didokumentasikan di Modern (negative
  result); pembanding Classic: `027-classic-aksi-sheet.png`,
  `030-bookmark-result.png`.
- **Addendum (ditemukan & ditutup setelah fix awal landed)**: membuka entry
  point ini membuat sebuah bug backend-compat yang sebelumnya *unreachable*
  jadi reachable — `api/personal.js`'s `addBookmark()` selalu mengirim
  `ref_id` (UUID string untuk Blog) dan tidak pernah mengirim `ref_slug`,
  padahal backend mewajibkan `ref_slug` untuk `ref_type: "article"`. Semua
  audit sebelumnya cuma menguji jalur ini sebagai **guest** (pesan login,
  POST sungguhan tidak pernah terkirim), jadi gak pernah ketahuan. Kalau B3
  di-ship tanpa ini, user yang SUDAH login akan dapat 400 begitu tap
  "Bookmark" dari sheet "Aksi Cepat" — downgrade dari "fitur tidak ada" jadi
  "fitur ada tapi rusak". Diperbaiki: `addBookmark` sekarang menerima
  `refSlug` dan mengirim `{ ref_type, ref_slug }` (tanpa `ref_id`) saat
  tersedia, persis pola `createNote` yang sudah dibuat sesi ini;
  `toggleBookmark` (`ExploreScreen.js`) mengisi `refSlug` dari
  `getBlogRaw(item)?.slug`. Detail lengkap:
  [`AGENT_KNOWLEDGE.md`](../AGENT_KNOWLEDGE.md#bookmark-untuk-blogartikel-mobile-addbookmark-masih-mengirim-ref_id-non-numerik-belum-pernah-diuji-dengan-akun-login--fixed-2026-10-03).
  Test baru: `api-personal.test.js`, full suite 94/94 / 1518/1518 tetap
  hijau. Tidak ada screenshot baru (perubahan ini di lapisan request API,
  bukan UI — UI-nya sendiri sudah dibuktikan lewat `030-bookmark-result.png`
  di atas, untuk Classic/guest).

### B4. [Modern & Classic] Info artikel menampilkan status mentah "published", bukan penulis/tanggal — MEDIUM — ✅ FIXED (`7471637d`)

- **Lokasi**: `apps/mobile/src/api/explore.js`, `normalizeExploreItem`
  (dipakai oleh SEMUA fitur tipe list lewat `getFeatureItemPage`, baris
  346-369), konstruksi `meta` baris 307-317:
    ```js
    const meta = pickText(
        item?.type,
        item?.category,
        item?.occasion,
        item?.source,
        item?.author,
        item?.label,
        item?.ref_type,
        item?.status,
        item?.date,
    );
    ```
    `pickText` hanya menerima nilai ber-tipe **string**. Untuk Blog,
    `item.category` dan `item.author` adalah OBJECT (`{id, name, slug, ...}`
    dan semacamnya, dikonfirmasi dari `curl` API), jadi keduanya dilewati;
    `item.status` adalah string **`"published"`** dan menang.
- **Expected**: info artikel menampilkan penulis dan/atau tanggal publikasi
  (sudah tersedia dan tampil benar di KARTU DAFTAR via `getBlogAuthor`/
  `formatBlogDate` yang terpisah) — bukan status mentah backend.
- **Actual**: **WRONG BEHAVIOR, 100% reproducible, 2 lokasi berbeda di
  layar yang sama**. Buka artikel apa pun → subjudul tepat di bawah judul
  menampilkan **"published"** (bukan "Admin · 3 Oktober 2026"); scroll ke
  bawah, panel "Info" menampilkan **"published"** lagi persis sama, diikuti
  "Rujukan: blog #958fe3e3-f7f5-42d7-be14-401b34fc249d" (UUID internal
  mentah ditampilkan ke user). Di Classic, string sama juga muncul sebagai
  badge di kartu daftar DAN sebagai subjudul sheet "Aksi Cepat".
- **Root cause**: lihat kode di atas — field `meta` generik tidak dirancang
  untuk tipe data `category`/`author` berupa object; fallback jatuh ke
  `status`.
- **Dampak**: info yang paling berguna di layar detail (siapa penulisnya,
  kapan ditulis) hilang total, digantikan string teknis yang tidak berarti
  apa-apa bagi user.
- **Saran fix**: untuk fitur Blog, isi `meta` dari `getBlogAuthor`+
  `formatBlogDate` yang sudah ada (bukan dari `normalizeExploreItem` generik);
  atau di `pickText`, tangani `object` dengan mengambil `.name`/`.title`
  dulu sebelum jatuh ke `status`.
- **Screenshot**: `011-article-detail-top.png` (subjudul "published"),
  `012-article-scrolled-mid.png` (panel Info), `025-classic-blog-list.png`
  (badge di kartu Classic), `027-classic-aksi-sheet.png` (subjudul sheet).

### B5. [Modern & Classic] "Buka sumber" adalah SATU-SATUNYA tombol aksi di artikel Blog, dan tombol itu tidak melakukan apa pun — MEDIUM — ✅ FIXED (`7471637d`)

- **Lokasi**: `apps/mobile/src/screens/ExploreScreen.js`, `openSource`
  (baris 1158-1196):
  `js
    const sourceUrl = raw.source_url || raw.url || raw.link;
    if (sourceUrl) { ... return; }
    const refType = raw.ref_type; // undefined untuk Blog
    // ...cabang ref_type==="hadith"/"ayah", lalu raw.source...
    `
  Objek mentah artikel Blog (dikonfirmasi dari API) berisi field:
  `id, author_id, category_id, title, slug, excerpt, content, cover_image,
status, published_at, view_count, author, category, tags,
translation_id, translation` — **tidak satu pun** dari
  `source_url`/`url`/`link`/`ref_type`/`ref_id`/`source` ada di sana.
- **Expected**: tombol "Buka sumber" melakukan sesuatu yang berguna (buka
  versi web artikel, atau disembunyikan kalau tidak relevan).
- **Actual**: **WRONG BEHAVIOR, 100% reproducible**. Screenshot sebelum dan
  sesudah tap "Buka sumber" identik byte-for-byte (`before-tap-buka-sumber.png`
  vs `013-after-tap-buka-sumber.png`) — tidak ada navigasi, tidak ada toast
  error, tidak ada apa pun. Karena **B3** membuat Bookmark juga tidak
  terjangkau di Modern dan Catatan tidak pernah dirender untuk Blog (lihat
  Investigasi Khusus), tombol mati ini adalah **satu-satunya** kontrol yang
  tersedia di bawah artikel.
- **Root cause**: semua kondisi di `openSource` gagal untuk objek Blog;
  fungsi selesai tanpa melakukan apa pun dan tanpa fallback.
- **Dampak**: kelas bug yang sama dengan "Konversi Tanggal" Hijriah (B11 di
  [audit Ibadah](./2026-09-30-ibadah-deep-audit.md)) — kontrol yang terlihat
  interaktif tapi 100% tidak berfungsi, untuk fitur yang justru sudah
  kehilangan opsi aksi lain.
- **Saran fix**: beri Blog `raw.source_url` yang menunjuk ke versi web
  artikel (`https://thollabulilmi.site/blog/<slug>`), atau sembunyikan
  tombol ini kalau memang tidak ada sumber eksternal yang relevan untuk
  Blog.
- **Screenshot**: `before-tap-buka-sumber.png`, `013-after-tap-buka-sumber.png`
  (identik).

### B6. [Modern] Cuplikan daftar artikel memakai awal isi penuh, bukan excerpt API — dan seluruh isi artikel bocor ke accessibility label kartu — MEDIUM — ✅ FIXED (`7471637d`)

- **Lokasi**: `apps/mobile/src/screens/ExploreScreen.helpers.js`,
  `getBlogExcerpt` (baris 806-823):
  `js
    return stripHtmlText(
        stripMarkdownText(
            pickText(
                item.body, // <- dicek PALING DULU
                translation.excerpt_idn,
                translation.excerpt_en,
                translation.description_idn,
                translation.description_en,
                raw.excerpt,
                raw.summary,
                raw.description,
            ),
        ),
    );
    `
  `item.body` untuk artikel nyata SELALU terisi (memetakan field `content`
  penuh), jadi `pickText` berhenti di situ dan `raw.excerpt` —
  field yang memang disediakan API khusus untuk preview
  (`"excerpt":"Penjelasan lengkap fiqh sujud tilawah: hukum jumhur
ulama..."`) — **tidak pernah dipakai sama sekali**.
- **Expected**: cuplikan kartu memakai `excerpt` yang ditulis khusus untuk
  preview; teks penuh artikel tidak ikut masuk ke string yang sama.
- **Actual**: **WRONG BEHAVIOR, reproducible**. Kartu "Panduan Lengkap Sujud
  Tilawah" menampilkan "Pengertian dan Hukum Sujud Tilawah. Sujud Tilawah
  (…) adalah sujud satu kali…" — ini adalah AWAL dari field `content` (markdown
  "## Pengertian dan Hukum Sujud Tilawah\n\nSujud Tilawah..." setelah
  `stripMarkdownText`), BUKAN isi `excerpt` API yang sebenarnya ("Penjelasan
  lengkap fiqh sujud tilawah: hukum jumhur ulama, daftar 15 ayat sajdah…").
  Secara visual tetap terbaca (karena `numberOfLines={2}` memotongnya), TAPI
  `uiautomator dump` atas kartu yang sama menunjukkan `content-desc`
  (accessibility label untuk TalkBack) berisi **SELURUH** artikel —
  termasuk 15 daftar ayat sajdah, seluruh doa Arab/Latin, dan tanda markdown
  sisa seperti `*Asma' binti Abu Bakar (Dzatun Nithaqain):*` — karena
  `numberOfLines` hanya memotong tampilan visual, bukan string yang
  sebenarnya dipegang `<Text>`.
- **Root cause**: urutan prioritas `pickText` di atas; `item.body` tidak
  pernah dipotong panjangnya sebelum dipakai sebagai fallback.
- **Dampak**: (1) cuplikan yang ditampilkan tidak sesuai niat penulis
  konten (beda kalimat dari `excerpt` yang sengaja ditulis ringkas); (2)
  pengguna TalkBack/screen-reader mendapat SATU kartu dibacakan sepanjang
  seluruh artikel (ribuan karakter) alih-alih satu-dua kalimat ringkas —
  membuat daftar 15 artikel nyaris tidak terpakai lewat pembaca layar.
- **Saran fix**: urutkan ulang `pickText` agar `raw.excerpt`/`raw.summary`/
  `translation.excerpt_*` dicek LEBIH DULU, baru fallback ke potongan
  pendek (`item.body.slice(0, 160)`) jika semuanya kosong; secara terpisah,
  beri `BlogCard` `accessibilityLabel` eksplisit yang pendek (judul +
  kategori) alih-alih membiarkan RN menggabungkan semua children `<Text>`.
- **Screenshot**: `001-blog-list-modern.png` (cuplikan yang tampil), bukti
  accessibility di `/tmp/.../scratchpad/010-fresh-blog-list.xml`
  (`content-desc` penuh, lihat kutipan di root cause).

### B7. [Classic] Daftar artikel Blog menampilkan markdown mentah ("##") — regresi/kelanjutan B3 audit 2026-10-01 yang tidak pernah menutup Classic — MEDIUM — ✅ FIXED (`7471637d`)

- **Lokasi**: `apps/mobile/src/screens/explore/ExploreClassicRenderers.js`,
  `renderDefaultListCard` (baris 656-666):
    ```js
    const isManasikItem = activeFeature?.key === "manasik";
    const cardBody = isManasikItem ? stripMarkdownText(item.body) : item.body;
    ```
    Stripping markdown hanya diterapkan untuk `activeFeature.key === "manasik"`
    — Blog TIDAK termasuk, jadi `item.body` (markdown mentah, field `content`
    penuh) dirender apa adanya.
- **Expected**: cuplikan artikel di kartu Classic bersih dari sintaks
  markdown, sama seperti Modern (yang sudah diperbaiki untuk kasus ini lewat
  `getBlogExcerpt` + `stripMarkdownText`,
  [commit `8d7611a0`](./2026-10-01-belajar-hub-deep-audit.md#b3-modern-artikel-cuplikan-daftar-menampilkan-markdown-mentah-)).
- **Actual**: **WRONG BEHAVIOR, 100% reproducible, live**. Di Classic,
  SETIAP kartu daftar Artikel menampilkan tanda `##` mentah di awal body,
  mis. "**## Pengertian dan Hukum Sujud Tilawah**" dan "**## Titik Balik
  Sejarah Peradaban Manusia**" — persis kelas bug yang sama dengan B3 di
  [audit Belajar hub 2026-10-01](./2026-10-01-belajar-hub-deep-audit.md),
  yang waktu itu HANYA diuji dan "LIVE CONFIRMED FIXED" di Modern.
- **Root cause**: `renderDefaultListCard` (dipakai Classic) dan
  `getBlogExcerpt`/`WebAppBlogRoute` (dipakai Modern) adalah DUA jalur kode
  terpisah untuk kebutuhan yang sama (cuplikan daftar); fix `8d7611a0`
  hanya menyentuh jalur Modern, jalur Classic generik tidak pernah disentuh.
- **Dampak**: bug kosmetik tapi mencolok (tanda pagar di awal badan teks,
  di kartu paling atas) tetap hidup untuk siapa pun yang memakai Classic
  (layout _baseline_ per dokumen layout mobile, bukan yang opt-in) —
  padahal sudah dianggap selesai oleh laporan sebelumnya.
- **Saran fix**: terapkan `stripMarkdownText` (atau panggil `getBlogExcerpt`)
  untuk `cardBody` juga saat `activeFeature?.key === "blog"`, bukan cuma
  `isManasikItem`.
- **Screenshot**: `025-classic-blog-list.png` (empat kartu, semua
  menampilkan "##" mentah).

### B8. [Modern & Classic] Beberapa string di layar detail artikel tetap berbahasa Indonesia walau Bahasa diset ke English — MEDIUM — ✅ FIXED (`7471637d`)

- **Lokasi**: `apps/mobile/src/screens/explore/ExploreClassicRenderers.js`
  — literal string langsung tanpa `t()`: `"Kembali"` (baris ±1534, tombol
  kembali Modern), `"Buka sumber"` (baris ±1501, label `ActionPill`),
  `"Info"`/`"Rujukan: "` (baris ±1469-1476, panel info), dan eyebrow grup
  `(activeFeature?.group || "Detail").toUpperCase()` (baris 1538) yang
  bersumber dari field data statis `group: group.label` di
  `apps/mobile/src/data/mobileFeatures.js:347` — bukan dari kamus i18n.
- **Expected**: dengan Bahasa Konten = English, seluruh chrome UI (bukan
  konten artikel itu sendiri, yang memang bergantung pada translasi
  backend) ikut berbahasa Inggris.
- **Actual**: **WRONG BEHAVIOR, reproducible, live**. Ganti Bahasa ke
  English (Profil → Pengaturan → Tampilan → English) lalu buka artikel yang
  sama: tombol kembali tetap **"← Kembali"** (bukan "Back"), eyebrow tetap
  **"ILMU"** (bukan "Knowledge"/grup Inggrisnya), tombol aksi tetap **"Buka
  sumber"** (bukan "Open source"), panel tetap berjudul **"Info"**/
  **"Rujukan: ..."**. Sebagai pembanding POSITIF: header atas, placeholder
  pencarian, dan bottom nav ("Home"/"Al-Quran"/"Hadith"/"Worship"/"Learn")
  semuanya SUDAH berbahasa Inggris dengan benar di layar yang sama — jadi
  ini bukan "fitur bahasa rusak total", melainkan satu komponen (detail
  renderer) yang terlewat saat i18n diterapkan.
- **Root cause**: lihat literal string di atas — tidak ada panggilan `t()`
  sama sekali untuk string-string ini di `renderDetailScreen`.
- **Dampak**: pengalaman campur-bahasa yang mencolok tepat di layar yang
  paling sering dibuka (detail artikel) — kelas bug yang sama dengan
  **B11** di [audit Belajar hub](./2026-10-01-belajar-hub-deep-audit.md)
  ("Toggle bahasa ID/EN tidak diterapkan ke ... 7 dari 9 judul header
  Profil/Pengaturan"), di sini ditemukan lagi tapi di layar yang berbeda
  (detail konten, bukan Profil/Pengaturan).
- **Saran fix**: bungkus kelima string ini dengan `t("explore.detail.back")`,
  `t("explore.detail.openSource")`, `t("explore.detail.info")`,
  `t("explore.detail.ref")`, dan jadikan `group.label` key kamus
  (`t(group.labelKey)`) alih-alih literal Indonesia.
- **Screenshot**: `039-english-dark-detail.png` (Kembali/ILMU/published
  semua masih Indonesia, bottom nav & header sudah Inggris).

### B9. [Modern] Judul header "Artikel" tidak diterjemahkan ke Inggris walau H1 di bawahnya sudah benar; chip kategori filter juga tetap Indonesia — MEDIUM — ✅ FIXED (`7471637d`)

- **Lokasi**: judul header app bar memakai `activeFeature.title` yang
  didefinisikan statis di `apps/mobile/src/data/mobileFeatures.js:185`
  (`title: "Artikel"`, bukan key kamus), sedangkan H1 di dalam konten
  memakai `t("explore.blog.title")` yang sudah benar
  (`apps/mobile/src/screens/explore/WebAppBlogRoute.js:189`). Chip kategori
  memakai `category.label` dari respons `/api/v1/blog/categories` apa
  adanya (`apps/mobile/src/screens/explore/WebAppBlogRoute.js:240-283`),
  yang hanya berisi nama Indonesia dari backend.
- **Expected**: judul app bar dan H1 di bawahnya konsisten; dengan Bahasa
  Inggris aktif, keduanya berbunyi "Articles"/"Islamic Articles".
- **Actual**: **WRONG BEHAVIOR, reproducible, live**, dan **inkonsisten di
  layar yang sama**: app bar tetap menampilkan **"Artikel"**, sementara H1
  tepat di bawahnya (40px lebih rendah) sudah benar **"Islamic Articles"**.
  Chip filter kategori ("Akhlak & Adab", "Aqidah & Tauhid", "Fiqh & Hukum
  Islam", dst.) seluruhnya tetap Indonesia walau Bahasa = English.
- **Root cause**: `mobileFeatures.js` menyimpan `title` sebagai string
  Indonesia polos untuk SEMUA fitur (bukan cuma Blog) — dipakai langsung
  sebagai judul header tanpa lapisan `t()`; kategori Blog diambil langsung
  dari field `name`/`translation.idn` API tanpa memilih varian Inggris
  meski API menyediakan struktur `translation` per kategori (dikonfirmasi
  lewat `curl /api/v1/blog/categories`, tiap kategori punya objek
  `translation`).
- **Dampak**: inkonsistensi bahasa yang terlihat jelas di satu layar yang
  sama, berpotensi membuat user bingung apakah toggle bahasa benar-benar
  berfungsi.
- **Saran fix**: untuk header, pakai `t()` dengan key per-fitur (atau pakai
  judul H1 yang sudah benar sebagai judul header juga); untuk kategori,
  periksa apakah `category.translation` API punya varian `en` dan pilih
  sesuai `locale` aktif.
- **Screenshot**: `038-english-dark-modern-blog.png` (header "Artikel" vs
  H1 "Islamic Articles" vs chip kategori Indonesia, semua di satu layar).

### B10. [Modern & Classic] Tanggal artikel selalu diformat Indonesia, tidak mengikuti Bahasa Konten — LOW — ✅ FIXED (`7471637d`)

- **Lokasi**: `apps/mobile/src/screens/ExploreScreen.helpers.js`,
  `formatBlogDate` (baris 157-168):
    ```js
    return parsed.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    ```
    Locale `"id-ID"` di-hardcode, tidak menerima parameter bahasa aktif sama
    sekali.
- **Expected**: dengan Bahasa Konten = English, tanggal artikel memakai
  format/nama bulan Inggris (mis. "October 3, 2026").
- **Actual**: **WRONG BEHAVIOR, reproducible, live**. Dengan Bahasa =
  English aktif, kartu artikel tetap menampilkan **"3 Oktober 2026"**
  (`038-english-dark-modern-blog.png`), bukan format Inggris.
- **Root cause**: argumen locale hardcode, lihat kode di atas.
- **Dampak**: kosmetik, tapi konsisten dengan pola bahasa-campur di **B8**/
  **B9** — makin menegaskan bahwa toggle bahasa untuk Blog belum dites
  menyeluruh sebelumnya.
- **Saran fix**: terima `locale` dari `useMobileLocale()` dan pakai
  `toLocaleDateString(locale === "en" ? "en-US" : "id-ID", ...)`.
- **Screenshot**: `038-english-dark-modern-blog.png`.

---

## Catatan tambahan (bukan bug fungsional, tapi worth mencatat)

### C1. Dua pasang artikel Blog dengan judul identik tapi id/tanggal berbeda — kemungkinan data backend, bukan bug app — INFO

`curl /api/v1/blog/posts?size=20` menunjukkan 15 item berisi **dua pasang
duplikat judul**: "Panduan Lengkap Sujud Tilawah..." (id `958fe3e3...`
tanggal 2026-10-03, DAN id `da886dc3...` tanggal 2026-09-22) serta
"Pelajaran Berharga dari Peristiwa Hijrah Nabi..." (id `41266737...`
tanggal 2026-10-03, DAN id `35dcc32c...` tanggal 2026-09-15). App merender
keduanya apa adanya (tidak ada bug render); kemungkinan besar ini adalah
duplikasi di seeder/CMS backend. Di luar scope audit mobile, tapi perlu
diteruskan ke tim yang mengelola konten/seeder Blog.

### C2. Kotak cari Artikel tidak punya tombol hapus (×) — pola lama yang sama — INFO

Sama seperti C3 di
[audit Belajar hub](./2026-10-01-belajar-hub-deep-audit.md#c3-kotak-cari-hub-dan-semua-turunan-papersearchinput-tidak-punya-tombol-hapus--), kotak
cari Artikel (Modern maupun Classic) tidak punya ikon hapus bawaan — harus
di-backspace manual atau keluar-masuk layar. Tidak dicatat sebagai bug baru
karena pola yang sama sudah terdokumentasi.

### C3. Toolbar mengambang Gboard menutupi chip kategori saat mengetik di kotak cari — kuirk IME, bukan bug app — INFO

Setiap kali kotak cari Artikel difokus dan diketik, Gboard menampilkan
toolbar vertikal kecil (mic/backspace/centang/emoji/hamburger) yang
menutupi 1-2 chip kategori paling kiri (`004-blog-search-zakat.png`,
`006-blog-search-nonsense.png`, `007-blog-category-fiqh.png`). Ini perilaku
IME emulator/device, bukan sesuatu yang dikontrol app — dicatat sebagai
info lingkungan, sama seperti catatan "Try out your stylus" di audit
Belajar hub.

### C4. Avatar inisial guest tidak konsisten antara "T" dan "G" saat Bahasa = English — di luar scope Blog — INFO

Saat Bahasa diubah ke English, avatar di header/account-menu berubah jadi
"G" (Guest) tapi avatar besar di layar Profil tetap "T" (sisa "Tamu").
Ditemukan tidak sengaja saat memulihkan state di akhir sesi; ini murni
layar Profil, bukan Blog, jadi hanya dicatat sebagai info untuk sesi audit
Profil berikutnya, tidak diangkat jadi bug bernomor di laporan ini.

### C5. Hardware back menutup seluruh layar Artikel saat toolbar Gboard (bukan keyboard penuh) masih terlihat — bukan bug app — INFO

Lihat "Metodologi" di atas — pola yang sama persis dengan catatan "bukan
bug" di [audit Ibadah](./2026-09-30-ibadah-deep-audit.md).

### C6. "Terakhir" di hub Belajar untuk tile Artikel berfungsi benar — INFO (positif)

Setelah membuka Artikel sekali, tile-nya di hub Belajar langsung menampilkan
badge "Terakhir" pada kunjungan berikutnya (`034-after-backs.png`,
`044-...` dst.) — sesuai ekspektasi, konsisten dengan temuan C4 di audit
Belajar hub soal batas 6/4 item "Terakhir"/pin (tidak diuji habis di sini
karena hanya satu fitur yang dibuka berulang).

---

## Checklist lengkap yang diuji (PASS kecuali disebutkan sebagai bug di atas)

### Daftar Artikel (hub list)

| Kontrol                            | Expected                     | Modern                                          | Classic                                                               |
| ---------------------------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Buka dari tile hub Belajar         | Buka daftar Artikel          | ✅ PASS                                         | ✅ PASS                                                               |
| Deep link `belajar/blog`           | Buka daftar Artikel langsung | ✅ PASS                                         | ✅ PASS                                                               |
| Pencarian: ketik kata cocok        | Filter ke hasil cocok        | ✅ PASS ("zakat")                               | PASS by kode (sama)                                                   |
| Pencarian: query nonsense          | Empty state yang jelas       | ✅ PASS ("Tidak ada artikel yang cocok…")       | PASS by kode (sama)                                                   |
| Pencarian: hapus manual            | Kembali ke daftar penuh      | ✅ PASS                                         | PASS by kode (sama)                                                   |
| Filter kategori (chip)             | Filter ke kategori terpilih  | ✅ PASS                                         | N/A (Classic tidak punya chip filter, lihat C2/B14 audit Belajar hub) |
| Chip kategori melebihi lebar layar | Wrap, tidak terpotong        | ✅ PASS (wrap ke baris baru)                    | N/A                                                                   |
| Jumlah total vs API                | 15 artikel termuat semua     | ✅ PASS (size=20 > total 15, tanpa "load more") | ✅ PASS (sama)                                                        |
| Gambar cover                       | Termuat (lazy)               | ✅ PASS                                         | N/A (Classic tidak tampilkan cover di kartu)                          |
| Cuplikan bersih dari markdown      | Tanpa `##`/`**`              | ✅ PASS; ❌ **B6** (field salah + a11y)         | ❌ **B7** (markdown mentah)                                           |
| Scroll daftar penuh                | Semua 15 item bisa digulir   | ✅ PASS                                         | ✅ PASS                                                               |
| Header back (panah)                | Kembali ke hub Belajar       | ✅ PASS                                         | ✅ PASS                                                               |
| Hardware back dari daftar          | Kembali ke hub Belajar       | ✅ PASS                                         | ✅ PASS                                                               |
| "Terakhir" di hub setelah dibuka   | Badge muncul                 | ✅ PASS (C6)                                    | ✅ PASS (C6)                                                          |

### Detail Artikel

| Kontrol                                 | Expected                                  | Modern                                                                                                            | Classic                                                                                  |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Judul, kategori                         | Tampil benar                              | ✅ PASS                                                                                                           | ✅ PASS                                                                                  |
| Penulis/tanggal (meta)                  | Tampil benar                              | ❌ **B4** ("published")                                                                                           | ❌ **B4** ("published")                                                                  |
| Body: heading/bold/italic/bullet        | Markdown terformat                        | ✅ PASS                                                                                                           | ✅ PASS                                                                                  |
| Body: blockquote hadis/doa              | Terformat beda (border+bg hijau)          | ✅ PASS                                                                                                           | ✅ PASS                                                                                  |
| Body: teks Arab & transliterasi         | Tampil rapi                               | ✅ PASS                                                                                                           | ✅ PASS                                                                                  |
| Link sitasi Quran (`/quran/...`)        | Navigasi ke ayat benar                    | PASS by kode (regex pakai nomor surah universal, tidak dicoba live — tidak ada link Quran di artikel yang dibuka) | sama                                                                                     |
| Link sitasi Hadis                       | Navigasi ke hadis yang BENAR dikutip      | ❌ **B1** (hadis salah total)                                                                                     | PASS by kode (fungsi sama, bug sama)                                                     |
| Back setelah link sitasi                | Kembali ke artikel                        | ❌ **B2** (nyasar ke daftar kitab Hadis)                                                                          | PASS by kode (fungsi sama, bug sama)                                                     |
| Gambar dalam artikel                    | Termuat                                   | N/A (artikel yang dicoba tidak punya gambar inline, hanya cover)                                                  | sama                                                                                     |
| Catatan (tombol)                        | Tersedia, buka panel, guest = pesan login | ❌ **Tidak pernah dirender** (lihat Investigasi Khusus)                                                           | ❌ **Tidak pernah dirender** (sama)                                                      |
| Bookmark dari detail                    | Tersedia, guest = pesan login             | ❌ Tidak ada tombol sama sekali (**B3**)                                                                          | N/A (Bookmark hanya dari daftar, bukan detail — berlaku semua fitur)                     |
| Bookmark dari daftar (long-press/kebab) | Guest = pesan login, bukan crash          | ❌ Tidak ada kontrolnya (**B3**)                                                                                  | ✅ PASS ("Buka Profil untuk masuk dan menyimpan bookmark.", toast + banner, tidak crash) |
| "Buka sumber"                           | Melakukan sesuatu yang berguna            | ❌ **B5** (no-op)                                                                                                 | ❌ **B5** (no-op, sama)                                                                  |
| Artikel terkait                         | Navigasi benar jika ada                   | N/A (fitur ini tidak ada di Blog sama sekali, bukan bug — tidak dijanjikan UI manapun)                            | sama                                                                                     |
| Header back dari detail                 | Kembali ke daftar, state terjaga          | ✅ PASS                                                                                                           | ✅ PASS                                                                                  |
| Hardware back dari detail               | Kembali ke daftar                         | ✅ PASS (saat tidak nyasar via B2)                                                                                | ✅ PASS (sama)                                                                           |
| Buka beberapa artikel berturut-turut    | Tidak ada state bocor antar-artikel       | ✅ PASS (meta "published" konsisten per-item, tidak tertukar)                                                     | ✅ PASS (sama)                                                                           |

### Lintas tema, tema gelap, bahasa, navigasi

| Kontrol                                             | Expected                          | Hasil                                                   |
| --------------------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| Mode Layout: Classic ↔ Web App                      | Berpindah bersih, konten identik  | ✅ PASS (dicoba dua arah)                               |
| Tema gelap: daftar Artikel                          | Kontras baik                      | ✅ PASS                                                 |
| Tema gelap: detail artikel + blockquote             | Kontras baik                      | ✅ PASS                                                 |
| Bahasa English: chrome umum (header, nav, Settings) | Semua ter-translate               | ✅ PASS                                                 |
| Bahasa English: judul header "Artikel"              | Ikut ter-translate                | ❌ **B9**                                               |
| Bahasa English: chip kategori                       | Ikut ter-translate                | ❌ **B9**                                               |
| Bahasa English: chrome layar detail                 | Ikut ter-translate                | ❌ **B8**                                               |
| Bahasa English: format tanggal                      | Format Inggris                    | ❌ **B10**                                              |
| Reachability lain selain tile hub Belajar           | Deep link bekerja                 | ✅ PASS (`thullaabulilmi://belajar/blog`)               |
| Crash buffer (`logcat -b crash`)                    | Kosong sepanjang sesi             | ✅ PASS (kosong di setiap pengecekan)                   |
| `AndroidRuntime:E` / PID app                        | Tidak ada error fatal, PID stabil | ✅ PASS (PID 4368 tidak berubah dari awal sampai akhir) |

### Indeks screenshot pendukung (selain yang sudah disebut di tiap bug)

`000-launch-home.png`, `001-blog-list-modern.png`,
`002-blog-list-modern-wait.png`, `003`–`009` (pencarian & filter kategori),
`017-account-menu.png`–`024-classic-selected.png` (navigasi switch layout),
`025`–`037` (eksplorasi Classic, Aksi Cepat, Tampilan/Appearance),
`040`–`044` (pemulihan state akhir sesi). Semua di
`apps/mobile/output/native/2026-10-03-blog-deep-audit/`.

---

## Prioritas Perbaikan (untuk sesi fix terpisah)

1. **B1** (hadis salah total di link sitasi) — prioritas tertinggi: app
   konten Islam menampilkan dalil yang salah di balik sitasi yang terlihat
   benar. Perbaikan: panggil `/hadiths/book/:slug/number/:number` alih-alih
   `hadithId: hadithNumber`; sekalian audit slug "abu-daud" vs "abudaud" di
   konten.
2. **B2** (back nyasar setelah link sitasi) — kerjakan bersama B1 karena
   sama-sama di `handleBlogLink`; tambahkan `returnTo` ke tab asal (Belajar/
   Blog) untuk ketiga cabang (hadith/quran/doa).
3. **Investigasi Catatan** (lihat section khusus) — bukan "bug untuk
   diperbaiki" dalam arti biasa, tapi **keputusan produk yang perlu
   didokumentasikan secara sadar**: apakah Blog memang sengaja tidak boleh
   punya Catatan (karena UUID vs int), atau harus dibuka kembali dengan
   backend yang disesuaikan. Jika user masih mengalami crash di device
   fisik, itu HARUS berarti device itu belum mendapat build yang mengandung
   commit `983775bf` (29 September) — cek versi APK di device fisik user
   sebagai langkah pertama, bukan mencari bug baru.
4. **B4** (meta "published") — perbaikan kecil (satu field `meta`), tapi
   berlaku di banyak tempat (subjudul detail, panel Info, kartu Classic,
   sheet Aksi Cepat) sekali diperbaiki di sumbernya.
5. **B3 + B5** (Bookmark tidak ada di Modern + "Buka sumber" mati) — satu
   paket "Blog tidak punya aksi yang berfungsi di Modern"; perbaiki
   `openSource` untuk Blog DAN tambahkan jalur Bookmark ke `BlogCard`
   sekaligus.
6. **B6 + B7** (cuplikan daftar: field salah di Modern, markdown mentah di
   Classic) — dua bug berbeda tapi root-nya sama (cuplikan Blog tidak
   konsisten antar-layout); perbaiki `getBlogExcerpt` (urutan `pickText`)
   dan terapkan hasil yang sama ke `renderDefaultListCard` Classic.
7. **B8 + B9 + B10** (bahasa Inggris tidak menjangkau chrome detail, judul
   header, dan format tanggal) — satu sapuan i18n untuk `renderDetailScreen`
   dan header fitur; kelas bug yang sama dengan B11 di audit Belajar hub,
   kerjakan bersama jika sesi itu belum dituntaskan.
8. **C1** — teruskan ke tim konten/seeder backend (duplikasi judul artikel),
   di luar kemampuan perbaikan sisi mobile.

---

**Lingkungan/tooling untuk auditor fitur berikutnya**: `wc -l` pada
`uiautomator dump` HAMPIR SELALU `0` (XML satu baris) — pakai `wc -c` atau
`grep` untuk memastikan dump berhasil, jangan anggap `0` berarti gagal.
Faktor skala screenshot-ke-native tetap ×1.2 di `emulator-5554`
(1080×2400). Dataset Blog kecil (15 artikel) sehingga seluruh isi bisa
diambil sekaligus lewat `curl` untuk verifikasi silang — teknik ini yang
mengungkap B1 (bandingkan markdown sumber vs hasil navigasi) dan B4/B6
(bandingkan field API asli vs yang dirender).
