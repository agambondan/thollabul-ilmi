import {
    ChevronDown,
    ChevronUp,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    X,
} from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';

import { colors } from '../../theme';
import { AUDIO_SPEED_OPTIONS } from '../QuranScreen.helpers';
import { styles } from '../QuranScreen.styles';

export function renderQuranAudioRangePanel({
    audioQariOptions,
    audioRange,
    audioRangeCollapsed,
    audioQueueInfo,
    audioState,
    selectAudioSpeed,
    selectQari,
    selectedSurah,
    setAudioRangeCollapsed,
    skipRangeAudio,
    startRangeAudio,
    stopRangeAudio,
    toggleAudioRepeat,
    t,
    updateAudioRangeField,
}) {
    if (!selectedSurah || selectedSurah.type !== 'surah') return null;
    const translate = typeof t === 'function' ? t : (key) => key;
    const activeQari = audioQariOptions.find((item) => item.qari_slug === audioState.qariSlug);
    const qariLabel = activeQari?.qari_name || translate('quran.audioRange.selectQari');
    const isPlaying = audioRange.playing || audioRange.loading;
    const canSkipBackward = audioQueueInfo.length > 0 && (audioRange.repeat || audioQueueInfo.index > 0);
    const canSkipForward = audioQueueInfo.length > 0 && (audioRange.repeat || audioQueueInfo.index < audioQueueInfo.length - 1);

    if (audioRangeCollapsed) {
        return (
            <View style={styles.audioMiniPanel} testID="audio-range-mini">
                <Pressable
                    disabled={audioRange.loading}
                    onPress={isPlaying ? stopRangeAudio : startRangeAudio}
                    style={[
                        styles.audioMiniPlayButton,
                        audioRange.loading ? styles.disabled : null,
                    ]}
                    testID="audio-range-mini-toggle"
                >
                    {isPlaying ? (
                        <Pause color={colors.onPrimary} size={16} strokeWidth={2.5} />
                    ) : (
                        <Volume2 color={colors.onPrimary} size={16} strokeWidth={2.5} />
                    )}
                </Pressable>
                <Pressable
                    onPress={() => setAudioRangeCollapsed(false)}
                    style={styles.audioMiniCopy}
                    testID="audio-range-expand"
                >
                    <Text numberOfLines={1} style={styles.audioMiniTitle}>
                        {audioRange.currentLabel || selectedSurah.name || translate('quran.audioRange.title')}
                    </Text>
                    <Text numberOfLines={1} style={styles.audioMiniMeta}>
                        {audioRange.loading ? translate('quran.audioRange.loading') : `${qariLabel} · ${audioRange.speed}x`}
                    </Text>
                </Pressable>
                <Pressable
                    accessibilityLabel={translate('quran.audioRange.expandLabel')}
                    onPress={() => setAudioRangeCollapsed(false)}
                    style={styles.audioMiniIconButton}
                >
                    <ChevronUp color={colors.muted} size={18} strokeWidth={2.4} />
                </Pressable>
                <Pressable
                    accessibilityLabel={translate('quran.audioRange.closeLabel')}
                    onPress={stopRangeAudio}
                    style={styles.audioMiniIconButton}
                >
                    <X color={colors.muted} size={18} strokeWidth={2.4} />
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.audioPanel}>
            <View style={styles.audioPanelHeader}>
                <View style={styles.audioPanelTitleRow}>
                    <Volume2 color={colors.primaryDark} size={18} strokeWidth={2.2} />
                    <View style={styles.audioPanelTitleCopy}>
                        <Text style={styles.audioPanelTitle}>{translate('quran.audioRange.title')}</Text>
                        <Text numberOfLines={1} style={styles.audioPanelMeta}>
                            {qariLabel} · {audioRange.speed}x
                        </Text>
                    </View>
                </View>
                <View style={styles.audioPanelHeaderActions}>
                    <Pressable
                        accessibilityLabel={translate('quran.audioRange.minimizeLabel')}
                        onPress={() => setAudioRangeCollapsed(true)}
                        style={styles.audioPanelIconButton}
                        testID="audio-range-minimize"
                    >
                        <ChevronDown color={colors.muted} size={18} strokeWidth={2.4} />
                    </Pressable>
                    <Pressable
                        android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
                        disabled={audioRange.loading}
                        onPress={isPlaying ? stopRangeAudio : startRangeAudio}
                        style={[
                            styles.audioPrimaryButton,
                            audioRange.loading ? styles.disabled : null,
                        ]}
                        testID="audio-range-toggle"
                    >
                        {isPlaying ? (
                            <Pause color={colors.onPrimary} size={15} strokeWidth={2.4} />
                        ) : (
                            <Volume2 color={colors.onPrimary} size={15} strokeWidth={2.4} />
                        )}
                        <Text style={styles.audioPrimaryButtonText}>
                            {audioRange.loading
                                ? translate('quran.audioRange.loadingShort')
                                : isPlaying
                                    ? translate('quran.audioRange.stop')
                                    : translate('quran.audioRange.playRange')}
                        </Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.audioInputGrid}>
                <View style={styles.audioInputGroup}>
                    <Text style={styles.audioInputLabel}>{translate('quran.audioRange.startSurah')}</Text>
                    <TextInput
                        keyboardType="number-pad"
                        onChangeText={(value) => updateAudioRangeField('startSurah', value)}
                        placeholder={`${selectedSurah.number}`}
                        placeholderTextColor={colors.muted}
                        style={styles.audioInput}
                        testID="audio-start-surah"
                        value={audioRange.startSurah}
                    />
                </View>
                <View style={styles.audioInputGroup}>
                    <Text style={styles.audioInputLabel}>{translate('quran.audioRange.endSurah')}</Text>
                    <TextInput
                        keyboardType="number-pad"
                        onChangeText={(value) => updateAudioRangeField('endSurah', value)}
                        placeholder={`${selectedSurah.number}`}
                        placeholderTextColor={colors.muted}
                        style={styles.audioInput}
                        testID="audio-end-surah"
                        value={audioRange.endSurah}
                    />
                </View>
                <View style={styles.audioInputGroup}>
                    <Text style={styles.audioInputLabel}>{translate('quran.audioRange.endAyah')}</Text>
                    <TextInput
                        keyboardType="number-pad"
                        onChangeText={(value) => updateAudioRangeField('endAyah', value)}
                        placeholder={`${selectedSurah.ayahs || ''}`}
                        placeholderTextColor={colors.muted}
                        style={styles.audioInput}
                        testID="audio-end-ayah"
                        value={audioRange.endAyah}
                    />
                </View>
            </View>

            <View style={styles.audioTransportRow}>
                <Pressable
                    accessibilityLabel={translate('quran.audioRange.previousAyah')}
                    disabled={!canSkipBackward || audioRange.loading}
                    onPress={() => skipRangeAudio(-1)}
                    style={[
                        styles.audioSkipButton,
                        !canSkipBackward || audioRange.loading ? styles.disabled : null,
                    ]}
                    testID="audio-range-prev"
                >
                    <SkipBack color={colors.text} size={18} strokeWidth={2.4} />
                </Pressable>
                <Text style={styles.audioQueueText}>
                    {audioQueueInfo.length > 0
                        ? `${audioQueueInfo.index + 1}/${audioQueueInfo.length}`
                        : translate('quran.audioRange.emptyQueue')}
                </Text>
                <Pressable
                    accessibilityLabel={translate('quran.audioRange.nextAyah')}
                    disabled={!canSkipForward || audioRange.loading}
                    onPress={() => skipRangeAudio(1)}
                    style={[
                        styles.audioSkipButton,
                        !canSkipForward || audioRange.loading ? styles.disabled : null,
                    ]}
                    testID="audio-range-next"
                >
                    <SkipForward color={colors.text} size={18} strokeWidth={2.4} />
                </Pressable>
            </View>

            <Text style={styles.audioSectionLabel}>{translate('quran.audioRange.qari')}</Text>
            <View style={styles.audioChipRow}>
                {audioQariOptions.map((qari) => {
                    const isActive = audioState.qariSlug === qari.qari_slug;
                    return (
                        <Pressable
                            key={qari.qari_slug}
                            onPress={() => selectQari(null, qari.qari_slug)}
                            style={[
                                styles.audioChip,
                                isActive ? styles.audioChipActive : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.audioChipText,
                                    isActive ? styles.audioChipTextActive : null,
                                ]}
                            >
                                {qari.qari_name}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.audioControlRow}>
                <View style={styles.audioControlGroup}>
                    <Text style={styles.audioSectionLabel}>{translate('quran.audioRange.speed')}</Text>
                    <View style={styles.audioChipRow}>
                        {AUDIO_SPEED_OPTIONS.map((speed) => {
                            const isActive = audioRange.speed === speed;
                            return (
                                <Pressable
                                    key={speed}
                                    onPress={() => selectAudioSpeed(speed)}
                                    style={[
                                        styles.audioChip,
                                        isActive ? styles.audioChipActive : null,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.audioChipText,
                                            isActive ? styles.audioChipTextActive : null,
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
                    onPress={toggleAudioRepeat}
                    style={[
                        styles.audioRepeatButton,
                        audioRange.repeat ? styles.audioRepeatButtonActive : null,
                    ]}
                    testID="audio-repeat-toggle"
                >
                    <Text
                        style={[
                            styles.audioRepeatText,
                            audioRange.repeat ? styles.audioRepeatTextActive : null,
                        ]}
                    >
                        {translate(audioRange.repeat ? 'quran.audioRange.repeatOn' : 'quran.audioRange.repeatOff')}
                    </Text>
                </Pressable>
            </View>

            {audioRange.currentLabel ? (
                <Text style={styles.audioStatusText}>{audioRange.currentLabel}</Text>
            ) : null}
        </View>
    );
}
