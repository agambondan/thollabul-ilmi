import { StyleSheet } from "react-native";

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

export const createExploreWebAppThemeStyles = (theme) =>
    StyleSheet.create({
        badge: { backgroundColor: theme.accentSoft, color: theme.accent },
        content: { backgroundColor: theme.bg },
        empty: { backgroundColor: theme.surface, borderColor: theme.border },
        emptyText: { color: theme.muted },
        emptyTitle: { color: theme.title },
        eyebrow: { color: theme.accent },
        hero: { backgroundColor: theme.surface, borderColor: theme.border },
        iconWrap: { backgroundColor: theme.accentSoft },
        input: { color: theme.input },
        pinButton: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        pinButtonActive: {
            backgroundColor: theme.active,
            borderColor: theme.accent,
        },
        root: { backgroundColor: theme.bg },
        search: { backgroundColor: theme.tile, borderColor: theme.accent },
        sectionMeta: { color: theme.muted },
        sectionTitle: { color: theme.accent },
        subtitle: { color: theme.muted },
        tile: { backgroundColor: theme.tile, borderColor: theme.border },
        tileSubtitle: { color: theme.text },
        tileTitle: { color: theme.title },
        title: { color: theme.title },
    });
