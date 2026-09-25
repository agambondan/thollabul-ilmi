import { Brain, CheckCircle2, Filter, RefreshCw, RotateCcw, XCircle } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, radius, spacing, touchTarget } from "../../theme";
import { quizOptions } from "../ExploreScreen.helpers";
import { staticQuizQuestions } from "../../data/staticQuiz";

const QUIZ_CATEGORIES = [
    "Semua",
    "Quran & Hafalan",
    "Hadits",
    "Fiqh",
    "Sirah",
    "Asmaul Husna",
    "Aqidah",
    "Tajwid",
    "Sanad",
];

const QUESTION_COUNT_OPTIONS = [10, 25, 50];

const getRaw = (item) => item?.raw ?? {};
const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";
const getItemId = (item, index) =>
    item?.id ?? getRaw(item).id ?? `quiz-${index}`;
const getQuestionText = (item, index, t) =>
    pickText(
        getRaw(item).translation?.question_idn,
        getRaw(item).translation?.question_en,
        getRaw(item).question_text,
        getRaw(item).question,
        getRaw(item).text,
        getRaw(item).title,
        item?.title,
        t("explore.quiz.questionFallback", { number: index + 1 }),
    );
const getExplanation = (item) =>
    pickText(
        getRaw(item).translation?.explanation_idn,
        getRaw(item).translation?.explanation_en,
        getRaw(item).explanation,
        getRaw(item).reason,
    );
const getCategory = (item) =>
    pickText(
        getRaw(item).category?.name,
        getRaw(item).category?.title,
        getRaw(item).category,
        item?.meta,
    );
const parseOptions = (item) => {
    const raw = getRaw(item);
    let options = [];

    if (Array.isArray(raw.options)) {
        options = raw.options;
    } else if (typeof raw.options === "string") {
        try {
            const parsed = JSON.parse(raw.options);
            if (Array.isArray(parsed)) options = parsed;
        } catch {
            options = [];
        }
    }

    if (!options.length) {
        options = [
            raw.option_a,
            raw.option_b,
            raw.option_c,
            raw.option_d,
        ].filter(Boolean);
    }

    if (!options.length) {
        return quizOptions.map((key) => ({ key, label: key }));
    }

    return options.slice(0, 4).map((option, index) => ({
        key: quizOptions[index] ?? `${index + 1}`,
        label: `${option?.label ?? option?.text ?? option?.value ?? option}`,
    }));
};
const normalizeAnswer = (value) => `${value ?? ""}`.trim().toLowerCase();
const getCorrectAnswer = (item) => {
    const raw = getRaw(item);
    return (
        raw.correct_answer ??
        raw.answer_key ??
        raw.answer ??
        raw.correctAnswer ??
        raw.correct_answer_index
    );
};
const isCorrectOption = (item, option, index) => {
    const correct = getCorrectAnswer(item);
    const normalized = normalizeAnswer(correct);
    if (!normalized) return false;
    return (
        normalizeAnswer(option.key) === normalized ||
        normalizeAnswer(option.label) === normalized ||
        `${index}` === normalized ||
        `${index + 1}` === normalized
    );
};
const getSelectedCorrect = (item, selected) => {
    if (!selected) return false;
    return isCorrectOption(item, selected, quizOptions.indexOf(selected.key));
};

function OptionButton({ disabled, index, isDarkTheme, item, onPress, option, selected }) {
    const correct = isCorrectOption(item, option, index);
    const isSelected = selected?.key === option.key;
    const answered = Boolean(selected);
    const stateStyle = !answered
        ? (isDarkTheme ? styles.optionButtonDark : null)
        : correct
          ? (isDarkTheme ? styles.optionCorrectDark : styles.optionCorrect)
          : isSelected
            ? (isDarkTheme ? styles.optionWrongDark : styles.optionWrong)
            : (isDarkTheme ? styles.optionMutedDark : styles.optionMuted);
    const textStyle = !answered
        ? (isDarkTheme ? styles.optionTextDark : null)
        : correct
          ? styles.optionTextCorrect
          : isSelected
            ? styles.optionTextWrong
            : styles.optionTextMuted;

    return (
        <Pressable
            accessibilityRole='button'
            accessibilityState={{ disabled: disabled }}
            disabled={disabled}
            onPress={onPress}
            style={[styles.optionButton, stateStyle]}
            testID='web-app-quiz-option'
        >
            <Text style={[styles.optionLetter, isDarkTheme && !answered && styles.optionLetterDark, textStyle]}>{option.key}</Text>
            <Text style={[styles.optionText, isDarkTheme && !answered && styles.optionTextDark, textStyle]}>{option.label}</Text>
            {answered && correct ? (
                <CheckCircle2 color={isDarkTheme ? "#34d399" : "#047857"} size={18} strokeWidth={2.3} />
            ) : null}
            {answered && isSelected && !correct ? (
                <XCircle color={isDarkTheme ? "#f87171" : "#dc2626"} size={18} strokeWidth={2.3} />
            ) : null}
        </Pressable>
    );
}

function ResultRow({ answer, index, isDarkTheme, item, t }) {
    const correct = getSelectedCorrect(item, answer);
    return (
        <View
            style={[
                styles.resultRow,
                isDarkTheme && styles.resultRowDark,
                correct
                    ? (isDarkTheme ? styles.resultRowCorrectDark : styles.resultRowCorrect)
                    : (isDarkTheme ? styles.resultRowWrongDark : styles.resultRowWrong),
            ]}
        >
            {correct ? (
                <CheckCircle2 color={isDarkTheme ? "#34d399" : "#047857"} size={17} strokeWidth={2.2} />
            ) : (
                <XCircle color={isDarkTheme ? "#f87171" : "#dc2626"} size={17} strokeWidth={2.2} />
            )}
            <Text
                numberOfLines={1}
                style={[
                    styles.resultRowText,
                    correct
                        ? (isDarkTheme ? styles.resultRowTextCorrectDark : styles.resultRowTextCorrect)
                        : (isDarkTheme ? styles.resultRowTextWrongDark : styles.resultRowTextWrong),
                ]}
            >
                {getQuestionText(item, index, t)}
            </Text>
        </View>
    );
}

export function WebAppQuizRoute({
    activeFeature,
    answers = {},
    clearFeature,
    error,
    items = [],
    loading,
    navigation,
    onRestart,
    scoreQuiz,
    setAnswers = () => {},
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [done, setDone] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [questionCount, setQuestionCount] = useState(10);

    const sourceItems = useMemo(() => {
        if (items?.length) return items;
        if (staticQuizQuestions?.length) return staticQuizQuestions;
        return [];
    }, [items]);

    const filteredItems = useMemo(() => {
        let pool = sourceItems;
        if (selectedCategory && selectedCategory !== "Semua") {
            const catMap = {
                "Quran & Hafalan": ["hafalan", "quran"],
                "Hadits": ["hadith"],
                "Fiqh": ["fiqh"],
                "Sirah": ["sirah"],
                "Asmaul Husna": ["asmaul_husna"],
                "Aqidah": ["aqidah"],
                "Tajwid": ["tajwid"],
                "Sanad": ["sanad", "perawi"],
            };
            const types = catMap[selectedCategory] || [];
            pool = pool.filter((q) => types.includes(q.type));
        }
        return pool.slice(0, questionCount);
    }, [sourceItems, selectedCategory, questionCount]);

    const total = filteredItems.length;
    const currentItem = filteredItems[currentIndex];
    const selected = currentItem
        ? answers[getItemId(currentItem, currentIndex)]
        : null;
    const options = useMemo(() => parseOptions(currentItem), [currentItem]);
    const score =
        typeof scoreQuiz === "function"
            ? scoreQuiz()
            : filteredItems.reduce(
                  (sum, item, index) =>
                      sum +
                      (getSelectedCorrect(item, answers[getItemId(item, index)])
                          ? 1
                          : 0),
                  0,
              );
    const progressPct = total
        ? Math.round(((currentIndex + 1) / total) * 100)
        : 0;

    useEffect(() => {
        setCurrentIndex(0);
        setDone(false);
    }, [total]);

    useEffect(() => {
        if (!navigation?.setHeader) return;
        if (currentIndex > 0) {
            navigation.setHeader({
                showBack: true,
                title: t("explore.quiz.questionProgress", { current: currentIndex + 1, total }),
                onBack: () => {
                    setCurrentIndex((prev) => prev - 1);
                    return true;
                },
            });
        } else if (clearFeature) {
            navigation.setHeader({
                showBack: true,
                title: t("explore.quiz.title"),
                onBack: () => {
                    clearFeature();
                    return true;
                },
            });
        } else {
            navigation.setHeader(null);
        }
    }, [currentIndex, navigation, clearFeature, t, total]);

    const answerCurrent = (option) => {
        if (!currentItem || selected) return;
        const itemId = getItemId(currentItem, currentIndex);
        setAnswers((current) => ({
            ...current,
            [itemId]: option,
        }));
    };
    const goNext = () => {
        if (currentIndex + 1 >= total) {
            setDone(true);
            return;
        }
        setCurrentIndex((current) => current + 1);
    };
    const restart = () => {
        setAnswers({});
        setCurrentIndex(0);
        setDone(false);
        onRestart?.(activeFeature);
    };

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-quiz-surface' />

            {loading ? (
                <View style={[styles.stateCard, isDarkTheme && styles.stateCardDark]}>
                    <ActivityIndicator color={isDarkTheme ? "#34d399" : "#047857"} size='small' />
                    <Text style={[styles.stateText, isDarkTheme && styles.textMutedDark]}>
                        {t("explore.quiz.loading")}
                    </Text>
                </View>
            ) : null}

            {!loading && !total ? (
                <View style={[styles.emptyCard, isDarkTheme && styles.emptyCardDark]}>
                    <View style={[styles.emptyIcon, isDarkTheme && styles.emptyIconDark]}>
                        <Brain color={isDarkTheme ? "#a78bfa" : "#7c3aed"} size={34} strokeWidth={2.2} />
                    </View>
                    <Text style={[styles.emptyTitle, isDarkTheme && styles.textPrimaryDark]}>
                        {t("explore.quiz.title")}
                    </Text>
                    <Text style={[styles.emptyText, isDarkTheme && styles.textMutedDark]}>
                        {error || t("explore.quiz.emptyText")}
                    </Text>
                    <Pressable
                        accessibilityRole='button'
                        onPress={restart}
                        style={[styles.primaryButton, isDarkTheme && styles.primaryButtonDark]}
                    >
                        <Text style={styles.primaryButtonText}>
                            {t("explore.quiz.retry")}
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            {!loading && total && !done ? (
                <>
                    <View style={styles.header}>
                        <Text style={[styles.title, isDarkTheme && styles.textPrimaryDark]}>
                            {t("explore.quiz.title")}
                        </Text>
                        <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                            {t("explore.quiz.subtitle")}
                        </Text>
                    </View>

                    {/* Category Filter Pills */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryScrollContent}
                    >
                        {QUIZ_CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <Pressable
                                    accessibilityRole='button'
                                    key={cat}
                                    onPress={() => {
                                        setSelectedCategory(cat);
                                        setCurrentIndex(0);
                                        setAnswers({});
                                    }}
                                    style={[
                                        styles.categoryPill,
                                        isDarkTheme && styles.categoryPillDark,
                                        isSelected && (isDarkTheme ? styles.categoryPillActiveDark : styles.categoryPillActive),
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.categoryPillText,
                                            isDarkTheme && styles.categoryPillTextDark,
                                            isSelected && styles.categoryPillTextActive,
                                        ]}
                                    >
                                        {cat}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, isDarkTheme && styles.textMutedDark]}>
                            {t("explore.quiz.progressLabel", {
                                current: currentIndex + 1,
                                total,
                            })}
                        </Text>
                        <Text style={[styles.progressScore, isDarkTheme && styles.progressScoreDark]}>
                            {t("explore.quiz.scoreCorrect", { score })}
                        </Text>
                    </View>
                    <View style={[styles.progressTrack, isDarkTheme && styles.progressTrackDark]}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progressPct}%` },
                            ]}
                        />
                    </View>

                    {getCategory(currentItem) ? (
                        <Text style={[styles.categoryBadge, isDarkTheme && styles.categoryBadgeDark]}>
                            {getCategory(currentItem)}
                        </Text>
                    ) : null}

                    <View style={[styles.questionCard, isDarkTheme && styles.questionCardDark]}>
                        <Text style={[styles.questionText, isDarkTheme && styles.textPrimaryDark]}>
                            {getQuestionText(currentItem, currentIndex, t)}
                        </Text>
                    </View>

                    <View style={styles.options}>
                        {options.map((option, index) => (
                            <OptionButton
                                disabled={Boolean(selected)}
                                index={index}
                                isDarkTheme={isDarkTheme}
                                item={currentItem}
                                key={`${getItemId(currentItem, currentIndex)}-${option.key}`}
                                onPress={() => answerCurrent(option)}
                                option={option}
                                selected={selected}
                            />
                        ))}
                    </View>

                    {selected ? (
                        <View
                            style={[
                                styles.explanationCard,
                                isDarkTheme && styles.explanationCardDark,
                                getSelectedCorrect(currentItem, selected)
                                    ? (isDarkTheme ? styles.explanationCorrectDark : styles.explanationCorrect)
                                    : (isDarkTheme ? styles.explanationWrongDark : styles.explanationWrong),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.explanationTitle,
                                    getSelectedCorrect(currentItem, selected)
                                        ? (isDarkTheme ? styles.explanationTitleCorrectDark : styles.explanationTitleCorrect)
                                        : (isDarkTheme ? styles.explanationTitleWrongDark : styles.explanationTitleWrong),
                                ]}
                            >
                                {getSelectedCorrect(currentItem, selected)
                                    ? t("explore.quiz.answerCorrect")
                                    : t("explore.quiz.answerWrong")}
                            </Text>
                            {getExplanation(currentItem) ? (
                                <Text style={[styles.explanationText, isDarkTheme && styles.explanationTextDark]}>
                                    {getExplanation(currentItem)}
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    {selected ? (
                        <Pressable
                            accessibilityRole='button'
                            onPress={goNext}
                            style={[styles.primaryButton, isDarkTheme && styles.primaryButtonDark]}
                        >
                            <Text style={styles.primaryButtonText}>
                                {currentIndex + 1 >= total
                                    ? t("explore.quiz.viewResult")
                                    : t("explore.quiz.next")}
                            </Text>
                        </Pressable>
                    ) : null}
                </>
            ) : null}

            {!loading && total && done ? (
                <View style={[styles.resultCard, isDarkTheme && styles.resultCardDark]}>
                    <View style={[styles.resultIcon, isDarkTheme && styles.resultIconDark]}>
                        <Brain color={isDarkTheme ? "#34d399" : "#047857"} size={36} strokeWidth={2.2} />
                    </View>
                    <Text style={[styles.resultTitle, isDarkTheme && styles.textPrimaryDark]}>
                        {t("explore.quiz.finished")}
                    </Text>
                    <Text style={[styles.resultScore, isDarkTheme && styles.resultScoreDark]}>
                        {score}
                        <Text style={[styles.resultTotal, isDarkTheme && styles.textMutedDark]}>/{total}</Text>
                    </Text>
                    <View style={[styles.resultTrack, isDarkTheme && styles.resultTrackDark]}>
                        <View
                            style={[
                                styles.resultFill,
                                {
                                    width: `${total ? Math.round((score / total) * 100) : 0}%`,
                                },
                            ]}
                        />
                    </View>
                    <Text style={[styles.resultText, isDarkTheme && styles.textMutedDark]}>
                        {t("explore.quiz.percentCorrect", {
                            percent: total
                                ? Math.round((score / total) * 100)
                                : 0,
                        })}
                    </Text>
                    <View style={styles.resultRows}>
                        {items.map((item, index) => (
                            <ResultRow
                                answer={answers[getItemId(item, index)]}
                                index={index}
                                isDarkTheme={isDarkTheme}
                                item={item}
                                key={getItemId(item, index)}
                                t={t}
                            />
                        ))}
                    </View>
                    <Pressable
                        accessibilityRole='button'
                        onPress={restart}
                        style={[styles.primaryButton, isDarkTheme && styles.primaryButtonDark]}
                    >
                        <RotateCcw
                            color='#ffffff'
                            size={16}
                            strokeWidth={2.2}
                        />
                        <Text style={styles.primaryButtonText}>
                            {t("explore.quiz.restart")}
                        </Text>
                    </Pressable>
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
        marginBottom: spacing.md,
    },
    categoryScroll: {
        flexGrow: 0,
        marginBottom: spacing.md,
    },
    categoryScrollContent: {
        gap: spacing.xs,
        paddingBottom: 2,
    },
    categoryPill: {
        backgroundColor: "#f1f5f9",
        borderColor: "#e2e8f0",
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 36,
        justifyContent: "center",
        paddingHorizontal: spacing.sm + 4,
        paddingVertical: spacing.xs,
    },
    categoryPillDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    categoryPillActive: {
        backgroundColor: "#047857",
        borderColor: "#047857",
    },
    categoryPillActiveDark: {
        backgroundColor: "#065f46",
        borderColor: "#059669",
    },
    categoryPillText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "700",
    },
    categoryPillTextDark: {
        color: "#94a3b8",
    },
    categoryPillTextActive: {
        color: "#ffffff",
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
    subtitleDark: {
        color: "#94a3b8",
    },
    progressHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    progressLabel: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "900",
    },
    progressScore: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
    },
    progressScoreDark: {
        color: "#34d399",
    },
    progressTrack: {
        backgroundColor: "#e5e7eb",
        borderRadius: 999,
        height: 8,
        marginBottom: spacing.md,
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
    categoryBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#d1fae5",
        borderRadius: 999,
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        textTransform: "capitalize",
    },
    categoryBadgeDark: {
        backgroundColor: "rgba(6, 78, 59, 0.35)",
        color: "#6ee7b7",
    },
    questionCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    questionCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    questionText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
        lineHeight: 24,
    },
    options: {
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    optionButton: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 54,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    optionButtonDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    optionCorrect: {
        backgroundColor: "#ecfdf5",
        borderColor: "#10b981",
    },
    optionCorrectDark: {
        backgroundColor: "rgba(6, 78, 59, 0.35)",
        borderColor: "#10b981",
    },
    optionWrong: {
        backgroundColor: "#fef2f2",
        borderColor: "#f87171",
    },
    optionWrongDark: {
        backgroundColor: "rgba(127, 29, 29, 0.35)",
        borderColor: "#f87171",
    },
    optionMuted: {
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        opacity: 0.72,
    },
    optionMutedDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
        opacity: 0.6,
    },
    optionLetter: {
        backgroundColor: "#f3f4f6",
        borderRadius: 14,
        color: "#64748b",
        fontSize: 12,
        fontWeight: "900",
        height: 28,
        lineHeight: 28,
        overflow: "hidden",
        textAlign: "center",
        width: 28,
    },
    optionLetterDark: {
        backgroundColor: "#1e293b",
        color: "#cbd5e1",
    },
    optionText: {
        color: "#374151",
        flex: 1,
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 19,
    },
    optionTextDark: {
        color: "#e2e8f0",
    },
    optionTextCorrect: {
        color: "#047857",
    },
    optionTextWrong: {
        color: "#dc2626",
    },
    optionTextMuted: {
        color: "#94a3b8",
    },
    explanationCard: {
        borderRadius: radius.md,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    explanationCardDark: {
        borderWidth: 1,
    },
    explanationCorrect: {
        backgroundColor: "#ecfdf5",
    },
    explanationCorrectDark: {
        backgroundColor: "rgba(6, 78, 59, 0.3)",
        borderColor: "#059669",
    },
    explanationWrong: {
        backgroundColor: "#fef2f2",
    },
    explanationWrongDark: {
        backgroundColor: "rgba(127, 29, 29, 0.3)",
        borderColor: "#991b1b",
    },
    explanationTitle: {
        fontSize: 13,
        fontWeight: "900",
        marginBottom: 3,
    },
    explanationTitleCorrect: {
        color: "#047857",
    },
    explanationTitleCorrectDark: {
        color: "#34d399",
    },
    explanationTitleWrong: {
        color: "#dc2626",
    },
    explanationTitleWrongDark: {
        color: "#f87171",
    },
    explanationText: {
        color: "#475569",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
    },
    explanationTextDark: {
        color: "#cbd5e1",
    },
    primaryButton: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    primaryButtonDark: {
        backgroundColor: "#059669",
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    stateCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        gap: spacing.sm,
        minHeight: 160,
        justifyContent: "center",
        padding: spacing.lg,
    },
    stateCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    stateText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
    },
    emptyCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        minHeight: 260,
        justifyContent: "center",
        padding: spacing.lg,
    },
    emptyCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    emptyIcon: {
        alignItems: "center",
        backgroundColor: "#ede9fe",
        borderRadius: 28,
        height: 56,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 56,
    },
    emptyIconDark: {
        backgroundColor: "#2e1065",
    },
    emptyTitle: {
        color: "#111827",
        fontSize: 20,
        fontWeight: "900",
    },
    emptyText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginBottom: spacing.lg,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    resultCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.xl,
        borderWidth: 1,
        padding: spacing.lg,
    },
    resultCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    resultIcon: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: 32,
        height: 64,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 64,
    },
    resultIconDark: {
        backgroundColor: "#064e3b",
    },
    resultTitle: {
        color: "#111827",
        fontSize: 20,
        fontWeight: "900",
    },
    resultScore: {
        color: "#047857",
        fontSize: 58,
        fontWeight: "900",
        lineHeight: 66,
        marginTop: spacing.sm,
    },
    resultScoreDark: {
        color: "#34d399",
    },
    resultTotal: {
        color: "#94a3b8",
        fontSize: 28,
        fontWeight: "900",
    },
    resultTrack: {
        backgroundColor: "#e5e7eb",
        borderRadius: 999,
        height: 10,
        marginTop: spacing.md,
        overflow: "hidden",
        width: "100%",
    },
    resultTrackDark: {
        backgroundColor: "#1e293b",
    },
    resultFill: {
        backgroundColor: "#10b981",
        borderRadius: 999,
        height: "100%",
    },
    resultText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
        marginTop: spacing.sm,
    },
    resultRows: {
        alignSelf: "stretch",
        gap: spacing.sm,
        marginVertical: spacing.lg,
    },
    resultRow: {
        alignItems: "center",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: spacing.sm,
        padding: spacing.sm,
    },
    resultRowDark: {
        borderWidth: 1,
    },
    resultRowCorrect: {
        backgroundColor: "#ecfdf5",
    },
    resultRowCorrectDark: {
        backgroundColor: "rgba(6, 78, 59, 0.35)",
        borderColor: "#059669",
    },
    resultRowWrong: {
        backgroundColor: "#fef2f2",
    },
    resultRowWrongDark: {
        backgroundColor: "rgba(127, 29, 29, 0.35)",
        borderColor: "#991b1b",
    },
    resultRowText: {
        flex: 1,
        fontSize: 12,
        fontWeight: "800",
    },
    resultRowTextCorrect: {
        color: "#047857",
    },
    resultRowTextCorrectDark: {
        color: "#34d399",
    },
    resultRowTextWrong: {
        color: "#dc2626",
    },
    resultRowTextWrongDark: {
        color: "#f87171",
    },
    textPrimaryDark: {
        color: "#f8fafc",
    },
    textMutedDark: {
        color: "#94a3b8",
    },
});
