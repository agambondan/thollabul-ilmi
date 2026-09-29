const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function render() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  // 512x512 App Icon
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'icon.html'), { waitUntil: 'networkidle0' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.resolve(__dirname, '../assets/icon-512.png'),
    omitBackground: false,
    type: 'png'
  });
  console.log('✓ Generated icon-512.png');

  // 1024x500 Feature Graphic
  await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  const featureHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1024px; height: 500px; overflow: hidden;
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .container {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: space-between;
      padding: 40px 60px;
      position: relative;
    }
    .pattern {
      position: absolute; inset: 0;
      opacity: 0.1;
      background-image: radial-gradient(circle at 50% 50%, #fbbf24 1px, transparent 1px);
      background-size: 30px 30px;
    }
    .left { flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; max-width: 580px; }
    .right { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
    h1 { color: #fff; font-size: 48px; font-weight: 800; line-height: 1.15; letter-spacing: -1px; text-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    h1 span { color: #fbbf24; }
    .tagline { color: rgba(255,255,255,0.92); font-size: 22px; font-weight: 400; margin-top: 8px; max-width: 480px; }
    .badges { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
    .badge { background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: 1px solid rgba(251,191,36,0.4); color: #fff; padding: 10px 20px; border-radius: 24px; font-size: 14px; font-weight: 500; }
    .book-svg { width: 280px; height: 280px; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4)); }
  </style>
</head>
<body>
  <div class="container">
    <div class="pattern"></div>
    <div class="left">
      <h1>Thullaabul<span> Ilmi</span></h1>
      <p class="tagline">Al-Qur'an · Hadith · Ibadah · Belajar<br>Satu aplikasi untuk pencarian ilmu</p>
      <div class="badges">
        <span class="badge">📖 Al-Qur'an Lengkap</span>
        <span class="badge">📚 Hadith Shahih</span>
        <span class="badge">🕌 Jadwal Sholat</span>
        <span class="badge">🎯 Khatam Tracker</span>
      </div>
    </div>
    <div class="right">
      <svg class="book-svg" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.2" stroke="#FBBF24" stroke-width="1.5" fill="none">
          <circle cx="96" cy="96" r="84"/>
          <circle cx="96" cy="96" r="66"/>
          <path d="M96 12 L96 180 M12 96 L180 96 M36 36 L156 156 M156 36 L36 156"/>
        </g>
        <g transform="translate(96 100) scale(0.92)">
          <ellipse cx="0" cy="38" rx="46" ry="6" fill="#000" opacity="0.35"/>
          <path d="M-40 -24 C-40 -24 -18 -34 0 -34 C18 -34 40 -24 40 -24 L40 28 C40 28 18 18 0 18 C-18 18 -40 28 -40 28 Z" fill="#FFFFFF"/>
          <line x1="0" y1="-34" x2="0" y2="18" stroke="#065f46" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M-30 -16 C-24 -18 -14 -19 -3 -18.5" stroke="#065f46" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
          <path d="M-30 -6 C-24 -8 -14 -9 -3 -8.5" stroke="#065f46" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
          <path d="M-30 4 C-24 2 -14 1 -3 1.5" stroke="#065f46" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
          <path d="M30 -16 C24 -18 14 -19 3 -18.5" stroke="#065f46" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
          <path d="M30 -6 C24 -8 14 -9 3 -8.5" stroke="#065f46" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
          <path d="M30 4 C24 2 14 1 3 1.5" stroke="#065f46" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
          <rect x="-7" y="18" width="14" height="20" rx="2" fill="#FBBF24"/>
          <polygon points="-7,38 0,31 7,38" fill="#065f46" opacity="0.5"/>
          <g transform="translate(0 -48) scale(1.3)" fill="#FBBF24">
            <polygon points="0,-10 2.5,-3 10,-3 4,1.5 6,9 0,4.5 -6,9 -4,1.5 -10,-3 -2.5,-3"/>
          </g>
        </g>
      </svg>
    </div>
  </div>
</body>
</html>
  `;
  await page.setContent(featureHtml, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.resolve(__dirname, '../assets/feature-graphic-1024x500.png'),
    omitBackground: false,
    type: 'png'
  });
  console.log('✓ Generated feature-graphic-1024x500.png');

  await browser.close();
}

render().catch(console.error);