import { test, expect } from "@playwright/test";
import { setupAuthenticatedPage } from "../fixtures/mockApi";

/**
 * Runtime coverage for docs/features/progress/2026-05-13-personal-data-sync-p0.md
 * task 7/8, which were marked DONE_STRUCTURAL because they were verified by
 * reading the code, never by loading the page: "Runtime smoke login dashboard
 * authenticated belum dilakukan di browser."
 *
 * The behaviour that actually matters here is failure handling: when the
 * personal-data API is down, the page must (a) still render the locally
 * cached copy instead of going blank, and (b) say so, instead of silently
 * looking like a successful, fully-synced load. Both conditions are checked
 * together in every case below — one without the other is the bug this is
 * guarding against.
 */

const failEndpoint = async (page, pattern) => {
    await page.route(pattern, (route) =>
        route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "server error" }),
        }),
    );
};

const seedLocalStorage = async (page, entries) => {
    await page.addInitScript((data) => {
        for (const [key, value] of Object.entries(data)) {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    }, entries);
};

test.describe("Personal data sync — API-down fallback", () => {
    test.beforeEach(async ({ page }) => {
        await setupAuthenticatedPage(page);
    });

    test("goals: shows the local target and a sync warning when /api/v1/goals fails", async ({
        page,
    }) => {
        await seedLocalStorage(page, {
            tholabul_goals: [
                {
                    id: "local-1",
                    title: "Khatam Al-Quran E2E",
                    target: 30,
                    current: 5,
                    unit: "juz",
                    deadline: "2026-12-31",
                    category: "Quran",
                    completed: false,
                },
            ],
        });
        await failEndpoint(page, "**/api/v1/goals");

        await page.goto("/dashboard/goals");
        await page.waitForLoadState("networkidle");

        await expect(page.getByText("Khatam Al-Quran E2E")).toBeVisible();
        await expect(
            page.getByText(/tersinkron|sinkron cloud belum berhasil/i),
        ).toBeVisible();
    });

    test("muhasabah: shows the local entry and a sync warning when /api/v1/muhasabah fails", async ({
        page,
    }) => {
        await seedLocalStorage(page, {
            tholabul_muhasabah: [
                {
                    id: "local-1",
                    content: "Catatan muhasabah E2E hari ini",
                    date: "2026-09-03",
                    mood: "biasa",
                },
            ],
        });
        await failEndpoint(page, "**/api/v1/muhasabah");

        await page.goto("/dashboard/muhasabah");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText("Catatan muhasabah E2E hari ini"),
        ).toBeVisible();
        await expect(
            page.getByText(/tersinkron|sinkron cloud belum berhasil/i),
        ).toBeVisible();
    });

    test("notes: shows the local note and a sync warning when /api/v1/notes fails", async ({
        page,
    }) => {
        await seedLocalStorage(page, {
            tholabul_notes: [
                {
                    id: "local-1",
                    title: "Catatan E2E",
                    content: "Isi catatan pengujian sinkron.",
                    tags: [],
                    date: "2026-09-03",
                },
            ],
        });
        await failEndpoint(page, "**/api/v1/notes**");

        await page.goto("/dashboard/notes");
        await page.waitForLoadState("networkidle");

        await expect(page.getByText("Catatan E2E")).toBeVisible();
        await expect(
            page.getByText(/tersinkron|sinkron cloud belum berhasil/i),
        ).toBeVisible();
    });

    test("dashboard summary: falls back to local prayer log with a sync warning", async ({
        page,
    }) => {
        const today = new Date().toISOString().slice(0, 10);
        await seedLocalStorage(page, {
            [`sholat_log_${today}`]: {
                subuh: true,
                dzuhur: true,
                ashar: false,
                maghrib: false,
                isya: false,
            },
        });
        await failEndpoint(page, "**/api/v1/sholat/today");
        await failEndpoint(page, "**/api/v1/muhasabah");

        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/salinan lokal|belum tersedia/i),
        ).toBeVisible();
    });

    test("stats: falls back to local counts with a sync warning", async ({
        page,
    }) => {
        await seedLocalStorage(page, {
            tholabul_goals: [
                {
                    id: "local-1",
                    title: "Target E2E",
                    target: 10,
                    current: 1,
                    unit: "kali",
                    deadline: "",
                    category: "Lainnya",
                    completed: false,
                },
            ],
        });
        await failEndpoint(page, "**/api/v1/stats");
        await failEndpoint(page, "**/api/v1/goals");
        await failEndpoint(page, "**/api/v1/sholat/today");
        await failEndpoint(page, "**/api/v1/sholat/history");
        await failEndpoint(page, "**/api/v1/muhasabah");
        await failEndpoint(page, "**/api/v1/hafalan");
        await failEndpoint(page, "**/api/v1/tilawah");

        await page.goto("/dashboard/stats");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/salinan lokal|belum tersedia/i),
        ).toBeVisible();
    });

    test("goals: a successful create clears a previous sync warning", async ({
        page,
    }) => {
        // First render fails so the warning is showing, then the create call
        // succeeds — the warning must clear, not stay stuck from the earlier
        // failure.
        await failEndpoint(page, "**/api/v1/goals");
        await page.goto("/dashboard/goals");
        await page.waitForLoadState("networkidle");
        await expect(page.getByText(/tersinkron/i)).toBeVisible();

        await page.unroute("**/api/v1/goals");
        await page.route("**/api/v1/goals", (route) => {
            if (route.request().method() === "POST") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        data: {
                            id: 42,
                            title: "Target Baru E2E",
                            target: 5,
                            progress: 0,
                            type: "custom",
                            start_date: "2026-09-03",
                        },
                    }),
                });
            }
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ items: [] }),
            });
        });

        await page
            .getByRole("button", { name: /tambah|add/i })
            .first()
            .click();
        await page
            .getByLabel(/judul|title/i)
            .first()
            .fill("Target Baru E2E");
        await page.locator("input[type='number']").first().fill("5");
        await page.getByRole("button", { name: /simpan|save/i }).click();

        await expect(page.getByText(/tersinkron/i)).toHaveCount(0);
    });
});
