"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { kamusApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import { useState } from "react";
import { BsBook, BsSearch } from "react-icons/bs";

export function KamusContent({ initialWords = [] }) {
    const { t, lang } = useLocale();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [words] = useState(initialWords);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [visibleCount, setVisibleCount] = useState(20);

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
    const visibleResults = displayResults.slice(0, visibleCount);

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-8'>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 mb-3'>
                    <BsBook className='text-2xl' />
                </div>
                <h1 className='text-2xl font-bold text-emerald-950 dark:text-emerald-300 dark:text-white'>
                    {t("home.f.kamus") || "Kamus Arab-Indonesia"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    {t("kamus.subtitle") ||
                        "Cari arti kosakata Arab Al-Quran dan Islam"}
                </p>
            </div>

            <div className='flex gap-2 mb-6'>
                <div className='relative flex-1'>
                    <BsSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                    <input
                        type='text'
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!e.target.value) setResults(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder={
                            t("kamus.search_placeholder") ||
                            "Ketik kata Arab atau Indonesia..."
                        }
                        className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600'
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className='px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition disabled:opacity-50'
                >
                    {loading
                        ? t("common.loading") || "Memuat..."
                        : t("common.search") || "Cari"}
                </button>
            </div>

            {displayResults.length > 0 && (
                <p className='text-xs text-gray-400 mb-3'>
                    {displayResults.length} {t("kamus.results_unit") || "kata ditemukan"}
                </p>
            )}

            {selected && (
                <div className='mb-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <span className='font-arabic text-3xl text-emerald-800 dark:text-emerald-300 leading-loose'>
                                {wordTerm(selected)}
                            </span>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-200 mt-1'>
                                {wordLatin(selected)}
                            </p>
                            {wordRoot(selected) && (
                                <p className='text-xs text-gray-400 mt-0.5'>
                                    {t("kamus.root_label") || "Akar kata"}:{" "}
                                    <span className='font-arabic'>
                                        {wordRoot(selected)}
                                    </span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setSelected(null)}
                            className='text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        >
                            ✕
                        </button>
                    </div>
                    <p className='text-sm text-gray-700 dark:text-gray-200 mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40'>
                        {wordMeaning(selected)}
                    </p>
                    {selected.context && (
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 italic'>
                            {getLocalizedField(selected, "context", lang)}
                        </p>
                    )}
                </div>
            )}

            {displayResults.length === 0 && !loading && (
                <div className='text-center py-12 text-gray-400'>
                    <p className='text-sm'>
                        {query
                            ? t("kamus.not_found_word") ||
                              "Kata tidak ditemukan"
                            : t("kamus.prompt") ||
                              "Ketik kata Arab atau Indonesia untuk mencari definisi"}
                    </p>
                    {query && (
                        <p className='text-xs text-gray-400 mt-1'>
                            {t("kamus.not_found_hint") ||
                                "Coba kata lain atau cek ejaan"}
                        </p>
                    )}
                </div>
            )}

            <div className='space-y-2'>
                {visibleResults.map((word, i) => (
                    <div
                        key={word.id ?? i}
                        onClick={() =>
                            setSelected(
                                selected?.id === word.id ? null : word,
                            )
                        }
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            selected?.id === word.id
                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-700"
                                : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-slate-700"
                        }`}
                    >
                        <div className='flex items-center justify-between gap-3'>
                            <div className='min-w-0 flex-1'>
                                <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 truncate'>
                                    {wordLatin(word)}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5'>
                                    {wordMeaning(word)}
                                </p>
                            </div>
                            <span className='font-arabic text-xl text-emerald-700 dark:text-emerald-400 shrink-0'>
                                {wordTerm(word)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {visibleCount < displayResults.length && (
                <div className='text-center mt-6'>
                    <button
                        onClick={() =>
                            setVisibleCount((prev) =>
                                Math.min(prev + 20, displayResults.length),
                            )
                        }
                        className='px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition'
                    >
                        {t("common.load_more") || "Muat lebih banyak"} (
                        {displayResults.length - visibleCount} lagi)
                    </button>
                </div>
            )}
        </ContentWidth>
    );
}
export default KamusContent;
