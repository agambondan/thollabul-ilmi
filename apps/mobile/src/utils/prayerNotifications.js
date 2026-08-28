import { Platform } from "react-native";

export const PRAYER_REMINDER_CHANNEL_ID = "prayer-reminders";

let Notifications;
let handlerReady = false;

export const notificationsSupported = () => Platform.OS !== "web";

const getNotifications = () => {
    if (!notificationsSupported()) return null;

    if (!Notifications) {
        Notifications = require("expo-notifications");
    }

    if (!handlerReady) {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        handlerReady = true;
    }

    return Notifications;
};

export const ensurePrayerNotificationPermission = async () => {
    const nativeNotifications = getNotifications();
    if (!nativeNotifications) {
        return { granted: false, reason: "unsupported" };
    }

    const existing = await nativeNotifications.getPermissionsAsync();
    let granted =
        existing.granted ||
        existing.ios?.status ===
            nativeNotifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
        const requested = await nativeNotifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: false,
                allowSound: true,
            },
        });
        granted =
            requested.granted ||
            requested.ios?.status ===
                nativeNotifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (granted && Platform.OS === "android") {
        await nativeNotifications.setNotificationChannelAsync(
            PRAYER_REMINDER_CHANNEL_ID,
            {
                name: "Prayer Reminders",
                importance: nativeNotifications.AndroidImportance.HIGH,
                sound: "default",
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#047857",
            },
        );
    }

    return { granted };
};

export const cancelPrayerReminders = async (scheduled = []) => {
    const nativeNotifications = getNotifications();
    if (!nativeNotifications) return;

    await Promise.all(
        scheduled
            .map((item) => (typeof item === "string" ? item : item?.id))
            .filter(Boolean)
            .map((id) =>
                nativeNotifications
                    .cancelScheduledNotificationAsync(id)
                    .catch(() => null),
            ),
    );
};

const toMinutes = (time) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
};

const nextTriggerDate = (time, leadMinutes) => {
    const minutes = toMinutes(time);
    if (minutes === null) return null;

    const target = new Date();
    target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    target.setMinutes(target.getMinutes() - leadMinutes);

    if (target.getTime() <= Date.now()) {
        target.setDate(target.getDate() + 1);
    }

    return target;
};

export const schedulePrayerReminders = async ({
    leadMinutes,
    labels,
    previous = [],
    selectedPrayers,
    times,
}) => {
    const permission = await ensurePrayerNotificationPermission();
    if (!permission.granted) {
        return { scheduled: [], status: permission.reason ?? "denied" };
    }

    const nativeNotifications = getNotifications();
    if (!nativeNotifications) {
        return { scheduled: [], status: "unsupported" };
    }

    await cancelPrayerReminders(previous);

    const scheduled = [];
    for (const key of selectedPrayers) {
        const time = times[key];
        const date = nextTriggerDate(time, leadMinutes);
        if (!date) continue;

        const label = labels[key] ?? key;
        const id = await nativeNotifications.scheduleNotificationAsync({
            content: {
                title: `${label} Reminder`,
                body:
                    leadMinutes > 0
                        ? `${label} starts at ${time}.`
                        : `${label} time is now.`,
                data: { prayer: key, type: "prayer_reminder" },
                sound: true,
            },
            trigger: {
                type: nativeNotifications.SchedulableTriggerInputTypes.DATE,
                date,
                channelId: PRAYER_REMINDER_CHANNEL_ID,
            },
        });

        scheduled.push({ id, prayer: key, fireAt: date.toISOString() });
    }

    return { scheduled, status: "scheduled" };
};

export const showPrayerTimeNotification = async ({ label, prayer }) => {
    const permission = await ensurePrayerNotificationPermission();
    if (!permission.granted) {
        return { status: permission.reason ?? "denied" };
    }

    const nativeNotifications = getNotifications();
    if (!nativeNotifications) {
        return { status: "unsupported" };
    }

    const id = await nativeNotifications.scheduleNotificationAsync({
        content: {
            title: `Waktu Sholat: ${label}`,
            body: `Sudah masuk waktu ${label}.`,
            data: { prayer, type: "prayer_time" },
            sound: true,
        },
        trigger: null,
    });

    return { id, status: "shown" };
};
