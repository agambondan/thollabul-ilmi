import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../context/SessionContext';
import { colors } from '../theme';
import { MobileAccountMenu } from './MobileAccountMenu';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';
import { MobileTopHeader } from './MobileTopHeader';

export function getWebAppAccountLabel(user) {
  const candidate = user?.name || user?.email;
  return candidate?.trim() || 'Tamu';
}

export function WebAppShell({ activeTab, children, keyboardVisible, onOpenProfile, onTabChange }) {
  const { loading, signOut, user } = useSession();
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const accountLabel = getWebAppAccountLabel(user);

  const closeAccountMenu = useCallback(() => setAccountMenuVisible(false), []);
  const openAccountMenu = useCallback(() => setAccountMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);
  const openMenu = useCallback(() => setMenuVisible(true), []);
  const openSearch = useCallback(() => {
    onTabChange?.('home', { view: 'global-search' });
  }, [onTabChange]);
  const handleMenuSelect = useCallback(
    (item) => {
      setMenuVisible(false);
      if (item?.tab === 'profile') {
        onOpenProfile?.();
        return;
      }
      onTabChange?.(item?.tab ?? item?.key, item?.params ?? null);
    },
    [onOpenProfile, onTabChange],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="web-app-shell">
      <MobileTopHeader
        accountMenuOpen={accountMenuVisible}
        accountLabel={accountLabel}
        onOpenAccountMenu={openAccountMenu}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.container}
      >
        {children}
      </KeyboardAvoidingView>
      {keyboardVisible ? null : (
        <MobileBottomNav
          active={activeTab}
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
        loading={loading}
        onClose={closeAccountMenu}
        onSelectProfile={onOpenProfile}
        onSignOut={signOut}
        visible={accountMenuVisible}
      />
      <StatusBar style="light" backgroundColor="#0f172a" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
});
