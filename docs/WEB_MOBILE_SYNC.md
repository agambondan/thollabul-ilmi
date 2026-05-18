# Web Mobile Sync Documentation

> Tujuan: menjaga parity fitur web (public + dashboard) dan mobile agar agent
> berikutnya tidak menganggap baseline lama sebagai status current.

Last verified: 2026-05-18

## Source Of Truth

- Feature manifest: `docs/features/feature-manifest.json`
- Route parity checker: `node scripts/check-feature-parity.js`
- Web package shortcut: `cd apps/web && npm run check:feature-parity`
- Review history:
  - `docs/reviews/2026-05-17-web-mobile-performance-sync-deep-review.md`
  - `docs/reviews/2026-05-17-followup-journey-cta-sync-review.md`
  - `docs/features/progress/2026-05-17-sync-performance-task-breakdown.md`

Current checker output:

```text
Feature parity check passed.
- manifest features: 50
- manifest utility routes: 14
- mobile feature keys: 43
- web app routes scanned: 151
```

## Current Parity Rule

1. Public feature routes and dashboard feature routes are separate journey
   surfaces. If a feature is available publicly and is active, it must declare
   a dashboard wrapper route unless the feature is explicitly not a web feature.
2. Dashboard CTAs must keep the user inside `/dashboard/...` when the user is
   already in dashboard context.
3. Mobile route parity is tracked through `mobileRoute` in the manifest:
   `tab:<tab>`, `feature:<mobileFeatureKey>`, `ibadah:<view>`,
   `profile:<view>`, or `internal:<view>`.
4. Non-feature routes are not hidden in script exceptions anymore. They must be
   declared in `utilityRoutes`.

## Utility Routes

These routes are intentionally not feature entries, but they are still tracked:

| Route | Surface | Purpose |
| --- | --- | --- |
| `/` | public | Landing page and feature discovery |
| `/contact` | public | Support/contact handoff |
| `/profile` | public | Account/profile handoff outside dashboard shell |
| `/dashboard` | dashboard | Private user landing page |
| `/dashboard/profile` | dashboard | Private account/profile settings |
| `/auth/login` | auth | Login entry for protected journeys |
| `/auth/register` | auth | Registration entry for protected journeys |
| `/dev` | dev | Developer-only utility surface |
| `/apple-icon`, `/icon`, `/manifest.webmanifest`, `/og`, `/robots.txt`, `/sitemap.xml` | system | Metadata and crawler routes |

## Active Feature Coverage

The manifest is the authoritative table. Current active coverage includes:

| Area | Features |
| --- | --- |
| Core worship | Quran, Hadith, Doa, Dzikir, Wirid, Tahlil, Panduan Sholat, Jadwal Sholat, Kiblat, Khatam |
| Quran learning | Tafsir, Asbabun Nuzul, Siroh, Tokoh Tarikh, Sejarah Islam, Peta Islam Interaktif |
| Knowledge | Fiqh, Manasik, Kajian, Perpustakaan Ilmu, Artikel, Perawi, Jarh wa Ta'dil, Forum Tanya Jawab, Kamus Arab |
| Tools | Quiz, Kalender Hijri, Imsakiyah, Tasbih, Zakat, Faraidh |
| Personal | Wirid Pribadi, Amalan Harian, Sholat Tracker, Bookmarks, Notes, Notifications, Goals, Muhasabah, Hafalan, Murojaah, Tilawah, Stats, Leaderboard, Achievements |

## Detail Route Patterns

These route patterns are part of the current journey contract:

| Feature | Public | Dashboard | Notes |
| --- | --- | --- | --- |
| Hadith by book number | `/hadith/:slug/:number` | `/dashboard/hadith/:slug/:number` | Canonical numbered detail page, backed by `GET /api/v1/hadiths/book/:slug/number/:number`. The Indonesian spelling alias `/hadits/:slug/:number` redirects to the canonical public route. |
| Quran/Hadith cross-reference | Quran detail bottom sheet | Hadith detail tab | Mobile now exposes Munasabah and Hadith-Ayah references from Quran detail, and Ayat Terkait from Hadith detail. Cross-reference rows navigate to the related Quran/Hadith screen. |
| Tafsir kitab comparison | `/tafsir/:slug` | `/dashboard/tafsir/:slug` | Web keeps the full selector/comparison controls. Mobile detail view now exposes `Semua`, `Kemenag`, and `Al-Mishbah` modes with stacked comparison so the journey remains readable on small screens. |
| Asmaul Husna wirid | `/asmaul-husna/wirid` | `/dashboard/asmaul-husna/wirid` | Web and mobile both expose the 99-name wirid counter. Mobile stores per-name counts in AsyncStorage, keeps counts when switching names, supports reset/previous/next, fires tap haptics on each count, and uses stronger haptics at 33/99 milestones. |
| Quran audio range player | Quran reader | Dashboard Quran reader | Web and mobile readers both support qari selection, start/end surah range, end ayah limit, repeat, and playback speed. Per-ayah play still works from the ayah action sheet/detail sheet. |
| Perpustakaan Ilmu | `/library`, `/library/:slug` | `/dashboard/library`, `/dashboard/library/:slug` | Web and mobile both expose the same public catalog through `GET /api/v1/library/books` with paginated loading, while admin uses `GET /api/v1/library/admin/books` so draft resources remain manageable without leaking to public catalog. Admin can upload PDF/EPUB/HTML files through `POST /api/v1/library/books/:id/resource` and clear wrong uploads through `DELETE /api/v1/library/books/:id/resource`; web and mobile consume the resulting `source_url` plus file metadata. Dashboard/detail journeys keep notes, bookmarks, source/license verification metadata, study progress badges/filters, and resume surfaces inside the personal shell with `library_book` references and `/api/v1/library/progress`; mobile mirrors progress filters in the feature list. |
| Forum Q&A | `/forum`, `/forum/:slug`, `/forum/ask` | `/dashboard/forum`, `/dashboard/forum/:slug`, `/dashboard/forum/ask` | Mobile now mirrors the forum journey through `feature:forum`: list/search/pagination, question detail, ask form, answer form, question vote, answer vote, and accept-answer action backed by the same `/api/v1/forum/*` endpoints. |
| Zakat/Faraidh saved history | `/zakat/history`, `/faraidh` | `/dashboard/zakat/history`, `/dashboard/faraidh` | Mobile calculators now keep local device history without login and merge it with backend history when the user is authenticated, matching the web local + account-sync journey. Mobile zakat also auto-loads the backend gold price endpoint for current nisab calculations and keeps the manual field editable as fallback. |
| Jadwal Sholat adzan behavior | `/jadwal-sholat` | `/dashboard/jadwal-sholat` | Mobile now has countdown, foreground prayer-time notification, optional adzan audio toggle, reminder scheduling, offline schedule cache, and manual correction controls. |
| Admin analytics | `/admin` | admin-only | Web now records page-view events through `POST /api/v1/analytics/page-view` and renders admin visitor metrics plus traffic insights from `GET /api/v1/analytics/admin/summary`. Authenticated events keep both `visitor_id` and `user_id`; unique visitor aggregation counts `user_id` first and falls back to `visitor_id` for guests. The admin dashboard also derives review queue, content health, content status charts, active user ranking, top pages per source, recent activity rows for tracing user/guest journeys, and a 7/14/30/90-day analytics window selector. Mobile does not mirror admin analytics because this is an admin web surface, not a public/mobile feature. |

Closed historical gaps:

| Feature | Previous baseline | Current status |
| --- | --- | --- |
| Tokoh Tarikh | Missing on mobile/dashboard parity docs | Active in manifest, mobile feature exists, web public + dashboard routes tracked |
| Peta Islam Interaktif | Missing on mobile/dashboard parity docs | Active in manifest, mobile feature exists, web public + dashboard routes tracked |
| Forum Q&A | Missing on mobile/dashboard parity docs | Active in manifest, mobile feature exists, web public + dashboard routes tracked |

## Remaining Parity Deltas

These are not route-missing issues. They are depth/behavior differences that
should stay visible for future planning:

| Feature | Delta |
| --- | --- |
| Achievements and Stats | Web has dedicated dashboard pages; mobile exposes profile/feature surfaces but not the same chart-heavy layout. |

## Mobile Rendering Model

Mobile app has two render paths:

| Path | Files | Usage |
| --- | --- | --- |
| Screen-level | `apps/mobile/src/screens/*Screen.js` | Main tabs and complex flows such as Quran, Hadith, Ibadah, Prayer, Qibla, Home, Profile |
| Feature-level | `apps/mobile/src/data/mobileFeatures.js` + `ExploreScreen.js` | Catalog/list/local tool features such as doa, dzikir, tafsir, peta, forum, notes, bookmarks |

Design constraints:

- Mobile IA follows `docs/MOBILE_IA_FINAL_APPROACH.md`.
- Detail UI uses bottom-sheet modal or detail page. Do not add inline
  expand/collapse.
- Android back navigation must use `setBack`/`clearBack` for sub-navigation.

## Web Journey Model

| Context | Rule |
| --- | --- |
| Public page | CTA can route to public feature details, auth handoff, or dashboard only when the action is explicitly personal/protected. |
| Dashboard page | CTA must stay in dashboard route namespace when the destination has a dashboard wrapper. |
| Personal-only feature | Public route may still exist as auth handoff, but dashboard route is the primary journey. |
| Detail/action subroute | It may be omitted from manifest if it is a child of a manifest-tracked feature route. |

## Maintenance Checklist

When adding or changing a feature:

1. Add/update `docs/features/feature-manifest.json`.
2. Add public and dashboard route wrappers when the feature is active on web.
3. Add/confirm mobile key in `apps/mobile/src/data/mobileFeatures.js` or the
   proper screen/tab route.
4. Run `node scripts/check-feature-parity.js`.
5. If this changes web route structure, also run `cd apps/web && npm run build`.
6. If it changes mobile behavior, run the relevant mobile Jest/E2E checks.
