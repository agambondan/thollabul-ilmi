const path = require('path');
// Reuse the Playwright install that already lives under apps/web/ instead of
// requiring a second copy at the repo root or in this scripts/ folder.
const { chromium } = require(
  path.join(__dirname, '../../apps/web/node_modules/playwright'),
);

const BASE = process.env.DEMO_BASE_URL || 'https://thollabulilmi.site';
const OUT_DIR = path.join(__dirname, 'output', 'desktop');
const LOGIN_IDENTIFIER = process.env.DEMO_LOGIN_IDENTIFIER;
const LOGIN_PASSWORD = process.env.DEMO_LOGIN_PASSWORD;

if (!LOGIN_IDENTIFIER || !LOGIN_PASSWORD) {
  console.error(
    'Set DEMO_LOGIN_IDENTIFIER and DEMO_LOGIN_PASSWORD (a real, already-verified\n' +
      'test account on the target env) before running this script, e.g.:\n' +
      '  DEMO_LOGIN_IDENTIFIER=08xxxxxxxxxx DEMO_LOGIN_PASSWORD=xxxx node scripts/demo-recording/record-desktop.js\n' +
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
  }
}

// The bookmark button opens a small "Warna/Label" popover (color + note tag
// for the bookmark). It doesn't respond to Escape, and its own close (X)
// button intermittently gets covered by the popover's own content while a
// preview re-renders, so this tries three closing strategies in order.
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

async function smoothScroll(page, totalPx, steps = 10, pause = 260) {
  const step = totalPx / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
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

// With the site-wide default action position now "menu" (⋮ "Lainnya"), the
// per-ayah/hadith action row is a single collapsed button instead of
// individually visible icons - every action (Tafsir, Bagikan, Bookmark,
// Catatan) has to be opened through it first. Both AyahPage and HadithPage
// render the panel as the very next sibling <div> after the "Lainnya"
// button (only when open), so scoping through that relationship works on
// either page without depending on page-specific class names.
async function openMoreMenu(page) {
  const trigger = page.getByTitle('Lainnya').first();
  const panel = trigger.locator('xpath=following-sibling::div[1]');
  if (!(await panel.isVisible().catch(() => false))) {
    await trigger.click();
    await panel.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
  return panel;
}

// Bookmark/Catatan don't close the "Lainnya" panel themselves (unlike
// Tafsir/Bagikan, which do) - clean it up explicitly via an outside click.
async function closeMoreMenu(page) {
  await page.mouse.click(5, 5).catch(() => {});
  await page.waitForTimeout(300);
}

// Playwright drives real pointer input (click/hover dispatch real
// mousemove/down/up events) but never paints a visible cursor, so every
// click in a raw recording looks like a jump-cut instead of something being
// clicked. This paints a small dot that rides those real events - injected
// as an init script so it survives every page.goto() in this flow.
const injectCursor = (context) =>
  context.addInitScript(() => {
    const cursor = document.createElement('div');
    cursor.id = '__demo_cursor__';
    Object.assign(cursor.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: 'rgba(16, 185, 129, 0.55)',
      border: '2px solid rgba(6, 95, 70, 0.9)',
      boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.15)',
      pointerEvents: 'none',
      zIndex: '2147483647',
      opacity: '0',
      transform: 'translate(-50%, -50%)',
      transition: 'transform 90ms ease-out, opacity 150ms linear, background 90ms linear',
    });
    const mount = () => document.documentElement.appendChild(cursor);
    if (document.documentElement) mount();
    else document.addEventListener('DOMContentLoaded', mount);
    document.addEventListener(
      'mousemove',
      (e) => {
        cursor.style.opacity = '1';
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      },
      { capture: true, passive: true },
    );
    document.addEventListener(
      'mousedown',
      () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
        cursor.style.background = 'rgba(16, 185, 129, 0.9)';
      },
      { capture: true },
    );
    document.addEventListener(
      'mouseup',
      () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.background = 'rgba(16, 185, 129, 0.55)';
      },
      { capture: true },
    );
  });

// Short lower-third caption announcing the section being demoed next, so a
// viewer who skips around the video (or misses the narration-free flow)
// still knows what feature is on screen. Self-removes after holdMs.
async function showCaption(page, text, holdMs = 1800) {
  await page
    .evaluate(
      ({ text, holdMs }) => {
        const prev = document.getElementById('__demo_caption__');
        if (prev) prev.remove();
        const el = document.createElement('div');
        el.id = '__demo_caption__';
        el.textContent = text;
        Object.assign(el.style, {
          position: 'fixed',
          left: '50%',
          bottom: '36px',
          transform: 'translate(-50%, 10px)',
          background: 'rgba(6, 78, 59, 0.94)',
          color: '#fff',
          padding: '11px 22px',
          borderRadius: '999px',
          fontSize: '16px',
          fontWeight: '600',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)',
          zIndex: '2147483647',
          pointerEvents: 'none',
          opacity: '0',
          whiteSpace: 'nowrap',
          transition: 'opacity 260ms ease, transform 260ms ease',
        });
        document.documentElement.appendChild(el);
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translate(-50%, 0)';
        });
        setTimeout(() => {
          el.style.opacity = '0';
          el.style.transform = 'translate(-50%, 10px)';
          setTimeout(() => el.remove(), 320);
        }, holdMs);
      },
      { text, holdMs },
    )
    .catch(() => {});
}

(async () => {
  const browser = await chromium.launch({ slowMo: 140 });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: OUT_DIR, size: { width: 1600, height: 900 } },
  });
  // Without this, the ayah share-image flow's clipboard-copy path fails in
  // headless Chromium (no clipboard permission granted by default) and
  // falls back to a "Clipboard tidak didukung. Gambar diunduh." error
  // instead of the nicer "Gambar tersalin ke clipboard!" success label.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await injectCursor(context);
  const page = await context.newPage();
  const nav = page.getByRole('navigation').first();
  const scrollToTop = () => page.evaluate(() => window.scrollTo(0, 0));

  // 1. Home
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await showCaption(page, '🏠 Beranda');
  await page.waitForTimeout(2200);
  await dismissPopup(page);
  await page.waitForTimeout(1200);
  await smoothScroll(page, 1200, 8, 280);
  await page.waitForTimeout(1000);
  await page.mouse.wheel(0, -1200);
  await page.waitForTimeout(1000);

  // 2. Masuk pakai akun yang sudah ada (nomor WhatsApp) - tanpa proses daftar.
  await nav.getByRole('link', { name: 'Masuk' }).click();
  await page.waitForLoadState('load');
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

  // 3. Cari - lintas kategori + ganti tab
  await nav.getByRole('link', { name: 'Cari' }).click();
  await page.waitForLoadState('load');
  await showCaption(page, '🔍 Cari Lintas Kategori');
  await page.waitForTimeout(800);
  await dismissPopup(page);
  const searchBox = page.getByPlaceholder('Cari ayah, hadith, atau terjemahan...');
  await searchBox.click();
  await searchBox.pressSequentially('puasa', { delay: 140 });
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2400);
  await smoothScroll(page, 600, 5, 300);
  await page.waitForTimeout(1000);
  for (const tabName of ['Hadith', 'Doa', 'Semua']) {
    const tab = page.getByRole('button', { name: tabName }).first();
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      // Give each result tab real read time before flipping to the next -
      // 1.5s made three tabs in a row read as a blur.
      await page.waitForTimeout(2400);
    }
  }

  // 4. Al-Quran - baca, atur tampilan lewat floating settings, tafsir, bookmark, catatan
  await nav.getByRole('link', { name: 'Al-Quran' }).click();
  await page.waitForLoadState('load');
  await showCaption(page, '📖 Al-Quran');
  await page.waitForTimeout(800);
  await dismissPopup(page);
  await page.waitForTimeout(900);
  await page.getByText('Al-Baqarah', { exact: false }).first().click();
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  await dismissPopup(page);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 500, 4, 260);
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

  // Floating settings button: atur ukuran & jenis font Arab
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

  // Ayah list is a long infinite-scroll; re-anchor to the top before each
  // .first() interaction so it always targets ayah 2:1, not whichever ayah
  // scrolled to the top of the DOM in the meantime.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  let moreMenu = await openMoreMenu(page);
  await moreMenu.getByText('Tafsir Al-Quran', { exact: true }).click();
  await page.waitForTimeout(2400);
  moreMenu = await openMoreMenu(page);
  await moreMenu.getByText('Tafsir Al-Quran', { exact: true }).click();
  await page.waitForTimeout(600);

  // Audio qari - panel pemutar dengan pilihan qari & kecepatan.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  await page.getByText('Dengar Surah').first().click();
  // Long enough to actually notice the qari picker and speed control, not
  // just a flash of the player bar.
  await page.waitForTimeout(4200);
  await page.getByLabel('Tutup pemutar').click({ timeout: 8000 }).catch(() => page.keyboard.press('Escape').catch(() => {}));
  await page.waitForTimeout(800);

  // Bagikan ayat - modal kustom (WhatsApp/Telegram/dll + generate gambar).
  // Escape closes it reliably; the visible "Tutup" (X) button intermittently
  // gets covered by the modal's own content while the canvas re-renders.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  moreMenu = await openMoreMenu(page);
  await moreMenu.getByText('Bagikan', { exact: true }).click();
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
  // previous run — match either so this doesn't go stale.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  moreMenu = await openMoreMenu(page);
  await moreMenu.getByTitle(/Simpan Bookmark|Hapus Bookmark/).click();
  // Hold on the Warna/Label popover long enough to actually register the
  // color swatches and label field before closing it - it was closing
  // almost as soon as it opened.
  await page.waitForTimeout(2400);
  await closeBookmarkColorPopover(page);
  // Bookmark doesn't close the "Lainnya" panel on its own - clean it up
  // before the next action reopens it.
  await closeMoreMenu(page);
  await page.waitForTimeout(1400);

  // Same idea: "Tulis Catatan" becomes "Edit Catatan" once a note exists.
  await scrollToTop();
  await page.waitForTimeout(500);
  await dismissPopup(page);
  moreMenu = await openMoreMenu(page);
  await moreMenu.getByTitle(/Tulis Catatan|Edit Catatan/).click();
  await page.waitForTimeout(1200);
  await page.locator('textarea').first().click();
  await page.waitForTimeout(400);
  // This ayah may already have a note from a previous run (editing, not
  // creating) - clear it first, since pressSequentially() types at the
  // current cursor position rather than replacing content the way fill()
  // does, and would otherwise append after whatever text is already there.
  await page.locator('textarea').first().fill('');
  await page.waitForTimeout(300);
  // pressSequentially (not fill()) so the note visibly types out instead of
  // snapping in all at once - fill() looked like a jump-cut next to every
  // other typed input in this recording.
  await page.locator('textarea').first().pressSequentially(
    'Al-Baqarah ayat 1-2: petunjuk bagi orang bertakwa.',
    { delay: 30 },
  );
  await page.waitForTimeout(1000);
  // Scoped to the dialog: the bookmark color popover above can also have a
  // "Simpan" button visible at the same time, which is otherwise ambiguous.
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan', exact: true }).click();
  await page.waitForTimeout(1600);
  await closeAnyModal(page);
  // Catatan doesn't close the "Lainnya" panel on its own either.
  await closeMoreMenu(page);
  await page.waitForTimeout(900);

  // 4b. Asbabun Nuzul - perkenalkan fitur dulu (baca judul + kartu info)
  // sebelum masuk ke pencarian, supaya jelas apa fungsi halaman ini.
  await nav.getByRole('button', { name: /Konten/i }).click();
  await page.waitForTimeout(800);
  await nav.getByRole('link', { name: 'Asbabun Nuzul', exact: true }).click();
  await showCaption(page, '📜 Asbabun Nuzul');
  await page.waitForTimeout(2200);
  await dismissPopup(page);
  await page.waitForTimeout(1500);
  // Tahan di atas dulu supaya judul + kartu info penjelasan fitur terbaca.
  await page.waitForTimeout(1800);
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(900);

  // Coba salah satu contoh cepat dulu (cara pertama pakai fitur ini).
  await page.getByRole('button', { name: '18. Al-Kahf' }).click();
  await page.waitForTimeout(2200);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(700);

  // Cara kedua: klik langsung ke field pencarian - dropdown-nya langsung
  // menampilkan semua 114 surah (gak perlu ketik apa pun dulu), scroll
  // sampai ketemu satu surah yang bukan bagian dari pil "Contoh cepat" di
  // atas, lalu klik langsung buat menegaskan ini bukan cuma daftar pendek.
  const asbabunInput = page.getByPlaceholder('Cari nama atau nomor surah...');
  await asbabunInput.click();
  await page.waitForTimeout(1200);
  const asbabunDropdown = page.locator('div.absolute.z-20');
  await asbabunDropdown.evaluate((el) =>
    el.scrollTo({ top: 900, behavior: 'smooth' }),
  );
  await page.waitForTimeout(1600);
  await asbabunDropdown.getByRole('button', { name: /Ar-Rahman/ }).click();
  await page.waitForTimeout(2200);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1600);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(700);

  // 5. Hadis - jelajah kitab + bookmark
  await nav.getByRole('link', { name: 'Hadis' }).click();
  await page.waitForLoadState('load');
  await showCaption(page, '📚 Hadis');
  await page.waitForTimeout(800);
  await dismissPopup(page);
  await page.waitForTimeout(1000);
  await page.getByText('Buka', { exact: true }).first().click();
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await dismissPopup(page);
  await page.waitForTimeout(1600);
  await dismissPopup(page);
  moreMenu = await openMoreMenu(page);
  await moreMenu.getByTitle(/Simpan Bookmark|Hapus Bookmark/).click();
  await page.waitForTimeout(2400);
  await closeBookmarkColorPopover(page);
  await closeMoreMenu(page);
  await page.waitForTimeout(1400);
  await smoothScroll(page, 700, 5, 300);
  await page.waitForTimeout(1000);

  // 6. Kajian - fitur pencarian lintas video jadi sorotan utama, bukan
  // sekadar putar video di tab "Semua Kajian".
  await page.goto(BASE + '/kajian', { waitUntil: 'load' });
  await showCaption(page, '🎙️ Kajian');
  await page.waitForTimeout(1200);
  await dismissPopup(page);
  await page.waitForTimeout(1000);
  // Sekilas lihat koleksi kajian dulu (tab default), lalu pindah ke pencarian.
  await smoothScroll(page, 350, 3, 260);
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(600);

  await page.getByRole('button', { name: /Cari di Transkrip/ }).click();
  await page.waitForTimeout(1200);
  const kajianBox = page.getByPlaceholder(/Cari tema kajian/);
  await kajianBox.click();
  await kajianBox.pressSequentially('adab menuntut ilmu', { delay: 110 });
  // Hybrid/semantic search takes a while server-side (embedding rerank over
  // thousands of transcripts) - 3-4s is not enough, give it real time.
  await page.waitForTimeout(7000);
  await smoothScroll(page, 700, 5, 280);
  await page.waitForTimeout(1600);

  // Tunjukkan mode pencarian: teks persis vs makna/tema (fitur hybrid search).
  await page.getByRole('button', { name: /Teks Persis/ }).click();
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: /Makna/ }).click();
  await page.waitForTimeout(2200);
  await smoothScroll(page, 500, 4, 260);
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
      // Same append-not-replace caveat as the ayah note above.
      await page.locator('textarea').first().fill('');
      await page.waitForTimeout(300);
      await page.locator('textarea').first().pressSequentially(
        'Poin penting: jangan menunda taubat dan hijrah menuju kebaikan.',
        { delay: 30 },
      );
      await page.waitForTimeout(1000);
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

  // 7. Closing - end back on the branded hero, not mid-scroll in the footer.
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await dismissPopup(page);
  await page.waitForTimeout(800);
  await smoothScroll(page, 3200, 16, 260);
  await page.waitForTimeout(1200);
  await scrollToTop();
  await showCaption(page, '✨ thollabulilmi.site', 2600);
  await page.waitForTimeout(2800);

  await context.close();
  await browser.close();
  console.log('DONE desktop video ->', OUT_DIR);
})();
