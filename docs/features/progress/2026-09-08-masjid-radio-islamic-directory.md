# Masjid & Radio Islamic Directory

Status: `IN_PROGRESS`
Priority: `P2`
Tanggal: `2026-09-08`

## Objective

Direktori publik masjid (dengan pencarian "terdekat" berbasis lokasi) dan
direktori radio dakwah/tilawah Islam (dengan info frekuensi AM/FM per kota dan
streaming online), diakses dari web tanpa login.

## Scope

- Web: halaman `/masjid` dan `/radio-islamic`, nav link di Sidebar & Footer,
  i18n EN/ID.
- API: CRUD masjid (`/masjids`, admin write), CRUD radio (`/radio-islamic`,
  admin write), endpoint `/masjids/nearby` (Haversine distance search).
- Data/Seeder: `SeedMasjids`, `SeedRadioIslamic` — data awal masjid Jakarta
  dan daftar radio dakwah Indonesia.

## Current Baseline

Fitur ini ditemukan sudah **hampir lengkap dibangun end-to-end tapi belum
pernah di-commit atau direview** (model, migration, seeder, repository,
service, controller, routes, halaman web, nav, i18n, test) — dilanjutkan dan
di-review dalam sesi ini sebelum masuk ke `master` (repo ini tidak punya PR
gate, jadi review dilakukan manual sebelum commit).

## Task List

1. [x] Model `Masjid` & `RadioIslamic` + migration + seeder data awal.
2. [x] Repository/service/controller CRUD + endpoint `/masjids/nearby`.
3. [x] Halaman web `/masjid` dan `/radio-islamic` + nav link + i18n.
4. [x] Review manual pra-commit — ditemukan dan diperbaiki:
    - `HAVING distance_km <= ?` tanpa `GROUP BY` di raw SQL Postgres selalu
      gagal (ungrouped column error), jadi tiap request nyasar ke query
      fallback → 3 DB roundtrip per request. Disederhanakan jadi 1 query
      subquery yang memang valid, tanpa fallback.
    - `MasjidDistance.Distance` tidak punya `gorm:"column:distance_km"`,
      jadi hasil `distance_km` dari raw SQL tidak pernah ke-bind (selalu 0).
    - `Update()` masjid & radio pakai `Updates(structPtr)` yang GORM lewati
      untuk field zero-value (`false`, `0`, `""`) — admin tidak bisa
      menonaktifkan (`is_active:false`) atau mengosongkan field lewat PUT.
      Diperbaiki pakai `.Select(<field list>)` eksplisit.
    - `validate:"required"` di field `Latitude`/`Longitude` menolak nilai
      `0.0` yang sah (koordinat di ekuator/garis bujur nol).
    - Data seed "radio streaming murottal 24 jam" salah isi `website` dengan
      domain aplikasi sendiri (`thollabul-ilmi.com`), bukan sumber aslinya —
      dikosongkan.
    - Frontend: `masjidApi`/`radioIslamicApi` pakai `fetch().then(r=>r.json())`
      tanpa cek `res.ok`, jadi response error tidak pernah terdeteksi sebagai
      gagal — diganti pakai helper `parseApiJson` yang sudah dipakai endpoint
      lain.
    - `MasjidClient`/`RadioIslamicClient` skip update state kalau hasil
      filter API kosong (`if (items.length) setX(items)`), jadi domisili yang
      benar-benar 0 hasil tetap menampilkan data lama. Dihapus guard-nya.
    - `calculateDistanceKm`/`getNearbyMasjids` pakai falsy-check (`!lat`)
      untuk deteksi koordinat kosong, salah menganggap `0` sebagai "tidak
      ada". Diganti `== null`.
    - Hapus tipe request/response (`MasjidNearbyRequest`, dst.) yang
      didefinisikan tapi tidak pernah dipakai controller manapun (dead code).
5. [x] Smoke test end-to-end terhadap Postgres asli (2026-09-08, sesi
   lanjutan): `docker compose up --build` + `make db-setup-docker` untuk
   migrate+seed nyata (catatan: `db-setup-docker` gagal total di tabel
   `kajian_transcript` karena image `postgres:18-alpine` tidak punya
   extension `vector` — pre-existing gap infra, di luar scope fitur ini;
   tabel `masjid`/`radio_islamic` dibuat manual by-hand mengikuti skema
   model persis untuk melewati blocker itu). Diverifikasi via browser
   (Playwright + Chrome) dan curl langsung ke API:
    - Create lewat form admin → row muncul di DB & list.
    - `PUT` partial (`{"is_active": false}` saja) → field lain (name,
      address, city, lat/lng) terbukti **tidak** ikut ter-reset — mengonfirmasi
      fix GORM zero-value dari task #4 beneran jalan di Postgres asli.
    - `DELETE` → row hilang dari list & DB.
    - `/masjids/nearby` (trig SQL) **belum** diverifikasi langsung di sesi
      ini — hanya CRUD dasar yang di-smoke-test.
6. [x] Admin CRUD UI (2026-09-08, sesi lanjutan): `/admin/masjid` dan
   `/admin/radio-islamic` (pola `GenericAdminCRUD`, sama seperti
   `/admin/locations`), didaftarkan di nav admin group "Directory". Sebelum
   ini backend sudah bisa `POST/PUT/DELETE` tapi **tidak ada UI sama
   sekali** — data cuma bisa diubah lewat DB langsung.
    - Review sambil bangun: `Create` masjid/radio pakai `lib.ErrorInternal`
      untuk error apa pun termasuk duplicate-name (unique constraint) —
      seharusnya `lib.ErrorConflict` (pola yang sudah dipakai
      `doa_controller.go` dkk, auto-parse pesan Postgres "duplicate key"
      jadi respons 409 yang jelas). Diperbaiki di kedua controller.
7. [x] Mobile screen (2026-09-08, sesi lanjutan): `MasjidDirectoryContent`
   (search + "Masjid Terdekat" pakai GPS `expo-location` →
   `/masjids/nearby`, detail via `AppModalSheet`) dan `RadioIslamicContent`
   (search + play/pause per baris pakai `utils/audioPlayer.js`, satu
   stream aktif sekaligus, `stopAudio()` saat unmount). Didaftarkan ke
   `mobileFeatures.js`, `FeatureCatalog.js` (`LOCAL_TOOL_TYPES` + ikon),
   `ExploreClassicRenderers.js`/`ExploreWebAppRoutes.js` (dispatch dua
   layout mode), dan `docs/features/feature-manifest.json` (dua entri
   baru, `node scripts/check-feature-parity.js` → passed). Masjid juga
   dapat baris di Ibadah hub (section "Arah & Waktu", redirect ke
   Belajar); Radio Islamic masuk grup Belajar "Kajian & Artikel".
    - Parity check ini butuh `dashboardWebRoute` terisi untuk status
      `active` — dibuatkan `apps/web/src/app/dashboard/masjid/page.js`
      dan `.../dashboard/radio-islamic/page.js` (wrapper tipis, pola sama
      seperti `dashboard/tokoh/page.js`).
    - Test baru: `masjidDirectoryContent.test.js`,
      `radioIslamicContent.test.js`; `mobileFeatures.test.js` dan
      `ibadahScreen.test.js` diupdate untuk entri/baris baru. Mobile suite
      770/770 hijau.
    - Belum diverifikasi di device fisik (izin lokasi & streaming audio
      real hanya diverifikasi lewat mock jest, bukan expo dev build).

## Acceptance Criteria

- User bisa cari masjid berdasarkan domisili atau lokasi GPS ("masjid
  terdekat"), lihat detail (alamat, kapasitas, fasilitas, kontak, link Maps).
- User bisa cari & memutar streaming radio dakwah/tilawah berdasarkan kota
  atau kategori nasional/streaming.
- Admin/editor bisa CRUD data masjid dan radio, termasuk menonaktifkan
  (`is_active`) tanpa field lain ikut ter-reset.
- `GET /masjids/nearby` mengembalikan hasil terurut jarak yang benar
  (`distance_km` bukan selalu 0) dalam satu query, bukan query gagal +
  fallback.

## Evidence

- Commands:
    - `go build ./...` → OK
    - `go vet ./...` → OK
    - `gofmt -l` → clean
    - `go test ./app/controllers/... ./app/repository/... ./app/services/...` → OK (paket ada, belum ada test khusus masjid/radio — lihat task #5)
    - `npx jest --testPathPattern='masjidRadio'` → PASS (10 tests, termasuk
      regresi untuk bug koordinat `0`)
- Device/API/Web smoke: lihat task #5 — CRUD dasar (create/update
  parsial/delete) diverifikasi lewat browser + curl terhadap Postgres asli
  di `docker compose`. `/masjids/nearby` belum di-smoke-test langsung, dan
  mobile screen belum dicoba di device/emulator fisik (Expo dev build) —
  cuma jest dengan `expo-location`/`utils/audioPlayer` di-mock.
- Notes: fitur ini sekarang lengkap di ketiga platform (backend, web
  publik+dashboard+admin, mobile) — lihat
  `docs/reviews/2026-09-08-feature-route-inventory.md` §4 untuk status
  checklist terbaru per platform.

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (belum ada entri eksplisit untuk fitur ini —
  perlu ditambahkan kalau mau dilanjutkan ke tier berikutnya)
