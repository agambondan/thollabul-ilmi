import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Play,
    Sparkles,
} from "lucide-react-native";
import { Card } from "../../components/Card";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { colors, radius, spacing } from "../../theme";
import { putJson, requestJson } from "../../api/client";
import { getFeatureItemPage } from "../../api/explore";
import { playAudioUrl, stopAudio } from "../../utils/audioPlayer";
import { staticLessons } from "../../data/staticLessons";
import {
    preferenceKeys,
    readPreference,
    writePreference,
} from "../../storage/preferences";

const LESSON_CATEGORIES = [
    "Semua",
    "Al-Quran",
    "Fiqh Ibadah",
    "Aqidah",
    "Ibadah Harian",
    "Adab",
];

export function WebAppLessonsRoute({
    clearFeature,
    feature,
    items,
    isDarkTheme,
    navigation,
    styles: injectedStyles,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const activeDark = isDarkTheme ?? isDarkThemePref ?? false;
    const [modules, setModules] = useState(items?.length ? items : (staticLessons || []));
    const [loading, setLoading] = useState(!items?.length && !staticLessons?.length);
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [activeStepIdx, setActiveStepIdx] = useState(0);
    const [completed, setCompleted] = useState({});

    useEffect(() => {
        if (items?.length) {
            setModules(items);
            if (!activeModuleId && items[0]) {
                setActiveModuleId(items[0].slug || items[0].id);
            }
            setLoading(false);
        } else {
            getFeatureItemPage(feature)
                .then((res) => {
                    const list = res?.items?.length ? res.items : staticLessons;
                    setModules(list);
                    if (list.length > 0) {
                        setActiveModuleId((prev) => prev || list[0].slug || list[0].id);
                    }
                })
                .catch(() => {
                    if (staticLessons?.length) {
                        setModules(staticLessons);
                        setActiveModuleId((prev) => prev || staticLessons[0].slug || staticLessons[0].id);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [feature, items]);

    const filteredModules = useMemo(() => {
        if (!selectedCategory || selectedCategory === "Semua") return modules;
        return modules.filter((m) => m.category === selectedCategory);
    }, [modules, selectedCategory]);

    useEffect(() => {
        if (filteredModules.length > 0) {
            const hasActive = filteredModules.some(
                (m) => (m.slug || m.id) === activeModuleId,
            );
            if (!hasActive) {
                setActiveModuleId(
                    filteredModules[0].slug || filteredModules[0].id,
                );
                setActiveStepIdx(0);
            }
        }
    }, [filteredModules, activeModuleId]);

    const enqueuePending = async (moduleId, step, done) => {
        try {
            const pending = await readPreference(preferenceKeys.lessonProgressPendingSync, {});
            pending[`${moduleId}:${step}`] = { moduleId, step, done, ts: Date.now() };
            await writePreference(preferenceKeys.lessonProgressPendingSync, pending);
        } catch {}
    };

    const flushPending = async () => {
        try {
            const pending = await readPreference(preferenceKeys.lessonProgressPendingSync, {});
            const keys = Object.keys(pending);
            if (!keys.length) return;
            for (const key of keys) {
                const item = pending[key];
                try {
                    await putJson(
                        "/api/v1/lessons/progress",
                        { module_id: item.moduleId, step: item.step, done: item.done },
                        { auth: true },
                    );
                    delete pending[key];
                } catch {}
            }
            await writePreference(preferenceKeys.lessonProgressPendingSync, pending);
        } catch {}
    };

    useEffect(() => {
        flushPending();
        const handleAppState = (state) => {
            if (state === "active") flushPending();
        };
        const sub = AppState.addEventListener("change", handleAppState);
        return () => {
            sub?.remove?.();
        };
    }, [modules]);

    useEffect(() => {
        Promise.resolve(requestJson("/api/v1/lessons/progress", { auth: true }))
            .then((data) => {
                const progressItems = data?.data?.items || data?.items || [];
                const comp = {};
                progressItems.forEach((p) => {
                    const m = modules.find((mod) => mod.id === p.module_id);
                    if (m) comp[`${m.slug || m.id}_${p.step}`] = p.done;
                });
                setCompleted(comp);
            })
            .catch(() => {});
    }, [modules]);

    useEffect(() => {
        if (!navigation?.setHeader) return;
        if (activeStepIdx > 0) {
            navigation.setHeader({
                showBack: true,
                title: step?.title || activeModule?.title || "Pelajaran",
                onBack: () => {
                    setActiveStepIdx((prev) => prev - 1);
                    return true;
                },
            });
        } else if (clearFeature) {
            navigation.setHeader({
                showBack: true,
                title: activeModule?.title || "Pelajaran",
                onBack: () => {
                    clearFeature();
                    return true;
                },
            });
        } else {
            navigation.setHeader(null);
        }
    }, [activeStepIdx, navigation, clearFeature, step, activeModule]);

    const activeModule = modules.find(
        (m) => (m.slug || m.id) === activeModuleId,
    );
    const totalSteps = activeModule?.steps?.length || 0;
    const step = activeModule?.steps?.[activeStepIdx];

    const saveProgress = async (stepNum, done) => {
        if (!activeModule?.id) return;
        try {
            await putJson(
                "/api/v1/lessons/progress",
                {
                    module_id: activeModule.id,
                    step: stepNum,
                    done,
                },
                { auth: true },
            );
        } catch {
            await enqueuePending(activeModule.id, stepNum, done);
        }
    };

    const handleNext = () => {
        if (activeStepIdx < totalSteps - 1) {
            setActiveStepIdx(activeStepIdx + 1);
        } else {
            const key = `${activeModuleId}_${totalSteps}`;
            setCompleted((prev) => ({ ...prev, [key]: true }));
            saveProgress(totalSteps, true);
        }
    };

    const handlePrev = () => {
        if (activeStepIdx > 0) setActiveStepIdx(activeStepIdx - 1);
    };

    if (loading) {
        return (
            <View
                style={localStyles.center}
                testID='explore-web-app-lessons-surface'
            >
                <ActivityIndicator
                    color={activeDark ? "#34d399" : colors.primary}
                />
            </View>
        );
    }

    if (!modules.length) {
        return (
            <View
                style={localStyles.center}
                testID='explore-web-app-lessons-surface'
            >
                <Text
                    style={[
                        localStyles.emptyText,
                        activeDark && { color: "#9ca3af" },
                    ]}
                >
                    {t("explore.empty.lessons") || "Belum ada modul pelajaran."}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[
                localStyles.container,
                activeDark && { backgroundColor: "#0f172a" },
            ]}
            contentContainerStyle={localStyles.content}
            testID='explore-web-app-lessons-surface'
        >
            {/* Kategori Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={localStyles.categorySelector}
                contentContainerStyle={localStyles.categorySelectorContent}
            >
                {LESSON_CATEGORIES.map((cat) => {
                    const isCatSelected = selectedCategory === cat;
                    return (
                        <Pressable
                            accessibilityRole='button'
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={[
                                localStyles.categoryTab,
                                isCatSelected && localStyles.categoryTabActive,
                                activeDark && {
                                    backgroundColor: isCatSelected
                                        ? "#047857"
                                        : "#1e293b",
                                    borderColor: isCatSelected
                                        ? "#10b981"
                                        : "#334155",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    localStyles.categoryTabText,
                                    isCatSelected &&
                                        localStyles.categoryTabTextActive,
                                    activeDark && {
                                        color: isCatSelected
                                            ? "#ffffff"
                                            : "#94a3b8",
                                    },
                                ]}
                            >
                                {cat}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Modul Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={localStyles.moduleSelector}
                contentContainerStyle={localStyles.moduleSelectorContent}
            >
                {filteredModules.map((m) => {
                    const isSelected = (m.slug || m.id) === activeModuleId;
                    return (
                        <Pressable
                            accessibilityRole='button'
                            key={m.id || m.slug}
                            onPress={() => {
                                setActiveModuleId(m.slug || m.id);
                                setActiveStepIdx(0);
                            }}
                            style={[
                                localStyles.moduleTab,
                                isSelected && localStyles.moduleTabActive,
                                activeDark && {
                                    backgroundColor: isSelected
                                        ? "#065f46"
                                        : "#1f2937",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    localStyles.moduleTabText,
                                    isSelected &&
                                        localStyles.moduleTabTextActive,
                                    activeDark && {
                                        color: isSelected
                                            ? "#a7f3d0"
                                            : "#d1d5db",
                                    },
                                ]}
                            >
                                {m.title}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {activeModule && (
                <View
                    style={[
                        localStyles.moduleSummaryCard,
                        activeDark && {
                            backgroundColor: "#111827",
                            borderColor: "#374151",
                        },
                    ]}
                >
                    <View style={localStyles.moduleSummaryHeader}>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={[
                                    localStyles.moduleSummaryTitle,
                                    activeDark && { color: "#f9fafb" },
                                ]}
                            >
                                {activeModule.title}
                            </Text>
                            {activeModule.description ? (
                                <Text
                                    style={[
                                        localStyles.moduleSummaryDesc,
                                        activeDark && { color: "#9ca3af" },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {activeModule.description}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={localStyles.moduleBadgesRow}>
                        {activeModule.category ? (
                            <Text
                                style={[
                                    localStyles.moduleBadge,
                                    activeDark && {
                                        backgroundColor: "#1e293b",
                                        color: "#38bdf8",
                                    },
                                ]}
                            >
                                {activeModule.category}
                            </Text>
                        ) : null}
                        {activeModule.level ? (
                            <Text
                                style={[
                                    localStyles.moduleBadge,
                                    activeDark && {
                                        backgroundColor: "#1e293b",
                                        color: "#a7f3d0",
                                    },
                                ]}
                            >
                                {activeModule.level}
                            </Text>
                        ) : null}
                        {activeModule.estimated_minutes ? (
                            <Text
                                style={[
                                    localStyles.moduleBadge,
                                    activeDark && {
                                        backgroundColor: "#1e293b",
                                        color: "#fbbf24",
                                    },
                                ]}
                            >
                                ⏱ {activeModule.estimated_minutes} mnt
                            </Text>
                        ) : null}
                    </View>
                </View>
            )}

            {activeModule && (
                <Card
                    style={[
                        localStyles.stepCard,
                        activeDark && {
                            backgroundColor: "#111827",
                            borderColor: "#374151",
                        },
                    ]}
                >
                    <View style={localStyles.headerRow}>
                        <View
                            style={{
                                flexDirection: "row",
                                gap: 6,
                                alignItems: "center",
                            }}
                        >
                            <Text
                                style={[
                                    localStyles.stepBadge,
                                    activeDark && {
                                        backgroundColor: "#064e3b",
                                        color: "#6ee7b7",
                                    },
                                ]}
                            >
                                Langkah {activeStepIdx + 1} dari {totalSteps}
                            </Text>
                            {step?.kind && (
                                <Text
                                    style={[
                                        localStyles.stepBadge,
                                        step.kind === "rukun"
                                            ? {
                                                  backgroundColor: "#fee2e2",
                                                  color: "#b91c1c",
                                              }
                                            : step.kind === "sunnah"
                                              ? {
                                                    backgroundColor: "#fef3c7",
                                                    color: "#b45309",
                                                  }
                                              : {
                                                    backgroundColor: "#e0f2fe",
                                                    color: "#0369a1",
                                                },
                                        activeDark && {
                                            backgroundColor: "#1e293b",
                                            color: "#93c5fd",
                                        },
                                    ]}
                                >
                                    {step.kind.toUpperCase()}
                                </Text>
                            )}
                        </View>
                        {completed[
                            `${activeModuleId}_${activeStepIdx + 1}`
                        ] && <CheckCircle2 size={16} color='#10b981' />}
                    </View>

                    <Text
                        style={[
                            localStyles.stepTitle,
                            activeDark && { color: "#f9fafb" },
                        ]}
                    >
                        {step?.title || activeModule.title}
                    </Text>

                    {step?.body || step?.content ? (
                        <Text
                            style={[
                                localStyles.stepBody,
                                activeDark && { color: "#d1d5db" },
                            ]}
                        >
                            {step?.body || step?.content}
                        </Text>
                    ) : null}

                    {step?.arabic ? (
                        <Text
                            style={[
                                localStyles.stepArabic,
                                activeDark && { color: "#a7f3d0" },
                            ]}
                        >
                            {step.arabic}
                        </Text>
                    ) : null}

                    {step?.latin ? (
                        <Text
                            style={[
                                localStyles.stepLatin,
                                activeDark && { color: "#6ee7b7" },
                            ]}
                        >
                            {step.latin}
                        </Text>
                    ) : null}

                    {step?.translation ? (
                        <Text
                            style={[
                                localStyles.stepTranslation,
                                activeDark && { color: "#9ca3af" },
                            ]}
                        >
                            {step.translation}
                        </Text>
                    ) : null}

                    {step?.dalil ? (
                        <View
                            style={[
                                localStyles.stepDalilBox,
                                activeDark && {
                                    backgroundColor: "rgba(6, 95, 70, 0.2)",
                                    borderLeftColor: "#10b981",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    localStyles.stepDalilText,
                                    activeDark && { color: "#d1d5db" },
                                ]}
                            >
                                {step.dalil}
                            </Text>
                        </View>
                    ) : null}

                    {step?.tip ? (
                        <View
                            style={[
                                localStyles.stepTipBox,
                                activeDark && {
                                    backgroundColor: "rgba(180, 83, 9, 0.2)",
                                    borderLeftColor: "#f59e0b",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    localStyles.stepTipText,
                                    activeDark && { color: "#fde68a" },
                                ]}
                            >
                                {step.tip}
                            </Text>
                        </View>
                    ) : null}

                    {step?.audio_url ? (
                        <Pressable
                            accessibilityRole='button'
                            onPress={() => {
                                const target = step.audio_url.startsWith("http")
                                    ? step.audio_url
                                    : `https://thollabulilmi.site${step.audio_url}`;
                                playAudioUrl(target).catch(() => {});
                            }}
                            style={[
                                localStyles.audioButton,
                                activeDark && {
                                    backgroundColor: "#064e3b",
                                    borderColor: "#059669",
                                },
                            ]}
                        >
                            <Play
                                size={16}
                                color={activeDark ? "#6ee7b7" : colors.primary}
                            />
                            <Text
                                style={[
                                    localStyles.audioButtonText,
                                    activeDark && { color: "#6ee7b7" },
                                ]}
                            >
                                Putar Audio Pelafalan
                            </Text>
                        </Pressable>
                    ) : null}

                    <View style={localStyles.navRow}>
                        <Pressable
                            accessibilityRole='button'
                            onPress={handlePrev}
                            accessibilityState={{
                                disabled: activeStepIdx === 0,
                            }}
                            disabled={activeStepIdx === 0}
                            style={[
                                localStyles.navButton,
                                activeStepIdx === 0 &&
                                    localStyles.navButtonDisabled,
                                activeDark && { backgroundColor: "#1f2937" },
                            ]}
                        >
                            <ChevronLeft
                                size={18}
                                color={
                                    activeStepIdx === 0
                                        ? "#9ca3af"
                                        : activeDark
                                          ? "#f3f4f6"
                                          : colors.textPrimary
                                }
                            />
                            <Text
                                style={[
                                    localStyles.navButtonText,
                                    activeStepIdx === 0 &&
                                        localStyles.navButtonTextDisabled,
                                    activeDark && { color: "#f3f4f6" },
                                ]}
                            >
                                Sebelumnya
                            </Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole='button'
                            onPress={handleNext}
                            style={[
                                localStyles.navButton,
                                localStyles.navButtonPrimary,
                                activeDark && { backgroundColor: "#059669" },
                            ]}
                        >
                            <Text style={localStyles.navButtonPrimaryText}>
                                {activeStepIdx === totalSteps - 1
                                    ? "Selesai"
                                    : "Lanjut"}
                            </Text>
                            <ChevronRight size={18} color='#ffffff' />
                        </Pressable>
                    </View>
                </Card>
            )}
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
    center: {
        padding: spacing.xl,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    categorySelector: {
        flexGrow: 0,
    },
    categorySelectorContent: {
        gap: spacing.xs,
        paddingBottom: spacing.xs,
    },
    categoryTab: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm + 4,
        borderRadius: radius.full,
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        minHeight: 44,
        justifyContent: "center",
    },
    categoryTabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryTabText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    categoryTabTextActive: {
        color: "#ffffff",
    },
    moduleSummaryCard: {
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: spacing.xs,
    },
    moduleSummaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    moduleSummaryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    moduleSummaryDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
        lineHeight: 18,
    },
    moduleBadgesRow: {
        flexDirection: "row",
        gap: spacing.xs,
        marginTop: 4,
    },
    moduleBadge: {
        fontSize: 11,
        fontWeight: "600",
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        paddingHorizontal: spacing.xs + 2,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    moduleSelector: {
        flexGrow: 0,
    },
    moduleSelectorContent: {
        gap: spacing.xs,
        paddingBottom: spacing.xs,
    },
    moduleTab: {
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        backgroundColor: "#f3f4f6",
        minHeight: 44,
        justifyContent: "center",
    },
    moduleTabActive: {
        backgroundColor: colors.primaryLight || "#ecfdf5",
    },
    moduleTabText: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textSecondary,
    },
    moduleTabTextActive: {
        color: colors.primary,
        fontWeight: "600",
    },
    stepCard: {
        padding: spacing.lg,
        gap: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    stepBadge: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.primary,
        backgroundColor: colors.primaryLight || "#ecfdf5",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    stepBody: {
        fontSize: 14,
        lineHeight: 22,
        color: colors.textSecondary,
    },
    stepArabic: {
        fontSize: 22,
        lineHeight: 40,
        textAlign: "right",
        color: colors.primary,
        fontFamily: "System",
        writingDirection: "rtl",
        paddingVertical: 4,
    },
    stepTranslation: {
        fontSize: 13,
        fontStyle: "italic",
        color: colors.textSecondary,
    },
    stepLatin: {
        fontSize: 13,
        fontStyle: "italic",
        color: colors.primaryDark || "#047857",
        lineHeight: 20,
    },
    stepDalilBox: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        backgroundColor: "#ecfdf5",
        padding: spacing.sm,
        borderRadius: radius.sm,
    },
    stepDalilText: {
        fontSize: 12,
        color: colors.textPrimary,
        lineHeight: 18,
    },
    stepTipBox: {
        borderLeftWidth: 3,
        borderLeftColor: "#f59e0b",
        backgroundColor: "#fffbeb",
        padding: spacing.sm,
        borderRadius: radius.sm,
    },
    stepTipText: {
        fontSize: 12,
        color: "#92400e",
        lineHeight: 18,
    },
    audioButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.primaryLight || "#ecfdf5",
        borderWidth: 1,
        borderColor: "#a7f3d0",
        marginTop: spacing.xs,
        minHeight: 44,
    },
    audioButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.primary,
    },
    navRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    navButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: "#f3f4f6",
        minHeight: 44,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonPrimary: {
        backgroundColor: colors.primary,
    },
    navButtonText: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    navButtonTextDisabled: {
        color: "#9ca3af",
    },
    navButtonPrimaryText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#ffffff",
    },
});
