import { ChevronDown } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../theme';

const header = {
  bg: '#ffffff',
  border: '#f3f4f6',
  brand: '#007f63',
  ink: '#111827',
  muted: '#9ca3af',
};

export function MobileTopHeader({ accountLabel = 'T', accountMenuOpen = false, onOpenAccountMenu }) {
  const normalizedAccountLabel = accountLabel?.trim() || 'T';

  return (
    <View style={styles.wrap} testID="mobile-top-header">
      <View style={styles.brandGroup}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>ط</Text>
        </View>
        <Text style={styles.brandName} numberOfLines={1}>
          Thullaabul 'Ilmi
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Buka menu akun"
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(17, 24, 39, 0.08)', borderless: true }}
          onPress={onOpenAccountMenu}
          style={styles.accountButton}
          testID="mobile-top-header-profile"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText} numberOfLines={1}>
              {normalizedAccountLabel.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <ChevronDown
            color={header.muted}
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
    alignItems: 'center',
    backgroundColor: header.bg,
    borderBottomColor: header.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  brandGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: header.brand,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  brandName: {
    color: header.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  accountButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: header.brand,
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
});
