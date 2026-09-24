# Mobile Design Spacing & Touch Target Audit — Action Plan

**Date:** 2026-09-24  
**Project:** thollabul-ilmi (apps/mobile)  
**Scope:** Design system spacing, touch targets, safe areas, component density  
**Status:** Ready for implementation

---

## 🎯 Objective

Bring all interactive elements to ≥44×44dp minimum touch target (Material Design / iOS HIG compliance) and ensure consistent ≥8dp gaps between interactive elements across the entire mobile app.

---

## 📊 Audit Summary

| Category | Violations Found | Priority |
|----------|------------------|----------|
| **Touch targets < 44dp** | 47 instances | 🔴 CRITICAL |
| **Gaps < 8dp between interactive** | 15 locations | 🟠 HIGH |
| **Hardcoded small values (should use tokens)** | 12 instances | 🟡 MEDIUM |
| **Safe area / inset issues** | 3 locations | 🟡 MEDIUM |

---

## 📋 Phase 1: Theme & Shared Components (Highest Impact)

*Files affecting every screen*

### 1.1 `apps/mobile/src/theme.js`
- [ ] Add `touchTarget: 44` constant to spacing/radius export
- [ ] Add `touchTargetSmall: 40` for dense lists (exception, documented)
- [ ] Ensure `spacing` scale is used consistently (xs:4, sm:8, md:12, lg:16, xl:24, xxl:32)

### 1.2 `apps/mobile/src/layout/MobileBottomNav.js`
- [ ] `item.paddingVertical: spacing.sm` (was `spacing.xs`)
- [ ] `item.gap: spacing.xs` (was `2`)
- [ ] `item.paddingHorizontal: spacing.xs` (was `2`)
- [ ] Verify `minHeight: 52` meets 44dp ✓

### 1.3 `apps/mobile/src/layout/MobileTopHeader.js`
- [ ] `actionIconBtn`: 44×44 (was 32×32)
- [ ] `actions.gap: spacing.sm` (was `spacing.xs` = 4)
- [ ] `accountButton` hit area ≥44dp (avatar + chevron)
- [ ] `backButton` hitSlop: 12 ✓, but visual 32×32 → 44×44

### 1.4 `apps/mobile/src/layout/MobileMenuSheet.js`
- [ ] `item.minHeight: 44` (was 38)
- [ ] `item.paddingVertical: spacing.sm` (was `spacing.xs`)
- [ ] `grid.gap: spacing.sm` (was `spacing.xs`)
- [ ] `group.gap: spacing.sm` (was `spacing.xs`)
- [ ] `closeButton`: 44×44 (was 36×36)

### 1.5 `apps/mobile/src/components/Paper.js`
- [ ] `segmentButton.minHeight: 44` (was 32)
- [ ] `segmentedTabs.gap: spacing.sm` (was `spacing.xs`)
- [ ] `segmentedTabs.padding: spacing.xs` (was hardcoded `4`)
- [ ] `iconButton`: 44×44 (verify)
- [ ] `actionPill.minHeight: 44` (verify)

### 1.6 `apps/mobile/src/components/ContentCard.js`
- [ ] `icon`: 44×44 (was 36×36)
- [ ] `menuButton`: 44×44 (was 40×40)
- [ ] `railItem.marginTop: spacing.sm` (was `spacing.xs`)
- [ ] `railBadge.paddingVertical: spacing.xs` (was hardcoded `4`) — keep but ensure label readable

### 1.7 `apps/mobile/src/components/SectionHeader.js`
- [ ] `subtitle.marginTop: spacing.xs` (was hardcoded `2`)
- [ ] `actions.gap: spacing.sm` (already `spacing.xs` → upgrade to `sm`)

---

## 📋 Phase 2: Major Screen Styles

*High-traffic screens with many custom touch targets*

### 2.1 `apps/mobile/src/screens/QuranScreen.styles.js`
| Style | Current | Target |
|-------|---------|--------|
| `quranTabButton.minHeight` | 32 | 44 |
| `navigatorTab.minHeight` | 32 | 44 |
| `surahPagerButton.minHeight` | 34 | 44 |
| `quranSearch.minHeight` | 34 | 44 |
| `webAppQuranSearch.minHeight` | 38 | 44 |
| `webAppSurahPagerButton.minHeight` | 42 | 44 |
| `qariButton.minHeight` | 34 | 44 |
| `audioInput.minHeight` | 38 | 44 |
| `audioSkipButton` | 36 wide | 44×44 |
| `audioRepeatButton.minHeight` | 32 | 44 |
| `audioChip.minHeight` | 32 | 44 |
| `revealButton.minHeight` | 38 | 44 |
| `settingChip.minHeight` | 34 | 44 |
| `fontSizeButton` | 36×36 | 44×44 |
| `tajweedButton.minHeight` | 42 | 44 |

### 2.2 `apps/mobile/src/screens/ProfileScreen.styles.js`
| Style | Current | Target |
|-------|---------|--------|
| `backButton` | 38×38 | 44×44 |
| `gearButton` | 40×40 | 44×44 |
| `menuIcon` | 38×38 | 44×44 |
| `sectionLink.minHeight` | 30 | 44 |
| `webAppSectionLink.minHeight` | 30 | 44 |
| `webAppBookmarksBack.minHeight` | 34 | 44 |
| `webAppBookmarkManage.minHeight` | 30 | 44 |
| `webAppZakatHistoryBack.minHeight` | 34 | 44 |
| `webAppZakatHistoryDelete` | 32×32 | 44×44 |
| `choiceRow.minHeight` | 58 | 58 ✓ |
| `formInput.minHeight` | 46 | 46 ✓ |
| `formButton.minHeight` | 46 | 46 ✓ |

### 2.3 `apps/mobile/src/screens/ExploreScreen.styles.js`
| Style | Current | Target |
|-------|---------|--------|
| `backToExplore.minHeight` | 42 | 44 |
| `webAppBookmarksBack.minHeight` | 34 | 44 |
| `webAppBookmarkManage.minHeight` | 30 | 44 |
| `webAppZakatHistoryBack.minHeight` | 34 | 44 |
| `webAppZakatHistoryDelete` | 32×32 | 44×44 |
| `formPrimaryButton.minHeight` | 42 | 44 |
| `loginButton.minHeight` | 42 | 44 |
| `secondaryButton.minHeight` | 42 | 44 |
| `answerButton.minHeight` | 40 | 44 |
| `heirButton` | 28×28 | 44×44 |
| `webAppDetailBack.minHeight` | 34 | 44 |
| `webAppZakatHistoryBack.minHeight` | 34 | 44 |

---

## 📋 Phase 3: Remaining Screens & Components

### 3.1 `apps/mobile/src/screens/QiblaScreen.js` (inline styles)
- [ ] `statusChip.minHeight: 44` (was 30)
- [ ] Verify `manualLocInput.minHeight: 44` ✓
- [ ] Verify `button.minHeight: 48` ✓
- [ ] `metric` cards: padding adequate ✓

### 3.2 `apps/mobile/src/screens/HistoricalMapView.js`
- [ ] `tags.gap: spacing.sm` (was hardcoded `4`)
- [ ] `tag.paddingVertical: spacing.xs` (was hardcoded `2`) — minimum 44dp height via font+padding
- [ ] `tag.paddingHorizontal: 6` → `spacing.xs` (4) or `spacing.sm` (8)

### 3.3 `apps/mobile/src/screens/TokohTarikhContent.js`
- [ ] `searchInput.minHeight: 44` ✓
- [ ] `chip` (filter): `paddingVertical: 6` → `spacing.xs` (4) but ensure 44dp total height
- [ ] `card.minHeight` not set — relies on content; verify Pressable area ≥44dp
- [ ] `webAppCard` same
- [ ] Modal close area: `modalClose.padding: spacing.sm` → ensure 44×44 hit area

---

## 📋 Phase 4: Verification & Polish

### 4.1 Automated Checks
- [ ] Add ESLint rule or custom script to flag `minHeight < 44` on Pressable/Touchable components
- [ ] Add check for `gap < 8` / `paddingVertical < 8` on interactive containers

### 4.2 Device Testing
- [ ] Physical device (z5yxpjrgvw8pdqzt): verify all tap targets feel comfortable
- [ ] Emulator: screenshot comparison before/after
- [ ] Dark/Light/Classic themes all verified
- [ ] Web app layout mode verified

### 4.3 Edge Cases
- [ ] Landscape orientation
- [ ] Foldable/large screens
- [ ] Accessibility: large font sizes don't break touch targets
- [ ] RTL layout (Arabic content)

---

## 🔧 Implementation Notes

### Token Usage Pattern
```javascript
// Good
import { spacing, touchTarget } from "../theme";
minHeight: touchTarget,        // 44
paddingVertical: spacing.sm,   // 8
gap: spacing.sm,               // 8

// Avoid
minHeight: 32,
paddingVertical: 4,
gap: 2,
```

### Hit Slop vs Visual Size
- Use `hitSlop={12}` for small visual elements that need larger touch area
- But prefer visual ≥44dp for consistency and accessibility

### Safe Areas
- `MobileBottomNav`: `paddingBottom: Math.max(insets.bottom, spacing.xs)` ✓
- `MobileTopHeader`: no safe area handling — verify notch/inset clearance
- `Screen` component: should handle top/bottom insets

---

## 📦 Deliverables

1. **Modified files** (see phases above)
2. **Theme update** with `touchTarget` constant
3. **Test verification**: mobile tests pass (790), visual regression screenshots
4. **Release APK** with fixes installed on device

---

## ⏱️ Estimated Effort

| Phase | Files | Est. Time |
|-------|-------|-----------|
| 1: Theme + Shared | 6 | 45 min |
| 2: Major Screens | 3 | 60 min |
| 3: Remaining | 3 | 30 min |
| 4: Verification | — | 30 min |
| **Total** | **12** | **~2.5 hrs** |

---

## 🚀 Next Steps

1. Review and approve this plan
2. Start Phase 1 implementation
3. Rebuild release APK after each phase for device testing
4. Commit with message: "mobile: fix touch targets and spacing per design audit"