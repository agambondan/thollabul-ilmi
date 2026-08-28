import { BookOpen, ExternalLink } from "lucide-react-native";
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

const ACCENT = "#34d399";

function KajianCard({
    getDescription,
    getDuration,
    getItemKey,
    getSpeaker,
    getTitle,
    getTopic,
    getType,
    getUrl,
    index,
    item,
    onOpenItem,
    onOpenUrl,
}) {
    const type = getType(item);
    const topic = getTopic(item);
    const speaker = getSpeaker(item);
    const duration = getDuration(item);
    const description = getDescription(item);
    const url = getUrl(item);

    return (
        <Pressable
            key={`${getItemKey(item)}-${index}`}
            onPress={() => {
                if (url) {
                    onOpenUrl(url);
                    return;
                }
                onOpenItem(item);
            }}
            style={styles.card}
            testID='web-app-kajian-card'
        >
            <View style={styles.cardHeader}>
                <View style={styles.badges}>
                    {type ? (
                        <Text
                            style={[
                                styles.badge,
                                type === "video" && styles.badgeVideo,
                            ]}
                        >
                            {type}
                        </Text>
                    ) : null}
                    {topic ? <Text style={styles.badge}>{topic}</Text> : null}
                </View>
                {url ? (
                    <ExternalLink color='#9ca3af' size={16} strokeWidth={2.2} />
                ) : null}
            </View>
            <Text numberOfLines={2} style={styles.cardTitle}>
                {getTitle(item, index)}
            </Text>
            {speaker ? <Text style={styles.speaker}>{speaker}</Text> : null}
            {duration ? <Text style={styles.duration}>{duration}</Text> : null}
            {description ? (
                <Text numberOfLines={3} style={styles.description}>
                    {description}
                </Text>
            ) : null}
        </Pressable>
    );
}

function KajianStat({ accent = "#047857", formatValue, label, value }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color: accent }]}>
                {formatValue(value)}
            </Text>
        </View>
    );
}

export function WebAppKajianRoute({
    categories,
    error,
    filteredItems,
    formatStat,
    getDescription,
    getDuration,
    getItemKey,
    getSpeaker,
    getTitle,
    getTopic,
    getType,
    getUrl,
    kajianCategory,
    kajianSearch,
    loading,
    onOpenItem,
    onOpenUrl,
    onSearch,
    onSelectCategory,
    summary,
}) {
    const { t } = useMobileLocale();

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-kajian-surface' />
            <View style={styles.header}>
                <Text style={styles.title}>{t("explore.kajian.title")}</Text>
                <Text style={styles.subtitle}>
                    {t("explore.kajian.subtitle")}
                </Text>
            </View>

            <View style={styles.stats}>
                <KajianStat
                    formatValue={formatStat}
                    label={t("explore.kajian.totalStat")}
                    value={summary.total}
                />
                <KajianStat
                    formatValue={formatStat}
                    label={t("explore.kajian.videoStat")}
                    value={summary.videoCount}
                />
                <KajianStat
                    formatValue={formatStat}
                    label={t("explore.kajian.categoryStat")}
                    value={summary.categoryCount}
                />
            </View>

            <View style={styles.search}>
                <TextInput
                    onChangeText={onSearch}
                    placeholder={t("explore.kajian.searchPlaceholder")}
                    placeholderTextColor='#9ca3af'
                    style={styles.input}
                    testID='web-app-kajian-search'
                    value={kajianSearch}
                />
            </View>

            <View style={styles.categories}>
                <Pressable
                    onPress={() => onSelectCategory("")}
                    style={[
                        styles.category,
                        !kajianCategory && styles.categoryActive,
                    ]}
                    testID='web-app-kajian-category-all'
                >
                    <Text
                        style={[
                            styles.categoryText,
                            !kajianCategory && styles.categoryTextActive,
                        ]}
                    >
                        {t("explore.common.all")}
                    </Text>
                </Pressable>
                {categories.map((category) => (
                    <Pressable
                        key={category}
                        onPress={() =>
                            onSelectCategory(
                                kajianCategory === category ? "" : category,
                            )
                        }
                        style={[
                            styles.category,
                            kajianCategory === category &&
                                styles.categoryActive,
                        ]}
                        testID={`web-app-kajian-category-${category}`}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                kajianCategory === category &&
                                    styles.categoryTextActive,
                            ]}
                        >
                            {category}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color={ACCENT} size='small' />
                    <Text style={styles.stateText}>
                        {t("explore.kajian.loading")}
                    </Text>
                </View>
            ) : null}
            {!loading && !error && filteredItems.length ? (
                <View style={styles.grid}>
                    {filteredItems.map((item, index) => (
                        <KajianCard
                            getDescription={getDescription}
                            getDuration={getDuration}
                            getItemKey={getItemKey}
                            getSpeaker={getSpeaker}
                            getTitle={getTitle}
                            getTopic={getTopic}
                            getType={getType}
                            getUrl={getUrl}
                            index={index}
                            item={item}
                            key={`${getItemKey(item)}-${index}`}
                            onOpenItem={onOpenItem}
                            onOpenUrl={onOpenUrl}
                        />
                    ))}
                </View>
            ) : null}
            {!loading && !error && !filteredItems.length ? (
                <View style={styles.empty}>
                    <BookOpen color='#9ca3af' size={32} strokeWidth={1.8} />
                    <Text style={styles.emptyTitle}>
                        {t("explore.kajian.emptyTitle")}
                    </Text>
                    <Text style={styles.emptyText}>
                        {t("explore.common.changeSearchOrFilter")}
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
        paddingBottom: spacing.md,
    },
    title: {
        color: "#1f2937",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 16,
        lineHeight: 24,
        marginTop: spacing.xs,
    },
    stats: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    statCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flex: 1,
        minHeight: 68,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    statLabel: {
        color: "#9ca3af",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "900",
        marginTop: 4,
    },
    search: {
        backgroundColor: "#ffffff",
        borderColor: "#34d399",
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: "center",
        marginBottom: spacing.md,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    input: {
        color: "#111827",
        fontSize: 14,
        minHeight: 42,
        padding: 0,
    },
    categories: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: spacing.lg,
    },
    category: {
        backgroundColor: "#f3f4f6",
        borderColor: "#f3f4f6",
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 26,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    categoryActive: {
        backgroundColor: "#10b981",
        borderColor: "#10b981",
    },
    categoryText: {
        color: "#4b5563",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    categoryTextActive: {
        color: "#ffffff",
    },
    error: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        borderRadius: 8,
        borderWidth: 1,
        color: "#991b1b",
        fontSize: 13,
        fontWeight: "700",
        marginBottom: spacing.md,
        padding: spacing.md,
        textAlign: "center",
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 160,
    },
    stateText: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "700",
    },
    grid: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 132,
        padding: spacing.md,
    },
    cardHeader: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    badges: {
        flexDirection: "row",
        flexWrap: "wrap",
        flex: 1,
        gap: spacing.xs,
    },
    badge: {
        backgroundColor: "#d1fae5",
        borderColor: "#d1fae5",
        borderRadius: 999,
        borderWidth: 1,
        color: "#047857",
        fontSize: 12,
        fontWeight: "800",
        overflow: "hidden",
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        textTransform: "capitalize",
    },
    badgeVideo: {
        backgroundColor: "#fee2e2",
        borderColor: "#fee2e2",
        color: "#ef4444",
    },
    cardTitle: {
        color: "#1f2937",
        fontSize: 14,
        fontWeight: "900",
        lineHeight: 19,
    },
    speaker: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        marginTop: 5,
    },
    duration: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 5,
    },
    description: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 180,
        padding: spacing.lg,
    },
    emptyTitle: {
        color: "#1f2937",
        fontSize: 16,
        fontWeight: "900",
        marginTop: spacing.sm,
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 13,
        lineHeight: 20,
        marginTop: spacing.xs,
        textAlign: "center",
    },
});
