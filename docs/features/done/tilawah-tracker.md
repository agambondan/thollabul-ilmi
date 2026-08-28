# Tilawah Tracker

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Mencatat bacaan Quran harian (halaman, juz) dan menyediakan statistik tilawah untuk memantau konsistensi membaca Al-Quran setiap hari.

## Scope

- API: `/tilawah`
- Web: `/tilawah`, `/dashboard/tilawah`
- Mobile: Bagian dari `QuranScreen`

## Evidence

- Web: `apps/web/src/app/tilawah/page.js`, `apps/web/src/app/dashboard/tilawah/page.js`
- Mobile: `apps/mobile/src/screens/QuranScreen.js` (tilawah section)

- API: services/api/app/controllers/tilawah_controller.go

## Source of Truth

- services/api/app/controllers/tilawah_controller.go
- services/api/app/model/tilawah.go
- services/api/app/services/tilawah_service.go

## Details

### API Response Shape

**`GET /tilawah?date=2026-05-13`**

```json
[
    {
        "id": 1,
        "user_id": "uuid",
        "date": "2026-05-13",
        "pages_read": 10,
        "juz_read": 0.5,
        "note": "Baca setelah subuh"
    }
]
```

**`POST /tilawah`**

```json
{
    "date": "2026-05-13",
    "pages_read": 10,
    "juz_read": 0.5,
    "note": "Baca setelah subuh"
}
```

**`GET /tilawah/summary`**

```json
{
    "total_pages": 120,
    "total_juz": 6.0,
    "daily_avg_pages": 4.0,
    "est_khatam_days": 150,
    "log_count": 30
}
```

### Database Model

**`TilawahLog`** (`model/tilawah.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `date` | string | YYYY-MM-DD |
| `pages_read` | int | Number of pages read |
| `juz_read` | float64 | Equivalent juz (decimal) |
| `note` | string | Optional log note |

**`TilawahSummary`** is computed: `total_pages`, `total_juz`, `daily_avg_pages`, `est_khatam_days`, `log_count`.

### Key Frontend Components

- **Web** (`/tilawah`, `/dashboard/tilawah`): Daily log form (pages + juz input); weekly/monthly bar chart; summary cards with khatam estimate
- **Mobile** (Bagian dari `QuranScreen`): Quick-log bottom sheet after reading session; mini progress bar showing today's vs target tilawah
