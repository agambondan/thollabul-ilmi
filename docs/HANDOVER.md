# Handover — thollabul-ilmi

## Project Overview

Monorepo Islamic app: Go backend (Fiber + GORM + PostgreSQL + Redis), Expo mobile (React Native), Next.js web (App Router).

```
services/api/      ← Go backend (~230 endpoints)
apps/mobile/       ← Expo React Native (9 screens, ~530 tests)
apps/web/          ← Next.js 13 web app (~60 pages, ~535 tests + 152 E2E)
```

---

## What's Been Done (Last Session)

Total commits: **~25 commits**, from `b83770a` → `4ff6a94`.

## What's Been Done (Current Session)

**CI Pipeline (`.github/workflows/test.yml`):**

- Added `web-test` job: Node 22 setup, npm ci, npx jest — runs all 423 web unit tests
- Added `web-lint` job: Node 22 setup, npm ci, npx next lint
- Added `mobile-test` job: Node 22 setup, npm ci, npx jest — runs all 530 mobile tests
- Updated `go-test` job: runs with `-tags postgres` to include search repository tests (7 tests), covers `./tests/...` too
- CI now triggers on `apps/web/**` and `apps/mobile/**` changes, not just `services/api/**`
- Node module caching via `actions/cache@v4` for both web and mobile

**Backend:**

- Removed `//go:build postgres` build tag from `search_repository_test.go` — tests use SQLite in-memory, no build tag needed. They now run in CI when `-tags postgres` is passed.
- Normalized all 32 controller `@Router` annotations: removed `/api/v1/` prefix → relative paths (`/route` instead of `/api/v1/route`). Total 157 annotations fixed across 32 files. Swagger consistency restored.

**Mobile (`apps/mobile/src/screens/GlobalSearchScreen.js`):**
Fixed 4 critical bugs in the search state machine:

- **Bug 1 (infinite loop)**: Effect B (auto-load on tab switch) removed `remoteResultsByFilter` from dependency array + `loadedFullRef` tracks which filter/query combos already loaded. Prevents re-fetch on every state change.
- **Bug 2 (race condition)**: `searchGenRef` (incrementing counter) added to both Effect A and Effect B — stale fetches from competing effects no longer overwrite each other.
- **Bug 3 (page calculation)**: Derived `Math.floor(items.length / PAGE_SIZE)` replaced with tracked `pageByFilter` state — deterministic pagination independent of API response size.
- **Bug 4 (total overwrite)**: `handleLoadMore` uses `Math.max` to preserve highest total across pages instead of replacing with each page's response total.

### E2E Web (`apps/web/tests/`)

**Mock API infrastructure:**

- `tests/fixtures/mockApi.js` — Playwright route interception for all `/api/v1/*` calls. Returns mock JSON instantly instead of hitting real backend.
- All 16 flow test files updated: import `setupApiMocks` in `beforeEach` + replaced `waitForTimeout(1000-3000ms)` with `waitForLoadState('networkidle')`.
- `smoke.spec.js` updated: 93 routes now use mock API, dashboard routes authenticate via `isAuthenticated: true`.
- Estimated speedup: **~4 min → ~1 min** (API calls return instantly, no 3s waits).

**Dashboard auth E2E:**

- `tests/flows/dashboard-auth.spec.js` — 9 new tests: 8 dashboard pages render for authenticated user + login redirects to dashboard when already logged in.
- `setupAuthenticatedPage` fixture: sets `localStorage` auth token + mocks `/api/v1/auth/me` to return valid user.
- `web-e2e` job added to CI workflow: installs Playwright chromium + runs `npx playwright test`.

### Mobile (`apps/mobile/`)

**Gesture handler integration:**

- `react-native-gesture-handler ~2.21.0` added to dependencies.
- `App.js` wrapped root with `GestureHandlerRootView`.
- `src/components/SwipeBackView.js` — PanResponder-based swipe-back gesture for internal views. Wraps each screen pane, activates when tab has an internal route open.
- `src/components/AppModalSheet.js` — enhanced with PanResponder drag-to-dismiss. User can swipe down on sheet handle to close.
- `jest.setup.js` — added mock for `react-native-gesture-handler`.

### Backend (`services/api/`)

**Performance:**

- DB pool: `MaxOpenConns 10→50`, `MaxIdleConns 10→25`
- GORM: `PrepareStmt: true`, `SkipDefaultTransaction: true`
- `pg_trgm` GIN indexes for all ILIKE search columns (translation.ar/idn/en, dll)
- Keyset/cursor pagination: `GET /hadiths/keyset` + `GET /ayah/keyset` (`WHERE id > cursor`)
- `SELECT *` reduction: Hadith compact 9-column select, Ayah limited select
- Preload→Joins migration: doa, dzikir, kajian — eliminated N+1 queries

**Caching:**

- `lib/cache.go` — Redis wrapper with `Remember` pattern, Prometheus metrics wired
- Per-key TTL: 15 static prefixes (surah, asmaul, doa, dll) = 300s, default = 60s
- 13 services with `WithCache` constructors: Surah, Doa, Dzikir, Fiqh, Manasik, Tafsir, Siroh, Kajian, Perawi, AsmaulHusna, Books, Themes, Chapters
- Cache invalidation on writes: 7 services bust cache on create/update/delete
- Redis optional: graceful fallback, no panic on Redis down

**Concurrency:**

- `errgroup` parallel queries: search "all" type (6 categories), sync endpoint (6 categories), dashboard (7 sources), surah detail (next/prev/ayahs)
- Parallel language filtering in search controller (4 goroutines)
- `recover()` in all fire-and-forget goroutines

**Monitoring:**

- Prometheus: `/metrics` with request count, duration, active requests, DB query duration, cache hit/miss
- Sentry: error tracking via `sentry-go`, fiber middleware, graceful skip if `SENTRY_DSN` unset
- Request ID: `X-Request-ID` middleware + structured `slog` logging
- pprof: `/debug/pprof/{heap,goroutine,profile,trace}` gated non-production
- Rate limit headers: 429 JSON with `retry_after`, skip `/metrics` and `/health`
- Deep healthcheck: `/health` tests DB ping + Redis ping + pool stats, returns 503 if degraded

**Infrastructure:**

- Graceful shutdown: `signal.NotifyContext(SIGTERM/SIGINT/SIGQUIT)`, 10s timeout
- DB connection retry: 5x with 2s backoff
- Pool exhaustion protection: returns 503 when `InUse >= MaxOpenConns - 2`
- Request timeout: 30s on master route group
- Migration/Seed split: `-migrate` / `-seed` CLI flags, auto-skip on startup
- Rate limits via env vars: `RATE_LIMIT_GLOBAL/_SEARCH/_AUTH/_DEV`
- Docker: `distroless/base:nonroot`, `HEALTHCHECK` via `-healthcheck` flag

**Documentation:**

- Swagger regenerated: 15 stale → 208 documented routes, 92 models
- All 57 controller files annotated with `@Router`, `@Summary`, `@Tags`, `@Param`
- `make swagger` target in root Makefile
- Feature docs enhanced: 50 files with `## Details` (API response shape, model fields, components)

**Testing (47 tests):**

- Search service: errgroup, totals, pagination, bounds (7 tests)
- Search repository: ILIKE for all 6 categories (build tag: postgres)
- Ayah, Hadith, Surah, Doa, Dzikir services (21 tests)

### Mobile (`apps/mobile/`)

**Test infrastructure:**

- Jest + jest-expo + `@testing-library/react-native`
- Config: `jest.config.js`, `babel.config.js`, `jest.setup.js`
- 530 tests total

**Coverage by layer:**

- API normalizers: `pickItems`, `appendQuery`, 7 `normalize*` functions (40 tests)
- API modules: auth, explore, personal, social (78 tests)
- Utils: deepLinks (27), qibla (10), compass (14), haptics (8), audioPlayer (8), push/prayer/smart notifications (24) = 91 tests
- Storage: preferences, session, recentSearches (21 tests)
- Navigation: appNavigation state machine (22 tests)
- Contexts: Session, Feedback, TabActivity (22 tests)
- Components: Screen, Card, Paper(8), ContentCard, TabBar, AppModalSheet, AppActionSheet, DetailHeader, SectionHeader, SessionCard, NotesPanel, NotificationCenter, OfflinePackCard (120 tests)
- Screens: all 9 — Qibla(12), Prayer(12), Profile(12), Hadith(12), Home(13), Ibadah(13), Explore(12), GlobalSearch(13), Quran(11) = 108 tests
- Data: theme, mobileFeatures (8 tests)
- Hook: useQuranReaderPreferences (15 tests)

### Web (`apps/web/`)

**Test infrastructure:**

- Jest + `@testing-library/react` + `@testing-library/jest-dom`
- Config: `jest.config.js` (next/jest), `jest.setup.js`
- 423 unit tests + 152 Playwright E2E = 575 total

**Unit coverage:**

- Pure functions: translation(16), search(10), khatamHelper(19), faraidh(19), puasaSunnah(18), tafsirContent(20), converter(9), personalSync(33), const(16) = 160 tests
- Libs: bookmarkLabels(7), share(6), copy(4), i18n(7) = 24 tests
- SearchClient: 22 tests (all tabs, Lihat Semua, Muat Lainnya, edges)
- Components: GradeBadge, SourceBadges, Skeleton, Spinner, CardHorizontal, Flag, Select, SmallDropdown, Section = 47 tests
- Layout: Navbar(9), Sidebar(7), Footer(7), Header, Layout = 25 tests
- Widgets: DailyAyah(5), DailyHadith(4), PrayerCountdown(4), PuasaSunnahPanel(5) = 18 tests
- Interactive: BookmarkButton(4), NoteButton(3) = 7 tests
- Contexts: Theme(4), Locale(12), Auth(15) = 31 tests
- Hooks: useLayoutMode(5), useQuranFont(5), useRequireAuth(5) = 15 tests

**E2E (Playwright):**

- Smoke: 93 routes (public + dashboard)
- User journeys: search(3), quran(3), hadith(2), doa(1), dzikir(2), auth(2), homepage(2), navigation(2), dashboard(8), tafsir(2), asmaul-husna(1), siroh+sejarah(2), fiqh+manasik+panduan+sholat+kiblat(5), calculators(5), learning(4), personal(6), extra pages(9)
- Total E2E: 152 tests

**Project total: ~1,152 tests**<br>
**+0 tests added (bug fixes + infra only)**

---

## Key Files to Know

| File                                              | Purpose                                                        |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `services/api/main.go`                            | Entry point, graceful shutdown, signal handling                |
| `services/api/app/http/routes.go`                 | All 230+ route definitions                                     |
| `services/api/app/lib/cache.go`                   | Redis cache wrapper with Prometheus metrics                    |
| `services/api/app/http/middlewares/metrics.go`    | Prometheus middleware                                          |
| `services/api/app/http/middlewares/request_id.go` | Request ID middleware                                          |
| `services/api/app/repository/repository.go`       | DB + cache adapter init, composite indexes                     |
| `apps/mobile/src/screens/GlobalSearchScreen.js`   | Global search with 7 category tabs                             |
| `apps/mobile/src/components/SwipeBackView.js`     | Swipe-back gesture wrapper for detail views                    |
| `apps/mobile/src/components/AppModalSheet.js`     | Bottom sheet modal with drag-to-dismiss                        |
| `apps/web/src/app/search/SearchClient.js`         | Web search client component                                    |
| `apps/web/tests/fixtures/mockApi.js`              | Playwright API mock fixture for E2E tests                      |
| `apps/web/tests/flows/dashboard-auth.spec.js`     | Authenticated dashboard E2E tests                              |
| `.github/workflows/test.yml`                      | CI pipeline (Go + Web Jest + Web Lint + Mobile Jest + Web E2E) |

---

## Known Issues / TODOs

1. ~~**CI pipeline incomplete**~~ ✅ Fixed — web (Jest + lint) dan mobile (Jest) jobs sudah ditambahkan. Semua trigger di `apps/web/**` dan `apps/mobile/**`.

2. ~~**E2E tests slow**~~ ✅ Fixed — Mock API fixture (`tests/fixtures/mockApi.js`) intercepts all `/api/v1/*` calls. `waitForTimeout` diganti `waitForLoadState`. Estimasi turun dari ~4m → ~1m.

3. ~~**Mobile screens**~~ ✅ Fixed — 4 bugs di GlobalSearchScreen sudah diperbaiki: infinite loop, race condition, page calculation, total overwrite.

4. ~~**Swagger docs**~~ ✅ Fixed — Semua 32 controller sudah dinormalisasi ke relative path (no `/api/v1/` prefix).

5. ~~**Mobile Gesture Handler / Reanimated**~~ ✅ Fixed — `react-native-gesture-handler` added, `GestureHandlerRootView` wrapping root. `SwipeBackView` untuk swipe-back gesture pada detail views. `AppModalSheet` support drag-to-dismiss via PanResponder.

6. ~~**Web Dashboard pages**~~ ✅ Fixed — `tests/flows/dashboard-auth.spec.js` dengan 9 E2E tests untuk authenticated dashboard flow. `setupAuthenticatedPage` fixture untuk mock auth.

7. ~~**Backend**~~ ✅ Fixed — `search_repository_test.go` restored `//go:build postgres` tag + migrated dari SQLite ke PostgreSQL (via env vars `DB_HOST`/etc). Tests cuma jalan di CI pake `-tags postgres` + PostgreSQL service container.

---

## Agent Instructions for Continuing

### To run tests:

```bash
# Backend Go (need .env.local)
cd services/api && go test -tags postgres ./app/... ./tests/... -count=1

# Mobile Jest
cd apps/mobile && npx jest --no-cache

# Web Jest
cd apps/web && npx jest --no-cache

# Web E2E Playwright
cd apps/web && npx playwright test --reporter=list

# All at once
cd services/api && go test -tags postgres ./... && cd ../../apps/mobile && npx jest --no-cache && cd ../web && npx jest --no-cache

# CI equivalent (dry-run)
act -j go-test -j web-test -j mobile-test -j go-lint -j web-lint
```

### Built with:

- **Go 1.26** — `services/api/`
- **Expo SDK 54** — `apps/mobile/`
- **Next.js 13.5.6** — `apps/web/`
- **PostgreSQL 18** + **Redis 8** — main datastores
- **Docker Compose** — local dev at root `docker-compose.yaml`

### Key commands:

```bash
make run-dev       # Start API
make swagger       # Regenerate swagger
make docker-up     # Docker compose
cd apps/mobile && npx expo start  # Mobile dev
cd apps/web && npm run dev         # Web dev
```
