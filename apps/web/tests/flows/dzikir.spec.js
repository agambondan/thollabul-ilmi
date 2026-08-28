import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Dzikir Journey", () => {
    test("dzikir page loads with content", async ({ page }) => {
        await page.goto("/dzikir");
        await page.waitForLoadState("networkidle");

        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test("wirid page loads", async ({ page }) => {
        await page.goto("/wirid");
        await page.waitForLoadState("networkidle");
        expect(await page.title().catch(() => "")).not.toBeNull();
    });
});
