import { ChevronDown, Menu, Search } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { radius, spacing } from "../theme";

const header = {
    bg: "#ffffff",
    border: "#e2e8f0",
    brand: "#047857",
    ink: "#0f172a",
    muted: "#64748b",
    darkBg: "#020617",
    darkBorder: "#1e293b",
    darkInk: "#f8fafc",
    darkMuted: "#94a3b8",
};

export function MobileTopHeader({
    accountLabel = "T",
    accountMenuOpen = false,
    isDarkTheme = false,
    onOpenAccountMenu,
    onOpenMenu,
    onOpenSearch,
}) {
    const { t } = useMobileLocale();
    const normalizedAccountLabel = accountLabel?.trim() || "T";

    return (
        <View
            style={[styles.wrap, isDarkTheme && styles.wrapDark]}
            testID='mobile-top-header'
        >
            <View style={styles.brandGroup}>
                <View style={styles.logo}>
                    <Text style={styles.logoText}>ط</Text>
                </View>
                <Text
                    style={[
                        styles.brandName,
                        isDarkTheme && styles.brandNameDark,
                    ]}
                    numberOfLines={1}
                >
                    Thullaabul 'Ilmi
                </Text>
            </View>

            <View style={styles.actions}>
                {onOpenSearch ? (
                    <Pressable
                        accessibilityLabel={t("nav.search")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(17, 24, 39, 0.08)",
                            borderless: true,
                        }}
                        onPress={onOpenSearch}
                        style={styles.actionIconBtn}
                        testID='mobile-top-header-search'
                    >
                        <Search
                            color={isDarkTheme ? header.darkMuted : header.muted}
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
                            color: "rgba(17, 24, 39, 0.08)",
                            borderless: true,
                        }}
                        onPress={onOpenMenu}
                        style={styles.actionIconBtn}
                        testID='mobile-top-header-menu'
                    >
                        <Menu
                            color={isDarkTheme ? header.darkMuted : header.muted}
                            size={19}
                            strokeWidth={2}
                        />
                    </Pressable>
                ) : null}
                <Pressable
                    accessibilityLabel={t("account.menuLabel")}
                    accessibilityRole='button'
                    android_ripple={{
                        color: "rgba(17, 24, 39, 0.08)",
                        borderless: true,
                    }}
                    onPress={onOpenAccountMenu}
                    style={styles.accountButton}
                    testID='mobile-top-header-profile'
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText} numberOfLines={1}>
                            {normalizedAccountLabel.slice(0, 1).toUpperCase()}
                        </Text>
                    </View>
                    <ChevronDown
                        color={isDarkTheme ? header.darkMuted : header.muted}
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
        backgroundColor: header.bg,
        borderBottomColor: header.border,
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 56,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    wrapDark: {
        backgroundColor: header.darkBg,
        borderBottomColor: header.darkBorder,
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
        backgroundColor: header.brand,
        borderRadius: radius.sm,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    logoText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0,
    },
    brandName: {
        color: header.ink,
        flex: 1,
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0,
    },
    brandNameDark: {
        color: header.darkInk,
    },
    actions: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
        paddingLeft: spacing.sm,
    },
    actionIconBtn: {
        alignItems: "center",
        height: 32,
        justifyContent: "center",
        width: 32,
    },
    accountButton: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
    },
    avatar: {
        alignItems: "center",
        backgroundColor: header.brand,
        borderRadius: 999,
        height: 32,
        justifyContent: "center",
        width: 32,
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
});
