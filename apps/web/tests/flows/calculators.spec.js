import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Islamic Calculators", () => {
    test("zakat calculator page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/zakat");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("faraidh calculator page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/faraidh");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("tasbih digital page loads", async ({ page }) => {
        test.setTimeout(20000);
        await page.goto("/tasbih");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("hijri calendar page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/hijri");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("imsakiyah page loads", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/imsakiyah");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
