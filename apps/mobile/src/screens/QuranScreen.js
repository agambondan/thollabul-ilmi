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
    StyleSheet,
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
import { QURAN_FONT_FAMILIES } from '../constants/quranFonts';
import { useFeedback } from '../context/FeedbackContext';
import { useSession } from '../context/SessionContext';
import { useTabActivity } from '../context/TabActivityContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { useQuranReaderPreferences } from '../hooks/useQuranReaderPreferences';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import { colors, radius, spacing } from '../theme';
import { playAudioUrl, stopAudio } from '../utils/audioPlayer';

const MEMORIZATION_MODES = [
    { key: 'off', label: 'Normal' },
    { key: 'hide_arabic', label: 'Sembunyikan Arab' },
    { key: 'hide_translation', label: 'Sembunyikan Terjemah' },
    { key: 'hide_all', label: 'Latihan Penuh' },
];

const DISPLAY_MODES = [
    {
        key: 'line',
        label: 'Garis',
        title: 'Rapi per baris',
        description: 'Arab dan terjemah per baris, tanpa info surat dan nomor ayat terpisah.',
    },
    {
        key: 'card',
        label: 'Grid',
        title: 'Grid ayat',
        description: 'Arab dan terjemah dalam kartu ringkas dengan menu sejajar ayat.',
    },
    {
        key: 'focus',
        label: 'Fokus',
        title: 'Arab dominan',
        description: 'Terjemah disembunyikan agar layar lebih tenang.',
    },
    {
        key: 'mushaf',
        label: 'Mushaf',
        title: 'Halaman mushaf',
        description: 'Arab kontinu dalam satu halaman, tanpa kartu per ayat.',
    },
];

const ARABIC_FONTS = [
    { key: 'kitab', label: 'Uthmani', fontFamily: QURAN_FONT_FAMILIES.kitab },
    { key: 'indopak', label: 'Indopak', fontFamily: QURAN_FONT_FAMILIES.indopak },
    { key: 'naskh', label: 'Naskh', fontFamily: QURAN_FONT_FAMILIES.naskh },
];

const QURAN_TABS = [
    { key: 'surah', label: 'Surah' },
    { key: 'hafalan', label: 'Hafalan' },
    { key: 'murojaah', label: 'Murojaah' },
];

const QARI_PRESETS = [
    { qari_name: 'Mishary Rashid Al-Afasy', qari_slug: 'mishary-rashid-alafasy' },
    { qari_name: 'Mishary Alafasy (Legacy)', qari_slug: 'Alafasy_64kbps' },
    { qari_name: 'Abdul Rahman Al-Sudais', qari_slug: 'abdul-rahman-al-sudais' },
];

const AUDIO_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

const SWIPE_TRIGGER_DISTANCE = 34;
const SWIPE_EDGE_GUARD = 48;
const SURAH_PAGE_SIZE = 20;
const SURAH_TARGET_PREFETCH_RADIUS = 1;
const SURAH_PREFETCH_DISTANCE = 620;
const MUSHAF_FIRST_PAGE = 1;
const MUSHAF_LAST_PAGE = 604;
const MIN_ARABIC_FONT_SIZE = 12;
const MAX_ARABIC_FONT_SIZE = 48;
const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const TAJWEED_TEXT_COLORS = {
    ghn: '#FF7E1E',
    ham_wasl: '#AAAAAA',
    idgh_ghn: '#169200',
    idgh_mus: '#A1A1A1',
    idgh_w_ghn: '#169200',
    idghm_shfw: '#58B800',
    ikhf: '#9400A8',
    ikhf_shfw: '#D500B7',
    iqlb: '#26BFFD',
    madda_necessary: '#000EBC',
    madda_normal: '#537FFF',
    madda_obligatory: '#2144C1',
    madda_permissible: '#4050FF',
    madda_pbligatory: '#2144C1',
    qlq: '#DD0008',
    slnt: '#AAAAAA',
};

const toArabicDigits = (value) =>
    String(value ?? '').replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] ?? digit);

const formatInlineAyahMarker = (value) => `۝${toArabicDigits(value)}`;

const decodeArabicHtml = (value = '') =>
    String(value)
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)));

const stripHtmlTags = (value = '') => decodeArabicHtml(value.replace(/<[^>]+>/g, ''));
const stripArabicDiacritics = (value = '') =>
    String(value).replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');

const parseTajweedHtml = (html = '') => {
    if (!html || !/<tajweed/i.test(html)) return [{ text: stripHtmlTags(html), className: null }];

    const segments = [];
    const tagPattern = /<tajweed\s+class=["']([^"']+)["']\s*>(.*?)<\/tajweed>/gis;
    let lastIndex = 0;
    let match;

    while ((match = tagPattern.exec(html)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: stripHtmlTags(html.slice(lastIndex, match.index)), className: null });
        }
        segments.push({ text: stripHtmlTags(match[2]), className: match[1] });
        lastIndex = tagPattern.lastIndex;
    }

    if (lastIndex < html.length) {
        segments.push({ text: stripHtmlTags(html.slice(lastIndex)), className: null });
    }

    return segments.filter((segment) => segment.text);
};

const getTajweedTextColor = (className) => {
    if (!className) return null;
    return String(className)
        .split(/\s+/)
        .map((name) => TAJWEED_TEXT_COLORS[name])
        .find(Boolean) ?? null;
};

const clampAudioSpeed = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.max(0.5, Math.min(2, numeric));
};

const toPositiveInt = (value) => {
    const numeric = Number.parseInt(`${value ?? ''}`, 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const normalizeAudioSources = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.ayah_audio)) return result.ayah_audio;
    if (result?.ayah_audio) return [result.ayah_audio];
    if (result?.audio_url) return [result];
    return [];
};

const getAyahIdentity = (ayah) => `${ayah.surahNumber ?? 'surah'}:${ayah.number ?? ayah.id}`;

const clampMushafPage = (page) => {
    const numeric = Number.parseInt(`${page}`, 10);
    if (!Number.isFinite(numeric)) return MUSHAF_FIRST_PAGE;
    return Math.max(MUSHAF_FIRST_PAGE, Math.min(MUSHAF_LAST_PAGE, numeric));
};

const mergeUniqueAyahs = (pageResults = []) => {
    const seen = new Set();
    return pageResults
        .flatMap((pageResult) => pageResult?.items ?? [])
        .filter((ayah) => {
            const key = getAyahIdentity(ayah);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

const getFirstPageNumber = (items, fallback = MUSHAF_FIRST_PAGE) => {
    const pageNumber = items.find((ayah) => Number.isFinite(Number(ayah.pageNumber)))?.pageNumber;
    return clampMushafPage(pageNumber ?? fallback);
};

const getSurahPageForAyah = (ayahNumber) => {
    const numeric = Number.parseInt(`${ayahNumber}`, 10);
    if (!Number.isFinite(numeric) || numeric < 1) return 0;
    return Math.floor((numeric - 1) / SURAH_PAGE_SIZE);
};

const getInitialSurahPages = (targetPage, totalAyahs) => {
    const page = Math.max(0, Number.parseInt(`${targetPage}`, 10) || 0);
    const maxPage = Number(totalAyahs) > 0
        ? Math.max(0, Math.floor((Number(totalAyahs) - 1) / SURAH_PAGE_SIZE))
        : page + SURAH_TARGET_PREFETCH_RADIUS;
    const start = Math.max(0, page - SURAH_TARGET_PREFETCH_RADIUS);
    const end = Math.min(maxPage, Math.max(start, page + SURAH_TARGET_PREFETCH_RADIUS));
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const getMushafTranslationLength = (ayah) => String(ayah.translation || '').length;

const getMushafArabicTokens = (ayah) => {
    const source = ayah.arabicHtml || ayah.arabic || '';
    return parseTajweedHtml(source)
        .flatMap((segment) =>
            segment.text
                .split(/(\s+)/)
                .filter(Boolean)
                .map((text) => ({ className: segment.className, text })),
        )
        .filter((token) => token.text);
};

const getMushafTokenLength = (token) =>
    stripArabicDiacritics(token.text).replace(/\s+/g, '').length;

const getMushafFragmentLength = (fragment) =>
    fragment.segments.reduce((total, token) => total + getMushafTokenLength(token), 0);

const splitMushafAyahFragments = (ayah, maxArabicLength) => {
    const tokens = getMushafArabicTokens(ayah);
    const fragments = [];
    let current = [];
    let currentLength = 0;

    tokens.forEach((token) => {
        const tokenLength = getMushafTokenLength(token);
        const shouldStartNewFragment =
            current.length > 0 &&
            tokenLength > 0 &&
            currentLength + tokenLength > maxArabicLength;

        if (shouldStartNewFragment) {
            fragments.push({ ayah, fragmentIndex: fragments.length, segments: current, isAyahEnd: false });
            current = [];
            currentLength = 0;
        }

        current.push(token);
        currentLength += tokenLength;
    });

    if (current.length) {
        fragments.push({ ayah, fragmentIndex: fragments.length, segments: current, isAyahEnd: true });
    }

    return fragments.length ? fragments : [{ ayah, fragmentIndex: 0, segments: [], isAyahEnd: true }];
};

const buildMushafLineGroups = (items) => {
    const groups = [];
    let current = [];
    let currentArabicLength = 0;
    let currentTranslationLength = 0;
    const maxArabicLength = 38;
    const maxAyahsPerRow = 3;
    const maxTranslationLength = 150;

    items.forEach((ayah) => {
        splitMushafAyahFragments(ayah, maxArabicLength).forEach((fragment) => {
            const fragmentLength = Math.max(1, getMushafFragmentLength(fragment));
            const translationLength = fragment.isAyahEnd ? getMushafTranslationLength(ayah) : 0;
            const shouldStartNewGroup =
                current.length > 0 &&
                (
                    current.length >= maxAyahsPerRow ||
                    currentArabicLength + fragmentLength > maxArabicLength ||
                    currentTranslationLength + translationLength > maxTranslationLength
                );

            if (shouldStartNewGroup) {
                groups.push(current);
                current = [];
                currentArabicLength = 0;
                currentTranslationLength = 0;
            }

            current.push(fragment);
            currentArabicLength += fragmentLength;
            currentTranslationLength += translationLength;
        });
    });

    if (current.length) groups.push(current);
    return groups;
};

const TAJWEED_GROUPS = [
    {
        key: 'idgham',
        color: '#16a34a',
        title: 'Idgham',
        description: 'Memasukkan nun sukun/tanwin ke huruf berikutnya hingga menjadi satu',
        rules: [
            {
                key: 'idgham-bighunnah',
                color: '#22c55e',
                title: 'Bighunnah',
                description: 'Dengan dengung (2 harakat) — huruf: ي ن م و',
                example: 'مِن يَّقُولُ',
            },
            {
                key: 'idgham-bilaghunnah',
                color: '#86efac',
                title: 'Bila Ghunnah',
                description: 'Tanpa dengung — huruf: ل ر',
                example: 'مِن لَّدُنْهُ',
            },
        ],
    },
    {
        key: 'idzhar',
        color: '#2563eb',
        title: 'Idzhar',
        description: 'Membaca nun sukun/tanwin dengan jelas tanpa dengung',
        rules: [
            {
                key: 'idzhar-halqi',
                color: '#3b82f6',
                title: 'Halqi',
                description: 'Huruf halq: ء ه ع ح غ خ',
                example: 'مِنْ خَيْرٍ',
            },
            {
                key: 'idzhar-syafawi',
                color: '#93c5fd',
                title: 'Syafawi',
                description: 'Mim sukun diikuti huruf selain م dan ب',
                example: 'لَهُمْ فِيهَا',
            },
        ],
    },
    {
        key: 'iqlab',
        color: '#d97706',
        title: 'Iqlab',
        description: 'Menukar nun sukun/tanwin menjadi mim dengan dengung',
        rules: [
            {
                key: 'iqlab',
                color: '#f59e0b',
                title: 'Iqlab',
                description: 'Nun sukun/tanwin bertemu ب',
                example: 'مِنْ بَعْدِ',
            },
        ],
    },
    {
        key: 'ikhfa',
        color: '#db2777',
        title: 'Ikhfa',
        description: 'Menyembunyikan nun sukun/tanwin antara jelas dan melebur',
        rules: [
            {
                key: 'ikhfa-haqiqi',
                color: '#ec4899',
                title: 'Haqiqi',
                description: '15 huruf ikhfa (selain ب dan huruf idgham/idzhar)',
                example: 'مِن تَحْتِهَا',
            },
            {
                key: 'ikhfa-syafawi',
                color: '#f9a8d4',
                title: 'Syafawi',
                description: 'Mim sukun bertemu ب',
                example: 'رَبَّهُم بِٱلْغَيْبِ',
            },
        ],
    },
    {
        key: 'ghunnah',
        color: '#7c3aed',
        title: 'Ghunnah',
        description: 'Dengung pada nun atau mim bertasydid (2 harakat)',
        rules: [
            {
                key: 'ghunnah',
                color: '#8b5cf6',
                title: 'Ghunnah Musyaddadah',
                description: 'Nun atau mim yang mendapat tasydid',
                example: 'إِنَّ ٱلَّذِينَ',
            },
        ],
    },
    {
        key: 'mad',
        color: '#0d9488',
        title: 'Mad',
        description: 'Memanjangkan bacaan lebih dari 2 harakat',
        rules: [
            {
                key: 'mad-thabii',
                color: '#14b8a6',
                title: "Thabi'i (2 harakat)",
                description: "Mad asli — huruf mad (ا و ي) tanpa hamzah atau sukun sesudahnya",
                example: 'قَالَ',
            },
            {
                key: 'mad-wajib',
                color: '#2dd4bf',
                title: 'Wajib Muttashil (4–5)',
                description: 'Huruf mad bertemu hamzah dalam satu kata',
                example: 'جَاءَ',
            },
            {
                key: 'mad-jaiz',
                color: '#99f6e4',
                title: 'Jaiz Munfashil (2–5)',
                description: 'Huruf mad bertemu hamzah di awal kata berikutnya',
                example: 'إِنَّا أَعْطَيْنَٰكَ',
            },
            {
                key: 'mad-aridh',
                color: '#5eead4',
                title: "'Aridh Lissukun (2–6)",
                description: 'Mad thabi\'i diikuti huruf yang dibaca waqf/sukun',
                example: 'نَسْتَعِينُ',
            },
            {
                key: 'mad-lazim',
                color: '#0f766e',
                title: 'Lazim (6 harakat)',
                description: 'Huruf mad diikuti sukun lazim (asli) atau tasydid',
                example: 'وَلَا ٱلضَّآلِّينَ',
            },
        ],
    },
    {
        key: 'qalqalah',
        color: '#ea580c',
        title: 'Qalqalah',
        description: 'Memantulkan suara — huruf: ق ط ب ج د',
        rules: [
            {
                key: 'qalqalah-sughra',
                color: '#f97316',
                title: 'Sughra',
                description: 'Huruf qalqalah sukun di tengah kata (pantulan ringan)',
                example: 'يَقْتُلُونَ',
            },
            {
                key: 'qalqalah-kubra',
                color: '#fed7aa',
                title: 'Kubra',
                description: 'Huruf qalqalah di akhir kata saat waqf (pantulan kuat)',
                example: 'أَحَدٌ',
            },
        ],
    },
];

export function QuranScreen({ deepLinkTarget, isActive, navigation }) {
    const { width: viewportWidth } = useWindowDimensions();
    const { user } = useSession();
    const { showError, showInfo, showSuccess } = useFeedback();
    const { notifyTabActivity } = useTabActivity();
    const { isWebAppLayout } = useLayoutModePreference();
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
        updateArabicFont,
        updateDisplayMode,
        updateFontSize,
        updateMemorizationMode,
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
            playRangeQueueItem(0, sessionId);
        } catch (err) {
            setAudioRange((current) => ({ ...current, loading: false, playing: false }));
            setMessage(err?.message ?? 'Range audio belum bisa dimuat.');
        }
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

    const getArabicTypography = (extraSize = 0, lineHeightRatio = 1.75) => {
        const font = ARABIC_FONTS.find((f) => f.key === arabicFont);
        const size = Math.max(
            MIN_ARABIC_FONT_SIZE,
            Math.min(MAX_ARABIC_FONT_SIZE + extraSize, fontSize + extraSize),
        );
        return {
            fontSize: size,
            fontWeight: '400',
            lineHeight: Math.round(size * lineHeightRatio),
            ...(font?.fontFamily ? { fontFamily: font.fontFamily } : {}),
        };
    };

    const renderAudioSources = (ayah) => {
        const sources = audioState.sourcesByAyah[ayah.id] ?? [];
        if (sources.length <= 1) return null;
        return (
            <View style={styles.qariGrid}>
                {sources.map((source) => (
                    <Pressable
                        key={`${ayah.id}-${source.qari_slug}`}
                        onPress={() => selectQari(ayah.id, source.qari_slug)}
                        style={[
                            styles.qariButton,
                            audioState.qariSlug === source.qari_slug ? styles.qariButtonActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.qariText,
                                audioState.qariSlug === source.qari_slug ? styles.qariTextActive : null,
                            ]}
                        >
                            {source.qari_name}
                        </Text>
                    </Pressable>
                ))}
            </View>
        );
    };

    const renderArabicSpans = (ayah, keyPrefix = 'arabic') => {
        const source = ayah.arabicHtml || ayah.arabic || '';
        const segments = /<tajweed/i.test(source)
            ? parseTajweedHtml(source)
            : [{ text: stripHtmlTags(source), className: null }];

        return segments.map((segment, index) => {
            const color = getTajweedTextColor(segment.className);
            return (
                <Text
                    key={`${keyPrefix}-${ayah.id ?? ayah.number}-${index}`}
                    style={color ? { color } : null}
                >
                    {segment.text}
                </Text>
            );
        });
    };

    const renderArabicContent = (ayah, arabicStyle, keyPrefix = 'arabic') => (
        <Text style={arabicStyle}>
            {renderArabicSpans(ayah, keyPrefix)}
            <Text style={styles.inlineAyahMarker}>{`\u00A0${formatInlineAyahMarker(ayah.number)}\u00A0`}</Text>
        </Text>
    );

    const renderAyahText = (ayah) => {
        const isRevealed = Boolean(revealedAyahs[ayah.id]);
        const hideArabic = !isRevealed && ['hide_arabic', 'hide_all'].includes(memorizationMode);
        const isMushaf = displayMode === 'mushaf';
        const isLine = displayMode === 'line';
        const isFocus = displayMode === 'focus' || isMushaf;
        const hideTranslationForMemorization =
            !isRevealed && ['hide_translation', 'hide_all'].includes(memorizationMode);
        const hideTranslation = isFocus || hideTranslationForMemorization;
        const hasHiddenContent = hideArabic || (!isFocus && hideTranslationForMemorization);
        const arabicBaseStyle = isMushaf ? styles.mushafArabic : isLine ? styles.lineArabic : styles.ayahArabic;
        const arabicStyle = [
            arabicBaseStyle,
            getArabicTypography(isMushaf ? 2 : 0, isMushaf ? 1.85 : 1.75),
        ];

        return (
            <>
                {(ayah.arabic || ayah.arabicHtml) && !hideArabic ? (
                    renderArabicContent(ayah, arabicStyle, `reader-${displayMode}`)
                ) : null}
                {hideArabic ? (
                    <View style={styles.hiddenBlock}>
                        <Text style={styles.hiddenTitle}>Arab disembunyikan untuk hafalan</Text>
                    </View>
                ) : null}
                {ayah.latin && !hideTranslation ? (
                    <Text style={styles.ayahLatin}>{ayah.latin}</Text>
                ) : null}
                {ayah.translation && !hideTranslation ? (
                    <Text style={styles.ayahTranslation}>{ayah.translation}</Text>
                ) : null}
                {!isFocus && hideTranslationForMemorization ? (
                    <View style={styles.hiddenBlock}>
                        <Text style={styles.hiddenTitle}>Terjemahan disembunyikan untuk latihan</Text>
                    </View>
                ) : null}
                {hasHiddenContent && !isLine ? (
                    <Pressable
                        onPress={() => setRevealedAyahs((current) => ({ ...current, [ayah.id]: true }))}
                        style={styles.revealButton}
                    >
                        <Text style={styles.revealButtonText}>Tampilkan Ayat</Text>
                    </Pressable>
                ) : null}
            </>
        );
    };

    const openAyahDetail = (ayah) => {
        setAyahActionSheet({ visible: false, ayah: null });
        setSelectedDetailAyah(ayah);
    };

    const closeAyahDetail = () => {
        setSelectedDetailAyah(null);
        setActiveNoteAyah(null);
    };

    const renderInlineArabicRow = (ayah) => (
        <View style={styles.inlineArabicRow}>
            <Pressable
                accessibilityLabel={`Aksi ayat ${ayah.number}`}
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: true }}
                onPress={() => setAyahActionSheet({ visible: true, ayah })}
                style={styles.inlineAyahMenuButton}
            >
                <MoreVertical color={colors.primary} size={18} strokeWidth={2.4} />
            </Pressable>
            <Pressable
                accessibilityLabel={`Buka detail ayat ${ayah.number}`}
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(91, 110, 91, 0.08)', borderless: false }}
                onPress={() => openAyahDetail(ayah)}
                style={styles.inlineArabicText}
            >
                {renderAyahText(ayah)}
                {displayMode !== 'mushaf' ? (
                    <Text style={styles.ayahReadMore}>Ketuk untuk membaca lengkap</Text>
                ) : null}
            </Pressable>
        </View>
    );

    const renderAyahHeader = (ayah) => {
        const meta = ayah.surahName ? `${ayah.surahName} · Ayah ${ayah.number}` : `Ayah ${ayah.number}`;
        return (
            <View style={styles.ayahHeader}>
                <View style={styles.ayahHeaderCopy}>
                    <Text style={styles.ayahHeaderTitle}>{selectedSurah.name}</Text>
                    <Text style={styles.ayahHeaderMeta}>{meta}</Text>
                </View>
                <Pressable
                    accessibilityLabel={`Aksi ayat ${ayah.number}`}
                    accessibilityRole="button"
                    android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: true }}
                    onPress={() => setAyahActionSheet({ visible: true, ayah })}
                    style={styles.ayahMenuButton}
                >
                    <MoreVertical color={colors.primary} size={18} strokeWidth={2.4} />
                </Pressable>
            </View>
        );
    };

    const renderLineAyah = (ayah, isTargetAyah) => (
        <View style={[styles.lineAyahRow, isTargetAyah ? styles.targetAyahCard : null]}>
            {renderInlineArabicRow(ayah)}
            {audioState.activeAyahId === ayah.id ? renderAudioSources(ayah) : null}
        </View>
    );

    const renderReaderFooter = () => {
        if (!readerLoadingMore) return null;
        return (
            <View style={styles.readerLoadingMore}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.readerLoadingMoreText}>Memuat ayat berikutnya...</Text>
            </View>
        );
    };

    const renderAyahCard = ({ item: ayah }) => {
        const isTargetAyah =
            (targetAyah?.id && Number(targetAyah.id) === Number(ayah.id)) ||
            (targetAyah?.number && Number(targetAyah.number) === Number(ayah.number));

        if (displayMode === 'line') return renderLineAyah(ayah, isTargetAyah);
        if (displayMode === 'focus') {
            return (
                <View style={[styles.focusAyahRow, isTargetAyah ? styles.targetAyahCard : null]}>
                    {renderInlineArabicRow(ayah)}
                    {audioState.activeAyahId === ayah.id ? renderAudioSources(ayah) : null}
                </View>
            );
        }

        return (
            <Card style={[
                displayMode === 'focus' ? styles.focusAyahCard : null,
                isTargetAyah ? styles.targetAyahCard : null,
            ]}>
                {renderInlineArabicRow(ayah)}
                {audioState.activeAyahId === ayah.id ? renderAudioSources(ayah) : null}
            </Card>
        );
    };

    const renderMushafFragmentSpans = (fragment, keyPrefix) =>
        fragment.segments.map((segment, index) => {
            const color = getTajweedTextColor(segment.className);
            return (
                <Text
                    key={`${keyPrefix}-${index}`}
                    style={color ? { color } : null}
                >
                    {segment.text}
                </Text>
            );
        });

    const renderMushafLineBlock = (group, mushafArabicStyle, showMushafArabic, showMushafTranslation) => {
        const key = group
            .map((fragment) =>
                `${fragment.ayah.surahNumber ?? selectedSurah.number}:${fragment.ayah.number}:${fragment.fragmentIndex}`,
            )
            .join('-');
        return (
            <View key={`mushaf-line-${key}`} style={styles.mushafAyahBlockLine}>
                {showMushafArabic ? (
                    <Text style={mushafArabicStyle}>
                        {group.map((fragment, fragmentIndex) => {
                            const ayah = fragment.ayah;
                            const isTargetAyah =
                                (targetAyah?.id && Number(targetAyah.id) === Number(ayah.id)) ||
                                (targetAyah?.number && Number(targetAyah.number) === Number(ayah.number));
                            return (
                                <Text
                                    key={`${ayah.id}-${ayah.surahNumber ?? selectedSurah.number}-${ayah.number}-${fragment.fragmentIndex}`}
                                    onPress={() => setAyahActionSheet({ visible: true, ayah })}
                                    style={isTargetAyah ? styles.mushafInlineTarget : null}
                                >
                                    {renderMushafFragmentSpans(fragment, `mushaf-line-${ayah.id}-${fragment.fragmentIndex}`)}
                                    {fragment.isAyahEnd ? (
                                        <Text style={styles.mushafVerseMark}> ۝{toArabicDigits(ayah.number)} </Text>
                                    ) : null}
                                </Text>
                            );
                        })}
                    </Text>
                ) : null}
                {showMushafTranslation && group.some((fragment) => fragment.isAyahEnd && fragment.ayah.translation) ? (
                    <Text style={styles.mushafPageTranslation}>
                        {group
                            .filter((fragment) => fragment.isAyahEnd && fragment.ayah.translation)
                            .map((fragment) => `${toArabicDigits(fragment.ayah.number)}. ${fragment.ayah.translation}`)
                            .join('  /  ')}
                    </Text>
                ) : null}
            </View>
        );
    };

    const renderMushafPerKataAyah = (ayah, words, showMushafArabic, showMushafTranslation) => {
        const ayahKey = `${ayah.surahNumber ?? selectedSurah.number}:${ayah.number}`;
        const isTargetAyah =
            (targetAyah?.id && Number(targetAyah.id) === Number(ayah.id)) ||
            (targetAyah?.number && Number(targetAyah.number) === Number(ayah.number));
        return (
            <Pressable
                key={`mushaf-perkata-${ayahKey}`}
                accessibilityRole="button"
                accessibilityLabel={`Aksi ayat ${ayah.number}`}
                onPress={() => setAyahActionSheet({ visible: true, ayah })}
                style={[
                    styles.mushafPerKataAyah,
                    isTargetAyah ? styles.mushafPerKataAyahTarget : null,
                ]}
            >
                {showMushafArabic ? (
                    <View style={styles.mushafPerKataRow}>
                        {words.map((word) => (
                            <View
                                key={`${ayahKey}-w${word.wordIndex}`}
                                style={styles.mushafWordCell}
                            >
                                <Text style={[styles.mushafWordArabic, getArabicTypography(0, 1.4)]}>
                                    {word.arabic}
                                </Text>
                                <Text style={styles.mushafWordLatin}>
                                    {word.transliteration || ' '}
                                </Text>
                                {showMushafTranslation ? (
                                    <Text style={styles.mushafWordIndo}>
                                        {word.indonesian || ' '}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                        <View style={styles.mushafVerseEndCell}>
                            <View style={styles.mushafVerseEndCircle}>
                                <Text style={styles.mushafVerseEndText}>
                                    {toArabicDigits(ayah.number)}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : null}
                {showMushafTranslation && ayah.translation ? (
                    <Text style={styles.mushafPerKataFullTranslation}>
                        {`(${ayah.number}) ${ayah.translation}`}
                    </Text>
                ) : null}
            </Pressable>
        );
    };

    const renderMushafPage = () => {
        const mushafArabicStyle = [
            styles.mushafPageArabic,
            getArabicTypography(-3, 1.72),
        ];
        const showMushafArabic = !['hide_arabic', 'hide_all'].includes(memorizationMode);
        const showMushafTranslation = !['hide_translation', 'hide_all'].includes(memorizationMode);
        const currentPage = clampMushafPage(
            mushafPageNumber || selectedSurah.page || getFirstPageNumber(ayahs),
        );
        const fallbackPageAyahs = ayahs.filter((ayah) => Number(ayah.pageNumber) === Number(currentPage));
        const pageAyahs = mushafPageAyahs.length ? mushafPageAyahs : fallbackPageAyahs;

        if (readerLoading || (mushafPageLoading && !pageAyahs.length)) {
            return (
                <View style={styles.mushafPageShell}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            );
        }

        if (!pageAyahs.length) {
            return (
                <EmptyState
                    title="Ayat belum tersedia"
                    description="Data ayat untuk pilihan ini belum tersedia dari server."
                />
            );
        }

        const firstAyah = pageAyahs[0];
        const lastAyah = pageAyahs[pageAyahs.length - 1];
        const rangeLabel = firstAyah && lastAyah
            ? `${firstAyah.surahName || selectedSurah.name} ${firstAyah.number}-${lastAyah.number}`
            : selectedSurah.meaning || "Al-Qur'an";
        const juzLabel = firstAyah?.juzNumber ? `${firstAyah.juzNumber}` : '1';
        const surahLabel = firstAyah?.surahName || selectedSurah.name;
        const surahNumberLabel =
            firstAyah?.surahNumber ?? selectedSurah.number ?? '';
        const showStandaloneBismillah =
            Number(firstAyah?.number) === 1 &&
            Number(firstAyah?.surahNumber ?? selectedSurah.number) !== 1 &&
            Number(firstAyah?.surahNumber ?? selectedSurah.number) !== 9;

        // Decide whether we have per-kata data for ALL ayahs on this page.
        // If yes → render the per-kata layout (matches reference image).
        // If no → fall back to existing row-based mushaf layout.
        const ayahsWithWordCheck = pageAyahs.map((ayah) => {
            const key = `${ayah.surahNumber ?? selectedSurah.number}:${ayah.number}`;
            const words = mushafWordsByAyah[key] || [];
            return { ayah, words };
        });
        const hasPerKataDataForAll =
            ayahsWithWordCheck.length > 0 &&
            ayahsWithWordCheck.every(({ words }) => words.length > 0);

        return (
            <View style={styles.mushafPagesStack}>
                <View key={`mushaf-page-${currentPage}`} style={styles.mushafPageShell}>
                    <View style={styles.mushafFrameOuter}>
                        <View style={styles.mushafFrame}>
                            <View style={styles.mushafFrameTop}>
                                <View style={styles.mushafFrameJuzBadge}>
                                    <Text style={styles.mushafFrameJuzText}>
                                        {`JUZ ${juzLabel}`}
                                    </Text>
                                </View>
                                <View style={styles.mushafFramePageBadge}>
                                    <Text style={styles.mushafFramePageText}>
                                        {currentPage}
                                    </Text>
                                </View>
                                <View style={styles.mushafFrameSurahBadge}>
                                    <Text style={styles.mushafFrameSurahText}>
                                        {`${surahNumberLabel}. ${surahLabel}`.trim()}
                                    </Text>
                                </View>
                            </View>
                            {showStandaloneBismillah ? (
                                <Text style={[styles.mushafBismillah, getArabicTypography(8, 1.65)]}>
                                    {BISMILLAH}
                                </Text>
                            ) : null}
                            {hasPerKataDataForAll ? (
                                <View style={styles.mushafPerKataStack}>
                                    {ayahsWithWordCheck.map(({ ayah, words }) =>
                                        renderMushafPerKataAyah(
                                            ayah,
                                            words,
                                            showMushafArabic,
                                            showMushafTranslation,
                                        ),
                                    )}
                                </View>
                            ) : (
                                <View style={styles.mushafAyahBlockStack}>
                                    {buildMushafLineGroups(pageAyahs).map((group) =>
                                        renderMushafLineBlock(
                                            group,
                                            mushafArabicStyle,
                                            showMushafArabic,
                                            showMushafTranslation,
                                        ),
                                    )}
                                </View>
                            )}
                            {mushafPageLoading ? (
                                <View style={styles.mushafInlineLoading}>
                                    <ActivityIndicator color={colors.primary} size="small" />
                                </View>
                            ) : null}
                            <View style={styles.mushafFrameBottom}>
                                <Text style={styles.mushafRangeMeta}>{rangeLabel}</Text>
                                <View style={styles.mushafFootPageBadge}>
                                    <Text style={styles.mushafFootPageText}>{currentPage}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderAudioRangePanel = () => {
        if (!selectedSurah || selectedSurah.type !== 'surah') return null;
        const activeQari = audioQariOptions.find((item) => item.qari_slug === audioState.qariSlug);
        const isPlaying = audioRange.playing || audioRange.loading;

        return (
            <View style={styles.audioPanel}>
                <View style={styles.audioPanelHeader}>
                    <View style={styles.audioPanelTitleRow}>
                        <Volume2 color={colors.primaryDark} size={18} strokeWidth={2.2} />
                        <View style={styles.audioPanelTitleCopy}>
                            <Text style={styles.audioPanelTitle}>Audio Surat</Text>
                            <Text numberOfLines={1} style={styles.audioPanelMeta}>
                                {activeQari?.qari_name || 'Pilih qari'} · {audioRange.speed}x
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
                        disabled={audioRange.loading}
                        onPress={isPlaying ? stopRangeAudio : startRangeAudio}
                        style={[
                            styles.audioPrimaryButton,
                            audioRange.loading ? styles.disabled : null,
                        ]}
                        testID="audio-range-toggle"
                    >
                        {isPlaying ? (
                            <Pause color={colors.onPrimary} size={15} strokeWidth={2.4} />
                        ) : (
                            <Volume2 color={colors.onPrimary} size={15} strokeWidth={2.4} />
                        )}
                        <Text style={styles.audioPrimaryButtonText}>
                            {audioRange.loading ? 'Memuat' : isPlaying ? 'Stop' : 'Putar range'}
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.audioInputGrid}>
                    <View style={styles.audioInputGroup}>
                        <Text style={styles.audioInputLabel}>Dari surat</Text>
                        <TextInput
                            keyboardType="number-pad"
                            onChangeText={(value) => updateAudioRangeField('startSurah', value)}
                            placeholder={`${selectedSurah.number}`}
                            placeholderTextColor={colors.muted}
                            style={styles.audioInput}
                            testID="audio-start-surah"
                            value={audioRange.startSurah}
                        />
                    </View>
                    <View style={styles.audioInputGroup}>
                        <Text style={styles.audioInputLabel}>Sampai surat</Text>
                        <TextInput
                            keyboardType="number-pad"
                            onChangeText={(value) => updateAudioRangeField('endSurah', value)}
                            placeholder={`${selectedSurah.number}`}
                            placeholderTextColor={colors.muted}
                            style={styles.audioInput}
                            testID="audio-end-surah"
                            value={audioRange.endSurah}
                        />
                    </View>
                    <View style={styles.audioInputGroup}>
                        <Text style={styles.audioInputLabel}>Sampai ayat</Text>
                        <TextInput
                            keyboardType="number-pad"
                            onChangeText={(value) => updateAudioRangeField('endAyah', value)}
                            placeholder={`${selectedSurah.ayahs || ''}`}
                            placeholderTextColor={colors.muted}
                            style={styles.audioInput}
                            testID="audio-end-ayah"
                            value={audioRange.endAyah}
                        />
                    </View>
                </View>

                <Text style={styles.audioSectionLabel}>Qari</Text>
                <View style={styles.audioChipRow}>
                    {audioQariOptions.map((qari) => {
                        const isActive = audioState.qariSlug === qari.qari_slug;
                        return (
                            <Pressable
                                key={qari.qari_slug}
                                onPress={() => selectQari(null, qari.qari_slug)}
                                style={[
                                    styles.audioChip,
                                    isActive ? styles.audioChipActive : null,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.audioChipText,
                                        isActive ? styles.audioChipTextActive : null,
                                    ]}
                                >
                                    {qari.qari_name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.audioControlRow}>
                    <View style={styles.audioControlGroup}>
                        <Text style={styles.audioSectionLabel}>Speed</Text>
                        <View style={styles.audioChipRow}>
                            {AUDIO_SPEED_OPTIONS.map((speed) => {
                                const isActive = audioRange.speed === speed;
                                return (
                                    <Pressable
                                        key={speed}
                                        onPress={() => selectAudioSpeed(speed)}
                                        style={[
                                            styles.audioChip,
                                            isActive ? styles.audioChipActive : null,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.audioChipText,
                                                isActive ? styles.audioChipTextActive : null,
                                            ]}
                                        >
                                            {speed}x
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                    <Pressable
                        onPress={toggleAudioRepeat}
                        style={[
                            styles.audioRepeatButton,
                            audioRange.repeat ? styles.audioRepeatButtonActive : null,
                        ]}
                        testID="audio-repeat-toggle"
                    >
                        <Text
                            style={[
                                styles.audioRepeatText,
                                audioRange.repeat ? styles.audioRepeatTextActive : null,
                            ]}
                        >
                            Repeat {audioRange.repeat ? 'On' : 'Off'}
                        </Text>
                    </Pressable>
                </View>

                {audioRange.currentLabel ? (
                    <Text style={styles.audioStatusText}>{audioRange.currentLabel}</Text>
                ) : null}
            </View>
        );
    };

    const renderReaderHeader = () => {
        const isSeriousMode = displayMode === 'focus' || displayMode === 'mushaf';
        const selectedSurahNumber = Number(selectedSurah?.number);
        const currentSurahIndex =
            selectedSurah?.type === 'surah'
                ? surahs.findIndex((item) => Number(item.number) === selectedSurahNumber)
                : -1;
        const hasPreviousSurah = currentSurahIndex > 0;
        const hasNextSurah = currentSurahIndex >= 0 && currentSurahIndex < surahs.length - 1;
        const previousSurah = hasPreviousSurah ? surahs[currentSurahIndex - 1] : null;
        const nextSurah = hasNextSurah ? surahs[currentSurahIndex + 1] : null;
        const previewAyah = targetAyah
            ? ayahs.find((ayah) =>
                  (targetAyah.id && Number(targetAyah.id) === Number(ayah.id)) ||
                  (targetAyah.number && Number(targetAyah.number) === Number(ayah.number)),
              )
            : null;

        return (
        <>
            <View style={[styles.readerHeader, isSeriousMode ? styles.readerHeaderSerious : null]}>
                <View style={styles.readerHeaderTop}>
                    <View style={styles.readerHeaderCopy}>
                        <Text style={styles.readerTitle}>{selectedSurah.name}</Text>
                        <Text style={styles.readerSubtitle}>
                            {isSeriousMode
                                ? displayMode === 'mushaf'
                                    ? `Halaman ${mushafPageNumber} · mode mushaf`
                                    : selectedSurah.type === 'surah'
                                    ? `${selectedSurah.ayahs} ayah · mode baca fokus`
                                    : selectedSurah.meaning || 'Mode baca fokus'
                                : selectedSurah.type === 'surah'
                                  ? `${selectedSurah.meaning || "Bacaan Al-Qur'an"} · ${selectedSurah.ayahs} ayah`
                                  : selectedSurah.meaning || "Bacaan Al-Qur'an"}
                        </Text>
                    </View>
                    <View style={styles.readerHeaderActions}>
                        <IconActionButton
                            Icon={ArrowLeft}
                            label="Kembali ke daftar surah"
                            onPress={closeReader}
                        />
                        <IconActionButton
                            Icon={MoreVertical}
                            label="Menu baca"
                            onPress={() => setReaderMenuVisible(true)}
                        />
                    </View>
                </View>
            </View>
            {selectedSurah.type === 'surah' && displayMode !== 'mushaf' ? (
                <View style={styles.surahPagerRow}>
                    <Pressable
                        accessibilityLabel={
                            previousSurah
                                ? `Buka ${previousSurah.name}`
                                : 'Tidak ada surah sebelumnya'
                        }
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                        disabled={!hasPreviousSurah || readerLoading}
                        onPress={() => triggerAdjacentSurah(-1)}
                        style={[
                            styles.surahPagerButton,
                            !hasPreviousSurah || readerLoading ? styles.disabled : null,
                        ]}
                    >
                        <ArrowLeft color={colors.primaryDark} size={16} strokeWidth={2.2} />
                        <Text numberOfLines={2} style={styles.surahPagerButtonText}>
                            {previousSurah ? `${previousSurah.number}. ${previousSurah.name}` : '—'}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityLabel={
                            nextSurah ? `Buka ${nextSurah.name}` : 'Tidak ada surah selanjutnya'
                        }
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                        disabled={!hasNextSurah || readerLoading}
                        onPress={() => triggerAdjacentSurah(1)}
                        style={[
                            styles.surahPagerButton,
                            !hasNextSurah || readerLoading ? styles.disabled : null,
                        ]}
                    >
                        <Text numberOfLines={2} style={styles.surahPagerButtonText}>
                            {nextSurah ? `${nextSurah.number}. ${nextSurah.name}` : '—'}
                        </Text>
                        <ArrowRight color={colors.primaryDark} size={16} strokeWidth={2.2} />
                    </Pressable>
                </View>
            ) : null}
            {selectedSurah.type === 'surah' ? renderAudioRangePanel() : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {previewAyah && !isSeriousMode ? (
                <View style={styles.targetPreview}>
                    <Text style={styles.targetPreviewKicker}>Hasil pencarian</Text>
                    <Text style={styles.targetPreviewTitle}>
                        {selectedSurah.name} · Ayat {previewAyah.number}
                    </Text>
                    <Text style={styles.targetPreviewText}>
                        Ayat sudah ditandai di daftar. Reader akan langsung mengarah ke posisi ayat
                        setelah data siap.
                    </Text>
                    {displayMode === 'mushaf' ? null : (
                        <Pressable
                            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                            onPress={() => {
                                if (targetAyahIndex < 0) return;
                                readerListRef.current?.scrollToIndex?.({
                                    animated: true,
                                    index: targetAyahIndex,
                                    viewPosition: 0.18,
                                });
                            }}
                            style={styles.targetPreviewButton}
                        >
                            <Text style={styles.targetPreviewButtonText}>Lihat posisi dalam surah</Text>
                        </Pressable>
                    )}
                </View>
            ) : null}
        </>
        );
    };

    const renderReaderMenuModal = () => {
        const isSeriousMode = displayMode === 'focus' || displayMode === 'mushaf';
        return (
            <AppActionSheet
                onClose={() => setReaderMenuVisible(false)}
                title="Menu Baca"
                visible={readerMenuVisible}
            >
                <ActionSheetRow
                    Icon={SlidersHorizontal}
                    onPress={() => {
                        setReaderMenuVisible(false);
                        setSettingsVisible(true);
                    }}
                    subtitle="Ubah mode baca, font, dan ukuran arab"
                    title="Pengaturan tampilan"
                />
                {isSeriousMode ? (
                    <ActionSheetRow
                        Icon={BookOpen}
                        onPress={() => {
                            setReaderMenuVisible(false);
                            updateDisplayMode('card');
                        }}
                        subtitle="Kembali ke tampilan card lengkap"
                        title="Keluar mode fokus"
                    />
                ) : null}
                <ActionSheetRow
                    Icon={ArrowLeft}
                    onPress={() => {
                        setReaderMenuVisible(false);
                        closeReader();
                    }}
                    subtitle="Tutup reader dan kembali ke daftar"
                    title="Kembali ke daftar surah"
                />
            </AppActionSheet>
        );
    };

    const renderSettingsModal = () => (
        <AppModalSheet
            maxHeight="65%"
            onClose={() => setSettingsVisible(false)}
            title="Pengaturan Tampilan"
            visible={settingsVisible}
        >
            <Text style={styles.settingLabel}>Ukuran Teks Arab</Text>
            <View style={styles.fontSizeRow}>
                <Pressable
                    disabled={fontSize <= MIN_ARABIC_FONT_SIZE}
                    onPress={() => updateFontSize(fontSize - 2)}
                    style={[
                        styles.fontSizeButton,
                        fontSize <= MIN_ARABIC_FONT_SIZE ? styles.disabled : null,
                    ]}
                >
                    <Minus color={colors.ink} size={16} strokeWidth={2.4} />
                </Pressable>
                <Text style={styles.fontSizeValue}>{fontSize}px</Text>
                <Pressable
                    disabled={fontSize >= MAX_ARABIC_FONT_SIZE}
                    onPress={() => updateFontSize(fontSize + 2)}
                    style={[
                        styles.fontSizeButton,
                        fontSize >= MAX_ARABIC_FONT_SIZE ? styles.disabled : null,
                    ]}
                >
                    <Plus color={colors.ink} size={16} strokeWidth={2.4} />
                </Pressable>
            </View>

            <Text style={styles.settingLabel}>Font Arabic</Text>
            <View style={styles.settingChips}>
                {ARABIC_FONTS.map((font) => (
                    <Pressable
                        key={font.key}
                        onPress={() => updateArabicFont(font.key)}
                        style={[
                            styles.settingChip,
                            arabicFont === font.key ? styles.settingChipActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.settingChipText,
                                font.fontFamily ? { fontFamily: font.fontFamily, fontWeight: '400' } : null,
                                arabicFont === font.key ? styles.settingChipTextActive : null,
                            ]}
                        >
                            {font.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.settingLabel}>Model Tampilan Baca</Text>
            <View style={styles.displayModeStack}>
                {DISPLAY_MODES.map((mode) => (
                    <Pressable
                        key={mode.key}
                        onPress={() => updateDisplayMode(mode.key)}
                        style={[
                            styles.displayModeCard,
                            displayMode === mode.key ? styles.displayModeCardActive : null,
                        ]}
                    >
                        <View style={styles.displayModePreview}>
                            <View style={styles.displayModePreviewTop} />
                            <View
                                style={[
                                    styles.displayModePreviewLine,
                                    mode.key === 'mushaf' ? styles.displayModePreviewLineFull : null,
                                ]}
                            />
                            {mode.key === 'card' || mode.key === 'line' ? (
                                <View style={styles.displayModePreviewSmall} />
                            ) : null}
                        </View>
                        <View style={styles.displayModeCopy}>
                            <Text
                                style={[
                                    styles.displayModeLabel,
                                    displayMode === mode.key ? styles.displayModeLabelActive : null,
                                ]}
                            >
                                {mode.label}
                            </Text>
                            <Text style={styles.displayModeTitle}>{mode.title}</Text>
                            <Text style={styles.displayModeDescription}>{mode.description}</Text>
                        </View>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.settingHint}>
                Mode Fokus menyembunyikan latin/terjemah. Mode Mushaf mengikuti pilihan Mode Hafalan.
            </Text>

            <Text style={styles.settingLabel}>Mode Hafalan</Text>
            <View style={styles.settingChips}>
                {MEMORIZATION_MODES.map((mode) => (
                    <Pressable
                        key={mode.key}
                        onPress={() => updateMemorizationMode(mode.key)}
                        style={[
                            styles.settingChip,
                            memorizationMode === mode.key ? styles.settingChipActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.settingChipText,
                                memorizationMode === mode.key
                                    ? styles.settingChipTextActive
                                    : null,
                            ]}
                        >
                            {mode.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                onPress={() => {
                    setSettingsVisible(false);
                    setTajweedVisible(true);
                }}
                style={styles.tajweedButton}
            >
                <Info color={colors.primary} size={16} strokeWidth={2.2} />
                <Text style={styles.tajweedButtonText}>Panduan Warna Tajwid</Text>
            </Pressable>
        </AppModalSheet>
    );

    const renderReferenceModal = () => {
        const { visible, type, ayah } = referenceModal;
        const key = ayah ? `${type}:${ayah.id}` : null;
        const state = key ? referenceState[key] : null;
        const title = type === 'tafsir' ? 'Tafsir' : 'Asbabun Nuzul';

        const items = state?.items ?? [];
        const kemenag = items.find((i) => i.title === 'Kemenag');
        const ibnuKatsir = items.find((i) => i.title === 'Ibnu Katsir');
        const hasBoth = !!kemenag && !!ibnuKatsir;

        const TAFSIR_MODES = [
            { key: 'all', label: 'Semua' },
            { key: 'side-by-side', label: 'Bandingkan' },
            { key: 'kemenag', label: 'Kemenag' },
            { key: 'mishbah', label: 'Al-Mishbah' },
        ];

        return (
            <AppModalSheet
                onClose={() => setReferenceModal((m) => ({ ...m, visible: false }))}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title={title}
                visible={visible}
            >
                {state?.loading ? (
                    <ActivityIndicator
                        color={colors.primary}
                        style={styles.modalLoader}
                    />
                ) : null}
                {state?.error ? (
                    <Text style={styles.referenceEmpty}>{state.error}</Text>
                ) : null}

                {!state?.loading && !state?.error && type === 'tafsir' && hasBoth && (
                    <View style={styles.tafsirModeRow}>
                        {TAFSIR_MODES.map((mode) => (
                            <Pressable
                                key={mode.key}
                                onPress={() => setTafsirMode(mode.key)}
                                style={[
                                    styles.tafsirModePill,
                                    tafsirMode === mode.key && styles.tafsirModePillActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tafsirModePillText,
                                        tafsirMode === mode.key && styles.tafsirModePillTextActive,
                                    ]}
                                >
                                    {mode.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {!state?.loading && !state?.error && type === 'tafsir' && tafsirMode === 'side-by-side' && hasBoth ? (
                    <View style={styles.sideBySideRow}>
                        <View style={[styles.sideBySideCol, styles.sideBySideColPrimary]}>
                            <Text style={styles.sideBySideColTitle}>Kemenag</Text>
                            <Text style={styles.referenceBody}>{kemenag.body}</Text>
                        </View>
                        <View style={[styles.sideBySideCol, styles.sideBySideColSecondary]}>
                            <Text style={styles.sideBySideColTitle}>Al-Mishbah</Text>
                            <Text style={styles.referenceBody}>{ibnuKatsir.body}</Text>
                        </View>
                    </View>
                ) : (
                    items
                        .filter((item) => {
                            if (type !== 'tafsir' || tafsirMode === 'all') return true;
                            if (tafsirMode === 'kemenag') return item.title === 'Kemenag';
                            if (tafsirMode === 'mishbah') return item.title === 'Ibnu Katsir';
                            return true;
                        })
                        .map((item) => (
                            <View key={item.id} style={styles.referenceItem}>
                                <Text style={styles.referenceTitle}>{item.title}</Text>
                                {item.meta ? (
                                    <Text style={styles.referenceMeta}>{item.meta}</Text>
                                ) : null}
                                <Text style={styles.referenceBody}>{item.body}</Text>
                            </View>
                        ))
                )}
            </AppModalSheet>
        );
    };

    const renderMunasabahModal = () => {
        const { visible, ayah, items, loading, error } = munasabahModal;

        return (
            <AppModalSheet
                onClose={() => setMunasabahModal((m) => ({ ...m, visible: false }))}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title="Ayat Terkait"
                visible={visible}
            >
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.modalLoader} />
                ) : null}
                {error && !loading ? (
                    <Text style={styles.referenceEmpty}>{error}</Text>
                ) : null}
                {items.map((item) => (
                    <Pressable
                        accessibilityLabel="Buka ayat terkait"
                        accessibilityRole="button"
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.08)', borderless: false }}
                        key={item.id}
                        onPress={() => openRelatedAyah(item)}
                        style={styles.referenceItem}
                    >
                        {item.ayahFrom && item.ayahTo ? (
                            <Text style={styles.referenceTitle}>
                                {item.ayahFrom.surahName} · Ayat {item.ayahFrom.number} → {item.ayahTo.surahName} · Ayat {item.ayahTo.number}
                            </Text>
                        ) : item.ayahTo ? (
                            <Text style={styles.referenceTitle}>
                                {item.ayahTo.surahName} · Ayat {item.ayahTo.number}
                            </Text>
                        ) : null}
                        <Text style={styles.referenceBody}>{item.description}</Text>
                        <Text style={styles.referenceMeta}>Ketuk untuk membuka ayat.</Text>
                    </Pressable>
                ))}
            </AppModalSheet>
        );
    };

    const renderHadithAyahModal = () => {
        const { visible, ayah, items, loading, error } = hadithAyahModal;

        return (
            <AppModalSheet
                onClose={() => setHadithAyahModal((m) => ({ ...m, visible: false }))}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title="Hadis Terkait"
                visible={visible}
            >
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.modalLoader} />
                ) : null}
                {error && !loading ? (
                    <Text style={styles.referenceEmpty}>{error}</Text>
                ) : null}
                {items.map((item) => (
                    <Pressable
                        accessibilityLabel="Buka hadis terkait"
                        accessibilityRole="button"
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.08)', borderless: false }}
                        disabled={!item.hadith?.id}
                        key={item.id}
                        onPress={() => openRelatedHadith(item)}
                        style={styles.referenceItem}
                    >
                        {item.hadith ? (
                            <Text style={styles.referenceTitle}>
                                {item.hadith.book || 'Hadis'} · {item.hadith.number || ''}
                            </Text>
                        ) : null}
                        <Text style={styles.referenceBody}>
                            {item.hadith?.translation || item.catatan || ''}
                        </Text>
                        {item.catatan ? (
                            <Text style={styles.referenceMeta}>{item.catatan}</Text>
                        ) : null}
                        {item.hadith?.id ? (
                            <Text style={styles.referenceMeta}>Ketuk untuk membuka detail hadis.</Text>
                        ) : null}
                    </Pressable>
                ))}
            </AppModalSheet>
        );
    };

    const renderAyahDetailScreen = () => {
        if (!selectedDetailAyah) return null;

        const isAudioLoading = audioState.loadingAyahId === selectedDetailAyah.id;
        const isAudioPlaying = audioState.playingAyahId === selectedDetailAyah.id;
        const isBookmarked = Boolean(bookmarks[selectedDetailAyah.id]);
        const noteOpen = activeNoteAyah === selectedDetailAyah.id;

        return (
            <>
                {renderSettingsModal()}
                {renderReaderMenuModal()}
                {renderReferenceModal()}
                {renderAyahActionSheet()}
                {renderTajweedModal()}
                {renderMunasabahModal()}
                {renderHadithAyahModal()}
                <Screen
                    actions={(
                        <IconActionButton
                            Icon={ArrowLeft}
                            label="Kembali"
                            onPress={closeAyahDetail}
                        />
                    )}
                    subtitle={`${selectedSurah?.name ?? "Al-Qur'an"} · Ayat ${selectedDetailAyah.number}`}
                    title="Detail Ayat"
                >
                    <Card style={styles.quranDetailCard}>
                        <Text style={styles.quranDetailKicker}>
                            {selectedSurah?.name ?? "Al-Qur'an"} · Ayat {selectedDetailAyah.number}
                        </Text>
                        {(selectedDetailAyah.arabic || selectedDetailAyah.arabicHtml) ? (
                            renderArabicContent(
                                selectedDetailAyah,
                                [styles.quranDetailArabic, getArabicTypography(2, 1.85)],
                                'detail-ayah',
                            )
                        ) : null}
                        {selectedDetailAyah.latin ? (
                            <Text style={styles.quranDetailLatin}>{selectedDetailAyah.latin}</Text>
                        ) : null}
                        {selectedDetailAyah.translation ? (
                            <View style={styles.quranDetailTranslationBox}>
                                <Text style={styles.quranDetailTranslation}>{selectedDetailAyah.translation}</Text>
                            </View>
                        ) : null}
                        {audioState.activeAyahId === selectedDetailAyah.id ? renderAudioSources(selectedDetailAyah) : null}
                    </Card>

                    <View style={styles.quranDetailActions}>
                        <ActionPill
                            Icon={isAudioPlaying ? Pause : Volume2}
                            active={isAudioPlaying}
                            disabled={isAudioLoading}
                            label={isAudioLoading ? 'Memuat audio' : isAudioPlaying ? 'Jeda audio' : 'Putar audio'}
                            onPress={() => playAyahAudio(selectedDetailAyah)}
                        />
                        <ActionPill
                            Icon={BookOpen}
                            label="Tafsir"
                            onPress={() => openReferenceModal(selectedDetailAyah, 'tafsir')}
                        />
                        <ActionPill
                            Icon={BookOpen}
                            label="Asbabun"
                            onPress={() => openReferenceModal(selectedDetailAyah, 'asbab')}
                        />
                        <ActionPill
                            Icon={Link}
                            label="Ayat Terkait"
                            onPress={() => openMunasabahModal(selectedDetailAyah)}
                        />
                        <ActionPill
                            Icon={BookOpen}
                            label="Hadis Terkait"
                            onPress={() => openHadithAyahModal(selectedDetailAyah)}
                        />
                        {user ? (
                            <>
                                <ActionPill
                                    Icon={isBookmarked ? BookmarkCheck : Bookmark}
                                    active={isBookmarked}
                                    disabled={savingAyah === `bookmark:${selectedDetailAyah.id}`}
                                    label={isBookmarked ? 'Hapus bookmark' : 'Bookmark'}
                                    onPress={() => toggleAyahBookmark(selectedDetailAyah)}
                                />
                                <ActionPill
                                    Icon={StickyNote}
                                    active={noteOpen}
                                    label="Catatan"
                                    onPress={() => setActiveNoteAyah(noteOpen ? null : selectedDetailAyah.id)}
                                />
                            </>
                        ) : null}
                    </View>

                    {noteOpen ? (
                        <Card style={styles.quranDetailNoteCard}>
                            <CardTitle meta="Pribadi">Catatan</CardTitle>
                            <NotesPanel refType="ayah" refId={selectedDetailAyah.id} />
                        </Card>
                    ) : null}
                </Screen>
            </>
        );
    };

    const renderAyahActionSheet = () => {
        const { visible, ayah } = ayahActionSheet;
        if (!ayah) return null;

        const isAudioLoading = audioState.loadingAyahId === ayah.id;
        const isAudioPlaying = audioState.playingAyahId === ayah.id;
        const isBookmarked = Boolean(bookmarks[ayah.id]);

        return (
            <AppActionSheet
                onClose={() => setAyahActionSheet({ visible: false, ayah: null })}
                subtitle={`${selectedSurah?.name} · Ayat ${ayah.number}`}
                title="Aksi Cepat"
                visible={visible}
            >
                <ActionSheetRow
                    Icon={BookOpen}
                    onPress={() => openAyahDetail(ayah)}
                    subtitle="Baca ayat, terjemahan, tafsir, dan catatan lebih luas"
                    title="Buka Detail"
                />
                <ActionSheetRow
                    Icon={isAudioPlaying ? Pause : Volume2}
                    active={isAudioPlaying}
                    disabled={isAudioLoading}
                    onPress={() => {
                        setAyahActionSheet({ visible: false, ayah: null });
                        playAyahAudio(ayah);
                    }}
                    subtitle="Murottal ayat ini"
                    title={isAudioLoading ? 'Memuat audio' : isAudioPlaying ? 'Jeda audio' : 'Putar audio'}
                />
                <ActionSheetRow
                    Icon={BookOpen}
                    onPress={() => {
                        setAyahActionSheet({ visible: false, ayah: null });
                        openReferenceModal(ayah, 'tafsir');
                    }}
                    subtitle="Buka penjelasan ayat"
                    title="Tafsir"
                />
                <ActionSheetRow
                    Icon={BookOpen}
                    onPress={() => {
                        setAyahActionSheet({ visible: false, ayah: null });
                        openReferenceModal(ayah, 'asbab');
                    }}
                    subtitle="Riwayat sebab turun jika tersedia"
                    title="Asbabun Nuzul"
                />
                {user ? (
                    <>
                        <ActionSheetRow
                            Icon={Save}
                            disabled={savingAyah === `progress:${ayah.id}`}
                            onPress={() => {
                                setAyahActionSheet({ visible: false, ayah: null });
                                markAyahProgress(ayah);
                            }}
                            subtitle="Jadikan ayat ini posisi terakhir baca"
                            title={savingAyah === `progress:${ayah.id}` ? 'Menyimpan progres' : 'Simpan progres'}
                        />
                        <ActionSheetRow
                            Icon={isBookmarked ? BookmarkCheck : Bookmark}
                            active={isBookmarked}
                            disabled={savingAyah === `bookmark:${ayah.id}`}
                            onPress={() => {
                                setAyahActionSheet({ visible: false, ayah: null });
                                toggleAyahBookmark(ayah);
                            }}
                            subtitle="Simpan ayat ke koleksi pribadi"
                            title={
                                savingAyah === `bookmark:${ayah.id}`
                                    ? 'Menyimpan bookmark'
                                    : isBookmarked
                                      ? 'Hapus bookmark'
                                      : 'Bookmark'
                            }
                        />
                        <ActionSheetRow
                            Icon={StickyNote}
                            active={activeNoteAyah === ayah.id}
                            onPress={() => {
                                setAyahActionSheet({ visible: false, ayah: null });
                                setActiveNoteAyah(activeNoteAyah === ayah.id ? null : ayah.id);
                            }}
                            subtitle="Tulis catatan pribadi untuk ayat ini"
                            title="Catatan"
                        />
                    </>
                ) : (
                    <Text style={styles.actionSheetNotice}>
                        Masuk dari Profil untuk menyimpan progres, bookmark, dan catatan.
                    </Text>
                )}
            </AppActionSheet>
        );
    };

    const renderAyahNotesModal = () => {
        const ayah = activeNoteAyah
            ? [...ayahs, ...mushafPageAyahs].find((item) => item.id === activeNoteAyah)
            : null;
        return (
            <AppModalSheet
                onClose={() => setActiveNoteAyah(null)}
                scroll={false}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title="Catatan Ayat"
                visible={Boolean(activeNoteAyah)}
            >
                {activeNoteAyah ? <NotesPanel refType="ayah" refId={activeNoteAyah} /> : null}
            </AppModalSheet>
        );
    };

    const renderTajweedModal = () => (
        <AppModalSheet
            onClose={() => setTajweedVisible(false)}
            title="Panduan Warna Tajwid"
            visible={tajweedVisible}
        >
            <Text style={styles.tajweedIntro}>
                Setiap hukum tajwid ditandai dengan warna berbeda. Ketuk grup untuk melihat
                sub-aturan dan contoh bacaannya.
            </Text>
            {TAJWEED_GROUPS.map((group) => (
                <View key={group.key} style={styles.tajweedGroup}>
                    <View style={styles.tajweedGroupHeader}>
                        <View
                            style={[
                                styles.tajweedDot,
                                { backgroundColor: group.color },
                            ]}
                        />
                        <Text style={styles.tajweedGroupTitle}>{group.title}</Text>
                    </View>
                    <Text style={styles.tajweedGroupDesc}>{group.description}</Text>
                    {group.rules.map((rule) => (
                        <View key={rule.key} style={styles.tajweedRule}>
                            <View style={styles.tajweedRuleLeft}>
                                <View
                                    style={[
                                        styles.tajweedRuleDot,
                                        { backgroundColor: rule.color },
                                    ]}
                                />
                                <View style={styles.tajweedRuleInfo}>
                                    <Text style={styles.tajweedRuleTitle}>{rule.title}</Text>
                                    <Text style={styles.tajweedRuleDesc}>
                                        {rule.description}
                                    </Text>
                                </View>
                            </View>
                            {rule.example ? (
                                <Text style={styles.tajweedRuleExample}>
                                    {rule.example}
                                </Text>
                            ) : null}
                        </View>
                    ))}
                </View>
            ))}
        </AppModalSheet>
    );

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
            audioState,
            bookmarks,
            displayMode,
            fontSize,
            memorizationMode,
            revealedAyahs,
            targetAyah,
        }),
        [
            arabicFont,
            audioRange,
            audioState,
            bookmarks,
            displayMode,
            fontSize,
            memorizationMode,
            revealedAyahs,
            targetAyah,
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

    const renderSurahRow = ({ item: surah }) => {
        const isProgressSurah = progressSurahNumber === Number(surah.number);
        return (
            <Pressable onPress={() => openSurah(surah)} style={styles.surahRow}>
                <View style={styles.surahLeft}>
                    <View style={styles.surahNumberWrap}>
                        <View style={styles.surahNumberDiamond}>
                            <Text style={styles.surahNumberText}>{surah.number}</Text>
                        </View>
                    </View>
                    <View style={styles.surahInfo}>
                        <View style={styles.surahNameRow}>
                            <Text style={styles.surahName}>{surah.name}</Text>
                            {isProgressSurah ? (
                                <CheckCircle2
                                    color={colors.primary}
                                    size={13}
                                    strokeWidth={2.2}
                                />
                            ) : null}
                        </View>
                        <Text style={styles.surahMeta}>
                            {surah.meaning} · {surah.ayahs} ayah
                        </Text>
                    </View>
                </View>
                <Text style={styles.surahArabic}>{surah.arabic}</Text>
            </Pressable>
        );
    };

    const renderQuranListHeader = () => (
        <>
            <Text style={styles.quranTitle}>Al-Qur'an</Text>
            <View style={styles.quranSearch}>
                <Search color={colors.muted} size={16} strokeWidth={2.1} />
                <TextInput
                    onChangeText={setSurahQuery}
                    placeholder="Cari..."
                    placeholderTextColor={colors.muted}
                    style={styles.quranSearchInput}
                    value={surahQuery}
                />
            </View>
            <View style={styles.quranTabs}>
                {QURAN_TABS.map((tab) => (
                    <Pressable
                        key={tab.key}
                        onPress={() => setQuranTab(tab.key)}
                        style={[
                            styles.quranTabButton,
                            quranTab === tab.key ? styles.quranTabButtonActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.quranTabText,
                                quranTab === tab.key ? styles.quranTabTextActive : null,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </>
    );

    const renderNavigatorPanel = () => (
        <Card>
            <CardTitle>Navigasi</CardTitle>
            <View style={styles.navigatorTabs}>
                {['page', 'hizb'].map((mode) => (
                    <Pressable
                        key={mode}
                        onPress={() => setNavigatorMode(mode)}
                        style={[
                            styles.navigatorTab,
                            navigatorMode === mode ? styles.navigatorTabActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.navigatorTabText,
                                navigatorMode === mode ? styles.navigatorTabTextActive : null,
                            ]}
                        >
                            {mode === 'page' ? 'Halaman' : 'Hizb'}
                        </Text>
                    </Pressable>
                ))}
            </View>
            {navigatorMode === 'hizb' ? (
                <View style={styles.inputRow}>
                    <TextInput
                        keyboardType="number-pad"
                        onChangeText={setHizbInput}
                        placeholder="1-240"
                        placeholderTextColor={colors.muted}
                        style={styles.numberInput}
                        value={hizbInput}
                    />
                    <Pressable onPress={() => openHizb()} style={styles.compactPrimaryButton}>
                        <Text style={styles.primaryButtonText}>Buka Hizb</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.inputRow}>
                    <TextInput
                        keyboardType="number-pad"
                        onChangeText={setPageInput}
                        placeholder="1-604"
                        placeholderTextColor={colors.muted}
                        style={styles.numberInput}
                        value={pageInput}
                    />
                    <Pressable onPress={() => openPage()} style={styles.compactPrimaryButton}>
                        <Text style={styles.primaryButtonText}>Buka Halaman</Text>
                    </Pressable>
                </View>
            )}
        </Card>
    );

    const renderQuranListFooter = () => {
        if (quranTab === 'surah') {
            return (
                <>
                    {renderNavigatorPanel()}
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                </>
            );
        }

        if (quranTab === 'hafalan') {
            if (!user) {
                return (
                    <Card>
                        <CardTitle>Hafalan</CardTitle>
                        <Text style={styles.modePanelText}>
                            Buka Profil untuk masuk dan melacak progress hafalan.
                        </Text>
                    </Card>
                );
            }

            const statusLabel = { not_started: 'Belum', in_progress: 'Sedang', memorized: 'Hafal' };
            const statusStyle = {
                not_started: null,
                in_progress: styles.statusInProgress,
                memorized: styles.statusMemorized,
            };

            return (
                <>
                    <Card>
                        <CardTitle>Hafalan</CardTitle>
                        {hafalanSummary ? (
                            <View style={styles.hafalanSummary}>
                                <View style={styles.hafalanStat}>
                                    <Text style={styles.hafalanStatValue}>
                                        {hafalanSummary.memorized ?? 0}
                                    </Text>
                                    <Text style={styles.hafalanStatLabel}>Hafal</Text>
                                </View>
                                <View style={styles.hafalanStat}>
                                    <Text style={styles.hafalanStatValue}>
                                        {hafalanSummary.in_progress ?? 0}
                                    </Text>
                                    <Text style={styles.hafalanStatLabel}>Sedang</Text>
                                </View>
                                <View style={styles.hafalanStat}>
                                    <Text style={styles.hafalanStatValue}>
                                        {hafalanSummary.not_started ??
                                            hafalanSummary.not_memorized ??
                                            0}
                                    </Text>
                                    <Text style={styles.hafalanStatLabel}>Belum</Text>
                                </View>
                            </View>
                        ) : null}
                        <Text style={styles.modePanelText}>
                            Ketuk status di bawah untuk mengubah: Belum → Sedang → Hafal.
                        </Text>
                        {hafalanLoading ? (
                            <ActivityIndicator color={colors.primary} style={styles.loader} />
                        ) : null}
                        {!hafalanLoading && surahs.length === 0 ? (
                            <Text style={styles.modePanelMeta}>Daftar surah belum dimuat.</Text>
                        ) : null}
                    </Card>
                    {surahs.map((surah) => {
                        const entry = hafalanList.find(
                            (item) => Number(item.surah_id) === Number(surah.number),
                        );
                        const status = entry?.status ?? 'not_started';
                        return (
                            <Pressable
                                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                                key={`hafalan-${surah.number}`}
                                onPress={() => cycleHafalanStatus(surah)}
                                style={styles.hafalanRow}
                            >
                                <View style={styles.surahNumberWrap}>
                                    <View style={styles.surahNumberDiamond}>
                                        <Text style={styles.surahNumberText}>{surah.number}</Text>
                                    </View>
                                </View>
                                <View style={styles.hafalanInfo}>
                                    <Text style={styles.surahName}>{surah.name}</Text>
                                    <Text style={styles.surahMeta}>{surah.ayahs} ayah</Text>
                                </View>
                                <View style={[styles.statusBadge, statusStyle[status]]}>
                                    <Text
                                        style={[
                                            styles.statusText,
                                            statusStyle[status] ? styles.statusTextColored : null,
                                        ]}
                                    >
                                        {statusLabel[status] ?? 'Belum'}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </>
            );
        }

        if (!user) {
            return (
                <Card>
                    <CardTitle>Murojaah</CardTitle>
                    <Text style={styles.modePanelText}>
                        Buka Profil untuk masuk dan mencatat sesi murojaah.
                    </Text>
                </Card>
            );
        }

        const memorizedSurahs = surahs.filter((surah) => {
            const entry = hafalanList.find(
                (item) => Number(item.surah_id) === Number(surah.number),
            );
            return entry?.status === 'memorized';
        });

        return (
            <>
                <Card>
                    <CardTitle>Murojaah</CardTitle>
                    <Text style={styles.modePanelText}>
                        Pilih surah yang sudah hafal, lalu catat sesi murojaah dengan skor dan
                        catatan.
                    </Text>
                    {murojaahLoading ? (
                        <ActivityIndicator color={colors.primary} style={styles.loader} />
                    ) : null}
                    {!murojaahLoading && memorizedSurahs.length === 0 ? (
                        <Text style={styles.modePanelMeta}>
                            Belum ada surah yang ditandai Hafal. Tandai status di tab Hafalan
                            terlebih dahulu.
                        </Text>
                    ) : null}
                    {memorizedSurahs.length > 0 ? (
                        <>
                            <Text style={styles.modePanelMeta}>Pilih surah untuk dimurojaah:</Text>
                            <View style={styles.murojaahSurahGrid}>
                                {memorizedSurahs.map((surah) => (
                                    <Pressable
                                        android_ripple={{
                                            color: 'rgba(91, 110, 91, 0.12)',
                                            borderless: false,
                                        }}
                                        key={`murojaah-pick-${surah.number}`}
                                        onPress={() =>
                                            setMurojaahForm((prev) => ({
                                                ...prev,
                                                surahId: surah.number,
                                            }))
                                        }
                                        style={[
                                            styles.murojaahChip,
                                            murojaahForm.surahId === surah.number
                                                ? styles.murojaahChipActive
                                                : null,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.murojaahChipText,
                                                murojaahForm.surahId === surah.number
                                                    ? styles.murojaahChipTextActive
                                                    : null,
                                            ]}
                                        >
                                            {surah.number}. {surah.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <Text style={[styles.modePanelMeta, styles.labelGap]}>Skor (0–100):</Text>
                            <View style={styles.scoreRow}>
                                {[60, 70, 80, 90, 100].map((score) => (
                                    <Pressable
                                        android_ripple={{
                                            color: 'rgba(91, 110, 91, 0.12)',
                                            borderless: false,
                                        }}
                                        key={`score-${score}`}
                                        onPress={() =>
                                            setMurojaahForm((prev) => ({ ...prev, score }))
                                        }
                                        style={[
                                            styles.murojaahChip,
                                            murojaahForm.score === score
                                                ? styles.murojaahChipActive
                                                : null,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.murojaahChipText,
                                                murojaahForm.score === score
                                                    ? styles.murojaahChipTextActive
                                                    : null,
                                            ]}
                                        >
                                            {score}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <Text style={[styles.modePanelMeta, styles.labelGap]}>
                                Catatan (opsional):
                            </Text>
                            <TextInput
                                multiline
                                onChangeText={(note) =>
                                    setMurojaahForm((prev) => ({ ...prev, note }))
                                }
                                placeholder="Bagian yang perlu diperkuat, dll."
                                placeholderTextColor={colors.muted}
                                style={styles.murojaahNoteInput}
                                value={murojaahForm.note}
                            />
                            <Pressable
                                android_ripple={{
                                    color: 'rgba(255, 255, 255, 0.12)',
                                    borderless: false,
                                }}
                                disabled={savingMurojaah || !murojaahForm.surahId}
                                onPress={submitMurojaah}
                                style={[
                                    styles.modePanelAction,
                                    savingMurojaah || !murojaahForm.surahId
                                        ? styles.disabled
                                        : null,
                                ]}
                            >
                                {savingMurojaah ? (
                                    <ActivityIndicator color={colors.onPrimary} size="small" />
                                ) : (
                                    <Text style={styles.modePanelActionText}>
                                        Simpan Sesi Murojaah
                                    </Text>
                                )}
                            </Pressable>
                        </>
                    ) : null}
                    {murojaahMessage ? (
                        <Text style={styles.message}>{murojaahMessage}</Text>
                    ) : null}
                </Card>
            </>
        );
    };

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
                                tintColor={colors.primary}
                            />
                        }
                        scrollEventThrottle={250}
                        showsVerticalScrollIndicator={false}
                        style={[styles.readerList, isWebAppLayout ? styles.webAppReaderList : null]}
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
                            tintColor={colors.primary}
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
                    style={[styles.readerList, isWebAppLayout ? styles.webAppReaderList : null]}
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
                    tintColor={colors.primary}
                />
            }
            renderItem={renderSurahRow}
            scrollEventThrottle={250}
            showsVerticalScrollIndicator={false}
            style={[styles.quranScroll, isWebAppLayout ? styles.webAppQuranScroll : null]}
            testID={isWebAppLayout ? 'quran-web-app-list' : 'quran-classic-list'}
        />
    );
}

const styles = StyleSheet.create({
    quranScroll: {
        backgroundColor: colors.bg,
        flex: 1,
    },
    webAppQuranScroll: {
        backgroundColor: '#f8fafc',
    },
    quranListContent: {
        backgroundColor: colors.bg,
        flexGrow: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        paddingTop: spacing.xl,
    },
    webAppQuranListContent: {
        backgroundColor: '#f8fafc',
        paddingBottom: spacing.lg,
        paddingTop: spacing.lg,
    },
    readerList: {
        backgroundColor: colors.bg,
        flex: 1,
    },
    webAppReaderList: {
        backgroundColor: '#f8fafc',
    },
    readerListContent: {
        backgroundColor: colors.bg,
        flexGrow: 1,
        gap: spacing.md,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    webAppReaderListContent: {
        backgroundColor: '#f8fafc',
        paddingBottom: spacing.lg,
        paddingTop: spacing.lg,
    },
    mushafScrollContent: {
        backgroundColor: colors.bg,
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    webAppMushafScrollContent: {
        backgroundColor: '#f8fafc',
        paddingBottom: spacing.lg,
        paddingTop: spacing.lg,
    },
    mushafListContent: {
        gap: 0,
        paddingHorizontal: spacing.md,
    },
    mushafGestureSurface: {
        minHeight: '100%',
    },
    readerHeader: {
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        marginBottom: spacing.sm,
        paddingBottom: spacing.md,
        paddingTop: spacing.md,
    },
    readerHeaderSerious: {
        marginBottom: spacing.xs,
        paddingBottom: spacing.sm,
    },
    readerHeaderTop: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: spacing.md,
        justifyContent: 'space-between',
    },
    readerHeaderCopy: {
        flex: 1,
    },
    readerHeaderActions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    surahPagerRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    surahPagerButton: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: spacing.xs,
        justifyContent: 'center',
        minHeight: 34,
        paddingHorizontal: spacing.sm,
    },
    surahPagerButtonText: {
        color: colors.primaryDark,
        flexShrink: 1,
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 16,
        textAlign: 'center',
    },
    readerTitle: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 20,
        fontWeight: '900',
    },
    readerSubtitle: {
        color: colors.muted,
        fontSize: 14,
        lineHeight: 20,
        marginTop: spacing.sm,
    },
    readerLoadingMore: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        paddingVertical: spacing.lg,
    },
    readerLoadingMoreText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '800',
    },
    quranTitle: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: spacing.sm,
    },
    quranSearch: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        minHeight: 34,
        paddingHorizontal: spacing.md,
    },
    quranSearchInput: {
        color: colors.ink,
        flex: 1,
        fontSize: 13,
        minHeight: 32,
        padding: 0,
    },
    quranTabs: {
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 4,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
        padding: 4,
    },
    quranTabButton: {
        alignItems: 'center',
        borderRadius: radius.sm,
        flex: 1,
        justifyContent: 'center',
        minHeight: 32,
    },
    quranTabButtonActive: {
        backgroundColor: colors.primary,
    },
    quranTabText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '900',
        textAlign: 'center',
    },
    quranTabTextActive: {
        color: colors.onPrimary,
    },
    surahRow: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        minHeight: 58,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    surahLeft: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        minWidth: 0,
    },
    surahNumberWrap: {
        height: 38,
        justifyContent: 'center',
        marginRight: spacing.md,
        width: 38,
    },
    surahNumberDiamond: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: 6,
        borderWidth: 1,
        height: 34,
        justifyContent: 'center',
        transform: [{ rotate: '45deg' }],
        width: 34,
    },
    surahNumberText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
        transform: [{ rotate: '-45deg' }],
    },
    surahInfo: {
        flex: 1,
        minWidth: 0,
    },
    surahNameRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.xs,
    },
    surahName: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 14,
        fontWeight: '900',
    },
    surahMeta: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2,
    },
    surahArabic: {
        color: colors.ink,
        fontFamily: QURAN_FONT_FAMILIES.kitab,
        fontSize: 19,
        fontWeight: '400',
        lineHeight: 28,
        marginLeft: spacing.sm,
        maxWidth: '38%',
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    modePanelText: {
        color: colors.text,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    modePanelMeta: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '800',
    },
    modePanelAction: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        justifyContent: 'center',
        minHeight: 42,
        paddingHorizontal: spacing.md,
    },
    modePanelActionText: {
        color: colors.onPrimary,
        fontSize: 13,
        fontWeight: '900',
    },
    message: {
        color: colors.primary,
        fontSize: 12,
        marginTop: spacing.sm,
    },
    targetPreview: {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
        borderRadius: radius.lg,
        borderWidth: 2,
        marginTop: spacing.md,
        padding: spacing.lg,
    },
    targetPreviewKicker: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '900',
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    targetPreviewTitle: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: spacing.xs,
    },
    targetPreviewText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
    },
    targetPreviewButton: {
        alignItems: 'center',
        borderColor: colors.primary,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: 'center',
        marginTop: spacing.md,
        minHeight: 38,
    },
    targetPreviewButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
    },
    navigatorTabs: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    navigatorTab: {
        alignItems: 'center',
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 32,
    },
    navigatorTabActive: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    navigatorTabText: {
        color: colors.text,
        fontSize: 11,
        fontWeight: '800',
    },
    navigatorTabTextActive: {
        color: colors.primaryDark,
    },
    inputRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    numberInput: {
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.ink,
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        minHeight: 42,
        paddingHorizontal: spacing.md,
    },
    loader: {
        marginVertical: spacing.md,
    },
    focusAyahCard: {
        paddingBottom: spacing.lg,
    },
    focusAyahRow: {
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        paddingBottom: spacing.lg,
        paddingTop: spacing.md,
    },
    focusAyahHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    focusAyahNumber: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: 999,
        borderWidth: 1,
        height: 28,
        justifyContent: 'center',
        width: 28,
    },
    focusAyahNumberText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '900',
    },
    focusAyahMenuButton: {
        alignItems: 'center',
        borderRadius: radius.sm,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
    targetAyahCard: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    ayahHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    ayahHeaderCopy: {
        flex: 1,
        minWidth: 0,
    },
    ayahHeaderTitle: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 16,
        fontWeight: '900',
    },
    ayahHeaderMeta: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
        marginTop: 2,
    },
    ayahMenuButton: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 34,
        justifyContent: 'center',
        marginLeft: spacing.sm,
        width: 34,
    },
    lineAyahRow: {
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        paddingBottom: spacing.md,
        paddingTop: spacing.md,
    },
    lineAyahHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    lineAyahNumber: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: 999,
        borderWidth: 1,
        height: 28,
        justifyContent: 'center',
        width: 28,
    },
    lineAyahNumberText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '900',
    },
    lineAyahMeta: {
        color: colors.muted,
        flex: 1,
        fontSize: 12,
        fontWeight: '800',
        minWidth: 0,
    },
    lineAyahMenuButton: {
        alignItems: 'center',
        borderRadius: radius.sm,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
    inlineArabicRow: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    inlineArabicText: {
        flex: 1,
        minWidth: 0,
    },
    inlineAyahMenuButton: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 34,
        justifyContent: 'center',
        marginTop: 4,
        width: 34,
    },
    ayahArabic: {
        color: colors.ink,
        fontWeight: '800',
        lineHeight: 48,
        marginBottom: 0,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    lineArabic: {
        color: colors.ink,
        fontWeight: '800',
        lineHeight: 46,
        marginBottom: spacing.sm,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    inlineAyahMarker: {
        color: '#6f6a58',
        fontFamily: QURAN_FONT_FAMILIES.kitab,
        fontSize: 24,
        fontWeight: '400',
        lineHeight: 34,
    },
    mushafPagesStack: {
        gap: spacing.lg,
    },
    mushafPageShell: {
        backgroundColor: '#f4ecd6',
        borderColor: '#c8a955',
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.sm,
    },
    mushafFrameOuter: {
        backgroundColor: '#f8efd4',
        borderColor: '#1f8f7a',
        borderRadius: radius.md,
        borderWidth: 2,
        padding: 4,
    },
    mushafFrame: {
        backgroundColor: '#fdf7e3',
        borderColor: '#c8a955',
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    mushafFrameTop: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    mushafFrameJuzBadge: {
        backgroundColor: '#fffdf2',
        borderColor: '#c8a955',
        borderRadius: 999,
        borderWidth: 1,
        flex: 1,
        marginRight: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
    },
    mushafFrameJuzText: {
        color: '#1f8f7a',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.6,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    mushafFramePageBadge: {
        alignItems: 'center',
        backgroundColor: '#1f8f7a',
        borderColor: '#c8a955',
        borderRadius: 999,
        borderWidth: 1,
        height: 30,
        justifyContent: 'center',
        minWidth: 50,
        paddingHorizontal: spacing.sm,
    },
    mushafFramePageText: {
        color: '#fffdf2',
        fontSize: 13,
        fontWeight: '900',
    },
    mushafFrameSurahBadge: {
        backgroundColor: '#fffdf2',
        borderColor: '#c8a955',
        borderRadius: 999,
        borderWidth: 1,
        flex: 1.4,
        marginLeft: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
    },
    mushafFrameSurahText: {
        color: '#1f8f7a',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.4,
        textAlign: 'center',
    },
    mushafFrameBottom: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
        paddingTop: spacing.sm,
    },
    mushafFootPageBadge: {
        alignItems: 'center',
        backgroundColor: '#fffdf2',
        borderColor: '#c8a955',
        borderRadius: 999,
        borderWidth: 1,
        justifyContent: 'center',
        minWidth: 32,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
    },
    mushafFootPageText: {
        color: '#1f8f7a',
        fontSize: 11,
        fontWeight: '900',
    },
    mushafPerKataStack: {
        gap: spacing.md,
        paddingTop: spacing.sm,
    },
    mushafPerKataAyah: {
        borderRadius: radius.sm,
        paddingVertical: spacing.xs,
    },
    mushafPerKataAyahTarget: {
        backgroundColor: '#e9f7ef',
    },
    mushafPerKataRow: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginHorizontal: -2,
    },
    mushafWordCell: {
        alignItems: 'center',
        marginBottom: 6,
        marginHorizontal: 2,
        minWidth: 56,
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    mushafWordArabic: {
        color: colors.ink,
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 32,
        marginBottom: 2,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    mushafWordLatin: {
        color: '#5b6e5b',
        fontSize: 9,
        fontStyle: 'italic',
        lineHeight: 11,
        marginBottom: 1,
        textAlign: 'center',
    },
    mushafWordIndo: {
        color: '#b91c1c',
        fontSize: 9,
        fontWeight: '700',
        lineHeight: 11,
        textAlign: 'center',
    },
    mushafVerseEndCell: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 2,
        paddingTop: 4,
    },
    mushafVerseEndCircle: {
        alignItems: 'center',
        backgroundColor: '#fffdf2',
        borderColor: '#1f8f7a',
        borderRadius: 999,
        borderWidth: 1.5,
        height: 28,
        justifyContent: 'center',
        width: 28,
    },
    mushafVerseEndText: {
        color: '#1f8f7a',
        fontSize: 12,
        fontWeight: '900',
    },
    mushafPerKataFullTranslation: {
        color: colors.text,
        fontSize: 11,
        fontStyle: 'italic',
        lineHeight: 16,
        marginTop: 4,
        paddingHorizontal: 4,
        textAlign: 'left',
    },
    mushafBismillah: {
        color: colors.ink,
        fontSize: 30,
        fontWeight: '900',
        lineHeight: 52,
        marginBottom: spacing.md,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    mushafContinuousArabic: {
        color: colors.ink,
        fontWeight: '800',
        lineHeight: 64,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    mushafPageArabic: {
        color: colors.ink,
        includeFontPadding: false,
        marginBottom: 2,
        textAlign: 'right',
        textAlignVertical: 'top',
        writingDirection: 'rtl',
    },
    mushafAyahBlockStack: {
        borderTopColor: '#d9cfae',
        borderTopWidth: 1,
        marginTop: spacing.sm,
    },
    mushafAyahBlockLine: {
        borderBottomColor: '#d9cfae',
        borderBottomWidth: 1,
        paddingBottom: 8,
        paddingTop: 8,
    },
    mushafInlineTarget: {
        backgroundColor: '#e9f7ef',
        color: colors.primaryDark,
    },
    mushafPageTranslation: {
        color: colors.text,
        flex: 0,
        fontSize: 9,
        lineHeight: 12,
        marginTop: 0,
        textAlign: 'right',
    },
    mushafInlineLoading: {
        alignItems: 'center',
        paddingTop: spacing.sm,
    },
    mushafVerseMark: {
        color: '#7f6f44',
        fontSize: 15,
        fontWeight: '900',
    },
    mushafRangeMeta: {
        color: colors.muted,
        fontSize: 11,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    mushafAyahBlock: {
        backgroundColor: '#fffdf2',
        borderColor: '#d8c897',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
    },
    mushafArabic: {
        color: colors.ink,
        fontWeight: '800',
        lineHeight: 52,
        marginBottom: spacing.sm,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    mushafAyahNumber: {
        alignSelf: 'center',
        backgroundColor: colors.surface,
        borderColor: '#c9b675',
        borderRadius: 999,
        borderWidth: 1,
        color: colors.primaryDark,
        fontSize: 12,
        fontWeight: '900',
        marginBottom: spacing.md,
        minWidth: 28,
        overflow: 'hidden',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        textAlign: 'center',
    },
    ayahLatin: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    ayahTranslation: {
        color: colors.text,
        fontSize: 14,
        lineHeight: 22,
    },
    ayahReadMore: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
        marginTop: spacing.sm,
        textAlign: 'right',
    },
    quranDetailCard: {
        padding: spacing.lg,
    },
    quranDetailKicker: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
        marginBottom: spacing.md,
    },
    quranDetailArabic: {
        color: colors.ink,
        fontWeight: '800',
        lineHeight: 54,
        marginBottom: spacing.md,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    quranDetailLatin: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 21,
        marginBottom: spacing.md,
    },
    quranDetailTranslationBox: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.md,
    },
    quranDetailTranslation: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 24,
    },
    quranDetailActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    quranDetailNoteCard: {
        marginTop: spacing.sm,
    },
    hiddenBlock: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    hiddenTitle: {
        color: colors.primaryDark,
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'center',
    },
    revealButton: {
        alignItems: 'center',
        borderColor: colors.primary,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: 'center',
        marginTop: spacing.sm,
        minHeight: 38,
    },
    revealButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
    },
    referenceItem: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        marginTop: spacing.sm,
        padding: spacing.md,
    },
    referenceTitle: {
        color: colors.ink,
        fontSize: 14,
        fontWeight: '900',
        marginBottom: spacing.xs,
    },
    referenceMeta: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '800',
        marginBottom: spacing.xs,
    },
    referenceBody: {
        color: colors.text,
        fontSize: 13,
        lineHeight: 20,
    },
    referenceEmpty: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.sm,
    },
    tafsirModeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    tafsirModePill: {
        borderColor: colors.faint,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    tafsirModePillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tafsirModePillText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '600',
    },
    tafsirModePillTextActive: {
        color: '#fff',
    },
    sideBySideRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    sideBySideCol: {
        borderRadius: radius.md,
        flex: 1,
        padding: spacing.md,
    },
    sideBySideColPrimary: {
        backgroundColor: '#f0fdf4',
    },
    sideBySideColSecondary: {
        backgroundColor: '#f0f9ff',
    },
    sideBySideColTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: '900',
        marginBottom: spacing.sm,
    },
    qariGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    qariButton: {
        alignItems: 'center',
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 34,
        paddingHorizontal: spacing.md,
    },
    qariButtonActive: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    qariText: {
        color: colors.text,
        fontSize: 11,
        fontWeight: '800',
    },
    qariTextActive: {
        color: colors.primaryDark,
    },
    audioPanel: {
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.sm,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    audioPanelHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'space-between',
    },
    audioPanelTitleRow: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        minWidth: 0,
    },
    audioPanelTitleCopy: {
        flex: 1,
        minWidth: 0,
    },
    audioPanelTitle: {
        color: colors.ink,
        fontSize: 14,
        fontWeight: '900',
    },
    audioPanelMeta: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '800',
        marginTop: 2,
    },
    audioPrimaryButton: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
        flexDirection: 'row',
        gap: spacing.xs,
        justifyContent: 'center',
        minHeight: 36,
        paddingHorizontal: spacing.md,
    },
    audioPrimaryButtonText: {
        color: colors.onPrimary,
        fontSize: 12,
        fontWeight: '900',
    },
    audioInputGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    audioInputGroup: {
        flex: 1,
        minWidth: 0,
    },
    audioInputLabel: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    audioInput: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        color: colors.ink,
        fontSize: 13,
        fontWeight: '900',
        minHeight: 38,
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
        textAlign: 'center',
    },
    audioSectionLabel: {
        color: colors.primaryDark,
        fontSize: 11,
        fontWeight: '900',
        marginTop: spacing.xs,
        textTransform: 'uppercase',
    },
    audioChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    audioChip: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 32,
        paddingHorizontal: spacing.sm,
    },
    audioChipActive: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    audioChipText: {
        color: colors.text,
        fontSize: 11,
        fontWeight: '800',
    },
    audioChipTextActive: {
        color: colors.primaryDark,
    },
    audioControlRow: {
        alignItems: 'flex-end',
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'space-between',
    },
    audioControlGroup: {
        flex: 1,
        minWidth: 0,
    },
    audioRepeatButton: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 32,
        paddingHorizontal: spacing.md,
    },
    audioRepeatButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    audioRepeatText: {
        color: colors.text,
        fontSize: 11,
        fontWeight: '900',
    },
    audioRepeatTextActive: {
        color: colors.onPrimary,
    },
    audioStatusText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 17,
    },
    hafalanSummary: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    hafalanStat: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        paddingVertical: spacing.sm,
    },
    hafalanStatValue: {
        color: colors.primaryDark,
        fontFamily: 'serif',
        fontSize: 20,
        fontWeight: '900',
    },
    hafalanStatLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    hafalanRow: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.sm,
        minHeight: 52,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    hafalanInfo: {
        flex: 1,
    },
    statusBadge: {
        alignItems: 'center',
        borderColor: colors.faint,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 28,
        paddingHorizontal: spacing.sm,
    },
    statusInProgress: {
        backgroundColor: '#fffbeb',
        borderColor: '#fde68a',
    },
    statusMemorized: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
    },
    statusText: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '900',
    },
    statusTextColored: {
        color: colors.ink,
    },
    murojaahSurahGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    murojaahChip: {
        alignItems: 'center',
        borderColor: colors.faint,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    murojaahChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    murojaahChipText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '800',
    },
    murojaahChipTextActive: {
        color: '#ffffff',
    },
    scoreRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    murojaahNoteInput: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: 8,
        borderWidth: 1,
        color: colors.ink,
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.sm,
        minHeight: 72,
        padding: spacing.md,
        textAlignVertical: 'top',
    },
    labelGap: {
        marginTop: spacing.md,
    },
    disabled: {
        opacity: 0.55,
    },
    compactPrimaryButton: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        justifyContent: 'center',
        minHeight: 42,
        paddingHorizontal: spacing.md,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '900',
    },
    modalLoader: {
        marginVertical: spacing.lg,
    },
    actionSheetNotice: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.sm,
    },
    // Settings modal
    settingLabel: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: '900',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    settingHint: {
        color: colors.muted,
        fontSize: 11,
        lineHeight: 16,
        marginTop: 4,
    },
    displayModeStack: {
        gap: spacing.sm,
    },
    displayModeCard: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
    },
    displayModeCardActive: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    displayModePreview: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 54,
        justifyContent: 'center',
        width: 46,
    },
    displayModePreviewTop: {
        backgroundColor: colors.primary,
        borderRadius: 2,
        height: 4,
        marginBottom: 7,
        width: 22,
    },
    displayModePreviewLine: {
        backgroundColor: colors.ink,
        borderRadius: 2,
        height: 5,
        marginBottom: 6,
        width: 28,
    },
    displayModePreviewLineFull: {
        height: 6,
        width: 34,
    },
    displayModePreviewSmall: {
        backgroundColor: colors.muted,
        borderRadius: 2,
        height: 3,
        width: 24,
    },
    displayModeCopy: {
        flex: 1,
        minWidth: 0,
    },
    displayModeLabel: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    displayModeLabelActive: {
        color: colors.primaryDark,
    },
    displayModeTitle: {
        color: colors.ink,
        fontSize: 14,
        fontWeight: '900',
        marginTop: 2,
    },
    displayModeDescription: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    settingChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    settingChip: {
        alignItems: 'center',
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 34,
        paddingHorizontal: spacing.md,
    },
    settingChipActive: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    settingChipText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '800',
    },
    settingChipTextActive: {
        color: colors.primaryDark,
    },
    fontSizeRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.md,
    },
    fontSizeButton: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },
    fontSizeValue: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '800',
        minWidth: 44,
        textAlign: 'center',
    },
    tajweedButton: {
        alignItems: 'center',
        borderColor: colors.primary,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        marginTop: spacing.lg,
        minHeight: 42,
    },
    tajweedButtonText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '900',
    },
    // Tajweed modal
    tajweedIntro: {
        color: colors.text,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    tajweedGroup: {
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    tajweedGroupHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    tajweedDot: {
        borderRadius: 6,
        height: 12,
        width: 12,
    },
    tajweedGroupTitle: {
        color: colors.ink,
        fontSize: 15,
        fontWeight: '900',
    },
    tajweedGroupDesc: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginBottom: spacing.sm,
        paddingLeft: 20,
    },
    tajweedRule: {
        alignItems: 'flex-start',
        borderTopColor: colors.faint,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: spacing.sm,
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    tajweedRuleLeft: {
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'row',
        gap: spacing.sm,
    },
    tajweedRuleDot: {
        borderRadius: 5,
        height: 10,
        marginTop: 3,
        width: 10,
    },
    tajweedRuleInfo: {
        flex: 1,
    },
    tajweedRuleTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: '900',
    },
    tajweedRuleDesc: {
        color: colors.muted,
        fontSize: 11,
        lineHeight: 16,
        marginTop: 2,
    },
    tajweedRuleExample: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
