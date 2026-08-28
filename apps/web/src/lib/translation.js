export const normalizeLang = (lang) => String(lang ?? "ID").toUpperCase();

const firstText = (value, keys) => {
    for (const key of keys) {
        const next = value?.[key];
        if (typeof next === "string" && next.trim()) return next;
    }
    return "";
};

export const getLocalizedText = (value, lang = "ID") => {
    if (!value) return "";
    if (typeof value === "string") return value;

    const isEnglish = normalizeLang(lang) === "EN";
    const primaryKeys = isEnglish
        ? ["en", "english", "latin_en", "name_en", "title_en"]
        : ["idn", "id", "indonesian", "translation", "name_id", "title_id"];
    const fallbackKeys = isEnglish
        ? [
              "idn",
              "id",
              "indonesian",
              "translation",
              "latin_en",
              "name",
              "title",
              "label",
              "value",
          ]
        : ["en", "english", "latin_en", "name", "title", "label", "value"];

    return firstText(value, primaryKeys) || firstText(value, fallbackKeys);
};

export const getLocalizedTranslation = getLocalizedText;

const localizedFieldKeys = (field, lang = "ID") => {
    const isEnglish = normalizeLang(lang) === "EN";
    const primarySuffixes = isEnglish
        ? ["en", "english"]
        : ["idn", "id", "indonesian"];
    const fallbackSuffixes = isEnglish
        ? ["idn", "id", "indonesian"]
        : ["en", "english"];

    return [
        ...primarySuffixes.map((suffix) => `${field}_${suffix}`),
        ...primarySuffixes.map(
            (suffix) =>
                `${field}${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`,
        ),
        field,
        ...fallbackSuffixes.map((suffix) => `${field}_${suffix}`),
        ...fallbackSuffixes.map(
            (suffix) =>
                `${field}${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`,
        ),
    ];
};

export const getLocalizedField = (
    source,
    field,
    lang = "ID",
    fallbackFields = [],
) => {
    if (!source) return "";

    for (const key of localizedFieldKeys(field, lang)) {
        const value = source?.[key];
        const text = getLocalizedText(value, lang);
        if (text) return text;
    }

    for (const container of [
        "translation",
        "translations",
        "locale",
        "locales",
    ]) {
        const nested = source?.[container];
        if (!nested || typeof nested !== "object") continue;

        for (const key of localizedFieldKeys(field, lang)) {
            const value = nested?.[key];
            const text = getLocalizedText(value, lang);
            if (text) return text;
        }

        const genericText = getLocalizedText(nested, lang);
        if (genericText) return genericText;
    }

    for (const fallbackField of fallbackFields) {
        const text = getLocalizedField(source, fallbackField, lang);
        if (text) return text;
    }

    return "";
};

export const getLocalizedOption = (option, lang = "ID") =>
    getLocalizedText(option, lang) || getLocalizedField(option, "text", lang);
