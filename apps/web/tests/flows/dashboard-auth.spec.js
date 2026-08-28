import { test, expect } from "@playwright/test";
import { setupAuthenticatedPage, defaultMockUser } from "../fixtures/mockApi";

const protectedDashboardRoutes = [
    { route: "/dashboard", heading: /dashboard|selamat datang|beranda/i },
    { route: "/dashboard/profile", heading: /profile/i },
    { route: "/dashboard/bookmarks", heading: /bookmark/i },
    { route: "/dashboard/notes", heading: /catatan|notes/i },
    { route: "/dashboard/hadith", heading: /hadis|hadith/i },
    { route: "/dashboard/quran", heading: /quran/i },
    { route: "/dashboard/doa", heading: /doa/i },
    { route: "/dashboard/dzikir", heading: /dzikir/i },
];

test.describe("Dashboard Authenticated Routes", () => {
    test.beforeEach(async ({ page }) => {
        await setupAuthenticatedPage(page);
    });

    for (const { route, heading } of protectedDashboardRoutes) {
        test(`dashboard ${route} renders for authenticated user`, async ({
            page,
        }) => {
            const response = await page.goto(route);
            expect(response.status()).toBeLessThan(400);

            await page.waitForLoadState("networkidle");

            const bodyText = await page.locator("body").innerText();
            expect(bodyText.length).toBeGreaterThan(50);
        });
    }

    test("login redirects to dashboard for already authenticated user", async ({
        page,
    }) => {
        await page.goto("/auth/login");
        await page.waitForLoadState("networkidle");
        expect(page.url()).toContain("/dashboard");
    });
});
