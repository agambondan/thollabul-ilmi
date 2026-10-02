import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import {
    defaultMobileLanguage,
    normalizeMobileLanguage,
    translateMobile,
} from "../i18n/translations";
import { getOfflinePrayerForDate } from "../storage/offlineContent";
import { preferenceKeys, readPreference } from "../storage/preferences";
import { readSession } from "../storage/session";
import { getAdzanSound } from "../utils/adzanSounds";
import {
    AudioSource,
    registerAudioSource,
    unregisterAudioSource,
} from "../utils/audioSession";
import { notificationsSupported, showPrayerTimeNotification } from "../utils/prayerNotifications";
import {
    buildAdjustedPrayerTimes,
    buildPrayerLabels,
    createPrayerTimesResolver,
    readPrayerReminderSettings,
    scheduleCacheMatchesLocation,
} from "../utils/prayerReminderSettings";

export const POLL_INTERVAL_MS = 10000;
export const ADZAN_DURATION_MS = 30000;

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const toMinutes = (time) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
};

const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
};

export const findDuePrayer = (prayers, adjustments = {}) => {
    if (!prayers) return null;
    const ordered = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const currentMin = getCurrentMinutes();

    for (const key of ordered) {
        const raw = prayers[key];
        const adj = adjustments?.[key] ?? 0;
        const min = toMinutes(raw);
        if (min === null) continue;
        const adjusted = min + adj;
        if (adjusted === currentMin) {
            return key;
        }
    }
    return null;
};

const readMonitorLanguage = async () => {
    const [session, stored] = await Promise.all([
        readSession(),
        readPreference(preferenceKeys.appLanguage, defaultMobileLanguage),
    ]);
    return normalizeMobileLanguage(session?.user?.preferred_lang ?? stored);
};

const pickMonitorSchedule = ({ location, scheduleCache }) => {
    if (!scheduleCache) return null;
    if (location && !scheduleCacheMatchesLocation(scheduleCache, location)) {
        return null;
    }
    return scheduleCache;
};

export function usePrayerTimeMonitor() {
    const lastAlertRef = useRef(null);
    const playerRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!notificationsSupported()) return undefined;

        let active = true;
        let intervalId = null;

        const stopAdzan = () => {
            unregisterAudioSource(AudioSource.ADZAN);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (playerRef.current) {
                try {
                    playerRef.current.stop();
                    playerRef.current.remove?.();
                } catch {}
                playerRef.current = null;
            }
        };

        const playAdzan = async (adzanSoundKey) => {
            try {
                registerAudioSource(AudioSource.ADZAN, stopAdzan);
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    shouldPlayInBackground: true,
                });
                const sound = getAdzanSound(adzanSoundKey);
                const url = sound.src;
                if (!playerRef.current) {
                    playerRef.current = createAudioPlayer(url, {
                        downloadFirst: true,
                    });
                } else {
                    playerRef.current.source = url;
                }
                playerRef.current.play();
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(stopAdzan, ADZAN_DURATION_MS);
            } catch {}
        };

        const checkPrayerTime = async () => {
            if (!active) return;

            try {
                const settings = await readPrayerReminderSettings();
                const schedule = pickMonitorSchedule(settings);
                if (!schedule) return;

                const language = await readMonitorLanguage();
                const t = (key, values) => translateMobile(language, key, values);
                const labels = buildPrayerLabels(t);

                const timesForDate = createPrayerTimesResolver({
                    adjustments: settings.adjustments,
                    coords: schedule.coords,
                    lookup: getOfflinePrayerForDate,
                    madhab: schedule.madhab,
                    method: schedule.method,
                });
                const offlineToday = timesForDate ? await timesForDate(new Date()) : null;
                const prayers =
                    offlineToday ??
                    buildAdjustedPrayerTimes(schedule.prayers, settings.adjustments);

                const duePrayer = findDuePrayer(prayers);
                if (!duePrayer) return;
                if (settings.selectedPrayers && !settings.selectedPrayers.includes(duePrayer)) return;

                const alertKey = `${today()}:${duePrayer}`;
                if (lastAlertRef.current === alertKey) return;

                lastAlertRef.current = alertKey;
                const label = labels[duePrayer] ?? duePrayer;

                await showPrayerTimeNotification({
                    label,
                    prayer: duePrayer,
                    t,
                });

                const adzanAudioEnabled = await readPreference(
                    preferenceKeys.prayerAdzanAudioEnabled,
                    false,
                );
                if (adzanAudioEnabled) {
                    const adzanSound = await readPreference(
                        preferenceKeys.prayerAdzanSound,
                        "default",
                    );
                    await playAdzan(adzanSound);
                }
            } catch {}
        };

        checkPrayerTime();
        intervalId = setInterval(checkPrayerTime, POLL_INTERVAL_MS);

        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                checkPrayerTime();
            } else {
                stopAdzan();
            }
        });

        return () => {
            active = false;
            if (intervalId) clearInterval(intervalId);
            stopAdzan();
            subscription?.remove?.();
        };
    }, []);
}
