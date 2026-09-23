import { colors, spacing, radius, shadows } from "../theme";

describe("colors", () => {
    test("has primary, onPrimary, surface, ink, muted", () => {
        expect(colors.primary).toBeDefined();
        expect(colors.onPrimary).toBeDefined();
        expect(colors.surface).toBeDefined();
        expect(colors.ink).toBeDefined();
        expect(colors.muted).toBeDefined();
        expect(colors.bg).toBeDefined();
    });
});

describe("spacing", () => {
    test("has expected values", () => {
        expect(spacing.xs).toBe(4);
        expect(spacing.sm).toBe(8);
        expect(spacing.md).toBe(12);
        expect(spacing.lg).toBe(16);
        expect(spacing.xl).toBe(24);
        expect(spacing.xxl).toBe(32);
    });
});

describe("radius", () => {
    test("has expected values", () => {
        expect(radius.sm).toBe(8);
        expect(radius.md).toBe(12);
        expect(radius.lg).toBe(16);
    });
});

describe("shadows", () => {
    test("paper shadow has expected keys", () => {
        expect(shadows.paper).toMatchObject({
            elevation: expect.any(Number),
            shadowColor: expect.any(String),
            shadowOffset: expect.objectContaining({
                height: expect.any(Number),
                width: expect.any(Number),
            }),
            shadowOpacity: expect.any(Number),
            shadowRadius: expect.any(Number),
        });
    });

    test("raised shadow has expected keys", () => {
        expect(shadows.raised).toMatchObject({
            elevation: expect.any(Number),
            shadowColor: expect.any(String),
            shadowOffset: expect.objectContaining({
                height: expect.any(Number),
                width: expect.any(Number),
            }),
            shadowOpacity: expect.any(Number),
            shadowRadius: expect.any(Number),
        });
    });
});
