import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Personal Features Journey", () => {
    test("sholat tracker page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/sholat-tracker");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("hafalan tracker page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/hafalan");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("tilawah tracker page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/tilawah");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("goals page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/goals");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("muhasabah page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/muhasabah");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("muroja-ah page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/muroja-ah");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
