import { CalendarDays } from "lucide-react-native";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { radius, spacing } from "../../theme";

const PRAYERS = [
    { key: "imsak", fallbackKey: "Imsak" },
    { key: "fajr", fallbackKey: "Fajr" },
    { key: "sunrise", fallbackKey: "Sunrise" },
    { key: "dhuhr", fallbackKey: "Dhuhr" },
    { key: "asr", fallbackKey: "Asr" },
    { key: "maghrib", fallbackKey: "Maghrib" },
    { key: "isha", fallbackKey: "Isha" },
];

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
const inferMonthLabel = (items, language) => {
    const firstDate = getDateValue(getRaw(items[0]));
    if (!firstDate) {
        return formatMonthYear(new Date(), language);
    }
    const parsed = new Date(`${firstDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return firstDate.slice(0, 7);
    return formatMonthYear(parsed, language);
};
const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function ImsakiyahRow({ index, item, t }) {
    const row = getRaw(item);
    const isToday = getDateValue(row) === todayKey();

    return (
        <View
            style={[styles.row, isToday && styles.rowToday]}
            testID='web-app-imsakiyah-row'
        >
            <View style={styles.dayCell}>
                <Text style={[styles.dayText, isToday && styles.dayTextToday]}>
                    {getDayLabel(row, index)}
                </Text>
                {isToday ? <View style={styles.todayDot} /> : null}
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timesScroller}
            >
                <View style={styles.timesRow}>
                    {PRAYERS.map((prayer) => (
                        <View key={prayer.key} style={styles.timeCell}>
                            <Text
                                style={[
                                    styles.timeLabel,
                                    prayer.key === "imsak" && styles.imsakLabel,
                                ]}
                            >
                                {t(`prayer.name.${prayer.key}`)}
                            </Text>
                            <Text
                                style={[
                                    styles.timeValue,
                                    prayer.key === "imsak" && styles.imsakValue,
                                ]}
                            >
                                {getPrayerValue(row, prayer)}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

export function WebAppImsakiyahRoute({ error, items = [], loading }) {
    const { language, t } = useMobileLocale();
    const location =
        getLocationLabel(items) || t("explore.imsakiyah.defaultLocation");

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-imsakiyah-surface' />
            <View style={styles.header}>
                <Text style={styles.title}>{t("explore.imsakiyah.title")}</Text>
                <Text style={styles.subtitle}>
                    {t("explore.imsakiyah.subtitle", { location })}
                </Text>
            </View>

            <View style={styles.monthBar}>
                <View style={styles.monthButton}>
                    <Text style={styles.monthButtonText}>←</Text>
                </View>
                <Text style={styles.monthText}>
                    {inferMonthLabel(items, language)}
                </Text>
                <View style={styles.monthButton}>
                    <Text style={styles.monthButtonText}>→</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.state}>
                    <ActivityIndicator color='#059669' size='small' />
                    <Text style={styles.stateText}>
                        {t("explore.imsakiyah.loading")}
                    </Text>
                </View>
            ) : null}

            {error ? (
                <Text style={styles.error}>{t("explore.imsakiyah.error")}</Text>
            ) : null}

            {!loading && !error && items.length ? (
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderDay}>
                            {t("explore.imsakiyah.dayColumn")}
                        </Text>
                        <Text style={styles.tableHeaderText}>
                            {t("explore.imsakiyah.scheduleColumn")}
                        </Text>
                    </View>
                    {items.map((item, index) => (
                        <ImsakiyahRow
                            index={index}
                            item={item}
                            key={`${getDateValue(getRaw(item)) || index}-${index}`}
                            t={t}
                        />
                    ))}
                </View>
            ) : null}

            {!loading && !error && !items.length ? (
                <View style={styles.empty}>
                    <CalendarDays color='#9ca3af' size={32} strokeWidth={1.8} />
                    <Text style={styles.emptyTitle}>
                        {t("explore.imsakiyah.emptyTitle")}
                    </Text>
                    <Text style={styles.emptyText}>
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
        borderRadius: radius.sm,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    monthButtonText: {
        color: "#64748b",
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
    error: {
        color: "#ef4444",
        fontSize: 13,
        fontWeight: "800",
        paddingVertical: spacing.xl,
        textAlign: "center",
    },
    table: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        overflow: "hidden",
    },
    tableHeader: {
        backgroundColor: "#047857",
        flexDirection: "row",
        minHeight: 38,
    },
    tableHeaderDay: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "900",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        width: 56,
    },
    tableHeaderText: {
        color: "#ffffff",
        flex: 1,
        fontSize: 12,
        fontWeight: "900",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    row: {
        alignItems: "center",
        borderBottomColor: "#f1f5f9",
        borderBottomWidth: 1,
        flexDirection: "row",
        minHeight: 66,
    },
    rowToday: {
        backgroundColor: "#ecfdf5",
    },
    dayCell: {
        alignItems: "center",
        flexDirection: "row",
        gap: 5,
        justifyContent: "center",
        width: 56,
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
    timesScroller: {
        flex: 1,
    },
    timesRow: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    timeCell: {
        minWidth: 72,
    },
    timeLabel: {
        color: "#94a3b8",
        fontSize: 10,
        fontWeight: "800",
        marginBottom: 3,
        textAlign: "center",
    },
    imsakLabel: {
        color: "#d97706",
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
});
