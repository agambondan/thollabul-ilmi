# Mobile Web App Layout Impact Plan

Date: 2026-05-24
Status: PLANNED

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

## Acceptance Criteria Before Visual Work

- `classic` still renders exactly through the existing shell.
- Switching preference does not crash app startup.
- Invalid stored preference falls back to `classic`.
- Existing navigation tests pass.
- Existing profile settings tests pass.
- Feature parity checker still passes.

## Later Slices

| Slice | Scope |
| --- | --- |
| 2 | Add native `WebAppShell` skeleton with current screens inside it. |
| 3 | Apply `web_app` header/bottom nav to Home and Quran only. |
| 4 | Validate Quran ayah action menu, audio range, qari, font size, notes, bookmark, and back behavior. |
| 5 | Expand to Hadith, Ibadah, and Belajar after Home/Quran are stable. |
