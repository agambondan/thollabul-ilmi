# Web Mobile Parity Gap Follow-Up

Tanggal: 2026-05-23
Scope: follow-up dari `docs/reviews/2026-05-23-web-mobile-feature-parity-deep-review.md`.

## Implemented

| Gap | Status | Evidence |
| --- | --- | --- |
| Mobile Profile > Tampilan masih copy "akan tersedia segera" | Done | `apps/mobile/src/screens/ProfileScreen.js` sekarang punya pilihan tema, bahasa konten, dan mode layout. Preferensi disimpan lewat `apps/mobile/src/storage/preferences.js`; bahasa login juga dikirim ke `PUT /api/v1/auth/me`. |
| Mobile Profile > Keamanan masih copy sesi aktif/ganti sandi "sedang disiapkan" | Done | `apps/mobile/src/screens/ProfileScreen.js` sekarang menampilkan current-device session, sign-out perangkat ini, dan form ganti sandi memakai `PUT /api/v1/auth/password`. |
| Mobile auth API belum punya helper update profile/password | Done | `apps/mobile/src/api/auth.js` menambahkan `updateProfile()` dan `updatePassword()`. |
| Session user perlu refresh setelah update language | Done | `apps/mobile/src/context/SessionContext.js` menambahkan `updateCurrentUser()` untuk merge user terbaru ke session storage. |
| Riwayat login multi-device | Done | Backend menyediakan `GET /api/v1/auth/sessions` dan `DELETE /api/v1/auth/sessions/:id`; web `/profile`, web `/dashboard/profile`, dan mobile Profile menampilkan sesi aktif serta bisa mengeluarkan sesi non-current. |
| Delete account self-service | Done | Backend menyediakan `DELETE /api/v1/auth/me`; web `/profile`, web `/dashboard/profile`, dan mobile Profile punya flow self-delete yang menghapus token aktif dan membersihkan sesi lokal. |

## Still Tracked

| Gap | Status | Decision |
| --- | --- | --- |
| App-wide dark theme render penuh | Tracked | Mobile sekarang menyimpan preference tema. Render app-wide butuh theme provider/refactor karena komponen masih memakai `colors` static dari `theme.js`. |
| Achievements/Stats chart-heavy parity | Tracked | Route/key parity sudah pass; web masih lebih kaya layout chart. |
| Offline pack on web | Tracked | Mobile-only capability saat ini; perlu PWA offline decision kalau web harus punya padanan. |
| Admin/dev web-only surface | Intentional | Bukan gap mobile public feature. |
| Jarh Ta'dil IA taxonomy | Intentional for now | Mobile entry terpisah, web tetap lewat Perawi route. |

## Verification Target

- Mobile targeted Jest: profile, auth API, session context.
- Feature parity checker: `node scripts/check-feature-parity.js`.
- Device smoke tetap diperlukan untuk memastikan form security, language preference, offline pack, dan notification behavior berjalan di real device.
