import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { hapticTap } from "../utils/haptics";
import { AppModalSheet } from "./AppModalSheet";

export function ActionSheetRow({
    Icon,
    title,
    subtitle,
    active = false,
    disabled = false,
    onPress,
    style,
    iconStyle,
    titleStyle,
    subtitleStyle,
    children,
}) {
    return (
        <Pressable
            accessibilityRole='button'
            accessibilityState={{ disabled, selected: active }}
            android_ripple={{
                color: "rgba(91, 110, 91, 0.12)",
                borderless: false,
            }}
            disabled={disabled}
            onPress={(event) => {
                hapticTap();
                onPress?.(event);
            }}
            style={[
                styles.row,
                active && styles.rowActive,
                disabled && styles.disabled,
                style,
            ]}
        >
            {Icon ? (
                <View style={[styles.rowIcon, iconStyle]}>
                    <Icon
                        color={active ? colors.onPrimary : colors.primary}
                        size={18}
                        strokeWidth={2.3}
                    />
                </View>
            ) : null}
            <View style={styles.rowCopy}>
                <Text
                    style={[
                        styles.rowTitle,
                        active && styles.rowTitleActive,
                        titleStyle,
                    ]}
                >
                    {title}
                </Text>
                {subtitle ? (
                    <Text
                        style={[
                            styles.rowSubtitle,
                            active && styles.rowSubtitleActive,
                            subtitleStyle,
                        ]}
                    >
                        {subtitle}
                    </Text>
                ) : null}
                {children}
            </View>
        </Pressable>
    );
}

export function AppActionSheet({
    visible,
    onClose,
    title,
    subtitle,
    children,
    footer,
    contentStyle,
    sheetStyle,
    titleStyle,
    subtitleStyle,
    closeLabel = "Tutup",
    maxHeight = "80%",
}) {
    return (
        <AppModalSheet
            closeLabel={closeLabel}
            contentStyle={contentStyle}
            footer={footer}
            maxHeight={maxHeight}
            onClose={onClose}
            sheetStyle={sheetStyle}
            subtitle={subtitle}
            subtitleStyle={subtitleStyle}
            title={title}
            titleStyle={titleStyle}
            visible={visible}
        >
            {children}
        </AppModalSheet>
    );
}

const styles = StyleSheet.create({
    row: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        marginBottom: spacing.sm,
        minHeight: 58,
        padding: spacing.md,
    },
    rowActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    disabled: {
        opacity: 0.58,
    },
    rowIcon: {
        alignItems: "center",
        justifyContent: "center",
        width: 24,
    },
    rowCopy: {
        flex: 1,
        marginLeft: spacing.md,
    },
    rowTitle: {
        color: colors.ink,
        fontSize: 15,
        fontWeight: "700",
    },
    rowTitleActive: {
        color: colors.onPrimary,
    },
    rowSubtitle: {
        color: colors.muted,
        fontSize: 13,
        marginTop: 2,
    },
    rowSubtitleActive: {
        color: colors.onPrimary,
        opacity: 0.82,
    },
});
