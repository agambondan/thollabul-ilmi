import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    BookOpen,
    GraduationCap,
    HeartHandshake,
    House,
    ScrollText,
} from "lucide-react-native";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { radius, spacing, touchTarget, getThemeColors } from "../theme";
import { hapticSelection } from "../utils/haptics";

export const webDashboardBottomItems = [
    {
        Icon: House,
        key: "home",
        label: "Beranda",
        labelKey: "nav.dashboard",
    },
    { Icon: BookOpen, key: "quran", label: "Al-Quran", labelKey: "nav.quran" },
    {
        Icon: ScrollText,
        key: "hadith",
        label: "Hadis",
        labelKey: "nav.hadith",
    },
    { Icon: HeartHandshake, key: "ibadah", label: "Ibadah", labelKey: "nav.ibadah" },
    { Icon: GraduationCap, key: "belajar", label: "Belajar", labelKey: "nav.belajar" },
];

export function MobileBottomNav({
    active,
    isDarkTheme = false,
    isWebAppLayout = true,
    onChange,
}) {
    const insets = useSafeAreaInsets();
    const { t } = useMobileLocale();
    const theme = getThemeColors({ isDark: isDarkTheme, isPaperLayout: !isWebAppLayout });
    const activeColor = theme.primary;
    const activeBg = theme.primaryBg;
    const inactiveColor = theme.muted;
    const borderColor = theme.border;
    const rippleColor = theme.ripple;

    return (
        <View
            style={[
                styles.wrap,
                { backgroundColor: theme.bg, borderTopColor: borderColor },
                { paddingBottom: Math.max(insets.bottom, spacing.sm) },
            ]}
            testID='mobile-bottom-nav'
        >
            {webDashboardBottomItems.map((tab) => {
                const selected = active === tab.key;
                const Icon = tab.Icon;
                const label = t(tab.labelKey);

                return (
                    <Pressable
                        accessibilityHint={selected ? "Tab aktif saat ini" : `Buka tab ${label}`}
                        accessibilityLabel={label}
                        accessibilityRole='tab'
                        accessibilityState={{ selected }}
                        android_ripple={{
                            color: rippleColor,
                            borderless: false,
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        key={tab.key}
                        onPress={() => {
                            if (!selected) hapticSelection();
                            onChange?.(tab.key);
                        }}
                        style={styles.item}
                    >
                        <View
                            style={[
                                styles.iconWrap,
                                selected && { backgroundColor: activeBg },
                            ]}
                        >
                            <Icon
                                color={selected ? activeColor : inactiveColor}
                                size={20}
                                strokeWidth={selected ? 2.3 : 1.9}
                            />
                        </View>
                        <Text
                            style={[
                                styles.label,
                                { color: selected ? activeColor : inactiveColor },
                                selected && styles.labelActive,
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
        alignItems: "center",
        borderTopWidth: 1,
        flexDirection: "row",
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.sm,
    },
    item: {
        alignItems: "center",
        flex: 1,
        gap: 3,
        justifyContent: "center",
        minHeight: touchTarget,
        paddingHorizontal: spacing.xs,
        paddingVertical: 4,
    },
    iconWrap: {
        alignItems: "center",
        borderRadius: radius.full,
        justifyContent: "center",
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0,
    },
    labelActive: {
        fontWeight: "700",
    },
});