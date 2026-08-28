# Web Mobile Sync Documentation

> Tujuan: menjaga parity fitur web (public + dashboard) dan mobile agar agent
> berikutnya tidak menganggap baseline lama sebagai status current.

Last verified: 2026-05-30

## Source Of Truth

- Feature manifest: `docs/features/feature-manifest.json`
- Route parity checker: `node scripts/check-feature-parity.js`
- Web package shortcut: `cd apps/web && npm run check:feature-parity`
- Web route UI audit: `cd apps/web && npm run test:e2e:routes`
    - Runs `tests/flows/all-routes-ui-audit.spec.js` against the 154 current
      `src/app` page routes.
    - The GitHub `web-e2e` job runs the full Playwright suite through
      `npm run test:e2e`, so this audit is part of routine CI.
- Mobile feature route audit: `cd apps/mobile && npm run test:feature-routes`
    - Verifies `mobileFeatures.js` route types, API-backed feature endpoints,
      surah content contracts, and the Explore/Belajar feature inventory.
    - The GitHub `mobile-test` job runs the full Jest suite, so this audit is
      covered by routine mobile CI.
- Review history:
    - `docs/features/progress/2026-05-24-web-mobile-runtime-sync.md`
    - `docs/reviews/2026-05-23-web-mobile-feature-parity-deep-review.md`
    - `docs/features/progress/2026-05-23-web-mobile-parity-gap-followup.md`
    - `docs/reviews/2026-05-17-web-mobile-performance-sync-deep-review.md`
    - `docs/reviews/2026-05-17-followup-journey-cta-sync-review.md`
    - `docs/features/progress/2026-05-17-sync-performance-task-breakdown.md`

Current checker output:

```text
Feature parity check passed.
- manifest features: 50
- manifest utility routes: 14
- mobile feature keys: 43
- web app routes scanned: 154
- dashboard page routes scanned: 64
```

Current route UI audit output:

```text
154 passed
```

Current mobile feature route audit output:

```text
1 passed, 10 tests
```

## Routine UI Route Checklist

Run this checklist when a change touches web route layout, dashboard/public
journeys, route wrappers, global floating controls, Playwright mocks, or route
generation:

```bash
cd apps/web
npm run test:e2e:routes
npm run build
cd ../..
git diff --check
```

The route audit verifies mobile viewport rendering for every `page.js` route,
HTTP status, body readiness, console/page errors, Recharts chart-size warnings,
duplicate global settings controls, horizontal overflow, and raw i18n keys.

For mobile feature catalog or Explore route changes, run:

```bash
cd apps/mobile
npm run test:feature-routes
cd ../..
node scripts/check-feature-parity.js
git diff --check
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
5. Dashboard child/detail routes are tracked as journey parity, not route-count
   parity. A `/dashboard/...` page may be omitted from the manifest only when it
   lives under a manifest-tracked dashboard feature route and the equivalent
   mobile journey exists through a detail screen, detail view, or bottom sheet.
   It must not become a top-level mobile tab/menu item unless the IA explicitly
   requires that surface.

## Dashboard Child Route Contract

The web app currently has 64 `/dashboard` page routes. The manifest tracks 50
active feature dashboard routes plus `/dashboard` and `/dashboard/profile` as
utility routes. The remaining dashboard page routes are child/detail journeys
under tracked features:

| Web dashboard child route           | Mobile parity target                     |
| ----------------------------------- | ---------------------------------------- |
| `/dashboard/blog/[slug]`            | Blog feature detail screen or sheet      |
| `/dashboard/forum/[slug]`           | Forum detail view inside `feature:forum` |
| `/dashboard/forum/ask`              | Forum ask form inside `feature:forum`    |
| `/dashboard/hadith/[slug]`          | Hadith tab book/detail stack             |
| `/dashboard/hadith/[slug]/[number]` | Hadith numbered detail stack             |
| `/dashboard/hadith/theme/[slug]`    | Hadith theme detail/list stack           |
| `/dashboard/library/[slug]`         | Library book detail or reader flow       |
| `/dashboard/perawi/[id]`            | Perawi detail screen or bottom sheet     |
| `/dashboard/quran/[slug]`           | Quran reader/detail stack                |
| `/dashboard/quran/page-mushaf`      | Quran mushaf mode or screen              |
| `/dashboard/siroh/[slug]`           | Siroh story detail screen or sheet       |
| `/dashboard/tafsir/[slug]`          | Tafsir detail/comparison view            |
| `/dashboard/zakat/history`          | Zakat history section, screen, or sheet  |

Development rule:

1. Do not chase `64 == 64` route-count parity on native mobile.
2. Do cover every child route as a reachable mobile journey.
3. In `web_app`, the child journey visual treatment should follow the
   corresponding dashboard mobile web view as closely as the native interaction
   model allows.
4. Keep child journeys out of the primary tab/menu catalog unless they are
   promoted to first-class features in `docs/features/feature-manifest.json`.
5. When adding a new `/dashboard/...` page, either add it as a feature/utility
   route in the manifest or keep it under a manifest-tracked dashboard feature
   route and document/update the mobile journey coverage here.

## Utility Routes

These routes are intentionally not feature entries, but they are still tracked:

| Route                                                                                 | Surface   | Purpose                                         |
| ------------------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| `/`                                                                                   | public    | Landing page and feature discovery              |
| `/contact`                                                                            | public    | Support/contact handoff                         |
| `/profile`                                                                            | public    | Account/profile handoff outside dashboard shell |
| `/dashboard`                                                                          | dashboard | Private user landing page                       |
| `/dashboard/profile`                                                                  | dashboard | Private account/profile settings                |
| `/auth/login`                                                                         | auth      | Login entry for protected journeys              |
| `/auth/register`                                                                      | auth      | Registration entry for protected journeys       |
| `/dev`                                                                                | dev       | Developer-only utility surface                  |
| `/apple-icon`, `/icon`, `/manifest.webmanifest`, `/og`, `/robots.txt`, `/sitemap.xml` | system    | Metadata and crawler routes                     |

## Active Feature Coverage

The manifest is the authoritative table. Current active coverage includes:

| Area           | Features                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core worship   | Quran, Hadith, Doa, Dzikir, Wirid, Tahlil, Panduan Sholat, Jadwal Sholat, Kiblat, Khatam                                                                      |
| Quran learning | Tafsir, Asbabun Nuzul, Siroh, Tokoh Tarikh, Sejarah Islam, Peta Islam Interaktif                                                                              |
| Knowledge      | Fiqh, Manasik, Kajian, Perpustakaan Ilmu, Artikel, Perawi, Jarh wa Ta'dil, Forum Tanya Jawab, Komunitas, Kamus Arab                                           |
| Tools          | Quiz, Kalender Hijri, Imsakiyah, Tasbih, Zakat, Faraidh                                                                                                       |
| Personal       | Wirid Pribadi, Amalan Harian, Sholat Tracker, Bookmarks, Notes, Notifications, Goals, Muhasabah, Hafalan, Murojaah, Tilawah, Stats, Leaderboard, Achievements |

## Detail Route Patterns

These route patterns are part of the current journey contract:

| Feature                           | Public                                 | Dashboard                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | -------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hadith by book number             | `/hadith/:slug/:number`                | `/dashboard/hadith/:slug/:number`                                    | Canonical numbered detail page, backed by `GET /api/v1/hadiths/book/:slug/number/:number`. The Indonesian spelling alias `/hadits/:slug/:number` redirects to the canonical public route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Quran/Hadith cross-reference      | Quran detail bottom sheet              | Hadith detail tab                                                    | Mobile now exposes Munasabah and Hadith-Ayah references from Quran detail, and Ayat Terkait from Hadith detail. Cross-reference rows navigate to the related Quran/Hadith screen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Quran ayah action menu            | Quran reader                           | Dashboard Quran reader                                               | Web uses an ayah action menu for play audio, tafsir, mufrodat, ayat terkait, bookmark, catatan, share, copy link, copy image, and copy ayah. Mobile must expose the same action set from a bottom-sheet action menu or detail page action area; the visible placement may differ by layout mode, but actions must not disappear. Share is a two-step journey: choose/create the share asset, then choose a target channel such as system share sheet, WhatsApp, copy link, or download/copy image.                                                                                                                                                                                                                                                                          |
| Tafsir kitab comparison           | `/tafsir/:slug`                        | `/dashboard/tafsir/:slug`                                            | Web keeps the full selector/comparison controls. Mobile detail view now exposes `Semua`, `Kemenag`, and `Al-Mishbah` modes with stacked comparison so the journey remains readable on small screens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Asmaul Husna wirid                | `/asmaul-husna/wirid`                  | `/dashboard/asmaul-husna/wirid`                                      | Web and mobile both expose the 99-name wirid counter. Mobile stores per-name counts in AsyncStorage, keeps counts when switching names, supports reset/previous/next, fires tap haptics on each count, and uses stronger haptics at 33/99 milestones.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Quran audio range player          | Quran reader                           | Dashboard Quran reader                                               | Web and mobile readers both support qari selection, start/end surah range, end ayah limit, repeat, playback speed, minimized player state, and previous/next queue controls. Web audio qari options are derived from playable ayah audio data and `/api/v1/audio/surah/:id` must return playable first-ayah sources as a fallback for surah-level consumers. Per-ayah play still works from the ayah action sheet/detail sheet.                                                                                                                                                                                                                                                                                                                                             |
| Quran mushaf navigator            | `/quran/page-mushaf`                   | `/dashboard/quran/page-mushaf`                                       | Web mushaf page/hizb results must render the same Quran text contract as the main reader: prefer `translation.ar_html` for tajweed coloring, respect the shared Quran font and translation font-size preferences, and link ayahs back to `/quran/surah/:slug#ayah-:number` or `/dashboard/quran/:slug#ayah-:number`. Mobile Quran reader also stores Arabic and translation font-size preferences separately so reader, detail, and mushaf translation text stay aligned with web controls.                                                                                                                                                                                                                                                                                 |
| Perpustakaan Ilmu                 | `/library`, `/library/:slug`           | `/dashboard/library`, `/dashboard/library/:slug`                     | Web and mobile both expose the same public catalog through `GET /api/v1/library/books` with paginated loading, while admin uses `GET /api/v1/library/admin/books` so draft resources remain manageable without leaking to public catalog. Admin can upload PDF/EPUB/HTML files through `POST /api/v1/library/books/:id/resource` and clear wrong uploads through `DELETE /api/v1/library/books/:id/resource`; web and mobile consume the resulting `source_url` plus file metadata. Dashboard/detail journeys keep notes, bookmarks, source/license verification metadata, study progress badges/filters, and resume surfaces inside the personal shell with `library_book` references and `/api/v1/library/progress`; mobile mirrors progress filters in the feature list. |
| Feed Komunitas                    | `/feed`                                | `/dashboard/feed`                                                    | Web public and dashboard routes share `FeedContent`, while mobile exposes the same journey as `feature:community-feed`. Feed remains auth-gated for create/action flows, but browse and handoff surfaces must stay tracked in the manifest so web and mobile do not drift.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Forum Q&A                         | `/forum`, `/forum/:slug`, `/forum/ask` | `/dashboard/forum`, `/dashboard/forum/:slug`, `/dashboard/forum/ask` | Mobile now mirrors the forum journey through `feature:forum`: list/search/pagination, question detail, ask form, answer form, question vote, answer vote, and accept-answer action backed by the same `/api/v1/forum/*` endpoints.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Zakat/Faraidh saved history       | `/zakat/history`, `/faraidh`           | `/dashboard/zakat/history`, `/dashboard/faraidh`                     | Mobile calculators now keep local device history without login and merge it with backend history when the user is authenticated, matching the web local + account-sync journey. Mobile zakat also auto-loads the backend gold price endpoint for current nisab calculations and keeps the manual field editable as fallback.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Jadwal Sholat adzan behavior      | `/jadwal-sholat`                       | `/dashboard/jadwal-sholat`                                           | Mobile now has countdown, foreground prayer-time notification, optional adzan audio toggle, reminder scheduling, offline schedule cache, and manual correction controls. Web requests location and notification permission early, stores a shared prayer location, refreshes stale GPS location after 6 hours, dismisses the permission prompt for 24 hours, and uses local calendar dates for schedule requests. Mobile should mirror the same data contract with native permission APIs and local storage, not hardcoded district labels.                                                                                                                                                                                                                                 |
| Dashboard reminder carousel/theme | `/dashboard`                           | `/dashboard`                                                         | Dashboard rotates Quran daily, Hadith daily, and dynamic reminder content from `GET /api/v1/reminders`. Native mobile `web_app` now mirrors the carousel-style presentation and loads the same active reminders endpoint, so ulama names, sources, active status, and ordering stay synced with web admin reminders. The mobile `web_app` home dashboard also follows the app light/dark theme for its background, prayer card, quick access grid, daily carousel, rows, and text colors instead of forcing the dark dashboard palette in light mode.                                                                                                                                                                                                                       |
| Quran route theme                 | `/dashboard/quran`                     | Quran list/reader/detail stack                                       | Native mobile `web_app` Quran now follows the app light/dark theme for its list background, dashboard header, search input, mushaf CTA, surah rows, reader surfaces, reader header, pager controls, detail surface, and refresh accents. Classic Quran list/reader/detail behavior remains unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Hadith tab theme                  | `/dashboard/hadith`                    | Hadith tab book/detail stack                                         | Native mobile `web_app` Hadith now follows the app light/dark theme for the route background, search field, tab pills, book shelf cards, summary/results surfaces, empty states, load-more button, and detail hero. Classic Hadith layout and API behavior remain unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Ibadah hub theme                  | Ibadah hub                             | Dashboard-style mobile hub                                           | Native mobile `web_app` Ibadah hub follows the app light/dark theme for its root, hero card, section labels, tiles, icon surfaces, and text colors. Classic Ibadah layout remains unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Explore/Belajar hub theme         | `/dashboard/*` learning catalog entry  | Belajar hub catalog                                                  | Native mobile `web_app` Belajar hub follows the app light/dark theme for its route background, hero, search input, section labels, feature tiles, icons, pin controls, badges, and empty search state. Existing Explore sub-route renderers remain unchanged for separate route-level theme passes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Khatam tracker theme              | Khatam                                 | Dashboard-style Khatam tracker                                       | Native mobile `web_app` Khatam follows the app light/dark theme for its route surface, guest/empty state cards, tracker header, target card, target stats, juz grid card, and status message. Classic Khatam layout and progress behavior remain unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Prayer schedule theme             | `/dashboard/jadwal-sholat`             | Jadwal Sholat screen/settings                                        | Native mobile `web_app` Prayer follows the app light/dark theme for its route surface, hero, clock, schedule card, prayer rows, manual-location form, settings hero/cards, correction controls, status messages, and source note. Classic Prayer schedule/settings behavior remains unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Profile main theme                | `/dashboard/profile`                   | Profile main screen                                                  | Native mobile `web_app` Profile main screen follows the app light/dark theme for its page background, account hero, stats tiles, progress tiles, achievement preview tiles, action tiles, and section text. Classic Profile settings/sub-screen flows remain unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Qibla theme                       | `/dashboard/qibla`                     | Qibla/Kiblat screen                                                  | Native mobile `web_app` Qibla follows the app light/dark theme for its route surface, header, manual-location panel, compass panel, metric tiles, location card, status messages, inputs, and helper note. Classic Qibla compass/location behavior remains unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Personal Tilawah logs             | `/tilawah`                             | `/dashboard/tilawah`                                                 | Web and mobile consume the same `/api/v1/tilawah` CRUD + summary contract. Delete is ownership-scoped: removing a missing log or another user's log returns 404 instead of a false success, so personal history cannot silently drift between web and mobile.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Personal delete actions           | Personal routes                        | Dashboard personal routes                                            | Ownership-scoped personal deletes return 404 when the row is missing or belongs to another user across notes, goals, muhasabah, dzikir logs, user wirid, bookmarks, saved zakat/faraidh, feed posts, comments, forum questions, and forum answers. Web and mobile should treat 404 as already unavailable rather than a successful delete.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Notification inbox delete         | `/dashboard/notifications`             | Profile/Explore Notification Center                                  | `DELETE /notifications/inbox/:id` is available on backend with user ownership check. Web dashboard and mobile Notification Center both expose a delete action and remove the item from local UI after a successful request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Admin analytics                   | `/admin`                               | admin-only                                                           | Web now records page-view events through `POST /api/v1/analytics/page-view` and renders admin visitor metrics plus traffic insights from `GET /api/v1/analytics/admin/summary`. Authenticated events keep both `visitor_id` and `user_id`; unique visitor aggregation counts `user_id` first and falls back to `visitor_id` for guests. The admin dashboard also derives review queue, content health, content status charts, active user ranking, top pages per source, recent activity rows for tracing user/guest journeys, a 7/14/30/90-day analytics window selector, and previous-period trend deltas for visitor/view cards. Mobile does not mirror admin analytics because this is an admin web surface, not a public/mobile feature.                               |

Closed historical gaps:

| Feature               | Previous baseline                       | Current status                                                                                                                                                           |
| --------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tokoh Tarikh          | Missing on mobile/dashboard parity docs | Active in manifest, mobile feature exists, web public + dashboard routes tracked, and native `web_app` now mirrors `/dashboard/tokoh` search/filter/list/detail controls |
| Peta Islam Interaktif | Missing on mobile/dashboard parity docs | Active in manifest, mobile feature exists, web public + dashboard routes tracked, and native `web_app` now mirrors `/dashboard/peta` search/filter/map controls          |
| Forum Q&A             | Missing on mobile/dashboard parity docs | Active in manifest, mobile feature exists, web public + dashboard routes tracked, and native `web_app` now mirrors `/dashboard/forum` list/search/ask/detail flows       |

## Remaining Parity Deltas

These are not route-missing issues. They are depth/behavior differences that
should stay visible for future planning:

| Feature                    | Delta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile Profile settings    | Follow-up implemented current-device session, active login session listing via `GET /api/v1/auth/sessions`, non-current session revoke via `DELETE /api/v1/auth/sessions/:id`, password change, language preference, local theme preference, layout mode preference, delete-account self-service via `DELETE /api/v1/auth/me`, and a native `web_app` shell theme provider. The account menu dark toggle now updates the stored app theme and applies dark chrome to the topbar, footer, safe area, status bar, and the Global Search/Cari `web_app` content surface. Guest account menus no longer show sign-out, and account menu shortcuts now route to their matching Bookmark, Notes, Stats, and Notifications feature surfaces instead of always opening Profile. Web profile update now uses `/api/v1/auth/me` instead of the admin-only `/api/v1/users/:id` route, and both `/profile` and `/dashboard/profile` expose active sessions, non-current session revoke, plus self-delete so non-admin profile/security flows match mobile. |
| Achievements and Stats     | Stats and Achievements now have dedicated native `web_app` dashboard-style route surfaces. Achievements remains reachable from Profile, but `profile:achievements` renders a dashboard route view aligned with `/dashboard/achievements`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Offline packs              | Mobile has explicit offline pack management; web has no equivalent PWA offline pack manager yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Mobile web-inspired layout | `web_app` is now the default native mobile shell for new installs, with dashboard-aligned surfaces for Home, Quran list/reader/detail surfaces, Hadith book shelf/detail surfaces, Global Search/Cari, the Ibadah hub, the Explore/Belajar hub, the Profile main screen, Prayer/Jadwal Sholat, Khatam, Qibla/Kiblat, Peta Islam Interaktif, Tokoh Tarikh, and the Bookmark/Notes/Notifications/Goals/Muhasabah/Hafalan/Murojaah/Tilawah/Stats/Leaderboard/Doa/Dzikir/Wirid/Tahlil/Asmaul Husna/Panduan Sholat/Sejarah/Manasik/Jarh wa Ta'dil/Imsakiyah/Amalan Harian/Quiz/Hijri/Tasbih/Zakat/Faraidh/Sholat Tracker/Wirid Saya/Asmaul Husna Wirid/Asmaul Husna Flashcard/Kajian/Blog/Library/Perawi/Fiqh/Siroh/Forum/Kamus/Tafsir/Asbabun Nuzul/Achievements/Feed feature routes. Native mobile `classic` layout remains supported from settings and must keep feature parity while visual polish continues incrementally.                                                                                                                     |
| Admin/dev surfaces         | Web-only by design; not a public/mobile feature gap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Jarh Ta'dil taxonomy       | Mobile has a dedicated catalog entry; web still maps it through Perawi routes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Mobile Rendering Model

Mobile app has two render paths:

| Path          | Files                                                         | Usage                                                                                       |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Screen-level  | `apps/mobile/src/screens/*Screen.js`                          | Main tabs and complex flows such as Quran, Hadith, Ibadah, Prayer, Qibla, Home, Profile     |
| Feature-level | `apps/mobile/src/data/mobileFeatures.js` + `ExploreScreen.js` | Catalog/list/local tool features such as doa, dzikir, tafsir, peta, forum, notes, bookmarks |

Design constraints:

- Mobile IA follows `docs/MOBILE_IA_FINAL_APPROACH.md`.
- Mobile layout mode strategy follows `docs/MOBILE_LAYOUT_MODES.md`; existing
  native mobile screens remain available as the `classic` fallback while the
  newer mobile web-inspired shell is the default `web_app` mode.
- Layout mode is presentation-only for parity purposes. `classic` and
  `web_app` must keep the same mobile feature availability; a feature may move
  between tab, hub, search, shortcut, or menu sheet, but must not disappear.
- Reader/action preferences that affect layout, such as ayah action placement,
  hidden left metadata, Arabic font size, qari, audio speed, repeat, and range,
  should be stored as user/device preferences. Switching layout mode must keep
  these preferences and the same CRUD/action availability.
- Guest mobile users may use public Quran, prayer schedule, qibla, hadith, and
  reminder carousel surfaces without login. Personal actions such as bookmark,
  catatan, tracker logs, goals, and notification sync should prompt auth or
  save locally first and merge after login where the feature already supports it.
- Detail UI uses bottom-sheet modal or detail page. Do not add inline
  expand/collapse.
- Android back navigation must use `setBack`/`clearBack` for sub-navigation.

## Web Journey Model

| Context                | Rule                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Public page            | CTA can route to public feature details, auth handoff, or dashboard only when the action is explicitly personal/protected. |
| Dashboard page         | CTA must stay in dashboard route namespace when the destination has a dashboard wrapper.                                   |
| Personal-only feature  | Public route may still exist as auth handoff, but dashboard route is the primary journey.                                  |
| Detail/action subroute | It may be omitted from manifest if it is a child of a manifest-tracked feature route.                                      |

## Maintenance Checklist

When adding or changing a feature:

1. Add/update `docs/features/feature-manifest.json`.
2. Add public and dashboard route wrappers when the feature is active on web.
3. Add/confirm mobile key in `apps/mobile/src/data/mobileFeatures.js` or the
   proper screen/tab route.
4. Run `node scripts/check-feature-parity.js`.
5. If this changes web route structure, also run `cd apps/web && npm run build`.
6. If it changes mobile feature inventory or Explore route handling, run
   `cd apps/mobile && npm run test:feature-routes`.
7. If it changes mobile behavior outside feature inventory, run the relevant
   mobile Jest/E2E checks.
