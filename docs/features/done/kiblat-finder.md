# Kiblat Finder

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Arah kiblat dari lokasi user (angle + distance Haversine).

## Scope

- API: `/kiblat`
- Web: `/kiblat`
- Mobile: `IbadahScreen` (compass native)

## Evidence

- API controller: `services/api/app/controllers/kiblat_controller.go`
- Web page: `apps/web/src/app/kiblat/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/controllers/kiblat_controller.go`
- `services/api/app/services/kiblat_service.go`
- `apps/web/src/app/kiblat/`

## Details

### API Response Shape

**`GET /kiblat?lat=-6.2&lng=106.8`**

```json
{
    "latitude": -6.2,
    "longitude": 106.8,
    "direction_degrees": 295.3,
    "distance_km": 7925.4,
    "compass": "barat_laut",
    "description": "Arah kiblat dari lokasi Anda: 295.3° (barat laut)"
}
```

### Database Model

**`KiblatResponse`** (`model/kiblat.go`)
| Field | Type | Notes |
|-------|------|-------|
| `latitude` | float64 | Input latitude |
| `longitude` | float64 | Input longitude |
| `direction_degrees` | float64 | Qibla bearing in degrees (0–360) |
| `distance_km` | float64 | Haversine distance to Ka'bah (km) |
| `compass` | string | Cardinal direction label (barat*laut, etc.) |
| `description` | string | Human-readable summary |
| \_Formula* | — | Bearing from (lat,lng) to Ka'bah (21.4225°N, 39.8262°E) using spherical trigonometry |

### Key Frontend Components

- **Web** (`/kiblat`): Location permission request → compass arrow with degree readout → distance display
- **Mobile** (`IbadahScreen`): Native compass overlay with camera (AR) showing qibla direction; real-time heading update
