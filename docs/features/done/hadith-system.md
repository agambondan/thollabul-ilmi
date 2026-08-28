# Hadith System

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Baca, cari, dan eksplorasi hadith dari multi-kitab dengan detail sanad, takhrij, perawi, dan jarh wa ta'dil.

## Scope

- API: /hadiths, /books, /themes, /chapters, /perawi, /sanad, /takhrij, /jarh-tadil
- Web: /hadith, /perawi
- Mobile: HadithScreen

## Evidence

- API controller: services/api/app/controllers/hadith_controller.go
- Web page: apps/web/src/app/hadith/page.js
- Mobile screen: apps/mobile/src/screens/HadithScreen.js

## Source of Truth

- Model: services/api/app/model/hadith.go
- Controller: services/api/app/controllers/hadith_controller.go
- Service: services/api/app/service/hadith_service.go

## Details

### API Response Shape

**`GET /hadiths?book=bukhari&theme=iman`**

```json
[
    {
        "id": 1,
        "number": 1,
        "book_id": 1,
        "theme_id": 1,
        "chapter_id": 1,
        "grade": "shahih",
        "shahih_by": "Al-Albani",
        "dhaif_by": null,
        "grade_notes": "HR. Bukhari no. 1",
        "sanad": "حَدَّثَنَا...",
        "translation": {
            "idn": "Sesungguhnya amal itu tergantung niatnya...",
            "ar": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ..."
        },
        "book": {
            "id": 1,
            "slug": "bukhari",
            "translation": { "idn": "Shahih Bukhari" }
        },
        "theme": { "id": 1, "translation": { "idn": "Iman" } },
        "chapter": { "id": 1, "translation": { "idn": "Bab Niat" } }
    }
]
```

**`GET /books`** — List all hadith books with count.

**`GET /themes`** — List all themes/topics with total hadith count.

### Database Model

**`Hadith`** (`model/hadith.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `number` | *int | Hadith number within book |
| `book_id` | *int | FK to Book |
| `theme_id` | *int | FK to Theme |
| `chapter_id` | *int | FK to Chapter |
| `translation_id` | *int | FK to Translation (matan text) |
| `grade` | *HadithGrade | shahih, hasan, dhaif, etc. |
| `shahih_by` | *string | Muhaddith who authenticated it |
| `dhaif_by` | *string | Muhaddith who declared it weak |
| `grade_notes` | *string | Explanation of grading |
| `sanad` | *string | Chain of narration text |
| `media` | []HadithAsset | Associated multimedia |

**`Book`** (`model/book.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `slug` | *string | bukhari, muslim, etc. |
| `default_language` | *string | Default "Idn" |
| `translation` | *Translation | Book name in multiple languages |
| `count` | *int64 | Number of hadith (computed) |

**`Theme`** (`model/theme.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `translation` | *Translation | Theme name in multiple languages |
| `chapters` | []Chapter | Has-many chapters |
| `total_hadith` | *int64 | Computed hadith count |

### Key Frontend Components

- **Web** (`/hadith`): Book selector → theme/chapter navigator → hadith list with grade badge; detail view with sanad expand
- **Mobile** (`HadithScreen`): Tab navigation (books/themes/chapters) → hadith card list → bottom-sheet detail with translation + sanad
