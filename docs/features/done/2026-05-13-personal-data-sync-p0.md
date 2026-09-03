# Personal Data Sync P0

Status: `IN_PROGRESS`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Menjadikan API sebagai source of truth untuk data personal lintas web dan
mobile, dengan `localStorage` hanya sebagai cache/fallback ketika user belum
login atau server sedang tidak tersedia.

## Scope Slice Ini

- Web dashboard hafalan memakai enum API:
    - `not_started`
    - `in_progress`
    - `memorized`
- Web dashboard sholat mengirim satu log per prayer:
    - `{ date, prayer, status }`
- Web dashboard tilawah memuat daftar dari `/api/v1/tilawah` saat login.
- `tilawahApi.add` mengirim `date`, sesuai kontrak backend.
- Cache lokal tetap dipakai sebagai fallback dan diberi warning
  `Belum tersinkron` ketika request gagal.

## Task List

1. `DONE` Seragamkan status hafalan dashboard web ke enum API/mobile.
2. `DONE` Jadikan API hafalan sebagai source utama saat user login.
3. `DONE` Ubah toggle sholat dashboard web menjadi payload satu prayer.
4. `DONE` Normalisasi key `Shubuh` web ke `subuh` API.
5. `DONE` Jadikan tilawah dashboard web memuat data dari API saat login.
6. `DONE` Tambahkan `date` ke payload create tilawah.
7. `DONE_STRUCTURAL` Perluas API-first policy ke dashboard summary/profile/stats.
8. `DONE_STRUCTURAL` Audit `goals`, `muhasabah`, dan `notes` agar tidak silent fallback
   tanpa badge sync.

## Evidence

- `node --check apps/web/src/lib/api.js`
- `node --check apps/web/src/app/dashboard/hafalan/page.js`
- `node --check apps/web/src/app/dashboard/sholat-tracker/page.js`
- `node --check apps/web/src/app/dashboard/tilawah/page.js`
- `npm --prefix apps/web run lint`
- 2026-05-14:
    - `node --check apps/web/src/lib/personalSync.js && node --check apps/web/src/lib/api.js`
      `PASS`
    - `npm --prefix apps/web run lint` `PASS WITH EXISTING WARNINGS`
    - `npm --prefix apps/web run build` `PASS`

## 2026-05-14 Update

- `apps/web/src/lib/personalSync.js` ditambahkan sebagai normalizer bersama
  untuk goals, muhasabah, notes personal, sholat, hafalan, dan tilawah.
- Dashboard utama sekarang memuat sholat hari ini, goals, dan muhasabah dari
  API saat login, lalu cache ke `localStorage` dan menampilkan warning saat
  sinkron gagal.
- Dashboard profile dan stats sekarang memuat muhasabah/hafalan/goals/tilawah
  dari API saat login, bukan hanya local cache.
- Goals memakai kontrak backend `type/title/description/target/start_date/end_date`
  saat create dan `progress/is_completed` saat update.
- Muhasabah memakai `mood_score` dan `is_private`.
- Notes personal memakai endpoint notes existing dengan `ref_type=personal`
  dan konten JSON terenkode agar title/tags tetap tersimpan tanpa mengubah
  kontrak backend.
- Normalisasi sholat dashboard sekarang memakai key API `subuh`, sehingga
  mismatch lama `Shubuh` vs `subuh` tidak membuat hitungan hari ini meleset.

## Notes

- Lint web masih pass dengan warning lama di halaman public non-dashboard.
- Runtime smoke login dashboard authenticated belum dilakukan di browser karena
  belum ada token browser yang dipakai pada sesi ini. Implementasi sudah
  compile/build dan fallback tidak lagi silent.
