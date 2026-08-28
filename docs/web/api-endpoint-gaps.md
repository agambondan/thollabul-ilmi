# API Service Endpoint Gaps

Dokumen ini memetakan endpoint API service yang dipakai web app, supaya API service bisa dikerjakan per kontrak nyata.

Sumber utama:

- `src/lib/api.js`
- direct `fetch()` calls di `src/app/**`

## Quran and Search

| Endpoint                                   | Dipakai oleh web app                                                                 | Catatan                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `GET /api/v1/surah?size=114&sort=number`   | `src/app/quran/page.js`, `src/app/tafsir/page.js`                                    | Daftar surah dasar untuk landing Quran dan index tafsir.       |
| `GET /api/v1/surah/name/:slug?page=&size=` | `src/app/quran/[...slug]/InfiniteScrollAyahPage.js`, `src/app/tafsir/[slug]/page.js` | Reader ayah dan tafsir per surah bergantung ke ini.            |
| `GET /api/v1/search?q=&type=&lang=`        | `src/app/search/SearchClient.js`                                                     | Pencarian global quran, hadith, dan entitas lain.              |
| `GET /api/v1/tafsir/surah/:number`         | `src/app/tafsir/[slug]/page.js`, `src/app/quran/[...slug]/AyahPage.js`               | Tafsir per surah untuk index dan reader.                       |
| `GET /api/v1/tafsir/ayah/:ayahId`          | `src/app/quran/[...slug]/AyahPage.js`                                                | Tafsir per ayah untuk popup reader.                            |
| `GET /api/v1/mufrodat/ayah/:ayahId`        | `src/app/quran/[...slug]/AyahPage.js`                                                | Kosakata per ayah.                                             |
| `GET /api/v1/mufrodat/root/:word`          | `src/lib/api.js`                                                                     | Root-word lookup untuk kosakata.                               |
| `GET /api/v1/audio/surah/:number`          | `src/app/quran/[...slug]/AyahPage.js`                                                | Audio surah.                                                   |
| `GET /api/v1/audio/ayah/:ayahId`           | `src/app/quran/[...slug]/AyahPage.js`                                                | Audio per ayah.                                                |
| `GET /api/v1/asbabun-nuzul/surah/:number`  | `src/lib/api.js`, `src/app/asbabun-nuzul/page.js`                                    | Konten asbabun-nuzul per surah.                                |
| `GET /api/v1/asbabun-nuzul/ayah/:ayahId`   | `src/lib/api.js`                                                                     | Konten asbabun-nuzul per ayah bila API service menyediakannya. |

## Hadith

| Endpoint                                                                           | Dipakai oleh web app                                                               | Catatan                                       |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| `GET /api/v1/books`                                                                | `src/app/hadith/byBook.js`                                                         | Daftar kitab hadith.                          |
| `GET /api/v1/themes?size=250`                                                      | `src/app/hadith/byTheme.js`                                                        | Daftar theme hadith.                          |
| `GET /api/v1/themes/book/:bookSlug`                                                | `src/app/hadith/byChapter.js`, `src/app/hadith/[slug]/InfiniteScrollHadithPage.js` | Theme yang tersedia untuk kitab tertentu.     |
| `GET /api/v1/chapters/book/:bookSlug/theme/:themeId?size=10000`                    | `src/app/hadith/byChapter.js`                                                      | Daftar chapter untuk kombinasi kitab + theme. |
| `GET /api/v1/chapters?book_id=&size=&page=`                                        | `src/app/dev/page.js`                                                              | Kontrak yang didokumentasikan di UI dev.      |
| `GET /api/v1/hadiths/book/:bookSlug?page=&size=`                                   | `src/app/hadith/byHadith.js`                                                       | Browse hadith per kitab dengan pagination.    |
| `GET /api/v1/hadiths/book/:bookSlug/theme/:themeId/chapter/:chapterId?page=&size=` | `src/app/hadith/[slug]/InfiniteScrollHadithPage.js`                                | Reader hadith berdasarkan bab.                |
| `GET /api/v1/hadiths/theme/slug/:slug?size=&page=`                                 | `src/app/hadith/theme/[slug]/page.js`                                              | Reader hadith per theme slug.                 |

## Content Catalogs

| Endpoint                                            | Dipakai oleh web app                             | Catatan                                                      |
| --------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `GET /api/v1/doa?page=&size=`                       | `src/lib/api.js`, `src/app/doa/page.js`          | Daftar doa harian.                                           |
| `GET /api/v1/doa/category/:category?page=&size=`    | `src/lib/api.js`, `src/app/doa/page.js`          | Filter doa per kategori.                                     |
| `GET /api/v1/doa/:id`                               | `src/lib/api.js`                                 | Detail doa.                                                  |
| `GET /api/v1/dzikir?page=&size=`                    | `src/lib/api.js`, `src/app/dzikir/page.js`       | Daftar dzikir.                                               |
| `GET /api/v1/dzikir/category/:category?page=&size=` | `src/lib/api.js`, `src/app/dzikir/page.js`       | Filter dzikir per kategori.                                  |
| `GET /api/v1/dzikir/:id`                            | `src/lib/api.js`                                 | Detail dzikir.                                               |
| `GET /api/v1/asmaul-husna`                          | `src/lib/api.js`, `src/app/asmaul-husna/page.js` | 99 nama Allah dan artinya.                                   |
| `GET /api/v1/asmaul-husna/:number`                  | `src/lib/api.js`                                 | Detail nama tertentu.                                        |
| `GET /api/v1/fiqh`                                  | `src/app/fiqh/page.js`                           | Halaman fiqh bergantung daftar topik/dalil dari API service. |
| `GET /api/v1/kajian`                                | `src/lib/api.js`, `src/app/kajian/page.js`       | Katalog kajian.                                              |
| `GET /api/v1/kajian/:id`                            | `src/lib/api.js`                                 | Detail kajian.                                               |
| `GET /api/v1/hijri/today`                           | `src/lib/api.js`, `src/app/hijri/page.js`        | Tanggal hijriah hari ini.                                    |
| `GET /api/v1/hijri?date=YYYY-MM-DD`                 | `src/lib/api.js`, `src/app/hijri/page.js`        | Konversi tanggal Masehi ke Hijriah.                          |
| `GET /api/v1/hijri/events`                          | `src/lib/api.js`, `src/app/hijri/page.js`        | Daftar event/peristiwa penting.                              |
| `GET /api/v1/hijri/events/:month`                   | `src/lib/api.js`, `src/app/hijri/page.js`        | Event per bulan Hijriah.                                     |
| `GET /api/v1/leaderboard/streak`                    | `src/lib/api.js`, `src/app/leaderboard/page.js`  | Leaderboard streak.                                          |
| `GET /api/v1/leaderboard/hafalan`                   | `src/lib/api.js`, `src/app/leaderboard/page.js`  | Leaderboard hafalan.                                         |
| `GET /api/v1/leaderboard/me`                        | `src/lib/api.js`                                 | Posisi user saat login.                                      |
| `GET /api/v1/stats`                                 | `src/lib/api.js`, `src/app/stats/page.js`        | Summary statistik.                                           |
| `GET /api/v1/stats/weekly`                          | `src/lib/api.js`, `src/app/stats/page.js`        | Statistik mingguan.                                          |
| `GET /api/v1/stats/monthly?month=`                  | `src/lib/api.js`, `src/app/stats/page.js`        | Statistik bulanan.                                           |
| `GET /api/v1/stats/yearly?year=`                    | `src/lib/api.js`                                 | Statistik tahunan.                                           |
| `GET /api/v1/amalan`                                | `src/lib/api.js`, `src/app/amalan/page.js`       | Daftar amalan.                                               |
| `GET /api/v1/amalan/today`                          | `src/lib/api.js`, `src/app/amalan/page.js`       | Amalan hari ini.                                             |
| `GET /api/v1/amalan/history`                        | `src/lib/api.js`, `src/app/amalan/page.js`       | Riwayat amalan.                                              |

## User State and Personal Data

| Endpoint                               | Dipakai oleh web app                               | Catatan                        |
| -------------------------------------- | -------------------------------------------------- | ------------------------------ |
| `GET /api/v1/bookmarks`                | `src/lib/api.js`, `src/app/bookmarks/page.js`      | Daftar bookmark user.          |
| `POST /api/v1/bookmarks`               | `src/lib/api.js`, bookmark UI                      | Tambah bookmark.               |
| `DELETE /api/v1/bookmarks/:id`         | `src/lib/api.js`, bookmark UI                      | Hapus bookmark.                |
| `GET /api/v1/progress/quran`           | `src/lib/api.js`                                   | Progress baca Quran.           |
| `PUT /api/v1/progress/quran`           | `src/lib/api.js`                                   | Simpan progress Quran.         |
| `GET /api/v1/progress/hadith`          | `src/lib/api.js`                                   | Progress baca hadith.          |
| `PUT /api/v1/progress/hadith`          | `src/lib/api.js`                                   | Simpan progress hadith.        |
| `GET /api/v1/hafalan`                  | `src/lib/api.js`, `src/app/hafalan/page.js`        | Daftar hafalan.                |
| `GET /api/v1/hafalan/summary`          | `src/lib/api.js`, `src/app/hafalan/page.js`        | Summary hafalan.               |
| `PUT /api/v1/hafalan/surah/:surahId`   | `src/lib/api.js`, `src/app/hafalan/page.js`        | Update status hafalan.         |
| `GET /api/v1/streak`                   | `src/lib/api.js`                                   | Streak aktivitas.              |
| `POST /api/v1/activity`                | `src/lib/api.js`                                   | Log aktivitas user.            |
| `GET /api/v1/notes`                    | `src/lib/api.js`, `src/app/notes/page.js`          | Catatan user.                  |
| `POST /api/v1/notes`                   | `src/lib/api.js`, `src/app/notes/page.js`          | Buat catatan.                  |
| `PUT /api/v1/notes/:id`                | `src/lib/api.js`, `src/app/notes/page.js`          | Update catatan.                |
| `DELETE /api/v1/notes/:id`             | `src/lib/api.js`, `src/app/notes/page.js`          | Hapus catatan.                 |
| `GET /api/v1/goals`                    | `src/lib/api.js`, `src/app/goals/page.js`          | Target user.                   |
| `POST /api/v1/goals`                   | `src/lib/api.js`, `src/app/goals/page.js`          | Buat target.                   |
| `PUT /api/v1/goals/:id`                | `src/lib/api.js`, `src/app/goals/page.js`          | Update target.                 |
| `DELETE /api/v1/goals/:id`             | `src/lib/api.js`, `src/app/goals/page.js`          | Hapus target.                  |
| `GET /api/v1/muhasabah`                | `src/lib/api.js`, `src/app/muhasabah/page.js`      | Riwayat muhasabah.             |
| `POST /api/v1/muhasabah`               | `src/lib/api.js`, `src/app/muhasabah/page.js`      | Simpan muhasabah.              |
| `PUT /api/v1/muhasabah/:id`            | `src/lib/api.js`, `src/app/muhasabah/page.js`      | Update muhasabah.              |
| `DELETE /api/v1/muhasabah/:id`         | `src/lib/api.js`, `src/app/muhasabah/page.js`      | Hapus muhasabah.               |
| `GET /api/v1/sholat/today`             | `src/lib/api.js`, `src/app/sholat-tracker/page.js` | Status sholat hari ini.        |
| `PUT /api/v1/sholat/today`             | `src/lib/api.js`, `src/app/sholat-tracker/page.js` | Simpan status sholat hari ini. |
| `GET /api/v1/sholat/history`           | `src/lib/api.js`, `src/app/sholat-tracker/page.js` | Riwayat sholat.                |
| `GET /api/v1/tilawah`                  | `src/lib/api.js`, `src/app/tilawah/page.js`        | Log tilawah user.              |
| `POST /api/v1/tilawah`                 | `src/lib/api.js`, `src/app/tilawah/page.js`        | Tambah log tilawah.            |
| `GET /api/v1/tilawah/summary`          | `src/lib/api.js`, `src/app/tilawah/page.js`        | Ringkasan tilawah.             |
| `GET /api/v1/quiz/questions?category=` | `src/lib/api.js`, `src/app/quiz/page.js`           | Bank soal kuis.                |
| `POST /api/v1/quiz/submit`             | `src/lib/api.js`, `src/app/quiz/page.js`           | Submit jawaban kuis.           |

## Admin, Developer, and Sharing

| Endpoint                                 | Dipakai oleh web app                                         | Catatan                                 |
| ---------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `GET /api/v1/users`                      | `src/lib/api.js`, `src/app/admin/users/page.js`              | Admin list user.                        |
| `PUT /api/v1/users/:id`                  | `src/lib/api.js`, `src/app/profile/page.js`, admin user page | Update profil / admin edit user.        |
| `DELETE /api/v1/users/:id`               | `src/lib/api.js`, `src/app/admin/users/page.js`              | Hapus user oleh admin.                  |
| `PUT /api/v1/auth/password`              | `src/lib/api.js`, `src/app/profile/page.js`                  | Ganti password.                         |
| `GET /api/v1/developer/keys`             | `src/lib/api.js`, `src/app/dev/page.js`                      | List API key.                           |
| `POST /api/v1/developer/keys`            | `src/lib/api.js`, `src/app/dev/page.js`                      | Buat API key.                           |
| `DELETE /api/v1/developer/keys/:id`      | `src/lib/api.js`, `src/app/dev/page.js`                      | Revoke API key.                         |
| `GET /api/v1/notifications/settings`     | `src/lib/api.js`, `src/app/notifications/page.js`            | Ambil setting notifikasi.               |
| `PUT /api/v1/notifications/settings`     | `src/lib/api.js`, `src/app/notifications/page.js`            | Simpan setting notifikasi.              |
| `GET /api/v1/blog/posts?page=&size=`     | `src/lib/api.js`, `src/app/blog/page.js`, admin blog page    | Public blog index dan admin list.       |
| `GET /api/v1/blog/posts/:slug`           | `src/lib/api.js`, `src/app/blog/[slug]/page.js`              | Detail artikel.                         |
| `GET /api/v1/blog/categories`            | `src/lib/api.js`, `src/app/blog/page.js`, admin blog page    | Kategori blog.                          |
| `GET /api/v1/blog/tags`                  | `src/lib/api.js`, admin blog page                            | Tag blog.                               |
| `POST /api/v1/blog/posts`                | `src/lib/api.js`, `src/app/admin/blog/new/page.js`           | Admin create post.                      |
| `PUT /api/v1/blog/posts/:id`             | `src/lib/api.js`, `src/app/admin/blog/[id]/edit/page.js`     | Admin edit post.                        |
| `DELETE /api/v1/blog/posts/:id`          | `src/lib/api.js`, admin blog page                            | Admin delete post.                      |
| `POST /api/v1/blog/categories`           | `src/lib/api.js`, admin blog page                            | Admin create category.                  |
| `PUT /api/v1/blog/categories/:id`        | `src/lib/api.js`, admin blog page                            | Admin edit category.                    |
| `DELETE /api/v1/blog/categories/:id`     | `src/lib/api.js`, admin blog page                            | Admin delete category.                  |
| `POST /api/v1/blog/tags`                 | `src/lib/api.js`, admin blog page                            | Admin create tag.                       |
| `DELETE /api/v1/blog/tags/:id`           | `src/lib/api.js`, admin blog page                            | Admin delete tag.                       |
| `GET /api/v1/siroh/categories`           | `src/lib/api.js`, `src/app/siroh/page.js`, admin siroh page  | Public siroh categories dan admin list. |
| `GET /api/v1/siroh/contents?page=&size=` | `src/lib/api.js`, `src/app/siroh/page.js`, admin siroh page  | Public siroh contents dan admin list.   |
| `GET /api/v1/siroh/contents/:slug`       | `src/lib/api.js`, `src/app/siroh/[id]/page.js`               | Detail siroh.                           |
| `POST /api/v1/siroh/categories`          | `src/lib/api.js`, admin siroh page                           | Admin create category.                  |
| `PUT /api/v1/siroh/categories/:id`       | `src/lib/api.js`, admin siroh page                           | Admin edit category.                    |
| `DELETE /api/v1/siroh/categories/:id`    | `src/lib/api.js`, admin siroh page                           | Admin delete category.                  |
| `POST /api/v1/siroh/contents`            | `src/lib/api.js`, `src/app/admin/siroh/new/page.js`          | Admin create content.                   |
| `PUT /api/v1/siroh/contents/:id`         | `src/lib/api.js`, `src/app/admin/siroh/[id]/edit/page.js`    | Admin edit content.                     |
| `DELETE /api/v1/siroh/contents/:id`      | `src/lib/api.js`, admin siroh page                           | Admin delete content.                   |
| `GET /api/v1/share/ayah/:id`             | `src/lib/api.js`                                             | Share payload ayah.                     |
| `GET /api/v1/share/hadith/:id`           | `src/lib/api.js`                                             | Share payload hadith.                   |

## Ops Notes

- Kalau API service ingin menutup gap paling cepat, urutkan dari:
    1. Hadith stack
    2. Quran enrichment
    3. Content catalogs
    4. User persistence
    5. Admin/share/developer endpoints
- Endpoint yang hanya dipakai oleh empty state/fallback lokal bukan prioritas awal, tapi tetap harus ada jika fitur ingin dianggap penuh.
