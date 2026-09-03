import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
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
    },
    readPreference: jest.fn(),
    writePreference: jest.fn(),
}));

jest.mock("../utils/prayerNotifications", () => ({
    cancelPrayerReminders: jest.fn(),
    notificationsSupported: jest.fn(() => true),
    schedulePrayerReminders: jest.fn(),
    showPrayerTimeNotification: jest.fn(),
}));

import { PrayerScreen } from "../screens/PrayerScreen";
import { useFeedback } from "../context/FeedbackContext";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { getPrayerTimes } from "../api/client";
import { readPreference, writePreference } from "../storage/preferences";
import { getPrayerOfflineOverview } from "../storage/offlineContent";

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

    test("shows error message when API fails", async () => {
        getPrayerTimes.mockRejectedValue(new Error("Network error"));
        getPrayerOfflineOverview.mockResolvedValue({
            supported: false,
            days: 0,
        });

        const { getByText } = await renderPrayerScreen();

        await waitFor(() => {
            expect(getByText("Network error")).toBeTruthy();
        });
    });
});
