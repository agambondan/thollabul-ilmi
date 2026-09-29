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

const RECENT_FEATURES_KEY = "tholabul:recent-features";
const PINNED_FEATURES_KEY = "tholabul:pinned-features";
const RECENT_LIMIT = 6;
const PINNED_LIMIT = 4;

const normalizeFeature = (feature, extra = {}) => ({
    group: feature?.group ?? "",
    key: feature?.key,
    subtitle: feature?.subtitle ?? "",
    title: feature?.title ?? feature?.key ?? "Fitur",
    ...extra,
});

const readFeatureList = async (storageKey) => {
    try {
        const db = await openDb();
        if (db) {
            const row = await db.getFirstAsync(
                "SELECT value FROM app_key_value WHERE key = ?",
                [storageKey],
            );
            if (row?.value) {
                const parsed = JSON.parse(row.value);
                return Array.isArray(parsed)
                    ? parsed.filter((item) => item?.key)
                    : [];
            }
        }

        const raw = await AsyncStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        const result = Array.isArray(parsed)
            ? parsed.filter((item) => item?.key)
            : [];

        if (db && result.length > 0) {
            await db.runAsync(
                "INSERT OR REPLACE INTO app_key_value (key, value, updated_at) VALUES (?, ?, ?)",
                [storageKey, JSON.stringify(result), Date.now()],
            );
        }

        return result;
    } catch {
        return [];
    }
};

const saveFeatureList = async (storageKey, list) => {
    try {
        const db = await openDb();
        if (db) {
            await db.runAsync(
                "INSERT OR REPLACE INTO app_key_value (key, value, updated_at) VALUES (?, ?, ?)",
                [storageKey, JSON.stringify(list), Date.now()],
            );
        }
    } catch {}
    await AsyncStorage.setItem(storageKey, JSON.stringify(list)).catch(() => {});
};

export const readRecentFeatures = async () =>
    readFeatureList(RECENT_FEATURES_KEY);

export const readPinnedFeatures = async () =>
    readFeatureList(PINNED_FEATURES_KEY);

export const rememberFeatureOpen = async (feature) => {
    if (!feature?.key) return [];

    const current = await readRecentFeatures();
    const next = [
        normalizeFeature(feature, { openedAt: new Date().toISOString() }),
        ...current.filter((item) => item.key !== feature.key),
    ].slice(0, RECENT_LIMIT);

    await saveFeatureList(RECENT_FEATURES_KEY, next);
    return next;
};

export const togglePinnedFeature = async (feature) => {
    if (!feature?.key) return { items: [], pinned: false };

    const current = await readPinnedFeatures();
    const alreadyPinned = current.some((item) => item.key === feature.key);
    const next = alreadyPinned
        ? current.filter((item) => item.key !== feature.key)
        : [
              normalizeFeature(feature, { pinnedAt: new Date().toISOString() }),
              ...current.filter((item) => item.key !== feature.key),
          ].slice(0, PINNED_LIMIT);

    await saveFeatureList(PINNED_FEATURES_KEY, next);
    return { items: next, pinned: !alreadyPinned };
};
