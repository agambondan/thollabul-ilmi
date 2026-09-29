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
                CREATE TABLE IF NOT EXISTS mutation_queue (
                    id TEXT PRIMARY KEY NOT NULL,
                    type TEXT NOT NULL,
                    endpoint TEXT NOT NULL,
                    method TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0,
                    last_error TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_mutation_queue_created ON mutation_queue(created_at);
            `);
            return db;
        })();
    }
    return dbPromise;
};

export const enqueueMutation = async ({ endpoint, method = "POST", payload = {}, type = "generic" }) => {
    const item = {
        id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        endpoint,
        method,
        payload,
        createdAt: new Date().toISOString(),
        retryCount: 0,
    };

    try {
        const db = await openDb();
        if (db) {
            await db.runAsync(
                "INSERT INTO mutation_queue (id, type, endpoint, method, payload, created_at, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    item.id,
                    item.type,
                    item.endpoint,
                    item.method,
                    JSON.stringify(item.payload),
                    item.createdAt,
                    item.retryCount,
                ],
            );
        }
    } catch {
        // Fallback silently if db write fails
    }

    return item;
};

export const getPendingMutations = async () => {
    try {
        const db = await openDb();
        if (!db) return [];

        const rows = await db.getAllAsync(
            "SELECT id, type, endpoint, method, payload, created_at, retry_count, last_error FROM mutation_queue ORDER BY created_at ASC",
        );

        return rows.map((r) => {
            let parsedPayload = {};
            try {
                parsedPayload = JSON.parse(r.payload);
            } catch {
                parsedPayload = r.payload;
            }
            return {
                id: r.id,
                type: r.type,
                endpoint: r.endpoint,
                method: r.method,
                payload: parsedPayload,
                createdAt: r.created_at,
                retryCount: r.retry_count,
                lastError: r.last_error,
            };
        });
    } catch {
        return [];
    }
};

export const removeMutation = async (id) => {
    try {
        const db = await openDb();
        if (db) {
            await db.runAsync("DELETE FROM mutation_queue WHERE id = ?", [id]);
        }
    } catch {
        // Fallback
    }
};

export const clearMutationQueue = async () => {
    try {
        const db = await openDb();
        if (db) {
            await db.runAsync("DELETE FROM mutation_queue");
        }
    } catch {
        // Fallback
    }
};

export const flushMutationQueue = async (requestFn) => {
    if (typeof requestFn !== "function") {
        return { processed: 0, failed: 0 };
    }

    const items = await getPendingMutations();
    if (!items.length) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;

    for (const item of items) {
        try {
            await requestFn(item.endpoint, {
                method: item.method,
                body: item.payload,
                auth: true,
            });
            await removeMutation(item.id);
            processed++;
        } catch (err) {
            failed++;
            try {
                const db = await openDb();
                if (db) {
                    await db.runAsync(
                        "UPDATE mutation_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?",
                        [err?.message || String(err), item.id],
                    );
                }
            } catch {
                // Ignore
            }
            // Stop processing remaining items to preserve order on network failure
            break;
        }
    }

    return { processed, failed };
};
