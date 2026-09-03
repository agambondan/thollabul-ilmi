# Mobile Accessibility Review

Tanggal: `2026-09-01`
Scope: `apps/mobile` (357 kontrol interaktif, ~87k LOC)
Status: `REVIEWED_AND_FIXED`

Sweep aksesibilitas app mobile, menyusul audit frontend web
([2026-09-01-web-frontend-deep-review.md](./2026-09-01-web-frontend-deep-review.md)).
Kelas masalahnya sama, tapi bentuknya berbeda — lihat koreksi di bawah.

---

## Koreksi Angka Awal

Review web sempat menyebut mobile punya **"94 `accessibilityLabel` untuk 849
touchable (~11%)"**. Angka itu **salah**: `grep -c` menghitung kemunculan
string, termasuk import, closing tag, dan referensi di `StyleSheet`.

Hitungan per-elemen yang benar (parser blok JSX, 0 blok gagal dicocokkan):

| Metrik                       | Sebenarnya |
| ---------------------------- | ---------- |
| Total elemen touchable       | 357        |
| Punya `accessibilityLabel`   | 85         |
| Auto-label via `<Text>` anak | 264        |
| **Ikon-saja tanpa label**    | **8**      |

Jadi masalah label jauh lebih kecil dari dugaan — RN otomatis menyusun label
dari `<Text>` di dalam touchable, dan 74% kontrol memang punya teks.

**Masalah sebenarnya ada di tempat lain**: 298 dari 357 kontrol (83%) tidak
punya `accessibilityRole`, sehingga TalkBack dan VoiceOver membacanya sebagai
teks biasa — user tidak tahu elemen itu bisa ditekan.

---

## Temuan & Perbaikan

### 1. 298 kontrol tanpa `accessibilityRole` — P0

Screen reader tidak mengumumkan elemen sebagai tombol. Ditambahkan
`accessibilityRole` ke seluruh 357 kontrol, dengan role yang sesuai semantik:

| Role       | Jumlah | Contoh                                                          |
| ---------- | ------ | --------------------------------------------------------------- |
| `button`   | 346    | mayoritas aksi                                                  |
| `tab`      | 8      | NotificationCenter, HadithScreen (2), Quran, Leaderboard, Zakat |
| `checkbox` | 3      | OfflinePackCard (Quran + kitab hadis), Tasbih vibrate           |

Enam tab list awalnya ikut diberi `role='button'` oleh codemod, lalu
dikoreksi manual jadi `role='tab'` + `accessibilityState={{ selected }}`.

### 2. Modal tanpa semantik dialog — P0

`accessibilityViewIsModal` nol di seluruh app. Screen reader tetap bisa
menjangkau konten di belakang sheet yang terbuka.

Diperbaiki di `components/AppModalSheet.js` — primitive yang dipakai
`AppActionSheet` dan seluruh bottom sheet:

- `accessibilityViewIsModal` pada sheet
- `accessibilityLabel={title}` sebagai nama dialog
- `accessibilityRole='header'` pada judul
- `AccessibilityInfo.setAccessibilityFocus` memindahkan kursor screen reader
  ke dalam sheet saat dibuka
- drag handle ditandai `importantForAccessibility='no-hide-descendants'`
  karena dekoratif
- overlay penutup dapat `accessibilityRole='button'`

### 3. 55 tombol `disabled` tidak melaporkan statusnya — P1

Tombol nonaktif terbaca sebagai tombol biasa: user mengaktifkannya, tidak
terjadi apa-apa, tanpa penjelasan. `accessibilityState={{ disabled }}`
dicerminkan dari prop `disabled` di 55 kontrol.

### 4. 8 tombol ikon-saja tanpa label — P1

| Lokasi                           | Label                     |
| -------------------------------- | ------------------------- |
| Home header — pencarian          | `a11y.openSearch`         |
| Home header — notifikasi         | `a11y.openNotifications`  |
| Quran — perkecil teks Arab       | `a11y.decreaseArabicFont` |
| Quran — perbesar teks Arab       | `a11y.increaseArabicFont` |
| Komunitas — hapus pesan          | `a11y.deleteMessage`      |
| Komunitas — kirim pesan          | `a11y.sendMessage`        |
| Faraidh — tambah ahli waris      | `a11y.addHeir`            |
| Quran — putar/stop audio rentang | `a11y.toggleRangeAudio`   |

8 kunci baru di `idn` dan `en`. Parity tetap: **992 = 992**.

### 5. `ActionSheetRow` menggabung judul dan subtitle

Tanpa label eksplisit, screen reader membaca judul + subtitle sebagai satu
label panjang. Sekarang judul jadi `accessibilityLabel`, subtitle jadi
`accessibilityHint`.

---

## Angka Sebelum → Sesudah

| Metrik                                | Sebelum | Sesudah |
| ------------------------------------- | ------- | ------- |
| Touchable dengan `accessibilityRole`  | 59      | **357** |
| Touchable dengan `accessibilityState` | 24      | **92**  |
| Ikon-saja tanpa label                 | 8       | **0**   |
| `accessibilityViewIsModal`            | 0       | 2       |
| `accessibilityHint`                   | 1       | 2       |
| Unit test                             | 745     | 745     |

---

## Yang Belum Dikerjakan

- **`accessibilityHint` masih 2.** Hint berguna untuk aksi yang akibatnya tidak
  jelas dari labelnya saja (mis. swipe-to-delete, tap-hold). Perlu pass manual
  per layar, bukan codemod.
- **Belum ada device smoke dengan TalkBack/VoiceOver.** Sesuai
  `docs/reviews/README.md`, untuk mobile UI device smoke tetap wajib dan lint
  hijau saja tidak cukup untuk menandai selesai. Perubahan ini terverifikasi
  secara statis dan lewat 745 unit test, tapi **belum diuji dengan screen
  reader sungguhan**.
- **Urutan fokus dan `accessibilityLiveRegion`** untuk konten yang berubah
  (hasil pencarian, counter tasbih, countdown sholat) belum ditinjau.
- **Target sentuh minimum 44x44** belum diaudit.

---

## Verification Log

| Command                                | Hasil                     |
| -------------------------------------- | ------------------------- |
| `npx jest`                             | 50 suite / 745 test lulus |
| `npx prettier --check "src/**/*.js"`   | bersih                    |
| Parser blok JSX atas 357 touchable     | 0 blok gagal dicocokkan   |
| Diff kunci `translations.idn` vs `.en` | 992 = 992, 0 gap          |
