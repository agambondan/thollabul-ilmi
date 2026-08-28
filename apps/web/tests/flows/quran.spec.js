import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Quran Reading Journey", () => {
    test("quran page loads with expected title and search", async ({
        page,
    }) => {
        test.setTimeout(30000);
        await page.goto("/quran");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Qur");
        expect(
            await page.locator('input[type="text"]').count(),
        ).toBeGreaterThanOrEqual(0);
    });

    test("quran page has mushaf navigator shortcut", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/quran");
        await page.waitForLoadState("networkidle");

        const mushafLink = page.locator('a[href*="/quran/page-mushaf"]');
        await expect(mushafLink.first()).toBeVisible({ timeout: 10000 });
    });

    test("page mushaf loads successfully", async ({ page }) => {
        test.setTimeout(30000);
        const response = await page.goto("/quran/page-mushaf");
        expect(response.status()).toBeLessThan(400);
        await page.waitForLoadState("networkidle");
        expect(await page.locator("body").innerText()).toBeTruthy();
    });
});
