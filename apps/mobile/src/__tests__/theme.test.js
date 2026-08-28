import { colors, spacing, radius, shadows } from "../theme";

describe("colors", () => {
    test("has primary, onPrimary, surface, ink, muted", () => {
        expect(colors.primary).toBe("#5b6e5b");
        expect(colors.onPrimary).toBe("#fffaf0");
        expect(colors.surface).toBe("#f5f2eb");
        expect(colors.ink).toBe("#3c3a35");
        expect(colors.muted).toBe("#8c8577");
        expect(colors.bg).toBe("#fefdf9");
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
