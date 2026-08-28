import {
    getTafsirAyahNumber,
    getTafsirArabic,
    getTafsirTranslation,
    getTafsirPrimary,
    getTafsirSecondary,
    normalizeTafsirEntry,
} from "@/lib/tafsirContent";

describe("getTafsirAyahNumber", () => {
    test("extracts from ayah.number", () => {
        expect(getTafsirAyahNumber({ ayah: { number: 5 } })).toBe(5);
    });
    test("extracts from ayah_number", () => {
        expect(getTafsirAyahNumber({ ayah_number: 10 })).toBe(10);
    });
    test("extracts from number", () => {
        expect(getTafsirAyahNumber({ number: 15 })).toBe(15);
    });
    test("returns null for empty entry", () => {
        expect(getTafsirAyahNumber({})).toBeNull();
    });
    test("returns null for no argument", () => {
        expect(getTafsirAyahNumber()).toBeNull();
    });
    test("priority: ayah.number > ayah_number > number", () => {
        expect(
            getTafsirAyahNumber({
                ayah: { number: 1 },
                ayah_number: 2,
                number: 3,
            }),
        ).toBe(1);
    });
});

describe("getTafsirArabic", () => {
    const entry = {
        ayah: { translation: { ar: "بِسْمِ اللَّهِ" } },
    };
    test("extracts from ayah.translation.ar", () => {
        expect(getTafsirArabic(entry)).toBe("بِسْمِ اللَّهِ");
    });
    test("falls back to ayah.translation.arab", () => {
        expect(
            getTafsirArabic({ ayah: { translation: { arab: "الرَّحْمَن" } } }),
        ).toBe("الرَّحْمَن");
    });
    test("falls back to ayah.arabic", () => {
        expect(getTafsirArabic({ ayah: { arabic: "الرَّحِيم" } })).toBe(
            "الرَّحِيم",
        );
    });
    test("falls back to entry.arabic", () => {
        expect(getTafsirArabic({ arabic: "مَلِك" })).toBe("مَلِك");
    });
    test("falls back to entry.arab", () => {
        expect(getTafsirArabic({ arab: "يَوْم" })).toBe("يَوْم");
    });
    test("returns empty string for empty entry", () => {
        expect(getTafsirArabic({})).toBe("");
    });
    test("trims whitespace", () => {
        expect(getTafsirArabic({ arab: "  testing  " })).toBe("testing");
    });
});

describe("getTafsirTranslation", () => {
    test("returns idn for ID lang", () => {
        const entry = {
            ayah: { translation: { idn: "indonesian", en: "english" } },
        };
        expect(getTafsirTranslation(entry, "ID")).toBe("indonesian");
    });
    test("returns en for EN lang", () => {
        const entry = {
            ayah: { translation: { idn: "indonesian", en: "english" } },
        };
        expect(getTafsirTranslation(entry, "EN")).toBe("english");
    });
    test("falls back to en for ID when idn missing", () => {
        const entry = { ayah: { translation: { en: "english" } } };
        expect(getTafsirTranslation(entry, "ID")).toBe("english");
    });
    test("falls back to idn for EN when en missing", () => {
        const entry = { ayah: { translation: { idn: "indonesian" } } };
        expect(getTafsirTranslation(entry, "EN")).toBe("indonesian");
    });
    test("falls back to entry.translation", () => {
        const entry = {
            ayah: { translation: {} },
            translation: { idn: "translation.idn" },
        };
        expect(getTafsirTranslation(entry, "ID")).toBe("translation.idn");
    });
    test("returns empty for empty entry", () => {
        expect(getTafsirTranslation({}, "ID")).toBe("");
    });
});

describe("getTafsirPrimary", () => {
    test("extracts kemenag.description_idn", () => {
        const entry = { kemenag: { description_idn: "deskripsi" } };
        expect(getTafsirPrimary(entry)).toBe("deskripsi");
    });
    test("falls back to entry.content", () => {
        expect(getTafsirPrimary({ content: "content" })).toBe("content");
    });
    test("falls back to entry.text", () => {
        expect(getTafsirPrimary({ text: "text" })).toBe("text");
    });
    test("falls back to entry.description", () => {
        expect(getTafsirPrimary({ description: "desc" })).toBe("desc");
    });
    test("returns empty for empty entry", () => {
        expect(getTafsirPrimary({})).toBe("");
    });
});

describe("getTafsirSecondary", () => {
    test("extracts ibnu_katsir.description_idn", () => {
        const entry = {
            ibnu_katsir: { description_idn: "tafsir ibnu katsir" },
        };
        expect(getTafsirSecondary(entry)).toBe("tafsir ibnu katsir");
    });
    test("falls back to ibnu_katsir.text_idn", () => {
        const entry = { ibnu_katsir: { text_idn: "teks ibnu katsir" } };
        expect(getTafsirSecondary(entry)).toBe("teks ibnu katsir");
    });
    test("returns empty for empty entry", () => {
        expect(getTafsirSecondary({})).toBe("");
    });
});

describe("normalizeTafsirEntry", () => {
    test("normalizes a complete entry", () => {
        const entry = {
            ayah: {
                number: 1,
                translation: { ar: "بِسْمِ اللَّهِ", idn: "Dengan nama Allah" },
            },
            kemenag: { description_idn: "Tafsir Kemenag" },
            ibnu_katsir: { description_idn: "Tafsir Ibnu Katsir" },
        };
        const result = normalizeTafsirEntry(entry, 0);
        expect(result.ayahNumber).toBe(1);
        expect(result.arabic).toBe("بِسْمِ اللَّهِ");
        expect(result.primaryTafsir).toBe("Tafsir Kemenag");
        expect(result.secondaryTafsir).toBe("Tafsir Ibnu Katsir");
    });

    test("uses index+1 when ayah number missing", () => {
        const entry = { content: "some tafsir" };
        const result = normalizeTafsirEntry(entry, 5);
        expect(result.ayahNumber).toBe(6);
    });

    test("spreads original properties", () => {
        const entry = { content: "text", extra: "property" };
        const result = normalizeTafsirEntry(entry, 0);
        expect(result.extra).toBe("property");
        expect(result.content).toBe("text");
    });
});
