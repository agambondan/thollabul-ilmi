import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.describe("Search User Flow", () => {
    test.beforeEach(async ({ page }) => {
        await setupApiMocks(page);
    });

    test("search for quran shows ayah results", async ({ page }) => {
        await page.goto("/search?q=rahman");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Al-Quran");
        expect(body).toContain("Al-Fatihah");
    });

    test("search for hadith shows hadith results", async ({ page }) => {
        await page.goto("/search?q=niat&type=hadith");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Hadis");
    });

    test("search for doa shows doa results", async ({ page }) => {
        await page.goto("/search?q=tidur&type=doa");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Doa");
    });

    test("quran page shows surah list", async ({ page }) => {
        await page.goto("/quran");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Al-Fatihah");
        expect(body).toContain("Al-Baqarah");
        expect(body).toContain("Al-Ikhlas");
    });

    test("hadith page loads book list", async ({ page }) => {
        await page.goto("/hadith");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Hadis");
        expect(body).toContain("Bukhari");
    });

    test("doa page loads prayer list", async ({ page }) => {
        await page.goto("/doa");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Doa");
        expect(body).toContain("Sebelum Tidur");
        expect(body).toContain("Bangun Tidur");
    });

    test("dzikir page loads dzikir list", async ({ page }) => {
        await page.goto("/dzikir");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Subhanallah");
        expect(body).toContain("Alhamdulillah");
    });

    test("kamus page loads dictionary", async ({ page }) => {
        await page.goto("/kamus");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Taqwa");
    });

    test("kajian page loads study list", async ({ page }) => {
        await page.goto("/kajian");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("Kajian");
    });

    test("sholat page shows schedule", async ({ page }) => {
        await page.goto("/jadwal-sholat");
        await page.waitForLoadState("networkidle");

        const body = await page.locator("body").innerText();
        expect(body).toContain("04:30");
    });
});
