jest.mock("../api/client", () => ({
    requestJson: jest.fn(),
}));

import {
    IMSAKIYAH_MONTH_WINDOW,
    currentImsakiyahMonth,
    imsakiyahMonthDistance,
    imsakiyahMonthKey,
    parseImsakiyahMonth,
    shiftImsakiyahMonth,
} from "../utils/imsakiyah";

const { requestJson } = require("../api/client");
const { getImsakiyahMonth } = require("../api/imsakiyah");

describe("imsakiyah month helpers", () => {
    test("reads the month from an ISO date or month string", () => {
        expect(parseImsakiyahMonth("2026-09-30")).toEqual({
            month: 9,
            year: 2026,
        });
        expect(parseImsakiyahMonth("2027-02")).toEqual({
            month: 2,
            year: 2027,
        });
    });

    test("rejects dates it cannot place in a month", () => {
        expect(parseImsakiyahMonth("")).toBeNull();
        expect(parseImsakiyahMonth(null)).toBeNull();
        expect(parseImsakiyahMonth(undefined)).toBeNull();
        expect(parseImsakiyahMonth("2 Ramadan 1447")).toBeNull();
        expect(parseImsakiyahMonth("2026-13-01")).toBeNull();
        expect(parseImsakiyahMonth("2026-00-01")).toBeNull();
    });

    test("reads the current month from a local date", () => {
        expect(currentImsakiyahMonth(new Date(2026, 8, 30, 23, 59))).toEqual({
            month: 9,
            year: 2026,
        });
        expect(currentImsakiyahMonth(new Date(2027, 0, 1, 0, 1))).toEqual({
            month: 1,
            year: 2027,
        });
    });

    test("shifts months across year boundaries in both directions", () => {
        expect(shiftImsakiyahMonth({ month: 9, year: 2026 }, 1)).toEqual({
            month: 10,
            year: 2026,
        });
        expect(shiftImsakiyahMonth({ month: 12, year: 2026 }, 1)).toEqual({
            month: 1,
            year: 2027,
        });
        expect(shiftImsakiyahMonth({ month: 1, year: 2027 }, -1)).toEqual({
            month: 12,
            year: 2026,
        });
        expect(shiftImsakiyahMonth({ month: 9, year: 2026 }, 0)).toEqual({
            month: 9,
            year: 2026,
        });
        expect(shiftImsakiyahMonth({ month: 9, year: 2026 }, 12)).toEqual({
            month: 9,
            year: 2027,
        });
        expect(shiftImsakiyahMonth({ month: 9, year: 2026 }, -12)).toEqual({
            month: 9,
            year: 2025,
        });
        expect(shiftImsakiyahMonth({ month: 9, year: 2026 }, 29)).toEqual({
            month: 2,
            year: 2029,
        });
    });

    test("measures the distance between two months", () => {
        const base = { month: 9, year: 2026 };
        expect(imsakiyahMonthDistance(base, base)).toBe(0);
        expect(imsakiyahMonthDistance(base, { month: 2, year: 2027 })).toBe(5);
        expect(imsakiyahMonthDistance(base, { month: 2, year: 2026 })).toBe(-7);
        expect(IMSAKIYAH_MONTH_WINDOW).toBe(12);
    });

    test("builds a stable key for each month", () => {
        expect(imsakiyahMonthKey({ month: 3, year: 2026 })).toBe("2026-03");
        expect(imsakiyahMonthKey({ month: 12, year: 2026 })).toBe("2026-12");
    });
});

describe("getImsakiyahMonth", () => {
    beforeEach(() => {
        requestJson.mockReset();
    });

    test("requests the given year and month and returns the schedule", async () => {
        const schedule = [
            { date: "2027-02-01", prayers: { maghrib: "18:17" } },
            { date: "2027-02-02", prayers: { maghrib: "18:17" } },
        ];
        requestJson.mockResolvedValueOnce({
            year: 2027,
            month: 2,
            schedule,
        });

        await expect(
            getImsakiyahMonth({ month: 2, year: 2027 }),
        ).resolves.toEqual(schedule);
        expect(requestJson).toHaveBeenCalledWith(
            "/api/v1/imsakiyah?year=2027&month=2",
        );
    });

    test("unwraps a data envelope and bare arrays", async () => {
        const schedule = [{ date: "2027-03-01", prayers: {} }];
        requestJson.mockResolvedValueOnce({ data: { schedule } });
        await expect(
            getImsakiyahMonth({ month: 3, year: 2027 }),
        ).resolves.toEqual(schedule);

        requestJson.mockResolvedValueOnce(schedule);
        await expect(
            getImsakiyahMonth({ month: 4, year: 2027 }),
        ).resolves.toEqual(schedule);
    });

    test("returns an empty list for an unexpected payload", async () => {
        requestJson.mockResolvedValueOnce({ message: "ok" });
        await expect(
            getImsakiyahMonth({ month: 5, year: 2027 }),
        ).resolves.toEqual([]);
    });

    test("reuses a month that was already fetched", async () => {
        requestJson.mockResolvedValueOnce({
            schedule: [{ date: "2027-06-01", prayers: {} }],
        });

        await getImsakiyahMonth({ month: 6, year: 2027 });
        await getImsakiyahMonth({ month: 6, year: 2027 });

        expect(requestJson).toHaveBeenCalledTimes(1);
    });

    test("propagates request failures", async () => {
        requestJson.mockRejectedValueOnce(new Error("offline"));
        await expect(
            getImsakiyahMonth({ month: 7, year: 2027 }),
        ).rejects.toThrow("offline");
    });
});
