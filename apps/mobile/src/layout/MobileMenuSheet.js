import {
  BookOpen,
  GraduationCap,
  HandHeart,
  Home,
  LibraryBig,
  UserRound,
  X,
} from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

export const webAppMenuItems = [
  { Icon: Home, key: 'home', label: 'Beranda' },
  { Icon: BookOpen, key: 'quran', label: "Al-Qur'an" },
  { Icon: LibraryBig, key: 'hadith', label: 'Hadis' },
  { Icon: HandHeart, key: 'ibadah', label: 'Ibadah' },
  { Icon: GraduationCap, key: 'belajar', label: 'Belajar' },
  { Icon: UserRound, key: 'profile', label: 'Profil & Pengaturan' },
];

const sheet = {
  active: '#007f63',
  backdrop: 'rgba(15, 23, 42, 0.36)',
  border: '#d1fae5',
  ink: '#0f172a',
  muted: '#64748b',
  surface: '#ffffff',
};

export function MobileMenuSheet({ active, onClose, onSelect, visible }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot} testID="mobile-menu-sheet">
        <Pressable
          accessibilityLabel="Tutup menu"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
          testID="mobile-menu-sheet-backdrop"
        />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Menu</Text>
              <Text style={styles.subtitle}>Pilih area aplikasi</Text>
            </View>
            <Pressable
              accessibilityLabel="Tutup menu"
              accessibilityRole="button"
              android_ripple={{ color: '#e9fff5', borderless: true }}
              onPress={onClose}
              style={styles.closeButton}
              testID="mobile-menu-sheet-close"
            >
              <X color={sheet.muted} size={19} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {webAppMenuItems.map((item) => {
              const selected = active === item.key;
              const Icon = item.Icon;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  android_ripple={{ color: '#e9fff5', borderless: false }}
                  key={item.key}
                  onPress={() => {
                    if (!selected) hapticSelection();
                    onSelect(item.key);
                  }}
                  style={[styles.item, selected && styles.itemActive]}
                  testID={`mobile-menu-item-${item.key}`}
                >
                  <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
                    <Icon color={selected ? sheet.active : sheet.muted} size={20} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.itemLabel, selected && styles.itemLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: sheet.backdrop,
  },
  sheet: {
    backgroundColor: sheet.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: sheet.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: sheet.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    alignItems: 'center',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 84,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  itemActive: {
    backgroundColor: '#ecfdf5',
    borderColor: sheet.border,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  iconWrapActive: {
    backgroundColor: '#d1fae5',
  },
  itemLabel: {
    color: sheet.ink,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
  },
  itemLabelActive: {
    color: sheet.active,
    fontWeight: '900',
  },
});
