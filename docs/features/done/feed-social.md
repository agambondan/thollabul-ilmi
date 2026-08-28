# Feed Sosial

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Feed aktivitas: postingan refleksi berbasis ayat/hadis, likes, dan komentar
sederhana. MVP ini membangun engagement komunitas tanpa mengubah aplikasi
menjadi sosial media penuh.

## Scope

- API: `/feed`, `/comments`
- Web: bagian dari `/dashboard`
- Mobile: `ExploreScreen`

## Evidence

- API routes tersedia untuk list/detail/create/like/delete feed dan
  list/create/delete komentar.
- Mobile `ExploreScreen` menampilkan feed, like, panel komentar, dan form
  komentar.
- Moderation hardening lanjutan dipindah ke
  `docs/features/todo/social-feed-moderation-hardening.md`.

## Source of Truth

- `apps/mobile/src/api/social.js`
- `apps/mobile/src/screens/ExploreScreen.js`
- `services/api/app/controllers/feed_controller.go`
- `services/api/app/controllers/comment_controller.go`

## Details

### API Response Shape

**`GET /feed`**

```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "ref_type": "ayah",
        "ref_id": 1,
        "caption": "Ayat favorit hari ini...",
        "likes": 5,
        "author": {
            "id": "uuid",
            "name": "Ahmad",
            "avatar": "https://...",
            "role": "user"
        }
    }
]
```

### Database Model

**`FeedPost`** (`model/feed.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to User |
| `ref_type` | FeedRefType | ayah or hadith |
| `ref_id` | int | ID of the referenced content |
| `caption` | string | User's reflection text |
| `likes` | int | Like count (denormalized) |
| `author` | \*User | Populated on read |

### Key Frontend Components

- **Web** (bagian dari `/dashboard`): Feed timeline with user posts showing ayat/hadith preview; like button; comment count
- **Mobile** (`ExploreScreen`): Feed list with author avatar, content preview, like/heart button; tap to expand post; comment bottom-sheet with input field
