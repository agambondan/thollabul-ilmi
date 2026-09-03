import { Brain, CheckCircle2, RotateCcw, XCircle } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { radius, spacing } from "../../theme";
import { quizOptions } from "../ExploreScreen.helpers";

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

function OptionButton({ disabled, index, item, onPress, option, selected }) {
    const correct = isCorrectOption(item, option, index);
    const isSelected = selected?.key === option.key;
    const answered = Boolean(selected);
    const stateStyle = !answered
        ? null
        : correct
          ? styles.optionCorrect
          : isSelected
            ? styles.optionWrong
            : styles.optionMuted;
    const textStyle = !answered
        ? null
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
            <Text style={[styles.optionLetter, textStyle]}>{option.key}</Text>
            <Text style={[styles.optionText, textStyle]}>{option.label}</Text>
            {answered && correct ? (
                <CheckCircle2 color='#047857' size={18} strokeWidth={2.3} />
            ) : null}
            {answered && isSelected && !correct ? (
                <XCircle color='#dc2626' size={18} strokeWidth={2.3} />
            ) : null}
        </Pressable>
    );
}

function ResultRow({ answer, index, item, t }) {
    const correct = getSelectedCorrect(item, answer);
    return (
        <View
            style={[
                styles.resultRow,
                correct ? styles.resultRowCorrect : styles.resultRowWrong,
            ]}
        >
            {correct ? (
                <CheckCircle2 color='#047857' size={17} strokeWidth={2.2} />
            ) : (
                <XCircle color='#dc2626' size={17} strokeWidth={2.2} />
            )}
            <Text
                numberOfLines={1}
                style={[
                    styles.resultRowText,
                    correct
                        ? styles.resultRowTextCorrect
                        : styles.resultRowTextWrong,
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
    error,
    items = [],
    loading,
    onRestart,
    scoreQuiz,
    setAnswers = () => {},
}) {
    const { t } = useMobileLocale();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [done, setDone] = useState(false);
    const total = items.length;
    const currentItem = items[currentIndex];
    const selected = currentItem
        ? answers[getItemId(currentItem, currentIndex)]
        : null;
    const options = useMemo(() => parseOptions(currentItem), [currentItem]);
    const score =
        typeof scoreQuiz === "function"
            ? scoreQuiz()
            : items.reduce(
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
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-quiz-surface' />

            {loading ? (
                <View style={styles.stateCard}>
                    <ActivityIndicator color='#047857' size='small' />
                    <Text style={styles.stateText}>
                        {t("explore.quiz.loading")}
                    </Text>
                </View>
            ) : null}

            {!loading && !total ? (
                <View style={styles.emptyCard}>
                    <View style={styles.emptyIcon}>
                        <Brain color='#7c3aed' size={34} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {t("explore.quiz.title")}
                    </Text>
                    <Text style={styles.emptyText}>
                        {error || t("explore.quiz.emptyText")}
                    </Text>
                    <Pressable onPress={restart} style={styles.primaryButton}>
                        accessibilityRole='button'
                        <Text style={styles.primaryButtonText}>
                            {t("explore.quiz.retry")}
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            {!loading && total && !done ? (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {t("explore.quiz.title")}
                        </Text>
                        <Text style={styles.subtitle}>
                            {t("explore.quiz.subtitle")}
                        </Text>
                    </View>

                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>
                            {t("explore.quiz.progressLabel", {
                                current: currentIndex + 1,
                                total,
                            })}
                        </Text>
                        <Text style={styles.progressScore}>
                            {t("explore.quiz.scoreCorrect", { score })}
                        </Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progressPct}%` },
                            ]}
                        />
                    </View>

                    {getCategory(currentItem) ? (
                        <Text style={styles.categoryBadge}>
                            {getCategory(currentItem)}
                        </Text>
                    ) : null}

                    <View style={styles.questionCard}>
                        <Text style={styles.questionText}>
                            {getQuestionText(currentItem, currentIndex, t)}
                        </Text>
                    </View>

                    <View style={styles.options}>
                        {options.map((option, index) => (
                            <OptionButton
                                disabled={Boolean(selected)}
                                index={index}
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
                                getSelectedCorrect(currentItem, selected)
                                    ? styles.explanationCorrect
                                    : styles.explanationWrong,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.explanationTitle,
                                    getSelectedCorrect(currentItem, selected)
                                        ? styles.explanationTitleCorrect
                                        : styles.explanationTitleWrong,
                                ]}
                            >
                                {getSelectedCorrect(currentItem, selected)
                                    ? t("explore.quiz.answerCorrect")
                                    : t("explore.quiz.answerWrong")}
                            </Text>
                            {getExplanation(currentItem) ? (
                                <Text style={styles.explanationText}>
                                    {getExplanation(currentItem)}
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    {selected ? (
                        <Pressable
                            accessibilityRole='button'
                            onPress={goNext}
                            style={styles.primaryButton}
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
                <View style={styles.resultCard}>
                    <View style={styles.resultIcon}>
                        <Brain color='#047857' size={36} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.resultTitle}>
                        {t("explore.quiz.finished")}
                    </Text>
                    <Text style={styles.resultScore}>
                        {score}
                        <Text style={styles.resultTotal}>/{total}</Text>
                    </Text>
                    <View style={styles.resultTrack}>
                        <View
                            style={[
                                styles.resultFill,
                                {
                                    width: `${total ? Math.round((score / total) * 100) : 0}%`,
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.resultText}>
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
                                item={item}
                                key={getItemId(item, index)}
                                t={t}
                            />
                        ))}
                    </View>
                    <Pressable onPress={restart} style={styles.primaryButton}>
                        accessibilityRole='button'
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
        marginTop: 3,
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
    progressTrack: {
        backgroundColor: "#e5e7eb",
        borderRadius: 999,
        height: 8,
        marginBottom: spacing.md,
        overflow: "hidden",
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
    questionCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.lg,
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
    optionCorrect: {
        backgroundColor: "#ecfdf5",
        borderColor: "#10b981",
    },
    optionWrong: {
        backgroundColor: "#fef2f2",
        borderColor: "#f87171",
    },
    optionMuted: {
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        opacity: 0.72,
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
    optionText: {
        color: "#374151",
        flex: 1,
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 19,
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
    explanationCorrect: {
        backgroundColor: "#ecfdf5",
    },
    explanationWrong: {
        backgroundColor: "#fef2f2",
    },
    explanationTitle: {
        fontSize: 13,
        fontWeight: "900",
        marginBottom: 3,
    },
    explanationTitleCorrect: {
        color: "#047857",
    },
    explanationTitleWrong: {
        color: "#dc2626",
    },
    explanationText: {
        color: "#475569",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
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
    emptyIcon: {
        alignItems: "center",
        backgroundColor: "#ede9fe",
        borderRadius: 28,
        height: 56,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 56,
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
    resultIcon: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: 32,
        height: 64,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 64,
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
    resultRowCorrect: {
        backgroundColor: "#ecfdf5",
    },
    resultRowWrong: {
        backgroundColor: "#fef2f2",
    },
    resultRowText: {
        flex: 1,
        fontSize: 12,
        fontWeight: "800",
    },
    resultRowTextCorrect: {
        color: "#047857",
    },
    resultRowTextWrong: {
        color: "#dc2626",
    },
});
