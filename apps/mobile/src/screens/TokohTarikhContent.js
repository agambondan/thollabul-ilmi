import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { AppImage } from "../components/AppImage";
import { AppModalSheet } from "../components/AppModalSheet";
import { colors, getThemeColors, radius, spacing, touchTarget } from "../theme";
import { requestJson } from "../api/client";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { staticTokohTarikh } from "../data/staticTokohTarikh";

const ERA_FILTERS = [
    { value: "", label: "Semua" },
    { value: "Sahabat", label: "Sahabat" },
    { value: "Tabi'in", label: "Tabi'in" },
    { value: "Tabi'ut Tabi'in", label: "Tabi'ut" },
    { value: "Ulama Klasik", label: "Ulama Klasik" },
    { value: "Ulama Modern", label: "Ulama Modern" },
    { value: "Ilmuwan", label: "Ilmuwan" },
    { value: "Khalifah", label: "Khalifah" },
];

const getTokohTitle = (tokoh) =>
    tokoh?.translation?.title_idn ??
    tokoh?.translation?.title_en ??
    tokoh?.nama ??
    tokoh?.name ??
    "Tokoh";

const getTokohInitial = (tokoh) => getTokohTitle(tokoh).charAt(0).toUpperCase();

const getTokohMeta = (tokoh) => tokoh?.era || tokoh?.kategori || "";

const getTokohYears = (tokoh) => {
    if (!tokoh?.tahun_lahir && !tokoh?.tahun_wafat) return "";
    return `${tokoh.tahun_lahir || "?"} - ${tokoh.tahun_wafat || "..."}`;
};

const getTokohBio = (tokoh) =>
    tokoh?.biografi ??
    tokoh?.translation?.description_idn ??
    tokoh?.translation?.description_en ??
    "";

const getTokohContribution = (tokoh) =>
    tokoh?.kontribusi ??
    tokoh?.translation?.idn ??
    tokoh?.translation?.en ??
    "";

const WEB_APP_TOKOH_THEMES = {
    light: {
        accent: "#4f46e5",
        accentSoft: "#e0e7ff",
        bg: "#f8fafc",
        border: "#e5e7eb",
        chipText: "#64748b",
        modalHighlight: "#eef2ff",
        muted: "#64748b",
        note: "#94a3b8",
        surface: "#ffffff",
        text: "#111827",
    },
    dark: {
        accent: "#818cf8",
        accentSoft: "#312e81",
        bg: "#020617",
        border: "#334155",
        chipText: "#cbd5e1",
        modalHighlight: "#1e1b4b",
        muted: "#94a3b8",
        note: "#64748b",
        surface: "#111827",
        text: "#f8fafc",
    },
};

export function TokohTarikhContent() {
    const { isDarkTheme = false, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isPaperLayout: !isWebAppLayout,
    });
    const webAppTheme = isDarkTheme
        ? WEB_APP_TOKOH_THEMES.dark
        : WEB_APP_TOKOH_THEMES.light;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [era, setEra] = useState("");
    const [selected, setSelected] = useState(null);

    const fetchTokoh = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: "1", size: "100" };
            if (search) params.q = search;
            if (era) params.era = era;
            const qs = new URLSearchParams(params).toString();
            const data = await requestJson(`/api/v1/tokoh-tarikh?${qs}`);
            if (Array.isArray(data?.items)) {
                setItems(data.items);
            } else {
                setItems([]);
            }
        } catch {
            let filtered = staticTokohTarikh || [];
            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter(
                    (t) =>
                        (t.nama || "").toLowerCase().includes(q) ||
                        (t.biografi || "").toLowerCase().includes(q) ||
                        (t.kontribusi || "").toLowerCase().includes(q) ||
                        (t.kategori || "").toLowerCase().includes(q) ||
                        (t.era || "").toLowerCase().includes(q),
                );
            }
            if (era) {
                const ef = era.toLowerCase().replace(/['\s_-]/g, "");
                filtered = filtered.filter((t) => {
                    const eraStr = (t.era || "")
                        .toLowerCase()
                        .replace(/['\s_-]/g, "");
                    const katStr = (t.kategori || "")
                        .toLowerCase()
                        .replace(/['\s_-]/g, "");
                    return (
                        eraStr.includes(ef) ||
                        ef.includes(eraStr) ||
                        katStr.includes(ef) ||
                        ef.includes(katStr)
                    );
                });
            }
            setItems(filtered);
        } finally {
            setLoading(false);
        }
    }, [search, era]);

    useEffect(() => {
        fetchTokoh();
    }, [fetchTokoh]);

    const renderSearch = () => (
        <TextInput
            onChangeText={setSearch}
            placeholder='Cari tokoh...'
            placeholderTextColor={
                isWebAppLayout ? webAppTheme.muted : theme.muted
            }
            returnKeyType='search'
            style={[
                styles.searchInput,
                !isWebAppLayout && {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.ink,
                },
                isWebAppLayout && styles.webAppSearchInput,
                isWebAppLayout && {
                    backgroundColor: webAppTheme.surface,
                    borderColor: webAppTheme.border,
                    color: webAppTheme.text,
                },
            ]}
            testID={isWebAppLayout ? "tokoh-web-app-search" : undefined}
            value={search}
        />
    );

    const renderFilters = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterContent}
        >
            {ERA_FILTERS.map((f) => (
                <Pressable
                    accessibilityRole='button'
                    key={f.value}
                    onPress={() => setEra(f.value === era ? "" : f.value)}
                    style={[
                        styles.chip,
                        !isWebAppLayout && {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                        },
                        isWebAppLayout && styles.webAppChip,
                        isWebAppLayout && {
                            backgroundColor: webAppTheme.surface,
                            borderColor: webAppTheme.border,
                        },
                        era === f.value &&
                            !isWebAppLayout && [
                                styles.chipActive,
                                {
                                    backgroundColor: theme.primary,
                                    borderColor: theme.primary,
                                },
                            ],
                        isWebAppLayout &&
                            era === f.value &&
                            styles.webAppChipActive,
                        isWebAppLayout &&
                            era === f.value && {
                                backgroundColor: webAppTheme.accent,
                                borderColor: webAppTheme.accent,
                            },
                    ]}
                >
                    <Text
                        style={[
                            styles.chipText,
                            !isWebAppLayout && { color: theme.muted },
                            isWebAppLayout && { color: webAppTheme.chipText },
                            era === f.value &&
                                !isWebAppLayout && [
                                    styles.chipTextActive,
                                    { color: theme.onPrimary },
                                ],
                            isWebAppLayout &&
                                era === f.value && { color: "#ffffff" },
                        ]}
                    >
                        {f.label}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );

    const renderLoading = () => (
        <View
            style={[
                styles.loadingContainer,
                isWebAppLayout ? styles.webAppLoadingContainer : null,
                isWebAppLayout && {
                    backgroundColor: webAppTheme.surface,
                    borderColor: webAppTheme.border,
                },
            ]}
        >
            <ActivityIndicator
                size='large'
                color={isWebAppLayout ? webAppTheme.accent : theme.primary}
            />
            {isWebAppLayout ? (
                <Text
                    style={[
                        styles.webAppLoadingText,
                        { color: webAppTheme.muted },
                    ]}
                >
                    Memuat tokoh tarikh...
                </Text>
            ) : null}
        </View>
    );

    const renderEmpty = () => (
        <View
            style={[
                styles.emptyContainer,
                isWebAppLayout ? styles.webAppEmpty : null,
                isWebAppLayout && {
                    backgroundColor: webAppTheme.surface,
                    borderColor: webAppTheme.border,
                },
            ]}
        >
            <Text
                style={[
                    styles.empty,
                    !isWebAppLayout && { color: theme.muted },
                    isWebAppLayout && styles.webAppEmptyText,
                    isWebAppLayout && { color: webAppTheme.note },
                ]}
            >
                {isWebAppLayout ? "Belum ada data tokoh." : "Tidak ditemukan"}
            </Text>
        </View>
    );

    const renderTokohCard = (tokoh) => {
        const title = getTokohTitle(tokoh);
        const meta = getTokohMeta(tokoh);
        const years = getTokohYears(tokoh);
        const cardStyle = isWebAppLayout
            ? [
                  styles.webAppCard,
                  {
                      backgroundColor: webAppTheme.surface,
                      borderColor: webAppTheme.border,
                  },
              ]
            : [
                  styles.card,
                  {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                  },
              ];
        const avatarStyle = isWebAppLayout
            ? [
                  styles.webAppCardAvatar,
                  { backgroundColor: webAppTheme.accentSoft },
              ]
            : [
                  styles.cardAvatar,
                  { backgroundColor: theme.surfaceMuted },
              ];

        return (
            <Pressable
                accessibilityRole='button'
                key={tokoh.id ?? title}
                android_ripple={{
                    color: isWebAppLayout
                        ? "rgba(79, 70, 229, 0.12)"
                        : theme.ripple,
                    borderless: false,
                }}
                onPress={() => setSelected(tokoh)}
                style={cardStyle}
                testID={isWebAppLayout ? "tokoh-web-app-card" : undefined}
            >
                <View style={avatarStyle}>
                    {tokoh.image_url ? (
                        <AppImage
                            accessibilityLabel={tokoh.name || "Foto tokoh"}
                            source={{ uri: tokoh.image_url }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={styles.avatarFallbackWrap}>
                            <Text
                                style={[
                                    styles.avatarFallback,
                                    !isWebAppLayout && {
                                        color: theme.primary,
                                    },
                                    isWebAppLayout &&
                                        styles.webAppAvatarFallback,
                                    isWebAppLayout && {
                                        backgroundColor: webAppTheme.accentSoft,
                                        color: webAppTheme.accent,
                                    },
                                ]}
                            >
                                {getTokohInitial(tokoh)}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardBody}>
                    <Text
                        style={[
                            styles.cardName,
                            !isWebAppLayout && { color: theme.ink },
                            isWebAppLayout && styles.webAppCardName,
                            isWebAppLayout && { color: webAppTheme.text },
                        ]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    <View style={styles.cardMetaRow}>
                        {meta ? (
                            <View
                                style={[
                                    styles.cardEraBadge,
                                    !isWebAppLayout && {
                                        backgroundColor: theme.surfaceMuted,
                                    },
                                    isWebAppLayout && {
                                        backgroundColor: webAppTheme.accentSoft,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.cardEra,
                                        !isWebAppLayout && {
                                            color: theme.primary,
                                        },
                                        isWebAppLayout && styles.webAppCardEra,
                                        isWebAppLayout && {
                                            color: webAppTheme.accent,
                                        },
                                    ]}
                                >
                                    {meta}
                                </Text>
                            </View>
                        ) : null}
                        {years ? (
                            <Text
                                style={[
                                    styles.cardTahun,
                                    !isWebAppLayout && { color: theme.muted },
                                    isWebAppLayout && styles.webAppCardTahun,
                                    isWebAppLayout && {
                                        color: webAppTheme.muted,
                                    },
                                ]}
                            >
                                {years}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </Pressable>
        );
    };

    const renderContent = () => (
        <>
            {loading ? (
                renderLoading()
            ) : items.length === 0 ? (
                renderEmpty()
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text
                        style={[
                            styles.resultCount,
                            !isWebAppLayout && { color: theme.muted },
                            isWebAppLayout && styles.webAppResultCount,
                            isWebAppLayout && { color: webAppTheme.muted },
                        ]}
                    >
                        {items.length} tokoh
                    </Text>
                    <View style={isWebAppLayout ? styles.webAppCardGrid : null}>
                        {items.map(renderTokohCard)}
                    </View>
                </ScrollView>
            )}
        </>
    );

    const renderDetailModal = () => {
        const title = getTokohTitle(selected);
        const meta = getTokohMeta(selected);
        const years = getTokohYears(selected);
        const bio = getTokohBio(selected);
        const contribution = getTokohContribution(selected);
        const subtitle = [meta, years].filter(Boolean).join(" · ");

        return (
            <AppModalSheet
                onClose={() => setSelected(null)}
                subtitle={subtitle}
                title={title}
                visible={Boolean(selected)}
            >
                {selected && (
                    <View style={styles.modalBodyWrap}>
                        <View style={styles.modalAvatarWrap}>
                            {selected.image_url ? (
                                <AppImage
                                    accessibilityLabel={
                                        selected.name || "Foto tokoh"
                                    }
                                    source={{ uri: selected.image_url }}
                                    style={styles.modalAvatar}
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.modalAvatarFallback,
                                        !isWebAppLayout && {
                                            backgroundColor: theme.surfaceMuted,
                                        },
                                        isWebAppLayout && {
                                            backgroundColor:
                                                webAppTheme.accentSoft,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.modalAvatarFallbackText,
                                            !isWebAppLayout && {
                                                color: theme.primary,
                                            },
                                            isWebAppLayout && {
                                                color: webAppTheme.accent,
                                            },
                                        ]}
                                    >
                                        {getTokohInitial(selected)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.modalBadgeRow}>
                            {meta ? (
                                <View
                                    style={[
                                        styles.modalBadge,
                                        !isWebAppLayout && {
                                            backgroundColor: theme.surfaceMuted,
                                        },
                                        isWebAppLayout && {
                                            backgroundColor:
                                                webAppTheme.accentSoft,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.modalBadgeText,
                                            !isWebAppLayout && {
                                                color: theme.primary,
                                            },
                                            isWebAppLayout && {
                                                color: webAppTheme.accent,
                                            },
                                        ]}
                                    >
                                        {meta}
                                    </Text>
                                </View>
                            ) : null}
                            {selected.kategori &&
                            selected.kategori !== meta ? (
                                <View
                                    style={[
                                        styles.modalBadge,
                                        styles.modalBadgeKategori,
                                        !isWebAppLayout && {
                                            backgroundColor: theme.surfaceMuted,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.modalBadgeText,
                                            !isWebAppLayout && {
                                                color: theme.muted,
                                            },
                                        ]}
                                    >
                                        {selected.kategori}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {bio ? (
                            <View style={styles.modalSection}>
                                <Text
                                    style={[
                                        styles.modalSectionTitle,
                                        !isWebAppLayout && {
                                            color: theme.ink,
                                        },
                                        isWebAppLayout && {
                                            color: webAppTheme.text,
                                        },
                                    ]}
                                >
                                    Biografi
                                </Text>
                                <Text
                                    style={[
                                        styles.modalBody,
                                        !isWebAppLayout && {
                                            color: theme.muted,
                                        },
                                        isWebAppLayout && {
                                            color: webAppTheme.muted,
                                        },
                                    ]}
                                >
                                    {bio}
                                </Text>
                            </View>
                        ) : null}

                        {contribution ? (
                            <View
                                style={[
                                    styles.modalSection,
                                    styles.modalSectionHighlight,
                                    !isWebAppLayout && {
                                        backgroundColor: theme.surfaceMuted,
                                        borderColor: theme.border,
                                    },
                                    isWebAppLayout && {
                                        backgroundColor:
                                            webAppTheme.modalHighlight,
                                        borderColor: webAppTheme.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.modalSectionTitle,
                                        !isWebAppLayout && {
                                            color: theme.primary,
                                        },
                                        isWebAppLayout && {
                                            color: webAppTheme.accent,
                                        },
                                    ]}
                                >
                                    Kontribusi
                                </Text>
                                <Text
                                    style={[
                                        styles.modalBody,
                                        !isWebAppLayout && {
                                            color: theme.ink,
                                        },
                                        isWebAppLayout && {
                                            color: webAppTheme.muted,
                                        },
                                    ]}
                                >
                                    {contribution}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                )}
            </AppModalSheet>
        );
    };

    if (isWebAppLayout) {
        return (
            <View
                style={[styles.webAppRoot, { backgroundColor: webAppTheme.bg }]}
                testID='tokoh-web-app-surface'
            >
                <View style={styles.webAppHeader}>
                    <View
                        style={[
                            styles.webAppIcon,
                            { backgroundColor: webAppTheme.accentSoft },
                        ]}
                    >
                        <Text
                            style={[
                                styles.webAppIconText,
                                { color: webAppTheme.accent },
                            ]}
                        >
                            T
                        </Text>
                    </View>
                    <Text
                        style={[
                            styles.webAppTitle,
                            { color: webAppTheme.text },
                        ]}
                    >
                        Tokoh Tarikh
                    </Text>
                    <Text
                        style={[
                            styles.webAppSubtitle,
                            { color: webAppTheme.muted },
                        ]}
                    >
                        Biografi ulama, ilmuwan, dan tokoh Islam
                    </Text>
                </View>
                <View style={styles.webAppControls}>
                    {renderSearch()}
                    {renderFilters()}
                </View>
                {renderContent()}
                {renderDetailModal()}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderSearch()}
            {renderFilters()}
            {renderContent()}
            {renderDetailModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchInput: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.ink,
        fontSize: 14,
        marginBottom: spacing.sm,
        minHeight: 44,
        paddingHorizontal: spacing.md,
    },
    filterRow: {
        marginBottom: spacing.sm,
    },
    filterContent: {
        gap: 6,
        paddingVertical: 2,
    },
    chip: {
        borderColor: colors.border,
        borderRadius: radius.full || 20,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "600",
    },
    chipTextActive: {
        color: "#ffffff",
    },
    loadingContainer: {
        alignItems: "center",
        height: 240,
        justifyContent: "center",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xl,
    },
    empty: {
        color: colors.muted,
        fontSize: 14,
        textAlign: "center",
    },
    resultCount: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "600",
        marginBottom: spacing.xs,
        marginTop: spacing.xs,
    },
    card: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    cardAvatar: {
        alignItems: "center",
        borderRadius: 22,
        height: 44,
        justifyContent: "center",
        marginRight: spacing.md,
        overflow: "hidden",
        width: 44,
    },
    avatarImage: {
        height: "100%",
        width: "100%",
    },
    avatarFallbackWrap: {
        alignItems: "center",
        height: "100%",
        justifyContent: "center",
        width: "100%",
    },
    avatarFallback: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    cardBody: {
        flex: 1,
        justifyContent: "center",
    },
    cardName: {
        color: colors.ink,
        fontSize: 15,
        fontWeight: "700",
        lineHeight: 20,
    },
    cardMetaRow: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
    },
    cardEraBadge: {
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    cardEra: {
        fontSize: 11,
        fontWeight: "600",
    },
    cardTahun: {
        color: colors.muted,
        fontSize: 12,
    },
    modalBodyWrap: {
        gap: spacing.sm,
    },
    modalAvatarWrap: {
        alignItems: "center",
        marginVertical: spacing.xs,
    },
    modalAvatar: {
        borderRadius: 40,
        height: 80,
        width: 80,
    },
    modalAvatarFallback: {
        alignItems: "center",
        borderRadius: 40,
        height: 80,
        justifyContent: "center",
        width: 80,
    },
    modalAvatarFallbackText: {
        fontSize: 32,
        fontWeight: "700",
    },
    modalBadgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
        marginVertical: spacing.xs,
    },
    modalBadge: {
        borderRadius: radius.full || 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    modalBadgeKategori: {
        opacity: 0.8,
    },
    modalBadgeText: {
        fontSize: 11,
        fontWeight: "600",
    },
    modalSection: {
        marginTop: spacing.sm,
    },
    modalSectionHighlight: {
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.md,
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: spacing.xs,
    },
    modalBody: {
        fontSize: 14,
        lineHeight: 22,
    },
    webAppRoot: {
        backgroundColor: "#f8fafc",
        flex: 1,
        gap: spacing.md,
    },
    webAppHeader: {
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    webAppIcon: {
        alignItems: "center",
        backgroundColor: "#e0e7ff",
        borderRadius: 16,
        height: 56,
        justifyContent: "center",
        marginBottom: spacing.sm,
        width: 56,
    },
    webAppIconText: {
        color: "#4f46e5",
        fontSize: 26,
        fontWeight: "900",
    },
    webAppTitle: {
        color: "#111827",
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 0,
        textAlign: "center",
    },
    webAppSubtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 19,
        marginTop: 4,
        textAlign: "center",
    },
    webAppControls: {
        gap: spacing.xs,
    },
    webAppSearchInput: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        color: "#111827",
    },
    webAppChip: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
    },
    webAppChipActive: {
        backgroundColor: "#4f46e5",
        borderColor: "#4f46e5",
    },
    webAppLoadingContainer: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 16,
        borderWidth: 1,
        gap: spacing.sm,
    },
    webAppLoadingText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "700",
    },
    webAppEmpty: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 16,
        borderWidth: 1,
    },
    webAppEmptyText: {
        color: "#94a3b8",
    },
    webAppResultCount: {
        color: "#64748b",
        fontWeight: "800",
        marginBottom: spacing.sm,
    },
    webAppCardGrid: {
        gap: spacing.sm,
    },
    webAppCard: {
        alignItems: "flex-start",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: "row",
        padding: spacing.md,
    },
    webAppCardAvatar: {
        borderRadius: 12,
        height: 48,
        marginRight: spacing.md,
        overflow: "hidden",
        width: 48,
    },
    webAppAvatarFallback: {
        backgroundColor: "#e0e7ff",
        borderRadius: 12,
        color: "#4f46e5",
        fontSize: 20,
        lineHeight: 48,
    },
    webAppCardName: {
        color: "#111827",
    },
    webAppCardEra: {
        backgroundColor: "#e0e7ff",
        color: "#4f46e5",
    },
    webAppCardTahun: {
        color: "#94a3b8",
    },
});

export default TokohTarikhContent;
