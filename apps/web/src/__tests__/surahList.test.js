import {
    SURAH_LIST,
    findSurahByNumber,
    getSurahMeaning,
    getSurahName,
} from "@/lib/surahList";

describe("surahList helper", () => {
    test("SURAH_LIST contains 114 surahs with Indonesian names and meanings", () => {
        expect(SURAH_LIST).toHaveLength(114);
        expect(SURAH_LIST[0].name).toBe("Al-Fatihah");
        expect(SURAH_LIST[0].meaning).toBe("Pembukaan");
        expect(SURAH_LIST[1].name).toBe("Al-Baqarah");
        expect(SURAH_LIST[1].meaning).toBe("Sapi Betina");
        expect(SURAH_LIST[2].name).toBe("Ali 'Imran");
        expect(SURAH_LIST[2].meaning).toBe("Keluarga Imran");
    });

    test("findSurahByNumber finds correct surah", () => {
        expect(findSurahByNumber(1)?.name).toBe("Al-Fatihah");
        expect(findSurahByNumber(114)?.name).toBe("An-Nas");
        expect(findSurahByNumber(999)).toBeUndefined();
    });

    test("getSurahName returns Indonesian spelling when lang is ID or omitted", () => {
        const surah = {
            number: 1,
            translation: {
                latin_en: "Al-Faatiha",
                en: "The Opening",
            },
        };
        expect(getSurahName(surah, "ID")).toBe("Al-Fatihah");
        expect(getSurahName(surah)).toBe("Al-Fatihah");
    });

    test("getSurahName returns English transliteration when lang is EN", () => {
        const surah = {
            number: 1,
            translation: {
                latin_en: "Al-Faatiha",
                en: "The Opening",
            },
        };
        expect(getSurahName(surah, "EN")).toBe("Al-Faatiha");
    });

    test("getSurahMeaning returns Indonesian translation when lang is ID", () => {
        const surah = {
            number: 2,
            translation: {
                latin_en: "Al-Baqara",
                en: "The Cow",
                idn: "The Cow", // unlocalized raw backend data
            },
        };
        expect(getSurahMeaning(surah, "ID")).toBe("Sapi Betina");
    });

    test("getSurahMeaning returns English translation when lang is EN", () => {
        const surah = {
            number: 2,
            translation: {
                latin_en: "Al-Baqara",
                en: "The Cow",
            },
        };
        expect(getSurahMeaning(surah, "EN")).toBe("The Cow");
    });
});
