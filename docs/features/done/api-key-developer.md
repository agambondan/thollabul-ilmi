# API Key & Developer Portal

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Portal developer untuk integrasi eksternal: register sebagai developer, membuat dan mencabut API keys, serta mengakses content API dengan rate limiting.

## Scope

- API: `/developer/*`
- Web: `/dev`
- Mobile: -

## Evidence

- API: `services/api/app/controllers/api_key_controller.go`
- Web: `apps/web/src/app/dev/`

## Source of Truth

- `services/api/app/controllers/apiKey_controller.go`
- `services/api/app/model/ApiKey.go`

## Details

### API Response Shape

**`GET /developer/keys`**

```json
[
    {
        "id": 1,
        "name": "My App",
        "key_prefix": "tib_****...****a1b2",
        "is_active": true,
        "last_used_at": "2026-05-13T10:00:00Z",
        "request_count": 1500
    }
]
```

**`POST /developer/keys`**

```json
{
    "name": "My App"
}
```

Returns full key (only shown once):

```json
{
    "id": 1,
    "name": "My App",
    "key": "tib_a1b2c3d4e5f6...",
    "is_active": true
}
```

### Database Model

**`APIKey`** (`model/api_key.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to User |
| `name` | string | Key identifier for the developer |
| `key` | string | Hashed API key; unique |
| `is_active` | bool | Can be revoked by toggling |
| `last_used_at` | \*time.Time | Last usage timestamp |
| `request_count` | int | Total request count |

**`APIKeyPublic`** is the safe response shape (key prefix only, full key never stored).

### Key Frontend Components

- **Web** (`/dev`): Developer dashboard with API key management; create key button → copy full key once; revoke confirmation; usage statistics table
- **Mobile**: Not applicable (developer portal is web-only)
