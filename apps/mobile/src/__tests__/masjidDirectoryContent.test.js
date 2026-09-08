jest.mock("../api/client", () => ({
    getMasjids: jest.fn(),
    getNearbyMasjids: jest.fn(),
}));

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { MasjidDirectoryContent } from "../screens/MasjidDirectoryContent";

const client = require("../api/client");
const Location = require("expo-location");

const masjidItems = [
    {
        id: 1,
        name: "Masjid Istiqlal",
        district: "Sawah Besar",
        city: "Jakarta Pusat",
        address: "Jl. Taman Wijaya Kusuma",
        latitude: -6.1704,
        longitude: 106.8306,
        phone: "021-3813294",
        capacity: 200000,
        facilities: "Parkir, Wudhu",
        description: "Masjid terbesar di Asia Tenggara.",
    },
    {
        id: 2,
        name: "Masjid Cut Meutia",
        district: "Menteng",
        city: "Jakarta Pusat",
        address: "Jl. Cut Mutiah No.1",
        latitude: -6.1874,
        longitude: 106.8331,
    },
];

beforeEach(() => {
    jest.clearAllMocks();
    client.getMasjids.mockResolvedValue(masjidItems);
    client.getNearbyMasjids.mockResolvedValue([]);
    jest.spyOn(Linking, "openURL").mockResolvedValue();
});

describe("MasjidDirectoryContent", () => {
    test("loads and renders the masjid list", async () => {
        const { getByText } = render(<MasjidDirectoryContent />);

        await waitFor(() => {
            expect(getByText("Masjid Istiqlal")).toBeTruthy();
            expect(getByText("Masjid Cut Meutia")).toBeTruthy();
        });
        expect(client.getMasjids).toHaveBeenCalledWith({
            page: "1",
            size: "50",
        });
    });

    test("filters by search text", async () => {
        const { getByPlaceholderText, getByText } = render(
            <MasjidDirectoryContent />,
        );

        await waitFor(() => expect(getByText("Masjid Istiqlal")).toBeTruthy());

        fireEvent.changeText(
            getByPlaceholderText("Cari nama, kota, atau kecamatan..."),
            "cut",
        );

        await waitFor(() => {
            expect(client.getMasjids).toHaveBeenLastCalledWith({
                page: "1",
                size: "50",
                q: "cut",
            });
        });
    });

    test("opens a detail sheet with address, phone, and facilities", async () => {
        const { getByText } = render(<MasjidDirectoryContent />);

        await waitFor(() => expect(getByText("Masjid Istiqlal")).toBeTruthy());
        fireEvent.press(getByText("Masjid Istiqlal"));

        await waitFor(() => {
            expect(getByText("Masjid terbesar di Asia Tenggara.")).toBeTruthy();
            expect(getByText("Jl. Taman Wijaya Kusuma")).toBeTruthy();
            expect(getByText("021-3813294")).toBeTruthy();
            expect(getByText("Parkir")).toBeTruthy();
        });

        fireEvent.press(getByText("Buka Maps"));
        expect(Linking.openURL).toHaveBeenCalledWith(
            "https://www.google.com/maps/search/?api=1&query=-6.1704,106.8306",
        );
    });

    test("fetches nearby masjids using GPS when the toggle is pressed", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -6.2, longitude: 106.8 },
        });
        client.getNearbyMasjids.mockResolvedValue([
            { ...masjidItems[0], distance_km: 1.2 },
        ]);

        const { getByText } = render(<MasjidDirectoryContent />);
        await waitFor(() => expect(getByText("Masjid Istiqlal")).toBeTruthy());

        fireEvent.press(getByText("Masjid Terdekat"));

        await waitFor(() => {
            expect(client.getNearbyMasjids).toHaveBeenCalledWith({
                lat: -6.2,
                lng: 106.8,
                radius: 25,
                limit: 50,
            });
            expect(getByText("1.2 km")).toBeTruthy();
        });
    });

    test("falls back to the plain list when location permission is denied", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });

        const { getByText } = render(<MasjidDirectoryContent />);
        await waitFor(() => expect(getByText("Masjid Istiqlal")).toBeTruthy());

        fireEvent.press(getByText("Masjid Terdekat"));

        await waitFor(() => {
            expect(
                getByText("Izin lokasi ditolak. Menampilkan daftar biasa."),
            ).toBeTruthy();
            expect(client.getNearbyMasjids).not.toHaveBeenCalled();
        });
    });
});
