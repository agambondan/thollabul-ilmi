import { normalizeSearchText, titleCaseLabel } from "../ExploreScreen.helpers";

export const REFERENCE_LIST_SEARCH_DEBOUNCE_MS = 300;

export const CLASSIC_REFERENCE_LIST_FEATURE_KEYS = new Set([
    "doa",
    "dzikir",
    "wirid",
    "asmaul-husna",
    "panduan-sholat",
    "sejarah",
    "manasik",
    "jarh-tadil",
    "perawi",
]);

export function isClassicReferenceListFeature(feature) {
    return Boolean(
        feature?.type === "list" &&
        CLASSIC_REFERENCE_LIST_FEATURE_KEYS.has(feature?.key),
    );
}

const CATEGORY_ALIASES = {
    dzikir_umum: "umum",
};

const REFERENCE_LIST_CONFIGS = {
    dzikir: {
        categories: [
            "pagi",
            "petang",
            "setelah_sholat",
            "tidur",
            "safar",
            "umum",
        ],
        placeholder: "Cari dzikir, sumber, atau kategori...",
        unit: "dzikir",
    },
    wirid: {
        categories: ["pagi", "petang", "setelah_sholat", "tidur", "umum"],
        placeholder: "Cari wirid, waktu, atau sumber...",
        unit: "wirid",
    },
    "asmaul-husna": {
        categories: [],
        placeholder: "Cari nama Allah, arti, atau transliterasi...",
        unit: "nama",
    },
    "panduan-sholat": {
        categories: [],
        placeholder: "Cari tata cara, bacaan, atau dalil...",
        unit: "panduan",
    },
    sejarah: {
        categories: [
            "khulafa",
            "dinasti",
            "peristiwa",
            "perang",
            "ulama",
            "nabi",
            "modern",
            "umum",
        ],
        placeholder: "Cari peristiwa, tokoh, atau tahun...",
        unit: "peristiwa",
    },
    manasik: {
        categories: ["haji", "umrah"],
        placeholder: "Cari langkah haji atau umrah...",
        unit: "langkah",
    },
    "jarh-tadil": {
        categories: ["tadil", "jarh"],
        placeholder: "Cari perawi, penilai, atau tingkat...",
        unit: "penilaian",
    },
    perawi: {
        categories: [
            "sahabat",
            "tabiin",
            "tabiut_tabiin",
            "atbaut_tabiin",
            "tabaqah_5",
            "tabaqah_6",
            "tabaqah_7",
        ],
        placeholder: "Cari perawi, kunyah, atau tabaqah...",
        unit: "perawi",
    },
};

const DOA_CATEGORIES = [
    { value: "pagi", label: "Pagi" },
    { value: "petang", label: "Petang" },
    { value: "makan", label: "Makan" },
    { value: "tidur", label: "Tidur" },
    { value: "bangun", label: "Bangun" },
    { value: "kamar_mandi", label: "Kamar mandi" },
    { value: "masjid", label: "Masjid" },
    { value: "safar", label: "Safar" },
    { value: "belajar", label: "Belajar" },
    { value: "umum", label: "Umum" },
];

const DOA_CATEGORY_TITLE_PATTERNS = {
    bangun: /\bbangun\b/,
};

const DOA_SEARCH_PLACEHOLDER = "Cari doa, kategori, atau sumber...";
const DEFAULT_SEARCH_PLACEHOLDER = "Cari data...";

const getRaw = (item) => item?.raw ?? {};

const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim()) ?? "";

const toStr = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return pickText(value.name, value.title, value.label, value.value);
};

const toSlug = (value) =>
    toStr(value).toLowerCase().replace(/\s+/g, "_").trim();

const canonicalCategory = (value) => CATEGORY_ALIASES[value] ?? value;

const getGenericItemCategory = (item) => {
    const raw = getRaw(item);
    return canonicalCategory(
        toSlug(
            raw.category ??
                raw.jenis_nilai ??
                raw.tabaqah ??
                raw.tingkat ??
                raw.type ??
                raw.occasion,
        ),
    );
};

const getDoaCategory = (item) => getRaw(item)?.category ?? "";

const doaCategoryMatches = (item, category) => {
    if (!category) return true;
    if (getDoaCategory(item) === category) return true;
    const pattern = DOA_CATEGORY_TITLE_PATTERNS[category];
    if (!pattern) return false;
    return [item?.title, getRaw(item).title].some(
        (title) => title && pattern.test(normalizeSearchText(title)),
    );
};

export function getReferenceListCategoryOptions(featureKey, items = []) {
    if (featureKey === "doa") return DOA_CATEGORIES;
    const config = REFERENCE_LIST_CONFIGS[featureKey];
    const seen = new Set();
    return [...(config?.categories ?? []), ...items.map(getGenericItemCategory)]
        .filter(Boolean)
        .filter((value) => {
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        })
        .map((value) => ({ value, label: titleCaseLabel(value) }));
}

export function getReferenceListUnit(featureKey) {
    if (featureKey === "doa") return "doa";
    return REFERENCE_LIST_CONFIGS[featureKey]?.unit ?? "item";
}

export function getReferenceListSearchPlaceholder(featureKey) {
    if (featureKey === "doa") return DOA_SEARCH_PLACEHOLDER;
    return (
        REFERENCE_LIST_CONFIGS[featureKey]?.placeholder ??
        DEFAULT_SEARCH_PLACEHOLDER
    );
}

const getItemSearchHaystack = (item) => {
    const raw = getRaw(item);
    return [
        item?.title,
        item?.body,
        item?.arabic,
        item?.meta,
        raw?.translation?.latin_idn,
        raw?.translation?.latin_en,
        raw?.translation?.text_idn,
        raw?.translation?.text_en,
        raw?.transliteration,
        raw?.indonesian,
        raw?.english,
        raw?.source,
        raw?.sumber,
    ]
        .filter(Boolean)
        .join(" ");
};

export function filterReferenceListItems(
    featureKey,
    items = [],
    { search = "", category = "" } = {},
) {
    const query = normalizeSearchText(search);
    return items.filter((item) => {
        const matchesCategory =
            featureKey === "doa"
                ? doaCategoryMatches(item, category)
                : !category || getGenericItemCategory(item) === category;
        if (!matchesCategory) return false;
        if (!query) return true;
        return normalizeSearchText(getItemSearchHaystack(item)).includes(query);
    });
}
