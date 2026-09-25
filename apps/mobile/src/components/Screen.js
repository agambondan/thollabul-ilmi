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
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { getThemeColors, spacing } from "../theme";

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
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
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
            <View style={{ ...styles.header, borderBottomColor: theme.border }}>
                <View style={styles.headerTop}>
                    <View style={styles.headerCopy}>
                        <Text style={{ ...styles.title, color: theme.ink }}>{title}</Text>
                        {subtitle ? (
                            <Text style={{ ...styles.subtitle, color: theme.muted }}>{subtitle}</Text>
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
                    contentContainerStyle={[
                        styles.content,
                        { backgroundColor: theme.bg },
                    ]}
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
                                tintColor={theme.primary}
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
                contentContainerStyle={[
                    styles.content,
                    { backgroundColor: theme.bg },
                ]}
                keyboardShouldPersistTaps='handled'
                onMomentumScrollBegin={handleScrollActivity}
                onScroll={handleScrollActivity}
                onScrollBeginDrag={handleScrollActivity}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={!!refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
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
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    subtitle: {
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
