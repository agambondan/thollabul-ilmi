import AsyncStorage from "@react-native-async-storage/async-storage";

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
        const raw = await AsyncStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((item) => item?.key) : [];
    } catch {
        return [];
    }
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

    await AsyncStorage.setItem(RECENT_FEATURES_KEY, JSON.stringify(next));
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

    await AsyncStorage.setItem(PINNED_FEATURES_KEY, JSON.stringify(next));
    return { items: next, pinned: !alreadyPinned };
};
