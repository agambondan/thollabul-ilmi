# Quran Mufrodat

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Kosakata per-kata (mufrodat) untuk setiap ayat Al-Quran dengan terjemahan dan akar kata.

## Scope

- API: /mufrodat
- Web: bagian dari /quran
- Mobile: QuranScreen

## Evidence

- API controller: services/api/app/controllers/mufrodat_controller.go
- Web page: apps/web/src/app/quran/page.js
- Mobile screen: apps/mobile/src/screens/QuranScreen.js

## Source of Truth

- Model: services/api/app/model/mufrodat.go
- Controller: services/api/app/controllers/mufrodat_controller.go
- Service: services/api/app/service/mufrodat_service.go

## Details

### API Response Shape

**`GET /mufrodat?byAyah=1`**

```json
[
    {
        "id": 1,
        "ayah_id": 1,
        "word_index": 1,
        "arabic": "بِسْمِ",
        "transliteration": "bismi",
        "indonesian": "Dengan nama",
        "root_word": "س م و",
        "part_of_speech": "preposition",
        "ayah": { "id": 1, "number": 1 }
    }
]
```

### Database Model

**`Mufrodat`** (`model/mufrodat.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `ayah_id` | *int | FK to Ayah; unique with word_index |
| `word_index` | int | Position in ayah (1-based) |
| `arabic` | string | Arabic word text |
| `transliteration` | string | Latin transliteration |
| `indonesian` | string | Indonesian meaning |
| `root_word` | string | Arabic root (3–4 letters) |
| `part_of_speech` | string | POS tag (noun, verb, particle, etc.) |
| `ayah` | *Ayah | Belongs-to Ayah |

### Key Frontend Components

- **Web** (bagian dari `/quran`): Tap on any word in ayah display → tooltip/popup showing word-by-word translation, transliteration, and root
- **Mobile** (`QuranScreen`): Long-press word → bottom-sheet with mufrodat detail (meaning, root, POS)
