# Codex Mobile Web App Parity

Status: done
Started: 2026-05-26 16:20 WIB

## Scope

- Route/feature: mobile `web_app` parity against authenticated `/dashboard`
  mobile web views.
- Near-term task: `community-feed` / Feed Komunitas route-depth parity against
  `/dashboard/feed`, after validating that the previous Achievements slice is
  documented, tested, committed, and pushed.
- Files I may edit after route selection:
  - `apps/mobile/**`
  - relevant `apps/mobile` tests
  - `apps/web/src/app/dashboard/feed/**`
  - `apps/web/src/app/feed/**`
  - feed-specific web code/tests, if needed
  - route-specific `apps/web/**` files only if a confirmed web bug blocks parity
  - route-specific docs under `docs/**`
- Files I will avoid unless explicitly handed off:
  - `apps/web/src/__tests__/MushafAyahList.test.js`
  - `apps/web/src/app/dashboard/quran/page-mushaf/page.js`
  - `apps/web/src/app/quran/page-mushaf/page.js`
  - `apps/web/src/components/quran/MushafAyahList.js`
  - `apps/web/tests/flows/quran-reader-regression.spec.js`
  - `apps/web/tests/smoke.spec.js`
  - `apps/web/tests/fixtures/mockApi.js`
  - `apps/web/tests/flows/all-routes-ui-audit.spec.js`

## Current Notes

- Current refactor claim: mobile Quran large-file split only. I touched
  `apps/mobile/src/screens/QuranScreen.js`,
  `apps/mobile/src/screens/QuranScreen.helpers.js`,
  `apps/mobile/src/screens/QuranScreen.styles.js`, and
  `apps/mobile/src/screens/quran/QuranScreenRenderers.js`.
- Previous refactor claim: mobile Explore large-file split only. I touched
  `apps/mobile/src/screens/ExploreScreen.js`,
  `apps/mobile/src/screens/ExploreScreen.helpers.js`,
  `apps/mobile/src/screens/ExploreScreen.styles.js`, and
  `apps/mobile/src/screens/explore/*` route renderer files.
- `ExploreScreen.js`, `QuranScreen.js`, and `ProfileScreen.js` are now below
  the 2,000-line gate. No `apps/mobile/src/**/*.js` file remains above the
  gate after excluding the `wc` total row.
- I will not continue to a new route until the previous mobile `web_app` slice
  is checked against the real web dashboard reference and tests.
- If I find a web-app bug while comparing a route, I will fix both web and
  mobile only inside that route's scope and update this claim first.
- Next active route selected: `community-feed` / Feed Komunitas.
- Current gate for every new route:
  - compare against authenticated `/dashboard/*` mobile web behavior/surface;
  - preserve `classic` native layout;
  - fix scoped web bugs discovered during parity comparison;
  - run targeted mobile/web tests, full mobile Jest, feature parity checker,
    Expo export when mobile UI changed, and `git diff --check`;
  - do not edit unrelated dirty files owned by another agent.

## Verification

- `cd apps/mobile && npm test -- quranScreen.test.js --runInBand` passed: 1 suite, 19 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 639 tests.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed for the mobile Quran refactor files.
- Line-count gate after Quran split: `QuranScreen.js` 1753,
  `QuranScreenRenderers.js` 1986, `QuranScreen.styles.js` 1698, and
  `QuranScreen.helpers.js` 456.
- `cd apps/mobile && npm test -- exploreScreen.test.js --runInBand` passed: 1 suite, 36 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 639 tests.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed for the mobile Explore refactor files.
- Line-count gate after Explore split: `ExploreScreen.js` 1231,
  `ExploreClassicRenderers.js` 1947, `ExploreWebAppRoutes.js` 1421,
  `ExploreScreen.styles.js` 1571, `ExploreScreen.helpers.js` 659, and each
  extracted `WebApp*Route.js` file under 400 lines.
- `cd apps/mobile && npm test -- exploreScreen.test.js --runInBand` passed: 1 suite, 35 tests.
- `cd apps/web && npm test -- feedPagination.test.js --runInBand` passed: 1 suite, 3 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 637 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-feed-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- `cd apps/mobile && npm test -- profileScreen.test.js api-personal.test.js --runInBand` passed.
- `cd apps/web && npm test -- achievementPayload.test.js --runInBand` passed.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 636 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-achievements-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- `cd apps/web && npx eslint src/app/dashboard/achievements/page.js src/lib/achievementPayload.js src/__tests__/achievementPayload.test.js` blocked because local `apps/web/node_modules` is missing `typescript`.
