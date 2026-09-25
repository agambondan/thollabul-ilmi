import { StyleSheet } from "react-native";
import { getThemeColors } from "../theme";

export const getQuranWebAppTheme = (isDark = false) => {
    const t = getThemeColors({ isDark, isPaperLayout: false });
    return {
        accent: t.primary,
        accentBg: t.primaryBg,
        bg: t.bg,
        border: t.border,
        ctaBorder: t.borderSoft,
        input: t.ink,
        muted: isDark ? t.muted : "#64748b",
        readerBg: isDark ? t.bg : t.surfaceMuted,
        searchBorder: t.borderStrong,
        surface: t.surface,
        text: t.text,
        title: t.title,
    };
};

export const WEB_APP_QURAN_THEMES = {
    dark: getQuranWebAppTheme(true),
    light: getQuranWebAppTheme(false),
};

export const createQuranWebAppThemeStyles = (theme) =>
    StyleSheet.create({
        quranScroll: { backgroundColor: theme.bg },
        quranListContent: { backgroundColor: theme.bg },
        readerList: { backgroundColor: theme.readerBg },
        readerListContent: { backgroundColor: theme.readerBg },
        mushafScrollContent: { backgroundColor: theme.readerBg },
        readerHeader: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        readerEyebrow: { color: theme.accent },
        readerTitle: { color: theme.title },
        readerSubtitle: { color: theme.muted },
        readerArabicTitle: { color: theme.title },
        readerBismillah: { color: theme.text },
        surahPagerButton: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        surahPagerButtonText: { color: theme.accent },
        quranArabicTitle: { color: theme.accent },
        quranTitle: { color: theme.title },
        quranSubtitle: { color: theme.muted },
        quranSearch: {
            backgroundColor: theme.surface,
            borderColor: theme.searchBorder,
        },
        quranSearchInput: { color: theme.input },
        mushafCta: {
            backgroundColor: theme.readerBg,
            borderColor: theme.ctaBorder,
        },
        mushafCtaText: { color: theme.accent },
        surahRow: { backgroundColor: theme.surface, borderColor: theme.border },
        surahNumberBadge: { backgroundColor: theme.accentBg },
        surahNumberText: { color: theme.accent },
        surahName: { color: theme.title },
        surahMeta: { color: theme.muted },
        surahArabic: { color: theme.text },
        message: { color: theme.accent },
        detailSurface: { backgroundColor: theme.readerBg },
    });
