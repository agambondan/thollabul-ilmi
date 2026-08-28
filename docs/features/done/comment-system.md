# Comment System

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Sistem komentar untuk blog, hadith, dan konten lainnya dengan threading, likes, dan moderasi.

## Scope

- API: `/comments`
- Web: bagian dari `/blog`, `/hadith`
- Mobile: `ExploreScreen`

## Evidence

- API: `services/api/app/controllers/comment_controller.go`
- Web: `apps/web/src/components/CommentSection.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

## Source of Truth

- `services/api/app/model/Comment.go`
- `services/api/app/controllers/comment_controller.go`

## Details

### API Response Shape

**`GET /comments?refType=ayah&refId=1`**

```json
[
    {
        "id": 1,
        "user_id": "uuid",
        "ref_type": "ayah",
        "ref_id": 1,
        "content": "Subhanallah, ayat yang sangat dalam...",
        "parent_id": null,
        "like_count": 3,
        "replies": [
            {
                "id": 2,
                "user_id": "uuid",
                "content": "Betul, ini ayat favorit saya",
                "parent_id": 1,
                "like_count": 1
            }
        ],
        "username": "Ahmad"
    }
]
```

### Database Model

**`Comment`** (`model/comment.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to User |
| `ref_type` | CommentRefType | ayah or hadith |
| `ref_id` | int | ID of the referenced content |
| `content` | string | Comment text |
| `parent_id` | \*int | FK to parent Comment (for threading) |
| `like_count` | int | Denormalized like count |
| `replies` | []Comment | Has-many child comments |
| `username` | string | Populated on read (not stored) |

### Key Frontend Components

- **Web** (`CommentSection` in `/blog`, `/hadith`): Threaded comment list with indent levels; reply button → inline form; like button per comment; moderation controls for admin
- **Mobile** (`ExploreScreen`): Comment count badge on posts; tap to expand thread; comment form bottom-sheet; swipe to reply
