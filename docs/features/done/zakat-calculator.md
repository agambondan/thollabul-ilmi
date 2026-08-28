# Zakat Calculator

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Kalkulator zakat (maal, fitrah, nishab) dengan perhitungan otomatis berdasarkan jenis harta, harga emas terkini, dan haul.

## Scope

- API: `/zakat`
- Web: `/zakat`, `/dashboard/zakat`
- Mobile: `IbadahScreen`

## Evidence

- API: `services/api/app/controllers/zakat_controller.go`
- Web: `apps/web/src/app/zakat/`, `apps/web/src/app/dashboard/zakat/`
- Mobile: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/services/zakat_service.go`
- `services/api/app/model/Zakat.go`

## Details

### API Response Shape

**`POST /zakat/maal`**

```json
{
    "total_wealth": 100000000,
    "gold_price_per_gram": 1000000
}
```

Response:

```json
{
    "total_wealth": 100000000,
    "nishab": 85000000,
    "is_obligated": true,
    "zakat_amount": 2500000,
    "rate": 2.5,
    "nishab_grams": 85,
    "gold_price_used": 1000000
}
```

**`POST /zakat/fitrah`**

```json
{
    "person_count": 4,
    "staple_price_per_kg": 12000
}
```

Response:

```json
{
    "person_count": 4,
    "per_person_rice_kg": 2.5,
    "total_rice_kg": 10.0,
    "money_equivalent": 120000
}
```

**`GET /zakat/nishab`**

```json
{
    "gold_grams": 85,
    "silver_grams": 595,
    "description": "Nishab zakat maal setara 85 gram emas atau 595 gram perak..."
}
```

### Service Types (no DB model — pure calculation)

**`ZakatMaalRequest`** (`services/zakat_service.go`)
| Field | Type | Notes |
|-------|------|-------|
| `total_wealth` | float64 | Total wealth amount (IDR) |
| `gold_price_per_gram` | float64 | Current gold price per gram |

**`ZakatMaalResult`** (`services/zakat_service.go`)
| Field | Type | Notes |
|-------|------|-------|
| `total_wealth` | float64 | Input wealth |
| `nishab` | float64 | Nisab threshold (85g gold value) |
| `is_obligated` | bool | Whether zakat is due |
| `zakat_amount` | float64 | Zakat payable (2.5% of wealth) |
| `rate` | float64 | Zakat rate percentage |
| `nishab_grams` | float64 | 85 grams |
| `gold_price_used` | float64 | Gold price used in calculation |

**`ZakatFitrahRequest`** & **`ZakatFitrahResult`** handle fitrah calculation.
Constants: nishab = 85g gold, 595g silver; rate = 2.5%; fitrah = 2.5kg rice/person.

### Key Frontend Components

- **Web** (`/zakat`, `/dashboard/zakat`): Tab switcher (maal/fitrah/nishab); form inputs with sliders and currency formatting; result card with breakdown; nishab reference table
- **Mobile** (`IbadahScreen`): Calculator form → result summary with "is obligated" badge; save calculation history locally
