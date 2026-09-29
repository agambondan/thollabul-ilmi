# Mobile Performance & Codebase Deep Review (Post-Fix Pass) — 29 Sep 2026

## Executive Summary

Audit menyeluruh pasca-implementasi perbaikan performa, caching, dan ketahanan offline (Phase 1–3) terhadap 30 butir temuan pada `2026-09-28-mobile-performance-deep-review.md`. Audit ini meninjau ulang kode yang baru diubah untuk mengidentifikasi regresi, edge case yang terlewat, dan bug tersembunyi yang muncul selama pengerjaan.

### Status Verifikasi
- **Mobile Test Suite:** 66/66 suites passing, **852/852 tests passing** (Jest `--runInBand`)
- **Backend API Test Suite:** All packages passing (`go test ./...`)
- **Emulator Smoke Tests:** Lulus di `tholabul_pixel_7_api36`

---

## Temuan Bug & Perbaikan Selama Deep Review

### 1. [Fix] `mutationQueue` Tidak Pernah Terpicu Flush Otomatis
- **Masalah:** Fungsi `flushMutationQueue` telah diimplementasikan di `src/storage/mutationQueue.native.js` dan diuji di `mutationQueue.test.js`, namun tidak pernah dipanggil di mana pun dalam lifecycle aplikasi (`App.js`). Mutasi offline yang tertahan di antrean SQLite tidak akan pernah terkirim ke server saat perangkat kembali online.
- **Perbaikan:** Menambahkan trigger auto-flush di `App.js` saat startup dan listener `AppState.addEventListener("change", ...)` saat state aplikasi kembali `"active"` menggunakan `requestJson`.

### 2. [Fix] Unbounded Array Growth pada Paginasi Sub-Route Explore
- **Masalah:** Pada `ExploreScreen.js`, pemanggilan `loadMoreFeature` menggunakan `mergeUniqueItems(items, nextItems)` tanpa batas maksimal (unbounded). Untuk sesi browsing panjang pada Feed, Kajian, Fiqh, Siroh, dan Doa, array dapat membengkak melebihi ribuan item dan memicu memory pressure.
- **Perbaikan:** Menambahkan sliding window limit `maxItems = 200` pada `mergeUniqueItems` di `ExploreScreen.helpers.js`. Jika jumlah item melebihi 200, item terlama dipotong (`slice(-maxItems)`).

### 3. [Fix] Penyimpanan Local History Masih Menggunakan AsyncStorage
- **Masalah:** Riwayat kalkulator (Faraidh dan Zakat) serta hitungan `asmaulWirid` masih melakukan sinkronisasi `JSON.stringify` besar ke `@react-native-async-storage/async-storage`.
- **Perbaikan:** Mengimplementasikan modul native berbasis SQLite:
  - `src/storage/calculatorHistory.native.js`: Menggunakan tabel `calculator_history` pada database SQLite lokal `tholabul_offline.db` dengan tracking kolom `synced`.
  - `src/storage/asmaulWirid.native.js`: Menggunakan transaksi SQLite pada tabel `asmaul_wirid`.
  - Memperbarui unit test terkait dengan mock database SQLite.

### 4. [Fix] Unmemoized ContentCard Memicu Re-render Massal
- **Masalah:** `ContentCard` dan `MetaRail` di `src/components/ContentCard.js` diekspor sebagai fungsi biasa tanpa `React.memo`. Karena komponen ini digunakan sebagai item list pada Hadis, Kajian, dan Explore, setiap pembaruan state lokal (seperti scroll tick atau audio progress) memicu re-render pada seluruh kartu yang tampak.
- **Perbaikan:** Membungkus `MetaRail` dan `ContentCard` dengan `React.memo`.

### 5. [Fix] Variabel Mock Out-of-Scope pada Babel Jest Setup
- **Masalah:** `jest.setup.js` menggunakan variabel `asyncStorageStore` di luar scope `jest.mock`, melanggar aturan hoist Babel Jest dan menyebabkan kegagalan 64 test suite secara serentak.
- **Perbaikan:** Mengubah penamaan variabel menjadi `mockAsyncStorageStore` dengan prefix `mock` yang diizinkan oleh Babel transformer.

---

## Matriks Status 30 Butir Temuan Pasca-Review

| No | Temuan / Optimasi | Status Terkini | Catatan Verifikasi |
|---|---|---|---|
| 1 | Lazy route Explore (`ExploreWebAppRouteRenderers.js`) | ✅ Selesai | 33 sub-route dievaluasi on-demand |
| 2 | In-memory client SWR cache (`apiCache.js`) | ✅ Selesai | Cache prefix public/auth + disk fallback |
| 3 | List item memoization (`SurahRowItem`, `ContentCard`, `FeedCard`) | ✅ Selesai | Semua row utama menggunakan `React.memo` |
| 4 | `InteractionManager` deferral untuk fetch berat | ✅ Selesai | Aktif pada HomeScreen, Hadith, Quran, Explore |
| 5 | Backend Redis response cache middleware | ✅ Selesai | Headers `X-Cache: HIT/MISS` + 5m TTL |
| 6 | Image prefetching utility (`useImagePrefetch.js`) | ✅ Selesai | Dedup prefetch cover blog & kajian |
| 7 | Context re-render isolation (`TabActivityContext`) | ✅ Selesai | State & dispatch dipisah, consumer di-memoize |
| 8 | AsyncStorage IO Bottlenecks | ✅ Selesai | Mutation queue, kalkulator, dan wirid migrasi ke SQLite |
| 9 | Progressive Quran font loading | ✅ Selesai | Non-blocking, fallback system font saat startup |
| 10 | Modal unmount lifecycle cleanup (`AppModalSheet.js`) | ✅ Selesai | Return null saat `!visible` |
| 11 | SecureStore no-fallback to plaintext | ✅ Selesai | Throws error saat SecureStore unavailable |
| 12 | `safeOpenURL` protocol whitelist sanitizer | ✅ Selesai | Whitelist `https:`, `http:`, `mailto:`, `tel:`, `geo:` |
| 13 | List pagination cap | ✅ Selesai | Max 200 items cap via `mergeUniqueItems` |
| 14 | Offline mutation queue | ✅ Selesai | Auto-flush saat AppState active |
| 15 | Global Audio session coordinator | ✅ Selesai | Singleton audioSession menghentikan audio konkuren |
| 16 | WebView unmount lifecycle (`KajianPlayerModal.js`) | ✅ Selesai | Null saat modal tutup, rilis renderer |
| 17 | i18n translation dictionary | ⏳ Backlog | Static heap aman, dapat dipisah per-locale nanti |
| 18 | Native Maps support (`HistoricalMapView.native.js`) | ✅ Selesai | Mendukung `useNativeMap` native maps |
| 19 | Metro `inlineRequires` & `hermes-stable` | ✅ Selesai | Diaktifkan di `metro.config.js` |
| 20 | GORM Tafsir `Select` & composite index | ✅ Selesai | Query DB optimal tanpa N+1 |
| 21 | Postgres GIN index `tsvector` untuk blog | ✅ Selesai | Indeks pencarian teks penuh aktif di DB |
| 22 | Compass throttle & stop saat inactive | ✅ Selesai | 500ms throttle, stop di background |
| 23 | Animated.Value cleanup saat inactive | ✅ Selesai | Stop animation loops pada screen blur |
| 24 | SQLite local storage untuk data berat | ✅ Selesai | `tholabul_offline.db` aktif |
| 25 | Per-endpoint rate limiting | ✅ Selesai | Limiter auth, search, personal terpisah |
| 26 | PKCE OAuth Google implementation | ✅ Selesai | S256 code challenge & verifier cookie |
| 27 | Security HTTP headers lengkap | ✅ Selesai | CSP, HSTS, X-Frame-Options DENY aktif |
| 28 | Crash reporting mobile client | ✅ Selesai | `ErrorBoundary` + Sentry client bridge |
| 29 | Accessibility touch targets & labels | ✅ Selesai | Komponen dasar dan feedback telah berlabel WCAG |
| 30 | Full offline data sync Explore | ⏳ Backlog | Quran, Hadis, Wirid, Kalkulator offline-ready |
