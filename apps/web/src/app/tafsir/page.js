"use client";

import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BsSearch } from "react-icons/bs";
import { MdOutlineAutoStories } from "react-icons/md";
import InlineError from "@/components/InlineError";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const TafsirIndexContent = ({ tafsirBasePath = "/tafsir" }) => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [surahs, setSurahs] = useState([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const loadSurahs = useCallback(() => {
        setIsLoading(true);
        setLoadError(false);
        fetch(`${API_URL}/api/v1/surah?size=114&sort=number`)
            .then((r) => r.json())
            .then((data) => {
                const list = data?.surahs ?? data?.items ?? data ?? [];
                setSurahs(list);
            })
            // An empty list would read as "no surah exist"; say the load failed.
            .catch(() => setLoadError(true))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        loadSurahs();
    }, [loadSurahs]);

    const filtered = surahs.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            s.translation?.latin_en?.toLowerCase().includes(q) ||
            getLocalizedTranslation(s.translation, lang)
                .toLowerCase()
                .includes(q) ||
            String(s.number).includes(q)
        );
    });

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-3xl"
            }
        >
            {/* Header */}
            <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                    <MdOutlineAutoStories className='text-xl text-emerald-700 dark:text-emerald-400' />
                </div>
                <div>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                        {t("tafsir.title")}
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {t("tafsir.pick_surah")}
                    </p>
                </div>
            </div>

            {/* Notice */}
            <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl px-4 py-3 mb-5'>
                <p className='text-xs text-amber-700 dark:text-amber-400'>
                    <strong>{t("common.notes")}:</strong>{" "}
                    {t("tafsir.data_note")}
                </p>
            </div>

            {/* Search */}
            <div className='relative mb-5'>
                <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                <input
                    type='text'
                    placeholder={t("tafsir.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                />
            </div>

            {/* Grid */}
            {loadError && !isLoading ? (
                <InlineError onRetry={loadSurahs} />
            ) : null}
            {isLoading ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className='h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse'
                        />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className='text-center py-16 text-gray-400'>
                    <MdOutlineAutoStories className='text-4xl mx-auto mb-2' />
                    <p className='text-sm'>{t("quran.not_found")}</p>
                </div>
            ) : (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                    {filtered.map((s) => (
                        <Link
                            key={s.number}
                            href={`${tafsirBasePath}/${encodeURIComponent(s.translation?.latin_en ?? s.number)}`}
                            className='group flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all'
                        >
                            <span className='w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                                {s.number}
                            </span>
                            <div className='min-w-0'>
                                <p className='text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors'>
                                    {s.translation?.latin_en ??
                                        `Surah ${s.number}`}
                                </p>
                                <p className='text-xs text-gray-400 truncate'>
                                    {getLocalizedTranslation(
                                        s.translation,
                                        lang,
                                    )}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

const TafsirIndexPage = () => (
    <main className='min-h-screen flex flex-col'>
        <Section>
            <TafsirIndexContent />
        </Section>
    </main>
);

export default TafsirIndexPage;
