# Analisis Penolakan Google AdSense — "Konten tanpa manfaat" (`thollabul-ilmi.site`)

Tanggal: `2026-09-25`
Trigger: Screenshot review AdSense (`adsense.google.com`) — status "Perlu diperhatikan", pelanggaran kebijakan **"Konten tanpa manfaat"**.
Metodologi: Review berbasis kode (bukan crawl live site) — 4 agent paralel membaca `apps/web/src/app` (186 route), sample konten representatif, sinyal teknis SEO (`robots.js`/`sitemap.js`/`ads.txt`/metadata), dan dokumen review yang sudah ada. Tidak ada file yang diubah — ini murni analisis.

---

## 1. Kutipan Kebijakan yang Dilanggar (dari screenshot AdSense)

Google mensyaratkan situs harus:

1. Menyediakan informasi, alat, atau layanan yang **autentik dan berkualitas tinggi**.
2. Menunjukkan **seleksi dan pemeliharaan struktural yang berkelanjutan**.
3. Menghasilkan dan mempertahankan **minat pengguna yang tulus**.

Referensi yang dicantumkan Google: [Pengalaman pengguna dan konten AdSense](https://support.google.com/adsense/answer/9376838), [Kebijakan spam Google — konten kurang berkualitas](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content-abuse), [Kebijakan spam untuk penelusuran web](https://developers.google.com/search/docs/essentials/spam-policies).

Temuan di bawah dipetakan ke tiga poin ini.

---

## 2. Ringkasan Eksekutif

Aplikasi punya **186 route** dengan cakupan fitur yang sangat luas (Quran, Hadis, Tafsir, Fiqh, Faraidh, Blog, Forum, Kajian, Library, dll) dan **sebagian besar bukan halaman placeholder** — investigasi tidak menemukan satupun teks "coming soon"/"under construction" di codebase. Masalahnya bukan _kuantitas_ fitur, tapi **tiga pola konkret yang cocok persis dengan bahasa kebijakan "konten tanpa manfaat"**, plus satu masalah teknis (rendering) yang membuat konten _yang sebenarnya bagus_ tidak terlihat oleh crawler:

| #    | Pola                                                                                                                                          | Dampak AdSense                                                                                                           | Halaman terdampak                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| P0-1 | **Forum kosong** — 0 pertanyaan ter-seed di manapun, full client-render, tapi tetap di-submit ke sitemap                                      | Poin 3 (minat pengguna) — crawler melihat halaman kosong bertuliskan "Belum ada pertanyaan."                             | `/forum`, `/forum/ask`                                                      |
| P0-2 | **Library = republish PDF pihak ketiga** dengan blurb admin 1 paragraf, full client-render, di-sitemap per buku                               | Poin 1 (autentik/nilai tambah) — persis definisi "aggregated content from other sources without adding sufficient value" | `/library/[slug]` (up to 200 entri di sitemap)                              |
| P0-3 | **7.366 transkrip kajian mentah** (auto-caption YouTube, tanpa tanda baca/editing) disajikan sebagai konten yang bisa dicari                  | Poin 1 — "auto-generated content not reviewed by a human", skala besar                                                   | `/kajian` search                                                            |
| P1-1 | **Konten bernilai tambah (tafsir, sanad, takhrij) disembunyikan di balik client-side toggle** — yang ter-SSR cuma teks Arab+terjemahan mentah | Poin 1 — versi ringan dari pola yang sama, tapi _volume sangat besar_ (ratusan halaman surah+hadis)                      | `/quran/[...slug]`, `/hadith/[slug]/[number]`                               |
| P1-2 | **Blog artikel berkualitas tinggi tapi disembunyikan dari crawler** — `blog/[slug]` full client-render, hanya 13 artikel total                | Poin 1 & 2 — konten bagus yang justru tidak terbaca crawler                                                              | `/blog/[slug]`                                                              |
| P1-3 | **Tafsir, Library, Perawi = empty shell untuk crawler** — semua `"use client"` tanpa SSR                                                      | Poin 1 — sama seperti di atas                                                                                            | `/tafsir`, `/tafsir/[slug]`, `/library`, `/perawi/[id]`                     |
| P2-1 | **Hanya 19/186 route punya title/description/canonical unik** — sisanya waris metadata generik homepage                                       | Poin 2 (pemeliharaan struktural) — ratusan URL berbeda tampil identik di hasil pencarian                                 | Quran (114 surah), semua hadis/tafsir/blog/siroh/fiqh/library/perawi detail |
| P2-2 | **Bug sitemap**: `/muroja-ah` disitemapkan tapi 301 ke halaman `/dashboard/*` yang di-disallow robots.txt dan bounce ke login                 | Poin 2 — sinyal "tidak terpelihara"                                                                                      | `sitemap.js:83`                                                             |
| P2-3 | **Bug sitemap**: `/hadits` (ejaan lama) disubmit ke sitemap tapi tidak ada `page.js` di path itu (hanya redirect di level lebih dalam) → 404  | Poin 2                                                                                                                   | `sitemap.js:72`                                                             |

**ads.txt dan robots.txt sendiri sudah benar** (publisher ID cocok, rute privat sudah di-disallow) — jadi penolakan bukan soal setup teknis dasar, melainkan substansi & keterbacaan konten.

---

## 3. Detail Temuan

### P0 — Pola yang paling langsung cocok dengan "Konten tanpa manfaat"

**P0-1. Forum: shell kosong yang disitemapkan**

- Tidak ada seeder untuk `ForumQuestion`/`ForumAnswer`/`ForumVote` di manapun (`services/api/app/db/migrations/migration.go:93-95` cuma daftarkan model untuk `AutoMigrate`, tidak ada baris insert).
- `apps/web/src/app/forum/page.js` dan `forum/[slug]/page.js` keduanya `"use client"` (baris 1), fetch data lewat `useEffect` (`page.js:21-39`). Non-JS crawler hanya melihat teks statis header + empty state eksplisit **"Belum ada pertanyaan."** (`page.js:116`).
- Meski begitu, `apps/web/src/app/sitemap.js:70-71` tetap men-submit `/forum` dan `/forum/ask` untuk diindeks.
- **Catatan verifikasi**: ini review kode, bukan crawl DB produksi — kemungkinan ada baris forum yang ditambahkan manual di luar seeder. Cek langsung tabel `forum_questions` di DB produksi sebelum menindaklanjuti klaim "0 konten" ini secara pasti.

**P0-2. Library: republish pihak ketiga tanpa nilai tambah signifikan**

- `apps/web/src/app/library/[slug]/page.js` — satu-satunya teks orisinal per buku adalah `description` admin (baris 383-385, satu paragraf pendek). Konten substantif adalah tombol keluar ke `source_url` eksternal, atau pembaca PDF/teks hasil ekstraksi dari kitab yang diunggah (`extractedPages`, baris 660-737).
- Full client-render (`"use client"` baris 1, fetch di `useEffect` baris 110-146) — tidak ada SSR sama sekali.
- `sitemap.js` fungsi `getLibraryRoutes()` (baris 238-260) mengambil hingga 200 buku dan membuat entri sitemap individual per buku — jadi Google diminta mengindeks ratusan halaman yang secara definisi kebijakan adalah "aggregated content from other sources without adding sufficient value".

**P0-3. Kajian: 7.366 transkrip auto-caption mentah sebagai konten yang bisa dicari**

- `services/api/data/static/kajian/*.json` (41 file channel) berisi transkrip ASR YouTube tanpa tanda baca/editing, contoh nyata dari `ustadzandy.json`: _"Hai Alhamdulillahirobbil alamin Muhammadin wa'ala alihi washohbihi Bagaimana menentukan awal Romadhon ya Romadhon yang pertama melihat Hilal jika ya jika hilal Tidak terlihat..."_
- Ini bukan data mati — `apps/web/src/app/kajian/TranscriptSearchView.js` (baris 445, 1386-1387) menyajikan potongan transkrip ini langsung sebagai hasil pencarian di halaman.
- Ini pola "auto-generated content not reviewed by a human" pada skala terbesar di aplikasi (7.366 entri).

### P1 — Volume besar, versi lebih ringan dari pola yang sama + masalah rendering

**P1-1. Quran & Hadis: nilai tambah ada, tapi disembunyikan dari crawler**

- `apps/web/src/app/quran/[...slug]/AyahPage.js` — kartu ayat me-render Arab + transliterasi + terjemahan di server (baris 685-720), tapi tafsir/mufrodat/munasabah/hadis terkait cuma muncul setelah user klik toggle dan fetch client-side terpisah (baris 61-199, 742-930).
- `apps/web/src/app/hadith/[slug]/HadithPage.js` — pola identik: Arab+terjemahan+badge grade ter-SSR (baris 769-798), tapi Sanad/Takhrij/ayat terkait adalah panel `"use client"` fetch-on-click (baris 62-298, 800-871).
- Karena ini adalah halaman prioritas tertinggi di sitemap (114 surah × ~10 ayah + 114 halaman tafsir), yang dilihat crawler secara default adalah **teks sumber primer mentah tanpa komentar** — data yang sudah tersedia bebas di banyak situs lain, bukan nilai tambah orisinal situs ini.

**P1-2. Blog: kualitas bagus, tapi tersembunyi dari crawler + volume kecil**

- Isi artikel (`services/api/app/db/migrations/seeder_tier4_blog_articles.go`) sebenarnya **kontra-contoh positif** — 13 artikel panjang (500-900+ kata), terstruktur, dengan rujukan hadis dan atribusi ulama (Ibnu Rajab, Al-Albani, dll). Ini persis jenis "genuine original commentary" yang diminta AdSense.
- Tapi `apps/web/src/app/blog/[slug]/page.js` adalah `"use client"` — body artikel di-fetch di `useEffect` (baris 120-237), sebelum itu hanya menampilkan `<SkeletonList>` (baris 326). **Crawler tidak melihat teks artikel sama sekali** di initial HTML.
- Ditambah hanya 13 artikel total site-wide — dari sisi volume pun bisa terbaca tipis untuk situs sebesar ini.

**P1-3. Tafsir, Library, Perawi: empty shell untuk crawler**

- `apps/web/src/app/tafsir/page.js` + `tafsir/[slug]/page.js`, `library/page.js` + `library/[slug]/page.js`, `perawi/[id]/page.js` — semua `"use client"` dengan pola identik: `useState(isLoading=true)` → `useEffect(fetch...)` → render skeleton sebelum data datang. Tidak ada teks di initial HTML.
- Sebagai pembanding, route yang **benar** (SSR, ada teks di initial HTML): `page.js` (home), `quran/[...slug]/page.js`, `siroh/[slug]/page.js`, `fiqh/[slug]/page.js`, `hadith/[slug]/page.js` — ini pola referensi yang seharusnya diikuti oleh route P1-3 & P1-2 di atas.

### P2 — Sinyal "kurang terpelihara" (poin kebijakan #2)

**P2-1. Metadata generik di ~90% route**

- Hanya 19 dari 186 file route yang punya `export const metadata` atau `generateMetadata` sendiri. Sisanya — termasuk **seluruh 114 halaman surah, seluruh halaman hadis per kitab, seluruh post blog, seluruh entri tafsir/siroh/fiqh/library/perawi** — mewarisi title & description generik dari `apps/web/src/app/layout.js` (judul sitewide "Thullaabul 'Ilmi").
- Efeknya: ratusan URL berbeda yang terindeks akan tampil dengan title+description **identik** di hasil pencarian — salah satu sinyal klasik "tidak ada seleksi/pemeliharaan struktural per halaman".

**P2-2. Bug sitemap — `/muroja-ah` bocor ke halaman disallow**

- `sitemap.js:83` mendaftarkan `/muroja-ah` di `staticRoutes`, tapi array `privateRoutes` (baris 90-106) **lupa** memasukkan `/muroja-ah/` — padahal saudara-saudaranya (`/tilawah`, `/hafalan`, `/amalan`, `/sholat-tracker`, `/muhasabah`) semua benar dikecualikan.
- `next.config.js` punya redirect permanen `/muroja-ah` → `/dashboard/muroja-ah`, dan `/dashboard/` di-disallow oleh `robots.js`, lalu `dashboard/layout.js` (baris 122-126) redirect anonymous visitor ke `/auth/login`. Jadi crawler yang mengikuti URL ini dari sitemap berakhir di rantai disallow → login screen kosong.

**P2-3. Bug sitemap — `/hadits` (ejaan lama) 404**

- `sitemap.js:72` submit `/hadits` untuk diindeks, tapi tidak ada `apps/web/src/app/hadits/page.js` — yang ada hanya `hadits/[slug]/[number]/page.js` (redirect ke `/hadith/...`). URL dasar `/hadits` di sitemap akan 404.

---

## 4. Silang-Referensi dengan Dokumen yang Sudah Ada

- **[`2026-09-09-google-seo-starter-guide-audit.md`](./2026-09-09-google-seo-starter-guide-audit.md)** — audit SEO teknis sebelumnya menilai isu SSR/BreadcrumbList sebagai **P1/P2 "opportunity"** dalam konteks SEO murni. Analisis ini menunjukkan bahwa untuk kebutuhan **AdSense review**, isu yang sama (khususnya `blog/[slug]` dan `tafsir/*` yang full client-render) jauh lebih kritikal — bukan cuma soal ranking, tapi soal apakah reviewer/crawler AdSense melihat konten sama sekali.
- **`docs/web/UI_MATURITY_AUDIT_2026-08-28.md`** (Addendum 4/5) sudah mencatat gejala terkait yang belum diperbaiki: 9 pasang route publik/dashboard yang identik (amalan, bookmarks, goals, hafalan, muhasabah, muroja-ah, notifications, sholat-tracker, tilawah), dan `/dashboard/belajar/lessons` yang kontennya "masih satu-dua kalimat" (placeholder tipis) — relevan sebagai sinyal tambahan pemeliharaan konten yang belum tuntas.
- **Tidak ada dokumen AdSense/monetisasi/strategi konten** di repo ini sebelum dokumen ini — dicek lewat `docs/INDEX.md`, isi `docs/web/*`, dan grep repo-wide (`adsense|monetiz|iklan|content strategy|strategi konten`) — nihil.

---

## 5. Kesimpulan — Pemetaan ke 3 Kriteria Google

| Kriteria Google                                    | Status                               | Bukti utama                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Autentik & berkualitas tinggi                   | **Lemah**                            | Library = republish PDF pihak ketiga; Kajian = 7.366 transkrip ASR mentah; Quran/Hadis: nilai tambah (tafsir/sanad) ada tapi tak terlihat crawler |
| 2. Seleksi & pemeliharaan struktural berkelanjutan | **Lemah**                            | ~90% route tanpa metadata unik; 2 bug sitemap aktif (`/muroja-ah`, `/hadits`)                                                                     |
| 3. Minat pengguna yang tulus                       | **Tidak terbukti dari sisi crawler** | Forum kosong (0 pertanyaan ter-seed) tapi tetap disitemapkan sebagai bukti "engagement"                                                           |

Kombinasi ketiganya — terutama **Forum kosong + Library agregasi + Kajian transkrip mentah**, semuanya aktif disitemapkan — adalah kandidat paling kuat sebagai pemicu langsung status "Konten tanpa manfaat". Pola P1 (Quran/Hadis/Blog/Tafsir yang kontennya bagus tapi tersembunyi dari crawler karena client-side rendering) kemungkinan memperparah kesan tersebut karena reviewer Google tidak melihat kedalaman konten yang sebenarnya ada di aplikasi.

**Catatan metodologi**: ini review kode statis (tidak menjalankan `next build`/crawl live site, tidak query DB produksi). Sebelum menyusun permintaan peninjauan ulang ke Google, disarankan verifikasi langsung: (a) jumlah baris nyata di tabel `forum_questions`/`forum_answers` produksi, (b) sample render HTML live dari `/blog/[slug]`, `/library/[slug]`, `/tafsir/[slug]` (curl atau "View Source") untuk konfirmasi memang kosong di initial payload.

Analisis di atas murni berbasis kode (bagian 1-5, ditulis lebih dulu). Bagian 6 di bawah mendokumentasikan perbaikan yang benar-benar diterapkan setelah analisis ini, pada hari yang sama.

---

## 6. Perbaikan Diterapkan (2026-09-25, sesi lanjutan)

Semua item P2 (bug sitemap) dan P0-1 (Forum) diperbaiki penuh. Item P1 (Quran/Hadis metadata) ternyata **sudah teratasi sebelumnya** lewat `layout.js` yang terlewat oleh audit awal (lihat 6.3). P1-2/P1-3 (Blog/Tafsir/Library/Perawi client-render) diperbaiki penuh dengan SSR. P0-2 (Library) dan P0-3 (Kajian) **tidak diperbaiki** — keduanya butuh keputusan produk/editorial, bukan sekadar perubahan kode (lihat 6.4).

### 6.1 Sitemap (P2-2, P2-3, dan bagian dari P0-1)

`apps/web/src/app/sitemap.js`:

- `/muroja-ah` dihapus dari `staticRoutes` (P2-2) — konsisten dengan saudara-saudaranya (`/tilawah`, `/hafalan`, dst.) yang memang tidak pernah dimasukkan.
- `/hadits` (ejaan lama, 404) dihapus dari `staticRoutes` (P2-3).
- `/forum` dan `/forum/ask` dihapus dari `staticRoutes` — dikonfirmasi via query langsung ke DB lokal (`forum_question` = 0 baris, `forum_answer` = 0 baris) bahwa forum memang kosong di database, bukan cuma asumsi dari kode.

### 6.2 Forum: `noindex` + verifikasi DB (P0-1)

`apps/web/src/app/forum/page.js` dan `apps/web/src/app/forum/ask/page.js` dipecah dari satu file `"use client"` monolitik menjadi `<X>Client.js` (komponen interaktif, tak berubah) + `page.js` (Server Component tipis) yang menambahkan `metadata.robots = { index: false, follow: true }`. Efeknya: selama forum belum ada pertanyaan nyata, halaman tetap bisa diakses user tapi tidak diminta untuk diindeks Google — baik lewat sitemap (6.1) maupun lewat `<meta name="robots">` kalau crawler menemukannya lewat link internal. Diverifikasi lewat `curl` ke dev server: `<meta name="robots" content="noindex, follow">` benar muncul di HTML `/forum`.

Begitu ada pertanyaan+jawaban nyata di forum, `robots.index` ini perlu diubah balik ke `true` dan didaftarkan lagi ke sitemap — ini bukan fix permanen, tapi jeda sampai kontennya ada.

### 6.3 Temuan susulan: metadata Quran/Hadis/Siroh/Fiqh/Blog sudah benar lewat `layout.js`

Analisis awal (bagian P2-1 di atas) menyimpulkan **19/186 route** yang punya metadata unik berdasarkan grep ke file `page.js` saja. Saat mengimplementasikan perbaikan, ditemukan bahwa banyak route punya `layout.js` bersebelahan (`quran/[...slug]/layout.js`, `hadith/[slug]/layout.js`, `siroh/[slug]/layout.js`, `fiqh/[slug]/layout.js`, `blog/layout.js`, `blog/[slug]/layout.js`, `tafsir/layout.js`, `tafsir/[slug]/layout.js`, `forum/layout.js`) yang **sudah** mengekspor `generateMetadata`/`metadata` lengkap (title, description, canonical, OpenGraph, Twitter card), dan beberapa (quran, siroh, fiqh, blog) bahkan sudah menyertakan JSON-LD `BreadcrumbList`/`Article`. Audit awal tidak menangkap ini karena hanya men-grep `page.js`, bukan `layout.js`.

Artinya angka "19/186" di bagian 2 **terlalu pesimis** — cakupan metadata unik sebenarnya jauh lebih luas dari yang tercatat. Sempat ditambahkan `generateMetadata` duplikat ke beberapa `page.js` (quran, hadith, siroh, fiqh, blog) sebelum temuan ini disadari; semua duplikasi itu sudah **dibatalkan** (revert ke isi asli) supaya tidak menimpa implementasi `layout.js` yang sudah lebih lengkap. Hanya `library` dan `perawi` yang terbukti benar-benar tanpa metadata sama sekali (tidak punya `layout.js`) — keduanya sekarang diperbaiki (lihat 6.4).

**Sisa gap nyata di area ini**: belum ada audit ulang untuk memastikan _seluruh_ 186 route sudah tercakup metadata lewat kombinasi `page.js`+`layout.js` — baru dicek untuk route yang disebut di bagian P1/P2 di atas.

### 6.4 SSR untuk konten yang sebelumnya kosong di initial HTML (P1-2, P1-3)

Empat area dikonversi dari `"use client"` (fetch di `useEffect`, kosong di initial HTML) menjadi Server Component yang fetch data duluan lalu mengirim sebagai prop `initial<X>` ke komponen client (pola yang sama dengan `quran/[...slug]/page.js` dan `komunitas/page.js` yang sudah ada sebelumnya):

| Route                         | File baru (client)                                   | Status metadata                                                                    |
| ----------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/blog/[slug]`                | `BlogDetailPageClient.js`                            | Sudah ada lewat `blog/[slug]/layout.js` (lihat 6.3) — tidak ditambah lagi          |
| `/tafsir`, `/tafsir/[slug]`   | `TafsirIndexClient.js`, `TafsirDetailClient.js`      | Sudah ada lewat `tafsir/layout.js`+`tafsir/[slug]/layout.js` — tidak ditambah lagi |
| `/library`, `/library/[slug]` | `LibraryPageClient.js`, `LibraryDetailPageClient.js` | **Baru ditambahkan** — tidak ada `layout.js` sebelumnya                            |
| `/perawi`, `/perawi/[id]`     | (pakai komponen dashboard yang sudah ada)            | **Baru ditambahkan** — tidak ada `layout.js` sebelumnya                            |

Setiap komponen client menerima `initial<X>` dan memakai pola `hydratedSlugRef`/`skipResetForSsrHydration`: pada render pertama, kalau data SSR sudah cocok dengan slug/id saat ini, komponen **tidak** mereset ke skeleton loading — cuma refresh diam-diam di background. Navigasi client-side ke slug/id lain tetap pakai reset+skeleton seperti semula. Semua state interaktif (bookmark, share, PDF reader di Library, dst.) tidak disentuh.

Diverifikasi dengan `next build` bersih (exit code 0, semua route ter-generate) dan sample render lewat `curl` ke dev server lokal (terhubung ke API lokal, bukan container produksi yang stale):

- `/blog/mengenal-arbain-nawawi` — judul artikel dan div `.blog-content` (isi artikel) sekarang ada di initial HTML.
- `/library/arbain-nawawi` — judul buku asli ("Hadits Arbain An-Nawawi") tampil di `<title>` dan `<h1>`, bukan lagi fallback generik.
- `/perawi/3` — nama perawi ("Abdullah bin Umar") tampil di `<title>`/`<h1>`.

**Bug tambahan yang ditemukan & diperbaiki selama verifikasi ini**: title tag `/perawi`, `/perawi/[id]`, dan `/library` sempat dobel " — Thullaabul 'Ilmi" (mis. "... — Thullaabul 'Ilmi — Thullaabul 'Ilmi") karena root `layout.js` sudah otomatis menambahkan suffix itu lewat `title.template`, dan kode baru menambahkannya lagi secara manual. Sudah diperbaiki di ketiga file. **Pola bug yang sama masih ada di `komunitas/page.js`** (pre-existing, di luar scope sesi ini) — title-nya juga dobel suffix; belum diperbaiki, perlu audit terpisah kalau mau dituntaskan sitewide.

### 6.5 Yang TIDAK diperbaiki di sesi ini (lihat bagian 7 & 9 untuk update)

- ~~P0-2 Library~~ — **diperbaiki di bagian 8** (sesi lanjutan 2026-09-28).
- **P0-3 Kajian** — 7.366 transkrip auto-caption mentah tidak disentuh. Ini konten yang sengaja ada untuk dakwah/pencarian, mengedit ulang 7.366 entri di luar scope teknis, dan berisiko fabrikasi (lihat bagian 9). Catatan mitigasi: halaman `/kajian` sendiri (index channel) tetap ada di sitemap karena isinya daftar channel yang dikurasi, bukan transkrip mentah — transkrip mentah hanya muncul sebagai hasil pencarian client-side (tidak ada URL per-hasil-pencarian yang disitemapkan), jadi risiko indexing-nya lebih rendah dari yang awalnya diperkirakan; risiko utama justru kalau reviewer manusia AdSense mengetik query di kotak pencarian saat review manual.
- **P1-1 Quran/Hadis tafsir/sanad di balik toggle** — **diperbaiki sebagian di bagian 7** (tafsir Quran + sanad/takhrij/ayat-terkait Hadis). Mufrodat/munasabah/hadis-terkait di Quran tetap lazy-on-click, tidak diubah (lihat alasan di 7.1).

### 6.6 Verifikasi menyeluruh

- `npx eslint` bersih di semua file yang diubah/dibuat (1 warning `react-hooks/exhaustive-deps` yang memang disengaja, konsisten dengan pola serupa yang sudah ada di codebase).
- `npx prettier --write` dijalankan di semua file yang diubah/dibuat.
- `rm -rf .next && next build` — build produksi bersih, exit code 0, seluruh route (termasuk `/forum`, `/library/[slug]`, `/perawi/[id]`, `/tafsir/[slug]`, dan semua mirror `/dashboard/*`) berhasil di-generate tanpa error.
- Sample render HTML lewat dev server lokal (bukan container Docker produksi yang staged build lama) untuk memastikan hasil benar-benar mencerminkan kode saat ini.

---

## 7. Perbaikan lanjutan (2026-09-28) — Quran tafsir & Hadis sanad/takhrij ke SSR

Pertanyaan lanjutan: apakah SSR-in tafsir Quran/sanad Hadis benar-benar seberat yang diperkirakan di bagian 6.5? Jawabannya berbeda untuk masing-masing:

- **Hadis (sanad/takhrij/ayat-terkait)**: TIDAK berat. Satu halaman hadis cuma 1 hadis, jadi SSR nambah 3 fetch paralel per halaman — sama ringannya dengan fix blog/library/perawi sebelumnya.
- **Quran (tafsir/mufrodat/munasabah/hadis-terkait)**: memang lebih berat KALAU naif — tiap ayat manggil 4 endpoint terpisah per-ayat, dan satu halaman surah nampilin ~10 ayat awal. SSR polos = ~40 request paralel per page load. Tapi tafsir spesifik sudah punya endpoint batch per-surah (`/api/v1/tafsir/surah/{number}`, sama yang dipakai `/tafsir/[slug]`), jadi tafsir bisa di-SSR murah (1 extra call, bukan 10-40).

### 7.1 Yang dikerjakan

- **Hadis** (`apps/web/src/app/hadith/[slug]/[number]/HadithNumberContent.js` + `hadith/[slug]/HadithPage.js`): sanad, takhrij, dan ayat-terkait di-fetch server-side (paralel, setelah `hadith.id` diketahui) lewat endpoint yang sama yang sudah dipakai client-side (`/api/v1/hadiths/{id}/sanad|takhrij|ayahs`), dikirim sebagai `initialSanad`/`initialTakhrij`/`initialRelatedAyat` ke `SanadPanel`/`TakhrijPanel`/`HadithAyahPanel`.
- **Quran tafsir** (`apps/web/src/app/quran/[...slug]/page.js`): fetch `/api/v1/tafsir/surah/{number}` server-side (fungsi `getTafsirMap`, di-copy dari pola yang sama di `tafsir/[slug]/page.js`), hasilnya (map per-ayah) diteruskan lewat `InfiniteScrollAyahPage.js` → `AyahPage.js` sebagai `tafsirMap`, dipakai untuk seed `useAsyncResource` (hook lazy-load yang sudah ada, ditambah parameter `initialData` opsional). Mufrodat/munasabah/hadis-terkait TIDAK disentuh — tetap lazy-on-click seperti semula, karena tidak ada endpoint batch untuk itu dan biayanya 3x lebih besar dari tafsir untuk nilai SEO yang lebih kecil.
- **Masalah nyata yang harus diselesaikan supaya fix ini benar-benar berguna buat crawler**: panel tafsir/sanad/takhrij ini didesain collapsed-by-default (klik untuk buka). Kalau cuma data-nya yang di-SSR tapi JSX-nya tetap `{show && <Panel/>}` (unmount saat tertutup), crawler yang tidak mengklik apa pun tetap tidak akan pernah melihat kontennya — SSR data doang tidak cukup. Diperbaiki dengan mengubah render dari unmount-based ke selalu-di-DOM + toggle visual lewat class CSS (`hidden` Tailwind = `display:none`), mengikuti cara Google secara eksplisit menangani accordion/tab content sejak 2021 (kontennya tetap di-index meski disembunyikan CSS, asal ada di DOM).

### 7.2 Verifikasi

- `next build` bersih (exit 0), semua route ter-generate.
- Render HTML nyata di dev server lokal (API lokal): teks tafsir "Dengan nama Allah Yang Maha Pemurah..." (Surah Al-Fatihah ayat 1) dan nama perawi sanad ("Muhammad bin Ismail al-Bukhari") ditemukan di dalam `<div class="... hidden">` — dikonfirmasi ADA di HTML mentah, bukan cuma di payload JSON React.
- Di-deploy ke production (`make thollabul-web`, commit `b885fdad`), diverifikasi ulang lewat `curl` ke `thollabulilmi.site` langsung — sama-sama ketemu di HTML.

---

## 8. Perbaikan lanjutan (2026-09-28) — audit metadata menyeluruh + isi Library

### 8.1 Audit metadata 186 route

Klaim "19/186 route punya metadata" di bagian 2 sudah dikoreksi di bagian 6.3 (banyak yang ternyata sudah tercakup lewat `layout.js`). Untuk memastikan tidak ada yang kelewat, dilakukan audit sistematis: 186 `page.js` dikurangi yang di-disallow `robots.js` (admin/dashboard/auth/dll) → 60 route publik tersisa → dicek satu-satu apakah punya `metadata`/`generateMetadata` sendiri ATAU lewat `layout.js` non-root di rantai direktorinya.

**Hasil: 6 gap**, 5 di antaranya nyata (halaman fitur asli, bukan redirect):

| Route                     | Fitur                           | Status                                              |
| ------------------------- | ------------------------------- | --------------------------------------------------- |
| `/faraidh`                | Kalkulator warisan Islam        | Diperbaiki                                          |
| `/feed`                   | Feed sosial komunitas           | Diperbaiki                                          |
| `/khatam`                 | Pelacak khatam Al-Quran         | Diperbaiki                                          |
| `/peta`                   | Peta lokasi bersejarah Islam    | Diperbaiki                                          |
| `/wirid-custom`           | Wirid/dzikir custom buatan user | Diperbaiki                                          |
| `/hadits/[slug]/[number]` | —                               | Bukan gap — pure `redirect()`, tidak butuh metadata |

Kelimanya sudah pakai pola `XContent`/`XPage` split yang sama seperti `forum` sebelumnya (dipakai juga oleh mirror `/dashboard/*`), jadi tinggal dipecah ke `<Nama>PageClient.js` + `page.js` tipis dengan `metadata` statis. Juga ditemukan `/komunitas` (disebut sebagai bug pre-existing di bagian 6.3) benar-benar punya title dobel " — Thullaabul 'Ilmi — Thullaabul 'Ilmi" — sekarang diperbaiki juga.

Diverifikasi: `next build` bersih + title unik dikonfirmasi lewat `curl` ke dev server lokal untuk keenam route, lalu di-deploy (`make thollabul-web`, commit `dfe3032a`) dan dikonfirmasi ulang langsung ke `thollabulilmi.site`.

### 8.2 Isi Library ditulis ulang (45 buku)

Ternyata **production punya 45 buku**, bukan 4/19 seperti yang terlihat di analisis awal (DB dev lokal kurang ter-seed, dan file JSON seed cuma cover 19 — 26 sisanya ditambah manual lewat admin panel dan tidak pernah masuk balik ke file JSON).

Semua 45 buku sudah punya deskripsi (tidak ada yang kosong), tapi tipis (31–197 karakter, 1 kalimat generik) — persis pola "thin blurb" yang di-flag di bagian P0-2.

**Cara eksekusi**: seeder library (`services/api/app/db/migrations/seeder_library_books.go`) ternyata **upsert** berdasarkan `slug` (`ON CONFLICT DO UPDATE`), bukan insert-only. Supaya update ini tidak menimpa balik field lain (source_url, license_status, file_url, dst milik 45 buku — termasuk yang formatnya "uploaded" dengan link MinIO asli) ke nilai lama/tebakan, urutan kerjanya:

1. Tarik record lengkap ke-45 buku dari API produksi (`GET /api/v1/library/books`).
2. Tulis deskripsi baru 2–3 kalimat per buku (penulis, era, isi pokok) berdasarkan pengetahuan bibliografis umum atas kitab klasik/kontemporer ini — bukan klaim spesifik tingkat hadits/tafsir yang perlu rujukan shahih ketat.
3. Susun ulang `services/api/data/static/library_book.json` dengan SEMUA field asli dipertahankan persis (diverifikasi via diff terprogram: 0 mismatch di luar `description`), cuma `description` yang berubah.
4. Deploy API (`make thollabul-api`, commit `3175f8ea`) — proses ini men-sync `data/static` (bind-mounted di VPS, bukan di-bake ke image) lalu re-run seeder via `DEPLOY_MIGRATE_CMD`.

**Gotcha yang ditemukan**: seeder ini punya cache berbasis (mtime, size) file per-nama (tabel `seed_file_state`) supaya tidak parse ulang file yang sama tiap deploy. Deploy otomatis pertama **gagal ke-detect sebagai "berubah"** — 8 dari 45 buku (yang kebetulan ada di daftar fallback hardcoded 8-item di kode Go) balik nampilin deskripsi fallback lama yang lebih pendek, bukan 45 deskripsi baru. Setelah investigasi (cek `seed_file_state` langsung di DB, re-run migrate manual via SSH, baca log JSON mentah), akar masalahnya adalah mtime file hasil sync `tar` tidak konsisten terdeteksi "berubah" oleh cache tsb. Diperbaiki dengan `touch` paksa file di VPS lalu re-run migrate manual — setelah itu ke-45 deskripsi baru berhasil ter-load (`"[seeder] seed library books from file: 45 entri"` di log).

**Catatan untuk deploy `data/static/*.json` berikutnya**: kalau isi berubah tapi hasil migrate tetap pakai data lama, curiga cache `seed_file_state` — cek tabel itu, atau paksa `touch` file di VPS sebelum migrate ulang.

Diverifikasi: diff terprogram 0 mismatch non-description sebelum deploy; setelah deploy, `curl` ke API produksi mengonfirmasi ke-45 deskripsi (151–217 karakter) dan isi sampel (Bulughul Maram, Riyadhus Shalihin, Zad Al-Ma'ad, Ar-Rahiq Al-Makhtum) sesuai fakta bibliografis yang benar.

---

## 9. Kajian transkrip — sengaja TIDAK disentuh, dan kenapa

`docs/reviews/2026-09-08-audit-transkrip-kajian.md` mencatat **dua** insiden fabrikasi transkrip kajian sebelumnya di project ini (video dengan caption kosong sempat diisi teks karangan, dua kali). Auto-rewrite 7.366 transkrip mentah pakai LLM untuk "merapikan" tanda baca berisiko persis sama — model bisa salah menebak/mengarang kata yang diucapkan ustadz dari ASR yang tidak jelas, lalu itu tersimpan sebagai "transkrip resmi" di database dakwah. Ini bukan risiko teknis biasa (seperti bug kode), tapi risiko **misattribusi ucapan ke pengajar agama** — karena itu item ini sengaja dilewati di kedua sesi (2026-09-25 dan 2026-09-28) meski masuk kategori "P0" dari sisi AdSense, dan tidak akan dikerjakan otomatis tanpa keputusan eksplisit soal metodenya (mis. hanya microedit tanda baca tanpa ubah kata, atau proses editorial manual oleh manusia yang paham konten kajiannya).
