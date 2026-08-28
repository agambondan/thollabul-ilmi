import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export function SectionHeader({
    title,
    meta,
    subtitle,
    actions,
    style,
    titleStyle,
    metaStyle,
    subtitleStyle,
}) {
    return (
        <View style={[styles.header, style]}>
            <View style={styles.copy}>
                <View style={styles.titleRow}>
                    {title ? (
                        <Text
                            numberOfLines={2}
                            style={[styles.title, titleStyle]}
                        >
                            {title}
                        </Text>
                    ) : null}
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
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    copy: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
    },
    title: {
        color: colors.ink,
        flex: 1,
        fontSize: 14,
        fontWeight: "900",
        minWidth: 0,
    },
    meta: {
        color: colors.primary,
        flexShrink: 0,
        fontSize: 12,
        fontWeight: "800",
        maxWidth: "42%",
        textAlign: "right",
        textTransform: "capitalize",
    },
    subtitle: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 2,
    },
    actions: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
    },
});
