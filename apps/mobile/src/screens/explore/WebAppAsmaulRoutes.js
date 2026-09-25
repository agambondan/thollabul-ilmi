import {
    ChevronLeft,
    ChevronRight,
    Hand,
    RefreshCcw,
    RotateCcw,
    Shuffle,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { setAsmaulWiridCount } from "../../storage/asmaulWirid";
import { radius, spacing } from "../../theme";
import { hapticMedium, hapticTap } from "../../utils/haptics";

const WIRID_TARGET = 99;

const getNameId = (name) => name?.id ?? name?.number ?? name?.key;
const getNumber = (name, index = 0) => name?.number ?? name?.id ?? index + 1;
const getArabic = (name) =>
    name?.arabic ?? name?.translation?.ar ?? name?.name ?? "";
const getLatin = (name) =>
    name?.latin ?? name?.transliteration ?? name?.translation?.latin_idn ?? "";
const getMeaning = (name) =>
    name?.indonesian ??
    name?.meaning ??
    name?.translation?.idn ??
    name?.translation?.en ??
    "";
const sumCounts = (counts = {}) =>
    Object.values(counts).reduce((sum, count) => sum + (Number(count) || 0), 0);

const clampIndex = (index, length) =>
    Math.max(0, Math.min(Math.max(0, length - 1), index));

function Header({ activeDark, arabic, subtitle, title }) {
    return (
        <View style={styles.header}>
            {arabic ? (
                <Text
                    style={[
                        styles.headerArabic,
                        activeDark && { color: "#34d399" },
                    ]}
                >
                    {arabic}
                </Text>
            ) : null}
            <Text
                style={[
                    styles.title,
                    activeDark && { color: "#f9fafb" },
                ]}
            >
                {title}
            </Text>
            <Text
                style={[
                    styles.subtitle,
                    activeDark && { color: "#9ca3af" },
                ]}
            >
                {subtitle}
            </Text>
        </View>
    );
}

function IconButton({ activeDark, disabled, Icon, label, onPress, variant = "neutral" }) {
    return (
        <Pressable
            accessibilityLabel={label}
            accessibilityRole='button'
            accessibilityState={{ disabled: disabled }}
            disabled={disabled}
            onPress={onPress}
            style={[
                styles.iconButton,
                activeDark && {
                    backgroundColor: "#1e293b",
                },
                variant === "primary" && styles.iconButtonPrimary,
                disabled && styles.disabledButton,
            ]}
        >
            <Icon
                color={
                    variant === "primary"
                        ? "#ffffff"
                        : activeDark
                          ? "#cbd5e1"
                          : "#475569"
                }
                size={17}
                strokeWidth={2.3}
            />
        </Pressable>
    );
}

function StatTile({ activeDark, color, label, value }) {
    return (
        <View
            style={[
                styles.statTile,
                activeDark && {
                    backgroundColor: "#111827",
                    borderColor: "#374151",
                },
            ]}
        >
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text
                style={[
                    styles.statLabel,
                    activeDark && { color: "#9ca3af" },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

function EmptyState({ activeDark, loading, t }) {
    return (
        <View
            style={[
                styles.emptyCard,
                activeDark && {
                    backgroundColor: "#111827",
                    borderColor: "#374151",
                },
            ]}
        >
            {loading ? <ActivityIndicator color='#047857' /> : null}
            <Text
                style={[
                    styles.emptyText,
                    activeDark && { color: "#9ca3af" },
                ]}
            >
                {loading
                    ? t("explore.asmaul.loading")
                    : t("explore.asmaul.empty")}
            </Text>
        </View>
    );
}

export function WebAppAsmaulFlashcardRoute({
    asmaulFlashcardRevealed = false,
    asmaulIndex = 0,
    asmaulLoading = false,
    asmaulNames = [],
    setAsmaulFlashcardRevealed = () => {},
    setAsmaulIndex = () => {},
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const activeDark = isDarkThemePref ?? false;
    const [shuffled, setShuffled] = useState(false);
    const [order, setOrder] = useState([]);
    const names = asmaulNames;
    const sequence =
        order.length === names.length ? order : names.map((_, index) => index);
    const safeIndex = clampIndex(asmaulIndex, sequence.length || names.length);
    const currentIndex = sequence[safeIndex] ?? safeIndex;
    const currentName = names[currentIndex];

    const move = (delta) => {
        hapticTap();
        setAsmaulFlashcardRevealed(false);
        setAsmaulIndex((current) =>
            clampIndex(current + delta, sequence.length || names.length),
        );
    };

    const shuffle = () => {
        const next = names
            .map((_, index) => index)
            .sort(() => Math.random() - 0.5);
        setOrder(next);
        setShuffled(true);
        setAsmaulFlashcardRevealed(false);
        setAsmaulIndex(0);
    };

    const resetOrder = () => {
        setOrder([]);
        setShuffled(false);
        setAsmaulFlashcardRevealed(false);
        setAsmaulIndex(0);
    };

    const toggleReveal = () => {
        hapticTap();
        setAsmaulFlashcardRevealed((value) => !value);
    };

    return (
        <ScrollView
            contentContainerStyle={[
                styles.content,
                activeDark && { backgroundColor: "#0f172a" },
            ]}
            showsVerticalScrollIndicator={false}
            style={[
                styles.root,
                activeDark && { backgroundColor: "#0f172a" },
            ]}
        >
            <View testID='explore-web-app-asmaul-flashcard-surface' />
            <Header
                activeDark={activeDark}
                title={t("explore.asmaul.flashcard.title")}
                subtitle={t("explore.asmaul.flashcard.subtitle")}
            />

            {asmaulLoading || !currentName ? (
                <EmptyState activeDark={activeDark} loading={asmaulLoading} t={t} />
            ) : (
                <>
                    <View style={styles.toolbar}>
                        <Text style={[
                            styles.toolbarText,
                            activeDark && { color: "#9ca3af" },
                        ]}>
                            {safeIndex + 1} / {sequence.length}
                        </Text>
                        <View style={styles.toolbarActions}>
                            <Pressable
                                accessibilityRole='button'
                                onPress={shuffle}
                                style={[
                                    styles.smallAction,
                                    activeDark && {
                                        backgroundColor: "#1e293b",
                                    },
                                    shuffled && styles.smallActionActive,
                                ]}
                            >
                                <Shuffle
                                    color={shuffled ? "#b45309" : activeDark ? "#cbd5e1" : "#475569"}
                                    size={14}
                                    strokeWidth={2.3}
                                />
                                <Text
                                    style={[
                                        styles.smallActionText,
                                        activeDark && { color: "#cbd5e1" },
                                        shuffled &&
                                            styles.smallActionTextActive,
                                    ]}
                                >
                                    {t("explore.asmaul.shuffle")}
                                </Text>
                            </Pressable>
                            {shuffled ? (
                                <Pressable
                                    accessibilityRole='button'
                                    onPress={resetOrder}
                                    style={[
                                        styles.smallAction,
                                        activeDark && {
                                            backgroundColor: "#1e293b",
                                        },
                                    ]}
                                >
                                    <RotateCcw
                                        color={activeDark ? "#cbd5e1" : "#475569"}
                                        size={14}
                                        strokeWidth={2.3}
                                    />
                                    <Text style={[
                                        styles.smallActionText,
                                        activeDark && { color: "#cbd5e1" },
                                    ]}>
                                        {t("explore.asmaul.originalOrder")}
                                    </Text>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>

                    <Pressable
                        accessibilityLabel={t(
                            "explore.asmaul.flipAccessibility",
                        )}
                        accessibilityRole='button'
                        onPress={toggleReveal}
                        style={[
                            styles.flashcard,
                            activeDark && {
                                backgroundColor: "#111827",
                                borderColor: "#374151",
                            },
                        ]}
                        testID='web-app-asmaul-flashcard-card'
                    >
                        <Text style={[
                            styles.badgeText,
                            activeDark && {
                                backgroundColor: "#064e3b",
                                color: "#6ee7b7",
                            },
                        ]}>
                            #{getNumber(currentName, currentIndex)}
                        </Text>
                        <Text style={[
                            styles.cardHint,
                            activeDark && { color: "#9ca3af" },
                        ]}>
                            {asmaulFlashcardRevealed
                                ? t("explore.asmaul.hideHint")
                                : t("explore.asmaul.showHint")}
                        </Text>
                        <Text style={[
                            styles.flashArabic,
                            activeDark && { color: "#a7f3d0" },
                        ]}>
                            {getArabic(currentName)}
                        </Text>
                        {asmaulFlashcardRevealed ? (
                            <>
                                <Text style={[
                                    styles.flashLatin,
                                    activeDark && { color: "#f9fafb" },
                                ]}>
                                    {getLatin(currentName)}
                                </Text>
                                <Text style={[
                                    styles.flashMeaning,
                                    activeDark && { color: "#34d399" },
                                ]}>
                                    {getMeaning(currentName)}
                                </Text>
                            </>
                        ) : (
                            <Text style={[
                                styles.guessHint,
                                activeDark && { color: "#9ca3af" },
                            ]}>
                                {t("explore.asmaul.guessHint")}
                            </Text>
                        )}
                    </Pressable>

                    <View style={styles.navRow}>
                        <IconButton
                            activeDark={activeDark}
                            disabled={safeIndex === 0}
                            Icon={ChevronLeft}
                            label={t("explore.asmaul.previous")}
                            onPress={() => move(-1)}
                        />
                        <Pressable
                            accessibilityRole='button'
                            onPress={toggleReveal}
                            style={[
                                styles.primaryAction,
                                activeDark && { backgroundColor: "#059669" },
                            ]}
                        >
                            <Text style={styles.primaryActionText}>
                                {asmaulFlashcardRevealed
                                    ? t("explore.asmaul.hide")
                                    : t("explore.asmaul.show")}
                            </Text>
                        </Pressable>
                        <IconButton
                            activeDark={activeDark}
                            disabled={safeIndex >= sequence.length - 1}
                            Icon={ChevronRight}
                            label={t("explore.asmaul.next")}
                            onPress={() => move(1)}
                            variant='primary'
                        />
                    </View>
                </>
            )}
        </ScrollView>
    );
}

export function WebAppAsmaulWiridRoute({
    asmaulCounts = {},
    asmaulIndex = 0,
    asmaulLoading = false,
    asmaulNames = [],
    setAsmaulCounts = () => {},
    setAsmaulIndex = () => {},
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme: isDarkThemePref } = useLayoutModePreference();
    const activeDark = isDarkThemePref ?? false;
    const [vibrate, setVibrate] = useState(true);
    const names = asmaulNames;
    const safeIndex = clampIndex(asmaulIndex, names.length);
    const currentName = names[safeIndex];
    const nameId = getNameId(currentName);
    const count = Number(asmaulCounts[nameId] ?? 0);
    const reachedTarget = count >= WIRID_TARGET;
    const progressPct = Math.min(100, Math.round((count / WIRID_TARGET) * 100));
    const totalToday = sumCounts(asmaulCounts);

    const updateCount = (nextCount) => {
        if (!nameId) return;
        if (vibrate) {
            if (nextCount === WIRID_TARGET || nextCount % 33 === 0)
                hapticMedium();
            else hapticTap();
        }
        setAsmaulCounts((prev) => {
            const nextCounts = { ...prev, [nameId]: nextCount };
            if (nextCount <= 0) delete nextCounts[nameId];
            setAsmaulWiridCount(nextCounts, nameId, nextCount).catch((e) =>
                console.error(e),
            );
            return nextCounts;
        });
    };

    const move = (delta) => {
        hapticTap();
        setAsmaulIndex((current) => clampIndex(current + delta, names.length));
    };

    return (
        <ScrollView
            contentContainerStyle={[
                styles.content,
                activeDark && { backgroundColor: "#0f172a" },
            ]}
            showsVerticalScrollIndicator={false}
            style={[
                styles.root,
                activeDark && { backgroundColor: "#0f172a" },
            ]}
        >
            <View testID='explore-web-app-asmaul-wirid-surface' />
            <Header
                activeDark={activeDark}
                arabic='وِرْدُ الْأَسْمَاءِ'
                title={t("explore.asmaul.wirid.title")}
                subtitle={t("explore.asmaul.wirid.subtitle")}
            />

            {asmaulLoading || !currentName ? (
                <EmptyState activeDark={activeDark} loading={asmaulLoading} t={t} />
            ) : (
                <>
                    <View style={[
                        styles.counterCard,
                        activeDark && {
                            backgroundColor: "#111827",
                            borderColor: "#374151",
                        },
                    ]}>
                        <View style={styles.cardTopRow}>
                            <Text style={[
                                styles.indexBadge,
                                activeDark && {
                                    backgroundColor: "#064e3b",
                                    color: "#6ee7b7",
                                },
                            ]}>
                                #{getNumber(currentName, safeIndex)} /{" "}
                                {names.length}
                            </Text>
                            <View style={styles.indexActions}>
                                <IconButton
                                    activeDark={activeDark}
                                    disabled={safeIndex === 0}
                                    Icon={ChevronLeft}
                                    label={t("explore.asmaul.previousName")}
                                    onPress={() => move(-1)}
                                />
                                <IconButton
                                    activeDark={activeDark}
                                    disabled={safeIndex >= names.length - 1}
                                    Icon={ChevronRight}
                                    label={t("explore.asmaul.nextName")}
                                    onPress={() => move(1)}
                                />
                            </View>
                        </View>

                        <Text style={[
                            styles.wiridArabic,
                            activeDark && { color: "#a7f3d0" },
                        ]}>
                            {getArabic(currentName)}
                        </Text>
                        <Text style={[
                            styles.wiridLatin,
                            activeDark && { color: "#9ca3af" },
                        ]}>
                            {getLatin(currentName)}
                        </Text>
                        <Text style={[
                            styles.wiridMeaning,
                            activeDark && { color: "#34d399" },
                        ]}>
                            {getMeaning(currentName)}
                        </Text>

                        <View style={styles.counterWrap}>
                            <Pressable
                                accessibilityLabel={t(
                                    "explore.asmaul.counterAccessibility",
                                    {
                                        count,
                                        target: WIRID_TARGET,
                                    },
                                )}
                                accessibilityRole='button'
                                onPress={() => updateCount(count + 1)}
                                style={[
                                    styles.counterButton,
                                    reachedTarget && styles.counterButtonDone,
                                ]}
                                testID='web-app-asmaul-wirid-counter'
                            >
                                <Text style={styles.counterNumber}>
                                    {count}
                                </Text>
                                <Text style={styles.counterTarget}>
                                    / {WIRID_TARGET}
                                </Text>
                            </Pressable>
                        </View>

                        <View style={styles.progressBlock}>
                            <View style={[
                                styles.progressTrack,
                                activeDark && { backgroundColor: "#374151" },
                            ]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progressPct}%` },
                                    ]}
                                />
                            </View>
                            <Text style={[
                                styles.progressText,
                                activeDark && { color: "#9ca3af" },
                            ]}>
                                {progressPct}% · {count}/{WIRID_TARGET}
                            </Text>
                        </View>

                        <View style={styles.actionRow}>
                            <Pressable
                                accessibilityRole='button'
                                onPress={() => updateCount(0)}
                                style={[
                                    styles.neutralButton,
                                    activeDark && { backgroundColor: "#1e293b" },
                                ]}
                            >
                                <RotateCcw
                                    color={activeDark ? "#cbd5e1" : "#374151"}
                                    size={15}
                                    strokeWidth={2.2}
                                />
                                <Text style={[
                                    styles.neutralButtonText,
                                    activeDark && { color: "#cbd5e1" },
                                ]}>
                                    {t("explore.asmaul.reset")}
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole='button'
                                onPress={() => {
                                    setAsmaulCounts({});
                                    setAsmaulWiridCount({}, nameId, 0).catch(
                                        (e) => console.error(e),
                                    );
                                }}
                                style={[
                                    styles.dangerButton,
                                    activeDark && { backgroundColor: "rgba(220, 38, 38, 0.2)" },
                                ]}
                            >
                                <RefreshCcw
                                    color='#dc2626'
                                    size={15}
                                    strokeWidth={2.2}
                                />
                                <Text style={[
                                    styles.dangerButtonText,
                                    activeDark && { color: "#f87171" },
                                ]}>
                                    {t("explore.asmaul.resetAll")}
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole='button'
                                onPress={() =>
                                    setVibrate((current) => !current)
                                }
                                style={[
                                    styles.vibrateButton,
                                    activeDark && { backgroundColor: "#1e293b" },
                                    vibrate && styles.vibrateButtonActive,
                                    activeDark && vibrate && { backgroundColor: "#064e3b" },
                                ]}
                            >
                                <Hand
                                    color={vibrate ? (activeDark ? "#34d399" : "#047857") : activeDark ? "#9ca3af" : "#64748b"}
                                    size={15}
                                    strokeWidth={2.2}
                                />
                                <Text
                                    style={[
                                        styles.vibrateButtonText,
                                        activeDark && { color: "#9ca3af" },
                                        vibrate &&
                                            styles.vibrateButtonTextActive,
                                        activeDark && vibrate && { color: "#34d399" },
                                    ]}
                                >
                                    {t("explore.asmaul.vibrateStatus", {
                                        state: vibrate
                                            ? t("explore.asmaul.on")
                                            : t("explore.asmaul.off"),
                                    })}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <StatTile
                            activeDark={activeDark}
                            color='#047857'
                            label={t("explore.asmaul.countLabel")}
                            value={count}
                        />
                        <StatTile
                            activeDark={activeDark}
                            color='#d97706'
                            label={t("explore.asmaul.targetLabel")}
                            value={WIRID_TARGET}
                        />
                        <StatTile
                            activeDark={activeDark}
                            color='#2563eb'
                            label={t("explore.asmaul.todayTotalLabel")}
                            value={totalToday}
                        />
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: "#f8fafc",
        flex: 1,
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    headerArabic: {
        color: "#047857",
        fontSize: 30,
        lineHeight: 50,
        marginBottom: 2,
        textAlign: "center",
        paddingVertical: 4,
    },
    title: {
        color: "#064e3b",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
        textAlign: "center",
    },
    subtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: 3,
        textAlign: "center",
    },
    toolbar: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    toolbarText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "800",
    },
    toolbarActions: {
        flexDirection: "row",
        flexShrink: 1,
        flexWrap: "wrap",
        gap: spacing.xs,
        justifyContent: "flex-end",
    },
    smallAction: {
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: 5,
        paddingHorizontal: spacing.sm,
        paddingVertical: 7,
        minHeight: 44,
    },
    smallActionActive: {
        backgroundColor: "#fef3c7",
    },
    smallActionText: {
        color: "#475569",
        fontSize: 12,
        fontWeight: "800",
    },
    smallActionTextActive: {
        color: "#b45309",
    },
    flashcard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.xl,
        borderWidth: 1,
        justifyContent: "center",
        marginBottom: spacing.md,
        minHeight: 320,
        padding: spacing.xl,
        position: "relative",
    },
    badgeText: {
        backgroundColor: "#d1fae5",
        borderRadius: 999,
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        left: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        position: "absolute",
        top: spacing.md,
    },
    cardHint: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: "800",
        position: "absolute",
        right: spacing.md,
        top: spacing.md,
    },
    flashArabic: {
        color: "#064e3b",
        fontSize: 48,
        lineHeight: 78,
        marginBottom: spacing.md,
        textAlign: "center",
        paddingVertical: 4,
    },
    flashLatin: {
        color: "#1f2937",
        fontSize: 20,
        fontWeight: "900",
        lineHeight: 27,
        textAlign: "center",
    },
    flashMeaning: {
        color: "#047857",
        fontSize: 15,
        fontWeight: "800",
        lineHeight: 22,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    guessHint: {
        color: "#94a3b8",
        fontSize: 13,
        fontStyle: "italic",
        fontWeight: "700",
        marginTop: spacing.sm,
        textAlign: "center",
    },
    navRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
    iconButton: {
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderRadius: radius.md,
        height: 48,
        justifyContent: "center",
        width: 48,
    },
    iconButtonPrimary: {
        backgroundColor: "#047857",
    },
    disabledButton: {
        opacity: 0.38,
    },
    primaryAction: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.md,
        flex: 1,
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: spacing.md,
    },
    primaryActionText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    counterCard: {
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.xl,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    cardTopRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    indexBadge: {
        backgroundColor: "#ecfdf5",
        borderRadius: 999,
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
    },
    indexActions: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    wiridArabic: {
        color: "#064e3b",
        fontSize: 34,
        lineHeight: 52,
        textAlign: "center",
        paddingVertical: 4,
    },
    wiridLatin: {
        color: "#64748b",
        fontSize: 13,
        fontStyle: "italic",
        fontWeight: "700",
        marginTop: 2,
        textAlign: "center",
    },
    wiridMeaning: {
        color: "#065f46",
        fontSize: 15,
        fontWeight: "900",
        lineHeight: 22,
        marginBottom: spacing.lg,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    counterWrap: {
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    counterButton: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: 112,
        height: 224,
        justifyContent: "center",
        width: 224,
    },
    counterButtonDone: {
        backgroundColor: "#059669",
    },
    counterNumber: {
        color: "#ffffff",
        fontSize: 58,
        fontWeight: "900",
        lineHeight: 66,
    },
    counterTarget: {
        color: "rgba(255,255,255,0.82)",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
        marginTop: 4,
        textTransform: "uppercase",
    },
    progressBlock: {
        marginBottom: spacing.lg,
    },
    progressTrack: {
        backgroundColor: "#e5e7eb",
        borderRadius: 999,
        height: 8,
        overflow: "hidden",
    },
    progressFill: {
        backgroundColor: "#10b981",
        borderRadius: 999,
        height: "100%",
    },
    progressText: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "800",
        marginTop: spacing.xs,
        textAlign: "center",
    },
    actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        justifyContent: "center",
    },
    neutralButton: {
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    neutralButtonText: {
        color: "#374151",
        fontSize: 12,
        fontWeight: "900",
    },
    dangerButton: {
        alignItems: "center",
        backgroundColor: "#fef2f2",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    dangerButtonText: {
        color: "#dc2626",
        fontSize: 12,
        fontWeight: "900",
    },
    vibrateButton: {
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    vibrateButtonActive: {
        backgroundColor: "#ecfdf5",
    },
    vibrateButtonText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "900",
    },
    vibrateButtonTextActive: {
        color: "#047857",
    },
    statsGrid: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    statTile: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        flex: 1,
        padding: spacing.md,
    },
    statValue: {
        fontSize: 23,
        fontWeight: "900",
        lineHeight: 28,
    },
    statLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "800",
        marginTop: 2,
        textAlign: "center",
    },
    emptyCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.xl,
        borderWidth: 1,
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 220,
        padding: spacing.lg,
    },
    emptyText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
        textAlign: "center",
    },
});
