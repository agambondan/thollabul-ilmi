# Prayer Times

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Jadwal sholat harian berdasarkan lokasi (koordinat), dengan 7 metode perhitungan + madhhab.

## Scope

- API: `/sholat-times`, `/kiblat`
- Web: `/jadwal-sholat`, `/kiblat`
- Mobile: `IbadahScreen` → `PrayerScreen`

## Evidence

- API controller: `services/api/app/controllers/prayer_times_controller.go`, `services/api/app/controllers/kiblat_controller.go`
- Web page: `apps/web/src/app/jadwal-sholat/page.js`, `apps/web/src/app/kiblat/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`, `apps/mobile/src/screens/PrayerScreen.js`

## Source of Truth

- `services/api/app/controllers/prayer_times_controller.go`
- `services/api/app/controllers/kiblat_controller.go`
- `services/api/app/services/prayer-times_service.go`
- `apps/web/src/app/jadwal-sholat/`
- `apps/web/src/app/kiblat/`

## Details

### API Response Shape

**`GET /sholat-times?lat=-6.2&lng=106.8&method=kemenag&madhab=shafi`**

```json
{
    "date": "2026-05-13",
    "lat": -6.2,
    "lng": 106.8,
    "method": "kemenag",
    "madhab": "shafi",
    "prayers": {
        "imsak": "04:30",
        "fajr": "04:40",
        "sunrise": "05:55",
        "dhuhr": "11:45",
        "asr": "15:00",
        "maghrib": "17:35",
        "isha": "18:50"
    }
}
```

### Database Model

**`PrayerTimesResponse`** & **`PrayerTime`** (`model/prayer_times.go`)
| Field | Type | Notes |
|-------|------|-------|
| `date` | string | YYYY-MM-DD |
| `lat` | float64 | User latitude |
| `lng` | float64 | User longitude |
| `method` | string | Calculation method (kemenag, muhammadiyah, etc.) |
| `madhab` | string | Shafi, Hanafi |
| `prayers` | PrayerTime | Nested object with all 7 prayer times |
| `prayers.imsak` | string | HH:mm |
| `prayers.fajr` | string | HH:mm |
| `prayers.sunrise` | string | HH:mm (syuruq) |
| `prayers.dhuhr` | string | HH:mm |
| `prayers.asr` | string | HH:mm |
| `prayers.maghrib` | string | HH:mm |
| `prayers.isha` | string | HH:mm |

### Key Frontend Components

- **Web** (`/jadwal-sholat`): Location input → method selector → daily/weekly timetable with current prayer highlight
- **Mobile** (`IbadahScreen` → `PrayerScreen`): Compact daily strip + full-day view; auto-refresh based on location
