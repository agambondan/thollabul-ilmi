import { Platform } from "react-native";
import * as Location from "expo-location";
import {
    compassSupported,
    qiblaOffset,
    signedOffset,
    watchCompassHeading,
} from "../utils/compass";

const mockWatchHeadingAsync = jest.fn();

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    watchHeadingAsync: (...args) => mockWatchHeadingAsync(...args),
}));

describe("compassSupported", () => {
    test("returns true on native platforms", () => {
        Platform.OS = "ios";
        expect(compassSupported()).toBe(true);
        Platform.OS = "android";
        expect(compassSupported()).toBe(true);
    });

    test("returns false on web", () => {
        Platform.OS = "web";
        expect(compassSupported()).toBe(false);
        Platform.OS = "ios";
    });
});

describe("qiblaOffset", () => {
    test("returns positive offset when qibla > heading", () => {
        expect(qiblaOffset(295, 270)).toBe(25);
    });

    test("returns wrap-around offset when qibla < heading", () => {
        expect(qiblaOffset(295, 300)).toBe(355);
    });

    test("handles crossing 0", () => {
        expect(qiblaOffset(10, 350)).toBe(20);
    });

    test("handles exact match", () => {
        expect(qiblaOffset(180, 180)).toBe(0);
    });

    test("returns null for non-number qiblaDirection", () => {
        expect(qiblaOffset(null, 100)).toBeNull();
        expect(qiblaOffset(undefined, 100)).toBeNull();
        expect(qiblaOffset("295", 100)).toBeNull();
    });

    test("returns null for non-number heading", () => {
        expect(qiblaOffset(295, null)).toBeNull();
        expect(qiblaOffset(295, undefined)).toBeNull();
    });
});

describe("signedOffset", () => {
    test("returns positive offset as-is", () => {
        expect(signedOffset(25)).toBe(25);
    });

    test("converts 355 to -5", () => {
        expect(signedOffset(355)).toBe(-5);
    });

    test("handles 180 to -180", () => {
        expect(signedOffset(180)).toBe(-180);
    });

    test("handles 0", () => {
        expect(signedOffset(0)).toBe(0);
    });

    test("handles 359 to -1", () => {
        expect(signedOffset(359)).toBe(-1);
    });

    test("handles 181 to -179", () => {
        expect(signedOffset(181)).toBe(-179);
    });

    test("returns null for non-number", () => {
        expect(signedOffset(null)).toBeNull();
        expect(signedOffset(undefined)).toBeNull();
    });
});

describe("watchCompassHeading", () => {
    const subscription = { remove: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        Platform.OS = "ios";
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "granted",
        });
        mockWatchHeadingAsync.mockResolvedValue(subscription);
    });

    test("asks for location permission by default and starts watching", async () => {
        const result = await watchCompassHeading(jest.fn(), jest.fn());

        expect(result).toBe(subscription);
        expect(
            Location.requestForegroundPermissionsAsync,
        ).toHaveBeenCalledTimes(1);
        expect(mockWatchHeadingAsync).toHaveBeenCalledTimes(1);
    });

    test("reports a missing permission and does not watch", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: "denied",
        });
        const onUnavailable = jest.fn();

        const result = await watchCompassHeading(jest.fn(), onUnavailable);

        expect(result).toBeNull();
        expect(onUnavailable).toHaveBeenCalledWith(
            "Izin lokasi diperlukan untuk mengaktifkan kompas.",
        );
        expect(mockWatchHeadingAsync).not.toHaveBeenCalled();
    });

    test("does not ask again when the caller already holds the permission", async () => {
        const result = await watchCompassHeading(jest.fn(), jest.fn(), {
            skipPermissionRequest: true,
        });

        expect(result).toBe(subscription);
        expect(
            Location.requestForegroundPermissionsAsync,
        ).not.toHaveBeenCalled();
        expect(mockWatchHeadingAsync).toHaveBeenCalledTimes(1);
    });

    test("passes the watch options to the heading watcher", async () => {
        await watchCompassHeading(jest.fn(), jest.fn(), {
            distanceFilter: 3,
            enableHighAccuracy: true,
            interval: 250,
            skipPermissionRequest: true,
        });

        expect(mockWatchHeadingAsync).toHaveBeenCalledWith(
            { distanceFilter: 3, enableHighAccuracy: true, interval: 250 },
            expect.any(Function),
        );
    });

    test("reports that the compass is only available in the mobile app on web", async () => {
        Platform.OS = "web";
        const onUnavailable = jest.fn();

        const result = await watchCompassHeading(jest.fn(), onUnavailable);

        expect(result).toBeNull();
        expect(onUnavailable).toHaveBeenCalledWith(
            "Kompas tersedia di aplikasi mobile.",
        );
        expect(
            Location.requestForegroundPermissionsAsync,
        ).not.toHaveBeenCalled();
    });

    test("reports a device without a compass when watching fails", async () => {
        mockWatchHeadingAsync.mockRejectedValue(new Error("no sensor"));
        const onUnavailable = jest.fn();

        const result = await watchCompassHeading(jest.fn(), onUnavailable, {
            skipPermissionRequest: true,
        });

        expect(result).toBeNull();
        expect(onUnavailable).toHaveBeenCalledWith(
            "Kompas tidak tersedia di perangkat ini.",
        );
    });

    test("prefers the true heading and falls back to the magnetic heading", async () => {
        const onHeading = jest.fn();
        await watchCompassHeading(onHeading, jest.fn(), {
            skipPermissionRequest: true,
        });
        const listener = mockWatchHeadingAsync.mock.calls[0][1];

        listener({ magHeading: 10, trueHeading: 370 });
        listener({ magHeading: 95, trueHeading: -1 });
        listener({ magHeading: -1, trueHeading: -1 });

        expect(onHeading.mock.calls).toEqual([[10], [95]]);
    });
});
