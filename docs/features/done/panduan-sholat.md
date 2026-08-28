# Panduan Sholat

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Panduan sholat step-by-step: syarat, rukun, sunnah, baca'an, gerakan.

## Scope

- API: `/panduan-sholat` (dari `/sholat` controller)
- Web: `/panduan-sholat`, `/dashboard/panduan-sholat`
- Mobile: `IbadahScreen`

## Evidence

- API controller: `services/api/app/controllers/sholat_controller.go`
- Web page: `apps/web/src/app/panduan-sholat/page.js`, `apps/web/src/app/dashboard/panduan-sholat/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/sholat_controller.go`
- `services/api/app/services/panduan-sholat_service.go`
- `apps/web/src/app/panduan-sholat/`

## Details

### API Response Shape

**`GET /panduan-sholat`**

```json
[
    {
        "id": 1,
        "step": 1,
        "description": "Berdiri tegak menghadap kiblat",
        "source": "HR. Bukhari",
        "notes": "Bagi yang mampu berdiri",
        "translation": {
            "idn": "Niat Sholat",
            "en": "Prayer Intention",
            "ar": "نَوَيْتُ...",
            "title_idn": "Niat",
            "title_en": "Intention"
        }
    }
]
```

### Database Model

**`SholatGuide`** (`model/sholat.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `step` | int | Sequential order (unique) |
| `description` | string | Guidance text in Indonesian |
| `source` | string | Reference (Quran/Hadith) |
| `notes` | string | Additional notes |
| `translation_id` | \*int | FK to Translation; holds arabic, latin, meaning |

### Key Frontend Components

- **Web** (`/panduan-sholat`, `/dashboard/panduan-sholat`): Step-by-step wizard with progress bar; category filter (syarat/rukun/sunnah)
- **Mobile** (`IbadahScreen`): Swipeable step cards with arabic + latin + meaning
