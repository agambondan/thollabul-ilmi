import { CheckCircle2, Hand, RefreshCcw, RotateCcw } from "lucide-react-native";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, radius, spacing, touchTarget } from "../../theme";
import { hapticTap } from "../../utils/haptics";

const PRESETS = [
    {
        arabic: "سُبْحَانَ اللَّهِ",
        key: "subhanallah",
        latin: "Subhanallah",
        target: 33,
    },
    {
        arabic: "الْحَمْدُ لِلَّهِ",
        key: "alhamdulillah",
        latin: "Alhamdulillah",
        target: 33,
    },
    {
        arabic: "اللَّهُ أَكْبَرُ",
        key: "allahu_akbar",
        latin: "Allahu Akbar",
        target: 33,
    },
    {
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
        key: "la_ilaha",
        latin: "La ilaha illallah",
        target: 100,
    },
    {
        arabic: "أَسْتَغْفِرُ اللَّهَ",
        key: "astaghfirullah",
        latin: "Astaghfirullah",
        target: 100,
    },
    {
        arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
        key: "shalawat",
        latin: "Allahumma shalli ala Muhammad",
        target: 100,
    },
    {
        arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        key: "hawqala",
        latin: "La hawla wala quwwata illa billah",
        target: 100,
    },
    {
        arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
        key: "hasbunallah",
        latin: "Hasbunallahu wa nimal wakil",
        target: 7,
    },
];

const TARGET_PRESETS = [33, 99, 100, 313, 1000];

const normalizeTarget = (value) => Math.max(0, Number(value) || 0);

function StatTile({ color, isDarkTheme, label, value }) {
    return (
        <View style={[styles.statTile, isDarkTheme && styles.statTileDark]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={[styles.statLabel, isDarkTheme && styles.textMutedDark]}>{label}</Text>
        </View>
    );
}

function TargetChip({ active, isDarkTheme, label, onPress }) {
    return (
        <Pressable
            accessibilityRole='button'
            onPress={onPress}
            style={[
                styles.targetChip,
                isDarkTheme && styles.targetChipDark,
                active && styles.targetChipActive,
            ]}
        >
            <Text
                style={[
                    styles.targetChipText,
                    isDarkTheme && styles.targetChipTextDark,
                    active && styles.targetChipTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function PresetCard({ active, isDarkTheme, onPress, preset, t }) {
    return (
        <Pressable
            accessibilityRole='button'
            onPress={onPress}
            style={[
                styles.presetCard,
                isDarkTheme && styles.presetCardDark,
                active && (isDarkTheme ? styles.presetCardActiveDark : styles.presetCardActive),
            ]}
            testID='web-app-tasbih-preset'
        >
            <Text style={[styles.presetArabic, isDarkTheme && styles.presetArabicDark]}>{preset.arabic}</Text>
            <Text style={[styles.presetLatin, isDarkTheme && styles.textMutedDark]}>{preset.latin}</Text>
            <Text style={[styles.presetTarget, isDarkTheme && styles.presetTargetDark]}>
                {t("explore.tasbih.presetTarget", { target: preset.target })}
            </Text>
        </Pressable>
    );
}

export function WebAppTasbihRoute({
    setTasbih = () => {},
    tasbih = { count: 0, target: 33 },
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const [activeIndex, setActiveIndex] = useState(0);
    const [totalToday, setTotalToday] = useState(tasbih.count ?? 0);
    const [vibrate, setVibrate] = useState(true);

    const active = PRESETS[activeIndex] ?? PRESETS[0];
    const count = Number(tasbih.count ?? 0);
    const target = normalizeTarget(tasbih.target ?? active.target);
    const reachedTarget = target > 0 && count >= target;
    const progressPct =
        target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

    const updateTasbih = (updater) => {
        setTasbih((current) => {
            const next =
                typeof updater === "function"
                    ? updater(current ?? tasbih)
                    : updater;
            return {
                count: normalizeTarget(next.count),
                target: normalizeTarget(next.target),
            };
        });
    };

    const handleTap = () => {
        if (vibrate) hapticTap();
        updateTasbih((current) => ({
            ...current,
            count: normalizeTarget(current.count) + 1,
        }));
        setTotalToday((current) => current + 1);
    };

    const reset = () => updateTasbih((current) => ({ ...current, count: 0 }));
    const resetAll = () => {
        updateTasbih((current) => ({ ...current, count: 0 }));
        setTotalToday(0);
    };
    const setTarget = (nextTarget) =>
        updateTasbih({ count: 0, target: normalizeTarget(nextTarget) });
    const choosePreset = (index) => {
        const preset = PRESETS[index] ?? PRESETS[0];
        setActiveIndex(index);
        setTarget(preset.target);
    };

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-tasbih-surface' />
            <View style={styles.header}>
                <Text style={[styles.headerArabic, isDarkTheme && styles.headerArabicDark]}>تَسْبِيحٌ</Text>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.tasbih.title")}</Text>
                <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                    {t("explore.tasbih.subtitle")}
                </Text>
            </View>

            <View style={[styles.counterCard, isDarkTheme && styles.counterCardDark]}>
                <Text style={[styles.activeArabic, isDarkTheme && styles.activeArabicDark]}>{active.arabic}</Text>
                <Text style={[styles.activeLatin, isDarkTheme && styles.subtitleDark]}>{active.latin}</Text>

                <View style={styles.counterWrap}>
                    <Pressable
                        accessibilityLabel={t(
                            "explore.tasbih.counterAccessibility",
                            {
                                count,
                                target: target || t("explore.tasbih.unlimited"),
                            },
                        )}
                        accessibilityRole='button'
                        onPress={handleTap}
                        style={[
                            styles.counterButton,
                            reachedTarget && styles.counterButtonDone,
                        ]}
                        testID='web-app-tasbih-counter'
                    >
                        <Text style={styles.counterNumber}>{count}</Text>
                        <Text style={styles.counterTarget}>
                            {target > 0
                                ? `/ ${target}`
                                : t("explore.tasbih.tapToCount")}
                        </Text>
                        {reachedTarget ? (
                            <View style={styles.doneBadge}>
                                <CheckCircle2
                                    color='#064e3b'
                                    size={20}
                                    strokeWidth={2.4}
                                />
                            </View>
                        ) : null}
                    </Pressable>
                </View>

                {target > 0 ? (
                    <View style={styles.progressBlock}>
                        <View style={[styles.progressTrack, isDarkTheme && styles.progressTrackDark]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${progressPct}%` },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, isDarkTheme && styles.subtitleDark]}>{progressPct}%</Text>
                    </View>
                ) : null}

                <View style={styles.actionRow}>
                    <Pressable
                        accessibilityRole='button'
                        onPress={reset}
                        style={[styles.neutralButton, isDarkTheme && styles.neutralButtonDark]}
                    >
                        <RotateCcw
                            color={isDarkTheme ? "#e2e8f0" : "#374151"}
                            size={15}
                            strokeWidth={2.2}
                        />
                        <Text style={[styles.neutralButtonText, isDarkTheme && styles.neutralButtonTextDark]}>
                            {t("explore.tasbih.reset")}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole='button'
                        onPress={resetAll}
                        style={[styles.dangerButton, isDarkTheme && styles.dangerButtonDark]}
                    >
                        <RefreshCcw
                            color={isDarkTheme ? "#f87171" : "#dc2626"}
                            size={15}
                            strokeWidth={2.2}
                        />
                        <Text style={[styles.dangerButtonText, isDarkTheme && styles.dangerButtonTextDark]}>
                            {t("explore.tasbih.resetAll")}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole='checkbox'
                        accessibilityState={{ checked: vibrate }}
                        onPress={() => setVibrate((current) => !current)}
                        style={[
                            styles.vibrateButton,
                            isDarkTheme && styles.vibrateButtonDark,
                            vibrate && (isDarkTheme ? styles.vibrateButtonActiveDark : styles.vibrateButtonActive),
                        ]}
                    >
                        <Hand
                            color={vibrate ? (isDarkTheme ? "#34d399" : "#047857") : (isDarkTheme ? "#94a3b8" : "#64748b")}
                            size={15}
                            strokeWidth={2.2}
                        />
                        <Text
                            style={[
                                styles.vibrateButtonText,
                                isDarkTheme && styles.vibrateButtonTextDark,
                                vibrate && (isDarkTheme ? styles.vibrateButtonTextActiveDark : styles.vibrateButtonTextActive),
                            ]}
                        >
                            {t("explore.tasbih.vibrateStatus", {
                                state: vibrate
                                    ? t("explore.tasbih.on")
                                    : t("explore.tasbih.off"),
                            })}
                        </Text>
                    </Pressable>
                </View>
            </View>

            <View style={[styles.statsGrid, isDarkTheme && styles.statsGridDark]}>
                <StatTile
                    color='#047857'
                    isDarkTheme={isDarkTheme}
                    label={t("explore.tasbih.countLabel")}
                    value={count}
                />
                <StatTile
                    color='#d97706'
                    isDarkTheme={isDarkTheme}
                    label={t("explore.tasbih.targetLabel")}
                    value={target || "∞"}
                />
                <StatTile
                    color='#2563eb'
                    isDarkTheme={isDarkTheme}
                    label={t("explore.tasbih.todayTotalLabel")}
                    value={totalToday}
                />
            </View>

            <View style={[styles.targetCard, isDarkTheme && styles.targetCardDark]}>
                <View style={styles.targetHeader}>
                    <Text style={[styles.targetTitle, isDarkTheme && styles.targetTitleDark]}>
                        {t("explore.tasbih.targetTitle")}
                    </Text>
                    <TextInput
                        keyboardType='number-pad'
                        onChangeText={setTarget}
                        placeholderTextColor={isDarkTheme ? "#64748b" : "#94a3b8"}
                        style={[styles.targetInput, isDarkTheme && styles.targetInputDark]}
                        value={`${target}`}
                    />
                </View>
                <View style={styles.targetChips}>
                    {TARGET_PRESETS.map((preset) => (
                        <TargetChip
                            active={target === preset}
                            isDarkTheme={isDarkTheme}
                            key={preset}
                            label={`${preset}`}
                            onPress={() => setTarget(preset)}
                        />
                    ))}
                    <TargetChip
                        active={target === 0}
                        isDarkTheme={isDarkTheme}
                        label={t("explore.tasbih.noLimit")}
                        onPress={() => setTarget(0)}
                    />
                </View>
            </View>

            <View style={[styles.presetsSection, isDarkTheme && styles.presetsSectionDark]}>
                <Text style={[styles.presetsTitle, isDarkTheme && styles.textPrimaryDark]}>
                    {t("explore.tasbih.presetsTitle")}
                </Text>
                <View style={styles.presetsGrid}>
                    {PRESETS.map((preset, index) => (
                        <PresetCard
                            active={index === activeIndex}
                            isDarkTheme={isDarkTheme}
                            key={preset.key}
                            onPress={() => choosePreset(index)}
                            preset={preset}
                            t={t}
                        />
                    ))}
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
    rootDark: {
        backgroundColor: "#020617",
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    contentDark: {
        backgroundColor: "#020617",
    },
    header: {
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    headerArabic: {
        color: "#047857",
        fontSize: 30,
        lineHeight: 44,
        marginBottom: 2,
        paddingVertical: 2,
        textAlign: "center",
    },
    headerArabicDark: {
        color: "#34d399",
    },
    title: {
        color: "#064e3b",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
        textAlign: "center",
    },
    titleDark: {
        color: "#f8fafc",
    },
    subtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: 3,
        textAlign: "center",
    },
    subtitleDark: {
        color: "#94a3b8",
    },
    textPrimaryDark: {
        color: "#f8fafc",
    },
    textMutedDark: {
        color: "#94a3b8",
    },
    counterCard: {
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.xl,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    counterCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    activeArabic: {
        color: "#064e3b",
        fontSize: 29,
        lineHeight: 48,
        paddingVertical: 4,
        textAlign: "center",
    },
    activeArabicDark: {
        color: "#34d399",
    },
    activeLatin: {
        color: "#64748b",
        fontSize: 13,
        fontStyle: "italic",
        fontWeight: "700",
        marginBottom: spacing.lg,
        textAlign: "center",
    },
    counterWrap: {
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    counterButton: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: 112,
        height: 224,
        justifyContent: "center",
        shadowColor: "#064e3b",
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        width: 224,
    },
    counterButtonDone: {
        backgroundColor: "#059669",
    },
    counterNumber: {
        color: "#ffffff",
        fontSize: 58,
        fontWeight: "900",
        lineHeight: 66,
    },
    counterTarget: {
        color: "rgba(255,255,255,0.82)",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
        marginTop: 4,
        textTransform: "uppercase",
    },
    doneBadge: {
        alignItems: "center",
        backgroundColor: "#fbbf24",
        borderRadius: 18,
        height: 36,
        justifyContent: "center",
        position: "absolute",
        right: 18,
        top: 12,
        width: 36,
    },
    progressBlock: {
        marginBottom: spacing.lg,
    },
    progressTrack: {
        backgroundColor: "#e5e7eb",
        borderRadius: 999,
        height: 8,
        overflow: "hidden",
    },
    progressTrackDark: {
        backgroundColor: "#1e293b",
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
        marginTop: 6,
        textAlign: "center",
    },
    actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        justifyContent: "center",
    },
    neutralButton: {
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: spacing.xs,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
    },
    neutralButtonDark: {
        backgroundColor: "#1e293b",
    },
    neutralButtonText: {
        color: "#374151",
        fontSize: 12,
        fontWeight: "900",
    },
    neutralButtonTextDark: {
        color: "#f1f5f9",
    },
    dangerButton: {
        alignItems: "center",
        backgroundColor: "#fef2f2",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: spacing.xs,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
    },
    dangerButtonDark: {
        backgroundColor: "#450a0a",
    },
    dangerButtonText: {
        color: "#dc2626",
        fontSize: 12,
        fontWeight: "900",
    },
    dangerButtonTextDark: {
        color: "#fca5a5",
    },
    vibrateButton: {
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: spacing.xs,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
    },
    vibrateButtonDark: {
        backgroundColor: "#1e293b",
    },
    vibrateButtonActive: {
        backgroundColor: "#ecfdf5",
    },
    vibrateButtonActiveDark: {
        backgroundColor: "#064e3b",
    },
    vibrateButtonText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "900",
    },
    vibrateButtonTextDark: {
        color: "#94a3b8",
    },
    vibrateButtonTextActive: {
        color: "#047857",
    },
    vibrateButtonTextActiveDark: {
        color: "#34d399",
    },
    statsGrid: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    statsGridDark: {},
    statTile: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flex: 1,
        justifyContent: "center",
        minHeight: 78,
        padding: spacing.sm,
    },
    statTileDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    statValue: {
        fontSize: 23,
        fontWeight: "900",
        lineHeight: 29,
    },
    statLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "800",
        lineHeight: 15,
        marginTop: 2,
        textAlign: "center",
    },
    targetCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.lg,
        padding: spacing.md,
    },
    targetCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    targetHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    targetTitle: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "900",
    },
    targetTitleDark: {
        color: "#f8fafc",
    },
    targetInput: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.sm,
        borderWidth: 1,
        color: "#111827",
        fontSize: 13,
        fontWeight: "900",
        minHeight: 40,
        minWidth: 86,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        textAlign: "right",
    },
    targetInputDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
        color: "#f8fafc",
    },
    targetChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    targetChip: {
        backgroundColor: "#f3f4f6",
        borderRadius: 999,
        minHeight: 36,
        justifyContent: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
    },
    targetChipDark: {
        backgroundColor: "#1e293b",
    },
    targetChipActive: {
        backgroundColor: "#10b981",
    },
    targetChipText: {
        color: "#4b5563",
        fontSize: 12,
        fontWeight: "900",
    },
    targetChipTextDark: {
        color: "#cbd5e1",
    },
    targetChipTextActive: {
        color: "#ffffff",
    },
    presetsSection: {
        marginBottom: spacing.md,
    },
    presetsSectionDark: {},
    presetsTitle: {
        color: "#374151",
        fontSize: 14,
        fontWeight: "900",
        marginBottom: spacing.sm,
    },
    presetsGrid: {
        gap: spacing.sm,
    },
    presetCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.md,
    },
    presetCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    presetCardActive: {
        backgroundColor: "#ecfdf5",
        borderColor: "#6ee7b7",
    },
    presetCardActiveDark: {
        backgroundColor: "rgba(6, 78, 59, 0.35)",
        borderColor: "#10b981",
    },
    presetArabic: {
        color: "#064e3b",
        fontSize: 21,
        lineHeight: 34,
        paddingVertical: 2,
        textAlign: "right",
    },
    presetArabicDark: {
        color: "#34d399",
    },
    presetLatin: {
        color: "#64748b",
        fontSize: 12,
        fontStyle: "italic",
        fontWeight: "700",
    },
    presetTarget: {
        color: "#059669",
        fontSize: 12,
        fontWeight: "900",
        marginTop: 4,
    },
    presetTargetDark: {
        color: "#34d399",
    },
});
