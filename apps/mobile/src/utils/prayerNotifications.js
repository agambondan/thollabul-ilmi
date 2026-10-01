import { Platform } from "react-native";
import { defaultMobileLanguage, translateMobile } from "../i18n/translations";

export const PRAYER_REMINDER_CHANNEL_ID = "prayer-reminders";
export const PRAYER_REMINDER_TYPE = "prayer_reminder";
export const PRAYER_REMINDER_ID_PREFIX = "prayer-reminder:";
export const REMINDER_HORIZON_DAYS = 7;
export const MAX_PENDING_PRAYER_REMINDERS = 60;

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

const loadNotifications = () => {
    if (!notificationsSupported()) return null;

    if (!Notifications) {
        Notifications = require("expo-notifications");
    }

    return Notifications;
};

const getNotifications = () => {
    if (!loadNotifications()) return null;

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

const resolvePermission = async ({ prompt }) => {
    const nativeNotifications = getNotifications();
    if (!nativeNotifications) {
        return { granted: false, reason: "unsupported" };
    }

    const existing = await nativeNotifications.getPermissionsAsync();
    let granted =
        existing.granted ||
        existing.ios?.status ===
            nativeNotifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted && prompt) {
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

export const ensurePrayerNotificationPermission = () =>
    resolvePermission({ prompt: true });

export const checkPrayerNotificationPermission = () =>
    resolvePermission({ prompt: false });

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

const addDays = (date, days) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const triggerDateFor = (day, time, leadMinutes) => {
    const minutes = toMinutes(time);
    if (minutes === null) return null;

    const target = new Date(day.getTime());
    target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    target.setMinutes(target.getMinutes() - leadMinutes);
    return target;
};

const localDateKey = (date) => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

const reminderIdentifier = (prayer, date) =>
    `${PRAYER_REMINDER_ID_PREFIX}${prayer}:${localDateKey(date)}`;

const resolveDayTimes = async (timesForDate, day, fallback) => {
    try {
        const resolved = await timesForDate(day);
        return resolved && typeof resolved === "object" ? resolved : fallback;
    } catch {
        return fallback;
    }
};

const pickTime = (resolved, fallback, prayer) =>
    toMinutes(resolved?.[prayer]) === null
        ? fallback[prayer]
        : resolved[prayer];

const planReminders = async ({
    leadMinutes,
    selectedPrayers,
    times,
    timesForDate,
}) => {
    const prayers = [...new Set(selectedPrayers)];
    if (!prayers.length) return [];

    const nowMs = Date.now();
    const today = addDays(new Date(nowMs), 0);
    const baseTimes = times && typeof times === "object" ? times : {};
    const offsets = Array.from(
        { length: REMINDER_HORIZON_DAYS + 1 },
        (_, offset) => offset,
    );
    const timesByOffset = await Promise.all(
        offsets.map((offset) =>
            offset === 0 || typeof timesForDate !== "function"
                ? baseTimes
                : resolveDayTimes(
                      timesForDate,
                      addDays(today, offset),
                      baseTimes,
                  ),
        ),
    );

    const plan = [];
    for (const prayer of prayers) {
        let count = 0;
        for (const offset of offsets) {
            if (count >= REMINDER_HORIZON_DAYS) break;

            const time = pickTime(timesByOffset[offset], baseTimes, prayer);
            const date = triggerDateFor(
                addDays(today, offset),
                time,
                leadMinutes,
            );
            if (!date || date.getTime() <= nowMs) continue;

            plan.push({
                date,
                id: reminderIdentifier(prayer, date),
                prayer,
                time,
            });
            count += 1;
        }
    }

    return plan
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, MAX_PENDING_PRAYER_REMINDERS);
};

export const syncPrayerReminders = ({
    enabled = true,
    leadMinutes = 0,
    labels = {},
    previous = [],
    requestPermission = true,
    selectedPrayers = [],
    t = defaultTranslate,
    times = {},
    timesForDate,
} = {}) =>
    runExclusive(async () => {
        const nativeNotifications = enabled
            ? getNotifications()
            : loadNotifications();
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

        const permission = await resolvePermission({
            prompt: requestPermission,
        });
        if (!permission.granted) {
            await cancelIdentifiers(nativeNotifications, outdated);
            return { scheduled: [], status: permission.reason ?? "denied" };
        }

        const plan = await planReminders({
            leadMinutes,
            selectedPrayers,
            times,
            timesForDate,
        });
        const scheduled = [];
        for (const { date, id: identifier, prayer, time } of plan) {
            const label = labels[prayer] ?? prayer;
            const id = await nativeNotifications.scheduleNotificationAsync({
                identifier,
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
                        prayer,
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

            scheduled.push({ id, prayer, fireAt: date.toISOString() });
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
