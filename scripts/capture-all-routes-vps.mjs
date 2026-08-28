import fs from "node:fs";
import path from "node:path";
import pkg from "/home/firman/works/me/thollabul-ilmi/apps/web/node_modules/playwright/index.js";
const { chromium } = pkg;

const BASE = process.env.BASE || "https://thollabul.jangkauin.site";
const OUT = path.join(process.cwd(), "screenshots");
fs.mkdirSync(OUT, { recursive: true });

// Cari semua route
const appDir = path.join(process.cwd(), "apps/web/src/app");
const files = fs
    .readdirSync(appDir, { recursive: true })
    .filter((f) => f.endsWith("page.js") || f.endsWith("page.jsx"));

let routes = files.map((f) => {
    let r =
        "/" +
        f.replace(/\/page\.(js|jsx)$/, "").replace(/^page\.(js|jsx)$/, "");
    r = r
        .replace(/\[\.\.\.slug\]/g, "Al-Fatihah")
        .replace(/\[slug\]/g, "Al-Fatihah")
        .replace(/\[id\]/g, "1")
        .replace(/\[number\]/g, "1");
    return r;
});

routes = [...new Set(routes)].sort();

const VIEWPORTS = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
];

console.log(`Starting capture from ${BASE}`);
console.log(`Total routes: ${routes.length}`);

// Dapatkan token admin dari live server jika memungkinkan.
// Kredensial dibaca dari env supaya tidak ikut ter-commit:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/capture-all-routes-vps.mjs
let token = null;
try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        throw new Error('ADMIN_EMAIL/ADMIN_PASSWORD belum di-set');
    }
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        }),
    });
    if (res.ok) {
        const data = await res.json();
        token = data.token || data.access_token;
        console.log("Login admin berhasil via API!");
    }
} catch (e) {
    console.log("Gagal login via API (gunakan fallback):", e.message);
}

const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
});

for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Inject localStorage jika punya token
    if (token) {
        await page.addInitScript((tok) => {
            localStorage.setItem("auth_token", tok);
            localStorage.setItem("lang", "ID");
        }, token);
    } else {
        await page.addInitScript(() => {
            localStorage.setItem("lang", "ID");
        });
    }

    for (const r of routes) {
        const safe =
            r === "/" ? "root" : r.replace(/[\[\]\/]/g, "_").replace(/^_+/, "");
        const file = path.join(OUT, `${vp.name}-${safe}.png`);
        try {
            // "domcontentloaded" + jeda tetap memotret halaman sebelum fetch
            // di useEffect selesai, dan itu terbaca sebagai "fitur kosong".
            await page.goto(`${BASE}${r}`, {
                waitUntil: "networkidle",
                timeout: 45000,
            });
            await page.waitForTimeout(1200);
            await page.screenshot({ path: file, fullPage: true });
            console.log(`[${vp.name}] OK: ${r}`);
        } catch (e) {
            console.log(`[${vp.name}] ERR: ${r} - ${e.message.split("\n")[0]}`);
        }
    }
    await context.close();
}

await browser.close();
console.log(`\nSELESAI! Semua screenshot tersimpan di: ${OUT}`);
