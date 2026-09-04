"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { kamusApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsBook, BsSearch } from "react-icons/bs";

export default function KamusPage() {
    const { t, lang } = useLocale();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    // The browse list used to be a hardcoded array in this file; it now lives in
    // the dictionary table so it can be edited from the admin panel.
    useEffect(() => {
        let cancelled = false;
        kamusApi
            .list(lang)
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                const items = data?.items ?? data ?? [];
                setWords(Array.isArray(items) ? items : []);
            })
            .catch(() => {
                if (!cancelled) setWords([]);
            });
        return () => {
            cancelled = true;
        };
    }, [lang]);

    const wordMeaning = (word) => {
        if (lang === "EN") {
            return (
                word.translation?.description_en ||
                word.translation?.en ||
                word.definition ||
                word.meaning ||
                ""
            );
        }
        return (
            word.definition ||
            word.translation?.description_idn ||
            word.translation?.idn ||
            word.meaning ||
            ""
        );
    };

    const wordTerm = (word) => word.arabic || word.term || "";
    const wordLatin = (word) =>
        word.latin || word.transliteration || word.term || "";
    const wordRoot = (word) => word.root || word.origin || word.source || "";

    const handleSearch = () => {
        const q = query.trim();
        if (!q) return;
        setLoading(true);
        setSelected(null);
        kamusApi
            .search(q, lang)
            .then((r) => r.json())
            .then((data) => {
                setResults(data?.items ?? data ?? []);
            })
            .catch(() => {
                // Fallback: filter what we already have client-side.
                const lower = q.toLowerCase();
                const local = words.filter(
                    (w) =>
                        wordTerm(w).includes(q) ||
                        wordLatin(w).toLowerCase().includes(lower) ||
                        wordMeaning(w).toLowerCase().includes(lower) ||
                        wordRoot(w).includes(q),
                );
                setResults(local);
            })
            .finally(() => setLoading(false));
    };

    const filtered = query
        ? words.filter(
              (w) =>
                  wordTerm(w).includes(query) ||
                  wordLatin(w).toLowerCase().includes(query.toLowerCase()) ||
                  wordMeaning(w).toLowerCase().includes(query.toLowerCase()) ||
                  wordRoot(w).includes(query),
          )
        : words;

    const displayResults = results ?? filtered;

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <ContentWidth
                compact='max-w-2xl'
                className='flex-1 px-4 pt-navbar pb-8'
            >
                {/* Header */}
                <div className='mb-8 text-center'>
                    <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl mb-4'>
                        <BsBook className='text-3xl text-blue-600 dark:text-blue-400' />
                    </div>
                    <h1 className='text-3xl font-extrabold text-emerald-900 dark:text-emerald-300 dark:text-emerald-100 mb-2'>
                        {t("kamus.title")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("kamus.subtitle")}
                    </p>
                </div>

                {/* Search */}
                <div className='flex gap-2 mb-6'>
                    <div className='relative flex-1'>
                        <BsSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                        <input
                            type='text'
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setResults(null);
                            }}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleSearch()
                            }
                            placeholder={t("kamus.search_placeholder")}
                            className='w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className='px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors'
                    >
                        {t("common.search")}
                    </button>
                </div>

                {loading && (
                    <div className='text-center py-8'>
                        <div className='w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto' />
                    </div>
                )}

                {!loading && (
                    <>
                        <p className='text-xs text-gray-400 mb-4'>
                            {displayResults.length} {t("kamus.results_unit")}
                        </p>
                        <div className='space-y-2'>
                            {displayResults.map((word, i) => {
                                const isOpen = selected === i;
                                return (
                                    <div
                                        key={i}
                                        className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden cursor-pointer'
                                        onClick={() =>
                                            setSelected(isOpen ? null : i)
                                        }
                                    >
                                        <div className='flex items-center justify-between px-5 py-4'>
                                            <div className='flex items-center gap-4'>
                                                <p
                                                    className='text-2xl text-gray-900 dark:text-gray-100 dark:text-white font-bold'
                                                    style={{
                                                        fontFamily:
                                                            "Amiri, serif",
                                                        direction: "rtl",
                                                    }}
                                                >
                                                    {wordTerm(word)}
                                                </p>
                                                <div>
                                                    <p className='text-sm font-semibold text-emerald-700 dark:text-emerald-400 italic'>
                                                        {wordLatin(word)}
                                                    </p>
                                                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                                                        {wordMeaning(word)}
                                                    </p>
                                                </div>
                                            </div>
                                            {wordRoot(word) && (
                                                <span className='text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 dark:text-blue-300 px-2 py-1 rounded-lg font-medium flex-shrink-0'>
                                                    {wordRoot(word)}
                                                </span>
                                            )}
                                        </div>

                                        {isOpen && (
                                            <div className='px-5 pb-4 border-t border-gray-50 dark:border-slate-700 pt-3 space-y-2'>
                                                <div className='flex flex-wrap gap-2'>
                                                    <div className='flex items-center gap-1.5 text-xs'>
                                                        <span className='text-gray-400'>
                                                            {t(
                                                                "kamus.root_label",
                                                            )}
                                                            :
                                                        </span>
                                                        <span
                                                            className='font-bold text-gray-800 dark:text-gray-200 dark:text-white'
                                                            style={{
                                                                fontFamily:
                                                                    "Amiri, serif",
                                                            }}
                                                        >
                                                            {wordRoot(word)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {word.notes && (
                                                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                                                        {word.notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {displayResults.length === 0 && query && (
                            <div className='text-center py-12 text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                <BsBook className='text-4xl mx-auto mb-3 opacity-30' />
                                <p className='font-semibold mb-1'>
                                    {t("kamus.not_found_word")}
                                </p>
                                <p className='text-sm'>
                                    {t("kamus.not_found_hint")}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </ContentWidth>
        </main>
    );
}
