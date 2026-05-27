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
| Hard-to-revert UI | New installs default to `web_app`; explicit `classic` preferences and invalid-value fallback keep the old shell recoverable. |

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

## Web App Global Search Dashboard Parity

Status: completed for the native `web_app` Global Search/Cari route visual
parity pass.

Implemented:

- `GlobalSearchScreen` keeps the classic paper Search screen, search slot,
  quick suggestions, filter chips, results, recent-search storage, and load-more
  behavior on the `classic` path.
- `web_app` mode now renders the Search route with the mobile web dashboard
  structure from `/dashboard/search`: dark page surface, `Pencarian` title,
  dark bordered input, green `Cari` button, and wrapped dashboard filter pills
  for `Semua`, `Al-Quran`, `Hadith`, `Doa`, `Kamus`, `Kajian`, and `Perawi`.
- The `web_app` bottom navigation now marks `Cari` as the active item when the
  home internal route is `global-search`.
- `web_app` Search does not auto-focus the input on mount, so native smoke
  screenshots and first-page usage keep the bottom navigation visible like the
  web mobile dashboard view.
- Added Global Search and shell test coverage for the dashboard title/input,
  dashboard filter set, classic-surface separation, and active `Cari` state.

Scope guardrail:

- This slice changes only the native mobile Global Search presentation and
  shell active-state mapping for `web_app`. It does not change classic Search,
  debounce timing, API calls, recent-search persistence, result grouping,
  result navigation, or load-more behavior.

Verification:

```bash
cd apps/mobile
npm test -- globalSearchScreen.test.js mobileAppShell.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Profile test passed: 1 suite, 17 tests.
- Full mobile Jest passed: 44 suites, 622 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.

## Web App Tokoh Tarikh Route Dashboard Parity

Status: completed for the native `web_app` Tokoh Tarikh route visual parity
pass.

Implemented:

- `TokohTarikhContent` keeps the existing classic search/filter/list/detail
  flow for `classic` layout.
- In `web_app` mode, Tokoh Tarikh now renders a light dashboard surface modeled
  after `/dashboard/tokoh`: centered icon/title/subtitle, white search field,
  era chips, result count, white tokoh cards, avatar fallback, year metadata,
  and the existing bottom-sheet detail modal.
- Mobile Tokoh detail now accepts both backend `biografi`/`kontribusi` fields
  and the existing translation fallback fields, matching the web route's data
  shape while preserving older mobile payload compatibility.

Scope guardrail:

- This slice changes only Tokoh Tarikh presentation/data normalization in
  mobile `web_app`, its focused mobile tests, and route docs. It does not touch
  classic Explore routing or another agent's dirty Explore/Fiqh files.

Verification:

```bash
node --check apps/mobile/src/screens/TokohTarikhContent.js
node --check apps/mobile/src/__tests__/tokohTarikhContent.test.js
cd apps/mobile
npm test -- tokohTarikhContent.test.js --runInBand
npm test -- tokohTarikhContent.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-tokoh-route-export
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted mobile Tokoh Tarikh test passed: 1 suite, 3 tests.
- Targeted mobile Tokoh Tarikh/shell/layout tests passed: 3 suites, 26 tests.
- Full mobile Jest passed: 46 suites, 661 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-tokoh-route-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.

## Web App Home Reminder Carousel Dashboard Parity

Status: completed for the native `web_app` Home/dashboard reminder carousel
data parity pass.

Implemented:

- Mobile Home now loads active daily reminders from `/api/v1/reminders` with
  the same active/idn/limit contract used by the web dashboard carousel.
- The native `web_app` daily carousel now appends dynamic reminder slides after
  the Quran and Hadith slides, preserving the existing carousel controls and
  classic Home "Bacaan Hari Ini" layout.
- Reminder normalization keeps title, text, source, author, and `ulama` type
  fallback aligned with the web dashboard behavior.

Scope guardrail:

- This slice changes only Home dashboard daily reminder data wiring, mobile API
  normalization, focused Home tests, and route docs. It does not touch classic
  Explore routing or another agent's dirty Explore/Fiqh files.

Verification:

```bash
node --check apps/mobile/src/api/client.js
node --check apps/mobile/src/screens/HomeScreen.js
node --check apps/mobile/src/screens/home/HomeDashboardContent.js
cd apps/mobile
npm test -- homeScreen.test.js --runInBand
npm test -- homeScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-home-reminders-export
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted mobile Home test passed: 1 suite, 23 tests.
- Targeted mobile Home/shell/layout tests passed: 3 suites, 46 tests.
- Full mobile Jest passed: 46 suites, 662 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-home-reminders-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-profile-route-after.png`.

Results:

- Targeted Explore test passed: 1 suite, 21 tests.
- Full mobile Jest passed: 44 suites, 622 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-belajar-route-after.png`.

## Web App Profile Dashboard Parity

Status: completed for the native `web_app` Profile main screen visual parity
pass.

Implemented:

- `ProfileScreen` keeps the classic paper profile card, stats cards, progress
  cards, achievements grid, menu rows, and sub-screen settings flow on the
  `classic` path.
- `web_app` mode now renders the Profile main screen with a dedicated dark
  dashboard account surface: `AKUN` hero, larger avatar, account email/status,
  green settings CTA, dark stats tiles, progress tiles, achievement tiles, and
  account action tiles.
- Settings, account, notifications, storage, appearance, security, achievements
  detail, sign-out, language preference, and layout-mode saving still reuse the
  existing handlers and sub-screen paths.
- Added Profile test coverage to ensure the `web_app` main screen uses the
  dashboard surface instead of the classic `Screen` title path.

Scope guardrail:

- This slice changes only the native mobile Profile main screen presentation in
  `web_app`. It does not change classic Profile, session behavior, account
  update APIs, password update APIs, notification center behavior, offline
  packs, layout-mode persistence, achievements fetching, or Profile sub-screen
  navigation.

Verification:

```bash
cd apps/mobile
npm test -- profileScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 21 tests.
- Full mobile Jest passed: 44 suites, 622 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-belajar-route-after.png`.

Results:

- Targeted GlobalSearch/shell tests passed: 2 suites, 29 tests.
- Full mobile Jest passed: 44 suites, 621 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-search-route-after.png`.

## Web App Layout Default Update

Status: completed for making `web_app` the native mobile default layout mode.

Implemented:

- `LayoutModeProvider` now uses `web_app` as the default when no
  `app-layout-mode` preference is stored.
- Existing stored preferences still win: users who already selected `classic`
  keep the classic shell, and invalid stored values still normalize to
  `classic` as a fail-safe.
- Profile Appearance uses the same default layout constant, so the settings UI
  reflects the default instead of hardcoding `classic`.
- Updated layout docs to record `web_app` as the default and `classic` as a
  supported fallback.

Scope guardrail:

- This slice changes only the default layout-mode fallback and documentation.
  It does not remove `classic`, change tab keys, alter screen data/action
  handlers, or change theme preference behavior.

Verification:

```bash
cd apps/mobile
npm test -- layoutModeProvider.test.js mobileAppShell.test.js profileScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted provider/shell/profile tests passed: 3 suites, 40 tests.
- Full mobile Jest passed: 44 suites, 622 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.

## Web App Ibadah Hub Dashboard Parity

Status: completed for the native `web_app` Ibadah hub visual parity pass.

Implemented:

- `IbadahScreen` keeps the classic paper Ibadah hub, section headers, cards,
  compact rows, and route handlers on the `classic` path.
- `web_app` mode now renders a dedicated dark dashboard-style Ibadah hub with
  an `IBADAH & TRACKER` hero, compact subtitle, uppercase group labels, and
  two-column tiles for Harian, Arah & Waktu, Dzikir & Bacaan, Alat, and
  Rencana.
- Primary native sub-routes (`Jadwal Sholat`, `Qibla`, and `Khatam`) get
  stronger green tile treatment while reusing the existing `navigation.open`
  handlers.
- Feature rows such as Doa, Dzikir, Tasbih, Zakat, Faraidh, and Manasik still
  route through the existing `onOpenTab('belajar', { featureKey })` path.
- Added Ibadah test coverage to ensure the `web_app` branch uses the dedicated
  dashboard hub instead of the classic `Screen` title surface.

Scope guardrail:

- This slice changes only the native mobile Ibadah hub presentation in
  `web_app`. It does not change classic Ibadah, Prayer/Qibla/Khatam sub-screen
  routing, feature keys, notification/location flows, calculator logic, or
  data persistence.

Verification:

```bash
cd apps/mobile
npm test -- ibadahScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Ibadah test passed: 1 suite, 15 tests.
- Full mobile Jest passed: 44 suites, 622 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-ibadah-route-after.png`.

## Web App Explore/Belajar Hub Dashboard Parity

Status: completed for the native `web_app` Explore/Belajar hub visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic paper Belajar catalog, search slot, profile
  action, feature rows, pinned/recent behavior, and active feature view on the
  `classic` path.
- `web_app` mode now renders the idle Belajar catalog with a dedicated dark
  dashboard-style hub: `KONTEN ISLAM` hero, dark search input, uppercase
  section labels, and two-column feature tiles.
- `FeatureCatalog` now supports a `webApp` variant while reusing the same
  catalog section filtering, feature lookup, badge logic, feature press handler,
  and pin/unpin handler.
- Active feature views still use the existing `Screen` path so forum, feed,
  notes, bookmarks, library progress, tafsir, quiz, calculators, and local
  tools keep their existing handlers.
- Added Explore test coverage to ensure the `web_app` idle hub uses the
  dashboard catalog instead of the classic `Screen` title surface.

Scope guardrail:

- This slice changes only the native mobile Explore/Belajar idle hub
  presentation in `web_app`. It does not change classic Explore, feature keys,
  API fetching, personal data handlers, forum/feed behavior, calculators,
  library progress, or active feature detail views.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

## Web App Bookmark Route Dashboard Parity

Status: completed for the native `web_app` Bookmark feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Bookmark feature on the `classic` layout.
- `web_app` mode now renders the Bookmark feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/bookmarks`: account-style header,
  item count, grouped bookmark sections, dark list cards, source reference
  labels, and management affordance.
- Bookmark loading still uses `getBookmarkItems`; detail opening and management
  still reuse the existing `openItemDetail` and item action-sheet handlers.
- Added Explore test coverage to ensure the `web_app` Bookmark feature route
  uses the dedicated dashboard surface instead of the generic `Screen` title
  path.

Scope guardrail:

- This slice changes only the native mobile Bookmark feature route presentation
  in `web_app`. It does not change classic Explore, bookmark API calls,
  bookmark creation/deletion, item detail behavior, feature keys, or auth
  gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 22 tests.
- Full mobile Jest passed: 44 suites, 623 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-bookmarks-route-after.png`.

## Web App Notes Route Dashboard Parity

Status: completed for the native `web_app` Notes feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Notes feature on the `classic` layout.
- `web_app` mode now renders the Notes feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/notes`: personal header, item
  count, dark search field, note cards, date metadata, tags, and management
  affordance.
- Notes loading still uses `getAllNotes`; detail opening and management still
  reuse the existing `openItemDetail` and item action-sheet handlers.
- Added Explore test coverage to ensure the `web_app` Notes feature route uses
  the dedicated dashboard surface instead of the generic `Screen` title path,
  including dashboard-style note search filtering.

Scope guardrail:

- This slice changes only the native mobile Notes feature route presentation in
  `web_app`. It does not change classic Explore, notes API calls, note
  creation/update/deletion, item detail behavior, feature keys, or auth gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 23 tests.
- Full mobile Jest passed: 44 suites, 624 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-notes-route-after.png`.

## Web App Notifications Route Dashboard Parity

Status: completed for the native `web_app` Notifications feature route visual
parity pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Notifications feature on the `classic` layout.
- `web_app` mode now renders the Notifications feature route with a dedicated
  dark dashboard shell modeled after `/dashboard/notifications`: personal
  header, inbox label, route subtitle, and dark notification settings/inbox
  panel.
- Notification settings, local reminders, push registration, inbox loading,
  read/unread actions, and pending sync behavior still reuse the existing
  `NotificationCenter` handlers.
- Added Explore test coverage to ensure the `web_app` Notifications feature
  route uses the dedicated dashboard surface instead of the generic `Screen`
  title path.

Scope guardrail:

- This slice changes only the native mobile Notifications feature route
  presentation in `web_app`. It does not change classic Explore,
  notification APIs, push permission flow, local reminder scheduling, inbox
  actions, feature keys, or auth gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore/NotificationCenter tests passed: 2 suites, 36 tests.
- Full mobile Jest passed: 44 suites, 625 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-notifications-route-after.png`.

## Web App Goals Route Dashboard Parity

Status: completed for the native `web_app` Goals/Target Belajar feature route
visual parity pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Goals feature on the `classic` layout.
- `web_app` mode now renders the Goals feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/goals`: personal header, target
  count, active/completed summary pills, goal cards, status chips, progress
  bars, metadata, and management affordance.
- Goals loading still uses the existing protected-list endpoint flow through
  `getFeatureItemPage`; detail opening and management still reuse
  `openItemDetail` and the item action-sheet handlers.
- Added Explore test coverage to ensure the `web_app` Goals feature route uses
  the dedicated dashboard surface instead of the generic `Screen` title path.

Scope guardrail:

- This slice changes only the native mobile Goals feature route presentation in
  `web_app`. It does not change classic Explore, goals API calls, goal
  creation/update/deletion, item detail behavior, feature keys, or auth gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 25 tests.
- Full mobile Jest passed: 44 suites, 626 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-goals-route-after.png`; emulator
  was logged out, so the route showed the dark Goals dashboard shell with the
  existing protected-feature auth error.

## Web App Muhasabah Route Dashboard Parity

Status: completed for the native `web_app` Muhasabah feature route visual
parity pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Muhasabah feature on the `classic` layout.
- `web_app` mode now renders the Muhasabah feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/muhasabah`: personal header,
  reflection count, today-status summary, dark reflection cards, mood chips,
  dates, excerpt text, and management affordance.
- Muhasabah loading still uses the existing protected-list endpoint flow through
  `getFeatureItemPage`; detail opening and management still reuse
  `openItemDetail` and the item action-sheet handlers.
- Added Explore test coverage to ensure the `web_app` Muhasabah feature route
  uses the dedicated dashboard surface instead of the generic `Screen` title
  path.

Scope guardrail:

- This slice changes only the native mobile Muhasabah feature route
  presentation in `web_app`. It does not change classic Explore, muhasabah API
  calls, create/delete behavior, item detail behavior, feature keys, or auth
  gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 26 tests.
- Full mobile Jest passed: 44 suites, 627 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-muhasabah-route-after.png`;
  emulator was logged out, so the route showed the dark Muhasabah dashboard
  shell with the existing protected-feature auth error.

## Web App Hafalan Route Dashboard Parity

Status: completed for the native `web_app` Hafalan feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Hafalan feature on the `classic` layout.
- `web_app` mode now renders the Hafalan feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/hafalan`: progress header,
  memorized/active/not-started summary pills, surah cards, status chips,
  progress bars, and management affordance.
- Hafalan loading still uses the existing protected-list endpoint flow through
  `getFeatureItemPage`; detail opening and management still reuse
  `openItemDetail` and the item action-sheet handlers.
- Added Explore test coverage to ensure the `web_app` Hafalan feature route
  uses the dedicated dashboard surface instead of the generic `Screen` title
  path.

Scope guardrail:

- This slice changes only the native mobile Hafalan feature route presentation
  in `web_app`. It does not change classic Explore, hafalan API calls, status
  update behavior, item detail behavior, feature keys, or auth gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 27 tests.
- Full mobile Jest passed: 44 suites, 628 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-hafalan-route-after.png`;
  emulator was logged out, so the route showed the dark Hafalan dashboard shell
  with the existing protected-feature auth error.

## Web App Murojaah Route Dashboard Parity

Status: completed for the native `web_app` Murojaah feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Murojaah feature on the `classic` layout.
- `web_app` mode now renders the Murojaah feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/muroja-ah`: progress header,
  total/reviewed/urgent summary pills, surah review cards, urgency chips, and
  management affordance.
- Murojaah loading still uses the existing protected-list endpoint flow through
  `getFeatureItemPage`; detail opening and management still reuse
  `openItemDetail` and the item action-sheet handlers.
- Added Explore test coverage to ensure the `web_app` Murojaah feature route
  uses the dedicated dashboard surface instead of the generic `Screen` title
  path.

Scope guardrail:

- This slice changes only the native mobile Murojaah feature route presentation
  in `web_app`. It does not change classic Explore, murojaah API calls, review
  marking behavior, item detail behavior, feature keys, or auth gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 28 tests.
- Full mobile Jest passed: 44 suites, 629 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-murojaah-route-after.png`;
  emulator was logged out, so the route showed the dark Murojaah dashboard
  shell with the existing protected-feature auth error.

## Web App Tilawah Route Dashboard Parity

Status: completed for the native `web_app` Tilawah feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Tilawah feature on the `classic` layout.
- `web_app` mode now renders the Tilawah feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/tilawah`: progress header,
  today status panel, weekly/monthly page summary pills, recent tilawah cards,
  page chips, and management affordance.
- Tilawah loading still uses the existing protected-list endpoint flow through
  `getFeatureItemPage`; detail opening and management still reuse
  `openItemDetail` and the item action-sheet handlers.
- Added Explore test coverage to ensure the `web_app` Tilawah feature route
  uses the dedicated dashboard surface instead of the generic `Screen` title
  path.

Scope guardrail:

- This slice changes only the native mobile Tilawah feature route presentation
  in `web_app`. It does not change classic Explore, tilawah API calls, log
  creation behavior, item detail behavior, feature keys, or auth gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 29 tests.
- Full mobile Jest passed: 44 suites, 630 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-tilawah-route-after.png`;
  emulator was logged out, so the route showed the dark Tilawah dashboard shell
  with the existing protected-feature auth error.

## Web App Stats Route Dashboard Parity

Status: completed for the native `web_app` Stats feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature `Screen` path for the
  Stats feature on the `classic` layout.
- `web_app` mode now renders the Stats feature route with a dedicated dark
  dashboard surface modeled after `/dashboard/stats`: progress header, sholat
  today card, summary stat tiles, hafalan/tilawah progress rows, and a compact
  7-day sholat bar chart.
- Stats loading still uses the existing protected-list endpoint flow through
  `getFeatureItemPage`; this slice only changes presentation and normalization
  for the returned stats payload.
- Added Explore test coverage to ensure the `web_app` Stats feature route uses
  the dedicated dashboard surface instead of the generic `Screen` title path.

Scope guardrail:

- This slice changes only the native mobile Stats feature route presentation in
  `web_app`. It does not change classic Explore, stats API calls, profile
  stats, achievement loading, feature keys, or auth gating.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 30 tests.
- Full mobile Jest passed: 44 suites, 631 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-stats-route-after.png`;
  emulator was logged out, so the route showed the dark Stats dashboard shell
  with the existing protected-feature auth error.

## Web App Leaderboard Route Dashboard Parity

Status: completed for the native `web_app` Leaderboard feature route visual
parity pass.

Implemented:

- `ExploreScreen` keeps the classic generic list path for Leaderboard on the
  `classic` layout.
- `web_app` mode now renders the Leaderboard feature route with a dedicated
  dark dashboard surface modeled after `/dashboard/leaderboard`: community
  header, top performer panel, segmented Streak Sholat/Hafalan tabs, summary
  pills, and ranking rows.
- Leaderboard `web_app` loads both existing endpoints
  `/api/v1/leaderboard/streak` and `/api/v1/leaderboard/hafalan`; the classic
  path keeps using the existing feature endpoint.
- Added Explore test coverage to ensure the `web_app` Leaderboard feature route
  uses the dedicated dashboard surface instead of the generic `Screen` title
  path.

Scope guardrail:

- This slice changes only the native mobile Leaderboard feature route
  presentation in `web_app`. It does not change classic Explore, leaderboard
  API contracts, feature keys, auth behavior, or profile account actions.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 31 tests.
- Full mobile Jest passed: 44 suites, 632 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-leaderboard-route-after.png`;
  the route rendered the dark Leaderboard dashboard shell. The local
  leaderboard API returned HTTP 500 for both streak and hafalan endpoints, so
  the smoke screen showed the existing load-error state instead of live ranking
  rows.

## Web App Kajian Route Dashboard Parity

Status: completed for the native `web_app` Kajian feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic generic list path for Kajian on the
  `classic` layout.
- `web_app` mode now renders the Kajian feature route with a dedicated light
  dashboard surface modeled after `/dashboard/kajian`: header, total/video/
  category stat tiles, search input, category pills, and kajian cards with
  type/topic badges.
- Kajian loading still uses the existing `/api/v1/kajian` feature endpoint
  through `getFeatureItemPage`; this slice only changes presentation and local
  filtering in `web_app`.
- Added Explore test coverage to ensure the `web_app` Kajian feature route uses
  the dedicated dashboard surface instead of the generic `Screen` title path.

Scope guardrail:

- This slice changes only the native mobile Kajian feature route presentation
  in `web_app`. It does not change classic Explore, kajian API calls, external
  link behavior outside the Kajian card, feature keys, or pagination contracts.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 32 tests.
- Full mobile Jest passed: 44 suites, 633 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-kajian-route-after.png`;
  the route rendered the light Kajian dashboard content surface with stat
  tiles, search, category pills, and kajian cards populated from the local API.

## Web App Blog Route Dashboard Parity

Status: completed for the native `web_app` Blog feature route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic generic list path for Blog/Artikel on the
  `classic` layout.
- `web_app` mode now renders the Blog feature route with a dedicated light
  dashboard surface modeled after `/dashboard/blog`: title, subtitle, search
  input, category pills, empty state, and white article cards with category,
  excerpt, author, date, and optional cover image.
- Blog loading still uses the existing `/api/v1/blog/posts` feature endpoint
  through `getFeatureItemPage`; this slice only changes presentation and local
  filtering in `web_app`.
- Added Explore test coverage to ensure the `web_app` Blog feature route uses
  the dedicated dashboard surface instead of the generic `Screen` title path.

Scope guardrail:

- This slice changes only the native mobile Blog feature route presentation in
  `web_app`. It does not change classic Explore, blog API calls, detail
  rendering, feature keys, or pagination contracts.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted Explore test passed: 1 suite, 33 tests.
- Full mobile Jest passed: 44 suites, 634 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Native emulator smoke captured at
  `output/native-smoke/tholabul-webapp-emulator-blog-route-after.png`; the
  route rendered the light Blog dashboard content surface with search, category
  pills, and article cards populated from the local API.

## Web App Achievements Route Dashboard Parity

Status: completed for the native `web_app` Achievements/Pencapaian route-depth
visual parity pass.

Implemented:

- `ProfileScreen` keeps the classic Achievements detail journey on the
  `classic` layout.
- In `web_app` mode, `profile:achievements` now renders a dedicated light
  dashboard route surface modeled after `/dashboard/achievements`: centered
  trophy header, subtitle, amber total-points summary, login notice, white or
  muted achievement rows, and earned/locked pills.
- The `web_app` Achievements route no longer uses the classic `SubScreen`
  header or visible back button, matching the dashboard route surface while
  preserving hardware/back-stack behavior.
- Mobile achievement API normalization now accepts `achievements` and
  `data.achievements` payload shapes.
- Web `/dashboard/achievements` now normalizes `items`, `achievements`,
  `data.items`, `data.achievements`, and array payloads so the route does not
  break if the API responds with the documented `achievements` key.

Scope guardrail:

- This slice changes only the native mobile Achievements route presentation in
  `web_app`, achievement payload normalization, and the web dashboard
  Achievements payload guard. It does not change classic Profile settings,
  account actions, Profile summary, achievement API endpoints, or unrelated web
  Quran/Mushaf files.

Verification:

```bash
cd apps/mobile
npm test -- profileScreen.test.js api-personal.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-achievements-route-export
cd ../web
npm test -- achievementPayload.test.js --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted mobile Profile/API tests passed: 2 suites, 57 tests.
- Targeted web achievement payload test passed: 1 suite, 4 tests.
- Full mobile Jest passed: 44 suites, 636 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-achievements-route-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.
- Targeted web ESLint could not run because local `apps/web/node_modules` is
  missing the `typescript` package required by the Next ESLint config.

## Web App Feed Route Dashboard Parity

Status: completed for the native `web_app` Feed Komunitas route visual parity
pass.

Implemented:

- `ExploreScreen` keeps the classic Feed card path for `classic` layout.
- In `web_app` mode, `community-feed` now renders a dedicated light dashboard
  surface modeled after `/dashboard/feed`: centered community header, subtitle,
  dashed create/login prompt, white post cards, emerald avatars, author/date
  metadata, optional ayah/hadith reference badge, like/comment actions, and
  guest-friendly empty/loading states.
- Generic mobile Feed cards no longer label non-ayah/non-hadith feed posts as
  `Hadis`; reference badges are now shown only for real ayah/hadith refs.
- Web `/feed` and `/dashboard/feed` now use tested feed pagination helpers so
  an explicit API `total` wins over inferred `last === false` pagination. This
  fixes a web bug where the mixed `??` and ternary expression could infer the
  wrong total when the API already returned `total`.

Scope guardrail:

- This slice changes only the native mobile Feed feature route presentation in
  `web_app`, generic feed reference labeling, and the web Feed pagination
  helper. It does not change classic feature routing, feed create/comment API
  contracts, unrelated web route audit tests, or another agent's dirty web test
  files.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-feed-route-export
cd ../web
npm test -- feedPagination.test.js --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted mobile Explore test passed: 1 suite, 35 tests.
- Targeted web feed pagination test passed: 1 suite, 3 tests.
- Full mobile Jest passed: 44 suites, 637 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-feed-route-export`.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.

## Web App Peta Islam Interaktif Route Dashboard Parity

Status: completed for the native `web_app` Peta Islam Interaktif route visual
parity pass.

Implemented:

- `HistoricalMapContent` keeps the existing classic map/list flow for
  `classic` layout.
- In `web_app` mode, Peta Islam Interaktif now renders a light dashboard
  surface modeled after `/dashboard/peta`: centered title/subtitle, search
  field, location count, map/list segmented control, category chips, era chips,
  and a taller white map panel.
- Mobile category/era filters now include the web route's `Universitas` and
  `Fatimiyah` options, and the `Khulafa` label matches the web wording.
- The native map and web Leaflet map now ignore records without valid numeric
  coordinates before rendering markers, preventing bad backend rows from
  breaking the map surface.

Scope guardrail:

- This slice changes only Peta Islam Interaktif presentation in mobile
  `web_app`, its map-view props, a route-scoped web marker guard, and route
  docs. It does not touch classic Explore routing or another agent's dirty
  Explore/Fiqh files.

Verification:

```bash
node --check apps/mobile/src/screens/HistoricalMapScreen.js
node --check apps/mobile/src/screens/HistoricalMapView.js
node --check apps/mobile/src/screens/HistoricalMapView.native.js
node --check apps/mobile/src/__tests__/historicalMapScreen.test.js
node --check apps/web/src/app/peta/MapComponent.js
cd apps/mobile
npm test -- historicalMapScreen.test.js --runInBand
npm test -- historicalMapScreen.test.js mobileAppShell.test.js layoutModeProvider.test.js --runInBand
npm test -- --runInBand
npx expo export --platform android --dev --output-dir /tmp/thollabul-webapp-peta-route-export
cd ../..
cd apps/web
npm run build
cd ../..
node scripts/check-feature-parity.js
git diff --check
```

Results:

- Targeted mobile Historical Map test passed: 1 suite, 3 tests.
- Targeted mobile Historical Map/shell/layout tests passed: 3 suites, 26 tests.
- Full mobile Jest passed: 45 suites, 658 tests.
- Expo Android export passed and generated bundle under
  `/tmp/thollabul-webapp-peta-route-export`.
- Web production build passed.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- `git diff --check` passed.

## Web App Fiqh Route Dashboard Parity

Status: completed for the native `web_app` Fiqh route visual parity pass.

Implemented:

- `ExploreScreen` keeps the classic paper active-feature path for Fiqh on the
  `classic` layout.
- In `web_app` mode, Fiqh now renders a dedicated light dashboard surface
  modeled after `/dashboard/fiqh`: compact title/count, search field with icon,
  category pills, and compact white list rows with the same lime indicator and
  chevron affordance.
- Native Fiqh detail behavior stays routed through the existing item detail
  handler instead of adding inline expand/collapse, preserving the mobile
  detail UI rule while matching the web list surface.
- The web and mobile Fiqh filters now treat API `slug` values as category
  fallbacks, so dashboard chips keep working with the current `/api/v1/fiqh`
  payload that does not always include an explicit `category` field.

Scope guardrail:

- This slice changes only the native mobile Fiqh feature route presentation in
  `web_app`, a route-scoped `/dashboard/fiqh` filter fallback, its Explore test
  coverage, and route docs. It does not change classic Explore routing, Fiqh API
  calls, or another agent's route files.

Verification:

```bash
cd apps/mobile
npm test -- exploreScreen.test.js api-explore.test.js --runInBand
npm test -- --runInBand
cd ../..
node scripts/check-feature-parity.js
git diff --check
npx eslint src/app/dashboard/fiqh/page.js
cd apps/web
npm run build
```

Results:

- Targeted mobile Explore/API tests passed: 2 suites, 56 tests.
- Full mobile Jest passed: 46 suites, 662 tests.
- Feature parity checker passed: 50 manifest features, 14 utility routes, 43
  mobile feature keys, 154 web app routes scanned.
- Browser mobile smoke captured authenticated `/dashboard/fiqh` and native
  Expo web-app `#/belajar/fiqh` at 412x915 in `output/playwright/`.
- Web production build passed.
- `git diff --check` passed.
- Targeted web ESLint could not run because local `apps/web/node_modules` is
  missing the `typescript` package required by the Next ESLint config.
