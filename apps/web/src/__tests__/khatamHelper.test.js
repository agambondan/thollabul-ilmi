import {
    TOTAL_AYAH,
    TOTAL_JUZ,
    SURAH_AYAH_COUNTS,
    ayahIndex,
    progressPct,
    getJuzBoundaries,
    juzProgress,
    dailyTarget,
} from "@/lib/khatamHelper";

describe("constants", () => {
    test("TOTAL_AYAH is 6236", () => {
        expect(TOTAL_AYAH).toBe(6236);
    });
    test("TOTAL_JUZ is 30", () => {
        expect(TOTAL_JUZ).toBe(30);
    });
    test("SURAH_AYAH_COUNTS has 114 entries", () => {
        expect(SURAH_AYAH_COUNTS).toHaveLength(114);
    });
    test("SURAH_AYAH_COUNTS sum equals TOTAL_AYAH", () => {
        const sum = SURAH_AYAH_COUNTS.reduce((s, c) => s + c, 0);
        expect(sum).toBe(TOTAL_AYAH);
    });
    test("first surah has 7 ayah", () => {
        expect(SURAH_AYAH_COUNTS[0]).toBe(7);
    });
    test("last surah has 6 ayah", () => {
        expect(SURAH_AYAH_COUNTS[113]).toBe(6);
    });
});

describe("ayahIndex", () => {
    test("surah 1 ayah 1 returns 1", () => {
        expect(ayahIndex(1, 1)).toBe(1);
    });
    test("surah 1 ayah 7 returns 7", () => {
        expect(ayahIndex(1, 7)).toBe(7);
    });
    test("surah 2 ayah 1 returns 8", () => {
        expect(ayahIndex(2, 1)).toBe(8);
    });
    test("surah 114 ayah 6 returns 6236", () => {
        expect(ayahIndex(114, 6)).toBe(6236);
    });
    test("clamps ayahNumber to surah max", () => {
        expect(ayahIndex(1, 100)).toBe(7);
    });
    test("clamps ayahNumber to minimum 1", () => {
        expect(ayahIndex(2, 0)).toBe(8);
    });
    test("returns 0 for invalid surah number < 1", () => {
        expect(ayahIndex(0, 1)).toBe(0);
    });
    test("returns 0 for invalid surah number > 114", () => {
        expect(ayahIndex(115, 1)).toBe(0);
    });
    test("handles string inputs", () => {
        expect(ayahIndex("2", "1")).toBe(8);
    });
});

describe("progressPct", () => {
    test("0% for start", () => {
        expect(progressPct(1, 1)).toBeCloseTo(0, 0);
    });
    test("~35% for surah 18 ayah 75", () => {
        expect(progressPct(18, 75)).toBeCloseTo(35.52, 1);
    });
    test("100% for end", () => {
        expect(progressPct(114, 6)).toBe(100);
    });
    test("capped at 100", () => {
        expect(progressPct(114, 100)).toBe(100);
    });
});

describe("getJuzBoundaries", () => {
    test("returns 30 juz", () => {
        expect(getJuzBoundaries()).toHaveLength(30);
    });
    test("first juz starts at surah 1 ayah 1", () => {
        expect(getJuzBoundaries()[0]).toMatchObject({
            juz: 1,
            startSurah: 1,
            startAyah: 1,
        });
    });
    test("last juz ends at surah 114 ayah 6", () => {
        const boundaries = getJuzBoundaries();
        expect(boundaries[29]).toMatchObject({
            juz: 30,
            endSurah: 114,
            endAyah: 6,
        });
    });
});

describe("juzProgress", () => {
    test("returns array of 30 items", () => {
        expect(juzProgress(1, 1)).toHaveLength(30);
    });
    test("juz 1 is current at position 1,1", () => {
        const result = juzProgress(1, 1);
        expect(result[0].isCurrent).toBe(true);
        expect(result[0].read).toBe(1);
    });
    test("juz 1 is current at position 2,141 (last ayah of juz 1)", () => {
        const result = juzProgress(2, 141);
        expect(result[0].isCurrent).toBe(true);
        expect(result[0].read).toBe(result[0].total);
        expect(result[0].pct).toBe(100);
    });

    test("juz 1 is complete past position 2,142", () => {
        const result = juzProgress(2, 142);
        expect(result[0].isCurrent).toBe(false);
        expect(result[0].read).toBe(result[0].total);
    });
    test("juz 30 not started at position 1,1", () => {
        const result = juzProgress(1, 1);
        expect(result[29].isCurrent).toBe(false);
        expect(result[29].read).toBe(0);
    });
    test("pct is rounded", () => {
        const result = juzProgress(2, 141);
        result.forEach((j) => {
            expect(Number.isInteger(j.pct)).toBe(true);
        });
    });
});

describe("dailyTarget", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-03-01"));
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    test("calculates target for future date", () => {
        const result = dailyTarget(1, new Date("2026-03-31"));
        expect(result.ayahsLeft).toBe(TOTAL_AYAH - 1);
        expect(result.daysLeft).toBeGreaterThan(0);
        expect(result.ayahsPerDay).toBeGreaterThan(0);
        expect(Number.isInteger(result.ayahsPerDay)).toBe(true);
    });

    test("0 days left for today", () => {
        const result = dailyTarget(5000, new Date("2026-03-01"));
        expect(result.daysLeft).toBe(0);
    });

    test("0 ayahs left if at end", () => {
        const result = dailyTarget(TOTAL_AYAH, new Date("2026-03-31"));
        expect(result.ayahsLeft).toBe(0);
    });
});
