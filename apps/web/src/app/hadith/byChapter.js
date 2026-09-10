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
    const [selectedBookSlug, setSelectedBookSlug] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const books = useMemo(() => normalizeItems(bookList), [bookList]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/books?size=20`)
            .then((res) => res.json())
            .then((data) => {
                const items = normalizeItems(data);
                setBookList(items);
                setSelectedBookSlug(
                    items.find((book) => book.slug === "bukhari")?.slug ??
                        items[0]?.slug ??
                        "",
                );
            })
            .catch(() => setIsError(true))
            .finally(() => setIsLoading(false));
    }, []);

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
                    htmlFor='bychapter-select-book'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                    {t("hadith.select_book")}
                </label>
                <select
                    id='bychapter-select-book'
                    value={selectedBookSlug}
                    onChange={(e) => setSelectedBookSlug(e.target.value)}
                    className='w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                >
                    {books.map((book) => (
                        <option key={book.slug} value={book.slug}>
                            {getLocalizedTranslation(book.translation, lang) ||
                                book.slug}
                        </option>
                    ))}
                </select>
            </ContentWidth>

            {selectedBookSlug && (
                <HadithDetailContent
                    key={selectedBookSlug}
                    params={{ slug: selectedBookSlug }}
                    basePath={basePath}
                />
            )}
        </div>
    );
};

export default ByChapter;
