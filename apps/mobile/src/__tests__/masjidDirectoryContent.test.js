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
        name: "Masjid Jami' Al-Barkah (Rodja)",
        district: "Kramat Jati",
        city: "Jakarta Timur",
        address: "Jl. Raya Condet No.27, Batu Ampar",
        latitude: -6.2704,
        longitude: 106.8678,
        phone: "021-87781371",
        capacity: 2500,
        facilities: "Kajian sunnah, live streaming Rodja",
        description: "Masjid pusat Radio Rodja 756 AM, kajian sunnah salaf.",
    },
    {
        id: 2,
        name: "Masjid Nur-Salma",
        district: "Setiabudi",
        city: "Jakarta Selatan",
        address: "Jl. HR. Rasuna Said Kav. B1-3, Karet Kuningan",
        latitude: -6.218,
        longitude: 106.831,
    },
];

beforeEach(() => {
    jest.clearAllMocks();
    client.getMasjids.mockResolvedValue(masjidItems);
    client.getNearbyMasjids.mockResolvedValue([]);
    jest.spyOn(Linking, "openURL").mockResolvedValue();
});

describe("MasjidDirectoryContent", () => {
    test("loads and renders the sunnah masjid list", async () => {
        const { getByText } = render(<MasjidDirectoryContent />);

        await waitFor(() => {
            expect(getByText("Masjid Jami' Al-Barkah (Rodja)")).toBeTruthy();
            expect(getByText("Masjid Nur-Salma")).toBeTruthy();
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

        await waitFor(() =>
            expect(getByText("Masjid Jami' Al-Barkah (Rodja)")).toBeTruthy(),
        );

        fireEvent.changeText(
            getByPlaceholderText("Cari nama, kota, atau kecamatan..."),
            "nur",
        );

        await waitFor(() => {
            expect(client.getMasjids).toHaveBeenLastCalledWith({
                page: "1",
                size: "50",
                q: "nur",
            });
        });
    });

    test("opens a detail sheet with address, phone, and facilities", async () => {
        const { getByText } = render(<MasjidDirectoryContent />);

        await waitFor(() =>
            expect(getByText("Masjid Jami' Al-Barkah (Rodja)")).toBeTruthy(),
        );
        fireEvent.press(getByText("Masjid Jami' Al-Barkah (Rodja)"));

        await waitFor(() => {
            expect(
                getByText("Masjid pusat Radio Rodja 756 AM, kajian sunnah salaf."),
            ).toBeTruthy();
            expect(getByText("Jl. Raya Condet No.27, Batu Ampar")).toBeTruthy();
            expect(getByText("021-87781371")).toBeTruthy();
            expect(getByText("Kajian sunnah")).toBeTruthy();
        });

        fireEvent.press(getByText("Buka Maps"));
        expect(Linking.openURL).toHaveBeenCalledWith(
            "https://www.google.com/maps/search/?api=1&query=-6.2704,106.8678",
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
        await waitFor(() =>
            expect(getByText("Masjid Jami' Al-Barkah (Rodja)")).toBeTruthy(),
        );

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
        await waitFor(() =>
            expect(getByText("Masjid Jami' Al-Barkah (Rodja)")).toBeTruthy(),
        );

        fireEvent.press(getByText("Masjid Terdekat"));

        await waitFor(() => {
            expect(
                getByText("Izin lokasi ditolak. Menampilkan daftar biasa."),
            ).toBeTruthy();
            expect(client.getNearbyMasjids).not.toHaveBeenCalled();
        });
    });
});
