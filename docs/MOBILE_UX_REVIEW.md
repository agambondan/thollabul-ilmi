# Mobile App UI/UX Review

> Reviewed: 2026-05-06 | Reviewer: Claude Code | App: `apps/mobile/`

> Implementation task list: [`docs/MOBILE_DESIGN_REWORK_TASKLIST.md`](./MOBILE_DESIGN_REWORK_TASKLIST.md)

## Ringkasan Eksekutif

App mobile Thollabul Ilmi memiliki desain "Paper" yang konsisten. Namun, audit mendalam mengungkapkan masalah struktural kritis: fitur yang tidak fungsional karena hardcoded data, risiko performa berat, dan ketergantungan pada data palsu (fallback).

**Mandat Utama (Strict):**

1. **NO FALLBACK DATA:** Semua data harus real dari backend. Hapus semua dummy/lokal.
2. **Performance First:** Quran reader harus menggunakan virtualization (`FlatList`).
3. **Progressive Disclosure:** Jangan menumpuk semua fitur dalam 1 layar. Pecah menjadi sub-halaman jika terlalu ramai (Ref: Teal Design).
4. **User-Friendly Copy:** Ganti semua istilah teknis/developer-facing.

---

## 1. Desain & Navigasi Terstruktur (Teal Reference) 🚨 NEW RULE

Berdasarkan referensi desain **Teal**, aplikasi harus mengikuti kaidah navigasi yang lebih _seamless_ dan tidak sesak:

- **Information Density:** Satu halaman jangan terlalu ramai. Jika fitur memiliki banyak pengaturan (seperti Prayer atau Profile), gunakan pola _progressive disclosure_.
- **Journey Progressif:** Klik "Settings" (icon gear) di Profile → Masuk ke halaman Settings (List) → Klik item tertentu → Masuk ke detail pengaturan.
- **Compact but Clean:** File kode boleh _compact_, tapi UI harus tetap lega. Hindari menumpuk 5-6 kartu panjang dalam satu layar scroll jika fungsinya berbeda jauh.

---

## 2. Desain Visual & Aksesibilitas

### Yang Bagus

- Palet warna parchment (`#fefdf9`, `#f5f2eb`) konsisten dan elegan.
- Diamond surah numbers di QuranScreen adalah detail visual khas.
- Floating dark tab bar menciptakan kontras yang baik.

### Masalah: Font Size & Kontras

Banyak elemen menggunakan font di bawah standar minimum (8px):

- Menu label grid home (`HomeScreen.js:334`): 9px.
- Location text (`HomeScreen.js:215`): 9px.
- Prayer tracker dots & kicker: 9-10px.
- **Tab Bar Contrast:** Warna `#2c332c` vs background krem sangat tajam.

---

## 3. Temuan Struktural & Performa (Kritis)

### 3.1 🚨 Fitur Non-Fungsional (Hardcoded Endpoints)

- **Tafsir & Asbabun Nuzul (`data/mobileFeatures.js`):** Endpoint di-hardcode ke `/surah/1`. Apapun surah yang dipilih user, aplikasi selalu menampilkan data Surah Al-Fatihah.

### 3.2 🚨 Quran Performance Killer (UI Lag)

- Render ayat menggunakan `.map()` di dalam `ScrollView` biasa.
- **Wajib:** Refaktor ke `FlatList` atau `FlashList`.

### 3.3 🚨 Offline Pack Risks (Storage & Memory)

- **Hadith Max Limit:** Mencoba download hingga **100.000 hadits**. Batasi dan tambahkan guardrails.

---

## 4. Temuan "Fallback" & Data Palsu (🚨 MANDATORY REMOVAL)

Data palsu yang tersimpan di lokal (hardcoded) harus dihapus total:

- **`src/data/fallback.js`**: **Hapus File Ini.**
- **Audio Fallback**: Gunakan data backend asli.
- **Location Jakarta**: Minta input lokasi manual jika GPS mati.
- **Status 2026-05-07:** Mobile content path sekarang hanya memakai backend/live request atau paket offline yang diunduh eksplisit; silent content cache dan offline fallback otomatis dihapus.

---

## 5. Deep Journey Analysis

### 5.1 Auth Journey (Patah)

- **Auth Discovery Gap:** Pesan error `"Sign in from Home"`, padahal login di Profile.
- **Register Missing:** Tidak ada flow pendaftaran/lupa password.

### 5.2 Hadith & Prayer (Overload)

- **Hadith:** Detail hadis, sanad, biografi, takhrij menumpuk dalam satu scroll. Gunakan sub-page atau tab internal untuk biografi perawi.
- **Prayer:** Sembunyikan _Manual Correction_ di balik sub-halaman pengaturan agar layar utama fokus ke Jadwal & Log.

### 5.3 Kalkulator & Form (Input Friction)

- **Keyboard Blockage:** Tidak ada `KeyboardAvoidingView`.
- **Numeric Formatting:** Tidak ada ribuan separator (dot/comma) pada input Zakat/Faraidh.
- **Status 2026-05-07:** `Screen` sudah memakai `KeyboardAvoidingView`; Zakat/Faraidh sudah memakai input numerik dengan separator ribuan, prefix `Rp`, dan panel ringkasan hasil.

---

## 6. Implementation Gaps (🚨 SINKRONISASI)

| Fitur              | Status di Memory         | Kondisi Aktual di Kode                         |
| ------------------ | ------------------------ | ---------------------------------------------- |
| **Home Prayer**    | Disebut sudah "Live"     | **Hardcoded** (`15:14`) di `HomeScreen.js`     |
| **Quiz Options**   | Disebut merender teks    | **Hanya render A/B/C/D** di `ExploreScreen.js` |
| **Auth Messaging** | Disebut sudah diperbaiki | Masih tertulis `"Sign in from Home"`           |

---

## 7. Prioritas Perbaikan

### Kritis (Immediate Fix)

1. **Remove All Fallbacks**: Hapus `src/data/fallback.js`.
2. **Fix Hardcoded Endpoints**: Dinamiskan endpoint Tafsir/Asbab.
3. **Quran Virtualization**: Refaktor ke `FlatList`.
4. **Keyboard Support**: Tambahkan `KeyboardAvoidingView`.
    - **Status 2026-05-08:** App shell sudah memakai `KeyboardAvoidingView`, melengkapi wrapper yang sudah ada di `Screen`, Profile sub-screen, dan Prayer settings.
5. **Quiz Fix**: Render teks opsi jawaban.

### High (Next Sprint)

6. **Structural Navigation Refactor**: Pecah layar yang terlalu ramai (Hadith/Prayer) menjadi sub-halaman menggunakan pola "Settings" (Ref: Teal Design).
7. **Correct Auth Messaging**: Ubah semua ke `"Sign in from Profile"`.
8. **Register Flow**: Tambah tombol Daftar di `SessionCard.js`.
9. **Numeric Formatting**: Selesai untuk Zakat/Faraidh; input memakai separator ribuan dan ringkasan hasil.

### Nice-to-have

10. **Haptic Feedback** & **Native Time Picker**.
    - **Status 2026-05-08:** Haptic feedback sudah dikonsolidasikan lewat `src/utils/haptics.js`; tab switch, segmented tabs, icon/action buttons, tasbih, pin shortcut, dan global toast sukses/gagal/info memberi feedback di native.
11. **Remove Brand Repetition** ("Thullaabul 'Ilmi" di setiap header).
