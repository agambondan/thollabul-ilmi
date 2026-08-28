# Muhasabah Harian

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Jurnal refleksi harian dengan mood picker. Pengguna dapat melakukan introspeksi diri (muhasabah) setiap hari, mencatat perasaan, evaluasi ibadah, dan target perbaikan diri.

## Scope

- API: /muhasabah
- Web: /muhasabah, /dashboard/muhasabah
- Mobile: HomeScreen

## Evidence

- API: services/api/app/controllers/muhasabah_controller.go
- Web: apps/web/src/app/muhasabah/page.js, apps/web/src/app/dashboard/muhasabah/page.js
- Mobile: components/MuhasabahCard.js

## Source of Truth

- services/api/app/controllers/muhasabah_controller.go
- apps/web/src/app/muhasabah/page.js

## Details

### API Response Shape

**`GET /muhasabah?date=2026-05-13`**

```json
[
    {
        "id": 1,
        "user_id": "uuid",
        "date": "2026-05-13",
        "content": "Hari ini saya belajar...",
        "mood_score": 4,
        "is_private": true
    }
]
```

**`POST /muhasabah`**

```json
{
    "date": "2026-05-13",
    "content": "Hari ini saya belajar...",
    "mood_score": 4,
    "is_private": true
}
```

### Database Model

**`Muhasabah`** (`model/muhasabah.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `date` | string | YYYY-MM-DD; unique per user |
| `content` | string | Reflection content |
| `mood_score` | int | Mood rating 1–5 |
| `is_private` | bool | Privacy flag (default true) |

### Key Frontend Components

- **Web** (`/muhasabah`, `/dashboard/muhasabah`): Date picker with mood emoji selector; rich text editor for reflection content; calendar view showing mood history
- **Mobile** (`MuhasabahCard` on `HomeScreen`): Compact daily prompt card → expand to full journal editor with mood picker; streak indicator for consistency
