# Reading Progress

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Progress baca Quran & Hadith: melacak posisi terakhir, persentase selesai, dan riwayat bacaan. Membantu pengguna melanjutkan bacaan dari tempat terakhir dan memonitor konsistensi tilawah.

## Scope

- API: /progress
- Web: bagian dari /quran dan /hadith
- Mobile: QuranScreen, HadithScreen

## Evidence

- API: services/api/app/controllers/reading_progress_controller.go
- Web: apps/web/src/app/quran/page.js, apps/web/src/app/hadith/page.js
- Mobile: apps/mobile/src/screens/QuranScreen.js, apps/mobile/src/screens/HadithScreen.js

## Source of Truth

- services/api/app/controllers/reading_progress_controller.go
- apps/web/src/lib/hooks/useReadingProgress.js

## Details

### API Response Shape

**`GET /progress`**

```json
{
    "quran": {
        "id": "uuid",
        "user_id": "uuid",
        "content_type": "quran",
        "surah_number": 2,
        "ayah_number": 150,
        "ayah_id": 250,
        "last_read_at": "2026-05-13T06:30:00Z"
    },
    "hadith": {
        "id": "uuid",
        "user_id": "uuid",
        "content_type": "hadith",
        "book_slug": "bukhari",
        "hadith_id": 150,
        "last_read_at": "2026-05-12T20:00:00Z"
    }
}
```

### Database Model

**`ReadingProgress`** (`model/reading_progress.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user; unique per content_type |
| `content_type` | ProgressType | quran or hadith |
| `surah_number` | *int | Last read surah |
| `ayah_number` | *int | Last read ayah |
| `ayah_id` | *int | FK to Ayah |
| `book_slug` | *string | Last read book |
| `hadith_id` | *int | FK to Hadith |
| `last_read_at` | *time.Time | Auto-updated on each read |

### Key Frontend Components

- **Web** (bagian dari `/quran`, `/hadith`): "Lanjutkan" banner at top; auto-save position on scroll; resume-reading button
- **Mobile** (`QuranScreen`, `HadithScreen`): Resume-reading card on home/dashboard; auto-track when scrolling; progress ring per content type
