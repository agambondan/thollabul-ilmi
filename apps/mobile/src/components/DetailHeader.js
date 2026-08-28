import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { hapticTap } from "../utils/haptics";

export function DetailHeader({
    title,
    subtitle,
    meta,
    onBack,
    actions,
    backLabel = "Kembali",
    style,
    titleStyle,
    subtitleStyle,
    metaStyle,
}) {
    return (
        <View style={[styles.header, style]}>
            <View style={styles.copy}>
                <View style={styles.titleRow}>
                    {onBack ? (
                        <Pressable
                            accessibilityLabel={backLabel}
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: true,
                            }}
                            hitSlop={8}
                            onPress={(event) => {
                                hapticTap();
                                onBack(event);
                            }}
                            style={styles.backButton}
                        >
                            <ArrowLeft
                                color={colors.primary}
                                size={18}
                                strokeWidth={2.3}
                            />
                        </Pressable>
                    ) : null}
                    <Text numberOfLines={2} style={[styles.title, titleStyle]}>
                        {title}
                    </Text>
                    {meta ? (
                        <Text
                            numberOfLines={1}
                            style={[styles.meta, metaStyle]}
                        >
                            {meta}
                        </Text>
                    ) : null}
                </View>
                {subtitle ? (
                    <Text
                        numberOfLines={2}
                        style={[styles.subtitle, subtitleStyle]}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: "center",
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
    },
    copy: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
    backButton: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    title: {
        color: colors.ink,
        flex: 1,
        fontFamily: "serif",
        fontSize: 20,
        fontWeight: "900",
        minWidth: 0,
    },
    subtitle: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.xs,
    },
    meta: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "900",
        marginLeft: spacing.xs,
        maxWidth: "34%",
        textAlign: "right",
    },
    actions: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
});
