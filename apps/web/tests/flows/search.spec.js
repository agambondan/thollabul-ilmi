import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Search User Journey", () => {
    test("search form and filter tabs render", async ({ page }) => {
        await page.goto("/search");
        await page.waitForLoadState("networkidle");

        await expect(page.locator('input[type="text"]')).toBeVisible();
        await expect(
            page.locator('button:has-text("Cari")').first(),
        ).toBeVisible();
        await expect(page.locator('button:has-text("Semua")')).toBeVisible();
        await expect(page.locator('button:has-text("Hadith")')).toBeVisible();
    });

    test("search with query and switch filter tabs", async ({ page }) => {
        await page.goto("/search");
        await page.fill('input[type="text"]', "sabar");
        await page.click('button:has-text("Cari")');
        await page.waitForLoadState("networkidle");

        const hadithTab = page.locator('button:has-text("Hadith")');
        await expect(hadithTab.first()).toBeVisible();
        await hadithTab.first().click();
        await page.waitForLoadState("networkidle");

        const allTab = page.locator('button:has-text("Semua")');
        await expect(allTab.first()).toBeVisible();
    });

    test("search handles API timeout gracefully", async ({ page }) => {
        test.setTimeout(90000);
        await page.goto("/search");
        await page.fill('input[type="text"]', "thisquerywillneverexistinquran");
        await page.click('button:has-text("Cari")');

        await page.waitForFunction(
            () => {
                const body = document.body.innerText;
                return (
                    body.includes("Tidak ada hasil") ||
                    body.includes("No results") ||
                    body.includes("Gagal") ||
                    body.includes("Search failed")
                );
            },
            { timeout: 60000 },
        );

        const body = await page.locator("body").innerText();
        const hasMessage =
            body.includes("Tidak ada hasil") ||
            body.includes("No results") ||
            body.includes("Gagal") ||
            body.includes("Search failed");
        expect(hasMessage).toBeTruthy();
    });
});
