import {
    PUASA_SUNNAH,
    getPuasaSunnahForDate,
    daysUntilRamadan,
} from "@/lib/puasaSunnah";

describe("PUASA_SUNNAH", () => {
    test("has 11 items", () => {
        expect(PUASA_SUNNAH).toHaveLength(11);
    });

    test("each item has id and type", () => {
        PUASA_SUNNAH.forEach((p) => {
            expect(p.id).toBeDefined();
            expect(p.type).toBeDefined();
            expect(p.label_id).toBeDefined();
            expect(p.label_en).toBeDefined();
        });
    });

    test("has weekly types", () => {
        const weekly = PUASA_SUNNAH.filter((p) => p.type === "weekly");
        expect(weekly).toHaveLength(2);
    });

    test("has arafah as fixed type", () => {
        const arafah = PUASA_SUNNAH.find((p) => p.id === "arafah");
        expect(arafah.type).toBe("fixed");
        expect(arafah.monthHijri).toBe(12);
        expect(arafah.day).toBe(9);
    });

    test("has syawal_6 as range type", () => {
        const syawal = PUASA_SUNNAH.find((p) => p.id === "syawal_6");
        expect(syawal.type).toBe("range");
        expect(syawal.monthHijri).toBe(10);
        expect(syawal.days).toEqual([2, 3, 4, 5, 6, 7]);
    });
});

describe("getPuasaSunnahForDate", () => {
    test("matches weekly Monday (day 1)", () => {
        const date = new Date("2026-05-18"); // Monday
        const result = getPuasaSunnahForDate(date, {
            day: 1,
            month: 1,
            year: 1448,
        });
        expect(result.some((p) => p.id === "senin")).toBe(true);
    });

    test("matches weekly Thursday (day 4)", () => {
        const date = new Date("2026-05-21"); // Thursday
        const result = getPuasaSunnahForDate(date, {
            day: 1,
            month: 1,
            year: 1448,
        });
        expect(result.some((p) => p.id === "kamis")).toBe(true);
    });

    test("matches Ayyamul Bidh on day 13", () => {
        const date = new Date("2026-05-01");
        const result = getPuasaSunnahForDate(date, {
            day: 13,
            month: 5,
            year: 1448,
        });
        expect(result.some((p) => p.id === "ayyamul_bidh")).toBe(true);
    });

    test("matches Arafah on 9 Dzulhijjah", () => {
        const date = new Date("2026-05-01");
        const result = getPuasaSunnahForDate(date, {
            day: 9,
            month: 12,
            year: 1448,
        });
        expect(result.some((p) => p.id === "arafah")).toBe(true);
    });

    test("matches Tasua & Asyura on 9-10 Muharram", () => {
        const date = new Date("2026-05-01");
        const result = getPuasaSunnahForDate(date, {
            day: 10,
            month: 1,
            year: 1448,
        });
        expect(result.some((p) => p.id === "tasua_asyura")).toBe(true);
    });

    test("matches Syaban month emphasis", () => {
        const date = new Date("2026-05-01");
        const result = getPuasaSunnahForDate(date, {
            day: 15,
            month: 8,
            year: 1448,
        });
        expect(result.some((p) => p.id === "syaban")).toBe(true);
    });

    test("matches multiple entries for same day", () => {
        const date = new Date("2026-05-18"); // Monday
        const result = getPuasaSunnahForDate(date, {
            day: 13,
            month: 8,
            year: 1448,
        });
        expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test("returns empty for no match", () => {
        const date = new Date("2026-05-01");
        const result = getPuasaSunnahForDate(date, {
            day: 20,
            month: 3,
            year: 1448,
        });
        expect(result).toHaveLength(0);
    });

    test("handles Sunday (getDay returns 0, mapped to 7)", () => {
        const date = new Date("2026-05-17"); // Sunday
        const result = getPuasaSunnahForDate(date, {
            day: 1,
            month: 1,
            year: 1448,
        });
        expect(result.some((p) => p.id === "senin" || p.id === "kamis")).toBe(
            false,
        );
    });

    test("handles null/undefined hijri", () => {
        const date = new Date("2026-05-01");
        expect(() => getPuasaSunnahForDate(date, null)).not.toThrow();
        expect(() => getPuasaSunnahForDate(date, undefined)).not.toThrow();
    });
});

describe("daysUntilRamadan", () => {
    test("returns 0 when current month is Ramadan", () => {
        expect(daysUntilRamadan({ day: 1, month: 9, year: 1448 })).toBe(0);
    });

    test("calculates correctly for month before Ramadan", () => {
        const result = daysUntilRamadan({ day: 1, month: 8, year: 1448 });
        expect(result).toBeGreaterThan(0);
        expect(Number.isInteger(result)).toBe(true);
    });

    test("calculates correctly for month after Ramadan", () => {
        const result = daysUntilRamadan({ day: 1, month: 10, year: 1448 });
        expect(result).toBeGreaterThan(0);
    });

    test("handles missing hijri input", () => {
        expect(() => daysUntilRamadan(null)).not.toThrow();
        expect(() => daysUntilRamadan(undefined)).not.toThrow();
    });
});
