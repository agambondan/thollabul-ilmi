import { ChevronDown, Search, Scale } from "lucide-react-native";
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

import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { colors, getThemeColors, radius, spacing } from "../../theme";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { normalizeSearchText } from "../ExploreScreen.helpers";

const DEFAULT_CATEGORIES = [
    "thaharah",
    "sholat",
    "zakat",
    "puasa",
    "haji",
    "muamalah",
    "umum",
];

const toStr = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value.name ?? value.title ?? value.label ?? value.value ?? "";
};

const titleCase = (value) =>
    value
        ? value
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())
        : "";

const getRaw = (item) => item?.raw ?? {};
const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";
const getFiqhId = (item) =>
    getRaw(item).id ?? getRaw(item)._id ?? item?.id ?? getFiqhTitle(item);
const getFiqhTitle = (item, fallback = "Materi fiqh") =>
    pickText(
        getRaw(item).title_idn,
        getRaw(item).title_id,
        getRaw(item).title,
        getRaw(item).name,
        item?.title,
        fallback,
    );
const getFiqhContent = (item) =>
    pickText(
        getRaw(item).content_idn,
        getRaw(item).content_id,
        getRaw(item).content,
        getRaw(item).description,
        item?.body,
    );
const getFiqhDalil = (item) => toStr(getRaw(item).dalil);
const getFiqhSource = (item) => pickText(getRaw(item).source, item?.meta);
const normalizeFiqhCategory = (value) => {
    const normalized = toStr(value).toLowerCase().replace(/_/g, "-").trim();
    if (normalized.startsWith("haji")) return "haji";
    return normalized;
};
const getFiqhDisplayCategory = (item) =>
    toStr(getRaw(item).category ?? getRaw(item).slug ?? item?.meta);
const getFiqhFilterCategory = (item) =>
    normalizeFiqhCategory(
        getRaw(item).category ??
            getRaw(item).slug ??
            getRaw(item).name ??
            item?.meta,
    );

const getCategories = (items) => {
    const seen = new Set();
    return [...DEFAULT_CATEGORIES, ...items.map(getFiqhFilterCategory)]
        .filter(Boolean)
        .filter((item) => {
            if (seen.has(item)) return false;
            seen.add(item);
            return true;
        });
};

function CategoryPill({ active, isDarkTheme, label, onPress, testID }) {
    return (
        <Pressable
            accessibilityRole='button'
            onPress={onPress}
            style={[
                styles.categoryPill,
                isDarkTheme && styles.categoryPillDark,
                active && styles.categoryPillActive,
            ]}
            testID={testID}
        >
            <Text
                style={[
                    styles.categoryPillText,
                    isDarkTheme && styles.categoryPillTextDark,
                    active && styles.categoryPillTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function FiqhCard({ isDarkTheme, item, onOpen, t }) {
    const category = getFiqhDisplayCategory(item);

    return (
        <Pressable
            accessibilityRole='button'
            onPress={() => onOpen(item)}
            style={[styles.card, isDarkTheme && styles.cardDark]}
            testID='web-app-fiqh-card'
        >
            <View style={styles.cardMain}>
                {category ? (
                    <Text
                        style={[
                            styles.categoryBadge,
                            isDarkTheme && styles.categoryBadgeDark,
                        ]}
                    >
                        {titleCase(category)}
                    </Text>
                ) : (
                    <View
                        style={[
                            styles.categoryDash,
                            isDarkTheme && styles.categoryDashDark,
                        ]}
                    />
                )}
                <Text
                    numberOfLines={1}
                    style={[
                        styles.cardTitle,
                        isDarkTheme && styles.cardTitleDark,
                    ]}
                >
                    {getFiqhTitle(item, t("explore.fiqh.fallbackTitle"))}
                </Text>
            </View>
            <ChevronDown
                color={isDarkTheme ? "#9ca3af" : "#6b7280"}
                size={22}
                strokeWidth={2.1}
            />
        </Pressable>
    );
}

export function WebAppFiqhRoute({
    error,
    isDarkTheme: isDarkThemeProp,
    items,
    loading,
    onLoadMore,
    onOpenItem,
    pagination,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const isDarkTheme = isDarkThemeProp ?? isDarkThemePref;
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");
    const categories = useMemo(() => getCategories(items), [items]);
    const filteredItems = useMemo(() => {
        const query = normalizeSearchText(search);
        return items.filter((item) => {
            const itemCategory = getFiqhFilterCategory(item);
            const text = [
                getFiqhTitle(item, t("explore.fiqh.fallbackTitle")),
                getFiqhContent(item),
                getFiqhDalil(item),
                getFiqhSource(item),
                titleCase(itemCategory),
            ].join(" ");

            return (
                (!category || itemCategory === category) &&
                (!query || normalizeSearchText(text).includes(query))
            );
        });
    }, [category, items, search, t]);

    return (
        <ScrollView
            contentContainerStyle={[
                styles.content,
                isDarkTheme && styles.contentDark,
            ]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-fiqh-surface' />
            <View style={styles.header}>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>
                    {t("explore.fiqh.title")}
                </Text>
                <Text style={[styles.count, isDarkTheme && styles.countDark]}>
                    {t("explore.fiqh.count", { count: items.length })}
                </Text>
            </View>

            <View style={styles.filterWrap}>
                <View style={[styles.search, isDarkTheme && styles.searchDark]}>
                    <Search
                        color={isDarkTheme ? "#9ca3af" : "#6b7280"}
                        size={16}
                        strokeWidth={2}
                    />
                    <TextInput
                        onChangeText={setSearch}
                        placeholder={t("explore.fiqh.searchPlaceholder")}
                        placeholderTextColor={
                            isDarkTheme ? "#9ca3af" : "#9ca3af"
                        }
                        style={[styles.input, isDarkTheme && styles.inputDark]}
                        testID='web-app-fiqh-search'
                        value={search}
                    />
                </View>
                <CategoryPill
                    active={!category}
                    isDarkTheme={isDarkTheme}
                    label={t("explore.common.all")}
                    onPress={() => setCategory("")}
                    testID='web-app-fiqh-category-all'
                />
                {categories.map((item) => (
                    <CategoryPill
                        active={category === item}
                        isDarkTheme={isDarkTheme}
                        key={item}
                        label={titleCase(item)}
                        onPress={() =>
                            setCategory(category === item ? "" : item)
                        }
                        testID={`web-app-fiqh-category-${item}`}
                    />
                ))}
            </View>

            {error ? (
                <Text style={[styles.error, isDarkTheme && styles.errorDark]}>
                    {t("explore.common.refreshError", {
                        subject: t("explore.fiqh.fallbackTitle"),
                    })}
                </Text>
            ) : null}
            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator
                        color={isDarkTheme ? "#34d399" : "#047857"}
                        size='small'
                    />
                    <Text
                        style={[
                            styles.stateText,
                            isDarkTheme && styles.stateTextDark,
                        ]}
                    >
                        {t("explore.fiqh.loading")}
                    </Text>
                </View>
            ) : null}

            {!loading && !error && filteredItems.length ? (
                <View style={styles.list}>
                    {filteredItems.map((item, index) => (
                        <FiqhCard
                            index={index}
                            isDarkTheme={isDarkTheme}
                            item={item}
                            key={`${getFiqhId(item)}-${index}`}
                            onOpen={onOpenItem}
                            t={t}
                        />
                    ))}
                </View>
            ) : null}

            {!loading && !error && !filteredItems.length ? (
                <View style={[styles.empty, isDarkTheme && styles.emptyDark]}>
                    <Scale
                        color={isDarkTheme ? "#9ca3af" : "#6b7280"}
                        size={32}
                        strokeWidth={1.8}
                    />
                    <Text
                        style={[
                            styles.emptyTitle,
                            isDarkTheme && styles.emptyTitleDark,
                        ]}
                    >
                        {items.length
                            ? t("explore.common.notFound", {
                                  subject: t("explore.fiqh.fallbackTitle"),
                              })
                            : t("explore.common.notAvailable", {
                                  subject: t("explore.fiqh.fallbackTitle"),
                              })}
                    </Text>
                    <Text
                        style={[
                            styles.emptyText,
                            isDarkTheme && styles.emptyTextDark,
                        ]}
                    >
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
                            isDarkTheme && styles.loadMoreButtonDark,
                            pagination.loadingMore &&
                                styles.loadMoreButtonDisabled,
                        ]}
                        testID='web-app-fiqh-load-more'
                    >
                        <Text
                            style={[
                                styles.loadMoreText,
                                isDarkTheme && styles.loadMoreTextDark,
                            ]}
                        >
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
    rootDark: {
        backgroundColor: "#020617",
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    contentDark: {
        backgroundColor: "#020617",
    },
    header: {
        marginBottom: spacing.md,
    },
    title: {
        color: "#111827",
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 28,
    },
    titleDark: {
        color: "#f8fafc",
    },
    count: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "700",
        marginTop: 2,
    },
    countDark: {
        color: "#94a3b8",
    },
    filterWrap: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    search: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        height: 38,
        paddingHorizontal: spacing.sm,
        width: 176,
    },
    searchDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    input: {
        color: "#111827",
        fontSize: 14,
        minHeight: 36,
        padding: 0,
        width: 128,
    },
    inputDark: {
        color: "#f8fafc",
    },
    categoryPill: {
        backgroundColor: "#f3f4f6",
        borderColor: "#f3f4f6",
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 38,
        paddingHorizontal: spacing.md,
        paddingVertical: 9,
    },
    categoryPillDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    categoryPillActive: {
        backgroundColor: "#047857",
        borderColor: "#047857",
    },
    categoryPillText: {
        color: "#4b5563",
        fontSize: 12,
        fontWeight: "800",
    },
    categoryPillTextDark: {
        color: "#94a3b8",
    },
    categoryPillTextActive: {
        color: "#ffffff",
    },
    list: {
        gap: spacing.md,
    },
    card: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#f3f4f6",
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 56,
        overflow: "hidden",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    cardDark: {
        backgroundColor: "#111827",
        borderColor: "#1e293b",
    },
    cardMain: {
        alignItems: "center",
        flexDirection: "row",
        flex: 1,
        gap: spacing.sm,
        minWidth: 0,
    },
    categoryBadge: {
        backgroundColor: "#ecfccb",
        borderRadius: 4,
        color: "#4d7c0f",
        fontSize: 11,
        fontWeight: "900",
        overflow: "hidden",
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    categoryBadgeDark: {
        backgroundColor: "#064e3b33",
        color: "#34d399",
    },
    categoryDash: {
        backgroundColor: "#d9f99d",
        borderRadius: 999,
        height: 4,
        width: 18,
    },
    categoryDashDark: {
        backgroundColor: "#065f46",
    },
    cardTitle: {
        color: "#111827",
        flex: 1,
        fontSize: 14,
        fontWeight: "900",
        lineHeight: 20,
    },
    cardTitleDark: {
        color: "#f8fafc",
    },
    cardText: {
        color: "#4b5563",
        fontSize: 13,
        lineHeight: 20,
        marginTop: spacing.sm,
    },
    dalil: {
        borderTopColor: "#f3f4f6",
        borderTopWidth: 1,
        color: "#6b7280",
        fontFamily: "serif",
        fontSize: 16,
        lineHeight: 28,
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        textAlign: "right",
    },
    source: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "700",
        marginTop: spacing.sm,
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 150,
    },
    stateText: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "800",
    },
    stateTextDark: {
        color: "#94a3b8",
    },
    error: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        borderRadius: radius.md,
        borderWidth: 1,
        color: "#991b1b",
        fontSize: 13,
        fontWeight: "800",
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    errorDark: {
        backgroundColor: "#3f1d1d",
        color: "#fecaca",
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#f3f4f6",
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 190,
        padding: spacing.lg,
    },
    emptyDark: {
        backgroundColor: "#111827",
        borderColor: "#1e293b",
    },
    emptyTitle: {
        color: "#374151",
        fontSize: 15,
        fontWeight: "900",
        marginTop: spacing.sm,
        textAlign: "center",
    },
    emptyTitleDark: {
        color: "#f8fafc",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 13,
        lineHeight: 20,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    emptyTextDark: {
        color: "#94a3b8",
    },
    loadMoreWrap: {
        alignItems: "center",
        marginTop: spacing.lg,
    },
    loadMoreButton: {
        backgroundColor: "#ffffff",
        borderColor: "#a7f3d0",
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    loadMoreButtonDark: {
        backgroundColor: "#111827",
        borderColor: "#065f46",
    },
    loadMoreButtonDisabled: {
        opacity: 0.6,
    },
    loadMoreText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    loadMoreTextDark: {
        color: "#34d399",
    },
});
