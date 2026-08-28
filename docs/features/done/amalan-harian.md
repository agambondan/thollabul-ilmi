# Amalan Harian

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Checklist amalan sunnah harian. Membantu pengguna melacak dan membiasakan amalan-amalan sunnah seperti sholat rawatib, puasa sunnah, dzikir pagi/petang, dan amalan lainnya.

## Scope

- API: /amalan
- Web: /amalan, /dashboard/amalan
- Mobile: IbadahScreen

## Evidence

- API: services/api/app/controllers/amalan_controller.go
- Web: apps/web/src/app/amalan/page.js, apps/web/src/app/dashboard/amalan/page.js
- Mobile: apps/mobile/src/screens/IbadahScreen.js

## Source of Truth

- services/api/app/controllers/amalan_controller.go
- apps/web/src/app/amalan/page.js

## Details

### API Response Shape

**`GET /amalan`**

```json
[
    {
        "id": 1,
        "name": "Sholat Dhuha",
        "description": "Sholat sunnah 2 rakaat",
        "category": "sholat",
        "is_active": true,
        "translation": { "idn": "Sholat Dhuha", "en": "Duha Prayer" },
        "is_done": true,
        "log_id": 1
    }
]
```

**`POST /amalan/{id}/toggle`**

```json
{
    "date": "2026-05-13"
}
```

### Database Model

**`AmalanItem`** (`model/amalan.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `name` | string | Amalan name; unique per category |
| `description` | string | Explanation text |
| `category` | AmalanCategory | sholat, puasa, dzikir, sedekah, lainnya |
| `is_active` | bool | Whether the item is currently trackable |
| `translation_id` | \*int | FK to Translation |

**`AmalanLog`** (`model/amalan.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `amalan_item_id` | int | FK to AmalanItem; unique per user+date |
| `date` | string | YYYY-MM-DD |
| `is_done` | bool | Completion status |

### Key Frontend Components

- **Web** (`/amalan`, `/dashboard/amalan`): Checklist grouped by category with toggle switches; progress bar per category; weekly summary table
- **Mobile** (`IbadahScreen`): Category pill scroll → amalan card list with checkbox; one-tap toggle with haptic feedback; daily progress ring
