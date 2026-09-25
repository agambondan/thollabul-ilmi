import { CheckCircle2, Circle } from "lucide-react-native";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { radius, spacing } from "../../theme";

const getRaw = (item) => item?.raw ?? {};
const pickLabel = (item, index, t) =>
    getRaw(item).name_id ??
    getRaw(item).name ??
    getRaw(item).title ??
    item?.title ??
    t("explore.amalan.fallbackLabel", { number: index + 1 });
const isDone = (item) =>
    Boolean(
        getRaw(item).is_checked ??
        getRaw(item).done ??
        getRaw(item).checked ??
        item?.done,
    );

export function WebAppAmalanRoute({
    error,
    items = [],
    loading,
    onToggleItem,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const activeDark = isDarkThemePref ?? false;
    const doneCount = items.filter(isDone).length;
    const total = items.length;
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    return (
        <ScrollView
            contentContainerStyle={[
                styles.content,
                activeDark && { backgroundColor: "#0f172a" },
            ]}
            showsVerticalScrollIndicator={false}
            style={[
                styles.root,
                activeDark && { backgroundColor: "#0f172a" },
            ]}
        >
            <View testID='explore-web-app-amalan-surface' />
            <View style={styles.header}>
                <Text style={[
                    styles.title,
                    activeDark && { color: "#f9fafb" },
                ]}>{t("explore.amalan.title")}</Text>
                <Text style={[
                    styles.subtitle,
                    activeDark && { color: "#9ca3af" },
                ]}>
                    {t("explore.amalan.subtitle")}
                </Text>
            </View>

            <View style={[
                styles.progressCard,
                activeDark && {
                    backgroundColor: "#111827",
                    borderColor: "#374151",
                },
            ]}>
                <View style={styles.progressTop}>
                    <Text style={[
                        styles.progressLabel,
                        activeDark && { color: "#cbd5e1" },
                    ]}>
                        {t("explore.amalan.progress")}
                    </Text>
                    <Text style={[
                        styles.progressCount,
                        activeDark && { color: "#34d399" },
                    ]}>
                        {doneCount}/{total}
                    </Text>
                </View>
                <View style={[
                    styles.progressTrack,
                    activeDark && { backgroundColor: "#374151" },
                ]}>
                    <View
                        style={[styles.progressFill, { width: `${percent}%` }]}
                        testID='web-app-amalan-progress-fill'
                    />
                </View>
                <Text style={[
                    styles.progressPercent,
                    activeDark && { color: "#9ca3af" },
                ]}>{percent}%</Text>
            </View>

            {loading ? (
                <View style={[
                    styles.state,
                    activeDark && {
                        backgroundColor: "#111827",
                        borderColor: "#374151",
                    },
                ]}>
                    <ActivityIndicator color='#059669' size='small' />
                    <Text style={[
                        styles.stateText,
                        activeDark && { color: "#9ca3af" },
                    ]}>
                        {t("explore.amalan.loading")}
                    </Text>
                </View>
            ) : null}

            {error ? (
                <Text style={[
                    styles.error,
                    activeDark && {
                        backgroundColor: "rgba(220, 38, 38, 0.2)",
                        borderColor: "#7f1d1d",
                        color: "#f87171",
                    },
                ]}>
                    {t("explore.amalan.loadError")}
                </Text>
            ) : null}

            {!loading && !error && total === 0 ? (
                <View style={[
                    styles.empty,
                    activeDark && {
                        backgroundColor: "#111827",
                        borderColor: "#374151",
                    },
                ]}>
                    <Text style={[
                        styles.emptyTitle,
                        activeDark && { color: "#f9fafb" },
                    ]}>
                        {t("explore.amalan.emptyTitle")}
                    </Text>
                    <Text style={[
                        styles.emptyText,
                        activeDark && { color: "#9ca3af" },
                    ]}>
                        {t("explore.amalan.emptyText")}
                    </Text>
                </View>
            ) : null}

            {!loading && !error && total > 0 ? (
                <View style={styles.list}>
                    {items.map((item, index) => {
                        const done = isDone(item);
                        return (
                            <Pressable
                                accessibilityRole='button'
                                key={`${getRaw(item).id ?? item?.id ?? index}-${index}`}
                                onPress={() => onToggleItem?.(item)}
                                style={[
                                    styles.row,
                                    activeDark && {
                                        backgroundColor: "#111827",
                                        borderColor: "#374151",
                                    },
                                    done && styles.rowDone,
                                    activeDark && done && {
                                        backgroundColor: "#064e3b",
                                        borderColor: "#059669",
                                    },
                                ]}
                                testID='web-app-amalan-row'
                            >
                                {done ? (
                                    <CheckCircle2
                                        color='#10b981'
                                        size={22}
                                        strokeWidth={2.3}
                                    />
                                ) : (
                                    <Circle
                                        color={activeDark ? "#4b5563" : "#cbd5e1"}
                                        size={22}
                                        strokeWidth={2.1}
                                    />
                                )}
                                <Text
                                    style={[
                                        styles.rowText,
                                        activeDark && { color: "#f9fafb" },
                                        done && styles.rowTextDone,
                                        activeDark && done && { color: "#6ee7b7" },
                                    ]}
                                >
                                    {pickLabel(item, index, t)}
                                </Text>
                            </Pressable>
                        );
                    })}
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
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: spacing.xs,
    },
    progressCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    progressTop: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    progressLabel: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "900",
    },
    progressCount: {
        color: "#047857",
        fontSize: 24,
        fontWeight: "900",
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
    progressPercent: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 6,
    },
    state: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "center",
        padding: spacing.md,
    },
    stateText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
    },
    error: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        borderRadius: radius.md,
        borderWidth: 1,
        color: "#b91c1c",
        fontSize: 12,
        fontWeight: "800",
        lineHeight: 18,
        padding: spacing.md,
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 130,
        justifyContent: "center",
        padding: spacing.lg,
    },
    emptyTitle: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "900",
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
    list: {
        gap: spacing.sm,
    },
    row: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        minHeight: 58,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    rowDone: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
    },
    rowText: {
        color: "#374151",
        flex: 1,
        fontSize: 14,
        fontWeight: "800",
        lineHeight: 20,
    },
    rowTextDone: {
        color: "#047857",
        textDecorationLine: "line-through",
    },
});
