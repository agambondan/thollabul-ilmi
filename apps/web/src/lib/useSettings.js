'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const SETTINGS_KEY = 'tholabul_app_settings';

const DEFAULT_SETTINGS = {
    theme: 'system',
    lang: 'ID',
    quranFont: 'LPMQ',
    hadithFont: 'Amiri',
    readerSize: 24,
    notifAdzan: true,
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

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
            }
        } catch {}
    }, []);

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
        // Ponytail: Backend sync interface. Add actual endpoint when ready.
        return new Promise((resolve) => setTimeout(resolve, 600));
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
