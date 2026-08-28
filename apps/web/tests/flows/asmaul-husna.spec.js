import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Asmaul Husna Journey", () => {
    test("asmaul-husna page loads with name list", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/asmaul-husna");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
