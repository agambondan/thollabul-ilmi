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
import { getPrayerOfflineOverview } from "../storage/offlineContent";
import { PrayerScreen } from "../screens/PrayerScreen";

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

const reminderToggle = (view) =>
    view.getAllByRole("button", { name: /^(Mati|Aktif)$/ })[0];

describe("PrayerScreen reminders with real scheduling", () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

    test("turning reminders on schedules exactly one notification per prayer", async () => {
        const view = await renderSettings();
        expect(reminderEntries()).toHaveLength(0);

        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === 5);

        const ids = reminderEntries().map((request) => request.identifier);
        expect(ids).toHaveLength(5);
        expect(new Set(ids).size).toBe(5);
        ids.forEach((id) => expect(id).toMatch(/^prayer-reminder:/));
        expect(mockStore.size).toBe(5);
        expect(view.getByText("5 aktif")).toBeTruthy();
        expect(view.getByText("5 pengingat sholat dijadwalkan.")).toBeTruthy();
    });

    test("turning reminders off cancels everything", async () => {
        const view = await renderSettings();
        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === 5);

        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === 0);

        expect(mockStore.size).toBe(0);
        expect(view.getByText("0 aktif")).toBeTruthy();
        expect(view.getByText("Pengingat sholat dinonaktifkan.")).toBeTruthy();
    });

    test("rapid on, off, on leaves exactly one notification per prayer", async () => {
        const view = await renderSettings();

        fireEvent.press(reminderToggle(view));
        fireEvent.press(reminderToggle(view));
        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === 5);
        await settle();

        expect(reminderEntries()).toHaveLength(5);
        expect(mockStore.size).toBe(5);
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
        await settle(() => reminderEntries().length === 5);
        await settle();

        expect(reminderEntries()).toHaveLength(5);
        expect(mockStore.size).toBe(5);
        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("the reschedule button keeps one notification per prayer", async () => {
        const view = await renderSettings();
        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === 5);

        fireEvent.press(view.getByText("Atur ulang pengingat"));
        fireEvent.press(view.getByText("Atur ulang pengingat"));
        await settle();
        await settle();

        expect(reminderEntries()).toHaveLength(5);
        expect(mockStore.size).toBe(5);
    });

    test("changing lead, prayers and corrections reschedules without growth", async () => {
        const view = await renderSettings();
        fireEvent.press(reminderToggle(view));
        await settle(() => reminderEntries().length === 5);

        fireEvent.press(view.getByText("30 menit"));
        await settle();
        expect(reminderEntries()).toHaveLength(5);

        const subuhPills = view.getAllByText("Subuh");
        fireEvent.press(subuhPills[subuhPills.length - 1]);
        await settle(() => reminderEntries().length === 4);
        expect(reminderEntries()).toHaveLength(4);
        expect(
            reminderEntries().some(
                (request) => request.content.data.prayer === "fajr",
            ),
        ).toBe(false);
        expect(view.getByText("4 aktif")).toBeTruthy();

        fireEvent.press(view.getAllByText("-1")[3]);
        await settle();
        const dhuhr = reminderEntries().find(
            (request) => request.content.data.prayer === "dhuhr",
        );
        expect(reminderEntries()).toHaveLength(4);
        expect(dhuhr.content.body).toBe("Waktu Dzuhur masuk pukul 11:44.");

        const pills = view.getAllByText("Subuh");
        fireEvent.press(pills[pills.length - 1]);
        await settle(() => reminderEntries().length === 5);
        expect(reminderEntries()).toHaveLength(5);
        expect(mockStore.size).toBe(5);
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
        await settle(() => reminderEntries().length === 5);
        await settle();

        const ids = reminderEntries().map((request) => request.identifier);
        expect(ids).toHaveLength(5);
        ids.forEach((id) => expect(id).toMatch(/^prayer-reminder:/));
        expect(view.getByText("5 aktif")).toBeTruthy();
    });

    test("opening the screen again with reminders on does not duplicate them", async () => {
        mockPrefs.set("prayer-reminder-enabled", true);

        const first = await renderSettings();
        await settle(() => reminderEntries().length === 5);
        first.unmount();

        const second = await renderSettings();
        await settle();

        expect(reminderEntries()).toHaveLength(5);
        expect(mockStore.size).toBe(5);
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
});
