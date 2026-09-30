import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";

const mockWatchHeadingAsync = jest.fn();
const mockRemove = jest.fn();

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
    watchHeadingAsync: (...args) => mockWatchHeadingAsync(...args),
    Accuracy: { High: 5, Balanced: 3 },
}));

import * as Location from "expo-location";

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
        CardTitle: ({ children }) => <Text>{children}</Text>,
    };
});

jest.mock("../components/Paper", () => {
    const { Pressable, Text, View } = require("react-native");
    return {
        IconActionButton: ({ label, onPress }) => (
            <Pressable onPress={onPress} testID={`action-${label}`}>
                <Text>{label}</Text>
            </Pressable>
        ),
        ActionPill: ({ label, onPress }) => (
            <Pressable onPress={onPress}>
                <Text>{label}</Text>
            </Pressable>
        ),
        EmptyState: ({ title, action }) => (
            <View>
                <Text>{title}</Text>
                {action}
            </View>
        ),
    };
});

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(() => ({
        isDarkTheme: false,
        isWebAppLayout: false,
    })),
}));

import { QiblaScreen } from "../screens/QiblaScreen";

describe("QiblaScreen location permission with the real compass helper", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -6.2, longitude: 106.8, accuracy: 20 },
        });
        mockWatchHeadingAsync.mockResolvedValue({ remove: mockRemove });
    });

    test("asks for location permission exactly once when the screen opens", async () => {
        render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(mockWatchHeadingAsync).toHaveBeenCalledTimes(1);
        });
        await act(async () => {});

        expect(
            Location.requestForegroundPermissionsAsync,
        ).toHaveBeenCalledTimes(1);
    });

    test("shows a single banner and never starts the compass when permission is denied", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText, queryByText } = render(
            <QiblaScreen onBack={jest.fn()} />,
        );

        await waitFor(() => {
            expect(
                getByText(
                    "Aktifkan lokasi untuk menghitung arah kiblat dari posisimu.",
                ),
            ).toBeTruthy();
        });
        await act(async () => {});

        expect(
            Location.requestForegroundPermissionsAsync,
        ).toHaveBeenCalledTimes(1);
        expect(mockWatchHeadingAsync).not.toHaveBeenCalled();
        expect(
            queryByText("Izin lokasi diperlukan untuk mengaktifkan kompas."),
        ).toBeNull();
    });

    test("does not show a compass banner when the heading sensor works", async () => {
        const { queryByText } = render(<QiblaScreen onBack={jest.fn()} />);

        await waitFor(() => {
            expect(mockWatchHeadingAsync).toHaveBeenCalledTimes(1);
        });
        await act(async () => {});

        expect(
            queryByText("Kompas tidak tersedia di perangkat ini."),
        ).toBeNull();
    });
});
