# Mobile App Development Guidelines

> Status: `ACTIVE`
> Scope: `apps/mobile`
> Created: 2026-05-25
> Related source of truth:
> - `docs/MOBILE_IA_FINAL_APPROACH.md`
> - `docs/MOBILE_DESIGN_PATTERNS.md`
> - `docs/MOBILE_LAYOUT_MODES.md`

## Intent

Dokumen ini mengatur arah development native mobile app supaya perubahan
`classic` dan `web_app` tetap readable, reusable, dan aman untuk dirawat.

Tujuan utamanya:

- menjaga mobile app lama tetap stabil sebagai fallback;
- memberi ruang untuk layout `web_app` berkembang jauh dari layout lama;
- mencegah screen besar berisi conditional layout yang sulit dibaca;
- menjaga business logic, API, storage, dan navigation tetap shared;
- membuat tiap perubahan mudah dites secara targeted.

## Core Principle

Pisahkan orchestration dari presentation.

Screen utama boleh mengurus:

- data loading;
- state;
- permission;
- cache;
- navigation callback;
- derived value;
- analytics dan activity signal.

Screen utama tidak boleh menjadi tempat semua variasi layout ditumpuk.
Jika satu screen punya presentasi berbeda untuk `classic` dan `web_app`,
buat renderer atau component terpisah untuk masing-masing layout.

## Layout Mode Contract

User-facing layout mode saat ini:

| Mode | Makna |
| --- | --- |
| `classic` | Pengalaman native mobile lama yang stabil. |
| `web_app` | Pengalaman native yang mengikuti struktur dashboard mobile web. |

Catatan naming:

- `classic` adalah nama mode preference user.
- `paper` boleh dipakai sebagai nama internal renderer/style jika mengacu ke
  visual classic yang berbasis paper/card lama.
- Jangan simpan preference baru bernama `paper`; storage tetap memakai
  `classic` dan `web_app`.
- Theme tidak sama dengan layout. Jangan campur logic warna/theme dengan
  pemilihan struktur layout.

## Recommended Screen Architecture

Gunakan pola ini untuk screen yang mulai punya divergensi layout:

```text
apps/mobile/src/screens/
  HomeScreen.js                  # data, state, navigation orchestration
  home/
    HomeDashboardContent.js      # layout renderer selection + presentation
```

Untuk screen lain, ikuti bentuk yang sama:

```text
apps/mobile/src/screens/
  QuranScreen.js
  quran/
    QuranReaderContent.js
    QuranClassicReader.js
    QuranWebAppReader.js
```

Nama folder boleh mengikuti domain screen. Yang penting batas tanggung
jawabnya jelas.

## Renderer Selection Pattern

Jika layout mulai berbeda secara struktur, buat selector eksplisit:

```js
export const screenLayouts = {
  paper: 'paper',
  webApp: 'web_app',
};

export function getScreenRenderer(layoutMode) {
  return layoutMode === screenLayouts.webApp ? WebAppRenderer : PaperRenderer;
}
```

Lalu screen utama cukup memanggil component agregator:

```jsx
return (
  <ScreenContent
    isWebAppLayout={isWebAppLayout}
    data={data}
    onOpenTab={onOpenTab}
  />
);
```

Rules:

- Renderer `classic`/`paper` dan `web_app` harus berupa function/component
  terpisah.
- Shared state dan handler dikirim via props.
- Jangan fork API call hanya karena layout berbeda.
- Jangan membuat `if (isWebAppLayout)` besar di tengah JSX utama.
- Conditional kecil untuk style masih boleh jika struktur sama dan mudah
  dibaca.
- Jika conditional mulai mengubah urutan section, grouping, empty state, atau
  navigation surface, pindahkan ke renderer terpisah.

## Data And Behavior Sharing

Yang harus tetap shared lintas layout:

- API client di `apps/mobile/src/api/`;
- storage/cache di `apps/mobile/src/storage/`;
- feature registry di `apps/mobile/src/data/mobileFeatures.js`;
- navigation state dan tab key;
- Android back handling via `setBack`/`clearBack`;
- audio/player, bookmark, notes, prayer, notification, dan reader logic;
- analytics event naming.

Layout boleh berbeda pada:

- urutan section;
- visual hierarchy;
- density dan spacing;
- menu grouping;
- header/account surface;
- bottom sheet atau shortcut placement;
- copy kecil yang menyesuaikan konteks layout.

## Component Boundary

Pilih boundary seperti ini:

| Layer | Boleh berisi | Tidak boleh berisi |
| --- | --- | --- |
| `App.js` / shell | provider, active tab, shell selection | screen-specific data loading |
| `layout/` | top header, bottom nav, account/menu sheet | feature business logic |
| `screens/*Screen.js` | screen state, effects, route handling | semua variasi visual layout besar |
| `screens/<domain>/` | renderer dan presentational section | duplicated API/storage logic |
| `components/` | primitive reusable UI | screen-specific orchestration |
| `hooks/` | reusable state/derived behavior | layout-specific JSX besar |

Jika component hanya dipakai satu screen dan spesifik domain, letakkan di
folder domain screen, bukan di `components/`.

## DRY, KISS, SOLID Rules

- DRY: share data hooks, helpers, formatting, storage, dan action handlers.
- KISS: jangan buat abstraction generic sebelum ada dua kebutuhan nyata.
- SRP: screen orchestration, layout renderer, dan primitive UI harus punya
  tanggung jawab terpisah.
- Open/Closed: layout baru ditambah lewat renderer baru, bukan mengedit banyak
  conditional di screen utama.
- Dependency direction: renderer bergantung pada props dari screen, bukan
  mengambil ulang data sendiri.

## Mobile UI Rules That Still Apply

Aturan ini tetap mengikat di semua layout:

- IA utama tetap 5 tab: Beranda, Quran, Hadis, Ibadah, Belajar.
- Profile/account bukan tab utama; akses via header/avatar/account surface.
- Detail tidak memakai inline expand/collapse; gunakan bottom sheet modal atau
  page detail.
- Android back wajib memakai `setBack`/`clearBack` untuk sub-navigation.
- `web_app` adalah native layout, bukan WebView.
- Floating action tidak boleh overlap bottom nav.
- Semua fitur utama harus tetap reachable di `classic` dan `web_app`.

## Adding Or Changing A Screen

Sebelum implementasi:

1. Tentukan apakah perubahan hanya visual kecil atau struktur layout.
2. Jika struktur berbeda, buat renderer per layout.
3. Pastikan data source dan action handler tetap shared.
4. Pastikan feature tetap reachable dari kedua layout.
5. Tentukan test targeted sebelum coding.

Saat implementasi:

1. Jangan mengubah `classic` jika task hanya untuk `web_app`.
2. Jangan rename tab key atau route internal tanpa migration.
3. Jangan memindahkan storage key tanpa backward compatibility.
4. Jangan menambahkan dependency UI besar untuk satu komponen kecil.
5. Jangan menghapus test lama saat refactor.

Setelah implementasi:

1. Run test targeted screen.
2. Run full mobile Jest jika menyentuh shared screen, shell, provider, storage,
   navigation, atau feature registry.
3. Run `git diff --check`.
4. Untuk UI/shell mobile, lakukan real-device smoke jika device tersedia.

## Test Guidance

Minimum test untuk perubahan layout mode:

- selector memilih renderer yang benar;
- `classic` masih render marker/testID lama;
- `web_app` render marker/testID baru;
- action utama tetap memanggil callback yang sama;
- invalid preference fallback ke `classic`;
- navigation/back behavior tidak berubah.

Contoh guard yang disarankan:

```js
expect(getHomeDashboardRenderer(homeDashboardLayouts.paper)).toBe(PaperHomeDashboard);
expect(getHomeDashboardRenderer(homeDashboardLayouts.webApp)).toBe(WebAppHomeDashboard);
```

Command umum:

```bash
cd apps/mobile
npm test -- homeScreen.test.js --runInBand
npm test -- mobileAppShell.test.js --runInBand
npm test -- --runInBand
```

## Documentation Checklist

Update docs jika perubahan menyentuh salah satu area ini:

- IA mobile atau tab placement: `docs/MOBILE_IA_FINAL_APPROACH.md`.
- Layout mode, shell, atau parity antar layout: `docs/MOBILE_LAYOUT_MODES.md`.
- Pola UI mengikat: `docs/MOBILE_DESIGN_PATTERNS.md`.
- Feature parity web/mobile/API: `docs/WEB_MOBILE_SYNC.md`.
- Status feature berjalan: `docs/features/progress/`.

Jika hanya refactor internal tanpa perubahan behavior, cukup update dokumen ini
atau test architecture guard bila perlu.

## Current Reference Implementation

Pola yang sudah dipakai:

- `apps/mobile/src/screens/HomeScreen.js`
  - mengurus data home, lokasi, jadwal sholat, daily content, recent/pinned
    feature, dan navigation.
- `apps/mobile/src/screens/home/HomeDashboardContent.js`
  - memilih renderer dashboard;
  - menyimpan renderer `PaperHomeDashboard` dan `WebAppHomeDashboard`;
  - menyimpan presentation-specific styles dan UI section.
- `apps/mobile/src/__tests__/homeScreen.test.js`
  - memastikan renderer layout dipilih eksplisit;
  - menjaga `classic` dan `web_app` tetap render marker yang benar.

Gunakan pola ini sebagai acuan untuk screen berikutnya yang membutuhkan isi
content berbeda antara `classic` dan `web_app`.
