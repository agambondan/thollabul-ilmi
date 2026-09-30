jest.mock("../api/client", () => ({
    getMasjids: jest.fn(),
    getNearbyMasjids: jest.fn(),
}));

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

import React from "react";
import {
    act,
    fireEvent,
    render,
    waitFor,
} from "@testing-library/react-native";
import { Linking } from "react-native";
import { MasjidDirectoryContent } from "../screens/MasjidDirectoryContent";
import { filterMasjids, withTimeout } from "../screens/MasjidDirectoryContent.helpers";
import { flushAsyncWork } from "../test-utils/async";

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

const nearbyItems = [
    {
        id: 3,
        name: "Masjid Sunda Kelapa",
        district: "Menteng",
        city: "Jakarta Pusat",
        address: "Jl. Taman Sunda Kelapa No.16, Menteng",
        latitude: -6.2013,
        longitude: 106.8323,
        distance_km: 1.7,
    },
    {
        id: 2,
        name: "Masjid Cut Meutia",
        district: "Menteng",
        city: "Jakarta Pusat",
        address: "Jl. Cut Mutiah No.1, Kebon Sirih",
        latitude: -6.1874,
        longitude: 106.8331,
        distance_km: 2.8,
    },
    {
        id: 5,
        name: "Masjid Agung Al-Azhar",
        district: "Kebayoran Baru",
        city: "Jakarta Selatan",
        address: "Jl. Sisingamangaraja, Selong",
        latitude: -6.2342,
        longitude: 106.7992,
        distance_km: 5.9,
    },
];

const SEARCH_PLACEHOLDER = "Cari nama, kota, atau kecamatan...";

const deferred = () => {
    let resolve;
    const promise = new Promise((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

const grantLocation = () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: "granted",
    });
    Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: -6.2, longitude: 106.8 },
    });
};

const typeSearch = (utils, text) =>
    fireEvent.changeText(utils.getByPlaceholderText(SEARCH_PLACEHOLDER), text);

const advance = async (ms) => {
    act(() => {
        jest.advanceTimersByTime(ms);
    });
    await flushAsyncWork();
};

const pressNearby = async (utils) => {
    fireEvent.press(utils.getByText("Masjid Terdekat"));
    await flushAsyncWork();
};

beforeEach(() => {
    jest.clearAllMocks();
    client.getMasjids.mockReset();
    client.getNearbyMasjids.mockReset();
    Location.requestForegroundPermissionsAsync.mockReset();
    Location.getCurrentPositionAsync.mockReset();
    client.getMasjids.mockResolvedValue(masjidItems);
    client.getNearbyMasjids.mockResolvedValue([]);
    jest.spyOn(Linking, "openURL").mockResolvedValue();
});

afterEach(() => {
    jest.useRealTimers();
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

describe("MasjidDirectoryContent search requests", () => {
    test("waits for a pause in typing before searching the API", async () => {
        jest.useFakeTimers();
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        expect(client.getMasjids).toHaveBeenCalledTimes(1);

        typeSearch(utils, "i");
        typeSearch(utils, "is");
        typeSearch(utils, "istiqlal");
        await advance(299);
        expect(client.getMasjids).toHaveBeenCalledTimes(1);

        await advance(1);
        expect(client.getMasjids).toHaveBeenCalledTimes(2);
        expect(client.getMasjids).toHaveBeenLastCalledWith({
            page: "1",
            size: "50",
            q: "istiqlal",
        });
    });

    test("restarts the pause on every keystroke", async () => {
        jest.useFakeTimers();
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();

        typeSearch(utils, "n");
        await advance(200);
        typeSearch(utils, "nu");
        await advance(200);
        expect(client.getMasjids).toHaveBeenCalledTimes(1);

        await advance(100);
        expect(client.getMasjids).toHaveBeenCalledTimes(2);
        expect(client.getMasjids).toHaveBeenLastCalledWith({
            page: "1",
            size: "50",
            q: "nu",
        });
    });

    test("sends trimmed text and skips requests when nothing changed", async () => {
        jest.useFakeTimers();
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();

        typeSearch(utils, "  nur  ");
        await advance(300);
        expect(client.getMasjids).toHaveBeenCalledTimes(2);
        expect(client.getMasjids).toHaveBeenLastCalledWith({
            page: "1",
            size: "50",
            q: "nur",
        });

        typeSearch(utils, "nur ");
        await advance(300);
        expect(client.getMasjids).toHaveBeenCalledTimes(2);

        typeSearch(utils, "   ");
        await advance(300);
        expect(client.getMasjids).toHaveBeenCalledTimes(3);
        expect(client.getMasjids).toHaveBeenLastCalledWith({
            page: "1",
            size: "50",
        });
    });

    test("ignores a slow response that arrives after a newer search", async () => {
        jest.useFakeTimers();
        const slow = deferred();
        client.getMasjids.mockResolvedValueOnce(masjidItems);
        client.getMasjids.mockReturnValueOnce(slow.promise);
        client.getMasjids.mockResolvedValueOnce([masjidItems[0]]);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();

        typeSearch(utils, "nur");
        await advance(300);
        typeSearch(utils, "rodja");
        await advance(300);
        expect(utils.getByText("Masjid Jami' Al-Barkah (Rodja)")).toBeTruthy();
        expect(utils.queryByText("Masjid Nur-Salma")).toBeNull();

        await act(async () => {
            slow.resolve([masjidItems[1]]);
        });
        await flushAsyncWork();

        expect(utils.getByText("Masjid Jami' Al-Barkah (Rodja)")).toBeTruthy();
        expect(utils.queryByText("Masjid Nur-Salma")).toBeNull();
    });

    test("clears the spinner when a search fails and recovers on retry", async () => {
        jest.useFakeTimers();
        client.getMasjids.mockResolvedValueOnce(masjidItems);
        client.getMasjids.mockRejectedValueOnce(new Error("boom"));
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();

        typeSearch(utils, "nur");
        await advance(300);
        expect(utils.getByText("Data belum bisa dimuat")).toBeTruthy();
        expect(utils.queryByText("Masjid Nur-Salma")).toBeNull();

        fireEvent.press(utils.getByText("Coba Lagi"));
        await flushAsyncWork();

        expect(client.getMasjids).toHaveBeenCalledTimes(3);
        expect(client.getMasjids).toHaveBeenLastCalledWith({
            page: "1",
            size: "50",
            q: "nur",
        });
        expect(utils.queryByText("Data belum bisa dimuat")).toBeNull();
        expect(utils.getByText("Masjid Nur-Salma")).toBeTruthy();
    });

    test("does not touch state after the screen is closed", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const pending = deferred();
        client.getMasjids.mockReturnValueOnce(pending.promise);
        const utils = render(<MasjidDirectoryContent />);

        utils.unmount();
        await act(async () => {
            pending.resolve(masjidItems);
        });
        await flushAsyncWork();

        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});

describe("MasjidDirectoryContent nearby mode", () => {
    test("filters the nearby results by the search text without new requests", async () => {
        jest.useFakeTimers();
        grantLocation();
        client.getNearbyMasjids.mockResolvedValue(nearbyItems);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        await pressNearby(utils);

        expect(utils.getByText("Masjid Sunda Kelapa")).toBeTruthy();
        expect(utils.getByText("Masjid Cut Meutia")).toBeTruthy();
        expect(utils.getByText("Masjid Agung Al-Azhar")).toBeTruthy();

        typeSearch(utils, "azhar");
        expect(utils.getByText("Masjid Agung Al-Azhar")).toBeTruthy();
        expect(utils.queryByText("Masjid Sunda Kelapa")).toBeNull();
        expect(utils.queryByText("Masjid Cut Meutia")).toBeNull();

        await advance(1000);
        expect(client.getMasjids).toHaveBeenCalledTimes(1);
        expect(client.getNearbyMasjids).toHaveBeenCalledTimes(1);
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });

    test("matches nearby results on district, city, and address", async () => {
        grantLocation();
        client.getNearbyMasjids.mockResolvedValue(nearbyItems);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        await pressNearby(utils);

        typeSearch(utils, "menteng");
        expect(utils.getByText("Masjid Sunda Kelapa")).toBeTruthy();
        expect(utils.getByText("Masjid Cut Meutia")).toBeTruthy();
        expect(utils.queryByText("Masjid Agung Al-Azhar")).toBeNull();

        typeSearch(utils, "jakarta selatan");
        expect(utils.getByText("Masjid Agung Al-Azhar")).toBeTruthy();
        expect(utils.queryByText("Masjid Sunda Kelapa")).toBeNull();

        typeSearch(utils, "kebon sirih");
        expect(utils.getByText("Masjid Cut Meutia")).toBeTruthy();
        expect(utils.queryByText("Masjid Agung Al-Azhar")).toBeNull();
    });

    test("shows the empty state when nothing nearby matches and recovers", async () => {
        grantLocation();
        client.getNearbyMasjids.mockResolvedValue(nearbyItems);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        await pressNearby(utils);

        typeSearch(utils, "zzzzqq");
        expect(utils.getByText("Masjid tidak ditemukan")).toBeTruthy();

        typeSearch(utils, "");
        expect(utils.queryByText("Masjid tidak ditemukan")).toBeNull();
        expect(utils.getByText("Masjid Sunda Kelapa")).toBeTruthy();
    });

    test("applies text typed before nearby mode was switched on", async () => {
        jest.useFakeTimers();
        grantLocation();
        client.getNearbyMasjids.mockResolvedValue(nearbyItems);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();

        typeSearch(utils, "cut");
        await pressNearby(utils);

        expect(utils.getByText("Masjid Cut Meutia")).toBeTruthy();
        expect(utils.queryByText("Masjid Sunda Kelapa")).toBeNull();
    });

    test("reuses the location when nearby mode is switched on again", async () => {
        grantLocation();
        client.getNearbyMasjids.mockResolvedValue(nearbyItems);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();

        await pressNearby(utils);
        await pressNearby(utils);
        expect(utils.getByText("Masjid Nur-Salma")).toBeTruthy();
        await pressNearby(utils);

        expect(utils.getByText("Masjid Sunda Kelapa")).toBeTruthy();
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
        expect(client.getNearbyMasjids).toHaveBeenCalledTimes(2);
    });

    test("does not start a second location lookup while one is pending", async () => {
        const position = deferred();
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockReturnValue(position.promise);
        client.getNearbyMasjids.mockResolvedValue(nearbyItems);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        await pressNearby(utils);

        expect(utils.getByText("Mencari lokasi...")).toBeTruthy();
        typeSearch(utils, "az");
        typeSearch(utils, "azh");
        fireEvent.press(utils.getByText("Mencari lokasi..."));
        await flushAsyncWork();
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);

        await act(async () => {
            position.resolve({ coords: { latitude: -6.2, longitude: 106.8 } });
        });
        await flushAsyncWork();

        expect(client.getNearbyMasjids).toHaveBeenCalledTimes(1);
        expect(utils.getByText("Masjid Agung Al-Azhar")).toBeTruthy();
        expect(utils.queryByText("Masjid Sunda Kelapa")).toBeNull();
        expect(utils.getByText("Masjid Terdekat")).toBeTruthy();
    });

    test("gives up on a location lookup that never answers", async () => {
        jest.useFakeTimers();
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}));
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        await pressNearby(utils);
        expect(utils.getByText("Mencari lokasi...")).toBeTruthy();

        await advance(14999);
        expect(utils.getByText("Mencari lokasi...")).toBeTruthy();

        await advance(1);
        expect(
            utils.getByText("Lokasi belum bisa diakses. Menampilkan daftar biasa."),
        ).toBeTruthy();
        expect(utils.getByText("Masjid Nur-Salma")).toBeTruthy();
        expect(utils.getByText("Masjid Terdekat")).toBeTruthy();
        expect(client.getNearbyMasjids).not.toHaveBeenCalled();
    });

    test("falls back to the plain list when the position lookup fails", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        Location.getCurrentPositionAsync.mockRejectedValue(new Error("no fix"));
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        await pressNearby(utils);

        expect(
            utils.getByText("Lokasi belum bisa diakses. Menampilkan daftar biasa."),
        ).toBeTruthy();
        expect(utils.getByText("Masjid Nur-Salma")).toBeTruthy();
        expect(client.getNearbyMasjids).not.toHaveBeenCalled();
        expect(client.getMasjids).toHaveBeenCalledTimes(2);
    });

    test("stays in nearby mode and offers a retry when the nearby request fails", async () => {
        grantLocation();
        client.getNearbyMasjids.mockRejectedValueOnce(new Error("boom"));
        client.getNearbyMasjids.mockResolvedValueOnce(nearbyItems);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();
        await pressNearby(utils);

        expect(utils.getByText("Data belum bisa dimuat")).toBeTruthy();
        expect(
            utils.queryByText("Lokasi belum bisa diakses. Menampilkan daftar biasa."),
        ).toBeNull();

        fireEvent.press(utils.getByText("Coba Lagi"));
        await flushAsyncWork();

        expect(utils.getByText("Masjid Sunda Kelapa")).toBeTruthy();
        expect(client.getNearbyMasjids).toHaveBeenCalledTimes(2);
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });

    test("ignores a nearby response that arrives after switching nearby mode off", async () => {
        grantLocation();
        const slowNearby = deferred();
        client.getNearbyMasjids.mockReturnValueOnce(slowNearby.promise);
        const utils = render(<MasjidDirectoryContent />);
        await flushAsyncWork();

        await pressNearby(utils);
        await pressNearby(utils);
        expect(utils.getByText("Masjid Nur-Salma")).toBeTruthy();

        await act(async () => {
            slowNearby.resolve(nearbyItems);
        });
        await flushAsyncWork();

        expect(utils.getByText("Masjid Nur-Salma")).toBeTruthy();
        expect(utils.queryByText("Masjid Sunda Kelapa")).toBeNull();
    });
});

describe("filterMasjids", () => {
    test("returns every item for an empty or separator-only query", () => {
        expect(filterMasjids(nearbyItems, "")).toBe(nearbyItems);
        expect(filterMasjids(nearbyItems, "   ")).toBe(nearbyItems);
        expect(filterMasjids(nearbyItems, " - ' ")).toBe(nearbyItems);
        expect(filterMasjids(nearbyItems, undefined)).toBe(nearbyItems);
    });

    test("ignores case, punctuation, and extra spaces", () => {
        const items = [
            { name: "Masjid Jami' Al-Barkah (Rodja)", city: "Jakarta Timur" },
            { name: "Masjid Nur-Salma", city: "Jakarta Selatan" },
        ];
        expect(filterMasjids(items, "AL BARKAH")).toEqual([items[0]]);
        expect(filterMasjids(items, "al-barkah")).toEqual([items[0]]);
        expect(filterMasjids(items, "jami")).toEqual([items[0]]);
        expect(filterMasjids(items, "  nur   salma ")).toEqual([items[1]]);
    });

    test("requires every word to match somewhere in the masjid", () => {
        expect(filterMasjids(nearbyItems, "cut menteng")).toEqual([
            nearbyItems[1],
        ]);
        expect(filterMasjids(nearbyItems, "cut selatan")).toEqual([]);
    });

    test("tolerates items with missing fields", () => {
        expect(filterMasjids([{ name: "Masjid A" }, {}, null], "masjid")).toEqual(
            [{ name: "Masjid A" }],
        );
    });
});

describe("withTimeout", () => {
    test("resolves with the value when the promise settles in time", async () => {
        await expect(withTimeout(Promise.resolve(7), 1000)).resolves.toBe(7);
    });

    test("propagates a rejection from the promise", async () => {
        await expect(
            withTimeout(Promise.reject(new Error("nope")), 1000),
        ).rejects.toThrow("nope");
    });

    test("rejects when the promise takes too long", async () => {
        jest.useFakeTimers();
        const outcome = withTimeout(new Promise(() => {}), 500).then(
            () => "resolved",
            (error) => error.message,
        );
        jest.advanceTimersByTime(500);
        await expect(outcome).resolves.toBe("timeout");
    });
});
