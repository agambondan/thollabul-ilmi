# Tahlil & Yasin

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Bacaan Tahlil dan Yasin terstruktur untuk tahlilan/wirid kematian.

## Scope

- API: `/tahlil`
- Web: `/tahlil`
- Mobile: `IbadahScreen`

## Evidence

- API controller: `services/api/app/controllers/tahlil_controller.go`
- Web page: `apps/web/src/app/tahlil/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/tahlil_controller.go`
- `services/api/app/services/tahlil_service.go`
- `apps/web/src/app/tahlil/`

## Details

### API Response Shape

**`GET /tahlil`**

```json
[
    {
        "id": 1,
        "type": "yasin|tahlil|doa_arwah",
        "title": "Surat Yasin",
        "description": "Bacaan Yasin Fadhillah",
        "items": [
            {
                "id": 1,
                "sort_order": 1,
                "repeat": 1,
                "translation": {
                    "idn": "Dengan nama Allah...",
                    "en": "In the name of Allah...",
                    "ar": "بِسْمِ اللَّهِ...",
                    "title_idn": "Basmalah",
                    "title_en": "Basmalah",
                    "title_ar": "بسملة"
                }
            }
        ]
    }
]
```

### Database Model

**`TahlilCollection`** & **`TahlilItem`** (`model/tahlil.go`)
| Collection Field | Type | Notes |
|------------------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `type` | TahlilType | yasin, tahlil, doa_arwah |
| `title` | string | Collection name |
| `description` | string | Description text |
| `items` | []TahlilItem | Ordered items (has-many) |

| Item Field       | Type           | Notes                                                  |
| ---------------- | -------------- | ------------------------------------------------------ |
| `id`             | int64 (BaseID) | Primary key                                            |
| `collection_id`  | \*int          | FK to parent collection                                |
| `sort_order`     | int            | Display order                                          |
| `repeat`         | int            | Repeat count (default 1)                               |
| `translation_id` | \*int          | FK to Translation; holds arabic, latin, meaning, label |

### Key Frontend Components

- **Web** (`/tahlil`): Collection selector → scrollable arabic text with latin transliteration; auto-scroll with repeat counter
- **Mobile** (`IbadahScreen`): Collection picker → continuous scroll mode with repeat tracking per item
