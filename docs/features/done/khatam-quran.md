# Khatam Quran

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Target khatam 6236 ayat dengan progress per juz dan rekomendasi bacaan harian, membantu pengguna mencapai target khatam dalam jangka waktu tertentu.

## Scope

- API: `/reading-progress`
- Web: `/khatam`, `/dashboard/khatam`
- Mobile: Bagian dari `QuranScreen`

## Evidence

- Web: `apps/web/src/app/khatam/page.js`, `apps/web/src/app/dashboard/khatam/page.js`
- Mobile: `apps/mobile/src/screens/QuranScreen.js` (khatam section)

- API: services/api/app/controllers/reading_progress_controller.go

## Source of Truth

- services/api/app/controllers/reading_progress_controller.go
- services/api/app/model/reading_progress.go
- services/api/app/services/reading_progress_service.go

## Details

### API Response Shape

**`GET /reading-progress`**

```json
{
    "id": "uuid",
    "user_id": "uuid",
    "content_type": "quran",
    "surah_number": 2,
    "ayah_number": 150,
    "ayah_id": 250,
    "book_slug": null,
    "hadith_id": null,
    "last_read_at": "2026-05-13T06:30:00Z"
}
```

**`PUT /reading-progress/quran`**

```json
{
    "surah_number": 2,
    "ayah_number": 150,
    "ayah_id": 250
}
```

### Database Model

**`ReadingProgress`** (`model/reading_progress.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user; unique per content_type |
| `content_type` | ProgressType | quran or hadith |
| `surah_number` | *int | Last read surah (quran type) |
| `ayah_number` | *int | Last read ayah number |
| `ayah_id` | *int | FK to Ayah |
| `book_slug` | *string | Last read book (hadith type) |
| `hadith_id` | *int | FK to Hadith |
| `last_read_at` | *time.Time | Timestamp of last read |

### Key Frontend Components

- **Web** (`/khatam`, `/dashboard/khatam`): Juz progress grid (30 boxes); daily reading recommendation; estimated khatam date countdown; continue-reading button
- **Mobile** (Bagian dari `QuranScreen`): Progress ring per juz; "Lanjutkan" button that scrolls to last read ayah; khatam countdown banner
