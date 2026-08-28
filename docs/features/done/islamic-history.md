# Islamic History Timeline

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Timeline sejarah Islam dengan tanggal Hijriah dan Masehi, memberikan konteks kronologis peristiwa-peristiwa penting dalam peradaban Islam.

## Scope

- API: `/history`
- Web: `/sejarah`, `/dashboard/sejarah`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/sejarah/page.js`, `apps/web/src/app/dashboard/sejarah/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/history_controller.go

## Source of Truth

- services/api/app/controllers/history_controller.go
- services/api/app/model/history.go
- services/api/app/services/history_service.go

## Details

### API Response Shape

**`GET /history?category=nabi&year=570`**

```json
[
    {
        "id": 1,
        "year_hijri": -53,
        "year_miladi": 570,
        "slug": "tahun-gajah",
        "category": "nabi",
        "is_significant": true,
        "translation": {
            "idn": "Tahun Gajah - Kelahiran Nabi Muhammad",
            "en": "Year of the Elephant - Birth of Prophet Muhammad",
            "ar": "..."
        }
    }
]
```

### Database Model

**`HistoryEvent`** (`model/history.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `year_hijri` | int | Hijri year (negative for pre-Hijrah) |
| `year_miladi` | int | Gregorian year |
| `title` | string | Event title (stored in Translation) |
| `slug` | string | URL-safe; unique |
| `description` | string | Full description (stored in Translation) |
| `category` | HistoryCategory | nabi, khulafa, dinasti, ulama, peristiwa |
| `is_significant` | bool | Major event marker |
| `translation_id` | \*int | FK to Translation |

### Key Frontend Components

- **Web** (`/sejarah`, `/dashboard/sejarah`): Timeline view with century markers; filter by category and century; click event for detail modal
- **Mobile** (`ExploreScreen`): Scrollable timeline with year markers; tap event → bottom-sheet with full description; category pill filters
