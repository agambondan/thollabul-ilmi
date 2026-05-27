import { BookOpen, Bookmark, CheckCircle2, Circle, Flag, Pencil, StickyNote, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { NotificationCenter } from '../../components/NotificationCenter';
import { colors } from '../../theme';
import { styles } from '../ExploreScreen.styles';
import {
  KAJIAN_CATEGORIES,
  LEADERBOARD_TABS,
  WEB_APP_EXPLORE_ACCENT,
  WEB_APP_EXPLORE_BG,
  WEB_APP_EXPLORE_BORDER,
  WEB_APP_EXPLORE_MUTED,
  WEB_APP_EXPLORE_SURFACE,
  formatBlogDate,
  formatCompactStat,
  formatNoteDate,
  getBlogAuthor,
  getBlogCategories,
  getBlogCategoryLabel,
  getBlogExcerpt,
  getBlogRaw,
  getBlogTitle,
  getBookmarkTypeLabel,
  getExploreItemKey,
  getFilteredBlogItems,
  getFilteredKajianItems,
  getGoalCompleted,
  getGoalMetaLine,
  getGoalProgress,
  getHafalanItemProgress,
  getHafalanItemTitle,
  getHafalanMetaLine,
  getHafalanStatus,
  getHafalanStatusLabel,
  getHafalanSummary,
  getKajianDescription,
  getKajianDuration,
  getKajianSpeaker,
  getKajianSummary,
  getKajianTitle,
  getKajianTopic,
  getKajianType,
  getKajianUrl,
  getLeaderboardEntries,
  getLeaderboardName,
  getLeaderboardRank,
  getLeaderboardScore,
  getMuhasabahContent,
  getMuhasabahDateLabel,
  getMuhasabahMoodLabel,
  getMurojaahItemTitle,
  getMurojaahMetaLine,
  getMurojaahStatus,
  getMurojaahStatusLabel,
  getMurojaahSummary,
  getNoteTags,
  getStatsPrayerRows,
  getStatsSummary,
  getTilawahAyahLine,
  getTilawahDate,
  getTilawahNotes,
  getTilawahPages,
  getTilawahSummary,
  getTilawahSurah,
  normalizeBookmarkType,
  normalizeSearchText,
} from '../ExploreScreen.helpers';
import { FeatureCatalog } from './FeatureCatalog';
import { WebAppBlogRoute } from './WebAppBlogRoute';
import { WebAppFeedRoute } from './WebAppFeedRoute';
import { WebAppFiqhRoute } from './WebAppFiqhRoute';
import { WebAppForumRoute } from './WebAppForumRoute';
import { WebAppKajianRoute } from './WebAppKajianRoute';
import { WebAppKamusRoute } from './WebAppKamusRoute';
import { WebAppLibraryRoute } from './WebAppLibraryRoute';
import { WebAppLeaderboardRoute } from './WebAppLeaderboardRoute';
import { WebAppPerawiRoute } from './WebAppPerawiRoute';

export function renderExploreWebAppRoute(context) {
  const {
    activeFeature,
    blogCategory,
    blogCategoryOptions,
    blogSearch,
    clearFeature,
    dictionaryInputRef,
    dictionaryQuery,
    error,
    featureSearch,
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
    items,
    kajianCategory,
    kajianSearch,
    leaderboardTab,
    libraryProgressFilter,
    libraryProgressMap,
    likingFeedId,
    loadFeature,
    loadMoreFeature,
    loading,
    notesSearch,
    onOpenKajianUrl,
    openItemDetail,
    pagination,
    pinnedFeatureKeys,
    recentFeatureKeys,
    renderItemActionSheet,
    runDictionarySearch,
    session,
    setActiveNoteRef,
    setBlogCategory,
    setBlogSearch,
    setDictionaryQuery,
    setFeatureSearch,
    setForumAnswerDraft,
    setForumAnswers,
    setForumAskBody,
    setForumAskTags,
    setForumAskTitle,
    setForumDetail,
    setForumError,
    setForumHasMore,
    setForumLoading,
    setForumPage,
    setForumQuestions,
    setForumSaving,
    setForumSearch,
    setForumSlug,
    setForumTotal,
    setForumView,
    setForumVotingId,
    setItemActionSheet,
    setKajianCategory,
    setKajianSearch,
    setLeaderboardTab,
    setLibraryProgressFilter,
    setNotesSearch,
    setSelectedItem,
    showError,
    showInfo,
    visibleItems,
  } = context;

  const renderWebAppBookmarkCard = (item, index) => {
    const raw = item?.raw ?? {};
    const type = normalizeBookmarkType(raw.ref_type ?? item?.meta);
    const refId = raw.ref_id ?? item?.id;
    const label = getBookmarkTypeLabel(type);

    return (
      <Pressable
        android_ripple={{ color: 'rgba(52, 211, 153, 0.12)', borderless: false }}
        key={`${getExploreItemKey(item)}-${index}`}
        onLongPress={() => setItemActionSheet({ visible: true, item })}
        onPress={() => openItemDetail(item)}
        style={styles.webAppBookmarkCard}
        testID="web-app-bookmark-card"
      >
        <View style={styles.webAppBookmarkStripe} />
        <View style={styles.webAppBookmarkBody}>
          <View style={styles.webAppBookmarkHeader}>
            <Text style={styles.webAppBookmarkType}>{label}</Text>
            <Text style={styles.webAppBookmarkRef}>{refId ? `#${refId}` : 'Tersimpan'}</Text>
          </View>
          <Text numberOfLines={2} style={styles.webAppBookmarkTitle}>
            {item.title || `${label} tersimpan`}
          </Text>
          {item.body ? (
            <Text numberOfLines={3} style={styles.webAppBookmarkText}>
              {item.body}
            </Text>
          ) : null}
          {raw.ref_slug ? (
            <Text numberOfLines={1} style={styles.webAppBookmarkSlug}>
              {raw.ref_slug}
            </Text>
          ) : null}
          <View style={styles.webAppBookmarkFooter}>
            <Text style={styles.webAppBookmarkHint}>Ketuk untuk detail</Text>
            <Pressable
              hitSlop={10}
              onPress={() => setItemActionSheet({ visible: true, item })}
              style={styles.webAppBookmarkManage}
              testID="web-app-bookmark-manage"
            >
              <Text style={styles.webAppBookmarkManageText}>Kelola</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderWebAppBookmarksScreen = () => {
    const groupedBookmarks = visibleItems.reduce((acc, item) => {
      const type = normalizeBookmarkType(item?.raw?.ref_type ?? item?.meta);
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-bookmarks-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-bookmarks-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PERSONAL</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Bookmark</Text>
            <Text style={styles.webAppBookmarksCount}>{items.length} item</Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Ayat, hadith, dan referensi yang kamu simpan dari dashboard belajar.
          </Text>
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat bookmark...</Text>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <Bookmark color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Belum ada bookmark.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Tandai ayat atau hadith favoritmu saat membaca.
            </Text>
          </View>
        ) : null}
        {!loading && !error && items.length > 0 ? (
          <View style={styles.webAppBookmarksGroups}>
            {Object.entries(groupedBookmarks).map(([type, groupItems]) => (
              <View key={type} style={styles.webAppBookmarksGroup}>
                <View style={styles.webAppBookmarksGroupHeader}>
                  <Text style={styles.webAppBookmarksGroupTitle}>{getBookmarkTypeLabel(type)}</Text>
                  <Text style={styles.webAppBookmarksGroupCount}>{groupItems.length}</Text>
                </View>
                {groupItems.map(renderWebAppBookmarkCard)}
              </View>
            ))}
          </View>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppNoteCard = (item, index) => {
    const tags = getNoteTags(item);
    const date = formatNoteDate(item?.raw?.date ?? item?.raw?.created_at ?? item?.date);

    return (
      <Pressable
        android_ripple={{ color: 'rgba(52, 211, 153, 0.12)', borderless: false }}
        key={`${getExploreItemKey(item)}-${index}`}
        onLongPress={() => setItemActionSheet({ visible: true, item })}
        onPress={() => openItemDetail(item)}
        style={styles.webAppNoteCard}
        testID="web-app-note-card"
      >
        <View style={styles.webAppNoteIcon}>
          <StickyNote color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2} />
        </View>
        <View style={styles.webAppNoteBody}>
          <View style={styles.webAppBookmarkHeader}>
            <Text style={styles.webAppBookmarkType}>CATATAN</Text>
            {date ? <Text style={styles.webAppBookmarkRef}>{date}</Text> : null}
          </View>
          <Text numberOfLines={2} style={styles.webAppBookmarkTitle}>
            {item.title || 'Catatan pribadi'}
          </Text>
          {item.body ? (
            <Text numberOfLines={4} style={styles.webAppBookmarkText}>
              {item.body}
            </Text>
          ) : null}
          {tags.length ? (
            <View style={styles.webAppNoteTags}>
              {tags.slice(0, 4).map((tag) => (
                <Text key={tag} style={styles.webAppNoteTag}>
                  {tag}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={styles.webAppBookmarkFooter}>
            <Text style={styles.webAppBookmarkHint}>Ketuk untuk membaca</Text>
            <Pressable
              hitSlop={10}
              onPress={() => setItemActionSheet({ visible: true, item })}
              style={styles.webAppBookmarkManage}
              testID="web-app-note-manage"
            >
              <Text style={styles.webAppBookmarkManageText}>Kelola</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderWebAppNotesScreen = () => {
    const normalizedQuery = normalizeSearchText(notesSearch);
    const filteredNotes = normalizedQuery
      ? visibleItems.filter((item) =>
          [item.title, item.body, item.meta, ...(getNoteTags(item))]
            .some((value) => normalizeSearchText(value).includes(normalizedQuery)))
      : visibleItems;

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-notes-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-notes-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PERSONAL</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Catatan</Text>
            <Text style={styles.webAppBookmarksCount}>{items.length} item</Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Ringkasan tadabbur, kajian, dan refleksi pribadi dalam tampilan dashboard.
          </Text>
        </View>

        <View style={styles.webAppNotesSearch}>
          <TextInput
            onChangeText={setNotesSearch}
            placeholder="Cari judul, isi, atau tag catatan..."
            placeholderTextColor={WEB_APP_EXPLORE_MUTED}
            style={styles.webAppCatalogInput}
            testID="web-app-notes-search"
            value={notesSearch}
          />
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat catatan...</Text>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <StickyNote color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Belum ada catatan.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Buka detail konten untuk menambahkan catatan pertama.
            </Text>
          </View>
        ) : null}
        {!loading && !error && items.length > 0 && filteredNotes.length === 0 ? (
          <View style={styles.webAppBookmarksEmpty}>
            <Text style={styles.webAppBookmarksEmptyTitle}>Catatan tidak ditemukan.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Coba kata kunci lain atau kosongkan pencarian.
            </Text>
          </View>
        ) : null}
        {!loading && !error && filteredNotes.length > 0 ? (
          <View style={styles.webAppNotesList}>
            {filteredNotes.map(renderWebAppNoteCard)}
          </View>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppGoalCard = (item, index) => {
    const progress = getGoalProgress(item);
    const completed = getGoalCompleted(item);
    const statusLabel = completed ? 'Selesai' : 'Aktif';
    const metaLine = getGoalMetaLine(item);

    return (
      <Pressable
        android_ripple={{ color: 'rgba(52, 211, 153, 0.12)', borderless: false }}
        key={`${getExploreItemKey(item)}-${index}`}
        onLongPress={() => setItemActionSheet({ visible: true, item })}
        onPress={() => openItemDetail(item)}
        style={styles.webAppGoalCard}
        testID="web-app-goal-card"
      >
        <View style={styles.webAppGoalHeader}>
          <View style={styles.webAppGoalIcon}>
            {completed ? (
              <CheckCircle2 color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
            ) : (
              <Flag color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.webAppGoalTitleBlock}>
            <Text numberOfLines={2} style={styles.webAppBookmarkTitle}>
              {item.title || 'Target belajar'}
            </Text>
            {metaLine ? (
              <Text numberOfLines={2} style={styles.webAppBookmarkText}>
                {metaLine}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.webAppGoalStatus, completed && styles.webAppGoalStatusDone]}>
            {statusLabel}
          </Text>
        </View>
        {item.body ? (
          <Text numberOfLines={3} style={styles.webAppGoalBody}>
            {item.body}
          </Text>
        ) : null}
        <View style={styles.webAppGoalProgressTrack}>
          <View
            style={[
              styles.webAppGoalProgressFill,
              completed && styles.webAppGoalProgressFillDone,
              { width: `${progress}%` },
            ]}
            testID="web-app-goal-progress-fill"
          />
        </View>
        <View style={styles.webAppBookmarkFooter}>
          <Text style={styles.webAppBookmarkHint}>{progress}% progres</Text>
          <Pressable
            hitSlop={10}
            onPress={() => setItemActionSheet({ visible: true, item })}
            style={styles.webAppBookmarkManage}
            testID="web-app-goal-manage"
          >
            <Text style={styles.webAppBookmarkManageText}>Kelola</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderWebAppGoalsScreen = () => {
    const activeGoals = visibleItems.filter((item) => !getGoalCompleted(item)).length;
    const completedGoals = visibleItems.length - activeGoals;

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-goals-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-goals-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PERSONAL</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Target Belajar</Text>
            <Text style={styles.webAppBookmarksCount}>{items.length} target</Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Target hafalan, kajian, dan rutinitas ilmu dalam tampilan dashboard.
          </Text>
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat target...</Text>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <Flag color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Belum ada target.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Buat target belajar dari dashboard web atau fitur personal yang tersedia.
            </Text>
          </View>
        ) : null}
        {!loading && !error && visibleItems.length > 0 ? (
          <>
            <View style={styles.webAppGoalsSummary}>
              <View style={styles.webAppGoalSummaryPill}>
                <Circle color={WEB_APP_EXPLORE_ACCENT} size={12} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{activeGoals} aktif</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <CheckCircle2 color="#9ca3af" size={13} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{completedGoals} selesai</Text>
              </View>
            </View>
            <View style={styles.webAppGoalsList}>
              {visibleItems.map(renderWebAppGoalCard)}
            </View>
          </>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppMuhasabahCard = (item, index) => {
    const moodLabel = getMuhasabahMoodLabel(item);
    const dateLabel = getMuhasabahDateLabel(item);
    const content = getMuhasabahContent(item);

    return (
      <Pressable
        android_ripple={{ color: 'rgba(52, 211, 153, 0.12)', borderless: false }}
        key={`${getExploreItemKey(item)}-${index}`}
        onLongPress={() => setItemActionSheet({ visible: true, item })}
        onPress={() => openItemDetail(item)}
        style={styles.webAppMuhasabahCard}
        testID="web-app-muhasabah-card"
      >
        <View style={styles.webAppMuhasabahHeader}>
          <View style={styles.webAppNoteIcon}>
            <Pencil color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2} />
          </View>
          <View style={styles.webAppMuhasabahTitleBlock}>
            <Text style={styles.webAppBookmarkType}>MUHASABAH</Text>
            <Text numberOfLines={1} style={styles.webAppBookmarkTitle}>
              {dateLabel || item.title || 'Refleksi diri'}
            </Text>
          </View>
          <Text style={styles.webAppMuhasabahMood}>{moodLabel}</Text>
        </View>
        {content ? (
          <Text numberOfLines={4} style={styles.webAppMuhasabahText}>
            {content}
          </Text>
        ) : null}
        <View style={styles.webAppBookmarkFooter}>
          <Text style={styles.webAppBookmarkHint}>Ketuk untuk membaca</Text>
          <Pressable
            hitSlop={10}
            onPress={() => setItemActionSheet({ visible: true, item })}
            style={styles.webAppBookmarkManage}
            testID="web-app-muhasabah-manage"
          >
            <Text style={styles.webAppBookmarkManageText}>Kelola</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderWebAppMuhasabahScreen = () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const hasTodayEntry = visibleItems.some((item) => {
      const raw = item?.raw ?? {};
      return `${raw.date ?? item.date ?? ''}`.slice(0, 10) === todayKey;
    });

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-muhasabah-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-muhasabah-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PERSONAL</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Muhasabah</Text>
            <Text style={styles.webAppBookmarksCount}>{items.length} catatan</Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Jurnal refleksi harian untuk menjaga arah belajar dan ibadah.
          </Text>
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat muhasabah...</Text>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <Pencil color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Belum ada muhasabah.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Tulis refleksi dari dashboard web atau lanjutkan saat sudah login.
            </Text>
          </View>
        ) : null}
        {!loading && !error && visibleItems.length > 0 ? (
          <>
            <View style={styles.webAppMuhasabahSummary}>
              <View style={styles.webAppGoalSummaryPill}>
                <StickyNote color={WEB_APP_EXPLORE_ACCENT} size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{visibleItems.length} refleksi</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <CheckCircle2 color={hasTodayEntry ? WEB_APP_EXPLORE_ACCENT : '#9ca3af'} size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>
                  {hasTodayEntry ? 'Hari ini terisi' : 'Hari ini kosong'}
                </Text>
              </View>
            </View>
            <View style={styles.webAppNotesList}>
              {visibleItems.map(renderWebAppMuhasabahCard)}
            </View>
          </>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppHafalanCard = (item, index) => {
    const status = getHafalanStatus(item);
    const statusLabel = getHafalanStatusLabel(status);
    const progress = getHafalanItemProgress(item);
    const metaLine = getHafalanMetaLine(item);

    return (
      <Pressable
        android_ripple={{ color: 'rgba(52, 211, 153, 0.12)', borderless: false }}
        key={`${getExploreItemKey(item)}-${index}`}
        onLongPress={() => setItemActionSheet({ visible: true, item })}
        onPress={() => openItemDetail(item)}
        style={styles.webAppHafalanCard}
        testID="web-app-hafalan-card"
      >
        <View style={styles.webAppGoalHeader}>
          <View style={styles.webAppGoalIcon}>
            {status === 'memorized' ? (
              <CheckCircle2 color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
            ) : (
              <BookOpen color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.webAppGoalTitleBlock}>
            <Text numberOfLines={2} style={styles.webAppBookmarkTitle}>
              {getHafalanItemTitle(item, index)}
            </Text>
            {metaLine ? (
              <Text numberOfLines={1} style={styles.webAppBookmarkText}>
                {metaLine}
              </Text>
            ) : null}
          </View>
          <Text
            style={[
              styles.webAppHafalanStatus,
              status === 'memorized' && styles.webAppHafalanStatusDone,
              status === 'in_progress' && styles.webAppHafalanStatusProgress,
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        {item.body ? (
          <Text numberOfLines={3} style={styles.webAppGoalBody}>
            {item.body}
          </Text>
        ) : null}
        <View style={styles.webAppGoalProgressTrack}>
          <View
            style={[
              styles.webAppGoalProgressFill,
              status !== 'memorized' && styles.webAppHafalanProgressFill,
              { width: `${progress}%` },
            ]}
            testID="web-app-hafalan-progress-fill"
          />
        </View>
        <View style={styles.webAppBookmarkFooter}>
          <Text style={styles.webAppBookmarkHint}>{progress}% hafalan</Text>
          <Pressable
            hitSlop={10}
            onPress={() => setItemActionSheet({ visible: true, item })}
            style={styles.webAppBookmarkManage}
            testID="web-app-hafalan-manage"
          >
            <Text style={styles.webAppBookmarkManageText}>Kelola</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderWebAppHafalanScreen = () => {
    const summary = getHafalanSummary(visibleItems);
    const progress = summary.total > 0 ? Math.round((summary.memorized / summary.total) * 100) : 0;

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-hafalan-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-hafalan-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PROGRESS SAYA</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Hafalan</Text>
            <Text style={styles.webAppBookmarksCount}>
              {summary.memorized}/{summary.total} surah
            </Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Ringkasan hafalan Quran, status murajaah, dan progres personal.
          </Text>
          <View style={styles.webAppHafalanProgressTrack}>
            <View style={[styles.webAppGoalProgressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat hafalan...</Text>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <BookOpen color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Belum ada data hafalan.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Kelola hafalan dari dashboard web atau lanjutkan setelah masuk akun.
            </Text>
          </View>
        ) : null}
        {!loading && !error && visibleItems.length > 0 ? (
          <>
            <View style={styles.webAppGoalsSummary}>
              <View style={styles.webAppGoalSummaryPill}>
                <CheckCircle2 color={WEB_APP_EXPLORE_ACCENT} size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.memorized} hafal</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <Circle color="#f59e0b" size={13} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.inProgress} proses</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <BookOpen color="#9ca3af" size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.notStarted} belum</Text>
              </View>
            </View>
            <View style={styles.webAppGoalsList}>
              {visibleItems.map(renderWebAppHafalanCard)}
            </View>
          </>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppMurojaahCard = (item, index) => {
    const status = getMurojaahStatus(item);
    const statusLabel = getMurojaahStatusLabel(item);
    const metaLine = getMurojaahMetaLine(item);

    return (
      <Pressable
        android_ripple={{ color: 'rgba(52, 211, 153, 0.12)', borderless: false }}
        key={`${getExploreItemKey(item)}-${index}`}
        onLongPress={() => setItemActionSheet({ visible: true, item })}
        onPress={() => openItemDetail(item)}
        style={styles.webAppMurojaahCard}
        testID="web-app-murojaah-card"
      >
        <View style={styles.webAppGoalHeader}>
          <View style={styles.webAppGoalIcon}>
            {status === 'recent' ? (
              <CheckCircle2 color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
            ) : (
              <Flag color={status === 'urgent' ? '#f87171' : '#fbbf24'} size={18} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.webAppGoalTitleBlock}>
            <Text numberOfLines={2} style={styles.webAppBookmarkTitle}>
              {getMurojaahItemTitle(item, index)}
            </Text>
            {metaLine ? (
              <Text numberOfLines={1} style={styles.webAppBookmarkText}>
                {metaLine}
              </Text>
            ) : null}
          </View>
          <Text
            style={[
              styles.webAppMurojaahStatus,
              status === 'recent' && styles.webAppHafalanStatusDone,
              status === 'due' && styles.webAppHafalanStatusProgress,
              status === 'urgent' && styles.webAppMurojaahStatusUrgent,
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        {item.body ? (
          <Text numberOfLines={3} style={styles.webAppGoalBody}>
            {item.body}
          </Text>
        ) : null}
        <View style={styles.webAppBookmarkFooter}>
          <Text style={styles.webAppBookmarkHint}>
            {status === 'recent' ? 'Sudah direview pekan ini' : 'Prioritas murajaah'}
          </Text>
          <Pressable
            hitSlop={10}
            onPress={() => setItemActionSheet({ visible: true, item })}
            style={styles.webAppBookmarkManage}
            testID="web-app-murojaah-manage"
          >
            <Text style={styles.webAppBookmarkManageText}>Kelola</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderWebAppMurojaahScreen = () => {
    const summary = getMurojaahSummary(visibleItems);

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-murojaah-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-murojaah-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PROGRESS SAYA</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Murojaah</Text>
            <Text style={styles.webAppBookmarksCount}>{summary.total} surah</Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Jadwal ulang hafalan, prioritas review, dan sesi murajaah personal.
          </Text>
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat murojaah...</Text>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <BookOpen color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Belum ada jadwal murojaah.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Tambahkan hafalan dulu agar jadwal review bisa disusun.
            </Text>
          </View>
        ) : null}
        {!loading && !error && visibleItems.length > 0 ? (
          <>
            <View style={styles.webAppGoalsSummary}>
              <View style={styles.webAppGoalSummaryPill}>
                <BookOpen color={WEB_APP_EXPLORE_ACCENT} size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.total} total</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <CheckCircle2 color={WEB_APP_EXPLORE_ACCENT} size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.recent} reviewed</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <Flag color="#f87171" size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.urgent} urgent</Text>
              </View>
            </View>
            <View style={styles.webAppGoalsList}>
              {visibleItems.map(renderWebAppMurojaahCard)}
            </View>
          </>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppTilawahCard = (item, index) => {
    const ayahLine = getTilawahAyahLine(item);
    const dateLabel = formatNoteDate(getTilawahDate(item));
    const notes = getTilawahNotes(item);
    const pages = getTilawahPages(item);

    return (
      <Pressable
        android_ripple={{ color: 'rgba(52, 211, 153, 0.12)', borderless: false }}
        key={`${getExploreItemKey(item)}-${index}`}
        onLongPress={() => setItemActionSheet({ visible: true, item })}
        onPress={() => openItemDetail(item)}
        style={styles.webAppTilawahCard}
        testID="web-app-tilawah-card"
      >
        <View style={styles.webAppGoalHeader}>
          <View style={styles.webAppGoalIcon}>
            <BookOpen color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
          </View>
          <View style={styles.webAppGoalTitleBlock}>
            <Text style={styles.webAppBookmarkType}>TILAWAH</Text>
            <Text numberOfLines={2} style={styles.webAppBookmarkTitle}>
              {getTilawahSurah(item, index)}
            </Text>
            {[dateLabel, ayahLine].filter(Boolean).length ? (
              <Text numberOfLines={1} style={styles.webAppBookmarkText}>
                {[dateLabel, ayahLine].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
          <Text style={styles.webAppTilawahPageChip}>{pages} halaman</Text>
        </View>
        {notes ? (
          <Text numberOfLines={3} style={styles.webAppGoalBody}>
            {notes}
          </Text>
        ) : null}
        <View style={styles.webAppBookmarkFooter}>
          <Text style={styles.webAppBookmarkHint}>Ketuk untuk detail</Text>
          <Pressable
            hitSlop={10}
            onPress={() => setItemActionSheet({ visible: true, item })}
            style={styles.webAppBookmarkManage}
            testID="web-app-tilawah-manage"
          >
            <Text style={styles.webAppBookmarkManageText}>Kelola</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderWebAppTilawahScreen = () => {
    const summary = getTilawahSummary(visibleItems);
    const todayEntry = summary.todayEntry;
    const todaySurah = todayEntry ? getTilawahSurah(todayEntry) : '';
    const todayPages = todayEntry ? getTilawahPages(todayEntry) : 0;
    const todayAyahLine = todayEntry ? getTilawahAyahLine(todayEntry) : '';

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-tilawah-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-tilawah-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PROGRESS SAYA</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Tilawah</Text>
            <Text style={styles.webAppBookmarksCount}>{summary.totalPages} halaman</Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Log tilawah, halaman pekanan, dan aktivitas baca Quran.
          </Text>
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat tilawah...</Text>
          </View>
        ) : null}
        {!loading && !error ? (
          <View style={[styles.webAppTilawahTodayPanel, todayEntry && styles.webAppTilawahTodayPanelDone]}>
            <View style={styles.webAppGoalHeader}>
              <View style={styles.webAppGoalIcon}>
                {todayEntry ? (
                  <CheckCircle2 color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
                ) : (
                  <BookOpen color="#fbbf24" size={18} strokeWidth={2.2} />
                )}
              </View>
              <View style={styles.webAppGoalTitleBlock}>
                <Text style={styles.webAppTilawahTodayTitle}>
                  {todayEntry ? 'Hari ini sudah tercatat' : 'Belum ada tilawah hari ini'}
                </Text>
                <Text style={styles.webAppTilawahTodayText}>
                  {todayEntry
                    ? [todaySurah, todayAyahLine, `${todayPages} halaman`].filter(Boolean).join(' · ')
                    : 'Tambahkan log dari dashboard web atau lanjutkan setelah masuk akun.'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <BookOpen color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Belum ada log tilawah.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Catat tilawah dari dashboard web agar ringkasan halaman muncul di sini.
            </Text>
          </View>
        ) : null}
        {!loading && !error && visibleItems.length > 0 ? (
          <>
            <View style={styles.webAppGoalsSummary}>
              <View style={styles.webAppGoalSummaryPill}>
                <BookOpen color={WEB_APP_EXPLORE_ACCENT} size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.pagesWeek} pekan ini</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <StickyNote color="#60a5fa" size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{summary.pagesMonth} bulan ini</Text>
              </View>
              <View style={styles.webAppGoalSummaryPill}>
                <CheckCircle2 color="#9ca3af" size={14} strokeWidth={2.2} />
                <Text style={styles.webAppGoalSummaryText}>{visibleItems.length} log</Text>
              </View>
            </View>
            <View style={styles.webAppGoalsList}>
              {visibleItems.map(renderWebAppTilawahCard)}
            </View>
          </>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppStatsTile = ({ accent = WEB_APP_EXPLORE_ACCENT, label, value }) => (
    <View key={label} style={styles.webAppStatsTile} testID="web-app-stats-tile">
      <Text style={[styles.webAppStatsValue, { color: accent }]}>{value}</Text>
      <Text style={styles.webAppStatsLabel}>{label}</Text>
    </View>
  );

  const renderWebAppStatsScreen = () => {
    const summary = getStatsSummary(visibleItems);
    const prayerRows = getStatsPrayerRows(summary);

    return (
      <ScrollView
        contentContainerStyle={styles.webAppBookmarksContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppBookmarksRoot}
      >
        <View testID="explore-web-app-stats-surface" />
        <View style={styles.webAppBookmarksHeader}>
          <Pressable
            accessibilityLabel="Kembali ke Belajar"
            onPress={clearFeature}
            style={styles.webAppBookmarksBack}
            testID="web-app-stats-back"
          >
            <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
          </Pressable>
          <Text style={styles.webAppCatalogEyebrow}>PROGRESS SAYA</Text>
          <View style={styles.webAppBookmarksTitleRow}>
            <Text style={styles.webAppCatalogTitle}>Statistik</Text>
            <Text style={styles.webAppBookmarksCount}>{formatCompactStat(summary.points)} poin</Text>
          </View>
          <Text style={styles.webAppCatalogSubtitle}>
            Rekap sholat, tilawah, hafalan, target, dan pencapaian personal.
          </Text>
        </View>

        {error ? <Text style={styles.webAppBookmarksError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.webAppBookmarksState}>
            <ActivityIndicator color={WEB_APP_EXPLORE_ACCENT} size="small" />
            <Text style={styles.webAppBookmarksStateText}>Memuat statistik...</Text>
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <View style={styles.webAppBookmarksEmpty}>
            <Flag color={WEB_APP_EXPLORE_MUTED} size={32} strokeWidth={1.8} />
            <Text style={styles.webAppBookmarksEmptyTitle}>Statistik belum tersedia.</Text>
            <Text style={styles.webAppBookmarksEmptyText}>
              Masuk dan lanjutkan aktivitas agar ringkasan dashboard bisa dihitung.
            </Text>
          </View>
        ) : null}
        {!loading && !error && visibleItems.length > 0 ? (
          <>
            <View style={styles.webAppStatsHeroCard}>
              <View style={styles.webAppGoalHeader}>
                <View style={styles.webAppGoalIcon}>
                  <CheckCircle2 color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
                </View>
                <View style={styles.webAppGoalTitleBlock}>
                  <Text style={styles.webAppTilawahTodayTitle}>Sholat hari ini</Text>
                  <Text style={styles.webAppTilawahTodayText}>
                    {summary.prayerCount}/5 tercatat · {summary.prayerStreak} hari streak
                  </Text>
                </View>
                <Text style={styles.webAppStatsHeroValue}>{summary.prayerCount}/5</Text>
              </View>
            </View>

            <View style={styles.webAppStatsGrid}>
              {renderWebAppStatsTile({
                accent: WEB_APP_EXPLORE_ACCENT,
                label: 'Total Muhasabah',
                value: formatCompactStat(summary.muhasabah),
              })}
              {renderWebAppStatsTile({
                accent: '#60a5fa',
                label: 'Target Aktif',
                value: formatCompactStat(summary.activeGoals),
              })}
              {renderWebAppStatsTile({
                accent: '#fbbf24',
                label: 'Total Bookmark',
                value: formatCompactStat(summary.bookmarks),
              })}
              {renderWebAppStatsTile({
                accent: '#c084fc',
                label: 'Total Poin',
                value: formatCompactStat(summary.points),
              })}
            </View>

            <View style={styles.webAppStatsProgressPanel}>
              <Text style={styles.webAppSectionTitle}>RINGKASAN PROGRESS</Text>
              <View style={styles.webAppStatsProgressRows}>
                <View style={styles.webAppStatsProgressRow}>
                  <BookOpen color={WEB_APP_EXPLORE_ACCENT} size={18} strokeWidth={2.2} />
                  <Text style={styles.webAppStatsProgressLabel}>Hafalan</Text>
                  <Text style={styles.webAppStatsProgressValue}>{formatCompactStat(summary.hafalan)} surah</Text>
                </View>
                <View style={styles.webAppStatsProgressRow}>
                  <StickyNote color="#2dd4bf" size={18} strokeWidth={2.2} />
                  <Text style={styles.webAppStatsProgressLabel}>Tilawah pekan ini</Text>
                  <Text style={styles.webAppStatsProgressValue}>{formatCompactStat(summary.tilawahWeek)} halaman</Text>
                </View>
                <View style={styles.webAppStatsProgressRow}>
                  <Bookmark color="#60a5fa" size={18} strokeWidth={2.2} />
                  <Text style={styles.webAppStatsProgressLabel}>Tilawah bulan ini</Text>
                  <Text style={styles.webAppStatsProgressValue}>{formatCompactStat(summary.tilawahMonth)} halaman</Text>
                </View>
              </View>
            </View>

            <View style={styles.webAppStatsChartPanel}>
              <Text style={styles.webAppSectionTitle}>SHOLAT 7 HARI TERAKHIR</Text>
              <View style={styles.webAppStatsChart}>
                {prayerRows.map((row, index) => {
                  const height = Math.max(8, (row.count / 5) * 96);
                  return (
                    <View key={`${row.date}-${index}`} style={styles.webAppStatsBarColumn} testID="web-app-stats-bar">
                      <Text style={styles.webAppStatsBarCount}>{row.count}</Text>
                      <View style={styles.webAppStatsBarTrack}>
                        <View
                          style={[
                            styles.webAppStatsBarFill,
                            row.count >= 5 && styles.webAppStatsBarFillDone,
                            row.count > 0 && row.count < 5 && styles.webAppStatsBarFillPartial,
                            { height },
                          ]}
                        />
                      </View>
                      <Text numberOfLines={1} style={styles.webAppStatsBarLabel}>
                        {formatNoteDate(row.date).split(' ')[0] || `${index + 1}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}
        {renderItemActionSheet()}
      </ScrollView>
    );
  };

  const renderWebAppNotificationsScreen = () => (
    <ScrollView
      contentContainerStyle={styles.webAppNotificationsContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.webAppBookmarksRoot}
    >
      <View testID="explore-web-app-notifications-surface" />
      <View style={styles.webAppBookmarksHeader}>
        <Pressable
          accessibilityLabel="Kembali ke Belajar"
          onPress={clearFeature}
          style={styles.webAppBookmarksBack}
          testID="web-app-notifications-back"
        >
          <Text style={styles.webAppBookmarksBackText}>Kembali</Text>
        </Pressable>
        <Text style={styles.webAppCatalogEyebrow}>PERSONAL</Text>
        <View style={styles.webAppBookmarksTitleRow}>
          <Text style={styles.webAppCatalogTitle}>Notifikasi</Text>
          <Text style={styles.webAppBookmarksCount}>Inbox</Text>
        </View>
        <Text style={styles.webAppCatalogSubtitle}>
          Inbox, push native, dan pengingat belajar dalam permukaan dashboard.
        </Text>
      </View>
      <View style={styles.webAppNotificationsPanel}>
        <NotificationCenter variant="webApp" />
      </View>
    </ScrollView>
  );

  if (!activeFeature) {
    return (
      <ScrollView
        contentContainerStyle={styles.webAppCatalogContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.webAppCatalogRoot}
      >
        <View testID="explore-web-app-surface" />
        <View style={styles.webAppCatalogHero}>
          <Text style={styles.webAppCatalogEyebrow}>KONTEN ISLAM</Text>
          <Text style={styles.webAppCatalogTitle}>Belajar</Text>
          <Text style={styles.webAppCatalogSubtitle}>
            Kajian, referensi Islam, dan fitur personal dalam katalog dashboard.
          </Text>
        </View>
        <View style={styles.webAppCatalogSearch}>
          <TextInput
            onChangeText={setFeatureSearch}
            placeholder="Cari kajian, tafsir, kamus, perawi, quiz..."
            placeholderTextColor={WEB_APP_EXPLORE_MUTED}
            style={styles.webAppCatalogInput}
            testID="search-input"
            value={featureSearch}
          />
        </View>
        <FeatureCatalog
          featureSearch={featureSearch}
          onFeaturePress={loadFeature}
          onTogglePinnedFeature={handleTogglePinnedFeature}
          pinnedFeatureKeys={pinnedFeatureKeys}
          recentFeatureKeys={recentFeatureKeys}
          variant="webApp"
        />
        {renderItemActionSheet()}
      </ScrollView>
    );
  }

  if (activeFeature?.type === 'bookmarks' ) {
    return renderWebAppBookmarksScreen();
  }

  if (activeFeature?.type === 'notes' ) {
    return renderWebAppNotesScreen();
  }

  if (activeFeature?.key === 'goals' ) {
    return renderWebAppGoalsScreen();
  }

  if (activeFeature?.key === 'muhasabah' ) {
    return renderWebAppMuhasabahScreen();
  }

  if (activeFeature?.key === 'hafalan' ) {
    return renderWebAppHafalanScreen();
  }

  if (activeFeature?.key === 'murojaah' ) {
    return renderWebAppMurojaahScreen();
  }

  if (activeFeature?.key === 'tilawah' ) {
    return renderWebAppTilawahScreen();
  }

  if (activeFeature?.key === 'stats' ) {
    return renderWebAppStatsScreen();
  }

  if (activeFeature?.key === 'leaderboard' ) {
    return (
      <WebAppLeaderboardRoute
        activeTab={leaderboardTab}
        entries={getLeaderboardEntries(visibleItems, leaderboardTab)}
        error={error}
        formatScore={formatCompactStat}
        getItemKey={getExploreItemKey}
        getName={getLeaderboardName}
        getRank={getLeaderboardRank}
        getScore={getLeaderboardScore}
        hasItems={Boolean(visibleItems.length)}
        loading={loading}
        onSelectTab={setLeaderboardTab}
        tabs={LEADERBOARD_TABS}
      />
    );
  }

  if (activeFeature?.key === 'kajian' ) {
    const filteredKajian = getFilteredKajianItems(visibleItems, kajianSearch, kajianCategory);
    const summary = getKajianSummary(visibleItems);

    return (
      <WebAppKajianRoute
        categories={KAJIAN_CATEGORIES}
        error={error}
        filteredItems={filteredKajian}
        formatStat={formatCompactStat}
        getDescription={getKajianDescription}
        getDuration={getKajianDuration}
        getItemKey={getExploreItemKey}
        getSpeaker={getKajianSpeaker}
        getTitle={getKajianTitle}
        getTopic={getKajianTopic}
        getType={getKajianType}
        getUrl={getKajianUrl}
        kajianCategory={kajianCategory}
        kajianSearch={kajianSearch}
        loading={loading}
        onOpenItem={openItemDetail}
        onOpenUrl={onOpenKajianUrl}
        onSearch={setKajianSearch}
        onSelectCategory={setKajianCategory}
        summary={summary}
      />
    );
  }

  if (activeFeature?.key === 'blog' ) {
    const categories = blogCategoryOptions.length ? blogCategoryOptions : getBlogCategories(visibleItems);
    const filteredBlog = getFilteredBlogItems(visibleItems, blogSearch, blogCategory);

    return (
      <WebAppBlogRoute
        blogCategory={blogCategory}
        blogSearch={blogSearch}
        categories={categories}
        error={error}
        filteredItems={filteredBlog}
        formatDate={formatBlogDate}
        getAuthor={getBlogAuthor}
        getCategoryLabel={getBlogCategoryLabel}
        getExcerpt={getBlogExcerpt}
        getItemKey={getExploreItemKey}
        getRaw={getBlogRaw}
        getTitle={getBlogTitle}
        hasItems={Boolean(visibleItems.length)}
        loading={loading}
        onOpenItem={openItemDetail}
        onSearch={setBlogSearch}
        onSelectCategory={setBlogCategory}
      />
    );
  }

  if (activeFeature?.key === 'library' ) {
    return (
      <WebAppLibraryRoute
        error={error}
        items={items}
        libraryProgressFilter={libraryProgressFilter}
        libraryProgressMap={libraryProgressMap}
        loading={loading}
        onLoadMore={loadMoreFeature}
        onOpenItem={openItemDetail}
        onSelectProgressFilter={setLibraryProgressFilter}
        pagination={pagination}
        session={session}
      />
    );
  }

  if (activeFeature?.key === 'perawi' ) {
    return (
      <WebAppPerawiRoute
        error={error}
        items={items}
        loading={loading}
        onLoadMore={loadMoreFeature}
        onOpenItem={openItemDetail}
        pagination={pagination}
      />
    );
  }

  if (activeFeature?.key === 'fiqh' ) {
    return (
      <WebAppFiqhRoute
        error={error}
        items={items}
        loading={loading}
        onLoadMore={loadMoreFeature}
        onOpenItem={openItemDetail}
        pagination={pagination}
      />
    );
  }

  if (activeFeature?.type === 'kamus' ) {
    return (
      <WebAppKamusRoute
        dictionaryInputRef={dictionaryInputRef}
        dictionaryQuery={dictionaryQuery}
        error={error}
        focusDictionaryInput={focusDictionaryInput}
        items={items}
        loading={loading}
        onSearch={runDictionarySearch}
        onUpdateQuery={setDictionaryQuery}
      />
    );
  }

  if (activeFeature?.type === 'forum' ) {
    return (
      <WebAppForumRoute
        forumAnswerDraft={forumAnswerDraft}
        forumAnswers={forumAnswers}
        forumAskBody={forumAskBody}
        forumAskTags={forumAskTags}
        forumAskTitle={forumAskTitle}
        forumDetail={forumDetail}
        forumError={forumError}
        forumHasMore={forumHasMore}
        forumLoading={forumLoading}
        forumPage={forumPage}
        forumQuestions={forumQuestions}
        forumSaving={forumSaving}
        forumSearch={forumSearch}
        forumSlug={forumSlug}
        forumTotal={forumTotal}
        forumView={forumView}
        forumVotingId={forumVotingId}
        session={session}
        setForumAnswerDraft={setForumAnswerDraft}
        setForumAnswers={setForumAnswers}
        setForumAskBody={setForumAskBody}
        setForumAskTags={setForumAskTags}
        setForumAskTitle={setForumAskTitle}
        setForumDetail={setForumDetail}
        setForumError={setForumError}
        setForumHasMore={setForumHasMore}
        setForumLoading={setForumLoading}
        setForumPage={setForumPage}
        setForumQuestions={setForumQuestions}
        setForumSaving={setForumSaving}
        setForumSearch={setForumSearch}
        setForumSlug={setForumSlug}
        setForumTotal={setForumTotal}
        setForumView={setForumView}
        setForumVotingId={setForumVotingId}
        showError={showError}
        showInfo={showInfo}
      />
    );
  }

  if (activeFeature?.type === 'feed' ) {
    return (
      <WebAppFeedRoute
        error={error}
        formatDate={formatNoteDate}
        isLoggedIn={Boolean(session?.token)}
        items={visibleItems}
        likingFeedId={likingFeedId}
        loading={loading}
        onHideFeedItem={handleHideFeedItem}
        onLikeFeedItem={handleLikeFeedItem}
        onLoadMore={loadMoreFeature}
        onOpenComments={(item) => {
          setSelectedItem(item);
          setActiveNoteRef('');
        }}
        onReportFeedItem={handleReportFeedItem}
        pagination={pagination}
      />
    );
  }

  if (activeFeature?.type === 'notifications' ) {
    return renderWebAppNotificationsScreen();
  }

  return null;
}
