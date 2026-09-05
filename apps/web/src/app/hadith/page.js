/* eslint-disable @next/next/no-img-element */
import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import { hadithTabList } from "@/lib/const";
import { getLocalizedTranslation } from "@/lib/translation";
import classNames from "classnames";
import Link from "next/link";
import { Suspense } from "react";
import HadithContent from "./HadithContent";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialBooks() {
    try {
        const res = await fetch(`${API_URL}/api/v1/books?size=20`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            ...data,
            items: data?.items ?? (Array.isArray(data) ? data : []),
        };
    } catch {
        return null;
    }
}

const TAB_LABELS = {
    book: "Kitab",
    theme: "Tema",
    chapter: "Bab",
    hadith: "Nomor Hadis",
};

export default async function Page(props) {
    const searchParams = await props.searchParams;
    const tab = searchParams?.tab || "book";
    const initialBooks = await getInitialBooks();

    if (tab !== "book") {
        return (
            <main className='min-h-screen flex flex-col'>
                <Section>
                    <Suspense fallback={<div className='py-4' />}>
                        <HadithContent initialBooks={initialBooks} />
                    </Suspense>
                </Section>
            </main>
        );
    }

    const books = initialBooks?.items ?? [];

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='py-2' />
                <div className='w-full'>
                    <div
                        className='flex flex-nowrap gap-2 justify-center px-4 overflow-x-auto scroll-x-fade'
                        role='tablist'
                    >
                        {hadithTabList.map((t) => {
                            const tabId = t.href.replace("#", "");
                            const isActive = tabId === "book";
                            const href = `/hadith?tab=${tabId}`;
                            const displayLabel = TAB_LABELS[tabId] || t.label;

                            return (
                                <Link
                                    key={t.href}
                                    href={href}
                                    scroll={false}
                                    role='tab'
                                    aria-selected={isActive}
                                    className={classNames(
                                        "shrink-0 whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all",
                                        {
                                            "bg-emerald-700 dark:bg-emerald-700 text-white shadow-sm":
                                                isActive,
                                            "bg-parchment-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600":
                                                !isActive,
                                        },
                                    )}
                                >
                                    {displayLabel}
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
                    {books.map((book) => {
                        const label =
                            getLocalizedTranslation(book?.translation, "ID") ||
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
                                    loading='lazy'
                                />
                                <div className='flex flex-col justify-between p-4 flex-1'>
                                    <div>
                                        <h2 className='text-base font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                                            {label}
                                        </h2>
                                        <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                                            {book.count} Hadits
                                        </p>
                                    </div>
                                    <Link
                                        href={`/hadith/${book.slug}`}
                                        className='bg-emerald-700 hover:bg-emerald-600 text-white text-sm text-center py-1.5 px-3 rounded-lg transition-colors'
                                    >
                                        Buka Reader
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </ContentWidth>
            </Section>
        </main>
    );
}
