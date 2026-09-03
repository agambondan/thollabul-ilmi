import {
    ArrowLeft,
    BookOpen,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    Circle,
    ExternalLink,
    EyeOff,
    Flag,
    Heart,
    MessageCircle,
    Pencil,
    StickyNote,
    Trash2,
} from "lucide-react-native";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    AppActionSheet,
    ActionSheetRow,
} from "../../components/AppActionSheet";
import { Card, CardTitle } from "../../components/Card";
import { ContentCard } from "../../components/ContentCard";
import { NotesPanel } from "../../components/NotesPanel";
import { NotificationCenter } from "../../components/NotificationCenter";
import {
    ActionPill,
    IconActionButton,
    PaperSearchInput,
} from "../../components/Paper";
import { Screen } from "../../components/Screen";
import { colors, radius, spacing } from "../../theme";
import {
    deleteFaraidh,
    deleteKalkulasiZakat,
    getFaraidhHistory,
    saveFaraidh,
    saveKalkulasiZakat,
    saveLibraryProgress,
} from "../../api/personal";
import {
    acceptForumAnswer,
    createForumAnswer,
    createForumQuestion,
    getForumQuestion,
    getForumQuestions,
    voteForum,
} from "../../api/forum";
import { setAsmaulWiridCount } from "../../storage/asmaulWirid";
import {
    deleteCalculatorHistory,
    mergeCalculatorHistory,
    readCalculatorHistory,
    saveCalculatorHistory,
} from "../../storage/calculatorHistory";
import { calculateFaraidh, HEIR_LABELS } from "../../lib/faraidh";
import { hapticMedium, hapticTap } from "../../utils/haptics";
import { HistoricalMapContent } from "../HistoricalMapScreen";
import { styles } from "../ExploreScreen.styles";
import { TokohTarikhContent } from "../TokohTarikhContent";
import {
    LIBRARY_PROGRESS_STATUSES,
    PRAYER_ITEMS,
    TAFSIR_MODES,
    TAFSIR_SOURCE_LABELS,
    digitsOnly,
    emptyUserWirdForm,
    formatCurrency,
    formatNoteDate,
    formatNumericInput,
    getExploreItemKey,
    getFeedReference,
    getItemRef,
    getLibraryProgressLabel,
    normalizeSearchText,
    parseNumericInput,
    pickText,
    quizOptions,
    refKey,
    stripHtmlText,
} from "../ExploreScreen.helpers";
import {
    ClassicZakatHistoryItem,
    WebAppZakatHistoryRoute,
} from "./WebAppZakatHistoryRoute";

export function createExploreClassicRenderers(context) {
    const {
        activeFeature,
        activeNoteRef,
        answers,
        asmaulCounts,
        asmaulFlashcardRevealed,
        asmaulIndex,
        asmaulLoading,
        asmaulNames,
        bookmarks,
        commentDraft,
        commentLoading,
        commentSaving,
        dictionaryInputRef,
        dictionaryQuery,
        editingUserWirdId,
        error,
        faraidh,
        faraidhCatatan,
        faraidhHistory,
        featureReturnRoute,
        feedComments,
        fillUserWirdForm,
        focusDictionaryInput,
        forumAnswerDraft,
        forumAnswers,
        forumAskBody,
        forumAskTags,
        forumAskTitle,
        forumDetail,
        forumError,
        forumHasMore,
        forumLoading,
        forumPage,
        forumQuestions,
        forumSaving,
        forumSearch,
        forumSlug,
        forumTotal,
        forumView,
        forumVotingId,
        handleHideFeedItem,
        handleLikeFeedItem,
        handleReportFeedItem,
        handleTogglePinnedFeature,
        isWebAppLayout,
        items,
        itemActionSheet,
        libraryProgress,
        libraryProgressDraft,
        libraryProgressFilter,
        libraryProgressMap,
        libraryProgressMessage,
        libraryProgressSaving,
        likingFeedId,
        loadFeature,
        loadSurahContent,
        loadMoreFeature,
        loadZakatHistory,
        loading,
        navigation,
        onOpenTab,
        openItemDetail,
        openSource,
        pagination,
        pinnedFeatureKeys,
        recentFeatureKeys,
        removeUserWird,
        resetUserWirdForm,
        runDictionarySearch,
        savingBookmark,
        savingFaraidh,
        savingUserWird,
        scoreQuiz,
        setBlogCategoryOptions,
        setError,
        setFaraidhHistory,
        setFeedComments,
        setForumAnswers,
        setForumDetail,
        setForumError,
        setForumHasMore,
        setForumLoading,
        setForumPage,
        setForumQuestions,
        setForumSaving,
        setForumSlug,
        setForumTotal,
        setForumVotingId,
        setItems,
        setLibraryProgress,
        setLibraryProgressMap,
        setLibraryProgressSaving,
        setNotesSearch,
        setSavingFaraidh,
        setZakatHistory,
        setZakatSavedMsg,
        setZakatSaving,
        showError,
        showInfo,
        showSuccess,
        submitUserWird,
        selectedItem,
        selectedSurahNumber,
        session,
        setActiveFeature,
        setActiveNoteRef,
        setAnswers,
        setAsmaulCounts,
        setAsmaulFlashcardRevealed,
        setAsmaulIndex,
        setCommentDraft,
        setDictionaryQuery,
        setFaraidh,
        setFaraidhCatatan,
        setFeatureReturnRoute,
        setForumAnswerDraft,
        setForumAskBody,
        setForumAskTags,
        setForumAskTitle,
        setForumSearch,
        setForumView,
        setItemActionSheet,
        setLibraryProgressDraft,
        setLibraryProgressFilter,
        setLibraryProgressMessage,
        setSelectedItem,
        setSelectedSurahNumber,
        setShowFaraidhHistory,
        setSholatLog,
        setSurahSearch,
        setTasbih,
        setTafsirMode,
        setUserWirdForm,
        setZakat,
        setZakatFamilyCount,
        setZakatGoldGrams,
        setZakatGoldHaul,
        setZakatGoldPrice,
        setZakatHarvestIrrigated,
        setZakatHarvestWeight,
        setZakatHaul,
        setZakatMonthlyIncome,
        setZakatRiceKgPrice,
        setZakatRicePrice,
        setZakatSilverGrams,
        setZakatSilverPrice,
        setZakatTab,
        setZakatTradeCapital,
        setZakatTradeDebt,
        setZakatTradeHaul,
        setZakatTradeReceivable,
        setZakatTradeStock,
        sholatLog,
        showFaraidhHistory,
        submitFeedComment,
        surahSearch,
        surahs,
        tafsirMode,
        tasbih,
        toggleBookmark,
        togglePrayer,
        userWirdForm,
        visibleItems,
        visibleSurahOptions,
        zakat,
        zakatFamilyCount,
        zakatGoldGrams,
        zakatGoldHaul,
        zakatGoldPrice,
        zakatHarvestIrrigated,
        zakatHarvestWeight,
        zakatHaul,
        zakatHistory,
        zakatMonthlyIncome,
        zakatRiceKgPrice,
        zakatRicePrice,
        zakatSavedMsg,
        zakatSaving,
        zakatSilverGrams,
        zakatSilverPrice,
        zakatTab,
        zakatTradeCapital,
        zakatTradeDebt,
        zakatTradeHaul,
        zakatTradeReceivable,
        zakatTradeStock,
        zakatTimerRef,
    } = context;

    const renderCurrencyInput = ({
        label,
        value,
        onChangeText,
        placeholder,
    }) => (
        <View style={styles.currencyField}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.currencyInputShell}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                    keyboardType='numeric'
                    onChangeText={(nextValue) =>
                        onChangeText(digitsOnly(nextValue))
                    }
                    placeholder={placeholder}
                    placeholderTextColor={colors.muted}
                    returnKeyType='done'
                    style={styles.currencyInput}
                    value={formatNumericInput(value)}
                />
            </View>
        </View>
    );

    const renderUserWirdField = ({
        field,
        label,
        multiline = false,
        placeholder,
    }) => (
        <View style={styles.wirdField}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                multiline={multiline}
                onChangeText={(value) =>
                    setUserWirdForm((current) => ({
                        ...current,
                        [field]: value,
                    }))
                }
                placeholder={placeholder}
                placeholderTextColor={colors.muted}
                style={[
                    styles.input,
                    multiline && styles.textArea,
                    field === "arabic" && styles.arabicInput,
                ]}
                value={userWirdForm[field]}
            />
        </View>
    );

    const getQuizChoices = (item) => {
        const raw = item?.raw ?? {};
        let options = [];

        if (Array.isArray(raw.options)) {
            options = raw.options;
        } else if (typeof raw.options === "string") {
            try {
                const parsed = JSON.parse(raw.options);
                if (Array.isArray(parsed)) options = parsed;
            } catch {
                options = [];
            }
        }

        if (!options.length) {
            options = [
                raw.option_a,
                raw.option_b,
                raw.option_c,
                raw.option_d,
            ].filter(Boolean);
        }

        if (!options.length) {
            return quizOptions.map((key) => ({ key, label: key }));
        }

        return options.slice(0, 4).map((label, index) => ({
            key: quizOptions[index] ?? `${index + 1}`,
            label: `${label}`,
        }));
    };

    const renderItem = (item, index) => {
        const bookId = item?.raw?.id ?? item?.id;
        const libraryProgressEntry =
            activeFeature?.key === "library" && bookId
                ? libraryProgressMap[String(bookId)]
                : null;

        if (activeFeature?.type === "surah-content") {
            return (
                <ContentCard
                    key={`${item.id}-${index}`}
                    meta={item.meta || activeFeature?.title}
                    onPress={() => openItemDetail(item)}
                    onMenuPress={() =>
                        setItemActionSheet({ visible: true, item })
                    }
                    style={styles.tafsirCard}
                    title={item.title}
                    titleStyle={styles.itemTitle}
                >
                    {item.arabic ? (
                        <Text numberOfLines={3} style={styles.tafsirArabic}>
                            {item.arabic}
                        </Text>
                    ) : null}
                    {item.body ? (
                        <View style={styles.tafsirTranslationBox}>
                            <Text
                                numberOfLines={3}
                                style={styles.tafsirTranslation}
                            >
                                {item.body}
                            </Text>
                        </View>
                    ) : null}
                    {item.tafsir ? (
                        <View style={styles.tafsirPanel}>
                            <Text style={styles.tafsirSource}>
                                {TAFSIR_SOURCE_LABELS.kemenag}
                            </Text>
                            <Text numberOfLines={4} style={styles.tafsirText}>
                                {item.tafsir}
                            </Text>
                        </View>
                    ) : null}
                    <Text style={styles.cardReadMore}>
                        Ketuk untuk membaca lengkap
                    </Text>
                </ContentCard>
            );
        }

        if (activeFeature?.type === "user-wird") {
            return (
                <Card key={`${item.id}-${index}`} style={styles.itemCard}>
                    <View style={styles.itemTitleBlock}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {item.meta ? (
                            <Text style={styles.itemMeta}>{item.meta}</Text>
                        ) : null}
                    </View>
                    {item.arabic ? (
                        <Text style={styles.arabic}>{item.arabic}</Text>
                    ) : null}
                    {item.body ? (
                        <Text style={styles.body}>{item.body}</Text>
                    ) : null}
                    <View style={styles.itemActions}>
                        <ActionPill
                            Icon={Pencil}
                            label='Edit'
                            onPress={() => fillUserWirdForm(item)}
                        />
                        <ActionPill
                            Icon={Trash2}
                            label='Hapus'
                            onPress={() => removeUserWird(item)}
                        />
                    </View>
                </Card>
            );
        }

        if (activeFeature?.type === "feed") {
            const isLiking = likingFeedId === item.id;
            const feedRef = getFeedReference(item);

            return (
                <Card key={`${item.id}-${index}`} style={styles.itemCard}>
                    <View style={styles.feedHeader}>
                        <View style={styles.feedAvatar}>
                            <Text style={styles.feedAvatarText}>
                                {item.title?.[0]?.toUpperCase() ?? "U"}
                            </Text>
                        </View>
                        <View style={styles.feedTitleBlock}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemMeta}>{item.meta}</Text>
                        </View>
                    </View>
                    <Text style={styles.body}>{item.body}</Text>
                    {feedRef ? (
                        <View style={styles.feedRefPanel}>
                            <Text style={styles.feedRefLabel}>
                                {feedRef.label}
                            </Text>
                            <Text style={styles.feedRefText}>
                                #{feedRef.id}
                            </Text>
                        </View>
                    ) : null}
                    <View style={styles.itemActions}>
                        <ActionPill
                            Icon={Heart}
                            label={isLiking ? "Menyukai..." : "Suka"}
                            disabled={isLiking}
                            onPress={() => handleLikeFeedItem(item)}
                        />
                        <ActionPill
                            Icon={MessageCircle}
                            label='Komentar'
                            onPress={() => {
                                setSelectedItem(item);
                                setActiveNoteRef("");
                            }}
                        />
                        <ActionPill
                            Icon={ExternalLink}
                            label='Sumber'
                            onPress={() => openSource(item)}
                        />
                        {session?.token ? (
                            <>
                                <ActionPill
                                    Icon={EyeOff}
                                    label='Sembunyikan'
                                    onPress={() => handleHideFeedItem(item)}
                                />
                                <ActionPill
                                    Icon={Flag}
                                    label='Laporkan'
                                    onPress={() => handleReportFeedItem(item)}
                                />
                            </>
                        ) : null}
                    </View>
                </Card>
            );
        }

        return (
            <ContentCard
                key={`${item.id}-${index}`}
                meta={item.meta || activeFeature?.title}
                onPress={
                    activeFeature?.type === "quiz"
                        ? undefined
                        : () => openItemDetail(item)
                }
                onMenuPress={() => setItemActionSheet({ visible: true, item })}
                style={styles.itemCard}
                title={item.title}
                titleStyle={styles.itemTitle}
            >
                {item.arabic ? (
                    <Text numberOfLines={3} style={styles.arabic}>
                        {item.arabic}
                    </Text>
                ) : null}
                {item.body ? (
                    <Text numberOfLines={4} style={styles.body}>
                        {item.body}
                    </Text>
                ) : null}
                {libraryProgressEntry ? (
                    <View style={styles.libraryProgressBadgeRow}>
                        <Text style={styles.libraryProgressBadgeText}>
                            {getLibraryProgressLabel(
                                libraryProgressEntry.status,
                            )}
                        </Text>
                        {libraryProgressEntry.current_page ? (
                            <Text style={styles.libraryProgressPageText}>
                                Hal. {libraryProgressEntry.current_page}
                            </Text>
                        ) : null}
                    </View>
                ) : null}
                {activeFeature?.type === "quiz" ? (
                    <View style={styles.answerRow}>
                        {getQuizChoices(item).map((option) => (
                            <Pressable
                                accessibilityRole='button'
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.14)",
                                    borderless: false,
                                }}
                                key={`${item.id}-${option.key}`}
                                onPress={() =>
                                    setAnswers((current) => ({
                                        ...current,
                                        [item.id]: option,
                                    }))
                                }
                                style={[
                                    styles.answerButton,
                                    answers[item.id]?.key === option.key &&
                                        styles.answerButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.answerText,
                                        answers[item.id]?.key === option.key &&
                                            styles.answerTextActive,
                                    ]}
                                >
                                    {`${option.key}. ${option.label}`}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}
            </ContentCard>
        );
    };

    const renderItemActionSheet = () => {
        const { visible, item } = itemActionSheet;
        if (!item) return null;

        const ref = getItemRef(activeFeature, item);
        const key = refKey(ref.refType, ref.refId);
        const isBookmarked = Boolean(bookmarks[key]);

        return (
            <AppActionSheet
                onClose={() =>
                    setItemActionSheet({ visible: false, item: null })
                }
                subtitle={item.meta || item.title}
                title='Aksi Cepat'
                visible={visible}
            >
                {activeFeature?.type !== "bookmarks" ? (
                    <ActionSheetRow
                        Icon={BookOpen}
                        onPress={() => openItemDetail(item)}
                        subtitle='Baca dengan ruang yang lebih luas'
                        title='Buka Detail'
                    />
                ) : null}

                {activeFeature?.type === "bookmarks" ||
                activeFeature?.type === "notes" ? (
                    <ActionSheetRow
                        Icon={ExternalLink}
                        onPress={() => {
                            setItemActionSheet({ visible: false, item: null });
                            openSource(item);
                        }}
                        subtitle='Buka sumber asli konten ini'
                        title='Buka Sumber'
                    />
                ) : null}

                <ActionSheetRow
                    Icon={isBookmarked ? BookmarkCheck : Bookmark}
                    active={isBookmarked}
                    disabled={savingBookmark === key}
                    onPress={() => {
                        setItemActionSheet({ visible: false, item: null });
                        toggleBookmark(item);
                    }}
                    subtitle={
                        isBookmarked
                            ? "Hapus dari koleksi"
                            : "Simpan ke koleksi pribadi"
                    }
                    title={isBookmarked ? "Hapus Bookmark" : "Bookmark"}
                />
            </AppActionSheet>
        );
    };

    const closeDetailView = () => {
        setSelectedItem(null);
        setActiveNoteRef("");
        setFeedComments([]);
        setCommentDraft("");
    };

    const renderFeedCommentsPanel = () => {
        if (activeFeature?.type !== "feed" || !selectedItem) return null;

        return (
            <View style={styles.commentsPanel}>
                <View style={styles.commentsHeader}>
                    <Text style={styles.detailTitle}>Komentar</Text>
                    {commentLoading ? (
                        <ActivityIndicator
                            color={colors.primary}
                            size='small'
                        />
                    ) : null}
                </View>
                {!commentLoading && !feedComments.length ? (
                    <Text style={styles.empty}>
                        Belum ada komentar untuk rujukan ini.
                    </Text>
                ) : null}
                {feedComments.map((comment) => (
                    <View key={comment.id} style={styles.commentRow}>
                        <View style={styles.commentAvatar}>
                            <Text style={styles.commentAvatarText}>
                                {comment.author?.[0]?.toUpperCase() ?? "U"}
                            </Text>
                        </View>
                        <View style={styles.commentCopy}>
                            <Text style={styles.commentAuthor}>
                                {comment.author}
                            </Text>
                            <Text style={styles.commentText}>
                                {comment.content}
                            </Text>
                        </View>
                    </View>
                ))}
                <View style={styles.commentForm}>
                    <TextInput
                        multiline
                        onChangeText={setCommentDraft}
                        placeholder={
                            session?.token
                                ? "Tulis komentar..."
                                : "Masuk untuk menulis komentar"
                        }
                        placeholderTextColor={colors.muted}
                        style={styles.commentInput}
                        value={commentDraft}
                    />
                    <Pressable
                        accessibilityLabel='Kirim komentar'
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(255,255,255,0.16)",
                            borderless: false,
                        }}
                        accessibilityState={{
                            disabled: !commentDraft.trim() || commentSaving,
                        }}
                        disabled={!commentDraft.trim() || commentSaving}
                        onPress={submitFeedComment}
                        style={[
                            styles.commentSubmit,
                            (!commentDraft.trim() || commentSaving) &&
                                styles.commentSubmitDisabled,
                        ]}
                    >
                        <Text style={styles.commentSubmitText}>
                            {commentSaving ? "Mengirim..." : "Kirim"}
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    const isTafsirDetail = activeFeature?.type === "surah-content";
    const hasBothTafsir =
        isTafsirDetail && selectedItem?.tafsir && selectedItem?.secondaryTafsir;

    const submitLibraryProgress = async () => {
        const bookId = selectedItem?.raw?.id ?? selectedItem?.id;
        if (!bookId || !session?.token) {
            showInfo("Buka Profil untuk masuk dan menyimpan progress belajar.");
            return;
        }

        setLibraryProgressSaving(true);
        setLibraryProgressMessage("");
        try {
            const saved = await saveLibraryProgress({
                bookId,
                currentPage: libraryProgressDraft.currentPage,
                note: libraryProgressDraft.note,
                status: libraryProgressDraft.status,
            });
            const item = saved?.data ?? saved;
            setLibraryProgress(item);
            setLibraryProgressMap((current) => ({
                ...current,
                [String(bookId)]: item,
            }));
            setLibraryProgressMessage("Progress belajar disimpan.");
            showSuccess("Progress belajar disimpan.");
        } catch (err) {
            const nextMessage = err?.message ?? "Progress belum bisa disimpan.";
            setLibraryProgressMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setLibraryProgressSaving(false);
        }
    };

    const renderLibraryProgressFilters = () => {
        if (activeFeature?.key !== "library" || !session?.token) return null;
        const trackedCount = Object.keys(libraryProgressMap).length;
        if (!trackedCount) return null;

        return (
            <Card style={styles.libraryFilterPanel}>
                <CardTitle meta={`${trackedCount} buku terlacak`}>
                    Filter Progress
                </CardTitle>
                <View style={styles.libraryStatusRow}>
                    <ActionPill
                        active={!libraryProgressFilter}
                        label='Semua'
                        onPress={() => setLibraryProgressFilter("")}
                    />
                    {LIBRARY_PROGRESS_STATUSES.map((status) => (
                        <ActionPill
                            active={libraryProgressFilter === status.key}
                            key={status.key}
                            label={status.label}
                            onPress={() => setLibraryProgressFilter(status.key)}
                        />
                    ))}
                </View>
            </Card>
        );
    };

    const renderDetailScreen = () => {
        if (!selectedItem) return null;
        const ref = getItemRef(activeFeature, selectedItem);
        const noteKey = refKey(ref.refType, ref.refId);
        const isLibraryDetail = activeFeature?.key === "library";

        const renderTafsirPanel = (tafsirText, sourceLabel, isSecondary) => {
            if (!tafsirText) return null;
            return (
                <View
                    style={[
                        styles.detailTafsirPanel,
                        isSecondary && styles.tafsirPanelSecondary,
                    ]}
                >
                    <Text
                        style={[
                            styles.tafsirSource,
                            isSecondary && styles.tafsirSourceSecondary,
                        ]}
                    >
                        {sourceLabel}
                    </Text>
                    <Text style={styles.detailBody}>{tafsirText}</Text>
                </View>
            );
        };

        const renderTafsirContent = () => {
            if (!isTafsirDetail) return null;
            if (tafsirMode === "kemenag")
                return renderTafsirPanel(
                    selectedItem.tafsir,
                    TAFSIR_SOURCE_LABELS.kemenag,
                    false,
                );
            if (tafsirMode === "mishbah")
                return renderTafsirPanel(
                    selectedItem.secondaryTafsir,
                    TAFSIR_SOURCE_LABELS.secondary,
                    true,
                );
            if (tafsirMode === "side-by-side" && hasBothTafsir) {
                return (
                    <View style={{ flexDirection: "row", gap: spacing.sm }}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "#f0fdf4",
                                borderRadius: radius.md,
                                padding: spacing.md,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: "900",
                                    color: colors.ink,
                                    marginBottom: spacing.sm,
                                }}
                            >
                                Kemenag
                            </Text>
                            <Text style={styles.detailBody}>
                                {selectedItem.tafsir}
                            </Text>
                        </View>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "#f0f9ff",
                                borderRadius: radius.md,
                                padding: spacing.md,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: "900",
                                    color: colors.ink,
                                    marginBottom: spacing.sm,
                                }}
                            >
                                Al-Mishbah
                            </Text>
                            <Text style={styles.detailBody}>
                                {selectedItem.secondaryTafsir}
                            </Text>
                        </View>
                    </View>
                );
            }
            return (
                <>
                    {renderTafsirPanel(
                        selectedItem.tafsir,
                        TAFSIR_SOURCE_LABELS.kemenag,
                        false,
                    )}
                    {renderTafsirPanel(
                        selectedItem.secondaryTafsir,
                        TAFSIR_SOURCE_LABELS.secondary,
                        true,
                    )}
                </>
            );
        };

        const renderLibraryProgressPanel = () => {
            if (!isLibraryDetail) return null;
            const totalPages = selectedItem?.raw?.pages ?? 0;
            return (
                <View style={styles.libraryProgressPanel}>
                    <CardTitle
                        meta={
                            session?.token
                                ? (libraryProgress?.status ?? "reading")
                                : "Masuk akun"
                        }
                    >
                        Progress Belajar
                    </CardTitle>
                    {!session?.token ? (
                        <Text style={styles.detailLine}>
                            Masuk dari tab Profil untuk menyimpan status dan
                            halaman terakhir.
                        </Text>
                    ) : (
                        <>
                            <View style={styles.libraryStatusRow}>
                                {LIBRARY_PROGRESS_STATUSES.map((status) => (
                                    <ActionPill
                                        key={status.key}
                                        active={
                                            libraryProgressDraft.status ===
                                            status.key
                                        }
                                        label={status.label}
                                        onPress={() =>
                                            setLibraryProgressDraft(
                                                (current) => ({
                                                    ...current,
                                                    status: status.key,
                                                }),
                                            )
                                        }
                                    />
                                ))}
                            </View>
                            <Text style={styles.inputLabel}>
                                Halaman terakhir
                                {totalPages ? ` dari ${totalPages}` : ""}
                            </Text>
                            <TextInput
                                keyboardType='number-pad'
                                onChangeText={(value) =>
                                    setLibraryProgressDraft((current) => ({
                                        ...current,
                                        currentPage: value,
                                    }))
                                }
                                placeholder='0'
                                placeholderTextColor={colors.muted}
                                style={styles.input}
                                value={libraryProgressDraft.currentPage}
                            />
                            <Text style={styles.inputLabel}>
                                Catatan ringkas
                            </Text>
                            <TextInput
                                multiline
                                onChangeText={(value) =>
                                    setLibraryProgressDraft((current) => ({
                                        ...current,
                                        note: value,
                                    }))
                                }
                                placeholder='Misalnya: sampai bab ikhlas...'
                                placeholderTextColor={colors.muted}
                                style={[styles.input, styles.textArea]}
                                value={libraryProgressDraft.note}
                            />
                            <Pressable
                                accessibilityLabel='Simpan progress belajar'
                                accessibilityRole='button'
                                accessibilityState={{
                                    disabled: libraryProgressSaving,
                                }}
                                disabled={libraryProgressSaving}
                                onPress={submitLibraryProgress}
                                style={[
                                    styles.primaryButton,
                                    styles.loginButton,
                                    libraryProgressSaving &&
                                        styles.disabledButton,
                                ]}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {libraryProgressSaving
                                        ? "Menyimpan..."
                                        : "Simpan progress"}
                                </Text>
                            </Pressable>
                            {libraryProgressMessage ? (
                                <Text style={styles.detailLine}>
                                    {libraryProgressMessage}
                                </Text>
                            ) : null}
                        </>
                    )}
                </View>
            );
        };

        const renderLibrarySourcePanel = () => {
            if (!isLibraryDetail) return null;
            const raw = selectedItem?.raw ?? {};
            const hasLicenseStatus =
                raw.license_status && raw.license_status !== "unverified";
            const fileSize = Number(raw.file_size_bytes ?? 0);
            const fileInfo = raw.file_name
                ? `${raw.file_name}${fileSize > 0 ? ` · ${Math.round(fileSize / 1024)} KB` : ""}`
                : "";
            if (
                !hasLicenseStatus &&
                !raw.is_source_verified &&
                !raw.source_note &&
                !fileInfo
            )
                return null;

            return (
                <View style={styles.librarySourcePanel}>
                    <CardTitle
                        meta={raw.source_type ?? raw.format ?? "resource"}
                    >
                        Sumber Resource
                    </CardTitle>
                    <View style={styles.libraryStatusRow}>
                        {hasLicenseStatus ? (
                            <View style={styles.libraryProgressBadgeRow}>
                                <Text style={styles.libraryProgressBadgeText}>
                                    Lisensi: {raw.license_status}
                                </Text>
                            </View>
                        ) : null}
                        {raw.is_source_verified ? (
                            <View style={styles.libraryProgressBadgeRow}>
                                <Text style={styles.libraryProgressBadgeText}>
                                    Sumber terverifikasi
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    {fileInfo ? (
                        <Text style={styles.detailLine}>{fileInfo}</Text>
                    ) : null}
                    {raw.source_note ? (
                        <Text style={styles.detailLine}>{raw.source_note}</Text>
                    ) : null}
                </View>
            );
        };

        const renderDetailBody = () => (
            <>
                <Card style={styles.detailCard}>
                    {selectedItem.arabic ? (
                        <Text
                            style={[
                                isTafsirDetail
                                    ? styles.detailArabic
                                    : styles.arabic,
                            ]}
                        >
                            {selectedItem.arabic}
                        </Text>
                    ) : null}
                    {selectedItem.body ? (
                        <View
                            style={
                                isTafsirDetail
                                    ? styles.detailTranslationBox
                                    : null
                            }
                        >
                            <Text
                                style={
                                    isTafsirDetail
                                        ? styles.detailTranslation
                                        : styles.detailBody
                                }
                            >
                                {selectedItem.body}
                            </Text>
                        </View>
                    ) : null}
                    {hasBothTafsir ? (
                        <View style={{ marginBottom: spacing.sm }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    gap: spacing.xs,
                                    marginBottom: spacing.xs,
                                }}
                            >
                                {TAFSIR_MODES.map((m) => (
                                    <ActionPill
                                        key={m.key}
                                        active={tafsirMode === m.key}
                                        label={m.label}
                                        onPress={() => setTafsirMode(m.key)}
                                    />
                                ))}
                            </View>
                        </View>
                    ) : null}
                    {renderTafsirContent()}
                    <View style={styles.detailMetaPanel}>
                        <Text style={styles.detailTitle}>Info</Text>
                        <Text style={styles.detailLine}>
                            {selectedItem.meta || activeFeature?.title}
                        </Text>
                        {ref.refId ? (
                            <Text style={styles.detailLine}>
                                Rujukan: {ref.refType} #{ref.refId}
                            </Text>
                        ) : null}
                    </View>
                </Card>

                {renderFeedCommentsPanel()}
                {renderLibrarySourcePanel()}
                {renderLibraryProgressPanel()}

                <View style={styles.detailActions}>
                    {activeFeature?.type !== "feed" ? (
                        <ActionPill
                            Icon={StickyNote}
                            active={activeNoteRef === noteKey}
                            label='Catatan'
                            onPress={() =>
                                setActiveNoteRef(
                                    activeNoteRef === noteKey ? "" : noteKey,
                                )
                            }
                        />
                    ) : null}
                    <ActionPill
                        Icon={ExternalLink}
                        label='Buka sumber'
                        onPress={() => openSource(selectedItem)}
                    />
                </View>
                {activeNoteRef === noteKey ? (
                    <NotesPanel refType={ref.refType} refId={ref.refId} />
                ) : null}
            </>
        );

        if (isWebAppLayout) {
            return (
                <ScrollView
                    contentContainerStyle={styles.webAppDetailContent}
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}
                    style={styles.webAppDetailRoot}
                >
                    <View testID='explore-web-app-detail' />
                    <View style={styles.webAppDetailHeader}>
                        <Pressable
                            accessibilityRole='button'
                            accessibilityLabel='Kembali ke daftar'
                            onPress={closeDetailView}
                            style={styles.webAppDetailBack}
                            testID='web-app-detail-back'
                        >
                            <ArrowLeft
                                color={colors.primary}
                                size={16}
                                strokeWidth={2.4}
                            />
                            <Text style={styles.webAppDetailBackText}>
                                Kembali
                            </Text>
                        </Pressable>
                        <Text style={styles.webAppDetailEyebrow}>
                            {(activeFeature?.group || "Detail").toUpperCase()}
                        </Text>
                        <Text style={styles.webAppDetailTitle}>
                            {selectedItem.title}
                        </Text>
                        {selectedItem.meta || activeFeature?.title ? (
                            <Text style={styles.webAppDetailSubtitle}>
                                {selectedItem.meta || activeFeature?.title}
                            </Text>
                        ) : null}
                    </View>
                    {renderDetailBody()}
                </ScrollView>
            );
        }

        return (
            <Screen
                actions={
                    <IconActionButton
                        Icon={ArrowLeft}
                        label='Kembali'
                        onPress={closeDetailView}
                    />
                }
                subtitle={selectedItem.meta || activeFeature?.title}
                title={selectedItem.title}
            >
                <View testID='explore-classic-detail' />
                {renderDetailBody()}
            </Screen>
        );
    };

    const renderFeatureContent = () => {
        if (!activeFeature) {
            return null;
        }

        if (activeFeature.type === "user-wird") {
            if (!session?.token) {
                return (
                    <Card>
                        <CardTitle meta='Akun'>Wirid Saya</CardTitle>
                        <Text style={styles.body}>
                            Masuk melalui Profil untuk membuat dan mengelola
                            wirid pribadi.
                        </Text>
                        <Pressable
                            accessibilityLabel='Buka Profil untuk masuk'
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(255,255,255,0.16)",
                                borderless: false,
                            }}
                            onPress={() => onOpenTab?.("profile")}
                            style={[styles.primaryButton, styles.loginButton]}
                        >
                            <Text style={styles.primaryButtonText}>
                                Buka Profil
                            </Text>
                        </Pressable>
                    </Card>
                );
            }

            return (
                <Card>
                    <CardTitle meta={editingUserWirdId ? "Edit" : "Baru"}>
                        {activeFeature.title}
                    </CardTitle>
                    <Text style={styles.body}>
                        Buat koleksi wirid pribadi dengan target jumlah bacaan.
                    </Text>
                    {renderUserWirdField({
                        field: "title",
                        label: "Judul",
                        placeholder: "Contoh: Wirid pagi pribadi",
                    })}
                    {renderUserWirdField({
                        field: "arabic",
                        label: "Teks Arab",
                        multiline: true,
                        placeholder: "اكتب الذكر هنا",
                    })}
                    {renderUserWirdField({
                        field: "transliteration",
                        label: "Transliterasi",
                        multiline: true,
                        placeholder: "Tuliskan transliterasi jika ada",
                    })}
                    {renderUserWirdField({
                        field: "translation",
                        label: "Terjemahan",
                        multiline: true,
                        placeholder: "Makna bacaan",
                    })}
                    <View style={styles.wirdGrid}>
                        <View style={styles.wirdGridItem}>
                            <Text style={styles.inputLabel}>Jumlah</Text>
                            <TextInput
                                keyboardType='numeric'
                                onChangeText={(value) =>
                                    setUserWirdForm((current) => ({
                                        ...current,
                                        count: digitsOnly(value),
                                    }))
                                }
                                placeholder='1'
                                placeholderTextColor={colors.muted}
                                style={styles.input}
                                value={userWirdForm.count}
                            />
                        </View>
                        <View style={styles.wirdGridItem}>
                            {renderUserWirdField({
                                field: "occasion",
                                label: "Waktu",
                                placeholder: "Pagi, petang...",
                            })}
                        </View>
                    </View>
                    {renderUserWirdField({
                        field: "source",
                        label: "Sumber",
                        placeholder: "Kitab/ustadz/rujukan",
                    })}
                    {renderUserWirdField({
                        field: "note",
                        label: "Catatan",
                        multiline: true,
                        placeholder: "Catatan pribadi",
                    })}
                    <View style={styles.formActions}>
                        <Pressable
                            accessibilityLabel={
                                editingUserWirdId
                                    ? "Simpan perubahan wirid"
                                    : "Tambah wirid"
                            }
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(255,255,255,0.16)",
                                borderless: false,
                            }}
                            accessibilityState={{ disabled: savingUserWird }}
                            disabled={savingUserWird}
                            onPress={submitUserWird}
                            style={[
                                styles.primaryButton,
                                styles.formPrimaryButton,
                                savingUserWird && styles.disabledButton,
                            ]}
                        >
                            <Text style={styles.primaryButtonText}>
                                {savingUserWird
                                    ? "Menyimpan..."
                                    : editingUserWirdId
                                      ? "Simpan"
                                      : "Tambah"}
                            </Text>
                        </Pressable>
                        {editingUserWirdId ? (
                            <Pressable
                                accessibilityLabel='Batal edit wirid'
                                accessibilityRole='button'
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.12)",
                                    borderless: false,
                                }}
                                onPress={resetUserWirdForm}
                                style={styles.secondaryButton}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    Batal
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                </Card>
            );
        }

        if (activeFeature.type === "kamus") {
            return (
                <Card>
                    <CardTitle meta='Cari Kata'>
                        {activeFeature.title}
                    </CardTitle>
                    <View style={styles.searchRow}>
                        <TextInput
                            ref={dictionaryInputRef}
                            autoFocus={focusDictionaryInput}
                            autoCapitalize='none'
                            onChangeText={setDictionaryQuery}
                            onSubmitEditing={runDictionarySearch}
                            placeholder='Cari kata Arab atau Indonesia'
                            placeholderTextColor={colors.muted}
                            style={styles.input}
                            value={dictionaryQuery}
                        />
                        <Pressable
                            accessibilityRole='button'
                            onPress={runDictionarySearch}
                            style={styles.primaryButton}
                        >
                            <Text style={styles.primaryButtonText}>Cari</Text>
                        </Pressable>
                    </View>
                </Card>
            );
        }

        if (activeFeature.type === "tasbih") {
            const progress = Math.min(
                100,
                Math.round((tasbih.count / tasbih.target) * 100),
            );
            return (
                <Card>
                    <CardTitle meta={`${progress}%`}>
                        {activeFeature.title}
                    </CardTitle>
                    <Pressable
                        accessibilityRole='button'
                        onPress={() => {
                            hapticTap();
                            setTasbih((current) => ({
                                ...current,
                                count: current.count + 1,
                            }));
                        }}
                        style={styles.counter}
                    >
                        <Text style={styles.counterNumber}>{tasbih.count}</Text>
                        <Text style={styles.counterLabel}>
                            Target {tasbih.target}
                        </Text>
                    </Pressable>
                    <View style={styles.answerRow}>
                        {[33, 99, 100].map((target) => (
                            <Pressable
                                accessibilityRole='button'
                                key={target}
                                onPress={() => setTasbih({ count: 0, target })}
                                style={[
                                    styles.answerButton,
                                    tasbih.target === target &&
                                        styles.answerButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.answerText,
                                        tasbih.target === target &&
                                            styles.answerTextActive,
                                    ]}
                                >
                                    {target}
                                </Text>
                            </Pressable>
                        ))}
                        <Pressable
                            accessibilityRole='button'
                            onPress={() =>
                                setTasbih((current) => ({
                                    ...current,
                                    count: 0,
                                }))
                            }
                            style={styles.answerButton}
                        >
                            <Text style={styles.answerText}>Reset</Text>
                        </Pressable>
                    </View>
                </Card>
            );
        }

        if (activeFeature.type === "asmaul-wirid") {
            const currentName = asmaulNames[asmaulIndex];
            const currentCount = asmaulCounts[currentName?.id] ?? 0;
            const isComplete = currentCount >= 33;

            const incrementName = () => {
                if (!currentName?.id) return;
                const nameId = currentName.id;
                hapticTap();
                setAsmaulCounts((prev) => {
                    const nextCount = (prev[nameId] ?? 0) + 1;
                    if (nextCount === 33 || nextCount === 99) hapticMedium();
                    const nextCounts = { ...prev, [nameId]: nextCount };
                    setAsmaulWiridCount(nextCounts, nameId, nextCount).catch(
                        (e) => console.error(e),
                    );
                    return nextCounts;
                });
            };

            const resetName = () => {
                if (!currentName?.id) return;
                const nameId = currentName.id;
                setAsmaulCounts((prev) => {
                    const nextCounts = { ...prev };
                    delete nextCounts[nameId];
                    setAsmaulWiridCount(nextCounts, nameId, 0).catch((e) =>
                        console.error(e),
                    );
                    return nextCounts;
                });
            };

            return (
                <Card>
                    <CardTitle
                        meta={
                            asmaulLoading
                                ? "Memuat..."
                                : `${asmaulIndex + 1}/${asmaulNames.length}`
                        }
                    >
                        {activeFeature.title}
                    </CardTitle>
                    {asmaulLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : currentName ? (
                        <>
                            <View style={styles.asmaulHeader}>
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: asmaulIndex === 0,
                                    }}
                                    disabled={asmaulIndex === 0}
                                    onPress={() =>
                                        setAsmaulIndex((i) =>
                                            Math.max(0, i - 1),
                                        )
                                    }
                                    style={[
                                        styles.heirButton,
                                        asmaulIndex === 0 &&
                                            styles.heirButtonDisabled,
                                    ]}
                                >
                                    <Text style={styles.heirButtonText}>←</Text>
                                </Pressable>
                                <View style={{ flex: 1, alignItems: "center" }}>
                                    <Text style={styles.asmaulArabic}>
                                        {currentName.arabic ??
                                            currentName.name ??
                                            ""}
                                    </Text>
                                    <Text style={styles.asmaulLatin}>
                                        {currentName.latin ??
                                            currentName.transliteration ??
                                            ""}
                                    </Text>
                                    <Text style={styles.asmaulArti}>
                                        {currentName.translation ??
                                            currentName.meaning ??
                                            ""}
                                    </Text>
                                </View>
                                <Pressable
                                    accessibilityRole='button'
                                    disabled={
                                        asmaulIndex >= asmaulNames.length - 1
                                    }
                                    onPress={() =>
                                        setAsmaulIndex((i) =>
                                            Math.min(
                                                asmaulNames.length - 1,
                                                i + 1,
                                            ),
                                        )
                                    }
                                    style={[
                                        styles.heirButton,
                                        asmaulIndex >= asmaulNames.length - 1 &&
                                            styles.heirButtonDisabled,
                                    ]}
                                >
                                    <Text style={styles.heirButtonText}>→</Text>
                                </Pressable>
                            </View>
                            <View
                                style={{
                                    height: 6,
                                    backgroundColor: colors.faint,
                                    borderRadius: 3,
                                    marginVertical: spacing.md,
                                }}
                            >
                                <View
                                    style={{
                                        height: 6,
                                        backgroundColor: isComplete
                                            ? colors.primary
                                            : colors.muted,
                                        borderRadius: 3,
                                        width: `${Math.min(100, (currentCount / 33) * 100)}%`,
                                    }}
                                />
                            </View>
                            <Pressable
                                accessibilityRole='button'
                                onPress={incrementName}
                                style={styles.counter}
                                testID='asmaul-wirid-counter'
                            >
                                <Text style={styles.counterNumber}>
                                    {currentCount}
                                </Text>
                                <Text style={styles.counterLabel}>
                                    {isComplete
                                        ? "Sempurna!"
                                        : "Tap untuk hitung"}
                                </Text>
                            </Pressable>
                            <View style={styles.answerRow}>
                                <Pressable
                                    accessibilityRole='button'
                                    onPress={resetName}
                                    style={styles.answerButton}
                                >
                                    <Text style={styles.answerText}>Reset</Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <Text style={styles.body}>
                            Daftar Asmaul Husna belum tersedia.
                        </Text>
                    )}
                </Card>
            );
        }

        if (activeFeature.type === "asmaul-flashcard") {
            const currentName = asmaulNames[asmaulIndex];
            const canGoPrev = asmaulIndex > 0;
            const canGoNext = asmaulIndex < asmaulNames.length - 1;
            const moveFlashcard = (delta) => {
                hapticTap();
                setAsmaulFlashcardRevealed(false);
                setAsmaulIndex((current) =>
                    Math.max(
                        0,
                        Math.min(asmaulNames.length - 1, current + delta),
                    ),
                );
            };

            return (
                <Card>
                    <CardTitle
                        meta={
                            asmaulLoading
                                ? "Memuat..."
                                : `${asmaulIndex + 1}/${asmaulNames.length}`
                        }
                    >
                        {activeFeature.title}
                    </CardTitle>
                    {asmaulLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : currentName ? (
                        <>
                            <Pressable
                                accessibilityLabel='Balik kartu Asmaul Husna'
                                accessibilityRole='button'
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.12)",
                                    borderless: false,
                                }}
                                onPress={() => {
                                    hapticTap();
                                    setAsmaulFlashcardRevealed(
                                        (value) => !value,
                                    );
                                }}
                                style={styles.flashcard}
                            >
                                <Text style={styles.flashcardNumber}>
                                    Nama {currentName.number}
                                </Text>
                                <Text style={styles.flashcardArabic}>
                                    {currentName.arabic}
                                </Text>
                                <Text style={styles.flashcardLatin}>
                                    {currentName.transliteration}
                                </Text>
                                {asmaulFlashcardRevealed ? (
                                    <Text style={styles.flashcardMeaning}>
                                        {currentName.meaning}
                                    </Text>
                                ) : (
                                    <Text style={styles.flashcardHint}>
                                        Tap untuk melihat arti
                                    </Text>
                                )}
                            </Pressable>
                            <View style={styles.answerRow}>
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: !canGoPrev,
                                    }}
                                    disabled={!canGoPrev}
                                    onPress={() => moveFlashcard(-1)}
                                    style={[
                                        styles.answerButton,
                                        !canGoPrev && styles.disabledButton,
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        Sebelumnya
                                    </Text>
                                </Pressable>
                                <Pressable
                                    accessibilityRole='button'
                                    onPress={() =>
                                        setAsmaulFlashcardRevealed(
                                            (value) => !value,
                                        )
                                    }
                                    style={styles.answerButton}
                                >
                                    <Text style={styles.answerText}>
                                        {asmaulFlashcardRevealed
                                            ? "Sembunyikan arti"
                                            : "Lihat arti"}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: !canGoNext,
                                    }}
                                    disabled={!canGoNext}
                                    onPress={() => moveFlashcard(1)}
                                    style={[
                                        styles.answerButton,
                                        !canGoNext && styles.disabledButton,
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        Berikutnya
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <Text style={styles.body}>
                            Daftar Asmaul Husna belum tersedia.
                        </Text>
                    )}
                </Card>
            );
        }

        if (activeFeature.type === "surah-content") {
            return (
                <Card>
                    <CardTitle
                        meta={
                            selectedSurahNumber
                                ? `Surah ${selectedSurahNumber}`
                                : "Pilih Surah"
                        }
                    >
                        {activeFeature.title}
                    </CardTitle>
                    <Text style={styles.body}>
                        Pilih surah untuk membaca penjelasan ayat.
                    </Text>
                    <TextInput
                        autoCapitalize='none'
                        onChangeText={setSurahSearch}
                        placeholder='Cari nama atau nomor surah'
                        placeholderTextColor={colors.muted}
                        style={styles.surahSearchInput}
                        value={surahSearch}
                    />
                    <View style={styles.surahSelector}>
                        {visibleSurahOptions.map((surah) => (
                            <Pressable
                                accessibilityRole='button'
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.12)",
                                    borderless: false,
                                }}
                                key={`${activeFeature.key}-${surah.number}`}
                                onPress={() => loadSurahContent(surah.number)}
                                style={[
                                    styles.surahChip,
                                    selectedSurahNumber === surah.number &&
                                        styles.surahChipActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.surahChipText,
                                        selectedSurahNumber === surah.number &&
                                            styles.surahChipTextActive,
                                    ]}
                                >
                                    {surah.number}. {surah.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    {!surahSearch &&
                    surahs.length > visibleSurahOptions.length ? (
                        <Text style={styles.selectorHint}>
                            Tampilkan surah lain lewat pencarian.
                        </Text>
                    ) : null}
                    {surahSearch && !visibleSurahOptions.length ? (
                        <Text style={styles.empty}>Surah tidak ditemukan.</Text>
                    ) : null}
                    {!loading && surahs.length === 0 ? (
                        <Text style={styles.empty}>
                            Daftar surah belum tersedia.
                        </Text>
                    ) : null}
                </Card>
            );
        }

        if (activeFeature.type === "zakat") {
            const NISAB_GRAM = 85;
            const NISAB_SILVER_GRAM = 595;
            const NISAB_HARVEST_KG = 653;
            const goldPrice = parseNumericInput(zakatGoldPrice) || 1050000;
            const nisab = NISAB_GRAM * goldPrice;
            const nisabMonthly = nisab / 12;
            const assets = parseNumericInput(zakat.assets);
            const debts = parseNumericInput(zakat.debts);
            const net = Math.max(0, assets - debts);
            const zakatMaal = net >= nisab && zakatHaul ? net * 0.025 : 0;
            const ricePrice = parseNumericInput(zakatRicePrice) || 16000;
            const zakatFitrah = 2.5 * ricePrice * zakatFamilyCount;
            const income = parseNumericInput(zakatMonthlyIncome) || 0;
            const zakatProfesi = income >= nisabMonthly ? income * 0.025 : 0;
            const tradeNet =
                (parseNumericInput(zakatTradeCapital) || 0) +
                (parseNumericInput(zakatTradeStock) || 0) +
                (parseNumericInput(zakatTradeReceivable) || 0) -
                (parseNumericInput(zakatTradeDebt) || 0);
            const zakatTrade =
                tradeNet >= nisab && zakatTradeHaul ? tradeNet * 0.025 : 0;
            const harvest = parseNumericInput(zakatHarvestWeight) || 0;
            const riceKgPrice = parseNumericInput(zakatRiceKgPrice) || 16000;
            const harvestRate = zakatHarvestIrrigated ? 0.05 : 0.1;
            const zakatAgriculture =
                harvest >= NISAB_HARVEST_KG
                    ? harvest * harvestRate * riceKgPrice
                    : 0;
            const goldG = parseNumericInput(zakatGoldGrams) || 0;
            const silverPriceNum = parseNumericInput(zakatSilverPrice) || 14000;
            const silverG = parseNumericInput(zakatSilverGrams) || 0;
            const goldValue = goldG * goldPrice;
            const silverValue = silverG * silverPriceNum;
            const goldNisabValue = NISAB_GRAM * goldPrice;
            const silverNisabValue = NISAB_SILVER_GRAM * silverPriceNum;
            const zakatGold =
                zakatGoldHaul &&
                (goldValue >= goldNisabValue || silverValue >= silverNisabValue)
                    ? (goldValue + silverValue) * 0.025
                    : 0;

            const ZAKAT_TABS = [
                { key: "maal", label: "Maal" },
                { key: "fitrah", label: "Fitrah" },
                { key: "profesi", label: "Profesi" },
                { key: "dagang", label: "Dagang" },
                { key: "tani", label: "Tani" },
                { key: "emas", label: "Emas" },
                { key: "riwayat", label: "Riwayat" },
            ];

            const handleZakatSave = async (
                jenis,
                namaJenis,
                jumlahZakat,
                nilaiHarta = 0,
                nisabVal = 0,
            ) => {
                if (jumlahZakat <= 0) return;
                setZakatSaving(true);
                setZakatSavedMsg("");
                const payload = {
                    jenis,
                    nama_jenis: namaJenis,
                    jumlah_zakat: jumlahZakat,
                    nilai_harta: nilaiHarta,
                    nisab: nisabVal,
                    rate: 2.5,
                    haul: true,
                    catatan: "",
                };
                try {
                    if (session?.token) {
                        await saveKalkulasiZakat(payload);
                        setZakatSavedMsg("Tersimpan ke akun.");
                        loadZakatHistory();
                    } else {
                        const created = await saveCalculatorHistory(
                            "zakat",
                            payload,
                        );
                        setZakatHistory((current) =>
                            mergeCalculatorHistory(current, [created]),
                        );
                        setZakatSavedMsg("Tersimpan di perangkat.");
                    }
                } catch {
                    setZakatSavedMsg("Gagal menyimpan");
                }
                setZakatSaving(false);
                if (zakatTimerRef.current) clearTimeout(zakatTimerRef.current);
                zakatTimerRef.current = setTimeout(
                    () => setZakatSavedMsg(""),
                    2500,
                );
            };

            const handleDeleteZakat = async (item) => {
                try {
                    if (
                        item?.is_local ||
                        `${item?.id ?? ""}`.startsWith("local-zakat-")
                    ) {
                        await deleteCalculatorHistory("zakat", item.id);
                    } else {
                        await deleteKalkulasiZakat(item.id);
                    }
                    loadZakatHistory();
                } catch {
                    showError("Riwayat zakat gagal dihapus.");
                }
            };

            const renderZakatResult = (amount, label, color = "primary") => (
                <View
                    style={[
                        styles.resultPanel,
                        {
                            borderColor:
                                color === "amber"
                                    ? "#F59E0B"
                                    : color === "blue"
                                      ? "#3B82F6"
                                      : colors.primary,
                            borderWidth: 1,
                            marginTop: spacing.md,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.resultLabel,
                            { textAlign: "center", fontSize: 13 },
                        ]}
                    >
                        {label}
                    </Text>
                    <Text
                        style={[
                            styles.resultValueStrong,
                            { textAlign: "center", fontSize: 24 },
                        ]}
                    >
                        {formatCurrency(amount)}
                    </Text>
                </View>
            );

            if (isWebAppLayout && zakatTab === 6) {
                return (
                    <WebAppZakatHistoryRoute
                        formatCurrency={formatCurrency}
                        onBack={() => setZakatTab(0)}
                        onDelete={handleDeleteZakat}
                        session={session}
                        zakatHistory={zakatHistory}
                    />
                );
            }

            return (
                <Card>
                    <CardTitle>{activeFeature.title}</CardTitle>
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: spacing.xs,
                            marginBottom: spacing.md,
                        }}
                    >
                        {ZAKAT_TABS.map((t, i) => (
                            <ActionPill
                                key={t.key}
                                active={zakatTab === i}
                                label={t.label}
                                onPress={() => setZakatTab(i)}
                            />
                        ))}
                    </View>

                    {/* Zakat Maal */}
                    {zakatTab === 0 && (
                        <>
                            <Text style={styles.body}>
                                Zakat 2,5% dari harta bersih yang sudah mencapai
                                nisab dan haul.
                            </Text>
                            <Text
                                style={[
                                    styles.body,
                                    {
                                        fontSize: 12,
                                        color: colors.muted,
                                        marginBottom: spacing.sm,
                                    },
                                ]}
                            >
                                Nisab: {formatCurrency(nisab)} (85g emas ×{" "}
                                {formatCurrency(goldPrice)}/g)
                            </Text>
                            {renderCurrencyInput({
                                label: "Total harta",
                                value: zakat.assets,
                                placeholder: "0",
                                onChangeText: (v) =>
                                    setZakat((c) => ({ ...c, assets: v })),
                            })}
                            {renderCurrencyInput({
                                label: "Utang jatuh tempo",
                                value: zakat.debts,
                                placeholder: "0",
                                onChangeText: (v) =>
                                    setZakat((c) => ({ ...c, debts: v })),
                            })}
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>
                                    Sudah haul (1 tahun)
                                </Text>
                                <Switch
                                    value={zakatHaul}
                                    onValueChange={setZakatHaul}
                                    trackColor={{
                                        false: colors.faint,
                                        true: colors.primary,
                                    }}
                                    thumbColor={colors.surface}
                                />
                            </View>
                            <View style={styles.resultPanel}>
                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>
                                        Harta bersih
                                    </Text>
                                    <Text style={styles.resultValue}>
                                        {formatCurrency(net)}
                                    </Text>
                                </View>
                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>
                                        Nisab
                                    </Text>
                                    <Text style={styles.resultValue}>
                                        {formatCurrency(nisab)}
                                    </Text>
                                </View>
                                <View style={styles.resultDivider} />
                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabelStrong}>
                                        Zakat maal 2,5%
                                    </Text>
                                    <Text style={styles.resultValueStrong}>
                                        {formatCurrency(zakatMaal)}
                                    </Text>
                                </View>
                            </View>
                            {session?.token && zakatMaal > 0 && (
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: zakatSaving,
                                    }}
                                    disabled={zakatSaving}
                                    onPress={() =>
                                        handleZakatSave(
                                            "maal",
                                            "Zakat Maal",
                                            zakatMaal,
                                            net,
                                            nisab,
                                        )
                                    }
                                    style={[
                                        styles.answerButton,
                                        {
                                            marginTop: spacing.sm,
                                            alignSelf: "stretch",
                                        },
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        {zakatSaving
                                            ? "Menyimpan..."
                                            : "Simpan"}
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    )}

                    {/* Zakat Fitrah */}
                    {zakatTab === 1 && (
                        <>
                            <Text style={styles.body}>
                                Zakat fitrah 1 sha' (±2,5 kg) makanan pokok per
                                jiwa.
                            </Text>
                            {renderCurrencyInput({
                                label: "Harga beras/kg",
                                value: zakatRicePrice,
                                placeholder: "16000",
                                onChangeText: setZakatRicePrice,
                            })}
                            <View style={styles.heirGrid}>
                                <Pressable
                                    accessibilityRole='button'
                                    onPress={() =>
                                        setZakatFamilyCount(
                                            Math.max(1, zakatFamilyCount - 1),
                                        )
                                    }
                                    style={styles.heirButton}
                                >
                                    <Text style={styles.heirButtonText}>−</Text>
                                </Pressable>
                                <View
                                    style={{
                                        alignItems: "center",
                                        paddingHorizontal: spacing.md,
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.resultValueStrong,
                                            { fontSize: 22 },
                                        ]}
                                    >
                                        {zakatFamilyCount}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.resultLabel,
                                            { fontSize: 11 },
                                        ]}
                                    >
                                        Jiwa
                                    </Text>
                                </View>
                                <Pressable
                                    accessibilityRole='button'
                                    onPress={() =>
                                        setZakatFamilyCount(
                                            zakatFamilyCount + 1,
                                        )
                                    }
                                    style={styles.heirButton}
                                >
                                    <Text style={styles.heirButtonText}>+</Text>
                                </Pressable>
                            </View>
                            {renderZakatResult(
                                zakatFitrah,
                                "Zakat Fitrah",
                                "amber",
                            )}
                            {session?.token && zakatFitrah > 0 && (
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: zakatSaving,
                                    }}
                                    disabled={zakatSaving}
                                    onPress={() =>
                                        handleZakatSave(
                                            "fitrah",
                                            "Zakat Fitrah",
                                            zakatFitrah,
                                        )
                                    }
                                    style={[
                                        styles.answerButton,
                                        {
                                            marginTop: spacing.sm,
                                            alignSelf: "stretch",
                                        },
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        {zakatSaving
                                            ? "Menyimpan..."
                                            : "Simpan"}
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    )}

                    {/* Zakat Profesi */}
                    {zakatTab === 2 && (
                        <>
                            <Text style={styles.body}>
                                Zakat profesi 2,5% dari penghasilan bulanan jika
                                mencapai nisab per bulan.
                            </Text>
                            <Text
                                style={[
                                    styles.body,
                                    {
                                        fontSize: 12,
                                        color: colors.muted,
                                        marginBottom: spacing.sm,
                                    },
                                ]}
                            >
                                Nisab bulanan: {formatCurrency(nisabMonthly)}
                            </Text>
                            {renderCurrencyInput({
                                label: "Penghasilan per bulan",
                                value: zakatMonthlyIncome,
                                placeholder: "0",
                                onChangeText: setZakatMonthlyIncome,
                            })}
                            {income > 0 && income < nisabMonthly && (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        {
                                            color: "#D97706",
                                            marginBottom: spacing.sm,
                                        },
                                    ]}
                                >
                                    Penghasilan belum mencapai nisab bulanan.
                                </Text>
                            )}
                            {renderZakatResult(
                                zakatProfesi,
                                "Zakat Profesi",
                                "blue",
                            )}
                            {session?.token && zakatProfesi > 0 && (
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: zakatSaving,
                                    }}
                                    disabled={zakatSaving}
                                    onPress={() =>
                                        handleZakatSave(
                                            "profesi",
                                            "Zakat Profesi",
                                            zakatProfesi,
                                            income,
                                            nisabMonthly,
                                        )
                                    }
                                    style={[
                                        styles.answerButton,
                                        {
                                            marginTop: spacing.sm,
                                            alignSelf: "stretch",
                                        },
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        {zakatSaving
                                            ? "Menyimpan..."
                                            : "Simpan"}
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    )}

                    {/* Zakat Perdagangan */}
                    {zakatTab === 3 && (
                        <>
                            <Text style={styles.body}>
                                Zakat perdagangan 2,5% dari (modal + stok +
                                piutang − utang) jika ≥ nisab.
                            </Text>
                            {renderCurrencyInput({
                                label: "Modal usaha (Rp)",
                                value: zakatTradeCapital,
                                placeholder: "0",
                                onChangeText: setZakatTradeCapital,
                            })}
                            {renderCurrencyInput({
                                label: "Nilai stok barang (Rp)",
                                value: zakatTradeStock,
                                placeholder: "0",
                                onChangeText: setZakatTradeStock,
                            })}
                            {renderCurrencyInput({
                                label: "Piutang bisa ditagih (Rp)",
                                value: zakatTradeReceivable,
                                placeholder: "0",
                                onChangeText: setZakatTradeReceivable,
                            })}
                            {renderCurrencyInput({
                                label: "Utang usaha (Rp)",
                                value: zakatTradeDebt,
                                placeholder: "0",
                                onChangeText: setZakatTradeDebt,
                            })}
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>
                                    Sudah haul (1 tahun)
                                </Text>
                                <Switch
                                    value={zakatTradeHaul}
                                    onValueChange={setZakatTradeHaul}
                                    trackColor={{
                                        false: colors.faint,
                                        true: colors.primary,
                                    }}
                                    thumbColor={colors.surface}
                                />
                            </View>
                            <View style={styles.resultPanel}>
                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>
                                        Aset bersih
                                    </Text>
                                    <Text style={styles.resultValue}>
                                        {formatCurrency(tradeNet)}
                                    </Text>
                                </View>
                                <View style={styles.resultDivider} />
                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabelStrong}>
                                        Zakat dagang 2,5%
                                    </Text>
                                    <Text style={styles.resultValueStrong}>
                                        {formatCurrency(zakatTrade)}
                                    </Text>
                                </View>
                            </View>
                            {session?.token && zakatTrade > 0 && (
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: zakatSaving,
                                    }}
                                    disabled={zakatSaving}
                                    onPress={() =>
                                        handleZakatSave(
                                            "perdagangan",
                                            "Zakat Perdagangan",
                                            zakatTrade,
                                            tradeNet,
                                            nisab,
                                        )
                                    }
                                    style={[
                                        styles.answerButton,
                                        {
                                            marginTop: spacing.sm,
                                            alignSelf: "stretch",
                                        },
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        {zakatSaving
                                            ? "Menyimpan..."
                                            : "Simpan"}
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    )}

                    {/* Zakat Pertanian */}
                    {zakatTab === 4 && (
                        <>
                            <Text style={styles.body}>
                                Nisab 5 wasq ({NISAB_HARVEST_KG} kg). Irigasi:
                                5%, tadah hujan: 10%. Wajib tiap panen.
                            </Text>
                            {renderCurrencyInput({
                                label: "Hasil panen (kg)",
                                value: zakatHarvestWeight,
                                placeholder: "0",
                                onChangeText: setZakatHarvestWeight,
                            })}
                            {renderCurrencyInput({
                                label: "Harga gabah/kg (Rp)",
                                value: zakatRiceKgPrice,
                                placeholder: "16000",
                                onChangeText: setZakatRiceKgPrice,
                            })}
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>
                                    Pakai irigasi (tarif 5%)
                                </Text>
                                <Switch
                                    value={zakatHarvestIrrigated}
                                    onValueChange={setZakatHarvestIrrigated}
                                    trackColor={{
                                        false: colors.faint,
                                        true: colors.primary,
                                    }}
                                    thumbColor={colors.surface}
                                />
                            </View>
                            {harvest > 0 && harvest < NISAB_HARVEST_KG && (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        {
                                            color: "#D97706",
                                            marginBottom: spacing.sm,
                                        },
                                    ]}
                                >
                                    Panen kurang dari nisab ({NISAB_HARVEST_KG}{" "}
                                    kg), belum wajib zakat.
                                </Text>
                            )}
                            {renderZakatResult(
                                zakatAgriculture,
                                "Zakat Pertanian",
                                "primary",
                            )}
                            {session?.token && zakatAgriculture > 0 && (
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: zakatSaving,
                                    }}
                                    disabled={zakatSaving}
                                    onPress={() =>
                                        handleZakatSave(
                                            "pertanian",
                                            "Zakat Pertanian",
                                            zakatAgriculture,
                                        )
                                    }
                                    style={[
                                        styles.answerButton,
                                        {
                                            marginTop: spacing.sm,
                                            alignSelf: "stretch",
                                        },
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        {zakatSaving
                                            ? "Menyimpan..."
                                            : "Simpan"}
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    )}

                    {/* Zakat Emas & Perak */}
                    {zakatTab === 5 && (
                        <>
                            <Text style={styles.body}>
                                Nisab emas 85g, perak 595g. Wajib setelah 1
                                haul. Tarif 2,5%.
                            </Text>
                            {renderCurrencyInput({
                                label: "Harga emas/gram (Rp)",
                                value: zakatGoldPrice,
                                placeholder: "1050000",
                                onChangeText: setZakatGoldPrice,
                            })}
                            {renderCurrencyInput({
                                label: "Berat emas (gram)",
                                value: zakatGoldGrams,
                                placeholder: "0",
                                onChangeText: setZakatGoldGrams,
                            })}
                            {renderCurrencyInput({
                                label: "Harga perak/gram (Rp)",
                                value: zakatSilverPrice,
                                placeholder: "14000",
                                onChangeText: setZakatSilverPrice,
                            })}
                            {renderCurrencyInput({
                                label: "Berat perak (gram)",
                                value: zakatSilverGrams,
                                placeholder: "0",
                                onChangeText: setZakatSilverGrams,
                            })}
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>
                                    Sudah haul (1 tahun)
                                </Text>
                                <Switch
                                    value={zakatGoldHaul}
                                    onValueChange={setZakatGoldHaul}
                                    trackColor={{
                                        false: colors.faint,
                                        true: colors.primary,
                                    }}
                                    thumbColor={colors.surface}
                                />
                            </View>
                            {renderZakatResult(
                                zakatGold,
                                "Zakat Emas & Perak",
                                "amber",
                            )}
                            {session?.token && zakatGold > 0 && (
                                <Pressable
                                    accessibilityRole='button'
                                    accessibilityState={{
                                        disabled: zakatSaving,
                                    }}
                                    disabled={zakatSaving}
                                    onPress={() =>
                                        handleZakatSave(
                                            "emas_perak",
                                            "Zakat Emas & Perak",
                                            zakatGold,
                                            goldValue + silverValue,
                                            goldNisabValue,
                                        )
                                    }
                                    style={[
                                        styles.answerButton,
                                        {
                                            marginTop: spacing.sm,
                                            alignSelf: "stretch",
                                        },
                                    ]}
                                >
                                    <Text style={styles.answerText}>
                                        {zakatSaving
                                            ? "Menyimpan..."
                                            : "Simpan"}
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    )}

                    {/* Riwayat */}
                    {zakatTab === 6 && (
                        <>
                            <Text style={styles.body}>
                                Riwayat kalkulasi zakat tersimpan.
                            </Text>
                            {!session?.token ? (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        { marginTop: spacing.sm },
                                    ]}
                                >
                                    Masuk untuk sinkronisasi akun. Riwayat lokal
                                    tetap tersimpan di perangkat ini.
                                </Text>
                            ) : null}
                            {zakatHistory.length === 0 ? (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        { marginTop: spacing.sm },
                                    ]}
                                >
                                    Belum ada riwayat.
                                </Text>
                            ) : (
                                <ScrollView style={{ maxHeight: 300 }}>
                                    {zakatHistory.map((item) => (
                                        <ClassicZakatHistoryItem
                                            formatCurrency={formatCurrency}
                                            item={item}
                                            key={item.id}
                                            onDelete={handleDeleteZakat}
                                        />
                                    ))}
                                </ScrollView>
                            )}
                        </>
                    )}

                    {zakatSavedMsg ? (
                        <Text
                            style={{
                                textAlign: "center",
                                fontSize: 13,
                                color: colors.primary,
                                marginTop: spacing.sm,
                            }}
                        >
                            {zakatSavedMsg}
                        </Text>
                    ) : null}
                </Card>
            );
        }

        if (activeFeature.type === "faraidh") {
            const HEIR_FIELDS = [
                { key: "suami", max: 1, label: "Suami" },
                { key: "istri", max: 4, label: "Istri" },
                { key: "anakL", max: 20, label: "Anak Lk" },
                { key: "anakP", max: 20, label: "Anak Pr" },
                { key: "ayah", max: 1, label: "Ayah" },
                { key: "ibu", max: 1, label: "Ibu" },
                { key: "kakek", max: 1, label: "Kakek" },
                { key: "nenek", max: 4, label: "Nenek" },
                { key: "saudaraL", max: 20, label: "Sdr Lk" },
                { key: "saudaraP", max: 20, label: "Sdr Pr" },
            ];

            const setHeir = (key, delta) => {
                const field = HEIR_FIELDS.find((f) => f.key === key);
                setFaraidh((current) => {
                    const currentVal = current.heirs[key] ?? 0;
                    const next = Math.min(
                        field?.max ?? 20,
                        Math.max(0, currentVal + delta),
                    );
                    return {
                        ...current,
                        heirs: { ...current.heirs, [key]: next },
                    };
                });
            };

            const wealth = parseNumericInput(faraidh.estate);
            const debts = parseNumericInput(faraidh.debts);
            const requestedBequest = parseNumericInput(faraidh.bequest);
            const maxBequest = Math.floor(wealth / 3);
            const bequest = Math.min(requestedBequest, maxBequest);
            const distributable = Math.max(0, wealth - debts - bequest);
            const bequestCapped = wealth > 0 && requestedBequest > maxBequest;
            const calculation =
                distributable > 0
                    ? calculateFaraidh(faraidh.heirs, distributable)
                    : null;

            const handleSaveFaraidh = async () => {
                setSavingFaraidh(true);
                const payload = {
                    wealth,
                    debt: debts,
                    funeral: 0,
                    will: bequest,
                    heirs_json: JSON.stringify(faraidh.heirs),
                    result_summary: calculation
                        ? calculation.rows
                              .map((r) => {
                                  const label =
                                      HEIR_LABELS[r.key]?.idn ?? r.key;
                                  return `${label}: ${Math.round(r.share * 100)}%`;
                              })
                              .join(", ")
                        : "",
                    catatan: faraidhCatatan,
                };
                try {
                    if (session?.token) {
                        await saveFaraidh(payload);
                        showSuccess("Kalkulasi faraidh tersimpan ke akun.");
                    } else {
                        await saveCalculatorHistory("faraidh", payload);
                        showSuccess(
                            "Kalkulasi faraidh tersimpan di perangkat.",
                        );
                    }
                    setFaraidhCatatan("");
                } catch (err) {
                    showError(err?.message ?? "Gagal menyimpan.");
                } finally {
                    setSavingFaraidh(false);
                }
            };

            const handleLoadFaraidhHistory = async () => {
                try {
                    const localItems = await readCalculatorHistory("faraidh");
                    const remoteItems = session?.token
                        ? await getFaraidhHistory()
                        : [];
                    setFaraidhHistory(
                        mergeCalculatorHistory(remoteItems, localItems),
                    );
                    setShowFaraidhHistory(true);
                } catch {
                    showError("Riwayat belum bisa dimuat.");
                }
            };

            const handleDeleteFaraidh = async (id) => {
                try {
                    if (`${id ?? ""}`.startsWith("local-faraidh-")) {
                        await deleteCalculatorHistory("faraidh", id);
                    } else {
                        await deleteFaraidh(id);
                    }
                    setFaraidhHistory((current) =>
                        current.filter((item) => item.id !== id),
                    );
                    showSuccess("Item riwayat dihapus.");
                } catch {
                    showError("Gagal menghapus.");
                }
            };

            if (showFaraidhHistory) {
                return (
                    <Card>
                        <CardTitle
                            meta={`${faraidhHistory.length} item`}
                            actions={
                                <ActionPill
                                    label='Kembali'
                                    onPress={() => setShowFaraidhHistory(false)}
                                />
                            }
                        >
                            Riwayat Faraidh
                        </CardTitle>
                        {!session?.token ? (
                            <Text style={styles.body}>
                                Masuk untuk sinkronisasi akun. Riwayat lokal
                                tetap tersimpan di perangkat ini.
                            </Text>
                        ) : null}
                        {faraidhHistory.length === 0 ? (
                            <Text style={styles.body}>
                                Belum ada kalkulasi yang tersimpan.
                            </Text>
                        ) : (
                            faraidhHistory.map((item) => (
                                <View key={item.id} style={styles.trackerRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={styles.faraidhHistoryAmount}
                                        >
                                            {formatCurrency(item.wealth ?? 0)}
                                        </Text>
                                        {item.result_summary ? (
                                            <Text style={styles.detailLine}>
                                                {item.result_summary}
                                            </Text>
                                        ) : null}
                                        <Text style={styles.detailLine}>
                                            {item.is_local
                                                ? "Perangkat ini"
                                                : "Akun tersinkron"}
                                        </Text>
                                        <Text style={styles.detailLine}>
                                            {new Date(
                                                item.created_at ??
                                                    item.createdAt ??
                                                    "",
                                            ).toLocaleDateString("id-ID")}
                                        </Text>
                                    </View>
                                    <Pressable
                                        accessibilityRole='button'
                                        android_ripple={{
                                            color: "rgba(220, 80, 80, 0.12)",
                                            borderless: false,
                                        }}
                                        onPress={() =>
                                            handleDeleteFaraidh(item.id)
                                        }
                                        style={styles.secondaryButton}
                                    >
                                        <Text
                                            style={[
                                                styles.secondaryButtonText,
                                                { color: colors.danger },
                                            ]}
                                        >
                                            Hapus
                                        </Text>
                                    </Pressable>
                                </View>
                            ))
                        )}
                    </Card>
                );
            }

            return (
                <Card>
                    <CardTitle meta='Perencana Waris'>
                        {activeFeature.title}
                    </CardTitle>
                    <Text style={styles.body}>
                        Hitung pembagian waris sesuai syariah. Pilih ahli waris,
                        atur jumlahnya, dan lihat hasil bagi.
                    </Text>

                    {renderCurrencyInput({
                        label: "Harta warisan",
                        value: faraidh.estate,
                        placeholder: "0",
                        onChangeText: (v) =>
                            setFaraidh((current) => ({
                                ...current,
                                estate: v,
                            })),
                    })}
                    {renderCurrencyInput({
                        label: "Utang dan biaya",
                        value: faraidh.debts,
                        placeholder: "0",
                        onChangeText: (v) =>
                            setFaraidh((current) => ({ ...current, debts: v })),
                    })}
                    {renderCurrencyInput({
                        label: "Wasiat",
                        value: faraidh.bequest,
                        placeholder: "0",
                        onChangeText: (v) =>
                            setFaraidh((current) => ({
                                ...current,
                                bequest: v,
                            })),
                    })}

                    <Text
                        style={[styles.inputLabel, { marginTop: spacing.md }]}
                    >
                        Ahli Waris
                    </Text>
                    <View style={styles.heirGrid}>
                        {HEIR_FIELDS.map((field) => {
                            const count = faraidh.heirs[field.key] ?? 0;
                            return (
                                <View key={field.key} style={styles.heirItem}>
                                    <Text style={styles.heirLabel}>
                                        {field.label}
                                    </Text>
                                    <Text style={styles.heirCount}>
                                        {count}
                                    </Text>
                                    <View style={styles.heirActions}>
                                        <Pressable
                                            accessibilityRole='button'
                                            onPress={() =>
                                                setHeir(field.key, -1)
                                            }
                                            accessibilityState={{
                                                disabled: count === 0,
                                            }}
                                            disabled={count === 0}
                                            style={[
                                                styles.heirButton,
                                                count === 0 &&
                                                    styles.heirButtonDisabled,
                                            ]}
                                        >
                                            <Text style={styles.heirButtonText}>
                                                −
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            accessibilityRole='button'
                                            onPress={() =>
                                                setHeir(field.key, 1)
                                            }
                                            accessibilityState={{
                                                disabled: count >= field.max,
                                            }}
                                            disabled={count >= field.max}
                                            style={[
                                                styles.heirButton,
                                                count >= field.max &&
                                                    styles.heirButtonDisabled,
                                            ]}
                                        >
                                            <Text style={styles.heirButtonText}>
                                                +
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {calculation ? (
                        <View style={styles.resultPanel}>
                            {calculation.applied.musytarakah ? (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        styles.statusNoteActive,
                                    ]}
                                >
                                    Musytarakah: suami + ibu + saudara berbagi
                                    1/3 bersama.
                                </Text>
                            ) : null}
                            {calculation.applied.aul ? (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        styles.statusNoteWarning,
                                    ]}
                                >
                                    Aul: penyebut dinaikkan agar total bagian
                                    tidak melebihi 1.
                                </Text>
                            ) : null}
                            {calculation.applied.radd ? (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        styles.statusNoteActive,
                                    ]}
                                >
                                    Radd: sisa harta dikembalikan ke ahli waris
                                    (selain suami/istri).
                                </Text>
                            ) : null}
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>
                                    Harta awal
                                </Text>
                                <Text style={styles.resultValue}>
                                    {formatCurrency(wealth)}
                                </Text>
                            </View>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Wasiat</Text>
                                <Text style={styles.resultValue}>
                                    {formatCurrency(bequest)}
                                </Text>
                            </View>
                            <View style={styles.resultDivider} />
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabelStrong}>
                                    Harta dibagikan
                                </Text>
                                <Text style={styles.resultValueStrong}>
                                    {formatCurrency(distributable)}
                                </Text>
                            </View>
                            {bequestCapped ? (
                                <Text
                                    style={[
                                        styles.statusNote,
                                        styles.statusNoteWarning,
                                    ]}
                                >
                                    Wasiat melebihi batas, dihitung maksimal{" "}
                                    {formatCurrency(maxBequest)}.
                                </Text>
                            ) : null}
                            <View style={styles.resultDivider} />
                            <Text style={[styles.inputLabel, { marginTop: 0 }]}>
                                Hasil Bagi
                            </Text>
                            {calculation.rows.map((row) => {
                                const label =
                                    HEIR_LABELS[row.key]?.idn ?? row.key;
                                return (
                                    <View
                                        key={row.key}
                                        style={styles.resultRow}
                                    >
                                        <Text style={styles.resultLabel}>
                                            {label}
                                            {row.count > 1
                                                ? ` (${row.count} org)`
                                                : ""}
                                        </Text>
                                        <Text style={styles.resultValue}>
                                            {row.fraction
                                                ? `${row.fraction.num}/${row.fraction.den}`
                                                : "Sisa"}{" "}
                                            {Math.round(row.share * 100)}%
                                        </Text>
                                        <Text
                                            style={[
                                                styles.resultValue,
                                                { minWidth: 90 },
                                            ]}
                                        >
                                            {formatCurrency(row.amount)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <Text
                            style={[
                                styles.statusNote,
                                { marginTop: spacing.md },
                            ]}
                        >
                            Pilih total harta dan ahli waris untuk melihat hasil
                            pembagian.
                        </Text>
                    )}

                    <View
                        style={[styles.formActions, { marginTop: spacing.md }]}
                    >
                        <Pressable
                            accessibilityLabel='Simpan kalkulasi faraidh'
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(255,255,255,0.16)",
                                borderless: false,
                            }}
                            accessibilityState={{
                                disabled: savingFaraidh || distributable <= 0,
                            }}
                            disabled={savingFaraidh || distributable <= 0}
                            onPress={handleSaveFaraidh}
                            style={[
                                styles.primaryButton,
                                styles.formPrimaryButton,
                                (savingFaraidh || distributable <= 0) &&
                                    styles.disabledButton,
                            ]}
                        >
                            <Text style={styles.primaryButtonText}>
                                {savingFaraidh ? "Menyimpan..." : "Simpan"}
                            </Text>
                        </Pressable>
                        <Pressable
                            accessibilityLabel='Riwayat kalkulasi faraidh'
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            onPress={handleLoadFaraidhHistory}
                            style={styles.secondaryButton}
                        >
                            <Text style={styles.secondaryButtonText}>
                                Riwayat
                            </Text>
                        </Pressable>
                    </View>
                </Card>
            );
        }

        if (activeFeature.type === "forum") {
            if (forumView === "ask") {
                return (
                    <Card>
                        <CardTitle
                            actions={
                                <ActionPill
                                    label='Kembali'
                                    onPress={() => {
                                        setForumView("list");
                                        setForumError("");
                                    }}
                                />
                            }
                        >
                            Ajukan Pertanyaan
                        </CardTitle>
                        <TextInput
                            onChangeText={setForumAskTitle}
                            placeholder='Judul pertanyaan (min 10 karakter)'
                            placeholderTextColor={colors.muted}
                            style={styles.inputField}
                            value={forumAskTitle}
                        />
                        <TextInput
                            multiline
                            onChangeText={setForumAskBody}
                            placeholder='Isi pertanyaan (min 20 karakter)'
                            placeholderTextColor={colors.muted}
                            style={[styles.inputField, { minHeight: 120 }]}
                            textAlignVertical='top'
                            value={forumAskBody}
                        />
                        <TextInput
                            autoCapitalize='none'
                            onChangeText={setForumAskTags}
                            placeholder='Tag (pisahkan dengan koma, opsional)'
                            placeholderTextColor={colors.muted}
                            style={styles.inputField}
                            value={forumAskTags}
                        />
                        {forumError ? (
                            <Text
                                style={[
                                    styles.statusNote,
                                    { color: colors.danger },
                                ]}
                            >
                                {forumError}
                            </Text>
                        ) : null}
                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(255,255,255,0.16)",
                                borderless: false,
                            }}
                            disabled={
                                forumSaving ||
                                forumAskTitle.length < 10 ||
                                forumAskBody.length < 20
                            }
                            onPress={async () => {
                                if (!session?.token) {
                                    showInfo(
                                        "Buka Profil untuk masuk dan bertanya.",
                                    );
                                    return;
                                }
                                setForumSaving(true);
                                setForumError("");
                                try {
                                    const result = await createForumQuestion({
                                        title: forumAskTitle.trim(),
                                        body: forumAskBody.trim(),
                                        tags: forumAskTags.trim(),
                                    });
                                    const slug = result?.slug ?? "";
                                    setForumAskTitle("");
                                    setForumAskBody("");
                                    setForumAskTags("");
                                    if (slug) {
                                        setForumLoading(true);
                                        try {
                                            const detail =
                                                await getForumQuestion(slug);
                                            setForumDetail(detail.question);
                                            setForumAnswers(detail.answers);
                                            setForumSlug(slug);
                                            setForumView("detail");
                                        } finally {
                                            setForumLoading(false);
                                        }
                                    } else {
                                        setForumView("list");
                                    }
                                } catch (err) {
                                    setForumError(
                                        err?.message ??
                                            "Gagal mengirim pertanyaan.",
                                    );
                                } finally {
                                    setForumSaving(false);
                                }
                            }}
                            style={[
                                styles.primaryButton,
                                (forumSaving ||
                                    forumAskTitle.length < 10 ||
                                    forumAskBody.length < 20) &&
                                    styles.disabledButton,
                            ]}
                        >
                            <Text style={styles.primaryButtonText}>
                                {forumSaving
                                    ? "Mengirim..."
                                    : "Kirim Pertanyaan"}
                            </Text>
                        </Pressable>
                    </Card>
                );
            }

            if (forumView === "detail") {
                return (
                    <Card>
                        <CardTitle
                            actions={
                                <ActionPill
                                    label='Kembali'
                                    onPress={() => {
                                        setForumView("list");
                                        setForumDetail(null);
                                        setForumAnswers([]);
                                    }}
                                />
                            }
                        >
                            {forumDetail?.title ?? "Detail"}
                        </CardTitle>
                        {forumLoading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : !forumDetail ? (
                            <Text style={styles.body}>
                                Pertanyaan tidak ditemukan.
                            </Text>
                        ) : (
                            <>
                                <Text style={styles.body}>
                                    {forumDetail.body}
                                </Text>
                                {forumDetail.tags?.length > 0 ? (
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            flexWrap: "wrap",
                                            gap: 4,
                                            marginTop: spacing.sm,
                                        }}
                                    >
                                        {forumDetail.tags.map((tag) => (
                                            <View
                                                key={tag}
                                                style={styles.badge}
                                            >
                                                <Text style={styles.badgeText}>
                                                    {tag}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : null}
                                <Text
                                    style={[
                                        styles.statusNote,
                                        { marginTop: spacing.sm },
                                    ]}
                                >
                                    {forumDetail.user?.name} ·{" "}
                                    {forumDetail.answerCount} jawaban ·{" "}
                                    {forumDetail.voteCount} suara
                                </Text>
                                <View
                                    style={[
                                        styles.answerRow,
                                        {
                                            justifyContent: "flex-start",
                                            marginTop: spacing.sm,
                                        },
                                    ]}
                                >
                                    {[
                                        { label: "▲ Pertanyaan", value: 1 },
                                        { label: "▼ Pertanyaan", value: -1 },
                                    ].map((action) => (
                                        <Pressable
                                            accessibilityRole='button'
                                            key={action.label}
                                            android_ripple={{
                                                color: "rgba(91, 110, 91, 0.12)",
                                                borderless: false,
                                            }}
                                            disabled={
                                                forumVotingId ===
                                                `${forumDetail.id}-${action.value}`
                                            }
                                            onPress={async () => {
                                                if (!session?.token) {
                                                    showInfo(
                                                        "Buka Profil untuk memberi suara.",
                                                    );
                                                    return;
                                                }
                                                setForumVotingId(
                                                    `${forumDetail.id}-${action.value}`,
                                                );
                                                try {
                                                    await voteForum({
                                                        targetType: "question",
                                                        targetId:
                                                            forumDetail.id,
                                                        value: action.value,
                                                    });
                                                    setForumDetail((current) =>
                                                        current
                                                            ? {
                                                                  ...current,
                                                                  voteCount:
                                                                      current.voteCount +
                                                                      action.value,
                                                              }
                                                            : current,
                                                    );
                                                } catch {
                                                    showError(
                                                        "Gagal memberi suara.",
                                                    );
                                                }
                                                setForumVotingId("");
                                            }}
                                            style={styles.answerButton}
                                        >
                                            <Text style={styles.answerText}>
                                                {action.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                {forumAnswers.length === 0 ? (
                                    <Text
                                        style={[
                                            styles.statusNote,
                                            { marginTop: spacing.md },
                                        ]}
                                    >
                                        Belum ada jawaban.
                                    </Text>
                                ) : (
                                    forumAnswers.map((answer) => (
                                        <View
                                            key={answer.id}
                                            style={[
                                                styles.trackerRow,
                                                {
                                                    alignItems: "flex-start",
                                                    marginTop: spacing.sm,
                                                },
                                            ]}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.body}>
                                                    {answer.body}
                                                </Text>
                                                <View
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        gap: spacing.sm,
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    <Text
                                                        style={
                                                            styles.statusNote
                                                        }
                                                    >
                                                        {answer.user?.name}
                                                    </Text>
                                                    {answer.isAccepted ? (
                                                        <Text
                                                            style={[
                                                                styles.badgeText,
                                                                {
                                                                    color: "#16a34a",
                                                                },
                                                            ]}
                                                        >
                                                            Diterima
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </View>
                                            <View
                                                style={{
                                                    alignItems: "center",
                                                    gap: 4,
                                                    minWidth: 52,
                                                }}
                                            >
                                                {[1, -1].map((value) => (
                                                    <Pressable
                                                        accessibilityRole='button'
                                                        key={value}
                                                        android_ripple={{
                                                            color: "rgba(91, 110, 91, 0.12)",
                                                            borderless: false,
                                                        }}
                                                        disabled={
                                                            forumVotingId ===
                                                            `${answer.id}-${value}`
                                                        }
                                                        onPress={async () => {
                                                            if (
                                                                !session?.token
                                                            ) {
                                                                showInfo(
                                                                    "Buka Profil untuk memberi suara.",
                                                                );
                                                                return;
                                                            }
                                                            setForumVotingId(
                                                                `${answer.id}-${value}`,
                                                            );
                                                            try {
                                                                await voteForum(
                                                                    {
                                                                        targetType:
                                                                            "answer",
                                                                        targetId:
                                                                            answer.id,
                                                                        value,
                                                                    },
                                                                );
                                                                setForumAnswers(
                                                                    (prev) =>
                                                                        prev.map(
                                                                            (
                                                                                a,
                                                                            ) =>
                                                                                a.id ===
                                                                                answer.id
                                                                                    ? {
                                                                                          ...a,
                                                                                          voteCount:
                                                                                              a.voteCount +
                                                                                              value,
                                                                                      }
                                                                                    : a,
                                                                        ),
                                                                );
                                                            } catch {
                                                                showError(
                                                                    "Gagal memberi suara.",
                                                                );
                                                            }
                                                            setForumVotingId(
                                                                "",
                                                            );
                                                        }}
                                                        style={
                                                            styles.answerButton
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.answerText
                                                            }
                                                        >
                                                            {value > 0
                                                                ? "▲"
                                                                : "▼"}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                                <Text
                                                    style={{
                                                        color: colors.text,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {answer.voteCount}
                                                </Text>
                                                {session?.token &&
                                                !answer.isAccepted ? (
                                                    <Pressable
                                                        accessibilityRole='button'
                                                        android_ripple={{
                                                            color: "rgba(91, 110, 91, 0.12)",
                                                            borderless: false,
                                                        }}
                                                        disabled={
                                                            forumVotingId ===
                                                            `accept-${answer.id}`
                                                        }
                                                        onPress={async () => {
                                                            setForumVotingId(
                                                                `accept-${answer.id}`,
                                                            );
                                                            try {
                                                                await acceptForumAnswer(
                                                                    forumDetail.id,
                                                                    answer.id,
                                                                );
                                                                const updated =
                                                                    await getForumQuestion(
                                                                        forumSlug,
                                                                    );
                                                                setForumDetail(
                                                                    updated.question,
                                                                );
                                                                setForumAnswers(
                                                                    updated.answers,
                                                                );
                                                            } catch {
                                                                showError(
                                                                    "Jawaban belum bisa diterima.",
                                                                );
                                                            }
                                                            setForumVotingId(
                                                                "",
                                                            );
                                                        }}
                                                        style={
                                                            styles.answerButton
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.answerText
                                                            }
                                                        >
                                                            Terima
                                                        </Text>
                                                    </Pressable>
                                                ) : null}
                                            </View>
                                        </View>
                                    ))
                                )}

                                {session?.token ? (
                                    <>
                                        <TextInput
                                            multiline
                                            onChangeText={setForumAnswerDraft}
                                            placeholder='Tulis jawaban...'
                                            placeholderTextColor={colors.muted}
                                            style={[
                                                styles.inputField,
                                                {
                                                    minHeight: 80,
                                                    marginTop: spacing.md,
                                                },
                                            ]}
                                            textAlignVertical='top'
                                            value={forumAnswerDraft}
                                        />
                                        <Pressable
                                            accessibilityRole='button'
                                            android_ripple={{
                                                color: "rgba(255,255,255,0.16)",
                                                borderless: false,
                                            }}
                                            disabled={
                                                forumSaving ||
                                                forumAnswerDraft.trim().length <
                                                    10
                                            }
                                            onPress={async () => {
                                                setForumSaving(true);
                                                try {
                                                    await createForumAnswer(
                                                        forumDetail.id,
                                                        {
                                                            body: forumAnswerDraft.trim(),
                                                        },
                                                    );
                                                    setForumAnswerDraft("");
                                                    const updated =
                                                        await getForumQuestion(
                                                            forumSlug,
                                                        );
                                                    setForumDetail(
                                                        updated.question,
                                                    );
                                                    setForumAnswers(
                                                        updated.answers,
                                                    );
                                                } catch {
                                                    showError(
                                                        "Gagal mengirim jawaban.",
                                                    );
                                                }
                                                setForumSaving(false);
                                            }}
                                            style={[
                                                styles.primaryButton,
                                                (forumSaving ||
                                                    forumAnswerDraft.trim()
                                                        .length < 10) &&
                                                    styles.disabledButton,
                                            ]}
                                        >
                                            <Text
                                                style={styles.primaryButtonText}
                                            >
                                                {forumSaving
                                                    ? "Mengirim..."
                                                    : "Kirim Jawaban"}
                                            </Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    <Text
                                        style={[
                                            styles.statusNote,
                                            { marginTop: spacing.md },
                                        ]}
                                    >
                                        Buka Profil untuk masuk dan menjawab
                                        pertanyaan.
                                    </Text>
                                )}
                            </>
                        )}
                    </Card>
                );
            }

            return (
                <Card>
                    <CardTitle meta={`${forumTotal} pertanyaan`}>
                        {activeFeature.title}
                    </CardTitle>
                    <TextInput
                        onChangeText={(v) => {
                            setForumSearch(v);
                        }}
                        onSubmitEditing={async () => {
                            setForumLoading(true);
                            setForumError("");
                            try {
                                const result = await getForumQuestions({
                                    page: 0,
                                    size: 10,
                                    q: forumSearch.trim(),
                                });
                                setForumQuestions(result.items);
                                setForumTotal(result.total);
                                setForumPage(0);
                                setForumHasMore(result.hasMore);
                            } catch (err) {
                                setForumError(
                                    err?.message ?? "Pencarian gagal.",
                                );
                            }
                            setForumLoading(false);
                        }}
                        placeholder='Cari pertanyaan...'
                        placeholderTextColor={colors.muted}
                        returnKeyType='search'
                        style={styles.inputField}
                        value={forumSearch}
                    />
                    {forumError ? (
                        <Text
                            style={[
                                styles.statusNote,
                                { color: colors.danger },
                            ]}
                        >
                            {forumError}
                        </Text>
                    ) : null}
                    {forumLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : forumQuestions.length === 0 ? (
                        <Text
                            style={[
                                styles.statusNote,
                                { marginTop: spacing.md },
                            ]}
                        >
                            Belum ada pertanyaan.
                        </Text>
                    ) : (
                        forumQuestions.map((q) => (
                            <Pressable
                                accessibilityRole='button'
                                key={q.id}
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.12)",
                                    borderless: false,
                                }}
                                onPress={async () => {
                                    setForumLoading(true);
                                    setForumError("");
                                    try {
                                        const detail = await getForumQuestion(
                                            q.slug,
                                        );
                                        setForumDetail(detail.question);
                                        setForumAnswers(detail.answers);
                                        setForumSlug(q.slug);
                                        setForumView("detail");
                                    } catch (err) {
                                        setForumError(
                                            err?.message ??
                                                "Detail belum bisa dimuat.",
                                        );
                                    }
                                    setForumLoading(false);
                                }}
                                style={[
                                    styles.trackerRow,
                                    { alignItems: "flex-start" },
                                ]}
                            >
                                <View style={{ flex: 1 }}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.inputLabel,
                                                { flex: 1, marginBottom: 0 },
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {q.title}
                                        </Text>
                                        {q.isAnswered ? (
                                            <Text
                                                style={{
                                                    color: "#16a34a",
                                                    fontSize: 11,
                                                    fontWeight: "700",
                                                }}
                                            >
                                                Terjawab
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text
                                        style={[
                                            styles.statusNote,
                                            { marginTop: 2 },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {q.body}
                                    </Text>
                                    {q.tags?.length > 0 ? (
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                flexWrap: "wrap",
                                                gap: 4,
                                                marginTop: 4,
                                            }}
                                        >
                                            {q.tags.slice(0, 3).map((tag) => (
                                                <View
                                                    key={tag}
                                                    style={styles.badge}
                                                >
                                                    <Text
                                                        style={styles.badgeText}
                                                    >
                                                        {tag}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : null}
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            gap: spacing.md,
                                            marginTop: 4,
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.statusNote,
                                                { fontSize: 11 },
                                            ]}
                                        >
                                            {q.user?.name}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.statusNote,
                                                { fontSize: 11 },
                                            ]}
                                        >
                                            {q.answerCount} jawaban
                                        </Text>
                                        <Text
                                            style={[
                                                styles.statusNote,
                                                { fontSize: 11 },
                                            ]}
                                        >
                                            {q.voteCount} suara
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))
                    )}
                    {forumHasMore ? (
                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            onPress={async () => {
                                const nextPage = forumPage + 1;
                                setForumLoading(true);
                                try {
                                    const result = await getForumQuestions({
                                        page: nextPage,
                                        size: 10,
                                        q: forumSearch.trim(),
                                    });
                                    setForumQuestions((prev) => [
                                        ...prev,
                                        ...result.items,
                                    ]);
                                    setForumTotal(result.total);
                                    setForumPage(nextPage);
                                    setForumHasMore(result.hasMore);
                                } catch {
                                    /* silent */
                                }
                                setForumLoading(false);
                            }}
                            style={styles.secondaryButton}
                        >
                            <Text style={styles.secondaryButtonText}>
                                Muat lebih banyak
                            </Text>
                        </Pressable>
                    ) : null}
                    <View style={{ marginTop: spacing.md }}>
                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(255,255,255,0.16)",
                                borderless: false,
                            }}
                            onPress={() => {
                                setForumView("ask");
                                setForumAskTitle("");
                                setForumAskBody("");
                                setForumAskTags("");
                                setForumError("");
                            }}
                            style={styles.primaryButton}
                        >
                            <Text style={styles.primaryButtonText}>
                                Ajukan Pertanyaan
                            </Text>
                        </Pressable>
                    </View>
                </Card>
            );
        }

        if (activeFeature.type === "sholat-tracker") {
            const doneCount = PRAYER_ITEMS.filter(
                (p) => sholatLog[p.key],
            ).length;
            return (
                <Card>
                    <CardTitle meta={`${doneCount}/5 sholat`}>
                        Sholat Tracker
                    </CardTitle>
                    <Text style={styles.body}>
                        Catat sholat yang telah kamu kerjakan hari ini.
                    </Text>
                    <View style={styles.trackerList}>
                        {PRAYER_ITEMS.map((p) => (
                            <Pressable
                                accessibilityRole='button'
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.12)",
                                    borderless: false,
                                }}
                                key={p.key}
                                onPress={() => togglePrayer(p.key)}
                                style={styles.trackerRow}
                            >
                                {sholatLog[p.key] ? (
                                    <CheckCircle2
                                        color={colors.primary}
                                        size={22}
                                        strokeWidth={2.5}
                                    />
                                ) : (
                                    <Circle
                                        color={colors.faint}
                                        size={22}
                                        strokeWidth={2}
                                    />
                                )}
                                <Text
                                    style={[
                                        styles.trackerLabel,
                                        sholatLog[p.key] &&
                                            styles.trackerLabelDone,
                                    ]}
                                >
                                    {p.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Card>
            );
        }

        if (activeFeature.type === "notifications") {
            return <NotificationCenter />;
        }

        if (activeFeature.type === "historical-map") {
            return (
                <Card>
                    <CardTitle meta='Lokasi bersejarah'>
                        Peta Islam Interaktif
                    </CardTitle>
                    <HistoricalMapContent />
                </Card>
            );
        }

        if (activeFeature.type === "tokoh") {
            return (
                <Card>
                    <CardTitle>Tokoh Tarikh</CardTitle>
                    <TokohTarikhContent />
                </Card>
            );
        }

        return null;
    };

    const clearFeature = () => {
        const returnRoute = featureReturnRoute;
        setActiveFeature(null);
        setFeatureReturnRoute(null);
        setItems([]);
        setSelectedItem(null);
        setError("");
        setActiveNoteRef("");
        setLibraryProgressFilter("");
        setNotesSearch("");
        setBlogCategoryOptions([]);
        if (returnRoute?.tab && returnRoute?.view) {
            navigation?.open?.(returnRoute.tab, returnRoute.view, {
                returnTab: null,
            });
        }
    };

    return {
        clearFeature,
        renderDetailScreen,
        renderFeatureContent,
        renderItem,
        renderItemActionSheet,
        renderLibraryProgressFilters,
    };
}
