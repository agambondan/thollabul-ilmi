import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Auth Pages Journey", () => {
    test("login page renders form", async ({ page }) => {
        await page.goto("/auth/login");
        await page.waitForLoadState("networkidle");

        await expect(
            page
                .locator('button:has-text("Masuk")')
                .or(page.locator('button:has-text("Login")')),
        ).toBeVisible();
    });

    test("register page renders form", async ({ page }) => {
        await page.goto("/auth/register");
        await page.waitForLoadState("networkidle");

        await expect(
            page
                .locator('button[type="submit"]')
                .or(page.locator('button:has-text("Daftar")')),
        ).toBeVisible();
    });
});
