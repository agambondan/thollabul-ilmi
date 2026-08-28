# Asmaul Husna

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

99 Nama Allah dengan makna, audio.

## Scope

- API: `/asmaul-husna`
- Web: `/asmaul-husna`, `/dashboard/asmaul-husna`
- Mobile: `ExploreScreen`

## Evidence

- API controller: `services/api/app/controllers/asmaul_husna_controller.go`
- Web page: `apps/web/src/app/asmaul-husna/page.js`, `apps/web/src/app/dashboard/asmaul-husna/page.js`
- Mobile screen: `apps/mobile/src/screens/ExploreScreen.js`

## Source of Truth

- `services/api/app/controllers/asmaul_husna_controller.go`
- `services/api/app/services/asmaul_husna_service.go`
- `apps/web/src/app/asmaul-husna/`

## Details

### API Response Shape

```json
[
    {
        "id": 1,
        "number": 1,
        "arabic": "الرَّحْمَٰنُ",
        "transliteration": "Ar-Rahman",
        "indonesian": "Yang Maha Pengasih",
        "english": "The Most Gracious",
        "meaning": "Allah yang memiliki kasih sayang yang luas...",
        "audio_url": "https://..."
    }
]
```

### Database Model

**`AsmaUlHusna`** (`model/asmaul_husna.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `number` | int | 1–99, unique |
| `arabic` | string | Arabic name script |
| `transliteration` | string | Latin transliteration |
| `indonesian` | string | Indonesian translation |
| `english` | string | English translation |
| `meaning` | string | Extended meaning/explanation |
| `audio_url` | string | Audio recitation URL |
| `translation_id` | \*int | FK to Translation (uniform pattern) |

### Key Frontend Components

- **Web** (`/asmaul-husna`, `/dashboard/asmaul-husna`): Numbered grid/card list with search; tap to play audio; detail modal with meaning
- **Mobile** (`ExploreScreen`): Scrollable 99-list with favorites bookmark; audio player per item
