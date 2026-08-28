import { test, expect } from "@playwright/test";

const basmalah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const alBaqaraAyahs = [
    {
        id: 201,
        number: 1,
        surah_number: 2,
        surah_name: "Al-Baqara",
        translation: {
            ar: "الٓمٓ",
            ar_html: '<tajweed class="madda_necessary">الٓمٓ</tajweed>',
            idn: "Alif laam miim.",
            latin_idn: "Alif laam miim.",
        },
    },
    {
        id: 202,
        number: 2,
        surah_number: 2,
        surah_name: "Al-Baqara",
        translation: {
            ar: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِلْمُتَّقِينَ",
            ar_html:
                'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ <tajweed class="ikhf">هُدًى</tajweed> لِلْمُتَّقِينَ',
            idn: "Kitab (Al Quran) ini tidak ada keraguan padanya; petunjuk bagi mereka yang bertakwa,",
            latin_idn: "",
        },
    },
];

const alBaqaraSurah = {
    ayahs: alBaqaraAyahs,
    name: "البقرة",
    next_surah: {
        number: 3,
        translation: { latin_en: "Ali-Imran" },
    },
    number: 2,
    number_of_ayahs: 286,
    prev_surah: {
        number: 1,
        translation: { latin_en: "Al-Fatihah" },
    },
    revelation_type: "medinan",
    translation: {
        ar: "سُورَةُ البَقَرَة",
        en: "The Cow",
        idn: "Sapi Betina",
        latin_en: "Al-Baqara",
    },
};

const alBaqaraPageAyahs = alBaqaraAyahs;

const audioItemsForAyah = (ayahId) => ({
    items: [
        {
            audio_url: `https://example.test/audio/alafasy-${ayahId}.mp3`,
            qari_name: "Mishary Rashid Al-Afasy",
            qari_slug: "mishary-rashid-alafasy",
        },
        {
            audio_url: `https://example.test/audio/sudais-${ayahId}.mp3`,
            qari_name: "Abdul Rahman Al-Sudais",
            qari_slug: "abdul-rahman-al-sudais",
        },
    ],
});

async function setupQuranRegressionMocks(page) {
    await page.addInitScript(() => {
        localStorage.clear();
        window.__audioPauseCount = 0;
        window.__audioSources = [];
        window.Audio = class MockAudio {
            constructor(src) {
                this.src = src;
                this.currentTime = 0;
                this.paused = true;
                this.playbackRate = 1;
                window.__audioSources.push(src);
            }

            pause() {
                this.paused = true;
                window.__audioPauseCount += 1;
                this.onpause?.();
            }

            play() {
                this.paused = false;
                this.onplay?.();
                return Promise.resolve();
            }
        };
    });

    await page.route("**/api/v1/**", async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        const method = route.request().method();

        if (path === "/api/v1/surah/name/Al-Baqara") {
            return route.fulfill({
                body: JSON.stringify(alBaqaraSurah),
                contentType: "application/json",
                status: 200,
            });
        }

        if (path === "/api/v1/ayah/surah/number/2") {
            return route.fulfill({
                body: JSON.stringify({
                    items: alBaqaraAyahs,
                    total: alBaqaraAyahs.length,
                }),
                contentType: "application/json",
                status: 200,
            });
        }

        if (path === "/api/v1/ayah/page/1") {
            return route.fulfill({
                body: JSON.stringify({
                    items: alBaqaraPageAyahs,
                    total: alBaqaraPageAyahs.length,
                }),
                contentType: "application/json",
                status: 200,
            });
        }

        if (path.startsWith("/api/v1/audio/ayah/")) {
            const ayahId = path.split("/").pop();
            return route.fulfill({
                body: JSON.stringify(audioItemsForAyah(ayahId)),
                contentType: "application/json",
                status: 200,
            });
        }

        if (path === "/api/v1/audio/surah/2") {
            return route.fulfill({
                body: JSON.stringify(audioItemsForAyah(201)),
                contentType: "application/json",
                status: 200,
            });
        }

        if (
            path === "/api/v1/activity" ||
            path === "/api/v1/analytics/page-view" ||
            path === "/api/v1/progress/quran"
        ) {
            return route.fulfill({
                body: JSON.stringify({ message: "ok" }),
                contentType: "application/json",
                status: 200,
            });
        }

        if (path === "/api/v1/auth/refresh") {
            return route.fulfill({
                body: JSON.stringify({ message: "unauthenticated" }),
                contentType: "application/json",
                status: 401,
            });
        }

        if (path === "/api/v1/auth/me") {
            return route.fulfill({
                body: JSON.stringify({
                    id: 1,
                    email: "test@example.com",
                    name: "Test User",
                    role: "user",
                }),
                contentType: "application/json",
                status: 200,
            });
        }

        return route.fulfill({
            body: JSON.stringify(
                method === "GET" ? { items: [], total: 0 } : { message: "ok" },
            ),
            contentType: "application/json",
            status: 200,
        });
    });
}

async function dismissPermissionPrompt(page) {
    const laterButton = page.getByRole("button", { name: "Nanti" });
    if (await laterButton.isVisible().catch(() => false)) {
        await laterButton.click();
    }
}

test.describe("Quran reader regression", () => {
    test.beforeEach(async ({ page }) => {
        await setupQuranRegressionMocks(page);
    });

    test("mobile reader preserves tajweed, basmalah placement, and font controls", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 412, height: 915 });
        await page.goto("/quran/surah/Al-Baqara");
        await expect(
            page.getByRole("heading", { name: "Al-Baqara" }),
        ).toBeVisible();
        await dismissPermissionPrompt(page);

        const firstAyahArabic = page
            .locator('#ayah-1 ul[style*="rtl"] > li')
            .first();
        await expect(firstAyahArabic).toBeVisible();
        await expect(
            firstAyahArabic.locator("tajweed.madda_necessary"),
        ).toHaveCount(1);
        await expect(firstAyahArabic).not.toContainText(basmalah);
        await expect(page.locator("text=" + basmalah)).toHaveCount(1);

        const tajweedColor = await firstAyahArabic
            .locator("tajweed.madda_necessary")
            .evaluate((node) => getComputedStyle(node).color);
        expect(tajweedColor).not.toBe("rgb(17, 24, 39)");

        await page
            .locator('button[aria-label="Pengaturan"]')
            .evaluate((button) => button.click());
        await expect(page.getByText("Tampilan Ayat")).toBeHidden();
        await expect(page.getByText("Aksi Ayat/Hadith")).toBeVisible();

        await page.getByRole("button", { name: "Perbesar huruf Arab" }).click();
        await expect(page.getByRole("button", { name: "44px" })).toBeVisible();
        await expect(firstAyahArabic).toHaveCSS("font-size", "44px");

        const secondAyahTranslation = page
            .locator("#ayah-2 li")
            .filter({ hasText: "Kitab (Al Quran) ini tidak ada keraguan" })
            .first();
        await page
            .getByRole("button", { name: "Perbesar huruf terjemahan" })
            .click();
        await expect(page.getByRole("button", { name: "18px" })).toBeVisible();
        await expect(secondAyahTranslation).toHaveCSS("font-size", "18px");
    });

    test("audio range player skips next, previous, and minimizes without pausing", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 412, height: 915 });
        await page.goto("/quran/surah/Al-Baqara");
        await expect(
            page.getByRole("heading", { name: "Al-Baqara" }),
        ).toBeVisible();
        await dismissPermissionPrompt(page);

        await page.getByRole("button", { name: "Dengar Surah" }).click();
        await expect(page.getByText("Abdul Rahman Al-Sudais")).toBeVisible();
        await page.getByLabel("Sampai ayat").fill("2");
        await page.getByRole("button", { name: /Putar range/i }).click();

        await expect(page.getByText("Al-Baqara · Ayat 1")).toBeVisible();
        await expect(page.getByLabel("Audio ayat sebelumnya")).toBeDisabled();
        await expect(page.getByLabel("Audio ayat berikutnya")).toBeEnabled();

        await page.getByLabel("Audio ayat berikutnya").click();
        await expect(page.getByText("Al-Baqara · Ayat 2")).toBeVisible();
        await expect(page.getByLabel("Audio ayat sebelumnya")).toBeEnabled();

        await page.getByLabel("Audio ayat sebelumnya").click();
        await expect(page.getByText("Al-Baqara · Ayat 1")).toBeVisible();

        const pauseCountBeforeMinimize = await page.evaluate(
            () => window.__audioPauseCount,
        );
        await page.getByLabel("Minimize audio player").click();
        await expect(page.getByLabel("Sampai ayat")).toHaveCount(0);
        await expect(page.getByLabel("Jeda audio")).toBeVisible();
        await expect
            .poll(() => page.evaluate(() => window.__audioPauseCount))
            .toBe(pauseCountBeforeMinimize);

        await page.getByLabel("Tampilkan player audio").first().click();
        await expect(page.getByLabel("Sampai ayat")).toBeVisible();
        await expect(page.getByText("Al-Baqara · Ayat 1")).toBeVisible();
    });

    test("page mushaf preserves tajweed HTML and links back to reader ayah", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 412, height: 915 });
        await page.goto("/quran/page-mushaf");
        await dismissPermissionPrompt(page);

        await page.getByRole("button", { name: "Buka", exact: true }).click();

        const firstAyahLink = page
            .locator('a[href="/quran/surah/Al-Baqara#ayah-1"]')
            .first();
        await expect(firstAyahLink).toBeVisible();

        const firstAyahCard = firstAyahLink.locator(
            'xpath=ancestor::div[contains(@class, "rounded-xl")][1]',
        );
        await expect(
            firstAyahCard.locator("tajweed.madda_necessary"),
        ).toHaveCount(1);
        await expect(firstAyahCard).toContainText("Alif laam miim.");
        await expect(firstAyahLink).toHaveAttribute(
            "href",
            "/quran/surah/Al-Baqara#ayah-1",
        );

        await firstAyahLink.click();
        await expect(page).toHaveURL(/\/quran\/surah\/Al-Baqara#ayah-1$/);
        await expect(
            page.getByRole("heading", { name: "Al-Baqara" }),
        ).toBeVisible();
        await expect(
            page.locator("#ayah-1 tajweed.madda_necessary"),
        ).toHaveCount(1);
    });

    test("dashboard page mushaf keeps dashboard links and one settings button", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 412, height: 915 });
        await page.addInitScript(() => {
            localStorage.setItem("auth_token", "mock-token-123");
        });
        await page.goto("/dashboard/quran/page-mushaf");
        await dismissPermissionPrompt(page);

        await expect(
            page.getByRole("heading", { name: "Navigasi Mushaf" }),
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Pengaturan" }),
        ).toHaveCount(1);

        await page.getByRole("button", { name: "Buka", exact: true }).click();

        const firstAyahLink = page
            .locator('a[href="/dashboard/quran/Al-Baqara#ayah-1"]')
            .first();
        await expect(firstAyahLink).toBeVisible();
        const firstAyahCard = firstAyahLink.locator(
            'xpath=ancestor::div[contains(@class, "rounded-xl")][1]',
        );
        await expect(
            firstAyahCard.locator("tajweed.madda_necessary"),
        ).toHaveCount(1);
    });
});
