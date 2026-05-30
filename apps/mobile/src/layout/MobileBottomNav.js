import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, BookOpen, LibraryBig, Menu, Search } from 'lucide-react-native';
import { useMobileLocale } from '../i18n/MobileLocaleProvider';
import { radius, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

const nav = {
  active: '#047857',
  activeBg: '#ecfdf5',
  bg: '#ffffff',
  border: '#f3f4f6',
  inactive: '#6b7280',
  darkActive: '#34d399',
  darkActiveBg: '#064e3b',
  darkBg: '#020617',
  darkBorder: '#1e293b',
  darkInactive: '#94a3b8',
};

export const webDashboardBottomItems = [
  { Icon: BarChart3, key: 'home', label: 'Dashboard', labelKey: 'nav.dashboard' },
  { Icon: BookOpen, key: 'quran', label: 'Al-Quran', labelKey: 'nav.quran' },
  { Icon: LibraryBig, key: 'hadith', label: 'Hadith', labelKey: 'nav.hadith' },
  { Icon: Search, key: 'search', label: 'Cari', labelKey: 'nav.search' },
  { Icon: Menu, key: 'menu', label: 'Menu', labelKey: 'nav.menu' },
];

export function MobileBottomNav({ active, isDarkTheme = false, onChange, onOpenMenu, onOpenSearch }) {
  const insets = useSafeAreaInsets();
  const { t } = useMobileLocale();
  const activeColor = isDarkTheme ? nav.darkActive : nav.active;
  const inactiveColor = isDarkTheme ? nav.darkInactive : nav.inactive;

  return (
    <View
      style={[
        styles.wrap,
        isDarkTheme && styles.wrapDark,
        { paddingBottom: Math.max(insets.bottom, spacing.xs) },
      ]}
      testID="mobile-bottom-nav"
    >
      {webDashboardBottomItems.map((tab) => {
        const selected = active === tab.key;
        const Icon = tab.Icon;
        const isAction = tab.key === 'menu' || tab.key === 'search';
        const label = t(tab.labelKey);

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole={isAction ? 'button' : 'tab'}
            accessibilityState={tab.key === 'menu' ? undefined : { selected }}
            android_ripple={{ color: isDarkTheme ? nav.darkActiveBg : nav.activeBg, borderless: false }}
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
            style={[styles.item, selected && styles.itemActive, selected && isDarkTheme && styles.itemActiveDark]}
          >
            <Icon
              color={selected ? activeColor : inactiveColor}
              size={19}
              strokeWidth={selected ? 2.5 : 1.9}
            />
            <Text
              style={[
                styles.label,
                isDarkTheme && styles.labelDark,
                selected && styles.labelActive,
                selected && isDarkTheme && styles.labelActiveDark,
              ]}
              numberOfLines={1}
            >
              {label}
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
  wrapDark: {
    backgroundColor: nav.darkBg,
    borderTopColor: nav.darkBorder,
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
  itemActiveDark: {
    backgroundColor: nav.darkActiveBg,
  },
  label: {
    color: nav.inactive,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0,
  },
  labelDark: {
    color: nav.darkInactive,
  },
  labelActive: {
    color: nav.active,
    fontWeight: '800',
  },
  labelActiveDark: {
    color: nav.darkActive,
  },
});
