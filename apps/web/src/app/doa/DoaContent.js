"use client";

import { ShareDoaModal } from "@/components/ShareDoaModal";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import SourceBadges from "@/components/SourceBadges";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { doaApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useRef, useState } from "react";
import {
    BsPauseFill,
    BsPlayFill,
    BsSearch,
    BsShare,
    BsVolumeUpFill,
} from "react-icons/bs";

const CATEGORIES = [
    { value: "", labelKey: "common.all" },
    { value: "pagi", labelKey: "doa.cat.morning" },
    { value: "petang", labelKey: "doa.cat.evening" },
    { value: "makan", labelKey: "doa.cat.eating" },
    { value: "tidur", labelKey: "doa.cat.sleeping" },
    { value: "bangun", labelKey: "doa.cat.wakeup" },
    { value: "kamar_mandi", labelKey: "doa.cat.bathroom" },
    { value: "masjid", labelKey: "doa.cat.mosque" },
    { value: "safar", labelKey: "doa.cat.travel" },
    { value: "belajar", labelKey: "doa.cat.study" },
    { value: "umum", labelKey: "doa.cat.general" },
];

const PAGE_SIZE = 20;

/**
 * `initialItems` is the first page rendered on the server, so the list is in
 * the HTML for crawlers and the reader sees content on first paint instead of
 * a skeleton. Client-side paging and filtering take over from there.
 */
export const DoaContent = ({ initialItems = [] }) => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [doas, setDoas] = useState(initialItems);
    const [isLoading, setIsLoading] = useState(initialItems.length === 0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState(null);
    const [playing, setPlaying] = useState(null);
    const [sharePopUp, setSharePopUp] = useState(false);
    const [shareDoa, setShareDoa] = useState(null);
    const audioRef = useRef(null);
    const sentinelRef = useRef(null);

    const openShare = (doa) => {
        setShareDoa(doa);
        setSharePopUp(true);
    };

    const closeShare = () => {
        setSharePopUp(false);
        setShareDoa(null);
    };

    const playAudio = (url) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        const a = new Audio(url);
        audioRef.current = a;
        a.onended = () => setPlaying(null);
        a.play();
        setPlaying(url);
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlaying(null);
    };

    const fetchPage = (cat, pageNum, append) => {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);
        const req = cat
            ? doaApi.byCategory(cat, pageNum, PAGE_SIZE, lang)
            : doaApi.list(pageNum, PAGE_SIZE, lang);
        req.then((r) => r.json())
            .then((data) => {
                const items = data?.items ?? data ?? [];
                setDoas((prev) => (append ? [...prev, ...items] : items));
                setHasMore(items.length >= PAGE_SIZE);
            })
            .catch(() => {
                setHasMore(false);
            })
            .finally(() => {
                if (append) setIsLoadingMore(false);
                else setIsLoading(false);
            });
    };

    const hasServerDataRef = useRef(initialItems.length > 0);

    useEffect(() => {
        setPage(0);
        // Skip the duplicate request for the page the server already rendered (only on default initial language).
        if (hasServerDataRef.current && !category && lang === "ID") {
            hasServerDataRef.current = false;
            setHasMore(initialItems.length >= PAGE_SIZE);
            return;
        }
        hasServerDataRef.current = false;
        fetchPage(category, 0, false);
    }, [category, lang]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (page === 0) return;
        fetchPage(category, page, true);
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    hasMore &&
                    !isLoading &&
                    !isLoadingMore
                ) {
                    setPage((p) => p + 1);
                }
            },
            { rootMargin: "100px" },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasMore, isLoading, isLoadingMore]);

    const filtered = doas.filter((d) => {
        if (!search) return true;
        const query = search.toLowerCase();
        const haystack = [
            getLocalizedField(d, "title", lang, ["name"]),
            getLocalizedField(d, "description", lang, [
                "meaning",
                "translation",
            ]),
            d.transliteration,
            d.source,
            d.category,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return haystack.includes(query);
    });

    return (
        <>
            <div
                className={
                    isWide ? "w-full px-4" : "container mx-auto px-4 max-w-3xl"
                }
            >
                <div className='text-center mb-8'>
                    <p
                        className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                        style={{ fontFamily: "Amiri, serif" }}
                    >
                        الدُّعَاء
                    </p>
                    <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                        {t("doa.title")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("doa.subtitle")}
                    </p>
                </div>

                <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 px-3 py-2'>
                    <BsSearch className='text-gray-400 shrink-0' />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("doa.search_placeholder")}
                        className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                    />
                </div>

                <div className='flex gap-2 flex-wrap mb-6'>
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setCategory(c.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                category === c.value
                                    ? "bg-emerald-700 text-white"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                            }`}
                        >
                            {t(c.labelKey)}
                        </button>
                    ))}
                </div>

                <div className='mb-3 flex items-center justify-between text-xs text-gray-400'>
                    <span>
                        {t("common.showing")} {filtered.length} {t("common.of")}{" "}
                        {doas.length} {t("doa.unit")}
                    </span>
                    {search && (
                        <button
                            type='button'
                            onClick={() => setSearch("")}
                            className='font-medium text-emerald-600 dark:text-emerald-400'
                        >
                            {t("common.reset_search")}
                        </button>
                    )}
                </div>

                {isLoading && <SkeletonInline rows={5} />}

                {!isLoading && filtered.length === 0 && (
                    <div className='text-center py-16'>
                        <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                            {doas.length === 0
                                ? t("doa.empty_unavailable")
                                : t("doa.no_match")}
                        </p>
                    </div>
                )}

                <div className='space-y-3'>
                    {filtered.map((doa) => (
                        <div
                            key={doa.id}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                        >
                            <button
                                className='w-full text-left px-4 py-3 flex items-center justify-between gap-3'
                                onClick={() =>
                                    setExpanded(
                                        expanded === doa.id ? null : doa.id,
                                    )
                                }
                            >
                                <div className='flex items-center gap-2 flex-wrap min-w-0'>
                                    <span className='text-sm font-semibold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                                        {getLocalizedField(doa, "title", lang, [
                                            "name",
                                        ])}
                                    </span>
                                    {doa.category && (
                                        <span className='text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full'>
                                            {t(
                                                CATEGORIES.find(
                                                    (item) =>
                                                        item.value ===
                                                        doa.category,
                                                )?.labelKey,
                                            ) || doa.category}
                                        </span>
                                    )}
                                    {doa.audio_url && (
                                        <BsVolumeUpFill className='text-emerald-500 text-xs' />
                                    )}
                                </div>
                                <span className='text-gray-400 text-xs shrink-0'>
                                    {expanded === doa.id ? "▲" : "▼"}
                                </span>
                            </button>

                            {expanded === doa.id && (
                                <div className='px-4 pb-4 border-t border-gray-50 dark:border-slate-700 pt-3 space-y-3'>
                                    <p
                                        className='text-2xl leading-[2.2] text-right font-kitab text-emerald-900 dark:text-emerald-300 dark:text-white'
                                        style={{
                                            direction: "rtl",
                                            fontFamily: "Amiri, serif",
                                        }}
                                    >
                                        {doa.translation?.ar}
                                    </p>
                                    {doa.translation?.latin_idn && (
                                        <p className='text-sm italic text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                            {doa.translation.latin_idn}
                                        </p>
                                    )}
                                    <p className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                        {getLocalizedField(
                                            doa,
                                            "description",
                                            lang,
                                            ["meaning"],
                                        )}
                                    </p>
                                    {doa.audio_url && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playing === doa.audio_url
                                                    ? stopAudio()
                                                    : playAudio(doa.audio_url);
                                            }}
                                            className='flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors'
                                        >
                                            {playing === doa.audio_url ? (
                                                <BsPauseFill />
                                            ) : (
                                                <BsPlayFill />
                                            )}
                                            {playing === doa.audio_url
                                                ? t("common.pause")
                                                : t("asmaul.play_audio")}
                                        </button>
                                    )}
                                    {doa.source && (
                                        <SourceBadges source={doa.source} />
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openShare(doa);
                                        }}
                                        className='flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors'
                                    >
                                        <BsShare className='text-sm' />
                                        {t("common.share")}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {isLoadingMore && (
                    <div className='flex justify-center py-6'>
                        <div className='w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                    </div>
                )}

                <div ref={sentinelRef} className='h-1' />

                {!hasMore && doas.length > 0 && !isLoading && (
                    <p className='text-center text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300 py-4'>
                        {t("doa.all_shown")}
                    </p>
                )}
            </div>

            <ShareDoaModal
                isOpen={sharePopUp}
                onClose={closeShare}
                doa={shareDoa}
            />
        </>
    );
};
