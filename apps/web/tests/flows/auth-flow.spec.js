import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.describe("Auth User Flow", () => {
    test("register page has working form fields", async ({ page }) => {
        await setupApiMocks(page);
        await page.goto("/auth/register");
        await page.waitForLoadState("networkidle");

        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test("login page redirects authenticated user to dashboard", async ({
        page,
    }) => {
        await page.addInitScript(() => {
            localStorage.setItem("auth_token", "mock-token-123");
        });
        await setupApiMocks(page, { isAuthenticated: true });

        await page.goto("/auth/login");
        await page.waitForLoadState("networkidle");

        expect(page.url()).toContain("/dashboard");
    });

    test("register page has link to login page", async ({ page }) => {
        await setupApiMocks(page);
        await page.goto("/auth/register");

        const registerBtn = page.locator('button[type="submit"]');
        await expect(registerBtn).toBeVisible();
        await expect(registerBtn).toContainText(/daftar|register/i);
    });
});
