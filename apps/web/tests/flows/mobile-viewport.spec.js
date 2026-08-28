import { test, expect } from "@playwright/test";
import { setupApiMocks, setupAuthenticatedPage } from "../fixtures/mockApi";

test.describe("Mobile Viewport", () => {
    const mobileViewport = { width: 390, height: 844 };

    test.use({ viewport: mobileViewport });

    test.beforeEach(async ({ page }) => {
        await setupApiMocks(page, { isAuthenticated: true });
    });

    test("homepage renders without horizontal scroll", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test("quran page renders on mobile", async ({ page }) => {
        await page.goto("/quran");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Al-Fatihah");
    });

    test("search page renders on mobile without overflow", async ({ page }) => {
        await page.goto("/search");
        await page.waitForLoadState("networkidle");

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test("auth login page renders on mobile", async ({ page }) => {
        await page.goto("/auth/login");
        await page.waitForLoadState("networkidle");

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test("hadith page renders on mobile", async ({ page }) => {
        await setupAuthenticatedPage(page);
        await page.goto("/hadith");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Hadis");
    });

    test("dashboard renders on mobile", async ({ page }) => {
        await setupAuthenticatedPage(page);
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Hadis");
    });

    test("doa page renders on mobile without overflow", async ({ page }) => {
        await page.goto("/doa");
        await page.waitForLoadState("networkidle");

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test("search results page renders on mobile", async ({ page }) => {
        await page.goto("/search?q=rahman");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Al-Quran");
    });
});
