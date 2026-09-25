import { StyleSheet } from "react-native";
import { getThemeColors } from "../../theme";

export const WEB_APP_EXPLORE_THEMES = {
    dark: {
        accent: "#34d399",
        accentSoft: "rgba(52, 211, 153, 0.12)",
        active: "#059669",
        bg: "#020617",
        border: "#243044",
        input: "#e2e8f0",
        muted: "#94a3b8",
        ripple: "#1f2937",
        surface: "#111827",
        text: "#cbd5e1",
        tile: "#1e293b",
        title: "#f8fafc",
    },
    light: {
        accent: "#047857",
        accentSoft: "#d1fae5",
        active: "#059669",
        bg: "#ffffff",
        border: "#e5e7eb",
        input: "#0f172a",
        muted: "#64748b",
        ripple: "#d1fae5",
        surface: "#ffffff",
        text: "#475569",
        tile: "#f8fafc",
        title: "#111827",
    },
};

export const getExploreWebAppTheme = (isDark = false) =>
    isDark ? WEB_APP_EXPLORE_THEMES.dark : WEB_APP_EXPLORE_THEMES.light;

export const createExploreWebAppThemeStyles = (theme) =>
    StyleSheet.create({
        backButton: {
            backgroundColor: theme.tile,
            borderColor: theme.border,
        },
        backText: { color: theme.accent },
        badge: { backgroundColor: theme.accentSoft, color: theme.accent },
        card: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        cardHeader: {
            borderBottomColor: theme.border,
        },
        cardMeta: { color: theme.muted },
        cardText: { color: theme.text },
        cardTitle: { color: theme.title },
        chip: { backgroundColor: theme.tile, borderColor: theme.border, color: theme.muted },
        chipText: { color: theme.muted },
        content: { backgroundColor: theme.bg },
        countBadge: {
            backgroundColor: theme.tile,
            borderColor: theme.border,
            color: theme.muted,
        },
        divider: { backgroundColor: theme.border },
        empty: { backgroundColor: theme.surface, borderColor: theme.border },
        emptyText: { color: theme.muted },
        emptyTitle: { color: theme.title },
        errorBox: {
            backgroundColor: theme.bg === "#ffffff" ? "#fef2f2" : "#3f1d1d",
            borderColor: theme.bg === "#ffffff" ? "#fecaca" : "#7f1d1d",
            color: theme.bg === "#ffffff" ? "#991b1b" : "#fecaca",
        },
        eyebrow: { color: theme.accent },
        groupCount: { color: theme.muted },
        groupHeader: {
            borderBottomColor: theme.border,
        },
        groupTitle: { color: theme.title },
        hero: { backgroundColor: theme.surface, borderColor: theme.border },
        iconBox: {
            backgroundColor: theme.tile,
            borderColor: theme.border,
        },
        iconWrap: { backgroundColor: theme.accentSoft },
        input: { color: theme.input },
        overlay: { backgroundColor: theme.bg },
        panel: { backgroundColor: theme.surface, borderColor: theme.border },
        pinButton: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        pinButtonActive: {
            backgroundColor: theme.active,
            borderColor: theme.accent,
        },
        progressFill: { backgroundColor: theme.accent },
        progressTrack: {
            backgroundColor: theme.tile,
            borderColor: theme.border,
        },
        root: { backgroundColor: theme.bg },
        search: { backgroundColor: theme.tile, borderColor: theme.accent },
        sectionMeta: { color: theme.muted },
        sectionTitle: { color: theme.accent },
        statCard: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        statLabel: { color: theme.muted },
        statNumber: { color: theme.title },
        stateBox: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        stateText: { color: theme.muted },
        statusDone: {
            backgroundColor: theme.accentSoft,
            borderColor: theme.accent,
            color: theme.accent,
        },
        statusProgress: {
            backgroundColor: theme.bg === "#ffffff" ? "#fef3c7" : "rgba(245, 158, 11, 0.12)",
            borderColor: theme.bg === "#ffffff" ? "#fbbf24" : "rgba(245, 158, 11, 0.32)",
            color: theme.bg === "#ffffff" ? "#b45309" : "#fbbf24",
        },
        statusUrgent: {
            backgroundColor: theme.bg === "#ffffff" ? "#fef2f2" : "rgba(248, 113, 113, 0.12)",
            borderColor: theme.bg === "#ffffff" ? "#fecaca" : "rgba(248, 113, 113, 0.32)",
            color: theme.bg === "#ffffff" ? "#991b1b" : "#fecaca",
        },
        subtitle: { color: theme.muted },
        summaryPill: { backgroundColor: theme.tile, borderColor: theme.border },
        summaryText: { color: theme.text },
        tag: {
            backgroundColor: theme.tile,
            borderColor: theme.border,
            color: theme.muted,
        },
        tile: { backgroundColor: theme.tile, borderColor: theme.border },
        tileSubtitle: { color: theme.text },
        tileTitle: { color: theme.title },
        title: { color: theme.title },
        todayPanel: {
            backgroundColor: theme.accentSoft,
            borderColor: theme.accent,
        },
        todayPanelDone: {
            backgroundColor: theme.bg === "#ffffff" ? "#d1fae5" : "rgba(52, 211, 153, 0.12)",
            borderColor: theme.bg === "#ffffff" ? "#a7f3d0" : "rgba(52, 211, 153, 0.32)",
        },
        todayTitle: { color: theme.title },
        todayText: { color: theme.muted },
    });
