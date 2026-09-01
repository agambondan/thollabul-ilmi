"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import id from "@/lib/i18n/id";

const LocaleContext = createContext({
    lang: "ID",
    setLang: () => {},
    t: (k, fallbackOrVars) =>
        typeof fallbackOrVars === "string" ? fallbackOrVars : undefined,
});

const readStoredLang = () => {
    if (typeof window === "undefined") return "ID";
    try {
        const saved = localStorage.getItem("lang")?.toUpperCase();
        return saved === "EN" ? "EN" : "ID";
    } catch {
        return "ID";
    }
};

/*
 * Indonesian is the default and ships with the app; English is a separate
 * chunk fetched only when a reader actually selects it. Bundling both put a
 * ~167 KB dictionary on the critical path of every page for text that is
 * almost entirely unused by the page being opened.
 */
const dictionaries = { ID: id };
let englishRequest = null;

const loadEnglish = () => {
    englishRequest =
        englishRequest ??
        import("@/lib/i18n/en").then((mod) => {
            dictionaries.EN = mod.default;
            return mod.default;
        });
    return englishRequest;
};

export function LocaleProvider({ children }) {
    // Stays "ID" for the first render on purpose: the server prerenders in
    // Indonesian, so seeding from localStorage here would be a hydration
    // mismatch. Removing the brief flash for English readers needs the
    // language to reach the server (a cookie), which is a separate change.
    const [lang, setLangState] = useState("ID");
    const [, setDictVersion] = useState(0);

    useEffect(() => {
        const stored = readStoredLang();
        if (stored !== "ID") setLangState(stored);
    }, []);

    useEffect(() => {
        if (lang !== "EN" || dictionaries.EN) return;
        let cancelled = false;
        loadEnglish().then(() => {
            if (!cancelled) setDictVersion((v) => v + 1);
        });
        return () => {
            cancelled = true;
        };
    }, [lang]);

    const setLang = useCallback((l) => {
        const upper = String(l).toUpperCase() === "EN" ? "EN" : "ID";
        if (upper === "EN") loadEnglish();
        setLangState(upper);
        try {
            localStorage.setItem("lang", upper);
        } catch {}
        if (typeof document !== "undefined") {
            document.documentElement.lang = upper === "EN" ? "en" : "id";
        }
    }, []);

    const t = useCallback(
        (key, fallbackOrVars, maybeVars) => {
            const hasFallback = typeof fallbackOrVars === "string";
            const vars = hasFallback ? maybeVars : fallbackOrVars;
            const text =
                dictionaries[lang]?.[key] ??
                dictionaries.ID[key] ??
                (hasFallback ? fallbackOrVars : undefined);
            if (!vars || typeof text !== "string") return text;

            return Object.entries(vars).reduce(
                (next, [name, value]) =>
                    next.replaceAll(`{${name}}`, String(value ?? "")),
                text,
            );
        },
        // `dictionaries.EN` is filled in asynchronously; setDictVersion above
        // is what re-runs this once the English chunk lands.
        [lang],
    );

    return (
        <LocaleContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LocaleContext.Provider>
    );
}

export const useLocale = () => useContext(LocaleContext);
