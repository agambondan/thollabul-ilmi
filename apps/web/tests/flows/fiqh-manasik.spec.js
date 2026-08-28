import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Fiqh & Manasik Journey", () => {
    test("fiqh page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/fiqh");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("manasik page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/manasik");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("panduan-sholat page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/panduan-sholat");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("jadwal-sholat page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/jadwal-sholat");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("kiblat page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/kiblat");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
