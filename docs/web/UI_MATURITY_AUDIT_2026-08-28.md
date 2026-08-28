# Audit Kematangan Fitur per Route — apps/web

**Tanggal:** 28 Agustus 2026
**Sumber:** `screenshots/` — 318 PNG (159 route × desktop 1280×800 + mobile 390×844)
**Metode:** dedup md5 → analisis tinggi/berat halaman → review visual contact-sheet

---

## Peringatan metodologi (baca dulu)

Crawler memakai **slug generik `Al-Fatihah`** untuk semua route dinamis `[slug]`/`[id]`.
Akibatnya pesan "Artikel tidak ditemukan" / "Buku tidak ditemukan" / "Surah tidak ditemukan"
di route detail **bukan bug** — itu perilaku benar untuk slug yang memang tidak ada.

Yang tetap dihitung bug adalah route detail yang **blank total tanpa pesan apa pun**,
atau yang **salah melaporkan penyebab error**.

---

## P0 — Route crash (error boundary)

| Route | Desktop | Mobile | Catatan |
|---|---|---|---|
| `/komunitas` | ❌ Terjadi Kesalahan | ❌ | Fitur komunitas belum ada sama sekali |
| `/dashboard/komunitas` | ❌ Terjadi Kesalahan | ❌ | idem — kembar, dua-duanya mati |
| `/khatam` | ❌ Terjadi Kesalahan | ❌ | Padahal `/dashboard/khatam` **jalan normal** → bug route publik saja |
| `/zakat/history` | ✅ jalan | ❌ Terjadi Kesalahan | Crash hanya di viewport mobile |

Bukti dedup: `desktop-khatam.png`, `desktop-komunitas.png`, `desktop-dashboard_komunitas.png`
punya md5 identik (`c6c5d345…`) = halaman error yang persis sama.

---

## P1 — Route hidup tapi fitur tidak berfungsi

| Route | Gejala | Pembanding |
|---|---|---|
| `/dashboard/fiqh` | "0 materi fiqh" + "Tidak ada hasil" | `/fiqh` publik menampilkan 8 kategori |
| `/dashboard/wirid` | "Gagal Memuat Wirid — Pastikan server backend berjalan" | `/wirid` publik jalan normal |
| `/dashboard/hadith` (desktop) | Tab Book/Theme/Chapter/Hadith render, **area konten kosong total** | Versi mobile route yang sama jalan (1893px konten) |
| `/dashboard/perawi` (mobile) | "Belum ada data perawi" | Desktop menampilkan 23 perawi |
| `/dashboard/perawi/[id]` (mobile) | "Belum ada data perawi" | Desktop 1178px konten |
| `/dashboard/manasik` (mobile) | Judul + tab Haji/Umrah, **tanpa isi** | Desktop menampilkan 10 langkah |
| `/admin/users` | Nyangkut di "Memuat…" selamanya | — |
| `/dashboard/quiz` | Soal + progress bar tampil, **pilihan jawaban tidak ada** | Quiz tidak bisa dijawab |

**Pola:** beberapa halaman `/dashboard/*` gagal ambil data sementara kembaran publiknya sukses
(fiqh, wirid, hadith, quran/[slug]). Kuat dugaan client fetch di shell dashboard beda dari yang publik.

---

## P2 — Missing not-found state (blank, tanpa pesan)

Route ini render header + footer saja, area konten benar-benar kosong — user tidak tahu apa yang terjadi:

- `/hadith/theme/[slug]`
- `/siroh/[id]` — hanya tombol "← Kembali ke Siroh"
- `/dashboard/siroh/[slug]`

Bandingkan dengan yang sudah benar: `/blog/[slug]` → "Artikel tidak ditemukan",
`/library/[slug]` → "Buku tidak ditemukan atau belum bisa dimuat",
`/dashboard/tafsir/[slug]` → "Surah tidak ditemukan" + tombol kembali.

---

## P3 — Error copy menyesatkan / inkonsisten

| Route | Masalah |
|---|---|
| `/dashboard/quran/[slug]` | Slug invalid dilaporkan sebagai **"Server API tidak dapat dijangkau"** — padahal API sehat (`/dashboard/quran` load 3462px). Salah diagnosa ke user. |
| `/dashboard/hadith/[slug]` | Dropdown "Pilih Tema" ter-render **kosong tanpa satu pun option** |
| `/dashboard/hadith/[slug]/[number]` | Halaman 404 full-page menggantikan seluruh shell dashboard (sidebar hilang) — inkonsisten dengan 404 lain |

---

## P4 — Responsive: Admin panel tidak bisa dipakai di mobile

**Dampak: 22 route `/admin/*`.**

Sidebar admin (~200px) selalu ter-expand di viewport 390px, menyisakan ±190px untuk konten.
Tabel data terpotong horizontal, tombol aksi di luar layar. Terlihat jelas di
`mobile-admin_kamus.png`, `mobile-admin_users.png`, `mobile-admin_blog.png`, `mobile-admin_doa.png`.

Selain itu **6 route admin di mobile malah render landing page publik** (md5 identik dengan `mobile-root.png`):

- `/admin/lessons`
- `/admin/library`
- `/admin/manasik`
- `/admin/quiz`
- `/admin/reminders`
- `/admin/sejarah`

Keenamnya render normal di desktop → bukan masalah izin, tapi bug guard/redirect yang viewport-dependent.

---

## P5 — Masalah UX lintas route

1. **Toast "Aktifkan lokasi & notifikasi" muncul di 100% route** dan tidak pernah hilang.
   Di mobile memakan ±25% viewport dan menempel di atas bottom nav; di desktop menutupi
   bagian bawah sidebar. Perlu dibatasi (sekali per sesi / hanya di route yang butuh lokasi).
2. **Tab strip `/dashboard/panduan-sholat` mobile terpotong** — "Shola…" kepotong di tepi kanan
   tanpa indikator scroll.
3. **Label bottom nav truncated** — "Pusat Bela…".
4. **Tombol forum berwarna biru** di aplikasi yang seluruhnya hijau — `+ Tanya`,
   "Ajukan pertanyaan pertama", tombol submit. Kena di `/forum`, `/forum/ask`,
   `/dashboard/forum`, `/dashboard/forum/ask`. Pelanggaran design token.

---

## P6 — Duplikasi route tanpa perbedaan

Sembilan pasang route publik dan dashboard menghasilkan screenshot **byte-identik** —
artinya `/dashboard/x` tidak menambah apa pun di atas `/x`:

`amalan` · `bookmarks` · `goals` · `hafalan` · `muhasabah` · `muroja-ah` ·
`notifications` · `sholat-tracker` · `tilawah`

Kandidat untuk digabung jadi satu route + redirect.

---

## P7 — Performa halaman

| Route | Ukuran render | Catatan |
|---|---|---|
| `/admin/asbabun-nuzul` | 11.675px desktop, PNG 1,9 MB | 216 entri tanpa paginasi |
| `/admin/kamus` | 7.903px mobile | 28 kata, tapi layout sangat panjang di mobile |
| `/` (landing) | 6.119px desktop / 13.471px mobile | Landing page sangat panjang |
| `/quran` | 3.974px desktop / 10.952px mobile | 114 surah tanpa virtualisasi |
| `/dashboard/quran` | 3.462px / 10.000px | idem |

---

## Yang sudah matang (tidak perlu disentuh)

Empty state yang dirancang benar — ada ikon, pesan, dan CTA lanjutan:
`/bookmarks`, `/goals`, `/notes`, `/muhasabah`, `/muroja-ah`, `/hafalan`, `/tilawah`,
`/dashboard/feed`, `/dashboard/forum`, `/dashboard/leaderboard`, `/dashboard/zakat/history`.

Halaman admin desktop yang berfungsi penuh: `admin`, `admin/blog`, `admin/kajian`,
`admin/lessons`, `admin/library`, `admin/manasik`, `admin/sejarah`, `admin/reminders`,
`admin/doa`, `admin/dzikir`, `admin/wirid`, `admin/kamus`, `admin/asbabun-nuzul`, `admin/siroh`.

Halaman konten yang matang: `/quran`, `/tafsir`, `/hadith`, `/kamus`, `/hijri`, `/perawi`,
`/siroh`, `/tokoh`, `/asmaul-husna`, `/doa`, `/dzikir`, `/tasbih`, `/imsakiyah`,
`/jadwal-sholat`, `/panduan-sholat`, `/faraidh`, `/zakat`, `/profile`, `/contact`,
`/dashboard/settings`, `/dashboard/stats`, `/dashboard/achievements`, `/dashboard/khatam`.

---

## Catatan konten (bukan bug UI)

- `/fiqh` — 8 kategori tampil, semuanya **"0 topik"**. Shell selesai, konten belum di-seed.
- `/admin/manasik` — kolom **Judul kosong** di seluruh 10 baris (deskripsi terisi).
- `/admin/library` — 4 buku, semua berstatus lisensi **"unverified"**.
- `/dashboard/belajar/lessons` — modul jalan, tapi isi materi masih satu-dua kalimat.
- `/dev` — halaman Developer API terpasang di navbar publik. Fungsional, tapi perlu dipastikan
  memang mau diekspos ke semua pengunjung.

---

## Urutan pengerjaan yang disarankan

1. P0 — 4 route crash (komunitas ×2, khatam, zakat/history mobile)
2. P1 — 8 route fitur mati, prioritaskan pola fetch dashboard (fiqh, wirid, hadith, perawi, manasik)
3. P4 — admin panel mobile (22 route sekaligus, satu perbaikan layout)
4. P5.1 — toast lokasi/notifikasi (kena semua route)
5. P2/P3 — not-found state + error copy
6. P6/P7 — konsolidasi route kembar dan paginasi

---
---

# Addendum — Analisis Akar Masalah

Ditambahkan setelah menelusuri source. **Sebagian klasifikasi di atas direvisi.**

## Metode

Stack lokal sedang mati saat analisis ini, jadi temuan di bawah berbasis pembacaan
kode + korelasi timestamp screenshot — bukan reproduksi runtime. Status tiap item
ditandai eksplisit: **[TERBUKTI DI KODE]** vs **[BUTUH REPRODUKSI]**.

## Hipotesis yang GAGAL: "satu akar masalah fetch dashboard"

Dugaan awal (client fetch dashboard beda dari publik) **tidak terbukti**:

- Hanya **6 file** memakai raw `fetch(${process.env.NEXT_PUBLIC_API_URL}...)`;
  79 file memakai `lib/api.js`. Bukan pola yang meluas.
- `NEXT_PUBLIC_API_URL=""` memang disengaja — `app/api/v1/[...path]/route.js`
  mem-proxy same-origin ke `API_INTERNAL_URL`. URL bukan penyebabnya.
- `dashboard/wirid/page.js` cuma **re-export `WiridContent` dari `app/wirid/page.js`** —
  kode identik dengan versi publik yang jalan. Mustahil beda karena kode.

## Bukti timestamp

| # urut | Waktu | Screenshot |
|---|---|---|
| #171–#176 | 18:04:45–18:04:51 | 6 route admin mobile gagal **berurutan, 1 detik sekali** |
| #69 / #228 | 18:03:01 / 18:05:34 | `dashboard/komunitas` gagal di **dua pass terpisah** |
| #124,#126 / #283,#285 | 18:03:57 / 18:06:20 | `khatam` + `komunitas` gagal di **dua pass terpisah** |
| #21, #52, #57, #85, #99 | tersebar 18:02–18:03 | gagal acak, diapit halaman yang sukses |

Tafsir: kegagalan **berurutan** = transien. Kegagalan yang **berulang di dua pass
terpisah 2,5 menit** = bug beneran.

## Defect #1 — Admin ter-lempar ke landing saat `/auth/me` gagal sesaat

**[TERBUKTI DI KODE]** — `apps/web/src/app/admin/layout.js:161`

```js
if (!isAuthenticated || user?.role !== "admin") {
    router.push("/");
}
```

Rantainya (`context/Auth.js:70-101`): kalau `GET /api/v1/auth/me` balas selain
`200`/`401` (429, 5xx, timeout), `fetchMe` sengaja **tidak** clear session — token
tetap tersimpan, tapi `user` tetap `null`. Akibatnya:

- `isAuthenticated` = `!!token` = **true**
- `user?.role` = `undefined` → `!== "admin"` → **true**
- → `router.push("/")` tanpa pesan error apa pun

Guard ini menyamakan **"user belum termuat"** dengan **"user bukan admin"**.
Persis yang terlihat di 6 screenshot admin mobile (md5 identik dengan landing page).

**Perbaikan:** bedakan tiga state — loading / gagal-muat / bukan-admin. Redirect
hanya kalau `user` benar-benar termuat dan rolenya bukan admin; kalau gagal muat,
tampilkan error + retry.

**Dampak:** 22 route `/admin/*`, dan bukan cuma saat crawl — setiap admin yang
kena hiccup jaringan sesaat akan dilempar ke landing page.

## Defect #2 — `/dashboard/fiqh` nyambung ke endpoint yang salah

**[TERBUKTI DI KODE]** — `apps/web/src/app/dashboard/fiqh/page.js:44`

```js
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/fiqh?page=0&size=100`)
    .then((r) => r.json())
    .then((d) => {
        const arr = d?.items ?? d ?? [];      // ← mengharap fiqh ITEMS
        if (Array.isArray(arr) && arr.length > 0) setItems(arr);
    })
```

Tapi di `services/api/app/http/routes.go`:

```
:538  GET /fiqh          → FindAllCategories     ← yang dipanggil
:544  GET /fiqh/items    → FindAllItems  (EditorOrAdminMiddleware)  ← yang dibutuhkan
```

`GET /api/v1/fiqh` mengembalikan **array kategori**, bukan materi
(`fiqh_controller.go:68` → `lib.OKPaginated` → tanpa `?meta=` → array telanjang).

Jadi meskipun fetch-nya sukses, halaman ini merender objek **kategori** sebagai
**materi** — `getLocalizedField(i, "content", lang)` selalu kosong. Halaman ini
tidak akan pernah benar dengan wiring sekarang.

Yang lebih menghambat: satu-satunya endpoint daftar materi, `/fiqh/items`,
**digembok EditorOrAdmin** — jadi halaman dashboard user biasa memang tidak punya
sumber data yang sah.

**Perbaikan:** butuh keputusan produk dulu — buka endpoint publik untuk daftar
materi fiqh, atau ubah `/dashboard/fiqh` jadi browse per-kategori seperti `/fiqh`
publik (`fiqhApi.listCategories()` + `categoryBySlug()`).

Catatan: `?page=0&size=100` **valid** — `lib.GetLimitOffset` (`request.go:84-118`)
menerima `size` maupun `page`. Bukan itu masalahnya.

## Defect #3 — Copy error salah diagnosa

**[TERBUKTI DI KODE]** — semua kegagalan non-2xx (termasuk 429 dan 404) dilaporkan
sebagai server mati:

- `/dashboard/quran/[slug]` → "Server API tidak dapat dijangkau"
- `/dashboard/wirid` → "Pastikan server backend berjalan"

Padahal `RATE_LIMIT_GLOBAL=180` req/menit (`docker-compose.yaml:35`, key per
user login — `routes.go:36-44`). Throttling dan slug tidak valid dua-duanya
tampil sebagai "server mati". Menyesatkan saat debugging.

## Revisi klasifikasi P1

| Route | Status baru |
|---|---|
| `/dashboard/fiqh` | **Bug nyata** — kontrak endpoint salah (Defect #2) |
| 6 route admin mobile | **Bug nyata** — guard auth (Defect #1), bukan masalah viewport |
| `/komunitas` + `/dashboard/komunitas` | **Bug nyata** — gagal di dua pass terpisah |
| `/khatam` | **Bug nyata** — gagal di dua pass terpisah |
| `/dashboard/wirid` | **Transien** — kode identik dengan `/wirid` yang jalan |
| `/dashboard/hadith` (desktop) | **Butuh reproduksi** |
| `/dashboard/perawi`, `/dashboard/manasik` (mobile) | **Butuh reproduksi** — desktop jalan |
| `/admin/users` | **Butuh reproduksi** |
| `/zakat/history` (mobile) | **Butuh reproduksi** — screenshot terakhir run |

Yang **tidak** berubah: P0 crash komunitas/khatam, admin panel mobile tidak terpakai,
toast lokasi di semua route, tombol forum biru, duplikasi 9 pasang route, masalah performa.

## Langkah berikutnya yang menentukan

1. Nyalakan stack (`make docker-up`), buka `/komunitas` dan `/khatam`, ambil
   **stack trace** dari error boundary. Dua route ini bug nyata tapi penyebab
   persisnya belum ketahuan — semua fetch di `dashboard/komunitas/page.js` sudah
   dibungkus try/catch, jadi lemparannya datang dari tempat lain.
2. Crawl ulang dengan **jeda ≥400 ms per route** supaya di bawah 180 req/menit,
   lalu bandingkan. Itu memisahkan tuntas yang transien dari yang nyata.

---
---

# Addendum 2 — Verifikasi Live terhadap Produksi

**Metode:** probe Playwright + curl langsung ke `https://thollabul.jangkauin.site`
(`waitUntil: networkidle` + tunggu 2,5–3 detik), login sebagai admin seperti crawler asli.
Semua di bawah ini **TERVERIFIKASI RUNTIME**, bukan lagi dugaan.

## Temuan metodologi: crawler-nya yang bikin false positive

`scripts/capture-all-routes-vps.mjs:80-81`

```js
await page.goto(`${BASE}${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(600);
```

Screenshot diambil **600 ms setelah DOM ready**, padahal semua halaman ini React
client-side yang fetch di `useEffect` — jadi harus: hydrate bundle → fetch → render.
Response API produksi terukur 0,16–0,62 detik. Halaman yang datanya datang setelah
600 ms **kefoto saat masih kosong**.

Ini penyebab sebenarnya dari mayoritas "fitur mati" di laporan awal — bukan bug fitur.

**Perbaikan crawler:** ganti ke `waitUntil: 'networkidle'` atau
`page.waitForSelector` pada konten nyata, dan beri jeda antar-route.

## FALSE POSITIVE — dicoret dari daftar bug

Diverifikasi tampil lengkap saat ditunggu benar:

| Route | Hasil verifikasi |
|---|---|
| `/dashboard/hadith` | ✅ Shahih Bukhari 7563, Muslim 7563, Abu Daud 5274, dst. |
| `/dashboard/perawi` | ✅ "23 perawi" + daftar lengkap |
| `/dashboard/manasik` | ✅ 10 langkah haji tampil semua |
| `/zakat/history` | ✅ empty state normal |
| `/admin/lessons` (+5 route admin lain) | ✅ tidak redirect ke landing |

Endpoint-nya pun sehat: `/api/v1/wirid` → 10 item, `/api/v1/perawi` → 10 item,
`/api/v1/manasik` → 10 item, semua HTTP 200.

## BUG BACKEND — 3 endpoint balas HTTP 500

Reproducible via curl polos, tanpa browser:

```
GET /api/v1/forum/questions?page=0&size=50          → 500
GET /api/v1/forum/questions?page=0&size=50&sort=top → 500
GET /api/v1/leaderboard/hafalan                     → 500
GET /api/v1/wirid/occasion/jumat                    → 500
GET /api/v1/wirid/occasion/harian                   → 500
```

**Ini bug paling berdampak dan sepenuhnya di sisi backend.** Konsekuensinya:

- `/dashboard/wirid` "Gagal Memuat Wirid" → **bug nyata**, bukan transien
  (revisi dari Addendum 1 yang menyebut ini transien)
- Hall of Fame & Hot Forum di komunitas selamanya jadi skeleton
- Forum question list tidak bisa dimuat sama sekali

## Defect #4 — `/komunitas` crash: objek user dirender sebagai React child

**[TERVERIFIKASI RUNTIME]**

Console produksi:
```
Minified React error #31; args[]=object with keys {id, name, email, role, preferred_lang}
```

`GET /api/v1/blog/posts` mengembalikan `author` sebagai **objek**:

```json
"author": {"id":"0000…0001","name":"Admin","email":"admin@tholabul-ilmi.com",
           "role":"admin","preferred_lang":"idn"}
```

Sementara `apps/web/src/app/dashboard/komunitas/page.js` merender:

```js
<span>Oleh {p.author || p.author_name || 'Tim Redaksi'}</span>
```

`p.author` truthy (objek) → dirender sebagai React child → **error #31 → error boundary**.

**Perbaikan:** `p.author?.name || p.author_name || 'Tim Redaksi'`.

**Catatan keamanan:** endpoint blog publik membocorkan **email admin**. Sebaiknya
author di-serialize hanya `{id, name}`.

## Defect #5 — `/khatam` crash: `progress` null tanpa guard

**[TERVERIFIKASI RUNTIME]**

```
TypeError: Cannot read properties of null (reading 'surahNumber')
```

`apps/web/src/app/khatam/page.js`

```js
:33   const [progress, setProgress] = useState(null);
:45   if (!isAuthenticated) { setLoading(false); return; }   // progress tetap null
:81   if (loading) { … }
:89   if (!isAuthenticated) { … }
:113  const currentIdx = ayahIndex(progress.surahNumber, progress.ayahNumber);  // ❌ tanpa guard
```

Race-nya: render pertama `isAuthenticated` masih `false` (Auth context belum selesai
bootstrap) → effect langsung `setLoading(false)` tanpa mengisi `progress`. Begitu Auth
selesai dan `isAuthenticated` jadi `true`, effect jalan lagi — tapi `loading` **sudah**
`false`. Terbentuk jendela `loading=false` + `isAuthenticated=true` + `progress=null`
→ baris 113 meledak.

Justru itu sebabnya crash hanya muncul **saat login**, dan `/dashboard/khatam` aman
(layout dashboard sudah menahan render sampai auth beres).

**Perbaikan:** tambahkan `if (!progress) return <Loading/>` sebelum baris 113, atau
`setLoading(true)` di awal cabang terautentikasi.

## Defect #6 — `/dashboard/fiqh` merender kategori sebagai materi

**[TERVERIFIKASI RUNTIME]** — Defect #2 di Addendum 1 kini terbukti kasat mata.

Setelah ditunggu sampai `networkidle`, halaman menampilkan:

```
Fiqh Ringkas — 8 materi fiqh
Thaharah Thaharah | Sholat Sholat | Puasa Puasa | Zakat Zakat | Haji-Umrah Haji & Umrah …
```

Nama kategori tercetak **dobel** (judul + label kategori) dan isi materi kosong —
persis gejala merender objek kategori sebagai materi. Angka "0 materi" di screenshot
lama cuma efek race 600 ms; **kontrak endpoint-nya tetap salah**.

Terkonfirmasi juga: `GET /api/v1/fiqh/items` → **401** (admin-only), jadi memang tidak
ada sumber data materi yang sah untuk halaman user.

## Defect #7 — `/dashboard/quiz` tanpa pilihan jawaban

**[TERVERIFIKASI RUNTIME]** — Setelah `networkidle` + 3 detik, isi halaman hanya:

```
Quiz Islami — Soal 1/10 — 10%
Apa nama perjanjian damai antara Nabi ﷺ dan kaum Quraisy pada tahun 6 H?
```

Tidak ada opsi jawaban. Bukan race — **bug nyata**, quiz tidak bisa dimainkan.

## Status akhir

| Kategori | Route |
|---|---|
| **Bug backend (500)** | `forum/questions`, `leaderboard/hafalan`, `wirid/occasion/*` |
| **Bug frontend terverifikasi** | `/komunitas` ×2 (#4), `/khatam` (#5), `/dashboard/fiqh` (#6), `/dashboard/quiz` (#7), guard admin (#1) |
| **False positive (race 600 ms)** | `/dashboard/hadith`, `/dashboard/perawi`, `/dashboard/manasik`, `/zakat/history`, 6 route admin mobile |
| **Masih berlaku dari laporan awal** | admin panel mobile, toast lokasi, tombol forum biru, duplikasi 9 route, performa, missing not-found state |

## Prioritas revisi

1. **3 endpoint 500** — dampak terluas, murni backend
2. **Defect #4** (`p.author?.name`) — satu baris, menghilangkan crash komunitas
3. **Defect #5** (guard `progress`) — satu baris, menghilangkan crash khatam
4. **Defect #1** (guard admin layout) — cegah admin kelempar saat jaringan hiccup
5. **Defect #7** (quiz tanpa opsi jawaban)
6. **Defect #6** (`/dashboard/fiqh` — butuh keputusan produk dulu)
7. Perbaiki crawler (`networkidle`) sebelum audit visual berikutnya

---
---

# Status Perbaikan

Diverifikasi lewat dev server lokal yang mem-proxy ke API produksi
(`API_INTERNAL_URL=https://api-thollabul.jangkauin.site`), lalu `next build` penuh.

## ✅ Sudah diperbaiki

| Defect | File | Perubahan |
|---|---|---|
| #4 crash `/komunitas` | `dashboard/komunitas/page.js` | Helper `getAuthorName()` mengikuti pola `blog/page.js:33`; objek author tidak lagi dirender langsung |
| #5 crash `/khatam` | `khatam/page.js:84` | Guard `loading \|\| (isAuthenticated && !progress)` menutup jendela race saat auth bootstrap |
| #1 admin kelempar ke landing | `admin/layout.js` | `profileUnavailable = isAuthenticated && !user` dipisah dari "bukan admin"; tampil layar error + tombol coba lagi (`refetchUser`) |
| Admin sidebar di mobile | `admin/layout.js` | Sidebar jadi off-canvas drawer di bawah `md`: hamburger di header, backdrop, tombol tutup, auto-close saat pindah route. Desktop tidak berubah |
| Tabel admin meluber | 16 × `admin/*/page.js` | Tabel dibungkus `<div className='overflow-x-auto'>` + `min-w-[640px]` |
| i18n | `lib/i18n.js` | `admin.profile_error`, `admin.profile_error_desc`, `common.retry` (ID + EN) |

Hasil verifikasi pada 390×844 dan 1280×800:

```
v-admin-users-mobile    scrollW=390  vw=390  ✅
v-admin-users-drawer    scrollW=390  vw=390  ✅
v-admin-kamus-mobile    scrollW=390  vw=390  ✅
v-admin-users-desktop   scrollW=1280 vw=1280 ✅
v-komunitas             scrollW=1280 vw=1280 ✅  (tidak lagi crash)
v-khatam                scrollW=1280 vw=1280 ✅  (tidak lagi crash)
```

Nol overflow horizontal, nol `pageerror`. `next build` lolos untuk seluruh 159 route.

## ❌ Belum diperbaiki

| Item | Alasan |
|---|---|
| 3 endpoint 500 (`forum/questions`, `leaderboard/hafalan`, `wirid/occasion/*`) | Bug sisi Go, butuh baca log server. **Dampak terbesar** — Hall of Fame & Diskusi Hangat di komunitas masih skeleton karena ini |
| Defect #7 `/dashboard/quiz` tanpa opsi jawaban | Perlu telusur sumber data quiz |
| Defect #6 `/dashboard/fiqh` kontrak endpoint | Butuh keputusan produk: buka endpoint materi publik, atau ubah jadi browse per-kategori |
| Toast lokasi di semua route, tombol forum biru, duplikasi 9 route, performa | Di luar cakupan sesi ini |
| Crawler `waitUntil: 'networkidle'` | Perlu diperbaiki sebelum audit visual berikutnya |

## Catatan

- `admin/users` menampilkan **0 pengguna** ("Belum ada pengguna terdaftar") padahal login admin
  berhasil — kemungkinan endpoint list user bermasalah. Perlu dicek terpisah.
- `admin@tholabul-ilmi.com` / `Admin@123` ter-commit di `scripts/capture-all-routes-vps.mjs`
  dan aktif di produksi. Sebaiknya diganti dan dipindah ke env var.
- `GET /api/v1/blog/posts` membocorkan email admin di field `author`. Serialize `{id, name}` saja.

---
---
# Addendum 3 — Akar Masalah 500 & Perbaikan Backend

## Koreksi penting atas draf awal addendum ini

Draf pertama addendum ini **salah** dan sudah diganti seluruhnya. Kesalahannya:
saya menguji dengan `gorm.Open` polos, tanpa NamingStrategy milik aplikasi, lalu
menyimpulkan tabelnya plural. Padahal aplikasi memakai:

```go
// app/db/postgresql.go:28-31 (dan app/db/db_sqlite.go:29)
NamingStrategy: schema.NamingStrategy{
    TablePrefix:   viper.GetString("DB_TABLE_PREFIX"),
    SingularTable: true,
},
```

Jadi **nama tabel sebenarnya singular**: `user`, `dzikir`, `hadith`, `doa`,
`kajian`, `perawi`, `translation`, `islamic_term`, `page_view`, `user_activity`,
`hafalan_progress`, `fiqh_category`, `fiqh_item`.

Konsekuensinya arah bug-nya **kebalikan** dari draf awal: yang keliru adalah raw
SQL yang menulis bentuk **plural**. Dan ke-22 statement `CREATE INDEX` di
`repository.go` sebenarnya **sudah benar sejak awal** — perubahan yang sempat
saya buat ke sana keliru dan sudah di-revert.

## Metode verifikasi (yang benar)

Postgres di Docker, di-migrate lewat jalur aplikasi sendiri (`go run . -migrate`),
lalu API dijalankan dan endpoint-nya dipukul via HTTP. Untuk isolasi query dipakai
probe GORM yang memakai `SingularTable: true` persis seperti aplikasi.

## Diagnosa per endpoint

| Endpoint | Penyebab | Perbaikan |
|---|---|---|
| `/leaderboard/hafalan` | `JOIN users` (tabel `user`) + `users.id` text vs `user_id` uuid | `JOIN "user" u ON u.id = hp.user_id::text` |
| `/leaderboard/streak` | `FROM user_activities` (tabel `user_activity`) + join yang sama | `FROM user_activity`, `JOIN "user" … ::text` |
| `/wirid/occasion/*` | `dzikirs.occasion` (tabel `dzikir`) | `dzikir.occasion` / `dzikir.id` |
| `/forum/questions` | `Preload("User")` pada field bertag `gorm:"-"` | Hidrasi author lewat query terpisah |
| `/fiqh/{slug}/{id}` | `fiqh_categories`/`fiqh_items` | `fiqh_category`/`fiqh_item` |
| `/admin` page-view analytics | `JOIN users` ×2 | `JOIN "user" … ::text` |

Catatan: `"user"` adalah reserved word di Postgres, jadi wajib di-quote.

### Dua hal yang menyamarkan bug ini

1. **`fiqhController.FindItemByCategoryAndID` memetakan semua error jadi 404**,
   jadi `relation does not exist` tampil sebagai "Not found" yang tampak wajar.
2. **Test repository membuka GORM tanpa NamingStrategy aplikasi**, sehingga
   menguji skema plural yang tidak pernah ada di produksi — test hijau, produksi
   500. Helper dzikir/fiqh kini disamakan dengan konfigurasi aplikasi, dan justru
   perubahan itu yang membongkar bug `fiqh_category`.

### `users.id` bertipe text

`BaseUUID.ID` hanya diberi tag `gorm:"primarykey"` tanpa `type:uuid`
(`app/model/base.go:22`), jadi kolomnya **text**, sementara kolom FK seperti
`hafalan_progress.user_id` eksplisit `uuid`. Karena itu setiap join ke `user`
butuh cast `::text`. Ini temuan yang tetap berlaku dari draf awal.

## Otorisasi hapus chat

`chatController.Delete` hanya memastikan pemanggil login — **setiap user
terautentikasi bisa menghapus pesan siapa pun**, padahal UI-nya
(`ChatBox.js`, `isAdmin || isMe`) berniat "admin atau pesan sendiri".
Kepemilikan sekarang didorong ke dalam query (`ownerID` nil = admin), dan baris
yang tidak cocok mengembalikan 403.

## Hasil verifikasi end-to-end

API lokal + Postgres ter-seed lewat jalur migrasi aplikasi:

```
leaderboard/hafalan   200      wirid/occasion/jumat   200
leaderboard/streak    200      wirid/occasion/harian  200
forum/questions       200      dzikir                 200
komunitas/chat        200      lessons                200
```

Chat (dua user + admin):

```
bob hapus pesan alice          403 ✅
anonim hapus                   401 ✅
alice hapus pesan sendiri      200 ✅
admin hapus pesan alice        200 ✅
```

Lessons admin CRUD: create non-admin 403 ✅, create admin 200 ✅, get 200 ✅,
update 200 ✅, delete 200 ✅. SSE `/komunitas/chat/stream` 200 ✅.

`go build ./...` lolos, `go test ./app/...` lolos, `gofmt` bersih,
`next build` lolos (142 halaman), mobile jest 734 test lolos.

## Yang masih perlu tindakan

1. **AutoMigrate tidak jalan saat aplikasi start untuk Postgres**
   (`app/db/postgresql.go` tidak memanggilnya) — hanya lewat `-migrate` /
   `scripts/db_setup.go`. Skema produksi bisa drift diam-diam. Pertimbangkan
   menjalankan migrasi sebagai bagian dari deploy.
2. **`admin@tholabul-ilmi.com` / `Admin@123`** aktif di produksi dan sempat
   ter-commit di `scripts/capture-all-routes-vps.mjs`. Sudah dipindah ke env var,
   tapi **password-nya tetap harus diganti** karena sudah ada di histori git.
3. **`GET /api/v1/blog/posts` membocorkan email admin** lewat objek `author`.
   Serialize `{id, name}` saja.
4. Helper test lain (`bookmark`, `library_book`, `audio`, `delete_result`) masih
   membuka GORM tanpa `SingularTable`. Belum menimbulkan masalah karena tidak
   memakai nama tabel eksplisit, tapi sebaiknya diseragamkan.
5. Sisa dari laporan utama yang belum dikerjakan: `/dashboard/quiz` tanpa opsi
   jawaban, kontrak `/dashboard/fiqh`, toast lokasi di semua route, tombol forum
   biru, duplikasi 9 route, performa halaman panjang.
