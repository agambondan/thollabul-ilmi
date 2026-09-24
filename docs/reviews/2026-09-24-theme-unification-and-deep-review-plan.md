# Theme Unification & Deep Review Plan

**Date:** 2026-09-24
**Status:** In Progress

---

## Objective
Unified theme system for mobile: classic/paper layout uses parchment/sage palette, web app layout uses modern Slate/Emerald. Fixed color sync bug where paper layout showed web app colors and pages defaulted to dark in light mode.

---

## Completed Work

### Theme Unification (3 commits)
- **34d4bc6b** - Theme: classic/paper uses parchment/sage, web app uses Slate/Emerald
- **8448cad0** - MobileTopHeader morphing header + WebAppShell back navigation
- **560397eb** - ExploreScreen + 6 explore routes migrated to setHeader navigation, fixed WebAppFaraidhRoute hook-order regression

### Verified
- All 56 mobile test suites (790 tests) pass

---

## Critical Issues from Deep Review (Must Fix)

### 1. MobileTopHeader.js - Hardcoded Web App Colors
**File:** `apps/mobile/src/layout/MobileTopHeader.js`
**Problem:** Lines 144-150 hardcode `#0f172a` (slate-900) and `#10b981` (emerald-500) instead of using theme tokens
**Fix:** Use `getThemeColors({ isDark, isClassic })` resolver

### 2. WebAppShell.js - Hardcoded Background Colors
**File:** `apps/mobile/src/layout/WebAppShell.js`
**Problem:** Lines 89-95 hardcode `#f8fafc` / `#0f172a` instead of theme tokens
**Fix:** Use theme resolver for background colors

### 3. Screen.js - Confusing isClassic Naming
**File:** `apps/mobile/src/components/Screen.js`
**Problem:** `isClassic` derived from `!isWebAppLayout` but naming is inverted and unclear
**Fix:** Rename to `isPaperLayout` or `isClassicLayout` for clarity

### 4. HomeDashboardContent.js - Duplicate Color Definitions
**File:** `apps/mobile/src/screens/home/HomeDashboardContent.js`
**Problem:** Lines 45-65 redefine web dashboard colors instead of importing from theme.js
**Fix:** Import and use theme tokens from `apps/mobile/src/theme.js`

### 5. QiblaScreen.js - Duplicated Theme Constant
**File:** `apps/mobile/src/screens/QiblaScreen.js`
**Problem:** `WEB_APP_QIBLA_THEMES` defined locally (lines 25-45) duplicating theme tokens
**Fix:** Use centralized theme tokens

---

## High Priority Issues

### 6. ExploreScreen.js - Too Large (2028 lines)
**File:** `apps/mobile/src/screens/ExploreScreen.js`
**Action:** Split into:
- `ExploreScreen.jsx` (orchestrator, ~200 lines)
- `ExploreTabBar.jsx` (tab navigation)
- `ExploreRoute.jsx` (base route component)
- Individual route files (already exist)

### 7. HadithScreen.js - Too Large (2632 lines)
**File:** `apps/mobile/src/screens/HadithScreen.js`
**Action:** Split into:
- `HadithScreen.jsx` (orchestrator)
- `HadithList.jsx`
- `HadithDetail.jsx`
- `HadithFilters.jsx`
- `HadithBookSelector.jsx`

### 8. WebApp*Route Hook-Order Audit
**Files:** All `apps/mobile/src/screens/explore/WebApp*Route.js`
**Problem:** `WebAppFaraidhRoute` had useEffect in conditional block (fixed in 560397eb)
**Action:** Audit all 6 routes for same pattern:
- WebAppFaraidhRoute.js
- WebAppLessonsRoute.js
- WebAppQuizRoute.js
- WebAppSirohRoute.js
- WebAppTafsirRoute.js
- WebAppZakatRoute.js
- WebAppDoaRoute.js (uncommitted)
- WebAppKajianRoute.js (uncommitted)

---

## API Issues

### 9. Google Auth Controller - State Token Bug
**File:** `services/api/app/controllers/google_auth_controller.go`
**Problem:** OAuth state token comparison uses `!=` on potentially nil pointers
**Fix:** Proper nil check before comparison

---

## Web Issues

### 10. Hadith Theme - N+1 Fetch Pattern
**File:** `apps/web/src/lib/hadithTheme.js`
**Problem:** Sequential fetches in loop instead of batch/parallel
**Fix:** Use Promise.all or batch endpoint

---

## Uncommitted Changes (Other Agents)
- `apps/mobile/src/screens/explore/WebAppDoaRoute.js`
- `apps/mobile/src/screens/explore/WebAppKajianRoute.js`
- **Action:** Review and commit or stash appropriately

---

## Next Steps Priority Order

1. **Fix Critical Theme Issues** (1-5) - Immediate, blocks consistent theming
2. **Audit WebApp*Route Hook-Order** (8) - Prevents runtime crashes
3. **Split ExploreScreen** (6) - Reduces complexity
4. **Split HadithScreen** (7) - Reduces complexity
5. **Fix API Google Auth** (9) - Security/auth reliability
6. **Fix Web HadithTheme** (10) - Performance
7. **Handle Uncommitted Files** - Clean up shared repo state

---

## Commands to Run After Fixes

```bash
# Mobile tests
cd apps/mobile && npm test

# API tests
cd services/api && go test ./...

# Web tests (if any)
cd apps/web && npm test

# Lint
cd apps/mobile && npm run lint
cd services/api && golangci-lint run
cd apps/web && npm run lint
```

---

## Notes
- User requested "option 1 and 2" (commit + continue); only option 1 (theme commits) completed
- Deep review document: `docs/reviews/2026-09-24-deep-review-findings.md`
- Repo is shared across multiple agent sessions - **never touch git stash**
- Commit directly to master, stage only files you modified