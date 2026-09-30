import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, getThemeColors, radius, spacing } from "../theme";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { hapticTap } from "../utils/haptics";
import { AppModalSheet } from "./AppModalSheet";

export function ActionSheetRow({
    Icon,
    title,
    subtitle,
    active = false,
    disabled = false,
    onPress,
    style,
    iconStyle,
    titleStyle,
    subtitleStyle,
    children,
    accessibilityLabel,
    accessibilityHint,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <Pressable
            // Title is the name, subtitle is the hint. Left implicit, a screen
            // reader ran them together as one long label.
            accessibilityHint={accessibilityHint ?? subtitle}
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityRole='button'
            accessibilityState={{ disabled, selected: active }}
            android_ripple={{
                color: theme.ripple,
                borderless: false,
            }}
            disabled={disabled}
            onPress={(event) => {
                hapticTap();
                onPress?.(event);
            }}
            style={[
                styles.row,
                { backgroundColor: theme.surface, borderColor: theme.border },
                active && [styles.rowActive, { backgroundColor: theme.primary, borderColor: theme.primary }],
                disabled && styles.disabled,
                style,
            ]}
        >
            {Icon ? (
                <View style={[styles.rowIcon, iconStyle]}>
                    <Icon
                        color={active ? theme.onPrimary : theme.primary}
                        size={18}
                        strokeWidth={2.3}
                    />
                </View>
            ) : null}
            <View style={styles.rowCopy}>
                <Text
                    style={[
                        styles.rowTitle,
                        { color: theme.ink },
                        active && [styles.rowTitleActive, { color: theme.onPrimary }],
                        titleStyle,
                    ]}
                >
                    {title}
                </Text>
                {subtitle ? (
                    <Text
                        style={[
                            styles.rowSubtitle,
                            active && styles.rowSubtitleActive,
                            subtitleStyle,
                        ]}
                    >
                        {subtitle}
                    </Text>
                ) : null}
                {children}
            </View>
        </Pressable>
    );
}

export function ActionSheetSection({ title, style }) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    if (!title) return null;
    return (
        <Text style={[styles.sectionTitle, { color: theme.muted }, style]}>{title}</Text>
    );
}

export function AppActionSheet({
    visible,
    onClose,
    title,
    subtitle,
    children,
    footer,
    contentStyle,
    sheetStyle,
    titleStyle,
    subtitleStyle,
    closeLabel = "Tutup",
    maxHeight = "80%",
}) {
    return (
        <AppModalSheet
            closeLabel={closeLabel}
            contentStyle={contentStyle}
            footer={footer}
            maxHeight={maxHeight}
            onClose={onClose}
            sheetStyle={sheetStyle}
            subtitle={subtitle}
            subtitleStyle={subtitleStyle}
            title={title}
            titleStyle={titleStyle}
            visible={visible}
        >
            {children}
        </AppModalSheet>
    );
}

const styles = StyleSheet.create({
    row: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        marginBottom: spacing.sm,
        minHeight: 58,
        padding: spacing.md,
    },
    rowActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    disabled: {
        opacity: 0.58,
    },
    rowIcon: {
        alignItems: "center",
        justifyContent: "center",
        width: 24,
    },
    rowCopy: {
        flex: 1,
        marginLeft: spacing.md,
    },
    rowTitle: {
        color: colors.ink,
        fontSize: 15,
        fontWeight: "700",
    },
    rowTitleActive: {
        color: colors.onPrimary,
    },
    rowSubtitle: {
        color: colors.muted,
        fontSize: 13,
        marginTop: 2,
    },
    rowSubtitleActive: {
        color: colors.onPrimary,
        opacity: 0.82,
    },
    sectionTitle: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
        textTransform: "uppercase",
    },
});
