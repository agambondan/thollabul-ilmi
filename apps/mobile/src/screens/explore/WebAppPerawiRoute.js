import { ListChecks, Users } from "lucide-react-native";
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
import { normalizeSearchText } from "../ExploreScreen.helpers";
import { PerawiSanadTreeMobile } from "./PerawiSanadTreeMobile";

const TABAQAH_LABELS = {
    nabi: "explore.perawi.tabaqah.nabi",
    sahabat: "explore.perawi.tabaqah.sahabat",
    tabiin: "explore.perawi.tabaqah.tabiin",
    tabiut_tabiin: "explore.perawi.tabaqah.tabiutTabiin",
    atbaut_tabiin: "explore.perawi.tabaqah.atbautTabiin",
    tabaqah_5: "explore.perawi.tabaqah.fifth",
    tabaqah_6: "explore.perawi.tabaqah.sixth",
    tabaqah_7: "explore.perawi.tabaqah.seventh",
};

const STATUS_ACCENTS = {
    dhaif: { backgroundColor: "#ffedd5", color: "#c2410c" },
    kadzdzab: { backgroundColor: "#fee2e2", color: "#b91c1c" },
    la_baasa_bihi: { backgroundColor: "#cffafe", color: "#0e7490" },
    layyin: { backgroundColor: "#fef3c7", color: "#b45309" },
    majhul: { backgroundColor: "#f3f4f6", color: "#4b5563" },
    maqbul: { backgroundColor: "#e0f2fe", color: "#0369a1" },
    matruk: { backgroundColor: "#fee2e2", color: "#b91c1c" },
    nabi: { backgroundColor: "#fef3c7", color: "#b45309" },
    shaduq: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
    tsiqah: { backgroundColor: "#dcfce7", color: "#15803d" },
    tsiqah_tsiqah: { backgroundColor: "#d1fae5", color: "#047857" },
};

const getRaw = (item) => item?.raw ?? {};
const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";
const getPerawiId = (item) =>
    getRaw(item).id ?? item?.id ?? getPerawiLatin(item);
const getPerawiArabic = (item) =>
    pickText(getRaw(item).nama_arab, item?.arabic);
const getPerawiLatin = (item, fallback = "Perawi hadis") =>
    pickText(
        getRaw(item).nama_latin,
        getRaw(item).nama_lengkap,
        item?.title,
        fallback,
    );
const getTabaqah = (item) => pickText(getRaw(item).tabaqah);
const getDeathYear = (item) =>
    getRaw(item).tahun_wafat ?? getRaw(item).wafat_hijri;
const getStatus = (item) => pickText(getRaw(item).status);

const getTabaqahLabel = (value, t) => {
    if (!value) return "";
    return TABAQAH_LABELS[value]
        ? t(TABAQAH_LABELS[value])
        : value.replace(/_/g, " ");
};

const getStatusLabel = (value) => {
    if (!value) return "";
    return value.replace(/_/g, " ");
};

const uniqueTabaqah = (items) =>
    Array.from(new Set(items.map(getTabaqah).filter(Boolean)));

function TabaqahPill({ active, isDarkTheme, label, onPress, testID }) {
    return (
        <Pressable
            accessibilityRole='button'
            onPress={onPress}
            style={[
                styles.tabaqahPill,
                isDarkTheme && styles.tabaqahPillDark,
                active && styles.tabaqahPillActive,
            ]}
            testID={testID}
        >
            <Text
                style={[
                    styles.tabaqahPillText,
                    isDarkTheme && styles.tabaqahPillTextDark,
                    active && styles.tabaqahPillTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function StatusBadge({ status }) {
    if (!status) return null;
    const accent = STATUS_ACCENTS[status] ?? {
        backgroundColor: "#f3f4f6",
        color: "#4b5563",
    };
    return (
        <Text style={[styles.statusBadge, accent]}>
            {getStatusLabel(status)}
        </Text>
    );
}

function PerawiCard({ isDarkTheme, item, onOpen, t }) {
    const arabic = getPerawiArabic(item);
    const latin = getPerawiLatin(item, t("explore.perawi.fallbackTitle"));
    const tabaqah = getTabaqah(item);
    const deathYear = getDeathYear(item);
    const status = getStatus(item);

    return (
        <Pressable
            accessibilityRole='button'
            onPress={() => onOpen(item)}
            style={[styles.card, isDarkTheme && styles.cardDark]}
            testID='web-app-perawi-card'
        >
            <View style={[styles.icon, isDarkTheme && styles.iconDark]}>
                <Users color={isDarkTheme ? "#34d399" : "#0f766e"} size={18} strokeWidth={2.1} />
            </View>
            <View style={styles.cardBody}>
                {arabic ? (
                    <Text numberOfLines={1} style={[styles.arabic, isDarkTheme && styles.arabicDark]}>
                        {arabic}
                    </Text>
                ) : null}
                <Text numberOfLines={1} style={[styles.latin, isDarkTheme && styles.latinDark]}>
                    {latin}
                </Text>
                <View style={styles.metaRow}>
                    {tabaqah ? (
                        <Text style={[styles.meta, isDarkTheme && styles.metaDark]}>
                            {getTabaqahLabel(tabaqah, t)}
                        </Text>
                    ) : null}
                    {deathYear ? (
                        <Text style={[styles.meta, isDarkTheme && styles.metaDark]}>· {deathYear} H</Text>
                    ) : null}
                </View>
                <StatusBadge status={status} />
            </View>
        </Pressable>
    );
}

export function WebAppPerawiRoute({
    error,
    items,
    loading,
    onLoadMore,
    onOpenItem,
    pagination,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme } = useLayoutModePreference();
    const [viewMode, setViewMode] = useState("list");
    const [search, setSearch] = useState("");
    const [tabaqah, setTabaqah] = useState("");
    const tabaqahOptions = useMemo(() => uniqueTabaqah(items), [items]);
    const filteredItems = useMemo(() => {
        const query = normalizeSearchText(search);
        return items.filter((item) => {
            const raw = getRaw(item);
            const text = [
                getPerawiArabic(item),
                getPerawiLatin(item, t("explore.perawi.fallbackTitle")),
                raw.nama_lengkap,
                getTabaqahLabel(getTabaqah(item), t),
                getStatusLabel(getStatus(item)),
                item?.body,
            ].join(" ");
            return (
                (!query || normalizeSearchText(text).includes(query)) &&
                (!tabaqah || getTabaqah(item) === tabaqah)
            );
        });
    }, [items, search, tabaqah, t]);

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-perawi-surface' />
            <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                    <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.perawi.title")}</Text>
                    {items.length ? (
                        <Text style={[styles.count, isDarkTheme && styles.countDark]}>
                            {t("explore.perawi.count", { count: items.length })}
                        </Text>
                    ) : null}
                </View>

                {/* View Switcher */}
                <View style={[styles.viewSwitcher, isDarkTheme && styles.viewSwitcherDark]}>
                    <Pressable
                        onPress={() => setViewMode("list")}
                        style={[
                            styles.viewSwitchButton,
                            isDarkTheme && styles.viewSwitchButtonDark,
                            viewMode === "list" && styles.viewSwitchButtonActive,
                        ]}
                    >
                        <ListChecks
                            color={viewMode === "list" ? (isDarkTheme ? "#34d399" : "#0f766e") : (isDarkTheme ? "#6ee7b7" : "#64748b")}
                            size={14}
                        />
                        <Text
                            style={[
                                styles.viewSwitchText,
                                isDarkTheme && styles.viewSwitchTextDark,
                                viewMode === "list" && styles.viewSwitchTextActive,
                            ]}
                        >
                            Daftar
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setViewMode("tree")}
                        style={[
                            styles.viewSwitchButton,
                            isDarkTheme && styles.viewSwitchButtonDark,
                            viewMode === "tree" && styles.viewSwitchButtonActive,
                        ]}
                    >
                        <Users
                            color={viewMode === "tree" ? (isDarkTheme ? "#34d399" : "#0f766e") : (isDarkTheme ? "#6ee7b7" : "#64748b")}
                            size={14}
                        />
                        <Text
                            style={[
                                styles.viewSwitchText,
                                isDarkTheme && styles.viewSwitchTextDark,
                                viewMode === "tree" && styles.viewSwitchTextActive,
                            ]}
                        >
                            Bagan
                        </Text>
                    </Pressable>
                </View>
            </View>

            {viewMode === "tree" ? (
                <PerawiSanadTreeMobile onOpenPerawi={onOpenItem} />
            ) : (
                <>
                    <View style={[styles.search, isDarkTheme && styles.searchDark]}>
                        <TextInput
                            onChangeText={setSearch}
                            placeholder={t("explore.perawi.searchPlaceholder")}
                            placeholderTextColor='#9ca3af'
                            style={[styles.input, isDarkTheme && styles.inputDark]}
                            testID='web-app-perawi-search'
                            value={search}
                        />
                    </View>

                    <View style={styles.tabaqahRow}>
                        <TabaqahPill
                            active={!tabaqah}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.common.all")}
                            onPress={() => setTabaqah("")}
                            testID='web-app-perawi-tabaqah-all'
                        />
                        {tabaqahOptions.map((item) => (
                            <TabaqahPill
                                active={tabaqah === item}
                                isDarkTheme={isDarkTheme}
                                key={item}
                                label={getTabaqahLabel(item, t)}
                                onPress={() => setTabaqah(tabaqah === item ? "" : item)}
                                testID={`web-app-perawi-tabaqah-${item}`}
                            />
                        ))}
                    </View>

                    {error ? (
                        <Text style={[styles.error, isDarkTheme && styles.errorDark]}>
                            {t("explore.common.refreshError", {
                                subject: t("explore.perawi.fallbackTitle"),
                            })}
                        </Text>
                    ) : null}
                    {loading ? (
                        <View style={[styles.state, isDarkTheme && styles.stateDark]}>
                            <ActivityIndicator color={isDarkTheme ? "#34d399" : "#0f766e"} size='small' />
                            <Text style={[styles.stateText, isDarkTheme && styles.stateTextDark]}>
                                {t("explore.perawi.loading")}
                            </Text>
                        </View>
                    ) : null}

                    {!loading && !error && filteredItems.length ? (
                        <View style={styles.grid}>
                            {filteredItems.map((item, index) => (
                                <PerawiCard
                                    isDarkTheme={isDarkTheme}
                                    item={item}
                                    key={`${getPerawiId(item)}-${index}`}
                                    onOpen={onOpenItem}
                                    t={t}
                                />
                            ))}
                        </View>
                    ) : null}

                    {!loading && !error && !filteredItems.length ? (
                        <View style={[styles.empty, isDarkTheme && styles.emptyDark]}>
                            <Users color={isDarkTheme ? "#64748b" : "#9ca3af"} size={32} strokeWidth={1.8} />
                            <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                                {items.length
                                    ? t("explore.common.notFound", {
                                          subject: t("explore.perawi.fallbackTitle"),
                                      })
                                    : t("explore.common.notAvailable", {
                                          subject: t("explore.perawi.fallbackTitle"),
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
                                testID='web-app-perawi-load-more'
                            >
                                <Text style={styles.loadMoreText}>
                                    {pagination.loadingMore
                                        ? t("explore.common.loadingShort")
                                        : t("explore.common.loadMore")}
                                </Text>
                            </Pressable>
                        </View>
                    ) : null}
                </>
            )}
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    headerTitleWrap: {
        flex: 1,
    },
    viewSwitcher: {
        flexDirection: "row",
        backgroundColor: "#e2e8f0",
        borderRadius: radius.md,
        padding: 2,
    },
    viewSwitcherDark: {
        backgroundColor: "#1e293b",
    },
    viewSwitchButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    viewSwitchButtonDark: {
        backgroundColor: "transparent",
    },
    viewSwitchButtonActive: {
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
        elevation: 1,
    },
    viewSwitchText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#64748b",
    },
    viewSwitchTextDark: {
        color: "#94a3b8",
    },
    viewSwitchTextActive: {
        color: "#0f766e",
        fontWeight: "800",
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
    search: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: "center",
        marginBottom: spacing.md,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    searchDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    input: {
        color: "#111827",
        fontSize: 14,
        minHeight: 42,
        padding: 0,
    },
    inputDark: {
        color: "#e2e8f0",
    },
    tabaqahRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    tabaqahPill: {
        backgroundColor: "#f3f4f6",
        borderColor: "#f3f4f6",
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 30,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
    },
    tabaqahPillDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    tabaqahPillActive: {
        backgroundColor: "#0f766e",
        borderColor: "#0f766e",
    },
    tabaqahPillText: {
        color: "#4b5563",
        fontSize: 12,
        fontWeight: "800",
    },
    tabaqahPillTextDark: {
        color: "#94a3b8",
    },
    tabaqahPillTextActive: {
        color: "#ffffff",
    },
    grid: {
        gap: spacing.sm,
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#f3f4f6",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        padding: spacing.md,
    },
    cardDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    icon: {
        alignItems: "center",
        backgroundColor: "#ccfbf1",
        borderRadius: 12,
        height: 40,
        justifyContent: "center",
        width: 40,
    },
    iconDark: {
        backgroundColor: "#064e3b",
    },
    cardBody: {
        flex: 1,
        minWidth: 0,
    },
    arabic: {
        color: "#1f2937",
        fontFamily: "serif",
        fontSize: 17,
        lineHeight: 32,
        textAlign: "right",
    },
    arabicDark: {
        color: "#e2e8f0",
    },
    latin: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "900",
        lineHeight: 18,
        marginTop: 2,
    },
    latinDark: {
        color: "#f8fafc",
    },
    metaRow: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 2,
        marginTop: 6,
    },
    meta: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "700",
    },
    metaDark: {
        color: "#94a3b8",
    },
    statusBadge: {
        alignSelf: "flex-start",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: "800",
        marginTop: 7,
        overflow: "hidden",
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        textTransform: "capitalize",
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 150,
    },
    stateDark: {
        backgroundColor: "transparent",
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
        backgroundColor: "#450a0a",
        borderColor: "#7f1d1d",
        color: "#fca5a5",
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
        backgroundColor: "#1e293b",
        borderColor: "#334155",
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
        backgroundColor: "#0f766e",
        borderRadius: radius.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    loadMoreButtonDisabled: {
        opacity: 0.6,
    },
    loadMoreText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
});
