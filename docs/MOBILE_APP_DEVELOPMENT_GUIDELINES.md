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

## Web App Dashboard Parity Contract

Mode `web_app` harus mengikuti desain mobile view dari web dashboard
`/dashboard`. Ini adalah contract visual dan interaction utama untuk
refactor `web_app`.

Source of truth:

- primary: `apps/web` route `/dashboard` pada viewport mobile;
- comparison viewport default: sekitar `412x915`;
- native target: `apps/mobile` dengan layout preference
  `tholabul:pref:app-layout-mode` bernilai JSON string `"web_app"`;
- shell reference: topbar, account menu, bottom nav, menu sheet, dashboard
  density, card hierarchy, spacing, warna, dan typography treatment dari
  `/dashboard` mobile view.

Rules:

- Jangan mengubah web dashboard hanya untuk memudahkan native parity. Web
  dashboard hanya boleh diubah jika ada bug web yang jelas dan terverifikasi.
- Jangan memakai screenshot lama sebagai satu-satunya acuan. Ambil ulang
  screenshot browser mobile view ketika refactor visual signifikan.
- Jangan menyamakan `web_app` dengan theme app. `web_app` adalah layout mode
  dan composition contract; theme gelap/terang tetap concern terpisah.
- Jangan membuat `web_app` kehilangan fitur atau route yang ada di `classic`.
- Jangan menyalin implementation web mentah-mentah jika membuat native behavior
  buruk. Ikuti desain dan interaction intent, tetap pakai native component.

Minimum compare path:

```bash
# Web dashboard reference
http://localhost:23000/dashboard

# Expo web/native app target
cd apps/mobile
EXPO_PUBLIC_API_URL=http://localhost:29900 npx expo start --web --port 23010 --host localhost
```

Untuk Expo web target, pastikan AsyncStorage layout mode diset ke:

```js
localStorage.setItem('tholabul:pref:app-layout-mode', JSON.stringify('web_app'));
```

Catat mismatch visual sebelum patch. Patch native mobile dulu, bukan web,
kecuali mismatch tersebut terbukti berasal dari bug web dashboard.

## Refactor Isolation Rules

Karena `web_app` akan mengikuti banyak detail `/dashboard`, refactor harus
dibatasi per slice.

Allowed untuk task `web_app` shell/layout:

- `apps/mobile/src/layout/WebAppShell.js`
- `apps/mobile/src/layout/MobileTopHeader.js`
- `apps/mobile/src/layout/MobileBottomNav.js`
- `apps/mobile/src/layout/MobileMenuSheet.js`
- `apps/mobile/src/layout/MobileAccountMenu.js`
- renderer domain di `apps/mobile/src/screens/<domain>/`
- test yang relevan di `apps/mobile/src/__tests__/`
- dokumen mobile terkait.

Allowed dengan alasan kuat dan test lebih luas:

- `apps/mobile/App.js`
- `apps/mobile/src/layout/LayoutModeProvider.js`
- `apps/mobile/src/hooks/useLayoutModePreference.js`
- shared primitive di `apps/mobile/src/components/`
- shared theme token di `apps/mobile/src/theme.js`.

Normally forbidden untuk task parity visual `web_app`:

- `apps/mobile/src/layout/ClassicAppShell.js`
- `apps/mobile/src/components/TabBar.js`
- API clients di `apps/mobile/src/api/`
- storage schema di `apps/mobile/src/storage/`
- navigation key atau route shape;
- web dashboard files di `apps/web`, kecuali bug web jelas.

Jika forbidden area harus disentuh, tulis alasan di commit/PR description dan
tambahkan test yang membuktikan `classic` tidak berubah.

## No-Touch Classic Rules

Perubahan `web_app` tidak boleh mengubah behavior `classic`.

Checklist wajib:

- install baru tanpa preference memakai `web_app`, sementara preference invalid
  tetap fallback ke `classic`.
- `classic` tetap memakai shell, tab bar, spacing, dan navigation lama.
- test marker/testID classic tetap ada.
- action callback classic tetap sama.
- Android back classic tetap sama.
- tidak ada perubahan snapshot/screenshot classic tanpa alasan eksplisit.

Kalau refactor shared dibutuhkan, lakukan dalam dua tahap:

1. pure extraction tanpa perubahan behavior;
2. perubahan `web_app` yang memakai hasil extraction.

Jangan gabungkan extraction besar dan redesign visual dalam satu commit jika
blast radius-nya menyentuh shared logic.

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
5. Jika task menyentuh `web_app`, ambil atau cek reference `/dashboard`
   mobile view sebelum patch.
6. Tentukan test targeted sebelum coding.

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
4. Untuk UI/shell mobile, lakukan browser mobile viewport compare terhadap
   `/dashboard`.
5. Untuk native shell/device behavior, lakukan real-device smoke jika device
   tersedia.

## Test Guidance

Minimum test untuk perubahan layout mode:

- selector memilih renderer yang benar;
- `classic` masih render marker/testID lama;
- `web_app` render marker/testID baru;
- action utama tetap memanggil callback yang sama;
- invalid preference fallback ke `classic`;
- navigation/back behavior tidak berubah.
- jika shared component disentuh, test harus membuktikan kedua layout tetap
  aman.

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

## Merge Gate For Web App Parity Work

Sebelum perubahan `web_app` dianggap selesai:

- mismatch terhadap `/dashboard` mobile view sudah dicatat;
- patch hanya menyentuh area yang perlu;
- `classic` tidak ikut berubah tanpa alasan eksplisit;
- targeted Jest pass;
- full mobile Jest pass untuk perubahan shell/shared;
- `git diff --check` clean;
- browser mobile viewport compare dilakukan untuk visual change;
- real-device smoke dilakukan jika menyentuh native-only behavior atau device
  tersedia;
- commit hanya berisi perubahan agent-owned untuk slice tersebut.

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
