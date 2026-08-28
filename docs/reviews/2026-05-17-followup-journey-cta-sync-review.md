# Follow-up Journey CTA Sync Review

Status: `PARTIALLY_FIXED`
Tanggal: `2026-05-17`
Scope: `apps/web`, `apps/mobile`, `docs/features/feature-manifest.json`

## Ringkasan Verdict

Review lanjutan menemukan beberapa gap kecil-menengah yang masih lolos dari
review sebelumnya. Tiga gap yang jelas dan low-risk langsung ditutup:

- Dashboard sekarang punya wrapper route untuk fitur public `Tokoh Tarikh` dan
  `Peta Islam`, sehingga user dashboard tidak perlu keluar ke layout public.
- Logo dashboard tidak lagi mengarah ke landing page public `/`, tetapi tetap
  berada di `/dashboard`.
- Copy mobile `Jadwal Sholat` di hub Ibadah tidak lagi menyebut `log harian`,
  karena log sholat sudah punya entry khusus.
- Smoke route dashboard juga menangkap i18n missing di `Peta Islam`; key mentah
  `peta.title`/`peta.subtitle` sudah ditutup untuk bahasa ID dan EN.

Sisa utama bukan blocker runtime, tetapi perlu ditutup supaya parity tidak
drift lagi: dokumen sync lama masih menyebut beberapa fitur sebagai missing
padahal sudah ada, dan route parity perlu dibuat smoke/test kecil.

## Evidence

- Web route audit: `find apps/web/src/app -name page.js`.
- Mobile feature audit: `apps/mobile/src/data/mobileFeatures.js`.
- Source of truth feature audit: `docs/features/feature-manifest.json`.
- CTA dashboard audit: `apps/web/src/app/dashboard/layout.js`.
- Mobile Ibadah copy audit: `apps/mobile/src/screens/IbadahScreen.js`.
- Runtime smoke:
    - `/dashboard/tokoh` stays inside dashboard shell with authenticated local
      token stub.
    - `/dashboard/peta` stays inside dashboard shell with authenticated local
      token stub and renders Leaflet map.
    - Dashboard brand click from `/dashboard/peta` lands on `/dashboard`.
- Build/test:
    - PASS: `cd apps/web && npm run build`
    - PASS: `cd apps/mobile && npm test -- --runInBand`
- Guideline reference: Vercel Web Interface Guidelines, terutama rule
  navigation state dan CTA label spesifik.

## Findings

### F-01 - Dashboard Belum Punya Wrapper Tokoh Dan Peta

Priority: `P1`
Status: `FIXED`
Area: `apps/web`

Public route sudah ada:

- `/tokoh`
- `/peta`

Mobile juga sudah punya entry:

- `feature:tokoh`
- `feature:historical-map`

Tetapi manifest sebelumnya masih `dashboardWebRoute: null`, dan dashboard
tidak punya `/dashboard/tokoh` maupun `/dashboard/peta`. Ini melanggar prinsip
yang sudah dipakai di fitur public lain: user yang mulai dari dashboard boleh
memakai data public, tetapi CTA/detail tetap berada di shell dashboard.

Fix:

- Tambah `/dashboard/tokoh`.
- Tambah `/dashboard/peta`.
- Tambah link sidebar dashboard untuk `Tokoh Tarikh` dan `Peta Islam`.
- Update manifest supaya `dashboardWebRoute` tidak lagi `null`.

### F-02 - Logo Dashboard Masih Bocor Ke Landing Public

Priority: `P1`
Status: `FIXED`
Area: `apps/web`

Logo/brand di dashboard sebelumnya mengarah ke `/`. Untuk journey dashboard,
klik brand harus mempertahankan konteks dashboard, bukan membawa user ke
landing public.

Fix:

- `apps/web/src/app/dashboard/layout.js` brand link diarahkan ke `/dashboard`.

### F-03 - CTA Copy Mobile Jadwal Sholat Masih Menjanjikan Log

Priority: `P2`
Status: `FIXED`
Area: `apps/mobile`

Hub Ibadah punya entry `Jadwal Sholat` dan entry terpisah `Log Sholat`.
Subtitle `Jadwal, log harian, dan pengingat` membuat user mengira log masih
bagian dari jadwal, padahal log sudah dipisah sesuai keputusan UX terakhir.

Fix:

- Subtitle `Jadwal Sholat` diganti menjadi `Jadwal, pengingat, dan pengaturan
waktu`.

### F-04 - Dokumentasi Sync Lama Sudah Stale

Priority: `P2`
Status: `OPEN`
Area: `docs`

`docs/WEB_MOBILE_SYNC.md` masih menyebut beberapa fitur sebagai missing atau
kurang sync, contohnya Forum Q&A, Tokoh Tarikh, Peta Interaktif, dan beberapa
fitur lain yang sudah ditutup dalam task 1-11 dan follow-up ini. Ini berisiko
membuat agent berikutnya mengerjakan ulang scope yang sudah selesai.

Rekomendasi:

- Refresh `docs/WEB_MOBILE_SYNC.md` dari manifest terbaru.
- Tandai bagian lama sebagai historical baseline jika tidak ingin dihapus.
- Tambahkan link ke review/task breakdown terbaru.

### F-05 - Manifest Belum Mencakup Route Profil Sebagai Route-Level Surface

Priority: `P3`
Status: `OPEN`
Area: `docs`, `apps/web`

Audit route menunjukkan `/profile`, `/dashboard/profile`, dan `/contact`
tidak masuk feature manifest. Ini bukan fitur konten utama, tetapi tetap
route-level surface yang sering dipakai CTA account/support.

Rekomendasi:

- Tambahkan section `surfaces` atau `utilityRoutes` di manifest supaya parity
  checker tidak perlu hardcode exception.

### F-06 - Perlu Smoke Route Setelah Wrapper Dashboard Baru

Priority: `P2`
Status: `FIXED`
Area: `apps/web`

Wrapper `/dashboard/tokoh` dan `/dashboard/peta` memakai content public yang
direuse di dalam dashboard shell. Secara build ini seharusnya aman, tetapi
tetap perlu browser smoke karena `/peta` memakai dynamic Leaflet map.

Fix:

- Browser smoke `/dashboard/tokoh` dengan token lokal.
- Browser smoke `/dashboard/peta` dengan token lokal.
- Map render di content width dashboard tanpa keluar dari shell.

### F-07 - Peta Islam Menampilkan Raw I18n Key Di Dashboard

Priority: `P2`
Status: `FIXED`
Area: `apps/web`

Saat smoke `/dashboard/peta`, heading dan subtitle muncul sebagai
`peta.title` dan `peta.subtitle`. Ini terjadi karena content public direuse ke
dashboard, tetapi key i18n `peta.*` belum tersedia. Fallback `??` tidak
terpakai karena helper `t()` mengembalikan key string.

Fix:

- Tambah `peta.title` dan `peta.subtitle` untuk locale ID.
- Tambah `peta.title` dan `peta.subtitle` untuk locale EN.
- Smoke ulang memastikan key mentah tidak lagi tampil.
