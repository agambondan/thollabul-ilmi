import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    BarChart3,
    BookOpen,
    GraduationCap,
    HandHeart,
    LibraryBig,
} from "lucide-react-native";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { radius, spacing, touchTarget, getThemeColors } from "../theme";
import { hapticSelection } from "../utils/haptics";

export const webDashboardBottomItems = [
    {
        Icon: BarChart3,
        key: "home",
        label: "Beranda",
        labelKey: "nav.dashboard",
    },
    { Icon: BookOpen, key: "quran", label: "Al-Quran", labelKey: "nav.quran" },
    {
        Icon: LibraryBig,
        key: "hadith",
        label: "Hadis",
        labelKey: "nav.hadith",
    },
    { Icon: HandHeart, key: "ibadah", label: "Ibadah", labelKey: "nav.ibadah" },
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
                        accessibilityLabel={label}
                        accessibilityRole='tab'
                        accessibilityState={{ selected }}
                        android_ripple={{
                            color: activeBg,
                            borderless: false,
                        }}
                        key={tab.key}
                        onPress={() => {
                            if (!selected) hapticSelection();
                            onChange?.(tab.key);
                        }}
                        style={[
                            styles.item,
                            selected && { backgroundColor: activeBg },
                        ]}
                    >
                        <Icon
                            color={selected ? activeColor : inactiveColor}
                            size={19}
                            strokeWidth={selected ? 2.5 : 1.9}
                        />
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
        borderRadius: radius.md,
        flex: 1,
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: touchTarget,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    label: {
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0,
    },
    labelActive: {
        fontWeight: "800",
    },
});