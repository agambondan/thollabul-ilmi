# Verification Log

Tanggal: `2026-05-13`
Scope: review static + build/test smoke

## Commands

### Web Lint

```bash
npm --prefix apps/web run lint
```

Result: `PASS WITH WARNINGS`

Warnings:

- `src/app/amalan/page.js`: missing hook dependencies `loadData`, `t`
- `src/app/hafalan/page.js`: missing hook dependency `load`
- `src/app/hijri/page.js`: missing hook dependency `t`
- `src/app/imsakiyah/page.js`: missing hook dependency `t`
- `src/app/kiblat/page.js`: missing hook dependency `getLocation`
- `src/app/leaderboard/page.js`: missing hook dependency `t`
- `src/app/tilawah/page.js`: missing hook dependency `load`

### API Tests

```bash
cd services/api
go test ./...
```

Result: `PASS`

Packages with tests passed:

- `app/db/migrations`
- `app/http`
- `app/http/middlewares`
- `app/services`
- `tests/controller`
- `tests/lib`

### Mobile Export

```bash
cd apps/mobile
npx expo export --platform android --dev --output-dir /tmp/thollabul-review-mobile-export
```

Result: `PASS`

Evidence:

- Android bundle generated.
- Quran font assets included:
    - `assets/fonts/kfc_naskh-webfont.ttf`
    - `assets/fonts/Kitab-Regular.ttf`
    - `assets/fonts/noorehidayat.ttf`
- output directory: `/tmp/thollabul-review-mobile-export`

## What This Does Not Prove

- tidak membuktikan endpoint yang dipanggil web/mobile benar-benar ada
- tidak membuktikan authenticated flow berjalan
- tidak membuktikan gesture Quran nyaman di device
- tidak membuktikan admin CRUD berhasil save/delete
- tidak membuktikan sync web/mobile sudah konsisten

Untuk itu tetap perlu device smoke, API smoke dengan auth token, dan minimal
Playwright route smoke untuk web/admin.

## Follow-up Verification 2026-05-13 Contract Sync

### Focused API Compile + Route Tests

```bash
cd services/api
go test ./app/controllers ./app/services ./app/repository ./app/http
```

Result: `PASS`

### Full API Test Suite

```bash
cd services/api
go test ./...
```

Result: `PASS`

Coverage:

- controller/service/repository interface compile untuk daily ayah, quiz admin,
  dan asbabun nuzul list
- duplicate route guard di `app/http`
- route presence guard untuk daily ayah, history, hijri convert, quiz admin,
  asbabun nuzul list, dan wirid

### Web API Client Syntax

```bash
node --check apps/web/src/lib/api.js
```

Result: `PASS`

### Web Lint After Contract Sync

```bash
npm --prefix apps/web run lint
```

Result: `PASS WITH EXISTING WARNINGS`

Warnings remained in:

- `src/app/amalan/page.js`
- `src/app/hafalan/page.js`
- `src/app/hijri/page.js`
- `src/app/imsakiyah/page.js`
- `src/app/kiblat/page.js`
- `src/app/leaderboard/page.js`
- `src/app/tilawah/page.js`

### Mobile Export After Contract Sync

```bash
cd apps/mobile
npx expo export --platform android --dev --output-dir /tmp/thollabul-contract-sync-mobile-export
```

Result: `PASS`

Evidence:

- Android bundle generated.
- output directory: `/tmp/thollabul-contract-sync-mobile-export`

Result: `PASS`

What this still does not prove:

- authenticated admin quiz/history/asbabun nuzul smoke di browser
- runtime DB query result untuk route baru dengan data production-like
- mobile Home render daily ayah di device nyata

## Follow-up Verification 2026-05-13 Asbabun/Fikih Admin Contract

### Focused API Tests

```bash
cd services/api
go test ./app/repository ./app/controllers ./app/services ./app/http
```

Result: `PASS`

Coverage:

- repository test untuk resolve ayah dari `surah_number + ayah_number`
- create Asbabun Nuzul dengan beberapa ayat di join table
- update Asbabun Nuzul yang mengganti relasi ayat

### Full API Test Suite

```bash
cd services/api
go test ./...
```

Result: `PASS`

### Web Page Syntax

```bash
node --check apps/web/src/app/admin/asbabun-nuzul/page.js
node --check apps/web/src/app/asbabun-nuzul/page.js
```

Result: `PASS`

### Web Lint

```bash
npm --prefix apps/web run lint
```

Result: `PASS WITH EXISTING WARNINGS`

Warnings remained in:

- `src/app/amalan/page.js`
- `src/app/hafalan/page.js`
- `src/app/hijri/page.js`
- `src/app/imsakiyah/page.js`
- `src/app/kiblat/page.js`
- `src/app/leaderboard/page.js`
- `src/app/tilawah/page.js`

### Whitespace Check

```bash
git diff --check
```

Result: `PASS`

### Mobile Export Sanity

```bash
cd apps/mobile
npx expo export --platform android --dev --output-dir /tmp/thollabul-contract-sync-mobile-export-2
```

Result: `PASS`

Evidence:

- Android bundle generated.
- output directory: `/tmp/thollabul-contract-sync-mobile-export-2`

## Follow-up Verification 2026-05-13 Runtime Smoke

### Source API Runtime Smoke

```bash
cd services/api
go run main.go
```

Runtime target: `http://localhost:9900`

Result: `PASS`

Coverage:

- authenticated temporary admin register/login
- `GET /api/v1/asbabun-nuzul?page=0&size=2`
- `POST /api/v1/asbabun-nuzul` with `ayah_refs` `2:6` and `2:7`
- `PUT /api/v1/asbabun-nuzul/:id` replacing relation with `ayah_refs` `2:8`
- `DELETE /api/v1/asbabun-nuzul/:id`

Observed output:

```text
list items: 2 first ref: {"surah_number":2,"ayah_number":158}
mutation id: 217 refs: [{"surah_number":2,"ayah_number":8}]
deleted id: 217
```

### Web Admin Browser Smoke

```bash
NEXT_PUBLIC_API_URL=http://localhost:9900 npm run dev -- -p 3001
```

Runtime target: `http://localhost:3001/admin/asbabun-nuzul`

Result: `PASS`

Coverage:

- authenticated admin state injected in browser localStorage
- add Asbabun Nuzul row with ayat range `2:9-10`
- edit row to ayat `2:11`
- delete row and verify row removed

Observed output:

```json
{
    "status": "created-updated-deleted",
    "title": "Codex UI Smoke 1778675597748",
    "updatedTitle": "Codex UI Smoke 1778675597748 Updated"
}
```

### Docker Rebuild + API Smoke

Before rebuild, Docker API `http://localhost:29900` was stale:

```text
GET /api/v1/asbabun-nuzul?page=0&size=1 -> 405 Method Not Allowed
```

Rebuild command:

```bash
docker compose up -d --build tholabul-ilmi-api tholabul-ilmi-web
```

Result: `PASS`

Post-rebuild checks:

```bash
curl -i 'http://localhost:29900/api/v1/asbabun-nuzul?page=0&size=1'
```

Result: `200 OK`

Authenticated Docker API mutation smoke:

```text
{
  "status": "created-updated-deleted",
  "id": 219,
  "refs": [
    {
      "surah_number": 2,
      "ayah_number": 8
    }
  ]
}
```

### Device Smoke

```bash
adb devices -l
```

Result: `PENDING`

Evidence:

```text
List of devices attached
```

No device was visible to ADB during this verification pass.

## Follow-up Verification 2026-05-13 Ayah Repository Lookup

### Repository Query Test

```bash
cd services/api
go test ./app/repository
```

Result: `PASS`

Coverage:

- joined pagination query for `FindAll`
- joined pagination query for `FindByNumber`
- joined pagination query for `FindBySurahNumber`
- direct lookups for `FindByPage`, `FindByHizbQuarter`, and `FindDaily`

### Focused API Packages

```bash
cd services/api
go test ./app/controllers ./app/services ./app/repository ./app/http
```

Result: `PASS`

Notes:

- `ayah_repository.go` now qualifies joined sort columns with `"ayah".id` to
  avoid ambiguous `id` references when Translation and Surah tables are joined.

## Follow-up Verification 2026-05-13 Daily Ayah Count

### Focused API Packages

```bash
cd services/api
go test ./app/services ./app/controllers ./app/repository ./app/http
```

Result: `PASS`

Coverage:

- `AyahService.FindDaily` now derives the daily ayah number from the actual
  repository count instead of the controller hardcoding `6236`.
- `services/api/app/services/ayah_service_test.go` verifies the selected daily
  ayah number stays within DB count and returns an error when count is empty.

## Follow-up Verification 2026-05-13 Mobile Search Quran Target

Command:

```bash
cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-search-target-export
```

Result: `PASS`

Coverage:

- Expo bundle/parse succeeds after Quran Global Search target auto-scroll change.
- Search result preview in Quran reader is structurally compacted to avoid duplicate full ayah render.

Remaining:

- Device smoke still needed for Global Search query -> Quran result tap -> visual scroll/highlight behavior.

## Follow-up Verification 2026-05-13 Mobile Quran Gesture Path

Command:

```bash
cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-quran-gesture-export
```

Result: `PASS`

Coverage:

- Expo bundle/parse succeeds after removing `PanResponder` from Quran reader gesture handling.
- Quran reader now has one swipe path via touch tracking and existing edge guard.

Remaining:

- Device smoke still needed for Quran non-mushaf swipe surah and mushaf swipe page behavior on Android hardware.

## Follow-up Verification 2026-05-13 Mobile Sticky Modal Footer

Command:

```bash
cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-sticky-modal-footer-export
```

Result: `PASS`

Coverage:

- Expo bundle/parse succeeds after `AppModalSheet` footer is made sticky by default.
- `AppActionSheet` now forwards `footer` to the shared modal footer slot.

Remaining:

- Device smoke still needed for long modal/action-sheet interactions on Android hardware.

## Follow-up Verification 2026-05-13 Mobile Global Search Polish

Command:

```bash
cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-global-search-polish-export
```

Result: `PASS`

Coverage:

- Expo bundle/parse succeeds after Global Search result rows move to shared
  `ContentCard`.
- Contextual empty states, search loading skeleton, result counts, partial
  failure handling, and user-facing metadata cleanup are structurally covered.

Remaining:

- Device smoke still needed for tapping Quran, Hadis, Doa, Kajian, Feature,
  Kamus, and Perawi results on Android hardware.

## Follow-up Verification 2026-05-13 Static Content Repository Coverage

Commands:

```bash
cd services/api && go test ./app/repository
cd services/api && go test ./app/controllers ./app/services ./app/repository ./app/http
```

Result: `PASS`

Coverage:

- Static admin content repositories now have focused coverage for Dzikir,
  Tahlil, Manasik, and Fiqh CRUD behavior.
- Tests assert translation row creation/update, Tahlil repeat normalization,
  Manasik step ordering, and Fiqh `source`/`dalil` separation.

## Follow-up Verification 2026-05-14 Stabilize Batch

### Chronicle Context

Chronicle context was refreshed for:

- Personal Data Sync P0
- Mobile Quran Reader Polish
- Mobile Search and Discovery
- Mobile Smart Notifications

### Web Personal Sync

```bash
node --check apps/web/src/lib/personalSync.js && node --check apps/web/src/lib/api.js
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Result:

- syntax check: `PASS`
- lint: `PASS WITH EXISTING WARNINGS`
- build: `PASS`

Coverage:

- dashboard summary/profile/stats now use API-first personal data when logged in
- goals/muhasabah/notes no longer silently catch sync failures
- sholat dashboard counters normalize `Shubuh` to API key `subuh`

### Device Smoke

```bash
adb devices -l
make mobile-status
adb shell am start -a android.intent.action.VIEW -d 'exp://10.13.55.208:19007/--/quran/2' host.exp.exponent
adb shell am start -a android.intent.action.VIEW -d 'exp://10.13.55.208:19007/--/search?q=shalat' host.exp.exponent
```

Result:

- device detected: `POCOPHONE_F1`
- Expo active: `exp://10.13.55.208:19007`
- API active: `http://localhost:9900`
- `adb reverse` active for `19007` and `9900`
- Quran deep link opened without fatal/redbox/network error in logcat snapshot
- Search deep link opened without fatal/redbox/network error in logcat snapshot

Screenshots:

- `/tmp/thollabul-smoke/current-2026-05-14.png`
- `/tmp/thollabul-smoke/quran-2-2026-05-14.png`
- `/tmp/thollabul-smoke/search-2026-05-14.png`

### API Smoke

```bash
curl 'http://localhost:9900/api/v1/search?q=shalat&type=all&limit=18'
curl 'http://localhost:9900/api/v1/ayah/page/2'
curl 'http://localhost:9900/api/v1/feed?page=0&size=5'
curl 'http://localhost:9900/api/v1/notifications/settings'
```

Result:

- search: `HTTP 200`
- Quran page 2: `HTTP 200`
- feed: `HTTP 200`
- notification settings without token: `HTTP 401`, expected for personal endpoint

Limitations:

- authenticated browser smoke for dashboard personal sync was not run because
  no browser auth token was used in this session.
- Android tap/swipe/keyevent automation is still blocked by MIUI `INJECT_EVENTS`,
  so Quran gesture and search-result tap require manual device validation.
