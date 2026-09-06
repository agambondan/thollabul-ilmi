"use client";

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { asbabunNuzulApi } from "@/lib/api";
import { SURAH_LIST } from "@/lib/surahList";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useState } from "react";
import { BsSearch } from "react-icons/bs";
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

export default function AsbabunNuzulForm({
    quranBasePath = "/quran",
    initialResults = [],
    initialSurahNumber = "",
    placeholderLabel = "Pilih Surah (1-114)...",
    searchLabel = "Cari",
    quickExampleLabel = "Surah populer:",
    surahPrefixLabel = "Surah",
    noDataTitle = "Belum ada asbabun nuzul untuk surah ini.",
    noDataHint = "Silakan pilih surah lain.",
    enterSurahLabel = "Masukkan nomor surah untuk mulai mencari asbabun nuzul.",
    sourceLabel = "Sumber: Tafsir Ibnu Katsir, Al-Baghawi, Asbabun Nuzul oleh Al-Wahidi",
    ayahPrefixLabel = "QS.",
    validateErrorLabel = "Nomor surah tidak valid (1-114).",
    loadErrorLabel = "Gagal memuat. Coba lagi nanti.",
}) {
    const { t, lang } = useLocale();
    const [surahNumber, setSurahNumber] = useState(initialSurahNumber);
    const [results, setResults] = useState(initialResults);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(initialResults.length > 0);

    const handleSearch = async (e) => {
        e.preventDefault();
        const num = parseInt(surahNumber, 10);
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

    return (
        <div>
            <form
                onSubmit={handleSearch}
                className='flex items-center gap-3 mb-8'
            >
                <div className='flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 px-3 py-2'>
                    <BsSearch className='text-gray-400 shrink-0' />
                    <select
                        value={surahNumber}
                        onChange={(e) => setSurahNumber(e.target.value)}
                        className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer'
                    >
                        <option value=''>
                            -- {t("asbabun.placeholder") || placeholderLabel} --
                        </option>
                        {SURAH_LIST.map((s) => (
                            <option key={s.number} value={s.number}>
                                {s.number}. {s.name} ({s.ayat} ayat)
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type='submit'
                    disabled={isLoading || !surahNumber}
                    className='px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors'
                >
                    {isLoading ? "..." : t("asbabun.search_btn") || searchLabel}
                </button>
            </form>

            <div className='mb-5'>
                <p className='text-xs text-gray-400 mb-2'>
                    {t("asbabun.quick_example") || quickExampleLabel}
                </p>
                <div className='flex gap-2 flex-wrap'>
                    {QUICK_SURAH.map((num) => (
                        <button
                            key={num}
                            type='button'
                            onClick={() => setSurahNumber(String(num))}
                            className='px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600 transition-colors'
                        >
                            {t("asbabun.surah_prefix") || surahPrefixLabel}{" "}
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className='mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm'>
                    {error}
                </div>
            )}

            {isLoading && <SkeletonInline rows={4} />}

            {!isLoading && searched && results.length === 0 && !error && (
                <div className='text-center py-16 text-gray-400 dark:text-gray-600 dark:text-gray-300 text-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
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
                    <p className='text-gray-400 dark:text-gray-600 dark:text-gray-300 text-sm mb-6'>
                        {t("asbabun.enter_surah") || enterSurahLabel}
                    </p>
                    <p className='text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300'>
                        {t("asbabun.source") || sourceLabel}
                    </p>
                </div>
            )}

            <div className='space-y-4'>
                {results.map((item) => (
                    <div
                        key={item.id}
                        className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5'
                    >
                        <div className='flex items-center gap-2 mb-3'>
                            <Link
                                href={asbabunQuranHref(
                                    item,
                                    quranBasePath,
                                    surahNumber,
                                )}
                                className='text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-100 transition-colors'
                            >
                                {asbabunAyahLabel(
                                    item,
                                    t,
                                )}
                            </Link>
                            {item.source && (
                                <SourceBadges source={item.source} />
                            )}
                        </div>
                        <p className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300 leading-relaxed'>
                            {getLocalizedField(item, "content", lang, [
                                "description",
                                "text",
                            ])}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
