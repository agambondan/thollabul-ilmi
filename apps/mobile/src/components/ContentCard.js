import { MoreVertical } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { colors, getThemeColors, radius, spacing, touchTarget } from "../theme";
import { hapticTap } from "../utils/haptics";

export const MetaRail = memo(function MetaRail({ items = [], style, textStyle }) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    const visibleItems = items.filter((item) => item?.label || item?.value);
    if (!visibleItems.length) return null;

    return (
        <View style={[styles.metaRail, { backgroundColor: theme.bg, borderColor: theme.border }, style]}>
            {visibleItems.map((item, index) => (
                <View
                    key={`${item.label ?? item.value}-${index}`}
                    style={[
                        styles.railItem,
                        item.variant === "badge" && [styles.railBadge, { backgroundColor: theme.surfaceMuted }],
                        item.active && [styles.railBadgeActive, { backgroundColor: theme.primary }],
                        item.style,
                    ]}
                >
                    <Text
                        numberOfLines={item.numberOfLines ?? 1}
                        style={[
                            styles.railText,
                            { color: theme.muted },
                            item.variant === "badge" && styles.railBadgeText,
                            item.active && [styles.railBadgeTextActive, { color: theme.onPrimary }],
                            textStyle,
                            item.textStyle,
                        ]}
                    >
                        {item.label ?? item.value}
                    </Text>
                </View>
            ))}
        </View>
    );
});

export const ContentCard = memo(function ContentCard({
    Icon,
    iconStyle,
    iconColor,
    iconSize = 18,
    iconStrokeWidth = 2.2,
    leading,
    metaRail,
    title,
    subtitle,
    meta,
    eyebrow,
    children,
    footer,
    trailing,
    onPress,
    onMenuPress,
    menuLabel = "Aksi",
    selected = false,
    disabled = false,
    numberOfTitleLines = 2,
    numberOfSubtitleLines = 3,
    style,
    bodyStyle,
    contentStyle,
    titleStyle,
    subtitleStyle,
    metaStyle,
    eyebrowStyle,
    footerStyle,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    const resolvedIconColor = iconColor ?? theme.primary;
    const Container = onPress ? Pressable : View;
    const accessibilityLabel = [title, subtitle, meta]
        .filter(Boolean)
        .join(", ");

    return (
        <Container
            accessibilityLabel={accessibilityLabel || undefined}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityState={onPress ? { disabled, selected } : undefined}
            android_ripple={
                onPress
                    ? { color: theme.ripple, borderless: false }
                    : undefined
            }
            disabled={disabled}
            onPress={(event) => {
                hapticTap();
                onPress?.(event);
            }}
            style={[
                styles.card,
                {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                },
                isWebAppLayout && { shadowOpacity: 0, elevation: 0 },
                selected && [styles.cardSelected, { borderColor: theme.primary }],
                disabled && styles.cardDisabled,
                style,
            ]}
        >
            {leading ? <View style={styles.leading}>{leading}</View> : null}
            {metaRail ? <MetaRail items={metaRail} /> : null}
            {Icon ? (
                <View style={[styles.icon, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, iconStyle]}>
                    <Icon
                        color={resolvedIconColor}
                        size={iconSize}
                        strokeWidth={iconStrokeWidth}
                    />
                </View>
            ) : null}

            <View style={[styles.body, bodyStyle]}>
                <View style={[styles.content, contentStyle]}>
                    {eyebrow ? (
                        <Text
                            numberOfLines={1}
                            style={[styles.eyebrow, { color: theme.primary }, eyebrowStyle]}
                        >
                            {eyebrow}
                        </Text>
                    ) : null}
                    <View style={styles.headerRow}>
                        <View style={styles.headerCopy}>
                            {title ? (
                                <Text
                                    numberOfLines={numberOfTitleLines}
                                    style={[styles.title, { color: theme.ink }, titleStyle]}
                                >
                                    {title}
                                </Text>
                            ) : null}
                            {subtitle ? (
                                <Text
                                    numberOfLines={numberOfSubtitleLines}
                                    style={[styles.subtitle, { color: theme.muted }, subtitleStyle]}
                                >
                                    {subtitle}
                                </Text>
                            ) : null}
                        </View>
                        {meta ? (
                            <Text
                                numberOfLines={2}
                                style={[styles.meta, { color: theme.primary }, metaStyle]}
                            >
                                {meta}
                            </Text>
                        ) : null}
                    </View>
                    {children}
                    {footer ? (
                        <View style={[styles.footer, footerStyle]}>
                            {footer}
                        </View>
                    ) : null}
                </View>
                {trailing ? (
                    <View style={styles.trailing}>{trailing}</View>
                ) : null}
                {onMenuPress ? (
                    <Pressable
                        accessibilityLabel={menuLabel}
                        accessibilityRole='button'
                        android_ripple={{
                            color: theme.ripple,
                            borderless: true,
                        }}
                        hitSlop={8}
                        onPress={(event) => {
                            event.stopPropagation();
                            hapticTap();
                            onMenuPress(event);
                        }}
                        style={styles.menuButton}
                    >
                        <MoreVertical
                            color={theme.primary}
                            size={18}
                            strokeWidth={2.4}
                        />
                    </Pressable>
                ) : null}
            </View>
        </Container>
    );
});

const styles = StyleSheet.create({
    card: {
        alignItems: "stretch",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 66,
        padding: spacing.sm,
    },
    cardSelected: {},
    cardDisabled: {
        opacity: 0.56,
    },
    leading: {
        justifyContent: "center",
    },
    icon: {
        alignItems: "center",
        borderRadius: radius.sm,
        borderWidth: 1,
        height: touchTarget,
        justifyContent: "center",
        width: touchTarget,
    },
    metaRail: {
        alignItems: "stretch",
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 86,
        padding: spacing.sm,
        width: 92,
    },
    railItem: {
        marginTop: spacing.sm,
    },
    railText: {
        fontSize: 10,
        fontWeight: "900",
        textAlign: "center",
        textTransform: "uppercase",
    },
    railBadge: {
        borderRadius: radius.sm,
        marginTop: spacing.sm,
        overflow: "hidden",
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
    },
    railBadgeActive: {},
    railBadgeText: {
        fontSize: 9,
    },
    railBadgeTextActive: {},
    body: {
        flex: 1,
        flexDirection: "row",
        minWidth: 0,
    },
    content: {
        flex: 1,
        minWidth: 0,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: "900",
        marginBottom: 2,
        textTransform: "uppercase",
    },
    headerRow: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
    },
    headerCopy: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontSize: 13,
        fontWeight: "900",
        lineHeight: 18,
    },
    subtitle: {
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    meta: {
        fontSize: 11,
        fontWeight: "900",
        marginLeft: spacing.xs,
        maxWidth: 86,
        textAlign: "right",
    },
    trailing: {
        alignItems: "center",
        justifyContent: "center",
    },
    menuButton: {
        alignItems: "center",
        borderRadius: radius.md,
        height: touchTarget,
        justifyContent: "center",
        marginLeft: spacing.xs,
        width: touchTarget,
    },
    footer: {
        marginTop: spacing.xs,
    },
});
