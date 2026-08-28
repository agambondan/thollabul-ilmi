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
import { radius, spacing } from "../../theme";
import { normalizeSearchText } from "../ExploreScreen.helpers";

const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";
const getRaw = (item) => item?.raw ?? {};
const toStr = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return pickText(value.name, value.title, value.label, value.value);
};
const titleCase = (value) =>
    value
        ? value
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())
        : "";

const formatYear = (raw, t) => {
    if (raw.year_hijri)
        return `${raw.year_hijri} ${t("explore.reference.yearHijri")}`;
    if (raw.year_miladi == null) return "";
    return Number(raw.year_miladi) < 0
        ? `${Math.abs(Number(raw.year_miladi))} ${t("explore.reference.yearBeforeCommon")}`
        : `${raw.year_miladi} ${t("explore.reference.yearCommon")}`;
};

export const WEB_APP_REFERENCE_ROUTE_CONFIGS = {
    dzikir: {
        arabicHeading: "الذِّكْر",
        categories: [
            "pagi",
            "petang",
            "setelah_sholat",
            "tidur",
            "safar",
            "dzikir_umum",
        ],
        emptyTextKey: "explore.reference.dzikir.empty",
        loadingTextKey: "explore.reference.dzikir.loading",
        searchPlaceholderKey: "explore.reference.dzikir.searchPlaceholder",
        subtitleKey: "explore.reference.dzikir.subtitle",
        titleKey: "explore.reference.dzikir.title",
        unitKey: "explore.reference.dzikir.unit",
    },
    wirid: {
        arabicHeading: "الوِرْد",
        categories: ["pagi", "petang", "setelah_sholat", "tidur", "umum"],
        emptyTextKey: "explore.reference.wirid.empty",
        loadingTextKey: "explore.reference.wirid.loading",
        searchPlaceholderKey: "explore.reference.wirid.searchPlaceholder",
        subtitleKey: "explore.reference.wirid.subtitle",
        titleKey: "explore.reference.wirid.title",
        unitKey: "explore.reference.wirid.unit",
    },
    tahlil: {
        arabicHeading: "التَّهْلِيل",
        categories: ["tahlil", "yasin", "doa", "umum"],
        emptyTextKey: "explore.reference.tahlil.empty",
        loadingTextKey: "explore.reference.tahlil.loading",
        searchPlaceholderKey: "explore.reference.tahlil.searchPlaceholder",
        subtitleKey: "explore.reference.tahlil.subtitle",
        titleKey: "explore.reference.tahlil.title",
        unitKey: "explore.reference.tahlil.unit",
    },
    "asmaul-husna": {
        arabicHeading: "أَسْمَاءُ اللهِ الحُسْنَى",
        emptyTextKey: "explore.reference.asmaulHusna.empty",
        leading: "number",
        loadingTextKey: "explore.reference.asmaulHusna.loading",
        searchPlaceholderKey: "explore.reference.asmaulHusna.searchPlaceholder",
        subtitleKey: "explore.reference.asmaulHusna.subtitle",
        titleKey: "explore.reference.asmaulHusna.title",
        unitKey: "explore.reference.asmaulHusna.unit",
    },
    "panduan-sholat": {
        categories: ["wudhu", "sholat", "sunnah", "dzikir", "umum"],
        emptyTextKey: "explore.reference.panduanSholat.empty",
        loadingTextKey: "explore.reference.panduanSholat.loading",
        searchPlaceholderKey:
            "explore.reference.panduanSholat.searchPlaceholder",
        subtitleKey: "explore.reference.panduanSholat.subtitle",
        titleKey: "explore.reference.panduanSholat.title",
        unitKey: "explore.reference.panduanSholat.unit",
    },
    sejarah: {
        categories: [
            "khulafa",
            "dinasti",
            "peristiwa",
            "perang",
            "ulama",
            "nabi",
            "modern",
            "umum",
        ],
        emptyTextKey: "explore.reference.sejarah.empty",
        leading: "year",
        loadingTextKey: "explore.reference.sejarah.loading",
        searchPlaceholderKey: "explore.reference.sejarah.searchPlaceholder",
        subtitleKey: "explore.reference.sejarah.subtitle",
        titleKey: "explore.reference.sejarah.title",
        unitKey: "explore.reference.sejarah.unit",
    },
    manasik: {
        categories: ["haji", "umrah"],
        emptyTextKey: "explore.reference.manasik.empty",
        leading: "step",
        loadingTextKey: "explore.reference.manasik.loading",
        searchPlaceholderKey: "explore.reference.manasik.searchPlaceholder",
        subtitleKey: "explore.reference.manasik.subtitle",
        titleKey: "explore.reference.manasik.title",
        unitKey: "explore.reference.manasik.unit",
    },
    "jarh-tadil": {
        categories: ["tadil", "jarh"],
        emptyTextKey: "explore.reference.jarhTadil.empty",
        loadingTextKey: "explore.reference.jarhTadil.loading",
        searchPlaceholderKey: "explore.reference.jarhTadil.searchPlaceholder",
        subtitleKey: "explore.reference.jarhTadil.subtitle",
        titleKey: "explore.reference.jarhTadil.title",
        unitKey: "explore.reference.jarhTadil.unit",
    },
};

export const WEB_APP_REFERENCE_LIST_ROUTE_KEYS = new Set(
    Object.keys(WEB_APP_REFERENCE_ROUTE_CONFIGS),
);

const translateRouteConfig = (config, t, feature) => ({
    ...config,
    emptyText:
        config.emptyText ??
        (config.emptyTextKey
            ? t(config.emptyTextKey)
            : t("explore.reference.fallbackEmpty", {
                  title: feature?.title ?? t("explore.reference.fallbackData"),
              })),
    loadingText:
        config.loadingText ??
        (config.loadingTextKey
            ? t(config.loadingTextKey)
            : t("explore.reference.fallbackLoading")),
    searchPlaceholder:
        config.searchPlaceholder ??
        (config.searchPlaceholderKey
            ? t(config.searchPlaceholderKey)
            : t("explore.reference.fallbackSearchPlaceholder")),
    subtitle:
        config.subtitle ??
        (config.subtitleKey
            ? t(config.subtitleKey)
            : (feature?.subtitle ?? "")),
    title:
        config.title ??
        (config.titleKey
            ? t(config.titleKey)
            : (feature?.title ?? t("explore.reference.fallbackTitle"))),
    unit:
        config.unit ??
        (config.unitKey
            ? t(config.unitKey)
            : t("explore.reference.fallbackUnit")),
});

const getConfig = (feature, providedConfig, routeKey, t) =>
    translateRouteConfig(
        {
            ...(WEB_APP_REFERENCE_ROUTE_CONFIGS[feature?.key ?? routeKey] ??
                {}),
            ...(providedConfig ?? {}),
        },
        t,
        feature,
    );

const getItemId = (item, index) =>
    getRaw(item).id ??
    getRaw(item)._id ??
    getRaw(item).slug ??
    item?.id ??
    `reference-${index}`;
const getItemTitle = (item, index, t) =>
    pickText(
        getRaw(item).title_idn,
        getRaw(item).title_id,
        getRaw(item).title,
        getRaw(item).name_idn,
        getRaw(item).name,
        getRaw(item).latin,
        item?.title,
        t("explore.reference.itemFallback", { number: index + 1 }),
    );
const getItemBody = (item) =>
    pickText(
        item?.body,
        getRaw(item).translation?.latin_idn,
        getRaw(item).translation?.latin_en,
        getRaw(item).translation?.text_idn,
        getRaw(item).translation?.text_en,
        getRaw(item).translation?.description_idn,
        getRaw(item).translation?.description_en,
        getRaw(item).description_idn,
        getRaw(item).description_id,
        getRaw(item).description,
        getRaw(item).content_idn,
        getRaw(item).content_id,
        getRaw(item).content,
        getRaw(item).meaning,
        getRaw(item).answer,
        getRaw(item).text,
    );
const getItemArabic = (item) =>
    pickText(
        item?.arabic,
        getRaw(item).translation?.ar,
        getRaw(item).translation?.arab,
        getRaw(item).arabic,
        getRaw(item).arab,
        getRaw(item).text_arab,
        getRaw(item).nama_arab,
    );
const getItemMeta = (item) =>
    pickText(
        item?.meta,
        toStr(getRaw(item).category),
        toStr(getRaw(item).type),
        toStr(getRaw(item).occasion),
        toStr(getRaw(item).status),
        getRaw(item).source,
        getRaw(item).sumber,
    );
const getItemSearchText = (item, index, leading, t) => {
    const raw = getRaw(item);
    return [
        getItemTitle(item, index, t),
        getItemBody(item),
        getItemArabic(item),
        getItemMeta(item),
        getLeadingLabel(item, index, leading, t),
        raw.translation?.latin_idn,
        raw.translation?.latin_en,
        raw.translation?.text_idn,
        raw.translation?.text_en,
        raw.translation?.description_idn,
        raw.translation?.description_en,
        raw.source,
        raw.sumber,
    ].join(" ");
};
const getFilterCategory = (item) =>
    toStr(
        getRaw(item).category ??
            getRaw(item).jenis_nilai ??
            getRaw(item).type ??
            getRaw(item).occasion ??
            item?.meta,
    )
        .toLowerCase()
        .replace(/\s+/g, "_")
        .trim();
const getLeadingLabel = (item, index, leading, t) => {
    const raw = getRaw(item);
    if (leading === "step") return raw.step ? `${raw.step}` : `${index + 1}`;
    if (leading === "year") return formatYear(raw, t) || `${index + 1}`;
    if (leading === "number")
        return raw.number ? `${raw.number}` : `${index + 1}`;
    return "";
};

function CategoryPill({ active, label, onPress, testID }) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.categoryPill, active && styles.categoryPillActive]}
            testID={testID}
        >
            <Text
                style={[
                    styles.categoryPillText,
                    active && styles.categoryPillTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function ReferenceCard({ config, index, item, onOpen, t }) {
    const leading = getLeadingLabel(item, index, config.leading, t);
    const meta = getItemMeta(item);
    const body = getItemBody(item);
    const arabic = getItemArabic(item);

    return (
        <Pressable
            onPress={() => onOpen(item)}
            style={styles.card}
            testID='web-app-reference-card'
        >
            <View style={styles.cardTop}>
                {leading ? (
                    <View style={styles.leadingBadge}>
                        <Text numberOfLines={2} style={styles.leadingText}>
                            {leading}
                        </Text>
                    </View>
                ) : null}
                <View style={styles.cardMain}>
                    {meta ? (
                        <Text style={styles.metaBadge}>{titleCase(meta)}</Text>
                    ) : null}
                    <Text numberOfLines={2} style={styles.cardTitle}>
                        {getItemTitle(item, index, t)}
                    </Text>
                    {arabic ? (
                        <Text numberOfLines={2} style={styles.arabicText}>
                            {arabic}
                        </Text>
                    ) : null}
                    {body ? (
                        <Text numberOfLines={3} style={styles.cardBody}>
                            {body}
                        </Text>
                    ) : null}
                </View>
                <ChevronDown color='#9ca3af' size={22} strokeWidth={2.1} />
            </View>
        </Pressable>
    );
}

export function WebAppReferenceListRoute({
    config: providedConfig,
    error,
    feature,
    items,
    loading,
    onLoadMore,
    onOpenItem,
    pagination,
    routeKey,
}) {
    const { t } = useMobileLocale();
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");
    const config = getConfig(feature, providedConfig, routeKey, t);
    const key = routeKey ?? feature?.key ?? "reference";
    const categories = useMemo(() => {
        const seen = new Set();
        return [...(config.categories ?? []), ...items.map(getFilterCategory)]
            .filter(Boolean)
            .filter((item) => {
                if (seen.has(item)) return false;
                seen.add(item);
                return true;
            });
    }, [config.categories, items]);
    const filteredItems = useMemo(() => {
        const query = normalizeSearchText(search);
        return items.filter((item, index) => {
            const itemCategory = getFilterCategory(item);
            return (
                (!category || itemCategory === category) &&
                (!query ||
                    normalizeSearchText(
                        getItemSearchText(item, index, config.leading, t),
                    ).includes(query))
            );
        });
    }, [category, config.leading, items, search, t]);

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID={`explore-web-app-${key}-surface`} />
            <View style={styles.header}>
                {config.arabicHeading ? (
                    <Text style={styles.headerArabic}>
                        {config.arabicHeading}
                    </Text>
                ) : null}
                <Text style={styles.title}>{config.title}</Text>
                {config.subtitle ? (
                    <Text style={styles.subtitle}>{config.subtitle}</Text>
                ) : null}
            </View>

            <View style={styles.search}>
                <Search color='#9ca3af' size={16} strokeWidth={2} />
                <TextInput
                    onChangeText={setSearch}
                    placeholder={config.searchPlaceholder}
                    placeholderTextColor='#9ca3af'
                    style={styles.input}
                    testID={`web-app-${key}-search`}
                    value={search}
                />
            </View>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                    {search || category
                        ? t("explore.reference.filteredCount", {
                              filtered: filteredItems.length,
                              total: items.length,
                              unit: config.unit,
                          })
                        : t("explore.reference.availableCount", {
                              count: items.length,
                              unit: config.unit,
                          })}
                </Text>
                {search ? (
                    <Pressable
                        onPress={() => setSearch("")}
                        testID={`web-app-${key}-reset-search`}
                    >
                        <Text style={styles.resetText}>
                            {t("explore.reference.reset")}
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            {categories.length ? (
                <View style={styles.categoryWrap}>
                    <CategoryPill
                        active={!category}
                        label={t("explore.reference.all")}
                        onPress={() => setCategory("")}
                        testID={`web-app-${key}-category`}
                    />
                    {categories.map((item) => (
                        <CategoryPill
                            active={category === item}
                            key={item}
                            label={titleCase(item)}
                            onPress={() =>
                                setCategory(category === item ? "" : item)
                            }
                            testID={`web-app-${key}-category`}
                        />
                    ))}
                </View>
            ) : null}

            {error ? (
                <Text style={styles.error}>{t("explore.reference.error")}</Text>
            ) : null}
            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color='#059669' size='small' />
                    <Text style={styles.stateText}>{config.loadingText}</Text>
                </View>
            ) : null}

            {!loading && !error && filteredItems.length ? (
                <View style={styles.list}>
                    {filteredItems.map((item, index) => (
                        <ReferenceCard
                            config={config}
                            index={index}
                            item={item}
                            key={`${getItemId(item, index)}-${index}`}
                            onOpen={onOpenItem}
                            t={t}
                        />
                    ))}
                </View>
            ) : null}

            {!loading && !error && !filteredItems.length ? (
                <View style={styles.empty}>
                    <BookOpen color='#9ca3af' size={32} strokeWidth={1.8} />
                    <Text style={styles.emptyTitle}>
                        {items.length
                            ? t("explore.reference.emptyFilteredTitle")
                            : config.emptyText}
                    </Text>
                    <Text style={styles.emptyText}>
                        {items.length
                            ? t("explore.reference.emptyFilteredText")
                            : t("explore.reference.emptyText")}
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
                        testID={`web-app-${key}-load-more`}
                    >
                        <Text style={styles.loadMoreText}>
                            {pagination.loadingMore
                                ? t("explore.reference.loadingShort")
                                : t("explore.reference.loadMore")}
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
    headerArabic: {
        color: "#047857",
        fontSize: 30,
        fontWeight: "800",
        lineHeight: 42,
        marginBottom: spacing.xs,
        textAlign: "center",
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
    summaryRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: spacing.sm,
    },
    summaryText: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "800",
    },
    resetText: {
        color: "#059669",
        fontSize: 12,
        fontWeight: "900",
    },
    categoryWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
        marginTop: spacing.md,
    },
    categoryPill: {
        backgroundColor: "#eef2f7",
        borderRadius: 999,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
    },
    categoryPillActive: {
        backgroundColor: "#10b981",
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
    leadingBadge: {
        alignItems: "center",
        backgroundColor: "#d1fae5",
        borderRadius: 13,
        justifyContent: "center",
        minHeight: 38,
        paddingHorizontal: spacing.xs,
        width: 46,
    },
    leadingText: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        lineHeight: 15,
        textAlign: "center",
    },
    cardMain: {
        flex: 1,
        minWidth: 0,
    },
    metaBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#d1fae5",
        borderRadius: 999,
        color: "#047857",
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
    arabicText: {
        color: "#111827",
        fontSize: 20,
        fontWeight: "700",
        lineHeight: 32,
        marginTop: spacing.sm,
        textAlign: "right",
    },
    cardBody: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 17,
        marginTop: 4,
    },
    error: {
        backgroundColor: "#fef3c7",
        borderRadius: radius.md,
        color: "#92400e",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 17,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
        paddingVertical: spacing.xl,
    },
    stateText: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "700",
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        gap: spacing.xs,
        padding: spacing.xl,
    },
    emptyTitle: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
        textAlign: "center",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 17,
        textAlign: "center",
    },
    loadMoreWrap: {
        alignItems: "center",
        marginTop: spacing.lg,
    },
    loadMoreButton: {
        backgroundColor: "#10b981",
        borderRadius: 999,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    loadMoreButtonDisabled: {
        opacity: 0.65,
    },
    loadMoreText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
});
