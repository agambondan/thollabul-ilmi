# Global Search v2

Status: `VERIFIED`
Priority: `P1`
Tanggal: `2026-05-14`

## Objective

Satu pencarian mobile yang bisa menemukan Quran, Hadis, Doa, Kajian, Kamus,
Perawi, dan fitur aplikasi tanpa user harus pindah tab dulu.

## Scope

- Mobile: layar Global Search memakai satu endpoint utama, tetap menambahkan
  hasil fitur lokal.
- Web: tetap memakai endpoint search yang sama saat dibutuhkan.
- API: `/api/v1/search` mengembalikan Doa dan Kajian selain Quran, Hadis,
  Kamus, dan Perawi.
- Data/Seeder: memakai data yang sudah ada.

## Current Baseline

Mobile sudah punya `GlobalSearchScreen`, recent search, quick suggestion, filter
per modul, dan hasil fitur lokal. API search sebelumnya baru mencakup Quran,
Hadis, Kamus, dan Perawi, sehingga Doa/Kajian masih harus di-hit terpisah dari
mobile.

## Task List

1. Tambah Doa dan Kajian ke kontrak API global search.
2. Filter translation Doa/Kajian berdasarkan bahasa request.
3. Ubah mobile supaya Global Search mengambil Doa/Kajian dari endpoint search
   yang sama.
4. Verifikasi API test dan build web/mobile smoke saat device tersedia.

## Acceptance Criteria

- Pencarian `type=all` mengembalikan semua kategori yang tersedia.
- Filter `type=doa` dan `type=kajian` tersedia.
- Mobile tidak perlu request Doa/Kajian terpisah untuk Global Search.
- Hasil fitur aplikasi tetap muncul dari katalog lokal mobile.

## Evidence

- Commands:
    - `node --check apps/mobile/src/screens/GlobalSearchScreen.js`
    - `node --check apps/mobile/src/api/client.js`
    - `cd services/api && go test ./...`
- Device/API/Web smoke: mobile smoke penuh ditunda sampai device input bisa
  dites manual.
- Notes: device tap/swipe manual ditunda karena MIUI memblokir `adb input`.

## Source of Truth

- `apps/mobile/src/screens/GlobalSearchScreen.js`
- `apps/mobile/src/api/client.js`
- `services/api/app/controllers/search_controller.go`
- `services/api/app/services/search_service.go`
- `services/api/app/repository/search_repository.go`
