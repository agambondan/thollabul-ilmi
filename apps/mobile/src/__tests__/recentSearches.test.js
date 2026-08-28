import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    rememberRecentSearch,
    readRecentSearches,
} from "../storage/recentSearches";

beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
});

describe("readRecentSearches", () => {
    test("returns empty array when nothing stored", async () => {
        const result = await readRecentSearches();
        expect(result).toEqual([]);
    });

    test("returns parsed array from storage", async () => {
        AsyncStorage.getItem.mockResolvedValue('["quran","hadis"]');
        const result = await readRecentSearches();
        expect(result).toEqual(["quran", "hadis"]);
    });

    test("filters out non-strings and empty strings", async () => {
        AsyncStorage.getItem.mockResolvedValue('["valid", "", 42, "  "]');
        const result = await readRecentSearches();
        expect(result).toEqual(["valid"]);
    });

    test("returns empty array on error", async () => {
        AsyncStorage.getItem.mockRejectedValue(new Error("fail"));
        const result = await readRecentSearches();
        expect(result).toEqual([]);
    });
});

describe("rememberRecentSearch", () => {
    test("adds query to recent list", async () => {
        AsyncStorage.getItem.mockResolvedValue('["tafsir"]');
        const result = await rememberRecentSearch("quran");
        expect(result).toEqual(["quran", "tafsir"]);
    });

    test("deduplicates case-insensitively", async () => {
        AsyncStorage.getItem.mockResolvedValue('["Quran","hadis"]');
        const result = await rememberRecentSearch("quran");
        expect(result).toEqual(["quran", "hadis"]);
    });

    test("limits to 8 items", async () => {
        AsyncStorage.getItem.mockResolvedValue(
            JSON.stringify(["a", "b", "c", "d", "e", "f", "g", "h"]),
        );
        const result = await rememberRecentSearch("ix");
        expect(result).toHaveLength(8);
        expect(result[0]).toBe("ix");
    });

    test("does nothing for queries under 2 characters", async () => {
        const result = await rememberRecentSearch("a");
        expect(result).toEqual([]);
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    test("trims whitespace from query", async () => {
        AsyncStorage.getItem.mockResolvedValue('["existing"]');
        const result = await rememberRecentSearch("  new  ");
        expect(result).toEqual(["new", "existing"]);
    });
});
