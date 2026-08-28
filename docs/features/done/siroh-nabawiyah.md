# Siroh Nabawiyah

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Menyediakan bacaan siroh nabi Muhammad SAW yang terstruktur per kategori, memudahkan pengguna mempelajari sejarah kehidupan Rasulullah secara bertahap.

## Scope

- API: `/siroh`
- Web: `/siroh`, `/dashboard/siroh`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/siroh/page.js`, `apps/web/src/app/dashboard/siroh/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/siroh_controller.go

## Source of Truth

- services/api/app/controllers/siroh_controller.go
- services/api/app/model/siroh.go
- services/api/app/services/siroh_service.go

## Details

### API Response Shape

**`GET /siroh`**

```json
[
    {
        "id": 1,
        "title": "Kelahiran Nabi",
        "slug": "kelahiran-nabi",
        "order": 1,
        "translation": {
            "idn": "Kelahiran Nabi",
            "en": "The Birth of the Prophet",
            "ar": "..."
        },
        "contents": [
            {
                "id": 1,
                "category_id": 1,
                "title": "Masa Pra-Kelahiran",
                "slug": "masa-pra-kelahiran",
                "content": "...",
                "order": 1,
                "translation": { "idn": "...", "en": "..." }
            }
        ]
    }
]
```

### Database Model

**`SirohCategory`** (`model/siroh.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `title` | string | Category title |
| `slug` | string | URL-safe; unique |
| `order` | int | Display order |
| `contents` | []SirohContent | Has-many content items |
| `translation_id` | \*int | FK to Translation |

**`SirohContent`** (`model/siroh.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `category_id` | *int | FK to SirohCategory |
| `title` | string | Content title |
| `slug` | string | URL-safe; unique |
| `content` | string | Full text content |
| `order` | int | Display order |
| `translation_id` | *int | FK to Translation |

### Key Frontend Components

- **Web** (`/siroh`, `/dashboard/siroh`): Category accordion → content list with progress indicators; reading view with next/prev navigation
- **Mobile** (`ExploreScreen`): Category card list → content detail screen with scrollable text; bookmark per content
