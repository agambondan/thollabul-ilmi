# Goals & Target Belajar

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Target belajar dengan deadline, bisa track progress. Pengguna dapat menetapkan target hafalan, khatam Quran, atau target pembelajaran lain dengan timeline yang jelas.

## Scope

- API: /goals
- Web: /goals, /dashboard/goals
- Mobile: ExploreScreen

## Evidence

- API: services/api/app/controllers/goal_controller.go
- Web: apps/web/src/app/goals/page.js, apps/web/src/app/dashboard/goals/page.js
- Mobile: apps/mobile/src/screens/ExploreScreen.js

## Source of Truth

- services/api/app/controllers/goal_controller.go
- apps/web/src/app/goals/page.js

## Details

### API Response Shape

**`GET /goals`**

```json
[
    {
        "id": 1,
        "user_id": "uuid",
        "type": "hafalan",
        "title": "Hafal Juz 30",
        "description": "Target menghafal juz 30 dalam 3 bulan",
        "target": 37,
        "progress": 15,
        "start_date": "2026-01-01",
        "end_date": "2026-03-31",
        "is_completed": false
    }
]
```

### Database Model

**`StudyGoal`** (`model/goal.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `type` | GoalType | hafalan, khatam, tilawah, hadith, custom |
| `title` | string | Goal title |
| `description` | string | Detailed description |
| `target` | int | Numeric target (e.g. 37 surah for hafalan) |
| `progress` | int | Current progress |
| `start_date` | string | Start date YYYY-MM-DD |
| `end_date` | string | Target completion date |
| `is_completed` | bool | Completion flag |

### Key Frontend Components

- **Web** (`/goals`, `/dashboard/goals`): Goal cards with progress bar and deadline countdown; create/edit form with type selector, target input, date picker
- **Mobile** (`ExploreScreen`): Goal list with visual progress ring; quick-increment button; create goal bottom-sheet form
