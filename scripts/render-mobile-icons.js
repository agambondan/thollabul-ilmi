/* eslint-disable */
const path = require("path");
const fs = require("fs");
const ROOT = path.resolve(__dirname, "..");
const { chromium } = require(path.join(ROOT, "apps/web/node_modules/@playwright/test"));
const SVG_PATH = path.join(ROOT, "apps/mobile/assets/icon-source.svg");
const OUT_DIR = path.join(ROOT, "apps/mobile/assets");

const TARGETS = [
  { name: "icon.png", size: 1024, rounded: false },
  { name: "adaptive-icon.png", size: 1024, rounded: false, padding: 0.18 },
  { name: "favicon.png", size: 192, rounded: false },
  { name: "splash-icon.png", size: 1024, rounded: false, padding: 0.22 },
];

function htmlFor(svg, size, padding, rounded) {
  const padPct = padding || 0;
  const inner = size - size * padPct * 2;
  const offset = (size - inner) / 2;
  return `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent;}
    .wrap{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;}
    ${rounded ? `.wrap{border-radius:22%;overflow:hidden;}` : ""}
    .wrap svg{width:${inner}px;height:${inner}px;display:block;transform:translateY(${offset * 0.05}px);}
  </style></head><body><div class="wrap">${svg}</div></body></html>`;
}

(async () => {
  const svg = fs.readFileSync(SVG_PATH, "utf8");
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  for (const t of TARGETS) {
    const html = htmlFor(svg, t.size, t.padding, t.rounded);
    await page.setContent(html, { waitUntil: "networkidle" });
    const wrap = await page.$(".wrap");
    const buf = await wrap.screenshot({ omitBackground: true, type: "png" });
    const out = path.join(OUT_DIR, t.name);
    fs.writeFileSync(out, buf);
    console.log("Wrote", out, "(" + buf.length + " bytes)");
  }

  await browser.close();
})();
