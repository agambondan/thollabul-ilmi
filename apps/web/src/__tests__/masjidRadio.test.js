import {
    JAKARTA_DOMISILI,
    JAKARTA_MASJIDS,
    RADIO_DOMISILI,
    ISLAMIC_RADIOS,
    calculateDistanceKm,
    getNearbyMasjids,
} from "@/lib/masjidRadioData";

describe("Masjid and Radio Islamic Data & Helpers", () => {
    test("has valid jakarta domisili options", () => {
        expect(JAKARTA_DOMISILI).toContain("Semua Jakarta");
        expect(JAKARTA_DOMISILI).toContain("Jakarta Pusat");
        expect(JAKARTA_DOMISILI).toContain("Jakarta Selatan");
    });

    test("has valid radio domisili options", () => {
        expect(RADIO_DOMISILI).toContain("Semua Domisili");
        expect(RADIO_DOMISILI).toContain("Jakarta");
        expect(RADIO_DOMISILI).toContain("Bandung");
    });

    test("has masjid entries with valid coordinates and properties", () => {
        expect(JAKARTA_MASJIDS.length).toBeGreaterThan(10);
        const istiqlal = JAKARTA_MASJIDS.find((m) =>
            m.name.includes("Istiqlal"),
        );
        expect(istiqlal).toBeDefined();
        expect(istiqlal.city).toBe("Jakarta Pusat");
        expect(istiqlal.lat).toBeCloseTo(-6.1704, 2);
        expect(istiqlal.lng).toBeCloseTo(106.8306, 2);
    });

    test("has islamic radio entries with frequency information", () => {
        expect(ISLAMIC_RADIOS.length).toBeGreaterThan(5);
        const rodja = ISLAMIC_RADIOS.find((r) => r.name.includes("Rodja"));
        expect(rodja).toBeDefined();
        expect(rodja.frequency).toBe("756 AM");
        expect(rodja.streamUrl).toBeDefined();
    });

    test("calculateDistanceKm calculates distance correctly", () => {
        // Monas to Istiqlal is around 1 km
        const dist = calculateDistanceKm(-6.1754, 106.8272, -6.1704, 106.8306);
        expect(dist).toBeGreaterThan(0.4);
        expect(dist).toBeLessThan(1.5);
    });

    test("calculateDistanceKm handles null/empty coordinates gracefully", () => {
        expect(calculateDistanceKm(null, null, -6.1, 106.8)).toBeNull();
    });

    test("getNearbyMasjids sorts masjids by proximity", () => {
        // Position near Kebayoran Baru / Al-Azhar
        const userLat = -6.235;
        const userLng = 106.799;
        const results = getNearbyMasjids(userLat, userLng);
        expect(results.length).toBe(JAKARTA_MASJIDS.length);
        expect(results[0].distance_km).toBeLessThan(
            results[results.length - 1].distance_km,
        );
        expect(results[0].name).toContain("Al-Azhar");
    });

    test("getNearbyMasjids returns empty when coords missing", () => {
        expect(getNearbyMasjids(null, null)).toEqual([]);
    });

    test("calculateDistanceKm treats a legitimate 0 coordinate (equator/prime meridian) as valid", () => {
        expect(calculateDistanceKm(0, 0, -6.1, 106.8)).not.toBeNull();
    });
});
