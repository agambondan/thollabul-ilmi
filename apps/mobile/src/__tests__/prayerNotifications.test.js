import { Platform } from "react-native";
import { translateMobile } from "../i18n/translations";
import {
    notificationsSupported,
    cancelPrayerReminders,
    checkPrayerNotificationPermission,
    ensurePrayerNotificationPermission,
    listPrayerReminders,
    schedulePrayerReminders,
    showPrayerTimeNotification,
    syncPrayerReminders,
    MAX_PENDING_PRAYER_REMINDERS,
    PRAYER_REMINDER_CHANNEL_ID,
    REMINDER_HORIZON_DAYS,
} from "../utils/prayerNotifications";

const mockStore = new Map();
const mockTrace = [];
let mockAutoId = 0;

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 0));

const mockScheduleNotificationAsync = jest.fn(async (request) => {
    await mockDelay();
    const id = request.identifier ?? `auto-${++mockAutoId}`;
    mockTrace.push(`schedule:${id}`);
    mockStore.set(id, {
        identifier: id,
        content: request.content,
        trigger: request.trigger,
    });
    return id;
});
const mockCancelScheduledNotificationAsync = jest.fn(async (id) => {
    await mockDelay();
    mockTrace.push(`cancel:${id}`);
    mockStore.delete(id);
});
const mockGetAllScheduledNotificationsAsync = jest.fn(async () => {
    mockTrace.push("list");
    await mockDelay();
    return [...mockStore.values()];
});
const mockGetPermissionsAsync = jest.fn(() =>
    Promise.resolve({ granted: true }),
);
const mockRequestPermissionsAsync = jest.fn(() =>
    Promise.resolve({ granted: true }),
);
const mockSetNotificationChannelAsync = jest.fn(() => Promise.resolve());

jest.mock(
    "expo-notifications",
    () => ({
        setNotificationHandler: jest.fn(),
        getPermissionsAsync: (...args) => mockGetPermissionsAsync(...args),
        requestPermissionsAsync: (...args) =>
            mockRequestPermissionsAsync(...args),
        setNotificationChannelAsync: (...args) =>
            mockSetNotificationChannelAsync(...args),
        scheduleNotificationAsync: (...args) =>
            mockScheduleNotificationAsync(...args),
        getAllScheduledNotificationsAsync: (...args) =>
            mockGetAllScheduledNotificationsAsync(...args),
        cancelScheduledNotificationAsync: (...args) =>
            mockCancelScheduledNotificationAsync(...args),
        IosAuthorizationStatus: { PROVISIONAL: 1 },
        AndroidImportance: { HIGH: 4 },
        SchedulableTriggerInputTypes: { DATE: "date" },
    }),
    { virtual: false },
);

const englishTranslate = (key, values) => translateMobile("en", key, values);

const reminderPlan = (overrides = {}) => ({
    leadMinutes: 10,
    labels: {
        fajr: "Subuh",
        dhuhr: "Dzuhur",
        asr: "Asr",
        maghrib: "Maghrib",
        isha: "Isya",
    },
    selectedPrayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
    times: {
        fajr: "04:20",
        dhuhr: "11:43",
        asr: "14:49",
        maghrib: "17:47",
        isha: "18:56",
    },
    ...overrides,
});

const seedOrphanReminders = (count) => {
    for (let index = 0; index < count; index += 1) {
        const id = `orphan-${index}-0000-4000-8000-000000000000`;
        mockStore.set(id, {
            identifier: id,
            content: { data: { prayer: "maghrib", type: "prayer_reminder" } },
            trigger: { type: "date" },
        });
    }
};

const reminderIds = () =>
    [...mockStore.values()]
        .filter((request) => request.content?.data?.type === "prayer_reminder")
        .map((request) => request.identifier);

const windowSize = (prayers = 5) => prayers * REMINDER_HORIZON_DAYS;

const dateKey = (year, month, day) =>
    `${year}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;

const idsFor = (prayer, dates) =>
    dates.map(
        ([year, month, day]) =>
            `prayer-reminder:${prayer}:${dateKey(year, month, day)}`,
    );

const daysFrom = (year, month, day, count) =>
    Array.from({ length: count }, (_, offset) => {
        const date = new Date(year, month - 1, day + offset);
        return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
    });

const snapshotStore = () =>
    [...mockStore.values()]
        .map((request) => ({
            body: request.content?.body,
            id: request.identifier,
            fireAt: request.trigger?.date?.toISOString?.(),
            prayer: request.content?.data?.prayer,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

beforeEach(() => {
    jest.clearAllMocks();
    mockStore.clear();
    mockTrace.length = 0;
    mockAutoId = 0;
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    Platform.OS = "ios";
});

afterEach(() => {
    jest.useRealTimers();
});

const freezeClock = (date) =>
    jest.useFakeTimers({
        now: date,
        doNotFake: [
            "hrtime",
            "nextTick",
            "performance",
            "queueMicrotask",
            "requestAnimationFrame",
            "cancelAnimationFrame",
            "requestIdleCallback",
            "cancelIdleCallback",
            "setImmediate",
            "clearImmediate",
            "setInterval",
            "clearInterval",
            "setTimeout",
            "clearTimeout",
        ],
    });

describe("PRAYER_REMINDER_CHANNEL_ID", () => {
    test("is set to prayer-reminders", () => {
        expect(PRAYER_REMINDER_CHANNEL_ID).toBe("prayer-reminders");
    });
});

describe("notificationsSupported", () => {
    test("returns true on native", () => {
        Platform.OS = "android";
        expect(notificationsSupported()).toBe(true);
        Platform.OS = "ios";
        expect(notificationsSupported()).toBe(true);
    });

    test("returns false on web", () => {
        Platform.OS = "web";
        expect(notificationsSupported()).toBe(false);
        Platform.OS = "ios";
    });
});

describe("schedulePrayerReminders", () => {
    test("schedules reminders for selected prayers", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ granted: true });

        const result = await schedulePrayerReminders({
            leadMinutes: 10,
            labels: { fajr: "Fajr", dhuhr: "Dhuhr" },
            previous: ["old-id"],
            selectedPrayers: ["fajr", "dhuhr"],
            times: { fajr: "05:00", dhuhr: "12:30" },
        });

        expect(result.status).toBe("scheduled");
        expect(result.scheduled).toHaveLength(windowSize(2));
        expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
            "old-id",
        );
        expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(
            windowSize(2),
        );
    });

    test("returns denied status when permission not granted", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ granted: false });
        mockRequestPermissionsAsync.mockResolvedValue({ granted: false });

        const result = await schedulePrayerReminders({
            leadMinutes: 10,
            labels: {},
            previous: [],
            selectedPrayers: ["fajr"],
            times: { fajr: "05:00" },
        });

        expect(result.status).toBe("denied");
        expect(result.scheduled).toEqual([]);
    });

    test("skips prayers with invalid time", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ granted: true });

        const result = await schedulePrayerReminders({
            leadMinutes: 10,
            labels: { fajr: "Fajr", invalid: "Invalid" },
            previous: [],
            selectedPrayers: ["fajr", "invalid"],
            times: { fajr: "05:00", invalid: null },
        });

        expect(result.status).toBe("scheduled");
        expect(result.scheduled).toHaveLength(windowSize(1));
        expect(result.scheduled[0].prayer).toBe("fajr");
        expect(result.scheduled.every((item) => item.prayer === "fajr")).toBe(
            true,
        );
    });
});

describe("syncPrayerReminders", () => {
    test("schedules the whole window for every selected prayer with deterministic identifiers", async () => {
        const result = await syncPrayerReminders(reminderPlan());

        expect(result.status).toBe("scheduled");
        expect(result.scheduled).toHaveLength(windowSize());
        expect(mockStore.size).toBe(windowSize());
        const ids = reminderIds();
        expect(new Set(ids).size).toBe(windowSize());
        ids.forEach((id) =>
            expect(id).toMatch(
                /^prayer-reminder:(fajr|dhuhr|asr|maghrib|isha):\d{4}-\d{2}-\d{2}$/,
            ),
        );
        expect(new Set(ids.map((id) => id.split(":")[1]))).toEqual(
            new Set(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
        );
        ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((prayer) =>
            expect(
                ids.filter((id) => id.split(":")[1] === prayer),
            ).toHaveLength(REMINDER_HORIZON_DAYS),
        );
    });

    test("builds identifiers from the prayer and the trigger date", async () => {
        freezeClock(new Date(2026, 8, 30, 17, 40, 0));

        const result = await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["maghrib", "isha"] }),
        );

        expect(result.scheduled.map((item) => item.id).sort()).toEqual(
            [
                ...idsFor("isha", daysFrom(2026, 9, 30, 7)),
                ...idsFor("maghrib", daysFrom(2026, 10, 1, 7)),
            ].sort(),
        );
    });

    test("is idempotent when called repeatedly", async () => {
        freezeClock(new Date(2026, 8, 30, 10, 0, 0));

        await syncPrayerReminders(reminderPlan());
        const first = reminderIds().sort();

        await syncPrayerReminders(reminderPlan());
        await syncPrayerReminders(reminderPlan());

        expect(reminderIds().sort()).toEqual(first);
        expect(mockStore.size).toBe(windowSize());
    });

    test("serializes concurrent syncs so they never interleave", async () => {
        freezeClock(new Date(2026, 8, 30, 10, 0, 0));

        await Promise.all([
            syncPrayerReminders(reminderPlan()),
            syncPrayerReminders(reminderPlan()),
            syncPrayerReminders(reminderPlan()),
        ]);

        expect(mockStore.size).toBe(windowSize());
        const listPositions = mockTrace
            .map((entry, index) => (entry === "list" ? index : -1))
            .filter((index) => index >= 0);
        const perSync = windowSize() + 1;
        expect(listPositions).toEqual([0, perSync, perSync * 2]);
    });

    test("lets the last request win when enable and disable race", async () => {
        await Promise.all([
            syncPrayerReminders(reminderPlan()),
            syncPrayerReminders({ enabled: false }),
        ]);
        expect(reminderIds()).toEqual([]);

        await Promise.all([
            syncPrayerReminders({ enabled: false }),
            syncPrayerReminders(reminderPlan()),
        ]);
        expect(reminderIds()).toHaveLength(windowSize());
    });

    test("removes legacy orphans with random identifiers and keeps other notifications", async () => {
        seedOrphanReminders(5);
        mockStore.set("smart-1", {
            identifier: "smart-1",
            content: { data: { type: "smart_reminder" } },
            trigger: {},
        });

        const result = await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["maghrib"] }),
        );

        expect(result.scheduled).toHaveLength(windowSize(1));
        expect(reminderIds()).toHaveLength(windowSize(1));
        expect(reminderIds().some((id) => id.startsWith("orphan-"))).toBe(
            false,
        );
        expect(mockStore.has("smart-1")).toBe(true);
        expect(mockStore.size).toBe(windowSize(1) + 1);
    });

    test("cancels every reminder when disabled without asking for permission", async () => {
        await syncPrayerReminders(reminderPlan());
        seedOrphanReminders(3);
        mockGetPermissionsAsync.mockClear();
        mockRequestPermissionsAsync.mockClear();

        const result = await syncPrayerReminders({ enabled: false });

        expect(result).toEqual({ scheduled: [], status: "disabled" });
        expect(reminderIds()).toEqual([]);
        expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    test("reschedules without growth when lead, prayers or times change", async () => {
        await syncPrayerReminders(reminderPlan());
        await syncPrayerReminders(reminderPlan({ leadMinutes: 0 }));
        expect(reminderIds()).toHaveLength(windowSize());

        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["fajr", "isha"] }),
        );
        expect(reminderIds()).toHaveLength(windowSize(2));

        await syncPrayerReminders(
            reminderPlan({
                times: { ...reminderPlan().times, fajr: "04:25" },
            }),
        );
        expect(reminderIds()).toHaveLength(windowSize());
        expect(mockStore.size).toBe(windowSize());
    });

    test("prunes the old reminders when the fire dates move to other days", async () => {
        freezeClock(new Date(2026, 8, 30, 17, 40, 0));

        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["maghrib"], leadMinutes: 10 }),
        );
        expect(reminderIds().sort()).toEqual(
            idsFor("maghrib", daysFrom(2026, 10, 1, 7)),
        );

        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["maghrib"], leadMinutes: 5 }),
        );
        expect(reminderIds().sort()).toEqual(
            idsFor("maghrib", daysFrom(2026, 9, 30, 7)),
        );
    });

    test("uses Indonesian text by default and follows the given translator", async () => {
        const plan = reminderPlan({ selectedPrayers: ["maghrib"] });

        await syncPrayerReminders(plan);
        let [request] = [...mockStore.values()];
        expect(request.content.title).toBe("Pengingat Maghrib");
        expect(request.content.body).toBe("Waktu Maghrib masuk pukul 17:47.");

        await syncPrayerReminders({ ...plan, t: englishTranslate });
        [request] = [...mockStore.values()];
        expect(request.content.title).toBe("Maghrib Reminder");
        expect(request.content.body).toBe("Maghrib starts at 17:47.");

        await syncPrayerReminders({
            ...plan,
            leadMinutes: 0,
            t: englishTranslate,
        });
        [request] = [...mockStore.values()];
        expect(request.content.body).toBe("Maghrib time is now.");

        await syncPrayerReminders({ ...plan, leadMinutes: 0 });
        [request] = [...mockStore.values()];
        expect(request.content.body).toBe("Waktu Maghrib telah tiba.");
        expect(mockStore.size).toBe(windowSize(1));
        expect(
            [...mockStore.values()].every(
                (item) => item.content.body === "Waktu Maghrib telah tiba.",
            ),
        ).toBe(true);
    });

    test("tags reminders so they can be found again", async () => {
        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["fajr"], leadMinutes: 15 }),
        );

        const [request] = [...mockStore.values()];
        expect(request.content.data).toEqual({
            prayer: "fajr",
            type: "prayer_reminder",
            url: "thullaabulilmi://prayer",
        });
        expect(request.trigger).toEqual(
            expect.objectContaining({
                channelId: PRAYER_REMINDER_CHANNEL_ID,
                type: "date",
            }),
        );
    });

    test("clears its own reminders and keeps unrelated ones when permission is refused", async () => {
        seedOrphanReminders(2);
        mockStore.set("smart-1", {
            identifier: "smart-1",
            content: { data: { type: "smart_reminder" } },
            trigger: {},
        });
        mockGetPermissionsAsync.mockResolvedValue({ granted: false });
        mockRequestPermissionsAsync.mockResolvedValue({ granted: false });

        const result = await syncPrayerReminders(reminderPlan());

        expect(result).toEqual({ scheduled: [], status: "denied" });
        expect(reminderIds()).toEqual([]);
        expect(mockStore.has("smart-1")).toBe(true);
    });

    test("reports unsupported on web without touching the native module", async () => {
        Platform.OS = "web";

        const result = await syncPrayerReminders(reminderPlan());

        expect(result).toEqual({ scheduled: [], status: "unsupported" });
        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(mockGetAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    });

    test("keeps working after a scheduling failure", async () => {
        mockScheduleNotificationAsync.mockRejectedValueOnce(
            new Error("native failure"),
        );

        await expect(syncPrayerReminders(reminderPlan())).rejects.toThrow(
            "native failure",
        );
        const result = await syncPrayerReminders(reminderPlan());

        expect(result.scheduled).toHaveLength(windowSize());
        expect(reminderIds()).toHaveLength(windowSize());
    });

    test("still schedules when the native list call fails", async () => {
        mockGetAllScheduledNotificationsAsync.mockRejectedValueOnce(
            new Error("list failed"),
        );

        const result = await syncPrayerReminders(reminderPlan());

        expect(result.status).toBe("scheduled");
        expect(reminderIds()).toHaveLength(windowSize());
    });
});

describe("multi-day reminder window", () => {
    const localDate = (year, month, day, hour, minute, second = 0, ms = 0) =>
        new Date(year, month - 1, day, hour, minute, second, ms);
    const allPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

    test("exposes the horizon and the hard cap", () => {
        expect(REMINDER_HORIZON_DAYS).toBe(7);
        expect(MAX_PENDING_PRAYER_REMINDERS).toBe(60);
        expect(windowSize()).toBeLessThanOrEqual(MAX_PENDING_PRAYER_REMINDERS);
    });

    test("schedules seven consecutive days per prayer at the right moments", async () => {
        freezeClock(localDate(2026, 10, 1, 3, 0));

        const result = await syncPrayerReminders(reminderPlan());

        const { times } = reminderPlan();
        allPrayers.forEach((prayer) => {
            const [hour, minute] = times[prayer].split(":").map(Number);
            const items = result.scheduled.filter(
                (item) => item.prayer === prayer,
            );
            expect(items.map((item) => item.id)).toEqual(
                idsFor(prayer, daysFrom(2026, 10, 1, 7)),
            );
            expect(items.map((item) => item.fireAt)).toEqual(
                daysFrom(2026, 10, 1, 7).map(([year, month, day]) =>
                    localDate(
                        year,
                        month,
                        day,
                        hour,
                        minute - 10,
                    ).toISOString(),
                ),
            );
        });

        const request = mockStore.get("prayer-reminder:asr:2026-10-04");
        expect(request.trigger).toEqual({
            channelId: PRAYER_REMINDER_CHANNEL_ID,
            date: localDate(2026, 10, 4, 14, 39),
            type: "date",
        });
    });

    test("starts tomorrow for a time that passed today and never doubles a day", async () => {
        freezeClock(localDate(2026, 9, 30, 17, 40));

        const result = await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["fajr", "maghrib", "isha"] }),
        );

        const idsOf = (prayer) =>
            result.scheduled
                .filter((item) => item.prayer === prayer)
                .map((item) => item.id);
        expect(idsOf("fajr")).toEqual(idsFor("fajr", daysFrom(2026, 10, 1, 7)));
        expect(idsOf("maghrib")).toEqual(
            idsFor("maghrib", daysFrom(2026, 10, 1, 7)),
        );
        expect(idsOf("isha")).toEqual(idsFor("isha", daysFrom(2026, 9, 30, 7)));
        expect(new Set(result.scheduled.map((item) => item.id)).size).toBe(
            windowSize(3),
        );
        expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(
            windowSize(3),
        );
    });

    test("treats a reminder due exactly now as passed but keeps one due a moment later", async () => {
        const plan = reminderPlan({ selectedPrayers: ["maghrib"] });

        freezeClock(localDate(2026, 9, 30, 17, 37, 0, 0));
        let result = await syncPrayerReminders(plan);
        expect(result.scheduled[0].id).toBe(
            "prayer-reminder:maghrib:2026-10-01",
        );
        expect(result.scheduled).toHaveLength(REMINDER_HORIZON_DAYS);

        freezeClock(localDate(2026, 9, 30, 17, 36, 59, 999));
        result = await syncPrayerReminders(plan);
        expect(result.scheduled[0].id).toBe(
            "prayer-reminder:maghrib:2026-09-30",
        );
        expect(result.scheduled).toHaveLength(REMINDER_HORIZON_DAYS);
        expect(reminderIds()).toHaveLength(REMINDER_HORIZON_DAYS);
    });

    test("rolls over months and years using local dates", async () => {
        freezeClock(localDate(2026, 12, 29, 6, 0));

        const result = await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["dhuhr"] }),
        );

        expect(result.scheduled.map((item) => item.id)).toEqual([
            "prayer-reminder:dhuhr:2026-12-29",
            "prayer-reminder:dhuhr:2026-12-30",
            "prayer-reminder:dhuhr:2026-12-31",
            "prayer-reminder:dhuhr:2027-01-01",
            "prayer-reminder:dhuhr:2027-01-02",
            "prayer-reminder:dhuhr:2027-01-03",
            "prayer-reminder:dhuhr:2027-01-04",
        ]);
        expect(result.scheduled[2].fireAt).toBe(
            localDate(2026, 12, 31, 11, 33).toISOString(),
        );
        expect(result.scheduled[3].fireAt).toBe(
            localDate(2027, 1, 1, 11, 33).toISOString(),
        );
    });

    test("crosses the year when the last prayer of the day is already behind", async () => {
        freezeClock(localDate(2026, 12, 31, 23, 0));

        const result = await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["fajr", "isha"] }),
        );

        expect(
            result.scheduled
                .filter((item) => item.prayer === "fajr")
                .map((item) => item.id),
        ).toEqual(idsFor("fajr", daysFrom(2027, 1, 1, 7)));
        expect(
            result.scheduled
                .filter((item) => item.prayer === "isha")
                .map((item) => item.id),
        ).toEqual(idsFor("isha", daysFrom(2027, 1, 1, 7)));
        expect(result.scheduled[0].fireAt).toBe(
            localDate(2027, 1, 1, 4, 10).toISOString(),
        );
    });

    test("handles the end of February in regular and leap years", async () => {
        const plan = reminderPlan({ selectedPrayers: ["fajr"] });

        freezeClock(localDate(2027, 2, 26, 6, 0));
        let result = await syncPrayerReminders(plan);
        expect(result.scheduled.map((item) => item.id)).toEqual(
            idsFor("fajr", [
                [2027, 2, 27],
                [2027, 2, 28],
                [2027, 3, 1],
                [2027, 3, 2],
                [2027, 3, 3],
                [2027, 3, 4],
                [2027, 3, 5],
            ]),
        );
        expect(result.scheduled[2].fireAt).toBe(
            localDate(2027, 3, 1, 4, 10).toISOString(),
        );

        freezeClock(localDate(2028, 2, 26, 6, 0));
        result = await syncPrayerReminders(plan);
        expect(result.scheduled.map((item) => item.id)).toEqual(
            idsFor("fajr", [
                [2028, 2, 27],
                [2028, 2, 28],
                [2028, 2, 29],
                [2028, 3, 1],
                [2028, 3, 2],
                [2028, 3, 3],
                [2028, 3, 4],
            ]),
        );
        expect(reminderIds()).toHaveLength(REMINDER_HORIZON_DAYS);
    });

    test("names a reminder after its trigger date when the lead crosses midnight", async () => {
        freezeClock(localDate(2026, 10, 1, 10, 0));

        const result = await syncPrayerReminders(
            reminderPlan({
                selectedPrayers: ["fajr"],
                times: { fajr: "00:05" },
            }),
        );

        expect(result.scheduled).toHaveLength(REMINDER_HORIZON_DAYS);
        expect(result.scheduled[0]).toEqual({
            fireAt: localDate(2026, 10, 1, 23, 55).toISOString(),
            id: "prayer-reminder:fajr:2026-10-01",
            prayer: "fajr",
        });
        expect(result.scheduled[6].id).toBe("prayer-reminder:fajr:2026-10-07");
    });

    describe("per-date times", () => {
        const fajrPlan = (extra = {}) =>
            reminderPlan({ selectedPrayers: ["fajr"], ...extra });
        const fireAtOn = (result, day) =>
            result.scheduled.find(
                (item) => item.id === `prayer-reminder:fajr:2026-10-0${day}`,
            )?.fireAt;

        beforeEach(() => {
            freezeClock(localDate(2026, 10, 1, 3, 0));
        });

        test("uses the resolver for the days after today and the given times for today", async () => {
            const timesForDate = jest.fn(async (date) =>
                date.getDate() === 3
                    ? { ...reminderPlan().times, fajr: "04:18" }
                    : null,
            );

            const result = await syncPrayerReminders(
                fajrPlan({ timesForDate }),
            );

            expect(fireAtOn(result, 1)).toBe(
                localDate(2026, 10, 1, 4, 10).toISOString(),
            );
            expect(fireAtOn(result, 2)).toBe(
                localDate(2026, 10, 2, 4, 10).toISOString(),
            );
            expect(fireAtOn(result, 3)).toBe(
                localDate(2026, 10, 3, 4, 8).toISOString(),
            );
            expect(
                mockStore.get("prayer-reminder:fajr:2026-10-03").content.body,
            ).toBe("Waktu Subuh masuk pukul 04:18.");
            expect(
                mockStore.get("prayer-reminder:fajr:2026-10-04").content.body,
            ).toBe("Waktu Subuh masuk pukul 04:20.");
        });

        test("asks for each of the seven days after today with a local date, never for today", async () => {
            const timesForDate = jest.fn(() => null);

            await syncPrayerReminders(fajrPlan({ timesForDate }));

            const asked = timesForDate.mock.calls.map(([date]) => date);
            expect(asked.map((date) => date.getDate())).toEqual([
                2, 3, 4, 5, 6, 7, 8,
            ]);
            asked.forEach((date) => {
                expect(date).toBeInstanceOf(Date);
                expect([
                    date.getFullYear(),
                    date.getMonth(),
                    date.getHours(),
                    date.getMinutes(),
                ]).toEqual([2026, 9, 0, 0]);
            });
        });

        test("falls back to the given times when the resolver has nothing usable", async () => {
            const answers = {
                2: null,
                3: undefined,
                4: "not times",
                5: { fajr: "bad" },
                6: { dhuhr: "11:50" },
            };
            const timesForDate = jest.fn(async (date) => {
                if (date.getDate() === 7) throw new Error("lookup failed");
                return answers[date.getDate()];
            });

            const result = await syncPrayerReminders(
                reminderPlan({
                    selectedPrayers: ["fajr", "dhuhr"],
                    timesForDate,
                }),
            );

            expect(result.scheduled).toHaveLength(windowSize(2));
            const fireAtOf = (prayer, day) =>
                result.scheduled.find(
                    (item) =>
                        item.id === `prayer-reminder:${prayer}:2026-10-0${day}`,
                )?.fireAt;
            [1, 2, 3, 4, 5, 6, 7].forEach((day) =>
                expect(fireAtOf("fajr", day)).toBe(
                    localDate(2026, 10, day, 4, 10).toISOString(),
                ),
            );
            [1, 2, 3, 4, 5, 7].forEach((day) =>
                expect(fireAtOf("dhuhr", day)).toBe(
                    localDate(2026, 10, day, 11, 33).toISOString(),
                ),
            );
            expect(fireAtOf("dhuhr", 6)).toBe(
                localDate(2026, 10, 6, 11, 40).toISOString(),
            );
        });

        test("accepts a synchronous resolver", async () => {
            const result = await syncPrayerReminders(
                fajrPlan({
                    timesForDate: (date) =>
                        date.getDate() === 5
                            ? { ...reminderPlan().times, fajr: "04:30" }
                            : undefined,
                }),
            );

            expect(fireAtOn(result, 5)).toBe(
                localDate(2026, 10, 5, 4, 20).toISOString(),
            );
            expect(fireAtOn(result, 4)).toBe(
                localDate(2026, 10, 4, 4, 10).toISOString(),
            );
        });

        test("never asks the resolver when disabled, refused or without prayers", async () => {
            const timesForDate = jest.fn(() => null);

            await syncPrayerReminders(
                fajrPlan({ enabled: false, timesForDate }),
            );
            await syncPrayerReminders(
                fajrPlan({ selectedPrayers: [], timesForDate }),
            );
            mockGetPermissionsAsync.mockResolvedValue({ granted: false });
            mockRequestPermissionsAsync.mockResolvedValue({ granted: false });
            await syncPrayerReminders(fajrPlan({ timesForDate }));

            expect(timesForDate).not.toHaveBeenCalled();
        });
    });

    test("keeps exactly the new set when settings change between syncs", async () => {
        freezeClock(localDate(2026, 10, 1, 3, 0));
        const next = reminderPlan({
            leadMinutes: 0,
            selectedPrayers: ["fajr", "asr", "isha"],
            times: { ...reminderPlan().times, asr: "15:05" },
        });

        await syncPrayerReminders(reminderPlan());
        await syncPrayerReminders(next);
        const afterResync = snapshotStore();

        mockStore.clear();
        await syncPrayerReminders(next);

        expect(afterResync).toHaveLength(windowSize(3));
        expect(afterResync).toEqual(snapshotStore());
    });

    test("cancels beyond-horizon, stale and legacy reminders but keeps other types", async () => {
        freezeClock(localDate(2026, 10, 1, 3, 0));
        [
            "prayer-reminder:fajr:2026-10-20",
            "prayer-reminder:isha:2026-10-08",
            "prayer-reminder:fajr:2026-09-25",
        ].forEach((id) =>
            mockStore.set(id, {
                identifier: id,
                content: { data: { prayer: "fajr", type: "prayer_reminder" } },
                trigger: { type: "date" },
            }),
        );
        seedOrphanReminders(3);
        mockStore.set("smart-1", {
            identifier: "smart-1",
            content: { data: { type: "smart_reminder" } },
            trigger: {},
        });

        await syncPrayerReminders(reminderPlan());

        const expected = allPrayers.flatMap((prayer) =>
            idsFor(prayer, daysFrom(2026, 10, 1, 7)),
        );
        expect(reminderIds().sort()).toEqual(expected.sort());
        expect(mockStore.has("smart-1")).toBe(true);
        expect(mockStore.size).toBe(windowSize() + 1);
    });

    test("never schedules more than the hard cap and keeps the soonest reminders", async () => {
        freezeClock(localDate(2026, 10, 1, 3, 0));
        const prayers = Array.from(
            { length: 12 },
            (_, index) => `slot${index}`,
        );
        const times = Object.fromEntries(
            prayers.map((prayer, index) => [
                prayer,
                `${`${4 + index}`.padStart(2, "0")}:00`,
            ]),
        );

        const result = await syncPrayerReminders({
            leadMinutes: 0,
            selectedPrayers: prayers,
            times,
        });

        expect(prayers.length * REMINDER_HORIZON_DAYS).toBeGreaterThan(
            MAX_PENDING_PRAYER_REMINDERS,
        );
        expect(result.scheduled).toHaveLength(MAX_PENDING_PRAYER_REMINDERS);
        expect(reminderIds()).toHaveLength(MAX_PENDING_PRAYER_REMINDERS);
        expect(mockStore.size).toBe(MAX_PENDING_PRAYER_REMINDERS);
        const fireTimes = result.scheduled.map((item) =>
            Date.parse(item.fireAt),
        );
        expect(fireTimes).toEqual([...fireTimes].sort((a, b) => a - b));
        reminderIds().forEach((id) =>
            expect(id.split(":")[2] <= "2026-10-05").toBe(true),
        );
    });

    test("counts a repeated prayer only once", async () => {
        freezeClock(localDate(2026, 10, 1, 3, 0));

        const result = await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["fajr", "fajr", "isha"] }),
        );

        expect(result.scheduled).toHaveLength(windowSize(2));
        expect(new Set(result.scheduled.map((item) => item.id)).size).toBe(
            windowSize(2),
        );
    });

    test("ends with exactly the final set when syncs with different times interleave", async () => {
        freezeClock(localDate(2026, 9, 30, 17, 40));
        const base = reminderPlan().times;
        const first = reminderPlan({
            selectedPrayers: ["fajr", "maghrib", "isha"],
            times: { ...base, maghrib: "17:47" },
        });
        const second = reminderPlan({
            leadMinutes: 0,
            times: { ...base, fajr: "04:25", maghrib: "17:30" },
        });
        const last = reminderPlan({
            leadMinutes: 5,
            selectedPrayers: ["dhuhr", "maghrib"],
            times: { ...base, maghrib: "17:50" },
        });

        await syncPrayerReminders(last);
        const expected = snapshotStore();
        mockStore.clear();
        mockTrace.length = 0;

        await Promise.all([
            syncPrayerReminders(first),
            syncPrayerReminders(second),
            syncPrayerReminders(last),
        ]);

        expect(expected).toHaveLength(windowSize(2));
        expect(snapshotStore()).toEqual(expected);
        expect(new Set(reminderIds()).size).toBe(windowSize(2));
        expect(mockStore.size).toBe(windowSize(2));
    });
});

describe("notification permission without prompting", () => {
    test("checkPrayerNotificationPermission never asks the user", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ granted: false });

        expect(await checkPrayerNotificationPermission()).toEqual({
            granted: false,
        });
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    test("recognises an existing grant, provisional iOS access and sets up the Android channel", async () => {
        expect(await checkPrayerNotificationPermission()).toEqual({
            granted: true,
        });
        expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();

        mockGetPermissionsAsync.mockResolvedValue({
            granted: false,
            ios: { status: 1 },
        });
        expect(await checkPrayerNotificationPermission()).toEqual({
            granted: true,
        });

        Platform.OS = "android";
        expect(await checkPrayerNotificationPermission()).toEqual({
            granted: true,
        });
        expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
            PRAYER_REMINDER_CHANNEL_ID,
            expect.objectContaining({ importance: 4 }),
        );
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    test("ensurePrayerNotificationPermission still asks when nothing is granted", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ granted: false });
        mockRequestPermissionsAsync.mockResolvedValue({ granted: true });

        expect(await ensurePrayerNotificationPermission()).toEqual({
            granted: true,
        });
        expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    test("reports unsupported on web", async () => {
        Platform.OS = "web";

        expect(await checkPrayerNotificationPermission()).toEqual({
            granted: false,
            reason: "unsupported",
        });
    });

    test("a sync that must not prompt schedules when already granted", async () => {
        const result = await syncPrayerReminders(
            reminderPlan({ requestPermission: false }),
        );

        expect(result.status).toBe("scheduled");
        expect(result.scheduled).toHaveLength(windowSize());
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    test("a sync that must not prompt clears its reminders and reports denied without asking", async () => {
        await syncPrayerReminders(reminderPlan());
        mockStore.set("smart-1", {
            identifier: "smart-1",
            content: { data: { type: "smart_reminder" } },
            trigger: {},
        });
        mockGetPermissionsAsync.mockResolvedValue({ granted: false });

        const result = await syncPrayerReminders(
            reminderPlan({ requestPermission: false }),
        );

        expect(result).toEqual({ scheduled: [], status: "denied" });
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
        expect(reminderIds()).toEqual([]);
        expect(mockStore.has("smart-1")).toBe(true);
    });

    test("leaves the foreground handler alone when a sync only sweeps", async () => {
        let isolated;
        let Notifications;
        jest.isolateModules(() => {
            Notifications = require("expo-notifications");
            isolated = require("../utils/prayerNotifications");
        });
        seedOrphanReminders(2);

        await isolated.syncPrayerReminders({ enabled: false });
        expect(reminderIds()).toEqual([]);
        expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();

        await isolated.syncPrayerReminders(reminderPlan());
        expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    });
});

describe("listPrayerReminders", () => {
    test("returns only the notifications created for prayer reminders", async () => {
        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["fajr", "isha"] }),
        );
        mockStore.set("smart-1", {
            identifier: "smart-1",
            content: { data: { type: "smart_reminder" } },
            trigger: {},
        });

        const reminders = await listPrayerReminders();

        expect(reminders).toHaveLength(windowSize(2));
        expect(
            [...new Set(reminders.map((item) => item.prayer))].sort(),
        ).toEqual(["fajr", "isha"]);
        expect(reminders.every((item) => item.id.startsWith("prayer-"))).toBe(
            true,
        );
    });

    test("returns an empty list on web", async () => {
        Platform.OS = "web";

        expect(await listPrayerReminders()).toEqual([]);
    });
});

describe("showPrayerTimeNotification", () => {
    test("shows immediate prayer time notification", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ granted: true });

        const result = await showPrayerTimeNotification({
            label: "Subuh",
            prayer: "fajr",
        });

        expect(result.status).toBe("shown");
        expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
            content: expect.objectContaining({
                body: "Sudah masuk waktu Subuh.",
                title: "Waktu Sholat: Subuh",
            }),
            trigger: null,
        });
    });

    test("uses the given translator for the notification text", async () => {
        await showPrayerTimeNotification({
            label: "Fajr",
            prayer: "fajr",
            t: englishTranslate,
        });

        expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
            content: expect.objectContaining({
                body: "It is now time for Fajr.",
                title: "Prayer Time: Fajr",
            }),
            trigger: null,
        });
    });
});

describe("cancelPrayerReminders", () => {
    test("cancels scheduled reminders by id", async () => {
        await cancelPrayerReminders(["id-1", "id-2"]);
        expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
            "id-1",
        );
        expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
            "id-2",
        );
    });

    test("handles empty array gracefully", async () => {
        await cancelPrayerReminders([]);
        expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    test("handles object array with id field", async () => {
        await cancelPrayerReminders([{ id: "obj-id-1" }, { id: "obj-id-2" }]);
        expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
            "obj-id-1",
        );
        expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
            "obj-id-2",
        );
    });

    test("also sweeps reminders that were never tracked and keeps other notifications", async () => {
        seedOrphanReminders(4);
        mockStore.set("smart-1", {
            identifier: "smart-1",
            content: { data: { type: "smart_reminder" } },
            trigger: {},
        });

        await cancelPrayerReminders([]);

        expect(reminderIds()).toEqual([]);
        expect(mockStore.has("smart-1")).toBe(true);
    });
});
