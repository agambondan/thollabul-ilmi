"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import { useLocale } from "@/context/Locale";
import { getLocalizedField, getLocalizedOption } from "@/lib/translation";
import { useState } from "react";
import { BsCheckCircleFill, BsXCircleFill } from "react-icons/bs";
import { FaBrain } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";

const QUESTIONS_PER_ROUND = 10;

const normalizeQuestion = (q) => {
    const options =
        typeof q.options === "string"
            ? JSON.parse(q.options)
            : (q.options ?? []);
    const answer = options.indexOf(q.correct_answer);
    return {
        raw: q,
        options,
        answer:
            answer >= 0
                ? answer
                : Number(
                      q.answer ??
                          q.correct_answer_index ??
                          q.correctAnswerIndex ??
                          0,
                  ),
    };
};

export default function QuizPage() {
    const { t, lang } = useLocale();
    const [phase, setPhase] = useState("intro"); // intro | quiz | result
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [showExp, setShowExp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const startQuiz = async () => {
        setIsLoading(true);
        setFetchError(false);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/quiz/session?count=${QUESTIONS_PER_ROUND}`,
            );
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

    const handleAnswer = (idx) => {
        if (selected !== null) return;
        setSelected(idx);
        setShowExp(true);
    };

    const nextQuestion = () => {
        const q = questions[current];
        setAnswers((prev) => [
            ...prev,
            { correct: selected === q.answer, selected, answer: q.answer },
        ]);
        if (current + 1 >= questions.length) {
            setPhase("result");
        } else {
            setCurrent((c) => c + 1);
            setSelected(null);
            setShowExp(false);
        }
    };

    const score = answers.filter((a) => a.correct).length;
    const pct = Math.round((score / questions.length) * 100);

    const resultMessage = () => {
        if (pct === 100) return { emoji: "🏆", msg: t("quiz.result_perfect") };
        if (pct >= 80) return { emoji: "⭐", msg: t("quiz.result_great") };
        if (pct >= 60) return { emoji: "👍", msg: t("quiz.result_good") };
        if (pct >= 40) return { emoji: "📖", msg: t("quiz.result_learn_more") };
        return { emoji: "💪", msg: t("quiz.result_keep_learning") };
    };

    if (phase === "intro") {
        return (
            <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
                <NavbarTailwindCss />
                <ContentWidth
                    compact='max-w-lg'
                    className='flex-1 px-4 pt-24 pb-8 text-center'
                >
                    <div className='inline-flex items-center justify-center w-20 h-20 bg-purple-100 dark:bg-purple-900/40 rounded-3xl mb-6'>
                        <FaBrain className='text-4xl text-purple-600 dark:text-purple-400' />
                    </div>
                    <h1 className='text-4xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-3'>
                        {t("quiz.title")}
                    </h1>
                    <p className='text-gray-500 dark:text-gray-400 mb-3 text-sm max-w-sm mx-auto'>
                        {t("quiz.intro_desc_prefix")} {QUESTIONS_PER_ROUND}{" "}
                        {t("quiz.intro_desc_suffix")}
                    </p>
                    <p className='text-xs text-gray-400 mb-8'>
                        {t("quiz.random_each_session")}
                    </p>
                    {fetchError && (
                        <p className='text-sm text-red-500 dark:text-red-400 mb-4'>
                            {t("quiz.load_error")}
                        </p>
                    )}
                    <button
                        onClick={startQuiz}
                        disabled={isLoading}
                        className='bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-10 py-4 rounded-2xl font-extrabold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    >
                        {isLoading ? t("common.loading") : t("quiz.start")}
                    </button>
                </ContentWidth>
                <Footer />
            </main>
        );
    }

    if (phase === "result") {
        const { emoji, msg } = resultMessage();
        return (
            <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
                <NavbarTailwindCss />
                <ContentWidth
                    compact='max-w-lg'
                    className='flex-1 px-3 sm:px-4 pt-20 sm:pt-24 pb-8 text-center'
                >
                    <div className='text-5xl sm:text-7xl mb-3 sm:mb-4'>
                        {emoji}
                    </div>
                    <h2 className='text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-2'>
                        {t("quiz.finished")}
                    </h2>
                    <p className='text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6'>
                        {msg}
                    </p>

                    <div className='bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700 mb-5 sm:mb-6'>
                        <p className='inline-flex items-end justify-center gap-1 text-5xl sm:text-7xl font-extrabold text-emerald-700 dark:text-emerald-300 mb-2'>
                            <span>{score}</span>
                            <span className='text-xl sm:text-3xl text-gray-400 mb-1'>
                                /{questions.length}
                            </span>
                        </p>
                        <div className='w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 mb-3 overflow-hidden'>
                            <div
                                className='h-3 rounded-full bg-emerald-500 transition-all duration-700'
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className='text-gray-500 dark:text-gray-400 text-sm'>
                            {pct}% {t("quiz.correct")}
                        </p>
                    </div>

                    <div className='space-y-2 text-left mb-6 sm:mb-8 max-h-[45vh] overflow-y-auto pr-1'>
                        {answers.map((a, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm ${
                                    a.correct
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
                                        : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                                }`}
                            >
                                {a.correct ? (
                                    <BsCheckCircleFill className='flex-shrink-0 mt-0.5' />
                                ) : (
                                    <BsXCircleFill className='flex-shrink-0 mt-0.5' />
                                )}
                                <span className='min-w-0 whitespace-normal break-words leading-snug'>
                                    {getLocalizedField(
                                        questions[i].raw,
                                        "question",
                                        lang,
                                        ["question_text", "text", "title"],
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={startQuiz}
                        disabled={isLoading}
                        className='flex items-center justify-center gap-2 w-full sm:w-auto mx-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-8 py-3 rounded-2xl font-bold transition-all'
                    >
                        <MdRefresh />{" "}
                        {isLoading ? t("common.loading") : t("quiz.retry")}
                    </button>
                </ContentWidth>
                <Footer />
            </main>
        );
    }

    const q = questions[current];

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <NavbarTailwindCss />
            <ContentWidth compact='max-w-lg' className='flex-1 px-4 pt-24 pb-8'>
                {/* Progress */}
                <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-semibold text-gray-500 dark:text-gray-400'>
                        {t("quiz.question")} {current + 1} / {questions.length}
                    </span>
                    <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                        ✅ {answers.filter((a) => a.correct).length}{" "}
                        {t("quiz.correct")}
                    </span>
                </div>
                <div className='w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-6 overflow-hidden'>
                    <div
                        className='h-2 rounded-full bg-emerald-500 transition-all'
                        style={{
                            width: `${((current + 1) / questions.length) * 100}%`,
                        }}
                    />
                </div>

                {/* Question */}
                <div className='bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-5'>
                    <p className='text-lg font-bold text-gray-900 dark:text-white leading-snug'>
                        {getLocalizedField(q.raw, "question", lang, [
                            "question_text",
                            "text",
                            "title",
                        ])}
                    </p>
                </div>

                {/* Options */}
                <div className='space-y-3 mb-5'>
                    {q.options.map((opt, i) => {
                        let cls =
                            "w-full text-left px-5 py-3.5 rounded-2xl border text-sm font-semibold transition-all ";
                        if (selected === null) {
                            cls +=
                                "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20";
                        } else if (i === q.answer) {
                            cls +=
                                "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-800 dark:text-emerald-200";
                        } else if (i === selected) {
                            cls +=
                                "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-800 dark:text-red-300";
                        } else {
                            cls +=
                                "bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-500 opacity-60";
                        }
                        return (
                            <button
                                key={i}
                                className={cls}
                                onClick={() => handleAnswer(i)}
                            >
                                <span className='inline-block w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-xs font-extrabold text-center leading-6 mr-3'>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                {getLocalizedOption(opt, lang)}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                {showExp && (
                    <div
                        className={`p-4 rounded-2xl text-sm mb-5 ${
                            selected === q.answer
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
                                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                        }`}
                    >
                        <p className='font-bold mb-1'>
                            {selected === q.answer
                                ? `✅ ${t("quiz.correct_answer")}`
                                : `❌ ${t("quiz.wrong_answer")} ${getLocalizedOption(q.options[q.answer], lang)}`}
                        </p>
                        <p>{getLocalizedField(q.raw, "explanation", lang)}</p>
                    </div>
                )}

                {selected !== null && (
                    <button
                        onClick={nextQuestion}
                        className='w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold transition-all'
                    >
                        {current + 1 < questions.length
                            ? t("quiz.next_question")
                            : t("quiz.see_result")}
                    </button>
                )}
            </ContentWidth>
            <Footer />
        </main>
    );
}
