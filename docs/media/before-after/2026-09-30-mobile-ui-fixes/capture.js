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
    await page.goto(BASE, { waitUntil: "load", timeout: 180000 });
    await page
        .getByTestId("mobile-bottom-nav")
        .waitFor({ state: "visible", timeout: 120000 });
    await page.waitForTimeout(2500);
    return { context, page };
}

async function snap(page, name, { clip, dir = OUT_DIR } = {}) {
    await page.waitForTimeout(600);
    const file = path.join(dir, `${name}-${LABEL}.png`);
    await page.screenshot({ path: file, clip });
    console.log("ok", path.basename(file));
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

async function loadQuranList(page) {
    await tabBtn(page, "Al-Quran").click();
    await shown(page, "Al-Fatihah").waitFor({ timeout: 90000 });
    await page.waitForTimeout(1000);
}

async function openBelajarFeature(page, feature) {
    await tabBtn(page, "Belajar").click();
    await page.waitForTimeout(1200);
    const tile = shown(page, feature);
    await tile.scrollIntoViewIfNeeded();
    await tile.click();
}

async function scenario(browser, name, options, run) {
    if (ONLY.length && !ONLY.some((prefix) => name.startsWith(prefix))) return;
    const { context, page } = await openApp(browser, options);
    try {
        await run(page);
    } catch (error) {
        console.error(`GAGAL ${name}:`, String(error.message).split("\n")[0]);
        await snap(page, `${name}-GAGAL`, { dir: os.tmpdir() }).catch(() => {});
    } finally {
        await context.close();
    }
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

async function withSavedItems(run) {
    const { token } = await apiCall("POST", "/api/v1/auth/login", {
        email: LOGIN_IDENTIFIER,
        password: LOGIN_PASSWORD,
    });
    const cleanup = async () => {
        for (const item of (await apiCall(
            "GET",
            "/api/v1/bookmarks",
            null,
            token,
        )) || []) {
            await apiCall(
                "DELETE",
                `/api/v1/bookmarks/${item.id}`,
                null,
                token,
            );
        }
        for (const item of (await apiCall(
            "GET",
            "/api/v1/notes",
            null,
            token,
        )) || []) {
            await apiCall("DELETE", `/api/v1/notes/${item.id}`, null, token);
        }
    };
    await cleanup();
    await apiCall(
        "POST",
        "/api/v1/bookmarks",
        { ref_type: "ayah", ref_id: 2149 },
        token,
    );
    await apiCall(
        "POST",
        "/api/v1/bookmarks",
        { ref_type: "hadith", ref_id: 1 },
        token,
    );
    await apiCall(
        "POST",
        "/api/v1/notes",
        {
            ref_type: "ayah",
            ref_id: 2149,
            content: "Kisah Ashabul Kahfi: pemuda yang menjaga imannya.",
        },
        token,
    );
    await apiCall(
        "POST",
        "/api/v1/notes",
        {
            ref_type: "hadith",
            ref_id: 1,
            content: "Catat untuk dibaca ulang setelah Subuh.",
        },
        token,
    );
    try {
        await run();
    } finally {
        await cleanup();
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

    await scenario(
        browser,
        "01-header-kajian-stuck-on-quran",
        {},
        async (page) => {
            await openBelajarFeature(page, "Kajian");
            await page.waitForTimeout(4000);
            await tabBtn(page, "Al-Quran").click();
            await shown(page, "Al-Fatihah")
                .waitFor({ timeout: 12000 })
                .catch(() => {});
            await page.waitForTimeout(3000);
            await snap(page, "01-header-kajian-stuck-on-quran");
        },
    );

    await scenario(
        browser,
        "02-header-asbabun-over-quran-reader",
        {},
        async (page) => {
            await tabBtn(page, "Al-Quran").click();
            await page.getByPlaceholder("Cari surah...").fill("kahf");
            const result = page
                .getByText(/^Al-Kahf/)
                .filter({ visible: true })
                .first();
            await result.waitFor({ timeout: 90000 });
            await result.click();
            await page.waitForTimeout(3500);
            await openBelajarFeature(page, "Asbabun Nuzul");
            await page.waitForTimeout(3000);
            await tabBtn(page, "Al-Quran").click();
            await page.waitForTimeout(4500);
            await snap(page, "02-header-asbabun-over-quran-reader");
        },
    );

    await scenario(browser, "03-hadis-buka-reader", {}, async (page) => {
        await tabBtn(page, "Hadis").click();
        await page.waitForTimeout(9000);
        await page
            .getByText("Buka Reader", { exact: true })
            .filter({ visible: true })
            .first()
            .click();
        await page.waitForTimeout(6000);
        await snap(page, "03-hadis-buka-reader");
    });

    await scenario(browser, "04-kajian-stat-cards", {}, async (page) => {
        await openBelajarFeature(page, "Kajian");
        await page.waitForTimeout(5000);
        await snap(page, "04-kajian-stat-cards", {
            clip: { x: 0, y: 0, width: 430, height: 440 },
        });
    });

    await scenario(
        browser,
        "07-kajian-empty-list",
        { local: true },
        async (page) => {
            await openBelajarFeature(page, "Kajian");
            await page.waitForTimeout(5000);
            await snap(page, "07-kajian-empty-list");
        },
    );

    if (LOGIN_IDENTIFIER && LOGIN_PASSWORD) {
        await withSavedItems(async () => {
            await scenario(
                browser,
                "05-06-saved-lists",
                { local: true, secureStore: true },
                async (page) => {
                    await login(page);
                    await openBelajarFeature(page, "Bookmark");
                    await page.waitForTimeout(4500);
                    await snap(page, "05-bookmark-titles");
                    await page
                        .getByLabel("Kembali", { exact: true })
                        .filter({ visible: true })
                        .first()
                        .click();
                    await page.waitForTimeout(1200);
                    await openBelajarFeature(page, "Catatan");
                    await page.waitForTimeout(4500);
                    await snap(page, "06-catatan-titles");
                },
            );
        });
    } else {
        console.log(
            "Lewati 05/06: DEMO_LOGIN_IDENTIFIER/DEMO_LOGIN_PASSWORD kosong.",
        );
    }

    await browser.close();
})();
