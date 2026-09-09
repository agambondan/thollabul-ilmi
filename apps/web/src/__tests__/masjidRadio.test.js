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

    test("only contains masjid sunnah entries with valid coordinates", () => {
        expect(JAKARTA_MASJIDS.length).toBeGreaterThanOrEqual(6);
        for (const m of JAKARTA_MASJIDS) {
            expect(m.name).toBeDefined();
            expect(typeof m.lat).toBe("number");
            expect(typeof m.lng).toBe("number");
            expect(m.lat).toBeGreaterThan(-10);
            expect(m.lat).toBeLessThan(5);
            expect(m.lng).toBeGreaterThan(95);
            expect(m.lng).toBeLessThan(141);
        }
        const barkah = JAKARTA_MASJIDS.find((m) =>
            m.name.includes("Al-Barkah"),
        );
        expect(barkah).toBeDefined();
        expect(barkah.city).toBe("Jakarta Timur");
    });

    test("includes the 3 core sunnah masjids requested", () => {
        const names = JAKARTA_MASJIDS.map((m) => m.name.toLowerCase());
        expect(names.some((n) => n.includes("al-barkah") || n.includes("rodja"))).toBe(true);
        expect(names.some((n) => n.includes("nur-salma"))).toBe(true);
        expect(names.some((n) => n.includes("nurim"))).toBe(true);
    });

    test("has islamic radio entries with frequency information", () => {
        expect(ISLAMIC_RADIOS.length).toBeGreaterThan(5);
        const rodja = ISLAMIC_RADIOS.find((r) => r.name.includes("Rodja"));
        expect(rodja).toBeDefined();
        expect(rodja.frequency).toBe("756 AM");
        expect(rodja.streamUrl).toBeDefined();
    });

    test("calculateDistanceKm calculates distance correctly", () => {
        const dist = calculateDistanceKm(-6.244, 106.7995, -6.2440, 106.7995);
        expect(dist).toBe(0);
    });

    test("calculateDistanceKm handles null/empty coordinates gracefully", () => {
        expect(calculateDistanceKm(null, null, -6.1, 106.8)).toBeNull();
    });

    test("getNearbyMasjids sorts masjids by proximity", () => {
        const userLat = -6.244;
        const userLng = 106.7995;
        const results = getNearbyMasjids(userLat, userLng);
        expect(results.length).toBe(JAKARTA_MASJIDS.length);
        expect(results[0].distance_km).toBeLessThanOrEqual(
            results[results.length - 1].distance_km,
        );
        expect(results[0].name).toContain("Nurim");
    });

    test("getNearbyMasjids returns empty when coords missing", () => {
        expect(getNearbyMasjids(null, null)).toEqual([]);
    });

    test("calculateDistanceKm treats a legitimate 0 coordinate (equator/prime meridian) as valid", () => {
        expect(calculateDistanceKm(0, 0, -6.1, 106.8)).not.toBeNull();
    });
});
