# Peta Sirah Interaktif & Visual Faraidh

Status: `TODO`
Priority: `P2`
Tanggal: `2026-09-08`

## Objective

Pengguna dapat membaca perjalanan hidup Rasulullah & para sahabat lewat peta interaktif (lokasi + timeline), serta menghitung waris Islam otomatis dengan diagram visual pohon keluarga.

## Scope

- Mobile:
    - Tab baru di Explore: **Peta** (peta interaktif Makkah/Madinah/kampanye militer).
    - Marker lokasi dengan kategori (peristiwa, pertempuran, dakwah).
    - Tap marker → bottom-sheet ringkasan + link ke konten Siroh detail.
    - Halaman Faraidh: input ahli waris, output tabel + diagram pohon.
    - Export hasil hitung ke share image / PDF.
- Web:
    - Route `/peta-sirah` di public web.
    - Route `/faraidh` (calculator + visualisasi).
- API:
    - Endpoint `GET /sirah/map` (lokasi + koordinat + event ID).
    - Endpoint `GET /faraidh/calculate` (input ahli waris → output share & fixed portion).
    - Data seeder untuk lokasi sirah + tabel Faraidh rules.
- Data/Seeder: Seed 30+ lokasi sirah (Hijrah, Fathu Makkah, perang Badar, dll) + aturan faraidh standar (4 mazhab + ringkas).

## Current Baseline

- Konten Siroh Nabawiyah sudah ada (`/sirah/*`).
- Data timeline Islamic History sudah ada (`/timeline/*`).
- Maplibre / leaflet integration belum ada — perlu teknologi baru (rekomendasi: react-native-maps untuk mobile, leaflet/react-leaflet untuk web).
- Zakat calculator sudah ada, bisa dipakai sebagai acuan pola UI/UX form kalkulator.

## Task List

1. Riset & pilih library peta (react-native-maps + leaflet web).
2. Migrasi + seeder data lokasi sirah (koordinat, tahun, kategori, deskripsi).
3. Endpoint API peta sirah & faraidh.
4. UI mobile peta interaktif + bottom-sheet detail.
5. UI web peta sirah + visualisasi faraidh.
6. Engine kalkulator faraidh (sesuai standar ringkas).
7. Export share image / PDF untuk hasil faraidh.

## Acceptance Criteria

- Peta menampilkan minimal 20 marker lokasi sirah, tap → detail.
- Hasil faraidh: input dinamis (jumlah istri, anak, saudara), output sesuai ringkasan standar (FIXED_2_3 dll sesuai dalil).
- Diagram pohon keluarga tampil proporsi dengan benar.
- Share image hasil faraidh menghasilkan PNG ringkas.

## Evidence

- Commands: `go test ./...`, web `npm run build`, mobile `eas build`.
- Device/API/Web smoke: Test input 5 skenario faraidh standar, verifikasi peta render.
- Notes:

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (#11 Siroh Nabawiyah, #34 Fiqh Ringkas)
- `docs/MOBILE_IA_FINAL_APPROACH.md`
- `apps/mobile/src/screens/explore/FeatureCatalog.js`
