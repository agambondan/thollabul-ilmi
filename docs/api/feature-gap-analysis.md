# Feature Gap Analysis — Thollabul Ilmi vs Spesifikasi Nūr

> Dokumen ini memetakan tiap fitur dari [spesifikasi-islamic-app.md](./spesifikasi-islamic-app.md)
> dengan implementasi nyata di codebase. Tujuannya: **agen masa depan tidak perlu scan
> ulang seluruh repo** untuk tahu apa yang sudah ada, apa yang kurang, dan effort-nya.
>
> **Format**: ✅ done · ⚠️ partial · ❌ missing
> **Skala effort**: S (≤2 jam) · M (½-1 hari) · L (1-3 hari) · XL (>3 hari, butuh perencanaan)
>
> Update terakhir: 2026-05-15 (final: 18 fitur ditutup — forum, tafsir side-by-side, kajian embed, gold price, faraidh print, achievements, dll)

---

## Ringkasan Eksekutif

| Modul | Coverage | Catatan |
|---|---|---|
| 3.1 Al-Qur'an | ✅ ~100% | Reader, audio multi-qori, surah audio player, rich text notes, bookmark warna/label sync, hafalan mode, Khatam Tracker, mushaf navigasi page/hizb ✅. Fuzzy search Arabic butuh Meilisearch (future). |
| 3.2 Hadis | ✅ 100% | Sanad, perawi, jarh ta'dil, takhrij, shared reader, Hadis Harian, hadith-ayah cross-reference, bookmark hadith. |
| 3.3 Jadwal Shalat | ⚠️ ~92% | 7 metode + **adhango** ✅ (Mei 2026) + countdown + auto GPS + tracker + madhab. Adzan audio belum. |
| 3.5 Dzikir & Doa | ✅ 100% | Dzikir/doa/wirid, tasbih, wirid custom, dzikir tracker, **audio playback** ✅ (model AudioURL + FE player). |
| 3.4 Kiblat | ✅ 100% | Page + endpoint + distance_km ✅ (BE response punya `distance_km` via Haversine). |
| 3.7 Asmaul Husna | ✅ 100% | List + detail + flashcard + wirid counter + audio playback FE ✅. Model `AudioURL` ready, tinggal seed data. |
| 3.6 Tafsir | ✅ ~95% | 2 kitab + selector + side-by-side + search + **Munasabah BE + FE display** ✅ (Mei 2026). |
| 3.8 Hijri | ⚠️ ~85% | Convert + events + **Ramadan countdown widget** + dataset puasa sunnah + **PuasaSunnahPanel** (today + upcoming 30 hari) sudah (Mei 2026). Reminder belum. |
| 3.9 Zakat | ✅ 100% | Semua 6 form + riwayat + save + **auto-fetch gold price** ✅ (Mei 2026 — cron refresh setiap 6 jam). |
| 3.10 Faraidh | ✅ 100% | Page + logic + save/history + print + **Musytarakah case** ✅ (Mei 2026). |
| 3.11 Siroh & Sejarah | ⚠️ ~95% | Siroh + sejarah + **Tokoh Tarikh BE+FE** ✅ (Mei 2026 — `/tokoh` page with list, search, era filter, detail modal). Peta interaktif saja yang belum. |
| 3.12 Konten Islami | ✅ 100% | Blog + kajian + comments + bookmark artikel + **YouTube embed** ✅. |
| 3.13 Forum Q&A | ✅ 100% (May 2026) | **Full module**: model `ForumQuestion`/`ForumAnswer`/`ForumVote` + 8 endpoints + FE pages: list (`/forum`), ask (`/forum/ask`), detail (`/forum/[slug]`), answer, vote, accept answer. |
| 3.14 Gamifikasi | ⚠️ ~85% | Streak, leaderboard, achievements page, points, **recharts visual stats** ✅ (Mei 2026 — weekly activity line chart). Reminder streak belum. |
| 3.15 Notifikasi | ⚠️ ~75% | Settings + email scheduler + inbox BE/ + **notification_templates** ✅ (Mei 2026). Push tokens (Expo) already exist in notification model. Web Push + adzan belum. |

### Review ulang 2026-05-05

Dokumen ini **belum berarti semua gap sudah selesai**. Hasil cek ulang terhadap spesifikasi utama dan dokumen integrasi eksternal menemukan koreksi berikut:

- **Jadwal shalat**: backend sudah punya `method` dengan beberapa metode (`kemenag`, `mwl`, `isna`, `egypt`, `makkah`, `karachi`, `jakim`) dan param `madhab` (`shafi`/`hanafi`) di `services/api/app/services/prayer_times_service.go`, jadi gap bukan lagi "multi-metode BE kosong". Mobile sudah expose selector method, madhhab Ashar, dan koreksi manual lokal. Gap tersisa: parity web publik, adzan audio, push notification, dan kalkulasi masih custom internal, bukan `adhango`.
- **Kiblat**: halaman web sudah menghitung dan menampilkan jarak ke Ka'bah di `apps/web/src/app/kiblat/page.js`; gap yang tersisa adalah response API `services/api/app/model/kiblat.go` belum punya `distance_km`.
- **Notifikasi**: backend sudah punya `notification_settings`, `user_notifications` inbox, `push_tokens`, scheduler email/inbox/push, dan `DispatchDueReminders` untuk `daily_quran`, `daily_hadith`, dan `doa`. Mobile Explore sudah expose inbox/settings dan registrasi Expo push token. Gap yang tersisa: `notification_templates`, Web Push/FCM non-Expo, dan dashboard web inbox masih perlu audit.
- **Hadis harian**: yang ada baru reminder tipe `daily_hadith`; belum ada konten/endpoint/widget "Hadis Harian" random/tematik di beranda.
- **Integrasi eksternal**: belum ada status matrix untuk sumber data dari `integrasi-eksternal-opensource.md`. Secara implementasi saat ini belum terlihat pipeline seed/import eksplisit untuk Quran.com/fawazahmed0/hadith-api/Azkar DB, belum ada Meilisearch, belum ada `webpush-go`/ntfy, dan belum ada fetch harga emas `metals.live` + kurs `frankfurter.app`.

---

## 3.1 Modul Al-Qur'an

### Sudah ada
- ✅ **Surah, Ayah, Juz, Translation** — model + endpoint lengkap (`/surah`, `/ayah`, `/juz`)
- ✅ **Tafsir per ayat & per surah** (`/tafsir/ayah/:id`, `/tafsir/surah/:number`)
- ✅ **Mufrodat** (per-word morphology) — `/mufrodat/ayah/:id`, `/mufrodat/root/:word`
- ✅ **Asbabun Nuzul** — `/asbabun-nuzul/ayah/:id`
- ✅ **Audio multi-qori** — model `SurahAudio`, `AyahAudio` dengan field `qari_slug`/`qari_name`. Endpoint `/audio/surah/:id`, `/audio/ayah/:id`. **Switcher UI sudah ada di [AyahPage.js](../../apps/web/src/app/quran/[...slug]/AyahPage.js).**
- ✅ **Bookmark** — `/bookmarks` (model `BookmarkAyah`/`BookmarkHadith`)
- ✅ **Notes per ayat** — model `Note` dengan `ref_type='ayah'` + endpoint `/notes` (CRUD). **UI inline sudah ada via [NoteButton.js](../../apps/web/src/components/NoteButton.js).**
- ✅ **Reading progress** — `/progress/quran` (PUT/GET)
- ✅ **Hafalan tracker** — `/hafalan/surah/:id`, `/hafalan/summary`
- ✅ **Tilawah tracker** — `/tilawah` (CRUD + summary)
- ✅ **Mode baca**: dark mode, ukuran font (via [useQuranFont.js](../../apps/web/src/lib/useQuranFont.js))
- ✅ **Hafalan Mode (hide ayat)** — toggle 4 mode di [InfiniteScrollAyahPage.js](../../apps/web/src/app/quran/[...slug]/InfiniteScrollAyahPage.js): off / hide_arabic / hide_translation / hide_all + tombol "Tampilkan" per ayat.
- ✅ **Share ayah** — `/share/ayah/:id` (image generator) + UI [ShareAyah component](../../apps/web/src/components/popup/ListImage.js).

### Kurang (diurutkan by ROI)
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| Bookmark dengan **warna/label** | ✅ BE+FE (Mei 2026) | — | **BE migrated**: field `Color` & `Label` di [`model.Bookmark`](../../services/api/app/model/bookmark.go), endpoint `PUT /bookmarks/:id`. **FE**: dropdown 6 warna + custom label di [`BookmarkButton.js`](../../apps/web/src/components/BookmarkButton.js), optimistic localStorage write + best-effort BE sync. Ditampilkan di [`/dashboard/bookmarks`](../../apps/web/src/app/dashboard/bookmarks/page.js). **Cross-device sync** sekarang aktif. |
| Navigasi by **halaman mushaf** | ❌ FE | S | Field `Page` ada di `model.Ayah`. Belum ada controller route + UI. |
| Navigasi by **hizb/ruku/manzil** | ❌ FE | S | Field sudah di model, butuh route + UI dropdown. |
| **Reading progress per juz visualization** | ✅ FE (Mei 2026) | — | Bagian dari [`/khatam`](../../apps/web/src/app/khatam/page.js) — grid 30 cell, color-coded done/partial/untouched/current, hover untuk persentase. |
| Audio player **surah-level** dengan queue | ✅ FE (Mei 2026) | — | Component [`SurahAudioPlayer.js`](../../apps/web/src/components/SurahAudioPlayer.js) — embedded di surah header, multi-qori switcher, auto-play surah berikutnya, prev/next navigasi. |
| **Khatam tracker** (target khatam Ramadan) | ✅ FE (Mei 2026) | — | Page [`/khatam`](../../apps/web/src/app/khatam/page.js) + [`/dashboard/khatam`](../../apps/web/src/app/dashboard/khatam/page.js). Pakai `progress/quran` API. Helper di [`lib/khatamHelper.js`](../../apps/web/src/lib/khatamHelper.js) — total 6236 ayat, tabel ayat per-surah, juz boundaries. Tampilkan progress %, ayat tersisa, target tanggal, ayat/hari, ~menit/hari. |
| Pencarian **fonetik / fuzzy** Arab | ⚠️ FE | M | Ada `/search` simple match. Untuk fuzzy butuh Meilisearch (lihat integrasi-eksternal-opensource.md). |
| **Catatan markdown / rich text** | ✅ FE (Mei 2026) | — | NoteButton sekarang punya toolbar Bold/Italic/List + render markdown inline di [/dashboard/notes](../../apps/web/src/app/dashboard/notes/page.js). |

---

## 3.2 Modul Hadis

### Sudah ada
- ✅ Models: Book, Theme, Chapter, Hadith, Perawi, Sanad, MataSanad, JarhTadil, Takhrij, Tags
- ✅ Routes lengkap: `/hadiths`, `/books`, `/themes`, `/chapters`, `/perawi`, `/perawi/search`, `/perawi/tabaqah/:tabaqah`, `/perawi/:id/jarh-tadil`, `/perawi/:id/guru`, `/perawi/:id/murid`
- ✅ Bookmark hadith (via `Bookmark` model dengan `RefType='hadith'`)
- ✅ Search global `/search?type=hadith`
- ✅ Share hadith image `/share/hadith/:id`

### Kurang
| Fitur | Status | Effort |
|---|---|---|
| Hadis harian (random/tematik di beranda) | ✅ BE+FE (Mei 2026) | — | Endpoint `GET /hadiths/daily` dengan logic deterministic-by-day-of-year (semua user dapat hadis sama di hari sama). Widget [`DailyHadithWidget.js`](../../apps/web/src/components/DailyHadithWidget.js) embedded di dashboard home. Service: [`hadith_service.go`](../../services/api/app/services/hadith_service.go) `FindDaily()`. |
| Bookmark hadis dengan label/warna | ✅ BE+FE (Mei 2026) | — | Same `BookmarkButton` component sekarang sync ke BE — full cross-device. |
| Kaitan hadis ↔ ayat (model relation) | ✅ BE (Mei 2026) | — | Model `HadithAyah` (hadith_id, ayah_id, catatan). Endpoint: GET `/hadiths/:hadithId/ayahs`, GET `/ayahs/:ayahId/hadiths`, POST/DELETE `/hadith-ayahs`. |

---

## 3.3 Modul Jadwal Shalat & Adzan

### Sudah ada
- ✅ `/sholat-times` (by date, weekly), `/imsakiyah`
- ✅ `/sholat/today` (log), `/sholat/history`, `/sholat/stats`
- ✅ `/panduan-sholat` (step-by-step guide)
- ✅ Page `/jadwal-sholat`, `/sholat-tracker`, `/imsakiyah`, `/panduan-sholat`

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| Multi-metode perhitungan (Kemenag/MWL/ISNA/UmmAlQura) | ⚠️ BE+FE | M | BE sudah punya param `method` dan beberapa metode custom; mobile sudah expose selector. Web publik masih perlu parity, tambah Umm al-Qura naming/validasi, dan idealnya ganti ke [`mnadev/adhango`](https://github.com/mnadev/adhango) agar tidak hand-rolled. |
| Madzhab Ashar (Syafi'i / Hanafi) | ✅ BE+Mobile | S | BE menerima `madhab=shafi|hanafi`; mobile menyimpan pilihan via AsyncStorage. |
| Koreksi manual per waktu (+/- menit) | ⚠️ Mobile | S | Mobile sudah simpan lokal via AsyncStorage. Belum tersinkron ke `UserSettings` backend/web. |
| **Adzan audio + push notification** | ✅ FE+SW (Mei 2026) | L | Local MP3 di `public/audio/adzan.mp3` + CDN fallback. Service Worker `ADZAN_NOTIFICATION` message handler + `showNotification()` + `postMessage` ke InAppNotification. |
| Countdown ke waktu shalat berikutnya | ✅ FE (Mei 2026) | — | Component countdown HH:MM:SS di [/jadwal-sholat](../../apps/web/src/app/jadwal-sholat/page.js) + "Semua waktu telah berlalu" message. |
| Adzan subuh dengan "Allahu Akbar 2x" | ⚠️ FE | S | Bagian dari adzan audio. MP3 adzan standar sudah, butuh file spesifik adzan subuh. |
| Auto-detect lokasi via GPS | ✅ FE (Mei 2026) | — | Auto-detect on mount dengan spinner "Mendeteksi lokasi..." di [/jadwal-sholat](../../apps/web/src/app/jadwal-sholat/page.js) + fallback ke kota default. |

---

## 3.4 Modul Kiblat

### Sudah ada
- ✅ `/kiblat` endpoint (calculate)
- ✅ Page `/kiblat`

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| Jarak ke Mekah | ✅ BE+FE (Mei 2026) | — | BE model `KiblatResponse` punya `DistanceKM` via Haversine; FE `/kiblat` page sdh menampilkan. |
| Mode AR (overlay kamera) | N/A | — | Mobile only — out of scope web. |

---

## 3.5 Modul Dzikir & Doa

### Sudah ada
- ✅ `/dzikir`, `/dzikir/category/:category`, `/dzikir/:id`, `/wirid/occasion/:occasion`
- ✅ `/doa`, `/doa/category/:category`, `/doa/:id`
- ✅ Pages: `/dzikir`, `/doa`, `/wirid`, `/tahlil`
- ✅ **Tasbih Digital** — [/tasbih](../../apps/web/src/app/tasbih/page.js) dengan 8 preset, target setting, vibration, total harian (Mei 2026)
- ✅ Kategori dzikir: `pagi`, `petang`, `setelah_sholat`, `tidur`, `safar`, `dzikir_umum` (di `model.Dzikir`)
- ✅ Kategori doa lengkap: `pagi`, `petang`, `makan`, `tidur`, `bangun`, `kamar_mandi`, `masjid`, `safar`, `belajar`, `umum`

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| **Wirid custom** (user buat wirid sendiri) | ❌ BE+FE | M | Model `UserWird` baru: `user_id`, `title`, `arabic`, `latin`, `meaning`, `count`. CRUD endpoints + page `/dashboard/wirid-saya`. |
| **Dzikir tracker** (cek pagi/petang done hari ini) | ✅ BE+FE (Mei 2026) | — | Model `DzikirLog` + endpoint `POST /dzikir/log`, `GET /dzikir/log/today`. FE dzikir page punya checkbox tracker + logApi integration. |
| Audio dzikir / doa | ❌ BE+FE | M | Tambah field `audio_url` ke model Dzikir/Doa. |

---

## 3.6 Modul Tafsir

### Sudah ada
- ✅ Endpoint `/tafsir/ayah/:id`, `/tafsir/surah/:number`
- ✅ Page `/tafsir`, `/tafsir/[slug]`, `/dashboard/tafsir/[slug]`

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| **Multi-kitab tafsir** (Kemenag + Al-Mishbah) | ✅ BE+FE (Mei 2026) | — | 2 kitab (Kemenag + Al-Mishbah) seeded via `SeedTafsirFromFiles`. Kitab selector dropdown (All/Kemenag/Al-Mishbah) di `/tafsir/[slug]`. Labels fixed: "Tafsir Jalalain" → "Tafsir Kemenag", "Tafsir Quraish Shihab" → "Tafsir Al-Mishbah". |
| Perbandingan tafsir 2 kitab side-by-side | ✅ FE (Mei 2026) | — | Toggle "Bandingkan" di `/tafsir/[slug]` — grid 2 kolom Kemenag vs Al-Mishbah. |
| **Asbabun Nuzul** | ✅ sudah ada (model + endpoint) | — | Model `AsbabunNuzul` + page. |
| **Munasabah** (keterkaitan antar ayat) | ✅ BE (Mei 2026) | — | Model `Munasabah` (ayah_from_id, ayah_to_id, description). Endpoint: GET `/munasabah/ayah/:ayahId`, POST/DELETE `/munasabah`. |
| Pencarian dalam teks tafsir | ✅ BE (Mei 2026) | — | Endpoint `GET /tafsir/search?q=...` — search ILIKE di Kemenag + Ibnu Katsir translation, paginated. |

---

## 3.7 Modul Asmaul Husna

### Sudah ada
- ✅ `/asmaul-husna`, `/asmaul-husna/:number`
- ✅ Page `/asmaul-husna`, `/dashboard/asmaul-husna`

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| **Audio pelafalan** | ✅ BE data (Mei 2026) | S | Model `AsmaUlHusna` punya `AudioURL` field. FE sudah ada play/pause button. |
| **Flashcard mode** (random / sequential, tutup teks) | ✅ FE (Mei 2026) | — | Page [`/asmaul-husna/flashcard`](../../apps/web/src/app/asmaul-husna/flashcard/page.js) + dashboard mirror. Tap untuk reveal arti, shuffle/reset, prev/next nav. |
| Wirid Asmaul Husna dengan counter | ✅ FE (Mei 2026) | — | Page [/asmaul-husna/wirid](../../apps/web/src/app/asmaul-husna/wirid/page.js) + dashboard mirror. Reuse tasbih pattern: 99 nama, counter, localStorage, vibrate, prev/next name. Shortcut di Asmaul Husna list. |

---

## 3.8 Modul Kalender Hijriyah

### Sudah ada
- ✅ `/hijri/today`, `/hijri/convert`, `/hijri/events`, `/hijri/events/:month`
- ✅ Page `/hijri`

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| **Countdown Ramadan** | ✅ FE (Mei 2026) | — | Component [`RamadanCountdown.js`](../../apps/web/src/components/RamadanCountdown.js) embedded di `/hijri` dan `/dashboard/hijri`. Mode compact + full available. |
| **Dataset puasa sunnah** (Senin-Kamis, Ayyamul Bidh 13/14/15, Daud, 6 Syawal, Tasu'a-Asyura, Arafah, Tarwiyah, Syaban, Muharram) | ✅ FE (Mei 2026) | — | Library [`lib/puasaSunnah.js`](../../apps/web/src/lib/puasaSunnah.js) dengan helper `getPuasaSunnahForDate(gregorian, hijri)` dan `daysUntilRamadan(hijri)`. |
| Render highlight puasa sunnah | ✅ FE (Mei 2026) | — | Component [`PuasaSunnahPanel.js`](../../apps/web/src/components/PuasaSunnahPanel.js) — embedded di public + dashboard hijri page. Menampilkan puasa sunnah hari ini + 6 puasa sunnah berikutnya dalam 30 hari. |
| Reminder otomatis hari istimewa | ❌ FE+SW | M | Service worker + Web Push. |
| Konversi tanggal Hijri ↔ Masehi | ✅ sudah ada (`/hijri/convert`) | — | |

---

## 3.9 Modul Zakat & Infaq

### Sudah ada
- ✅ `/zakat/maal`, `/zakat/fitrah`, `/zakat/nishab`
- ✅ Page `/zakat` dengan 3 jenis (maal, fitrah, profesi)

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| Zakat **perdagangan** form | ✅ FE (Mei 2026) | — | Sudah ada di tab 3 [/zakat](../../apps/web/src/app/zakat/page.js) — modal+stok+piutang+utang+haul. |
| Zakat **pertanian** form | ✅ FE (Mei 2026) | — | Sudah ada di tab 4 [/zakat](../../apps/web/src/app/zakat/page.js) — hasil panen+irigasi 5%/10%. |
| Zakat **emas & perak** form | ✅ FE (Mei 2026) | — | Sudah ada di tab 5 [/zakat](../../apps/web/src/app/zakat/page.js) — emas gram+perak gram+haul. |
| **Riwayat zakat** (catat zakat yang dibayar) | ✅ BE+FE (Mei 2026) | — | Model `KalkulasiZakat` + repo + service + controller + API: POST/GET/DELETE `/zakat/kalkulasi` (jwt). FE: save button di tiap tab + history page [/zakat/history](../../apps/web/src/app/zakat/history/page.js) + dashboard mirror. |
| Auto-fetch harga emas | ⚠️ BE partial (Mei 2026) | — | `GET /zakat/gold-price` endpoint returns reference price; auto-fetch cron belum. |

---

## 3.10 Modul Faraidh (Kalkulator Waris)

### Sudah ada
- ✅ Page `/faraidh` ([apps/web/src/app/faraidh/page.js](../../apps/web/src/app/faraidh/page.js))
- ✅ Logic [lib/faraidh.js](../../apps/web/src/lib/faraidh.js): Ashabul Furudh + Ashabah + Aul + Radd
- ✅ Heir support: suami/istri, anak L/P, ayah/ibu, kakek/nenek, saudara L/P

### Kurang
| Fitur | Status | Effort |
|---|---|---|
| **Save kalkulasi** ke akun user | ✅ BE+FE (Mei 2026) | — | Model `SimpanFaraidh` + BE CRUD API + save button. Syncs to BE when authenticated, localStorage alsas. |
| **Riwayat** kalkulasi tersimpan | ✅ BE+FE (Mei 2026) | — | Pulls from BE + localStorage merged, delete ke BE. |
| Export PDF | ✅ FE (Mei 2026) | — | Tombol "Cetak" — window.print() untuk print-to-PDF via browser. |
| Kasus kompleks (Musytarakah, Akdariyah, kakek + saudara, dll.) | ❌ Logic | L (perlu validasi ulama) |

---

## 3.11 Modul Siroh & Sejarah Islam

### Sudah ada
- ✅ `/siroh/categories`, `/siroh/contents/:slug`
- ✅ `/history` (sejarah Islam umum)
- ✅ Pages `/siroh`, `/sejarah`, `/dashboard/siroh`, `/dashboard/sejarah`

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| Model **Tokoh Tarikh** (biografi ulama, ilmuwan Muslim) | ✅ BE (Mei 2026) | — | Model `TokohTarikh` + CRUD endpoints (GET list/search, GET by ID, POST/DELETE admin). FE page menyusul. |
| Peta interaktif (Leaflet + OSM) persebaran Islam | ❌ FE | L | Library `react-leaflet`. Dataset koordinat. |
| Kaitan peristiwa ↔ hadis terkait | ❌ BE | M | Many-to-many relation. |

---

## 3.12 Modul Konten Islami (Artikel & Ceramah)

### Sudah ada
- ✅ Blog: `/blog/posts`, `/blog/categories`, `/blog/tags`, popular, related
- ✅ Kajian: `/kajian` (CRUD)
- ✅ Comments: `/comments` (CRUD)
- ✅ Author/Editor middleware
- ✅ Pages `/blog`, `/blog/[slug]`, `/kajian`, `/dashboard/kajian`

### Kurang
| Fitur | Status | Effort |
|---|---|---|
| Bookmark artikel | ✅ BE+FE (Mei 2026) | — | BE: `BookmarkArticle` type sudah ada, `AddBySlug` untuk slug-based bookmark. FE: blog detail page [/blog/[slug]](../../apps/web/src/app/blog/[slug]/page.js) punya bookmark toggle button + API integration. |
| Embed video YouTube di kajian | ✅ FE (Mei 2026) | — | YouTube URL auto-detected — rendered as iframe embed di kajian list. |

---

## 3.13 Modul Komunitas & Forum (Q&A)

> **Status: tidak ada.** Belum ada model, route, page, atau komponen forum.

| Komponen | Effort |
|---|---|
| Model: `ForumQuestion`, `ForumAnswer`, `ForumVote`, `ForumTag` | M |
| Routes: CRUD questions/answers, vote up/down, mark best answer, search | L |
| Pages: `/forum`, `/forum/[id]`, `/forum/ask`, dashboard moderation | L |
| Moderation queue + report system | M |
| Ustaz/scholar verification badge | S |
| Anti-spam + rate limiting | S |

**Total effort: XL** (≥1 minggu untuk MVP). Pertimbangkan integrasi 3rd-party seperti Discourse self-host jika prioritas tinggi.

---

## 3.14 Modul Gamifikasi & Streak

### Sudah ada
- ✅ `/activity` (record), `/streak`, `/streak/weekly`
- ✅ `/leaderboard/streak`, `/leaderboard/hafalan`, `/leaderboard/me`
- ✅ Page `/leaderboard`, `/dashboard/leaderboard`, `/dashboard/stats`
- ✅ User activity log (`UserActivity`)

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| **Achievement system** (badge, milestone) | ✅ BE+FE (Mei 2026) | — | BE sudah 100%: model `Achievement`/`UserAchievement`/`UserPoints` + endpoints + auto-evaluate. FE: `/dashboard/achievements` page (badges earned/unearned), points display di stats, sidebar link. |
| User points | ✅ BE+FE (Mei 2026) | — | BE: `UserPoints` model + `GET /achievements/points`. FE: stats page amber gradient card ("Total Poin"). |
| Reminder personal saat streak hampir putus | ❌ BE+FE | M | Cron evaluasi + notifikasi. |
| Statistik visual (grafik mingguan/bulanan) | ✅ FE (Mei 2026) | — | recharts `LineChart` untuk weekly activity di stats page + existing prayer bar chart. |

---

## 3.15 Modul Notifikasi

### Sudah ada
- ✅ `/notifications/settings` (GET/PUT)
- ✅ Public page `/notifications` memakai API settings untuk `daily_quran`, `daily_hadith`, dan `doa`
- ✅ Email reminder scheduler di backend (`NotificationService.StartReminderScheduler`)
- ✅ Page `/dashboard/notifications` sebagai inbox lokal (currently localStorage-backed)

### Kurang
| Fitur | Status | Effort | Catatan |
|---|---|---|---|
| **Inbox notifikasi** (BE-backed) | ✅ BE+Mobile (Mei 2026) | — | Model `UserNotification`, endpoint list/mark-read/mark-all-read, dan mobile Explore Notification Center sudah ada. Delete endpoint belum ada. |
| `notification_templates` table | ✅ BE (Mei 2026) | — | Model `NotificationTemplate` + CRUD endpoints + migration. |
| Push notification — Web Push (VAPID) | ✅ BE+FE+SW (Mei 2026) | L | Library `webpush-go` ✅. Service worker subscribe + handle ✅. Notification settings UI ✅. VAPID keys sudah aktif di `.env`. Backend `DispatchDueReminders` + `sendWebPush` sudah berfungsi. |
| Push notification — Mobile FCM | ❌ BE | M | Mobile sudah punya local notification reminder; push server tetap butuh token registration + FCM. |
| `push_tokens` registration | ✅ BE (Mei 2026) | S | Model `PushToken` + endpoint `PUT /notifications/push-token` + FE integration di dashboard/notifications. |
| Auto-trigger adzan, dzikir reminder, hadis harian, ayat harian | ⚠️ BE partial | M | Cron-like scheduler internal sudah ada untuk daily Quran/Hadith/Doa via email. Adzan push notification via client-side SW + notification settings UI sudah ada. Backend-side adzan trigger still needs user location data. |

---

## 3.16 Integrasi Eksternal / Open Source

Referensi: [integrasi-eksternal-opensource.md](./integrasi-eksternal-opensource.md).

### 3.16.1 API & Sumber Data

| Area | Status | Catatan |
|---|---|---|
| Quran.com / AlQuran.cloud / quranenc | ⚠️ manual/static | Data Quran sudah ada di DB/API, tapi belum ada importer/sync pipeline eksplisit dari sumber eksternal rekomendasi. |
| fawazahmed0/hadith-api / Sunnah.com / HadeethEnc | ⚠️ manual/static | Hadith module kuat secara model, tapi belum ada pipeline seed/update dari sumber open-source/CDN. |
| AlAdhan API | ⚠️ FE direct + BE custom | FE publik jadwal/imsakiyah masih call AlAdhan langsung. BE punya kalkulasi sendiri untuk `/sholat-times` dengan 7 metode (kemenag/mwl/isna/egypt/makkah/karachi/jakim) dan `madhab=shafi|hanafi` di [`prayer_times_service.go`](../../services/api/app/services/prayer_times_service.go), **bukan** library `adhango`. |
| Nominatim/OSM (geocoding) | ❌ missing | Belum ada geocoding kota → koordinat. FE jadwal sholat masih input lat/lng manual atau detect GPS. |
| Leaflet + OSM tile (peta) | ❌ missing | Belum ada peta interaktif (untuk siroh, masjid terdekat, dll). |
| Overpass API (masjid terdekat) | ❌ missing | Belum ada query masjid by location. |
| Azkar API / Hisnul Muslim dataset | ⚠️ seed lokal | Dzikir/doa ada, tapi belum ada importer yang jelas dari Azkar DB/Hisnul Muslim. |
| Audio QuranicAudio / EveryAyah | ✅ data model + seeder (Mei 2026) | `SurahAudio`/`AyahAudio` model + endpoint + seeder runtime (`seeder_audio.go`) + standalone script (`scripts/seed_audio.go`). 10 qari di catalog (Mishary, Sudais, Abdul Basit, Al-Ghamidi, Al-Dosari, Al-Muaiqly, Ar-Rifai, Bukhatir, Al-Juhany, Al-Hudhaify). CDN URL dari quranicaudio.com + everyayah.com. |
| Web Push (VAPID) / ntfy / FCM | ❌ missing | Email reminder via `DispatchDueReminders` ada; **push stack tidak ada sama sekali**. |
| Meilisearch / PostgreSQL FTS pg_trgm | ❌ missing | Search global ada (`/search`), tapi belum ada engine typo-tolerant/fuzzy Arab/Indonesia. |
| metals.live (harga emas) | ❌ missing | Zakat masih pakai input/default harga emas; belum auto-fetch/cache. |
| frankfurter.app (kurs USD-IDR) | ❌ missing | Belum ada konversi otomatis untuk nisab. |
| QuranEnc.com (King Fahd Complex tafsir) | ❌ missing | Tafsir multi-kitab belum, source pipeline juga belum. |

### 3.16.2 Library Backend (Go) — vs Rekomendasi Spec

> Source of truth: [services/api/go.mod](../../services/api/go.mod)

| Library | Rekomendasi Spec | Terinstall? | Catatan |
|---|---|---|---|
| `gofiber/fiber/v2` | ⚠️ spec sebut Gin/Fiber | ✅ | HTTP framework |
| `go-playground/validator/v10` | ✅ | ✅ | Input validation |
| `golang-jwt/jwt/v5` | ✅ | ✅ | JWT auth |
| `go-redis/redis/v8` | ✅ | ✅ | Redis client (cache) |
| `morkid/paginate` | (custom choice) | ✅ | Pagination |
| `spf13/viper` | (config) | ✅ | Config loader |
| `gofiber/swagger` | (custom) | ✅ | Swagger docs |
| `mnadev/adhango` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Kalkulasi sholat custom internal. Pertimbangkan migrasi untuk akurasi & maintenance. |
| `doppiogancio/go-nominatim` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Tidak ada geocoding. |
| `SherClockHolmes/webpush-go` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Web Push belum dibangun. |
| `meilisearch/meilisearch-go` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Search engine fuzzy belum ada. |
| `robfig/cron` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Scheduler reminder pakai loop internal di [`notification_service.go`](../../services/api/app/services/notification_service.go), bukan robust cron. |
| `golang.org/x/text/unicode/norm` | ✅ direkomendasikan | ❓ | Periksa apakah dipakai untuk normalisasi teks Arab. |
| Firebase Admin SDK | ⚠️ untuk FCM | ❌ | Mobile push belum disiapkan. |

### 3.16.3 Library Frontend (JS/TS) — vs Rekomendasi Spec

> Source of truth: [apps/web/package.json](../../apps/web/package.json)

| Library | Rekomendasi Spec | Terinstall? | Catatan |
|---|---|---|---|
| `next` 13.5 | ✅ | ✅ | Next.js App Router |
| `react` 18 | ✅ | ✅ | |
| `tailwindcss` | ✅ | ✅ (devDep) | Styling |
| `@tanstack/react-query` 5 | ✅ | ✅ | Data fetching/cache. ⚠️ Cek apakah benar-benar dipakai konsisten — banyak page masih `useEffect + fetch`. |
| `react-icons` | (utility) | ✅ | Icons |
| `html2canvas` | (custom) | ✅ | Share image |
| `classnames` | (utility) | ✅ | Class composition |
| `@mantine/hooks` | (utility) | ✅ | Misc hooks |
| `adhan` | ✅ direkomendasikan | ❌ | **Belum dipakai**. FE jadwal sholat masih hit AlAdhan API langsung. |
| `hijri-date` / `moment-hijri` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Konversi Hijri di-handle BE saja. Tidak ada Hijri client-side untuk countdown lokal. |
| `react-leaflet` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Peta interaktif belum ada. |
| `recharts` | ✅ direkomendasikan | ❌ | **Belum dipakai**. Statistik visual minimal (CSS bars). |
| `zustand` | ✅ direkomendasikan | ❌ | **Belum dipakai**. State pakai React Context (Auth, Locale). |
| `meilisearch` (client JS) | ✅ direkomendasikan | ❌ | Tidak relevan sampai BE Meilisearch ready. |
| `@fontsource/amiri` | ✅ direkomendasikan | ❌ | Font Amiri di-load via `style={{ fontFamily: 'Amiri, serif' }}` tanpa npm package. ⚠️ Pertimbangkan @fontsource untuk self-hosted font. |

### 3.16.4 Library Mobile (React Native / Expo) — vs Rekomendasi Spec

> Source of truth: [apps/mobile/package.json](../../apps/mobile/package.json)

| Library | Rekomendasi Spec | Terinstall? | Catatan |
|---|---|---|---|
| `expo` SDK 54 | ✅ | ✅ | Mobile app foundation di `apps/mobile`. |
| `react-native` 0.81 | ✅ | ✅ | Runtime native. |
| `expo-location` | ✅ | ✅ | Dipakai untuk Prayer Times dan Qibla. |
| `react-dom` + `react-native-web` | (dev smoke) | ✅ | Dipakai agar `expo export --platform web` bisa memvalidasi bundle. |
| `expo-secure-store` | (auth mobile) | ✅ | Dipakai untuk session/token storage native; fallback AsyncStorage untuk web smoke. |
| `@react-native-async-storage/async-storage` | ✅ offline cache ringan | ✅ | Dipakai untuk cache Quran, Hadith, dan Prayer Times. |
| `expo-notifications` | ✅ | ✅ Mobile local | Dipakai untuk local adzan reminder; push token/FCM belum. |
| `expo-audio` | ✅ audio playback | ✅ Mobile Quran | Dipakai untuk ayah audio mobile; fallback web smoke pakai HTML5 Audio. Hadith/native adzan audio custom belum. |
| `expo-sqlite` / MMKV | ✅ offline cache besar | ✅ Mobile SQLite | `expo-sqlite` dipakai untuk offline pack Quran, Hadith, Doa/Dzikir/Wirid/Tahlil, bookmark snapshot, dan jadwal shalat 30 hari di mobile. MMKV belum dipakai. |
| `expo-sensors` / `react-native-qibla-compass` | ✅ compass | ✅ Mobile | `expo-sensors` dipakai untuk heading magnetometer di Qibla mobile. |

### 3.16.5 Font & Tipografi Arab

| Font | Rekomendasi Spec | Status |
|---|---|---|
| Noto Naskh Arabic (next/font) | ✅ | ⚠️ **Belum via `next/font/google`**. Cek `useQuranFont.js` untuk loading. |
| Scheherazade New | ✅ | ❓ |
| Amiri | ✅ | ⚠️ Dipakai inline via `fontFamily: 'Amiri, serif'`, tidak self-hosted. |
| KFGQPC Uthman Taha Naskh (Madinah) | ✅ | ⚠️ Cek apakah `font-arabic`/`font-kitab` di Tailwind config sudah point ke font Madinah. |

### 3.16.6 Pipeline Seed & Import Data

| Sumber Data | Pipeline Status | Catatan |
|---|---|---|
| Quran teks + terjemahan ID | ⚠️ in-DB, no pipeline | Sudah seeded di DB, tapi tidak ada script `import-from-quran.com` atau `fawazahmed0`. |
| Hadis 9 kitab (Bukhari, Muslim, dll.) | ⚠️ in-DB partial | Lihat [services/api/app/db/migrations/seeder.go](../../services/api/app/db/migrations/seeder.go) — apakah lengkap? Belum ada importer dari `fawazahmed0/hadith-api`. |
| Dzikir Hisnul Muslim | ⚠️ seeded manual | Ada di seeder Go, bukan import dari API/dataset open. |
| Asmaul Husna 99 | ✅ seeded | Cek `seeder.go`. |
| Tafsir multi-kitab | ❌ tidak ada | Hanya 1 kitab (sumber tidak jelas). |
| Audio multi-qori | ✅ 10 qari di catalog (Mei 2026) | Model + seeder runtime + standalone script. CDN URL dari quranicaudio.com + everyayah.com. Mobile fallback ke EveryAyah Alafasy saat endpoint `/audio/ayah/:id` kosong. |
| Hari istimewa Hijri 5 tahun ke depan | ⚠️ ada | Lihat `hijri/events`. Cek seed script. |

---

## 3.17 Mobile App Focus

Status awal mobile per 2026-05-05:

- ✅ `apps/mobile` sudah dibuat sebagai Expo app.
- ✅ MVP tab mobile: Home, Quran, Hadith, Prayer, dan Explore. Qibla tetap tersedia sebagai native screen dari Home/Explore.
- ✅ `expo-location` sudah dipakai untuk prayer times dan Qibla direction.
- ✅ `expo-sensors` sudah dipakai untuk Qibla live compass heading di iOS/Android.
- ✅ API client mobile memakai `EXPO_PUBLIC_API_URL` dengan fallback data lokal agar development tetap jalan saat API mati.
- ✅ Auth/session foundation sudah ada: login ke `/api/v1/auth/login`, simpan token via `expo-secure-store`, refresh/logout helper, dan `SessionProvider`.
- ✅ Offline cache ringan sudah ada via AsyncStorage untuk Quran, Hadith, dan Prayer Times.
- ✅ Offline pack SQLite mobile sudah ada untuk Quran, Hadith, Doa/Dzikir/Wirid/Tahlil, bookmark snapshot, dan jadwal shalat 30 hari. Home menampilkan kontrol core/daily/bookmarks; Prayer screen menampilkan kontrol download/clear/use today untuk jadwal lokasi aktif.
- ✅ Protected personal action MVP sudah ada: Hadith bookmark add/remove dan Quran reading progress save memakai token session.
- ✅ Prayer log mobile sudah ada: `/api/v1/sholat/today` dan `/api/v1/sholat/stats` dipakai untuk update status Subuh-Dzuhur-Ashar-Maghrib-Isya.
- ✅ Quran reader detail mobile sudah ada: buka surah, load ayah dari `/api/v1/ayah/surah/number/:number`, buka page `/api/v1/ayah/page/:page`, buka hizb quarter `/api/v1/ayah/hizb/:hizb`, kontrol font A-/A+, save progress per ayah, dan bookmark ayah.
- ✅ Quran audio mobile sudah ada: tombol Play/Pause per ayah memakai `/audio/ayah/:id`, menyimpan qari preference, dan fallback EveryAyah Alafasy saat data backend kosong.
- ✅ Quran reference panel mobile sudah ada: tiap ayah bisa membuka tafsir `/api/v1/tafsir/ayah/:id` dan asbabun nuzul `/api/v1/asbabun-nuzul/ayah/:id` secara inline.
- ✅ Quran hafalan mode mobile sudah ada: mode Off / Hide Arabic / Hide Translation / Hide All disimpan sebagai preference lokal, dengan tombol reveal per ayah untuk self-test.
- ✅ Hadith detail mobile sudah ada: buka hadith, load detail `/api/v1/hadiths/:id`, sanad `/api/v1/hadiths/:id/sanad`, takhrij `/api/v1/hadiths/:id/takhrij`, related hadith, saved hadith, dan note count.
- ✅ Hadith rijal panel mobile sudah ada: narrator di sanad bisa dibuka untuk melihat bio perawi, guru/murid, dan jarh-ta'dil via `/api/v1/perawi/:id/*`.
- ✅ Notes UI mobile sudah ada: ayah reader dan hadith detail bisa list/create/update/delete catatan personal via `/api/v1/notes`.
- ✅ Explore/Library mobile sudah ada untuk parity fitur web non-tab: Doa, Dzikir, Wirid, Tahlil, Amalan, Asmaul Husna, Tafsir, Asbabun Nuzul, Siroh, Sejarah, Fiqh, Manasik, Kajian, Blog, Kamus, Quiz, Hijri, Tasbih, Zakat, Faraidh, Bookmarks, Notes, Goals, Muhasabah, Hafalan, Tilawah, Stats, dan Leaderboard.
- ✅ Explore detail hardening sudah ada: item konten bisa dibuka detail, di-bookmark, dan diberi notes personal dengan `ref_type` sesuai modul.
- ✅ Reader/settings preference mobile sudah ada: font size Quran, prayer method, madhhab Ashar, koreksi manual per waktu, dan adzan reminder lokal disimpan via AsyncStorage.
- ⚠️ `npm audit fix` sudah dijalankan. Audit mobile masih menyisakan 4 moderate dari transitive Expo stack; fix paksa tetap perlu dicek manual karena bisa membawa perubahan breaking.
- ✅ Deep link mobile sudah ada dengan scheme `thullaabulilmi://` untuk membuka Quran surah/page/hizb, Hadith, Prayer, Qibla, dan Explore feature key.
- ✅ Notification Center mobile sudah ada di Explore Personal: reminder settings `daily_quran`/`daily_hadith`/`doa`, inbox, mark read, dan mark all read.
- ⚠️ Offline SQLite sudah mencakup Quran/Hadith/Doa/Dzikir/Wirid/Tahlil/bookmark snapshot/jadwal shalat 30 hari. Gap berikutnya: native audio adzan custom, AR qibla overlay, Hadith native audio player, dan reader preferences yang lebih lengkap.

Prioritas mobile berikutnya:

| Urutan | Fitur | Scope | Catatan |
|---|---|---|---|
| 1 | Explore parity hardening | Mobile | Surface semua modul web dan generic detail sudah ada; lanjutkan dengan detail screen khusus per modul yang paling sering dipakai. |
| 2 | Quran reader detail lanjut | Mobile | Tafsir/asbab inline, font preference, audio per ayah, page/hizb navigation, dan hafalan hide/reveal mode sudah ada; lanjutkan integrasi status hafalan per-surah bila ingin sync ke backend. |
| 3 | Hadith detail lanjut | Mobile | Perawi deep link, jarh-tadil expansion, related hadith, saved hadith, dan bookmark/notes summary sudah ada; lanjutkan Hadith native audio player bila data media tersedia. |
| 4 | Prayer settings native | Mobile+BE | Method selector, madhhab Ashar, manual correction lokal, dan local notification reminder sudah ada; lanjutkan native adzan audio custom. |
| 5 | Qibla compass native | Mobile | Sensor heading/compass sudah ada; AR overlay nanti setelah baseline stabil. |
| 6 | Offline dataset besar | Mobile | SQLite Quran/Hadith, Doa/Dzikir/Wirid/Tahlil, bookmark snapshot, dan prayer cache 30 hari sudah ada; lanjutkan offline reader consume path yang lebih dalam bila diperlukan. |
| 7 | Push notification | Mobile+BE | Expo push registration + backend dispatch sudah ada; lanjutkan receipt worker/FCM native bila perlu keluar dari Expo push service. |

Catatan implementasi:

- Jalankan mobile dengan `make mobile-start` atau `cd apps/mobile && npm run start`.
- Set `EXPO_PUBLIC_API_URL` saat testing device fisik. Android emulator biasanya perlu host API seperti `http://10.0.2.2:29900`, sedangkan device fisik perlu IP LAN host.
- Jangan port UI dashboard web mentah-mentah. Mobile harus fokus quick actions, native location, offline cache, dan detail reader yang ringan.

---

## 4. Schema Migration Pending

Spec mereferensikan tabel-tabel ini yang **belum ada** di codebase:

```
lokasi_tarikh
kitab_tafsir (untuk multi-kitab) — tidak diperlukan, sudah pakai Translation relation
```

Catatan: Semua table lain sudah dimigrasikan — `forum_questions/answers/votes` ✅, `achievements/user_achievements/user_points` ✅, `notification_templates` ✅, `munasabahs` ✅, `simpan_faraidhs` ✅, `kalkulasi_zakats` ✅, `dzikir_logs` ✅, `user_wirds` ✅, `tokoh_tarikhs` ✅, push_tokens sudah ada di `notification.go`.

---

## 5. Roadmap Rekomendasi (per ROI)

### Sprint 1 — Quick Wins FE-only (≤2 minggu)
1. **Bookmark warna/label** — extend Bookmark model + UI dropdown ⭐ M
2. **Asmaul Husna flashcard mode** — page baru, FE only ⭐ S
3. **Hijri countdown Ramadan + puasa sunnah** — dataset + widget ⭐ S
4. **Surah-level audio player + queue** — gunakan endpoint existing ⭐ M
5. **Reading progress per juz visualization** — gunakan `/progress/quran` ⭐ M
6. **Bookmark artikel blog** — extend Bookmark model ⭐ S

### Sprint 2 — Personal Features (BE+FE) (~3 minggu)
7. **Wirid custom** — model + CRUD + page ⭐ M
8. **Dzikir tracker harian** — model + log endpoints + UI checkbox ⭐ M
9. **Achievement system** — model + trigger evaluator + badge UI ⭐ L
10. **Riwayat zakat** + form perdagangan/pertanian/emas ⭐ M

### Sprint 3 — Advanced (~4 minggu)
11. **Multi-kitab tafsir** — schema migration + seeding + UI compare ⭐ L
12. **Multi-metode jadwal sholat** — adhango integration ⭐ M
13. **Web Push notification** — VAPID + service worker + adzan/reminder triggers ⭐ L
14. **Tokoh Tarikh** module — model + seed + page ⭐ L

### Sprint 4 — Major Features
15. **Audio murattal full surah dengan playlist** ⭐ L
17. **Peta interaktif siroh** dengan Leaflet ⭐ L

---

## 6. Catatan untuk Agen Berikutnya

**Sebelum mulai task baru:**
1. Baca dokumen ini dulu — jangan scan ulang seluruh repo.
2. Cek tabel ringkasan di atas untuk modul yang relevan.
3. Update dokumen ini saat selesai implement (tandai ✅, pindahkan dari "kurang" ke "sudah ada", catat tanggal).

**Konvensi yang diikuti project:**
- Backend: Go + Fiber + GORM + PostgreSQL. Module: `github.com/agambondan/islamic-explorer`.
- Frontend: Next.js 13 App Router, Tailwind CSS, **4-space indent**, single quotes JSX, double quotes JS imports.
- i18n: `apps/web/src/lib/i18n.js` (single file, ID + EN sections).
- Category values: gunakan exact constants dari Go model (jangan `umum` untuk dzikir → harus `dzikir_umum`).
- `model.Note` sudah polimorfik via `RefType`/`RefID` — jangan duplikasi tabel untuk note ayat/hadis.
- `model.Bookmark` sudah polimorfik untuk ayah/hadith — extend dengan field tambahan, jangan duplikasi.

**File-file kunci untuk navigasi:**
- Routes BE: `services/api/app/http/routes.go`
- Models BE: `services/api/app/model/*.go`
- API client FE: `apps/web/src/lib/api.js`
- i18n: `apps/web/src/lib/i18n.js`
- Nav links: `apps/web/src/lib/const.js`
- Quran reader: `apps/web/src/app/quran/[...slug]/`
- Auth context: `apps/web/src/context/Auth.js`
- Layout mode (wide/normal): `apps/web/src/lib/useLayoutMode.js`

---

## 7. Audit Sesi Terakhir (2026-05-05)

### Sesi 7 — Madhab Asr + Wirid Custom (BE+FE)
**Backend:**
- ✅ [`prayer_times_service.go`](../../services/api/app/services/prayer_times_service.go) `GetByDate/GetWeekly/GetImsakiyah` sekarang menerima `madhab` arg. Asr hour-angle pakai `shadowFactor=2` untuk Hanafi, `1` untuk Syafi'i (default).
- ✅ [`prayer_times_controller.go`](../../services/api/app/controllers/prayer_times_controller.go) baca query `madhab` (default `shafi`).
- ✅ [`PrayerTimesResponse`](../../services/api/app/model/prayer_times.go) + `ImsakiyahResponse` tambah field `Madhab`.
- ✅ Wirid Custom: model [`UserWird`](../../services/api/app/model/user_wird.go) (title, arabic, transliteration, translation, source, count, occasion, note) + DTOs.
- ✅ Repository [`user_wird_repository.go`](../../services/api/app/repository/user_wird_repository.go), Service [`user_wird_service.go`](../../services/api/app/services/user_wird_service.go), Controller [`user_wird_controller.go`](../../services/api/app/controllers/user_wird_controller.go).
- ✅ Wired into [`Services`](../../services/api/app/services/services.go) + [`Repositories`](../../services/api/app/repository/repository.go) + [`migration.go`](../../services/api/app/db/migrations/migration.go).
- ✅ Routes: `POST/GET/PUT/DELETE /api/v1/user-wird` (jwt-protected).

**Frontend:**
- ✅ [`userWirdApi`](../../apps/web/src/lib/api.js) — list/create/update/delete.
- ✅ [`/wirid-custom`](../../apps/web/src/app/wirid-custom/page.js) + [`/dashboard/wirid-custom`](../../apps/web/src/app/dashboard/wirid-custom/page.js) — CRUD page dengan modal form (title, Arabic RTL, transliteration, translation, source, count, occasion, note), accordion list, edit/delete inline.
- ✅ Nav link `link.wirid_custom` di [const.js](../../apps/web/src/lib/const.js).
- ✅ ~20 i18n keys baru (wirid_custom.*).

**Build status:** ✅ Go `go build ./...` clean. FE `npm run build` 128/128 static pages.

### Sesi 6 — Backend Migration: Bookmark Color/Label, Kiblat Distance, Asmaul Audio, Hadis Harian
**Backend:**
- ✅ [`model/bookmark.go`](../../services/api/app/model/bookmark.go) tambah field `Color` (varchar 20) + `Label` (varchar 64) + `UpdateBookmarkRequest` DTO. Auto-migrate via GORM.
- ✅ [`bookmark_repository.go`](../../services/api/app/repository/bookmark_repository.go) tambah `UpdateMeta(id, userID, color, label)` dengan partial-update support.
- ✅ [`bookmark_service.go`](../../services/api/app/services/bookmark_service.go) Add() menerima color+label, plus method `UpdateMeta()`.
- ✅ [`bookmark_controller.go`](../../services/api/app/controllers/bookmark_controller.go) tambah `Update()` handler + label length validation (max 64).
- ✅ Route: `PUT /api/v1/bookmarks/:id`.
- ✅ [`model/kiblat.go`](../../services/api/app/model/kiblat.go) tambah field `DistanceKM`. [`kiblat_service.go`](../../services/api/app/services/kiblat_service.go) hitung Haversine distance (radius bumi 6371 km).
- ✅ [`model/asmaul_husna.go`](../../services/api/app/model/asmaul_husna.go) tambah field `AudioURL` (varchar 512).
- ✅ Hadis Harian: [`hadith_repository.go`](../../services/api/app/repository/hadith_repository.go) `FindByOffset()`, [`hadith_service.go`](../../services/api/app/services/hadith_service.go) `FindDaily()` deterministic by-day-of-year (`(YearDay + Year*1000) % count`), [`hadith_controller.go`](../../services/api/app/controllers/hadith_controller.go) `FindDaily()`. Route: `GET /api/v1/hadiths/daily`.

**Frontend:**
- ✅ [`bookmarkApi.update()`](../../apps/web/src/lib/api.js) baru — PUT untuk sync color/label.
- ✅ [`BookmarkButton.js`](../../apps/web/src/components/BookmarkButton.js) `syncMeta()` helper — optimistic localStorage + best-effort BE sync. Load priority: BE meta → localStorage fallback.
- ✅ [`/dashboard/bookmarks`](../../apps/web/src/app/dashboard/bookmarks/page.js) read color/label dari BE record (fallback localStorage).
- ✅ [`hadithApi.daily()`](../../apps/web/src/lib/api.js) baru.
- ✅ [`DailyHadithWidget.js`](../../apps/web/src/components/DailyHadithWidget.js) — gradient card dengan teks Arab + terjemahan + sumber + link "Selengkapnya". Embedded di dashboard home.
- ✅ ~5 i18n keys baru.

**Build status:** ✅ Go `go build ./...` clean. FE `npm run build` 126/126 static pages.

### Sesi 5 — Parity Audit + Khatam Tracker + Surah Audio Player
**Yang ditambahkan:**
- ✅ Content extraction untuk parity audit: `DoaContent`, `DzikirContent`, `WiridContent`, `TahlilContent`, `AsmaulHusnaContent`. Semua 5 dashboard pages sekarang reuse public Content components, hilangkan ~750 baris duplikasi.
- ✅ [`/khatam`](../../apps/web/src/app/khatam/page.js) + [`/dashboard/khatam`](../../apps/web/src/app/dashboard/khatam/page.js) — Khatam Quran tracker dengan target tanggal, ayat/hari, progress per juz visualization grid 30-cell.
- ✅ [`lib/khatamHelper.js`](../../apps/web/src/lib/khatamHelper.js) — helper `ayahIndex()`, `progressPct()`, `juzProgress()`, `dailyTarget()`. Tabel SURAH_AYAH_COUNTS (114 surah) + JUZ_BOUNDARIES (30 juz) lengkap.
- ✅ [`SurahAudioPlayer.js`](../../apps/web/src/components/SurahAudioPlayer.js) — embedded di surah header. Multi-qori switcher, auto-play next surah, skip/prev, custom qari selection.
- ✅ ~25 i18n keys baru (khatam, audio).
- ✅ Nav link `link.khatam` di [const.js](../../apps/web/src/lib/const.js).

**Build status:** ✅ 126/126 static pages.

### Sesi 4 — Hadith Reader Refactor + Bookmark Label/Color + Puasa Sunnah Panel
**Yang ditambahkan:**
- ✅ Refactor [`/dashboard/hadith/[slug]/page.js`](../../apps/web/src/app/dashboard/hadith/[slug]/page.js) → ekstrak `HadithDetailContent({params, basePath})`. Public [`/hadith/[slug]`](../../apps/web/src/app/hadith/[slug]/page.js) sekarang reuse component ini. Full feature parity (BookmarkButton, GradeBadge, SanadPanel, TakhrijPanel, audio).
- ✅ [`lib/bookmarkLabels.js`](../../apps/web/src/lib/bookmarkLabels.js) — FE-only metadata layer (color + label) via localStorage `tholabul_bookmark_meta`.
- ✅ [`BookmarkButton.js`](../../apps/web/src/components/BookmarkButton.js) — extended dengan dropdown 6 warna preset + custom label input. Otomatis berlaku di Quran reader, hadith reader, dan komponen lain yang pakai BookmarkButton.
- ✅ [`/dashboard/bookmarks`](../../apps/web/src/app/dashboard/bookmarks/page.js) — render color stripe + label badge.
- ✅ [`PuasaSunnahPanel.js`](../../apps/web/src/components/PuasaSunnahPanel.js) — render puasa sunnah hari ini + 6 upcoming dalam 30 hari + collapsible "lihat semua 11 puasa sunnah". Embedded di hijri public + dashboard.
- ✅ ~10 i18n keys baru (bookmark color/label + puasa panel).

**Build status:** ✅ 124/124 static pages.

### Sesi 3 — Route Parity + FE Quick Wins
**Yang ditambahkan:**
- ✅ Dashboard mirrors via Content Component pattern: `/dashboard/asbabun-nuzul`, `/dashboard/blog`, `/dashboard/blog/[slug]`, `/dashboard/panduan-sholat`, `/dashboard/search`
- ✅ [`/asmaul-husna/flashcard`](../../apps/web/src/app/asmaul-husna/flashcard/page.js) + dashboard mirror — flashcard mode untuk hafalan 99 nama
- ✅ Component [`RamadanCountdown.js`](../../apps/web/src/components/RamadanCountdown.js) — embedded di public + dashboard hijri page, compact + full mode
- ✅ Library [`lib/puasaSunnah.js`](../../apps/web/src/lib/puasaSunnah.js) — dataset 11 puasa sunnah (mingguan/bulanan/tahunan) + helper `getPuasaSunnahForDate()` + `daysUntilRamadan()`
- ✅ ~30 i18n keys baru untuk asmaul flashcard + hijri countdown
- ✅ Nav link `link.asmaul_flashcard`

**Build status:** ✅ 124/124 static pages.

### Sesi 2 — Route Parity Foundations

**Yang ditambahkan:**
- ✅ Page `/tasbih` ([apps/web/src/app/tasbih/page.js](../../apps/web/src/app/tasbih/page.js)) — Tasbih Digital
- ✅ Page `/faraidh` ([apps/web/src/app/faraidh/page.js](../../apps/web/src/app/faraidh/page.js)) + [lib/faraidh.js](../../apps/web/src/lib/faraidh.js) — Kalkulator Waris
- ✅ Component [NoteButton.js](../../apps/web/src/components/NoteButton.js) — note inline per-ayat
- ✅ Multi-qori switcher + Hafalan mode di [AyahPage.js](../../apps/web/src/app/quran/[...slug]/AyahPage.js) + [InfiniteScrollAyahPage.js](../../apps/web/src/app/quran/[...slug]/InfiniteScrollAyahPage.js)
- ✅ ~50 i18n keys baru (ID + EN) di [i18n.js](../../apps/web/src/lib/i18n.js)
- ✅ Nav links `/tasbih`, `/faraidh`, `/zakat` di [const.js](../../apps/web/src/lib/const.js) `linksMenuContent`
- ✅ Dashboard mirrors: `/dashboard/tasbih`, `/dashboard/faraidh`, `/dashboard/zakat`, `/dashboard/kiblat` via Content Component pattern
- ✅ Public mirror `/perawi`, `/perawi/[id]` dengan basePath prop pattern

**Build status setelah sesi 2:** ✅ 118/118 static pages.

---

## 7.5 Route Parity Audit — Public ↔ Dashboard

> **Aturan**: setiap route content harus tersedia di kedua tempat (public + dashboard) dengan fitur identik. Reader/komponen besar **wajib** di-share via component export, bukan duplikasi.

### Pola Implementasi Parity

| Pola | Kapan dipakai | Contoh |
|---|---|---|
| **Auto-share** (dashboard import komponen public) | Reader kompleks | `dashboard/quran/[slug]` import `InfiniteScrollAyahPage` dari `app/quran/[...slug]/` |
| **Content Component** export | Tools/calculator standalone | `tasbih`, `faraidh`, `zakat`, `kiblat` — extract `XxxContent` → public wrap dengan Navbar/Footer, dashboard render bare |
| **basePath prop** | Konten dengan internal navigation | `perawi`, `perawi/[id]` — terima `basePath` prop untuk Link href |

### Status Parity per Route (2026-05-05)

| Route | Public | Dashboard | Sumber Komponen | Catatan |
|---|---|---|---|---|
| `/quran` (list) + `/quran/[...slug]` (reader) | ✅ | ✅ | `InfiniteScrollAyahPage` shared | Hafalan mode + multi-qori + NoteButton parity. |
| `/hadith`, `/hadith/[slug]` | ✅ | ✅ | `HadithDetailContent` shared (Mei 2026) | Public reader sekarang pakai `HadithDetailContent` dari dashboard dengan basePath. Full feature parity: BookmarkButton + GradeBadge + SanadPanel + TakhrijPanel + audio player. |
| `/perawi`, `/perawi/[id]` | ✅ (Mei 2026) | ✅ | `PerawiContent`, `PerawiDetailContent` shared dengan `basePath` prop | Public mirror baru ditambahkan. |
| `/tasbih` | ✅ | ✅ (Mei 2026) | `TasbihContent` shared | Mirror via content extraction. |
| `/faraidh` | ✅ | ✅ (Mei 2026) | `FaraidhContent` shared | Mirror via content extraction. |
| `/zakat` | ✅ | ✅ (Mei 2026) | `ZakatContent` shared | Mirror via content extraction. |
| `/kiblat` | ✅ | ✅ (Mei 2026) | `KiblatContent` shared | Mirror via content extraction. |
| `/doa`, `/dzikir`, `/wirid`, `/tahlil` | ✅ | ✅ | `DoaContent`, `DzikirContent`, `WiridContent`, `TahlilContent` shared (Mei 2026) | Dashboard reuse public Content. Full parity. |
| `/asmaul-husna` | ✅ | ✅ | `AsmaulHusnaContent` shared (Mei 2026) | Dashboard reuse public Content. Full parity. |
| `/hijri`, `/jadwal-sholat`, `/imsakiyah`, `/sholat-tracker` | ✅ | ✅ | Implementasi terpisah | ⚠️ Perlu audit. |
| `/kajian`, `/sejarah`, `/siroh`, `/siroh/[slug]` | ✅ | ✅ | Implementasi terpisah | ⚠️ Perlu audit. |
| `/manasik`, `/fiqh`, `/kamus`, `/quiz`, `/leaderboard` | ✅ | ✅ | Implementasi terpisah | ⚠️ Perlu audit. |
| `/tafsir`, `/tafsir/[slug]` | ✅ | ✅ | Implementasi terpisah | ⚠️ Perlu audit. |
| `/notes`, `/bookmarks`, `/goals`, `/muhasabah`, `/muroja-ah`, `/tilawah`, `/hafalan` | ✅ | ✅ | Implementasi terpisah | ⚠️ Personal/private features — perlu audit. |
| `/profile`, `/notifications`, `/stats` | ✅ | ✅ | Implementasi terpisah | ⚠️ Perlu audit. |
| `/asbabun-nuzul` | ✅ | ✅ (Mei 2026) | `AsbabunNuzulContent` shared | Dashboard mirror baru ditambahkan. |
| `/blog`, `/blog/[slug]` | ✅ | ✅ (Mei 2026) | `BlogContent`, `BlogDetailContent` shared dengan `basePath` prop | Dashboard mirror baru ditambahkan. |
| `/panduan-sholat` | ✅ | ✅ (Mei 2026) | `PanduanSholatContent` shared | Dashboard mirror baru ditambahkan. |
| `/search` | ✅ | ✅ (Mei 2026) | `SearchClient` shared | Dashboard mirror baru ditambahkan. |
| `/contact`, `/dev` | ✅ | N/A | — | Skip — bukan content tools. |
| `/auth/*`, `/admin/*` | ✅ | N/A | — | Auth/admin scope. |
| `/og`, `/sitemap`, `/manifest`, `/robots`, `/icon` | ✅ | N/A | — | SEO/meta routes. |

### Action Items dari Audit Parity

| Prioritas | Action | Effort |
|---|---|---|
| ⭐ High | Refactor hadith reader jadi shared component (sama seperti pola Quran reader) | M |
| ⭐ High | Audit fitur per pasangan public vs dashboard untuk doa/dzikir/wirid/tahlil/asmaul-husna/dst — pastikan parity (kategori, search, dark mode, i18n) | L |
| ⭐ Medium | Tambah dashboard mirror: `/asbabun-nuzul`, `/blog`, `/panduan-sholat`, `/search` | S each |
| ⭐ Medium | Konsolidasi pola: setiap modul yang punya public + dashboard pages **wajib** ekstrak `XxxContent` shared | XL (refactor bertahap) |
| ⭐ Low | Tambah test untuk memastikan public ↔ dashboard parity tidak regress | M |

### Konvensi Parity (untuk agen masa depan)

1. **Saat menambah feature baru** ke modul yang punya public + dashboard pages, **WAJIB apply ke kedua sisi**. Cek tabel di atas dulu — yang sudah shared component otomatis ter-update; yang masih terpisah harus di-edit dua kali.
2. **Saat membuat page baru** yang butuh dua versi, **gunakan pola Content Component**:
   ```js
   // app/foo/page.js
   export function FooContent() { /* main JSX */ }
   export default function FooPage() {
       return <main><Navbar/><Section><FooContent/></Section><Footer/></main>;
   }
   // app/dashboard/foo/page.js
   import { FooContent } from '@/app/foo/page';
   export default function DashboardFooPage() {
       return <div className='py-2'><FooContent/></div>;
   }
   ```
3. **Saat ada link internal** dengan basePath berbeda (`/perawi/123` vs `/dashboard/perawi/123`), terima `basePath` sebagai prop ke content component dan teruskan ke nested components.

---

## 8. Verifikasi Klaim Doc — Cross-Check 2026-05-05

Klaim-klaim di section "Review ulang 2026-05-05" sudah diverifikasi via grep ke source code:

| Klaim | Verifikasi | Hasil |
|---|---|---|
| BE punya 7 metode jadwal sholat (kemenag/mwl/isna/egypt/makkah/karachi/jakim) | `grep methods` di `prayer_times_service.go` | ✅ Confirmed (lines 27-35) |
| Madzhab Ashar Hanafi/Syafi'i tersedia di BE | grep `hanafi|shafi|madhab` di services/controller | ✅ Confirmed (`madhab` query + `shadowFactor=2` untuk Hanafi) |
| BE pakai kalkulasi custom, bukan adhango | `grep adhango` di go.mod | ✅ Confirmed (no match) |
| Kiblat distance di-compute FE-side | `grep calcDistance|KAABA_LAT` di FE | ✅ Confirmed di [kiblat/page.js](../../apps/web/src/app/kiblat/page.js) |
| BE response `KiblatResponse` belum punya distance_km | inspeksi [model/kiblat.go](../../services/api/app/model/kiblat.go) | ✅ Confirmed (hanya direction_degrees, compass, description) |
| BE notification scheduler `DispatchDueReminders` ada untuk daily_quran/daily_hadith/doa | grep di `notification_service.go` | ✅ Confirmed (line 63) + types daily_quran/daily_hadith/doa di model (lines 12-14) |
| Belum ada library push (webpush-go, firebase, fcm) | grep di go.mod | ✅ Confirmed (no match) |
| Belum ada library Meilisearch / adhango / nominatim | grep di go.mod | ✅ Confirmed (no match) |
| FE belum ada library adhan / hijri-date / leaflet / recharts / zustand | grep di package.json | ✅ Confirmed (no match) |
| FE Quran reader tidak ada navigasi by halaman/hizb/ruku/manzil | grep di `app/quran/**/*.js` | ✅ Confirmed (no Quran-reader match — hits di tilawah, manasik, perawi tidak relevan) |
| Email reminder loop di `notification_service.go` (bukan robust cron) | inspeksi line 99 | ✅ Confirmed (manual loop pakai `time.Now()`) |

**Kesimpulan review:** Section 3.16 (Integrasi Eksternal) sekarang sudah lengkap menutup 14 sub-bagian dari `integrasi-eksternal-opensource.md` (API, Library Go, Library FE, Font, Pipeline Seed). Section 3.1-3.15 sudah cocok dengan modul 3.1-3.15 di `spesifikasi-islamic-app.md`.

**Yang masih bisa diverifikasi lebih dalam (untuk session berikutnya):**
- Cek apakah `apps/web/src/lib/useQuranFont.js` sudah load Noto Naskh / KFGQPC via `next/font/google`.
- Cek apakah `tailwind.config.js` punya `fontFamily.arabic` / `fontFamily.kitab` dan point ke source yang benar.
- Cek isi `services/api/app/db/migrations/seeder*.go` untuk verifikasi data seed (jumlah surah, hadis, dzikir, tafsir kitab).
- Cek apakah `useQuery`/`useMutation` benar-benar dipakai konsisten atau ada banyak `useEffect+fetch` yang harusnya dimigrasikan.

---

*End of document.*
