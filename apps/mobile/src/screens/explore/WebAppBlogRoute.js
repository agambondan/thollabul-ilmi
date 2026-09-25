import {
    ActivityIndicator,
    Image,
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

function BlogCard({
    formatDate,
    getAuthor,
    getCategoryLabel,
    getExcerpt,
    getItemKey,
    getRaw,
    getTitle,
    isDark,
    item,
    onOpen,
}) {
    const raw = getRaw(item);
    const category = getCategoryLabel(item);
    const author = getAuthor(item);
    const publishedAt = formatDate(
        raw.published_at ?? raw.publishedAt ?? raw.created_at,
    );
    const cover = [
        raw.cover_image,
        raw.coverImage,
        raw.image_url,
        raw.image,
    ].find((value) => typeof value === "string" && value.trim());

    return (
        <Pressable
            accessibilityRole='button'
            onPress={() => onOpen(item)}
            style={[styles.card, isDark && styles.cardDark]}
            testID='web-app-blog-card'
        >
            {cover ? (
                <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: cover }}
                    style={[styles.cover, isDark && styles.coverDark]}
                />
            ) : null}
            <View style={styles.body}>
                {category ? (
                    <Text
                        style={[styles.category, isDark && styles.categoryDark]}
                    >
                        {category}
                    </Text>
                ) : null}
                <Text
                    numberOfLines={2}
                    style={[styles.title, isDark && styles.titleDark]}
                >
                    {getTitle(item)}
                </Text>
                {getExcerpt(item) ? (
                    <Text
                        numberOfLines={2}
                        style={[styles.excerpt, isDark && styles.excerptDark]}
                    >
                        {getExcerpt(item)}
                    </Text>
                ) : null}
                {author || publishedAt ? (
                    <View style={styles.metaRow}>
                        {author ? (
                            <Text
                                numberOfLines={1}
                                style={[styles.meta, isDark && styles.metaDark]}
                            >
                                {author}
                            </Text>
                        ) : (
                            <View />
                        )}
                        {publishedAt ? (
                            <Text
                                style={[styles.meta, isDark && styles.metaDark]}
                            >
                                {publishedAt}
                            </Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

export function WebAppBlogRoute({
    blogCategory,
    blogSearch,
    categories,
    error,
    filteredItems,
    formatDate,
    getAuthor,
    getCategoryLabel,
    getExcerpt,
    getItemKey,
    getRaw,
    getTitle,
    hasItems,
    loading,
    onOpenItem,
    onRetry,
    onSelectCategory,
    onSearch,
    isDarkTheme = false,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const isDark = isDarkTheme || isDarkThemePref;

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
            <View testID='explore-web-app-blog-surface' />
            <View style={styles.header}>
                <Text style={[styles.heading, isDark && styles.headingDark]}>
                    {t("explore.blog.title")}
                </Text>
                <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                    {t("explore.blog.subtitle")}
                </Text>
            </View>

            <View style={[styles.search, isDark && styles.searchDark]}>
                <TextInput
                    onChangeText={onSearch}
                    placeholder={t("explore.blog.searchPlaceholder")}
                    placeholderTextColor={isDark ? "#64748b" : "#9ca3af"}
                    style={[styles.input, isDark && styles.inputDark]}
                    testID='web-app-blog-search'
                    value={blogSearch}
                />
            </View>

            {categories.length ? (
                <View style={styles.categories}>
                    <Pressable
                        accessibilityRole='button'
                        onPress={() => onSelectCategory("")}
                        style={[
                            styles.categoryPill,
                            isDark && styles.categoryPillDark,
                            !blogCategory && styles.categoryPillActive,
                            !blogCategory &&
                                isDark &&
                                styles.categoryPillActiveDark,
                        ]}
                        testID='web-app-blog-category-all'
                    >
                        <Text
                            style={[
                                styles.categoryPillText,
                                isDark && styles.categoryPillTextDark,
                                !blogCategory && styles.categoryPillTextActive,
                            ]}
                        >
                            {t("explore.common.all")}
                        </Text>
                    </Pressable>
                    {categories.map((category) => (
                        <Pressable
                            accessibilityRole='button'
                            key={category.value}
                            onPress={() => onSelectCategory(category.value)}
                            style={[
                                styles.categoryPill,
                                isDark && styles.categoryPillDark,
                                blogCategory.toLowerCase() ===
                                    category.value.toLowerCase() &&
                                    styles.categoryPillActive,
                                blogCategory.toLowerCase() ===
                                    category.value.toLowerCase() &&
                                    isDark &&
                                    styles.categoryPillActiveDark,
                            ]}
                            testID={`web-app-blog-category-${category.value}`}
                        >
                            <Text
                                style={[
                                    styles.categoryPillText,
                                    isDark && styles.categoryPillTextDark,
                                    blogCategory.toLowerCase() ===
                                        category.value.toLowerCase() &&
                                        styles.categoryPillTextActive,
                                ]}
                            >
                                {category.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={[styles.error, isDark && styles.errorDark]}>
                        {error}
                    </Text>
                    {onRetry ? (
                        <Pressable
                            accessibilityRole='button'
                            onPress={onRetry}
                            style={styles.retryButton}
                        >
                            <Text style={styles.retryButtonText}>
                                {t("explore.common.retryLater")}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
            {loading ? (
                <View style={[styles.state, isDark && styles.stateDark]}>
                    <ActivityIndicator
                        color={isDark ? "#34d399" : "#047857"}
                        size='small'
                    />
                    <Text
                        style={[
                            styles.stateText,
                            isDark && styles.stateTextDark,
                        ]}
                    >
                        {t("explore.blog.loading")}
                    </Text>
                </View>
            ) : null}
            {!loading && !error && filteredItems.length ? (
                <View style={styles.list}>
                    {filteredItems.map((item, index) => (
                        <BlogCard
                            formatDate={formatDate}
                            getAuthor={getAuthor}
                            getCategoryLabel={getCategoryLabel}
                            getExcerpt={getExcerpt}
                            getItemKey={getItemKey}
                            getRaw={getRaw}
                            getTitle={(entry) => getTitle(entry, index)}
                            isDark={isDark}
                            item={item}
                            key={`${getItemKey(item)}-${index}`}
                            onOpen={onOpenItem}
                        />
                    ))}
                </View>
            ) : null}
            {!loading && !error && !filteredItems.length ? (
                <View style={[styles.empty, isDark && styles.emptyDark]}>
                    <Text
                        style={[
                            styles.emptyArabic,
                            isDark && styles.emptyArabicDark,
                        ]}
                    >
                        كِتَابَةً
                    </Text>
                    <Text
                        style={[
                            styles.emptyTitle,
                            isDark && styles.emptyTitleDark,
                        ]}
                    >
                        {hasItems
                            ? t("explore.blog.emptyFilteredTitle")
                            : t("explore.blog.emptyTitle")}
                    </Text>
                    <Text
                        style={[
                            styles.emptyText,
                            isDark && styles.emptyTextDark,
                        ]}
                    >
                        {hasItems
                            ? t("explore.blog.emptyFilteredText")
                            : t("explore.blog.emptyText")}
                    </Text>
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
    heading: {
        color: "#064e3b",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing.xs,
    },
    search: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: "center",
        marginBottom: spacing.lg,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    input: {
        color: "#374151",
        fontSize: 14,
        minHeight: 42,
        padding: 0,
    },
    categories: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    categoryPill: {
        backgroundColor: "#f3f4f6",
        borderColor: "#f3f4f6",
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 30,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
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
    categoryPillTextActive: {
        color: "#ffffff",
    },
    list: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#f3f4f6",
        borderRadius: radius.md,
        borderWidth: 1,
        overflow: "hidden",
    },
    cover: {
        backgroundColor: "#e5e7eb",
        height: 144,
        width: "100%",
    },
    body: {
        padding: spacing.md,
    },
    category: {
        color: "#059669",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 0,
        marginBottom: spacing.xs,
        textTransform: "uppercase",
    },
    title: {
        color: "#064e3b",
        fontSize: 16,
        fontWeight: "900",
        lineHeight: 21,
    },
    excerpt: {
        color: "#4b5563",
        fontSize: 14,
        lineHeight: 20,
        marginTop: spacing.xs,
    },
    metaRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
        marginTop: spacing.md,
    },
    meta: {
        color: "#9ca3af",
        flexShrink: 1,
        fontSize: 12,
        fontWeight: "700",
    },
    state: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#f3f4f6",
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 120,
        padding: spacing.md,
    },
    stateText: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "800",
    },
    errorBox: {
        marginBottom: spacing.md,
    },
    error: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        borderRadius: radius.md,
        borderWidth: 1,
        color: "#b91c1c",
        fontSize: 13,
        fontWeight: "800",
        padding: spacing.md,
    },
    retryButton: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.md,
        justifyContent: "center",
        marginTop: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
    },
    retryButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "800",
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
    emptyArabic: {
        color: "#6ee7b7",
        fontFamily: "serif",
        fontSize: 34,
        marginBottom: spacing.sm,
    },
    emptyTitle: {
        color: "#4b5563",
        fontSize: 15,
        fontWeight: "900",
        textAlign: "center",
    },
    emptyText: {
        color: "#9ca3af",
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    rootDark: {
        backgroundColor: "#020617",
    },
    contentDark: {
        backgroundColor: "#020617",
    },
    headingDark: {
        color: "#f8fafc",
    },
    subtitleDark: {
        color: "#94a3b8",
    },
    searchDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    inputDark: {
        color: "#f8fafc",
    },
    categoryPillDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    categoryPillActiveDark: {
        backgroundColor: "#047857",
        borderColor: "#047857",
    },
    categoryPillTextDark: {
        color: "#cbd5e1",
    },
    cardDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    coverDark: {
        backgroundColor: "#1e293b",
    },
    categoryDark: {
        color: "#34d399",
    },
    titleDark: {
        color: "#f8fafc",
    },
    excerptDark: {
        color: "#cbd5e1",
    },
    metaDark: {
        color: "#94a3b8",
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
    emptyDark: {
        backgroundColor: "#111827",
        borderColor: "#243044",
    },
    emptyArabicDark: {
        color: "#34d399",
    },
    emptyTitleDark: {
        color: "#f8fafc",
    },
    emptyTextDark: {
        color: "#94a3b8",
    },
});
