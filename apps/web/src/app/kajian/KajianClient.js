"use client";
/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useMemo, useState } from "react";
import { BsPlayCircle, BsSearch, BsYoutube } from "react-icons/bs";
import { MdOutlinePlayLesson } from "react-icons/md";

const TranscriptSearchView = dynamic(
    () => import("./TranscriptSearchView"),
    {
        loading: () => (
            <div className='h-64 rounded-xl bg-emerald-900/10 animate-pulse' />
        ),
        ssr: false,
    },
);

const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    );
    return m ? m[1] : null;
};

const CATEGORIES = [
    { key: "semua", labelKey: "common.all" },
    { key: "aqidah", labelKey: "kajian.category_aqidah" },
    { key: "fiqh", labelKey: "kajian.category_fiqh" },
    { key: "tazkiyah", labelKey: "kajian.category_tazkiyah" },
    { key: "sirah", labelKey: "kajian.category_sirah" },
    { key: "tafsir", labelKey: "kajian.category_tafsir" },
    { key: "hadith", labelKey: "kajian.category_hadith" },
];

const catColor = {
    aqidah: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    fiqh: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    tazkiyah:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    sirah: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    tafsir: "bg-teal-100 text-teal-700 dark:text-teal-400",
    hadith: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function KajianClient({
    kajian: initialKajian = [],
    initialTotal = 0,
    initialTab = "list",
}) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [kajian, setKajian] = useState(initialKajian);
    const [totalKajian, setTotalKajian] = useState(initialTotal || initialKajian.length);
    const [page, setPage] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(
        initialKajian.length < (initialTotal || initialKajian.length),
    );
    const [activeCategory, setActiveCategory] = useState("semua");
    const [search, setSearch] = useState("");
    const [ustadzFilter, setUstadzFilter] = useState("");

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ||
                "https://api-thollabul.jangkauin.site";
            const res = await fetch(`${apiUrl}/api/v1/kajian?page=${nextPage}&size=10`);
            if (res.ok) {
                const data = await res.json();
                const items = data?.items ?? (Array.isArray(data) ? data : []);
                setKajian((prev) => [...prev, ...items]);
                setPage(nextPage);
                const total = data?.total ?? totalKajian;
                setTotalKajian(total);
                setHasMore(!data?.last && items.length > 0 && kajian.length + items.length < total);
            }
        } catch (e) {
            console.error("Failed to load more kajian:", e);
        } finally {
            setLoadingMore(false);
        }
    };

    // Tab: 'list' = daftar kajian (default), 'transcript' = cari transkrip
    const [tab, setTab] = useState(initialTab);

    // Transcript search state
    const [transcriptQuery, setTranscriptQuery] = useState("");
    const [searchMode, setSearchMode] = useState("hybrid");
    const [speakerFilter, setSpeakerFilter] = useState("");
    const [transcriptResults, setTranscriptResults] = useState([]);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [transcriptMeta, setTranscriptMeta] = useState({ total: 0, page: 1 });
    const [speakers, setSpeakers] = useState([]);

    useEffect(() => {
        if (tab !== "transcript" || speakers.length > 0) return;
        let cancelled = false;
        const fetchSpeakers = async () => {
            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "https://api-thollabul.jangkauin.site";
                const res = await fetch(`${apiUrl}/api/v1/kajian/speakers`);
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                setSpeakers(list);
            } catch (e) {
                // ignore
            }
        };
        fetchSpeakers();
        return () => {
            cancelled = true;
        };
    }, [tab, speakers.length]);

    useEffect(() => {
        if (tab !== "transcript") return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            setTranscriptLoading(true);
            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "https://api-thollabul.jangkauin.site";
                const params = new URLSearchParams({
                    q: transcriptQuery || "",
                    mode: searchMode,
                });
                if (speakerFilter) params.set("speaker", speakerFilter);
                params.set("page", "1");
                params.set("limit", "20");

                const res = await fetch(`${apiUrl}/api/v1/kajian/search?${params.toString()}`);
                if (!res.ok) {
                    if (!cancelled) {
                        setTranscriptResults([]);
                        setTranscriptMeta({ total: 0, page: 1 });
                    }
                    return;
                }
                const data = await res.json();
                if (cancelled) return;
                const items = data?.items ?? data?.data?.items ?? (Array.isArray(data) ? data : []);
                const meta = data?.meta ?? data?.data?.meta ?? { total: items.length, page: 1 };
                setTranscriptResults(items);
                setTranscriptMeta(meta);
            } catch (e) {
                if (!cancelled) {
                    setTranscriptResults([]);
                }
            } finally {
                if (!cancelled) {
                    setTranscriptLoading(false);
                }
            }
        }, 350);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [transcriptQuery, searchMode, speakerFilter, tab]);

    const filtered = kajian.filter((k) => {
        const matchCat =
            activeCategory === "semua" || k.category === activeCategory;
        const matchSpeaker =
            !ustadzFilter || k.speaker === ustadzFilter;
        const matchSearch =
            !search ||
            [
                getLocalizedField(k, "title", lang),
                k.ustadz,
                getLocalizedField(k, "description", lang),
                k.category,
                k.duration,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase());
        return matchCat && matchSpeaker && matchSearch;
    });

    const youtubeCount = kajian.filter(
        (item) => item.platform === "youtube" || item.type === "video",
    ).length;
    const categoryCount = new Set(kajian.map((item) => item.category)).size;
    const ustadzOptions = useMemo(
        () =>
            Array.from(
                new Set(kajian.map((k) => k.speaker).filter(Boolean)),
            ).sort(),
        [kajian],
    );

    return (
        <div className={isWide ? "w-full px-2 sm:px-4" : "w-full max-w-6xl mx-auto px-2 sm:px-4"}>
            <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                    <MdOutlinePlayLesson className='text-xl text-emerald-700 dark:text-emerald-400' />
                </div>
                <div>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("kajian.public_title")}
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("kajian.public_subtitle")}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className='flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-4'>
                <button
                    type='button'
                    onClick={() => setTab("transcript")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${tab === "transcript"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                >
                    {t("kajian.tab_search") || "🔍 Cari di Transkrip"}
                </button>
                <button
                    type='button'
                    onClick={() => setTab("list")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${tab === "list"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                >
                    {t("kajian.tab_all") || "📚 Semua Kajian"}
                </button>
            </div>

            {tab === "transcript" ? (
                <TranscriptSearchView
                    query={transcriptQuery}
                    setQuery={setTranscriptQuery}
                    mode={searchMode}
                    setMode={setSearchMode}
                    speaker={speakerFilter}
                    setSpeaker={setSpeakerFilter}
                    speakers={speakers}
                    results={transcriptResults}
                    loading={transcriptLoading}
                    meta={transcriptMeta}
                    t={t}
                />
            ) : (
                <ListView
                    kajian={filtered}
                    totalKajian={totalKajian}
                    youtubeCount={youtubeCount}
                    categoryCount={categoryCount}
                    search={search}
                    setSearch={setSearch}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    ustadzFilter={ustadzFilter}
                    setUstadzFilter={setUstadzFilter}
                    ustadzOptions={ustadzOptions}
                    hasMore={hasMore && !search && activeCategory === "semua" && !ustadzFilter}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    t={t}
                    lang={lang}
                />
            )}

            <p className='text-center text-xs text-gray-400 mt-8'>
                {t("kajian.external_note")}
            </p>
        </div>
    );
}

function ListView({
    kajian,
    totalKajian,
    youtubeCount,
    categoryCount,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    ustadzFilter,
    setUstadzFilter,
    ustadzOptions,
    hasMore,
    loadingMore,
    onLoadMore,
    t,
    lang,
}) {
    return (
        <div>
            <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                <BsSearch className='text-gray-400 shrink-0' />
                <input
                    type='text'
                    placeholder={t("kajian.public_search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                />
                {search && (
                    <button
                        type='button'
                        onClick={() => setSearch("")}
                        className='text-xs font-medium text-emerald-600 dark:text-emerald-400'
                    >
                        {t("common.clear")}
                    </button>
                )}
            </div>

            <div className='grid grid-cols-3 gap-2 sm:gap-3 mb-4'>
                <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                        {t("kajian.total_label")}
                    </p>
                    <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                        {totalKajian}
                    </p>
                </div>
                <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                        {t("kajian.youtube_label")}
                    </p>
                    <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                        {youtubeCount}
                    </p>
                </div>
                <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                        {t("kajian.categories_label")}
                    </p>
                    <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                        {categoryCount}
                    </p>
                </div>
            </div>

            <div className='flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide'>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${activeCategory === cat.key
                            ? "bg-emerald-700 text-white"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                            }`}
                    >
                        {t(cat.labelKey)}
                    </button>
                ))}
            </div>

            {ustadzOptions.length > 0 && (
                <div className='mb-5'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400 mb-1.5'>
                        {t("kajian.transcript_filter_speaker") || "Filter Ustadz"}
                    </p>
                    <div className='flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide'>
                        <button
                            type='button'
                            onClick={() => setUstadzFilter("")}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${!ustadzFilter
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                                }`}
                        >
                            {t("kajian.transcript_all_speakers") || "Semua"}
                        </button>
                        {ustadzOptions.map((s) => (
                            <button
                                key={s}
                                type='button'
                                onClick={() => setUstadzFilter(s)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${ustadzFilter === s
                                    ? "bg-emerald-600 text-white"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                                    }`}
                            >
                                {s.replace(/^Ust\.\s*Dr\.\s*/i, "Ust. ")}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className='mb-4 flex items-center justify-between text-xs text-gray-400'>
                <span>
                    {kajian.length} {t("kajian.results_found")}
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

            {kajian.length === 0 ? (
                <div className='text-center py-16 text-gray-400'>
                    <BsPlayCircle className='text-4xl mx-auto mb-3' />
                    <p className='text-sm'>{t("kajian.not_found")}</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {kajian.map((k) => (
                        <a
                            key={k.id}
                            href={k.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all p-4 flex flex-col gap-3'
                        >
                            {k.platform === "youtube" && (
                                <BsYoutube className='text-red-500 text-lg' />
                            )}
                            {getYouTubeId(k.url) && (
                                <div className='aspect-video rounded-lg overflow-hidden bg-black relative group/thumb'>
                                    <img
                                        src={`https://img.youtube.com/vi/${getYouTubeId(k.url)}/mqdefault.jpg`}
                                        alt={k.title}
                                        loading='lazy'
                                        className='w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300'
                                    />
                                    <div className='absolute inset-0 bg-black/20 flex items-center justify-center group-hover/thumb:bg-black/30 transition-colors'>
                                        <div className='w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform'>
                                            <BsPlayCircle className='text-2xl ml-0.5' />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className='font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1'>
                                    {k.title}
                                </p>
                                <p className='text-xs text-gray-400'>
                                    {k.speaker} ·{" "}
                                    {k.duration
                                        ? `${Math.floor(k.duration / 60)}m`
                                        : ""}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className='text-center mt-6'>
                    <button
                        type='button'
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className='px-6 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors'
                    >
                        {loadingMore
                            ? (t("kajian.loading") || "Memuat...")
                            : (t("common.load_more") || "Muat Lebih")}
                    </button>
                </div>
            )}
        </div>
    );
}
