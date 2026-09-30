const fs = require("fs");
const path = require("path");
const { chromium, devices } = require(
    path.join(__dirname, "../../apps/web/node_modules/playwright"),
);

const BASE = process.env.DEMO_MOBILE_APP_URL || "http://localhost:19010";
const OUT_DIR = path.join(__dirname, "output", "mobile-app");
const DEVICE = devices["iPhone 15 Pro Max"];
const LOGIN_IDENTIFIER = process.env.DEMO_LOGIN_IDENTIFIER;
const LOGIN_PASSWORD = process.env.DEMO_LOGIN_PASSWORD;
const LOGIN_MODE = Boolean(LOGIN_IDENTIFIER && LOGIN_PASSWORD);
const DEMO_SURAH = 18;
const DEMO_AYAH = 9;

if (Boolean(LOGIN_IDENTIFIER) !== Boolean(LOGIN_PASSWORD)) {
    console.error(
        "Isi DEMO_LOGIN_IDENTIFIER dan DEMO_LOGIN_PASSWORD bersamaan, " +
            "atau kosongkan keduanya untuk tur tamu.",
    );
    process.exit(1);
}

const SECURE_STORE_MODULE =
    'node_modules/expo-secure-store/build/ExpoSecureStore.web.js"';
const SECURE_STORE_STUB = "var _default = {};";
const SECURE_STORE_SHIM = `var _default = {
    getValueWithKeyAsync: async function (key) {
        return window.localStorage.getItem("demo-secure-store:" + key);
    },
    setValueWithKeyAsync: async function (value, key) {
        window.localStorage.setItem("demo-secure-store:" + key, value);
    },
    deleteValueWithKeyAsync: async function (key) {
        window.localStorage.removeItem("demo-secure-store:" + key);
    },
};`;

const injectCursor = (context) =>
    context.addInitScript(() => {
        const cursor = document.createElement("div");
        cursor.id = "__demo_cursor__";
        Object.assign(cursor.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.55)",
            border: "2px solid rgba(6, 95, 70, 0.9)",
            boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.15)",
            pointerEvents: "none",
            zIndex: "2147483647",
            opacity: "0",
            transform: "translate(-50%, -50%)",
            transition:
                "transform 90ms ease-out, opacity 150ms linear, background 90ms linear",
        });
        const mount = () => document.documentElement.appendChild(cursor);
        if (document.documentElement) mount();
        else document.addEventListener("DOMContentLoaded", mount);
        document.addEventListener(
            "mousemove",
            (e) => {
                if (e.clientX === 0 && e.clientY === 0) return;
                cursor.style.opacity = "1";
                cursor.style.left = e.clientX + "px";
                cursor.style.top = e.clientY + "px";
            },
            { capture: true, passive: true },
        );
        document.addEventListener(
            "mousedown",
            () => {
                cursor.style.transform = "translate(-50%, -50%) scale(0.65)";
                cursor.style.background = "rgba(16, 185, 129, 0.9)";
            },
            { capture: true },
        );
        document.addEventListener(
            "mouseup",
            () => {
                cursor.style.transform = "translate(-50%, -50%) scale(1)";
                cursor.style.background = "rgba(16, 185, 129, 0.55)";
            },
            { capture: true },
        );
    });

async function showCaption(page, text, holdMs = 1800) {
    await page
        .evaluate(
            ({ text, holdMs }) => {
                const prev = document.getElementById("__demo_caption__");
                if (prev) prev.remove();
                const el = document.createElement("div");
                el.id = "__demo_caption__";
                el.textContent = text;
                Object.assign(el.style, {
                    position: "fixed",
                    left: "50%",
                    bottom: "84px",
                    transform: "translate(-50%, 10px)",
                    background: "rgba(6, 78, 59, 0.94)",
                    color: "#fff",
                    padding: "9px 18px",
                    borderRadius: "999px",
                    fontSize: "13px",
                    fontWeight: "600",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.28)",
                    zIndex: "2147483647",
                    pointerEvents: "none",
                    opacity: "0",
                    whiteSpace: "nowrap",
                    transition: "opacity 260ms ease, transform 260ms ease",
                });
                document.documentElement.appendChild(el);
                requestAnimationFrame(() => {
                    el.style.opacity = "1";
                    el.style.transform = "translate(-50%, 0)";
                });
                setTimeout(() => {
                    el.style.opacity = "0";
                    el.style.transform = "translate(-50%, 10px)";
                    setTimeout(() => el.remove(), 320);
                }, holdMs);
            },
            { text, holdMs },
        )
        .catch(() => {});
}

async function smoothScroll(page, totalPx, steps = 8, pause = 260) {
    await page.mouse.move(215, 520, { steps: 8 });
    const step = totalPx / steps;
    for (let i = 0; i < steps; i++) {
        await page.mouse.wheel(0, step);
        await page.waitForTimeout(pause);
    }
}

const tabBtn = (page, name) =>
    page.getByRole("tab", { name, exact: true }).first();

const shown = (page, text) =>
    page.getByText(text, { exact: true }).filter({ visible: true }).first();

const backBtn = (page) =>
    page
        .getByLabel("Kembali", { exact: true })
        .filter({ visible: true })
        .first();

const closeSheetBtn = (page) =>
    page.getByLabel("Tutup", { exact: true }).filter({ visible: true }).last();

async function tapOn(page, locator, settle = 900) {
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const box = await locator.boundingBox();
    if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
            steps: 14,
        });
    }
    await locator.click();
    await page.waitForTimeout(settle);
}

async function ensureHealthy(page, label) {
    if ((await page.getByText("Terjadi Kesalahan").count()) > 0) {
        throw new Error(`Layar error muncul setelah: ${label}`);
    }
}

async function backUntil(page, isAtTarget, maxTaps = 4) {
    for (let i = 0; i < maxTaps; i++) {
        if (await isAtTarget()) return;
        await tapOn(page, backBtn(page), 1000);
    }
    if (!(await isAtTarget())) throw new Error("Gagal kembali ke layar awal");
}

function withWebSecureStore(code) {
    const moduleAt = code.indexOf(SECURE_STORE_MODULE);
    if (moduleAt < 0) return null;
    const start = code.lastIndexOf("__d(function", moduleAt);
    const stubAt = code.indexOf(SECURE_STORE_STUB, start);
    if (stubAt < 0 || stubAt > moduleAt) {
        throw new Error(
            "Isi modul ExpoSecureStore.web berubah, sesuaikan SECURE_STORE_STUB",
        );
    }
    return (
        code.slice(0, stubAt) +
        SECURE_STORE_SHIM +
        code.slice(stubAt + SECURE_STORE_STUB.length)
    );
}

async function enableWebSecureStore(context) {
    let patched = 0;
    await context.route("**/index.bundle?*", async (route) => {
        const response = await route.fetch();
        const text = await response.text();
        const output = withWebSecureStore(text) ?? text;
        if (output !== text) patched++;
        await route.fulfill({
            response,
            body: output,
            headers: {
                ...response.headers(),
                "content-length": String(Buffer.byteLength(output)),
            },
        });
    });
    return () => patched;
}

async function resetDemoAyah(apiOrigin) {
    const login = await fetch(`${apiOrigin}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: LOGIN_IDENTIFIER,
            password: LOGIN_PASSWORD,
        }),
    });
    if (!login.ok) {
        throw new Error(
            `Login API ditolak (${login.status}) di ${apiOrigin}. ` +
                "Akun harus ada di API yang dipakai Expo (seeder admin hanya valid di API lokal).",
        );
    }
    const { token } = await login.json();
    const auth = { Authorization: `Bearer ${token}` };
    const asList = (payload) =>
        Array.isArray(payload)
            ? payload
            : (payload.items ?? payload.data ?? []);

    const ayahs = asList(
        await (
            await fetch(
                `${apiOrigin}/api/v1/ayah/surah/number/${DEMO_SURAH}?size=300&page=0`,
            )
        ).json(),
    );
    const ayah = ayahs.find((item) => item.number === DEMO_AYAH);
    if (!ayah)
        throw new Error(`Ayat ${DEMO_SURAH}:${DEMO_AYAH} tidak ditemukan`);

    const bookmarks = asList(
        await (
            await fetch(`${apiOrigin}/api/v1/bookmarks`, { headers: auth })
        ).json(),
    ).filter((item) => item.ref_type === "ayah" && item.ref_id === ayah.id);
    for (const item of bookmarks) {
        await fetch(`${apiOrigin}/api/v1/bookmarks/${item.id}`, {
            method: "DELETE",
            headers: auth,
        });
    }

    const notes = asList(
        await (
            await fetch(
                `${apiOrigin}/api/v1/notes?ref_type=ayah&ref_id=${ayah.id}`,
                { headers: auth },
            )
        ).json(),
    );
    for (const item of notes) {
        await fetch(`${apiOrigin}/api/v1/notes/${item.id}`, {
            method: "DELETE",
            headers: auth,
        });
    }
}

async function loginFlow(page) {
    await tapOn(page, page.getByTestId("mobile-top-header-profile"), 900);
    await showCaption(page, "🔐 Masuk ke akun", 2800);
    await tapOn(
        page,
        page.getByTestId("mobile-account-menu-item-profile"),
        1200,
    );
    await smoothScroll(page, 600, 4, 240);
    await tapOn(page, shown(page, "Masuk / Daftar"), 1200);
    const email = page.getByPlaceholder("Email");
    await tapOn(page, email, 400);
    await email.pressSequentially(LOGIN_IDENTIFIER, { delay: 70 });
    const password = page.getByPlaceholder(/Kata sandi|Password/);
    await tapOn(page, password, 400);
    await password.pressSequentially(LOGIN_PASSWORD, { delay: 70 });
    await page.waitForTimeout(500);
    await tapOn(
        page,
        page.getByRole("button", { name: "Masuk ke akun" }),
        1200,
    );
    await page
        .getByText("Sudah Masuk")
        .first()
        .waitFor({ state: "visible", timeout: 20000 });
    if ((await page.getByText(/SecureStore tidak tersedia/).count()) > 0) {
        throw new Error("Sesi tidak tersimpan: penambal SecureStore gagal");
    }
    await page.waitForTimeout(2400);
}

async function openDemoSurah(page) {
    const search = page.getByPlaceholder("Cari surah...");
    await tapOn(page, search, 500);
    await search.pressSequentially("kahf", { delay: 110 });
    await page.waitForTimeout(2500);
    await tapOn(
        page,
        page
            .getByText(/^Al-Kahf/)
            .filter({ visible: true })
            .first(),
        3200,
    );
    await ensureHealthy(page, "Reader Al-Kahf");
    return search;
}

async function scrollToDemoAyah(page) {
    const detail = page.getByLabel(`Buka detail ayat ${DEMO_AYAH}`, {
        exact: true,
    });
    await page.mouse.move(215, 560, { steps: 6 });
    for (
        let i = 0;
        i < 40 && !(await detail.isVisible().catch(() => false));
        i++
    ) {
        await page.mouse.wheel(0, 360);
        await page.waitForTimeout(220);
    }
    return detail;
}

const atBelajarHub = (page) =>
    page
        .getByText(/^Kajian & Artikel$/i)
        .filter({ visible: true })
        .first()
        .isVisible()
        .catch(() => false);

async function publicTour(page) {
    await showCaption(page, "🏠 Beranda", 2400);
    await page.waitForTimeout(2800);
    await smoothScroll(page, 900, 6, 320);
    await page.waitForTimeout(1000);
    await smoothScroll(page, -900, 4, 200);
    await page.waitForTimeout(600);
    await ensureHealthy(page, "Beranda");

    await tapOn(page, tabBtn(page, "Al-Quran"), 1200);
    await showCaption(page, "📖 Al-Quran", 2200);
    await page.waitForTimeout(1800);
    await smoothScroll(page, 500, 4, 260);
    await page.waitForTimeout(600);
    await smoothScroll(page, -500, 3, 200);
    const surahSearch = await openDemoSurah(page);
    await smoothScroll(page, 420, 3, 300);
    await page.waitForTimeout(800);
    await smoothScroll(page, -420, 3, 200);

    await showCaption(page, "⚙️ Atur tampilan bacaan", 2400);
    await tapOn(page, page.getByLabel("Pengaturan", { exact: true }), 1300);
    await tapOn(page, shown(page, "Indopak"), 1500);
    await tapOn(page, shown(page, "Naskh"), 1500);
    await tapOn(page, shown(page, "Uthmani"), 1200);
    const bigger = page.getByLabel("Perbesar ukuran teks Arab", {
        exact: true,
    });
    const smaller = page.getByLabel("Perkecil ukuran teks Arab", {
        exact: true,
    });
    await tapOn(page, bigger, 700);
    await tapOn(page, bigger, 700);
    await tapOn(page, bigger, 1400);
    await tapOn(page, smaller, 700);
    await tapOn(page, smaller, 700);
    await tapOn(page, smaller, 1000);
    await tapOn(page, closeSheetBtn(page), 1000);
    await ensureHealthy(page, "Pengaturan tampilan");

    await tapOn(page, await scrollToDemoAyah(page), 1800);
    await showCaption(page, "📜 Asbabun Nuzul langsung dari ayat", 2600);
    await tapOn(page, shown(page, "Asbabun"), 4200);
    await ensureHealthy(page, "Asbabun dari detail ayat");
    await tapOn(page, closeSheetBtn(page), 900);
    await backUntil(page, () => surahSearch.isVisible().catch(() => false));

    await tapOn(page, tabBtn(page, "Hadis"), 1200);
    await showCaption(page, "📚 Hadis", 2200);
    await page.waitForTimeout(1600);
    await smoothScroll(page, 700, 4, 300);
    await page.waitForTimeout(700);
    await smoothScroll(page, -1500, 5, 200);
    const hadithSearch = page.getByPlaceholder(/Cari nomor, kitab/);
    await tapOn(page, hadithSearch, 500);
    await hadithSearch.pressSequentially("niat", { delay: 110 });
    await page
        .getByText(/[1-9]\d* hadis ditampilkan dari/)
        .first()
        .waitFor({ state: "visible", timeout: 20000 });
    await page.waitForTimeout(1600);
    await smoothScroll(page, 500, 4, 300);
    await page.waitForTimeout(800);
    await smoothScroll(page, -500, 3, 200);
    await tapOn(
        page,
        page
            .getByText(/^No\. \d+$/i)
            .filter({ visible: true })
            .first(),
        3500,
    );
    await ensureHealthy(page, "Detail hadis");
    await showCaption(
        page,
        "📜 Detail hadis: teks Arab, terjemah & terkait",
        2800,
    );
    await smoothScroll(page, 600, 5, 330);
    await page.waitForTimeout(1600);
    await smoothScroll(page, -1200, 5, 160);
    await backUntil(page, () => hadithSearch.isVisible().catch(() => false));
    await hadithSearch.fill("");
    await page.waitForTimeout(900);

    await tapOn(page, tabBtn(page, "Belajar"), 1200);
    await showCaption(page, "🎓 Belajar", 2200);
    await page.waitForTimeout(1600);
    await smoothScroll(page, 1800, 10, 380);
    await page.waitForTimeout(800);
    await smoothScroll(page, -1800, 6, 160);
    await page.waitForTimeout(500);

    await tapOn(page, shown(page, "Kajian"), 1200);
    await ensureHealthy(page, "Kajian");
    await tapOn(
        page,
        page.getByText("Transkrip").filter({ visible: true }).first(),
        600,
    );
    await showCaption(page, "🔍 Cari langsung di isi kajian", 3000);
    const kajianSearch = page.locator("input:visible").first();
    await tapOn(page, kajianSearch, 500);
    await kajianSearch.pressSequentially("sabar", { delay: 120 });
    await page
        .getByText(/potongan transkrip/)
        .first()
        .waitFor({ state: "visible", timeout: 45000 });
    await page.waitForTimeout(1200);
    await ensureHealthy(page, "Hasil pencarian transkrip");
    await smoothScroll(page, 460, 4, 300);
    await page.waitForTimeout(1800);
    await smoothScroll(page, 520, 4, 300);
    await page.waitForTimeout(1800);
    await backUntil(page, () => atBelajarHub(page));

    await tapOn(page, shown(page, "Asbabun Nuzul"), 2500);
    await showCaption(page, "📜 Asbabun Nuzul", 2400);
    await tapOn(page, shown(page, "Surah 18"), 3500);
    await ensureHealthy(page, "Asbabun Nuzul Surah 18");
    await smoothScroll(page, 760, 5, 330);
    await page.waitForTimeout(1600);
    await smoothScroll(page, -760, 4, 160);
    await backUntil(page, () => atBelajarHub(page));

    await tapOn(page, tabBtn(page, "Ibadah"), 1200);
    await showCaption(page, "🕌 Ibadah", 2200);
    await page.waitForTimeout(1800);
    await smoothScroll(page, 900, 6, 320);
    await page.waitForTimeout(800);
    await smoothScroll(page, -900, 4, 160);
    await tapOn(page, shown(page, "Jadwal Sholat"), 3500);
    await ensureHealthy(page, "Jadwal Sholat");
    await showCaption(page, "🕌 Jadwal sholat & hitung mundur", 2600);
    await page.waitForTimeout(2200);
    await smoothScroll(page, 720, 5, 330);
    await page.waitForTimeout(1800);
    await smoothScroll(page, -720, 4, 160);

    await tapOn(page, tabBtn(page, "Beranda"), 1500);
    await ensureHealthy(page, "Beranda penutup");
    await showCaption(
        page,
        "🌙 Thullaabul 'Ilmi — belajar Islam, di genggaman",
        3200,
    );
    await page.waitForTimeout(3600);
}

async function accountTour(page) {
    await showCaption(page, "🏠 Beranda", 2400);
    await page.waitForTimeout(2600);
    await smoothScroll(page, 600, 4, 300);
    await page.waitForTimeout(800);
    await smoothScroll(page, -600, 3, 200);
    await ensureHealthy(page, "Beranda");

    await loginFlow(page);
    await ensureHealthy(page, "Masuk ke akun");

    await tapOn(page, tabBtn(page, "Al-Quran"), 1200);
    await showCaption(page, "📖 Al-Quran", 2200);
    await page.waitForTimeout(1600);
    const surahSearch = await openDemoSurah(page);

    const detail = await scrollToDemoAyah(page);
    await showCaption(page, "🔖 Simpan ayat ke bookmark", 2400);
    await tapOn(
        page,
        page.getByLabel(`Bookmark ayat ${DEMO_AYAH}`, { exact: true }),
        1600,
    );
    await page
        .getByText(/disimpan ke bookmark/)
        .first()
        .waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(1400);

    await tapOn(page, detail, 1800);
    await showCaption(page, "📝 Catat tadabbur pribadi", 2600);
    await tapOn(page, shown(page, "Catatan"), 1500);
    const note = page.locator("textarea:visible").first();
    await tapOn(page, note, 400);
    await note.pressSequentially(
        "Kisah Ashabul Kahfi: pemuda yang menjaga imannya.",
        { delay: 45 },
    );
    await page.waitForTimeout(700);
    await tapOn(
        page,
        page
            .getByRole("button", { name: /^Simpan catatan/ })
            .filter({ visible: true })
            .first(),
        1200,
    );
    await page
        .getByText("Catatan disimpan.")
        .first()
        .waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(2200);
    await backUntil(page, () => surahSearch.isVisible().catch(() => false));

    await tapOn(page, tabBtn(page, "Belajar"), 1200);
    await showCaption(page, "📊 Progres personal", 2600);
    await tapOn(page, shown(page, "Statistik"), 3200);
    await ensureHealthy(page, "Statistik");
    await page.waitForTimeout(2200);
    await backUntil(page, () => atBelajarHub(page));

    await tapOn(page, tabBtn(page, "Beranda"), 1500);
    await ensureHealthy(page, "Beranda penutup");
    await showCaption(page, "✅ Bookmark & catatan tersimpan di akunmu", 3200);
    await page.waitForTimeout(3600);
}

async function main() {
    const videoName = LOGIN_MODE
        ? "demo-mobile-app-account"
        : "demo-mobile-app";
    const scratchDir = path.join(OUT_DIR, ".recording");
    fs.rmSync(scratchDir, { recursive: true, force: true });
    fs.mkdirSync(scratchDir, { recursive: true });
    const browser = await chromium.launch({
        slowMo: 140,
        args: [
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
        ],
    });
    const context = await browser.newContext({
        ...DEVICE,
        geolocation: { latitude: -6.2088, longitude: 106.8456 },
        permissions: ["geolocation"],
        recordVideo: { dir: scratchDir, size: DEVICE.viewport },
    });
    await injectCursor(context);
    const patchedBundles = LOGIN_MODE
        ? await enableWebSecureStore(context)
        : () => 0;
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 160)));
    const apiRequest = LOGIN_MODE
        ? page.waitForRequest((req) => req.url().includes("/api/v1/"), {
              timeout: 60000,
          })
        : null;
    const startedAt = Date.now();
    let trimSeconds = 0;
    let apiOrigin = null;

    try {
        await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
        await page
            .getByTestId("mobile-bottom-nav")
            .waitFor({ state: "visible", timeout: 60000 });
        if (LOGIN_MODE) {
            if (patchedBundles() === 0) {
                throw new Error(
                    "Bundle Expo tidak memuat ExpoSecureStore.web, penambal tidak terpasang",
                );
            }
            apiOrigin = new URL((await apiRequest).url()).origin;
            await resetDemoAyah(apiOrigin);
        }
        trimSeconds = (Date.now() - startedAt) / 1000 + 0.9;
        await page.waitForTimeout(1200);

        if (LOGIN_MODE) await accountTour(page);
        else await publicTour(page);
    } finally {
        await context.close();
        const video = page.video();
        if (video) {
            const target = path.join(OUT_DIR, `${videoName}.webm`);
            fs.renameSync(await video.path(), target);
            fs.writeFileSync(
                path.join(OUT_DIR, `${videoName}.trim.txt`),
                trimSeconds.toFixed(2),
            );
            console.log(
                "Video:",
                target,
                "| trim:",
                trimSeconds.toFixed(2) + "s",
            );
        }
        fs.rmSync(scratchDir, { recursive: true, force: true });
        await browser.close();
        if (apiOrigin) {
            await resetDemoAyah(apiOrigin).catch((err) =>
                console.warn("Pembersihan data demo gagal:", err.message),
            );
        }
        const relevant = pageErrors.filter((e) => !/findNodeHandle/.test(e));
        if (relevant.length) console.log("Page errors:", relevant);
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
