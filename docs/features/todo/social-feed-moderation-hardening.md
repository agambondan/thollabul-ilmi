# Social Feed Moderation Hardening

Status: `IN_PROGRESS`
Priority: `P2`
Tanggal: `2026-05-14`

## Objective

Melanjutkan Social Feed yang sudah MVP dengan guardrail moderasi ringan, tanpa
mengubah aplikasi menjadi sosial media penuh.

## Scope

- Mobile:
  - report/hide minimal pada post atau komentar.
  - state empty/error yang jelas saat konten disembunyikan.
- API:
  - endpoint report/hide atau status moderasi minimal.
  - pembatasan agar user hanya menghapus/mengubah konten miliknya sendiri.
- Data:
  - konten user tetap personal/komunitas dan tidak bercampur dengan konten ilmu
    global.

## Current Baseline

MVP feed sudah tersedia melalui `/feed`, `/comments`, like, dan komentar. Mobile
menampilkan feed di `ExploreScreen`, sedangkan API sudah punya controller,
service, repository, dan model feed/comment.

## Task List

1. `DONE` Desain kontrak report/hide minimal.
2. `DONE` Tambah API moderation baseline.
3. `DONE` Tambah aksi report/hide pada mobile feed detail.
4. `DONE` Verifikasi hak akses delete/report backend.

## Acceptance Criteria

- user bisa report atau hide konten yang mengganggu.
- feed tetap tidak mengganggu jalur utama Quran, Hadis, dan Ibadah.
- moderation baseline tersedia sebelum feed diperluas.

## Evidence

- 2026-05-18:
  - Mobile: Added `hideFeedPost` / `reportFeedPost` API functions di `apps/mobile/src/api/social.js`
  - Mobile: Added `Sembunyikan` (EyeOff) dan `Laporkan` (Flag) ActionPill buttons di setiap feed item, hanya tampil saat user login
  - Mobile: Handle hide → hapus item dari list + show success; handle report → show success tanpa hapus
  - Guardrail: handler cek `session?.token` sebelum mengizinkan aksi (guest tidak melihat tombol)
  - Validasi: Go build + web build + 575 mobile tests pass
- 2026-05-16:
  - Model `SocialModerationAction` ditambahkan untuk menyimpan aksi per user:
    target `feed_post`/`comment`, action `hide`/`report`, `target_id`, dan
    `reason`.
  - Endpoint baru:
    - `POST /feed/:id/hide`
    - `POST /feed/:id/report`
    - `POST /comments/:id/hide`
    - `POST /comments/:id/report`
  - List feed/comment akan mengecualikan item yang disembunyikan user saat
    request membawa JWT valid, tanpa mengubah pengalaman public anonymous.
  - Delete comment sekarang mengikuti guardrail feed: owner bisa delete item
    sendiri, admin bisa delete item mana pun, user lain mendapat forbidden.
  - Validasi compile: `cd services/api && go build ./app/model ./app/repository
    ./app/services ./app/controllers ./app/http` `PASS`.
  - Mobile action belum dikerjakan di slice ini karena `ExploreScreen.js` sedang
    dirty milik agent lain.

## Source of Truth

- `docs/features/done/feed-social.md`
- `apps/mobile/src/screens/ExploreScreen.js`
- `apps/mobile/src/api/social.js`
- `services/api/app/controllers/feed_controller.go`
- `services/api/app/controllers/comment_controller.go`
