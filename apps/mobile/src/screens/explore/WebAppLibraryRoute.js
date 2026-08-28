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

function FilterPill({ active, label, onPress, testID }) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.filterPill, active && styles.filterPillActive]}
            testID={testID}
        >
            <Text
                style={[
                    styles.filterPillText,
                    active && styles.filterPillTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function ProgressSummary({ items, progressMap, t }) {
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
        <View style={styles.progressPanel}>
            <View style={styles.progressHeader}>
                <View style={styles.progressTitleBlock}>
                    <Text style={styles.progressTitle}>
                        {t("explore.library.progressTitle")}
                    </Text>
                    <Text style={styles.progressSubtitle}>
                        {t("explore.library.progressSubtitle")}
                    </Text>
                </View>
                <Text style={styles.progressCount}>
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
                                style={styles.progressCard}
                            >
                                <View style={styles.progressCardTop}>
                                    <Text style={styles.progressBadge}>
                                        {getLibraryProgressLabel(
                                            progress?.status,
                                        )}
                                    </Text>
                                    {progress?.current_page ? (
                                        <Text style={styles.progressPage}>
                                            {t("explore.library.pageLabel", {
                                                page: progress.current_page,
                                            })}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text
                                    numberOfLines={2}
                                    style={styles.progressBookTitle}
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
                                        style={styles.progressNote}
                                    >
                                        {progress.note}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                </View>
            ) : (
                <Text style={styles.progressEmpty}>
                    {t("explore.library.progressEmpty")}
                </Text>
            )}
        </View>
    );
}

function LibraryCard({ index, item, onOpen, progress, t }) {
    const meta = getBookMeta(item);
    const description = getBookDescription(item);

    return (
        <Pressable
            onPress={() => onOpen(item)}
            style={styles.card}
            testID='web-app-library-card'
        >
            <View style={styles.cardTop}>
                <View style={styles.bookIcon}>
                    <BookOpen color={ACCENT} size={19} strokeWidth={2.1} />
                </View>
                {meta.sourceUrl ? (
                    <ExternalLink color='#d1d5db' size={16} strokeWidth={2.2} />
                ) : null}
            </View>

            {progress ? (
                <View style={styles.progressInline}>
                    <Text style={styles.inlineBadge}>
                        {getLibraryProgressLabel(progress.status)}
                    </Text>
                    {progress.current_page ? (
                        <Text style={styles.inlinePage}>
                            {t("explore.library.pageLabel", {
                                page: progress.current_page,
                            })}
                        </Text>
                    ) : null}
                </View>
            ) : null}

            <Text numberOfLines={2} style={styles.cardTitle}>
                {getBookTitle(
                    item,
                    index,
                    t("explore.library.bookFallback", { number: index + 1 }),
                )}
            </Text>
            {description ? (
                <Text numberOfLines={3} style={styles.cardDescription}>
                    {description}
                </Text>
            ) : null}

            <View style={styles.metaRow}>
                {meta.author ? (
                    <Text numberOfLines={1} style={styles.meta}>
                        {meta.author}
                    </Text>
                ) : null}
                {meta.category ? (
                    <Text numberOfLines={1} style={styles.meta}>
                        {meta.category}
                    </Text>
                ) : null}
                {meta.level ? (
                    <Text numberOfLines={1} style={styles.meta}>
                        {meta.level}
                    </Text>
                ) : null}
                {meta.format ? (
                    <Text
                        numberOfLines={1}
                        style={[styles.meta, styles.metaUpper]}
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
}) {
    const { t } = useMobileLocale();
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
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-library-surface' />
            <View style={styles.header}>
                <Text style={styles.eyebrow}>
                    {t("explore.library.eyebrow")}
                </Text>
                <Text style={styles.title}>{t("explore.library.title")}</Text>
                <Text style={styles.subtitle}>
                    {t("explore.library.subtitle")}
                </Text>
            </View>

            {isAuthenticated ? (
                <ProgressSummary
                    items={items}
                    progressMap={libraryProgressMap}
                    t={t}
                />
            ) : null}

            <View style={styles.search}>
                <TextInput
                    onChangeText={setSearch}
                    placeholder={t("explore.library.searchPlaceholder")}
                    placeholderTextColor='#9ca3af'
                    style={styles.input}
                    testID='web-app-library-search'
                    value={search}
                />
            </View>

            <View style={styles.filterGroup}>
                <FilterPill
                    active={!category}
                    label={t("explore.library.allCategories")}
                    onPress={() => setCategory("")}
                    testID='web-app-library-category-all'
                />
                {categories.map((item) => (
                    <FilterPill
                        active={category === item}
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
                        label={t("explore.library.allLevels")}
                        onPress={() => setLevel("")}
                        testID='web-app-library-level-all'
                    />
                    {levels.map((item) => (
                        <FilterPill
                            active={level === item}
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
                        label={t("explore.library.allProgress")}
                        onPress={() => onSelectProgressFilter("")}
                        testID='web-app-library-progress-all'
                    />
                    {LIBRARY_PROGRESS_STATUSES.map((item) => (
                        <FilterPill
                            active={libraryProgressFilter === item.key}
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
                <Text style={styles.error}>
                    {t("explore.common.refreshError", {
                        subject: t("explore.library.title"),
                    })}
                </Text>
            ) : null}
            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color={ACCENT} size='small' />
                    <Text style={styles.stateText}>
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
                <View style={styles.empty}>
                    <BookOpen color='#9ca3af' size={32} strokeWidth={1.8} />
                    <Text style={styles.emptyTitle}>
                        {items.length
                            ? t("explore.common.notFound", {
                                  subject: t("explore.library.title"),
                              })
                            : t("explore.common.notAvailable", {
                                  subject: t("explore.library.title"),
                              })}
                    </Text>
                    <Text style={styles.emptyText}>
                        {items.length
                            ? t("explore.common.changeSearchOrFilter")
                            : t("explore.common.retryLater")}
                    </Text>
                </View>
            ) : null}

            {pagination?.hasMore && !loading && !error ? (
                <View style={styles.loadMoreWrap}>
                    <Pressable
                        disabled={pagination.loadingMore}
                        onPress={onLoadMore}
                        style={[
                            styles.loadMoreButton,
                            pagination.loadingMore &&
                                styles.loadMoreButtonDisabled,
                        ]}
                        testID='web-app-library-load-more'
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
});
