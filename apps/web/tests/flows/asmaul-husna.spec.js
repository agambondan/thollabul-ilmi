import { test, expect } from "@playwright/test";
import { setupApiMocks } from "../fixtures/mockApi";

test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
});

test.describe("Asmaul Husna Journey", () => {
    test("asmaul-husna page loads with name list", async ({ page }) => {
        test.setTimeout(30000);
        await page.goto("/asmaul-husna");
        await page.waitForLoadState("networkidle");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test("asmaul-husna flashcard page loads, reveals meaning, dalil, and navigates", async ({
        page,
    }) => {
        test.setTimeout(30000);
        await page.goto("/asmaul-husna/flashcard");
        await page.waitForLoadState("networkidle");

        const heading = page.locator("h1");
        await expect(heading).toContainText("Flashcard Asmaul Husna");

        const card = page.locator(".min-h-\\[320px\\]");
        await card.click();

        const revealedText = await card.innerText();
        expect(revealedText.length).toBeGreaterThan(20);

        const nextBtn = page.getByRole("button", { name: "Selanjutnya", exact: true });
        await nextBtn.click();
    });
});
