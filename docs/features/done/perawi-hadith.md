# Perawi Hadith

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Database perawi/narrator hadith dengan biografi, tabaqah, guru-murid, dan status jarh wa ta'dil.

## Scope

- API: /perawi, /jarh-tadil
- Web: /perawi
- Mobile: HadithScreen (tab perawi)

## Evidence

- API controller: services/api/app/controllers/perawi_controller.go
- Web page: apps/web/src/app/perawi/page.js
- Mobile screen: apps/mobile/src/screens/HadithScreen.js

## Source of Truth

- Model: services/api/app/model/perawi.go
- Controller: services/api/app/controllers/perawi_controller.go
- Service: services/api/app/service/perawi_service.go

## Details

### API Response Shape

**`GET /perawi`**

```json
[
    {
        "id": 1,
        "nama_arab": "أبو هريرة",
        "nama_latin": "Abu Hurairah",
        "nama_lengkap": "Abu Hurairah Ad-Dausi",
        "kunyah": "Abu Hurairah",
        "laqab": null,
        "nisbah": "Ad-Dausi",
        "tahun_lahir": 602,
        "tahun_wafat": 678,
        "tahun_hijri": true,
        "tempat_lahir": "Yaman",
        "tempat_wafat": "Madinah",
        "tabaqah": "sahabat",
        "status": "tsiqah",
        "biografis": "...",
        "guru": [{ "id": 2, "nama_latin": "Rasulullah SAW" }],
        "murid": [{ "id": 3, "nama_latin": "Ibnu Umar" }],
        "jarh_tadil": [
            {
                "id": 1,
                "penilai": { "nama_latin": "Ibnu Hajar" },
                "jenis_nilai": "tadil",
                "tingkat": 2,
                "teks_nilai": "Tsiqah",
                "sumber": "Taqribut Tahdzib",
                "catatan": "..."
            }
        ]
    }
]
```

### Database Model

**`Perawi`** (`model/perawi.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `nama_arab` | *string | Arabic name |
| `nama_latin` | *string | Latin transliteration |
| `nama_lengkap` | *string | Full name |
| `kunyah` | *string | Kunyah (Abu/Umm) |
| `laqab` | *string | Honorific title |
| `nisbah` | *string | Lineage/attribution |
| `tahun_lahir` | *int | Birth year |
| `tahun_wafat` | *int | Death year |
| `tempat_lahir` | *string | Place of birth |
| `tempat_wafat` | *string | Place of death |
| `tabaqah` | *string | Generation tier (sahabat, tabiin, etc.) |
| `status` | *string | Jarh/Ta'dil status (tsiqah, dhaif, etc.) |
| `biografis` | \*string | Biography text |
| `guru` | []Perawi | Many-to-many teachers |
| `murid` | []Perawi | Many-to-many students |

**`JarhTadil`** (`model/jarh_tadil.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `perawi_id` | *int | FK to Perawi being evaluated |
| `penilai_id` | *int | FK to Perawi (critic) |
| `jenis_nilai` | *JarhTadilJenis | tadil or jarh |
| `tingkat` | *int | Severity level 1–7 |
| `teks_nilai` | *string | Evaluation text |
| `sumber` | *string | Source book |
| `catatan` | \*string | Additional notes |

### Key Frontend Components

- **Web** (`/perawi`): Perawi list with search/filter by tabaqah; detail page with bio, guru-murid graph, jarh-ta'dil table
- **Mobile** (`HadithScreen` tab perawi): Perawi search → detail bottom-sheet with bio, teacher/student list, evaluation timeline
