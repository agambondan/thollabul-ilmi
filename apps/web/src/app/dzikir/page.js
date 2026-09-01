"use client";

import Section from "@/components/Section";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { dzikirApi, dzikirLogApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useRef, useState } from "react";
import {
    BsCheckCircleFill,
    BsCircle,
    BsPauseFill,
    BsPlayFill,
    BsSearch,
    BsVolumeUpFill,
} from "react-icons/bs";
import SourceBadges from "@/components/SourceBadges";

const CATEGORIES = [
    { value: "", labelKey: "common.all" },
    { value: "pagi", labelKey: "dzikir.category_morning" },
    { value: "petang", labelKey: "dzikir.category_evening" },
    { value: "setelah_sholat", labelKey: "dzikir.category_after_prayer" },
    { value: "tidur", labelKey: "dzikir.category_sleep" },
    { value: "safar", labelKey: "dzikir.category_travel" },
    { value: "dzikir_umum", labelKey: "dzikir.category_general" },
];

const PAGE_SIZE = 20;

export const DzikirContent = () => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const { isAuthenticated } = useAuth();
    const [dzikirList, setDzikirList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState(null);
    const [error, setError] = useState("");
    // logged: Map<dzikirId, logRecordId> for today
    const [logged, setLogged] = useState({});
    const [playing, setPlaying] = useState(null);
    const audioRef = useRef(null);
    const sentinelRef = useRef(null);

    const playAudio = (url) => {
        if (audioRef.current) audioRef.current.pause();
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
        else {
            setIsLoading(true);
            setError("");
        }
        const req = cat
            ? dzikirApi.byCategory(cat, pageNum, PAGE_SIZE)
            : dzikirApi.list(pageNum, PAGE_SIZE);
        req.then((r) => {
            if (!r.ok) throw new Error(t("common.network_error"));
            return r.json();
        })
            .then((data) => {
                const items = data?.items ?? data ?? [];
                setDzikirList((prev) => (append ? [...prev, ...items] : items));
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

    useEffect(() => {
        setPage(0);
        fetchPage(category, 0, false);
    }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

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

    useEffect(() => {
        if (!isAuthenticated) return;
        dzikirLogApi
            .today()
            .then((r) => r.json())
            .then((data) => {
                const items = Array.isArray(data?.items ?? data)
                    ? (data?.items ?? data)
                    : [];
                const map = {};
                items.forEach((l) => {
                    map[l.dzikir_id] = l.id;
                });
                setLogged(map);
            })
            .catch((e) => console.error(e));
    }, [isAuthenticated]);

    const toggleLog = async (dzikir) => {
        const existingLogId = logged[dzikir.id];
        if (existingLogId) {
            await dzikirLogApi
                .delete(existingLogId)
                .catch((e) => console.error(e));
            setLogged((prev) => {
                const next = { ...prev };
                delete next[dzikir.id];
                return next;
            });
        } else {
            const res = await dzikirLogApi
                .log(dzikir.id, dzikir.category)
                .catch(() => null);
            if (res?.ok) {
                const data = await res.json();
                setLogged((prev) => ({
                    ...prev,
                    [dzikir.id]: data?.data?.id ?? data?.id ?? true,
                }));
            }
        }
    };

    const filtered = dzikirList.filter((d) => {
        if (!search) return true;
        const query = search.toLowerCase();
        const haystack = [
            getLocalizedField(d, "title", lang, ["name"]),
            getLocalizedField(d, "description", lang, [
                "meaning",
                "translation",
            ]),
            d.translation?.latin_idn,
            d.source,
            getLocalizedField(d, "fadhilah", lang, ["virtue"]),
            d.category,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return haystack.includes(query);
    });

    return (
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
                    الذِّكْر
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-1'>
                    {t("dzikir.public_title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("dzikir.public_subtitle")}
                </p>
            </div>

            <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                <BsSearch className='text-gray-400 shrink-0' />
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("dzikir.search_placeholder")}
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
                    {dzikirList.length} {t("dzikir.unit")}
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

            {error && (
                <div className='mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm'>
                    {error}
                </div>
            )}

            {isLoading && <SkeletonInline rows={5} />}

            {!isLoading && filtered.length === 0 && !error && (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <p className='text-gray-500 dark:text-gray-400'>
                        {dzikirList.length === 0
                            ? t("dzikir.unavailable")
                            : t("dzikir.no_match")}
                    </p>
                </div>
            )}

            <div className='space-y-3'>
                {filtered.map((dzikir) => {
                    const isDone = !!logged[dzikir.id];
                    return (
                        <div
                            key={dzikir.id}
                            className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden transition-colors ${
                                isDone
                                    ? "border-emerald-300 dark:border-emerald-700"
                                    : "border-gray-100 dark:border-slate-700"
                            }`}
                        >
                            <div className='px-4 py-3 flex items-center justify-between gap-3'>
                                <button
                                    className='flex-1 text-left flex items-center gap-2 min-w-0'
                                    onClick={() =>
                                        setExpanded(
                                            expanded === dzikir.id
                                                ? null
                                                : dzikir.id,
                                        )
                                    }
                                >
                                    <div className='min-w-0'>
                                        <span className='text-sm font-semibold text-emerald-900 dark:text-white'>
                                            {getLocalizedField(
                                                dzikir,
                                                "title",
                                                lang,
                                                ["name"],
                                            )}
                                        </span>
                                        {dzikir.category && (
                                            <span className='ml-2 text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full'>
                                                {t(
                                                    CATEGORIES.find(
                                                        (item) =>
                                                            item.value ===
                                                            dzikir.category,
                                                    )?.labelKey,
                                                ) ||
                                                    dzikir.category.replace(
                                                        "_",
                                                        " ",
                                                    )}
                                            </span>
                                        )}
                                        {dzikir.count && dzikir.count > 1 && (
                                            <span className='ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full'>
                                                ×{dzikir.count}
                                            </span>
                                        )}
                                        {dzikir.audio_url && (
                                            <BsVolumeUpFill className='ml-1 text-emerald-500 text-xs inline-block' />
                                        )}
                                    </div>
                                    <span className='text-gray-400 text-xs shrink-0 ml-auto'>
                                        {expanded === dzikir.id ? "▲" : "▼"}
                                    </span>
                                </button>
                                {isAuthenticated && (
                                    <button
                                        type='button'
                                        onClick={() => toggleLog(dzikir)}
                                        title={
                                            isDone
                                                ? (t("dzikir.mark_undone") ??
                                                  "Batalkan")
                                                : (t("dzikir.mark_done") ??
                                                  "Tandai selesai")
                                        }
                                        className={`shrink-0 text-xl transition-colors ${
                                            isDone
                                                ? "text-emerald-500 dark:text-emerald-400"
                                                : "text-gray-300 dark:text-slate-600 hover:text-emerald-400"
                                        }`}
                                    >
                                        {isDone ? (
                                            <BsCheckCircleFill />
                                        ) : (
                                            <BsCircle />
                                        )}
                                    </button>
                                )}
                            </div>

                            {expanded === dzikir.id && (
                                <div className='px-4 pb-4 border-t border-gray-50 dark:border-slate-700 pt-3 space-y-3'>
                                    <p
                                        className='text-2xl leading-[2.2] text-right font-kitab text-emerald-900 dark:text-white'
                                        style={{
                                            direction: "rtl",
                                            fontFamily: "Amiri, serif",
                                        }}
                                    >
                                        {dzikir.translation?.ar}
                                    </p>
                                    {dzikir.translation?.latin_idn && (
                                        <p className='text-sm italic text-gray-500 dark:text-gray-400'>
                                            {dzikir.translation.latin_idn}
                                        </p>
                                    )}
                                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                                        {getLocalizedField(
                                            dzikir,
                                            "description",
                                            lang,
                                            ["meaning"],
                                        )}
                                    </p>
                                    {getLocalizedField(
                                        dzikir,
                                        "fadhilah",
                                        lang,
                                        ["virtue"],
                                    ) && (
                                        <div className='bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2'>
                                            <p className='text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5'>
                                                {t("dzikir.fadhilah")}
                                            </p>
                                            <p className='text-xs text-amber-600 dark:text-amber-300'>
                                                {getLocalizedField(
                                                    dzikir,
                                                    "fadhilah",
                                                    lang,
                                                    ["virtue"],
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {dzikir.audio_url && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playing === dzikir.audio_url
                                                    ? stopAudio()
                                                    : playAudio(
                                                          dzikir.audio_url,
                                                      );
                                            }}
                                            className='flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors'
                                        >
                                            {playing === dzikir.audio_url ? (
                                                <BsPauseFill />
                                            ) : (
                                                <BsPlayFill />
                                            )}
                                            {playing === dzikir.audio_url
                                                ? t("common.pause")
                                                : t("asmaul.play_audio")}
                                        </button>
                                    )}
                                    {dzikir.source && (
                                        <SourceBadges source={dzikir.source} />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isLoadingMore && (
                <div className='flex justify-center py-6'>
                    <div className='w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                </div>
            )}

            <div ref={sentinelRef} className='h-1' />

            {!hasMore && dzikirList.length > 0 && !isLoading && (
                <p className='text-center text-xs text-gray-400 dark:text-gray-600 py-4'>
                    {t("dzikir.all_displayed")}
                </p>
            )}
        </div>
    );
};

const DzikirPage = () => (
    <main className='min-h-screen flex flex-col'>
        <Section>
            <DzikirContent />
        </Section>
    </main>
);

export default DzikirPage;
