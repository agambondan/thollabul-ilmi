# Notes & Catatan

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Catatan pribadi yang bisa me-reference ayat atau hadith. Pengguna dapat membuat catatan belajar, tafsir pribadi, atau refleksi yang tertaut langsung ke konten Al-Quran dan Hadith.

## Scope

- API: /notes
- Web: /notes, /dashboard/notes
- Mobile: NotesPanel komponen

## Evidence

- API: services/api/app/controllers/note_controller.go
- Web: apps/web/src/app/notes/page.js, apps/web/src/app/dashboard/notes/page.js
- Mobile: apps/mobile/src/components/NotesPanel.js

## Source of Truth

- services/api/app/controllers/note_controller.go
- apps/web/src/app/notes/page.js

## Details

### API Response Shape

**`GET /notes?refType=ayah&refId=1`**

```json
[
    {
        "id": 1,
        "user_id": "uuid",
        "ref_type": "ayah",
        "ref_id": 1,
        "content": "Catatan pribadi tentang ayat ini..."
    }
]
```

### Database Model

**`Note`** (`model/note.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `ref_type` | NoteRefType | ayah or hadith |
| `ref_id` | int | ID of the referenced content |
| `content` | string | Note text (max 5000 chars) |

### Key Frontend Components

- **Web** (`/notes`, `/dashboard/notes`): Note list grouped by reference; inline note editor on Quran/Hadith pages; CRUD with confirmation
- **Mobile** (`NotesPanel`): Bottom-sheet note editor on content screens; note indicator icon on bookmarked/referenced ayat; notes feed in profile
