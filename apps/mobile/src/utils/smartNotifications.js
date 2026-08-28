import { Platform } from "react-native";

export const SMART_REMINDER_CHANNEL_ID = "smart-reminders";

let Notifications;
let handlerReady = false;

const toMinutes = (value) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(`${value ?? ""}`);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
};

const fromMinutes = (total) => {
    const value = ((total % 1440) + 1440) % 1440;
    const hour = Math.floor(value / 60);
    const minute = value % 60;
    return `${hour}`.padStart(2, "0") + ":" + `${minute}`.padStart(2, "0");
};

const isQuietHourTime = (time, quietHours) => {
    if (!quietHours?.is_active) return false;
    const timeMinutes = toMinutes(time);
    const start = toMinutes(quietHours.start);
    const end = toMinutes(quietHours.end);
    if (timeMinutes === null || start === null || end === null) return false;
    if (start === end) return true;
    if (start < end) return timeMinutes >= start && timeMinutes < end;
    return timeMinutes >= start || timeMinutes < end;
};

export const resolveSmartReminderTime = (time, quietHours) => {
    if (!isQuietHourTime(time, quietHours)) return time;
    const fallback = toMinutes(quietHours?.end);
    if (fallback === null) return time;
    return fromMinutes(fallback);
};

export const getSmartReminderSchedule = ({
    quietHours = { end: "05:00", is_active: false, start: "22:00" },
    reminders = [],
}) =>
    reminders
        .filter((item) => item?.is_active && item?.time)
        .map((item) => {
            const scheduledTime = resolveSmartReminderTime(
                item.time,
                quietHours,
            );
            return {
                ...item,
                scheduledTime,
                shiftedByQuietHours: scheduledTime !== item.time,
            };
        });

const getNotifications = () => {
    if (Platform.OS === "web") return null;
    if (!Notifications) {
        Notifications = require("expo-notifications");
    }
    if (!handlerReady) {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        handlerReady = true;
    }
    return Notifications;
};

export const smartNotificationsSupported = () => Platform.OS !== "web";

const ensureSmartNotificationPermission = async () => {
    const nativeNotifications = getNotifications();
    if (!nativeNotifications) return { granted: false, reason: "unsupported" };

    const existing = await nativeNotifications.getPermissionsAsync();
    let granted =
        existing.granted ||
        existing.ios?.status ===
            nativeNotifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
        const requested = await nativeNotifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        granted =
            requested.granted ||
            requested.ios?.status ===
                nativeNotifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (Platform.OS === "android" && granted) {
        await nativeNotifications.setNotificationChannelAsync(
            SMART_REMINDER_CHANNEL_ID,
            {
                importance: nativeNotifications.AndroidImportance.HIGH,
                lightColor: "#5b6e5b",
                name: "Smart Reminders",
                sound: "default",
                vibrationPattern: [0, 220, 220, 220],
            },
        );
    }

    return { granted, reason: granted ? "granted" : "denied" };
};

export const cancelSmartReminders = async (scheduled = []) => {
    const nativeNotifications = getNotifications();
    if (!nativeNotifications) return;

    await Promise.all(
        (Array.isArray(scheduled) ? scheduled : [])
            .map((item) => (typeof item === "string" ? item : item?.id))
            .filter(Boolean)
            .map((id) =>
                nativeNotifications
                    .cancelScheduledNotificationAsync(id)
                    .catch(() => null),
            ),
    );
};

export const scheduleSmartReminders = async ({
    quietHours = { end: "05:00", is_active: false, start: "22:00" },
    reminders = [],
    previous = [],
}) => {
    const nativeNotifications = getNotifications();
    if (!nativeNotifications) return { scheduled: [], status: "unsupported" };

    const permission = await ensureSmartNotificationPermission();
    if (!permission.granted)
        return { scheduled: [], status: permission.reason };

    await cancelSmartReminders(previous);

    const active = reminders.filter((item) => item?.is_active && item?.time);
    const scheduled = [];

    for (const item of active) {
        const fireTime = resolveSmartReminderTime(item.time, quietHours);
        const minutes = toMinutes(fireTime);
        if (minutes === null) continue;
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        const id = await nativeNotifications.scheduleNotificationAsync({
            content: {
                body: item.body ?? `Saatnya ${item.label.toLowerCase()}.`,
                data: { reminder_type: item.type, type: "smart_reminder" },
                sound: "default",
                title: item.label,
            },
            trigger: {
                channelId: SMART_REMINDER_CHANNEL_ID,
                hour,
                minute,
                repeats: true,
            },
        });

        scheduled.push({
            id,
            time: fireTime,
            type: item.type,
        });
    }

    return { scheduled, status: "scheduled" };
};
