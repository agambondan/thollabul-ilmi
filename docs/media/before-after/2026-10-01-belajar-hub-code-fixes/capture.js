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

async function setEnglish(page) {
    await openAccountMenu(page);
    await page.getByTestId("mobile-account-menu-language-en").click();
    await page.waitForTimeout(400);
    await page.getByTestId("mobile-account-menu-close").click();
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

    await scenario(browser, "01-app-name-header", async (page) => {
        await snap(page, "01-app-name-header");
    });

    await scenario(browser, "02-hadis-book-toggle-id", async (page) => {
        await tabBtn(page, "Hadis").click();
        await page.waitForTimeout(9000);
        await snap(page, "02-hadis-book-toggle-id", {
            clip: { x: 0, y: 0, width: 430, height: 280 },
        });
    });

    await scenario(browser, "03-belajar-hero-english", async (page) => {
        await setEnglish(page);
        await tabBtn(page, "Learn").click();
        await page.waitForTimeout(2500);
        await snap(page, "03-belajar-hero-english");
    });

    await scenario(browser, "04-ibadah-belajar-stuck-state", async (page) => {
        await tabBtn(page, "Ibadah").click();
        await page.waitForTimeout(1500);
        await shown(page, "Doa").click();
        await page.waitForTimeout(3000);
        await tabBtn(page, "Belajar").click();
        await page.waitForTimeout(2000);
        await snap(page, "04-ibadah-belajar-stuck-state");
    });

    await scenario(browser, "05-dark-mode-labels", async (page) => {
        await goToAppearance(page);
        await shown(page, "Gelap").click();
        await page.waitForTimeout(900);
        await snap(page, "05-dark-mode-labels");
    });

    await scenario(browser, "06-classic-dzikir-search-filter", async (page) => {
        await goToAppearance(page);
        await shown(page, "Classic").click();
        await page.waitForTimeout(1000);
        await tabBtn(page, "Ibadah").click();
        await page.waitForTimeout(1500);
        await shown(page, "Dzikir").click();
        await page.waitForTimeout(5000);
        await snap(page, "06-classic-dzikir-search-filter");
    });

    await scenario(browser, "07-global-search-back-button", async (page) => {
        await page.getByTestId("mobile-top-header-search").click();
        await page
            .getByTestId("search-input")
            .waitFor({ state: "visible", timeout: 15000 });
        await page.waitForTimeout(500);
        await snap(page, "07-global-search-back-button");
    });

    await scenario(browser, "08-hamburger-lainnya-highlight", async (page) => {
        await goToSettings(page);
        await page.getByTestId("mobile-top-header-menu").click();
        await page
            .getByTestId("mobile-menu-sheet")
            .waitFor({ state: "visible", timeout: 10000 });
        await page.waitForTimeout(700);
        await snap(page, "08-hamburger-lainnya-highlight");
    });

    await browser.close();
})();
