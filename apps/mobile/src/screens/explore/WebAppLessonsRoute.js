import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Play,
} from "lucide-react-native";
import { Card } from "../../components/Card";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, radius, spacing } from "../../theme";
import { putJson, requestJson } from "../../api/client";
import { getFeatureItemPage } from "../../api/explore";

export function WebAppLessonsRoute({
    feature,
    items,
    isDarkTheme,
    styles: injectedStyles,
}) {
    const { t } = useMobileLocale();
    const [modules, setModules] = useState(items || []);
    const [loading, setLoading] = useState(!items?.length);
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
                    const list = res?.items || [];
                    setModules(list);
                    if (list.length > 0) {
                        setActiveModuleId(list[0].slug || list[0].id);
                    }
                })
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, [feature, items]);

    useEffect(() => {
        requestJson("/api/v1/lessons/progress", { auth: true })
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
        } catch {}
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
                    color={isDarkTheme ? "#34d399" : colors.primary}
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
                        isDarkTheme && { color: "#9ca3af" },
                    ]}
                >
                    {t("explore.empty.lessons") || "Belum ada modul pelajaran."}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={localStyles.container}
            contentContainerStyle={localStyles.content}
            testID='explore-web-app-lessons-surface'
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={localStyles.moduleSelector}
                contentContainerStyle={localStyles.moduleSelectorContent}
            >
                {modules.map((m) => {
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
                                isDarkTheme && {
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
                                    isDarkTheme && {
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
                <Card
                    style={[
                        localStyles.stepCard,
                        isDarkTheme && {
                            backgroundColor: "#111827",
                            borderColor: "#374151",
                        },
                    ]}
                >
                    <View style={localStyles.headerRow}>
                        <Text
                            style={[
                                localStyles.stepBadge,
                                isDarkTheme && {
                                    backgroundColor: "#064e3b",
                                    color: "#6ee7b7",
                                },
                            ]}
                        >
                            Langkah {activeStepIdx + 1} dari {totalSteps}
                        </Text>
                        {completed[
                            `${activeModuleId}_${activeStepIdx + 1}`
                        ] && <CheckCircle2 size={16} color='#10b981' />}
                    </View>

                    <Text
                        style={[
                            localStyles.stepTitle,
                            isDarkTheme && { color: "#f9fafb" },
                        ]}
                    >
                        {step?.title || activeModule.title}
                    </Text>

                    {step?.content ? (
                        <Text
                            style={[
                                localStyles.stepBody,
                                isDarkTheme && { color: "#d1d5db" },
                            ]}
                        >
                            {step.content}
                        </Text>
                    ) : null}

                    {step?.arabic ? (
                        <Text
                            style={[
                                localStyles.stepArabic,
                                isDarkTheme && { color: "#a7f3d0" },
                            ]}
                        >
                            {step.arabic}
                        </Text>
                    ) : null}

                    {step?.translation ? (
                        <Text
                            style={[
                                localStyles.stepTranslation,
                                isDarkTheme && { color: "#9ca3af" },
                            ]}
                        >
                            {step.translation}
                        </Text>
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
                                isDarkTheme && { backgroundColor: "#1f2937" },
                            ]}
                        >
                            <ChevronLeft
                                size={18}
                                color={
                                    activeStepIdx === 0
                                        ? "#9ca3af"
                                        : isDarkTheme
                                          ? "#f3f4f6"
                                          : colors.textPrimary
                                }
                            />
                            <Text
                                style={[
                                    localStyles.navButtonText,
                                    activeStepIdx === 0 &&
                                        localStyles.navButtonTextDisabled,
                                    isDarkTheme && { color: "#f3f4f6" },
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
                                isDarkTheme && { backgroundColor: "#059669" },
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
        fontSize: 20,
        lineHeight: 32,
        textAlign: "right",
        color: colors.primary,
        fontFamily: "System",
    },
    stepTranslation: {
        fontSize: 13,
        fontStyle: "italic",
        color: colors.textSecondary,
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
        gap: 4,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: "#f3f4f6",
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
