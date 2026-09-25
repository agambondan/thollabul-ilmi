import { ChevronDown, Menu, Search } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { radius, spacing, touchTarget, getThemeColors } from "../theme";
import { ArrowLeft } from "lucide-react-native";

export function MobileTopHeader({
    accountLabel = "T",
    accountMenuOpen = false,
    isDarkTheme = false,
    isWebAppLayout = true,
    onOpenAccountMenu,
    onOpenMenu,
    onOpenSearch,
    onBack,
    title,
    subtitle,
    showBack = false,
}) {
    const { t } = useMobileLocale();
    const normalizedAccountLabel = accountLabel?.trim() || "T";
    const isMorphed = Boolean(showBack || title);
    const theme = getThemeColors({ isDark: isDarkTheme, isPaperLayout: !isWebAppLayout });

    return (
        <View
            style={[styles.wrap, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}
            testID='mobile-top-header'
        >
            {isMorphed ? (
                <View style={styles.brandGroup}>
                    {showBack ? (
                        <Pressable
                            accessibilityLabel={t("common.back")}
                            accessibilityRole='button'
                            android_ripple={{
                                color: theme.faint,
                                borderless: true,
                            }}
                            hitSlop={12}
                            onPress={onBack}
                            style={[
                                styles.backButton,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                },
                            ]}
                        >
                            <ArrowLeft
                                color={theme.primary}
                                size={20}
                                strokeWidth={2.5}
                            />
                        </Pressable>
                    ) : null}
                    <View style={styles.morphedTitleWrap}>
                        <Text
                            style={[
                                styles.brandName,
                                { color: theme.ink },
                            ]}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text
                                style={[
                                    styles.morphedSubtitle,
                                    { color: theme.muted },
                                ]}
                                numberOfLines={1}
                            >
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                </View>
) : (
            <View style={styles.brandGroup}>
                    <View style={[styles.logo, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.logoText, { color: theme.onPrimary }]}>ط</Text>
                    </View>
                    <Text
                        style={[
                            styles.brandName,
                            { color: theme.ink },
                        ]}
                        numberOfLines={1}
                    >
                        Thullaabul 'Ilmi
                    </Text>
                </View>
            )}

            <View style={styles.actions}>
                {onOpenSearch ? (
                    <Pressable
                        accessibilityLabel={t("nav.search")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: theme.faint,
                            borderless: true,
                        }}
                        onPress={onOpenSearch}
                        style={styles.actionIconBtn}
                        testID='mobile-top-header-search'
                    >
                            <Search
                                color={theme.muted}
                                size={19}
                                strokeWidth={2}
                            />
                    </Pressable>
                ) : null}
                {onOpenMenu ? (
                    <Pressable
                        accessibilityLabel={t("nav.menu")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: theme.faint,
                            borderless: true,
                        }}
                        onPress={onOpenMenu}
                        style={styles.actionIconBtn}
                        testID='mobile-top-header-menu'
                    >
                            <Menu
                                color={theme.muted}
                                size={19}
                                strokeWidth={2}
                            />
                    </Pressable>
                ) : null}
                <Pressable
                    accessibilityLabel={t("account.menuLabel")}
                    accessibilityRole='button'
                    android_ripple={{
                        color: theme.faint,
                        borderless: true,
                    }}
                    onPress={onOpenAccountMenu}
                    style={styles.accountButton}
                    testID='mobile-top-header-profile'
                >
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.avatarText, { color: theme.onPrimary }]} numberOfLines={1}>
                            {normalizedAccountLabel.slice(0, 1).toUpperCase()}
                        </Text>
                    </View>
                    <ChevronDown
                        color={theme.muted}
                        size={17}
                        strokeWidth={2}
                        style={accountMenuOpen ? styles.chevronOpen : undefined}
                    />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: "center",
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 56,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    morphedWrap: {
        alignItems: "center",
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 56,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    brandGroup: {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minWidth: 0,
    },
    logo: {
        alignItems: "center",
        borderRadius: radius.sm,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    logoText: {
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0,
    },
    brandName: {
        flex: 1,
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0,
    },
    actions: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        paddingLeft: spacing.sm,
    },
    morphedActions: {
        width: 32,
    },
    actionIconBtn: {
        alignItems: "center",
        height: touchTarget,
        justifyContent: "center",
        width: touchTarget,
    },
    accountButton: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
        minHeight: touchTarget,
    },
    avatar: {
        alignItems: "center",
        borderRadius: 999,
        height: touchTarget,
        justifyContent: "center",
        width: touchTarget,
    },
    avatarText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
    },
    chevronOpen: {
        transform: [{ rotate: "180deg" }],
    },
    backButton: {
        alignItems: "center",
        borderRadius: radius.sm,
        borderWidth: 1,
        height: touchTarget,
        justifyContent: "center",
        width: touchTarget,
    },
    morphedTitleWrap: {
        flex: 1,
        minWidth: 0,
    },
    morphedTitle: {
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: -0.2,
    },
    morphedSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
});
