# Quran Reader

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Baca Quran dengan choice display mode, multi font, tajweed, audio murotal per ayat, bookmark, tafsir, asbabun nuzul, mufrodat.

## Scope

- API: /surah, /ayah, /juz, /tafsir, /asbabun-nuzul, /audio, /mufrodat
- Web: /quran, /quran/page-mushaf, /tafsir, /asbabun-nuzul
- Mobile: QuranScreen

## Evidence

- API controller: services/api/app/controllers/quran_controller.go
- Web page: apps/web/src/app/quran/page.js
- Mobile screen: apps/mobile/src/screens/QuranScreen.js

## Source of Truth

- Model: services/api/app/model/quran.go
- Controller: services/api/app/controllers/quran_controller.go
- Service: services/api/app/service/quran_service.go

## Details

### API Response Shape

**`GET /surah`**

```json
[
    {
        "id": 1,
        "slug": "al-fatihah",
        "identifier": "Al-Fatihah",
        "number": 1,
        "number_of_ayahs": 7,
        "revelation_type": "makkiyah",
        "default_language": "Ar",
        "translation": {
            "idn": "Pembukaan",
            "en": "The Opening",
            "ar": "الفاتحة"
        },
        "next_surah": { "id": 2, "number": 2 },
        "prev_surah": null,
        "media": [{ "id": 1, "multimedia": { "url": "..." } }]
    }
]
```

**`GET /ayah?bySurah=1`**

```json
{
    "surah": { "id": 1, "number": 1 },
    "ayahs": [
        {
            "id": 1,
            "number": 1,
            "surah_id": 1,
            "juz_number": 1,
            "manzil": 1,
            "page": 1,
            "ruku": 1,
            "hizb_quarter": 1,
            "sajda": false,
            "translation": {
                "ar": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                "idn": "Dengan nama Allah...",
                "en": "In the name of Allah..."
            }
        }
    ],
    "total": 7
}
```

**`GET /juz`** — List all 30 juz.

### Database Model

**`Surah`** (`model/surah.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `slug` | *string | URL-friendly identifier |
| `identifier` | *string | Arabic name |
| `number` | *int | Surah number (1–114), unique |
| `number_of_ayahs` | *int | Total verses |
| `revelation_type` | *string | makkiyah / madaniyah |
| `default_language` | *string | Default "Ar" |
| `translation_id` | *int | FK to Translation |
| `ayahs` | []*Ayah | Has-many verses |
| `media` | []SurahAsset | Associated multimedia |

**`Ayah`** (`model/ayah.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `number` | *int | Ayah number within surah |
| `surah_id` | *int | FK to Surah |
| `juz_number` | *int | Juz this ayah belongs to |
| `page` | *int | Page number in standard mushaf |
| `ruku` | *int | Ruku grouping |
| `hizb_quarter` | *int | Hizb subdivision |
| `sajda` | *bool | Sajda tilawah marker |
| `translation` | *Translation | Arabic + bilingual content |

**`Juz`** (`model/juz.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `number` | *int | Juz number (1–30) |
| `total_ayah` | *int | Total ayah in this juz |
| `start_surah_id` | *int | FK to first Surah |
| `end_surah_id` | *int | FK to last Surah |
| `start_ayah_id` | *int | FK to first Ayah |
| `end_ayah_id` | *int | FK to last Ayah |

### Key Frontend Components

- **Web** (`/quran`, `/quran/page-mushaf`): Surah list → ayah display with multiple view modes (page-mushaf, list, tafsir side-panel); font & tajweed toggle
- **Mobile** (`QuranScreen`): Surah selector → infinite scroll ayah list with bottom-sheet for tafsir/mufrodat/audio
