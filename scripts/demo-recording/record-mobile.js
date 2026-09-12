const path = require('path');
// Reuse the Playwright install that already lives under apps/web/ instead of
// requiring a second copy at the repo root or in this scripts/ folder.
const { chromium, devices } = require(
  path.join(__dirname, '../../apps/web/node_modules/playwright'),
);

const BASE = process.env.DEMO_BASE_URL || 'https://thollabulilmi.site';
const OUT_DIR = path.join(__dirname, 'output', 'mobile');
const LOGIN_IDENTIFIER = process.env.DEMO_LOGIN_IDENTIFIER;
const LOGIN_PASSWORD = process.env.DEMO_LOGIN_PASSWORD;
const DEVICE = devices['iPhone 15 Pro Max'];

if (!LOGIN_IDENTIFIER || !LOGIN_PASSWORD) {
  console.error(
    'Set DEMO_LOGIN_IDENTIFIER and DEMO_LOGIN_PASSWORD (a real, already-verified\n' +
      'test account on the target env) before running this script, e.g.:\n' +
      '  DEMO_LOGIN_IDENTIFIER=08xxxxxxxxxx DEMO_LOGIN_PASSWORD=xxxx node scripts/demo-recording/record-mobile.js\n' +
      'See scripts/demo-recording/README.md.',
  );
  process.exit(1);
}

async function dismissPopup(page) {
  for (let i = 0; i < 2; i++) {
    const btn = page.getByRole('button', { name: 'Nanti' });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(400);
    }
    const installClose = page.getByRole('button', { name: 'Tutup' });
    if (await installClose.first().isVisible().catch(() => false)) {
      await installClose.first().click().catch(() => {});
      await page.waitForTimeout(400);
    }
  }
}

// The bookmark button opens a small "Warna/Label" popover (color + note tag
// for the bookmark). It doesn't respond to Escape, and its own close (X)
// button intermittently gets covered by the popover's own content (on
// mobile it can also render partly off-screen), so this tries three
// closing strategies in order.
async function closeBookmarkColorPopover(page) {
  const warnaLabel = page.getByText('Warna', { exact: true });
  let seen = false;
  for (let i = 0; i < 3; i++) {
    if (await warnaLabel.isVisible().catch(() => false)) {
      seen = true;
      break;
    }
    await page.waitForTimeout(300);
  }
  if (!seen) return;

  const closeX = warnaLabel.locator('xpath=following-sibling::button[1]');
  await closeX.click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  if (await warnaLabel.isVisible().catch(() => false)) {
    const popoverSimpan = warnaLabel
      .locator('xpath=ancestor::div[1]')
      .getByRole('button', { name: 'Simpan', exact: true });
    await popoverSimpan.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  if (await warnaLabel.isVisible().catch(() => false)) {
    await page.mouse.click(5, 5).catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function smoothScroll(page, totalPx, steps = 8, pause = 260) {
  const step = totalPx / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollBy(0, y), step);
    await page.waitForTimeout(pause);
  }
}

async function closeAnyModal(page) {
  for (const name of ['Tutup', 'Batal', 'Close']) {
    const b = page.getByRole('button', { name });
    if (await b.first().isVisible().catch(() => false)) {
      await b.first().click().catch(() => {});
      await page.waitForTimeout(500);
      return;
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
}

(async () => {
  const browser = await chromium.launch({ slowMo: 140 });
  const context = await browser.newContext({
    ...DEVICE,
    recordVideo: { dir: OUT_DIR, size: DEVICE.viewport },
  });
  // Without this, the ayah share-image flow's clipboard-copy path fails in
  // headless Chromium (no clipboard permission granted by default) and
  // falls back to a "Clipboard tidak didukung. Gambar diunduh." error
  // instead of the nicer "Gambar tersalin ke clipboard!" success label.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  const scrollToTop = () => page.evaluate(() => window.scrollTo(0, 0));

  // 1. Home
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  await dismissPopup(page);
  await page.waitForTimeout(1200);
  await smoothScroll(page, 900, 6, 260);
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Navbar mobile: hamburger cuma di header (tidak duplikat sebagai slot
  // ke-6 di bottom tab bar). Accessible name-nya datang dari sr-only span
  // di dalam tombol, jadi pakai locator by attribute (getByLabel cuma jalan
  // buat aria-label eksplisit, dan nama tombol berubah saat toggle terbuka
  // sehingga getByRole by name juga tidak stabil untuk klik kedua).
  await dismissPopup(page);
  const hamburgerToggle = page.locator('button[aria-controls="navbar-main"]');
  await hamburgerToggle.click();
  await page.waitForTimeout(1600);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);

  // 2. Masuk pakai akun yang sudah ada (nomor WhatsApp) - tanpa proses daftar.
  await page.goto(BASE + '/auth/login', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await dismissPopup(page);

  await page.getByPlaceholder(/nama@email.com|Email atau Nomor/i).click();
  await page.getByPlaceholder(/nama@email.com|Email atau Nomor/i).pressSequentially(LOGIN_IDENTIFIER, { delay: 90 });
  await page.waitForTimeout(500);
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').pressSequentially(LOGIN_PASSWORD, { delay: 90 });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // 3. Cari - lewat bottom tab bar baru (slot ke-5 sekarang "Cari",
  // menggantikan tombol "Menu" yang sudah pindah ke header).
  if (!/\/$/.test(new URL(page.url()).pathname)) {
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(800);
  }
  await dismissPopup(page);
  await page.waitForTimeout(500);
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('link', { name: 'Cari' })
    .click();
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await dismissPopup(page);
  const searchBox = page.getByPlaceholder('Cari ayah, hadith, atau terjemahan...');
  await searchBox.click();
  await searchBox.pressSequentially('puasa', { delay: 140 });
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2400);
  await smoothScroll(page, 500, 4, 300);
  await page.waitForTimeout(1000);
  const hadithTab = page.getByRole('button', { name: 'Hadith' }).first();
  if (await hadithTab.isVisible().catch(() => false)) {
    await hadithTab.click();
    await page.waitForTimeout(1500);
  }

  // 4. Al-Quran - baca, atur tampilan lewat floating settings, tafsir, bookmark, catatan
  await page.goto(BASE + '/quran/surah/Al-Baqara', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await dismissPopup(page);
  await page.waitForTimeout(1200);
  await smoothScroll(page, 400, 3, 260);
  await page.waitForTimeout(800);

  // Ukuran font ini tersimpan ke akun (bukan cuma localStorage), jadi kalau
  // akun ini pernah dipakai sebelumnya untuk demo yang sama, ukurannya bisa
  // saja masih kecil dari sesi lalu. Reset dulu ke default secara diam-diam
  // (klik cepat di panel lalu tutup lagi) supaya perbandingan besar-vs-kecil
  // di bawah ini benar-benar mulai dari ukuran default, bukan dari sisa
  // percobaan sebelumnya.
  await dismissPopup(page);
  await page.getByTestId('global-setting-button').click();
  await page.waitForTimeout(900);
  await dismissPopup(page);
  await page.locator('text=/^\\d+px$/').first().click();
  await page.waitForTimeout(400);
  await page.getByTestId('global-setting-button').click();
  await page.waitForTimeout(600);

  // Ukuran huruf Arab default (masih di posisi scroll sekarang, beberapa
  // ayat sekaligus kelihatan) - beri jeda di sini supaya nanti kontras jelas
  // dengan tampilan setelah huruf diperkecil (bukan cuma lihat label angka
  // di panel setting, tapi lihat langsung berapa ayat yang muat di layar).
  await dismissPopup(page);
  await page.waitForTimeout(1800);

  await dismissPopup(page);
  await page.getByTestId('global-setting-button').click();
  await page.waitForTimeout(1500);
  await dismissPopup(page);
  // Jenis huruf Arab (Naskh -> kembali ke Kemenag/LPMQ) didemokan dulu
  // sebelum ukurannya diperkecil, supaya perbandingan besar-vs-kecil di
  // akhir memakai jenis huruf yang sama persis (LPMQ), bukan tertimpa
  // pergantian jenis huruf yang bisa membuat perbedaan ukuran kurang jelas
  // (font berbeda punya proporsi visual berbeda di angka px yang sama).
  await page.getByText('Naskh', { exact: false }).first().click();
  await page.waitForTimeout(1500);
  await page.getByText('Kemenag (LPMQ)', { exact: false }).first().click();
  await page.waitForTimeout(1200);

  // Turun terus sampai mentok di ukuran paling kecil (berhenti begitu label
  // px-nya berhenti berubah, jadi tidak tergantung berapa banyak klik yang
  // sebenarnya dibutuhkan).
  const fontMinus = page.getByRole('button', { name: 'Perkecil huruf Arab' });
  const sizeLabel = page.locator('text=/^\\d+px$/').first();
  let lastSize = await sizeLabel.textContent().catch(() => null);
  for (let i = 0; i < 15; i++) {
    await fontMinus.click();
    await page.waitForTimeout(350);
    const cur = await sizeLabel.textContent().catch(() => null);
    if (cur === lastSize) break;
    lastSize = cur;
  }
  await page.waitForTimeout(1000);
  await page.getByTestId('global-setting-button').click();
  await page.waitForTimeout(1000);

  // Posisi scroll sama seperti sebelum panel dibuka - tahan di sini supaya
  // kontrasnya jelas: sekarang lebih banyak ayat yang muat di layar yang sama.
  await page.waitForTimeout(2200);

  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  await page.getByTitle('Tafsir Al-Quran').first().click();
  await page.waitForTimeout(2400);
  await page.getByTitle('Tafsir Al-Quran').first().click();
  await page.waitForTimeout(600);

  // Audio qari - bottom sheet pemutar dengan pilihan qari & kecepatan.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  await page.getByText('Dengar Surah').first().click();
  await page.waitForTimeout(2200);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);

  // Bagikan ayat - modal kustom (WhatsApp/Telegram/dll + generate gambar),
  // bukan share-sheet OS, jadi bisa direkam penuh.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  await page.getByTitle('Bagikan').first().click();
  await page.waitForTimeout(2200);
  const bgThumb = page.locator('text=Pilih Gambar Latar').locator('xpath=following::img[1]');
  await bgThumb.click({ force: true }).catch(() => {});
  // Wait for whatever confirmation/error label the canvas-generation flow
  // ends up showing (canvas build + share/clipboard/download fallback takes
  // a beat) instead of a blind fixed pause. Headless Chromium usually can't
  // use the OS share sheet or Clipboard-image API, so this often lands on
  // the "Clipboard tidak didukung. Gambar diunduh." download fallback
  // rather than "tersalin" - match either so the recording doesn't cut away
  // before whichever label actually renders.
  await page
    .getByText(/tersalin|diunduh|Gagal/i)
    .first()
    .waitFor({ state: 'visible', timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);

  // Bookmark title toggles between "Simpan Bookmark" / "Hapus Bookmark"
  // depending on whether this account already bookmarked the ayah from a
  // previous run - match either so this doesn't go stale.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  await page.getByTitle(/Simpan Bookmark|Hapus Bookmark/).first().click();
  await page.waitForTimeout(1000);
  await closeBookmarkColorPopover(page);
  await page.waitForTimeout(1400);

  // Same idea: "Tulis Catatan" becomes "Edit Catatan" once a note exists.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  await page.getByTitle(/Tulis Catatan|Edit Catatan/).first().click();
  await page.waitForTimeout(1200);
  await page.locator('textarea').first().click();
  await page.waitForTimeout(400);
  await page.locator('textarea').first().fill(
    'Al-Baqarah ayat 1-2: petunjuk bagi orang bertakwa.',
  );
  await page.waitForTimeout(1400);
  // Scoped to the dialog: the bookmark color popover above can also have a
  // "Simpan" button visible at the same time, which is otherwise ambiguous.
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan', exact: true }).click();
  await page.waitForTimeout(1600);
  await closeAnyModal(page);
  await page.waitForTimeout(900);

  // 4b. Asbabun Nuzul - perkenalkan fitur dulu (baca judul + kartu info)
  // sebelum masuk ke pencarian.
  await page.goto(BASE + '/asbabun-nuzul', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await dismissPopup(page);
  await page.waitForTimeout(1800);
  await smoothScroll(page, 400, 3, 280);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);

  // Coba salah satu contoh cepat dulu (cara pertama pakai fitur ini).
  await page.getByRole('button', { name: '18. Al-Kahf' }).click();
  await page.waitForTimeout(2200);
  await smoothScroll(page, 500, 4, 280);
  await page.waitForTimeout(1400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);

  // Lalu tunjukkan search box beneran (cara kedua: ketik nama/nomor surah).
  const asbabunInput = page.getByPlaceholder('Cari nama atau nomor surah...');
  await asbabunInput.click();
  await asbabunInput.pressSequentially('yasin', { delay: 140 });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Yasin/i }).first().click();
  await page.waitForTimeout(2200);
  await smoothScroll(page, 500, 4, 280);
  await page.waitForTimeout(1400);

  // 5. Hadis - jelajah kitab, perkecil font, bookmark
  await page.goto(BASE + '/hadith', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await dismissPopup(page);
  await page.waitForTimeout(1000);
  await page.getByText('Buka', { exact: true }).first().click();
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await dismissPopup(page);
  await page.waitForTimeout(1600);
  await dismissPopup(page);

  // Perkecil font Arab & terjemahan hadis ke ukuran paling kecil (sama
  // seperti di Al-Quran, panel setting ini shared lewat useQuranFont).
  await page.getByTestId('global-setting-button').click();
  await page.waitForTimeout(1200);
  await dismissPopup(page);

  // Sama seperti di Al-Quran, ukuran ini tersimpan ke akun - reset ke
  // default dulu (Arab & terjemahan) supaya kontras besar-kecil di sini
  // juga jelas, bukan sisa ukuran kecil dari bagian Al-Quran barusan.
  const sizeLabelsReset = page.locator('text=/^\\d+px$/');
  await sizeLabelsReset.nth(0).click();
  await page.waitForTimeout(300);
  await sizeLabelsReset.nth(1).click();
  await page.waitForTimeout(800);

  const sizeLabels = page.locator('text=/^\\d+px$/');
  const hadithArabicMinus = page.getByRole('button', {
    name: 'Perkecil huruf Arab',
  });
  let lastArabicSize = await sizeLabels
    .nth(0)
    .textContent()
    .catch(() => null);
  for (let i = 0; i < 15; i++) {
    await hadithArabicMinus.click();
    await page.waitForTimeout(300);
    const cur = await sizeLabels
      .nth(0)
      .textContent()
      .catch(() => null);
    if (cur === lastArabicSize) break;
    lastArabicSize = cur;
  }
  await page.waitForTimeout(500);
  const hadithTranslationMinus = page.getByRole('button', {
    name: 'Perkecil huruf terjemahan',
  });
  let lastTranslationSize = await sizeLabels
    .nth(1)
    .textContent()
    .catch(() => null);
  for (let i = 0; i < 15; i++) {
    await hadithTranslationMinus.click();
    await page.waitForTimeout(300);
    const cur = await sizeLabels
      .nth(1)
      .textContent()
      .catch(() => null);
    if (cur === lastTranslationSize) break;
    lastTranslationSize = cur;
  }
  await page.waitForTimeout(1000);
  await page.getByTestId('global-setting-button').click();
  await page.waitForTimeout(1000);
  await page.waitForTimeout(1600);

  await page.getByTitle(/Simpan Bookmark|Hapus Bookmark/).first().click();
  await page.waitForTimeout(1000);
  await closeBookmarkColorPopover(page);
  await page.waitForTimeout(1400);
  await smoothScroll(page, 600, 4, 300);
  await page.waitForTimeout(1000);

  // 6. Kajian - fitur pencarian lintas video jadi sorotan utama, bukan
  // sekadar putar video di tab "Semua Kajian".
  await page.goto(BASE + '/kajian', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await dismissPopup(page);
  await page.waitForTimeout(1000);
  await smoothScroll(page, 300, 3, 260);
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  await page.getByRole('button', { name: /Cari di Transkrip/ }).click();
  await page.waitForTimeout(1200);
  const kajianBox = page.getByPlaceholder(/Cari tema kajian/);
  await kajianBox.click();
  await kajianBox.pressSequentially('adab menuntut ilmu', { delay: 110 });
  // Hybrid/semantic search takes a while server-side (embedding rerank over
  // thousands of transcripts) - 3-4s is not enough, give it real time.
  await page.waitForTimeout(7000);
  await smoothScroll(page, 600, 5, 280);
  await page.waitForTimeout(1600);

  // Tunjukkan mode pencarian: teks persis vs makna/tema (fitur hybrid search).
  await page.getByRole('button', { name: /Teks Persis/ }).click();
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: /Makna/ }).click();
  await page.waitForTimeout(2200);
  await smoothScroll(page, 400, 4, 260);
  await page.waitForTimeout(1400);

  // Klik salah satu hasil untuk lompat langsung ke momen di video tersebut.
  const playResult = page.getByText('Putar @', { exact: false }).first();
  if (await playResult.isVisible().catch(() => false)) {
    await playResult.click();
    await page.waitForTimeout(2400);

    // Bookmark per-kalimat transkrip (⚪ -> 🔖) di dalam player - beda dari
    // bookmark ayat/hadis: ini disimpan di localStorage, bukan di akun, dan
    // cuma bisa dibuat dari sini, bukan dari tab "🔖 Bookmark" itu sendiri
    // (tab itu cuma menampilkan yang sudah kesimpan). The transcript panel
    // fetches its own data after the player opens, so wait for the button
    // to actually render instead of a fixed 2.4s pause - a quick
    // isVisible() check right after click() can miss it while the
    // transcript list is still loading, silently skipping the whole step.
    const transcriptBookmarkBtn = page.getByTitle(/Tambah bookmark/).first();
    const gotBookmarkBtn = await transcriptBookmarkBtn
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (gotBookmarkBtn) {
      await transcriptBookmarkBtn.click();
      await page.waitForTimeout(1400);
    }

    const catatMomen = page.getByText('+ Catat Momen');
    if (await catatMomen.isVisible().catch(() => false)) {
      await catatMomen.click();
      await page.waitForTimeout(1000);
      await page.locator('textarea').first().click();
      await page.waitForTimeout(400);
      await page.locator('textarea').first().fill(
        'Poin penting: jangan menunda taubat dan hijrah menuju kebaikan.',
      );
      await page.waitForTimeout(1400);
      await page.getByRole('button', { name: 'Simpan Catatan' }).click();
      await page.waitForTimeout(2000);
    }
    await closeAnyModal(page);
    await page.waitForTimeout(900);
  }

  await page.getByRole('button', { name: '📝 Catatan', exact: true }).click();
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: '🔖 Bookmark', exact: true }).click();
  await page.waitForTimeout(1800);
  await smoothScroll(page, 400, 4, 260);
  await page.waitForTimeout(1200);

  // 7. Closing
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await dismissPopup(page);
  await page.waitForTimeout(800);
  await smoothScroll(page, 2600, 14, 260);
  await page.waitForTimeout(2500);

  await context.close();
  await browser.close();
  console.log('DONE mobile video ->', OUT_DIR);
})();
