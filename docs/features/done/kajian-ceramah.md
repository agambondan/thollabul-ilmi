# Kajian & Ceramah

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Kumpulan kajian dan ceramah dalam format video, audio, dan teks yang terorganisir per kategori untuk memudahkan pengguna mencari dan mengakses konten keislaman.

## Scope

- API: `/kajian`
- Web: `/kajian`, `/dashboard/kajian`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/kajian/page.js`, `apps/web/src/app/dashboard/kajian/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/kajian_controller.go

## Source of Truth

- services/api/app/controllers/kajian_controller.go
- services/api/app/model/kajian.go
- services/api/app/services/kajian_service.go

## Details

### API Response Shape

**`GET /kajian?topic=tauhid`**

```json
[
    {
        "id": 1,
        "title": "Tauhid dalam Kehidupan",
        "description": "Kajian tentang penerapan tauhid...",
        "speaker": "Ustadz Abdul Somad",
        "topic": "tauhid",
        "type": "video",
        "url": "https://youtube.com/watch?v=...",
        "duration_seconds": 3600,
        "thumbnail_url": "https://...",
        "view_count": 15000,
        "published_at": "2026-01-15",
        "translation": {
            "idn": "Tauhid dalam Kehidupan",
            "en": "Tawhid in Daily Life"
        }
    }
]
```

### Database Model

**`Kajian`** (`model/kajian.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `title` | string | Kajian title |
| `description` | string | Short description |
| `speaker` | string | Speaker name; indexed |
| `topic` | string | Topic/category; indexed |
| `type` | KajianType | video, audio, or text |
| `url` | string | Content URL |
| `duration_seconds` | int | Duration in seconds |
| `thumbnail_url` | string | Thumbnail image URL |
| `view_count` | int | View counter |
| `published_at` | string | Publication date |
| `translation_id` | \*int | FK to Translation |

### Key Frontend Components

- **Web** (`/kajian`, `/dashboard/kajian`): Grid/card view with type badge (video/audio/text); filter by topic and speaker; search bar; detail page with embedded player
- **Mobile** (`ExploreScreen`): Card list with thumbnail and duration; filter chips by topic; tap to open external player or in-app viewer
