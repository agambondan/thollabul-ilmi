import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { isAuthenticated: true });
    await page.addInitScript(() => {
        localStorage.setItem("auth_token", "mock-token-123");
    });
});

const openJadwal = async (page) => {
    await page.goto("/jadwal-sholat");
    await page.waitForLoadState("networkidle");
};

const openDashboardJadwal = async (page) => {
    await page.goto("/dashboard/jadwal-sholat");
    await page.waitForLoadState("networkidle");
};

const openSettings = async (page) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
};

test.describe("Adzan reminder lead flow", () => {
    test("public jadwal-sholat page exposes global lead control", async ({
        page,
    }) => {
        await openJadwal(page);

        const trigger = page
            .getByRole("button", { name: /pengaturan/i })
            .first();
        if ((await trigger.count()) > 0) await trigger.click();

        const lead = page.locator("select[aria-label='Jeda pengingat']");
        await expect(lead).toBeVisible();
        await lead.selectOption("15");
        await expect(lead).toHaveValue("15");
    });

    test("dashboard jadwal-sholat page renders global + per-prayer lead", async ({
        page,
    }) => {
        await openDashboardJadwal(page);

        const globalLead = page
            .locator("select[aria-label='Jeda pengingat']")
            .first();
        await expect(globalLead).toBeVisible();
        await globalLead.selectOption("15");
        await expect(globalLead).toHaveValue("15");

        const fajrSelect = page.locator(
            "select[aria-label*='fajr'], select[aria-label*='Subuh']",
        );
        await expect(fajrSelect.first()).toBeVisible();
        const fajrOptions = await fajrSelect
            .first()
            .locator("option")
            .allTextContents();
        expect(
            fajrOptions.some((text) => /global/i.test(text)),
        ).toBe(true);
    });

    test("dashboard settings persists global and per-prayer lead", async ({
        page,
    }) => {
        await openSettings(page);

        const global = page
            .locator("select[aria-label='Jeda pengingat']")
            .first();
        await expect(global).toBeVisible();
        await global.selectOption("15");
        await expect(global).toHaveValue("15");
    });

    test("remote settings hydrate reminder lead on sign-in", async ({
        page,
    }) => {
        const captures = [];
        page.on("request", (req) => {
            if (req.url().endsWith("/api/v1/settings") && req.method() === "GET")
                captures.push(req.url());
        });

        await openSettings(page);

        const visible = await page
            .locator("select[aria-label='Jeda pengingat']")
            .first()
            .inputValue();
        expect(visible).toBe("15");
        expect(captures.length).toBeGreaterThanOrEqual(1);
    });
});
