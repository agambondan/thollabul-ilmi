import { Platform, StyleSheet, Text, View } from "react-native";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { colors, getThemeColors, radius, shadows, spacing } from "../theme";

export function Card({ children, style }) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

export function CardTitle({ children, meta, metaStyle, style, titleStyle }) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View style={[styles.titleRow, style]}>
            <Text style={[styles.title, { color: theme.ink }, titleStyle]}>
                {children}
            </Text>
            {meta ? (
                <Text style={[styles.meta, { color: theme.primary }, metaStyle]}>
                    {meta}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.lg,
        ...Platform.select({
            web: {
                alignSelf: "stretch",
                boxSizing: "border-box",
                maxWidth: "100%",
            },
        }),
        ...shadows.paper,
    },
    titleRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    title: {
        color: colors.ink,
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        minWidth: 0,
    },
    meta: {
        color: colors.primary,
        flexShrink: 1,
        fontSize: 12,
        fontWeight: "600",
        marginLeft: spacing.md,
        maxWidth: "48%",
        textAlign: "right",
    },
});
