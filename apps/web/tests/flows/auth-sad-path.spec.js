import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.describe("Auth Sad Path", () => {
    test.beforeEach(async ({ page }) => {
        await setupApiMocks(page);
    });

    test("login with invalid credentials shows error", async ({ page }) => {
        await page.route("**/api/v1/auth/login", async (route) => {
            if (route.request().method() === "POST") {
                await route.fulfill({
                    status: 401,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "Email atau password salah",
                    }),
                });
            }
        });

        await page.goto("/auth/login");
        await page.fill('input[type="email"]', "wrong@email.com");
        await page.fill('input[type="password"]', "wrongpass");
        await page.click('button[type="submit"]');
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Email");
        expect(body).not.toContain("/dashboard");
    });

    test("login with empty fields shows validation", async ({ page }) => {
        await page.goto("/auth/login");
        await page.click('button[type="submit"]');

        const url = page.url();
        expect(url).toContain("/auth/login");
    });

    test("register with weak password", async ({ page }) => {
        await page.route("**/api/v1/auth/register", async (route) => {
            if (route.request().method() === "POST") {
                await route.fulfill({
                    status: 422,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "Password minimal 8 karakter",
                    }),
                });
            }
        });

        await page.goto("/auth/register");
        await page.fill('input[name="name"]', "Test");
        await page.fill('input[type="email"]', "test@example.com");
        await page.fill('input[type="password"]', "123");
        await page.click('button[type="submit"]');
        await page.waitForLoadState("networkidle");

        expect(page.url()).toContain("/auth/register");
    });

    test("register with duplicate email", async ({ page }) => {
        await page.route("**/api/v1/auth/register", async (route) => {
            if (route.request().method() === "POST") {
                await route.fulfill({
                    status: 409,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Email sudah terdaftar" }),
                });
            }
        });

        await page.goto("/auth/register");
        await page.fill('input[name="name"]', "Test");
        await page.fill('input[type="email"]', "existing@example.com");
        await page.fill('input[type="password"]', "password123");
        await page.click('button[type="submit"]');
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("sudah terdaftar");
    });

    test("accessing 404 page shows not found", async ({ page }) => {
        const response = await page.goto("/this-page-does-not-exist-xyz");
        expect(response.status()).toBe(404);
    });

    test("accessing dashboard with expired token redirects to login", async ({
        page,
    }) => {
        await page.addInitScript(() => {
            localStorage.setItem("auth_token", "expired-token");
        });
        await setupApiMocks(page, { isAuthenticated: false });

        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");

        expect(page.url()).toContain("/auth/login");
    });
});
