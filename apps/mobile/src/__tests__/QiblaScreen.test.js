import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
    Accuracy: { High: 5, Balanced: 3 },
}));

import * as Location from "expo-location";

jest.mock("../components/Screen", () => {
    const {
        View,
        Text,
        ActivityIndicator,
        Pressable,
    } = require("react-native");
    return {
        Screen: ({
            children,
            title,
            subtitle,
            refreshing,
            actions,
            contentStyle,
            onRefresh,
        }) => (
            <View style={contentStyle}>
                <Text testID='screen-title'>{title}</Text>
                {subtitle ? (
                    <Text testID='screen-subtitle'>{subtitle}</Text>
                ) : null}
                <View testID='screen-actions'>{actions}</View>
                {onRefresh ? (
                    <Pressable testID='screen-refresh' onPress={onRefresh}>
                        <Text>Refresh</Text>
                    </Pressable>
                ) : null}
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

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(),
}));

const mockWatchCompass = jest.fn();
const mockRemoveSubscription = jest.fn();

jest.mock("../utils/compass", () => ({
    compassSupported: jest.fn(() => true),
    watchCompassHeading: (...args) => mockWatchCompass(...args),
    qiblaOffset: jest.fn(() => null),
    signedOffset: jest.fn(() => null),
}));

jest.mock("../components/Paper", () => {
    const { Pressable, Text, View } = require("react-native");
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
        ActionPill: ({ label, onPress, disabled }) => (
            <Pressable
                onPress={onPress}
                disabled={disabled}
                testID={`pill-${label}`}
            >
                <Text>{label}</Text>
            </Pressable>
        ),
        EmptyState: ({ title, description, action }) => (
            <View testID='empty-state'>
                <Text testID='empty-title'>{title}</Text>
                {description ? <Text>{description}</Text> : null}
                {action}
            </View>
        ),
    };
});

import { QiblaScreen } from "../screens/QiblaScreen";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";

const mockCoords = { latitude: -6.2, longitude: 106.8, accuracy: 100 };

describe("QiblaScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockWatchCompass.mockResolvedValue({ remove: mockRemoveSubscription });
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: mockCoords,
        });
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: false,
        });
    });

    test("renders screen title", async () => {
        const { getByTestId } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(getByTestId("screen-title")).toBeTruthy();
        });
        expect(getByTestId("screen-title").props.children).toBe("Qibla");
        expect(getByTestId("qibla-classic-surface")).toBeTruthy();
    });

    test("uses web app Qibla surface when web app layout is active", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getAllByText, getByTestId, getByText, queryByTestId } = render(
            <QiblaScreen onBack={jest.fn()} />,
        );

        await waitFor(() => {
            expect(getByTestId("qibla-web-app-surface")).toBeTruthy();
        });
        expect(getByTestId("screen-title").props.children).toBe("Kiblat");
        expect(getByText("Temukan arah Ka'bah dari lokasi kamu")).toBeTruthy();
        expect(queryByTestId("qibla-classic-surface")).toBeNull();
        expect(queryByTestId("action-Kembali ke Ibadah")).toBeNull();

        await waitFor(() => {
            expect(getAllByText("Arah Kiblat").length).toBeGreaterThanOrEqual(
                1,
            );
            expect(getByText("Sudut Kiblat")).toBeTruthy();
            expect(getByText("Jarak ke Ka'bah")).toBeTruthy();
            expect(getByText("Lokasi Kamu")).toBeTruthy();
            expect(
                getByText(
                    "Arah dihitung menggunakan koordinat GPS. Untuk akurasi tertinggi, pastikan GPS aktif.",
                ),
            ).toBeTruthy();
        });
    });

    test("uses light web app Qibla palette when theme is light", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getByTestId } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(getByTestId("qibla-web-app-location-card")).toBeTruthy();
        });

        expect(
            StyleSheet.flatten(
                getByTestId("qibla-web-app-surface").props.style,
            ),
        ).toEqual(expect.objectContaining({ backgroundColor: "#f8fafc" }));
        expect(
            StyleSheet.flatten(
                getByTestId("qibla-web-app-location-card").props.style,
            ),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#ffffff",
                borderColor: "#e5e7eb",
            }),
        );
    });

    test("uses dark web app Qibla palette when theme is dark", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: true,
            isWebAppLayout: true,
        });
        const { getByTestId } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(getByTestId("qibla-web-app-location-card")).toBeTruthy();
        });

        expect(
            StyleSheet.flatten(
                getByTestId("qibla-web-app-surface").props.style,
            ),
        ).toEqual(expect.objectContaining({ backgroundColor: "#020617" }));
        expect(
            StyleSheet.flatten(
                getByTestId("qibla-web-app-location-card").props.style,
            ),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#111827",
                borderColor: "#334155",
            }),
        );
    });

    test("shows loader while loading location", () => {
        Location.requestForegroundPermissionsAsync.mockReturnValue(
            new Promise(() => {}),
        );

        const { getByTestId } = render(<QiblaScreen onBack={jest.fn()} />);

        expect(getByTestId("screen-loader")).toBeTruthy();
    });

    test("shows permission denied message", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(
                getByText(
                    "Aktifkan lokasi untuk menghitung arah kiblat dari posisimu.",
                ),
            ).toBeTruthy();
        });
    });

    test("shows manual location form when location not available", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText, getByPlaceholderText } = render(
            <QiblaScreen onBack={jest.fn()} />,
        );

        await waitFor(() => {
            expect(getByText("Lokasi Manual")).toBeTruthy();
        });

        expect(getByPlaceholderText("-6.2088 (Lintang)")).toBeTruthy();
        expect(getByPlaceholderText("106.8456 (Bujur)")).toBeTruthy();
        expect(getByText("Hitung Arah Kiblat")).toBeTruthy();
    });

    test("applies manual location via button press", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText, getByPlaceholderText, queryByText } = render(
            <QiblaScreen onBack={jest.fn()} />,
        );

        await waitFor(() => {
            expect(getByText("Lokasi Manual")).toBeTruthy();
        });

        const latInput = getByPlaceholderText("-6.2088 (Lintang)");
        const lngInput = getByPlaceholderText("106.8456 (Bujur)");

        fireEvent.changeText(latInput, "-6.2");
        fireEvent.changeText(lngInput, "106.8");
        fireEvent.press(getByText("Hitung Arah Kiblat"));

        await waitFor(() => {
            expect(
                queryByText(
                    "Lokasi manual dipakai untuk menghitung arah kiblat.",
                ),
            ).toBeTruthy();
        });
    });

    test("shows compass UI with location and heading", async () => {
        const compassModule = require("../utils/compass");
        compassModule.qiblaOffset.mockReturnValue(5);
        compassModule.signedOffset.mockReturnValue(5);

        mockWatchCompass.mockImplementation(async (onHeading) => {
            onHeading(180);
            return { remove: mockRemoveSubscription };
        });

        const { getByText } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(getByText("Arah Kiblat")).toBeTruthy();
        });

        expect(getByText("Lokasi aktif")).toBeTruthy();
        expect(getByText("Kompas aktif")).toBeTruthy();
    });

    test("shows calibrate message when heading is null", async () => {
        mockWatchCompass.mockResolvedValue({ remove: mockRemoveSubscription });

        const { getByText } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(
                getByText(
                    "Gerakkan HP membentuk angka 8 untuk mengaktifkan kompas.",
                ),
            ).toBeTruthy();
        });
    });

    test("shows empty state when direction is not available", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(getByText("Arah kiblat belum tersedia")).toBeTruthy();
        });
    });

    test("renders distance and qibla metrics", async () => {
        const compassModule = require("../utils/compass");
        compassModule.qiblaOffset.mockReturnValue(5);
        compassModule.signedOffset.mockReturnValue(5);

        mockWatchCompass.mockImplementation(async (onHeading) => {
            onHeading(180);
            return { remove: mockRemoveSubscription };
        });

        const { getByText, getAllByText } = render(
            <QiblaScreen onBack={jest.fn()} />,
        );

        await waitFor(() => {
            expect(getByText("Jarak")).toBeTruthy();
            expect(getAllByText("Qibla").length).toBeGreaterThanOrEqual(2);
            expect(getByText("Kompas")).toBeTruthy();
            expect(getByText("Lokasi")).toBeTruthy();
        });
    });

    test("refresh button triggers load again", async () => {
        const { getByTestId } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(getByTestId("card-title")).toBeTruthy();
            expect(
                Location.requestForegroundPermissionsAsync,
            ).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            fireEvent.press(getByTestId("screen-refresh"));
        });

        await waitFor(() => {
            expect(
                Location.requestForegroundPermissionsAsync,
            ).toHaveBeenCalledTimes(2);
        });
    });

    test("shows error for invalid manual coordinates", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText, getByPlaceholderText } = render(
            <QiblaScreen onBack={jest.fn()} />,
        );

        await waitFor(() => {
            expect(getByText("Lokasi Manual")).toBeTruthy();
        });

        fireEvent.changeText(getByPlaceholderText("-6.2088 (Lintang)"), "999");
        fireEvent.changeText(getByPlaceholderText("106.8456 (Bujur)"), "106.8");
        fireEvent.press(getByText("Hitung Arah Kiblat"));

        await waitFor(() => {
            expect(
                getByText(
                    "Masukkan koordinat yang valid. Contoh: -6.2088, 106.8456",
                ),
            ).toBeTruthy();
        });
    });

    test("shows retry message on location error", async () => {
        Location.requestForegroundPermissionsAsync.mockRejectedValue(
            new Error("GPS failed"),
        );

        const { getByText } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(
                getByText(
                    "Lokasi belum terbaca. Aktifkan GPS lalu muat ulang arah kiblat.",
                ),
            ).toBeTruthy();
        });
    });
});
