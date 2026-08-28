# Doa Collections

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Baca & cari kumpulan doa sehari-hari per kategori (pagi, petang, makan, tidur, safar, dll).

## Scope

- API: `/doa`
- Web: `/doa`, `/dashboard/doa`
- Mobile: `IbadahScreen` → sub-view

## Evidence

- API controller: `services/api/app/controllers/doa_controller.go`
- Web page: `apps/web/src/app/doa/page.js`, `apps/web/src/app/dashboard/doa/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/doa_controller.go`
- `services/api/app/services/doa_service.go`
- `apps/web/src/app/doa/`
- `apps/mobile/src/screens/`

## Details

### API Response Shape

```json
{
    "id": 1,
    "category": "pagi|petang|makan|tidur|bangun|kamar_mandi|masjid|safar|belajar|umum",
    "source": "HR. Muslim no. 123",
    "audio_url": "https://...",
    "translation": {
        "idn": "Ya Allah...",
        "en": "O Allah...",
        "ar": "اللهم...",
        "title_idn": "Doa Pagi",
        "title_en": "Morning Prayer",
        "title_ar": "دعاء الصباح"
    }
}
```

### Database Model

**`Doa`** (`model/doa.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `category` | DoaCategory | Enum: pagi, petang, makan, tidur, bangun, kamar_mandi, masjid, safar, belajar, umum |
| `title` | string | Hidden from JSON; stored in Translation |
| `source` | string | Hadith reference |
| `audio_url` | string | Optional audio recitation |
| `translation_id` | *int | FK to Translation; holds all bilingual content |
| `translation` | *Translation | Embedded: idn, en, ar, title_idn, title_en, title_ar |

### Key Frontend Components

- **Web** (`/doa`, `/dashboard/doa`): Category tab picker → list with expand/collapse showing arabic, latin, meaning
- **Mobile** (`IbadahScreen`): Category selector → bottom-sheet detail per doa
