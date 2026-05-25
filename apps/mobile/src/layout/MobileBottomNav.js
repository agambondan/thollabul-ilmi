import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, BookOpen, LibraryBig, Menu, Search } from 'lucide-react-native';
import { radius, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

const nav = {
  active: '#34d399',
  activeBg: 'rgba(16, 185, 129, 0.18)',
  bg: '#0f172a',
  border: '#1f2937',
  inactive: '#cbd5e1',
};

export const webDashboardBottomItems = [
  { Icon: BarChart3, key: 'home', label: 'Dashboard' },
  { Icon: BookOpen, key: 'quran', label: 'Al-Quran' },
  { Icon: LibraryBig, key: 'hadith', label: 'Hadith' },
  { Icon: Search, key: 'search', label: 'Cari' },
  { Icon: Menu, key: 'menu', label: 'Menu' },
];

export function MobileBottomNav({ active, onChange, onOpenMenu, onOpenSearch }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}
      testID="mobile-bottom-nav"
    >
      {webDashboardBottomItems.map((tab) => {
        const selected = active === tab.key;
        const Icon = tab.Icon;
        const isAction = tab.key === 'menu' || tab.key === 'search';

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole={isAction ? 'button' : 'tab'}
            accessibilityState={tab.key === 'menu' ? undefined : { selected }}
            android_ripple={{ color: nav.activeBg, borderless: false }}
            key={tab.key}
            onPress={() => {
              if (!selected || isAction) hapticSelection();
              if (tab.key === 'menu') {
                onOpenMenu?.();
                return;
              }
              if (tab.key === 'search') {
                onOpenSearch?.();
                return;
              }
              onChange?.(tab.key);
            }}
            style={[styles.item, selected && styles.itemActive]}
          >
            <Icon
              color={selected ? nav.active : nav.inactive}
              size={19}
              strokeWidth={selected ? 2.5 : 1.9}
            />
            <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: nav.bg,
    borderTopColor: nav.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 2,
    paddingVertical: spacing.xs,
  },
  itemActive: {
    backgroundColor: nav.activeBg,
  },
  label: {
    color: nav.inactive,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0,
  },
  labelActive: {
    color: nav.active,
    fontWeight: '800',
  },
});
