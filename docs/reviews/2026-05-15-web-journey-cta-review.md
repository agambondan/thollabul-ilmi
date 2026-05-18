# Web Journey And CTA Review

Tanggal: `2026-05-15`
Scope: `apps/web`
Status: `REVIEWED`

Review ini fokus ke user journey dan kesesuaian CTA pada:

- landing page publik
- dashboard customer/personal
- dashboard admin

Catatan konteks produk: dashboard personal sebaiknya berisi hal personal
dan berorientasi aksi user. Konten global tetap boleh ada sebagai akses cepat,
tetapi jangan sampai dashboard berubah menjadi sitemap kedua dari seluruh app.

## Ringkasan Prioritas

| Priority | Area | Temuan |
|---|---|---|
| P0 | Landing -> auth -> personal feature | CTA fitur personal mengarah ke route publik/login tanpa menjaga intent awal user. |
| P0 | Forum/dashboard | CTA `Tanya` dari dashboard keluar ke public forum dan user unauthenticated tidak punya CTA login. |
| P1 | Dashboard customer | Beberapa kartu statistik terlihat clickable, tapi hanya sebagian yang benar-benar bisa diklik. |
| P1 | Dashboard customer | Navigasi dashboard terlalu bercampur antara personal tooling dan global content browsing. |
| P1 | Admin dashboard | Admin cards hanya navigasi modul, bukan entry point tugas utama seperti create/review draft. |
| P1 | Admin CRUD | Icon-only edit/delete/add banyak yang tidak punya label eksplisit/aria dan beberapa delete terlalu dekat dengan aksi edit. |
| P2 | Dashboard interaction | Beberapa surface clickable memakai `li/div onClick`, bukan `button`/`Link`, sehingga keyboard journey lemah. |
| P2 | Form CTA | Beberapa submit flow tidak cek `res.ok`, sehingga CTA bisa terlihat berhasil padahal backend menolak. |

---

## Landing Page Journey

### P0. CTA Personal Feature Tidak Menjaga Intent Setelah Login

Evidence:

- `apps/web/src/app/page.js:110` mengarah ke `/bookmarks`.
- `apps/web/src/app/page.js:117-125` mengarah ke `/hafalan`, `/tilawah`,
  `/amalan`, `/stats`, `/notifications`.
- `apps/web/src/app/page.js:150-152` mengarah ke `/bookmarks` dan `/notes`.
- `apps/web/src/lib/useRequireAuth.js:11-15` redirect unauthenticated user ke
  `/auth/login` tanpa query `next`.

Impact:

- User dari landing klik fitur personal, login, lalu masuk default dashboard,
  bukan kembali ke fitur yang dipilih.
- CTA terasa "tidak sesuai fungsi" karena klik `Catatan`, `Bookmark`, atau
  `Statistik` tidak menyelesaikan intent spesifik user.

Recommendation:

- Untuk fitur personal dari landing, pakai route dashboard langsung:
  `/dashboard/bookmarks`, `/dashboard/notes`, `/dashboard/stats`,
  `/dashboard/hafalan`, dst.
- Jika route tetap publik, `useRequireAuth` harus preserve next:
  `/auth/login?next=<current-path>`.
- Landing feature card perlu badge kecil seperti `Perlu login` untuk fitur
  personal agar user tidak merasa dialihkan tanpa konteks.

### P1. Hero CTA Kurang Mewakili Journey Aplikasi Setelah Login

Evidence:

- Hero primary CTA: `apps/web/src/app/page.js:217-223` -> `/quran`.
- Hero secondary CTA: `apps/web/src/app/page.js:224-230` -> `/hadith`.
- Final CTA register: `apps/web/src/app/page.js:347-352` -> `/auth/register`.

Impact:

- Hero menjual pengalaman content reading, sementara produk juga kuat di
  personal tracker/dashboard.
- Untuk user login, tidak ada CTA hero yang mengarah ke `Lanjutkan Dashboard`
  atau `Lanjutkan Aktivitas`.
- Register CTA di bawah halaman panjang, sehingga user yang ingin mulai
  personal journey perlu scroll jauh.

Recommendation:

- Hero CTA adaptif:
  - guest: `Mulai Personal Tracker` -> `/auth/register?next=/dashboard`
  - logged-in: `Lanjutkan Dashboard` -> `/dashboard`
  - secondary tetap `Baca Quran`.
- Final CTA tetap register, tetapi gunakan `next=/dashboard` agar journey
  setelah signup/login tidak terputus.

### P1. Feature Grid Mencampur Public Reading, Tool, Dan Personal Account

Evidence:

- Semua fitur di `FEATURE_GROUPS` memakai visual card yang sama
  `apps/web/src/app/page.js:272-309`.
- Public content seperti `/quran`, `/hadith`, `/doa` dan account features
  seperti `/bookmarks`, `/notes`, `/stats` tidak dibedakan.

Impact:

- User tidak tahu mana yang bisa dicoba langsung dan mana yang perlu login.
- CTA semua tampak sama, padahal konsekuensi klik berbeda.

Recommendation:

- Pisahkan landing feature groups menjadi:
  - `Bisa Dibaca Langsung`
  - `Butuh Akun / Personal Tracker`
  - `Tools Harian`
- Tambahkan microcopy/badge pada personal cards: `Sinkron akun`, `Perlu login`,
  atau `Tersimpan di dashboard`.

### P2. `Bookmark Hadith` Mengarah Ke Halaman Bookmark Umum

Evidence:

- `apps/web/src/app/page.js:110` memakai label fitur bookmark hadis tetapi
  `href: '/bookmarks'`.

Impact:

- User yang belum punya bookmark masuk ke halaman bookmark kosong/login flow,
  bukan ke hadis untuk membuat bookmark.

Recommendation:

- Ubah CTA menjadi:
  - `Kelola Bookmark` jika target `/dashboard/bookmarks`
  - `Baca Hadis & Bookmark` jika target `/hadith`

---

## Dashboard Customer Journey

### P1. Dashboard Personal Masih Terlalu Mirip Sitemap Global

Evidence:

- `apps/web/src/app/dashboard/layout.js:117-188` memasukkan Quran, Hadith,
  Perawi, Tafsir, Doa, Dzikir, Siroh, Fiqh, Kajian, Blog, dan tools global ke
  sidebar dashboard.
- `apps/web/src/app/dashboard/page.js:456-477` quick access juga mencampur
  personal activity dengan global content.

Impact:

- Dashboard personal kehilangan orientasi sebagai area "pekerjaan saya hari
  ini".
- User harus membedakan sendiri mana data pribadi dan mana browsing konten
  global.

Recommendation:

- Sidebar dashboard dibagi lebih tegas:
  - `Hari Ini`: sholat tracker, tilawah, muhasabah, goals, notifications.
  - `Progress Saya`: hafalan, muroja'ah, khatam, stats, achievements.
  - `Simpanan Saya`: bookmarks, notes, wirid custom.
  - `Referensi`: Quran, Hadith, Tafsir, Doa, dst sebagai secondary group.
- Quick access di dashboard utama sebaiknya personal-first, bukan content-first.

### P1. Kartu Statistik Dashboard Tidak Konsisten Clickability-nya

Evidence:

- Streak card clickable ke `/dashboard/stats`:
  `apps/web/src/app/dashboard/page.js:224-235`.
- Prayer, active goals, bookmarks cards tidak clickable:
  `apps/web/src/app/dashboard/page.js:216-251`.

Impact:

- Empat card terlihat satu komponen yang sama, tetapi behavior berbeda.
- User bisa mengira semua card bisa diklik, atau tidak sadar streak card bisa
  diklik.

Recommendation:

- Jadikan semua stat cards clickable:
  - prayer `-> /dashboard/sholat-tracker`
  - goals `-> /dashboard/goals`
  - bookmarks `-> /dashboard/bookmarks`
  - streak `-> /dashboard/stats`
- Atau jadikan semua non-clickable dan sediakan CTA eksplisit di bawah tiap
  section.

### P1. CTA `Manage` Pada Ringkasan Sholat Terlalu Generik

Evidence:

- `apps/web/src/app/dashboard/page.js:328-333` menampilkan CTA
  `common.manage` menuju `/dashboard/sholat-tracker`.

Impact:

- User tidak tahu apakah CTA akan membuka setting, log sholat, atau melihat
  detail.

Recommendation:

- Ganti label menjadi `Log Sholat Hari Ini`, `Update Sholat`, atau
  `Catat Sholat`.

### P1. Profile Dashboard CTA Keluar Dari Shell Dashboard

Evidence:

- `apps/web/src/app/dashboard/profile/page.js:109-114` label `profile.edit`
  mengarah ke `/profile`, bukan `/dashboard/profile/edit` atau edit inline.

Impact:

- User sedang berada dalam dashboard personal, tetapi CTA edit membawa ke
  layout publik dengan navbar/footer.
- Journey account setting terasa berpindah konteks.

Recommendation:

- Jadikan edit profil inline di dashboard profile.
- Atau buat route `/dashboard/profile/settings`.
- Jika tetap keluar ke public `/profile`, ubah label menjadi
  `Buka Pengaturan Profil Lengkap` agar ekspektasinya jelas.

### P1. Forum CTA Dari Dashboard Keluar Ke Public Flow

Evidence:

- `apps/web/src/app/dashboard/forum/page.js:1-7` reuse `ForumListContent`.
- `apps/web/src/app/forum/page.js:74-80` CTA `Tanya` selalu ke `/forum/ask`.
- `apps/web/src/app/forum/page.js:110-113` detail question selalu ke
  `/forum/${q.slug}`.

Impact:

- Dari dashboard, user klik Forum lalu CTA membawa keluar dashboard shell.
- Ini tidak fatal, tetapi terasa tidak konsisten dengan customer dashboard
  journey.

Recommendation:

- `ForumListContent` perlu menerima `basePath`.
- Dari dashboard gunakan:
  - ask `-> /dashboard/forum/ask`
  - detail `-> /dashboard/forum/:slug`
- Jika forum memang public/community global, jangan taruh sebagai core customer
  dashboard item. Taruh sebagai secondary global link.

### P0. Forum Ask Untuk Guest Tidak Punya Login CTA

Evidence:

- `apps/web/src/app/forum/ask/page.js:24-31` hanya menampilkan pesan
  `Login untuk mengajukan pertanyaan.`
- Tidak ada tombol `Login` atau `Daftar`.

Impact:

- User klik CTA `Tanya`, lalu berhenti di dead-end.
- Ini CTA mismatch yang jelas: tombol mengajak aksi, tetapi halaman target
  tidak menyediakan langkah berikutnya.

Recommendation:

- Tambahkan CTA:
  - `Login untuk Bertanya` -> `/auth/login?next=/forum/ask`
  - `Buat Akun` -> `/auth/register?next=/forum/ask`

### P2. Notification Cards Mark Read Tapi Tidak Menjalankan Action

Evidence:

- `apps/web/src/app/dashboard/notifications/page.js:210-217` memakai `li`
  clickable untuk mark read.
- Body notification seperti sholat/muhasabah/tilawah tidak punya CTA ke halaman
  terkait.

Impact:

- User melihat reminder tetapi klik hanya menandai sudah dibaca.
- Journey tidak membantu user menyelesaikan task.

Recommendation:

- Notification item harus punya primary CTA sesuai type:
  - sholat `Catat Sholat` -> `/dashboard/sholat-tracker`
  - muhasabah `Tulis Muhasabah` -> `/dashboard/muhasabah`
  - tilawah `Catat Tilawah` -> `/dashboard/tilawah`
- Mark read bisa jadi secondary action/icon.

### P2. Clickable `li/div` Melemahkan Keyboard Journey

Evidence:

- Notes card: `apps/web/src/app/dashboard/notes/page.js:212-215`.
- Muroja'ah accordion header: `apps/web/src/app/dashboard/muroja-ah/page.js:219-222`.
- Notifications item: `apps/web/src/app/dashboard/notifications/page.js:210-217`.

Impact:

- Mouse/touch user bisa klik, tetapi keyboard user tidak punya semantic button.
- CTA tidak terbaca jelas oleh assistive tech.

Recommendation:

- Gunakan `button` untuk action.
- Gunakan `Link` untuk navigasi.
- Jika memang memakai non-button, minimal tambah `role`, `tabIndex`, dan
  keyboard handler, tetapi semantic element tetap lebih baik.

### P2. Status Hafalan Sebagai Pill Tidak Menjelaskan Next Action

Evidence:

- `apps/web/src/app/dashboard/hafalan/page.js:217-230` status pill bisa diklik
  dan cycle status.

Impact:

- Label hanya menampilkan status saat ini, bukan aksi berikutnya.
- User bisa tidak sadar bahwa klik akan mengubah data.

Recommendation:

- Ubah label aksi menjadi eksplisit:
  - `Tandai Dipelajari`
  - `Tandai Hafal`
  - `Reset Status`
- Atau pakai dropdown/segmented control status.

---

## Admin Dashboard Journey

### P1. Admin Dashboard Cards Bukan Task-Oriented CTA

Status 2026-05-18: `CLOSED_BY_ADMIN_QUICK_ACTIONS_AND_METRICS`.

Evidence:

- `apps/web/src/app/admin/page.js:123-133` cards hanya link ke modul.
- Tidak ada CTA seperti `Tulis Artikel`, `Review Draft`, `Tambah Doa`, atau
  `Kelola User`.

Impact:

- Admin harus masuk modul dulu sebelum mulai pekerjaan utama.
- Dashboard admin belum menjawab "apa yang perlu saya lakukan sekarang?"

Recommendation:

- Admin dashboard perlu task cards:
  - `Tulis Artikel Baru`
  - `Review Draft`
  - `Tambah Konten Doa/Dzikir`
  - `Kelola User & Role`
  - `Cek Konten Terbaru`
- Module cards tidak perlu tampil di dashboard utama jika sidebar admin sudah
  menjadi navigasi modul.

Implementation note:

- `/admin` sekarang menampilkan metric operasional, chart, dan section
  `Aksi Cepat` untuk tulis artikel, review konten, tambah doa, dan kelola user.
- Section `Modul Admin` dihapus dari dashboard karena navigasi modul sudah
  tersedia di sidebar admin.

### P1. Admin Navigation Tidak Membedakan Content, Taxonomy, Dan User Control

Status 2026-05-18: `CLOSED_BY_ADMIN_GROUPED_SIDEBAR`.

Evidence:

- `apps/web/src/app/admin/layout.js:28-45` semua nav item satu level.

Impact:

- Admin dengan tugas spesifik harus scanning 16 item datar.
- User management bercampur dengan content management.

Recommendation:

- Kelompokkan sidebar:
  - `Konten`: blog, siroh, kajian, sejarah
  - `Ibadah`: doa, dzikir, wirid, tahlil, manasik, fiqh
  - `Data Referensi`: kamus, asmaul husna, asbabun nuzul, quiz
  - `Access`: users

Implementation note:

- `/admin` sidebar sekarang mengikuti shell `/dashboard` dan sudah memakai group
  menu `Konten`, `Ibadah`, `Belajar & Tools`, dan `Sistem`.

### P1. Icon-Only Admin CRUD CTA Tidak Punya Accessible Name

Status 2026-05-18: `PARTIALLY_CLOSED_FOR_BLOG_AND_SIRAH`.

Evidence:

- Blog edit/delete icon-only:
  `apps/web/src/app/admin/blog/page.js:189-200`.
- Blog category/tag add/delete icon-only:
  `apps/web/src/app/admin/blog/page.js:223-229`,
  `apps/web/src/app/admin/blog/page.js:238-243`,
  `apps/web/src/app/admin/blog/page.js:277-282`.
- Siroh edit/delete icon-only:
  `apps/web/src/app/admin/siroh/page.js:218-229`,
  `apps/web/src/app/admin/siroh/page.js:265-276`.

Impact:

- CTA tidak self-describing untuk screen reader.
- Admin rawan salah klik karena edit/delete hanya beda ikon kecil dan warna
  hover.

Recommendation:

- Tambahkan `aria-label` dan `title` yang spesifik:
  - `Edit artikel: {title}`
  - `Hapus artikel: {title}`
  - `Tambah kategori`
- Pertimbangkan action menu per row untuk destructive action.

Implementation note:

- `/admin/blog` article, category, dan tag action icon sekarang memiliki
  `aria-label` dan `title` spesifik.
- `/admin/siroh` category dan content action icon sekarang memiliki
  `aria-label` dan `title` spesifik.
- Scope ini belum menutup seluruh admin surface lain di luar Blog/Siroh.

### P1. Delete Category/Tag Kurang Safe Untuk Data Berelasi

Status 2026-05-18: `PARTIALLY_CLOSED_FOR_BLOG_AND_SIRAH_ROLLBACK`.

Evidence:

- Blog category delete memakai `confirm()`:
  `apps/web/src/app/admin/blog/page.js:80-88`.
- Blog tag delete tidak punya confirm:
  `apps/web/src/app/admin/blog/page.js:108-115`.
- Siroh category delete memakai `confirm()`:
  `apps/web/src/app/admin/siroh/page.js:67-75`.

Impact:

- Admin tidak tahu apakah delete category/tag akan memengaruhi konten existing.
- Tag delete bisa terjadi hanya dengan satu klik icon kecil.

Recommendation:

- Gunakan modal konfirmasi yang menyebut jumlah konten terdampak.
- Untuk tag/category, CTA harus berbunyi `Hapus Tag` / `Hapus Kategori`, bukan
  hanya ikon `X`.
- Jika backend menolak karena masih dipakai, tampilkan error recovery dan
  rollback optimistic UI.

Implementation note:

- Blog category/tag delete dan Siroh category/content delete sekarang rollback
  optimistic UI serta menampilkan inline action error saat request gagal.
- Blog tag delete masih perlu konfirmasi destruktif yang lebih eksplisit.

### P1. Submit Form Admin Tidak Mengecek `res.ok`

Status 2026-05-18: `CLOSED_FOR_BLOG_AND_SIRAH`.

Evidence:

- Blog form submit:
  `apps/web/src/app/admin/blog/_BlogForm.js:75-82`.
- Siroh form submit:
  `apps/web/src/app/admin/siroh/_SirohForm.js:63-70`.
- Blog category/tag create juga parsing response tanpa cek `res.ok`:
  `apps/web/src/app/admin/blog/page.js:67-73`,
  `apps/web/src/app/admin/blog/page.js:95-101`.

Impact:

- CTA `Create Article`, `Create Content`, atau plus button bisa redirect atau
  tampak diam walau backend return 400/401/500.
- Admin tidak mendapat next step saat save gagal.

Recommendation:

- Selalu cek `res.ok`.
- Tampilkan inline error berisi penyebab dan tindakan:
  `Slug sudah dipakai. Ubah slug lalu simpan lagi.`
- Jangan redirect sebelum save benar-benar sukses.

Implementation note:

- `/admin/blog` category/tag create dan delete sekarang mengecek `res.ok`.
- `/admin/siroh` category create/update/delete dan content delete sekarang
  mengecek `res.ok`; edit category tetap terbuka saat save gagal.
- `_BlogForm.js` dan `_SirohForm.js` sekarang mengecek `res.ok` pada
  create/edit submit sebelum redirect ke list.
- Form inline error memakai pesan backend/global mutation guard jika tersedia.

### P2. New Content Pages Minim Wayfinding

Status 2026-05-18: `CLOSED_FOR_BLOG_AND_SIRAH`.

Evidence:

- `apps/web/src/app/admin/blog/new/page.js:10-15` hanya heading dan form.
- `apps/web/src/app/admin/siroh/new/page.js:10-15` hanya heading dan form.

Impact:

- Admin yang masuk ke form tidak punya breadcrumb/back link eksplisit selain
  tombol Cancel di bawah form.

Recommendation:

- Tambahkan breadcrumb/header action:
  - `Blog / Artikel Baru`
  - Back link `Kembali ke Blog`
- Pastikan Cancel tetap terlihat di atas untuk form panjang.

Implementation note:

- `/admin/blog/new`, `/admin/blog/[id]/edit`, `/admin/siroh/new`, dan
  `/admin/siroh/[id]/edit` sekarang punya back link header ke list modulnya.
- State not-found edit Blog/Sirah juga punya back link agar admin tidak
  terjebak di halaman error.

### P2. Admin User Delete Sudah Lebih Baik, Tapi Role Change Terlalu Silent

Evidence:

- Role change langsung terjadi saat select berubah:
  `apps/web/src/app/admin/users/page.js:182-197`.
- Delete user punya confirm dan disabled untuk self:
  `apps/web/src/app/admin/users/page.js:201-209`.

Impact:

- Role change admin/editor bisa menjadi aksi besar tetapi tidak ada konfirmasi
  atau review step.

Recommendation:

- Untuk perubahan ke/dari `admin`, tampilkan konfirmasi.
- Tambahkan status sukses kecil setelah role berubah.

---

## CTA Taxonomy Yang Direkomendasikan

Gunakan pola ini supaya label CTA sesuai fungsi:

| Intent | Label CTA | Target |
|---|---|---|
| Membaca konten publik | `Baca Quran`, `Baca Hadis`, `Lihat Tafsir` | public route |
| Memulai aktivitas personal | `Mulai Hafalan`, `Catat Sholat`, `Tulis Muhasabah` | dashboard route |
| Mengelola data personal | `Kelola Catatan`, `Kelola Bookmark`, `Lihat Statistik Saya` | dashboard route |
| Membuat konten admin | `Tulis Artikel Baru`, `Tambah Doa`, `Tambah Konten Siroh` | admin create route |
| Menyimpan form | `Simpan Perubahan`, `Terbitkan Artikel`, `Simpan Draft` | submit action |
| Destructive | `Hapus Artikel`, `Hapus User`, `Hapus Tag` | modal confirmation |
| Navigation fallback | `Kembali ke Blog`, `Kembali ke Dashboard` | Link |

Rules:

- Jangan pakai `Manage` kalau aksi sebenarnya spesifik.
- Jangan pakai icon-only untuk destructive action tanpa label/tooltip.
- Jika CTA butuh login, jelaskan sebelum redirect atau preserve `next`.
- Jika CTA menyimpan data, cek `res.ok` sebelum menampilkan sukses/redirect.
- Jika CTA hanya membuka detail, gunakan `Link`.
- Jika CTA mengubah state, gunakan `button`.

---

## Suggested Implementation Order

1. Fix auth redirect intent untuk personal routes (`next`).
2. Ubah landing CTA personal ke `/dashboard/*` dan tambahkan `Perlu login`.
3. Rapikan dashboard stat cards supaya clickability konsisten.
4. Tambahkan dashboard forum base path atau pindahkan forum ke global secondary.
5. Tambahkan login CTA pada `/forum/ask`.
6. Audit admin CRUD icon buttons: `aria-label`, confirm modal, `res.ok`.
7. Re-group customer/admin sidebar setelah behavior utama aman.

## Evidence Commands

- `chronicle.search` query: `dashboard admin customer landing CTA`
- `find apps/web/src/app -maxdepth 3 -type f`
- `rg "<button|<Link|href=|onClick=" apps/web/src/app/admin apps/web/src/app/dashboard apps/web/src/app/auth apps/web/src/components/Navbar.js`
- Manual read pada landing, dashboard layout/page, admin layout/page, navbar,
  auth pages, forum pages, notes, notifications, hafalan, muroja'ah, admin blog,
  admin siroh, admin users.
