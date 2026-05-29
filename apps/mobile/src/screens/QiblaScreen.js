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
const WEB_APP_QIBLA_THEMES = {
    light: {
        accent: "#047857",
        bg: "#f8fafc",
        border: "#e5e7eb",
        compassBorder: "#a7f3d0",
        iconBg: "#d1fae5",
        inputBg: "#f8fafc",
        inputBorder: "#d1d5db",
        messageBg: "#fff7ed",
        messageBorder: "#fed7aa",
        messageText: "#c2410c",
        muted: "#64748b",
        note: "#94a3b8",
        surface: "#ffffff",
        text: "#334155",
        title: "#064e3b",
    },
    dark: {
        accent: "#34d399",
        bg: "#020617",
        border: "#334155",
        compassBorder: "#047857",
        iconBg: "#064e3b",
        inputBg: "#0f172a",
        inputBorder: "#334155",
        messageBg: "#431407",
        messageBorder: "#9a3412",
        messageText: "#fdba74",
        muted: "#94a3b8",
        note: "#64748b",
        surface: "#111827",
        text: "#cbd5e1",
        title: "#f8fafc",
    },
};

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
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const webAppTheme = isDarkTheme ? WEB_APP_QIBLA_THEMES.dark : WEB_APP_QIBLA_THEMES.light;
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
    const screenTitle = isWebAppLayout ? "Kiblat" : "Qibla";
    const screenSubtitle = isWebAppLayout
        ? "Temukan arah Ka'bah dari lokasi kamu."
        : "Arahkan perangkatmu untuk menemukan arah kiblat.";
    const screenActions = isWebAppLayout ? (
        <IconActionButton
            Icon={RefreshCw}
            label='Muat ulang arah kiblat'
            onPress={load}
            disabled={loading}
        />
    ) : (
        <>
            {onBack || onOpenTab ? (
                <IconActionButton
                    Icon={ArrowLeft}
                    label={onBack ? "Kembali ke Ibadah" : "Kembali ke Beranda"}
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
    );

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
            contentStyle={isWebAppLayout ? [styles.webAppSurface, { backgroundColor: webAppTheme.bg }] : null}
            title={screenTitle}
            subtitle={screenSubtitle}
            refreshing={loading}
            onRefresh={load}
            actions={screenActions}
        >
            <View
                style={isWebAppLayout ? { backgroundColor: webAppTheme.bg } : null}
                testID={isWebAppLayout ? 'qibla-web-app-surface' : 'qibla-classic-surface'}
            />
            {isWebAppLayout ? (
                <View style={styles.webAppHeader}>
                    <View style={[styles.webAppIconBox, { backgroundColor: webAppTheme.iconBg }]}>
                        <KaabaIcon aligned={aligned} />
                    </View>
                    <Text style={[styles.webAppTitle, { color: webAppTheme.title }]}>Arah Kiblat</Text>
                    <Text style={[styles.webAppSubtitle, { color: webAppTheme.muted }]}>Temukan arah Ka'bah dari lokasi kamu</Text>
                </View>
            ) : null}
            {message ? <Text style={[
                styles.message,
                isWebAppLayout ? styles.webAppMessage : null,
                isWebAppLayout ? {
                    backgroundColor: webAppTheme.messageBg,
                    borderColor: webAppTheme.messageBorder,
                    color: webAppTheme.messageText,
                } : null,
            ]}>{message}</Text> : null}
            {compassMessage ? (
                <Text style={[
                    styles.message,
                    isWebAppLayout ? styles.webAppMessage : null,
                    isWebAppLayout ? {
                        backgroundColor: webAppTheme.messageBg,
                        borderColor: webAppTheme.messageBorder,
                        color: webAppTheme.messageText,
                    } : null,
                ]}>{compassMessage}</Text>
            ) : null}

            {!coords && !loading ? (
                <Card
                    style={isWebAppLayout ? [
                        styles.webAppPanel,
                        { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
                    ] : null}
                >
                    <CardTitle
                        meta='Koordinat GPS'
                        metaStyle={isWebAppLayout ? [styles.webAppCardMeta, { color: webAppTheme.accent }] : null}
                        titleStyle={isWebAppLayout ? [styles.webAppCardTitle, { color: webAppTheme.title }] : null}
                    >
                        Lokasi Manual
                    </CardTitle>
                    <Text style={[styles.muted, isWebAppLayout ? styles.webAppMuted : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>
                        Aktifkan GPS atau masukkan koordinat untuk menghitung
                        arah kiblat.
                    </Text>
                    <View style={styles.manualLocRow}>
                        <TextInput
                            keyboardType='decimal-pad'
                            onChangeText={setManualLatInput}
                            placeholder='-6.2088 (Lintang)'
                            placeholderTextColor={isWebAppLayout ? webAppTheme.muted : colors.muted}
                            returnKeyType='next'
                            style={[styles.manualLocInput, isWebAppLayout ? styles.webAppManualInput : null, isWebAppLayout ? { backgroundColor: webAppTheme.inputBg, borderColor: webAppTheme.inputBorder, color: webAppTheme.text } : null]}
                            value={manualLatInput}
                        />
                        <TextInput
                            keyboardType='decimal-pad'
                            onChangeText={setManualLngInput}
                            placeholder='106.8456 (Bujur)'
                            placeholderTextColor={isWebAppLayout ? webAppTheme.muted : colors.muted}
                            returnKeyType='done'
                            style={[styles.manualLocInput, isWebAppLayout ? styles.webAppManualInput : null, isWebAppLayout ? { backgroundColor: webAppTheme.inputBg, borderColor: webAppTheme.inputBorder, color: webAppTheme.text } : null]}
                            value={manualLngInput}
                        />
                    </View>
                    <Pressable
                        disabled={!manualLatInput || !manualLngInput}
                        onPress={applyManualLocation}
                        style={[
                            styles.button,
                            isWebAppLayout ? styles.webAppButton : null,
                            isWebAppLayout ? { backgroundColor: webAppTheme.accent } : null,
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

            <Card
                style={[
                    styles.compassCard,
                    isWebAppLayout ? styles.webAppCompassPanel : null,
                    isWebAppLayout ? { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border } : null,
                ]}
            >
                <CardTitle
                    meta={
                        heading === null ? "Bearing utara" : "Kompas aktif"
                    }
                    metaStyle={isWebAppLayout ? [styles.webAppCardMeta, { color: webAppTheme.accent }] : null}
                    titleStyle={isWebAppLayout ? [styles.webAppCardTitle, { color: webAppTheme.title }] : null}
                >
                    Arah Kiblat
                </CardTitle>
                {loading ? (
                    <View style={isWebAppLayout ? styles.webAppLoading : null}>
                        <ActivityIndicator color={isWebAppLayout ? webAppTheme.accent : colors.primary} />
                        {isWebAppLayout ? <Text style={[styles.webAppLoadingText, { color: webAppTheme.muted }]}>Mendeteksi lokasi...</Text> : null}
                    </View>
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
                                isWebAppLayout ? styles.webAppCompass : null,
                                isWebAppLayout ? { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.compassBorder } : null,
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
                            <Text style={[styles.degrees, isWebAppLayout ? styles.webAppDegrees : null, isWebAppLayout ? { color: webAppTheme.accent } : null]}>
                                {formatDegrees(direction ?? 0)}
                            </Text>
                            <Text style={[styles.directionLabel, isWebAppLayout ? styles.webAppDirectionLabel : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>
                                {aligned ? "sejajar kiblat" : "bearing kiblat"}
                            </Text>
                        </View>
                        <Text style={[styles.muted, isWebAppLayout ? styles.webAppMuted : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>{guidanceText}</Text>
                    </>
                )}
            </Card>

            <View style={styles.metrics}>
                <View style={[styles.metric, isWebAppLayout ? styles.webAppMetric : null, isWebAppLayout ? { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border } : null]}>
                    <Text style={[styles.metricLabel, isWebAppLayout ? styles.webAppMetricLabel : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>
                        {isWebAppLayout ? "Jarak ke Ka'bah" : "Jarak"}
                    </Text>
                    <Text style={[styles.metricValue, isWebAppLayout ? styles.webAppMetricValue : null, isWebAppLayout ? { color: webAppTheme.accent } : null]}>
                        {distance?.toLocaleString("en-US") ?? "-"}
                    </Text>
                    <Text style={[styles.metricLabel, isWebAppLayout ? styles.webAppMetricLabel : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>km</Text>
                </View>
                <View style={[styles.metric, isWebAppLayout ? styles.webAppMetric : null, isWebAppLayout ? { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border } : null]}>
                    <Text style={[styles.metricLabel, isWebAppLayout ? styles.webAppMetricLabel : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>
                        {isWebAppLayout ? "Sudut Kiblat" : "Qibla"}
                    </Text>
                    <Text style={[styles.metricValueSmall, isWebAppLayout ? styles.webAppMetricValueSmall : null, isWebAppLayout ? { color: webAppTheme.accent } : null]}>
                        {hasDirection ? formatDegrees(direction) : "-"}
                    </Text>
                    <Text style={[styles.metricLabel, isWebAppLayout ? styles.webAppMetricLabel : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>utara sebenarnya</Text>
                </View>
            </View>

            <View style={styles.metrics}>
                <View style={[styles.metric, isWebAppLayout ? styles.webAppMetric : null, isWebAppLayout ? { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border } : null]}>
                    <Text style={[styles.metricLabel, isWebAppLayout ? styles.webAppMetricLabel : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>Kompas</Text>
                    <Text style={[styles.metricValueSmall, isWebAppLayout ? styles.webAppMetricValueSmall : null, isWebAppLayout ? { color: webAppTheme.accent } : null]}>
                        {heading === null
                            ? hasCompass
                                ? "Kalibrasi"
                                : "Tidak tersedia"
                            : formatDegrees(heading)}
                    </Text>
                </View>
                <View style={[styles.metric, isWebAppLayout ? styles.webAppMetric : null, isWebAppLayout ? { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border } : null]}>
                    <Text style={[styles.metricLabel, isWebAppLayout ? styles.webAppMetricLabel : null, isWebAppLayout ? { color: webAppTheme.muted } : null]}>Lokasi</Text>
                    <Text style={[styles.metricValueSmall, isWebAppLayout ? styles.webAppMetricValueSmall : null, isWebAppLayout ? { color: webAppTheme.accent } : null]}>
                        {coords
                            ? `${locationMode === "manual" ? "Manual " : ""}${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`
                            : "-"}
                    </Text>
                </View>
            </View>

            {isWebAppLayout && coords ? (
                <View style={[styles.webAppLocationCard, { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border }]} testID="qibla-web-app-location-card">
                    <View style={styles.webAppLocationTitleRow}>
                        <MapPin color={webAppTheme.accent} size={16} strokeWidth={2.2} />
                        <Text style={[styles.webAppLocationTitle, { color: webAppTheme.muted }]}>Lokasi Kamu</Text>
                    </View>
                    <Text style={[styles.webAppLocationText, { color: webAppTheme.text }]}>
                        {coords.lat.toFixed(4)} derajat lintang, {coords.lng.toFixed(4)} derajat bujur
                    </Text>
                </View>
            ) : null}

            {isWebAppLayout ? (
                <Text style={[styles.webAppGpsNote, { color: webAppTheme.note }]}>
                    Arah dihitung menggunakan koordinat GPS. Untuk akurasi tertinggi, pastikan GPS aktif.
                </Text>
            ) : null}
        </Screen>
    );
}

const styles = StyleSheet.create({
    webAppSurface: {
        backgroundColor: "#f8fafc",
        borderRadius: radius.md,
        padding: spacing.sm,
    },
    webAppHeader: {
        alignItems: "center",
        marginBottom: spacing.lg,
        paddingTop: spacing.sm,
    },
    webAppIconBox: {
        alignItems: "center",
        backgroundColor: "#d1fae5",
        borderRadius: 18,
        height: 64,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 64,
    },
    webAppTitle: {
        color: "#064e3b",
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: 0,
        textAlign: "center",
    },
    webAppSubtitle: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 20,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    webAppMessage: {
        backgroundColor: "#fff7ed",
        borderColor: "#fed7aa",
        borderRadius: 16,
        color: "#c2410c",
    },
    webAppPanel: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 18,
        shadowOpacity: 0,
    },
    webAppCompassPanel: {
        alignItems: "stretch",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 22,
        paddingHorizontal: spacing.md,
        shadowOpacity: 0,
    },
    webAppCardTitle: {
        color: "#0f172a",
        fontSize: 15,
    },
    webAppCardMeta: {
        color: "#059669",
    },
    webAppMuted: {
        color: "#64748b",
        fontWeight: "700",
    },
    webAppManualInput: {
        backgroundColor: "#f8fafc",
        borderColor: "#d1d5db",
    },
    webAppButton: {
        backgroundColor: "#047857",
        borderRadius: 14,
    },
    webAppLoading: {
        alignItems: "center",
        paddingVertical: spacing.xl,
    },
    webAppLoadingText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
        marginTop: spacing.sm,
    },
    webAppCompass: {
        backgroundColor: "#ffffff",
        borderColor: "#a7f3d0",
        borderWidth: 4,
    },
    webAppDegrees: {
        color: "#047857",
    },
    webAppDirectionLabel: {
        color: "#64748b",
    },
    webAppMetric: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 18,
        minHeight: 112,
        padding: spacing.md,
    },
    webAppMetricLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "800",
    },
    webAppMetricValue: {
        color: "#047857",
    },
    webAppMetricValueSmall: {
        color: "#047857",
        fontSize: 16,
        fontWeight: "900",
    },
    webAppLocationCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    webAppLocationTitleRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    webAppLocationTitle: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
        textTransform: "uppercase",
    },
    webAppLocationText: {
        color: "#334155",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
    },
    webAppGpsNote: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: spacing.sm,
        textAlign: "center",
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
