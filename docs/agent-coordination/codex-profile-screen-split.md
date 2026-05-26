# Codex Profile Screen Split

Status: done
Started: 2026-05-26 23:14 WIB

## Scope

- Route/feature: mobile `ProfileScreen` large-file split.
- Files I may edit:
  - `apps/mobile/src/screens/ProfileScreen.js`
  - `apps/mobile/src/screens/ProfileScreen.styles.js`
  - relevant `apps/mobile` profile tests, if needed
- Files I will avoid:
  - dirty web audit/admin files
  - `ExploreScreen` split files owned by the other agent
  - Quran/Mushaf files

## Current Notes

- Initial target: move styles and profile web-app color constants out of
  `ProfileScreen.js` without changing behavior.
- Keep `classic` and `web_app` profile surfaces covered by existing tests.

## Verification

- `cd apps/mobile && npm test -- profileScreen.test.js --runInBand` passed:
  1 suite, 18 tests.
- Profile line-count gate after split: `ProfileScreen.js` 1269 lines and
  `ProfileScreen.styles.js` 1072 lines.
- `git diff --check -- apps/mobile/src/screens/ProfileScreen.js apps/mobile/src/screens/ProfileScreen.styles.js docs/agent-coordination/codex-profile-screen-split.md` passed.
- Full `cd apps/mobile && npm test -- --runInBand` is currently blocked by
  unrelated dirty Quran split work: `QuranScreen.styles.js` references
  `QURAN_FONT_FAMILIES` without importing it.
