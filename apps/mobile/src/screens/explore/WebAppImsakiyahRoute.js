import { CalendarDays } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getImsakiyahMonth } from "../../api/imsakiyah";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { radius, spacing } from "../../theme";
import {
    IMSAKIYAH_MONTH_WINDOW,
    currentImsakiyahMonth,
    imsakiyahMonthDistance,
    imsakiyahMonthKey,
    parseImsakiyahMonth,
    shiftImsakiyahMonth,
} from "../../utils/imsakiyah";

const PRAYERS = [
    { key: "imsak", fallbackKey: "Imsak" },
    { key: "fajr", fallbackKey: "Fajr" },
    { key: "sunrise", fallbackKey: "Sunrise" },
    { key: "dhuhr", fallbackKey: "Dhuhr" },
    { key: "asr", fallbackKey: "Asr" },
    { key: "maghrib", fallbackKey: "Maghrib" },
    { key: "isha", fallbackKey: "Isha" },
];

const DAY_COLUMN_WIDTH = 34;
const TIME_COLUMN_MIN_WIDTH = 42;
const TABLE_MIN_WIDTH =
    DAY_COLUMN_WIDTH + PRAYERS.length * TIME_COLUMN_MIN_WIDTH;

const getRaw = (item) => item?.raw ?? item ?? {};
const cleanTime = (value) =>
    value ? String(value).replace(/ \(.*\)$/, "") : "-";
const getPrayerValue = (row, prayer) => {
    const prayers = row.prayers ?? row.timings ?? {};
    return cleanTime(prayers[prayer.key] ?? prayers[prayer.fallbackKey]);
};
const getDateValue = (row) => row.date ?? row.gregorian_date ?? "";
const getDayLabel = (row, index) => {
    const date = getDateValue(row);
    if (/^\d{4}-\d{2}-\d{2}/.test(String(date))) {
        const day = Number(String(date).slice(-2));
        if (Number.isFinite(day) && day > 0) return String(day);
    }
    return row.day ? String(row.day) : String(index + 1);
};
const getLocationLabel = (items) => {
    const row = getRaw(items[0]);
    return row.city ?? row.location ?? row.place ?? "";
};
const formatMonthYear = (date, language) =>
    date.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
        month: "long",
        year: "numeric",
    });
const getBaseMonth = (items) =>
    parseImsakiyahMonth(getDateValue(getRaw(items[0]))) ??
    currentImsakiyahMonth();
const formatMonthLabel = ({ month, year }, language) =>
    formatMonthYear(new Date(year, month - 1, 1), language);
const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function ImsakiyahRow({ index, isDarkTheme, item, t }) {
    const row = getRaw(item);
    const isToday = getDateValue(row) === todayKey();

    return (
        <View
            style={[
                styles.row,
                isDarkTheme && styles.rowDark,
                isToday && (isDarkTheme ? styles.rowTodayDark : styles.rowToday),
            ]}
            testID='web-app-imsakiyah-row'
        >
            <View style={styles.dayCell}>
                <Text style={[
                    styles.dayText,
                    isDarkTheme && styles.dayTextDark,
                    isToday && (isDarkTheme ? styles.dayTextTodayDark : styles.dayTextToday),
                ]}>
                    {getDayLabel(row, index)}
                </Text>
                {isToday ? <View style={[styles.todayDot, isDarkTheme && styles.todayDotDark]} /> : null}
            </View>
            {PRAYERS.map((prayer) => {
                const value = getPrayerValue(row, prayer);
                return (
                    <View key={prayer.key} style={styles.timeCell}>
                        <Text
                            accessibilityLabel={`${t(`prayer.name.${prayer.key}`)} ${value}`}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            numberOfLines={1}
                            style={[
                                styles.timeValue,
                                isDarkTheme && styles.timeValueDark,
                                prayer.key === "imsak" && (isDarkTheme ? styles.imsakValueDark : styles.imsakValue),
                            ]}
                        >
                            {value}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

export function WebAppImsakiyahRoute({ error, isDarkTheme: isDarkThemeProp = false, items = [], loading }) {
    const { language, t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const isDarkTheme = isDarkThemeProp || isDarkThemePref;
    const location =
        getLocationLabel(items) || t("explore.imsakiyah.defaultLocation");
    const [viewed, setViewed] = useState(null);
    const [months, setMonths] = useState({});
    const [retryCount, setRetryCount] = useState(0);
    const baseMonth = getBaseMonth(items);
    const viewedMonth = viewed ?? baseMonth;
    const { month: viewedMonthNumber, year: viewedYear } = viewedMonth;
    const viewedKey = imsakiyahMonthKey(viewedMonth);
    const isBaseMonth = viewedKey === imsakiyahMonthKey(baseMonth);
    const monthDistance = imsakiyahMonthDistance(baseMonth, viewedMonth);
    const canGoPrev = monthDistance > -IMSAKIYAH_MONTH_WINDOW;
    const canGoNext = monthDistance < IMSAKIYAH_MONTH_WINDOW;
    const remote = isBaseMonth ? null : months[viewedKey];
    const viewItems = isBaseMonth ? items : (remote?.items ?? []);
    const viewLoading = isBaseMonth
        ? loading
        : !remote || remote.status === "loading";
    const viewError = isBaseMonth ? error : remote?.status === "error";

    useEffect(() => {
        if (isBaseMonth) return undefined;
        const key = imsakiyahMonthKey({
            month: viewedMonthNumber,
            year: viewedYear,
        });
        if (months[key]?.status === "ready") return undefined;
        let cancelled = false;
        const store = (entry) =>
            setMonths((current) => ({ ...current, [key]: entry }));
        store({ items: [], status: "loading" });
        getImsakiyahMonth({ month: viewedMonthNumber, year: viewedYear })
            .then((rows) => {
                if (!cancelled) store({ items: rows, status: "ready" });
            })
            .catch(() => {
                if (!cancelled) store({ items: [], status: "error" });
            });
        return () => {
            cancelled = true;
        };
    }, [isBaseMonth, viewedMonthNumber, viewedYear, retryCount]);

    const goToMonth = (delta) =>
        setViewed(shiftImsakiyahMonth(viewedMonth, delta));

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-imsakiyah-surface' />
            <View style={styles.header}>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.imsakiyah.title")}</Text>
                <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                    {t("explore.imsakiyah.subtitle", { location })}
                </Text>
            </View>

            <View style={styles.monthBar}>
                <Pressable
                    accessibilityLabel={t("explore.imsakiyah.prevMonth")}
                    accessibilityRole='button'
                    accessibilityState={{ disabled: !canGoPrev }}
                    disabled={!canGoPrev}
                    hitSlop={4}
                    onPress={() => goToMonth(-1)}
                    style={[
                        styles.monthButton,
                        isDarkTheme && styles.monthButtonDark,
                        !canGoPrev && styles.monthButtonDisabled,
                    ]}
                    testID='web-app-imsakiyah-prev-month'
                >
                    <Text style={[styles.monthButtonText, isDarkTheme && styles.monthButtonTextDark]}>←</Text>
                </Pressable>
                <Text
                    accessibilityLiveRegion='polite'
                    style={[styles.monthText, isDarkTheme && styles.monthTextDark]}
                    testID='web-app-imsakiyah-month-label'
                >
                    {formatMonthLabel(viewedMonth, language)}
                </Text>
                <Pressable
                    accessibilityLabel={t("explore.imsakiyah.nextMonth")}
                    accessibilityRole='button'
                    accessibilityState={{ disabled: !canGoNext }}
                    disabled={!canGoNext}
                    hitSlop={4}
                    onPress={() => goToMonth(1)}
                    style={[
                        styles.monthButton,
                        isDarkTheme && styles.monthButtonDark,
                        !canGoNext && styles.monthButtonDisabled,
                    ]}
                    testID='web-app-imsakiyah-next-month'
                >
                    <Text style={[styles.monthButtonText, isDarkTheme && styles.monthButtonTextDark]}>→</Text>
                </Pressable>
            </View>

            {viewLoading ? (
                <View style={styles.state}>
                    <ActivityIndicator color={isDarkTheme ? '#34d399' : '#059669'} size='small' />
                    <Text style={[styles.stateText, isDarkTheme && styles.stateTextDark]}>
                        {t("explore.imsakiyah.loading")}
                    </Text>
                </View>
            ) : null}

            {viewError ? (
                <View style={styles.errorBlock}>
                    <Text style={styles.error}>{t("explore.imsakiyah.error")}</Text>
                    {!isBaseMonth ? (
                        <Pressable
                            accessibilityRole='button'
                            onPress={() => setRetryCount((count) => count + 1)}
                            style={[styles.retryButton, isDarkTheme && styles.retryButtonDark]}
                            testID='web-app-imsakiyah-retry'
                        >
                            <Text style={[styles.retryButtonText, isDarkTheme && styles.retryButtonTextDark]}>
                                {t("explore.imsakiyah.retry")}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            {!viewLoading && !viewError && viewItems.length ? (
                <View style={[styles.table, isDarkTheme && styles.tableDark]}>
                    <ScrollView
                        contentContainerStyle={styles.tableScrollContent}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        testID='web-app-imsakiyah-table-scroll'
                    >
                        <View style={styles.tableBody}>
                            <View
                                style={[styles.tableHeader, isDarkTheme && styles.tableHeaderDark]}
                                testID='web-app-imsakiyah-header'
                            >
                                <Text style={styles.tableHeaderDay}>
                                    {t("explore.imsakiyah.dayColumn")}
                                </Text>
                                {PRAYERS.map((prayer) => (
                                    <Text
                                        adjustsFontSizeToFit
                                        key={prayer.key}
                                        minimumFontScale={0.7}
                                        numberOfLines={1}
                                        style={styles.tableHeaderCell}
                                    >
                                        {t(`prayer.name.${prayer.key}`)}
                                    </Text>
                                ))}
                            </View>
                            {viewItems.map((item, index) => (
                                <ImsakiyahRow
                                    index={index}
                                    isDarkTheme={isDarkTheme}
                                    item={item}
                                    key={`${getDateValue(getRaw(item)) || index}-${index}`}
                                    t={t}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>
            ) : null}

            {!viewLoading && !viewError && !viewItems.length ? (
                <View style={[styles.empty, isDarkTheme && styles.emptyDark]}>
                    <CalendarDays color={isDarkTheme ? '#64748b' : '#9ca3af'} size={32} strokeWidth={1.8} />
                    <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                        {t("explore.imsakiyah.emptyTitle")}
                    </Text>
                    <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                        {t("explore.imsakiyah.emptyText")}
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
        marginBottom: spacing.md,
    },
    title: {
        color: "#111827",
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 28,
    },
    subtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: spacing.xs,
    },
    monthBar: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    monthButton: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 40,
        justifyContent: "center",
        width: 40,
    },
    monthButtonDisabled: {
        opacity: 0.35,
    },
    monthButtonText: {
        color: "#047857",
        fontSize: 18,
        fontWeight: "800",
    },
    monthText: {
        color: "#1f2937",
        flex: 1,
        fontSize: 14,
        fontWeight: "900",
        textAlign: "center",
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 150,
    },
    stateText: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "800",
    },
    errorBlock: {
        alignItems: "center",
    },
    error: {
        color: "#ef4444",
        fontSize: 13,
        fontWeight: "800",
        paddingVertical: spacing.xl,
        textAlign: "center",
    },
    retryButton: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
        borderRadius: radius.sm,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 40,
        paddingHorizontal: spacing.lg,
    },
    retryButtonText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    table: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        overflow: "hidden",
    },
    tableScrollContent: {
        flexGrow: 1,
    },
    tableBody: {
        flexGrow: 1,
        minWidth: TABLE_MIN_WIDTH,
    },
    tableHeader: {
        alignItems: "center",
        backgroundColor: "#047857",
        flexDirection: "row",
        minHeight: 38,
    },
    tableHeaderDay: {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "900",
        textAlign: "center",
        width: DAY_COLUMN_WIDTH,
    },
    tableHeaderCell: {
        color: "#ffffff",
        flex: 1,
        fontSize: 10,
        fontWeight: "900",
        minWidth: TIME_COLUMN_MIN_WIDTH,
        textAlign: "center",
    },
    row: {
        alignItems: "center",
        borderBottomColor: "#f1f5f9",
        borderBottomWidth: 1,
        flexDirection: "row",
        minHeight: 40,
    },
    rowToday: {
        backgroundColor: "#ecfdf5",
    },
    dayCell: {
        alignItems: "center",
        flexDirection: "row",
        gap: 3,
        justifyContent: "center",
        width: DAY_COLUMN_WIDTH,
    },
    dayText: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "900",
    },
    dayTextToday: {
        color: "#047857",
    },
    todayDot: {
        backgroundColor: "#10b981",
        borderRadius: 999,
        height: 6,
        width: 6,
    },
    timeCell: {
        flex: 1,
        minWidth: TIME_COLUMN_MIN_WIDTH,
        paddingVertical: spacing.sm,
    },
    timeValue: {
        color: "#374151",
        fontSize: 12,
        fontWeight: "900",
        textAlign: "center",
    },
    imsakValue: {
        color: "#d97706",
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 160,
        justifyContent: "center",
        padding: spacing.lg,
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
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: spacing.xs,
        textAlign: "center",
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
    monthButtonDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    retryButtonDark: {
        backgroundColor: "#064e3b",
        borderColor: "#047857",
    },
    retryButtonTextDark: {
        color: "#34d399",
    },
    monthButtonTextDark: {
        color: "#cbd5e1",
    },
    monthTextDark: {
        color: "#f8fafc",
    },
    stateTextDark: {
        color: "#94a3b8",
    },
    tableDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    tableHeaderDark: {
        backgroundColor: "#059669",
    },
    rowDark: {
        borderBottomColor: "#1e293b",
    },
    rowTodayDark: {
        backgroundColor: "#064e3b",
    },
    dayTextDark: {
        color: "#e2e8f0",
    },
    dayTextTodayDark: {
        color: "#34d399",
    },
    todayDotDark: {
        backgroundColor: "#34d399",
    },
    timeValueDark: {
        color: "#e2e8f0",
    },
    imsakValueDark: {
        color: "#fbbf24",
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
});
