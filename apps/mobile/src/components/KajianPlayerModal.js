import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    Pressable,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { Search, Share2, X } from "lucide-react-native";
import { AppModalSheet } from "./AppModalSheet";
import { radius, spacing } from "../theme";
import { hapticTap } from "../utils/haptics";

const API_URL =
    process.env.EXPO_PUBLIC_API_URL || "https://api-thollabul.jangkauin.site";

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

function extractVideoId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

function buildPlayerHtml(videoId, startSeconds) {
    const safeStart = Math.max(0, Math.floor(startSeconds || 0));
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  html,body{margin:0;padding:0;background:#000;height:100%;width:100%;overflow:hidden}
  #player{width:100%;height:100%}
</style>
</head><body>
<div id="player"></div>
<script>
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var first = document.getElementsByTagName('script')[0];
  first.parentNode.insertBefore(tag, first);

  var player = null;
  var lastTime = -1;
  var ready = false;

  function post(data) {
    try {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    } catch (e) {}
  }

  function onPlayerReady() {
    ready = true;
    post({ type: 'ready' });
  }

  window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
      videoId: ${JSON.stringify(videoId)},
      playerVars: {
        autoplay: 1,
        start: ${safeStart},
        enablejsapi: 1,
        playsinline: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: function(e) {
          post({ type: 'state', state: e.data });
        }
      }
    });

    setInterval(function() {
      if (!player || !ready || typeof player.getCurrentTime !== 'function') return;
      var t = player.getCurrentTime();
      if (Math.abs(t - lastTime) > 0.25) {
        lastTime = t;
        post({ type: 'time', t: t });
      }
    }, 350);
  };

  function receive(e) {
    if (!player) return;
    try {
      var data = JSON.parse(e.data);
      if (data && data.cmd === 'seek' && typeof data.t === 'number') {
        player.seekTo(data.t, true);
        player.playVideo();
      } else if (data && data.cmd === 'pause') {
        player.pauseVideo();
      } else if (data && data.cmd === 'play') {
        player.playVideo();
      }
    } catch (err) {}
  }
  document.addEventListener('message', receive);
  window.addEventListener('message', receive);
</script>
</body></html>`;
}

export function KajianPlayerModal({ item, searchQuery = "", visible, onClose }) {
    const videoId = useMemo(
        () => extractVideoId(item?.timestamp_url) || item?.video_id,
        [item?.timestamp_url, item?.video_id],
    );
    const initialStart = item?.start_seconds || 0;

    const [transcripts, setTranscripts] = useState([]);
    const [loadingTranscripts, setLoadingTranscripts] = useState(false);
    const [playerStart, setPlayerStart] = useState(initialStart);
    const [currentTime, setCurrentTime] = useState(initialStart);
    const [audioOnly, setAudioOnly] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [filter, setFilter] = useState("");
    const [bookmarked, setBookmarked] = useState(new Set());

    const webRef = useRef(null);
    const listRef = useRef(null);
    const storageKey = item?.kajian_id ? `kajian-player:${item.kajian_id}` : null;
    const bookmarkKey = item?.kajian_id ? `kajian-bookmarks:${item.kajian_id}` : null;

    useEffect(() => {
        if (!visible || !storageKey || !bookmarkKey) return;
        let cancelled = false;
        Promise.all([
            AsyncStorage.getItem(storageKey),
            AsyncStorage.getItem(bookmarkKey),
        ]).then(([savedTime, savedBookmarks]) => {
            if (cancelled) return;
            const resumeAt = Number(savedTime);
            if (Number.isFinite(resumeAt) && resumeAt > 0) {
                setPlayerStart(resumeAt);
                setCurrentTime(resumeAt);
            }
            if (savedBookmarks) setBookmarked(new Set(JSON.parse(savedBookmarks)));
        }).catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [bookmarkKey, storageKey, visible]);

    useEffect(() => {
        if (!visible || !storageKey) return;
        const timer = setTimeout(() => {
            AsyncStorage.setItem(storageKey, String(Math.floor(currentTime))).catch(() => {});
        }, 1000);
        return () => clearTimeout(timer);
    }, [currentTime, storageKey, visible]);

    useEffect(() => {
        if (!bookmarkKey) return;
        AsyncStorage.setItem(bookmarkKey, JSON.stringify([...bookmarked])).catch(() => {});
    }, [bookmarked, bookmarkKey]);

    // Fetch transcripts
    useEffect(() => {
        if (!visible || !item?.kajian_id) return;
        let cancelled = false;
        setLoadingTranscripts(true);
        fetch(`${API_URL}/api/v1/kajian/${item.kajian_id}/transcripts`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                setTranscripts(list);
            })
            .catch(() => setTranscripts([]))
            .finally(() => !cancelled && setLoadingTranscripts(false));
        return () => {
            cancelled = true;
        };
    }, [visible, item?.kajian_id]);

    const activeIndex = useMemo(() => {
        if (!transcripts.length) return -1;
        const cur = Math.floor(currentTime);
        return transcripts.findIndex((t) => cur >= t.start_seconds && cur <= t.end_seconds);
    }, [currentTime, transcripts]);

    // WebView message handler
    const onWebViewMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "time" && typeof data.t === "number") {
                setCurrentTime(data.t);
            }
        } catch {
            // ignore
        }
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (!autoScroll || activeIndex < 0 || !listRef.current) return;
        try {
            listRef.current.scrollToIndex({ index: activeIndex, animated: true, viewPosition: 0.3 });
        } catch {
            // ignore
        }
    }, [activeIndex, autoScroll]);

    const handleSeek = (seconds) => {
        hapticTap();
        setCurrentTime(seconds);
        if (webRef.current) {
            webRef.current.postMessage(JSON.stringify({ cmd: "seek", t: seconds }));
        }
    };

    const handleShare = useCallback(async () => {
        if (!item) return;
        const text = `📖 *${item.title}*\n👤 ${item.speaker}\n⏱️ ${item.timestamp}\n\n"${item.snippet}"\n\n🔗 ${item.timestamp_url}`;
        try {
            await Share.share({
                message: text,
                title: item.title,
                url: item.timestamp_url,
            });
        } catch {
            // ignore
        }
    }, [item]);

    const toggleBookmark = (id) => {
        hapticTap();
        setBookmarked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const displayed = useMemo(() => {
        if (!filter) return transcripts;
        const q = filter.toLowerCase();
        return transcripts.filter((t) => t.text?.toLowerCase().includes(q));
    }, [transcripts, filter]);

    if (!item) return null;
    if (!videoId) {
        return (
            <AppModalSheet
                visible={visible}
                onClose={onClose}
                title="Video tidak tersedia"
                subtitle="ID video YouTube tidak dapat ditemukan"
            >
                <Text style={styles.muted}>Transkrip tidak dapat diputar.</Text>
            </AppModalSheet>
        );
    }

    return (
        <AppModalSheet
            visible={visible}
            onClose={onClose}
            title={item.title}
            subtitle={`${item.speaker} · ⏱️ ${item.timestamp}`}
            maxHeight="92%"
            scroll={false}
        >
            <View style={styles.container}>
                {/* Video Player */}
                <View style={styles.playerBox}>
                    <WebView
                        ref={webRef}
                        style={[styles.player, audioOnly && styles.playerHidden]}
                        source={{ html: buildPlayerHtml(videoId, playerStart) }}
                        originWhitelist={["*"]}
                        onMessage={onWebViewMessage}
                        allowsFullscreenVideo
                        mediaPlaybackRequiresUserAction={false}
                        javaScriptEnabled
                        domStorageEnabled
                        mixedContentMode="always"
                    />
                    {audioOnly ? (
                        <View style={styles.audioOnlyOverlay}>
                            <Text style={styles.audioEmoji}>🎧</Text>
                            <Text style={styles.audioTitle}>Mode Audio</Text>
                            <Text style={styles.audioSubtitle}>Video tetap berjalan, visual disembunyikan</Text>
                        </View>
                    ) : null}
                </View>

                {/* Controls bar */}
                <View style={styles.controls}>
                    <Pressable
                        onPress={() => setAudioOnly((v) => !v)}
                        style={[styles.chip, audioOnly && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, audioOnly && styles.chipTextActive]}>
                            {audioOnly ? "🎧 Audio" : "🎬 Video"}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setAutoScroll((v) => !v)}
                        style={[styles.chip, autoScroll && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, autoScroll && styles.chipTextActive]}>
                            {autoScroll ? "↕ Auto-scroll" : "✋ Manual"}
                        </Text>
                    </Pressable>
                    <Pressable onPress={handleShare} style={styles.chip}>
                        <Share2 size={14} color="#047857" />
                        <Text style={styles.chipText}>Bagikan</Text>
                    </Pressable>
                </View>

                {/* Filter input */}
                <View style={styles.filterBox}>
                    <Search size={14} color="#94a3b8" />
                    <TextInput
                        style={styles.filterInput}
                        placeholder="Cari di transkrip ini..."
                        value={filter}
                        onChangeText={setFilter}
                        placeholderTextColor="#94a3b8"
                    />
                    {filter ? (
                        <Pressable onPress={() => setFilter("")}>
                            <X size={14} color="#94a3b8" />
                        </Pressable>
                    ) : null}
                </View>

                {/* Transcript list */}
                {loadingTranscripts ? (
                    <View style={styles.loading}>
                        <ActivityIndicator color="#10b981" />
                        <Text style={styles.muted}>Memuat transkrip...</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={displayed}
                        keyExtractor={(t, i) => String(t.id || i)}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        onScrollToIndexFailed={() => {}}
                        renderItem={({ item: t, index }) => {
                            const realIndex = transcripts.indexOf(t);
                            const isCurrent = realIndex === activeIndex;
                            const isBookmarked = bookmarked.has(t.id);
                            return (
                                <Pressable
                                    onPress={() => handleSeek(t.start_seconds)}
                                    style={[styles.row, isCurrent && styles.rowActive]}
                                >
                                    <Pressable
                                        onPress={() => toggleBookmark(t.id)}
                                        style={styles.bookmarkBtn}
                                    >
                                        <Text style={isBookmarked ? styles.bookmarkOn : styles.bookmarkOff}>
                                            {isBookmarked ? "🔖" : "⚪"}
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleSeek(t.start_seconds)}
                                        style={[
                                            styles.timeBadge,
                                            isCurrent && styles.timeBadgeActive,
                                        ]}
                                    >
                                        <Text style={[styles.timeText, isCurrent && styles.timeTextActive]}>
                                            {formatTime(t.start_seconds)}
                                        </Text>
                                    </Pressable>
                                    <Text
                                        style={[styles.text, isCurrent && styles.textActive]}
                                        numberOfLines={isCurrent ? undefined : 3}
                                    >
                                        {t.text}
                                    </Text>
                                </Pressable>
                            );
                        }}
                    />
                )}
            </View>
        </AppModalSheet>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    playerBox: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", position: "relative" },
    player: { flex: 1 },
    playerHidden: { opacity: 0 },
    audioOnlyOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
    },
    audioEmoji: { fontSize: 48 },
    audioTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 8 },
    audioSubtitle: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
    controls: {
        flexDirection: "row",
        gap: spacing.xs || 6,
        padding: spacing.sm || 10,
        backgroundColor: "#f8fafc",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.pill || 999,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    chipActive: { backgroundColor: "#d1fae5", borderColor: "#10b981" },
    chipText: { fontSize: 12, color: "#475569", fontWeight: "500" },
    chipTextActive: { color: "#047857", fontWeight: "700" },
    filterBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        margin: spacing.sm || 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
    },
    filterInput: { flex: 1, fontSize: 13, color: "#1e293b", paddingVertical: 4 },
    list: { flex: 1 },
    listContent: { padding: spacing.sm || 10, gap: 6 },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        padding: 8,
        borderRadius: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    rowActive: {
        backgroundColor: "#10b981",
        borderColor: "#059669",
    },
    bookmarkBtn: { padding: 2 },
    bookmarkOn: { fontSize: 14 },
    bookmarkOff: { fontSize: 14, opacity: 0.4 },
    timeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        backgroundColor: "#f1f5f9",
        borderRadius: 6,
    },
    timeBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
    timeText: { fontSize: 10, color: "#047857", fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
    timeTextActive: { color: "#fff" },
    text: { flex: 1, fontSize: 12, color: "#334155", lineHeight: 18 },
    textActive: { color: "#fff", fontWeight: "500" },
    loading: { alignItems: "center", padding: 24, gap: 8 },
    muted: { color: "#94a3b8", fontSize: 12 },
});
