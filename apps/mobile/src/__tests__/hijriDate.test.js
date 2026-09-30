import {
    HIJRI_MONTH_NAMES,
    MIN_GREGORIAN_DATE,
    formatGregorianInput,
    formatHijriDate,
    formatHijriDateArabic,
    gregorianToHijri,
    parseGregorianInput,
    toLocalDateInput,
} from "../utils/hijriDate";

const convert = (year, month, day) =>
    formatHijriDate(gregorianToHijri({ day, month, year }));

describe("gregorianToHijri", () => {
    test.each([
        [2026, 9, 30, "17 Rabiul Akhir 1448 H"],
        [2026, 5, 29, "12 Dzulhijjah 1447 H"],
        [2027, 2, 8, "1 Ramadan 1448 H"],
        [2025, 3, 1, "1 Ramadan 1446 H"],
        [2024, 7, 7, "30 Dzulhijjah 1445 H"],
        [2026, 12, 31, "21 Rajab 1448 H"],
        [2000, 1, 1, "24 Ramadan 1420 H"],
        [1999, 12, 31, "23 Ramadan 1420 H"],
        [622, 7, 19, "1 Muharram 1 H"],
    ])(
        "matches the backend routine for %i-%i-%i",
        (year, month, day, expected) => {
            expect(convert(year, month, day)).toBe(expected);
        },
    );

    test("returns numeric parts and the month name", () => {
        expect(gregorianToHijri({ day: 30, month: 9, year: 2026 })).toEqual({
            day: 17,
            month: 4,
            monthName: "Rabiul Akhir",
            year: 1448,
        });
    });

    test("walks the calendar one day at a time without gaps or overlaps", () => {
        let previous = gregorianToHijri({ day: 1, month: 1, year: 2026 });
        const monthLengths = new Set();
        for (let offset = 1; offset <= 1100; offset += 1) {
            const date = new Date(Date.UTC(2026, 0, 1 + offset));
            const current = gregorianToHijri({
                day: date.getUTCDate(),
                month: date.getUTCMonth() + 1,
                year: date.getUTCFullYear(),
            });
            const sameMonth =
                current.year === previous.year &&
                current.month === previous.month;
            if (sameMonth) {
                expect(current.day).toBe(previous.day + 1);
            } else {
                monthLengths.add(previous.day);
                expect(current.day).toBe(1);
                const nextMonth =
                    previous.month === 12 ? 1 : previous.month + 1;
                const nextYear =
                    previous.month === 12 ? previous.year + 1 : previous.year;
                expect(current.month).toBe(nextMonth);
                expect(current.year).toBe(nextYear);
            }
            previous = current;
        }
        expect([...monthLengths].sort()).toEqual([29, 30]);
    });

    test("names all twelve Hijri months", () => {
        expect(HIJRI_MONTH_NAMES).toHaveLength(13);
        expect(HIJRI_MONTH_NAMES.slice(1).every(Boolean)).toBe(true);
    });
});

describe("Hijri date formatting", () => {
    const hijri = { day: 1, month: 9, monthName: "Ramadan", year: 1448 };

    test("formats Latin and Arabic-suffixed labels like the today card", () => {
        expect(formatHijriDate(hijri)).toBe("1 Ramadan 1448 H");
        expect(formatHijriDateArabic(hijri)).toBe("1 Ramadan 1448 هـ");
    });

    test("pads Gregorian input dates", () => {
        expect(formatGregorianInput({ day: 5, month: 9, year: 2026 })).toBe(
            "2026-09-05",
        );
        expect(formatGregorianInput({ day: 19, month: 7, year: 622 })).toBe(
            "0622-07-19",
        );
    });

    test("uses local calendar parts rather than the UTC date", () => {
        expect(toLocalDateInput(new Date(2026, 8, 30, 23, 59, 59))).toBe(
            "2026-09-30",
        );
        expect(toLocalDateInput(new Date(2026, 0, 1, 0, 0, 1))).toBe(
            "2026-01-01",
        );
    });
});

describe("parseGregorianInput", () => {
    test.each([
        ["2026-09-30", { day: 30, month: 9, year: 2026 }],
        ["  2026-09-30  ", { day: 30, month: 9, year: 2026 }],
        ["2026-9-5", { day: 5, month: 9, year: 2026 }],
        ["2026/09/30", { day: 30, month: 9, year: 2026 }],
        ["2026.09.30", { day: 30, month: 9, year: 2026 }],
        ["20260930", { day: 30, month: 9, year: 2026 }],
        ["30/09/2026", { day: 30, month: 9, year: 2026 }],
        ["30-09-2026", { day: 30, month: 9, year: 2026 }],
        ["5-9-2026", { day: 5, month: 9, year: 2026 }],
        ["2024-02-29", { day: 29, month: 2, year: 2024 }],
        ["0622-07-19", { day: 19, month: 7, year: 622 }],
    ])("accepts %j", (input, date) => {
        expect(parseGregorianInput(input)).toEqual({ date, ok: true });
    });

    test.each([
        [""],
        ["   "],
        [null],
        [undefined],
        ["abc"],
        ["2026-09"],
        ["2026-09-30-01"],
        ["12-05-99"],
        ["2026-09-300"],
        ["1234-05-2026"],
        ["2026 09 30"],
    ])("rejects the format of %j", (input) => {
        expect(parseGregorianInput(input)).toEqual({
            ok: false,
            reason: "format",
        });
    });

    test.each([
        ["2026-13-01"],
        ["2026-00-10"],
        ["2026-09-00"],
        ["2026-09-31"],
        ["2026-02-30"],
        ["2023-02-29"],
        ["1900-02-29"],
        ["31/04/2026"],
        ["99999999"],
    ])("rejects the calendar date of %j", (input) => {
        expect(parseGregorianInput(input)).toEqual({
            ok: false,
            reason: "date",
        });
    });

    test("rejects dates before the start of the Hijri calendar", () => {
        expect(MIN_GREGORIAN_DATE).toEqual({ day: 19, month: 7, year: 622 });
        expect(parseGregorianInput("0622-07-18")).toEqual({
            ok: false,
            reason: "range",
        });
        expect(parseGregorianInput("0001-01-01")).toEqual({
            ok: false,
            reason: "range",
        });
        expect(parseGregorianInput("0000-01-01")).toEqual({
            ok: false,
            reason: "range",
        });
    });

    test("keeps 2000 as a leap year and 1900 as a common year", () => {
        expect(parseGregorianInput("2000-02-29").ok).toBe(true);
        expect(parseGregorianInput("1900-02-29").ok).toBe(false);
    });

    test("parsed dates convert to the matching Hijri label", () => {
        const parsed = parseGregorianInput("08/02/2027");
        expect(parsed.ok).toBe(true);
        expect(formatHijriDate(gregorianToHijri(parsed.date))).toBe(
            "1 Ramadan 1448 H",
        );
    });
});
