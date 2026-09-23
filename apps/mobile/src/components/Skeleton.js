import { StyleSheet, View } from "react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { colors, radius, spacing } from "../theme";

const SHIMMER_DURATION = 1200;

export function Skeleton({ style, children }) {
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        animation.setValue(0);
        Animated.timing(animation, {
            toValue: 1,
            duration: SHIMMER_DURATION,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                animation.setValue(0);
            }
        });
    }, [animation]);

    return (
        <View style={[styles.container, style]}>{children}</View>
    );
}

export function SkeletonLine({ width = "100%", height = 14, style }) {
    return (
        <Skeleton style={[styles.line, { width, height }, style]} />
    );
}

export function SkeletonCircle({ size = 40, style }) {
    return (
        <Skeleton style={[styles.circle, { width: size, height: size }, style]} />
    );
}

export function SkeletonRect({ width = "100%", height = 100, style }) {
    return (
        <Skeleton style={[styles.rect, { width, height }, style]} />
    );
}

export function SkeletonCard({ style }) {
    return (
        <View style={[styles.card, style]}>
            <SkeletonLine width="60%" />
            <View style={styles.gap} />
            <SkeletonLine width="40%" />
            <View style={styles.gapLg} />
            <SkeletonLine width="80%" />
            <View style={styles.gap} />
            <SkeletonLine width="50%" />
        </View>
    );
}

export function SkeletonListItem({ style, showThumbnail = true }) {
    return (
        <View style={[styles.listItem, style]}>
            {showThumbnail && <SkeletonCircle size={48} />}
            <View style={styles.listItemContent}>
                <SkeletonLine width="70%" height={16} />
                <View style={styles.gap} />
                <SkeletonLine width="50%" height={12} />
            </View>
        </View>
    );
}

const Easing = {
    linear: (t) => t,
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.faint,
        borderRadius: radius.sm,
        overflow: "hidden",
    },
    line: {
        borderRadius: radius.sm,
    },
    circle: {
        borderRadius: 9999,
    },
    rect: {
        borderRadius: radius.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
    },
    gap: {
        height: spacing.sm,
    },
    gapLg: {
        height: spacing.md,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        paddingVertical: spacing.md,
    },
    listItemContent: {
        flex: 1,
    },
});