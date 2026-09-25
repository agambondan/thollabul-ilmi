import { Search } from "lucide-react-native";
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
import { arabicTypography } from "../../styles/arabicTypography";
import { radius, spacing } from "../../theme";

const toStr = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value.name ?? value.title ?? value.label ?? value.value ?? "";
};

const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";

const getRaw = (item) => item?.raw ?? {};
const getArabic = (item) =>
    pickText(
        getRaw(item).arabic,
        getRaw(item).word_arabic,
        getRaw(item).term,
        item?.arabic,
    );
const getLatin = (item) =>
    pickText(
        getRaw(item).latin,
        getRaw(item).transliteration,
        getRaw(item).term,
        item?.title,
    );
const getMeaning = (item) =>
    pickText(
        getRaw(item).meaning?.idn,
        getRaw(item).meaning?.id,
        getRaw(item).meaning?.en,
        getRaw(item).meaning,
        getRaw(item).definition?.idn,
        getRaw(item).definition?.id,
        getRaw(item).definition?.en,
        getRaw(item).definition,
        item?.body,
    );
const getRoot = (item) =>
    toStr(
        getRaw(item).root ??
            getRaw(item).word_root ??
            getRaw(item).origin ??
            getRaw(item).source,
    );

const SUGGESTED_TERMS = [
    { arabic: "إيمان", label: "Iman" },
    { arabic: "كتاب", label: "Kitab" },
    { arabic: "صلاة", label: "Sholat" },
    { arabic: "تقوى", label: "Taqwa" },
    { arabic: "علم", label: "Ilmu" },
    { arabic: "رحمة", label: "Rahmat" },
    { arabic: "قلب", label: "Qalb" },
    { arabic: "جنة", label: "Jannah" },
];

function KamusResultCard({ isDarkTheme, item }) {
    return (
        <View style={[styles.resultCard, isDarkTheme && styles.resultCardDark]} testID='web-app-kamus-result-card'>
            <Text numberOfLines={1} style={[styles.arabicText, isDarkTheme && styles.arabicTextDark]}>
                {getArabic(item) || "-"}
            </Text>
            <View style={styles.resultBody}>
                <Text numberOfLines={1} style={[styles.latinText, isDarkTheme && styles.latinTextDark]}>
                    {getLatin(item) || "-"}
                </Text>
                <Text numberOfLines={3} style={[styles.meaningText, isDarkTheme && styles.meaningTextDark]}>
                    {getMeaning(item) || "-"}
                </Text>
                <Text numberOfLines={1} style={[styles.rootText, isDarkTheme && styles.rootTextDark]}>
                    {getRoot(item) || "-"}
                </Text>
            </View>
        </View>
    );
}

export function WebAppKamusRoute({
    dictionaryInputRef,
    dictionaryQuery,
    error,
    focusDictionaryInput,
    items,
    isDarkTheme: isDarkThemeProp = false,
    loading,
    onSearch,
    onUpdateQuery,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const isDarkTheme = isDarkThemeProp || isDarkThemePref;
    const query = dictionaryQuery.trim();

    const handleSelectSuggestion = (term) => {
        onUpdateQuery(term.label);
    };

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-kamus-surface' />
            <View style={styles.header}>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.kamus.title")}</Text>
                <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                    {t("explore.kamus.subtitle")}
                </Text>
            </View>

            <View style={styles.searchWrap}>
                <View style={[styles.searchBox, isDarkTheme && styles.searchBoxDark]}>
                    <Search color={isDarkTheme ? '#64748b' : '#9ca3af'} size={17} strokeWidth={2} />
                    <TextInput
                        ref={dictionaryInputRef}
                        autoCapitalize='none'
                        autoFocus={focusDictionaryInput}
                        onChangeText={onUpdateQuery}
                        onSubmitEditing={onSearch}
                        placeholder={t("explore.kamus.searchPlaceholder")}
                        placeholderTextColor={isDarkTheme ? '#64748b' : '#9ca3af'}
                        returnKeyType='search'
                        style={[styles.input, isDarkTheme && styles.inputDark]}
                        testID='web-app-kamus-search'
                        value={dictionaryQuery}
                    />
                </View>
                <Pressable
                    accessibilityRole='button'
                    onPress={onSearch}
                    style={[styles.searchButton, isDarkTheme && styles.searchButtonDark]}
                    testID='web-app-kamus-submit'
                >
                    <Text style={styles.searchButtonText}>
                        {t("explore.kamus.searchAction")}
                    </Text>
                </Pressable>
            </View>

            {error ? <Text style={[styles.error, isDarkTheme && styles.errorDark]}>{error}</Text> : null}
            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color={isDarkTheme ? '#34d399' : '#059669'} size='small' />
                    <Text style={[styles.stateText, isDarkTheme && styles.stateTextDark]}>
                        {t("explore.kamus.loading")}
                    </Text>
                </View>
            ) : null}

            {!loading && query.length < 2 ? (
                <View style={styles.empty}>
                    <Search color={isDarkTheme ? '#475569' : '#cbd5e1'} size={40} strokeWidth={1.7} />
                    <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                        {t("explore.kamus.minCharsTitle")}
                    </Text>
                    <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                        {t("explore.kamus.minCharsText")}
                    </Text>

                    <View style={styles.suggestionsContainer}>
                        <Text style={[styles.suggestionsHeader, isDarkTheme && styles.suggestionsHeaderDark]}>
                            Kosakata Populer:
                        </Text>
                        <View style={styles.suggestionChips}>
                            {SUGGESTED_TERMS.map((term) => (
                                <Pressable
                                    key={term.label}
                                    onPress={() => handleSelectSuggestion(term)}
                                    style={[styles.suggestionChip, isDarkTheme && styles.suggestionChipDark]}
                                >
                                    <Text style={[styles.suggestionChipLatin, isDarkTheme && styles.suggestionChipLatinDark]}>
                                        {term.label}
                                    </Text>
                                    <Text style={[styles.suggestionChipArabic, isDarkTheme && styles.suggestionChipArabicDark]}>
                                        {term.arabic}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            ) : null}

            {!loading && query.length >= 2 && !items.length ? (
                <View style={styles.empty}>
                    <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                        {t("explore.kamus.noResultTitle")}
                    </Text>
                    <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                        {t("explore.kamus.noResultText", { query })}
                    </Text>
                    <View style={styles.suggestionsContainer}>
                        <Text style={[styles.suggestionsHeader, isDarkTheme && styles.suggestionsHeaderDark]}>
                            Coba kata kunci lain:
                        </Text>
                        <View style={styles.suggestionChips}>
                            {SUGGESTED_TERMS.map((term) => (
                                <Pressable
                                    key={term.label}
                                    onPress={() => handleSelectSuggestion(term)}
                                    style={[styles.suggestionChip, isDarkTheme && styles.suggestionChipDark]}
                                >
                                    <Text style={[styles.suggestionChipLatin, isDarkTheme && styles.suggestionChipLatinDark]}>
                                        {term.label}
                                    </Text>
                                    <Text style={[styles.suggestionChipArabic, isDarkTheme && styles.suggestionChipArabicDark]}>
                                        {term.arabic}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            ) : null}

            {!loading && items.length ? (
                <View style={[styles.results, isDarkTheme && styles.resultsDark]}>
                    <View style={[styles.tableHeader, isDarkTheme && styles.tableHeaderDark]}>
                        <Text style={[styles.headerCell, styles.arabicHeader, isDarkTheme && styles.headerCellDark]}>
                            {t("explore.kamus.columnArabic")}
                        </Text>
                        <Text style={[styles.headerCell, isDarkTheme && styles.headerCellDark]}>
                            {t("explore.kamus.columnLatin")}
                        </Text>
                        <Text style={[styles.headerCell, isDarkTheme && styles.headerCellDark]}>
                            {t("explore.kamus.columnMeaning")}
                        </Text>
                    </View>
                    {items.map((item, index) => (
                        <KamusResultCard
                            isDarkTheme={isDarkTheme}
                            item={item}
                            key={`${item?.id ?? getLatin(item) ?? "kamus"}-${index}`}
                        />
                    ))}
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
    title: {
        color: "#111827",
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 28,
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 3,
    },
    searchWrap: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    searchBox: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        borderWidth: 1,
        flex: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 46,
        paddingHorizontal: spacing.sm,
    },
    input: {
        color: "#111827",
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        paddingVertical: 9,
    },
    searchButton: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: 12,
        justifyContent: "center",
        minHeight: 46,
        paddingHorizontal: spacing.lg,
    },
    searchButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "900",
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.xl,
    },
    stateText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
    },
    empty: {
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    emptyTitle: {
        color: "#111827",
        fontSize: 16,
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
    suggestionsContainer: {
        marginTop: spacing.lg,
        width: "100%",
    },
    suggestionsHeader: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: spacing.sm,
        textAlign: "center",
    },
    suggestionChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        justifyContent: "center",
    },
    suggestionChip: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
    },
    suggestionChipLatin: {
        color: "#1e293b",
        fontSize: 13,
        fontWeight: "700",
    },
    suggestionChipArabic: {
        color: "#059669",
        fontFamily: "Kitab-Regular",
        fontSize: 15,
        lineHeight: 20,
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
    results: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        overflow: "hidden",
    },
    tableHeader: {
        backgroundColor: "#f1f5f9",
        flexDirection: "row",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    headerCell: {
        color: "#64748b",
        flex: 1,
        fontSize: 12,
        fontWeight: "900",
    },
    arabicHeader: {
        textAlign: "right",
    },
    resultCard: {
        borderColor: "#f1f5f9",
        borderTopWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    arabicText: {
        ...arabicTypography.body,
        color: "#1f2937",
        flex: 0.9,
    },
    resultBody: {
        flex: 2,
        gap: 3,
    },
    latinText: {
        color: "#475569",
        fontSize: 14,
        fontStyle: "italic",
        fontWeight: "700",
    },
    meaningText: {
        color: "#334155",
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 20,
    },
    rootText: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "700",
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
    searchBoxDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    inputDark: {
        color: "#f8fafc",
    },
    searchButtonDark: {
        backgroundColor: "#059669",
    },
    stateTextDark: {
        color: "#94a3b8",
    },
    emptyTitleDark: {
        color: "#f8fafc",
    },
    emptyTextDark: {
        color: "#94a3b8",
    },
    suggestionsHeaderDark: {
        color: "#94a3b8",
    },
    suggestionChipDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    suggestionChipLatinDark: {
        color: "#f8fafc",
    },
    suggestionChipArabicDark: {
        color: "#34d399",
    },
    resultsDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    tableHeaderDark: {
        backgroundColor: "#1e293b",
    },
    headerCellDark: {
        color: "#94a3b8",
    },
    resultCardDark: {
        borderColor: "#1e293b",
    },
    arabicTextDark: {
        color: "#34d399",
    },
    latinTextDark: {
        color: "#93c5fd",
    },
    meaningTextDark: {
        color: "#e2e8f0",
    },
    rootTextDark: {
        color: "#64748b",
    },
    errorDark: {
        backgroundColor: "#450a0a",
        color: "#f87171",
    },
});
