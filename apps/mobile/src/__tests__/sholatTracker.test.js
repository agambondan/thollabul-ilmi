const ORIGINAL_TZ = process.env.TZ;
process.env.TZ = "Asia/Jakarta";

jest.mock("lucide-react-native", () => {
    const icon = () => null;
    return new Proxy(
        {},
        {
            get: (target, prop) => {
                if (prop === "__esModule") return false;
                if (!target[prop]) target[prop] = icon;
                return target[prop];
            },
        },
    );
});

import React from "react";
import { fireEvent, render, within } from "@testing-library/react-native";

import {
    getLocalDateKey,
    normalizePrayerHistory,
    normalizePrayerStats,
    shiftLocalDateKey,
} from "../screens/ExploreScreen.helpers";
import {
    WebAppSholatTrackerRoute,
    buildLastSeven,
    buildMonthDays,
} from "../screens/explore/WebAppSholatTrackerRoute";

afterAll(() => {
    if (ORIGINAL_TZ === undefined) delete process.env.TZ;
    else process.env.TZ = ORIGINAL_TZ;
});

describe("local date keys (B16)", () => {
    test("05:00 WIB on 1 Oct is still 1 Oct, even though UTC says 30 Sep", () => {
        const subuh = new Date("2026-10-01T05:00:00+07:00");
        expect(subuh.toISOString().slice(0, 10)).toBe("2026-09-30");
        expect(getLocalDateKey(subuh)).toBe("2026-10-01");
    });

    test("shifts whole local days across month and year boundaries", () => {
        const now = new Date("2026-01-02T00:30:00+07:00");
        expect(shiftLocalDateKey(0, now)).toBe("2026-01-02");
        expect(shiftLocalDateKey(-1, now)).toBe("2026-01-01");
        expect(shiftLocalDateKey(-6, now)).toBe("2025-12-27");
        expect(shiftLocalDateKey(3, now)).toBe("2026-01-05");
    });
});

describe("prayer history normalization (B16)", () => {
    test("counts finished prayers per date and ignores missed or unknown entries", () => {
        const days = normalizePrayerHistory([
            { date: "2026-10-01", prayer: "subuh", status: "munfarid" },
            {
                date: "2026-10-01T00:00:00Z",
                prayer: "dzuhur",
                status: "berjamaah",
            },
            { date: "2026-10-01", prayer: "dzuhur", status: "qadha" },
            { date: "2026-10-01", prayer: "ashar", status: "missed" },
            { date: "2026-10-01", prayer: "tahajud", status: "munfarid" },
            { date: "2026-09-30", prayer: "isya", status: "munfarid" },
            { date: "", prayer: "subuh", status: "munfarid" },
            { date: "2026-09-29", prayer: "subuh" },
            null,
        ]);

        expect(days).toEqual({ "2026-09-30": 1, "2026-10-01": 2 });
    });

    test("returns an empty map for missing payloads", () => {
        expect(normalizePrayerHistory(undefined)).toEqual({});
        expect(normalizePrayerHistory({ data: [] })).toEqual({});
        expect(normalizePrayerHistory([])).toEqual({});
    });

    test("reads the stats payload and hides empty statistics", () => {
        expect(
            normalizePrayerStats({
                berjamaah_pct: 61.6,
                best_streak_days: 9,
                current_streak_days: 4,
                total_days: 21,
            }),
        ).toEqual({
            berjamaahPct: 62,
            bestStreak: 9,
            currentStreak: 4,
            totalDays: 21,
        });
        expect(normalizePrayerStats({ data: { total_days: 3 } })).toEqual({
            berjamaahPct: 0,
            bestStreak: 0,
            currentStreak: 0,
            totalDays: 3,
        });
        expect(normalizePrayerStats({})).toBeNull();
        expect(normalizePrayerStats({ total_days: 0 })).toBeNull();
        expect(normalizePrayerStats(null)).toBeNull();
    });
});

describe("tracker calendars use the recorded history (B16)", () => {
    const now = new Date("2026-10-15T10:00:00+07:00");

    test("the last seven days end today and mix live and recorded counts", () => {
        const rows = buildLastSeven(
            2,
            { "2026-10-14": 5, "2026-10-09": 4, "2026-10-15": 9 },
            now,
        );

        expect(rows.map((row) => row.date)).toEqual([
            "2026-10-09",
            "2026-10-10",
            "2026-10-11",
            "2026-10-12",
            "2026-10-13",
            "2026-10-14",
            "2026-10-15",
        ]);
        expect(rows.map((row) => row.count)).toEqual([4, 0, 0, 0, 0, 5, 2]);
    });

    test("the last seven days cross the month boundary by local date", () => {
        const earlyMorning = new Date("2026-10-01T05:00:00+07:00");
        const rows = buildLastSeven(1, { "2026-09-30": 5 }, earlyMorning);

        expect(rows[0].date).toBe("2026-09-25");
        expect(rows[5]).toEqual({ count: 5, date: "2026-09-30" });
        expect(rows[6]).toEqual({ count: 1, date: "2026-10-01" });
    });

    test("the month grid uses recorded days, flags today and future days", () => {
        const days = buildMonthDays(
            3,
            { "2026-10-03": 5, "2026-10-15": 9 },
            now,
        );

        expect(days).toHaveLength(31);
        expect(days[2]).toMatchObject({ count: 5, day: 3, future: false });
        expect(days[14]).toMatchObject({ count: 3, day: 15, today: true });
        expect(days[15]).toMatchObject({ count: 0, future: true });
    });
});

describe("Sholat Tracker route (B16)", () => {
    const renderRoute = (props = {}) =>
        render(<WebAppSholatTrackerRoute {...props} />);

    test("renders without history props", () => {
        const view = renderRoute();

        expect(view.getByText("7 Hari Terakhir")).toBeTruthy();
        expect(view.queryByTestId("web-app-sholat-login-notice")).toBeNull();
        expect(view.queryByTestId("web-app-sholat-stats")).toBeNull();
        expect(view.queryByTestId("web-app-sholat-history-empty")).toBeNull();
    });

    test("guests get the login notice and can still tap a prayer", () => {
        const togglePrayer = jest.fn();
        const view = renderRoute({ isGuest: true, togglePrayer });

        expect(
            within(view.getByTestId("web-app-sholat-login-notice")).getByText(
                "Buka Profil untuk masuk dan melacak sholat.",
            ),
        ).toBeTruthy();
        expect(view.queryByTestId("web-app-sholat-history-empty")).toBeNull();

        fireEvent.press(view.getAllByTestId("web-app-sholat-prayer-row")[1]);
        expect(togglePrayer).toHaveBeenCalledWith("dzuhur");
    });

    test("shows the empty history note only after the history loaded empty", () => {
        const view = renderRoute({
            sholatHistory: { days: {}, loaded: true, stats: null },
        });
        expect(view.getByTestId("web-app-sholat-history-empty")).toBeTruthy();

        const pending = renderRoute({
            sholatHistory: { days: {}, loaded: false, stats: null },
        });
        expect(
            pending.queryAllByTestId("web-app-sholat-history-empty"),
        ).toEqual([]);
    });

    test("shows summary statistics and hides the streak tile when there is none", () => {
        const withStreak = renderRoute({
            sholatHistory: {
                days: { "2026-10-14": 5 },
                loaded: true,
                stats: {
                    berjamaahPct: 70,
                    bestStreak: 8,
                    currentStreak: 3,
                    totalDays: 30,
                },
            },
        });
        const stats = within(withStreak.getByTestId("web-app-sholat-stats"));
        expect(stats.getByText("30")).toBeTruthy();
        expect(stats.getByText("70%")).toBeTruthy();
        expect(stats.getByText("3/8")).toBeTruthy();
        withStreak.unmount();

        const withoutStreak = renderRoute({
            sholatHistory: {
                days: {},
                loaded: true,
                stats: {
                    berjamaahPct: 10,
                    bestStreak: 0,
                    currentStreak: 0,
                    totalDays: 2,
                },
            },
        });
        const plain = within(withoutStreak.getByTestId("web-app-sholat-stats"));
        expect(plain.queryByText("0/0")).toBeNull();
        expect(plain.getByText("10%")).toBeTruthy();
    });
});
