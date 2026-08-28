import { AlertCircle, Search } from "lucide-react-native";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { colors, radius, shadows, spacing } from "../theme";
import { hapticSelection, hapticTap } from "../utils/haptics";

export function SectionHeader({ title, meta, action }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
            </View>
            {action ? <View style={styles.sectionAction}>{action}</View> : null}
        </View>
    );
}

export function SegmentedTabs({ options, value, onChange, style }) {
    return (
        <View style={[styles.segmentedTabs, style]}>
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
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        key={option.key}
                        onPress={() => {
                            if (!active) hapticSelection();
                            onChange?.(option.key);
                        }}
                        style={[
                            styles.segmentButton,
                            active && styles.segmentButtonActive,
                        ]}
                    >
                        {OptionIcon ? (
                            <OptionIcon
                                color={
                                    active ? colors.onPrimary : colors.primary
                                }
                                size={16}
                                strokeWidth={2.2}
                            />
                        ) : null}
                        <Text
                            style={[
                                styles.segmentLabel,
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
    return (
        <View style={styles.searchWrap}>
            <Search color={colors.muted} size={17} strokeWidth={2} />
            <TextInput
                accessibilityLabel={placeholder}
                autoFocus={autoFocus}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
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
    return (
        <Pressable
            accessibilityLabel={label}
            accessibilityRole='button'
            accessibilityState={{ disabled, selected: active }}
            android_ripple={{
                color: "rgba(91, 110, 91, 0.12)",
                borderless: true,
            }}
            disabled={disabled}
            onPress={(event) => {
                hapticTap();
                onPress?.(event);
            }}
            style={[
                styles.iconButton,
                active && styles.iconButtonActive,
                disabled && styles.disabled,
            ]}
        >
            <Icon
                color={active ? colors.onPrimary : colors.primary}
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
    return (
        <Pressable
            accessibilityLabel={label}
            accessibilityRole='button'
            accessibilityState={{ disabled, selected: active }}
            android_ripple={{
                color: "rgba(91, 110, 91, 0.12)",
                borderless: false,
            }}
            disabled={disabled}
            onPress={(event) => {
                hapticTap();
                onPress?.(event);
            }}
            style={[
                styles.actionPill,
                active && styles.actionPillActive,
                disabled && styles.disabled,
            ]}
        >
            {Icon ? (
                <Icon
                    color={active ? colors.onPrimary : colors.primary}
                    size={16}
                    strokeWidth={2.2}
                />
            ) : null}
            <Text
                style={[
                    styles.actionPillLabel,
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
    const accessibilityLabel = [title, subtitle, meta, ...badges]
        .filter(Boolean)
        .join(", ");
    const content = (
        <>
            {Icon ? (
                <View style={styles.rowIcon}>
                    <Icon color={colors.primary} size={18} strokeWidth={2.2} />
                </View>
            ) : null}
            <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle ? (
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                ) : null}
                {badges.length ? (
                    <View style={styles.rowBadges}>
                        {badges.map((badge) => (
                            <View
                                key={`${title}-${badge}`}
                                style={[
                                    styles.rowBadge,
                                    badge === "Baru" && styles.rowBadgeActive,
                                    badge === "Terakhir" &&
                                        styles.rowBadgeRecent,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.rowBadgeText,
                                        badge === "Baru" &&
                                            styles.rowBadgeTextActive,
                                        badge === "Terakhir" &&
                                            styles.rowBadgeTextRecent,
                                    ]}
                                >
                                    {badge}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>
            {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
        </>
    );

    if (right) {
        return (
            <View
                style={[
                    styles.compactRow,
                    selected && styles.compactRowSelected,
                ]}
            >
                {onPress ? (
                    <Pressable
                        accessibilityLabel={accessibilityLabel}
                        accessibilityRole='button'
                        accessibilityState={{ selected }}
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        onPress={onPress}
                        style={styles.rowMain}
                    >
                        {content}
                    </Pressable>
                ) : (
                    <View style={styles.rowMain}>{content}</View>
                )}
                {right}
            </View>
        );
    }

    const Container = onPress ? Pressable : View;
    return (
        <Container
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityState={onPress ? { selected } : undefined}
            android_ripple={
                onPress
                    ? { color: "rgba(91, 110, 91, 0.12)", borderless: false }
                    : undefined
            }
            onPress={onPress}
            style={[styles.compactRow, selected && styles.compactRowSelected]}
        >
            {content}
        </Container>
    );
}

export function EmptyState({ title, description, Icon = AlertCircle, action }) {
    return (
        <View style={styles.stateBox}>
            <View style={styles.stateIcon}>
                <Icon color={colors.primary} size={20} strokeWidth={2.1} />
            </View>
            <Text style={styles.stateTitle}>{title}</Text>
            {description ? (
                <Text style={styles.stateDescription}>{description}</Text>
            ) : null}
            {action ? <View style={styles.stateAction}>{action}</View> : null}
        </View>
    );
}

export function ErrorState({
    title = "Data belum bisa dimuat",
    description,
    action,
}) {
    return (
        <EmptyState
            title={title}
            description={
                description ||
                "Periksa koneksi atau coba muat ulang beberapa saat lagi."
            }
            action={action}
            Icon={AlertCircle}
        />
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    sectionCopy: {
        flex: 1,
    },
    sectionTitle: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 18,
        fontWeight: "900",
    },
    sectionMeta: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    sectionAction: {
        alignItems: "center",
        justifyContent: "center",
    },
    segmentedTabs: {
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        padding: 4,
    },
    segmentButton: {
        alignItems: "center",
        borderRadius: radius.sm,
        flex: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 32,
        paddingHorizontal: spacing.xs,
    },
    segmentButtonActive: {
        backgroundColor: colors.primary,
    },
    segmentLabel: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "900",
    },
    segmentLabelActive: {
        color: colors.onPrimary,
    },
    searchWrap: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 42,
        paddingHorizontal: spacing.md,
    },
    searchInput: {
        color: colors.ink,
        flex: 1,
        fontSize: 14,
        minHeight: 40,
        outlineStyle: "none",
        paddingVertical: 0,
    },
    iconButton: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 38,
        justifyContent: "center",
        width: 38,
    },
    iconButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    disabled: {
        opacity: 0.5,
    },
    actionPill: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 36,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    actionPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    actionPillLabel: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "900",
    },
    actionPillLabelActive: {
        color: colors.onPrimary,
    },
    compactRow: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
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
    compactRowSelected: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    rowMain: {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: spacing.md,
        minWidth: 0,
    },
    rowIcon: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
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
        color: colors.ink,
        fontSize: 14,
        fontWeight: "900",
    },
    rowSubtitle: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    rowBadges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 6,
    },
    rowBadge: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    rowBadgeActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    rowBadgeRecent: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    rowBadgeText: {
        color: colors.muted,
        fontSize: 9,
        fontWeight: "900",
        lineHeight: 11,
    },
    rowBadgeTextActive: {
        color: colors.onPrimary,
    },
    rowBadgeTextRecent: {
        color: colors.primary,
    },
    rowMeta: {
        color: colors.primary,
        flexShrink: 1,
        fontSize: 12,
        fontWeight: "900",
    },
    stateBox: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.lg,
        ...shadows.paper,
    },
    stateIcon: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.lg,
        borderWidth: 1,
        height: 42,
        justifyContent: "center",
        marginBottom: spacing.sm,
        width: 42,
    },
    stateTitle: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 17,
        fontWeight: "900",
        textAlign: "center",
    },
    stateDescription: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    stateAction: {
        marginTop: spacing.md,
    },
});
