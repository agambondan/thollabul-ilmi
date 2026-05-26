# Codex Mobile Web App Parity

Status: done
Started: 2026-05-26 16:20 WIB

## Scope

- Route/feature: mobile `web_app` parity against authenticated `/dashboard`
  mobile web views.
- Near-term task: `Pencapaian` / `Achievements` route-depth parity against
  `/dashboard/achievements`, after validating that the previous route slice is
  already documented and verified.
- Files I may edit after route selection:
  - `apps/mobile/**`
  - relevant `apps/mobile` tests
  - `apps/web/src/app/dashboard/achievements/**`
  - achievement-specific web tests, if needed
  - route-specific `apps/web/**` files only if a confirmed web bug blocks parity
  - route-specific docs under `docs/**`
- Files I will avoid unless explicitly handed off:
  - `apps/web/src/__tests__/MushafAyahList.test.js`
  - `apps/web/src/app/dashboard/quran/page-mushaf/page.js`
  - `apps/web/src/app/quran/page-mushaf/page.js`
  - `apps/web/src/components/quran/MushafAyahList.js`
  - `apps/web/tests/flows/quran-reader-regression.spec.js`
  - `apps/web/tests/smoke.spec.js`

## Current Notes

- Existing dirty worktree files are all in the web Quran/Mushaf area and are
  treated as another agent's active scope.
- I will not continue to a new route until the previous mobile `web_app` slice
  is checked against the real web dashboard reference and tests.
- If I find a web-app bug while comparing a route, I will fix both web and
  mobile only inside that route's scope and update this claim first.
- Next active route selected: `achievements` / `Pencapaian`.

## Verification

- `cd apps/mobile && npm test -- profileScreen.test.js api-personal.test.js --runInBand` passed.
- `cd apps/web && npm test -- achievementPayload.test.js --runInBand` passed.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 636 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-achievements-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- `cd apps/web && npx eslint src/app/dashboard/achievements/page.js src/lib/achievementPayload.js src/__tests__/achievementPayload.test.js` blocked because local `apps/web/node_modules` is missing `typescript`.
