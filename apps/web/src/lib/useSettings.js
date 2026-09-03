"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

import { authFetch } from "./api";
import { useAuth } from "@/context/Auth";
import {
    DEFAULT_PRAYER_MADHAB,
    DEFAULT_PRAYER_METHOD,
    normalizePrayerMadhab,
    normalizePrayerMethod,
} from "./prayerTimes";

const SETTINGS_KEY = "tholabul_app_settings";

const ADZAN_AUDIO_CDN =
    "https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/";

export const ADZAN_SOUNDS = [
    {
        value: "default",
        label: "Default Aplikasi",
        qari: "Adzan Masjidil Haram",
        region: "Makkah Al-Mukarramah",
        src: "/audio/adzan.mp3",
    },
    {
        value: "mishary-alafasy",
        label: "Mishary Rashid Al-Afasy",
        qari: "Syaikh Mishary Rashid Al-Afasy",
        region: "Kuwait",
        src: `${ADZAN_AUDIO_CDN}mishary-alafasy-01.mp3`,
    },
    {
        value: "mansour-al-zahrani",
        label: "Mansour Al-Zahrani",
        qari: "Syaikh Mansour Al-Zahrani",
        region: "Arab Saudi",
        src: `${ADZAN_AUDIO_CDN}mansour-al-zahrani-01.mp3`,
    },
    {
        value: "nasser-al-qatami",
        label: "Nasser Al-Qatami",
        qari: "Syaikh Nasser Al-Qatami",
        region: "Arab Saudi",
        src: `${ADZAN_AUDIO_CDN}nasser-al-qatami-01.mp3`,
    },
    {
        value: "abdul-basit",
        label: "Abdul Basit Abdul Samad",
        qari: "Syaikh Abdul Basit Abdul Samad",
        region: "Mesir",
        src: `${ADZAN_AUDIO_CDN}abdul-basit-abdul-samad-01.mp3`,
    },
    {
        value: "islam-sobhi",
        label: "Islam Sobhi",
        qari: "Syaikh Islam Sobhi",
        region: "Mesir",
        src: `${ADZAN_AUDIO_CDN}islam-sobhi-01.mp3`,
    },
    {
        value: "makkah-haram",
        label: "Adzan Masjidil Haram",
        qari: "Muadzin Resmi Masjidil Haram",
        region: "Makkah Al-Mukarramah",
        src: `${ADZAN_AUDIO_CDN}makkah-haram-02.mp3`,
    },
    {
        value: "madinah",
        label: "Adzan Masjid Nabawi",
        qari: "Muadzin Resmi Masjid Nabawi",
        region: "Madinah Al-Munawwarah",
        src: `${ADZAN_AUDIO_CDN}madinah-02.mp3`,
    },
    {
        value: "al-aqsa",
        label: "Adzan Masjid Al-Aqsha",
        qari: "Muadzin Masjid Al-Aqsha",
        region: "Yerusalem",
        src: `${ADZAN_AUDIO_CDN}al-aqsa-jerusalem-01.mp3`,
    },
];

/*
 * Reading preferences live here (and therefore sync to the account) rather
 * than in useQuranFont's private localStorage keys. The old split meant the
 * Settings page wrote `quranFont`/`readerSize` to the server while every
 * reader read different keys, so nothing the user changed there had any
 * effect.
 */
const LEGACY_FONT_KEYS = {
    quranFontId: "quranFont",
    quranArabicSize: "quranArabicFontSize",
    quranTranslationSize: "quranTranslationFontSize",
};

// Values the old Settings dropdown could store, mapped onto the ids the
// readers actually understand.
const LEGACY_FONT_NAME_MAP = {
    LPMQ: "lpmq",
    Amiri: "naskh",
    Scheherazade: "naskh",
    Kitab: "kitab",
    Indopak: "indopak",
};

const REMINDER_LEAD_KEYS = [0, 5, 10, 15, 30];
const REMINDER_PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const sanitizeSettings = (raw) => {
    if (!raw || typeof raw !== "object") return {};
    const next = { ...raw };
    if (!REMINDER_LEAD_KEYS.includes(next.adzanReminderLead)) {
        next.adzanReminderLead = 10;
    }
    if (
        next.adzanReminderLeadByPrayer &&
        typeof next.adzanReminderLeadByPrayer === "object"
    ) {
        next.adzanReminderLeadByPrayer = Object.fromEntries(
            Object.entries(next.adzanReminderLeadByPrayer).filter(
                ([key, value]) =>
                    REMINDER_PRAYER_KEYS.includes(key) &&
                    REMINDER_LEAD_KEYS.includes(value),
            ),
        );
    } else {
        next.adzanReminderLeadByPrayer = {};
    }
    next.prayerMethod = normalizePrayerMethod(next.prayerMethod);
    next.prayerMadhab = normalizePrayerMadhab(next.prayerMadhab);

    // Fold the pre-split font settings forward so a returning user keeps the
    // face and size they had picked.
    if (!next.quranFontId && next.quranFont) {
        next.quranFontId = LEGACY_FONT_NAME_MAP[next.quranFont] ?? "lpmq";
    }
    if (
        !Number.isFinite(next.quranArabicSize) &&
        Number.isFinite(next.readerSize)
    ) {
        next.quranArabicSize = next.readerSize;
    }
    delete next.quranFont;
    delete next.readerSize;
    delete next.hadithFont;
    delete next.autoSync;
    delete next.notifKajian;
    return next;
};

/**
 * One-time import of the reader's own localStorage keys, written before these
 * preferences moved into the synced settings object.
 */
const readLegacyFontKeys = () => {
    if (typeof window === "undefined") return {};
    const out = {};
    try {
        const font = localStorage.getItem(LEGACY_FONT_KEYS.quranFontId);
        if (font) out.quranFontId = font;
        const arabic = Number.parseInt(
            localStorage.getItem(LEGACY_FONT_KEYS.quranArabicSize) ?? "",
            10,
        );
        if (Number.isFinite(arabic)) out.quranArabicSize = arabic;
        const translation = Number.parseInt(
            localStorage.getItem(LEGACY_FONT_KEYS.quranTranslationSize) ?? "",
            10,
        );
        if (Number.isFinite(translation))
            out.quranTranslationSize = translation;
    } catch {}
    return out;
};

const DEFAULT_SETTINGS = {
    theme: "system",
    lang: "ID",
    quranFontId: "lpmq",
    quranArabicSize: 40,
    quranTranslationSize: 16,
    notifAdzan: true,
    adzanSound: "default",
    adzanSoundUrl: "",
    adzanSoundLabel: ADZAN_SOUNDS[0].label,
    adzanReminderLead: 10,
    adzanReminderLeadByPrayer: {},
    prayerMethod: DEFAULT_PRAYER_METHOD,
    prayerMadhab: DEFAULT_PRAYER_MADHAB,
    highContrast: false,
    reduceMotion: false,
};

const SettingsContext = createContext({
    settings: DEFAULT_SETTINGS,
    updateSetting: () => {},
    saveAll: () => {},
    syncWithBackend: async () => {},
    getLeadForPrayer: () => 10,
});

const readStoredSettings = () => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const stored = raw ? sanitizeSettings(JSON.parse(raw)) : {};
        return { ...DEFAULT_SETTINGS, ...readLegacyFontKeys(), ...stored };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

const writeStoredSettings = (next) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {}
};

export const SettingsProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [settings, setSettings] = useState(readStoredSettings);
    const hasHydratedRemoteRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) {
            hasHydratedRemoteRef.current = false;
            return;
        }

        if (hasHydratedRemoteRef.current) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await authFetch("/api/v1/settings");
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const raw = data?.data?.settings ?? data?.settings;
                if (typeof raw !== "string" || !raw) return;
                const parsed = JSON.parse(raw);
                if (cancelled) return;
                setSettings((prev) => {
                    const next = { ...prev, ...sanitizeSettings(parsed) };
                    writeStoredSettings(next);
                    return next;
                });
            } catch {
            } finally {
                if (!cancelled) hasHydratedRemoteRef.current = true;
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    // highContrast and reduceMotion were dead settings — declared, stored, and
    // never consulted. They now drive root classes that globals.css hooks into.
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("high-contrast", !!settings.highContrast);
        root.classList.toggle("reduce-motion", !!settings.reduceMotion);
    }, [settings.highContrast, settings.reduceMotion]);

    const syncSettingsWithBackend = async (nextSettings) => {
        const res = await authFetch("/api/v1/settings", {
            method: "PUT",
            body: JSON.stringify({ settings: JSON.stringify(nextSettings) }),
        });
        if (!res.ok) throw new Error("Settings sync failed");
        return res.json();
    };

    const updateSetting = (key, value) => {
        setSettings((prev) => {
            const next = { ...prev, [key]: value };
            writeStoredSettings(next);
            if (isAuthenticated) syncSettingsWithBackend(next).catch(() => {});
            return next;
        });
    };

    const saveAll = (newSettings) => {
        const next = { ...settings, ...newSettings };
        setSettings(next);
        writeStoredSettings(next);
    };

    const syncWithBackend = () => syncSettingsWithBackend(settings);

    const perPrayerLead = settings?.adzanReminderLeadByPrayer;
    const globalLead = settings?.adzanReminderLead;

    const getLeadForPrayer = useCallback(
        (key) => {
            if (
                perPrayerLead &&
                Object.prototype.hasOwnProperty.call(perPrayerLead, key)
            ) {
                const v = perPrayerLead[key];
                if (REMINDER_LEAD_KEYS.includes(v)) return v;
            }
            return REMINDER_LEAD_KEYS.includes(globalLead) ? globalLead : 10;
        },
        [globalLead, perPrayerLead],
    );

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSetting,
                saveAll,
                syncWithBackend,
                getLeadForPrayer,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
