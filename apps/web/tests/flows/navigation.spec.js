import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Navigation Journey", () => {
    test("navigate between major sections", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const quranLink = page.locator('a[href="/quran"]').first();
        if (await quranLink.isVisible()) {
            await quranLink.click();
            await page.waitForLoadState("networkidle");
            expect(page.url()).toContain("/quran");
        }
    });

    test("search page is accessible", async ({ page }) => {
        await page.goto("/search");
        await page.waitForLoadState("networkidle");
        expect(page.url()).toContain("/search");
    });
});
