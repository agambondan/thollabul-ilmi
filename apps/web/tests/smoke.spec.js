import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/mockApi";
import {
    getConcreteDashboardRoutes,
    getConcretePublicRoutes,
} from "../src/lib/routesManifest";

const publicRoutes = getConcretePublicRoutes();
const dashboardRoutes = getConcreteDashboardRoutes();

test.describe("Public Routes Smoke Test", () => {
    test.beforeEach(async ({ page }) => {
        await setupApiMocks(page);
    });

    for (const route of publicRoutes) {
        test(`Should successfully load public route: ${route}`, async ({
            page,
        }) => {
            const response = await page.goto(route, {
                waitUntil: "domcontentloaded",
            });
            expect(response.status()).toBeLessThan(400);
        });
    }
});

test.describe("Dashboard Routes Smoke Test (Authenticated)", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("auth_token", "mock-token-123");
        });
        await setupApiMocks(page, { isAuthenticated: true });
    });

    for (const route of dashboardRoutes) {
        test(`Should successfully load dashboard route: ${route}`, async ({
            page,
        }) => {
            const response = await page.goto(route, {
                waitUntil: "domcontentloaded",
            });
            expect(response.status()).toBeLessThan(400);
        });
    }
});

test.describe("Dashboard Unauthenticated Guard Smoke Test", () => {
    test.beforeEach(async ({ page }) => {
        await setupApiMocks(page, { isAuthenticated: false });
    });

    const protectedSampleRoutes = [
        "/dashboard",
        "/dashboard/profile",
        "/dashboard/bookmarks",
        "/dashboard/notes",
        "/dashboard/notifications",
        "/dashboard/settings",
    ];

    for (const route of protectedSampleRoutes) {
        test(`Unauthenticated hit to ${route} redirects to login with next param`, async ({
            page,
        }) => {
            await page.goto(route, { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(
                new RegExp(`/auth/login\\?next=.*${encodeURIComponent(route)}|/auth/login\\?next=${route}`),
                { timeout: 15000 }
            );
        });
    }
});

test.describe("Dashboard Link Containment Smoke Test", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("auth_token", "mock-token-123");
        });
        await setupApiMocks(page, { isAuthenticated: true });
    });

    test("Dashboard search page links stay inside /dashboard", async ({
        page,
    }) => {
        await page.goto("/dashboard/search?q=iman", {
            waitUntil: "domcontentloaded",
        });
        const links = await page.locator("a[href]").evaluateAll((anchors) =>
            anchors
                .map((a) => a.getAttribute("href"))
                .filter(
                    (href) =>
                        href &&
                        !href.startsWith("http") &&
                        !href.startsWith("#") &&
                        !href.startsWith("mailto:") &&
                        !href.startsWith("/auth/") &&
                        !href.startsWith("/contact") &&
                        !href.startsWith("/dev")
                )
        );
        const leakingLinks = links.filter(
            (href) =>
                !href.startsWith("/dashboard") &&
                !href.startsWith("/admin")
        );
        expect(
            leakingLinks,
            `Unexpected leaking links on /dashboard/search: ${JSON.stringify(leakingLinks)}`
        ).toEqual([]);
    });
});
