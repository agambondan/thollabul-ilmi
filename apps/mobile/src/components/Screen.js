import { useCallback } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useTabActivity } from "../context/TabActivityContext";
import { colors, spacing } from "../theme";

export function Screen({
    title,
    subtitle,
    children,
    refreshing,
    onRefresh,
    onEndReached,
    actions,
    headerExtra,
    searchSlot,
    contentStyle,
    listData,
    renderListItem,
    listKeyExtractor,
    listFooter,
}) {
    const { notifyTabActivity } = useTabActivity();
    const handleScrollActivity = useCallback(
        (event) => {
            notifyTabActivity();
            if (!onEndReached) return;

            const { contentOffset, contentSize, layoutMeasurement } =
                event.nativeEvent;
            const distanceFromEnd =
                contentSize.height -
                (contentOffset.y + layoutMeasurement.height);
            if (distanceFromEnd < 520) {
                onEndReached();
            }
        },
        [notifyTabActivity, onEndReached],
    );

    const renderHeader = () => (
        <>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        ) : null}
                    </View>
                    {actions ? (
                        <View style={styles.actions}>{actions}</View>
                    ) : null}
                </View>
                {searchSlot ? (
                    <View style={styles.searchSlot}>{searchSlot}</View>
                ) : null}
                {headerExtra ? (
                    <View style={styles.headerExtra}>{headerExtra}</View>
                ) : null}
            </View>
            <View style={[styles.body, contentStyle]}>{children}</View>
        </>
    );

    if (Array.isArray(listData) && renderListItem) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
                style={styles.flex}
            >
                <FlatList
                    contentContainerStyle={styles.content}
                    data={listData}
                    keyboardShouldPersistTaps='handled'
                    keyExtractor={listKeyExtractor}
                    ListFooterComponent={listFooter}
                    ListHeaderComponent={renderHeader}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.65}
                    onScroll={notifyTabActivity}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={!!refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                            />
                        ) : undefined
                    }
                    renderItem={renderListItem}
                    scrollEventThrottle={250}
                />
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
            style={styles.flex}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps='handled'
                onMomentumScrollBegin={handleScrollActivity}
                onScroll={handleScrollActivity}
                onScrollBeginDrag={handleScrollActivity}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={!!refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    ) : undefined
                }
                scrollEventThrottle={250}
            >
                {renderHeader()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    content: {
        backgroundColor: colors.bg,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        ...Platform.select({
            web: {
                alignSelf: "stretch",
                boxSizing: "border-box",
                maxWidth: "100%",
            },
        }),
    },
    body: {
        minWidth: 0,
        ...Platform.select({
            web: {
                alignSelf: "stretch",
                boxSizing: "border-box",
                maxWidth: "100%",
            },
        }),
    },
    header: {
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        marginBottom: spacing.xl,
        paddingBottom: spacing.md,
        paddingTop: spacing.md,
    },
    headerTop: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
    },
    headerCopy: {
        flex: 1,
    },
    title: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 0,
    },
    subtitle: {
        color: colors.muted,
        fontSize: 14,
        lineHeight: 20,
        marginTop: spacing.sm,
    },
    actions: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 40,
    },
    searchSlot: {
        marginTop: spacing.md,
    },
    headerExtra: {
        marginTop: spacing.md,
    },
});
