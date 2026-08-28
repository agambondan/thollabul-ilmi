import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Tafsir Journey", () => {
    test("tafsir page loads with content", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/tafsir");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("asbabun-nuzul page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/asbabun-nuzul");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
