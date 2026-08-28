import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Doa Journey", () => {
    test("doa page loads with content", async ({ page }) => {
        await page.goto("/doa");
        await page.waitForLoadState("networkidle");

        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(0);
    });
});
