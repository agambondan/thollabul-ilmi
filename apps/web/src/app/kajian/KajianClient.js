"use client";

import Image from "next/image";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useMemo, useState } from "react";
import { BsPlayCircle, BsSearch, BsYoutube } from "react-icons/bs";
import { MdOutlinePlayLesson } from "react-icons/md";

const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    );
    return m ? m[1] : null;
};

const getYouTubeIdFromTimestampUrl = (url) => {
    if (!url) return null;
    const m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
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

const SEARCH_MODES = [
    { key: "hybrid", label: "Hybrid (Semua)", icon: "⚡", desc: "Exact + Semantic" },
    { key: "exact", label: "Teks Persis", icon: "🔤", desc: "Kata kunci sama" },
    { key: "semantic", label: "Makna / Tema", icon: "🧠", desc: "Berdasarkan tema" },
];

const highlightText = (text, query) => {
    if (!query || !text) return text;
    const safe = String(text);
    const lowerText = safe.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return safe;
    const tokens = lowerQuery.split(/\s+/).filter((t) => t.length > 1);
    if (tokens.length === 0) return safe;
    const regex = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = safe.split(regex);
    return parts.map((p, i) =>
        regex.test(p) ? (
            <mark
                key={i}
                className="bg-yellow-200 dark:bg-yellow-700/60 text-gray-900 dark:text-yellow-50 px-0.5 rounded"
            >
                {p}
            </mark>
        ) : (
            <span key={i}>{p}</span>
        ),
    );
};

export default function KajianClient({ kajian: initialKajian = [] }) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [kajian, setKajian] = useState(initialKajian);
    const [activeCategory, setActiveCategory] = useState("semua");
    const [search, setSearch] = useState("");

    // Tab: 'list' = daftar kajian (default), 'transcript' = cari transkrip
    const [tab, setTab] = useState("list");

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
                    setTranscriptResults([]);
                    setTranscriptMeta({ total: 0, page: 1 });
                    return;
                }
                const data = await res.json();
                if (cancelled) return;
                const items = data?.data?.items || [];
                const meta = data?.data?.meta || { total: 0, page: 1 };
                setTranscriptResults(items);
                setTranscriptMeta(meta);
            } catch (e) {
                setTranscriptResults([]);
            } finally {
                setTranscriptLoading(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [transcriptQuery, searchMode, speakerFilter, tab]);

    const filtered = kajian.filter((k) => {
        const matchCat =
            activeCategory === "semua" || k.category === activeCategory;
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
        return matchCat && matchSearch;
    });

    const totalKajian = kajian.length;
    const youtubeCount = kajian.filter(
        (item) => item.platform === "youtube",
    ).length;
    const categoryCount = new Set(kajian.map((item) => item.category)).size;

    return (
        <div
            className={
                isWide
                    ? "w-full px-4"
                    : "container mx-auto px-4 max-w-3xl"
            }
        >
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
                    🔍 Cari di Transkrip
                </button>
                <button
                    type='button'
                    onClick={() => setTab("list")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${tab === "list"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                >
                    📚 Semua Kajian
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

            <div className='flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide'>
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
                                <div className='aspect-video rounded-lg overflow-hidden bg-black'>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeId(k.url)}`}
                                        title={k.title}
                                        className='w-full h-full'
                                        allowFullScreen
                                    />
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
        </div>
    );
}

function TranscriptSearchView({
    query,
    setQuery,
    mode,
    setMode,
    speaker,
    setSpeaker,
    speakers,
    results,
    loading,
    meta,
    t,
}) {
    return (
        <div>
            {/* Search bar */}
            <div className='flex items-center gap-2 mb-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 px-3 py-2.5 shadow-sm'>
                <BsSearch className='text-emerald-500 shrink-0 text-lg' />
                <input
                    type='text'
                    placeholder='Cari tema kajian, contoh: "mengatasi stres", "hukum riba", "adab menuntut ilmu"'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none placeholder:text-gray-400'
                />
                {query && (
                    <button
                        type='button'
                        onClick={() => setQuery("")}
                        className='text-xs font-medium text-emerald-600 dark:text-emerald-400'
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Search mode toggle */}
            <div className='grid grid-cols-3 gap-1.5 mb-3 bg-gray-50 dark:bg-slate-900/50 p-1 rounded-xl'>
                {SEARCH_MODES.map((m) => (
                    <button
                        key={m.key}
                        type='button'
                        onClick={() => setMode(m.key)}
                        className={`px-2 py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${mode === m.key
                            ? m.key === "exact"
                                ? "bg-blue-600 text-white shadow-sm"
                                : m.key === "semantic"
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "bg-emerald-600 text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800"
                            }`}
                    >
                        <span className='text-base'>{m.icon}</span>
                        <span>{m.label}</span>
                        <span
                            className={`text-[9px] font-normal ${mode === m.key ? "opacity-80" : "opacity-60"
                                }`}
                        >
                            {m.desc}
                        </span>
                    </button>
                ))}
            </div>

            {/* Speaker filter */}
            {speakers.length > 0 && (
                <div className='mb-4'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400 mb-1.5'>
                        Filter Ustadz
                    </p>
                    <div className='flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide'>
                        <button
                            type='button'
                            onClick={() => setSpeaker("")}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${!speaker
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                                }`}
                        >
                            Semua
                        </button>
                        {speakers.map((s) => (
                            <button
                                key={s}
                                type='button'
                                onClick={() => setSpeaker(s)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${speaker === s
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

            {/* Results */}
            <div className='mb-3 text-xs text-gray-500 dark:text-gray-400'>
                {loading
                    ? "Mencari..."
                    : `${meta.total || results.length} hasil • mode: ${SEARCH_MODES.find((m) => m.key === mode)?.label}`}
            </div>

            {loading ? (
                <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 animate-pulse'
                        >
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2' />
                            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-full' />
                        </div>
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div className='text-center py-12 text-gray-400'>
                    <BsSearch className='text-4xl mx-auto mb-3 opacity-50' />
                    <p className='text-sm'>
                        {query
                            ? "Tidak ada hasil. Coba ubah kata kunci atau mode pencarian."
                            : "Ketik kata kunci untuk mulai mencari di dalam transkrip video kajian."}
                    </p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {results.map((r) => (
                        <TranscriptResultCard key={r.id} result={r} query={query} />
                    ))}
                </div>
            )}
        </div>
    );
}

function TranscriptResultCard({ result, query }) {
    const videoId = getYouTubeIdFromTimestampUrl(result.timestamp_url) || result.video_id;
    const startSeconds = result.start_seconds || 0;

    return (
        <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all overflow-hidden'>
            <div className='flex items-start gap-3 p-3.5'>
                {/* Mini player thumbnail */}
                {videoId && (
                    <a
                        href={result.timestamp_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='relative shrink-0 w-28 h-20 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-black group'
                    >
                        <Image
                            src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
                            alt={result.title}
                            fill
                            sizes='128px'
                            className='object-cover'
                            unoptimized
                        />
                        <div className='absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center'>
                            <BsPlayCircle className='text-white text-2xl opacity-90' />
                        </div>
                        <div className='absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded'>
                            {result.timestamp}
                        </div>
                    </a>
                )}

                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1.5 flex-wrap mb-1'>
                        <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${result.match_mode === "exact"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                : result.match_mode === "semantic"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                }`}
                        >
                            {result.match_mode === "exact"
                                ? "🔤 EXACT"
                                : result.match_mode === "semantic"
                                    ? "🧠 SEMANTIC"
                                    : "⚡ HYBRID"}
                        </span>
                        {result.topic && (
                            <span className='text-[10px] text-gray-400 truncate max-w-[200px]'>
                                {result.topic}
                            </span>
                        )}
                    </div>

                    <a
                        href={result.timestamp_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='block font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors leading-snug mb-1'
                    >
                        {result.title}
                    </a>

                    <p className='text-[11px] text-gray-500 dark:text-gray-400 mb-2'>
                        {result.speaker} · ⏱️ {result.timestamp}
                    </p>

                    <p className='text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3'>
                        {highlightText(result.snippet, query)}
                    </p>

                    <a
                        href={result.timestamp_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        <BsYoutube className='text-base' />
                        Buka di YouTube @ {result.timestamp}
                    </a>
                </div>
            </div>
        </div>
    );
}
