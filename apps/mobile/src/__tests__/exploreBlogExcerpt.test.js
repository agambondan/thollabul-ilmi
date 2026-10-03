const {
    formatBlogDate,
    getBlogCategoryLabel,
    getBlogCategoryOptionLabel,
    getBlogExcerpt,
} = require("../screens/ExploreScreen.helpers");

describe("formatBlogDate", () => {
    test("defaults to Indonesian month names when no language is given", () => {
        expect(formatBlogDate("2026-10-03")).toBe("3 Oktober 2026");
    });

    test("uses Indonesian month names for the idn locale", () => {
        expect(formatBlogDate("2026-10-03", "idn")).toBe("3 Oktober 2026");
    });

    test("uses English month names for the en locale", () => {
        expect(formatBlogDate("2026-10-03", "en")).toBe("October 3, 2026");
    });

    test("returns an empty string for a missing value regardless of locale", () => {
        expect(formatBlogDate("", "en")).toBe("");
    });
});

describe("getBlogCategoryOptionLabel locale handling", () => {
    test("picks the Indonesian name by default even when an English translation exists", () => {
        const category = {
            name: "Fiqh & Hukum Islam",
            translation: { en: "Fiqh & Islamic Law" },
        };
        expect(getBlogCategoryOptionLabel(category)).toBe("Fiqh & Hukum Islam");
        expect(getBlogCategoryOptionLabel(category, "idn")).toBe(
            "Fiqh & Hukum Islam",
        );
    });

    test("prefers the English translation variant when language is en", () => {
        const category = {
            name: "Fiqh & Hukum Islam",
            translation: { en: "Fiqh & Islamic Law" },
        };
        expect(getBlogCategoryOptionLabel(category, "en")).toBe(
            "Fiqh & Islamic Law",
        );
    });

    test("falls back to the Indonesian name in English mode when no translation exists", () => {
        const category = { name: "Aqidah & Tauhid" };
        expect(getBlogCategoryOptionLabel(category, "en")).toBe(
            "Aqidah & Tauhid",
        );
    });
});

describe("getBlogCategoryLabel locale handling", () => {
    test("prefers the English translation variant on an item's category when language is en", () => {
        const item = {
            raw: {
                category: {
                    name: "Akhlak & Adab",
                    translation: { en: "Manners & Etiquette" },
                },
            },
        };
        expect(getBlogCategoryLabel(item, "en")).toBe("Manners & Etiquette");
        expect(getBlogCategoryLabel(item)).toBe("Akhlak & Adab");
    });
});

describe("getBlogExcerpt", () => {
    test("strips a leading markdown heading marker", () => {
        const excerpt = getBlogExcerpt({
            body: "## Pengertian dan Hukum Sujud Tilawah\n\nSujud Tilawah adalah sujud satu kali yang dilakukan ketika membaca atau mendengar ayat sajdah.",
        });

        expect(excerpt).not.toContain("##");
        expect(excerpt).toContain("Pengertian dan Hukum Sujud Tilawah");
        expect(excerpt).toContain("Sujud Tilawah adalah sujud satu kali");
    });

    test("still strips HTML tags", () => {
        const excerpt = getBlogExcerpt({
            body: "<p>Isi <strong>artikel</strong> dengan tag HTML.</p>",
        });

        expect(excerpt).toBe("Isi artikel dengan tag HTML.");
    });

    test("returns an empty string when no text source is available", () => {
        expect(getBlogExcerpt({})).toBe("");
    });

    test("prefers the API-curated excerpt over the full article body", () => {
        const excerpt = getBlogExcerpt({
            body: "## Pengertian dan Hukum Sujud Tilawah\n\nSujud Tilawah (...) adalah sujud satu kali yang dilakukan ketika membaca atau mendengar salah satu dari 15 ayat sajdah, lengkap dengan dalil-dalil dari Al-Quran dan As-Sunnah serta pendapat empat madzhab.",
            raw: {
                excerpt:
                    "Penjelasan lengkap fiqh sujud tilawah: hukum jumhur ulama, daftar 15 ayat sajdah.",
            },
        });

        expect(excerpt).toBe(
            "Penjelasan lengkap fiqh sujud tilawah: hukum jumhur ulama, daftar 15 ayat sajdah.",
        );
        expect(excerpt).not.toContain("Pengertian dan Hukum Sujud Tilawah");
    });

    test("prefers raw.summary and translation excerpts over the full body, in priority order", () => {
        const withSummary = getBlogExcerpt({
            body: "Isi artikel lengkap yang sangat panjang sekali.",
            raw: { summary: "Ringkasan singkat artikel." },
        });
        expect(withSummary).toBe("Ringkasan singkat artikel.");

        const withTranslation = getBlogExcerpt({
            body: "Isi artikel lengkap yang sangat panjang sekali.",
            raw: {
                translation: { excerpt_en: "Short English excerpt." },
            },
        });
        expect(withTranslation).toBe("Short English excerpt.");

        const excerptBeatsSummary = getBlogExcerpt({
            raw: { excerpt: "Excerpt wins.", summary: "Summary loses." },
        });
        expect(excerptBeatsSummary).toBe("Excerpt wins.");
    });

    test("falls back to a bounded slice of the body when no curated excerpt exists at all", () => {
        const longBody = "Kalimat panjang. ".repeat(50);
        const excerpt = getBlogExcerpt({ body: longBody });

        expect(excerpt.length).toBeLessThanOrEqual(160);
        expect(excerpt.length).toBeLessThan(longBody.length);
    });
});
