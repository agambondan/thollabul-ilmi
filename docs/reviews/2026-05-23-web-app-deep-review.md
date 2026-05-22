# Web App Deep Review

Tanggal: `2026-05-23`
Scope: `apps/web`, `docs/features`, dan kontrak lokal API yang memengaruhi web.
Status: `REVIEWED`

Review ini fokus pada konten, sinkronisasi route/manifest, layout, data yang
ditampilkan di public/dashboard/admin, dan perilaku CRUD admin maupun customer.

## Ringkasan

Beberapa finding lama dari review 2026-05-15 sudah tertutup di kode current:

- Dashboard search sudah memakai `routeScope='dashboard'`.
- Dashboard forum sudah punya `/dashboard/forum`, `/dashboard/forum/ask`, dan
  `/dashboard/forum/[slug]`.
- Zakat dashboard sudah punya `/dashboard/zakat/history`.
- Asbabun Nuzul dashboard sudah memakai `quranBasePath='/dashboard/quran'`.
- Hadith dashboard sudah punya theme route.
- Dashboard bookmark sudah memahami `ayah`, `article`, dan `library_book`.
- `SettingButton` sudah dipasang global di root layout.

Current review masih menemukan beberapa gap yang lebih banyak terkait
source-of-truth, error visibility, dan akurasi data dashboard.

## Findings

### P1. Feed Web Aktif, Tetapi Manifest Masih Menyatakan Mobile-Only

Evidence:

- `docs/features/feature-manifest.json:364-372` mendefinisikan
  `community-feed` sebagai `mobile-only` dengan `publicWebRoute: null` dan
  `dashboardWebRoute: null`.
- `apps/web/src/app/feed/page.js:96-380` menyediakan public route `/feed`.
- `apps/web/src/app/dashboard/feed/page.js:381-388` menyediakan dashboard route
  `/dashboard/feed`.
- `npm run check:feature-parity` masih memberi warning:
  `Public route /feed is not mapped directly in the feature manifest.`

Impact:

- Source of truth mengatakan feed belum ada di web, padahal route web public dan
  dashboard sudah aktif.
- Agent berikutnya bisa salah menilai parity, mobile sync, dan coverage fitur.
- Public/dashboard content bisa drift karena checker tidak mengikat feed sebagai
  fitur web aktif.

Recommendation:

- Ubah manifest `community-feed` menjadi active web feature:
  `publicWebRoute: "/feed"` dan `dashboardWebRoute: "/dashboard/feed"`.
- Update `docs/WEB_MOBILE_SYNC.md` untuk memasukkan Feed Komunitas pada active
  coverage dan detail route patterns.
- Jalankan ulang `npm run check:feature-parity`.

### P1. Dev Runtime Port 23001 Membuat Semua API Call CORS Error

Evidence:

- Local web default docs memakai `http://localhost:23000`, tetapi port itu
  sedang terpakai saat review sehingga web dijalankan di `http://localhost:23001`.
- `services/api/app/http/middlewares/middlewares.go:28-47` fallback CORS hanya
  mengizinkan `23000`, bukan `23001`.
- `services/api/.env.example:29` juga hanya mencantumkan `23000`.
- Browser smoke pada `http://localhost:23001` menampilkan CORS error untuk
  `POST /api/v1/analytics/page-view` dan `GET /api/v1/feed`.
- `apps/web/src/components/AnalyticsTracker.js:37-45` memanggil analytics pada
  setiap route, sehingga satu mismatch CORS muncul di semua halaman.

Impact:

- Kalau web harus pindah port karena `23000` sibuk, halaman public tetap render
  tetapi data API tampak kosong dan browser dev overlay menampilkan issue.
- Review data public/dashboard bisa salah karena error API disamarkan sebagai
  empty state.

Recommendation:

- Tambahkan `http://localhost:23001` dan `http://127.0.0.1:23001` ke local
  `ALLOW_ORIGINS`, atau gunakan env helper untuk menyusun allowed origins dari
  port web aktif.
- Pertimbangkan proxy API via Next dev route agar origin web tetap sama untuk
  local browser smoke.

### P1. Feed Customer CRUD Optimistis Tanpa Validasi `res.ok`

Evidence:

- `apps/web/src/app/feed/page.js:39-49` submit komentar langsung parse JSON dan
  refresh tanpa cek status response.
- `apps/web/src/app/feed/page.js:125-152` like, hide, report, dan delete
  langsung mengubah UI atau memberi alert tanpa cek `res.ok`.
- `apps/web/src/app/feed/page.js:155-168` create post juga tidak cek `res.ok`
  sebelum reset form dan reload.

Impact:

- User bisa melihat like/hide/delete/create seolah berhasil saat API 401/403/500.
- Error hanya masuk console, tidak ada toast atau inline message.
- Ini risk tinggi untuk trust di fitur komunitas karena feed adalah customer
  CRUD/action surface.

Recommendation:

- Buat helper mutation feed yang mewajibkan `res.ok`, parse error JSON, dan
  menampilkan toast/inline error.
- Jangan update list optimistis untuk hide/delete/like sebelum response valid,
  atau sediakan rollback.
- Ganti `alert()` report dengan toast yang konsisten.

### P1. Zakat History Delete Menghapus UI Walau API Delete Gagal

Evidence:

- `apps/web/src/app/zakat/history/page.js:663-665` selalu memfilter item dari UI
  setelah `kalkulasiZakatApi.delete(id).catch(...)`.
- `apps/web/src/app/zakat/history/page.js:737-742` tombol delete tidak punya
  `aria-label` dan tidak ada confirm/undo.

Impact:

- Riwayat zakat bisa terlihat terhapus padahal data server masih ada.
- Pada reload berikutnya item bisa muncul kembali, terasa seperti data tidak
  tersinkron.

Recommendation:

- Cek `res.ok` sebelum mutasi state.
- Tambahkan confirmation modal atau undo window.
- Tambahkan error toast dan `aria-label` pada tombol icon-only.

### P1. Admin CRUD Load Failure Disamarkan Menjadi Empty State

Evidence:

- Pattern generic CRUD seperti `apps/web/src/app/admin/doa/page.js:42-49` dan
  `apps/web/src/app/admin/library/page.js:80-87` menangkap error load lalu
  `setItems([])`.
- Admin dashboard `safeJson` di `apps/web/src/app/admin/page.js:111-119`
  mengubah gagal fetch menjadi `{ ok: false, count: 0, items: [] }`.

Impact:

- Admin bisa melihat "tidak ada data" saat masalahnya sebenarnya API/auth/network.
- Ini memperburuk review konten karena jumlah konten kosong tidak bisa
  dibedakan dari gagal memuat.

Recommendation:

- Simpan state `loadError` per module dan render banner error dengan retry.
- Jangan gunakan array kosong sebagai fallback tunggal untuk error.
- Pada admin dashboard, tampilkan module mana yang gagal, bukan hanya badge
  `partial_data`.

### P1. Admin Dashboard Review Queue Menghitung Health Dari Sample 100 Item

Evidence:

- `apps/web/src/app/admin/page.js:228` memanggil
  `adminLibraryApi.list(0, 100)`.
- `apps/web/src/app/admin/page.js:247-260` menghitung source review/resource
  dari `library.items`, bukan dari semua halaman.
- `apps/web/src/app/admin/page.js:295-324` memakai hasil tersebut sebagai queue
  admin.

Impact:

- Jika library >100 item, jumlah buku perlu source review/resource bisa
  undercount.
- Dashboard admin terlihat lebih sehat dari kondisi data sebenarnya.

Recommendation:

- Tambahkan endpoint agregat admin untuk content health/review queue, atau fetch
  all pages sampai total terpenuhi.
- Hindari menghitung operational metric dari page pertama kecuali labelnya
  eksplisit "sample".

### P2. Beberapa Icon-Only Action Masih Belum Punya Accessible Name

Evidence:

- Global setting button hanya punya `title`, bukan `aria-label`:
  `apps/web/src/components/popup/SettingButton.js:161-167`.
- Feed comment submit icon-only:
  `apps/web/src/app/feed/page.js:83-89`.
- Feed hide/report/delete hanya memakai `title`:
  `apps/web/src/app/feed/page.js:312-333`.

Impact:

- Screen reader dan beberapa automated accessibility check tidak mendapat nama
  aksi yang jelas.
- Ini melanggar guideline UI yang dipakai review: icon-only button butuh
  `aria-label`.

Recommendation:

- Tambahkan `aria-label` ke semua icon-only buttons.
- Untuk aksi destructive seperti delete, gabungkan dengan confirm/undo.

## Verification

- PASS: Chronicle `session_init` dan `search` untuk project
  `5197f92d-dc9a-41e0-94a4-5c934c4e483e`.
- PASS: `npm run check:feature-parity` dengan warning `/feed`.
- PASS: `npm run build`.
- BLOCKED: `npm run lint` gagal karena module `typescript` tidak ada di
  `apps/web/node_modules`.
- PARTIAL: Browser smoke via Google Chrome pada `http://localhost:23001` untuk
  `/`, `/feed`, `/dashboard`, `/admin`, `/zakat`, `/dashboard/zakat`.
  Protected routes redirect sesuai ekspektasi, tetapi API calls kena CORS karena
  port 23001 belum di-allow.

