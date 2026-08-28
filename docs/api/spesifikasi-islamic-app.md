# Spesifikasi Lengkap — Islamic App (Nūr Platform)

> Monorepo · Web (Next.js) · Mobile (React Native / Expo) · Desktop (Electron / Tauri)
> Backend: Golang + GORM · Database: PostgreSQL + Redis

---

## Daftar Isi

1. [Vision & Overview](#1-vision--overview)
2. [Arsitektur Monorepo](#2-arsitektur-monorepo)
3. [Modul-Modul Aplikasi](#3-modul-modul-aplikasi)
    - 3.1 Al-Qur'an
    - 3.2 Hadis _(lanjutan dari apps sebelumnya)_
    - 3.3 Jadwal Shalat & Adzan
    - 3.4 Kiblat
    - 3.5 Dzikir & Doa
    - 3.6 Tafsir
    - 3.7 Asmaul Husna
    - 3.8 Kalender Hijriyah
    - 3.9 Zakat & Infaq
    - 3.10 Kalkulator Waris (Faraidh)
    - 3.11 Siroh & Sejarah Islam
    - 3.12 Konten Islami (Artikel & Ceramah)
    - 3.13 Komunitas & Forum
    - 3.14 Gamifikasi & Streak
    - 3.15 Notifikasi & Reminder
4. [Database Schema Lengkap](#4-database-schema-lengkap)
5. [API Endpoints Lengkap](#5-api-endpoints-lengkap)
6. [Arsitektur Frontend](#6-arsitektur-frontend)
7. [Autentikasi & User System](#7-autentikasi--user-system)
8. [Integrasi Eksternal](#8-integrasi-eksternal)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Roadmap & Fase Pengembangan](#10-roadmap--fase-pengembangan)

---

## 1. Vision & Overview

### Nama Aplikasi

**Nūr** (نور) — _cahaya_ — platform Islam komprehensif untuk semua kalangan Muslim.

### Misi

Menyediakan satu platform terintegrasi sebagai teman ibadah harian, rujukan ilmu syar'i, dan sarana pertumbuhan spiritual — dari Al-Qur'an hingga penelitian hadis akademik.

### Target Pengguna

| Segmen             | Kebutuhan                                   |
| ------------------ | ------------------------------------------- |
| Muslim harian      | Jadwal shalat, adzan, dzikir, Al-Qur'an     |
| Pelajar Islam      | Tafsir, hadis, sejarah Islam                |
| Akademisi/Peneliti | Takhrij hadis, jarh wa ta'dil, sanad        |
| Da'i/Ustaz         | Referensi ceramah, artikel, pencarian dalil |
| Mualaf             | Panduan dasar, konten edukasi, forum        |

### Platform

- **Web** — Next.js (App Router, SSR/SSG)
- **Mobile** — React Native + Expo
- **Desktop** — Tauri (wrapper Web) atau Electron
- **Backend** — Golang (Gin/Fiber) + GORM + PostgreSQL + Redis

---

## 2. Arsitektur Monorepo

```
nur-platform/
├── apps/
│   ├── web/                  # Next.js
│   ├── mobile/               # React Native (Expo)
│   └── desktop/              # Tauri / Electron
├── packages/
│   ├── ui/                   # Shared component library
│   ├── types/                # Shared TypeScript types
│   ├── hooks/                # Shared React hooks
│   ├── api-client/           # Auto-generated API client (OpenAPI)
│   └── utils/                # Shared utilities (hijri date, quran utils)
├── backend/
│   ├── cmd/server/
│   ├── internal/
│   │   ├── handler/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── dto/
│   │   └── middleware/
│   ├── migrations/
│   └── config/
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/
│   └── k8s/                  # (opsional, tahap produksi)
├── docs/
│   └── api/                  # Swagger / OpenAPI spec
├── turbo.json                # Turborepo config
└── package.json
```

### Stack Lengkap

| Layer             | Teknologi                                       |
| ----------------- | ----------------------------------------------- |
| Frontend Web      | Next.js 15, Tailwind CSS, shadcn/ui             |
| Frontend Mobile   | React Native (Expo SDK), NativeWind             |
| Frontend Desktop  | Tauri + Web (reuse Next.js)                     |
| State Management  | Zustand + React Query (TanStack Query)          |
| Backend           | Golang + Gin/Fiber                              |
| ORM               | GORM                                            |
| Database Utama    | PostgreSQL 16                                   |
| Cache             | Redis                                           |
| Search            | PostgreSQL FTS atau Meilisearch                 |
| Auth              | JWT + Refresh Token                             |
| File Storage      | S3-compatible (MinIO self-host / Cloudflare R2) |
| Push Notification | Firebase Cloud Messaging (FCM)                  |
| Monorepo Tool     | Turborepo + pnpm workspaces                     |

---

## 3. Modul-Modul Aplikasi

---

### 3.1 Modul Al-Qur'an

**Deskripsi:** Baca, dengar, dan pelajari Al-Qur'an lengkap dengan terjemahan dan tafsir.

#### Fitur

- **Tampilan mushaf** — per halaman (layout mushaf Madinah) atau per ayat
- **Terjemahan** — tersedia multi-bahasa (Indonesia, Inggris, Arab)
- **Audio murattal** — multi-qori (Mishary, Al-Husary, Abdul Basit, dll)
- **Pencarian** — cari ayat by keyword (Arab/terjemahan)
- **Navigasi** — by surah, by juz, by halaman, by hizb
- **Bookmark & highlight** — simpan ayat favorit dengan warna/label
- **Catatan pribadi** — per ayat
- **Mode baca** — malam/siang, ukuran font adjustable
- **Hafalan mode** — sembunyikan ayat, uji hafalan
- **Riwayat bacaan** — terakhir dibaca, progress per juz
- **Tilawah tracker** — target khatam, progress harian

#### Data Model (ringkasan)

```go
type Surah struct {
    ID             uint
    NomorSurah     int
    NamaArab       string
    NamaLatin      string
    NamaIndonesia  string
    Arti            string
    JumlahAyat     int
    JenisWahyu     string  // makkiyah / madaniyah
    Urutan         int     // urutan turun
    Ayat           []Ayat
}

type Ayat struct {
    ID             uint
    SurahID        uint
    NomorAyat      int
    TeksArab       string
    TeksLatin      string  // transliterasi
    Terjemahan     []TerjemahanAyat
    AudioURL       []AudioAyat
    Tafsir         []TafsirAyat
    JuzKe          int
    HalamanMushaf  int
    HizbKe         int
}
```

---

### 3.2 Modul Hadis

**Deskripsi:** Lanjutan dari apps hadis yang sudah ada — kini terintegrasi dalam platform.

> Lihat spesifikasi detail di `spesifikasi-apps-hadis.md`

#### Enhancement dalam konteks platform ini

- **Pencarian hadis** dari halaman global search
- **Hadis harian** — tampil di beranda (random / tematik / terjadwal)
- **Kaitan hadis dengan ayat** — link hadis ke ayat terkait (dan sebaliknya)
- **Koleksi pribadi** — user bisa simpan hadis favorit
- **Share hadis** — generate gambar hadis untuk sosmed (card generator)

---

### 3.3 Modul Jadwal Shalat & Adzan

**Deskripsi:** Jadwal shalat otomatis berdasarkan lokasi, dengan notifikasi adzan.

#### Fitur

- **Deteksi lokasi otomatis** (GPS) atau input manual kota
- **Jadwal 5 waktu** + Syuruq, Dhuha, Imsak, Tengah malam
- **Metode perhitungan** (Kemenag RI, MWL, ISNA, Umm al-Qura, dll)
- **Madzhab shalat Ashar** (Syafi'i / Hanafi)
- **Koreksi manual** per waktu (+/- menit)
- **Notifikasi adzan** — pilih suara muadzin
- **Adzan subuh** — Fajr dengan Allahu Akbar 2x
- **Countdown** ke waktu shalat berikutnya
- **Widget** — mobile home screen widget
- **Offline** — simpan jadwal lokal untuk 30 hari ke depan
- **Zona waktu** — otomatis sesuai perangkat

#### Algoritma Shalat

Implementasi menggunakan library perhitungan yang sudah teruji (Adhan-go untuk backend, adhan-js untuk frontend):

```go
type WaktuShalat struct {
    Fajr     time.Time
    Syuruq   time.Time
    Dhuha    time.Time
    Dzuhur   time.Time
    Ashar    time.Time
    Maghrib  time.Time
    Isya     time.Time
    Imsak    time.Time
}
```

---

### 3.4 Modul Kiblat

**Deskripsi:** Penunjuk arah kiblat berbasis kompas dan AR.

#### Fitur

- **Kompas kiblat** — arah kiblat berdasarkan GPS user
- **Derajat kiblat** — tampilkan sudut dari utara
- **Mode AR** _(mobile only)_ — overlay kamera dengan arah kiblat
- **Jarak ke Mekah** — tampilkan jarak dari lokasi user
- **Offline** — tersimpan untuk lokasi terakhir

---

### 3.5 Modul Dzikir & Doa

**Deskripsi:** Koleksi dzikir harian, doa dari Al-Qur'an & hadis, dan tasbih digital.

#### Fitur

- **Dzikir pagi & petang** — teks Arab + terjemahan + audio
- **Dzikir setelah shalat** — urutan lengkap
- **Tasbih digital** — counter + getaran, bisa set target
- **Doa dari Al-Qur'an** — dengan referensi ayat
- **Doa from hadis** — dengan referensi hadis (link ke modul hadis)
- **Kategori doa** — makan, tidur, keluar rumah, naik kendaraan, dll
- **Doa Asmaul Husna**
- **Dzikir tracker** — cek apakah sudah dzikir pagi/petang hari ini
- **Wirid custom** — user bisa buat wirid sendiri

#### Data Model

```go
type Dzikir struct {
    ID          uint
    Judul       string
    TeksArab    string
    TeksLatin   string
    Terjemahan  string
    Faedah      string
    Sumber      string  // referensi hadis/ayat
    JumlahKali  int     // berapa kali dibaca
    Kategori    string  // pagi/petang/setelah_shalat/umum
    Urutan      int
    AudioURL    string
}

type Doa struct {
    ID          uint
    Judul       string
    TeksArab    string
    TeksLatin   string
    Terjemahan  string
    Sumber      string
    Kategori    string
    AyatID      *uint   // jika dari Al-Qur'an
    HadisID     *uint   // jika dari hadis
}
```

---

### 3.6 Modul Tafsir

**Deskripsi:** Tafsir Al-Qur'an multi-kitab, terintegrasi dengan modul Qur'an.

#### Fitur

- **Multi-kitab tafsir** — Ibnu Katsir, Al-Jalalayn, Al-Muyassar, Kemenag RI
- **Per-ayat** — tampil di halaman detail ayat
- **Perbandingan** — bandingkan tafsir dari dua kitab berbeda
- **Asbabun Nuzul** — sebab turunnya ayat (jika ada)
- **Munasabah** — keterkaitan antar ayat
- **Pencarian** dalam teks tafsir

#### Data Model

```go
type KitabTafsir struct {
    ID      uint
    Nama    string
    Penulis string
    Bahasa  string
    Ringkasan string
}

type TafsirAyat struct {
    ID           uint
    AyatID       uint
    KitabTafsirID uint
    KitabTafsir  KitabTafsir
    Teks         string `gorm:"type:text"`
    AsbabNuzul   string `gorm:"type:text"`
    Munasabah    string `gorm:"type:text"`
}
```

---

### 3.7 Modul Asmaul Husna

**Deskripsi:** 99 nama Allah beserta makna, penjelasan, dan wirid.

#### Fitur

- **List 99 nama** — Arab, latin, arti
- **Detail per nama** — makna mendalam, dalil ayat/hadis, doa terkait
- **Audio** — pelafalan tiap nama
- **Flashcard mode** — untuk hafalan
- **Wirid Asmaul Husna** — dengan counter tasbih

---

### 3.8 Modul Kalender Hijriyah

**Deskripsi:** Konversi tanggal dan info hari-hari penting Islam.

#### Fitur

- **Kalender dual** — tampilkan Masehi & Hijriyah bersamaan
- **Konversi tanggal** — Hijriyah ↔ Masehi
- **Hari-hari istimewa** — Ramadan, Idul Fitri, Idul Adha, Maulid, Isra Mi'raj, dll
- **Reminder otomatis** untuk hari-hari istimewa
- **Puasa sunnah** — kalender lengkap (Senin-Kamis, Ayyamul Bidh, Dawud, Syawal, dll)
- **Countdown Ramadan**

#### Data Model

```go
type HariIstimewa struct {
    ID             uint
    Nama           string
    NamaBulanHijri int
    TanggalHijri   int
    Deskripsi      string
    Kategori       string  // hari_raya/puasa_wajib/puasa_sunnah/sejarah
    Tahunan        bool
}
```

---

### 3.9 Modul Zakat & Infaq

**Deskripsi:** Kalkulator zakat lengkap dan panduan infaq/sedekah.

#### Fitur

**Kalkulator Zakat:**

- Zakat Fitrah — hitung per jiwa, konversi beras/uang
- Zakat Maal — harta, emas, perak, tabungan
- Zakat Penghasilan/Profesi
- Zakat Perdagangan
- Zakat Pertanian
- Zakat Emas & Perak — input berat + harga pasar terkini

**Info:**

- Nisab harian (harga emas/perak dari API)
- Penjelasan 8 asnaf mustahiq zakat
- Panduan bayar zakat online (link ke lembaga zakat terpercaya)
- Riwayat zakat — user bisa catat zakat yang sudah dibayar

#### Data Model

```go
type KalkulasiZakat struct {
    ID          uint
    UserID      uint
    JenisZakat  string
    NilaiHarta  float64
    NisabSaat   float64
    JumlahZakat float64
    TanggalHitung time.Time
    Dibayar     bool
    TanggalBayar *time.Time
    Catatan     string
}
```

---

### 3.10 Modul Kalkulator Waris (Faraidh)

**Deskripsi:** Kalkulator pembagian harta warisan sesuai hukum Islam (ilmu faraidh).

#### Fitur

- **Input ahli waris** — pilih hubungan keluarga (anak laki, anak perempuan, istri, suami, ayah, ibu, saudara, dll)
- **Input total harta** + biaya sebelum dibagi (hutang, wasiat, kafan, dll)
- **Hasil perhitungan otomatis** — bagian masing-masing (pecahan + nominal)
- **Penjelasan dasar hukum** — ayat/hadis yang mendasari tiap perhitungan
- **Kasus hajb (penghalang)** — siapa yang terhalang oleh siapa
- **Export hasil** ke PDF

#### Logika Faraidh

```
Prioritas ahli waris:
1. Ashabul furudh (pemilik bagian tetap: 1/2, 1/4, 1/8, 2/3, 1/3, 1/6)
2. Ashabah (penerima sisa)
3. Dzawil arham (jika tidak ada ashabah)

Kasus khusus yang ditangani:
- 'Aul (harta kurang, semua bagian dikurangi proporsional)
- Radd (harta lebih, dikembalikan ke ahli waris)
- Hajb hirman (terhalang sepenuhnya)
- Hajb nuqshan (bagian dikurangi)
```

---

### 3.11 Modul Siroh & Sejarah Islam

**Deskripsi:** Sejarah Islam dari masa Nabi hingga era modern, disajikan interaktif.

#### Fitur

- **Timeline Siroh Nabawiyah** — kelahiran Nabi, kenabian, hijrah, perang, wafat
- **Khulafaur Rasyidin** — biografi dan pencapaian
- **Dinasti Islam** — Umayyah, Abbasiyah, Utsmani, dll
- **Tokoh-tokoh Islam** — ulama, pemimpin, ilmuwan Muslim
- **Peta interaktif** — persebaran Islam di peta dunia + timeline
- **Peristiwa penting** — Perang Badar, Uhud, Khandaq, Futuh Makkah
- **Kaitan dengan Hadis** — link ke hadis tentang peristiwa terkait

#### Data Model

```go
type PeristiwaTarikh struct {
    ID          uint
    Judul       string
    TahunHijri  int
    TahunMasehi int
    Deskripsi   string `gorm:"type:text"`
    Kategori    string // siroh/khulafa/dinasti/perang/tokoh
    Lokasi      string
    Lat         *float64
    Lng         *float64
    Gambar      string
    HadisID     []uint `gorm:"-"` // link ke hadis terkait
    AyatID      []uint `gorm:"-"` // link ke ayat terkait
}
```

---

### 3.12 Modul Konten Islami (Artikel & Ceramah)

**Deskripsi:** Platform konten edukatif — artikel fiqih, aqidah, akhlak, ceramah video/audio.

#### Fitur

- **Artikel** — tulis, edit, publish (rich text + teks Arab)
- **Kategori** — fiqih, aqidah, akhlak, muamalah, tazkiyatun nafs
- **Ceramah** — embed video (YouTube) atau upload audio
- **Kutipan dalil** — terintegrasi langsung dengan modul Qur'an & Hadis
- **Editor role** — konten bisa ditulis oleh editor/ustaz terverifikasi
- **Komentar & diskusi** per artikel
- **Bookmark** artikel
- **Rekomenasi** artikel terkait

---

### 3.13 Modul Komunitas & Forum (Tanya-Jawab)

**Deskripsi:** Forum tanya-jawab islami yang moderat dan terstruktur.

#### Fitur

- **Pertanyaan & jawaban** — format Q&A (seperti StackExchange)
- **Kategori** — fiqih, aqidah, muamalah, ibadah, dll
- **Tag** per pertanyaan
- **Upvote/Downvote** jawaban
- **Tandai jawaban terbaik** (oleh penanya atau moderator)
- **Moderasi** — lapor konten, queue moderator
- **Ustaz/Scholar badge** — akun terverifikasi untuk ulama
- **Cari di forum** sebelum tanya (duplikasi detection)

---

### 3.14 Modul Gamifikasi & Streak

**Deskripsi:** Sistem motivasi untuk konsistensi ibadah dan belajar harian.

#### Fitur

- **Streak dzikir** — berapa hari berturut-turut dzikir pagi/petang
- **Streak tilawah** — target ayat/hari
- **Target ramadan** — khatam Qur'an tracker
- **Badge/achievement** — milestone ibadah (khatam 1x, streak 30 hari, dll)
- **Poin & level** — aktivitas mendapat poin
- **Reminder ibadah** — notifikasi personal jika streak hampir putus
- **Statistik personal** — grafik ibadah mingguan/bulanan

#### Data Model

```go
type UserActivity struct {
    ID          uint
    UserID      uint
    TipAktivitas string  // tilawah/dzikir_pagi/dzikir_petang/shalat
    TanggalLog  time.Time
    Detail      string  // berapa ayat, berapa kali, dll (JSON)
}

type UserStreak struct {
    ID           uint
    UserID       uint
    TipeStreak   string
    StreakCount   int
    TanggalMulai time.Time
    TerakhirLog  time.Time
}

type Achievement struct {
    ID          uint
    Kode        string `gorm:"uniqueIndex"`
    Nama        string
    Deskripsi   string
    Icon        string
    Syarat      string  // JSON condition
}
```

---

### 3.15 Modul Notifikasi & Reminder

**Deskripsi:** Sistem notifikasi terpusat untuk semua modul.

#### Jenis Notifikasi

| Tipe              | Trigger                           |
| ----------------- | --------------------------------- |
| Adzan             | Waktu shalat masuk                |
| Dzikir Pagi       | Setelah Subuh (configurable)      |
| Dzikir Petang     | Setelah Ashar (configurable)      |
| Hari Istimewa     | H-1 atau pagi hari                |
| Streak reminder   | Jika belum ada aktivitas hari ini |
| Ramadan countdown | H-7, H-3, H-1                     |
| Zakat alert       | Jika harta sudah melewati nisab   |
| Hadis harian      | Waktu custom user                 |
| Ayat harian       | Waktu custom user                 |

#### Implementasi

- **Mobile** — FCM Push Notification
- **Web** — Web Push API (service worker)
- **Desktop** — OS native notification
- **Semua** — in-app notification center

---

## 4. Database Schema Lengkap

### Overview Tabel

```
CORE:
users, user_profiles, user_settings, user_achievements, user_streaks, user_activities

QUR'AN:
surahs, ayahs, translations, audio_ayah, bookmarks_quran, quran_notes, quran_progress

HADIS: (lihat spesifikasi-apps-hadis.md)
hadis, perawi, sanad, mata_sanad, jarh_tadil, kitab, bab, takhrij, tags

SHALAT:
prayer_times_cache, prayer_settings, adhan_settings

DZIKIR & DOA:
dzikir, doa, dzikir_collections, dzikir_user_log

TAFSIR:
kitab_tafsir, tafsir_ayah

KALENDER:
hari_istimewa, user_reminders

ZAKAT:
kalkulasi_zakat, nisab_history

FARAIDH:
(stateless — dihitung di backend, tidak disimpan kecuali user simpan)
saved_faraidh_calculations

SIROH:
peristiwa_tarikh, tokoh_tarikh, lokasi_tarikh

KONTEN:
articles, article_categories, article_tags, article_comments
ceramah, ceramah_categories

KOMUNITAS:
forum_questions, forum_answers, forum_votes, forum_tags

GAMIFIKASI:
achievements, user_achievements, user_streaks, user_activity_log, user_points

NOTIFIKASI:
notification_templates, user_notifications, user_notification_settings, push_tokens
```

### Tabel Users (Inti)

```go
type User struct {
    gorm.Model
    Email         string    `gorm:"uniqueIndex;not null"`
    Username      string    `gorm:"uniqueIndex"`
    PasswordHash  string    `gorm:"not null"`
    NamaLengkap   string
    AvatarURL     string
    Role          string    `gorm:"default:user"` // user, editor, ustaz, admin
    EmailVerified bool      `gorm:"default:false"`
    Provider      string    `gorm:"default:email"` // email, google, apple
    ProviderID    string
    LastLoginAt   *time.Time
    IsActive      bool      `gorm:"default:true"`
    Profile       UserProfile
    Settings      UserSettings
}

type UserProfile struct {
    gorm.Model
    UserID        uint      `gorm:"uniqueIndex"`
    Negara        string
    Kota          string
    Madzhab       string    // syafii, hanafi, maliki, hanbali
    BahasaApp     string    `gorm:"default:id"` // id, en, ar
    Bio           string
}

type UserSettings struct {
    gorm.Model
    UserID             uint   `gorm:"uniqueIndex"`
    MetodePerhitunganShalat string
    KoreksiShalat      string `gorm:"type:jsonb"` // {fajr:0, dhuha:0, ...}
    SuaraMuadzin       string
    FontSizeQuran      int    `gorm:"default:22"`
    TampilLatin        bool   `gorm:"default:true"`
    TampilTerjemahan   bool   `gorm:"default:true"`
    DarkMode           bool   `gorm:"default:false"`
    NotifAdzan         bool   `gorm:"default:true"`
    NotifDzikir        bool   `gorm:"default:true"`
    NotifHarianHadis   bool   `gorm:"default:true"`
    WaktuNotifHadis    string `gorm:"default:'07:00'"`
}
```

---

## 5. API Endpoints Lengkap

### Base URL: `/api/v1`

### 5.1 Auth

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email
POST   /auth/google          # OAuth Google
GET    /auth/me
```

### 5.2 Al-Qur'an

```
GET    /quran/surahs                    # List surah
GET    /quran/surahs/:id                # Detail surah + ayat
GET    /quran/ayahs/:id                 # Detail satu ayat
GET    /quran/juz/:nomorJuz             # Ayat per juz
GET    /quran/page/:nomorHalaman        # Ayat per halaman mushaf
GET    /quran/search?q=                 # Search ayat
GET    /quran/random                    # Ayat acak (untuk beranda)
GET    /quran/audio/:qoriID/surah/:surahID  # URL audio murattal
POST   /quran/bookmarks                 # Simpan bookmark
GET    /quran/bookmarks                 # List bookmark user
DELETE /quran/bookmarks/:id
POST   /quran/notes                     # Tambah catatan ayat
GET    /quran/notes/:ayahId
PUT    /quran/progress                  # Update posisi terakhir baca
GET    /quran/progress                  # Ambil posisi terakhir + statistik
```

### 5.3 Hadis _(lihat spesifikasi-apps-hadis.md, tambahan:)_

```
GET    /hadis/daily                     # Hadis harian
GET    /hadis/:id/share-image           # Generate card gambar hadis
POST   /hadis/:id/bookmark              # Simpan hadis favorit
GET    /hadis/bookmarks                 # Hadis tersimpan user
```

### 5.4 Jadwal Shalat

```
GET    /prayer-times?lat=&lng=&date=    # Jadwal shalat by koordinat
GET    /prayer-times/monthly?lat=&lng=&month=&year=  # Jadwal bulanan
GET    /prayer-times/city?city=&country= # Jadwal by nama kota
PUT    /prayer-settings                 # Update preferensi user
GET    /prayer-settings
```

### 5.5 Kiblat

```
GET    /qibla?lat=&lng=                 # Arah kiblat + jarak ke Mekah
```

### 5.6 Dzikir & Doa

```
GET    /dzikir                          # List semua dzikir
GET    /dzikir/:id                      # Detail dzikir
GET    /dzikir/pagi                     # Dzikir pagi
GET    /dzikir/petang                   # Dzikir petang
GET    /dzikir/setelah-shalat           # Dzikir setelah shalat
GET    /doa                             # List semua doa
GET    /doa/:id                         # Detail doa
GET    /doa/kategori/:kategori          # Doa per kategori
POST   /dzikir/log                      # Log dzikir user
GET    /dzikir/log/today                # Cek dzikir hari ini
POST   /wirid/custom                    # Buat wirid custom
GET    /wirid/custom                    # List wirid custom user
```

### 5.7 Tafsir

```
GET    /tafsir/kitab                    # List kitab tafsir
GET    /tafsir/ayah/:ayahId             # Semua tafsir untuk satu ayat
GET    /tafsir/ayah/:ayahId/kitab/:kitabId  # Tafsir spesifik kitab
```

### 5.8 Asmaul Husna

```
GET    /asmaul-husna                    # List 99 nama
GET    /asmaul-husna/:id                # Detail satu nama
```

### 5.9 Kalender Hijriyah

```
GET    /hijri/convert?date=             # Konversi Masehi → Hijriyah
GET    /hijri/convert-from?hijri=       # Konversi Hijriyah → Masehi
GET    /hijri/events                    # Hari-hari istimewa tahun ini
GET    /hijri/events/:bulanHijri        # Events per bulan
GET    /hijri/today                     # Tanggal hijriyah hari ini + event
```

### 5.10 Zakat

```
GET    /zakat/nisab                     # Nisab terkini (gold/silver price)
POST   /zakat/calculate/fitrah          # Hitung zakat fitrah
POST   /zakat/calculate/maal            # Hitung zakat maal
POST   /zakat/calculate/profesi         # Hitung zakat profesi
POST   /zakat/calculate/perdagangan
POST   /zakat/calculate/emas
GET    /zakat/history                   # Riwayat kalkulasi user
POST   /zakat/history                   # Simpan kalkulasi
```

### 5.11 Faraidh (Kalkulator Waris)

```
POST   /faraidh/calculate               # Hitung pembagian waris
POST   /faraidh/save                    # Simpan hasil kalkulasi
GET    /faraidh/saved                   # Riwayat kalkulasi tersimpan
GET    /faraidh/saved/:id
```

### 5.12 Siroh

```
GET    /tarikh/events                   # List peristiwa
GET    /tarikh/events/:id               # Detail peristiwa
GET    /tarikh/events?era=&kategori=    # Filter
GET    /tarikh/tokoh                    # List tokoh
GET    /tarikh/tokoh/:id                # Detail tokoh
GET    /tarikh/timeline                 # Timeline data untuk visualisasi
```

### 5.13 Konten

```
GET    /articles                        # List artikel
GET    /articles/:slug                  # Detail artikel
GET    /articles?kategori=&tag=
POST   /articles                        # [editor] Tambah artikel
PUT    /articles/:id                    # [editor] Edit
DELETE /articles/:id                    # [admin/editor]
POST   /articles/:id/comments
GET    /articles/:id/comments
GET    /ceramah
GET    /ceramah/:id
POST   /ceramah                         # [editor] Tambah ceramah
```

### 5.14 Forum

```
GET    /forum/questions
GET    /forum/questions/:id
POST   /forum/questions                 # Buat pertanyaan baru
PUT    /forum/questions/:id
GET    /forum/questions/:id/answers
POST   /forum/questions/:id/answers    # Jawab pertanyaan
PUT    /forum/answers/:id
POST   /forum/answers/:id/vote         # Upvote/downvote
PUT    /forum/questions/:id/best-answer/:answerId
```

### 5.15 Gamifikasi

```
GET    /user/streaks                    # Semua streak user
GET    /user/achievements               # Achievement yang sudah diraih
GET    /user/points                     # Total poin
GET    /user/stats                      # Statistik ibadah (grafik)
POST   /user/activity                   # Log aktivitas
GET    /achievements                    # Semua achievement yang tersedia
```

### 5.16 Notifikasi

```
GET    /notifications                   # Inbox notifikasi
PUT    /notifications/:id/read
PUT    /notifications/read-all
DELETE /notifications/:id
POST   /push-tokens                     # Daftar device token FCM
DELETE /push-tokens/:token
GET    /notification-settings
PUT    /notification-settings
```

### 5.17 Search Global

```
GET    /search?q=&type=                 # type: all|quran|hadis|artikel|tokoh|doa
```

---

## 6. Arsitektur Frontend

### 6.1 Shared Component Library (`packages/ui`)

```
packages/ui/
├── components/
│   ├── ArabicText/         # RTL text + font khusus
│   ├── AyahCard/           # Kartu ayat
│   ├── HadisCard/          # Kartu hadis
│   ├── PrayerTimesWidget/  # Widget jadwal shalat
│   ├── DzikirCounter/      # Tasbih digital
│   ├── StreakBadge/        # Badge streak
│   ├── QiblaCompass/       # Kompas kiblat
│   ├── SanadTree/          # Pohon sanad (web only)
│   ├── IslamicCalendar/    # Kalender hijriyah
│   └── ShareCard/          # Generator kartu share
├── hooks/
│   ├── usePrayerTimes.ts
│   ├── useQibla.ts
│   ├── useHijriDate.ts
│   ├── useQuranAudio.ts
│   └── useStreak.ts
└── utils/
    ├── arabic.ts           # Normalisasi teks Arab
    ├── hijri.ts            # Konversi tanggal
    └── prayer.ts           # Utility waktu shalat
```

### 6.2 Web App — Struktur Halaman (Next.js)

```
app/
├── (home)/
│   └── page.tsx                    # Beranda: waktu shalat, hadis harian, progress
├── quran/
│   ├── page.tsx                    # List surah
│   ├── [surahId]/page.tsx          # Baca per surah
│   ├── juz/[juzId]/page.tsx
│   └── search/page.tsx
├── hadis/                          # (dari spek hadis sebelumnya)
├── prayer/
│   └── page.tsx                    # Jadwal shalat + pengaturan
├── qibla/
│   └── page.tsx
├── dzikir/
│   ├── page.tsx                    # Pilih dzikir
│   └── [id]/page.tsx               # Mode baca dzikir
├── doa/
│   ├── page.tsx
│   └── [kategori]/page.tsx
├── zakat/
│   ├── page.tsx
│   └── [jenis]/page.tsx
├── faraidh/
│   └── page.tsx
├── tarikh/
│   ├── page.tsx
│   ├── [eventId]/page.tsx
│   └── tokoh/[id]/page.tsx
├── artikel/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── forum/
│   ├── page.tsx
│   └── [id]/page.tsx
├── profile/
│   ├── page.tsx                    # Profil + statistik
│   └── settings/page.tsx
└── (admin)/
    ├── dashboard/
    ├── hadis/
    ├── perawi/
    ├── quran/
    ├── artikel/
    └── users/
```

### 6.3 Mobile App — Navigasi (React Native)

```
Tab Navigator (Bottom Tabs):
├── 🏠 Beranda         — waktu shalat countdown, aktivitas hari ini
├── 📖 Qur'an          — baca Al-Qur'an
├── 📿 Ibadah          — dzikir, doa, tasbih, kiblat
├── 📚 Ilmu            — hadis, tafsir, artikel, siroh
└── 👤 Profil          — statistik, pengaturan, achievement

Modal / Stack:
├── Adzan Settings
├── Kiblat AR Mode
├── Share Hadis/Ayat
└── Notifikasi
```

### 6.4 Beranda (Home Dashboard)

```
┌─────────────────────────────────────────┐
│  Assalamu'alaikum, Ahmad  🌙            │
│  Selasa, 6 Mei 2025 | 8 Dzulqo'dah    │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │  DZUHUR • 12:03  │  1j 23m lagi  │  │
│  │  ████████████░░░░░░░░  65%        │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  🔥 Streak Dzikir: 7 hari  [Dzikir »]  │
│  📖 Tilawah: 2/5 halaman hari ini       │
├─────────────────────────────────────────┤
│  HADIS HARI INI                         │
│  "إِنَّمَا الأَعْمَالُ بِالنِّيَّات..."    │
│  — HR. Bukhari No. 1  [Baca selengkapnya]│
├─────────────────────────────────────────┤
│  AYAT HARI INI — Al-Baqarah: 286        │
├─────────────────────────────────────────┤
│  📅  Besok: Ayyamul Bidh (13 Dzulqo'dah)│
└─────────────────────────────────────────┘
```

---

## 7. Autentikasi & User System

### Flow Auth

```
Register → Verifikasi Email → Login → JWT Access Token (15 menit)
                                    → Refresh Token (30 hari, httpOnly cookie)

Login Sosial:
Google OAuth → callback → buat/login user → JWT
Apple Sign-In → callback → buat/login user → JWT (mobile)
```

### Role & Permission

| Role     | Akses                                          |
| -------- | ---------------------------------------------- |
| `guest`  | Baca konten publik, fitur terbatas tanpa login |
| `user`   | Semua fitur personal (bookmark, streak, forum) |
| `editor` | CRUD artikel, ceramah, konten                  |
| `ustaz`  | Badge ustaz terverifikasi di forum             |
| `admin`  | Full akses termasuk manajemen user & data      |

### Guest Mode

Fitur yang bisa diakses **tanpa login**:

- Baca Al-Qur'an + terjemahan
- Jadwal shalat (tanpa simpan)
- Kiblat
- Baca hadis, dzikir, doa
- Kalkulator zakat & faraidh
- Baca artikel & forum

Fitur yang **butuh login**:

- Bookmark, catatan, progress
- Streak & gamifikasi
- Tulis di forum
- Notifikasi personal
- Sinkronisasi antar perangkat

---

## 8. Integrasi Eksternal

| Layanan                   | Keperluan                    | API             |
| ------------------------- | ---------------------------- | --------------- |
| **Aladhan API**           | Fallback jadwal shalat       | aladhan.com/api |
| **Gold Price API**        | Harga emas untuk nisab zakat | goldapi.io / XE |
| **Google OAuth**          | Login sosial                 | Google Identity |
| **Apple Sign-In**         | Login iOS                    | Apple Auth      |
| **Firebase FCM**          | Push notification            | Firebase        |
| **Cloudflare R2 / MinIO** | Storage audio, gambar        | S3-compatible   |
| **Recite Quran API**      | Audio murattal fallback      | recitequran.com |
| **MapBox / Google Maps**  | Kiblat + peta siroh          | Maps API        |

---

## 9. Non-Functional Requirements

### Performa

- Response API < 200ms (cached), < 500ms (query kompleks)
- First Contentful Paint web < 1.5 detik
- Offline support untuk fitur inti (Qur'an, dzikir, jadwal shalat)
- Service Worker untuk web offline
- React Native offline dengan MMKV / SQLite lokal

### Offline-First (Mobile)

```
Data yang di-cache lokal di mobile:
- Semua surah & ayat (bundle dalam app)
- Jadwal shalat 30 hari ke depan
- Dzikir & doa (bundle dalam app)
- Asmaul Husna (bundle dalam app)
- Hadis yang di-bookmark
- Posisi terakhir baca Qur'an & hadis
```

### Aksesibilitas

- Dukungan screen reader (VoiceOver iOS, TalkBack Android)
- Ukuran font adjustable (teks Arab dan Latin)
- Mode malam/siang
- Kontras warna memenuhi WCAG AA
- RTL layout untuk tampilan teks Arab

### Keamanan

- HTTPS wajib
- Rate limiting semua endpoint publik
- Input sanitasi (XSS prevention)
- SQL injection prevention (via GORM parameterized queries)
- Moderasi konten forum (laporan + queue moderator)
- Tidak simpan password plaintext (bcrypt)

### Lokalisasi (i18n)

- Bahasa Indonesia (utama)
- Bahasa Inggris
- Bahasa Arab (opsional fase lanjut)
- Semua teks UI ditempatkan di file locale (`id.json`, `en.json`)

---

## 10. Roadmap & Fase Pengembangan

### Fase 1 — Fondasi (Bulan 1–2)

**Backend:**

- [x] Model & API hadis (sudah ada)
- [ ] Auth system (register, login, JWT, refresh token)
- [ ] User model + profile + settings
- [ ] Model & API Al-Qur'an (surah, ayat, terjemahan)
- [ ] API jadwal shalat (integrasi Adhan library)
- [ ] API dzikir & doa (seed data)
- [ ] API kiblat

**Frontend Web:**

- [ ] Setup monorepo (Turborepo + pnpm)
- [ ] Shared UI library dasar
- [ ] Halaman beranda
- [ ] Halaman Qur'an (baca + navigasi)
- [ ] Halaman jadwal shalat
- [ ] Halaman dzikir

### Fase 2 — Konten Inti (Bulan 2–3)

- [ ] Modul hadis terintegrasi (sanad, perawi — dari spek hadis)
- [ ] Modul tafsir
- [ ] Kalender hijriyah
- [ ] Asmaul Husna
- [ ] Kalkulator zakat
- [ ] Audio murattal Qur'an

**Mobile (Expo):**

- [ ] Setup project React Native
- [ ] Tab navigator + navigasi dasar
- [ ] Halaman Qur'an + audio
- [ ] Jadwal shalat + notifikasi adzan
- [ ] Kiblat + kompas

### Fase 3 — Personal & Gamifikasi (Bulan 3–4)

- [ ] Auth + user profile
- [ ] Bookmark Qur'an & hadis
- [ ] Progress tilawah + tracker
- [ ] Dzikir tracker + streak
- [ ] Achievement system
- [ ] Beranda personalisasi
- [ ] Notifikasi push (FCM)
- [ ] Sinkronisasi antar perangkat

### Fase 4 — Konten Lanjutan (Bulan 4–5)

- [ ] Kalkulator faraidh
- [ ] Modul siroh & tarikh
- [ ] Modul konten artikel
- [ ] Share hadis / ayat (card generator)
- [ ] Desktop app (Tauri wrapper)

### Fase 5 — Komunitas & Finalisasi (Bulan 5–6)

- [ ] Forum tanya-jawab
- [ ] Sistem moderasi
- [ ] Panel admin lengkap
- [ ] Optimasi performa & SEO (web)
- [ ] Testing & QA
- [ ] Dokumentasi API (Swagger)
- [ ] Beta launch

### Fase 6 — Growth (Pasca-launch)

- [ ] Notifikasi cerdas (AI recommendation)
- [ ] Versi bahasa Inggris
- [ ] App Store + Play Store publish
- [ ] Hadis companion (AI tanya hadis)
- [ ] Fitur donasi/wakaf online
- [ ] API publik untuk developer

---

## Catatan Akhir

### Prioritas Data Seed

Urutan data yang harus disiapkan sebelum launch:

1. Surah + Ayat + Terjemahan Indonesia
2. Hadis Kutubussittah (minimal Bukhari & Muslim)
3. Dzikir pagi, petang, setelah shalat
4. Doa harian (minimal 50 doa)
5. Asmaul Husna 99
6. Hari-hari istimewa Islam 5 tahun ke depan
7. Kitab tafsir (minimal 1: Kemenag RI)

### Lisensi Data

- Teks Al-Qur'an: domain publik
- Terjemahan Kemenag: perlu konfirmasi lisensi
- Hadis: domain publik (teks asli), terjemahan perlu perhatian
- Tafsir klasik (Ibnu Katsir, dll): domain publik
- Audio murattal: cek lisensi per qori

---

_Spesifikasi ini adalah living document._
_Nama aplikasi "Nūr" bersifat sementara dan bisa disesuaikan._
_Versi: 1.0 | Dibuat: Mei 2026_
