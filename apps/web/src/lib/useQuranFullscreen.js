"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSettings } from "./useSettings";

const isQuranPath = (pathname) =>
    pathname === "/quran" ||
    pathname === "/dashboard/quran" ||
    pathname?.startsWith("/quran/") ||
    pathname?.startsWith("/dashboard/quran/");

/*
 * Quran-only fullscreen: when the user toggles it on while reading a surah
 * we hide the public navbar, footer, and mobile tab bar and tighten the
 * top/bottom padding. The setting persists via useSettings so it survives
 * navigation between surahs and page reloads, and reverts automatically
 * when the user navigates to a non-Quran route.
 */
export const useQuranFullscreen = () => {
    const pathname = usePathname();
    const { settings, updateSetting } = useSettings();
    const quranFullscreen = !!settings?.quranFullscreen;
    const isFullscreen = isQuranPath(pathname) && quranFullscreen;

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.body.classList.toggle("quran-fullscreen", isFullscreen);
        return () => {
            document.body.classList.remove("quran-fullscreen");
        };
    }, [isFullscreen]);

    return {
        isFullscreen,
        quranFullscreen,
        toggle: () => updateSetting("quranFullscreen", !quranFullscreen),
    };
};
