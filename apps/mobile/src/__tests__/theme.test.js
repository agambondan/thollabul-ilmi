import { colors, spacing, radius, shadows, iconStroke, elevation, zIndex, touchTarget, touchTargetSmall } from "../theme";

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

describe("iconStroke", () => {
    test("has expected values", () => {
        expect(iconStroke.thin).toBe(1.9);
        expect(iconStroke.regular).toBe(2.2);
        expect(iconStroke.bold).toBe(2.5);
    });
});

describe("elevation", () => {
    test("has expected keys", () => {
        expect(elevation.none).toBe(0);
        expect(elevation.low).toBe(1);
        expect(elevation.medium).toBe(4);
        expect(elevation.high).toBe(8);
        expect(elevation.modal).toBe(16);
    });
});

describe("zIndex", () => {
    test("has expected keys", () => {
        expect(zIndex.base).toBe(0);
        expect(zIndex.card).toBe(1);
        expect(zIndex.header).toBe(10);
        expect(zIndex.overlay).toBe(20);
        expect(zIndex.modal).toBe(30);
        expect(zIndex.toast).toBe(40);
    });
});

describe("touchTarget", () => {
    test("has expected values", () => {
        expect(touchTarget).toBe(44);
        expect(touchTargetSmall).toBe(40);
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
