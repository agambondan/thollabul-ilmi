import { act, renderHook } from "@testing-library/react-native";
import { AppState, Platform } from "react-native";

const mockStore = new Map();
const mockPrefs = new Map();
let mockAutoId = 0;
let mockSession = null;
let mockPrefFailure = false;

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 0));

const mockScheduleNotificationAsync = jest.fn(async (request) => {
    await mockDelay();
    const id = request.identifier ?? `auto-${++mockAutoId}`;
    mockStore.set(id, {
        identifier: id,
        content: request.content,
        trigger: request.trigger,
    });
    return id;
});
const mockCancelScheduledNotificationAsync = jest.fn(async (id) => {
    await mockDelay();
    mockStore.delete(id);
});
const mockGetAllScheduledNotificationsAsync = jest.fn(async () => {
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

jest.mock("expo-notifications", () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: (...args) => mockGetPermissionsAsync(...args),
    requestPermissionsAsync: (...args) => mockRequestPermissionsAsync(...args),
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
}));

jest.mock("../storage/preferences", () => ({
    preferenceKeys: {
        appLanguage: "app-language",
        prayerAdjustments: "prayer-adjustments",
        prayerLocation: "prayer-location",
        prayerReminderEnabled: "prayer-reminder-enabled",
        prayerReminderLeadMinutes: "prayer-reminder-lead-minutes",
        prayerReminderPrayers: "prayer-reminder-prayers",
        prayerScheduleCache: "prayer-schedule-cache",
    },
    readPreference: jest.fn(async (key, fallback) => {
        if (mockPrefFailure) throw new Error("storage unavailable");
        return mockPrefs.has(key) ? mockPrefs.get(key) : fallback;
    }),
}));

jest.mock("../storage/session", () => ({
    readSession: jest.fn(async () => mockSession),
}));

jest.mock("../storage/offlineContent", () => ({
    getOfflinePrayerForDate: jest.fn(),
}));

import { getOfflinePrayerForDate } from "../storage/offlineContent";
import { readPreference } from "../storage/preferences";
import {
    REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
    runReminderBootstrap,
    useReminderBootstrap,
} from "../hooks/useReminderBootstrap";
import {
    REMINDER_HORIZON_DAYS,
    syncPrayerReminders,
} from "../utils/prayerNotifications";

const FULL_WINDOW = 5 * REMINDER_HORIZON_DAYS;

const prayers = {
    imsak: "04:30",
    fajr: "04:40",
    sunrise: "05:50",
    dhuhr: "11:45",
    asr: "15:00",
    maghrib: "17:45",
    isha: "19:00",
};

const coords = { lat: -6.2088, lng: 106.8456 };

const cacheRecord = (overrides = {}) => ({
    coords,
    date: "2026-10-01",
    madhab: "shafi",
    method: "kemenag",
    prayers,
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    ...overrides,
});

const enableReminders = (overrides = {}) => {
    mockPrefs.set("prayer-reminder-enabled", true);
    mockPrefs.set("prayer-reminder-lead-minutes", 10);
    mockPrefs.set("prayer-schedule-cache", cacheRecord());
    Object.entries(overrides).forEach(([key, value]) =>
        mockPrefs.set(key, value),
    );
};

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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const settle = async (until = () => true, attempts = 60) => {
    for (let index = 0; index < attempts; index += 1) {
        await act(async () => {
            await delay(10);
        });
        if (until()) break;
    }
    await act(async () => {
        await delay(10);
    });
};

const reminderEntries = () =>
    [...mockStore.values()].filter(
        (request) => request.content?.data?.type === "prayer_reminder",
    );

const reminderIds = () =>
    reminderEntries()
        .map((request) => request.identifier)
        .sort();

const seedNotification = (id, type, prayer = "maghrib") =>
    mockStore.set(id, {
        identifier: id,
        content: { data: { prayer, type } },
        trigger: { type: "date" },
    });

const seedOrphans = (count) => {
    for (let index = 0; index < count; index += 1) {
        seedNotification(
            `orphan-${index}-0000-4000-8000-000000000000`,
            "prayer_reminder",
        );
    }
};

const snapshotStore = () =>
    [...mockStore.values()]
        .map((request) => ({
            body: request.content?.body,
            fireAt: request.trigger?.date?.toISOString?.(),
            id: request.identifier,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

let appStateSpy;
let appStateListeners;
let removeListener;

const nativeCalls = () =>
    mockScheduleNotificationAsync.mock.calls.length +
    mockCancelScheduledNotificationAsync.mock.calls.length +
    mockGetAllScheduledNotificationsAsync.mock.calls.length;

const settleIdle = async (quietTicks = 4, attempts = 200) => {
    let last = -1;
    let quiet = 0;
    for (let index = 0; index < attempts && quiet < quietTicks; index += 1) {
        await act(async () => {
            await delay(10);
        });
        const current = nativeCalls();
        quiet = current === last ? quiet + 1 : 0;
        last = current;
    }
};

const emitAppState = async (state) => {
    await act(async () => {
        appStateListeners.forEach((handler) => handler(state));
    });
    await settleIdle();
};

beforeEach(() => {
    jest.clearAllMocks();
    mockStore.clear();
    mockPrefs.clear();
    mockAutoId = 0;
    mockSession = null;
    mockPrefFailure = false;
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    getOfflinePrayerForDate.mockResolvedValue(null);
    Platform.OS = "ios";
    appStateListeners = [];
    removeListener = jest.fn();
    appStateSpy = jest
        .spyOn(AppState, "addEventListener")
        .mockImplementation((_type, handler) => {
            appStateListeners.push(handler);
            return { remove: removeListener };
        });
});

afterEach(() => {
    appStateSpy.mockRestore();
    jest.useRealTimers();
    Platform.OS = "ios";
});

describe("useReminderBootstrap at start", () => {
    test("schedules the whole window from the cached schedule without asking permission", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({
            "prayer-location": { lat: coords.lat, lng: coords.lng },
        });

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(new Set(reminderIds()).size).toBe(FULL_WINDOW);
        expect(
            new Set(reminderEntries().map((r) => r.content.data.prayer)),
        ).toEqual(new Set(["fajr", "dhuhr", "asr", "maghrib", "isha"]));
        expect(mockGetPermissionsAsync).toHaveBeenCalled();
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
        expect(AppState.addEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
        );
        const fajr = mockStore.get("prayer-reminder:fajr:2026-10-01");
        expect(fajr.content.title).toBe("Pengingat Subuh");
        expect(fajr.content.body).toBe("Waktu Subuh masuk pukul 04:40.");
        expect(fajr.trigger.date).toEqual(new Date(2026, 9, 1, 4, 30));
    });

    test("applies the saved corrections, lead time and prayer selection", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({
            "prayer-adjustments": { dhuhr: -1 },
            "prayer-reminder-lead-minutes": 5,
            "prayer-reminder-prayers": ["dhuhr", "maghrib"],
        });

        renderHook(() => useReminderBootstrap());
        await settle(
            () => reminderEntries().length === 2 * REMINDER_HORIZON_DAYS,
        );

        expect(reminderEntries()).toHaveLength(2 * REMINDER_HORIZON_DAYS);
        const dhuhr = mockStore.get("prayer-reminder:dhuhr:2026-10-01");
        expect(dhuhr.content.body).toBe("Waktu Dzuhur masuk pukul 11:44.");
        expect(dhuhr.trigger.date).toEqual(new Date(2026, 9, 1, 11, 39));
    });

    test("uses the cache even when it is old", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({
            "prayer-schedule-cache": cacheRecord({
                updatedAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
            }),
        });

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
    });

    test("does not run again when the host re-renders", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        const view = renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);
        view.rerender({});
        view.rerender({});
        await settle();

        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
        expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    });

    test("stops listening when the app unmounts", async () => {
        enableReminders();

        const view = renderHook(() => useReminderBootstrap());
        await settle();
        view.unmount();

        expect(removeListener).toHaveBeenCalledTimes(1);
    });
});

describe("useReminderBootstrap on foreground", () => {
    test("runs again when the app becomes active but at most once a minute", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);
        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);

        await emitAppState("active");
        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);

        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                REMINDER_BOOTSTRAP_MIN_INTERVAL_MS -
                1,
        );
        await emitAppState("active");
        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);

        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
        );
        await emitAppState("active");
        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);
        expect(reminderEntries()).toHaveLength(FULL_WINDOW);

        await emitAppState("active");
        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);

        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                2 * REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
        );
        await emitAppState("active");
        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(3);
        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
    });

    test("ignores states other than active", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);
        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                10 * REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
        );

        await emitAppState("background");
        await emitAppState("inactive");

        expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    test("restores the reminders Android dropped while the app was closed", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);
        const before = snapshotStore();

        mockStore.clear();
        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
        );
        await emitAppState("active");
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(snapshotStore()).toEqual(before);
    });

    test("keeps the window rolling when days pass without opening the prayer screen", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        jest.setSystemTime(new Date(2026, 9, 6, 20, 0));
        await emitAppState("active");
        await settle(() => reminderEntries().length === FULL_WINDOW);

        const ids = reminderIds();
        expect(ids).toHaveLength(FULL_WINDOW);
        expect(ids).toContain("prayer-reminder:fajr:2026-10-07");
        expect(ids).toContain("prayer-reminder:fajr:2026-10-13");
        expect(ids).toContain("prayer-reminder:isha:2026-10-12");
        expect(ids).not.toContain("prayer-reminder:fajr:2026-10-01");
        expect(ids).not.toContain("prayer-reminder:isha:2026-10-06");
    });
});

describe("useReminderBootstrap guards", () => {
    test("skips without a cached schedule and leaves existing reminders alone", async () => {
        mockPrefs.set("prayer-reminder-enabled", true);
        seedNotification(
            "prayer-reminder:fajr:2026-10-01",
            "prayer_reminder",
            "fajr",
        );

        renderHook(() => useReminderBootstrap());
        await settle();

        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(mockGetAllScheduledNotificationsAsync).not.toHaveBeenCalled();
        expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
        expect(mockStore.has("prayer-reminder:fajr:2026-10-01")).toBe(true);
    });

    test("skips an unusable cache", async () => {
        enableReminders({
            "prayer-schedule-cache": cacheRecord({
                prayers: { ...prayers, asr: undefined },
            }),
        });

        renderHook(() => useReminderBootstrap());
        await settle();

        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
    });

    test("skips a cache that belongs to another place than the saved location", async () => {
        enableReminders({
            "prayer-location": { lat: -7.25, lng: 112.75, source: "gps" },
        });

        renderHook(() => useReminderBootstrap());
        await settle();

        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
    });

    test("accepts a cache that is close to the saved location", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({
            "prayer-location": {
                lat: coords.lat + 0.05,
                lng: coords.lng - 0.05,
                source: "gps",
            },
        });

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
    });

    test("only sweeps prayer reminders when reminders are disabled", async () => {
        seedOrphans(3);
        seedNotification(
            "prayer-reminder:fajr:2026-10-01",
            "prayer_reminder",
            "fajr",
        );
        seedNotification(
            "prayer-reminder:isha:2026-10-07",
            "prayer_reminder",
            "isha",
        );
        seedNotification("smart-1", "smart_reminder");
        seedNotification("instant-1", "prayer_time");
        mockPrefs.set("prayer-schedule-cache", cacheRecord());

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === 0);

        expect(reminderEntries()).toHaveLength(0);
        expect([...mockStore.keys()].sort()).toEqual(["instant-1", "smart-1"]);
        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    test("does nothing on a clean install where reminders were never enabled", async () => {
        renderHook(() => useReminderBootstrap());
        await settle();

        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalled();
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    test("never prompts when the permission is missing and clears stale reminders", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();
        seedOrphans(2);
        seedNotification("smart-1", "smart_reminder");
        mockGetPermissionsAsync.mockResolvedValue({ granted: false });
        mockRequestPermissionsAsync.mockResolvedValue({ granted: true });

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === 0);

        expect(mockGetPermissionsAsync).toHaveBeenCalled();
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(reminderEntries()).toHaveLength(0);
        expect(mockStore.has("smart-1")).toBe(true);
    });

    test("picks the work up again once the permission is granted in system settings", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();
        mockGetPermissionsAsync.mockResolvedValue({ granted: false });

        renderHook(() => useReminderBootstrap());
        await settle();
        expect(reminderEntries()).toHaveLength(0);

        mockGetPermissionsAsync.mockResolvedValue({ granted: true });
        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
        );
        await emitAppState("active");
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    test("does nothing on web", async () => {
        Platform.OS = "web";
        enableReminders();
        seedOrphans(2);

        renderHook(() => useReminderBootstrap());
        await settle();

        expect(AppState.addEventListener).not.toHaveBeenCalled();
        expect(readPreference).not.toHaveBeenCalled();
        expect(mockGetAllScheduledNotificationsAsync).not.toHaveBeenCalled();
        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(reminderEntries()).toHaveLength(2);
    });
});

describe("useReminderBootstrap failures", () => {
    test("swallows a scheduling failure and recovers on the next foreground", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();
        mockScheduleNotificationAsync.mockRejectedValueOnce(
            new Error("native failure"),
        );

        expect(() => renderHook(() => useReminderBootstrap())).not.toThrow();
        await settle();
        expect(reminderEntries()).toHaveLength(0);

        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
        );
        await emitAppState("active");
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
    });

    test("swallows a storage failure and keeps listening", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();
        mockPrefFailure = true;

        expect(() => renderHook(() => useReminderBootstrap())).not.toThrow();
        await settle();
        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();

        mockPrefFailure = false;
        jest.setSystemTime(
            new Date(2026, 9, 1, 3, 0).getTime() +
                REMINDER_BOOTSTRAP_MIN_INTERVAL_MS,
        );
        await emitAppState("active");
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
    });

    test("swallows a permission check failure", async () => {
        enableReminders();
        mockGetPermissionsAsync.mockRejectedValueOnce(new Error("no service"));

        expect(() => renderHook(() => useReminderBootstrap())).not.toThrow();
        await settle();

        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });
});

describe("useReminderBootstrap text", () => {
    test("follows the language stored on the device", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({ "app-language": "en" });

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        const fajr = mockStore.get("prayer-reminder:fajr:2026-10-01");
        expect(fajr.content.title).toBe("Fajr Reminder");
        expect(fajr.content.body).toBe("Fajr starts at 04:40.");
    });

    test("prefers the language of the signed-in account like the locale provider", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({ "app-language": "idn" });
        mockSession = { token: "t", user: { preferred_lang: "en" } };

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(
            mockStore.get("prayer-reminder:fajr:2026-10-01").content.title,
        ).toBe("Fajr Reminder");
    });

    test("is Indonesian by default and without lead time says the time is now", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({ "prayer-reminder-lead-minutes": 0 });

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(
            mockStore.get("prayer-reminder:asr:2026-10-01").content.body,
        ).toBe("Waktu Asr telah tiba.");
    });
});

describe("useReminderBootstrap with the offline prayer pack", () => {
    const packDay = (overrides) => ({ ...prayers, ...overrides });

    test("uses exact times for the days the pack covers and today's times elsewhere", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders({
            "prayer-adjustments": { fajr: 1 },
            "prayer-schedule-cache": cacheRecord({
                madhab: "hanafi",
                method: "mwl",
            }),
        });
        getOfflinePrayerForDate.mockImplementation(async ({ date }) => {
            if (date === "2026-10-01") return packDay({ fajr: "04:39" });
            if (date === "2026-10-03") return packDay({ fajr: "04:30" });
            return null;
        });

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        const fajrOn = (day) =>
            mockStore.get(`prayer-reminder:fajr:2026-10-0${day}`);
        expect(fajrOn(1).content.body).toBe("Waktu Subuh masuk pukul 04:40.");
        expect(fajrOn(1).trigger.date).toEqual(new Date(2026, 9, 1, 4, 30));
        expect(fajrOn(2).content.body).toBe("Waktu Subuh masuk pukul 04:40.");
        expect(fajrOn(3).content.body).toBe("Waktu Subuh masuk pukul 04:31.");
        expect(fajrOn(3).trigger.date).toEqual(new Date(2026, 9, 3, 4, 21));
        expect(getOfflinePrayerForDate).toHaveBeenCalledWith({
            date: "2026-10-03",
            lat: coords.lat,
            lng: coords.lng,
            madhab: "hanafi",
            method: "mwl",
        });
    });

    test("falls back to the cache when the pack cannot be read", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();
        getOfflinePrayerForDate.mockRejectedValue(new Error("sqlite closed"));

        renderHook(() => useReminderBootstrap());
        await settle(() => reminderEntries().length === FULL_WINDOW);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(
            mockStore.get("prayer-reminder:fajr:2026-10-04").content.body,
        ).toBe("Waktu Subuh masuk pukul 04:40.");
    });
});

describe("runReminderBootstrap", () => {
    test("reports what it did", async () => {
        expect(await runReminderBootstrap()).toEqual({ status: "disabled" });

        mockPrefs.set("prayer-reminder-enabled", true);
        expect(await runReminderBootstrap()).toEqual({ status: "no-schedule" });

        mockPrefs.set("prayer-schedule-cache", cacheRecord());
        expect(await runReminderBootstrap()).toEqual({
            count: FULL_WINDOW,
            status: "scheduled",
        });

        mockGetPermissionsAsync.mockResolvedValue({ granted: false });
        expect(await runReminderBootstrap()).toEqual({
            count: 0,
            status: "denied",
        });

        Platform.OS = "web";
        expect(await runReminderBootstrap()).toEqual({ status: "unsupported" });
    });
});

describe("racing the prayer screen", () => {
    const screenPlan = (overrides = {}) => ({
        labels: {
            asr: "Asr",
            dhuhr: "Dzuhur",
            fajr: "Subuh",
            isha: "Isya",
            maghrib: "Maghrib",
        },
        leadMinutes: 0,
        selectedPrayers: ["fajr", "maghrib"],
        times: { ...prayers, fajr: "04:55", maghrib: "17:10" },
        ...overrides,
    });

    test("ends with the bootstrap set when the bootstrap sync is queued last", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        await runReminderBootstrap();
        const bootstrapOnly = snapshotStore();
        mockStore.clear();

        await Promise.all([
            syncPrayerReminders(screenPlan()),
            runReminderBootstrap(),
        ]);

        expect(snapshotStore()).toEqual(bootstrapOnly);
        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
    });

    test("ends with the screen set when the screen sync is queued last", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        await syncPrayerReminders(screenPlan());
        const screenOnly = snapshotStore();
        mockStore.clear();

        const bootstrap = runReminderBootstrap();
        await settle(
            () => mockGetAllScheduledNotificationsAsync.mock.calls.length > 0,
        );
        await Promise.all([bootstrap, syncPrayerReminders(screenPlan())]);

        expect(snapshotStore()).toEqual(screenOnly);
        expect(reminderEntries()).toHaveLength(2 * REMINDER_HORIZON_DAYS);
        expect(new Set(reminderIds()).size).toBe(2 * REMINDER_HORIZON_DAYS);
    });

    test("leaves no duplicates when several runs and screen syncs interleave", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        enableReminders();

        await Promise.all([
            runReminderBootstrap(),
            syncPrayerReminders(screenPlan()),
            runReminderBootstrap(),
            syncPrayerReminders(screenPlan({ selectedPrayers: ["isha"] })),
            runReminderBootstrap(),
        ]);

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(new Set(reminderIds()).size).toBe(FULL_WINDOW);
    });
});
