import * as SQLite from "expo-sqlite";

const DB_NAME = "tholabul_offline.db";
let dbPromise;

const openDb = async () => {
    if (!dbPromise) {
        dbPromise = (async () => {
            if (!SQLite?.openDatabaseAsync) {
                return null;
            }
            const db = await SQLite.openDatabaseAsync(DB_NAME);
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS calculator_history (
                    id TEXT PRIMARY KEY NOT NULL,
                    type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    synced INTEGER DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_calculator_history_type ON calculator_history(type);
                CREATE INDEX IF NOT EXISTS idx_calculator_history_created ON calculator_history(created_at);
            `);
            return db;
        })();
    }
    return dbPromise;
};

const HISTORY_LIMIT = 30;

export const readCalculatorHistory = async (type) => {
    try {
        const db = await openDb();
        if (!db) return [];
        const rows = await db.getAllAsync(
            "SELECT id, type, payload, created_at, synced FROM calculator_history WHERE type = ? ORDER BY created_at DESC LIMIT ?",
            [type, HISTORY_LIMIT],
        );
        return rows.map((row) => ({
            ...JSON.parse(row.payload),
            id: row.id,
            is_local: !row.synced,
        }));
    } catch {
        return [];
    }
};

export const saveCalculatorHistory = async (type, payload = {}) => {
    const created = {
        ...payload,
        created_at: payload.created_at ?? new Date().toISOString(),
        id: payload.id ?? `local-${type}-${Date.now()}`,
        is_local: true,
    };

    try {
        const db = await openDb();
        if (db) {
            await db.runAsync(
                "INSERT OR REPLACE INTO calculator_history (id, type, payload, created_at, synced) VALUES (?, ?, ?, ?, ?)",
                [
                    created.id,
                    type,
                    JSON.stringify(created),
                    created.created_at,
                    0,
                ],
            );
        }
    } catch {
        // Silently fail
    }

    return created;
};

export const deleteCalculatorHistory = async (type, id) => {
    try {
        const db = await openDb();
        if (db) {
            await db.runAsync(
                "DELETE FROM calculator_history WHERE type = ? AND id = ?",
                [type, id],
            );
        }
    } catch {
        // Silently fail
    }
};

export const mergeCalculatorHistory = (remoteItems = [], localItems = []) => {
    const seen = new Set();
    const merged = [];

    [...remoteItems, ...localItems].forEach((item) => {
        const key = item?.id ?? item?.created_at ?? JSON.stringify(item);
        if (!key || seen.has(key)) return;
        seen.add(key);
        merged.push(item);
    });

    return merged.sort((a, b) => {
        const aTime = new Date(a?.created_at ?? a?.createdAt ?? 0).getTime();
        const bTime = new Date(b?.created_at ?? b?.createdAt ?? 0).getTime();
        return bTime - aTime;
    });
};

export const markCalculatorHistorySynced = async (type, ids) => {
    if (!ids?.length) return;
    try {
        const db = await openDb();
        if (db) {
            const placeholders = ids.map(() => "?").join(",");
            await db.runAsync(
                `UPDATE calculator_history SET synced = 1 WHERE type = ? AND id IN (${placeholders})`,
                [type, ...ids],
            );
        }
    } catch {
        // Silently fail
    }
};

export const clearCalculatorHistory = async (type) => {
    try {
        const db = await openDb();
        if (db) {
            await db.runAsync("DELETE FROM calculator_history WHERE type = ?", [type]);
        }
    } catch {
        // Silently fail
    }
};