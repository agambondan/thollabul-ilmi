import { Platform } from "react-native";
import {
    resolveSmartReminderTime,
    getSmartReminderSchedule,
    smartNotificationsSupported,
    SMART_REMINDER_CHANNEL_ID,
} from "../utils/smartNotifications";

describe("SMART_REMINDER_CHANNEL_ID", () => {
    test("is set to smart-reminders", () => {
        expect(SMART_REMINDER_CHANNEL_ID).toBe("smart-reminders");
    });
});

describe("smartNotificationsSupported", () => {
    test("returns true on native", () => {
        Platform.OS = "ios";
        expect(smartNotificationsSupported()).toBe(true);
        Platform.OS = "android";
        expect(smartNotificationsSupported()).toBe(true);
    });

    test("returns false on web", () => {
        Platform.OS = "web";
        expect(smartNotificationsSupported()).toBe(false);
        Platform.OS = "ios";
    });
});

describe("resolveSmartReminderTime", () => {
    test("returns same time when quiet hours are inactive", () => {
        const result = resolveSmartReminderTime("14:30", {
            is_active: false,
            start: "22:00",
            end: "05:00",
        });
        expect(result).toBe("14:30");
    });

    test("returns same time when outside quiet hours", () => {
        const result = resolveSmartReminderTime("14:30", {
            is_active: true,
            start: "22:00",
            end: "05:00",
        });
        expect(result).toBe("14:30");
    });

    test("shifts to end of quiet hours when inside", () => {
        const result = resolveSmartReminderTime("23:00", {
            is_active: true,
            start: "22:00",
            end: "05:00",
        });
        expect(result).toBe("05:00");
    });

    test("shifts time that falls in overnight quiet hours (early morning)", () => {
        const result = resolveSmartReminderTime("03:00", {
            is_active: true,
            start: "22:00",
            end: "05:00",
        });
        expect(result).toBe("05:00");
    });

    test("returns same time when quiet hours end is null", () => {
        const result = resolveSmartReminderTime("23:00", {
            is_active: true,
            start: "22:00",
            end: null,
        });
        expect(result).toBe("23:00");
    });

    test("handles equal start and end (full day quiet)", () => {
        const result = resolveSmartReminderTime("12:00", {
            is_active: true,
            start: "00:00",
            end: "00:00",
        });
        expect(result).toBe("00:00");
    });
});

describe("getSmartReminderSchedule", () => {
    const defaultQuietHours = {
        end: "05:00",
        is_active: false,
        start: "22:00",
    };

    test("filters out inactive reminders", () => {
        const result = getSmartReminderSchedule({
            quietHours: defaultQuietHours,
            reminders: [
                {
                    is_active: true,
                    time: "08:00",
                    type: "subuh",
                    label: "Subuh",
                },
                {
                    is_active: false,
                    time: "12:00",
                    type: "dzuhur",
                    label: "Dzuhur",
                },
                {
                    is_active: true,
                    time: "15:00",
                    type: "ashar",
                    label: "Ashar",
                },
            ],
        });
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.type)).toEqual(["subuh", "ashar"]);
    });

    test("filters out reminders without time", () => {
        const result = getSmartReminderSchedule({
            quietHours: defaultQuietHours,
            reminders: [{ is_active: true, time: null, type: "subuh" }],
        });
        expect(result).toHaveLength(0);
    });

    test("adds shiftedByQuietHours flag", () => {
        const result = getSmartReminderSchedule({
            quietHours: { is_active: true, start: "22:00", end: "05:00" },
            reminders: [
                { is_active: true, time: "08:00", type: "subuh" },
                { is_active: true, time: "23:00", type: "isya", label: "Isya" },
            ],
        });
        expect(result).toHaveLength(2);
        expect(result[0].shiftedByQuietHours).toBe(false);
        expect(result[1].shiftedByQuietHours).toBe(true);
        expect(result[1].scheduledTime).toBe("05:00");
    });

    test("returns empty array for no reminders", () => {
        const result = getSmartReminderSchedule({ reminders: [] });
        expect(result).toEqual([]);
    });
});
