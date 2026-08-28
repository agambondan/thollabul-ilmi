"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import classNames from "classnames";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";

const normalizeItems = (data) => data?.items ?? data ?? [];

const ByChapter = ({ basePath = "/hadith" }) => {
    const { t, lang } = useLocale();
    const router = useRouter();
    const [bookList, setBookList] = useState([]);
    const [selectedBookSlug, setSelectedBookSlug] = useState("");
    const [selectedThemeId, setSelectedThemeId] = useState("");
    const [themes, setThemes] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [isLoadingThemes, setIsLoadingThemes] = useState(true);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [isError, setIsError] = useState(false);

    const currentBook = useMemo(
        () => bookList.find((book) => book.slug === selectedBookSlug),
        [bookList, selectedBookSlug],
    );

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/books?size=20`)
            .then((res) => res.json())
            .then((data) => {
                const items = data?.items ?? [];
                setBookList(items);
                if (items.length > 0) setSelectedBookSlug(items[0].slug);
            })
            .catch(() => setIsError(true));
    }, []);

    const fetchThemes = async (bookSlug) => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/themes/book/${bookSlug}`,
        );
        return await res.json();
    };

    const fetchChapters = async (bookSlug, themeId) => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chapters/book/${bookSlug}/theme/${themeId}?size=10000`,
        );
        return await res.json();
    };

    useEffect(() => {
        if (!selectedBookSlug) return;

        let isActive = true;
        setIsLoadingThemes(true);
        setIsError(false);
        setThemes([]);
        setChapters([]);
        setSelectedThemeId("");

        fetchThemes(selectedBookSlug)
            .then((data) => {
                if (!isActive) return;

                const nextThemes = normalizeItems(data);
                setThemes(nextThemes);

                const firstThemeId = nextThemes?.[0]?.theme?.id ?? "";
                setSelectedThemeId(firstThemeId);
            })
            .catch(() => {
                if (isActive) setIsError(true);
            })
            .finally(() => {
                if (isActive) setIsLoadingThemes(false);
            });

        return () => {
            isActive = false;
        };
    }, [selectedBookSlug]);

    useEffect(() => {
        if (!selectedBookSlug || !selectedThemeId) return;

        let isActive = true;
        setIsLoadingChapters(true);
        setIsError(false);

        fetchChapters(selectedBookSlug, selectedThemeId)
            .then((data) => {
                if (!isActive) return;
                setChapters(normalizeItems(data));
            })
            .catch(() => {
                if (isActive) setIsError(true);
            })
            .finally(() => {
                if (isActive) setIsLoadingChapters(false);
            });

        return () => {
            isActive = false;
        };
    }, [selectedBookSlug, selectedThemeId]);

    return (
        <div className='space-y-5 px-4'>
            <div className='rounded-2xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm'>
                <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                    <div className='flex-1'>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                            {t("hadith.select_book")}
                        </label>
                        <select
                            value={selectedBookSlug}
                            onChange={(e) =>
                                setSelectedBookSlug(e.target.value)
                            }
                            className='w-full max-w-md px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        >
                            {bookList.map((book) => (
                                <option key={book.slug} value={book.slug}>
                                    {getLocalizedTranslation(
                                        book.translation,
                                        lang,
                                    ) || book.slug}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedBookSlug && (
                        <Link
                            href={`${basePath}/${selectedBookSlug}`}
                            className='inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-600 transition-colors'
                        >
                            {t("hadith.open_reader")}
                        </Link>
                    )}
                </div>
            </div>

            {isLoadingThemes ? (
                <SkeletonInline rows={3} />
            ) : isError ? (
                <div className='flex flex-col items-center justify-center min-h-[40vh] text-center px-4'>
                    <p className='text-4xl mb-3'>⚠️</p>
                    <h2 className='text-lg font-bold text-emerald-900 dark:text-white mb-2'>
                        {t("hadith.load_error_title")}
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t("hadith.load_error_desc")}
                    </p>
                </div>
            ) : (
                <>
                    <div className='flex flex-wrap gap-2'>
                        {themes.map((theme) => {
                            const themeLabel =
                                getLocalizedTranslation(
                                    theme?.theme?.translation,
                                    lang,
                                ) || `Theme ${theme?.theme?.id ?? ""}`;
                            return (
                                <button
                                    key={theme?.theme?.id ?? themeLabel}
                                    onClick={() =>
                                        setSelectedThemeId(theme?.theme?.id)
                                    }
                                    className={classNames(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                        {
                                            "bg-emerald-700 text-white shadow-sm":
                                                selectedThemeId ===
                                                theme?.theme?.id,
                                            "bg-parchment-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600":
                                                selectedThemeId !==
                                                theme?.theme?.id,
                                        },
                                    )}
                                >
                                    {themeLabel}
                                </button>
                            );
                        })}
                    </div>

                    {isLoadingChapters ? (
                        <SkeletonInline rows={4} />
                    ) : chapters.length === 0 ? (
                        <div className='flex flex-col items-center justify-center min-h-[36vh] text-center px-4'>
                            <h2 className='text-xl font-bold text-emerald-900 dark:text-white mb-2'>
                                {t("hadith.chapter_empty_title")}
                            </h2>
                            <p className='text-gray-500 dark:text-gray-400 max-w-sm text-sm leading-relaxed'>
                                {t("hadith.chapter_empty_hint")}
                            </p>
                        </div>
                    ) : (
                        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                            {chapters.map((chapter) => {
                                const chapterLabel =
                                    getLocalizedTranslation(
                                        chapter?.translation,
                                        lang,
                                    ) ||
                                    chapter?.name ||
                                    `Bab ${chapter?.id ?? ""}`;
                                const hadithCount =
                                    chapter?.total_hadith ??
                                    chapter?.hadith_count ??
                                    chapter?.count ??
                                    null;

                                return (
                                    <button
                                        key={chapter.id}
                                        onClick={() =>
                                            router.push(
                                                `${basePath}/${selectedBookSlug}?theme=${selectedThemeId}&chapter=${chapter.id}`,
                                                { scroll: false },
                                            )
                                        }
                                        className='text-left rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all'
                                    >
                                        <div className='flex items-start justify-between gap-3'>
                                            <div className='min-w-0'>
                                                <p className='text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1'>
                                                    Bab {chapter?.id ?? "-"}
                                                </p>
                                                <h3 className='text-base font-bold text-emerald-900 dark:text-white leading-snug'>
                                                    {chapterLabel}
                                                </h3>
                                            </div>
                                            {hadithCount != null && (
                                                <span className='shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1'>
                                                    {hadithCount} hadith
                                                </span>
                                            )}
                                        </div>

                                        {getLocalizedTranslation(
                                            chapter?.translation,
                                            lang,
                                        ) && (
                                            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2'>
                                                {getLocalizedTranslation(
                                                    chapter.translation,
                                                    lang,
                                                )}
                                            </p>
                                        )}

                                        <p className='mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                                            Buka hadith pada bab ini →
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ByChapter;
