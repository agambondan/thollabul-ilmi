# Deep Review: Bug Korektnes pada Perubahan Belum Commit (2026-09-25)

> Scope: `git diff` working tree `apps/mobile/` — rework Audio Range Quran,
> rollout dark-theme WebApp Explore/Belajar, shell/notification components,
> Profile/Qibla/Home Dashboard, dan Ibadah/Prayer/Tokoh Tarikh. **Bukan** audit
> UI/UX/desain — untuk itu lihat
> [2026-09-25-mobile-design-deep-review.md](./2026-09-25-mobile-design-deep-review.md)
> dan [2026-09-25-mobile-ui-ux-anti-slop-deep-review.md](./2026-09-25-mobile-ui-ux-anti-slop-deep-review.md).
>
> Dijalankan 2x di hari yang sama karena diff terus bertambah selagi sesi lain
> jalan bersamaan: **Putaran 1** meninjau 24 file, **Putaran 2** meninjau ulang
> di 45 file (dark-theme rollout meluas ke ~14 route `WebApp*Route.js` lain,
> plus `Card.js`, `ProfileScreen*`, `QiblaScreen.js`, `HomeDashboardContent.js`,
> `theme.js`). Semua 12 temuan terverifikasi lalu **diperbaiki** di
> **Putaran 3** (lihat status per baris) — 1 dari 12 (H5) ternyata sudah
> diperbaiki duluan oleh sesi lain sebelum Putaran 3 mulai.

**Metodologi review**: agent independen me-review diff per area fitur/route
cluster, lalu **setiap** temuan diverifikasi ulang oleh agent skeptis terpisah
yang disuruh aktif mencari alasan untuk menolak klaim tersebut. Beberapa
temuan paling kritis juga dicek manual lewat `grep`/`sed` langsung ke file
sumber. **Metodologi fix**: setiap temuan dicek ulang statusnya tepat sebelum
diedit (workspace ini dipakai bersama beberapa sesi agent lain yang terus
mengubah file yang sama), diperbaiki dengan perubahan sesempit mungkin, lalu
divalidasi dengan full test suite (`56 suites / 794 tests`, semua **PASS**
sebelum dan sesudah fix) plus `prettier --write` pada file yang disentuh.

## Ringkasan Status (gabungan Putaran 1 + 2 + fix Putaran 3)

| #   | Severity     | File                                          | Ringkasan                                                                                                           | Status                                                                |
| --- | ------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| C1  | **Critical** | `NotificationCenter.js:1507`                  | Referensi konstanta terhapus → crash tab Kotak Masuk web-app layout                                                 | ✅ **Fixed**                                                          |
| C2  | **Critical** | `WebAppForumRoute.js:371`                     | `onPress={loadMoreQuestions}` — identifier tidak pernah dideklarasikan → crash tab Forum                            | ✅ **Fixed**                                                          |
| H1  | High         | `QuranScreen.js:1584`                         | "Putar audio" per-ayah salah membuka/mengontrol Audio Range sheet                                                   | ✅ **Fixed**                                                          |
| H2  | High         | `QuranScreen.js:655`                          | State panel Audio Range tidak direset saat pindah surah                                                             | ✅ **Fixed**                                                          |
| H3  | High         | `ExploreWebAppRoutes.js` / `ExploreScreen.js` | `isDarkTheme` tidak pernah dialirkan ke context WebApp routes → seluruh dark-mode Tafsir & Asbabun Nuzul mati total | ✅ **Fixed**                                                          |
| H4  | High         | `WebAppLibraryRoute.js:274`                   | `isDarkTheme = false` default param + call site tak kirim prop → dark-mode Perpustakaan tetap mati                  | ✅ **Fixed**                                                          |
| H5  | High         | `WebAppForumRoute.js:504`                     | 6 style key dark (`voteButtonDark`, dll.) direferensikan tapi tak pernah didefinisikan                              | ✅ Sudah diperbaiki sesi lain (dicek ulang di Putaran 3, sudah benar) |
| M1  | Medium       | `QuranScreen.webAppTheme.js:13`               | Warna `muted` web-app light berubah dari kontras ~4.8:1 jadi ~2.6:1 (gagal WCAG AA)                                 | ✅ **Fixed**                                                          |
| M2  | Medium       | `WebAppForumRoute.js:49`                      | `questionTitleDark` didefinisikan tapi tak dipakai → judul gelap di atas card gelap                                 | ✅ **Fixed**                                                          |
| M3  | Medium       | `WebAppLibraryRoute.js:356` dkk               | Search bar/error/loading/inline-page badge belum ikut `isDark` walau style `*Dark`-nya sudah ada                    | ✅ **Fixed**                                                          |
| L1  | Low          | `WebAppForumRoute.js:377`                     | i18n key `explore.forum.loadingMore` tidak ada di kamus → fallback tampilkan raw key                                | ✅ **Fixed**                                                          |

Temuan lama #5 Putaran 1 (`WebAppTafsirRoute.js:485`, loading/error state belum
dark) sudah **diserap** oleh H3 — root cause-nya (prop `isDarkTheme` tidak
sampai) menjelaskan kenapa loading/error state itu, dan sebenarnya seluruh
styling dark Tafsir/Asbabun Nuzul, tidak pernah aktif. Fix H3 otomatis
menyelesaikan ini juga.

**Grup bersih** (tidak ada temuan solid di kedua putaran review): Ibadah/Prayer/Tokoh
Tarikh/Profile/Qibla/Home Dashboard (termasuk 74 baris terhapus di
`PrayerScreen.js`), dan WebApp Faraidh/Wird route cluster.

---

## C1. [Critical] Crash tab Kotak Masuk Notification Center (web-app layout) — ✅ Fixed

**File**: `apps/mobile/src/components/NotificationCenter.js:1507`

Diff menghapus konstanta modul `WEB_APP_NOTIF_SURFACE/TILE/BORDER/ACCENT/MUTED`
dan menggantinya dengan factory `createWebAppNotifStyles(isDark)` + variabel
lokal `webAppAccent`. Semua pemakaian lama sudah dimigrasi — **kecuali** satu
baris yang masih memakai `WEB_APP_NOTIF_ACCENT` yang sudah tidak eksis, bikin
`ReferenceError` setiap kali tab Kotak Masuk dirender dengan minimal satu
notifikasi di web-app layout.

**Fix diterapkan**: ganti `WEB_APP_NOTIF_ACCENT` → `webAppAccent` di baris 1507.

---

## C2. [Critical] Crash tab Forum saat "Muat lagi" — ✅ Fixed

**File**: `apps/mobile/src/screens/explore/WebAppForumRoute.js:371`

Diff mengganti `onPress={loadMore}` menjadi `onPress={loadMoreQuestions}` —
identifier yang tidak pernah dideklarasikan di file ini. Tombol "Muat lagi"
dirender setiap kali `forumHasMore === true`, jadi `ReferenceError` langsung
crash seluruh tab Forum begitu ada >1 halaman pertanyaan.

**Fix diterapkan**: kembalikan ke `onPress={loadMore}`.

---

## H1. "Putar audio" per-ayah salah mengontrol Audio Range sheet — ✅ Fixed

**File**: `apps/mobile/src/screens/QuranScreen.js:1584` (`playAyahAudio`), `apps/mobile/src/screens/quran/QuranAudioRangePanel.js:63`

`playAyahAudio()` memanggil `setAudioPlayerOpen(true)` untuk menampilkan panel
Audio Range setiap kali user memutar satu ayat — ini memang UX yang disengaja
(dikonfirmasi lewat `docs/reviews/2026-09-25-mobile-design-deep-review.md`
bagian C, "Fix Applied: ... atau play per-ayah ditekan"). Bug-nya bukan di
pembukaan panelnya, tapi `isPlaying` di panel dihitung murni dari
`audioRange.playing || audioRange.loading` — tidak pernah tahu ada audio ayat
tunggal yang sedang berjalan (`audioState.playingAyahId`/`loadingAyahId`).
Akibatnya tombol menampilkan status "tidak sedang main" walau audio ayat
sebenarnya berjalan, dan menekannya memicu `startRangeAudio()` yang
menghentikan audio ayat lalu memulai antrian range yang tidak relevan.

**Fix diterapkan**: `isPlaying` di panel sekarang juga memperhitungkan
`audioState.playingAyahId`/`loadingAyahId`. Tombol yang sama
(`isPlaying ? stopRangeAudio : startRangeAudio`) otomatis benar setelah ini —
`stopRangeAudio()` sudah memanggil `stopAudio()` mentah di dalamnya, jadi
menekan tombol saat audio ayat berjalan sekarang menghentikan audio ayat itu
(bukan malah memulai range queue) dan menutup panel, tanpa perlu mengubah
handler tombolnya sendiri.

---

## H2. Panel Audio Range menempel ke surah berikutnya — ✅ Fixed

**File**: `apps/mobile/src/screens/QuranScreen.js:655` (`resetReaderState`), `:1067` (`closeReader`)

`resetReaderState()`/`closeReader()` hanya memanggil `stopAudio()` mentah —
tidak pernah `stopRangeAudio()` — sehingga `audioPlayerOpen`/`audioRangeCollapsed`
tidak pernah direset saat pindah surah. Sheet Audio Range yang dibuka di satu
surah muncul lagi di surah berikutnya, lengkap dengan pilihan range & qari
yang masih milik surah sebelumnya.

**Fix diterapkan**: ganti pemanggilan `stopAudio()` menjadi `stopRangeAudio()`
di kedua fungsi (`stopRangeAudio` adalah superset — sudah memanggil
`stopAudio()` di dalamnya, plus reset `audioPlayerOpen`/`audioRangeCollapsed`/
`audioRange`/`audioState.playingAyahId`). `closeReader` dibungkus
`useCallback`, dependency array-nya ikut diupdate dari `[stopAudio]` ke
`[stopRangeAudio]`.

---

## H3. Prop `isDarkTheme` tidak pernah sampai ke WebApp routes — ✅ Fixed

**File**: `apps/mobile/src/screens/ExploreScreen.js` (root cause)

Rantai bug: `ExploreScreen.js:244` menghitung `isDarkTheme` dari
`useLayoutModePreference()`, tapi objek props yang dikirim ke
`renderExploreWebAppRoute()` tidak pernah menyertakan key `isDarkTheme` mentah
— jadi setiap komponen `WebApp*Route` yang menerima `isDarkTheme={isDarkTheme}`
dari `ExploreWebAppRoutes.js` (mis. `WebAppTafsirRoute` untuk varian `tafsir`
& `asbabun-nuzul`) sebenarnya selalu menerima `undefined`, yang lalu jatuh ke
default parameter `false` di komponen tersebut — permanen mati, tidak peduli
preferensi tema asli user.

**Fix diterapkan**: tambahkan `isDarkTheme,` ke objek props di pemanggilan
`renderExploreWebAppRoute()` (`ExploreScreen.js`). Ini otomatis memperbaiki
semua route yang sudah benar menerima prop ini dari `ExploreWebAppRoutes.js`
(Tafsir, Asbabun Nuzul, dan lainnya) sekaligus.

---

## H4 + M3. Dark-mode Perpustakaan tetap mati — ✅ Fixed

**File**: `apps/mobile/src/screens/explore/WebAppLibraryRoute.js`, `apps/mobile/src/screens/explore/ExploreWebAppRoutes.js:3001`

Dua bug independen di file yang sama: (1) call site `<WebAppLibraryRoute>` di
`ExploreWebAppRoutes.js` tidak pernah mengirim prop `isDarkTheme` sama sekali
(beda dari sibling `WebAppFiqhRoute` yang sudah benar); (2) bahkan seandainya
prop itu sampai, 6 elemen (search bar, `TextInput`, error banner, loading
state, badge halaman inline) tidak pernah memakai style `*Dark` yang sudah
didefinisikan di stylesheet-nya.

**Fix diterapkan**: tambahkan `isDarkTheme={isDarkTheme}` di call site
`ExploreWebAppRoutes.js`, lalu tambahkan kondisional
`isDark && styles.xDark` ke 6 elemen yang terlewat
(`search`/`input`/`error`/`state`/`stateText`/`inlinePage`).

---

## H5 + M2. Dark-mode Forum — style dark hilang & tak terpakai

**File**: `apps/mobile/src/screens/explore/WebAppForumRoute.js`

- **H5** (6 style dark yang direferensikan JSX tapi tidak pernah didefinisikan)
  — **dicek ulang saat fix Putaran 3, ternyata sudah diperbaiki oleh sesi lain**
  di antara Putaran 2 dan sesi fix ini (`voteButtonDark`, `voteButtonTextDark`,
  `detailBodyDark`, `sectionTitleDark`, `answerCardDark`,
  `smallVoteButtonDark` semuanya sudah terdefinisi di `StyleSheet.create` dan
  dipakai di JSX). Tidak ada perubahan tambahan diperlukan.
- **M2** (baris 49): kebalikannya — `questionTitleDark` (warna `#f8fafc`)
  sudah didefinisikan tapi belum dipakai di JSX judul pertanyaan (list card,
  bukan detail) — **✅ Fixed**: ditambahkan
  `isDarkTheme && styles.questionTitleDark`.

---

## M1. Regresi kontras warna `muted` di web-app Quran (light mode) — ✅ Fixed

**File**: `apps/mobile/src/screens/QuranScreen.webAppTheme.js:13`

Warna `muted` untuk light theme diganti dari hardcode `#64748b` (kontras
~4.8:1 terhadap putih, lolos WCAG AA) menjadi diturunkan dari token bersama
`colors.light.muted` di `theme.js` (`#94a3b8`, ~2.6:1, gagal AA) — dipakai di
`surahMeta`/`readerSubtitle`/`quranSubtitle`.

**Fix diterapkan**: `muted: isDark ? t.muted : "#64748b"` — sengaja **tidak**
mengubah token bersama `theme.js` (dipakai luas di banyak screen lain, blast
radius terlalu besar untuk fix sesempit ini), cukup override lokal di file
tema web-app Quran untuk light mode saja. Dark mode tidak disentuh (nilainya
memang tidak berubah antara sebelum/sesudah diff aslinya).

---

## L1. i18n key hilang untuk label "Muat lagi" Forum — ✅ Fixed

**File**: `apps/mobile/src/screens/explore/WebAppForumRoute.js:377`, `apps/mobile/src/i18n/translations.js`

Label loading tombol "Muat lagi" diganti dari `explore.forum.loadingShort` ke
`explore.forum.loadingMore` — key yang tidak ada di `translations.js`, jadi
`translateMobile()` fallback menampilkan string mentah key-nya.

**Fix diterapkan**: tambahkan key `explore.forum.loadingMore` ke kamus id
(`"Memuat lebih banyak..."`) dan en (`"Loading more..."`), alih-alih
mengembalikan ke `loadingShort` — copy yang lebih spesifik untuk konteks
"memuat halaman berikutnya" ini tampak disengaja.

---

## Validasi

- `npx jest` di `apps/mobile`: **56 suites / 794 tests — PASS**, dijalankan
  sebelum dan sesudah seluruh fix di atas (tidak ada regresi baru).
- `npx prettier --write` dijalankan hanya pada file yang diedit.
- Setiap temuan dicek ulang langsung ke file sumber (bukan cuma dipercaya dari
  laporan review) tepat sebelum diedit, karena beberapa sesi agent lain
  mengedit file yang sama secara bersamaan selama hari ini.
- Tidak ada test otomatis baru ditambahkan untuk bug H1/H2 (state Audio Range)
  karena tidak ada test yang menutupi jalur ini sebelumnya — kalau mau lebih
  aman ke depan, pertimbangkan menambah test untuk `playAyahAudio` +
  `resetReaderState` di `quranScreen.test.js`.

## Rekomendasi Lanjutan

Pola "isDark dihitung tapi tak pernah sampai ke style" muncul di **4 file
berbeda** lintas 2 putaran review (Tafsir, Asbabun Nuzul, Library, dan
sebelumnya juga nyaris di Forum). Root cause utamanya (H3, di `ExploreScreen.js`)
sudah diperbaiki dan otomatis mencakup semua route yang menerima prop dari
`ExploreWebAppRoutes.js` dengan benar — tapi kalau ada waktu, audit cepat sisa
route yang belum direview detail di putaran ini (SholatTracker, Perawi,
Amalan, Doa, Asmaul Husna, Faraidh) untuk pola serupa sebelum dianggap selesai.
