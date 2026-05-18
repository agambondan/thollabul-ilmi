# Public Dashboard Journey And CTA Parity

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-16`

## Objective

Menutup semua mismatch user journey antara public routes dan dashboard routes.
Fitur public seperti Quran, Hadis, Tafsir, Doa, Dzikir, Forum, Zakat, dan
Asbabun Nuzul tetap bisa dipakai tanpa login, tetapi jika user sedang berada di
dashboard maka CTA, detail link, search result, back link, bookmark, dan recovery
flow harus tetap berada di dashboard shell.

## Source Review

- `docs/reviews/2026-05-15-public-dashboard-parity-review.md`
- `docs/reviews/2026-05-15-web-journey-cta-review.md`

## Global Acceptance Criteria

- Dari `/dashboard/*`, semua primary CTA, detail link, back link, search result,
  pagination, dan recovery action tetap berada di `/dashboard/*`.
- Public routes tetap bisa dipakai tanpa login untuk fitur public.
- Capability inti public dan dashboard sync; yang beda hanya layout/shell.
- Shared content menerima route config seperti `basePath`, `routeMap`,
  `quranBasePath`, atau `buildHref`, bukan hardcode public route.
- Auth-required CTA preserve `next`.
- Jika CTA sengaja keluar ke public, label harus eksplisit.
- Floating settings button tersedia di semua route tanpa duplicate instance, dan
  setting `wide`/`compact` berlaku untuk content container yang relevan di public,
  dashboard customer, dan dashboard admin.

---

## Task List

### P0-01 Search Route Map Dashboard

Status: `DONE`
Priority: `P0`

Files:

- `apps/web/src/app/search/SearchClient.js`
- `apps/web/src/app/dashboard/search/page.js`
- `apps/web/src/app/dashboard/hadith/page.js`

Tasks:

1. Tambahkan `baseRoutes` atau `routeMap` ke `SearchClient`.
2. Ubah result ayah ke `/dashboard/quran/:slug#ayah` saat mode dashboard.
3. Ubah result hadis ke `/dashboard/hadith/:book#number` saat mode dashboard.
4. Ubah result doa/kamus/kajian/perawi ke route dashboard equivalents.
5. Ubah `SECTION_HREFS` dashboard menjadi `/dashboard/search?...`.
6. Ubah search hadis dashboard dari `/search?...` ke `/dashboard/search?...`.

Acceptance Criteria:

- Search dari `/dashboard/search` tidak pernah membuka public route untuk result
  yang punya dashboard equivalent.
- Search form di `/dashboard/hadith` tetap dalam dashboard.

### P0-02 Daily Ayah Widget Dashboard Href

Status: `DONE`
Priority: `P0`

Files:

- `apps/web/src/components/DailyAyahWidget.js`
- `apps/web/src/app/dashboard/page.js`

Tasks:

1. Ganti hardcoded `${basePath}/surah/:slug` dengan `buildHref`.
2. Public href tetap `/quran/surah/:slug#ayah`.
3. Dashboard href menjadi `/dashboard/quran/:slug#ayah`.

Acceptance Criteria:

- CTA ayat harian di dashboard tidak menuju `/dashboard/quran/surah/*`.
- CTA ayat harian public tetap menuju route public yang valid.

### P0-03 Dashboard Bookmark Route Resolver

Status: `DONE`
Priority: `P0`

Files:

- `apps/web/src/app/dashboard/bookmarks/page.js`
- `apps/web/src/components/BookmarkButton.js`
- `apps/web/src/lib/bookmarkLabels.js`

Tasks:

1. Support ref type aktual `ayah`, `hadith`, `article`, `doa`, `dzikir`,
   `asmaul_husna`.
2. Route ayah bookmark ke dashboard Quran reader.
3. Route hadith bookmark ke dashboard Hadis reader.
4. Route article bookmark ke `/dashboard/blog/:slug`.
5. Jika metadata slug belum cukup, simpan/resolve metadata route sebelum render.

Acceptance Criteria:

- Bookmark dari Quran reader tidak fallback ke `/dashboard`.
- Bookmark artikel dari dashboard bookmarks tidak keluar ke `/blog/*`.

### P0-04 Forum Dashboard BasePath And Subroutes

Status: `DONE`
Priority: `P0`

Files:

- `apps/web/src/app/forum/page.js`
- `apps/web/src/app/forum/[slug]/page.js`
- `apps/web/src/app/forum/ask/page.js`
- `apps/web/src/app/dashboard/forum/page.js`
- `apps/web/src/app/dashboard/forum/[slug]/page.js`
- `apps/web/src/app/dashboard/forum/ask/page.js`

Tasks:

1. Extract `ForumListContent({ basePath })`.
2. Extract `ForumDetailContent({ basePath, loginNext })`.
3. Extract/reuse ask form with `basePath`.
4. Add dashboard ask route.
5. Add dashboard detail route.
6. Preserve login next for ask/answer.

Acceptance Criteria:

- Dari `/dashboard/forum`, CTA `Tanya` ke `/dashboard/forum/ask`.
- Detail question dari dashboard tetap `/dashboard/forum/:slug`.
- Guest login dari forum detail/ask preserve intent.

### P0-05 Auth Next Preservation

Status: `DONE`
Priority: `P0`

Files:

- `apps/web/src/lib/useRequireAuth.js`
- `apps/web/src/components/BookmarkButton.js`
- `apps/web/src/components/NoteButton.js`
- `apps/web/src/app/auth/login/page.js`
- `apps/web/src/app/auth/register/page.js`

Tasks:

1. `useRequireAuth` preserve current path as `next`.
2. `BookmarkButton` login target includes current path.
3. `NoteButton` login target includes current path.
4. Register reads and forwards `next`.
5. Login-to-register link preserves `next`.
6. Register success keeps `next` when redirecting to login, or auto-login and
   push to `next`.

Acceptance Criteria:

- User yang login/register dari CTA personal kembali ke intent awal.

---

### P1-06 Zakat History Dashboard

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/app/zakat/page.js`
- `apps/web/src/app/zakat/history/page.js`
- `apps/web/src/app/dashboard/zakat/page.js`
- `apps/web/src/app/dashboard/zakat/history/page.js`

Tasks:

1. `ZakatContent({ basePath })`.
2. History link memakai `${basePath}/history`.
3. Add dashboard history wrapper.

Acceptance Criteria:

- Dari `/dashboard/zakat`, `Lihat Riwayat Zakat` tetap di dashboard.

### P1-07 Asbabun Nuzul Quran BasePath

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/app/asbabun-nuzul/page.js`
- `apps/web/src/app/dashboard/asbabun-nuzul/page.js`

Tasks:

1. `AsbabunNuzulContent({ quranBasePath })`.
2. Public quran link tetap public.
3. Dashboard quran link menuju dashboard Quran reader dengan route yang valid.

Acceptance Criteria:

- Result badge ayah dari dashboard Asbabun Nuzul tidak membuka public Quran.

### P1-08 Hadis Public Dashboard Parity

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/app/hadith/page.js`
- `apps/web/src/app/hadith/byBook.js`
- `apps/web/src/app/hadith/byTheme.js`
- `apps/web/src/app/hadith/byChapter.js`
- `apps/web/src/app/hadith/byHadith.js`
- `apps/web/src/app/hadith/theme/[slug]/page.js`
- `apps/web/src/app/dashboard/hadith/page.js`
- `apps/web/src/app/dashboard/hadith/[slug]/page.js`
- `apps/web/src/app/dashboard/hadith/theme/[slug]/page.js`

Tasks:

1. Extract shared `HadithContent({ basePath, themeBasePath })`.
2. Child tab components accept route config.
3. Dashboard supports book/theme/chapter/number capabilities.
4. Add dashboard theme route or fold theme into dashboard query-tab flow.
5. Align hadith number anchors so dashboard CTA links focus the selected
   hadith inside the dashboard reader instead of landing only at the top.

Acceptance Criteria:

- Dashboard Hadis has capability parity with public Hadis.
- No Hadis tab/action from dashboard opens `/hadith/*`.
- Hadith number jump/result CTAs use dashboard reader anchors when invoked from
  dashboard.

### P1-09 Tafsir Reader Parity

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/app/tafsir/[slug]/page.js`
- `apps/web/src/app/dashboard/tafsir/[slug]/page.js`
- `apps/web/src/app/tafsir/page.js`
- `apps/web/src/app/dashboard/tafsir/page.js`

Tasks:

1. Extract shared `TafsirReaderContent({ tafsirBasePath, quranBasePath })`.
2. Dashboard gets kitab filter.
3. Dashboard gets side-by-side mode.
4. `read in Quran` route uses dashboard Quran base path in dashboard mode.
5. Normalize kitab labels between public and dashboard.

Acceptance Criteria:

- Public and dashboard Tafsir have the same core controls.
- Dashboard Tafsir never routes to `/quran/*`.

### P1-10 Quran Index Shared Component

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/app/quran/QuranPageClient.js`
- `apps/web/src/app/quran/page.js`
- `apps/web/src/app/dashboard/quran/page.js`

Tasks:

1. Extract shared `QuranIndexContent({ basePath, mushafPath })`.
2. Public route keeps `/quran/page-mushaf` and `/quran/surah/:slug`.
3. Dashboard route uses `/dashboard/quran/page-mushaf` and
   `/dashboard/quran/:slug`.

Acceptance Criteria:

- Public and dashboard Quran index share search/sort/card logic.

### P1-11 Account Route Map

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/components/Navbar.js`
- `apps/web/src/components/Footer.js`
- `apps/web/src/components/Sidebar.js`
- `apps/web/src/app/profile/page.js`
- `apps/web/src/app/dashboard/profile/page.js`

Tasks:

1. Create a dashboard-aware account route map.
2. Navbar logged-in account links use dashboard routes.
3. Footer personal links use dashboard routes or login with next.
4. Public profile quick links use dashboard routes.
5. Dashboard profile edit stays in dashboard or has explicit exit label.
6. Mark legacy Sidebar deprecated or update account routes.

Acceptance Criteria:

- Logged-in personal/account CTA does not default to public personal shell.

### P1-12 Asmaul Husna Child BasePath

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/app/asmaul-husna/flashcard/page.js`
- `apps/web/src/app/asmaul-husna/wirid/page.js`
- `apps/web/src/app/dashboard/asmaul-husna/flashcard/page.js`
- `apps/web/src/app/dashboard/asmaul-husna/wirid/page.js`

Tasks:

1. `AsmaulHusnaFlashcardContent({ basePath })`.
2. `AsmaulWiridContent({ basePath })`.
3. Dashboard wrappers pass `/dashboard/asmaul-husna`.

Acceptance Criteria:

- Back link from dashboard flashcard/wirid returns to dashboard Asmaul Husna.

### P1-13 Global Floating Settings And Layout Mode Support

Status: `DONE`
Priority: `P1`

Files:

- `apps/web/src/app/layout.js`
- `apps/web/src/app/dashboard/layout.js`
- `apps/web/src/app/admin/layout.js`
- `apps/web/src/components/popup/SettingButton.js`
- `apps/web/src/lib/useLayoutMode.js`
- Public, dashboard, and admin pages with hardcoded content containers.

Tasks:

1. Render `SettingButton` from the app root or a global client shell so it is
   available on every route.
2. Remove or guard local `SettingButton` instances in dashboard, admin, Quran
   reader, and Hadis reader so the floating button never appears twice.
3. Audit public pages that still use hardcoded `container mx-auto`, `max-w-*`,
   or fixed page padding without `useLayoutMode`.
4. Audit dashboard customer pages that rely only on dashboard layout width but
   still hardcode inner `p-6`, `px-4 py-6`, or `max-w-*` wrappers.
5. Audit admin CRUD pages that hardcode `p-6` or form `max-w-*` wrappers and
   decide which containers should respond to `wide`/`compact`.
6. Extract a shared layout-aware content wrapper if the same
   `isWide ? 'w-full' : 'max-w-* mx-auto'` pattern keeps repeating.
7. Keep auth and fullscreen utility pages intentional: if a route should ignore
   layout mode, document the reason in code or the task notes.

Acceptance Criteria:

- Floating settings button is visible on public, dashboard customer, admin,
  auth, error/recovery, and detail routes unless explicitly excluded.
- Each route renders at most one floating settings button.
- Toggling `wide`/`compact` updates eligible content containers consistently
  across public and dashboard shells.
- Quran/Hadis font settings remain available after the button becomes global.

Implementation Notes:

- Global `SettingButton` dipasang sekali di `apps/web/src/app/layout.js`.
- Instance lokal di `dashboard/layout.js`, `admin/layout.js`,
  `quran/[...slug]/InfiniteScrollAyahPage.js`, dan
  `hadith/[slug]/InfiniteScrollHadithPage.js` dihapus untuk mencegah duplicate
  floating button.
- `ContentWidth` ditambahkan sebagai wrapper layout-aware untuk page yang belum
  memakai `useLayoutMode` secara langsung.
- Public/detail utility routes yang sudah dikonversi antara lain landing page,
  Asmaul Husna flashcard/wirid, Faraidh, Fiqh, Forum list/ask/detail, Khatam,
  Kiblat, Kamus, Notes, Quiz, Imsakiyah, Jadwal Sholat, Panduan Sholat,
  Murojaah, Quran mushaf page, Tasbih, Wirid Custom, Zakat, Zakat history, dan
  Hadis book/theme route.
- Dashboard route tambahan yang dikonversi: achievements.

---

### P2-14 Tahlil Quran BasePath

Status: `DONE`
Priority: `P2`

Files:

- `apps/web/src/app/tahlil/page.js`
- `apps/web/src/app/dashboard/tahlil/page.js`

Tasks:

1. `TahlilContent({ quranBasePath })`.
2. Public Yasin link remains `/quran/surah/Yasin`.
3. Dashboard Yasin link goes to dashboard Quran reader.

Acceptance Criteria:

- Link Yasin from dashboard Tahlil stays in dashboard.

### P2-15 Global Recovery Context

Status: `DONE`
Priority: `P2`

Files:

- `apps/web/src/app/NotFoundClient.js`
- `apps/web/src/app/error.js`

Tasks:

1. Make recovery target pathname-aware.
2. Dashboard errors recover to `/dashboard`.
3. Admin errors recover to `/admin`.
4. Public errors recover to `/`.

Acceptance Criteria:

- 404/error from dashboard/admin does not force public home unless explicit.

### P2-16 Public Personal Canonicalization

Status: `DONE`
Priority: `P2`

Files:

- `apps/web/src/app/amalan/page.js`
- `apps/web/src/app/bookmarks/page.js`
- `apps/web/src/app/goals/page.js`
- `apps/web/src/app/hafalan/page.js`
- `apps/web/src/app/muhasabah/page.js`
- `apps/web/src/app/muroja-ah/page.js`
- `apps/web/src/app/notifications/page.js`
- `apps/web/src/app/sholat-tracker/page.js`
- `apps/web/src/app/stats/page.js`
- `apps/web/src/app/tilawah/page.js`

Tasks:

1. Decide whether public personal routes redirect to dashboard canonical routes.
2. If kept as wrappers, preserve intent to dashboard after login.
3. Update empty-state CTA to dashboard equivalents.

Acceptance Criteria:

- Personal routes no longer trap logged-in users in public shell.

### P2-17 Admin Generic CRUD Feedback

Status: `DONE`
Priority: `P2`

Files:

- `apps/web/src/app/admin/doa/page.js`
- `apps/web/src/app/admin/dzikir/page.js`
- `apps/web/src/app/admin/fiqh/page.js`
- `apps/web/src/app/admin/kajian/page.js`
- `apps/web/src/app/admin/asbabun-nuzul/page.js`
- `apps/web/src/app/admin/asmaul-husna/page.js`
- `apps/web/src/app/admin/kamus/page.js`
- `apps/web/src/app/admin/manasik/page.js`
- `apps/web/src/app/admin/tahlil/page.js`
- `apps/web/src/app/admin/wirid/page.js`
- `apps/web/src/app/admin/quiz/page.js`
- `apps/web/src/app/admin/sejarah/page.js`

Tasks:

1. Add shared mutation helper or local `res.ok` checks.
2. Show inline error/toast on failed save/delete.
3. Do not close modal before successful save.
4. Add `aria-label` and `title` to icon-only row actions.
5. Mount admin mutation toast once in admin layout so generic CRUD pages do not
   fail silently on failed mutation responses or network errors.

Acceptance Criteria:

- Admin save/delete CTA cannot fail silently.
- Icon-only action has an accessible name.
- Failed admin mutations keep the current modal/dialog open because the shared
  `authFetch` mutation guard throws before success-only UI cleanup runs.

## Suggested Delivery Slices

1. **Slice A - Route leakage blockers:** P0-01, P0-02, P0-03.
2. **Slice B - Forum and auth intent:** P0-04, P0-05.
3. **Slice C - Public-dashboard content parity:** P1-06, P1-07, P1-08,
   P1-09, P1-10.
4. **Slice D - Account and layout shell consistency:** P1-11, P1-12, P1-13,
   P2-14, P2-16.
5. **Slice E - Low-impact recovery/admin polish:** P2-15, P2-17.

## Follow-up Journey Pass - 2026-05-16

Status: `DONE`

Files:

- `apps/web/src/app/page.js`
- `apps/web/src/app/dashboard/page.js`
- `apps/web/src/app/dashboard/profile/page.js`
- `apps/web/src/app/dashboard/notifications/page.js`
- `apps/web/src/components/Sidebar.js`
- `apps/web/src/lib/i18n.js`

Changes:

1. Landing page now separates public content CTAs from personal dashboard CTAs:
   Quran/Hadith/content readers stay public, while hafalan, tilawah, amalan,
   stats, sholat tracker, muhasabah, goals, notifications, leaderboard,
   bookmarks, notes, and muroja'ah route to dashboard equivalents.
2. Guest clicks on personal landing features now go to register with preserved
   dashboard `next`, e.g. `/auth/register?next=/dashboard/tilawah`; logged-in
   users go directly to the dashboard route.
3. Landing hero and final CTA no longer imply that the primary CTA only opens a
   public reader. The primary CTA now opens dashboard for authenticated users or
   registration with dashboard intent for guests; the secondary CTA remains the
   public Quran reader.
4. Dashboard overview stat cards for today's prayers, active goals, and
   bookmarks are now real links to their owning dashboard journeys instead of
   passive cards.
5. Dashboard prayer summary CTA label changed from generic `Kelola`/`Manage` to
   specific `Catat sholat`/`Log prayers`.
6. Dashboard notifications no longer rely on clicking the entire notification
   card to mark as read. Local reminders now expose explicit action CTAs:
   muhasabah -> `/dashboard/muhasabah`, prayer -> `/dashboard/sholat-tracker`,
   tilawah -> `/dashboard/tilawah`, and muroja'ah -> `/dashboard/muroja-ah`.
7. Notification items now use separate `Buka`/action and `Tandai dibaca`
   controls, reducing accidental read-state changes when the user intended to
   follow the reminder.
8. Dashboard profile edit no longer exits to `/profile`; name editing is now
   inline inside `/dashboard/profile`.
9. Dashboard profile stats are now links to the owning dashboard journeys:
   streak -> `/dashboard/stats`, muhasabah -> `/dashboard/muhasabah`, and
   memorization -> `/dashboard/hafalan`.
10. Legacy Sidebar leaderboard link is dashboard-aware: authenticated users go
    to `/dashboard/leaderboard`, guests go to login with dashboard `next`.

Acceptance Criteria:

- Public landing can still introduce public content without login.
- Personal landing features preserve dashboard intent instead of bouncing
  through legacy public personal redirects.
- Dashboard overview cards and reminder CTAs keep the user inside
  `/dashboard/*`.
- Dashboard profile no longer needs public profile as the edit CTA target.
- CTA labels describe the next action, not a vague generic action.

## Verification Plan

- `npm run lint`
- `npm run build`
- Manual route smoke:
  - `/dashboard/search`
  - `/dashboard/hadith`
  - `/dashboard/forum`
  - `/dashboard/zakat`
  - `/dashboard/asbabun-nuzul`
  - `/dashboard/tafsir/al-fatihah`
  - `/dashboard/quran`
  - `/dashboard/bookmarks`
- Floating settings/layout smoke:
  - `/`
  - `/auth/login`
  - `/quran`
  - `/quran/surah/al-fatihah`
  - `/dashboard`
  - `/dashboard/quran`
  - `/admin`
- Browser checks for guest login `next` and dashboard CTA containment.

## Evidence

- `npm test -- useRequireAuth NoteButton BookmarkButton DailyAyahWidget --runInBand`
  passed after auth-next, bookmark, note, Daily Ayah, Quran index, and account
  route-map changes. Jest reports a haste-map collision from the generated
  `.next/standalone/.../package.json`, but the selected suites pass.
- `npm run build` passed after route parity changes. Next generated the
  dashboard forum detail/ask, dashboard zakat history, and dynamic dashboard
  Quran index routes successfully.
- `npm run build` passed after Hadis parity changes. Next generated
  `/dashboard/hadith`, `/dashboard/hadith/[slug]`, and
  `/dashboard/hadith/theme/[slug]` successfully.
- `npm run build` passed after admin CRUD feedback changes. Admin routes and
  shared `authFetch` mutation feedback compiled successfully.
- `npm run build` passed after the 2026-05-16 follow-up journey pass.
- `npm run build` passed after the dashboard profile and legacy Sidebar
  account-route follow-up.
- Targeted ESLint command was attempted with `npx eslint src/app/page.js
  src/app/dashboard/page.js src/app/dashboard/notifications/page.js
  src/lib/i18n.js`, but the local ESLint setup currently fails before linting
  because `typescript` is missing from `apps/web/node_modules`.
