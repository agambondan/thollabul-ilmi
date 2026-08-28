import { parseDeepLink } from "../utils/deepLinks";

describe("parseDeepLink", () => {
    test("returns null for unknown tab", () => {
        expect(parseDeepLink("thollabul-ilmi://unknown")).toBeNull();
    });

    describe("home tab", () => {
        test("parses home with no params", () => {
            const result = parseDeepLink("thollabul-ilmi://home");
            expect(result).toEqual({ tab: "home", params: {} });
        });

        test("parses search alias to home", () => {
            const result = parseDeepLink("thollabul-ilmi://search/quran");
            expect(result).toEqual({
                tab: "home",
                params: {
                    query: "quran",
                    filter: "all",
                    view: "global-search",
                },
            });
        });

        test("parses global-search alias", () => {
            const result = parseDeepLink(
                "thollabul-ilmi://global-search/hadith",
            );
            expect(result).toEqual({
                tab: "home",
                params: {
                    query: "hadith",
                    filter: "all",
                    view: "global-search",
                },
            });
        });

        test("parses home with search/filter", () => {
            const result = parseDeepLink(
                "thollabul-ilmi://home/search/hadith/doa",
            );
            expect(result).toEqual({
                tab: "home",
                params: {
                    query: "hadith",
                    filter: "doa",
                    view: "global-search",
                },
            });
        });
    });

    describe("quran tab", () => {
        test("parses surah number", () => {
            const result = parseDeepLink("thollabul-ilmi://quran/1");
            expect(result).toEqual({
                tab: "quran",
                params: { surahNumber: 1, ayahNumber: null, surahSlug: "1" },
            });
        });

        test("parses surah with ayah", () => {
            const result = parseDeepLink("thollabul-ilmi://quran/1/5");
            expect(result).toEqual({
                tab: "quran",
                params: { surahNumber: 1, ayahNumber: 5, surahSlug: "1" },
            });
        });

        test("parses surah via /surah/ prefix", () => {
            const result = parseDeepLink("thollabul-ilmi://quran/surah/36");
            expect(result).toEqual({
                tab: "quran",
                params: { surahNumber: 36, ayahNumber: null, surahSlug: "36" },
            });
        });

        test("parses surah/ayah via /surah/ prefix", () => {
            const result = parseDeepLink("thollabul-ilmi://quran/surah/36/1");
            expect(result).toEqual({
                tab: "quran",
                params: { surahNumber: 36, ayahNumber: 1, surahSlug: "36" },
            });
        });

        test("parses page", () => {
            const result = parseDeepLink("thollabul-ilmi://quran/page/5");
            expect(result).toEqual({
                tab: "quran",
                params: { pageNumber: 5 },
            });
        });

        test("parses hizb", () => {
            const result = parseDeepLink("thollabul-ilmi://quran/hizb/3");
            expect(result).toEqual({
                tab: "quran",
                params: { hizbNumber: 3 },
            });
        });

        test("handles non-numeric surah slug", () => {
            const result = parseDeepLink("thollabul-ilmi://quran/al-fatihah");
            expect(result).toEqual({
                tab: "quran",
                params: {
                    surahNumber: null,
                    ayahNumber: null,
                    surahSlug: "al-fatihah",
                },
            });
        });

        test("handles empty quran link", () => {
            const result = parseDeepLink("thollabul-ilmi://quran");
            expect(result).toEqual({ tab: "quran", params: {} });
        });
    });

    describe("hadith tab", () => {
        test("parses hadith id", () => {
            const result = parseDeepLink("thollabul-ilmi://hadith/123");
            expect(result).toEqual({
                tab: "hadith",
                params: { hadithId: "123" },
            });
        });

        test("parses hadith via /hadith/ prefix", () => {
            const result = parseDeepLink("thollabul-ilmi://hadith/hadith/456");
            expect(result).toEqual({
                tab: "hadith",
                params: { hadithId: "456" },
            });
        });

        test("handles aliases (hadis/hadits)", () => {
            expect(parseDeepLink("thollabul-ilmi://hadis/1").tab).toBe(
                "hadith",
            );
            expect(parseDeepLink("thollabul-ilmi://hadits/2").tab).toBe(
                "hadith",
            );
        });

        test("handles empty hadith link", () => {
            const result = parseDeepLink("thollabul-ilmi://hadith");
            expect(result).toEqual({ tab: "hadith", params: {} });
        });
    });

    describe("belajar tab", () => {
        test("parses feature key", () => {
            const result = parseDeepLink("thollabul-ilmi://belajar/doa");
            expect(result).toEqual({
                tab: "belajar",
                params: { featureKey: "doa" },
            });
        });

        test("handles aliases", () => {
            expect(parseDeepLink("thollabul-ilmi://explore/mufrodat").tab).toBe(
                "belajar",
            );
            expect(parseDeepLink("thollabul-ilmi://ilmu/tafsir").tab).toBe(
                "belajar",
            );
        });

        test("handles empty belajar link", () => {
            const result = parseDeepLink("thollabul-ilmi://belajar");
            expect(result).toEqual({ tab: "belajar", params: {} });
        });
    });

    describe("ibadah tab", () => {
        test("parses prayer (sholat)", () => {
            const result = parseDeepLink("thollabul-ilmi://ibadah/prayer");
            expect(result).toEqual({
                tab: "ibadah",
                params: { view: "prayer" },
            });
        });

        test("parses qibla via alias", () => {
            const result = parseDeepLink("thollabul-ilmi://kiblat");
            expect(result).toEqual({
                tab: "ibadah",
                params: { view: "qibla" },
            });
        });

        test("parses settings", () => {
            const result = parseDeepLink("thollabul-ilmi://ibadah/settings");
            expect(result).toEqual({
                tab: "ibadah",
                params: { view: "settings" },
            });
        });

        test("handles empty ibadah link", () => {
            const result = parseDeepLink("thollabul-ilmi://ibadah");
            expect(result).toEqual({ tab: "ibadah", params: {} });
        });
    });

    describe("profile tab", () => {
        test("parses profile settings", () => {
            const result = parseDeepLink("thollabul-ilmi://profile/settings");
            expect(result).toEqual({
                tab: "profile",
                params: { view: "settings" },
            });
        });

        test("parses profile account", () => {
            const result = parseDeepLink("thollabul-ilmi://profile/account");
            expect(result).toEqual({
                tab: "profile",
                params: { view: "settings-account" },
            });
        });

        test("handles empty profile link", () => {
            const result = parseDeepLink("thollabul-ilmi://profile");
            expect(result).toEqual({ tab: "profile", params: {} });
        });
    });

    describe("https URLs", () => {
        test("parses https URL with hash path", () => {
            const result = parseDeepLink(
                "https://app.thollabulilmi.com/#/quran/1",
            );
            expect(result).toEqual({
                tab: "quran",
                params: { surahNumber: 1, ayahNumber: null, surahSlug: "1" },
            });
        });
    });
});
