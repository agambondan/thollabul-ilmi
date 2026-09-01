"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { forumApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import {
    BsArrowUp,
    BsCheckCircle,
    BsCheckCircleFill,
    BsChevronLeft,
    BsPlusLg,
    BsTrash,
} from "react-icons/bs";
import { MdQuestionAnswer } from "react-icons/md";

export const ForumDetailContent = ({
    slug,
    basePath = "/forum",
    loginNext = `${basePath}/${slug}`,
}) => {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answerBody, setAnswerBody] = useState("");
    const [answering, setAnswering] = useState(false);

    const fetchQuestion = () => {
        setLoading(true);
        forumApi
            .get(slug)
            .then((r) => r.json())
            .then((d) => setQuestion(d))
            .catch(() => setQuestion(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchQuestion();
    }, [slug]);

    const formatDate = (v) => {
        if (!v) return "";
        try {
            return new Date(v).toLocaleDateString(
                lang === "EN" ? "en-US" : "id-ID",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                },
            );
        } catch {
            return "";
        }
    };

    const submitAnswer = async (e) => {
        e.preventDefault();
        if (!answerBody.trim() || answerBody.length < 10) return;
        setAnswering(true);
        try {
            await forumApi.answer(question.id, { body: answerBody.trim() });
            setAnswerBody("");
            fetchQuestion();
        } catch {}
        setAnswering(false);
    };

    const handleVote = async (targetType, targetId) => {
        try {
            await forumApi.vote({
                target_type: targetType,
                target_id: targetId,
                value: 1,
            });
            fetchQuestion();
        } catch {}
    };

    if (loading) {
        return (
            <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
                <div className='animate-pulse space-y-4'>
                    <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4' />
                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-full' />
                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                </div>
            </ContentWidth>
        );
    }

    if (!question) {
        return (
            <ContentWidth compact='max-w-3xl' className='px-4 py-6 text-center'>
                <p className='text-gray-500 dark:text-gray-400'>
                    {t("forum.not_found") ?? "Pertanyaan tidak ditemukan."}
                </p>
                <Link
                    href={basePath}
                    className='text-emerald-700 hover:underline text-sm mt-3 inline-block'
                >
                    ← {t("forum.back") ?? "Kembali ke forum"}
                </Link>
            </ContentWidth>
        );
    }

    const answers = question.answers || [];
    const tags = question.tags
        ? question.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
        : [];

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='mb-6'>
                <Link
                    href={basePath}
                    className='inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-700 mb-4'
                >
                    <BsChevronLeft /> {t("forum.back") ?? "Kembali ke forum"}
                </Link>

                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6'>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                        {question.title}
                    </h1>
                    <div className='prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap'>
                        {question.body}
                    </div>
                    <div className='flex items-center gap-3 text-xs text-gray-400 mb-3 flex-wrap'>
                        <span>
                            {question.user?.name ||
                                question.user?.email ||
                                "Anonim"}
                        </span>
                        <span>{formatDate(question.created_at)}</span>
                        <button
                            onClick={() => handleVote("question", question.id)}
                            className='flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium'
                        >
                            <BsArrowUp /> {question.vote_count || 0}
                        </button>
                    </div>
                    {tags.length > 0 && (
                        <div className='flex flex-wrap gap-1'>
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className='px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs'
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className='mb-6'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                    {answers.length} {t("forum.answers") ?? "Jawaban"}
                </h2>

                {answers.length === 0 && (
                    <div className='text-center py-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                        <p className='text-sm text-gray-400'>
                            {t("forum.no_answers") ??
                                "Belum ada jawaban. Jadilah yang pertama menjawab!"}
                        </p>
                    </div>
                )}

                <div className='space-y-3'>
                    {answers.map((a) => (
                        <div
                            key={a.id}
                            className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 ${a.is_accepted ? "border-emerald-300 dark:border-emerald-700" : "border-gray-100 dark:border-slate-700"}`}
                        >
                            <div className='prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap'>
                                {a.body}
                            </div>
                            <div className='flex items-center gap-3 text-xs text-gray-400 flex-wrap'>
                                <span>
                                    {a.user?.name || a.user?.email || "Anonim"}
                                </span>
                                <span>{formatDate(a.created_at)}</span>
                                <button
                                    onClick={() => handleVote("answer", a.id)}
                                    className='flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium'
                                >
                                    <BsArrowUp /> {a.vote_count || 0}
                                </button>
                                {a.is_accepted ? (
                                    <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
                                        <BsCheckCircleFill />{" "}
                                        {t("forum.accepted") ?? "Diterima"}
                                    </span>
                                ) : (
                                    isAuthenticated && (
                                        <button
                                            onClick={async () => {
                                                await forumApi.acceptAnswer(
                                                    question.id,
                                                    a.id,
                                                );
                                                fetchQuestion();
                                            }}
                                            className='flex items-center gap-1 text-gray-400 hover:text-emerald-600'
                                        >
                                            <BsCheckCircle />{" "}
                                            {t("forum.accept") ?? "Terima"}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isAuthenticated && (
                <form
                    onSubmit={submitAnswer}
                    className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6'
                >
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
                        {t("forum.your_answer") ?? "Jawaban Kamu"}
                    </h3>
                    <textarea
                        value={answerBody}
                        onChange={(e) => setAnswerBody(e.target.value)}
                        rows={4}
                        placeholder={
                            t("forum.answer_placeholder") ??
                            "Tulis jawaban kamu..."
                        }
                        className='w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3'
                    />
                    <button
                        type='submit'
                        disabled={answering || answerBody.length < 10}
                        className='flex items-center gap-2 px-5 py-2 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors'
                    >
                        <BsPlusLg />
                        {answering
                            ? (t("common.saving") ?? "Mengirim...")
                            : (t("forum.post_answer") ?? "Kirim Jawaban")}
                    </button>
                </form>
            )}

            {!isAuthenticated && (
                <div className='text-center py-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <Link
                        href={`/auth/login?next=${encodeURIComponent(loginNext)}`}
                        className='text-sm text-emerald-700 hover:underline'
                    >
                        {t("forum.login_to_answer") ?? "Login untuk menjawab"}
                    </Link>
                </div>
            )}
        </ContentWidth>
    );
};

export default function ForumDetailPageWrapper(props) {
    const params = use(props.params);

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-navbar'>
                <ForumDetailContent slug={params.slug} />
            </div>
        </main>
    );
}
