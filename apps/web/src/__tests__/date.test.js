import { toLocalISODate } from "@/lib/date";

describe("toLocalISODate", () => {
    test("formats a local calendar date without UTC shifting", () => {
        expect(toLocalISODate(new Date(2026, 4, 24, 0, 15))).toBe("2026-05-24");
    });
});
