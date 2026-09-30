# Bukti Visual UI/UX — Before/After

Aturan workspace (mengikat, berlaku untuk semua agent dan kontributor):
**setiap perbaikan atau perubahan UI/UX di `apps/mobile` maupun `apps/web` wajib
disertai screenshot _before_ dan _after_.** Ringkasannya ada di
[`AGENTS.md`](../AGENTS.md) dan [`CLAUDE.md`](../CLAUDE.md); dokumen ini memuat
detail, cara mengambil, dan template.

Contoh lengkap yang sudah jadi:
[`media/before-after/2026-09-30-mobile-ui-fixes/`](./media/before-after/2026-09-30-mobile-ui-fixes/README.md).
Perkakas pengambilan ada di [`scripts/before-after/`](../scripts/before-after/).

## Kapan berlaku

| Berlaku                                                                              | Tidak berlaku                        |
| ------------------------------------------------------------------------------------ | ------------------------------------ |
| Layout, teks/label yang tampil, warna/tema, ikon, ukuran, responsif                  | Backend/API tanpa perubahan tampilan |
| Navigasi yang terlihat (header, tombol kembali, tab)                                 | Refactor murni tanpa efek visual     |
| State kosong, loading, error, toast                                                  | Perubahan test atau dokumen saja     |
| Data yang ditampilkan berubah karena bug UI (judul salah, angka salah, daftar salah) | Perubahan konfigurasi/CI/deploy      |

Kalau ragu apakah sebuah perubahan terlihat oleh pengguna, anggap berlaku.

## Aturan

1. **Sepasang, sama persis kondisinya.** _Before_ diambil dari kode lama
   **sebelum mengedit**, _after_ dari kode baru. Layar, state, data, viewport,
   dan tema harus sama supaya bedanya murni dari perubahan kode.
2. **Satu pasang per layar/state yang berubah.** Perubahan di banyak layar berarti
   banyak pasang, bukan satu screenshot gabungan.
3. **Lokasi.** `docs/media/before-after/YYYY-MM-DD-<topik>/` dengan nama
   `NN-<slug>-before.png` dan `NN-<slug>-after.png`. Jangan pakai `screenshots/`
   atau `output/`: keduanya di-gitignore dan bukti akan hilang.
4. **Dokumentasikan.** Tiap folder punya `README.md` (template di bawah): tabel
   ringkasan, satu kalimat tentang apa yang berubah per pasang, commit sebelum
   dan sesudah, lingkungan (API prod atau lokal, viewport, tema). Daftarkan di
   [`INDEX.md`](./INDEX.md).
5. **Rujuk.** Sebut folder bukti di commit message dan di laporan akhir ke user.
6. **Ukuran dan isi.** Sekitar 300 KB atau kurang per file (PNG, skala 2, crop
   bila perlu). Jangan menyertakan token, password, atau email/nomor telepon
   pengguna sungguhan; akun seeder admin lokal boleh. Video tetap di
   `docs/media/*.mp4` (Git LFS), bukan di folder ini.
7. **Kalau tidak bisa diambil** (butuh perangkat fisik, izin OS, backend tidak
   tersedia), tulis alasannya di README folder dan di laporan akhir, lalu ambil
   bukti terdekat (Expo web export atau emulator) atau kutip keluaran teks yang
   membuktikan perubahan. Jangan melewatkannya diam-diam.
8. **Konvensi yang sudah ada tetap berlaku:** layar dashboard/bervariasi (Beranda
   dan sejenisnya) di-scroll-capture penuh; daftar homogen berulang (114 surah)
   cukup satu viewport.
9. **Jalankan terlihat, jangan sembunyi di background.** User ingin ikut melihat
   Expo, emulator, dan browser yang dipakai.
    - Browser Playwright dibuka dengan jendela (`headless: false`; di skrip
      contoh `HEADED=1`).
    - Server dev dijalankan di dalam satu perintah foreground yang berhenti
      sendiri (`scripts/before-after/run-with-expo.sh`), bukan `nohup`, `&`, atau
      background task.
    - Emulator dibuka dengan jendela, tanpa `-no-window`.
    - Hentikan hanya yang kamu jalankan sendiri. Server, emulator, dan browser
      milik sesi lain jangan disentuh.
    - Sebelum melapor, pastikan tidak ada yang tertinggal
      (`lsof -iTCP:19010-19012 -sTCP:LISTEN` harus kosong), dan beri user
      perintah persisnya kalau mereka mau menjalankannya sendiri (lihat
      "Supaya user bisa melihat langsung").

## Cara mengambil

### Mobile (`apps/mobile`)

Pola yang dipakai contoh: satu skrip Playwright dijalankan dua kali
(`LABEL=before` lalu `LABEL=after`) terhadap dua revisi kode yang berjalan di
port berbeda.

```bash
scripts/before-after/export-revision.sh <sha-sebelum> /tmp/ba-before
scripts/before-after/export-revision.sh <sha-sesudah> /tmp/ba-after

HEADED=1 PORT=19011 LABEL=before \
    scripts/before-after/run-with-expo.sh /tmp/ba-before 19011 \
    node docs/media/before-after/<folder>/capture.js

HEADED=1 PORT=19012 LABEL=after \
    scripts/before-after/run-with-expo.sh /tmp/ba-after 19012 \
    node docs/media/before-after/<folder>/capture.js
```

- `export-revision.sh` meng-`git archive` `apps/mobile` pada revisi itu ke folder
  tujuan dan men-symlink `node_modules` dari working tree. Jangan memakai
  `git stash` untuk mendapatkan kode lama (dilarang di repo ini). Skrip
  memperingatkan kalau `package.json` berbeda antara revisi itu dan `HEAD`.
- `run-with-expo.sh` menjalankan `expo start --web`, menunggu dan memanaskan
  bundle, menjalankan perintah yang kamu beri, lalu mematikan servernya, juga
  kalau perintahnya gagal. Ia menolak port yang sudah terpakai (mis. server milik
  sesi lain) dan meneruskan kode keluar perintahmu. `CI=1` mematikan file
  watcher, jadi restart setelah mengubah kode. `EXPO_OFFLINE=1` diperlukan di
  salinan hasil ekspor karena validasi dependensi Expo gagal dengan
  `TypeError: fetch failed` di sana.
- _Before_ diambil dari revisi sebelum perubahanmu. Untuk _after_, ekspor
  `HEAD` setelah perubahanmu di-commit supaya tidak tercampur perubahan
  belum-commit milik sesi lain; folder bukti di-commit sesudahnya dan README-nya
  menyebut SHA commit kodenya. Kalau working tree hanya berisi perubahanmu,
  boleh juga menjalankan `apps/mobile` langsung.
- Salin [`capture.js`](./media/before-after/2026-09-30-mobile-ui-fixes/capture.js)
  ke folder baru sebagai titik awal dan ganti skenarionya. Isinya sudah
  menangani proxy API lokal, penambal login, pembuatan dan pembersihan data uji
  lewat API, kondisi tunggu berbasis elemen, dan gambar gagal yang ditaruh di
  luar repo. Path `require` Playwright-nya mengandaikan folder
  `docs/media/before-after/<folder>/`.
- **Data:** API produksi untuk konten publik; untuk data personal atau daftar
  kosong pakai API lokal (`localhost:29900`, proxy di skrip contoh). Database
  lokal bisa bolong, jadi pastikan layar yang dipotret memang berisi data.
- **Login:** export web tidak bisa menyimpan sesi karena `expo-secure-store`
  tidak ada di web. Pakai penambal khusus pengambilan gambar seperti di
  [`scripts/demo-recording/README.md`](../scripts/demo-recording/README.md);
  jangan melonggarkan pengecekan di kode aplikasi.
- **Device/emulator** untuk perilaku native: build APK native sesuai "Mobile APK
  Build Rule" di `AGENTS.md`, jalankan emulator dengan jendela, lalu
  `adb exec-out screencap -p > file.png`. Emulator yang sudah menyala dan bukan
  milikmu jangan dikendalikan.
- Chromium perlu `--disable-web-security` karena CORS API produksi tidak
  mengizinkan `localhost`; `capture.js` sudah memasangnya.

### Web (`apps/web`)

Playwright dari `apps/web/node_modules/playwright`. Jalankan `next dev` di port
bebas hanya selama pengambilan dan matikan setelahnya; jangan tinggalkan
berjalan.

```js
const { chromium, devices } = require("./apps/web/node_modules/playwright");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
    ...devices["iPhone 15 Pro Max"],
    deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto("http://localhost:3000/kajian", { waitUntil: "networkidle" });
await page.screenshot({
    path: "docs/media/before-after/2026-10-01-topik/01-kajian-before.png",
});
```

Ambil juga viewport desktop (mis. 1440x900) bila perubahan memengaruhinya.
_Before_ web diambil dengan cara yang sama dari `git archive` revisi lama
(`apps/web`) di port lain.

### Supaya hasilnya sebanding

- Tunggu state stabil sebelum memotret (data termuat, animasi selesai), dengan
  menunggu elemen yang ditunggu, bukan `waitForTimeout` saja.
- Pakai skenario langkah yang sama persis untuk _before_ dan _after_, sebaiknya
  satu skrip yang dijalankan dua kali (`LABEL=before` / `LABEL=after`).
- Bersihkan data uji yang dibuat lewat API setelah selesai.
- Periksa hasilnya dengan mata: gambar spinner, layar salah, atau login gagal
  bukan bukti.
- Opsional, sandingkan: `ffmpeg -i a-before.png -i a-after.png -filter_complex hstack=inputs=2 a-pair.png`.

### Supaya user bisa melihat langsung

Kalau user ingin ikut melihat aplikasinya, beri perintah ini untuk dijalankan di
terminal mereka sendiri, jangan menyalakannya di background:

```bash
make web-dev
cd apps/mobile && npx expo start --web
emulator -avd <nama-avd>
```

`emulator -list-avds` menampilkan nama AVD yang tersedia.

## Template README folder bukti

```markdown
# <Topik> — bukti before/after

- **Sebelum:** `<sha>` (<judul commit>)
- **Sesudah:** `<sha>` (<judul commit>)
- **Lingkungan:** <API prod/lokal>, viewport 430x739 @2x, tema terang
- **Cara mengambil ulang:** <perintah / skrip>

| #   | Layar   | Yang diperbaiki | Commit  |
| --- | ------- | --------------- | ------- |
| 01  | <layar> | <ringkas>       | `<sha>` |

## 01 — <layar>

<satu kalimat: apa yang salah sebelumnya, apa yang benar sekarang>

| Before                                         | After                                         |
| ---------------------------------------------- | --------------------------------------------- |
| <img src="01-<slug>-before.png" width="320" /> | <img src="01-<slug>-after.png" width="320" /> |
```

## Checklist selesai

- [ ] _Before_ diambil sebelum mengedit kode (atau dari ekspor kode lama).
- [ ] _After_ diambil dengan langkah, data, viewport, dan tema yang sama.
- [ ] Sepasang per layar/state yang berubah, di `docs/media/before-after/...`.
- [ ] Semua gambar dilihat langsung dan memang menunjukkan perubahan.
- [ ] `README.md` folder berisi tabel, commit sebelum/sesudah, lingkungan.
- [ ] Terdaftar di `docs/INDEX.md`.
- [ ] Commit message dan laporan akhir menyebut folder bukti.
- [ ] Tidak ada server, emulator, atau browser milikmu yang tertinggal berjalan.
