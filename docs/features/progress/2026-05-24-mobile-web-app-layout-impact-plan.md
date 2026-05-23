# Mobile Web App Layout Impact Plan

Date: 2026-05-24
Status: IN_PROGRESS

## Context

Task #5 is high impact because the mobile app shell controls tab navigation,
hardware back, deep links, analytics, keyboard behavior, safe area, and all
screen rendering. The web-inspired layout must therefore be introduced as an
opt-in native layout mode, not as a rewrite of the current app.

## Baseline Findings

| File | Current role | Impact note |
| --- | --- | --- |
| `apps/mobile/App.js` | Main shell, tab state, deep links, back handler, screen panes, analytics, and current `TabBar` render | Highest-risk file. First implementation must preserve `classic` output. |
| `apps/mobile/src/storage/preferences.js` | Device preferences | `appLayoutMode` already exists. |
| `apps/mobile/src/screens/ProfileScreen.js` | Appearance settings | Layout mode can already be saved, but it does not yet switch the app shell. |
| `apps/mobile/src/components/TabBar.js` | Existing 5-tab bottom nav with auto-hide | Keep unchanged for `classic`; build separate `web_app` shell/nav if needed. |
| `apps/mobile/src/navigation/appNavigation.js` | Pure navigation state helpers | Must remain layout-agnostic. |
| `HomeScreen`, `QuranScreen`, `HadithScreen`, `IbadahScreen`, `ExploreScreen`, `ProfileScreen` | Feature-heavy screens | Reuse first; do not rewrite during shell foundation. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Breaking all mobile navigation | Keep one navigation state model; layout mode only chooses shell presentation. |
| Losing features in `web_app` | Use `docs/WEB_MOBILE_SYNC.md` and feature parity checker as acceptance gates. |
| Quran regressions | Do not touch Quran business logic in shell foundation; test audio/actions/preferences before rollout. |
| Auth/guest confusion | Public content must remain usable without login; personal actions use auth handoff or local-first storage. |
| Permission drift | Reuse native location/notification flows; no hardcoded district names. |
| Hard-to-revert UI | Default to `classic`; invalid/failed mode falls back to `classic`. |

## Recommended First Implementation Slice

1. Add `LayoutModeProvider` and `useLayoutModePreference`.
2. Read `preferenceKeys.appLayoutMode` with normalization:
   - valid: `classic`, `web_app`
   - fallback: `classic`
3. Wrap `App.js` with provider without changing `classic` render.
4. Add tests for provider/preference normalization.
5. Add a lightweight shell selection boundary, still rendering current shell
   for `classic`.

No visual redesign should happen in this first slice.

## Foundation Implementation Update

Status: completed for the non-visual foundation slice.

Implemented:

- Added `apps/mobile/src/layout/LayoutModeProvider.js`.
- Added `apps/mobile/src/hooks/useLayoutModePreference.js` as the stable hook
  entry for future shell/components.
- Added layout mode normalization for `classic` and `web_app`.
- Added fallback to `classic` for invalid stored preferences.
- Wrapped `apps/mobile/App.js` with `LayoutModeProvider` without changing the
  current `classic` render path.
- Connected `ProfileScreen` appearance layout selection to the provider setter
  so future shell selection can react to the same preference source.
- Added Jest coverage for normalization, stored preference read/write, provider
  load state, and provider setter.

Not implemented yet:

- No `WebAppShell` visual layer.
- No top header redesign.
- No new bottom nav/menu sheet.
- No Home/Quran visual remapping.

This keeps the first slice reversible and low impact.

## Acceptance Criteria Before Visual Work

- `classic` still renders exactly through the existing shell.
- Switching preference does not crash app startup.
- Invalid stored preference falls back to `classic`.
- Existing navigation tests pass.
- Existing profile settings tests pass.
- Feature parity checker still passes.

## Foundation Verification

Commands:

```bash
cd apps/mobile
npm test -- layoutModeProvider.test.js preferences.test.js profileScreen.test.js appNavigation.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-layout-foundation-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted foundation tests passed: 5 suites, 63 tests.
- Full mobile Jest passed: 43 suites, 586 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-layout-foundation-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Later Slices

| Slice | Scope |
| --- | --- |
| 2 | Add native `WebAppShell` skeleton with current screens inside it. Done as a non-visual delegate shell: `MobileAppShell` selects `ClassicAppShell` or `WebAppShell`, while `WebAppShell` still delegates to the classic shell render path. |
| 3 | Apply `web_app` header/bottom nav to Home and Quran only. |
| 4 | Validate Quran ayah action menu, audio range, qari, font size, notes, bookmark, and back behavior. |
| 5 | Expand to Hadith, Ibadah, and Belajar after Home/Quran are stable. |

## Shell Skeleton Update

Status: completed for the non-visual shell selection slice.

Implemented:

- Added `apps/mobile/src/layout/ClassicAppShell.js`.
- Added `apps/mobile/src/layout/WebAppShell.js`.
- Added `apps/mobile/src/layout/MobileAppShell.js`.
- Moved the existing safe-area, keyboard avoiding view, status bar, and current
  `TabBar` render path into `ClassicAppShell`.
- `MobileAppShell` now selects `ClassicAppShell` or `WebAppShell` from
  `useLayoutModePreference`.
- `WebAppShell` currently delegates to `ClassicAppShell`, with only a separate
  shell path/test id. This is intentional to avoid visual or navigation
  regression before Home/Quran-specific work.
- Added `mobileAppShell.test.js` for classic default and stored `web_app`
  shell selection.

Shell skeleton verification:

```bash
cd apps/mobile
npm test -- mobileAppShell.test.js layoutModeProvider.test.js preferences.test.js profileScreen.test.js appNavigation.test.js components.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-shell-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted shell tests passed: 7 suites, 149 tests.
- Full mobile Jest passed: 44 suites, 588 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-shell-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
