import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../context/SessionContext';
import { colors } from '../theme';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';
import { MobileTopHeader } from './MobileTopHeader';

export function getWebAppAccountLabel(user) {
  const candidate = user?.name || user?.email;
  return candidate?.trim() || 'Tamu';
}

export function WebAppShell({ activeTab, children, keyboardVisible, onOpenProfile, onTabChange }) {
  const { user } = useSession();
  const [menuVisible, setMenuVisible] = useState(false);

  const closeMenu = useCallback(() => setMenuVisible(false), []);
  const openMenu = useCallback(() => setMenuVisible(true), []);
  const handleMenuSelect = useCallback(
    (key) => {
      setMenuVisible(false);
      if (key === 'profile') {
        onOpenProfile?.();
        return;
      }
      onTabChange?.(key);
    },
    [onOpenProfile, onTabChange],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="web-app-shell">
      <MobileTopHeader
        accountLabel={getWebAppAccountLabel(user)}
        onOpenMenu={openMenu}
        onOpenProfile={onOpenProfile}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.container}
      >
        {children}
      </KeyboardAvoidingView>
      {keyboardVisible ? null : <MobileBottomNav active={activeTab} onChange={onTabChange} />}
      <MobileMenuSheet
        active={activeTab}
        onClose={closeMenu}
        onSelect={handleMenuSelect}
        visible={menuVisible}
      />
      <StatusBar style="dark" backgroundColor={colors.bg} />
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
