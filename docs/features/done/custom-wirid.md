# Custom Wirid

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Wirid kustom user: CRUD preset pribadi, membaca wirid, dan menghitung tasbih interaktif.

## Scope

- API: `/user-wird`
- Web: `/wirid-custom`, `/dashboard/wirid-custom`
- Mobile: `IbadahScreen` navigation dan `ExploreScreen` detail/form

## Evidence

- API: `services/api/app/controllers/user_wird_controller.go`
- Web: `apps/web/src/app/wirid-custom/`, `apps/web/src/app/dashboard/wirid-custom/`
- Mobile: `apps/mobile/src/screens/IbadahScreen.js`, `apps/mobile/src/screens/ExploreScreen.js`

## Source of Truth

- `services/api/app/controllers/user_wird_controller.go`
- `services/api/app/services/user_wird_service.go`
- `services/api/app/model/user_wird.go`

## Details

### API Response Shape

**`GET /user-wird`**

```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "title": "Wirid Pribadi Saya",
        "arabic": "سُبْحَانَ اللَّهِ",
        "transliteration": "Subhanallah",
        "translation": "Maha Suci Allah",
        "source": "HR. Muslim",
        "count": 33,
        "occasion": "pagi",
        "note": "Dibaca setelah sholat subuh"
    }
]
```

### Database Model

**`UserWird`** (`model/user_wird.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user (personal, not shared) |
| `title` | string | Wirid title |
| `arabic` | string | Arabic text |
| `transliteration` | string | Latin transliteration |
| `translation` | string | Meaning in user language |
| `source` | string | Reference source |
| `count` | int | Target repeat count |
| `occasion` | string | Contextual tag (pagi, petang, etc.) |
| `note` | string | Personal notes |

### Key Frontend Components

- **Web** (`/wirid-custom`, `/dashboard/wirid-custom`): CRUD form for custom wirid; list view with edit/delete; integrated counter with target badge
- **Mobile** (`IbadahScreen`, `ExploreScreen`): Custom wirid tab with personal list; tap to start counting (like tasbih digital); edit form in bottom-sheet
