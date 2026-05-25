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
| 3 | Apply `web_app` header/bottom nav to Home and Quran only. In progress: shell chrome is now active for all existing screen panes when `web_app` is selected, without changing screen internals. |
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

## Web App Shell Chrome Update

Status: completed for the first visual shell slice.

Implemented:

- Added `apps/mobile/src/layout/MobileTopHeader.js` for the native
  `web_app` brand/account header.
- Added `apps/mobile/src/layout/MobileBottomNav.js` for the native
  `web_app` 5-tab bottom navigation.
- Updated `WebAppShell` to use the new header/nav while keeping the same
  existing screen panes and tab keys.
- Kept `ClassicAppShell` and the existing `TabBar` unchanged for `classic`.
- Added profile entry handling from the `web_app` header account control.
- Added Jest coverage for web-app shell chrome render, profile entry,
  bottom-nav routing, and keyboard bottom-nav hiding.

Not implemented in this slice:

- No Home/Quran screen content remap yet.
- No bottom-sheet feature menu yet.
- No reader/action behavior changes.

Chrome verification:

```bash
cd apps/mobile
npm test -- mobileAppShell.test.js layoutModeProvider.test.js components.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-shell-chrome-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted shell chrome tests passed: 3 suites, 95 tests.
- Full mobile Jest passed: 44 suites, 591 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-shell-chrome-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Shell Account Header Update

Status: completed for guest/auth-aware header behavior.

Implemented:

- `WebAppShell` now reads `SessionContext` for the current mobile user.
- Header account avatar uses the user name first, then email, then guest label
  `Tamu`.
- Guest users still see the web-app-style shell without being forced to login.
- Profile entry behavior remains the same: tapping the header account control
  opens the existing `profile` tab.
- Added Jest coverage for guest label fallback, logged-in user initial, and
  label helper behavior.

Verification:

```bash
cd apps/mobile
npm test -- mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-auth-header-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted shell tests passed: 2 suites, 13 tests.
- Full mobile Jest passed: 44 suites, 593 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-auth-header-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Shell Menu Sheet Update

Status: completed for the initial secondary menu-sheet foundation.

Implemented:

- Added `apps/mobile/src/layout/MobileMenuSheet.js`.
- Added a header menu button in `MobileTopHeader` for `web_app` mode.
- `WebAppShell` now owns menu visibility state and closes the sheet after
  selection.
- Menu shortcuts route through the same existing `onTabChange` handler for
  `home`, `quran`, `hadith`, `ibadah`, and `belajar`.
- Profile shortcut routes through the same existing `onOpenProfile` handler.
- `classic` shell and existing `TabBar` remain unchanged.

Scope guardrail:

- This is only a shell-level bottom-sheet foundation. It does not move or
  remove any Home/Quran/Hadith/Ibadah/Belajar feature logic yet.

Verification:

```bash
cd apps/mobile
npm test -- mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-menu-sheet-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted shell tests passed: 2 suites, 16 tests.
- Full mobile Jest passed: 44 suites, 596 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-menu-sheet-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Home Surface Update

Status: completed for the first opt-in Home surface remap.

Implemented:

- `HomeScreen` now reads `useLayoutModePreference`.
- In `web_app` mode, Home hides the duplicate in-screen profile header because
  the shell already provides brand/account controls.
- In `web_app` mode, Home shows a compact dashboard-style greeting with the
  current user/guest name and Gregorian date.
- Prayer, quick actions, daily ayah/hadith, pinned features, recent features,
  and journal entry still use the same existing data and action handlers.
- Added opt-in web-app styling to the Home screen background, prayer card,
  quick action grid, and daily content card.
- `classic` Home header and behavior remain unchanged.

Scope guardrail:

- This slice does not rewrite Home data loading, prayer location behavior,
  daily content fetching, or feature navigation. It only changes the Home
  presentation when `web_app` layout is active.

Verification:

```bash
cd apps/mobile
npm test -- homeScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-home-remap-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Home/shell tests passed: 3 suites, 35 tests.
- Full mobile Jest passed: 44 suites, 597 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-home-remap-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Quran Surface Update

Status: completed for the first opt-in Quran surface pass.

Implemented:

- `QuranScreen` now reads `useLayoutModePreference`.
- In `web_app` mode, Quran list, reader, and mushaf reader use the web-app
  surface background and compact vertical padding.
- Added explicit test IDs for classic and `web_app` Quran list/reader surfaces
  so future layout work can verify the active path.
- Audio range, ayah action sheet, tafsir/asbab/munasabah/hadith references,
  bookmark, notes, reader preferences, and pagination logic remain unchanged.
- `classic` Quran list/reader surfaces remain available and covered.

Scope guardrail:

- This slice only changes the presentational container for Quran surfaces in
  `web_app` mode. It does not move ayah actions, change reader display modes,
  alter audio fetching, or change bookmark/notes behavior.

Verification:

```bash
cd apps/mobile
npm test -- quranScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-quran-surface-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Quran/shell tests passed: 3 suites, 33 tests.
- Full mobile Jest passed: 44 suites, 599 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-quran-surface-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Hadith Surface Update

Status: completed for the first opt-in Hadith surface pass.

Implemented:

- `HadithScreen` now reads `useLayoutModePreference`.
- In `web_app` mode, Hadith list and detail screens use the web-app surface
  wrapper.
- Added explicit test IDs for classic and `web_app` Hadith list/detail surfaces.
- Hadith fetching, book filters, search, detail tabs, related ayah navigation,
  bookmark, notes, sanad, perawi, and takhrij logic remain unchanged.
- `classic` Hadith list/detail surfaces remain available and covered.

Scope guardrail:

- This slice only changes the presentational container for Hadith surfaces in
  `web_app` mode. It does not change data loading or feature handlers.

Verification:

```bash
cd apps/mobile
npm test -- hadithScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-hadith-surface-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Hadith/shell tests passed: 3 suites, 31 tests.
- Full mobile Jest passed: 44 suites, 601 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-hadith-surface-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Ibadah Surface Update

Status: completed for the first opt-in Ibadah hub surface pass.

Implemented:

- `IbadahScreen` hub now reads `useLayoutModePreference`.
- In `web_app` mode, the Ibadah hub uses the web-app surface wrapper.
- Added explicit test IDs for classic and `web_app` Ibadah hub surfaces.
- Jadwal Sholat, Qibla, Khatam, and feature-key routing to Belajar remain
  unchanged.
- `classic` Ibadah hub remains available and covered.

Scope guardrail:

- This slice only changes the presentational container for the Ibadah hub in
  `web_app` mode. It does not change sub-view routing, Prayer/Qibla/Khatam
  screens, or feature availability.

Verification:

```bash
cd apps/mobile
npm test -- ibadahScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-ibadah-surface-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Ibadah/shell tests passed: 3 suites, 31 tests.
- Full mobile Jest passed: 44 suites, 602 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-ibadah-surface-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Explore/Belajar Surface Update

Status: completed for the first opt-in Explore/Belajar surface pass.

Implemented:

- `ExploreScreen` now reads `useLayoutModePreference`.
- In `web_app` mode, the Belajar catalog, active feature view, and detail view
  use the web-app surface wrapper.
- Added explicit test IDs for classic and `web_app` Explore surfaces.
- Feature catalog search, pinned/recent features, forum, feed, notes,
  bookmarks, library progress, tafsir, quiz, calculators, and local tools keep
  their existing handlers.
- `classic` Explore/Belajar surfaces remain available and covered.

Scope guardrail:

- This slice only changes the presentational container for Explore/Belajar in
  `web_app` mode. It does not change feature routing, API fetching, personal
  data handlers, or forum/feed behavior.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-explore-surface-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Explore/shell tests passed: 3 suites, 37 tests.
- Full mobile Jest passed: 44 suites, 603 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-explore-surface-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- Explore test warning cleaned up: the test mock now renders list data
  synchronously instead of mounting React Native `VirtualizedList`.
- Follow-up coverage verifies that the `web_app` Explore surface remains active
  after opening an Explore feature, so subfeatures such as Kamus, Tokoh Tarikh,
  and Peta Islam stay covered by the parent layout wrapper.
- Follow-up verification passed: targeted Explore/shell tests passed 3 suites,
  37 tests; full mobile Jest passed 44 suites, 609 tests; feature parity checker
  passed with 50 manifest features, 14 utility routes, 43 mobile feature keys,
  and 154 web app routes scanned.

## Web App Ibadah Sub-Screen Surface Update

Status: completed for the first opt-in Ibadah sub-screen surface pass.

Implemented:

- `PrayerScreen`, `QiblaScreen`, and `KhatamScreen` now read
  `useLayoutModePreference` for presentation only.
- In `web_app` mode, Jadwal Sholat main/settings, Qibla, and Khatam screens use
  the web-app surface wrapper.
- Added explicit test IDs for classic and `web_app` surfaces on the affected
  sub-screens.
- Prayer location permission, manual coordinates, prayer-time fetching,
  correction settings, reminder scheduling, adzan audio toggle, offline prayer
  pack, Qibla compass math, Qibla manual location, and Khatam progress routing
  keep their existing handlers.
- `classic` Prayer/Qibla/Khatam surfaces remain available and covered.

Scope guardrail:

- This slice only changes presentational containers in `web_app` mode. It does
  not change GPS permission flow, notification scheduling, audio playback,
  offline pack data, compass animation/math, or Quran progress APIs.

Verification:

```bash
cd apps/mobile
npm test -- PrayerScreen.test.js QiblaScreen.test.js khatam.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-ibadah-subscreen-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Ibadah sub-screen/shell tests passed: 5 suites, 44 tests.
- Full mobile Jest passed: 44 suites, 607 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-ibadah-subscreen-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Profile/Settings Surface Update

Status: completed for the first opt-in Profile and settings surface pass.

Implemented:

- `ProfileScreen` now reads `useLayoutModePreference` for presentation only.
- In `web_app` mode, Profile main content and Profile sub-screens use the
  web-app surface wrapper.
- Added explicit test IDs for classic and `web_app` Profile surfaces.
- Account, notification, storage, appearance, security, achievement, sign-out,
  language preference, and layout-mode saving flows keep their existing
  handlers.
- `classic` Profile and settings surfaces remain available and covered.

Scope guardrail:

- This slice only changes the Profile/settings container styling in `web_app`
  mode. It does not change session behavior, account update APIs, password
  update APIs, notification center behavior, offline packs, or layout-mode
  persistence.

Verification:

```bash
cd apps/mobile
npm test -- profileScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-profile-surface-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Profile/shell tests passed: 3 suites, 32 tests.
- Full mobile Jest passed: 44 suites, 604 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-profile-surface-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- Explore test warning cleaned up: the test mock now renders list data
  synchronously instead of mounting React Native `VirtualizedList`.

## Web App Test Noise Cleanup

Status: completed for the Explore/Belajar Jest warning cleanup.

Implemented:

- `exploreScreen.test.js` no longer mounts React Native `FlatList` inside the
  mocked `Screen` component.
- The mocked list now renders `listData` synchronously using `renderListItem`,
  preserving the existing feature tests without VirtualizedList timers.
- No production code changed in this cleanup slice.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
```

Results:

- Targeted Explore test passed: 1 suite, 21 tests.
- The previous `VirtualizedList` `act(...)` warning no longer appears in the
  targeted Explore test output.

## Web App Global Search Surface Update

Status: completed for the first opt-in Global Search surface pass.

Implemented:

- `GlobalSearchScreen` now reads `useLayoutModePreference` for presentation
  only.
- In `web_app` mode, Global Search uses the web-app surface wrapper.
- Added explicit test IDs for classic and `web_app` Global Search surfaces.
- Search filters, recent searches, quick suggestions, remote search fetching,
  result routing, and load-more behavior keep their existing handlers.
- `classic` Global Search remains available and covered.

Scope guardrail:

- This slice only changes the Global Search container styling in `web_app`
  mode. It does not change search debounce, API calls, recent search storage,
  result grouping, or navigation targets.

Verification:

```bash
cd apps/mobile
npm test -- globalSearchScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-global-search-surface-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted GlobalSearch/shell tests passed: 3 suites, 30 tests.
- Full mobile Jest passed: 44 suites, 608 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-global-search-surface-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Quran Detail Surface Update

Status: completed for the opt-in Quran ayah detail surface pass.

Implemented:

- `QuranScreen` ayah detail view now uses the web-app surface wrapper in
  `web_app` mode.
- Added explicit test IDs for classic and `web_app` Quran detail surfaces.
- Ayah detail actions, audio, tafsir, asbabun nuzul, ayat terkait, hadis
  terkait, bookmark, notes, and navigation handlers remain unchanged.

Scope guardrail:

- This slice only changes the Quran ayah detail container styling in `web_app`
  mode. It does not change reader pagination, ayah action handlers, audio
  loading, bookmark/note persistence, or reference modals.

Verification:

```bash
cd apps/mobile
npm test -- quranScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-quran-detail-surface-export
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Quran/shell tests passed: 3 suites, 34 tests.
- Full mobile Jest passed: 44 suites, 609 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-quran-detail-surface-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Layout Mode Fallback Coverage

Status: completed for provider and shell fallback coverage.

Implemented:

- `layoutModeProvider.test.js` now verifies that an invalid stored layout mode
  falls back to `classic` provider state.
- `mobileAppShell.test.js` now verifies that an invalid stored layout mode
  renders `classic-app-shell` and does not render `web-app-shell`.
- No production code changed in this slice.

Scope guardrail:

- This slice only strengthens regression coverage for the documented fallback
  rule. It does not change layout storage, shell selection, navigation,
  preferences, or screen rendering.

Verification:

```bash
cd apps/mobile
npm test -- mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted shell/provider tests passed: 2 suites, 18 tests.
- Full mobile Jest passed: 44 suites, 611 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Layout Mode Preference Separation Coverage

Status: completed for layout/theme preference separation coverage.

Implemented:

- `profileScreen.test.js` now verifies that selecting `Web App` from Profile
  appearance settings writes only `app-layout-mode`.
- The same test asserts that layout selection does not write `app-theme`,
  preserving the documented separation between layout mode and theme.
- No production code changed in this slice.

Scope guardrail:

- This slice only strengthens regression coverage for the Profile appearance
  settings journey. It does not change Profile UI, theme handling, layout
  persistence, account updates, or shell selection.

Verification:

```bash
cd apps/mobile
npm test -- profileScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Profile/shell/provider tests passed: 3 suites, 35 tests.
- Full mobile Jest passed: 44 suites, 612 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Navigation State Coverage

Status: completed for active tab state coverage in the `web_app` shell.

Implemented:

- `mobileAppShell.test.js` now verifies that `web_app` bottom navigation marks
  the current `activeTab` as selected.
- The same test verifies that the secondary menu sheet uses the same active tab
  state for selected menu items.
- No production code changed in this slice.

Scope guardrail:

- This slice only strengthens regression coverage for shell navigation state.
  It does not change `App.js`, navigation reducers, hardware back behavior,
  bottom navigation handlers, or menu handlers.

Verification:

```bash
cd apps/mobile
npm test -- mobileAppShell.test.js appNavigation.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted shell/navigation/provider tests passed: 3 suites, 40 tests.
- Full mobile Jest passed: 44 suites, 613 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Dashboard Reminder Card Parity

Status: completed for the first native `web_app` daily reminder presentation
pass.

Implemented:

- `HomeDashboardContent` now keeps the classic two-row `Bacaan Hari Ini` card
  only for the `paper` layout.
- `web_app` mode now renders a dashboard-style daily reminder card with a
  single active slide, previous/next controls, dots, Quran/Hadith labels,
  Arabic text, source text, and the same dark dashboard color family.
- Added Home test coverage to ensure `web_app` uses the carousel-style daily
  card and can switch from Ayat Hari Ini to Hadis Hari Ini.

Scope guardrail:

- This slice changes only the native mobile Home dashboard presentation for
  `web_app`. It does not change classic Home, data fetching, API contracts,
  account state, or shell navigation.

Verification:

```bash
cd apps/mobile
npm test -- homeScreen.test.js mobileAppShell.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Home/shell tests passed: 2 suites, 36 tests.
- Full mobile Jest passed: 44 suites, 618 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.

## Web App Quran List Dashboard Parity

Status: completed for the native `web_app` Quran list route visual parity pass.

Implemented:

- `QuranScreen` now keeps the classic paper Quran list, tabs, and navigator panel
  on the `classic` path.
- `web_app` mode now renders the Quran list with the mobile web dashboard visual
  structure: dark surface, Arabic Quran heading, `Al-Quran` title, dashboard
  subtitle, dark search field, `Navigasi Mushaf` CTA, and dark surah cards.
- Added Quran test coverage for the `web_app` dashboard header/search/CTA path
  and the CTA opening the existing mushaf reader flow.

Scope guardrail:

- This slice changes only the native mobile Quran list presentation for
  `web_app`. It does not change classic Quran, surah/ayah data loading, reader
  preferences, audio, bookmarks, notes, tafsir/asbab/munasabah actions, or
  shell navigation.

Verification:

```bash
cd apps/mobile
npm test -- quranScreen.test.js mobileAppShell.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Quran/shell tests passed: 2 suites, 33 tests.
- Full mobile Jest passed: 44 suites, 619 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-quran-route-after.png`.

## Web App Hadith Book Shelf Dashboard Parity

Status: completed for the native `web_app` Hadith list route visual parity pass.

Implemented:

- `HadithScreen` keeps the classic paper Hadith search, filter chips, notice,
  summary, and compact hadith list on the `classic` path.
- `web_app` mode now opens the Hadith route on a dashboard-style dark book
  shelf with `Book`, `Theme`, `Chapter`, and `Hadith` pills, dark search field,
  book cover panels, hadith counts, and `Buka Reader` CTAs.
- `Buka Reader` reuses the existing book-filter flow; when a book or search is
  active, `web_app` switches into the existing hadith result list instead of
  changing data loading or detail handlers.
- Added Hadith test coverage for the dashboard book shelf and the book CTA.

Scope guardrail:

- This slice changes only the native mobile Hadith list presentation for
  `web_app`. It does not change classic Hadith, API calls, offline fallback,
  bookmarks, notes, sanad, perawi, takhrij, related ayah navigation, or detail
  screen behavior.

Verification:

```bash
cd apps/mobile
npm test -- hadithScreen.test.js mobileAppShell.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
```

Results:

- Targeted Hadith/shell tests passed: 2 suites, 30 tests.
- Full mobile Jest passed: 44 suites, 620 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-hadith-route-after.png`.
