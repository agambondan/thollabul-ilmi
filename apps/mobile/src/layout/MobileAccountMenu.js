import {
    Bell,
    BookMarked,
    FileText,
    LogOut,
    Moon,
    UserRound,
    BarChart3,
    X,
} from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { radius, spacing } from "../theme";
import { hapticSelection } from "../utils/haptics";

const menu = {
    active: "#34d399",
    backdrop: "rgba(2, 6, 23, 0.22)",
    border: "#334155",
    danger: "#f87171",
    ink: "#f8fafc",
    muted: "#94a3b8",
    surface: "#1e293b",
    lightActive: "#047857",
    lightBackdrop: "rgba(15, 23, 42, 0.18)",
    lightBorder: "#e5e7eb",
    lightInk: "#111827",
    lightMuted: "#64748b",
    lightSurface: "#ffffff",
};

const accountItems = [
    { Icon: UserRound, key: "profile", labelKey: "account.profile" },
    { Icon: BookMarked, key: "bookmarks", labelKey: "account.bookmarks" },
    { Icon: FileText, key: "notes", labelKey: "account.notes" },
    { Icon: BarChart3, key: "stats", labelKey: "account.stats" },
    { Icon: Bell, key: "notifications", labelKey: "account.notifications" },
];

const HEADER_HEIGHT = 56;

export function MobileAccountMenu({
    accountEmail,
    accountLabel = "Tamu",
    canSignOut = false,
    isDarkTheme = false,
    loading = false,
    onClose,
    onSelectLanguage,
    onSelectItem,
    onSelectProfile,
    onSignOut,
    onToggleTheme,
    themePreference = "system",
    visible,
}) {
    const insets = useSafeAreaInsets();
    const { language, setLanguage, t } = useMobileLocale();
    const normalizedAccountLabel =
        accountLabel?.trim() || t("account.userGuest");
    const accountInitial = normalizedAccountLabel.slice(0, 1).toUpperCase();
    const subtitle = accountEmail?.trim() || t("account.emailGuest");

    const handleAccountItem = (item) => {
        hapticSelection();
        onClose?.();
        if (item?.key === "profile") {
            onSelectProfile?.();
            return;
        }
        onSelectItem?.(item);
    };

    const handleSignOut = () => {
        if (!canSignOut) return;
        hapticSelection();
        onClose?.();
        onSignOut?.();
    };

    const handleToggleTheme = () => {
        hapticSelection();
        onToggleTheme?.();
    };

    const handleSelectLanguage = async (nextLanguage) => {
        if (nextLanguage === language) return;
        hapticSelection();
        const storedLanguage = await setLanguage(nextLanguage);
        onSelectLanguage?.(storedLanguage);
    };

    return (
        <Modal
            animationType='fade'
            onRequestClose={onClose}
            transparent
            visible={visible}
        >
            <View
                style={styles.root}
                pointerEvents='box-none'
                testID='mobile-account-menu'
            >
                <Pressable
                    accessibilityLabel={t("account.closeMenu")}
                    accessibilityRole='button'
                    onPress={onClose}
                    style={[
                        styles.backdrop,
                        !isDarkTheme && styles.backdropLight,
                    ]}
                    testID='mobile-account-menu-backdrop'
                />
                <View
                    style={[
                        styles.card,
                        !isDarkTheme && styles.cardLight,
                        {
                            marginTop: Math.max(
                                insets.top + HEADER_HEIGHT,
                                spacing.xl,
                            ),
                        },
                    ]}
                    testID='mobile-account-menu-card'
                >
                    <View
                        style={[
                            styles.header,
                            !isDarkTheme && styles.headerLight,
                        ]}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {accountInitial}
                            </Text>
                        </View>
                        <View style={styles.accountCopy}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.accountName,
                                    !isDarkTheme && styles.accountNameLight,
                                ]}
                            >
                                {normalizedAccountLabel}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.accountEmail,
                                    !isDarkTheme && styles.accountEmailLight,
                                ]}
                            >
                                {subtitle}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityLabel={t("account.closeMenu")}
                            accessibilityRole='button'
                            android_ripple={{
                                color: isDarkTheme ? "#334155" : "#e5e7eb",
                                borderless: true,
                            }}
                            onPress={onClose}
                            style={styles.closeButton}
                            testID='mobile-account-menu-close'
                        >
                            <X
                                color={
                                    isDarkTheme ? menu.muted : menu.lightMuted
                                }
                                size={17}
                                strokeWidth={2.2}
                            />
                        </Pressable>
                    </View>

                    <View style={styles.section}>
                        {accountItems.map((item) => {
                            const Icon = item.Icon;
                            return (
                                <Pressable
                                    accessibilityRole='button'
                                    android_ripple={{
                                        color: isDarkTheme
                                            ? "#334155"
                                            : "#e5e7eb",
                                        borderless: false,
                                    }}
                                    key={item.key}
                                    onPress={() => handleAccountItem(item)}
                                    style={styles.row}
                                    testID={`mobile-account-menu-item-${item.key}`}
                                >
                                    <Icon
                                        color={
                                            isDarkTheme
                                                ? menu.muted
                                                : menu.lightMuted
                                        }
                                        size={17}
                                        strokeWidth={1.9}
                                    />
                                    <Text
                                        style={[
                                            styles.rowLabel,
                                            !isDarkTheme &&
                                                styles.rowLabelLight,
                                        ]}
                                    >
                                        {t(item.labelKey)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View
                        style={[
                            styles.preferences,
                            !isDarkTheme && styles.preferencesLight,
                        ]}
                    >
                        <Pressable
                            accessibilityLabel={t("account.themeToggle")}
                            accessibilityRole='switch'
                            accessibilityState={{ checked: isDarkTheme }}
                            android_ripple={{
                                color: isDarkTheme ? "#334155" : "#e5e7eb",
                                borderless: false,
                            }}
                            onPress={handleToggleTheme}
                            style={styles.prefRow}
                            testID='mobile-account-menu-theme-toggle'
                        >
                            <View>
                                <Text
                                    style={[
                                        styles.prefLabel,
                                        !isDarkTheme && styles.prefLabelLight,
                                    ]}
                                >
                                    {t("account.dark")}
                                </Text>
                                <Text
                                    style={[
                                        styles.prefMeta,
                                        !isDarkTheme && styles.prefMetaLight,
                                    ]}
                                >
                                    {themePreference === "system"
                                        ? t("account.theme.system")
                                        : isDarkTheme
                                          ? t("account.theme.darkActive")
                                          : t("account.theme.lightActive")}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.switchTrack,
                                    !isDarkTheme && styles.switchTrackOff,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.switchThumb,
                                        !isDarkTheme && styles.switchThumbOff,
                                    ]}
                                >
                                    <Moon
                                        color={
                                            isDarkTheme ? "#0f766e" : "#64748b"
                                        }
                                        size={12}
                                        strokeWidth={2.4}
                                    />
                                </View>
                            </View>
                        </Pressable>
                        <View style={styles.langRow}>
                            <Pressable
                                accessibilityLabel={t(
                                    "account.language.indonesia",
                                )}
                                accessibilityRole='button'
                                accessibilityState={{
                                    selected: language === "idn",
                                }}
                                onPress={() => handleSelectLanguage("idn")}
                                style={[
                                    styles.langPill,
                                    !isDarkTheme && styles.langPillLight,
                                    language === "idn" && styles.langPillActive,
                                ]}
                                testID='mobile-account-menu-language-idn'
                            >
                                <Text style={styles.flag}>🇮🇩</Text>
                                <Text
                                    style={[
                                        styles.langText,
                                        language === "idn"
                                            ? styles.langTextActive
                                            : !isDarkTheme &&
                                              styles.langTextLight,
                                    ]}
                                >
                                    {t("account.language.indonesia")}
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityLabel={t(
                                    "account.language.english",
                                )}
                                accessibilityRole='button'
                                accessibilityState={{
                                    selected: language === "en",
                                }}
                                onPress={() => handleSelectLanguage("en")}
                                style={[
                                    styles.langPill,
                                    !isDarkTheme && styles.langPillLight,
                                    language === "en" && styles.langPillActive,
                                ]}
                                testID='mobile-account-menu-language-en'
                            >
                                <Text style={styles.flag}>🇬🇧</Text>
                                <Text
                                    style={[
                                        styles.langText,
                                        language === "en"
                                            ? styles.langTextActive
                                            : !isDarkTheme &&
                                              styles.langTextLight,
                                    ]}
                                >
                                    {t("account.language.english")}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {canSignOut ? (
                        <Pressable
                            accessibilityLabel={t("account.logout")}
                            accessibilityRole='button'
                            android_ripple={{
                                color: isDarkTheme ? "#334155" : "#fee2e2",
                                borderless: false,
                            }}
                            accessibilityState={{ disabled: loading }}
                            disabled={loading}
                            onPress={handleSignOut}
                            style={styles.signOutRow}
                            testID='mobile-account-menu-sign-out'
                        >
                            <LogOut
                                color={menu.danger}
                                size={17}
                                strokeWidth={2}
                            />
                            <Text style={styles.signOutLabel}>
                                {loading
                                    ? t("account.logoutLoading")
                                    : t("account.logout")}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: menu.backdrop,
    },
    backdropLight: {
        backgroundColor: menu.lightBackdrop,
    },
    card: {
        alignSelf: "flex-end",
        backgroundColor: menu.surface,
        borderColor: menu.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        marginRight: spacing.md,
        maxWidth: 288,
        overflow: "hidden",
        width: "64%",
    },
    cardLight: {
        backgroundColor: menu.lightSurface,
        borderColor: menu.lightBorder,
    },
    header: {
        alignItems: "center",
        borderBottomColor: menu.border,
        borderBottomWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerLight: {
        borderBottomColor: menu.lightBorder,
    },
    avatar: {
        alignItems: "center",
        backgroundColor: "#059669",
        borderRadius: 999,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    avatarText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
        letterSpacing: 0,
    },
    accountCopy: {
        flex: 1,
        minWidth: 0,
    },
    accountName: {
        color: menu.ink,
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0,
    },
    accountNameLight: {
        color: menu.lightInk,
    },
    accountEmail: {
        color: menu.muted,
        fontSize: 11,
        fontWeight: "500",
        letterSpacing: 0,
        marginTop: 1,
    },
    accountEmailLight: {
        color: menu.lightMuted,
    },
    closeButton: {
        alignItems: "center",
        borderRadius: 999,
        height: 30,
        justifyContent: "center",
        width: 30,
    },
    section: {
        paddingVertical: spacing.xs,
    },
    row: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 40,
        paddingHorizontal: spacing.md,
    },
    rowLabel: {
        color: "#e5e7eb",
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        letterSpacing: 0,
    },
    rowLabelLight: {
        color: menu.lightInk,
    },
    preferences: {
        borderBottomColor: menu.border,
        borderBottomWidth: 1,
        borderTopColor: menu.border,
        borderTopWidth: 1,
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    preferencesLight: {
        borderBottomColor: menu.lightBorder,
        borderTopColor: menu.lightBorder,
    },
    prefRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    prefLabel: {
        color: "#e5e7eb",
        fontSize: 14,
        fontWeight: "600",
        letterSpacing: 0,
    },
    prefLabelLight: {
        color: menu.lightInk,
    },
    prefMeta: {
        color: menu.muted,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0,
        marginTop: 1,
    },
    prefMetaLight: {
        color: menu.lightMuted,
    },
    switchTrack: {
        alignItems: "flex-end",
        backgroundColor: "#10b981",
        borderRadius: 999,
        height: 26,
        justifyContent: "center",
        paddingHorizontal: 4,
        width: 48,
    },
    switchTrackOff: {
        alignItems: "flex-start",
        backgroundColor: "#e5e7eb",
    },
    switchThumb: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: 999,
        height: 18,
        justifyContent: "center",
        width: 18,
    },
    switchThumbOff: {
        backgroundColor: "#ffffff",
    },
    langRow: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    langPill: {
        alignItems: "center",
        borderColor: menu.border,
        borderRadius: radius.sm,
        borderWidth: 1,
        flex: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 30,
        paddingHorizontal: spacing.sm,
    },
    langPillLight: {
        borderColor: menu.lightBorder,
    },
    langPillActive: {
        borderColor: "#10b981",
    },
    flag: {
        fontSize: 14,
    },
    langText: {
        color: menu.muted,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0,
    },
    langTextLight: {
        color: menu.lightMuted,
    },
    langTextActive: {
        color: menu.active,
    },
    signOutRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 48,
        paddingHorizontal: spacing.md,
    },
    signOutLabel: {
        color: menu.danger,
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0,
    },
});
