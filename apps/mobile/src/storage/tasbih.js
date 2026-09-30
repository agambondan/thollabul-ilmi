import { readPreference, writePreference } from "./preferences";

const TASBIH_PREFERENCE_KEY = "tasbih-state";

export const DEFAULT_TASBIH_TARGET = 33;
export const MAX_TASBIH_TARGET = 99999;
export const MAX_TASBIH_TARGET_DIGITS = `${MAX_TASBIH_TARGET}`.length;
export const MAX_TASBIH_DAILY_HISTORY = 14;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getTasbihDateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const clampTasbihTarget = (value) => {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.min(parsed, MAX_TASBIH_TARGET);
};

export const clampTasbihCount = (value) => {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const normalizeTasbihTotals = (totals) => {
    const entries = Object.entries(
        totals && typeof totals === "object" ? totals : {},
    )
        .filter(([date]) => DATE_KEY_PATTERN.test(date))
        .map(([date, total]) => [date, clampTasbihCount(total)])
        .filter(([, total]) => total > 0)
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .slice(0, MAX_TASBIH_DAILY_HISTORY);
    return Object.fromEntries(entries);
};

export const addTasbihTotal = (totals, amount, now = new Date()) => {
    const gained = clampTasbihCount(amount);
    if (!gained) return normalizeTasbihTotals(totals);
    const key = getTasbihDateKey(now);
    const current = normalizeTasbihTotals(totals);
    return normalizeTasbihTotals({
        ...current,
        [key]: (current[key] ?? 0) + gained,
    });
};

export const clearTasbihTotal = (totals, now = new Date()) => {
    const current = { ...normalizeTasbihTotals(totals) };
    delete current[getTasbihDateKey(now)];
    return current;
};

export const getTasbihTodayTotal = (totals, now = new Date()) =>
    clampTasbihCount(totals?.[getTasbihDateKey(now)]);

export const normalizeTasbihState = (raw) => {
    const hasTarget =
        raw && typeof raw === "object" && raw.target !== undefined;
    return {
        count: clampTasbihCount(raw?.count),
        target: hasTarget
            ? clampTasbihTarget(raw.target)
            : DEFAULT_TASBIH_TARGET,
        totals: normalizeTasbihTotals(raw?.totals),
    };
};

export const readTasbihState = async () =>
    normalizeTasbihState(await readPreference(TASBIH_PREFERENCE_KEY, null));

export const writeTasbihState = async (state) =>
    writePreference(TASBIH_PREFERENCE_KEY, normalizeTasbihState(state));
