import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    Info,
    Link,
    Minus,
    MoreVertical,
    Pause,
    Plus,
    Save,
    Search,
    SlidersHorizontal,
    StickyNote,
    Volume2,
} from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AppActionSheet, ActionSheetRow } from '../../components/AppActionSheet';
import { AppModalSheet } from '../../components/AppModalSheet';
import { Card, CardTitle } from '../../components/Card';
import { NotesPanel } from '../../components/NotesPanel';
import { ActionPill, EmptyState, IconActionButton } from '../../components/Paper';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme';
import {
    MEMORIZATION_MODES,
    DISPLAY_MODES,
    ARABIC_FONTS,
    QURAN_TABS,
    AUDIO_SPEED_OPTIONS,
    WEB_APP_QURAN_MUTED,
    WEB_APP_QURAN_ACCENT,
    MIN_ARABIC_FONT_SIZE,
    MAX_ARABIC_FONT_SIZE,
    BISMILLAH,
    toArabicDigits,
    formatInlineAyahMarker,
    stripHtmlTags,
    parseTajweedHtml,
    getTajweedTextColor,
    clampMushafPage,
    getFirstPageNumber,
    buildMushafLineGroups,
    getCompactArabicSurahName,
    TAJWEED_GROUPS,
} from '../QuranScreen.helpers';
import { styles } from '../QuranScreen.styles';

export function createQuranScreenRenderers(context) {
    const {
        activeNoteAyah,
        arabicFont,
        audioQariOptions,
        audioRange,
        audioState,
        ayahActionSheet,
        ayahs,
        bookmarks,
        closeReader,
        cycleHafalanStatus,
        displayMode,
        fontSize,
        hadithAyahModal,
        hafalanList,
        hafalanLoading,
        hafalanSummary,
        hizbInput,
        isWebAppLayout,
        loading,
        markAyahProgress,
        memorizationMode,
        message,
        munasabahModal,
        murojaahForm,
        murojaahLoading,
        murojaahMessage,
        mushafPageAyahs,
        mushafPageLoading,
        mushafPageNumber,
        mushafWordsByAyah,
        navigatorMode,
        openHadithAyahModal,
        openHizb,
        openMunasabahModal,
        openPage,
        openReferenceModal,
        openRelatedAyah,
        openRelatedHadith,
        openSurah,
        pageInput,
        playAyahAudio,
        progress,
        progressSurahNumber,
        quranTab,
        readerListRef,
        readerLoading,
        readerLoadingMore,
        readerMenuVisible,
        referenceModal,
        referenceState,
        revealedAyahs,
        savingAyah,
        savingMurojaah,
        selectAudioSpeed,
        selectQari,
        selectedDetailAyah,
        selectedSurah,
        setActiveNoteAyah,
        setAyahActionSheet,
        setHadithAyahModal,
        setHizbInput,
        setMunasabahModal,
        setMurojaahForm,
        setNavigatorMode,
        setPageInput,
        setQuranTab,
        setReaderMenuVisible,
        setReferenceModal,
        setRevealedAyahs,
        setSelectedDetailAyah,
        setSettingsVisible,
        setSurahQuery,
        setTafsirMode,
        setTajweedVisible,
        settingsVisible,
        startRangeAudio,
        stopRangeAudio,
        submitMurojaah,
        surahQuery,
        surahs,
        tafsirMode,
        tajweedVisible,
        targetAyah,
        targetAyahIndex,
        toggleAudioRepeat,
        toggleAyahBookmark,
        triggerAdjacentSurah,
        updateArabicFont,
        updateAudioRangeField,
        updateDisplayMode,
        updateFontSize,
        updateMemorizationMode,
        user,
    } = context;

    const getArabicTypography = (extraSize = 0, lineHeightRatio = 1.75) => {
        const font = ARABIC_FONTS.find((f) => f.key === arabicFont);
        const size = Math.max(
            MIN_ARABIC_FONT_SIZE,
            Math.min(MAX_ARABIC_FONT_SIZE + extraSize, fontSize + extraSize),
        );
        return {
            fontSize: size,
            fontWeight: '400',
            lineHeight: Math.round(size * lineHeightRatio),
            ...(font?.fontFamily ? { fontFamily: font.fontFamily } : {}),
        };
    };

    const renderAudioSources = (ayah) => {
        const sources = audioState.sourcesByAyah[ayah.id] ?? [];
        if (sources.length <= 1) return null;
        return (
            <View style={styles.qariGrid}>
                {sources.map((source) => (
                    <Pressable
                        key={`${ayah.id}-${source.qari_slug}`}
                        onPress={() => selectQari(ayah.id, source.qari_slug)}
                        style={[
                            styles.qariButton,
                            audioState.qariSlug === source.qari_slug ? styles.qariButtonActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.qariText,
                                audioState.qariSlug === source.qari_slug ? styles.qariTextActive : null,
                            ]}
                        >
                            {source.qari_name}
                        </Text>
                    </Pressable>
                ))}
            </View>
        );
    };

    const renderArabicSpans = (ayah, keyPrefix = 'arabic') => {
        const source = ayah.arabicHtml || ayah.arabic || '';
        const segments = /<tajweed/i.test(source)
            ? parseTajweedHtml(source)
            : [{ text: stripHtmlTags(source), className: null }];

        return segments.map((segment, index) => {
            const color = getTajweedTextColor(segment.className);
            return (
                <Text
                    key={`${keyPrefix}-${ayah.id ?? ayah.number}-${index}`}
                    style={color ? { color } : null}
                >
                    {segment.text}
                </Text>
            );
        });
    };

    const renderArabicContent = (ayah, arabicStyle, keyPrefix = 'arabic') => (
        <Text style={arabicStyle}>
            {renderArabicSpans(ayah, keyPrefix)}
            <Text style={styles.inlineAyahMarker}>{`\u00A0${formatInlineAyahMarker(ayah.number)}\u00A0`}</Text>
        </Text>
    );

    const renderAyahText = (ayah) => {
        const isRevealed = Boolean(revealedAyahs[ayah.id]);
        const hideArabic = !isRevealed && ['hide_arabic', 'hide_all'].includes(memorizationMode);
        const isMushaf = displayMode === 'mushaf';
        const isLine = displayMode === 'line';
        const isFocus = displayMode === 'focus' || isMushaf;
        const hideTranslationForMemorization =
            !isRevealed && ['hide_translation', 'hide_all'].includes(memorizationMode);
        const hideTranslation = isFocus || hideTranslationForMemorization;
        const hasHiddenContent = hideArabic || (!isFocus && hideTranslationForMemorization);
        const arabicBaseStyle = isMushaf ? styles.mushafArabic : isLine ? styles.lineArabic : styles.ayahArabic;
        const arabicStyle = [
            arabicBaseStyle,
            getArabicTypography(isMushaf ? 2 : 0, isMushaf ? 1.85 : 1.75),
        ];

        return (
            <>
                {(ayah.arabic || ayah.arabicHtml) && !hideArabic ? (
                    renderArabicContent(ayah, arabicStyle, `reader-${displayMode}`)
                ) : null}
                {hideArabic ? (
                    <View style={styles.hiddenBlock}>
                        <Text style={styles.hiddenTitle}>Arab disembunyikan untuk hafalan</Text>
                    </View>
                ) : null}
                {ayah.latin && !hideTranslation ? (
                    <Text style={styles.ayahLatin}>{ayah.latin}</Text>
                ) : null}
                {ayah.translation && !hideTranslation ? (
                    <Text style={styles.ayahTranslation}>{ayah.translation}</Text>
                ) : null}
                {!isFocus && hideTranslationForMemorization ? (
                    <View style={styles.hiddenBlock}>
                        <Text style={styles.hiddenTitle}>Terjemahan disembunyikan untuk latihan</Text>
                    </View>
                ) : null}
                {hasHiddenContent && !isLine ? (
                    <Pressable
                        onPress={() => setRevealedAyahs((current) => ({ ...current, [ayah.id]: true }))}
                        style={styles.revealButton}
                    >
                        <Text style={styles.revealButtonText}>Tampilkan Ayat</Text>
                    </Pressable>
                ) : null}
            </>
        );
    };

    const openAyahDetail = (ayah) => {
        setAyahActionSheet({ visible: false, ayah: null });
        setSelectedDetailAyah(ayah);
    };

    const closeAyahDetail = () => {
        setSelectedDetailAyah(null);
        setActiveNoteAyah(null);
    };

    const renderInlineArabicRow = (ayah) => (
        <View style={styles.inlineArabicRow}>
            <Pressable
                accessibilityLabel={`Aksi ayat ${ayah.number}`}
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: true }}
                onPress={() => setAyahActionSheet({ visible: true, ayah })}
                style={styles.inlineAyahMenuButton}
            >
                <MoreVertical color={colors.primary} size={18} strokeWidth={2.4} />
            </Pressable>
            <Pressable
                accessibilityLabel={`Buka detail ayat ${ayah.number}`}
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(91, 110, 91, 0.08)', borderless: false }}
                onPress={() => openAyahDetail(ayah)}
                style={styles.inlineArabicText}
            >
                {renderAyahText(ayah)}
                {displayMode !== 'mushaf' ? (
                    <Text style={styles.ayahReadMore}>Ketuk untuk membaca lengkap</Text>
                ) : null}
            </Pressable>
        </View>
    );

    const renderAyahHeader = (ayah) => {
        const meta = ayah.surahName ? `${ayah.surahName} · Ayah ${ayah.number}` : `Ayah ${ayah.number}`;
        return (
            <View style={styles.ayahHeader}>
                <View style={styles.ayahHeaderCopy}>
                    <Text style={styles.ayahHeaderTitle}>{selectedSurah.name}</Text>
                    <Text style={styles.ayahHeaderMeta}>{meta}</Text>
                </View>
                <Pressable
                    accessibilityLabel={`Aksi ayat ${ayah.number}`}
                    accessibilityRole="button"
                    android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: true }}
                    onPress={() => setAyahActionSheet({ visible: true, ayah })}
                    style={styles.ayahMenuButton}
                >
                    <MoreVertical color={colors.primary} size={18} strokeWidth={2.4} />
                </Pressable>
            </View>
        );
    };

    const renderLineAyah = (ayah, isTargetAyah) => (
        <View style={[styles.lineAyahRow, isTargetAyah ? styles.targetAyahCard : null]}>
            {renderInlineArabicRow(ayah)}
            {audioState.activeAyahId === ayah.id ? renderAudioSources(ayah) : null}
        </View>
    );

    const renderReaderFooter = () => {
        if (!readerLoadingMore) return null;
        return (
            <View style={styles.readerLoadingMore}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.readerLoadingMoreText}>Memuat ayat berikutnya...</Text>
            </View>
        );
    };

    const renderAyahCard = ({ item: ayah }) => {
        const isTargetAyah =
            (targetAyah?.id && Number(targetAyah.id) === Number(ayah.id)) ||
            (targetAyah?.number && Number(targetAyah.number) === Number(ayah.number));

        if (displayMode === 'line') return renderLineAyah(ayah, isTargetAyah);
        if (displayMode === 'focus') {
            return (
                <View style={[styles.focusAyahRow, isTargetAyah ? styles.targetAyahCard : null]}>
                    {renderInlineArabicRow(ayah)}
                    {audioState.activeAyahId === ayah.id ? renderAudioSources(ayah) : null}
                </View>
            );
        }

        return (
            <Card style={[
                displayMode === 'focus' ? styles.focusAyahCard : null,
                isTargetAyah ? styles.targetAyahCard : null,
            ]}>
                {renderInlineArabicRow(ayah)}
                {audioState.activeAyahId === ayah.id ? renderAudioSources(ayah) : null}
            </Card>
        );
    };

    const renderMushafFragmentSpans = (fragment, keyPrefix) =>
        fragment.segments.map((segment, index) => {
            const color = getTajweedTextColor(segment.className);
            return (
                <Text
                    key={`${keyPrefix}-${index}`}
                    style={color ? { color } : null}
                >
                    {segment.text}
                </Text>
            );
        });

    const renderMushafLineBlock = (group, mushafArabicStyle, showMushafArabic, showMushafTranslation) => {
        const key = group
            .map((fragment) =>
                `${fragment.ayah.surahNumber ?? selectedSurah.number}:${fragment.ayah.number}:${fragment.fragmentIndex}`,
            )
            .join('-');
        return (
            <View key={`mushaf-line-${key}`} style={styles.mushafAyahBlockLine}>
                {showMushafArabic ? (
                    <Text style={mushafArabicStyle}>
                        {group.map((fragment, fragmentIndex) => {
                            const ayah = fragment.ayah;
                            const isTargetAyah =
                                (targetAyah?.id && Number(targetAyah.id) === Number(ayah.id)) ||
                                (targetAyah?.number && Number(targetAyah.number) === Number(ayah.number));
                            return (
                                <Text
                                    key={`${ayah.id}-${ayah.surahNumber ?? selectedSurah.number}-${ayah.number}-${fragment.fragmentIndex}`}
                                    onPress={() => setAyahActionSheet({ visible: true, ayah })}
                                    style={isTargetAyah ? styles.mushafInlineTarget : null}
                                >
                                    {renderMushafFragmentSpans(fragment, `mushaf-line-${ayah.id}-${fragment.fragmentIndex}`)}
                                    {fragment.isAyahEnd ? (
                                        <Text style={styles.mushafVerseMark}> ۝{toArabicDigits(ayah.number)} </Text>
                                    ) : null}
                                </Text>
                            );
                        })}
                    </Text>
                ) : null}
                {showMushafTranslation && group.some((fragment) => fragment.isAyahEnd && fragment.ayah.translation) ? (
                    <Text style={styles.mushafPageTranslation}>
                        {group
                            .filter((fragment) => fragment.isAyahEnd && fragment.ayah.translation)
                            .map((fragment) => `${toArabicDigits(fragment.ayah.number)}. ${fragment.ayah.translation}`)
                            .join('  /  ')}
                    </Text>
                ) : null}
            </View>
        );
    };

    const renderMushafPerKataAyah = (ayah, words, showMushafArabic, showMushafTranslation) => {
        const ayahKey = `${ayah.surahNumber ?? selectedSurah.number}:${ayah.number}`;
        const isTargetAyah =
            (targetAyah?.id && Number(targetAyah.id) === Number(ayah.id)) ||
            (targetAyah?.number && Number(targetAyah.number) === Number(ayah.number));
        return (
            <Pressable
                key={`mushaf-perkata-${ayahKey}`}
                accessibilityRole="button"
                accessibilityLabel={`Aksi ayat ${ayah.number}`}
                onPress={() => setAyahActionSheet({ visible: true, ayah })}
                style={[
                    styles.mushafPerKataAyah,
                    isTargetAyah ? styles.mushafPerKataAyahTarget : null,
                ]}
            >
                {showMushafArabic ? (
                    <View style={styles.mushafPerKataRow}>
                        {words.map((word) => (
                            <View
                                key={`${ayahKey}-w${word.wordIndex}`}
                                style={styles.mushafWordCell}
                            >
                                <Text style={[styles.mushafWordArabic, getArabicTypography(0, 1.4)]}>
                                    {word.arabic}
                                </Text>
                                <Text style={styles.mushafWordLatin}>
                                    {word.transliteration || ' '}
                                </Text>
                                {showMushafTranslation ? (
                                    <Text style={styles.mushafWordIndo}>
                                        {word.indonesian || ' '}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                        <View style={styles.mushafVerseEndCell}>
                            <View style={styles.mushafVerseEndCircle}>
                                <Text style={styles.mushafVerseEndText}>
                                    {toArabicDigits(ayah.number)}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : null}
                {showMushafTranslation && ayah.translation ? (
                    <Text style={styles.mushafPerKataFullTranslation}>
                        {`(${ayah.number}) ${ayah.translation}`}
                    </Text>
                ) : null}
            </Pressable>
        );
    };

    const renderMushafPage = () => {
        const mushafArabicStyle = [
            styles.mushafPageArabic,
            getArabicTypography(-3, 1.72),
        ];
        const showMushafArabic = !['hide_arabic', 'hide_all'].includes(memorizationMode);
        const showMushafTranslation = !['hide_translation', 'hide_all'].includes(memorizationMode);
        const currentPage = clampMushafPage(
            mushafPageNumber || selectedSurah.page || getFirstPageNumber(ayahs),
        );
        const fallbackPageAyahs = ayahs.filter((ayah) => Number(ayah.pageNumber) === Number(currentPage));
        const pageAyahs = mushafPageAyahs.length ? mushafPageAyahs : fallbackPageAyahs;

        if (readerLoading || (mushafPageLoading && !pageAyahs.length)) {
            return (
                <View style={styles.mushafPageShell}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            );
        }

        if (!pageAyahs.length) {
            return (
                <EmptyState
                    title="Ayat belum tersedia"
                    description="Data ayat untuk pilihan ini belum tersedia dari server."
                />
            );
        }

        const firstAyah = pageAyahs[0];
        const lastAyah = pageAyahs[pageAyahs.length - 1];
        const rangeLabel = firstAyah && lastAyah
            ? `${firstAyah.surahName || selectedSurah.name} ${firstAyah.number}-${lastAyah.number}`
            : selectedSurah.meaning || "Al-Qur'an";
        const juzLabel = firstAyah?.juzNumber ? `${firstAyah.juzNumber}` : '1';
        const surahLabel = firstAyah?.surahName || selectedSurah.name;
        const surahNumberLabel =
            firstAyah?.surahNumber ?? selectedSurah.number ?? '';
        const showStandaloneBismillah =
            Number(firstAyah?.number) === 1 &&
            Number(firstAyah?.surahNumber ?? selectedSurah.number) !== 1 &&
            Number(firstAyah?.surahNumber ?? selectedSurah.number) !== 9;

        // Decide whether we have per-kata data for ALL ayahs on this page.
        // If yes → render the per-kata layout (matches reference image).
        // If no → fall back to existing row-based mushaf layout.
        const ayahsWithWordCheck = pageAyahs.map((ayah) => {
            const key = `${ayah.surahNumber ?? selectedSurah.number}:${ayah.number}`;
            const words = mushafWordsByAyah[key] || [];
            return { ayah, words };
        });
        const hasPerKataDataForAll =
            ayahsWithWordCheck.length > 0 &&
            ayahsWithWordCheck.every(({ words }) => words.length > 0);

        return (
            <View style={styles.mushafPagesStack}>
                <View key={`mushaf-page-${currentPage}`} style={styles.mushafPageShell}>
                    <View style={styles.mushafFrameOuter}>
                        <View style={styles.mushafFrame}>
                            <View style={styles.mushafFrameTop}>
                                <View style={styles.mushafFrameJuzBadge}>
                                    <Text style={styles.mushafFrameJuzText}>
                                        {`JUZ ${juzLabel}`}
                                    </Text>
                                </View>
                                <View style={styles.mushafFramePageBadge}>
                                    <Text style={styles.mushafFramePageText}>
                                        {currentPage}
                                    </Text>
                                </View>
                                <View style={styles.mushafFrameSurahBadge}>
                                    <Text style={styles.mushafFrameSurahText}>
                                        {`${surahNumberLabel}. ${surahLabel}`.trim()}
                                    </Text>
                                </View>
                            </View>
                            {showStandaloneBismillah ? (
                                <Text style={[styles.mushafBismillah, getArabicTypography(8, 1.65)]}>
                                    {BISMILLAH}
                                </Text>
                            ) : null}
                            {hasPerKataDataForAll ? (
                                <View style={styles.mushafPerKataStack}>
                                    {ayahsWithWordCheck.map(({ ayah, words }) =>
                                        renderMushafPerKataAyah(
                                            ayah,
                                            words,
                                            showMushafArabic,
                                            showMushafTranslation,
                                        ),
                                    )}
                                </View>
                            ) : (
                                <View style={styles.mushafAyahBlockStack}>
                                    {buildMushafLineGroups(pageAyahs).map((group) =>
                                        renderMushafLineBlock(
                                            group,
                                            mushafArabicStyle,
                                            showMushafArabic,
                                            showMushafTranslation,
                                        ),
                                    )}
                                </View>
                            )}
                            {mushafPageLoading ? (
                                <View style={styles.mushafInlineLoading}>
                                    <ActivityIndicator color={colors.primary} size="small" />
                                </View>
                            ) : null}
                            <View style={styles.mushafFrameBottom}>
                                <Text style={styles.mushafRangeMeta}>{rangeLabel}</Text>
                                <View style={styles.mushafFootPageBadge}>
                                    <Text style={styles.mushafFootPageText}>{currentPage}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderAudioRangePanel = () => {
        if (!selectedSurah || selectedSurah.type !== 'surah') return null;
        const activeQari = audioQariOptions.find((item) => item.qari_slug === audioState.qariSlug);
        const isPlaying = audioRange.playing || audioRange.loading;

        return (
            <View style={styles.audioPanel}>
                <View style={styles.audioPanelHeader}>
                    <View style={styles.audioPanelTitleRow}>
                        <Volume2 color={colors.primaryDark} size={18} strokeWidth={2.2} />
                        <View style={styles.audioPanelTitleCopy}>
                            <Text style={styles.audioPanelTitle}>Audio Surat</Text>
                            <Text numberOfLines={1} style={styles.audioPanelMeta}>
                                {activeQari?.qari_name || 'Pilih qari'} · {audioRange.speed}x
                            </Text>
                        </View>
                    </View>
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
                            {audioRange.loading ? 'Memuat' : isPlaying ? 'Stop' : 'Putar range'}
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.audioInputGrid}>
                    <View style={styles.audioInputGroup}>
                        <Text style={styles.audioInputLabel}>Dari surat</Text>
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
                        <Text style={styles.audioInputLabel}>Sampai surat</Text>
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
                        <Text style={styles.audioInputLabel}>Sampai ayat</Text>
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

                <Text style={styles.audioSectionLabel}>Qari</Text>
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
                        <Text style={styles.audioSectionLabel}>Speed</Text>
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
                            Repeat {audioRange.repeat ? 'On' : 'Off'}
                        </Text>
                    </Pressable>
                </View>

                {audioRange.currentLabel ? (
                    <Text style={styles.audioStatusText}>{audioRange.currentLabel}</Text>
                ) : null}
            </View>
        );
    };

    const renderReaderHeader = () => {
        const isSeriousMode = displayMode === 'focus' || displayMode === 'mushaf';
        const selectedSurahNumber = Number(selectedSurah?.number);
        const currentSurahIndex =
            selectedSurah?.type === 'surah'
                ? surahs.findIndex((item) => Number(item.number) === selectedSurahNumber)
                : -1;
        const hasPreviousSurah = currentSurahIndex > 0;
        const hasNextSurah = currentSurahIndex >= 0 && currentSurahIndex < surahs.length - 1;
        const previousSurah = hasPreviousSurah ? surahs[currentSurahIndex - 1] : null;
        const nextSurah = hasNextSurah ? surahs[currentSurahIndex + 1] : null;
        const previewAyah = targetAyah
            ? ayahs.find((ayah) =>
                  (targetAyah.id && Number(targetAyah.id) === Number(ayah.id)) ||
                  (targetAyah.number && Number(targetAyah.number) === Number(ayah.number)),
              )
            : null;

        return (
        <>
            <View style={[styles.readerHeader, isSeriousMode ? styles.readerHeaderSerious : null]}>
                <View style={styles.readerHeaderTop}>
                    <View style={styles.readerHeaderCopy}>
                        <Text style={styles.readerTitle}>{selectedSurah.name}</Text>
                        <Text style={styles.readerSubtitle}>
                            {isSeriousMode
                                ? displayMode === 'mushaf'
                                    ? `Halaman ${mushafPageNumber} · mode mushaf`
                                    : selectedSurah.type === 'surah'
                                    ? `${selectedSurah.ayahs} ayah · mode baca fokus`
                                    : selectedSurah.meaning || 'Mode baca fokus'
                                : selectedSurah.type === 'surah'
                                  ? `${selectedSurah.meaning || "Bacaan Al-Qur'an"} · ${selectedSurah.ayahs} ayah`
                                  : selectedSurah.meaning || "Bacaan Al-Qur'an"}
                        </Text>
                    </View>
                    <View style={styles.readerHeaderActions}>
                        <IconActionButton
                            Icon={ArrowLeft}
                            label="Kembali ke daftar surah"
                            onPress={closeReader}
                        />
                        <IconActionButton
                            Icon={MoreVertical}
                            label="Menu baca"
                            onPress={() => setReaderMenuVisible(true)}
                        />
                    </View>
                </View>
            </View>
            {selectedSurah.type === 'surah' && displayMode !== 'mushaf' ? (
                <View style={styles.surahPagerRow}>
                    <Pressable
                        accessibilityLabel={
                            previousSurah
                                ? `Buka ${previousSurah.name}`
                                : 'Tidak ada surah sebelumnya'
                        }
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                        disabled={!hasPreviousSurah || readerLoading}
                        onPress={() => triggerAdjacentSurah(-1)}
                        style={[
                            styles.surahPagerButton,
                            !hasPreviousSurah || readerLoading ? styles.disabled : null,
                        ]}
                    >
                        <ArrowLeft color={colors.primaryDark} size={16} strokeWidth={2.2} />
                        <Text numberOfLines={2} style={styles.surahPagerButtonText}>
                            {previousSurah ? `${previousSurah.number}. ${previousSurah.name}` : '—'}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityLabel={
                            nextSurah ? `Buka ${nextSurah.name}` : 'Tidak ada surah selanjutnya'
                        }
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                        disabled={!hasNextSurah || readerLoading}
                        onPress={() => triggerAdjacentSurah(1)}
                        style={[
                            styles.surahPagerButton,
                            !hasNextSurah || readerLoading ? styles.disabled : null,
                        ]}
                    >
                        <Text numberOfLines={2} style={styles.surahPagerButtonText}>
                            {nextSurah ? `${nextSurah.number}. ${nextSurah.name}` : '—'}
                        </Text>
                        <ArrowRight color={colors.primaryDark} size={16} strokeWidth={2.2} />
                    </Pressable>
                </View>
            ) : null}
            {selectedSurah.type === 'surah' ? renderAudioRangePanel() : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {previewAyah && !isSeriousMode ? (
                <View style={styles.targetPreview}>
                    <Text style={styles.targetPreviewKicker}>Hasil pencarian</Text>
                    <Text style={styles.targetPreviewTitle}>
                        {selectedSurah.name} · Ayat {previewAyah.number}
                    </Text>
                    <Text style={styles.targetPreviewText}>
                        Ayat sudah ditandai di daftar. Reader akan langsung mengarah ke posisi ayat
                        setelah data siap.
                    </Text>
                    {displayMode === 'mushaf' ? null : (
                        <Pressable
                            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                            onPress={() => {
                                if (targetAyahIndex < 0) return;
                                readerListRef.current?.scrollToIndex?.({
                                    animated: true,
                                    index: targetAyahIndex,
                                    viewPosition: 0.18,
                                });
                            }}
                            style={styles.targetPreviewButton}
                        >
                            <Text style={styles.targetPreviewButtonText}>Lihat posisi dalam surah</Text>
                        </Pressable>
                    )}
                </View>
            ) : null}
        </>
        );
    };

    const renderReaderMenuModal = () => {
        const isSeriousMode = displayMode === 'focus' || displayMode === 'mushaf';
        return (
            <AppActionSheet
                onClose={() => setReaderMenuVisible(false)}
                title="Menu Baca"
                visible={readerMenuVisible}
            >
                <ActionSheetRow
                    Icon={SlidersHorizontal}
                    onPress={() => {
                        setReaderMenuVisible(false);
                        setSettingsVisible(true);
                    }}
                    subtitle="Ubah mode baca, font, dan ukuran arab"
                    title="Pengaturan tampilan"
                />
                {isSeriousMode ? (
                    <ActionSheetRow
                        Icon={BookOpen}
                        onPress={() => {
                            setReaderMenuVisible(false);
                            updateDisplayMode('card');
                        }}
                        subtitle="Kembali ke tampilan card lengkap"
                        title="Keluar mode fokus"
                    />
                ) : null}
                <ActionSheetRow
                    Icon={ArrowLeft}
                    onPress={() => {
                        setReaderMenuVisible(false);
                        closeReader();
                    }}
                    subtitle="Tutup reader dan kembali ke daftar"
                    title="Kembali ke daftar surah"
                />
            </AppActionSheet>
        );
    };

    const renderSettingsModal = () => (
        <AppModalSheet
            maxHeight="65%"
            onClose={() => setSettingsVisible(false)}
            title="Pengaturan Tampilan"
            visible={settingsVisible}
        >
            <Text style={styles.settingLabel}>Ukuran Teks Arab</Text>
            <View style={styles.fontSizeRow}>
                <Pressable
                    disabled={fontSize <= MIN_ARABIC_FONT_SIZE}
                    onPress={() => updateFontSize(fontSize - 2)}
                    style={[
                        styles.fontSizeButton,
                        fontSize <= MIN_ARABIC_FONT_SIZE ? styles.disabled : null,
                    ]}
                >
                    <Minus color={colors.ink} size={16} strokeWidth={2.4} />
                </Pressable>
                <Text style={styles.fontSizeValue}>{fontSize}px</Text>
                <Pressable
                    disabled={fontSize >= MAX_ARABIC_FONT_SIZE}
                    onPress={() => updateFontSize(fontSize + 2)}
                    style={[
                        styles.fontSizeButton,
                        fontSize >= MAX_ARABIC_FONT_SIZE ? styles.disabled : null,
                    ]}
                >
                    <Plus color={colors.ink} size={16} strokeWidth={2.4} />
                </Pressable>
            </View>

            <Text style={styles.settingLabel}>Font Arabic</Text>
            <View style={styles.settingChips}>
                {ARABIC_FONTS.map((font) => (
                    <Pressable
                        key={font.key}
                        onPress={() => updateArabicFont(font.key)}
                        style={[
                            styles.settingChip,
                            arabicFont === font.key ? styles.settingChipActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.settingChipText,
                                font.fontFamily ? { fontFamily: font.fontFamily, fontWeight: '400' } : null,
                                arabicFont === font.key ? styles.settingChipTextActive : null,
                            ]}
                        >
                            {font.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.settingLabel}>Model Tampilan Baca</Text>
            <View style={styles.displayModeStack}>
                {DISPLAY_MODES.map((mode) => (
                    <Pressable
                        key={mode.key}
                        onPress={() => updateDisplayMode(mode.key)}
                        style={[
                            styles.displayModeCard,
                            displayMode === mode.key ? styles.displayModeCardActive : null,
                        ]}
                    >
                        <View style={styles.displayModePreview}>
                            <View style={styles.displayModePreviewTop} />
                            <View
                                style={[
                                    styles.displayModePreviewLine,
                                    mode.key === 'mushaf' ? styles.displayModePreviewLineFull : null,
                                ]}
                            />
                            {mode.key === 'card' || mode.key === 'line' ? (
                                <View style={styles.displayModePreviewSmall} />
                            ) : null}
                        </View>
                        <View style={styles.displayModeCopy}>
                            <Text
                                style={[
                                    styles.displayModeLabel,
                                    displayMode === mode.key ? styles.displayModeLabelActive : null,
                                ]}
                            >
                                {mode.label}
                            </Text>
                            <Text style={styles.displayModeTitle}>{mode.title}</Text>
                            <Text style={styles.displayModeDescription}>{mode.description}</Text>
                        </View>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.settingHint}>
                Mode Fokus menyembunyikan latin/terjemah. Mode Mushaf mengikuti pilihan Mode Hafalan.
            </Text>

            <Text style={styles.settingLabel}>Mode Hafalan</Text>
            <View style={styles.settingChips}>
                {MEMORIZATION_MODES.map((mode) => (
                    <Pressable
                        key={mode.key}
                        onPress={() => updateMemorizationMode(mode.key)}
                        style={[
                            styles.settingChip,
                            memorizationMode === mode.key ? styles.settingChipActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.settingChipText,
                                memorizationMode === mode.key
                                    ? styles.settingChipTextActive
                                    : null,
                            ]}
                        >
                            {mode.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                onPress={() => {
                    setSettingsVisible(false);
                    setTajweedVisible(true);
                }}
                style={styles.tajweedButton}
            >
                <Info color={colors.primary} size={16} strokeWidth={2.2} />
                <Text style={styles.tajweedButtonText}>Panduan Warna Tajwid</Text>
            </Pressable>
        </AppModalSheet>
    );

    const renderReferenceModal = () => {
        const { visible, type, ayah } = referenceModal;
        const key = ayah ? `${type}:${ayah.id}` : null;
        const state = key ? referenceState[key] : null;
        const title = type === 'tafsir' ? 'Tafsir' : 'Asbabun Nuzul';

        const items = state?.items ?? [];
        const kemenag = items.find((i) => i.title === 'Kemenag');
        const ibnuKatsir = items.find((i) => i.title === 'Ibnu Katsir');
        const hasBoth = !!kemenag && !!ibnuKatsir;

        const TAFSIR_MODES = [
            { key: 'all', label: 'Semua' },
            { key: 'side-by-side', label: 'Bandingkan' },
            { key: 'kemenag', label: 'Kemenag' },
            { key: 'mishbah', label: 'Al-Mishbah' },
        ];

        return (
            <AppModalSheet
                onClose={() => setReferenceModal((m) => ({ ...m, visible: false }))}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title={title}
                visible={visible}
            >
                {state?.loading ? (
                    <ActivityIndicator
                        color={colors.primary}
                        style={styles.modalLoader}
                    />
                ) : null}
                {state?.error ? (
                    <Text style={styles.referenceEmpty}>{state.error}</Text>
                ) : null}

                {!state?.loading && !state?.error && type === 'tafsir' && hasBoth && (
                    <View style={styles.tafsirModeRow}>
                        {TAFSIR_MODES.map((mode) => (
                            <Pressable
                                key={mode.key}
                                onPress={() => setTafsirMode(mode.key)}
                                style={[
                                    styles.tafsirModePill,
                                    tafsirMode === mode.key && styles.tafsirModePillActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tafsirModePillText,
                                        tafsirMode === mode.key && styles.tafsirModePillTextActive,
                                    ]}
                                >
                                    {mode.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {!state?.loading && !state?.error && type === 'tafsir' && tafsirMode === 'side-by-side' && hasBoth ? (
                    <View style={styles.sideBySideRow}>
                        <View style={[styles.sideBySideCol, styles.sideBySideColPrimary]}>
                            <Text style={styles.sideBySideColTitle}>Kemenag</Text>
                            <Text style={styles.referenceBody}>{kemenag.body}</Text>
                        </View>
                        <View style={[styles.sideBySideCol, styles.sideBySideColSecondary]}>
                            <Text style={styles.sideBySideColTitle}>Al-Mishbah</Text>
                            <Text style={styles.referenceBody}>{ibnuKatsir.body}</Text>
                        </View>
                    </View>
                ) : (
                    items
                        .filter((item) => {
                            if (type !== 'tafsir' || tafsirMode === 'all') return true;
                            if (tafsirMode === 'kemenag') return item.title === 'Kemenag';
                            if (tafsirMode === 'mishbah') return item.title === 'Ibnu Katsir';
                            return true;
                        })
                        .map((item) => (
                            <View key={item.id} style={styles.referenceItem}>
                                <Text style={styles.referenceTitle}>{item.title}</Text>
                                {item.meta ? (
                                    <Text style={styles.referenceMeta}>{item.meta}</Text>
                                ) : null}
                                <Text style={styles.referenceBody}>{item.body}</Text>
                            </View>
                        ))
                )}
            </AppModalSheet>
        );
    };

    const renderMunasabahModal = () => {
        const { visible, ayah, items, loading, error } = munasabahModal;

        return (
            <AppModalSheet
                onClose={() => setMunasabahModal((m) => ({ ...m, visible: false }))}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title="Ayat Terkait"
                visible={visible}
            >
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.modalLoader} />
                ) : null}
                {error && !loading ? (
                    <Text style={styles.referenceEmpty}>{error}</Text>
                ) : null}
                {items.map((item) => (
                    <Pressable
                        accessibilityLabel="Buka ayat terkait"
                        accessibilityRole="button"
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.08)', borderless: false }}
                        key={item.id}
                        onPress={() => openRelatedAyah(item)}
                        style={styles.referenceItem}
                    >
                        {item.ayahFrom && item.ayahTo ? (
                            <Text style={styles.referenceTitle}>
                                {item.ayahFrom.surahName} · Ayat {item.ayahFrom.number} → {item.ayahTo.surahName} · Ayat {item.ayahTo.number}
                            </Text>
                        ) : item.ayahTo ? (
                            <Text style={styles.referenceTitle}>
                                {item.ayahTo.surahName} · Ayat {item.ayahTo.number}
                            </Text>
                        ) : null}
                        <Text style={styles.referenceBody}>{item.description}</Text>
                        <Text style={styles.referenceMeta}>Ketuk untuk membuka ayat.</Text>
                    </Pressable>
                ))}
            </AppModalSheet>
        );
    };

    const renderHadithAyahModal = () => {
        const { visible, ayah, items, loading, error } = hadithAyahModal;

        return (
            <AppModalSheet
                onClose={() => setHadithAyahModal((m) => ({ ...m, visible: false }))}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title="Hadis Terkait"
                visible={visible}
            >
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.modalLoader} />
                ) : null}
                {error && !loading ? (
                    <Text style={styles.referenceEmpty}>{error}</Text>
                ) : null}
                {items.map((item) => (
                    <Pressable
                        accessibilityLabel="Buka hadis terkait"
                        accessibilityRole="button"
                        android_ripple={{ color: 'rgba(91, 110, 91, 0.08)', borderless: false }}
                        disabled={!item.hadith?.id}
                        key={item.id}
                        onPress={() => openRelatedHadith(item)}
                        style={styles.referenceItem}
                    >
                        {item.hadith ? (
                            <Text style={styles.referenceTitle}>
                                {item.hadith.book || 'Hadis'} · {item.hadith.number || ''}
                            </Text>
                        ) : null}
                        <Text style={styles.referenceBody}>
                            {item.hadith?.translation || item.catatan || ''}
                        </Text>
                        {item.catatan ? (
                            <Text style={styles.referenceMeta}>{item.catatan}</Text>
                        ) : null}
                        {item.hadith?.id ? (
                            <Text style={styles.referenceMeta}>Ketuk untuk membuka detail hadis.</Text>
                        ) : null}
                    </Pressable>
                ))}
            </AppModalSheet>
        );
    };

    const renderAyahDetailScreen = () => {
        if (!selectedDetailAyah) return null;

        const isAudioLoading = audioState.loadingAyahId === selectedDetailAyah.id;
        const isAudioPlaying = audioState.playingAyahId === selectedDetailAyah.id;
        const isBookmarked = Boolean(bookmarks[selectedDetailAyah.id]);
        const noteOpen = activeNoteAyah === selectedDetailAyah.id;

        return (
            <>
                {renderSettingsModal()}
                {renderReaderMenuModal()}
                {renderReferenceModal()}
                {renderAyahActionSheet()}
                {renderTajweedModal()}
                {renderMunasabahModal()}
                {renderHadithAyahModal()}
                <Screen
                    actions={(
                        <IconActionButton
                            Icon={ArrowLeft}
                            label="Kembali"
                            onPress={closeAyahDetail}
                        />
                    )}
                    contentStyle={isWebAppLayout ? styles.webAppQuranDetailSurface : null}
                    subtitle={`${selectedSurah?.name ?? "Al-Qur'an"} · Ayat ${selectedDetailAyah.number}`}
                    title="Detail Ayat"
                >
                    <View testID={isWebAppLayout ? 'quran-web-app-detail' : 'quran-classic-detail'} />
                    <Card style={styles.quranDetailCard}>
                        <Text style={styles.quranDetailKicker}>
                            {selectedSurah?.name ?? "Al-Qur'an"} · Ayat {selectedDetailAyah.number}
                        </Text>
                        {(selectedDetailAyah.arabic || selectedDetailAyah.arabicHtml) ? (
                            renderArabicContent(
                                selectedDetailAyah,
                                [styles.quranDetailArabic, getArabicTypography(2, 1.85)],
                                'detail-ayah',
                            )
                        ) : null}
                        {selectedDetailAyah.latin ? (
                            <Text style={styles.quranDetailLatin}>{selectedDetailAyah.latin}</Text>
                        ) : null}
                        {selectedDetailAyah.translation ? (
                            <View style={styles.quranDetailTranslationBox}>
                                <Text style={styles.quranDetailTranslation}>{selectedDetailAyah.translation}</Text>
                            </View>
                        ) : null}
                        {audioState.activeAyahId === selectedDetailAyah.id ? renderAudioSources(selectedDetailAyah) : null}
                    </Card>

                    <View style={styles.quranDetailActions}>
                        <ActionPill
                            Icon={isAudioPlaying ? Pause : Volume2}
                            active={isAudioPlaying}
                            disabled={isAudioLoading}
                            label={isAudioLoading ? 'Memuat audio' : isAudioPlaying ? 'Jeda audio' : 'Putar audio'}
                            onPress={() => playAyahAudio(selectedDetailAyah)}
                        />
                        <ActionPill
                            Icon={BookOpen}
                            label="Tafsir"
                            onPress={() => openReferenceModal(selectedDetailAyah, 'tafsir')}
                        />
                        <ActionPill
                            Icon={BookOpen}
                            label="Asbabun"
                            onPress={() => openReferenceModal(selectedDetailAyah, 'asbab')}
                        />
                        <ActionPill
                            Icon={Link}
                            label="Ayat Terkait"
                            onPress={() => openMunasabahModal(selectedDetailAyah)}
                        />
                        <ActionPill
                            Icon={BookOpen}
                            label="Hadis Terkait"
                            onPress={() => openHadithAyahModal(selectedDetailAyah)}
                        />
                        {user ? (
                            <>
                                <ActionPill
                                    Icon={isBookmarked ? BookmarkCheck : Bookmark}
                                    active={isBookmarked}
                                    disabled={savingAyah === `bookmark:${selectedDetailAyah.id}`}
                                    label={isBookmarked ? 'Hapus bookmark' : 'Bookmark'}
                                    onPress={() => toggleAyahBookmark(selectedDetailAyah)}
                                />
                                <ActionPill
                                    Icon={StickyNote}
                                    active={noteOpen}
                                    label="Catatan"
                                    onPress={() => setActiveNoteAyah(noteOpen ? null : selectedDetailAyah.id)}
                                />
                            </>
                        ) : null}
                    </View>

                    {noteOpen ? (
                        <Card style={styles.quranDetailNoteCard}>
                            <CardTitle meta="Pribadi">Catatan</CardTitle>
                            <NotesPanel refType="ayah" refId={selectedDetailAyah.id} />
                        </Card>
                    ) : null}
                </Screen>
            </>
        );
    };

    const renderAyahActionSheet = () => {
        const { visible, ayah } = ayahActionSheet;
        if (!ayah) return null;

        const isAudioLoading = audioState.loadingAyahId === ayah.id;
        const isAudioPlaying = audioState.playingAyahId === ayah.id;
        const isBookmarked = Boolean(bookmarks[ayah.id]);

        return (
            <AppActionSheet
                onClose={() => setAyahActionSheet({ visible: false, ayah: null })}
                subtitle={`${selectedSurah?.name} · Ayat ${ayah.number}`}
                title="Aksi Cepat"
                visible={visible}
            >
                <ActionSheetRow
                    Icon={BookOpen}
                    onPress={() => openAyahDetail(ayah)}
                    subtitle="Baca ayat, terjemahan, tafsir, dan catatan lebih luas"
                    title="Buka Detail"
                />
                <ActionSheetRow
                    Icon={isAudioPlaying ? Pause : Volume2}
                    active={isAudioPlaying}
                    disabled={isAudioLoading}
                    onPress={() => {
                        setAyahActionSheet({ visible: false, ayah: null });
                        playAyahAudio(ayah);
                    }}
                    subtitle="Murottal ayat ini"
                    title={isAudioLoading ? 'Memuat audio' : isAudioPlaying ? 'Jeda audio' : 'Putar audio'}
                />
                <ActionSheetRow
                    Icon={BookOpen}
                    onPress={() => {
                        setAyahActionSheet({ visible: false, ayah: null });
                        openReferenceModal(ayah, 'tafsir');
                    }}
                    subtitle="Buka penjelasan ayat"
                    title="Tafsir"
                />
                <ActionSheetRow
                    Icon={BookOpen}
                    onPress={() => {
                        setAyahActionSheet({ visible: false, ayah: null });
                        openReferenceModal(ayah, 'asbab');
                    }}
                    subtitle="Riwayat sebab turun jika tersedia"
                    title="Asbabun Nuzul"
                />
                {user ? (
                    <>
                        <ActionSheetRow
                            Icon={Save}
                            disabled={savingAyah === `progress:${ayah.id}`}
                            onPress={() => {
                                setAyahActionSheet({ visible: false, ayah: null });
                                markAyahProgress(ayah);
                            }}
                            subtitle="Jadikan ayat ini posisi terakhir baca"
                            title={savingAyah === `progress:${ayah.id}` ? 'Menyimpan progres' : 'Simpan progres'}
                        />
                        <ActionSheetRow
                            Icon={isBookmarked ? BookmarkCheck : Bookmark}
                            active={isBookmarked}
                            disabled={savingAyah === `bookmark:${ayah.id}`}
                            onPress={() => {
                                setAyahActionSheet({ visible: false, ayah: null });
                                toggleAyahBookmark(ayah);
                            }}
                            subtitle="Simpan ayat ke koleksi pribadi"
                            title={
                                savingAyah === `bookmark:${ayah.id}`
                                    ? 'Menyimpan bookmark'
                                    : isBookmarked
                                      ? 'Hapus bookmark'
                                      : 'Bookmark'
                            }
                        />
                        <ActionSheetRow
                            Icon={StickyNote}
                            active={activeNoteAyah === ayah.id}
                            onPress={() => {
                                setAyahActionSheet({ visible: false, ayah: null });
                                setActiveNoteAyah(activeNoteAyah === ayah.id ? null : ayah.id);
                            }}
                            subtitle="Tulis catatan pribadi untuk ayat ini"
                            title="Catatan"
                        />
                    </>
                ) : (
                    <Text style={styles.actionSheetNotice}>
                        Masuk dari Profil untuk menyimpan progres, bookmark, dan catatan.
                    </Text>
                )}
            </AppActionSheet>
        );
    };

    const renderAyahNotesModal = () => {
        const ayah = activeNoteAyah
            ? [...ayahs, ...mushafPageAyahs].find((item) => item.id === activeNoteAyah)
            : null;
        return (
            <AppModalSheet
                onClose={() => setActiveNoteAyah(null)}
                scroll={false}
                subtitle={ayah ? `${selectedSurah?.name} · Ayat ${ayah.number}` : ''}
                title="Catatan Ayat"
                visible={Boolean(activeNoteAyah)}
            >
                {activeNoteAyah ? <NotesPanel refType="ayah" refId={activeNoteAyah} /> : null}
            </AppModalSheet>
        );
    };

    const renderTajweedModal = () => (
        <AppModalSheet
            onClose={() => setTajweedVisible(false)}
            title="Panduan Warna Tajwid"
            visible={tajweedVisible}
        >
            <Text style={styles.tajweedIntro}>
                Setiap hukum tajwid ditandai dengan warna berbeda. Ketuk grup untuk melihat
                sub-aturan dan contoh bacaannya.
            </Text>
            {TAJWEED_GROUPS.map((group) => (
                <View key={group.key} style={styles.tajweedGroup}>
                    <View style={styles.tajweedGroupHeader}>
                        <View
                            style={[
                                styles.tajweedDot,
                                { backgroundColor: group.color },
                            ]}
                        />
                        <Text style={styles.tajweedGroupTitle}>{group.title}</Text>
                    </View>
                    <Text style={styles.tajweedGroupDesc}>{group.description}</Text>
                    {group.rules.map((rule) => (
                        <View key={rule.key} style={styles.tajweedRule}>
                            <View style={styles.tajweedRuleLeft}>
                                <View
                                    style={[
                                        styles.tajweedRuleDot,
                                        { backgroundColor: rule.color },
                                    ]}
                                />
                                <View style={styles.tajweedRuleInfo}>
                                    <Text style={styles.tajweedRuleTitle}>{rule.title}</Text>
                                    <Text style={styles.tajweedRuleDesc}>
                                        {rule.description}
                                    </Text>
                                </View>
                            </View>
                            {rule.example ? (
                                <Text style={styles.tajweedRuleExample}>
                                    {rule.example}
                                </Text>
                            ) : null}
                        </View>
                    ))}
                </View>
            ))}
        </AppModalSheet>
    );

    const renderSurahRow = ({ item: surah }) => {
        const isProgressSurah = progressSurahNumber === Number(surah.number);
        if (isWebAppLayout) {
            return (
                <Pressable onPress={() => openSurah(surah)} style={styles.webAppSurahRow}>
                    <View style={styles.webAppSurahLeft}>
                        <View style={styles.webAppSurahNumberBadge}>
                            <Text style={styles.webAppSurahNumberText}>{surah.number}</Text>
                        </View>
                        <View style={styles.webAppSurahInfo}>
                            <View style={styles.surahNameRow}>
                                <Text style={styles.webAppSurahName}>{surah.name}</Text>
                                {isProgressSurah ? (
                                    <CheckCircle2
                                        color={WEB_APP_QURAN_ACCENT}
                                        size={13}
                                        strokeWidth={2.2}
                                    />
                                ) : null}
                            </View>
                            <Text style={styles.webAppSurahMeta}>
                                · {surah.meaning} · {surah.ayahs} ayat
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.webAppSurahArabic}>
                        {getCompactArabicSurahName(surah.arabic)}
                    </Text>
                </Pressable>
            );
        }

        return (
            <Pressable onPress={() => openSurah(surah)} style={styles.surahRow}>
                <View style={styles.surahLeft}>
                    <View style={styles.surahNumberWrap}>
                        <View style={styles.surahNumberDiamond}>
                            <Text style={styles.surahNumberText}>{surah.number}</Text>
                        </View>
                    </View>
                    <View style={styles.surahInfo}>
                        <View style={styles.surahNameRow}>
                            <Text style={styles.surahName}>{surah.name}</Text>
                            {isProgressSurah ? (
                                <CheckCircle2
                                    color={colors.primary}
                                    size={13}
                                    strokeWidth={2.2}
                                />
                            ) : null}
                        </View>
                        <Text style={styles.surahMeta}>
                            {surah.meaning} · {surah.ayahs} ayah
                        </Text>
                    </View>
                </View>
                <Text style={styles.surahArabic}>{surah.arabic}</Text>
            </Pressable>
        );
    };

    const renderWebAppQuranListHeader = () => (
        <View style={styles.webAppQuranHeader}>
            <Text style={styles.webAppQuranArabicTitle}>القُرآنُ الكَرِيم</Text>
            <Text style={styles.webAppQuranTitle}>Al-Quran</Text>
            <Text style={styles.webAppQuranSubtitle}>
                114 Surah · Lengkap dengan Tajweed berwarna, transliterasi, dan terjemahan
            </Text>
            <View style={styles.webAppQuranSearch}>
                <Search color={WEB_APP_QURAN_MUTED} size={16} strokeWidth={2.1} />
                <TextInput
                    onChangeText={setSurahQuery}
                    placeholder="Cari surah..."
                    placeholderTextColor={WEB_APP_QURAN_MUTED}
                    style={styles.webAppQuranSearchInput}
                    value={surahQuery}
                />
            </View>
            <Pressable
                onPress={() => openPage(pageInput)}
                style={styles.webAppMushafCta}
                testID="quran-web-app-mushaf-cta"
            >
                <View style={styles.webAppMushafCtaIcon}>
                    <BookOpen color={WEB_APP_QURAN_ACCENT} size={22} strokeWidth={2.4} />
                </View>
                <View style={styles.webAppMushafCtaCopy}>
                    <Text style={styles.webAppMushafCtaTitle}>Navigasi Mushaf</Text>
                    <Text style={styles.webAppMushafCtaSubtitle}>
                        Buka ayat berdasarkan halaman mushaf atau hizb.
                    </Text>
                </View>
                <ArrowRight color={WEB_APP_QURAN_ACCENT} size={16} strokeWidth={2.4} />
            </Pressable>
        </View>
    );

    const renderQuranListHeader = () => {
        if (isWebAppLayout) return renderWebAppQuranListHeader();

        return (
            <>
                <Text style={styles.quranTitle}>Al-Qur'an</Text>
                <View style={styles.quranSearch}>
                    <Search color={colors.muted} size={16} strokeWidth={2.1} />
                    <TextInput
                        onChangeText={setSurahQuery}
                        placeholder="Cari..."
                        placeholderTextColor={colors.muted}
                        style={styles.quranSearchInput}
                        value={surahQuery}
                    />
                </View>
                <View style={styles.quranTabs}>
                    {QURAN_TABS.map((tab) => (
                        <Pressable
                            key={tab.key}
                            onPress={() => setQuranTab(tab.key)}
                            style={[
                                styles.quranTabButton,
                                quranTab === tab.key ? styles.quranTabButtonActive : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.quranTabText,
                                    quranTab === tab.key ? styles.quranTabTextActive : null,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </>
        );
    };

    const renderNavigatorPanel = () => (
        <Card>
            <CardTitle>Navigasi</CardTitle>
            <View style={styles.navigatorTabs}>
                {['page', 'hizb'].map((mode) => (
                    <Pressable
                        key={mode}
                        onPress={() => setNavigatorMode(mode)}
                        style={[
                            styles.navigatorTab,
                            navigatorMode === mode ? styles.navigatorTabActive : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.navigatorTabText,
                                navigatorMode === mode ? styles.navigatorTabTextActive : null,
                            ]}
                        >
                            {mode === 'page' ? 'Halaman' : 'Hizb'}
                        </Text>
                    </Pressable>
                ))}
            </View>
            {navigatorMode === 'hizb' ? (
                <View style={styles.inputRow}>
                    <TextInput
                        keyboardType="number-pad"
                        onChangeText={setHizbInput}
                        placeholder="1-240"
                        placeholderTextColor={colors.muted}
                        style={styles.numberInput}
                        value={hizbInput}
                    />
                    <Pressable onPress={() => openHizb()} style={styles.compactPrimaryButton}>
                        <Text style={styles.primaryButtonText}>Buka Hizb</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.inputRow}>
                    <TextInput
                        keyboardType="number-pad"
                        onChangeText={setPageInput}
                        placeholder="1-604"
                        placeholderTextColor={colors.muted}
                        style={styles.numberInput}
                        value={pageInput}
                    />
                    <Pressable onPress={() => openPage()} style={styles.compactPrimaryButton}>
                        <Text style={styles.primaryButtonText}>Buka Halaman</Text>
                    </Pressable>
                </View>
            )}
        </Card>
    );

    const renderQuranListFooter = () => {
        if (quranTab === 'surah') {
            if (isWebAppLayout) {
                return message ? <Text style={styles.webAppMessage}>{message}</Text> : null;
            }

            return (
                <>
                    {renderNavigatorPanel()}
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                </>
            );
        }

        if (quranTab === 'hafalan') {
            if (!user) {
                return (
                    <Card>
                        <CardTitle>Hafalan</CardTitle>
                        <Text style={styles.modePanelText}>
                            Buka Profil untuk masuk dan melacak progress hafalan.
                        </Text>
                    </Card>
                );
            }

            const statusLabel = { not_started: 'Belum', in_progress: 'Sedang', memorized: 'Hafal' };
            const statusStyle = {
                not_started: null,
                in_progress: styles.statusInProgress,
                memorized: styles.statusMemorized,
            };

            return (
                <>
                    <Card>
                        <CardTitle>Hafalan</CardTitle>
                        {hafalanSummary ? (
                            <View style={styles.hafalanSummary}>
                                <View style={styles.hafalanStat}>
                                    <Text style={styles.hafalanStatValue}>
                                        {hafalanSummary.memorized ?? 0}
                                    </Text>
                                    <Text style={styles.hafalanStatLabel}>Hafal</Text>
                                </View>
                                <View style={styles.hafalanStat}>
                                    <Text style={styles.hafalanStatValue}>
                                        {hafalanSummary.in_progress ?? 0}
                                    </Text>
                                    <Text style={styles.hafalanStatLabel}>Sedang</Text>
                                </View>
                                <View style={styles.hafalanStat}>
                                    <Text style={styles.hafalanStatValue}>
                                        {hafalanSummary.not_started ??
                                            hafalanSummary.not_memorized ??
                                            0}
                                    </Text>
                                    <Text style={styles.hafalanStatLabel}>Belum</Text>
                                </View>
                            </View>
                        ) : null}
                        <Text style={styles.modePanelText}>
                            Ketuk status di bawah untuk mengubah: Belum → Sedang → Hafal.
                        </Text>
                        {hafalanLoading ? (
                            <ActivityIndicator color={colors.primary} style={styles.loader} />
                        ) : null}
                        {!hafalanLoading && surahs.length === 0 ? (
                            <Text style={styles.modePanelMeta}>Daftar surah belum dimuat.</Text>
                        ) : null}
                    </Card>
                    {surahs.map((surah) => {
                        const entry = hafalanList.find(
                            (item) => Number(item.surah_id) === Number(surah.number),
                        );
                        const status = entry?.status ?? 'not_started';
                        return (
                            <Pressable
                                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                                key={`hafalan-${surah.number}`}
                                onPress={() => cycleHafalanStatus(surah)}
                                style={styles.hafalanRow}
                            >
                                <View style={styles.surahNumberWrap}>
                                    <View style={styles.surahNumberDiamond}>
                                        <Text style={styles.surahNumberText}>{surah.number}</Text>
                                    </View>
                                </View>
                                <View style={styles.hafalanInfo}>
                                    <Text style={styles.surahName}>{surah.name}</Text>
                                    <Text style={styles.surahMeta}>{surah.ayahs} ayah</Text>
                                </View>
                                <View style={[styles.statusBadge, statusStyle[status]]}>
                                    <Text
                                        style={[
                                            styles.statusText,
                                            statusStyle[status] ? styles.statusTextColored : null,
                                        ]}
                                    >
                                        {statusLabel[status] ?? 'Belum'}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </>
            );
        }

        if (!user) {
            return (
                <Card>
                    <CardTitle>Murojaah</CardTitle>
                    <Text style={styles.modePanelText}>
                        Buka Profil untuk masuk dan mencatat sesi murojaah.
                    </Text>
                </Card>
            );
        }

        const memorizedSurahs = surahs.filter((surah) => {
            const entry = hafalanList.find(
                (item) => Number(item.surah_id) === Number(surah.number),
            );
            return entry?.status === 'memorized';
        });

        return (
            <>
                <Card>
                    <CardTitle>Murojaah</CardTitle>
                    <Text style={styles.modePanelText}>
                        Pilih surah yang sudah hafal, lalu catat sesi murojaah dengan skor dan
                        catatan.
                    </Text>
                    {murojaahLoading ? (
                        <ActivityIndicator color={colors.primary} style={styles.loader} />
                    ) : null}
                    {!murojaahLoading && memorizedSurahs.length === 0 ? (
                        <Text style={styles.modePanelMeta}>
                            Belum ada surah yang ditandai Hafal. Tandai status di tab Hafalan
                            terlebih dahulu.
                        </Text>
                    ) : null}
                    {memorizedSurahs.length > 0 ? (
                        <>
                            <Text style={styles.modePanelMeta}>Pilih surah untuk dimurojaah:</Text>
                            <View style={styles.murojaahSurahGrid}>
                                {memorizedSurahs.map((surah) => (
                                    <Pressable
                                        android_ripple={{
                                            color: 'rgba(91, 110, 91, 0.12)',
                                            borderless: false,
                                        }}
                                        key={`murojaah-pick-${surah.number}`}
                                        onPress={() =>
                                            setMurojaahForm((prev) => ({
                                                ...prev,
                                                surahId: surah.number,
                                            }))
                                        }
                                        style={[
                                            styles.murojaahChip,
                                            murojaahForm.surahId === surah.number
                                                ? styles.murojaahChipActive
                                                : null,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.murojaahChipText,
                                                murojaahForm.surahId === surah.number
                                                    ? styles.murojaahChipTextActive
                                                    : null,
                                            ]}
                                        >
                                            {surah.number}. {surah.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <Text style={[styles.modePanelMeta, styles.labelGap]}>Skor (0–100):</Text>
                            <View style={styles.scoreRow}>
                                {[60, 70, 80, 90, 100].map((score) => (
                                    <Pressable
                                        android_ripple={{
                                            color: 'rgba(91, 110, 91, 0.12)',
                                            borderless: false,
                                        }}
                                        key={`score-${score}`}
                                        onPress={() =>
                                            setMurojaahForm((prev) => ({ ...prev, score }))
                                        }
                                        style={[
                                            styles.murojaahChip,
                                            murojaahForm.score === score
                                                ? styles.murojaahChipActive
                                                : null,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.murojaahChipText,
                                                murojaahForm.score === score
                                                    ? styles.murojaahChipTextActive
                                                    : null,
                                            ]}
                                        >
                                            {score}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <Text style={[styles.modePanelMeta, styles.labelGap]}>
                                Catatan (opsional):
                            </Text>
                            <TextInput
                                multiline
                                onChangeText={(note) =>
                                    setMurojaahForm((prev) => ({ ...prev, note }))
                                }
                                placeholder="Bagian yang perlu diperkuat, dll."
                                placeholderTextColor={colors.muted}
                                style={styles.murojaahNoteInput}
                                value={murojaahForm.note}
                            />
                            <Pressable
                                android_ripple={{
                                    color: 'rgba(255, 255, 255, 0.12)',
                                    borderless: false,
                                }}
                                disabled={savingMurojaah || !murojaahForm.surahId}
                                onPress={submitMurojaah}
                                style={[
                                    styles.modePanelAction,
                                    savingMurojaah || !murojaahForm.surahId
                                        ? styles.disabled
                                        : null,
                                ]}
                            >
                                {savingMurojaah ? (
                                    <ActivityIndicator color={colors.onPrimary} size="small" />
                                ) : (
                                    <Text style={styles.modePanelActionText}>
                                        Simpan Sesi Murojaah
                                    </Text>
                                )}
                            </Pressable>
                        </>
                    ) : null}
                    {murojaahMessage ? (
                        <Text style={styles.message}>{murojaahMessage}</Text>
                    ) : null}
                </Card>
            </>
        );
    };

    return {
        closeAyahDetail,
        openAyahDetail,
        renderAyahActionSheet,
        renderAyahCard,
        renderAyahDetailScreen,
        renderAyahNotesModal,
        renderHadithAyahModal,
        renderMunasabahModal,
        renderMushafPage,
        renderQuranListFooter,
        renderQuranListHeader,
        renderReaderFooter,
        renderReaderHeader,
        renderReaderMenuModal,
        renderReferenceModal,
        renderSettingsModal,
        renderSurahRow,
        renderTajweedModal,
    };
}
