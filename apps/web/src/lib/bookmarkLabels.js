// FE-only metadata layer untuk bookmark: color & label disimpan di localStorage,
// karena BE belum punya field Color/Label di model.Bookmark.
// Storage key: tholabul_bookmark_meta
// Format: { [`${refType}:${refId}`]: { color, label, updatedAt } }

const STORAGE_KEY = "tholabul_bookmark_meta";

export const normalizeBookmarkRefType = (refType) =>
    refType === "quran" ? "ayah" : refType;

export const BOOKMARK_COLORS = [
    {
        id: "emerald",
        tw: "bg-emerald-500",
        label_id: "Hijau",
        label_en: "Green",
    },
    { id: "amber", tw: "bg-amber-500", label_id: "Amber", label_en: "Amber" },
    { id: "sky", tw: "bg-sky-500", label_id: "Biru", label_en: "Blue" },
    { id: "rose", tw: "bg-rose-500", label_id: "Merah", label_en: "Red" },
    { id: "violet", tw: "bg-violet-500", label_id: "Ungu", label_en: "Purple" },
    { id: "gray", tw: "bg-gray-500", label_id: "Abu", label_en: "Gray" },
];

const safeRead = () => {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {};
    } catch {
        return {};
    }
};

const safeWrite = (data) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
};

export const getBookmarkMeta = (refType, refId) => {
    const all = safeRead();
    const rawKey = `${refType}:${refId}`;
    const normalizedKey = `${normalizeBookmarkRefType(refType)}:${refId}`;
    return all[rawKey] ?? all[normalizedKey] ?? null;
};

export const setBookmarkMeta = (refType, refId, meta) => {
    const all = safeRead();
    const key = `${normalizeBookmarkRefType(refType)}:${refId}`;
    all[key] = {
        ...(all[key] ?? {}),
        ...meta,
        updatedAt: new Date().toISOString(),
    };
    safeWrite(all);
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new StorageEvent("storage", {
                key: STORAGE_KEY,
                newValue: JSON.stringify(all),
            }),
        );
    }
};

export const clearBookmarkMeta = (refType, refId) => {
    const all = safeRead();
    delete all[`${refType}:${refId}`];
    delete all[`${normalizeBookmarkRefType(refType)}:${refId}`];
    safeWrite(all);
};

export const colorById = (id) =>
    BOOKMARK_COLORS.find((c) => c.id === id) ?? BOOKMARK_COLORS[0];
