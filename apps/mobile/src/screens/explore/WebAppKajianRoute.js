import {
    Bookmark,
    BookOpen,
    ExternalLink,
    Play,
    Search,
    Trash2,
    Youtube,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, radius, spacing, touchTarget } from "../../theme";
import { KajianPlayerModal } from "../../components/KajianPlayerModal";
import { readSession } from "../../storage/session";
import {
    listSyncedKajianBookmarks,
    removeSyncedKajianBookmark,
} from "../../api/explore";

const ACCENT = "#10b981";

const SEARCH_MODES = [
    {
        key: "hybrid",
        label: "Hybrid",
        icon: "⚡",
        desc: "Persis dulu, lalu makna",
    },
    { key: "exact", label: "Exact", icon: "🔤", desc: "Frasa persis" },
    {
        key: "semantic",
        label: "Semantic",
        icon: "🧠",
        desc: "Kata dasar & ejaan lain",
    },
];
const TRANSCRIPT_PAGE_SIZE = 20;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Terms to highlight: the API's expanded terms (query words minus stopwords
// plus spelling variants), falling back to the raw query tokens.
function highlightTokens(query, extraTerms = []) {
    const fromApi = (extraTerms || [])
        .map((t) => String(t).toLowerCase())
        .filter((t) => t.length > 2);
    const lowerQuery = (query || "").toLowerCase().trim();
    const fromQuery = lowerQuery.split(/\s+/).filter((t) => t.length > 2);
    const phrase = fromQuery.length > 1 ? [lowerQuery] : [];
    return [...new Set([...phrase, ...(fromApi.length ? fromApi : fromQuery)])];
}

function HighlightedText({ text, query, terms, style, numberOfLines }) {
    const tokens = highlightTokens(query, terms);
    if (!text || tokens.length === 0) {
        return (
            <Text numberOfLines={numberOfLines} style={style}>
                {text}
            </Text>
        );
    }
    const pattern = `(${tokens.map(escapeRegex).join("|")})`;
    const parts = String(text).split(new RegExp(pattern, "gi"));
    const matcher = new RegExp(`^${pattern}$`, "i");
    return (
        <Text numberOfLines={numberOfLines} style={style}>
            {parts.map((part, index) =>
                matcher.test(part) ? (
                    <Text key={index} style={styles.highlight}>
                        {part}
                    </Text>
                ) : (
                    <Text key={index}>{part}</Text>
                ),
            )}
        </Text>
    );
}

// Why a card matched (match_reason), falling back to the legacy match_mode.
function matchBadge(item) {
    switch (item.match_reason) {
        case "phrase":
            return { style: styles.modeBadgeExact, text: "🔤 FRASA PERSIS" };
        case "all_terms":
            return { style: styles.modeBadgeHybrid, text: "✅ SEMUA KATA" };
        case "some_terms":
            return {
                style: styles.modeBadgeSemantic,
                text: "🧠 SEBAGIAN KATA",
            };
        case "fuzzy":
            return { style: styles.modeBadgeFuzzy, text: "≈ EJAAN MIRIP" };
        case "title":
            return { style: styles.modeBadgeTitle, text: "🏷️ JUDUL / TOPIK" };
        default:
            if (item.match_mode === "exact") {
                return { style: styles.modeBadgeExact, text: "🔤 EXACT" };
            }
            if (item.match_mode === "semantic") {
                return { style: styles.modeBadgeSemantic, text: "🧠 SEMANTIC" };
            }
            return { style: styles.modeBadgeHybrid, text: "⚡ HYBRID" };
    }
}

function getYouTubeId(url) {
    if (!url) return null;
    const m = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    return m ? m[1] : null;
}

function KajianCard({
    getDescription,
    getDuration,
    getItemKey,
    getSpeaker,
    getTitle,
    getTopic,
    getType,
    getUrl,
    index,
    isDarkTheme,
    item,
    onOpenItem,
    onOpenPlayer,
    onOpenUrl,
}) {
    const type = getType(item);
    const topic = getTopic(item);
    const speaker = getSpeaker(item);
    const duration = getDuration(item);
    const description = getDescription(item);
    const url = getUrl(item);
    const videoId = getYouTubeId(url);

    return (
        <Pressable
            accessibilityRole='button'
            key={`${getItemKey(item)}-${index}`}
            onPress={() => {
                if (videoId && onOpenPlayer) {
                    onOpenPlayer({
                        ...item,
                        kajian_id: item.id,
                        video_id: videoId,
                        title: getTitle(item, index),
                        speaker,
                        topic,
                        start_seconds: 0,
                        end_seconds: 0,
                        timestamp: "00:00",
                        timestamp_url: url,
                        snippet: description,
                    });
                    return;
                }
                if (url) {
                    onOpenUrl(url);
                    return;
                }
                onOpenItem(item);
            }}
            style={[styles.card, isDarkTheme && styles.cardDark]}
            testID='web-app-kajian-card'
        >
            {videoId ? (
                <View style={styles.thumbnailWrapper}>
                    <Image
                        source={{
                            uri: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                        }}
                        style={styles.thumbnail}
                    />
                    <View style={styles.playOverlay}>
                        <View style={styles.playButtonCircle}>
                            <Play color='#ffffff' fill='#ffffff' size={16} />
                        </View>
                    </View>
                </View>
            ) : null}

            <View style={styles.cardHeader}>
                <View style={styles.badges}>
                    {type ? (
                        <Text
                            style={[
                                styles.badge,
                                isDarkTheme && styles.badgeDark,
                                type === "video" && (isDarkTheme ? styles.badgeVideoDark : styles.badgeVideo),
                            ]}
                        >
                            {type}
                        </Text>
                    ) : null}
                    {topic ? <Text style={[styles.badge, isDarkTheme && styles.badgeDark]}>{topic}</Text> : null}
                </View>
                {url ? (
                    <ExternalLink color={isDarkTheme ? "#9ca3af" : "#9ca3af"} size={16} strokeWidth={2.2} />
                ) : null}
            </View>
            <Text numberOfLines={2} style={[styles.cardTitle, isDarkTheme && styles.cardTitleDark]}>
                {getTitle(item, index)}
            </Text>
            {speaker ? <Text style={[styles.speaker, isDarkTheme && styles.speakerDark]}>{speaker}</Text> : null}
            {duration ? <Text style={[styles.duration, isDarkTheme && styles.durationDark]}>{duration}</Text> : null}
            {description ? (
                <Text numberOfLines={3} style={[styles.description, isDarkTheme && styles.descriptionDark]}>
                    {description}
                </Text>
            ) : null}
        </Pressable>
    );
}

function TranscriptCard({
    highlightTerms = [],
    isDarkTheme,
    item,
    onOpenPlayer,
    onOpenUrl,
    query = "",
}) {
    const videoId = item.video_id || getYouTubeId(item.timestamp_url);
    const badge = matchBadge(item);

    return (
        <Pressable
            accessibilityRole='button'
            onPress={() =>
                onOpenPlayer
                    ? onOpenPlayer(item)
                    : onOpenUrl(item.timestamp_url)
            }
            style={[styles.transcriptCard, isDarkTheme && styles.transcriptCardDark]}
        >
            <View style={styles.transcriptContent}>
                {videoId ? (
                    <View style={styles.transcriptThumbWrapper}>
                        <Image
                            source={{
                                uri: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                            }}
                            style={styles.transcriptThumb}
                        />
                        <View style={styles.transcriptTimeBadge}>
                            <Text style={styles.transcriptTimeText}>
                                {item.timestamp}
                            </Text>
                        </View>
                    </View>
                ) : null}

                <View style={styles.transcriptDetails}>
                    <View style={styles.modeBadgeRow}>
                        <Text style={[styles.modeBadge, badge.style]}>
                            {badge.text}
                        </Text>
                        {item.match_count > 1 ? (
                            <Text style={[styles.matchCount, isDarkTheme && styles.matchCountDark]}>
                                {item.match_count} potongan cocok
                            </Text>
                        ) : null}
                    </View>

                    <Text numberOfLines={2} style={[styles.transcriptTitle, isDarkTheme && styles.transcriptTitleDark]}>
                        {item.title}
                    </Text>

                    <Text style={[styles.transcriptSpeaker, isDarkTheme && styles.transcriptSpeakerDark]}>
                        {item.speaker} · ⏱️ {item.timestamp}
                    </Text>

                    <HighlightedText
                        numberOfLines={3}
                        query={query}
                        style={[styles.transcriptSnippet, isDarkTheme && styles.transcriptSnippetDark]}
                        terms={[
                            ...highlightTerms,
                            ...(item.matched_terms || []),
                        ]}
                        text={`\u201c${item.snippet || ""}\u201d`}
                    />

                    <View style={styles.watchRow}>
                        <Youtube color='#ef4444' size={14} />
                        <Text style={styles.watchText}>
                            Tonton @ {item.timestamp}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

function KajianStat({ accent = "#047857", formatValue, isDarkTheme, label, value }) {
    return (
        <View style={[styles.statCard, isDarkTheme && styles.statCardDark]}>
            <Text style={[styles.statLabel, isDarkTheme && styles.statLabelDark]}>{label}</Text>
            <Text style={[styles.statValue, { color: accent }]}>
                {formatValue(value)}
            </Text>
        </View>
    );
}

export function WebAppKajianRoute({
    apiUrl = "https://api.thollabulilmi.site",
    categories,
    clearFeature,
    error,
    filteredItems,
    formatStat,
    getDescription,
    getDuration,
    getItemKey,
    getSpeaker,
    getTitle,
    getTopic,
    getType,
    getUrl,
    kajianCategory,
    kajianSearch,
    loading,
    navigation,
    onOpenItem,
    onOpenUrl,
    onSearch,
    onSelectCategory,
    summary,
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme } = useLayoutModePreference();
    const [tab, setTab] = useState("list");

    // Transcript Search State
    const [transcriptQuery, setTranscriptQuery] = useState("");
    const [searchMode, setSearchMode] = useState("hybrid");
    const [speakerFilter, setSpeakerFilter] = useState("");
    const [transcriptResults, setTranscriptResults] = useState([]);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [transcriptLoadingMore, setTranscriptLoadingMore] = useState(false);
    const [transcriptMeta, setTranscriptMeta] = useState(null);
    const [transcriptPage, setTranscriptPage] = useState(1);
    // Bumped when the search inputs change so a stale "load more" response
    // is dropped instead of appended to the new result list.
    const transcriptRequestRef = useRef(0);
    const [speakers, setSpeakers] = useState([]);

    // Player modal
    const [playerItem, setPlayerItem] = useState(null);

    // Bookmarks state
    const [savedBookmarks, setSavedBookmarks] = useState([]);
    const [savedQuery, setSavedQuery] = useState("");

    useEffect(() => {
        if (!navigation?.setHeader) return;
        if (playerItem) {
            navigation.setHeader({
                showBack: true,
                title: playerItem.title || "Pemutar",
                onBack: () => {
                    setPlayerItem(null);
                    return true;
                },
            });
        } else if (tab !== "list") {
            navigation.setHeader({
                showBack: true,
                title: tab === "bookmarks" ? "Bookmark" : "Kajian",
                onBack: () => {
                    setTab("list");
                    return true;
                },
            });
        } else if (clearFeature) {
            navigation.setHeader({
                showBack: true,
                title: "Kajian",
                onBack: () => {
                    clearFeature();
                    return true;
                },
            });
        } else {
            navigation.setHeader(null);
        }
    }, [clearFeature, navigation, playerItem, tab]);

    const loadSavedBookmarks = useCallback(() => {
        AsyncStorage.getItem("kajian_saved_chunks")
            .then((raw) => {
                const list = raw ? JSON.parse(raw) : [];
                setSavedBookmarks(Array.isArray(list) ? list : []);
            })
            .catch(() => setSavedBookmarks([]));
    }, []);

    useEffect(() => {
        if (tab === "bookmarks" || !playerItem) {
            loadSavedBookmarks();
        }
    }, [tab, playerItem, loadSavedBookmarks]);

    // If signed in, pull synced bookmarks and merge.
    useEffect(() => {
        let active = true;
        Promise.all([
            readSession().catch(() => null),
            AsyncStorage.getItem("kajian_saved_chunks").catch(() => null),
        ])
            .then(([session, raw]) => {
                if (!active || !session?.token) return;
                const local = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(local)) return;
                return listSyncedKajianBookmarks().then((serverItems) => {
                    if (!active) return;
                    const seen = new Set();
                    const merged = [];
                    const add = (item) => {
                        if (!item?.id) return;
                        if (seen.has(item.id)) return;
                        seen.add(item.id);
                        merged.push(item);
                    };
                    const toTimestamp = (s) => {
                        const sec = Math.floor(Number(s) || 0);
                        const m = Math.floor(sec / 60);
                        const r = sec % 60;
                        return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
                    };
                    serverItems.forEach((row) => {
                        const ch = row.chunk || row.Chunk;
                        const kj = row.kajian || row.Kajian;
                        if (!ch) return;
                        add({
                            id: ch.id,
                            kajian_id: ch.kajian_id,
                            video_id: kj?.video_id,
                            title: kj?.title || row.title || "Kajian",
                            speaker: kj?.speaker || row.speaker || "",
                            topic: kj?.topic || row.topic || "",
                            start_seconds: ch.start_seconds,
                            end_seconds: ch.end_seconds,
                            timestamp: toTimestamp(ch.start_seconds),
                            timestamp_url:
                                ch.timestamp_url ||
                                (kj?.video_id
                                    ? `https://youtu.be/${kj.video_id}?t=${ch.start_seconds}`
                                    : ""),
                            snippet: ch.text || "",
                            created_at: row.created_at || null,
                        });
                    });
                    local.forEach(add);
                    if (merged.length !== local.length) {
                        AsyncStorage.setItem(
                            "kajian_saved_chunks",
                            JSON.stringify(merged),
                        ).catch(() => {});
                    }
                    setSavedBookmarks(merged);
                });
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [tab]);

    const removeSavedBookmark = (id) => {
        const next = savedBookmarks.filter((b) => b.id !== id);
        setSavedBookmarks(next);
        AsyncStorage.setItem("kajian_saved_chunks", JSON.stringify(next)).catch(
            () => {},
        );
        readSession()
            .then((session) => {
                if (!session?.token) return;
                removeSyncedKajianBookmark(id).catch(() => {});
            })
            .catch(() => {});
    };

    const filteredSaved = useMemo(() => {
        if (!savedQuery) return savedBookmarks;
        const q = savedQuery.toLowerCase();
        return savedBookmarks.filter((b) =>
            [b.title, b.speaker, b.topic, b.snippet]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q),
        );
    }, [savedBookmarks, savedQuery]);

    // Fetch Speakers List
    useEffect(() => {
        let active = true;
        fetch(`${apiUrl}/api/v1/kajian/speakers`)
            .then((r) => r.json())
            .then((data) => {
                if (!active) return;
                const list = Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                      ? data
                      : [];
                setSpeakers(list);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [apiUrl]);

    const buildTranscriptParams = useCallback(
        (page) => {
            const params = new URLSearchParams({
                q: transcriptQuery || "",
                mode: searchMode,
                page: String(page),
                limit: String(TRANSCRIPT_PAGE_SIZE),
            });
            if (speakerFilter) params.set("speaker", speakerFilter);
            return params;
        },
        [transcriptQuery, searchMode, speakerFilter],
    );

    // Search Transcripts with Debounce
    useEffect(() => {
        if (tab !== "transcript") return;
        transcriptRequestRef.current += 1;
        setTranscriptPage(1);
        if (!transcriptQuery.trim()) {
            setTranscriptResults([]);
            setTranscriptMeta(null);
            setTranscriptLoading(false);
            return undefined;
        }
        let active = true;
        const timer = setTimeout(() => {
            setTranscriptLoading(true);
            const params = buildTranscriptParams(1);

            fetch(`${apiUrl}/api/v1/kajian/search?${params.toString()}`)
                .then((r) => r.json())
                .then((data) => {
                    if (!active) return;
                    const items = data?.items ?? data?.data?.items ?? [];
                    setTranscriptResults(items);
                    setTranscriptMeta(data?.meta ?? data?.data?.meta ?? null);
                })
                .catch(() => {
                    if (active) {
                        setTranscriptResults([]);
                        setTranscriptMeta(null);
                    }
                })
                .finally(() => {
                    if (active) setTranscriptLoading(false);
                });
        }, 350);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [buildTranscriptParams, tab, apiUrl, transcriptQuery]);

    const transcriptTotal = Math.max(
        Number(transcriptMeta?.total) || 0,
        transcriptResults.length,
    );
    const transcriptTotalLabel = transcriptMeta?.truncated
        ? `${transcriptTotal}+`
        : `${transcriptTotal}`;

    const loadMoreTranscripts = useCallback(() => {
        if (
            transcriptLoadingMore ||
            transcriptLoading ||
            !transcriptMeta?.has_more
        ) {
            return;
        }
        const requestId = transcriptRequestRef.current;
        const nextPage = transcriptPage + 1;
        setTranscriptLoadingMore(true);
        const params = buildTranscriptParams(nextPage);
        fetch(`${apiUrl}/api/v1/kajian/search?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                if (requestId !== transcriptRequestRef.current) return;
                const items = data?.items ?? data?.data?.items ?? [];
                const meta = data?.meta ?? data?.data?.meta ?? null;
                setTranscriptResults((prev) => {
                    const seen = new Set(prev.map((r) => r.id));
                    return [...prev, ...items.filter((r) => !seen.has(r.id))];
                });
                if (meta) {
                    setTranscriptMeta((prev) => ({ ...(prev || {}), ...meta }));
                }
                setTranscriptPage(nextPage);
            })
            .catch(() => {})
            .finally(() => {
                if (requestId === transcriptRequestRef.current) {
                    setTranscriptLoadingMore(false);
                }
            });
    }, [
        apiUrl,
        buildTranscriptParams,
        transcriptLoading,
        transcriptLoadingMore,
        transcriptMeta,
        transcriptPage,
    ]);

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-kajian-surface' />
            <View style={styles.header}>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>
                    {t("explore.kajian.title") || "Kajian Islam"}
                </Text>
                <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                    {t("explore.kajian.subtitle") ||
                        "Rekaman kajian dari ustadz-ustadz ahlus sunnah"}
                </Text>
            </View>

            <View style={styles.stats}>
                <KajianStat
                    formatValue={formatStat}
                    isDarkTheme={isDarkTheme}
                    label={t("explore.kajian.totalStat")}
                    value={summary.total}
                />
                <KajianStat
                    formatValue={formatStat}
                    isDarkTheme={isDarkTheme}
                    label={t("explore.kajian.videoStat")}
                    value={summary.videoCount}
                />
                <KajianStat
                    formatValue={formatStat}
                    isDarkTheme={isDarkTheme}
                    label={t("explore.kajian.categoryStat")}
                    value={summary.categoryCount}
                />
            </View>

            {/* Tab Switcher */}
            <View style={[styles.tabContainer, isDarkTheme && styles.tabContainerDark]}>
                <Pressable
                    accessibilityRole='button'
                    onPress={() => setTab("transcript")}
                    style={[
                        styles.tabButton,
                        isDarkTheme && styles.tabButtonDark,
                        tab === "transcript" && (isDarkTheme ? styles.tabButtonActiveDark : styles.tabButtonActive),
                    ]}
                    testID='web-app-kajian-tab-transcript'
                >
                    <Text
                        style={[
                            styles.tabButtonText,
                            isDarkTheme && styles.tabButtonTextDark,
                            tab === "transcript" && styles.tabButtonTextActive,
                        ]}
                    >
                        {t("explore.kajian.tabTranscript")}
                    </Text>
                </Pressable>
                <Pressable
                    accessibilityRole='button'
                    onPress={() => setTab("bookmarks")}
                    style={[
                        styles.tabButton,
                        isDarkTheme && styles.tabButtonDark,
                        tab === "bookmarks" && (isDarkTheme ? styles.tabButtonActiveDark : styles.tabButtonActive),
                    ]}
                    testID='web-app-kajian-tab-bookmarks'
                >
                    <Text
                        style={[
                            styles.tabButtonText,
                            isDarkTheme && styles.tabButtonTextDark,
                            tab === "bookmarks" && styles.tabButtonTextActive,
                        ]}
                    >
                        {t("explore.kajian.tabBookmarks")}
                    </Text>
                </Pressable>
                <Pressable
                    accessibilityRole='button'
                    onPress={() => setTab("list")}
                    style={[
                        styles.tabButton,
                        isDarkTheme && styles.tabButtonDark,
                        tab === "list" && (isDarkTheme ? styles.tabButtonActiveDark : styles.tabButtonActive),
                    ]}
                    testID='web-app-kajian-tab-list'
                >
                    <Text
                        style={[
                            styles.tabButtonText,
                            isDarkTheme && styles.tabButtonTextDark,
                            tab === "list" && styles.tabButtonTextActive,
                        ]}
                    >
                        {t("explore.kajian.tabList")}
                    </Text>
                </Pressable>
            </View>

            {tab === "transcript" ? (
                <View>
                    {/* Search Input */}
                    <View style={[styles.searchBar, isDarkTheme && styles.searchBarDark]}>
                        <Search color='#10b981' size={18} />
                        <TextInput
                            onChangeText={setTranscriptQuery}
                            placeholder='Cari tema: "adab", "riba", "nikah", "doa"...'
                            placeholderTextColor={isDarkTheme ? "#64748b" : "#9ca3af"}
                            style={[styles.searchInput, isDarkTheme && styles.searchInputDark]}
                            value={transcriptQuery}
                        />
                    </View>

                    {/* Mode Selector */}
                    <View style={styles.modeContainer}>
                        {SEARCH_MODES.map((m) => (
                            <Pressable
                                key={m.key}
                                onPress={() => setSearchMode(m.key)}
                                style={[
                                    styles.modeButton,
                                    isDarkTheme && styles.modeButtonDark,
                                    searchMode === m.key &&
                                        (m.key === "exact"
                                            ? styles.modeButtonExact
                                            : m.key === "semantic"
                                              ? styles.modeButtonSemantic
                                              : styles.modeButtonHybrid),
                                ]}
                            >
                                <Text style={styles.modeIcon}>{m.icon}</Text>
                                <Text
                                    style={[
                                        styles.modeLabel,
                                        isDarkTheme && styles.modeLabelDark,
                                        searchMode === m.key &&
                                            styles.modeLabelActive,
                                    ]}
                                >
                                    {m.label}
                                </Text>
                                <Text numberOfLines={1} style={[styles.modeDesc, isDarkTheme && styles.modeDescDark]}>
                                    {m.desc}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Speaker Filter Pills */}
                    {speakers.length > 0 && (
                        <View style={styles.speakerSection}>
                            <Text style={[styles.speakerLabel, isDarkTheme && styles.speakerLabelDark]}>
                                FILTER USTADZ:
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.speakerScroll}
                            >
                                <Pressable
                                    onPress={() => setSpeakerFilter("")}
                                    style={[
                                        styles.speakerPill,
                                        isDarkTheme && styles.speakerPillDark,
                                        !speakerFilter &&
                                            styles.speakerPillActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.speakerPillText,
                                            isDarkTheme && styles.speakerPillTextDark,
                                            !speakerFilter &&
                                                styles.speakerPillTextActive,
                                        ]}
                                    >
                                        Semua
                                    </Text>
                                </Pressable>
                                {speakers.map((s) => (
                                    <Pressable
                                        key={s}
                                        onPress={() =>
                                            setSpeakerFilter(
                                                s === speakerFilter ? "" : s,
                                            )
                                        }
                                        style={[
                                            styles.speakerPill,
                                            isDarkTheme && styles.speakerPillDark,
                                            speakerFilter === s &&
                                                styles.speakerPillActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.speakerPillText,
                                                isDarkTheme && styles.speakerPillTextDark,
                                                speakerFilter === s &&
                                                    styles.speakerPillTextActive,
                                            ]}
                                        >
                                            {s.replace(
                                                /^Ust\.\s*Dr\.\s*/i,
                                                "Ust. ",
                                            )}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Results / Loading */}
                    {transcriptLoading ? (
                        <View style={styles.state}>
                            <ActivityIndicator color={ACCENT} size='small' />
                            <Text style={[styles.stateText, isDarkTheme && styles.stateTextDark]}>
                                Mencari potongan transkrip...
                            </Text>
                        </View>
                    ) : transcriptResults.length > 0 ? (
                        <View style={styles.grid}>
                            <Text style={[styles.resultsCount, isDarkTheme && styles.resultsCountDark]}>
                                {transcriptMeta?.mode === "semantic"
                                    ? `${transcriptResults.length} dari ${transcriptTotalLabel} kajian yang membahas tema ini`
                                    : `${transcriptResults.length} dari ${transcriptTotalLabel} potongan transkrip${
                                          transcriptMeta?.kajian_count
                                              ? ` • ${transcriptMeta.kajian_count} kajian`
                                              : ""
                                      }`}
                            </Text>
                            {transcriptResults.map((item) => (
                                <TranscriptCard
                                    highlightTerms={
                                        transcriptMeta?.expanded_terms || []
                                    }
                                    isDarkTheme={isDarkTheme}
                                    item={item}
                                    key={item.id}
                                    onOpenUrl={onOpenUrl}
                                    onOpenPlayer={setPlayerItem}
                                    query={transcriptQuery}
                                />
                            ))}
                            {transcriptMeta?.has_more ? (
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: transcriptLoadingMore,
                                    }}
                                    disabled={transcriptLoadingMore}
                                    onPress={loadMoreTranscripts}
                                    style={[
                                        styles.loadMoreButton,
                                        transcriptLoadingMore &&
                                            styles.loadMoreButtonDisabled,
                                    ]}
                                >
                                    {transcriptLoadingMore ? (
                                        <ActivityIndicator
                                            color='#ffffff'
                                            size='small'
                                        />
                                    ) : (
                                        <Text style={styles.loadMoreText}>
                                            Muat lebih banyak
                                        </Text>
                                    )}
                                </Pressable>
                            ) : null}
                        </View>
                    ) : (
                        <View style={styles.empty}>
                            <Search
                                color={isDarkTheme ? "#64748b" : "#9ca3af"}
                                size={32}
                                strokeWidth={1.8}
                            />
                            <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                                {transcriptQuery
                                    ? "Tidak ada hasil transkrip"
                                    : "Ketik kata kunci untuk mencari di transkrip"}
                            </Text>
                            <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                                Cari potongan video berdasarkan tema atau teks
                                ceramah ustadz.
                            </Text>
                        </View>
                    )}
                </View>
            ) : tab === "bookmarks" ? (
                <View>
                    {/* Search Bookmark */}
                    <View style={[styles.searchBar, isDarkTheme && styles.searchBarDark]}>
                        <Bookmark color='#f59e0b' size={18} />
                        <TextInput
                            onChangeText={setSavedQuery}
                            placeholder={t("explore.kajian.filterBookmarks")}
                            placeholderTextColor={isDarkTheme ? "#64748b" : "#9ca3af"}
                            style={[styles.searchInput, isDarkTheme && styles.searchInputDark]}
                            value={savedQuery}
                        />
                    </View>

                    {filteredSaved.length > 0 ? (
                        <View style={styles.grid}>
                            <Text style={[styles.resultsCount, isDarkTheme && styles.resultsCountDark]}>
                                {t("explore.kajian.savedCount", {
                                    count: filteredSaved.length,
                                })}
                            </Text>
                            {filteredSaved.map((item) => (
                                <View
                                    key={item.id}
                                    style={styles.savedCardWrapper}
                                >
                                    <TranscriptCard
                                        isDarkTheme={isDarkTheme}
                                        item={item}
                                        onOpenUrl={onOpenUrl}
                                        onOpenPlayer={setPlayerItem}
                                    />
                                    <Pressable
                                        accessibilityRole='button'
                                        onPress={() =>
                                            removeSavedBookmark(item.id)
                                        }
                                        style={styles.removeBookmarkBtn}
                                    >
                                        <Trash2 color='#ef4444' size={14} />
                                        <Text style={styles.removeBookmarkText}>
                                            {t("explore.kajian.removeBookmark")}
                                        </Text>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.empty}>
                            <Bookmark
                                color={isDarkTheme ? "#64748b" : "#9ca3af"}
                                size={32}
                                strokeWidth={1.8}
                            />
                            <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                                {savedQuery
                                    ? t("explore.kajian.noMatchingBookmarks")
                                    : t("explore.kajian.emptyBookmarks")}
                            </Text>
                            <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                                {t("explore.kajian.emptyBookmarksHint")}
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                <View>
                    <View style={[styles.search, isDarkTheme && styles.searchDark]}>
                        <TextInput
                            onChangeText={onSearch}
                            placeholder={t("explore.kajian.searchPlaceholder")}
                            placeholderTextColor={isDarkTheme ? "#64748b" : "#9ca3af"}
                            style={[styles.input, isDarkTheme && styles.inputDark]}
                            testID='web-app-kajian-search'
                            value={kajianSearch}
                        />
                    </View>

                    <View style={styles.categories}>
                        <Pressable
                            accessibilityRole='button'
                            onPress={() => onSelectCategory("")}
                            style={[
                                styles.category,
                                isDarkTheme && styles.categoryDark,
                                !kajianCategory && (isDarkTheme ? styles.categoryActiveDark : styles.categoryActive),
                            ]}
                            testID='web-app-kajian-category-all'
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    isDarkTheme && styles.categoryTextDark,
                                    !kajianCategory &&
                                        styles.categoryTextActive,
                                ]}
                            >
                                {t("explore.common.all")}
                            </Text>
                        </Pressable>
                        {categories.map((category) => (
                            <Pressable
                                accessibilityRole='button'
                                key={category}
                                onPress={() =>
                                    onSelectCategory(
                                        kajianCategory === category
                                            ? ""
                                            : category,
                                    )
                                }
                                style={[
                                    styles.category,
                                    isDarkTheme && styles.categoryDark,
                                    kajianCategory === category &&
                                        (isDarkTheme ? styles.categoryActiveDark : styles.categoryActive),
                                ]}
                                testID={`web-app-kajian-category-${category}`}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        isDarkTheme && styles.categoryTextDark,
                                        kajianCategory === category &&
                                            styles.categoryTextActive,
                                    ]}
                                >
                                    {category}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {loading ? (
                        <View style={styles.state}>
                            <ActivityIndicator color={ACCENT} size='small' />
                            <Text style={[styles.stateText, isDarkTheme && styles.stateTextDark]}>
                                {t("explore.kajian.loading")}
                            </Text>
                        </View>
                    ) : null}
                    {!loading && !error && filteredItems.length ? (
                        <View style={styles.grid}>
                            {filteredItems.map((item, index) => (
                                <KajianCard
                                    getDescription={getDescription}
                                    getDuration={getDuration}
                                    getItemKey={getItemKey}
                                    getSpeaker={getSpeaker}
                                    getTitle={getTitle}
                                    getTopic={getTopic}
                                    getType={getType}
                                    getUrl={getUrl}
                                    index={index}
                                    isDarkTheme={isDarkTheme}
                                    item={item}
                                    key={`${getItemKey(item)}-${index}`}
                                    onOpenItem={onOpenItem}
                                    onOpenPlayer={setPlayerItem}
                                    onOpenUrl={onOpenUrl}
                                />
                            ))}
                        </View>
                    ) : null}
                    {!loading && !error && !filteredItems.length ? (
                        <View style={styles.empty}>
                            <BookOpen
                                color={isDarkTheme ? "#64748b" : "#9ca3af"}
                                size={32}
                                strokeWidth={1.8}
                            />
                            <Text style={[styles.emptyTitle, isDarkTheme && styles.emptyTitleDark]}>
                                {t("explore.kajian.emptyTitle")}
                            </Text>
                            <Text style={[styles.emptyText, isDarkTheme && styles.emptyTextDark]}>
                                {t("explore.common.changeSearchOrFilter")}
                            </Text>
                        </View>
                    ) : null}
                </View>
            )}

            <KajianPlayerModal
                item={playerItem}
                searchQuery={transcriptQuery}
                visible={Boolean(playerItem)}
                onClose={() => setPlayerItem(null)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: "#f8fafc",
        flex: 1,
    },
    rootDark: {
        backgroundColor: "#020617",
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    contentDark: {
        backgroundColor: "#020617",
    },
    header: {
        paddingBottom: spacing.sm,
    },
    title: {
        color: "#1f2937",
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 28,
    },
    titleDark: {
        color: "#f8fafc",
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 14,
        lineHeight: 20,
        marginTop: 2,
    },
    subtitleDark: {
        color: "#94a3b8",
    },
    tabContainer: {
        backgroundColor: "#e5e7eb",
        borderRadius: 12,
        flexDirection: "row",
        marginBottom: spacing.md,
        padding: 3,
    },
    tabContainerDark: {
        backgroundColor: "#1e293b",
    },
    tabButton: {
        alignItems: "center",
        borderRadius: 9,
        flex: 1,
        justifyContent: "center",
        minHeight: 40,
        paddingVertical: 8,
    },
    tabButtonDark: {
        backgroundColor: "transparent",
    },
    tabButtonActive: {
        backgroundColor: "#ffffff",
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabButtonActiveDark: {
        backgroundColor: "#0f172a",
        elevation: 1,
    },
    tabButtonText: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "700",
    },
    tabButtonTextDark: {
        color: "#94a3b8",
    },
    tabButtonTextActive: {
        color: "#047857",
        fontWeight: "800",
    },
    searchBar: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#10b981",
        borderRadius: 12,
        borderWidth: 1.5,
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    searchBarDark: {
        backgroundColor: "#0f172a",
        borderColor: "#059669",
    },
    searchInput: {
        color: "#111827",
        flex: 1,
        fontSize: 14,
        minHeight: 44,
        padding: 0,
    },
    searchInputDark: {
        color: "#f8fafc",
    },
    modeContainer: {
        flexDirection: "row",
        gap: 6,
        marginBottom: spacing.sm,
    },
    modeButton: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 10,
        borderWidth: 1,
        flex: 1,
        flexDirection: "row",
        gap: 4,
        justifyContent: "center",
        minHeight: 40,
        paddingVertical: 8,
    },
    modeButtonDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    modeButtonHybrid: {
        backgroundColor: "#10b981",
        borderColor: "#10b981",
    },
    modeButtonExact: {
        backgroundColor: "#2563eb",
        borderColor: "#2563eb",
    },
    modeButtonSemantic: {
        backgroundColor: "#7c3aed",
        borderColor: "#7c3aed",
    },
    modeIcon: {
        fontSize: 13,
    },
    modeLabel: {
        color: "#4b5563",
        fontSize: 12,
        fontWeight: "700",
    },
    modeLabelDark: {
        color: "#cbd5e1",
    },
    modeLabelActive: {
        color: "#ffffff",
    },
    speakerSection: {
        marginBottom: spacing.md,
    },
    speakerLabel: {
        color: "#9ca3af",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    speakerLabelDark: {
        color: "#94a3b8",
    },
    speakerScroll: {
        gap: 6,
        paddingBottom: 2,
    },
    speakerPill: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 32,
        justifyContent: "center",
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    speakerPillDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    speakerPillActive: {
        backgroundColor: "#10b981",
        borderColor: "#10b981",
    },
    speakerPillText: {
        color: "#4b5563",
        fontSize: 11,
        fontWeight: "700",
    },
    speakerPillTextDark: {
        color: "#cbd5e1",
    },
    speakerPillTextActive: {
        color: "#ffffff",
    },
    resultsCount: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
    },
    resultsCountDark: {
        color: "#94a3b8",
    },
    highlight: {
        backgroundColor: "#fef08a",
        color: "#111827",
    },
    matchCount: {
        color: "#047857",
        fontSize: 10,
        fontWeight: "700",
    },
    matchCountDark: {
        color: "#34d399",
    },
    modeBadgeFuzzy: {
        backgroundColor: "#fef3c7",
        color: "#b45309",
    },
    modeBadgeTitle: {
        backgroundColor: "#f1f5f9",
        color: "#334155",
    },
    modeDesc: {
        color: "#9ca3af",
        fontSize: 9,
        fontWeight: "600",
        marginTop: 2,
        textAlign: "center",
    },
    modeDescDark: {
        color: "#94a3b8",
    },
    loadMoreButton: {
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: ACCENT,
        borderRadius: radius.md,
        justifyContent: "center",
        marginTop: spacing.sm,
        minHeight: 44,
        minWidth: 160,
        paddingHorizontal: spacing.lg,
        paddingVertical: 10,
    },
    loadMoreButtonDisabled: {
        opacity: 0.6,
    },
    loadMoreText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "800",
    },
    transcriptCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        overflow: "hidden",
        padding: spacing.md,
    },
    transcriptCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    transcriptContent: {
        flexDirection: "row",
        gap: spacing.md,
    },
    transcriptThumbWrapper: {
        backgroundColor: "#000",
        borderRadius: 8,
        height: 72,
        overflow: "hidden",
        position: "relative",
        width: 100,
    },
    transcriptThumb: {
        height: "100%",
        width: "100%",
    },
    transcriptTimeBadge: {
        backgroundColor: "rgba(0,0,0,0.8)",
        borderRadius: 4,
        bottom: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        position: "absolute",
        right: 4,
    },
    transcriptTimeText: {
        color: "#ffffff",
        fontSize: 9,
        fontWeight: "700",
    },
    transcriptDetails: {
        flex: 1,
    },
    modeBadgeRow: {
        flexDirection: "row",
        marginBottom: 4,
    },
    modeBadge: {
        borderRadius: 4,
        fontSize: 9,
        fontWeight: "800",
        overflow: "hidden",
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    modeBadgeHybrid: {
        backgroundColor: "#d1fae5",
        color: "#047857",
    },
    modeBadgeExact: {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
    },
    modeBadgeSemantic: {
        backgroundColor: "#ede9fe",
        color: "#6d28d9",
    },
    transcriptTitle: {
        color: "#1f2937",
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 17,
        marginBottom: 2,
    },
    transcriptTitleDark: {
        color: "#f8fafc",
    },
    transcriptSpeaker: {
        color: "#047857",
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 4,
    },
    transcriptSpeakerDark: {
        color: "#34d399",
    },
    transcriptSnippet: {
        color: "#4b5563",
        fontSize: 11,
        fontStyle: "italic",
        lineHeight: 16,
        marginBottom: 6,
    },
    transcriptSnippetDark: {
        color: "#cbd5e1",
    },
    watchRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: 4,
    },
    watchText: {
        color: "#dc2626",
        fontSize: 11,
        fontWeight: "800",
    },
    savedCardWrapper: {
        position: "relative",
    },
    removeBookmarkBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-end",
        marginTop: 4,
        marginRight: 6,
        minHeight: 40,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    removeBookmarkText: {
        fontSize: 11,
        color: "#ef4444",
        fontWeight: "600",
    },
    thumbnailWrapper: {
        aspectRatio: 16 / 9,
        backgroundColor: "#000",
        borderRadius: 8,
        marginBottom: spacing.sm,
        overflow: "hidden",
        position: "relative",
        width: "100%",
    },
    thumbnail: {
        height: "100%",
        width: "100%",
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "center",
    },
    playButtonCircle: {
        alignItems: "center",
        backgroundColor: "rgba(220,38,38,0.9)",
        borderRadius: 999,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    stats: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    statCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flex: 1,
        minHeight: 68,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    statCardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    statLabel: {
        color: "#9ca3af",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0,
    },
    statLabelDark: {
        color: "#94a3b8",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "900",
        marginTop: 4,
    },
    search: {
        backgroundColor: "#ffffff",
        borderColor: "#34d399",
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: "center",
        marginBottom: spacing.md,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    searchDark: {
        backgroundColor: "#0f172a",
        borderColor: "#059669",
    },
    input: {
        color: "#111827",
        fontSize: 14,
        minHeight: 42,
        padding: 0,
    },
    inputDark: {
        color: "#f8fafc",
    },
    categories: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: spacing.lg,
    },
    category: {
        backgroundColor: "#f3f4f6",
        borderColor: "#f3f4f6",
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 32,
        justifyContent: "center",
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    categoryDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    categoryActive: {
        backgroundColor: "#10b981",
        borderColor: "#10b981",
    },
    categoryActiveDark: {
        backgroundColor: "#065f46",
        borderColor: "#059669",
    },
    categoryText: {
        color: "#4b5563",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    categoryTextDark: {
        color: "#cbd5e1",
    },
    categoryTextActive: {
        color: "#ffffff",
    },
    error: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        borderRadius: 8,
        borderWidth: 1,
        color: "#991b1b",
        fontSize: 13,
        fontWeight: "700",
        marginBottom: spacing.md,
        padding: spacing.md,
        textAlign: "center",
    },
    state: {
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 160,
    },
    stateText: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "700",
    },
    stateTextDark: {
        color: "#94a3b8",
    },
    grid: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 132,
        padding: spacing.md,
    },
    cardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    cardHeader: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    badges: {
        flexDirection: "row",
        flexWrap: "wrap",
        flex: 1,
        gap: spacing.xs,
    },
    badge: {
        backgroundColor: "#d1fae5",
        borderColor: "#d1fae5",
        borderRadius: 999,
        borderWidth: 1,
        color: "#047857",
        fontSize: 12,
        fontWeight: "800",
        overflow: "hidden",
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        textTransform: "capitalize",
    },
    badgeDark: {
        backgroundColor: "rgba(6, 78, 59, 0.35)",
        borderColor: "#065f46",
        color: "#6ee7b7",
    },
    badgeVideo: {
        backgroundColor: "#fee2e2",
        borderColor: "#fee2e2",
        color: "#ef4444",
    },
    badgeVideoDark: {
        backgroundColor: "rgba(127, 29, 29, 0.35)",
        borderColor: "#991b1b",
        color: "#fca5a5",
    },
    cardTitle: {
        color: "#1f2937",
        fontSize: 14,
        fontWeight: "900",
        lineHeight: 19,
    },
    cardTitleDark: {
        color: "#f8fafc",
    },
    speaker: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        marginTop: 5,
    },
    speakerDark: {
        color: "#34d399",
    },
    duration: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 5,
    },
    durationDark: {
        color: "#94a3b8",
    },
    description: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },
    descriptionDark: {
        color: "#94a3b8",
    },
    empty: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 180,
        padding: spacing.lg,
    },
    emptyDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    emptyTitle: {
        color: "#1f2937",
        fontSize: 16,
        fontWeight: "900",
        marginTop: spacing.sm,
    },
    emptyTitleDark: {
        color: "#f8fafc",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 13,
        lineHeight: 20,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    emptyTextDark: {
        color: "#94a3b8",
    },
});
