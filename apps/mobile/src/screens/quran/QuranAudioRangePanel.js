import {
    ChevronDown,
    ChevronUp,
    Pause,
    Repeat,
    SkipBack,
    SkipForward,
    Volume2,
    X,
} from "lucide-react-native";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { colors, radius, spacing, touchTarget } from "../../theme";
import { AUDIO_SPEED_OPTIONS } from "../QuranScreen.helpers";
import { styles } from "../QuranScreen.styles";
import { hapticTap } from "../../utils/haptics";

const QARI_COUNTRY_MAP = {
    "mishary-rashid-alafasy": "Kuwait",
    Alafasy_64kbps: "Kuwait",
    "abdurrahman-as-sudais": "Arab Saudi",
    "abdul-rahman-al-sudais": "Arab Saudi",
    "abdul-basit": "Mesir",
    "saad-al-ghamidi": "Arab Saudi",
    "yasser-al-dosari": "Arab Saudi",
    "maher-al-muaiqly": "Arab Saudi",
    "hani-ar-rifai": "Arab Saudi",
    "salah-bukhatir": "Arab Saudi",
    "abdullah-al-juhany": "Arab Saudi",
    "ali-al-hudhaify": "Yaman",
};

export function renderQuranAudioRangePanel({
    audioPlayerOpen,
    audioQariOptions,
    audioRange,
    audioRangeCollapsed,
    audioQueueInfo,
    audioState,
    isDarkTheme,
    isWebAppLayout,
    selectAudioSpeed,
    selectQari,
    selectedSurah,
    setAudioPlayerOpen,
    setAudioRangeCollapsed,
    skipRangeAudio,
    startRangeAudio,
    stopRangeAudio,
    toggleAudioRepeat,
    t,
    updateAudioRangeField,
}) {
    if (!audioPlayerOpen) return null;
    if (!selectedSurah || selectedSurah.type !== "surah") return null;

    const translate = typeof t === "function" ? t : (key) => key;
    const activeQari = audioQariOptions.find(
        (item) => item.qari_slug === audioState.qariSlug,
    );
    const qariLabel =
        activeQari?.qari_name || translate("quran.audioRange.selectQari");
    const isPlayingAyah = Boolean(
        audioState.playingAyahId || audioState.loadingAyahId,
    );
    const isPlaying = audioRange.playing || audioRange.loading || isPlayingAyah;
    const canSkipBackward =
        audioQueueInfo.length > 0 &&
        (audioRange.repeat || audioQueueInfo.index > 0);
    const canSkipForward =
        audioQueueInfo.length > 0 &&
        (audioRange.repeat || audioQueueInfo.index < audioQueueInfo.length - 1);

    if (audioRangeCollapsed) {
        return (
            <View
                style={[
                    localStyles.miniFloatingWrapper,
                    isWebAppLayout ? localStyles.miniFloatingWebApp : null,
                ]}
                testID='audio-range-mini'
                pointerEvents='box-none'
            >
                <View
                    style={[
                        styles.audioMiniPanel,
                        localStyles.miniCard,
                        isDarkTheme ? localStyles.miniCardDark : null,
                    ]}
                >
                    <Pressable
                        accessibilityLabel={translate("a11y.toggleRangeAudio")}
                        accessibilityRole='button'
                        accessibilityState={{ disabled: audioRange.loading }}
                        disabled={audioRange.loading}
                        onPress={isPlaying ? stopRangeAudio : startRangeAudio}
                        style={[
                            styles.audioMiniPlayButton,
                            localStyles.miniPlayBtn,
                            audioRange.loading ? styles.disabled : null,
                        ]}
                        testID='audio-range-mini-toggle'
                        onPressIn={hapticTap}
                    >
                        {isPlaying ? (
                            <Pause
                                color={colors.onPrimary}
                                size={17}
                                strokeWidth={2.5}
                            />
                        ) : (
                            <Volume2
                                color={colors.onPrimary}
                                size={17}
                                strokeWidth={2.5}
                            />
                        )}
                    </Pressable>

                    <Pressable
                        accessibilityRole='button'
                        onPress={() => setAudioRangeCollapsed(false)}
                        style={[styles.audioMiniCopy, localStyles.miniCopy]}
                        testID='audio-range-expand'
                        onPressIn={hapticTap}
                    >
                        <Text
                            numberOfLines={1}
                            style={[
                                styles.audioMiniTitle,
                                localStyles.miniTitle,
                                isDarkTheme
                                    ? localStyles.textEmeraldLight
                                    : null,
                            ]}
                        >
                            {audioRange.currentLabel ||
                                selectedSurah.name ||
                                translate("quran.audioRange.title")}
                        </Text>
                        <Text numberOfLines={1} style={styles.audioMiniMeta}>
                            {audioRange.loading
                                ? translate("quran.audioRange.loading")
                                : `${qariLabel} · ${audioRange.speed}x`}
                        </Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole='button'
                        accessibilityLabel={translate(
                            "quran.audioRange.expandLabel",
                        )}
                        onPress={() => setAudioRangeCollapsed(false)}
                        style={styles.audioMiniIconButton}
                        onPressIn={hapticTap}
                    >
                        <ChevronUp
                            color={colors.muted}
                            size={19}
                            strokeWidth={2.4}
                        />
                    </Pressable>

                    <Pressable
                        accessibilityRole='button'
                        accessibilityLabel={translate(
                            "quran.audioRange.closeLabel",
                        )}
                        onPress={stopRangeAudio}
                        style={styles.audioMiniIconButton}
                        onPressIn={hapticTap}
                    >
                        <X color={colors.muted} size={19} strokeWidth={2.4} />
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View
            style={[
                localStyles.sheetWrapperFull,
                isWebAppLayout ? localStyles.sheetWrapperWebApp : null,
            ]}
            testID='audio-range-sheet'
            pointerEvents='box-none'
        >
            <Pressable
                accessibilityLabel={translate("quran.audioRange.collapseLabel")}
                onPress={() => setAudioRangeCollapsed(true)}
                style={localStyles.backdrop}
                testID='audio-range-backdrop'
                pointerEvents='auto'
            />
            <View
                style={[
                    localStyles.sheetContainer,
                    isDarkTheme ? localStyles.sheetContainerDark : null,
                ]}
                pointerEvents='box-none'
            >
                <View style={localStyles.handleRow}>
                    <View style={localStyles.handle} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={localStyles.scrollContent}
                    keyboardShouldPersistTaps='handled'
                >
                    {/* Header */}
                    <View style={styles.audioPanelHeader}>
                        <View style={styles.audioPanelTitleRow}>
                            <View style={localStyles.headerIconBadge}>
                                <Volume2
                                    color={
                                        isDarkTheme ? "#34d399" : colors.primary
                                    }
                                    size={18}
                                    strokeWidth={2.4}
                                />
                            </View>
                            <View style={styles.audioPanelTitleCopy}>
                                <Text style={styles.audioPanelTitle}>
                                    {translate("quran.audioRange.title")}
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    style={styles.audioPanelMeta}
                                >
                                    {selectedSurah.name} · {qariLabel} ·{" "}
                                    {audioRange.speed}x
                                </Text>
                            </View>
                        </View>
                        <View style={styles.audioPanelHeaderActions}>
                            <Pressable
                                accessibilityRole='button'
                                accessibilityLabel={translate(
                                    "quran.audioRange.minimizeLabel",
                                )}
                                onPress={() => setAudioRangeCollapsed(true)}
                                style={[
                                    styles.audioPanelIconButton,
                                    localStyles.headerIconBtn,
                                ]}
                                testID='audio-range-minimize'
                                onPressIn={hapticTap}
                            >
                                <ChevronDown
                                    color={colors.muted}
                                    size={19}
                                    strokeWidth={2.4}
                                />
                            </Pressable>
                            <Pressable
                                accessibilityRole='button'
                                accessibilityLabel={translate(
                                    "quran.audioRange.closeLabel",
                                )}
                                onPress={stopRangeAudio}
                                style={[
                                    styles.audioPanelIconButton,
                                    localStyles.headerIconBtn,
                                ]}
                                testID='audio-range-close'
                                onPressIn={hapticTap}
                            >
                                <X
                                    color={colors.muted}
                                    size={19}
                                    strokeWidth={2.4}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* 4-column Range Grid */}
                    <View style={styles.audioInputGrid}>
                        <View style={styles.audioInputGroup}>
                            <Text style={styles.audioInputLabel}>
                                {translate("quran.audioRange.startSurah")}
                            </Text>
                            <TextInput
                                keyboardType='number-pad'
                                onChangeText={(value) =>
                                    updateAudioRangeField("startSurah", value)
                                }
                                placeholder={`${selectedSurah.number}`}
                                placeholderTextColor={colors.muted}
                                style={[
                                    styles.audioInput,
                                    localStyles.rangeInput,
                                    isDarkTheme ? localStyles.inputDark : null,
                                ]}
                                testID='audio-start-surah'
                                value={audioRange.startSurah}
                            />
                        </View>
                        <View style={styles.audioInputGroup}>
                            <Text style={styles.audioInputLabel}>
                                {translate("quran.audioRange.startAyah")}
                            </Text>
                            <TextInput
                                keyboardType='number-pad'
                                onChangeText={(value) =>
                                    updateAudioRangeField("startAyah", value)
                                }
                                placeholder='1'
                                placeholderTextColor={colors.muted}
                                style={[
                                    styles.audioInput,
                                    localStyles.rangeInput,
                                    isDarkTheme ? localStyles.inputDark : null,
                                ]}
                                testID='audio-start-ayah'
                                value={audioRange.startAyah}
                            />
                        </View>
                        <View style={styles.audioInputGroup}>
                            <Text style={styles.audioInputLabel}>
                                {translate("quran.audioRange.endSurah")}
                            </Text>
                            <TextInput
                                keyboardType='number-pad'
                                onChangeText={(value) =>
                                    updateAudioRangeField("endSurah", value)
                                }
                                placeholder={`${selectedSurah.number}`}
                                placeholderTextColor={colors.muted}
                                style={[
                                    styles.audioInput,
                                    localStyles.rangeInput,
                                    isDarkTheme ? localStyles.inputDark : null,
                                ]}
                                testID='audio-end-surah'
                                value={audioRange.endSurah}
                            />
                        </View>
                        <View style={styles.audioInputGroup}>
                            <Text style={styles.audioInputLabel}>
                                {translate("quran.audioRange.endAyah")}
                            </Text>
                            <TextInput
                                keyboardType='number-pad'
                                onChangeText={(value) =>
                                    updateAudioRangeField("endAyah", value)
                                }
                                placeholder={`${selectedSurah.ayahs || ""}`}
                                placeholderTextColor={colors.muted}
                                style={[
                                    styles.audioInput,
                                    localStyles.rangeInput,
                                    isDarkTheme ? localStyles.inputDark : null,
                                ]}
                                testID='audio-end-ayah'
                                value={audioRange.endAyah}
                            />
                        </View>
                    </View>

                    {/* Transport Controls */}
                    <View
                        style={[
                            styles.audioTransportRow,
                            localStyles.transportRow,
                        ]}
                    >
                        <Pressable
                            accessibilityRole='button'
                            accessibilityLabel={translate(
                                "quran.audioRange.previousAyah",
                            )}
                            accessibilityState={{
                                disabled:
                                    !canSkipBackward || audioRange.loading,
                            }}
                            disabled={!canSkipBackward || audioRange.loading}
                            onPress={() => skipRangeAudio(-1)}
                            style={[
                                styles.audioSkipButton,
                                localStyles.skipBtn,
                                !canSkipBackward || audioRange.loading
                                    ? styles.disabled
                                    : null,
                            ]}
                            testID='audio-range-prev'
                            onPressIn={hapticTap}
                        >
                            <SkipBack
                                color={isDarkTheme ? "#e2e8f0" : colors.text}
                                size={20}
                                strokeWidth={2.4}
                            />
                        </Pressable>

                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(255,255,255,0.18)",
                                borderless: false,
                            }}
                            accessibilityState={{
                                disabled: audioRange.loading,
                            }}
                            disabled={audioRange.loading}
                            onPress={
                                isPlaying ? stopRangeAudio : startRangeAudio
                            }
                            style={[
                                styles.audioPrimaryButton,
                                localStyles.mainPlayBtn,
                                audioRange.loading ? styles.disabled : null,
                            ]}
                            testID='audio-range-toggle'
                            onPressIn={hapticTap}
                        >
                            {isPlaying ? (
                                <Pause
                                    color={colors.onPrimary}
                                    size={20}
                                    strokeWidth={2.5}
                                />
                            ) : (
                                <Volume2
                                    color={colors.onPrimary}
                                    size={20}
                                    strokeWidth={2.5}
                                />
                            )}
                            <Text
                                style={[
                                    styles.audioPrimaryButtonText,
                                    localStyles.mainPlayBtnText,
                                ]}
                            >
                                {audioRange.loading
                                    ? translate("quran.audioRange.loadingShort")
                                    : isPlaying
                                      ? translate("quran.audioRange.stop")
                                      : translate("quran.audioRange.playRange")}
                            </Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole='button'
                            accessibilityLabel={translate(
                                "quran.audioRange.nextAyah",
                            )}
                            accessibilityState={{
                                disabled: !canSkipForward || audioRange.loading,
                            }}
                            disabled={!canSkipForward || audioRange.loading}
                            onPress={() => skipRangeAudio(1)}
                            style={[
                                styles.audioSkipButton,
                                localStyles.skipBtn,
                                !canSkipForward || audioRange.loading
                                    ? styles.disabled
                                    : null,
                            ]}
                            testID='audio-range-next'
                            onPressIn={hapticTap}
                        >
                            <SkipForward
                                color={isDarkTheme ? "#e2e8f0" : colors.text}
                                size={20}
                                strokeWidth={2.4}
                            />
                        </Pressable>
                    </View>

                    <Text style={styles.audioQueueText}>
                        {audioQueueInfo.length > 0
                            ? `${audioQueueInfo.index + 1}/${audioQueueInfo.length}`
                            : translate("quran.audioRange.emptyQueue")}
                    </Text>

                    {/* Qari Selector - Horizontal Scroll */}
                    <Text style={styles.audioSectionLabel}>
                        {translate("quran.audioRange.qari")}
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={localStyles.qariScrollContent}
                        keyboardShouldPersistTaps='handled'
                    >
                        {audioQariOptions.map((qari) => {
                            const isActive =
                                audioState.qariSlug === qari.qari_slug;
                            const country =
                                QARI_COUNTRY_MAP[qari.qari_slug] || "Syaikh";
                            const initials = qari.qari_name
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("");

                            return (
                                <Pressable
                                    accessibilityRole='button'
                                    key={qari.qari_slug}
                                    onPress={() =>
                                        selectQari(null, qari.qari_slug)
                                    }
                                    style={[
                                        localStyles.qariCard,
                                        isDarkTheme
                                            ? localStyles.qariCardDark
                                            : null,
                                        isActive
                                            ? localStyles.qariCardActive
                                            : null,
                                    ]}
                                    onPressIn={hapticTap}
                                >
                                    <View
                                        style={[
                                            localStyles.qariAvatar,
                                            isActive
                                                ? localStyles.qariAvatarActive
                                                : null,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                localStyles.qariAvatarText,
                                                isActive
                                                    ? localStyles.qariAvatarTextActive
                                                    : null,
                                            ]}
                                        >
                                            {initials || "Q"}
                                        </Text>
                                    </View>
                                    <View style={localStyles.qariCopy}>
                                        <Text
                                            numberOfLines={1}
                                            style={[
                                                styles.audioChipText,
                                                isActive
                                                    ? styles.audioChipTextActive
                                                    : null,
                                                isDarkTheme && !isActive
                                                    ? localStyles.textSlateLight
                                                    : null,
                                                localStyles.qariName,
                                            ]}
                                        >
                                            {qari.qari_name}
                                        </Text>
                                        <Text
                                            numberOfLines={1}
                                            style={localStyles.qariCountry}
                                        >
                                            {country}
                                        </Text>
                                    </View>
                                    {isActive ? (
                                        <View style={localStyles.activeBadge}>
                                            <Text
                                                style={
                                                    localStyles.activeBadgeText
                                                }
                                            >
                                                Aktif
                                            </Text>
                                        </View>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Speed and Repeat */}
                    <View
                        style={[styles.audioControlRow, localStyles.controlRow]}
                    >
                        <View style={styles.audioControlGroup}>
                            <Text style={styles.audioSectionLabel}>
                                {translate("quran.audioRange.speed")}
                            </Text>
                            <View style={styles.audioChipRow}>
                                {AUDIO_SPEED_OPTIONS.map((speed) => {
                                    const isActive = audioRange.speed === speed;
                                    return (
                                        <Pressable
                                            accessibilityRole='button'
                                            key={speed}
                                            onPress={() =>
                                                selectAudioSpeed(speed)
                                            }
                                            style={[
                                                styles.audioChip,
                                                isActive
                                                    ? styles.audioChipActive
                                                    : null,
                                                localStyles.speedChip,
                                            ]}
                                            onPressIn={hapticTap}
                                        >
                                            <Text
                                                style={[
                                                    styles.audioChipText,
                                                    isActive
                                                        ? styles.audioChipTextActive
                                                        : null,
                                                ]}
                                            >
                                                {speed}x
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        <Pressable
                            accessibilityRole='button'
                            onPress={toggleAudioRepeat}
                            style={[
                                styles.audioRepeatButton,
                                audioRange.repeat
                                    ? styles.audioRepeatButtonActive
                                    : null,
                                localStyles.repeatBtn,
                            ]}
                            testID='audio-repeat-toggle'
                            onPressIn={hapticTap}
                        >
                            <Repeat
                                color={
                                    audioRange.repeat
                                        ? colors.onPrimary
                                        : isDarkTheme
                                          ? "#94a3b8"
                                          : colors.text
                                }
                                size={14}
                                strokeWidth={2.4}
                            />
                            <Text
                                style={[
                                    styles.audioRepeatText,
                                    audioRange.repeat
                                        ? styles.audioRepeatTextActive
                                        : null,
                                ]}
                            >
                                {translate(
                                    audioRange.repeat
                                        ? "quran.audioRange.repeatOn"
                                        : "quran.audioRange.repeatOff",
                                )}
                            </Text>
                        </Pressable>
                    </View>

                    {audioRange.currentLabel ? (
                        <Text style={styles.audioStatusText}>
                            {audioRange.currentLabel}
                        </Text>
                    ) : null}
                </ScrollView>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    miniFloatingWrapper: {
        bottom: spacing.md,
        left: spacing.md,
        position: "absolute",
        right: spacing.md,
        zIndex: 90,
    },
    miniFloatingWebApp: {
        bottom: 74,
    },
    miniCard: {
        borderRadius: radius.lg,
        elevation: 10,
        marginBottom: 0,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        shadowColor: "#000",
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
    },
    miniCardDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    miniPlayBtn: {
        height: 42,
        width: 42,
    },
    miniCopy: {
        paddingHorizontal: spacing.xs,
    },
    miniTitle: {
        fontSize: 13,
        fontWeight: "800",
    },
    textEmeraldLight: {
        color: "#34d399",
    },
    textSlateLight: {
        color: "#e2e8f0",
    },

    // Full-screen sheet
    sheetWrapperFull: {
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
        zIndex: 95,
    },
    sheetWrapperWebApp: {
        bottom: 60,
    },
    backdrop: {
        backgroundColor: "rgba(0,0,0,0.4)",
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
    },
    sheetContainer: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        bottom: 0,
        elevation: 24,
        left: 0,
        maxHeight: "90%",
        position: "absolute",
        right: 0,
        shadowColor: "#000",
        shadowOffset: { height: -4, width: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    sheetContainerDark: {
        backgroundColor: "#0f172a",
        borderColor: "#334155",
    },
    scrollContent: {
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xs,
    },
    handleRow: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xs,
        width: "100%",
    },
    handle: {
        backgroundColor: colors.borderStrong,
        borderRadius: 3,
        height: 4,
        width: 36,
    },
    headerIconBadge: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: radius.sm,
        height: 32,
        justifyContent: "center",
        width: 32,
    },
    headerIconBtn: {
        borderRadius: radius.md,
        height: 32,
        width: 32,
    },
    rangeInput: {
        borderRadius: radius.md,
        fontSize: 14,
        minHeight: 44,
    },
    inputDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
        color: "#f8fafc",
    },
    transportRow: {
        gap: spacing.md,
        marginVertical: spacing.sm,
    },
    skipBtn: {
        borderRadius: 999,
        height: 46,
        width: 46,
    },
    mainPlayBtn: {
        borderRadius: 999,
        minHeight: 48,
        paddingHorizontal: spacing.xl,
    },
    mainPlayBtnText: {
        fontSize: 14,
    },
    qariScrollContent: {
        gap: spacing.xs,
        paddingBottom: spacing.xs,
    },
    qariCard: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        padding: spacing.sm,
        minWidth: 180,
    },
    qariCardDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    qariCardActive: {
        backgroundColor: "#064e3b20",
        borderColor: colors.primary,
    },
    qariAvatar: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: 999,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    qariAvatarActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    qariAvatarText: {
        color: colors.primaryDark,
        fontSize: 12,
        fontWeight: "900",
    },
    qariAvatarTextActive: {
        color: colors.onPrimary,
    },
    qariCopy: {
        flex: 1,
        minWidth: 0,
    },
    qariName: {
        fontSize: 13,
        fontWeight: "700",
    },
    qariCountry: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "600",
        marginTop: 1,
    },
    activeBadge: {
        backgroundColor: colors.primary,
        borderRadius: 999,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
    },
    activeBadgeText: {
        color: colors.onPrimary,
        fontSize: 10,
        fontWeight: "800",
    },
    controlRow: {
        alignItems: "center",
        marginTop: spacing.sm,
    },
    speedChip: {
        borderRadius: 999,
        paddingHorizontal: spacing.md,
    },
    repeatBtn: {
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
});
