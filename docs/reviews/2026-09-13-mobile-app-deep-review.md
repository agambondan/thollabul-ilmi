# Deep Review Mobile App (`apps/mobile`) — Pertama Kali Diaudit

Tanggal: `2026-09-13`
Scope: `apps/mobile` saja (web dan API tidak disentuh; semua audit hari ini
sebelumnya secara eksplisit skip mobile).
Status: `SEBAGIAN SELESAI` — 3 bug nyata diperbaiki (mobile-only, contained),
beberapa temuan dilaporkan sebagai gap/butuh keputusan produk/butuh perubahan
backend (di luar scope task ini).

**Batasan penting**: task ini murni code-reading. Tidak ada Expo
app/emulator/device yang bisa dijalankan di environment ini, jadi semua
"PASS"/"BUG" di bawah adalah hasil pembacaan kode statis (cross-check field
name, trace parameter, baca logic) — bukan hasil smoke test di device nyata.
Beberapa temuan ditandai eksplisit "butuh device nyata untuk verifikasi penuh".

Selama task berjalan, sesi lain yang berjalan paralel mengubah beberapa file
mobile (`ExploreScreen.helpers.js`, `explore/WebAppQuizRoute.js`,
`explore/WebAppTasbihRoute.js`, `explore/WebAppUserWirdRoute.js`,
`quran/QuranScreenRenderers.js`) serta beberapa file web/API — sesuai aturan
"skip file yang sudah dirty", file-file itu **dibaca untuk analisis tapi tidak
diedit** oleh task ini.

---

## 1. API Contract Drift (mobile screens vs Go controllers)

Dicek: `PrayerScreen.js`, `HomeScreen.js`, `IbadahScreen.js`, `QiblaScreen.js`,
`GlobalSearchScreen.js`, seluruh endpoint auth (`api/auth.js` — fitur
register/verify email+WhatsApp yang baru di-port dari web, commit `8d650a06`).

### Bug ditemukan (butuh fix backend — TIDAK diperbaiki, di luar scope mobile-only)

**`normalizeDoa()` di `apps/mobile/src/api/client.js` (~baris 768-788) selalu
menampilkan judul "Doa" generik, tidak pernah judul asli.**

```js
title: pickText(item.title, item.nama, item.label, "Doa");
```

`services/api/app/model/doa.go:24` menandai field `Title` dengan
`json:"-"` — field itu **tidak pernah dikirim** ke client sama sekali (begitu
juga `Arabic`, `Transliteration`, `TranslationText`, semuanya `json:"-"` di
baris 24-27). Struct `Translation` yang memang diserialize
(`app/model/translation.go:5-18`) juga tidak punya field setara judul. Jadi
`item.title`/`item.nama`/`item.label` selalu `undefined`, fallback chain
selalu jatuh ke string literal `"Doa"`.

- Dampak: setiap hasil doa di `GlobalSearchScreen.js:912` (filter Doa di
  Global Search) tampil dengan judul generik "Doa" untuk semua entri —
  tidak bisa dibedakan satu sama lain dari judulnya (isi/terjemahan tetap
  benar).
- Test `apps/mobile/src/__tests__/client.test.js:236-271` menguji
  `normalizeDoa` dengan fixture `{ title: "Doa Tidur", ... }` — bentuk yang
  TIDAK PERNAH bisa diproduksi backend asli, sehingga bug ini lolos dari test
  suite.
- **Rating: CONFIRMED** (bukan tebakan runtime — field tag `json:"-"` di Go
  eksplisit mengecualikan field itu, statis dan pasti).
- **Kenapa tidak diperbaiki di sini**: perbaikan yang benar (hapus
  `json:"-"` dari `Title` di `services/api/app/model/doa.go`, atau tambahkan
  field judul ke response) adalah perubahan **backend**, di luar scope
  audit mobile-only ini. Dilaporkan untuk task terpisah.

### Verified clean (tidak ada mismatch)

- **PrayerScreen.js** (`getPrayerTimes`) ↔ `prayer_times_controller.go` →
  `model.PrayerTimesResponse` (`app/model/prayer_times.go:3-20`) — key
  `prayers.{imsak,fajr,sunrise,dhuhr,asr,maghrib,isha}` persis sama dengan
  `PRAYER_ORDER` di mobile.
- **HomeScreen.js** (daily ayah/hadith/hijri/reminders) — `Promise.allSettled`
    - optional chaining dipakai konsisten, dicocokkan ke `ayah_controller.go:121`
      dan `hadith_controller.go:83` (`FindDaily`, bare object response).
- **IbadahScreen.js**, **QiblaScreen.js** — tidak ada panggilan API langsung
  (hub/router murni & kalkulasi lokal), tidak ada yang perlu dicocokkan.
- **GlobalSearchScreen.js** — keyword search sudah pakai key **plural**
  (`ayahs`/`hadiths`/`dictionaries`/`doas`/`kajians`/`perawis` +
  `*_total`), match persis `search_service.go:12-26`. Mobile **tidak** kena
  bug singular/plural yang ditemukan & diperbaiki di web hari ini (commit
  `8fb4541d`) — `mergeResultsByFilter` (`GlobalSearchScreen.js:223-240`) sudah
  benar dari awal. Semantic/`ask` search juga match persis
  `content_embedding_service.go:21-33`.
- **Auth flow baru** (register + verifikasi email/WhatsApp + resend, commit
  `8d650a06`) — kelima endpoint (`/auth/register`, `/auth/verify-email`,
  `/auth/verify-whatsapp`, `/auth/resend-verification`,
  `/whatsapp/availability`) dicek satu-satu terhadap
  `app/http/routes.go` + `app/model/user.go`: nama field, `json:` tag, dan
  path route semua PASS. Kombinasi `verification_channel="whatsapp"` +
  `phone` kosong divalidasi di service layer (`user_service.go:102-124`,
  gagal eksplisit dengan pesan jelas, bukan gagal diam-diam).
- **`pickItems()` (client.js:110-116)** — helper generik yang dipakai hampir
  semua fungsi Quran/Hadith untuk ekstrak array dari response
  (`items`/`data.items`/`data`/array langsung) membuat kelas bug
  singular/plural yang ditemukan di web (`SearchClient.js`) kecil
  kemungkinannya terjadi di sisi Quran/Hadith mobile, karena tidak
  hardcode satu nama key spesifik.

### Belum tuntas diverifikasi

`QuranScreen.js`, `HadithScreen.js`, `ExploreScreen.js`, `ProfileScreen.js`,
`KhatamScreen.js` — layar dengan traffic tertinggi — sempat didelegasikan ke
sub-agent terpisah yang mengalami timeout API pertama kali dan harus
di-resume; hasil akhirnya membahas sebagian besar layar di atas tapi kelima
layar ini belum sempat diverifikasi field-by-field secara mendalam sebelum
waktu habis. **Tidak ada bug ditemukan di kelimanya sejauh yang sempat
dibaca**, tapi ini bukan verifikasi lengkap — flag untuk audit lanjutan.

---

## 2. Offline/SQLite Pack Correctness

Dicek: `apps/mobile/src/storage/offlineContent.native.js` (880 baris),
`offlineContent.js` (shim non-native), `apps/mobile/src/components/OfflinePackCard.js`,
serta konsumen di `HadithScreen.js`/`PrayerScreen.js`/`QuranScreen.js`.

**Koreksi cakupan**: pack offline **tidak** mencakup Doa/Dzikir/Wirid sama
sekali — `MAIN_PACK_TYPES` (`offlineContent.native.js:12`) cuma
`["quran_surah", "quran_ayah", "hadith"]` + pack jadwal sholat terpisah. Tidak
ada referensi "doa"/"dzikir"/"wirid" di storage/UI offline manapun.

### Bug/gap ditemukan (dilaporkan, TIDAK diperbaiki — bukan "small contained bug")

1. **Quran offline pack tidak pernah dipakai `QuranScreen.js`** —
   `QuranScreen.js` tidak import apapun dari `offlineContent` (hanya
   `../api/client`, live network). User yang download paket Quran offline
   "untuk penerbangan" akan tetap gagal baca Quran saat benar-benar offline,
   padahal `OfflinePackCard.js` melaporkan "Paket offline siap". Ini gap
   integrasi fitur yang cukup besar (mewajibkan menambahkan jalur baca
   offline penuh ke `QuranScreen.js`), bukan bug satu baris — dilaporkan
   untuk task implementasi terpisah, bukan fix di sini.
2. **Paket Quran tidak pernah bisa di-refresh via UI** — `buildOfflinePack`
   (`offlineContent.native.js:567`) hanya menyimpan ulang Quran kalau
   `force=true`, tapi tidak ada satupun caller yang pernah mengirim
   `force: true` (`grep` konfirmasi). Tombol "Cek Update" cuma memengaruhi
   hadith (`lastSyncAt`/`updated_after`, sudah didukung backend
   `hadith_repository.go:13-22`), bukan Quran. Satu-satunya cara refresh teks
   Quran offline adalah hapus total paket (ikut menghapus hadith juga).
   Risiko rendah karena teks Quran nyaris tidak pernah berubah, tapi tetap
   gap desain — dilaporkan saja.
3. **`HadithScreen.js` selalu prioritaskan cache offline** (`preferOffline: true`
   di setiap `refreshAll()`, termasuk pull-to-refresh) **tanpa indikator ke
   user** bahwa yang ditampilkan adalah snapshot offline, bukan data live.
   `hadithSource` di-set tapi tidak pernah dirender ke UI.
4. **Tidak ada mekanisme migrasi skema SQLite** — semua statement
   `CREATE TABLE IF NOT EXISTS`/`CREATE INDEX IF NOT EXISTS`, tidak ada
   `PRAGMA user_version`/`ALTER TABLE`. Aman untuk penambahan tabel baru
   (sudah terbukti 2x di git history), tapi **akan pecah senyap** kalau
   suatu saat ada penambahan **kolom** ke tabel yang sudah ada — instalasi
   lama tidak akan pernah dapat kolom baru itu. Latent risk, belum pernah
   ke-trigger.

### Fix diterapkan — PrayerScreen.js: fallback otomatis ke cache offline saat live fetch gagal

**File**: `apps/mobile/src/screens/PrayerScreen.js`, fungsi `load()`.

Sebelumnya: kalau `getPrayerTimes()` gagal (mis. tidak ada sinyal),
`PrayerScreen` cuma menampilkan pesan error (`setPrayers(null)`) — padahal
paket offline 30 hari yang sudah didownload user (justru untuk skenario ini)
tidak pernah dicek otomatis. Satu-satunya cara memakainya adalah tombol
manual "Gunakan Jadwal Offline Hari Ini" (`useOfflineToday()`,
baris 703-722) yang harus diketahui & ditekan user sendiri — user yang
kehilangan sinyal cuma melihat pesan error, bukan fallback otomatis ke data
yang sudah dia punya.

Fix: pada `catch` di `load()`, sebelum menampilkan error, coba
`getOfflinePrayerForDate({...currentCoords, method, madhab, date: today()})`
(fungsi yang sudah ada, dipakai `useOfflineToday`). Kalau ketemu, langsung
`setPrayers(offlinePrayers)` + pesan `prayer.offline.todayLoaded`, tanpa perlu
aksi manual user. Kalau tidak ketemu (atau pack tidak ada), perilaku lama
tetap berlaku (`setPrayers(null)` + pesan error asli).

```js
} catch (error) {
    try {
        const offlinePrayers = await getOfflinePrayerForDate({
            ...currentCoords,
            method,
            madhab,
            date: today(),
        });
        if (offlinePrayers) {
            setPrayers(offlinePrayers);
            setMessage(t("prayer.offline.todayLoaded"));
            return;
        }
    } catch {
        // fall through to the live-fetch error below
    }
    setPrayers(null);
    setMessage(error?.message ?? t("prayer.scheduleUnavailable"));
} finally {
    setLoading(false);
}
```

Cache key prayer (`prayerLocationKey`, `offlineContent.native.js:262-267`)
sudah spesifik per-lokasi (`method:madhab:lat(3 desimal):lng(3 desimal)`),
jadi fallback ini tidak berisiko menyajikan jadwal kota lain.

### Verified clean

- Cache key jadwal sholat sudah spesifik lokasi (lihat di atas) — hipotesis
  "cache serve kota salah" di brief tidak terbukti.
- Tidak ada swallowed-error di jalur download utama — kegagalan
  network/tulis di `buildOfflinePack`/`saveQuranPack`/`saveHadithPack`
  menjalar ke `OfflinePackCard.download()`'s catch, yang memang menampilkan
  error ke user (bukan silent "sukses" palsu).
- Tidak ditemukan race condition nyata pada double-tap download/clear
  (tombol di-disable via `busy` state, `INSERT OR REPLACE` idempotent).

---

## 3. Navigation/Deep-Link Correctness

Ditelusuri **setiap** pola URL yang dihasilkan `parseDeepLink`
(`apps/mobile/src/utils/deepLinks.js`) ke layar target yang membaca
`navigation.current`/`deepLinkTarget` — termasuk semua yang didokumentasikan
di `docs/api/roadmap-status.md`, `docs/MOBILE_IA_REVAMP_TASKLIST.md`, dan URL
yang di-generate server (`services/api/app/services/notification_push.go`).

**Hasil: semua PASS, tidak ada MISMATCH.** Setiap `tab` yang bisa dihasilkan
`parseDeepLink` terdaftar persis di `knownTabs` dan render list `App.js`
(baris 342-349); setiap `view`+`params` yang di-set cocok persis dengan nama
key yang dibaca layar target (contoh: `surahSlug`/`surahNumber`/`ayahNumber`
di `QuranScreen.js:1594-1625`, `hadithId` di `HadithScreen.js:1080`,
`featureKey` di `ExploreScreen.js:1234` dicek ke `mobileFeatures.js`, dll).
Tidak ada link yang didokumentasikan tapi mati (semua resolve ke tab+view
yang valid).

Catatan minor (bukan bug): `normalizeTabRequest`
(`apps/mobile/src/navigation/appNavigation.js:1-10`) yang menangani alias
`qibla` → tab `ibadah` ternyata tidak pernah benar-benar terpanggil untuk
jalur deep link (karena `parseDeepLink` sudah resolve alias itu sendiri
sebelum `normalizeTabRequest` dipanggil) — pure pass-through untuk semua link
yang ditelusuri, cuma relevan untuk pemanggilan internal non-deep-link
(`onOpenTab("qibla")`).

Server-generated push URL (`notification_push.go:138-149`) cuma emit
tab-root (`thullaabulilmi://prayer`, dst, tanpa id spesifik) — bukan bug,
tapi berarti klaim di
`docs/features/progress/2026-09-08-server-push-notifications.md:58-62`
("klik notifikasi → route persis") baru sampai level tab, belum sampai item
spesifik untuk notifikasi server-side.

---

## 4. `setBack`/`clearBack` Back-Navigation Contract

Semua file di `apps/mobile/src/screens/` (termasuk subfolder `explore/`,
`home/`, `quran/`) diperiksa: state lokal yang berpotensi jadi
sub-navigation (selected/detail/active view), lalu dicek apakah
`setBack`/`clearBack` benar-benar dipanggil dan closure-nya benar-benar
menutup state yang tepat.

**Hasil: tidak ada BUG.** Semua layar dengan sub-navigasi berbasis state
lokal (`HadithScreen.js`, `ExploreScreen.js`, `ProfileScreen.js`,
`KhatamScreen.js`, `HomeScreen.js`, `QuranScreen.js`, `PrayerScreen.js`)
sudah benar memanggil `setBack`/`clearBack` dengan closure yang menutup state
yang tepat (cascade multi-level pada beberapa layar, misalnya
`HadithScreen.js:1091-1105` — `selectedPerawi` → `selectedHadith` →
`clearBack`). Layar tanpa `navigation.setBack`/`clearBack`
(`IbadahScreen.js`, `QiblaScreen.js`, `HistoricalMapScreen.js`,
`GlobalSearchScreen.js`, `MasjidDirectoryContent.js`,
`RadioIslamicContent.js`, `TokohTarikhContent.js`) semuanya memang tidak
butuh — baik karena tidak ada state detail lokal, sub-view-nya native
`<Modal onRequestClose=...>` (Android sudah handle back bawaan), atau
delegasi ke layar induk yang sudah punya `setBack` sendiri.

**Catatan (bukan pelanggaran aturan literal, tapi worth flagging)**:
`WebAppLessonsRoute.js` (modul → step) dan `WebAppQuizRoute.js` (soal →
hasil) — dua sub-komponen di dalam `ExploreScreen`'s `activeFeature` view —
punya drill-down internal sendiri (`activeModuleId`/`activeStepIdx`,
`currentIndex`) tapi tidak menerima prop `navigation`, jadi tidak bisa ikut
kontrak `setBack`/`clearBack` sama sekali. Hardware-back saat di tengah
lesson step atau quiz akan langsung keluar ke hub Belajar (lewat
`ExploreScreen`'s `clearFeature()`), bukan mundur satu level (step → daftar
modul). Ini gap granularitas UX, bukan pelanggaran aturan (`WebAppQuizRoute.js`
adalah salah satu file yang sedang diedit sesi lain saat audit ini
berjalan — tidak disentuh, sesuai aturan skip-dirty-file).

---

## 5. Notification/Push Registration Correctness

### Bug ditemukan & diperbaiki — local reminder tidak bisa deep-link

**File**: `apps/mobile/src/utils/prayerNotifications.js`,
`apps/mobile/src/utils/smartNotifications.js`.

`App.js`'s `dataToUrl()` (baris 242-251) cuma mengenali `data.url` atau
`data.deep_link` sebagai key untuk auto-navigate saat notifikasi di-tap
(cold start via `getLastNotificationResponse`, maupun
`addNotificationResponseReceivedListener`). Payload `data` yang dikirim
untuk **local scheduled notification** (adzan/waktu sholat reminder,
smart reminder) sebelumnya cuma berisi `{ prayer, type: "prayer_reminder" }`
/ `{ reminder_type, type: "smart_reminder" }` — **tidak pernah** ada key
`url`/`deep_link`. Jadi tap pada reminder lokal ini tidak pernah membuka
layar yang relevan (server-sent push tetap bekerja karena
`notification_push.go` memang set `url`).

**Rating: CONFIRMED** — ini murni pembacaan key yang tidak cocok, bukan
tebakan runtime.

Fix: tambahkan key `url` ke tiap payload `data`, mengarah ke deep link yang
sudah dikenal `parseDeepLink`:

- `prayerNotifications.js` — `schedulePrayerReminders` dan
  `showPrayerTimeNotification` → `url: "thullaabulilmi://prayer"` (resolve
  ke tab `ibadah`, view `prayer`).
- `smartNotifications.js` — ditambah mapping `SMART_REMINDER_DEEP_LINKS`
  per `reminders[].type` (nilai valid dari `notification.go`'s
  `NotificationType` + tipe lokal-only `kajian`/`murojaah`):
  `daily_quran→quran`, `daily_hadith→hadith`, `doa→explore/doa`,
  `kajian→explore/kajian`, `murojaah→explore/murojaah`,
  `adzan→ibadah/prayer`, `streak_risk→belajar` (root tab, tidak ada
  featureKey khusus untuk streak).

Kalau `item.type` di luar daftar (mis. `report`, yang memang bukan bagian
`oneof` reminder yang bisa di-set user), `url` jadi `undefined` — `dataToUrl`
di `App.js` sudah menangani ini dengan aman (return `null`, tidak crash).

### Bug/gap ditemukan (dilaporkan, TIDAK diperbaiki — butuh aksi di luar kode)

**Tidak ada `expo.extra.eas.projectId` di `apps/mobile/app.json`, dan tidak
ada `eas.json` sama sekali.** Kode `resolveExpoProjectId()`
(`pushNotifications.js:98-110`) sudah benar membaca
`Constants.expoConfig.extra.eas.projectId` (dengan fallback), tapi karena
config-nya memang tidak ada, hasilnya selalu string kosong, dan
`getExpoPushTokenAsync()` dipanggil tanpa `projectId`
(`pushNotifications.js:174-175`). Ini pola klasik "jalan di Expo Go, gagal
di build standalone/EAS" untuk Expo SDK modern. **Tidak diperbaiki** karena
mengisi `projectId` yang benar butuh akun/project EAS asli (`eas init` atau
console Expo) — bukan sesuatu yang bisa ditebak dari kode, dan berisiko
salah kalau diisi asal. Perlu tindakan pemilik akun Expo/EAS, bukan fix
kode. (`app.json` juga masih pakai `android.package` default
`com.anonymous.thullaabulilmimobile` — indikasi tambahan project ini belum
pernah benar-benar melalui setup EAS.)

### Verified clean

- `getExpoPushTokenAsync` (bukan bare device token) dipakai dengan benar,
  cuma projectId-nya yang kosong (lihat di atas).
- Field yang dikirim mobile → backend (`{device_id, platform, provider,
token}`, `personal.js:147-162`) match persis
  `PushTokenRegisterRequest` (`notification.go:59-70`); nilai `"expo"`
  dicocokkan case-insensitive di backend (`notification_push.go:88-89,155-156`).
- Alur permission (`getPermissionsAsync` → `requestPermissionsAsync` kalau
  perlu → return `{granted:false}` bersih kalau ditolak, tanpa retry loop)
  benar, dan registrasi benar-benar terpanggil (bukan dead code) — otomatis
  saat login (`SessionContext.js:219-231`) dan manual dari tombol di
  `NotificationCenter.js:498-509`.

---

## 6. Temuan Lain

- Grep `<Modal` di seluruh `apps/mobile/src` — semua pemakaian sudah punya
  `onRequestClose`, tidak ditemukan modal yang bisa macet terbuka karena
  hardware-back diabaikan.
- Auth flow baru (register/verify email+WhatsApp/resend, commit `8d650a06`)
  dicek field-by-field ke backend — semua PASS (lihat bagian 1). Fungsi
  `verifyEmail()` (`api/auth.js:29-30`) diexport tapi tidak pernah dipanggil
  dari UI manapun (`SessionCard.js` tidak meng-import-nya) — bukan bug:
  link verifikasi email memang mengarah ke halaman **web**
  (`app/lib/mail.go:140`, `${appURL}/auth/verify-email?token=...`), bukan
  deep link mobile, jadi mobile memang tidak perlu memanggilnya sendiri.
  Hanya dead export, tidak difix (bukan bug, di luar kriteria "real defect").
- `pickItems()` (client.js) sebagai pola ekstraksi array generik dipakai
  luas di jalur Quran/Hadith — mengurangi kemungkinan kelas bug
  singular/plural yang ditemukan di web hari ini.

---

## Ringkasan Fix

| #   | File                                           | Perubahan                                                                                                                 | Verifikasi                                                                                                                   |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | `apps/mobile/src/utils/prayerNotifications.js` | Tambah `url: "thullaabulilmi://prayer"` ke data payload `schedulePrayerReminders` & `showPrayerTimeNotification`          | `node --check`, `npx jest src/__tests__/prayerNotifications.test.js` (23 test, PASS)                                         |
| 2   | `apps/mobile/src/utils/smartNotifications.js`  | Tambah `SMART_REMINDER_DEEP_LINKS` map + key `url` di data payload `scheduleSmartReminders`                               | `node --check`, `npx jest src/__tests__/smartNotifications.test.js` (termasuk dalam 23 test di atas, PASS)                   |
| 3   | `apps/mobile/src/screens/PrayerScreen.js`      | `load()`: fallback otomatis ke `getOfflinePrayerForDate()` saat `getPrayerTimes()` gagal, sebelum menampilkan pesan error | `node --check`, `npx jest src/__tests__/PrayerScreen.test.js` (15 test, PASS, termasuk "shows error message when API fails") |

**Catatan verifikasi**: `apps/mobile` **tidak punya `eslint.config.*`/`.eslintrc.*`
maupun script `lint` di `package.json`** — `npx eslint <file>` gagal dengan
"couldn't find eslint.config" untuk seluruh folder ini (dicoba, error
dikonfirmasi), jadi verifikasi dilakukan dengan `node --check` (syntax) +
`npx jest` pada file test yang relevan, bukan eslint. Ini bukan sesuatu yang
diperbaiki task ini (di luar scope "small contained bug", ini keputusan
tooling project) — dilaporkan sebagai gap tooling.

## Follow-up yang Direkomendasikan (tidak dikerjakan di sini)

1. **P0 — Backend**: `services/api/app/model/doa.go` — `Title` (dan
   `Arabic`/`Transliteration`/`TranslationText`) bertag `json:"-"`, membuat
   semua hasil pencarian Doa di mobile bertitle generik "Doa". Perlu
   perubahan backend (di luar scope task mobile-only ini).
2. **P0 — Akun EAS**: `apps/mobile/app.json` tidak punya
   `extra.eas.projectId`/`eas.json`. Push token kemungkinan gagal di build
   standalone. Perlu setup `eas init`/`eas build:configure` oleh pemilik
   akun Expo.
3. **P1 — Feature gap**: Quran offline pack didownload tapi tidak pernah
   dipakai `QuranScreen.js` saat offline — perlu kerja integrasi, bukan fix
   kecil.
4. **P2**: `HadithScreen.js` tidak memberi indikator visual saat menampilkan
   data dari cache offline (bisa basi tanpa disadari user).
5. **P2**: `WebAppLessonsRoute.js`/`WebAppQuizRoute.js` (drill-down lesson &
   quiz) tidak ikut kontrak `setBack`/`clearBack` karena tidak menerima
   prop `navigation` — hardware-back keluar penuh dari fitur, bukan mundur
   satu level. Gap granularitas UX, bukan pelanggaran aturan literal.
6. **P2**: `QuranScreen.js`/`HadithScreen.js`/`ExploreScreen.js`/
   `ProfileScreen.js`/`KhatamScreen.js` belum sempat diverifikasi
   field-by-field terhadap backend secara mendalam (lihat bagian 1) — audit
   lanjutan disarankan sebelum menganggap kontrak API mobile 100% aman.
7. Verifikasi live-device untuk semua temuan di atas tetap wajib sebelum
   rilis — task ini murni code-reading, tidak ada smoke test di emulator
   atau device fisik.
