# Mobile Layout Modes

> Status: `PLANNED`
> Scope: `apps/mobile`
> Created: 2026-05-23
> Source of truth terkait:
> - `docs/MOBILE_IA_FINAL_APPROACH.md`
> - `docs/MOBILE_DESIGN_PATTERNS.md`
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
| `web_app` | Planned | Membawa rasa mobile web terbaru ke native app: top header, bottom nav, konten fokus, dan bottom-sheet menu. |

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
```

Nama file final boleh mengikuti pola existing repo saat implementasi, tetapi
batas tanggung jawabnya harus tetap jelas.

## Rollout Plan

1. Tambah preference layout mode.
2. Tambah setting UI untuk memilih `classic` atau `web_app`.
3. Buat shell `web_app` tanpa mengubah isi screen besar.
4. Terapkan dulu ke Beranda dan Quran.
5. Verifikasi Android back navigation dengan `setBack`/`clearBack`.
6. Setelah stabil, lanjut Hadis, Ibadah, dan Belajar.
7. Baru setelah itu pertimbangkan theme visual tambahan.

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
