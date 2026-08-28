# Spesifikasi Aplikasi Hadis — v2.0

> Stack: **Golang** (backend/API) · **GORM** (ORM) · **Next.js** (frontend)

---

## Daftar Isi

1. [Overview Aplikasi](#1-overview-aplikasi)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Fitur & Modul](#5-fitur--modul)
6. [Frontend — Next.js](#6-frontend--nextjs)
7. [Business Logic & Rules](#7-business-logic--rules)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Roadmap Pengembangan](#9-roadmap-pengembangan)

---

## 1. Overview Aplikasi

### Tujuan

Platform digital untuk penelitian, pencarian, dan manajemen hadis secara komprehensif — mencakup teks hadis, data perawi, rantai sanad, klasifikasi, dan metodologi takhrij.

### Pengguna Target

| Tipe               | Kebutuhan Utama                         |
| ------------------ | --------------------------------------- |
| Peneliti/Akademisi | Takhrij, analisis sanad, jarh wa ta'dil |
| Mahasiswa          | Belajar ilmu hadis, referensi tugas     |
| Ustaz/Da'i         | Verifikasi hadis, pencarian tematik     |
| Umum               | Membaca dan mencari hadis sehari-hari   |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   Next.js (Frontend)                │
│    Pages: Hadis / Perawi / Sanad / Takhrij / Admin  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API / JSON
┌──────────────────────▼──────────────────────────────┐
│              Golang REST API (Gin/Echo/Fiber)        │
│   Handler → Service → Repository → GORM             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│          PostgreSQL (utama) + Redis (cache)          │
└─────────────────────────────────────────────────────┘
```

### Struktur Proyek Backend (Golang)

```
backend/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handler/          # HTTP handlers
│   ├── service/          # Business logic
│   ├── repository/       # DB queries via GORM
│   ├── model/            # GORM models
│   ├── dto/              # Request/Response structs
│   └── middleware/
├── pkg/
│   ├── database/
│   └── validator/
├── migrations/
└── config/
```

---

## 3. Database Schema

### 3.1 Tabel `hadis`

```go
type Hadis struct {
    gorm.Model
    NomorHadis      string    `gorm:"uniqueIndex;not null"`
    MatanArab       string    `gorm:"type:text;not null"`
    MatanLatin      string    `gorm:"type:text"`
    MatanTerjemahan string    `gorm:"type:text"`
    KitabID         uint
    Kitab           Kitab
    BabID           *uint
    Bab             *Bab
    KualitasHadis   string    `gorm:"type:varchar(20)"` // shahih, hasan, dhaif, maudhu
    JenisHadis      string    `gorm:"type:varchar(30)"` // qawli, fi'li, taqriri, shifati
    Sandaran        string    `gorm:"type:varchar(20)"` // marfu, mauquf, maqthu, qudsi
    Catatan         string    `gorm:"type:text"`
    Tags            []Tag     `gorm:"many2many:hadis_tags;"`
}
```

### 3.2 Tabel `perawi` _(BARU)_

```go
type Perawi struct {
    gorm.Model
    NamaArab        string    `gorm:"type:varchar(255);not null"`
    NamaLatin       string    `gorm:"type:varchar(255);not null"`
    NamaLengkap     string    `gorm:"type:text"`          // nama lengkap beserta nasab
    Kunyah          string    `gorm:"type:varchar(100)"`  // Abu Fulan / Umm Fulan
    Laqab           string    `gorm:"type:varchar(100)"`  // gelar / julukan
    Nisbah          string    `gorm:"type:varchar(100)"`  // al-Bukhari, al-Bashri, dll
    TahunLahir      *int
    TahunWafat      *int
    TahunHijri      bool      `gorm:"default:true"`       // apakah tahun dalam hijriyah
    TempatLahir     string    `gorm:"type:varchar(100)"`
    TempatWafat     string    `gorm:"type:varchar(100)"`
    Tabaqah         string    `gorm:"type:varchar(50)"`   // sahabat, tabi'in, tabi'ut tabi'in, dll
    StatusPerawi    string    `gorm:"type:varchar(20)"`   // tsiqah, dhaif, majhul, matruk, dll
    Biografis       string    `gorm:"type:text"`
    Guru            []Perawi  `gorm:"many2many:perawi_guru;joinForeignKey:MuridID;joinReferences:GuruID"`
    Murid           []Perawi  `gorm:"many2many:perawi_guru;joinForeignKey:GuruID;joinReferences:MuridID"`
    PenilaianJarh   []JarhTadil
}
```

### 3.3 Tabel `jarh_tadil` _(BARU)_

```go
type JarhTadil struct {
    gorm.Model
    PerawiID        uint
    Perawi          Perawi
    PenilaiID       uint      // perawi lain yang memberikan penilaian
    Penilai         Perawi    `gorm:"foreignKey:PenilaiID"`
    JenisNilai      string    `gorm:"type:varchar(10)"` // ta'dil / jarh
    Tingkat         int       `gorm:"check:tingkat BETWEEN 1 AND 7"`
    // Ta'dil: 1=tsiqah tsiqah, 2=tsiqah, 3=shaduq, 4=la ba'sa bihi, 5=maqbul, 6=majhul, 7=dhaif
    // Jarh:   1=layyin, 2=dhaif, 3=matruk, 4=muttaham bil kadzib, 5=kadzdzab/waddha'
    TeksNilai       string    `gorm:"type:varchar(255)"` // teks asli penilaian
    Sumber          string    `gorm:"type:varchar(255)"` // referensi kitab
    Halaman         string    `gorm:"type:varchar(50)"`
    Catatan         string    `gorm:"type:text"`
}
```

### 3.4 Tabel `sanad` _(BARU)_

```go
type Sanad struct {
    gorm.Model
    HadisID         uint      `gorm:"not null"`
    Hadis           Hadis
    NomorJalur      int       // jalur ke-1, ke-2, dst (untuk mutabi'/syahid)
    JenisSanad      string    `gorm:"type:varchar(20)"` // musnad, mursal, munqathi, mu'dhal, mu'allaq
    StatusSanad     string    `gorm:"type:varchar(20)"` // muttashil, munqathi
    Catatan         string    `gorm:"type:text"`
    MataSanad       []MataSanad `gorm:"foreignKey:SanadID;references:ID"`
}
```

### 3.5 Tabel `mata_sanad` _(BARU)_

```go
type MataSanad struct {
    gorm.Model
    SanadID         uint      `gorm:"not null"`
    PerawiID        uint      `gorm:"not null"`
    Perawi          Perawi
    Urutan          int       `gorm:"not null"` // 1=perawi pertama (Nabi/sahabat), dst
    MetodePeriwayatan string  `gorm:"type:varchar(30)"`
    // haddatsana, akhbarana, an'anah, anna, sami'tu, ra'aytu
    Catatan         string    `gorm:"type:text"`
}
```

### 3.6 Tabel `kitab`

```go
type Kitab struct {
    gorm.Model
    Nama            string    `gorm:"not null"`
    NamaArab        string
    PenulisPengarang string
    PenulisPengarangID *uint
    Pengarang       *Perawi
    TahunPenulisan  *int
    Kategori        string    `gorm:"type:varchar(50)"` // kutub_sittah, musnad, muwaththa, dll
    Keterangan      string    `gorm:"type:text"`
    Bab             []Bab
}
```

### 3.7 Tabel `bab`

```go
type Bab struct {
    gorm.Model
    KitabID         uint      `gorm:"not null"`
    NamaBab         string    `gorm:"not null"`
    NomoBab         int
    Deskripsi       string    `gorm:"type:text"`
}
```

### 3.8 Tabel `tag`

```go
type Tag struct {
    gorm.Model
    Nama            string    `gorm:"uniqueIndex;not null"`
    Kategori        string    `gorm:"type:varchar(50)"` // topik/hukum/ibadah/akhlak/dll
}
```

### 3.9 Tabel `takhrij` _(BARU)_

```go
type Takhrij struct {
    gorm.Model
    HadisID         uint      `gorm:"not null"`
    Hadis           Hadis
    KitabID         uint
    Kitab           Kitab
    NomorHadisKitab string    // nomor hadis dalam kitab referensi
    Halaman         string
    Jilid           string
    Catatan         string    `gorm:"type:text"`
}
```

### ERD (Ringkasan Relasi)

```
Hadis ──────── Sanad ──────── MataSanad ──── Perawi
  │               │                              │
  │           (per jalur)                   JarhTadil
  │                                             (guru-murid)
  ├── Kitab ── Bab
  ├── Tags (M2M)
  └── Takhrij (referensi kitab lain)
```

---

## 4. API Endpoints

### Base URL: `/api/v1`

### 4.1 Hadis

| Method   | Endpoint             | Deskripsi                                     |
| -------- | -------------------- | --------------------------------------------- |
| `GET`    | `/hadis`             | List hadis dengan filter & pagination         |
| `GET`    | `/hadis/:id`         | Detail hadis lengkap (sanad, perawi, takhrij) |
| `POST`   | `/hadis`             | Tambah hadis baru                             |
| `PUT`    | `/hadis/:id`         | Update hadis                                  |
| `DELETE` | `/hadis/:id`         | Hapus hadis                                   |
| `GET`    | `/hadis/search`      | Full-text search matan                        |
| `GET`    | `/hadis/:id/sanad`   | Sanad lengkap hadis tertentu                  |
| `GET`    | `/hadis/:id/takhrij` | Takhrij hadis di kitab-kitab lain             |

**Query Params `/hadis`:**

```
?q=          # search keyword
?kitab=      # filter by kitab ID
?kualitas=   # shahih|hasan|dhaif|maudhu
?jenis=      # qawli|fi'li|taqriri|qudsi
?sandaran=   # marfu|mauquf|maqthu
?tag=        # filter by tag
?page=       # pagination
?limit=      # jumlah per halaman (default: 20)
```

**Response Detail Hadis:**

```json
{
  "id": 1,
  "nomor_hadis": "BUK-001",
  "matan_arab": "...",
  "matan_terjemahan": "...",
  "kualitas": "shahih",
  "kitab": { "id": 1, "nama": "Shahih Bukhari" },
  "sanad": [
    {
      "id": 1,
      "nomor_jalur": 1,
      "jenis": "musnad",
      "mata_sanad": [
        {
          "urutan": 1,
          "perawi": {
            "id": 5,
            "nama_arab": "محمد بن إسماعيل البخاري",
            "nama_latin": "Muhammad ibn Ismail al-Bukhari",
            "tabaqah": "tabi'ut tabi'in",
            "status": "tsiqah tsiqah"
          },
          "metode": "haddatsana"
        }
      ]
    }
  ],
  "takhrij": [...]
}
```

---

### 4.2 Perawi

| Method | Endpoint                 | Deskripsi                          |
| ------ | ------------------------ | ---------------------------------- |
| `GET`  | `/perawi`                | List perawi                        |
| `GET`  | `/perawi/:id`            | Detail perawi                      |
| `POST` | `/perawi`                | Tambah perawi                      |
| `PUT`  | `/perawi/:id`            | Update perawi                      |
| `GET`  | `/perawi/:id/hadis`      | Hadis yang diriwayatkan perawi ini |
| `GET`  | `/perawi/:id/guru`       | Daftar guru perawi                 |
| `GET`  | `/perawi/:id/murid`      | Daftar murid perawi                |
| `GET`  | `/perawi/:id/jarh-tadil` | Penilaian jarh wa ta'dil perawi    |
| `GET`  | `/perawi/search`         | Cari perawi by nama                |

---

### 4.3 Sanad

| Method   | Endpoint                | Deskripsi                    |
| -------- | ----------------------- | ---------------------------- |
| `GET`    | `/sanad/:id`            | Detail satu jalur sanad      |
| `POST`   | `/sanad`                | Tambah jalur sanad           |
| `PUT`    | `/sanad/:id`            | Update sanad                 |
| `DELETE` | `/sanad/:id`            | Hapus sanad                  |
| `POST`   | `/sanad/:id/mata-sanad` | Tambah perawi ke dalam sanad |
| `PUT`    | `/mata-sanad/:id`       | Update mata sanad            |
| `DELETE` | `/mata-sanad/:id`       | Hapus satu mata sanad        |

---

### 4.4 Jarh wa Ta'dil

| Method   | Endpoint          | Deskripsi            |
| -------- | ----------------- | -------------------- |
| `GET`    | `/jarh-tadil`     | List semua penilaian |
| `POST`   | `/jarh-tadil`     | Tambah penilaian     |
| `PUT`    | `/jarh-tadil/:id` | Update penilaian     |
| `DELETE` | `/jarh-tadil/:id` | Hapus penilaian      |

---

### 4.5 Kitab & Bab

| Method | Endpoint         | Deskripsi                |
| ------ | ---------------- | ------------------------ |
| `GET`  | `/kitab`         | List semua kitab         |
| `GET`  | `/kitab/:id`     | Detail kitab             |
| `GET`  | `/kitab/:id/bab` | List bab dalam kitab     |
| `POST` | `/kitab`         | Tambah kitab             |
| `GET`  | `/bab/:id/hadis` | Hadis dalam bab tertentu |

---

### 4.6 Takhrij

| Method   | Endpoint       | Deskripsi                |
| -------- | -------------- | ------------------------ |
| `GET`    | `/takhrij`     | List takhrij             |
| `POST`   | `/takhrij`     | Tambah referensi takhrij |
| `PUT`    | `/takhrij/:id` | Update takhrij           |
| `DELETE` | `/takhrij/:id` | Hapus takhrij            |

---

### 4.7 Tags & Utility

| Method | Endpoint     | Deskripsi                                      |
| ------ | ------------ | ---------------------------------------------- |
| `GET`  | `/tags`      | List semua tag                                 |
| `POST` | `/tags`      | Tambah tag                                     |
| `GET`  | `/stats`     | Statistik database (jumlah hadis, perawi, dll) |
| `GET`  | `/search?q=` | Global search (hadis + perawi)                 |

---

## 5. Fitur & Modul

### 5.1 Modul Hadis _(sudah ada, perlu enhancement)_

- [x] CRUD hadis dasar
- [ ] Filter multi-parameter (kualitas, jenis, kitab, sandaran, tag)
- [ ] Full-text search matan (Arab & terjemahan)
- [ ] Export hadis ke PDF / Word
- [ ] Salin matan dengan format kutipan

### 5.2 Modul Perawi _(BARU)_

- [ ] Database perawi lengkap (nama, kunyah, laqab, nisbah)
- [ ] Info tabaqah (generasi perawi)
- [ ] Hubungan guru–murid (pohon sanad)
- [ ] Status dan reputasi perawi
- [ ] Detail biografi singkat
- [ ] Pencarian perawi by nama / tabaqah

### 5.3 Modul Sanad _(BARU)_

- [ ] Input rantai sanad per hadis (multi-jalur)
- [ ] Visualisasi pohon sanad (tree/diagram)
- [ ] Deteksi status sanad: muttashil, munqathi', mursal, dll
- [ ] Highlight perawi bermasalah (dhaif/matruk) dalam rantai
- [ ] Identifikasi syahid & mutabi'

### 5.4 Modul Jarh wa Ta'dil _(BARU)_

- [ ] Penilaian per perawi oleh ulama lain
- [ ] Tingkatan ta'dil (7 tingkat) dan jarh (5 tingkat)
- [ ] Referensi sumber kitab untuk setiap penilaian
- [ ] Kesimpulan status perawi (otomatis / manual)
- [ ] Perbandingan penilaian ulama berbeda terhadap satu perawi

### 5.5 Modul Takhrij _(BARU)_

- [ ] Mapping hadis ke referensi kitab lain
- [ ] Tampilkan di kitab mana saja hadis ini ditemukan
- [ ] Perbandingan matan antar riwayat (idhtirob)
- [ ] Catatan perbedaan lafaz (ziyadah/nuqshan)

### 5.6 Modul Pencarian & Filter _(BARU)_

- [ ] Pencarian by kata dalam matan (Arab/Indonesia)
- [ ] Pencarian by nama perawi
- [ ] Pencarian by tema/tag
- [ ] Filter kombinasi: kualitas + kitab + sanad
- [ ] Hasil pencarian dengan highlight keyword

### 5.7 Modul Admin _(BARU)_

- [ ] Dashboard statistik (jumlah hadis, perawi, dll)
- [ ] Manajemen user & role (admin, editor, viewer)
- [ ] Log aktivitas penambahan/perubahan data
- [ ] Import data bulk (JSON/CSV)

---

## 6. Frontend — Next.js

### 6.1 Struktur Halaman

```
app/
├── (public)/
│   ├── hadis/
│   │   ├── page.tsx            # List hadis + search
│   │   └── [id]/page.tsx       # Detail hadis + sanad
│   ├── perawi/
│   │   ├── page.tsx            # List perawi
│   │   └── [id]/page.tsx       # Detail perawi + jarh ta'dil
│   ├── kitab/
│   │   └── [id]/page.tsx       # Hadis per kitab
│   ├── search/page.tsx         # Halaman pencarian global
│   └── takhrij/[hadisId]/page.tsx
├── (admin)/
│   ├── dashboard/page.tsx
│   ├── hadis/
│   ├── perawi/
│   └── sanad/
└── layout.tsx
```

### 6.2 Komponen Utama

| Komponen         | Deskripsi                                          |
| ---------------- | -------------------------------------------------- |
| `HadisCard`      | Kartu ringkasan hadis (matan + kualitas badge)     |
| `HadisDetail`    | Halaman detail lengkap hadis                       |
| `SanadTree`      | Visualisasi pohon sanad (SVG / D3.js / react-flow) |
| `PerawiCard`     | Info ringkas perawi                                |
| `PerawiDetail`   | Profil lengkap perawi + jarh ta'dil                |
| `JarhTadilTable` | Tabel penilaian ulama terhadap perawi              |
| `MatanArab`      | Komponen khusus render teks Arab (RTL, font hadis) |
| `KualitasBadge`  | Badge warna untuk status hadis                     |
| `SearchBar`      | Global search dengan autocomplete                  |
| `SanadChain`     | Tampilan rantai sanad horizontal/vertikal          |
| `TakhrijList`    | List referensi kitab untuk satu hadis              |

### 6.3 Tampilan Halaman Detail Hadis

```
┌─────────────────────────────────────────────────────┐
│  [SHAHIH]  Hadis No. BUK-001 — Shahih Bukhari       │
├─────────────────────────────────────────────────────┤
│  مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا...                │  ← Arab (RTL)
│  Barangsiapa yang berdusta atas namaku...            │  ← Terjemahan
├─────────────────────────────────────────────────────┤
│  SANAD                                              │
│  Bukhari ← Muslim ← ... ← Abu Hurairah ← Nabi SAW  │  ← Chain view
│  [Lihat Pohon Sanad]                                │
├─────────────────────────────────────────────────────┤
│  PERAWI DALAM SANAD                                 │
│  1. Abu Hurairah — Sahabat — Tsiqah                 │
│  2. ...                                             │
├─────────────────────────────────────────────────────┤
│  TAKHRIJ (Ditemukan di)                             │
│  • Shahih Muslim No. 4        • Sunan Tirmidzi No.  │
├─────────────────────────────────────────────────────┤
│  KETERANGAN LAIN                                    │
│  Jenis: Qawli | Sandaran: Marfu' | Tags: [Ilmu]    │
└─────────────────────────────────────────────────────┘
```

### 6.4 Tampilan Halaman Detail Perawi

```
┌─────────────────────────────────────────────────────┐
│  Abu Hurairah                                       │
│  عبد الرحمن بن صخر الدوسي                           │
│  Tabaqah: Sahabat  |  Wafat: 57 H  |  [TSIQAH]     │
├─────────────────────────────────────────────────────┤
│  Biografi Singkat...                                │
├─────────────────────────────────────────────────────┤
│  JARH WA TA'DIL                                     │
│  ┌──────────────┬──────────┬──────────────────────┐ │
│  │ Penilai      │ Status   │ Keterangan           │ │
│  ├──────────────┼──────────┼──────────────────────┤ │
│  │ Ibn Hajar    │ Tsiqah   │ "tsiqatun huffazh"   │ │
│  │ Al-Dzahabi   │ Tsiqah   │ "hafizh shahabi"     │ │
│  └──────────────┴──────────┴──────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  GURU (10)        |  MURID (12)                     │
│  • Nabi SAW       |  • Ibn Sirin                   │
│  • ...            |  • ...                          │
├─────────────────────────────────────────────────────┤
│  HADIS YANG DIRIWAYATKAN (5374)                     │
└─────────────────────────────────────────────────────┘
```

### 6.5 Visualisasi Pohon Sanad

Gunakan **React Flow** atau **D3.js** untuk merender rantai sanad secara visual:

```
[Imam Bukhari]
      ↑
[Qutaibah ibn Sa'id]
      ↑
[Malik ibn Anas]
      ↑
[Nafi']
      ↑
[Abdullah ibn Umar]  ← Sahabat
      ↑
[Nabi Muhammad SAW]
```

Node tiap perawi bisa diwarnai berdasarkan status (hijau=tsiqah, kuning=shaduq, merah=dhaif/matruk).

---

## 7. Business Logic & Rules

### 7.1 Penentuan Kualitas Sanad (Otomatis)

```
IF semua perawi tsiqah AND sanad muttashil AND tidak syadz AND tidak mu'allal
  → Shahih li Dzatihi

ELSE IF ada perawi dengan tingkat ta'dil shaduq
  → Hasan li Dzatihi

ELSE IF ada perawi dhaif tapi ada penguat (mutabi'/syahid)
  → Hasan li Ghairihi / Shahih li Ghairihi

ELSE IF ada perawi matruk/kadzdzab
  → Maudhu' / Matruk
```

> _Catatan: Ini bersifat asistensi/saran, keputusan final tetap di tangan editor/peneliti._

### 7.2 Validasi Sanad

- Urutan perawi harus kronologis (wafat perawi berikutnya tidak lebih awal dari sebelumnya)
- Hubungan guru-murid harus valid (perawi yang tidak bertemu tidak boleh langsung terhubung)
- Sistem akan memberikan **warning** jika ada ketidakkonsistenan

### 7.3 Tingkatan Jarh wa Ta'dil

```
TA'DIL (Terpercaya):
  1 = Tsiqah Tsiqah / Hafizh Hujjah (tertinggi)
  2 = Tsiqah
  3 = Shaduq / La ba'sa bihi
  4 = Maqbul
  5 = Majhul al-Hal (paling rendah dari ta'dil)

JARH (Dicela):
  1 = Layyin / Fiihi Maqal (paling ringan)
  2 = Dha'if
  3 = Matruk
  4 = Muttaham bil Kadzib
  5 = Kadzdzab / Wadhdha' (paling berat)
```

---

## 8. Non-Functional Requirements

### 8.1 Performa

- Response API < 200ms untuk query sederhana
- Pagination wajib untuk semua list endpoint
- Index database pada kolom: `nomor_hadis`, `nama_latin` (perawi), `kitab_id`, `kualitas_hadis`
- Redis cache untuk data yang sering diakses (kitab list, tag list, perawi populer)

### 8.2 Keamanan

- JWT Authentication untuk endpoint admin
- Role-based access: `admin`, `editor`, `viewer`
- Input sanitasi dan validasi di level handler
- Rate limiting pada endpoint pencarian

### 8.3 Teks Arab

- Gunakan font **Noto Naskh Arabic** atau **Scheherazade** di frontend
- Semua field Arab harus RTL (`dir="rtl"`)
- Dukung harakat (tashkil) penuh dalam penyimpanan dan tampilan
- Pencarian Arab dengan/tanpa harakat (normalisasi sebelum search)

### 8.4 Aksesibilitas

- Dark mode support
- Font size adjustable untuk teks Arab
- Mobile responsive (prioritas untuk pembaca hadis)

---

## 9. Roadmap Pengembangan

### Fase 1 — Core Enhancement _(saat ini → 1 bulan)_

- [ ] Tambah tabel & model: `perawi`, `sanad`, `mata_sanad`
- [ ] API CRUD perawi
- [ ] API sanad (input rantai sanad untuk hadis yang sudah ada)
- [ ] Tampilkan sanad di halaman detail hadis (teks linear)
- [ ] Relasi hadis–kitab–bab di frontend

### Fase 2 — Ilmu Rijal _(1–2 bulan)_

- [ ] Tabel `jarh_tadil`
- [ ] Halaman detail perawi
- [ ] Hubungan guru–murid
- [ ] Filter hadis by perawi
- [ ] Badge status perawi di tampilan sanad

### Fase 3 — Visualisasi & Takhrij _(2–3 bulan)_

- [ ] Pohon sanad visual (React Flow / D3)
- [ ] Tabel `takhrij` dan halamannya
- [ ] Highlight perawi bermasalah di pohon sanad
- [ ] Export sanad ke gambar/PDF

### Fase 4 — Search & Analytics _(3–4 bulan)_

- [ ] Full-text search (PostgreSQL FTS / ElasticSearch)
- [ ] Search teks Arab dengan normalisasi harakat
- [ ] Filter kombinasi lanjutan
- [ ] Halaman statistik & dashboard

### Fase 5 — Admin & Kolaborasi _(4–6 bulan)_

- [ ] Panel admin lengkap
- [ ] Import data bulk (CSV/JSON)
- [ ] User management & role
- [ ] Audit log perubahan data
- [ ] API publik dengan dokumentasi (Swagger)

---

## Catatan Teknis Tambahan

### Migrasi dari Schema Lama

Jika tabel `hadis` sudah ada, tambahkan kolom baru secara bertahap menggunakan GORM AutoMigrate atau migration manual agar tidak merusak data yang sudah ada:

```go
db.AutoMigrate(&Perawi{}, &Sanad{}, &MataSanad{}, &JarhTadil{}, &Takhrij{})
db.AutoMigrate(&Hadis{}) // update kolom baru
```

### Font Arab (Next.js)

```js
// next.config.js — tambahkan font Arab
import { Noto_Naskh_Arabic } from "next/font/google";
const arabicFont = Noto_Naskh_Arabic({
    subsets: ["arabic"],
    weight: ["400", "700"],
});
```

### Teks Arab RTL (Tailwind)

```jsx
<p className='font-arabic text-2xl leading-loose text-right' dir='rtl'>
    {hadis.matan_arab}
</p>
```

---

_Spesifikasi ini bersifat living document — diperbarui seiring perkembangan proyek._
_Versi: 2.0 | Dibuat: Mei 2026_
