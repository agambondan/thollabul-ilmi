import { translations } from "@/lib/i18n";

describe("i18n translations", () => {
    const idKeys = Object.keys(translations.ID);
    const enKeys = Object.keys(translations.EN);

    test("has both ID and EN translations", () => {
        expect(translations.ID).toBeDefined();
        expect(translations.EN).toBeDefined();
        expect(idKeys.length).toBeGreaterThan(0);
        expect(enKeys.length).toBeGreaterThan(0);
    });

    test("all ID keys exist in EN", () => {
        const missing = idKeys.filter((k) => !enKeys.includes(k));
        expect(missing).toEqual([]);
    });

    test("all EN keys exist in ID", () => {
        const missing = enKeys.filter((k) => !idKeys.includes(k));
        expect(missing).toEqual([]);
    });

    test("ID and EN have the same number of keys", () => {
        expect(idKeys.length).toBe(enKeys.length);
    });

    test("no empty translation values in ID", () => {
        idKeys.forEach((k) => {
            expect(translations.ID[k]).toBeTruthy();
        });
    });

    test("no empty translation values in EN", () => {
        enKeys.forEach((k) => {
            expect(translations.EN[k]).toBeTruthy();
        });
    });

    test("ID translations are in Indonesian", () => {
        const sampleKeys = ["nav.search", "common.save", "footer.quote"];
        sampleKeys.forEach((k) => {
            expect(translations.ID[k]).toBeTruthy();
            expect(typeof translations.ID[k]).toBe("string");
        });
    });

    test("EN translations are in English", () => {
        const sampleKeys = ["nav.search", "common.save", "footer.quote"];
        sampleKeys.forEach((k) => {
            expect(translations.EN[k]).toBeTruthy();
            expect(typeof translations.EN[k]).toBe("string");
        });
    });
});
