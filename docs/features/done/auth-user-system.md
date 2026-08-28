# Auth & User System

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Registrasi, login JWT, forgot/reset password, role-based access control (admin/editor/author/user), dan preferred language per user. Fondasi otentikasi dan otorisasi semua fitur lain.

## Scope

- API: `/auth/*`, `/users/*`
- Web: `/auth`, `/profile`
- Mobile: `SessionContext`, `ProfileScreen`

## Evidence

- API: `services/api/app/controllers/user_controller.go`, `services/api/app/controllers/user_controller.go`
- Web: `apps/web/src/app/auth/`, `apps/web/src/app/profile/`
- Mobile: `apps/mobile/src/contexts/SessionContext.js`, `apps/mobile/src/screens/ProfileScreen.js`

## Source of Truth

- `services/api/app/controllers/auth_controller.go`
- `services/api/app/controllers/rbac_controller.go`
- `services/api/app/model/User.go`

## Details

### API Response Shape

**`POST /auth/register`**

```json
{
    "name": "Ahmad",
    "email": "ahmad@example.com",
    "password": "securepassword"
}
```

**`POST /auth/login`**

```json
{
    "token": "eyJhbGciOi...",
    "refresh_token": "dGhpcyBpcyBh...",
    "user": {
        "id": "uuid",
        "name": "Ahmad",
        "email": "ahmad@example.com",
        "role": "user",
        "avatar": "https://...",
        "preferred_lang": "idn"
    }
}
```

**`GET /users/me`**

```json
{
    "id": "uuid",
    "name": "Ahmad",
    "email": "ahmad@example.com",
    "role": "user",
    "avatar": "https://...",
    "preferred_lang": "idn"
}
```

### Database Model

**`User`** (`model/user.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `name` | *string | Display name |
| `email` | *string | Login email; unique |
| `password` | *string | Hashed password (hidden from JSON) |
| `role` | UserRole | admin, author, editor, user |
| `avatar` | *string | Avatar URL |
| `preferred_lang` | \*string | Language preference (default: "idn") |

**`LoginResponse`** (`model/user.go`)
| Field | Type | Notes |
|-------|------|-------|
| `token` | string | JWT access token |
| `refresh_token` | string | Refresh token |
| `user` | \*User | Authenticated user object |

**`RefreshToken`** & **`PasswordResetToken`** support token rotation and password recovery flows.

### Key Frontend Components

- **Web** (`/auth`): Login/register form; forgot password flow; social login buttons; profile page with avatar upload, name/email edit, language selector
- **Mobile** (`SessionContext`, `ProfileScreen`): Auth context provider wrapping entire app; login/register screen; biometric auth option; profile edit with image picker; role-based feature visibility
