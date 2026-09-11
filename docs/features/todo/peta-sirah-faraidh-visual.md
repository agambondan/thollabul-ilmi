# Peta Sirah Interaktif & Visual Faraidh

Status: `DONE`
Priority: `P2`
Tanggal: `2026-09-08`

## Objective

Pengguna dapat membaca perjalanan hidup Rasulullah & para sahabat lewat peta interaktif (lokasi + timeline), serta menghitung waris Islam otomatis dengan diagram visual pohon keluarga.

## Scope

- Mobile:
    - Tab baru di Explore: **Peta** (peta interaktif Makkah/Madinah/kampanye militer via `HistoricalMapView`).
    - Marker lokasi dengan kategori (kota, masjid, situs, peristiwa).
    - Halaman Faraidh: input ahli waris, output tabel + diagram proporsi (`WebAppFaraidhRoute`).
    - Riwayat kalkulasi faraidh (tersimpan lokal & API).
- Web:
    - Route `/peta` di public web (Leaflet interactive map dengan filter kategori & era).
    - Route `/faraidh` (calculator + visualisasi).
- API:
    - Endpoint `GET /api/v1/locations` & alias `GET /api/v1/sirah/map` / `GET /api/v1/siroh/map`.
    - Endpoint simpan kalkulasi `POST /api/v1/faraidh/simpan`, `GET /api/v1/faraidh/simpan`, `DELETE /api/v1/faraidh/simpan/:id`.
    - Data seeder untuk 40+ lokasi sirah dan sejarah Islam (`data/locations.json`).
- Data/Seeder: Seed 40+ lokasi sirah (Makkah, Madinah, Badr, Uhud, Khandaq, Hunain, Tabuk, Khaibar, dll) + aturan faraidh standar (Ashabul Furudh, Ashabah, Aul, Radd, Umariyyah, Musytarakah, Akdariyah).

## Current Baseline

- Konten Siroh Nabawiyah sudah ada (`/siroh/*`).
- Data timeline Islamic History sudah ada (`/timeline/*`).
- Interactive Map aktif di Web (`/peta`) & fallback terintegrasi di Mobile (`HistoricalMapView`).
- Engine Faraidh lengkap di Mobile (`lib/faraidh.js`) & Web (`/faraidh`).

## Task List

- [x] Migrasi + seeder data lokasi sirah (40+ lokasi di `data/locations.json`).
- [x] Endpoint API peta sirah (`GET /api/v1/locations`, alias `GET /api/v1/sirah/map`).
- [x] Endpoint API riwayat faraidh (`/api/v1/faraidh/simpan`).
- [x] UI mobile peta interaktif + list detail (`HistoricalMapView`).
- [x] UI web peta sirah interaktif (`apps/web/src/app/peta/page.js`).
- [x] Engine kalkulator faraidh lengkap dengan Ashabul Furudh, Ashabah, Aul, Radd (`lib/faraidh.js`).
- [x] UI mobile & web kalkulator faraidh (`WebAppFaraidhRoute` & `apps/web/src/app/faraidh/page.js`).
- [x] Export share image / PDF hasil perhitungan faraidh.

## Acceptance Criteria

- Peta menampilkan minimal 20 marker lokasi sirah, tap → detail.
- Hasil faraidh: input dinamis (jumlah istri, anak, saudara), output sesuai ringkasan standar.
- Proporsi pembagian tampil akurat dengan penanganan Aul dan Radd.
- Riwayat perhitungan tersimpan di storage lokal dan akun pengguna.

## Evidence

- Commands:
    - `go test ./app/...` -> PASS
    - `npx jest --testPathPattern='faraidh|exploreWebAppRoutes'` -> PASS (32 tests)
    - `node scripts/check-feature-parity.js` -> PASS
- Device/API/Web smoke:
    - `/api/v1/sirah/map` and `/api/v1/locations` return 40+ historical/sirah locations.
    - Web `/peta` and `/faraidh` render with full interactivity.
    - Mobile `WebAppFaraidhRoute` passes calculation and history persistence tests.
    - Web `/faraidh`: "Bagikan" button opens share modal (reuses `ShareAyah`),
      generates a canvas image with calculation summary text + background
      selection, share/copy/download all wired via existing
      `copy.js`/`shareImage.js` helpers — verified via Playwright screenshot.
    - Web `/faraidh`: "Cetak" (`window.print()`) now renders a clean,
      result-only printout (input form, disclaimer, action buttons and
      history hidden via `print:hidden`) — usable as PDF export via browser
      print-to-PDF. Verified via `page.emulateMedia({media:'print'})`
      screenshot.
    - Mobile (`WebAppFaraidhRoute.js`) share/export not implemented — would
      require new native deps (`react-native-view-shot`,
      `expo-sharing`/`expo-file-system`) not currently in the project;
      scoped as web-only for this task.

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (#11 Siroh Nabawiyah, #34 Fiqh Ringkas)
- `docs/MOBILE_IA_FINAL_APPROACH.md`
- `apps/mobile/src/screens/explore/FeatureCatalog.js`
