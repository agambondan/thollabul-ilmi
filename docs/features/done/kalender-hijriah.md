# Kalender Hijriah

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Konversi Masehi-Hijriah, tanggal hari ini, event Islam.

## Scope

- API: `/hijri`
- Web: `/hijri`, `/dashboard/hijri`
- Mobile: `IbadahScreen`

## Evidence

- API controller: `services/api/app/controllers/hijri_controller.go`
- Web page: `apps/web/src/app/hijri/page.js`, `apps/web/src/app/dashboard/hijri/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/hijri_controller.go`
- `services/api/app/services/hijri_service.go`
- `apps/web/src/app/hijri/`

## Details

### API Response Shape

**`GET /hijri/today`**

```json
{
    "year": 1447,
    "month": 8,
    "day": 15,
    "month_name": "Sya'ban",
    "year_str": "1447 H",
    "date_str": "15 Sya'ban 1447 H",
    "gregorian_year": 2026,
    "gregorian_month": 5,
    "gregorian_day": 13
}
```

**`GET /hijri/events?month=9`**

```json
[
    {
        "id": 1,
        "hijri_month": 9,
        "hijri_day": 1,
        "category": "puasa|eid|peristiwa",
        "translation": {
            "idn": "Awal Ramadhan",
            "en": "Beginning of Ramadan",
            "ar": "أول رمضان"
        }
    }
]
```

### Database Model

**`HijriDate`** (`model/hijri.go`)
| Field | Type | Notes |
|-------|------|-------|
| `year` | int | Hijri year |
| `month` | int | Hijri month number (1–12) |
| `day` | int | Hijri day |
| `month_name` | string | Hijri month name (Muharram–Dzulhijjah) |
| `year_str` | string | Formatted "1447 H" |
| `date_str` | string | Formatted "15 Sya'ban 1447 H" |
| `gregorian_year` | int | Equivalent Gregorian year |
| `gregorian_month` | int | Equivalent Gregorian month |
| `gregorian_day` | int | Equivalent Gregorian day |

**`IslamicEvent`** (`model/hijri.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `hijri_month` | int | Month this event falls in |
| `hijri_day` | int | Day this event falls on |
| `category` | IslamicEventCategory | puasa, eid, peristiwa |
| `translation_id` | \*int | FK to Translation (name + description) |

### Key Frontend Components

- **Web** (`/hijri`, `/dashboard/hijri`): Today's date card; month grid; event list with category badges; date converter form
- **Mobile** (`IbadahScreen`): Mini calendar widget; event notifications near relevant dates
