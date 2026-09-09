"use client";

import ModalShell from "@/components/ModalShell";
import { PlayCircleIcon, SearchIcon, ShareIcon } from "@/components/icons/Icon";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { kajianBookmarkApi, kajianNoteApi, parseApiJson } from "@/lib/api";
import Image from "next/image";
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import SpeakerMultiSelectDropdown from "./SpeakerMultiSelectDropdown";

export const getSearchModes = (t) => [
    {
        key: "hybrid",
        label: t?.("kajian.mode_hybrid_label") || "Hybrid (Semua)",
        icon: "⚡",
        desc: t?.("kajian.mode_hybrid_desc") || "Persis dulu, lalu makna",
    },
    {
        key: "exact",
        label: t?.("kajian.mode_exact_label") || "Teks Persis",
        icon: "🔤",
        desc: t?.("kajian.mode_exact_desc") || "Frasa persis seperti diketik",
    },
    {
        key: "semantic",
        label: t?.("kajian.mode_semantic_label") || "Makna / Tema",
        icon: "🧠",
        desc:
            t?.("kajian.mode_semantic_desc") ||
            "Per kajian: kata dasar, ejaan lain & topik",
    },
];

export const SEARCH_MODES = [
    {
        key: "hybrid",
        label: "Hybrid (Semua)",
        icon: "⚡",
        desc: "Exact + Semantic",
    },
    { key: "exact", label: "Teks Persis", icon: "🔤", desc: "Kata kunci sama" },
    {
        key: "semantic",
        label: "Makna / Tema",
        icon: "🧠",
        desc: "Berdasarkan tema",
    },
];

const getYouTubeIdFromTimestampUrl = (url) => {
    if (!url) return null;
    const m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Terms to paint: the API's expanded terms (query words minus stopwords, plus
// spelling variants such as "salat" for a "sholat" query). Falls back to the
// raw query tokens when the API did not send any.
const highlightTokens = (query, extraTerms = []) => {
    const fromApi = (extraTerms || [])
        .map((t) => String(t).toLowerCase())
        .filter((t) => t.length > 2);
    const lowerQuery = (query || "").toLowerCase().trim();
    const fromQuery = lowerQuery.split(/\s+/).filter((t) => t.length > 2);
    const phrase = fromQuery.length > 1 ? [lowerQuery] : [];
    return [...new Set([...phrase, ...(fromApi.length ? fromApi : fromQuery)])];
};

const highlightText = (text, query, extraTerms = []) => {
    if (!text) return text;
    const safe = String(text);
    const tokens = highlightTokens(query, extraTerms);
    if (tokens.length === 0) return safe;
    const pattern = `(${tokens.map(escapeRegex).join("|")})`;
    // Split with a global regex, but classify parts with a non-global one:
    // RegExp#test on a /g regex advances lastIndex and misses adjacent hits.
    const splitter = new RegExp(pattern, "gi");
    const matcher = new RegExp(`^${pattern}$`, "i");
    const parts = safe.split(splitter);
    return parts.map((p, i) =>
        matcher.test(p) ? (
            <mark
                key={i}
                className='bg-yellow-200 dark:bg-yellow-700/60 text-gray-900 dark:text-yellow-50 px-0.5 rounded'
            >
                {p}
            </mark>
        ) : (
            <span key={i}>{p}</span>
        ),
    );
};

// Why a card matched, from the API's match_reason (falls back to the legacy
// match_mode badge for older API responses).
const matchBadge = (result, t) => {
    switch (result.match_reason) {
        case "phrase":
            return {
                cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                text: `🔤 ${t("kajian.reason_phrase") || "Frasa persis"}`,
            };
        case "all_terms":
            return {
                cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                text: `✅ ${t("kajian.reason_all_terms") || "Semua kata"}`,
            };
        case "some_terms":
            return {
                cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                text: `🧠 ${t("kajian.reason_some_terms") || "Sebagian kata"}`,
            };
        case "fuzzy":
            return {
                cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                text: `≈ ${t("kajian.reason_fuzzy") || "Ejaan mirip"}`,
            };
        case "title":
            return {
                cls: "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
                text: `🏷️ ${t("kajian.reason_title") || "Judul / topik"}`,
            };
        default:
            if (result.match_mode === "exact") {
                return {
                    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                    text: "🔤 EXACT",
                };
            }
            if (result.match_mode === "semantic") {
                return {
                    cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                    text: "🧠 SEMANTIC",
                };
            }
            return {
                cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                text: "⚡ HYBRID",
            };
    }
};

export default function TranscriptSearchView({
    query,
    setQuery,
    mode,
    setMode,
    selectedSpeakers,
    setSelectedSpeakers,
    speakers,
    results,
    loading,
    loadingMore = false,
    hasMore = false,
    onLoadMore,
    meta,
}) {
    const { t } = useLocale();
    const searchModes = getSearchModes(t);
    const [activeVideo, setActiveVideo] = useState(null);
    const highlightTerms = meta?.expanded_terms || [];

    const handleShare = async (result) => {
        if (!result) return;
        const text = `📖 *${result.title}*\n👤 ${result.speaker}\n⏱️ ${result.timestamp}\n\n"${result.snippet}"\n\n🔗 ${result.timestamp_url}`;
        const shareData = {
            title: result.title || "Kajian",
            text,
            url: result.timestamp_url,
        };
        try {
            if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share(shareData);
            } else if (
                typeof navigator !== "undefined" &&
                navigator.clipboard
            ) {
                await navigator.clipboard.writeText(`${text}`);
            }
        } catch {
            // user cancelled or unsupported
        }
    };

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
    const kajianCount =
        meta?.kajian_count ??
        new Set(uniqueResults.map((r) => r.kajian_id || r.video_id)).size;
    const totalResults = Math.max(
        Number(meta?.total) || 0,
        uniqueResults.length,
    );
    const totalLabel = meta?.truncated ? `${totalResults}+` : totalResults;

    return (
        <div>
            {/* Search bar */}
            <div className='flex items-center gap-2 mb-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 px-3 py-2.5 shadow-sm'>
                <SearchIcon className='text-emerald-500 shrink-0 text-lg' />
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
                        className={`px-2 py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                            mode === m.key
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
                            className={`text-[9px] font-normal ${
                                mode === m.key ? "opacity-80" : "opacity-60"
                            }`}
                        >
                            {m.desc}
                        </span>
                    </button>
                ))}
            </div>

            {speakers.length > 0 && (
                <SpeakerMultiSelectDropdown
                    speakers={speakers}
                    selectedSpeakers={selectedSpeakers}
                    onChange={setSelectedSpeakers}
                    t={t}
                />
            )}

            {query.trim() && (
                <div className='mb-3 text-xs text-gray-500 dark:text-gray-400'>
                    {loading
                        ? t("common.searching") || "Mencari..."
                        : meta?.mode === "semantic"
                          ? t(
                                "kajian.transcript_results_summary_kajian",
                                "{shown} dari {total} kajian yang membahas tema ini",
                                {
                                    shown: uniqueResults.length,
                                    total: totalLabel,
                                },
                            )
                          : t(
                                "kajian.transcript_results_summary",
                                "{shown} dari {total} potongan transkrip • {kajian} kajian",
                                {
                                    shown: uniqueResults.length,
                                    total: totalLabel,
                                    kajian: kajianCount,
                                },
                            )}
                </div>
            )}

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
                    <SearchIcon className='text-4xl mx-auto mb-3 opacity-50' />
                    <p className='text-sm'>
                        {query
                            ? t("kajian.empty_search_hint") ||
                              "Tidak ada hasil. Coba ubah kata kunci atau mode pencarian."
                            : t("kajian.type_keyword_hint") ||
                              "Ketik kata kunci untuk mulai mencari di dalam transkrip video kajian."}
                    </p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {uniqueResults.map((r) => (
                        <TranscriptResultCard
                            key={r.id}
                            result={r}
                            query={query}
                            highlightTerms={highlightTerms}
                            onPlay={() => setActiveVideo(r)}
                            onShare={handleShare}
                        />
                    ))}
                    {hasMore && (
                        <div className='text-center pt-2'>
                            <button
                                type='button'
                                onClick={onLoadMore}
                                disabled={loadingMore}
                                className='px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors'
                            >
                                {loadingMore
                                    ? t("common.loading") || "Memuat..."
                                    : t("kajian.transcript_load_more") ||
                                      "Muat lebih banyak"}
                            </button>
                        </div>
                    )}
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

function TranscriptResultCard({
    result,
    query,
    highlightTerms = [],
    onPlay,
    onShare,
}) {
    const { t } = useLocale();
    const videoId =
        getYouTubeIdFromTimestampUrl(result.timestamp_url) || result.video_id;
    const badge = matchBadge(result, t);

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
                            <PlayCircleIcon className='text-white text-2xl opacity-90' />
                        </div>
                        <div className='absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded'>
                            {result.timestamp}
                        </div>
                    </button>
                )}

                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1.5 flex-wrap mb-1'>
                        <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${badge.cls}`}
                        >
                            {badge.text}
                        </span>
                        {result.match_count > 1 && (
                            <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium'>
                                {t(
                                    "kajian.match_count",
                                    "{count} potongan cocok",
                                    { count: result.match_count },
                                )}
                            </span>
                        )}
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
                        {highlightText(result.snippet, query, [
                            ...highlightTerms,
                            ...(result.matched_terms || []),
                        ])}
                    </p>

                    <div className='flex items-center gap-3 mt-2'>
                        <button
                            type='button'
                            onClick={onPlay}
                            className='inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline'
                        >
                            <PlayCircleIcon className='text-sm' />
                            Putar @ {result.timestamp}
                        </button>
                        <a
                            href={result.timestamp_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        >
                            <span
                                className='text-red-500 text-sm'
                                aria-hidden='true'
                            >
                                ▶
                            </span>
                            Buka di YouTube
                        </a>
                        <button
                            type='button'
                            onClick={() => onShare?.(result)}
                            className='inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                        >
                            <ShareIcon className='text-sm' />
                            Bagikan
                        </button>
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

export function TranscriptPlayerModal({ item, onClose, searchQuery = "" }) {
    const { t } = useLocale();
    const { isAuthenticated } = useAuth();
    const videoId = item
        ? getYouTubeIdFromTimestampUrl(item.timestamp_url) || item.video_id
        : null;
    const storageKey = item?.kajian_id
        ? `kajian-player:${item.kajian_id}`
        : null;
    const bookmarkKey = item?.kajian_id
        ? `kajian-bookmarks:${item.kajian_id}`
        : null;
    const notesKey = item?.kajian_id
        ? `kajian-notes:${item.kajian_id}`
        : videoId
          ? `kajian-notes:yt_${videoId}`
          : null;

    const [transcripts, setTranscripts] = useState([]);
    const [loadingTranscripts, setLoadingTranscripts] = useState(false);
    const [playerStart, setPlayerStart] = useState(item?.start_seconds || 0);
    const [currentTime, setCurrentTime] = useState(item?.start_seconds || 0);
    const [autoScroll, setAutoScroll] = useState(true);
    const [filterQuery, setFilterQuery] = useState("");
    const [bookmarked, setBookmarked] = useState(new Set());
    const [useFallbackIframe, setUseFallbackIframe] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);

    const [notes, setNotes] = useState([]);
    const [sideTab, setSideTab] = useState("transcript");
    const [isWritingNote, setIsWritingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteStart, setNoteStart] = useState(0);
    const [noteEnd, setNoteEnd] = useState("");
    const [noteText, setNoteText] = useState("");
    const [copiedNoteId, setCopiedNoteId] = useState(null);

    const playerRef = useRef(null);
    const iframeRef = useRef(null);
    const activeChunkRef = useRef(null);
    const listContainerRef = useRef(null);
    const playerStartRef = useRef(playerStart);
    const fallbackClockRef = useRef({
        base: item?.start_seconds || 0,
        startedAt: 0,
    });
    useEffect(() => {
        playerStartRef.current = playerStart;
        fallbackClockRef.current = { base: playerStart, startedAt: Date.now() };
    }, [playerStart]);
    const reactId = useId();
    const containerId = `yt-player-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (storageKey) {
            const saved = Number(window.localStorage.getItem(storageKey));
            if (Number.isFinite(saved) && saved > 0) {
                setPlayerStart(saved);
                setCurrentTime(saved);
            }
        }
        if (bookmarkKey) {
            try {
                setBookmarked(
                    new Set(
                        JSON.parse(
                            window.localStorage.getItem(bookmarkKey) || "[]",
                        ),
                    ),
                );
            } catch {
                setBookmarked(new Set());
            }
        }
        if (notesKey) {
            try {
                const savedNotes = JSON.parse(
                    window.localStorage.getItem(notesKey) || "[]",
                );
                if (Array.isArray(savedNotes)) setNotes(savedNotes);
            } catch {
                setNotes([]);
            }
        }
    }, [bookmarkKey, notesKey, storageKey]);

    // Fetch cloud notes if logged in
    useEffect(() => {
        if (!isAuthenticated || !item?.kajian_id) return;
        let cancelled = false;
        const loadCloudNotes = async () => {
            try {
                const res = await kajianNoteApi.list(item.kajian_id);
                if (!res.ok) return;
                const data = await parseApiJson(res);
                const items = Array.isArray(data?.items) ? data.items : [];
                if (cancelled) return;
                if (items.length > 0) {
                    const formatted = items.map((n) => ({
                        id: n.id,
                        start: n.start_sec,
                        end: n.end_sec,
                        text: n.content,
                        createdAt: n.created_at,
                        isCloud: true,
                    }));
                    setNotes((prev) => {
                        // Merge cloud notes with any un-synced local notes
                        const map = new Map();
                        formatted.forEach((n) => map.set(String(n.id), n));
                        prev.forEach((n) => {
                            if (!map.has(String(n.id))) {
                                map.set(String(n.id), n);
                            }
                        });
                        return Array.from(map.values());
                    });
                }
            } catch {
                // ignore
            }
        };
        loadCloudNotes();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, item?.kajian_id]);

    useEffect(() => {
        if (typeof window === "undefined" || !storageKey) return;
        const timer = setTimeout(() => {
            window.localStorage.setItem(
                storageKey,
                String(Math.floor(currentTime || 0)),
            );
        }, 1000);
        return () => clearTimeout(timer);
    }, [currentTime, storageKey]);

    useEffect(() => {
        if (typeof window === "undefined" || !bookmarkKey) return;
        window.localStorage.setItem(
            bookmarkKey,
            JSON.stringify([...bookmarked]),
        );
    }, [bookmarked, bookmarkKey]);

    useEffect(() => {
        if (typeof window === "undefined" || !notesKey) return;
        window.localStorage.setItem(notesKey, JSON.stringify(notes));
    }, [notes, notesKey]);

    // 1. Fetch full transcripts for this kajian
    useEffect(() => {
        let cancelled = false;
        const fetchTranscripts = async () => {
            if (!item.kajian_id) return;
            setLoadingTranscripts(true);
            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "https://api-thollabul.jangkauin.site";
                const res = await fetch(
                    `${apiUrl}/api/v1/kajian/${item.kajian_id}/transcripts`,
                );
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const list = Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                      ? data
                      : [];
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

    // 2. Load YouTube IFrame API with fallback to direct iframe
    useEffect(() => {
        if (!videoId || typeof window === "undefined") return undefined;
        let timer = null;
        let fallbackTimer = null;
        let isMounted = true;

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player) {
                setUseFallbackIframe(true);
                setPlayerReady(true);
                return;
            }
            try {
                const startSec = Math.floor(playerStartRef.current || 0);
                playerRef.current = new window.YT.Player(containerId, {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        start: startSec,
                        enablejsapi: 1,
                        origin: window.location.origin,
                        rel: 0,
                        modestbranding: 1,
                    },
                    events: {
                        onReady: () => {
                            if (!isMounted) return;
                            setPlayerReady(true);
                            timer = setInterval(() => {
                                if (
                                    playerRef.current &&
                                    typeof playerRef.current.getCurrentTime ===
                                        "function" &&
                                    isMounted
                                ) {
                                    const time =
                                        playerRef.current.getCurrentTime();
                                    setCurrentTime(time);
                                }
                            }, 350);
                        },
                        onError: () => {
                            if (isMounted) {
                                setUseFallbackIframe(true);
                                setPlayerReady(true);
                            }
                        },
                    },
                });
            } catch {
                if (isMounted) {
                    setUseFallbackIframe(true);
                    setPlayerReady(true);
                }
            }
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            // If API script fails to load within 1.2s (e.g. corporate SSL/firewall block), fallback
            fallbackTimer = setTimeout(() => {
                if (isMounted && (!window.YT || !window.YT.Player)) {
                    setUseFallbackIframe(true);
                    setPlayerReady(true);
                }
            }, 1200);

            if (
                !document.querySelector('script[src*="youtube.com/iframe_api"]')
            ) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                tag.onerror = () => {
                    if (isMounted) setUseFallbackIframe(true);
                };
                const firstScriptTag =
                    document.getElementsByTagName("script")[0];
                if (firstScriptTag?.parentNode) {
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                } else {
                    document.head.appendChild(tag);
                }
            }

            const prevReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof prevReady === "function") prevReady();
                if (isMounted) initPlayer();
            };
        }

        // Poll iframe currentTime when YT API is unavailable. The direct
        // <iframe> embed with enablejsapi=1 only posts infoDelivery on
        // state changes; without an API instance, asking for currentTime
        // every 350ms keeps the transcript highlight in sync.
        const pollIframeTime = () => {
            if (!isMounted) return;
            const w = iframeRef.current?.contentWindow;
            if (!w) return;
            try {
                w.postMessage(
                    JSON.stringify({
                        event: "command",
                        func: "getCurrentTime",
                        args: [],
                    }),
                    "*",
                );
            } catch {}
        };
        const iframePollTimer = setInterval(pollIframeTime, 500);

        // Listen for postMessage updates from iframe as secondary time source
        const onMessage = (event) => {
            try {
                const data =
                    typeof event.data === "string"
                        ? JSON.parse(event.data)
                        : event.data;
                if (
                    data?.event === "infoDelivery" &&
                    typeof data?.info?.currentTime === "number"
                ) {
                    fallbackClockRef.current = {
                        base: data.info.currentTime,
                        startedAt: Date.now(),
                    };
                    setCurrentTime(data.info.currentTime);
                }
            } catch {}
        };
        window.addEventListener("message", onMessage);

        return () => {
            isMounted = false;
            if (timer) clearInterval(timer);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            clearInterval(iframePollTimer);
            window.removeEventListener("message", onMessage);
            if (
                playerRef.current &&
                typeof playerRef.current.destroy === "function"
            ) {
                try {
                    playerRef.current.destroy();
                } catch {}
            }
        };
    }, [containerId, videoId]);

    useEffect(() => {
        if (!useFallbackIframe || !playerReady) return undefined;
        fallbackClockRef.current = {
            base: playerStartRef.current || 0,
            startedAt: Date.now(),
        };
        const timer = setInterval(() => {
            const { base, startedAt } = fallbackClockRef.current;
            if (!startedAt) return;
            setCurrentTime(base + (Date.now() - startedAt) / 1000);
        }, 500);
        return () => clearInterval(timer);
    }, [playerReady, useFallbackIframe, videoId]);

    // 3. Find active transcript chunk based on currentTime
    const activeIndex = useMemo(() => {
        if (!transcripts || transcripts.length === 0) return -1;
        const cur = Math.floor(currentTime);
        return transcripts.findIndex(
            (t) => cur >= t.start_seconds && cur <= t.end_seconds,
        );
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
    const handleSeek = useCallback((seconds) => {
        if (
            playerRef.current &&
            typeof playerRef.current.seekTo === "function"
        ) {
            try {
                playerRef.current.seekTo(seconds, true);
                playerRef.current.playVideo?.();
            } catch {}
        } else if (iframeRef.current?.contentWindow) {
            try {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({
                        event: "command",
                        func: "seekTo",
                        args: [seconds, true],
                    }),
                    "*",
                );
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({
                        event: "command",
                        func: "playVideo",
                        args: [],
                    }),
                    "*",
                );
            } catch {}
        }
        fallbackClockRef.current = {
            base: seconds,
            startedAt: Date.now(),
        };
        setCurrentTime(seconds);
    }, []);

    const toggleBookmark = (id) => {
        setBookmarked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openNewNote = () => {
        const start = Math.floor(currentTime || 0);
        setEditingNoteId(null);
        setNoteStart(start);
        setNoteEnd("");
        setNoteText("");
        setIsWritingNote(true);
    };

    const openEditNote = (note) => {
        setEditingNoteId(note.id);
        setNoteStart(Number(note.start) || 0);
        setNoteEnd(
            note.end && note.end > 0 ? String(Math.floor(note.end)) : "",
        );
        setNoteText(note.text || "");
        setIsWritingNote(true);
    };

    const cancelNote = () => {
        setIsWritingNote(false);
        setEditingNoteId(null);
        setNoteText("");
        setNoteEnd("");
    };

    const saveNote = async () => {
        const text = noteText.trim();
        if (!text) return;
        const start = Math.max(0, Math.floor(Number(noteStart) || 0));
        const endRaw = String(noteEnd).trim();
        const end =
            endRaw === "" ? 0 : Math.max(0, Math.floor(Number(endRaw) || 0));
        if (end && end <= start) {
            return;
        }

        if (editingNoteId) {
            const isNumericId = typeof editingNoteId === "number" || /^\d+$/.test(String(editingNoteId));
            setNotes((prev) =>
                prev.map((n) =>
                    n.id === editingNoteId
                        ? { ...n, start, end, text, updatedAt: Date.now() }
                        : n,
                ),
            );
            if (isAuthenticated && isNumericId) {
                try {
                    await kajianNoteApi.update(editingNoteId, {
                        start_sec: start,
                        end_sec: end > 0 ? end : null,
                        content: text,
                    });
                } catch {
                    // fallback to local
                }
            }
        } else {
            const tempId = `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const note = {
                id: tempId,
                start,
                end,
                text,
                createdAt: Date.now(),
            };
            setNotes((prev) => [note, ...prev]);

            if (isAuthenticated && item?.kajian_id) {
                try {
                    const res = await kajianNoteApi.create({
                        kajian_id: item.kajian_id,
                        start_sec: start,
                        end_sec: end > 0 ? end : null,
                        content: text,
                    });
                    if (res.ok) {
                        const saved = await parseApiJson(res);
                        if (saved?.id) {
                            setNotes((prev) =>
                                prev.map((n) =>
                                    n.id === tempId
                                        ? {
                                              ...n,
                                              id: saved.id,
                                              isCloud: true,
                                          }
                                        : n,
                                ),
                            );
                        }
                    }
                } catch {
                    // keep local
                }
            }
        }
        cancelNote();
    };

    const deleteNote = async (id) => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (editingNoteId === id) cancelNote();

        const isNumericId = typeof id === "number" || /^\d+$/.test(String(id));
        if (isAuthenticated && isNumericId) {
            try {
                await kajianNoteApi.delete(id);
            } catch {
                // ignore
            }
        }
    };

    const seekFromNote = (note) => {
        handleSeek(Number(note.start) || 0);
    };

    const copyNoteAsLink = async (note) => {
        if (typeof window === "undefined") return;
        const base = item?.timestamp_url || "";
        if (!base) return;
        const start = Math.max(0, Math.floor(Number(note.start) || 0));
        const end = note.end ? Math.floor(Number(note.end) || 0) : 0;
        const tParam = end > 0 && end > start ? `${start}-${end}` : `${start}`;
        const link = base.includes("?")
            ? `${base}${base.endsWith("&") ? "" : "&"}t=${tParam}s`
            : `${base}${base.includes("#") ? "" : ""}${base.includes("?") ? "&" : "?"}t=${tParam}s`;
        try {
            await navigator.clipboard.writeText(link);
            setCopiedNoteId(note.id);
            setTimeout(() => setCopiedNoteId(null), 1500);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = link;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand("copy");
                setCopiedNoteId(note.id);
                setTimeout(() => setCopiedNoteId(null), 1500);
            } catch {
                // ignore
            }
            document.body.removeChild(ta);
        }
    };

    const sortedNotes = useMemo(
        () => [...notes].sort((a, b) => (a.start || 0) - (b.start || 0)),
        [notes],
    );

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
            panelClassName='bg-white dark:bg-slate-900 w-[90vw] max-w-none rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col'
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
                    <svg
                        width='1em'
                        height='1em'
                        viewBox='0 0 16 16'
                        fill='currentColor'
                        className='text-2xl'
                        aria-hidden='true'
                    >
                        <path d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z' />
                    </svg>
                </button>
            </div>

            {/* Content: Video Player + Synchronized Transcripts */}
            <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden bg-gray-50 dark:bg-slate-950'>
                {/* Left Col: Video Player & Current Quote (7 cols) */}
                <div className='lg:col-span-7 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-800'>
                    <div className='aspect-video w-full bg-black shrink-0 relative'>
                        {useFallbackIframe && videoId ? (
                            <>
                                <iframe
                                    ref={iframeRef}
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&start=${Math.floor(playerStart || 0)}&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
                                    title={item?.title || "YouTube player"}
                                    allow='autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture'
                                    allowFullScreen
                                    onLoad={() => {
                                        try {
                                            iframeRef.current?.contentWindow?.postMessage(
                                                JSON.stringify({
                                                    event: "listening",
                                                }),
                                                "*",
                                            );
                                        } catch {}
                                    }}
                                    className='absolute inset-0 w-full h-full'
                                />
                                {!playerReady && (
                                    <button
                                        type='button'
                                        onClick={() => {
                                            try {
                                                if (
                                                    iframeRef.current
                                                        ?.contentWindow
                                                ) {
                                                    iframeRef.current.contentWindow.postMessage(
                                                        JSON.stringify({
                                                            event: "command",
                                                            func: "playVideo",
                                                            args: [],
                                                        }),
                                                        "*",
                                                    );
                                                }
                                            } catch {}
                                            setPlayerReady(true);
                                        }}
                                        className='absolute inset-0 z-10 flex items-center justify-center bg-black/60 hover:bg-black/50 transition-colors group'
                                        aria-label={t("kajian.play_video")}
                                    >
                                        <span className='w-20 h-20 rounded-full bg-red-600 group-hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-colors'>
                                            <svg
                                                className='w-10 h-10 ml-1'
                                                fill='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path d='M8 5v14l11-7z' />
                                            </svg>
                                        </span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <div id={containerId} className='w-full h-full' />
                        )}
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
                            &ldquo;{highlightText(item.snippet, searchQuery)}
                            &rdquo;
                        </p>
                    </div>
                </div>

                {/* Right Col: Live Synchronized Transcripts & Notes (5 cols) */}
                <div className='lg:col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900'>
                    {/* Top Tab Bar & Quick Action */}
                    <div className='p-2.5 sm:p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/40 flex items-center justify-between gap-2 shrink-0'>
                        <div className='flex items-center gap-1 bg-gray-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs'>
                            <button
                                type='button'
                                onClick={() => setSideTab("transcript")}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                                    sideTab === "transcript"
                                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                }`}
                            >
                                <span>📜 Transkrip</span>
                                {transcripts.length > 0 && (
                                    <span className='text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-300'>
                                        {transcripts.length}
                                    </span>
                                )}
                            </button>
                            <button
                                type='button'
                                onClick={() => setSideTab("notes")}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                                    sideTab === "notes"
                                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                }`}
                            >
                                <span>📝 Catatan</span>
                                {notes.length > 0 && (
                                    <span className='text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'>
                                        {notes.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <button
                            type='button'
                            onClick={() => {
                                setSideTab("notes");
                                openNewNote();
                            }}
                            className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors'
                            title='Catat momen video saat ini'
                        >
                            <span>+</span> Catat Momen
                        </button>
                    </div>

                    {sideTab === "transcript" ? (
                        <>
                            {/* Transcript Filter & Auto-scroll Header */}
                            <div className='p-2.5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0'>
                                <div className='flex-1 flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs'>
                                    <SearchIcon className='w-3 h-3 text-gray-400' />
                                    <input
                                        type='text'
                                        placeholder={
                                            t("kajian.filter_in_video") ||
                                            "Cari kalimat di video..."
                                        }
                                        value={filterQuery}
                                        onChange={(e) =>
                                            setFilterQuery(e.target.value)
                                        }
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
                                <label className='flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer select-none shrink-0'>
                                    <input
                                        type='checkbox'
                                        checked={autoScroll}
                                        onChange={(e) =>
                                            setAutoScroll(e.target.checked)
                                        }
                                        className='rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5'
                                    />
                                    Auto-scroll
                                </label>
                            </div>

                            {/* Transcripts List */}
                            <div
                                ref={listContainerRef}
                                className='flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 min-h-[220px] max-h-[360px] lg:max-h-none text-xs'
                            >
                                {loadingTranscripts ? (
                                    <div className='flex flex-col items-center justify-center h-48 text-gray-400'>
                                        <div className='animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent mb-2' />
                                        <span className='text-xs'>
                                            {t("kajian.loading_transcript")}
                                        </span>
                                    </div>
                                ) : displayedTranscripts.length === 0 ? (
                                    <div className='text-center py-12 text-gray-400 text-xs'>
                                        {filterQuery
                                            ? t("kajian.no_matching_sentence")
                                            : t("kajian.transcript_not_available")}
                                    </div>
                                ) : (
                                    displayedTranscripts.map((chunk, idx) => {
                                        const isCurrent =
                                            transcripts.indexOf(chunk) === activeIndex;
                                        const isBookmarked = bookmarked.has(chunk.id);
                                        return (
                                            <div
                                                key={chunk.id || idx}
                                                ref={isCurrent ? activeChunkRef : null}
                                                onClick={() =>
                                                    handleSeek(chunk.start_seconds)
                                                }
                                                className={`group p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-200 flex gap-2 items-start ${
                                                    isCurrent
                                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-[1.01]"
                                                        : "hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                <button
                                                    type='button'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleBookmark(chunk.id);
                                                    }}
                                                    className={`shrink-0 text-sm transition-opacity ${
                                                        isBookmarked
                                                            ? "opacity-100"
                                                            : "opacity-30 hover:opacity-70"
                                                    }`}
                                                    title={
                                                        isBookmarked
                                                            ? t(
                                                                  "kajian.remove_bookmark",
                                                              )
                                                            : t("kajian.add_bookmark")
                                                    }
                                                >
                                                    {isBookmarked ? "🔖" : "⚪"}
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSideTab("notes");
                                                        setEditingNoteId(null);
                                                        setNoteStart(chunk.start_seconds || 0);
                                                        setNoteEnd(
                                                            chunk.end_seconds && chunk.end_seconds > chunk.start_seconds
                                                                ? String(Math.floor(chunk.end_seconds))
                                                                : "",
                                                        );
                                                        setNoteText(chunk.text || "");
                                                        setIsWritingNote(true);
                                                    }}
                                                    className='shrink-0 text-xs opacity-30 hover:opacity-100 transition-opacity p-0.5'
                                                    title='Catat bagian ini'
                                                >
                                                    📝
                                                </button>
                                                <button
                                                    type='button'
                                                    className={`shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                                                        isCurrent
                                                            ? "bg-white/20 text-white"
                                                            : "bg-gray-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50"
                                                    }`}
                                                >
                                                    {formatTime(chunk.start_seconds)}
                                                </button>
                                                <p
                                                    className={`flex-1 text-xs leading-relaxed ${isCurrent ? "font-medium" : ""}`}
                                                >
                                                    {highlightText(
                                                        chunk.text,
                                                        filterQuery || searchQuery,
                                                    )}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        <div className='flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50/50 dark:bg-slate-950/50'>
                            {/* Note Editor Form */}
                            {isWritingNote && (
                                <div className='p-3 m-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700/60 shadow-sm shrink-0 flex flex-col gap-2.5'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1'>
                                            📝 {editingNoteId ? "Edit Catatan" : "Tambah Catatan Baru"}
                                        </span>
                                        <span className='text-[10px] text-gray-400 font-mono'>
                                            Waktu video: {formatTime(currentTime)}
                                        </span>
                                    </div>

                                    {/* Start & End Timestamps Controls */}
                                    <div className='grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-lg text-xs'>
                                        <div>
                                            <label className='block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1'>
                                                Mulai:
                                            </label>
                                            <div className='flex items-center gap-1.5 flex-wrap'>
                                                <span className='font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600'>
                                                    {formatTime(noteStart)}
                                                </span>
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        setNoteStart(Math.floor(currentTime || 0))
                                                    }
                                                    className='px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-[10px] text-gray-700 dark:text-gray-200'
                                                    title='Set ke waktu video sekarang'
                                                >
                                                    📍 Sekarang
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        setNoteStart((prev) => Math.max(0, prev - 5))
                                                    }
                                                    className='px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-[10px] text-gray-700 dark:text-gray-200'
                                                    title='Mundur 5 detik'
                                                >
                                                    -5s
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        setNoteStart((prev) => prev + 5)
                                                    }
                                                    className='px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-[10px] text-gray-700 dark:text-gray-200'
                                                    title='Maju 5 detik'
                                                >
                                                    +5s
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className='block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1'>
                                                Selesai (opsional):
                                            </label>
                                            <div className='flex items-center gap-1.5 flex-wrap'>
                                                <span className='font-mono text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600'>
                                                    {noteEnd !== "" && noteEnd !== null ? formatTime(Number(noteEnd)) : "—"}
                                                </span>
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        setNoteEnd(String(Math.floor(currentTime || 0)))
                                                    }
                                                    className='px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-[10px] text-gray-700 dark:text-gray-200'
                                                    title='Set ke waktu video sekarang'
                                                >
                                                    📍 Sekarang
                                                </button>
                                                {noteEnd !== "" && noteEnd !== null && (
                                                    <button
                                                        type='button'
                                                        onClick={() => setNoteEnd("")}
                                                        className='px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-600 text-[10px] text-gray-500'
                                                        title='Hapus waktu selesai'
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Note Textarea */}
                                    <div>
                                        <textarea
                                            rows={3}
                                            placeholder='Tulis faedah kajian, dalil, kutipan pemateri, atau ringkasan...'
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            className='w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:ring-1 focus:ring-emerald-500 outline-none resize-none'
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className='flex items-center justify-end gap-2'>
                                        <button
                                            type='button'
                                            onClick={cancelNote}
                                            className='px-3 py-1 text-xs rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type='button'
                                            onClick={saveNote}
                                            disabled={!noteText.trim()}
                                            className='px-3.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm transition-colors'
                                        >
                                            💾 Simpan Catatan
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Notes Toolbar when not writing */}
                            {!isWritingNote && (
                                <div className='p-2.5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0'>
                                    <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                                        {notes.length} catatan disimpan
                                    </span>
                                    <div className='flex items-center gap-2'>
                                        {notes.length > 0 && (
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    const lines = [
                                                        `📝 Catatan Kajian: ${item.title || ""}`,
                                                        `🎙️ Pemateri: ${item.speaker || ""}`,
                                                        "",
                                                        ...sortedNotes.map((n, i) => {
                                                            const timeStr = n.end
                                                                ? `${formatTime(n.start)} - ${formatTime(n.end)}`
                                                                : formatTime(n.start);
                                                            return `${i + 1}. [${timeStr}]\n${n.text}\n`;
                                                        }),
                                                    ];
                                                    navigator?.clipboard?.writeText(lines.join("\n"));
                                                    setCopiedNoteId("all");
                                                    setTimeout(() => setCopiedNoteId(null), 1500);
                                                }}
                                                className='px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                                            >
                                                {copiedNoteId === "all" ? "✓ Tersalin!" : "📋 Salin Semua"}
                                            </button>
                                        )}
                                        <button
                                            type='button'
                                            onClick={openNewNote}
                                            className='px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors'
                                        >
                                            + Catatan Baru
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Notes List */}
                            <div className='flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 min-h-[220px] max-h-[360px] lg:max-h-none text-xs'>
                                {sortedNotes.length === 0 && !isWritingNote ? (
                                    <div className='flex flex-col items-center justify-center h-48 text-center p-4 text-gray-400'>
                                        <div className='text-3xl mb-2'>📝</div>
                                        <p className='font-semibold text-gray-700 dark:text-gray-300 text-xs mb-1'>
                                            Belum ada catatan
                                        </p>
                                        <p className='text-[11px] text-gray-500 max-w-xs mb-3'>
                                            Catat poin penting, ayat, atau faedah saat menonton kajian dengan rentang waktu video.
                                        </p>
                                        <button
                                            type='button'
                                            onClick={openNewNote}
                                            className='px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors'
                                        >
                                            + Buat Catatan Pertama
                                        </button>
                                    </div>
                                ) : (
                                    sortedNotes.map((n) => {
                                        const isPlayingRange =
                                            currentTime >= n.start &&
                                            (n.end && n.end > n.start
                                                ? currentTime <= n.end
                                                : currentTime <= n.start + 10);
                                        return (
                                            <div
                                                key={n.id}
                                                className={`p-3 rounded-xl border transition-all ${
                                                    isPlayingRange
                                                        ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 shadow-sm"
                                                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-slate-700"
                                                }`}
                                            >
                                                <div className='flex items-center justify-between gap-2 mb-2'>
                                                    <button
                                                        type='button'
                                                        onClick={() => seekFromNote(n)}
                                                        className='inline-flex items-center gap-1 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 px-2 py-0.5 rounded transition-colors group'
                                                        title='Klik untuk putar dari momen ini'
                                                    >
                                                        <span className='text-[10px] group-hover:scale-110 transition-transform'>
                                                            ▶
                                                        </span>
                                                        <span>{formatTime(n.start)}</span>
                                                        {n.end && n.end > n.start && (
                                                            <>
                                                                <span className='text-gray-400 font-normal'>-</span>
                                                                <span>{formatTime(n.end)}</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <div className='flex items-center gap-1'>
                                                        <button
                                                            type='button'
                                                            onClick={() => copyNoteAsLink(n)}
                                                            className='p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs'
                                                            title='Salin link momen ini'
                                                        >
                                                            {copiedNoteId === n.id ? "✓" : "🔗"}
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => openEditNote(n)}
                                                            className='p-1 rounded text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs'
                                                            title='Edit catatan'
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => deleteNote(n.id)}
                                                            className='p-1 rounded text-gray-400 hover:text-red-600 text-xs'
                                                            title='Hapus catatan'
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className='whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-200 leading-relaxed'>
                                                    {n.text}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
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
                    <span className='text-sm' aria-hidden='true'>
                        ▶
                    </span>
                    Buka di YouTube
                    <svg
                        width='1em'
                        height='1em'
                        viewBox='0 0 16 16'
                        fill='currentColor'
                        className='text-[10px]'
                        aria-hidden='true'
                    >
                        <path
                            fill-rule='evenodd'
                            d='M10.5 7H5.5v2h5V7zm-1 4H6.5v-2h3v2zm-5-9h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM6.5 11h3v-2h-3v2zM4 6h8v-.5a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5V6z'
                            clip-rule='evenodd'
                        />
                    </svg>
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
