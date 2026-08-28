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
import { radius, spacing } from "../theme";
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

const nav = {
    active: "#3c3a35",
    activeBg: "#ebe4d4",
    inactive: "#9b9487",
    border: "#e6e2d6",
    bg: "#fffdf8",
};

export function TabBar({ active, onChange }) {
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
                    { paddingBottom: Math.max(insets.bottom, spacing.xs) },
                ]}
            />
        );
    }

    return (
        <View
            style={[
                styles.wrap,
                { paddingBottom: Math.max(insets.bottom, spacing.sm) },
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
                            color: nav.activeBg,
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
                                selected && styles.iconWrapActive,
                            ]}
                        >
                            <Icon
                                color={selected ? nav.active : nav.inactive}
                                size={20}
                                strokeWidth={selected ? 2.5 : 1.9}
                            />
                        </View>
                        {selected ? (
                            <Text style={styles.label}>{tab.label}</Text>
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
        backgroundColor: nav.bg,
        borderTopColor: nav.border,
        borderTopWidth: 1,
        flexDirection: "row",
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.sm,
    },
    hiddenWrap: {
        backgroundColor: nav.bg,
        minHeight: 6,
    },
    item: {
        alignItems: "center",
        flex: 1,
        gap: 3,
        justifyContent: "center",
        minHeight: 52,
        paddingVertical: spacing.xs,
    },
    iconWrap: {
        alignItems: "center",
        borderRadius: radius.md,
        height: 34,
        justifyContent: "center",
        width: 46,
    },
    iconWrapActive: {
        backgroundColor: nav.activeBg,
    },
    label: {
        color: nav.active,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0,
    },
});
