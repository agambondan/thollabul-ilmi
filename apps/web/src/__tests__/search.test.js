import { searchInQuranData, searchInThemesData } from "@/lib/search";

const quranData = [
    {
        id: 1,
        number: 1,
        surah_id: 1,
        translation_id: 1,
        default_language: "id",
        translation: {
            idn: "Dengan nama Allah",
            latin_idn: "bismillah",
            en: "In the name of Allah",
            ar: "بِسْمِ اللَّهِ",
            ar_waqaf: "",
            ar_format: "",
            ar_html: "",
        },
    },
    {
        id: 2,
        number: 2,
        surah_id: 1,
        translation_id: 2,
        default_language: "id",
        translation: {
            idn: "Segala puji",
            latin_idn: "alhamdulillah",
            en: "All praise",
            ar: "الْحَمْدُ",
            ar_waqaf: "",
            ar_format: "",
            ar_html: "",
        },
    },
];

const themesData = [
    {
        id: 1,
        translation_id: 1,
        translation: {
            idn: "Tauhid",
            latin_idn: "tauhid",
            en: "Tawheed",
            ar: "تَوْحِيد",
            ar_waqaf: "",
            ar_format: "",
            ar_html: "",
        },
    },
    {
        id: 2,
        translation_id: 2,
        translation: {
            idn: "Ibadah",
            latin_idn: "ibadah",
            en: "Worship",
            ar: "عِبَادَة",
            ar_waqaf: "",
            ar_format: "",
            ar_html: "",
        },
    },
];

describe("searchInQuranData", () => {
    test("finds by idn", () => {
        const results = searchInQuranData(quranData, "nama");
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(1);
    });

    test("finds by latin_idn", () => {
        const results = searchInQuranData(quranData, "bismillah");
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(1);
    });

    test("finds by en", () => {
        const results = searchInQuranData(quranData, "praise");
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(2);
    });

    test("finds by ar", () => {
        const results = searchInQuranData(quranData, "اللَّهِ");
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(1);
    });

    test("returns empty for no match", () => {
        const results = searchInQuranData(quranData, "xyz");
        expect(results).toHaveLength(0);
    });

    test("returns all matching items", () => {
        const results = searchInQuranData(quranData, "a");
        expect(results.length).toBeGreaterThanOrEqual(1);
    });

    test("includes all translation fields in result", () => {
        const results = searchInQuranData(quranData, "nama");
        expect(results[0].translation).toHaveProperty("idn");
        expect(results[0].translation).toHaveProperty("latin_idn");
        expect(results[0].translation).toHaveProperty("en");
        expect(results[0].translation).toHaveProperty("ar");
        expect(results[0].translation).toHaveProperty("ar_waqaf");
        expect(results[0].translation).toHaveProperty("ar_format");
        expect(results[0].translation).toHaveProperty("ar_html");
    });
});

describe("searchInThemesData", () => {
    test("finds by idn", () => {
        const results = searchInThemesData(themesData, "Tauhid");
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(1);
    });

    test("finds by en", () => {
        const results = searchInThemesData(themesData, "Worship");
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(2);
    });

    test("returns empty for no match", () => {
        const results = searchInThemesData(themesData, "xyz");
        expect(results).toHaveLength(0);
    });
});
