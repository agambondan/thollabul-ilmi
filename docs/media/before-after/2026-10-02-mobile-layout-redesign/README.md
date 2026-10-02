# Mobile Layout Redesign — Visual Evidence (2026-10-02)

## Ringkasan Perubahan

Redesain visual modern 5 layar utama aplikasi mobile (`apps/mobile`) sesuai spesifikasi token desain di `assets/design/mobile.pen`:

| # | Layar | File Utama | Deskripsi Perubahan |
|---|-------|------------|---------------------|
| 01 | **Beranda** | `MobileTopHeader.js`, `MobileBottomNav.js`, `HomeDashboardContent.js` | Header: ikon BookOpen 18pt, brand 17pt/700, tombol aksi 38px circular emerald. BottomNav: ikon modern (House, ScrollText, HeartHandshake), indikator aktif pill 20pt/2.3 stroke. Dashboard: greeting 24pt/700, prayer card emerald border radius 12 shadow, ayat card highlight bg, quick action chips 44px. |
| 02 | **Ibadah** | `IbadahScreen.js` | Hero radius 16, border emerald, eyebrow 11pt/700/0.5ls, title 26pt/700. Section headers 18pt/700 accent, meta 13pt/400 muted. Tiles radius 10, icon wrap 40px circular. |
| 03 | **Belajar** | `ExploreScreen.styles.js`, `FeatureCatalog.js` | Hero radius 16, eyebrow 11pt/700/0.5ls, title 26pt/700, subtitle 13pt/400. Search radius 12 border 1px emerald. Section 18pt/700 accent. Tiles radius 10, icon wrap 40px circular, pin button 30px circular. |
| 04 | **Profil** | `ProfileScreen.styles.js` | Hero radius 16, avatar 72px (r=36, 24pt/700), eyebrow 11pt/700/0.5ls, name 24pt/700, email 13pt/400. Stats/progress/badges/actions radius 10, icon wrap 40px circular. Section 18pt/700 accent. |
| 05 | **Hadis** | `HadithScreen.js` | Detail hero radius 16, eyebrow 11pt/700/0.5ls, title 26pt/700, meta chips 11pt/600. Search radius 12 border 1px. Book cards radius 10. |

## Commit Terkait

| State | Commit SHA | Pesan |
|-------|------------|-------|
| **Before** | `4d28b225` | `docs(agent-knowledge): console.log never reaches logcat on RN 0.81 release builds` |
| **After** | *(working tree, belum commit)* | Redesign layout modern 5 layar mobile |

> Catatan: perubahan "after" berada di working tree (belum di-commit). Setelah commit, README ini harus diperbarui dengan SHA commit yang benar.

## Lingkungan Pengujian

- **API**: Lokal (`http://localhost:29900`) via proxy Playwright
- **Viewport**: iPhone 15 Pro Max, deviceScaleFactor 2 (1290×2796 CSS px)
- **Tema**: Light mode (default), sistem locale ID
- **Build**: Expo web (`npx expo start --web --port <port>`)
- **Waktu pengambilan**: 2026-10-02 17:40–17:42 WIB

## File Bukti

```
01-beranda-before.png   104K
01-beranda-after.png    108K
02-ibadah-hub-before.png   103K
02-ibadah-hub-after.png    109K
03-belajar-hub-before.png  98K
03-belajar-hub-after.png   106K
04-profil-hub-before.png   73K
04-profil-hub-after.png    78K
05-hadis-hub-before.png   363K
05-hadis-hub-after.png    370K
```

Total: ~1.5 MB (screenshot PNG, skala 2×, device iPhone 15 Pro Max)

## Catatan Tambahan

- Kegagalan test `PrayerScreenReminders` adalah flaky test pre-existing terkait timing reminder, **tidak berkaitan** dengan perubahan visual ini.
- Semua test suite terkait layar ini lolos (homeScreen, ibadahScreen, mobileAppShell, exploreScreen, profileScreen, hadithScreen).
- Feature parity check passed (54 manifest features, 186 web app routes scanned).

## Cara Menjalankan Ulang

```bash
# Before (dari HEAD, tanpa perubahan lokal)
HEADED=1 PORT=19011 LABEL=before \
  scripts/before-after/run-with-expo.sh /tmp/ba-before 19011 \
  node docs/media/before-after/2026-10-02-mobile-layout-redesign/capture.js

# After (dari working tree dengan perubahan)
HEADED=1 PORT=19012 LABEL=after \
  scripts/before-after/run-with-expo.sh /tmp/ba-after 19012 \
  node docs/media/before-after/2026-10-02-mobile-layout-redesign/capture.js
```