const path = require("path");
const os = require("os");
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

async function snapEl(locator, name) {
    await locator.waitFor({ state: "visible", timeout: 15000 });
    await locator.page().waitForTimeout(500);
    const file = path.join(OUT_DIR, `${name}-${LABEL}.png`);
    await locator.screenshot({ path: file });
    console.log("ok", path.basename(file));
}

async function scenario(browser, name, run) {
    if (ONLY.length && !ONLY.some((prefix) => name.startsWith(prefix))) return;
    const { context, page } = await openApp(browser);
    try {
        await run(page);
    } catch (error) {
        console.error(`GAGAL ${name}:`, String(error.message).split("\n")[0]);
        await page
            .screenshot({
                path: path.join(os.tmpdir(), `${name}-GAGAL-${LABEL}.png`),
            })
            .catch(() => {});
    } finally {
        await context.close();
    }
}

async function openAccountMenu(page) {
    await page.getByTestId("mobile-top-header-profile").click();
    await page.waitForTimeout(500);
}

async function goToProfile(page) {
    await openAccountMenu(page);
    await page.getByTestId("mobile-account-menu-item-profile").click();
    await page.waitForTimeout(800);
}

async function goToSettings(page) {
    await goToProfile(page);
    await page
        .getByLabel("Buka pengaturan profil", { exact: true })
        .first()
        .click();
    await page.waitForTimeout(600);
}

async function goToAppearance(page) {
    await goToSettings(page);
    await shown(page, "Tampilan").click();
    await page.waitForTimeout(600);
}

(async () => {
    const browser = await chromium.launch({
        headless: !HEADED,
        slowMo: HEADED ? 70 : 0,
        args: [
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
        ],
    });

    await scenario(browser, "01-about-app-name", async (page) => {
        await goToSettings(page);
        await shown(page, "Tentang Aplikasi").click();
        await page.waitForTimeout(700);
        const heading = page.getByText("Tentang", { exact: true }).first();
        const card = heading.locator("xpath=..");
        await snapEl(card, "01-about-app-name");
    });

    await scenario(browser, "02-theme-light-meta", async (page) => {
        await goToAppearance(page);
        const label = page.getByText("Terang", { exact: true }).first();
        const row = label.locator("xpath=..");
        await snapEl(row, "02-theme-light-meta");
    });

    await scenario(browser, "03-panduan-sholat-chips", async (page) => {
        await goToAppearance(page);
        await shown(page, "Classic").click();
        await page.waitForTimeout(1000);
        await tabBtn(page, "Belajar").click();
        await page.waitForTimeout(1500);
        await shown(page, "Panduan Sholat").click();
        await page.waitForTimeout(4000);
        await snap(page, "03-panduan-sholat-chips");
    });

    await scenario(browser, "04-asmaul-husna-search", async (page) => {
        await goToAppearance(page);
        await shown(page, "Classic").click();
        await page.waitForTimeout(1000);
        await tabBtn(page, "Ibadah").click();
        await page.waitForTimeout(1500);
        await shown(page, "Asmaul Husna").click();
        await page.waitForTimeout(5000);
        await page
            .getByPlaceholder("Cari nama Allah, arti, atau transliterasi...")
            .fill("rahman");
        await page.waitForTimeout(900);
        await snap(page, "04-asmaul-husna-search");
    });

    await browser.close();
})();
