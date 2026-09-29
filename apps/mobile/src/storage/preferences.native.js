import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DB_NAME = "tholabul_offline.db";
let dbPromise;

const openDb = async () => {
    if (!dbPromise) {
        dbPromise = (async () => {
            if (!SQLite?.openDatabaseAsync) {
                return null;
            }
            try {
                const db = await SQLite.openDatabaseAsync(DB_NAME);
                await db.execAsync(`
                    CREATE TABLE IF NOT EXISTS app_key_value (
                        key TEXT PRIMARY KEY NOT NULL,
                        value TEXT NOT NULL,
                        updated_at INTEGER NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS idx_key_value_key ON app_key_value(key);
                `);
                return db;
            } catch {
                return null;
            }
        })();
    }
    return dbPromise;
};

const PREF_PREFIX = "tholabul:pref:";

const keyFor = (key) => `${PREF_PREFIX}${key}`;

export const preferenceKeys = {
    prayerAdjustments: "prayer-adjustments",
    prayerAdzanAudioEnabled: "prayer-adzan-audio-enabled",
    prayerAdzanSound: "prayer-adzan-sound",
    prayerAdzanVolume: "prayer-adzan-volume",
    homeLastLocation: "home-last-location",
    homePrayerTimes: "home-prayer-times",
    khatamTargetDays: "khatam-target-days",
    prayerMadhab: "prayer-madhab",
    prayerMethod: "prayer-method",
    prayerReminderEnabled: "prayer-reminder-enabled",
    prayerReminderIds: "prayer-reminder-ids",
    prayerReminderLeadMinutes: "prayer-reminder-lead-minutes",
    prayerReminderPrayers: "prayer-reminder-prayers",
    appLanguage: "app-language",
    appLayoutMode: "app-layout-mode",
    appTheme: "app-theme",
    smartNotifLocalIds: "smart-notif-local-ids",
    smartNotifPendingSync: "smart-notif-pending-sync",
    smartNotifQuietHours: "smart-notif-quiet-hours",
    smartNotifSettings: "smart-notif-settings",
    lessonProgressPendingSync: "lesson-progress-pending-sync",
    quranArabicFont: "quran-arabic-font",
    quranAudioQari: "quran-audio-qari",
    quranAudioRange: "quran-audio-range",
    quranAudioRepeat: "quran-audio-repeat",
    quranAudioSpeed: "quran-audio-speed",
    quranDisplayMode: "quran-display-mode",
    quranFontSize: "quran-font-size",
    quranFullscreen: "quran-fullscreen",
    quranLastRead: "quran-last-read",
    quranMemorizationMode: "quran-memorization-mode",
    quranTranslationFontSize: "quran-translation-font-size",
};

export const readPreference = async (key, defaultValue) => {
    const fullKey = keyFor(key);
    try {
        const db = await openDb();
        if (db) {
            const row = await db.getFirstAsync(
                "SELECT value FROM app_key_value WHERE key = ?",
                [fullKey],
            );
            if (row?.value !== undefined && row?.value !== null) {
                return JSON.parse(row.value);
            }
        }

        const raw = await AsyncStorage.getItem(fullKey);
        if (raw === null || raw === undefined) return defaultValue;
        const parsed = JSON.parse(raw);

        if (db) {
            await db.runAsync(
                "INSERT OR REPLACE INTO app_key_value (key, value, updated_at) VALUES (?, ?, ?)",
                [fullKey, JSON.stringify(parsed), Date.now()],
            );
        }

        return parsed;
    } catch {
        return defaultValue;
    }
};

export const writePreference = async (key, value) => {
    const fullKey = keyFor(key);
    const jsonStr = JSON.stringify(value);

    try {
        const db = await openDb();
        if (db) {
            await db.runAsync(
                "INSERT OR REPLACE INTO app_key_value (key, value, updated_at) VALUES (?, ?, ?)",
                [fullKey, jsonStr, Date.now()],
            );
        }
    } catch {}

    await AsyncStorage.setItem(fullKey, jsonStr);
    return value;
};
