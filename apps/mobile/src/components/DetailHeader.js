import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, getThemeColors, radius, spacing, touchTarget } from "../theme";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { hapticTap } from "../utils/haptics";

export function DetailHeader({
    title,
    subtitle,
    meta,
    onBack,
    actions,
    backLabel = "Kembali",
    style,
    titleStyle,
    subtitleStyle,
    metaStyle,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View style={[styles.header, { borderBottomColor: theme.border }, style]}>
            <View style={styles.copy}>
                <View style={styles.titleRow}>
                    {onBack ? (
                        <Pressable
                            accessibilityLabel={backLabel}
                            accessibilityRole='button'
                            android_ripple={{
                                color: theme.ripple,
                                borderless: true,
                            }}
                            hitSlop={8}
                            onPress={(event) => {
                                hapticTap();
                                onBack(event);
                            }}
                            style={[styles.backButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                        >
                            <ArrowLeft
                                color={theme.primary}
                                size={18}
                                strokeWidth={2.3}
                            />
                        </Pressable>
                    ) : null}
                    <Text numberOfLines={2} style={[styles.title, { color: theme.ink }, titleStyle]}>
                        {title}
                    </Text>
                    {meta ? (
                        <Text
                            numberOfLines={1}
                            style={[styles.meta, { color: theme.primary }, metaStyle]}
                        >
                            {meta}
                        </Text>
                    ) : null}
                </View>
                {subtitle ? (
                    <Text
                        numberOfLines={2}
                        style={[styles.subtitle, { color: theme.muted }, subtitleStyle]}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: "center",
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
    },
    copy: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
    backButton: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: touchTarget,
        justifyContent: "center",
        width: touchTarget,
    },
    title: {
        color: colors.ink,
        flex: 1,
        fontSize: 18,
        fontWeight: "800",
        minWidth: 0,
    },
    subtitle: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.xs,
    },
    meta: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "700",
        marginLeft: spacing.xs,
        maxWidth: "34%",
        textAlign: "right",
    },
    actions: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
});
