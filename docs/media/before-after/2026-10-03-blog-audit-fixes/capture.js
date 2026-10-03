const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium, devices } = require(
    path.join(__dirname, "../../../../apps/web/node_modules/playwright"),
);

const PORT = process.env.PORT;
const LABEL = process.env.LABEL;
const OUT_DIR = process.env.OUT_DIR || __dirname;
const PROD_API = "https://api.thollabulilmi.site";
const LOCAL_API = process.env.LOCAL_API || "http://localhost:29900";
const ONLY = (process.env.ONLY || "").split(",").filter(Boolean);
const HEADED = process.env.HEADED === "1";
const LOGIN_IDENTIFIER = process.env.DEMO_LOGIN_IDENTIFIER;
const LOGIN_PASSWORD = process.env.DEMO_LOGIN_PASSWORD;

if (!PORT || !["before", "after"].includes(LABEL)) {
    console.error("Set PORT=<expo port> dan LABEL=before|after.");
    process.exit(1);
}

const DEVICE = { ...devices["iPhone 15 Pro Max"], deviceScaleFactor: 2 };
const BASE = `http://localhost:${PORT}`;
const SECURE_STORE_MODULE =
    'node_modules/expo-secure-store/build/ExpoSecureStore.web.js"';
const SECURE_STORE_STUB = "var _default = {};";
const SECURE_STORE_SHIM = `var _default = {
    getValueWithKeyAsync: async function (key) {
        return window.localStorage.getItem("ba-secure-store:" + key);
    },
    setValueWithKeyAsync: async function (value, key) {
        window.localStorage.setItem("ba-secure-store:" + key, value);
    },
    deleteValueWithKeyAsync: async function (key) {
        window.localStorage.removeItem("ba-secure-store:" + key);
    },
};`;

const tabBtn = (page, name) =>
    page.getByRole("tab", { name, exact: true }).first();
const shown = (page, text) =>
    page.getByText(text, { exact: true }).filter({ visible: true }).first();

async function proxyToLocal(route) {
    const request = route.request();
    const headers = { ...request.headers() };
    delete headers.host;
    delete headers["content-length"];
    const hasBody = !["GET", "HEAD"].includes(request.method());
    const response = await fetch(request.url().replace(PROD_API, LOCAL_API), {
        method: request.method(),
        headers,
        body: hasBody ? request.postDataBuffer() : undefined,
    });
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
        if (
            ![
                "content-encoding",
                "content-length",
                "transfer-encoding",
            ].includes(key)
        ) {
            responseHeaders[key] = value;
        }
    });
    await route.fulfill({
        status: response.status,
        headers: { ...responseHeaders, "access-control-allow-origin": "*" },
        body: Buffer.from(await response.arrayBuffer()),
    });
}

async function enableWebSecureStore(context) {
    await context.route("**/index.bundle?*", async (route) => {
        const response = await route.fetch();
        const text = await response.text();
        const moduleAt = text.indexOf(SECURE_STORE_MODULE);
        let output = text;
        if (moduleAt >= 0) {
            const start = text.lastIndexOf("__d(function", moduleAt);
            const stubAt = text.indexOf(SECURE_STORE_STUB, start);
            output =
                text.slice(0, stubAt) +
                SECURE_STORE_SHIM +
                text.slice(stubAt + SECURE_STORE_STUB.length);
        }
        await route.fulfill({
            response,
            body: output,
            headers: {
                ...response.headers(),
                "content-length": String(Buffer.byteLength(output)),
            },
        });
    });
}

async function openApp(browser, { local = false, secureStore = false } = {}) {
    const context = await browser.newContext(DEVICE);
    if (local) {
        await context.route(
            (url) => url.href.startsWith(`${PROD_API}/`),
            proxyToLocal,
        );
    }
    if (secureStore) await enableWebSecureStore(context);
    const page = await context.newPage();
    const openedUrls = [];
    await page.exposeFunction("__recordOpenedUrl", (url) => {
        openedUrls.push(url);
    });
    await context.addInitScript(() => {
        const originalOpen = window.open.bind(window);
        window.open = (url, ...rest) => {
            window.__recordOpenedUrl(String(url));
            return originalOpen(url, ...rest);
        };
    });
    await page.goto(BASE, { waitUntil: "load", timeout: 180000 });
    await page
        .getByTestId("mobile-top-header-profile")
        .waitFor({ state: "visible", timeout: 120000 });
    await page.waitForTimeout(2500);
    return { context, page, openedUrls };
}

async function snap(
    page,
    name,
    { clip, dir = OUT_DIR, fullPage = false } = {},
) {
    await page.waitForTimeout(600);
    const file = path.join(dir, `${name}-${LABEL}.png`);
    await page.screenshot({
        path: file,
        clip,
        fullPage: clip ? undefined : fullPage,
    });
    console.log("ok", path.basename(file));
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
        .getByLabel(/Buka pengaturan profil|Open profile settings/)
        .first()
        .click();
    await page.waitForTimeout(600);
}

async function goToAppearance(page) {
    await goToSettings(page);
    await page
        .getByText(/^(Tampilan|Appearance)$/)
        .filter({ visible: true })
        .first()
        .click();
    await page.waitForTimeout(600);
}

async function setClassicLayout(page) {
    await goToAppearance(page);
    await shown(page, "Classic").click();
    await page.waitForTimeout(1000);
}

async function setEnglish(page) {
    await openAccountMenu(page);
    await page.getByTestId("mobile-account-menu-language-en").click();
    await page.waitForTimeout(400);
    await page.getByTestId("mobile-account-menu-close").click();
    await page.waitForTimeout(600);
}

async function login(page) {
    await page.getByTestId("mobile-top-header-profile").click();
    await page.waitForTimeout(700);
    await page.getByTestId("mobile-account-menu-item-profile").click();
    await page.waitForTimeout(1000);
    await page.mouse.move(215, 500);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);
    await shown(page, "Masuk / Daftar").click();
    await page.waitForTimeout(800);
    await page.getByPlaceholder("Email").fill(LOGIN_IDENTIFIER);
    await page.getByPlaceholder(/Kata sandi|Password/).fill(LOGIN_PASSWORD);
    await page.getByRole("button", { name: "Masuk ke akun" }).click();
    await page.getByText("Sudah Masuk").first().waitFor({ timeout: 30000 });
}

async function openBelajarFeature(page, feature, tabLabel = "Belajar") {
    await tabBtn(page, tabLabel).click();
    await page.waitForTimeout(1200);
    const tile = shown(page, feature);
    await tile.scrollIntoViewIfNeeded();
    await tile.click();
}

async function apiCall(method, pathName, body, token) {
    const response = await fetch(`${LOCAL_API}${pathName}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function cleanupArticleNotes(token, refSlug) {
    const notes =
        (await apiCall(
            "GET",
            `/api/v1/notes?ref_type=article&ref_slug=${refSlug}`,
            null,
            token,
        )) || [];
    for (const note of notes) {
        await apiCall("DELETE", `/api/v1/notes/${note.id}`, null, token);
    }
}

async function scenario(browser, name, options, run) {
    if (ONLY.length && !ONLY.some((prefix) => name.startsWith(prefix))) return;
    const { context, page, openedUrls } = await openApp(browser, options);
    try {
        await run(page, openedUrls);
    } catch (error) {
        console.error(`GAGAL ${name}:`, String(error.message).split("\n")[0]);
        await snap(page, `${name}-GAGAL`, { dir: os.tmpdir() }).catch(() => {});
    } finally {
        await context.close();
    }
}

const ARTICLE_TITLE = "Panduan Lengkap Sujud Tilawah";
const ARTICLE_SLUG = "panduan-lengkap-sujud-tilawah";
const HADITH_CITATION_TEXT = "HR. Bukhari no. 1073";

(async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch({
        headless: !HEADED,
        slowMo: HEADED ? 40 : 0,
        args: [
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
        ],
    });

    // 01: Classic Blog list - B7 (markdown stripped from card body)
    await scenario(
        browser,
        "01-classic-blog-list-markdown",
        { local: true },
        async (page) => {
            await setClassicLayout(page);
            await openBelajarFeature(page, "Artikel");
            await page
                .getByText(ARTICLE_TITLE, { exact: false })
                .filter({ visible: true })
                .first()
                .waitFor({ timeout: 30000 });
            await page.waitForTimeout(1000);
            await snap(page, "01-classic-blog-list-markdown");
        },
    );

    // 02: Classic Blog detail - B4 (meta shows author/date, not "published")
    // + Catatan action pill now visible (slug-based note re-enable)
    await scenario(
        browser,
        "02-classic-blog-detail-meta",
        { local: true },
        async (page) => {
            await setClassicLayout(page);
            await openBelajarFeature(page, "Artikel");
            const tile = page
                .getByText(ARTICLE_TITLE, { exact: false })
                .filter({ visible: true })
                .first();
            await tile.waitFor({ timeout: 30000 });
            await tile.click();
            await page.waitForTimeout(1200);
            await snap(page, "02-classic-blog-detail-meta");
        },
    );

    // 03: Tap hadith citation from the Blog article -> B1 (resolves the
    // CORRECT hadith by book-slug + per-book number instead of treating the
    // citation number as a global id)
    await scenario(
        browser,
        "03-hadith-citation-resolves-correctly",
        { local: true },
        async (page) => {
            await setClassicLayout(page);
            await openBelajarFeature(page, "Artikel");
            const tile = page
                .getByText(ARTICLE_TITLE, { exact: false })
                .filter({ visible: true })
                .first();
            await tile.waitFor({ timeout: 30000 });
            await tile.click();
            await page.waitForTimeout(1000);
            const link = page
                .getByText(HADITH_CITATION_TEXT, { exact: false })
                .filter({ visible: true })
                .first();
            await link.scrollIntoViewIfNeeded();
            await link.click();
            await page.waitForTimeout(2500);
            await snap(page, "03-hadith-citation-resolves-correctly");
        },
    );

    // 04: Modern Blog list - B6 (curated excerpt, not the start of the full
    // article body)
    await scenario(
        browser,
        "04-modern-blog-list-excerpt",
        { local: true },
        async (page) => {
            await openBelajarFeature(page, "Artikel");
            await page
                .getByText(ARTICLE_TITLE, { exact: false })
                .filter({ visible: true })
                .first()
                .waitFor({ timeout: 30000 });
            await page.waitForTimeout(1000);
            await snap(page, "04-modern-blog-list-excerpt");
        },
    );

    // 05: Modern Blog card long-press -> action sheet with Bookmark (B3)
    await scenario(
        browser,
        "05-modern-blog-longpress-actionsheet",
        { local: true },
        async (page) => {
            await openBelajarFeature(page, "Artikel");
            const card = page.getByTestId("web-app-blog-card").first();
            await card.waitFor({ timeout: 30000 });
            const box = await card.boundingBox();
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.waitForTimeout(900);
            await page.mouse.up();
            await page.waitForTimeout(1000);
            await snap(page, "05-modern-blog-longpress-actionsheet");
        },
    );

    // 06: Modern Blog detail "Buka sumber" -> actually navigates now (B5)
    await scenario(
        browser,
        "06-modern-blog-open-source",
        { local: true },
        async (page, openedUrls) => {
            await openBelajarFeature(page, "Artikel");
            const tile = page
                .getByText(ARTICLE_TITLE, { exact: false })
                .filter({ visible: true })
                .first();
            await tile.waitFor({ timeout: 30000 });
            await tile.click();
            await page.waitForTimeout(1000);
            const sourceBtn = page
                .getByText(/Buka sumber/i)
                .filter({ visible: true })
                .first();
            await sourceBtn.scrollIntoViewIfNeeded();
            await snap(page, "06-modern-blog-open-source-before-tap");
            await sourceBtn.click();
            await page.waitForTimeout(1200);
            await snap(page, "06-modern-blog-open-source");
            fs.writeFileSync(
                path.join(OUT_DIR, `06-opened-urls-${LABEL}.txt`),
                JSON.stringify(openedUrls, null, 2),
            );
            console.log("opened urls:", openedUrls);
        },
    );

    // 07: Classic detail chrome in English - B8 (Back/Info/Open source/group
    // eyebrow translated) + B10 (English date format)
    await scenario(
        browser,
        "07-classic-english-detail-chrome",
        { local: true },
        async (page) => {
            await setEnglish(page);
            await setClassicLayout(page);
            await openBelajarFeature(page, "Artikel");
            const tile = page
                .getByText(ARTICLE_TITLE, { exact: false })
                .filter({ visible: true })
                .first();
            await tile.waitFor({ timeout: 30000 });
            await tile.click();
            await page.waitForTimeout(1200);
            await snap(page, "07-classic-english-detail-chrome-top");
            await page.mouse.move(215, 500);
            for (let i = 0; i < 6; i += 1) {
                await page.mouse.wheel(0, 1500);
                await page.waitForTimeout(300);
            }
            await page.waitForTimeout(800);
            await snap(page, "07-classic-english-detail-chrome");
        },
    );

    // 08: Modern header + category chips in English - B9
    await scenario(
        browser,
        "08-modern-english-header-category",
        { local: true },
        async (page) => {
            await setEnglish(page);
            await openBelajarFeature(page, "Artikel", "Learn");
            const tile = page
                .getByText(ARTICLE_TITLE, { exact: false })
                .filter({ visible: true })
                .first();
            await tile.waitFor({ timeout: 30000 });
            await page.waitForTimeout(1000);
            await snap(page, "08-modern-english-header-category");
            await tile.click();
            await page.waitForTimeout(1200);
            await snap(page, "08-modern-english-detail-eyebrow-back");
        },
    );

    // 09: Catatan (Notes) now works for Blog articles via slug (requires login)
    if (LOGIN_IDENTIFIER && LOGIN_PASSWORD) {
        const { token } = await apiCall("POST", "/api/v1/auth/login", {
            email: LOGIN_IDENTIFIER,
            password: LOGIN_PASSWORD,
        });
        await cleanupArticleNotes(token, ARTICLE_SLUG);
        try {
            await scenario(
                browser,
                "09-catatan-article-note",
                { local: true, secureStore: true },
                async (page) => {
                    await login(page);
                    await openBelajarFeature(page, "Artikel");
                    const tile = page
                        .getByText(ARTICLE_TITLE, { exact: false })
                        .filter({ visible: true })
                        .first();
                    await tile.waitFor({ timeout: 30000 });
                    await tile.click();
                    await page.waitForTimeout(1200);
                    const catatanPill = page
                        .getByText("Catatan", { exact: true })
                        .filter({ visible: true })
                        .first();
                    await catatanPill.scrollIntoViewIfNeeded();
                    await snap(page, "09a-catatan-pill-visible");
                    await catatanPill.click();
                    await page.waitForTimeout(800);
                    const input = page.getByPlaceholder(
                        "Tulis catatan personal...",
                    );
                    await input.fill(
                        "Dalil sujud tilawah lengkap, cek lagi sebelum khutbah Jumat.",
                    );
                    await page
                        .getByText("Simpan catatan", { exact: true })
                        .click();
                    await page.waitForTimeout(1500);
                    await snap(page, "09b-catatan-note-saved");
                },
            );
        } finally {
            await cleanupArticleNotes(token, ARTICLE_SLUG);
        }
    } else {
        console.log(
            "Lewati 09 (Catatan): DEMO_LOGIN_IDENTIFIER/DEMO_LOGIN_PASSWORD kosong.",
        );
    }

    await browser.close();
})();
