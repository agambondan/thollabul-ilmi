# Stats Personal

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Laporan/rekap pribadi: mingguan, bulanan, tahunan; mencakup sholat, tilawah, hafalan, doa. Memberikan insight visual tentang perkembangan ibadah dan belajar pengguna.

## Scope

- API: /stats
- Web: /stats, /dashboard/stats
- Mobile: ProfileScreen

## Evidence

- API: services/api/app/controllers/stats_controller.go
- Web: apps/web/src/app/stats/page.js, apps/web/src/app/dashboard/stats/page.js
- Mobile: apps/mobile/src/screens/ProfileScreen.js

## Source of Truth

- services/api/app/controllers/stats_controller.go
- apps/web/src/app/stats/page.js

## Details

### API Response Shape

**`GET /stats?period=weekly&date=2026-05-13`**

```json
{
    "period": "weekly",
    "start_date": "2026-05-07",
    "end_date": "2026-05-13",
    "sholat": {
        "total_days": 7,
        "berjamaah_pct": 65.0,
        "munfarid_pct": 20.0,
        "qadha_pct": 10.0,
        "missed_pct": 5.0,
        "best_streak_days": 7,
        "current_streak_days": 7
    },
    "tilawah": {
        "total_pages": 40,
        "total_juz": 2.0,
        "daily_avg_pages": 5.7
    },
    "hafalan": {
        "memorized": 14,
        "in_progress": 20,
        "not_started": 80
    },
    "doa": {
        "total_logged": 25
    },
    "activity": {
        "total_days_active": 7,
        "current_streak": 7,
        "longest_streak": 30
    }
}
```

### Data Sources

| Section  | Model/Service                                | Notes                                       |
| -------- | -------------------------------------------- | ------------------------------------------- |
| Sholat   | `SholatStats` from SholatLog aggregation     | Berjamaah/munfarid/qadha/missed percentages |
| Tilawah  | `TilawahSummary` from TilawahLog aggregation | Pages, juz, daily avg                       |
| Hafalan  | `HafalanSummary` from HafalanProgress        | Memorized/in-progress/not-started counts    |
| Activity | `StreakResponse` from UserActivity           | Streak and active days                      |

### Key Frontend Components

- **Web** (`/stats`, `/dashboard/stats`): Period selector (weekly/monthly/yearly); chart dashboard with line/bar/pie charts for each stat category; printable summary report
- **Mobile** (`ProfileScreen`): Compact stat cards with mini sparklines; tap card for expanded view with chart; share stat as image
