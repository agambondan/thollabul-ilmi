# Audit Gap CRUD Admin untuk Data Dinamis

Status: `TODO`
Tanggal: `2026-09-07`

## Ringkasan

Beberapa fitur sudah memakai data dari backend/DB, tetapi belum semuanya punya
halaman CRUD di `/admin`. Audit ini memisahkan antara:

- data dinamis dengan admin UI sudah tersedia,
- data dinamis tanpa admin UI,
- data user-generated yang memang tidak perlu admin CRUD konten penuh.

Referensi utama:

- Admin navigation: `apps/web/src/app/admin/layout.js:42`
- API routes: `services/api/app/http/routes.go:251`
- Static seed awal: `services/api/data/static/`

## Sudah Ada Admin UI

| Fitur             | Admin route            |
| ----------------- | ---------------------- |
| Blog              | `/admin/blog`          |
| Library           | `/admin/library`       |
| Kajian            | `/admin/kajian`        |
| Siroh             | `/admin/siroh`         |
| Sejarah           | `/admin/sejarah`       |
| Asbabun Nuzul     | `/admin/asbabun-nuzul` |
| Reminder Carousel | `/admin/reminders`     |
| Modul Belajar     | `/admin/lessons`       |
| Fiqh              | `/admin/fiqh`          |
| Doa               | `/admin/doa`           |
| Dzikir            | `/admin/dzikir`        |
| Wirid             | `/admin/wirid`         |
| Asmaul Husna      | `/admin/asmaul-husna`  |
| Manasik           | `/admin/manasik`       |
| Kamus             | `/admin/kamus`         |
| Quiz              | `/admin/quiz`          |
| Users             | `/admin/users`         |
| Push Notification | `/admin/push`          |
| Laporan Koreksi   | `/admin/reports`       |
| Audit Log Dalil   | `/admin/audit-logs`    |

## Gap Prioritas

### P0 — Konten tampil ke user, DB-backed, belum ada write API/admin UI

| Fitur              | Seed/model                         | Endpoint publik              | Catatan                                                                                         |
| ------------------ | ---------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Panduan Sholat     | `sholat_guide.json`, `SholatGuide` | `GET /api/v1/panduan-sholat` | Belum ada create/update/delete. Kasus nyata: hapus/ubah materi niat harus lewat seed/DB manual. |
| Achievements       | `achievement.json`, `Achievement`  | `GET /api/v1/achievements`   | Badge/points tampil ke user, belum ada admin pengelolaan.                                       |
| Amalan master item | `amalan_item.json`, `AmalanItem`   | `GET /api/v1/amalan`         | User hanya toggle status. Item master belum bisa dikelola admin.                                |

### P1 — Write API sudah ada, admin UI belum ada

| Fitur                                      | Endpoint write                               | Catatan                                                                          |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Quran core: ayah/surah/juz                 | `/ayah`, `/surah`, `/juz`                    | Admin API ada. UI belum ada, tapi risiko edit tinggi karena data Quran sensitif. |
| Hadith core: books/themes/chapters/hadiths | `/books`, `/themes`, `/chapters`, `/hadiths` | Admin API ada. UI belum ada.                                                     |
| Ilmu Rijal: perawi                         | `/perawi`                                    | Admin API ada. Belum ada UI, padahal data sanad/perawi sering perlu koreksi.     |
| Jarh wa Ta'dil                             | `/jarh-tadil`                                | Admin API ada. Belum ada UI.                                                     |
| Sanad & mata sanad                         | `/sanad`, `/mata-sanad`                      | Admin API ada. Belum ada UI.                                                     |
| Takhrij                                    | `/takhrij`                                   | Admin API ada. Belum ada UI.                                                     |
| Hadith-Ayah cross-reference                | `/hadith-ayahs`                              | Admin API ada. Belum ada UI relasi.                                              |
| Munasabah                                  | `/munasabah`                                 | Admin API ada. Belum ada UI.                                                     |
| Tokoh Tarikh                               | `/tokoh-tarikh`                              | Create/delete API ada. Belum ada UI; update API juga belum terlihat.             |
| Peta Islam / Locations                     | `/locations`                                 | Create/delete API ada. Belum ada UI; update API juga belum terlihat.             |
| Audio Murotal                              | `/audio/surah`, `/audio/ayah`                | Admin API ada. Belum ada UI.                                                     |
| Notification Templates                     | `/notification-templates`                    | Admin API ada. Belum ada UI.                                                     |

### P2 — Data dinamis, tapi CRUD admin penuh belum tentu perlu

| Fitur                                                           | Alasan                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Feed, forum, comments, komunitas chat                           | User-generated. Lebih butuh moderation queue daripada CRUD konten biasa.       |
| Bookmarks, notes, goals, muhasabah, tilawah, hafalan, murojaah  | Data personal user. Admin CRUD bukan prioritas.                                |
| Dzikir log, sholat tracker, zakat/faraidh history, adzan sounds | Data personal/transaksional. Admin CRUD penuh berisiko.                        |
| Jadwal sholat, imsakiyah, kiblat, hijri                         | Data dihitung/service, bukan konten seed biasa.                                |
| Mufrodat, tafsir                                                | Perlu audit terpisah karena sumber/model tidak masuk daftar static seed utama. |

## Todo Implementasi

### Gelombang 1 — Dampak konten tinggi, diff kecil

- [x] Tambah CRUD API `panduan-sholat`.
- [x] Tambah halaman `/admin/panduan-sholat`.
- [x] Tambah link Panduan Sholat di grup Worship admin nav.
- [x] Pastikan field `arabic`, `transliteration`, `translation_text`, `description`, `source`, `notes`, `step` bisa diedit.
- [x] Tambah validasi step unik dan reorder sederhana.
- [x] Tambah audit log saat panduan sholat diubah.

### Gelombang 2 — Master data ringan

- [x] Tambah CRUD API/admin untuk `achievements`.
- [x] Tambah CRUD API/admin untuk master `amalan` item.
- [x] Tambah filter kategori/status aktif untuk amalan.

### Gelombang 3 — Hadith/Rijal editor

- [ ] Buat `/admin/perawi`.
- [ ] Buat `/admin/jarh-tadil`.
- [ ] Buat `/admin/sanad` dengan editor mata sanad.
- [ ] Buat `/admin/takhrij`.
- [ ] Buat UI relasi `hadith-ayahs`.
- [ ] Tambah guardrails data integrity untuk sanad/perawi.

### Gelombang 4 — Quran/Hadith core editor

- [ ] Evaluasi apakah Quran core perlu admin UI atau hanya correction workflow.
- [ ] Jika perlu, buat editor read-heavy dengan confirmation kuat untuk ayah/surah/juz.
- [ ] Buat editor books/themes/chapters/hadiths.
- [ ] Tambah diff preview sebelum menyimpan konten agama sensitif.

### Gelombang 5 — Konten pelengkap

- [ ] Tambah UI admin `munasabah`.
- [ ] Tambah UI admin `tokoh-tarikh`.
- [ ] Lengkapi update API untuk `tokoh-tarikh` bila belum ada.
- [ ] Tambah UI admin `locations`.
- [ ] Lengkapi update API untuk `locations` bila belum ada.
- [ ] Tambah UI admin `audio`.
- [ ] Tambah UI admin `notification-templates`.

## Catatan Keputusan

Prioritas pertama sebaiknya `panduan-sholat`, bukan bikin semua CRUD sekaligus.
Alasannya sudah ada kebutuhan nyata, payload kecil, dan risiko implementasi rendah.
