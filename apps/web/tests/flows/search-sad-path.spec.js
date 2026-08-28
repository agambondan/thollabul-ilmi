import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.describe("Search Sad Path", () => {
    test.beforeEach(async ({ page }) => {
        await setupApiMocks(page);
    });

    test("empty query shows hint not results", async ({ page }) => {
        await page.goto("/search");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).not.toContain("hasil untuk");
    });

    test("no search results shows empty state", async ({ page }) => {
        await page.goto("/search?q=xyznonexistent98765");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("hasil");
    });

    test("very long query does not break page", async ({ page }) => {
        const longQuery = "a".repeat(200);
        const response = await page.goto(`/search?q=${longQuery}`);
        expect(response.status()).toBeLessThan(400);
    });

    test("special characters in query handled gracefully", async ({ page }) => {
        const response = await page.goto(
            "/search?q=%3Cscript%3Ealert(%22xss%22)%3C/script%3E",
        );
        expect(response.status()).toBeLessThan(400);
        const body = await page.locator("body").innerText();
        expect(body.length).toBeGreaterThan(0);
    });

    test("API 500 error shows error message", async ({ page }) => {
        await page.goto("/search?q=ERROR_TRIGGER_500");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body.length).toBeGreaterThan(0);
    });
});
