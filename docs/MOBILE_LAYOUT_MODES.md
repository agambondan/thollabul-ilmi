# Mobile Layout Modes

> Status: `IN_PROGRESS`
> Scope: `apps/mobile`
> Created: 2026-05-23
> Source of truth terkait:
> - `docs/MOBILE_IA_FINAL_APPROACH.md`
> - `docs/MOBILE_DESIGN_PATTERNS.md`
> - `docs/MOBILE_APP_DEVELOPMENT_GUIDELINES.md`
> - `docs/WEB_MOBILE_SYNC.md`

## Decision

Mobile app native tidak dibuang dan tidak di-rewrite total.

Kode mobile app yang sudah ada tetap menjadi baseline layout lama. Ke depan,
mobile app boleh punya beberapa mode layout yang bisa dipilih user dari
pengaturan. Layout baru yang terinspirasi dari mobile web dashboard menjadi
opsi tambahan, bukan pengganti paksa untuk semua user.

Target awal:

| Mode | Status | Tujuan |
| --- | --- | --- |
| `classic` | Existing baseline | Mempertahankan pengalaman mobile app saat ini sebagai fallback stabil. |
| `web_app` | In progress | Membawa rasa mobile web terbaru ke native app: top header, bottom nav, konten fokus, dan bottom-sheet menu. |

Mode tambahan boleh ditambahkan setelah dua mode awal stabil, tetapi harus
tetap mengikuti IA final 5 tab.

## Why

Mobile web terbaru terasa lebih natural sebagai app karena:

- navigasi utama jelas di bottom nav;
- header atas lebih ringan dibanding sidebar atau menu panjang;
- menu sekunder disembunyikan ke bottom-sheet;
- konten Quran/dashboard lebih fokus di layar kecil;
- visual density lebih cocok untuk repeated daily use.

Namun, mobile app lama tetap berharga karena sudah punya screen, state,
integrasi API, gesture, audio, cache, dan behavior native yang tidak perlu
diulang dari nol.

## Non-Goals

- Tidak menghapus `apps/mobile` lama.
- Tidak mengganti seluruh screen dalam satu big-bang rewrite.
- Tidak menjadikan web app sebagai satu-satunya mobile app.
- Tidak membuat fitur baru hanya untuk mengejar visual parity.
- Tidak membuat mode layout yang mengubah IA utama di luar 5 tab final.

## Layout vs Theme

Layout dan theme harus dipisah.

| Konsep | Mengatur | Contoh |
| --- | --- | --- |
| Layout mode | Struktur navigasi dan komposisi screen | `classic`, `web_app` |
| Theme | Warna, tone, surface, typography accent | `system`, `light`, `dark`, `emerald`, `high_contrast` |
| Reader preference | Pengaturan spesifik konten Quran/Hadis | font Arab, ukuran teks, mode hafalan, terjemahan |

Implikasi:

- User bisa memilih layout tanpa mengubah warna.
- User bisa memilih theme tanpa mengubah struktur navigasi.
- Reader Quran tetap punya preference sendiri karena kebutuhan baca/hafalan
  berbeda dari shell aplikasi.

## Expected UX

Pengaturan awal:

- `Settings > Appearance > Layout`
  - `Classic`
  - `Web App`
- `Settings > Appearance > Theme`
  - `System`
  - `Light`
  - `Dark`
  - opsi brand/aksesibilitas setelah fondasi stabil

Preferensi disimpan lokal dulu agar cepat dan offline-safe. Sinkronisasi ke
akun bisa ditambahkan setelah model settings account-level stabil.

## Web App Layout Definition

Mode `web_app` pada mobile native mengacu ke mobile web dashboard terbaru,
bukan embed webview.

Karakter target:

- top header dengan brand/account surface;
- bottom nav untuk 5 tab utama: Beranda, Quran, Hadis, Ibadah, Belajar;
- tombol menu membuka bottom-sheet untuk fitur sekunder;
- screen detail memakai bottom-sheet modal atau page detail, bukan inline
  expand/collapse;
- floating actions tidak boleh menabrak bottom nav;
- konten utama memakai spacing compact, bukan kartu bertumpuk berlebihan.

## Guest vs Authenticated Dashboard

Mode `web_app` meniru layout dashboard mobile web yang sudah login, tetapi
mobile app tidak boleh memaksa user login untuk memakai aplikasi.

Shell visual tetap sama untuk guest dan authenticated user:

- top header tetap tampil;
- bottom nav tetap tampil;
- Beranda tetap menjadi cockpit harian;
- Quran, Hadis, Ibadah, dan Belajar tetap bisa dibuka tanpa login selama data
  yang dibutuhkan bersifat public atau lokal;
- account/avatar surface berubah menjadi entry "Masuk" atau "Akun" sesuai
  state login.

Perbedaannya ada pada data yang ditampilkan.

| Area | Guest / belum login | Authenticated / sudah login |
| --- | --- | --- |
| Greeting | `Assalamu'alaikum` atau nama lokal bila user pernah isi profil lokal | Nama akun dari backend |
| Sholat hari ini | Bisa memakai status lokal device untuk sesi hari ini | Sinkron dengan akun dan histori backend |
| Streak sholat | Local-only streak atau prompt ringan untuk login | Streak akun dari backend |
| Target aktif | CTA "Buat target" atau target lokal | Target belajar akun |
| Bookmark | Bookmark lokal bila tersedia, atau CTA login untuk sync | Bookmark akun dari backend |
| Ayat hari ini | Public daily ayah dari API/cache | Sama, plus status sudah dibaca bila ada |
| Hadis hari ini | Public daily hadith dari API/cache | Sama, plus status simpan/catatan personal |
| Jadwal sholat | Lokasi device/manual, cache lokal | Lokasi/preference akun bila tersedia |
| Lanjutkan terakhir | Local recent item | Recent item akun + local merge |
| Notifikasi | Local reminders/device permission | Reminder akun + device notification |

Rules:

- Guest state harus tetap berguna, bukan halaman kosong yang hanya meminta
  login.
- Fitur public content boleh langsung dipakai: Quran, Hadis, jadwal sholat,
  doa, dzikir, asmaul husna, tafsir public, dan artikel/library public.
- Fitur personal boleh punya local-first fallback: recent item, reader
  preference, kalkulator history, progress ringan, dan temporary bookmarks.
- Fitur yang membutuhkan akun harus menampilkan CTA kecil dan kontekstual,
  bukan modal login blocking.
- Saat user login, local data yang relevan boleh ditawarkan untuk merge/sync,
  bukan otomatis menimpa data akun.

Contoh susunan Beranda `web_app` untuk guest:

1. Header: brand, "Masuk" account button, layout/settings entry.
2. Greeting: `Assalamu'alaikum`.
3. Quick stats:
   - Sholat hari ini: local session status.
   - Streak: local streak atau `0`.
   - Target aktif: CTA `Buat target`.
   - Bookmark: local bookmark count atau CTA `Login untuk sync`.
4. Ayat hari ini: public daily ayah.
5. Hadis hari ini: public daily hadith.
6. Sholat hari ini: jadwal dari lokasi/manual.
7. Lanjutkan terakhir: dari local storage.
8. CTA kecil: `Masuk untuk sinkronisasi bookmark, target, dan progres`.

## Feature Parity Across Layout Modes

Layout mode tidak boleh mengurangi fitur.

`classic` dan `web_app` harus mengekspos feature set yang sama, meskipun
posisi, grouping, dan visual hierarchy boleh berbeda. Pergantian layout hanya
boleh mengubah cara user menemukan dan memakai fitur, bukan menghapus fitur
dari pengalaman mobile app.

Source of truth feature tetap:

- `docs/features/feature-manifest.json`
- `apps/mobile/src/data/mobileFeatures.js`
- screen-level routes di `apps/mobile/src/screens/*Screen.js`
- parity rule di `docs/WEB_MOBILE_SYNC.md`

Rules:

- Semua 5 tab final wajib ada di setiap layout: Beranda, Quran, Hadis,
  Ibadah, Belajar.
- Fitur utama seperti Quran, Hadis, Jadwal Sholat, Qibla, Hafalan, Tafsir,
  Doa/Dzikir, Journal, Kuis, Kajian, Bookmark, Notes, Target, dan Profile/
  Settings tetap harus reachable.
- `web_app` boleh memindahkan fitur long-tail ke bottom-sheet menu, hub,
  search, pinned shortcut, atau recent item.
- Fitur yang butuh akun tetap muncul sebagai locked/personal action dengan CTA
  login, bukan hilang dari navigasi.
- Data source dan action handler harus shared sejauh mungkin agar switching
  layout tidak menciptakan drift data.
- Saat fitur baru ditambahkan ke mobile, kedua layout harus dipertimbangkan di
  task yang sama: apakah masuk tab, hub, menu sheet, search, atau shortcut.

Contoh mapping:

| Feature type | `classic` | `web_app` |
| --- | --- | --- |
| Primary tab | Bottom tab / existing screen | Bottom nav 5 tab |
| Daily cockpit | Existing Beranda card stack | Compact dashboard cards |
| Long-tail feature | Hub/grid/list existing | Menu sheet, hub, search, pinned/recent |
| Personal feature | Profile/settings/account area | Account sheet/settings plus contextual CTA |
| Auth-required action | Existing login handoff | Inline CTA, locked action, or account sheet |

## Architecture Direction

Implementasi harus menghindari duplikasi logic.

Arahan engineering detail ada di
[`MOBILE_APP_DEVELOPMENT_GUIDELINES.md`](./MOBILE_APP_DEVELOPMENT_GUIDELINES.md).
Ringkasnya: screen utama mengurus orchestration, sedangkan presentasi
`classic`/internal `paper` dan `web_app` dipisah ke renderer/component
tersendiri ketika struktur UI mulai berbeda.

Prinsip:

- Business logic, API calls, cache, audio state, dan reader state tetap
  dibagi lewat hooks/service yang sama.
- Layout mode hanya memilih shell dan komposisi presentasi.
- Existing screen tetap bisa berjalan sebagai `classic`.
- `web_app` layout boleh memakai komponen baru, tetapi data source dan action
  handler tidak boleh bercabang tanpa alasan kuat.

Struktur target yang disarankan:

```text
apps/mobile/src/
  layout/
    LayoutModeProvider.js
    ClassicAppShell.js
    WebAppShell.js
    MobileTopHeader.js
    MobileBottomNav.js
    MobileMenuSheet.js
  hooks/
    useLayoutModePreference.js
  screens/
    QuranScreen.js
    HomeScreen.js
    home/
      HomeDashboardContent.js
```

Nama file final boleh mengikuti pola existing repo saat implementasi, tetapi
batas tanggung jawabnya harus tetap jelas.

## Current Code Impact Map

Status kode saat ini:

- `apps/mobile/src/storage/preferences.js` sudah memiliki
  `preferenceKeys.appLayoutMode`.
- `apps/mobile/src/screens/ProfileScreen.js` sudah bisa menyimpan pilihan
  layout mode ke preference lokal.
- `apps/mobile/App.js` sudah memakai `LayoutModeProvider` dan memilih shell
  presentation berdasarkan `classic` atau `web_app`, tetapi navigation state
  tetap satu sumber: `activeTab`, `deepLinkTarget`, `internalRoutes`,
  `returnRoutes`, dan hardware back handler.
- `apps/mobile/src/components/TabBar.js` adalah bottom tab existing untuk 5 tab
  final, dengan auto-hide behavior untuk `classic`.
- `apps/mobile/src/components/MobileAppShell.js` menyediakan top header,
  bottom navigation, dan menu sheet untuk `web_app`.
- Screen besar seperti `HomeScreen`, `QuranScreen`, `HadithScreen`,
  `IbadahScreen`, `ExploreScreen`, `ProfileScreen`, dan `GlobalSearchScreen`
  sudah punya opt-in `web_app` surface wrapper tanpa mengubah data/action
  handler. Sub-screen Ibadah utama (`PrayerScreen`, `QiblaScreen`,
  `KhatamScreen`) juga sudah mendapat wrapper yang sama.
- `apps/mobile/src/screens/HomeScreen.js` sudah mulai mengikuti boundary baru:
  data/orchestration tetap di screen utama, sedangkan dashboard presentation
  dipindah ke `apps/mobile/src/screens/home/HomeDashboardContent.js` dengan
  renderer `PaperHomeDashboard` dan `WebAppHomeDashboard`.

Area yang kemungkinan kena impact:

| Area | Risiko | Guardrail |
| --- | --- | --- |
| `App.js` shell | Salah wiring bisa merusak semua tab, deep link, hardware back, dan analytics | Fase pertama hanya membaca preference dan memilih shell wrapper; navigation state tetap satu sumber. |
| `TabBar` | Perubahan visual bisa mengubah behavior auto-hide dan tab accessibility | Jangan ubah `TabBar` existing untuk `classic`; buat komponen baru untuk `web_app` bila perlu. |
| Quran reader | Layout baru bisa konflik dengan audio player, bottom action, font preference, dan back handler | Jangan ubah business logic Quran di fase shell; hanya bungkus/presentasikan. |
| Home/prayer cockpit | Lokasi, jadwal, notification, dan cache bisa drift dari web contract | Reuse storage/API yang sudah ada; jangan hardcode lokasi atau jadwal. |
| Profile settings | Layout preference mengubah shell dan surface, tetapi theme gelap masih follow-up | Pertahankan provider/hook fallback ke `classic`; jangan campur theme dengan layout. |
| Deep links | `parseDeepLink` dan `openTabState` harus tetap mengarah ke tab/screen yang sama | Layout mode tidak boleh mengubah tab key atau internal route shape. |
| Android back | `setBack`/`clearBack` dan `hardwareBackState` rawan regression | Tambah/pertahankan test navigation sebelum shell baru dianggap usable. |
| Offline/cache | Mobile punya offline packs dan local-first storage | `web_app` tidak boleh memaksa online-only UX. |
| Analytics | `AnalyticsTracker` bergantung pada `activeTab` dan `internalRoutes` | Shell baru tetap mengirim state yang sama, bukan route name baru yang memecah analytics. |

## Implementation Guardrails

Sebelum ada kode behavior baru, ikuti batas ini:

- Default harus tetap `classic`.
- `web_app` harus opt-in dan bisa dikembalikan ke `classic` dari settings.
- Jangan rename tab key: tetap `home`, `quran`, `hadith`, `ibadah`,
  `belajar`, dan internal `profile`.
- Jangan embed mobile web lewat WebView. `web_app` adalah native layout.
- Jangan fork API client, cache, audio player, notes/bookmark service, atau
  prayer service hanya karena beda layout.
- Jangan hapus test existing. Tambahkan test untuk provider/shell selection
  sebelum refactor visual.
- Perluasan surface tetap incremental per slice dan harus disertai targeted
  test, full mobile Jest, parity checker, dan Expo export.

Jika `web_app` gagal render atau preference invalid, fallback harus kembali ke
`classic` tanpa crash.

## Rollout Plan

0. Impact baseline:
   - Pastikan `classic` test pass sebelum edit shell.
   - Catat screenshot/behavior baseline untuk Home, Quran, Hadith, Ibadah,
     Belajar, Profile settings, deep link Quran, dan Android back.
1. Foundation:
   - Tambah `LayoutModeProvider`/hook pembaca `appLayoutMode`.
   - Hubungkan provider di `App.js` tanpa mengubah render output saat mode
     `classic`.
   - Tambah test preference normalization: invalid value harus menjadi
     `classic`.
2. Shell opt-in:
   - Buat shell `web_app` yang masih memakai screen existing.
   - Jangan ubah isi screen besar; hanya top header, bottom nav/menu shell.
   - Pastikan setting Profile bisa switch `classic`/`web_app`.
   - Status: completed for initial shell/menu/header wiring.
3. Limited surface:
   - Terapkan dulu ke Beranda dan Quran shell behavior.
   - Quran tidak boleh kehilangan audio, ayah actions, reader preferences,
     bookmark, notes, dan back behavior.
   - Status: completed for Home and Quran first-pass surfaces, including the
     Quran ayah detail surface.
4. Expand surface:
   - Setelah Home/Quran stabil, lanjut Hadith, Ibadah, dan Belajar.
   - Long-tail feature masuk menu sheet/search/hub, bukan dihapus.
   - Status: in progress; Hadith, Ibadah hub, Prayer, Qibla, Khatam,
     Explore/Belajar, Profile, and Global Search first-pass surfaces are
     implemented.
5. Polish:
   - Baru pertimbangkan theme visual tambahan, density tuning, dan animation.
   - Theme tetap tidak boleh tercampur dengan layout mode.
   - Status: pending; visual polish and real-device smoke remain.

## QA Checklist

Untuk setiap screen yang mendapat mode `web_app`:

- `classic` masih render dan navigasinya tidak berubah.
- `web_app` memakai 5 tab final.
- Semua feature dari manifest tetap reachable di layout yang diuji.
- Android back navigation tetap benar.
- Bottom-sheet menu bisa dibuka/tutup dengan tap luar dan tombol close.
- Floating action tidak overlap dengan bottom nav.
- Reader/audio/bookmark/notes tetap memakai data dan behavior yang sama.
- Expo export atau test mobile relevan harus pass sebelum ditutup.

Minimum verification per phase:

| Phase | Required checks |
| --- | --- |
| Foundation | `apps/mobile/src/__tests__/preferences.test.js`, navigation tests, and profile settings test. |
| Shell opt-in | Existing `components.test.js` for `TabBar`, new shell/provider tests, and manual switch `classic` -> `web_app` -> `classic`. |
| Home/Quran | `homeScreen.test.js`, `quranScreen.test.js`, `useQuranReaderPreferences.test.js`, audio player tests, and Android back smoke. |
| Full rollout | `node scripts/check-feature-parity.js`, full mobile Jest, deep link tests, notification/prayer tests, and real-device smoke for permission, audio, and bottom sheet. |
