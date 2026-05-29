# Web App Faraidh Route Dashboard Parity

Status: completed for the native `web_app` Faraidh route visual and interaction
parity pass.

Implemented:

- `web_app` Faraidh now renders through `WebAppFaraidhRoute`, a dedicated
  dashboard calculator surface modeled after `/dashboard/faraidh`: Arabic
  heading, calculator hero, disclaimer notice, white wealth/heirs/result
  panels, heir steppers, result rows, save action, and history view.
- Existing mobile Faraidh state remains owned by `ExploreScreen`; the new route
  reuses the existing calculation helper, local calculator history storage,
  account save/delete APIs, feedback messages, and auth behavior.
- Removed `faraidh` from the generic local-tool wrapper so the route cannot
  regress to the generic card shell while classic/paper rendering remains
  unchanged.
- Added route coverage for calculator rendering, heir update wiring, result
  output, and dedicated history surface rendering.

Scope guardrail:

- This slice changes only native mobile Explore routing for layout `web_app`.
  It does not change classic Faraidh rendering, calculation formulas, API
  endpoints, local calculator history storage, auth behavior, feature keys, or
  dashboard web pages.

Verification:

```bash
node --check apps/mobile/src/screens/explore/WebAppFaraidhRoute.js
node --check apps/mobile/src/screens/explore/ExploreWebAppRoutes.js
cd apps/mobile
npm test -- exploreWebAppRoutes.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
find apps/mobile/src -name '*.js' -print0 | xargs -0 wc -l | sort -nr | head -8
```

Results:

- `node --check` passed for `WebAppFaraidhRoute.js` and
  `ExploreWebAppRoutes.js`.
- Targeted route test passed: 1 suite, 20 tests.
- Full mobile Jest passed: 48 suites, 721 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned, 64 dashboard page routes
  scanned.
- `git diff --check` passed.
- Line-count gate stayed clean.
