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

export const ADZAN_SOUNDS = [
    { value: "default", label: "Default Aplikasi", src: "/audio/adzan.mp3" },
    {
        value: "islamcan",
        label: "IslamCan Azan 1",
        src: "https://www.islamcan.com/audio/adzan/azan1.mp3",
    },
];

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
    return next;
};

const DEFAULT_SETTINGS = {
    theme: "system",
    lang: "ID",
    quranFont: "LPMQ",
    hadithFont: "Amiri",
    readerSize: 24,
    notifAdzan: true,
    adzanSound: "default",
    adzanSoundUrl: "",
    adzanSoundLabel: "Default Aplikasi",
    adzanReminderLead: 10,
    adzanReminderLeadByPrayer: {},
    notifKajian: true,
    prayerMethod: DEFAULT_PRAYER_METHOD,
    prayerMadhab: DEFAULT_PRAYER_MADHAB,
    highContrast: false,
    reduceMotion: false,
    autoSync: false,
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
        return raw
            ? { ...DEFAULT_SETTINGS, ...sanitizeSettings(JSON.parse(raw)) }
            : DEFAULT_SETTINGS;
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

    const getLeadForPrayer = useCallback(
        (key) => {
            const perPrayer = settings?.adzanReminderLeadByPrayer;
            if (
                perPrayer &&
                Object.prototype.hasOwnProperty.call(perPrayer, key)
            ) {
                const v = perPrayer[key];
                if (REMINDER_LEAD_KEYS.includes(v)) return v;
            }
            const g = settings?.adzanReminderLead;
            return REMINDER_LEAD_KEYS.includes(g) ? g : 10;
        },
        [settings?.adzanReminderLead, settings?.adzanReminderLeadByPrayer],
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
