# Deep Review UI/UX & Mobile Design System v2 (2026-09-25)

> Audit komprehensif design system `apps/mobile`: token theming, tipografi Arab/Latin, spacing, padding, margin, dark mode, touch target, virtualisasi, dan konsistensi lintas semua screen/route termasuk child components.

---

## 1. Token Theming & Warna

### ✅ Sudah Baik
- **`theme.js`**: Dual-theme `light`/`dark` + `classic` (paper/web-app) lengkap 50+ token warna.
- **`getThemeColors({isDark, isPaperLayout})`**: Fungsi resolver terpusat dipakai di mayoritas screen utama.
- **Sub-routes Belajar (`ExploreWebAppRoutes.js`)**: Sudah migrasi ke `ExploreWebAppTheme.js` generator token dinamis.

### ❌ Masih Hardcoded Hex (Butuh Refactor ke Token)
| File | Contoh Hardcoded | Token Target |
|------|------------------|--------------|
| `WebAppKajianRoute.js` | `#ffffff`, `#f8fafc`, `#e5e7eb`, `#0f172a`, `#1e293b` | `colors.card`, `colors.surface`, `colors.border` |
| `WebAppForumRoute.js` | `#ffffff`, `#111827`, `#0f172a` | `colors.card`, `colors.bg`, `colors.surface` |
| `WebAppTafsirRoute.js` | `#ffffff`, `#f8fafc`, `#e5e7eb` | `colors.card`, `colors.surface`, `colors.border` |
| `WebAppLibraryRoute.js` | `#ffffff`, `#f8fafc`, `#e5e7eb` | `colors.card`, `colors.surface`, `colors.border` |
| `WebAppPerawiRoute.js` | `#ffffff`, `#f8fafc` | `colors.card`, `colors.surface` |
| `WebAppFeedRoute.js` | `#ffffff`, `#f8fafc` | `colors.card`, `colors.surface` |
| `WebAppSirohRoute.js` | `#f8fafc`, `#ffffff`, `#e5e7eb` | `colors.surface`, `colors.card`, `colors.border` |
| `WebAppKamusRoute.js` | `#f8fafc`, `#ffffff`, `#e5e7eb` | `colors.surface`, `colors.card`, `colors.border` |
| `WebAppHijriRoute.js` | `#ffffff`, `#f1f5f9`, `#ecfdf5` | `colors.card`, `colors.surfaceMuted`, `colors.primarySoft` |
| `WebAppImsakiyahRoute.js` | `#f8fafc`, `#ffffff` | `colors.surface`, `colors.card` |
| `WebAppToolRoute.js` | `#f8fafc`, `#ecfdf5` | `colors.surface`, `colors.primarySoft` |
| `WebAppLeaderboardRoute.js` | `#f8fafc`, `#ffffff` | `colors.surface`, `colors.card` |

---

## 2. Tipografi Arab (arabicTypography.js)

### Token Saat Ini
```js
small:   { fontSize: 18, lineHeight: 34 }  // ratio 1.89 ✅
compact: { fontSize: 21, lineHeight: 40 }  // ratio 1.90 ✅
body:    { fontSize: 24, lineHeight: 46 }  // ratio 1.92 ✅
large:   { fontSize: 29, lineHeight: 56 }  // ratio 1.93 ✅
centered:{ fontSize: 26, lineHeight: 50 }  // ratio 1.92 ✅
hero:    { fontSize: 38, lineHeight: 72 }  // ratio 1.89 ✅
input:   { fontSize: 22, lineHeight: 42 }  // ratio 1.91 ✅
```
**Semua ratio ≥ 1.8×** — aman untuk harakat tanwin.

### ❌ Inline Override Tanpa `lineHeight` (Berisiko Clipping)
| File | Line | Pattern |
|------|------|---------|
| `QuranScreen.styles.js` | 162, 171, 216, 451, 462, 745 | `fontFamily: QURAN_FONT_FAMILIES.kitab` + `fontSize` tapi **tanpa `lineHeight`** |
| `HomeDashboardContent.js` | 1696, 1777 | `...arabicTypography.small` + override `fontSize: 24`, `lineHeight: 40` (ratio 1.67 ❌) |
| `WebAppKamusRoute.js` | 338 | `arabicText: { fontSize: 22, lineHeight: 36 }` (ratio 1.64 ❌) |
| `WebAppSirohRoute.js` | — | Tidak pakai `arabicTypography` sama sekali |

**Rekomendasi**: Semua teks Arab wajib spread `...arabicTypography.{size}` lalu override `fontSize` **dan** `lineHeight` bersamaan (pertahankan ratio ≥ 1.8).

---

## 3. Tipografi Latin (Skala & Konsistensi)

### Skala de facto di codebase
| Ukuran | Penggunaan Utama | Contoh File |
|--------|------------------|-------------|
| 10 | Meta/muted, badge kecil | `HadithScreen.js:2417`, `ProfileScreen.styles.js:213` |
| 11 | Label kecil, caption | `HomeDashboardContent.js:1640`, `HadithScreen.js:2551` |
| 12 | Body kecil, meta, chip | `HadithScreen.js:2388`, `WebAppFiqhRoute.js:148` |
| 13 | Body standar, button text | `HadithScreen.js:2574`, `WebAppFiqhRoute.js:149` |
| 14 | Title card, subtitle | `HomeDashboardContent.js:1745`, `WebAppSirohRoute.js:262` |
| 15 | Section title | `IbadahScreen.js:548`, `WebAppHijriRoute.js:513` |
| 16 | Heading kecil | `WebAppHijriRoute.js:513` |
| 18-20 | Title medium | `ProfileScreen.styles.js:520`, `HomeDashboardContent.js:1744` |
| 22-24 | Title besar | `ProfileScreen.styles.js:84`, `QuranScreen.styles.js:162` |
| 28-34 | Hero/Display | `IbadahScreen.js:485`, `ProfileScreen.styles.js:351` |
| 38 | Hero Arabic | `arabicTypography.hero` |

### ❌ Inconsistency Ditemukan
- `WebAppSirohRoute.js:262` title `fontSize: 24` tapi `WebAppKamusRoute.js:118` title `fontSize: 24` — OK.
- `WebAppHijriRoute.js:512` `fastingTitle: 16` vs `WebAppFiqhRoute.js:148` `cardTitle: 14` — beda 2pt untuk level serupa.
- `HomeDashboardContent.js:1744` `dailyTitle: 15` vs `WebAppSirohRoute.js:262` `title: 24` — beda 9pt untuk heading section yang mirip.

**Action**: Standarkan **Type Scale** global:
```
Display: 32/40 (hero)
H1:      24/32 (screen title)
H2:      20/28 (section title)
H3:      18/26 (card title)
Body:    14/20 (body text)
Small:   12/18 (meta/caption)
Micro:   10/14 (badge/timestamp)
```

---

## 4. Spacing System (`theme.js`)

### Token Saat Ini
```js
xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32
```

### ❌ Magic Numbers (Hardcoded Pixel) Ditemukan
| File | Nilai | Konteks | Token Target |
|------|-------|---------|--------------|
| `QuranScreen.styles.js` | 3, 5, 6, 9, 18 | padding/margin/gap internal | `spacing.xs`/`sm`/`md` |
| `HadithScreen.js` | 2, 3, 4, 5, 6, 9 | lineHeight, marginTop, gap | `spacing.xs` + calculated lineHeight |
| `WebAppSirohRoute.js` | 3, 5, 9 | marginTop, gap | `spacing.xs`/`sm` |
| `WebAppKamusRoute.js` | 3, 5, 9 | marginTop, gap | `spacing.xs`/`sm` |
| `WebAppHijriRoute.js` | 2, 4, 6 | marginTop, padding | `spacing.xs`/`sm` |
| `HomeDashboardContent.js` | 2, 3, 4, 5, 6 | marginTop internal | `spacing.xs` |

**Rule**: **Zero magic numbers**. Semua spacing wajib pakai `spacing.{token}` atau kalkulasi dari token (mis. `spacing.md / 2`).

---

## 5. Border Radius (`theme.js`)

### Token Saat Ini
```js
sm: 8, md: 12, lg: 16, xl: 24
```

### ❌ Hardcoded Radius
| File | Nilai | Token Target |
|------|-------|--------------|
| `QuranScreen.styles.js` | 18, 999 | `radius.lg` / `radius.xl` / `999` → buat `radius.full: 999` |
| `WebAppSirohRoute.js` | 12, 999 | `radius.lg`, `radius.full` |
| `WebAppKamusRoute.js` | 12, 999 | `radius.lg`, `radius.full` |
| `WebAppHijriRoute.js` | 12 | `radius.lg` |
| `WebAppFiqhRoute.js` | 12 | `radius.lg` |
| `HomeDashboardContent.js` | 16 | `radius.lg` |

**Action**: Tambah `radius.full: 999` di `theme.js`, ganti semua `999` dan `borderRadius: 12` → `radius.lg`.

---

## 6. Dark Mode Coverage per Route

| Route | `useLayoutModePreference` | Dual-Mode Styles | Status |
|-------|---------------------------|------------------|--------|
| `HomeScreen` / `HomeDashboardContent` | ✅ | ✅ (dynamic `getThemeColors`) | **OK** |
| `QuranScreen` | ✅ | ✅ (webAppQuranTheme) | **OK** |
| `HadithScreen` | ✅ | ✅ (WEB_APP_HADITH_THEMES) | **OK** |
| `PrayerScreen` | ✅ | ✅ | **OK** |
| `QiblaScreen` | ✅ | ✅ | **OK** |
| `IbadahScreen` | ✅ | ✅ (WEB_APP_IBADAH_LIGHT/DARK) | **OK** |
| `KhatamScreen` | ✅ | ✅ | **OK** |
| `ProfileScreen` | ✅ | ✅ | **OK** |
| `GlobalSearchScreen` | ✅ | ✅ | **OK** |
| `HistoricalMapScreen` | ✅ | ✅ | **OK** |
| `WebAppTasbihRoute` | ✅ | ✅ (styles + Dark variants) | **OK** |
| `WebAppKomunitasRoute` | ✅ | ✅ | **OK** |
| `WebAppFiqhRoute` | ✅ | ✅ | **OK** |
| `WebAppPerawiRoute` | ✅ | ✅ | **OK** |
| `WebAppForumRoute` | ✅ | ✅ | **OK** |
| `WebAppFeedRoute` | ✅ | ✅ | **OK** |
| `WebAppLibraryRoute` | ✅ | ✅ | **OK** |
| `WebAppReferenceListRoute` | ✅ | ✅ | **OK** |
| `WebAppAmalanRoute` | ✅ | ✅ | **OK** |
| `WebAppDoaRoute` | ✅ | ✅ | **OK** |
| `WebAppSholatTrackerRoute` | ✅ | ✅ | **OK** |
| `WebAppLessonsRoute` | ✅ | ✅ | **OK** |
| `WebAppBlogRoute` | ✅ | ✅ (isDark + Dark styles) | **OK** |
| `WebAppFaraidhRoute` | ✅ | ✅ | **OK** |
| `WebAppQuizRoute` | ✅ | ✅ | **OK** |
| `WebAppAsmaulRoutes` | ✅ | ✅ (inline conditional) | **OK** |
| `WebAppZakatRoute` | ✅ | ✅ | **OK** |
| **`WebAppKajianRoute`** | ✅ | ❌ (hanya `isDarkTheme` di header, **stylesheet statis light**) | **PERLU REFACTOR** |
| **`WebAppSirohRoute`** | ❌ | ❌ (stylesheet statis light) | **PERLU REFACTOR** |
| **`WebAppKamusRoute`** | ❌ | ❌ (stylesheet statis light) | **PERLU REFACTOR** |
| **`WebAppHijriRoute`** | ❌ | ❌ (stylesheet statis light) | **PERLU REFACTOR** |
| **`WebAppImsakiyahRoute`** | ❌ | ❌ (stylesheet statis light) | **PERLU REFACTOR** |
| **`WebAppToolRoute`** | ❌ | ❌ (stylesheet statis light) | **PERLU REFACTOR** |
| **`WebAppLeaderboardRoute`** | ❌ | ❌ (stylesheet statis light) | **PERLU REFACTOR** |

**Priority P0**: `WebAppKajianRoute` (sudah import hook tapi stylesheet belum dual-mode), lalu 6 route tanpa hook sama sekali.

---

## 7. Touch Target & Ripple Feedback

### Standar
- **Apple HIG**: ≥ 44×44 pt
- **Material Design**: ≥ 48×48 dp
- **Project token**: `touchTarget = 44`, `touchTargetSmall = 40`

### ❌ Ikon Header/Sheet Tanpa `hitSlop`
| File | Komponen | Fix |
|------|----------|-----|
| `QuranScreen.js` | Header audio btn, ayat play btn | `hitSlop={12}` |
| `HadithScreen.js` | Detail tab buttons, action sheet triggers | `hitSlop={8}` |
| `WebAppKajianRoute.js` | Speaker filter pills, transcript play | `hitSlop={8}` |
| `WebAppForumRoute.js` | Vote buttons, thread actions | `hitSlop={8}` |
| `WebAppTafsirRoute.js` | Copy/share/play buttons | `hitSlop={8}` |
| Semua `WebApp*Route` | Header back/icon buttons | `hitSlop={12}` |

### ❌ Ripple Statis
```js
// Ditemukan di banyak file:
android_ripple={{ color: "#1f2937" }}  // statis dark
```
**Fix**: Pakai token `colors.ripple` (light: `rgba(0,0,0,0.08)`, dark: `rgba(255,255,255,0.12)`) atau `Platform.select`.

---

## 8. Virtualisasi List (FlatList vs ScrollView.map)

### ❌ ScrollView + .map() pada List Potensial Besar
| File | List Type | Estimasi Item | Fix |
|------|-----------|---------------|-----|
| `GlobalSearchScreen.js` | Search results | 50-500+ | `FlatList` + `initialNumToRender={10}` |
| `WebAppKajianRoute.js` | Transcript results | 20-200+ | `FlatList` (sudah ada pagination) |
| `WebAppLibraryRoute.js` | Book cards | 20-100 | `FlatList` |
| `WebAppPerawiRoute.js` | Perawi list | 50-500 | `FlatList` |
| `WebAppForumRoute.js` | Thread list | 20-200 | `FlatList` |
| `WebAppFeedRoute.js` | Feed items | 50-500 | `FlatList` |
| `WebAppBlogRoute.js` | Article cards | 20-100 | `FlatList` |

**Props Standar**:
```js
<FlatList
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ESTIMATED_HEIGHT,
    offset: ESTIMATED_HEIGHT * index,
    index,
  })}
/>
```

---

## 9. Card & Surface Elevation Consistency

### Pattern Saat Ini
- **Paper Layout**: `shadows.paper` (elevation 1, subtle)
- **WebApp Layout**: `borderWidth: 1` + `borderColor` (flat, no shadow)
- **Raised/Modal**: `shadows.raised` (elevation 8)

### ❌ Inconsistency
- `WebAppKajianRoute.js` card pakai `borderWidth: 1` + `shadowOpacity: 0` (flat)
- `WebAppFiqhRoute.js` card pakai `borderWidth: 1` + `shadowOpacity: 0` (flat) — konsisten
- `HomeDashboardContent.js` `dailyCard` pakai `...shadows.paper` (elevated)
- `ProfileScreen` card pakai `borderWidth: 1` tanpa shadow

**Rekomendasi**: Tentukan **2 elevation tier** saja:
1. **Flat** (web-app cards): `borderWidth: 1`, `borderColor: colors.border`, no shadow
2. **Raised** (paper cards, modals): `...shadows.paper` atau `...shadows.raised`

Hapus campuran `borderWidth + shadowOpacity` yang menciptakan visual "double border".

---

## 10. Input & Form Consistency

### ❌ Inconsistency Ditemukan
| Property | Variasi | Standar Target |
|----------|---------|----------------|
| `minHeight` | 42, 44, 46, 48, 52, 96 | `touchTarget` (44) untuk actionable, 96 untuk multiline |
| `paddingHorizontal` | 12, 14, 16, 20 | `spacing.md` (12) atau `spacing.lg` (16) |
| `borderRadius` | 8, 10, 12, 999 | `radius.md` (12) / `radius.full` (999) |
| `placeholderTextColor` | `#94a3b8`, `#64748b`, `#9ca3af` | `colors.muted` (light) / `colors.muted` (dark) |

**Action**: Buat `InputField` component terpusat di `components/` dengan props `variant: 'default' | 'search' | 'multiline'`.

---

## 11. Icon Sizing & Stroke

### Token Saat Ini
```js
iconStroke: { thin: 1.9, regular: 2.2, bold: 2.5 }
```

### ❌ Hardcoded `strokeWidth`
| File | Nilai | Token Target |
|------|-------|--------------|
| `QuranScreen.styles.js` | 2.1, 2.2 | `iconStroke.regular` / `iconStroke.bold` |
| `HomeDashboardContent.js` | 2.1 | `iconStroke.regular` |
| `WebAppSirohRoute.js` | 1.8, 2.1 | `iconStroke.thin` / `iconStroke.regular` |
| `WebAppKamusRoute.js` | 2, 1.7 | `iconStroke.regular` / `iconStroke.thin` |

---

## 12. Priority Action Plan

### P0 (Critical - Blokir Dark Mode Standalone)
1. **`WebAppKajianRoute.js`** — Refactor 1600+ lines stylesheet ke dual-mode (sudah ada `isDarkTheme` hook)
2. **`WebAppSirohRoute.js`** — Tambah `useLayoutModePreference`, buat dark stylesheet
3. **`WebAppKamusRoute.js`** — Tambah hook, buat dark stylesheet
4. **`WebAppHijriRoute.js`** — Tambah hook, buat dark stylesheet
5. **`WebAppImsakiyahRoute.js`** — Tambah hook, buat dark stylesheet
6. **`WebAppToolRoute.js`** — Tambah hook, buat dark stylesheet
7. **`WebAppLeaderboardRoute.js`** — Tambah hook, buat dark stylesheet

### P1 (Typography & Spacing System)
8. Standarkan Type Scale global (buat `typography.js` token)
9. Hapus semua magic numbers spacing → `spacing.{token}`
10. Tambah `radius.full: 999`, ganti semua hardcoded radius
11. Fix Arabic `lineHeight` override di `HomeDashboardContent.js:1696`, `WebAppKamusRoute.js:338`

### P2 (Touch & Performance)
12. Tambah `hitSlop={8-12}` pada semua ikon header/sheet/actionable
13. Ganti `android_ripple` statis ke token adaptive
14. Migrasi `ScrollView.map()` → `FlatList` di 7 route (lihat tabel §8)

### P3 (Polish)
15. Buat `InputField` component terpusat
16. Standarkan icon `strokeWidth` ke `iconStroke` token
17. Konsistenkan elevation tier (flat vs raised)

---

## 13. Test & Verifikasi

- ✅ **Jest**: 56 suites, 794 tests **PASS**
- ✅ **Go Backend**: `go build ./...` **PASS**
- ✅ **APK Release**: Built, installed, launched di emulator `emulator-5554`
- ⏳ **Visual QA**: Pending manual check di emulator untuk:
  - Dark/Light mode toggle di semua 7 route P0
  - Arabic text clipping pada font size kecil/medium/large
  - Touch target 44dp pada ikon header
  - Scroll performance pada list >50 item

---

## 14. File Referensi Utama

| Kategori | File |
|----------|------|
| Theme Tokens | `apps/mobile/src/theme.js` |
| Arabic Typography | `apps/mobile/src/styles/arabicTypography.js` |
| Quran Styles | `apps/mobile/src/screens/QuranScreen.styles.js` |
| Hadith Screen | `apps/mobile/src/screens/HadithScreen.js` |
| Home Dashboard | `apps/mobile/src/screens/home/HomeDashboardContent.js` |
| Explore WebApp Theme | `apps/mobile/src/screens/explore/ExploreWebAppTheme.js` |
| Sub-Route P0 | `apps/mobile/src/screens/explore/WebAppKajianRoute.js` |
| Sub-Route Pattern (Good) | `apps/mobile/src/screens/explore/WebAppFiqhRoute.js` |
| Sub-Route Pattern (Good) | `apps/mobile/src/screens/explore/WebAppTasbihRoute.js` |