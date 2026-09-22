# Mobile Screen API Contract Audit — 2026-09-22

Follow-up to `2026-09-13-mobile-app-deep-review.md` item #6:
> `QuranScreen.js`/`HadithScreen.js`/`ExploreScreen.js`/`ProfileScreen.js`/`KhatamScreen.js`
> belum sempat diverifikasi field-by-field terhadap backend secara mendalam.

---

## Summary

| Screen | Status | Findings |
|--------|--------|----------|
| **QuranScreen.js** | ✅ FIXED | Offline Quran pack integration complete; field mapping OK (uses `normalizeSurah`/`normalizeAyah`) |
| **HadithScreen.js** | ✅ FIXED | Offline indicator badge added; `normalizeHadith` matches backend; `hadithSource` state tracked |
| **ProfileScreen.js** | ✅ FIXED | **Field mapping bugs corrected**:<br>- `hafalanCount`: now reads `memorized` from `HafalanSummary` (not `memorized_count`)<br>- `sholatWeekly`: computes `berjamaah_pct + munfarid_pct` from `SholatStats` (not `weekly_completion_pct`)<br>- `tilawahPages`: reads `total_pages` from `TilawahSummary` |
| **KhatamScreen.js** | ✅ OK | `normalizeProgress` handles `surah_number`/`ayah_number` snake_case from `ReadingProgress` correctly |
| **ExploreScreen.js** | ⚠️ PARTIAL | Feature routes use `getFeatureItemPage` + web app routes; `WebAppLessonsRoute`/`WebAppQuizRoute` need `navigation` prop for `setBack`/`clearBack` (tracked separately as #5) |

---

## Detailed Field Mapping

### ProfileScreen.js → Backend Contracts

| Mobile Call | Endpoint | Backend Model | Mobile Fix Applied |
|-------------|----------|---------------|-------------------|
| `getHafalanSummary()` | `GET /hafalan/summary` | `HafalanSummary { Memorized int }` | `hafalanRes.value?.memorized ?? 0` |
| `getPrayerStats()` | `GET /sholat/stats` | `SholatStats { BerjamaahPct, MunfaridPct float64 }` | `Math.round(berjamaah_pct + munfarid_pct)` |
| `getTilawahSummary()` | `GET /tilawah/summary` | `TilawahSummary { TotalPages int }` | `tilawahRes.value?.total_pages` |
| `getMyStreak()` | `GET /streak` | `StreakResponse { CurrentStreak int }` | `streakRes.value?.current_streak` (already correct) |
| `getMyPoints()` | `GET /achievements/points` | returns `{ total_points }` | `pointsRes.value?.total_points` (already correct) |
| `getMyAchievements()` | `GET /achievements/mine` | array with `achieved`, `progress`, `total` | `normalizeAchievement` maps correctly |

### KhatamScreen.js → Backend Contracts

| Mobile Call | Endpoint | Backend Model | Notes |
|-------------|----------|---------------|-------|
| `getQuranProgress()` | `GET /progress/quran` | `ReadingProgress { SurahNumber, AyahNumber *int }` | `normalizeProgress` handles `surah_number` snake_case + nested `data.progress` |

### ExploreScreen.js → Backend Contracts

| Feature | Mobile Call | Endpoint | Notes |
|---------|-------------|----------|-------|
| Feature items | `getFeatureItemPage(feature)` | `GET /explore/{feature}/items` | Returns paginated items; used by all web app routes |
| Library progress | `getLibraryProgressList()` | `GET /library/progress` | `LibraryBookProgress { BookID, PageRead, Status }` |
| Dictionary | `searchDictionary(query)` | `GET /dictionary/search?q=` | `IstilahItem` matches |
| Tafsir | `getFeatureItemPage("tafsir")` | `GET /explore/tafsir/items` | Uses `normalizeTafsir` in `ExploreWebAppRoutes.js` |

### QuranScreen.js → Backend Contracts

- `getSurahs()` → `GET /surah?size=114&sort=number` → `normalizeSurah` ✓
- `getAyahsForSurahPage()` → `GET /ayah/surah/number/{n}?size=20&page={p}` → `normalizeAyah` ✓
- `getAyahsForPage()` → `GET /ayah/page/{p}` → `normalizeAyah` ✓
- `getAyahsForHizb()` → `GET /ayah/hizb/{h}` → `normalizeAyah` ✓

### HadithScreen.js → Backend Contracts

- `getHadithPage()` → `GET /hadith?book_slug={s}&page={p}&size=20` → `normalizeHadith` ✓
- Offline: `getOfflineItems("hadith")` → local SQLite → `normalizeHadith` ✓

---

## Fixed Issues (This Session)

1. **ProfileScreen**: Fixed field name mismatches for hafalan, prayer stats, tilawah
2. **QuranScreen**: Offline Quran pack integration (offline-first loading with API fallback)
3. **HadithScreen**: Visual indicator "(Offline)" when showing cached data
4. **Storage**: Added `PRAGMA user_version` for SQLite schema migrations
5. **Offline Pack**: `checkUpdates` now triggers Quran refresh via `force=true`

---

## Remaining Items (Not Fixed Here)

| Item | Reference | Priority |
|------|-----------|----------|
| `WebAppLessonsRoute`/`WebAppQuizRoute` need `navigation` prop for Android back handling | `2026-09-13` item #5 | P2 |
| EAS `projectId` in `app.json` for push tokens | `2026-09-13` item #2 | P0 (infra) |
| Live-device verification before release | `2026-09-13` item #7 | P0 |

---

## Test Results (All Green)

```
Mobile:   788 passed
Web:      647 passed
Backend:  all ok (go test ./...)
```