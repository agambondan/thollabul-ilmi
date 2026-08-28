# Dictionary & Kamus Istilah Islami

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Kamus istilah Islami yang searchable per kategori, membantu pengguna memahami istilah-istilah Arab dan Islami yang sering muncul dalam konten aplikasi.

## Scope

- API: `/dictionary`
- Web: `/kamus`, `/dashboard/kamus`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/kamus/page.js`, `apps/web/src/app/dashboard/kamus/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/dictionary_controller.go

## Source of Truth

- services/api/app/controllers/dictionary_controller.go
- services/api/app/model/dictionary.go
- services/api/app/services/dictionary_service.go

## Details

### API Response Shape

**`GET /dictionary?category=fiqh`**

```json
[
    {
        "id": 1,
        "term": "Wudhu",
        "category": "fiqh",
        "definition": "Wudhu adalah bersuci dengan air...",
        "example": "Rasulullah SAW bersabda: 'Tidak diterima sholat tanpa wudhu'",
        "source": "Minhajul Muslim",
        "origin": "Arab",
        "translation": { "idn": "Wudhu", "en": "Ablution", "ar": "الوضوء" }
    }
]
```

### Database Model

**`IslamicTerm`** (`model/dictionary.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `term` | string | Term in original language; unique |
| `category` | TermCategory | fiqh, aqidah, tasawuf, ulumul_quran, hadith, lainnya |
| `definition` | string | Full definition text |
| `example` | string | Usage example |
| `source` | string | Reference source |
| `origin` | string | Language of origin |
| `translation_id` | \*int | FK to Translation |

### Key Frontend Components

- **Web** (`/kamus`, `/dashboard/kamus`): Search bar with autocomplete; category filter chips; term detail card with definition, example, and source
- **Mobile** (`ExploreScreen`): Searchable term list; category filter; tap term → bottom-sheet with full definition and example
