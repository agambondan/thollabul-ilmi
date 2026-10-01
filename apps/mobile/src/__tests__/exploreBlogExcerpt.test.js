const { getBlogExcerpt } = require("../screens/ExploreScreen.helpers");

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
});
