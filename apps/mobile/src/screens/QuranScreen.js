import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    Info,
    Link,
    Minus,
    MoreVertical,
    Pause,
    Plus,
    Save,
    Search,
    SlidersHorizontal,
    StickyNote,
    Volume2,
} from 'lucide-react-native';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    getAsbabForAyah,
    getAyahAudio,
    getAyahById,
    getAyahsForHizb,
    getAyahsForPage,
    getAyahsForSurahPage,
    getFirstAyahForSurah,
    getHadithsForAyah,
    getMufrodatByPage,
    getMunasabahForAyah,
    getSurahs,
    getTafsirForAyah,
} from '../api/client';
import {
    addBookmark,
    deleteBookmark,
    getBookmarks,
    getHafalanList,
    getHafalanSummary,
    getMurojaahSession,
    getQuranProgress,
    saveMurojaahResult,
    saveQuranProgress,
    updateHafalanStatus,
} from '../api/personal';
import { AppActionSheet, ActionSheetRow } from '../components/AppActionSheet';
import { AppModalSheet } from '../components/AppModalSheet';
import { Card, CardTitle } from '../components/Card';
import { NotesPanel } from '../components/NotesPanel';
import { ActionPill, EmptyState, IconActionButton } from '../components/Paper';
import { Screen } from '../components/Screen';
import { useFeedback } from '../context/FeedbackContext';
import { useSession } from '../context/SessionContext';
import { useTabActivity } from '../context/TabActivityContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { useQuranReaderPreferences } from '../hooks/useQuranReaderPreferences';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import { colors } from '../theme';
import { playAudioUrl, stopAudio } from '../utils/audioPlayer';
import {
    MEMORIZATION_MODES,
    DISPLAY_MODES,
    ARABIC_FONTS,
    QURAN_TABS,
    QARI_PRESETS,
    AUDIO_SPEED_OPTIONS,
    SWIPE_TRIGGER_DISTANCE,
    SWIPE_EDGE_GUARD,
    SURAH_PREFIX_PATTERN,
    SURAH_PAGE_SIZE,
    SURAH_TARGET_PREFETCH_RADIUS,
    SURAH_PREFETCH_DISTANCE,
    MUSHAF_FIRST_PAGE,
    MUSHAF_LAST_PAGE,
    MIN_ARABIC_FONT_SIZE,
    MAX_ARABIC_FONT_SIZE,
    BISMILLAH,
    ARABIC_DIGITS,
    TAJWEED_TEXT_COLORS,
    toArabicDigits,
    formatInlineAyahMarker,
    decodeArabicHtml,
    stripHtmlTags,
    stripArabicDiacritics,
    parseTajweedHtml,
    getTajweedTextColor,
    clampAudioSpeed,
    toPositiveInt,
    normalizeAudioSources,
    getAyahIdentity,
    clampMushafPage,
    mergeUniqueAyahs,
    getFirstPageNumber,
    getSurahPageForAyah,
    getInitialSurahPages,
    getMushafTranslationLength,
    getMushafArabicTokens,
    getMushafTokenLength,
    getMushafFragmentLength,
    splitMushafAyahFragments,
    buildMushafLineGroups,
    getCompactArabicSurahName,
    TAJWEED_GROUPS,
} from './QuranScreen.helpers';
import { styles } from './QuranScreen.styles';
import { WEB_APP_QURAN_THEMES, createQuranWebAppThemeStyles } from './QuranScreen.webAppTheme';
import { createQuranScreenRenderers } from './quran/QuranScreenRenderers';

export function QuranScreen({ deepLinkTarget, isActive, navigation }) {
    const { width: viewportWidth } = useWindowDimensions();
    const { user } = useSession();
    const { showError, showInfo, showSuccess } = useFeedback();
    const { notifyTabActivity } = useTabActivity();
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const webAppQuranTheme = isDarkTheme ? WEB_APP_QURAN_THEMES.dark : WEB_APP_QURAN_THEMES.light;
    const webAppQuranThemeStyles = useMemo(
        () => createQuranWebAppThemeStyles(webAppQuranTheme),
        [webAppQuranTheme],
    );
    const handledDeepLinkId = useRef(null);
    const readerListRef = useRef(null);
    const targetScrollKeyRef = useRef(null);
    const mushafPageRequestRef = useRef(0);
    const swipeInFlightRef = useRef(false);
    const swipeTouchRef = useRef(null);
    const surahPaginationRef = useRef({ hasMore: false, loading: false, page: 0, surahNumber: null });
    const audioRangeSessionRef = useRef(0);
    const audioQueueRef = useRef([]);
    const audioQueueIndexRef = useRef(0);
    const audioSourcesRef = useRef({});
    const audioQariRef = useRef('mishary-rashid-alafasy');
    const audioRangeRepeatRef = useRef(false);
    const audioRangeSpeedRef = useRef(1);
    const [surahs, setSurahs] = useState([]);
    const [selectedSurah, setSelectedSurah] = useState(null);
    const [ayahs, setAyahs] = useState([]);
    const [targetAyah, setTargetAyah] = useState(null);
    const [bookmarks, setBookmarks] = useState({});
    const [loading, setLoading] = useState(true);
    const [readerLoading, setReaderLoading] = useState(false);
    const [readerLoadingMore, setReaderLoadingMore] = useState(false);
    const [mushafPageNumber, setMushafPageNumber] = useState(MUSHAF_FIRST_PAGE);
    const [mushafPageAyahs, setMushafPageAyahs] = useState([]);
    const [mushafPageLoading, setMushafPageLoading] = useState(false);
    // mushafWordsByAyah: { [`${surahNumber}:${ayahNumber}`]: [{wordIndex, arabic, transliteration, indonesian}] }
    const [mushafWordsByAyah, setMushafWordsByAyah] = useState({});
    const [progress, setProgress] = useState(null);
    const [savingSurah, setSavingSurah] = useState(null);
    const [savingAyah, setSavingAyah] = useState(null);
    const [activeNoteAyah, setActiveNoteAyah] = useState(null);
    const [referenceState, setReferenceState] = useState({});
    const [message, setMessage] = useState('');
    const [navigatorMode, setNavigatorMode] = useState('page');
    const [pageInput, setPageInput] = useState('1');
    const [hizbInput, setHizbInput] = useState('1');
    const [quranTab, setQuranTab] = useState('surah');
    const [surahQuery, setSurahQuery] = useState('');
    const [revealedAyahs, setRevealedAyahs] = useState({});
    const [audioState, setAudioState] = useState({
        activeAyahId: null,
        loadingAyahId: null,
        playingAyahId: null,
        qariSlug: 'mishary-rashid-alafasy',
        sourcesByAyah: {},
    });
    const [audioRange, setAudioRange] = useState({
        currentLabel: '',
        endAyah: '',
        endSurah: '',
        loading: false,
        playing: false,
        repeat: false,
        speed: 1,
        startSurah: '',
    });
    const [audioQueueInfo, setAudioQueueInfo] = useState({ index: 0, length: 0 });
    const [audioRangeCollapsed, setAudioRangeCollapsed] = useState(false);
    const [hafalanList, setHafalanList] = useState([]);
    const [hafalanSummary, setHafalanSummary] = useState(null);
    const [hafalanLoading, setHafalanLoading] = useState(false);
    const [murojaahSessions, setMurojaahSessions] = useState([]);
    const [murojaahLoading, setMurojaahLoading] = useState(false);
    const [murojaahForm, setMurojaahForm] = useState({ surahId: null, score: 100, note: '' });
    const [murojaahMessage, setMurojaahMessage] = useState('');
    const [savingMurojaah, setSavingMurojaah] = useState(false);

    // Modal state
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [tajweedVisible, setTajweedVisible] = useState(false);
    const [referenceModal, setReferenceModal] = useState({ visible: false, type: null, ayah: null });
    const [tafsirMode, setTafsirMode] = useState('all');
    const [munasabahModal, setMunasabahModal] = useState({ visible: false, ayah: null, items: [], loading: false, error: '' });
    const [hadithAyahModal, setHadithAyahModal] = useState({ visible: false, ayah: null, items: [], loading: false, error: '' });
    const [ayahActionSheet, setAyahActionSheet] = useState({ visible: false, ayah: null });
    const [selectedDetailAyah, setSelectedDetailAyah] = useState(null);
    const [readerMenuVisible, setReaderMenuVisible] = useState(false);

    const handleScrollActivity = useCallback(() => {
        notifyTabActivity();
    }, [notifyTabActivity]);

    const resetRevealedAyahs = useCallback(() => {
        setRevealedAyahs({});
    }, []);

    const {
        arabicFont,
        displayMode,
        fontSize,
        memorizationMode,
        translationFontSize,
        updateArabicFont,
        updateDisplayMode,
        updateFontSize,
        updateMemorizationMode,
        updateTranslationFontSize,
    } = useQuranReaderPreferences({ onMemorizationModeChange: resetRevealedAyahs });

    useEffect(() => {
        audioSourcesRef.current = audioState.sourcesByAyah;
    }, [audioState.sourcesByAyah]);

    useEffect(() => {
        audioQariRef.current = audioState.qariSlug;
    }, [audioState.qariSlug]);

    useEffect(() => {
        audioRangeRepeatRef.current = audioRange.repeat;
    }, [audioRange.repeat]);

    useEffect(() => {
        audioRangeSpeedRef.current = audioRange.speed;
    }, [audioRange.speed]);

    const audioQariOptions = useMemo(() => {
        const bySlug = new Map(QARI_PRESETS.map((item) => [item.qari_slug, item]));
        Object.values(audioState.sourcesByAyah).forEach((sources) => {
            if (!Array.isArray(sources)) return;
            sources.forEach((source) => {
                if (source?.qari_slug && !bySlug.has(source.qari_slug)) {
                    bySlug.set(source.qari_slug, {
                        qari_name: source.qari_name || source.qari_slug,
                        qari_slug: source.qari_slug,
                    });
                }
            });
        });
        return Array.from(bySlug.values());
    }, [audioState.sourcesByAyah]);

    const openReferenceModal = async (ayah, type) => {
        setReferenceModal({ visible: true, type, ayah });
        if (type !== 'tafsir') setTafsirMode('all');
        const key = `${type}:${ayah.id}`;
        if (referenceState[key]?.items || referenceState[key]?.loading) return;

        setReferenceState((current) => ({
            ...current,
            [key]: { items: [], loading: true, error: '' },
        }));

        try {
            const items =
                type === 'tafsir' ? await getTafsirForAyah(ayah.id) : await getAsbabForAyah(ayah.id);
            setReferenceState((current) => ({
                ...current,
                [key]: {
                    items,
                    loading: false,
                    error: items.length
                        ? ''
                        : `${type === 'tafsir' ? 'Tafsir' : 'Asbabun Nuzul'} belum tersedia.`,
                },
            }));
        } catch (err) {
            setReferenceState((current) => ({
                ...current,
                [key]: { items: [], loading: false, error: err?.message ?? 'Rujukan belum bisa dimuat.' },
            }));
        }
    };

    const openMunasabahModal = async (ayah) => {
        setMunasabahModal({ visible: true, ayah, items: [], loading: true, error: '' });
        try {
            const items = await getMunasabahForAyah(ayah.id);
            setMunasabahModal((current) => ({
                ...current,
                items,
                loading: false,
                error: items.length ? '' : 'Tidak ada ayat terkait untuk ayat ini.',
            }));
        } catch (err) {
            setMunasabahModal((current) => ({
                ...current,
                loading: false,
                error: err?.message ?? 'Data munasabah belum bisa dimuat.',
            }));
        }
    };

    const openHadithAyahModal = async (ayah) => {
        setHadithAyahModal({ visible: true, ayah, items: [], loading: true, error: '' });
        try {
            const items = await getHadithsForAyah(ayah.id);
            setHadithAyahModal((current) => ({
                ...current,
                items,
                loading: false,
                error: items.length ? '' : 'Belum ada hadis terkait untuk ayat ini.',
            }));
        } catch (err) {
            setHadithAyahModal((current) => ({
                ...current,
                loading: false,
                error: err?.message ?? 'Data hadis terkait belum bisa dimuat.',
            }));
        }
    };

    const openRelatedAyah = (item) => {
        const target = item?.ayahTo ?? item?.ayahFrom;
        if (!target?.id && !target?.number) return;

        setMunasabahModal((current) => ({ ...current, visible: false }));
        if (navigation?.closeAndOpen) {
            navigation.closeAndOpen('quran', 'quran', {
                ayahId: target.id,
                ayahNumber: target.number,
                surahNumber: target.surahNumber,
            });
            return;
        }

        if (
            Number(target.surahNumber) === Number(selectedSurah?.number) ||
            !target.surahNumber
        ) {
            openAyahDetail(target);
        }
    };

    const openRelatedHadith = (item) => {
        const hadith = item?.hadith;
        if (!hadith?.id) return;

        setHadithAyahModal((current) => ({ ...current, visible: false }));
        navigation?.closeAndOpen?.('quran', 'hadith', {
            hadithId: hadith.id,
        });
    };

    const load = useCallback(async () => {
        setLoading(true);
        const items = await getSurahs();
        setSurahs(items);
        setLoading(false);
    }, []);

    const loadProgress = useCallback(async () => {
        if (!user) {
            setProgress(null);
            return;
        }
        try {
            setProgress(await getQuranProgress());
        } catch {
            setProgress(null);
        }
    }, [user]);

    const loadBookmarks = useCallback(async () => {
        if (!user) {
            setBookmarks({});
            return;
        }
        try {
            const items = await getBookmarks();
            const mapped = items.reduce((acc, item) => {
                if (item.ref_type === 'ayah') acc[item.ref_id] = item;
                return acc;
            }, {});
            setBookmarks(mapped);
        } catch {
            setBookmarks({});
        }
    }, [user]);

    const loadHafalan = useCallback(async () => {
        if (!user) {
            setHafalanList([]);
            setHafalanSummary(null);
            return;
        }
        setHafalanLoading(true);
        try {
            const [list, summary] = await Promise.allSettled([getHafalanList(), getHafalanSummary()]);
            setHafalanList(list.status === 'fulfilled' ? list.value : []);
            setHafalanSummary(summary.status === 'fulfilled' ? summary.value : null);
        } catch {
            setHafalanList([]);
        } finally {
            setHafalanLoading(false);
        }
    }, [user]);

    const loadMurojaah = useCallback(async () => {
        if (!user) {
            setMurojaahSessions([]);
            return;
        }
        setMurojaahLoading(true);
        setMurojaahMessage('');
        try {
            setMurojaahSessions(await getMurojaahSession());
        } catch {
            setMurojaahSessions([]);
        } finally {
            setMurojaahLoading(false);
        }
    }, [user]);

    const cycleHafalanStatus = useCallback(
        async (surah) => {
            const cycle = {
                not_started: 'in_progress',
                in_progress: 'memorized',
                memorized: 'not_started',
            };
            const current = hafalanList.find((item) => Number(item.surah_id) === Number(surah.number));
            const currentStatus = current?.status ?? 'not_started';
            const nextStatus = cycle[currentStatus] ?? 'in_progress';

            setHafalanList((prev) => {
                const exists = prev.some((item) => Number(item.surah_id) === Number(surah.number));
                if (exists) {
                    return prev.map((item) =>
                        Number(item.surah_id) === Number(surah.number)
                            ? { ...item, status: nextStatus }
                            : item,
                    );
                }
                return [...prev, { surah_id: surah.number, status: nextStatus }];
            });

            try {
                await updateHafalanStatus(surah.number, nextStatus);
                await loadHafalan();
                showSuccess(`${surah.name} ditandai ${nextStatus === 'memorized' ? 'hafal' : nextStatus === 'in_progress' ? 'sedang dihafal' : 'belum dihafal'}.`);
            } catch {
                setHafalanList((prev) =>
                    prev.map((item) =>
                        Number(item.surah_id) === Number(surah.number)
                            ? { ...item, status: currentStatus }
                            : item,
                    ),
                );
                showError('Status hafalan belum bisa disimpan.');
            }
        },
        [hafalanList, loadHafalan, showError, showSuccess],
    );

    const submitMurojaah = useCallback(async () => {
        if (!murojaahForm.surahId) {
            setMurojaahMessage('Pilih surah terlebih dahulu.');
            showInfo('Pilih surah terlebih dahulu.');
            return;
        }
        setSavingMurojaah(true);
        setMurojaahMessage('');
        try {
            await saveMurojaahResult({
                surahId: murojaahForm.surahId,
                fromAyah: 1,
                toAyah: 999,
                score: murojaahForm.score,
                durationSeconds: 0,
                note: murojaahForm.note,
            });
            setMurojaahMessage('Sesi murojaah berhasil disimpan.');
            showSuccess('Sesi murojaah berhasil disimpan.');
            setMurojaahForm((prev) => ({ ...prev, surahId: null, note: '' }));
            await loadMurojaah();
        } catch (err) {
            const nextMessage = err?.message ?? 'Murojaah belum bisa disimpan.';
            setMurojaahMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setSavingMurojaah(false);
        }
    }, [loadMurojaah, murojaahForm, showError, showInfo, showSuccess]);

    const refreshAll = useCallback(async () => {
        await load();
        await loadProgress();
        await loadBookmarks();
    }, [load, loadBookmarks, loadProgress]);

    const resetReaderState = () => {
        stopAudio();
        targetScrollKeyRef.current = null;
        surahPaginationRef.current = {
            hasMore: false,
            keys: new Set(),
            loadedCount: 0,
            loading: false,
            page: 0,
            surahNumber: null,
        };
        setReaderLoadingMore(false);
        setMushafPageLoading(false);
        setMushafPageAyahs([]);
        setMushafWordsByAyah({});
        setAudioState((current) => ({
            ...current,
            activeAyahId: null,
            loadingAyahId: null,
            playingAyahId: null,
        }));
        setActiveNoteAyah(null);
        setReferenceModal({ visible: false, type: null, ayah: null });
        setAyahActionSheet({ visible: false, ayah: null });
        setReaderMenuVisible(false);
        setRevealedAyahs({});
        setTargetAyah(null);
        setMessage('');
    };

    const appendAyahs = (incoming, expectedTotal = null) => {
        const pagination = surahPaginationRef.current;
        const keys = pagination.keys ?? new Set();
        const nextItems = incoming.filter((ayah) => {
            const key = getAyahIdentity(ayah);
            if (keys.has(key)) return false;
            keys.add(key);
            return true;
        });

        pagination.keys = keys;
        pagination.loadedCount = keys.size;
        if (expectedTotal && keys.size >= expectedTotal) {
            pagination.hasMore = false;
        }

        if (!nextItems.length) return;
        setAyahs((current) => {
            const currentKeys = new Set(current.map(getAyahIdentity));
            const cleanItems = nextItems.filter((ayah) => !currentKeys.has(getAyahIdentity(ayah)));
            return cleanItems.length ? [...current, ...cleanItems] : current;
        });
    };

    const loadSurahPage = async (surahNumber, page = 0) => {
        const result = await getAyahsForSurahPage(surahNumber, { page, size: SURAH_PAGE_SIZE });
        const current = surahPaginationRef.current;
        surahPaginationRef.current = {
            hasMore: result.hasMore,
            keys: current.keys ?? new Set(),
            loadedCount: current.loadedCount ?? 0,
            loading: false,
            page: result.page,
            surahNumber,
        };
        return result;
    };

    const loadMushafPage = async (page, options = {}) => {
        const nextPage = clampMushafPage(page);
        const requestId = mushafPageRequestRef.current + 1;
        mushafPageRequestRef.current = requestId;
        setMushafPageNumber(nextPage);
        setPageInput(`${nextPage}`);
        if (options.items) {
            setMushafPageAyahs(options.items);
        } else {
            setMushafPageAyahs([]);
        }
        setMushafPageLoading(true);
        try {
            const [items, mufrodatItems] = await Promise.all([
                getAyahsForPage(nextPage),
                getMufrodatByPage(nextPage).catch(() => []),
            ]);
            if (mushafPageRequestRef.current !== requestId) return items;
            setMushafPageAyahs(items);
            const wordMap = {};
            mufrodatItems.forEach((word) => {
                const key = `${word.surahNumber ?? ''}:${word.ayahNumber ?? ''}`;
                if (!wordMap[key]) wordMap[key] = [];
                wordMap[key].push(word);
            });
            Object.values(wordMap).forEach((list) =>
                list.sort((a, b) => (a.wordIndex ?? 0) - (b.wordIndex ?? 0)),
            );
            setMushafWordsByAyah(wordMap);
            return items;
        } catch (err) {
            if (mushafPageRequestRef.current === requestId) {
                setMessage(err?.message ?? 'Halaman mushaf belum bisa dimuat.');
            }
            return [];
        } finally {
            if (mushafPageRequestRef.current === requestId) {
                setMushafPageLoading(false);
            }
        }
    };

    const openSurah = async (surah, options = {}) => {
        resetReaderState();
        setSelectedSurah({ ...surah, key: `surah:${surah.number}`, type: 'surah' });
        const nextTargetAyah = options.ayahNumber || options.ayahId
            ? {
                id: options.ayahId ?? null,
                number: options.ayahNumber ?? null,
              }
            : null;
        setTargetAyah(nextTargetAyah);
        setReaderLoading(true);
        try {
            const resolvedTargetAyah = nextTargetAyah?.id && !nextTargetAyah.number
                ? await getAyahById(nextTargetAyah.id).catch(() => nextTargetAyah)
                : nextTargetAyah;
            const normalizedTargetAyah = resolvedTargetAyah
                ? {
                    id: resolvedTargetAyah.id ?? nextTargetAyah.id ?? null,
                    number: resolvedTargetAyah.number ?? nextTargetAyah.number ?? null,
                  }
                : null;
            if (normalizedTargetAyah) {
                setTargetAyah(normalizedTargetAyah);
            }
            const targetPage = normalizedTargetAyah?.number
                ? getSurahPageForAyah(normalizedTargetAyah.number)
                : 0;
            const pagesToLoad = getInitialSurahPages(targetPage, surah.ayahs);
            const pages = await Promise.all(
                pagesToLoad.map((page) =>
                    getAyahsForSurahPage(surah.number, { page, size: SURAH_PAGE_SIZE }),
                ),
            );
            const result = pages[pages.length - 1] ?? { hasMore: false, page: 0 };
            const initialAyahs = mergeUniqueAyahs(pages);
            const expectedTotal = Number(surah.ayahs);
            const loadedKeys = new Set(initialAyahs.map(getAyahIdentity));
            surahPaginationRef.current = {
                hasMore: result.hasMore && (!expectedTotal || loadedKeys.size < expectedTotal),
                keys: loadedKeys,
                loadedCount: loadedKeys.size,
                loading: false,
                page: result.page,
                surahNumber: surah.number,
            };
            setAyahs(initialAyahs);
            const targetAyahInLoaded = normalizedTargetAyah
                ? initialAyahs.find((ayah) =>
                    (normalizedTargetAyah.id && Number(normalizedTargetAyah.id) === Number(ayah.id)) ||
                    (normalizedTargetAyah.number && Number(normalizedTargetAyah.number) === Number(ayah.number)),
                  )
                : null;
            const initialPage = targetAyahInLoaded?.pageNumber
                ? Number(targetAyahInLoaded.pageNumber)
                : getFirstPageNumber(initialAyahs, surah.page ?? MUSHAF_FIRST_PAGE);
            const pagePreviewAyahs = initialAyahs.filter(
                (ayah) => Number(ayah.pageNumber) === Number(initialPage),
            );
            setMushafPageNumber(initialPage);
            setMushafPageAyahs(pagePreviewAyahs);
            if (displayMode === 'mushaf') {
                await loadMushafPage(initialPage, { items: pagePreviewAyahs });
            }
            await loadBookmarks();
            if (normalizedTargetAyah?.number) {
                setMessage(`Dibuka dari pencarian ke ayat ${normalizedTargetAyah.number}.`);
            }
        } catch (err) {
            setAyahs([]);
            setMessage(err?.message ?? 'Ayat belum bisa dimuat.');
        } finally {
            setReaderLoading(false);
        }
    };

    const loadMoreSurahAyahs = useCallback(async () => {
        const current = surahPaginationRef.current;
        if (
            !selectedSurah ||
            selectedSurah.type !== 'surah' ||
            Number(current.surahNumber) !== Number(selectedSurah.number) ||
            readerLoading ||
            current.loading ||
            !current.hasMore
        ) {
            return;
        }

        const surahNumber = selectedSurah.number;
        current.loading = true;
        setReaderLoadingMore(true);
        try {
            const result = await loadSurahPage(surahNumber, current.page + 1);
            appendAyahs(result.items, Number(selectedSurah.ayahs));
        } catch (err) {
            surahPaginationRef.current = { ...current, loading: false };
            setMessage(err?.message ?? 'Ayat berikutnya belum bisa dimuat.');
        } finally {
            setReaderLoadingMore(false);
        }
    }, [readerLoading, selectedSurah]);

    const handleReaderScroll = useCallback(
        (event) => {
            handleScrollActivity();
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const distanceFromEnd = contentSize.height - (contentOffset.y + layoutMeasurement.height);
            if (distanceFromEnd <= SURAH_PREFETCH_DISTANCE) {
                loadMoreSurahAyahs();
            }
        },
        [handleScrollActivity, loadMoreSurahAyahs],
    );

    const normalizeRangeInput = (value, min, max) => {
        const numeric = Number.parseInt(`${value}`, 10);
        if (!Number.isFinite(numeric)) return min;
        return Math.max(min, Math.min(max, numeric));
    };

    const openPage = async (value = pageInput) => {
        const page = normalizeRangeInput(value, 1, 604);
        setPageInput(`${page}`);
        resetReaderState();
        setSelectedSurah({
            ayahs: 'Halaman mushaf',
            key: `page:${page}`,
            meaning: 'Navigasi halaman mushaf',
            name: `Halaman ${page}`,
            page,
            type: 'page',
        });
        setReaderLoading(true);
        try {
            const items = await getAyahsForPage(page);
            setAyahs(items);
            setMushafPageNumber(page);
            setMushafPageAyahs(items);
            await loadBookmarks();
        } catch (err) {
            setAyahs([]);
            setMushafPageAyahs([]);
            setMessage(err?.message ?? 'Halaman mushaf belum bisa dimuat.');
        } finally {
            setReaderLoading(false);
        }
    };

    const openHizb = async (value = hizbInput) => {
        const hizb = normalizeRangeInput(value, 1, 240);
        setHizbInput(`${hizb}`);
        resetReaderState();
        setSelectedSurah({
            ayahs: 'Hizb',
            hizb,
            key: `hizb:${hizb}`,
            meaning: 'Navigasi hizb',
            name: `Hizb ${hizb}`,
            type: 'hizb',
        });
        setReaderLoading(true);
        try {
            const items = await getAyahsForHizb(hizb);
            setAyahs(items);
            const initialPage = getFirstPageNumber(items);
            setMushafPageNumber(initialPage);
            setMushafPageAyahs(items.filter((ayah) => Number(ayah.pageNumber) === Number(initialPage)));
            if (displayMode === 'mushaf') {
                await loadMushafPage(initialPage);
            }
            await loadBookmarks();
        } catch (err) {
            setAyahs([]);
            setMushafPageAyahs([]);
            setMessage(err?.message ?? 'Hizb belum bisa dimuat.');
        } finally {
            setReaderLoading(false);
        }
    };

    const refreshReader = () => {
        if (!selectedSurah) return refreshAll();
        if (selectedSurah.type === 'page') return openPage(selectedSurah.page);
        if (selectedSurah.type === 'hizb') return openHizb(selectedSurah.hizb);
        return openSurah(selectedSurah);
    };

    const closeReader = () => {
        stopAudio();
        setReaderMenuVisible(false);
        setSelectedDetailAyah(null);
        setSelectedSurah(null);
    };

    const navigateAdjacentSurah = useCallback(
        (delta) => {
            if (!selectedSurah || selectedSurah.type !== 'surah' || readerLoading) return;
            const currentIndex = surahs.findIndex(
                (item) => Number(item.number) === Number(selectedSurah.number),
            );
            if (currentIndex < 0) return;

            const nextSurah = surahs[currentIndex + delta];
            if (!nextSurah) {
                showInfo(delta > 0 ? 'Sudah di surah terakhir.' : 'Sudah di surah pertama.');
                return;
            }

            openSurah(nextSurah);
        },
        [openSurah, readerLoading, selectedSurah, showInfo, surahs],
    );

    const triggerAdjacentSurah = useCallback(
        (delta) => {
            if (swipeInFlightRef.current) return;
            swipeInFlightRef.current = true;
            navigateAdjacentSurah(delta);
            setTimeout(() => {
                swipeInFlightRef.current = false;
            }, 220);
        },
        [navigateAdjacentSurah],
    );

    const navigateAdjacentMushafPage = useCallback(
        (delta) => {
            if (!selectedSurah || readerLoading || mushafPageLoading) return;
            const currentPage = clampMushafPage(mushafPageNumber);
            const nextPage = currentPage + delta;

            if (nextPage < MUSHAF_FIRST_PAGE || nextPage > MUSHAF_LAST_PAGE) {
                showInfo(delta > 0 ? 'Sudah di halaman terakhir.' : 'Sudah di halaman pertama.');
                return;
            }

            loadMushafPage(nextPage);
        },
        [mushafPageLoading, mushafPageNumber, readerLoading, selectedSurah, showInfo],
    );

    const triggerAdjacentMushafPage = useCallback(
        (delta) => {
            if (swipeInFlightRef.current) return;
            swipeInFlightRef.current = true;
            navigateAdjacentMushafPage(delta);
            setTimeout(() => {
                swipeInFlightRef.current = false;
            }, 220);
        },
        [navigateAdjacentMushafPage],
    );

    const beginReaderTouch = useCallback(
        (event) => {
            const touch = event.nativeEvent;
            swipeTouchRef.current = {
                lastX: touch.pageX,
                lastY: touch.pageY,
                startX: touch.pageX,
                startY: touch.pageY,
                startedNearEdge:
                    touch.pageX <= SWIPE_EDGE_GUARD ||
                    touch.pageX >= viewportWidth - SWIPE_EDGE_GUARD,
            };
        },
        [viewportWidth],
    );

    const moveReaderTouch = useCallback((event) => {
        if (!swipeTouchRef.current) return;
        const touch = event.nativeEvent;
        swipeTouchRef.current.lastX = touch.pageX;
        swipeTouchRef.current.lastY = touch.pageY;
    }, []);

    const endReaderTouch = useCallback(() => {
        const touch = swipeTouchRef.current;
        swipeTouchRef.current = null;
        const canSwipe =
            selectedSurah &&
            !readerLoading &&
            (displayMode === 'mushaf' || selectedSurah.type === 'surah');
        if (!touch || !canSwipe || swipeInFlightRef.current) return;

        const dx = touch.lastX - touch.startX;
        const dy = touch.lastY - touch.startY;
        const horizontal = Math.abs(dx);
        const vertical = Math.abs(dy);
        const hasDistance = horizontal >= SWIPE_TRIGGER_DISTANCE && horizontal > vertical * 0.82;
        if (!hasDistance) return;
        if (touch.startedNearEdge && horizontal < 64) return;

        const delta = dx < 0 ? 1 : -1;
        if (displayMode === 'mushaf') {
            triggerAdjacentMushafPage(delta);
            return;
        }
        triggerAdjacentSurah(delta);
    }, [
        displayMode,
        readerLoading,
        selectedSurah,
        triggerAdjacentMushafPage,
        triggerAdjacentSurah,
    ]);

    const markStarted = async (surah) => {
        if (!user) {
            showInfo("Masuk dari Profil untuk menyimpan progres Al-Qur'an.");
            return;
        }
        setSavingSurah(surah.number);
        setMessage('');
        try {
            const firstAyah = await getFirstAyahForSurah(surah.number);
            const next = await saveQuranProgress({
                surahNumber: surah.number,
                ayahNumber: firstAyah?.number ?? 1,
                ayahId: firstAyah?.id ?? surah.number,
            });
            setProgress(next);
            setMessage(`Progres disimpan untuk ${surah.name}.`);
            showSuccess(`Progres disimpan untuk ${surah.name}.`);
        } catch (err) {
            const nextMessage = err?.message ?? "Progres Al-Qur'an belum bisa disimpan.";
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setSavingSurah(null);
        }
    };

    const markAyahProgress = async (ayah) => {
        if (!user || !selectedSurah) {
            showInfo("Masuk dari Profil untuk menyimpan progres Al-Qur'an.");
            return;
        }
        const surahNumber = selectedSurah.number ?? ayah.surahNumber;
        if (!surahNumber) {
            setMessage("Buka bacaan surah untuk menyimpan progres Al-Qur'an.");
            showInfo("Buka bacaan surah untuk menyimpan progres Al-Qur'an.");
            return;
        }
        setSavingAyah(`progress:${ayah.id}`);
        setMessage('');
        try {
            const next = await saveQuranProgress({
                surahNumber,
                ayahNumber: ayah.number,
                ayahId: ayah.id,
            });
            setProgress(next);
            setMessage(`Progres disimpan di ayat ${ayah.number}.`);
            showSuccess(`Progres disimpan di ayat ${ayah.number}.`);
        } catch (err) {
            const nextMessage = err?.message ?? 'Progres ayat belum bisa disimpan.';
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setSavingAyah(null);
        }
    };

    const toggleAyahBookmark = async (ayah) => {
        if (!user || !ayah.id) {
            showInfo('Masuk dari Profil untuk menyimpan bookmark.');
            return;
        }
        setSavingAyah(`bookmark:${ayah.id}`);
        setMessage('');
        try {
            const existing = bookmarks[ayah.id];
            if (existing?.id) {
                await deleteBookmark(existing.id);
                const next = { ...bookmarks };
                delete next[ayah.id];
                setBookmarks(next);
                setMessage(`Bookmark ayat ${ayah.number} dihapus.`);
                showSuccess(`Bookmark ayat ${ayah.number} dihapus.`);
            } else {
                const bookmark = await addBookmark({ refType: 'ayah', refId: ayah.id });
                setBookmarks({ ...bookmarks, [ayah.id]: bookmark });
                setMessage(`Ayat ${ayah.number} disimpan ke bookmark.`);
                showSuccess(`Ayat ${ayah.number} disimpan ke bookmark.`);
            }
        } catch (err) {
            const nextMessage = err?.message ?? 'Bookmark ayat belum bisa diperbarui.';
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setSavingAyah(null);
        }
    };

    const pickAudioSource = (sources, qariSlug = audioState.qariSlug) => {
        const normalizedSources = normalizeAudioSources(sources);
        return (
            normalizedSources.find((source) => source.qari_slug === qariSlug) ??
            normalizedSources[0] ??
            null
        );
    };

    const getSourcesForAyah = async (ayah) => {
        const cached = audioSourcesRef.current[ayah.id];
        if (cached) return cached;
        const sources = normalizeAudioSources(
            await getAyahAudio({
                ayahId: ayah.id,
                ayahNumber: ayah.number,
                surahNumber: ayah.surahNumber ?? selectedSurah?.number,
            }),
        );
        audioSourcesRef.current = { ...audioSourcesRef.current, [ayah.id]: sources };
        setAudioState((current) => ({
            ...current,
            sourcesByAyah: { ...current.sourcesByAyah, [ayah.id]: sources },
        }));
        return sources;
    };

    const stopRangeAudio = () => {
        audioRangeSessionRef.current += 1;
        audioQueueRef.current = [];
        audioQueueIndexRef.current = 0;
        setAudioQueueInfo({ index: 0, length: 0 });
        setAudioRangeCollapsed(false);
        stopAudio();
        setAudioRange((current) => ({
            ...current,
            currentLabel: '',
            loading: false,
            playing: false,
        }));
        setAudioState((current) => ({ ...current, loadingAyahId: null, playingAyahId: null }));
    };

    const playRangeQueueItem = async (index, sessionId) => {
        if (sessionId !== audioRangeSessionRef.current) return;
        const queue = audioQueueRef.current;
        const nextIndex =
            index >= queue.length && audioRangeRepeatRef.current && queue.length ? 0 : index;
        const ayah = queue[nextIndex];

        if (!ayah) {
            setAudioRange((current) => ({
                ...current,
                currentLabel: '',
                loading: false,
                playing: false,
            }));
            setAudioState((current) => ({ ...current, loadingAyahId: null, playingAyahId: null }));
            return;
        }

        audioQueueIndexRef.current = nextIndex;
        setAudioQueueInfo({ index: nextIndex, length: queue.length });
        setAudioRange((current) => ({
            ...current,
            currentLabel: `${ayah.surahName || `Surah ${ayah.surahNumber}`} · Ayat ${ayah.number}`,
            loading: true,
            playing: true,
        }));
        setAudioState((current) => ({
            ...current,
            activeAyahId: ayah.id,
            loadingAyahId: ayah.id,
        }));

        try {
            const sources = await getSourcesForAyah(ayah);
            const source = pickAudioSource(sources, audioQariRef.current);
            if (sessionId !== audioRangeSessionRef.current) return;
            if (!source?.audio_url) {
                await playRangeQueueItem(nextIndex + 1, sessionId);
                return;
            }
            await playAudioUrl(source.audio_url, {
                rate: audioRangeSpeedRef.current,
                onEnded: () => playRangeQueueItem(nextIndex + 1, sessionId),
            });
            setAudioState((current) => ({
                ...current,
                activeAyahId: ayah.id,
                loadingAyahId: null,
                playingAyahId: ayah.id,
            }));
            setAudioRange((current) => ({ ...current, loading: false, playing: true }));
        } catch (err) {
            if (sessionId !== audioRangeSessionRef.current) return;
            setMessage(err?.message ?? 'Range audio belum bisa diputar.');
            setAudioRange((current) => ({ ...current, loading: false, playing: false }));
            setAudioState((current) => ({
                ...current,
                loadingAyahId: null,
                playingAyahId: null,
            }));
        }
    };

    const fetchAudioRangeQueue = async ({ endAyah, endSurah, startSurah }) => {
        const queue = [];
        for (let surahNumber = startSurah; surahNumber <= endSurah; surahNumber += 1) {
            const surah = surahs.find((item) => Number(item.number) === surahNumber);
            const lastAyah =
                surahNumber === endSurah ? endAyah : Number(surah?.ayahs) || SURAH_PAGE_SIZE;
            const maxPage = Math.max(0, Math.ceil(lastAyah / SURAH_PAGE_SIZE) - 1);
            for (let page = 0; page <= maxPage; page += 1) {
                const result = await getAyahsForSurahPage(surahNumber, {
                    page,
                    size: SURAH_PAGE_SIZE,
                });
                const items = (result?.items ?? [])
                    .filter((item) => Number(item.number) <= lastAyah)
                    .map((item) => ({
                        ...item,
                        surahName: item.surahName || surah?.name,
                        surahNumber,
                    }));
                queue.push(...items);
                if (!result?.hasMore) break;
            }
        }
        return queue;
    };

    const startRangeAudio = async () => {
        if (!selectedSurah || selectedSurah.type !== 'surah') return;
        const currentSurahNumber = Number(selectedSurah.number) || 1;
        const startSurah = toPositiveInt(audioRange.startSurah) ?? currentSurahNumber;
        const endSurah = toPositiveInt(audioRange.endSurah) ?? startSurah;
        const endSurahMeta = surahs.find((item) => Number(item.number) === endSurah);
        const maxEndAyah = Number(endSurahMeta?.ayahs) || Number(selectedSurah.ayahs) || 1;
        const endAyah = Math.min(toPositiveInt(audioRange.endAyah) ?? maxEndAyah, maxEndAyah);

        if (startSurah > endSurah) {
            setMessage('Range audio belum valid: surat awal tidak boleh melewati surat akhir.');
            return;
        }
        if (!surahs.some((item) => Number(item.number) === startSurah) || !endSurahMeta) {
            setMessage('Range audio belum valid: nomor surat tidak ditemukan.');
            return;
        }

        setMessage('');
        setAudioRange((current) => ({
            ...current,
            endAyah: `${endAyah}`,
            endSurah: `${endSurah}`,
            loading: true,
            playing: false,
            startSurah: `${startSurah}`,
        }));
        await writePreference(preferenceKeys.quranAudioRange, {
            endAyah: `${endAyah}`,
            endSurah: `${endSurah}`,
            startSurah: `${startSurah}`,
        });
        stopAudio();
        const sessionId = audioRangeSessionRef.current + 1;
        audioRangeSessionRef.current = sessionId;
        try {
            const queue = await fetchAudioRangeQueue({ endAyah, endSurah, startSurah });
            if (!queue.length) {
                setMessage('Ayat untuk range audio belum tersedia.');
                setAudioRange((current) => ({ ...current, loading: false, playing: false }));
                return;
            }
            audioQueueRef.current = queue;
            audioQueueIndexRef.current = 0;
            setAudioQueueInfo({ index: 0, length: queue.length });
            playRangeQueueItem(0, sessionId);
        } catch (err) {
            setAudioRange((current) => ({ ...current, loading: false, playing: false }));
            setMessage(err?.message ?? 'Range audio belum bisa dimuat.');
        }
    };

    const skipRangeAudio = async (delta) => {
        const queue = audioQueueRef.current;
        if (!queue.length || audioRange.loading) return;

        let nextIndex = audioQueueIndexRef.current + delta;
        if (nextIndex < 0) {
            nextIndex = audioRangeRepeatRef.current ? queue.length - 1 : 0;
        }
        if (nextIndex >= queue.length) {
            nextIndex = audioRangeRepeatRef.current ? 0 : queue.length - 1;
        }

        stopAudio();
        const sessionId = audioRangeSessionRef.current + 1;
        audioRangeSessionRef.current = sessionId;
        await playRangeQueueItem(nextIndex, sessionId);
    };

    const playAyahAudio = async (ayah) => {
        if (!selectedSurah) return;
        const surahNumber = selectedSurah.number ?? ayah.surahNumber;
        if (audioState.playingAyahId === ayah.id) {
            stopRangeAudio();
            return;
        }
        stopRangeAudio();
        setMessage('');
        setAudioState((current) => ({
            ...current,
            activeAyahId: ayah.id,
            loadingAyahId: ayah.id,
        }));
        try {
            const sources = await getSourcesForAyah({ ...ayah, surahNumber });
            const source = pickAudioSource(sources);
            setAudioState((current) => ({
                ...current,
                activeAyahId: ayah.id,
                loadingAyahId: null,
                sourcesByAyah: { ...current.sourcesByAyah, [ayah.id]: sources },
            }));
            if (!source?.audio_url) {
                setMessage(`Audio belum tersedia untuk ayat ${ayah.number}.`);
                return;
            }
            await playAudioUrl(source.audio_url, {
                rate: audioRange.speed,
                onEnded: () => setAudioState((current) => ({ ...current, playingAyahId: null })),
            });
            setAudioState((current) => ({
                ...current,
                activeAyahId: ayah.id,
                loadingAyahId: null,
                playingAyahId: ayah.id,
            }));
        } catch (err) {
            setAudioState((current) => ({
                ...current,
                loadingAyahId: null,
                playingAyahId: null,
            }));
            setMessage(err?.message ?? 'Audio ayat belum bisa diputar.');
        }
    };

    const updateAudioRangeField = (field, value) => {
        setAudioRange((current) => ({ ...current, [field]: value.replace(/[^\d]/g, '') }));
    };

    const selectAudioSpeed = async (speed) => {
        const nextSpeed = clampAudioSpeed(speed);
        audioRangeSpeedRef.current = nextSpeed;
        setAudioRange((current) => ({ ...current, speed: nextSpeed }));
        await writePreference(preferenceKeys.quranAudioSpeed, nextSpeed);
    };

    const toggleAudioRepeat = async () => {
        const nextRepeat = !audioRange.repeat;
        audioRangeRepeatRef.current = nextRepeat;
        setAudioRange((current) => ({ ...current, repeat: nextRepeat }));
        await writePreference(preferenceKeys.quranAudioRepeat, nextRepeat);
    };

    const selectQari = async (ayahId, qariSlug) => {
        stopRangeAudio();
        audioQariRef.current = qariSlug;
        setAudioState((current) => ({
            ...current,
            activeAyahId: ayahId ?? current.activeAyahId,
            playingAyahId: null,
            qariSlug,
        }));
        await writePreference(preferenceKeys.quranAudioQari, qariSlug);
    };

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    useEffect(() => {
        if (quranTab === 'hafalan') loadHafalan();
    }, [quranTab, loadHafalan]);

    useEffect(() => {
        if (quranTab === 'murojaah') loadMurojaah();
    }, [quranTab, loadMurojaah]);

    useEffect(() => {
        const target = deepLinkTarget?.params;
        if (!target || handledDeepLinkId.current === deepLinkTarget?.id) return;

        if (target.pageNumber) {
            handledDeepLinkId.current = deepLinkTarget.id;
            openPage(target.pageNumber);
            return;
        }
        if (target.hizbNumber) {
            handledDeepLinkId.current = deepLinkTarget.id;
            openHizb(target.hizbNumber);
            return;
        }
        if (!surahs.length) return;

        const nextSurah = surahs.find((item) => {
            const slugMatch =
                target.surahSlug &&
                `${item.name}`.toLowerCase() === `${target.surahSlug}`.toLowerCase();
            const numberMatch =
                target.surahNumber && Number(item.number) === Number(target.surahNumber);
            return slugMatch || numberMatch;
        });

        if (nextSurah) {
            handledDeepLinkId.current = deepLinkTarget.id;
            openSurah(nextSurah, {
                ayahId: target.ayahId,
                ayahNumber: target.ayahNumber,
            });
        }
    }, [deepLinkTarget?.id, surahs]);

    useEffect(() => {
        if (!selectedSurah || displayMode !== 'mushaf') return;
        if (selectedSurah.type !== 'page' && !ayahs.length) return;

        const nextPage = clampMushafPage(
            selectedSurah.type === 'page'
                ? selectedSurah.page
                : mushafPageNumber || getFirstPageNumber(ayahs, selectedSurah.page),
        );
        const previewAyahs = ayahs.filter((ayah) => Number(ayah.pageNumber) === Number(nextPage));
        loadMushafPage(nextPage, { items: previewAyahs.length ? previewAyahs : undefined });
    }, [displayMode, selectedSurah?.key]);

    useEffect(() => {
        if (!isActive) return;
        if (selectedDetailAyah) {
            navigation?.setBack(() => {
                closeAyahDetail();
                return true;
            });
        } else if (selectedSurah) {
            navigation?.setBack(() => {
                setSelectedSurah(null);
                return true;
            });
        } else {
            navigation?.clearBack?.();
        }
    }, [isActive, selectedDetailAyah, selectedSurah, navigation]);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            readPreference(preferenceKeys.quranAudioQari, 'mishary-rashid-alafasy'),
            readPreference(preferenceKeys.quranAudioRange, null),
            readPreference(preferenceKeys.quranAudioRepeat, false),
            readPreference(preferenceKeys.quranAudioSpeed, 1),
        ]).then(([qariSlug, range, repeat, speed]) => {
            if (!mounted) return;
            if (typeof qariSlug === 'string') {
                setAudioState((current) => ({ ...current, qariSlug }));
            }
            const nextSpeed = clampAudioSpeed(speed);
            audioRangeRepeatRef.current = Boolean(repeat);
            audioRangeSpeedRef.current = nextSpeed;
            setAudioRange((current) => ({
                ...current,
                endAyah: typeof range?.endAyah === 'string' ? range.endAyah : current.endAyah,
                endSurah: typeof range?.endSurah === 'string' ? range.endSurah : current.endSurah,
                repeat: Boolean(repeat),
                speed: nextSpeed,
                startSurah:
                    typeof range?.startSurah === 'string' ? range.startSurah : current.startSurah,
            }));
        });
        return () => {
            mounted = false;
            stopAudio();
        };
    }, []);

    useEffect(() => {
        if (!selectedSurah || selectedSurah.type !== 'surah') return;
        setAudioRange((current) => ({
            ...current,
            endAyah: current.endAyah || `${selectedSurah.ayahs || ''}`,
            endSurah: current.endSurah || `${selectedSurah.number}`,
            startSurah: current.startSurah || `${selectedSurah.number}`,
        }));
    }, [selectedSurah?.number, selectedSurah?.ayahs, selectedSurah?.type]);

    const query = surahQuery.trim().toLowerCase();
    const filteredSurahs = query
        ? surahs.filter((surah) =>
              [surah.number, surah.name, surah.meaning, surah.arabic]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()
                  .includes(query),
          )
        : surahs;
    const progressSurahNumber = progress?.surah_number ? Number(progress.surah_number) : null;
    const targetAyahIndex = targetAyah
        ? ayahs.findIndex((ayah) =>
              (targetAyah.id && Number(targetAyah.id) === Number(ayah.id)) ||
              (targetAyah.number && Number(targetAyah.number) === Number(ayah.number)),
          )
        : -1;
    const estimatedAyahHeight = displayMode === 'line' ? 184 : displayMode === 'focus' ? 196 : 236;
    const readerExtraData = useMemo(
        () => ({
            arabicFont,
            audioRange,
            audioRangeCollapsed,
            audioQueueInfo,
            audioState,
            bookmarks,
            displayMode,
            fontSize,
            memorizationMode,
            revealedAyahs,
            targetAyah,
            translationFontSize,
        }),
        [
            arabicFont,
            audioRange,
            audioRangeCollapsed,
            audioQueueInfo,
            audioState,
            bookmarks,
            displayMode,
            fontSize,
            memorizationMode,
            revealedAyahs,
            targetAyah,
            translationFontSize,
        ],
    );

    useEffect(() => {
        if (!selectedSurah || displayMode === 'mushaf' || readerLoading || targetAyahIndex < 0) {
            return undefined;
        }

        const scrollKey = [
            selectedSurah.key ?? selectedSurah.number,
            targetAyah?.id ?? '',
            targetAyah?.number ?? '',
            targetAyahIndex,
        ].join(':');

        if (targetScrollKeyRef.current === scrollKey) return undefined;
        targetScrollKeyRef.current = scrollKey;

        const timer = setTimeout(() => {
            readerListRef.current?.scrollToIndex?.({
                animated: true,
                index: targetAyahIndex,
                viewPosition: 0.16,
            });
        }, 160);

        return () => clearTimeout(timer);
    }, [
        displayMode,
        readerLoading,
        selectedSurah,
        selectedSurah?.key,
        selectedSurah?.number,
        targetAyah?.id,
        targetAyah?.number,
        targetAyahIndex,
    ]);

    useEffect(() => {
        if (isWebAppLayout && quranTab !== 'surah') {
            setQuranTab('surah');
        }
    }, [isWebAppLayout, quranTab]);

    const {
        closeAyahDetail,
        openAyahDetail,
        renderAyahActionSheet,
        renderAyahCard,
        renderAyahDetailScreen,
        renderAyahNotesModal,
        renderHadithAyahModal,
        renderMunasabahModal,
        renderMushafPage,
        renderQuranListFooter,
        renderQuranListHeader,
        renderReaderFooter,
        renderReaderHeader,
        renderReaderMenuModal,
        renderReferenceModal,
        renderSettingsModal,
        renderSurahRow,
        renderTajweedModal,
    } = createQuranScreenRenderers({
        activeNoteAyah,
        arabicFont,
        audioQariOptions,
        audioRange,
        audioRangeCollapsed,
        audioQueueInfo,
        audioState,
        ayahActionSheet,
        ayahs,
        bookmarks,
        closeReader,
        cycleHafalanStatus,
        displayMode,
        fontSize,
        hadithAyahModal,
        hafalanList,
        hafalanLoading,
        hafalanSummary,
        hizbInput,
        isWebAppLayout,
        loading,
        markAyahProgress,
        memorizationMode,
        message,
        munasabahModal,
        murojaahForm,
        murojaahLoading,
        murojaahMessage,
        mushafPageAyahs,
        mushafPageLoading,
        mushafPageNumber,
        mushafWordsByAyah,
        navigatorMode,
        openHadithAyahModal,
        openHizb,
        openMunasabahModal,
        openPage,
        openReferenceModal,
        openRelatedAyah,
        openRelatedHadith,
        openSurah,
        pageInput,
        playAyahAudio,
        progress,
        progressSurahNumber,
        quranTab,
        readerListRef,
        readerLoading,
        readerLoadingMore,
        readerMenuVisible,
        referenceModal,
        referenceState,
        revealedAyahs,
        savingAyah,
        savingMurojaah,
        selectAudioSpeed,
        selectQari,
        selectedDetailAyah,
        selectedSurah,
        setActiveNoteAyah,
        setAyahActionSheet,
        setAudioRangeCollapsed,
        setHadithAyahModal,
        setHizbInput,
        setMunasabahModal,
        setMurojaahForm,
        setNavigatorMode,
        setPageInput,
        setQuranTab,
        setReaderMenuVisible,
        setReferenceModal,
        setRevealedAyahs,
        setSelectedDetailAyah,
        setSettingsVisible,
        setSurahQuery,
        setTafsirMode,
        setTajweedVisible,
        settingsVisible,
        startRangeAudio,
        stopRangeAudio,
        skipRangeAudio,
        submitMurojaah,
        surahQuery,
        surahs,
        tafsirMode,
        tajweedVisible,
        targetAyah,
        targetAyahIndex,
        toggleAudioRepeat,
        toggleAyahBookmark,
        triggerAdjacentSurah,
        updateArabicFont,
        updateAudioRangeField,
        updateDisplayMode,
        updateFontSize,
        updateMemorizationMode,
        updateTranslationFontSize,
        translationFontSize,
        user,
        webAppQuranTheme,
        webAppQuranThemeStyles,
    });

    if (selectedSurah) {
        if (selectedDetailAyah) {
            return renderAyahDetailScreen();
        }

        if (displayMode === 'mushaf') {
            return (
                <>
                    {renderSettingsModal()}
                    {renderReaderMenuModal()}
                    {renderReferenceModal()}
                    {renderAyahActionSheet()}
                    {renderAyahNotesModal()}
                    {renderTajweedModal()}
                    {renderMunasabahModal()}
                    {renderHadithAyahModal()}
                    <ScrollView
                        contentContainerStyle={[
                            styles.mushafScrollContent,
                            isWebAppLayout ? styles.webAppMushafScrollContent : null,
                            isWebAppLayout ? webAppQuranThemeStyles.mushafScrollContent : null,
                        ]}
                        directionalLockEnabled
                        keyboardShouldPersistTaps="handled"
                        onMomentumScrollBegin={handleScrollActivity}
                        onScroll={handleScrollActivity}
                        onScrollBeginDrag={handleScrollActivity}
                        onTouchCancel={() => {
                            swipeTouchRef.current = null;
                        }}
                        onTouchEnd={endReaderTouch}
                        onTouchMove={moveReaderTouch}
                        onTouchStart={beginReaderTouch}
                        refreshControl={
                            <RefreshControl
                                refreshing={readerLoading}
                                onRefresh={refreshReader}
                                tintColor={isWebAppLayout ? webAppQuranTheme.accent : colors.primary}
                            />
                        }
                        scrollEventThrottle={250}
                        showsVerticalScrollIndicator={false}
                        style={[
                            styles.readerList,
                            isWebAppLayout ? styles.webAppReaderList : null,
                            isWebAppLayout ? webAppQuranThemeStyles.readerList : null,
                        ]}
                        testID={isWebAppLayout ? 'quran-web-app-mushaf-reader' : 'quran-classic-mushaf-reader'}
                    >
                        <View style={styles.mushafGestureSurface}>
                            {renderReaderHeader()}
                            {renderMushafPage()}
                        </View>
                    </ScrollView>
                </>
            );
        }

        return (
            <>
                {renderSettingsModal()}
                {renderReaderMenuModal()}
                {renderReferenceModal()}
                {renderAyahActionSheet()}
                {renderAyahNotesModal()}
                {renderTajweedModal()}
                {renderMunasabahModal()}
                {renderHadithAyahModal()}
                <FlatList
                    key={`${selectedSurah.key ?? selectedSurah.number}:${displayMode}:${targetAyah?.id ?? targetAyah?.number ?? 'top'}:${ayahs.length ? 'ready' : 'loading'}`}
                    ref={readerListRef}
                    contentContainerStyle={[
                        styles.readerListContent,
                        displayMode === 'mushaf' ? styles.mushafListContent : null,
                        isWebAppLayout ? styles.webAppReaderListContent : null,
                        isWebAppLayout ? webAppQuranThemeStyles.readerListContent : null,
                    ]}
                    data={ayahs}
                    extraData={readerExtraData}
                    keyExtractor={(ayah) =>
                        `${selectedSurah.key ?? selectedSurah.number}-${ayah.number}-${ayah.id}`
                    }
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        readerLoading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <EmptyState
                                title="Ayat belum tersedia"
                                description="Data ayat untuk pilihan ini belum tersedia dari server."
                            />
                        )
                    }
                    ListFooterComponent={renderReaderFooter}
                    ListHeaderComponent={renderReaderHeader}
                    onEndReached={loadMoreSurahAyahs}
                    onEndReachedThreshold={0.45}
                    onMomentumScrollBegin={handleScrollActivity}
                    onScroll={handleReaderScroll}
                    onScrollBeginDrag={handleScrollActivity}
                    onTouchCancel={() => {
                        swipeTouchRef.current = null;
                    }}
                    onTouchEnd={endReaderTouch}
                    onTouchMove={moveReaderTouch}
                    onTouchStart={beginReaderTouch}
                    refreshControl={
                        <RefreshControl
                            refreshing={readerLoading}
                            onRefresh={refreshReader}
                            tintColor={isWebAppLayout ? webAppQuranTheme.accent : colors.primary}
                        />
                    }
                    renderItem={renderAyahCard}
                    onScrollToIndexFailed={(info) => {
                        readerListRef.current?.scrollToOffset?.({
                            animated: false,
                            offset: Math.max(0, (info.averageItemLength || estimatedAyahHeight) * info.index),
                        });
                        setTimeout(() => {
                            readerListRef.current?.scrollToIndex?.({
                                animated: true,
                                index: info.index,
                                viewPosition: 0.18,
                            });
                        }, 220);
                    }}
                    scrollEventThrottle={250}
                    showsVerticalScrollIndicator={false}
                    style={[
                        styles.readerList,
                        isWebAppLayout ? styles.webAppReaderList : null,
                        isWebAppLayout ? webAppQuranThemeStyles.readerList : null,
                    ]}
                    testID={isWebAppLayout ? 'quran-web-app-reader' : 'quran-classic-reader'}
                />
            </>
        );
    }

    return (
        <FlatList
            contentContainerStyle={[
                styles.quranListContent,
                isWebAppLayout ? styles.webAppQuranListContent : null,
                isWebAppLayout ? webAppQuranThemeStyles.quranListContent : null,
            ]}
            data={quranTab === 'surah' ? filteredSurahs : []}
            keyExtractor={(surah) => `${surah.number}-${surah.name}`}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
                quranTab === 'surah' ? (
                    loading && surahs.length === 0 ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <EmptyState title="Surah tidak ditemukan" description="Coba kata kunci lain." />
                    )
                ) : null
            }
            ListFooterComponent={renderQuranListFooter}
            ListHeaderComponent={renderQuranListHeader}
            onMomentumScrollBegin={handleScrollActivity}
            onScroll={handleScrollActivity}
            onScrollBeginDrag={handleScrollActivity}
            refreshControl={
                <RefreshControl
                    onRefresh={refreshAll}
                    refreshing={loading}
                    tintColor={isWebAppLayout ? webAppQuranTheme.accent : colors.primary}
                />
            }
            renderItem={renderSurahRow}
            scrollEventThrottle={250}
            showsVerticalScrollIndicator={false}
            style={[
                styles.quranScroll,
                isWebAppLayout ? styles.webAppQuranScroll : null,
                isWebAppLayout ? webAppQuranThemeStyles.quranScroll : null,
            ]}
            testID={isWebAppLayout ? 'quran-web-app-list' : 'quran-classic-list'}
        />
    );
}
