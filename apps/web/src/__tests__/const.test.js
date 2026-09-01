import {
    linksMenu,
    linksMenuContent,
    hadithTabList,
    listTajweed,
} from "@/lib/const";

describe("linksMenu", () => {
    test("has 3 items", () => {
        expect(linksMenu).toHaveLength(3);
    });
    test("contains Quran", () => {
        expect(linksMenu[0].href).toBe("/quran");
    });
    test("contains Hadith", () => {
        expect(linksMenu[1].href).toBe("/hadith");
    });
    // /dev is an internal API explorer and must stay out of the public nav.
    test("does not expose the dev page", () => {
        expect(linksMenu.some((item) => item.href === "/dev")).toBe(false);
    });
    test("contains Contact", () => {
        expect(linksMenu[2].href).toBe("/contact");
    });
    test("all items have href and label", () => {
        linksMenu.forEach((item) => {
            expect(item.href).toBeDefined();
            expect(item.label).toBeDefined();
            expect(item.labelKey).toBeDefined();
        });
    });
});

describe("linksMenuContent", () => {
    test("has multiple items", () => {
        expect(linksMenuContent.length).toBeGreaterThan(20);
    });
    test("contains Asmaul Husna", () => {
        expect(linksMenuContent.some((l) => l.href === "/asmaul-husna")).toBe(
            true,
        );
    });
    test("contains Kalkulator Waris", () => {
        expect(linksMenuContent.some((l) => l.href === "/faraidh")).toBe(true);
    });
    test("all items have href and label", () => {
        linksMenuContent.forEach((item) => {
            expect(item.href).toBeDefined();
            expect(item.label).toBeDefined();
            expect(item.labelKey).toBeDefined();
        });
    });
});

describe("hadithTabList", () => {
    test("has 4 items", () => {
        expect(hadithTabList).toHaveLength(4);
    });
    test("labels are Book, Theme, Chapter, Hadith", () => {
        expect(hadithTabList.map((t) => t.label)).toEqual([
            "Book",
            "Theme",
            "Chapter",
            "Hadith",
        ]);
    });
    test("all items have href and alt", () => {
        hadithTabList.forEach((tab) => {
            expect(tab.alt).toBeDefined();
            expect(tab.href).toBeDefined();
        });
    });
});

describe("listTajweed", () => {
    test("has entries", () => {
        expect(listTajweed.length).toBeGreaterThan(10);
    });
    test("contains hamza-wasl", () => {
        expect(listTajweed.some((t) => t.Type === "hamza-wasl")).toBe(true);
    });
    test("contains ghunnah", () => {
        const ghunnah = listTajweed.find((t) => t.Type === "ghunnah");
        expect(ghunnah).toBeDefined();
        expect(ghunnah.Identifier).toBe("[g");
    });
    test("all items have Type, Identifier, Colour, Arabic", () => {
        listTajweed.forEach((t) => {
            expect(t.Type).toBeDefined();
            expect(t.Identifier).toBeDefined();
            expect(t.Colour).toBeDefined();
            expect(t.Arabic).toBeDefined();
        });
    });
});
