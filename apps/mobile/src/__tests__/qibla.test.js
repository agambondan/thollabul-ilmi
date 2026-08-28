import {
    calculateQiblaDirection,
    calculateKaabaDistance,
    formatDegrees,
} from "../utils/qibla";

describe("calculateQiblaDirection", () => {
    test("returns 0 for Kaaba coordinates", () => {
        const result = calculateQiblaDirection(21.4225, 39.8262);
        expect(result).toBeCloseTo(0, 1);
    });

    test("returns a valid bearing for Mecca (Indonesia)", () => {
        const result = calculateQiblaDirection(-6.2, 106.8);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(360);
        // Jakarta bearing to Kaaba is ~295 degrees
        expect(result).toBeCloseTo(295, 0);
    });

    test("returns a valid bearing for Medina", () => {
        const result = calculateQiblaDirection(24.467, 39.611);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(360);
    });

    test("handles negative latitude (southern hemisphere)", () => {
        const result = calculateQiblaDirection(-33.86, 151.2);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(360);
    });
});

describe("calculateKaabaDistance", () => {
    test("returns 0 for Kaaba coordinates", () => {
        const result = calculateKaabaDistance(21.4225, 39.8262);
        expect(result).toBe(0);
    });

    test("returns ~8000km for Jakarta", () => {
        const result = calculateKaabaDistance(-6.2, 106.8);
        expect(result).toBeGreaterThan(7000);
        expect(result).toBeLessThan(9000);
    });

    test("returns positive integer", () => {
        const result = calculateKaabaDistance(0, 0);
        expect(result).toBeGreaterThan(0);
        expect(Number.isInteger(result)).toBe(true);
    });
});

describe("formatDegrees", () => {
    test("formats as degrees", () => {
        expect(formatDegrees(295.7)).toBe("296 deg");
    });

    test("handles zero", () => {
        expect(formatDegrees(0)).toBe("0 deg");
    });

    test("rounds to nearest integer", () => {
        expect(formatDegrees(45.2)).toBe("45 deg");
        expect(formatDegrees(45.8)).toBe("46 deg");
    });
});
