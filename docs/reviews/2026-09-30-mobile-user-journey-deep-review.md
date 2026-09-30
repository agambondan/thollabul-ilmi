# Deep Review User Journey Mobile App

Tanggal: `2026-09-30`
Scope: `apps/mobile` — semua 7 core user journey
Status: `SELESAI`

---

## Ringkasan Temuan & Status

| No | Temuan | Prioritas | Status |
|----|--------|-----------|--------|
| 1 | Judul Doa tertutup `json:"-"` di backend | P0 | ✅ Sudah diperbaiki sebelumnya — `doa.go` field `Title` sudah terekspos |
| 2 | Sub-route `WebAppLessonsRoute` & `WebAppQuizRoute` tidak bind `setBack`/`clearBack` — hardware back Android langsung keluar fitur | P1 | ✅ Diperbaiki sesi ini |
| 3 | Quran offline pack tidak dibaca reader saat offline | P1 | ✅ Sudah diintegrasikan — `QuranScreen.js` fallback ke `getOfflineAyahsForSurah/Page/Hizb` |
| 4 | Dark mode bleed di `WebAppSirohRoute.js` & `WebAppHijriRoute.js` | P2 | ✅ Sudah diperbaiki — kedua file punya style `rootDark`/`contentDark` dll |

---

## Fix yang Dikerjakan Sesi Ini

### P1 — Sub-route Hardware Back Navigation

**File diubah:**
- `apps/mobile/src/screens/explore/WebAppLessonsRoute.js`
- `apps/mobile/src/screens/explore/WebAppQuizRoute.js`

**Masalah:** Kedua sub-route hanya memanggil `navigation.setHeader()` dengan
callback `onBack`, tapi tidak pernah memanggil `navigation.setBack()`. Akibatnya
handler hardware back Android (`screenBackRef` di `App.js`) tidak tahu ada
sub-navigasi aktif di dalam fitur Lessons/Quiz. Tombol back fisik langsung
keluar dari seluruh fitur, bukan mundur satu langkah (misalnya dari step 3 ke
step 2 di Lessons, atau dari pertanyaan 5 ke pertanyaan 4 di Quiz).

**Perbaikan:**
- Setiap branch di `useEffect` header sekarang juga memanggil
  `navigation.setBack?.(onBack)` dengan handler yang sama.
- Branch `else` (tidak ada sub-navigasi) memanggil `navigation.clearBack?.()`
  untuk membersihkan handler.
- Cleanup function `return () => navigation?.clearBack?.()` ditambahkan supaya
  handler terhapus saat komponen unmount (mencegah stale handler).

**Test:** Test baru di `curriculumQuizTokohIntegration.test.js` memverifikasi
`setBack` dipanggil saat mount dan `clearBack` dipanggil saat unmount, untuk
kedua route. 6 test PASS.

---

## Status Semua 7 Core Journey

### 1. Beranda (Cockpit Harian) ✅
- Alur lengkap: splash → izin lokasi → kartu sholat → ayat & hadis harian →
  pintasan cepat → lanjut bacaan.
- Fallback offline prayer times berjalan.
- Celah minor: pengguna tanpa izin lokasi mendapat default Jakarta tanpa dialog
  pemilih kota eksplisit (enhancement, bukan bug).

### 2. Baca Al-Quran ✅
- Reader virtual, bottom-sheet tafsir/asbab/mufrodat, audio player multi-qari.
- Offline fallback sudah terintegrasi (`getOfflineSurahs`,
  `getOfflineAyahsForSurah/Page/Hizb`).

### 3. Referensi Hadis ✅
- 9 kitab Kutubut Tis'ah, pohon sanad interaktif, bookmark persistent.
- Celah minor: indikator visual cache offline belum ada (enhancement).

### 4. Hub Ibadah ✅
- Jadwal sholat, qibla, dzikir, tasbih (haptic), zakat, faraidh, khatam.
- Celah minor: hasil hitung zakat/faraidh belum ada tombol ekspor sekali tap.

### 5. Hub Belajar ✅ (Fixed)
- Kajian, siroh, fiqh, kamus, quiz, radio, pelajaran.
- **Fix:** `WebAppLessonsRoute` dan `WebAppQuizRoute` sekarang bind `setBack` —
  hardware back mundur bertahap, bukan keluar penuh.

### 6. Akun & Sinkronisasi ✅
- Auth WhatsApp/Email, mutation queue offline, bookmark sync.
- Celah minor: swipe-down dismiss bentrok scroll pada layar kecil (UX polish).

### 7. Pencarian Global & Deep Link ✅
- Pencarian keyword + semantic, filter multi-tab, deep link parser.
- Doa title sudah muncul benar (backend field `Title` sudah terekspos).

---

## Verifikasi

```
npx jest src/__tests__/curriculumQuizTokohIntegration.test.js
  6 tests PASS

node --check WebAppLessonsRoute.js   ✓
node --check WebAppQuizRoute.js      ✓
go build ./...                       ✓
```
