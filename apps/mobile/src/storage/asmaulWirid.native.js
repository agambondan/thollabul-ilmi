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
                CREATE TABLE IF NOT EXISTS asmaul_wirid (
                    name_id TEXT PRIMARY KEY NOT NULL,
                    count INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                );
            `);
            return db;
        })();
    }
    return dbPromise;
};

const normalizeCounts = (value = {}) =>
    Object.entries(value).reduce((acc, [key, count]) => {
        const nextCount = Number(count);
        if (key && Number.isFinite(nextCount) && nextCount > 0) {
            acc[key] = Math.floor(nextCount);
        }
        return acc;
    }, {});

export const readAsmaulWiridCounts = async () => {
    try {
        const db = await openDb();
        if (!db) return {};
        const rows = await db.getAllAsync(
            "SELECT name_id, count FROM asmaul_wirid WHERE count > 0",
        );
        const result = {};
        for (const row of rows) {
            result[row.name_id] = row.count;
        }
        return normalizeCounts(result);
    } catch {
        return {};
    }
};

export const saveAsmaulWiridCounts = async (counts = {}) => {
    const next = normalizeCounts(counts);
    try {
        const db = await openDb();
        if (db) {
            await db.withTransactionAsync(async () => {
                await db.runAsync("DELETE FROM asmaul_wirid");
                for (const [nameId, count] of Object.entries(next)) {
                    await db.runAsync(
                        "INSERT INTO asmaul_wirid (name_id, count, updated_at) VALUES (?, ?, ?)",
                        [nameId, count, new Date().toISOString()],
                    );
                }
            });
        }
    } catch {
        // Silently fail
    }
    return next;
};

export const setAsmaulWiridCount = async (counts = {}, nameId, count) => {
    if (!nameId) return normalizeCounts(counts);
    const validCount = Math.max(0, Math.floor(Number(count) || 0));

    try {
        const db = await openDb();
        if (db) {
            if (validCount <= 0) {
                await db.runAsync("DELETE FROM asmaul_wirid WHERE name_id = ?", [nameId]);
            } else {
                await db.runAsync(
                    "INSERT OR REPLACE INTO asmaul_wirid (name_id, count, updated_at) VALUES (?, ?, ?)",
                    [nameId, validCount, new Date().toISOString()],
                );
            }
        }
    } catch {
        // Silently fail
    }

    const next = {
        ...counts,
        [nameId]: validCount,
    };
    if (next[nameId] <= 0) delete next[nameId];
    return next;
};