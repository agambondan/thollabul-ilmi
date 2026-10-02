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
    await page.waitForTimeout(1000);
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

    // 01-beranda
    await scenario(browser, "01-beranda", async (page) => {
        await page.waitForTimeout(2000);
        await snap(page, "01-beranda");
    });

    // 02-ibadah-hub
    await scenario(browser, "02-ibadah-hub", async (page) => {
        await tabBtn(page, "Ibadah").click();
        await page.waitForTimeout(2000);
        await snap(page, "02-ibadah-hub");
    });

    // 03-belajar-hub
    await scenario(browser, "03-belajar-hub", async (page) => {
        await tabBtn(page, "Belajar").click();
        await page.waitForTimeout(2000);
        await snap(page, "03-belajar-hub");
    });

    // 04-profil-hub
    await scenario(browser, "04-profil-hub", async (page) => {
        await goToProfile(page);
        await page.waitForTimeout(2000);
        await snap(page, "04-profil-hub");
    });

    // 05-hadis-hub
    await scenario(browser, "05-hadis-hub", async (page) => {
        await tabBtn(page, "Hadis").click();
        await page.waitForTimeout(2500);
        await snap(page, "05-hadis-hub");
    });

    await browser.close();
})();
