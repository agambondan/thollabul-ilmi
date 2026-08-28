import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BookOpen, CheckCircle2, Database, Trash2 } from "lucide-react-native";
import { getHadithBooks } from "../api/client";
import {
    buildOfflinePack,
    clearOfflinePack,
    getOfflineHadithCountsBySlug,
    getOfflineOverview,
} from "../storage/offlineContent";
import { useFeedback } from "../context/FeedbackContext";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { colors, radius, spacing } from "../theme";
import { Card, CardTitle } from "./Card";

const QURAN_ESTIMATE = {
    ayahs: 6236,
    surahs: 114,
    sizeMb: 5,
};

const HADITH_BYTES_PER_ITEM = 1500;
const HADITH_FALLBACK_COUNT = 5000;

const formatSizeLabel = (mb) => {
    if (!Number.isFinite(mb) || mb <= 0) return "0 MB";
    if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`;
    if (mb >= 100) return `${Math.round(mb)} MB`;
    return `${mb.toFixed(1)} MB`;
};

const estimatePackSize = ({ includeQuran, selectedBooks }) => {
    let bytes = 0;
    if (includeQuran) bytes += QURAN_ESTIMATE.sizeMb * 1024 * 1024;
    for (const book of selectedBooks) {
        const count = book.count || HADITH_FALLBACK_COUNT;
        bytes += count * HADITH_BYTES_PER_ITEM;
    }
    return {
        bytes,
        mb: bytes / (1024 * 1024),
        hadithCount: selectedBooks.reduce(
            (sum, b) => sum + (b.count || HADITH_FALLBACK_COUNT),
            0,
        ),
    };
};

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

const formatDate = (value, t) => {
    if (!value) return t("offlinePack.status.notDownloaded");

    try {
        return new Intl.DateTimeFormat("en", {
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            month: "short",
        }).format(new Date(value));
    } catch {
        return t("offlinePack.status.downloaded");
    }
};

const statsFor = (overview, t) => [
    {
        key: "surahs",
        label: t("offlinePack.stats.surahs"),
        value: overview.quranSurahs,
    },
    {
        key: "ayahs",
        label: t("offlinePack.stats.ayahs"),
        value: overview.quranAyahs,
    },
    {
        key: "hadiths",
        label: t("offlinePack.stats.hadiths"),
        value: overview.hadiths,
    },
    {
        key: "books",
        label: t("offlinePack.stats.books"),
        value: overview.hadithBooks?.length ?? 0,
    },
];

const selectionFromBooks = (books = []) =>
    books.reduce((acc, book) => {
        if (book.slug) acc[book.slug] = true;
        return acc;
    }, {});

const QURAN_TOTAL_AYAHS = 6236;
const QURAN_TOTAL_SURAHS = 114;

export function OfflinePackCard() {
    const { showError, showSuccess } = useFeedback();
    const { t } = useMobileLocale();
    const [overview, setOverview] = useState(null);
    const [books, setBooks] = useState([]);
    const [booksLoading, setBooksLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [includeQuran, setIncludeQuran] = useState(true);
    const [message, setMessage] = useState(t("offlinePack.message.initial"));
    const [progress, setProgress] = useState(0);
    const [selectedBookSlugs, setSelectedBookSlugs] = useState({});
    const [localBookCounts, setLocalBookCounts] = useState({});

    const load = useCallback(async () => {
        const [data, perBookCounts] = await Promise.all([
            getOfflineOverview(),
            getOfflineHadithCountsBySlug(),
        ]);
        setOverview(data);
        setLocalBookCounts(perBookCounts);
        if (!data.supported) {
            setMessage(data.error ?? t("offlinePack.error.unsupported"));
            return;
        }

        if (data.savedAt) {
            setIncludeQuran(Boolean(data.includeQuran));
            setSelectedBookSlugs(selectionFromBooks(data.hadithBooks));
            setMessage(
                t("offlinePack.message.lastDownloaded", {
                    date: formatDate(data.savedAt, t),
                }),
            );
        }

        setBooksLoading(true);
        try {
            const items = await getHadithBooks();
            setBooks(items);
        } catch (error) {
            setBooks(Array.isArray(data.hadithBooks) ? data.hadithBooks : []);
            setMessage(error?.message ?? t("offlinePack.error.booksLoad"));
        } finally {
            setBooksLoading(false);
        }
    }, [t]);

    useEffect(() => {
        load();
    }, [load]);

    const selectedBooks = useMemo(
        () => books.filter((book) => Boolean(selectedBookSlugs[book.slug])),
        [books, selectedBookSlugs],
    );
    const isSupported = overview?.supported ?? true;
    const hasSelection = includeQuran || selectedBooks.length > 0;
    const stats = statsFor(overview ?? {}, t);

    const quranComplete =
        (overview?.quranSurahs ?? 0) >= QURAN_TOTAL_SURAHS &&
        (overview?.quranAyahs ?? 0) >= QURAN_TOTAL_AYAHS;
    const quranNeedsDownload = includeQuran && !quranComplete;

    const booksToFetch = useMemo(
        () =>
            selectedBooks.filter((book) => {
                const local = localBookCounts[book.slug] ?? 0;
                const expected = Number(book.count) || 0;
                return expected > 0 ? local < expected : local === 0;
            }),
        [selectedBooks, localBookCounts],
    );

    const pendingHadithCount = booksToFetch.reduce((sum, book) => {
        const local = localBookCounts[book.slug] ?? 0;
        const expected = Number(book.count) || HADITH_FALLBACK_COUNT;
        return sum + Math.max(expected - local, 0);
    }, 0);

    const everythingComplete = !quranNeedsDownload && booksToFetch.length === 0;

    const estimate = useMemo(
        () =>
            estimatePackSize({
                includeQuran: quranNeedsDownload,
                selectedBooks: booksToFetch.map((book) => ({
                    ...book,
                    count: Math.max(
                        (Number(book.count) || HADITH_FALLBACK_COUNT) -
                            (localBookCounts[book.slug] ?? 0),
                        0,
                    ),
                })),
            }),
        [quranNeedsDownload, booksToFetch, localBookCounts],
    );
    const sizeLabel = formatSizeLabel(estimate.mb);
    const isLargeDownload = estimate.mb > 100;

    const bookStatus = (book) => {
        const local = localBookCounts[book.slug] ?? 0;
        const expected = Number(book.count) || 0;
        if (local === 0) return { kind: "none" };
        if (expected > 0 && local >= expected)
            return { kind: "complete", local };
        if (expected > 0 && local < expected)
            return { kind: "update", delta: expected - local, local };
        return { kind: "partial", local };
    };

    const toggleBook = (slug) => {
        setSelectedBookSlugs((current) => ({
            ...current,
            [slug]: !current[slug],
        }));
    };

    const selectAllBooks = () => {
        setSelectedBookSlugs(selectionFromBooks(books));
    };

    const clearBookSelection = () => {
        setSelectedBookSlugs({});
    };

    const download = async ({ checkUpdates = false } = {}) => {
        setBusy(true);
        setProgress(0);
        try {
            const data = await buildOfflinePack({
                hadithBooks: selectedBooks,
                includeQuran,
                checkUpdates,
                onProgress: (event) => {
                    setMessage(event.label);
                    setProgress(event.value ?? 0);
                },
            });
            setOverview(data);
            const refreshedCounts = await getOfflineHadithCountsBySlug();
            setLocalBookCounts(refreshedCounts);
            if (checkUpdates) {
                const nextMessage =
                    data.deltaCount > 0
                        ? t("offlinePack.update.synced", {
                              count: formatNumber(data.deltaCount),
                          })
                        : t("offlinePack.update.latest");
                setMessage(nextMessage);
                showSuccess(nextMessage);
            } else {
                const nextMessage = t("offlinePack.download.ready", {
                    ayahs: formatNumber(data.quranAyahs),
                    hadiths: formatNumber(data.hadiths),
                    books: data.hadithBooks.length,
                });
                setMessage(nextMessage);
                showSuccess(nextMessage);
            }
            setProgress(100);
        } catch (error) {
            const nextMessage =
                error?.message ?? t("offlinePack.error.download");
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setBusy(false);
        }
    };

    const clear = async () => {
        setBusy(true);
        try {
            const data = await clearOfflinePack();
            setOverview(data);
            setMessage(t("offlinePack.cleared"));
            setProgress(0);
            showSuccess(t("offlinePack.cleared"));
        } catch (error) {
            const nextMessage = error?.message ?? t("offlinePack.error.clear");
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setBusy(false);
        }
    };

    const confirmDownload = () => {
        if (!hasSelection) {
            setMessage(t("offlinePack.message.selectionRequired"));
            return;
        }

        const summaryLines = [
            t("offlinePack.alert.quranLine", {
                status: quranNeedsDownload
                    ? t("offlinePack.status.newSurahs")
                    : quranComplete
                      ? t("offlinePack.status.complete")
                      : t("offlinePack.status.skipped"),
            }),
            t("offlinePack.alert.hadithLine", {
                books: booksToFetch.length,
                count:
                    pendingHadithCount > 0
                        ? t("offlinePack.alert.newHadiths", {
                              count: formatNumber(pendingHadithCount),
                          })
                        : "",
            }),
            t("offlinePack.alert.sizeLine", { size: sizeLabel }),
        ];
        Alert.alert(
            t("offlinePack.alert.downloadTitle"),
            `${summaryLines.join("\n")}\n\n${t("offlinePack.alert.downloadBody")}`,
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("offlinePack.action.download"),
                    onPress: () => download(),
                },
            ],
        );
    };

    const checkUpdates = () => {
        if (!hasSelection) {
            setMessage(t("offlinePack.message.updateSelectionRequired"));
            return;
        }
        download({ checkUpdates: true });
    };

    const confirmClear = () => {
        Alert.alert(
            t("offlinePack.alert.clearTitle"),
            t("offlinePack.alert.clearBody"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("offlinePack.action.clear"),
                    onPress: clear,
                    style: "destructive",
                },
            ],
        );
    };

    return (
        <Card>
            <CardTitle meta={t("offlinePack.cardMeta")}>
                {t("offlinePack.title")}
            </CardTitle>
            <Text style={styles.muted}>{t("offlinePack.description")}</Text>

            <View style={styles.selectorSection}>
                <Pressable
                    disabled={busy || !isSupported}
                    onPress={() => setIncludeQuran((value) => !value)}
                    style={({ pressed }) => [
                        styles.packageRow,
                        includeQuran && styles.packageRowActive,
                        (busy || !isSupported) && styles.disabled,
                        pressed && styles.pressed,
                    ]}
                >
                    <View
                        style={[
                            styles.packageIcon,
                            includeQuran && styles.packageIconActive,
                        ]}
                    >
                        <BookOpen
                            color={
                                includeQuran ? colors.onPrimary : colors.primary
                            }
                            size={18}
                            strokeWidth={2.5}
                        />
                    </View>
                    <View style={styles.packageText}>
                        <Text style={styles.packageTitle}>
                            {t("offlinePack.quran.title")}
                        </Text>
                        <Text style={styles.packageMeta}>
                            {t("offlinePack.quran.meta", {
                                surahs: QURAN_ESTIMATE.surahs,
                                ayahs: formatNumber(QURAN_ESTIMATE.ayahs),
                            })}
                        </Text>
                    </View>
                    <CheckCircle2
                        color={includeQuran ? colors.primary : colors.muted}
                        size={20}
                        strokeWidth={includeQuran ? 2.8 : 1.8}
                    />
                </Pressable>

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            {t("offlinePack.hadith.title")}
                        </Text>
                        <Text style={styles.sectionMeta}>
                            {t("offlinePack.hadith.selectionMeta", {
                                selected: selectedBooks.length,
                                total: books.length,
                            })}
                        </Text>
                    </View>
                    <View style={styles.selectionActions}>
                        <Pressable
                            disabled={busy || !books.length}
                            onPress={selectAllBooks}
                            style={styles.linkButton}
                        >
                            <Text
                                style={[
                                    styles.linkText,
                                    (busy || !books.length) &&
                                        styles.disabledText,
                                ]}
                            >
                                {t("offlinePack.action.selectAll")}
                            </Text>
                        </Pressable>
                        <Pressable
                            disabled={busy}
                            onPress={clearBookSelection}
                            style={styles.linkButton}
                        >
                            <Text
                                style={[
                                    styles.linkText,
                                    busy && styles.disabledText,
                                ]}
                            >
                                {t("offlinePack.action.clearSelection")}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {booksLoading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator
                            color={colors.primary}
                            size='small'
                        />
                        <Text style={styles.meta}>
                            {t("offlinePack.loadingBooks")}
                        </Text>
                    </View>
                ) : books.length ? (
                    <View style={styles.bookGrid}>
                        {books.map((book) => {
                            const selected = Boolean(
                                selectedBookSlugs[book.slug],
                            );
                            const status = bookStatus(book);
                            return (
                                <Pressable
                                    disabled={busy || !isSupported}
                                    key={book.slug}
                                    onPress={() => toggleBook(book.slug)}
                                    style={({ pressed }) => [
                                        styles.bookChip,
                                        selected && styles.bookChipActive,
                                        (busy || !isSupported) &&
                                            styles.disabled,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.bookChipText,
                                            selected &&
                                                styles.bookChipTextActive,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {book.name}
                                    </Text>
                                    {status.kind === "complete" ? (
                                        <Text
                                            style={[
                                                styles.bookChipBadge,
                                                styles.bookChipBadgeComplete,
                                            ]}
                                        >
                                            {t("offlinePack.status.complete")}
                                        </Text>
                                    ) : status.kind === "update" ? (
                                        <Text
                                            style={[
                                                styles.bookChipBadge,
                                                styles.bookChipBadgeUpdate,
                                            ]}
                                        >
                                            {t("offlinePack.status.newItems", {
                                                count: status.delta,
                                            })}
                                        </Text>
                                    ) : status.kind === "partial" ? (
                                        <Text
                                            style={[
                                                styles.bookChipBadge,
                                                styles.bookChipBadgeUpdate,
                                            ]}
                                        >
                                            {t(
                                                "offlinePack.status.savedItems",
                                                {
                                                    count: status.local,
                                                },
                                            )}
                                        </Text>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                ) : (
                    <Text style={styles.meta}>
                        {t("offlinePack.emptyBooks")}
                    </Text>
                )}
            </View>

            <View style={styles.estimateBox}>
                <View style={styles.estimateTitleRow}>
                    <Database
                        color={colors.primary}
                        size={16}
                        strokeWidth={2.4}
                    />
                    <Text style={styles.estimateTitle}>
                        {everythingComplete
                            ? t("offlinePack.estimate.completeTitle")
                            : t("offlinePack.estimate.pendingTitle")}
                    </Text>
                    {!everythingComplete ? (
                        <Text
                            style={[
                                styles.estimateSize,
                                isLargeDownload && styles.estimateSizeWarn,
                            ]}
                        >
                            {sizeLabel}
                        </Text>
                    ) : null}
                </View>
                <Text style={styles.estimateText}>
                    {everythingComplete
                        ? t("offlinePack.estimate.completeDescription")
                        : t("offlinePack.estimate.pendingDescription", {
                              quran: quranNeedsDownload
                                  ? t("offlinePack.estimate.quranPrefix")
                                  : "",
                              books: booksToFetch.length,
                              count:
                                  pendingHadithCount > 0
                                      ? t("offlinePack.estimate.newHadiths", {
                                            count: formatNumber(
                                                pendingHadithCount,
                                            ),
                                        })
                                      : "",
                          })}
                </Text>
                {!everythingComplete && isLargeDownload ? (
                    <Text style={styles.estimateWarn}>
                        {t("offlinePack.estimate.largeWarn")}
                    </Text>
                ) : null}
            </View>

            <View style={styles.stats}>
                {stats.map((item) => (
                    <View key={item.key} style={styles.stat}>
                        <Text style={styles.statValue}>{item.value ?? 0}</Text>
                        <Text style={styles.statLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${Math.min(progress, 100)}%` },
                    ]}
                />
            </View>
            <Text style={styles.meta}>{message}</Text>

            <View style={styles.actions}>
                <Pressable
                    disabled={busy || !isSupported || !hasSelection}
                    onPress={
                        everythingComplete ? checkUpdates : confirmDownload
                    }
                    style={({ pressed }) => [
                        styles.button,
                        styles.primaryButton,
                        (busy || !isSupported || !hasSelection) &&
                            styles.disabled,
                        pressed && styles.pressed,
                    ]}
                >
                    {busy ? (
                        <ActivityIndicator color='#ffffff' size='small' />
                    ) : (
                        <View style={styles.buttonContent}>
                            <BookOpen
                                color='#ffffff'
                                size={16}
                                strokeWidth={2.5}
                            />
                            <Text style={styles.primaryButtonText}>
                                {everythingComplete
                                    ? t("offlinePack.action.checkUpdate")
                                    : pendingHadithCount > 0 ||
                                        quranNeedsDownload
                                      ? t("offlinePack.action.downloadUpdate")
                                      : t(
                                            "offlinePack.action.downloadSelection",
                                        )}
                            </Text>
                        </View>
                    )}
                </Pressable>
                <Pressable
                    disabled={busy || !isSupported}
                    onPress={confirmClear}
                    style={({ pressed }) => [
                        styles.button,
                        (busy || !isSupported) && styles.disabled,
                        pressed && styles.pressed,
                    ]}
                >
                    <View style={styles.buttonContent}>
                        <Trash2
                            color={colors.primary}
                            size={16}
                            strokeWidth={2.5}
                        />
                        <Text style={styles.buttonText}>
                            {t("offlinePack.action.clearPack")}
                        </Text>
                    </View>
                </Pressable>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    actions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    bookChip: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexBasis: "30%",
        flexGrow: 1,
        justifyContent: "center",
        minHeight: 42,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    bookChipActive: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    bookChipText: {
        color: colors.text,
        fontSize: 11,
        fontWeight: "800",
        lineHeight: 14,
        textAlign: "center",
    },
    bookChipTextActive: {
        color: colors.onPrimary,
    },
    bookChipBadge: {
        fontSize: 9,
        fontWeight: "800",
        marginTop: 2,
        textAlign: "center",
    },
    bookChipBadgeComplete: {
        color: "#3a8a4f",
    },
    bookChipBadgeUpdate: {
        color: "#b8731a",
    },
    bookGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    button: {
        alignItems: "center",
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexBasis: "47%",
        flexGrow: 1,
        justifyContent: "center",
        minHeight: 42,
        paddingHorizontal: spacing.md,
    },
    buttonContent: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
    },
    buttonText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "800",
    },
    disabled: {
        opacity: 0.55,
    },
    disabledText: {
        color: colors.muted,
    },
    estimateBox: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        marginTop: spacing.md,
        padding: spacing.md,
    },
    estimateText: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    estimateTitle: {
        color: colors.ink,
        fontSize: 12,
        fontWeight: "900",
    },
    estimateTitleRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
    },
    estimateSize: {
        color: colors.primaryDark,
        fontSize: 12,
        fontWeight: "900",
        marginLeft: "auto",
    },
    estimateSizeWarn: {
        color: colors.danger,
    },
    estimateWarn: {
        color: colors.danger,
        fontSize: 11,
        fontWeight: "700",
        marginTop: spacing.xs,
    },
    linkButton: {
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
    },
    linkText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "900",
    },
    loadingRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 44,
    },
    meta: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.sm,
    },
    muted: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
    },
    packageIcon: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        height: 38,
        justifyContent: "center",
        width: 38,
    },
    packageIconActive: {
        backgroundColor: colors.primary,
    },
    packageMeta: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 16,
        marginTop: 2,
    },
    packageRow: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        minHeight: 62,
        padding: spacing.md,
    },
    packageRowActive: {
        borderColor: colors.primary,
    },
    packageText: {
        flex: 1,
    },
    packageTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
    },
    pressed: {
        opacity: 0.8,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "800",
    },
    progressFill: {
        backgroundColor: colors.primary,
        height: "100%",
    },
    progressTrack: {
        backgroundColor: colors.faint,
        borderRadius: radius.sm,
        height: 7,
        marginTop: spacing.md,
        overflow: "hidden",
    },
    sectionHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    sectionMeta: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "700",
        marginTop: 1,
    },
    sectionTitle: {
        color: colors.primaryDark,
        fontSize: 13,
        fontWeight: "900",
    },
    selectionActions: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
    },
    selectorSection: {
        gap: spacing.md,
        marginTop: spacing.md,
    },
    stat: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        flexBasis: "22%",
        flexGrow: 1,
        padding: spacing.md,
    },
    statLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "700",
        marginTop: spacing.xs,
    },
    statValue: {
        color: colors.primaryDark,
        fontSize: 16,
        fontWeight: "900",
    },
    stats: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.md,
    },
});
