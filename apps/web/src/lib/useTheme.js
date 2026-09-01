"use client";

import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "theme";
const THEME_EVENT = "tholabul:theme";

export const readStoredTheme = () => {
    if (typeof window === "undefined") return false;
    try {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === "dark") return true;
        if (stored === "light") return false;
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
        return false;
    }
};

const applyTheme = (dark) => {
    document.documentElement.classList.toggle("dark", dark);
};

/**
 * Single source of truth for dark mode.
 *
 * This logic used to exist four times over (Navbar, the dashboard layout, the
 * admin layout and the settings page), each with its own state, so toggling in
 * one place left the others stale until a reload. The inline script in the
 * root layout applies the stored value before first paint; this hook keeps
 * React in step with it and broadcasts changes to every other mounted copy.
 */
export const useTheme = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const sync = () => setIsDark(readStoredTheme());
        sync();

        // `storage` fires for other tabs; the custom event covers this one.
        window.addEventListener("storage", sync);
        window.addEventListener(THEME_EVENT, sync);
        return () => {
            window.removeEventListener("storage", sync);
            window.removeEventListener(THEME_EVENT, sync);
        };
    }, []);

    const setTheme = useCallback((dark) => {
        try {
            localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
        } catch {}
        applyTheme(dark);
        setIsDark(dark);
        window.dispatchEvent(new Event(THEME_EVENT));
    }, []);

    const toggleTheme = useCallback(
        () => setTheme(!readStoredTheme()),
        [setTheme],
    );

    return { isDark, setTheme, toggleTheme };
};
