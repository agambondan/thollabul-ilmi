import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabs } from '../components/TabBar';
import { radius, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

const nav = {
  active: '#007f63',
  activeBg: '#e9fff5',
  bg: '#ffffff',
  border: '#e5e7eb',
  inactive: '#64748b',
};

export function MobileBottomNav({ active, onChange }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}
      testID="mobile-bottom-nav"
    >
      {tabs.map((tab) => {
        const selected = active === tab.key;
        const Icon = tab.Icon;

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            android_ripple={{ color: nav.activeBg, borderless: false }}
            key={tab.key}
            onPress={() => {
              if (!selected) hapticSelection();
              onChange(tab.key);
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
