import { BookOpen, ExternalLink } from "lucide-react-native";
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
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { radius, spacing } from "../../theme";
import {
    LIBRARY_PROGRESS_STATUSES,
    getLibraryProgressLabel,
    normalizeSearchText,
} from "../ExploreScreen.helpers";

const ACCENT = "#047857";

const getBookRaw = (item) => item?.raw ?? {};
const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";

const getBookId = (item) => {
    const raw = getBookRaw(item);
    return raw.id ?? item?.id ?? raw.slug ?? item?.title;
};

const getBookTitle = (item, index, fallback) => {
    const raw = getBookRaw(item);
    return pickText(
        raw.title,
        raw.name,
        item?.title,
        fallback ?? `Buku ${index + 1}`,
    );
};

const getBookDescription = (item) => {
    const raw = getBookRaw(item);
    return pickText(raw.description, raw.summary, item?.body);
};

const getBookMeta = (item) => {
    const raw = getBookRaw(item);
    return {
        author: pickText(raw.author, raw.writer),
        category: pickText(raw.category),
        format: pickText(raw.format),
        level: pickText(raw.level),
        sourceUrl: pickText(raw.source_url, raw.sourceUrl, raw.url),
    };
};

const uniqueValues = (items, resolver) =>
    Array.from(new Set(items.map(resolver).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
    );

function FilterPill({ active, isDark, label, onPress, testID }) {
    return (
        <Pressable
            accessibilityRole='button'
            onPress={onPress}
            style={[
                styles.filterPill,
                isDark && styles.filterPillDark,
                active && styles.filterPillActive,
                active && isDark && styles.filterPillActiveDark,
            ]}
            testID={testID}
        >
            <Text
                style={[
                    styles.filterPillText,
                    isDark && styles.filterPillTextDark,
                    active && styles.filterPillTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function ProgressSummary({ isDark, items, progressMap, t }) {
    const progressItems = Object.values(progressMap);
    const trackedBooks = progressItems
        .map((progress) => {
            const bookId =
                progress?.library_book_id ??
                progress?.book?.id ??
                progress?.Book?.id;
            const book = items.find(
                (item) => String(getBookId(item)) === String(bookId),
            );
            return { book, bookId, progress };
        })
        .filter(({ book, bookId }) => book || bookId);

    return (
        <View
            style={[styles.progressPanel, isDark && styles.progressPanelDark]}
        >
            <View style={styles.progressHeader}>
                <View style={styles.progressTitleBlock}>
                    <Text
                        style={[
                            styles.progressTitle,
                            isDark && styles.progressTitleDark,
                        ]}
                    >
                        {t("explore.library.progressTitle")}
                    </Text>
                    <Text
                        style={[
                            styles.progressSubtitle,
                            isDark && styles.progressSubtitleDark,
                        ]}
                    >
                        {t("explore.library.progressSubtitle")}
                    </Text>
                </View>
                <Text
                    style={[
                        styles.progressCount,
                        isDark && styles.progressCountDark,
                    ]}
                >
                    {t("explore.library.progressCount", {
                        count: progressItems.length,
                    })}
                </Text>
            </View>

            {trackedBooks.length ? (
                <View style={styles.progressList}>
                    {trackedBooks
                        .slice(0, 6)
                        .map(({ book, bookId, progress }) => (
                            <View
                                key={`${bookId}-${progress?.status ?? "reading"}`}
                                style={[
                                    styles.progressCard,
                                    isDark && styles.progressCardDark,
                                ]}
                            >
                                <View style={styles.progressCardTop}>
                                    <Text
                                        style={[
                                            styles.progressBadge,
                                            isDark && styles.progressBadgeDark,
                                        ]}
                                    >
                                        {getLibraryProgressLabel(
                                            progress?.status,
                                        )}
                                    </Text>
                                    {progress?.current_page ? (
                                        <Text
                                            style={[
                                                styles.progressPage,
                                                isDark &&
                                                    styles.progressPageDark,
                                            ]}
                                        >
                                            {t("explore.library.pageLabel", {
                                                page: progress.current_page,
                                            })}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text
                                    numberOfLines={2}
                                    style={[
                                        styles.progressBookTitle,
                                        isDark && styles.progressBookTitleDark,
                                    ]}
                                >
                                    {book
                                        ? getBookTitle(
                                              book,
                                              0,
                                              t(
                                                  "explore.library.bookFallback",
                                                  { number: 1 },
                                              ),
                                          )
                                        : (progress?.book?.title ??
                                          progress?.Book?.title ??
                                          t(
                                              "explore.library.savedResourceFallback",
                                          ))}
                                </Text>
                                {progress?.note ? (
                                    <Text
                                        numberOfLines={2}
                                        style={[
                                            styles.progressNote,
                                            isDark && styles.progressNoteDark,
                                        ]}
                                    >
                                        {progress.note}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                </View>
            ) : (
                <Text
                    style={[
                        styles.progressEmpty,
                        isDark && styles.progressEmptyDark,
                    ]}
                >
                    {t("explore.library.progressEmpty")}
                </Text>
            )}
        </View>
    );
}

function LibraryCard({ index, isDark, item, onOpen, progress, t }) {
    const meta = getBookMeta(item);
    const description = getBookDescription(item);

    return (
        <Pressable
            accessibilityRole='button'
            onPress={() => onOpen(item)}
            style={[styles.card, isDark && styles.cardDark]}
            testID='web-app-library-card'
        >
            <View style={styles.cardTop}>
                <View style={[styles.bookIcon, isDark && styles.bookIconDark]}>
                    <BookOpen
                        color={isDark ? "#34d399" : ACCENT}
                        size={19}
                        strokeWidth={2.1}
                    />
                </View>
                {meta.sourceUrl ? (
                    <ExternalLink
                        color={isDark ? "#64748b" : "#d1d5db"}
                        size={16}
                        strokeWidth={2.2}
                    />
                ) : null}
            </View>

            {progress ? (
                <View style={styles.progressInline}>
                    <Text
                        style={[
                            styles.inlineBadge,
                            isDark && styles.inlineBadgeDark,
                        ]}
                    >
                        {getLibraryProgressLabel(progress.status)}
                    </Text>
                    {progress.current_page ? (
                        <Text
                            style={[
                                styles.inlinePage,
                                isDark && styles.inlinePageDark,
                            ]}
                        >
                            {t("explore.library.pageLabel", {
                                page: progress.current_page,
                            })}
                        </Text>
                    ) : null}
                </View>
            ) : null}

            <Text
                numberOfLines={2}
                style={[styles.cardTitle, isDark && styles.cardTitleDark]}
            >
                {getBookTitle(
                    item,
                    index,
                    t("explore.library.bookFallback", { number: index + 1 }),
                )}
            </Text>
            {description ? (
                <Text
                    numberOfLines={3}
                    style={[
                        styles.cardDescription,
                        isDark && styles.cardDescriptionDark,
                    ]}
                >
                    {description}
                </Text>
            ) : null}

            <View style={[styles.metaRow, isDark && styles.metaRowDark]}>
                {meta.author ? (
                    <Text
                        numberOfLines={1}
                        style={[styles.meta, isDark && styles.metaDark]}
                    >
                        {meta.author}
                    </Text>
                ) : null}
                {meta.category ? (
                    <Text
                        numberOfLines={1}
                        style={[styles.meta, isDark && styles.metaDark]}
                    >
                        {meta.category}
                    </Text>
                ) : null}
                {meta.level ? (
                    <Text
                        numberOfLines={1}
                        style={[styles.meta, isDark && styles.metaDark]}
                    >
                        {meta.level}
                    </Text>
                ) : null}
                {meta.format ? (
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.meta,
                            styles.metaUpper,
                            isDark && styles.metaDark,
                        ]}
                    >
                        {meta.format}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    );
}

export function WebAppLibraryRoute({
    error,
    items,
    libraryProgressFilter,
    libraryProgressMap,
    loading,
    onLoadMore,
    onOpenItem,
    onSelectProgressFilter,
    pagination,
    session,
    isDarkTheme = false,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const isDark = isDarkTheme ?? isDarkThemePref;
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [level, setLevel] = useState("");
    const isAuthenticated = Boolean(session?.token);
    const categories = useMemo(
        () => uniqueValues(items, (item) => getBookMeta(item).category),
        [items],
    );
    const levels = useMemo(
        () => uniqueValues(items, (item) => getBookMeta(item).level),
        [items],
    );

    const filteredItems = useMemo(() => {
        const query = normalizeSearchText(search);
        return items.filter((item) => {
            const meta = getBookMeta(item);
            const bookId = getBookId(item);
            const progress = bookId ? libraryProgressMap[String(bookId)] : null;
            const text = [
                getBookTitle(
                    item,
                    0,
                    t("explore.library.bookFallback", { number: 1 }),
                ),
                getBookDescription(item),
                meta.author,
                meta.category,
                meta.level,
                meta.format,
            ].join(" ");

            return (
                (!query || normalizeSearchText(text).includes(query)) &&
                (!category || meta.category === category) &&
                (!level || meta.level === level) &&
                (!libraryProgressFilter ||
                    progress?.status === libraryProgressFilter)
            );
        });
    }, [
        category,
        items,
        level,
        libraryProgressFilter,
        libraryProgressMap,
        search,
        t,
    ]);

    return (
        <ScrollView
            contentContainerStyle={[
                styles.content,
                isDark && styles.contentDark,
            ]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDark && styles.rootDark]}
        >
            <View testID='explore-web-app-library-surface' />
            <View style={styles.header}>
                <Text style={[styles.eyebrow, isDark && styles.eyebrowDark]}>
                    {t("explore.library.eyebrow")}
                </Text>
                <Text style={[styles.title, isDark && styles.titleDark]}>
                    {t("explore.library.title")}
                </Text>
                <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                    {t("explore.library.subtitle")}
                </Text>
            </View>

            {isAuthenticated ? (
                <ProgressSummary
                    isDark={isDark}
                    items={items}
                    progressMap={libraryProgressMap}
                    t={t}
                />
            ) : null}

            <View style={[styles.search, isDark && styles.searchDark]}>
                <TextInput
                    onChangeText={setSearch}
                    placeholder={t("explore.library.searchPlaceholder")}
                    placeholderTextColor={isDark ? "#64748b" : "#9ca3af"}
                    style={[styles.input, isDark && styles.inputDark]}
                    testID='web-app-library-search'
                    value={search}
                />
            </View>

            <View style={styles.filterGroup}>
                <FilterPill
                    active={!category}
                    isDark={isDark}
                    label={t("explore.library.allCategories")}
                    onPress={() => setCategory("")}
                    testID='web-app-library-category-all'
                />
                {categories.map((item) => (
                    <FilterPill
                        active={category === item}
                        isDark={isDark}
                        key={item}
                        label={item}
                        onPress={() =>
                            setCategory(category === item ? "" : item)
                        }
                        testID={`web-app-library-category-${item}`}
                    />
                ))}
            </View>

            {levels.length ? (
                <View style={styles.filterGroup}>
                    <FilterPill
                        active={!level}
                        isDark={isDark}
                        label={t("explore.library.allLevels")}
                        onPress={() => setLevel("")}
                        testID='web-app-library-level-all'
                    />
                    {levels.map((item) => (
                        <FilterPill
                            active={level === item}
                            isDark={isDark}
                            key={item}
                            label={item}
                            onPress={() => setLevel(level === item ? "" : item)}
                            testID={`web-app-library-level-${item}`}
                        />
                    ))}
                </View>
            ) : null}

            {isAuthenticated ? (
                <View style={styles.filterGroup}>
                    <FilterPill
                        active={!libraryProgressFilter}
                        isDark={isDark}
                        label={t("explore.library.allProgress")}
                        onPress={() => onSelectProgressFilter("")}
                        testID='web-app-library-progress-all'
                    />
                    {LIBRARY_PROGRESS_STATUSES.map((item) => (
                        <FilterPill
                            active={libraryProgressFilter === item.key}
                            isDark={isDark}
                            key={item.key}
                            label={item.label}
                            onPress={() =>
                                onSelectProgressFilter(
                                    libraryProgressFilter === item.key
                                        ? ""
                                        : item.key,
                                )
                            }
                            testID={`web-app-library-progress-${item.key}`}
                        />
                    ))}
                </View>
            ) : null}

            {error ? (
                <Text style={[styles.error, isDark && styles.errorDark]}>
                    {t("explore.common.refreshError", {
                        subject: t("explore.library.title"),
                    })}
                </Text>
            ) : null}
            {loading ? (
                <View style={[styles.state, isDark && styles.stateDark]}>
                    <ActivityIndicator color={ACCENT} size='small' />
                    <Text
                        style={[
                            styles.stateText,
                            isDark && styles.stateTextDark,
                        ]}
                    >
                        {t("explore.library.loading")}
                    </Text>
                </View>
            ) : null}

            {!loading && !error && filteredItems.length ? (
                <View style={styles.grid}>
                    {filteredItems.map((item, index) => {
                        const bookId = getBookId(item);
                        const progress = bookId
                            ? libraryProgressMap[String(bookId)]
                            : null;
                        return (
                            <LibraryCard
                                index={index}
                                isDark={isDark}
                                item={item}
                                key={`${bookId}-${index}`}
                                onOpen={onOpenItem}
                                progress={isAuthenticated ? progress : null}
                                t={t}
                            />
                        );
                    })}
                </View>
            ) : null}

            {!loading && !error && !filteredItems.length ? (
                <View style={[styles.empty, isDark && styles.emptyDark]}>
                    <BookOpen
                        color={isDark ? "#64748b" : "#9ca3af"}
                        size={32}
                        strokeWidth={1.8}
                    />
                    <Text
                        style={[
                            styles.emptyTitle,
                            isDark && styles.emptyTitleDark,
                        ]}
                    >
                        {items.length
                            ? t("explore.common.notFound", {
                                  subject: t("explore.library.title"),
                              })
                            : t("explore.common.notAvailable", {
                                  subject: t("explore.library.title"),
                              })}
                    </Text>
                    <Text
                        style={[
                            styles.emptyText,
                            isDark && styles.emptyTextDark,
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
                            isDark && styles.loadMoreButtonDark,
                            pagination.loadingMore &&
                                styles.loadMoreButtonDisabled,
                        ]}
                        testID='web-app-library-load-more'
                    >
                        <Text
                            style={[
                                styles.loadMoreText,
                                isDark && styles.loadMoreTextDark,
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
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        marginBottom: spacing.lg,
    },
    eyebrow: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
        marginBottom: 4,
    },
    title: {
        color: "#064e3b",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 14,
        lineHeight: 22,
        marginTop: spacing.xs,
    },
    progressPanel: {
        backgroundColor: "#ecfdf5",
        borderColor: "#d1fae5",
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    progressHeader: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    progressTitleBlock: {
        flex: 1,
    },
    progressTitle: {
        color: "#064e3b",
        fontSize: 14,
        fontWeight: "900",
    },
    progressSubtitle: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 2,
    },
    progressCount: {
        backgroundColor: "#ffffff",
        borderRadius: 999,
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        overflow: "hidden",
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
    },
    progressList: {
        gap: spacing.sm,
    },
    progressCard: {
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.sm,
        borderWidth: 1,
        padding: spacing.sm,
    },
    progressCardTop: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    progressBadge: {
        backgroundColor: "#d1fae5",
        borderRadius: 999,
        color: "#047857",
        fontSize: 11,
        fontWeight: "900",
        overflow: "hidden",
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
    },
    progressPage: {
        color: "#6b7280",
        fontSize: 11,
        fontWeight: "700",
    },
    progressBookTitle: {
        color: "#064e3b",
        fontSize: 13,
        fontWeight: "900",
        lineHeight: 18,
    },
    progressNote: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 3,
    },
    progressEmpty: {
        backgroundColor: "#ffffff",
        borderColor: "#a7f3d0",
        borderRadius: radius.sm,
        borderStyle: "dashed",
        borderWidth: 1,
        color: "#6b7280",
        fontSize: 13,
        lineHeight: 20,
        padding: spacing.md,
    },
    search: {
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: "center",
        marginBottom: spacing.md,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    input: {
        color: "#374151",
        fontSize: 14,
        minHeight: 42,
        padding: 0,
    },
    filterGroup: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    filterPill: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 30,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
    },
    filterPillActive: {
        backgroundColor: "#047857",
        borderColor: "#047857",
    },
    filterPillText: {
        color: "#4b5563",
        fontSize: 12,
        fontWeight: "800",
    },
    filterPillTextActive: {
        color: "#ffffff",
    },
    state: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#f3f4f6",
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 130,
        padding: spacing.md,
    },
    stateText: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "800",
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
    grid: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.md,
    },
    cardTop: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    bookIcon: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: radius.sm,
        height: 40,
        justifyContent: "center",
        width: 40,
    },
    progressInline: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    inlineBadge: {
        backgroundColor: "#ecfdf5",
        borderRadius: 999,
        color: "#047857",
        fontSize: 11,
        fontWeight: "900",
        overflow: "hidden",
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
    },
    inlinePage: {
        color: "#6b7280",
        fontSize: 11,
        fontWeight: "700",
    },
    cardTitle: {
        color: "#064e3b",
        fontSize: 16,
        fontWeight: "900",
        lineHeight: 21,
    },
    cardDescription: {
        color: "#4b5563",
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing.sm,
    },
    metaRow: {
        borderTopColor: "#f3f4f6",
        borderTopWidth: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingTop: spacing.sm,
    },
    meta: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "700",
    },
    metaUpper: {
        textTransform: "uppercase",
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.md,
        borderStyle: "dashed",
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 190,
        padding: spacing.lg,
    },
    emptyTitle: {
        color: "#374151",
        fontSize: 15,
        fontWeight: "900",
        marginTop: spacing.sm,
        textAlign: "center",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 13,
        lineHeight: 20,
        marginTop: spacing.xs,
        textAlign: "center",
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
    loadMoreButtonDisabled: {
        opacity: 0.6,
    },
    loadMoreText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    rootDark: {
        backgroundColor: "#020617",
    },
    contentDark: {
        backgroundColor: "#020617",
    },
    eyebrowDark: {
        color: "#34d399",
    },
    titleDark: {
        color: "#f8fafc",
    },
    subtitleDark: {
        color: "#94a3b8",
    },
    progressPanelDark: {
        backgroundColor: "#064e3b",
        borderColor: "#047857",
    },
    progressTitleDark: {
        color: "#ecfdf5",
    },
    progressSubtitleDark: {
        color: "#a7f3d0",
    },
    progressCountDark: {
        backgroundColor: "#111827",
        color: "#34d399",
    },
    progressCardDark: {
        backgroundColor: "#111827",
        borderColor: "#047857",
    },
    progressBadgeDark: {
        backgroundColor: "rgba(52, 211, 153, 0.2)",
        color: "#34d399",
    },
    progressPageDark: {
        color: "#94a3b8",
    },
    progressBookTitleDark: {
        color: "#f8fafc",
    },
    progressNoteDark: {
        color: "#94a3b8",
    },
    progressEmptyDark: {
        backgroundColor: "#111827",
        borderColor: "#047857",
        color: "#94a3b8",
    },
    searchDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    inputDark: {
        color: "#f8fafc",
    },
    filterPillDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    filterPillActiveDark: {
        backgroundColor: "#047857",
        borderColor: "#047857",
    },
    filterPillTextDark: {
        color: "#cbd5e1",
    },
    stateDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    stateTextDark: {
        color: "#94a3b8",
    },
    errorDark: {
        backgroundColor: "#3f1d1d",
        color: "#fecaca",
    },
    gridDark: {},
    cardDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    bookIconDark: {
        backgroundColor: "rgba(6, 78, 59, 0.35)",
    },
    inlineBadgeDark: {
        backgroundColor: "rgba(6, 78, 59, 0.35)",
        color: "#34d399",
    },
    inlinePageDark: {
        color: "#94a3b8",
    },
    cardTitleDark: {
        color: "#f8fafc",
    },
    cardDescriptionDark: {
        color: "#cbd5e1",
    },
    metaRowDark: {
        borderTopColor: "#243044",
    },
    metaDark: {
        color: "#94a3b8",
    },
    emptyDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    emptyTitleDark: {
        color: "#f8fafc",
    },
    emptyTextDark: {
        color: "#94a3b8",
    },
    loadMoreButtonDark: {
        backgroundColor: "#111827",
        borderColor: "#047857",
    },
    loadMoreTextDark: {
        color: "#34d399",
    },
});
