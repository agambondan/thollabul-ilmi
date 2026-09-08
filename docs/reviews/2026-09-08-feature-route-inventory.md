# Feature & Route Inventory (Backend, Web, Mobile)

Tanggal: `2026-09-08`

Inventaris ground-truth semua route backend, halaman web, dan
screen/feature mobile — dibaca langsung dari kode (bukan dari dokumen lama
yang bisa basi), untuk jadi acuan sesi-sesi review per-feature berikutnya.

## Cara Pakai

- Bagian 1–3 adalah referensi detail per platform (backend/web/mobile).
- Bagian 4 adalah **todolist review** — satu baris per feature domain, dengan
  checkbox terpisah untuk Backend / Web / Mobile. Centang saat sudah selesai
  direview di sesi terkait, dan tulis temuan di `docs/reviews/` sebagai
  dokumen baru (jangan tumpuk di file ini).
- Dokumen terkait yang sudah ada (baca juga kalau relevan):
  - `docs/MOBILE_FEATURE_REFERENCE.md` — daftar fitur mobile lama, mapping ke
    backend (belum tentu up to date, dokumen ini yang jadi acuan terbaru).
  - `docs/api/FEATURE_ROADMAP.md` / `docs/api/roadmap-status.md` — status
    tier backend.
  - `docs/web/web-status.md` — status halaman web.
  - `docs/features/feature-manifest.json` — source of truth discovery/CTA
    parity (dipakai `scripts/check-feature-parity.js`).
  - `docs/reviews/2026-09-07-admin-crud-gap-audit.md` — audit CRUD admin
    yang masih kurang (overlap dengan beberapa gap di bagian 4).

**Catatan konkurensi**: repo ini sering dikerjakan beberapa sesi agent
sekaligus (lihat `CLAUDE.md`). Saat dokumen ini ditulis, ada working-tree
changes aktif dari sesi lain di beberapa file backend (masjid/notification
push/kajian) — belum di-commit, jadi tidak tercermin di sini kalau
mengubah struktur route.

---

## 1. Backend API (`services/api/app/http/routes.go`)

Semua route didaftarkan langsung di satu fungsi `Handle()` — tidak ada file
route terpisah. Auth level: **Public** (tanpa middleware, mungkin masih
rate-limited) · **JWT** (user login) · **Admin** · **Editor/Admin** ·
**Author/Admin** · **API Key** (`X-API-Key`, partner/developer).

### System / Infra
`GET /health`, `/metrics`, `{ENDPOINT}/`, `{ENDPOINT}/info`,
`{ENDPOINT}/swagger*`, `/debug/pprof/*` — semua Public, sebagian besar
non-production only. Bukan feature review target.

### Auth & Users
- Public: `POST /auth/register|login|refresh|logout|forgot-password|reset-password`
- Google OAuth: `GET /auth/google`, `/auth/google/callback` (Public, rate-limited)
- JWT: `GET/PUT/DELETE /auth/me`, `/auth/sessions`, `PUT /auth/password`
- Admin: `GET /users`, `PUT /users/:id`, `/users/:id/role`, `DELETE /users/:id`

### Quran Core
- Mufrodat (public): `/mufrodat/ayah/:id|surah/:number|surah/:s/ayah/:a|page/:page|root/:word`
- Ayah (public read, admin write): `/ayah`, `/ayah/keyset`, `/ayah/daily`, `/ayah/:id`, `/ayah/number/:n`, `/ayah/surah/number/:n`, `/ayah/page/:p`, `/ayah/hizb/:h`
- Surah (public read, admin write): `/surah`, `/surah/:id`, `/surah/number/:n`, `/surah/name/:name`
- Juz (public read, admin write): `/juz`, `/juz/:id`, `/juz/surah/:name`
- Tafsir (public read, editor/admin write): `/tafsir/ayah/:id`, `/tafsir/surah/:n`, `/tafsir/search`
- Asbabun Nuzul (public read, editor/admin write): `/asbabun-nuzul`, `/asbabun-nuzul/list`, `/ayah/:id`, `/surah/:n`
- Munasabah (public read, editor/admin write): `/munasabah/ayah/:ayahId`
- Audio Murotal (public read, admin write): `/audio/manifest`, `/audio/surah/:id`, `/audio/ayah/:id`

### Hadith & Ilmu Rijal
- Book/Theme/Chapter (public read, admin write): `/books`, `/themes`, `/chapters`
- Hadith (public read, admin write): `/hadiths` + ~12 lookup variants (by book/theme/chapter/combo), `/hadiths/keyset`, `/hadiths/daily`
- Hadith sub-resources (public read): `/hadiths/:id/sanad`, `/hadiths/:id/takhrij`
- Hadith-Ayah cross-ref (public read, editor/admin write): `/hadiths/:id/ayahs`, `/ayahs/:id/hadiths`, `POST/DELETE /hadith-ayahs`
- Perawi (public read, editor/admin write): `/perawi`, `/perawi/search`, `/perawi/tabaqah/:t`, `/perawi/:id`, `/perawi/:id/guru|murid|jarh-tadil`
- Jarh wa Ta'dil (public read, editor/admin write): `/jarh-tadil`, `/jarh-tadil/:id`
- Sanad & Mata Sanad (public read, editor/admin write): `/sanad/:id`, `/sanad/:id/mata-sanad`, `/mata-sanad/:id`
- Takhrij (public read, editor/admin write): `/takhrij`, `/takhrij/:id`

### Doa, Dzikir, Wirid, Asmaul Husna
- Doa (public read, editor/admin write): `/doa`, `/doa/category/:c`, `/doa/:id`
- Dzikir + Wirid (public read, editor/admin write): `/dzikir`, `/dzikir/category/:c`, `/dzikir/:id`, `/wirid`, `/wirid/occasion/:o` (alias controller sama)
- Dzikir Log (JWT): `POST /dzikir/log`, `GET /dzikir/log/today`, `DELETE /dzikir/log/:id`
- User Custom Wirid (JWT): `/user-wird`
- Asmaul Husna (public read, editor/admin write): `/asmaul-husna`, `/asmaul-husna/:number`

### Siroh, Sejarah, Tokoh, Lokasi
- Siroh (public read, editor/admin write): `/siroh/categories*`, `/siroh/contents*`
- History/Sejarah (public read, editor/admin write): `/history`, `/history/:slug`
- Tokoh Tarikh (public read, admin write): `/tokoh-tarikh`, `/tokoh-tarikh/:id`
- Location/Peta Islam (public read, admin write): `/locations`, `/locations/:id`
- Manasik (public read, editor/admin write): `/manasik`, `/manasik/items`, `/manasik/:type`, `/manasik/:type/:step`

### Fiqh, Kamus, Blog, Library, Kajian
- Fiqh Ringkas (public read, editor/admin write): `/fiqh*` (beberapa alias path)
- Kamus/Dictionary (public read, admin write): `/dictionary*`
- Blog (public read; posts author/admin; categories/tags admin): `/blog/posts*`, `/blog/categories*`, `/blog/tags*`
- Library Books (public read, admin write) + Progress (JWT): `/library/books*`, `/library/progress*`
- Lessons (public read, protected progress, admin write): `/lessons*`
- Kajian (public read, editor/admin write) + Bookmarks/Notes (JWT): `/kajian*`, `/kajian/bookmarks/*`, `/kajian/notes/*`
- **Masjid** (public read, admin write): `/masjids`, `/masjids/nearby`, `/masjids/:id`
- **Radio Islamic** (public read, admin write): `/radio-islamic`, `/radio-islamic/:id`

### Social / Community
- Feed (public read, JWT write): `/feed*`
- Forum Q&A (public read, JWT write): `/forum/questions*`, `/forum/answers/:id`, `/forum/votes`
- Komunitas Chat (public read/stream, JWT write): `/komunitas/chat*`
- Comments (public read, JWT write): `/comments*`

### Personal Tracking & Gamification (mostly JWT)
`/bookmarks`, `/progress*` (reading progress), `/hafalan*`, `/activity`+`/streak*`,
`/tilawah*`, `/amalan*` (items public, rest JWT/editor), `/muroja-ah` → `/murojaah/*`,
`/muhasabah*`, `/goals*`, `/notes*`, `/settings`, `/stats*`, `/leaderboard*`
(public + `/leaderboard/me` JWT), `/achievements*` (public list, JWT mine,
editor/admin write), `/khatam` — **no dedicated backend route found**, likely
client-local only (flag for review).

### Ibadah Tools
- Zakat calculator (public, stateless): `/zakat/maal|fitrah|nishab|gold-price`
- Zakat history (JWT): `/zakat/kalkulasi*`
- Faraidh history (JWT): `/faraidh/simpan*`
- Prayer tracker (JWT) + Panduan Sholat (public read, editor/admin write): `/sholat/*`, `/panduan-sholat*`
- Jadwal Sholat / Imsakiyah (public): `/sholat-times*`, `/imsakiyah`
- Kiblat (public): `/kiblat`
- Hijri Calendar (public): `/hijri/*`
- Adzan Sounds — user playlist, max 3/user (JWT): `/adzan-sounds*`

### Quiz, Achievements, Notifications
- Quiz & Flashcard (public session, JWT submit/stats, admin CRUD): `/quiz*`
- Notifications (public vapid key; JWT settings/push-token/inbox; admin broadcast): `/notifications/*`
- Reminders (public read, editor/admin write): `/reminders*`
- Notification Templates (admin): `/notification-templates*`

### Reports, Audit, Analytics, Admin-only
- Content Correction Reports (JWT create/mine; admin review/apply/export): `/reports*`, `/admin/reports*`
- Admin Audit Logs: `/admin/audit-logs*`
- Analytics (public write, admin read): `/analytics/page-view`, `/analytics/admin/summary`
- Dashboard home (JWT): `/dashboard`
- Mobile initial sync (public): `/sync`
- Search (public, rate-limited): `/search`

### Open API / Partner
- Developer keys (JWT): `/developer/register`, `/developer/keys*`
- Developer content passthrough (API Key): `/developer/content/quran/*`, `/hadith/:id`, `/doa`, `/asmaul-husna`, `/dzikir`

**Total: ~50 feature domains, 260+ individual routes.**

---

## 2. Web App (`apps/web/src/app/`) — 228 `page.js`/`route.js` files

- **No route groups**, no root `middleware.js`. Auth/role gating is
  client-side per area: `dashboard/layout.js` redirects if not
  authenticated; `admin/layout.js` redirects if not `role === "admin"`.
  Public top-level pages have no auth check.
- **Structural pattern**: almost every public content feature is mirrored
  1:1 under `/dashboard/*` (same page, wrapped in authenticated shell).
  Assume this mirror exists unless noted otherwise below.
- Legacy: `/hadits/[slug]/[number]` redirects to `/hadith/[slug]/[number]`
  (typo route kept for old links).
- Infra routes: `app/api/locale/route.js` (lang cookie), `app/api/v1/[...path]/route.js`
  (reverse proxy to Go backend), `app/og/route.js` (OG image gen).

| Domain | Public | Dashboard mirror | Admin |
|---|---|---|---|
| Quran | `/quran`, `/quran/page-mushaf`, `/quran/[...slug]` | ✅ (dynamic segment, not catch-all) | — |
| Tafsir | `/tafsir`, `/tafsir/[slug]` | ✅ | — |
| Asbabun Nuzul | `/asbabun-nuzul` | ✅ | ✅ |
| Hadith | `/hadith`, `/hadith/[slug]`, `/hadith/[slug]/[number]`, `/hadith/theme/[slug]` | ✅ | — |
| Perawi / Rijal | `/perawi`, `/perawi/[id]` | ✅ | ✅ `/admin/perawi`, `/admin/jarh-tadil`, `/admin/sanad` (admin-only, no public/dashboard UI) |
| Doa / Dzikir / Wirid | `/doa`, `/dzikir`, `/wirid`, `/wirid-custom` | ✅ | ✅ (doa/dzikir/wirid) |
| Asmaul Husna | `/asmaul-husna`, `/flashcard`, `/wirid` | ✅ | ✅ |
| Sholat tools | `/jadwal-sholat`, `/panduan-sholat`, `/sholat-tracker`, `/kiblat`, `/imsakiyah`, `/hijri`, `/tasbih` | ✅ | — |
| Personal tracking | `/tilawah`, `/hafalan`, `/muroja-ah`, `/amalan`, `/muhasabah`, `/goals`, `/khatam` | ✅ | ✅ `/admin/amalan` only |
| Zakat / Faraidh | `/zakat`, `/zakat/history`, `/faraidh` | ✅ (no `/admin/faraidh`) | — |
| Siroh / Sejarah / Tokoh / Peta | `/siroh`, `/siroh/[slug]`, `/sejarah`, `/tokoh`, `/peta` | ✅ | ✅ `/admin/siroh(+new,[id]/edit)`, `/sejarah`, `/tokoh-tarikh`, `/locations` |
| Fiqh / Kamus / Manasik | `/fiqh`, `/kamus`, `/manasik` | ✅ | ✅ |
| Belajar / Quiz / Leaderboard | `/belajar`, `/belajar/lessons`, `/quiz`, `/leaderboard` | ✅ + `/dashboard/achievements` (dashboard-only) | ✅ `/admin/lessons`, `/quiz`, `/achievements` |
| Blog / Library / Kajian | `/blog`, `/blog/[slug]`, `/library`, `/library/[slug]`, `/kajian` | ✅ | ✅ `/admin/blog(+new,[id]/edit)`, `/library`, `/kajian` |
| **Masjid** | `/masjid` | ❌ no dashboard mirror | ❌ no admin UI |
| **Radio Islamic** | `/radio-islamic` | ❌ no dashboard mirror | ❌ no admin UI |
| Forum / Komunitas / Feed | `/forum`, `/forum/ask`, `/forum/[slug]`, `/komunitas`, `/feed` | ✅ | — |
| Personal tools | `/search`, `/bookmarks`, `/notes`, `/stats`, `/notifications`, `/profile` | ✅ + `/dashboard/settings`, `/dashboard/reports` (dashboard-only) | — |
| Auth | `/auth/login`, `/auth/register`, `/auth/google/callback` | — | — |
| Marketing/other | `/`, `/contact`, `/dev`, `/extension` | — | — |
| Admin infra | — | — | `/admin` (home), `/admin/users`, `/admin/reports`, `/admin/audit-logs`, `/admin/push` |

---

## 3. Mobile App (`apps/mobile/`)

Custom state-based navigation (not React Navigation) in `App.js` +
`src/navigation/appNavigation.js`. Two layout modes toggle between a
5-icon `TabBar` (classic) and a `MobileBottomNav` + "Menu" sheet
(`web_app`, default). Both expose the same 5 destinations: **Beranda,
Quran, Hadis, Ibadah, Belajar** — Profile is avatar-accessed, not a tab.
No orphaned screens found (verified import graph).

### Beranda — `HomeScreen.js`
Dashboard (prayer countdown, daily ayah/hadith, shortcuts, pinned/recent
features) · Global Search (`GlobalSearchScreen`) · Feature Directory (flat
listing of every feature).

### Quran — `QuranScreen.js` + split files
Surah list + Page/Hizb navigator · Reader (4 display modes, 3 fonts,
tajweed) · Tafsir modal (4 sub-modes) · Asbabun Nuzul modal · Audio
player/range panel · Memorization hide-modes · Bookmark & Notes ·
**Hafalan** sub-tab · **Murojaah** sub-tab.

### Hadis — `HadithScreen.js`
Kitab filter (offline-aware) · List with search + bookmark/note badges ·
Detail with tabs: Teks, Sanad, Perawi/Narrators, Takhrij, Ayat
(cross-ref), Catatan.

### Ibadah — `IbadahScreen.js` hub + `PrayerScreen.js`, `QiblaScreen.js`, `KhatamScreen.js`
Hub sections redirect most rows into Belajar's feature catalog except:
**Prayer** (local, jadwal + settings sub-view), **Qibla** (local, compass),
**Khatam** (local, completion tracker). Doa/Dzikir/Hijri/Imsakiyah/Wirid/
Asmaul Husna/Tasbih/Zakat/Faraidh/Sholat-Tracker/Manasik are all
`featureKey` redirects into Belajar, not separate screens (IA rule: dual
entry point, single source screen).

### Belajar — `ExploreScreen.js` + `src/data/mobileFeatures.js` catalog
Single screen rendering ~40 features as internal states:
Modul/Lessons · Kajian (+ `KajianPlayerModal`) · Komunitas · Artikel/Blog ·
Siroh · Sejarah · Manasik · Fiqh Ringkas · Panduan Sholat · Wirid Saya ·
Kamus Arab · Tafsir · Asbabun Nuzul · Perawi Hadis · Jarh wa Ta'dil ·
Asmaul Husna + Flashcard · Quiz Islami · Goals · Stats · Leaderboard ·
Bookmark · Notes · Doa · Dzikir · Wirid · Wirid Asmaul Husna · Amalan
Harian · Tasbih · Zakat (+ History) · Faraidh (+ history) · Hijri ·
Imsakiyah · Sholat Tracker · Notifikasi (→ `NotificationCenter`) ·
**Peta Islam Interaktif** (`historical-map`) · Tokoh Tarikh · Perpustakaan ·
Forum Tanya Jawab · Muhasabah · Community Feed.

**Not found in mobile at all: Masjid, Radio Islamic** (both web-only,
built this session — flagged as a mobile-parity gap).

### Profile / Account (avatar-accessed) — `ProfileScreen.js`
Main · Achievements · Settings (Account/session, **Notifications** via
`NotificationCenter`, **Storage/Offline** via `OfflinePackCard`,
Appearance/theme+layout-mode, Security/delete-account).

### Cross-cutting components
`NotificationCenter`, `KajianPlayerModal`, `NotesPanel` (reused across
Quran/Hadith/Kajian/Library), `OfflinePackCard`, `SessionCard`,
`SourceBadges`, `AnalyticsTracker`, `SwipeBackView`.

---

## 4. Feature Review Todolist

Centang tiap kolom saat feature itu sudah direview di sesi terkait (baca:
kode dibaca, dites/dijalankan, bug dicatat/diperbaiki). `—` = platform ini
memang tidak relevan untuk feature tsb (bukan gap, cuma skip).
**Bold** = ada gap/ketimpangan platform yang sudah kekonfirmasi di atas,
prioritaskan investigasi kenapa sebelum review mendalam.

| # | Feature Domain | Backend | Web | Mobile |
|---|---|---|---|---|
| 1 | Auth & Users (register/login/google/session/profile) | [ ] | [ ] | [ ] |
| 2 | Al-Quran core (surah/ayah/juz/mufrodat/reader) | [ ] | [ ] | [ ] |
| 3 | Tafsir | [ ] | [ ] | [ ] |
| 4 | Asbabun Nuzul | [ ] | [ ] | [ ] |
| 5 | **Munasabah** (backend ada, web/mobile UI belum ketemu — cek dulu apakah memang belum dibangun) | [ ] | [ ] | [ ] |
| 6 | Audio Murotal + Adzan Sounds | [ ] | [ ] | [ ] |
| 7 | Hadith (books/chapters/themes/reader) | [ ] | [ ] | [ ] |
| 8 | Perawi & Ilmu Rijal (sanad/jarh-tadil/takhrij) | [ ] | [ ] | [ ] |
| 9 | **Hadith-Ayah cross-reference** (cek apakah benar terpakai di UI Hadith "Ayat" tab / Quran) | [ ] | [ ] | [ ] |
| 10 | Doa | [ ] | [ ] | [ ] |
| 11 | Dzikir + Dzikir Log | [ ] | [ ] | [ ] |
| 12 | Wirid + User Custom Wirid | [ ] | [ ] | [ ] |
| 13 | Asmaul Husna (+ Flashcard + Wirid mode) | [ ] | [ ] | [ ] |
| 14 | Siroh | [ ] | [ ] | [ ] |
| 15 | Sejarah / History Timeline | [ ] | [ ] | [ ] |
| 16 | Tokoh Tarikh | [ ] | [ ] | [ ] |
| 17 | Peta Islam / Locations | [ ] | [ ] | [ ] |
| 18 | Fiqh Ringkas | [ ] | [ ] | [ ] |
| 19 | Kamus Istilah Islam | [ ] | [ ] | [ ] |
| 20 | Manasik Haji & Umrah | [ ] | [ ] | [ ] |
| 21 | Belajar / Lessons (Modul) | [ ] | [ ] | [ ] |
| 22 | Quiz & Flashcard | [ ] | [ ] | [ ] |
| 23 | Kajian (list + search + bookmarks + notes + player) | [ ] | [ ] | [ ] |
| 24 | Masjid (web-only, reviewed + admin CRUD added 2026-09-08 — **masih belum ada di mobile**) | [x] | [x] | [ ] |
| 25 | Radio Islamic (web-only, reviewed + admin CRUD added 2026-09-08 — **masih belum ada di mobile**) | [x] | [x] | [ ] |
| 26 | Blog | [ ] | [ ] | [ ] |
| 27 | Library / Perpustakaan | [ ] | [ ] | [ ] |
| 28 | Forum Q&A | [ ] | [ ] | [ ] |
| 29 | Komunitas Chat | [ ] | [ ] | [ ] |
| 30 | Feed / Community activity share | [ ] | [ ] | [ ] |
| 31 | **Comments/Diskusi** (generic ref-based — cek dipakai di mana saja) | [ ] | [ ] | [ ] |
| 32 | Bookmark (generic, lintas konten) | [ ] | [ ] | [ ] |
| 33 | Reading Progress | [ ] | [ ] | [ ] |
| 34 | Hafalan | [ ] | [ ] | [ ] |
| 35 | Streak & Activity | [ ] | [ ] | [ ] |
| 36 | Tilawah Tracker | [ ] | [ ] | [ ] |
| 37 | Amalan Harian | [ ] | [ ] | [ ] |
| 38 | Muroja'ah | [ ] | [ ] | [ ] |
| 39 | Muhasabah Harian | [ ] | [ ] | [ ] |
| 40 | Target Belajar / Goals | [ ] | [ ] | [ ] |
| 41 | **Khatam** (web+mobile ada, backend route belum ketemu — cek client-local only atau ada endpoint tersembunyi) | [ ] | [ ] | [ ] |
| 42 | Stats | [ ] | [ ] | [ ] |
| 43 | Leaderboard | [ ] | [ ] | [ ] |
| 44 | Achievements & Points | [ ] | [ ] | [ ] |
| 45 | Prayer Tracker + Panduan Sholat | [ ] | [ ] | [ ] |
| 46 | Jadwal Sholat / Imsakiyah / Hijri Calendar | [ ] | [ ] | [ ] |
| 47 | Kiblat Finder | [ ] | [ ] | [ ] |
| 48 | Zakat Calculator + History | [ ] | [ ] | [ ] |
| 49 | Faraidh Calculator + History | [ ] | [ ] | [ ] |
| 50 | Notifications / Push / Reminders + Templates | [ ] | [ ] | [ ] |
| 51 | Content Correction Reports (+ Apply Correction) | [ ] | [ ] | [ ] |
| 52 | Admin Audit Logs | [ ] | — (admin only) | — |
| 53 | Notes & Annotations | [ ] | [ ] | [ ] |
| 54 | User Settings (sync) | [ ] | [ ] | [ ] |
| 55 | Search (global) | [ ] | [ ] | [ ] |
| 56 | Mobile Initial Sync | [ ] | — (mobile only) | [ ] |
| 57 | Analytics (page-view tracking) | [ ] | [ ] | [ ] |
| 58 | Open API / Developer Partner Integration | [ ] | [ ] | — (web/API only) |
| 59 | Admin: User Management | [ ] | [ ] | — |

**59 feature domain.** Belum termasuk infra murni (health/metrics/swagger/pprof).

### Urutan review yang disarankan
1. Mulai dari yang **bold** (5 gap di atas) — paling murah untuk cek dan
   paling mungkin nemuin bug/keputusan produk yang belum diputuskan.
2. Lanjut fitur dengan riwayat bug terbaru sesi ini: Masjid, Radio Islamic,
   Server Push Notifications, Custom Adzan Audio, Kajian speaker-filter
   (lihat `docs/features/todo/` dan `docs/features/progress/` untuk detail
   apa yang sudah/belum diverifikasi).
3. Sisanya bisa diurut bebas per prioritas roadmap
   (`docs/api/FEATURE_ROADMAP.md`).
