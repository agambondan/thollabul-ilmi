import {
  Bell,
  BookMarked,
  FileText,
  LogOut,
  Moon,
  UserRound,
  BarChart3,
  X,
} from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

const menu = {
  active: '#34d399',
  backdrop: 'rgba(2, 6, 23, 0.22)',
  border: '#334155',
  danger: '#f87171',
  ink: '#f8fafc',
  muted: '#94a3b8',
  surface: '#1e293b',
};

const accountItems = [
  { Icon: UserRound, key: 'profile', label: 'Profil' },
  { Icon: BookMarked, key: 'bookmarks', label: 'Bookmark' },
  { Icon: FileText, key: 'notes', label: 'Catatan' },
  { Icon: BarChart3, key: 'stats', label: 'Statistik' },
  { Icon: Bell, key: 'notifications', label: 'Notifikasi' },
];

export function MobileAccountMenu({
  accountEmail,
  accountLabel = 'Tamu',
  loading = false,
  onClose,
  onSelectProfile,
  onSignOut,
  visible,
}) {
  const normalizedAccountLabel = accountLabel?.trim() || 'Tamu';
  const accountInitial = normalizedAccountLabel.slice(0, 1).toUpperCase();
  const subtitle = accountEmail?.trim() || 'Belum masuk';

  const handleProfileItem = () => {
    hapticSelection();
    onClose?.();
    onSelectProfile?.();
  };

  const handleSignOut = () => {
    hapticSelection();
    onClose?.();
    onSignOut?.();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.root} pointerEvents="box-none" testID="mobile-account-menu">
        <Pressable
          accessibilityLabel="Tutup menu akun"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
          testID="mobile-account-menu-backdrop"
        />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{accountInitial}</Text>
            </View>
            <View style={styles.accountCopy}>
              <Text numberOfLines={1} style={styles.accountName}>
                {normalizedAccountLabel}
              </Text>
              <Text numberOfLines={1} style={styles.accountEmail}>
                {subtitle}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Tutup menu akun"
              accessibilityRole="button"
              android_ripple={{ color: '#334155', borderless: true }}
              onPress={onClose}
              style={styles.closeButton}
              testID="mobile-account-menu-close"
            >
              <X color={menu.muted} size={17} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.section}>
            {accountItems.map((item) => {
              const Icon = item.Icon;
              return (
                <Pressable
                  accessibilityRole="button"
                  android_ripple={{ color: '#334155', borderless: false }}
                  key={item.key}
                  onPress={handleProfileItem}
                  style={styles.row}
                  testID={`mobile-account-menu-item-${item.key}`}
                >
                  <Icon color={menu.muted} size={17} strokeWidth={1.9} />
                  <Text style={styles.rowLabel}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.preferences}>
            <View style={styles.prefRow}>
              <Text style={styles.prefLabel}>Gelap</Text>
              <View style={styles.switchTrack}>
                <View style={styles.switchThumb}>
                  <Moon color="#0f766e" size={12} strokeWidth={2.4} />
                </View>
              </View>
            </View>
            <View style={styles.langRow}>
              <Pressable accessibilityRole="button" style={[styles.langPill, styles.langPillActive]}>
                <Text style={styles.flag}>🇮🇩</Text>
                <Text style={[styles.langText, styles.langTextActive]}>Indonesia</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.langPill}>
                <Text style={styles.flag}>🇬🇧</Text>
                <Text style={styles.langText}>English</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Keluar"
            accessibilityRole="button"
            android_ripple={{ color: '#334155', borderless: false }}
            disabled={loading}
            onPress={handleSignOut}
            style={styles.signOutRow}
            testID="mobile-account-menu-sign-out"
          >
            <LogOut color={menu.danger} size={17} strokeWidth={2} />
            <Text style={styles.signOutLabel}>{loading ? 'Keluar...' : 'Keluar'}</Text>
          </Pressable>
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
  card: {
    alignSelf: 'flex-end',
    backgroundColor: menu.surface,
    borderColor: menu.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginRight: spacing.md,
    marginTop: spacing.xl,
    maxWidth: 288,
    overflow: 'hidden',
    width: '64%',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: menu.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    color: menu.ink,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  accountEmail: {
    color: menu.muted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 1,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  section: {
    paddingVertical: spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  rowLabel: {
    color: '#e5e7eb',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
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
  prefRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prefLabel: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  switchTrack: {
    alignItems: 'flex-end',
    backgroundColor: '#10b981',
    borderRadius: 999,
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 4,
    width: 48,
  },
  switchThumb: {
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  langPill: {
    alignItems: 'center',
    borderColor: menu.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: spacing.sm,
  },
  langPillActive: {
    borderColor: '#10b981',
  },
  flag: {
    fontSize: 14,
  },
  langText: {
    color: menu.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  langTextActive: {
    color: menu.active,
  },
  signOutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  signOutLabel: {
    color: menu.danger,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
