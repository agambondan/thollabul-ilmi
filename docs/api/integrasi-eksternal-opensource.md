# Integrasi Eksternal — Open Source & Gratis

> Semua layanan di bawah ini **gratis, open source, atau bisa self-host** — tanpa biaya API.
> Stack: Golang (backend) · Next.js + React Native (frontend)

---

## Daftar Isi

1. [Al-Qur'an](#1-al-quran)
2. [Hadis](#2-hadis)
3. [Jadwal Shalat & Waktu](#3-jadwal-shalat--waktu)
4. [Kiblat & Peta](#4-kiblat--peta)
5. [Dzikir & Doa (Azkar)](#5-dzikir--doa-azkar)
6. [Kalender Hijriyah](#6-kalender-hijriyah)
7. [Audio Murattal](#7-audio-murattal)
8. [Font & Tipografi Arab](#8-font--tipografi-arab)
9. [Notifikasi Push](#9-notifikasi-push)
10. [Search Engine (Self-host)](#10-search-engine-self-host)
11. [Data Harga Emas (Nisab Zakat)](#11-data-harga-emas-nisab-zakat)
12. [Dataset / Static JSON](#12-dataset--static-json)
13. [Library Golang](#13-library-golang)
14. [Library Frontend (JS/TS)](#14-library-frontend-jsts)
15. [Ringkasan Tabel](#15-ringkasan-tabel)

---

## 1. Al-Qur'an

### 🟢 Quran.com API v4 _(Direkomendasikan)_

- **URL:** `https://api.quran.com/api/v4`
- **Fitur:** teks Arab, terjemahan 80+ bahasa, tafsir, audio murattal, word-by-word, transliterasi, juz, halaman mushaf
- **Auth:** tidak butuh API key untuk endpoint publik
- **Rate limit:** tidak diumumkan, tapi wajar digunakan
- **Docs:** https://quran.api-docs.io/

```
GET https://api.quran.com/api/v4/chapters           # list surah
GET https://api.quran.com/api/v4/verses/by_chapter/1?translations=33  # ayat + terjemahan Indonesia (id=33)
GET https://api.quran.com/api/v4/resources/translations  # list terjemahan tersedia
GET https://api.quran.com/api/v4/resources/tafsirs  # list kitab tafsir
GET https://api.quran.com/api/v4/tafsirs/169/by_ayah/1:1  # tafsir spesifik
```

---

### 🟢 AlQuran.cloud API

- **URL:** `https://api.alquran.cloud/v1`
- **Fitur:** teks Arab, terjemahan, audio per ayat, juz, sajdah, manzil
- **Auth:** tidak butuh API key
- **Catatan:** alternatif / fallback Quran.com

```
GET https://api.alquran.cloud/v1/surah              # list surah
GET https://api.alquran.cloud/v1/ayah/1:1/editions/quran-uthmani,id.indonesian
GET https://api.alquran.cloud/v1/juz/1/quran-uthmani
```

---

### 🟢 fawazahmed0/quran-api _(Self-hosted / CDN)_

- **URL:** `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1`
- **Fitur:** 90+ bahasa, 400+ terjemahan, JSON file langsung dari CDN
- **Auth:** tidak butuh API key — akses langsung file JSON via CDN
- **GitHub:** https://github.com/fawazahmed0/quran-api
- **Ideal untuk:** bundle data offline ke app mobile

```
GET https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions.json
GET https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ind-indonesian/1/1.json
```

---

### 🟢 quranenc.com API _(Terjemahan & Tafsir)_

- **URL:** `https://quranenc.com/api/v1`
- **Fitur:** terjemahan & tafsir multi-bahasa dari King Fahd Complex
- **Auth:** tidak butuh API key

```
GET https://quranenc.com/api/v1/translation/sura/indonesian_sabiq/1
GET https://quranenc.com/api/v1/translation/aya/indonesian_sabiq/1/1
```

---

## 2. Hadis

### 🟢 fawazahmed0/hadith-api _(Self-hosted / CDN — Direkomendasikan)_

- **URL:** `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1`
- **Koleksi:** Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i, Ibn Majah, Malik, Ahmad + lainnya
- **Bahasa:** Arab, Inggris, dan beberapa bahasa lain
- **Auth:** tidak butuh — JSON via CDN
- **GitHub:** https://github.com/fawazahmed0/hadith-api
- **Ideal untuk:** seed database hadis kamu!

```
GET https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json
GET https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.json
GET https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/1.json
```

---

### 🟢 Sunnah.com API _(Request API Key Gratis)_

- **URL:** `https://api.sunnah.com/v1`
- **Koleksi:** Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i, Ibn Majah, Malik, Darimi, Ahmad
- **Auth:** butuh API key — **gratis**, minta via GitHub issue mereka
- **GitHub:** https://github.com/sunnah-com/api
- **Catatan:** bisa self-host (open source, Python/Flask + MySQL)

```
GET https://api.sunnah.com/v1/collections
GET https://api.sunnah.com/v1/collections/bukhari/hadiths?limit=50&page=1
GET https://api.sunnah.com/v1/collections/bukhari/hadiths/1
```

---

### 🟢 HadeethEnc.com API

- **URL:** `https://hadeethenc.com/api/v1`
- **Fitur:** hadis shahih pilihan + penjelasan + terjemahan 30+ bahasa termasuk Indonesia
- **Auth:** tidak butuh API key
- **Catatan:** bukan koleksi lengkap, fokus hadis pilihan dengan penjelasan ringkas

```
GET https://hadeethenc.com/api/v1/hadeeths/list/?language=id&page=1&per_page=20
GET https://hadeethenc.com/api/v1/hadeeths/one/?language=id&id=1
GET https://hadeethenc.com/api/v1/categories/roots/?language=id
```

---

### 🟢 hadith-api Indonesia _(REST API Bahasa Indonesia)_

- **GitHub:** https://github.com/nicolaics/hadith-api (atau mirror)
- **Fitur:** hadis 9 kitab dengan terjemahan Indonesia
- **Bisa self-host** — pakai sebagai referensi seed data

---

### 🟢 dorar.net _(Search Hadis Arab)_

- **URL:** `https://dorar.net/hadith/search`
- **Catatan:** bukan JSON API resmi, tapi banyak digunakan via scraping / endpoint tidak resmi
- **Lebih baik:** gunakan fawazahmed0 atau sunnah.com untuk API stabil

---

## 3. Jadwal Shalat & Waktu

### 🟢 AlAdhan API _(Direkomendasikan — Gratis, Tanpa Key)_

- **URL:** `https://api.aladhan.com/v1`
- **Fitur:** waktu shalat by koordinat/kota, jadwal bulanan, konversi hijriyah, info qibla
- **Auth:** tidak butuh API key
- **GitHub:** https://github.com/islamic-network/api.aladhan.com (open source, bisa self-host)
- **Metode:** Kemenag RI (method=20), MWL, ISNA, Umm al-Qura, dll

```
# Waktu shalat hari ini by koordinat
GET https://api.aladhan.com/v1/timings?latitude=-6.2&longitude=106.8&method=20

# Waktu shalat by nama kota
GET https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=ID&method=20

# Jadwal bulanan
GET https://api.aladhan.com/v1/calendar?latitude=-6.2&longitude=106.8&method=20&month=5&year=2026

# Konversi tanggal Hijriyah
GET https://api.aladhan.com/v1/gToH?date=05-05-2026
GET https://api.aladhan.com/v1/hToG?date=07-11-1447
```

---

### 🟢 Adhan Library _(Hitung Lokal — Tanpa Request HTTP)_

Ini adalah library perhitungan, bukan API eksternal. Hitung waktu shalat **langsung di backend/frontend** tanpa ketergantungan server luar.

**Golang:**

```go
// github.com/mnadev/adhango — port Adhan untuk Go
import "github.com/mnadev/adhango/pkg/calc"
import "github.com/mnadev/adhango/pkg/data"

coords := data.NewCoordinates(-6.2, 106.8)
params := calc.GetMethodParameters(calc.MuslimWorldLeague)
date := data.NewDateComponents(time.Now())
times := calc.NewPrayerTimes(coords, date, params)
fmt.Println(times.Fajr)
```

- **GitHub:** https://github.com/mnadev/adhango (MIT License)
- **Direkomendasikan** untuk produksi — tidak bergantung server eksternal

**JavaScript (Frontend/React Native):**

```js
import { PrayerTimes, Coordinates, CalculationMethod } from "adhan";
const coords = new Coordinates(-6.2088, 106.8456);
const params = CalculationMethod.MuslimWorldLeague();
const times = new PrayerTimes(coords, new Date(), params);
```

- **npm:** `adhan` — https://github.com/batoulapps/adhan-js

---

### 🟢 pray-times.org _(Library Multi-Bahasa)_

- **URL:** http://praytimes.org/
- **Tersedia:** JavaScript, Python, PHP, Java, C++
- **Cocok untuk:** kalkulasi offline

---

## 4. Kiblat & Peta

### 🟢 Qibla Direction — AlAdhan API

Sudah termasuk di AlAdhan, endpoint khusus kiblat:

```
GET https://api.aladhan.com/v1/qibla/{latitude}/{longitude}
# Response: { "direction": 295.123 }  (derajat dari utara)
```

---

### 🟢 OpenStreetMap + Nominatim _(Geocoding — Gratis)_

- **URL:** `https://nominatim.openstreetmap.org`
- **Fitur:** geocoding (nama kota → koordinat) dan reverse geocoding (koordinat → nama tempat)
- **Auth:** tidak butuh API key
- **Syarat:** sertakan `User-Agent` header di request, jangan spam
- **Self-host:** bisa di-deploy sendiri dengan data OSM

```
# Cari koordinat kota
GET https://nominatim.openstreetmap.org/search?q=Jakarta&format=json&limit=1

# Reverse geocoding
GET https://nominatim.openstreetmap.org/reverse?lat=-6.2&lon=106.8&format=json
```

**Golang library:**

```go
// github.com/doppiogancio/go-nominatim — no API key needed
import nominatim "github.com/doppiogancio/go-nominatim"
coord, _ := nominatim.Geocode("Jakarta, Indonesia")
```

---

### 🟢 Leaflet.js + OpenStreetMap _(Peta — Gratis)_

- Untuk peta interaktif (siroh, lokasi masjid, dll) di web/mobile
- **Tile server:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **React library:** `react-leaflet` — https://react-leaflet.js.org/
- Tidak butuh API key, sepenuhnya gratis

---

### 🟢 Overpass API _(Cari Masjid Terdekat)_

- **URL:** `https://overpass-api.de/api/interpreter`
- **Fitur:** query data OpenStreetMap — termasuk lokasi masjid/musholla
- **Auth:** tidak butuh API key

```
# Masjid dalam radius 2km dari Jakarta
POST https://overpass-api.de/api/interpreter
Body:
[out:json];
node["amenity"="place_of_worship"]["religion"="muslim"](around:2000,-6.2,106.8);
out;
```

---

## 5. Dzikir & Doa (Azkar)

### 🟢 Azkar API — nawafalqari

- **URL:** `https://raw.githubusercontent.com/nawafalqari/azkar-api/main/azkar.json`
- **Fitur:** dzikir pagi, petang, setelah shalat, sebelum tidur, dll (bahasa Arab)
- **Auth:** tidak butuh — file JSON langsung dari GitHub
- **GitHub:** https://github.com/nawafalqari/azkar-api

---

### 🟢 Hisnul Muslim API

- **URL:** `https://www.hisnmuslim.com/api/ar/{category_id}.json`
- **Fitur:** doa & dzikir dari kitab Hisnul Muslim, lengkap dengan faedah
- **Auth:** tidak butuh API key

```
GET https://www.hisnmuslim.com/api/ar/1.json   # Dzikir pagi (kategori 1)
GET https://www.hisnmuslim.com/api/ar/2.json   # Dzikir petang (kategori 2)
```

---

### 🟢 Dataset Azkar — Static JSON (Self-host)

- **GitHub:** https://github.com/osamayy/azkar-db
- Tersedia dalam bahasa Arab + terjemahan
- **Rekomendasi:** download, seed ke database kamu, tidak perlu request eksternal

---

## 6. Kalender Hijriyah

### 🟢 AlAdhan Hijri API _(sudah termasuk di poin 3)_

```
GET https://api.aladhan.com/v1/gToH?date=05-05-2026   # Masehi → Hijriyah
GET https://api.aladhan.com/v1/hToG?date=07-11-1447   # Hijriyah → Masehi
GET https://api.aladhan.com/v1/currentIslamicCalendar  # kalender bulan ini
```

---

### 🟢 hijri-converter _(Library — Tanpa HTTP Request)_

**Golang:**

```go
// github.com/dustin/go-humanize — tidak khusus hijri
// Alternatif: hitung manual menggunakan algoritma Umm al-Qura
// Library: github.com/ricmoo/calendar
```

**JavaScript:**

```js
// npm: hijri-date
import HijriDate from "hijri-date";
const hijri = new HijriDate(new Date());
console.log(hijri.toString()); // "7 Dzulqa'dah 1447"

// npm: moment-hijri (jika pakai moment.js)
```

---

## 7. Audio Murattal

### 🟢 QuranicAudio.com _(MP3 Gratis — Direct Link)_

- **CDN:** `https://download.quranicaudio.com/quran/{reciter_slug}/{surah_number_padded}.mp3`
- **Auth:** tidak butuh
- **Contoh:**

```
https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3
https://download.quranicaudio.com/quran/abdulbaset_abdulsamad_mujawwad/002.mp3
```

---

### 🟢 Quran.com Audio API

- Tersedia via endpoint Quran.com v4:

```
GET https://api.quran.com/api/v4/chapter_recitations/{reciter_id}          # per surah
GET https://api.quran.com/api/v4/recitations/{recitation_id}/by_ayah/{ayah_key} # per ayat
GET https://api.quran.com/api/v4/resources/recitations   # list qori tersedia
```

---

### 🟢 EveryAyah.com _(Audio Per Ayat)_

- **URL:** `https://everyayah.com/data/{reciter_slug}/{surah_padded}{ayah_padded}.mp3`
- **Contoh:**

```
https://everyayah.com/data/Alafasy_128kbps/001001.mp3   # Al-Fatihah ayat 1
https://everyayah.com/data/Husary_128kbps/002255.mp3    # Al-Baqarah ayat 255 (Ayat Kursi)
```

---

## 8. Font & Tipografi Arab

### 🟢 Noto Naskh Arabic _(Google Fonts — Gratis)_

- Font Arab paling lengkap dan kompatibel lintas platform
- **URL:** https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic
- **Next.js:**

```js
import { Noto_Naskh_Arabic } from "next/font/google";
const arabicFont = Noto_Naskh_Arabic({
    subsets: ["arabic"],
    weight: ["400", "700"],
    variable: "--font-arabic",
});
```

---

### 🟢 Scheherazade New _(SIL International — Open Font License)_

- Font mushaf-style, sangat cocok untuk tampilan Al-Qur'an
- **URL:** https://software.sil.org/scheherazade/
- Tersedia juga di Google Fonts

---

### 🟢 Amiri Font _(Open Source)_

- Font Arab klasik gaya naskh
- **GitHub:** https://github.com/aliftype/amiri
- **npm:** `@fontsource/amiri`

---

### 🟢 KFGQPC Uthman Taha Naskh _(King Fahd Complex — Gratis)_

- Font mushaf resmi Madinah, paling akurat untuk tampilan Qur'an
- **Download:** https://qurancomplex.gov.sa/quran/mushaf/
- Termasuk dalam data Quran.com

---

## 9. Notifikasi Push

### 🟢 ntfy.sh _(Self-hosted Push Notification)_

- **GitHub:** https://github.com/binwiederhier/ntfy (MIT License)
- **Fitur:** push notification ke Android, iOS, Desktop via HTTP PUT/POST
- **Self-host:** deploy di VPS sendiri, gratis sepenuhnya
- **Alternatif hosted:** ntfy.sh gratis untuk penggunaan dasar
- **Golang:**

```go
// Kirim notifikasi adzan
http.Post("https://ntfy.your-domain.com/adzan-jakarta",
    "text/plain",
    strings.NewReader("Allahu Akbar! Waktu Dzuhur telah masuk."))
```

---

### 🟢 Web Push (Vanilla — Tanpa Layanan Pihak Ketiga)\*

- Untuk notifikasi web browser (PWA)
- Tidak butuh server eksternal, cukup library VAPID di backend
- **Golang library:** `github.com/SherClockHolmes/webpush-go`

```go
import "github.com/SherClockHolmes/webpush-go"
// Generate VAPID keys sekali, simpan di config
// Kirim push notification langsung ke browser
resp, err := webpush.SendNotification([]byte("Waktu shalat Maghrib"), sub, &webpush.Options{
    Subscriber: "mailto:admin@domain.com",
    VAPIDPublicKey: vapidPublicKey,
    VAPIDPrivateKey: vapidPrivateKey,
    TTL: 30,
})
```

---

### 🔵 Firebase FCM _(Gratis dengan batasan — untuk mobile)_

- Gratis untuk mobile push notification (Android & iOS)
- Butuh akun Google (gratis)
- Batas gratis: tidak ada batas pesan untuk notifikasi downstream
- **Catatan:** ini bukan open source, tapi gratis dan paling reliable untuk mobile

---

## 10. Search Engine (Self-host)

### 🟢 Meilisearch _(Self-hosted — Direkomendasikan)_

- **GitHub:** https://github.com/meilisearch/meilisearch (MIT License)
- **Fitur:** full-text search, typo tolerance, filter, facet, highlight
- **Golang client:** `github.com/meilisearch/meilisearch-go`
- **Ideal untuk:** search teks Arab + Indonesia di hadis dan Qur'an
- Deploy: Docker satu baris

```bash
docker run -d -p 7700:7700 getmeili/meilisearch
```

```go
import meilisearch "github.com/meilisearch/meilisearch-go"
client := meilisearch.NewClient(meilisearch.ClientConfig{Host: "http://localhost:7700"})
client.Index("hadis").AddDocuments(hadisData)
result, _ := client.Index("hadis").Search("shalat", &meilisearch.SearchRequest{Limit: 20})
```

---

### 🟢 PostgreSQL Full-Text Search _(Built-in — Tanpa Layanan Tambahan)_

- Sudah ada di PostgreSQL, tidak perlu layanan tambahan
- Dukung pencarian Arab via `pg_trgm` extension
- **Normalisasi harakat** perlu dilakukan manual sebelum index

```sql
-- Buat index FTS untuk teks Arab
CREATE INDEX idx_hadis_matan ON hadis USING gin(to_tsvector('arabic', matan_arab));
-- Query
SELECT * FROM hadis WHERE to_tsvector('arabic', matan_arab) @@ plainto_tsquery('arabic', 'النية');
```

---

## 11. Data Harga Emas (Nisab Zakat)

### 🟢 metals.live API _(Gratis, Tanpa API Key)_

- **URL:** `https://api.metals.live/v1/spot`
- **Fitur:** harga spot emas dan perak real-time
- **Auth:** tidak butuh API key

```
GET https://api.metals.live/v1/spot/gold    # harga emas per troy oz (USD)
GET https://api.metals.live/v1/spot/silver  # harga perak per troy oz (USD)
```

---

### 🟢 frankfurter.app _(Konversi Mata Uang — Gratis)_

- **URL:** `https://api.frankfurter.app`
- **Fitur:** konversi USD ke IDR (untuk konversi nisab ke Rupiah)
- **Auth:** tidak butuh API key

```
GET https://api.frankfurter.app/latest?from=USD&to=IDR
```

> Kombinasikan metals.live + frankfurter untuk dapat harga emas dalam IDR.

---

## 12. Dataset / Static JSON

Dataset ini bisa langsung **diunduh dan di-seed ke database** — tidak perlu API call saat runtime.

| Dataset           | Sumber                                       | Isi                          |
| ----------------- | -------------------------------------------- | ---------------------------- |
| Quran JSON        | https://github.com/rioastamal/quran-json     | Quran + terjemahan Indonesia |
| Hadith JSON       | https://github.com/fawazahmed0/hadith-api    | 17 kitab hadis, multi-bahasa |
| Azkar JSON        | https://github.com/osamayy/azkar-db          | Dzikir pagi/petang/dll       |
| Asmaul Husna      | https://github.com/gadingnst/sunnah-api      | 99 nama Allah                |
| Hadis Indonesia   | https://github.com/islamsource               | Terjemahan hadis Indonesia   |
| Hisnul Muslim     | https://hisnmuslim.com/api                   | Doa lengkap                  |
| Quran Corpus      | https://corpus.quran.com                     | Analisis morfologi per kata  |
| Prayer Times Data | https://github.com/batoulapps/adhan-testdata | Data validasi waktu shalat   |

---

## 13. Library Golang

Library open source yang dipakai **di backend Golang**:

| Library                          | Fungsi                             | GitHub                                |
| -------------------------------- | ---------------------------------- | ------------------------------------- |
| `mnadev/adhango`                 | Hitung waktu shalat (port Adhan)   | github.com/mnadev/adhango             |
| `doppiogancio/go-nominatim`      | Geocoding via Nominatim            | github.com/doppiogancio/go-nominatim  |
| `SherClockHolmes/webpush-go`     | Web Push Notification (VAPID)      | github.com/SherClockHolmes/webpush-go |
| `meilisearch/meilisearch-go`     | Client Meilisearch                 | github.com/meilisearch/meilisearch-go |
| `gin-gonic/gin`                  | HTTP Framework                     | github.com/gin-gonic/gin              |
| `go-redis/redis`                 | Redis client                       | github.com/go-redis/redis             |
| `golang-jwt/jwt`                 | JWT Auth                           | github.com/golang-jwt/jwt             |
| `go-playground/validator`        | Input validation                   | github.com/go-playground/validator    |
| `robfig/cron`                    | Scheduled jobs (notif harian, dll) | github.com/robfig/cron                |
| `golang.org/x/text/unicode/norm` | Normalisasi teks Unicode/Arab      | golang.org/x/text                     |

---

## 14. Library Frontend (JS/TS)

Library open source yang dipakai di **Next.js dan React Native**:

| Library                      | Fungsi                        | npm                          |
| ---------------------------- | ----------------------------- | ---------------------------- |
| `adhan`                      | Hitung waktu shalat di client | `adhan`                      |
| `hijri-date`                 | Konversi kalender Hijriyah    | `hijri-date`                 |
| `react-leaflet`              | Peta interaktif (web)         | `react-leaflet`              |
| `react-native-qibla-compass` | Kompas kiblat (mobile)        | `react-native-qibla-compass` |
| `react-native-sound`         | Audio murattal (mobile)       | `react-native-sound`         |
| `expo-av`                    | Audio & video (Expo)          | `expo-av`                    |
| `expo-notifications`         | Push notification (Expo)      | `expo-notifications`         |
| `expo-location`              | GPS location (Expo)           | `expo-location`              |
| `expo-sensors`               | Kompas/magnetometer           | `expo-sensors`               |
| `@fontsource/amiri`          | Font Arab Amiri               | `@fontsource/amiri`          |
| `react-flow`                 | Visualisasi pohon sanad       | `@xyflow/react`              |
| `recharts`                   | Grafik statistik ibadah       | `recharts`                   |
| `zustand`                    | State management              | `zustand`                    |
| `@tanstack/react-query`      | Data fetching & cache         | `@tanstack/react-query`      |
| `meilisearch`                | Client search (web)           | `meilisearch`                |

---

## 15. Ringkasan Tabel

| Modul                  | Layanan                 | Type          | Auth              |
| ---------------------- | ----------------------- | ------------- | ----------------- |
| Al-Qur'an teks         | Quran.com API v4        | REST API      | ❌ Tidak perlu    |
| Al-Qur'an terjemahan   | fawazahmed0/quran-api   | CDN JSON      | ❌ Tidak perlu    |
| Al-Qur'an tafsir       | quranenc.com            | REST API      | ❌ Tidak perlu    |
| Audio murattal         | QuranicAudio.com        | CDN MP3       | ❌ Tidak perlu    |
| Audio per ayat         | everyayah.com           | CDN MP3       | ❌ Tidak perlu    |
| Hadis koleksi          | fawazahmed0/hadith-api  | CDN JSON      | ❌ Tidak perlu    |
| Hadis + sanad          | sunnah.com API          | REST API      | ✅ API key gratis |
| Hadis penjelasan       | hadeethenc.com          | REST API      | ❌ Tidak perlu    |
| Waktu shalat           | AlAdhan API             | REST API      | ❌ Tidak perlu    |
| Waktu shalat           | Adhan library           | Library lokal | ❌ Tidak perlu    |
| Kiblat arah            | AlAdhan API             | REST API      | ❌ Tidak perlu    |
| Geocoding              | Nominatim/OSM           | REST API      | ❌ Tidak perlu    |
| Peta                   | OpenStreetMap + Leaflet | Tile + JS     | ❌ Tidak perlu    |
| Masjid terdekat        | Overpass API            | REST API      | ❌ Tidak perlu    |
| Dzikir/Doa             | Hisnul Muslim API       | REST API      | ❌ Tidak perlu    |
| Dzikir/Doa             | azkar-api JSON          | CDN JSON      | ❌ Tidak perlu    |
| Kalender Hijriyah      | AlAdhan API             | REST API      | ❌ Tidak perlu    |
| Push notif (Web)       | webpush-go + VAPID      | Self-host     | ❌ Tidak perlu    |
| Push notif (Mobile)    | Firebase FCM            | Cloud         | ❌ Gratis         |
| Push notif (Self-host) | ntfy.sh                 | Self-host     | ❌ Tidak perlu    |
| Full-text search       | Meilisearch             | Self-host     | ❌ Tidak perlu    |
| Harga emas (nisab)     | metals.live             | REST API      | ❌ Tidak perlu    |
| Kurs USD-IDR           | frankfurter.app         | REST API      | ❌ Tidak perlu    |
| Font Arab              | Noto Naskh / Amiri      | Google Fonts  | ❌ Tidak perlu    |

---

## Strategi Penggunaan

### Saat Development (Sebelum Launch)

Gunakan layanan eksternal (AlAdhan, Quran.com, dll) untuk development cepat.

### Saat Production

Untuk **ketahanan dan kemandirian**, prioritaskan:

1. **Download dataset** (Quran JSON, Hadis JSON, Azkar JSON) → seed ke PostgreSQL kamu sendiri
2. **Hitung waktu shalat lokal** menggunakan library `adhango` — tidak bergantung server luar
3. **Self-host Meilisearch** untuk search engine
4. **Self-host ntfy** jika tidak mau bergantung FCM untuk notifikasi

```
Dependency eksternal minimum yang tersisa:
✅ Nominatim (OSM) — bisa self-host jika traffic tinggi
✅ QuranicAudio CDN — untuk streaming audio murattal
✅ frankfurter.app — harga kurs (bisa di-cache harian)
✅ metals.live — harga emas (bisa di-cache harian)
✅ FCM — push mobile (satu-satunya yang tidak bisa diganti 100%)
```

---

_Semua layanan di dokumen ini bebas biaya dan sebagian besar open source._
_Versi: 1.0 | Dibuat: Mei 2026_
