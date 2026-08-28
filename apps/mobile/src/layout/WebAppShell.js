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
import { colors } from "../theme";
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
    keyboardVisible,
    onOpenProfile,
    onTabChange,
}) {
    const { loading, session, signOut, updateCurrentUser, user } = useSession();
    const { t } = useMobileLocale();
    const { isDarkTheme, setThemePreference, themePreference } =
        useLayoutMode();
    const [accountMenuVisible, setAccountMenuVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const accountLabel = getWebAppAccountLabel(user, t("account.userGuest"));
    const canSignOut = Boolean(session?.token || user);

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

    return (
        <SafeAreaView
            edges={["top", "left", "right"]}
            style={[styles.safeArea, isDarkTheme && styles.safeAreaDark]}
            testID='web-app-shell'
        >
            <MobileTopHeader
                accountMenuOpen={accountMenuVisible}
                accountLabel={accountLabel}
                isDarkTheme={isDarkTheme}
                onOpenAccountMenu={openAccountMenu}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
                style={[styles.container, isDarkTheme && styles.containerDark]}
            >
                {children}
            </KeyboardAvoidingView>
            {keyboardVisible ? null : (
                <MobileBottomNav
                    active={activeTab}
                    isDarkTheme={isDarkTheme}
                    onChange={onTabChange}
                    onOpenMenu={openMenu}
                    onOpenSearch={openSearch}
                />
            )}
            <MobileMenuSheet
                accountLabel={accountLabel}
                active={activeTab}
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
    safeArea: {
        backgroundColor: "#ffffff",
        flex: 1,
    },
    safeAreaDark: {
        backgroundColor: "#020617",
    },
    container: {
        backgroundColor: colors.bg,
        flex: 1,
    },
    containerDark: {
        backgroundColor: "#020617",
    },
});
