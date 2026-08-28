import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEYS = {
    faraidh: "tholabul:calculator-history:faraidh",
    zakat: "tholabul:calculator-history:zakat",
};
const HISTORY_LIMIT = 30;

const keyFor = (type) => HISTORY_KEYS[type];

const readRawHistory = async (type) => {
    const key = keyFor(type);
    if (!key) return [];

    try {
        const raw = await AsyncStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((item) => item?.id) : [];
    } catch {
        return [];
    }
};

const writeRawHistory = async (type, items) => {
    const key = keyFor(type);
    if (!key) return [];

    const next = items.slice(0, HISTORY_LIMIT);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return next;
};

export const readCalculatorHistory = async (type) =>
    (await readRawHistory(type)).map((item) => ({
        ...item,
        is_local: true,
    }));

export const saveCalculatorHistory = async (type, payload = {}) => {
    const current = await readRawHistory(type);
    const created = {
        ...payload,
        created_at: payload.created_at ?? new Date().toISOString(),
        id: payload.id ?? `local-${type}-${Date.now()}`,
        is_local: true,
    };
    const next = [created, ...current.filter((item) => item.id !== created.id)];
    await writeRawHistory(type, next);
    return created;
};

export const deleteCalculatorHistory = async (type, id) => {
    const current = await readRawHistory(type);
    return writeRawHistory(
        type,
        current.filter((item) => item.id !== id),
    );
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
