import { Platform } from "react-native";
import { defaultMobileLanguage, translateMobile } from "../i18n/translations";

export const PRAYER_REMINDER_CHANNEL_ID = "prayer-reminders";
export const PRAYER_REMINDER_TYPE = "prayer_reminder";
export const PRAYER_REMINDER_ID_PREFIX = "prayer-reminder:";

let Notifications;
let handlerReady = false;
let queue = Promise.resolve();

const defaultTranslate = (key, values) =>
    translateMobile(defaultMobileLanguage, key, values);

const runExclusive = (task) => {
    const result = queue.then(task);
    queue = result.then(
        () => undefined,
        () => undefined,
    );
    return result;
};

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

const isPrayerReminder = (request) =>
    request?.content?.data?.type === PRAYER_REMINDER_TYPE ||
    `${request?.identifier ?? ""}`.startsWith(PRAYER_REMINDER_ID_PREFIX);

const readScheduledReminders = async (nativeNotifications) => {
    try {
        const requests =
            await nativeNotifications.getAllScheduledNotificationsAsync();
        return Array.isArray(requests) ? requests.filter(isPrayerReminder) : [];
    } catch {
        return [];
    }
};

const toIdentifiers = (scheduled = []) =>
    scheduled
        .map((item) => (typeof item === "string" ? item : item?.id))
        .filter(Boolean);

const cancelIdentifiers = async (nativeNotifications, identifiers) => {
    await Promise.all(
        [...new Set(identifiers)].map((id) =>
            nativeNotifications
                .cancelScheduledNotificationAsync(id)
                .catch(() => null),
        ),
    );
};

export const cancelPrayerReminders = (scheduled = []) =>
    runExclusive(async () => {
        const nativeNotifications = getNotifications();
        if (!nativeNotifications) return;

        const existing = await readScheduledReminders(nativeNotifications);
        await cancelIdentifiers(nativeNotifications, [
            ...toIdentifiers(scheduled),
            ...existing.map((request) => request.identifier),
        ]);
    });

export const listPrayerReminders = () =>
    runExclusive(async () => {
        const nativeNotifications = getNotifications();
        if (!nativeNotifications) return [];

        const existing = await readScheduledReminders(nativeNotifications);
        return existing.map((request) => ({
            id: request.identifier,
            prayer: request.content?.data?.prayer ?? null,
        }));
    });

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

const localDateKey = (date) => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

const reminderIdentifier = (prayer, date) =>
    `${PRAYER_REMINDER_ID_PREFIX}${prayer}:${localDateKey(date)}`;

export const syncPrayerReminders = ({
    enabled = true,
    leadMinutes = 0,
    labels = {},
    previous = [],
    selectedPrayers = [],
    t = defaultTranslate,
    times = {},
} = {}) =>
    runExclusive(async () => {
        const nativeNotifications = getNotifications();
        if (!nativeNotifications) {
            return { scheduled: [], status: "unsupported" };
        }

        const existing = await readScheduledReminders(nativeNotifications);
        const outdated = [
            ...toIdentifiers(previous),
            ...existing.map((request) => request.identifier),
        ];

        if (!enabled) {
            await cancelIdentifiers(nativeNotifications, outdated);
            return { scheduled: [], status: "disabled" };
        }

        const permission = await ensurePrayerNotificationPermission();
        if (!permission.granted) {
            await cancelIdentifiers(nativeNotifications, outdated);
            return { scheduled: [], status: permission.reason ?? "denied" };
        }

        const scheduled = [];
        for (const key of selectedPrayers) {
            const time = times[key];
            const date = nextTriggerDate(time, leadMinutes);
            if (!date) continue;

            const label = labels[key] ?? key;
            const id = await nativeNotifications.scheduleNotificationAsync({
                identifier: reminderIdentifier(key, date),
                content: {
                    title: t("prayer.notification.reminder.title", {
                        prayer: label,
                    }),
                    body:
                        leadMinutes > 0
                            ? t("prayer.notification.reminder.body", {
                                  prayer: label,
                                  time,
                              })
                            : t("prayer.notification.reminder.bodyNow", {
                                  prayer: label,
                              }),
                    data: {
                        prayer: key,
                        type: PRAYER_REMINDER_TYPE,
                        url: "thullaabulilmi://prayer",
                    },
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

        const kept = new Set(scheduled.map((item) => item.id));
        await cancelIdentifiers(
            nativeNotifications,
            outdated.filter((id) => !kept.has(id)),
        );

        return { scheduled, status: "scheduled" };
    });

export const schedulePrayerReminders = (options = {}) =>
    syncPrayerReminders({ ...options, enabled: true });

export const showPrayerTimeNotification = async ({
    label,
    prayer,
    t = defaultTranslate,
}) => {
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
            title: t("prayer.notification.time.title", { prayer: label }),
            body: t("prayer.notification.time.body", { prayer: label }),
            data: {
                prayer,
                type: "prayer_time",
                url: "thullaabulilmi://prayer",
            },
            sound: true,
        },
        trigger: null,
    });

    return { id, status: "shown" };
};
