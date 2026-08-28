import { Platform } from "react-native";
import { compassSupported, qiblaOffset, signedOffset } from "../utils/compass";

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
