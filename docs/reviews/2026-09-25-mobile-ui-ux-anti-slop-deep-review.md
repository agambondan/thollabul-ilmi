# Deep Review Design / UI / UX Mobile App — Anti-AI-Slop

Tanggal: `2026-09-25`  
Scope: `apps/mobile` (React Native / Expo)  
Status: `FINAL REPORT`

---

## 1. Executive Summary & Metodologi Anti-AI-Slop

Review ini mengaudit antarmuka mobile `apps/mobile` secara komprehensif tanpa generalisasi atau rekomendasi template AI (_AI slop_). Penilaian didasarkan pada prinsip ergonomi mobile, tipografi teks Arab & Latin, arsitektur tema ganda (_Classic/Paper_ vs _Modern/Web App_), aksesibilitas WCAG 2.1 AA, dan integritas interaksi sentuh.

### Kategori Temuan

1. **P0 (Critical / Usability Blocker)**: Teks tidak terbaca di dark mode karena hardcoded hex, overflow tata letak pada layar sempit, atau navigasi stuck/rusak.
2. **P1 (High / Friction & Parity)**: Touch target di bawah standar 44×44 dp, missing feedback sentuhan, Arabic harakat clipping, visual hierarchy tidak seimbang (_card soup_).
3. **P2 (Medium / Polish & Consistency)**: Inkonsistensi radius/spacing, missing haptics, animasi transisi kaku.

---

## 2. Temuan Lintas Komponen & Fondasi Desain

### 2.1. Dark Mode & Hardcoded Hex Bleed (P0)

Banyak sub-rute `WebApp*Route.js` menggunakan hardcoded warna terang (`#ffffff`, `#f8fafc`, `#e5e7eb`, `#111827`) di dalam `StyleSheet.create()` tanpa memanfaatkan `useLayoutModePreference()` atau token warna dinamis `theme.js`.

| File & Baris                     | Masalah                                                                           | Dampak UI/UX                                       | Solusi Konkret                                        |
| -------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `WebAppTasbihRoute.js:362-405`   | Hardcoded `backgroundColor: "#f8fafc"`, `counterCard` `#ffffff`, border `#d1fae5` | Layar putih silau saat app dalam Dark Theme        | Inject `isDarkTheme` atau konsumsi `getThemeColors()` |
| `WebAppZakatRoute.js:766-838`    | Hardcoded background `#f8fafc`, card `#ffffff`, border `#e5e7eb`                  | Kontras teks hancur di Dark Theme                  | Gunakan `webCardStyle` & `webSurfaceStyle`            |
| `WebAppKajianRoute.js:1099-1303` | Hardcoded `#ffffff` pada `transcriptCard` dan search bar                          | Transkrip kajian tidak adaptif terhadap tema gelap | Pasang style dinamis dari context tema                |
| `WebAppQuizRoute.js:780-840`     | Hardcoded card background `#ffffff` pada pertanyaan dan skor kuis                 | Tampilan kuis tidak terikat mode malam             | Sesuaikan palette kuis dengan dark background         |

### 2.2. Tipografi Arab & Harakat Clipping (P1)

Teks Arab Al-Quran, Hadis, Dzikir, dan Doa membutuhkan `lineHeight` minimal 1.6×–1.8× `fontSize` untuk mencegah harakat atas (fathah/dhammah/shaddah) dan bawah (kasrah) terpotong (_tashkeel clipping_).

- **`WebAppTasbihRoute.js:406-410` (`activeArabic`)**: `fontSize: 29`, `lineHeight: 43` (rasio 1.48x) — pada font sistem Android tertentu, tanda tasydid atas terpotong tepi atas card.
    - _Rekomendasi_: Tingkatkan `lineHeight` menjadi minimal `48` dan beri `paddingVertical: 6`.
- **`WebAppLessonsRoute.js:812-817` (`stepArabic`)**: `fontSize: 20`, `lineHeight: 32` — sudah cukup baik, namun `fontFamily: 'System'` menghasilkan rendering Naskh default Android yang bervariasi antar vendor (Samsung vs Xiaomi).
    - _Rekomendasi_: Standardisasi pemakaian font Arab kustom atau font stack yang sama dengan `QuranScreen.js`.

### 2.3. Touch Targets & Ergonomi Jari (P1)

Standar ergonomi mobile mewajibkan area sentuh interaktif minimal 44×44 dp (Apple HIG & Google Material Design).

- **`WebAppKajianRoute.js:1395-1409` (`removeBookmarkBtn`)**: `paddingVertical: 2`, `paddingHorizontal: 6`, `fontSize: 11` — target tinggi efektif hanya ~22 dp, sangat rawan _miss-tap_ saat mencoba menghapus bookmark potongan kajian.
    - _Rekomendasi_: Bungkus dalam touch target minimal `minHeight: 40, minWidth: 40` dengan hit slop `{ top: 8, bottom: 8, left: 8, right: 8 }`.
- **`WebAppZakatRoute.js:999-1006` (`counterButton`)**: `height: 42, width: 42` — dekat dengan standar (42 dp), namun `fontSize: 22` dengan `lineHeight: 25` terasa sempit di jempol.
    - _Rekomendasi_: Naikkan ukuran tombol counter (+ / -) menjadi `48×48 dp`.

---

## 3. Deep Review Per Tab & Screen Utama

### 3.1. Tab Beranda (`HomeScreen.js` & `HomeDashboardContent.js`)

- **Visual Rhythm**: Hero widget jadwal sholat memiliki struktur informasi yang solid (nama sholat, countdown, lokasi aktif).
- **Anti-Slop Check**:
    - _Kelebihan_: Tidak ada animasi kartu berputar atau gradien ungu-emas norak; menggunakan palet emerald/slate yang terukur.
    - _Perbaikan_: Shortcut kontekstual (Dzikir Pagi/Petang, Arah Qibla) sangat bermanfaat, tetapi layout 3 baris di bawah hero terasa seperti kartu terpisah tanpa pengelompokan. Disarankan dibuat dalam bentuk _horizontal pill strip_ yang ringkas agar tidak memakan fold vertikal.

### 3.2. Tab Al-Quran (`QuranScreen.js` & Renderers)

- **Visual Rhythm**: Mode Mushaf (Per-Halaman Madinah) dan Mode Ayat (List Vertikal) terpisah dengan jelas.
- **Anti-Slop Check**:
    - _Kelebihan_: Tajweed color coding menggunakan pemetaan warna subtil (`TAJWEED_TEXT_COLORS`), bukan latar belakang mencolok yang membuat mata lelah saat tilawah lama.
    - _Perbaikan_: Audio Range Panel saat dibuka memakan sepertiga layar bawah. Kontrol stepper ayah awal/akhir butuh indikator nomor surah yang lebih jelas agar user tidak bingung saat memilih rentang lintas surah.

### 3.3. Tab Hadis (`HadithScreen.js`)

- **Visual Rhythm**: Pembagian tab detail (Teks, Sanad Tree, Perawi, Takhrij, Ayat Terkait, Catatan) sangat kaya secara ilmiah.
- **Anti-Slop Check**:
    - _Kelebihan_: Visualisasi Sanad Tree mobile berbasis jalur bertingkat bersih, bukan grafik canvas rumit yang lambat di HP entry-level.
    - _Perbaikan_: Header kitab hadis saat scrolling list panjang membutuhkan floating pill "Kembali ke Nomor Hadis Terakhir" saat user sudah scroll ratusan hadis.

### 3.4. Tab Ibadah (`IbadahScreen.js`)

- **Visual Rhythm**: Menggunakan grid 2-kolom kartu fitur utama (Jadwal Sholat, Qibla, Khatam, Masjid, Kalender, Tasbih) yang rapi.
- **Anti-Slop Check**:
    - _Kelebihan_: Tiap kartu memiliki icon unik dengan subtitle deskriptif berbahasa Indonesia yang jelas.
    - _Perbaikan_: Transisi navigasi saat memilih kartu "Tasbih" atau "Doa" melompat ke tab Belajar tanpa indikator visual perpindahan tab. Perlu toast halus atau sinkronisasi tab bar.

### 3.5. Tab Belajar (`ExploreScreen.js` & Feature Catalog)

- **Visual Rhythm**: Pengelompokan 5 grup besar (Studi Quran & Hadits, Ibadah & Muamalah, Pengetahuan & Sejarah, Komunitas & Interaksi, Alat & Produktivitas) sangat terstruktur.
- **Fitur Spesifik**:
    - **Kamus Arab (`WebAppKamusRoute.js`)**: Penambahan _Quick Suggestions_ chip (Iman, Sholat, Taqwa) berhasil memotong dead-end kosong.
    - **Kajian Transkrip (`WebAppKajianRoute.js`)**: Pemutar video modal dengan timestamp seek bekerja mulus; mode pencarian (Hybrid / Exact / Semantic) memberi feedback pencarian yang jujur dan transparan.
    - **Zakat (`WebAppZakatRoute.js`)**: Input angka dengan format mata uang otomatis (ribuan sparator) sangat intuitif; toggle Haul memberi peringatan hukum fiqh yang akurat sebelum menghitung zakat.
    - **Pelajaran (`WebAppLessonsRoute.js`)**: Stepper interaktif per rukun/sunnah dengan audio pelafalan sangat membantu pemula.

---

## 4. Rencana Tindak Lanjut (Action Plan)

1. **Sweep Token Dark Theme**:
    - Refactor `WebAppTasbihRoute.js`, `WebAppZakatRoute.js`, `WebAppQuizRoute.js`, dan `WebAppKajianRoute.js` untuk mengonsumsi `useLayoutModePreference()` / `theme.js`.
2. **Standardisasi Touch Target**:
    - Tingkatkan semua touchable icons dan text button minimal `44×44 dp` atau lengkapi dengan `hitSlop`.
3. **Tipografi Arab Safety**:
    - Audit dan terapkan rasio `lineHeight` minimal 1.65× pada seluruh container teks Arab.

---

_Laporan review ini diverifikasi terhadap codebase `thollabul-ilmi` per September 2026._
