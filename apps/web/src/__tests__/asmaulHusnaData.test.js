import {
    asmaulHusnaData,
    asmaulHusnaGeneralDalil,
} from "@/lib/asmaulHusnaData";

describe("asmaulHusnaData", () => {
    test("has complete 99 entries", () => {
        const keys = Object.keys(asmaulHusnaData);
        expect(keys.length).toBe(99);
        for (let i = 1; i <= 99; i++) {
            expect(asmaulHusnaData[i]).toBeDefined();
            expect(asmaulHusnaData[i].number).toBe(i);
            expect(asmaulHusnaData[i].latin).toBeTruthy();
            expect(asmaulHusnaData[i].arabic).toBeTruthy();
            expect(asmaulHusnaData[i].meaning_idn).toBeTruthy();
            expect(asmaulHusnaData[i].explanation).toBeTruthy();
            expect(asmaulHusnaData[i].dalilRef).toBeTruthy();
            expect(asmaulHusnaData[i].dalilTrans).toBeTruthy();
            expect(asmaulHusnaData[i].internalLink).toBeTruthy();
            expect(asmaulHusnaData[i].internalLink.startsWith("/")).toBe(true);
        }
    });

    test("general dalil contains hadith and quran", () => {
        expect(asmaulHusnaGeneralDalil.hadith.ref).toContain("Bukhari");
        expect(asmaulHusnaGeneralDalil.hadith.link).toBe("/hadith/bukhari/2736");
        expect(asmaulHusnaGeneralDalil.quran.ref).toContain("Al-A'raf: 180");
        expect(asmaulHusnaGeneralDalil.quran.link).toBe("/quran/surah/7#verse-180");
    });
});
