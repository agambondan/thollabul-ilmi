import { useCallback, useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateProfile } from "../api/auth";
import { useSession } from "../context/SessionContext";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { preferenceKeys, readPreference } from "../storage/preferences";
import { getThemeColors } from "../theme";
import { useLayoutMode } from "./LayoutModeProvider";
import { MobileAccountMenu } from "./MobileAccountMenu";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { MobileTopHeader } from "./MobileTopHeader";

export function getWebAppAccountLabel(user, guestLabel = "Tamu") {
    const candidate = user?.name || user?.email;
    return candidate?.trim() || guestLabel;
}

export function WebAppShell({
    activeTab,
    children,
    headerConfig,
    internalRoutes,
    keyboardVisible,
    onOpenProfile,
    onTabChange,
    returnRoutes,
}) {
    const { loading, session, signOut, updateCurrentUser, user } = useSession();
    const { t } = useMobileLocale();
    const { isDarkTheme, isWebAppLayout, setThemePreference, themePreference } =
        useLayoutMode();
    const theme = getThemeColors({ isDark: isDarkTheme, isPaperLayout: !isWebAppLayout });
    const [accountMenuVisible, setAccountMenuVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [quranFullscreen, setQuranFullscreen] = useState(false);
    const accountLabel = getWebAppAccountLabel(user, t("account.userGuest"));
    const canSignOut = Boolean(session?.token || user);

    useEffect(() => {
        let mounted = true;
        if (activeTab === "quran") {
            readPreference(preferenceKeys.quranFullscreen, false).then(
                (val) => {
                    if (mounted && typeof val === "boolean")
                        setQuranFullscreen(val);
                },
            );
        } else {
            setQuranFullscreen(false);
        }
        return () => {
            mounted = false;
        };
    }, [activeTab]);

    useEffect(() => {
        StatusBar.setBarStyle(isDarkTheme ? "light-content" : "dark-content");
    }, [isDarkTheme]);

    const closeAccountMenu = useCallback(
        () => setAccountMenuVisible(false),
        [],
    );
    const openAccountMenu = useCallback(() => setAccountMenuVisible(true), []);
    const closeMenu = useCallback(() => setMenuVisible(false), []);
    const openMenu = useCallback(() => setMenuVisible(true), []);
    const openSearch = useCallback(() => {
        onTabChange?.("home", { view: "global-search" });
    }, [onTabChange]);
    const handleMenuSelect = useCallback(
        (item) => {
            setMenuVisible(false);
            if (item?.tab === "profile") {
                onOpenProfile?.();
                return;
            }
            onTabChange?.(item?.tab ?? item?.key, item?.params ?? null);
        },
        [onOpenProfile, onTabChange],
    );
    const handleAccountMenuSelect = useCallback(
        (item) => {
            if (!item?.key) return;
            onTabChange?.("belajar", { featureKey: item.key });
        },
        [onTabChange],
    );
    const handleLanguageSelect = useCallback(
        async (nextLanguage) => {
            if (!user) return;
            try {
                const updatedUser = await updateProfile({
                    preferredLang: nextLanguage,
                });
                await updateCurrentUser?.(updatedUser?.data ?? updatedUser);
            } catch {
                // The local device preference has already been saved; account sync can retry from Profile.
            }
        },
        [updateCurrentUser, user],
    );

    const hideChrome = activeTab === "quran" && quranFullscreen;

    const returnRoute = returnRoutes?.[activeTab];
    let topHeaderProps = {
        accountLabel,
        accountMenuOpen: accountMenuVisible,
        isDarkTheme,
        onOpenAccountMenu: openAccountMenu,
        onOpenMenu: openMenu,
        onOpenSearch: openSearch,
    };

    if (headerConfig?.title || headerConfig?.showBack) {
        topHeaderProps = {
            ...topHeaderProps,
            showBack: true,
            title: headerConfig.title,
            subtitle: headerConfig.subtitle,
            onBack: headerConfig.onBack,
        };
    } else if (activeTab === "profile" && returnRoute) {
        topHeaderProps = {
            ...topHeaderProps,
            showBack: true,
            title: t("profile.title") || "Profil",
            onBack: () => onTabChange?.(returnRoute.tab, returnRoute.params),
        };
    }

    return (
        <SafeAreaView
            edges={["top", "left", "right"]}
            style={[styles.shell, { backgroundColor: theme.surface }]}
            testID='web-app-shell'
        >
            {hideChrome ? null : (
                <MobileTopHeader
                    {...topHeaderProps}
                    isWebAppLayout={isWebAppLayout}
                />
            )}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
                style={[styles.contentWrap, { backgroundColor: theme.bg }]}
            >
                {children}
            </KeyboardAvoidingView>
            {keyboardVisible || hideChrome ? null : (
                <MobileBottomNav
                    active={activeTab}
                    isDarkTheme={isDarkTheme}
                    onChange={onTabChange}
                />
            )}
            <MobileMenuSheet
                accountLabel={accountLabel}
                active={activeTab}
                isDarkTheme={isDarkTheme}
                onClose={closeMenu}
                onSelect={handleMenuSelect}
                visible={menuVisible}
            />
            <MobileAccountMenu
                accountEmail={user?.email}
                accountLabel={accountLabel}
                canSignOut={canSignOut}
                isDarkTheme={isDarkTheme}
                loading={loading}
                onClose={closeAccountMenu}
                onSelectLanguage={handleLanguageSelect}
                onSelectItem={handleAccountMenuSelect}
                onSelectProfile={onOpenProfile}
                onSignOut={signOut}
                onToggleTheme={() =>
                    setThemePreference(isDarkTheme ? "light" : "dark")
                }
                themePreference={themePreference}
                visible={accountMenuVisible}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
    },
    contentWrap: {
        flex: 1,
    },
});
