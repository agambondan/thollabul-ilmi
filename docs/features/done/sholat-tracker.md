# Sholat Tracker

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Catat sholat 5 waktu per hari, lihat history & statistik.

## Scope

- API: `/sholat`
- Web: `/sholat-tracker`, `/dashboard/sholat-tracker`
- Mobile: `IbadahScreen`

## Evidence

- API controller: `services/api/app/controllers/sholat_controller.go`
- Web page: `apps/web/src/app/sholat-tracker/page.js`, `apps/web/src/app/dashboard/sholat-tracker/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/sholat_controller.go`
- `services/api/app/services/sholat_service.go`
- `apps/web/src/app/sholat-tracker/`

## Details

### API Response Shape

**`GET /sholat?date=2026-05-13`**

```json
{
    "date": "2026-05-13",
    "prayers": {
        "subuh": { "id": 1, "prayer": "subuh", "status": "berjamaah" },
        "dzuhur": { "id": 2, "prayer": "dzuhur", "status": "munfarid" },
        "ashar": null,
        "maghrib": { "id": 3, "prayer": "maghrib", "status": "qadha" },
        "isya": { "id": 4, "prayer": "isya", "status": "missed" }
    }
}
```

**`POST /sholat`**

```json
{
    "date": "2026-05-13",
    "prayer": "dzuhur",
    "status": "berjamaah"
}
```

**`GET /sholat/stats`**

```json
{
    "total_days": 30,
    "berjamaah_pct": 65.0,
    "munfarid_pct": 20.0,
    "qadha_pct": 10.0,
    "missed_pct": 5.0,
    "best_streak_days": 14,
    "current_streak_days": 7
}
```

### Database Model

**`SholatLog`** (`model/sholat.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `date` | string | YYYY-MM-DD |
| `prayer` | PrayerName | subuh, dzuhur, ashar, maghrib, isya |
| `status` | PrayerStatus | berjamaah, munfarid, qadha, missed |

**`SholatStats`** computed fields: `berjamaah_pct`, `munfarid_pct`, `qadha_pct`, `missed_pct`, `best_streak_days`, `current_streak_days`.

### Key Frontend Components

- **Web** (`/sholat-tracker`, `/dashboard/sholat-tracker`): 5-prayer checklist per day with status dropdown; calendar heatmap; stats cards
- **Mobile** (`IbadahScreen`): Today's 5-prayer grid → tap to toggle status; weekly summary banner
