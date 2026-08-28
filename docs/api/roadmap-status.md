# Roadmap Status Web App / API Service

Dokumentasi ini merangkum hasil review roadmap untuk monorepo `thollabul-ilmi`.
Status web app dan API service dipisahkan supaya keputusan implementasi UI tidak tercampur dengan status API/API service.

## Web App

| Item                          | Status                | Catatan                                                       |
| ----------------------------- | --------------------- | ------------------------------------------------------------- |
| Aplikasi web app              | Ada                   | Web App berada di `apps/web`.                                 |
| Implementasi UI untuk roadmap | Perlu review terpisah | Status roadmap API service tidak otomatis menandai parity UI. |

## API Service

### Sudah ada / sudah ter-wire

| No            | Item roadmap                    | Status | Evidence                                                                                                 | Catatan                                                                                          |
| ------------- | ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `#1`          | Bookmark                        | Done   | `app/http/routes.go:190-192`                                                                             | CRUD bookmark user sudah ada.                                                                    |
| `#2`          | Search                          | Done   | `app/http/routes.go:107`, `app/services/search_service.go`                                               | Search Quran/Hadith sudah ada.                                                                   |
| `#3`          | Reading Progress                | Done   | `app/http/routes.go:195-199`                                                                             | Quran dan hadith progress sudah ada.                                                             |
| `#4`          | Hafalan Tracker                 | Done   | `app/http/routes.go:202-204`                                                                             | Update, list, dan summary hafalan sudah ada.                                                     |
| `#5`          | Streak & Daily Habit            | Done   | `app/http/routes.go:207-209`, `app/services/streak_service.go`                                           | Activity dan streak sudah ada.                                                                   |
| `#6`          | Tafsir                          | Done   | `app/http/routes.go:212-215`, `app/services/tafsir_service.go`                                           | Read + admin write sudah ada.                                                                    |
| `#7`          | Doa                             | Done   | `app/http/routes.go:218-220`                                                                             | List, detail, dan filter kategori sudah ada.                                                     |
| `#8`          | Asmaul Husna                    | Done   | `app/http/routes.go:223-224`                                                                             | List dan detail per nomor sudah ada.                                                             |
| `#9`          | Mufrodat / Kosakata Quran       | Done   | `app/http/routes.go:109-112`, `app/services/mufrodat_service.go`                                         | Endpoint ayah dan root word sudah ada.                                                           |
| `#10`         | Audio Murotal                   | Done   | `app/http/routes.go:227-232`                                                                             | Surah dan ayah audio sudah ada.                                                                  |
| `#11`         | Siroh Nabawiyah                 | Done   | `app/http/routes.go:235-244`                                                                             | Category/content CRUD sudah ada.                                                                 |
| `#12`         | Statistik Pribadi               | Done   | `app/http/routes.go:263-264`, `app/services/stats_service.go`                                            | `/stats` dan `/stats/weekly` sudah ada.                                                          |
| `#15` / `#42` | Jadwal Sholat                   | Done   | `app/http/routes.go:353,356-357`                                                                         | Praying time endpoints sudah ada.                                                                |
| `#16` / `#46` | Quiz / Flashcard                | Done   | `app/http/routes.go:373-378`                                                                             | Session, submit, stats, create, delete sudah ada.                                                |
| `#17` / `#47` | Notes & Annotation              | Done   | `app/http/routes.go:381-384`                                                                             | Notes CRUD sudah ada.                                                                            |
| `#18` / `#48` | Kamus Islami / Istilah Islam    | Done   | `app/http/routes.go:387-392`                                                                             | Dictionary CRUD dan filter kategori sudah ada.                                                   |
| `#19` / `#49` | Diskusi / Komentar              | Done   | `app/http/routes.go:395-397`                                                                             | Comment read/write/delete sudah ada.                                                             |
| `#20`         | Share to Feed                   | Done   | `app/http/routes.go:200-204`, `app/controllers/feed_controller.go`, `app/services/feed_service.go`       | Feed post create/list/like/delete sudah ada.                                                     |
| `#21`         | Tilawah Tracker                 | Done   | `app/http/routes.go:267-270`                                                                             | Log, list, summary sudah ada.                                                                    |
| `#22`         | Amalan Harian Checklist         | Done   | `app/http/routes.go:272-276`                                                                             | Checklist harian sudah ada.                                                                      |
| `#23`         | Preferred Language per User     | Done   | `app/model/user.go:16-23`, `app/controllers/user_controller.go:92-112`                                   | `preferred_lang` sudah disimpan dan dipakai di token.                                            |
| `#24`         | Kalender Hijriah                | Done   | `app/http/routes.go:405-408`, `app/services/hijri_service.go`                                            | Convert, today, dan events sudah ada.                                                            |
| `#25`         | Asbabun Nuzul                   | Done   | `app/http/routes.go:411-415`                                                                             | Read + admin write sudah ada.                                                                    |
| `#26`         | Dzikir & Wirid Collection       | Done   | `app/http/routes.go:279-281`, `app/http/routes.go:336-337`                                               | List, detail, kategori, dan occasion route sudah ada.                                            |
| `#27`         | Leaderboard                     | Done   | `app/http/routes.go:284-286`                                                                             | Streak, hafalan, dan my-rank sudah ada.                                                          |
| `#28`         | Sharing Card Metadata           | Done   | `app/http/routes.go:289-290`                                                                             | Share ayah dan hadith sudah ada.                                                                 |
| `#29`         | User Roles Granular             | Done   | `app/model/user.go:9-25`, `app/http/middlewares/middlewares.go:56-82`, `app/http/routes.go:212-415`      | Role `author` dan `editor` sudah ditambahkan, dan route konten sudah dipisah berdasarkan peran.  |
| `#30`         | Zakat Calculator                | Done   | `app/http/routes.go:297-299`                                                                             | Zakat maal, fitrah, dan nishab sudah ada.                                                        |
| `#31`         | Prayer Tracker (Sholat 5 Waktu) | Done   | `app/http/routes.go:302-305`                                                                             | Log, history, dan stats sudah ada.                                                               |
| `#32`         | Panduan Sholat Lengkap          | Done   | `app/http/routes.go:306-307`                                                                             | List dan detail langkah sholat sudah ada.                                                        |
| `#33`         | Muroja'ah Mode                  | Done   | `app/http/routes.go:310-312`, `app/services/murojaah_service.go`                                         | Session, result, stats sudah ada.                                                                |
| `#36`         | Koleksi Ceramah & Kajian        | Done   | `app/http/routes.go:330-334`                                                                             | CRUD kajian sudah ada.                                                                           |
| `#37`         | Muhasabah Harian                | Done   | `app/http/routes.go:340-344`                                                                             | CRUD jurnal refleksi sudah ada.                                                                  |
| `#38`         | Target Hafalan & Belajar        | Done   | `app/http/routes.go:347-350`                                                                             | Goals CRUD sudah ada.                                                                            |
| `#39`         | Rekap & Laporan Bulanan         | Done   | `app/http/routes.go:293-294`, `app/services/stats_service.go`                                            | Monthly dan yearly recap sudah ada.                                                              |
| `#40`         | Bacaan Sunnah & Wirid Khusus    | Done   | `app/http/routes.go:336-337`                                                                             | Occasion route sudah ada.                                                                        |
| `#41`         | Kiblat Finder                   | Done   | `app/http/routes.go:353`, `app/services/kiblat_service.go`                                               | Kalkulasi kiblat sudah ada.                                                                      |
| `#43`         | Jadwal Imsakiyah Ramadan        | Done   | `app/http/routes.go:360`                                                                                 | Endpoint imsakiyah sudah ada.                                                                    |
| `#44`         | Islamic History Timeline        | Done   | `app/http/routes.go:363-367`                                                                             | Timeline read + admin write sudah ada.                                                           |
| `#45`         | Manasik Haji & Umrah            | Done   | `app/http/routes.go:370-371`                                                                             | Step-by-step route sudah ada.                                                                    |
| `#13`         | Blog / Artikel                  | Done   | `app/http/routes.go:264-281`, `app/services/blog_service.go`, `app/repository/blog_repository.go`        | List published, search, related, popular, draft preview, dan CRUD konten sudah ada.              |
| `#50`         | Open API & Partner Integration  | Done   | `app/http/routes.go:420-450`, `app/controllers/api_key_controller.go`, `app/services/api_key_service.go` | Register/list/revoke API key dan content routes berbasis `X-API-Key` sudah ada.                  |
| `#34`         | Fiqh Ringkas                    | Done   | `app/http/routes.go:335-344`, `app/controllers/fiqh_controller.go`, `app/services/fiqh_service.go`       | List kategori, detail kategori, detail item, dan create item admin sudah sesuai kontrak roadmap. |
| `#14`         | Notifikasi / Reminder           | Done   | `app/http/routes.go:196-198`, `app/services/notification_service.go`, `main.go`                          | Settings reminder plus scheduler email harian sudah jalan.                                       |

## Ringkasan

- Web App: artefak web app sekarang berada di `apps/web`; parity UI perlu dinilai lewat dokumen web app dan QA terpisah.
- API Service: seluruh roadmap utama sudah ter-wire; sisa pekerjaan cenderung maintenance atau perluasan fitur, bukan gap fondasi.
- Mobile App: artefak mobile berada di `apps/mobile`; baseline Expo sudah mencakup native tab Quran/Hadith/Prayer/Qibla/Explore, auth session, personal notes/bookmarks/progress, local adzan reminder, Quran audio fallback, Qibla compass, dan SQLite offline pack.

## Mobile App

### Sudah ada / sudah ter-wire

| Item                       | Status | Evidence                                                                                            | Catatan                                                                                                                                                                                                                                                        |
| -------------------------- | ------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo mobile shell          | Done   | `apps/mobile/App.js`                                                                                | Home, Quran, Hadith, Prayer, Qibla, dan Explore sudah jadi tab/screen mobile. Deep link scheme: `thullaabulilmi://`.                                                                                                                                           |
| Auth/session mobile        | Done   | `apps/mobile/src/context/SessionContext.js`, `apps/mobile/src/storage/session.js`                   | Token disimpan via SecureStore native dengan fallback AsyncStorage untuk web smoke.                                                                                                                                                                            |
| Quran mobile reader        | Done   | `apps/mobile/src/screens/QuranScreen.js`, `apps/mobile/src/api/client.js`                           | Surah list, ayah reader, page/hizb navigator, hafalan hide/reveal mode, progress, bookmark, notes, tafsir/asbab panel, font preference, dan audio ayah fallback EveryAyah.                                                                                     |
| Hadith mobile detail       | Done   | `apps/mobile/src/screens/HadithScreen.js`                                                           | Detail, sanad, takhrij, perawi, jarh-ta'dil, related hadith, saved hadith, bookmark, dan notes.                                                                                                                                                                |
| Prayer mobile              | Done   | `apps/mobile/src/screens/PrayerScreen.js`                                                           | Location-based schedule, method/madhhab selector, manual correction, prayer log, local notification reminder, dan SQLite jadwal 30 hari.                                                                                                                       |
| Qibla mobile               | Done   | `apps/mobile/src/screens/QiblaScreen.js`, `apps/mobile/src/utils/compass.js`                        | Direction/distance plus native compass heading dengan web fallback.                                                                                                                                                                                            |
| Explore parity mobile      | Done   | `apps/mobile/src/screens/ExploreScreen.js`, `apps/mobile/src/data/mobileFeatures.js`                | Doa, Dzikir, Wirid, Asmaul Husna, Tafsir, Asbabun Nuzul, Siroh, Sejarah, Fiqh, Manasik, Kajian, Blog, Kamus, Quiz, Hijri, Tasbih, Zakat, Faraidh, personal features, dan leaderboard tersurface.                                                       |
| SQLite offline pack        | Done   | `apps/mobile/src/storage/offlineContent.native.js`, `apps/mobile/src/components/OfflinePackCard.js` | Quran, Hadith, Doa/Dzikir/Wirid, bookmark snapshot, dan prayer cache 30 hari tersimpan lokal; web fallback tidak mengimpor SQLite.                                                                                                                      |
| Deep link mobile           | Done   | `apps/mobile/src/utils/deepLinks.js`, `apps/mobile/App.js`                                          | Mendukung tab route dan target awal: `thullaabulilmi://quran/surah/1`, `thullaabulilmi://quran/page/1`, `thullaabulilmi://quran/hizb/1`, `thullaabulilmi://hadith/12`, `thullaabulilmi://prayer`, `thullaabulilmi://qibla`, `thullaabulilmi://explore/dzikir`. |
| Notification Center mobile | Done   | `apps/mobile/src/components/NotificationCenter.js`, `apps/mobile/src/api/personal.js`               | Explore Personal expose reminder settings, inbox list, mark-read, dan mark-all-read dari endpoint BE-backed notifications.                                                                                                                                     |

### Sisa perluasan mobile

| Item                         | Prioritas | Catatan                                                                                                           |
| ---------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| Push notification server/FCM | P2        | Local notification sudah ada; push token registration dan backend delivery belum.                                 |
| Native adzan audio custom    | P2        | Reminder sekarang memakai default notification sound.                                                             |
| Universal link domain        | P3        | URL scheme mobile sudah ada; universal link berbasis domain bisa ditambahkan setelah domain/app association siap. |
| Hadith native audio player   | P3        | Menunggu data media hadith/audio tersedia.                                                                        |
| AR qibla overlay             | P3        | Compass baseline sudah cukup; AR bisa jadi enhancement nanti.                                                     |

### Interpretasi Prioritas

- `P1` = paling mendesak; mengunci scope fondasi atau contract yang paling kelihatan bolong.
- `P2` = penting, tetapi tidak memblokir fondasi API service utama.
- `P3` = low priority / maintenance saja.
