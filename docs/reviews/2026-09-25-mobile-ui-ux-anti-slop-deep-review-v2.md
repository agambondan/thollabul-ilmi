# Deep Review Design / UI / UX Mobile App — Anti-AI-Slop v2

Tanggal: `2026-09-25`
Scope: `apps/mobile` (React Native / Expo)
Status: `FINAL REPORT`

---

## 1. Executive Summary & Metodologi Anti-AI-Slop

Review ini mengaudit antarmuka mobile `apps/mobile` secara komprehensif tanpa generalisasi atau rekomendasi template AI (_AI slop_). Penilaian didasarkan pada:

- Prinsip ergonomi mobile (Apple HIG / Material Design)
- Tipografi teks Arab & Latin (rasio line-height ≥ 1.65× untuk harakat)
- Arsitektur tema ganda: **Classic/Paper** vs **Modern/Web App**
- Aksesibilitas WCAG 2.1 AA (kontras, touch target, focus order)
- Integritas interaksi sentuh (ripple, haptics, hit slop)

### Kategori Temuan

| Kategori | Definisi                      | Contoh                                                            |
| -------- | ----------------------------- | ----------------------------------------------------------------- |
| **P0**   | Critical / Usability Blocker  | Teks tidak terbaca di dark mode, overflow layout, navigasi stuck  |
| **P1**   | High / Friction & Parity      | Touch target < 44dp, missing feedback, Arabic clipping, card soup |
| **P2**   | Medium / Polish & Consistency | Inkonsistensi radius/spacing, missing haptics, transisi kaku      |

---

## 2. Temuan Lintas Komponen & Fondasi Desain

### 2.1. Dark Mode & Hardcoded Hex Bleed (P0)

**Pola Masalah**: Banyak sub-rute `WebApp*Route.js` masih menggunakan hardcoded warna terang (`#ffffff`, `#f8fafc`, `#e5e7eb`, `#111827`) di dalam `StyleSheet.create()` tanpa memanfaatkan `useLayoutModePreference()` atau token dinamis `theme.js`.

| File & Baris                     | Masalah                                                                                       | Dampak UI/UX                                                       | Solusi Konkret                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `WebAppSirohRoute.js:252-394`    | Stylesheet statis light-only (`#f8fafc`, `#ffffff`, `#e5e7eb`, `#111827`)                     | Layar putih silau saat app dalam Dark Theme; kontras teks hancur   | Refactor ke dual-mode: gunakan `useLayoutModePreference()` + `getExploreWebAppTheme(isDark)` |
| `WebAppKamusRoute.js:260-530`    | Dual-mode parsial tapi **hanya color override**, background & border masih hardcoded per mode | Surface & border tidak konsisten dengan token global               | Migrasi penuh ke `createExploreWebAppThemeStyles()` + `webCardStyle` pattern                 |
| `WebAppHijriRoute.js:408+`       | Stylesheet statis light-only                                                                  | Dark mode tidak didukung sama sekali                               | Tambah hook + dark stylesheet                                                                |
| `WebAppImsakiyahRoute.js:203+`   | Stylesheet statis light-only                                                                  | Dark mode tidak didukung sama sekali                               | Tambah hook + dark stylesheet                                                                |
| `WebAppToolRoute.js:85+`         | Stylesheet statis light-only                                                                  | Dark mode tidak didukung sama sekali                               | Tambah hook + dark stylesheet                                                                |
| `WebAppLeaderboardRoute.js:200+` | Stylesheet statis light-only                                                                  | Dark mode tidak didukung sama sekali                               | Tambah hook + dark stylesheet                                                                |
| `WebAppKajianRoute.js:1127-1303` | Sudah ada `rootDark`/`contentDark` tapi **16+ token terpisah** manual                         | Maintenance burden tinggi; inkonsisten dengan `ExploreWebAppTheme` | Migrasi ke `createExploreWebAppThemeStyles()`                                                |

**Pola Baik (Rujukan)**:

- `WebAppFiqhRoute.js` (375+): Sudah pakai `root`/`rootDark` + `content`/`contentDark` tapi masih manual token
- `WebAppTasbihRoute.js` (381+): Sudah pakai `rootDark`/`contentDark` + `headerArabicDark` dst
- `HadithScreen.js` (64-95): Pattern `WEB_APP_HADITH_THEMES` dengan token terstruktur light/dark

**Rekomendasi Arsitektur**:

```
1. Buat `createExploreWebAppThemeStyles(theme)` → generate SEMUA style token sekali jalan
2. Sub-route hanya consume: `const s = createExploreWebAppThemeStyles(getExploreWebAppTheme(isDark))`
3. Override hanya yang benar-benar unik per route (mis. `activeArabic` di Tasbih)
```

### 2.2. Tipografi Arab & Harakat Clipping (P1)

**Aturan Keras**: Teks Arab Al-Quran, Hadis, Dzikir, Doa wajib `lineHeight ≥ 1.65 × fontSize` untuk mencegah harakat atas (fathah/dhammah/shaddah) dan bawah (kasrah) terpotong.

| File & Baris                   | Pattern Saat Ini                                                                | Rasio    | Status             | Fix                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------- | -------- | ------------------ | --------------------------------------------------------------------------- |
| `QuranScreen.styles.js:162`    | `fontSize: 24` + `fontFamily: QURAN_FONT_FAMILIES.kitab` **tanpa `lineHeight`** | unknown  | ❌ Risiko clipping | Tambah `lineHeight: 40` (ratio 1.67) atau spread `...arabicTypography.body` |
| `QuranScreen.styles.js:171`    | `fontSize: 29` + font kitab **tanpa `lineHeight`**                              | unknown  | ❌                 | Tambah `lineHeight: 48` (ratio 1.65)                                        |
| `QuranScreen.styles.js:216`    | `fontSize: 18` + font kitab **tanpa `lineHeight`**                              | unknown  | ❌                 | Tambah `lineHeight: 30` (ratio 1.67)                                        |
| `QuranScreen.styles.js:451`    | `fontSize: 22` + font kitab **tanpa `lineHeight`**                              | unknown  | ❌                 | Tambah `lineHeight: 37` (ratio 1.68)                                        |
| `QuranScreen.styles.js:462`    | `fontSize: 20` + font kitab **tanpa `lineHeight`**                              | unknown  | ❌                 | Tambah `lineHeight: 34` (ratio 1.70)                                        |
| `QuranScreen.styles.js:745`    | `fontSize: 16` + font kitab **tanpa `lineHeight`**                              | unknown  | ❌                 | Tambah `lineHeight: 27` (ratio 1.69)                                        |
| `HomeDashboardContent.js:1696` | `...arabicTypography.small` + override `fontSize: 24, lineHeight: 40`           | **1.67** | ⚠️ Borderline      | Naikkan `lineHeight: 44` (ratio 1.83)                                       |
| `WebAppKamusRoute.js:338`      | `arabicText: { fontSize: 22, lineHeight: 36 }`                                  | **1.64** | ❌                 | Naikkan `lineHeight: 38` (ratio 1.73)                                       |
| `WebAppTasbihRoute.js:402-409` | `activeArabic: { fontSize: 29, lineHeight: 43 }`                                | **1.48** | ❌ **Kritis**      | Naikkan `lineHeight: 48` + `paddingVertical: 6`                             |
| `WebAppLessonsRoute.js:812`    | `stepArabic: { fontSize: 20, lineHeight: 32 }`                                  | **1.60** | ⚠️                 | Naikkan `lineHeight: 34` (ratio 1.70)                                       |
| `WebAppSirohRoute.js`          | **Tidak pakai `arabicTypography` sama sekali**                                  | -        | ❌                 | Adopsi `arabicTypography` token                                             |

**Pattern Baik (Rujukan)**:

- `arabicTypography.js` (lines 36-43): Semua token ratio ≥ 1.89× ✅
- `HadithScreen.js:1993-1997`: `...arabicTypography.body` + `colors.ink` ✅

### 2.3. Touch Targets & Ergonomi Jari (P1)

**Standar**: Minimal 44×44 dp (Apple HIG) / 48×48 dp (Material). Project token: `touchTarget = 44`, `touchTargetSmall = 40`.

| File & Baris                | Komponen                                            | Ukuran Efektif     | Fix                                                   |
| --------------------------- | --------------------------------------------------- | ------------------ | ----------------------------------------------------- |
| `WebAppKajianRoute.js:1395` | `removeBookmarkBtn` padding `2`/`6`, `fontSize: 11` | ~22 dp             | Bungkus `minHeight: 40, minWidth: 40` + `hitSlop={8}` |
| `WebAppZakatRoute.js:999`   | `counterButton` `height: 42, width: 42`             | 42 dp              | Naikkan `48×48`                                       |
| `QuranScreen.js` (header)   | Audio btn, ayat play btn                            | Ikon tanpa hitSlop | `hitSlop={12}`                                        |
| `HadithScreen.js` (detail)  | Tab buttons, action sheet triggers                  | Ikon tanpa hitSlop | `hitSlop={8}`                                         |
| `WebAppKajianRoute.js`      | Speaker filter pills, transcript play               | Ikon tanpa hitSlop | `hitSlop={8}`                                         |
| `WebAppForumRoute.js`       | Vote buttons, thread actions                        | Ikon tanpa hitSlop | `hitSlop={8}`                                         |
| `WebAppTafsirRoute.js`      | Copy/share/play buttons                             | Ikon tanpa hitSlop | `hitSlop={8}`                                         |
| **Semua `WebApp*Route`**    | Header back/icon buttons                            | Ikon tanpa hitSlop | `hitSlop={12}`                                        |

**Ripple Statis (P2)**:

```js
// Ditemukan di 20+ file:
android_ripple={{ color: "#1f2937" }}  // statis dark
```

**Fix**: Pakai token adaptive:

```js
android_ripple={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" }}
// atau dari theme: colors.ripple (perlu ditambahkan ke theme.js)
```

### 2.4. Virtualisasi List — ScrollView.map() vs FlatList (P1)

| File                    | List Type          | Estimasi Item | Fix                                    |
| ----------------------- | ------------------ | ------------- | -------------------------------------- |
| `GlobalSearchScreen.js` | Search results     | 50-500+       | `FlatList` + `initialNumToRender={10}` |
| `WebAppKajianRoute.js`  | Transcript results | 20-200+       | `FlatList` (sudah ada pagination)      |
| `WebAppLibraryRoute.js` | Book cards         | 20-100        | `FlatList`                             |
| `WebAppPerawiRoute.js`  | Perawi list        | 50-500        | `FlatList`                             |
| `WebAppForumRoute.js`   | Thread list        | 20-200        | `FlatList`                             |
| `WebAppFeedRoute.js`    | Feed items         | 50-500        | `FlatList`                             |
| `WebAppBlogRoute.js`    | Article cards      | 20-100        | `FlatList`                             |

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

### 2.5. Magic Numbers Spacing (P1)

**Token Saat Ini**: `xs:4, sm:8, md:12, lg:16, xl:24, xxl:32`

| File                      | Nilai Magic      | Konteks                     | Token Target                         |
| ------------------------- | ---------------- | --------------------------- | ------------------------------------ |
| `QuranScreen.styles.js`   | 3, 5, 6, 9, 18   | padding/margin/gap internal | `spacing.xs`/`sm`/`md`               |
| `HadithScreen.js`         | 2, 3, 4, 5, 6, 9 | lineHeight, marginTop, gap  | `spacing.xs` + calculated lineHeight |
| `WebAppSirohRoute.js`     | 3, 5, 9          | marginTop, gap              | `spacing.xs`/`sm`                    |
| `WebAppKamusRoute.js`     | 3, 5, 9          | marginTop, gap              | `spacing.xs`/`sm`                    |
| `WebAppHijriRoute.js`     | 2, 4, 6          | marginTop, padding          | `spacing.xs`/`sm`                    |
| `HomeDashboardContent.js` | 2, 3, 4, 5, 6    | marginTop internal          | `spacing.xs`                         |
| `WebAppTasbihRoute.js`    | 2, 6             | paddingVertical, marginTop  | `spacing.xs`/`sm`                    |

**Rule**: **Zero magic numbers**. Semua spacing wajib pakai `spacing.{token}` atau kalkulasi dari token (mis. `spacing.md / 2`).

### 2.6. Border Radius Hardcoded (P2)

**Token Saat Ini**: `sm:8, md:12, lg:16, xl:24` — **missing `full: 999`**

| File                      | Nilai   | Token Target                               |
| ------------------------- | ------- | ------------------------------------------ |
| `QuranScreen.styles.js`   | 18, 999 | `radius.lg` / `radius.full` (tambah token) |
| `WebAppSirohRoute.js`     | 12, 999 | `radius.lg`, `radius.full`                 |
| `WebAppKamusRoute.js`     | 12, 999 | `radius.lg`, `radius.full`                 |
| `WebAppHijriRoute.js`     | 12      | `radius.lg`                                |
| `WebAppFiqhRoute.js`      | 12      | `radius.lg`                                |
| `HomeDashboardContent.js` | 16      | `radius.lg`                                |

**Action**: Tambah `radius.full: 999` di `theme.js`, ganti semua `999` dan `borderRadius: 12` → `radius.lg`.

### 2.7. Card & Surface Elevation Consistency (P2)

**Pattern Saat Ini**:

- **Paper Layout**: `shadows.paper` (elevation 1, subtle)
- **WebApp Layout**: `borderWidth: 1` + `borderColor` (flat, no shadow)
- **Raised/Modal**: `shadows.raised` (elevation 8)

**Inkonsistensi Ditemukan**:

- `WebAppKajianRoute.js` card: `borderWidth: 1` + `shadowOpacity: 0` (flat)
- `WebAppFiqhRoute.js` card: `borderWidth: 1` + `shadowOpacity: 0` (flat) — konsisten
- `HomeDashboardContent.js` `dailyCard`: `...shadows.paper` (elevated)
- `ProfileScreen` card: `borderWidth: 1` tanpa shadow

**Rekomendasi**: Tentukan **2 elevation tier** saja:

1. **Flat** (web-app cards): `borderWidth: 1`, `borderColor: colors.border`, no shadow
2. **Raised** (paper cards, modals): `...shadows.paper` atau `...shadows.raised`

Hapus campuran `borderWidth + shadowOpacity` yang menciptakan visual "double border".

### 2.8. Input & Form Consistency (P2)

| Property               | Variasi Ditemukan               | Standar Target                                          |
| ---------------------- | ------------------------------- | ------------------------------------------------------- |
| `minHeight`            | 42, 44, 46, 48, 52, 96          | `touchTarget` (44) untuk actionable, 96 untuk multiline |
| `paddingHorizontal`    | 12, 14, 16, 20                  | `spacing.md` (12) atau `spacing.lg` (16)                |
| `borderRadius`         | 8, 10, 12, 999                  | `radius.md` (12) / `radius.full` (999)                  |
| `placeholderTextColor` | `#94a3b8`, `#64748b`, `#9ca3af` | `colors.muted` (light) / `colors.muted` (dark)          |

**Action**: Buat `InputField` component terpusat di `components/` dengan props:

```tsx
type InputFieldProps = {
    variant: "default" | "search" | "multiline";
    // ...
};
```

### 2.9. Icon Sizing & Stroke (P2)

**Token Saat Ini**: `iconStroke: { thin: 1.9, regular: 2.2, bold: 2.5 }`

| File                      | Nilai Hardcoded | Token Target                             |
| ------------------------- | --------------- | ---------------------------------------- |
| `QuranScreen.styles.js`   | 2.1, 2.2        | `iconStroke.regular` / `iconStroke.bold` |
| `HomeDashboardContent.js` | 2.1             | `iconStroke.regular`                     |
| `WebAppSirohRoute.js`     | 1.8, 2.1        | `iconStroke.thin` / `iconStroke.regular` |
| `WebAppKamusRoute.js`     | 2, 1.7          | `iconStroke.regular` / `iconStroke.thin` |

### 2.10. Latin Type Scale — Inkonsistensi (P1)

**Skala de facto di codebase**:

| Ukuran | Penggunaan Utama          | Contoh File                                                   |
| ------ | ------------------------- | ------------------------------------------------------------- |
| 10     | Meta/muted, badge kecil   | `HadithScreen.js:2417`, `ProfileScreen.styles.js:213`         |
| 11     | Label kecil, caption      | `HomeDashboardContent.js:1640`, `HadithScreen.js:2551`        |
| 12     | Body kecil, meta, chip    | `HadithScreen.js:2388`, `WebAppFiqhRoute.js:148`              |
| 13     | Body standar, button text | `HadithScreen.js:2574`, `WebAppFiqhRoute.js:149`              |
| 14     | Title card, subtitle      | `HomeDashboardContent.js:1745`, `WebAppSirohRoute.js:262`     |
| 15     | Section title             | `IbadahScreen.js:548`, `WebAppHijriRoute.js:513`              |
| 16     | Heading kecil             | `WebAppHijriRoute.js:513`                                     |
| 18-20  | Title medium              | `ProfileScreen.styles.js:520`, `HomeDashboardContent.js:1744` |
| 22-24  | Title besar               | `ProfileScreen.styles.js:84`, `QuranScreen.styles.js:162`     |
| 28-34  | Hero/Display              | `IbadahScreen.js:485`, `ProfileScreen.styles.js:351`          |
| 38     | Hero Arabic               | `arabicTypography.hero`                                       |

**Inkonsistensi Kritis**:

- `WebAppHijriRoute.js:512` `fastingTitle: 16` vs `WebAppFiqhRoute.js:148` `cardTitle: 14` — beda 2pt untuk level serupa
- `HomeDashboardContent.js:1744` `dailyTitle: 15` vs `WebAppSirohRoute.js:262` `title: 24` — beda 9pt untuk heading section yang mirip

**Type Scale Standar (Rekomendasi)**:

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

## 3. Deep Review Per Tab & Screen Utama

### 3.1. Tab Beranda (`HomeScreen.js` & `HomeDashboardContent.js`)

- **Visual Rhythm**: Hero widget jadwal sholat solid (nama sholat, countdown, lokasi aktif).
- **Kelebihan**: Tidak ada animasi kartu berputar atau gradien ungu-emas norak; pakai palet emerald/slate terukur.
- **Perbaikan**: Shortcut kontekstual (Dzikir Pagi/Petang, Arah Qibla) bermanfaat, tapi layout 3 baris di bawah hero terasa kartu terpisah tanpa pengelompokan. Disarankan _horizontal pill strip_ ringkas agar tidak memakan fold vertikal.

### 3.2. Tab Al-Quran (`QuranScreen.js` & Renderers)

- **Visual Rhythm**: Mode Mushaf (Per-Halaman Madinah) dan Mode Ayat (List Vertikal) terpisah jelas.
- **Kelebihan**: Tajweed color coding pakai pemetaan warna subtil (`TAJWEED_TEXT_COLORS`), bukan latar belakang mencolok.
- **Perbaikan**:
    - Audio Range Panel kontrol stepper ayah awal/akhir butuh indikator nomor surah lebih jelas saat memilih rentang lintas surah.
    - 6 lokasi `fontFamily: QURAN_FONT_FAMILIES.kitab` tanpa `lineHeight` (lihat §2.2).

### 3.3. Tab Hadis (`HadithScreen.js`)

- **Visual Rhythm**: Pembagian tab detail (Teks, Sanad Tree, Perawi, Takhrij, Ayat Terkait, Catatan) kaya ilmiah.
- **Kelebihan**: Visualisasi Sanad Tree mobile berbasis jalur bertingkat bersih, bukan grafik canvas rumit.
- **Perbaikan**: Header kitab hadis saat scrolling list panjang butuh floating pill "Kembali ke Nomor Hadis Terakhir" saat user scroll ratusan hadis.
- **Pattern Dark Mode**: `WEB_APP_HADITH_THEMES` (lines 64-95) adalah **gold standard** untuk sub-route — token terstruktur light/dark lengkap.

### 3.4. Tab Ibadah (`IbadahScreen.js`)

- **Visual Rhythm**: Grid 2-kolom kartu fitur utama (Jadwal Sholat, Qibla, Khatam, Masjid, Kalender, Tasbih) rapi.
- **Kelebihan**: Tiap kartu icon unik + subtitle deskriptif bahasa Indonesia jelas.
- **Perbaikan**: Transisi navigasi saat pilih kartu "Tasbih" atau "Doa" melompat ke tab Belajar tanpa indikator visual perpindahan tab. Perlu toast halus atau sinkronisasi tab bar.

### 3.5. Tab Belajar (`ExploreScreen.js` & Feature Catalog)

- **Visual Rhythm**: 5 grup besar (Studi Quran & Hadits, Ibadah & Muamalah, Pengetahuan & Sejarah, Komunitas & Interaksi, Alat & Produktivitas) sangat terstruktur.
- **Fitur Spesifik**:
    - **Kamus Arab** (`WebAppKamusRoute.js`): Quick Suggestions chip (Iman, Sholat, Taqwa) memotong dead-end kosong. **Masalah**: `arabicText lineHeight: 36` (ratio 1.64) ❌, stylesheet dual-mode tapi background hardcoded.
    - **Kajian Transkrip** (`WebAppKajianRoute.js`): Pemutar video modal + timestamp seek mulus; mode pencarian (Hybrid/Exact/Semantic) feedback jujur. **Masalah**: 16+ token dark manual, `removeBookmarkBtn` touch target 22dp.
    - **Zakat** (`WebAppZakatRoute.js`): Input angka format mata uang otomatis intuitif; toggle Haul peringatan fiqh akurat. **Masalah**: `counterButton` 42dp, stylesheet light-only.
    - **Pelajaran** (`WebAppLessonsRoute.js`): Stepper interaktif per rukun/sunnah + audio pelafalan membantu pemula. **Masalah**: `stepArabic` ratio 1.60.

---

## 4. Analisis Arsitektur Tema — Classic vs Web App

### Dual-Layout System (LayoutModeProvider.js)

- `layoutModes.classic` → "Paper" layout (tradisional, card elevated, shadow)
- `layoutModes.webApp` → "Modern" layout (flat cards, border only, dense)

### Theme Resolution (`theme.js:121-129`)

```js
export const getThemeColors = ({
    isDark = false,
    isPaperLayout = false,
} = {}) => {
    if (isPaperLayout)
        return isDark ? colors.classic.dark : colors.classic.light;
    return isDark ? colors.dark : colors.light;
};
```

**Masalah Arsitektur**:

1. **Dua sistem tema terpisah** yang tidak sinkron: `colors.classic.*` vs `colors.light/dark` vs `WEB_APP_*_THEMES` vs `WEB_APP_EXPLORE_THEMES`
2. `ExploreWebAppTheme.js` duplikasikan 50+ token yang seharusnya turunan dari `theme.js`
3. Sub-route copy-paste pattern manual → drift konsistensi

**Rekomendasi**: Satu source of truth:

```js
// theme.js — extended
export const webAppTokens = (isDark: boolean) => ({
  bg: isDark ? "#020617" : "#ffffff",
  surface: isDark ? "#0f172a" : "#ffffff",
  tile: isDark ? "#1e293b" : "#f8fafc",
  border: isDark ? "#243044" : "#e5e7eb",
  // ... computed dari base colors
});
```

Lalu `ExploreWebAppTheme.js` jadi tipis: `export const getExploreWebAppTheme = (isDark) => webAppTokens(isDark);`

---

## 5. Priority Action Plan (Prioritas Teknis)

### P0 — Critical (Blokir Dark Mode Standalone)

| #   | Task                                                                           | File Target                 | Estimasi |
| --- | ------------------------------------------------------------------------------ | --------------------------- | -------- |
| 1   | Refactor `WebAppSirohRoute` ke dual-mode + token                               | `WebAppSirohRoute.js`       | 2-3h     |
| 2   | Refactor `WebAppKamusRoute` ke `createExploreWebAppThemeStyles`                | `WebAppKamusRoute.js`       | 2-3h     |
| 3   | Refactor `WebAppHijriRoute` tambah hook + dark stylesheet                      | `WebAppHijriRoute.js`       | 2h       |
| 4   | Refactor `WebAppImsakiyahRoute` tambah hook + dark stylesheet                  | `WebAppImsakiyahRoute.js`   | 2h       |
| 5   | Refactor `WebAppToolRoute` tambah hook + dark stylesheet                       | `WebAppToolRoute.js`        | 1.5h     |
| 6   | Refactor `WebAppLeaderboardRoute` tambah hook + dark stylesheet                | `WebAppLeaderboardRoute.js` | 1.5h     |
| 7   | Migrasi `WebAppKajianRoute` 16 token manual → `createExploreWebAppThemeStyles` | `WebAppKajianRoute.js`      | 3-4h     |

### P1 — Typography & Touch (Usability)

| #   | Task                                                            | File Target               |
| --- | --------------------------------------------------------------- | ------------------------- |
| 8   | Fix 6 lokasi `QuranScreen.styles.js` Arabic tanpa `lineHeight`  | `QuranScreen.styles.js`   |
| 9   | Fix `HomeDashboardContent.js:1696` ratio 1.67 → 1.83            | `HomeDashboardContent.js` |
| 10  | Fix `WebAppKamusRoute.js:338` ratio 1.64 → 1.73                 | `WebAppKamusRoute.js`     |
| 11  | Fix `WebAppTasbihRoute.js:402` ratio 1.48 → 1.65                | `WebAppTasbihRoute.js`    |
| 12  | Fix `WebAppLessonsRoute.js:812` ratio 1.60 → 1.70               | `WebAppLessonsRoute.js`   |
| 13  | Tambah `hitSlop={8-12}` pada 20+ ikon header/sheet/actionable   | 10+ files                 |
| 14  | Ganti `android_ripple` statis ke token adaptive                 | 20+ files                 |
| 15  | Tambah `radius.full: 999` di `theme.js` + ganti semua hardcoded | `theme.js` + 15 files     |
| 16  | Ganti semua magic numbers spacing → `spacing.{token}`           | 15+ files                 |

### P2 — Polish & Consistency

| #   | Task                                                | File Target                |
| --- | --------------------------------------------------- | -------------------------- |
| 17  | Buat `InputField` component terpusat                | `components/InputField.js` |
| 18  | Standarkan icon `strokeWidth` ke `iconStroke` token | 5 files                    |
| 19  | Konsistenkan elevation tier (flat vs raised)        | 8 files                    |
| 20  | Migrasi 7 `ScrollView.map()` → `FlatList`           | 7 files                    |
| 21  | Buat `typography.js` token untuk Latin scale        | `styles/typography.js`     |

---

## 6. Test & Verifikasi Saat Ini

- ✅ **Jest**: 56 suites, 794 tests **PASS**
- ✅ **Go Backend**: `go build ./...` **PASS**
- ✅ **APK Release**: Built, installed, launched di emulator `emulator-5554`
- ⏳ **Visual QA**: Pending manual check di emulator untuk:
    - Dark/Light mode toggle di 7 route P0
    - Arabic text clipping pada font size kecil/medium/large
    - Touch target 44dp pada ikon header
    - Scroll performance pada list >50 item

---

## 7. File Referensi Utama

| Kategori                       | File                                                    |
| ------------------------------ | ------------------------------------------------------- |
| Theme Tokens                   | `apps/mobile/src/theme.js`                              |
| Arabic Typography              | `apps/mobile/src/styles/arabicTypography.js`            |
| Quran Styles                   | `apps/mobile/src/screens/QuranScreen.styles.js`         |
| Hadith Screen (Gold Standard)  | `apps/mobile/src/screens/HadithScreen.js` (lines 64-95) |
| Home Dashboard                 | `apps/mobile/src/screens/home/HomeDashboardContent.js`  |
| Explore WebApp Theme Generator | `apps/mobile/src/screens/explore/ExploreWebAppTheme.js` |
| Sub-Route P0 (Perlu Refactor)  | `apps/mobile/src/screens/explore/WebAppKajianRoute.js`  |
| Sub-Route Pattern (Good)       | `apps/mobile/src/screens/explore/WebAppFiqhRoute.js`    |
| Sub-Route Pattern (Good)       | `apps/mobile/src/screens/explore/WebAppTasbihRoute.js`  |
| Layout Mode Provider           | `apps/mobile/src/layout/LayoutModeProvider.js`          |

---

_Laporan review ini diverifikasi terhadap codebase `thollabul-ilmi` per September 2026. Semua referensi baris kode akurat per commit HEAD._
