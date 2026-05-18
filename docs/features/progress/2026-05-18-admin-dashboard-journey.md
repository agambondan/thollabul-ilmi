# Admin Dashboard Journey CTA

Status: `VERIFIED`
Tanggal: `2026-05-18`
Source Review: `docs/reviews/2026-05-15-web-journey-cta-review.md`

## Objective

Menutup finding admin dashboard yang masih terlalu module-oriented setelah
sidebar `/admin` disamakan dengan `/dashboard`.

## Scope

- Tambah section `Aksi Cepat` di `/admin`.
- Tambah CTA task-oriented:
  - `Tulis Artikel Baru` -> `/admin/blog/new`
  - `Review Konten` -> `/admin/blog`
  - `Tambah Doa` -> `/admin/doa`
  - `Kelola User & Role` -> `/admin/users`
- Hapus module launcher dari dashboard admin agar halaman fokus pada metric,
  chart, dan quick actions.
- Tambah i18n ID/EN untuk quick actions.
- Update review lama agar finding admin yang sudah ditutup tidak terlihat open.

## Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`

## Follow-up 2026-05-18 - Remove Admin Module Launcher

Status: `VERIFIED`

### Scope

- Hapus section `Modul Admin` dari `/admin`.
- Hapus konstanta module card dan import icon yang hanya dipakai oleh section
  tersebut.
- Hapus i18n `admin.modules.title` dan `admin.modules.subtitle` yang sudah tidak
  dipakai.

### Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`

## Follow-up 2026-05-18 - Admin Work Queue And Content Health

Status: `VERIFIED`

### Scope

- Tambah section `Antrian Review` di `/admin` dengan CTA operasional:
  - artikel draft / arsip,
  - artikel kurang metadata,
  - buku perlu verifikasi sumber/lisensi,
  - buku tanpa source/resource.
- Tambah section `Kesehatan Konten` dengan progress bar:
  - kelengkapan metadata artikel,
  - kesiapan sumber buku,
  - cakupan konten ibadah,
  - cakupan konten belajar.
- Tambah chart `Status Konten` untuk komposisi artikel published/draft/archive.
- Semua item queue dan health tetap link ke modul admin terkait, bukan module
  launcher umum.
- Tambah i18n ID/EN untuk queue, health, dan status chart.

### Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`

## Follow-up 2026-05-18 - Admin Metrics Overview

Status: `VERIFIED`

### Scope

- Tambah section `Ringkasan Operasional` di `/admin`.
- Tambah metric cards:
  - Pengunjung: unique visitor 14 hari terakhir dari page-view analytics.
  - Total user: dari endpoint admin users.
  - Konten bacaan: artikel terbit + koleksi buku.
  - Draft / arsip: artikel yang perlu review.
- Tambah chart:
  - Komposisi konten dari modul blog, library, ibadah, dan belajar.
  - Distribusi role user.
  - Visitor chart dari event page view harian.
- Tambah i18n ID/EN untuk metric dan chart admin.

### Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`

## Follow-up 2026-05-18 - Page View Analytics

Status: `VERIFIED`

### Scope

- Tambah model backend `PageView` dan migration.
- Tambah endpoint public `POST /api/v1/analytics/page-view`.
- Tambah endpoint admin `GET /api/v1/analytics/admin/summary?days=14`.
- Tambah tracker global web yang mencatat route change dengan visitor id lokal.
- Hubungkan admin dashboard ke summary analytics untuk:
  - unique visitor 14 hari terakhir,
  - chart visitor harian,
  - halaman teratas.

### Verification

- PASS: `cd services/api/app && go test ./...`
- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`

## Follow-up 2026-05-18 - Blog And Sirah Admin CTA Polish

Status: `VERIFIED`

### Scope

- Tambah inline action error untuk `/admin/blog` dan `/admin/siroh`.
- Tambah `res.ok` checks pada mutation create/delete taxonomy dan delete
  content agar optimistic UI rollback saat backend menolak request.
- Update category edit `/admin/siroh` agar modal/inline edit tidak tertutup
  sebelum save benar-benar berhasil.
- Tambah `aria-label` dan `title` pada action icon-only untuk:
  - blog article edit/delete,
  - blog category/tag add/delete,
  - sirah category create/edit/save/cancel/delete,
  - sirah content edit/delete.

### Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`

## Follow-up 2026-05-18 - Blog And Sirah Form Recovery

Status: `VERIFIED`

### Scope

- Tambah explicit `res.ok` checks pada submit create/edit artikel Blog.
- Tambah explicit `res.ok` checks pada submit create/edit konten Sirah.
- Inline error form sekarang memakai pesan error backend/global mutation guard
  jika tersedia dan tidak redirect sebelum save sukses.
- Tambah back link header pada halaman:
  - `/admin/blog/new`
  - `/admin/blog/[id]/edit`
  - `/admin/siroh/new`
  - `/admin/siroh/[id]/edit`
- Tambah back link juga pada state not-found edit Blog/Sirah.

### Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`
