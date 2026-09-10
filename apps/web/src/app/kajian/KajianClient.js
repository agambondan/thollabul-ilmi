"use client";
/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, PlayCircleIcon } from "@/components/icons/Icon";

const SpeakerMultiSelectDropdown = dynamic(
    () => import("./SpeakerMultiSelectDropdown"),
    { ssr: false },
);

const SavedBookmarksView = dynamic(() => import("./SavedBookmarksView"), {
    loading: () => <div className='h-32 rounded-xl bg-amber-900/10 animate-pulse' />,
    ssr: false,
});

const SavedNotesView = dynamic(() => import("./SavedNotesView"), {
    loading: () => <div className='h-32 rounded-xl bg-emerald-900/10 animate-pulse' />,
    ssr: false,
});
const TranscriptPlayerModal = dynamic(
    () =>
        import("./TranscriptSearchView").then(
            (mod) => mod.TranscriptPlayerModal,
        ),
    { ssr: false },
);

const TranscriptSearchView = dynamic(() => import("./TranscriptSearchView"), {
    loading: () => (
        <div className='h-64 rounded-xl bg-emerald-900/10 animate-pulse' />
    ),
    ssr: false,
});

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

export default function KajianClient({
    kajian: initialKajian = [],
    initialTotal = 0,
    initialTab = "list",
    initialQuery = "",
}) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [kajian, setKajian] = useState(initialKajian);
    const [totalKajian, setTotalKajian] = useState(
        initialTotal || initialKajian.length,
    );
    const [page, setPage] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(
        initialKajian.length < (initialTotal || initialKajian.length),
    );
    const [activeCategory, setActiveCategory] = useState("semua");
    const [search, setSearch] = useState("");
    const [selectedSpeakers, setSelectedSpeakers] = useState([]);
    const [playingKajian, setPlayingKajian] = useState(null);

    const [speakers, setSpeakers] = useState([]);
    const speakersFetchedRef = useRef(false);
    const ustadzFetchedRef = useRef(false);

    useEffect(() => {
        if (speakersFetchedRef.current) return;
        speakersFetchedRef.current = true;
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
                const list = Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                      ? data
                      : [];
                setSpeakers(list);
            } catch (e) {
                speakersFetchedRef.current = false;
            }
        };
        const timer = setTimeout(fetchSpeakers, 1000);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (selectedSpeakers.length === 0 && !ustadzFetchedRef.current) return;
        ustadzFetchedRef.current = true;
        let cancelled = false;
        const fetchBySpeaker = async () => {
            setLoadingMore(true);
            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "https://api-thollabul.jangkauin.site";
                const params = new URLSearchParams({ page: "0", size: "12" });
                if (selectedSpeakers.length > 0) {
                    params.set("speaker", selectedSpeakers.join("||"));
                }
                const res = await fetch(
                    `${apiUrl}/api/v1/kajian?${params.toString()}`,
                );
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const items = data?.items ?? (Array.isArray(data) ? data : []);
                const total = data?.total ?? items.length;
                setKajian(items);
                setTotalKajian(total);
                setPage(0);
                setHasMore(
                    !data?.last && items.length > 0 && items.length < total,
                );
            } catch (e) {
                // ignore
            } finally {
                if (!cancelled) setLoadingMore(false);
            }
        };
        fetchBySpeaker();
        return () => {
            cancelled = true;
        };
    }, [selectedSpeakers]);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ||
                "https://api-thollabul.jangkauin.site";
            const params = new URLSearchParams({
                page: String(nextPage),
                size: "12",
            });
            if (selectedSpeakers.length > 0) {
                params.set("speaker", selectedSpeakers.join("||"));
            }
            const res = await fetch(
                `${apiUrl}/api/v1/kajian?${params.toString()}`,
            );
            if (res.ok) {
                const data = await res.json();
                const items = data?.items ?? (Array.isArray(data) ? data : []);
                setKajian((prev) => [...prev, ...items]);
                setPage(nextPage);
                const total = data?.total ?? totalKajian;
                setTotalKajian(total);
                setHasMore(
                    !data?.last &&
                        items.length > 0 &&
                        kajian.length + items.length < total,
                );
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
    const [transcriptQuery, setTranscriptQuery] = useState(initialQuery);
    const [searchMode, setSearchMode] = useState("hybrid");
    const [transcriptSelectedSpeakers, setTranscriptSelectedSpeakers] = useState([]);
    const [transcriptResults, setTranscriptResults] = useState([]);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [transcriptLoadingMore, setTranscriptLoadingMore] = useState(false);
    const [transcriptMeta, setTranscriptMeta] = useState({ total: 0, page: 1 });
    const [transcriptPage, setTranscriptPage] = useState(1);
    // Bumped whenever the search inputs change so an in-flight "load more"
    // for the previous query is discarded instead of appended.
    const transcriptRequestRef = useRef(0);

    const buildTranscriptParams = (page) => {
        const params = new URLSearchParams({
            q: transcriptQuery || "",
            mode: searchMode,
        });
        if (transcriptSelectedSpeakers.length > 0) {
            params.set("speaker", transcriptSelectedSpeakers.join("||"));
        }
        params.set("page", String(page));
        params.set("limit", "20");
        return params;
    };

    useEffect(() => {
        if (tab !== "transcript") return;
        transcriptRequestRef.current += 1;
        setTranscriptPage(1);
        if (!transcriptQuery.trim()) {
            setTranscriptResults([]);
            setTranscriptMeta({ total: 0, page: 1 });
            setTranscriptLoading(false);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            setTranscriptLoading(true);
            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "https://api-thollabul.jangkauin.site";
                const params = buildTranscriptParams(1);

                const res = await fetch(
                    `${apiUrl}/api/v1/kajian/search?${params.toString()}`,
                );
                if (!res.ok) {
                    if (!cancelled) {
                        setTranscriptResults([]);
                        setTranscriptMeta({ total: 0, page: 1 });
                    }
                    return;
                }
                const data = await res.json();
                if (cancelled) return;
                const items =
                    data?.items ??
                    data?.data?.items ??
                    (Array.isArray(data) ? data : []);
                const meta = data?.meta ??
                    data?.data?.meta ?? { total: items.length, page: 1 };
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
        // buildTranscriptParams reads the same three inputs listed here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcriptQuery, searchMode, transcriptSelectedSpeakers, tab]);

    const loadMoreTranscripts = async () => {
        if (
            transcriptLoadingMore ||
            transcriptLoading ||
            !transcriptMeta?.has_more
        ) {
            return;
        }
        const requestId = transcriptRequestRef.current;
        const nextPage = transcriptPage + 1;
        setTranscriptLoadingMore(true);
        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ||
                "https://api-thollabul.jangkauin.site";
            const params = buildTranscriptParams(nextPage);
            const res = await fetch(
                `${apiUrl}/api/v1/kajian/search?${params.toString()}`,
            );
            if (!res.ok) return;
            const data = await res.json();
            // Inputs changed while this page was loading: drop it.
            if (requestId !== transcriptRequestRef.current) return;
            const items = data?.items ?? data?.data?.items ?? [];
            const meta = data?.meta ?? data?.data?.meta ?? {};
            setTranscriptResults((prev) => {
                const seen = new Set(prev.map((r) => r.id));
                return [...prev, ...items.filter((r) => !seen.has(r.id))];
            });
            setTranscriptMeta((prev) => ({ ...prev, ...meta }));
            setTranscriptPage(nextPage);
        } catch (e) {
            // keep what is already on screen
        } finally {
            if (requestId === transcriptRequestRef.current) {
                setTranscriptLoadingMore(false);
            }
        }
    };

    const searchText = search.trim().toLowerCase();
    const selectedSpeakerSet = useMemo(
        () => new Set(selectedSpeakers),
        [selectedSpeakers],
    );
    const filtered = useMemo(
        () =>
            kajian.filter((k) => {
                if (activeCategory !== "semua" && k.category !== activeCategory) {
                    return false;
                }
                if (
                    selectedSpeakerSet.size > 0 &&
                    !selectedSpeakerSet.has(k.speaker)
                ) {
                    return false;
                }
                if (!searchText) return true;
                return [
                    getLocalizedField(k, "title", lang),
                    k.ustadz,
                    getLocalizedField(k, "description", lang),
                    k.category,
                    k.duration,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(searchText);
            }),
        [activeCategory, kajian, lang, searchText, selectedSpeakerSet],
    );

    const youtubeCount = useMemo(
        () =>
            kajian.filter(
                (item) => item.platform === "youtube" || item.type === "video",
            ).length,
        [kajian],
    );
    const categoryCount = useMemo(
        () => new Set(kajian.map((item) => item.category)).size,
        [kajian],
    );
    const ustadzOptions = useMemo(() => {
        if (speakers.length > 0) return speakers;
        return Array.from(
            new Set(kajian.map((k) => k.speaker).filter(Boolean)),
        ).sort();
    }, [speakers, kajian]);

    return (
        <div
            className={
                isWide
                    ? "w-full px-2 sm:px-4"
                    : "w-full max-w-6xl mx-auto px-2 sm:px-4"
            }
        >
            <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                    <svg
                        width='1.25em'
                        height='1.25em'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                        className='text-xl text-emerald-700 dark:text-emerald-400'
                        aria-hidden='true'
                    >
                        <path d='M5 20V4h2v7l2.5-1.5L12 11V4h5v7.08c.33-.05.66-.08 1-.08s.67.03 1 .08V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h7.26c-.42-.6-.75-1.28-.97-2H5zm13-7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm-1.25 7.5v-5l4 2.5-4 2.5z' />
                    </svg>
                </div>
                <div>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                        {t("kajian.public_title")}
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {t("kajian.public_subtitle")}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className='flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-4'>
                <button
                    type='button'
                    onClick={() => setTab("transcript")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                        tab === "transcript"
                            ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                    {t("kajian.tab_search") || "🔍 Cari di Transkrip"}
                </button>
                <button
                    type='button'
                    onClick={() => setTab("bookmarks")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                        tab === "bookmarks"
                            ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                    {t("kajian.tab_bookmarks") || "🔖 Bookmark"}
                </button>
                <button
                    type='button'
                    onClick={() => setTab("notes")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                        tab === "notes"
                            ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                    {t("kajian.tab_notes") || "📝 Catatan"}
                </button>
                <button
                    type='button'
                    onClick={() => setTab("list")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                        tab === "list"
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
                    selectedSpeakers={transcriptSelectedSpeakers}
                    setSelectedSpeakers={setTranscriptSelectedSpeakers}
                    speakers={speakers}
                    results={transcriptResults}
                    loading={transcriptLoading}
                    loadingMore={transcriptLoadingMore}
                    hasMore={Boolean(transcriptMeta?.has_more)}
                    onLoadMore={loadMoreTranscripts}
                    meta={transcriptMeta}
                    t={t}
                />
            ) : tab === "bookmarks" ? (
                <SavedBookmarksView />
            ) : tab === "notes" ? (
                <SavedNotesView
                    onPlayNote={(note) => {
                        const targetKajian =
                            kajian.find((k) => k.id === note.kajianId) ||
                            note.kajian;
                        if (targetKajian) {
                            setPlayingKajian({
                                ...targetKajian,
                                start_seconds: note.start || 0,
                            });
                        } else if (note.videoId) {
                            setPlayingKajian({
                                id: null,
                                title: "Kajian",
                                speaker: "",
                                url: `https://www.youtube.com/watch?v=${note.videoId}`,
                                start_seconds: note.start || 0,
                            });
                        }
                    }}
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
                    selectedSpeakers={selectedSpeakers}
                    setSelectedSpeakers={setSelectedSpeakers}
                    ustadzOptions={ustadzOptions}
                    hasMore={hasMore && !search && activeCategory === "semua"}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    onPlay={setPlayingKajian}
                    t={t}
                    lang={lang}
                />
            )}

            {playingKajian && (
                <TranscriptPlayerModal
                    item={{
                        ...playingKajian,
                        kajian_id: playingKajian.id,
                        video_id: getYouTubeId(playingKajian.url),
                        timestamp_url: playingKajian.url,
                        snippet:
                            playingKajian.description || playingKajian.title,
                        timestamp: "00:00",
                        start_seconds: playingKajian.start_seconds || 0,
                    }}
                    onClose={() => setPlayingKajian(null)}
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
    selectedSpeakers,
    setSelectedSpeakers,
    ustadzOptions,
    hasMore,
    loadingMore,
    onLoadMore,
    onPlay,
    t,
    lang,
}) {
    return (
        <div>
            <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                <SearchIcon className='text-gray-400 shrink-0' />
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            activeCategory === cat.key
                                ? "bg-emerald-700 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                        }`}
                    >
                        {t(cat.labelKey)}
                    </button>
                ))}
            </div>

            {ustadzOptions.length > 0 && (
                <SpeakerMultiSelectDropdown
                    speakers={ustadzOptions}
                    selectedSpeakers={selectedSpeakers}
                    onChange={setSelectedSpeakers}
                    t={t}
                />
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
                    <PlayCircleIcon className='text-4xl mx-auto mb-3' />
                    <p className='text-sm'>{t("kajian.not_found")}</p>
                </div>
            ) : (
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
                    {kajian.map((k, idx) => {
                        const ytId = getYouTubeId(k.url);
                        return (
                            <button
                                key={k.id}
                                type='button'
                                onClick={() => onPlay?.(k)}
                                className='text-left group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all p-2.5 sm:p-3 flex flex-col gap-2 cursor-pointer'
                            >
                                {ytId && (
                                    <div className='aspect-video rounded-lg overflow-hidden bg-black relative group/thumb w-full'>
                                        <img
                                            src={`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`}
                                            alt={k.title}
                                            loading={idx < 4 ? "eager" : "lazy"}
                                            decoding='async'
                                            fetchPriority={idx < 4 ? "high" : "low"}
                                            className='w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300'
                                        />
                                        <div className='absolute inset-0 bg-black/20 flex items-center justify-center group-hover/thumb:bg-black/30 transition-colors'>
                                            <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform'>
                                                <PlayCircleIcon className='text-lg sm:text-xl ml-0.5' />
                                            </div>
                                        </div>
                                        {k.platform === "youtube" && (
                                            <div className='absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1'>
                                                <span
                                                    className='text-red-500'
                                                    aria-hidden='true'
                                                >
                                                    ▶
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className='flex-1 min-w-0 flex flex-col justify-between'>
                                    <div>
                                        <p className='font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1 line-clamp-2 leading-snug'>
                                            {k.title}
                                        </p>
                                        <p className='text-[11px] text-gray-500 dark:text-gray-400 truncate'>
                                            {k.speaker}
                                        </p>
                                    </div>
                                    <div className='mt-2 flex items-center justify-between text-[10px] text-gray-400'>
                                        <span>
                                            {k.duration
                                                ? `${Math.floor(k.duration / 60)}m`
                                                : ""}
                                        </span>
                                        <span className='font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline'>
                                            Putar Video
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
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
                            ? t("kajian.loading") || "Memuat..."
                            : t("common.load_more") || "Muat Lebih"}
                    </button>
                </div>
            )}
        </div>
    );
}
