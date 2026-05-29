# Web App Zakat Route Dashboard Parity

Status: completed for the native `web_app` Zakat route visual and interaction
parity pass.

Implemented:

- `web_app` Zakat now renders through `WebAppZakatRoute`, a dedicated
  dashboard calculator surface modeled after `/dashboard/zakat`: centered
  calculator hero, horizontal zakat tabs, white calculation panels, dashboard
  info boxes, native inputs, result cards, save action, history link, and
  disclaimer.
- Existing mobile Zakat state remains owned by `ExploreScreen`; the new route
  reuses the existing calculator values, setters, local history storage, account
  save API, delete behavior, and `WebAppZakatHistoryRoute`.
- Removed `zakat` from the generic local-tool wrapper so the route cannot
  regress to the generic card shell while classic/paper rendering remains
  unchanged.
- Added route coverage for calculator rendering, result output, history
  navigation, and dedicated history surface rendering.

Scope guardrail:

- This slice changes only native mobile Explore routing for layout `web_app`.
  It does not change classic Zakat rendering, calculation formulas, API
  endpoints, local calculator history storage, auth behavior, feature keys, or
  dashboard web pages.

Verification:

```bash
node --check apps/mobile/src/screens/explore/WebAppZakatRoute.js
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

- `node --check` passed for `WebAppZakatRoute.js` and
  `ExploreWebAppRoutes.js`.
- Targeted route test passed: 1 suite, 18 tests.
- Full mobile Jest passed: 48 suites, 717 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned, 64 dashboard page routes
  scanned.
- `git diff --check` passed.
- Line-count gate stayed clean.
