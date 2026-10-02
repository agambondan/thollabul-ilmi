const { chromium } = require("/home/firman/works/me/thollabul-ilmi/apps/web/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const OUT_DIR = __dirname;
const PORT = process.env.PORT || 19030;

const BASE_URL = `http://localhost:${PORT}`;
const TARGET_PATH = "/library/al-kaba-ir-dosa-dosa-besar";

const PAGE_TEXT = `Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang
Segala puji bagi Allah Tuhan semesta alam, dan tidak ada permusuhan kecuali terhadap orang-orang zalim. Shalawat dan salam atas junjungan kami Muhammad, pemimpin para rasul dan imam orang-orang bertakwa, serta atas keluarga dan sahabatnya semuanya.

Adapun setelahnya, maka ini adalah kitab yang memuat pembahasan ringkasan tentang dosa-dosa besar, hal-hal yang diharamkan, dan larangan-larangan.

DOSA-DOSA BESAR
Dosa-dosa besar adalah apa yang dilarang oleh Allah dan Rasul-Nya dalam Al-Qur'an dan Sunnah serta riwayat dari para salaf yang saleh. Allah Ta'ala telah berjanji dalam kitab-Nya yang mulia bahwa bagi siapa yang menjauhi dosa-dosa besar dan hal-hal yang diharamkan, maka Dia akan menghapus dosa-dosa kecil dari keburukan-keburukannya berdasarkan firman-Nya:
"Jika kamu menjauhi dosa-dosa besar di antara apa yang dilarang kepadamu, niscaya Kami hapus kesalahan-kesalahanmu dan Kami masukkan kamu ke tempat yang mulia." (An-Nisa: 37)
Allah Ta'ala telah menjamin dengan nash ini bahwa barang siapa yang menjauhi dosa-dosa besar, maka Dia akan memasukkannya ke dalam surga.
Allah Ta'ala berfirman:
"Dan orang-orang yang menjauhi dosa-dosa besar dan perbuatan keji, dan apabila mereka marah mereka memberi maaf." (Asy-Syura: 37)
Dan Allah Ta'ala berfirman:
"(Yaitu) mereka yang menjauhi dosa-dosa besar dan perbuatan keji kecuali kesalahan kecil. Sesungguhnya Tuhanmu Maha Luas ampunan-Nya." (An-Najm: 32)`;

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
                            page_number: 7,
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

    const rawBtn = page.getByRole("button", { name: "Teks Asli" });
    if (await rawBtn.count() > 0) {
        await rawBtn.first().click();
        await page.waitForTimeout(800);
        const beforeImg = path.join(OUT_DIR, "01-library-reader-before.png");
        await page.screenshot({
            path: beforeImg,
            fullPage: false,
        });
        console.log(`Saved before: ${beforeImg}`);
    }

    const docBtn = page.getByRole("button", { name: "Dokumen Rapi" });
    if (await docBtn.count() > 0) {
        await docBtn.first().click();
        await page.waitForTimeout(800);
        const afterImg = path.join(OUT_DIR, "01-library-reader-after.png");
        await page.screenshot({
            path: afterImg,
            fullPage: false,
        });
        console.log(`Saved after: ${afterImg}`);
    }

    await browser.close();
}

run().catch((err) => {
    console.error("Screenshot error:", err);
    process.exit(1);
});