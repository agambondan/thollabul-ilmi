import { Platform } from "react-native";
import { translateMobile } from "../i18n/translations";
import {
    notificationsSupported,
    cancelPrayerReminders,
    listPrayerReminders,
    schedulePrayerReminders,
    showPrayerTimeNotification,
    syncPrayerReminders,
    PRAYER_REMINDER_CHANNEL_ID,
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

beforeEach(() => {
    jest.clearAllMocks();
    mockStore.clear();
    mockTrace.length = 0;
    mockAutoId = 0;
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    Platform.OS = "ios";
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
        expect(result.scheduled).toHaveLength(2);
        expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
            "old-id",
        );
        expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(2);
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
        expect(result.scheduled).toHaveLength(1);
        expect(result.scheduled[0].prayer).toBe("fajr");
    });
});

describe("syncPrayerReminders", () => {
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

    test("schedules one notification per selected prayer with deterministic identifiers", async () => {
        const result = await syncPrayerReminders(reminderPlan());

        expect(result.status).toBe("scheduled");
        expect(result.scheduled).toHaveLength(5);
        expect(mockStore.size).toBe(5);
        const ids = reminderIds();
        ids.forEach((id) =>
            expect(id).toMatch(
                /^prayer-reminder:(fajr|dhuhr|asr|maghrib|isha):\d{4}-\d{2}-\d{2}$/,
            ),
        );
        expect(new Set(ids.map((id) => id.split(":")[1]))).toEqual(
            new Set(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
        );
    });

    test("builds identifiers from the prayer and the trigger date", async () => {
        freezeClock(new Date(2026, 8, 30, 17, 40, 0));

        const result = await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["maghrib", "isha"] }),
        );

        expect(result.scheduled.map((item) => item.id).sort()).toEqual([
            "prayer-reminder:isha:2026-09-30",
            "prayer-reminder:maghrib:2026-10-01",
        ]);
    });

    test("is idempotent when called repeatedly", async () => {
        await syncPrayerReminders(reminderPlan());
        const first = reminderIds().sort();

        await syncPrayerReminders(reminderPlan());
        await syncPrayerReminders(reminderPlan());

        expect(reminderIds().sort()).toEqual(first);
        expect(mockStore.size).toBe(5);
    });

    test("serializes concurrent syncs so they never interleave", async () => {
        await Promise.all([
            syncPrayerReminders(reminderPlan()),
            syncPrayerReminders(reminderPlan()),
            syncPrayerReminders(reminderPlan()),
        ]);

        expect(mockStore.size).toBe(5);
        const listPositions = mockTrace
            .map((entry, index) => (entry === "list" ? index : -1))
            .filter((index) => index >= 0);
        expect(listPositions).toEqual([0, 6, 12]);
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
        expect(reminderIds()).toHaveLength(5);
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

        expect(result.scheduled).toHaveLength(1);
        expect(reminderIds()).toHaveLength(1);
        expect(mockStore.has("smart-1")).toBe(true);
        expect(mockStore.size).toBe(2);
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
        expect(reminderIds()).toHaveLength(5);

        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["fajr", "isha"] }),
        );
        expect(reminderIds()).toHaveLength(2);

        await syncPrayerReminders(
            reminderPlan({
                times: { ...reminderPlan().times, fajr: "04:25" },
            }),
        );
        expect(reminderIds()).toHaveLength(5);
        expect(mockStore.size).toBe(5);
    });

    test("prunes the old reminder when the fire date moves to another day", async () => {
        freezeClock(new Date(2026, 8, 30, 17, 40, 0));

        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["maghrib"], leadMinutes: 10 }),
        );
        expect(reminderIds()).toEqual(["prayer-reminder:maghrib:2026-10-01"]);

        await syncPrayerReminders(
            reminderPlan({ selectedPrayers: ["maghrib"], leadMinutes: 5 }),
        );
        expect(reminderIds()).toEqual(["prayer-reminder:maghrib:2026-09-30"]);
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
        expect(mockStore.size).toBe(1);
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

        expect(result.scheduled).toHaveLength(5);
        expect(reminderIds()).toHaveLength(5);
    });

    test("still schedules when the native list call fails", async () => {
        mockGetAllScheduledNotificationsAsync.mockRejectedValueOnce(
            new Error("list failed"),
        );

        const result = await syncPrayerReminders(reminderPlan());

        expect(result.status).toBe("scheduled");
        expect(reminderIds()).toHaveLength(5);
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

        expect(reminders.map((item) => item.prayer).sort()).toEqual([
            "fajr",
            "isha",
        ]);
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
