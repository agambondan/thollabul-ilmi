# Personal Data Sync P0

Status: `DONE`
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
7. `DONE` Perluas API-first policy ke dashboard summary/profile/stats.
8. `DONE` Audit `goals`, `muhasabah`, dan `notes` agar tidak silent fallback
   tanpa badge sync.
9. `DONE` Runtime smoke di browser nyata (Playwright, bukan cuma `node --check`)
   untuk skenario API mati: goals, muhasabah, notes, dashboard summary, stats.

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

## 2026-09-03 Update — Runtime Smoke Selesai

Task 7 dan 8 sebelumnya berstatus `DONE_STRUCTURAL` karena hanya diverifikasi
lewat `node --check` dan `npm run build` — belum pernah benar-benar dibuka di
browser dengan sesi authenticated. Gap itu sekarang ditutup:

- Membaca ulang kode `dashboard/page.js` (summary), `ProfileContent.js`, dan
  `dashboard/stats/page.js`: ketiganya sudah API-first dengan fallback lokal
  dan badge sync yang terlihat — implementasinya sudah lebih matang dari yang
  tercatat di update 2026-05-14, kemungkinan diperbaiki lebih lanjut di sesi
  antara.
- Ditulis `apps/web/tests/flows/personal-data-sync.spec.js` — 6 test
  Playwright yang menjalankan browser Chromium sungguhan (bukan mock DOM),
  mem-fail-kan endpoint `/api/v1/goals`, `/api/v1/muhasabah`, `/api/v1/notes`,
  `/api/v1/sholat/today`, `/api/v1/stats` satu per satu, lalu memverifikasi
  DUA hal sekaligus: (a) data lokal yang di-seed tetap tampil, dan (b) badge
  "Belum tersinkron" ikut tampil. Salah satu tanpa yang lain dianggap gagal.
- **Bug ditemukan dan diperbaiki dari smoke test ini**: `NotificationPermissionPrompt`
  dirender di `z-[70]`, di atas seluruh ~55 modal `z-50` di aplikasi (termasuk
  modal goals/muhasabah/notes). Kalau banner izin lokasi/notifikasi sedang
  tampil — paling mungkin di kunjungan pertama dashboard, sebelum di-dismiss —
  panel-nya menutupi dan memblokir klik ke tombol di dalam modal manapun yang
  sedang terbuka. Test create-goal awalnya timeout 30 detik karena persis
  kasus ini. Diperbaiki: banner dipindah ke `z-[45]` (di atas chrome permanen
  di `z-40`, di bawah semua modal `z-50`+).
- Suite Playwright penuh (360 test) dijalankan sebagai regresi lebih luas:
  18 gagal, semuanya tertelusuri ke test lama yang stale (mis. locator `nav`
  ambigu setelah `MobileTabBar` ditambahkan, ekspektasi teks "Hadis" vs
  "Hadith" yang sudah lama tidak sinkron, target redirect login yang memang
  `/` bukan `/dashboard`) — bukan regresi dari perubahan sesi ini. Dicatat
  sebagai utang e2e terpisah, tidak diperbaiki di sini supaya scope tetap
  terjaga.

## Notes

- Lint web pass, `npx jest` 489/489, `npx eslint .` 0 error.
- Runtime smoke sekarang sudah dilakukan di browser Chromium sungguhan lewat
  Playwright dengan API dipaksa gagal — bukan lagi celah yang tercatat di
  update sebelumnya.
