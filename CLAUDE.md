# CLAUDE.md — Thollabul Ilmi

Aplikasi Islamic knowledge untuk penuntut ilmu. Monorepo dengan API service (Go/Fiber) dan web app (Next.js).

## Chronicle-First Protocol

Ikuti AGENTS.md. Setiap task non-trivial wajib mulai dengan Chronicle:

```
mcp__chronicle__context   # tarik context relevan
mcp__chronicle__search    # sebelum Glob/Grep/Read manual yang lebar
mcp__chronicle__sync      # jika search terlihat stale
```

## Docs Index

Navigasi semua dokumen project: [`docs/INDEX.md`](docs/INDEX.md)

Baca ini sebelum mulai task supaya tidak salah acuan.

## Monorepo Layout

```
apps/web/           # Next.js 13 frontend (App Router)
apps/mobile/        # React Native / Expo mobile app
services/api/       # Go/Fiber API service
docs/               # Dokumentasi setup dan roadmap
  INDEX.md          # ← Indeks semua dokumen (mulai dari sini)
  MOBILE_IA_FINAL_APPROACH.md  # ← Arsitektur navigasi mobile (acuan utama)
  api/              # Feature roadmap dan status
  web/              # Status dan gap analysis web app
  setup/            # Local development, Chronicle, AI providers
.chronicle/         # Chronicle project binding
```

## Tech Stack

| Layer       | Stack                                                |
| ----------- | ---------------------------------------------------- |
| API Service | Go 1.26 + Fiber v2, GORM, PostgreSQL, Redis          |
| Web App     | Next.js 13.5, React 18, Tailwind CSS, TanStack Query |
| Auth        | JWT (golang-jwt/jwt v5)                              |
| Docs        | Swagger (gofiber/swagger)                            |
| Infra       | Docker Compose                                       |

## API Service (`services/api/`)

```
app/
  config/       # Viper config loader
  controllers/  # HTTP handlers (Fiber)
  db/           # GORM setup, migrations
  http/         # Router setup, middleware
  lib/          # Shared utilities
  model/        # GORM models
  repository/   # Data access layer
  services/     # Business logic
main.go
```

## Web App (`apps/web/`)

```
src/
  app/          # Next.js App Router pages
  components/   # Reusable UI components
  context/      # React context providers
  lib/          # Fetch helpers, utils
```

## Local Development

```bash
# Full stack via Docker
make docker-up

# API service only
make run-local           # default env
make run-dev             # development env

# Web app only
make web-dev
```

Default ports:

| Service    | Port                   |
| ---------- | ---------------------- |
| API        | http://localhost:29900 |
| Web        | http://localhost:23000 |
| PostgreSQL | localhost:54320        |
| Redis      | localhost:63790        |

## Formatting

- **Go**: standard `gofmt`; follow existing package structure
- **TS/JS/JSX**: 4-space indent, double quotes for imports, single quotes for JSX attrs, semicolons, trailing commas — see global `prettier-formatting.md`

## Mobile IA (Keputusan Aktif)

Dokumen acuan: [`docs/MOBILE_IA_FINAL_APPROACH.md`](docs/MOBILE_IA_FINAL_APPROACH.md)

5 tab final: **Beranda · Quran · Hadis · Ibadah · Belajar**

- Profil bukan tab — diakses via avatar di header Beranda/Belajar
- Hadis dedicated tab setara Quran
- Prayer → Ibadah hub (Harian / Alat / Rencana / Bacaan)
- Explore → Belajar hub (Ilmu + Personal ringkas)

Design pattern: `Card`, `CardTitle`, `Screen`, `Paper` components.
Back navigation: `setBack`/`clearBack` wajib di semua sub-navigation.

**Detail UI rule:** JANGAN pakai inline expand/collapse untuk detail item. Pakai bottom-sheet modal atau page detail terpisah. Acuan lengkap: [`docs/MOBILE_DESIGN_PATTERNS.md`](docs/MOBILE_DESIGN_PATTERNS.md).

## Feature Roadmap

Dokumen lengkap di [docs/api/FEATURE_ROADMAP.md](docs/api/FEATURE_ROADMAP.md).

Core yang sudah selesai: Al-Quran, Hadith, Auth & Users.

Urutan tier: Bookmark → Search → Reading Progress → Hafalan → Streak → Tilawah → Amalan → Doa → Asmaul Husna → ... (lihat roadmap).

## Catatan Penting

- Module Go: `github.com/agambondan/islamic-explorer` (nama lama, jangan ubah tanpa koordinasi)
- Makefile masih punya target lama (`weddinggo`, `cp-server`) — abaikan, tidak relevan
- Data content Islam (ayat, hadith) di-seed via `scripts/` atau tool import di root `services/api/`
