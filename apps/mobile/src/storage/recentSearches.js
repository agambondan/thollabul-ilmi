import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_SEARCHES_KEY = "tholabul:recent-searches";
const RECENT_SEARCH_LIMIT = 8;

const normalizeSearch = (query) => `${query ?? ""}`.trim();

export const readRecentSearches = async () => {
    try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
            ? parsed.filter((item) => typeof item === "string" && item.trim())
            : [];
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

    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    return next;
};
