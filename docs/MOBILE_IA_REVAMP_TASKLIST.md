# Mobile IA Revamp Task List

> Created: 2026-05-07
> Scope: `apps/mobile`
> IA source of truth: `docs/MOBILE_IA_FINAL_APPROACH.md`
> Related baseline: `docs/MOBILE_DESIGN_REWORK_TASKLIST.md`

## Goal

Revamp arsitektur navigasi mobile agar mengikuti keputusan final IA:

- Bottom tab tetap 5 item: Beranda, Quran, Hadis, Ibadah, Belajar.
- Quran dan Hadis tetap first-class.
- Prayer tab menjadi Ibadah hub.
- Explore menjadi Belajar hub.
- Profil turun dari bottom tab menjadi account/settings surface yang diakses dari avatar/header dan Personal section.
- Fitur backend long-tail tetap terdeliver lewat grouping, search, shortcut, recently opened, badges, dan deep link alias.

## Design Contract

- [x] Semua perubahan mengikuti `docs/MOBILE_IA_FINAL_APPROACH.md`.
- [x] Bottom tab tidak lebih dari 5 item.
- [x] Tidak ada hub yang tampil sebagai flat grid panjang tanpa grouping.
- [x] Setiap fitur backend punya minimal satu entry point yang jelas.
- [x] Fitur yang muncul di dua intent tetap punya satu source screen/detail.
- [x] Deep link lama tetap kompatibel melalui alias.
- [x] Loading, empty, error, offline, auth, disabled, dan permission state tetap eksplisit.
    - Updated 2026-05-08: mobile punya global feedback toast untuk aksi sukses/gagal pada simpan/update/hapus penting.
- [x] Semua list panjang memakai virtualization atau pagination.
- [x] Web export, Expo Doctor, screenshot smoke, dan native smoke dijalankan sebelum revamp dianggap selesai.
    - Web export, Expo Doctor, screenshot smoke, dan deep-link smoke selesai 2026-05-08.
    - Native smoke Android (Expo Go) selesai 2026-05-08 via device `985c2f0e`; evidence di `output/native/2026-05-08/`.

---

## Phase 0 - IA Contract & Inventory

- [x] Tetapkan dokumen IA utama.
    - File: `docs/MOBILE_IA_FINAL_APPROACH.md`
- [x] Tandai proposal IA lain sebagai pembanding saja.
    - File: `docs/MOBILE_IA_APPROACH_A.md`, `docs/MOBILE_INFORMATION_ARCHITECTURE_APPROACH_CODEX.md`
- [x] Buat alias dokumen IA lama ke dokumen utama.
    - File: `docs/MOBILE_IA_FINAL.md`
- [x] Audit tab/screen mobile aktif sebelum refactor.
    - File: `apps/mobile/App.js`, `apps/mobile/src/components/TabBar.js`
    - Result: shell canonical sekarang memakai `home/quran/hadith/ibadah/belajar`; `profile` tetap hidden account surface.
- [x] Audit deep link lama dan route alias yang wajib dipertahankan.
    - File: `apps/mobile/src/utils/deepLinks.js`
    - Result: alias ditambahkan pada Phase 1 di sesi yang sama
- [x] Audit feature registry dan mapping feature ke hub final.
    - File: `apps/mobile/src/data/mobileFeatures.js`
- [x] Buat mapping final feature key -> hub -> source screen.
    - Output: `belajarFeatureGroups` menjadi mapping Belajar; Ibadah mapping ada di `apps/mobile/src/screens/IbadahScreen.js`.

## Phase 1 - Routing Compatibility & Tab Contract

- [x] Ubah kontrak tab final menjadi:
    - Beranda (`home`)
    - Quran (`quran`)
    - Hadis (`hadith`) ← ditambahkan sebagai first-class tab
    - Ibadah (`ibadah`) ← gantikan `prayer`
    - Belajar (`belajar`) ← gantikan `explore`
    - File: `apps/mobile/src/components/TabBar.js`
- [x] Pastikan `Hadis` tetap first-class tab, bukan feature di Belajar.
    - Icon: `ScrollText`; key: `hadith`; label: `Hadis`
- [x] Ubah tab `Prayer` menjadi `Ibadah` tanpa memutus state/back navigation.
    - `isActive={activeTab === 'ibadah'}` di App.js; `setBack`/`clearBack` tetap lewat props
- [x] Ubah tab `Explore` menjadi `Belajar` tanpa memutus feature detail.
    - Screen pane dan `deepLinkTarget` di App.js diupdate ke key `belajar`
- [x] Pindahkan `Profil` dari bottom tab ke account/settings surface.
    - Dihapus dari `tabs[]` di TabBar.js; ProfileScreen tetap ada di App.js sebagai hidden screen
- [x] Tambahkan route alias:
    - `prayer`, `sholat` -> `ibadah`
    - `explore`, `ilmu` -> `belajar`
    - `profile` -> tetap di `knownTabs`, accessible via deep link
    - `qibla`, `kiblat` -> `ibadah` view `qibla`
    - File: `apps/mobile/src/utils/deepLinks.js`
- [x] Update caller screens: `HomeScreen.js`, `ProfileScreen.js` — semua `onOpenTab('explore', ...)` → `onOpenTab('belajar', ...)`
- [x] Pastikan web hash deep link tetap bekerja untuk smoke test.
    - Checked: `#/prayer`, `#/prayer/settings`, `#/ibadah/jadwal-sholat`, `#/ibadah/qibla`, `#/qibla`, `#/explore/quiz`, `#/profile/storage`
- [x] Pastikan native scheme `thullaabulilmi://` tetap kompatibel.
    - Checked: `thullaabulilmi://kiblat` -> `ibadah` view `qibla`

## Phase 2 - Ibadah Hub

- [x] Refactor `PrayerScreen` atau buat `IbadahScreen` sebagai hub baru.
    - File: `apps/mobile/src/screens/IbadahScreen.js`
- [x] Jadikan Jadwal Sholat sebagai primary card di Ibadah.
- [x] Group section Ibadah:
    - Harian
    - Arah & Waktu
    - Dzikir & Bacaan
    - Alat
    - Rencana
- [x] Pindahkan/ekspos feature berikut ke Ibadah:
    - Jadwal Sholat
    - Log Sholat
    - Qibla
    - Doa
    - Dzikir
    - Wirid
    - Tasbih
    - Zakat
    - Faraidh
    - Khatam
    - Imsakiyah
    - Kalender Hijriah
    - Manasik
    - Asmaul Husna sebagai bacaan/dzikir entry
- [x] Pastikan feature detail lama tetap bisa dibuka dari hub Ibadah.
    - Jadwal Sholat dan Qibla memakai sub-view internal Ibadah.
    - Fitur ibadah lain masih membuka detail existing lewat `Belajar` sebagai transisi agar logic tidak diduplikasi.
    - Updated 2026-05-07: Zakat/Faraidh detail di Belajar/Ibadah entry dibuat lebih compact dengan field uang berprefix `Rp`, separator ribuan, dan panel ringkasan hasil.
- [x] Pastikan permission/location/compass states tetap jelas.
    - Reuse `PrayerScreen` dan `QiblaScreen` existing states.
- [x] Pastikan no long-scroll dump; gunakan section card/rows dan detail navigation.

## Phase 3 - Belajar Hub

- [x] Refactor `ExploreScreen` menjadi `BelajarScreen` atau rename konsep UI-nya.
    - Title diubah dari "Ilmu" → "Belajar"; grup tab + feature grid dihapus; hub grouped menggantikan.
    - File: `apps/mobile/src/screens/ExploreScreen.js`
- [x] Tambahkan search/filter feature katalog di Belajar.
    - `PaperSearchInput` + `catalogSections` useMemo dengan `matchesCatalogQuery` dan empty state.
- [x] Group section Belajar:
    - Kajian & Artikel
    - Siroh & Sejarah
    - Fiqh & Panduan
    - Referensi
    - Evaluasi
    - Personal Ringkas
- [x] Pindahkan/ekspos feature berikut ke Belajar:
    - Kajian, Blog/Artikel, Siroh, Sejarah, Fiqh, Manasik, Kamus, Quiz, Tafsir, Asbabun Nuzul, Perawi, Asmaul Husna
    - Jarh wa Ta'dil: added 2026-05-08 as Referensi entry via `/api/v1/jarh-tadil`
    - Komunitas/feed: added 2026-05-08 as Kajian & Artikel entry via `/api/v1/feed`, with like and comment surface.
    - Wirid Saya: added 2026-05-08 as personal Ibadah/Belajar entry via `/api/v1/user-wird`, with create/edit/delete form.
- [x] Tambahkan Personal Ringkas lengkap:
    - Goals, Stats, Leaderboard, Bookmarks, Notes
- [x] Pastikan Hadis tetap primary tab; Belajar hanya boleh menampilkan shortcut ilmu hadis/perawi.
    - Perawi ada di Referensi section; HadithScreen tetap dedicated tab.
- [x] Hindari flat grid panjang; gunakan grouped rows/card compact.
    - Menggunakan `SectionHeader` + `CompactRow` dalam `belajarCard` container.

## Phase 4 - Hadis First-Class Preservation

- [x] Pastikan tab Hadis tetap ada di bottom tab.
    - Ditambahkan di Phase 1: key `hadith`, icon `ScrollText`, label `Hadis`
- [x] Pastikan Hadis punya search/filter kitab horizontal.
    - File: `apps/mobile/src/screens/HadithScreen.js` — horizontal ScrollView dengan chip per kitab
    - Updated 2026-05-07: tambah `PaperSearchInput` untuk cari nomor/kitab/tema/teks hadis.
- [x] Pastikan Hadis detail tabs tetap utuh:
    - Teks ✓, Sanad ✓, Perawi ✓, Takhrij ✓, Catatan ✓
    - File: `HADITH_DETAIL_TABS` di HadithScreen.js
- [x] Pastikan saved hadith, notes, dan bookmarks tetap bekerja.
    - `bookmarkItems` state + `loadBookmarks()` + `NotesPanel` di tab Catatan
- [x] Pastikan shortcut Perawi/Jarh/Takhrij dari Belajar mengarah ke source screen Hadis/detail yang sama.
    - Reftype `hadith` di ExploreScreen routing ke `onOpenTab('hadith', { hadithId })` (line 353)
    - Perawi Referensi di Belajar menggunakan modal detail ExploreScreen yang sama
- [x] Pastikan deep link `hadith/:id` tidak berubah.
    - File: `apps/mobile/src/utils/deepLinks.js` — parameter `hadithId` tetap sama
- [x] Compact-kan list Hadis agar tab first-class tidak terasa seperti dump konten panjang.
    - File: `apps/mobile/src/screens/HadithScreen.js` — daftar utama sekarang row compact + local pagination `Muat lagi` per 10 item.

## Phase 5 - Profile Surface

- [x] Buat account/profile entry dari avatar Beranda.
    - Existing: avatar Beranda membuka `profile`.
- [x] Buat account/profile entry dari Belajar header atau Personal section.
    - Added: action icon `Buka Profil` di header Belajar.
- [x] Pindahkan Profil dari bottom tab tanpa menghapus screen/settings yang sudah ada.
    - Existing: ProfileScreen tetap hidden route di App.js.
- [x] Pastikan auth-required empty states masih punya CTA jelas ke Profil.
    - Updated copy: tidak lagi menyebut "tab Profil" setelah Profil keluar dari bottom tab.
- [x] Pastikan Profile settings detail tetap tersedia:
    - Account ✓, Notifications ✓, Offline ✓, Cache/data sementara ✓, Appearance ✓
    - Security ✓ — ditambahkan 2026-05-07: screen `settings-security` dengan placeholder Sesi Aktif/Ganti Sandi/Hapus Akun
    - File: `apps/mobile/src/screens/ProfileScreen.js` — `SettingsList` + `SubScreen security`
- [x] Pastikan personal summary tetap bisa ditemukan di Belajar/Profil:
    - Streak ✓, Points ✓ — stats row
    - Tilawah ✓, Hafalan ✓, Sholat ✓ — "Ringkasan Progress" grid, load via `getTilawahSummary`, `getHafalanSummary`, `getPrayerStats`
    - Goals ✓ — MenuRow link ke Belajar > goals
    - Achievements ✓ — grid pencapaian dinamis via `/api/v1/achievements` + `/api/v1/achievements/mine`
    - File: `apps/mobile/src/screens/ProfileScreen.js`, `apps/mobile/src/api/personal.js` (added `getTilawahSummary`, `getAchievements`, `getMyAchievements`)

## Phase 6 - Discovery Layer

- [x] Tambahkan atau rapikan global search untuk fitur dan konten.
    - Feature search: ExploreScreen (Belajar) punya `PaperSearchInput` + `catalogSections` filter untuk cari fitur
    - Content search: Search icon di HomeScreen → Global Search overlay; fallback lama tetap ke Kamus (`/api/v1/kamus`) dengan `focusSearch: true`
    - Updated 2026-05-08: Global Search menjadi overlay Beranda dengan filter Semua/Quran/Hadis/Kamus/Perawi/Fitur, recent search chips, quick suggestions, dan deep link `#/search/:query`.
    - Updated 2026-05-08: Hasil Quran dari Global Search membuka surah dengan preview/highlight ayat target dan tombol menuju posisi dalam surah; deep link Quran mendukung `#/quran/surah/:surah/:ayah`.
- [x] Tambahkan recently opened di Beranda.
    - File: `apps/mobile/src/storage/recentFeatures.js`, `apps/mobile/src/screens/HomeScreen.js`
    - Result: membuka fitur di Belajar akan masuk ke "Terakhir Dibuka" di Beranda.
- [x] Tambahkan pinned shortcuts/favorites di Beranda.
    - File: `apps/mobile/src/storage/recentFeatures.js`, `apps/mobile/src/screens/ExploreScreen.js`, `apps/mobile/src/screens/HomeScreen.js`
    - Result: fitur di katalog Belajar bisa disematkan/lepas lewat tombol bintang; Beranda menampilkan maksimal 4 shortcut "Disematkan".
- [x] Tambahkan contextual shortcuts berdasarkan waktu/aktivitas:
    - Dzikir pagi (04:00–11:59) → Belajar > dzikir
    - Dzikir petang (15:00–19:59) → Belajar > dzikir
    - Qibla saat lokasi aktif (bukan NONAKTIF/BELUM TERSEDIA) → Ibadah > qibla
    - Tafsir setelah baca Quran (recentFeatures contains 'quran') → Belajar > tafsir
    - File: `apps/mobile/src/screens/HomeScreen.js` — `contextualShortcuts` useMemo, render "SARAN SEKARANG" card
- [x] Tambahkan badge kecil di feature rows/cards:
    - Butuh akun
    - Offline
    - Lokal
    - Group fallback
    - Updated 2026-05-08: katalog Belajar sekarang menampilkan badge `Baru`, `Terakhir`, `Akun`, dan `Lokal` langsung di feature row.
- [x] Pastikan Home tetap ringkas dan tidak menjadi katalog semua fitur.
    - Pinned shortcuts dibatasi 4 item, recently opened dibatasi 3 item; katalog lengkap tetap di Belajar.

## Phase 7 - Documentation Updates

- [x] Update `docs/MOBILE_DESIGN_REWORK_TASKLIST.md` agar phase baru mengacu ke tasklist ini.
    - Ditambahkan catatan 2026-05-07: link ke IA revamp tasklist + design patterns
- [x] Update `docs/MOBILE_FEATURE_REFERENCE.md` status navigasi mobile setelah IA revamp.
    - Tabel status mobile diupdate: 5 tab final, Ibadah hub, Belajar hub, Profil sebagai settings surface, deep link alias
- [x] Tambahkan catatan migration/deep link compatibility.
    - `docs/MOBILE_FEATURE_REFERENCE.md` baris Deep link: alias `prayer`→`ibadah`, `explore`→`belajar`, `qibla`→`ibadah/qibla`
    - Source truth: `apps/mobile/src/utils/deepLinks.js`
- [x] Catat screenshot/native evidence path setelah QA.
    - Web Hadis compact smoke: `output/playwright/mobile-hadith-compact-list.png`
    - Web Komunitas catalog/feed smoke: `output/playwright/mobile-belajar-community-catalog.png`, `output/playwright/mobile-belajar-community-feed.png`
    - Web Wirid Saya catalog/auth smoke: `output/playwright/mobile-belajar-user-wird-catalog.png`, `output/playwright/mobile-belajar-user-wird-auth.png`
    - Native full smoke masih pending di Phase 8 karena ADB input Xiaomi diblok `INJECT_EVENTS`.
- [x] Jalankan `chronicle.sync` setelah perubahan signifikan.
    - Attempted 2026-05-07 after Hadis compact/search slice.
    - Attempted 2026-05-07 after Quran reader action menu + display modes.
    - Attempted 2026-05-07 after TabBar auto-hide neutral color.
    - Passed 2026-05-08 after final web/deep-link QA: `chronicle-agent sync` sent 4 chunks and ingest returned `202 Accepted`.

## Phase 8 - QA & Verification

- [x] `npx expo export --platform web` pass.
    - Last checked: 2026-05-08 after web hash deep-link listener fix.
- [x] `npx expo-doctor` pass.
    - Last checked: 2026-05-08, 17/17 checks passed.
- [x] `git diff --check -- apps/mobile docs` clean untuk file terkait.
    - Last checked: 2026-05-08 after final QA updates.
- [x] Screenshot smoke web desktop/mobile untuk:
    - Beranda
    - Quran
    - Hadis
    - Ibadah hub
    - Ibadah detail Jadwal Sholat
    - Ibadah detail Qibla
    - Belajar hub
    - Belajar feature detail
    - Profile/account surface
    - Evidence 2026-05-08:
        - `output/playwright/mobile-qa-beranda-mobile.png`, `output/playwright/mobile-qa-beranda-desktop.png`
        - `output/playwright/mobile-qa-quran-mobile.png`, `output/playwright/mobile-qa-quran-desktop.png`
        - `output/playwright/mobile-qa-hadis-mobile.png`, `output/playwright/mobile-qa-hadis-desktop.png`
        - `output/playwright/mobile-qa-ibadah-mobile.png`, `output/playwright/mobile-qa-ibadah-desktop.png`
        - `output/playwright/mobile-qa-ibadah-qibla-mobile.png`, `output/playwright/mobile-qa-ibadah-qibla-desktop.png`
        - `output/playwright/mobile-qa-belajar-mobile.png`, `output/playwright/mobile-qa-belajar-desktop.png`
        - `output/playwright/mobile-qa-belajar-quiz-mobile.png`, `output/playwright/mobile-qa-belajar-quiz-desktop.png`
        - `output/playwright/mobile-qa-profile-mobile.png`, `output/playwright/mobile-qa-profile-desktop.png`
    - Additional evidence 2026-05-07: `output/playwright/mobile-zakat-calculator-polish.png`, `output/playwright/mobile-faraidh-calculator-polish.png`
- [x] Deep link smoke untuk:
    - `#/profile`
    - `#/prayer`
    - `#/qibla`
    - `#/explore/:featureKey`
    - route baru Ibadah/Belajar
    - Passed 2026-05-08: `#/profile`, `#/prayer`, `#/qibla`, `#/explore/quiz`, `#/ilmu/kamus`, `#/ibadah/qibla`, `#/belajar/quiz`, `#/quran/surah/1/1`.
    - Fix 2026-05-08: web hash changes now call deep-link parsing through a `hashchange` listener in `apps/mobile/App.js`.
- [x] Native Expo Go smoke Android untuk:
    - Bottom tab final
    - Avatar -> Profile surface
    - Ibadah hub
    - Belajar hub
    - Hadis tab
    - Qibla
    - Passed 2026-05-08: Expo Go berhasil di-install via ADB dan bundle native berhasil (`Android Bundled ... index.js`).
    - Evidence: `output/native/2026-05-08/android-native-smoke-home-2026-05-08.png`, `android-native-smoke-quran-2026-05-08.png`, `android-native-smoke-hadith-2026-05-08.png`, `android-native-smoke-ibadah-2026-05-08.png`, `android-native-smoke-qibla-2026-05-08.png`, `android-native-smoke-belajar-2026-05-08.png`, `android-native-smoke-profile-2026-05-08.png`.
- [x] Native deep-link sweep Android (canonical + alias) untuk route IA.
    - Passed 2026-05-08: 30 route diuji via `exp://.../--/<route>` tanpa crash/fatal.
    - Coverage contoh: `home`, `search/:query`, `global-search/:query`, `quran/surah/:surah/:ayah`, `quran/page/:page`, `quran/hizb/:hizb`, `hadith/:id`, `hadis/:id`, `hadits/:id`, `ibadah`, `prayer`, `sholat`, `qibla`, `kiblat`, `belajar`, `explore`, `ilmu`, `profile/settings|account|notifications|storage|appearance`.
    - Evidence folder: `output/native/2026-05-08/deeplink-sweep/`.
- [x] Manual native check jika ADB input masih diblok:
    - Keyboard behavior
    - Native time picker
    - Permission prompts
    - Offline pack confirmation
    - Passed 2026-05-08 (device `985c2f0e`): ADB input berjalan dan verifikasi form/permission end-to-end selesai.
    - Evidence: `output/native/2026-05-08/manual-checks/01-keyboard-global-search.png`, `02-location-permission-prompt.png`, `03-offline-download-confirm.png`, `10-native-time-picker-open.png`, `11-storage-before-clear.png`.

## Suggested Implementation Order

1. Phase 0 + Phase 1: contract, route aliases, and tab shell.
2. Phase 2: Ibadah hub because it replaces the narrow Prayer tab.
3. Phase 3: Belajar hub because it absorbs Explore.
4. Phase 5: Profile surface after bottom tab no longer owns Profil.
5. Phase 6: discovery layer.
6. Phase 8: full smoke and native verification.

## Current Blockers / Risks

- ADB input injection on the Xiaomi device may still be blocked by `INJECT_EVENTS`; native manual checks may require direct physical taps.
- Moving Profil out of bottom tab requires careful auth CTA and deep link compatibility.
- `ExploreScreen` currently carries many feature detail behaviors; refactor should preserve source screen/state instead of duplicating logic.
- Hadis must remain first-class and should not be visually buried inside Belajar.
