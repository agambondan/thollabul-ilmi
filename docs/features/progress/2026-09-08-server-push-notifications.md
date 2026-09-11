# Server Push Notifications (FCM / APNs)

Status: `IN_PROGRESS`
Priority: `P1`
Tanggal: `2026-09-08`

## Objective

Pengiriman push notification langsung dari server untuk jadwal sholat, pengingat dzikir pagi/petang, habit harian, dan pengumuman kajian baru.

## Scope

- Mobile: Expo notification handler, sync device push token ke backend saat login/app launch.
- Web: Web push subscription (opsional / service worker) jika relevan.
- API:
    - Table `device_tokens` (user_id, token, platform, created_at, updated_at).
    - Endpoint `POST /notifications/token` & `DELETE /notifications/token`.
    - Service pengirim FCM HTTP v1 / Expo Push API.
    - Integration ke scheduler pengingat sholat & amalan harian.
- Data/Seeder: Default notification triggers / templates.

## Current Baseline

- Mobile local notification sudah aktif di `apps/mobile/src/screens/PrayerScreen.js` dan `NotificationCenter.js`.
- Endpoint backend pengingat dasar (`/notifications/*`) sudah ada di `services/api`.

## Task List

1. [x] Tambah migrasi schema tabel `push_tokens` (`model.PushToken`).
2. [x] Implementasi endpoint registrasi dan unregistrasi push token di Go Fiber.
3. [x] Buat service dispatcher pengirim push notification via Expo Push API / Web Push.
4. [x] Hubungkan scheduler pengingat sholat & amalan dengan push dispatcher.
5. [x] Tangani registrasi token dan deep-link payload di Expo client.
6. [ ] Smoke test real device development build untuk memastikan push diterima perangkat.

## Review Sebelum Commit (2026-09-08)

Ditemukan dan diperbaiki sebelum masuk `master` (repo ini tidak punya PR gate):

- `unregisterPushToken` sudah ada di client & backend tapi **tidak pernah
  dipanggil di mana pun** — logout tidak benar-benar menghapus token. Sudah
  di-wire ke `SessionContext.signOut()`.
- Bug di atas ternyata dua lapis: setelah di-wire, endpoint DELETE-nya
  **selalu menolak request** karena controller memakai ulang
  `PushTokenRegisterRequest` yang mewajibkan field `platform`, padahal client
  cuma kirim `token`. Dibuatkan `PushTokenUnregisterRequest` khusus.
- **Kebocoran notifikasi lintas user**: `UpsertPushToken` pakai unique
  constraint `(user_id, token)`, jadi HP yang sama bisa punya token aktif di
  bawah dua akun berbeda kalau user A logout gagal unregister lalu user B
  login di HP yang sama — keduanya lalu menerima notifikasi push satu sama
  lain (`FindAllActivePushTokens` mengambil semua baris aktif tanpa peduli
  device fisik yang sama). Diperbaiki: setiap register sekarang men-nonaktifkan
  baris user lain yang pegang token fisik yang sama, dalam satu transaksi.
- Regresi tak disengaja: editan di `App.js` untuk expo-notifications sempat
  ikut mengganti listener `hashchange` (web build) dari `handleHashChange`
  jadi `handleDeepLink` langsung — akan menerima `Event` bukan `url` string,
  mematahkan deep-link berbasis hash setelah navigasi pertama. Dikembalikan.
- "Klik notifikasi mengarahkan ke route yang tepat" (task #5 di atas) ternyata
  belum benar-benar jalan: payload push dari backend cuma berisi
  `type`/`notification_type`, tidak pernah `url`/`deep_link` yang dicek
  client. Ditambahkan `notificationDeepLink()` yang memetakan tiap
  `NotificationType` ke skema URL app (`thullaabulilmi://...`).
- Minor/belum digarap: `signOut` memanggil `getPushNotificationRegistration()`
  penuh (termasuk `requestPermissionsAsync` kalau izin belum pernah diminta)
  hanya untuk baca token — secara teori bisa memicu dialog izin OS saat user
  menekan "Keluar". Best-effort dan dibungkus try/catch jadi tidak
  memblokir logout, tapi belum ada fix khusus untuk ini.

## Acceptance Criteria

- User dapat mendaftarkan push token perangkat ke server saat login.
- Token lama terhapus saat user logout.
- Pengujian kirim notifikasi uji coba dari server sampai ke perangkat tujuan.
- Klik notifikasi mengarahkan user ke route/screen yang tepat via deep-link.

## Evidence

- Commands:
    - `go build ./...`, `go vet ./...` → OK
    - `go test ./...` → OK, termasuk test baru:
      `TestUpsertPushTokenReassignsSharedDeviceToNewUser`,
      `TestUpsertPushTokenSameUserDoesNotDeactivateItself`,
      `TestUnregisterPushTokenDeactivatesGivenToken`,
      `TestUnregisterPushTokenRejectsEmptyToken`
    - `npx jest` (mobile) → PASS 760/760, termasuk test baru
      "signOut unregisters the device push token when one is registered"
- Device/API/Web smoke: belum dilakukan (lihat task #6) — verifikasi di atas
  murni unit/integration test dengan sqlite in-memory & mock, bukan device
  fisik atau Expo push sungguhan.
- Notes:
- **Re-verified 2026-09-10** (setelah banyak commit lain masuk `master`, memastikan tidak regresi): `go build ./...`, `go vet ./...` bersih; `TestUpsertPushTokenReassignsSharedDeviceToNewUser`, `TestUpsertPushTokenSameUserDoesNotDeactivateItself` (app/repository), `TestUnregisterPushTokenDeactivatesGivenToken`, `TestUnregisterPushTokenRejectsEmptyToken` (app/services), dan mobile `context-session.test.js` ("signOut unregisters the device push token...") semua masih PASS. Task #6 (smoke test device fisik) tetap satu-satunya gap — butuh HP/Expo dev build sungguhan, di luar kemampuan sesi kerja ini.

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (#14 Reminder / Notifikasi)
- `apps/mobile/src/components/NotificationCenter.js`
