# Fiqh Ringkas

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Fiqh ringkas per kategori (thaharah, sholat, puasa, zakat, haji, muamalah) sebagai referensi cepat hukum-hukum Islam sehari-hari.

## Scope

- API: `/fiqh`
- Web: `/fiqh`, `/dashboard/fiqh`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/fiqh/page.js`, `apps/web/src/app/dashboard/fiqh/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/fiqh_controller.go

## Source of Truth

- services/api/app/controllers/fiqh_controller.go
- services/api/app/model/fiqh.go
- services/api/app/services/fiqh_service.go

## Details

### API Response Shape

**`GET /fiqh`**

```json
[
    {
        "id": 1,
        "name": "Thaharah",
        "slug": "thaharah",
        "description": "Hukum-hukum tentang bersuci",
        "translation": { "idn": "Thaharah", "en": "Purification" },
        "items": [
            {
                "id": 1,
                "category_id": 1,
                "title": "Wudhu",
                "slug": "wudhu",
                "content": "Wudhu adalah bersuci dengan air...",
                "source": "Minhajul Muslim",
                "dalil": "QS. Al-Maidah: 6",
                "sort_order": 1,
                "translation": { "idn": "Wudhu", "en": "Ablution" }
            }
        ]
    }
]
```

### Database Model

**`FiqhCategory`** (`model/fiqh.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `name` | string | Category name |
| `slug` | string | URL-safe; unique |
| `description` | string | Brief description |
| `items` | []FiqhItem | Has-many fiqh items |
| `translation_id` | \*int | FK to Translation |

**`FiqhItem`** (`model/fiqh.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `category_id` | *int | FK to FiqhCategory |
| `title` | string | Item title |
| `slug` | string | URL-safe; unique |
| `content` | string | Full fiqh explanation |
| `source` | string | Reference source |
| `dalil` | string | Quran/Hadith evidence |
| `sort_order` | int | Display ordering |
| `translation_id` | *int | FK to Translation |

### Key Frontend Components

- **Web** (`/fiqh`, `/dashboard/fiqh`): Category sidebar → item list with search; content view with dalil citation cards
- **Mobile** (`ExploreScreen`): Category chips → item list → detail page with source reference; bookmarkable per item
