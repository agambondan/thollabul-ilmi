# Streak & Activity

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Daily streak & aktivitas harian untuk motivasi konsistensi. Melacak hari-hari aktif pengguna, aktivitas ibadah, dan memberikan visualisasi untuk menjaga semangat belajar.

## Scope

- API: /streak, /activity
- Web: bagian dari /dashboard, /profile
- Mobile: HomeScreen, ProfileScreen

## Evidence

- API: services/api/app/controllers/streak_controller.go, services/api/app/controllers/streak_controller.go
- Web: apps/web/src/app/dashboard/page.js, apps/web/src/app/profile/page.js
- Mobile: apps/mobile/src/screens/HomeScreen.js, apps/mobile/src/screens/ProfileScreen.js

## Source of Truth

- services/api/app/controllers/streak_controller.go
- apps/web/src/components/StreakWidget.js

## Details

### API Response Shape

**`GET /streak`**

```json
{
    "current_streak": 7,
    "longest_streak": 30,
    "total_days": 120
}
```

**`GET /activity?days=7`**

```json
[
    { "date": "2026-05-07", "count": 3 },
    { "date": "2026-05-08", "count": 1 },
    { "date": "2026-05-09", "count": 0 },
    { "date": "2026-05-10", "count": 2 },
    { "date": "2026-05-11", "count": 5 },
    { "date": "2026-05-12", "count": 4 },
    { "date": "2026-05-13", "count": 2 }
]
```

### Database Model

**`UserActivity`** (`model/user_activity.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user; unique per date+type |
| `activity_date` | time.Time | Activity date |
| `type` | ActivityType | quran, hadith, doa |
| `count` | int | Activity count (default 1) |

**`StreakResponse`** is computed: `current_streak`, `longest_streak`, `total_days`.
**`WeeklyActivity`** is computed per date with sum of counts.

### Key Frontend Components

- **Web** (bagian dari `/dashboard`, `/profile`): Streak counter badge with flame icon; weekly activity chart (bars); GitHub-style contribution grid
- **Mobile** (`HomeScreen`, `ProfileScreen`): Streak card with fire emoji and count; mini calendar heatmap; daily activity breakdown by type
