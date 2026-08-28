# Manasik Haji & Umrah

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Panduan step-by-step manasik haji dan umrah yang interaktif, membantu pengguna memahami tata cara ibadah haji dan umrah dengan benar.

## Scope

- API: `/manasik`
- Web: `/manasik`, `/dashboard/manasik`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/manasik/page.js`, `apps/web/src/app/dashboard/manasik/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/manasik_controller.go

## Source of Truth

- services/api/app/controllers/manasik_controller.go
- services/api/app/model/manasik.go
- services/api/app/services/manasik_service.go

## Details

### API Response Shape

**`GET /manasik?type=haji`**

```json
[
    {
        "id": 1,
        "type": "haji",
        "step_order": 1,
        "description": "Miqat",
        "arab": "...",
        "transliteration": "...",
        "translation": {
            "idn": "Niat ihram dari miqat",
            "en": "Ihram intention from miqat"
        },
        "notes": "Miqat zamani dan makani...",
        "is_wajib": true
    }
]
```

### Database Model

**`ManasikStep`** (`model/manasik.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `type` | ManasikType | haji or umrah |
| `step_order` | int | Sequence number; unique per type |
| `title` | string | Step title (stored in Translation) |
| `description` | string | Guidance text |
| `arabic` | string | Arabic prayer text |
| `transliteration` | string | Latin transliteration |
| `translation_text` | string | Meaning in user language |
| `notes` | string | Additional notes |
| `is_wajib` | bool | Whether this step is obligatory |
| `translation_id` | \*int | FK to Translation |

### Key Frontend Components

- **Web** (`/manasik`, `/dashboard/manasik`): Step-by-step wizard with progress bar; type switcher (haji/umrah); checklist with completion tracking; download PDF summary
- **Mobile** (`ExploreScreen`): Swipeable step cards with arabic + transliteration + meaning; checkmark per step; compact summary view for on-site reference
