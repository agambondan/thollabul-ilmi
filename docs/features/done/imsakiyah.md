# Imsakiyah

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Jadwal imsak/fajr/maghrib sebulan Ramadan.

## Scope

- API: `/imsakiyah`
- Web: `/imsakiyah`, `/dashboard/imsakiyah`
- Mobile: `IbadahScreen`

## Evidence

- API controller: `services/api/app/controllers/imsakiyah_controller.go`
- Web page: `apps/web/src/app/imsakiyah/page.js`, `apps/web/src/app/dashboard/imsakiyah/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/prayer_times_controller.go`
- `services/api/app/services/imsakiyah_service.go`
- `apps/web/src/app/imsakiyah/`

## Details

### API Response Shape

**`GET /imsakiyah?year=2026&month=3&lat=-6.2&lng=106.8&method=kemenag&madhab=shafi`**

```json
{
    "year": 2026,
    "month": 3,
    "lat": -6.2,
    "lng": 106.8,
    "method": "kemenag",
    "madhab": "shafi",
    "schedule": [
        {
            "date": "2026-03-01",
            "hijri": "12 Ramadhan 1447",
            "prayers": {
                "imsak": "04:28",
                "fajr": "04:38",
                "sunrise": "05:53",
                "dhuhr": "11:43",
                "asr": "14:58",
                "maghrib": "17:33",
                "isha": "18:48"
            }
        }
    ]
}
```

### Database Model

**`ImsakiyahResponse`** & **`ImsakiyahRow`** (`model/prayer_times.go`)
| Response Field | Type | Notes |
|----------------|------|-------|
| `year` | int | Hijri year |
| `month` | int | Hijri month (Ramadan = 9) |
| `lat` | float64 | Location latitude |
| `lng` | float64 | Location longitude |
| `method` | string | Calculation method |
| `madhab` | string | Fiqh madhab |
| `schedule` | []ImsakiyahRow | Daily rows for the month |

| Row Field | Type       | Notes                                                                       |
| --------- | ---------- | --------------------------------------------------------------------------- |
| `date`    | string     | YYYY-MM-DD gregorian                                                        |
| `hijri`   | string     | Hijri date string                                                           |
| `prayers` | PrayerTime | Same shape as prayer-times: imsak, fajr, sunrise, dhuhr, asr, maghrib, isha |

### Key Frontend Components

- **Web** (`/imsakiyah`, `/dashboard/imsakiyah`): Month table with column per prayer; highlight today; countdown to maghrib
- **Mobile** (`IbadahScreen`): Compact Ramadan calendar list; tap row for detail
