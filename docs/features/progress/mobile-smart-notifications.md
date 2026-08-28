# Mobile Smart Notifications

Status: `VERIFIED`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Membuat notifikasi mobile lebih bernilai dari sekadar on/off: user bisa
mengatur kategori, waktu tenang, reminder, dan inbox notifikasi.

## Scope

- Mobile:
    - notification center
    - pengaturan reminder
    - kategori notifikasi
    - quiet hours
    - local cache/inbox
- API:
    - registrasi Expo push token
    - dispatch push untuk reminder harian
- Data:
    - state notifikasi user harus tetap personal

## Current Baseline

- Notification Center sudah tercatat di `docs/MOBILE_FEATURE_REFERENCE.md`.
- Smart notification utility sudah ada di mobile dan masih bergerak.

## Task List

1. `DONE` Polish copy agar tidak memakai istilah teknis.
2. `DONE` Seragamkan state dari backend dan storage mobile.
3. `DONE_STRUCTURAL` Validasi retry/offline behavior lewat state lokal dan
   pending sync.
4. `PENDING_DEVICE` Smoke reminder di device.

## Acceptance Criteria

- user memahami kategori notifikasi tanpa membaca istilah backend
- quiet hours jelas dan tidak bentrok dengan reminder ibadah
- inbox bisa mark read dan tetap stabil ketika offline
- push token registration tidak memblok UI

## Evidence

- Notification Center tetap bisa dipakai tanpa login untuk reminder lokal;
  login hanya diperlukan untuk push cloud dan kotak masuk.
- Copy teknis seperti `backend`/`perangkat` dipetakan ke wording user-facing
  seperti `cloud`, `HP ini`, dan `sesi aktif`.
- Pending sync punya retry eksplisit dan tetap menyimpan reminder lokal saat
  cloud/offline gagal.
- Header jadwal aktif dan item kotak masuk memakai shared `SectionHeader`.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-notification-section-header-export`
  `PASS`.
- `node --check apps/mobile/src/components/NotificationCenter.js` `PASS`.
- `node --check apps/mobile/src/utils/smartNotifications.js` `PASS`.
- Device smoke masih wajib sebelum status dinaikkan ke `DONE`; `adb devices -l`
  sudah tersedia pada sesi 2026-05-14, tetapi tap/swipe/keyevent manual via ADB
  masih diblokir MIUI dengan `INJECT_EVENTS`.
- Smoke tambahan 2026-05-14:
    - Home device menampilkan `LOKASI AKTIF`, bukan fallback `Lokasi belum terbaca`.
      Screenshot: `/tmp/thollabul-smoke/current-2026-05-14.png`.
    - `GET /api/v1/notifications/settings` tanpa token mengembalikan
      `HTTP 401`, sesuai endpoint personal yang butuh login.
    - Deep link otomatis ke notification route belum terkonfirmasi karena device
      tetap berada di search screen dengan keyboard aktif; perlu tap manual dari
      user/device untuk validasi inbox, mark read, dan quiet hours.

## Source of Truth

- `docs/MOBILE_FEATURE_REFERENCE.md`
- `apps/mobile/src/components/NotificationCenter.js`
- `apps/mobile/src/utils/smartNotifications.js`
