import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { MapPin, Navigation, Phone } from "lucide-react-native";
import * as Location from "expo-location";
import { AppModalSheet } from "../components/AppModalSheet";
import {
    ActionPill,
    CompactRow,
    EmptyState,
    ErrorState,
    PaperSearchInput,
} from "../components/Paper";
import { colors, spacing } from "../theme";
import { getMasjids, getNearbyMasjids } from "../api/client";

const formatDistance = (value) => {
    if (typeof value !== "number") return null;
    return `${value.toFixed(value < 10 ? 1 : 0)} km`;
};

export function MasjidDirectoryContent() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [nearMe, setNearMe] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState("");
    const [selected, setSelected] = useState(null);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const params = { page: "1", size: "50" };
            if (search) params.q = search;
            const list = await getMasjids(params);
            setItems(list);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [search]);

    const loadNearby = useCallback(async () => {
        setLocating(true);
        setLoading(true);
        setError(false);
        setLocationMessage("");
        try {
            const permission =
                await Location.requestForegroundPermissionsAsync();
            if (permission.status !== "granted") {
                setLocationMessage(
                    "Izin lokasi ditolak. Menampilkan daftar biasa.",
                );
                setNearMe(false);
                await loadList();
                return;
            }
            const position = await Location.getCurrentPositionAsync({});
            const list = await getNearbyMasjids({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                radius: 25,
                limit: 50,
            });
            setItems(list);
        } catch {
            setLocationMessage(
                "Lokasi belum bisa diakses. Menampilkan daftar biasa.",
            );
            setNearMe(false);
            await loadList();
        } finally {
            setLocating(false);
            setLoading(false);
        }
    }, [loadList]);

    useEffect(() => {
        if (nearMe) {
            loadNearby();
        } else {
            loadList();
        }
        // Re-run only when the search text or the near-me toggle changes —
        // loadList/loadNearby are recreated each render but that shouldn't
        // trigger a refetch on its own.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, nearMe]);

    const toggleNearMe = () => setNearMe((v) => !v);

    const openMaps = (masjid) => {
        if (masjid?.latitude == null || masjid?.longitude == null) return;
        Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${masjid.latitude},${masjid.longitude}`,
        );
    };

    const facilitiesList = (facilities) =>
        String(facilities || "")
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);

    return (
        <View style={styles.container}>
            <PaperSearchInput
                onChangeText={setSearch}
                placeholder='Cari nama, kota, atau kecamatan...'
                value={search}
            />
            <View style={styles.pillRow}>
                <ActionPill
                    Icon={Navigation}
                    active={nearMe}
                    disabled={locating}
                    label={locating ? "Mencari lokasi..." : "Masjid Terdekat"}
                    onPress={toggleNearMe}
                />
            </View>
            {locationMessage ? (
                <Text style={styles.notice}>{locationMessage}</Text>
            ) : null}

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator color={colors.primary} size='large' />
                </View>
            ) : error ? (
                <ErrorState
                    action={
                        <ActionPill
                            label='Coba Lagi'
                            onPress={nearMe ? loadNearby : loadList}
                        />
                    }
                />
            ) : items.length === 0 ? (
                <EmptyState
                    Icon={MapPin}
                    title='Masjid tidak ditemukan'
                    description='Coba kata kunci lain atau matikan filter terdekat.'
                />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {items.map((masjid) => (
                        <CompactRow
                            Icon={MapPin}
                            key={masjid.id ?? masjid.name}
                            meta={formatDistance(masjid.distance_km)}
                            onPress={() => setSelected(masjid)}
                            subtitle={`${masjid.district ? `${masjid.district} · ` : ""}${masjid.city ?? ""}`}
                            title={masjid.name}
                        />
                    ))}
                    <View style={styles.listBottomPad} />
                </ScrollView>
            )}

            <AppModalSheet
                onClose={() => setSelected(null)}
                subtitle={
                    selected
                        ? `${selected.district ? `${selected.district} · ` : ""}${selected.city ?? ""}`
                        : ""
                }
                title={selected?.name ?? ""}
                visible={Boolean(selected)}
            >
                {selected ? (
                    <View style={styles.detail}>
                        {selected.description ? (
                            <Text style={styles.detailBody}>
                                {selected.description}
                            </Text>
                        ) : null}
                        <View style={styles.detailRow}>
                            <MapPin
                                color={colors.primary}
                                size={16}
                                strokeWidth={2.2}
                            />
                            <Text style={styles.detailText}>
                                {selected.address}
                            </Text>
                        </View>
                        {selected.phone ? (
                            <View style={styles.detailRow}>
                                <Phone
                                    color={colors.primary}
                                    size={16}
                                    strokeWidth={2.2}
                                />
                                <Text style={styles.detailText}>
                                    {selected.phone}
                                </Text>
                            </View>
                        ) : null}
                        {selected.capacity > 0 ? (
                            <Text style={styles.detailMeta}>
                                Kapasitas ±
                                {selected.capacity.toLocaleString("id-ID")}{" "}
                                jamaah
                            </Text>
                        ) : null}
                        {facilitiesList(selected.facilities).length ? (
                            <View style={styles.badgeRow}>
                                {facilitiesList(selected.facilities).map(
                                    (facility) => (
                                        <View
                                            key={facility}
                                            style={styles.badge}
                                        >
                                            <Text style={styles.badgeText}>
                                                {facility}
                                            </Text>
                                        </View>
                                    ),
                                )}
                            </View>
                        ) : null}
                        <View style={styles.actionRow}>
                            <ActionPill
                                Icon={Navigation}
                                label='Buka Maps'
                                onPress={() => openMaps(selected)}
                            />
                        </View>
                    </View>
                ) : null}
            </AppModalSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxl,
    },
    pillRow: {
        flexDirection: "row",
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    notice: {
        color: colors.muted,
        fontSize: 12,
        marginBottom: spacing.sm,
    },
    listBottomPad: {
        height: spacing.xl,
    },
    detail: {
        gap: spacing.sm,
    },
    detailBody: {
        color: colors.muted,
        fontSize: 14,
        lineHeight: 21,
    },
    detailRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
    detailText: {
        color: colors.ink,
        flex: 1,
        fontSize: 14,
    },
    detailMeta: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: "600",
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    badge: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        color: colors.ink,
        fontSize: 11,
        fontWeight: "600",
    },
    actionRow: {
        flexDirection: "row",
        marginTop: spacing.sm,
    },
});

export default MasjidDirectoryContent;
