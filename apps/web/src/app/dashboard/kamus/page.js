"use client";

import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";
import { useEffect, useRef, useState } from "react";
import { BsSearch } from "react-icons/bs";
import InlineError from "@/components/InlineError";

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

export default function DashboardKamusPage() {
    const { t, lang } = useLocale();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchFailed, setSearchFailed] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            return;
        }

        timerRef.current = setTimeout(() => {
            setLoading(true);
            fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dictionary?q=${encodeURIComponent(q)}&size=20`,
            )
                .then((r) => r.json())
                .then((d) => {
                    const arr = d?.items ?? d ?? [];
                    setResults(Array.isArray(arr) ? arr : []);
                })
                .catch(() => setSearchFailed(true))
                .finally(() => setLoading(false));
        }, 400);

        return () => clearTimeout(timerRef.current);
    }, [query]);

    return (
        <div className='p-6'>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {t("kamus.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
                    {t("kamus.search_placeholder")}
                </p>
            </div>

            {/* Search */}
            <div className='relative mb-6 max-w-lg'>
                <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                    type='text'
                    placeholder={t("kamus.search_placeholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className='w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700'
                />
            </div>

            {/* Loading */}
            {loading && (
                <p className='text-center py-10 text-gray-400 text-sm'>
                    {t("kamus.searching")}
                </p>
            )}

            {/* Empty state */}
            {!loading && query.trim().length < 2 && (
                <div className='text-center py-16 text-gray-400'>
                    <BsSearch className='mx-auto text-4xl mb-3 opacity-30' />
                    <p className='text-sm'>{t("kamus.prompt")}</p>
                    <p className='text-xs mt-1 opacity-70'>
                        {t("kamus.min_chars")}
                    </p>
                </div>
            )}

            {/* No results */}
            {searchFailed && !loading && <InlineError />}
            {!loading &&
                !searchFailed &&
                query.trim().length >= 2 &&
                results.length === 0 && (
                    <p className='text-center py-10 text-gray-400 text-sm'>
                        {t("common.no_results")} &quot;{query}&quot;
                    </p>
                )}

            {/* Results table */}
            {!loading && results.length > 0 && (
                <div className='overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='bg-gray-50 dark:bg-slate-800 text-left'>
                                <th className='px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400 text-right'>
                                    {t("kamus.col_arabic")}
                                </th>
                                <th className='px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400'>
                                    {t("kamus.col_latin")}
                                </th>
                                <th className='px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400'>
                                    {t("kamus.col_meaning")}
                                </th>
                                <th className='px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400'>
                                    {t("kamus.col_root")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                            {results.map((item, idx) => {
                                const id = item.id ?? item._id ?? idx;
                                return (
                                    <tr
                                        key={id}
                                        className='bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'
                                    >
                                        <td
                                            dir='rtl'
                                            className='px-4 py-3 font-arabic text-xl text-gray-800 dark:text-gray-200 text-right'
                                        >
                                            {item.arabic ??
                                                item.word_arabic ??
                                                item.term ??
                                                "—"}
                                        </td>
                                        <td className='px-4 py-3 italic text-gray-500 dark:text-gray-400'>
                                            {item.latin ??
                                                item.transliteration ??
                                                item.term ??
                                                "—"}
                                        </td>
                                        <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>
                                            {getLocalizedTranslation(
                                                item.meaning ?? item.definition,
                                                lang,
                                            ) || "—"}
                                        </td>
                                        <td className='px-4 py-3 text-gray-400'>
                                            {toStr(
                                                item.root ??
                                                    item.word_root ??
                                                    item.origin ??
                                                    item.source,
                                            ) || "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
