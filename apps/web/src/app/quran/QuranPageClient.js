"use client";

import CardHorizontal from "@/components/card/CardHorizontal";
import { useLocale } from "@/context/Locale";
import { getSurahMeaning, getSurahName } from "@/lib/surahList";
import { useLayoutMode } from "@/lib/useLayoutMode";
import Link from "next/link";
import { useState } from "react";
import { BsBookHalf, BsSearch } from "react-icons/bs";

const getLatinSlug = (surah) =>
    surah.translation?.latin_en ??
    surah.translation?.latin_idn ??
    surah.slug ??
    (surah.number ? String(surah.number) : "");

export default function QuranPageClient({
    items,
    isError,
    basePath = "/quran/surah",
    mushafPath = "/quran/page-mushaf",
}) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [search, setSearch] = useState("");

    const filtered = items.filter((surah) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
            getSurahName(surah, lang).toLowerCase().includes(query) ||
            getSurahMeaning(surah, lang).toLowerCase().includes(query) ||
            getLatinSlug(surah).toLowerCase().includes(query) ||
            String(surah.number).includes(query)
        );
    });

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-6xl"
            }
        >
            {isError && (
                <div className='flex flex-col items-center justify-center min-h-[50vh] text-center px-4'>
                    <p className='text-4xl mb-3'>⚠️</p>
                    <h2 className='text-lg font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-2'>
                        {t("quran.error_title")}
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-4'>
                        {t("quran.error_desc")}
                    </p>
                </div>
            )}
            <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
                <div>
                    <p
                        className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                        style={{ fontFamily: "Amiri, serif" }}
                    >
                        الْقُرْآنُ الْكَرِيمُ
                    </p>
                    <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1'>
                        {t("quran.title")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {items.length} Surah &middot; {t("quran.page_subtitle")}
                    </p>
                </div>

                <div className='relative w-full md:w-80'>
                    <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                    <input
                        type='text'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t("quran.search_placeholder")}
                        className='w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    />
                </div>
            </div>

            {/* Mushaf navigator shortcut */}
            <Link
                href={mushafPath}
                className='flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 mb-6 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group'
            >
                <BsBookHalf className='text-2xl text-emerald-600 dark:text-emerald-400 shrink-0' />
                <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-emerald-800 dark:text-emerald-300 group-hover:underline'>
                        {t("mushaf.title")}
                    </p>
                    <p className='text-xs text-emerald-600 dark:text-emerald-500 truncate'>
                        {t("mushaf.subtitle")}
                    </p>
                </div>
                <span className='text-emerald-400 dark:text-emerald-600 text-sm'>
                    ›
                </span>
            </Link>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                {filtered.map((surat) => (
                    <Link
                        key={surat.number}
                        prefetch={false}
                        href={`${basePath}/${getLatinSlug(surat)}`}
                        className='cv-list-item'
                    >
                        <CardHorizontal
                            surat={surat}
                            lang={lang}
                            ayahUnit={t("common.verse")}
                            t={t}
                        />
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && !isError && (
                <div className='text-center py-12'>
                    <p className='text-gray-400 text-sm'>
                        {t("quran.not_found")}
                    </p>
                </div>
            )}
        </div>
    );
}
