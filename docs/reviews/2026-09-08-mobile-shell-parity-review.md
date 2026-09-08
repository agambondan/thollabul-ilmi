# Review: `feat/mobile-shell-parity`

Tanggal: `2026-09-08`
Scope: `apps/web` — commit `835e8d0` (5 file: `dashboard/layout.js`,
`MobileTabBar.js`, `Navbar.js`, `components/layout/MobileMenuDrawer.js` baru,
`lib/navGroups.js` baru)
Status: `REVIEWED_AND_FIXED` — di-merge ke master setelah semua temuan diperbaiki dan diverifikasi ulang

PR ini menyatukan drawer menu mobile ("more") antara dashboard dan site
publik jadi satu `MobileMenuDrawer` + `navGroups.js`, plus perapian header
mobile (`Navbar.js`) dan bottom tab bar publik (`MobileTabBar.js`). Idenya
bagus (menghapus duplikasi ~600 baris), tapi eksekusinya membuang beberapa
fungsi yang sebelumnya ada tanpa pengganti, dan menambah 1 breakpoint yang
tidak konsisten dengan komponen tetangganya.

Direview via workflow multi-agent: 5 dimensi (correctness, route integrity,
accessibility, consistency/simplification, i18n) → tiap temuan diverifikasi
ulang secara independen dengan membaca kode asli di branch. Semua yang
dilaporkan di bawah **CONFIRMED** (tidak ada yang plausible/refuted).

## Temuan — P0 (blocker, wajib fix sebelum merge)

### 1. Breakpoint `md` vs `lg` bikin dead-zone 768–1023px

`MobileMenuDrawer.js:30` dan `MobileTabBar.js` (nav root) pakai `md:hidden`
(hilang di ≥768px), tapi hamburger trigger + desktop nav di `Navbar.js`
masih pakai `lg:hidden` / `lg:block` (ganti mode di ≥1024px). Sebelum PR
ini, `MobileTabBar` juga pakai `lg:hidden` — jadi tidak ada celah.

Di lebar 768–1023px (tablet/iPad portrait, browser diperkecil): desktop nav
tersembunyi, bottom tab bar tersembunyi, tapi tombol hamburger Navbar masih
tampil. Menekannya membuka `MobileMenuDrawer` yang **render `display:none`**
karena `md:hidden` miliknya sendiri — tidak ada yang muncul di layar, padahal
`useModalA11y` tetap mengunci scroll body dan memasang listener Escape/Tab.
User terjebak: tidak ada navigasi yang bisa diakses di rentang lebar ini.

**Fix**: samakan breakpoint drawer, trigger hamburger, dan desktop nav ke
satu titik yang sama (`md` atau `lg`, pilih salah satu secara konsisten di
ketiga file).

### 2. Language switcher hilang di mobile/tablet (publik, <1024px)

Blok mobile-menu lama di `Navbar.js` (dihapus PR ini) berisi dropdown bahasa
(`SmallDropDown`, key `nav.language`). Pengganti (`MobileMenuDrawer`) cuma
render kategori konten dari `getNavGroups()` — tidak ada kontrol bahasa sama
sekali. Satu-satunya `SmallDropDown` yang tersisa ada di dalam
`<div className='hidden w-full lg:block lg:w-auto'>` (`Navbar.js:206`), jadi
hanya tampil di ≥1024px.

Guest/user di HP atau tablet publik sekarang **tidak bisa ganti ID/EN sama
sekali** di manapun pada halaman publik.

**Fix**: kembalikan kontrol bahasa ke drawer mobile, atau ke tempat lain yang
tetap reachable di bawah 1024px.

### 3. Menu quick-access akun (termasuk Admin & Logout) hilang di mobile publik

Blok yang sama juga berisi grid quick-link akun (khusus authenticated user):
Profile, Bookmarks, Hafalan, Muroja'ah, Tilawah, Amalan, Notes,
Notifications, Statistics, `/admin` (role-gated), dan tombol Logout.
`MobileMenuDrawer` + `navGroups.js` tidak punya salah satu pun dari ini —
`getNavGroups()` cuma berisi link kategori konten (Quran/Hadith/dll), tidak
ada cabang `isAuthenticated`.

Satu-satunya jalan keluar di mobile sekarang: user harus tap avatar → masuk
ke `/dashboard` → buka dropdown akun di header dashboard. Tapi dropdown itu
(`ACCOUNT_LINKS` di `dashboard/layout.js`) **juga tidak punya link
`/admin`** — jadi admin yang login lewat halaman publik di HP tidak
punya jalan sama sekali ke `/admin` selain mengetik URL manual, dan Logout
butuh 2 langkah tambahan dibanding sebelumnya (1 tap dari mana saja).

**Fix**: drawer perlu tahu `isAuthenticated`/`user.role` dan menambahkan
seksi akun (minimal: link dashboard/profile/logout, dan admin bila
relevan) — bukan cuma kategori konten dari `navGroups.js`.

### 4. Dua trigger drawer yang tidak terkoordinasi, berpotensi dobel-modal

`Navbar.js` (state `isMobileMenuOpen`, trigger di <1024px) dan
`MobileTabBar.js` (state baru `menuOpen`, trigger baru "Menu" di <768px,
`MobileTabBar.js:47,83-97`) sama-sama mount `MobileMenuDrawer` sendiri-
sendiri untuk `basePath=''` — dua instance state React independen, dua
instance `useModalA11y` independen. Di lebar <768px keduanya tampil
bersamaan di layar.

`useModalA11y` cuma nge-trap Tab key di panel-nya sendiri, tidak memasang
`aria-hidden`/`inert` ke konten lain — jadi user pembaca layar (VoiceOver/
TalkBack, yang navigasi lewat swipe, bukan Tab) berpotensi mengaktifkan
trigger lain saat satu drawer sudah terbuka, menghasilkan dua `role=dialog`
menumpuk, dua document-keydown-listener, dan `openCount` (module-level di
`useModalA11y.js`) yang increment dua kali — kondisi yang sebelum PR ini
tidak mungkin terjadi (MobileTabBar dulu tidak punya trigger menu).

**Fix**: satukan trigger jadi satu sumber state (misal: state drawer publik
diangkat ke layout/context bersama, bukan dua `useState` terpisah di dua
komponen berbeda), atau sembunyikan salah satu trigger saat lebar overlap.

## Temuan — P1 (penting, sebaiknya fix sebelum atau segera sesudah merge)

### 5. 5 route publik hilang dari drawer mobile

`getNavGroups('')` (publik) tidak mengandung `/contact`, `/forum`,
`/leaderboard`, `/asmaul-husna/flashcard`, `/asmaul-husna/wirid` — padahal
kelimanya masih ada halamannya (`page.js` masih ada) dan masih reachable
dari nav desktop (`linksMenu`/`linksMenuContent` di `Navbar.js`, tidak
disentuh PR ini). Kelihatannya `navGroups.js` dicontoh dari bentuk `GROUPS`
dashboard (yang memang tidak pernah punya link-link ini), bukan dari menu
mobile publik yang lama.

**Fix**: tambahkan kelima route itu ke grup yang sesuai di `getNavGroups('')`.

### 6. "Parity" tidak menyentuh bottom nav dashboard sendiri

`MobileTabBar.js` dapat perbaikan safe-area
(`paddingBottom: max(0.5rem, env(safe-area-inset-bottom))`) dan
`font-medium` di active state pada PR ini, tapi bottom nav bawaan
`dashboard/layout.js:528` (yang sekarang strukturnya nyaris identik) tidak
disentuh — masih `pb-2` statis tanpa `env(safe-area-inset-bottom)`, dan
active state tanpa `font-medium`. Judul PR-nya "shell parity", tapi dua
bottom nav yang seharusnya jadi kembar malah beda gaya dan beda penanganan
safe-area setelah PR ini.

**Fix**: terapkan class yang sama ke bottom nav dashboard.

### 7. Tombol "Menu" baru di `MobileTabBar` tidak punya `aria-expanded`

`MobileTabBar.js:86` cuma punya `aria-label`, sedangkan hamburger `Navbar.js`
yang membuka drawer yang sama sudah benar pakai `aria-expanded={isMobileMenuOpen}`

- `aria-controls`. Screen reader tidak akan mendengar status buka/tutup dari
  tombol baru ini.

**Fix**: tambahkan `aria-expanded={menuOpen}` (dan idealnya `aria-haspopup='dialog'`)
supaya konsisten dengan trigger Navbar untuk komponen yang sama.

## Temuan — P2 (kecil, boleh dibiarkan atau dibereskan sambil lewat)

### 8. Dead code: guard `!== "/dashboard"` di `MobileMenuDrawer.js:70`

Tidak ada href dari `getNavGroups()` yang persis `"/dashboard"` atau `"/"`,
jadi klausa itu selalu true dan tidak pernah mengubah hasil. Tidak konsisten
juga dengan `isActive` di sidebar dashboard (`dashboard/layout.js`) yang
cuma punya guard `!== "/"`.

### 9. Link `faraidh` di `navGroups.js:280,292` di-duplikasi manual

Item lain di grup `sidebar.tools` pakai template `${prefix}/xxx` sekali
untuk dua mode; `faraidh` malah ditulis dua kali sebagai literal terpisah
(`/dashboard/faraidh` dan `/faraidh`). Saat ini identik, tapi rawan drift
kalau salah satu diedit tanpa yang lain.

### 10. Logika `isActive` diimplementasi ulang 3 kali berbeda

`MobileMenuDrawer.js`, `MobileTabBar.js`, dan bottom-nav inline
`dashboard/layout.js` masing-masing punya versi `isActive` yang sedikit
berbeda (guard yang beda-beda). Karena drawer-nya sudah diekstrak jadi
komponen bersama, masuk akal untuk sekalian ekspor satu helper `isActive`
dari `navGroups.js` dan dipakai di ketiganya.

## Perbaikan

Semua 10 temuan (P0-P2) diperbaiki di 3 commit susulan di branch yang sama,
masing-masing diverifikasi ulang lewat workflow review independen (baca
kode asli, bukan percaya niat commit message) sebelum lanjut ke ronde
berikutnya:

- `cbca370` — fix breakpoint dead-zone (unify ke `lg` untuk shell publik),
  restore language switcher + quick-access akun (termasuk admin/logout) di
  drawer publik, satu shared state (`PublicMobileMenuProvider`) supaya
  cuma satu instance drawer yang mount, `aria-expanded` di tombol Menu
  baru, tambah 5 route yang hilang ke `navGroups.js`, parity styling
  bottom-nav dashboard, dan `isNavLinkActive()` helper bersama (hapus dead
  code + duplikasi `faraidh`).
- `699f0d0` — ronde verifikasi pertama menemukan 4 regresi baru dari fix di
  atas: state drawer publik bisa "nyangkut" terbuka lintas navigasi ke
  `/dashboard`/`/admin`/`/auth` karena provider-nya tidak pernah unmount
  tapi effect penutupnya ada di komponen yang unmount (`PublicMobileMenuProvider`
  sekarang yang reset state, bukan `Navbar`); `isNavLinkActive()` salah
  nyalain "Asmaul Husna" bersamaan dengan anaknya (`/asmaul-husna/flashcard`,
  `/asmaul-husna/wirid`) karena prefix-match naif — ditambah opsi `exact`;
  dan 2 gap aksesibilitas di tombol bahasa baru (nama aksesibel cuma kode
  mentah, heading tidak terhubung ARIA ke grup tombol).
- `8bb468b` — ronde verifikasi kedua menemukan 1 sisa: `aria-label="Indonesia"`
  di tombol "ID" melanggar WCAG 2.5.3 (nama aksesibel tidak memuat teks
  yang terlihat) — diperbaiki jadi `"ID (Indonesia)"`.

Setiap commit lolos `eslint` bersih, full `jest` suite (533 test), dan
`next build --webpack` (393 route) sebelum lanjut. `--webpack` dipakai
karena Turbopack panic di worktree ini akibat symlink `node_modules` ke
luar filesystem root — bukan masalah dari kode PR ini.

## Rekomendasi

Sudah di-merge ke master (lihat commit log). Tidak ada temuan P0/P1 yang
tersisa setelah 2 ronde verifikasi independen.
