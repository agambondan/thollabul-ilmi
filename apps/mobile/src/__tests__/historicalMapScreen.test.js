jest.mock("../api/client", () => ({
    requestJson: jest.fn(),
}));

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(),
}));

import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { HistoricalMapContent } from "../screens/HistoricalMapScreen";

const client = require("../api/client");
const { useLayoutModePreference } = require("../hooks/useLayoutModePreference");

const locations = [
    {
        id: "makkah",
        name: "Makkah",
        description: "Kota kelahiran Rasulullah",
        category: "kota",
        era: "pra-islam",
        latitude: 21.3891,
        longitude: 39.8579,
    },
    {
        id: "qarawiyyin",
        name: "Universitas Al-Qarawiyyin",
        description: "Pusat ilmu klasik",
        category: "universitas",
        era: "fatimiyah",
        latitude: 34.0648,
        longitude: -4.973,
    },
];

beforeEach(() => {
    jest.clearAllMocks();
    client.requestJson.mockResolvedValue({ items: locations });
    useLayoutModePreference.mockReturnValue({
        isDarkTheme: false,
        isWebAppLayout: false,
    });
});

describe("HistoricalMapContent", () => {
    test("keeps the classic map surface intact", async () => {
        const { getByText, getByTestId, queryByTestId } = render(
            <HistoricalMapContent />,
        );

        await waitFor(() => {
            expect(getByTestId("historical-map-native")).toBeTruthy();
        });

        expect(queryByTestId("historical-map-web-app-surface")).toBeNull();
        expect(getByText("Makkah")).toBeTruthy();
        expect(client.requestJson).toHaveBeenCalledWith(
            "/api/v1/locations?size=100",
        );
    });

    test("uses dashboard-aligned web app peta controls", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getByPlaceholderText, getByTestId, getByText } = render(
            <HistoricalMapContent />,
        );

        await waitFor(() => {
            expect(getByTestId("historical-map-web-app-surface")).toBeTruthy();
            expect(getByText("2 lokasi")).toBeTruthy();
        });

        expect(getByText("Peta Islam Interaktif")).toBeTruthy();
        expect(
            getByText("Lokasi bersejarah dalam peradaban Islam"),
        ).toBeTruthy();
        expect(getByText("Universitas")).toBeTruthy();
        expect(getByText("Fatimiyah")).toBeTruthy();
        expect(getByPlaceholderText("Cari lokasi...")).toBeTruthy();
    });

    test("uses the light web app Peta palette when light theme is active", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getByTestId } = render(<HistoricalMapContent />);

        await waitFor(() => {
            expect(getByTestId("historical-map-native")).toBeTruthy();
        });

        expect(
            StyleSheet.flatten(
                getByTestId("historical-map-web-app-surface").props.style,
            ),
        ).toMatchObject({
            backgroundColor: "#f8fafc",
        });
        expect(
            StyleSheet.flatten(
                getByTestId("historical-map-web-app-search").props.style,
            ),
        ).toMatchObject({
            backgroundColor: "#ffffff",
            borderColor: "#d1d5db",
            color: "#111827",
        });
        expect(
            StyleSheet.flatten(
                getByTestId("historical-map-native").props.style,
            ),
        ).toMatchObject({
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
        });
    });

    test("uses the dark web app Peta palette when dark theme is active", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: true,
            isWebAppLayout: true,
        });
        const { getByTestId } = render(<HistoricalMapContent />);

        await waitFor(() => {
            expect(getByTestId("historical-map-native")).toBeTruthy();
        });

        expect(
            StyleSheet.flatten(
                getByTestId("historical-map-web-app-surface").props.style,
            ),
        ).toMatchObject({
            backgroundColor: "#020617",
        });
        expect(
            StyleSheet.flatten(
                getByTestId("historical-map-web-app-search").props.style,
            ),
        ).toMatchObject({
            backgroundColor: "#111827",
            borderColor: "#334155",
            color: "#e5e7eb",
        });
        expect(
            StyleSheet.flatten(
                getByTestId("historical-map-native").props.style,
            ),
        ).toMatchObject({
            backgroundColor: "#111827",
            borderColor: "#243044",
        });
    });

    test("web app search and list mode reuse the locations endpoint and filtered list", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getByPlaceholderText, getByText, queryByText } = render(
            <HistoricalMapContent />,
        );

        await waitFor(() => {
            expect(getByText("2 lokasi")).toBeTruthy();
        });

        fireEvent.changeText(
            getByPlaceholderText("Cari lokasi..."),
            "qarawiyyin",
        );

        await waitFor(() => {
            expect(client.requestJson).toHaveBeenLastCalledWith(
                "/api/v1/locations?q=qarawiyyin&size=100",
            );
        });

        fireEvent.press(getByText("Jelajahi"));

        await waitFor(() => {
            expect(getByText("Universitas Al-Qarawiyyin")).toBeTruthy();
        });
        expect(queryByText("Makkah")).toBeNull();
    });
});
