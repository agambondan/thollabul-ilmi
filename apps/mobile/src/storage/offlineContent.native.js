import {
    normalizeAyah,
    normalizeHadith,
    normalizeSurah,
    pickItems,
    requestJson,
} from "../api/client";
import * as SQLite from "expo-sqlite";

const DB_NAME = "tholabul_offline.db";
const MAIN_PACK_TYPES = ["quran_surah", "quran_ayah", "hadith"];
const HADITH_PAGE_SIZE = 100;
const HADITH_SAFETY_MAX_PAGES = 5000;
const PRAYER_PACK_DAYS = 30;

let dbPromise;

const emptyOverview = (extra = {}) => ({
    supported: false,
    includeQuran: false,
    quranSurahs: 0,
    quranAyahs: 0,
    hadiths: 0,
    hadithBooks: [],
    prayerDays: 0,
    savedAt: null,
    ...extra,
});

const openDb = async () => {
    if (!dbPromise) {
        dbPromise = (async () => {
            if (!SQLite?.openDatabaseAsync) {
                throw new Error(
                    "Mode offline belum tersedia di perangkat ini.",
                );
            }

            const db = await SQLite.openDatabaseAsync(DB_NAME);
            await db.execAsync(`
        CREATE TABLE IF NOT EXISTS offline_items (
          key TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          saved_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_offline_items_type ON offline_items(type);
        CREATE TABLE IF NOT EXISTS offline_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          saved_at TEXT NOT NULL
        );
      `);
            return db;
        })();
    }

    return dbPromise;
};

const countByType = async (db, type) => {
    const row = await db.getFirstAsync(
        "SELECT COUNT(*) AS count FROM offline_items WHERE type = ?",
        [type],
    );
    return Number(row?.count ?? 0);
};

const getMeta = async (db, key) => {
    const row = await db.getFirstAsync(
        "SELECT value, saved_at FROM offline_meta WHERE key = ?",
        [key],
    );
    if (!row) return null;

    try {
        return JSON.parse(row.value);
    } catch {
        return row.value;
    }
};

const setMeta = async (db, key, value, savedAt) => {
    await db.runAsync(
        "INSERT OR REPLACE INTO offline_meta (key, value, saved_at) VALUES (?, ?, ?)",
        [key, JSON.stringify(value), savedAt],
    );
};

const upsertItem = async (db, type, key, payload, savedAt) => {
    await db.runAsync(
        "INSERT OR REPLACE INTO offline_items (key, type, payload, saved_at) VALUES (?, ?, ?, ?)",
        [key, type, JSON.stringify(payload), savedAt],
    );
};

const deleteItemTypes = async (db, types) => {
    if (!types.length) return;

    await db.runAsync(
        `DELETE FROM offline_items WHERE type IN (${types.map(() => "?").join(",")})`,
        types,
    );
};

export const getOfflineHadithCountByBook = async (bookSlug) => {
    if (!bookSlug) return 0;
    try {
        const db = await openDb();
        const row = await db.getFirstAsync(
            "SELECT COUNT(*) AS c FROM offline_items WHERE type = 'hadith' AND key LIKE ?",
            [`hadith:${bookSlug}:%`],
        );
        return Number(row?.c ?? 0);
    } catch {
        return 0;
    }
};

export const getOfflineHadithCountsBySlug = async () => {
    try {
        const db = await openDb();
        const rows = await db.getAllAsync(
            "SELECT key FROM offline_items WHERE type = 'hadith'",
        );
        const counts = {};
        for (const row of rows) {
            const match = /^hadith:([^:]+):/.exec(String(row?.key ?? ""));
            if (!match) continue;
            const slug = match[1];
            counts[slug] = (counts[slug] ?? 0) + 1;
        }
        return counts;
    } catch {
        return {};
    }
};

export const getOfflineOverview = async () => {
    try {
        const db = await openDb();
        const [quranSurahs, quranAyahs, hadiths, prayerDays, meta] =
            await Promise.all([
                countByType(db, "quran_surah"),
                countByType(db, "quran_ayah"),
                countByType(db, "hadith"),
                countByType(db, "prayer_day"),
                getMeta(db, "offline_pack"),
            ]);

        return {
            supported: true,
            includeQuran: Boolean(
                meta?.includeQuran ?? (quranSurahs || quranAyahs),
            ),
            quranSurahs,
            quranAyahs,
            hadiths,
            hadithBooks: Array.isArray(meta?.hadithBooks)
                ? meta.hadithBooks
                : [],
            prayerDays,
            savedAt: meta?.savedAt ?? null,
        };
    } catch (error) {
        return emptyOverview({
            error:
                error?.message ??
                "Mode offline belum tersedia di perangkat ini.",
        });
    }
};

export const getPrayerOfflineOverview = async ({
    lat,
    lng,
    method = "kemenag",
    madhab = "shafi",
} = {}) => {
    try {
        const db = await openDb();
        const locationKey = prayerLocationKey({ lat, lng, method, madhab });
        const [row, meta] = await Promise.all([
            db.getFirstAsync(
                "SELECT COUNT(*) AS count FROM offline_items WHERE type = ? AND key LIKE ?",
                ["prayer_day", `prayer:${locationKey}:%`],
            ),
            getMeta(db, `prayer_pack:${locationKey}`),
        ]);

        return {
            days: Number(row?.count ?? 0),
            locationKey,
            savedAt: meta?.savedAt ?? null,
            supported: true,
        };
    } catch (error) {
        return {
            days: 0,
            error:
                error?.message ??
                "Mode offline belum tersedia di perangkat ini.",
            locationKey: null,
            savedAt: null,
            supported: false,
        };
    }
};

export const clearOfflinePack = async () => {
    const db = await openDb();
    await deleteItemTypes(db, MAIN_PACK_TYPES);
    await db.runAsync("DELETE FROM offline_meta WHERE key = ?", [
        "offline_pack",
    ]);
    await db.runAsync(
        "DELETE FROM offline_meta WHERE key LIKE 'hadith_book:%'",
    );
    return getOfflineOverview();
};

export const clearPrayerOfflinePack = async ({
    lat,
    lng,
    method = "kemenag",
    madhab = "shafi",
} = {}) => {
    const db = await openDb();
    const locationKey = prayerLocationKey({ lat, lng, method, madhab });
    await db.runAsync(
        "DELETE FROM offline_items WHERE type = ? AND key LIKE ?",
        ["prayer_day", `prayer:${locationKey}:%`],
    );
    await db.runAsync("DELETE FROM offline_meta WHERE key = ?", [
        `prayer_pack:${locationKey}`,
    ]);
    return getPrayerOfflineOverview({ lat, lng, method, madhab });
};

const dateKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const roundedCoord = (value) => Number(value ?? 0).toFixed(3);

const prayerLocationKey = ({
    lat,
    lng,
    method = "kemenag",
    madhab = "shafi",
}) => `${method}:${madhab}:${roundedCoord(lat)}:${roundedCoord(lng)}`;

const normalizePrayerDay = (payload, requestedDate) => {
    const data = payload?.data ?? payload;
    return {
        date: data?.date ?? requestedDate,
        lat: data?.lat,
        lng: data?.lng,
        madhab: data?.madhab,
        method: data?.method,
        prayers: data?.prayers ?? data,
    };
};

export const buildPrayerOfflinePack = async ({
    days = PRAYER_PACK_DAYS,
    lat,
    lng,
    madhab = "shafi",
    method = "kemenag",
    onProgress,
} = {}) => {
    if (typeof lat !== "number" || typeof lng !== "number") {
        throw new Error("Lokasi dibutuhkan sebelum menyimpan jadwal sholat.");
    }

    const db = await openDb();
    const savedAt = new Date().toISOString();
    const locationKey = prayerLocationKey({ lat, lng, method, madhab });
    const totalDays = Math.max(1, days);

    for (let index = 0; index < totalDays; index += 1) {
        const date = dateKey(
            new Date(Date.now() + index * 24 * 60 * 60 * 1000),
        );
        onProgress?.({
            label: `Mengunduh jadwal sholat ${index + 1}/${totalDays}`,
            value: Math.round((index / totalDays) * 100),
        });
        const payload = await requestJson(
            `/api/v1/sholat-times?lat=${lat}&lng=${lng}&method=${method}&madhab=${madhab}&date=${date}`,
        );
        await upsertItem(
            db,
            "prayer_day",
            `prayer:${locationKey}:${date}`,
            normalizePrayerDay(payload, date),
            savedAt,
        );
    }

    await setMeta(
        db,
        `prayer_pack:${locationKey}`,
        { days: totalDays, locationKey, savedAt },
        savedAt,
    );
    onProgress?.({ label: "Jadwal sholat 30 hari siap", value: 100 });
    return getPrayerOfflineOverview({ lat, lng, method, madhab });
};

export const getOfflinePrayerForDate = async ({
    date = dateKey(new Date()),
    lat,
    lng,
    madhab = "shafi",
    method = "kemenag",
} = {}) => {
    const db = await openDb();
    const locationKey = prayerLocationKey({ lat, lng, method, madhab });
    const row = await db.getFirstAsync(
        "SELECT payload FROM offline_items WHERE type = ? AND key = ?",
        ["prayer_day", `prayer:${locationKey}:${date}`],
    );
    if (!row?.payload) return null;

    try {
        return JSON.parse(row.payload)?.prayers ?? null;
    } catch {
        return null;
    }
};

const progressValue = (base, span, current, total) =>
    base + Math.round((current / Math.max(total, 1)) * span);

const normalizeBookOption = (book) => {
    const slug = String(book?.slug ?? "").trim();
    if (!slug) return null;

    return {
        id: book?.id ?? slug,
        name: book?.name ?? book?.label ?? slug,
        slug,
    };
};

const uniqueBooks = (books = []) => {
    const seen = new Set();
    return books
        .map(normalizeBookOption)
        .filter(Boolean)
        .filter((book) => {
            if (seen.has(book.slug)) return false;
            seen.add(book.slug);
            return true;
        });
};

const saveQuranPack = async ({
    db,
    onProgress,
    progressBase = 0,
    progressSpan = 50,
    savedAt,
}) => {
    onProgress?.({
        label: "Mengunduh daftar surah",
        phase: "quran",
        value: progressBase,
    });
    const surahPayload = await requestJson(
        "/api/v1/surah?size=114&sort=number",
    );
    const surahs = pickItems(surahPayload)
        .map(normalizeSurah)
        .filter((item) => item.number);
    let ayahCount = 0;

    for (const surah of surahs) {
        await upsertItem(
            db,
            "quran_surah",
            `surah:${surah.number}`,
            surah,
            savedAt,
        );
    }

    for (let index = 0; index < surahs.length; index += 1) {
        const surah = surahs[index];
        onProgress?.({
            label: `Mengunduh ${surah.name}`,
            phase: "quran",
            value: progressValue(
                progressBase,
                progressSpan,
                index,
                surahs.length,
            ),
        });

        const ayahPayload = await requestJson(
            `/api/v1/ayah/surah/number/${surah.number}?size=300&page=0`,
        );
        const ayahs = pickItems(ayahPayload)
            .map(normalizeAyah)
            .filter((item) => item.number);
        ayahCount += ayahs.length;

        for (const ayah of ayahs) {
            await upsertItem(
                db,
                "quran_ayah",
                `ayah:${surah.number}:${ayah.number}`,
                { ...ayah, surahNumber: surah.number },
                savedAt,
            );
        }
    }

    return { surahCount: surahs.length, ayahCount };
};

const SYNC_SAFETY_BUFFER_MS = 5 * 60 * 1000;

const saveHadithPack = async ({
    books = [],
    db,
    onProgress,
    progressBase = 50,
    progressSpan = 45,
    savedAt,
}) => {
    const hadithBooks = uniqueBooks(books);
    let hadithCount = 0;

    if (!hadithBooks.length) {
        return { hadithBooks, hadithCount };
    }

    for (let bookIndex = 0; bookIndex < hadithBooks.length; bookIndex += 1) {
        const book = hadithBooks[bookIndex];
        let page = 0;
        let totalPages = 1;
        const syncStart = Date.now();
        const lastSyncMeta = await getMeta(db, `hadith_book:${book.slug}`);
        const lastSyncAt = lastSyncMeta?.lastSyncAt;
        const updatedAfter = lastSyncAt
            ? new Date(
                  new Date(lastSyncAt).getTime() - SYNC_SAFETY_BUFFER_MS,
              ).toISOString()
            : null;

        while (page < totalPages && page < HADITH_SAFETY_MAX_PAGES) {
            onProgress?.({
                label: updatedAfter
                    ? `Cek update ${book.name} halaman ${page + 1}`
                    : `Mengunduh ${book.name} halaman ${page + 1}`,
                phase: "hadith",
                value: progressValue(
                    progressBase,
                    progressSpan,
                    bookIndex + page / Math.max(totalPages, 1),
                    hadithBooks.length,
                ),
            });

            const params = new URLSearchParams({
                size: String(HADITH_PAGE_SIZE),
                page: String(page),
            });
            if (updatedAfter) params.set("updated_after", updatedAfter);
            const payload = await requestJson(
                `/api/v1/hadiths/book/${encodeURIComponent(book.slug)}?${params.toString()}`,
            );
            const items = pickItems(payload)
                .map(normalizeHadith)
                .filter((item) => item.id);
            totalPages =
                Number(
                    payload?.total_pages ??
                        payload?.totalPages ??
                        payload?.data?.total_pages ??
                        payload?.data?.totalPages ??
                        totalPages,
                ) || totalPages;

            for (const hadith of items) {
                await upsertItem(
                    db,
                    "hadith",
                    `hadith:${book.slug}:${hadith.id}`,
                    {
                        ...hadith,
                        bookName: hadith.bookName ?? book.name,
                        bookSlug: hadith.bookSlug ?? book.slug,
                    },
                    savedAt,
                );
            }

            hadithCount += items.length;
            if (!items.length) break;
            page += 1;
        }

        await setMeta(
            db,
            `hadith_book:${book.slug}`,
            {
                lastSyncAt: new Date(syncStart).toISOString(),
                slug: book.slug,
                name: book.name,
            },
            savedAt,
        );
    }

    return { hadithBooks, hadithCount };
};

const QURAN_TOTAL_AYAHS = 6236;
const QURAN_TOTAL_SURAHS = 114;

export const buildOfflinePack = async ({
    hadithBooks = [],
    includeQuran = true,
    onProgress,
    force = false,
    checkUpdates = false,
} = {}) => {
    const books = uniqueBooks(hadithBooks);
    if (!includeQuran && !books.length) {
        throw new Error("Pilih minimal satu paket data untuk diunduh.");
    }

    const db = await openDb();
    const savedAt = new Date().toISOString();

    const [existingQuranSurahs, existingQuranAyahs, localHadithCounts] =
        await Promise.all([
            countByType(db, "quran_surah"),
            countByType(db, "quran_ayah"),
            getOfflineHadithCountsBySlug(),
        ]);

    const quranComplete =
        existingQuranSurahs >= QURAN_TOTAL_SURAHS &&
        existingQuranAyahs >= QURAN_TOTAL_AYAHS;
    const shouldSaveQuran = includeQuran && (force || !quranComplete);

    const booksToFetch =
        force || checkUpdates
            ? books
            : books.filter((book) => {
                  const local = localHadithCounts[book.slug] ?? 0;
                  const expected = Number(book.count) || 0;
                  if (expected <= 0) return local === 0;
                  return local < expected;
              });

    if (!shouldSaveQuran && booksToFetch.length === 0) {
        onProgress?.({
            label: "Sudah lengkap, tidak ada yang perlu diunduh",
            phase: "done",
            value: 100,
        });
        const overview = await getOfflineOverview();
        return { ...overview, deltaCount: 0, checkedForUpdates: checkUpdates };
    }

    const quranSpan =
        shouldSaveQuran && booksToFetch.length ? 48 : shouldSaveQuran ? 95 : 0;
    const hadithBase = shouldSaveQuran ? quranSpan : 0;
    const hadithSpan = booksToFetch.length ? 95 - hadithBase : 0;
    const quran = shouldSaveQuran
        ? await saveQuranPack({
              db,
              onProgress,
              progressBase: 0,
              progressSpan: quranSpan,
              savedAt,
          })
        : { ayahCount: existingQuranAyahs, surahCount: existingQuranSurahs };
    const hadith = booksToFetch.length
        ? await saveHadithPack({
              books: booksToFetch,
              db,
              onProgress,
              progressBase: hadithBase,
              progressSpan: hadithSpan,
              savedAt,
          })
        : { hadithBooks: [], hadithCount: 0 };

    const allBooksSaved = uniqueBooks([
        ...books,
        ...(hadith.hadithBooks ?? []),
    ]);
    await setMeta(
        db,
        "offline_pack",
        {
            ...quran,
            hadithBooks: allBooksSaved,
            hadithCount: hadith.hadithCount,
            includeQuran: includeQuran || quranComplete,
            savedAt,
        },
        savedAt,
    );

    const deltaLabel =
        checkUpdates && hadith.hadithCount === 0 && !shouldSaveQuran
            ? "Sudah versi terbaru"
            : checkUpdates
              ? `${hadith.hadithCount} hadis diperbarui`
              : "Paket offline siap";
    onProgress?.({ label: deltaLabel, phase: "done", value: 100 });
    const overview = await getOfflineOverview();
    return {
        ...overview,
        deltaCount: hadith.hadithCount,
        checkedForUpdates: checkUpdates,
    };
};

export const getOfflineItems = async (type) => {
    const db = await openDb();
    const rows = await db.getAllAsync(
        "SELECT payload FROM offline_items WHERE type = ? ORDER BY key ASC",
        [type],
    );
    return rows
        .map((row) => {
            try {
                return JSON.parse(row.payload);
            } catch {
                return null;
            }
        })
        .filter(Boolean);
};
