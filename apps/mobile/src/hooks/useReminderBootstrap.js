import { useEffect } from "react";
import { AppState } from "react-native";
import {
    defaultMobileLanguage,
    normalizeMobileLanguage,
    translateMobile,
} from "../i18n/translations";
import { getOfflinePrayerForDate } from "../storage/offlineContent";
import { preferenceKeys, readPreference } from "../storage/preferences";
import { readSession } from "../storage/session";
import {
    notificationsSupported,
    syncPrayerReminders,
} from "../utils/prayerNotifications";
import {
    buildAdjustedPrayerTimes,
    buildPrayerLabels,
    createPrayerTimesResolver,
    readPrayerReminderSettings,
    scheduleCacheMatchesLocation,
} from "../utils/prayerReminderSettings";

export const REMINDER_BOOTSTRAP_MIN_INTERVAL_MS = 60 * 1000;

const readReminderLanguage = async () => {
    const [session, stored] = await Promise.all([
        readSession(),
        readPreference(preferenceKeys.appLanguage, defaultMobileLanguage),
    ]);
    return normalizeMobileLanguage(session?.user?.preferred_lang ?? stored);
};

const pickBootstrapSchedule = ({ location, scheduleCache }) => {
    if (!scheduleCache) return null;
    if (location && !scheduleCacheMatchesLocation(scheduleCache, location)) {
        return null;
    }
    return scheduleCache;
};

export const runReminderBootstrap = async () => {
    if (!notificationsSupported()) return { status: "unsupported" };

    const settings = await readPrayerReminderSettings();
    if (!settings.enabled) {
        await syncPrayerReminders({ enabled: false });
        return { status: "disabled" };
    }

    const schedule = pickBootstrapSchedule(settings);
    if (!schedule) return { status: "no-schedule" };

    const language = await readReminderLanguage();
    const t = (key, values) => translateMobile(language, key, values);
    const timesForDate = createPrayerTimesResolver({
        adjustments: settings.adjustments,
        coords: schedule.coords,
        lookup: getOfflinePrayerForDate,
        madhab: schedule.madhab,
        method: schedule.method,
    });
    const offlineToday = timesForDate ? await timesForDate(new Date()) : null;

    const result = await syncPrayerReminders({
        enabled: true,
        labels: buildPrayerLabels(t),
        leadMinutes: settings.leadMinutes,
        requestPermission: false,
        selectedPrayers: settings.selectedPrayers,
        t,
        times:
            offlineToday ??
            buildAdjustedPrayerTimes(schedule.prayers, settings.adjustments),
        timesForDate,
    });
    return { count: result.scheduled.length, status: result.status };
};

export function useReminderBootstrap() {
    useEffect(() => {
        if (!notificationsSupported()) return undefined;

        let running = false;
        let lastRunAt = 0;

        const run = async () => {
            if (running) return;

            running = true;
            lastRunAt = Date.now();
            try {
                await runReminderBootstrap();
            } catch {
            } finally {
                running = false;
            }
        };

        run();
        const subscription = AppState.addEventListener("change", (state) => {
            if (state !== "active") return;
            if (Date.now() - lastRunAt < REMINDER_BOOTSTRAP_MIN_INTERVAL_MS) {
                return;
            }
            run();
        });

        return () => subscription?.remove?.();
    }, []);
}
