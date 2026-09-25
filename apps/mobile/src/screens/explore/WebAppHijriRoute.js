import { CalendarDays } from "lucide-react-native";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { radius, spacing } from "../../theme";

const HIJRI_MONTHS = [
    "",
    "Muharram",
    "Safar",
    "Rabiul Awal",
    "Rabiul Akhir",
    "Jumadal Ula",
    "Jumadal Akhirah",
    "Rajab",
    "Sya'ban",
    "Ramadan",
    "Syawal",
    "Dzulqa'dah",
    "Dzulhijjah",
];

const PUASA_SUNNAH = [
    {
        days: [13, 14, 15],
        id: "ayyamul_bidh",
        labelKey: "explore.hijri.fast.ayyamulBidh",
        type: "monthly",
    },
    {
        id: "arafah",
        labelKey: "explore.hijri.fast.arafah",
        month: 12,
        day: 9,
        type: "fixed",
    },
    {
        days: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        id: "dzulhijjah_1_9",
        labelKey: "explore.hijri.fast.dzulhijjahFirstNine",
        month: 12,
        type: "range",
    },
    {
        days: [9, 10],
        id: "tasua_asyura",
        labelKey: "explore.hijri.fast.tasuaAsyura",
        month: 1,
        type: "range",
    },
    {
        id: "muharram",
        labelKey: "explore.hijri.fast.muharram",
        month: 1,
        type: "month",
    },
    {
        id: "syaban",
        labelKey: "explore.hijri.fast.syaban",
        month: 8,
        type: "month",
    },
];

const getRaw = (item) => item?.raw ?? {};
const getTitle = (item, index, t) =>
    getRaw(item).translation?.title_idn ??
    getRaw(item).translation?.title_en ??
    getRaw(item).translation?.idn ??
    getRaw(item).translation?.en ??
    getRaw(item).name ??
    item?.title ??
    t("explore.hijri.eventFallback", { number: index + 1 });
const getBody = (item) =>
    getRaw(item).translation?.description_idn ??
    getRaw(item).translation?.description_en ??
    getRaw(item).description ??
    item?.body ??
    "";
const getEventMeta = (item) => {
    const raw = getRaw(item);
    const parts = [];
    if (raw.hijri_day && raw.hijri_month)
        parts.push(`${raw.hijri_day}/${raw.hijri_month} H`);
    if (raw.category) parts.push(String(raw.category));
    return parts.join(" · ");
};
const getToday = (items) =>
    items.find(
        (item) =>
            getRaw(item).type === "hijri_today" || item?.id === "hijri-today",
    );
const getEvents = (items, today) => items.filter((item) => item !== today);
const getHijriMonth = (raw) => {
    if (raw.month) return Number(raw.month);
    const monthIndex = HIJRI_MONTHS.findIndex(
        (month) =>
            month.toLowerCase() === String(raw.month_name ?? "").toLowerCase(),
    );
    return monthIndex > 0 ? monthIndex : 0;
};
const formatTodayHijri = (item, t) => {
    const raw = getRaw(item);
    if (raw.date_str) return raw.date_str;
    if (raw.day && raw.month_name && raw.year)
        return `${raw.day} ${raw.month_name} ${raw.year} H`;
    return item?.body ?? t("explore.hijri.todayUnavailable");
};
const formatTodayArabic = (item, t) => {
    const raw = getRaw(item);
    if (raw.day && raw.month_name && raw.year) {
        return `${raw.day} ${raw.month_name} ${raw.year} هـ`;
    }
    return formatTodayHijri(item, t);
};
const formatGregorian = (raw) => {
    if (raw.gregorian_year && raw.gregorian_month && raw.gregorian_day) {
        return `${raw.gregorian_year}-${String(raw.gregorian_month).padStart(2, "0")}-${String(raw.gregorian_day).padStart(2, "0")}`;
    }
    return new Date().toISOString().slice(0, 10);
};
const daysUntilRamadan = (raw) => {
    const day = Number(raw.day ?? 1);
    const month = getHijriMonth(raw) || 1;
    if (month === 9) return 0;
    const monthsLeft = month < 9 ? 9 - month : 12 - month + 9;
    return 30 - day + 1 + Math.max(0, monthsLeft - 1) * 30 - 1;
};
const getTodayFasts = (raw) => {
    const day = Number(raw.day ?? 0);
    const month = getHijriMonth(raw);
    return PUASA_SUNNAH.filter((item) => {
        if (item.type === "monthly") return item.days.includes(day);
        if (item.type === "fixed")
            return item.month === month && item.day === day;
        if (item.type === "range")
            return item.month === month && item.days.includes(day);
        if (item.type === "month") return item.month === month;
        return false;
    });
};
const getUpcomingFasts = (raw) => {
    const currentDay = Number(raw.day ?? 1);
    const currentMonth = getHijriMonth(raw) || 1;
    return PUASA_SUNNAH.filter(
        (item) =>
            item.type === "fixed" ||
            item.type === "monthly" ||
            item.type === "range",
    )
        .map((item) => {
            const targetMonth = item.month ?? currentMonth;
            const targetDay =
                item.day ??
                item.days?.find((day) => day >= currentDay) ??
                item.days?.[0] ??
                1;
            const monthDistance =
                targetMonth >= currentMonth
                    ? targetMonth - currentMonth
                    : 12 - currentMonth + targetMonth;
            const days = monthDistance * 30 + targetDay - currentDay;
            return {
                ...item,
                days: days < 0 ? days + 360 : days,
                date: `${targetDay} ${HIJRI_MONTHS[targetMonth] ?? "Hijri"}`,
            };
        })
        .sort((a, b) => a.days - b.days)
        .slice(0, 3);
};

function EventCard({ index, isDarkTheme, item, t }) {
    const meta = getEventMeta(item);
    return (
        <View style={[styles.eventCard, isDarkTheme && styles.eventCardDark]} testID='web-app-hijri-event-card'>
            <View style={[styles.eventDateBadge, isDarkTheme && styles.eventDateBadgeDark]}>
                <Text style={[styles.eventDateText, isDarkTheme && styles.eventDateTextDark]}>
                    {getRaw(item).hijri_day ?? index + 1}
                </Text>
            </View>
            <View style={styles.eventMain}>
                {meta ? <Text style={[styles.eventMeta, isDarkTheme && styles.eventMetaDark]}>{meta}</Text> : null}
                <Text style={[styles.eventTitle, isDarkTheme && styles.eventTitleDark]}>
                    {getTitle(item, index, t)}
                </Text>
                {getBody(item) ? (
                    <Text numberOfLines={3} style={[styles.eventBody, isDarkTheme && styles.eventBodyDark]}>
                        {getBody(item)}
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

export function WebAppHijriRoute({ error, isDarkTheme: isDarkThemeProp = false, items = [], loading }) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const isDarkTheme = isDarkThemeProp || isDarkThemePref;
    const today = getToday(items);
    const todayRaw = getRaw(today);
    const events = getEvents(items, today);
    const ramadanDays = daysUntilRamadan(todayRaw);
    const isRamadan = getHijriMonth(todayRaw) === 9;
    const todayFasts = getTodayFasts(todayRaw);
    const upcomingFasts = getUpcomingFasts(todayRaw);

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-hijri-surface' />
            <View style={styles.header}>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.hijri.title")}</Text>
            </View>

            {today ? (
                <View style={[styles.todayCard, isDarkTheme && styles.todayCardDark]}>
                    <Text style={styles.todayLabel}>
                        {t("explore.hijri.today")}
                    </Text>
                    <Text style={styles.todayArabic}>
                        {formatTodayArabic(today, t)}
                    </Text>
                    <Text style={styles.todayText}>
                        {formatTodayHijri(today, t)}
                    </Text>
                </View>
            ) : null}

            {today ? (
                <>
                    <View style={[styles.countdownCard, isDarkTheme && styles.countdownCardDark]}>
                        <View style={styles.countdownIcon}>
                            <CalendarDays
                                color='#fde68a'
                                size={22}
                                strokeWidth={2.2}
                            />
                        </View>
                        <View style={styles.countdownText}>
                            <Text style={styles.countdownEyebrow}>
                                {isRamadan
                                    ? t("explore.hijri.ramadanMonth")
                                    : t("explore.hijri.toRamadan")}
                            </Text>
                            <Text style={styles.countdownTitle}>
                                {isRamadan ? todayRaw.day : ramadanDays}
                                <Text style={styles.countdownUnit}>
                                    {isRamadan
                                        ? t("explore.hijri.ramadanDayUnit")
                                        : t("explore.hijri.daysLeftUnit")}
                                </Text>
                            </Text>
                            <Text style={styles.countdownBody}>
                                {formatTodayHijri(today, t)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.fastingCard, isDarkTheme && styles.fastingCardDark]}>
                        <View style={styles.fastingHeader}>
                            <CalendarDays
                                color={isDarkTheme ? '#34d399' : '#059669'}
                                size={18}
                                strokeWidth={2.2}
                            />
                            <Text style={[styles.fastingTitle, isDarkTheme && styles.fastingTitleDark]}>
                                {t("explore.hijri.fastingTitle")}
                            </Text>
                        </View>
                        <View style={[styles.fastingToday, isDarkTheme && styles.fastingTodayDark]}>
                            <Text style={[styles.fastingTodayLabel, isDarkTheme && styles.fastingTodayLabelDark]}>
                                {t("explore.hijri.today")}
                            </Text>
                            {todayFasts.length ? (
                                todayFasts.map((item) => (
                                    <Text
                                        key={item.id}
                                        style={[styles.fastingTodayText, isDarkTheme && styles.fastingTodayTextDark]}
                                    >
                                        {t(item.labelKey)}
                                    </Text>
                                ))
                            ) : (
                                <Text style={[styles.fastingEmptyText, isDarkTheme && styles.fastingEmptyTextDark]}>
                                    {t("explore.hijri.noSpecialFastToday")}
                                </Text>
                            )}
                        </View>
                        {upcomingFasts.length ? (
                            <View style={styles.upcomingList}>
                                <Text style={[styles.upcomingTitle, isDarkTheme && styles.upcomingTitleDark]}>
                                    {t("explore.hijri.upcoming")}
                                </Text>
                                {upcomingFasts.map((item) => (
                                    <View
                                        key={item.id}
                                        style={[styles.upcomingRow, isDarkTheme && styles.upcomingRowDark]}
                                    >
                                        <View style={[styles.upcomingDayBadge, isDarkTheme && styles.upcomingDayBadgeDark]}>
                                            <Text
                                                style={[styles.upcomingDayText, isDarkTheme && styles.upcomingDayTextDark]}
                                            >
                                                {item.days}
                                            </Text>
                                        </View>
                                        <View style={styles.upcomingTextWrap}>
                                            <Text style={[styles.upcomingLabel, isDarkTheme && styles.upcomingLabelDark]}>
                                                {t(item.labelKey)}
                                            </Text>
                                            <Text style={[styles.upcomingDate, isDarkTheme && styles.upcomingDateDark]}>
                                                {item.date} H
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                        <View style={[styles.fastingNote, isDarkTheme && styles.fastingNoteDark]}>
                            <Text style={[styles.fastingNoteText, isDarkTheme && styles.fastingNoteTextDark]}>
                                {t("explore.hijri.fastingNote")}
                            </Text>
                        </View>
                    </View>
                </>
            ) : null}

            <View style={[styles.converterCard, isDarkTheme && styles.converterCardDark]}>
                <Text style={[styles.converterTitle, isDarkTheme && styles.converterTitleDark]}>
                    {t("explore.hijri.converterTitle")}
                </Text>
                <View style={styles.converterRow}>
                    <Text style={[styles.converterInput, isDarkTheme && styles.converterInputDark]}>
                        {formatGregorian(todayRaw)}
                    </Text>
                    <Text style={[styles.converterButton, isDarkTheme && styles.converterButtonDark]}>
                        {t("explore.hijri.convert")}
                    </Text>
                </View>
                {today ? (
                    <View style={[styles.converterResult, isDarkTheme && styles.converterResultDark]}>
                        <Text style={[styles.converterResultArabic, isDarkTheme && styles.converterResultArabicDark]}>
                            {formatTodayArabic(today, t)}
                        </Text>
                        <Text style={[styles.converterResultText, isDarkTheme && styles.converterResultTextDark]}>
                            {formatTodayHijri(today, t)}
                        </Text>
                    </View>
                ) : null}
            </View>

            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color='#059669' size='small' />
                    <Text style={styles.stateText}>
                        {t("explore.hijri.loading")}
                    </Text>
                </View>
            ) : null}

            {error ? (
                <Text style={styles.error}>{t("explore.hijri.loadError")}</Text>
            ) : null}

            {!loading && !error && events.length ? (
                <View style={styles.events}>
                    <Text style={[styles.sectionTitle, isDarkTheme && styles.sectionTitleDark]}>
                        {t("explore.hijri.eventsTitle")}
                    </Text>
                    {events.slice(0, 8).map((item, index) => (
                        <EventCard
                            index={index}
                            isDarkTheme={isDarkTheme}
                            item={item}
                            key={`${item?.id ?? getTitle(item, index, t)}-${index}`}
                            t={t}
                        />
                    ))}
                </View>
            ) : null}

            {!loading && !error && !items.length ? (
                <View style={[styles.empty, isDarkTheme && styles.emptyDark]}>
                    <CalendarDays color={isDarkTheme ? '#64748b' : '#9ca3af'} size={32} strokeWidth={1.8} />
                    <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                        {t("explore.hijri.emptyTitle")}
                    </Text>
                    <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                        {t("explore.hijri.emptyText")}
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
    todayCard: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.md,
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    todayLabel: {
        color: "#a7f3d0",
        fontSize: 12,
        fontWeight: "900",
        marginBottom: spacing.sm,
    },
    todayArabic: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "900",
        lineHeight: 34,
        textAlign: "center",
    },
    todayText: {
        color: "#d1fae5",
        fontSize: 15,
        fontWeight: "800",
        marginTop: spacing.xs,
        textAlign: "center",
    },
    countdownCard: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.lg,
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    countdownIcon: {
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 14,
        height: 46,
        justifyContent: "center",
        width: 46,
    },
    countdownText: {
        flex: 1,
        minWidth: 0,
    },
    countdownEyebrow: {
        color: "#d1fae5",
        fontSize: 11,
        fontWeight: "900",
        marginBottom: 3,
        textTransform: "uppercase",
    },
    countdownTitle: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "900",
        lineHeight: 34,
    },
    countdownUnit: {
        color: "#d1fae5",
        fontSize: 13,
        fontWeight: "800",
    },
    countdownBody: {
        color: "#d1fae5",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: 3,
    },
    fastingCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    fastingHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    fastingTitle: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    fastingToday: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
        borderRadius: radius.sm,
        borderWidth: 1,
        padding: spacing.md,
    },
    fastingTodayLabel: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        marginBottom: 4,
    },
    fastingTodayText: {
        color: "#111827",
        fontSize: 13,
        fontWeight: "900",
        lineHeight: 19,
    },
    fastingEmptyText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
    },
    upcomingList: {
        marginTop: spacing.md,
    },
    upcomingTitle: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "900",
        marginBottom: spacing.sm,
    },
    upcomingRow: {
        alignItems: "center",
        borderBottomColor: "#f1f5f9",
        borderBottomWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    upcomingDayBadge: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: radius.sm,
        justifyContent: "center",
        minHeight: 34,
        width: 48,
    },
    upcomingDayText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    upcomingTextWrap: {
        flex: 1,
        minWidth: 0,
    },
    upcomingLabel: {
        color: "#111827",
        fontSize: 13,
        fontWeight: "900",
        lineHeight: 18,
    },
    upcomingDate: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 2,
    },
    fastingNote: {
        backgroundColor: "#fffbeb",
        borderRadius: radius.sm,
        marginTop: spacing.md,
        padding: spacing.sm,
    },
    fastingNoteText: {
        color: "#b45309",
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
    },
    converterCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    converterTitle: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "900",
        marginBottom: spacing.sm,
    },
    converterRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    converterInput: {
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        borderRadius: radius.sm,
        borderWidth: 1,
        color: "#374151",
        flex: 1,
        fontSize: 13,
        fontWeight: "800",
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
    },
    converterButton: {
        backgroundColor: "#047857",
        borderRadius: radius.sm,
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
        overflow: "hidden",
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
    },
    converterResult: {
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: radius.md,
        marginTop: spacing.md,
        padding: spacing.md,
    },
    converterResultArabic: {
        color: "#111827",
        fontSize: 18,
        fontWeight: "900",
        textAlign: "center",
    },
    converterResultText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 3,
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 120,
    },
    stateText: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "800",
    },
    error: {
        color: "#ef4444",
        fontSize: 13,
        fontWeight: "800",
        paddingVertical: spacing.lg,
        textAlign: "center",
    },
    events: {
        gap: spacing.sm,
    },
    sectionTitle: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
        marginBottom: spacing.xs,
    },
    eventCard: {
        alignItems: "flex-start",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        padding: spacing.md,
    },
    eventDateBadge: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: 999,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    eventDateText: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
    },
    eventMain: {
        flex: 1,
        minWidth: 0,
    },
    eventMeta: {
        color: "#047857",
        fontSize: 11,
        fontWeight: "900",
        marginBottom: 2,
    },
    eventTitle: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
        lineHeight: 20,
    },
    eventBody: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: 4,
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 150,
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
    todayCardDark: {
        backgroundColor: "#064e3b",
    },
    countdownCardDark: {
        backgroundColor: "#064e3b",
    },
    fastingCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    fastingTitleDark: {
        color: "#f8fafc",
    },
    fastingTodayDark: {
        backgroundColor: "#064e3b",
        borderColor: "#047857",
    },
    fastingTodayLabelDark: {
        color: "#34d399",
    },
    fastingTodayTextDark: {
        color: "#f8fafc",
    },
    fastingEmptyTextDark: {
        color: "#94a3b8",
    },
    upcomingTitleDark: {
        color: "#94a3b8",
    },
    upcomingRowDark: {
        borderBottomColor: "#1e293b",
    },
    upcomingDayBadgeDark: {
        backgroundColor: "#064e3b",
    },
    upcomingDayTextDark: {
        color: "#34d399",
    },
    upcomingLabelDark: {
        color: "#f8fafc",
    },
    upcomingDateDark: {
        color: "#94a3b8",
    },
    fastingNoteDark: {
        backgroundColor: "#451a03",
    },
    fastingNoteTextDark: {
        color: "#fcd34d",
    },
    converterCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    converterTitleDark: {
        color: "#f8fafc",
    },
    converterInputDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
        color: "#f8fafc",
    },
    converterButtonDark: {
        backgroundColor: "#059669",
    },
    converterResultDark: {
        backgroundColor: "#1e293b",
    },
    converterResultArabicDark: {
        color: "#34d399",
    },
    converterResultTextDark: {
        color: "#cbd5e1",
    },
    sectionTitleDark: {
        color: "#f8fafc",
    },
    eventCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    eventDateBadgeDark: {
        backgroundColor: "#064e3b",
    },
    eventDateTextDark: {
        color: "#34d399",
    },
    eventMetaDark: {
        color: "#34d399",
    },
    eventTitleDark: {
        color: "#f8fafc",
    },
    eventBodyDark: {
        color: "#94a3b8",
    },
    emptyDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    emptyTitleDark: {
        color: "#f8fafc",
    },
});
