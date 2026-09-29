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

const RECENT_SEARCHES_KEY = "tholabul:recent-searches";
const RECENT_SEARCH_LIMIT = 8;

const normalizeSearch = (query) => `${query ?? ""}`.trim();

export const readRecentSearches = async () => {
    try {
        const db = await openDb();
        if (db) {
            const row = await db.getFirstAsync(
                "SELECT value FROM app_key_value WHERE key = ?",
                [RECENT_SEARCHES_KEY],
            );
            if (row?.value) {
                const parsed = JSON.parse(row.value);
                return Array.isArray(parsed)
                    ? parsed.filter(
                          (item) => typeof item === "string" && item.trim(),
                      )
                    : [];
            }
        }

        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const result = Array.isArray(parsed)
            ? parsed.filter((item) => typeof item === "string" && item.trim())
            : [];

        if (db && result.length > 0) {
            await db.runAsync(
                "INSERT OR REPLACE INTO app_key_value (key, value, updated_at) VALUES (?, ?, ?)",
                [RECENT_SEARCHES_KEY, JSON.stringify(result), Date.now()],
            );
        }

        return result;
    } catch {
        return [];
    }
};

export const rememberRecentSearch = async (query) => {
    const normalized = normalizeSearch(query);
    if (normalized.length < 2) return [];

    const current = await readRecentSearches();
    const next = [
        normalized,
        ...current.filter(
            (item) => item.toLowerCase() !== normalized.toLowerCase(),
        ),
    ].slice(0, RECENT_SEARCH_LIMIT);

    try {
        const db = await openDb();
        if (db) {
            await db.runAsync(
                "INSERT OR REPLACE INTO app_key_value (key, value, updated_at) VALUES (?, ?, ?)",
                [RECENT_SEARCHES_KEY, JSON.stringify(next), Date.now()],
            );
        }
    } catch {}

    await AsyncStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(next),
    ).catch(() => {});
    return next;
};
