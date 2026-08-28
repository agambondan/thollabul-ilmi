# Global Search

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Pencarian full-text di seluruh konten (Quran, Hadith, Doa, dll) dengan filter.

## Scope

- API: /search endpoint (built-in via controller logic)
- Web: /search
- Mobile: GlobalSearchScreen

## Evidence

- API controller: services/api/app/controllers/search_controller.go
- Web page: apps/web/src/app/search/page.js
- Mobile screen: apps/mobile/src/screens/GlobalSearchScreen.js

## Source of Truth

- Model: services/api/app/model/search.go
- Controller: services/api/app/controllers/search_controller.go
- Service: services/api/app/service/search_service.go

## Details

### API Response Shape

**`GET /search?q=rahman&type=all`**

```json
{
    "ayahs": [
        {
            "id": 1,
            "number": 1,
            "surah_id": 1,
            "translation": { "ar": "...", "idn": "..." }
        }
    ],
    "ayah_total": 10,
    "hadiths": [
        { "id": 1, "number": 1, "book_id": 1, "translation": { "idn": "..." } }
    ],
    "hadith_total": 5,
    "dictionaries": [{ "id": 1, "term": "Rahman", "definition": "..." }],
    "dictionary_total": 2,
    "doas": [{ "id": 1, "category": "umum", "translation": { "idn": "..." } }],
    "doa_total": 3,
    "kajians": [{ "id": 1, "title": "Kajian...", "speaker": "Ustadz..." }],
    "kajian_total": 4,
    "perawis": [{ "id": 1, "nama_latin": "Abu Hurairah" }],
    "perawi_total": 1,
    "total": 25
}
```

### API Parameters

| Param   | Type   | Default  | Notes                                                         |
| ------- | ------ | -------- | ------------------------------------------------------------- |
| `q`     | string | required | Search query                                                  |
| `type`  | string | "all"    | Filter: ayah, hadith, dictionary, doa, kajian, perawi, or all |
| `limit` | int    | 20       | Results per page (max 100)                                    |
| `page`  | int    | 0        | Page offset (0-indexed)                                       |

### Database Model

**`SearchResult`** (`services/search_service.go`)
| Field | Type | Notes |
|-------|------|-------|
| `ayahs` | []Ayah | Matching Quran verses |
| `ayah_total` | int64 | Total ayah matches |
| `hadiths` | []Hadith | Matching hadiths |
| `hadith_total` | int64 | Total hadith matches |
| `dictionaries` | []IslamicTerm | Matching dictionary terms |
| `dictionary_total` | int64 | Total dictionary matches |
| `doas` | []Doa | Matching doa |
| `doa_total` | int64 | Total doa matches |
| `kajians` | []Kajian | Matching kajian |
| `kajian_total` | int64 | Total kajian matches |
| `perawis` | []Perawi | Matching perawi narrators |
| `perawi_total` | int64 | Total perawi matches |
| `total` | int | Grand total across all types |

### Key Frontend Components

- **Web** (`/search`): Search bar with type filter chips → results grouped by content type with tab switching; highlighted query in result snippets
- **Mobile** (`GlobalSearchScreen`): Search input with debounce → categorized result list (ayah/hadith/doa rows); tap to navigate to source screen
