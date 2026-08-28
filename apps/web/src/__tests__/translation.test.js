import {
    normalizeLang,
    getLocalizedTranslation,
    getLocalizedField,
    getLocalizedOption,
} from "@/lib/translation";

describe("normalizeLang", () => {
    test("returns ID for undefined", () => {
        expect(normalizeLang(undefined)).toBe("ID");
    });
    test('returns ID for "ID"', () => {
        expect(normalizeLang("ID")).toBe("ID");
    });
    test('returns ID for "id"', () => {
        expect(normalizeLang("id")).toBe("ID");
    });
    test('returns EN for "en"', () => {
        expect(normalizeLang("en")).toBe("EN");
    });
    test('returns EN for "EN"', () => {
        expect(normalizeLang("EN")).toBe("EN");
    });
});

describe("getLocalizedTranslation", () => {
    test("returns idn for id lang", () => {
        const t = { idn: "indonesian", en: "english" };
        expect(getLocalizedTranslation(t, "id")).toBe("indonesian");
    });
    test("returns en for en lang", () => {
        const t = { idn: "indonesian", en: "english" };
        expect(getLocalizedTranslation(t, "en")).toBe("english");
    });
    test("falls back to en when idn missing", () => {
        const t = { en: "english" };
        expect(getLocalizedTranslation(t, "id")).toBe("english");
    });
    test("falls back to idn when en missing", () => {
        const t = { idn: "indonesian" };
        expect(getLocalizedTranslation(t, "en")).toBe("indonesian");
    });
    test("returns empty string for null", () => {
        expect(getLocalizedTranslation(null, "id")).toBe("");
    });
    test("returns string value directly", () => {
        expect(getLocalizedTranslation("plain string", "id")).toBe(
            "plain string",
        );
    });
    test("returns empty string for empty object", () => {
        expect(getLocalizedTranslation({}, "id")).toBe("");
    });
    test("prefers primary keys in order", () => {
        const t = {
            idn: "idn",
            id: "id",
            indonesian: "indonesian",
            translation: "translation",
        };
        expect(getLocalizedTranslation(t, "id")).toBe("idn");
    });
    test("prefers english primary keys in order for EN", () => {
        const t = { en: "en", english: "english", latin_en: "latin_en" };
        expect(getLocalizedTranslation(t, "en")).toBe("en");
    });
});

describe("getLocalizedField", () => {
    test("returns empty string for null source", () => {
        expect(getLocalizedField(null, "name", "id")).toBe("");
    });
    test("finds field with _idn suffix", () => {
        const source = { name_idn: "nama", name_en: "name" };
        expect(getLocalizedField(source, "name", "id")).toBe("nama");
    });
    test("finds field with _en suffix for EN", () => {
        const source = { name_idn: "nama", name_en: "name" };
        expect(getLocalizedField(source, "name", "en")).toBe("name");
    });
    test("finds field with camelCase suffix", () => {
        const source = { nameIdn: "nama" };
        expect(getLocalizedField(source, "name", "id")).toBe("nama");
    });
    test("falls back to bare field", () => {
        const source = { name: "nama" };
        expect(getLocalizedField(source, "name", "id")).toBe("nama");
    });
    test("searches within translation container", () => {
        const source = { translation: { name_idn: "nama" } };
        expect(getLocalizedField(source, "name", "id")).toBe("nama");
    });
    test("searches within translations container", () => {
        const source = { translations: { name_en: "name" } };
        expect(getLocalizedField(source, "name", "en")).toBe("name");
    });
    test("uses fallbackFields", () => {
        const source = { title_idn: "judul" };
        expect(getLocalizedField(source, "name", "id", ["title"])).toBe(
            "judul",
        );
    });
});

describe("getLocalizedOption", () => {
    test("returns getLocalizedText for string option", () => {
        expect(getLocalizedOption({ idn: "indonesian" }, "id")).toBe(
            "indonesian",
        );
    });
    test("falls back to text field", () => {
        const option = { text_idn: "teks" };
        expect(getLocalizedOption(option, "id")).toBe("teks");
    });
    test("returns empty for empty object", () => {
        expect(getLocalizedOption({}, "id")).toBe("");
    });
});
