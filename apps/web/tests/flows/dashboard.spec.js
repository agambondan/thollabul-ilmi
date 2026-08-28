import { test, expect } from "@playwright/test";
import { setupAuthenticatedPage } from "../fixtures/mockApi";

test.describe("Dashboard Routes", () => {
    test.beforeEach(async ({ page }) => {
        await setupAuthenticatedPage(page);
    });

    const dashboardPages = [
        "/dashboard",
        "/dashboard/bookmarks",
        "/dashboard/notes",
        "/dashboard/hadith",
        "/dashboard/quran",
        "/dashboard/doa",
        "/dashboard/dzikir",
        "/dashboard/profile",
    ];

    for (const route of dashboardPages) {
        test(`dashboard route ${route} loads without error`, async ({
            page,
        }) => {
            const response = await page.goto(route);
            expect(response.status()).toBeLessThan(400);
            await page.waitForLoadState("networkidle");
            const bodyText = await page.locator("body").innerText();
            expect(bodyText.length).toBeGreaterThan(50);
        });
    }
});
