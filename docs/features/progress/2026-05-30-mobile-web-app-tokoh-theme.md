# Web App Tokoh Route Theme Parity

Status: completed for the native `web_app` Tokoh Tarikh route theme parity
pass.

Implemented:

- `TokohTarikhContent` now reads `isDarkTheme` separately from
  `isWebAppLayout` and applies dashboard-aligned light/dark palettes to the
  route surface, header, search input, era chips, loading/empty states, tokoh
  cards, avatar fallback, and modal detail surface.
- Classic/paper Tokoh rendering remains unchanged.
- Added regression coverage for both light and dark `web_app` Tokoh palettes.

Scope guardrail:

- This slice changes only native mobile Tokoh presentation in layout
  `web_app`. It does not change endpoint calls, search/filter parameters,
  modal detail behavior, feature keys, or dashboard web pages.

Verification:

```bash
node --check apps/mobile/src/screens/TokohTarikhContent.js
cd apps/mobile
npm test -- tokohTarikhContent.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
find apps/mobile/src -name '*.js' -print0 | xargs -0 wc -l | sort -nr | head -8
```

Results:

- `node --check` passed for `TokohTarikhContent.js`.
- Targeted Tokoh test passed: 1 suite, 4 tests.
- Full mobile Jest passed: 48 suites, 726 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned, 64 dashboard page routes
  scanned.
- `git diff --check` passed.
- Line-count gate stayed clean.
