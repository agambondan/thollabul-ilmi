import { Platform } from "react-native";
import {
    notificationsSupported,
    cancelPrayerReminders,
    schedulePrayerReminders,
    showPrayerTimeNotification,
    PRAYER_REMINDER_CHANNEL_ID,
} from "../utils/prayerNotifications";

const mockScheduleNotificationAsync = jest.fn(() =>
    Promise.resolve("mock-id-1"),
);
const mockCancelScheduledNotificationAsync = jest.fn(() => Promise.resolve());
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
        cancelScheduledNotificationAsync: (...args) =>
            mockCancelScheduledNotificationAsync(...args),
        IosAuthorizationStatus: { PROVISIONAL: 1 },
        AndroidImportance: { HIGH: 4 },
        SchedulableTriggerInputTypes: { DATE: "date" },
    }),
    { virtual: false },
);

beforeEach(() => {
    jest.clearAllMocks();
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
});
