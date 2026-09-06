"use client";

import { useLocale } from "@/context/Locale";
import Image from "next/image";
import { useState } from "react";
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
                    : `${meta.total || results.length} ${t("kajian.results_found") || "hasil"} • mode: ${searchModes.find((m) => m.key === mode)?.label}`}
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
                            ? (t("kajian.empty_search_hint") || "Tidak ada hasil. Coba ubah kata kunci atau mode pencarian.")
                            : (t("kajian.type_keyword_hint") || "Ketik kata kunci untuk mulai mencari di dalam transkrip video kajian.")}
                    </p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {results.map((r) => (
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

function TranscriptPlayerModal({ item, onClose }) {
    const videoId = getYouTubeIdFromTimestampUrl(item.timestamp_url) || item.video_id;
    const startSeconds = item.start_seconds || 0;

    return (
        <ModalShell
            onClose={onClose}
            overlayClassName='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4'
            panelClassName='bg-white dark:bg-slate-900 w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col'
        >
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800'>
                <div className='min-w-0 flex-1 pr-2'>
                    <h3 className='font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate'>
                        {item.title}
                    </h3>
                    <p className='text-xs text-emerald-600 dark:text-emerald-400'>
                        {item.speaker} · ⏱️ {item.timestamp}
                    </p>
                </div>
                <button
                    type='button'
                    onClick={onClose}
                    className='p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
                >
                    <BsX className='text-xl' />
                </button>
            </div>

            {/* Embedded Video */}
            {videoId && (
                <div className='aspect-video w-full bg-black'>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?start=${startSeconds}&autoplay=1`}
                        title={item.title}
                        className='w-full h-full'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                    />
                </div>
            )}

            {/* Transcript Snippet Body */}
            <div className='p-4 overflow-y-auto max-h-40 sm:max-h-48 bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-slate-800'>
                <p className='font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider text-[10px]'>
                    Kutipan Transkrip:
                </p>
                <p className='italic'>&ldquo;{item.snippet}&rdquo;</p>
            </div>

            {/* Footer Actions */}
            <div className='p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2'>
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
