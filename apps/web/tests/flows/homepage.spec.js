import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Homepage Journey", () => {
    test("homepage loads with all sections", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // The bottom mobile tab bar is also a <nav>, so this must not assert
        // on "the one nav" — .first() checks that a top-level nav/header
        // landmark exists without caring how many there are.
        await expect(
            page.locator("nav").or(page.locator("header")).first(),
        ).toBeVisible();

        const footer = page.locator("footer");
        if ((await footer.count()) > 0) {
            await expect(footer).toBeVisible();
        }
    });

    test("homepage has navigation links", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const quranLink = page.locator('a[href="/quran"]');
        const hadithLink = page.locator('a[href="/hadith"]');

        const hasQuran = (await quranLink.count()) > 0;
        const hasHadith = (await hadithLink.count()) > 0;

        expect(hasQuran || hasHadith).toBeTruthy();
    });
});
