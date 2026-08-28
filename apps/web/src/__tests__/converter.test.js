import {
    ConvertToArabic,
    NumberToArabic,
    ConvertNameLanguage,
} from "@/lib/converter";

describe("ConvertToArabic", () => {
    test("converts 0 to ٠", () => {
        expect(ConvertToArabic("0")).toBe("٠");
    });
    test("converts 123 to ١٢٣", () => {
        expect(ConvertToArabic("123")).toBe("١٢٣");
    });
    test("converts number type", () => {
        expect(ConvertToArabic(456)).toBe("٤٥٦");
    });
    test("converts mixed text", () => {
        expect(ConvertToArabic("Surah 1")).toBe("Surah ١");
    });
    test("handles empty string", () => {
        expect(ConvertToArabic("")).toBe("");
    });
    test("converts all digits 0-9", () => {
        expect(ConvertToArabic("0123456789")).toBe("٠١٢٣٤٥٦٧٨٩");
    });
});

describe("NumberToArabic", () => {
    test("converts 0 to ٠", () => {
        expect(NumberToArabic(0)).toBe("٠");
    });
    test("converts 123 to ١٢٣", () => {
        expect(NumberToArabic(123)).toBe("١٢٣");
    });
    test("converts 6236 to ٦٢٣٦", () => {
        expect(NumberToArabic(6236)).toBe("٦٢٣٦");
    });
    test("converts all digits", () => {
        expect(NumberToArabic(9876543210)).toBe("٩٨٧٦٥٤٣٢١٠");
    });
});

describe("ConvertNameLanguage", () => {
    test('returns EN for "en"', () => {
        expect(ConvertNameLanguage("en")).toBe("EN");
    });
    test('returns EN for "EN"', () => {
        expect(ConvertNameLanguage("EN")).toBe("EN");
    });
    test('returns ID for "id"', () => {
        expect(ConvertNameLanguage("id")).toBe("ID");
    });
    test("returns empty string for unknown", () => {
        expect(ConvertNameLanguage("fr")).toBe("");
    });
});
