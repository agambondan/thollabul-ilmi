import { useEffect, useRef } from "react";
import {
    AccessibilityInfo,
    Animated,
    findNodeHandle,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { X } from "lucide-react-native";
import { colors, spacing } from "../theme";
import { hapticTap } from "../utils/haptics";

const DRAG_THRESHOLD = 100;

export function AppModalSheet({
    visible,
    onClose,
    title,
    subtitle,
    children,
    footer,
    stickyFooter = true,
    scroll = true,
    maxHeight = "80%",
    closeLabel = "Tutup",
    contentStyle,
    headerStyle,
    sheetStyle,
    titleStyle,
    subtitleStyle,
}) {
    const shouldStickFooter = Boolean(footer) && stickyFooter;
    const Body = scroll ? ScrollView : View;
    const bodyProps = scroll
        ? {
              contentContainerStyle: [styles.content, contentStyle],
              showsVerticalScrollIndicator: false,
              style: styles.scrollBody,
          }
        : { style: [styles.content, styles.staticBody, contentStyle] };

    return (
        <ModalSheetInner
            visible={visible}
            onClose={onClose}
            title={title}
            subtitle={subtitle}
            children={children}
            footer={footer}
            stickyFooter={shouldStickFooter}
            Body={Body}
            bodyProps={bodyProps}
            maxHeight={maxHeight}
            closeLabel={closeLabel}
            headerStyle={headerStyle}
            sheetStyle={sheetStyle}
            titleStyle={titleStyle}
            subtitleStyle={subtitleStyle}
            scroll={scroll}
        />
    );
}

function ModalSheetInner({
    visible,
    onClose,
    title,
    subtitle,
    children,
    footer,
    stickyFooter,
    Body,
    bodyProps,
    maxHeight,
    closeLabel,
    headerStyle,
    sheetStyle,
    titleStyle,
    subtitleStyle,
    scroll,
}) {
    const panY = useRef(new Animated.Value(0)).current;
    const isDragging = useRef(false);
    const headerRef = useRef(null);

    /*
     * Move the screen reader into the sheet when it opens. Without this the
     * cursor stays on whatever opened it, so a TalkBack/VoiceOver user hears
     * nothing change and keeps reading the screen behind — which
     * accessibilityViewIsModal has just hidden from them.
     */
    useEffect(() => {
        if (!visible) return undefined;
        const timer = setTimeout(() => {
            const node = findNodeHandle(headerRef.current);
            if (node) AccessibilityInfo.setAccessibilityFocus(node);
        }, 250);
        return () => clearTimeout(timer);
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gesture) => {
                return gesture.dy > 5 && gesture.dy > Math.abs(gesture.dx);
            },
            onPanResponderGrant: () => {
                isDragging.current = true;
                panY.setOffset(0);
                panY.setValue(0);
            },
            onPanResponderMove: Animated.event([null, { dy: panY }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: (_, gesture) => {
                isDragging.current = false;
                panY.flattenOffset();
                if (gesture.dy > DRAG_THRESHOLD) {
                    Animated.timing(panY, {
                        toValue: 600,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => onClose?.());
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                isDragging.current = false;
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        }),
    ).current;

    return (
        <Modal
            animationType='slide'
            onRequestClose={onClose}
            transparent
            visible={visible}
        >
            <Pressable
                accessibilityLabel={closeLabel}
                accessibilityRole='button'
                onPress={onClose}
                style={styles.overlay}
            />
            <Animated.View
                accessibilityLabel={title}
                accessibilityViewIsModal
                accessibilityRole={undefined}
                importantForAccessibility='yes'
                style={[
                    styles.sheet,
                    { maxHeight, transform: [{ translateY: panY }] },
                    sheetStyle,
                ]}
            >
                <View
                    {...panResponder.panHandlers}
                    importantForAccessibility='no-hide-descendants'
                >
                    <View style={styles.handle} />
                </View>
                <View style={[styles.header, headerStyle]}>
                    <View style={styles.headerCopy}>
                        <Text
                            accessibilityRole='header'
                            ref={headerRef}
                            style={[styles.title, titleStyle]}
                        >
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text
                                numberOfLines={2}
                                style={[styles.subtitle, subtitleStyle]}
                            >
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                    <Pressable
                        accessibilityLabel={closeLabel}
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: true,
                        }}
                        hitSlop={8}
                        onPress={(event) => {
                            hapticTap();
                            onClose?.(event);
                        }}
                        style={styles.close}
                    >
                        <X color={colors.muted} size={18} strokeWidth={2.2} />
                    </Pressable>
                </View>
                <Body {...bodyProps}>
                    {children}
                    {stickyFooter ? null : footer}
                    {scroll ? (
                        <View
                            style={
                                stickyFooter
                                    ? styles.stickyBottomPad
                                    : styles.bottomPad
                            }
                        />
                    ) : null}
                </Body>
                {stickyFooter ? (
                    <View style={styles.footer}>{footer}</View>
                ) : null}
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        backgroundColor: "rgba(0,0,0,0.38)",
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
    },
    sheet: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        bottom: 0,
        elevation: 24,
        left: 0,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        position: "absolute",
        right: 0,
        shadowColor: "#000",
        shadowOffset: { height: -2, width: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    handle: {
        alignSelf: "center",
        backgroundColor: colors.faint,
        borderRadius: 3,
        height: 4,
        marginBottom: spacing.md,
        width: 40,
    },
    header: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    headerCopy: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 17,
        fontWeight: "900",
    },
    subtitle: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    close: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 8,
        height: 30,
        justifyContent: "center",
        width: 30,
    },
    content: {
        paddingBottom: spacing.sm,
    },
    scrollBody: {
        flexShrink: 1,
    },
    staticBody: {
        flexShrink: 1,
    },
    footer: {
        backgroundColor: colors.bg,
        borderTopColor: colors.faint,
        borderTopWidth: 1,
        paddingBottom: spacing.lg,
        paddingTop: spacing.md,
    },
    stickyBottomPad: {
        height: spacing.md,
    },
    bottomPad: {
        height: spacing.xl * 2,
    },
});
