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
    preloadAdminDictionary: () => Promise.resolve(),
    isAdminDictionaryReady: false,
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

/*
 * Admin strings (~330 keys, one per every CRUD screen in /admin) are their
 * own chunk for the same reason: nobody outside the admin panel ever needs
 * them, so they should not sit in every public and dashboard page's bundle.
 * `t()` below checks these dictionaries after the main ones, so a lookup
 * before this has loaded just falls through — see `preloadAdminDictionary`.
 */
const adminDictionaries = {};
let adminIndonesianRequest = null;
let adminEnglishRequest = null;

const loadAdminIndonesian = () => {
    adminIndonesianRequest =
        adminIndonesianRequest ??
        import("@/lib/i18n/id-admin").then((mod) => {
            adminDictionaries.ID = mod.default;
            return mod.default;
        });
    return adminIndonesianRequest;
};

const loadAdminEnglish = () => {
    adminEnglishRequest =
        adminEnglishRequest ??
        import("@/lib/i18n/en-admin").then((mod) => {
            adminDictionaries.EN = mod.default;
            return mod.default;
        });
    return adminEnglishRequest;
};

export function LocaleProvider({ children, initialLang }) {
    // Stays "ID" for the first render on purpose: the server prerenders in
    // Indonesian, so seeding from localStorage here would be a hydration
    // mismatch. Removing the brief flash for English readers needs the
    // language to reach the server (a cookie), which is a separate change.
    const [lang, setLangState] = useState(() =>
        initialLang === "EN" ? "EN" : "ID",
    );
    const [, setDictVersion] = useState(0);
    const [isAdminDictionaryReady, setIsAdminDictionaryReady] = useState(false);

    useEffect(() => {
        if (initialLang && initialLang !== lang) {
            setLangState(initialLang === "EN" ? "EN" : "ID");
            return;
        }
        const stored = readStoredLang();
        if (stored !== lang) setLangState(stored);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialLang]);

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
        // Mirror the choice to a cookie so subsequent server renders match the
        // language choice without a flash. Best-effort.
        try {
            fetch("/api/locale", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lang: upper }),
            });
        } catch {}
    }, []);

    // Called once from app/admin/layout.js. Both languages are fetched
    // together (rather than only the active one, as the main EN split does)
    // because the admin panel already gates its first paint on an auth check
    // — piggybacking the dictionary load onto that existing spinner means a
    // language switch inside admin never has to show a second loading state.
    const preloadAdminDictionary = useCallback(() => {
        if (adminDictionaries.ID && adminDictionaries.EN) {
            setIsAdminDictionaryReady(true);
            return Promise.resolve();
        }
        return Promise.all([loadAdminIndonesian(), loadAdminEnglish()]).then(
            () => {
                setIsAdminDictionaryReady(true);
                setDictVersion((v) => v + 1);
            },
        );
    }, []);

    const t = useCallback(
        (key, fallbackOrVars, maybeVars) => {
            const hasFallback = typeof fallbackOrVars === "string";
            const vars = hasFallback ? maybeVars : fallbackOrVars;
            const text =
                dictionaries[lang]?.[key] ??
                adminDictionaries[lang]?.[key] ??
                dictionaries.ID[key] ??
                adminDictionaries.ID?.[key] ??
                (hasFallback ? fallbackOrVars : undefined);
            if (!vars || typeof text !== "string") return text;

            return Object.entries(vars).reduce(
                (next, [name, value]) =>
                    next.replaceAll(`{${name}}`, String(value ?? "")),
                text,
            );
        },
        // `dictionaries.EN` / `adminDictionaries.*` are filled in
        // asynchronously; setDictVersion above is what re-runs this once a
        // chunk lands.
        [lang],
    );

    return (
        <LocaleContext.Provider
            value={{
                lang,
                setLang,
                t,
                preloadAdminDictionary,
                isAdminDictionaryReady,
            }}
        >
            {children}
        </LocaleContext.Provider>
    );
}

export const useLocale = () => useContext(LocaleContext);
