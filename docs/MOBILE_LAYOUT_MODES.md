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
- Android back navigation tetap benar.
- Bottom-sheet menu bisa dibuka/tutup dengan tap luar dan tombol close.
- Floating action tidak overlap dengan bottom nav.
- Reader/audio/bookmark/notes tetap memakai data dan behavior yang sama.
- Expo export atau test mobile relevan harus pass sebelum ditutup.

