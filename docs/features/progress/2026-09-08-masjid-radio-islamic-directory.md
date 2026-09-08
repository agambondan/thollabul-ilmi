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
5. [ ] Smoke test end-to-end terhadap Postgres asli (bukan sekadar
   `go build`/`go vet`) — helper matematika raw SQL (`radians`, `acos`, dst.)
   tidak tersedia di driver SQLite yang dipakai test harness repo ini,
   sehingga `FindNearby` belum ada automated test dan baru diverifikasi lewat
   pembacaan manual query + semantik `HAVING`/`GORM Updates`.
6. [ ] Tambahkan entri ke `docs/features/feature-manifest.json` kalau fitur
   ini ingin muncul di discovery/mobile catalog (belum dilakukan — saat ini
   hanya live di web).

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
- Device/API/Web smoke: belum dilakukan terhadap Postgres asli.
- Notes: fitur ini belum masuk `feature-manifest.json` / mobile catalog —
  saat ini web-only.

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (belum ada entri eksplisit untuk fitur ini —
  perlu ditambahkan kalau mau dilanjutkan ke tier berikutnya)
