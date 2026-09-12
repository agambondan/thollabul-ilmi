"use client";

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { asbabunNuzulApi } from "@/lib/api";
import { SURAH_LIST } from "@/lib/surahList";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BsBook, BsPersonVcard, BsSearch } from "react-icons/bs";
import SourceBadges from "@/components/SourceBadges";

const SURAH_COUNT = 114;
const QUICK_SURAH = [1, 2, 4, 18, 36, 67, 112];

const asbabunAyahStart = (item) =>
    item?.ayah_number ?? item?.ayah_start ?? item?.ayah_refs?.[0]?.ayah_number;
const asbabunSurahNumber = (item, fallback) =>
    item?.surah_number ??
    item?.ayah_refs?.[0]?.surah_number ??
    item?.ayahs?.[0]?.surah?.number ??
    fallback;
const asbabunSurahSlug = (item) =>
    item?.ayahs?.[0]?.surah?.translation?.latin_en?.toLowerCase() ??
    item?.ayahs?.[0]?.surah?.translation?.latin_idn?.toLowerCase() ??
    "";
const asbabunQuranHref = (item, quranBasePath, fallbackSurahNumber) => {
    const ayahNumber = asbabunAyahStart(item) ?? "";
    if (quranBasePath.startsWith("/dashboard/quran")) {
        const slug = asbabunSurahSlug(item);
        return slug
            ? `${quranBasePath}/${slug}#${ayahNumber}`
            : `${quranBasePath}?surah=${asbabunSurahNumber(item, fallbackSurahNumber)}#${ayahNumber}`;
    }
    return `${quranBasePath}/${asbabunSurahNumber(item, fallbackSurahNumber)}/${ayahNumber}`;
};
const asbabunAyahLabel = (item, t) => {
    if (item?.display_ref) return item.display_ref;
    const start = asbabunAyahStart(item);
    const end =
        item?.ayah_end ??
        item?.ayah_refs?.[item?.ayah_refs?.length - 1]?.ayah_number;
    if (!start) return `${t("asbabun.ayah_prefix")} ${item?.ayah_id ?? "-"}`;
    return end && Number(end) !== Number(start)
        ? `${t("asbabun.ayah_prefix")} ${start}-${end}`
        : `${t("asbabun.ayah_prefix")} ${start}`;
};

const surahLabel = (s, lang) =>
    `${s.number}. ${s.name}${lang === "EN" ? ` (${s.meaning_en})` : ` (${s.meaning})`}`;

export default function AsbabunNuzulForm({
    quranBasePath = "/quran",
    initialResults = [],
    initialSurahNumber = "",
    placeholderLabel = "Cari nama atau nomor surah...",
    searchLabel = "Cari",
    quickExampleLabel = "Surah populer:",
    noDataTitle = "Belum ada asbabun nuzul untuk surah ini.",
    noDataHint = "Silakan pilih surah lain.",
    enterSurahLabel = "Masukkan nomor surah untuk mulai mencari asbabun nuzul.",
    sourceLabel = "Sumber: Tafsir Ibnu Katsir, Al-Baghawi, Asbabun Nuzul oleh Al-Wahidi",
    validateErrorLabel = "Nomor surah tidak valid (1-114).",
    loadErrorLabel = "Gagal memuat. Coba lagi nanti.",
    narratorPrefixLabel = "Diriwayatkan oleh",
    referenceLabel = "Rujukan:",
    resultsFoundLabel = "riwayat ditemukan",
    noMatchLabel = "Surah tidak ditemukan.",
}) {
    const { t, lang } = useLocale();
    const initialSurah = SURAH_LIST.find(
        (s) => String(s.number) === String(initialSurahNumber),
    );
    const [surahNumber, setSurahNumber] = useState(initialSurahNumber);
    const [query, setQuery] = useState(
        initialSurah ? surahLabel(initialSurah, lang) : "",
    );
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [results, setResults] = useState(initialResults);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(initialResults.length > 0);

    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return SURAH_LIST.filter(
            (s) =>
                String(s.number) === q ||
                s.name.toLowerCase().includes(q) ||
                s.name_en.toLowerCase().includes(q),
        ).slice(0, 8);
    }, [query]);

    const runSearch = async (num) => {
        if (!num || num < 1 || num > SURAH_COUNT) {
            setError(t("asbabun.validate_error") || validateErrorLabel);
            return;
        }
        setIsLoading(true);
        setError("");
        setSearched(true);
        try {
            const res = await asbabunNuzulApi.bySurah(num, lang);
            if (!res.ok) throw new Error("fetch failed");
            const d = await res.json();
            setResults(Array.isArray(d) ? d : (d.data ?? []));
        } catch {
            setError(t("asbabun.load_error") || loadErrorLabel);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        runSearch(parseInt(surahNumber, 10));
    };

    const selectSurah = (s) => {
        setSurahNumber(String(s.number));
        setQuery(surahLabel(s, lang));
        setShowSuggestions(false);
        runSearch(s.number);
    };

    return (
        <div>
            <form
                onSubmit={handleSearch}
                className='flex items-center gap-3 mb-5'
            >
                <div className='relative flex-1'>
                    <div className='flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500'>
                        <BsSearch className='text-gray-400 shrink-0' />
                        <input
                            type='text'
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                                if (!e.target.value) setSurahNumber("");
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder={
                                t("asbabun.placeholder") || placeholderLabel
                            }
                            className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                        />
                    </div>

                    {showSuggestions && query.trim() && (
                        <div className='absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1'>
                            {suggestions.length === 0 ? (
                                <p className='px-3 py-2.5 text-xs text-gray-400'>
                                    {t("asbabun.no_match") || noMatchLabel}
                                </p>
                            ) : (
                                suggestions.map((s) => (
                                    <button
                                        key={s.number}
                                        type='button'
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            selectSurah(s);
                                        }}
                                        className='w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                    >
                                        <span>
                                            <span className='font-medium'>
                                                {s.number}. {s.name}
                                            </span>{" "}
                                            <span className='text-gray-400 text-xs'>
                                                (
                                                {lang === "EN"
                                                    ? s.meaning_en
                                                    : s.meaning}
                                                )
                                            </span>
                                        </span>
                                        <span className='text-xs text-gray-400 shrink-0'>
                                            {s.ayat}{" "}
                                            {t("asbabun.ayah_prefix") ?? "Ayah"}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
                <button
                    type='submit'
                    disabled={isLoading || !surahNumber}
                    className='px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors'
                >
                    {isLoading ? "..." : t("asbabun.search_btn") || searchLabel}
                </button>
            </form>

            <div className='mb-6'>
                <p className='text-xs text-gray-400 mb-2'>
                    {t("asbabun.quick_example") || quickExampleLabel}
                </p>
                <div className='flex gap-2 flex-wrap'>
                    {QUICK_SURAH.map((num) => {
                        const s = SURAH_LIST.find((x) => x.number === num);
                        return (
                            <button
                                key={num}
                                type='button'
                                onClick={() => s && selectSurah(s)}
                                className='px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors'
                            >
                                {s ? `${s.number}. ${s.name}` : num}
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className='mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm'>
                    {error}
                </div>
            )}

            {isLoading && <SkeletonInline rows={4} />}

            {!isLoading && searched && results.length === 0 && !error && (
                <div className='text-center py-16 text-gray-400 dark:text-gray-600 text-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <p className='mb-2'>
                        {t("asbabun.no_data_title") || noDataTitle}
                    </p>
                    <p className='text-xs'>
                        {t("asbabun.no_data_hint") || noDataHint}
                    </p>
                </div>
            )}

            {!isLoading && !searched && (
                <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <p className='text-gray-400 dark:text-gray-600 text-sm mb-6'>
                        {t("asbabun.enter_surah") || enterSurahLabel}
                    </p>
                    <p className='text-xs text-gray-400 dark:text-gray-600'>
                        {t("asbabun.source") || sourceLabel}
                    </p>
                </div>
            )}

            {!isLoading && results.length > 0 && (
                <div>
                    <div className='flex items-center gap-2 mb-3 text-xs text-gray-400'>
                        <BsBook className='shrink-0' />
                        <span>
                            {results.length}{" "}
                            {t("asbabun.results_found") || resultsFoundLabel}
                        </span>
                    </div>
                    <div className='space-y-4'>
                        {results.map((item) => (
                            <div
                                key={item.id}
                                className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors'
                            >
                                <div className='flex items-center justify-between gap-2 mb-3'>
                                    <Link
                                        href={asbabunQuranHref(
                                            item,
                                            quranBasePath,
                                            surahNumber,
                                        )}
                                        className='text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors'
                                    >
                                        {asbabunAyahLabel(item, t)}
                                    </Link>
                                </div>

                                {item.title && (
                                    <h3 className='text-sm font-semibold text-gray-800 dark:text-white mb-2'>
                                        {item.title}
                                    </h3>
                                )}

                                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                    {getLocalizedField(item, "content", lang, [
                                        "description",
                                        "text",
                                    ])}
                                </p>

                                {item.narrator && (
                                    <div className='mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
                                        <BsPersonVcard className='text-emerald-600 dark:text-emerald-400 shrink-0' />
                                        <span>
                                            {t("asbabun.narrator_prefix") ||
                                                narratorPrefixLabel}
                                            : {item.narrator}
                                        </span>
                                    </div>
                                )}

                                {item.source && (
                                    <div className='mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-700/60 flex items-start gap-2'>
                                        <span className='text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0 mt-1'>
                                            {t("asbabun.reference") ||
                                                referenceLabel}
                                        </span>
                                        <SourceBadges source={item.source} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
