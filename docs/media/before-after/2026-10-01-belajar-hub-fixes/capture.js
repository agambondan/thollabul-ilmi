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

const tabBtn = (page, name) =>
    page.getByRole("tab", { name, exact: true }).first();
const shown = (page, text) =>
    page.getByText(text, { exact: true }).filter({ visible: true }).first();

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
    await page.waitForTimeout(600);
    const file = path.join(OUT_DIR, `${name}-${LABEL}.png`);
    await page.screenshot({ path: file, clip });
    console.log("ok", path.basename(file));
}

async function openBelajarFeature(page, feature) {
    await tabBtn(page, "Belajar").click();
    await page.waitForTimeout(1200);
    const tile = shown(page, feature);
    await tile.scrollIntoViewIfNeeded();
    await tile.click();
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

    await scenario(browser, "01-amalan-guest-error", async (page) => {
        await openBelajarFeature(page, "Amalan Harian");
        await page.waitForTimeout(3500);
        await snap(page, "01-amalan-guest-error", {
            clip: { x: 0, y: 0, width: 430, height: 560 },
        });
    });

    await scenario(browser, "02-lessons-markdown", async (page) => {
        await openBelajarFeature(page, "Modul & Kelas");
        await page.waitForTimeout(3000);
        await snap(page, "02-lessons-markdown", {
            clip: { x: 0, y: 140, width: 430, height: 599 },
        });
    });

    await scenario(browser, "03-blog-excerpt-markdown", async (page) => {
        await openBelajarFeature(page, "Artikel");
        await page.waitForTimeout(4000);
        await snap(page, "03-blog-excerpt-markdown", {
            clip: { x: 0, y: 0, width: 430, height: 560 },
        });
    });

    await scenario(browser, "04-hamburger-double-highlight", async (page) => {
        await page.getByTestId("mobile-top-header-menu").click();
        await page.waitForTimeout(1800);
        await page.getByTestId("mobile-menu-item-tokoh").click();
        await page.waitForTimeout(2500);
        await page.getByTestId("mobile-top-header-menu").click();
        await page.waitForTimeout(1800);
        await snap(page, "04-hamburger-double-highlight");
    });

    await scenario(browser, "05-global-search-no-highlight", async (page) => {
        await page.getByTestId("mobile-top-header-search").click();
        await page.waitForTimeout(1800);
        await snap(page, "05-global-search-no-highlight");
    });

    await scenario(browser, "06-quiz-question-progress", async (page) => {
        await openBelajarFeature(page, "Quiz Islami");
        await page.waitForTimeout(3000);
        await page.getByTestId("web-app-quiz-option").first().click();
        await page.waitForTimeout(800);
        await page.getByText("Lanjut", { exact: true }).click();
        await page.waitForTimeout(1000);
        await snap(page, "06-quiz-question-progress", {
            clip: { x: 0, y: 0, width: 430, height: 200 },
        });
    });

    await browser.close();
})();
