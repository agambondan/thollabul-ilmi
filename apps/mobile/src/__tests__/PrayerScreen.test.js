import React from "react";
import { act, render, fireEvent, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { flushAsyncWork } from "../test-utils/async";

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

import * as Location from "expo-location";

jest.mock("../components/Screen", () => {
    const { View, Text, ActivityIndicator } = require("react-native");
    return {
        Screen: ({
            children,
            title,
            subtitle,
            refreshing,
            actions,
            contentStyle,
        }) => (
            <View style={contentStyle}>
                <Text testID='screen-title'>{title}</Text>
                {subtitle ? (
                    <Text testID='screen-subtitle'>{subtitle}</Text>
                ) : null}
                <View testID='screen-actions'>{actions}</View>
                {refreshing ? (
                    <ActivityIndicator testID='screen-loader' />
                ) : null}
                {children}
            </View>
        ),
    };
});

jest.mock("../components/Card", () => {
    const { View, Text } = require("react-native");
    return {
        Card: ({ children, style }) => (
            <View testID='card' style={style}>
                {children}
            </View>
        ),
        CardTitle: ({ children, meta }) => (
            <View>
                <Text testID='card-title'>{children}</Text>
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
        prayerReminderIds: "prayer-reminder-ids",
        prayerLocation: "prayer-location",
        prayerScheduleCache: "prayer-schedule-cache",
    },
    readPreference: jest.fn(),
    writePreference: jest.fn(),
}));

jest.mock("../utils/prayerNotifications", () => ({
    listPrayerReminders: jest.fn(() => Promise.resolve([])),
    notificationsSupported: jest.fn(() => true),
    showPrayerTimeNotification: jest.fn(),
    syncPrayerReminders: jest.fn(() =>
        Promise.resolve({ scheduled: [], status: "disabled" }),
    ),
}));

import { PrayerScreen } from "../screens/PrayerScreen";
import { useFeedback } from "../context/FeedbackContext";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { getPrayerTimes } from "../api/client";
import { readPreference, writePreference } from "../storage/preferences";
import {
    getOfflinePrayerForDate,
    getPrayerOfflineOverview,
} from "../storage/offlineContent";

const mockPrayerTimes = {
    imsak: "04:30",
    fajr: "04:40",
    sunrise: "05:50",
    dhuhr: "11:45",
    asr: "15:00",
    maghrib: "17:45",
    isha: "19:00",
};

const defaultNavigation = {
    setBack: jest.fn(),
    clearBack: jest.fn(),
    current: null,
};

const renderPrayerScreen = async () => {
    const view = render(
        <PrayerScreen isActive={true} navigation={defaultNavigation} />,
    );
    await flushAsyncWork();
    return view;
};

describe("PrayerScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        readPreference.mockResolvedValue(null);
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -6.2, longitude: 106.8 },
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

    test("renders screen title", async () => {
        const { getByTestId } = await renderPrayerScreen();

        expect(getByTestId("screen-title")).toBeTruthy();
        expect(getByTestId("screen-title").props.children).toBe(
            "Jadwal Sholat",
        );
        expect(getByTestId("prayer-classic-main")).toBeTruthy();
    });

    test("uses web app prayer main surface when web app layout is active", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getByTestId, queryByTestId } = await renderPrayerScreen();

        expect(getByTestId("prayer-web-app-main")).toBeTruthy();
        expect(queryByTestId("prayer-classic-main")).toBeNull();
    });

    test("uses light web app prayer palette when theme is light", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByTestId } = await renderPrayerScreen();

        await waitFor(() =>
            expect(getByTestId("prayer-web-app-schedule-card")).toBeTruthy(),
        );
        expect(
            StyleSheet.flatten(getByTestId("prayer-web-app-main").props.style),
        ).toEqual(expect.objectContaining({ backgroundColor: "#f8fafc" }));
        expect(
            StyleSheet.flatten(
                getByTestId("prayer-web-app-schedule-card").props.style,
            ),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#ffffff",
                borderColor: "#e5e7eb",
            }),
        );
    });

    test("uses dark web app prayer palette when theme is dark", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: true,
            isWebAppLayout: true,
        });
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByTestId } = await renderPrayerScreen();

        await waitFor(() =>
            expect(getByTestId("prayer-web-app-schedule-card")).toBeTruthy(),
        );
        expect(
            StyleSheet.flatten(getByTestId("prayer-web-app-main").props.style),
        ).toEqual(expect.objectContaining({ backgroundColor: "#020617" }));
        expect(
            StyleSheet.flatten(
                getByTestId("prayer-web-app-schedule-card").props.style,
            ),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#111827",
                borderColor: "#334155",
            }),
        );
    });

    test("web app layout renders dashboard-style prayer schedule", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText, getAllByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("BERIKUTNYA")).toBeTruthy();
        });

        expect(getAllByText("Jadwal Sholat").length).toBeGreaterThan(1);
        expect(getByText("Kemenag · Shafi")).toBeTruthy();
        expect(getByText("الفجر")).toBeTruthy();
    });

    test("web app layout renders dashboard-style settings view", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText, getByTestId } = await renderPrayerScreen();

        fireEvent.press(getByText("Buka pengaturan sholat"));

        await waitFor(() => {
            expect(getByTestId("prayer-web-app-settings")).toBeTruthy();
        });

        expect(getByText("Pengaturan")).toBeTruthy();
        expect(getByText("Kemenag · Shafi")).toBeTruthy();
        expect(getByText("Jadwal Offline 30 Hari")).toBeTruthy();
    });

    test("shows loader while loading", async () => {
        Location.requestForegroundPermissionsAsync.mockReturnValue(
            new Promise(() => {}),
        );

        const { getByTestId } = await renderPrayerScreen();

        expect(getByTestId("screen-loader")).toBeTruthy();
    });

    test("shows permission denied message", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(
                getByText(
                    "Aktifkan lokasi untuk memuat jadwal sholat sesuai tempatmu.",
                ),
            ).toBeTruthy();
        });
    });

    test("shows manual location form when permission denied", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText, getByPlaceholderText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Lokasi Manual")).toBeTruthy();
        });

        expect(getByPlaceholderText("-6.2088 (Lintang)")).toBeTruthy();
        expect(getByPlaceholderText("106.8456 (Bujur)")).toBeTruthy();
    });

    test("renders prayer schedule with location", async () => {
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
            error: "Fitur jadwal offline tersedia di aplikasi mobile.",
        });

        const { getByText, queryByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Subuh")).toBeTruthy();
        });

        expect(getByText("Dzuhur")).toBeTruthy();
        expect(getByText("Asr")).toBeTruthy();
        expect(getByText("Maghrib")).toBeTruthy();
        expect(getByText("Isya")).toBeTruthy();
        expect(queryByText("Lokasi Manual")).toBeNull();
    });

    test("does not show prayer log inside schedule screen", async () => {
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText, queryByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Subuh")).toBeTruthy();
        });

        expect(queryByText("Log Sholat")).toBeNull();
        expect(
            queryByText(
                "Buka Profil untuk masuk dan mencatat status sholat harian.",
            ),
        ).toBeNull();
        expect(queryByText("Jamaah")).toBeNull();
    });

    test("navigates to settings view", async () => {
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText, getByTestId } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Subuh")).toBeTruthy();
        });

        fireEvent.press(getByText("Buka pengaturan sholat"));

        await waitFor(() => {
            expect(getByTestId("screen-title").props.children).toBe(
                "Pengaturan Sholat",
            );
            expect(getByTestId("prayer-classic-settings")).toBeTruthy();
        });

        expect(getByText("Kemenag")).toBeTruthy();
        expect(getByText("MWL")).toBeTruthy();
        expect(getByText("Makkah")).toBeTruthy();
        expect(getByText("ISNA")).toBeTruthy();
        expect(getByText("Shafi")).toBeTruthy();
        expect(getByText("Hanafi")).toBeTruthy();
    });

    test("method selection persists preference", async () => {
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Subuh")).toBeTruthy();
        });

        fireEvent.press(getByText("Buka pengaturan sholat"));

        await waitFor(() => {
            expect(getByText("MWL")).toBeTruthy();
        });

        fireEvent.press(getByText("MWL"));

        await waitFor(() => {
            expect(writePreference).toHaveBeenCalledWith(
                "prayer-method",
                "mwl",
            );
        });
    });

    test("adzan audio toggle persists preference and allows sound selection", async () => {
        getPrayerTimes.mockResolvedValue(mockPrayerTimes);
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText, getAllByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Subuh")).toBeTruthy();
        });

        fireEvent.press(getByText("Buka pengaturan sholat"));

        await waitFor(() => {
            expect(getByText("Audio Adzan")).toBeTruthy();
        });

        fireEvent.press(getAllByText("Mati")[1]);

        await waitFor(() => {
            expect(writePreference).toHaveBeenCalledWith(
                "prayer-adzan-audio-enabled",
                true,
            );
        });

        await waitFor(() => {
            expect(getByText("Mishary Rashid Al-Afasy")).toBeTruthy();
        });

        fireEvent.press(getByText("Mishary Rashid Al-Afasy"));

        await waitFor(() => {
            expect(writePreference).toHaveBeenCalledWith(
                "prayer-adzan-sound",
                "mishary-alafasy",
            );
        });
    });

    test("shows a friendly message instead of the raw error when API fails", async () => {
        getPrayerTimes.mockRejectedValue(new Error("Network error"));
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText, queryByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Jadwal sholat belum tersedia.")).toBeTruthy();
        });
        expect(queryByText("Network error")).toBeNull();
    });
});

const mockPreferences = (values = {}) => {
    readPreference.mockImplementation((key, fallback) =>
        Promise.resolve(key in values ? values[key] : fallback),
    );
};

const savedLocation = {
    lat: -6.2088,
    lng: 106.8456,
    source: "gps",
    updatedAt: 1,
};

const cachedSchedule = (overrides = {}) => ({
    coords: { lat: -6.2088, lng: 106.8456 },
    date: "2026-09-30",
    madhab: "shafi",
    method: "kemenag",
    prayers: mockPrayerTimes,
    updatedAt: Date.now() - 60 * 60 * 1000,
    ...overrides,
});

const rateLimitError = () =>
    Object.assign(new Error("Request failed: 429"), { status: 429 });

const setupResilienceMocks = () => {
    jest.clearAllMocks();
    getPrayerTimes.mockReset();
    getPrayerOfflineOverview.mockReset();
    getOfflinePrayerForDate.mockReset();
    Location.requestForegroundPermissionsAsync.mockReset();
    Location.getCurrentPositionAsync.mockReset();
    getPrayerTimes.mockResolvedValue(mockPrayerTimes);
    getPrayerOfflineOverview.mockResolvedValue({ supported: false, days: 0 });
    getOfflinePrayerForDate.mockResolvedValue(null);
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: "granted",
    });
    Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: -6.2088, longitude: 106.8456 },
    });
    mockPreferences();
    useFeedback.mockReturnValue({
        showError: jest.fn(),
        showInfo: jest.fn(),
        showSuccess: jest.fn(),
    });
    useLayoutModePreference.mockReturnValue({
        isDarkTheme: false,
        isWebAppLayout: false,
    });
};

describe("PrayerScreen schedule resilience", () => {
    beforeEach(setupResilienceMocks);

    afterEach(() => {
        jest.useRealTimers();
    });

    test("keeps the last schedule and flags it as old when a refresh fails with HTTP 429", async () => {
        const { getByTestId, getByText, queryByTestId, queryByText } =
            await renderPrayerScreen();
        await waitFor(() => expect(getByText("04:40")).toBeTruthy());
        await waitFor(() => expect(queryByTestId("screen-loader")).toBeNull());
        expect(queryByTestId("prayer-stale-indicator")).toBeNull();

        getPrayerTimes.mockRejectedValueOnce(rateLimitError());
        fireEvent.press(getByTestId("action-Muat ulang jadwal"));
        await flushAsyncWork(12);

        expect(
            getByText(
                "Server sedang sibuk. Coba muat ulang beberapa saat lagi.",
            ),
        ).toBeTruthy();
        expect(queryByTestId("screen-loader")).toBeNull();
        expect(getByText("04:40")).toBeTruthy();
        expect(getByTestId("prayer-stale-indicator").props.children).toMatch(
            /^Data lama · diperbarui /,
        );
        expect(queryByText("Request failed: 429")).toBeNull();

        fireEvent.press(getByTestId("action-Muat ulang jadwal"));
        await flushAsyncWork(12);

        expect(queryByTestId("prayer-stale-indicator")).toBeNull();
        expect(getByText("04:40")).toBeTruthy();
    });

    test("uses the saved location and cached schedule when GPS gives no fix", async () => {
        mockPreferences({
            "prayer-location": savedLocation,
            "prayer-schedule-cache": cachedSchedule(),
        });
        Location.getCurrentPositionAsync.mockRejectedValue(new Error("no fix"));

        const { getByText, queryByText } = await renderPrayerScreen();

        await waitFor(() => expect(getByText("04:40")).toBeTruthy());
        expect(getPrayerTimes).toHaveBeenCalledWith({
            lat: -6.2088,
            lng: 106.8456,
            madhab: "shafi",
            method: "kemenag",
        });
        expect(
            getByText(
                "Lokasi saat ini belum terbaca. Memakai lokasi terakhir yang tersimpan.",
            ),
        ).toBeTruthy();
        expect(getByText("Lokasi terakhir: -6.2088, 106.8456")).toBeTruthy();
        expect(getByText("Ubah lokasi")).toBeTruthy();
        expect(queryByText("Terapkan Lokasi")).toBeNull();
    });

    test("gives up on a slow GPS fix after ten seconds and uses the saved location", async () => {
        jest.useFakeTimers();
        mockPreferences({ "prayer-location": savedLocation });
        Location.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(
            <PrayerScreen isActive={true} navigation={defaultNavigation} />,
        );
        await flushAsyncWork();
        expect(getPrayerTimes).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(10001);
        });
        await flushAsyncWork();

        expect(getPrayerTimes).toHaveBeenCalledWith({
            lat: -6.2088,
            lng: 106.8456,
            madhab: "shafi",
            method: "kemenag",
        });
        expect(getByText("04:40")).toBeTruthy();
    });

    test("falls back to the cached schedule with a friendly message when the network is down", async () => {
        mockPreferences({
            "prayer-location": savedLocation,
            "prayer-schedule-cache": cachedSchedule(),
        });
        getPrayerTimes.mockRejectedValue(
            new Error(
                "Network request failed ke https://api.example.test. Pastikan HP bisa membuka https://api.example.test/api/v1/surah?size=1",
            ),
        );

        const { getByTestId, getByText, queryByText } =
            await renderPrayerScreen();

        await waitFor(() =>
            expect(
                getByText(
                    "Tidak ada koneksi internet. Periksa jaringanmu lalu muat ulang jadwal.",
                ),
            ).toBeTruthy(),
        );
        expect(getByText("04:40")).toBeTruthy();
        expect(getByTestId("prayer-stale-indicator")).toBeTruthy();
        expect(queryByText(/Network request failed/)).toBeNull();
    });

    test("shows a friendly message and no schedule when nothing is cached", async () => {
        getPrayerTimes.mockRejectedValue(
            Object.assign(new Error("Request failed: 500"), { status: 500 }),
        );

        const { getByText, queryByTestId, queryByText } =
            await renderPrayerScreen();

        await waitFor(() =>
            expect(getByText("Jadwal sholat belum tersedia.")).toBeTruthy(),
        );
        expect(queryByText("Request failed: 500")).toBeNull();
        expect(queryByText("04:40")).toBeNull();
        expect(queryByTestId("prayer-stale-indicator")).toBeNull();
    });

    test("does not reuse a cached schedule that belongs to another place", async () => {
        mockPreferences({
            "prayer-schedule-cache": cachedSchedule({
                coords: { lat: 39.237, lng: -123.15 },
            }),
        });
        getPrayerTimes.mockRejectedValue(rateLimitError());

        const { getByText, queryByTestId, queryByText } =
            await renderPrayerScreen();

        await waitFor(() =>
            expect(
                getByText(
                    "Server sedang sibuk. Coba muat ulang beberapa saat lagi.",
                ),
            ).toBeTruthy(),
        );
        expect(queryByText("04:40")).toBeNull();
        expect(queryByTestId("prayer-stale-indicator")).toBeNull();
    });

    test("ignores a cached schedule older than seven days", async () => {
        mockPreferences({
            "prayer-schedule-cache": cachedSchedule({
                updatedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
            }),
        });
        getPrayerTimes.mockRejectedValue(rateLimitError());

        const { getByText, queryByTestId, queryByText } =
            await renderPrayerScreen();

        await waitFor(() =>
            expect(
                getByText(
                    "Server sedang sibuk. Coba muat ulang beberapa saat lagi.",
                ),
            ).toBeTruthy(),
        );
        expect(queryByText("04:40")).toBeNull();
        expect(queryByTestId("prayer-stale-indicator")).toBeNull();
    });

    test("prefers today's offline pack over the cached schedule", async () => {
        mockPreferences({ "prayer-schedule-cache": cachedSchedule() });
        getPrayerTimes.mockRejectedValue(rateLimitError());
        getOfflinePrayerForDate.mockResolvedValue({
            ...mockPrayerTimes,
            fajr: "04:41",
        });

        const { getByText, queryByTestId } = await renderPrayerScreen();

        await waitFor(() => expect(getByText("04:41")).toBeTruthy());
        expect(
            getByText("Jadwal hari ini dimuat dari data offline."),
        ).toBeTruthy();
        expect(queryByTestId("prayer-stale-indicator")).toBeNull();
    });

    test("names the method of the old data when it differs from the selected one", async () => {
        mockPreferences({
            "prayer-location": savedLocation,
            "prayer-method": "mwl",
            "prayer-schedule-cache": cachedSchedule(),
        });
        getPrayerTimes.mockRejectedValue(rateLimitError());

        const { getByTestId } = await renderPrayerScreen();

        await waitFor(() =>
            expect(getByTestId("prayer-stale-indicator")).toBeTruthy(),
        );
        expect(getByTestId("prayer-stale-indicator").props.children).toMatch(
            /^Data lama \(Kemenag · Shafi\) · diperbarui /,
        );
    });

    test("changing method or madhab only refetches the schedule", async () => {
        const { getByTestId, getByText } = await renderPrayerScreen();
        await waitFor(() => expect(getByText("04:40")).toBeTruthy());
        expect(
            Location.requestForegroundPermissionsAsync,
        ).toHaveBeenCalledTimes(1);
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
        expect(getPrayerTimes).toHaveBeenCalledTimes(1);

        fireEvent.press(getByTestId("action-Buka pengaturan sholat"));
        await waitFor(() => expect(getByText("MWL")).toBeTruthy());

        fireEvent.press(getByText("MWL"));
        await waitFor(() => expect(getPrayerTimes).toHaveBeenCalledTimes(2));
        expect(getPrayerTimes).toHaveBeenLastCalledWith({
            lat: -6.2088,
            lng: 106.8456,
            madhab: "shafi",
            method: "mwl",
        });

        fireEvent.press(getByText("Hanafi"));
        await waitFor(() => expect(getPrayerTimes).toHaveBeenCalledTimes(3));
        expect(getPrayerTimes).toHaveBeenLastCalledWith({
            lat: -6.2088,
            lng: 106.8456,
            madhab: "hanafi",
            method: "mwl",
        });
        expect(
            Location.requestForegroundPermissionsAsync,
        ).toHaveBeenCalledTimes(1);
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });

    test("starts with the saved method so the first request is not wasted", async () => {
        mockPreferences({ "prayer-method": "makkah" });

        const { getByText } = await renderPrayerScreen();
        await waitFor(() => expect(getByText("04:40")).toBeTruthy());

        expect(getPrayerTimes).toHaveBeenCalledTimes(1);
        expect(getPrayerTimes).toHaveBeenCalledWith({
            lat: -6.2088,
            lng: 106.8456,
            madhab: "shafi",
            method: "makkah",
        });
    });

    test("ignores the answer of a request that was superseded", async () => {
        let resolveFirst;
        getPrayerTimes.mockReset();
        getPrayerTimes.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveFirst = resolve;
                }),
        );
        getPrayerTimes.mockResolvedValueOnce({
            ...mockPrayerTimes,
            fajr: "04:55",
        });

        const { getByTestId, getByText } = await renderPrayerScreen();
        await waitFor(() => expect(getPrayerTimes).toHaveBeenCalledTimes(1));

        fireEvent.press(getByTestId("action-Buka pengaturan sholat"));
        await waitFor(() => expect(getByText("MWL")).toBeTruthy());
        fireEvent.press(getByText("MWL"));
        await waitFor(() => expect(getPrayerTimes).toHaveBeenCalledTimes(2));
        fireEvent.press(getByTestId("action-Kembali ke jadwal sholat"));
        await waitFor(() => expect(getByText("04:55")).toBeTruthy());

        await act(async () => {
            resolveFirst(mockPrayerTimes);
        });
        await flushAsyncWork();

        expect(getByText("04:55")).toBeTruthy();
    });

    test("keeps a manual location across method changes and restarts", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const first = await renderPrayerScreen();
        await waitFor(() =>
            expect(first.getByText("Lokasi Manual")).toBeTruthy(),
        );
        fireEvent.changeText(
            first.getByPlaceholderText("-6.2088 (Lintang)"),
            "-6.2088",
        );
        fireEvent.changeText(
            first.getByPlaceholderText("106.8456 (Bujur)"),
            "106.8456",
        );
        fireEvent.press(first.getByText("Terapkan Lokasi"));

        await waitFor(() => expect(first.getByText("04:40")).toBeTruthy());
        expect(writePreference).toHaveBeenCalledWith("prayer-location", {
            lat: -6.2088,
            lng: 106.8456,
            source: "manual",
            updatedAt: expect.any(Number),
        });
        expect(
            first.getByText("Lokasi manual: -6.2088, 106.8456"),
        ).toBeTruthy();
        expect(first.queryByText("Terapkan Lokasi")).toBeNull();

        fireEvent.press(first.getByTestId("action-Buka pengaturan sholat"));
        await waitFor(() => expect(first.getByText("MWL")).toBeTruthy());
        fireEvent.press(first.getByText("MWL"));
        await waitFor(() =>
            expect(getPrayerTimes).toHaveBeenLastCalledWith({
                lat: -6.2088,
                lng: 106.8456,
                madhab: "shafi",
                method: "mwl",
            }),
        );
        fireEvent.press(first.getByTestId("action-Kembali ke jadwal sholat"));
        await waitFor(() => expect(first.getByText("04:40")).toBeTruthy());
        expect(
            first.getByText("Lokasi manual: -6.2088, 106.8456"),
        ).toBeTruthy();
        expect(first.queryByText("Lokasi Manual")).toBeNull();

        first.unmount();
        const persisted = writePreference.mock.calls
            .filter(([key]) => key === "prayer-location")
            .pop()[1];
        mockPreferences({
            "prayer-location": persisted,
            "prayer-method": "mwl",
        });
        getPrayerTimes.mockClear();

        const second = await renderPrayerScreen();

        await waitFor(() => expect(second.getByText("04:40")).toBeTruthy());
        expect(getPrayerTimes).toHaveBeenCalledWith({
            lat: -6.2088,
            lng: 106.8456,
            madhab: "shafi",
            method: "mwl",
        });
        expect(
            second.getByText("Lokasi manual: -6.2088, 106.8456"),
        ).toBeTruthy();
        expect(second.queryByText("Lokasi Manual")).toBeNull();
    });

    test("lets the user change a saved location", async () => {
        mockPreferences({
            "prayer-location": { ...savedLocation, source: "manual" },
        });
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByPlaceholderText, getByText, queryByText } =
            await renderPrayerScreen();
        await waitFor(() => expect(getByText("Ubah lokasi")).toBeTruthy());

        fireEvent.press(getByText("Ubah lokasi"));

        expect(getByPlaceholderText("-6.2088 (Lintang)").props.value).toBe(
            "-6.2088",
        );
        expect(getByPlaceholderText("106.8456 (Bujur)").props.value).toBe(
            "106.8456",
        );

        fireEvent.changeText(
            getByPlaceholderText("-6.2088 (Lintang)"),
            "-7,25",
        );
        fireEvent.changeText(
            getByPlaceholderText("106.8456 (Bujur)"),
            "112,75",
        );
        fireEvent.press(getByText("Terapkan Lokasi"));

        await waitFor(() =>
            expect(getPrayerTimes).toHaveBeenLastCalledWith({
                lat: -7.25,
                lng: 112.75,
                madhab: "shafi",
                method: "kemenag",
            }),
        );
        await waitFor(() =>
            expect(getByText("Lokasi manual: -7.2500, 112.7500")).toBeTruthy(),
        );
        expect(queryByText("Terapkan Lokasi")).toBeNull();
        expect(writePreference).toHaveBeenCalledWith("prayer-location", {
            lat: -7.25,
            lng: 112.75,
            source: "manual",
            updatedAt: expect.any(Number),
        });
    });

    test("does not save a location that was only read from the saved record", async () => {
        mockPreferences({ "prayer-location": savedLocation });
        Location.getCurrentPositionAsync.mockRejectedValue(new Error("no fix"));

        const { getByText } = await renderPrayerScreen();
        await waitFor(() => expect(getByText("04:40")).toBeTruthy());

        expect(writePreference).not.toHaveBeenCalledWith(
            "prayer-location",
            expect.anything(),
        );
    });

    test("saves the schedule of every successful load for later fallback", async () => {
        const { getByText } = await renderPrayerScreen();
        await waitFor(() => expect(getByText("04:40")).toBeTruthy());

        expect(writePreference).toHaveBeenCalledWith(
            "prayer-schedule-cache",
            expect.objectContaining({
                coords: { lat: -6.2088, lng: 106.8456 },
                madhab: "shafi",
                method: "kemenag",
                prayers: mockPrayerTimes,
                updatedAt: expect.any(Number),
            }),
        );
        expect(writePreference).toHaveBeenCalledWith(
            "prayer-location",
            expect.objectContaining({
                lat: -6.2088,
                lng: 106.8456,
                source: "gps",
            }),
        );
    });
});

describe("PrayerScreen deep links", () => {
    beforeEach(setupResilienceMocks);

    const renderWithRoute = async (current) => {
        const view = render(
            <PrayerScreen
                isActive={true}
                navigation={{ ...defaultNavigation, current }}
            />,
        );
        await flushAsyncWork();
        return view;
    };

    const rerenderWithRoute = async (view, current) => {
        view.rerender(
            <PrayerScreen
                isActive={true}
                navigation={{ ...defaultNavigation, current }}
            />,
        );
        await flushAsyncWork();
    };

    test("the prayer link brings the user back from settings to the schedule", async () => {
        const view = await renderWithRoute({ id: "1", view: "settings" });
        expect(view.getByTestId("prayer-classic-settings")).toBeTruthy();

        await rerenderWithRoute(view, { id: "2", view: "prayer" });

        expect(view.getByTestId("prayer-classic-main")).toBeTruthy();
        expect(view.queryByTestId("prayer-classic-settings")).toBeNull();
    });

    test("the settings link still opens settings from the schedule", async () => {
        const view = await renderWithRoute({ id: "1", view: "prayer" });
        expect(view.getByTestId("prayer-classic-main")).toBeTruthy();

        await rerenderWithRoute(view, { id: "2", view: "settings" });

        expect(view.getByTestId("prayer-classic-settings")).toBeTruthy();
    });

    test("opening settings from the screen survives a re-render of the same route", async () => {
        const view = await renderWithRoute({ id: "1", view: "prayer" });

        fireEvent.press(view.getByTestId("action-Buka pengaturan sholat"));
        await waitFor(() =>
            expect(view.getByTestId("prayer-classic-settings")).toBeTruthy(),
        );

        await rerenderWithRoute(view, { id: "1", view: "prayer" });

        expect(view.getByTestId("prayer-classic-settings")).toBeTruthy();
    });

    test("the prayer link also works in the web app layout", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const view = await renderWithRoute({ id: "1", view: "settings" });
        expect(view.getByTestId("prayer-web-app-settings")).toBeTruthy();

        await rerenderWithRoute(view, { id: "2", view: "prayer" });

        expect(view.getByTestId("prayer-web-app-main")).toBeTruthy();
    });
});

describe("PrayerScreen web app settings theme", () => {
    beforeEach(setupResilienceMocks);

    const openSettings = async (isDarkTheme) => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme,
            isWebAppLayout: true,
        });
        const view = await renderPrayerScreen();
        await waitFor(() =>
            expect(
                view.getByTestId("prayer-web-app-schedule-card"),
            ).toBeTruthy(),
        );
        fireEvent.press(view.getByTestId("action-Buka pengaturan sholat"));
        await waitFor(() =>
            expect(view.getByTestId("prayer-web-app-settings")).toBeTruthy(),
        );
        return view;
    };

    const flat = (element) => StyleSheet.flatten(element.props.style);

    test("makes every reminder and offline control readable in the dark theme", async () => {
        const view = await openSettings(true);

        expect(flat(view.getByText("Atur ulang pengingat"))).toEqual(
            expect.objectContaining({ color: "#f8fafc" }),
        );
        expect(
            flat(view.getByRole("button", { name: "Atur ulang pengingat" })),
        ).toEqual(expect.objectContaining({ borderColor: "#334155" }));

        ["Pakai hari ini", "Hapus"].forEach((label) => {
            expect(flat(view.getByText(label))).toEqual(
                expect.objectContaining({ color: "#f8fafc" }),
            );
            expect(flat(view.getByRole("button", { name: label }))).toEqual(
                expect.objectContaining({
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                }),
            );
        });

        ["Notifikasi Lokal", "Audio Adzan"].forEach((label) => {
            expect(flat(view.getByText(label))).toEqual(
                expect.objectContaining({ color: "#f8fafc" }),
            );
        });
        expect(flat(view.getAllByText("Nonaktif")[0])).toEqual(
            expect.objectContaining({ color: "#94a3b8" }),
        );

        ["Jeda Pengingat", "Waktu Sholat"].forEach((label) => {
            expect(flat(view.getByText(label))).toEqual(
                expect.objectContaining({ color: "#94a3b8" }),
            );
        });

        expect(flat(view.getByText("Saat waktu masuk"))).toEqual(
            expect.objectContaining({ color: "#f8fafc" }),
        );
        expect(
            flat(view.getByRole("button", { name: "Saat waktu masuk" })),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#0f172a",
                borderColor: "#334155",
            }),
        );
        const lastIsya = () => view.getAllByText("Isya").pop();
        expect(flat(lastIsya())).toEqual(
            expect.objectContaining({ color: "#ffffff" }),
        );
        fireEvent.press(lastIsya());
        await waitFor(() =>
            expect(flat(lastIsya())).toEqual(
                expect.objectContaining({ color: "#f8fafc" }),
            ),
        );
        expect(
            flat(view.getAllByRole("button", { name: "Isya" }).pop()),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#0f172a",
                borderColor: "#334155",
            }),
        );
        expect(flat(view.getAllByText("Mati")[0])).toEqual(
            expect.objectContaining({ color: "#f8fafc" }),
        );
        expect(flat(view.getAllByRole("button", { name: "Mati" })[0])).toEqual(
            expect.objectContaining({ backgroundColor: "#0f172a" }),
        );
    });

    test("themes the muadzin list in the dark theme", async () => {
        const view = await openSettings(true);

        fireEvent.press(view.getAllByText("Mati")[1]);
        await waitFor(() =>
            expect(view.getByText("Mishary Rashid Al-Afasy")).toBeTruthy(),
        );

        expect(flat(view.getByText("Mishary Rashid Al-Afasy"))).toEqual(
            expect.objectContaining({ color: "#f8fafc" }),
        );
        expect(
            flat(view.getByRole("button", { name: /^Mishary Rashid/ })),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#0f172a",
                borderColor: "#334155",
            }),
        );
        expect(flat(view.getByText("Default (Makkah)"))).toEqual(
            expect.objectContaining({ color: "#34d399" }),
        );
        expect(
            flat(view.getByRole("button", { name: /^Default \(Makkah\)/ })),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#064e3b",
                borderColor: "#34d399",
            }),
        );
    });

    test("leaves the light theme exactly as it was", async () => {
        const view = await openSettings(false);

        expect(flat(view.getByText("Atur ulang pengingat"))).toEqual(
            expect.objectContaining({ color: "#0f172a" }),
        );
        expect(
            flat(view.getByRole("button", { name: "Atur ulang pengingat" })),
        ).toEqual(expect.objectContaining({ borderColor: "#e5e7eb" }));
        expect(flat(view.getByRole("button", { name: "Hapus" }))).toEqual(
            expect.objectContaining({
                backgroundColor: "#f8fafc",
                borderColor: "#e5e7eb",
            }),
        );
        expect(flat(view.getByText("Notifikasi Lokal"))).toEqual(
            expect.objectContaining({ color: "#1f2937" }),
        );
        expect(flat(view.getByText("Jeda Pengingat"))).toEqual(
            expect.objectContaining({ color: "#64748b" }),
        );

        fireEvent.press(view.getAllByText("Mati")[1]);
        await waitFor(() =>
            expect(view.getByText("Mishary Rashid Al-Afasy")).toBeTruthy(),
        );
        expect(flat(view.getByText("Mishary Rashid Al-Afasy"))).toEqual(
            expect.objectContaining({ color: "#3c3a35" }),
        );
        expect(
            flat(view.getByRole("button", { name: /^Mishary Rashid/ })),
        ).toEqual(expect.objectContaining({ backgroundColor: "#fefdf9" }));
    });
});
