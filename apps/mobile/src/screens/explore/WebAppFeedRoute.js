import { MessageCircle, EyeOff, Flag } from "lucide-react-native";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, getThemeColors, radius, spacing } from "../../theme";

const getFeedReference = (item = {}, t) => {
    const raw = item?.raw ?? {};
    const refType = raw.ref_type ?? "";
    if (!["ayah", "hadith"].includes(refType)) return null;
    return {
        id: raw.ref_id ?? "",
        label:
            refType === "ayah"
                ? t("explore.feed.refAyah")
                : t("explore.feed.refHadith"),
    };
};

function FeedCard({
    formatDate,
    isDarkTheme,
    isLoggedIn,
    item,
    likingFeedId,
    onHide,
    onLike,
    onOpenComments,
    onReport,
    t,
}) {
    const raw = item?.raw ?? {};
    const author =
        item.title ||
        raw.author?.name ||
        raw.author?.username ||
        raw.author?.email ||
        t("explore.feed.userFallback");
    const createdAt = formatDate(raw.created_at ?? raw.createdAt);
    const likes = Number(raw.likes ?? raw.like_count ?? 0);
    const feedRef = getFeedReference(item, t);
    const isLiking = likingFeedId === item.id;

    return (
        <View style={[styles.card, isDarkTheme && styles.cardDark]} testID='web-app-feed-card'>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, isDarkTheme && styles.avatarDark]}>
                    <Text style={[styles.avatarText, isDarkTheme && styles.avatarTextDark]}>
                        {author[0]?.toUpperCase() ?? "U"}
                    </Text>
                </View>
                <View style={styles.authorBlock}>
                    <Text numberOfLines={1} style={[styles.author, isDarkTheme && styles.authorDark]}>
                        {author}
                    </Text>
                    {createdAt ? (
                        <Text style={[styles.date, isDarkTheme && styles.dateDark]}>{createdAt}</Text>
                    ) : null}
                </View>
            </View>
            {item.body ? <Text style={[styles.body, isDarkTheme && styles.bodyDark]}>{item.body}</Text> : null}
            {feedRef ? (
                <View style={[styles.ref, isDarkTheme && styles.refDark]}>
                    <Text style={[styles.refText, isDarkTheme && styles.refTextDark]}>{feedRef.label}</Text>
                    {feedRef.id ? (
                        <Text style={[styles.refId, isDarkTheme && styles.refIdDark]}>#{feedRef.id}</Text>
                    ) : null}
                </View>
            ) : null}
            <View style={styles.actions}>
                <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={t("explore.feed.likeAccessibility")}
                    android_ripple={{ color: isDarkTheme ? "#450a0a" : "#fee2e2", borderless: false }}
                    accessibilityState={{ disabled: isLiking }}
                    disabled={isLiking}
                    onPress={() => onLike(item)}
                    style={[styles.action, isDarkTheme && styles.actionDark]}
                >
                    <Text style={[styles.actionText, isDarkTheme && styles.actionTextDark]}>
                        {isLiking ? t("explore.feed.liking") : `♡ ${likes}`}
                    </Text>
                </Pressable>
                <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={t("explore.feed.commentAccessibility")}
                    android_ripple={{ color: isDarkTheme ? "#1e3a5f" : "#dbeafe", borderless: false }}
                    onPress={() => onOpenComments(item)}
                    style={[styles.action, isDarkTheme && styles.actionDark]}
                >
                    <Text style={[styles.actionText, isDarkTheme && styles.actionTextDark]}>
                        {t("explore.feed.comments")}
                    </Text>
                </Pressable>
                {isLoggedIn ? (
                    <>
                        <Pressable
                            accessibilityRole='button'
                            accessibilityLabel={t(
                                "explore.feed.hideAccessibility",
                            )}
                            android_ripple={{
                                color: "#fef3c7",
                                borderless: false,
                            }}
                            onPress={() => onHide(item)}
                            style={styles.iconAction}
                        >
                            <EyeOff
                                color='#6b7280'
                                size={15}
                                strokeWidth={2.3}
                            />
                        </Pressable>
                        <Pressable
                            accessibilityRole='button'
                            accessibilityLabel={t(
                                "explore.feed.reportAccessibility",
                            )}
                            android_ripple={{
                                color: "#fee2e2",
                                borderless: false,
                            }}
                            onPress={() => onReport(item)}
                            style={styles.iconAction}
                        >
                            <Flag color='#6b7280' size={15} strokeWidth={2.3} />
                        </Pressable>
                    </>
                ) : null}
            </View>
        </View>
    );
}

export function WebAppFeedRoute({
    error,
    formatDate,
    isLoggedIn,
    items,
    likingFeedId,
    loading,
    onHideFeedItem,
    onLikeFeedItem,
    onLoadMore,
    onOpenComments,
    onReportFeedItem,
    pagination,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme } = useLayoutModePreference();

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            onScroll={({ nativeEvent }) => {
                const { contentOffset, contentSize, layoutMeasurement } =
                    nativeEvent;
                const distanceFromEnd =
                    contentSize.height -
                    (contentOffset.y + layoutMeasurement.height);
                if (distanceFromEnd < 280) onLoadMore();
            }}
            scrollEventThrottle={120}
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-feed-route' />
            <View testID='explore-web-app-community-feed-surface' />
            <View style={styles.header}>
                <View style={[styles.headerIcon, isDarkTheme && styles.headerIconDark]}>
                    <MessageCircle
                        color={isDarkTheme ? "#34d399" : "#059669"}
                        size={30}
                        strokeWidth={2.3}
                    />
                </View>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.feed.title")}</Text>
                <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                    {t("explore.feed.subtitle")}
                </Text>
            </View>

            <View style={[styles.createBox, isDarkTheme && styles.createBoxDark]}>
                <Text style={[styles.createText, isDarkTheme && styles.createTextDark]}>
                    {isLoggedIn
                        ? t("explore.feed.createPost")
                        : t("explore.feed.loginToCreate")}
                </Text>
            </View>

            {error ? <Text style={styles.notice}>{error}</Text> : null}

            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color={isDarkTheme ? "#34d399" : "#059669"} />
                    <Text style={[styles.stateText, isDarkTheme && styles.stateTextDark]}>
                        {t("explore.feed.loading")}
                    </Text>
                </View>
            ) : null}

            {!loading && !items.length ? (
                <View style={[styles.empty, isDarkTheme && styles.emptyDark]}>
                    <MessageCircle
                        color={isDarkTheme ? "#64748b" : "#d1d5db"}
                        size={34}
                        strokeWidth={2.2}
                    />
                    <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                        {t("explore.feed.empty")}
                    </Text>
                </View>
            ) : null}

            {!loading && items.length ? (
                <View style={styles.list}>
                    {items.map((item) => (
                        <FeedCard
                            formatDate={formatDate}
                            isDarkTheme={isDarkTheme}
                            isLoggedIn={isLoggedIn}
                            item={item}
                            key={item.id}
                            likingFeedId={likingFeedId}
                            onHide={onHideFeedItem}
                            onLike={onLikeFeedItem}
                            onOpenComments={onOpenComments}
                            onReport={onReportFeedItem}
                            t={t}
                        />
                    ))}
                </View>
            ) : null}

            {pagination.loadingMore ? (
                <View style={styles.state}>
                    <ActivityIndicator color={isDarkTheme ? "#34d399" : "#059669"} size='small' />
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: "#f8fafc",
        flex: 1,
    },
    rootDark: {
        backgroundColor: "#0f172a",
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    contentDark: {
        backgroundColor: "#0f172a",
    },
    header: {
        alignItems: "center",
        marginBottom: spacing.md,
    },
    headerIcon: {
        alignItems: "center",
        backgroundColor: "#d1fae5",
        borderRadius: radius.md,
        height: 64,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 64,
    },
    headerIconDark: {
        backgroundColor: "#064e3b",
    },
    title: {
        color: "#111827",
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 0,
        lineHeight: 30,
        textAlign: "center",
    },
    titleDark: {
        color: "#f8fafc",
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 14,
        lineHeight: 20,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    subtitleDark: {
        color: "#94a3b8",
    },
    createBox: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderStyle: "dashed",
        borderWidth: 2,
        justifyContent: "center",
        marginBottom: spacing.lg,
        minHeight: 48,
        paddingHorizontal: spacing.md,
    },
    createBoxDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    createText: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "800",
        textAlign: "center",
    },
    createTextDark: {
        color: "#94a3b8",
    },
    notice: {
        color: "#b91c1c",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
        marginBottom: spacing.md,
        textAlign: "center",
    },
    state: {
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
    },
    stateText: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "700",
    },
    stateTextDark: {
        color: "#94a3b8",
    },
    list: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.md,
    },
    cardDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    cardHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    avatar: {
        alignItems: "center",
        backgroundColor: "#d1fae5",
        borderRadius: 20,
        height: 40,
        justifyContent: "center",
        width: 40,
    },
    avatarDark: {
        backgroundColor: "#064e3b",
    },
    avatarText: {
        color: "#059669",
        fontSize: 14,
        fontWeight: "900",
    },
    avatarTextDark: {
        color: "#34d399",
    },
    authorBlock: {
        flex: 1,
        minWidth: 0,
    },
    author: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
    },
    authorDark: {
        color: "#f8fafc",
    },
    date: {
        color: "#9ca3af",
        fontSize: 11,
        marginTop: 2,
    },
    dateDark: {
        color: "#64748b",
    },
    body: {
        color: "#374151",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    bodyDark: {
        color: "#cbd5e1",
    },
    ref: {
        alignSelf: "flex-start",
        backgroundColor: "#fffbeb",
        borderColor: "#fde68a",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
    },
    refDark: {
        backgroundColor: "#451a03",
        borderColor: "#78350f",
    },
    refText: {
        color: "#b45309",
        fontSize: 11,
        fontWeight: "900",
    },
    refTextDark: {
        color: "#fde68a",
    },
    refId: {
        color: "#d97706",
        fontSize: 11,
        fontWeight: "800",
    },
    refIdDark: {
        color: "#f59e0b",
    },
    actions: {
        alignItems: "center",
        borderTopColor: "#f3f4f6",
        borderTopWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        paddingTop: spacing.sm,
    },
    action: {
        alignItems: "center",
        borderRadius: radius.md,
        justifyContent: "center",
        minHeight: 32,
        paddingHorizontal: spacing.sm,
    },
    actionDark: {
        backgroundColor: "transparent",
    },
    actionText: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "800",
    },
    actionTextDark: {
        color: "#94a3b8",
    },
    iconAction: {
        alignItems: "center",
        borderRadius: radius.md,
        height: 32,
        justifyContent: "center",
        width: 32,
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.xl,
    },
    emptyDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "700",
        marginTop: spacing.sm,
        textAlign: "center",
    },
    emptyTextDark: {
        color: "#94a3b8",
    },
});
