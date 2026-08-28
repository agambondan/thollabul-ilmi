import {
    ayahIndex,
    dailyTarget,
    juzProgress,
    progressPct,
    TOTAL_AYAH,
} from "../utils/khatam";

describe("khatam utils", () => {
    test("calculates global ayah index", () => {
        expect(ayahIndex(1, 1)).toBe(1);
        expect(ayahIndex(2, 1)).toBe(8);
        expect(ayahIndex(114, 6)).toBe(TOTAL_AYAH);
    });

    test("calculates progress percentage", () => {
        expect(progressPct(1, 1)).toBeGreaterThan(0);
        expect(progressPct(114, 6)).toBe(100);
    });

    test("calculates juz progress and daily target", () => {
        expect(
            juzProgress(2, 142).find((item) => item.juz === 2).isCurrent,
        ).toBe(true);
        expect(dailyTarget(TOTAL_AYAH - 30, 30).ayahsPerDay).toBe(1);
    });
});
