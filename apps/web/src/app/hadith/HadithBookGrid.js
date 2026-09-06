"use client";

/* eslint-disable @next/next/no-img-element */

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";
import classNames from "classnames";
import Link from "next/link";

export default function HadithBookGrid({ books, basePath = "/hadith" }) {
    const { t, lang } = useLocale();
    const TAB_LABELS = {
        book: t("hadith.tab_book") || "Kitab",
        theme: t("hadith.tab_theme") || "Tema",
        chapter: t("hadith.tab_chapter") || "Bab",
        hadith: t("hadith.tab_hadith") || "Nomor Hadis",
    };

    return (
        <>
            <div className='w-full'>
                <div
                    className='flex flex-nowrap gap-2 justify-center px-4 overflow-x-auto scroll-x-fade'
                    role='tablist'
                >
                    {[
                        { id: "book", href: "/hadith?tab=book" },
                        { id: "theme", href: "/hadith?tab=theme" },
                        { id: "chapter", href: "/hadith?tab=chapter" },
                        { id: "hadith", href: "/hadith?tab=hadith" },
                    ].map((entry) => {
                        const isActive = entry.id === "book";
                        return (
                            <Link
                                key={entry.id}
                                href={entry.href}
                                scroll={false}
                                role='tab'
                                aria-selected={isActive}
                                className={classNames(
                                    "shrink-0 min-w-[4.5rem] text-center whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all",
                                    {
                                        "bg-emerald-700 dark:bg-emerald-700 text-white shadow-sm":
                                            isActive,
                                        "bg-parchment-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600":
                                            !isActive,
                                    },
                                )}
                            >
                                {TAB_LABELS[entry.id]}
                            </Link>
                        );
                    })}
               </div>
           </div>

            <div className='py-4' />

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
                            className='flex flex-row min-h-[163px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all overflow-hidden'
                        >
                            <img
                                className='w-[120px] h-[163px] shrink-0 object-cover bg-emerald-50 dark:bg-slate-900'
                                width={120}
                                height={163}
                                src={`/assets/images/kitab/hadith/${book.slug}.png`}
                                alt={label}
                                loading='lazy'
                            />
                            <div className='flex flex-col justify-between p-4 flex-1'>
                                <div>
                                    <h2 className='text-base font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                                        {label}
                                   </h2>
                                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                                        {book.count} {t("hadith.unit") || "Hadits"}
                                   </p>
                               </div>
                                <Link
                                    href={`${basePath}/${book.slug}`}
                                    className='bg-emerald-700 hover:bg-emerald-600 text-white text-sm text-center py-1.5 px-3 rounded-lg transition-colors'
                                >
                                    {t("hadith.open_reader") || "Buka Reader"}
                               </Link>
                           </div>
                       </div>
                    );
                })}
           </ContentWidth>
        </>
    );
}
