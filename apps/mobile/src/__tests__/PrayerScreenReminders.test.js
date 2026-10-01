import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

const mockStore = new Map();
let mockAutoId = 0;
const mockPrefs = new Map();

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 0));

jest.mock("expo-notifications", () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
    scheduleNotificationAsync: jest.fn(async (request) => {
        await mockDelay();
        const id = request.identifier ?? `auto-${++mockAutoId}`;
        mockStore.set(id, {
            identifier: id,
            content: request.content,
            trigger: request.trigger,
        });
        return id;
    }),
    getAllScheduledNotificationsAsync: jest.fn(async () => {
        await mockDelay();
        return [...mockStore.values()];
    }),
    cancelScheduledNotificationAsync: jest.fn(async (id) => {
        await mockDelay();
        mockStore.delete(id);
    }),
    IosAuthorizationStatus: { PROVISIONAL: 1 },
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: "date" },
}));

jest.mock("expo-audio", () => ({
    createAudioPlayer: jest.fn(() => ({
        play: jest.fn(),
        stop: jest.fn(),
        source: null,
    })),
    setAudioModeAsync: jest.fn(),
}));

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
    Accuracy: { High: 5, Balanced: 3 },
}));

jest.mock("../components/Screen", () => {
    const { View, Text } = require("react-native");
    return {
        Screen: ({ children, title, actions }) => (
            <View>
                <Text testID='screen-title'>{title}</Text>
                <View testID='screen-actions'>{actions}</View>
                {children}
            </View>
        ),
    };
});

jest.mock("../components/Card", () => {
    const { View, Text } = require("react-native");
    return {
        Card: ({ children }) => <View>{children}</View>,
        CardTitle: ({ children, meta }) => (
            <View>
                <Text>{children}</Text>
                {meta ? <Text testID='card-meta'>{meta}</Text> : null}
            </View>
        ),
    };
});

jest.mock("../components/Paper", () => {
    const { Pressable, Text } = require("react-native");
    return {
        IconActionButton: ({ label, onPress, disabled }) => (
            <Pressable
                onPress={onPress}
                disabled={disabled}
                testID={`action-${label}`}
            >
                <Text>{label}</Text>
            </Pressable>
        ),
    };
});

jest.mock("../context/FeedbackContext", () => ({
    useFeedback: jest.fn(),
    FeedbackProvider: ({ children }) => children,
}));

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(),
}));

jest.mock("../api/client", () => ({
    getPrayerTimes: jest.fn(),
}));

jest.mock("../storage/offlineContent", () => ({
    buildPrayerOfflinePack: jest.fn(),
    clearPrayerOfflinePack: jest.fn(),
    getOfflinePrayerForDate: jest.fn(),
    getPrayerOfflineOverview: jest.fn(),
}));

jest.mock("../storage/preferences", () => ({
    preferenceKeys: {
        prayerMethod: "prayer-method",
        prayerMadhab: "prayer-madhab",
        prayerAdjustments: "prayer-adjustments",
        prayerAdzanAudioEnabled: "prayer-adzan-audio-enabled",
        prayerAdzanSound: "prayer-adzan-sound",
        prayerReminderEnabled: "prayer-reminder-enabled",
        prayerReminderLeadMinutes: "prayer-reminder-lead-minutes",
        prayerReminderPrayers: "prayer-reminder-prayers",
        prayerLocation: "prayer-location",
        prayerScheduleCache: "prayer-schedule-cache",
    },
    readPreference: jest.fn(async (key, fallback) =>
        mockPrefs.has(key) ? mockPrefs.get(key) : fallback,
    ),
    writePreference: jest.fn(async (key, value) => {
        mockPrefs.set(key, value);
        return value;
    }),
}));

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getPrayerTimes } from "../api/client";
import { useFeedback } from "../context/FeedbackContext";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import {
    getOfflinePrayerForDate,
    getPrayerOfflineOverview,
} from "../storage/offlineContent";
import { PrayerScreen } from "../screens/PrayerScreen";
import { REMINDER_HORIZON_DAYS } from "../utils/prayerNotifications";

const PRAYERS_WITH_REMINDERS = 5;
const FULL_WINDOW = PRAYERS_WITH_REMINDERS * REMINDER_HORIZON_DAYS;
const windowOf = (prayerCount) => prayerCount * REMINDER_HORIZON_DAYS;

const prayerTimes = {
    imsak: "04:30",
    fajr: "04:40",
    sunrise: "05:50",
    dhuhr: "11:45",
    asr: "15:00",
    maghrib: "17:45",
    isha: "19:00",
};

const navigation = { setBack: jest.fn(), clearBack: jest.fn(), current: null };

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const settle = async (until = () => true, attempts = 60) => {
    for (let index = 0; index < attempts; index += 1) {
        await act(async () => {
            await delay(15);
        });
        if (until()) break;
    }
    await act(async () => {
        await delay(15);
    });
};

const reminderEntries = () =>
    [...mockStore.values()].filter(
        (request) => request.content?.data?.type === "prayer_reminder",
    );

const seedOrphans = (count) => {
    for (let index = 0; index < count; index += 1) {
        const id = `legacy-${index}-0000-4000-8000-000000000000`;
        mockStore.set(id, {
            identifier: id,
            content: { data: { prayer: "maghrib", type: "prayer_reminder" } },
            trigger: { type: "date" },
        });
    }
};

const renderSettings = async () => {
    const view = render(
        <PrayerScreen isActive={true} navigation={navigation} />,
    );
    await settle(() => Boolean(view.queryByText("04:40")));
    fireEvent.press(view.getByTestId("action-Buka pengaturan sholat"));
    await settle(() => Boolean(view.queryByText("Metode Jadwal")));
    return view;
};

const openSettingsWhenIdle = async () => {
    const view = render(
        <PrayerScreen isActive={true} navigation={navigation} />,
    );
    await settleIdle();
    fireEvent.press(view.getByTestId("action-Buka pengaturan sholat"));
    await settle(() => Boolean(view.queryByText("Metode Jadwal")));
    await settleIdle();
    return view;
};

const seedWeek = (prayer) => {
    for (let day = 1; day <= REMINDER_HORIZON_DAYS; day += 1) {
        const id = `prayer-reminder:${prayer}:2026-10-0${day}`;
        mockStore.set(id, {
            identifier: id,
            content: { data: { prayer, type: "prayer_reminder" } },
            trigger: { type: "date" },
        });
    }
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

const reminderToggle = (view) =>
    view.getAllByRole("button", { name: /^(Mati|Aktif)$/ })[0];

const nativeCalls = () =>
    Notifications.scheduleNotificationAsync.mock.calls.length +
    Notifications.cancelScheduledNotificationAsync.mock.calls.length +
    Notifications.getAllScheduledNotificationsAsync.mock.calls.length;

const settleIdle = async (quietTicks = 4, attempts = 200) => {
    let last = -1;
    let quiet = 0;
    for (let index = 0; index < attempts && quiet < quietTicks; index += 1) {
        await act(async () => {
            await delay(15);
        });
        const current = nativeCalls();
        quiet = current === last ? quiet + 1 : 0;
        last = current;
    }
};

describe("PrayerScreen reminders with real scheduling", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        getOfflinePrayerForDate.mockReset();
        mockStore.clear();
        mockPrefs.clear();
        mockAutoId = 0;
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
        Notifications.requestPermissionsAsync.mockResolvedValue({
            granted: true,
        });
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -6.2088, longitude: 106.8456 },
        });
        getPrayerTimes.mockResolvedValue(prayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });
        useFeedback.mockReturnValue({
            showError: jest.fn(),
            showInfo: jest.fn(),
            showSuccess: jest.fn(),
        });
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: false,
        });
    });

    test("turning reminders on schedules the week ahead for every prayer", async () => {
        const view = await renderSettings();
        expect(reminderEntries()).toHaveLength(0);

        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();

        const ids = reminderEntries().map((request) => request.identifier);
        expect(ids).toHaveLength(FULL_WINDOW);
        expect(new Set(ids).size).toBe(FULL_WINDOW);
        ids.forEach((id) => expect(id).toMatch(/^prayer-reminder:/));
        expect(mockStore.size).toBe(FULL_WINDOW);
        expect(
            new Set(reminderEntries().map((item) => item.content.data.prayer))
                .size,
        ).toBe(PRAYERS_WITH_REMINDERS);
        expect(view.getByText("5 aktif")).toBeTruthy();
        expect(view.getByText("5 pengingat sholat dijadwalkan.")).toBeTruthy();
        expect(view.queryByText(`${FULL_WINDOW} aktif`)).toBeNull();
        expect(
            view.queryByText(`${FULL_WINDOW} pengingat sholat dijadwalkan.`),
        ).toBeNull();
    });

    test("turning reminders off cancels everything", async () => {
        const view = await renderSettings();
        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();

        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === 0);
        await settleIdle();

        expect(mockStore.size).toBe(0);
        expect(view.getByText("0 aktif")).toBeTruthy();
        expect(view.getByText("Pengingat sholat dinonaktifkan.")).toBeTruthy();
    });

    test("rapid on, off, on leaves exactly one week of reminders per prayer", async () => {
        const view = await renderSettings();

        fireEvent.press(reminderToggle(view));
        fireEvent.press(reminderToggle(view));
        fireEvent.press(reminderToggle(view));
        await settleIdle();

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(mockStore.size).toBe(FULL_WINDOW);
        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("rapid on then off leaves no stray notification", async () => {
        const view = await renderSettings();

        fireEvent.press(reminderToggle(view));
        fireEvent.press(reminderToggle(view));
        await settle();
        await settle();

        expect(reminderEntries()).toHaveLength(0);
        expect(mockStore.size).toBe(0);
        expect(view.getByText("0 aktif")).toBeTruthy();
    });

    test("pressing the toggle twice before the screen updates schedules once", async () => {
        const view = await renderSettings();
        const toggle = reminderToggle(view);

        await act(async () => {
            fireEvent.press(toggle);
            fireEvent.press(toggle);
        });
        await settleIdle();

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(mockStore.size).toBe(FULL_WINDOW);
        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("the reschedule button keeps one week of reminders per prayer", async () => {
        const view = await renderSettings();
        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();

        fireEvent.press(view.getByText("Atur ulang pengingat"));
        fireEvent.press(view.getByText("Atur ulang pengingat"));
        await settleIdle();

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(mockStore.size).toBe(FULL_WINDOW);
    });

    test("changing lead, prayers and corrections reschedules without growth", async () => {
        const view = await renderSettings();
        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();

        fireEvent.press(view.getByText("30 menit"));
        await settleIdle();
        expect(reminderEntries()).toHaveLength(FULL_WINDOW);

        const subuhPills = view.getAllByText("Subuh");
        fireEvent.press(subuhPills[subuhPills.length - 1]);
        await settle(() => reminderEntries().length === windowOf(4));
        await settleIdle();
        expect(reminderEntries()).toHaveLength(windowOf(4));
        expect(
            reminderEntries().some(
                (request) => request.content.data.prayer === "fajr",
            ),
        ).toBe(false);
        expect(view.getByText("4 aktif")).toBeTruthy();

        fireEvent.press(view.getAllByText("-1")[3]);
        await settleIdle();
        const dhuhrEntries = reminderEntries().filter(
            (request) => request.content.data.prayer === "dhuhr",
        );
        expect(reminderEntries()).toHaveLength(windowOf(4));
        expect(dhuhrEntries).toHaveLength(REMINDER_HORIZON_DAYS);
        dhuhrEntries.forEach((request) =>
            expect(request.content.body).toBe(
                "Waktu Dzuhur masuk pukul 11:44.",
            ),
        );

        const pills = view.getAllByText("Subuh");
        fireEvent.press(pills[pills.length - 1]);
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();
        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(mockStore.size).toBe(FULL_WINDOW);
        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("sweeps reminders left behind by the old build when reminders are off", async () => {
        seedOrphans(5);

        const view = await renderSettings();
        await settle(() => reminderEntries().length === 0);

        expect(reminderEntries()).toHaveLength(0);
        expect(mockStore.size).toBe(0);
        expect(view.getByText("0 aktif")).toBeTruthy();
    });

    test("replaces reminders left behind by the old build when reminders are on", async () => {
        mockPrefs.set("prayer-reminder-enabled", true);
        seedOrphans(5);

        const view = await renderSettings();
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();

        const ids = reminderEntries().map((request) => request.identifier);
        expect(ids).toHaveLength(FULL_WINDOW);
        ids.forEach((id) => expect(id).toMatch(/^prayer-reminder:/));
        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("opening the screen again with reminders on does not duplicate them", async () => {
        mockPrefs.set("prayer-reminder-enabled", true);

        const first = await renderSettings();
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();
        first.unmount();

        const second = await renderSettings();
        await settleIdle();

        expect(reminderEntries()).toHaveLength(FULL_WINDOW);
        expect(mockStore.size).toBe(FULL_WINDOW);
        expect(second.getByText("5 aktif")).toBeTruthy();
    });

    test("tells the user when notification permission is missing", async () => {
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: false });
        Notifications.requestPermissionsAsync.mockResolvedValue({
            granted: false,
        });
        const view = await renderSettings();

        fireEvent.press(reminderToggle(view));
        await settle();

        expect(view.getByText("Izin notifikasi belum aktif.")).toBeTruthy();
        expect(reminderEntries()).toHaveLength(0);
        expect(view.getByText("0 aktif")).toBeTruthy();
    });

    test("counts prayers, not notifications, when it only lists what is already scheduled", async () => {
        mockPrefs.set("prayer-reminder-enabled", true);
        getPrayerTimes.mockRejectedValue(new Error("offline"));
        ["fajr", "dhuhr", "asr", "maghrib"].forEach(seedWeek);

        const view = await openSettingsWhenIdle();

        expect(reminderEntries()).toHaveLength(windowOf(4));
        expect(view.getByText("4 aktif")).toBeTruthy();
        expect(view.queryByText(`${windowOf(4)} aktif`)).toBeNull();
        expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();

        seedWeek("isha");
        fireEvent.press(view.getByText("Atur ulang pengingat"));
        await settleIdle();

        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("uses the offline prayer pack for the coming days", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        mockPrefs.set("prayer-reminder-enabled", true);
        getOfflinePrayerForDate.mockImplementation(async ({ date }) =>
            date === "2026-10-03" ? { ...prayerTimes, fajr: "04:30" } : null,
        );

        const view = await renderSettings();
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();

        const fajrOn = (day) =>
            mockStore.get(`prayer-reminder:fajr:2026-10-0${day}`);
        expect(fajrOn(1).content.body).toBe("Waktu Subuh masuk pukul 04:40.");
        expect(fajrOn(2).content.body).toBe("Waktu Subuh masuk pukul 04:40.");
        expect(fajrOn(3).content.body).toBe("Waktu Subuh masuk pukul 04:30.");
        expect(fajrOn(3).trigger.date).toEqual(new Date(2026, 9, 3, 4, 20));
        expect(fajrOn(4).content.body).toBe("Waktu Subuh masuk pukul 04:40.");
        expect(getOfflinePrayerForDate).toHaveBeenCalledWith({
            date: "2026-10-03",
            lat: -6.2088,
            lng: 106.8456,
            madhab: "shafi",
            method: "kemenag",
        });
        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("applies the saved corrections to the offline pack times as well", async () => {
        freezeClock(new Date(2026, 9, 1, 3, 0));
        mockPrefs.set("prayer-reminder-enabled", true);
        mockPrefs.set("prayer-adjustments", { fajr: 2 });
        getOfflinePrayerForDate.mockImplementation(async ({ date }) =>
            date === "2026-10-05" ? { ...prayerTimes, fajr: "04:30" } : null,
        );

        await openSettingsWhenIdle();
        await settle(() => reminderEntries().length === FULL_WINDOW);
        await settleIdle();

        expect(
            mockStore.get("prayer-reminder:fajr:2026-10-05").content.body,
        ).toBe("Waktu Subuh masuk pukul 04:32.");
        expect(
            mockStore.get("prayer-reminder:fajr:2026-10-04").content.body,
        ).toBe("Waktu Subuh masuk pukul 04:42.");
    });
});
