# Quran Hafalan Tracker

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Tracker menghafal Quran per surah dengan progress status dan muroja'ah mode untuk memudahkan pengguna memantau hafalan harian dan mengulang ayat-ayat yang sudah dihafal.

## Scope

- API: `/hafalan`, `/murojaah`
- Web: `/hafalan`, `/muroja-ah`, `/dashboard/hafalan`, `/dashboard/muroja-ah`
- Mobile: `QuranScreen` (4 hafalan modes)

## Evidence

- Web: `apps/web/src/app/hafalan/page.js`, `apps/web/src/app/muroja-ah/page.js`, `apps/web/src/app/dashboard/hafalan/page.js`, `apps/web/src/app/dashboard/muroja-ah/page.js`
- Mobile: `apps/mobile/src/screens/QuranScreen.js`

- API: services/api/app/controllers/hafalan_controller.go, services/api/app/controllers/murojaah_controller.go

## Source of Truth

- services/api/app/controllers/hafalan_controller.go, services/api/app/controllers/murojaah_controller.go
- services/api/app/model/hafalan.go
- services/api/app/services/hafalan_service.go

## Details

### API Response Shape

**`GET /hafalan`**

```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "surah_id": 1,
        "status": "in_progress",
        "started_at": "2026-01-01T00:00:00Z",
        "completed_at": null,
        "surah": {
            "id": 1,
            "number": 1,
            "translation": { "idn": "Al-Fatihah" }
        }
    }
]
```

**`GET /hafalan/summary`**

```json
{
    "total": 114,
    "not_started": 80,
    "in_progress": 20,
    "memorized": 14
}
```

**`POST /murojaah`**

```json
{
    "date": "2026-05-13",
    "surah_id": 1,
    "from_ayah": 1,
    "to_ayah": 7,
    "score": 85,
    "duration_seconds": 120,
    "note": "Lancar sedikit tersendat di ayat 5"
}
```

**`GET /murojaah/stats`**

```json
{
    "total_sessions": 30,
    "avg_score": 82.5,
    "total_duration_seconds": 5400,
    "surah_covered": 14
}
```

### Database Model

**`HafalanProgress`** (`model/hafalan.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user |
| `surah_id` | int | FK to Surah; unique per user |
| `status` | HafalanStatus | not_started, in_progress, memorized |
| `started_at` | *time.Time | When memorization began |
| `completed_at` | *time.Time | When marked memorized |

**`MurojaahSession`** (`model/murojaah.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `date` | string | YYYY-MM-DD |
| `surah_id` | int | FK to Surah |
| `from_ayah` | int | Start ayah |
| `to_ayah` | int | End ayah |
| `score` | int | 0–100 score |
| `duration_seconds` | int | Session duration |
| `note` | string | Session notes |

**`HafalanSummary`** & **`MurojaahStats`** are computed response types.

### Key Frontend Components

- **Web** (`/hafalan`, `/dashboard/hafalan`): Surah grid with color-coded status badges; tap to update status; progress ring per juz
- **Web** (`/muroja-ah`, `/dashboard/muroja-ah`): Session form with ayah range picker, score slider, timer; session history table
- **Mobile** (`QuranScreen`): Hafalan mode toggle (hafalan/murojaah); swipeable surah list with progress indicator; quick-log murojaah from current ayah
