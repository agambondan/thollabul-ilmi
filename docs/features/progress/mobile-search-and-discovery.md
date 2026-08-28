# Mobile Search and Discovery

Status: `IN_PROGRESS`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Membuat discovery lintas modul terasa konsisten sehingga user bisa menemukan
Quran, Hadis, Doa, Kajian, dan feature tanpa pindah-pindah tab.

## Scope

- Mobile:
    - global search
    - pinned shortcut
    - recently opened
    - contextual shortcut di Beranda
    - deep link dari hasil search ke detail yang benar
- API:
    - endpoint search existing tetap jadi sumber data utama
- Data:
    - metadata hasil search perlu cukup untuk routing detail

## Current Baseline

- Discovery layer adalah bagian wajib dari IA final.
- Beranda sudah menjadi delivery surface untuk shortcut, pinned, dan recently
  opened.
- Global Search screen sudah ada di mobile dan masih perlu smoke detail route.

## Task List

1. `DONE_STRUCTURAL` Pastikan hasil Quran dari search masuk ke detail
   ayah/surah tanpa glitch.
2. Smoke hasil dari source lain: Hadis, Doa/Dzikir, Kajian, dan feature.
3. `DONE_STRUCTURAL` Seragamkan empty state dan loading state.
4. Pastikan recent item terisi dari open detail yang valid.

## Acceptance Criteria

- klik hasil Quran tidak menimbulkan glitch navigasi
- hasil dari modul lain membuka detail yang sesuai
- metadata source terlihat natural untuk user, bukan istilah teknis backend
- user bisa lanjut dari recent item tanpa kehilangan konteks

## Evidence

- Quran result dari Global Search membuka reader dengan target ayah dan reader
  auto-scroll ke ayat target setelah data siap.
- Global Search memakai `ContentCard` shared untuk hasil Quran, Hadis, Doa,
  Kajian, Fitur, Kamus, dan Perawi agar spacing/metadata lebih seragam.
- Empty state sekarang kontekstual per filter, misalnya Quran, Hadis, Doa,
  Kamus, Fitur, dan Perawi punya wording berbeda.
- Loading state memakai card skeleton pencarian, bukan teks loading polos.
- Metadata hasil search difilter supaya istilah teknis seperti `backend`,
  `server`, `storage`, `device`, dan `perangkat` tidak muncul ke user.
- Partial failure search tetap menampilkan modul yang berhasil dimuat dan hanya
  memberi pesan modul mana yang belum bisa dimuat.
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-global-search-polish-export`
  `PASS`.
- Device/API smoke 2026-05-14:
    - `curl 'http://localhost:9900/api/v1/search?q=shalat&type=all&limit=18'`
      `HTTP 200`; runtime API aktif masih mengembalikan shape legacy top-level
      `ayahs/hadiths/...`, dan mobile client sudah menormalisasi shape legacy
      maupun wrapped `data`.
    - Deep link `exp://10.13.55.208:19007/--/search?q=shalat` membuka screen
      Cari tanpa fatal/redbox/network error pada logcat snapshot.
    - Screenshot evidence: `/tmp/thollabul-smoke/search-2026-05-14.png`.
- Smoke klik hasil source selain Quran masih perlu sentuhan manual di device
  karena ADB input otomatis diblokir MIUI.
- Fix count mismatch `sabar` 2026-05-14:
    - Runtime API terbukti berbeda karena `type=all` mengembalikan Quran `6`,
      sedangkan `type=ayah` mengembalikan Quran `24` untuk query `sabar`.
    - `GlobalSearchScreen` sekarang saat filter `Semua` tetap mengambil hasil
      global, tetapi menghidrasi hasil Quran dengan request `type=ayah` sehingga
      angka `Quran` tidak berubah dari 6 ke 24 saat user pindah tab.
    - `node --check apps/mobile/src/screens/GlobalSearchScreen.js` `PASS`.
    - `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-search-sabar-count-export`
      `PASS`.

## Source of Truth

- `docs/MOBILE_IA_FINAL_APPROACH.md`
- `docs/MOBILE_FEATURE_REFERENCE.md`
- `apps/mobile/src/screens/GlobalSearchScreen.js`
