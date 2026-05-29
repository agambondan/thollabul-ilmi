# Web App User Wird Route Dashboard Parity

Status: completed for the native `web_app` Wirid Pribadi route visual and
interaction parity pass.

Implemented:

- `web_app` User Wird now renders through `WebAppUserWirdRoute`, a dedicated
  dashboard surface modeled after `/dashboard/wirid-custom`: title/subtitle,
  add action, signed-out login prompt, summary tiles, white personal-wird
  cards, count badges, edit/delete actions, and a modal form for create/edit.
- Existing mobile User Wird API/state handlers remain owned by `ExploreScreen`;
  the new route only changes the `web_app` presentation and reuses
  `submitUserWird`, `removeUserWird`, and form state.
- Removed `user-wird` from the generic local-tool wrapper so the route cannot
  regress to the generic card shell while classic/paper rendering remains
  unchanged.
- Added route coverage for signed-out and signed-in dashboard surfaces,
  including profile navigation, edit form opening, and delete action wiring.

Scope guardrail:

- This slice changes only native mobile Explore routing for layout `web_app`.
  It does not change classic User Wird rendering, API endpoints, validation,
  create/update/delete handlers, auth gating, or dashboard web pages.

Verification:

```bash
node --check apps/mobile/src/screens/explore/WebAppUserWirdRoute.js
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

- `node --check` passed for `WebAppUserWirdRoute.js` and
  `ExploreWebAppRoutes.js`.
- Targeted route test passed: 1 suite, 16 tests.
- Full mobile Jest passed: 48 suites, 711 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned, 64 dashboard page routes
  scanned.
- `git diff --check` passed.
- Line-count gate stayed clean: no `apps/mobile/src/**/*.js` file is above the
  2,000-line gate.
