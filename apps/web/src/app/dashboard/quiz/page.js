"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { quizApi } from "@/lib/api";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField, getLocalizedOption } from "@/lib/translation";

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

// The API sends `options` as a JSON-encoded string and `correct_answer` as the
// answer text rather than an index, so questions have to be normalized before
// the UI can render or score them. Mirrors normalizeQuestion in app/quiz/page.js.
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

    const byText = options.indexOf(q?.correct_answer);
    const answer =
        byText >= 0
            ? byText
            : Number(q?.answer ?? q?.correct_answer_index ?? 0);

    return { ...q, options, answer };
};

const QuizPage = () => {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const { isWide } = useLayoutMode();
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [sessionResults, setSessionResults] = useState([]);

    useEffect(() => {
        try {
            setHistory(
                JSON.parse(
                    localStorage.getItem("tholabul_quiz_history") ?? "[]",
                ),
            );
        } catch {}
    }, []);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/quiz/session?count=10`,
            );
            const data = await res.json();
            const items =
                data?.data ?? data?.items ?? (Array.isArray(data) ? data : []);
            if (Array.isArray(items) && items.length > 0) {
                setQuestions(items.map(normalizeQuestion));
                setLoading(false);
                return;
            }
        } catch {}
        setQuestions([]);
        setLoading(false);
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    const restart = () => {
        setCurrent(0);
        setSelected(null);
        setScore(0);
        setDone(false);
        setSessionResults([]);
        loadQuestions();
    };

    const handleSelect = (idx) => {
        if (selected !== null) return;
        setSelected(idx);
        const correct = idx === Number(questions[current].answer);
        if (correct) setScore((s) => s + 1);
        setSessionResults((prev) => [
            ...prev,
            { question_id: questions[current].id, correct },
        ]);
    };

    const next = () => {
        if (current + 1 >= questions.length) {
            const entry = {
                id: Date.now().toString(),
                date: new Date().toISOString().slice(0, 10),
                score,
                total: questions.length,
                pct: Math.round((score / questions.length) * 100),
            };
            const updated = [entry, ...history].slice(0, 15);
            setHistory(updated);
            try {
                localStorage.setItem(
                    "tholabul_quiz_history",
                    JSON.stringify(updated),
                );
            } catch {}
            if (isAuthenticated && sessionResults.length > 0) {
                quizApi.submit(sessionResults).catch((e) => console.error(e));
            }
            setDone(true);
        } else {
            setCurrent((c) => c + 1);
            setSelected(null);
        }
    };

    if (loading) {
        return (
            <div
                className={
                    isWide
                        ? "px-4 py-16 text-center"
                        : "px-4 py-16 max-w-md mx-auto text-center"
                }
            >
                <p className='text-gray-400 text-sm'>{t("quiz.loading")}</p>
            </div>
        );
    }

    if (!questions.length) {
        return (
            <div
                className={
                    isWide
                        ? "px-4 py-16 text-center"
                        : "px-4 py-16 max-w-md mx-auto text-center"
                }
            >
                <p className='text-5xl mb-4'>📚</p>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-4'>
                    {t("quiz.empty")}
                </p>
                <button
                    onClick={loadQuestions}
                    className='px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors'
                >
                    {t("quiz.try_again")}
                </button>
            </div>
        );
    }

    if (done) {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div
                className={
                    isWide
                        ? "px-3 sm:px-4 py-6"
                        : "px-3 sm:px-4 py-6 max-w-md mx-auto"
                }
            >
                <h1 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4 sm:mb-6'>
                    {t("quiz.title")}
                </h1>
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 sm:p-8 text-center mb-5'>
                    <p className='text-4xl sm:text-5xl mb-3 sm:mb-4'>
                        {pct >= 80 ? "🌟" : pct >= 50 ? "👍" : "💪"}
                    </p>
                    <p className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1'>
                        {t("quiz.score")}: {score}/{questions.length}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-5 sm:mb-6'>
                        {pct}% {t("quiz.correct_pct")}
                    </p>
                    <button
                        onClick={restart}
                        className='w-full sm:w-auto px-6 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors'
                    >
                        {t("quiz.try_again")}
                    </button>
                </div>

                {history.length > 1 && (
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                        <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-3'>
                            {t("quiz.history")}
                        </p>
                        <ul className='space-y-2'>
                            {history.slice(0, 8).map((h) => (
                                <li
                                    key={h.id}
                                    className='flex flex-wrap items-center justify-between gap-2 text-sm'
                                >
                                    <span className='text-xs text-gray-400'>
                                        {new Date(
                                            h.date + "T00:00:00",
                                        ).toLocaleDateString(
                                            lang === "EN" ? "en-US" : "id-ID",
                                            {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            },
                                        )}
                                    </span>
                                    <span
                                        className={`font-semibold ${
                                            h.pct >= 80
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : h.pct >= 50
                                                  ? "text-amber-500 dark:text-amber-400"
                                                  : "text-gray-500 dark:text-gray-400"
                                        }`}
                                    >
                                        {h.score}/{h.total} ({h.pct}%)
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    const q = questions[current];
    const total = questions.length;
    const answerIndex = Number(q.answer);
    const options = q.options;

    return (
        <div className={isWide ? "px-4 py-6" : "px-4 py-6 max-w-md mx-auto"}>
            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4'>
                {t("quiz.title")}
            </h1>

            {/* Progress */}
            <div className='mb-4'>
                <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-1.5'>
                    <span>
                        {t("quiz.question_label")} {current + 1}/{total}
                    </span>
                    <span>{Math.round(((current + 1) / total) * 100)}%</span>
                </div>
                <div className='h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden'>
                    <div
                        className='h-full bg-emerald-500 rounded-full transition-all duration-300'
                        style={{ width: `${((current + 1) / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Category badge */}
            {q.category && (
                <span className='inline-block text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full mb-4 font-medium capitalize'>
                    {toStr(q.category)}
                </span>
            )}

            {/* Question */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4'>
                <p className='text-base font-semibold text-gray-800 dark:text-gray-200 dark:text-white leading-relaxed'>
                    {getLocalizedField(q, "question", lang, [
                        "question_text",
                        "text",
                        "title",
                    ])}
                </p>
            </div>

            {/* Options */}
            <div className='space-y-2 mb-5'>
                {options.map((opt, idx) => {
                    let cls =
                        "w-full px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-all ";
                    if (selected === null) {
                        cls +=
                            "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10";
                    } else if (idx === answerIndex) {
                        cls +=
                            "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400";
                    } else if (idx === selected && selected !== answerIndex) {
                        cls +=
                            "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400";
                    } else {
                        cls +=
                            "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400";
                    }
                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(idx)}
                            disabled={selected !== null}
                            className={cls}
                        >
                            <span className='mr-2 text-gray-400 font-normal'>
                                {String.fromCharCode(65 + idx)}.
                            </span>
                            {getLocalizedOption(opt, lang) || toStr(opt)}
                        </button>
                    );
                })}
            </div>

            {/* Next button */}
            {selected !== null && (
                <button
                    onClick={next}
                    className='w-full py-3 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-800 transition-colors'
                >
                    {current + 1 >= total
                        ? t("quiz.see_result")
                        : t("quiz.next")}
                </button>
            )}
        </div>
    );
};

export default QuizPage;
