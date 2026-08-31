"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useLocale } from "@/context/Locale";
import { audioApi, quranApi } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    BsChevronDown,
    BsChevronUp,
    BsPauseFill,
    BsPlayFill,
    BsSkipBackwardFill,
    BsSkipForwardFill,
    BsVolumeUpFill,
    BsX,
} from "react-icons/bs";

const AUDIO_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
const AUDIO_PREF_KEY = "tholabul:quran-audio-web";
const DEFAULT_QARI = "mishary-rashid-alafasy";
const MIN_SURAH_NUMBER = 1;
const MAX_SURAH_NUMBER = 114;

const QARI_CATALOG = {
    "mishary-rashid-alafasy": {
        name: "Mishary Rashid Al-Afasy",
        country: "Kuwait",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Mishary_bin_Rashid_Al-Afasy.jpg/220px-Mishary_bin_Rashid_Al-Afasy.jpg",
    },
    "abdurrahman-as-sudais": {
        name: "Abdurrahman As-Sudais",
        country: "Arab Saudi",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Abdul_Rahman_Al-Sudais.jpg/220px-Abdul_Rahman_Al-Sudais.jpg",
    },
    "abdul-basit": {
        name: "Abdul Basit Abdul Samad",
        country: "Mesir",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Abdul_Basit_Abdul_Samad.jpg/220px-Abdul_Basit_Abdul_Samad.jpg",
    },
    "saad-al-ghamidi": {
        name: "Sa'ad Al-Ghamidi",
        country: "Arab Saudi",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Saad_Al-Ghamidi.jpg/220px-Saad_Al-Ghamidi.jpg",
    },
    "yasser-al-dosari": {
        name: "Yasser Al-Dosari",
        country: "Arab Saudi",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Yasser_Al-Dosari.jpg/220px-Yasser_Al-Dosari.jpg",
    },
    "maher-al-muaiqly": {
        name: "Maher Al-Muaiqly",
        country: "Arab Saudi",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Maher_Al-Muaiqly.jpg/220px-Maher_Al-Muaiqly.jpg",
    },
    "hani-ar-rifai": {
        name: "Hani Ar-Rifai",
        country: "Arab Saudi",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Hani_Ar-Rifai.jpg/220px-Hani_Ar-Rifai.jpg",
    },
    "salah-bukhatir": {
        name: "Salah Bukhatir",
        country: "Arab Saudi",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Salah_Bukhatir.jpg/220px-Salah_Bukhatir.jpg",
    },
    "abdullah-al-juhany": {
        name: "Abdullah Al-Juhany",
        country: "Arab Saudi",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Abdullah_Al-Juhany.jpg/220px-Abdullah_Al-Juhany.jpg",
    },
    "ali-al-hudhaify": {
        name: "Ali Abdurrahman Al-Hudhaify",
        country: "Yaman",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Ali_Al-Hudhaify.jpg/220px-Ali_Al-Hudhaify.jpg",
    },
};

const QARI_FALLBACK_AVATAR =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%2310b981"/><text x="50%25" y="55%25" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="white">Q</text></svg>';

const getQariInfo = (slug) =>
    QARI_CATALOG[slug] || {
        name: slug,
        country: "",
        photo: QARI_FALLBACK_AVATAR,
    };

const getQariInitials = (name) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "Q";

const normalizeItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (payload?.audio_url) return [payload];
    return [];
};

const toPositiveInt = (value) => {
    const numeric = Number.parseInt(`${value ?? ""}`, 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const isValidSurahNumber = (value) =>
    Number.isInteger(value) &&
    value >= MIN_SURAH_NUMBER &&
    value <= MAX_SURAH_NUMBER;

const clampSpeed = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.max(0.5, Math.min(2, numeric));
};

const normalizeAyah = (item, surahNumber) => ({
    id: item?.id,
    number: Number(item?.number ?? item?.ayah_number ?? item?.ayahNumber),
    surahName:
        item?.surah?.translation?.latin_en ??
        item?.surah_name ??
        item?.surahName,
    surahNumber: Number(
        item?.surah?.number ??
            item?.surah_number ??
            item?.surahNumber ??
            surahNumber,
    ),
});

export default function SurahAudioPlayer({
    surahName,
    surahNumber,
    totalAyahs,
}) {
    const { t } = useLocale();
    const pathname = usePathname();
    const audioRef = useRef(null);
    const queueRef = useRef([]);
    const queueIndexRef = useRef(0);
    const repeatRef = useRef(false);
    const sessionRef = useRef(0);
    const sourceCacheRef = useRef({});
    const speedRef = useRef(1);
    const qariRef = useRef(DEFAULT_QARI);

    const [audioList, setAudioList] = useState([]);
    const [currentLabel, setCurrentLabel] = useState("");
    const [error, setError] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [open, setOpen] = useState(false);
    const [queueIndex, setQueueIndex] = useState(0);
    const [queueLength, setQueueLength] = useState(0);
    const [range, setRange] = useState({
        endAyah: "",
        endSurah: `${surahNumber ?? ""}`,
        startSurah: `${surahNumber ?? ""}`,
    });
    const [repeat, setRepeat] = useState(false);
    const [selectedQari, setSelectedQari] = useState(DEFAULT_QARI);
    const [qariDropdownOpen, setQariDropdownOpen] = useState(false);
    const [speed, setSpeed] = useState(1);
    const label = (key, fallback) => {
        const value = t(key);
        return value === key || value == null ? fallback : value;
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const stored = JSON.parse(
                localStorage.getItem(AUDIO_PREF_KEY) || "{}",
            );
            if (typeof stored.qari === "string") {
                setSelectedQari(stored.qari);
                qariRef.current = stored.qari;
            }
            if (typeof stored.repeat === "boolean") {
                setRepeat(stored.repeat);
                repeatRef.current = stored.repeat;
            }
            if (stored.speed) {
                const nextSpeed = clampSpeed(stored.speed);
                setSpeed(nextSpeed);
                speedRef.current = nextSpeed;
            }
            if (stored.range && typeof stored.range === "object") {
                setRange((current) => ({
                    ...current,
                    endAyah: `${stored.range.endAyah ?? current.endAyah}`,
                    endSurah: `${stored.range.endSurah ?? current.endSurah}`,
                    startSurah: `${stored.range.startSurah ?? current.startSurah}`,
                }));
            }
        } catch {
            // Preferences are optional and should not block Quran reading.
        }
    }, []);

    useEffect(() => {
        qariRef.current = selectedQari;
        repeatRef.current = repeat;
        speedRef.current = speed;
    }, [repeat, selectedQari, speed]);

    useEffect(() => {
        setRange((current) => ({
            ...current,
            endSurah: current.endSurah || `${surahNumber ?? ""}`,
            startSurah: current.startSurah || `${surahNumber ?? ""}`,
        }));
    }, [surahNumber]);

    useEffect(() => {
        if (!surahNumber || !open) return;
        let active = true;
        setLoading(true);
        setError("");
        const loadQariOptions = async () => {
            const ayahRes = await quranApi.bySurahPage(surahNumber, 0, 1);
            if (!ayahRes.ok) throw new Error("ayah");
            const firstAyah = normalizeItems(await ayahRes.json())
                .map((item) => normalizeAyah(item, surahNumber))
                .find((ayah) => ayah.id);
            if (!firstAyah?.id) throw new Error("ayah");

            const audioRes = await audioApi.byAyah(firstAyah.id);
            if (!audioRes.ok) throw new Error("audio");
            const items = normalizeItems(await audioRes.json()).filter(
                (item) => item.audio_url,
            );
            if (items.length) return items;

            const surahRes = await audioApi.bySurah(surahNumber);
            if (!surahRes.ok) throw new Error("surah-audio");
            return normalizeItems(await surahRes.json()).filter(
                (item) => item.audio_url,
            );
        };

        loadQariOptions()
            .then((items) => {
                if (!active) return;
                setAudioList(items);
                if (
                    items.length &&
                    !items.some((item) => item.qari_slug === qariRef.current)
                ) {
                    setSelectedQari(items[0].qari_slug);
                    qariRef.current = items[0].qari_slug;
                }
            })
            .catch(() => setError("Gagal memuat audio."))
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [open, surahNumber]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        stopPlayback({ keepOpen: true });
        setRange({
            endAyah: "",
            endSurah: `${surahNumber ?? ""}`,
            startSurah: `${surahNumber ?? ""}`,
        });
    }, [surahNumber]);

    const persistPreferences = (next = {}) => {
        if (typeof window === "undefined") return;
        const payload = {
            qari: qariRef.current,
            range,
            repeat: repeatRef.current,
            speed: speedRef.current,
            ...next,
        };
        localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify(payload));
    };

    const stopPlayback = ({ keepOpen = false } = {}) => {
        sessionRef.current += 1;
        queueRef.current = [];
        queueIndexRef.current = 0;
        setQueueIndex(0);
        setQueueLength(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setCurrentLabel("");
        setIsPlaying(false);
        setLoading(false);
        if (!keepOpen) {
            setMinimized(false);
            setOpen(false);
        }
    };

    const getAyahSources = async (ayah) => {
        if (sourceCacheRef.current[ayah.id])
            return sourceCacheRef.current[ayah.id];
        const res = await audioApi.byAyah(ayah.id);
        if (!res.ok) throw new Error("audio");
        const items = normalizeItems(await res.json()).filter(
            (item) => item.audio_url,
        );
        sourceCacheRef.current = {
            ...sourceCacheRef.current,
            [ayah.id]: items,
        };
        return items;
    };

    const buildAudioCandidates = (sources) => {
        const selected = sources.find(
            (item) => item.qari_slug === qariRef.current,
        );
        return [
            ...(selected ? [selected] : []),
            ...sources.filter(
                (item) =>
                    item.audio_url && item.qari_slug !== selected?.qari_slug,
            ),
        ];
    };

    const fetchRangeQueue = async ({ endAyah, endSurah, startSurah }) => {
        const nextQueue = [];
        for (
            let currentSurah = startSurah;
            currentSurah <= endSurah;
            currentSurah += 1
        ) {
            const res = await quranApi.bySurahPage(currentSurah, 0, 300);
            if (!res.ok) throw new Error("ayah");
            const ayahs = normalizeItems(await res.json())
                .map((item) => normalizeAyah(item, currentSurah))
                .filter((ayah) => ayah.id && Number.isFinite(ayah.number));
            const lastAyah =
                currentSurah === endSurah && endAyah
                    ? endAyah
                    : Number.POSITIVE_INFINITY;
            nextQueue.push(...ayahs.filter((ayah) => ayah.number <= lastAyah));
        }
        return nextQueue;
    };

    const playQueueItem = async (index, sessionId) => {
        if (sessionId !== sessionRef.current) return;
        const queue = queueRef.current;
        const nextIndex =
            index >= queue.length && repeatRef.current && queue.length
                ? 0
                : index;
        const ayah = queue[nextIndex];

        if (!ayah) {
            setCurrentLabel("");
            setIsPlaying(false);
            setLoading(false);
            return;
        }

        queueIndexRef.current = nextIndex;
        setQueueIndex(nextIndex);
        setCurrentLabel(
            `${ayah.surahName || `Surah ${ayah.surahNumber}`} · Ayat ${ayah.number}`,
        );
        setLoading(true);
        setError("");

        try {
            const sources = await getAyahSources(ayah);
            const candidates = buildAudioCandidates(sources);
            if (sessionId !== sessionRef.current) return;
            if (!candidates.length) {
                await playQueueItem(nextIndex + 1, sessionId);
                return;
            }

            const playCandidate = async (candidateIndex) => {
                if (sessionId !== sessionRef.current) return;
                const source = candidates[candidateIndex];
                if (!source?.audio_url) {
                    await playQueueItem(nextIndex + 1, sessionId);
                    return;
                }

                if (audioRef.current) audioRef.current.pause();
                const audio = new Audio(source.audio_url);
                let movedToNextCandidate = false;
                const tryNextCandidate = async () => {
                    if (
                        movedToNextCandidate ||
                        sessionId !== sessionRef.current
                    )
                        return;
                    movedToNextCandidate = true;
                    if (audioRef.current === audio) {
                        audioRef.current = null;
                    }
                    if (candidateIndex + 1 < candidates.length) {
                        setError(
                            "Audio qari ini belum tersedia, mencoba qari lain.",
                        );
                        await playCandidate(candidateIndex + 1);
                        return;
                    }
                    await playQueueItem(nextIndex + 1, sessionId);
                };

                audio.playbackRate = speedRef.current;
                audio.onended = () => playQueueItem(nextIndex + 1, sessionId);
                audio.onerror = () => tryNextCandidate();
                audio.onpause = () => setIsPlaying(false);
                audio.onplay = () => setIsPlaying(true);
                audioRef.current = audio;
                try {
                    await audio.play();
                    setLoading(false);
                    setError("");
                    setIsPlaying(true);
                } catch {
                    await tryNextCandidate();
                }
            };

            await playCandidate(0);
        } catch {
            if (sessionId !== sessionRef.current) return;
            setError(t("audio.play_error") ?? "Tidak dapat memutar audio.");
            setLoading(false);
            setIsPlaying(false);
        }
    };

    const startRangeAudio = async () => {
        const currentSurah = Number(surahNumber) || 1;
        const startSurah = toPositiveInt(range.startSurah) ?? currentSurah;
        const endSurah = toPositiveInt(range.endSurah) ?? startSurah;
        const endAyah = toPositiveInt(range.endAyah) ?? null;

        if (startSurah > endSurah) {
            setError(
                "Range audio belum valid: surat awal tidak boleh melewati surat akhir.",
            );
            return;
        }
        if (!isValidSurahNumber(startSurah) || !isValidSurahNumber(endSurah)) {
            setError(
                `Range audio belum valid: nomor surat harus ${MIN_SURAH_NUMBER}-${MAX_SURAH_NUMBER}.`,
            );
            return;
        }

        const normalizedRange = {
            endAyah: endAyah ? `${endAyah}` : "",
            endSurah: `${endSurah}`,
            startSurah: `${startSurah}`,
        };
        setRange(normalizedRange);
        persistPreferences({ range: normalizedRange });
        setLoading(true);
        setError("");
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const sessionId = sessionRef.current + 1;
        sessionRef.current = sessionId;
        try {
            const queue = await fetchRangeQueue({
                endAyah,
                endSurah,
                startSurah,
            });
            if (!queue.length) {
                setError("Ayat untuk range audio belum tersedia.");
                setLoading(false);
                return;
            }
            queueRef.current = queue;
            queueIndexRef.current = 0;
            setQueueIndex(0);
            setQueueLength(queue.length);
            await playQueueItem(0, sessionId);
        } catch {
            if (sessionId !== sessionRef.current) return;
            setError("Range audio belum bisa dimuat.");
            setLoading(false);
        }
    };

    const togglePlay = () => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }
        if (audioRef.current && queueRef.current.length) {
            audioRef.current
                .play()
                .catch(() =>
                    setError(
                        t("audio.play_error") ?? "Tidak dapat memutar audio.",
                    ),
                );
            return;
        }
        startRangeAudio();
    };

    const skipQueueItem = async (delta) => {
        const queue = queueRef.current;
        if (!queue.length || loading) return;

        let nextIndex = queueIndexRef.current + delta;
        if (nextIndex < 0) {
            nextIndex = repeatRef.current ? queue.length - 1 : 0;
        }
        if (nextIndex >= queue.length) {
            nextIndex = repeatRef.current ? 0 : queue.length - 1;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        const sessionId = sessionRef.current + 1;
        sessionRef.current = sessionId;
        await playQueueItem(nextIndex, sessionId);
    };

    const handleRangeChange = (field, value) => {
        const nextRange = { ...range, [field]: value.replace(/[^\d]/g, "") };
        setRange(nextRange);
        persistPreferences({ range: nextRange });
    };

    const handleQariChange = (qariSlug) => {
        stopPlayback({ keepOpen: true });
        setSelectedQari(qariSlug);
        qariRef.current = qariSlug;
        persistPreferences({ qari: qariSlug });
    };

    const handleRepeatChange = (checked) => {
        setRepeat(checked);
        repeatRef.current = checked;
        persistPreferences({ repeat: checked });
    };

    const handleSpeedChange = (nextSpeed) => {
        const normalizedSpeed = clampSpeed(nextSpeed);
        setSpeed(normalizedSpeed);
        speedRef.current = normalizedSpeed;
        if (audioRef.current) audioRef.current.playbackRate = normalizedSpeed;
        persistPreferences({ speed: normalizedSpeed });
    };

    const currentAudio =
        audioList.find((item) => item.qari_slug === selectedQari) ??
        audioList[0];
    const isDashboard = pathname?.startsWith("/dashboard");
    const bottomClass = isDashboard ? "bottom-[84px] md:bottom-4" : "bottom-4";
    const canSkipBackward = queueLength > 0 && (repeat || queueIndex > 0);
    const canSkipForward =
        queueLength > 0 && (repeat || queueIndex < queueLength - 1);

    if (!open) {
        return (
            <button
                type='button'
                onClick={() => {
                    setMinimized(false);
                    setOpen(true);
                }}
                className='inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors'
            >
                <BsVolumeUpFill />
                {label("audio.listen_surah", "Dengar Surah")}
            </button>
        );
    }

    if (minimized) {
        return (
            <div
                className={`fixed ${bottomClass} left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-3 transition-[bottom] duration-200`}
            >
                <div className='flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800'>
                    <button
                        type='button'
                        onClick={togglePlay}
                        disabled={loading}
                        aria-label={isPlaying ? t("audio.pause") : t("audio.play")}
                        className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-60'
                    >
                        {isPlaying ? (
                            <BsPauseFill className='text-xl' />
                        ) : (
                            <BsPlayFill className='text-xl' />
                        )}
                    </button>
                    <button
                        type='button'
                        onClick={() => setMinimized(false)}
                        aria-label={t("audio.show")}
                        className='min-w-0 flex-1 text-left'
                    >
                        <p className='truncate text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                            {currentLabel ||
                                surahName ||
                                `Surah ${surahNumber}`}
                        </p>
                        <p className='truncate text-[11px] text-gray-500 dark:text-gray-400'>
                            {loading
                                ? "Memuat audio..."
                                : `${currentAudio?.qari_name ?? "Pilih qari"} · ${speed}x`}
                        </p>
                    </button>
                    <button
                        type='button'
                        onClick={() => setMinimized(false)}
                        aria-label={t("audio.show")}
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white'
                    >
                        <BsChevronUp className='text-lg' />
                    </button>
                    <button
                        type='button'
                        onClick={() => stopPlayback()}
                        aria-label={t("audio.close")}
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-200'
                    >
                        <BsX className='text-lg' />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed ${bottomClass} left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-3 transition-[bottom] duration-200`}
        >
            <div className='max-h-[calc(100vh-120px)] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 shadow-xl p-3'>
                <div className='flex items-center justify-between gap-2 mb-3'>
                    <div className='min-w-0'>
                        <p className='text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate'>
                            {currentLabel ||
                                surahName ||
                                `Surah ${surahNumber}`}
                        </p>
                        <p className='text-[11px] text-gray-500 dark:text-gray-400 truncate'>
                            {currentAudio?.qari_name ?? "Pilih qari"} · {speed}x
                        </p>
                    </div>
                    <div className='flex shrink-0 items-center gap-1'>
                        <button
                            type='button'
                            onClick={() => setMinimized(true)}
                            aria-label={t("audio.minimize")}
                            className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-200'
                        >
                            <BsChevronDown className='text-base' />
                        </button>
                        <button
                            type='button'
                            onClick={() => stopPlayback()}
                        aria-label={t("audio.close")}
                            className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-200'
                        >
                            <BsX className='text-lg' />
                        </button>
                    </div>
                </div>

                <div className='grid grid-cols-3 gap-2 mb-3'>
                    {[
                        ["startSurah", "Dari surat", `${surahNumber ?? ""}`],
                        ["endSurah", "Sampai surat", `${surahNumber ?? ""}`],
                        ["endAyah", "Sampai ayat", `${totalAyahs ?? ""}`],
                    ].map(([field, label, placeholder]) => (
                        <label key={field} className='block'>
                            <span className='mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                {label}
                            </span>
                            <input
                                type='text'
                                inputMode='numeric'
                                value={range[field]}
                                onChange={(event) =>
                                    handleRangeChange(field, event.target.value)
                                }
                                placeholder={placeholder}
                                className='w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-bold text-gray-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                            />
                        </label>
                    ))}
                </div>

                <div className='flex items-center justify-center gap-2 mb-3'>
                    <button
                        type='button'
                        onClick={() => skipQueueItem(-1)}
                        disabled={loading || !canSkipBackward}
                        aria-label={t("audio.prev")}
                        className='p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors'
                    >
                        <BsSkipBackwardFill />
                    </button>
                    <button
                        type='button'
                        onClick={togglePlay}
                        disabled={loading}
                        className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60'
                    >
                        {isPlaying ? (
                            <BsPauseFill className='text-xl' />
                        ) : (
                            <BsPlayFill className='text-xl' />
                        )}
                        {loading
                            ? "Memuat"
                            : isPlaying
                              ? "Jeda"
                              : "Putar range"}
                    </button>
                    <button
                        type='button'
                        onClick={() => skipQueueItem(1)}
                        disabled={loading || !canSkipForward}
                        aria-label={t("audio.next")}
                        className='p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors'
                    >
                        <BsSkipForwardFill />
                    </button>
                </div>

                {loading && (
                    <p className='text-xs text-gray-400 text-center py-1'>
                        {label("common.loading", "Memuat...")}
                    </p>
                )}

                {error && !loading && (
                    <p className='text-xs text-red-500 dark:text-red-400 text-center py-1'>
                        {error}
                    </p>
                )}

                {audioList.length > 0 && (
                    <div className='mb-2'>
                        <p className='mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                            Qari
                        </p>
                        <div
                            className='relative'
                            onBlur={(event) => {
                                if (
                                    !event.currentTarget.contains(
                                        event.relatedTarget,
                                    )
                                )
                                    setQariDropdownOpen(false);
                            }}
                        >
                            <button
                                type='button'
                                onClick={() =>
                                    setQariDropdownOpen((value) => !value)
                                }
                                aria-label={t("audio.select_qari")}
                                aria-expanded={qariDropdownOpen}
                                className='flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 pr-8 text-left outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900'
                            >
                                <img
                                    src={getQariInfo(selectedQari).photo}
                                    alt={getQariInfo(selectedQari).name}
                                    onError={(event) => {
                                        event.currentTarget.src =
                                            QARI_FALLBACK_AVATAR;
                                    }}
                                    className='h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-emerald-200 dark:ring-slate-600'
                                />
                                <span className='min-w-0 flex-1'>
                                    <span className='block truncate text-xs font-semibold text-gray-900 dark:text-white'>
                                        {currentAudio?.qari_name ??
                                            getQariInfo(selectedQari).name}
                                    </span>
                                    <span className='block truncate text-[10px] text-gray-500 dark:text-gray-400'>
                                        {getQariInfo(selectedQari).country ||
                                            "Syaikh"}
                                    </span>
                                </span>
                            </button>
                            <BsChevronDown className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400' />
                            {qariDropdownOpen && (
                                <div className='absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900'>
                                    {audioList.map((item) => {
                                        const info = getQariInfo(
                                            item.qari_slug,
                                        );
                                        return (
                                            <button
                                                key={item.qari_slug}
                                                type='button'
                                                onMouseDown={(event) =>
                                                    event.preventDefault()
                                                }
                                                onClick={() => {
                                                    handleQariChange(
                                                        item.qari_slug,
                                                    );
                                                    setQariDropdownOpen(false);
                                                }}
                                                className={`flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors ${
                                                    selectedQari ===
                                                    item.qari_slug
                                                        ? "bg-emerald-50 dark:bg-emerald-900/30"
                                                        : "hover:bg-gray-50 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <img
                                                    src={info.photo}
                                                    alt={info.name}
                                                    onError={(event) => {
                                                        event.currentTarget.src =
                                                            QARI_FALLBACK_AVATAR;
                                                    }}
                                                    className='h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-emerald-100 dark:ring-slate-700'
                                                />
                                                <span className='min-w-0 flex-1'>
                                                    <span className='block truncate text-xs font-semibold text-gray-900 dark:text-white'>
                                                        {item.qari_name}
                                                    </span>
                                                    <span className='block truncate text-[10px] text-gray-500 dark:text-gray-400'>
                                                        {info.country ||
                                                            "Syaikh"}
                                                    </span>
                                                </span>
                                                {selectedQari ===
                                                    item.qari_slug && (
                                                    <span className='text-[10px] font-bold text-emerald-600 dark:text-emerald-400'>
                                                        Aktif
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                        <p className='mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                            Speed
                        </p>
                        <div className='flex flex-wrap gap-1'>
                            {AUDIO_SPEED_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    onClick={() => handleSpeedChange(option)}
                                    className={`rounded-full px-2 py-1 text-[11px] font-bold transition-colors ${
                                        speed === option
                                            ? "bg-emerald-500 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                                    }`}
                                >
                                    {option}x
                                </button>
                            ))}
                        </div>
                    </div>
                    <label className='flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400'>
                        <input
                            type='checkbox'
                            checked={repeat}
                            onChange={(event) =>
                                handleRepeatChange(event.target.checked)
                            }
                            className='accent-emerald-600'
                        />
                        Repeat
                    </label>
                </div>
            </div>
        </div>
    );
}
