import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Bookmark, BookmarkCheck, Search } from 'lucide-react-native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getAyahsForHadith,
  getHadithBooks,
  getHadithDetail,
  getHadithPage,
  getRelatedHadiths,
  getHadithSanad,
  getHadithTakhrij,
  normalizeHadith,
  getPerawiDetail,
  getPerawiGuru,
  getPerawiJarhTadil,
  getPerawiMurid,
} from '../api/client';
import { addBookmark, deleteBookmark, getBookmarks, getNotesByType } from '../api/personal';
import { AppActionSheet, ActionSheetRow } from '../components/AppActionSheet';
import { Card, CardTitle } from '../components/Card';
import { ContentCard } from '../components/ContentCard';
import { NotesPanel } from '../components/NotesPanel';
import { ActionPill, IconActionButton, PaperSearchInput } from '../components/Paper';
import { SectionHeader } from '../components/SectionHeader';
import { Screen } from '../components/Screen';
import { useFeedback } from '../context/FeedbackContext';
import { useSession } from '../context/SessionContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { getOfflineItems, getOfflineOverview } from '../storage/offlineContent';
import { arabicTypography } from '../styles/arabicTypography';
import { colors, radius, spacing } from '../theme';

const HADITH_LIST_PAGE_SIZE = 20;
const WEB_APP_HADITH_BG = '#020617';
const WEB_APP_HADITH_SURFACE = '#1e293b';
const WEB_APP_HADITH_BORDER = '#334155';
const WEB_APP_HADITH_MUTED = '#94a3b8';
const WEB_APP_HADITH_ACCENT = '#10b981';
const WEB_APP_HADITH_THEMES = {
  dark: {
    accent: WEB_APP_HADITH_ACCENT,
    activeTab: '#059669',
    bg: WEB_APP_HADITH_BG,
    border: WEB_APP_HADITH_BORDER,
    input: '#e2e8f0',
    metaBg: '#0f172a',
    muted: WEB_APP_HADITH_MUTED,
    searchBorder: '#475569',
    surface: WEB_APP_HADITH_SURFACE,
    tab: '#334155',
    tabText: '#cbd5e1',
    text: '#cbd5e1',
    title: '#f8fafc',
  },
  light: {
    accent: '#047857',
    activeTab: '#059669',
    bg: '#ffffff',
    border: '#e5e7eb',
    input: '#0f172a',
    metaBg: '#f8fafc',
    muted: '#64748b',
    searchBorder: '#a7f3d0',
    surface: '#ffffff',
    tab: '#e2e8f0',
    tabText: '#475569',
    text: '#475569',
    title: '#111827',
  },
};

const WEB_APP_HADITH_TABS = [
  { key: 'book', label: 'Book' },
  { key: 'theme', label: 'Theme' },
  { key: 'chapter', label: 'Chapter' },
  { key: 'hadith', label: 'Hadith' },
];

const WEB_APP_BOOK_COVER_STYLES = {
  bukhari: { backgroundColor: '#991b1b', borderColor: '#ef4444' },
  muslim: { backgroundColor: '#111827', borderColor: '#d97706' },
  'abu-daud': { backgroundColor: '#166534', borderColor: '#d97706' },
  tirmidzi: { backgroundColor: '#0f766e', borderColor: '#f59e0b' },
  nasai: { backgroundColor: '#1e40af', borderColor: '#94a3b8' },
  'ibnu-majah': { backgroundColor: '#7c2d12', borderColor: '#f97316' },
  malik: { backgroundColor: '#3f3f46', borderColor: '#a3a3a3' },
};

const HADITH_DETAIL_TABS = [
  { key: 'text', label: 'Teks' },
  { key: 'sanad', label: 'Sanad' },
  { key: 'narrators', label: 'Perawi' },
  { key: 'takhrij', label: 'Takhrij' },
  { key: 'ayat', label: 'Ayat' },
  { key: 'notes', label: 'Catatan' },
];

const normalizeSearchText = (value) => String(value ?? '').trim().toLowerCase();

const cleanHadithText = (value) =>
  String(value ?? '')
    .replace(/\bHadith\b/gi, 'Hadis')
    .replace(/\s+/g, ' ')
    .trim();

const HADITH_BOOK_LABELS = {
  'abu-daud': 'Sunan Abu Daud',
  bukhari: 'Shahih Bukhari',
  'ibnu-majah': 'Sunan Ibnu Majah',
  malik: 'Muwatha Malik',
  muslim: 'Shahih Muslim',
  nasai: "Sunan Nasa'i",
  tirmidzi: 'Jami At-Tirmidzi',
};

const HADITH_BOOK_SHORT_LABELS = {
  'abu-daud': 'Abu Daud',
  bukhari: 'Bukhari',
  'ibnu-majah': 'Ibnu Majah',
  malik: 'Malik',
  muslim: 'Muslim',
  nasai: "Nasa'i",
  tirmidzi: 'Tirmidzi',
};

const isGenericHadithLabel = (value) => /^hadis(?:\s+\d+)?$/i.test(cleanHadithText(value));

const formatSlugLabel = (value) => {
  const slug = cleanHadithText(value).toLowerCase();
  if (!slug) return '';

  if (HADITH_BOOK_LABELS[slug]) return HADITH_BOOK_LABELS[slug];

  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatHadithNumber = (hadith) => {
  const number = hadith?.number ?? hadith?.nomor_hadis ?? hadith?.id;
  return number ? `No. ${number}` : 'Nomor belum tersedia';
};

const formatHadithGrade = (grade) => {
  const cleaned = cleanHadithText(grade);
  if (!cleaned) return 'Belum dinilai';

  const normalized = cleaned.toLowerCase();
  if (['sahih', 'shahih', 'ṣaḥīḥ'].includes(normalized)) return 'Shahih';
  if (normalized === 'hasan sahih' || normalized === 'hasan shahih') return 'Hasan Shahih';
  if (normalized === 'hasan') return 'Hasan';
  if (['dhaif', "da'if", 'lemah'].includes(normalized)) return "Dha'if";
  return cleaned;
};

const formatHadithCount = (count) => Number(count || 0).toLocaleString('id-ID');

const getHadithBookCount = (book) =>
  Number(book?.count ?? book?.hadith_count ?? book?.hadithCount ?? book?.total ?? 0);

const getHadithBookLabel = (hadith) => {
  const rawBook = cleanHadithText(hadith?.book || hadith?.bookName || hadith?.collection || '');
  if (rawBook && !isGenericHadithLabel(rawBook)) return rawBook;

  return formatSlugLabel(hadith?.bookSlug) || 'Kitab hadis';
};

const getHadithBookShortLabel = (hadith) => {
  const slug = cleanHadithText(hadith?.bookSlug).toLowerCase();
  if (HADITH_BOOK_SHORT_LABELS[slug]) return HADITH_BOOK_SHORT_LABELS[slug];

  const bookLabel = getHadithBookLabel(hadith);
  return bookLabel
    .replace(/^shahih\s+/i, '')
    .replace(/^sunan\s+/i, '')
    .replace(/^jami\s+/i, '')
    .replace(/^muwatha\s+/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ') || 'Hadis';
};

const getHadithTopicLabel = (hadith) => {
  const topic = cleanHadithText(hadith?.chapterName || hadith?.themeName || hadith?.title || '');
  return isGenericHadithLabel(topic) ? '' : topic;
};

const getBookCoverStyle = (book) =>
  WEB_APP_BOOK_COVER_STYLES[cleanHadithText(book?.slug).toLowerCase()] ?? {
    backgroundColor: '#0f172a',
    borderColor: WEB_APP_HADITH_BORDER,
  };

export function HadithScreen({ deepLinkTarget, isActive, navigation }) {
  const { user } = useSession();
  const { showError, showInfo, showSuccess } = useFeedback();
  const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
  const webAppTheme = isDarkTheme ? WEB_APP_HADITH_THEMES.dark : WEB_APP_HADITH_THEMES.light;
  const handledDeepLinkId = useRef(null);
  const loadingMoreRef = useRef(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [hadiths, setHadiths] = useState([]);
  const [selectedHadith, setSelectedHadith] = useState(null);
  const [sanad, setSanad] = useState([]);
  const [takhrij, setTakhrij] = useState([]);
  const [hadithAyahs, setHadithAyahs] = useState([]);
  const [relatedHadiths, setRelatedHadiths] = useState([]);
  const [selectedPerawi, setSelectedPerawi] = useState(null);
  const [perawiPanel, setPerawiPanel] = useState({ guru: [], jarhTadil: [], loading: false, murid: [] });
  const [expandedPerawiList, setExpandedPerawiList] = useState({ guru: false, murid: false });
  const [bookmarks, setBookmarks] = useState({});
  const [bookmarkItems, setBookmarkItems] = useState([]);
  const [noteCounts, setNoteCounts] = useState({});
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(HADITH_LIST_PAGE_SIZE);
  const [hadithTotal, setHadithTotal] = useState(0);
  const [hadithSource, setHadithSource] = useState('backend');
  const [remotePage, setRemotePage] = useState(0);
  const [hasMoreRemote, setHasMoreRemote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('text');
  const [hadithActionSheet, setHadithActionSheet] = useState({ visible: false, hadith: null });
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');

  const loadOfflineHadiths = useCallback(async (bookSlug = null) => {
    const overview = await getOfflineOverview();
    if (!overview.supported || !overview.hadiths) return null;

    const items = (await getOfflineItems('hadith'))
      .map(normalizeHadith)
      .filter((item) => item.id)
      .filter((item) => !bookSlug || item.bookSlug === bookSlug)
      .sort((a, b) => {
        if (a.bookSlug !== b.bookSlug) return String(a.bookSlug).localeCompare(String(b.bookSlug));
        return Number(a.number ?? a.id ?? 0) - Number(b.number ?? b.id ?? 0);
      });

    return items.length ? items : null;
  }, []);

  const load = useCallback(async ({ append = false, bookSlug = null, page = 0, preferOffline = true } = {}) => {
    if (append) {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      loadingMoreRef.current = false;
      setLoading(true);
      setVisibleCount(HADITH_LIST_PAGE_SIZE);
      setMessage('');
    }

    try {
      if (preferOffline && !append) {
        const offlineItems = await loadOfflineHadiths(bookSlug);
        if (offlineItems) {
          setHadiths(offlineItems);
          setHadithTotal(offlineItems.length);
          setHadithSource('offline');
          setRemotePage(0);
          setHasMoreRemote(false);
          return;
        }
      }

      const result = await getHadithPage({ bookSlug, page, size: HADITH_LIST_PAGE_SIZE });
      setHadithSource('backend');
      setRemotePage(result.page);
      setHasMoreRemote(result.hasMore);
      setHadithTotal((current) =>
        result.total || (append ? Math.max(current, page * HADITH_LIST_PAGE_SIZE + result.items.length) : result.items.length),
      );
      setHadiths((current) => (append ? [...current, ...result.items] : result.items));
      setVisibleCount((current) => (append ? current + result.items.length : HADITH_LIST_PAGE_SIZE));
    } catch (error) {
      if (!append) {
        setHadiths([]);
        setHadithTotal(0);
        setHasMoreRemote(false);
      }
      setMessage(error?.message ?? 'Daftar hadis belum bisa dimuat.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (append) {
        loadingMoreRef.current = false;
      }
    }
  }, [loadOfflineHadiths]);

  const loadBooks = useCallback(async () => {
    try {
      const items = await getHadithBooks();
      setBooks(items);
    } catch {
      const overview = await getOfflineOverview();
      setBooks(Array.isArray(overview.hadithBooks) ? overview.hadithBooks : []);
    }
  }, []);

  const loadBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks({});
      setBookmarkItems([]);
      return;
    }

    try {
      const items = await getBookmarks();
      const mapped = items.reduce((acc, item) => {
        if (item.ref_type === 'hadith') {
          acc[item.ref_id] = item;
        }
        return acc;
      }, {});
      setBookmarks(mapped);
      setBookmarkItems(items.filter((item) => item.ref_type === 'hadith'));
    } catch {
      setBookmarks({});
      setBookmarkItems([]);
    }
  }, [user]);

  const loadNoteCounts = useCallback(async () => {
    if (!user) {
      setNoteCounts({});
      return;
    }

    try {
      const notes = await getNotesByType('hadith');
      const mapped = notes.reduce((acc, item) => {
        acc[item.ref_id] = (acc[item.ref_id] ?? 0) + 1;
        return acc;
      }, {});
      setNoteCounts(mapped);
    } catch {
      setNoteCounts({});
    }
  }, [user]);

  const refreshAll = useCallback(async () => {
    await load({ bookSlug: selectedBook, page: 0, preferOffline: true });
    await loadBooks();
    await loadBookmarks();
    await loadNoteCounts();
  }, [load, loadBooks, loadBookmarks, loadNoteCounts, selectedBook]);

  const selectBook = useCallback(
    (slug) => {
      const next = slug === selectedBook ? null : slug;
      setSelectedBook(next);
      setSelectedHadith(null);
    },
    [selectedBook],
  );

  const openHadith = async (hadith) => {
    setSelectedHadith(hadith);
    setDetailLoading(true);
    setMessage('');
    setSelectedPerawi(null);
    setPerawiPanel({ guru: [], jarhTadil: [], loading: false, murid: [] });
    setExpandedPerawiList({ guru: false, murid: false });
    setRelatedHadiths([]);
    setHadithAyahs([]);
    setDetailTab('text');

    try {
      const [detail, sanadItems, takhrijItems] = await Promise.all([
        getHadithDetail(hadith.id).catch(() => hadith),
        getHadithSanad(hadith.id),
        getHadithTakhrij(hadith.id),
      ]);
      const nextHadith = { ...hadith, ...detail };
      setSelectedHadith(nextHadith);
      setSanad(sanadItems);
      setTakhrij(takhrijItems);
      setHadithAyahs(await getAyahsForHadith(nextHadith.id));
      setRelatedHadiths(await getRelatedHadiths(nextHadith));
      await loadBookmarks();
      await loadNoteCounts();
    } catch (err) {
      setMessage(err?.message ?? 'Detail hadis belum bisa dimuat.');
      setSanad([]);
      setTakhrij([]);
      setHadithAyahs([]);
      setRelatedHadiths([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleBookmark = async (hadith) => {
    if (!user || !hadith.id) {
      showInfo('Masuk dari Profil untuk menyimpan bookmark.');
      return;
    }

    setSavingId(hadith.id);
    setMessage('');

    try {
      const existing = bookmarks[hadith.id];
      if (existing?.id) {
        await deleteBookmark(existing.id);
        const next = { ...bookmarks };
        delete next[hadith.id];
        setBookmarks(next);
        setMessage('Bookmark dihapus.');
        showSuccess('Bookmark dihapus.');
        await loadBookmarks();
      } else {
        const bookmark = await addBookmark({ refType: 'hadith', refId: hadith.id });
        setBookmarks({ ...bookmarks, [hadith.id]: bookmark });
        setMessage('Hadis disimpan ke bookmark.');
        showSuccess('Hadis disimpan ke bookmark.');
        await loadBookmarks();
      }
    } catch (err) {
      const nextMessage = err?.message ?? 'Bookmark belum bisa diperbarui.';
      setMessage(nextMessage);
      showError(nextMessage);
    } finally {
      setSavingId(null);
    }
  };

  const openPerawi = async (perawi) => {
    if (!perawi?.id) return;

    setSelectedPerawi(perawi);
    setDetailTab('narrators');
    setPerawiPanel({ guru: [], jarhTadil: [], loading: true, murid: [] });
    setExpandedPerawiList({ guru: false, murid: false });

    try {
      const [detail, jarhTadil, guru, murid] = await Promise.all([
        getPerawiDetail(perawi.id),
        getPerawiJarhTadil(perawi.id),
        getPerawiGuru(perawi.id),
        getPerawiMurid(perawi.id),
      ]);
      setSelectedPerawi({ ...perawi, ...(detail ?? {}) });
      setPerawiPanel({ guru, jarhTadil, loading: false, murid });
    } catch (err) {
      setMessage(err?.message ?? 'Detail perawi belum bisa dimuat.');
      setPerawiPanel({ guru: [], jarhTadil: [], loading: false, murid: [] });
    }
  };

  const renderPerawiList = (items, listKey) => {
    if (!items.length) return <Text style={styles.emptyText}>Perawi terkait belum tersedia.</Text>;

    const expanded = !!expandedPerawiList[listKey];
    const visible = expanded ? items : items.slice(0, 6);
    const hiddenCount = Math.max(0, items.length - visible.length);

    return (
      <>
        {visible.map((item) => (
          <Pressable key={item.id} onPress={() => openPerawi(item)} style={styles.perawiChip}>
            <Text style={styles.perawiChipText}>{item.nama_latin || item.nama_lengkap || `Perawi ${item.id}`}</Text>
          </Pressable>
        ))}
        {items.length > 6 ? (
          <Pressable
            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
            onPress={() =>
              setExpandedPerawiList((current) => ({
                ...current,
                [listKey]: !current[listKey],
              }))
            }
            style={styles.moreChip}
          >
            <Text style={styles.moreChipText}>{expanded ? 'Ringkas' : `Tampilkan semua (${hiddenCount} lagi)`}</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  const openRelatedAyah = (item) => {
    const ayah = item?.ayah;
    if (!ayah?.surahNumber && !ayah?.number) return;

    navigation?.closeAndOpen?.('hadith', 'quran', {
      ayahId: ayah.id,
      ayahNumber: ayah.number,
      surahNumber: ayah.surahNumber,
    });
  };

  const savedHadiths = bookmarkItems
    .map((item) => item.hadith ?? item.Hadith)
    .filter(Boolean)
    .map(normalizeHadith)
    .slice(0, 5);

  const selectedBookName = books.find((book) => book.slug === selectedBook)?.name ?? 'Semua kitab';

  const filteredHadiths = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return hadiths;

    return hadiths.filter((hadith) => {
      const fields = [
        hadith.title,
        hadith.translation,
        hadith.arabic,
        hadith.book,
        hadith.bookSlug,
        hadith.grade,
        hadith.themeName,
        hadith.chapterName,
        hadith.number,
      ];

      return fields.some((field) => normalizeSearchText(field).includes(term));
    });
  }, [hadiths, query]);

  const summaryBadge = query ? 'Pencarian' : selectedBook ? 'Filter kitab' : `${books.length || 'Semua'} kitab`;

  const visibleHadiths = filteredHadiths.slice(0, visibleCount);
  const displayedHadithCount = visibleHadiths.length;
  const totalHadithCount = query ? filteredHadiths.length : hadithTotal || filteredHadiths.length;
  const summaryMeta = loading
    ? 'Memuat hadis...'
    : `${formatHadithCount(displayedHadithCount)} hadis ditampilkan dari ${formatHadithCount(totalHadithCount)} ${
        query ? 'hasil' : 'hadis'
      }`;
  const hasBufferedHadiths = visibleCount < filteredHadiths.length;
  const hasMoreHadiths = hasBufferedHadiths || (hadithSource === 'backend' && hasMoreRemote);

  const loadMoreHadiths = useCallback(() => {
    if (loading || loadingMore || loadingMoreRef.current || detailLoading) return;

    if (hasBufferedHadiths) {
      setVisibleCount((current) => current + HADITH_LIST_PAGE_SIZE);
      return;
    }

    if (hadithSource === 'backend' && hasMoreRemote) {
      load({
        append: true,
        bookSlug: selectedBook,
        page: remotePage + 1,
        preferOffline: false,
      });
    }
  }, [
    detailLoading,
    hadithSource,
    hasBufferedHadiths,
    hasMoreRemote,
    load,
    loading,
    loadingMore,
    remotePage,
    selectedBook,
  ]);

  const renderCompactHadithCard = (hadith, meta = '') => {
    const bookLabel = getHadithBookLabel(hadith);
    const bookShortLabel = getHadithBookShortLabel(hadith);
    const numberLabel = formatHadithNumber(hadith);
    const gradeLabel = formatHadithGrade(hadith.grade);
    const gradeUnknown = gradeLabel === 'Belum dinilai';
    const topicLabel = getHadithTopicLabel(hadith);
    const hasTopic = topicLabel && normalizeSearchText(topicLabel) !== normalizeSearchText(bookLabel);
    const bodyText = cleanHadithText(hadith.translation || hadith.arabic || 'Teks hadis belum tersedia.');

    return (
      <ContentCard
        key={`${meta}-${hadith.id}`}
        metaRail={[
          { label: bookShortLabel, textStyle: styles.railBook },
          { label: numberLabel, textStyle: styles.railNumber },
          {
            active: !gradeUnknown,
            label: gradeLabel,
            textStyle: gradeUnknown ? styles.railGradeMuted : null,
            variant: 'badge',
          },
        ]}
        numberOfSubtitleLines={3}
        onMenuPress={() => setHadithActionSheet({ visible: true, hadith })}
        onPress={() => openHadith(hadith)}
        style={styles.compactHadith}
        subtitle={bodyText}
        subtitleStyle={styles.compactTranslation}
        title={hasTopic ? topicLabel : bookLabel}
        titleStyle={styles.compactBook}
        eyebrow={hasTopic ? bookLabel : 'Kutipan hadis'}
        eyebrowStyle={styles.compactNumber}
        footer={noteCounts[hadith.id] ? <Text style={styles.compactMeta}>{noteCounts[hadith.id]} catatan</Text> : null}
      />
    );
  };

  const renderWebAppHadithTabs = () => {
    const activeTab = selectedBook || query ? 'hadith' : 'book';

    return (
      <View style={styles.webAppHadithTabs}>
        {WEB_APP_HADITH_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (tab.key === 'book') {
                setQuery('');
                selectBook(null);
              }
            }}
            style={[
              styles.webAppHadithTab,
              { backgroundColor: activeTab === tab.key ? webAppTheme.activeTab : webAppTheme.tab },
              activeTab === tab.key ? styles.webAppHadithTabActive : null,
            ]}
            testID={`hadith-web-app-tab-${tab.key}`}
          >
            <Text
              style={[
                styles.webAppHadithTabText,
                { color: activeTab === tab.key ? '#ffffff' : webAppTheme.tabText },
                activeTab === tab.key ? styles.webAppHadithTabTextActive : null,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderWebAppHadithHeader = () => (
    <View style={styles.webAppHadithHeader}>
      {renderWebAppHadithTabs()}
      <View
        style={[
          styles.webAppHadithSearch,
          { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.searchBorder },
        ]}
        testID="hadith-web-app-search"
      >
        <Search color={webAppTheme.muted} size={16} strokeWidth={2.1} />
        <TextInput
          onChangeText={setQuery}
          placeholder="Cari nomor, kitab, tema, atau teks hadis"
          placeholderTextColor={webAppTheme.muted}
          style={[styles.webAppHadithSearchInput, { color: webAppTheme.input }]}
          value={query}
        />
      </View>
    </View>
  );

  const renderWebAppBookCard = (book) => {
    const count = getHadithBookCount(book);
    const shortLabel = getHadithBookShortLabel({ book: book.name, bookSlug: book.slug });

    return (
      <View
        key={book.slug ?? book.name}
        style={[
          styles.webAppBookCard,
          { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
        ]}
      >
        <View style={[styles.webAppBookCover, getBookCoverStyle(book)]}>
          <Text numberOfLines={2} style={styles.webAppBookCoverTitle}>{shortLabel}</Text>
          <View style={styles.webAppBookCoverRule} />
          <Text style={styles.webAppBookCoverMeta}>Hadith</Text>
        </View>
        <View style={styles.webAppBookCopy}>
          <Text style={[styles.webAppBookTitle, { color: webAppTheme.title }]}>{book.name}</Text>
          <Text style={[styles.webAppBookMeta, { color: webAppTheme.muted }]}>
            {count ? `${count} Hadith` : 'Koleksi Hadith'}
          </Text>
          <Pressable
            onPress={() => selectBook(book.slug)}
            style={styles.webAppBookAction}
            testID={`hadith-web-app-book-${book.slug}`}
          >
            <Text style={styles.webAppBookActionText}>Buka Reader</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderWebAppHadithResults = () => (
    <>
      <View
        style={[
          styles.webAppListSummary,
          { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
        ]}
      >
        <View style={styles.listSummaryCopy}>
          <Text style={[styles.webAppListSummaryTitle, { color: webAppTheme.title }]}>{selectedBookName}</Text>
          <Text style={[styles.webAppListSummaryMeta, { color: webAppTheme.muted }]}>{summaryMeta}</Text>
        </View>
        <Text numberOfLines={1} style={styles.webAppQueryBadge}>{summaryBadge}</Text>
      </View>

      {loading && hadiths.length === 0 ? (
        <ActivityIndicator color={webAppTheme.accent} />
      ) : filteredHadiths.length === 0 ? (
        <View
          style={[
            styles.webAppEmptyCard,
            { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
          ]}
        >
          <Text style={[styles.webAppEmptyTitle, { color: webAppTheme.title }]}>Hadis belum ditemukan</Text>
          <Text style={[styles.webAppEmptyText, { color: webAppTheme.muted }]}>
            {query
              ? 'Coba kata kunci lain, nomor hadis, nama kitab, atau tema yang lebih umum.'
              : 'Daftar hadis untuk filter ini belum tersedia.'}
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.webAppHadithResultCard,
              { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
            ]}
          >
            {visibleHadiths.map((hadith) => (
              <View key={`${hadith.id}-${hadith.title}`} style={styles.hadithListItem}>
                {renderCompactHadithCard(hadith, 'web-app-list')}
              </View>
            ))}
          </View>
          {hasMoreHadiths ? (
            <Pressable
              disabled={loadingMore}
              onPress={loadMoreHadiths}
              style={[
                styles.webAppLoadMoreButton,
                { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
              ]}
            >
              <Text style={[styles.webAppLoadMoreText, { color: webAppTheme.accent }]}>
                {loadingMore
                  ? 'Memuat hadis berikutnya...'
                  : hasBufferedHadiths
                    ? `Muat lagi (${filteredHadiths.length - visibleCount} tersisa)`
                    : 'Muat hadis berikutnya'}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </>
  );

  const sanadPerawi = sanad
    .flatMap((path) => path.mata_sanad ?? [])
    .map((mata) => mata.perawi)
    .filter((perawi, index, all) => perawi?.id && all.findIndex((item) => item?.id === perawi.id) === index);

  const renderDetailTabs = () => (
    <View
      style={[
        styles.detailTabs,
        isWebAppLayout ? styles.webAppDetailTabs : null,
        isWebAppLayout ? { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border } : null,
      ]}
    >
      {HADITH_DETAIL_TABS.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => setDetailTab(tab.key)}
          style={[
            styles.detailTabButton,
            isWebAppLayout ? styles.webAppDetailTabButton : null,
            detailTab === tab.key ? styles.detailTabButtonActive : null,
            isWebAppLayout && detailTab === tab.key ? styles.webAppDetailTabButtonActive : null,
            isWebAppLayout && detailTab === tab.key ? { backgroundColor: webAppTheme.accent } : null,
          ]}
        >
          <Text
            style={[
              styles.detailTabText,
              isWebAppLayout ? styles.webAppDetailTabText : null,
              isWebAppLayout && detailTab !== tab.key ? { color: webAppTheme.text } : null,
              detailTab === tab.key ? styles.detailTabTextActive : null,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setVisibleCount(HADITH_LIST_PAGE_SIZE);
  }, [query, selectedBook]);

  useEffect(() => {
    const hadithId = deepLinkTarget?.params?.hadithId;
    if (handledDeepLinkId.current === deepLinkTarget?.id) return;
    if (!hadithId) return;

    handledDeepLinkId.current = deepLinkTarget.id;
    const fromList = hadiths.find((item) => String(item.id) === String(hadithId));
    openHadith(fromList ?? { id: hadithId, title: `Hadis ${hadithId}` });
  }, [deepLinkTarget?.id, hadiths]);

  useEffect(() => {
    if (!isActive) return;
    if (selectedHadith) {
      navigation?.setBack(() => {
        if (selectedPerawi) { setSelectedPerawi(null); return true; }
        setSelectedHadith(null);
        return true;
      });
    } else {
      navigation?.clearBack?.();
    }
  }, [isActive, selectedHadith, selectedPerawi, navigation]);

  const renderHadithActionSheet = () => {
    const { visible, hadith } = hadithActionSheet;
    if (!hadith) return null;

    const isBookmarked = Boolean(bookmarks[hadith.id]);

    return (
      <AppActionSheet
        onClose={() => setHadithActionSheet({ visible: false, hadith: null })}
        subtitle={getHadithBookLabel(hadith)}
        title="Aksi Cepat"
        visible={visible}
      >
        <ActionSheetRow
          Icon={BookOpen}
          onPress={() => {
            setHadithActionSheet({ visible: false, hadith: null });
            openHadith(hadith);
          }}
          subtitle="Baca teks lengkap, sanad, perawi, dan takhrij"
          title="Buka Detail"
        />
        {user ? (
          <ActionSheetRow
            Icon={isBookmarked ? BookmarkCheck : Bookmark}
            active={isBookmarked}
            disabled={savingId === hadith.id}
            onPress={() => {
              setHadithActionSheet({ visible: false, hadith: null });
              toggleBookmark(hadith);
            }}
            subtitle={isBookmarked ? 'Hapus dari koleksi pribadi' : 'Simpan ke koleksi pribadi'}
            title={isBookmarked ? 'Hapus Bookmark' : 'Bookmark Hadis'}
          />
        ) : null}
      </AppActionSheet>
    );
  };

  if (selectedHadith) {
    const selectedHadithBook = getHadithBookLabel(selectedHadith);
    const selectedHadithNumber = formatHadithNumber(selectedHadith);
    const selectedHadithGrade = formatHadithGrade(selectedHadith.grade);
    const selectedHadithTitle = getHadithTopicLabel(selectedHadith) || `${selectedHadithBook} ${selectedHadithNumber}`;
    const detailScreenTitle = isWebAppLayout ? 'Detail Hadith' : 'Detail Hadis';
    const detailScreenSubtitle = isWebAppLayout
      ? `${selectedHadithBook} ${selectedHadithNumber}`
      : `${selectedHadithBook} · ${selectedHadithNumber} · ${selectedHadithGrade}`;

    return (
      <Screen
        title={detailScreenTitle}
        subtitle={detailScreenSubtitle}
        contentStyle={
          isWebAppLayout
            ? [styles.webAppDetailSurface, { backgroundColor: webAppTheme.bg }]
            : null
        }
        refreshing={detailLoading}
        onRefresh={() => openHadith(selectedHadith)}
        actions={isWebAppLayout ? null : <IconActionButton Icon={ArrowLeft} label="Kembali ke daftar hadis" onPress={() => setSelectedHadith(null)} />}
      >
        <View testID={isWebAppLayout ? 'hadith-web-app-detail' : 'hadith-classic-detail'} />
        {isWebAppLayout ? (
          <View
            style={[
              styles.webAppDetailHero,
              { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
            ]}
            testID="hadith-web-app-detail-hero"
          >
            <Pressable onPress={() => setSelectedHadith(null)} style={styles.webAppDetailBackLink}>
              <ArrowLeft color={webAppTheme.accent} size={15} strokeWidth={2.2} />
              <Text style={[styles.webAppDetailBackText, { color: webAppTheme.accent }]}>Kembali ke daftar hadith</Text>
            </Pressable>
            <Text style={[styles.webAppDetailEyebrow, { color: webAppTheme.accent }]}>Detail Hadith</Text>
            <Text style={[styles.webAppDetailTitle, { color: webAppTheme.title }]}>{selectedHadithTitle}</Text>
            <View style={styles.webAppDetailMetaRow}>
              <Text style={[styles.webAppDetailMetaChip, { backgroundColor: webAppTheme.metaBg, borderColor: webAppTheme.border, color: webAppTheme.text }]}>{selectedHadithBook}</Text>
              <Text style={[styles.webAppDetailMetaChip, { backgroundColor: webAppTheme.metaBg, borderColor: webAppTheme.border, color: webAppTheme.text }]}>{selectedHadithNumber}</Text>
              <Text style={[styles.webAppDetailMetaChip, { backgroundColor: webAppTheme.metaBg, borderColor: webAppTheme.border, color: webAppTheme.text }]}>{selectedHadithGrade}</Text>
            </View>
          </View>
        ) : null}
        {message ? <Text style={isWebAppLayout ? [styles.webAppMessage, { color: webAppTheme.accent }] : styles.message}>{message}</Text> : null}
        {renderDetailTabs()}

        {detailTab === 'text' ? (
          <>
            <Card>
              <CardTitle meta={selectedHadithGrade}>{selectedHadithTitle}</CardTitle>
              {selectedHadith.arabic ? <Text style={styles.arabic}>{selectedHadith.arabic}</Text> : null}
              <Text style={styles.translation}>{cleanHadithText(selectedHadith.translation || selectedHadith.book)}</Text>
              {selectedHadith.gradeNotes ? <Text style={styles.detailNote}>{selectedHadith.gradeNotes}</Text> : null}
              {selectedHadith.sanad ? <Text style={styles.inlineSanad}>{selectedHadith.sanad}</Text> : null}
              {user ? (
                <ActionPill
                  disabled={savingId === selectedHadith.id}
                  Icon={bookmarks[selectedHadith.id] ? BookmarkCheck : Bookmark}
                  label={
                    savingId === selectedHadith.id
                      ? 'Menyimpan'
                      : bookmarks[selectedHadith.id]
                        ? 'Hapus bookmark'
                        : 'Bookmark hadis'
                  }
                  onPress={() => toggleBookmark(selectedHadith)}
                  active={Boolean(bookmarks[selectedHadith.id])}
                />
              ) : null}
            </Card>

            <Card>
              <CardTitle meta={`${relatedHadiths.length} item`}>Hadis Terkait</CardTitle>
              {detailLoading && relatedHadiths.length === 0 ? (
                <ActivityIndicator color={colors.primary} />
              ) : relatedHadiths.length === 0 ? (
                <Text style={styles.emptyText}>Belum ada hadis terkait untuk tema ini.</Text>
              ) : (
                relatedHadiths.map((item) => renderCompactHadithCard(item, 'related'))
              )}
            </Card>
          </>
        ) : null}

        {detailTab === 'sanad' ? (
          <Card>
            <CardTitle meta={`${sanad.length} jalur`}>Sanad</CardTitle>
            {detailLoading && sanad.length === 0 ? (
              <ActivityIndicator color={colors.primary} />
            ) : sanad.length === 0 ? (
              <Text style={styles.emptyText}>Jalur sanad untuk hadis ini belum tersedia.</Text>
            ) : (
              sanad.map((path, index) => (
                <View key={`${path.id}-${index}`} style={styles.detailBlock}>
                  <SectionHeader title={`Jalur ${path.nomor_jalur ?? index + 1}`} meta={path.status_sanad || path.jenis || 'sanad'} />
                  {path.catatan ? <Text style={styles.detailNote}>{path.catatan}</Text> : null}
                  {(path.mata_sanad ?? []).map((mata, mataIndex) => (
                    <Pressable
                      key={`${mata.id}-${mataIndex}`}
                      onPress={() => openPerawi(mata.perawi)}
                      style={[styles.chainRow, selectedPerawi?.id === mata.perawi?.id ? styles.chainRowActive : null]}
                    >
                      <Text style={styles.chainIndex}>{mata.urutan ?? mataIndex + 1}</Text>
                      <View style={styles.chainBody}>
                        <Text style={styles.chainName}>
                          {mata.perawi?.nama_latin || mata.perawi?.nama_lengkap || `Perawi ${mata.perawi_id ?? ''}`}
                        </Text>
                        {mata.perawi?.nama_arab ? <Text style={styles.chainArabic}>{mata.perawi.nama_arab}</Text> : null}
                        <Text style={styles.chainMeta}>
                          {[mata.metode, mata.perawi?.status, mata.perawi?.tabaqah].filter(Boolean).join(' · ') ||
                            'Perawi'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))
            )}
            <Text style={styles.referenceMeta}>Ketuk perawi untuk membuka ringkasan biografi.</Text>
          </Card>
        ) : null}

        {detailTab === 'narrators' ? (
          <Card>
            <CardTitle meta={`${sanadPerawi.length} perawi`}>Perawi</CardTitle>
            {sanadPerawi.length ? (
              <View style={styles.chipWrap}>
                {sanadPerawi.map((perawi) => (
                  <Pressable key={perawi.id} onPress={() => openPerawi(perawi)} style={styles.perawiChip}>
                    <Text style={styles.perawiChipText}>
                      {perawi.nama_latin || perawi.nama_lengkap || `Perawi ${perawi.id}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Data perawi untuk hadis ini belum tersedia.</Text>
            )}

            {selectedPerawi ? (
              <View style={styles.narratorPanel}>
                <SectionHeader
                  title={selectedPerawi.nama_latin || selectedPerawi.nama_lengkap || `Perawi ${selectedPerawi.id}`}
                  meta={selectedPerawi.tabaqah || selectedPerawi.status || 'perawi'}
                />
                {selectedPerawi.nama_arab ? <Text style={styles.perawiArabic}>{selectedPerawi.nama_arab}</Text> : null}
                {selectedPerawi.nama_lengkap ? <Text style={styles.detailNote}>{selectedPerawi.nama_lengkap}</Text> : null}
                <Text style={styles.chainMeta}>
                  {[
                    selectedPerawi.kunyah,
                    selectedPerawi.nisbah,
                    selectedPerawi.tahun_wafat ? `w. ${selectedPerawi.tahun_wafat} H` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Profil perawi'}
                </Text>
                {selectedPerawi.biografis ? <Text style={styles.perawiBio}>{selectedPerawi.biografis}</Text> : null}

                {perawiPanel.loading ? <ActivityIndicator color={colors.primary} /> : null}

                <View style={styles.subSection}>
                  <Text style={styles.subTitle}>Jarh wa Ta'dil</Text>
                  {perawiPanel.jarhTadil.length === 0 ? (
                    <Text style={styles.emptyText}>Penilaian jarh-ta'dil belum tersedia.</Text>
                  ) : (
                    perawiPanel.jarhTadil.map((item) => (
                      <View key={item.id} style={styles.assessmentRow}>
                        <Text style={styles.assessmentTitle}>
                          {item.teks_nilai || item.jenis_nilai || 'Penilaian'}
                        </Text>
                        <Text style={styles.referenceMeta}>
                          {[item.penilai?.nama_latin, item.sumber, item.halaman].filter(Boolean).join(' · ') || 'Sumber'}
                        </Text>
                        {item.catatan ? <Text style={styles.detailNote}>{item.catatan}</Text> : null}
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subTitle}>Guru</Text>
                  <View style={styles.chipWrap}>{renderPerawiList(perawiPanel.guru, 'guru')}</View>
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subTitle}>Murid</Text>
                  <View style={styles.chipWrap}>{renderPerawiList(perawiPanel.murid, 'murid')}</View>
                </View>
              </View>
            ) : sanadPerawi.length ? (
              <Text style={styles.referenceMeta}>Pilih salah satu perawi untuk melihat ringkasan biografi.</Text>
            ) : null}
          </Card>
        ) : null}

        {detailTab === 'takhrij' ? (
          <Card>
            <CardTitle meta={`${takhrij.length} rujukan`}>Takhrij</CardTitle>
            {detailLoading && takhrij.length === 0 ? (
              <ActivityIndicator color={colors.primary} />
            ) : takhrij.length === 0 ? (
              <Text style={styles.emptyText}>Rujukan takhrij untuk hadis ini belum tersedia.</Text>
            ) : (
              takhrij.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.referenceRow}>
                  <Text style={styles.referenceTitle}>
                    {item.book?.translation?.latin_en || item.book?.translation?.idn || item.book?.slug || 'Kitab hadis'}
                  </Text>
                  <Text style={styles.referenceMeta}>
                    {[item.nomor_hadis_kitab, item.jilid, item.halaman].filter(Boolean).join(' · ') || 'Rujukan'}
                  </Text>
                  {item.catatan ? <Text style={styles.detailNote}>{item.catatan}</Text> : null}
                </View>
              ))
            )}
          </Card>
        ) : null}

        {detailTab === 'ayat' ? (
          <Card>
            <CardTitle meta={`${hadithAyahs.length} ayat`}>Ayat Terkait</CardTitle>
            {detailLoading && hadithAyahs.length === 0 ? (
              <ActivityIndicator color={colors.primary} />
            ) : hadithAyahs.length === 0 ? (
              <Text style={styles.emptyText}>Ayat terkait untuk hadis ini belum tersedia.</Text>
            ) : (
              hadithAyahs.map((item) => (
                <Pressable
                  accessibilityLabel={
                    item.ayah
                      ? `Buka ${item.ayah.surahName || 'surah'} ayat ${item.ayah.number} di Al-Quran`
                      : 'Ayat terkait'
                  }
                  accessibilityRole="button"
                  android_ripple={{ color: 'rgba(91, 110, 91, 0.08)', borderless: false }}
                  key={item.id}
                  onPress={() => openRelatedAyah(item)}
                  style={styles.referenceRow}
                >
                  {item.ayah ? (
                    <Text style={styles.referenceTitle}>
                      {item.ayah.surahName} · Ayat {item.ayah.number}
                    </Text>
                  ) : null}
                  {item.ayah?.arabic ? (
                    <Text style={styles.arabic}>{item.ayah.arabic}</Text>
                  ) : null}
                  {item.ayah?.translation ? (
                    <Text style={styles.translation}>{item.ayah.translation}</Text>
                  ) : null}
                  {item.catatan ? (
                    <Text style={styles.detailNote}>{item.catatan}</Text>
                  ) : null}
                  <Text style={styles.referenceMeta}>Ketuk untuk membuka ayat di Al-Qur'an.</Text>
                </Pressable>
              ))
            )}
          </Card>
        ) : null}

        {detailTab === 'notes' ? (
          <Card>
            <CardTitle meta={user ? 'Pribadi' : 'Masuk akun'}>Catatan</CardTitle>
            {user ? (
              <NotesPanel refType="hadith" refId={selectedHadith.id} />
            ) : (
              <Text style={styles.emptyText}>Buka Profil untuk masuk dan menulis catatan hadis.</Text>
            )}
          </Card>
        ) : null}
        {renderHadithActionSheet()}
      </Screen>
    );
  }

  if (isWebAppLayout) {
    const showBookShelf = !selectedBook && !query;

    return (
      <ScrollView
        contentContainerStyle={[styles.webAppHadithContent, { backgroundColor: webAppTheme.bg }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshAll}
            tintColor={webAppTheme.accent}
          />
        }
        scrollEventThrottle={250}
        showsVerticalScrollIndicator={false}
        style={[styles.webAppHadithScroll, { backgroundColor: webAppTheme.bg }]}
        testID="hadith-web-app-scroll"
      >
        <View testID="hadith-web-app-list" />
        {renderWebAppHadithHeader()}
        {message ? <Text style={[styles.webAppMessage, { color: webAppTheme.accent }]}>{message}</Text> : null}
        {showBookShelf ? (
          <>
            {loading && books.length === 0 ? (
              <ActivityIndicator color={webAppTheme.accent} />
            ) : null}
            {books.map(renderWebAppBookCard)}
          </>
        ) : (
          renderWebAppHadithResults()
        )}
        {renderHadithActionSheet()}
      </ScrollView>
    );
  }

  return (
    <Screen
      title="Hadis"
      subtitle="Baca hadis beserta sanad, perawi, dan rujukan takhrij."
      contentStyle={isWebAppLayout ? styles.webAppSurface : null}
      refreshing={loading}
      onRefresh={refreshAll}
      onEndReached={loadMoreHadiths}
      searchSlot={
        <PaperSearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nomor, kitab, tema, atau teks hadis"
        />
      }
    >
      <View testID={isWebAppLayout ? 'hadith-web-app-list' : 'hadith-classic-list'} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {!user ? <Text style={styles.notice}>Buka Profil untuk masuk dan menyimpan bookmark hadis.</Text> : null}

      {books.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bookFilterRow}
        >
          <Pressable
            onPress={() => selectBook(null)}
            style={[styles.bookChip, selectedBook === null ? styles.bookChipActive : null]}
          >
            <Text style={[styles.bookChipText, selectedBook === null ? styles.bookChipTextActive : null]}>
              Semua
            </Text>
          </Pressable>
          {books.map((book) => (
            <Pressable
              key={book.slug}
              onPress={() => selectBook(book.slug)}
              style={[styles.bookChip, selectedBook === book.slug ? styles.bookChipActive : null]}
            >
              <Text
                style={[
                  styles.bookChipText,
                  selectedBook === book.slug ? styles.bookChipTextActive : null,
                ]}
              >
                {book.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {user && savedHadiths.length > 0 ? (
        <Card>
          <CardTitle meta={`${savedHadiths.length} tersimpan`}>Hadis Tersimpan</CardTitle>
          {savedHadiths.map((item) => renderCompactHadithCard(item, 'saved'))}
        </Card>
      ) : null}

      <View style={styles.listSummary}>
        <View style={styles.listSummaryCopy}>
          <Text style={styles.listSummaryTitle}>{selectedBookName}</Text>
          <Text style={styles.listSummaryMeta}>{summaryMeta}</Text>
        </View>
        <Text numberOfLines={1} style={styles.queryBadge}>{summaryBadge}</Text>
      </View>

      {loading && hadiths.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : filteredHadiths.length === 0 ? (
        <Card>
          <CardTitle meta={query ? 'Tidak cocok' : 'Kosong'}>Hadis belum ditemukan</CardTitle>
          <Text style={styles.emptyText}>
            {query
              ? 'Coba kata kunci lain, nomor hadis, nama kitab, atau tema yang lebih umum.'
              : 'Daftar hadis untuk filter ini belum tersedia.'}
          </Text>
        </Card>
      ) : (
        <>
          <Card>
            {visibleHadiths.map((hadith) => (
              <View key={`${hadith.id}-${hadith.title}`} style={styles.hadithListItem}>
                {renderCompactHadithCard(hadith, 'list')}
              </View>
            ))}
          </Card>
          {hasMoreHadiths ? (
            <Pressable
              android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
              disabled={loadingMore}
              onPress={loadMoreHadiths}
              style={styles.loadMoreButton}
            >
              <Text style={styles.loadMoreText}>
                {loadingMore
                  ? 'Memuat hadis berikutnya...'
                  : hasBufferedHadiths
                    ? `Muat lagi (${filteredHadiths.length - visibleCount} tersisa)`
                    : 'Muat hadis berikutnya'}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
      {renderHadithActionSheet()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  arabic: {
    ...arabicTypography.body,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  webAppSurface: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  webAppDetailSurface: {
    backgroundColor: WEB_APP_HADITH_BG,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  webAppDetailHero: {
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: WEB_APP_HADITH_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  webAppDetailBackLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    minHeight: 32,
  },
  webAppDetailBackText: {
    color: WEB_APP_HADITH_ACCENT,
    fontSize: 13,
    fontWeight: '800',
  },
  webAppDetailEyebrow: {
    color: WEB_APP_HADITH_ACCENT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  webAppDetailTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  webAppDetailMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  webAppDetailMetaChip: {
    backgroundColor: '#0f172a',
    borderColor: WEB_APP_HADITH_BORDER,
    borderRadius: 999,
    borderWidth: 1,
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  webAppDetailTabs: {
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: WEB_APP_HADITH_BORDER,
  },
  webAppDetailTabButton: {
    minHeight: 34,
  },
  webAppDetailTabButtonActive: {
    backgroundColor: WEB_APP_HADITH_ACCENT,
  },
  webAppDetailTabText: {
    color: '#cbd5e1',
  },
  webAppHadithScroll: {
    backgroundColor: WEB_APP_HADITH_BG,
    flex: 1,
  },
  webAppHadithContent: {
    backgroundColor: WEB_APP_HADITH_BG,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  webAppHadithHeader: {
    marginBottom: spacing.md,
  },
  webAppHadithTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  webAppHadithTab: {
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  webAppHadithTabActive: {
    backgroundColor: '#059669',
  },
  webAppHadithTabText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  webAppHadithTabTextActive: {
    color: '#ffffff',
  },
  webAppHadithSearch: {
    alignItems: 'center',
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: '#475569',
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  webAppHadithSearchInput: {
    color: '#e2e8f0',
    flex: 1,
    fontSize: 14,
    minHeight: 36,
    padding: 0,
  },
  webAppBookCard: {
    alignItems: 'stretch',
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: WEB_APP_HADITH_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    minHeight: 164,
    padding: spacing.sm,
  },
  webAppBookCover: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    padding: spacing.sm,
    width: 116,
  },
  webAppBookCoverTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  webAppBookCoverRule: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    height: 1,
    marginVertical: spacing.sm,
    width: '76%',
  },
  webAppBookCoverMeta: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  webAppBookCopy: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
    paddingVertical: spacing.sm,
  },
  webAppBookTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  webAppBookMeta: {
    color: WEB_APP_HADITH_MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  webAppBookAction: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  webAppBookActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  webAppListSummary: {
    alignItems: 'center',
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: WEB_APP_HADITH_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  webAppListSummaryTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  webAppListSummaryMeta: {
    color: WEB_APP_HADITH_MUTED,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  webAppQueryBadge: {
    backgroundColor: '#0f766e',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    textAlign: 'center',
  },
  webAppHadithResultCard: {
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: WEB_APP_HADITH_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  webAppEmptyCard: {
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: WEB_APP_HADITH_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  webAppEmptyTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  webAppEmptyText: {
    color: WEB_APP_HADITH_MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  webAppMessage: {
    color: WEB_APP_HADITH_ACCENT,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  webAppLoadMoreButton: {
    alignItems: 'center',
    backgroundColor: WEB_APP_HADITH_SURFACE,
    borderColor: WEB_APP_HADITH_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 42,
  },
  webAppLoadMoreText: {
    color: WEB_APP_HADITH_ACCENT,
    fontSize: 13,
    fontWeight: '900',
  },
  translation: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  bookFilterRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  bookChip: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bookChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bookChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  bookChipTextActive: {
    color: '#ffffff',
  },
  notice: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  message: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  listSummary: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listSummaryCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  listSummaryTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  listSummaryMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  queryBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    textAlign: 'center',
  },
  detailTabs: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
    padding: 4,
  },
  detailTabButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 4,
  },
  detailTabButtonActive: {
    backgroundColor: colors.primary,
  },
  detailTabText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  detailTabTextActive: {
    color: colors.onPrimary,
  },
  backButton: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 42,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  inlineSanad: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  detailBlock: {
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    paddingVertical: spacing.md,
  },
  detailNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  chainRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  chainRowActive: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  chainIndex: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    minWidth: 28,
    overflow: 'hidden',
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  chainBody: {
    flex: 1,
  },
  chainName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  chainArabic: {
    ...arabicTypography.small,
    color: colors.text,
    marginTop: spacing.xs,
  },
  chainMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  perawiArabic: {
    ...arabicTypography.compact,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  perawiBio: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  narratorPanel: {
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  subSection: {
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  subTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  assessmentRow: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  assessmentTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  perawiChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  perawiChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  moreChip: {
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  moreChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  referenceRow: {
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    paddingVertical: spacing.md,
  },
  referenceTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  referenceMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  compactHadith: {
    backgroundColor: 'transparent',
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    borderRadius: 0,
    borderWidth: 0,
    marginTop: 0,
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
  },
  railBook: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  railNumber: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginTop: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  railGradeMuted: {
    color: colors.muted,
  },
  compactBook: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  compactNumber: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  compactTranslation: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  compactMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  loadMoreButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 42,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 42,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  button: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 42,
  },
  activeButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  activeButtonText: {
    color: colors.primaryDark,
  },
});
