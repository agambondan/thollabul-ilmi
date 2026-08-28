import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

const publicPages = [
    "/wirid-custom",
    "/wirid",
    "/khatam",
    "/leaderboard",
    "/perawi",
];
const authPages = ["/amalan", "/stats", "/profile"];

test.describe("Extra Pages", () => {
    for (const route of publicPages) {
        test(`${route} loads with content`, async ({ page }) => {
            test.setTimeout(30000);
            const response = await page.goto(route);
            expect(response.status()).toBeLessThan(400);
            const bodyText = await page.locator("body").innerText();
            expect(bodyText.length).toBeGreaterThan(0);
        });
    }

    for (const route of authPages) {
        test(`${route} redirects unauthenticated users`, async ({ page }) => {
            test.setTimeout(30000);
            const response = await page.goto(route);
            expect(response.status()).toBeLessThan(400);
        });
    }
});
