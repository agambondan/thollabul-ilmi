# Tholabul Ilmi — Mobile App Feature Reference

**Versi dokumen:** 2026-05-07 (diupdate setelah IA revamp)
**Tujuan:** Referensi lengkap fitur backend (API) dan frontend (web) sebagai acuan desain mobile app.
**Audiens:** Designer Mobile Apps, Product Manager, Engineer.

> Semua fitur di bawah ini sudah berjalan di API service (Go/Fiber) dan web app (Next.js).
> Mobile app dapat mengonsumsi API yang sama. Auth via JWT Bearer token.

---

## Status Implementasi Mobile Saat Ini

Artefak Expo berada di `apps/mobile`.

| Area              | Status mobile                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Navigasi inti** | **5 tab final:** Beranda (`home`), Quran (`quran`), Hadis (`hadith`), Ibadah (`ibadah`), Belajar (`belajar`). Profil bukan tab — diakses via avatar Beranda atau header Belajar.                                                      |
| Auth personal     | Session JWT via SecureStore native, fallback AsyncStorage untuk web smoke.                                                                                                                                                            |
| Quran             | Surah list, reader ayah, navigator page/hizb, hafalan, murojaah, progress, bookmark, notes. Tafsir/asbab/settings via **modal popup** (bukan inline). Font selector Indopak/Utsmani/Naskh. Display mode Normal/Clean. Tajweed legend. |
| Hadis             | List/detail, filter kitab horizontal, tab Teks/Sanad/Perawi/Takhrij/Catatan, jarh-ta'dil, related hadith, bookmark, notes. Deep link `hadith/:id` tetap.                                                                              |
| Ibadah hub        | Hub dengan section Harian, Arah & Waktu, Dzikir & Bacaan, Alat, Rencana. Jadwal Sholat dan Qibla berjalan sebagai sub-view internal Ibadah. Fitur lain deep-link ke Belajar.                                                          |
| Prayer            | Lokasi native, method/madhhab, koreksi manual, log shalat, local adzan reminder, cache SQLite 30 hari. Sub-view Settings internal.                                                                                                    |
| Qibla             | Arah/distance, compass heading native dengan fallback web. Rotating dial ring, marker Ka'bah, lokasi manual jika GPS ditolak.                                                                                                         |
| Belajar hub       | Katalog grouped: Kajian & Artikel, Siroh & Sejarah, Fiqh & Panduan, Referensi, Evaluasi, Personal Ringkas. Feature detail via **modal popup** (bukan inline). Search catalog. Pin/unpin fitur.                                        |
| Beranda           | Dashboard: prayer card, shortcut grid, contextual shortcuts (dzikir waktu/qibla/tafsir), pinned, terakhir dibuka, muhasabah, bacaan harian.                                                                                           |
| Profil            | Summary, stats (poin/streak/tilawah/hafalan/sholat), badges, settings stack (Akun/Notif/Penyimpanan/Tampilan/Keamanan).                                                                                                               |
| Offline           | SQLite pack untuk Quran, Hadith, Doa/Dzikir/Wirid, bookmark snapshot, jadwal shalat 30 hari.                                                                                                                                   |
| Deep link         | Scheme `thullaabulilmi://` + hash `#/`. Alias: `prayer`→`ibadah`, `explore`→`belajar`, `qibla`→`ibadah/qibla`. Tambahan: `hadith/:id`, `quran/surah/:number`.                                                                         |
| Notifikasi        | Notification Center di Profile > Notifikasi. Settings pengingat, inbox, mark read, registrasi Expo push token, dan backend dispatch push untuk reminder harian.                                                                       |
| Discovery         | Pinned shortcuts (max 4), recently opened (max 3) di Beranda. Catalog search di Belajar. Contextual shortcuts berbasis waktu & aktivitas.                                                                                             |

---

## Daftar Isi

1. [Autentikasi & Akun](#1-autentikasi--akun)
2. [Al-Quran](#2-al-quran)
3. [Hadith](#3-hadith)
4. [Doa & Dzikir & Wirid](#4-doa--dzikir--wirid)
5. [Tafsir & Asbabun Nuzul](#5-tafsir--asbabun-nuzul)
6. [Asmaul Husna](#6-asmaul-husna)
7. [Siroh Nabawiyah](#7-siroh-nabawiyah)
8. [Sejarah Islam](#8-sejarah-islam)
9. [Fiqh Ringkas](#9-fiqh-ringkas)
10. [Manasik Haji & Umrah](#10-manasik-haji--umrah)
11. [Kajian / Ceramah](#11-kajian--ceramah)
12. [Blog & Artikel Islam](#12-blog--artikel-islam)
13. [Ibadah Tracker](#13-ibadah-tracker)
14. [Hafalan & Murojaah](#14-hafalan--murojaah)
15. [Tilawah Tracker](#15-tilawah-tracker)
16. [Khatam Tracker](#16-khatam-tracker)
17. [Streak & Aktivitas Harian](#17-streak--aktivitas-harian)
18. [Amalan Harian Checklist](#18-amalan-harian-checklist)
19. [Muhasabah Harian](#19-muhasabah-harian)
20. [Goals / Target Belajar](#20-goals--target-belajar)
21. [Bookmark](#21-bookmark)
22. [Catatan / Notes](#22-catatan--notes)
23. [Reading Progress](#23-reading-progress)
24. [Jadwal Sholat](#24-jadwal-sholat)
25. [Imsakiyah Ramadan](#25-imsakiyah-ramadan)
26. [Panduan Sholat Lengkap](#26-panduan-sholat-lengkap)
27. [Kalender Hijriah](#27-kalender-hijriah)
28. [Kiblat Finder](#28-kiblat-finder)
29. [Kalkulator Zakat](#29-kalkulator-zakat)
30. [Kalkulator Waris (Faraidh)](#30-kalkulator-waris-faraidh)
31. [Kamus Islami](#31-kamus-islami)
32. [Quiz Islami](#32-quiz-islami)
33. [Tasbih Digital](#33-tasbih-digital)
34. [Wirid Kustom](#34-wirid-kustom)
35. [Perawi & Ilmu Hadith](#35-perawi--ilmu-hadith)
36. [Statistik & Laporan](#36-statistik--laporan)
37. [Leaderboard](#37-leaderboard)
38. [Pencapaian (Achievement)](#38-pencapaian-achievement)
39. [Notifikasi Inbox](#39-notifikasi-inbox)
40. [Pengaturan Notifikasi](#40-pengaturan-notifikasi)
41. [Search Global](#41-search-global)
42. [Feed / Social](#42-feed--social)
43. [Komentar](#43-komentar)
44. [Profil & Pengaturan Akun](#44-profil--pengaturan-akun)
45. [Open API / Partner](#45-open-api--partner)

---

## 1. Autentikasi & Akun

**Deskripsi:** Registrasi, login, dan manajemen akun. Semua fitur personal membutuhkan login.

**Layar yang dibutuhkan:**

- Splash / onboarding
- Registrasi (nama, email, password)
- Login (email + password)
- Lupa password (email → reset link)
- Reset password (form baru)

**Data user:**
| Field | Keterangan |
|---|---|
| name | Nama lengkap |
| email | Unik, untuk login |
| role | `user`, `author`, `editor`, `admin` |
| preferred_lang | `ID` atau `EN` |
| avatar | URL foto profil (opsional) |

**API:**

```
POST /auth/register
POST /auth/login          → JWT token
POST /auth/refresh        → refresh token
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
PUT  /auth/me             → update nama, bahasa
PUT  /auth/password       → ganti password
```

---

## 2. Al-Quran

**Deskripsi:** Baca dan jelajahi Al-Quran. 114 surah, 6.236 ayah. Tersedia teks Arab, translasi Indonesia & Inggris.

**Layar yang dibutuhkan:**

- Daftar surah (nama, nomor, jumlah ayah, arti, jenis makiyah/madaniyah)
- Detail surah → daftar ayah dengan teks Arab + terjemahan
- Detail ayah → teks Arab, transliterasi, terjemahan ID/EN, asbabun nuzul, tafsir, mufrodat
- Navigasi per Juz (30 juz)
- Navigasi per Halaman Mushaf (1-604 halaman)
- Navigasi per Hizb (1-240 hizb)
- Audio murotal per ayah dan per surah (jika ada URL audio)
- Mufrodat / kosakata per ayah (untuk belajar bahasa Arab)
- Asbabun nuzul per surah / per ayah

**Data ayah:**
| Field | Keterangan |
|---|---|
| number | Nomor ayah dalam surah |
| text / translation.ar | Teks Arab |
| translation.idn | Terjemahan Indonesia |
| translation.en | Terjemahan Inggris |
| surah.number | Nomor surah |
| surah.name | Nama surah (Arab) |
| page | Nomor halaman mushaf |
| hizb_quarter | Nomor hizb |

**API:**

```
GET /surah                    → list 114 surah
GET /surah/:id
GET /surah/number/:number
GET /surah/name/:name
GET /ayah                     → semua ayah (paginated)
GET /ayah/:id
GET /ayah/surah/number/:number → semua ayah dalam surah
GET /ayah/page/:page          → ayah di halaman mushaf 1-604
GET /ayah/hizb/:hizb          → ayah di hizb 1-240
GET /juz                      → 30 juz
GET /juz/surah/:name
GET /mufrodat/ayah/:id        → kosakata per ayah
GET /mufrodat/root/:word      → cari kata dasar
GET /audio/surah/:surahId     → audio surah by qari
GET /audio/ayah/:ayahId       → audio ayah by qari
GET /asbabun-nuzul/ayah/:id
GET /asbabun-nuzul/surah/:number
GET /tafsir/ayah/:id
GET /tafsir/surah/:number
GET /share/ayah/:id           → payload share kartu ayah
PUT /progress/quran           → simpan posisi baca terakhir (JWT)
GET /progress/quran           → ambil posisi terakhir (JWT)
```

---

## 3. Hadith

**Deskripsi:** Koleksi multi-kitab hadith (Bukhari, Muslim, Abu Dawud, dll). Dapat dijelajahi per kitab, tema, bab, atau langsung ke hadith.

**Layar yang dibutuhkan:**

- Daftar kitab hadith
- Daftar tema (lintas kitab)
- Daftar bab per kitab / per tema
- List hadith per bab / per tema / per kitab
- Detail hadith (teks Arab, terjemahan, nomor, sanad, takhrij)
- Hadith harian (widget)
- Sanad viewer (rantai perawi)

**Data hadith:**
| Field | Keterangan |
|---|---|
| number | Nomor hadith |
| arabic | Teks Arab |
| translation.idn / .en | Terjemahan |
| book.slug | Slug kitab |
| theme.slug | Slug tema |
| chapter | Bab |
| narrator | Perawi |

**API:**

```
GET /books                                → daftar kitab
GET /books/:id
GET /books/slug/:slug
GET /themes                               → daftar tema lintas kitab
GET /themes/book/:slug
GET /chapters                             → daftar bab
GET /chapters/book/:slug/theme/:themeId
GET /chapters/theme/:id
GET /hadiths                              → semua (paginated)
GET /hadiths/daily                        → hadith harian
GET /hadiths/:id
GET /hadiths/book/:slug
GET /hadiths/theme/:themeId
GET /hadiths/theme/slug/:slug
GET /hadiths/chapter/:id
GET /hadiths/:id/sanad                    → rantai sanad
GET /hadiths/:id/takhrij
GET /share/hadith/:id                     → payload share kartu hadith
PUT /progress/hadith                      → posisi baca (JWT)
GET /progress/hadith
GET /progress                             → posisi Quran + Hadith sekaligus
```

---

## 4. Doa & Dzikir & Wirid

**Deskripsi:** Koleksi doa situasional, dzikir pagi/petang, wirid harian.

**Layar yang dibutuhkan:**

- Daftar doa (filter per kategori: pagi, petang, makan, tidur, safar, dll)
- Detail doa (Arab, transliterasi, terjemahan, sumber)
- Daftar dzikir per kategori / per kesempatan (`occasion`)
- Detail dzikir (Arab, transliterasi, terjemahan, jumlah bacaan, audio jika ada)
- Tombol audio play/pause pada dzikir (jika ada audio_url)

**Kategori doa:** pagi, petang, makan, tidur, safar, masuk masjid, keluar masjid, dll.
**Occasion dzikir:** pagi, petang, sesudah sholat, dll.

**API:**

```
GET /doa                        → semua doa
GET /doa/category/:category
GET /doa/:id

GET /dzikir                     → semua dzikir
GET /dzikir/category/:category
GET /dzikir/:id
POST /dzikir/log                → catat dzikir selesai dibaca (JWT)
GET /dzikir/log/today
DELETE /dzikir/log/:id

GET /wirid/occasion/:occasion   → wirid per kesempatan (pagi/petang/dll)
```

---

## 5. Tafsir & Asbabun Nuzul

**Deskripsi:** Penjelasan ayah Al-Quran dan sebab-sebab turunnya wahyu.

**Layar yang dibutuhkan:**

- Panel tafsir pada detail ayah (collapsed → expanded)
- Panel asbabun nuzul pada detail ayah / surah
- Halaman tafsir surah lengkap

**API:**

```
GET /tafsir/ayah/:id
GET /tafsir/surah/:number
GET /asbabun-nuzul/ayah/:id
GET /asbabun-nuzul/surah/:number
```

---

## 6. Asmaul Husna

**Deskripsi:** 99 nama-nama Allah beserta arti, penjelasan, dan audio (jika ada).

**Layar yang dibutuhkan:**

- Grid / list 99 nama (nomor, Arab, transliterasi, arti singkat)
- Detail nama (penjelasan panjang, ayah terkait, audio)
- Mode flashcard (bolak-balik: tampilkan Arab → tebak artinya → ungkap)
- Kontrol audio play/pause

**Data per nama:**
| Field | Keterangan |
|---|---|
| number | 1–99 |
| arabic | Nama dalam Arab |
| transliteration | Latin |
| indonesian | Arti Indonesia |
| english | Arti Inggris |
| description / meaning | Penjelasan |
| audio_url | URL audio (opsional) |

**API:**

```
GET /asmaul-husna            → 99 nama
GET /asmaul-husna/:number    → detail per nomor
```

---

## 7. Siroh Nabawiyah

**Deskripsi:** Kisah perjalanan hidup Nabi Muhammad SAW, terstruktur per kategori/periode.

**Layar yang dibutuhkan:**

- Daftar kategori siroh (Kelahiran, Masa Kecil, Kenabian, Hijrah, dll)
- List konten per kategori
- Detail konten (teks, sumber)

**API:**

```
GET /siroh/categories
GET /siroh/categories/:slug   → detail kategori + konten
GET /siroh/contents
GET /siroh/contents/:slug
```

---

## 8. Sejarah Islam

**Deskripsi:** Timeline sejarah Islam dari masa Nabi hingga era modern.

**Layar yang dibutuhkan:**

- Timeline horizontal / vertikal (per era / abad)
- Detail peristiwa (judul, tanggal Hijriah/Masehi, deskripsi, gambar opsional)
- Filter per era atau topik

**API:**

```
GET /history           → semua peristiwa
GET /history/:slug     → detail peristiwa
```

---

## 9. Fiqh Ringkas

**Deskripsi:** Penjelasan hukum fiqh dasar terstruktur per kategori (thaharah, sholat, zakat, puasa, dll).

**Layar yang dibutuhkan:**

- Daftar kategori fiqh
- List item per kategori
- Detail item (dalil, penjelasan)

**API:**

```
GET /fiqh                   → semua fiqh
GET /fiqh/categories        → daftar kategori
GET /fiqh/categories/:slug
GET /fiqh/:slug             → item per kategori slug
GET /fiqh/item/:slug        → detail item
```

---

## 10. Manasik Haji & Umrah

**Deskripsi:** Panduan langkah demi langkah pelaksanaan ibadah haji dan umrah.

**Layar yang dibutuhkan:**

- Pilihan mode: Haji / Umrah
- Step-by-step panduan (urutan, nama ritual, deskripsi, gambar opsional)
- Navigasi prev / next antar langkah

**API:**

```
GET /manasik/:type          → type: haji | umrah
GET /manasik/:type/:step    → detail satu langkah
```

---

## 11. Kajian / Ceramah

**Deskripsi:** Koleksi materi kajian dan ceramah Islam (judul, ustadz, kategori, durasi, sumber video/audio).

**Layar yang dibutuhkan:**

- Daftar kajian (filter kategori, ustadz, durasi)
- Kartu kajian (thumbnail, judul, nama ustadz, durasi)
- Detail kajian (deskripsi, embed/link video, tags)

**Data kajian:**
| Field | Keterangan |
|---|---|
| title | Judul kajian |
| ustadz | Nama pemateri |
| category | Kategori topik |
| duration | Durasi (menit) |
| source_url | Link video/audio |
| description | Deskripsi konten |

**API:**

```
GET /kajian        → list kajian
GET /kajian/:id    → detail kajian
```

---

## 12. Blog & Artikel Islam

**Deskripsi:** Artikel keislaman yang ditulis oleh tim editor / kontributor.

**Layar yang dibutuhkan:**

- Daftar artikel (thumbnail, judul, ringkasan, tanggal, kategori, tag)
- Detail artikel (konten lengkap, penulis, tanggal, kategori)
- Filter/browse per kategori dan tag
- Tombol bookmark artikel (untuk user login)
- Artikel terkait (related posts)
- Artikel populer

**API:**

```
GET /blog/posts                    → list artikel published
GET /blog/posts/:slug              → detail artikel
GET /blog/posts/popular            → artikel terpopuler
GET /blog/posts/:slug/related      → artikel terkait
GET /blog/categories               → daftar kategori
GET /blog/categories/:slug/posts   → artikel per kategori
GET /blog/tags                     → daftar tag
GET /blog/tags/:slug/posts         → artikel per tag
```

---

## 13. Ibadah Tracker

### Sholat 5 Waktu Harian

**Deskripsi:** Centang sholat yang sudah dikerjakan hari ini. Pantau 7 hari terakhir.

**Layar yang dibutuhkan:**

- 5 tombol sholat (Shubuh, Dzuhur, Ashar, Maghrib, Isya) dengan status centang
- Bar chart / heatmap 7 hari terakhir
- Statistik (rata-rata per minggu, % konsistensi)

**API:**

```
PUT /sholat/today      → update status sholat hari ini (JWT)
GET /sholat/today      → status sholat hari ini
GET /sholat/history    → 7 hari terakhir
GET /sholat/stats      → statistik sholat
```

---

## 14. Hafalan & Murojaah

### Hafalan Tracker

**Deskripsi:** Pantau progress hafalan per surah. Status: belum / sedang / hafal.

**Layar yang dibutuhkan:**

- Tabel 114 surah dengan status hafalan
- Filter: semua / hafal / sedang / belum
- Summary stats (total hafal, sedang, belum)
- Tap surah → ubah status

**API:**

```
PUT /hafalan/surah/:surahId   → update status (JWT)
GET /hafalan                  → list 114 surah + status user (JWT)
GET /hafalan/summary          → total hafal, sedang, belum (JWT)
```

### Murojaah

**Deskripsi:** Mode latihan mengulang hafalan. System memilih surah dari daftar yang sudah hafal.

**Layar yang dibutuhkan:**

- Tampilkan surah yang perlu diulang (dari hafalan user)
- Centang "sudah diulang hari ini" per surah
- Riwayat murojaah
- Statistik konsistensi murojaah

**API:**

```
GET /murojaah/session    → surah yang perlu diulang
POST /murojaah/result    → simpan hasil murojaah (JWT)
GET /murojaah/history
GET /murojaah/stats
```

---

## 15. Tilawah Tracker

**Deskripsi:** Catat sesi tilawah harian (surah, ayah dari-ke, jumlah halaman, catatan).

**Layar yang dibutuhkan:**

- Form input tilawah (surah, ayah mulai, ayah selesai, jumlah halaman, catatan)
- List riwayat tilawah per tanggal
- Ringkasan: sesi minggu ini vs bulan ini

**Data log tilawah:**
| Field | Keterangan |
|---|---|
| surah | Nama/nomor surah |
| ayah_from | Ayah mulai |
| ayah_to | Ayah selesai |
| pages | Jumlah halaman |
| notes | Catatan opsional |
| date | Tanggal sesi |

**API:**

```
POST /tilawah          → catat sesi (JWT)
GET  /tilawah          → list sesi (JWT)
GET  /tilawah/summary  → ringkasan (JWT)
DELETE /tilawah/:id
```

---

## 16. Khatam Tracker

**Deskripsi:** Pantau progress khatam Al-Quran dari awal hingga selesai. Support target khatam dengan deadline.

**Layar yang dibutuhkan:**

- Setup target (tanggal mulai, tanggal target selesai)
- Progress bar khatam (total ayah: 6.236)
- Progress per juz (30 juz)
- Kalkulasi: berapa ayah/hari yang dibutuhkan
- Tandai surah sudah dibaca
- Widget: ayah per hari yang direkomendasikan

**API:** Menggunakan `progress/quran` + data lokal untuk kalkulasi target.

---

## 17. Streak & Aktivitas Harian

**Deskripsi:** Hitung berapa hari berturut-turut user aktif. Motivasi konsistensi ibadah dan belajar.

**Layar yang dibutuhkan:**

- Badge streak (contoh: "🔥 7 hari") di profil / dashboard
- Kalender aktivitas (GitHub-style heatmap per bulan)
- Streak terpanjang vs streak saat ini
- Mini chart aktivitas 7 hari

**API:**

```
POST /activity           → catat aktivitas (dipanggil otomatis)
GET  /streak             → streak saat ini + terpanjang (JWT)
GET  /streak/weekly      → aktivitas per hari dalam seminggu
```

---

## 18. Amalan Harian Checklist

**Deskripsi:** Checklist amalan sunnah harian (puasa sunnah, sholat sunnah, dll). Reset setiap hari.

**Layar yang dibutuhkan:**

- List amalan hari ini (dengan checkbox)
- Riwayat amalan (per tanggal)
- Badge "hari ini sempurna" jika semua amalan dicentang

**API:**

```
GET /amalan              → list amalan hari ini + status
GET /amalan/today        → hanya amalan hari ini
PUT /amalan/:id/check    → centang/uncentang (JWT)
GET /amalan/history      → riwayat per tanggal
```

---

## 19. Muhasabah Harian

**Deskripsi:** Jurnal refleksi diri harian. Catat mood, isi refleksi, dan evaluasi hari.

**Layar yang dibutuhkan:**

- Form tulis muhasabah (tanggal, mood picker: 😊😐😢🤲, teks refleksi)
- List jurnal lalu (diurutkan terbaru)
- Detail entry per tanggal
- Edit / hapus entry

**Mood options:** Baik 😊 / Biasa 😐 / Berat 😢 / Syukur 🤲

**API:**

```
POST   /muhasabah         → buat entry (JWT)
GET    /muhasabah         → list semua entry (JWT)
GET    /muhasabah/:id     → detail (JWT)
PUT    /muhasabah/:id     → edit (JWT)
DELETE /muhasabah/:id     → hapus (JWT)
```

---

## 20. Goals / Target Belajar

**Deskripsi:** Buat dan pantau target belajar Islam (menghafal surah tertentu, menyelesaikan buku hadith, dll).

**Layar yang dibutuhkan:**

- Daftar goals (aktif / selesai)
- Form buat goal (judul, deskripsi, deadline)
- Centang goal sebagai selesai
- Progress bar per goal (jika ada target kuantitatif)

**API:**

```
POST   /goals         → buat goal (JWT)
GET    /goals         → list goals (JWT)
PUT    /goals/:id     → update / tandai selesai (JWT)
DELETE /goals/:id
```

---

## 21. Bookmark

**Deskripsi:** Simpan ayah, hadith, dan artikel favorit untuk dibaca nanti.

**Layar yang dibutuhkan:**

- Tombol bookmark 🔖 pada detail ayah, hadith, artikel
- Halaman bookmark (filter per tipe: quran / hadith / article)
- Tap bookmark → buka konten asli
- Hapus bookmark (swipe / long press)

**Tipe bookmark:** `ayah` | `hadith` | `article`

**API:**

```
POST   /bookmarks          → tambah bookmark (JWT)
GET    /bookmarks          → list bookmark user (JWT)
PUT    /bookmarks/:id      → update label/warna (JWT)
DELETE /bookmarks/:id      → hapus (JWT)
```

---

## 22. Catatan / Notes

**Deskripsi:** Catatan pribadi user. Bisa dikaitkan ke konten (ayah, hadith) atau catatan bebas.

**Layar yang dibutuhkan:**

- Daftar catatan (judul, preview isi, tags, tanggal)
- Form buat/edit catatan (judul, isi, tags)
- Filter/search catatan
- Aksi catatan cepat: tombol 📝 pada detail ayah/hadith

**API:**

```
GET    /notes           → list catatan user (JWT)
POST   /notes           → buat catatan (JWT)
PUT    /notes/:id       → edit (JWT)
DELETE /notes/:id       → hapus (JWT)
```

---

## 23. Reading Progress

**Deskripsi:** Sinkronisasi posisi baca terakhir Quran dan Hadith lintas perangkat.

**Layar yang dibutuhkan:**

- "Lanjutkan membaca" card di dashboard (menampilkan surah+ayah atau kitab+hadith terakhir)
- Otomatis update saat user membaca

**API:**

```
PUT /progress/quran          → simpan posisi (JWT)
GET /progress/quran          → ambil posisi terakhir (JWT)
PUT /progress/hadith
GET /progress/hadith
GET /progress                → semua progress sekaligus (JWT)
```

---

## 24. Jadwal Sholat

**Deskripsi:** Waktu sholat 5 waktu berdasarkan lokasi GPS user. Countdown ke waktu sholat berikutnya.

**Layar yang dibutuhkan:**

- Kartu countdown sholat berikutnya (nama sholat, sisa waktu)
- Tabel 5 waktu hari ini
- Jadwal seminggu ke depan
- Setting: izin lokasi, metode kalkulasi, mazhab

**API:**

```
GET /sholat-times          → jadwal hari ini (?lat=&lng=)
GET /sholat-times/week     → jadwal seminggu
```

---

## 25. Imsakiyah Ramadan

**Deskripsi:** Jadwal imsak, sahur, dan berbuka per hari selama Ramadan.

**Layar yang dibutuhkan:**

- Header bulan Ramadan aktif
- Tabel per tanggal (Imsak, Subuh, Syuruq, Dzuhur, Ashar, Maghrib, Isya)
- Highlight hari ini
- Countdown ke buka puasa / imsak

**API:**

```
GET /imsakiyah    → jadwal imsakiyah (?lat=&lng=&year=&month=)
```

---

## 26. Panduan Sholat Lengkap

**Deskripsi:** Step-by-step panduan tata cara sholat lengkap dengan bacaan (Arab, Latin, terjemahan).

**Layar yang dibutuhkan:**

- List langkah sholat (niat, takbiratul ihram, Al-Fatihah, ruku', i'tidal, sujud, dll)
- Detail langkah (Arab + transliterasi + terjemahan + gambar posisi opsional)
- Navigasi prev / next antar langkah
- Mode baca step-by-step (seperti tutorial)

**API:**

```
GET /panduan-sholat         → semua langkah
GET /panduan-sholat/:step   → detail satu langkah
```

---

## 27. Kalender Hijriah

**Deskripsi:** Konversi tanggal Masehi ↔ Hijriah. Daftar hari-hari penting Islam.

**Layar yang dibutuhkan:**

- Tampilkan tanggal Hijriah hari ini (Arab + Latin)
- Form konversi (Masehi → Hijriah)
- Kalender bulan Hijriah dengan highlight hari penting
- List hari penting Islam (Maulid, Isra Miraj, 1 Muharram, Ramadan, dll)

**API:**

```
GET /hijri/today         → tanggal Hijriah hari ini
GET /hijri/convert       → konversi (?date=YYYY-MM-DD)
GET /hijri/events        → semua hari penting Islam
GET /hijri/events/:month → hari penting per bulan Hijriah
```

---

## 28. Kiblat Finder

**Deskripsi:** Kompas digital untuk menemukan arah Ka'bah dari lokasi user.

**Layar yang dibutuhkan:**

- Kompas animasi yang berputar sesuai orientasi perangkat
- Panah hijau menunjuk ke arah kiblat
- Derajat arah kiblat (relatif ke Utara geografis)
- Status izin sensor kompas
- Fallback jika kompas tidak tersedia (tampilkan derajat saja)

**API:**

```
GET /kiblat    → hitung sudut kiblat (?lat=&lng=)
```

---

## 29. Kalkulator Zakat

**Deskripsi:** Hitung zakat maal, zakat fitrah, dan zakat profesi sesuai nisab terkini.

**Layar yang dibutuhkan:**

- Tab: Zakat Maal / Zakat Fitrah / Zakat Profesi
- Form input (total harta, hutang, dll)
- Hasil kalkulasi (wajib/tidak, jumlah zakat)
- Informasi nisab terkini (gram emas / harga)

**API:**

```
POST /zakat/maal     → hitung zakat maal
POST /zakat/fitrah   → hitung zakat fitrah
GET  /zakat/nishab   → nilai nisab terkini
```

---

## 30. Kalkulator Waris (Faraidh)

**Deskripsi:** Kalkulator pembagian harta warisan sesuai hukum Islam (Ashabul Furudh + Ashabah). Termasuk aul dan radd.

**Layar yang dibutuhkan:**

- Input total harta, hutang, biaya pemakaman, wasiat
- Input jumlah ahli waris per jenis (suami/istri, anak L/P, ayah, ibu, dll)
- Tabel hasil pembagian (nama ahli waris, pecahan, persentase, nominal)
- Indikator aul / radd (jika berlaku)
- Disclaimer konsultasi ulama
- **Simpan kalkulasi** → riwayat perhitungan (localStorage)
- Tampilkan riwayat perhitungan sebelumnya

> Fitur ini sepenuhnya di frontend (kalkulasi di device), tidak membutuhkan API call.

---

## 31. Kamus Islami

**Deskripsi:** Kamus istilah Islam (Arab-Indonesia) dengan penjelasan singkat.

**Layar yang dibutuhkan:**

- Search bar (ketik → hasil muncul otomatis)
- Kartu hasil (kata, definisi, kategori)
- Filter per kategori (fiqh, akidah, akhlak, dll)
- Detail istilah (penjelasan panjang, dalil, contoh penggunaan)

**API:**

```
GET /dictionary                    → semua kamus
GET /dictionary/category/:category → filter per kategori
GET /dictionary/:term              → detail istilah
```

---

## 32. Quiz Islami

**Deskripsi:** Kuis pengetahuan Islam (pilihan ganda). 10 soal per sesi, soal diacak per sesi.

**Layar yang dibutuhkan:**

- Tampilan soal (teks pertanyaan + 4 pilihan A/B/C/D)
- Progress bar soal (1/10, 2/10, dst)
- Feedback langsung setelah menjawab (benar = hijau, salah = merah + tampilkan jawaban benar)
- Tombol "Lanjut" → soal berikutnya
- Hasil akhir (skor X/10, persentase, emoji penilaian)
- **Riwayat skor** (tanggal, skor, persentase) — tersimpan lokal
- Tombol "Coba Lagi"

**API:**

```
GET  /quiz/session      → ambil 10 soal acak
POST /quiz/submit       → kirim jawaban (JWT, opsional)
GET  /quiz/stats        → statistik quiz user (JWT)
```

---

## 33. Tasbih Digital

**Deskripsi:** Penghitung tasbih digital (subhanallah, alhamdulillah, allahuakbar, dll). Getar per ketukan.

**Layar yang dibutuhkan:**

- Tombol ketuk besar di tengah layar
- Counter angka yang increment per tap
- Nama dzikir yang sedang dihitung (bisa dipilih/custom)
- Target jumlah (default 33/99)
- Reset counter
- Vibrasi feedback per ketukan (haptic)

> Fitur ini sepenuhnya di frontend (tidak membutuhkan API).

---

## 34. Wirid Kustom

**Deskripsi:** User dapat membuat dan menyimpan koleksi wirid pribadi (bacaan Arab + target jumlah + keterangan).

**Layar yang dibutuhkan:**

- Daftar wirid kustom user
- Form tambah wirid (judul, teks Arab, transliterasi, terjemahan, sumber, jumlah bacaan, kesempatan, catatan)
- Edit / hapus wirid
- Expand detail wirid
- Tautan ke wirid resmi (wirid `occasion`)

**API:**

```
POST   /user-wird         → buat wirid kustom (JWT)
GET    /user-wird         → list wirid user (JWT)
PUT    /user-wird/:id     → edit (JWT)
DELETE /user-wird/:id     → hapus (JWT)
GET    /wirid/occasion/:occasion  → wirid resmi per kesempatan
```

---

## 35. Perawi & Ilmu Hadith

**Deskripsi:** Database biografi perawi hadith lengkap dengan jarh wa ta'dil, tabaqah, relasi guru-murid, dan sanad.

**Layar yang dibutuhkan:**

- Daftar perawi (search, filter per tabaqah/generasi)
- Detail perawi (nama, kunya, tahun lahir/wafat, tabaqah, kota, jarh-tadil)
- Tab guru / murid perawi
- Penilaian jarh wa ta'dil (dari ulama hadith)
- Viewer sanad hadith (rantai perawi)

**Data perawi:**
| Field | Keterangan |
|---|---|
| name | Nama perawi |
| kunya | Panggilan (Abu/Ummu...) |
| tabaqah | Generasi (sahabat, tabi'in, dll) |
| birth_year | Tahun lahir Hijriah |
| death_year | Tahun wafat Hijriah |
| city | Kota asal |

**API:**

```
GET /perawi                 → list perawi
GET /perawi/search          → cari perawi
GET /perawi/tabaqah/:tabaqah → filter per generasi
GET /perawi/:id             → detail perawi
GET /perawi/:id/guru        → daftar guru
GET /perawi/:id/murid       → daftar murid
GET /perawi/:id/jarh-tadil  → penilaian
GET /jarh-tadil             → semua penilaian
GET /hadiths/:id/sanad      → sanad hadith tertentu
GET /hadiths/:id/takhrij    → takhrij hadith
```

---

## 36. Statistik & Laporan

**Deskripsi:** Ringkasan aktivitas ibadah dan belajar user dalam berbagai periode.

**Layar yang dibutuhkan:**

- Dashboard stats (sholat hari ini, streak, hafalan, bookmark, goals, tilawah)
- Bar chart sholat 7 hari terakhir
- Ringkasan tilawah (minggu ini / bulan ini)
- Laporan bulanan (total aktivitas per bulan)
- Laporan tahunan
- Pencapaian (badge) yang sudah diraih

**API:**

```
GET /stats           → ringkasan lengkap (JWT)
GET /stats/weekly    → aktivitas per minggu (JWT)
GET /stats/monthly   → laporan bulanan (JWT)
GET /stats/yearly    → laporan tahunan (JWT)
```

---

## 37. Leaderboard

**Deskripsi:** Papan peringkat komunitas berdasarkan streak dan jumlah hafalan.

**Layar yang dibutuhkan:**

- Tab: Streak / Hafalan
- List peringkat (posisi, avatar, nama, skor)
- Highlight posisi user sendiri
- Medali 🥇🥈🥉 untuk top 3

**API:**

```
GET /leaderboard/streak   → peringkat streak
GET /leaderboard/hafalan  → peringkat hafalan
GET /leaderboard/me       → posisi user sendiri (JWT)
```

---

## 38. Pencapaian (Achievement)

**Deskripsi:** Badge/medali yang didapat user atas pencapaian tertentu (streak X hari, hafal Y surah, dll).

**Layar yang dibutuhkan:**

- Grid badge pencapaian (ikon + nama + deskripsi)
- Badge dikunci abu-abu jika belum dicapai
- Badge berwarna / glowing jika sudah dicapai
- Total poin user
- Notifikasi badge baru

**API:**

```
GET /achievements         → semua achievement yang tersedia
GET /achievements/mine    → achievement yang sudah diraih (JWT)
GET /achievements/points  → total poin user (JWT)
```

---

## 39. Notifikasi Inbox

**Deskripsi:** Kotak masuk notifikasi personal user (reminder ibadah, badge baru, informasi sistem).

**Layar yang dibutuhkan:**

- Ikon lonceng 🔔 dengan badge angka unread
- List notifikasi (ikon tipe, judul, isi, waktu)
- Tap notifikasi → tandai sudah dibaca + navigasi ke konten
- Tombol "Tandai semua sudah dibaca"
- Filter: semua / belum dibaca

**Tipe notifikasi:** reminder sholat, reminder tilawah, badge baru, info sistem.

**API:**

```
GET /notifications/inbox           → list notifikasi user (JWT)
PUT /notifications/inbox/:id/read  → tandai satu dibaca (JWT)
PUT /notifications/inbox/read-all  → tandai semua dibaca (JWT)
```

---

## 40. Pengaturan Notifikasi

**Deskripsi:** Konfigurasi reminder harian untuk sholat, tilawah, muhasabah, dll.

**Layar yang dibutuhkan:**

- Toggle per jenis reminder (sholat pagi, tilawah, muhasabah, dll)
- Setting waktu reminder (jam berapa)
- Push notification permission prompt

**API:**

```
GET /notifications/settings    → ambil pengaturan notifikasi user (JWT)
PUT /notifications/settings    → simpan pengaturan (JWT)
```

---

## 41. Search Global

**Deskripsi:** Pencarian full-text lintas konten: ayah, hadith, doa, dzikir, artikel.

**Layar yang dibutuhkan:**

- Search bar di header (tab utama atau halaman khusus)
- Hasil dikelompokkan per tipe (Ayah, Hadith, Artikel, dll)
- Filter tipe: semua / quran / hadith
- Highlight kata kunci pada hasil
- Tap hasil → buka konten asli

**API:**

```
GET /search?q=&type=ayah|hadith|all&lang=id|ar|en
```

---

## 42. Feed / Social

**Deskripsi:** Timeline postingan singkat berbagi ayah, hadith, atau renungan dengan komunitas pengguna.

**Layar yang dibutuhkan:**

- Feed scroll (kartu postingan: isi, penulis, waktu, like)
- Tombol ❤️ like
- Form buat postingan (teks, tag ayah/hadith opsional)
- Detail postingan
- Hapus postingan sendiri

**API:**

```
GET    /feed          → timeline feed
GET    /feed/:id      → detail postingan
POST   /feed          → buat postingan (JWT)
POST   /feed/:id/like → like/unlike (JWT)
DELETE /feed/:id      → hapus milik sendiri (JWT)
```

---

## 43. Komentar

**Deskripsi:** Sistem komentar untuk konten (artikel blog, hadith, dll).

**Layar yang dibutuhkan:**

- Bagian komentar di bawah konten (blog, hadith)
- Form tulis komentar (user login)
- List komentar (avatar, nama, isi, waktu)
- Hapus komentar sendiri

**API:**

```
GET    /comments          → list komentar (?ref_type=&ref_id=)
POST   /comments          → buat komentar (JWT)
DELETE /comments/:id      → hapus (JWT)
```

---

## 44. Profil & Pengaturan Akun

**Deskripsi:** Halaman profil user dengan ringkasan aktivitas dan pengaturan akun.

**Layar yang dibutuhkan:**

- Foto profil, nama, email
- Streak badge 🔥
- Statistik singkat (hafalan, bookmark, total poin)
- Badge pencapaian terbaru
- Pengaturan bahasa (Indonesia / Inggris)
- Ganti nama / avatar
- Ganti password
- Logout

**API:**

```
GET /auth/me            → data profil
PUT /auth/me            → update nama, bahasa
PUT /auth/password      → ganti password
GET /streak             → streak
GET /achievements/mine  → badge
GET /achievements/points
```

---

## 45. Open API / Partner

**Deskripsi:** API key untuk akses konten publik tanpa login (untuk integrasi pihak ketiga / aplikasi partner).

> Fitur ini untuk developer / admin, bukan user biasa. Tidak perlu layar di mobile app.

**API:**

```
POST   /developer/register      → daftar sebagai developer
GET    /developer/keys          → list API key
POST   /developer/keys          → buat API key baru
DELETE /developer/keys/:id      → revoke API key
```

---

## Ringkasan Layar per Kategori

| Kategori                                       | Jumlah Layar Utama                |
| ---------------------------------------------- | --------------------------------- |
| Auth & Akun                                    | 6 layar                           |
| Al-Quran                                       | 6 layar                           |
| Hadith                                         | 5 layar                           |
| Doa / Dzikir / Wirid                           | 4 layar                           |
| Tafsir & Asbabun Nuzul                         | 2 layar                           |
| Asmaul Husna                                   | 3 layar (list, detail, flashcard) |
| Siroh / Sejarah / Fiqh / Manasik               | 3–4 layar masing-masing           |
| Kajian & Blog                                  | 3 layar masing-masing             |
| Tracker (Sholat, Hafalan, Tilawah, Khatam)     | 2–3 layar masing-masing           |
| Streak / Amalan / Muhasabah / Goals            | 2 layar masing-masing             |
| Tools (Zakat, Faraidh, Kiblat, Kamus, Hijri)   | 1–2 layar masing-masing           |
| Quiz / Tasbih                                  | 2–3 layar masing-masing           |
| Bookmark / Notes / Progress                    | 1–2 layar masing-masing           |
| Notifikasi / Stats / Leaderboard / Achievement | 1–2 layar masing-masing           |
| Search / Feed / Profil                         | 2 layar masing-masing             |
| **Total estimasi**                             | **±90–110 layar**                 |

---

## Catatan Teknis untuk Designer

1. **Auth:** Semua fitur personal (bookmark, notes, hafalan, streak, dll) membutuhkan JWT token. Desain harus handle state: belum login (prompt login) vs sudah login.

2. **Bahasa:** API dan web app support dua bahasa: `ID` (Indonesia) dan `EN` (Inggris). Semua teks UI dan terjemahan konten bilingual.

3. **Teks Arab:** Gunakan font Amiri atau Uthmanic untuk teks Arab. Direction: `rtl`. Line-height disarankan 2.0–2.2.

4. **Offline / lokal:** Beberapa fitur menggunakan localStorage di web (tasbih, khatam, tilawah, muhasabah, faraidh history). Di mobile, padankan dengan SQLite / AsyncStorage.

5. **Dark mode:** Web app fully support dark mode. Mobile app sebaiknya juga menyediakan dark mode.

6. **Konten statis:** Data Al-Quran, hadith, doa, dzikir, asmaul husna semuanya dari API — tidak perlu bundle di app.

7. **Audio:** Audio murotal surah/ayah tersedia via URL eksternal (field `audio_url`). Stream langsung dari URL tersebut.

8. **API base URL:** `http://localhost:29900/api/v1/` (development). Produksi disesuaikan.

---

## Database Tables — Referensi Lengkap

Seluruh tabel berikut didefinisikan sebagai GORM struct di `services/api/app/model/`. Base ID dipakai di hampir semua tabel: `id (PK)`, `created_at`, `updated_at`, `deleted_at (soft-delete)`. Tabel dengan `BaseUUID` menggunakan UUID sebagai primary key; tabel dengan `BaseID` menggunakan integer auto-increment.

---

### Shared / Cross-cutting

#### `translations`

Tabel terpusat untuk semua teks bilingual (Arab, Indonesia, Inggris). Hampir semua tabel konten FK ke sini.

| Kolom           | Tipe   | Keterangan                   |
| --------------- | ------ | ---------------------------- |
| id              | int PK |                              |
| description_idn | text   | Deskripsi Bahasa Indonesia   |
| idn             | text   | Teks utama Indonesia         |
| latin_idn       | text   | Transliterasi Latin (ID)     |
| description_en  | text   | Deskripsi Bahasa Inggris     |
| en              | text   | Teks utama Inggris           |
| latin_en        | text   | Transliterasi Latin (EN)     |
| description_ar  | text   | Deskripsi Arab               |
| ar              | text   | Teks Arab utama              |
| ar_waqaf        | text   | Teks Arab dengan tanda waqaf |
| ar_format       | text   | Teks Arab formatted          |
| ar_html         | text   | Teks Arab HTML               |

#### `multimedias`

File attachment (gambar, PDF, audio) yang di-relasikan ke konten apapun via asset join table.

| Kolom              | Tipe         | Keterangan      |
| ------------------ | ------------ | --------------- |
| id                 | int PK       |                 |
| title              | varchar(256) |                 |
| file_name          | varchar(256) |                 |
| file_size          | float        |                 |
| original_file_name | varchar(256) |                 |
| url                | varchar(256) | URL publik file |
| format             | varchar(36)  | pdf / jpg / mp3 |
| translation_id     | int FK       |                 |

---

### Auth & Users

#### `users`

| Kolom          | Tipe         | Keterangan                     |
| -------------- | ------------ | ------------------------------ |
| id             | uuid PK      |                                |
| name           | varchar(256) | NOT NULL                       |
| email          | varchar(256) | UNIQUE, NOT NULL               |
| password       | varchar(256) | bcrypt, hidden dari JSON       |
| role           | varchar(50)  | admin / author / editor / user |
| avatar         | varchar(512) | URL foto profil                |
| preferred_lang | varchar(10)  | default: 'idn'                 |

#### `refresh_tokens`

| Kolom      | Tipe               | Keterangan |
| ---------- | ------------------ | ---------- |
| id         | int PK             |            |
| user_id    | varchar(36) FK     |            |
| token      | varchar(64) UNIQUE |            |
| expires_at | timestamp          |            |
| created_at | timestamp          |            |

#### `password_reset_tokens`

| Kolom      | Tipe               | Keterangan |
| ---------- | ------------------ | ---------- |
| id         | int PK             |            |
| user_id    | varchar(36) FK     |            |
| token      | varchar(64) UNIQUE |            |
| expires_at | timestamp          |            |
| used_at    | timestamp nullable |            |
| created_at | timestamp          |            |

#### `api_keys`

| Kolom         | Tipe               | Keterangan    |
| ------------- | ------------------ | ------------- |
| id            | int PK             |               |
| user_id       | uuid FK            |               |
| name          | varchar(100)       |               |
| key           | varchar(64) UNIQUE |               |
| is_active     | bool               | default: true |
| last_used_at  | timestamp nullable |               |
| request_count | int                | default: 0    |

---

### Al-Quran

#### `surahs`

| Kolom            | Tipe         | Keterangan           |
| ---------------- | ------------ | -------------------- |
| id               | int PK       |                      |
| slug             | varchar(36)  |                      |
| identifier       | varchar(256) |                      |
| number           | int UNIQUE   | Nomor surah 1–114    |
| number_of_ayahs  | int          |                      |
| revelation_type  | varchar      | Makkiyah / Madaniyah |
| default_language | varchar      | default: 'Ar'        |
| translation_id   | int FK       | Nama & arti surah    |

#### `ayahs`

| Kolom          | Tipe            | Keterangan             |
| -------------- | --------------- | ---------------------- |
| id             | int PK          |                        |
| number         | int             | Nomor ayat dalam surah |
| surah_id       | int FK NOT NULL |                        |
| translation_id | int FK NOT NULL | Teks Arab + terjemah   |
| juz_id         | int FK          |                        |
| juz_number     | int             |                        |
| page           | int             | Nomor halaman mushaf   |
| manzil         | int             |                        |
| ruku           | int             |                        |
| hizb_quarter   | int             |                        |
| sajda          | bool            |                        |

#### `juzs`

| Kolom          | Tipe       | Keterangan |
| -------------- | ---------- | ---------- |
| id             | int PK     |            |
| number         | int UNIQUE | 1–30       |
| total_ayah     | int        |            |
| start_surah_id | int FK     |            |
| end_surah_id   | int FK     |            |
| start_ayah_id  | int FK     |            |
| end_ayah_id    | int FK     |            |

#### `tafsirs`

| Kolom                      | Tipe          | Keterangan |
| -------------------------- | ------------- | ---------- |
| id                         | int PK        |            |
| ayah_id                    | int FK UNIQUE |            |
| kemenag_translation_id     | int FK        |            |
| ibnu_katsir_translation_id | int FK        |            |

#### `asbabun_nuzuls`

| Kolom          | Tipe          | Keterangan |
| -------------- | ------------- | ---------- |
| id             | int PK        |            |
| ayah_id        | int NOT NULL  |            |
| content        | text NOT NULL |            |
| source         | varchar(512)  |            |
| translation_id | int FK        |            |

#### `mufrodats` (Kosakata per ayat)

| Kolom           | Tipe            | Keterangan             |
| --------------- | --------------- | ---------------------- |
| id              | int PK          |                        |
| ayah_id         | int FK NOT NULL |                        |
| word_index      | int NOT NULL    | Urutan kata dalam ayat |
| arabic          | varchar(128)    |                        |
| transliteration | varchar(256)    |                        |
| indonesian      | varchar(256)    |                        |
| root_word       | varchar(128)    |                        |
| part_of_speech  | varchar(64)     |                        |

#### `surah_audios`

| Kolom     | Tipe                          | Keterangan |
| --------- | ----------------------------- | ---------- |
| id        | int PK                        |            |
| surah_id  | int FK NOT NULL               |            |
| qari_name | varchar(256)                  |            |
| qari_slug | varchar(100) UNIQUE per surah |            |
| audio_url | varchar(512)                  |            |

#### `ayah_audios`

| Kolom     | Tipe                         | Keterangan |
| --------- | ---------------------------- | ---------- |
| id        | int PK                       |            |
| ayah_id   | int FK NOT NULL              |            |
| qari_name | varchar(256)                 |            |
| qari_slug | varchar(100) UNIQUE per ayah |            |
| audio_url | varchar(512)                 |            |

---

### Hadith

#### `books`

| Kolom            | Tipe                | Keterangan                    |
| ---------------- | ------------------- | ----------------------------- |
| id               | int PK              |                               |
| slug             | varchar(256) UNIQUE | bukhari, muslim, abudaud, dll |
| default_language | varchar             |                               |
| translation_id   | int FK              | Nama kitab                    |

Kitab yang tersedia: Shahih Bukhari, Shahih Muslim, Sunan Abu Daud, Sunan Tirmidzi, Sunan Nasa'i, Sunan Ibnu Majah, Muwatha' Malik, Musnad Ahmad, Sunan Darimi.

#### `themes` (Tema/Bab besar hadith)

| Kolom            | Tipe    | Keterangan |
| ---------------- | ------- | ---------- |
| id               | int PK  |            |
| default_language | varchar |            |
| translation_id   | int FK  |            |

#### `chapters` (Sub-bab dalam tema)

| Kolom          | Tipe   | Keterangan |
| -------------- | ------ | ---------- |
| id             | int PK |            |
| theme_id       | int FK |            |
| translation_id | int FK |            |

#### `hadiths`

| Kolom          | Tipe        | Keterangan                            |
| -------------- | ----------- | ------------------------------------- |
| id             | int PK      |                                       |
| number         | int         | Nomor hadith dalam kitab              |
| book_id        | int FK      |                                       |
| theme_id       | int FK      |                                       |
| chapter_id     | int FK      |                                       |
| translation_id | int FK      | Matan Arab + terjemah                 |
| grade          | varchar(30) | shahih / hasan / dhaif / maudhu / dll |
| shahih_by      | text        | Ulama yang menshahihkan               |
| dhaif_by       | text        | Ulama yang mendhaifkan                |
| grade_notes    | text        |                                       |
| sanad          | text        | Teks sanad mentah                     |

#### `perawis` (Narrator/Rawi)

| Kolom        | Tipe         | Keterangan                             |
| ------------ | ------------ | -------------------------------------- |
| id           | int PK       |                                        |
| nama_arab    | varchar(255) |                                        |
| nama_latin   | varchar(255) |                                        |
| nama_lengkap | text         |                                        |
| kunyah       | varchar(100) | Abu Fulan, dll                         |
| laqab        | varchar(100) | Gelar                                  |
| nisbah       | varchar(100) | Nisba/asal daerah                      |
| tahun_lahir  | int          |                                        |
| tahun_wafat  | int          |                                        |
| tahun_hijri  | bool         | default: true                          |
| tempat_lahir | varchar(100) |                                        |
| tempat_wafat | varchar(100) |                                        |
| tabaqah      | varchar(50)  | sahabat / tabiin / tabiut_tabiin / dll |
| status       | varchar(30)  | tsiqah / shaduq / dhaif / matruk / dll |
| biografis    | text         |                                        |

#### `perawi_gurus` (Join table guru-murid)

| Kolom    | Tipe      |
| -------- | --------- |
| guru_id  | int FK PK |
| murid_id | int FK PK |

#### `sanads` (Jalur sanad hadith)

| Kolom        | Tipe            | Keterangan                       |
| ------------ | --------------- | -------------------------------- |
| id           | int PK          |                                  |
| hadith_id    | int FK NOT NULL |                                  |
| nomor_jalur  | int             | Urutan jalur sanad               |
| jenis        | varchar(20)     | musnad / mursal / munqathi / dll |
| status_sanad | varchar(20)     | muttashil / munqathi             |
| catatan      | text            |                                  |

#### `mata_sanads` (Satu mata rantai dalam sanad)

| Kolom     | Tipe            | Keterangan                            |
| --------- | --------------- | ------------------------------------- |
| id        | int PK          |                                       |
| sanad_id  | int FK NOT NULL |                                       |
| perawi_id | int FK NOT NULL |                                       |
| urutan    | int NOT NULL    | Posisi dalam rantai                   |
| metode    | varchar(30)     | haddatsana / akhbarana / ananah / dll |
| catatan   | text            |                                       |

#### `jarh_tadils` (Penilaian ulama terhadap perawi)

| Kolom       | Tipe            | Keterangan            |
| ----------- | --------------- | --------------------- |
| id          | int PK          |                       |
| perawi_id   | int FK NOT NULL |                       |
| penilai_id  | int FK NOT NULL | Perawi penilai        |
| jenis_nilai | varchar(10)     | tadil / jarh          |
| tingkat     | int (1–7)       | Tingkatan ta'dil/jarh |
| teks_nilai  | varchar(255)    | Teks penilaian        |
| sumber      | varchar(255)    | Nama kitab sumber     |
| halaman     | varchar(50)     |                       |

#### `takhrijs` (Referensi silang hadith ke kitab lain)

| Kolom             | Tipe            | Keterangan |
| ----------------- | --------------- | ---------- |
| id                | int PK          |            |
| hadith_id         | int FK NOT NULL |            |
| book_id           | int FK          |            |
| nomor_hadis_kitab | varchar(50)     |            |
| halaman           | varchar(50)     |            |
| jilid             | varchar(50)     |            |
| catatan           | text            |            |

---

### Ibadah & Tracker

#### `sholat_logs`

| Kolom   | Tipe                    | Keterangan                              |
| ------- | ----------------------- | --------------------------------------- |
| id      | int PK                  |                                         |
| user_id | uuid FK                 |                                         |
| date    | date                    | YYYY-MM-DD                              |
| prayer  | varchar(20)             | subuh / dzuhur / ashar / maghrib / isya |
| status  | varchar(20)             | berjamaah / munfarid / qadha / missed   |
| UNIQUE  | (user_id, date, prayer) |                                         |

#### `sholat_guides` (Tata cara sholat)

| Kolom          | Tipe         | Keterangan                                      |
| -------------- | ------------ | ----------------------------------------------- |
| id             | int PK       |                                                 |
| step           | int UNIQUE   | Urutan gerakan                                  |
| source         | varchar(512) | Dalil hadith                                    |
| translation_id | int FK       | Title, Arab, transliterasi, terjemah, deskripsi |

#### `tilawah_logs`

| Kolom      | Tipe                 | Keterangan |
| ---------- | -------------------- | ---------- |
| id         | int PK               |            |
| user_id    | uuid FK              |            |
| date       | date UNIQUE per user |            |
| pages_read | int                  | default: 0 |
| juz_read   | decimal(4,2)         | default: 0 |
| note       | text                 |            |

#### `hafalan_progresses`

| Kolom        | Tipe                | Keterangan                            |
| ------------ | ------------------- | ------------------------------------- |
| id           | uuid PK             |                                       |
| user_id      | uuid FK             |                                       |
| surah_id     | int FK              |                                       |
| status       | varchar(50)         | not_started / in_progress / memorized |
| started_at   | timestamp nullable  |                                       |
| completed_at | timestamp nullable  |                                       |
| UNIQUE       | (user_id, surah_id) |                                       |

#### `murojaah_sessions`

| Kolom            | Tipe    | Keterangan |
| ---------------- | ------- | ---------- |
| id               | int PK  |            |
| user_id          | uuid FK |            |
| date             | date    |            |
| surah_id         | int     |            |
| from_ayah        | int     |            |
| to_ayah          | int     |            |
| score            | int     | 0–100      |
| duration_seconds | int     |            |
| note             | text    |            |

#### `amalan_items` (Master daftar amalan)

| Kolom          | Tipe            | Keterangan                                  |
| -------------- | --------------- | ------------------------------------------- |
| id             | int PK          |                                             |
| name           | varchar(256)    |                                             |
| description    | text            |                                             |
| category       | varchar(50)     | sholat / puasa / dzikir / sedekah / lainnya |
| is_active      | bool            |                                             |
| translation_id | int FK nullable |                                             |

#### `amalan_logs`

| Kolom          | Tipe                            | Keterangan |
| -------------- | ------------------------------- | ---------- |
| id             | int PK                          |            |
| user_id        | uuid FK                         |            |
| amalan_item_id | int FK                          |            |
| date           | date                            |            |
| is_done        | bool                            |            |
| UNIQUE         | (user_id, amalan_item_id, date) |            |

#### `muhasabahs`

| Kolom      | Tipe          | Keterangan    |
| ---------- | ------------- | ------------- |
| id         | int PK        |               |
| user_id    | uuid FK       |               |
| date       | date          |               |
| content    | text NOT NULL |               |
| mood_score | int (1–5)     | default: 3    |
| is_private | bool          | default: true |

#### `study_goals`

| Kolom        | Tipe         | Keterangan                                   |
| ------------ | ------------ | -------------------------------------------- |
| id           | int PK       |                                              |
| user_id      | uuid FK      |                                              |
| type         | varchar(50)  | hafalan / khatam / tilawah / hadith / custom |
| title        | varchar(512) |                                              |
| description  | text         |                                              |
| target       | int          |                                              |
| progress     | int          |                                              |
| start_date   | date         |                                              |
| end_date     | date         |                                              |
| is_completed | bool         |                                              |

#### `user_activities` (Aktivitas harian untuk streak)

| Kolom         | Tipe                           | Keterangan           |
| ------------- | ------------------------------ | -------------------- |
| id            | uuid PK                        |                      |
| user_id       | uuid FK                        |                      |
| activity_date | date                           |                      |
| type          | varchar(50)                    | quran / hadith / doa |
| count         | int                            | default: 1           |
| UNIQUE        | (user_id, activity_date, type) |                      |

---

### Konten Islam

#### `dzikirs`

| Kolom          | Tipe         | Keterangan                                                   |
| -------------- | ------------ | ------------------------------------------------------------ |
| id             | int PK       |                                                              |
| category       | varchar(50)  | pagi / petang / setelah_sholat / tidur / safar / dzikir_umum |
| occasion       | varchar(100) | Situasi khusus                                               |
| count          | int          | Jumlah pengulangan, default: 1                               |
| fadhilah_idn   | text         | Keutamaan (Indonesia)                                        |
| fadhilah_en    | text         | Keutamaan (Inggris)                                          |
| source         | varchar(256) | Referensi dalil                                              |
| audio_url      | varchar(500) |                                                              |
| translation_id | int FK       | Title, Arab, transliterasi, terjemah                         |

#### `dzikir_logs`

| Kolom     | Tipe        | Keterangan |
| --------- | ----------- | ---------- |
| id        | uuid PK     |            |
| user_id   | uuid FK     |            |
| dzikir_id | int FK      |            |
| log_date  | varchar(10) | YYYY-MM-DD |
| category  | varchar(50) |            |

#### `user_wirds` (Wirid personal user)

| Kolom           | Tipe                  | Keterangan |
| --------------- | --------------------- | ---------- |
| id              | uuid PK               |            |
| user_id         | uuid FK               |            |
| title           | varchar(256) NOT NULL |            |
| arabic          | text                  |            |
| transliteration | text                  |            |
| translation     | text                  |            |
| source          | varchar(256)          |            |
| count           | int                   | default: 1 |
| occasion        | varchar(64)           |            |
| note            | text                  |            |

#### `doas`

| Kolom          | Tipe         | Keterangan                                                                             |
| -------------- | ------------ | -------------------------------------------------------------------------------------- |
| id             | int PK       |                                                                                        |
| category       | varchar(100) | pagi / petang / makan / tidur / bangun / kamar_mandi / masjid / safar / belajar / umum |
| source         | varchar(256) |                                                                                        |
| audio_url      | varchar(500) |                                                                                        |
| translation_id | int FK       | Title, Arab, transliterasi, terjemah                                                   |

#### `asma_ul_husnas`

| Kolom           | Tipe            | Keterangan      |
| --------------- | --------------- | --------------- |
| id              | int PK          |                 |
| number          | int UNIQUE      | 1–99            |
| arabic          | varchar(100)    |                 |
| transliteration | varchar(100)    |                 |
| indonesian      | varchar(256)    |                 |
| english         | varchar(256)    |                 |
| meaning         | text            | Deskripsi makna |
| audio_url       | varchar(512)    |                 |
| translation_id  | int FK nullable |                 |

#### `manasik_steps`

| Kolom          | Tipe        | Keterangan                            |
| -------------- | ----------- | ------------------------------------- |
| id             | int PK      |                                       |
| type           | varchar(20) | haji / umrah                          |
| step_order     | int         |                                       |
| is_wajib       | bool        |                                       |
| translation_id | int FK      | Title, deskripsi, Arab, transliterasi |

#### `kajians`

| Kolom            | Tipe            | Keterangan           |
| ---------------- | --------------- | -------------------- |
| id               | int PK          |                      |
| title            | varchar(512)    |                      |
| description      | text            |                      |
| speaker          | varchar(256)    | Nama ustadz/pemateri |
| topic            | varchar(256)    |                      |
| type             | varchar(20)     | video / audio / text |
| url              | varchar(1024)   | Link konten          |
| duration_seconds | int             |                      |
| thumbnail_url    | varchar(1024)   |                      |
| view_count       | int             |                      |
| published_at     | date            |                      |
| translation_id   | int FK nullable |                      |

#### `blog_categories`

| Kolom          | Tipe                | Keterangan      |
| -------------- | ------------------- | --------------- |
| id             | int PK              |                 |
| slug           | varchar(256) UNIQUE |                 |
| translation_id | int FK              | Nama, deskripsi |

#### `blog_tags`

| Kolom          | Tipe                | Keterangan |
| -------------- | ------------------- | ---------- |
| id             | int PK              |            |
| slug           | varchar(100) UNIQUE |            |
| translation_id | int FK              | Nama tag   |

#### `blog_posts`

| Kolom          | Tipe                  | Keterangan                          |
| -------------- | --------------------- | ----------------------------------- |
| id             | uuid PK               |                                     |
| author_id      | uuid FK               |                                     |
| category_id    | int FK nullable       |                                     |
| slug           | varchar(512) UNIQUE   |                                     |
| cover_image    | varchar(512) nullable |                                     |
| status         | varchar(50)           | draft / published / archived        |
| published_at   | timestamp nullable    |                                     |
| view_count     | int                   |                                     |
| translation_id | int FK                | Title, excerpt, content (bilingual) |

#### `blog_post_tags` (Many2many join)

| Kolom        | Tipe    |
| ------------ | ------- |
| blog_post_id | uuid FK |
| blog_tag_id  | int FK  |

#### `siroh_categories`

| Kolom          | Tipe                | Keterangan    |
| -------------- | ------------------- | ------------- |
| id             | int PK              |               |
| title          | varchar(256)        |               |
| slug           | varchar(256) UNIQUE |               |
| order          | int                 | Urutan tampil |
| translation_id | int FK nullable     |               |

#### `siroh_contents`

| Kolom          | Tipe                | Keterangan |
| -------------- | ------------------- | ---------- |
| id             | int PK              |            |
| category_id    | int FK NOT NULL     |            |
| title          | varchar(256)        |            |
| slug           | varchar(256) UNIQUE |            |
| content        | text NOT NULL       |            |
| order          | int                 |            |
| translation_id | int FK nullable     |            |

#### `fiqh_categories`

| Kolom          | Tipe                | Keterangan |
| -------------- | ------------------- | ---------- |
| id             | int PK              |            |
| name           | varchar(256)        |            |
| slug           | varchar(256) UNIQUE |            |
| description    | text                |            |
| translation_id | int FK nullable     |            |

#### `fiqh_items`

| Kolom          | Tipe                | Keterangan |
| -------------- | ------------------- | ---------- |
| id             | int PK              |            |
| category_id    | int FK NOT NULL     |            |
| title          | varchar(512)        |            |
| slug           | varchar(512) UNIQUE |            |
| content        | text NOT NULL       |            |
| source         | varchar(256)        |            |
| sort_order     | int                 |            |
| translation_id | int FK nullable     |            |

#### `history_events` (Sejarah Islam)

| Kolom          | Tipe                | Keterangan                                   |
| -------------- | ------------------- | -------------------------------------------- |
| id             | int PK              |                                              |
| year_hijri     | int                 |                                              |
| year_miladi    | int                 |                                              |
| slug           | varchar(256) UNIQUE |                                              |
| category       | varchar(50)         | nabi / khulafa / dinasti / ulama / peristiwa |
| is_significant | bool                |                                              |
| translation_id | int FK              | Title, deskripsi                             |

---

### Gamifikasi

#### `achievements`

| Kolom       | Tipe               | Keterangan             |
| ----------- | ------------------ | ---------------------- |
| id          | int PK             |                        |
| code        | varchar(64) UNIQUE | Identifier achievement |
| name        | varchar(128)       | Nama (Indonesia)       |
| name_en     | varchar(128)       |                        |
| description | text               |                        |
| desc_en     | text               |                        |
| icon        | varchar(256)       | Emoji atau URL gambar  |
| category    | varchar(64)        |                        |
| threshold   | int                | Target numerik         |

#### `user_achievements`

| Kolom          | Tipe      | Keterangan |
| -------------- | --------- | ---------- |
| id             | uuid PK   |            |
| user_id        | uuid FK   |            |
| achievement_id | int FK    |            |
| earned_at      | timestamp |            |

#### `user_points`

| Kolom        | Tipe           | Keterangan |
| ------------ | -------------- | ---------- |
| id           | uuid PK        |            |
| user_id      | uuid FK UNIQUE |            |
| total_points | int            | default: 0 |

#### `quizzes`

| Kolom          | Tipe            | Keterangan                                     |
| -------------- | --------------- | ---------------------------------------------- |
| id             | int PK          |                                                |
| type           | varchar(50)     | hafalan / fiqh / sirah / hadith / asmaul_husna |
| question_text  | text NOT NULL   |                                                |
| correct_answer | text NOT NULL   |                                                |
| options        | jsonb           | Array pilihan jawaban                          |
| explanation    | text            | Penjelasan jawaban                             |
| difficulty     | varchar(20)     | easy / medium / hard                           |
| ref_id         | int nullable    | FK ke konten terkait                           |
| translation_id | int FK nullable | Versi bilingual soal                           |

#### `user_quiz_results`

| Kolom       | Tipe      | Keterangan |
| ----------- | --------- | ---------- |
| id          | int PK    |            |
| user_id     | uuid FK   |            |
| quiz_id     | int FK    |            |
| is_correct  | bool      |            |
| answered_at | timestamp |            |

---

### Sosial & Feed

#### `feed_posts`

| Kolom    | Tipe        | Keterangan                    |
| -------- | ----------- | ----------------------------- |
| id       | uuid PK     |                               |
| user_id  | uuid FK     |                               |
| ref_type | varchar(20) | ayah / hadith                 |
| ref_id   | int         | ID ayat/hadith yang dibagikan |
| caption  | text        |                               |
| likes    | int         | default: 0                    |

#### `comments`

| Kolom      | Tipe            | Keterangan         |
| ---------- | --------------- | ------------------ |
| id         | int PK          |                    |
| user_id    | uuid FK         |                    |
| ref_type   | varchar(20)     | ayah / hadith      |
| ref_id     | int             |                    |
| content    | text NOT NULL   |                    |
| parent_id  | int nullable FK | Untuk nested reply |
| like_count | int             | default: 0         |

---

### Akun & Notifikasi

#### `bookmarks`

| Kolom    | Tipe                        | Keterangan              |
| -------- | --------------------------- | ----------------------- |
| id       | uuid PK                     |                         |
| user_id  | uuid FK                     |                         |
| ref_type | varchar(50)                 | ayah / hadith / article |
| ref_id   | int                         |                         |
| ref_slug | varchar(512)                |                         |
| color    | varchar(20)                 | Warna label bookmark    |
| label    | varchar(64)                 | Teks label              |
| UNIQUE   | (user_id, ref_type, ref_id) |                         |

#### `notes`

| Kolom    | Tipe          | Keterangan        |
| -------- | ------------- | ----------------- |
| id       | int PK        |                   |
| user_id  | uuid FK       |                   |
| ref_type | varchar(20)   | ayah / hadith     |
| ref_id   | int           |                   |
| content  | text NOT NULL | max 5000 karakter |

#### `reading_progresses`

| Kolom        | Tipe                    | Keterangan                    |
| ------------ | ----------------------- | ----------------------------- |
| id           | uuid PK                 |                               |
| user_id      | uuid FK                 |                               |
| content_type | varchar(50)             | quran / hadith                |
| surah_number | int nullable            |                               |
| ayah_number  | int nullable            |                               |
| ayah_id      | int nullable            |                               |
| book_slug    | varchar(256) nullable   |                               |
| hadith_id    | int nullable            |                               |
| last_read_at | timestamp               |                               |
| UNIQUE       | (user_id, content_type) | Satu progress per tipe konten |

#### `notification_settings`

| Kolom        | Tipe               | Keterangan                       |
| ------------ | ------------------ | -------------------------------- |
| id           | int PK             |                                  |
| user_id      | uuid FK            |                                  |
| type         | varchar(50)        | daily_quran / daily_hadith / doa |
| time         | varchar(5)         | HH:MM                            |
| is_active    | bool               |                                  |
| last_sent_at | timestamp nullable |                                  |
| UNIQUE       | (user_id, type)    |                                  |

#### `user_notifications` (Inbox notifikasi)

| Kolom   | Tipe         | Keterangan        |
| ------- | ------------ | ----------------- |
| id      | uuid PK      |                   |
| user_id | uuid FK      |                   |
| title   | varchar(200) |                   |
| body    | text         |                   |
| type    | varchar(50)  |                   |
| ref_id  | varchar(100) | ID konten terkait |
| is_read | bool         | default: false    |

---

### Tools

#### `islamic_terms` (Kamus Istilah Arab-Islam)

| Kolom          | Tipe                | Keterangan                                                |
| -------------- | ------------------- | --------------------------------------------------------- |
| id             | int PK              |                                                           |
| term           | varchar(256) UNIQUE | Istilah/kata                                              |
| category       | varchar(50)         | fiqh / aqidah / tasawuf / ulumul_quran / hadith / lainnya |
| definition     | text NOT NULL       | Definisi                                                  |
| example        | text                | Contoh penggunaan                                         |
| source         | varchar(256)        |                                                           |
| origin         | varchar(100)        | Asal bahasa/kata                                          |
| translation_id | int FK nullable     |                                                           |

#### `islamic_events` (Kalender Hijri)

| Kolom       | Tipe                           | Keterangan              |
| ----------- | ------------------------------ | ----------------------- |
| id          | int PK                         |                         |
| name        | varchar(256)                   | Nama acara/peristiwa    |
| hijri_month | int NOT NULL                   |                         |
| hijri_day   | int NOT NULL                   |                         |
| description | text                           |                         |
| category    | varchar(20)                    | puasa / eid / peristiwa |
| UNIQUE      | (hijri_month, hijri_day, name) |                         |

> **Note:** Prayer times (`/jadwal-sholat`) dan Kiblat (`/kiblat`) dihitung secara real-time dan **tidak disimpan di database** — murni computed dari koordinat GPS pengguna.

---

### Ringkasan Jumlah Tabel

| Kategori                         | Jumlah Tabel                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Shared (Translation, Multimedia) | 2                                                                                                      |
| Auth & Users                     | 4 (user, refresh_token, password_reset_token, api_key)                                                 |
| Al-Quran                         | 8 (surah, ayah, juz, tafsir, asbabun_nuzul, mufrodat, surah_audio, ayah_audio)                         |
| Al-Quran Assets                  | 3 (surah_asset, ayah_asset, juz_asset)                                                                 |
| Hadith                           | 4 (hadith, book, theme, chapter) + asset join tables                                                   |
| Ilmu Hadith                      | 5 (perawi, perawi_guru, sanad, mata_sanad, jarh_tadil, takhrij)                                        |
| Ibadah Tracker                   | 6 (sholat_log, sholat_guide, tilawah_log, hafalan_progress, murojaah_session, amalan_item, amalan_log) |
| Personal                         | 4 (muhasabah, study_goal, user_activity, reading_progress)                                             |
| Dzikir/Doa/Wird                  | 3 (doa, dzikir, dzikir_log, user_wird)                                                                 |
| Asmaul Husna                     | 1                                                                                                      |
| Manasik                          | 1                                                                                                      |
| Kajian & Blog                    | 5 (kajian, blog_post, blog_category, blog_tag, blog_post_tags)                                         |
| Siroh, Fiqh, Sejarah             | 6 (siroh_category, siroh_content, fiqh_category, fiqh_item, history_event)                             |
| Gamifikasi                       | 4 (achievement, user_achievement, user_points, quiz, user_quiz_result)                                 |
| Sosial                           | 2 (feed_post, comment)                                                                                 |
| Akun/Notifikasi                  | 4 (bookmark, note, notification_setting, user_notification)                                            |
| Tools                            | 2 (islamic_term, islamic_event)                                                                        |
| **Total**                        | **±65+ tabel**                                                                                         |

---

_Dokumen ini di-generate dari codebase thollabul-ilmi pada 2026-05-06._
