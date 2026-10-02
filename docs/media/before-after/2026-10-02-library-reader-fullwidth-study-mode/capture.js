const { chromium } = require("/home/firman/works/me/thollabul-ilmi/apps/web/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const OUT_DIR = __dirname;
const PORT = process.env.PORT || 19030;

const BASE_URL = `http://localhost:${PORT}`;
const TARGET_PATH = "/library/al-kaba-ir-dosa-dosa-besar";

const PAGE_TEXT = `Maka wajib bagi kita untuk meneliti apa saja dosa-dosa besar itu agar kaum muslimin dapat menjauhinya. Kami mendapati para ulama rahimahullah telah berbeda pendapat mengenainya. Dan yang berkata bahwa dosa besar itu tujuh, dan mereka berdalil dengan sabda Nabi shallallahu 'alaihi wa sallam:
"Jauhilah tujuh perkara yang membinasakan," lalu beliau menyebutkan di antaranya: syirik kepada Allah, sihir, membunuh jiwa yang diharamkan Allah kecuali dengan hak, memakan harta anak yatim, memakan riba, berpaling pada hari perang, dan menuduh zina wanita-wanita baik-baik yang lengah lagi beriman. (Muttafaq 'alaih)

Ibnu Abbas radhiyallahu 'anhuma berkata: "Dosa besar itu lebih dekat kepada tujuh puluh daripada kepada tujuh." Dan benar, demi Allah, ucapan Ibnu Abbas. Adapun hadits tersebut, tidak ada di dalamnya pembatasan dosa-dosa besar.
Yang tepat dan didukung dalil adalah bahwa barang siapa yang melakukan suatu perbuatan yang diancam dengan hukuman had di dunia, atau diancam dengan laknat atau murka Allah di akhirat, maka itu adalah dosa besar.

DOSA BESAR PERTAMA: SYIRIK KEPADA ALLAH
Dosa besar yang paling besar adalah syirik (menyekutukan Allah), yaitu kamu menjadikan tandingan bagi Allah padahal Dia yang telah menciptakanmu.
Allah Ta'ala berfirman:
"Sesungguhnya Allah tidak akan mengampuni dosa syirik, dan Dia mengampuni segala dosa yang selain dari (syirik) itu, bagi siapa yang dikehendaki-Nya." (An-Nisa: 48)

Dan Allah Ta'ala berfirman:
"Sesungguhnya orang yang mempersekutukan (sesuatu dengan) Allah, maka pasti Allah mengharamkan kepadanya surga, dan tempatnya ialah neraka." (Al-Ma'idah: 72)`;

async function run() {
    const browser = await chromium.launch({
        headless: true,
        args: ["--disable-web-security"],
    });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    await page.route("**/api/v1/library/books/*/pages*", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                data: {
                    pages: [
                        {
                            page_number: 8,
                            text: PAGE_TEXT,
                            extraction_method: "pdfplumber",
                            confident: true,
                        },
                    ],
                },
            }),
        });
    });

    await page.goto(`${BASE_URL}${TARGET_PATH}`, {
        waitUntil: "networkidle",
        timeout: 30000,
    });

    await page.waitForTimeout(2000);

    // 1. Split view before
    const rawBtn = page.getByRole("button", { name: "Teks Asli" });
    if (await rawBtn.count() > 0) {
        await rawBtn.first().click();
        await page.waitForTimeout(800);
    }
    const beforeImg = path.join(OUT_DIR, "01-split-view-before.png");
    await page.screenshot({ path: beforeImg, fullPage: false });
    console.log(`Saved before: ${beforeImg}`);

    // 2. Full width raw view after
    const fullWidthBtn = page.getByTitle(/Mode Lebar Penuh/);
    if (await fullWidthBtn.count() > 0) {
        await fullWidthBtn.first().click();
        await page.waitForTimeout(800);
    }
    const afterRawImg = path.join(OUT_DIR, "02-fullwidth-raw-after.png");
    await page.screenshot({ path: afterRawImg, fullPage: false });
    console.log(`Saved after raw: ${afterRawImg}`);

    // 3. Full width sepia paper theme
    const sepiaBtn = page.getByTitle(/Tema Kertas Sepia/);
    if (await sepiaBtn.count() > 0) {
        await sepiaBtn.first().click();
        await page.waitForTimeout(800);
    }
    const afterSepiaImg = path.join(OUT_DIR, "03-fullwidth-sepia-after.png");
    await page.screenshot({ path: afterSepiaImg, fullPage: false });
    console.log(`Saved after sepia: ${afterSepiaImg}`);

    await browser.close();
}

run().catch((err) => {
    console.error("Screenshot error:", err);
    process.exit(1);
});
