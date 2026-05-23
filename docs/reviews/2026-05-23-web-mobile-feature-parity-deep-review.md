# Web Mobile Feature Parity Deep Review

Tanggal review: 2026-05-23
Scope: `apps/web`, `apps/mobile`, `docs/features/feature-manifest.json`, dan checker `scripts/check-feature-parity.js`.

## Verdict

Tidak ada blocker parity di level manifest route/key. Semua 50 fitur aktif di manifest punya route web dan entry mobile yang dikenali checker. Sebaliknya, semua mobile feature key yang bukan section/group internal juga sudah tercatat di manifest.

Yang masih ada bukan missing feature besar, melainkan gap kedalaman dan beberapa surface yang sengaja platform-specific.

Update follow-up 2026-05-23: mobile Profile settings sudah dikerjakan untuk current-device session, ganti sandi, bahasa konten, preferensi tema lokal, dan preferensi layout mode. Catatan follow-up ada di `docs/features/progress/2026-05-23-web-mobile-parity-gap-followup.md`.

- Mobile Profile tidak lagi menampilkan stub kosong untuk tampilan/keamanan, tetapi app-wide dark theme penuh, riwayat login multi-device, dan delete-account self-service masih tracked sebagai work lanjutan.
- Web punya utility/admin/dev surface yang tidak punya padanan mobile, dan ini tampak intentional.
- Mobile punya offline pack/native reminder behavior yang tidak punya padanan web langsung.
- Achievements/stats masih tidak setara secara kedalaman UI: web punya dashboard khusus, mobile lebih ringan lewat profile/feature surface.
- `jarh-tadil` di mobile muncul sebagai entry katalog sendiri, sedangkan web memetakan domain itu lewat `/perawi` dan `/dashboard/perawi`.

## Evidence

Command parity utama:

```bash
node scripts/check-feature-parity.js
```

Hasil:

```text
Feature parity check passed.
- manifest features: 50
- manifest utility routes: 14
- mobile feature keys: 43
- web app routes scanned: 153
```

Static review yang dipakai:

- `docs/features/feature-manifest.json`: 50 fitur aktif.
- `scripts/check-feature-parity.js`: validasi required field, web route file existence, mobile route existence, dan public route warnings.
- `apps/mobile/src/data/mobileFeatures.js`: katalog mobile.
- `apps/mobile/src/screens/explore/FeatureCatalog.js`: local tool routing dan feature badge behavior.
- `apps/mobile/src/screens/ExploreScreen.js`: handler detail fitur mobile.
- `apps/mobile/src/api/explore.js`: normalisasi payload list/generic endpoint.
- `apps/mobile/src/screens/ProfileScreen.js`: profile settings dan offline pack surface.
- `apps/web/src/app`: inventory route web, termasuk public, dashboard, admin, auth, dev, dan API proxy route.

## Web To Mobile

Status: pass di level route/key.

Manifest aktif mencakup 50 fitur: Quran, Hadith, search, doa, dzikir, wirid, user wird, Asmaul Husna, tafsir, asbabun nuzul, panduan sholat, siroh, tokoh, sejarah, historical map, fiqh, manasik, feed, kajian, library, blog, perawi, jarh ta'dil, forum, kamus, quiz, hijri, imsakiyah, tasbih, zakat, faraidh, jadwal sholat, kiblat, khatam, sholat tracker, bookmarks, notes, notifications, goals, muhasabah, hafalan, murojaah, tilawah, stats, leaderboard, dan achievements.

Semua feature route web di atas punya padanan mobile berupa:

- `tab:*` untuk surface utama seperti Quran dan Hadith.
- `ibadah:*` untuk jadwal sholat, kiblat, dan khatam.
- `feature:*` untuk katalog Belajar/Ibadah/Profile feature.
- `profile:*` untuk achievements.
- `internal:*` untuk global search.

Tidak ditemukan fitur manifest aktif yang hanya tersedia di web tanpa entry mobile.

### Gap Web Depth

| Area | Web | Mobile | Verdict |
|---|---|---|---|
| Achievements | `/dashboard/achievements` dedicated page | `profile:achievements` | Ada parity konsep, belum parity kedalaman chart/layout. |
| Stats | `/stats` dan `/dashboard/stats` | `feature:stats` | Ada entry mobile, tetapi perlu device smoke untuk memastikan data/visual setara. |
| Admin CRUD | `/admin/*` untuk konten dan users | Tidak ada | Intentional web-only operational surface. |
| Dev tools | `/dev` dan API key manager | Tidak ada | Intentional web-only utility surface. |
| Jarh Ta'dil | Web digabung di Perawi route | Mobile entry `jarh-tadil` | Parity route lewat `/perawi`, tetapi IA/taxonomy beda. |

## Mobile To Web

Status: pass di level feature manifest.

Mobile feature yang bukan group/section internal sudah masuk manifest atau alias. Feature local mobile juga bukan stub kosong:

- `tasbih`, `zakat`, `faraidh`, `notifications`, `surah-content`, `sholat-tracker`, `asmaul-wirid`, `asmaul-flashcard`, `forum`, `historical-map`, dan `tokoh` ditandai sebagai local tool type di `FeatureCatalog.js`.
- `ExploreScreen.js` punya handler khusus untuk zakat, faraidh, forum, sholat tracker, notifications, historical map, tokoh, Asmaul wirid/flashcard, surah content, dictionary, quiz, hijri, feed, bookmarks, notes, protected list, dan user wird.
- `explore.js` menormalisasi payload generic list dari API sehingga fitur list tidak hanya card statis.

Tidak ditemukan mobile feature utama yang tidak punya web route manifest.

### Gap Mobile-Specific

| Area | Mobile | Web | Verdict |
|---|---|---|---|
| Offline packs | `OfflinePackCard` di Profile > Penyimpanan | Tidak ada download/offline pack management eksplisit | Mobile-only platform capability. Perlu diputuskan apakah web harus punya PWA offline management atau cukup documented exclusion. |
| Native reminders | Notification center dan local reminders | Web notification/push/adzan service worker | Domain sama, mechanics beda. Perlu device/browser smoke, bukan sekadar parity checker. |
| Haptics/device UX | Ada di mobile interactions tertentu | Tidak relevan di web | Platform-specific, bukan gap fitur. |

## Stub Or Partial Surface

Stub/coming-soon eksplisit yang ditemukan:

| Platform | File | Surface | Catatan |
|---|---|---|---|
| Mobile | `apps/mobile/src/screens/ProfileScreen.js` | Profile > Tampilan | Follow-up implemented: pilihan tema lokal, bahasa konten, dan mode layout. App-wide dark theme penuh masih tracked karena butuh theme provider. |
| Mobile | `apps/mobile/src/screens/ProfileScreen.js` | Profile > Keamanan | Follow-up implemented: current-device session, sign-out, dan form ganti sandi. Login history multi-device masih tracked karena butuh backend endpoint. |
| Web | `apps/web/src/app/dev/DevPageClient.js` via `apps/web/src/lib/i18n.js` | Dev docs | Copy `dev.full_docs_soon` menyatakan dokumentasi lengkap request/response belum tersedia. Ini utility docs, bukan user feature utama. |

Empty state seperti "artikel sedang disiapkan", "tidak ada hasil", atau "belum ada data" muncul di banyak route. Itu bukan otomatis stub; sebagian besar adalah state data kosong dari API/koleksi.

## Intentional Exclusions

Surface berikut sebaiknya tetap dianggap bukan parity miss kecuali product decision berubah:

- `/admin/*`: CRUD konten dan user management untuk operator/admin web.
- `/dev`: API key manager dan developer documentation utility.
- `/auth/*`: flow autentikasi platform web berbeda dari mobile `SessionCard`.
- `/api/v1/[...path]`: Next same-origin API proxy untuk web runtime, bukan user-facing feature.
- `/og`, metadata, sitemap, robots, icon route: system/SEO utility.

## Recommended Follow-Up

1. Putuskan mobile Profile settings: implement theme/language/security/password/session management atau sembunyikan sampai siap. Ini stub paling nyata.
2. Tambahkan `platformNotes` atau `depthNotes` ke manifest untuk kasus yang checker tidak bisa tangkap: achievements/stats, offline packs, native reminders, admin/dev exclusion, dan jarh ta'dil taxonomy.
3. Jalankan smoke real device untuk notifications, adzan, offline pack, forum submit/vote, zakat/faraidh save history, dan profile auth flows. Checker saat ini hanya menjamin route/key tidak drift.
4. Kalau product ingin parity penuh Achievements/Stats, buat mobile dedicated detail screen atau nyatakan resmi sebagai mobile-lite.
5. Kalau web perlu offline capability, buat decision doc PWA offline pack; kalau tidak, dokumentasikan sebagai mobile-only platform capability di `docs/WEB_MOBILE_SYNC.md`.

## Conclusion

Feature parity dasar sudah baik: tidak ada feature besar di web yang hilang dari mobile, dan tidak ada feature besar di mobile yang hilang dari web. Risiko terbesar sekarang ada di "parity terasa sama" bukan "route hilang": profile settings mobile masih stub, beberapa platform capabilities beda, dan visual/data depth untuk achievements/stats belum sama.
