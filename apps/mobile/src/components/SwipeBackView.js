import { useRef } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

const SWIPE_THRESHOLD = 80;
const EDGE_WIDTH = 20;

export function SwipeBackView({
    children,
    enabled = true,
    onSwipeBack,
    style,
}) {
    const panX = useRef(new Animated.Value(0)).current;
    const isSwiping = useRef(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gesture) => {
                if (!enabled) return false;
                return (
                    gesture.dx > 10 && gesture.dx > Math.abs(gesture.dy) * 1.5
                );
            },
            onPanResponderGrant: () => {
                isSwiping.current = true;
                panX.setOffset(0);
                panX.setValue(0);
            },
            onPanResponderMove: Animated.event([null, { dx: panX }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: (_, gesture) => {
                isSwiping.current = false;
                panX.flattenOffset();
                if (gesture.dx > SWIPE_THRESHOLD) {
                    Animated.timing(panX, {
                        toValue: 300,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => onSwipeBack?.());
                } else {
                    Animated.spring(panX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                isSwiping.current = false;
                Animated.spring(panX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        }),
    ).current;

    if (!enabled)
        return <View style={[styles.container, style]}>{children}</View>;

    return (
        <Animated.View
            style={[
                styles.container,
                style,
                { transform: [{ translateX: panX }] },
            ]}
            {...panResponder.panHandlers}
        >
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
