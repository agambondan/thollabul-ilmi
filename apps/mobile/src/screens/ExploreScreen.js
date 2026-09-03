import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    BookOpen,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    Circle,
    ExternalLink,
    Flag,
    Heart,
    MessageCircle,
    Pencil,
    StickyNote,
    Trash2,
    UserCircle,
} from "lucide-react-native";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    getAllNotes,
    getAsmaulNames,
    getBlogCategoryItems,
    getBookmarkItems,
    getFeatureItemPage,
    getHijriOverview,
    getQuizQuestions,
    getZakatGoldPrice,
    searchDictionary,
} from "../api/explore";
import {
    createComment,
    getCommentsByRef,
    getFeedPostPage,
    hideFeedPost,
    likeFeedPost,
    reportFeedPost,
} from "../api/social";
import {
    acceptForumAnswer,
    createForumAnswer,
    createForumQuestion,
    getForumQuestion,
    getForumQuestions,
    voteForum,
} from "../api/forum";
import { AppActionSheet, ActionSheetRow } from "../components/AppActionSheet";
import { Card, CardTitle } from "../components/Card";
import { ContentCard } from "../components/ContentCard";
import { NotesPanel } from "../components/NotesPanel";
import { NotificationCenter } from "../components/NotificationCenter";
import {
    ActionPill,
    IconActionButton,
    PaperSearchInput,
} from "../components/Paper";
import { Screen } from "../components/Screen";
import { useFeedback } from "../context/FeedbackContext";
import { useSession } from "../context/SessionContext";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import {
    FeatureCatalog,
    findFeatureByKey,
    isPaginatedFeature,
    LOCAL_TOOL_TYPES,
} from "./explore/FeatureCatalog";
import { renderExploreWebAppRoute } from "./explore/ExploreWebAppRoutes";
import {
    WEB_APP_EXPLORE_THEMES,
    createExploreWebAppThemeStyles,
} from "./explore/ExploreWebAppTheme";
import { createExploreClassicRenderers } from "./explore/ExploreClassicRenderers";
import {
    deleteCalculatorHistory,
    mergeCalculatorHistory,
    readCalculatorHistory,
    saveCalculatorHistory,
} from "../storage/calculatorHistory";
import {
    readAsmaulWiridCounts,
    setAsmaulWiridCount,
} from "../storage/asmaulWirid";
import {
    readPinnedFeatures,
    readRecentFeatures,
    rememberFeatureOpen,
    togglePinnedFeature,
} from "../storage/recentFeatures";
import { colors, radius, spacing } from "../theme";
import {
    addBookmark,
    checkAmalan,
    createUserWird,
    deleteBookmark,
    deleteFaraidh,
    deleteKalkulasiZakat,
    deleteUserWird,
    getBookmarks,
    getFaraidhHistory,
    getKalkulasiZakat,
    getLibraryProgress,
    getLibraryProgressList,
    getTodayPrayerLog,
    getUserWirds,
    logActivity,
    saveFaraidh,
    saveKalkulasiZakat,
    saveLibraryProgress,
    savePrayerLog,
    updateUserWird,
} from "../api/personal";
import { getAyahById, getSurahs } from "../api/client";
import { calculateFaraidh, HEIR_LABELS } from "../lib/faraidh";
import { hapticMedium, hapticTap } from "../utils/haptics";
import { HistoricalMapContent } from "./HistoricalMapScreen";
import { styles } from "./ExploreScreen.styles";
import { TokohTarikhContent } from "./TokohTarikhContent";
import {
    quizOptions,
    EXPLORE_PAGE_SIZE,
    TAFSIR_SOURCE_LABELS,
    TAFSIR_MODES,
    KAJIAN_CATEGORIES,
    LIBRARY_PROGRESS_STATUSES,
    getLibraryProgressLabel,
    PRAYER_ITEMS,
    WEB_APP_EXPLORE_BG,
    WEB_APP_EXPLORE_SURFACE,
    WEB_APP_EXPLORE_BORDER,
    WEB_APP_EXPLORE_ACCENT,
    WEB_APP_EXPLORE_MUTED,
    BOOKMARK_TYPE_LABELS,
    MUHASABAH_MOOD_LABELS,
    HAFALAN_STATUS_LABELS,
    LEADERBOARD_TABS,
    emptyUserWirdForm,
    refKey,
    digitsOnly,
    parseNumericInput,
    normalizeSearchText,
    normalizeBookmarkType,
    getBookmarkTypeLabel,
    formatNoteDate,
    formatBlogDate,
    getNoteTags,
    formatNumericInput,
    formatCurrency,
    pickText,
    stripHtmlText,
    isRateLimitError,
    getFeatureLoadErrorMessage,
    toTextValue,
    parseGoalNumber,
    getGoalValue,
    getGoalCompleted,
    getGoalProgress,
    getGoalMetaLine,
    getMuhasabahMoodLabel,
    getMuhasabahDateLabel,
    getMuhasabahContent,
    normalizeHafalanStatus,
    getHafalanStatus,
    getHafalanStatusLabel,
    getHafalanSummary,
    getHafalanItemTitle,
    getHafalanMetaLine,
    getHafalanItemProgress,
    getMurojaahDays,
    getMurojaahStatus,
    getMurojaahStatusLabel,
    getMurojaahSummary,
    getMurojaahItemTitle,
    getMurojaahMetaLine,
    getLocalDateKey,
    parseTilawahDate,
    isTilawahSameWeek,
    isTilawahSameMonth,
    getTilawahDate,
    getTilawahPages,
    getTilawahSurah,
    getTilawahAyahLine,
    getTilawahNotes,
    getTilawahSummary,
    getStatsPayload,
    getStatsNumber,
    formatCompactStat,
    getStatsSummary,
    getStatsPrayerRows,
    makeLeaderboardDatasetItem,
    getLeaderboardEntries,
    getLeaderboardName,
    getLeaderboardScore,
    getLeaderboardRank,
    getLeaderboardSummary,
    getKajianRaw,
    getKajianTitle,
    getKajianDescription,
    getKajianType,
    getKajianTopic,
    getKajianSpeaker,
    getKajianDuration,
    getKajianUrl,
    getFilteredKajianItems,
    getKajianSummary,
    getBlogRaw,
    getBlogTitle,
    getBlogExcerpt,
    getBlogAuthor,
    getBlogCategoryLabel,
    getBlogCategoryOptionLabel,
    getBlogCategoryOptionValue,
    getBlogCategoryValue,
    normalizeBlogCategoryOptions,
    getBlogCategories,
    getFilteredBlogItems,
    getFeedReference,
    normalizeAsmaulName,
    normalizePrayerLog,
    getItemRef,
    getExploreItemKey,
    mergeUniqueItems,
    normalizeUserWirdItem,
} from "./ExploreScreen.helpers";

export function ExploreScreen({
    deepLinkTarget,
    isActive,
    navigation,
    onOpenTab,
}) {
    const { session } = useSession();
    const { showError, showInfo, showSuccess } = useFeedback();
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const { t } = useMobileLocale();
    const webAppExploreTheme = isDarkTheme
        ? WEB_APP_EXPLORE_THEMES.dark
        : WEB_APP_EXPLORE_THEMES.light;
    const webAppExploreThemeStyles = useMemo(
        () => createExploreWebAppThemeStyles(webAppExploreTheme),
        [webAppExploreTheme],
    );
    const handledDeepLinkId = useRef(null);
    const dictionaryInputRef = useRef(null);
    const zakatTimerRef = useRef(null);
    const [featureSearch, setFeatureSearch] = useState("");
    const [activeFeature, setActiveFeature] = useState(null);
    const [featureReturnRoute, setFeatureReturnRoute] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [savingBookmark, setSavingBookmark] = useState("");
    const [itemActionSheet, setItemActionSheet] = useState({
        visible: false,
        item: null,
    });
    const [focusDictionaryInput, setFocusDictionaryInput] = useState(false);
    const [dictionaryQuery, setDictionaryQuery] = useState("");
    const [tasbih, setTasbih] = useState({ count: 0, target: 33 });
    const [asmaulNames, setAsmaulNames] = useState([]);
    const [asmaulIndex, setAsmaulIndex] = useState(0);
    const [asmaulCounts, setAsmaulCounts] = useState({});
    const [asmaulFlashcardRevealed, setAsmaulFlashcardRevealed] =
        useState(false);
    const [asmaulLoading, setAsmaulLoading] = useState(false);
    const [zakat, setZakat] = useState({
        assets: "",
        debts: "",
        nisab: "85000000",
    });
    const [zakatTab, setZakatTab] = useState(0);
    const [zakatGoldPrice, setZakatGoldPrice] = useState("1050000");
    const [zakatRicePrice, setZakatRicePrice] = useState("16000");
    const [zakatFamilyCount, setZakatFamilyCount] = useState(1);
    const [zakatTradeCapital, setZakatTradeCapital] = useState("");
    const [zakatTradeStock, setZakatTradeStock] = useState("");
    const [zakatTradeReceivable, setZakatTradeReceivable] = useState("");
    const [zakatTradeDebt, setZakatTradeDebt] = useState("");
    const [zakatHarvestWeight, setZakatHarvestWeight] = useState("");
    const [zakatHarvestIrrigated, setZakatHarvestIrrigated] = useState(false);
    const [zakatRiceKgPrice, setZakatRiceKgPrice] = useState("16000");
    const [zakatGoldGrams, setZakatGoldGrams] = useState("");
    const [zakatSilverPrice, setZakatSilverPrice] = useState("14000");
    const [zakatSilverGrams, setZakatSilverGrams] = useState("");
    const [zakatHaul, setZakatHaul] = useState(true);
    const [zakatTradeHaul, setZakatTradeHaul] = useState(true);
    const [zakatGoldHaul, setZakatGoldHaul] = useState(true);
    const [zakatHistory, setZakatHistory] = useState([]);
    const [zakatSaving, setZakatSaving] = useState(false);
    const [zakatSavedMsg, setZakatSavedMsg] = useState("");
    const [faraidh, setFaraidh] = useState({
        estate: "",
        debts: "",
        bequest: "",
        heirs: {
            suami: 0,
            istri: 0,
            anakL: 0,
            anakP: 0,
            cucuL: 0,
            cucuP: 0,
            ayah: 0,
            ibu: 0,
            kakek: 0,
            nenek: 0,
            saudaraL: 0,
            saudaraP: 0,
            saudaraSeayahL: 0,
            saudaraSeayahP: 0,
            saudaraSeibuL: 0,
            saudaraSeibuP: 0,
        },
    });
    const [faraidhHistory, setFaraidhHistory] = useState([]);
    const [savingFaraidh, setSavingFaraidh] = useState(false);
    const [showFaraidhHistory, setShowFaraidhHistory] = useState(false);
    const [faraidhCatatan, setFaraidhCatatan] = useState("");
    const [answers, setAnswers] = useState({});
    const [bookmarks, setBookmarks] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeNoteRef, setActiveNoteRef] = useState("");
    const [libraryProgress, setLibraryProgress] = useState(null);
    const [libraryProgressMap, setLibraryProgressMap] = useState({});
    const [libraryProgressFilter, setLibraryProgressFilter] = useState("");
    const [libraryProgressDraft, setLibraryProgressDraft] = useState({
        currentPage: "",
        note: "",
        status: "reading",
    });
    const [libraryProgressMessage, setLibraryProgressMessage] = useState("");
    const [libraryProgressSaving, setLibraryProgressSaving] = useState(false);
    const [pinnedFeatureKeys, setPinnedFeatureKeys] = useState({});
    const [recentFeatureKeys, setRecentFeatureKeys] = useState({});
    const [feedComments, setFeedComments] = useState([]);
    const [commentDraft, setCommentDraft] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentSaving, setCommentSaving] = useState(false);
    const [likingFeedId, setLikingFeedId] = useState("");
    const [notesSearch, setNotesSearch] = useState("");
    const [kajianSearch, setKajianSearch] = useState("");
    const [kajianCategory, setKajianCategory] = useState("");
    const [blogSearch, setBlogSearch] = useState("");
    const [blogCategory, setBlogCategory] = useState("");
    const [blogCategoryOptions, setBlogCategoryOptions] = useState([]);
    const [leaderboardTab, setLeaderboardTab] = useState("streak");
    const [editingUserWirdId, setEditingUserWirdId] = useState("");
    const [savingUserWird, setSavingUserWird] = useState(false);
    const [userWirdForm, setUserWirdForm] = useState(emptyUserWirdForm);
    const [surahs, setSurahs] = useState([]);
    const [selectedSurahNumber, setSelectedSurahNumber] = useState(null);
    const [surahSearch, setSurahSearch] = useState("");
    const [tafsirMode, setTafsirMode] = useState("all");
    const [forumView, setForumView] = useState("list");
    const [forumQuestions, setForumQuestions] = useState([]);
    const [forumTotal, setForumTotal] = useState(0);
    const [forumPage, setForumPage] = useState(0);
    const [forumHasMore, setForumHasMore] = useState(false);
    const [forumLoading, setForumLoading] = useState(false);
    const [forumSearch, setForumSearch] = useState("");
    const [forumSlug, setForumSlug] = useState("");
    const [forumDetail, setForumDetail] = useState(null);
    const [forumAnswers, setForumAnswers] = useState([]);
    const [forumAskTitle, setForumAskTitle] = useState("");
    const [forumAskBody, setForumAskBody] = useState("");
    const [forumAskTags, setForumAskTags] = useState("");
    const [forumAnswerDraft, setForumAnswerDraft] = useState("");
    const [forumSaving, setForumSaving] = useState(false);
    const [forumVotingId, setForumVotingId] = useState("");
    const [forumError, setForumError] = useState("");
    const [sholatLog, setSholatLog] = useState({});
    const [pagination, setPagination] = useState({
        page: 0,
        hasMore: false,
        loadingMore: false,
    });
    const loadingMoreRef = useRef(false);

    const visibleSurahOptions = useMemo(() => {
        const query = normalizeSearchText(surahSearch);
        const matches = query
            ? surahs.filter((surah) =>
                  normalizeSearchText(
                      `${surah.number} ${surah.name} ${surah.latin ?? ""} ${surah.translation ?? ""}`,
                  ).includes(query),
              )
            : surahs.slice(0, 24);

        if (
            !query &&
            selectedSurahNumber &&
            !matches.some((surah) => surah.number === selectedSurahNumber)
        ) {
            const selected = surahs.find(
                (surah) => surah.number === selectedSurahNumber,
            );
            return selected ? [selected, ...matches] : matches;
        }

        return matches;
    }, [selectedSurahNumber, surahSearch, surahs]);

    const refreshDiscoveryState = useCallback(async () => {
        const [pinned, recent] = await Promise.all([
            readPinnedFeatures(),
            readRecentFeatures(),
        ]);
        setPinnedFeatureKeys(
            pinned.reduce((acc, feature) => {
                acc[feature.key] = true;
                return acc;
            }, {}),
        );
        setRecentFeatureKeys(
            recent.reduce((acc, feature) => {
                acc[feature.key] = true;
                return acc;
            }, {}),
        );
    }, []);

    const handleTogglePinnedFeature = useCallback(
        async (event, feature) => {
            event?.stopPropagation?.();
            hapticTap();
            try {
                const result = await togglePinnedFeature(feature);
                setPinnedFeatureKeys(
                    result.items.reduce((acc, item) => {
                        acc[item.key] = true;
                        return acc;
                    }, {}),
                );
                showSuccess(
                    t(
                        result.pinned
                            ? "explore.shortcutPinned"
                            : "explore.shortcutUnpinned",
                        { title: feature.title },
                    ),
                );
            } catch {
                setError(t("explore.shortcutSaveError"));
                showError(t("explore.shortcutSaveError"));
            }
        },
        [showError, showSuccess, t],
    );

    const loadFeature = useCallback(
        async (feature, options = {}) => {
            rememberFeatureOpen(feature)
                .then((recent) => {
                    setRecentFeatureKeys(
                        recent.reduce((acc, item) => {
                            acc[item.key] = true;
                            return acc;
                        }, {}),
                    );
                })
                .catch((e) => console.error(e));
            setActiveFeature(feature);
            setFeatureReturnRoute(options.returnTo ?? null);
            setItems([]);
            setAnswers({});
            setSelectedItem(null);
            setActiveNoteRef("");
            setLibraryProgressFilter("");
            setFeedComments([]);
            setCommentDraft("");
            setNotesSearch("");
            setKajianSearch("");
            setKajianCategory("");
            setBlogSearch("");
            setBlogCategory("");
            setBlogCategoryOptions([]);
            setLeaderboardTab("streak");
            setEditingUserWirdId("");
            setUserWirdForm(emptyUserWirdForm);
            setError("");
            setAsmaulFlashcardRevealed(false);
            setTafsirMode("all");
            loadingMoreRef.current = false;
            setPagination({ page: 0, hasMore: false, loadingMore: false });
            setFocusDictionaryInput(
                Boolean(options.focusSearch && feature?.type === "kamus"),
            );
            if (feature?.type !== "surah-content") {
                setSelectedSurahNumber(null);
            }

            if (LOCAL_TOOL_TYPES.includes(feature.type)) {
                if (
                    feature.type === "surah-content" &&
                    !(isWebAppLayout && feature.contentType === "asbabun-nuzul")
                ) {
                    setLoading(true);
                    try {
                        setSurahs(await getSurahs());
                    } catch (err) {
                        setError(err?.message ?? t("explore.surahListError"));
                    } finally {
                        setLoading(false);
                    }
                }

                if (feature.type === "sholat-tracker") {
                    if (!session?.token) {
                        setError(t("explore.loginPrayerTracker"));
                        return;
                    }
                    setLoading(true);
                    try {
                        const log = await getTodayPrayerLog();
                        setSholatLog(normalizePrayerLog(log));
                    } catch {
                        setSholatLog({});
                    } finally {
                        setLoading(false);
                    }
                }

                if (
                    ["asmaul-wirid", "asmaul-flashcard"].includes(
                        feature.type,
                    ) &&
                    asmaulNames.length === 0
                ) {
                    setAsmaulLoading(true);
                    try {
                        const items = await getAsmaulNames();
                        setAsmaulNames((items ?? []).map(normalizeAsmaulName));
                        setAsmaulIndex(0);
                    } catch {
                        /* silent */
                    }
                    setAsmaulLoading(false);
                }

                if (feature.type === "asmaul-wirid") {
                    readAsmaulWiridCounts()
                        .then(setAsmaulCounts)
                        .catch(() => setAsmaulCounts({}));
                }

                if (feature.type === "zakat") {
                    getZakatGoldPrice()
                        .then((price) => {
                            if (price) setZakatGoldPrice(`${price}`);
                        })
                        .catch((e) => console.error(e));
                }

                if (feature.type === "forum") {
                    setForumView("list");
                    setForumSearch("");
                    setForumPage(0);
                    setForumQuestions([]);
                    setForumTotal(0);
                    setForumHasMore(false);
                    setForumDetail(null);
                    setForumAnswers([]);
                    setForumError("");
                    setForumLoading(true);
                    try {
                        const result = await getForumQuestions({
                            page: 0,
                            size: 10,
                        });
                        setForumQuestions(result.items);
                        setForumTotal(result.total);
                        setForumPage(0);
                        setForumHasMore(result.hasMore);
                    } catch (err) {
                        setForumError(
                            err?.message ?? t("explore.forumLoadError"),
                        );
                    } finally {
                        setForumLoading(false);
                    }
                }

                return;
            }

            if (
                ["protected-list", "bookmarks", "notes", "user-wird"].includes(
                    feature.type,
                ) &&
                !session?.token
            ) {
                if (feature.type === "user-wird") return;
                setError(t("explore.loginFeature"));
                return;
            }

            setLoading(true);
            try {
                let nextItems = [];
                if (feature.type === "bookmarks") {
                    nextItems = await getBookmarkItems();
                } else if (feature.type === "notes") {
                    nextItems = await getAllNotes();
                } else if (feature.type === "quiz") {
                    nextItems = await getQuizQuestions();
                } else if (feature.type === "hijri") {
                    nextItems = await getHijriOverview();
                } else if (feature.type === "feed") {
                    const page = await getFeedPostPage({
                        page: 0,
                        size: EXPLORE_PAGE_SIZE,
                    });
                    nextItems = page.items;
                    setPagination({
                        page: 0,
                        hasMore: page.meta.hasMore,
                        loadingMore: false,
                    });
                } else if (feature.key === "blog" && isWebAppLayout) {
                    const [postsResult, categoriesResult] =
                        await Promise.allSettled([
                            getFeatureItemPage(feature, {
                                page: 0,
                                size: EXPLORE_PAGE_SIZE,
                            }),
                            getBlogCategoryItems(),
                        ]);
                    if (postsResult.status === "rejected")
                        throw postsResult.reason;
                    nextItems = postsResult.value.items;
                    setBlogCategoryOptions(
                        categoriesResult.status === "fulfilled"
                            ? normalizeBlogCategoryOptions(
                                  categoriesResult.value,
                              )
                            : [],
                    );
                    setPagination({
                        page: 0,
                        hasMore: postsResult.value.meta.hasMore,
                        loadingMore: false,
                    });
                } else if (feature.key === "leaderboard" && isWebAppLayout) {
                    const [streakResult, hafalanResult] =
                        await Promise.allSettled([
                            getFeatureItemPage(
                                {
                                    ...feature,
                                    endpoint: "/api/v1/leaderboard/streak",
                                },
                                { page: 0, size: EXPLORE_PAGE_SIZE },
                            ),
                            getFeatureItemPage(
                                {
                                    ...feature,
                                    endpoint: "/api/v1/leaderboard/hafalan",
                                },
                                { page: 0, size: EXPLORE_PAGE_SIZE },
                            ),
                        ]);
                    const streakPage =
                        streakResult.status === "fulfilled"
                            ? streakResult.value
                            : { items: [], meta: {} };
                    const hafalanPage =
                        hafalanResult.status === "fulfilled"
                            ? hafalanResult.value
                            : { items: [], meta: {} };
                    nextItems = [
                        makeLeaderboardDatasetItem("streak", streakPage),
                        makeLeaderboardDatasetItem("hafalan", hafalanPage),
                    ];
                    setPagination({
                        page: 0,
                        hasMore: false,
                        loadingMore: false,
                    });
                } else if (feature.type === "user-wird") {
                    const wirds = await getUserWirds();
                    nextItems = wirds.map(normalizeUserWirdItem);
                } else if (feature.endpoint) {
                    const paginated = isPaginatedFeature(feature);
                    const page = await getFeatureItemPage(
                        feature,
                        paginated
                            ? { page: 0, size: EXPLORE_PAGE_SIZE }
                            : undefined,
                    );
                    nextItems = page.items;
                    setPagination({
                        page: 0,
                        hasMore: paginated && page.meta.hasMore,
                        loadingMore: false,
                    });
                }
                setItems(nextItems);
            } catch (err) {
                setError(
                    getFeatureLoadErrorMessage(feature, err, isWebAppLayout),
                );
            } finally {
                setLoading(false);
            }
        },
        [isWebAppLayout, session?.token, t],
    );

    const loadMoreFeature = useCallback(async () => {
        if (
            loadingMoreRef.current ||
            !activeFeature ||
            !isPaginatedFeature(activeFeature) ||
            loading ||
            pagination.loadingMore ||
            !pagination.hasMore
        ) {
            return;
        }

        const nextPage = pagination.page + 1;
        loadingMoreRef.current = true;
        setPagination((current) => ({ ...current, loadingMore: true }));
        setError("");

        try {
            const page =
                activeFeature.type === "feed"
                    ? await getFeedPostPage({
                          page: nextPage,
                          size: EXPLORE_PAGE_SIZE,
                      })
                    : await getFeatureItemPage(activeFeature, {
                          page: nextPage,
                          size: EXPLORE_PAGE_SIZE,
                      });
            const nextItems = page.items;
            const merged = mergeUniqueItems(items, nextItems);
            const addedCount = merged.length - items.length;
            setItems(merged);
            setPagination({
                page: nextPage,
                hasMore: page.meta.hasMore && addedCount > 0,
                loadingMore: false,
            });
        } catch (err) {
            setError(err?.message ?? t("explore.loadMoreError"));
            setPagination((current) => ({ ...current, loadingMore: false }));
        } finally {
            loadingMoreRef.current = false;
        }
    }, [
        activeFeature,
        items,
        loading,
        pagination.hasMore,
        pagination.loadingMore,
        pagination.page,
        t,
    ]);

    const loadZakatHistory = useCallback(async () => {
        try {
            const localItems = await readCalculatorHistory("zakat");
            const remoteItems = session?.token ? await getKalkulasiZakat() : [];
            setZakatHistory(mergeCalculatorHistory(remoteItems, localItems));
        } catch {
            /* silent */
        }
    }, [session?.token]);

    const handleToggleAmalan = useCallback(
        async (item) => {
            const raw = item?.raw ?? {};
            const id = raw.id ?? item?.id;
            if (id == null) return;

            const key = getExploreItemKey(item);
            const currentDone = Boolean(
                raw.is_checked ?? raw.done ?? raw.checked ?? item?.done,
            );
            const nextDone = !currentDone;
            const previousItems = items;

            setItems((current) =>
                current.map((entry) => {
                    if (getExploreItemKey(entry) !== key) return entry;
                    return {
                        ...entry,
                        done: nextDone,
                        raw: {
                            ...(entry.raw ?? {}),
                            checked: nextDone,
                            done: nextDone,
                            is_checked: nextDone,
                        },
                    };
                }),
            );

            try {
                await checkAmalan(id);
                if (nextDone) {
                    logActivity("amalan").catch(() => {});
                }
            } catch {
                setItems(previousItems);
                showError(t("explore.amalanUpdateError"));
            }
        },
        [items, showError, t],
    );

    const loadBookmarks = useCallback(async () => {
        if (!session?.token) {
            setBookmarks({});
            return;
        }

        try {
            const items = await getBookmarks();
            setBookmarks(
                items.reduce((acc, item) => {
                    acc[refKey(item.ref_type, item.ref_id)] = item;
                    return acc;
                }, {}),
            );
        } catch {
            setBookmarks({});
        }
    }, [session?.token]);

    const toggleBookmark = async (item) => {
        if (!activeFeature || !session?.token) {
            setError(t("explore.loginBookmark"));
            showInfo(t("explore.loginBookmark"));
            return;
        }

        const ref = getItemRef(activeFeature, item);
        const key = refKey(ref.refType, ref.refId);
        setSavingBookmark(key);
        setError("");

        try {
            const existing = bookmarks[key];
            if (existing?.id) {
                await deleteBookmark(existing.id);
                setBookmarks((current) => {
                    const next = { ...current };
                    delete next[key];
                    return next;
                });
                showSuccess(t("explore.bookmarkRemoved"));
            } else {
                const created = await addBookmark(ref);
                setBookmarks((current) => ({
                    ...current,
                    [key]: created?.data ?? created,
                }));
                showSuccess(t("explore.bookmarkSaved"));
            }
        } catch (err) {
            const nextMessage = err?.message ?? t("explore.bookmarkSaveError");
            setError(nextMessage);
            showError(nextMessage);
        } finally {
            setSavingBookmark("");
        }
    };

    const handleLikeFeedItem = async (item) => {
        if (!session?.token) {
            setError(t("explore.loginLikeFeed"));
            showInfo(t("explore.loginLikeFeed"));
            return;
        }

        setLikingFeedId(item.id);
        setError("");

        try {
            const updated = await likeFeedPost(item.raw?.id ?? item.id);
            setItems((current) =>
                current.map((entry) =>
                    entry.id === item.id ? updated : entry,
                ),
            );
            if (selectedItem?.id === item.id) {
                setSelectedItem(updated);
            }
            showSuccess(t("explore.feedUpdated"));
        } catch (err) {
            const nextMessage = err?.message ?? t("explore.feedLikeError");
            setError(nextMessage);
            showError(nextMessage);
        } finally {
            setLikingFeedId("");
        }
    };

    const handleHideFeedItem = async (item) => {
        if (!session?.token) {
            showInfo(t("explore.feedLoginRequired"));
            return;
        }

        setError("");
        try {
            await hideFeedPost(item.raw?.id ?? item.id);
            setItems((current) =>
                current.filter((entry) => entry.id !== item.id),
            );
            if (selectedItem?.id === item.id) {
                setSelectedItem(null);
            }
            showSuccess(t("explore.feedHidden"));
        } catch (err) {
            const nextMessage = err?.message ?? t("explore.feedHideError");
            setError(nextMessage);
            showError(nextMessage);
        }
    };

    const handleReportFeedItem = async (item) => {
        if (!session?.token) {
            showInfo(t("explore.feedLoginRequired"));
            return;
        }

        setError("");
        try {
            await reportFeedPost(item.raw?.id ?? item.id);
            showSuccess(t("explore.feedReported"));
        } catch (err) {
            const nextMessage = err?.message ?? t("explore.feedReportError");
            setError(nextMessage);
            showError(nextMessage);
        }
    };

    const loadFeedComments = useCallback(async (item) => {
        const ref = getItemRef({ type: "feed" }, item);
        if (!ref.refType || !ref.refId) return;

        setCommentLoading(true);
        try {
            setFeedComments(await getCommentsByRef(ref));
        } catch {
            setFeedComments([]);
        } finally {
            setCommentLoading(false);
        }
    }, []);

    const submitFeedComment = async () => {
        const content = commentDraft.trim();
        if (!selectedItem || !content) return;
        if (!session?.token) {
            setError(t("explore.commentLoginRequired"));
            showInfo(t("explore.commentLoginRequired"));
            return;
        }

        const ref = getItemRef({ type: "feed" }, selectedItem);
        setCommentSaving(true);
        setError("");

        try {
            const created = await createComment({
                content,
                refId: ref.refId,
                refType: ref.refType,
            });
            setFeedComments((current) => [...current, created]);
            setCommentDraft("");
            showSuccess(t("explore.commentSaved"));
        } catch (err) {
            const nextMessage = err?.message ?? t("explore.commentSaveError");
            setError(nextMessage);
            showError(nextMessage);
        } finally {
            setCommentSaving(false);
        }
    };

    const resetUserWirdForm = () => {
        setEditingUserWirdId("");
        setUserWirdForm(emptyUserWirdForm);
    };

    const fillUserWirdForm = (item) => {
        const raw = item?.raw ?? {};
        setEditingUserWirdId(raw.id ?? item.id);
        setUserWirdForm({
            arabic: raw.arabic ?? "",
            count: `${raw.count ?? 1}`,
            note: raw.note ?? "",
            occasion: raw.occasion ?? "",
            source: raw.source ?? "",
            title: raw.title ?? item.title ?? "",
            translation: raw.translation ?? "",
            transliteration: raw.transliteration ?? "",
        });
    };

    const submitUserWird = async () => {
        const title = userWirdForm.title.trim();
        if (!title) {
            setError(t("explore.wirdTitleRequired"));
            showInfo(t("explore.wirdTitleRequired"));
            return false;
        }
        if (!session?.token) {
            setError(t("explore.loginWirdSave"));
            showInfo(t("explore.loginWirdSave"));
            return false;
        }

        const payload = {
            arabic: userWirdForm.arabic.trim(),
            count: Number(digitsOnly(userWirdForm.count)) || 1,
            note: userWirdForm.note.trim(),
            occasion: userWirdForm.occasion.trim(),
            source: userWirdForm.source.trim(),
            title,
            translation: userWirdForm.translation.trim(),
            transliteration: userWirdForm.transliteration.trim(),
        };

        setSavingUserWird(true);
        setError("");

        try {
            if (editingUserWirdId) {
                const updated = await updateUserWird(
                    editingUserWirdId,
                    payload,
                );
                const normalized = normalizeUserWirdItem(
                    updated?.data ?? updated,
                );
                setItems((current) =>
                    current.map((item) =>
                        item.id === normalized.id ? normalized : item,
                    ),
                );
                showSuccess(t("explore.wirdUpdated"));
            } else {
                const created = await createUserWird(payload);
                setItems((current) => [
                    normalizeUserWirdItem(created?.data ?? created),
                    ...current,
                ]);
                showSuccess(t("explore.wirdSaved"));
            }
            resetUserWirdForm();
            return true;
        } catch (err) {
            const nextMessage = err?.message ?? t("explore.wirdSaveError");
            setError(nextMessage);
            showError(nextMessage);
            return false;
        } finally {
            setSavingUserWird(false);
        }
    };

    const removeUserWird = async (item) => {
        const id = item?.raw?.id ?? item?.id;
        if (!id) return;
        if (!session?.token) {
            setError(t("explore.loginWirdDelete"));
            showInfo(t("explore.loginWirdDelete"));
            return;
        }

        setError("");
        try {
            await deleteUserWird(id);
            setItems((current) =>
                current.filter((entry) => entry.id !== item.id),
            );
            if (editingUserWirdId === id) resetUserWirdForm();
            showSuccess(t("explore.wirdDeleted"));
        } catch (err) {
            const nextMessage = err?.message ?? t("explore.wirdDeleteError");
            setError(nextMessage);
            showError(nextMessage);
        }
    };

    const openSource = useCallback(
        async (item) => {
            const raw = item?.raw ?? {};
            const sourceUrl = raw.source_url || raw.url || raw.link;
            if (sourceUrl) {
                try {
                    await Linking.openURL(sourceUrl);
                } catch (err) {
                    setError(err?.message ?? t("explore.sourceOpenError"));
                }
                return;
            }

            const refType = raw.ref_type;
            const refId = Number(raw.ref_id);
            if (!onOpenTab || !refType || !Number.isFinite(refId)) return;
            if (refType === "hadith") {
                onOpenTab("hadith", { hadithId: refId });
                return;
            }
            if (refType === "ayah") {
                try {
                    const ayah = await getAyahById(refId);
                    onOpenTab("quran", { surahNumber: ayah?.surahNumber ?? 1 });
                } catch (err) {
                    setError(err?.message ?? t("explore.sourceOpenError"));
                }
            }
        },
        [onOpenTab, t],
    );

    const runDictionarySearch = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setItems(await searchDictionary(dictionaryQuery));
        } catch (err) {
            setError(err?.message ?? t("explore.dictionarySearchError"));
        } finally {
            setLoading(false);
        }
    }, [dictionaryQuery, t]);

    const loadSurahContent = async (surahNumber) => {
        if (!activeFeature?.contentType || !surahNumber) return;

        setSelectedSurahNumber(surahNumber);
        setSelectedItem(null);
        setActiveNoteRef("");
        setTafsirMode("all");
        setError("");
        setLoading(true);
        setPagination({ page: 0, hasMore: false, loadingMore: false });

        try {
            const endpoint =
                activeFeature.contentType === "tafsir"
                    ? `/api/v1/tafsir/surah/${surahNumber}`
                    : `/api/v1/asbabun-nuzul/surah/${surahNumber}`;
            const page = await getFeatureItemPage(
                { ...activeFeature, endpoint, type: "list" },
                { page: 0, size: EXPLORE_PAGE_SIZE },
            );
            const nextItems = page.items;
            setItems(nextItems);
            setPagination({
                page: 0,
                hasMore: page.meta.hasMore,
                loadingMore: false,
            });
        } catch (err) {
            setItems([]);
            setError(err?.message ?? t("explore.surahLoadError"));
        } finally {
            setLoading(false);
        }
    };

    const togglePrayer = useCallback(
        async (prayerKey) => {
            const nowDone = !sholatLog[prayerKey];
            if (nowDone) hapticMedium();
            setSholatLog((current) => ({ ...current, [prayerKey]: nowDone }));
            try {
                await savePrayerLog({
                    date: new Date().toISOString().split("T")[0],
                    prayer: prayerKey,
                    status: nowDone ? "munfarid" : "missed",
                });
                showSuccess(
                    t(
                        nowDone
                            ? "explore.prayerMarkedDone"
                            : "explore.prayerMarkedMissed",
                        { prayer: prayerKey },
                    ),
                );
            } catch {
                setSholatLog((current) => ({
                    ...current,
                    [prayerKey]: !nowDone,
                }));
                showError(t("explore.prayerLogError"));
            }
        },
        [sholatLog, showError, showSuccess, t],
    );

    useEffect(() => {
        loadBookmarks();
    }, [loadBookmarks]);

    useEffect(() => {
        if (activeFeature?.type === "zakat" && zakatTab === 5)
            loadZakatHistory();
    }, [activeFeature?.type, loadZakatHistory, zakatTab]);

    useEffect(() => {
        if (!isActive) return;
        refreshDiscoveryState();
    }, [isActive, refreshDiscoveryState]);

    useEffect(() => {
        const featureKey = deepLinkTarget?.params?.featureKey;
        if (!featureKey || handledDeepLinkId.current === deepLinkTarget?.id)
            return;

        const feature = findFeatureByKey(featureKey);
        if (!feature) return;

        handledDeepLinkId.current = deepLinkTarget.id;
        loadFeature(feature, {
            focusSearch: Boolean(deepLinkTarget?.params?.focusSearch),
            returnTo: deepLinkTarget?.params?.returnTo ?? null,
        });
    }, [deepLinkTarget?.id, loadFeature]);

    useEffect(() => {
        return () => {
            if (zakatTimerRef.current) clearTimeout(zakatTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (activeFeature?.type !== "kamus" || !focusDictionaryInput) return;

        const timer = setTimeout(() => {
            dictionaryInputRef.current?.focus?.();
            setFocusDictionaryInput(false);
        }, 120);

        return () => clearTimeout(timer);
    }, [activeFeature?.type, focusDictionaryInput]);

    useEffect(() => {
        if (activeFeature?.type !== "feed" || !selectedItem) {
            setFeedComments([]);
            setCommentDraft("");
            return;
        }

        loadFeedComments(selectedItem);
    }, [activeFeature?.type, loadFeedComments, selectedItem]);

    useEffect(() => {
        if (activeFeature?.key !== "library" || !session?.token) {
            setLibraryProgressMap({});
            return;
        }

        let active = true;
        getLibraryProgressList()
            .then((items) => {
                if (!active) return;
                const nextMap = {};
                items.forEach((item) => {
                    const bookId =
                        item?.library_book_id ??
                        item?.book?.id ??
                        item?.Book?.id;
                    if (bookId) nextMap[String(bookId)] = item;
                });
                setLibraryProgressMap(nextMap);
            })
            .catch(() => {
                if (active) setLibraryProgressMap({});
            });

        return () => {
            active = false;
        };
    }, [activeFeature?.key, session?.token]);

    useEffect(() => {
        const bookId = selectedItem?.raw?.id ?? selectedItem?.id;
        if (
            activeFeature?.key !== "library" ||
            !selectedItem ||
            !session?.token ||
            !bookId
        ) {
            setLibraryProgress(null);
            setLibraryProgressDraft({
                currentPage: "",
                note: "",
                status: "reading",
            });
            setLibraryProgressMessage("");
            return;
        }

        let active = true;
        getLibraryProgress(bookId)
            .then((payload) => {
                const item = payload?.data ?? payload;
                if (!active || !item) return;
                setLibraryProgress(item);
                setLibraryProgressDraft({
                    currentPage: item.current_page
                        ? String(item.current_page)
                        : "",
                    note: item.note ?? "",
                    status: item.status ?? "reading",
                });
            })
            .catch(() => {
                if (active) setLibraryProgress(null);
            });

        return () => {
            active = false;
        };
    }, [activeFeature?.key, selectedItem, session?.token]);

    useEffect(() => {
        if (!isActive) return;
        if (selectedItem) {
            navigation?.setBack(() => {
                setSelectedItem(null);
                return true;
            });
        } else if (activeFeature?.type === "forum" && forumView !== "list") {
            navigation?.setBack(() => {
                setForumView("list");
                setForumDetail(null);
                setForumAnswers([]);
                setForumError("");
                return true;
            });
        } else if (activeFeature) {
            navigation?.setBack(() => {
                clearFeature();
                return true;
            });
        } else {
            navigation?.clearBack?.();
        }
    }, [
        isActive,
        selectedItem,
        activeFeature,
        forumView,
        navigation,
        featureReturnRoute,
    ]);

    const scoreQuiz = () => {
        if (!items.length) return 0;
        return items.reduce((total, item) => {
            const correct =
                item.raw?.correct_answer ??
                item.raw?.answer_key ??
                item.raw?.answer;
            const selected = answers[item.id];
            if (!correct || !selected) return total;
            const normalizedCorrect = `${correct}`.trim().toLowerCase();
            const selectedKey = `${selected.key ?? ""}`.trim().toLowerCase();
            const selectedLabel = `${selected.label ?? ""}`
                .trim()
                .toLowerCase();
            return (
                total +
                (selectedKey === normalizedCorrect ||
                selectedLabel === normalizedCorrect
                    ? 1
                    : 0)
            );
        }, 0);
    };

    const openItemDetail = (item) => {
        setItemActionSheet({ visible: false, item: null });
        setSelectedItem(item);
        setActiveNoteRef("");
    };

    const shouldLoadMore = Boolean(
        activeFeature &&
        isPaginatedFeature(activeFeature) &&
        items.length &&
        pagination.hasMore,
    );
    const screenTitle = activeFeature?.title ?? "Belajar";
    const screenSubtitle = activeFeature
        ? ["Belajar", activeFeature.group, activeFeature.subtitle]
              .filter(Boolean)
              .join(" · ")
        : "Kajian, referensi Islam, dan fitur personal.";
    const visibleItems =
        activeFeature?.key === "library" && libraryProgressFilter
            ? items.filter((item) => {
                  const bookId = item?.raw?.id ?? item?.id;
                  const progress = bookId
                      ? libraryProgressMap[String(bookId)]
                      : null;
                  return progress?.status === libraryProgressFilter;
              })
            : items;
    const {
        clearFeature,
        renderDetailScreen,
        renderFeatureContent,
        renderItem,
        renderItemActionSheet,
        renderLibraryProgressFilters,
    } = createExploreClassicRenderers({
        activeFeature,
        activeNoteRef,
        answers,
        asmaulCounts,
        asmaulFlashcardRevealed,
        asmaulIndex,
        asmaulLoading,
        asmaulNames,
        bookmarks,
        commentDraft,
        commentLoading,
        commentSaving,
        dictionaryInputRef,
        dictionaryQuery,
        editingUserWirdId,
        error,
        faraidh,
        faraidhCatatan,
        faraidhHistory,
        featureReturnRoute,
        feedComments,
        fillUserWirdForm,
        focusDictionaryInput,
        forumAnswerDraft,
        forumAnswers,
        forumAskBody,
        forumAskTags,
        forumAskTitle,
        forumDetail,
        forumError,
        forumHasMore,
        forumLoading,
        forumPage,
        forumQuestions,
        forumSaving,
        forumSearch,
        forumSlug,
        forumTotal,
        forumView,
        forumVotingId,
        handleHideFeedItem,
        handleLikeFeedItem,
        handleReportFeedItem,
        handleTogglePinnedFeature,
        isWebAppLayout,
        items,
        itemActionSheet,
        libraryProgress,
        libraryProgressDraft,
        libraryProgressFilter,
        libraryProgressMap,
        libraryProgressMessage,
        libraryProgressSaving,
        likingFeedId,
        loadFeature,
        loadSurahContent,
        loadMoreFeature,
        loadZakatHistory,
        loading,
        navigation,
        onOpenTab,
        openItemDetail,
        openSource,
        pagination,
        pinnedFeatureKeys,
        recentFeatureKeys,
        removeUserWird,
        resetUserWirdForm,
        runDictionarySearch,
        savingBookmark,
        savingFaraidh,
        savingUserWird,
        scoreQuiz,
        setBlogCategoryOptions,
        setError,
        setFaraidhHistory,
        setFeedComments,
        setForumAnswers,
        setForumDetail,
        setForumError,
        setForumHasMore,
        setForumLoading,
        setForumPage,
        setForumQuestions,
        setForumSaving,
        setForumSlug,
        setForumTotal,
        setForumVotingId,
        setItems,
        setLibraryProgress,
        setLibraryProgressMap,
        setLibraryProgressSaving,
        setNotesSearch,
        setSavingFaraidh,
        setZakatHistory,
        setZakatSavedMsg,
        setZakatSaving,
        showError,
        showInfo,
        showSuccess,
        submitUserWird,
        selectedItem,
        selectedSurahNumber,
        session,
        setActiveFeature,
        setActiveNoteRef,
        setAnswers,
        setAsmaulCounts,
        setAsmaulFlashcardRevealed,
        setAsmaulIndex,
        setCommentDraft,
        setDictionaryQuery,
        setFaraidh,
        setFaraidhCatatan,
        setFeatureReturnRoute,
        setForumAnswerDraft,
        setForumAskBody,
        setForumAskTags,
        setForumAskTitle,
        setForumSearch,
        setForumView,
        setItemActionSheet,
        setLibraryProgressDraft,
        setLibraryProgressFilter,
        setLibraryProgressMessage,
        setSelectedItem,
        setSelectedSurahNumber,
        setShowFaraidhHistory,
        setSholatLog,
        setSurahSearch,
        setTasbih,
        setTafsirMode,
        setUserWirdForm,
        setZakat,
        setZakatFamilyCount,
        setZakatGoldGrams,
        setZakatGoldHaul,
        setZakatGoldPrice,
        setZakatHarvestIrrigated,
        setZakatHarvestWeight,
        setZakatHaul,
        setZakatRiceKgPrice,
        setZakatRicePrice,
        setZakatSilverGrams,
        setZakatSilverPrice,
        setZakatTab,
        setZakatTradeCapital,
        setZakatTradeDebt,
        setZakatTradeHaul,
        setZakatTradeReceivable,
        setZakatTradeStock,
        sholatLog,
        showFaraidhHistory,
        submitFeedComment,
        surahSearch,
        surahs,
        tafsirMode,
        tasbih,
        toggleBookmark,
        togglePrayer,
        userWirdForm,
        visibleItems,
        visibleSurahOptions,
        zakat,
        zakatFamilyCount,
        zakatGoldGrams,
        zakatGoldHaul,
        zakatGoldPrice,
        zakatHarvestIrrigated,
        zakatHarvestWeight,
        zakatHaul,
        zakatHistory,
        zakatRiceKgPrice,
        zakatRicePrice,
        zakatSavedMsg,
        zakatSaving,
        zakatSilverGrams,
        zakatSilverPrice,
        zakatTab,
        zakatTradeCapital,
        zakatTradeDebt,
        zakatTradeHaul,
        zakatTradeReceivable,
        zakatTradeStock,
        zakatTimerRef,
    });

    const listFooter = (
        <>
            {pagination.loadingMore ? (
                <View style={styles.loadMoreFooter}>
                    <ActivityIndicator color={colors.primary} size='small' />
                    <Text style={styles.loadMoreText}>
                        {t("explore.loadingMore")}
                    </Text>
                </View>
            ) : null}
            {renderItemActionSheet()}
        </>
    );

    if (selectedItem) {
        return renderDetailScreen();
    }

    if (isWebAppLayout) {
        const webAppRoute = renderExploreWebAppRoute({
            activeFeature,
            answers,
            asmaulCounts,
            asmaulFlashcardRevealed,
            asmaulIndex,
            asmaulLoading,
            asmaulNames,
            blogCategory,
            blogCategoryOptions,
            blogSearch,
            clearFeature,
            dictionaryInputRef,
            dictionaryQuery,
            editingUserWirdId,
            error,
            faraidh,
            faraidhCatatan,
            faraidhHistory,
            featureSearch,
            fillUserWirdForm,
            focusDictionaryInput,
            forumAnswerDraft,
            forumAnswers,
            forumAskBody,
            forumAskTags,
            forumAskTitle,
            forumDetail,
            forumError,
            forumHasMore,
            forumLoading,
            forumPage,
            forumQuestions,
            forumSaving,
            forumSearch,
            forumSlug,
            forumTotal,
            forumView,
            forumVotingId,
            handleHideFeedItem,
            handleLikeFeedItem,
            handleReportFeedItem,
            handleTogglePinnedFeature,
            items,
            kajianCategory,
            kajianSearch,
            leaderboardTab,
            libraryProgressFilter,
            libraryProgressMap,
            likingFeedId,
            loadFeature,
            loadSurahContent,
            loadMoreFeature,
            loadZakatHistory,
            loading,
            notesSearch,
            onToggleAmalan: handleToggleAmalan,
            onOpenKajianUrl: (url) => {
                Linking.openURL(url).catch(() =>
                    setError(t("explore.kajianLinkError")),
                );
            },
            onOpenTab,
            openItemDetail,
            pagination,
            pinnedFeatureKeys,
            recentFeatureKeys,
            renderItemActionSheet,
            renderFeatureContent,
            renderItem,
            runDictionarySearch,
            scoreQuiz,
            selectedSurahNumber,
            session,
            setActiveNoteRef,
            setAnswers,
            setAsmaulCounts,
            setAsmaulFlashcardRevealed,
            setAsmaulIndex,
            setBlogCategory,
            setBlogSearch,
            setDictionaryQuery,
            setFeatureSearch,
            setForumAnswerDraft,
            setForumAnswers,
            setForumAskBody,
            setForumAskTags,
            setForumAskTitle,
            setForumDetail,
            setForumError,
            setForumHasMore,
            setForumLoading,
            setForumPage,
            setForumQuestions,
            setForumSaving,
            setForumSearch,
            setForumSlug,
            setForumTotal,
            setForumView,
            setForumVotingId,
            setItemActionSheet,
            setKajianCategory,
            setKajianSearch,
            setLeaderboardTab,
            setLibraryProgressFilter,
            setNotesSearch,
            setSelectedItem,
            setSurahSearch,
            setTasbih,
            setUserWirdForm,
            setZakat,
            setZakatFamilyCount,
            setZakatGoldGrams,
            setZakatGoldHaul,
            setZakatGoldPrice,
            setZakatHarvestIrrigated,
            setZakatHarvestWeight,
            setZakatHaul,
            setZakatHistory,
                setZakatRiceKgPrice,
            setZakatRicePrice,
            setZakatSavedMsg,
            setZakatSaving,
            setZakatSilverGrams,
            setZakatSilverPrice,
            setZakatTab,
            setZakatTradeCapital,
            setZakatTradeDebt,
            setZakatTradeHaul,
            setZakatTradeReceivable,
            setZakatTradeStock,
            sholatLog,
            showError,
            showInfo,
            submitUserWird,
            surahSearch,
            surahs,
            tasbih,
            togglePrayer,
            userWirdForm,
            visibleItems,
            webAppExploreTheme,
            webAppExploreThemeStyles,
            removeUserWird,
            resetUserWirdForm,
            savingUserWird,
            savingFaraidh,
            setFaraidh,
            setFaraidhCatatan,
            setFaraidhHistory,
            setSavingFaraidh,
            setShowFaraidhHistory,
            showFaraidhHistory,
            zakat,
            zakatFamilyCount,
            zakatGoldGrams,
            zakatGoldHaul,
            zakatGoldPrice,
            zakatHarvestIrrigated,
            zakatHarvestWeight,
            zakatHaul,
            zakatHistory,
            zakatRiceKgPrice,
            zakatRicePrice,
            zakatSavedMsg,
            zakatSaving,
            zakatSilverGrams,
            zakatSilverPrice,
            zakatTab,
            zakatTimerRef,
            zakatTradeCapital,
            zakatTradeDebt,
            zakatTradeHaul,
            zakatTradeReceivable,
            zakatTradeStock,
        });

        if (webAppRoute) return webAppRoute;
    }

    return (
        <Screen
            contentStyle={isWebAppLayout ? styles.webAppSurface : null}
            title={screenTitle}
            subtitle={screenSubtitle}
            onEndReached={shouldLoadMore ? loadMoreFeature : undefined}
            listData={activeFeature ? visibleItems : undefined}
            listFooter={activeFeature ? listFooter : undefined}
            listKeyExtractor={(item, index) =>
                `${getExploreItemKey(item)}-${index}`
            }
            renderListItem={({ item, index }) => renderItem(item, index)}
            actions={
                activeFeature ? (
                    <IconActionButton
                        Icon={ArrowLeft}
                        label='Kembali ke Belajar'
                        onPress={clearFeature}
                    />
                ) : (
                    <IconActionButton
                        Icon={UserCircle}
                        label='Buka Profil'
                        onPress={() => onOpenTab?.("profile")}
                    />
                )
            }
        >
            <View
                testID={
                    isWebAppLayout
                        ? "explore-web-app-surface"
                        : "explore-classic-surface"
                }
            />
            {!activeFeature && (
                <>
                    <PaperSearchInput
                        onChangeText={setFeatureSearch}
                        placeholder='Cari kajian, tafsir, kamus, perawi, quiz...'
                        value={featureSearch}
                    />
                    <FeatureCatalog
                        featureSearch={featureSearch}
                        onFeaturePress={loadFeature}
                        onTogglePinnedFeature={handleTogglePinnedFeature}
                        pinnedFeatureKeys={pinnedFeatureKeys}
                        recentFeatureKeys={recentFeatureKeys}
                    />
                </>
            )}

            {renderFeatureContent()}
            {renderLibraryProgressFilters()}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading ? (
                <ActivityIndicator
                    color={colors.primary}
                    style={styles.loader}
                />
            ) : null}
            {activeFeature?.type === "quiz" && items.length ? (
                <Text style={styles.result}>
                    Dijawab {Object.keys(answers).length}/{items.length}, skor{" "}
                    {scoreQuiz()}
                </Text>
            ) : null}
            {!loading &&
            activeFeature &&
            !error &&
            !items.length &&
            !LOCAL_TOOL_TYPES.includes(activeFeature.type) &&
            !(activeFeature.type === "user-wird" && !session?.token) ? (
                <Text style={styles.empty}>
                    {activeFeature.type === "bookmarks"
                        ? t("explore.empty.bookmarks")
                        : activeFeature.type === "notes"
                          ? t("explore.empty.notes")
                          : activeFeature.type === "feed"
                            ? t("explore.empty.feed")
                            : activeFeature.type === "user-wird"
                              ? t("explore.empty.userWird")
                              : t("explore.empty.default")}
                </Text>
            ) : null}
            {!loading &&
            activeFeature?.key === "library" &&
            libraryProgressFilter &&
            items.length > 0 &&
            visibleItems.length === 0 ? (
                <Text style={styles.empty}>
                    {t("explore.empty.libraryFilter", {
                        status: getLibraryProgressLabel(libraryProgressFilter),
                    })}
                </Text>
            ) : null}
            {!loading &&
            activeFeature?.type === "surah-content" &&
            selectedSurahNumber &&
            !error &&
            !items.length ? (
                <Text style={styles.empty}>
                    {t("explore.empty.surahContent")}
                </Text>
            ) : null}
            {!activeFeature ? renderItemActionSheet() : null}
        </Screen>
    );
}
