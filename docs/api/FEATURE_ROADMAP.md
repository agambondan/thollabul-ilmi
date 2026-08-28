# Feature Roadmap — Thalabul Ilmi

Aplikasi Islamic knowledge untuk penuntut ilmu. API Service: Go/Fiber + PostgreSQL.

---

## Ringkasan Status Web App / API Service

Review singkat yang dipisah antara web app dan API service. Versi detailnya ada di [docs/roadmap-status.md](roadmap-status.md).
Catatan: web app dan API service dicatat terpisah supaya status UI tidak tercampur dengan implementasi API/API service.

| Area        | Status                | Ringkasan                                                                                                          |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Web App     | Belum ada di repo ini | Tidak ditemukan tree web app terpisah, jadi belum ada UI yang bisa ditandai selesai.                               |
| API Service | Hampir semua ter-wire | Route dan controller sudah ada untuk seluruh roadmap utama; `#14` sudah punya settings + scheduler reminder email. |

---

## Status Saat Ini (Done)

| Feature      | Endpoint                                     | Catatan                                    |
| ------------ | -------------------------------------------- | ------------------------------------------ |
| Al-Quran     | `/surah`, `/ayah`, `/juz`                    | Data 114 surah + 6.236 ayah (Arab, ID, EN) |
| Hadith       | `/books`, `/themes`, `/chapters`, `/hadiths` | Multi-kitab (Bukhari, Muslim, dll)         |
| Auth & Users | `/auth/*`, `/users`                          | Register, login JWT, me, update password   |

---

## Tier 1 — Prioritas Tinggi (Fondasi sudah siap)

### 1. Bookmark

Simpan ayah & hadith favorit per user.

**Model:**

```
Bookmark { ID, UserID, RefType (ayah|hadith), RefID, CreatedAt }
```

**Endpoint:**

- `POST /bookmarks` — tambah bookmark
- `GET /bookmarks` — list bookmark milik user (JWT)
- `DELETE /bookmarks/:id` — hapus bookmark (JWT)

**Dependency:** User ✅

---

### 2. Search

Full-text search lintas Quran dan Hadith.

**Endpoint:**

- `GET /search?q=&type=ayah|hadith|all&lang=id|ar|en`

**Teknis:** PostgreSQL `ILIKE` atau Full-Text Search (`tsvector`). Data sudah lengkap, tinggal query.

---

### 3. Reading Progress

Catat posisi baca terakhir per user per konten.

**Model:**

```
ReadingProgress {
  ID, UserID, ContentType (quran|hadith),
  SurahNumber, AyahNumber, BookSlug, HadithID, LastReadAt
}
```

**Endpoint:**

- `PUT /progress/quran` — update posisi quran (JWT)
- `GET /progress/quran` — ambil posisi terakhir (JWT)
- `PUT /progress/hadith` — update posisi hadith (JWT)
- `GET /progress/hadith` — ambil posisi terakhir (JWT)

---

### 4. Hafalan Tracker

Catat progress hafalan surah per user. Berbeda dari reading progress — ini untuk menandai surah yang sudah hafal.

**Model:**

```
HafalanProgress {
  ID, UserID, SurahID, Status (not_started|in_progress|memorized),
  StartedAt, CompletedAt
}
```

**Endpoint:**

- `PUT /hafalan/surah/:id` — update status hafalan (JWT)
- `GET /hafalan` — list semua surah + status hafalan user (JWT)
- `GET /hafalan/summary` — ringkasan (total hafal, in progress, dll) (JWT)

**Dependency:** User ✅, Surah ✅

---

### 5. Streak & Daily Habit

Hitung berapa hari berturut-turut user aktif membaca. Motivasi konsistensi.

**Model:**

```
UserActivity {
  ID, UserID, ActivityDate, Type (quran|hadith|doa), Count
}
```

**Logika:** Streak dihitung dari `UserActivity` — cek apakah kemarin juga ada aktivitas.

**Endpoint:**

- `POST /activity` — catat aktivitas harian (JWT, dipanggil otomatis dari reading progress)
- `GET /streak` — current streak + longest streak (JWT)

---

## Tier 2 — Nilai Tinggi (Butuh data tambahan)

### 6. Tafsir

Model `Tafsir` sudah ada di migration tapi belum ada service/controller/data.

**Endpoint:**

- `GET /tafsir/ayah/:id` — tafsir untuk satu ayah
- `GET /tafsir/surah/:number` — semua tafsir dalam surah

**Data:** Scrape dari sumber tafsir (Ibnu Katsir, Jalalayn, Al-Muyassar, dll).

---

### 7. Doa (Supplication)

Koleksi doa harian + doa situasional.

**Model:**

```
Doa {
  ID, Category (pagi|petang|makan|tidur|safar|...), Title,
  Arabic, Transliteration, Translation, Source
}
```

**Endpoint:**

- `GET /doa` — list semua doa
- `GET /doa/:id` — detail doa
- `GET /doa/category/:category` — filter by kategori

**Data:** Statis, seed dari file JSON.

---

### 8. Asmaul Husna

99 nama Allah beserta arti dan penjelasan.

**Model:**

```
AsmaUlHusna { ID, Number (1-99), Arabic, Transliteration, Indonesian, English, Meaning }
```

**Endpoint:**

- `GET /asmaul-husna` — semua 99 nama
- `GET /asmaul-husna/:number` — per nomor

**Data:** Statis, seed sekali.

---

### 9. Mufrodat / Kosakata Quran

Arti per kata dalam ayah. Berguna untuk belajar bahasa Arab dari Quran.

**Model:**

```
Mufrodat {
  ID, AyahID, WordIndex, Arabic, Transliteration,
  Indonesian, RootWord, PartOfSpeech
}
```

**Endpoint:**

- `GET /mufrodat/ayah/:id` — semua kata dalam satu ayah
- `GET /mufrodat/root/:word` — cari berdasarkan kata dasar

**Data:** Butuh scraping / dataset (e.g. Quranic Arabic Corpus).

---

### 10. Audio Murotal

Link audio recitation per ayah dan surah. Tidak perlu hosting sendiri, cukup simpan URL eksternal.

**Teknis:** Tambah field `audio_url` di model `Surah` dan `Ayah`, atau tabel `SurahAudio` untuk support multi-qari.

**Model:**

```
SurahAudio { ID, SurahID, QariName, QariSlug, AudioURL }
AyahAudio  { ID, AyahID,  QariName, QariSlug, AudioURL }
```

**Endpoint:**

- `GET /audio/surah/:number` — list audio surah by qari
- `GET /audio/ayah/:id` — audio ayah by qari

**Data:** URL dari sumber publik (e.g. everyayah.com, quran.com CDN).

---

### 11. Siroh Nabawiyah

Biografi Nabi Muhammad SAW dalam format bab-bab. Strukturnya identik dengan Hadith (Book → Chapter → Content).

**Teknis:** Bisa reuse model `Book` + `Chapter` + konten baru `SirohContent`, atau dedicated model.

**Endpoint:**

- `GET /siroh` — list bab siroh
- `GET /siroh/:id` — detail konten siroh

**Data:** Butuh scraping / konten manual.

---

### 12. Statistik Pribadi

Ringkasan aktivitas belajar user.

**Endpoint:**

- `GET /stats` — total ayah dibaca, total hadith dibaca, streak, hafalan summary (JWT)
- `GET /stats/weekly` — aktivitas per hari dalam 7 hari terakhir (JWT)

**Dependency:** Reading Progress ✅, Hafalan Tracker ✅, Streak ✅

---

### 13. Blog / Artikel

Konten editorial berupa artikel Islam — bisa ditulis oleh admin/penulis, dibaca publik. Cocok untuk tazkiyah, fiqh praktis, sirah ringkas, dll.

**Model:**

```
BlogPost {
  ID (UUID), AuthorID (UserID), CategoryID,
  Title, Slug (unique), Excerpt, Content (text/markdown),
  CoverImage, Status (draft|published|archived),
  PublishedAt, ViewCount, CreatedAt, UpdatedAt, DeletedAt
}

BlogCategory {
  ID, Name, Slug (unique), Description
}

BlogTag {
  ID, Name, Slug (unique)
}

BlogPostTag {
  PostID, TagID  (junction table)
}
```

**Endpoint (public):**

- `GET /blog/posts` — list artikel published (paginated, filter: category, tag, search)
- `GET /blog/posts/:slug` — detail artikel + increment view count
- `GET /blog/categories` — list semua kategori
- `GET /blog/categories/:slug/posts` — artikel per kategori
- `GET /blog/tags` — list semua tag
- `GET /blog/tags/:slug/posts` — artikel per tag

**Endpoint (protected — admin/author role):**

- `POST /blog/posts` — buat artikel baru (JWT)
- `PUT /blog/posts/:id` — update artikel (JWT, hanya author atau admin)
- `DELETE /blog/posts/:id` — hapus artikel (JWT)
- `POST /blog/categories` — buat kategori (JWT)
- `PUT /blog/categories/:id` — update kategori (JWT)
- `DELETE /blog/categories/:id` — hapus kategori (JWT)

**Fitur tambahan:**

- Related posts — tampilkan artikel dengan kategori/tag sama
- Popular posts — urutkan berdasarkan `view_count`
- Draft preview — author bisa lihat draft sebelum publish

**Teknis:**

- Content disimpan sebagai Markdown, parsing di web app
- Slug di-generate otomatis dari title (dengan suffix jika duplikat)
- `AuthorID` menggunakan `User.ID` yang sudah ada
- Status `published` dengan `PublishedAt` timestamp (bisa schedule post)

---

### 14. Notifikasi / Reminder

Jadwal pengingat baca harian.

**Model:**

```
NotificationSetting {
  ID, UserID, Type (daily_quran|daily_hadith|doa),
  Time (HH:MM), IsActive, CreatedAt
}
```

**Endpoint:**

- `PUT /notifications/settings` — atur jadwal reminder (JWT)
- `GET /notifications/settings` — ambil setting (JWT)

**Teknis:** Butuh job scheduler (cron) + push notification service (FCM) atau email.

---

## Tier 1 Tambahan — Fondasi Sudah Siap

### 21. Tilawah Tracker

Catat berapa halaman/juz yang dibaca hari ini, berbeda dari reading progress (yang catat posisi terakhir). Dipakai untuk target khatam dan progress bar.

**Model:**

```
TilawahLog {
  ID, UserID, Date, PagesRead, JuzRead, Note, CreatedAt
}
```

**Endpoint:**

- `POST /tilawah` — tambah log tilawah hari ini (JWT)
- `GET /tilawah` — riwayat tilawah (JWT, dengan filter date range)
- `GET /tilawah/summary` — total halaman, estimasi khatam, rata-rata per hari (JWT)

**Dependency:** User ✅, UserActivity ✅ (bisa reuse streak logic)

---

### 22. Amalan Harian Checklist

Checklist amalan sunnah harian — tahajud, dhuha, puasa Senin-Kamis, dll. Terintegrasi ke streak system.

**Model:**

```
AmalanItem  { ID, Name, Description, Category (sholat|puasa|dzikir|sedekah) }
AmalanLog   { ID, UserID, AmalanItemID, Date, IsDone }
```

**Endpoint:**

- `GET /amalan` — list semua item amalan
- `PUT /amalan/:id/check` — centang/uncentang amalan hari ini (JWT)
- `GET /amalan/today` — status amalan user hari ini (JWT)
- `GET /amalan/history` — riwayat amalan per hari (JWT)

**Dependency:** User ✅, Streak ✅

---

### 23. Preferred Language per User

Simpan preferensi bahasa di profil user. API bisa otomatis filter terjemahan sesuai bahasa yang dipilih.

**Model:** Tambah field `PreferredLang string` (default: `idn`) ke `User`.

**Endpoint:**

- `PUT /users/:id` — sudah ada, tambah field `preferred_lang` ke request body (JWT)

**Catatan:** Web App/mobile cukup set header `Accept-Language` atau query param `?lang=idn|en|ar`.

---

## Tier 2 Tambahan — Butuh Data Tambahan

### 24. Kalender Hijriah

Konversi tanggal Masehi ↔ Hijriah dan daftar hari penting Islam.

**Model:**

```
IslamicEvent { ID, Name, HijriMonth, HijriDay, Description, Category (puasa|eid|peristiwa) }
```

**Endpoint:**

- `GET /hijri?date=2024-03-15` — konversi ke Hijriah
- `GET /hijri/today` — tanggal Hijriah hari ini
- `GET /hijri/events` — list hari penting Islam (Ramadan, Eid, Muharram, dll)
- `GET /hijri/events/:month` — event per bulan Hijriah

**Teknis:** Library kalkulasi Hijriah tersedia di Go (tidak perlu API eksternal untuk konversi dasar).

---

### 25. Asbabun Nuzul

Sebab turunnya ayah Al-Quran. Berguna untuk memahami konteks historis ayah.

**Model:**

```
AsbabunNuzul { ID, AyahID, Content, Source, CreatedAt }
```

**Endpoint:**

- `GET /asbabun-nuzul/ayah/:id` — sebab nuzul untuk satu ayah
- `GET /asbabun-nuzul/surah/:number` — semua asbabun nuzul dalam surah
- `POST /asbabun-nuzul` — tambah data (JWT, admin)

**Data:** Bisa di-seed dari teks digital kitab Asbabun Nuzul Al-Wahidi atau Al-Suyuti.

---

### 26. Dzikir & Wirid Collection

Koleksi dzikir pagi-petang, wirid harian, dan dzikir situasional. Strukturnya identik dengan Doa yang sudah ada.

**Model:**

```
Dzikir {
  ID, Category (pagi|petang|setelah_sholat|tidur|safar|dzikir_umum),
  Title, Arabic, Transliteration, Translation, Count (anjuran pengulangan), Fadhilah, Source
}
```

**Endpoint:**

- `GET /dzikir` — list semua dzikir
- `GET /dzikir/:id` — detail dzikir
- `GET /dzikir/category/:category` — filter by kategori

**Data:** Statis, seed dari Hisnul Muslim atau Al-Adzkar.

---

### 27. Leaderboard

Ranking hafalan dan streak di antara pengguna. Motivasi kompetitif yang sehat.

**Endpoint:**

- `GET /leaderboard/streak` — top streak (paginated, opsional anonymous)
- `GET /leaderboard/hafalan` — top total surah hafal
- `GET /leaderboard/me` — posisi rank user sendiri (JWT)

**Dependency:** Streak ✅, Hafalan ✅

**Catatan:** Data user di response cukup `username` + avatar, tanpa info sensitif.

---

### 28. Sharing Card Metadata

Endpoint khusus yang return data ayah/hadith dalam format siap render jadi gambar share (Instagram, WhatsApp). Tidak perlu image processing di API service.

**Endpoint:**

- `GET /share/ayah/:id` — return ayah lengkap + nama surah + nomor + terjemahan + font hints
- `GET /share/hadith/:id` — return hadith + nama kitab + nomor + terjemahan

**Teknis:** Response JSON biasa, web app/mobile yang generate gambarnya. API Service cukup pastikan data lengkap dan konsisten.

---

### 29. User Roles Granular

Saat ini hanya `user` dan `admin`. Tambahkan roles lebih spesifik untuk skalabilitas konten.

**Roles:**

- `user` — pembaca biasa
- `author` — bisa buat/edit artikel blog milik sendiri
- `editor` — bisa approve/edit konten siroh, tafsir, asbabun nuzul
- `admin` — full access

**Teknis:** Tambah enum `role` di `User`, update middleware JWT untuk cek role per endpoint yang membutuhkan.

---

## Tier 3 — Kompleks / Fase Berikutnya

### 15. Jadwal Sholat

Waktu sholat berdasarkan koordinat GPS.

- Integrasi API eksternal (e.g. aladhan.com) atau library kalkulasi astronomi
- Endpoint: `GET /prayer-times?lat=&lng=&date=`

---

### 16. Quiz / Flashcard

Gamifikasi hafalan ayah atau hadith.

- Model: `Quiz`, `QuizQuestion`, `UserQuizResult`
- Mode: pilihan ganda, tebak ayah, tebak hadith
- Butuh desain gamifikasi lebih matang

---

### 17. Notes & Annotation

Catatan pribadi per ayah / hadith.

- Model: `Note { UserID, RefType, RefID, Content, UpdatedAt }`
- Private by default, opsional bisa di-share

---

### 18. Kamus Islami

Glosarium istilah Islam (fiqh, aqidah, tazkiyah, dll). Berguna untuk pemula.

- Model: `IslamicTerm { ID, Term, Category, Definition, Example, Reference }`
- Endpoint: `GET /dictionary`, `GET /dictionary/:term`, `GET /dictionary/category/:cat`

---

### 19. Diskusi / Komentar

Diskusi per ayah atau hadith antar pengguna.

- Model: `Comment { UserID, RefType, RefID, Content, ParentID (reply) }`
- Butuh moderasi konten

---

### 20. Share to Feed

Share konten ke sesama pengguna app, seperti mini social feed.

- Model: `Post { UserID, RefType, RefID, Caption, Likes, CreatedAt }`
- Dependency: Diskusi ✅

---

## Tier 2 Lanjutan — Konten & Utilitas Islam

### 30. Zakat Calculator

Kalkulator zakat maal, zakat fitrah, dan zakat profesi. Tidak butuh data eksternal — murni kalkulasi berbasis nishab dan haul.

**Model:**

```
ZakatCalculation { Type (maal|fitrah|profesi), Amount, Nishab, HaulMonths, ZakatDue }
```

**Endpoint:**

- `POST /zakat/calculate` — hitung zakat berdasarkan tipe dan jumlah harta
- `GET /zakat/nishab` — nilai nishab terkini (bisa di-seed manual)

**Teknis:** Formula zakat sudah baku (2.5% maal jika ≥ nishab setelah haul). Data nishab emas/perak bisa di-update admin.

---

### 31. Prayer Tracker (Sholat 5 Waktu)

Catat apakah sholat 5 waktu dikerjakan hari ini. Berbeda dari amalan harian — ini khusus tracking sholat fardhu.

**Model:**

```
SholatLog { ID, UserID, Date, Shubuh, Dzuhur, Ashar, Maghrib, Isya, Score }
```

**Endpoint:**

- `PUT /sholat/today` — update status sholat hari ini (JWT)
- `GET /sholat/today` — status sholat hari ini (JWT)
- `GET /sholat/history` — riwayat mingguan/bulanan (JWT)
- `GET /sholat/stats` — persentase sholat tepat waktu (JWT)

**Dependency:** User ✅, UserActivity ✅ (bisa trigger streak)

---

### 32. Panduan Sholat Lengkap

Bacaan sholat lengkap dari takbiratul ihram sampai salam, dengan Arab, transliterasi, dan terjemahan. Termasuk doa setelah sholat.

**Model:**

```
SholatGuide { ID, StepOrder, StepName, Arabic, Transliteration, Translation, Notes, Category (fardhu|sunnah) }
```

**Endpoint:**

- `GET /panduan-sholat` — list semua langkah
- `GET /panduan-sholat/:step` — detail per langkah

**Data:** Statis, seed sekali dari referensi fiqh.

---

### 33. Muroja'ah Mode (Hafalan Review)

Mode latihan untuk mereview hafalan — user lihat terjemahan, harus ingat bunyi ayahnya.

**Model:** Menggunakan data `HafalanProgress` + `Ayah` yang sudah ada.

**Endpoint:**

- `GET /muroja'ah/session` — ambil ayah-ayah dari surah yang status-nya `memorized` untuk di-review (JWT)
- `POST /muroja'ah/result` — kirim hasil review per ayah (benar/salah) (JWT)
- `GET /muroja'ah/stats` — statistik akurasi muroja'ah (JWT)

**Model tambahan:**

```
Muroja'ahLog { ID, UserID, AyahID, IsCorrect, ReviewedAt }
```

---

### 34. Fiqh Ringkas

Panduan fiqh praktis dalam format FAQ — thaharah, sholat, puasa, zakat. Cocok untuk pemula.

**Model:**

```
FiqhCategory { ID, Name, Slug, Order }
FiqhItem { ID, CategoryID, Question, Answer, Source, Order }
```

**Endpoint:**

- `GET /fiqh` — list semua kategori fiqh
- `GET /fiqh/:slug` — list pertanyaan dalam kategori
- `GET /fiqh/:slug/:id` — detail jawaban fiqh
- `POST /fiqh` — tambah item (admin)

**Data:** Seed dari kitab fiqh ringkas (Fiqh Islam Wa Adillatuhu, Minhajul Muslim, dll).

---

### 35. Tahlil & Yasin Digital

Bacaan Yasin, Tahlil, dan Surat pilihan dalam format mushaf digital dengan navigasi per halaman.

**Model:**

```
TahlilCollection { ID, Name, Description, Order }
TahlilItem { ID, CollectionID, Arabic, Transliteration, Translation, Order }
```

**Endpoint:**

- `GET /tahlil` — list koleksi
- `GET /tahlil/:id` — detail bacaan per koleksi

**Data:** Statis, seed sekali.

---

### 36. Koleksi Ceramah & Kajian

Link ke ceramah/kajian Islam dari YouTube atau sumber eksternal. API Service hanya simpan metadata — tidak streaming sendiri.

**Model:**

```
Kajian {
  ID, Title, Ustadz, Category (aqidah|fiqh|tazkiyah|sirah|tafsir|hadith),
  Platform (youtube|podcast), URL, Duration, ThumbnailURL, PublishedAt
}
```

**Endpoint:**

- `GET /kajian` — list kajian (paginated, filter: category, ustadz)
- `GET /kajian/:id` — detail kajian
- `POST /kajian` — tambah kajian (admin)

---

### 37. Muhasabah Harian (Jurnal Refleksi)

Ruang catatan pribadi harian untuk refleksi dan muhasabah. Private per user.

**Model:**

```
Muhasabah { ID, UserID, Date, Content, Mood (baik|cukup|perlu_perbaikan), IsPrivate }
```

**Endpoint:**

- `POST /muhasabah` — tulis muhasabah hari ini (JWT)
- `GET /muhasabah` — riwayat muhasabah user (JWT)
- `GET /muhasabah/:id` — detail entry (JWT, hanya milik sendiri)
- `DELETE /muhasabah/:id` — hapus entry (JWT)

---

### 38. Target Hafalan & Belajar

Set target hafalan atau target baca hadith, dengan progress tracking otomatis.

**Model:**

```
StudyGoal {
  ID, UserID, Type (hafalan|tilawah|hadith),
  TargetValue, CurrentValue, Deadline, IsCompleted
}
```

**Endpoint:**

- `POST /goals` — buat target baru (JWT)
- `GET /goals` — list target aktif user (JWT)
- `PUT /goals/:id` — update target (JWT)
- `DELETE /goals/:id` — hapus target (JWT)

**Dependency:** HafalanProgress ✅, TilawahLog ✅ — progress otomatis di-sync dari data yang sudah ada.

---

### 39. Rekap & Laporan Bulanan

Laporan statistik aktivitas belajar user selama sebulan — ayah dibaca, hafalan baru, streak, dll.

**Endpoint:**

- `GET /stats/monthly?month=2024-03` — rekap per bulan (JWT)
- `GET /stats/yearly?year=2024` — rekap per tahun (JWT)

**Dependency:** TilawahLog ✅, HafalanProgress ✅, UserActivity ✅ — pure aggregation query.

---

### 40. Bacaan Sunnah & Wirid Khusus

Koleksi bacaan sunnah dalam konteks spesifik: sholat Jumat, hari Arafah, malam Qadar, dll.

**Model:** Extend `Dzikir` dengan field `occasion` (jumat|arafah|lailatul_qadar|ramadan|iedul_fitri|iedul_adha|dll).

**Endpoint:**

- `GET /wirid/occasion/:occasion` — bacaan untuk momen tertentu

---

## Tier 3 Lanjutan — Kompleks / Integrasi Eksternal

### 41. Kiblat Finder

Arah kiblat berdasarkan koordinat GPS user. Kalkulasi sudut kiblat terhadap Ka'bah.

**Endpoint:**

- `GET /kiblat?lat=&lng=` — return derajat arah kiblat dari koordinat

**Teknis:** Formula matematika Haversine, tidak butuh API eksternal.

---

### 42. Jadwal Sholat Berbasis Lokasi

Waktu sholat berdasarkan koordinat GPS dan metode kalkulasi (Kemenag, MWL, ISNA, dll).

**Endpoint:**

- `GET /sholat-times?lat=&lng=&date=&method=` — jadwal sholat per hari
- `GET /sholat-times/week?lat=&lng=&method=` — jadwal seminggu

**Teknis:** Library kalkulasi astronomi Go (tidak butuh API eksternal).

---

### 43. Jadwal Imsakiyah Ramadan

Jadwal imsak, sahur, buka puasa per kota selama bulan Ramadan.

**Endpoint:**

- `GET /imsakiyah?city=&year=&month=` — jadwal imsakiyah per kota/bulan

**Dependency:** Jadwal Sholat (#42) — imsak = subuh - 10 menit.

---

### 44. Islamic History Timeline

Garis waktu sejarah Islam — dari lahirnya Nabi ﷺ sampai era modern.

**Model:**

```
HistoryEvent {
  ID, Year (Hijri), YearMiladi, Title, Description,
  Category (nabi|khulafa|dinasti|ulama|peristiwa), IsSignificant
}
```

**Endpoint:**

- `GET /history` — timeline sejarah (paginated, filter: category, year range)
- `GET /history/:id` — detail event
- `POST /history` — tambah event (admin)

---

### 45. Manasik Haji & Umrah

Panduan langkah demi langkah ibadah haji dan umrah — dari niat ihram sampai tahlul.

**Model:**

```
ManasikStep { ID, Type (haji|umrah), StepOrder, Title, Description, Arabic, Notes, IsWajib }
```

**Endpoint:**

- `GET /manasik/haji` — list langkah haji
- `GET /manasik/umrah` — list langkah umrah
- `GET /manasik/:type/:step` — detail langkah

---

### 46. Quiz & Flashcard

Gamifikasi hafalan dan pengetahuan Islam — tebak ayah dari terjemahan, soal fiqh, dll.

**Model:**

```
Quiz { ID, Type (hafalan|fiqh|sirah|hadith), QuestionText, CorrectAnswer, Options (JSON) }
UserQuizResult { ID, UserID, QuizID, IsCorrect, AnsweredAt }
```

**Endpoint:**

- `GET /quiz/session?type=&count=` — ambil soal random (JWT)
- `POST /quiz/submit` — kirim jawaban batch (JWT)
- `GET /quiz/stats` — statistik quiz user (JWT)

---

### 47. Notes & Anotasi per Ayah/Hadith

Catatan pribadi yang bisa ditempel di ayah atau hadith tertentu. Private by default.

**Model:**

```
Note { ID, UserID, RefType (ayah|hadith), RefID, Content, UpdatedAt }
```

**Endpoint:**

- `POST /notes` — buat catatan (JWT)
- `GET /notes?ref_type=&ref_id=` — catatan user untuk konten tertentu (JWT)
- `PUT /notes/:id` — update (JWT)
- `DELETE /notes/:id` — hapus (JWT)

---

### 48. Kamus Istilah Islam

Glosarium istilah Islam — fiqh, aqidah, tasawuf, ulumul quran — berguna untuk pemula.

**Model:**

```
IslamicTerm { ID, Term, Category (fiqh|aqidah|tasawuf|ulumul_quran|lainnya), Definition, Example, Source }
```

**Endpoint:**

- `GET /dictionary` — list istilah (paginated, filter: category, search)
- `GET /dictionary/:term` — detail istilah
- `GET /dictionary/category/:cat` — per kategori
- `POST /dictionary` — tambah (admin)

---

### 49. Diskusi & Komentar per Konten

Forum diskusi ringan per ayah atau hadith — bisa saling reply.

**Model:**

```
Comment { ID (UUID), UserID, RefType, RefID, Content, ParentID (reply), LikeCount }
```

**Endpoint:**

- `GET /comments?ref_type=&ref_id=` — komentar untuk konten tertentu
- `POST /comments` — buat komentar (JWT)
- `DELETE /comments/:id` — hapus (JWT, hanya milik sendiri atau admin)

**Catatan:** Butuh moderasi konten (kata-kata tidak pantas).

---

### 50. Open API & Partner Integration

Expose API terbuka untuk aplikasi pihak ketiga — developer bisa query Quran, Hadith, dan konten Islamic lainnya.

**Endpoint:**

- `POST /developer/register` — daftar API key (JWT)
- `GET /developer/keys` — list API key milik user (JWT)
- `DELETE /developer/keys/:key` — revoke API key (JWT)

**Teknis:** Rate limiting per API key, header `X-API-Key`, tracking usage di `api_key_usage` table. Konten yang di-expose: Quran, Hadith, Doa, Asmaul Husna, Dzikir (read-only).

---

## Urutan Pengerjaan yang Disarankan

```
[Tier 1 — Original ✅]
Bookmark → Search → Reading Progress → Hafalan Tracker → Streak

[Tier 1 — Tambahan ✅]
Tilawah Tracker → Amalan Harian → Preferred Language

[Tier 2 — Original ✅]
Doa → Asmaul Husna → Audio Murotal → Tafsir → Siroh
→ Blog/Artikel → Statistik Pribadi → Dzikir → Leaderboard

[Tier 2 — Tambahan ✅]
Kalender Hijriah → Asbabun Nuzul → Sharing Card → User Roles

[Tier 2 — Lanjutan]
Zakat Calculator → Prayer Tracker → Panduan Sholat
→ Muroja'ah → Fiqh Ringkas → Tahlil/Yasin
→ Koleksi Kajian → Muhasabah → Target Belajar
→ Rekap Bulanan → Bacaan Sunnah

[Tier 3]
Kiblat Finder → Jadwal Sholat → Imsakiyah Ramadan
→ Islamic History → Manasik Haji/Umrah → Quiz/Flashcard
→ Notes & Anotasi → Kamus Islam → Diskusi → Open API

[Tidak Diprioritaskan]
Mufrodat (dataset besar) → Notifikasi (FCM) → Share to Feed
```
