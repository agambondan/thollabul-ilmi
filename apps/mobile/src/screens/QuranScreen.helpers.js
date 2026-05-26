import { QURAN_FONT_FAMILIES } from '../constants/quranFonts';

export const MEMORIZATION_MODES = [
    { key: 'off', label: 'Normal' },
    { key: 'hide_arabic', label: 'Sembunyikan Arab' },
    { key: 'hide_translation', label: 'Sembunyikan Terjemah' },
    { key: 'hide_all', label: 'Latihan Penuh' },
];

export const DISPLAY_MODES = [
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

export const ARABIC_FONTS = [
    { key: 'kitab', label: 'Uthmani', fontFamily: QURAN_FONT_FAMILIES.kitab },
    { key: 'indopak', label: 'Indopak', fontFamily: QURAN_FONT_FAMILIES.indopak },
    { key: 'naskh', label: 'Naskh', fontFamily: QURAN_FONT_FAMILIES.naskh },
];

export const QURAN_TABS = [
    { key: 'surah', label: 'Surah' },
    { key: 'hafalan', label: 'Hafalan' },
    { key: 'murojaah', label: 'Murojaah' },
];

export const QARI_PRESETS = [
    { qari_name: 'Mishary Rashid Al-Afasy', qari_slug: 'mishary-rashid-alafasy' },
    { qari_name: 'Mishary Alafasy (Legacy)', qari_slug: 'Alafasy_64kbps' },
    { qari_name: 'Abdul Rahman Al-Sudais', qari_slug: 'abdul-rahman-al-sudais' },
];

export const AUDIO_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export const SWIPE_TRIGGER_DISTANCE = 34;
export const SWIPE_EDGE_GUARD = 48;
export const WEB_APP_QURAN_BG = '#020617';
export const WEB_APP_QURAN_SURFACE = '#1e293b';
export const WEB_APP_QURAN_BORDER = '#334155';
export const WEB_APP_QURAN_MUTED = '#94a3b8';
export const WEB_APP_QURAN_ACCENT = '#34d399';
export const WEB_APP_QURAN_ACCENT_BG = '#0f2f2f';
export const SURAH_PREFIX_PATTERN = /^\s*(سُورَةُ|سُورَة|سورة)\s+/u;
export const SURAH_PAGE_SIZE = 20;
export const SURAH_TARGET_PREFETCH_RADIUS = 1;
export const SURAH_PREFETCH_DISTANCE = 620;
export const MUSHAF_FIRST_PAGE = 1;
export const MUSHAF_LAST_PAGE = 604;
export const MIN_ARABIC_FONT_SIZE = 14;
export const MAX_ARABIC_FONT_SIZE = 48;
export const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
export const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const TAJWEED_TEXT_COLORS = {
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

export const toArabicDigits = (value) =>
    String(value ?? '').replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] ?? digit);

export const formatInlineAyahMarker = (value) => `۝${toArabicDigits(value)}`;

export const decodeArabicHtml = (value = '') =>
    String(value)
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)));

export const stripHtmlTags = (value = '') => decodeArabicHtml(value.replace(/<[^>]+>/g, ''));
export const stripArabicDiacritics = (value = '') =>
    String(value).replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');

export const parseTajweedHtml = (html = '') => {
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

export const getTajweedTextColor = (className) => {
    if (!className) return null;
    return String(className)
        .split(/\s+/)
        .map((name) => TAJWEED_TEXT_COLORS[name])
        .find(Boolean) ?? null;
};

export const clampAudioSpeed = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.max(0.5, Math.min(2, numeric));
};

export const toPositiveInt = (value) => {
    const numeric = Number.parseInt(`${value ?? ''}`, 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const normalizeAudioSources = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.ayah_audio)) return result.ayah_audio;
    if (result?.ayah_audio) return [result.ayah_audio];
    if (result?.audio_url) return [result];
    return [];
};

export const getAyahIdentity = (ayah) => `${ayah.surahNumber ?? 'surah'}:${ayah.number ?? ayah.id}`;

export const clampMushafPage = (page) => {
    const numeric = Number.parseInt(`${page}`, 10);
    if (!Number.isFinite(numeric)) return MUSHAF_FIRST_PAGE;
    return Math.max(MUSHAF_FIRST_PAGE, Math.min(MUSHAF_LAST_PAGE, numeric));
};

export const mergeUniqueAyahs = (pageResults = []) => {
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

export const getFirstPageNumber = (items, fallback = MUSHAF_FIRST_PAGE) => {
    const pageNumber = items.find((ayah) => Number.isFinite(Number(ayah.pageNumber)))?.pageNumber;
    return clampMushafPage(pageNumber ?? fallback);
};

export const getSurahPageForAyah = (ayahNumber) => {
    const numeric = Number.parseInt(`${ayahNumber}`, 10);
    if (!Number.isFinite(numeric) || numeric < 1) return 0;
    return Math.floor((numeric - 1) / SURAH_PAGE_SIZE);
};

export const getInitialSurahPages = (targetPage, totalAyahs) => {
    const page = Math.max(0, Number.parseInt(`${targetPage}`, 10) || 0);
    const maxPage = Number(totalAyahs) > 0
        ? Math.max(0, Math.floor((Number(totalAyahs) - 1) / SURAH_PAGE_SIZE))
        : page + SURAH_TARGET_PREFETCH_RADIUS;
    const start = Math.max(0, page - SURAH_TARGET_PREFETCH_RADIUS);
    const end = Math.min(maxPage, Math.max(start, page + SURAH_TARGET_PREFETCH_RADIUS));
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const getMushafTranslationLength = (ayah) => String(ayah.translation || '').length;

export const getMushafArabicTokens = (ayah) => {
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

export const getMushafTokenLength = (token) =>
    stripArabicDiacritics(token.text).replace(/\s+/g, '').length;

export const getMushafFragmentLength = (fragment) =>
    fragment.segments.reduce((total, token) => total + getMushafTokenLength(token), 0);

export const splitMushafAyahFragments = (ayah, maxArabicLength) => {
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

export const buildMushafLineGroups = (items) => {
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

export const getCompactArabicSurahName = (value) => `${value ?? ''}`.replace(SURAH_PREFIX_PATTERN, '');

export const TAJWEED_GROUPS = [
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
