const fs = require("fs");
const path = require("path");
const { chromium, devices } = require(
    path.join(__dirname, "../../../../apps/web/node_modules/playwright"),
);

const PORT = process.env.PORT;
const LABEL = process.env.LABEL;
const OUT_DIR = process.env.OUT_DIR || __dirname;
const ONLY = (process.env.ONLY || "").split(",").filter(Boolean);
const HEADED = process.env.HEADED === "1";

if (!PORT || !["before", "after"].includes(LABEL)) {
    console.error("Set PORT=<expo port> dan LABEL=before|after.");
    process.exit(1);
}

const DEVICE = { ...devices["iPhone 15 Pro Max"], deviceScaleFactor: 2 };
const BASE = `http://localhost:${PORT}`;

async function openApp(browser) {
    const context = await browser.newContext(DEVICE);
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "load", timeout: 180000 });
    await page
        .getByTestId("mobile-bottom-nav")
        .waitFor({ state: "visible", timeout: 120000 });
    await page.waitForTimeout(2500);
    return { context, page };
}

async function snap(page, name, { clip } = {}) {
    await page.waitForTimeout(800);
    const file = path.join(OUT_DIR, `${name}-${LABEL}.png`);
    await page.screenshot({ path: file, clip });
    console.log("ok", path.basename(file));
}

async function scenario(browser, name, run) {
    if (ONLY.length && !ONLY.some((prefix) => name.startsWith(prefix))) return;
    const { context, page } = await openApp(browser);
    try {
        await run(page);
    } catch (error) {
        console.error(`GAGAL ${name}:`, String(error.message).split("\n")[0]);
        await snap(page, `${name}-GAGAL`).catch(() => {});
    } finally {
        await context.close();
    }
}

(async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch({
        headless: !HEADED,
        slowMo: HEADED ? 70 : 0,
        args: [
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
        ],
    });

    await scenario(browser, "01-historical-map-list", async (page) => {
        await page.getByTestId("mobile-top-header-menu").click();
        await page.waitForTimeout(1500);
        await page.getByTestId("mobile-menu-item-historical-map").click();
        await page.waitForTimeout(3000);
        const listToggle = page.getByRole("button", { name: "Daftar" });
        if (await listToggle.isVisible()) {
            await listToggle.click();
        } else {
            const jelajahi = page.getByRole("button", { name: "Jelajahi" });
            if (await jelajahi.isVisible()) await jelajahi.click();
        }
        await page.waitForTimeout(1500);
        await snap(page, "01-historical-map-list", {
            clip: { x: 0, y: 0, width: 430, height: 750 },
        });
    });

    await browser.close();
})();
