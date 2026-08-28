"use client";
/* eslint-disable @next/next/no-img-element */

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useState } from "react";

const ByBook = ({ basePath = "/hadith" }) => {
    const { t, lang } = useLocale();
    const [isLoading, SetIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [books, setBooks] = useState([]);

    const fetchBooks = async () => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/books`,
        );
        return await res.json();
    };

    useEffect(() => {
        fetchBooks()
            .then((res) => {
                setBooks(res);
                SetIsLoading(false);
            })
            .catch(() => {
                setIsError(true);
                SetIsLoading(false);
            });
    }, []);

    if (isLoading) return <SkeletonInline rows={4} />;
    if (isError)
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

    return (
        <ContentWidth
            compact='max-w-6xl'
            className='grid xl:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 px-4'
        >
            {(books?.items ?? []).map((book) => {
                const label =
                    getLocalizedTranslation(book?.translation, lang) ||
                    book.slug;
                return (
                    <div
                        key={book.id}
                        className='flex flex-row bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all overflow-hidden'
                    >
                        <img
                            className='h-auto w-full max-w-[120px] object-cover'
                            src={`/assets/images/kitab/hadith/${book.slug}.png`}
                            alt={label}
                        />
                        <div className='flex flex-col justify-between p-4 flex-1'>
                            <div>
                                <h5 className='text-base font-bold text-emerald-900 dark:text-white mb-1'>
                                    {label}
                                </h5>
                                <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
                                    {book.count} Hadith
                                </p>
                            </div>
                            <Link
                                href={`${basePath}/${book.slug}`}
                                className='bg-emerald-700 hover:bg-emerald-600 text-white text-sm text-center py-1.5 px-3 rounded-lg transition-colors'
                            >
                                {t("hadith.open_reader")}
                            </Link>
                        </div>
                    </div>
                );
            })}
        </ContentWidth>
    );
};

export default ByBook;
