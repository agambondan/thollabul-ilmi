"use client";

import { HadithDetailContent } from "@/app/dashboard/hadith/[slug]/page";
import ContentWidth from "@/components/layout/ContentWidth";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";
import { useEffect, useMemo, useState } from "react";

const normalizeItems = (data) => data?.items ?? data ?? [];

const ByChapter = ({ basePath = "/hadith" }) => {
    const { t, lang } = useLocale();
    const [bookList, setBookList] = useState([]);
    const [selectedBookIds, setSelectedBookIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/books?size=50`)
            .then((res) => res.json())
            .then((data) => {
                const items = normalizeItems(data);
                setBookList(items);
                const defaultBook = items.find((b) => b.slug === "bukhari") || items[0];
                if (defaultBook) setSelectedBookIds([defaultBook.id]);
            })
            .catch(() => setIsError(true))
            .finally(() => setIsLoading(false));
    }, []);

    const bookLabels = useMemo(() => {
        const map = {};
        bookList.forEach((book) => {
            map[book.id] = getLocalizedTranslation(book.translation, lang) || book.slug;
        });
        return map;
    }, [bookList, lang]);

    const toggleBook = (bookId) => {
        setSelectedBookIds((prev) =>
            prev.includes(bookId)
                ? prev.filter((id) => id !== bookId)
                : [...prev, bookId],
        );
    };

    if (isLoading) return <SkeletonInline rows={4} />;
    if (isError) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[40vh] text-center px-4'>
                <p className='text-4xl mb-3'>⚠️</p>
                <h2 className='text-lg font-bold text-emerald-900 dark:text-white mb-2'>
                    {t("hadith.load_error_title")}
                </h2>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("hadith.load_error_desc")}
                </p>
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <ContentWidth compact='max-w-4xl' className='px-4'>
                <label
                    htmlFor='bychapter-filter-perawi'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                    {t("hadith.filter_perawi") || (lang === "ID" ? "Filter Perawi" : "Filter Narrator")}
                </label>
                <div className='flex flex-wrap gap-2'>
                    {bookList.slice(0, 9).map((book) => (
                        <label
                            key={book.id}
                            className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors bg-white dark:bg-slate-700'
                        >
                            <input
                                type="checkbox"
                                checked={selectedBookIds.includes(book.id)}
                                onChange={() => toggleBook(book.id)}
                                className='w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2'
                            />
                            <span className={selectedBookIds.includes(book.id)
                                ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                : "text-gray-700 dark:text-gray-300"}>
                                {bookLabels[book.id]}
                            </span>
                        </label>
                    ))}
                    {bookList.length > 9 && (
                        <span className='text-xs text-gray-500 dark:text-gray-400 self-center px-2'>
                            +{bookList.length - 9} more
                        </span>
                    )}
                </div>

                {selectedBookIds.length > 0 && (
                    <div className='mt-3 flex items-center gap-2'>
                        <span className='text-xs text-gray-500 dark:text-gray-400'>
                            {t("hadith.filter_active") || (lang === "ID" ? "Filter aktif:" : "Active filters:")}
                        </span>
                        <div className='flex flex-wrap gap-1'>
                            {selectedBookIds.map((bookId) => (
                                <span
                                    key={bookId}
                                    className='inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full'
                                >
                                    {bookLabels[bookId]}
                                    <button
                                        type="button"
                                        onClick={() => toggleBook(bookId)}
                                        className='ml-1 hover:text-emerald-900 dark:hover:text-emerald-100'
                                        aria-label={t("common.remove") || "Remove"}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </ContentWidth>

            {selectedBookIds.length > 0 && (
                <div className='px-4'>
                    {selectedBookIds.map((bookId) => {
                        const book = bookList.find((b) => b.id === bookId);
                        return (
                            <ContentWidth key={bookId} compact='max-w-4xl' className='px-4'>
                                <div className='mb-6'>
                                    <h3 className='text-lg font-semibold text-emerald-900 dark:text-white mb-3 flex items-center gap-2'>
                                        {bookLabels[bookId]}
                                        <span className='text-xs text-gray-400'>{t("hadith.chapters") || "Bab"}</span>
                                    </h3>
                                    {book && (
                                        <HadithDetailContent
                                            params={{ slug: book.slug }}
                                            basePath={basePath}
                                        />
                                    )}
                                </div>
                            </ContentWidth>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ByChapter;
