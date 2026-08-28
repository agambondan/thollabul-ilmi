import { CheckCircle2, Circle, Mosque } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { radius, spacing } from "../../theme";
import { PRAYER_ITEMS } from "../ExploreScreen.helpers";

const todayIso = () => new Date().toISOString().slice(0, 10);
const dateOffsetIso = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
};
const formatShortDate = (iso, language) => {
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
        day: "numeric",
        month: "short",
        weekday: "short",
    });
};
const buildLastSeven = (doneCount) =>
    Array.from({ length: 7 }, (_, index) => {
        const offset = index - 6;
        return {
            count: offset === 0 ? doneCount : 0,
            date: dateOffsetIso(offset),
        };
    });
const buildMonthDays = (doneCount) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return {
            count: day === today ? doneCount : 0,
            day,
            future: day > today,
            today: day === today,
        };
    });
};
const getHeatStyle = (entry) => {
    if (entry.future) return styles.monthDayFuture;
    if (entry.count === 5) return styles.monthDayFull;
    if (entry.count >= 3) return styles.monthDayMedium;
    if (entry.count >= 1) return styles.monthDayLow;
    return styles.monthDayEmpty;
};
const getHeatTextStyle = (entry) => {
    if (entry.future) return styles.monthDayTextFuture;
    return entry.count > 0 ? styles.monthDayTextDone : styles.monthDayTextEmpty;
};

function PrayerRow({ done, item, onPress }) {
    return (
        <Pressable
            onPress={() => onPress(item.key)}
            style={[styles.prayerRow, done && styles.prayerRowDone]}
            testID='web-app-sholat-prayer-row'
        >
            {done ? (
                <CheckCircle2 color='#10b981' size={26} strokeWidth={2.4} />
            ) : (
                <Circle color='#cbd5e1' size={26} strokeWidth={2.2} />
            )}
            <Text style={[styles.prayerLabel, done && styles.prayerLabelDone]}>
                {item.label}
            </Text>
        </Pressable>
    );
}

function LastSevenRow({ language, row, today }) {
    return (
        <View
            style={[styles.weekRow, row.date === today && styles.weekRowToday]}
        >
            <Text style={styles.weekDate}>
                {formatShortDate(row.date, language)}
            </Text>
            <Text
                style={[
                    styles.weekCount,
                    row.count === 5
                        ? styles.weekCountFull
                        : row.count >= 3
                          ? styles.weekCountMedium
                          : null,
                ]}
            >
                {row.count}/5
            </Text>
        </View>
    );
}

export function WebAppSholatTrackerRoute({
    sholatLog = {},
    togglePrayer = () => {},
}) {
    const { language, t } = useMobileLocale();
    const doneCount = PRAYER_ITEMS.filter((item) => sholatLog[item.key]).length;
    const pct = Math.round((doneCount / PRAYER_ITEMS.length) * 100);
    const today = todayIso();
    const lastSeven = buildLastSeven(doneCount);
    const monthDays = buildMonthDays(doneCount);
    const perfectDays = monthDays.filter((entry) => entry.count === 5).length;

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-sholat-tracker-surface' />

            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Mosque color='#047857' size={24} strokeWidth={2.2} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>
                        {t("explore.sholatTracker.title")}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t("explore.sholatTracker.subtitle")}
                    </Text>
                </View>
            </View>

            <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                    <Text style={styles.progressTitle}>
                        {t("explore.sholatTracker.today")}
                    </Text>
                    <Text style={styles.progressCount}>{doneCount}/5</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {t("explore.sholatTracker.recordedPercent", {
                        percent: pct,
                    })}
                </Text>
            </View>

            <View style={styles.prayerList}>
                {PRAYER_ITEMS.map((item) => (
                    <PrayerRow
                        done={Boolean(sholatLog[item.key])}
                        item={item}
                        key={item.key}
                        onPress={togglePrayer}
                    />
                ))}
            </View>

            <View style={styles.weekCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                        {t("explore.sholatTracker.lastSevenDays")}
                    </Text>
                </View>
                <View style={styles.weekTable}>
                    {lastSeven.map((row) => (
                        <LastSevenRow
                            key={row.date}
                            language={language}
                            row={row}
                            today={today}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.monthCard}>
                <View style={styles.monthHeader}>
                    <Text style={styles.cardTitle}>
                        {t("explore.sholatTracker.thisMonth")}
                    </Text>
                    <Text style={styles.perfectText}>
                        {t("explore.sholatTracker.perfectDays", {
                            count: perfectDays,
                        })}
                    </Text>
                </View>
                <View style={styles.monthGrid}>
                    {monthDays.map((entry) => (
                        <View
                            key={entry.day}
                            style={[
                                styles.monthDay,
                                getHeatStyle(entry),
                                entry.today && styles.monthDayToday,
                            ]}
                            testID='web-app-sholat-month-day'
                        >
                            <Text
                                style={[
                                    styles.monthDayText,
                                    getHeatTextStyle(entry),
                                ]}
                            >
                                {entry.day}
                            </Text>
                        </View>
                    ))}
                </View>
                <View style={styles.legend}>
                    <Text style={styles.legendText}>5/5</Text>
                    <Text style={styles.legendText}>3-4</Text>
                    <Text style={styles.legendText}>1-2</Text>
                    <Text style={styles.legendText}>0</Text>
                </View>
            </View>
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
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    headerIcon: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: 16,
        height: 50,
        justifyContent: "center",
        width: 50,
    },
    headerText: {
        flex: 1,
        minWidth: 0,
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
        marginTop: 3,
    },
    progressCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.lg,
        padding: spacing.lg,
    },
    progressTop: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    progressTitle: {
        color: "#374151",
        fontSize: 14,
        fontWeight: "900",
    },
    progressCount: {
        color: "#047857",
        fontSize: 26,
        fontWeight: "900",
        lineHeight: 32,
    },
    progressTrack: {
        backgroundColor: "#e5e7eb",
        borderRadius: 999,
        height: 12,
        overflow: "hidden",
    },
    progressFill: {
        backgroundColor: "#10b981",
        borderRadius: 999,
        height: "100%",
    },
    progressText: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 7,
    },
    prayerList: {
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    prayerRow: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        minHeight: 62,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    prayerRowDone: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
    },
    prayerLabel: {
        color: "#374151",
        fontSize: 16,
        fontWeight: "900",
    },
    prayerLabelDone: {
        color: "#047857",
    },
    weekCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.lg,
        overflow: "hidden",
    },
    cardHeader: {
        borderBottomColor: "#f1f5f9",
        borderBottomWidth: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    cardTitle: {
        color: "#374151",
        fontSize: 14,
        fontWeight: "900",
    },
    weekTable: {
        paddingVertical: spacing.xs,
    },
    weekRow: {
        alignItems: "center",
        borderBottomColor: "#f8fafc",
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: 10,
    },
    weekRowToday: {
        backgroundColor: "#ecfdf5",
    },
    weekDate: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "800",
    },
    weekCount: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "900",
    },
    weekCountFull: {
        color: "#047857",
    },
    weekCountMedium: {
        color: "#d97706",
    },
    monthCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.lg,
    },
    monthHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    perfectText: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: "800",
    },
    monthGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 5,
    },
    monthDay: {
        alignItems: "center",
        borderRadius: radius.sm,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    monthDayToday: {
        borderColor: "#047857",
        borderWidth: 2,
    },
    monthDayFull: {
        backgroundColor: "#10b981",
    },
    monthDayMedium: {
        backgroundColor: "#f59e0b",
    },
    monthDayLow: {
        backgroundColor: "#fdba74",
    },
    monthDayEmpty: {
        backgroundColor: "#e5e7eb",
    },
    monthDayFuture: {
        backgroundColor: "#f1f5f9",
    },
    monthDayText: {
        fontSize: 11,
        fontWeight: "900",
    },
    monthDayTextDone: {
        color: "#ffffff",
    },
    monthDayTextEmpty: {
        color: "#94a3b8",
    },
    monthDayTextFuture: {
        color: "#cbd5e1",
    },
    legend: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.md,
    },
    legendText: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: "800",
    },
});
