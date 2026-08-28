# Leaderboard

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Ranking berdasarkan streak + hafalan. Memberikan gambaran pencapaian pengguna dalam komunitas untuk memotivasi semangat belajar dan konsistensi.

## Scope

- API: /leaderboard
- Web: /leaderboard, /dashboard/leaderboard
- Mobile: ExploreScreen

## Evidence

- API: services/api/app/controllers/leaderboard_controller.go
- Web: apps/web/src/app/leaderboard/page.js, apps/web/src/app/dashboard/leaderboard/page.js
- Mobile: apps/mobile/src/screens/ExploreScreen.js

## Source of Truth

- services/api/app/controllers/leaderboard_controller.go
- apps/web/src/app/leaderboard/page.js

## Details

### API Response Shape

**`GET /leaderboard`**

```json
{
    "my_rank": {
        "rank": 15,
        "score": 1200,
        "total": 1000
    },
    "entries": [
        {
            "rank": 1,
            "user_id": "uuid",
            "name": "Ahmad",
            "avatar": "https://...",
            "score": 5000
        },
        {
            "rank": 2,
            "user_id": "uuid",
            "name": "Siti",
            "avatar": null,
            "score": 4800
        }
    ]
}
```

### Database Model

**`LeaderboardEntry`** (`model/leaderboard.go`)
| Field | Type | Notes |
|-------|------|-------|
| `rank` | int | Computed rank position |
| `user_id` | string | User identifier |
| `name` | string | User display name |
| `avatar` | \*string | Avatar URL |
| `score` | int | Score (computed from streak + hafalan + activity) |

**`LeaderboardMyRank`** (`model/leaderboard.go`)
| Field | Type | Notes |
|-------|------|-------|
| `rank` | int | Current user's rank |
| `score` | int | Current user's score |
| `total` | int | Total participants |

### Key Frontend Components

- **Web** (`/leaderboard`, `/dashboard/leaderboard`): Top 10 podium view + scrollable ranked list; highlight current user row; period filter (weekly/monthly/all-time)
- **Mobile** (`ExploreScreen`): Leaderboard list with avatar, rank number, and score bar; user's own rank pinned at top/bottom; tap user for profile preview
