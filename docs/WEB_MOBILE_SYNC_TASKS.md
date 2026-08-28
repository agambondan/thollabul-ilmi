# Web → Mobile: Task Breakdown (11 Features)

> Skala effort: S (≤2 jam) · M (½-1 hari) · L (1-3 hari)
> Urutan by priority: High → Medium → Low

---

## 1. Forum Q&A — L (3 sub-tasks)

**Endpoint:** `/api/v1/forum/questions`
**Web ref:** 4 pages (`/forum`, `/forum/ask`, `/forum/[slug]`, `/dashboard/forum`)

### [F-1.1] API module forum (M)

- [x] Buat `src/api/forum.js` — `getForumQuestions()`, `getForumQuestion(slug)`, `createForumQuestion()`, `submitAnswer()`, `voteQuestion()`, `acceptAnswer()`
- [x] Export lewat `client.js` atau langsung import di screen
- [x] Test coverage ≥ 3 test cases

### [F-1.2] Feature entry + list page (M)

- [x] Tambah `{ key: 'forum', title: 'Forum Tanya Jawab', subtitle: 'Diskusi dan konsultasi Islam', type: 'forum', badges: ['Baru'] }` ke `mobileFeatures.js` di grup Ilmu
- [x] Register `type: 'forum'` di `renderFeatureContent()` — render list paginated dengan search
- [x] Gunakan existing pattern: `getFeatureItemPage()` + `normalizeExploreItem()`

### [F-1.3] Detail + ask + vote (L)

- [x] Tambah `renderForumDetail()` — tampilkan question + answers + vote buttons
- [x] Buat form "Ask Question" (modal/bottom-sheet)
- [x] Integrasi action sheet: vote up/down, accept answer (untuk owner)
- [x] Test: render, vote toggle, create question

**Status 2026-05-17:** Selesai. Mobile Forum Q&A punya API module, list/search/pagination, detail, ask form, answer form, question vote, answer vote, accept answer, dan coverage di `exploreScreen.test.js`.

---

## 2. Adzan Audio + Countdown — L (3 sub-tasks)

**Web ref:** `apps/web/src/app/jadwal-sholat/page.js`
**Existing mobile:** `PrayerScreen.js` — jadwal + countdown + reminder notif + optional audio adzan

### [F-2.1] Countdown timer (S)

- [x] Di `PrayerScreen.js`, compute `nextPrayer` dari schedule times
- [x] Tampilkan countdown `HH:MM:DS` menuju next prayer
- [x] Update tiap detik via `useEffect` + `setInterval`

### [F-2.2] Adzan audio player (M)

- [x] Import `expo-audio` (already in package.json)
- [x] Play adzan mp3 saat countdown reaches 0 (waktu sholat masuk) jika toggle audio aktif
- [x] Opsional: stop button, atau auto-stop setelah 30 detik
- [x] Fallback: kalo audio gagal load, silent skip (jangan crash)

### [F-2.3] Browser Notification API parity (M)

- [x] Saat waktu sholat masuk (mobile foreground), show local notification via `expo-notifications` dengan title "Waktu Sholat: Subuh" + body
- [x] Integrasi dengan `schedulePrayerReminders()` existing

---

## 3. Zakat Multi-Tab + Riwayat — L (3 sub-tasks)

**Web ref:** `/zakat` (6 tabs: maal, penghasilan, emas, perak, pertanian, ternak) + `/zakat/history`
**Existing mobile:** `type: 'zakat'` di `localTools` — multi-tab + riwayat lokal/akun

### [F-3.1] API calls zakat (S)

- [x] Tambah di `src/api/personal.js` atau `explore.js`: `saveKalkulasiZakat()`, `getKalkulasiZakat()`, `deleteKalkulasiZakat()`
- [x] Endpoint: `POST /api/v1/zakat/kalkulasi`, `GET /api/v1/zakat/kalkulasi`

### [F-3.2] Multi-tab calculator (M)

- [x] Upgrade `renderFeatureContent()` case `zakat`: tambah tab selector (horizontal pills/carousel) untuk 6 jenis
- [x] Tiap tab: form input spesifik + hasil kalkulasi 2.5%
- [x] Auto-fetch gold price dari API untuk tab emas

### [F-3.3] Save + history (M)

- [x] Tombol "Simpan" di tiap tab → POST ke BE saat login atau AsyncStorage saat guest
- [x] Tab "Riwayat" di ujung — merge GET + local history
- [x] Swipe-to-delete atau tombol hapus per item
- [x] Test: save flow, history list, delete

---

## 4. Faraidh + Dual-Sync — M (2 sub-tasks)

**Web ref:** `/faraidh` (calculator + localStorage + BE sync + Musytarakah + print)
**Existing mobile:** `type: 'faraidh'` di `localTools` — calculator + save/history lokal/akun

### [F-4.1] Faraidh save API (S)

- [x] Tambah di `api/personal.js` atau `explore.js`: `saveFaraidh()`, `getFaraidhHistory()`, `deleteFaraidh()`
- [x] Endpoint: `POST /api/v1/faraidh/simpan`, `GET /api/v1/faraidh/simpan`

### [F-4.2] Upgrade faraidh feature (M)

- [x] Port `lib/faraidh.js` logic ke mobile (bagian Musytarakah: suami+ibu+2+saudaraL share 1/3)
- [x] Tambah tombol "Simpan" → POST ke BE saat login atau AsyncStorage saat guest
- [x] Tambah tombol "Riwayat" → list saved calculations
- [x] AsyncStorage cache sebagai fallback offline
- [x] Test: Musytarakah case, save/load, delete

---

## 5. Tokoh Tarikh — S (1 sub-task)

**Web ref:** `/tokoh` (search + era filter + detail modal)
**Endpoint:** `GET /api/v1/tokoh-tarikh`

### [F-5.1] Feature entry + list (S)

- [ ] Tambah `{ key: 'tokoh', title: 'Tokoh Tarikh', subtitle: 'Tokoh sejarah Islam', type: 'list', endpoint: '/api/v1/tokoh-tarikh' }` ke `mobileFeatures.js` di grup Ilmu
- [ ] Existing `renderDetailScreen()` + `normalizeExploreItem()` auto-handle list & detail — 0 code tambahan
- [ ] Cukup test: feature renders, detail popup works

---

## 6. Peta Interaktif — L (3 sub-tasks)

**Web ref:** `/peta` (Leaflet + OpenStreetMap + 11 historical markers)
**Existing mobile:** No map feature at all (QiblaScreen has compass, not map)

### [F-6.1] Install react-native-maps (M)

- [ ] `npx expo install react-native-maps`
- [ ] Konfigurasi `app.json` — tambah `expo.plugins` untuk maps

### [F-6.2] Map screen + markers (M)

- [ ] Buat `src/screens/HistoricalMapScreen.js`
- [ ] Render `MapView` dengan 11 markers (lokasi dari web: Makkah, Madinah, Jerusalem, Kufah, Basrah, Baghdad, Damascus, Cairo, Cordoba, Samarkand, Istanbul)
- [ ] Tiap marker: `Callout` dengan nama + deskripsi singkat

### [F-6.3] Integrasi ke Ibadah/Belajar (S)

- [ ] Tambah entry di `mobileFeatures.js` dengan `type: 'historical-map'`
- [ ] Register di `renderFeatureContent()` — langsung render `HistoricalMapScreen`
- [ ] Atau tambah row di IbadahScreen section "Arah & Waktu"

---

## 7. Wirid Asmaul Husna — M (2 sub-tasks)

**Web ref:** `/asmaul-husna/wirid` (99 names counter, prev/next, progress, vibrate)
**Existing mobile:** `type: 'list'` with endpoint `/api/v1/asmaul-husna` — cuma list nama

### [F-7.1] New feature type `asmaul-wirid` (M)

- [x] Tambah `{ key: 'asmaul-wirid', title: 'Wirid Asmaul Husna', subtitle: 'Dzikir 99 nama Allah', type: 'asmaul-wirid', badges: ['Baru'] }` di `mobileFeatures.js` di grup Bacaan
- [x] Register `case 'asmaul-wirid'` di `renderFeatureContent()`
- [x] Render: counter besar di tengah, nama Arab + arti, prev/next arrows, progress bar
- [x] Persist count via AsyncStorage per nama

### [F-7.2] Haptic + audio (S)

- [x] `hapticTap()` tiap tap counter (existing `expo-haptics`)
- [x] Vibrate saat mencapai 33/99

**Status 2026-05-17:** Selesai. Mobile Wirid Asmaul Husna menyimpan counter per nama via AsyncStorage, tidak reset saat pindah nama, dan memberi haptic medium saat milestone 33/99 tercapai.

---

## 8. Munasabah — S (1 sub-task)

**Web ref:** Toggle di `AyahPage.js` — BsLink45Deg button → purple section with related ayahs
**Endpoint:** `GET /api/v1/munasabah/ayah/:ayahId`

### [F-8.1] Munasabah di QuranScreen (S)

- [x] Tambah button "Ayat Terkait" di detail ayah view dalam `QuranScreen`
- [x] Fetch `GET /api/v1/munasabah/ayah/:ayahId`
- [x] Show hasil di bottom-sheet (ikut pattern modal popup existing)
- [x] Test: minimal 1 positive case render

**Status 2026-05-16:** Selesai. `QuranScreen` sudah memakai action detail ayah + `AppModalSheet`; test positif ditambahkan di `quranScreen.test.js`.

---

## 9. Hadis-Ayah Cross-Reference — S (1 sub-task)

**Endpoint:** `GET /hadiths/:hadithId/ayahs`, `GET /ayahs/:ayahId/hadiths`

### [F-9.1] Tampilkan di detail hadis & ayah (S)

- [x] Di `HadithScreen` detail view: tambah section "Ayat Terkait"
- [x] Di `QuranScreen` detail ayah: tambah section "Hadis Terkait"
- [x] Fetch dari endpoint masing-masing, render sebagai list of chips/links
- [x] Tap chip → open di screen terkait

**Status 2026-05-16:** Selesai. Detail hadis punya tab `Ayat`; item terkait sekarang bisa membuka tab Quran dengan `surahNumber`, `ayahNumber`, dan `ayahId`. Sisi detail ayah Quran sudah membuka bottom-sheet `Hadis Terkait`.

---

## 10. Tafsir Side-by-Side — M (2 sub-tasks)

**Web ref:** Toggle "Bandingkan" → 2-column grid Kemenag kiri, Al-Mishbah kanan
**Existing mobile:** `surah-content` type — single tafsir view

### [F-10.1] Toggle kitab selector (S)

- [ ] Di `renderDetailScreen()` untuk tafsir: tambah toggle/segmented control (All / Kemenag / Al-Mishbah)
- [ ] Fetch data untuk 2 kitab sekaligus (existing API returns both)

### [F-10.2] Side-by-side layout (M)

- [ ] Mode "Bandingkan": render 2 column scroll — Kiri=Kemenag, Kanan=Al-Mishbah
- [ ] Di mobile sempit, alternative: stacked accordion (expand Kemenag atau Al-Mishbah)
- [ ] Test: toggle state, both kitab render

---

## 11. Streak Risk Notification — S (1 sub-task)

**Web ref:** `streak_risk` type + web push service worker
**Existing mobile:** `NotificationCenter` component sudah render semua inbox dari BE

### [F-11.1] Pastiin streak_risk terender (S)

- [x] Cek `NotificationCenter` — sudah generic render berdasarkan `type` field
- [x] Pastiin `DispatchDueReminders` di backend kirim notif dengan `type: 'streak_risk'`
- [x] Kalo perlu, tambah render case khusus di `NotificationCenter` untuk streak_risk (icon khusus, message ajakan)
- [x] Test: mock `streak_risk` notif renders correctly

**Status 2026-05-16:** Selesai. `NotificationCenter` punya presentation khusus `streak_risk` dengan fallback title/body, tetap menghormati title/body dari backend, dan sudah ditutup test.

---

## Summary

| Feature                 | Subtasks | Effort           | Dependencies                  |
| ----------------------- | -------- | ---------------- | ----------------------------- |
| 1. Forum Q&A            | 3        | **L**            | None                          |
| 2. Adzan Audio          | 3        | **L**            | `expo-audio` (already in)     |
| 3. Zakat Riwayat        | 3        | **L**            | None                          |
| 4. Faraidh Dual-Sync    | 2        | **M**            | None                          |
| 5. Tokoh Tarikh         | 1        | **S**            | None                          |
| 6. Peta Interaktif      | 3        | **L**            | `react-native-maps` (new dep) |
| 7. Wirid Asmaul Husna   | 2        | **M**            | None                          |
| 8. Munasabah            | 1        | **S**            | None                          |
| 9. Hadis-Ayah           | 1        | **S**            | None                          |
| 10. Tafsir Side-by-Side | 2        | **M**            | None                          |
| 11. Streak Risk Notif   | 1        | **S**            | None                          |
| **Total**               | **22**   | **6S + 4M + 3L** |                               |

## Recommended Order

1. **Tokoh Tarikh** (S) — paling gampang, tinggal tambah entry di mobileFeatures
2. **Hadis-Ayah** (S) — API sudah, tinggal render
3. **Munasabah** (S) — API sudah, tinggal bottom-sheet
4. **Streak Risk** (S) — tinggal verifikasi render
5. **Faraidh Dual-Sync** (M) — port logic + API
6. **Wirid Asmaul** (M) — reuse tasbih pattern
7. **Tafsir Side-by-Side** (M) — toggle + dual column
8. **Zakat Multi-Tab** (L) — banyak state baru
9. **Adzan Audio** (L) — countdown + audio player
10. **Forum Q&A** (L) — full screen baru
11. **Peta Interaktif** (L) — library baru + screen kompleks
