import { en } from "./locales/en.js";
import { idn } from "./locales/idn.js";

export const mobileLanguages = {
    en: "en",
    EN: "en",
    english: "en",
    id: "idn",
    ID: "idn",
    idn: "idn",
    IDN: "idn",
    indonesia: "idn",
    indonesian: "idn",
};

export const defaultMobileLanguage = mobileLanguages.idn;

const dictionaries = {
    idn,
    en,
};

const interpolationPattern = /\{(\w+)\}/g;

export const normalizeMobileLanguage = (language) => {
    const key = `${language ?? ""}`.trim();
    if (!key) return defaultMobileLanguage;
    return (
        mobileLanguages[key] ??
        mobileLanguages[key.toLowerCase()] ??
        defaultMobileLanguage
    );
};

export const translateMobile = (language, key, values) => {
    const normalizedLanguage = normalizeMobileLanguage(language);
    const text =
        dictionaries[normalizedLanguage]?.[key] ??
        dictionaries[defaultMobileLanguage]?.[key] ??
        key;

    if (!values || typeof text !== "string") return text;
    return text.replace(
        interpolationPattern,
        (_, token) => `${values[token] ?? ""}`,
    );
};

export const mobileTranslationKeys = Object.freeze(
    Object.keys(dictionaries[defaultMobileLanguage]),
);
