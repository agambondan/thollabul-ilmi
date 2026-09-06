"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { quizApi } from "@/lib/api";
import { getLocalizedField, getLocalizedOption } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsCheckCircleFill, BsXCircleFill } from "react-icons/bs";
import { FaBrain } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";

const QUESTIONS_PER_ROUND = 10;

const normalizeQuestion = (q) => {
    let options = q?.options ?? [];
    if (typeof options === "string") {
        try {
            options = JSON.parse(options);
        } catch {
            options = [];
        }
    }
    if (!Array.isArray(options)) options = [];

    const answer = options.indexOf(q?.correct_answer);
    return {
        raw: q,
        ...q,
        options,
        answer:
            answer >= 0
                ? answer
                : Number(
                      q?.answer ??
                          q?.correct_answer_index ??
                          q?.correctAnswerIndex ??
                          0,
                  ),
    };
};

export default function QuizContent() {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [phase, setPhase] = useState("intro"); // intro | quiz | result
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [showExp, setShowExp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        try {
            setHistory(
                JSON.parse(
                    localStorage.getItem("tholabul_quiz_history") ?? "[]",
                ),
            );
        } catch {}
    }, []);

    const startQuiz = async () => {
        setIsLoading(true);
        setFetchError(false);
        try {
            const res = await quizApi.session({
                count: QUESTIONS_PER_ROUND,
                lang,
            });
            const data = await res.json();
            const items = data?.items ?? data ?? [];
            setQuestions(items.map(normalizeQuestion));
            setCurrent(0);
            setAnswers([]);
            setSelected(null);
            setShowExp(false);
            setPhase("quiz");
        } catch {
            setFetchError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (index) => {
        if (selected !== null) return;
        setSelected(index);
        setShowExp(true);
    };

    const nextQuestion = () => {
        const q = questions[current];
        const isCorrect = selected === q.answer;
        const newAnswers = [
            ...answers,
            {
                question_id: q.id,
                category: q.category,
                selected_answer: selected,
                is_correct: isCorrect,
            },
        ];
        setAnswers(newAnswers);
        setSelected(null);
        setShowExp(false);

        if (current + 1 < questions.length) {
            setCurrent((c) => c + 1);
        } else {
            // Save history
            const correctCount = newAnswers.filter((a) => a.is_correct).length;
            const entry = {
                date: new Date().toISOString(),
                score: correctCount,
                total: questions.length,
            };
            const updatedHist = [entry, ...history].slice(0, 10);
            setHistory(updatedHist);
            try {
                localStorage.setItem(
                    "tholabul_quiz_history",
                    JSON.stringify(updatedHist),
                );
            } catch {}

            // Submit to backend if logged in
            if (isAuthenticated) {
                quizApi.submit(newAnswers).catch((e) => console.error(e));
            }

            setPhase("result");
        }
    };

    const correctCount = answers.filter((a) => a.is_correct).length;
    const pct = questions.length
        ? Math.round((correctCount / questions.length) * 100)
        : 0;

    const resultRating = () => {
        if (pct === 100) return { emoji: "🏆", msg: t("quiz.result_perfect") };
        if (pct >= 80) return { emoji: "⭐", msg: t("quiz.result_great") };
        if (pct >= 60) return { emoji: "👍", msg: t("quiz.result_good") };
        if (pct >= 40) return { emoji: "📖", msg: t("quiz.result_learn_more") };
        return { emoji: "💪", msg: t("quiz.result_keep_learning") };
    };

    const q = questions[current];

    return (
        <ContentWidth compact='max-w-xl' className='px-4 py-4'>
            {/* Header */}
            <div className='mb-6 text-center'>
                <div className='inline-flex items-center justify-center w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-3'>
                    <FaBrain className='text-2xl text-emerald-700 dark:text-emerald-400' />
                </div>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("quiz.title")}
                </h1>
            </div>

            {/* INTRO PHASE */}
            {phase === "intro" && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 text-center shadow-sm'>
                    <p className='text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed'>
                        {t("quiz.intro_desc_prefix")} {QUESTIONS_PER_ROUND}{" "}
                        {t("quiz.intro_desc_suffix")}
                    </p>
                    <p className='text-xs text-gray-400 mb-6'>
                        {t("quiz.random_each_session")}
                    </p>

                    {fetchError && (
                        <p className='text-rose-600 dark:text-rose-400 text-xs mb-4'>
                            {t("quiz.load_error")}
                        </p>
                    )}

                    <button
                        onClick={startQuiz}
                        disabled={isLoading}
                        className='w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-emerald-200 dark:shadow-none'
                    >
                        {isLoading ? t("common.loading") : t("quiz.start")}
                    </button>

                    {history.length > 0 && (
                        <div className='mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 text-left'>
                            <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3'>
                                {t("quiz.history") ?? "Riwayat Terakhir"}
                            </p>
                            <div className='space-y-2'>
                                {history.slice(0, 3).map((h, i) => (
                                    <div
                                        key={i}
                                        className='flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-750 px-3 py-2 rounded-lg'
                                    >
                                        <span>
                                            {new Date(h.date).toLocaleDateString(
                                                lang === "ID" ? "id-ID" : "en-US",
                                                {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                },
                                            )}
                                        </span>
                                        <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                                            {h.score}/{h.total} (
                                            {Math.round((h.score / h.total) * 100)}
                                            %)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* QUIZ PHASE */}
            {phase === "quiz" && q && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm'>
                    {/* Progress */}
                    <div className='flex items-center justify-between text-xs text-gray-400 mb-2'>
                        <span>
                            {t("quiz.question")} {current + 1} /{" "}
                            {questions.length}
                        </span>
                        <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                            {answers.filter((a) => a.is_correct).length}{" "}
                            {t("quiz.correct")}
                        </span>
                    </div>
                    <div className='w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 mb-6 overflow-hidden'>
                        <div
                            className='bg-emerald-600 h-1.5 rounded-full transition-all duration-300'
                            style={{
                                width: `${((current + 1) / questions.length) * 100}%`,
                            }}
                        />
                    </div>

                    {/* Question text */}
                    <p className='text-gray-900 dark:text-gray-100 font-semibold text-base mb-6 leading-relaxed'>
                        {getLocalizedField(q, "question", lang) || q.question}
                    </p>

                    {/* Options */}
                    <div className='space-y-3 mb-6'>
                        {q.options.map((option, idx) => {
                            let btnStyle =
                                "border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200";
                            if (selected !== null) {
                                if (idx === q.answer) {
                                    btnStyle =
                                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold";
                                } else if (idx === selected) {
                                    btnStyle =
                                        "border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300";
                                } else {
                                    btnStyle =
                                        "border-gray-100 dark:border-slate-700/50 opacity-40 text-gray-400";
                                }
                            }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selected !== null}
                                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                                >
                                    <span>
                                        {getLocalizedOption(option, lang)}
                                    </span>
                                    {selected !== null && idx === q.answer && (
                                        <BsCheckCircleFill className='text-emerald-600 dark:text-emerald-400 shrink-0' />
                                    )}
                                    {selected !== null &&
                                        idx === selected &&
                                        idx !== q.answer && (
                                            <BsXCircleFill className='text-rose-500 shrink-0' />
                                        )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {showExp && (
                        <div
                            className={`p-4 rounded-xl text-xs mb-6 ${
                                selected === q.answer
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                            }`}
                        >
                            <p className='font-semibold mb-1'>
                                {selected === q.answer
                                    ? `✅ ${t("quiz.correct_answer")}`
                                    : `❌ ${t("quiz.wrong_answer")} ${getLocalizedOption(q.options[q.answer], lang)}`}
                            </p>
                            {(getLocalizedField(q, "explanation", lang) ||
                                q.explanation) && (
                                <p className='mt-1 opacity-90 leading-relaxed'>
                                    {getLocalizedField(q, "explanation", lang) ||
                                        q.explanation}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Next button */}
                    {selected !== null && (
                        <button
                            onClick={nextQuestion}
                            className='w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors'
                        >
                            {current + 1 < questions.length
                                ? t("quiz.next_question")
                                : t("quiz.see_result")}
                        </button>
                    )}
                </div>
            )}

            {/* RESULT PHASE */}
            {phase === "result" && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center shadow-sm'>
                    <div className='text-5xl mb-3'>{resultRating().emoji}</div>
                    <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-1'>
                        {t("quiz.finished")}
                    </h2>
                    <p className='text-xs text-gray-400 mb-6'>
                        {resultRating().msg}
                    </p>

                    <div className='inline-flex items-baseline gap-1 text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1'>
                        <span>{pct}%</span>
                    </div>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mb-8'>
                        {correctCount} / {questions.length} {t("quiz.correct")}
                    </p>

                    <button
                        onClick={startQuiz}
                        disabled={isLoading}
                        className='w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2'
                    >
                        <MdRefresh className='text-lg' />
                        <span>
                            {isLoading ? t("common.loading") : t("quiz.retry")}
                        </span>
                    </button>
                </div>
            )}
        </ContentWidth>
    );
}
