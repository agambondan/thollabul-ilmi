import { useCallback, useEffect, useRef, useState } from "react";
import {
    BookOpen,
    GraduationCap,
    HandHeart,
    Home,
    LibraryBig,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing, touchTarget, getThemeColors } from "../theme";
import { useTabActivity } from "../context/TabActivityContext";
import { hapticSelection } from "../utils/haptics";

export const tabs = [
    { Icon: Home, key: "home", label: "Beranda" },
    { Icon: BookOpen, key: "quran", label: "Al-Qur'an" },
    { Icon: LibraryBig, key: "hadith", label: "Hadis" },
    { Icon: HandHeart, key: "ibadah", label: "Ibadah" },
    { Icon: GraduationCap, key: "belajar", label: "Belajar" },
];

const AUTO_HIDE_DELAY = 2800;

export function TabBar({ active, isDarkTheme = false, onChange }) {
    const theme = getThemeColors({ isDark: isDarkTheme, isPaperLayout: true });
    const navColors = {
        active: theme.ink,
        activeBg: theme.primaryBg ?? theme.surfaceMuted,
        inactive: theme.muted,
        border: theme.border,
        bg: theme.bg,
    };
    const insets = useSafeAreaInsets();
    const { activityTick } = useTabActivity();
    const hideTimer = useRef(null);
    const [visible, setVisible] = useState(true);

    const clearHideTimer = useCallback(() => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
    }, []);

    const scheduleHide = useCallback(() => {
        clearHideTimer();
        hideTimer.current = setTimeout(
            () => setVisible(false),
            AUTO_HIDE_DELAY,
        );
    }, [clearHideTimer]);

    const reveal = useCallback(() => {
        setVisible(true);
        scheduleHide();
    }, [scheduleHide]);

    useEffect(() => {
        reveal();
        return clearHideTimer;
    }, [active, clearHideTimer, reveal]);

    useEffect(() => {
        if (!activityTick) return;
        reveal();
    }, [activityTick, reveal]);

    if (!visible) {
        return (
            <View
                pointerEvents='none'
                style={[
                    styles.hiddenWrap,
                    {
                        backgroundColor: navColors.bg,
                        paddingBottom: Math.max(insets.bottom, spacing.xs),
                    },
                ]}
            />
        );
    }

    return (
        <View
            style={[
                styles.wrap,
                {
                    backgroundColor: navColors.bg,
                    borderTopColor: navColors.border,
                    paddingBottom: Math.max(insets.bottom, spacing.sm),
                },
            ]}
        >
            {tabs.map((tab) => {
                const selected = active === tab.key;
                const Icon = tab.Icon;
                return (
                    <Pressable
                        accessibilityLabel={tab.label}
                        accessibilityRole='tab'
                        accessibilityState={{ selected }}
                        android_ripple={{
                            color: navColors.activeBg,
                            borderless: false,
                        }}
                        key={tab.key}
                        onPress={() => {
                            if (!selected) hapticSelection();
                            onChange(tab.key);
                            reveal();
                        }}
                        style={styles.item}
                    >
                        <View
                            style={[
                                styles.iconWrap,
                                selected && {
                                    backgroundColor: navColors.activeBg,
                                },
                            ]}
                        >
                            <Icon
                                color={
                                    selected
                                        ? navColors.active
                                        : navColors.inactive
                                }
                                size={20}
                                strokeWidth={selected ? 2.5 : 1.9}
                            />
                        </View>
                        {selected ? (
                            <Text
                                style={[
                                    styles.label,
                                    { color: navColors.active },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        ) : null}
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
    hiddenWrap: {
        minHeight: 6,
    },
    item: {
        alignItems: "center",
        flex: 1,
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: touchTarget,
        paddingVertical: spacing.xs,
    },
    iconWrap: {
        alignItems: "center",
        borderRadius: radius.md,
        height: 44,
        justifyContent: "center",
        width: 44,
    },
    label: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0,
    },
});
