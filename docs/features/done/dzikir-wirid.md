# Dzikir & Wirid

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Baca & amalkan dzikir pagi/petang dan wirid based on occasion, dengan dzikir log harian.

## Scope

- API: `/dzikir`, `/dzikir/log`, `/wirid/occasion/:occasion`
- Web: `/dzikir`, `/wirid`, `/dashboard/dzikir`
- Mobile: `IbadahScreen`

## Evidence

- API controller: `services/api/app/controllers/dzikir_controller.go`, `services/api/app/controllers/wirid_controller.go`
- Web page: `apps/web/src/app/dzikir/page.js`, `apps/web/src/app/wirid/page.js`, `apps/web/src/app/dashboard/dzikir/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/dzikir_controller.go`
- `services/api/app/controllers/dzikir_controller.go`
- `services/api/app/services/dzikir_service.go`
- `apps/web/src/app/dzikir/`
- `apps/web/src/app/wirid/`

## Details

### API Response Shape

**`GET /dzikir`**

```json
[
    {
        "id": 1,
        "category": "pagi|petang|setelah_sholat|tidur|safar|dzikir_umum",
        "occasion": "setelah subuh",
        "count": 33,
        "fadhilah_idn": "Keutamaannya...",
        "fadhilah_en": "The virtue...",
        "source": "HR. Bukhari",
        "audio_url": "https://...",
        "translation": {
            "idn": "Maha Suci Allah",
            "en": "Glory be to Allah",
            "ar": "سبحان الله",
            "title_idn": "Tasbih",
            "title_en": "Tasbih",
            "title_ar": "تسبيح"
        }
    }
]
```

**`POST /dzikir/log`**

```json
{
    "dzikir_id": 1,
    "log_date": "2026-05-13"
}
```

### Database Model

**`Dzikir`** (`model/dzikir.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `category` | DzikirCategory | pagi, petang, setelah_sholat, tidur, safar, dzikir_umum |
| `occasion` | string | Optional contextual tag (e.g. "setelah subuh") |
| `count` | int | Target repeat count (default 1) |
| `fadhilah_idn` | string | Virtue description in Indonesian |
| `fadhilah_en` | string | Virtue description in English |
| `source` | string | Hadith reference |
| `audio_url` | string | Optional audio |
| `translation_id` | \*int | FK to Translation |

**`DzikirLog`** (`model/dzikir_log.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user |
| `dzikir_id` | int | FK to Dzikir |
| `log_date` | string | YYYY-MM-DD format |
| `category` | DzikirCategory | Denormalized for query speed |

### Key Frontend Components

- **Web** (`/dzikir`, `/wirid`, `/dashboard/dzikir`): Category tabs, dzikir card with arabic + count badge, one-tap log button
- **Mobile** (`IbadahScreen`): Category-pill scroll → dzikir list → tap to inc counter → auto-log on target reached
