import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Siroh & History Journey", () => {
    test("siroh page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/siroh");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("sejarah page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/sejarah");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
