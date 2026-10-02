# Mobile Web App Peta Theme Parity

Status: completed for the native `web_app` Peta Islam Interaktif route theme
parity slice.

## Scope

- `HistoricalMapContent` now reads `isDarkTheme` separately from
  `isWebAppLayout`.
- Native mobile `web_app` Peta Islam uses explicit light and dark dashboard
  palettes for the route root, header, search input, chips, loading card,
  metadata, list rows, tags, and map container.
- The web fallback map list and native `react-native-maps` container both accept
  the same route palette.
- Classic/paper Peta Islam rendering remains unchanged.

## Verification

- `node --check apps/mobile/src/screens/HistoricalMapScreen.js`
- `node --check apps/mobile/src/screens/HistoricalMapView.js`
- `node --check apps/mobile/src/screens/HistoricalMapView.native.js`
- `cd apps/mobile && npm test -- historicalMapScreen.test.js --runInBand`
