import { useEffect } from "react";
import { BookOpen, ChevronDown, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { radius, spacing } from "../../theme";
import { normalizeSearchText } from "../ExploreScreen.helpers";

const getRaw = (item) => item?.raw ?? {};
const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";
const toStr = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return pickText(value.name, value.title, value.label, value.value);
};

const getSirohId = (item, index = 0) =>
    getRaw(item).id ??
    getRaw(item)._id ??
    getRaw(item).slug ??
    item?.id ??
    `siroh-${index}`;
const getSirohTitle = (item, index = 0, fallback) =>
    pickText(
        getRaw(item).title_idn,
        getRaw(item).title_id,
        getRaw(item).title,
        getRaw(item).name,
        item?.title,
        fallback ?? `Kisah ${index + 1}`,
    );
const getSirohExcerpt = (item) =>
    pickText(
        getRaw(item).excerpt_idn,
        getRaw(item).excerpt_id,
        getRaw(item).excerpt,
        getRaw(item).description_idn,
        getRaw(item).description,
        item?.body,
    );
const getSirohCategory = (item) =>
    toStr(getRaw(item).category ?? getRaw(item).type ?? item?.meta);

function SirohCard({ index, isDarkTheme, item, onOpen, t }) {
    const category = getSirohCategory(item);
    const excerpt = getSirohExcerpt(item);

    return (
        <Pressable
            accessibilityRole='button'
            onPress={() => onOpen(item)}
            style={[styles.card, isDarkTheme && styles.cardDark]}
            testID='web-app-siroh-card'
        >
            <View style={styles.cardTop}>
                <View style={[styles.numberBadge, isDarkTheme && styles.numberBadgeDark]}>
                    <Text style={[styles.numberText, isDarkTheme && styles.numberTextDark]}>{index + 1}</Text>
                </View>
                <View style={styles.cardBody}>
                    {category ? (
                        <Text style={[styles.categoryBadge, isDarkTheme && styles.categoryBadgeDark]}>{category}</Text>
                    ) : null}
                    <Text numberOfLines={1} style={[styles.cardTitle, isDarkTheme && styles.cardTitleDark]}>
                        {getSirohTitle(
                            item,
                            index,
                            t("explore.siroh.fallbackTitle", {
                                number: index + 1,
                            }),
                        )}
                    </Text>
                    {excerpt ? (
                        <Text numberOfLines={2} style={[styles.cardExcerpt, isDarkTheme && styles.cardExcerptDark]}>
                            {excerpt}
                        </Text>
                    ) : null}
                </View>
                <ChevronDown color={isDarkTheme ? '#64748b' : '#9ca3af'} size={22} strokeWidth={2.1} />
            </View>
        </Pressable>
    );
}

export function WebAppSirohRoute({
    clearFeature,
    error,
    isDarkTheme: isDarkThemeProp = false,
    items,
    loading,
    navigation,
    onLoadMore,
    onOpenItem,
    pagination,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const isDarkTheme = isDarkThemeProp || isDarkThemePref;
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (navigation?.setHeader) {
            navigation.setHeader({
                showBack: true,
                title: t("explore.siroh.title"),
                onBack: () => {
                    if (clearFeature) clearFeature();
                    return true;
                },
            });
        }
    }, [navigation, clearFeature, t]);

    const filteredItems = useMemo(() => {
        const query = normalizeSearchText(search);
        if (!query) return items;

        return items.filter((item, index) =>
            normalizeSearchText(
                [
                    getSirohTitle(
                        item,
                        index,
                        t("explore.siroh.fallbackTitle", { number: index + 1 }),
                    ),
                    getSirohExcerpt(item),
                    getSirohCategory(item),
                    getRaw(item).slug,
                ].join(" "),
            ).includes(query),
        );
    }, [items, search, t]);

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-siroh-surface' />
            <View style={styles.header}>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.siroh.title")}</Text>
                <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                    {t("explore.siroh.subtitle")}
                </Text>
            </View>

            <View style={[styles.search, isDarkTheme && styles.searchDark]}>
                <Search color={isDarkTheme ? '#64748b' : '#9ca3af'} size={16} strokeWidth={2} />
                <TextInput
                    onChangeText={setSearch}
                    placeholder={t("explore.siroh.searchPlaceholder")}
                    placeholderTextColor={isDarkTheme ? '#64748b' : '#9ca3af'}
                    style={[styles.input, isDarkTheme && styles.inputDark]}
                    testID='web-app-siroh-search'
                    value={search}
                />
            </View>

            {error ? (
                <Text style={[styles.error, isDarkTheme && styles.errorDark]}>
                    {t("explore.common.refreshError", {
                        subject: t("explore.siroh.title"),
                    })}
                </Text>
            ) : null}
            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color={isDarkTheme ? '#60a5fa' : '#2563eb'} size='small' />
                    <Text style={[styles.stateText, isDarkTheme && styles.stateTextDark]}>
                        {t("explore.siroh.loading")}
                    </Text>
                </View>
            ) : null}

            {!loading && !error && filteredItems.length ? (
                <View style={styles.list}>
                    {filteredItems.map((item, index) => (
                        <SirohCard
                            index={index}
                            isDarkTheme={isDarkTheme}
                            item={item}
                            key={`${getSirohId(item, index)}-${index}`}
                            onOpen={onOpenItem}
                            t={t}
                        />
                    ))}
                </View>
            ) : null}

            {!loading && !error && !filteredItems.length ? (
                <View style={[styles.empty, isDarkTheme && styles.emptyDark]}>
                    <BookOpen color={isDarkTheme ? '#64748b' : '#9ca3af'} size={32} strokeWidth={1.8} />
                    <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                        {items.length
                            ? t("explore.common.notFound", {
                                  subject: t("explore.siroh.title"),
                              })
                            : t("explore.common.notAvailable", {
                                  subject: t("explore.siroh.title"),
                              })}
                    </Text>
                    <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                        {items.length
                            ? t("explore.common.changeSearchOrFilter")
                            : t("explore.common.retryLater")}
                    </Text>
                </View>
            ) : null}

            {pagination?.hasMore && !loading && !error ? (
                <View style={styles.loadMoreWrap}>
                    <Pressable
                        accessibilityRole='button'
                        accessibilityState={{
                            disabled: pagination.loadingMore,
                        }}
                        disabled={pagination.loadingMore}
                        onPress={onLoadMore}
                        style={[
                            styles.loadMoreButton,
                            pagination.loadingMore &&
                                styles.loadMoreButtonDisabled,
                        ]}
                        testID='web-app-siroh-load-more'
                    >
                        <Text style={styles.loadMoreText}>
                            {pagination.loadingMore
                                ? t("explore.common.loadingShort")
                                : t("explore.common.loadMore")}
                        </Text>
                    </Pressable>
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
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        marginBottom: spacing.md,
    },
    title: {
        color: "#111827",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 20,
        marginTop: 3,
    },
    search: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.lg,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    input: {
        color: "#111827",
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        paddingVertical: 9,
    },
    list: {
        gap: spacing.sm,
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.md,
    },
    cardTop: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
    numberBadge: {
        alignItems: "center",
        backgroundColor: "#dbeafe",
        borderRadius: 12,
        height: 38,
        justifyContent: "center",
        width: 38,
    },
    numberText: {
        color: "#1d4ed8",
        fontSize: 13,
        fontWeight: "900",
    },
    cardBody: {
        flex: 1,
        minWidth: 0,
    },
    categoryBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#dbeafe",
        borderRadius: 999,
        color: "#1d4ed8",
        fontSize: 11,
        fontWeight: "800",
        marginBottom: 5,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
    },
    cardTitle: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
        lineHeight: 19,
    },
    cardExcerpt: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 17,
        marginTop: 3,
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.lg,
    },
    stateText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.xl,
    },
    emptyTitle: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "900",
        marginTop: spacing.sm,
        textAlign: "center",
    },
    emptyText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 19,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    error: {
        backgroundColor: "#fef2f2",
        borderRadius: 10,
        color: "#b91c1c",
        fontSize: 13,
        fontWeight: "700",
        marginBottom: spacing.sm,
        padding: spacing.sm,
    },
    loadMoreWrap: {
        alignItems: "center",
        paddingVertical: spacing.lg,
    },
    loadMoreButton: {
        backgroundColor: "#2563eb",
        borderRadius: 999,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    loadMoreButtonDisabled: {
        opacity: 0.55,
    },
    loadMoreText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    rootDark: {
        backgroundColor: "#020617",
    },
    contentDark: {
        backgroundColor: "#020617",
    },
    titleDark: {
        color: "#f8fafc",
    },
    subtitleDark: {
        color: "#94a3b8",
    },
    searchDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    inputDark: {
        color: "#f8fafc",
    },
    cardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    cardTitleDark: {
        color: "#f8fafc",
    },
    cardExcerptDark: {
        color: "#94a3b8",
    },
    numberBadgeDark: {
        backgroundColor: "#1e3a8a",
    },
    numberTextDark: {
        color: "#93c5fd",
    },
    categoryBadgeDark: {
        backgroundColor: "#1e3a8a",
        color: "#93c5fd",
    },
    emptyDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    emptyTitleDark: {
        color: "#f8fafc",
    },
    emptyTextDark: {
        color: "#94a3b8",
    },
    stateTextDark: {
        color: "#94a3b8",
    },
    errorDark: {
        backgroundColor: "#450a0a",
        color: "#f87171",
    },
});
