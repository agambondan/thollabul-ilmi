# Mobile Web App Explore Theme Parity

Status: completed for the native `web_app` Belajar/Explore catalog theme parity
slice.

## Scope

- `ExploreScreen` now passes the active light/dark web-app theme into the
  Belajar catalog route renderer.
- The Belajar catalog root, hero, search field, empty state, section labels,
  feature tiles, badges, icons, and pin buttons now use shared web-app theme
  styles instead of a single hardcoded dark palette.
- Classic Explore rendering remains unchanged.

## Verification

- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `node --check apps/mobile/src/screens/explore/ExploreWebAppRoutes.js`
- `node --check apps/mobile/src/screens/explore/FeatureCatalog.js`
- `node --check apps/mobile/src/screens/explore/ExploreWebAppTheme.js`
- `cd apps/mobile && npm test -- exploreWebAppRoutes.test.js exploreScreen.test.js --runInBand`
- `cd apps/mobile && npm test -- --runInBand`
- `node scripts/check-feature-parity.js`
- `git diff --check`
- `find apps/mobile/src -name '*.js' -print0 | xargs -0 wc -l | sort -nr | head -10`

Results:

- Targeted Explore tests passed: 2 suites, 64 tests.
- Full mobile Jest passed: 48 suites, 730 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned, and 64 dashboard page routes
  scanned.
- Line-count gate stayed clean: no `apps/mobile/src/**/*.js` file is above
  2,000 lines.
