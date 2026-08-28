# Faraidh Calculator

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Kalkulator waris (faraidh) dengan perhitungan Ashabul Furudh, Ashabah, Aul, dan Radd berdasarkan hukum faraidh Islam.

## Scope

- API: `/faraidh`
- Web: `/faraidh`, `/dashboard/faraidh`
- Mobile: `IbadahScreen`

## Evidence

- API: `services/api/app/controllers/faraidh_controller.go`
- Web: `apps/web/src/app/faraidh/`, `apps/web/src/app/dashboard/faraidh/`
- Mobile: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `services/api/app/services/faraidhCalculator_service.go`
- `services/api/app/model/Faraidh.go`

## Details

### API Response Shape

**`POST /faraidh/calculate`**

```json
{
    "deceased": "laki-laki",
    "heirs": [
        { "relation": "suami", "count": 1 },
        { "relation": "anak_perempuan", "count": 2 },
        { "relation": "ayah", "count": 1 }
    ],
    "total_estate": 100000000
}
```

Response:

```json
{
    "total_estate": 100000000,
    "heirs": [
        {
            "relation": "suami",
            "portion": "1/4",
            "amount": 25000000,
            "percentage": 25.0
        },
        {
            "relation": "anak_perempuan",
            "portion": "2/3",
            "amount": 50000000,
            "percentage": 50.0
        },
        {
            "relation": "ayah",
            "portion": "1/6",
            "amount": 16666667,
            "percentage": 16.67
        }
    ],
    "ashabah": null,
    "aul_radd": null,
    "total_distributed": 91666667
}
```

### Service Types (no DB model — pure calculation)

| Request Field  | Type        | Notes                                         |
| -------------- | ----------- | --------------------------------------------- |
| `deceased`     | string      | Gender of deceased: "laki-laki" / "perempuan" |
| `heirs`        | []HeirInput | List of heirs with relation and count         |
| `total_estate` | float64     | Total inheritance amount                      |

| Response Field      | Type            | Notes                                           |
| ------------------- | --------------- | ----------------------------------------------- |
| `heirs`             | []HeirResult    | Each heir's portion, amount, and percentage     |
| `ashabah`           | \*AshabahResult | Residue/agnate share if applicable              |
| `aul_radd`          | \*string        | Aul (deficit) or Radd (surplus) adjustment note |
| `total_distributed` | float64         | Sum of distributed amounts                      |

### Key Frontend Components

- **Web** (`/faraidh`, `/dashboard/faraidh`): Heir selector with relationship and count inputs; result table with share fraction, amount, and percentage; pie chart visualization
- **Mobile** (`IbadahScreen`): Step form (deceased gender → add heirs → estate value); result view with card per heir showing portion and amount
