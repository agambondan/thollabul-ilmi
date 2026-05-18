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
- Pindahkan module launcher menjadi section secondary `Modul Admin`.
- Tambah i18n ID/EN untuk quick actions dan module section.
- Update review lama agar finding admin yang sudah ditutup tidak terlihat open.

## Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`

## Follow-up 2026-05-18 - Admin Metrics Overview

Status: `VERIFIED`

### Scope

- Tambah section `Ringkasan Operasional` di `/admin`.
- Tambah metric cards:
  - Pengunjung: status analytics visitor belum aktif.
  - Total user: dari endpoint admin users.
  - Konten bacaan: artikel terbit + koleksi buku.
  - Draft / arsip: artikel yang perlu review.
- Tambah chart:
  - Komposisi konten dari modul blog, library, ibadah, dan belajar.
  - Distribusi role user.
  - Placeholder visitor chart yang eksplisit menunggu event page view atau endpoint analytics global.
- Tambah i18n ID/EN untuk metric dan chart admin.

### Verification

- PASS: `node scripts/check-feature-parity.js`
- PASS: `git diff --check`
- PASS: `cd apps/web && npm run build`
