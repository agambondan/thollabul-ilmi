"use client";

import { useLocale } from "@/context/Locale";
import { quranApi } from "@/lib/api";
import { QURAN_FONTS, useQuranFont } from "@/lib/useQuranFont";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const MIN_PAGE = 1;
const MAX_PAGE = 604;

const clampPage = (page) => Math.max(MIN_PAGE, Math.min(MAX_PAGE, page || 1));
const readInitialPage = () => {
    if (typeof window === "undefined") return 1;
    return clampPage(
        Number(new URLSearchParams(window.location.search).get("page")),
    );
};
const syncPageUrl = (page) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}?${url.searchParams}${url.hash}`,
    );
};
const toArabicNumber = (n) =>
    String(n)
        .split("")
        .map((d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d)
        .join("");
const getItems = (data) =>
    Array.isArray(data) ? data : (data?.items ?? data?.data?.items ?? []);
const getArabic = (ayah) =>
    ayah?.translation?.ar_html || ayah?.translation?.ar || "";
const getTranslation = (ayah, lang) => {
    const key = lang === "EN" ? "en" : "idn";
    return (
        ayah?.translation?.[key] ||
        ayah?.translation?.idn ||
        ayah?.translation?.en ||
        ""
    );
};
const getSurahNumber = (ayah) => ayah?.surah?.number || ayah?.surah_id || "";
const getSurahName = (ayah, lang) => {
    const s = ayah?.surah ?? {};
    const key = lang === "EN" ? "latin_en" : "latin_idn";
    return (
        s?.translation?.[key] ||
        s?.translation?.latin_idn ||
        s?.translation?.latin_en ||
        s?.slug ||
        ""
    );
};
const stripTags = (html) => (html || "").replace(/<[^>]+>/g, "");

const pageMeta = (ayahs, lang, page, fallback) => {
    const first = ayahs[0] ?? {};
    const names = [];
    for (const ayah of ayahs) {
        const label =
            `${getSurahNumber(ayah)}. ${getSurahName(ayah, lang)}`.trim();
        if (label && !names.includes(label)) names.push(label);
    }
    return {
        juz: first.juz_number || first.juz || fallback,
        page: first.page || page,
        surah: names.join(" / ") || fallback,
    };
};

export default function MushafPageReader() {
    const { t, lang } = useLocale();
    const { fontCls, fontId, setFont, arabicFontSize, setArabicFontSize } =
        useQuranFont();
    const [page, setPage] = useState(1);
    const inputRef = useRef(null);
    const [ayahs, setAyahs] = useState([]);
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTranslation, setShowTranslation] = useState(false);
    const touchX = useRef(null);

    useEffect(() => {
        setPage(readInitialPage());
    }, []);

    const fetchPageData = useCallback(async (nextPage) => {
        const [ayahRes, wordRes] = await Promise.all([
            quranApi.byPage(nextPage),
            quranApi.mufrodatByPage(nextPage),
        ]);
        const [ayahData, wordData] = await Promise.all([
            ayahRes.json(),
            wordRes.json(),
        ]);
        return {
            ayahs: getItems(ayahData),
            words: getItems(wordData),
        };
    }, []);

    useEffect(() => {
        let active = true;
        fetchPageData(page)
            .then((data) => {
                if (!active) return;
                setAyahs(data.ayahs);
                setWords(data.words);
            })
            .catch(() => {
                if (!active) return;
                setAyahs([]);
                setWords([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [page, fetchPageData]);

    const goToPage = useCallback((nextPage) => {
        setLoading(true);
        setPage(clampPage(nextPage));
    }, []);
    const goInputPage = () =>
        goToPage(clampPage(Number(inputRef.current?.value)));

    useEffect(() => {
        syncPageUrl(page);
    }, [page]);

    useEffect(() => {
        const onPop = () => setPage(readInitialPage());
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (loading) return;
            if (e.key === "ArrowLeft") goToPage(page + 1);
            if (e.key === "ArrowRight") goToPage(page - 1);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [goToPage, loading, page]);
    const meta = useMemo(
        () => pageMeta(ayahs, lang, page, t("mushaf.placeholder")),
        [ayahs, lang, page, t],
    );
    const wordsByAyah = useMemo(() => {
        const map = new Map();
        for (const word of words) {
            const ayahId = word.ayah_id || word.ayah?.id;
            if (!map.has(ayahId)) map.set(ayahId, []);
            map.get(ayahId).push(word);
        }
        for (const list of map.values()) {
            list.sort((a, b) => (a.word_index || 0) - (b.word_index || 0));
        }
        return map;
    }, [words]);

    const handleTouchEnd = (e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 50) return;
        goToPage(page + (dx < 0 ? 1 : -1));
    };

    return (
        <div className='space-y-4'>
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-3'>
                <div className='flex gap-2'>
                    <input
                        ref={inputRef}
                        type='number'
                        inputMode='numeric'
                        min={MIN_PAGE}
                        max={MAX_PAGE}
                        defaultValue={page}
                        key={page}
                        className='min-w-0 flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-700 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-emerald-500'
                        aria-label={t("mushaf.go_to_page")}
                    />
                    <button
                        type='button'
                        onClick={goInputPage}
                        disabled={loading}
                        className='px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50'
                    >
                        {loading ? t("common.loading") : t("mushaf.go")}
                    </button>
                </div>
                <div className='flex flex-wrap gap-1.5'>
                    {QURAN_FONTS.map((f) => (
                        <button
                            key={f.id}
                            type='button'
                            onClick={() => setFont(f.id)}
                            aria-pressed={fontId === f.id}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                fontId === f.id
                                    ? "bg-emerald-700 text-white"
                                    : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                            }`}
                        >
                            {t(`mushaf.font_${f.id}`, {
                                defaultValue: f.label,
                            })}
                        </button>
                    ))}
                    <button
                        type='button'
                        onClick={() => setShowTranslation((v) => !v)}
                        className='px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                    >
                        {showTranslation
                            ? t("mushaf.translation_off")
                            : t("mushaf.translation_on")}
                    </button>
                </div>
            </div>

            <div
                className='mx-auto max-w-[430px] select-none bg-[#fff9dc] text-slate-950 dark:text-slate-100 rounded-[1.6rem] border-[6px] border-emerald-500 shadow-xl overflow-hidden ring-2 ring-amber-300'
                onTouchStart={(e) => {
                    touchX.current = e.touches[0].clientX;
                }}
                onTouchEnd={handleTouchEnd}
            >
                <div className='h-3 bg-[repeating-linear-gradient(90deg,#0f766e_0_10px,#f59e0b_10px_16px,#14b8a6_16px_26px,#fef3c7_26px_30px)]' />
                <div className='grid grid-cols-3 gap-2 bg-[#fff4bf] px-3 py-2 text-[11px] font-bold text-center border-y-2 border-emerald-500'>
                    <div>
                        <p className='text-[9px] tracking-widest text-amber-700 dark:text-amber-400 uppercase'>
                            {t("mushaf.juz")}
                        </p>
                        <p className='rounded-full bg-white border border-emerald-500 py-0.5'>
                            {meta.juz}
                        </p>
                    </div>
                    <div>
                        <p className='text-[9px] tracking-widest text-amber-700 dark:text-amber-400 uppercase'>
                            {t("mushaf.page")}
                        </p>
                        <p className='rounded-full bg-white border border-emerald-500 py-0.5'>
                            {meta.page}
                        </p>
                    </div>
                    <div>
                        <p className='text-[9px] tracking-widest text-amber-700 dark:text-amber-400 uppercase'>
                            {t("mushaf.surah")}
                        </p>
                        <p className='rounded-full bg-white border border-emerald-500 py-0.5 truncate'>
                            {meta.surah}
                        </p>
                    </div>
                </div>

                <div className='min-h-[720px] bg-[linear-gradient(180deg,rgba(16,185,129,0.08)_0,rgba(16,185,129,0)_56px)] p-3 space-y-2'>
                    {loading && (
                        <div className='text-center py-24 text-sm text-gray-500 dark:text-gray-300'>
                            {t("common.loading")}
                        </div>
                    )}
                    {!loading &&
                        ayahs.map((ayah) => {
                            const wordList = wordsByAyah.get(ayah.id) ?? [];
                            const translation = getTranslation(ayah, lang);
                            return (
                                <section
                                    key={ayah.id}
                                    className='border-b border-dashed border-emerald-200 pb-1.5 last:border-b-0'
                                >
                                    <div
                                        className='flex flex-row-reverse flex-wrap justify-start gap-x-0.5 gap-y-1.5 text-right'
                                        dir='rtl'
                                    >
                                        {wordList.length ? (
                                            wordList.map((word) => (
                                                <span
                                                    key={word.id}
                                                    className='inline-flex min-w-[3.25rem] flex-col items-center border-l border-rose-200 px-0.5'
                                                    dir='rtl'
                                                >
                                                    <span
                                                        className={`${fontCls} leading-tight text-slate-950`}
                                                        style={{
                                                            fontSize: `${Math.max(24, arabicFontSize - 8)}px`,
                                                        }}
                                                    >
                                                        {word.arabic}
                                                    </span>
                                                    <span
                                                        className='text-[10px] leading-tight text-rose-600'
                                                        dir='ltr'
                                                    >
                                                        {word.transliteration}
                                                    </span>
                                                    <span
                                                        className='text-[10px] leading-tight text-slate-700 dark:text-slate-200'
                                                        dir='ltr'
                                                    >
                                                        {word.indonesian}
                                                    </span>
                                                </span>
                                            ))
                                        ) : (
                                            <span
                                                className={`${fontCls} text-[2rem] leading-loose`}
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHtml(
                                                        getArabic(ayah),
                                                    ),
                                                }}
                                            />
                                        )}
                                        <span
                                            className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-white text-base font-bold text-rose-700 dark:text-rose-400'
                                            dir='ltr'
                                        >
                                            {toArabicNumber(ayah.number)}
                                        </span>
                                    </div>
                                    {showTranslation && translation && (
                                        <p className='mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200'>
                                            <span className='font-semibold'>
                                                {ayah.number}.{" "}
                                            </span>
                                            {translation}
                                        </p>
                                    )}
                                </section>
                            );
                        })}
                </div>
                <div className='h-3 bg-[repeating-linear-gradient(90deg,#fef3c7_0_4px,#14b8a6_4px_14px,#f59e0b_14px_20px,#0f766e_20px_30px)]' />
            </div>

            <div className='sticky bottom-4 z-10 mx-auto flex max-w-[430px] items-center justify-between gap-2 rounded-full bg-white/90 dark:bg-slate-800/90 p-1 shadow-lg border border-gray-200 dark:border-gray-700 dark:border-slate-700'>
                <button
                    type='button'
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= MIN_PAGE || loading}
                    className='px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 disabled:opacity-40'
                >
                    {t("mushaf.prev_page")}
                </button>
                <button
                    type='button'
                    onClick={() => setArabicFontSize(arabicFontSize - 4)}
                    className='h-9 w-9 rounded-full text-lg font-bold text-emerald-700 dark:text-emerald-400'
                    aria-label={t("mushaf.zoom_out")}
                >
                    −
                </button>
                <button
                    type='button'
                    onClick={() => setArabicFontSize(arabicFontSize + 4)}
                    className='h-9 w-9 rounded-full text-lg font-bold text-emerald-700 dark:text-emerald-400'
                    aria-label={t("mushaf.zoom_in")}
                >
                    +
                </button>
                <button
                    type='button'
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= MAX_PAGE || loading}
                    className='px-4 py-2 rounded-full text-sm font-medium bg-emerald-700 text-white disabled:opacity-40'
                >
                    {t("mushaf.next_page")}
                </button>
            </div>
        </div>
    );
}
