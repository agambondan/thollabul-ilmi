# Quran Asbabun Nuzul

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Sebab-sebab turun ayat, terkait langsung dengan tafsir.

## Scope

- API: /asbabun-nuzul
- Web: /asbabun-nuzul
- Mobile: Modal dari QuranScreen

## Evidence

- API controller: services/api/app/controllers/asbabun_nuzul_controller.go
- Web page: apps/web/src/app/asbabun-nuzul/page.js
- Mobile screen: apps/mobile/src/screens/QuranScreen.js

## Source of Truth

- Model: services/api/app/model/asbabun_nuzul.go
- Controller: services/api/app/controllers/asbabun_nuzul_controller.go
- Service: services/api/app/service/asbabun_nuzul_service.go

## Details

### API Response Shape

**`GET /asbabun-nuzul?byAyah=1`**

```json
[
    {
        "id": 1,
        "title": "Turunnya Surat Al-Fatihah",
        "narrator": "Ibnu Abbas",
        "content": "Riwayat tentang turunnya surat Al-Fatihah...",
        "source": "HR. Tirmidzi",
        "display_ref": "QS. 1:1-7",
        "translation": {
            "idn": "Sebab turun...",
            "en": "Reason for revelation..."
        },
        "ayahs": [
            { "id": 1, "number": 1, "surah_id": 1 },
            { "id": 7, "number": 7, "surah_id": 1 }
        ]
    }
]
```

### Database Model

**`AsbabunNuzul`** (`model/asbabun_nuzul.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `title` | string | Short title of the narration |
| `narrator` | string | Name of narrator/source |
| `content` | string | Full narration text |
| `source` | string | Source book reference |
| `display_ref` | string | Readable ayah range |
| `translation_id` | \*int | FK to Translation |
| `ayahs` | []Ayah | Many-to-many with Ayah |

### Key Frontend Components

- **Web** (`/asbabun-nuzul`): Ayah selector → list of asbab narrations with narrator badge and source reference
- **Mobile** (Modal dari `QuranScreen`): Bottom-sheet triggered from tafsir view → scrollable narration list with source attribution
