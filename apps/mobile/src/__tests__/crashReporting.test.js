import {
    addBreadcrumb,
    captureException,
    captureMessage,
    clearBreadcrumbs,
    getBreadcrumbs,
    initCrashReporting,
    isCrashReportingActive,
} from "../utils/crashReporting";

describe("crashReporting", () => {
    beforeEach(() => {
        clearBreadcrumbs();
    });

    test("initializes with DSN or custom reporter", () => {
        expect(initCrashReporting({ dsn: "" })).toBe(false);
        expect(isCrashReportingActive()).toBe(false);

        expect(
            initCrashReporting({ dsn: "https://examplePublicKey@o0.ingest.sentry.io/0" }),
        ).toBe(true);
        expect(isCrashReportingActive()).toBe(true);
    });

    test("collects and limits breadcrumbs", () => {
        addBreadcrumb({ category: "navigation", message: "Tab switched to Quran" });
        expect(getBreadcrumbs()).toHaveLength(1);
        expect(getBreadcrumbs()[0].message).toBe("Tab switched to Quran");

        for (let i = 0; i < 60; i++) {
            addBreadcrumb({ message: `Step ${i}` });
        }
        expect(getBreadcrumbs().length).toBeLessThanOrEqual(50);
    });

    test("captures exception and forwards to reporter", () => {
        const customReporter = {
            captureException: jest.fn(),
            captureMessage: jest.fn(),
        };
        initCrashReporting({ reporter: customReporter });

        const err = new Error("Test crash");
        const event = captureException(err, { screen: "PrayerScreen" });

        expect(event.message).toBe("Test crash");
        expect(event.context.screen).toBe("PrayerScreen");
        expect(customReporter.captureException).toHaveBeenCalledWith(err, {
            screen: "PrayerScreen",
        });
    });

    test("captures message and forwards to reporter", () => {
        const customReporter = {
            captureException: jest.fn(),
            captureMessage: jest.fn(),
        };
        initCrashReporting({ reporter: customReporter });

        const msgEvent = captureMessage("Network flapping", "warning");
        expect(msgEvent.message).toBe("Network flapping");
        expect(msgEvent.level).toBe("warning");
        expect(customReporter.captureMessage).toHaveBeenCalledWith(
            "Network flapping",
            "warning",
        );
    });
});
