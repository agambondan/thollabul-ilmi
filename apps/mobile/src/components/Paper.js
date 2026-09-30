import { AlertCircle, Search } from "lucide-react-native";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { colors, getThemeColors, radius, shadows, spacing, touchTarget } from "../theme";
import { hapticSelection, hapticTap } from "../utils/haptics";

export function SectionHeader({ title, meta, action }) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionCopy}>
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text>
                {meta ? <Text style={[styles.sectionMeta, { color: theme.primary }]}>{meta}</Text> : null}
            </View>
            {action ? <View style={styles.sectionAction}>{action}</View> : null}
        </View>
    );
}

export function SegmentedTabs({ options, value, onChange, style }) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View style={[styles.segmentedTabs, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, style]}>
            {options.map((option) => {
                const active = option.key === value;
                const OptionIcon = option.Icon;
                return (
                    <Pressable
                        accessibilityLabel={
                            option.accessibilityLabel ?? option.label
                        }
                        accessibilityRole='tab'
                        accessibilityState={{ selected: active }}
                        android_ripple={{
                            color: theme.ripple,
                            borderless: false,
                        }}
                        key={option.key}
                        onPress={() => {
                            if (!active) hapticSelection();
                            onChange?.(option.key);
                        }}
                        style={[
                            styles.segmentButton,
                            active && [styles.segmentButtonActive, { backgroundColor: theme.primary }],
                        ]}
                    >
                        {OptionIcon ? (
                            <OptionIcon
                                color={
                                    active ? theme.onPrimary : theme.primary
                                }
                                size={16}
                                strokeWidth={2.2}
                            />
                        ) : null}
                        <Text
                            style={[
                                styles.segmentLabel,
                                { color: active ? theme.onPrimary : theme.primary },
                                active && styles.segmentLabelActive,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export function PaperSearchInput({
    value,
    onChangeText,
    placeholder = "Cari...",
    autoFocus = false,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search color={theme.muted} size={17} strokeWidth={2} />
            <TextInput
                accessibilityLabel={placeholder}
                autoFocus={autoFocus}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.muted}
                style={[styles.searchInput, { color: theme.ink }]}
                value={value}
            />
        </View>
    );
}

export function IconActionButton({
    Icon,
    label,
    onPress,
    disabled = false,
    active = false,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <Pressable
            accessibilityLabel={label}
            accessibilityRole='button'
            accessibilityState={{ disabled, selected: active }}
            android_ripple={{
                color: theme.ripple,
                borderless: true,
            }}
            disabled={disabled}
            onPress={(event) => {
                hapticTap();
                onPress?.(event);
            }}
            style={[
                styles.iconButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                active && [styles.iconButtonActive, { backgroundColor: theme.primary, borderColor: theme.primary }],
                disabled && styles.disabled,
            ]}
        >
            <Icon
                color={active ? theme.onPrimary : theme.primary}
                size={18}
                strokeWidth={2.2}
            />
        </Pressable>
    );
}

export function ActionPill({
    Icon,
    label,
    onPress,
    disabled = false,
    active = false,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <Pressable
            accessibilityLabel={label}
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
                styles.actionPill,
                { backgroundColor: theme.surface, borderColor: theme.border },
                active && [styles.actionPillActive, { backgroundColor: theme.primary, borderColor: theme.primary }],
                disabled && styles.disabled,
            ]}
        >
            {Icon ? (
                <Icon
                    color={active ? theme.onPrimary : theme.primary}
                    size={16}
                    strokeWidth={2.2}
                />
            ) : null}
            <Text
                style={[
                    styles.actionPillLabel,
                    { color: active ? theme.onPrimary : theme.primary },
                    active && styles.actionPillLabelActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

export function CompactRow({
    title,
    subtitle,
    meta,
    Icon,
    onPress,
    selected = false,
    right,
    badges = [],
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    const accessibilityLabel = [title, subtitle, meta, ...badges]
        .filter(Boolean)
        .join(", ");
    const content = (
        <>
            {Icon ? (
                <View style={[styles.rowIcon, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Icon color={theme.primary} size={18} strokeWidth={2.2} />
                </View>
            ) : null}
            <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>{title}</Text>
                {subtitle ? (
                    <Text style={[styles.rowSubtitle, { color: theme.muted }]}>{subtitle}</Text>
                ) : null}
                {badges.length ? (
                    <View style={styles.rowBadges}>
                        {badges.map((badge) => (
                            <View
                                key={`${title}-${badge}`}
                                style={[
                                    styles.rowBadge,
                                    { backgroundColor: theme.bg, borderColor: theme.border },
                                    badge === "Baru" && [styles.rowBadgeActive, { backgroundColor: theme.primary, borderColor: theme.primary }],
                                    badge === "Terakhir" &&
                                        [styles.rowBadgeRecent, { backgroundColor: theme.surfaceMuted, borderColor: theme.primary }],
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.rowBadgeText,
                                        { color: theme.muted },
                                        badge === "Baru" &&
                                            [styles.rowBadgeTextActive, { color: theme.onPrimary }],
                                        badge === "Terakhir" &&
                                            [styles.rowBadgeTextRecent, { color: theme.primary }],
                                    ]}
                                >
                                    {badge}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>
            {meta ? <Text style={[styles.rowMeta, { color: theme.primary }]}>{meta}</Text> : null}
        </>
    );

    const rowWrapperStyle = [
        styles.compactRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
        isWebAppLayout && { shadowOpacity: 0, elevation: 0 },
        selected && [styles.compactRowSelected, { backgroundColor: theme.surfaceMuted, borderColor: theme.primary }],
    ];

    if (right) {
        return (
            <View style={rowWrapperStyle}>
                {onPress ? (
                    <Pressable
                        accessibilityLabel={accessibilityLabel}
                        accessibilityRole='button'
                        accessibilityState={{ selected }}
                        android_ripple={{
                            color: theme.ripple,
                            borderless: false,
                        }}
                        onPress={(event) => {
                            hapticTap();
                            onPress?.(event);
                        }}
                        style={styles.rowMain}
                    >
                        {content}
                    </Pressable>
                ) : (
                    <View style={styles.rowMain}>{content}</View>
                )}
                <View style={styles.rowRight}>{right}</View>
            </View>
        );
    }

    if (onPress) {
        return (
            <Pressable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole='button'
                accessibilityState={{ selected }}
                android_ripple={{
                    color: theme.ripple,
                    borderless: false,
                }}
                onPress={(event) => {
                    hapticTap();
                    onPress?.(event);
                }}
                style={rowWrapperStyle}
            >
                {content}
            </Pressable>
        );
    }

    return <View style={rowWrapperStyle}>{content}</View>;
}

export function EmptyState({
    title = "Belum Ada Data",
    description = "Konten akan muncul di sini setelah tersedia.",
    action,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View style={[
            styles.stateBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
            isWebAppLayout && { shadowOpacity: 0, elevation: 0 },
        ]}>
            <View style={[styles.stateIcon, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Search color={theme.muted} size={20} strokeWidth={2.2} />
            </View>
            <Text style={[styles.stateTitle, { color: theme.ink }]}>{title}</Text>
            {description ? (
                <Text style={[styles.stateDescription, { color: theme.muted }]}>{description}</Text>
            ) : null}
            {action ? <View style={styles.stateAction}>{action}</View> : null}
        </View>
    );
}

export function ErrorState({
    title = "Data belum bisa dimuat",
    description = "Periksa koneksi atau coba muat ulang beberapa saat lagi.",
    action,
}) {
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    return (
        <View
            style={[
                styles.stateBox,
                {
                    backgroundColor: isDarkTheme ? "#3f1d1d" : "#fff1f2",
                    borderColor: theme.danger,
                },
                isWebAppLayout && { shadowOpacity: 0, elevation: 0 },
            ]}
        >
            <View style={[styles.stateIcon, { backgroundColor: theme.bg, borderColor: theme.danger }]}>
                <AlertCircle
                    color={theme.danger}
                    size={20}
                    strokeWidth={2.2}
                />
            </View>
            <Text style={[styles.stateTitle, { color: theme.ink }]}>{title}</Text>
            {description ? (
                <Text style={[styles.stateDescription, { color: theme.muted }]}>{description}</Text>
            ) : null}
            {action ? <View style={styles.stateAction}>{action}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    sectionCopy: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    sectionMeta: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 2,
    },
    sectionAction: {
        marginLeft: spacing.md,
    },
    segmentedTabs: {
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: 4,
        marginBottom: spacing.md,
        padding: 4,
    },
    segmentButton: {
        alignItems: "center",
        borderRadius: radius.sm,
        flex: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: touchTarget,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    segmentButtonActive: {},
    segmentLabel: {
        fontSize: 11,
        fontWeight: "700",
    },
    segmentLabelActive: {},
    searchWrap: {
        alignItems: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: touchTarget,
        paddingHorizontal: spacing.md,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        minHeight: touchTarget,
        outlineStyle: "none",
        paddingVertical: 0,
    },
    iconButton: {
        alignItems: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        height: touchTarget,
        justifyContent: "center",
        width: touchTarget,
    },
    iconButtonActive: {},
    disabled: {
        opacity: 0.5,
    },
    actionPill: {
        alignItems: "center",
        borderRadius: radius.sm,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: touchTarget,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    actionPillActive: {},
    actionPillLabel: {
        fontSize: 11,
        fontWeight: "700",
    },
    actionPillLabelActive: {},
    compactRow: {
        alignItems: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.sm,
        minHeight: 58,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...Platform.select({
            web: {
                alignSelf: "stretch",
                boxSizing: "border-box",
                maxWidth: "100%",
            },
        }),
        ...shadows.paper,
    },
    compactRowSelected: {},
    rowMain: {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: spacing.md,
        minWidth: 0,
    },
    rowIcon: {
        alignItems: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    rowCopy: {
        flex: 1,
        minWidth: 0,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: "700",
    },
    rowSubtitle: {
        fontSize: 12,
        lineHeight: 17,
        marginTop: spacing.xs,
    },
    rowBadges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 6,
    },
    rowBadge: {
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    rowBadgeActive: {},
    rowBadgeRecent: {},
    rowBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        lineHeight: 11,
    },
    rowBadgeTextActive: {},
    rowBadgeTextRecent: {},
    rowMeta: {
        flexShrink: 1,
        fontSize: 12,
        fontWeight: "700",
    },
    stateBox: {
        alignItems: "center",
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.lg,
        ...shadows.paper,
    },
    stateIcon: {
        alignItems: "center",
        borderRadius: radius.lg,
        borderWidth: 1,
        height: touchTarget,
        justifyContent: "center",
        marginBottom: spacing.sm,
        width: touchTarget,
    },
    stateTitle: {
        fontSize: 17,
        fontWeight: "800",
        textAlign: "center",
    },
    stateDescription: {
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    stateAction: {
        marginTop: spacing.md,
    },
});
