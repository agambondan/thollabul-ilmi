"use client";

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { sirohApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BsSearch } from "react-icons/bs";

const PAGE_SIZE = 20;

export default function SirohClient({ initialChapters = [], basePath = "/siroh" }) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [chapters, setChapters] = useState(initialChapters);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialChapters.length >= PAGE_SIZE);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const sentinelRef = useRef(null);

    const fetchPage = (pageNum, append) => {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);
        sirohApi
            .list(pageNum, PAGE_SIZE, lang)
            .then((r) => r.json())
            .then((data) => {
                const items = data?.items ?? data ?? [];
                setChapters((prev) => (append ? [...prev, ...items] : items));
                setHasMore(items.length >= PAGE_SIZE);
            })
            .catch(() => {
                if (!append) setChapters([]);
                setHasMore(false);
            })
            .finally(() => {
                if (append) setIsLoadingMore(false);
                else setIsLoading(false);
            });
    };

    const hasServerDataRef = useRef(initialChapters.length > 0);

    useEffect(() => {
        if (hasServerDataRef.current && lang === "ID") {
            hasServerDataRef.current = false;
            return;
        }
        hasServerDataRef.current = false;
        setPage(0);
        fetchPage(0, false);
    }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (page === 0) return;
        fetchPage(page, true);
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    hasMore &&
                    !isLoading &&
                    !isLoadingMore
                ) {
                    setPage((p) => p + 1);
                }
            },
            { rootMargin: "100px" },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasMore, isLoading, isLoadingMore]);

    const filteredChapters = chapters.filter((chapter) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
            getLocalizedField(chapter, "title", lang)
                .toLowerCase()
                .includes(query) ||
            getLocalizedField(chapter, "excerpt", lang)
                .toLowerCase()
                .includes(query) ||
            chapter.slug?.toLowerCase().includes(query)
        );
    });

    return (
        <div
            className={
                isWide
                    ? "w-full px-4"
                    : "container mx-auto px-4 max-w-3xl"
            }
        >
            <div className='text-center mb-8'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    السِّيرَةُ النَّبَوِيَّة
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("siroh.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("siroh.page_subtitle")}
                </p>
            </div>

            <div className='flex items-center gap-2 mb-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 px-3 py-2'>
                <BsSearch className='text-gray-400 shrink-0' />
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("siroh.search_placeholder")}
                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                />
            </div>

            {isLoading && <SkeletonInline rows={4} />}

            {!isLoading && chapters.length === 0 && (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <p
                        className='text-4xl text-emerald-300 dark:text-emerald-700 dark:text-emerald-400 mb-3'
                        style={{ fontFamily: "Amiri, serif" }}
                    >
                        سِيَرَة
                    </p>
                    <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400 font-medium mb-1'>
                        {t("siroh.empty_title")}
                    </p>
                    <p className='text-sm text-gray-400'>
                        {t("siroh.empty_hint")}
                    </p>
                </div>
            )}

            <div className='space-y-3'>
                {filteredChapters.map((chapter, index) => (
                    <Link
                        key={chapter.id}
                        href={`${basePath}/${chapter.slug ?? chapter.id}`}
                        className='flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all'
                    >
                        <span className='w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center justify-center shrink-0'>
                            {index + 1}
                        </span>
                        <div className='flex-1 min-w-0'>
                            <p className='font-semibold text-emerald-900 dark:text-emerald-300 dark:text-white text-sm truncate'>
                                {getLocalizedField(
                                    chapter,
                                    "title",
                                    lang,
                                )}
                            </p>
                            {getLocalizedField(
                                chapter,
                                "excerpt",
                                lang,
                            ) && (
                                <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5 truncate'>
                                    {getLocalizedField(
                                        chapter,
                                        "excerpt",
                                        lang,
                                    )}
                                </p>
                            )}
                        </div>
                        <span className='text-gray-300 dark:text-gray-600 dark:text-gray-300 text-sm'>
                            ›
                        </span>
                    </Link>
                ))}
            </div>

            {isLoadingMore && (
                <div className='flex justify-center py-6'>
                    <div className='w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                </div>
            )}

            <div ref={sentinelRef} className='h-1' />

            {!hasMore && chapters.length > 0 && !isLoading && (
                <p className='text-center text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300 py-4'>
                    {t("siroh.all_shown")}
                </p>
            )}

            {!isLoading &&
                filteredChapters.length === 0 &&
                chapters.length > 0 && (
                    <p className='text-center text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300 py-4'>
                        {t("siroh.no_search")}
                    </p>
                )}
        </div>
    );
}
