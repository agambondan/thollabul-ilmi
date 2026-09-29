import { useMemo } from "react";
import { useLayoutModePreference } from "./useLayoutModePreference";
import { colors, getThemeColors } from "../theme";

export function useWebAppTheme() {
    const { isDarkTheme, isPaperLayout, isWebAppLayout } = useLayoutModePreference();

    const theme = useMemo(() => {
        const themeColors = getThemeColors({ isDark: isDarkTheme, isPaperLayout });
        return {
            ...themeColors,
            isDark: isDarkTheme,
            isPaper: isPaperLayout,
            isWebApp: isWebAppLayout,
            // Semantic aliases
            accentSoft: isDarkTheme ? "rgba(52, 211, 153, 0.12)" : "#d1fae5",
            borderMuted: isDarkTheme ? "#1e293b" : "#f1f5f9",
            cardBorder: themeColors.border,
            chipBg: isDarkTheme ? "#1e293b" : "#f1f5f9",
            chipText: isDarkTheme ? "#94a3b8" : "#64748b",
            dangerSoft: isDarkTheme ? "rgba(248, 113, 113, 0.15)" : "#fef2f2",
            heroBg: themeColors.surface,
            iconBoxBg: isDarkTheme ? "#1e293b" : "#f1f5f9",
            inputBorder: isDarkTheme ? "#334155" : "#cbd5e1",
            progressBg: isDarkTheme ? "#1e293b" : "#e2e8f0",
            ripple: isDarkTheme ? "#1f2937" : "#d1fae5",
            warningSoft: isDarkTheme ? "rgba(251, 191, 36, 0.15)" : "#fffbeb",
        };
    }, [isDarkTheme, isPaperLayout, isWebAppLayout]);

    return theme;
}
