import { idn } from "./locales/idn.js";

let en = null;
const getEn = () => {
    if (!en) {
        en = require("./locales/en.js").en;
    }
    return en;
};

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
    const dict = normalizedLanguage === "en" ? getEn() : idn;
    const text = dict?.[key] ?? idn?.[key] ?? key;

    if (!values || typeof text !== "string") return text;
    return text.replace(
        interpolationPattern,
        (_, token) => `${values[token] ?? ""}`,
    );
};

export const mobileTranslationKeys = Object.freeze(Object.keys(idn));
