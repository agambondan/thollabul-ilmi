const fs = require("fs");
const path = require("path");
const { chromium, devices } = require(
    path.join(__dirname, "../../apps/web/node_modules/playwright"),
);

const BASE = process.env.DEMO_MOBILE_APP_URL || "http://localhost:19010";
const OUT_DIR = path.join(__dirname, "output", "mobile-app");
const DEVICE = devices["iPhone 15 Pro Max"];

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

async function main() {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
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
        recordVideo: { dir: OUT_DIR, size: DEVICE.viewport },
    });
    await injectCursor(context);
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 160)));
    const startedAt = Date.now();
    let trimSeconds = 0;

    try {
        await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
        await page
            .getByTestId("mobile-bottom-nav")
            .waitFor({ state: "visible", timeout: 60000 });
        trimSeconds = (Date.now() - startedAt) / 1000 + 0.9;
        await page.waitForTimeout(1200);

        // 1. Beranda
        await showCaption(page, "🏠 Beranda", 2400);
        await page.waitForTimeout(2800);
        await smoothScroll(page, 900, 6, 320);
        await page.waitForTimeout(1000);
        await smoothScroll(page, -900, 4, 200);
        await page.waitForTimeout(600);
        await ensureHealthy(page, "Beranda");

        // 2. Al-Quran
        await tapOn(page, tabBtn(page, "Al-Quran"), 1200);
        await showCaption(page, "📖 Al-Quran", 2200);
        await page.waitForTimeout(1800);
        await smoothScroll(page, 500, 4, 260);
        await page.waitForTimeout(600);
        await smoothScroll(page, -500, 3, 200);
        const surahSearch = page.getByPlaceholder("Cari surah...");
        await tapOn(page, surahSearch, 500);
        await surahSearch.pressSequentially("kahf", { delay: 110 });
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

        const ayat9 = page.getByLabel("Buka detail ayat 9", { exact: true });
        await page.mouse.move(215, 560, { steps: 6 });
        for (
            let i = 0;
            i < 40 && !(await ayat9.isVisible().catch(() => false));
            i++
        ) {
            await page.mouse.wheel(0, 360);
            await page.waitForTimeout(220);
        }
        await tapOn(page, ayat9, 1800);
        await showCaption(page, "📜 Asbabun Nuzul langsung dari ayat", 2600);
        await tapOn(page, shown(page, "Asbabun"), 4200);
        await ensureHealthy(page, "Asbabun dari detail ayat");
        await tapOn(page, closeSheetBtn(page), 900);
        await backUntil(page, () => surahSearch.isVisible().catch(() => false));

        // 3. Hadis
        await tapOn(page, tabBtn(page, "Hadis"), 1200);
        await showCaption(page, "📚 Hadis", 2200);
        await page.waitForTimeout(1600);
        await smoothScroll(page, 700, 4, 300);
        await page.waitForTimeout(700);
        await smoothScroll(page, -1500, 5, 200);
        const hadithSearch = page.getByPlaceholder(/Cari nomor, kitab/);
        await tapOn(page, hadithSearch, 500);
        await hadithSearch.pressSequentially("Funerals", { delay: 110 });
        await page
            .getByText(/hadis ditampilkan dari 1 hasil/)
            .first()
            .waitFor({ state: "visible", timeout: 15000 });
        await page.waitForTimeout(1800);
        await tapOn(
            page,
            page
                .getByText(/^Funerals/)
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
        await backUntil(page, () =>
            hadithSearch.isVisible().catch(() => false),
        );
        await hadithSearch.fill("");
        await page.waitForTimeout(900);

        // 4. Belajar
        const atBelajarHub = () =>
            page
                .getByText(/^Kajian & Artikel$/i)
                .filter({ visible: true })
                .first()
                .isVisible()
                .catch(() => false);
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
        await smoothScroll(page, 110, 2, 200);
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
        await backUntil(page, atBelajarHub);

        await tapOn(page, shown(page, "Asbabun Nuzul"), 2500);
        await showCaption(page, "📜 Asbabun Nuzul", 2400);
        await tapOn(page, shown(page, "Surah 18"), 3500);
        await ensureHealthy(page, "Asbabun Nuzul Surah 18");
        await smoothScroll(page, 760, 5, 330);
        await page.waitForTimeout(1600);
        await smoothScroll(page, -760, 4, 160);
        await backUntil(page, atBelajarHub);

        // 5. Ibadah
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

        // 6. Penutup
        await tapOn(page, tabBtn(page, "Beranda"), 1500);
        await ensureHealthy(page, "Beranda penutup");
        await showCaption(
            page,
            "🌙 Thullaabul 'Ilmi — belajar Islam, di genggaman",
            3200,
        );
        await page.waitForTimeout(3600);
    } finally {
        await context.close();
        const video = page.video();
        if (video) {
            const recorded = await video.path();
            const target = path.join(OUT_DIR, "demo-mobile-app.webm");
            fs.renameSync(recorded, target);
            fs.writeFileSync(
                path.join(OUT_DIR, "trim.txt"),
                trimSeconds.toFixed(2),
            );
            console.log(
                "Video:",
                target,
                "| trim:",
                trimSeconds.toFixed(2) + "s",
            );
        }
        await browser.close();
        const relevant = pageErrors.filter((e) => !/findNodeHandle/.test(e));
        if (relevant.length) console.log("Page errors:", relevant);
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
