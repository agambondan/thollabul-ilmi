"use client";

import { createContext, useContext, useState } from "react";

import { authFetch } from "./api";

const SETTINGS_KEY = "tholabul_app_settings";

export const ADZAN_SOUNDS = [
    { value: "default", label: "Default Aplikasi", src: "/audio/adzan.mp3" },
    {
        value: "islamcan",
        label: "IslamCan Azan 1",
        src: "https://www.islamcan.com/audio/adzan/azan1.mp3",
    },
];

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
    notifKajian: true,
    highContrast: false,
    reduceMotion: false,
    autoSync: false,
};

const SettingsContext = createContext({
    settings: DEFAULT_SETTINGS,
    updateSetting: () => {},
    saveAll: () => {},
    syncWithBackend: async () => {},
});

const readStoredSettings = () => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw
            ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
            : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(readStoredSettings);

    const updateSetting = (key, value) => {
        setSettings((prev) => {
            const next = { ...prev, [key]: value };
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const saveAll = (newSettings) => {
        const next = { ...settings, ...newSettings };
        setSettings(next);
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        } catch {}
    };

    const syncWithBackend = async () => {
        try {
            const res = await authFetch("/api/v1/settings", {
                method: "PUT",
                body: JSON.stringify({ settings: JSON.stringify(settings) }),
            });
            if (res.ok) {
                // sync success
                const data = await res.json();
                return data;
            }
        } catch (e) {
            console.error("Settings sync failed", e);
            throw e;
        }
    };

    return (
        <SettingsContext.Provider
            value={{ settings, updateSetting, saveAll, syncWithBackend }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
