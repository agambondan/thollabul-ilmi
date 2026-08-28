# Achievement & Badge

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Poin, badge, dan pencapaian yang bisa di-unlock. Sistem reward untuk memberikan pengakuan atas milestone pengguna seperti khatam Quran, streak panjang, atau target belajar tercapai.

## Scope

- API: /achievements
- Web: /dashboard (profile section)
- Mobile: ProfileScreen

## Evidence

- API: services/api/app/controllers/achievement_controller.go
- Web: apps/web/src/app/dashboard/page.js
- Mobile: apps/mobile/src/screens/ProfileScreen.js

## Source of Truth

- services/api/app/controllers/achievement_controller.go
- apps/web/src/components/AchievementCard.js

## Details

### API Response Shape

**`GET /achievements`**

```json
{
    "achievements": [
        {
            "id": 1,
            "code": "khatam_pertama",
            "name": "Khatam Pertama",
            "name_en": "First Khatam",
            "description": "Menyelesaikan bacaan Al-Quran 30 juz",
            "desc_en": "Completed reading the entire Quran",
            "icon": "📖",
            "category": "tilawah",
            "threshold": 30
        }
    ],
    "earned": [
        {
            "user_id": "uuid",
            "achievement_id": 1,
            "achievement": {
                "code": "khatam_pertama",
                "name": "Khatam Pertama"
            },
            "earned_at": "2026-03-15T10:00:00Z"
        }
    ],
    "points": {
        "total_points": 2500
    }
}
```

### Database Model

**`Achievement`** (`model/achievement.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `code` | string | Unique code (e.g. "khatam_pertama") |
| `name` | string | Indonesian name |
| `name_en` | string | English name |
| `description` | string | Indonesian description |
| `desc_en` | string | English description |
| `icon` | string | Emoji or icon URL |
| `category` | string | tilawah, hafalan, streak, etc. |
| `threshold` | int | Numeric target to unlock |

**`UserAchievement`** (`model/achievement.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user |
| `achievement_id` | int | FK to Achievement |
| `earned_at` | time.Time | When it was unlocked |

**`UserPoints`** (`model/achievement.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user; unique |
| `total_points` | int | Cumulative points |

### Key Frontend Components

- **Web** (bagian dari `/dashboard`): Achievement grid (earned vs locked); points display with progress to next badge; unlock animation on new achievement
- **Mobile** (`ProfileScreen`): Badge collection view with earned/locked filter; point total with history; notification on new unlock
