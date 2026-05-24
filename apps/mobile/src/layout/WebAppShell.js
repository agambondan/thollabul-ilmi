import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileTopHeader } from './MobileTopHeader';

export function WebAppShell({ activeTab, children, keyboardVisible, onOpenProfile, onTabChange }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="web-app-shell">
      <MobileTopHeader onOpenProfile={onOpenProfile} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.container}
      >
        {children}
      </KeyboardAvoidingView>
      {keyboardVisible ? null : <MobileBottomNav active={activeTab} onChange={onTabChange} />}
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
