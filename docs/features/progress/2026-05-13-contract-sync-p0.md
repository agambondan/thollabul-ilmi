# Contract Sync P0 Fixes

Status: `VERIFIED`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Menutup mismatch endpoint paling kritis antara mobile, web admin, dan backend
supaya fitur yang sudah muncul di UI tidak 404 atau memakai payload yang beda
dari kontrak API.

## Scope

- Mobile: daily ayah Home dan feature list Wirid.
- Web: API client untuk Hijri convert, admin sejarah, admin quiz, admin asbabun
  nuzul.
- API: route/controller/service/repository untuk daily ayah, asbabun nuzul list,
  quiz admin adapter, asbabun nuzul many-to-many mutation, dan alias wirid list.
- Data/Seeder: tidak ada perubahan seed pada slice ini.

## Current Baseline

- Mobile memanggil `/api/v1/ayah/daily`, tetapi API belum punya route.
- Web admin sejarah memakai `/api/v1/sejarah`, sedangkan backend memakai
  `/api/v1/history`.
- Web admin quiz memakai `/api/v1/quiz/questions/*`, sedangkan backend hanya
  punya session/create/delete dasar.
- Web admin asbabun nuzul butuh list endpoint.
- Mobile/web Wirid memakai `/api/v1/wirid`, tetapi backend hanya punya
  `/wirid/occasion/:occasion`.

## Task List

1. `DONE` Tambah `GET /api/v1/ayah/daily`.
2. `DONE` Arahkan web admin sejarah ke `/api/v1/history`.
3. `DONE` Tambah adapter admin quiz `/api/v1/quiz/questions/*`.
4. `DONE` Tambah `GET /api/v1/asbabun-nuzul` dan alias `/list`.
5. `DONE` Arahkan helper Hijri convert ke `/api/v1/hijri/convert`.
6. `DONE` Tambah `GET /api/v1/wirid` sebagai alias list dzikir.
7. `DONE` Seragamkan admin static CRUD wirid/tahlil/manasik/fiqh ke route
   backend yang sesuai.
8. `DONE` Sesuaikan form admin asbabun nuzul dengan model many-to-many ayah.
9. `DONE` Tambah contract route smoke yang membandingkan client path dengan
   route Fiber.
10. `DONE` Seragamkan Imsakiyah dan payload sholat checklist lintas mobile/web.

## Acceptance Criteria

- route P0 yang dipakai mobile/web tidak 404
- web admin quiz bisa list/create/update/delete memakai payload UI saat ini
- docs review mencatat fixed vs remaining secara eksplisit
- focused backend tests dan syntax check web API client hijau

## Evidence

- Commands:
    - `cd services/api && go test ./app/controllers ./app/services ./app/repository ./app/http`
    - `cd services/api && go test ./...`
    - `node --check apps/web/src/lib/api.js`
    - `node --check apps/web/src/app/admin/asbabun-nuzul/page.js`
    - `node --check apps/web/src/app/asbabun-nuzul/page.js`
    - `npm --prefix apps/web run lint`
    - `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-contract-sync-mobile-export`
    - `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-contract-sync-mobile-export-2`
    - `git diff --check`
- Route tests:
    - `TestP0ContractRoutes` menjaga daily ayah, history, hijri convert, quiz
      admin, asbabun nuzul list, wirid, tahlil items, manasik items, dan fiqh
      items tetap terdaftar.
    - `TestAsbabunNuzulRepositoryCreateAndReplaceAyahs` menjaga resolve
      `surah_number + ayah_number`, create relasi banyak ayat, dan update yang
      mengganti join table.
    - `TestDzikirRepositoryCreateUpdateAndQueries`,
      `TestTahlilRepositoryCollectionAndItemCRUD`,
      `TestManasikRepositoryCreateUpdateAndOrder`, dan
      `TestFiqhRepositoryItemCRUDKeepsDalilSeparate` menjaga repository CRUD
      static content admin tetap membuat/memperbarui translation row, menjaga
      default repeat tahlil, urutan manasik, dan pemisahan `fiqh.source` dari
      `fiqh.dalil`.
- Runtime API/Web smoke:
    - source API `http://localhost:9900`: authenticated Asbabun Nuzul
      list/create/update/delete `PASS`.
    - web admin `http://localhost:3001/admin/asbabun-nuzul`: browser smoke
      create/update/delete `PASS`.
    - Docker API `http://localhost:29900`: `GET /api/v1/asbabun-nuzul` kembali
      `200 OK` setelah rebuild.
    - Docker API `http://localhost:29900`: authenticated Asbabun Nuzul
      create/update/delete `PASS`.
- Docker rebuild:
    - `docker compose up -d --build tholabul-ilmi-api tholabul-ilmi-web`
      `PASS`.
- Device smoke:
    - belum bisa dijalankan karena `adb devices -l` tidak menampilkan device.
- Notes:
    - asbabun nuzul list dan create/update UI sudah mengirim relasi `Ayahs`
      melalui `ayah_refs`/range ayat.
    - admin fiqh sudah memakai field `dalil` terpisah dari `source`.
    - Imsakiyah tanpa koordinat memakai default Jakarta; UX lokasi personal tetap
      bisa ditingkatkan di slice fitur terpisah.

## Source of Truth

- `docs/reviews/2026-05-13-contract-sync-review.md`
- `services/api/app/http/routes.go`
- `apps/web/src/lib/api.js`
- `apps/mobile/src/api/client.js`
- `apps/mobile/src/data/mobileFeatures.js`
