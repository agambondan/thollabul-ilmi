export const quizOptions = ["A", "B", "C", "D"];

export const EXPLORE_PAGE_SIZE = 20;
export const TAFSIR_SOURCE_LABELS = {
    kemenag: "Tafsir Kemenag",
    secondary: "Tafsir Al-Mishbah",
};
export const TAFSIR_MODES = [
    { key: "all", label: "Semua" },
    { key: "side-by-side", label: "Bandingkan" },
    { key: "kemenag", label: "Kemenag" },
    { key: "mishbah", label: "Al-Mishbah" },
];
export const KAJIAN_CATEGORIES = [
    "aqidah",
    "fiqh",
    "akhlak",
    "tafsir",
    "hadits",
    "sirah",
    "umum",
];
export const LIBRARY_PROGRESS_STATUSES = [
    { key: "planned", label: "Rencana" },
    { key: "reading", label: "Dibaca" },
    { key: "paused", label: "Dijeda" },
    { key: "completed", label: "Selesai" },
];
export const getLibraryProgressLabel = (status) =>
    LIBRARY_PROGRESS_STATUSES.find((item) => item.key === status)?.label ??
    "Dibaca";

export const PRAYER_ITEMS = [
    { key: "subuh", label: "Subuh" },
    { key: "dzuhur", label: "Dzuhur" },
    { key: "ashar", label: "Ashar" },
    { key: "maghrib", label: "Maghrib" },
    { key: "isya", label: "Isya" },
];
export const WEB_APP_EXPLORE_BG = "#020617";
export const WEB_APP_EXPLORE_SURFACE = "#111827";
export const WEB_APP_EXPLORE_BORDER = "#243044";
export const WEB_APP_EXPLORE_ACCENT = "#34d399";
export const WEB_APP_EXPLORE_MUTED = "#94a3b8";
export const BOOKMARK_TYPE_LABELS = {
    ayah: "Al-Quran",
    quran: "Al-Quran",
    hadith: "Hadith",
    doa: "Doa",
    dzikir: "Dzikir",
    asmaul_husna: "Asmaul Husna",
    article: "Artikel",
    library_book: "Perpustakaan",
};
export const MUHASABAH_MOOD_LABELS = {
    baik: "Baik",
    biasa: "Biasa",
    berat: "Berat",
    syukur: "Syukur",
};
export const HAFALAN_STATUS_LABELS = {
    in_progress: "Proses",
    memorized: "Hafal",
    not_started: "Belum",
};
export const LEADERBOARD_TABS = [
    { key: "streak", label: "Streak Sholat", unit: "hari" },
    { key: "hafalan", label: "Hafalan", unit: "surah" },
];

export const emptyUserWirdForm = {
    arabic: "",
    count: "1",
    note: "",
    occasion: "",
    source: "",
    title: "",
    translation: "",
    transliteration: "",
};

export const refKey = (refType, refId) => `${refType}:${refId}`;
export const digitsOnly = (value = "") => `${value}`.replace(/[^\d]/g, "");
export const parseNumericInput = (value = "") => Number(digitsOnly(value)) || 0;
export const normalizeSearchText = (value = "") =>
    `${value}`.trim().toLowerCase();
export const normalizeBookmarkType = (value = "") => {
    const type = `${value || "bookmark"}`.trim().toLowerCase();
    if (type === "surah") return "quran";
    if (type === "verse") return "ayah";
    return type || "bookmark";
};
export const getBookmarkTypeLabel = (type = "") =>
    BOOKMARK_TYPE_LABELS[normalizeBookmarkType(type)] ||
    `${type || "Bookmark"}`.replace(/_/g, " ");
export const formatNoteDate = (value = "") => {
    if (!value) return "";
    const parsed = new Date(
        `${value}`.includes("T") ? value : `${value}T00:00:00`,
    );
    if (Number.isNaN(parsed.getTime())) return `${value}`;
    return parsed.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};
export const formatBlogDate = (value = "") => {
    if (!value) return "";
    const parsed = new Date(
        `${value}`.includes("T") ? value : `${value}T00:00:00`,
    );
    if (Number.isNaN(parsed.getTime())) return `${value}`;
    return parsed.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};
export const getNoteTags = (item = {}) => {
    const tags = item?.raw?.tags ?? item?.tags;
    if (Array.isArray(tags)) return tags.filter(Boolean);
    if (typeof tags === "string")
        return tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    return [];
};
export const formatNumericInput = (value = "") => {
    const normalized = digitsOnly(value);
    if (!normalized) return "";
    return Number(normalized).toLocaleString("id-ID");
};
export const formatCurrency = (value = 0) =>
    `Rp ${Math.round(Number(value) || 0).toLocaleString("id-ID")}`;
export const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim()) ?? "";
export const stripHtmlText = (value = "") =>
    `${value}`
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
export const isRateLimitError = (error) =>
    Number(error?.status) === 429 ||
    /\b429\b|too many requests|terlalu sering/i.test(`${error?.message ?? ""}`);
export const getFeatureLoadErrorMessage = (feature, error, isWebAppLayout) => {
    if (isWebAppLayout && feature?.key === "blog" && isRateLimitError(error)) {
        return "Artikel sedang terlalu sering dimuat. Coba lagi sebentar.";
    }

    return error?.message ?? "Fitur ini belum bisa dimuat.";
};
export const toTextValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return pickText(value.name, value.title, value.label, value.value);
};
export const parseGoalNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
export const getGoalValue = (item = {}, field, fallback) => {
    const raw = item?.raw ?? {};
    return raw[field] ?? item[field] ?? fallback;
};
export const getGoalCompleted = (item = {}) => {
    const raw = item?.raw ?? {};
    const status =
        `${raw.status ?? item.status ?? item.meta ?? ""}`.toLowerCase();
    return (
        Boolean(raw.completed ?? item.completed) ||
        ["done", "selesai", "completed", "complete"].includes(status)
    );
};
export const getGoalProgress = (item = {}) => {
    const current = parseGoalNumber(getGoalValue(item, "current", 0));
    const target = Math.max(
        1,
        parseGoalNumber(getGoalValue(item, "target", 1), 1),
    );
    return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
};
export const getGoalMetaLine = (item = {}) => {
    const category = pickText(getGoalValue(item, "category", ""), item.meta);
    const current = parseGoalNumber(getGoalValue(item, "current", 0));
    const target = parseGoalNumber(getGoalValue(item, "target", 0));
    const unit = pickText(getGoalValue(item, "unit", ""), "target");
    const deadline =
        getGoalValue(item, "deadline", "") ||
        getGoalValue(item, "due_date", "");
    return [
        category,
        target ? `${current}/${target} ${unit}` : "",
        deadline ? `Deadline: ${formatNoteDate(deadline)}` : "",
    ]
        .filter(Boolean)
        .join(" · ");
};
export const getMuhasabahMoodLabel = (item = {}) => {
    const raw = item?.raw ?? {};
    const mood = `${raw.mood ?? item.mood ?? item.meta ?? ""}`
        .trim()
        .toLowerCase();
    return MUHASABAH_MOOD_LABELS[mood] ?? pickText(item.meta, mood, "Refleksi");
};
export const getMuhasabahDateLabel = (item = {}) => {
    const raw = item?.raw ?? {};
    return formatNoteDate(raw.date ?? raw.created_at ?? item.date ?? "");
};
export const getMuhasabahContent = (item = {}) => {
    const raw = item?.raw ?? {};
    return pickText(
        raw.content,
        raw.notes,
        raw.note,
        item.body,
        item.content,
        item.title,
    );
};
export const normalizeHafalanStatus = (value = "") => {
    const status = `${value}`.trim().toLowerCase();
    if (["hafal", "memorized", "selesai", "done"].includes(status))
        return "memorized";
    if (["sedang", "in_progress", "progress", "proses"].includes(status))
        return "in_progress";
    return "not_started";
};
export const getHafalanStatus = (item = {}) => {
    const raw = item?.raw ?? {};
    return normalizeHafalanStatus(raw.status ?? item.status ?? item.meta);
};
export const getHafalanStatusLabel = (status = "") =>
    HAFALAN_STATUS_LABELS[normalizeHafalanStatus(status)] ??
    HAFALAN_STATUS_LABELS.not_started;
export const getHafalanSummary = (items = []) => {
    const summary = items.length === 1 ? (items[0]?.raw ?? {}) : {};
    const memorizedFromSummary = parseGoalNumber(
        summary.memorized_count ??
            summary.memorized ??
            summary.hafalan ??
            summary.completed,
        NaN,
    );
    const inProgressFromSummary = parseGoalNumber(
        summary.in_progress_count ?? summary.in_progress ?? summary.progressing,
        NaN,
    );
    const totalFromSummary = parseGoalNumber(
        summary.total ??
            summary.total_surah ??
            summary.surah_count ??
            summary.total_count,
        NaN,
    );
    const memorized = Number.isFinite(memorizedFromSummary)
        ? memorizedFromSummary
        : items.filter((item) => getHafalanStatus(item) === "memorized").length;
    const inProgress = Number.isFinite(inProgressFromSummary)
        ? inProgressFromSummary
        : items.filter((item) => getHafalanStatus(item) === "in_progress")
              .length;
    const total = Number.isFinite(totalFromSummary)
        ? totalFromSummary
        : items.length;
    return {
        inProgress,
        memorized,
        notStarted: Math.max(0, total - memorized - inProgress),
        total,
    };
};
export const getHafalanItemTitle = (item = {}, index = 0) => {
    const raw = item?.raw ?? {};
    return pickText(
        raw.surah_name,
        raw.surah?.latin_name,
        raw.surah?.name_latin,
        raw.name,
        item.title,
        `Surah ${index + 1}`,
    );
};
export const getHafalanMetaLine = (item = {}) => {
    const raw = item?.raw ?? {};
    return [
        (raw.surah_number ?? raw.surah_id)
            ? `Surah ${raw.surah_number ?? raw.surah_id}`
            : "",
        raw.juz ? `Juz ${raw.juz}` : "",
        raw.last_reviewed_at
            ? `Review: ${formatNoteDate(raw.last_reviewed_at)}`
            : "",
    ]
        .filter(Boolean)
        .join(" · ");
};
export const getHafalanItemProgress = (item = {}) => {
    const raw = item?.raw ?? {};
    const explicit = parseGoalNumber(
        raw.progress ?? raw.percent ?? raw.percentage,
        NaN,
    );
    if (Number.isFinite(explicit)) return Math.min(100, Math.max(0, explicit));
    const status = getHafalanStatus(item);
    if (status === "memorized") return 100;
    if (status === "in_progress") return 50;
    return 0;
};
export const getMurojaahDays = (item = {}) => {
    const raw = item?.raw ?? {};
    const explicit = parseGoalNumber(
        raw.days ?? raw.days_since_review ?? raw.daysSinceReview,
        NaN,
    );
    if (Number.isFinite(explicit)) return explicit;
    const reviewedAt =
        raw.last_reviewed_at ??
        raw.reviewed_at ??
        raw.lastReviewAt ??
        item.date;
    if (!reviewedAt) return null;
    const parsed = new Date(
        `${reviewedAt}`.includes("T") ? reviewedAt : `${reviewedAt}T00:00:00`,
    );
    if (Number.isNaN(parsed.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86400000));
};
export const getMurojaahStatus = (item = {}) => {
    const days = getMurojaahDays(item);
    if (days === null || days >= 14) return "urgent";
    if (days < 7) return "recent";
    return "due";
};
export const getMurojaahStatusLabel = (item = {}) => {
    const days = getMurojaahDays(item);
    if (days === null) return "Belum direview";
    if (days >= 14) return `${days} hari urgent`;
    return `${days} hari lalu`;
};
export const getMurojaahSummary = (items = []) => ({
    recent: items.filter((item) => getMurojaahStatus(item) === "recent").length,
    total: items.length,
    urgent: items.filter((item) => getMurojaahStatus(item) === "urgent").length,
});
export const getMurojaahItemTitle = (item = {}, index = 0) => {
    const raw = item?.raw ?? {};
    return pickText(
        raw.surah_name,
        raw.surah?.latin_name,
        raw.surah?.name_latin,
        raw.name,
        item.title,
        `Surah ${index + 1}`,
    );
};
export const getMurojaahMetaLine = (item = {}) => {
    const raw = item?.raw ?? {};
    return [
        (raw.surah_number ?? raw.surah_id ?? raw.number)
            ? `Surah ${raw.surah_number ?? raw.surah_id ?? raw.number}`
            : "",
        raw.juz ? `Juz ${raw.juz}` : "",
        raw.last_reviewed_at
            ? `Review: ${formatNoteDate(raw.last_reviewed_at)}`
            : "",
    ]
        .filter(Boolean)
        .join(" · ");
};
export const getLocalDateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};
export const parseTilawahDate = (value = "") => {
    if (!value) return null;
    const parsed = new Date(
        `${value}`.includes("T") ? value : `${value}T00:00:00`,
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
export const isTilawahSameWeek = (value = "") => {
    const parsed = parseTilawahDate(value);
    if (!parsed) return false;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return parsed >= startOfWeek;
};
export const isTilawahSameMonth = (value = "") => {
    const parsed = parseTilawahDate(value);
    if (!parsed) return false;
    const now = new Date();
    return (
        parsed.getMonth() === now.getMonth() &&
        parsed.getFullYear() === now.getFullYear()
    );
};
export const getTilawahDate = (item = {}) => {
    const raw = item?.raw ?? {};
    return raw.date ?? raw.created_at ?? item.date ?? item.meta ?? "";
};
export const getTilawahPages = (item = {}) => {
    const raw = item?.raw ?? {};
    return parseGoalNumber(
        raw.pages ??
            raw.pages_read ??
            raw.page_count ??
            raw.total_pages ??
            item.pages,
        0,
    );
};
export const getTilawahSurah = (item = {}, index = 0) => {
    const raw = item?.raw ?? {};
    return pickText(
        raw.surah,
        raw.surah_name,
        raw.surah?.latin_name,
        raw.surah?.name_latin,
        item.title,
        `Tilawah ${index + 1}`,
    );
};
export const getTilawahAyahLine = (item = {}) => {
    const raw = item?.raw ?? {};
    const ayahFrom = raw.ayahFrom ?? raw.ayah_from ?? raw.ayah_start;
    const ayahTo = raw.ayahTo ?? raw.ayah_to ?? raw.ayah_end ?? ayahFrom;
    return ayahFrom ? `Ayat ${ayahFrom}-${ayahTo}` : "";
};
export const getTilawahNotes = (item = {}) => {
    const raw = item?.raw ?? {};
    return pickText(raw.notes, raw.note, item.body, item.content);
};
export const getTilawahSummary = (items = []) => {
    const today = getLocalDateKey();
    return items.reduce(
        (summary, item) => {
            const date = `${getTilawahDate(item)}`.slice(0, 10);
            const pages = getTilawahPages(item);
            return {
                pagesMonth:
                    summary.pagesMonth + (isTilawahSameMonth(date) ? pages : 0),
                pagesWeek:
                    summary.pagesWeek + (isTilawahSameWeek(date) ? pages : 0),
                todayEntry:
                    summary.todayEntry || (date === today ? item : null),
                totalPages: summary.totalPages + pages,
            };
        },
        { pagesMonth: 0, pagesWeek: 0, todayEntry: null, totalPages: 0 },
    );
};
export const getStatsPayload = (items = []) => {
    const first = items[0]?.raw ?? items[0] ?? {};
    return first?.data ?? first;
};
export const getStatsNumber = (source = {}, fields = [], fallback = 0) => {
    for (const field of fields) {
        const segments = `${field}`.split(".");
        let value = source;
        for (const segment of segments) {
            value = value?.[segment];
        }
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};
export const formatCompactStat = (value = 0) =>
    Number(value || 0).toLocaleString("id-ID");
export const getStatsSummary = (items = []) => {
    const source = getStatsPayload(items);
    const tilawah = source?.tilawah ?? {};
    const sholat = source?.sholat ?? {};
    return {
        activeGoals: getStatsNumber(source, [
            "active_goals",
            "goals.active",
            "goals.active_count",
        ]),
        bookmarks: getStatsNumber(source, [
            "total_bookmarks",
            "bookmarks",
            "bookmarks.total",
        ]),
        hafalan: getStatsNumber(source, [
            "hafalan",
            "hafalan.memorized",
            "hafalan.memorized_count",
        ]),
        muhasabah: getStatsNumber(source, [
            "total_muhasabah",
            "muhasabah",
            "muhasabah.total",
        ]),
        points: getStatsNumber(source, [
            "total_points",
            "points",
            "achievement_points.total_points",
        ]),
        prayerCount: getStatsNumber(source, [
            "today_prayers",
            "today_prayer_count",
            "sholat.today_done",
            "sholat.today_count",
        ]),
        prayerStreak: getStatsNumber(source, [
            "streak",
            "current_streak",
            "sholat.current_streak_days",
            "sholat.best_streak_days",
        ]),
        sholat,
        tilawahMonth: getStatsNumber(
            source,
            [
                "tilawah_month",
                "tilawah.month",
                "tilawah.pages_month",
                "tilawah.total_pages",
            ],
            getStatsNumber(tilawah, ["total_pages"]),
        ),
        tilawahWeek: getStatsNumber(source, [
            "tilawah_week",
            "tilawah.week",
            "tilawah.pages_week",
            "tilawah.weekly_pages",
        ]),
        weeklyActivity: Array.isArray(source?.weekly_activity)
            ? source.weekly_activity
            : Array.isArray(source?.last7)
              ? source.last7
              : Array.isArray(source?.sholat?.last7)
                ? source.sholat.last7
                : [],
    };
};
export const getStatsPrayerRows = (stats = {}) => {
    if (stats.weeklyActivity.length) {
        return stats.weeklyActivity.slice(-7).map((row, index) => ({
            count: Math.max(
                0,
                Math.min(
                    5,
                    getStatsNumber(
                        row,
                        ["count", "total", "done", "prayers"],
                        0,
                    ),
                ),
            ),
            date: row.date ?? row.day ?? `Hari ${index + 1}`,
        }));
    }

    const completionPct = getStatsNumber(
        stats.sholat,
        ["weekly_completion_pct", "completion_pct"],
        NaN,
    );
    const count = Number.isFinite(completionPct)
        ? Math.round((Math.max(0, Math.min(100, completionPct)) / 100) * 5)
        : 0;
    return Array.from({ length: 7 }, (_, index) => ({
        count,
        date: `Hari ${index + 1}`,
    }));
};
export const makeLeaderboardDatasetItem = (type, page) => ({
    id: `leaderboard-${type}`,
    raw: {
        entries: page?.items ?? [],
        meta: page?.meta ?? {},
        type,
    },
    title: type,
});
export const getLeaderboardEntries = (items = [], tab = "streak") => {
    const dataset = items.find((item) => item?.raw?.type === tab);
    if (Array.isArray(dataset?.raw?.entries)) return dataset.raw.entries;
    return items;
};
export const getLeaderboardName = (item = {}, index = 0) => {
    const raw = item?.raw ?? item;
    return pickText(
        raw.name,
        raw.user_name,
        raw.user?.name,
        raw.full_name,
        item.title,
        `Peserta ${index + 1}`,
    );
};
export const getLeaderboardScore = (item = {}) => {
    const raw = item?.raw ?? item;
    return getStatsNumber(
        raw,
        [
            "score",
            "value",
            "streak",
            "hafalan_count",
            "memorized_count",
            "total",
        ],
        0,
    );
};
export const getLeaderboardRank = (item = {}, index = 0) => {
    const raw = item?.raw ?? item;
    return getStatsNumber(raw, ["rank", "position"], index + 1);
};
export const getLeaderboardSummary = (items = []) => {
    const streak = getLeaderboardEntries(items, "streak");
    const hafalan = getLeaderboardEntries(items, "hafalan");
    return {
        hafalanCount: hafalan.length,
        streakCount: streak.length,
        topHafalan: hafalan[0] ?? null,
        topStreak: streak[0] ?? null,
    };
};
export const getKajianRaw = (item = {}) => item?.raw ?? item;
export const getKajianTitle = (item = {}, index = 0) => {
    const raw = getKajianRaw(item);
    const translation = raw.translation ?? {};
    return pickText(
        item.title,
        translation.title_idn,
        translation.title_en,
        raw.title,
        raw.name,
        raw.slug,
        `Kajian ${index + 1}`,
    );
};
export const getKajianDescription = (item = {}) => {
    const raw = getKajianRaw(item);
    const translation = raw.translation ?? {};
    return pickText(
        item.body,
        translation.description_idn,
        translation.description_en,
        raw.description,
        raw.summary,
        raw.content,
    );
};
export const getKajianType = (item = {}) => {
    const raw = getKajianRaw(item);
    return toTextValue(
        raw.type || item.meta || raw.format || raw.platform,
    ).toLowerCase();
};
export const getKajianTopic = (item = {}) => {
    const raw = getKajianRaw(item);
    return toTextValue(raw.topic || raw.category || raw.subject).toLowerCase();
};
export const getKajianSpeaker = (item = {}) => {
    const raw = getKajianRaw(item);
    return toTextValue(raw.speaker || raw.ustadz || raw.author || raw.teacher);
};
export const getKajianDuration = (item = {}) => {
    const raw = getKajianRaw(item);
    const seconds = Number(raw.duration_seconds ?? raw.durationSeconds ?? 0);
    if (Number.isFinite(seconds) && seconds > 0) return `${seconds} detik`;
    return pickText(raw.duration, raw.duration_label);
};
export const getKajianUrl = (item = {}) => {
    const raw = getKajianRaw(item);
    return pickText(raw.url, raw.source_url, raw.link);
};
export const getFilteredKajianItems = (
    items = [],
    search = "",
    category = "",
) => {
    const query = normalizeSearchText(search);
    return items.filter((item, index) => {
        const text = normalizeSearchText(
            [
                getKajianTitle(item, index),
                getKajianDescription(item),
                getKajianSpeaker(item),
                getKajianTopic(item),
                getKajianType(item),
            ].join(" "),
        );
        const matchesSearch = query ? text.includes(query) : true;
        const matchesCategory = category
            ? getKajianTopic(item) === category
            : true;
        return matchesSearch && matchesCategory;
    });
};
export const getKajianSummary = (items = []) => ({
    categoryCount: new Set(items.map(getKajianTopic).filter(Boolean)).size,
    total: items.length,
    videoCount: items.filter((item) => getKajianType(item) === "video").length,
});
export const getBlogRaw = (item = {}) => item?.raw ?? item;
export const getBlogTitle = (item = {}, index = 0) => {
    const raw = getBlogRaw(item);
    const translation = raw.translation ?? {};
    return pickText(
        item.title,
        translation.title_idn,
        translation.title_en,
        raw.title,
        raw.name,
        raw.slug,
        `Artikel ${index + 1}`,
    );
};
export const getBlogExcerpt = (item = {}) => {
    const raw = getBlogRaw(item);
    const translation = raw.translation ?? {};
    return stripHtmlText(
        pickText(
            item.body,
            translation.excerpt_idn,
            translation.excerpt_en,
            translation.description_idn,
            translation.description_en,
            raw.excerpt,
            raw.summary,
            raw.description,
        ),
    );
};
export const getBlogAuthor = (item = {}) => {
    const raw = getBlogRaw(item);
    return toTextValue(raw.author || raw.user || raw.writer);
};
export const getBlogCategoryLabel = (item = {}) => {
    const raw = getBlogRaw(item);
    const category =
        raw.category ?? raw.category_name ?? raw.categoryName ?? item.meta;
    if (typeof category === "string") return category;
    return pickText(
        category?.name,
        category?.title,
        category?.label,
        category?.translation?.idn,
        category?.translation?.en,
        category?.slug,
    );
};
export const getBlogCategoryOptionLabel = (category = {}) => {
    if (typeof category === "string") return category;
    return pickText(
        category.name,
        category.title,
        category.label,
        category.translation?.idn,
        category.translation?.en,
        category.translation?.name_idn,
        category.translation?.name_en,
        category.slug,
    );
};
export const getBlogCategoryOptionValue = (category = {}) => {
    if (typeof category === "string") return category;
    return `${category.slug ?? category.id ?? getBlogCategoryOptionLabel(category) ?? ""}`;
};
export const getBlogCategoryValue = (item = {}) => {
    const raw = getBlogRaw(item);
    const category =
        raw.category ?? raw.category_name ?? raw.categoryName ?? item.meta;
    if (typeof category === "string") return category;
    return `${category?.slug ?? category?.id ?? getBlogCategoryLabel(item) ?? ""}`;
};
export const normalizeBlogCategoryOptions = (categories = []) => {
    const map = new Map();
    categories.forEach((category) => {
        const value = getBlogCategoryOptionValue(category);
        const label = getBlogCategoryOptionLabel(category);
        if (value && label && !map.has(value.toLowerCase())) {
            map.set(value.toLowerCase(), { label, value });
        }
    });
    return Array.from(map.values());
};
export const getBlogCategories = (items = []) => {
    const map = new Map();
    items.forEach((item) => {
        const value = getBlogCategoryValue(item);
        const label = getBlogCategoryLabel(item);
        if (value && label && !map.has(value.toLowerCase())) {
            map.set(value.toLowerCase(), { label, value });
        }
    });
    return Array.from(map.values());
};
export const getFilteredBlogItems = (
    items = [],
    search = "",
    category = "",
) => {
    const query = normalizeSearchText(search);
    return items.filter((item, index) => {
        const text = normalizeSearchText(
            [
                getBlogTitle(item, index),
                getBlogExcerpt(item),
                getBlogAuthor(item),
                getBlogCategoryLabel(item),
            ].join(" "),
        );
        const matchesSearch = query ? text.includes(query) : true;
        const matchesCategory = category
            ? getBlogCategoryValue(item).toLowerCase() ===
              category.toLowerCase()
            : true;
        return matchesSearch && matchesCategory;
    });
};
export const getFeedReference = (item = {}) => {
    const raw = item?.raw ?? {};
    const refType = raw.ref_type ?? "";
    if (!["ayah", "hadith"].includes(refType)) return null;
    return {
        id: raw.ref_id ?? "",
        label: refType === "ayah" ? "Ayat Quran" : "Hadis",
    };
};
export const normalizeAsmaulName = (item = {}, index = 0) => ({
    arabic: pickText(
        item.arabic,
        item.translation?.arab,
        item.translation?.ar,
        item.name,
    ),
    id: item.id ?? item.number ?? index + 1,
    meaning: pickText(
        item.indonesian,
        item.meaning,
        item.translation?.idn,
        item.translation?.en,
        item.english,
    ),
    number: item.number ?? index + 1,
    transliteration: pickText(
        item.transliteration,
        item.latin,
        item.translation?.latin_idn,
        item.translation?.latin_en,
    ),
});
export const normalizePrayerLog = (payload = {}) => {
    const prayers = payload?.prayers ?? payload;
    return PRAYER_ITEMS.reduce((acc, item) => {
        const value = prayers?.[item.key];
        if (typeof value === "boolean") {
            acc[item.key] = value;
        } else if (value && typeof value === "object") {
            acc[item.key] = Boolean(value.status && value.status !== "missed");
        }
        return acc;
    }, {});
};

export const getItemRef = (feature, item) => {
    if (feature?.type === "feed") {
        return {
            refId: String(item?.raw?.ref_id ?? item?.id ?? ""),
            refType: item?.raw?.ref_type ?? "feed",
        };
    }
    return {
        refType: feature?.refType ?? feature?.key ?? "explore",
        refId: String(
            item?.id ?? item?.raw?.id ?? item?.raw?.slug ?? item?.title,
        ),
    };
};
export const getExploreItemKey = (item) =>
    String(
        item?.id ??
            item?.raw?.id ??
            item?.raw?.slug ??
            item?.title ??
            item?.body,
    );
export const mergeUniqueItems = (currentItems, nextItems) => {
    const seen = new Set(currentItems.map(getExploreItemKey));
    const merged = [...currentItems];

    nextItems.forEach((item) => {
        const key = getExploreItemKey(item);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(item);
    });

    return merged;
};

export const normalizeUserWirdItem = (item, index = 0) => ({
    id: item?.id ?? `user-wird-${index}`,
    title: item?.title ?? `Wirid ${index + 1}`,
    arabic: item?.arabic ?? "",
    body: [item?.transliteration, item?.translation, item?.note]
        .filter(Boolean)
        .join("\n"),
    meta: [item?.occasion, item?.count ? `${item.count}x` : "", item?.source]
        .filter(Boolean)
        .join(" · "),
    raw: item,
});
