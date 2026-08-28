import { MoreVertical } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { hapticTap } from "../utils/haptics";

export function MetaRail({ items = [], style, textStyle }) {
    const visibleItems = items.filter((item) => item?.label || item?.value);
    if (!visibleItems.length) return null;

    return (
        <View style={[styles.metaRail, style]}>
            {visibleItems.map((item, index) => (
                <View
                    key={`${item.label ?? item.value}-${index}`}
                    style={[
                        styles.railItem,
                        item.variant === "badge" && styles.railBadge,
                        item.active && styles.railBadgeActive,
                        item.style,
                    ]}
                >
                    <Text
                        numberOfLines={item.numberOfLines ?? 1}
                        style={[
                            styles.railText,
                            item.variant === "badge" && styles.railBadgeText,
                            item.active && styles.railBadgeTextActive,
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
}

export function ContentCard({
    Icon,
    iconStyle,
    iconColor = colors.primary,
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
                    ? { color: "rgba(91, 110, 91, 0.12)", borderless: false }
                    : undefined
            }
            disabled={disabled}
            onPress={(event) => {
                hapticTap();
                onPress?.(event);
            }}
            style={[
                styles.card,
                selected && styles.cardSelected,
                disabled && styles.cardDisabled,
                style,
            ]}
        >
            {leading ? <View style={styles.leading}>{leading}</View> : null}
            {metaRail ? <MetaRail items={metaRail} /> : null}
            {Icon ? (
                <View style={[styles.icon, iconStyle]}>
                    <Icon
                        color={iconColor}
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
                            style={[styles.eyebrow, eyebrowStyle]}
                        >
                            {eyebrow}
                        </Text>
                    ) : null}
                    <View style={styles.headerRow}>
                        <View style={styles.headerCopy}>
                            {title ? (
                                <Text
                                    numberOfLines={numberOfTitleLines}
                                    style={[styles.title, titleStyle]}
                                >
                                    {title}
                                </Text>
                            ) : null}
                            {subtitle ? (
                                <Text
                                    numberOfLines={numberOfSubtitleLines}
                                    style={[styles.subtitle, subtitleStyle]}
                                >
                                    {subtitle}
                                </Text>
                            ) : null}
                        </View>
                        {meta ? (
                            <Text
                                numberOfLines={2}
                                style={[styles.meta, metaStyle]}
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
                            color: "rgba(91, 110, 91, 0.12)",
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
                            color={colors.primary}
                            size={18}
                            strokeWidth={2.4}
                        />
                    </Pressable>
                ) : null}
            </View>
        </Container>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: "stretch",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 66,
        padding: spacing.sm,
    },
    cardSelected: {
        borderColor: colors.primary,
    },
    cardDisabled: {
        opacity: 0.56,
    },
    leading: {
        justifyContent: "center",
    },
    icon: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    metaRail: {
        alignItems: "stretch",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 86,
        padding: spacing.sm,
        width: 92,
    },
    railItem: {
        marginTop: spacing.xs,
    },
    railText: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: "900",
        textAlign: "center",
        textTransform: "uppercase",
    },
    railBadge: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.sm,
        marginTop: spacing.sm,
        overflow: "hidden",
        paddingHorizontal: spacing.xs,
        paddingVertical: 4,
    },
    railBadgeActive: {
        backgroundColor: colors.primary,
    },
    railBadgeText: {
        color: colors.muted,
        fontSize: 9,
    },
    railBadgeTextActive: {
        color: colors.onPrimary,
    },
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
        color: colors.primary,
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
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
        lineHeight: 18,
    },
    subtitle: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    meta: {
        color: colors.primary,
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
        borderRadius: 20,
        height: 40,
        justifyContent: "center",
        marginLeft: spacing.xs,
        width: 40,
    },
    footer: {
        marginTop: spacing.xs,
    },
});
