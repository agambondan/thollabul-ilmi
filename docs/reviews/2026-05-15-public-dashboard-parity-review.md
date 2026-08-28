# Public And Dashboard Feature Parity Review

Tanggal: `2026-05-15`
Scope: `apps/web`
Status: `REVIEWED`

Review ini fokus pada fitur yang tersedia di public dan dashboard customer.
Prinsip produk yang dipakai: fitur seperti Al-Quran, Hadis, Tafsir, Doa,
Dzikir, Zakat, Forum, dan pencarian boleh tersedia di public tanpa login dan
di dashboard setelah login. Yang berbeda seharusnya layout/shell, bukan
capability inti atau route journey. Jika user sudah berada di dashboard, CTA,
detail, back link, search result, dan next action harus tetap berada di
`/dashboard/*` kecuali CTA-nya memang eksplisit untuk keluar ke public app.

Referensi heuristik UX yang dipakai: Web Interface Guidelines terbaru
menekankan CTA spesifik, navigasi memakai `Link`, URL merefleksikan state, dan
interactive element tidak menyamarkan aksi.

## Ringkasan Prioritas

| Priority | Area                                 | Temuan                                                                                                                                                         |
| -------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Dashboard search                     | `DashboardSearchPage` memakai `SearchClient` public, sehingga semua hasil dan `Lihat Semua` keluar ke public route.                                            |
| P0       | Dashboard forum                      | Forum dashboard reuse public component tanpa `basePath`; CTA `Tanya` dan detail question keluar ke `/forum/*`.                                                 |
| P0       | Dashboard Daily Ayah widget          | Dashboard mengirim `basePath='/dashboard/quran'`, tetapi widget membuat URL `/dashboard/quran/surah/:slug` yang tidak ada routenya.                            |
| P0       | Dashboard hadis                      | Search hadis dashboard mengarah ke `/search`, bukan `/dashboard/search`; dashboard index juga tidak sync dengan fitur tab public.                              |
| P1       | Dashboard tafsir                     | Reader dashboard adalah duplikasi yang drift dari public reader; fitur filter kitab/side-by-side public belum ada di dashboard.                                |
| P1       | Dashboard Quran                      | Index public dan dashboard terpisah; route dashboard saat ini benar, tetapi shared behavior rawan drift.                                                       |
| P1       | Dashboard bookmarks                  | Mapping bookmark dashboard belum sync dengan ref type aktual dan beberapa target masih public.                                                                 |
| P1       | Dashboard zakat                      | CTA `Lihat Riwayat Zakat` dari dashboard mengarah ke `/zakat/history`, dan dashboard history belum ada.                                                        |
| P1       | Dashboard Asbabun Nuzul              | Result badge ayah dari dashboard mengarah ke Quran public, bukan dashboard Quran.                                                                              |
| P1       | Asmaul Husna subflow                 | Main Asmaul sudah context-aware, tetapi flashcard/wirid back link dari dashboard balik ke public.                                                              |
| P1       | Dashboard profile                    | CTA edit profile keluar dari dashboard ke `/profile`.                                                                                                          |
| P1       | Public profile                       | Jika user keluar dari dashboard profile ke public profile, quick links personal semuanya public route.                                                         |
| P1       | Public navbar account menu           | Logged-in account menu di public shell masih mengarah ke public personal routes, bukan dashboard equivalents.                                                  |
| P1       | Global floating settings/layout mode | `SettingButton` belum dipasang di root route tree; sebagian route tidak punya tombol setting, dan sebagian content container belum merespons `wide`/`compact`. |
| P2       | Public footer/sidebar shortcuts      | Footer dan legacy sidebar masih punya shortcut personal ke public routes, bukan dashboard equivalents.                                                         |
| P2       | Auth/register intent                 | Login sudah support `next`, tetapi register dan beberapa auth CTA belum meneruskan `next`.                                                                     |
| P2       | Public personal empty states         | Beberapa halaman personal public punya empty-state CTA ke public routes, bukan dashboard route atau preserved intent.                                          |
| P2       | Global 404/error recovery            | 404 dan global error selalu menawarkan public home/content, tidak context-aware untuk dashboard/admin.                                                         |
| P2       | Forum detail guest recovery          | Forum detail guest login/back CTA hardcode public route tanpa `next`.                                                                                          |
| P2       | Admin generic CRUD                   | Banyak admin CRUD module catch error kosong dan icon-only action belum punya accessible label.                                                                 |
| P2       | Tahlil/dashboard                     | Link Surah Yasin di note tahlil keluar ke public Quran.                                                                                                        |
| P2       | Login fallback reused content        | Beberapa reused public content masih mengarah ke `/auth/login` tanpa preserve dashboard intent.                                                                |

---

## Architecture Finding

### P0. Belum Ada Pola `basePath` Yang Konsisten Untuk Fitur Public + Dashboard

Evidence:

- Banyak dashboard page reuse public content langsung:
  `apps/web/src/app/dashboard/forum/page.js`,
  `apps/web/src/app/dashboard/zakat/page.js`,
  `apps/web/src/app/dashboard/tahlil/page.js`,
  `apps/web/src/app/dashboard/search/page.js`,
  `apps/web/src/app/dashboard/asmaul-husna/flashcard/page.js`,
  `apps/web/src/app/dashboard/asmaul-husna/wirid/page.js`.
- Ada contoh yang sudah lebih benar:
  `apps/web/src/app/dashboard/blog/page.js` mengirim `basePath='/dashboard/blog'`.
- Ada contoh context-aware tetapi belum merata:
  `apps/web/src/app/asmaul-husna/page.js:21-24` dan
  `apps/web/src/app/asmaul-husna/page.js:120-123` memakai pathname untuk
  membedakan public vs dashboard.

Impact:

- Setiap fitur punya pola sendiri: ada yang duplikasi page, ada yang hardcode
  route public, ada yang `basePath`, ada yang cek pathname.
- Saat fitur public bertambah, dashboard bisa tertinggal.
- Saat user login dan masuk dashboard, CTA kecil bisa mengeluarkan user ke
  shell public tanpa disadari.

Recommendation:

- Standardisasi component publik-dashboard:
  `FeatureContent({ basePath, dashboardMode, loginNext, relatedRouteMap })`.
- Public page hanya wrapper:
  `basePath='/quran'`, `dashboardMode=false`.
- Dashboard page hanya wrapper:
  `basePath='/dashboard/quran'`, `dashboardMode=true`.
- Semua route internal component harus dibentuk dari `basePath` atau
  `routeMap`, bukan hardcode `/feature`.

### P1. Floating Settings Button Belum Global Dan Layout Mode Belum Merata

Evidence:

- `apps/web/src/app/layout.js:71-83` hanya memasang `LocaleProvider` dan
  `AuthProvider`; root route tree belum memasang `SettingButton`.
- `SettingButton` sendiri sudah membawa kontrol `compact`/`wide` lewat
  `useLayoutMode` di `apps/web/src/components/popup/SettingButton.js:15` dan
  tombol toggle di `apps/web/src/components/popup/SettingButton.js:63-99`.
- State layout disimpan sebagai `layoutMode` di localStorage oleh
  `apps/web/src/lib/useLayoutMode.js:5-31`.
- Saat ini tombol setting dipasang lokal di beberapa shell/reader:
  `apps/web/src/app/dashboard/layout.js:477-480`,
  `apps/web/src/app/admin/layout.js:339-342`,
  `apps/web/src/app/quran/[...slug]/InfiniteScrollAyahPage.js:153-315`, dan
  `apps/web/src/app/hadith/[slug]/InfiniteScrollHadithPage.js:176-254`.
- `dashboard/layout.js` dan `admin/layout.js` mengirim prop
  `isShowFixedComponent`, tetapi `SettingButton` di
  `apps/web/src/components/popup/SettingButton.js:11` tidak menerima props, jadi
  prop tersebut tidak mengontrol visibility/dedupe apa pun.
- Banyak route lain tidak memasang tombol sama sekali, termasuk auth, landing,
  forum, zakat, kamus, perawi, quiz, dan beberapa route utility/error.
- Banyak page sudah memakai `useLayoutMode`, tetapi masih banyak route customer
  dashboard/admin yang memakai wrapper hardcoded seperti `p-6`,
  `px-4 py-6`, `container mx-auto`, atau `max-w-*` tanpa layout-aware wrapper.

Impact:

- User bisa melihat opsi `wide`/`compact` di dashboard, admin, Quran reader, atau
  Hadis reader, tetapi kehilangan akses tombol yang sama setelah pindah ke route
  public/detail lain.
- Karena button dipasang per-route, implementasi global nanti berisiko
  menggandakan floating button di dashboard/admin/Quran/Hadis jika instance
  lokal tidak dihapus atau dibuat singleton.
- Setting `wide`/`compact` terasa tidak konsisten: sebagian page berubah lebar,
  sebagian tetap terkunci di `max-w-*` atau padding lokal.

Recommendation:

- Pindahkan rendering `SettingButton` ke root client shell di bawah
  `LocaleProvider`/`AuthProvider`, atau buat `GlobalSettingButton` yang dipasang
  sekali di `apps/web/src/app/layout.js`.
- Hapus/guard instance lokal di dashboard layout, admin layout, Quran reader,
  dan Hadis reader supaya tiap route hanya punya satu floating settings button.
- Buat shared layout-aware wrapper, misalnya
  `ContentWidth({ compact = 'max-w-5xl', children })`, agar page tidak perlu
  mengulang ternary `isWide ? 'w-full' : 'max-w-* mx-auto'`.
- Audit halaman public, dashboard customer, dan admin CRUD yang masih hardcode
  wrapper. Route fullscreen/auth boleh dikecualikan hanya kalau alasannya
  eksplisit.

---

## Customer Dashboard CTA Leakage

### P0. Dashboard Search Mengeluarkan Semua Result Ke Public Route

Evidence:

- `apps/web/src/app/dashboard/search/page.js` reuse
  `apps/web/src/app/search/SearchClient.js`.
- `apps/web/src/app/search/SearchClient.js:24-30` hardcode `SECTION_HREFS` ke
  `/search`, `/kamus`, `/doa`, `/kajian`, `/perawi`.
- `apps/web/src/app/search/SearchClient.js:46-48` result ayah menuju
  `/quran/surah/...`.
- `apps/web/src/app/search/SearchClient.js:67-69` result hadis menuju
  `/hadith/...`.
- `apps/web/src/app/search/SearchClient.js:263-310` result doa, kamus, kajian,
  dan perawi juga menuju public route.

Impact:

- User berada di dashboard, mencari "shalat", lalu klik hasil Quran/Hadis/Doa
  dan keluar ke public layout.
- Search di dashboard terasa seperti portal public, bukan alat navigasi dalam
  workspace dashboard.

Recommendation:

- `SearchClient` menerima `baseRoutes`:
    - ayah detail `-> /dashboard/quran/:slug#ayah`
    - hadis detail `-> /dashboard/hadith/:book#number`
    - doa `-> /dashboard/doa#id`
    - kamus `-> /dashboard/kamus?q=...`
    - kajian `-> /dashboard/kajian/:id`
    - perawi `-> /dashboard/perawi/:id`
- `SECTION_HREFS` juga harus context-aware:
  `/dashboard/search?q=...&type=ayah`, bukan `/search?...`.

### P0. Dashboard Forum CTA Dan Detail Keluar Ke Public Forum

Evidence:

- `apps/web/src/app/dashboard/forum/page.js` memanggil `<ForumListContent />`
  tanpa `basePath`.
- `apps/web/src/app/forum/page.js:75` dan
  `apps/web/src/app/forum/page.js:100` CTA `Tanya` hardcode ke `/forum/ask`.
- `apps/web/src/app/forum/page.js:112` detail question hardcode ke
  `/forum/${q.slug}`.
- Tidak ada route `apps/web/src/app/dashboard/forum/ask/page.js`.
- Tidak ada route `apps/web/src/app/dashboard/forum/[slug]/page.js`.

Impact:

- Dari dashboard, user klik Forum, lalu klik `Tanya` atau question detail dan
  keluar dari dashboard shell.
- Ini mismatch langsung dengan ekspektasi user journey dashboard.

Recommendation:

- Buat `ForumListContent({ basePath = '/forum' })`.
- Public wrapper:
  `basePath='/forum'`.
- Dashboard wrapper:
  `basePath='/dashboard/forum'`.
- Tambahkan dashboard routes:
    - `/dashboard/forum/ask`
    - `/dashboard/forum/[slug]`
- Jika forum sengaja dianggap community public, label sidebar dashboard harus
  eksplisit seperti `Forum Publik`, bukan sekadar `Forum`.

### P0. Dashboard Hadis Search Keluar Ke Public Search

Evidence:

- `apps/web/src/app/dashboard/hadith/page.js:38-43` submit search memakai
  `window.location.href = /search?q=...&type=hadith`.
- Pada list kitab, detail sudah benar ke `/dashboard/hadith/${book.slug}` di
  `apps/web/src/app/dashboard/hadith/page.js:74-77`.

Impact:

- User mencari hadis dari dashboard, tetapi hasil search muncul di public shell.
- Karena result search juga hardcode public route, user terus terbawa ke public
  journey.

Recommendation:

- Ubah target search dashboard hadis ke:
  `/dashboard/search?q=<query>&type=hadith`.
- Lebih baik pakai `router.push` atau `Link`-compatible URL state, bukan
  assignment `window.location.href`.

### P0. Daily Ayah Widget Di Dashboard Membuat Route Yang Tidak Ada

Evidence:

- Dashboard home memakai widget:
  `apps/web/src/app/dashboard/page.js:257-260` dengan
  `<DailyAyahWidget basePath='/dashboard/quran' />`.
- `apps/web/src/components/DailyAyahWidget.js:18` menerima `basePath`.
- `apps/web/src/components/DailyAyahWidget.js:86-89` membentuk URL:
  `${basePath}/surah/${surahSlug}#${ayahNum}`.
- Route dashboard Quran yang ada hanya:
  `apps/web/src/app/dashboard/quran/page.js`,
  `apps/web/src/app/dashboard/quran/[slug]/page.js`, dan
  `apps/web/src/app/dashboard/quran/page-mushaf/page.js`.
- Tidak ada route `apps/web/src/app/dashboard/quran/surah/...`.

Impact:

- Dari dashboard home, CTA `Baca selengkapnya` pada ayat harian bisa menuju
  404 atau route yang tidak dimaksud.
- Ini bukan sekadar keluar ke public, tetapi broken CTA di dalam dashboard.

Recommendation:

- Jangan gabungkan `basePath` dengan path segment `surah` secara hardcode.
- Jadikan widget menerima formatter:
  `buildHref({ surahSlug, ayahNum })`.
- Public formatter:
  `/quran/surah/${surahSlug}#${ayahNum}`.
- Dashboard formatter:
  `/dashboard/quran/${surahSlug}#${ayahNum}`.

### P1. Hadis Theme Route Ada Di Public Tapi Tidak Ada Di Dashboard

Evidence:

- Public route punya `apps/web/src/app/hadith/theme/[slug]/page.js`.
- Dashboard hadis hanya punya:
  `apps/web/src/app/dashboard/hadith/page.js` dan
  `apps/web/src/app/dashboard/hadith/[slug]/page.js`.
- Public hadis theme card hardcode ke public:
  `apps/web/src/app/hadith/byTheme.js:67` mengarah ke
  `/hadith/theme/${themeSlug}`.
- Public hadis chapter flow juga hardcode ke public detail:
  `apps/web/src/app/hadith/byChapter.js:211-214` mengarah ke
  `/hadith/${selectedBookSlug}?theme=...&chapter=...`.

Impact:

- Dashboard tidak punya padanan penuh untuk public hadis by-theme.
- Kalau component public hadis direuse tanpa route map, user akan keluar ke
  public `/hadith/theme/*`.

Recommendation:

- Tambahkan dashboard equivalent untuk theme route, misalnya
  `/dashboard/hadith/theme/[slug]`, atau fold theme route ke
  `/dashboard/hadith?tab=theme`.
- Semua child hadis perlu menerima `basePath` dan `themeBasePath`.

### P1. Dashboard Bookmarks Mapping Tidak Sesuai Ref Type Aktual

Evidence:

- `apps/web/src/app/dashboard/bookmarks/page.js:29-36` mapping ref target
  masih manual.
- Quran reader menyimpan bookmark dengan `refType='ayah'`:
  `apps/web/src/app/quran/[...slug]/AyahPage.js:245`.
- Dashboard bookmarks tidak menangani `refType === 'ayah'`; yang ada adalah
  `refType === 'quran'` di
  `apps/web/src/app/dashboard/bookmarks/page.js:30`.
- Fallback untuk ref type tidak dikenal adalah `/dashboard` di
  `apps/web/src/app/dashboard/bookmarks/page.js:36`.
- Article bookmark di dashboard malah mengarah ke public blog:
  `apps/web/src/app/dashboard/bookmarks/page.js:35` mengembalikan
  `/blog/${refSlug}`.

Impact:

- Bookmark ayah yang dibuat dari Quran reader berpotensi tidak bisa membuka
  ayatnya dari dashboard bookmarks.
- Bookmark artikel dari dashboard bookmarks keluar ke public blog, padahal
  dashboard blog/detail sudah ada.

Recommendation:

- Samakan ref type dengan producer aktual:
  `ayah`, `hadith`, `article`, `doa`, `dzikir`, `asmaul_husna`.
- Dashboard `refHref` harus mengarah ke dashboard equivalents:
    - ayah `-> /dashboard/quran/:surahSlug#ayah`
    - hadith `-> /dashboard/hadith/:bookSlug#number`
    - article `-> /dashboard/blog/:slug`
- Jika backend bookmark belum menyimpan slug cukup, simpan route metadata saat
  bookmark dibuat atau resolve metadata sebelum render.

### P1. Profile Edit Dari Dashboard Keluar Ke Public Profile

Evidence:

- `apps/web/src/app/dashboard/profile/page.js:109-114` CTA `profile.edit`
  mengarah ke `/profile`.
- Public profile quick links mengarah ke public routes, bukan dashboard:
  `apps/web/src/app/profile/page.js:253-390` berisi `/bookmarks`,
  `/hafalan`, `/tilawah`, `/amalan`, `/muroja-ah`, `/notes`,
  `/jadwal-sholat`, `/zakat`, `/kiblat`, `/kamus`, `/sholat-tracker`,
  `/muhasabah`, `/goals`, `/kajian`, dan `/notifications`.

Impact:

- User sedang di account dashboard, tetapi edit profile pindah shell ke public.
- CTA `Edit` terdengar inline/dashboard-local, bukan "buka halaman public".
- Setelah pindah ke public profile, quick links personal makin membawa user ke
  public shell untuk fitur yang punya padanan dashboard.

Recommendation:

- Buat `/dashboard/profile/edit` atau edit inline pada dashboard profile.
- Jika `/profile` memang halaman setting utama, label harus eksplisit:
  `Buka Pengaturan Profil`.
- Atau jadikan `ProfileContent({ basePath = '/dashboard' })` sehingga public
  dan dashboard dapat berbagi data profil tanpa mencampur route journey.

### P1. Public Navbar Account Menu Menjaga User Di Public Personal Routes

Evidence:

- Desktop logged-in menu di `apps/web/src/components/Navbar.js:329-407`
  mengarah ke `/profile`, `/bookmarks`, `/hafalan`, `/muroja-ah`,
  `/tilawah`, `/amalan`, `/notes`, `/notifications`, dan `/stats`.
- Mobile logged-in menu di `apps/web/src/components/Navbar.js:572-645`
  mengulang pola yang sama.
- Menu juga punya `/dashboard` sebagai item pertama, sehingga aplikasi sudah
  mengenali dashboard sebagai shell personal, tetapi child CTA tetap public.

Impact:

- User login yang sedang di public page dan membuka account menu tidak diarahkan
  ke dashboard equivalents untuk fitur personal.
- Setelah user keluar dari dashboard ke public profile/public page, navbar
  makin mempertahankan journey di public shell.

Recommendation:

- Account menu logged-in sebaiknya personal dashboard first:
  `/dashboard/profile`, `/dashboard/bookmarks`, `/dashboard/hafalan`,
  `/dashboard/muroja-ah`, `/dashboard/tilawah`, `/dashboard/amalan`,
  `/dashboard/notes`, `/dashboard/notifications`, `/dashboard/stats`.
- Public shell boleh tetap punya content nav public untuk Quran/Hadis/Doa,
  tetapi account dropdown harus konsisten sebagai personal dashboard entry.

### P2. Footer Dan Legacy Sidebar Belum Dashboard-Aware Untuk Personal Links

Evidence:

- `apps/web/src/components/Footer.js:22-30` menaruh tracker links ke
  `/hafalan`, `/muroja-ah`, `/tilawah`, `/amalan`, `/stats`, dan
  `/leaderboard`.
- `apps/web/src/components/Footer.js:45-54` tools links juga mencampur personal
  routes seperti `/notes`, `/bookmarks`, dan `/notifications`.
- `apps/web/src/components/Sidebar.js:52-62` worship tracker links mengarah ke
  public personal routes.
- `apps/web/src/components/Sidebar.js:91-101` account links mengarah ke
  `/bookmarks`, `/notes`, `/stats`, `/notifications`, dan `/profile`.
- `Sidebar` saat ini hanya terlihat dipakai oleh test:
  `apps/web/src/__tests__/Sidebar.test.js`, jadi risikonya lebih rendah kalau
  memang sudah legacy.

Impact:

- Footer public bisa tetap membawa user login ke public personal shell, padahal
  fitur personal sudah punya dashboard equivalents.
- Jika `Sidebar` dipakai kembali di masa depan, route personalnya akan mengulang
  masalah navbar public.

Recommendation:

- Footer links untuk fitur public tetap public.
- Footer/account links untuk fitur personal sebaiknya:
    - guest: `/auth/login?next=/dashboard/<feature>`
    - logged-in: `/dashboard/<feature>`
- Jika `Sidebar` legacy, tandai deprecated atau hapus dari navigasi aktif supaya
  tidak jadi sumber drift baru.

### P2. Register Flow Tidak Preserve `next`

Evidence:

- Login page sudah membaca `next`:
  `apps/web/src/app/auth/login/page.js:21-35`.
- Register page tidak membaca `next`; authenticated user diarahkan ke `/` di
  `apps/web/src/app/auth/register/page.js:21-24`.
- Setelah register sukses, user diarahkan ke
  `/auth/login?registered=1` di
  `apps/web/src/app/auth/register/page.js:31-32`, tanpa meneruskan `next`.
- Link dari login ke register juga tidak meneruskan `next`:
  `apps/web/src/app/auth/login/page.js:122-129`.

Impact:

- CTA guest seperti `Mulai Hafalan` bisa mengarah ke register/login, tetapi
  setelah register user tidak kembali ke fitur yang dimaksud.
- Ini menjelaskan kenapa beberapa CTA terasa "tidak sesuai fungsi" walau route
  target awalnya benar.

Recommendation:

- Register juga baca `next`.
- Login-to-register link menjadi `/auth/register?next=<nextUrl>`.
- Register sukses redirect ke `/auth/login?registered=1&next=<nextUrl>` atau
  langsung login lalu `router.push(nextUrl)`.

### P2. Public Personal Empty-State CTA Masih Mengunci User Di Public Shell

Evidence:

- Public murojaah guest CTA login hardcode ke `/auth/login`:
  `apps/web/src/app/muroja-ah/page.js:123-128`.
- Public murojaah empty state mengarah ke `/hafalan`:
  `apps/web/src/app/muroja-ah/page.js:225-230`.
- Public stats empty state mengarah ke `/quran` dan `/hadith`:
  `apps/web/src/app/stats/page.js:311-323`.
- Public personal routes yang memakai `useRequireAuth` tanpa `next`:
  `apps/web/src/app/amalan/page.js`,
  `apps/web/src/app/bookmarks/page.js`,
  `apps/web/src/app/goals/page.js`,
  `apps/web/src/app/hafalan/page.js`,
  `apps/web/src/app/muhasabah/page.js`,
  `apps/web/src/app/notifications/page.js`,
  `apps/web/src/app/profile/page.js`,
  `apps/web/src/app/sholat-tracker/page.js`,
  `apps/web/src/app/stats/page.js`,
  `apps/web/src/app/tilawah/page.js`.

Impact:

- Public personal pages masih berperilaku sebagai shell utama personal, padahal
  dashboard sudah menjadi shell personal yang lebih tepat.
- Empty-state CTA bisa membawa user ke public route padanan, bukan dashboard.

Recommendation:

- Untuk public personal pages, pilih salah satu:
    - redirect canonical ke `/dashboard/<feature>`
    - atau jadikan public wrapper yang hanya preserve intent ke dashboard setelah
      login.
- `useRequireAuth` harus preserve current path sebagai `next`, atau menerima
  target dashboard canonical.

### P2. Global 404 Dan Error Recovery Tidak Context-Aware

Evidence:

- `apps/web/src/app/NotFoundClient.js:6-12` quick links hanya berisi public
  content routes: `/quran`, `/hadith`, `/doa`, `/dzikir`, `/blog`.
- `apps/web/src/app/NotFoundClient.js:42-47` primary recovery selalu ke `/`.
- `apps/web/src/app/error.js:33-38` global error secondary recovery juga selalu
  ke `/`.

Impact:

- Jika user terkena 404/error dari `/dashboard/*`, recovery CTA membawa user
  keluar ke public shell, bukan kembali ke dashboard.
- Low impact karena hanya terjadi di error state, tetapi saat terjadi user sedang
  butuh recovery yang jelas.

Recommendation:

- 404/error perlu membaca pathname dan memilih recovery:
    - `/dashboard/*` -> `/dashboard`
    - `/admin/*` -> `/admin`
    - public -> `/`
- Quick links pada 404 dashboard sebaiknya dashboard-aware:
  `/dashboard/search`, `/dashboard/quran`, `/dashboard/hadith`, atau
  `Kembali ke Dashboard`.

### P2. Forum Detail Guest Recovery Masih Hardcode Public Route

Evidence:

- `apps/web/src/app/forum/[slug]/page.js:80` not-found back link ke `/forum`.
- `apps/web/src/app/forum/[slug]/page.js:91-92` normal back link ke `/forum`.
- `apps/web/src/app/forum/[slug]/page.js:188-192` guest answer CTA ke
  `/auth/login`, tanpa `next=/forum/:slug`.

Impact:

- Jika nanti dashboard forum detail ditambahkan dengan reuse component yang sama,
  back link dan login-to-answer akan keluar ke public route.
- Untuk public forum sendiri, guest login tidak kembali ke pertanyaan yang ingin
  dijawab.

Recommendation:

- `ForumDetailContent({ basePath = '/forum', loginNext })`.
- Public login target:
  `/auth/login?next=/forum/:slug`.
- Dashboard login target:
  `/auth/login?next=/dashboard/forum/:slug`.

### P2. Generic Admin CRUD Modules Tidak Menampilkan Gagal Save/Delete

Evidence:

- Pola save/delete tanpa `res.ok` atau error UI terlihat di banyak module:
    - `apps/web/src/app/admin/doa/page.js:67-89`
    - `apps/web/src/app/admin/dzikir/page.js:69-91`
    - `apps/web/src/app/admin/fiqh/page.js:75-97`
    - `apps/web/src/app/admin/kajian/page.js:81-103`
    - `apps/web/src/app/admin/asbabun-nuzul/page.js:108-141`
    - `apps/web/src/app/admin/asmaul-husna/page.js:66-89`
    - `apps/web/src/app/admin/kamus/page.js:60-82`
    - `apps/web/src/app/admin/manasik/page.js:78-101`
    - `apps/web/src/app/admin/tahlil/page.js:63-86`
    - `apps/web/src/app/admin/wirid/page.js:67-89`
    - `apps/web/src/app/admin/quiz/page.js:75-104`
    - `apps/web/src/app/admin/sejarah/page.js:72-94`
- Banyak table actions memakai icon-only edit/delete/open buttons tanpa
  `aria-label`, contohnya `apps/web/src/app/admin/kajian/page.js:188-209`.

Impact:

- Admin klik `Simpan` atau `Hapus`, modal bisa tertutup/reload dipanggil walau
  backend menolak atau network gagal.
- Jika gagal diam-diam, admin bisa mengira CTA berhasil.
- Icon-only action masih kurang jelas untuk screen reader dan lebih rawan salah
  klik pada row padat.

Recommendation:

- Semua admin API mutation harus:
    - cek `res.ok`
    - tampilkan inline error/toast
    - tidak menutup modal sebelum sukses
    - disable submit hanya selama request aktif
- Icon-only row actions wajib punya `aria-label` dan `title` spesifik:
  `Edit doa: {title}`, `Hapus kajian: {title}`, `Buka tautan kajian`.

### P2. Dashboard Logo Mengarah Ke Public Home Tanpa Label Exit Yang Jelas

Evidence:

- `apps/web/src/app/dashboard/layout.js:223-225` logo dashboard mengarah ke
  `/`.
- Admin layout lebih eksplisit dengan label `back_to_app` di
  `apps/web/src/app/admin/layout.js:153-165`.

Impact:

- Klik logo di dashboard bisa dianggap kembali ke dashboard home, tetapi justru
  keluar ke landing/public home.

Recommendation:

- Logo dashboard sebaiknya ke `/dashboard`.
- Jika tetap ke `/`, tambah affordance `Buka Public App` atau tempatkan sebagai
  secondary link.

---

## Feature Parity Drift

### P0. Dashboard Hadis Tidak Sync Dengan Public Hadis

Evidence:

- Public hadis punya tab flow via `HadithTab` dan empat mode:
  `ByBook`, `ByTheme`, `ByChapter`, `ByHadith` di
  `apps/web/src/app/hadith/page.js`.
- Public child components memiliki route hardcode public:
  `apps/web/src/app/hadith/byBook.js:71`,
  `apps/web/src/app/hadith/byTheme.js:67`,
  `apps/web/src/app/hadith/byChapter.js:135`,
  `apps/web/src/app/hadith/byHadith.js:120`,
  `apps/web/src/app/hadith/byHadith.js:161`,
  `apps/web/src/app/hadith/byHadith.js:214`.
- Dashboard hadis index hanya list kitab dan search:
  `apps/web/src/app/dashboard/hadith/page.js:45-80`.

Impact:

- Public user bisa browse hadis by kitab/theme/chapter/nomor, tetapi dashboard
  user hanya mendapat subset flow.
- Jika fitur public hadis diperbaiki, dashboard kemungkinan tertinggal karena
  tidak memakai component yang sama.

Recommendation:

- Refactor public hadis menjadi `HadithContent({ basePath, searchPath })`.
- Jadikan `ByBook`, `ByTheme`, `ByChapter`, dan `ByHadith` menerima `basePath`.
- Dashboard harus punya capability yang sama, hanya layout dan shell yang beda.

### P1. Dashboard Tafsir Drift Dari Public Tafsir

Evidence:

- Public tafsir reader memiliki state `kitabFilter` dan `sideBySide` di
  `apps/web/src/app/tafsir/[slug]/page.js:35-39`.
- Public tafsir memiliki mode side-by-side untuk dua kitab di
  `apps/web/src/app/tafsir/[slug]/page.js:340-383`.
- Public tafsir memiliki CTA `read in quran`, tetapi route-nya public:
  `apps/web/src/app/tafsir/[slug]/page.js:393-399`.
- Dashboard tafsir reader adalah implementasi terpisah:
  `apps/web/src/app/dashboard/tafsir/[slug]/page.js`.
- Dashboard tafsir hanya punya search, expand/collapse, Latin, dan Terjemahan:
  `apps/web/src/app/dashboard/tafsir/[slug]/page.js:150-207`.
- Dashboard labels tafsir juga berbeda dari public mapping:
  `Tafsir Jalalain` dan `Tafsir Quraish Shihab` di
  `apps/web/src/app/dashboard/tafsir/[slug]/page.js:283-301`.

Impact:

- Dashboard tafsir tidak punya semua capability public.
- Jika public tafsir direuse mentah, CTA `read in quran` akan bocor ke
  `/quran/surah/...`.

Recommendation:

- Buat `TafsirReaderContent({ tafsirBasePath, quranBasePath })`.
- Public:
  `tafsirBasePath='/tafsir'`, `quranBasePath='/quran/surah'`.
- Dashboard:
  `tafsirBasePath='/dashboard/tafsir'`,
  `quranBasePath='/dashboard/quran'`.
- Samakan daftar fitur: kitab filter, side-by-side, search, expand/collapse,
  Latin, terjemahan, dan read-in-Quran.

### P1. Dashboard Quran Aman Secara Route Saat Ini, Tapi Implementasinya Duplikatif

Evidence:

- Public Quran index hardcode public route:
  `apps/web/src/app/quran/QuranPageClient.js:71-73` ke
  `/quran/page-mushaf`.
- Public Quran surah card hardcode:
  `apps/web/src/app/quran/QuranPageClient.js:89-93` ke
  `/quran/surah/...`.
- Dashboard Quran index adalah file terpisah dengan route dashboard:
  `apps/web/src/app/dashboard/quran/page.js:47-50` dan
  `apps/web/src/app/dashboard/quran/page.js:81-86`.
- Dashboard Quran reader sudah memakai `basePath='/dashboard/quran'`:
  `apps/web/src/app/dashboard/quran/[slug]/page.js:10-15`.
- Shared reader sudah mendukung `basePath` di
  `apps/web/src/app/quran/[...slug]/InfiniteScrollAyahPage.js:25`,
  `apps/web/src/app/quran/[...slug]/InfiniteScrollAyahPage.js:146-149`.

Impact:

- Reader sudah punya pola bagus, tetapi index belum.
- Jika public Quran index mendapat fitur baru, dashboard index perlu diubah
  manual juga.

Recommendation:

- Jadikan Quran index shared component dengan prop:
  `QuranIndexContent({ basePath, mushafPath, compactDashboard })`.
- Pertahankan dashboard layout compact, tetapi jangan pisahkan logic data,
  search, sorting, shortcut mushaf, dan card route.

### P1. Zakat Dashboard Mengarah Ke Public History Dan Dashboard History Tidak Ada

Evidence:

- `apps/web/src/app/dashboard/zakat/page.js` reuse public `ZakatContent`.
- `apps/web/src/app/zakat/page.js:557` CTA `Lihat Riwayat Zakat` hardcode ke
  `/zakat/history`.
- Route `/dashboard/zakat/history` belum ada.
- Route `/zakat/history` ada.

Impact:

- User memakai kalkulator zakat di dashboard, lalu melihat riwayat dan keluar
  ke public shell.
- Karena riwayat zakat adalah data personal, target dashboard lebih natural.

Recommendation:

- `ZakatContent({ basePath = '/zakat' })`.
- History link menjadi `${basePath}/history`.
- Tambahkan wrapper `/dashboard/zakat/history` yang reuse history content
  dengan dashboard shell.

### P1. Asbabun Nuzul Dashboard Result Membuka Quran Public

Evidence:

- `apps/web/src/app/dashboard/asbabun-nuzul/page.js` reuse
  `AsbabunNuzulContent` tanpa route config.
- `apps/web/src/app/asbabun-nuzul/page.js:153-155` result ayah link hardcode
  ke `/quran/${surahNumber}/${ayah}`.

Impact:

- User mencari asbabun nuzul di dashboard, lalu klik badge ayah dan keluar ke
  Quran public.
- Ini kecil secara visual, tetapi sering terjadi karena badge ayah adalah CTA
  detail alami pada result.

Recommendation:

- `AsbabunNuzulContent({ quranBasePath = '/quran' })`.
- Dashboard pass `quranBasePath='/dashboard/quran'`.
- Pastikan format route Quran konsisten dengan reader dashboard; jika dashboard
  memakai slug latin, helper route harus sama dengan Quran dashboard.

### P1. Asmaul Husna Main Sudah Context-Aware, Subflow Belum

Evidence:

- Main Asmaul Husna sudah membedakan dashboard/public via pathname:
  `apps/web/src/app/asmaul-husna/page.js:21-24` dan
  `apps/web/src/app/asmaul-husna/page.js:120-123`.
- Flashcard back link hardcode ke public:
  `apps/web/src/app/asmaul-husna/flashcard/page.js:95`.
- Wirid back link hardcode ke public:
  `apps/web/src/app/asmaul-husna/wirid/page.js:124`.
- Dashboard wrappers reuse subflow content tanpa prop:
  `apps/web/src/app/dashboard/asmaul-husna/flashcard/page.js`,
  `apps/web/src/app/dashboard/asmaul-husna/wirid/page.js`.

Impact:

- Dari dashboard Asmaul Husna, user masuk flashcard/wirid, lalu back link
  mengembalikan ke public Asmaul Husna.

Recommendation:

- `AsmaulHusnaFlashcardContent({ basePath = '/asmaul-husna' })`.
- `AsmaulWiridContent({ basePath = '/asmaul-husna' })`.
- Dashboard wrappers pass `basePath='/dashboard/asmaul-husna'`.

### P2. Tahlil Dashboard Link Yasin Keluar Ke Public Quran

Evidence:

- `apps/web/src/app/dashboard/tahlil/page.js` reuse public `TahlilContent`.
- `apps/web/src/app/tahlil/page.js:318` note link hardcode ke
  `/quran/surah/Yasin`.

Impact:

- User sedang membaca tahlil di dashboard, lalu klik referensi Yasin dan keluar
  ke public Quran.

Recommendation:

- `TahlilContent({ quranBasePath = '/quran/surah' })`.
- Dashboard pass `quranBasePath='/dashboard/quran'`.

### P2. Login Fallback Dalam Reused Public Content Tidak Preserve Dashboard Intent

Evidence:

- `apps/web/src/app/khatam/page.js:94` login CTA hardcode ke `/auth/login`.
- `apps/web/src/app/wirid-custom/page.js:109` login CTA hardcode ke
  `/auth/login`.
- Dashboard wrappers reuse content:
  `apps/web/src/app/dashboard/khatam/page.js`,
  `apps/web/src/app/dashboard/wirid-custom/page.js`.

Impact:

- Dashboard biasanya sudah protected, tetapi saat session expired atau content
  dipakai di route public, CTA login tidak membawa user kembali ke intent awal.

Recommendation:

- Public content menerima `loginNext`.
- Dashboard wrapper pass current dashboard path sebagai next:
  `/auth/login?next=/dashboard/khatam` atau
  `/auth/login?next=/dashboard/wirid-custom`.

---

## Parity Matrix

| Feature                 | Public capability                              | Dashboard state                                                                         | Risk                      | Fix pattern                                       |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------- |
| Quran                   | Index, mushaf shortcut, surah detail           | Index duplicate, detail uses shared reader with `basePath`                              | Medium drift              | Shared `QuranIndexContent`                        |
| Daily Ayah widget       | Public link uses `/quran/surah/:slug`          | Dashboard receives `/dashboard/quran` and builds missing `/dashboard/quran/surah/:slug` | High broken CTA           | `buildHref` formatter                             |
| Hadis                   | Book/theme/chapter/number tabs                 | Book list only, search leaks public                                                     | High drift/leak           | Shared `HadithContent(basePath)`                  |
| Tafsir                  | Kitab filter, side-by-side, read-in-Quran      | Separate reader without full public controls                                            | High drift                | Shared `TafsirReaderContent(routeMap)`            |
| Search                  | Multi-domain global result                     | Reused public result links                                                              | High leak                 | `SearchClient(baseRoutes)`                        |
| Forum                   | List, ask, detail                              | List only, ask/detail leak public                                                       | High leak                 | `ForumContent(basePath)` plus dashboard subroutes |
| Bookmarks               | Public bookmarks use saved URL for ayah/hadith | Dashboard mapping misses `ayah` and routes `article` to public blog                     | High broken/leak          | Shared bookmark route resolver                    |
| Zakat                   | Calculator and public history                  | Calculator only, history leaks public                                                   | High leak                 | `ZakatContent(basePath)` plus dashboard history   |
| Asbabun Nuzul           | Search result links to Quran ayah              | Reused public result link leaks to Quran public                                         | Medium leak               | `AsbabunNuzulContent(quranBasePath)`              |
| Asmaul Husna            | List, flashcard, wirid                         | Main context-aware, child back links leak                                               | Medium leak               | Pass `basePath` to child content                  |
| Public account surfaces | Navbar, footer, profile, legacy sidebar        | Many personal shortcuts still target public personal routes                             | Medium leak/drift         | Dashboard-aware account route map                 |
| Global recovery         | 404/error recovery links                       | Always recover to public home/content                                                   | Low context leak          | Path-aware recovery target                        |
| Admin generic CRUD      | Many modules share modal CRUD pattern          | Save/delete failures can be silent; icon-only actions under-labeled                     | Low/medium CTA trust risk | Shared admin mutation/error action primitive      |
| Tahlil                  | Content with Yasin reference                   | Reused public content                                                                   | Low/medium leak           | Pass `quranBasePath`                              |
| Blog                    | List/detail                                    | Already passes `basePath`                                                               | Low                       | Keep as reference pattern                         |
| Quran reader            | Shared reader with `basePath`                  | Correct                                                                                 | Low                       | Use as reference pattern                          |

---

## Recommended Implementation Order

1. Fix `SearchClient` route map and dashboard search/hadis search, because one
   dashboard search can leak into many public flows.
2. Fix broken Daily Ayah widget dashboard href.
3. Fix dashboard bookmark route resolver for `ayah`, `hadith`, and `article`.
4. Fix `ForumListContent` with `basePath` and add dashboard ask/detail routes.
5. Fix `ZakatContent` history route and add `/dashboard/zakat/history`.
6. Fix Asbabun Nuzul ayah links with `quranBasePath`.
7. Refactor Hadis public/dashboard into shared content with `basePath`.
8. Refactor Tafsir reader into shared content with separate `tafsirBasePath`
   and `quranBasePath`.
9. Refactor Quran index into shared content, using existing Quran reader
   `basePath` as the pattern.
10. Patch smaller leaks: Asmaul child back links, Tahlil Yasin link, profile
    edit route, public navbar account links, dashboard logo behavior, and login
    `next`.
11. Normalize footer/sidebar/account surfaces so all personal shortcuts use the
    same dashboard-aware route map.
12. Patch low-impact recovery/edge CTA: 404/error recovery, forum detail login
    `next`, public personal empty states, and generic admin CRUD error labels.

## Acceptance Criteria

- Dari route `/dashboard/*`, semua primary CTA, detail link, back link, search
  result, dan pagination tetap berada di `/dashboard/*`.
- Public routes tetap bisa dipakai tanpa login untuk fitur public.
- Capability inti public dan dashboard sync; hanya shell/layout yang berbeda.
- Shared content menerima route config, bukan membaca pathname secara ad hoc
  kecuali benar-benar diperlukan.
- Auth-required CTA memakai `next` agar user kembali ke intent awal setelah
  login.
- Jika CTA sengaja keluar ke public, label harus eksplisit, misalnya
  `Buka Public App`.

## Evidence Commands

- `chronicle.search` query awal:
  `public dashboard feature parity same feature different layout CTA should stay dashboard basePath Quran Hadith Tafsir Doa Dzikir`
- `chronicle-agent search` query follow-up:
  `dashboard public parity CTA basePath quran hadith tafsir forum search zakat`
- `comm -12 <public top-level routes> <dashboard top-level routes>`
- `rg "from '@/app/|from \"@/app/" apps/web/src/app/dashboard apps/web/src/app/admin`
- `rg "href='/" apps/web/src/app/dashboard apps/web/src/app/admin`
- `rg "href='/" apps/web/src/app/forum/page.js apps/web/src/app/zakat/page.js apps/web/src/app/asmaul-husna/*/page.js apps/web/src/app/tahlil/page.js`
- `rg 'href=\{`/[A-Za-z]' apps/web/src/app`
- `rg "href=['\"]/[A-Za-z]" apps/web/src/components apps/web/src/lib apps/web/src/context`
- `rg 'href=\{`\$\{basePath\}' apps/web/src/components`
- `rg -l "href=|router\.(push|replace)|window\.location|location\.href|BookmarkButton|NoteButton|basePath|useRequireAuth" apps/web/src/app apps/web/src/components apps/web/src/lib`
- Compare candidate files against documented file references to find route/CTA
  files not explicitly reviewed yet.
- Route inventory diff between public `page.js` routes and dashboard `page.js`
  routes.
- Manual read pada Quran, Hadis, Tafsir, Search, Forum, Zakat, Asmaul Husna,
  Asbabun Nuzul, Tahlil, dashboard layout, dashboard home widgets, bookmarks,
  navbar, footer/sidebar, public personal pages, auth pages, dan profile pages.
- Manual low-impact read pada 404/error, forum detail, contact, admin generic
  CRUD modules, and legacy Sidebar tests.

## Coverage Notes

Pass terakhir menemukan `90` file kandidat navigasi/CTA di `apps/web/src/app`,
`apps/web/src/components`, dan `apps/web/src/lib`. Ada `46` file yang belum
disebut literal di review sebelumnya. Setelah dibaca, yang relevan sebagai gap
baru adalah:

- `apps/web/src/components/Footer.js`
- `apps/web/src/components/Sidebar.js` (kemungkinan legacy/test-only)
- `apps/web/src/app/auth/register/page.js`
- `apps/web/src/app/auth/login/page.js`
- public personal pages yang memakai `useRequireAuth`
- `apps/web/src/app/muroja-ah/page.js`
- `apps/web/src/app/stats/page.js`
- `apps/web/src/app/forum/[slug]/page.js`
- `apps/web/src/app/NotFoundClient.js`
- `apps/web/src/app/error.js`
- generic admin CRUD modules under `apps/web/src/app/admin/*/page.js`

File yang sempat belum disebut tetapi terlihat sudah memakai pola route-map
lebih aman atau bukan parity target utama:

- `apps/web/src/app/blog/page.js`
- `apps/web/src/app/blog/[slug]/page.js`
- `apps/web/src/app/dashboard/blog/[slug]/page.js`
- `apps/web/src/app/perawi/page.js`
- `apps/web/src/app/perawi/[id]/page.js`
- `apps/web/src/app/dashboard/perawi/page.js`
- `apps/web/src/app/dashboard/perawi/[id]/page.js`
- `apps/web/src/components/PrayerCountdownWidget.js`
- `apps/web/src/components/DailyHadithWidget.js`
- `apps/web/src/lib/share.js`
- `apps/web/src/app/contact/ContactPageClient.js`
