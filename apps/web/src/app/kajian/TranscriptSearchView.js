"use client";

import { useLocale } from "@/context/Locale";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BsBoxArrowUpRight, BsPlayCircle, BsSearch, BsX, BsYoutube } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";

export const getSearchModes = (t) => [
    {
        key: "hybrid",
        label: t?.("kajian.mode_hybrid_label") || "Hybrid (Semua)",
        icon: "⚡",
        desc: t?.("kajian.mode_hybrid_desc") || "Exact + Semantic",
    },
    {
        key: "exact",
        label: t?.("kajian.mode_exact_label") || "Teks Persis",
        icon: "🔤",
        desc: t?.("kajian.mode_exact_desc") || "Kata kunci sama",
    },
    {
        key: "semantic",
        label: t?.("kajian.mode_semantic_label") || "Makna / Tema",
        icon: "🧠",
        desc: t?.("kajian.mode_semantic_desc") || "Berdasarkan tema",
    },
];

export const SEARCH_MODES = [
    { key: "hybrid", label: "Hybrid (Semua)", icon: "⚡", desc: "Exact + Semantic" },
    { key: "exact", label: "Teks Persis", icon: "🔤", desc: "Kata kunci sama" },
    { key: "semantic", label: "Makna / Tema", icon: "🧠", desc: "Berdasarkan tema" },
];

const getYouTubeIdFromTimestampUrl = (url) => {
    if (!url) return null;
    const m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
};

const highlightText = (text, query) => {
    if (!query || !text) return text;
    const safe = String(text);
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

export default function TranscriptSearchView({
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
}) {
    const { t } = useLocale();
    const searchModes = getSearchModes(t);
    const [activeVideo, setActiveVideo] = useState(null);

    // Defensive deduplication by (video_id/kajian_id + timestamp)
    const uniqueResults = useMemo(() => {
        const seen = new Set();
        return (results || []).filter((r) => {
            const key = `${r.kajian_id || r.video_id}-${r.start_seconds}-${r.end_seconds}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [results]);

    return (
        <div>
            {/* Search bar */}
            <div className='flex items-center gap-2 mb-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 px-3 py-2.5 shadow-sm'>
                <BsSearch className='text-emerald-500 shrink-0 text-lg' />
                <input
                    type='text'
                    placeholder={
                        t("kajian.transcript_placeholder") ||
                        'Cari tema kajian, contoh: "mengatasi stres", "hukum riba", "adab menuntut ilmu"'
                    }
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
                {searchModes.map((m) => (
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
                        {t("kajian.filter_speaker") || "Filter Ustadz"}
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
                            {t("common.all") || "Semua"}
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

            {/* Results metadata */}
            <div className='mb-3 text-xs text-gray-500 dark:text-gray-400'>
                {loading
                    ? (t("common.searching") || "Mencari...")
                    : `${uniqueResults.length} ${t("kajian.results_found") || "hasil"} • mode: ${searchModes.find((m) => m.key === mode)?.label}`}
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
            ) : uniqueResults.length === 0 ? (
                <div className='text-center py-12 text-gray-400'>
                    <BsSearch className='text-4xl mx-auto mb-3 opacity-50' />
                    <p className='text-sm'>
                        {query
                            ? (t("kajian.empty_search_hint") || "Tidak ada hasil. Coba ubah kata kunci atau mode pencarian.")
                            : (t("kajian.type_keyword_hint") || "Ketik kata kunci untuk mulai mencari di dalam transkrip video kajian.")}
                    </p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {uniqueResults.map((r) => (
                        <TranscriptResultCard
                            key={r.id}
                            result={r}
                            query={query}
                            onPlay={() => setActiveVideo(r)}
                        />
                    ))}
                </div>
            )}

            {/* Video Player Modal / Bottom Sheet */}
            {activeVideo && (
                <TranscriptPlayerModal
                    item={activeVideo}
                    searchQuery={query}
                    onClose={() => setActiveVideo(null)}
                />
            )}
        </div>
    );
}

function TranscriptResultCard({ result, query, onPlay }) {
    const videoId = getYouTubeIdFromTimestampUrl(result.timestamp_url) || result.video_id;

    return (
        <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all overflow-hidden'>
            <div className='flex items-start gap-3 p-3.5'>
                {/* Clickable thumbnail to play in-app */}
                {videoId && (
                    <button
                        type='button'
                        onClick={onPlay}
                        className='relative shrink-0 w-28 h-20 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-black group text-left'
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
                    </button>
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

                    <button
                        type='button'
                        onClick={onPlay}
                        className='block text-left font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors leading-snug mb-1'
                    >
                        {result.title}
                    </button>

                    <p className='text-[11px] text-gray-500 dark:text-gray-400 mb-2'>
                        {result.speaker} · ⏱️ {result.timestamp}
                    </p>

                    <p className='text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3'>
                        {highlightText(result.snippet, query)}
                    </p>

                    <div className='flex items-center gap-3 mt-2'>
                        <button
                            type='button'
                            onClick={onPlay}
                            className='inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline'
                        >
                            <BsPlayCircle className='text-sm' />
                            Putar @ {result.timestamp}
                        </button>
                        <a
                            href={result.timestamp_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        >
                            <BsYoutube className='text-red-500 text-sm' />
                            Buka di YouTube
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds) {
    const s = Math.floor(seconds || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function TranscriptPlayerModal({ item, onClose, searchQuery = "" }) {
    const videoId = getYouTubeIdFromTimestampUrl(item.timestamp_url) || item.video_id;
    const initialStart = item.start_seconds || 0;

    const [transcripts, setTranscripts] = useState([]);
    const [loadingTranscripts, setLoadingTranscripts] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialStart);
    const [autoScroll, setAutoScroll] = useState(true);
    const [filterQuery, setFilterQuery] = useState("");

    const playerRef = useRef(null);
    const activeChunkRef = useRef(null);
    const listContainerRef = useRef(null);
    const reactId = useId();
    const containerId = `yt-player-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    // 1. Fetch full transcripts for this kajian
    useEffect(() => {
        let cancelled = false;
        const fetchTranscripts = async () => {
            if (!item.kajian_id) return;
            setLoadingTranscripts(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-thollabul.jangkauin.site";
                const res = await fetch(`${apiUrl}/api/v1/kajian/${item.kajian_id}/transcripts`);
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                setTranscripts(list);
            } catch {
                // ignore
            } finally {
                if (!cancelled) setLoadingTranscripts(false);
            }
        };
        fetchTranscripts();
        return () => {
            cancelled = true;
        };
    }, [item.kajian_id]);

    // 2. Load YouTube IFrame API & instantiate player
    useEffect(() => {
        let timer = null;
        let isMounted = true;

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player) return;
            try {
                playerRef.current = new window.YT.Player(containerId, {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        start: initialStart,
                        enablejsapi: 1,
                        origin: typeof window !== "undefined" ? window.location.origin : undefined,
                    },
                    events: {
                        onReady: () => {
                            // start polling current time
                            timer = setInterval(() => {
                                if (playerRef.current && typeof playerRef.current.getCurrentTime === "function" && isMounted) {
                                    const time = playerRef.current.getCurrentTime();
                                    setCurrentTime(time);
                                }
                            }, 350);
                        },
                    },
                });
            } catch (err) {
                // fallback
            }
        };

        if (typeof window !== "undefined") {
            if (!window.YT) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                window.onYouTubeIframeAPIReady = () => {
                    initPlayer();
                };
            } else {
                initPlayer();
            }
        }

        return () => {
            isMounted = false;
            if (timer) clearInterval(timer);
            if (playerRef.current && typeof playerRef.current.destroy === "function") {
                playerRef.current.destroy();
            }
        };
    }, [containerId, videoId, initialStart]);

    // 3. Find active transcript chunk based on currentTime
    const activeIndex = useMemo(() => {
        if (!transcripts || transcripts.length === 0) return -1;
        const cur = Math.floor(currentTime);
        return transcripts.findIndex((t) => cur >= t.start_seconds && cur <= t.end_seconds);
    }, [currentTime, transcripts]);

    // 4. Auto-scroll to active transcript chunk
    useEffect(() => {
        if (autoScroll && activeChunkRef.current && listContainerRef.current) {
            activeChunkRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [activeIndex, autoScroll]);

    // 5. Seek to timestamp when clicking a transcript row
    const handleSeek = (seconds) => {
        if (playerRef.current && typeof playerRef.current.seekTo === "function") {
            playerRef.current.seekTo(seconds, true);
            playerRef.current.playVideo?.();
        }
        setCurrentTime(seconds);
    };

    // Filtered transcripts for search inside video
    const displayedTranscripts = useMemo(() => {
        if (!filterQuery) return transcripts;
        const q = filterQuery.toLowerCase();
        return transcripts.filter((t) => t.text?.toLowerCase().includes(q));
    }, [transcripts, filterQuery]);

    return (
        <ModalShell
            onClose={onClose}
            overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4'
            panelClassName='bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col'
        >
            {/* Header */}
            <div className='flex items-center justify-between p-3.5 sm:p-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0'>
                <div className='min-w-0 flex-1 pr-3'>
                    <div className='flex items-center gap-2'>
                        <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'>
                            {item.topic || "Kajian"}
                        </span>
                        <p className='text-xs text-emerald-600 dark:text-emerald-400 truncate'>
                            {item.speaker}
                        </p>
                    </div>
                    <h3 className='font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate mt-0.5'>
                        {item.title}
                    </h3>
                </div>
                <button
                    type='button'
                    onClick={onClose}
                    className='p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
                >
                    <BsX className='text-2xl' />
                </button>
            </div>

            {/* Content: Video Player + Synchronized Transcripts */}
            <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden bg-gray-50 dark:bg-slate-950'>
                {/* Left Col: Video Player & Current Quote (7 cols) */}
                <div className='lg:col-span-7 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-800'>
                    <div className='aspect-video w-full bg-black shrink-0 relative'>
                        <div id={containerId} className='w-full h-full' />
                    </div>

                    <div className='p-3 sm:p-4 overflow-y-auto flex-1 bg-white dark:bg-slate-900/40 text-xs text-gray-700 dark:text-gray-300'>
                        <div className='flex items-center justify-between mb-1'>
                            <span className='font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]'>
                                🎯 Hasil Pencarian Terkait:
                            </span>
                            <span className='text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold'>
                                ⏱️ {item.timestamp}
                            </span>
                        </div>
                        <p className='p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 leading-relaxed italic text-gray-800 dark:text-gray-200'>
                            &ldquo;{highlightText(item.snippet, searchQuery)}&rdquo;
                        </p>
                    </div>
                </div>

                {/* Right Col: Live Synchronized Transcripts (5 cols) */}
                <div className='lg:col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900'>
                    {/* Transcript Box Header */}
                    <div className='p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/40 flex flex-col gap-2 shrink-0'>
                        <div className='flex items-center justify-between'>
                            <span className='font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5'>
                                📜 Transkrip Lengkap
                                {transcripts.length > 0 && (
                                    <span className='text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'>
                                        {transcripts.length} baris
                                    </span>
                                )}
                            </span>
                            <label className='flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer select-none'>
                                <input
                                    type='checkbox'
                                    checked={autoScroll}
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                    className='rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5'
                                />
                                Auto-scroll
                            </label>
                        </div>

                        {/* Local Search Input within this transcript */}
                        <div className='flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs'>
                            <BsSearch className='text-gray-400 text-[11px]' />
                            <input
                                type='text'
                                placeholder='Filter teks di video ini...'
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                className='w-full bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 text-xs'
                            />
                            {filterQuery && (
                                <button
                                    type='button'
                                    onClick={() => setFilterQuery("")}
                                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs'
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Transcripts List */}
                    <div
                        ref={listContainerRef}
                        className='flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 min-h-[220px] max-h-[360px] lg:max-h-none text-xs'
                    >
                        {loadingTranscripts ? (
                            <div className='flex flex-col items-center justify-center h-48 text-gray-400'>
                                <div className='animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent mb-2' />
                                <span className='text-xs'>Memuat transkrip...</span>
                            </div>
                        ) : displayedTranscripts.length === 0 ? (
                            <div className='text-center py-12 text-gray-400 text-xs'>
                                {filterQuery ? "Tidak ada kalimat yang cocok dengan filter." : "Transkrip belum tersedia untuk video ini."}
                            </div>
                        ) : (
                            displayedTranscripts.map((t, idx) => {
                                const isCurrent = transcripts.indexOf(t) === activeIndex;
                                return (
                                    <div
                                        key={t.id || idx}
                                        ref={isCurrent ? activeChunkRef : null}
                                        onClick={() => handleSeek(t.start_seconds)}
                                        className={`group p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-200 flex gap-2.5 items-start ${
                                            isCurrent
                                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-[1.01]"
                                                : "hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        <button
                                            type='button'
                                            className={`shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                                                isCurrent
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50"
                                            }`}
                                        >
                                            {formatTime(t.start_seconds)}
                                        </button>
                                        <p className={`flex-1 text-xs leading-relaxed ${isCurrent ? "font-medium" : ""}`}>
                                            {highlightText(t.text, filterQuery || searchQuery)}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className='p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0'>
                <a
                    href={item.timestamp_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 transition-colors'
                >
                    <BsYoutube className='text-sm' />
                    Buka di YouTube
                    <BsBoxArrowUpRight className='text-[10px]' />
                </a>
                <button
                    type='button'
                    onClick={onClose}
                    className='px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                >
                    Tutup
                </button>
            </div>
        </ModalShell>
    );
}
