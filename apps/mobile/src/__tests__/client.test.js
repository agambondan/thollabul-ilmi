import {
    pickItems,
    appendQuery,
    normalizeAyah,
    normalizeSurah,
    normalizeHadith,
    normalizeDoa,
    normalizeDictionary,
    normalizePerawi,
    normalizeKajian,
} from "../api/client";

describe("pickItems", () => {
    test("returns array directly", () => {
        expect(pickItems([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test("extracts from {items: [...]}", () => {
        expect(pickItems({ items: [1, 2] })).toEqual([1, 2]);
    });

    test("extracts from {data: {items: [...]}}", () => {
        expect(pickItems({ data: { items: ["a"] } })).toEqual(["a"]);
    });

    test("extracts from {data: [...]}", () => {
        expect(pickItems({ data: [1] })).toEqual([1]);
    });

    test("returns empty array for null", () => {
        expect(pickItems(null)).toEqual([]);
    });

    test("returns empty array for undefined", () => {
        expect(pickItems(undefined)).toEqual([]);
    });

    test("returns empty array for empty object", () => {
        expect(pickItems({})).toEqual([]);
    });
});

describe("appendQuery", () => {
    test("appends query param to clean path", () => {
        expect(appendQuery("/api/doa", "page", "2")).toBe("/api/doa?page=2");
    });

    test("appends query param to existing query", () => {
        expect(appendQuery("/api/doa?page=1", "size", "20")).toBe(
            "/api/doa?page=1&size=20",
        );
    });

    test("overwrites existing param", () => {
        expect(appendQuery("/api/doa?page=1", "page", "3")).toBe(
            "/api/doa?page=3",
        );
    });

    test("handles empty value", () => {
        expect(appendQuery("/api/test", "key", "")).toBe("/api/test?key=");
    });
});

describe("normalizeAyah", () => {
    test("normalizes full ayah with surah", () => {
        const result = normalizeAyah({
            id: 1,
            number: 2,
            surah: { number: 1, translation: { latin_en: "Al-Fatihah" } },
            translation: { ar: "arabic", idn: "indonesian" },
        });
        expect(result.surahNumber).toBe(1);
        expect(result.surahName).toBe("Al-Fatihah");
        expect(result.number).toBe(2);
        expect(result.translation).toBe("indonesian");
        expect(result.arabic).toBe("arabic");
    });

    test("handles flat fields without surah", () => {
        const result = normalizeAyah({
            surah_number: 1,
            ayah_number: 2,
            arabic: "نص",
            translation: "text",
        });
        expect(result.surahNumber).toBe(1);
        expect(result.number).toBe(2);
        expect(result.arabic).toBe("نص");
        expect(result.translation).toBe("text");
    });

    test("normalizes arabic from translation.ar", () => {
        const result = normalizeAyah({
            translation: { ar: "آيَة", idn: "ayat" },
        });
        expect(result.arabic).toBe("آيَة");
        expect(result.translation).toBe("ayat");
    });

    test("normalizes arabicHtml from ar_tajweed", () => {
        const result = normalizeAyah({
            translation: { ar_tajweed: "<tajweed>text</tajweed>" },
        });
        expect(result.arabicHtml).toBe("<tajweed>text</tajweed>");
    });

    test("handles translation as string", () => {
        const result = normalizeAyah({ translation: "plain text" });
        expect(result.translation).toBe("plain text");
    });

    test("handles null/undefined fields", () => {
        const result = normalizeAyah({});
        expect(result.id).toBeUndefined();
        expect(result.translation).toBe("");
        expect(result.arabic).toBe("");
        expect(result.surahName).toBe("");
    });
});

describe("normalizeSurah", () => {
    test("normalizes surah with translation", () => {
        const result = normalizeSurah({
            number: 1,
            translation: {
                latin_en: "Al-Fatihah",
                ar: "الفاتحة",
                idn: "Pembukaan",
                name_en: "The Opening",
            },
            jumlah_ayat: 7,
        });
        expect(result.number).toBe(1);
        expect(result.name).toBe("Al-Fatihah");
        expect(result.arabic).toBe("الفاتحة");
        expect(result.meaning).toBe("The Opening");
        expect(result.ayahs).toBe(7);
    });

    test("handles alternative field names", () => {
        const result = normalizeSurah({
            nomor_surah: 1,
            nama_latin: "Al-Fatihah",
            nama_arab: "الفاتحة",
            arti: "Pembukaan",
            count_ayah: 7,
        });
        expect(result.number).toBe(1);
        expect(result.name).toBe("Al-Fatihah");
        expect(result.arabic).toBe("الفاتحة");
        expect(result.meaning).toBe("Pembukaan");
        expect(result.ayahs).toBe(7);
    });

    test("handles empty input", () => {
        const result = normalizeSurah({});
        expect(result.name).toMatch(/^Surah/);
        expect(result.meaning).toBe("");
    });
});

describe("normalizeHadith", () => {
    test("normalizes with book object and translation", () => {
        const result = normalizeHadith({
            id: 1,
            number: 42,
            book: { name: "Bukhari", slug: "bukhari" },
            translation: { idn: "terjemahan", ar: "arabic", en: "translation" },
            grade: "Sahih",
        });
        expect(result.id).toBe(1);
        expect(result.number).toBe(42);
        expect(result.book).toBe("Bukhari");
        expect(result.bookSlug).toBe("bukhari");
        expect(result.translation).toBe("terjemahan");
        expect(result.grade).toBe("Sahih");
    });

    test("normalizes with chapter info", () => {
        const result = normalizeHadith({
            title: "Bab Iman",
            number: 1,
            chapter: {
                name: "Iman",
                translation: { en: "Faith", idn: "Keimanan" },
            },
            translation: { arab: "نص", text_en: "The text" },
            grade: "Hasan",
        });
        expect(result.title).toBe("Bab Iman");
        expect(result.chapterName).toBe("Faith");
        expect(result.translation).toBe("The text");
        expect(result.grade).toBe("Hasan");
    });

    test("handles flat book fields", () => {
        const result = normalizeHadith({
            id: 2,
            bookName: "Muslim",
            book_slug: "muslim",
            matan_arab: "نص عربي",
            matan_terjemahan: "terjemahan",
        });
        expect(result.book).toBe("Muslim");
        expect(result.bookSlug).toBe("muslim");
        expect(result.arabic).toBe("نص عربي");
        expect(result.translation).toBe("terjemahan");
    });

    test("handles translation as string", () => {
        const result = normalizeHadith({
            number: 1,
            translation: "direct text",
        });
        expect(result.translation).toBe("direct text");
    });

    test("sanad field", () => {
        const result = normalizeHadith({
            id: 99,
            number: 5,
            sanad: "Anas bin Malik",
        });
        expect(result.sanad).toBe("Anas bin Malik");
    });
});

describe("normalizeDoa", () => {
    test("normalizes with all fields", () => {
        const result = normalizeDoa({
            id: 1,
            title: "Doa Tidur",
            arabic: "بِسْمِكَ",
            translation: { idn: "artinya" },
            category: "Tidur",
            source: "HR. Bukhari",
        });
        expect(result.id).toBe(1);
        expect(result.title).toBe("Doa Tidur");
        expect(result.arabic).toBe("بِسْمِكَ");
        expect(result.body).toBe("artinya");
        expect(result.meta).toBe("Tidur · HR. Bukhari");
    });

    test("handles flat fields", () => {
        const result = normalizeDoa({
            slug: "doa-tidur",
            nama: "Doa Tidur",
            arab: "نص",
            translation: "terjemahan",
        });
        expect(result.id).toBe("doa-tidur");
        expect(result.title).toBe("Doa Tidur");
        expect(result.arabic).toBe("نص");
        expect(result.body).toBe("terjemahan");
    });

    test("falls back to defaults for empty input", () => {
        const result = normalizeDoa({});
        expect(result.title).toBe("Doa");
        expect(result.meta).toBe("");
    });
});

describe("normalizeDictionary", () => {
    test("normalizes dictionary entry", () => {
        const result = normalizeDictionary({
            id: 1,
            term: "Iman",
            definition: "Percaya",
            category: "Aqidah",
            origin: "Arab",
        });
        expect(result.id).toBe(1);
        expect(result.title).toBe("Iman");
        expect(result.body).toBe("Percaya");
        expect(result.category).toBe("Aqidah");
        expect(result.meta).toBe("Aqidah · Arab");
    });

    test("extracts body from translation", () => {
        const result = normalizeDictionary({
            term: "Taqwa",
            translation: { idn: "Takut kepada Allah" },
        });
        expect(result.title).toBe("Taqwa");
        expect(result.body).toBe("Takut kepada Allah");
    });

    test("empty input defaults", () => {
        const result = normalizeDictionary({});
        expect(result.title).toBe("Istilah");
        expect(result.body).toBe("");
        expect(result.meta).toBe("");
    });
});

describe("normalizePerawi", () => {
    test("normalizes perawi", () => {
        const result = normalizePerawi({
            id: 1,
            nama_latin: "Bukhari",
            nama_arab: "البخاري",
            nama_lengkap: "Muhammad bin Ismail",
            status: "Tsiqah",
            tabaqah: "Tabii",
        });
        expect(result.id).toBe(1);
        expect(result.title).toBe("Bukhari");
        expect(result.body).toBe("Muhammad bin Ismail");
        expect(result.status).toBe("Tsiqah");
        expect(result.tabaqah).toBe("Tabii");
        expect(result.meta).toBe("Tsiqah · Tabii");
    });

    test("empty input defaults", () => {
        const result = normalizePerawi({});
        expect(result.title).toBe("Perawi");
        expect(result.body).toBe("");
        expect(result.meta).toBe("");
    });
});

describe("normalizeKajian", () => {
    test("normalizes kajian with all fields", () => {
        const result = normalizeKajian({
            id: 1,
            title: "Tafsir Juz 30",
            summary: "Pembahasan tentang juz 30",
            speaker: "Ustadz A",
            category: "Tafsir",
            date: "2025-01-01",
        });
        expect(result.id).toBe(1);
        expect(result.title).toBe("Tafsir Juz 30");
        expect(result.body).toBe("Pembahasan tentang juz 30");
        expect(result.meta).toBe("Ustadz A · Tafsir · 2025-01-01");
    });

    test("empty input defaults", () => {
        const result = normalizeKajian({});
        expect(result.title).toBe("Kajian");
        expect(result.body).toBe("");
        expect(result.meta).toBe("");
    });
});
