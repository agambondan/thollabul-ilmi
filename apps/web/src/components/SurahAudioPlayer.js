'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useLocale } from '@/context/Locale';
import { audioApi, quranApi } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
    BsPauseFill,
    BsPlayFill,
    BsSkipBackwardFill,
    BsSkipForwardFill,
    BsVolumeUpFill,
    BsX,
} from 'react-icons/bs';

const AUDIO_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
const AUDIO_PREF_KEY = 'tholabul:quran-audio-web';
const DEFAULT_QARI = 'mishary-rashid-alafasy';

const normalizeItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (payload?.audio_url) return [payload];
    return [];
};

const toPositiveInt = (value) => {
    const numeric = Number.parseInt(`${value ?? ''}`, 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const clampSpeed = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.max(0.5, Math.min(2, numeric));
};

const normalizeAyah = (item, surahNumber) => ({
    id: item?.id,
    number: Number(item?.number ?? item?.ayah_number ?? item?.ayahNumber),
    surahName: item?.surah?.translation?.latin_en ?? item?.surah_name ?? item?.surahName,
    surahNumber: Number(item?.surah?.number ?? item?.surah_number ?? item?.surahNumber ?? surahNumber),
});

export default function SurahAudioPlayer({
    onSurahChange,
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
    const [currentLabel, setCurrentLabel] = useState('');
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState({
        endAyah: '',
        endSurah: `${surahNumber ?? ''}`,
        startSurah: `${surahNumber ?? ''}`,
    });
    const [repeat, setRepeat] = useState(false);
    const [selectedQari, setSelectedQari] = useState(DEFAULT_QARI);
    const [speed, setSpeed] = useState(1);
    const label = (key, fallback) => {
        const value = t(key);
        return value === key || value == null ? fallback : value;
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = JSON.parse(localStorage.getItem(AUDIO_PREF_KEY) || '{}');
            if (typeof stored.qari === 'string') {
                setSelectedQari(stored.qari);
                qariRef.current = stored.qari;
            }
            if (typeof stored.repeat === 'boolean') {
                setRepeat(stored.repeat);
                repeatRef.current = stored.repeat;
            }
            if (stored.speed) {
                const nextSpeed = clampSpeed(stored.speed);
                setSpeed(nextSpeed);
                speedRef.current = nextSpeed;
            }
            if (stored.range && typeof stored.range === 'object') {
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
            endSurah: current.endSurah || `${surahNumber ?? ''}`,
            startSurah: current.startSurah || `${surahNumber ?? ''}`,
        }));
    }, [surahNumber]);

    useEffect(() => {
        if (!surahNumber || !open) return;
        let active = true;
        setLoading(true);
        setError('');
        audioApi
            .bySurah(surahNumber)
            .then((r) => r.json())
            .then((data) => {
                if (!active) return;
                const items = normalizeItems(data);
                setAudioList(items);
                if (items.length && !items.some((item) => item.qari_slug === qariRef.current)) {
                    setSelectedQari(items[0].qari_slug);
                    qariRef.current = items[0].qari_slug;
                }
            })
            .catch(() => setError(t('audio.error') ?? 'Gagal memuat audio.'))
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [open, surahNumber, t]);

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
            endAyah: '',
            endSurah: `${surahNumber ?? ''}`,
            startSurah: `${surahNumber ?? ''}`,
        });
    }, [surahNumber]);

    const persistPreferences = (next = {}) => {
        if (typeof window === 'undefined') return;
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
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setCurrentLabel('');
        setIsPlaying(false);
        setLoading(false);
        if (!keepOpen) setOpen(false);
    };

    const getAyahSources = async (ayah) => {
        if (sourceCacheRef.current[ayah.id]) return sourceCacheRef.current[ayah.id];
        const res = await audioApi.byAyah(ayah.id);
        if (!res.ok) throw new Error('audio');
        const items = normalizeItems(await res.json()).filter((item) => item.audio_url);
        sourceCacheRef.current = { ...sourceCacheRef.current, [ayah.id]: items };
        return items;
    };

    const buildAudioCandidates = (sources) => {
        const selected = sources.find((item) => item.qari_slug === qariRef.current);
        return [
            ...(selected ? [selected] : []),
            ...sources.filter((item) => item.audio_url && item.qari_slug !== selected?.qari_slug),
        ];
    };

    const fetchRangeQueue = async ({ endAyah, endSurah, startSurah }) => {
        const nextQueue = [];
        for (let currentSurah = startSurah; currentSurah <= endSurah; currentSurah += 1) {
            const res = await quranApi.bySurahPage(currentSurah, 0, 300);
            if (!res.ok) throw new Error('ayah');
            const ayahs = normalizeItems(await res.json())
                .map((item) => normalizeAyah(item, currentSurah))
                .filter((ayah) => ayah.id && Number.isFinite(ayah.number));
            const lastAyah = currentSurah === endSurah && endAyah ? endAyah : Number.POSITIVE_INFINITY;
            nextQueue.push(...ayahs.filter((ayah) => ayah.number <= lastAyah));
        }
        return nextQueue;
    };

    const playQueueItem = async (index, sessionId) => {
        if (sessionId !== sessionRef.current) return;
        const queue = queueRef.current;
        const nextIndex = index >= queue.length && repeatRef.current && queue.length ? 0 : index;
        const ayah = queue[nextIndex];

        if (!ayah) {
            setCurrentLabel('');
            setIsPlaying(false);
            setLoading(false);
            return;
        }

        queueIndexRef.current = nextIndex;
        setCurrentLabel(`${ayah.surahName || `Surah ${ayah.surahNumber}`} · Ayat ${ayah.number}`);
        setLoading(true);
        setError('');

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
                    if (movedToNextCandidate || sessionId !== sessionRef.current) return;
                    movedToNextCandidate = true;
                    if (audioRef.current === audio) {
                        audioRef.current = null;
                    }
                    if (candidateIndex + 1 < candidates.length) {
                        setError('Audio qari ini belum tersedia, mencoba qari lain.');
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
                    setError('');
                    setIsPlaying(true);
                } catch {
                    await tryNextCandidate();
                }
            };

            await playCandidate(0);
        } catch {
            if (sessionId !== sessionRef.current) return;
            setError(t('audio.play_error') ?? 'Tidak dapat memutar audio.');
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
            setError('Range audio belum valid: surat awal tidak boleh melewati surat akhir.');
            return;
        }

        const normalizedRange = {
            endAyah: endAyah ? `${endAyah}` : '',
            endSurah: `${endSurah}`,
            startSurah: `${startSurah}`,
        };
        setRange(normalizedRange);
        persistPreferences({ range: normalizedRange });
        setLoading(true);
        setError('');
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const sessionId = sessionRef.current + 1;
        sessionRef.current = sessionId;
        try {
            const queue = await fetchRangeQueue({ endAyah, endSurah, startSurah });
            if (!queue.length) {
                setError('Ayat untuk range audio belum tersedia.');
                setLoading(false);
                return;
            }
            queueRef.current = queue;
            queueIndexRef.current = 0;
            await playQueueItem(0, sessionId);
        } catch {
            if (sessionId !== sessionRef.current) return;
            setError('Range audio belum bisa dimuat.');
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
            audioRef.current.play().catch(() => setError(t('audio.play_error') ?? 'Tidak dapat memutar audio.'));
            return;
        }
        startRangeAudio();
    };

    const handleRangeChange = (field, value) => {
        const nextRange = { ...range, [field]: value.replace(/[^\d]/g, '') };
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

    const currentAudio = audioList.find((item) => item.qari_slug === selectedQari) ?? audioList[0];
    const isDashboard = pathname?.startsWith('/dashboard');
    const bottomClass = isDashboard ? 'bottom-[84px] md:bottom-4' : 'bottom-4';

    if (!open) {
        return (
            <button
                type='button'
                onClick={() => setOpen(true)}
                className='inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors'
            >
                <BsVolumeUpFill />
                {label('audio.listen_surah', 'Dengar Surah')}
            </button>
        );
    }

    return (
        <div className={`fixed ${bottomClass} left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-3 transition-[bottom] duration-200`}>
            <div className='max-h-[calc(100vh-120px)] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 shadow-xl p-3'>
                <div className='flex items-center justify-between gap-2 mb-3'>
                    <div className='min-w-0'>
                        <p className='text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate'>
                            {currentLabel || surahName || `Surah ${surahNumber}`}
                        </p>
                        <p className='text-[11px] text-gray-500 dark:text-gray-400 truncate'>
                            {(currentAudio?.qari_name ?? 'Pilih qari')} · {speed}x
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={() => stopPlayback()}
                        className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    >
                        <BsX className='text-lg' />
                    </button>
                </div>

                <div className='grid grid-cols-3 gap-2 mb-3'>
                    {[
                        ['startSurah', 'Dari surat', `${surahNumber ?? ''}`],
                        ['endSurah', 'Sampai surat', `${surahNumber ?? ''}`],
                        ['endAyah', 'Sampai ayat', `${totalAyahs ?? ''}`],
                    ].map(([field, label, placeholder]) => (
                        <label key={field} className='block'>
                            <span className='mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                {label}
                            </span>
                            <input
                                type='text'
                                inputMode='numeric'
                                value={range[field]}
                                onChange={(event) => handleRangeChange(field, event.target.value)}
                                placeholder={placeholder}
                                className='w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-bold text-gray-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                            />
                        </label>
                    ))}
                </div>

                <div className='flex items-center justify-center gap-2 mb-3'>
                    <button
                        type='button'
                        onClick={() => onSurahChange?.(Math.max(1, Number(surahNumber) - 1))}
                        disabled={Number(surahNumber) <= 1}
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
                        {isPlaying ? <BsPauseFill className='text-xl' /> : <BsPlayFill className='text-xl' />}
                        {loading ? 'Memuat' : isPlaying ? 'Jeda' : 'Putar range'}
                    </button>
                    <button
                        type='button'
                        onClick={() => onSurahChange?.(Math.min(114, Number(surahNumber) + 1))}
                        disabled={Number(surahNumber) >= 114}
                        className='p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors'
                    >
                        <BsSkipForwardFill />
                    </button>
                </div>

                {loading && (
                    <p className='text-xs text-gray-400 dark:text-gray-500 text-center py-1'>
                        {label('common.loading', 'Memuat...')}
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
                        <div className='flex flex-wrap gap-1 max-h-16 overflow-y-auto'>
                            {audioList.map((item) => (
                                <button
                                    key={item.qari_slug}
                                    type='button'
                                    onClick={() => handleQariChange(item.qari_slug)}
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                                        selectedQari === item.qari_slug
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {item.qari_name}
                                </button>
                            ))}
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
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
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
                            onChange={(event) => handleRepeatChange(event.target.checked)}
                            className='accent-emerald-600'
                        />
                        Repeat
                    </label>
                </div>
            </div>
        </div>
    );
}
