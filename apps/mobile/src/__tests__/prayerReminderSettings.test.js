const mockPrefs = new Map();

jest.mock("../storage/preferences", () => ({
    preferenceKeys: {
        prayerAdjustments: "prayer-adjustments",
        prayerLocation: "prayer-location",
        prayerMadhab: "prayer-madhab",
        prayerMethod: "prayer-method",
        prayerReminderEnabled: "prayer-reminder-enabled",
        prayerReminderLeadMinutes: "prayer-reminder-lead-minutes",
        prayerReminderPrayers: "prayer-reminder-prayers",
        prayerScheduleCache: "prayer-schedule-cache",
    },
    readPreference: jest.fn(async (key, fallback) =>
        mockPrefs.has(key) ? mockPrefs.get(key) : fallback,
    ),
}));

import { readPreference } from "../storage/preferences";
import {
    buildAdjustedPrayerTimes,
    buildPrayerLabels,
    countReminderPrayers,
    createPrayerTimesResolver,
    defaultAdjustments,
    defaultReminderPrayers,
    hasUsablePrayerTimes,
    localDateKey,
    normalizeAdjustments,
    normalizePrayerMadhab,
    normalizePrayerMethod,
    normalizeReminderLead,
    normalizeReminderPrayers,
    normalizeSavedLocation,
    normalizeScheduleCache,
    readPrayerReminderSettings,
    scheduleCacheMatchesLocation,
} from "../utils/prayerReminderSettings";

const prayers = {
    imsak: "04:30",
    fajr: "04:40",
    sunrise: "05:50",
    dhuhr: "11:45",
    asr: "15:00",
    maghrib: "17:45",
    isha: "19:00",
};

const cacheRecord = (overrides = {}) => ({
    coords: { lat: -6.2, lng: 106.8 },
    date: "2026-10-01",
    madhab: "shafi",
    method: "kemenag",
    prayers,
    updatedAt: 1_700_000_000_000,
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    mockPrefs.clear();
});

describe("countReminderPrayers", () => {
    const entries = (list) =>
        list.flatMap((prayer) =>
            Array.from({ length: 7 }, (_, index) => ({
                id: `prayer-reminder:${prayer}:2026-10-0${index + 1}`,
                prayer,
            })),
        );

    test("counts prayers, not notifications", () => {
        expect(
            countReminderPrayers(
                entries(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
            ),
        ).toBe(5);
        expect(
            countReminderPrayers(entries(["dhuhr", "asr", "maghrib", "isha"])),
        ).toBe(4);
    });

    test("ignores entries without a prayer and tolerates bad input", () => {
        expect(
            countReminderPrayers([
                { id: "legacy", prayer: null },
                { id: "other" },
                null,
                undefined,
                "text",
                { id: "a", prayer: "fajr" },
            ]),
        ).toBe(1);
        expect(countReminderPrayers([])).toBe(0);
        expect(countReminderPrayers(null)).toBe(0);
        expect(countReminderPrayers(undefined)).toBe(0);
        expect(countReminderPrayers({ prayer: "fajr" })).toBe(0);
    });
});

describe("buildAdjustedPrayerTimes", () => {
    test("applies the per-prayer correction in minutes", () => {
        const result = buildAdjustedPrayerTimes(prayers, {
            ...defaultAdjustments,
            dhuhr: -1,
            isha: 5,
        });

        expect(result.dhuhr).toBe("11:44");
        expect(result.isha).toBe("19:05");
        expect(result.fajr).toBe("04:40");
        expect(Object.keys(result)).toEqual([
            "imsak",
            "fajr",
            "sunrise",
            "dhuhr",
            "asr",
            "maghrib",
            "isha",
        ]);
    });

    test("wraps around midnight and keeps values it cannot parse", () => {
        const result = buildAdjustedPrayerTimes(
            { ...prayers, fajr: "00:10", isha: "soon" },
            { ...defaultAdjustments, fajr: -30, isha: 10 },
        );

        expect(result.fajr).toBe("23:40");
        expect(result.isha).toBe("soon");
    });

    test("copes with a missing schedule or missing corrections", () => {
        expect(buildAdjustedPrayerTimes(prayers).asr).toBe("15:00");
        expect(buildAdjustedPrayerTimes(null, null).asr).toBeUndefined();
    });
});

describe("buildPrayerLabels", () => {
    test("translates every schedule row", () => {
        const labels = buildPrayerLabels((key) => `t(${key})`);

        expect(labels.fajr).toBe("t(prayer.name.fajr)");
        expect(labels.isha).toBe("t(prayer.name.isha)");
        expect(Object.keys(labels)).toHaveLength(7);
    });
});

describe("normalizers", () => {
    test("fall back to the same defaults the Prayer screen uses", () => {
        expect(normalizePrayerMethod("mwl")).toBe("mwl");
        expect(normalizePrayerMethod("unknown")).toBe("kemenag");
        expect(normalizePrayerMethod(null)).toBe("kemenag");
        expect(normalizePrayerMadhab("hanafi")).toBe("hanafi");
        expect(normalizePrayerMadhab("x")).toBe("shafi");
        expect(normalizeReminderLead(30)).toBe(30);
        expect(normalizeReminderLead(0)).toBe(0);
        expect(normalizeReminderLead(7)).toBe(10);
        expect(normalizeReminderLead("15")).toBe(10);
        expect(normalizeReminderLead(null)).toBe(10);
    });

    test("keep only known prayers and otherwise use the default five", () => {
        expect(normalizeReminderPrayers(["fajr", "isha"])).toEqual([
            "fajr",
            "isha",
        ]);
        expect(normalizeReminderPrayers(["fajr", "bogus", "asr"])).toEqual([
            "fajr",
            "asr",
        ]);
        expect(normalizeReminderPrayers(["imsak", "constructor"])).toEqual([
            "imsak",
        ]);
        expect(normalizeReminderPrayers(["bogus"])).toBe(
            defaultReminderPrayers,
        );
        expect(normalizeReminderPrayers([])).toBe(defaultReminderPrayers);
        expect(normalizeReminderPrayers(null)).toBe(defaultReminderPrayers);
        expect(normalizeReminderPrayers("fajr")).toBe(defaultReminderPrayers);
    });

    test("merge saved corrections over zeros", () => {
        expect(normalizeAdjustments(null)).toEqual(defaultAdjustments);
        expect(normalizeAdjustments(undefined)).toEqual(defaultAdjustments);
        expect(normalizeAdjustments({ fajr: 3 })).toEqual({
            ...defaultAdjustments,
            fajr: 3,
        });
        expect(normalizeAdjustments({ fajr: 3 })).not.toBe(defaultAdjustments);
    });
});

describe("schedule cache helpers", () => {
    test("hasUsablePrayerTimes needs the five daily prayers", () => {
        expect(hasUsablePrayerTimes(prayers)).toBe(true);
        expect(hasUsablePrayerTimes({ ...prayers, asr: undefined })).toBe(
            false,
        );
        expect(hasUsablePrayerTimes({ ...prayers, isha: "late" })).toBe(false);
        expect(hasUsablePrayerTimes(null)).toBe(false);
        expect(hasUsablePrayerTimes("04:40")).toBe(false);
    });

    test("normalizeScheduleCache keeps the useful fields of a valid record", () => {
        expect(normalizeScheduleCache(cacheRecord())).toEqual({
            coords: { lat: -6.2, lng: 106.8 },
            madhab: "shafi",
            method: "kemenag",
            prayers,
            updatedAt: 1_700_000_000_000,
        });
    });

    test.each([
        ["missing record", null],
        ["missing prayer", cacheRecord({ prayers: { ...prayers, asr: null } })],
        ["bad latitude", cacheRecord({ coords: { lat: 91, lng: 0 } })],
        ["text coordinates", cacheRecord({ coords: { lat: "1", lng: "2" } })],
        ["missing method", cacheRecord({ method: undefined })],
        ["missing madhab", cacheRecord({ madhab: 3 })],
        ["missing timestamp", cacheRecord({ updatedAt: "yesterday" })],
    ])("normalizeScheduleCache rejects %s", (_, value) => {
        expect(normalizeScheduleCache(value)).toBeNull();
    });

    test("normalizeSavedLocation accepts coordinates and defaults the source", () => {
        expect(
            normalizeSavedLocation({ lat: 1, lng: 2, source: "manual" }),
        ).toEqual({ lat: 1, lng: 2, source: "manual" });
        expect(normalizeSavedLocation({ lat: 1, lng: 2, source: "x" })).toEqual(
            {
                lat: 1,
                lng: 2,
                source: "gps",
            },
        );
        expect(normalizeSavedLocation({ lat: 1 })).toBeNull();
        expect(normalizeSavedLocation(null)).toBeNull();
    });

    test("scheduleCacheMatchesLocation allows a tenth of a degree", () => {
        const cache = normalizeScheduleCache(cacheRecord());

        expect(
            scheduleCacheMatchesLocation(cache, { lat: -6.2, lng: 106.8 }),
        ).toBe(true);
        expect(
            scheduleCacheMatchesLocation(cache, { lat: -6.25, lng: 106.75 }),
        ).toBe(true);
        expect(
            scheduleCacheMatchesLocation(cache, { lat: -6.31, lng: 106.8 }),
        ).toBe(false);
        expect(
            scheduleCacheMatchesLocation(cache, { lat: -6.2, lng: 107.0 }),
        ).toBe(false);
        expect(scheduleCacheMatchesLocation(null, { lat: 0, lng: 0 })).toBe(
            false,
        );
        expect(scheduleCacheMatchesLocation(cache, null)).toBe(false);
    });
});

describe("localDateKey", () => {
    test("formats the local calendar day with padding", () => {
        expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
        expect(localDateKey(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
    });
});

describe("createPrayerTimesResolver", () => {
    const options = (extra = {}) => ({
        adjustments: { ...defaultAdjustments, dhuhr: 2 },
        coords: { lat: -6.2, lng: 106.8 },
        lookup: jest.fn(async () => prayers),
        madhab: "shafi",
        method: "kemenag",
        ...extra,
    });

    test("needs both a location and a lookup", () => {
        expect(
            createPrayerTimesResolver(options({ coords: null })),
        ).toBeUndefined();
        expect(
            createPrayerTimesResolver(options({ coords: { lat: 1 } })),
        ).toBeUndefined();
        expect(
            createPrayerTimesResolver(options({ lookup: undefined })),
        ).toBeUndefined();
    });

    test("looks the day up by local date and applies the corrections", async () => {
        const config = options();
        const resolve = createPrayerTimesResolver(config);

        const result = await resolve(new Date(2026, 9, 3));

        expect(config.lookup).toHaveBeenCalledWith({
            date: "2026-10-03",
            lat: -6.2,
            lng: 106.8,
            madhab: "shafi",
            method: "kemenag",
        });
        expect(result.dhuhr).toBe("11:47");
        expect(result.fajr).toBe("04:40");
    });

    test.each([
        ["nothing stored", async () => null],
        ["undefined", async () => undefined],
        ["an unusable record", async () => ({ fajr: "04:40" })],
        [
            "a failing lookup",
            async () => {
                throw new Error("sqlite closed");
            },
        ],
        [
            "a synchronous throw",
            () => {
                throw new Error("boom");
            },
        ],
    ])("answers null for %s", async (_, lookup) => {
        const resolve = createPrayerTimesResolver(options({ lookup }));

        expect(await resolve(new Date(2026, 9, 3))).toBeNull();
    });
});

describe("readPrayerReminderSettings", () => {
    test("returns the screen defaults when nothing was saved", async () => {
        expect(await readPrayerReminderSettings()).toEqual({
            adjustments: defaultAdjustments,
            enabled: false,
            leadMinutes: 10,
            location: null,
            scheduleCache: null,
            selectedPrayers: defaultReminderPrayers,
        });
    });

    test("normalizes saved values", async () => {
        mockPrefs.set("prayer-reminder-enabled", true);
        mockPrefs.set("prayer-reminder-lead-minutes", 15);
        mockPrefs.set("prayer-reminder-prayers", ["fajr", "bogus", "isha"]);
        mockPrefs.set("prayer-adjustments", { asr: -2 });
        mockPrefs.set("prayer-location", {
            lat: -6.2,
            lng: 106.8,
            source: "manual",
        });
        mockPrefs.set("prayer-schedule-cache", cacheRecord());

        expect(await readPrayerReminderSettings()).toEqual({
            adjustments: { ...defaultAdjustments, asr: -2 },
            enabled: true,
            leadMinutes: 15,
            location: { lat: -6.2, lng: 106.8, source: "manual" },
            scheduleCache: normalizeScheduleCache(cacheRecord()),
            selectedPrayers: ["fajr", "isha"],
        });
    });

    test("ignores junk in storage", async () => {
        mockPrefs.set("prayer-reminder-enabled", "yes");
        mockPrefs.set("prayer-reminder-lead-minutes", 99);
        mockPrefs.set("prayer-reminder-prayers", "fajr");
        mockPrefs.set("prayer-adjustments", 5);
        mockPrefs.set("prayer-location", { lat: "x" });
        mockPrefs.set("prayer-schedule-cache", { prayers: {} });

        expect(await readPrayerReminderSettings()).toEqual({
            adjustments: defaultAdjustments,
            enabled: true,
            leadMinutes: 10,
            location: null,
            scheduleCache: null,
            selectedPrayers: defaultReminderPrayers,
        });
    });

    test("reads only the reminder related preferences", async () => {
        await readPrayerReminderSettings();

        expect(readPreference.mock.calls.map(([key]) => key).sort()).toEqual([
            "prayer-adjustments",
            "prayer-location",
            "prayer-reminder-enabled",
            "prayer-reminder-lead-minutes",
            "prayer-reminder-prayers",
            "prayer-schedule-cache",
        ]);
    });
});
