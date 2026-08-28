# Web Dashboard And Admin Review

Tanggal: `2026-05-13`
Scope: `apps/web`
Status: `REVIEWED_WITH_PARTIAL_FIX`

## P0 Findings

### 1. Personal Dashboard Belum Satu Source Of Truth Dengan Mobile

Beberapa halaman dashboard web masih memakai `localStorage` sebagai storage
utama atau fallback dominan:

- hafalan: `apps/web/src/app/dashboard/hafalan/page.js:48-66`
- sholat tracker: `apps/web/src/app/dashboard/sholat-tracker/page.js:48-116`
- tilawah: `apps/web/src/app/dashboard/tilawah/page.js:44-73`

Sementara mobile memakai API personal:

- hafalan: `apps/mobile/src/api/personal.js:163-171`
- sholat: `apps/mobile/src/api/personal.js:41-54`
- tilawah summary: `apps/mobile/src/api/personal.js:161`

Impact:

- user login di web dan mobile bisa melihat progress berbeda.
- dashboard web bisa tampak "berhasil" karena tersimpan lokal, tetapi mobile
  tidak ikut berubah.

Rekomendasi:

- untuk user login, API harus jadi source of truth.
- localStorage hanya cache/offline queue, bukan canonical data.
- tampilkan badge "Belum tersinkron" jika data lokal belum berhasil dikirim.

Update 2026-05-13:

- dashboard hafalan, sholat tracker, dan tilawah sudah dibuat API-first saat
  user login.
- `localStorage` dipertahankan sebagai cache/fallback dan menampilkan warning
  ketika sync gagal.
- dashboard summary/profile/stats, goals, muhasabah, dan notes masih perlu
  audit lanjutan.

### 2. Hafalan Status Web Tidak Sesuai Enum API/Mobile

Evidence:

- web memakai `hafal`, `sedang`, `belum`.
- API model menerima `not_started`, `in_progress`, `memorized`.
- mobile Quran memakai enum API yang sama.

Impact:

- update hafalan dari web dapat ditolak atau tersimpan sebagai status yang tidak
  dihitung benar.
- statistik hafalan lintas platform bisa salah.

Rekomendasi:

- ubah web status internal ke enum API.
- mapping label tetap boleh Indonesia:
    - `not_started` -> `Belum`
    - `in_progress` -> `Sedang`
    - `memorized` -> `Hafal`

Update 2026-05-13: dashboard web hafalan sudah memakai enum API tersebut dan
melakukan normalisasi legacy localStorage.

### 3. Sholat Tracker Web Mengirim Payload Berbeda Dari API

Evidence:

- API menerima satu log: `{ date, prayer, status }`.
- web dashboard mengirim object checklist penuh lewat
  `sholatTrackerApi.update(updated)`.
- mobile Prayer screen sudah mengirim satu log per prayer.

Impact:

- update sholat dari web tidak reliable.
- statistik sholat bisa beda antara dashboard web dan mobile.

Rekomendasi:

- ubah web toggle agar mengirim satu prayer per request.
- gunakan status API valid, minimal `munfarid` untuk quick-check.

Update 2026-05-13: dashboard web sholat sudah mengirim `{ date, prayer,
status }` per prayer dan menormalisasi label `Shubuh` ke key API `subuh`.

### 4. Admin CMS Route Drift

Detail lengkap ada di [contract sync review](./2026-05-13-contract-sync-review.md).

Ringkas:

- `adminSejarahApi` memakai `/sejarah`, API memakai `/history`.
- `adminQuizApi` memakai `/quiz/questions/*`, API memakai `/quiz`.
- `adminAsbabunNuzulApi` memakai `/asbabun-nuzul/list`, API belum punya list.
- admin static CRUD untuk wirid/tahlil/manasik/fiqh belum sinkron dengan route
  API.

Impact:

- admin bisa menampilkan empty state palsu.
- tombol tambah/edit/hapus bisa gagal diam-diam karena beberapa catch kosong.

Rekomendasi:

- jangan swallow error di admin save/delete.
- tampilkan toast/error banner.
- tambahkan smoke admin per module setelah route sync.

## P1 Findings

### 5. Public Web Dan Dashboard Kadang Menggunakan API Helper Berbeda

Ada halaman yang memakai `apps/web/src/lib/api.js`, tetapi cukup banyak halaman
langsung memanggil `fetch(`${process.env.NEXT_PUBLIC_API_URL}/...`)`.

Impact:

- auth, refresh, error handling, dan locale header tidak seragam.
- endpoint drift sulit dicari karena tidak semua path lewat satu client.

Rekomendasi:

- jadikan `apps/web/src/lib/api.js` satu pintu API.
- untuk server component, buat helper `serverApiFetch`.
- untuk client component, gunakan `authFetch` atau public helper yang sama.

### 6. Lint Warning Hook Dependency

`npm --prefix apps/web run lint` passed, tetapi warning muncul di:

- `src/app/amalan/page.js`
- `src/app/hafalan/page.js`
- `src/app/hijri/page.js`
- `src/app/imsakiyah/page.js`
- `src/app/kiblat/page.js`
- `src/app/leaderboard/page.js`
- `src/app/tilawah/page.js`

Impact:

- bisa menyebabkan stale translation `t`, stale loader, atau effect tidak
  refresh ketika dependency berubah.

Rekomendasi:

- wrap loader dengan `useCallback` atau pindahkan function ke dalam effect.
- jadikan warning hook dependency sebagai cleanup batch P2 setelah P0 contract
  drift selesai.

## Suggested Web Work Order

1. Fix API client route drift.
2. Fix personal data enum/payload mismatch.
3. Replace localStorage-first dashboard pages with API-first + offline cache.
4. Add visible error feedback in admin CRUD.
5. Clean React hook dependency warnings.
