import { act, renderHook } from "@testing-library/react-native";
import { AppState, Platform } from "react-native";

const mockPrefs = new Map();
let mockPrefFailure = false;
let mockSession = null;

const mockScheduleNotificationAsync = jest.fn(() =>
    Promise.resolve("test-notification-id"),
);
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
    getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
    cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
    IosAuthorizationStatus: { PROVISIONAL: 1 },
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: "date" },
}));

const mockPlayerPlay = jest.fn();
const mockPlayerStop = jest.fn();
const mockPlayerRemove = jest.fn();
const mockCreateAudioPlayer = jest.fn(() => ({
    play: mockPlayerPlay,
    stop: mockPlayerStop,
    remove: mockPlayerRemove,
    source: null,
}));
const mockSetAudioModeAsync = jest.fn(() => Promise.resolve());

jest.mock("expo-audio", () => ({
    createAudioPlayer: (...args) => mockCreateAudioPlayer(...args),
    setAudioModeAsync: (...args) => mockSetAudioModeAsync(...args),
}));

jest.mock("../storage/preferences", () => ({
    preferenceKeys: {
        appLanguage: "app-language",
        prayerAdjustments: "prayer-adjustments",
        prayerAdzanAudioEnabled: "prayer-adzan-audio-enabled",
        prayerAdzanSound: "prayer-adzan-sound",
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

jest.mock("../utils/prayerReminderSettings", () => {
    const actual = jest.requireActual("../utils/prayerReminderSettings");
    return {
        ...actual,
        readPrayerReminderSettings: jest.fn(),
    };
});

import { preferenceKeys } from "../storage/preferences";
import { readPrayerReminderSettings } from "../utils/prayerReminderSettings";
import {
    findDuePrayer,
    usePrayerTimeMonitor,
} from "../hooks/usePrayerTimeMonitor";

describe("findDuePrayer helper", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test("returns null if prayers object is missing or empty", () => {
        expect(findDuePrayer(null, {})).toBeNull();
        expect(findDuePrayer({}, {})).toBeNull();
    });

    test("identifies due prayer when current time matches prayer time", () => {
        jest.useFakeTimers();
        const base = new Date(2026, 8, 30, 12, 0, 0); // 12:00
        jest.setSystemTime(base);

        const prayers = {
            fajr: "04:30",
            dhuhr: "12:00",
            asr: "15:15",
            maghrib: "18:00",
            isha: "19:15",
        };

        expect(findDuePrayer(prayers, {})).toBe("dhuhr");
    });

    test("applies adjustments when checking if prayer is due", () => {
        jest.useFakeTimers();
        const base = new Date(2026, 8, 30, 12, 2, 0); // 12:02
        jest.setSystemTime(base);

        const prayers = {
            fajr: "04:30",
            dhuhr: "12:00",
            asr: "15:15",
            maghrib: "18:00",
            isha: "19:15",
        };
        const adjustments = { dhuhr: 2 }; // 12:00 + 2 = 12:02

        expect(findDuePrayer(prayers, adjustments)).toBe("dhuhr");
    });

    test("returns null when no prayer matches current minute", () => {
        jest.useFakeTimers();
        const base = new Date(2026, 8, 30, 12, 10, 0);
        jest.setSystemTime(base);

        const prayers = {
            fajr: "04:30",
            dhuhr: "12:00",
            asr: "15:15",
            maghrib: "18:00",
            isha: "19:15",
        };

        expect(findDuePrayer(prayers, {})).toBeNull();
    });
});

describe("usePrayerTimeMonitor hook", () => {
    let appStateHandlers = [];
    let appStateRemove = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
        mockPrefs.clear();
        mockPrefFailure = false;
        mockSession = null;
        mockScheduleNotificationAsync.mockClear();
        mockCreateAudioPlayer.mockClear();
        mockPlayerPlay.mockClear();
        mockPlayerStop.mockClear();
        readPrayerReminderSettings.mockClear();
        appStateHandlers = [];
        appStateRemove = jest.fn();

        // Default mock for readPrayerReminderSettings
        readPrayerReminderSettings.mockResolvedValue({
            enabled: true,
            leadMinutes: 0,
            selectedPrayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
            adjustments: {},
            location: { lat: -6.2, lng: 106.8 },
            scheduleCache: {
                coords: { lat: -6.2, lng: 106.8 },
                method: "kemenag",
                madhab: "shafi",
                prayers: {
                    fajr: "04:30",
                    dhuhr: "12:00",
                    asr: "15:15",
                    maghrib: "18:00",
                    isha: "19:15",
                },
                updatedAt: Date.now(),
            },
        });

        mockPrefs.set(preferenceKeys.prayerAdzanAudioEnabled, false);
        mockPrefs.set(preferenceKeys.prayerAdzanSound, "default");

        // Spy on AppState.addEventListener
        jest.spyOn(AppState, "addEventListener").mockImplementation((_type, handler) => {
            appStateHandlers.push(handler);
            return { remove: appStateRemove };
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("fires prayer time notification when prayer is due", async () => {
        const base = new Date(2026, 8, 30, 18, 0, 0); // Maghrib 18:00
        jest.setSystemTime(base);

        renderHook(() => usePrayerTimeMonitor());

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.objectContaining({
                    data: expect.objectContaining({
                        prayer: "maghrib",
                        type: "prayer_time",
                    }),
                }),
                trigger: null,
            }),
        );
    });

    test("plays adzan audio when adzan audio is enabled", async () => {
        const base = new Date(2026, 8, 30, 18, 0, 0);
        jest.setSystemTime(base);

        mockPrefs.set(preferenceKeys.prayerAdzanAudioEnabled, true);

        renderHook(() => usePrayerTimeMonitor());

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        expect(mockCreateAudioPlayer).toHaveBeenCalled();
        expect(mockPlayerPlay).toHaveBeenCalled();
    });

    test("does not play adzan audio when adzan audio is disabled", async () => {
        const base = new Date(2026, 8, 30, 18, 0, 0);
        jest.setSystemTime(base);

        mockPrefs.set(preferenceKeys.prayerAdzanAudioEnabled, false);

        renderHook(() => usePrayerTimeMonitor());

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        expect(mockScheduleNotificationAsync).toHaveBeenCalled();
        expect(mockPlayerPlay).not.toHaveBeenCalled();
    });

    test("does not alert twice for the same prayer on the same day", async () => {
        const base = new Date(2026, 8, 30, 18, 0, 0);
        jest.setSystemTime(base);

        renderHook(() => usePrayerTimeMonitor());

        await act(async () => {
            jest.advanceTimersByTime(100);
        });
        expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);

        // Next poll 10s later
        await act(async () => {
            jest.advanceTimersByTime(10000);
        });
        expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });

    test("stops adzan when app goes to background", async () => {
        const base = new Date(2026, 8, 30, 18, 0, 0);
        jest.setSystemTime(base);

        mockPrefs.set(preferenceKeys.prayerAdzanAudioEnabled, true);

        renderHook(() => usePrayerTimeMonitor());

        await act(async () => {
            jest.advanceTimersByTime(100);
        });
        expect(mockPlayerPlay).toHaveBeenCalled();

        // Simulate app going to background
        act(() => {
            appStateHandlers.forEach((handler) => handler("background"));
        });

        expect(mockPlayerStop).toHaveBeenCalled();
    });
});
