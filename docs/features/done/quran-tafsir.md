# Quran Tafsir

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Tafsir ayat dari berbagai mufassir, bisa diakses per ayat.

## Scope

- API: /tafsir
- Web: /tafsir
- Mobile: Detail dari QuranScreen

## Evidence

- API controller: services/api/app/controllers/tafsir_controller.go
- Web page: apps/web/src/app/tafsir/page.js
- Mobile screen: apps/mobile/src/screens/QuranScreen.js

## Source of Truth

- Model: services/api/app/model/tafsir.go
- Controller: services/api/app/controllers/tafsir_controller.go
- Service: services/api/app/service/tafsir_service.go

## Details

### API Response Shape

**`GET /tafsir?byAyah=1`**

```json
{
    "id": 1,
    "ayah_id": 1,
    "kemenag": { "idn": "Tafsir Kemenag: ...", "en": "..." },
    "ibnu_katsir": { "idn": "Tafsir Ibnu Katsir: ...", "en": "..." },
    "ayah": { "id": 1, "number": 1, "surah_id": 1 }
}
```

### Database Model

**`Tafsir`** (`model/tafsir.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `ayah_id` | *int | FK to Ayah (unique) |
| `kemenag_translation_id` | *int | FK to Translation (Kemenag tafsir) |
| `ibnu_katsir_translation_id` | *int | FK to Translation (Ibnu Katsir tafsir) |
| `kemenag` | Translation | Embedded Kemenag tafsir content |
| `ibnu_katsir` | Translation | Embedded Ibnu Katsir tafsir content |
| `ayah` | *Ayah | Belongs-to Ayah |

### Key Frontend Components

- **Web** (`/tafsir`): Ayah selector → tafsir panel showing selected mufassir; tab switch between Kemenag and Ibnu Katsir
- **Mobile** (Detail dari `QuranScreen`): Bottom-sheet from ayah tap → tafsir tab view with mufassir picker
