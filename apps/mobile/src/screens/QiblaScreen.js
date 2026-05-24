import * as Location from "expo-location";
import {
    ArrowLeft,
    Compass,
    MapPin,
    MapPinOff,
    RefreshCw,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { Card, CardTitle } from "../components/Card";
import { ActionPill, EmptyState, IconActionButton } from "../components/Paper";
import { Screen } from "../components/Screen";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { colors, radius, spacing } from "../theme";
import {
    compassSupported,
    qiblaOffset,
    signedOffset,
    watchCompassHeading,
} from "../utils/compass";
import {
    calculateKaabaDistance,
    calculateQiblaDirection,
    formatDegrees,
} from "../utils/qibla";

const compassTicks = Array.from({ length: 72 }, (_, index) => index * 5);
const compassLabels = Array.from({ length: 12 }, (_, index) => index * 30);
const rotationLimit = 1440;
const ALIGNMENT_THRESHOLD = 8;

// Normalize to [0, 360)
const norm = (v) => ((v % 360) + 360) % 360;

// Shortest-path delta between two normalized angles
const shortestDelta = (from, to) => {
    const raw = norm(to - from);
    return raw > 180 ? raw - 360 : raw;
};

function KaabaIcon({ aligned = false }) {
    return (
        <View
            style={[styles.kaabaIcon, aligned ? styles.kaabaIconAligned : null]}
        >
            <View style={styles.kaabaBand} />
            <View style={styles.kaabaDoor} />
        </View>
    );
}

function StatusChip({ Icon, label, tone = "neutral" }) {
    return (
        <View
            style={[
                styles.statusChip,
                tone === "alert" ? styles.statusChipAlert : null,
            ]}
        >
            {Icon ? (
                <Icon
                    color={tone === "alert" ? colors.danger : colors.primary}
                    size={14}
                    strokeWidth={2.2}
                />
            ) : null}
            <Text
                style={[
                    styles.statusChipText,
                    tone === "alert" ? styles.statusChipTextAlert : null,
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );
}

export function QiblaScreen({ onBack, onOpenTab }) {
    const { isWebAppLayout } = useLayoutModePreference();
    const { width } = useWindowDimensions();
    const [coords, setCoords] = useState(null);
    const [direction, setDirection] = useState(null);
    const [distance, setDistance] = useState(null);
    const [locationAccuracy, setLocationAccuracy] = useState(null);
    const [heading, setHeading] = useState(null);
    const [compassMessage, setCompassMessage] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [locationMode, setLocationMode] = useState("gps");
    const [manualLatInput, setManualLatInput] = useState("");
    const [manualLngInput, setManualLngInput] = useState("");

    // Ring rotates opposite to heading so N always points to geographic North
    const ringRotation = useRef(new Animated.Value(0)).current;
    const ringDegrees = useRef(0);
    // Ka'bah marker follows the absolute qibla bearing inside the rotating compass ring.
    const pointerRotation = useRef(new Animated.Value(0)).current;
    const pointerDegrees = useRef(0);
    const headingDegrees = useRef(null);

    const offset = qiblaOffset(direction, heading);
    const signed = signedOffset(offset);
    const aligned =
        typeof signed === "number" && Math.abs(signed) <= ALIGNMENT_THRESHOLD;
    const hasDirection = typeof direction === "number";
    const hasCompass = compassSupported();
    const correctionDegrees =
        typeof signed === "number" ? Math.round(Math.abs(signed)) : null;

    const ringRotate = ringRotation.interpolate({
        inputRange: [-rotationLimit, rotationLimit],
        outputRange: [`-${rotationLimit}deg`, `${rotationLimit}deg`],
    });
    const ringCounterRotate = ringRotation.interpolate({
        inputRange: [-rotationLimit, rotationLimit],
        outputRange: [`${rotationLimit}deg`, `-${rotationLimit}deg`],
    });
    const pointerRotate = pointerRotation.interpolate({
        inputRange: [-rotationLimit, rotationLimit],
        outputRange: [`-${rotationLimit}deg`, `${rotationLimit}deg`],
    });
    const pointerCounterRotate = pointerRotation.interpolate({
        inputRange: [-rotationLimit, rotationLimit],
        outputRange: [`${rotationLimit}deg`, `-${rotationLimit}deg`],
    });

    const guidanceText =
        heading === null
            ? hasCompass
                ? "Gerakkan HP membentuk angka 8 untuk mengaktifkan kompas."
                : "Kompas perangkat tidak tersedia. Arah memakai bearing utara sebenarnya."
            : aligned
              ? "Marker Ka'bah sudah sejajar dengan panah HP."
              : `Putar HP ${correctionDegrees} deg ke ${signed > 0 ? "kanan" : "kiri"} sampai marker Ka'bah sejajar dengan panah.`;

    const compassSize = Math.min(Math.max(width - 88, 276), 336);
    const markerSize = Math.round(compassSize * 0.15);
    const pointerHeadSize = Math.round(compassSize * 0.12);
    const pointerShaftHeight = Math.round(compassSize * 0.32);

    const locationLabel = coords
        ? locationMode === "manual"
            ? "Lokasi manual"
            : "Lokasi aktif"
        : "Lokasi belum aktif";
    const accuracyLabel =
        locationAccuracy === null || locationMode === "manual"
            ? "Akurasi tidak diketahui"
            : `Akurasi ${Math.round(locationAccuracy)} m`;
    const compassLabel =
        heading === null ? "Kalibrasi kompas" : `HP ${formatDegrees(heading)}`;

    const smoothHeading = useCallback((nextHeading) => {
        const previous = headingDegrees.current;
        if (typeof previous !== "number") {
            headingDegrees.current = nextHeading;
            return nextHeading;
        }

        const delta = shortestDelta(previous, nextHeading);
        const factor = Math.abs(delta) > 45 ? 0.72 : 0.34;
        const smoothed = norm(previous + delta * factor);
        headingDegrees.current = smoothed;
        return smoothed;
    }, []);

    const applyManualLocation = useCallback(() => {
        const lat = parseFloat(manualLatInput.replace(",", "."));
        const lng = parseFloat(manualLngInput.replace(",", "."));
        if (
            !isFinite(lat) ||
            !isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            setMessage(
                "Masukkan koordinat yang valid. Contoh: -6.2088, 106.8456",
            );
            return;
        }
        setMessage("");
        setCoords({ lat, lng });
        setLocationAccuracy(null);
        setDirection(calculateQiblaDirection(lat, lng));
        setDistance(calculateKaabaDistance(lat, lng));
        setLocationMode("manual");
        setMessage("Lokasi manual dipakai untuk menghitung arah kiblat.");
    }, [manualLatInput, manualLngInput]);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage("");
        try {
            const permission =
                await Location.requestForegroundPermissionsAsync();
            if (permission.status !== "granted") {
                setCoords(null);
                setDirection(null);
                setDistance(null);
                setLocationAccuracy(null);
                setMessage(
                    "Aktifkan lokasi untuk menghitung arah kiblat dari posisimu.",
                );
                return;
            }
            const position = await Location.getCurrentPositionAsync({});
            const current = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setCoords(current);
            setLocationAccuracy(position.coords.accuracy ?? null);
            setLocationMode("gps");
            setDirection(calculateQiblaDirection(current.lat, current.lng));
            setDistance(calculateKaabaDistance(current.lat, current.lng));
        } catch {
            setCoords(null);
            setDirection(null);
            setDistance(null);
            setLocationAccuracy(null);
            setMessage(
                "Lokasi belum terbaca. Aktifkan GPS lalu muat ulang arah kiblat.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        let mounted = true;
        let subscription;
        watchCompassHeading(
            (nextHeading) => {
                if (!mounted) return;
                setHeading(smoothHeading(nextHeading));
                setCompassMessage("");
            },
            (nextMessage) => {
                if (mounted) setCompassMessage(nextMessage);
            },
        ).then((nextSubscription) => {
            subscription = nextSubscription;
        });
        return () => {
            mounted = false;
            subscription?.remove?.();
        };
    }, [smoothHeading]);

    // Ring rotates by -heading: when device points East (heading=90), ring rotates -90deg so N stays at North
    useEffect(() => {
        const targetVisual = heading === null ? 0 : norm(-heading);
        const delta = shortestDelta(norm(ringDegrees.current), targetVisual);
        const next = ringDegrees.current + delta;
        ringDegrees.current = next;
        Animated.timing(ringRotation, {
            toValue: next,
            duration: heading === null ? 520 : 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [heading, ringRotation]);

    // The marker is part of the compass ring, so the ring rotation turns it into a relative bearing.
    useEffect(() => {
        if (!hasDirection) return;
        const targetVisual = norm(direction);
        const delta = shortestDelta(norm(pointerDegrees.current), targetVisual);
        const next = pointerDegrees.current + delta;
        pointerDegrees.current = next;
        Animated.timing(pointerRotation, {
            toValue: next,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [direction, hasDirection, pointerRotation]);

    return (
        <Screen
            contentStyle={isWebAppLayout ? styles.webAppSurface : null}
            title='Qibla'
            subtitle='Arahkan perangkatmu untuk menemukan arah kiblat.'
            refreshing={loading}
            onRefresh={load}
            actions={
                <>
                    {onBack || onOpenTab ? (
                        <IconActionButton
                            Icon={ArrowLeft}
                            label={
                                onBack
                                    ? "Kembali ke Ibadah"
                                    : "Kembali ke Beranda"
                            }
                            onPress={onBack ?? (() => onOpenTab("home"))}
                        />
                    ) : null}
                    <IconActionButton
                        Icon={RefreshCw}
                        label='Muat ulang arah kiblat'
                        onPress={load}
                        disabled={loading}
                    />
                </>
            }
        >
            <View testID={isWebAppLayout ? 'qibla-web-app-surface' : 'qibla-classic-surface'} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {compassMessage ? (
                <Text style={styles.message}>{compassMessage}</Text>
            ) : null}

            {!coords && !loading ? (
                <Card>
                    <CardTitle meta='Koordinat GPS'>Lokasi Manual</CardTitle>
                    <Text style={styles.muted}>
                        Aktifkan GPS atau masukkan koordinat untuk menghitung
                        arah kiblat.
                    </Text>
                    <View style={styles.manualLocRow}>
                        <TextInput
                            keyboardType='decimal-pad'
                            onChangeText={setManualLatInput}
                            placeholder='-6.2088 (Lintang)'
                            placeholderTextColor={colors.muted}
                            returnKeyType='next'
                            style={styles.manualLocInput}
                            value={manualLatInput}
                        />
                        <TextInput
                            keyboardType='decimal-pad'
                            onChangeText={setManualLngInput}
                            placeholder='106.8456 (Bujur)'
                            placeholderTextColor={colors.muted}
                            returnKeyType='done'
                            style={styles.manualLocInput}
                            value={manualLngInput}
                        />
                    </View>
                    <Pressable
                        disabled={!manualLatInput || !manualLngInput}
                        onPress={applyManualLocation}
                        style={[
                            styles.button,
                            !manualLatInput || !manualLngInput
                                ? styles.disabled
                                : null,
                        ]}
                    >
                        <Text style={styles.buttonText}>
                            Hitung Arah Kiblat
                        </Text>
                    </Pressable>
                </Card>
            ) : null}

            <Card style={styles.compassCard}>
                <CardTitle
                    meta={
                        heading === null ? "Bearing dari utara" : "Kompas aktif"
                    }
                >
                    Arah Kiblat
                </CardTitle>
                {loading ? (
                    <ActivityIndicator color={colors.primary} />
                ) : !hasDirection ? (
                    <EmptyState
                        Icon={MapPinOff}
                        title='Arah kiblat belum tersedia'
                        description='Izinkan akses lokasi, coba muat ulang, atau masukkan koordinat manual.'
                        action={
                            <View style={styles.emptyActions}>
                                <ActionPill
                                    Icon={RefreshCw}
                                    label='Coba lagi'
                                    onPress={load}
                                    disabled={loading}
                                />
                                <ActionPill
                                    Icon={MapPin}
                                    label='Lokasi manual'
                                    onPress={() =>
                                        setMessage(
                                            "Masukkan koordinat di kartu Lokasi Manual.",
                                        )
                                    }
                                />
                            </View>
                        }
                    />
                ) : (
                    <>
                        <View style={styles.statusRow}>
                            <StatusChip Icon={MapPin} label={locationLabel} />
                            <StatusChip
                                label={accuracyLabel}
                                tone={
                                    locationAccuracy === null
                                        ? "alert"
                                        : "neutral"
                                }
                            />
                            <StatusChip Icon={Compass} label={compassLabel} />
                        </View>

                        <View
                            style={[
                                styles.compass,
                                {
                                    borderRadius: compassSize / 2,
                                    height: compassSize,
                                    width: compassSize,
                                },
                            ]}
                        >
                            {/* Compass ring — rotates opposite to heading so N/E/S/W stay geographically correct */}
                            <Animated.View
                                style={[
                                    styles.ringLayer,
                                    { transform: [{ rotate: ringRotate }] },
                                ]}
                            >
                                {compassTicks.map((angle) => (
                                    <View
                                        key={angle}
                                        style={[
                                            styles.tickLayer,
                                            {
                                                transform: [
                                                    { rotate: `${angle}deg` },
                                                ],
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.tick,
                                                angle % 30 === 0
                                                    ? styles.tickMedium
                                                    : null,
                                                angle % 90 === 0
                                                    ? styles.tickMajor
                                                    : null,
                                            ]}
                                        />
                                    </View>
                                ))}
                                {compassLabels.map((angle) => (
                                    <View
                                        key={`label-${angle}`}
                                        style={[
                                            styles.degreeLayer,
                                            {
                                                transform: [
                                                    { rotate: `${angle}deg` },
                                                ],
                                            },
                                        ]}
                                    >
                                        <Animated.Text
                                            style={[
                                                styles.degreeMark,
                                                {
                                                    transform: [
                                                        {
                                                            rotate: `${-angle}deg`,
                                                        },
                                                        {
                                                            rotate: ringCounterRotate,
                                                        },
                                                    ],
                                                },
                                            ]}
                                        >
                                            {angle}
                                        </Animated.Text>
                                    </View>
                                ))}
                                <Animated.Text
                                    style={[
                                        styles.cardinal,
                                        styles.north,
                                        {
                                            transform: [
                                                { rotate: ringCounterRotate },
                                            ],
                                        },
                                    ]}
                                >
                                    N
                                </Animated.Text>
                                <Animated.Text
                                    style={[
                                        styles.cardinal,
                                        styles.east,
                                        {
                                            transform: [
                                                { rotate: ringCounterRotate },
                                            ],
                                        },
                                    ]}
                                >
                                    E
                                </Animated.Text>
                                <Animated.Text
                                    style={[
                                        styles.cardinal,
                                        styles.south,
                                        {
                                            transform: [
                                                { rotate: ringCounterRotate },
                                            ],
                                        },
                                    ]}
                                >
                                    S
                                </Animated.Text>
                                <Animated.Text
                                    style={[
                                        styles.cardinal,
                                        styles.west,
                                        {
                                            transform: [
                                                { rotate: ringCounterRotate },
                                            ],
                                        },
                                    ]}
                                >
                                    W
                                </Animated.Text>

                                {/* Ka'bah marker belongs to the compass ring, not the guide line. */}
                                <Animated.View
                                    pointerEvents='none'
                                    style={[
                                        styles.qiblaMarkerLayer,
                                        {
                                            transform: [
                                                { rotate: pointerRotate },
                                            ],
                                        },
                                    ]}
                                >
                                    <Animated.View
                                        style={[
                                            styles.kaabaMarker,
                                            aligned
                                                ? styles.kaabaMarkerAligned
                                                : null,
                                            {
                                                borderRadius: markerSize / 2,
                                                height: markerSize,
                                                top: compassSize * 0.045,
                                                transform: [
                                                    {
                                                        rotate: pointerCounterRotate,
                                                    },
                                                    {
                                                        rotate: ringCounterRotate,
                                                    },
                                                ],
                                                width: markerSize,
                                            },
                                        ]}
                                    >
                                        <KaabaIcon aligned={aligned} />
                                    </Animated.View>
                                </Animated.View>
                            </Animated.View>

                            {/* Fixed guide line: align the ring marker with the phone's top edge. */}
                            <View
                                pointerEvents='none'
                                style={styles.pointerLayer}
                            >
                                <View
                                    style={[
                                        styles.pointerVector,
                                        { top: compassSize * 0.24 },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.pointerHead,
                                            aligned
                                                ? styles.pointerHeadAligned
                                                : null,
                                            {
                                                borderBottomWidth:
                                                    pointerHeadSize,
                                                borderLeftWidth:
                                                    pointerHeadSize / 2,
                                                borderRightWidth:
                                                    pointerHeadSize / 2,
                                            },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.pointerShaft,
                                            aligned
                                                ? styles.pointerShaftAligned
                                                : null,
                                            { height: pointerShaftHeight },
                                        ]}
                                    />
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.centerHub,
                                    aligned ? styles.centerHubAligned : null,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.centerHubText,
                                        aligned
                                            ? styles.centerHubTextAligned
                                            : null,
                                    ]}
                                >
                                    HP
                                </Text>
                            </View>
                        </View>

                        <View style={styles.directionSummary}>
                            <Text style={styles.degrees}>
                                {formatDegrees(direction ?? 0)}
                            </Text>
                            <Text style={styles.directionLabel}>
                                {aligned ? "sejajar kiblat" : "bearing kiblat"}
                            </Text>
                        </View>
                        <Text style={styles.muted}>{guidanceText}</Text>
                    </>
                )}
            </Card>

            <View style={styles.metrics}>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Jarak</Text>
                    <Text style={styles.metricValue}>
                        {distance?.toLocaleString("en-US") ?? "-"}
                    </Text>
                    <Text style={styles.metricLabel}>km</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Qibla</Text>
                    <Text style={styles.metricValueSmall}>
                        {hasDirection ? formatDegrees(direction) : "-"}
                    </Text>
                    <Text style={styles.metricLabel}>utara sebenarnya</Text>
                </View>
            </View>

            <View style={styles.metrics}>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Kompas</Text>
                    <Text style={styles.metricValueSmall}>
                        {heading === null
                            ? hasCompass
                                ? "Kalibrasi"
                                : "Tidak tersedia"
                            : formatDegrees(heading)}
                    </Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Lokasi</Text>
                    <Text style={styles.metricValueSmall}>
                        {coords
                            ? `${locationMode === "manual" ? "Manual " : ""}${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`
                            : "-"}
                    </Text>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    webAppSurface: {
        backgroundColor: "#f8fafc",
        borderRadius: radius.md,
        padding: spacing.sm,
    },
    message: {
        backgroundColor: "#fffbeb",
        borderColor: "#fde68a",
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.accent,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    compassCard: {
        alignItems: "stretch",
    },
    emptyActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        justifyContent: "center",
    },
    statusRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    statusChip: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        minHeight: 30,
        maxWidth: 178,
        paddingHorizontal: spacing.sm,
    },
    statusChipAlert: {
        borderColor: "#f2cf8f",
    },
    statusChipText: {
        color: colors.primary,
        flexShrink: 1,
        fontSize: 11,
        fontWeight: "900",
    },
    statusChipTextAlert: {
        color: colors.accent,
    },
    compass: {
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: 112,
        borderWidth: 2,
        height: 224,
        justifyContent: "center",
        marginVertical: spacing.lg,
        width: 224,
    },
    ringLayer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    tickLayer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
    },
    tick: {
        backgroundColor: colors.faint,
        borderRadius: 2,
        height: 6,
        marginTop: spacing.xs,
        width: 2,
    },
    tickMedium: {
        backgroundColor: "#d5d0c4",
        height: 10,
    },
    tickMajor: {
        backgroundColor: colors.primary,
        height: 15,
        width: 3,
    },
    degreeLayer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
    },
    degreeMark: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: "700",
        marginTop: 22,
    },
    cardinal: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: "900",
        position: "absolute",
    },
    north: {
        top: 44,
    },
    east: {
        right: 42,
    },
    south: {
        bottom: 44,
    },
    west: {
        left: 42,
    },
    pointerLayer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    qiblaMarkerLayer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
    },
    pointerVector: {
        alignItems: "center",
        position: "absolute",
        top: 17,
    },
    kaabaMarker: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: 8,
        borderWidth: 1,
        height: 34,
        justifyContent: "center",
        marginBottom: -2,
        position: "absolute",
        width: 34,
    },
    kaabaMarkerAligned: {
        borderColor: colors.accent,
    },
    kaabaIcon: {
        backgroundColor: "#26241f",
        borderColor: "#17150f",
        borderRadius: 3,
        borderWidth: 1,
        height: 20,
        overflow: "hidden",
        width: 22,
    },
    kaabaIconAligned: {
        borderColor: colors.accent,
    },
    kaabaBand: {
        backgroundColor: "#d0a85a",
        height: 4,
        marginTop: 5,
        width: "100%",
    },
    kaabaDoor: {
        alignSelf: "center",
        backgroundColor: "#d0a85a",
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        bottom: 0,
        height: 7,
        position: "absolute",
        width: 5,
    },
    pointerHead: {
        borderBottomColor: colors.primary,
        borderBottomWidth: 34,
        borderLeftColor: "transparent",
        borderLeftWidth: 16,
        borderRightColor: "transparent",
        borderRightWidth: 16,
        height: 0,
        width: 0,
    },
    pointerHeadAligned: {
        borderBottomColor: colors.accent,
    },
    pointerShaft: {
        backgroundColor: colors.primary,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        height: 82,
        marginTop: -1,
        width: 12,
    },
    pointerShaftAligned: {
        backgroundColor: colors.accent,
    },
    centerHub: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.primary,
        borderRadius: 24,
        borderWidth: 2,
        height: 54,
        justifyContent: "center",
        width: 54,
    },
    centerHubAligned: {
        borderColor: colors.accent,
    },
    centerHubText: {
        color: colors.primary,
        fontFamily: "serif",
        fontSize: 10,
        fontWeight: "900",
    },
    centerHubTextAligned: {
        color: colors.accent,
    },
    directionSummary: {
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    degrees: {
        color: colors.primary,
        fontSize: 34,
        fontWeight: "900",
        textAlign: "center",
    },
    directionLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "800",
        marginTop: 2,
        textTransform: "uppercase",
    },
    muted: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 18,
        textAlign: "center",
    },
    metrics: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    metric: {
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.lg,
        borderWidth: 1,
        flex: 1,
        padding: spacing.lg,
    },
    metricLabel: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "700",
    },
    metricValue: {
        color: colors.ink,
        fontSize: 24,
        fontWeight: "900",
        marginTop: spacing.xs,
    },
    metricValueSmall: {
        color: colors.ink,
        fontSize: 14,
        fontWeight: "800",
        marginTop: spacing.sm,
    },
    manualLocRow: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    manualLocInput: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.ink,
        flex: 1,
        fontSize: 13,
        fontWeight: "700",
        minHeight: 44,
        paddingHorizontal: spacing.md,
    },
    button: {
        alignItems: "center",
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        minHeight: 48,
        justifyContent: "center",
        marginTop: spacing.sm,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },
    disabled: {
        opacity: 0.55,
    },
});
