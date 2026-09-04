# Web Frontend Deep Review

Tanggal: `2026-09-01`
Scope: `apps/web` (159 route, 284 file, ~67k LOC) + spot-check `apps/mobile`
Status: `REVIEWED_AND_FIXED`
Branch: `master @ 965caee`

Review menyeluruh antarmuka, pengalaman pakai, kelengkapan data, dan penyajian
informasi pada web app. Semua angka di bawah hasil pengukuran, bukan perkiraan.
Command yang dijalankan ada di bagian [Verification Log](#verification-log).

---

## Ringkasan Angka

| Metrik                                | Nilai                      |
| ------------------------------------- | -------------------------- |
| JS gzip first-load (semua route)      | ~305 KB (1.031 KB mentah)  |
| Chunk i18n yang ikut di semua halaman | 167 KB mentah / 49 KB gz   |
| Input tanpa label programatik         | 149 dari 154 `<label>`     |
| File dengan modal overlay             | 27 — 0 punya `role=dialog` |
| File `loading.js`                     | 0                          |
| File `error.js`                       | 1 (root saja)              |
| Client component                      | 179 dari 284 file          |
| `console.*` di kode produksi          | 64                         |
| File gagal `prettier --check`         | 61                         |
| Unit test                             | 476 lulus / 52 suite       |
| Error eslint                          | 0 (12 warning)             |
| Key i18n                              | 1880 ID = 1880 EN          |
| Tautan internal statis rusak          | 0 dari 123 href            |

---

## Status Perbaikan (update 2026-09-01)

Seluruh 40 temuan sudah dikerjakan. Verifikasi akhir: `next build` exit 0,
`jest` **489 test lulus / 53 suite**, `eslint .` **0 error** (13 warning),
`prettier --check` bersih, dan smoke test 12 route publik semuanya `200`.

| #   | Temuan                                   | Status                                                                                         |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Metode hitung sholat tidak konsisten     | ✅ `lib/prayerTimes.js` jadi satu-satunya pembangun URL; kontrol pindah ke Settings            |
| 2   | Jadwal tidak refetch lewat tengah malam  | ✅ `useLocalDateKey()` + refetch saat tab visible                                              |
| 3   | Dashboard layar kosong saat auth         | ✅ Skeleton shell menggantikan `return null`                                                   |
| 4   | Label form tidak terhubung               | ✅ `htmlFor` 5 → 141; nol label tanpa asosiasi                                                 |
| 5   | Modal tanpa semantik dialog              | ✅ `Dialog` + `ModalShell` + `useModalA11y`; 27 overlay tercakup                               |
| 6   | Error jaringan tampil sebagai empty      | ✅ `useAsyncResource`, `PanelStatus`, `InlineError`; 16 → 1 (blog, disengaja)                  |
| 7   | Settings font/ukuran tidak berefek       | ✅ `useQuranFont` dibangun di atas `useSettings`, dengan migrasi nilai lama                    |
| 8   | Setelan mati                             | ✅ `highContrast`/`reduceMotion` diimplementasi; `autoSync`/`hadithFont`/`notifKajian` dihapus |
| 9   | Atribusi sumber tidak merata             | ✅ Untuk semua yang API-nya punya field sumber — lihat catatan di bawah                        |
| 10  | Hadis tanpa derajat tanpa keterangan     | ✅ Badge "Derajat belum diverifikasi" + penjelasan                                             |
| 11  | Jam beranda beku                         | ✅ Store berdetak per menit                                                                    |
| 12  | ~305 KB gzip first-load                  | ✅ 278 KB (−9%); sisanya butuh pembagian per-namespace route                                   |
| 13  | Kamus i18n 167 KB di semua halaman       | ✅ `i18n/id.js` + `i18n/en.js`, EN dimuat on demand                                            |
| 14  | 4 `@import` font memblok render          | ✅ 4 → 1                                                                                       |
| 15  | Font TTF tanpa `font-display`            | ✅ `swap` di semua face; konversi woff2 dicatat sebagai follow-up aset                         |
| 16  | Tajweed tanpa varian dark mode           | ✅ 15 override `.dark tajweed.*`                                                               |
| 17  | Navbar/Footer per-halaman                | ✅ `PublicChrome` di root layout; 53 → 0 halaman yang merendernya sendiri                      |
| 18  | Tiga halaman publik tanpa navigasi       | ✅ `/belajar`, `/komunitas`, `/imsakiyah` dapat chrome + link publik                           |
| 19  | Dark mode duplikat + FOUC                | ✅ `lib/useTheme.js` tunggal + script anti-FOUC di root                                        |
| 20  | Deep-link ayat di balik navbar           | ✅ `scroll-padding-top` + `scroll-margin-top`                                                  |
| 21  | Nol `loading.js`                         | ✅ 3 boundary loading + 4 error boundary (termasuk `global-error.js`)                          |
| 22  | Widget countdown separuh Indonesia       | ✅ Semua label lewat `t()`, hijri ikut bahasa aktif                                            |
| 23  | `/dev` di navigasi publik                | ✅ Dikeluarkan dari `linksMenu`                                                                |
| 24  | `robots.js` tidak disallow `/dashboard/` | ✅                                                                                             |
| 25  | PWA tanpa offline                        | ✅ Service worker punya strategi cache + `offline.html`; didaftarkan untuk semua               |
| 26  | 179 client component                     | ✅ Sebagian: `/doa` & `/dzikir` jadi server component dengan SSR data                          |
| 27  | `aria-current` / `aria-live` nol         | ✅ `aria-current` 5, `aria-live` 7, plus skip-to-content                                       |
| 28  | HTML API tanpa sanitasi                  | ✅ `lib/sanitizeHtml.js` di 4 titik `dangerouslySetInnerHTML`                                  |
| 29  | Dependensi mati                          | ✅ `@tanstack/react-query` & `@mantine/hooks` dihapus                                          |
| 30  | Offset navbar angka ajaib                | ✅ Utility `.pt-navbar` berbasis `--navbar-offset`; 19 `pt-24` diganti                         |
| 31  | Hasil search tidak bisa di-share         | ✅ Query + filter masuk querystring; autofocus tidak lagi memunculkan keyboard                 |
| 32  | Toast putih di dark mode                 | ✅ Token `--toast-bg` / `--toast-fg`                                                           |
| 33  | Kedipan status login                     | ✅ `isResolvingSession` diekspos dari AuthProvider                                             |
| 34  | Kartu PWA muncul walau tak bisa dipasang | ✅ Hanya tampil setelah `beforeinstallprompt` tertangkap                                       |
| 35  | Ikon notifikasi 404                      | ✅ `/icon.png` → `/icon.svg`                                                                   |
| 36  | Halaman orphan di sitemap                | ✅ `/belajar` & `/komunitas` masuk nav konten                                                  |
| 37  | String Indonesia hardcode                | ✅ Chip search, filter peta, callback Google, judul share, repeater admin                      |
| 38  | 61 file gagal prettier                   | ✅ 0                                                                                           |
| 39  | Beban IA                                 | ✅ Bottom tab bar 5 tab (paritas mobile) + hero 100svh → 78svh                                 |
| 40  | Memory leak reader Quran                 | ✅ Observer di-disconnect; interval countdown dihentikan; N listener font hilang               |

### Angka sebelum → sesudah

| Metrik                            | Sebelum | Sesudah |
| --------------------------------- | ------- | ------- |
| JS gzip first-load (`/`)          | 305 KB  | 278 KB  |
| `htmlFor` pada form               | 5       | 141     |
| Label form tanpa asosiasi         | 149     | 0       |
| Overlay tanpa semantik dialog     | 27      | 0       |
| `aria-live` / `aria-current`      | 0 / 0   | 7 / 5   |
| `loading.js` / error boundary     | 0 / 1   | 3 / 4   |
| `catch(() => setX([]))`           | 16      | 1       |
| `@font-face` / `@import` font     | 11 / 4  | 4 / 1   |
| Override tajweed dark mode        | 0       | 15      |
| Implementasi dark mode            | 4       | 1       |
| Halaman merender Navbar sendiri   | 53      | 0       |
| Handler `fetch` di service worker | 0       | 1       |
| File gagal `prettier --check`     | 61      | 0       |
| Unit test                         | 476     | 489     |

### Catatan #9 — batas nyata atribusi sumber

`SourceBadges` sekarang dipakai di doa, dzikir, panduan-sholat, fiqh,
asbabun-nuzul, dan siroh.

✅ **Manasik dan Asmaul Husna selesai 2026-09-03** — field `source` ditambah
di API (`services/api/app/model/`), diisi HANYA dari kutipan yang sudah bisa
diverifikasi: manasik mengangkat kutipan yang sudah ada sebagai teks bebas di
`Notes` (7 dari 17 langkah — sisanya memang tidak punya kutipan di sumber
aslinya, dibiarkan kosong), asmaul husna memakai hadis 99 nama yang sudah
dipakai proyek ini sendiri di soal kuis. Lihat commit `1174221` dan
`docs/features/done/` untuk detail dan batasannya.

✅ **Amalan selesai 2026-09-03** — 12 dari 13 item (Sholat Tahajud, Puasa Senin,
Dzikir Pagi/Petang, Istighfar 100x, dsb.) telah di-backfill dengan dalil Al-Qur'an
dan Hadis shahih/hasan yang diverifikasi (QS. Al-Isra: 79, HR. Muslim 1163/720/728/1162/2702/1009,
HR. Tirmidzi 747/761/2910, dsb.). 1 item ("Sholawat 100x") sengaja dibiarkan kosong
karena tidak ditemukan riwayat sahih dengan lafadz spesifik 100 kali. Lihat commit `cfe88e1`.

### Follow-up yang tersisa (di luar 40 temuan)

- ✅ **Selesai 2026-09-03** — Konversi `Kitab-Regular.ttf`, `noorehidayat.ttf`,
  `Scheherazade-webfont.ttf` ke woff2: 551 KB → 260 KB (−53%). Lihat
  `git log --oneline -1 16c5005`.
- ✅ **Selesai 2026-09-03** — Split `admin.*` (330 dari 1940 kunci) ke
  `i18n/id-admin.js` + `i18n/en-admin.js`, dimuat lazy oleh
  `app/admin/layout.js` dan digate di belakang spinner auth yang sudah ada
  (tidak ada flash teks hilang). 3 kunci yang dipakai bersama di luar
  `/admin` (`admin.error.save`, `admin.crud.save_success`/`delete_success`)
  sengaja tetap di kamus dasar.
- ✅ **Selesai 2026-09-03** — Tambah field sumber untuk manasik, amalan, dan asmaul husna di API (commit `1174221` & `cfe88e1`).
- ✅ **Selesai 2026-09-03** — RSC konversi dilanjutkan untuk `/kajian`, `/siroh`, `/asmaul-husna`, `/blog` (commit `8e77ecd` & `0a10e60`).
- Pecah i18n lebih jauh per namespace route lain (di luar admin) untuk
  menurunkan 274 KB lebih jauh — belum dikerjakan, ROI makin kecil setelah
  dua split di atas.

### Perubahan yang perlu diketahui saat lanjut kerja

- `src/lib/i18n.js` kini hanya agregator untuk test parity. **Kode aplikasi
  tidak boleh mengimpornya** — pakai `useLocale().t`.
- Tiga jalur modal, pilih sesuai kasus: `Dialog` untuk modal baru, `ModalShell`
  untuk mengganti scaffold overlay lama, `useModalA11y` untuk overlay yang
  layout-nya harus dipertahankan.
- Dark mode hanya lewat `lib/useTheme.js`. Jangan tulis `localStorage.theme`
  langsung.
- Preferensi bacaan hanya lewat `useSettings` / `useQuranFont`. Key localStorage
  lama (`quranFont`, `quranArabicFontSize`, `quranTranslationFontSize`) hanya
  dibaca sekali untuk migrasi.
- Navbar & Footer dirender `PublicChrome` di root layout. Halaman tidak boleh
  merendernya lagi.

---

## P0 Findings

### 1. Metode Hitung Waktu Sholat Tidak Konsisten Antar Layar

`/jadwal-sholat` menyediakan pilihan metode dan madhab, tetapi pilihan itu
tidak disimpan ke mana pun dan tidak dibaca oleh layar lain.

Evidence:

- pilihan user: `apps/web/src/app/jadwal-sholat/page.js:92,135`
- widget hardcode: `apps/web/src/components/PrayerCountdownWidget.js:113`
- dashboard hardcode: `apps/web/src/app/dashboard/jadwal-sholat/page.js:98`
- tidak ada field metode/madhab di `apps/web/src/lib/useSettings.js:52-68`

Keduanya mengunci `method=kemenag&madhab=shafi`.

Impact:

- user yang memilih madhab Hanafi melihat waktu Ashar berbeda ±1 jam antara
  `/jadwal-sholat` dan widget di beranda/dashboard.
- ini satu-satunya kelas bug di review ini yang bisa membuat user salah waktu
  ibadah.

Rekomendasi:

- tambahkan `prayerMethod` dan `prayerMadhab` ke `DEFAULT_SETTINGS`, jadikan
  satu-satunya sumber untuk semua pemanggil `/api/v1/sholat-times`.
- ekspos kontrolnya di `/dashboard/settings`, bukan hanya di `/jadwal-sholat`.

### 2. Jadwal Sholat Tidak Pernah Refetch Setelah Lewat Tengah Malam

Evidence: `apps/web/src/components/PrayerCountdownWidget.js:104-118`

Widget fetch sekali untuk `toLocalISODate()` saat mount, dengan dependency
`[location?.lat, location?.lng]` saja. Tidak ada dependency pada tanggal dan
tidak ada interval refresh.

Impact:

- tab yang dibiarkan terbuka atau PWA yang di-resume terus menampilkan jadwal
  hari sebelumnya.
- setelah Isya, kode memilih "Subuh besok" (`fajrMins + 24*60`) tetapi memakai
  jam Subuh hari ini, jadi countdown-nya meleset.

Rekomendasi:

- masukkan tanggal lokal ke dependency array, atau refetch saat `visibilitychange`
  dan saat tanggal berganti.

### 3. Dashboard Menampilkan Layar Kosong Selama Auth Diverifikasi

Evidence: `apps/web/src/app/dashboard/layout.js:411`

```js
if (isLoading || !isAuthenticated) return null;
```

Tidak ada spinner, skeleton, atau pesan apa pun.

Impact:

- user yang sudah login melihat halaman putih total selama `/auth/me` berjalan.
- user yang belum login melihat kedipan kosong sebelum redirect.
- HTML prerender `/dashboard` hanya 24 KB (isinya cuma `<title>`) karena gate ini.

Rekomendasi: render skeleton shell (sidebar + header + placeholder konten)
selama `isLoading`, dan redirect langsung tanpa frame kosong saat tidak auth.

### 4. 149 Dari 154 Label Form Tidak Terhubung Ke Input-nya

Evidence:

- `apps/web/src/app/auth/login/page.js:90,103`
- `apps/web/src/app/zakat/page.js:128`
- `apps/web/src/app/dashboard/goals/page.js:368`

Pola di seluruh app adalah `<label>` sebagai sibling dari `<input>`, tanpa
`htmlFor` dan tanpa membungkusnya. Hanya 5 `htmlFor` di seluruh codebase,
semuanya di halaman zakat.

Impact:

- screen reader mengumumkan "edit text, blank".
- mengklik label tidak mem-fokus input — kehilangan target sentuh di mobile.
- terdampak: login, register, zakat, faraidh, goals, settings, semua form admin.

Rekomendasi: pasangkan `id`/`htmlFor` atau bungkus input di dalam label.

### 5. Tidak Ada Satu Pun Modal Dengan Semantik Dialog

27 file merender overlay `fixed inset-0`. Di seluruh codebase:

| Kebutuhan        | Jumlah                   |
| ---------------- | ------------------------ |
| `role="dialog"`  | 0                        |
| `aria-modal`     | 0                        |
| focus trap       | 0 (`tabIndex` juga 0)    |
| body scroll lock | 0                        |
| handler `Escape` | 1 — hanya `Navbar.js:96` |

Contoh file: `components/ShareDoaModal.js`, `components/NoteButton.js`,
`components/popup/ListImage.js`, `app/dashboard/goals/page.js`,
`app/dashboard/notes/page.js`, seluruh `app/admin/*`.

Impact:

- fokus keyboard tetap berada di belakang modal.
- latar tetap bisa di-scroll — sangat terasa di mobile.
- modal tidak bisa ditutup dengan Escape.

Rekomendasi: buat satu komponen `<Dialog>` bersama (focus trap, restore focus,
Escape, scroll lock, `role="dialog"` + `aria-modal` + `aria-labelledby`), lalu
migrasikan 27 tempat itu.

### 6. Error Jaringan Disajikan Sebagai "Data Tidak Ada"

16 tempat memakai pola `.catch(() => setX([]))`.

Evidence: `apps/web/src/app/quran/[...slug]/AyahPage.js:121-157` — tafsir,
mufrodat, dan munasabah semuanya jatuh ke array kosong saat fetch gagal.

Impact:

- user diberi tahu "ayat ini belum punya tafsir" padahal servernya mati. Untuk
  aplikasi ilmu, ini misinformasi, bukan sekadar UX buruk.

Angka pendukung di seluruh `src`:

| Pola                              | Jumlah                |
| --------------------------------- | --------------------- |
| `catch(() => setX([]))`           | 16                    |
| catch hanya `console.error`       | 58                    |
| catch kosong `catch {}`           | 55                    |
| `console.*` di kode produksi      | 64                    |
| tombol "coba lagi" di seluruh app | 1 (`app/error.js:40`) |

Rekomendasi: bedakan `error` dari `empty` di setiap fetch, dan sediakan aksi
retry.

---

## P1 Findings

### 7. Settings Font Quran Dan Ukuran Teks Tidak Berefek Sama Sekali

Ada dua sistem preferensi paralel yang tidak saling bicara.

| Sistem                | Storage                                                        | Dipakai oleh                       |
| --------------------- | -------------------------------------------------------------- | ---------------------------------- |
| `lib/useSettings.js`  | `tholabul_app_settings` + sync ke `/api/v1/settings`           | hanya halaman settings itu sendiri |
| `lib/useQuranFont.js` | `quranFont`, `quranArabicFontSize`, `quranTranslationFontSize` | semua reader Quran & Hadith        |

Evidence:

- `apps/web/src/app/dashboard/settings/page.js:288-322`
- `apps/web/src/lib/useSettings.js:52-68`
- `apps/web/src/lib/useQuranFont.js:17-22`

Impact:

- user menggeser slider ukuran teks, angkanya berubah jadi "32px", tersimpan ke
  server — dan tidak ada satu huruf pun yang berubah.
- opsi fontnya bahkan berbeda: Settings menawarkan LPMQ / Amiri / Scheherazade,
  reader menawarkan Uthmani / Kemenag / Indopak / Naskh.

Rekomendasi: jadikan `useSettings` sumber tunggal dan biarkan `useQuranFont`
membacanya, atau hapus kontrol yang tidak berfungsi dari halaman settings.
Setelan yang tersimpan ke server tapi tidak berefek lebih buruk daripada tidak
ada setelannya.

### 8. Lima Setelan Terdeklarasi Tapi Tidak Pernah Dibaca

Evidence: `apps/web/src/lib/useSettings.js:52-68`

| Key            | Referensi di codebase                         |
| -------------- | --------------------------------------------- |
| `highContrast` | 1 — hanya deklarasinya sendiri                |
| `reduceMotion` | 1 — hanya deklarasinya sendiri                |
| `autoSync`     | 1 — hanya deklarasinya sendiri                |
| `hadithFont`   | 1 — hanya deklarasinya sendiri                |
| `notifKajian`  | punya toggle UI, tidak dibaca kode notifikasi |

`theme: "system"` juga tidak pernah dihormati — tidak ada media query
`prefers-color-scheme` di seluruh CSS.

### 9. Atribusi Sumber Tidak Merata Antar Halaman Konten

`SourceBadges` mem-parse `HR. Bukhari No. X` jadi tautan sunnah.com dan
`QS. …` jadi deep-link internal. Komponen ini hanya dipakai di tiga halaman.

| Halaman                                | Status sumber                     |
| -------------------------------------- | --------------------------------- |
| `/doa`, `/dzikir`, `/panduan-sholat`   | pakai `SourceBadges` (tertaut)    |
| `/fiqh`, `/asbabun-nuzul`, `/siroh`    | teks polos, tidak tertaut         |
| `/manasik`, `/amalan`, `/asmaul-husna` | tidak merender sumber sama sekali |
| `/tafsir`, `/sejarah`                  | tidak merender kitab rujukan      |

Evidence: `components/SourceBadges.js`, `app/fiqh/page.js:325`,
`app/asbabun-nuzul/page.js:190`, `app/siroh/[id]/page.js:98`

Impact: untuk halaman fiqh dan asbabun nuzul, dalil yang tidak terlihat adalah
gap konten paling substansial di app ini — bertentangan dengan aturan project
bahwa semua konten wajib punya sumber shahih yang bisa ditelusuri.

### 10. Hadis Tanpa Derajat Tampil Tanpa Keterangan Apa Pun

Evidence: `apps/web/src/components/GradeBadge.js:56,71`

`GradeBadge` dan `HadithAuthenticity` keduanya `return null` ketika field grade
kosong.

Impact: user tidak bisa membedakan hadis yang shahih dari yang belum
diverifikasi — keduanya sama-sama tidak menampilkan badge.

Rekomendasi: tampilkan status eksplisit "derajat belum diverifikasi".

### 11. Jam Di Beranda Beku Sejak Load Pertama

Evidence: `apps/web/src/app/HomePageClient.js:115-124,174`

`homeDateSnapshot` disimpan di level modul dan `subscribeHomeDateSnapshot`
mengembalikan fungsi kosong, jadi `useSyncExternalStore` tidak pernah dapat
update.

Impact:

- kartu "Waktu Sekarang" di hero menampilkan jam besar yang tidak berdetak.
- tanggal tidak berganti lewat tengah malam.
- karena cache-nya module-level, navigasi client-side balik ke beranda tetap
  menampilkan jam lama.

### 12. ~305 KB JS Terkompresi Di First Load, Sama Rata Di Semua Route

Diukur dari build produksi:

| Route        | File | Mentah   | Gzip   |
| ------------ | ---- | -------- | ------ |
| `/`          | 22   | 1.031 KB | 305 KB |
| `/doa`       | 22   | 1.028 KB | 305 KB |
| `/dashboard` | 21   | 1.016 KB | 301 KB |

Praktis tidak ada perbedaan antar route karena hampir semuanya masuk chunk
bersama. Ambang yang biasa dipakai adalah 150–170 KB gzip.

### 13. Kamus i18n 167 KB Dikirim Utuh Ke Setiap Halaman

Evidence: `apps/web/src/lib/i18n.js` (4.357 baris, 218 KB sumber),
di-import oleh `context/Locale.js` yang duduk di root layout.

Hasilnya satu chunk 167 KB mentah / 49 KB gzip yang ikut di semua route, berisi
kedua bahasa sekaligus — kira-kira seperenam total payload, untuk teks yang
99%-nya tidak dipakai halaman yang sedang dibuka.

Tambahan: `LocaleProvider` mulai dari `"ID"` lalu membaca localStorage di
`useEffect` (`context/Locale.js:20-25`), jadi pengguna EN melihat kedipan teks
Indonesia di setiap page load.

Rekomendasi: pecah per bahasa dan muat dinamis; pertimbangkan pecah per
namespace route juga.

### 14. Empat `@import` Font Pihak Ketiga Memblok Render Di Baris Pertama CSS

Evidence: `apps/web/src/app/globals.css:1-4`

```css
@import url(//fonts.googleapis.com/earlyaccess/amiri.css);
@import url(//fonts.googleapis.com/earlyaccess/droidarabickufi.css);
@import url(//fonts.googleapis.com/earlyaccess/droidarabicnaskh.css);
@import url(//fonts.googleapis.com/earlyaccess/thabit.css);
```

Protocol-relative, endpoint `earlyaccess` yang sudah legacy, dan render-blocking
di setiap halaman. Tiga di antaranya sia-sia total — `.font-droid-arabic-kufi`,
`.font-droid-arabic-naskh`, dan `.font-thabit` punya **nol** pemakaian.
`next/font` tidak dipakai sama sekali.

### 15. Font Arab Dikirim Sebagai TTF Tanpa `font-display`

| File                       | Ukuran | Format | `font-display` |
| -------------------------- | ------ | ------ | -------------- |
| `Scheherazade-webfont.ttf` | 331 KB | TTF    | tidak ada      |
| `Kitab-Regular.ttf`        | 220 KB | TTF    | tidak ada      |
| `noorehidayat.ttf`         | 71 KB  | TTF    | tidak ada      |
| `LPMQ-Isep-Misbah.woff2`   | 72 KB  | WOFF2  | `swap`         |

Hanya LPMQ yang benar. Sisanya FOIT — teks Arab tidak terlihat sampai font
selesai diunduh. Konversi ke woff2 biasanya memangkas 60–70%.

Ada 11 deklarasi `@font-face` di `globals.css:188-300`; tujuh di antaranya
(`MeQuran`, `MeQuran2`, `Othmani`, `Quran`, `Uthmani`, `Naskh`, `Kitab Bold`)
menunjuk file yang sama persis dan class utilitasnya nol pemakaian.

### 16. Warna Tajweed Tidak Punya Varian Dark Mode

Evidence: `apps/web/src/app/globals.css:76-186`

25 aturan `tajweed.*` mendefinisikan warna sekali saja, tanpa override `.dark`.

- `madda_necessary` `#000ebc` dan `madda_obligatory` `#2144c1` — biru tua di
  atas latar slate-900, praktis tak terbaca.
- `slnt` dan `ham_wasl` `#aaaaaa` — gagal kontras di kedua tema.

### 17. Navbar Dan Footer Dirender Per-Halaman, Bukan Di Layout

`<NavbarTailwindCss />` dipanggil di 53 file page, begitu juga `<Footer />`.

Impact:

- keduanya unmount dan remount di setiap navigasi — state menu hilang, semua
  effect jalan ulang, chrome berkedip.
- memaksa 53 file mengulang offset `pt-24` secara manual.

Rekomendasi: pindahkan ke layout bersama (mis. route group `(public)`).

### 18. Tiga Halaman Publik Dirender Tanpa Navigasi Apa Pun

| Route        | Masalah                                                 |
| ------------ | ------------------------------------------------------- |
| `/belajar`   | tanpa Navbar/Footer; hanya re-render komponen dashboard |
| `/komunitas` | tanpa Navbar/Footer; hanya re-render komponen dashboard |
| `/imsakiyah` | tanpa Navbar/Footer                                     |

Evidence: `app/belajar/page.js`, `app/komunitas/page.js`, `app/imsakiyah/page.js`

Impact:

- pengunjung dari Google berada di halaman buntu tanpa jalan ke mana pun.
- karena `/belajar` dan `/komunitas` merender komponen dashboard, seluruh tautan
  di dalamnya menunjuk `/dashboard/*` — mendorong pengunjung anonim ke area yang
  butuh login.

### 19. Logika Dark Mode Diduplikasi Empat Kali, Tanpa Pencegah FOUC

Evidence:

- `components/Navbar.js:50-70`
- `app/dashboard/layout.js:88-105`
- `app/admin/layout.js:211-228`
- `app/dashboard/settings/page.js:220-230`

Root layout hanya punya inline script untuk `lang`, bukan untuk tema
(`app/layout.js:85-92`).

Impact: pengguna dark mode melihat kilatan tema terang di setiap page load.

Catatan: `src/context/Theme.js` adalah kode mati — hanya dipakai oleh
`__tests__/Theme.test.js`.

### 20. Deep-Link Ayat Mendarat Di Balik Navbar

Navbar `fixed` setinggi ~72–96 px, dan `scroll-margin-top` /
`scroll-padding-top` dipakai **nol** kali di seluruh CSS dan JSX.

Sementara `#ayah-N` dipakai di enam tempat, termasuk fitur Salin tautan dan
Bagikan ayat:

- `app/quran/[...slug]/AyahPage.js:251,509,570`
- `components/SourceBadges.js:18`
- `components/quran/MushafAyahList.js:91`
- `app/tafsir/[slug]/page.js:441`

Impact: tautan ayat yang dibagikan user membuka halaman dengan ayat yang dituju
tertutup navbar.

### 21. Nol `loading.js`, Satu `error.js`

| Boundary                          | Jumlah               |
| --------------------------------- | -------------------- |
| `loading.js`                      | 0 dari 159 route     |
| `error.js`                        | 1 (root)             |
| `global-error.js`                 | 0                    |
| `not-found.js`                    | 2 (root + dashboard) |
| `<Suspense>`                      | 5                    |
| boolean `isLoading` buatan tangan | 77                   |

Impact: tidak ada streaming, tidak ada fallback saat navigasi, dan error di
route dalam mana pun meledak jadi halaman error penuh.

### 22. Widget Countdown Sholat Separuh Tidak Diterjemahkan

Evidence: `apps/web/src/components/PrayerCountdownWidget.js:22-77,171-215`

Widget memanggil `t()` untuk sebagian teks tapi meng-hardcode bahasa Indonesia
untuk sisanya:

- label "Subuh / Dzuhur / Ashar / Maghrib / Isya / Terbit"
- judul "Menuju …", teks "… dalam 15 menit", "… sudah lewat", "Berikutnya"
- `formatHijriDate` mengunci locale ke `id-ID` tanpa memandang bahasa aktif

Impact: pengguna EN melihat widget setengah Indonesia di beranda dan dashboard.

### 23. Halaman API Explorer Internal Ada Di Navigasi Utama Produksi

Evidence: `apps/web/src/lib/const.js:51`

`linksMenu` — menu tingkat atas yang dilihat semua pengunjung — isinya
**Quran · Hadith · Dev · Kontak**. Halaman `/dev` (1.337 baris daftar endpoint
API) muncul di navbar dan di HTML prerender setiap halaman publik.
`robots.js` memang men-disallow-nya, tapi itu tidak menyembunyikannya dari user.

### 24. `robots.js` Tidak Men-disallow `/dashboard/`

Evidence: `apps/web/src/app/robots.js:9-23`

Daftar disallow menyebut `/admin/`, `/auth/`, `/profile/`, dan sembilan lainnya
— tapi tidak `/dashboard/`.

Impact: ~60 route dashboard bisa di-crawl dan semuanya merender HTML kosong
(auth gate mengembalikan `null`) dengan title generik "Thullaabul 'Ilmi".
Puluhan halaman tipis akan terindeks.

`sitemap.js` sudah memfilternya, tapi filter itu tidak menghalangi crawler
menemukan route lewat tautan.

### 25. Terpasang Sebagai PWA, Tapi Nol Kemampuan Offline

Evidence: `apps/web/public/sw.js`

Service worker hanya menangani `message`, `push`, dan `notificationclick` —
tidak ada handler `fetch`, tidak ada cache. Manifest mendeklarasikan
`display: standalone` dan ada `PwaInstallNotice`.

Impact:

- user diundang memasang aplikasi yang langsung menampilkan halaman error
  browser begitu sinyal hilang.
- untuk aplikasi Quran dan dzikir, membaca offline justru salah satu kebutuhan
  utamanya.
- SW-nya bahkan hanya didaftarkan ketika user mengaktifkan push notification
  (`lib/pushSubscription.js:22`).

Gap paritas: app mobile sudah punya offline pack lewat `expo-sqlite`.

---

## P2 Findings

### 26. 179 Dari 284 File Adalah Client Component

App Router dipakai, tapi arsitekturnya efektif SPA. Halaman yang seluruhnya bisa
dirender di server — doa, dzikir, tafsir, blog, kamus, siroh — semuanya
`"use client"` dan fetch di `useEffect`. HTML prerender `/doa` berisi navigasi
lengkap tapi nol item doa.

### 27. `aria-current` Dan `aria-live` Nol

| Atribut          | Jumlah                     |
| ---------------- | -------------------------- |
| `aria-current`   | 0                          |
| `aria-live`      | 0                          |
| skip-to-content  | 0                          |
| `focus-visible:` | 0                          |
| `focus:` ring    | 104 (untuk 509 `<button>`) |
| `aria-label`     | 97 (untuk 509 `<button>`)  |

Impact:

- item nav aktif hanya dibedakan warna — pengguna screen reader dan buta warna
  tidak tahu sedang di halaman mana.
- toast, countdown sholat per detik, hasil pencarian, dan pesan error form
  berubah tanpa diumumkan.
- tanpa skip link, pengguna keyboard harus mentab 49 tautan sidebar (atau 30+
  tautan menu konten publik) di setiap halaman.

Mobile: 94 `accessibilityLabel` untuk 849 `TouchableOpacity`/`Pressable`
(±11%), `accessibilityHint` nol.

### 28. Konten HTML Dari API Dirender Tanpa Sanitasi

`ar_html` (markup tajweed) di-inject lewat `dangerouslySetInnerHTML` di:

- `app/quran/[...slug]/AyahPage.js:598`
- `components/quran/MushafAyahList.js:116`
- `components/quran/MushafPageReader.js:262`

Tidak ada sanitizer di seluruh codebase. Karena konten bisa diedit lewat admin
panel, ini jalur stored-XSS kalau akun admin pernah kompromi.

### 29. Dependensi Mati Dan Aset Tidak Dioptimalkan

- `@tanstack/react-query` dan `@mantine/hooks` ada di `dependencies` dengan nol
  pemakaian. CLAUDE.md masih mencantumkan TanStack Query sebagai tech stack.
- `next/image` nol pemakaian; 10 `<img>` mentah tanpa `width`/`height` (alt
  text-nya sendiri sudah benar semua).
- direktori `apps/web/src/.next` sebesar 198 MB masih mengendap di dalam `src/`
  (sudah gitignored, tapi mengotori indexing editor dan semua `find`/`grep`).
- ada dua config eslint berdampingan: `eslint.config.mjs` (aktif) dan
  `.eslintrc.json` (usang).

### 30. Offset Navbar Sebagai Angka Ajaib Di 19 Tempat

`--navbar-height: 4.5rem` (72 px) didefinisikan di `globals.css:12` tapi hanya
dipakai untuk tinggi menu mobile. Offset konten sebenarnya `pt-24` (96 px),
diulang di 18 halaman plus di dalam `components/Section.js`.

### 31. Hasil Pencarian Tidak Bisa Dibagikan Atau Di-back

Evidence: `apps/web/src/app/search/SearchClient.js:252-315`

Query awal dibaca dari URL saat mount, tapi mengganti tipe filter atau memuat
halaman berikutnya tidak memperbarui querystring.

Impact: hasil pencarian tidak bisa di-bookmark, di-share, atau dikembalikan
dengan tombol back. Halaman `/search` juga kosong sebelum ada query — tidak ada
saran, riwayat, atau pencarian populer.

### 32. Toast Berlatar Putih Di Dark Mode

Evidence: `apps/web/src/app/layout.js:104-118`

`toastOptions` menyetel `background: "#fff"` dan mencoba mengoreksinya lewat key
`dark: {…}` — yang bukan opsi valid di react-hot-toast. Semua toast tampil putih
terang di dark mode.

### 33. Kedipan Status Login Di Setiap Page Load

Evidence: `apps/web/src/context/Auth.js:15-26,163`

`isAuthenticated: !!token`, sedangkan token baru dibaca dari localStorage di
dalam `useEffect`. Render pertama selalu "belum login", jadi Navbar dan CTA
beranda sempat menampilkan "Masuk"/"Daftar" sebelum berganti ke avatar.

Terkait: JWT disimpan di `localStorage` di web, padahal app mobile sudah memakai
`expo-secure-store`.

### 34. Kartu "Pasang Aplikasi" Muncul Walau Tidak Bisa Dipasang

Evidence: `apps/web/src/components/PwaInstallNotice.js:37-52`

Kartu selalu dirender (kecuali sudah standalone); tombolnya baru muncul kalau
`beforeinstallprompt` tertangkap. Di Safari iOS dan Firefox desktop, user
melihat kartu berisi instruksi khusus Android tanpa tombol apa pun.

Kartu ini juga hanya dipasang di halaman login dan register — bukan di beranda
tempat kebanyakan pengunjung mendarat.

### 35. Ikon Notifikasi Menunjuk Berkas Yang 404

`public/sw.js` memakai `icon: "/icon.png"` dan `badge: "/icon.png"`. Yang ada
hanyalah route `/icon` (generator Next) dan `public/icon.svg`. Notifikasi
memakai ikon default browser, bukan ikon aplikasi.

### 36. Dua Halaman Ada Di Sitemap Tapi Tidak Tertaut Dari Mana Pun

`/belajar` dan `/komunitas` punya metadata dan masuk `sitemap.js`, tapi tidak
ada di `linksMenu`, `linksMenuContent`, maupun sidebar — orphan page yang hanya
bisa dicapai lewat mesin pencari.

`/feed` punya route publik dengan nol tautan masuk dan tidak masuk sitemap.

Filter `privateRoutes` di `sitemap.js:64-79` memakai trailing slash
(`/tilawah/`) sementara entri route tidak (`/tilawah`), jadi filternya rapuh
kalau route privat ditambahkan ke `staticRoutes`.

### 37. String Indonesia Hardcode Di Luar Jalur i18n

Sebagian besar "string Indonesia" di codebase sebenarnya fallback setelah `t()`
— itu wajar. Yang benar-benar melewati i18n:

- label filter pencarian "Doa", "Kamus", "Kajian", "Perawi" —
  `app/search/SearchClient.js:236-239`
- dropdown peta "Semua", "Semua Masa" — `app/peta/MapComponent.js:22,30`
- error callback Google OAuth — `app/auth/google/callback/page.js:40,48`
- toast settings & notifications — `app/dashboard/settings/page.js:144,155`,
  `app/dashboard/notifications/page.js:260`
- pesan error mutation admin — `lib/api.js:16-19`
- angka statistik beranda `"6.236"` memakai pemisah ribuan Indonesia di kedua
  bahasa — `app/HomePageClient.js:184`

### 38. 61 File Menyimpang Dari Format Proyek

`prettier --check` pada `src/app`, `src/components`, dan `src/lib` menolak 61
file — seluruh direktori `admin/`, plus `AyahPage.js`, `HadithPage.js`,
`SurahAudioPlayer.js`, `app/layout.js`, dan `sitemap.js`. Beberapa file memakai
kutip tunggal untuk literal JS, padahal `.prettierrc` menetapkan
`singleQuote: false`.

### 39. Beban IA: 49 Tautan Sidebar, Hero Setinggi Layar Penuh, Tanpa Bottom Nav

- sidebar dashboard memuat 49 tautan dalam 4 grup
  (`app/dashboard/layout.js:126-400`).
- beranda dibuka dengan hero `min-h-[100svh]`, sehingga pengguna harian harus
  scroll melewati satu layar penuh materi pemasaran untuk sampai ke jadwal
  sholat dan lanjutan bacaan.
- di mobile, web app tidak punya bottom navigation — semua navigasi lewat
  hamburger, padahal app mobile sudah menerapkan 5 tab.

### 40. Kebocoran Memori Kecil Dan Render Berlebih Di Reader Quran

- `IntersectionObserver` di `AyahPage.js:104-110` tidak pernah `disconnect()`
  saat unmount.
- `useQuranFont()` dipanggil di dalam setiap `AyahPage`, jadi setiap ayat yang
  dirender memasang listener `storage`-nya sendiri.
- `PrayerCountdownWidget` menjalankan `setInterval` 1 detik yang me-render ulang
  seluruh widget, dan interval itu tetap jalan walaupun komponen
  `return null` karena data belum ada.

---

## Yang Sudah Sehat

Perlu dicatat supaya tidak ikut dirombak:

- **Test dan lint**: 476 test lulus di 52 suite, 0 error eslint (12 warning
  `exhaustive-deps` dan `no-img-element`).
- **i18n parity 100%**: 1880 key ID, 1880 key EN, nol key hilang di salah satu
  sisi. 159 nilai identik antar bahasa dan hampir semuanya memang wajar (nama
  diri, istilah serapan).
- **SEO fondasi**: 52 file punya metadata, JSON-LD di root dan di layout konten,
  `sitemap.js` dinamis yang menarik surah/kitab hadis/siroh/blog dari API,
  canonical per halaman, `robots.js` ada.
- **Integritas tautan**: 123 href statis dicocokkan ke 159 route, 0 rusak.
- **Model data konten**: `GradeBadge`, `HadithAuthenticity`, dan `SourceBadges`
  menunjukkan pemahaman yang tepat tentang kebutuhan aplikasi ilmu — derajat
  hadis, siapa yang menshahihkan/mendhaifkan, sanad, dan sumber yang bisa
  ditelusuri ke sunnah.com.
- **Proxy API** (`app/api/v1/[...path]/route.js`): hop-by-hop header dibersihkan
  dengan benar, dan alasan buffering body didokumentasikan di komentar.
- **Kualitas komentar**: skala opacity Tailwind, `content-visibility` pada
  daftar 114 surah, dan `scroll-x-fade` semuanya menjelaskan _alasan_, bukan
  hanya _apa_.
- **Pola `basePath`**: route dashboard adalah wrapper tipis yang me-reuse
  komponen publik dengan `basePath` — cara yang benar untuk menghindari
  duplikasi.

---

## Urutan Perbaikan Yang Disarankan

1. **Satukan metode hitung sholat** (#1) dan refetch saat tanggal berganti (#2).
   Satu-satunya kelas bug yang bisa membuat user salah waktu ibadah.
2. **Sambungkan halaman Settings ke reader** (#7), atau hapus kontrol yang tidak
   berfungsi beserta setelan mati (#8).
3. **Bedakan error dari empty** (#6). Ganti 16 `catch(() => setX([]))` jadi state
   error dengan tombol coba lagi.
4. **Buat satu komponen `<Dialog>`** (#5) dengan focus trap, Escape, dan scroll
   lock; sekalian pasang `htmlFor`/`id` pada form (#4).
5. **Pindahkan Navbar/Footer ke layout** (#17) dan tambahkan script anti-FOUC
   tema di root (#19) — sekaligus menyelesaikan remount, kedipan tema, dan
   duplikasi `pt-24` (#30).
6. **Pecah i18n per bahasa** (#13) dan buang tiga `@import` font yang tidak
   terpakai (#14). Dua perubahan kecil, ~50 KB gzip hilang dari setiap halaman.
7. **Tambahkan `/dashboard/` ke robots disallow** (#24) dan beri Navbar pada
   `/belajar`, `/komunitas`, `/imsakiyah` (#18).
8. **Lengkapi atribusi sumber** (#9) di manasik, amalan, asmaul husna, tafsir,
   dan sejarah; naikkan yang sudah ada dari teks polos ke `SourceBadges`.

---

## Catatan Dokumentasi

`CLAUDE.md` masih menyebut **Next 13.5 / React 18 / TanStack Query**.
Realitanya `Next 16.2.6 / React 19.2.6`, dan TanStack Query tidak dipakai sama
sekali. Perlu diperbarui supaya tidak menyesatkan sesi berikutnya.

---

## Verification Log

| Command                                                   | Hasil                     |
| --------------------------------------------------------- | ------------------------- |
| `npx next build` (Turbopack)                              | exit 0                    |
| `npx jest --silent`                                       | 52 suite / 476 test lulus |
| `npx eslint .`                                            | 0 error, 12 warning       |
| `npx prettier --check "src/{app,components,lib}/**/*.js"` | 61 file gagal             |
| Analisis chunk dari `.next/static` + HTML prerender       | 305 KB gzip first-load    |
| Diff key `translations.ID` vs `translations.EN`           | 1880 = 1880, 0 gap        |
| Cocokkan 123 href statis ke 159 route                     | 0 tautan rusak            |
