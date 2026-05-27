# Codex Mobile Web App Parity

Status: done
Started: 2026-05-26 16:20 WIB

## Scope

- Route/feature: mobile `web_app` parity against authenticated `/dashboard`
  mobile web views.
- Completed near-term task: Kamus Arab `web_app` route parity against
  `/dashboard/kamus`, after validating the Forum Q&A slice was clean.
- Files I may edit after route selection:
  - `apps/mobile/**`
  - relevant `apps/mobile` tests
  - `apps/mobile/src/screens/explore/WebAppKamusRoute.js`
  - Kamus/Explore-specific tests/docs
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
- Last completed route: Kamus Arab. Next active route is not selected
  yet, to avoid colliding with another active agent.
- Current gate for every new route:
  - compare against authenticated `/dashboard/*` mobile web behavior/surface;
  - preserve `classic` native layout;
  - fix scoped web bugs discovered during parity comparison;
  - run targeted mobile/web tests, full mobile Jest, feature parity checker,
    Expo export when mobile UI changed, and `git diff --check`;
  - do not edit unrelated dirty files owned by another agent.

## Verification

- `node --check apps/mobile/src/api/client.js` passed.
- `node --check apps/mobile/src/screens/HomeScreen.js` passed.
- `node --check apps/mobile/src/screens/home/HomeDashboardContent.js` passed.
- `cd apps/mobile && npm test -- homeScreen.test.js --runInBand` passed: 1 suite, 23 tests.
- `cd apps/mobile && npm test -- homeScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand` passed: 3 suites, 46 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 46 suites, 662 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-home-reminders-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Home reminder line-count gate: `HomeScreen.js` 909, `HomeDashboardContent.js` 1211, `client.js` 745, `homeScreen.test.js` 587, and no `apps/mobile/src/**/*.js` file remains above 2,000 lines after excluding the `wc` total row.
- `cd apps/mobile && npm test -- exploreScreen.test.js api-explore.test.js --runInBand` passed: 2 suites, 56 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 46 suites, 662 tests.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Browser mobile smoke captured `/dashboard/fiqh` and native `#/belajar/fiqh`
  at 412x915 in `output/playwright/`.
- `/dashboard/fiqh` and native Fiqh filters/cards now use API `slug` as the
  category fallback when `category` is absent, so the filter works and the
  card badge does not render blank.
- `cd apps/web && npx eslint src/app/dashboard/fiqh/page.js` could not run
  because local `apps/web/node_modules` is missing `typescript`.
- `cd apps/web && npm run build` passed.
- Fiqh line-count gate: `ExploreScreen.js` 1234, `ExploreWebAppRoutes.js`
  1468, `WebAppFiqhRoute.js` 421, and `exploreScreen.test.js` 1709.
- `cd apps/mobile && npm test -- exploreScreen.test.js --runInBand` passed: 1 suite, 40 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 46 suites, 663 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-forum-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Forum route line-count gate: `ExploreScreen.js` 1278,
  `ExploreWebAppRoutes.js` 1549, `WebAppForumRoute.js` 773, and
  `exploreScreen.test.js` 1749.
- `cd apps/mobile && npm test -- exploreScreen.test.js api-explore.test.js --runInBand` passed: 2 suites, 58 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 46 suites, 664 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-kamus-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Kamus route line-count gate: `ExploreScreen.js` 1283,
  `ExploreWebAppRoutes.js` 1570, `WebAppKamusRoute.js` 303, `exploreScreen.test.js`
  1792, and `api-explore.test.js` 241.
- `node --check apps/mobile/src/screens/TokohTarikhContent.js` passed.
- `node --check apps/mobile/src/__tests__/tokohTarikhContent.test.js` passed.
- `cd apps/mobile && npm test -- tokohTarikhContent.test.js --runInBand` passed: 1 suite, 3 tests.
- `cd apps/mobile && npm test -- tokohTarikhContent.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand` passed: 3 suites, 26 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 46 suites, 661 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-tokoh-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Tokoh Tarikh line-count gate: `TokohTarikhContent.js` 610, `tokohTarikhContent.test.js` 94, and no `apps/mobile/src/**/*.js` file remains above 2,000 lines after excluding the `wc` total row.
- `node --check apps/mobile/src/screens/HistoricalMapScreen.js` passed.
- `node --check apps/mobile/src/screens/HistoricalMapView.js` passed.
- `node --check apps/mobile/src/screens/HistoricalMapView.native.js` passed.
- `node --check apps/mobile/src/__tests__/historicalMapScreen.test.js` passed.
- `node --check apps/web/src/app/peta/MapComponent.js` passed.
- `cd apps/mobile && npm test -- historicalMapScreen.test.js --runInBand` passed: 1 suite, 3 tests.
- `cd apps/mobile && npm test -- historicalMapScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand` passed: 3 suites, 26 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 45 suites, 658 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-peta-route-export` passed.
- `cd apps/web && npm run build` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- `node --check apps/mobile/src/screens/quran/QuranScreenRenderers.js` passed.
- `node --check apps/mobile/src/screens/QuranScreen.styles.js` passed.
- `cd apps/mobile && npm test -- quranScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand` passed: 3 suites, 43 tests.
- Quran reader line-count gate: `QuranScreen.js` 1791, `QuranScreenRenderers.js` 1922, `QuranScreen.styles.js` 1843, `quranScreen.test.js` 677, and no `apps/mobile/src/**/*.js` file remains above 2,000 lines after excluding the `wc` total row.
- `node --check apps/mobile/src/screens/HadithScreen.js` passed.
- `cd apps/mobile && npm test -- hadithScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand` passed: 3 suites, 39 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 655 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-hadith-detail-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Hadith detail line-count gate: `HadithScreen.js` 1890, `hadithScreen.test.js` 440, and no `apps/mobile/src/**/*.js` file remains above 2,000 lines after excluding the `wc` total row.
- `node --check apps/mobile/src/screens/QiblaScreen.js` passed.
- `cd apps/mobile && npm test -- QiblaScreen.test.js qibla.test.js compass.test.js ibadahScreen.test.js --runInBand` passed: 4 suites, 53 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 654 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-qibla-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Qibla line-count gate: `QiblaScreen.js` 1213, `QiblaScreen.test.js` 358, and no `apps/mobile/src/**/*.js` file remains above 2,000 lines after excluding the `wc` total row.
- `node --check apps/mobile/src/screens/KhatamScreen.js` passed.
- `cd apps/mobile && npm test -- khatam.test.js khatamUtils.test.js ibadahScreen.test.js --runInBand` passed: 3 suites, 24 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 652 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-khatam-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `git diff --check` passed.
- Khatam line-count gate: `KhatamScreen.js` 795, `khatam.test.js` 220, and no `apps/mobile/src/**/*.js` file remains above 2,000 lines after excluding the `wc` total row.
- `cd apps/mobile && npm test -- PrayerScreen.test.js ibadahScreen.test.js --runInBand` passed: 2 suites, 28 tests.
- `cd apps/mobile && npm test -- PrayerScreen.test.js ibadahScreen.test.js quranScreen.test.js useQuranReaderPreferences.test.js --runInBand` passed: 4 suites, 65 tests.
- `cd apps/mobile && npm test -- --runInBand` passed: 44 suites, 648 tests.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-prayer-route-export` passed.
- `node scripts/check-feature-parity.js` passed.
- `npx playwright screenshot --channel=chrome --viewport-size=390,844 ... http://localhost:19006/#/ibadah/jadwal-sholat output/native-smoke/prayer-webapp-route.png` captured the mobile web_app Prayer route; first capture exposed horizontal input overflow, fixed before final capture.
- Line-count gate after Prayer/Quran audio panel split: `PrayerScreen.js` 1860, `QuranScreenRenderers.js` 1889, `QuranAudioRangePanel.js` 278, and no `apps/mobile/src/**/*.js` file remains above 2,000 lines.
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
