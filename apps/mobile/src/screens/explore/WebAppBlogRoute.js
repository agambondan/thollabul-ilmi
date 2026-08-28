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
            onPress={() => onOpen(item)}
            style={styles.card}
            testID='web-app-blog-card'
        >
            {cover ? (
                <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: cover }}
                    style={styles.cover}
                />
            ) : null}
            <View style={styles.body}>
                {category ? (
                    <Text style={styles.category}>{category}</Text>
                ) : null}
                <Text numberOfLines={2} style={styles.title}>
                    {getTitle(item)}
                </Text>
                {getExcerpt(item) ? (
                    <Text numberOfLines={2} style={styles.excerpt}>
                        {getExcerpt(item)}
                    </Text>
                ) : null}
                {author || publishedAt ? (
                    <View style={styles.metaRow}>
                        {author ? (
                            <Text numberOfLines={1} style={styles.meta}>
                                {author}
                            </Text>
                        ) : (
                            <View />
                        )}
                        {publishedAt ? (
                            <Text style={styles.meta}>{publishedAt}</Text>
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
    onSelectCategory,
    onSearch,
}) {
    const { t } = useMobileLocale();

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-blog-surface' />
            <View style={styles.header}>
                <Text style={styles.heading}>{t("explore.blog.title")}</Text>
                <Text style={styles.subtitle}>
                    {t("explore.blog.subtitle")}
                </Text>
            </View>

            <View style={styles.search}>
                <TextInput
                    onChangeText={onSearch}
                    placeholder={t("explore.blog.searchPlaceholder")}
                    placeholderTextColor='#9ca3af'
                    style={styles.input}
                    testID='web-app-blog-search'
                    value={blogSearch}
                />
            </View>

            {categories.length ? (
                <View style={styles.categories}>
                    <Pressable
                        onPress={() => onSelectCategory("")}
                        style={[
                            styles.categoryPill,
                            !blogCategory && styles.categoryPillActive,
                        ]}
                        testID='web-app-blog-category-all'
                    >
                        <Text
                            style={[
                                styles.categoryPillText,
                                !blogCategory && styles.categoryPillTextActive,
                            ]}
                        >
                            {t("explore.common.all")}
                        </Text>
                    </Pressable>
                    {categories.map((category) => (
                        <Pressable
                            key={category.value}
                            onPress={() => onSelectCategory(category.value)}
                            style={[
                                styles.categoryPill,
                                blogCategory.toLowerCase() ===
                                    category.value.toLowerCase() &&
                                    styles.categoryPillActive,
                            ]}
                            testID={`web-app-blog-category-${category.value}`}
                        >
                            <Text
                                style={[
                                    styles.categoryPillText,
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

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color='#047857' size='small' />
                    <Text style={styles.stateText}>
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
                            item={item}
                            key={`${getItemKey(item)}-${index}`}
                            onOpen={onOpenItem}
                        />
                    ))}
                </View>
            ) : null}
            {!loading && !error && !filteredItems.length ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyArabic}>كِتَابَةً</Text>
                    <Text style={styles.emptyTitle}>
                        {hasItems
                            ? t("explore.blog.emptyFilteredTitle")
                            : t("explore.blog.emptyTitle")}
                    </Text>
                    <Text style={styles.emptyText}>
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
    error: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        borderRadius: radius.md,
        borderWidth: 1,
        color: "#b91c1c",
        fontSize: 13,
        fontWeight: "800",
        marginBottom: spacing.md,
        padding: spacing.md,
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
});
