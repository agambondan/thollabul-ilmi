"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";
import { forumApi } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BsChatDots, BsPlusLg, BsSearch } from "react-icons/bs";
import { MdQuestionAnswer } from "react-icons/md";

export function ForumListContent({ basePath = "/forum" }) {
    const { t, lang } = useLocale();
    const [questions, setQuestions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const size = 20;

    const fetchQuestions = useCallback(
        (p) => {
            setLoading(true);
            forumApi
                .list({ page: String(p), size: String(size), q: search })
                .then((r) => r.json())
                .then((d) => {
                    setQuestions(d?.items ?? []);
                    setTotal(d?.total ?? 0);
                })
                .catch((e) => console.error(e))
                .finally(() => setLoading(false));
        },
        [search],
    );

    useEffect(() => {
        fetchQuestions(page);
    }, [page, fetchQuestions]);

    const totalPages = Math.ceil(total / size);

    const formatDate = (v) => {
        if (!v) return "";
        try {
            return new Date(v).toLocaleDateString(
                lang === "EN" ? "en-US" : "id-ID",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                },
            );
        } catch {
            return "";
        }
    };

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                    <MdQuestionAnswer className='text-3xl text-emerald-700 dark:text-emerald-400' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1'>
                    {t("forum.title") ?? "Forum Diskusi"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("forum.subtitle") ?? "Tanya jawab seputar Islam"}
                </p>
            </div>

            <div className='flex items-center gap-2 mb-4'>
                <div className='flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 px-3 py-2'>
                    <BsSearch className='text-gray-400 shrink-0' />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === "Enter" && (setPage(1), fetchQuestions(1))
                        }
                        placeholder={
                            t("forum.search_placeholder") ??
                            "Cari pertanyaan..."
                        }
                        className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                    />
                </div>
                <Link
                    href={`${basePath}/ask`}
                    className='flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors whitespace-nowrap'
                >
                    <BsPlusLg />
                    {t("forum.ask") ?? "Tanya"}
                </Link>
            </div>

            {loading ? (
                <div className='space-y-3'>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className='p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 animate-pulse'
                        >
                            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-3' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                        </div>
                    ))}
                </div>
            ) : questions.length === 0 ? (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <BsChatDots className='text-5xl text-gray-200 dark:text-slate-600 dark:text-slate-300 mx-auto mb-3' />
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-3'>
                        {t("forum.empty") ?? "Belum ada pertanyaan."}
                    </p>
                    <Link
                        href={`${basePath}/ask`}
                        className='inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors'
                    >
                        <BsPlusLg />
                        {t("forum.ask_first") ?? "Ajukan pertanyaan pertama"}
                    </Link>
                </div>
            ) : (
                <div className='space-y-3'>
                    {questions.map((q) => (
                        <Link
                            key={q.id}
                            href={`${basePath}/${q.slug}`}
                            className='block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors'
                        >
                            <h3 className='text-base font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2 line-clamp-2'>
                                {q.title}
                            </h3>
                            <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 line-clamp-2 mb-3'>
                                {q.body}
                            </p>
                            <div className='flex items-center gap-4 text-xs text-gray-400'>
                                <span className='flex items-center gap-1'>
                                    <BsChatDots />
                                    {q.answer_count ?? 0}
                                </span>
                                <span>
                                    {q.user?.name ?? q.user?.email ?? "..."}
                                </span>
                                <span>{formatDate(q.created_at)}</span>
                                {q.is_answered && (
                                    <span className='bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full'>
                                        {t("forum.answered") ?? "Terjawab"}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className='flex items-center justify-center gap-2 mt-6'>
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className='px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 dark:border-slate-700 text-sm disabled:opacity-40'
                    >
                        ← {t("common.prev") ?? "Prev"}
                    </button>
                    <span className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                        className='px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 dark:border-slate-700 text-sm disabled:opacity-40'
                    >
                        {t("common.next") ?? "Next"} →
                    </button>
                </div>
            )}
        </ContentWidth>
    );
}

export default function ForumListPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-navbar'>
                <ForumListContent />
            </div>
        </main>
    );
}
