let kvTable = {};

const mockRunAsync = jest.fn((sql, params = []) => {
    if (sql.includes("INSERT OR REPLACE INTO app_key_value")) {
        const [key, value, updatedAt] = params;
        kvTable[key] = { key, value, updated_at: updatedAt };
    } else if (sql.includes("DELETE FROM app_key_value WHERE key = ?")) {
        const [key] = params;
        delete kvTable[key];
    }
    return Promise.resolve(null);
});

const mockGetFirstAsync = jest.fn((sql, params = []) => {
    if (sql.includes("SELECT value FROM app_key_value WHERE key = ?")) {
        const [key] = params;
        return Promise.resolve(kvTable[key] || null);
    }
    return Promise.resolve(null);
});

jest.mock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn().mockResolvedValue(null),
        runAsync: (...args) => mockRunAsync(...args),
        getFirstAsync: (...args) => mockGetFirstAsync(...args),
    }),
}));

import {
    preferenceKeys,
    readPreference,
    writePreference,
} from "../storage/preferences.native";
import {
    readRecentSearches,
    rememberRecentSearch,
} from "../storage/recentSearches.native";
import {
    readRecentFeatures,
    readPinnedFeatures,
    rememberFeatureOpen,
    togglePinnedFeature,
} from "../storage/recentFeatures.native";

describe("SQLite native storage modules", () => {
    beforeEach(() => {
        kvTable = {};
        mockRunAsync.mockClear();
        mockGetFirstAsync.mockClear();
    });

    test("reads and writes preference via SQLite", async () => {
        const def = await readPreference(preferenceKeys.appLanguage, "id");
        expect(def).toBe("id");

        await writePreference(preferenceKeys.appLanguage, "en");
        expect(mockRunAsync).toHaveBeenCalled();

        const stored = await readPreference(preferenceKeys.appLanguage, "id");
        expect(stored).toBe("en");
    });

    test("reads and remembers recent searches via SQLite", async () => {
        const empty = await readRecentSearches();
        expect(empty).toEqual([]);

        await rememberRecentSearch("al-fatihah");
        await rememberRecentSearch("baqarah");

        const history = await readRecentSearches();
        expect(history).toEqual(["baqarah", "al-fatihah"]);
    });

    test("tracks and pins features via SQLite", async () => {
        const feat = { key: "qibla", title: "Arah Kiblat" };
        await rememberFeatureOpen(feat);

        const recents = await readRecentFeatures();
        expect(recents).toHaveLength(1);
        expect(recents[0].key).toBe("qibla");

        const pinResult = await togglePinnedFeature(feat);
        expect(pinResult.pinned).toBe(true);

        const pinned = await readPinnedFeatures();
        expect(pinned).toHaveLength(1);
        expect(pinned[0].key).toBe("qibla");

        const unpinResult = await togglePinnedFeature(feat);
        expect(unpinResult.pinned).toBe(false);
        expect(await readPinnedFeatures()).toEqual([]);
    });
});
