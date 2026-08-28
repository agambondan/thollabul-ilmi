import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
    BookOpen,
    Bookmark,
    Globe,
    HelpCircle,
    ListChecks,
    MessageCircle,
    Scale,
    Star,
    StickyNote,
    Users,
    Video,
} from "lucide-react-native";
import { Card, CardTitle } from "../../components/Card";
import { CompactRow, SectionHeader } from "../../components/Paper";
import { allFeatures, belajarFeatureGroups } from "../../data/mobileFeatures";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, radius, spacing } from "../../theme";

export const LOCAL_TOOL_TYPES = [
    "tasbih",
    "zakat",
    "faraidh",
    "notifications",
    "surah-content",
    "sholat-tracker",
    "asmaul-wirid",
    "asmaul-flashcard",
    "forum",
    "historical-map",
    "tokoh",
    "komunitas",
];

const featureIcons = {
    "asbabun-nuzul": BookOpen,
    "asmaul-flashcard": Star,
    "asmaul-husna": Star,
    blog: BookOpen,
    bookmarks: Bookmark,
    "community-feed": MessageCircle,
    fiqh: BookOpen,
    goals: Star,
    "jarh-tadil": Scale,
    kajian: Video,
    kamus: Star,
    komunitas: Users,
    leaderboard: Users,
    lessons: BookOpen,
    manasik: BookOpen,
    notes: StickyNote,
    "panduan-sholat": BookOpen,
    perawi: Users,
    quiz: HelpCircle,
    sejarah: Globe,
    siroh: Users,
    stats: Globe,
    tafsir: BookOpen,
    "user-wird": ListChecks,
};

const catalogSections = belajarFeatureGroups.map((group) => ({
    key: group.key,
    meta: group.meta,
    rows: group.features.map((feature) => ({
        Icon: featureIcons[feature.key] ?? BookOpen,
        featureKey: feature.key,
    })),
    title: group.label,
}));

const normalizeSearchText = (value = "") => `${value}`.trim().toLowerCase();

const matchesCatalogQuery = (section, feature, query) => {
    const text = [
        section.title,
        section.meta,
        feature?.title,
        feature?.subtitle,
        feature?.group,
        feature?.key,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return text.includes(query);
};

export const findFeatureByKey = (featureKey) =>
    allFeatures.find((feature) => feature.key === featureKey);

export const isPaginatedFeature = (feature) =>
    feature?.type === "feed" ||
    (Boolean(feature?.endpoint) &&
        ["list", "protected-list"].includes(feature.type));

const defaultBadgeTranslations = {
    "explore.catalog.badge.account": "Akun",
    "explore.catalog.badge.local": "Lokal",
    "explore.catalog.badge.recent": "Terakhir",
};
const fallbackTranslate = (key) => defaultBadgeTranslations[key] ?? key;

export const getFeatureBadges = (
    feature,
    recentFeatureKeys = {},
    t = fallbackTranslate,
) => {
    const badges = [];

    if (recentFeatureKeys[feature?.key])
        badges.push(t("explore.catalog.badge.recent"));
    if (Array.isArray(feature?.badges)) badges.push(...feature.badges);
    if (["protected-list", "bookmarks", "notes"].includes(feature?.type))
        badges.push(t("explore.catalog.badge.account"));
    if (LOCAL_TOOL_TYPES.includes(feature?.type))
        badges.push(t("explore.catalog.badge.local"));

    return [...new Set(badges)].slice(0, 3);
};

export const getVisibleCatalogSections = (featureSearch) => {
    const query = normalizeSearchText(featureSearch);
    return catalogSections
        .map((section) => {
            const rows = section.rows
                .map((row) => ({
                    ...row,
                    feature: findFeatureByKey(row.featureKey),
                }))
                .filter(
                    (row) =>
                        row.feature &&
                        (!query ||
                            matchesCatalogQuery(section, row.feature, query)),
                );
            return { ...section, rows };
        })
        .filter((section) => section.rows.length > 0);
};

function FeatureCatalogBase({
    featureSearch,
    onFeaturePress,
    onTogglePinnedFeature,
    pinnedFeatureKeys,
    recentFeatureKeys,
    variant = "classic",
    webAppTheme,
    webAppThemeStyles = {},
}) {
    const { t } = useMobileLocale();
    const visibleSections = useMemo(
        () => getVisibleCatalogSections(featureSearch),
        [featureSearch],
    );
    const handleFeaturePress = useCallback(
        (featureKey) => {
            const feature = findFeatureByKey(featureKey);
            if (feature) onFeaturePress(feature);
        },
        [onFeaturePress],
    );
    const handleTogglePinnedFeature = useCallback(
        (event, featureKey) => {
            const feature = findFeatureByKey(featureKey);
            if (feature) onTogglePinnedFeature(event, feature);
        },
        [onTogglePinnedFeature],
    );

    if (!visibleSections.length) {
        if (variant === "webApp") {
            return (
                <View style={[styles.webAppEmpty, webAppThemeStyles.empty]}>
                    <Text
                        style={[
                            styles.webAppEmptyTitle,
                            webAppThemeStyles.emptyTitle,
                        ]}
                    >
                        {t("explore.catalog.emptyTitle")}
                    </Text>
                    <Text
                        style={[
                            styles.webAppEmptyText,
                            webAppThemeStyles.emptyText,
                        ]}
                    >
                        {t("explore.catalog.emptyText")}
                    </Text>
                </View>
            );
        }

        return (
            <Card>
                <CardTitle meta={t("explore.catalog.emptyMeta")}>
                    {t("explore.catalog.emptyTitle")}
                </CardTitle>
                <Text style={styles.body}>
                    {t("explore.catalog.emptyText")}
                </Text>
            </Card>
        );
    }

    if (variant === "webApp") {
        return visibleSections.map((section) => (
            <View key={section.key} style={styles.webAppSection}>
                <View style={styles.webAppSectionHeader}>
                    <Text
                        style={[
                            styles.webAppSectionTitle,
                            webAppThemeStyles.sectionTitle,
                        ]}
                    >
                        {section.title.toUpperCase()}
                    </Text>
                    {section.meta ? (
                        <Text
                            style={[
                                styles.webAppSectionMeta,
                                webAppThemeStyles.sectionMeta,
                            ]}
                        >
                            {section.meta}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.webAppGrid}>
                    {section.rows.map((row) => {
                        const pinned = Boolean(
                            pinnedFeatureKeys[row.feature.key],
                        );
                        const badgeLabels = getFeatureBadges(
                            row.feature,
                            recentFeatureKeys,
                            t,
                        ).join("|");
                        return (
                            <WebAppFeatureTile
                                badgeLabels={badgeLabels}
                                Icon={row.Icon}
                                featureKey={row.feature.key}
                                key={row.feature.key}
                                onFeaturePress={handleFeaturePress}
                                onTogglePinnedFeature={
                                    handleTogglePinnedFeature
                                }
                                pinAccessibilityLabel={t(
                                    pinned
                                        ? "explore.catalog.unpinAccessibility"
                                        : "explore.catalog.pinAccessibility",
                                    { title: row.feature.title },
                                )}
                                pinned={pinned}
                                subtitle={row.feature.subtitle}
                                title={row.feature.title}
                                webAppTheme={webAppTheme}
                                webAppThemeStyles={webAppThemeStyles}
                            />
                        );
                    })}
                </View>
            </View>
        ));
    }

    return visibleSections.map((section) => (
        <Section key={section.key} section={section}>
            {section.rows.map((row) => {
                const pinned = Boolean(pinnedFeatureKeys[row.feature.key]);
                const badgeLabels = getFeatureBadges(
                    row.feature,
                    recentFeatureKeys,
                    t,
                ).join("|");
                return (
                    <FeatureRow
                        badgeLabels={badgeLabels}
                        Icon={row.Icon}
                        featureKey={row.feature.key}
                        key={row.feature.key}
                        onFeaturePress={handleFeaturePress}
                        onTogglePinnedFeature={handleTogglePinnedFeature}
                        pinAccessibilityLabel={t(
                            pinned
                                ? "explore.catalog.unpinAccessibility"
                                : "explore.catalog.pinAccessibility",
                            { title: row.feature.title },
                        )}
                        pinned={pinned}
                        subtitle={row.feature.subtitle}
                        title={row.feature.title}
                    />
                );
            })}
        </Section>
    ));
}

function Section({ children, section }) {
    return (
        <Card style={styles.sectionCard}>
            <SectionHeader meta={section.meta} title={section.title} />
            {children}
        </Card>
    );
}

export const FeatureCatalog = memo(FeatureCatalogBase);

const FeatureRow = memo(function FeatureRow({
    Icon,
    badgeLabels,
    featureKey,
    onFeaturePress,
    onTogglePinnedFeature,
    pinAccessibilityLabel,
    pinned,
    subtitle,
    title,
    webAppTheme,
    webAppThemeStyles = {},
}) {
    const badges = useMemo(
        () => (badgeLabels ? badgeLabels.split("|") : []),
        [badgeLabels],
    );
    const handlePress = useCallback(
        () => onFeaturePress(featureKey),
        [featureKey, onFeaturePress],
    );
    const handleTogglePinned = useCallback(
        (event) => onTogglePinnedFeature(event, featureKey),
        [featureKey, onTogglePinnedFeature],
    );

    return (
        <CompactRow
            badges={badges}
            Icon={Icon}
            onPress={handlePress}
            right={
                <Pressable
                    accessibilityLabel={pinAccessibilityLabel}
                    accessibilityRole='button'
                    accessibilityState={{ selected: pinned }}
                    android_ripple={{
                        color: "rgba(91, 110, 91, 0.12)",
                        borderless: true,
                    }}
                    onPress={handleTogglePinned}
                    style={[styles.pinButton, pinned && styles.pinButtonActive]}
                >
                    <Star
                        color={pinned ? colors.onPrimary : colors.primary}
                        fill={pinned ? colors.onPrimary : "transparent"}
                        size={15}
                        strokeWidth={2.2}
                    />
                </Pressable>
            }
            subtitle={subtitle}
            title={title}
        />
    );
});

const WebAppFeatureTile = memo(function WebAppFeatureTile({
    Icon,
    badgeLabels,
    featureKey,
    onFeaturePress,
    onTogglePinnedFeature,
    pinAccessibilityLabel,
    pinned,
    subtitle,
    title,
    webAppTheme,
    webAppThemeStyles = {},
}) {
    const badges = useMemo(
        () => (badgeLabels ? badgeLabels.split("|") : []),
        [badgeLabels],
    );
    const handlePress = useCallback(
        () => onFeaturePress(featureKey),
        [featureKey, onFeaturePress],
    );
    const handleTogglePinned = useCallback(
        (event) => onTogglePinnedFeature(event, featureKey),
        [featureKey, onTogglePinnedFeature],
    );

    return (
        <Pressable
            android_ripple={{
                color: webAppTheme?.ripple ?? "#1f2937",
                borderless: false,
            }}
            onPress={handlePress}
            style={[styles.webAppTile, webAppThemeStyles.tile]}
        >
            <View style={styles.webAppTileTop}>
                <View
                    style={[styles.webAppIconWrap, webAppThemeStyles.iconWrap]}
                >
                    <Icon
                        color={webAppTheme?.accent ?? "#34d399"}
                        size={18}
                        strokeWidth={2.2}
                    />
                </View>
                <Pressable
                    accessibilityLabel={pinAccessibilityLabel}
                    accessibilityRole='button'
                    accessibilityState={{ selected: pinned }}
                    android_ripple={{
                        color: webAppTheme?.ripple ?? "#1f2937",
                        borderless: true,
                    }}
                    onPress={handleTogglePinned}
                    style={[
                        styles.webAppPinButton,
                        webAppThemeStyles.pinButton,
                        pinned && styles.webAppPinButtonActive,
                        pinned && webAppThemeStyles.pinButtonActive,
                    ]}
                >
                    <Star
                        color={
                            pinned
                                ? "#ffffff"
                                : (webAppTheme?.accent ?? "#34d399")
                        }
                        fill={pinned ? "#ffffff" : "transparent"}
                        size={14}
                        strokeWidth={2.2}
                    />
                </Pressable>
            </View>
            <Text
                numberOfLines={1}
                style={[styles.webAppTileTitle, webAppThemeStyles.tileTitle]}
            >
                {title}
            </Text>
            {subtitle ? (
                <Text
                    numberOfLines={2}
                    style={[
                        styles.webAppTileSubtitle,
                        webAppThemeStyles.tileSubtitle,
                    ]}
                >
                    {subtitle}
                </Text>
            ) : null}
            {badges.length ? (
                <View style={styles.webAppBadges}>
                    {badges.map((badge) => (
                        <Text
                            key={`${featureKey}-${badge}`}
                            numberOfLines={1}
                            style={[
                                styles.webAppBadge,
                                webAppThemeStyles.badge,
                            ]}
                        >
                            {badge}
                        </Text>
                    ))}
                </View>
            ) : null}
        </Pressable>
    );
});

const styles = StyleSheet.create({
    body: {
        color: colors.muted,
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing.xs,
    },
    pinButton: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flexShrink: 0,
        height: 32,
        justifyContent: "center",
        width: 32,
    },
    pinButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sectionCard: {
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    webAppBadges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 5,
        marginTop: spacing.sm,
    },
    webAppBadge: {
        backgroundColor: "rgba(52, 211, 153, 0.12)",
        borderRadius: 999,
        color: "#86efac",
        fontSize: 10,
        fontWeight: "800",
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    webAppEmpty: {
        backgroundColor: "#111827",
        borderColor: "#243044",
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.md,
    },
    webAppEmptyText: {
        color: "#94a3b8",
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.xs,
    },
    webAppEmptyTitle: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "900",
    },
    webAppGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    webAppIconWrap: {
        alignItems: "center",
        backgroundColor: "rgba(52, 211, 153, 0.10)",
        borderRadius: 8,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    webAppPinButton: {
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        borderColor: "#334155",
        borderRadius: 8,
        borderWidth: 1,
        height: 30,
        justifyContent: "center",
        width: 30,
    },
    webAppPinButtonActive: {
        backgroundColor: "#059669",
        borderColor: "#34d399",
    },
    webAppSection: {
        marginTop: spacing.lg,
    },
    webAppSectionHeader: {
        marginBottom: spacing.sm,
    },
    webAppSectionMeta: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 2,
    },
    webAppSectionTitle: {
        color: "#34d399",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 0,
    },
    webAppTile: {
        backgroundColor: "#1e293b",
        borderColor: "#243044",
        borderRadius: 8,
        borderWidth: 1,
        flexBasis: "48%",
        flexGrow: 1,
        minHeight: 132,
        minWidth: 146,
        padding: spacing.md,
    },
    webAppTileSubtitle: {
        color: "#cbd5e1",
        fontSize: 12,
        lineHeight: 17,
        marginTop: 4,
    },
    webAppTileTitle: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "900",
        letterSpacing: 0,
    },
    webAppTileTop: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
});
