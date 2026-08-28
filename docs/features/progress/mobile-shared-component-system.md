# Mobile Shared Component System

Status: `IN_PROGRESS`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Menyatukan UI route mobile lewat shared component yang bisa di-custom agar
screen tidak punya chrome, card, modal, dan header yang beda-beda.

## Scope

- Mobile:
    - shared modal/bottom sheet
    - shared content card
    - shared action sheet
    - shared detail header
    - screen tetap boleh override style, field, icon, dan action sesuai konteks
- Web/API:
    - tidak termasuk scope kecuali perlu menyesuaikan contract data

## Current Baseline

- Refactor sudah bergerak di `apps/mobile/src/components/`.
- Screen prioritas yang tersentuh: Quran, Hadis, Ibadah, Belajar/Explore,
  Home, Global Search.
- Shared primitive terbaru:
    - `AppModalSheet` untuk modal/bottom sheet.
    - `AppActionSheet` untuk menu aksi.
    - `ContentCard` untuk card/list row dengan metadata fleksibel.
    - `DetailHeader` untuk header detail layar.
    - `SectionHeader` untuk header section compact dengan meta/actions.

## Task List

1. `DONE` Audit screen yang masih punya modal/card/header custom lokal.
2. `DONE` Migrasikan pattern yang berulang ke shared component.
3. `DONE` Pastikan shared component menerima override style dan render field
   tambahan.
4. `DONE` Jalankan parse/export mobile setelah migrasi besar.
5. `PENDING_DEVICE` Smoke test device untuk route utama.

## Acceptance Criteria

- detail modal punya header/close behavior konsisten
- card list punya spacing, border, dan metadata yang seragam
- screen masih bisa memberi field tambahan tanpa fork komponen
- tidak ada regresi route utama mobile

## Evidence

- `apps/mobile/src/components/SectionHeader.js` ditambahkan untuk section
  header compact yang bisa override style, meta, subtitle, dan actions.
- Hadith detail sanad/perawi memakai `SectionHeader`, mengganti header lokal
  `detailHeader/detailTitle/detailMeta`.
- Notification Center memakai `SectionHeader` untuk header jadwal aktif dan
  item kotak masuk, supaya metadata kecil tidak punya style lokal berulang.
- Dead style Hadith untuk modal/action sheet/card lokal dibersihkan setelah
  migrasi ke `AppActionSheet` dan `ContentCard`.
- `AppModalSheet` sekarang punya footer sticky default lewat prop
  `stickyFooter`, sehingga action/footer modal tidak ikut terdorong ke dalam
  scroll body pada konten panjang.
- `AppActionSheet` meneruskan slot `footer` ke `AppModalSheet`, bukan merender
  footer sebagai children biasa.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-shared-section-header-export`
  `PASS`.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-notification-section-header-export`
  `PASS`.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-sticky-modal-footer-export`
  `PASS`.
- Device smoke masih wajib sebelum status dinaikkan ke `DONE`; `adb devices -l`
  belum menampilkan device pada verifikasi terakhir.
- Device probe 2026-05-16:
    - `adb devices -l` sudah mendeteksi device `985c2f0e`, tetapi statusnya
      `no permissions`.
    - `lsusb` mendeteksi `18d1:4ee7 Google Inc. Nexus/Pixel Device (charging +
debug)`.
    - USB node `/dev/bus/usb/003/007` masih `root:root`, sehingga
      `make mobile-status` gagal melakukan `adb reverse` dengan
      `insufficient permissions`.
    - Runtime device smoke belum bisa dinaikkan ke `DONE` sampai permission ADB
      dibereskan dari host/replug/udev.

## Source of Truth

- `docs/MOBILE_DESIGN_PATTERNS.md`
- `docs/INDEX.md`
- `apps/mobile/src/components/`
