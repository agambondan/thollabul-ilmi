import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Bookmark, BookmarkCheck, CheckCircle2, Circle, ExternalLink, EyeOff, Flag, Heart, MessageCircle, Pencil, StickyNote, Trash2, UserCircle } from 'lucide-react-native';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  getAllNotes,
  getAsmaulNames,
  getBookmarkItems,
  getFeatureItemPage,
  getHijriOverview,
  getQuizQuestions,
  getZakatGoldPrice,
  searchDictionary,
} from '../api/explore';
import { createComment, getCommentsByRef, getFeedPostPage, hideFeedPost, likeFeedPost, reportFeedPost } from '../api/social';
import {
  acceptForumAnswer,
  createForumAnswer,
  createForumQuestion,
  getForumQuestion,
  getForumQuestions,
  voteForum,
} from '../api/forum';
import { AppActionSheet, ActionSheetRow } from '../components/AppActionSheet';
import { Card, CardTitle } from '../components/Card';
import { ContentCard } from '../components/ContentCard';
import { NotesPanel } from '../components/NotesPanel';
import { NotificationCenter } from '../components/NotificationCenter';
import { ActionPill, IconActionButton, PaperSearchInput } from '../components/Paper';
import { Screen } from '../components/Screen';
import { useFeedback } from '../context/FeedbackContext';
import { useSession } from '../context/SessionContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { FeatureCatalog, findFeatureByKey, isPaginatedFeature, LOCAL_TOOL_TYPES } from './explore/FeatureCatalog';
import {
  deleteCalculatorHistory,
  mergeCalculatorHistory,
  readCalculatorHistory,
  saveCalculatorHistory,
} from '../storage/calculatorHistory';
import { readAsmaulWiridCounts, setAsmaulWiridCount } from '../storage/asmaulWirid';
import { readPinnedFeatures, readRecentFeatures, rememberFeatureOpen, togglePinnedFeature } from '../storage/recentFeatures';
import { arabicTypography } from '../styles/arabicTypography';
import { colors, radius, spacing } from '../theme';
import {
  addBookmark,
  createUserWird,
  deleteBookmark,
  deleteFaraidh,
  deleteKalkulasiZakat,
  deleteUserWird,
  getBookmarks,
  getFaraidhHistory,
  getKalkulasiZakat,
  getLibraryProgress,
  getLibraryProgressList,
  getTodayPrayerLog,
  getUserWirds,
  saveFaraidh,
  saveKalkulasiZakat,
  saveLibraryProgress,
  savePrayerLog,
  updateUserWird,
} from '../api/personal';
import { getAyahById, getSurahs } from '../api/client';
import { calculateFaraidh, HEIR_LABELS } from '../lib/faraidh';
import { hapticMedium, hapticTap } from '../utils/haptics';
import { HistoricalMapContent } from './HistoricalMapScreen';
import { TokohTarikhContent } from './TokohTarikhContent';

const quizOptions = ['A', 'B', 'C', 'D'];

const EXPLORE_PAGE_SIZE = 20;
const TAFSIR_SOURCE_LABELS = {
  kemenag: 'Tafsir Kemenag',
  secondary: 'Tafsir Al-Mishbah',
};
const TAFSIR_MODES = [
  { key: 'all', label: 'Semua' },
  { key: 'side-by-side', label: 'Bandingkan' },
  { key: 'kemenag', label: 'Kemenag' },
  { key: 'mishbah', label: 'Al-Mishbah' },
];
const LIBRARY_PROGRESS_STATUSES = [
  { key: 'planned', label: 'Rencana' },
  { key: 'reading', label: 'Dibaca' },
  { key: 'paused', label: 'Dijeda' },
  { key: 'completed', label: 'Selesai' },
];
const getLibraryProgressLabel = (status) =>
  LIBRARY_PROGRESS_STATUSES.find((item) => item.key === status)?.label ?? 'Dibaca';

const PRAYER_ITEMS = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
];

const emptyUserWirdForm = {
  arabic: '',
  count: '1',
  note: '',
  occasion: '',
  source: '',
  title: '',
  translation: '',
  transliteration: '',
};

const refKey = (refType, refId) => `${refType}:${refId}`;
const digitsOnly = (value = '') => `${value}`.replace(/[^\d]/g, '');
const parseNumericInput = (value = '') => Number(digitsOnly(value)) || 0;
const normalizeSearchText = (value = '') => `${value}`.trim().toLowerCase();
const formatNumericInput = (value = '') => {
  const normalized = digitsOnly(value);
  if (!normalized) return '';
  return Number(normalized).toLocaleString('id-ID');
};
const formatCurrency = (value = 0) => `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`;
const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim()) ?? '';
const normalizeAsmaulName = (item = {}, index = 0) => ({
  arabic: pickText(item.arabic, item.translation?.arab, item.translation?.ar, item.name),
  id: item.id ?? item.number ?? index + 1,
  meaning: pickText(item.indonesian, item.meaning, item.translation?.idn, item.translation?.en, item.english),
  number: item.number ?? index + 1,
  transliteration: pickText(item.transliteration, item.latin, item.translation?.latin_idn, item.translation?.latin_en),
});
const normalizePrayerLog = (payload = {}) => {
  const prayers = payload?.prayers ?? payload;
  return PRAYER_ITEMS.reduce((acc, item) => {
    const value = prayers?.[item.key];
    if (typeof value === 'boolean') {
      acc[item.key] = value;
    } else if (value && typeof value === 'object') {
      acc[item.key] = Boolean(value.status && value.status !== 'missed');
    }
    return acc;
  }, {});
};

const getItemRef = (feature, item) => {
  if (feature?.type === 'feed') {
    return {
      refId: String(item?.raw?.ref_id ?? item?.id ?? ''),
      refType: item?.raw?.ref_type ?? 'feed',
    };
  }
  return {
    refType: feature?.refType ?? feature?.key ?? 'explore',
    refId: String(item?.id ?? item?.raw?.id ?? item?.raw?.slug ?? item?.title),
  };
};
const getExploreItemKey = (item) => String(item?.id ?? item?.raw?.id ?? item?.raw?.slug ?? item?.title ?? item?.body);
const mergeUniqueItems = (currentItems, nextItems) => {
  const seen = new Set(currentItems.map(getExploreItemKey));
  const merged = [...currentItems];

  nextItems.forEach((item) => {
    const key = getExploreItemKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged;
};

const normalizeUserWirdItem = (item, index = 0) => ({
  id: item?.id ?? `user-wird-${index}`,
  title: item?.title ?? `Wirid ${index + 1}`,
  arabic: item?.arabic ?? '',
  body: [item?.transliteration, item?.translation, item?.note].filter(Boolean).join('\n'),
  meta: [item?.occasion, item?.count ? `${item.count}x` : '', item?.source].filter(Boolean).join(' · '),
  raw: item,
});

export function ExploreScreen({ deepLinkTarget, isActive, navigation, onOpenTab }) {
  const { session } = useSession();
  const { showError, showInfo, showSuccess } = useFeedback();
  const { isWebAppLayout } = useLayoutModePreference();
  const handledDeepLinkId = useRef(null);
  const dictionaryInputRef = useRef(null);
  const zakatTimerRef = useRef(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [activeFeature, setActiveFeature] = useState(null);
  const [featureReturnRoute, setFeatureReturnRoute] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingBookmark, setSavingBookmark] = useState('');
  const [itemActionSheet, setItemActionSheet] = useState({ visible: false, item: null });
  const [focusDictionaryInput, setFocusDictionaryInput] = useState(false);
  const [dictionaryQuery, setDictionaryQuery] = useState('');
  const [tasbih, setTasbih] = useState({ count: 0, target: 33 });
  const [asmaulNames, setAsmaulNames] = useState([]);
  const [asmaulIndex, setAsmaulIndex] = useState(0);
  const [asmaulCounts, setAsmaulCounts] = useState({});
  const [asmaulFlashcardRevealed, setAsmaulFlashcardRevealed] = useState(false);
  const [asmaulLoading, setAsmaulLoading] = useState(false);
  const [zakat, setZakat] = useState({ assets: '', debts: '', nisab: '85000000' });
  const [zakatTab, setZakatTab] = useState(0);
  const [zakatGoldPrice, setZakatGoldPrice] = useState('1050000');
  const [zakatRicePrice, setZakatRicePrice] = useState('16000');
  const [zakatFamilyCount, setZakatFamilyCount] = useState(1);
  const [zakatMonthlyIncome, setZakatMonthlyIncome] = useState('');
  const [zakatTradeCapital, setZakatTradeCapital] = useState('');
  const [zakatTradeStock, setZakatTradeStock] = useState('');
  const [zakatTradeReceivable, setZakatTradeReceivable] = useState('');
  const [zakatTradeDebt, setZakatTradeDebt] = useState('');
  const [zakatHarvestWeight, setZakatHarvestWeight] = useState('');
  const [zakatHarvestIrrigated, setZakatHarvestIrrigated] = useState(false);
  const [zakatRiceKgPrice, setZakatRiceKgPrice] = useState('16000');
  const [zakatGoldGrams, setZakatGoldGrams] = useState('');
  const [zakatSilverPrice, setZakatSilverPrice] = useState('14000');
  const [zakatSilverGrams, setZakatSilverGrams] = useState('');
  const [zakatHaul, setZakatHaul] = useState(true);
  const [zakatTradeHaul, setZakatTradeHaul] = useState(true);
  const [zakatGoldHaul, setZakatGoldHaul] = useState(true);
  const [zakatHistory, setZakatHistory] = useState([]);
  const [zakatSaving, setZakatSaving] = useState(false);
  const [zakatSavedMsg, setZakatSavedMsg] = useState('');
  const [faraidh, setFaraidh] = useState({
    estate: '', debts: '', bequest: '',
    heirs: { suami: 0, istri: 0, anakL: 0, anakP: 0, ayah: 0, ibu: 0, kakek: 0, nenek: 0, saudaraL: 0, saudaraP: 0 },
  });
  const [faraidhHistory, setFaraidhHistory] = useState([]);
  const [savingFaraidh, setSavingFaraidh] = useState(false);
  const [showFaraidhHistory, setShowFaraidhHistory] = useState(false);
  const [faraidhCatatan, setFaraidhCatatan] = useState('');
  const [answers, setAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeNoteRef, setActiveNoteRef] = useState('');
  const [libraryProgress, setLibraryProgress] = useState(null);
  const [libraryProgressMap, setLibraryProgressMap] = useState({});
  const [libraryProgressFilter, setLibraryProgressFilter] = useState('');
  const [libraryProgressDraft, setLibraryProgressDraft] = useState({ currentPage: '', note: '', status: 'reading' });
  const [libraryProgressMessage, setLibraryProgressMessage] = useState('');
  const [libraryProgressSaving, setLibraryProgressSaving] = useState(false);
  const [pinnedFeatureKeys, setPinnedFeatureKeys] = useState({});
  const [recentFeatureKeys, setRecentFeatureKeys] = useState({});
  const [feedComments, setFeedComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [likingFeedId, setLikingFeedId] = useState('');
  const [editingUserWirdId, setEditingUserWirdId] = useState('');
  const [savingUserWird, setSavingUserWird] = useState(false);
  const [userWirdForm, setUserWirdForm] = useState(emptyUserWirdForm);
  const [surahs, setSurahs] = useState([]);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(null);
  const [surahSearch, setSurahSearch] = useState('');
  const [tafsirMode, setTafsirMode] = useState('all');
  const [forumView, setForumView] = useState('list');
  const [forumQuestions, setForumQuestions] = useState([]);
  const [forumTotal, setForumTotal] = useState(0);
  const [forumPage, setForumPage] = useState(0);
  const [forumHasMore, setForumHasMore] = useState(false);
  const [forumLoading, setForumLoading] = useState(false);
  const [forumSearch, setForumSearch] = useState('');
  const [forumSlug, setForumSlug] = useState('');
  const [forumDetail, setForumDetail] = useState(null);
  const [forumAnswers, setForumAnswers] = useState([]);
  const [forumAskTitle, setForumAskTitle] = useState('');
  const [forumAskBody, setForumAskBody] = useState('');
  const [forumAskTags, setForumAskTags] = useState('');
  const [forumAnswerDraft, setForumAnswerDraft] = useState('');
  const [forumSaving, setForumSaving] = useState(false);
  const [forumVotingId, setForumVotingId] = useState('');
  const [forumError, setForumError] = useState('');
  const [sholatLog, setSholatLog] = useState({});
  const [pagination, setPagination] = useState({ page: 0, hasMore: false, loadingMore: false });
  const loadingMoreRef = useRef(false);

  const visibleSurahOptions = useMemo(() => {
    const query = normalizeSearchText(surahSearch);
    const matches = query
      ? surahs.filter((surah) =>
          normalizeSearchText(`${surah.number} ${surah.name} ${surah.latin ?? ''} ${surah.translation ?? ''}`).includes(query),
        )
      : surahs.slice(0, 24);

    if (!query && selectedSurahNumber && !matches.some((surah) => surah.number === selectedSurahNumber)) {
      const selected = surahs.find((surah) => surah.number === selectedSurahNumber);
      return selected ? [selected, ...matches] : matches;
    }

    return matches;
  }, [selectedSurahNumber, surahSearch, surahs]);

  const refreshDiscoveryState = useCallback(async () => {
    const [pinned, recent] = await Promise.all([readPinnedFeatures(), readRecentFeatures()]);
    setPinnedFeatureKeys(
      pinned.reduce((acc, feature) => {
        acc[feature.key] = true;
        return acc;
      }, {}),
    );
    setRecentFeatureKeys(
      recent.reduce((acc, feature) => {
        acc[feature.key] = true;
        return acc;
      }, {}),
    );
  }, []);

  const handleTogglePinnedFeature = useCallback(async (event, feature) => {
    event?.stopPropagation?.();
    hapticTap();
    try {
      const result = await togglePinnedFeature(feature);
      setPinnedFeatureKeys(
        result.items.reduce((acc, item) => {
          acc[item.key] = true;
          return acc;
        }, {}),
      );
      showSuccess(result.pinned ? `${feature.title} disematkan.` : `${feature.title} dilepas dari shortcut.`);
    } catch {
      setError('Shortcut belum bisa diperbarui.');
      showError('Shortcut belum bisa diperbarui.');
    }
  }, [showError, showSuccess]);

  const loadFeature = useCallback(
    async (feature, options = {}) => {
      rememberFeatureOpen(feature)
        .then((recent) => {
          setRecentFeatureKeys(
            recent.reduce((acc, item) => {
              acc[item.key] = true;
              return acc;
            }, {}),
          );
        })
        .catch(e => console.error(e));
      setActiveFeature(feature);
      setFeatureReturnRoute(options.returnTo ?? null);
      setItems([]);
      setAnswers({});
      setSelectedItem(null);
      setActiveNoteRef('');
      setLibraryProgressFilter('');
      setFeedComments([]);
      setCommentDraft('');
      setEditingUserWirdId('');
      setUserWirdForm(emptyUserWirdForm);
      setError('');
      setAsmaulFlashcardRevealed(false);
      setTafsirMode('all');
      loadingMoreRef.current = false;
      setPagination({ page: 0, hasMore: false, loadingMore: false });
      setFocusDictionaryInput(Boolean(options.focusSearch && feature?.type === 'kamus'));
      if (feature?.type !== 'surah-content') {
        setSelectedSurahNumber(null);
      }

      if (LOCAL_TOOL_TYPES.includes(feature.type)) {
        if (feature.type === 'surah-content') {
          setLoading(true);
          try {
            setSurahs(await getSurahs());
          } catch (err) {
            setError(err?.message ?? 'Daftar surah belum bisa dimuat.');
          } finally {
            setLoading(false);
          }
        }

        if (feature.type === 'sholat-tracker') {
          if (!session?.token) {
            setError('Buka Profil untuk masuk dan melacak sholat.');
            return;
          }
          setLoading(true);
          try {
            const log = await getTodayPrayerLog();
            setSholatLog(normalizePrayerLog(log));
          } catch {
            setSholatLog({});
          } finally {
            setLoading(false);
          }
        }

        if (['asmaul-wirid', 'asmaul-flashcard'].includes(feature.type) && asmaulNames.length === 0) {
          setAsmaulLoading(true);
          try {
            const items = await getAsmaulNames();
            setAsmaulNames((items ?? []).map(normalizeAsmaulName));
            setAsmaulIndex(0);
          } catch { /* silent */ }
          setAsmaulLoading(false);
        }

        if (feature.type === 'asmaul-wirid') {
          readAsmaulWiridCounts()
            .then(setAsmaulCounts)
            .catch(() => setAsmaulCounts({}));
        }

        if (feature.type === 'zakat') {
          getZakatGoldPrice()
            .then((price) => {
              if (price) setZakatGoldPrice(`${price}`);
            })
            .catch(e => console.error(e));
        }

        if (feature.type === 'forum') {
          setForumView('list');
          setForumSearch('');
          setForumPage(0);
          setForumQuestions([]);
          setForumTotal(0);
          setForumHasMore(false);
          setForumDetail(null);
          setForumAnswers([]);
          setForumError('');
          setForumLoading(true);
          try {
            const result = await getForumQuestions({ page: 0, size: 10 });
            setForumQuestions(result.items);
            setForumTotal(result.total);
            setForumPage(0);
            setForumHasMore(result.hasMore);
          } catch (err) {
            setForumError(err?.message ?? 'Forum belum bisa dimuat.');
          } finally {
            setForumLoading(false);
          }
        }

        return;
      }

      if (['protected-list', 'bookmarks', 'notes', 'user-wird'].includes(feature.type) && !session?.token) {
        if (feature.type === 'user-wird') return;
        setError('Buka Profil untuk masuk dan membuka fitur personal ini.');
        return;
      }

      setLoading(true);
      try {
        let nextItems = [];
        if (feature.type === 'bookmarks') {
          nextItems = await getBookmarkItems();
        } else if (feature.type === 'notes') {
          nextItems = await getAllNotes();
        } else if (feature.type === 'quiz') {
          nextItems = await getQuizQuestions();
        } else if (feature.type === 'hijri') {
          nextItems = await getHijriOverview();
        } else if (feature.type === 'feed') {
          const page = await getFeedPostPage({ page: 0, size: EXPLORE_PAGE_SIZE });
          nextItems = page.items;
          setPagination({
            page: 0,
            hasMore: page.meta.hasMore,
            loadingMore: false,
          });
        } else if (feature.type === 'user-wird') {
          const wirds = await getUserWirds();
          nextItems = wirds.map(normalizeUserWirdItem);
        } else if (feature.endpoint) {
          const paginated = isPaginatedFeature(feature);
          const page = await getFeatureItemPage(
            feature,
            paginated ? { page: 0, size: EXPLORE_PAGE_SIZE } : undefined,
          );
          nextItems = page.items;
          setPagination({
            page: 0,
            hasMore: paginated && page.meta.hasMore,
            loadingMore: false,
          });
        }
        setItems(nextItems);
      } catch (err) {
        setError(err?.message ?? 'Fitur ini belum bisa dimuat.');
      } finally {
        setLoading(false);
      }
    },
    [session?.token],
  );

  const loadMoreFeature = useCallback(async () => {
    if (
      loadingMoreRef.current ||
      !activeFeature ||
      !isPaginatedFeature(activeFeature) ||
      loading ||
      pagination.loadingMore ||
      !pagination.hasMore
    ) {
      return;
    }

    const nextPage = pagination.page + 1;
    loadingMoreRef.current = true;
    setPagination((current) => ({ ...current, loadingMore: true }));
    setError('');

    try {
      const page =
        activeFeature.type === 'feed'
          ? await getFeedPostPage({ page: nextPage, size: EXPLORE_PAGE_SIZE })
          : await getFeatureItemPage(activeFeature, { page: nextPage, size: EXPLORE_PAGE_SIZE });
      const nextItems = page.items;
      const merged = mergeUniqueItems(items, nextItems);
      const addedCount = merged.length - items.length;
      setItems(merged);
      setPagination({
        page: nextPage,
        hasMore: page.meta.hasMore && addedCount > 0,
        loadingMore: false,
      });
    } catch (err) {
      setError(err?.message ?? 'Data lanjutan belum bisa dimuat.');
      setPagination((current) => ({ ...current, loadingMore: false }));
    } finally {
      loadingMoreRef.current = false;
    }
  }, [activeFeature, items, loading, pagination.hasMore, pagination.loadingMore, pagination.page]);

  const loadZakatHistory = useCallback(async () => {
    try {
      const localItems = await readCalculatorHistory('zakat');
      const remoteItems = session?.token ? await getKalkulasiZakat() : [];
      setZakatHistory(mergeCalculatorHistory(remoteItems, localItems));
    } catch { /* silent */ }
  }, [session?.token]);

  const loadBookmarks = useCallback(async () => {
    if (!session?.token) {
      setBookmarks({});
      return;
    }

    try {
      const items = await getBookmarks();
      setBookmarks(
        items.reduce((acc, item) => {
          acc[refKey(item.ref_type, item.ref_id)] = item;
          return acc;
        }, {}),
      );
    } catch {
      setBookmarks({});
    }
  }, [session?.token]);

  const toggleBookmark = async (item) => {
    if (!activeFeature || !session?.token) {
      setError('Buka Profil untuk masuk dan menyimpan bookmark.');
      showInfo('Buka Profil untuk masuk dan menyimpan bookmark.');
      return;
    }

    const ref = getItemRef(activeFeature, item);
    const key = refKey(ref.refType, ref.refId);
    setSavingBookmark(key);
    setError('');

    try {
      const existing = bookmarks[key];
      if (existing?.id) {
        await deleteBookmark(existing.id);
        setBookmarks((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
        showSuccess('Bookmark dihapus.');
      } else {
        const created = await addBookmark(ref);
        setBookmarks((current) => ({ ...current, [key]: created?.data ?? created }));
        showSuccess('Item disimpan ke bookmark.');
      }
    } catch (err) {
      const nextMessage = err?.message ?? 'Bookmark belum bisa diperbarui.';
      setError(nextMessage);
      showError(nextMessage);
    } finally {
      setSavingBookmark('');
    }
  };

  const handleLikeFeedItem = async (item) => {
    if (!session?.token) {
      setError('Buka Profil untuk masuk dan menyukai post komunitas.');
      showInfo('Buka Profil untuk masuk dan menyukai post komunitas.');
      return;
    }

    setLikingFeedId(item.id);
    setError('');

    try {
      const updated = await likeFeedPost(item.raw?.id ?? item.id);
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      if (selectedItem?.id === item.id) {
        setSelectedItem(updated);
      }
      showSuccess('Post komunitas diperbarui.');
    } catch (err) {
      const nextMessage = err?.message ?? 'Post belum bisa disukai.';
      setError(nextMessage);
      showError(nextMessage);
    } finally {
      setLikingFeedId('');
    }
  };

  const handleHideFeedItem = async (item) => {
    if (!session?.token) {
      showInfo('Buka Profil untuk masuk.');
      return;
    }

    setError('');
    try {
      await hideFeedPost(item.raw?.id ?? item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      showSuccess('Post disembunyikan.');
    } catch (err) {
      const nextMessage = err?.message ?? 'Post belum bisa disembunyikan.';
      setError(nextMessage);
      showError(nextMessage);
    }
  };

  const handleReportFeedItem = async (item) => {
    if (!session?.token) {
      showInfo('Buka Profil untuk masuk.');
      return;
    }

    setError('');
    try {
      await reportFeedPost(item.raw?.id ?? item.id);
      showSuccess('Post dilaporkan ke moderator.');
    } catch (err) {
      const nextMessage = err?.message ?? 'Post belum bisa dilaporkan.';
      setError(nextMessage);
      showError(nextMessage);
    }
  };

  const loadFeedComments = useCallback(async (item) => {
    const ref = getItemRef({ type: 'feed' }, item);
    if (!ref.refType || !ref.refId) return;

    setCommentLoading(true);
    try {
      setFeedComments(await getCommentsByRef(ref));
    } catch {
      setFeedComments([]);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  const submitFeedComment = async () => {
    const content = commentDraft.trim();
    if (!selectedItem || !content) return;
    if (!session?.token) {
      setError('Buka Profil untuk masuk dan menulis komentar.');
      showInfo('Buka Profil untuk masuk dan menulis komentar.');
      return;
    }

    const ref = getItemRef({ type: 'feed' }, selectedItem);
    setCommentSaving(true);
    setError('');

    try {
      const created = await createComment({ content, refId: ref.refId, refType: ref.refType });
      setFeedComments((current) => [...current, created]);
      setCommentDraft('');
      showSuccess('Komentar terkirim.');
    } catch (err) {
      const nextMessage = err?.message ?? 'Komentar belum bisa dikirim.';
      setError(nextMessage);
      showError(nextMessage);
    } finally {
      setCommentSaving(false);
    }
  };

  const resetUserWirdForm = () => {
    setEditingUserWirdId('');
    setUserWirdForm(emptyUserWirdForm);
  };

  const fillUserWirdForm = (item) => {
    const raw = item?.raw ?? {};
    setEditingUserWirdId(raw.id ?? item.id);
    setUserWirdForm({
      arabic: raw.arabic ?? '',
      count: `${raw.count ?? 1}`,
      note: raw.note ?? '',
      occasion: raw.occasion ?? '',
      source: raw.source ?? '',
      title: raw.title ?? item.title ?? '',
      translation: raw.translation ?? '',
      transliteration: raw.transliteration ?? '',
    });
  };

  const submitUserWird = async () => {
    const title = userWirdForm.title.trim();
    if (!title) {
      setError('Judul wirid wajib diisi.');
      showInfo('Judul wirid wajib diisi.');
      return;
    }
    if (!session?.token) {
      setError('Buka Profil untuk masuk dan menyimpan wirid.');
      showInfo('Buka Profil untuk masuk dan menyimpan wirid.');
      return;
    }

    const payload = {
      arabic: userWirdForm.arabic.trim(),
      count: Number(digitsOnly(userWirdForm.count)) || 1,
      note: userWirdForm.note.trim(),
      occasion: userWirdForm.occasion.trim(),
      source: userWirdForm.source.trim(),
      title,
      translation: userWirdForm.translation.trim(),
      transliteration: userWirdForm.transliteration.trim(),
    };

    setSavingUserWird(true);
    setError('');

    try {
      if (editingUserWirdId) {
        const updated = await updateUserWird(editingUserWirdId, payload);
        const normalized = normalizeUserWirdItem(updated?.data ?? updated);
        setItems((current) => current.map((item) => (item.id === normalized.id ? normalized : item)));
        showSuccess('Wirid diperbarui.');
      } else {
        const created = await createUserWird(payload);
        setItems((current) => [normalizeUserWirdItem(created?.data ?? created), ...current]);
        showSuccess('Wirid disimpan.');
      }
      resetUserWirdForm();
    } catch (err) {
      const nextMessage = err?.message ?? 'Wirid belum bisa disimpan.';
      setError(nextMessage);
      showError(nextMessage);
    } finally {
      setSavingUserWird(false);
    }
  };

  const removeUserWird = async (item) => {
    const id = item?.raw?.id ?? item?.id;
    if (!id) return;
    if (!session?.token) {
      setError('Buka Profil untuk masuk dan menghapus wirid.');
      showInfo('Buka Profil untuk masuk dan menghapus wirid.');
      return;
    }

    setError('');
    try {
      await deleteUserWird(id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingUserWirdId === id) resetUserWirdForm();
      showSuccess('Wirid dihapus.');
    } catch (err) {
      const nextMessage = err?.message ?? 'Wirid belum bisa dihapus.';
      setError(nextMessage);
      showError(nextMessage);
    }
  };

  const openSource = useCallback(
    async (item) => {
      const raw = item?.raw ?? {};
      const sourceUrl = raw.source_url || raw.url || raw.link;
      if (sourceUrl) {
        try {
          await Linking.openURL(sourceUrl);
        } catch (err) {
          setError(err?.message ?? 'Sumber asli belum bisa dibuka.');
        }
        return;
      }

      const refType = raw.ref_type;
      const refId = Number(raw.ref_id);
      if (!onOpenTab || !refType || !Number.isFinite(refId)) return;
      if (refType === 'hadith') {
        onOpenTab('hadith', { hadithId: refId });
        return;
      }
      if (refType === 'ayah') {
        try {
          const ayah = await getAyahById(refId);
          onOpenTab('quran', { surahNumber: ayah?.surahNumber ?? 1 });
        } catch (err) {
          setError(err?.message ?? 'Sumber asli belum bisa dibuka.');
        }
      }
    },
    [onOpenTab],
  );

  const runDictionarySearch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await searchDictionary(dictionaryQuery));
    } catch (err) {
      setError(err?.message ?? 'Pencarian kamus belum berhasil.');
    } finally {
      setLoading(false);
    }
  }, [dictionaryQuery]);

  const loadSurahContent = async (surahNumber) => {
    if (!activeFeature?.contentType || !surahNumber) return;

    setSelectedSurahNumber(surahNumber);
    setSelectedItem(null);
    setActiveNoteRef('');
    setTafsirMode('all');
    setError('');
    setLoading(true);
    setPagination({ page: 0, hasMore: false, loadingMore: false });

    try {
      const endpoint =
        activeFeature.contentType === 'tafsir'
          ? `/api/v1/tafsir/surah/${surahNumber}`
          : `/api/v1/asbabun-nuzul/surah/${surahNumber}`;
      const page = await getFeatureItemPage(
        { ...activeFeature, endpoint, type: 'list' },
        { page: 0, size: EXPLORE_PAGE_SIZE },
      );
      const nextItems = page.items;
      setItems(nextItems);
      setPagination({
        page: 0,
        hasMore: page.meta.hasMore,
        loadingMore: false,
      });
    } catch (err) {
      setItems([]);
      setError(err?.message ?? 'Konten surah belum bisa dimuat.');
    } finally {
      setLoading(false);
    }
  };

  const togglePrayer = useCallback(
    async (prayerKey) => {
      const nowDone = !sholatLog[prayerKey];
      if (nowDone) hapticMedium();
      setSholatLog((current) => ({ ...current, [prayerKey]: nowDone }));
      try {
      await savePrayerLog({
        date: new Date().toISOString().split('T')[0],
        prayer: prayerKey,
        status: nowDone ? 'munfarid' : 'missed',
      });
      showSuccess(`${prayerKey} ${nowDone ? 'ditandai selesai' : 'ditandai belum selesai'}.`);
    } catch {
      setSholatLog((current) => ({ ...current, [prayerKey]: !nowDone }));
      showError('Log sholat belum bisa disimpan.');
    }
  },
    [sholatLog, showError, showSuccess],
  );

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    if (activeFeature?.type === 'zakat' && zakatTab === 6) loadZakatHistory();
  }, [activeFeature?.type, loadZakatHistory, zakatTab]);

  useEffect(() => {
    if (!isActive) return;
    refreshDiscoveryState();
  }, [isActive, refreshDiscoveryState]);

  useEffect(() => {
    const featureKey = deepLinkTarget?.params?.featureKey;
    if (!featureKey || handledDeepLinkId.current === deepLinkTarget?.id) return;

    const feature = findFeatureByKey(featureKey);
    if (!feature) return;

    handledDeepLinkId.current = deepLinkTarget.id;
    loadFeature(feature, {
      focusSearch: Boolean(deepLinkTarget?.params?.focusSearch),
      returnTo: deepLinkTarget?.params?.returnTo ?? null,
    });
  }, [deepLinkTarget?.id, loadFeature]);

  useEffect(() => {
    return () => {
      if (zakatTimerRef.current) clearTimeout(zakatTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeFeature?.type !== 'kamus' || !focusDictionaryInput) return;

    const timer = setTimeout(() => {
      dictionaryInputRef.current?.focus?.();
      setFocusDictionaryInput(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [activeFeature?.type, focusDictionaryInput]);

  useEffect(() => {
    if (activeFeature?.type !== 'feed' || !selectedItem) {
      setFeedComments([]);
      setCommentDraft('');
      return;
    }

    loadFeedComments(selectedItem);
  }, [activeFeature?.type, loadFeedComments, selectedItem]);

  useEffect(() => {
    if (activeFeature?.key !== 'library' || !session?.token) {
      setLibraryProgressMap({});
      return;
    }

    let active = true;
    getLibraryProgressList()
      .then((items) => {
        if (!active) return;
        const nextMap = {};
        items.forEach((item) => {
          const bookId = item?.library_book_id ?? item?.book?.id ?? item?.Book?.id;
          if (bookId) nextMap[String(bookId)] = item;
        });
        setLibraryProgressMap(nextMap);
      })
      .catch(() => {
        if (active) setLibraryProgressMap({});
      });

    return () => {
      active = false;
    };
  }, [activeFeature?.key, session?.token]);

  useEffect(() => {
    const bookId = selectedItem?.raw?.id ?? selectedItem?.id;
    if (activeFeature?.key !== 'library' || !selectedItem || !session?.token || !bookId) {
      setLibraryProgress(null);
      setLibraryProgressDraft({ currentPage: '', note: '', status: 'reading' });
      setLibraryProgressMessage('');
      return;
    }

    let active = true;
    getLibraryProgress(bookId)
      .then((payload) => {
        const item = payload?.data ?? payload;
        if (!active || !item) return;
        setLibraryProgress(item);
        setLibraryProgressDraft({
          currentPage: item.current_page ? String(item.current_page) : '',
          note: item.note ?? '',
          status: item.status ?? 'reading',
        });
      })
      .catch(() => {
        if (active) setLibraryProgress(null);
      });

    return () => {
      active = false;
    };
  }, [activeFeature?.key, selectedItem, session?.token]);

  useEffect(() => {
    if (!isActive) return;
    if (selectedItem) {
      navigation?.setBack(() => { setSelectedItem(null); return true; });
    } else if (activeFeature) {
      navigation?.setBack(() => {
        clearFeature();
        return true;
      });
    } else {
      navigation?.clearBack?.();
    }
  }, [isActive, selectedItem, activeFeature, navigation, featureReturnRoute]);

  const scoreQuiz = () => {
    if (!items.length) return 0;
    return items.reduce((total, item) => {
      const correct = item.raw?.correct_answer ?? item.raw?.answer_key ?? item.raw?.answer;
      const selected = answers[item.id];
      if (!correct || !selected) return total;
      const normalizedCorrect = `${correct}`.trim().toLowerCase();
      const selectedKey = `${selected.key ?? ''}`.trim().toLowerCase();
      const selectedLabel = `${selected.label ?? ''}`.trim().toLowerCase();
      return total + (selectedKey === normalizedCorrect || selectedLabel === normalizedCorrect ? 1 : 0);
    }, 0);
  };

  const openItemDetail = (item) => {
    setItemActionSheet({ visible: false, item: null });
    setSelectedItem(item);
    setActiveNoteRef('');
  };

  const renderCurrencyInput = ({ label, value, onChangeText, placeholder }) => (
    <View style={styles.currencyField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.currencyInputShell}>
        <Text style={styles.currencyPrefix}>Rp</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={(nextValue) => onChangeText(digitsOnly(nextValue))}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          style={styles.currencyInput}
          value={formatNumericInput(value)}
        />
      </View>
    </View>
  );

  const renderUserWirdField = ({ field, label, multiline = false, placeholder }) => (
    <View style={styles.wirdField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={(value) => setUserWirdForm((current) => ({ ...current, [field]: value }))}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.textArea, field === 'arabic' && styles.arabicInput]}
        value={userWirdForm[field]}
      />
    </View>
  );

  const getQuizChoices = (item) => {
    const raw = item?.raw ?? {};
    let options = [];

    if (Array.isArray(raw.options)) {
      options = raw.options;
    } else if (typeof raw.options === 'string') {
      try {
        const parsed = JSON.parse(raw.options);
        if (Array.isArray(parsed)) options = parsed;
      } catch {
        options = [];
      }
    }

    if (!options.length) {
      options = [raw.option_a, raw.option_b, raw.option_c, raw.option_d].filter(Boolean);
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
      activeFeature?.key === 'library' && bookId ? libraryProgressMap[String(bookId)] : null;

    if (activeFeature?.type === 'surah-content') {
      return (
        <ContentCard
          key={`${item.id}-${index}`}
          meta={item.meta || activeFeature?.title}
          onPress={() => openItemDetail(item)}
          onMenuPress={() => setItemActionSheet({ visible: true, item })}
          style={styles.tafsirCard}
          title={item.title}
          titleStyle={styles.itemTitle}
        >
          {item.arabic ? <Text numberOfLines={3} style={styles.tafsirArabic}>{item.arabic}</Text> : null}
          {item.body ? (
            <View style={styles.tafsirTranslationBox}>
              <Text numberOfLines={3} style={styles.tafsirTranslation}>{item.body}</Text>
            </View>
          ) : null}
          {item.tafsir ? (
            <View style={styles.tafsirPanel}>
              <Text style={styles.tafsirSource}>{TAFSIR_SOURCE_LABELS.kemenag}</Text>
              <Text numberOfLines={4} style={styles.tafsirText}>{item.tafsir}</Text>
            </View>
          ) : null}
          <Text style={styles.cardReadMore}>Ketuk untuk membaca lengkap</Text>
        </ContentCard>
      );
    }

    if (activeFeature?.type === 'user-wird') {
      return (
        <Card key={`${item.id}-${index}`} style={styles.itemCard}>
          <View style={styles.itemTitleBlock}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {item.meta ? <Text style={styles.itemMeta}>{item.meta}</Text> : null}
          </View>
          {item.arabic ? <Text style={styles.arabic}>{item.arabic}</Text> : null}
          {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          <View style={styles.itemActions}>
            <ActionPill Icon={Pencil} label="Edit" onPress={() => fillUserWirdForm(item)} />
            <ActionPill Icon={Trash2} label="Hapus" onPress={() => removeUserWird(item)} />
          </View>
        </Card>
      );
    }

    if (activeFeature?.type === 'feed') {
      const ref = getItemRef({ type: 'feed' }, item);
      const isLiking = likingFeedId === item.id;

      return (
        <Card key={`${item.id}-${index}`} style={styles.itemCard}>
          <View style={styles.feedHeader}>
            <View style={styles.feedAvatar}>
              <Text style={styles.feedAvatarText}>{item.title?.[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
            <View style={styles.feedTitleBlock}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.meta}</Text>
            </View>
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <View style={styles.feedRefPanel}>
            <Text style={styles.feedRefLabel}>{ref.refType === 'ayah' ? 'Ayat Quran' : 'Hadis'}</Text>
            <Text style={styles.feedRefText}>{ref.refType} #{ref.refId}</Text>
          </View>
          <View style={styles.itemActions}>
            <ActionPill
              Icon={Heart}
              label={isLiking ? 'Menyukai...' : 'Suka'}
              disabled={isLiking}
              onPress={() => handleLikeFeedItem(item)}
            />
            <ActionPill
              Icon={MessageCircle}
              label="Komentar"
              onPress={() => {
                setSelectedItem(item);
                setActiveNoteRef('');
              }}
            />
            <ActionPill
              Icon={ExternalLink}
              label="Sumber"
              onPress={() => openSource(item)}
            />
            {session?.token ? (
              <>
                <ActionPill
                  Icon={EyeOff}
                  label="Sembunyikan"
                  onPress={() => handleHideFeedItem(item)}
                />
                <ActionPill
                  Icon={Flag}
                  label="Laporkan"
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
        onPress={activeFeature?.type === 'quiz' ? undefined : () => openItemDetail(item)}
        onMenuPress={() => setItemActionSheet({ visible: true, item })}
        style={styles.itemCard}
        title={item.title}
        titleStyle={styles.itemTitle}
      >
        {item.arabic ? <Text numberOfLines={3} style={styles.arabic}>{item.arabic}</Text> : null}
        {item.body ? <Text numberOfLines={4} style={styles.body}>{item.body}</Text> : null}
        {libraryProgressEntry ? (
          <View style={styles.libraryProgressBadgeRow}>
            <Text style={styles.libraryProgressBadgeText}>
              {getLibraryProgressLabel(libraryProgressEntry.status)}
            </Text>
            {libraryProgressEntry.current_page ? (
              <Text style={styles.libraryProgressPageText}>Hal. {libraryProgressEntry.current_page}</Text>
            ) : null}
          </View>
        ) : null}
        {activeFeature?.type === 'quiz' ? (
          <View style={styles.answerRow}>
            {getQuizChoices(item).map((option) => (
              <Pressable
                android_ripple={{ color: 'rgba(91, 110, 91, 0.14)', borderless: false }}
                key={`${item.id}-${option.key}`}
                onPress={() => setAnswers((current) => ({ ...current, [item.id]: option }))}
                style={[styles.answerButton, answers[item.id]?.key === option.key && styles.answerButtonActive]}
              >
                <Text style={[styles.answerText, answers[item.id]?.key === option.key && styles.answerTextActive]}>
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
        onClose={() => setItemActionSheet({ visible: false, item: null })}
        subtitle={item.meta || item.title}
        title="Aksi Cepat"
        visible={visible}
      >
        {activeFeature?.type !== 'bookmarks' ? (
          <ActionSheetRow
            Icon={BookOpen}
            onPress={() => openItemDetail(item)}
            subtitle="Baca dengan ruang yang lebih luas"
            title="Buka Detail"
          />
        ) : null}

        {activeFeature?.type === 'bookmarks' || activeFeature?.type === 'notes' ? (
          <ActionSheetRow
            Icon={ExternalLink}
            onPress={() => {
              setItemActionSheet({ visible: false, item: null });
              openSource(item);
            }}
            subtitle="Buka sumber asli konten ini"
            title="Buka Sumber"
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
          subtitle={isBookmarked ? 'Hapus dari koleksi' : 'Simpan ke koleksi pribadi'}
          title={isBookmarked ? 'Hapus Bookmark' : 'Bookmark'}
        />
      </AppActionSheet>
    );
  };

  const closeDetailView = () => {
    setSelectedItem(null);
    setActiveNoteRef('');
    setFeedComments([]);
    setCommentDraft('');
  };

  const renderFeedCommentsPanel = () => {
    if (activeFeature?.type !== 'feed' || !selectedItem) return null;

    return (
      <View style={styles.commentsPanel}>
        <View style={styles.commentsHeader}>
          <Text style={styles.detailTitle}>Komentar</Text>
          {commentLoading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
        </View>
        {!commentLoading && !feedComments.length ? (
          <Text style={styles.empty}>Belum ada komentar untuk rujukan ini.</Text>
        ) : null}
        {feedComments.map((comment) => (
          <View key={comment.id} style={styles.commentRow}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>{comment.author?.[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
            <View style={styles.commentCopy}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentText}>{comment.content}</Text>
            </View>
          </View>
        ))}
        <View style={styles.commentForm}>
          <TextInput
            multiline
            onChangeText={setCommentDraft}
            placeholder={session?.token ? 'Tulis komentar...' : 'Masuk untuk menulis komentar'}
            placeholderTextColor={colors.muted}
            style={styles.commentInput}
            value={commentDraft}
          />
          <Pressable
            accessibilityLabel="Kirim komentar"
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
            disabled={!commentDraft.trim() || commentSaving}
            onPress={submitFeedComment}
            style={[styles.commentSubmit, (!commentDraft.trim() || commentSaving) && styles.commentSubmitDisabled]}
          >
            <Text style={styles.commentSubmitText}>{commentSaving ? 'Mengirim...' : 'Kirim'}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const isTafsirDetail = activeFeature?.type === 'surah-content';
  const hasBothTafsir = isTafsirDetail && selectedItem?.tafsir && selectedItem?.secondaryTafsir;

  const submitLibraryProgress = async () => {
    const bookId = selectedItem?.raw?.id ?? selectedItem?.id;
    if (!bookId || !session?.token) {
      showInfo('Buka Profil untuk masuk dan menyimpan progress belajar.');
      return;
    }

    setLibraryProgressSaving(true);
    setLibraryProgressMessage('');
    try {
      const saved = await saveLibraryProgress({
        bookId,
        currentPage: libraryProgressDraft.currentPage,
        note: libraryProgressDraft.note,
        status: libraryProgressDraft.status,
      });
      const item = saved?.data ?? saved;
      setLibraryProgress(item);
      setLibraryProgressMap((current) => ({ ...current, [String(bookId)]: item }));
      setLibraryProgressMessage('Progress belajar disimpan.');
      showSuccess('Progress belajar disimpan.');
    } catch (err) {
      const nextMessage = err?.message ?? 'Progress belum bisa disimpan.';
      setLibraryProgressMessage(nextMessage);
      showError(nextMessage);
    } finally {
      setLibraryProgressSaving(false);
    }
  };

  const renderLibraryProgressFilters = () => {
    if (activeFeature?.key !== 'library' || !session?.token) return null;
    const trackedCount = Object.keys(libraryProgressMap).length;
    if (!trackedCount) return null;

    return (
      <Card style={styles.libraryFilterPanel}>
        <CardTitle meta={`${trackedCount} buku terlacak`}>Filter Progress</CardTitle>
        <View style={styles.libraryStatusRow}>
          <ActionPill
            active={!libraryProgressFilter}
            label="Semua"
            onPress={() => setLibraryProgressFilter('')}
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
    const isLibraryDetail = activeFeature?.key === 'library';

    const renderTafsirPanel = (tafsirText, sourceLabel, isSecondary) => {
      if (!tafsirText) return null;
      return (
        <View style={[styles.detailTafsirPanel, isSecondary && styles.tafsirPanelSecondary]}>
          <Text style={[styles.tafsirSource, isSecondary && styles.tafsirSourceSecondary]}>
            {sourceLabel}
          </Text>
          <Text style={styles.detailBody}>{tafsirText}</Text>
        </View>
      );
    };

    const renderTafsirContent = () => {
      if (!isTafsirDetail) return null;
      if (tafsirMode === 'kemenag') return renderTafsirPanel(selectedItem.tafsir, TAFSIR_SOURCE_LABELS.kemenag, false);
      if (tafsirMode === 'mishbah') return renderTafsirPanel(selectedItem.secondaryTafsir, TAFSIR_SOURCE_LABELS.secondary, true);
      if (tafsirMode === 'side-by-side' && hasBothTafsir) {
        return (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: radius.md, padding: spacing.md }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.ink, marginBottom: spacing.sm }}>Kemenag</Text>
              <Text style={styles.detailBody}>{selectedItem.tafsir}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#f0f9ff', borderRadius: radius.md, padding: spacing.md }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.ink, marginBottom: spacing.sm }}>Al-Mishbah</Text>
              <Text style={styles.detailBody}>{selectedItem.secondaryTafsir}</Text>
            </View>
          </View>
        );
      }
      return (
        <>
          {renderTafsirPanel(selectedItem.tafsir, TAFSIR_SOURCE_LABELS.kemenag, false)}
          {renderTafsirPanel(selectedItem.secondaryTafsir, TAFSIR_SOURCE_LABELS.secondary, true)}
        </>
      );
    };

    const renderLibraryProgressPanel = () => {
      if (!isLibraryDetail) return null;
      const totalPages = selectedItem?.raw?.pages ?? 0;
      return (
        <View style={styles.libraryProgressPanel}>
          <CardTitle meta={session?.token ? libraryProgress?.status ?? 'reading' : 'Masuk akun'}>
            Progress Belajar
          </CardTitle>
          {!session?.token ? (
            <Text style={styles.detailLine}>Masuk dari tab Profil untuk menyimpan status dan halaman terakhir.</Text>
          ) : (
            <>
              <View style={styles.libraryStatusRow}>
                {LIBRARY_PROGRESS_STATUSES.map((status) => (
                  <ActionPill
                    key={status.key}
                    active={libraryProgressDraft.status === status.key}
                    label={status.label}
                    onPress={() => setLibraryProgressDraft((current) => ({ ...current, status: status.key }))}
                  />
                ))}
              </View>
              <Text style={styles.inputLabel}>Halaman terakhir{totalPages ? ` dari ${totalPages}` : ''}</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => setLibraryProgressDraft((current) => ({ ...current, currentPage: value }))}
                placeholder="0"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={libraryProgressDraft.currentPage}
              />
              <Text style={styles.inputLabel}>Catatan ringkas</Text>
              <TextInput
                multiline
                onChangeText={(value) => setLibraryProgressDraft((current) => ({ ...current, note: value }))}
                placeholder="Misalnya: sampai bab ikhlas..."
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.textArea]}
                value={libraryProgressDraft.note}
              />
              <Pressable
                accessibilityLabel="Simpan progress belajar"
                accessibilityRole="button"
                disabled={libraryProgressSaving}
                onPress={submitLibraryProgress}
                style={[styles.primaryButton, styles.loginButton, libraryProgressSaving && styles.disabledButton]}
              >
                <Text style={styles.primaryButtonText}>{libraryProgressSaving ? 'Menyimpan...' : 'Simpan progress'}</Text>
              </Pressable>
              {libraryProgressMessage ? <Text style={styles.detailLine}>{libraryProgressMessage}</Text> : null}
            </>
          )}
        </View>
      );
    };

    const renderLibrarySourcePanel = () => {
      if (!isLibraryDetail) return null;
      const raw = selectedItem?.raw ?? {};
      const hasLicenseStatus = raw.license_status && raw.license_status !== 'unverified';
      const fileSize = Number(raw.file_size_bytes ?? 0);
      const fileInfo = raw.file_name
        ? `${raw.file_name}${fileSize > 0 ? ` · ${Math.round(fileSize / 1024)} KB` : ''}`
        : '';
      if (!hasLicenseStatus && !raw.is_source_verified && !raw.source_note && !fileInfo) return null;

      return (
        <View style={styles.librarySourcePanel}>
          <CardTitle meta={raw.source_type ?? raw.format ?? 'resource'}>Sumber Resource</CardTitle>
          <View style={styles.libraryStatusRow}>
            {hasLicenseStatus ? (
              <View style={styles.libraryProgressBadgeRow}>
                <Text style={styles.libraryProgressBadgeText}>Lisensi: {raw.license_status}</Text>
              </View>
            ) : null}
            {raw.is_source_verified ? (
              <View style={styles.libraryProgressBadgeRow}>
                <Text style={styles.libraryProgressBadgeText}>Sumber terverifikasi</Text>
              </View>
            ) : null}
          </View>
          {fileInfo ? <Text style={styles.detailLine}>{fileInfo}</Text> : null}
          {raw.source_note ? <Text style={styles.detailLine}>{raw.source_note}</Text> : null}
        </View>
      );
    };

    return (
      <Screen
        actions={(
          <IconActionButton
            Icon={ArrowLeft}
            label="Kembali"
            onPress={closeDetailView}
          />
        )}
        contentStyle={isWebAppLayout ? styles.webAppSurface : null}
        subtitle={selectedItem.meta || activeFeature?.title}
        title={selectedItem.title}
      >
        <View testID={isWebAppLayout ? 'explore-web-app-detail' : 'explore-classic-detail'} />
        <Card style={styles.detailCard}>
          {selectedItem.arabic ? (
            <Text style={[isTafsirDetail ? styles.detailArabic : styles.arabic]}>{selectedItem.arabic}</Text>
          ) : null}
          {selectedItem.body ? (
            <View style={isTafsirDetail ? styles.detailTranslationBox : null}>
              <Text style={isTafsirDetail ? styles.detailTranslation : styles.detailBody}>{selectedItem.body}</Text>
            </View>
          ) : null}
          {hasBothTafsir ? (
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs }}>
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
            <Text style={styles.detailLine}>{selectedItem.meta || activeFeature?.title}</Text>
            {ref.refId ? <Text style={styles.detailLine}>Rujukan: {ref.refType} #{ref.refId}</Text> : null}
          </View>
        </Card>

        {renderFeedCommentsPanel()}
        {renderLibrarySourcePanel()}
        {renderLibraryProgressPanel()}

        <View style={styles.detailActions}>
          {activeFeature?.type !== 'feed' ? (
            <ActionPill
              Icon={StickyNote}
              active={activeNoteRef === noteKey}
              label="Catatan"
              onPress={() => setActiveNoteRef(activeNoteRef === noteKey ? '' : noteKey)}
            />
          ) : null}
          <ActionPill
            Icon={ExternalLink}
            label="Buka sumber"
            onPress={() => openSource(selectedItem)}
          />
        </View>
        {activeNoteRef === noteKey ? (
          <NotesPanel refType={ref.refType} refId={ref.refId} />
        ) : null}
      </Screen>
    );
  };

  const renderFeatureContent = () => {
    if (!activeFeature) {
      return null;
    }

    if (activeFeature.type === 'user-wird') {
      if (!session?.token) {
        return (
          <Card>
            <CardTitle meta="Akun">Wirid Saya</CardTitle>
            <Text style={styles.body}>Masuk melalui Profil untuk membuat dan mengelola wirid pribadi.</Text>
            <Pressable
              accessibilityLabel="Buka Profil untuk masuk"
              accessibilityRole="button"
              android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
              onPress={() => onOpenTab?.('profile')}
              style={[styles.primaryButton, styles.loginButton]}
            >
              <Text style={styles.primaryButtonText}>Buka Profil</Text>
            </Pressable>
          </Card>
        );
      }

      return (
        <Card>
          <CardTitle meta={editingUserWirdId ? 'Edit' : 'Baru'}>{activeFeature.title}</CardTitle>
          <Text style={styles.body}>Buat koleksi wirid pribadi dengan target jumlah bacaan.</Text>
          {renderUserWirdField({ field: 'title', label: 'Judul', placeholder: 'Contoh: Wirid pagi pribadi' })}
          {renderUserWirdField({ field: 'arabic', label: 'Teks Arab', multiline: true, placeholder: 'اكتب الذكر هنا' })}
          {renderUserWirdField({ field: 'transliteration', label: 'Transliterasi', multiline: true, placeholder: 'Tuliskan transliterasi jika ada' })}
          {renderUserWirdField({ field: 'translation', label: 'Terjemahan', multiline: true, placeholder: 'Makna bacaan' })}
          <View style={styles.wirdGrid}>
            <View style={styles.wirdGridItem}>
              <Text style={styles.inputLabel}>Jumlah</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => setUserWirdForm((current) => ({ ...current, count: digitsOnly(value) }))}
                placeholder="1"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={userWirdForm.count}
              />
            </View>
            <View style={styles.wirdGridItem}>
              {renderUserWirdField({ field: 'occasion', label: 'Waktu', placeholder: 'Pagi, petang...' })}
            </View>
          </View>
          {renderUserWirdField({ field: 'source', label: 'Sumber', placeholder: 'Kitab/ustadz/rujukan' })}
          {renderUserWirdField({ field: 'note', label: 'Catatan', multiline: true, placeholder: 'Catatan pribadi' })}
          <View style={styles.formActions}>
            <Pressable
              accessibilityLabel={editingUserWirdId ? 'Simpan perubahan wirid' : 'Tambah wirid'}
              accessibilityRole="button"
              android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
              disabled={savingUserWird}
              onPress={submitUserWird}
              style={[styles.primaryButton, styles.formPrimaryButton, savingUserWird && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>{savingUserWird ? 'Menyimpan...' : editingUserWirdId ? 'Simpan' : 'Tambah'}</Text>
            </Pressable>
            {editingUserWirdId ? (
              <Pressable
                accessibilityLabel="Batal edit wirid"
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                onPress={resetUserWirdForm}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Batal</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      );
    }

    if (activeFeature.type === 'kamus') {
      return (
        <Card>
          <CardTitle meta="Cari Kata">{activeFeature.title}</CardTitle>
          <View style={styles.searchRow}>
            <TextInput
              ref={dictionaryInputRef}
              autoFocus={focusDictionaryInput}
              autoCapitalize="none"
              onChangeText={setDictionaryQuery}
              onSubmitEditing={runDictionarySearch}
              placeholder="Cari kata Arab atau Indonesia"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={dictionaryQuery}
            />
            <Pressable onPress={runDictionarySearch} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Cari</Text>
            </Pressable>
          </View>
        </Card>
      );
    }

    if (activeFeature.type === 'tasbih') {
      const progress = Math.min(100, Math.round((tasbih.count / tasbih.target) * 100));
      return (
        <Card>
          <CardTitle meta={`${progress}%`}>{activeFeature.title}</CardTitle>
          <Pressable
            onPress={() => {
                hapticTap();
                setTasbih((current) => ({ ...current, count: current.count + 1 }));
            }}
            style={styles.counter}
          >
            <Text style={styles.counterNumber}>{tasbih.count}</Text>
            <Text style={styles.counterLabel}>Target {tasbih.target}</Text>
          </Pressable>
          <View style={styles.answerRow}>
            {[33, 99, 100].map((target) => (
              <Pressable
                key={target}
                onPress={() => setTasbih({ count: 0, target })}
                style={[styles.answerButton, tasbih.target === target && styles.answerButtonActive]}
              >
                <Text style={[styles.answerText, tasbih.target === target && styles.answerTextActive]}>{target}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setTasbih((current) => ({ ...current, count: 0 }))} style={styles.answerButton}>
              <Text style={styles.answerText}>Reset</Text>
            </Pressable>
          </View>
        </Card>
      );
    }

    if (activeFeature.type === 'asmaul-wirid') {
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
          setAsmaulWiridCount(nextCounts, nameId, nextCount).catch(e => console.error(e));
          return nextCounts;
        });
      };

      const resetName = () => {
        if (!currentName?.id) return;
        const nameId = currentName.id;
        setAsmaulCounts((prev) => {
          const nextCounts = { ...prev };
          delete nextCounts[nameId];
          setAsmaulWiridCount(nextCounts, nameId, 0).catch(e => console.error(e));
          return nextCounts;
        });
      };

      return (
        <Card>
          <CardTitle meta={asmaulLoading ? 'Memuat...' : `${asmaulIndex + 1}/${asmaulNames.length}`}>
            {activeFeature.title}
          </CardTitle>
          {asmaulLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : currentName ? (
            <>
              <View style={styles.asmaulHeader}>
                <Pressable
                  disabled={asmaulIndex === 0}
                  onPress={() => setAsmaulIndex((i) => Math.max(0, i - 1))}
                  style={[styles.heirButton, asmaulIndex === 0 && styles.heirButtonDisabled]}
                >
                  <Text style={styles.heirButtonText}>←</Text>
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.asmaulArabic}>{currentName.arabic ?? currentName.name ?? ''}</Text>
                  <Text style={styles.asmaulLatin}>{currentName.latin ?? currentName.transliteration ?? ''}</Text>
                  <Text style={styles.asmaulArti}>{currentName.translation ?? currentName.meaning ?? ''}</Text>
                </View>
                <Pressable
                  disabled={asmaulIndex >= asmaulNames.length - 1}
                  onPress={() => setAsmaulIndex((i) => Math.min(asmaulNames.length - 1, i + 1))}
                  style={[styles.heirButton, asmaulIndex >= asmaulNames.length - 1 && styles.heirButtonDisabled]}
                >
                  <Text style={styles.heirButtonText}>→</Text>
                </Pressable>
              </View>
              <View style={{ height: 6, backgroundColor: colors.faint, borderRadius: 3, marginVertical: spacing.md }}>
                <View style={{ height: 6, backgroundColor: isComplete ? colors.primary : colors.muted, borderRadius: 3, width: `${Math.min(100, (currentCount / 33) * 100)}%` }} />
              </View>
              <Pressable onPress={incrementName} style={styles.counter} testID="asmaul-wirid-counter">
                <Text style={styles.counterNumber}>{currentCount}</Text>
                <Text style={styles.counterLabel}>{isComplete ? 'Sempurna!' : 'Tap untuk hitung'}</Text>
              </Pressable>
              <View style={styles.answerRow}>
                <Pressable onPress={resetName} style={styles.answerButton}>
                  <Text style={styles.answerText}>Reset</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.body}>Daftar Asmaul Husna belum tersedia.</Text>
          )}
        </Card>
      );
    }

    if (activeFeature.type === 'asmaul-flashcard') {
      const currentName = asmaulNames[asmaulIndex];
      const canGoPrev = asmaulIndex > 0;
      const canGoNext = asmaulIndex < asmaulNames.length - 1;
      const moveFlashcard = (delta) => {
        hapticTap();
        setAsmaulFlashcardRevealed(false);
        setAsmaulIndex((current) => Math.max(0, Math.min(asmaulNames.length - 1, current + delta)));
      };

      return (
        <Card>
          <CardTitle meta={asmaulLoading ? 'Memuat...' : `${asmaulIndex + 1}/${asmaulNames.length}`}>
            {activeFeature.title}
          </CardTitle>
          {asmaulLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : currentName ? (
            <>
              <Pressable
                accessibilityLabel="Balik kartu Asmaul Husna"
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                onPress={() => {
                  hapticTap();
                  setAsmaulFlashcardRevealed((value) => !value);
                }}
                style={styles.flashcard}
              >
                <Text style={styles.flashcardNumber}>Nama {currentName.number}</Text>
                <Text style={styles.flashcardArabic}>{currentName.arabic}</Text>
                <Text style={styles.flashcardLatin}>{currentName.transliteration}</Text>
                {asmaulFlashcardRevealed ? (
                  <Text style={styles.flashcardMeaning}>{currentName.meaning}</Text>
                ) : (
                  <Text style={styles.flashcardHint}>Tap untuk melihat arti</Text>
                )}
              </Pressable>
              <View style={styles.answerRow}>
                <Pressable
                  disabled={!canGoPrev}
                  onPress={() => moveFlashcard(-1)}
                  style={[styles.answerButton, !canGoPrev && styles.disabledButton]}
                >
                  <Text style={styles.answerText}>Sebelumnya</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAsmaulFlashcardRevealed((value) => !value)}
                  style={styles.answerButton}
                >
                  <Text style={styles.answerText}>{asmaulFlashcardRevealed ? 'Sembunyikan arti' : 'Lihat arti'}</Text>
                </Pressable>
                <Pressable
                  disabled={!canGoNext}
                  onPress={() => moveFlashcard(1)}
                  style={[styles.answerButton, !canGoNext && styles.disabledButton]}
                >
                  <Text style={styles.answerText}>Berikutnya</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.body}>Daftar Asmaul Husna belum tersedia.</Text>
          )}
        </Card>
      );
    }

    if (activeFeature.type === 'surah-content') {
      return (
        <Card>
          <CardTitle meta={selectedSurahNumber ? `Surah ${selectedSurahNumber}` : 'Pilih Surah'}>
            {activeFeature.title}
          </CardTitle>
          <Text style={styles.body}>Pilih surah untuk membaca penjelasan ayat.</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setSurahSearch}
            placeholder="Cari nama atau nomor surah"
            placeholderTextColor={colors.muted}
            style={styles.surahSearchInput}
            value={surahSearch}
          />
          <View style={styles.surahSelector}>
            {visibleSurahOptions.map((surah) => (
              <Pressable
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                key={`${activeFeature.key}-${surah.number}`}
                onPress={() => loadSurahContent(surah.number)}
                style={[styles.surahChip, selectedSurahNumber === surah.number && styles.surahChipActive]}
              >
                <Text style={[styles.surahChipText, selectedSurahNumber === surah.number && styles.surahChipTextActive]}>
                  {surah.number}. {surah.name}
                </Text>
              </Pressable>
            ))}
          </View>
          {!surahSearch && surahs.length > visibleSurahOptions.length ? (
            <Text style={styles.selectorHint}>Tampilkan surah lain lewat pencarian.</Text>
          ) : null}
          {surahSearch && !visibleSurahOptions.length ? (
            <Text style={styles.empty}>Surah tidak ditemukan.</Text>
          ) : null}
          {!loading && surahs.length === 0 ? <Text style={styles.empty}>Daftar surah belum tersedia.</Text> : null}
        </Card>
      );
    }

    if (activeFeature.type === 'zakat') {
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
      const zakatTrade = tradeNet >= nisab && zakatTradeHaul ? tradeNet * 0.025 : 0;
      const harvest = parseNumericInput(zakatHarvestWeight) || 0;
      const riceKgPrice = parseNumericInput(zakatRiceKgPrice) || 16000;
      const harvestRate = zakatHarvestIrrigated ? 0.05 : 0.1;
      const zakatAgriculture = harvest >= NISAB_HARVEST_KG ? harvest * harvestRate * riceKgPrice : 0;
      const goldG = parseNumericInput(zakatGoldGrams) || 0;
      const silverPriceNum = parseNumericInput(zakatSilverPrice) || 14000;
      const silverG = parseNumericInput(zakatSilverGrams) || 0;
      const goldValue = goldG * goldPrice;
      const silverValue = silverG * silverPriceNum;
      const goldNisabValue = NISAB_GRAM * goldPrice;
      const silverNisabValue = NISAB_SILVER_GRAM * silverPriceNum;
      const zakatGold =
        zakatGoldHaul && (goldValue >= goldNisabValue || silverValue >= silverNisabValue)
          ? (goldValue + silverValue) * 0.025
          : 0;

      const ZAKAT_TABS = [
        { key: 'maal', label: 'Maal' },
        { key: 'fitrah', label: 'Fitrah' },
        { key: 'profesi', label: 'Profesi' },
        { key: 'dagang', label: 'Dagang' },
        { key: 'tani', label: 'Tani' },
        { key: 'emas', label: 'Emas' },
        { key: 'riwayat', label: 'Riwayat' },
      ];

      const handleZakatSave = async (jenis, namaJenis, jumlahZakat, nilaiHarta = 0, nisabVal = 0) => {
        if (jumlahZakat <= 0) return;
        setZakatSaving(true);
        setZakatSavedMsg('');
        const payload = {
          jenis,
          nama_jenis: namaJenis,
          jumlah_zakat: jumlahZakat,
          nilai_harta: nilaiHarta,
          nisab: nisabVal,
          rate: 2.5,
          haul: true,
          catatan: '',
        };
        try {
          if (session?.token) {
            await saveKalkulasiZakat(payload);
            setZakatSavedMsg('Tersimpan ke akun.');
            loadZakatHistory();
          } else {
            const created = await saveCalculatorHistory('zakat', payload);
            setZakatHistory((current) => mergeCalculatorHistory(current, [created]));
            setZakatSavedMsg('Tersimpan di perangkat.');
          }
        } catch {
          setZakatSavedMsg('Gagal menyimpan');
        }
        setZakatSaving(false);
        if (zakatTimerRef.current) clearTimeout(zakatTimerRef.current);
        zakatTimerRef.current = setTimeout(() => setZakatSavedMsg(''), 2500);
      };

      const handleDeleteZakat = async (item) => {
        try {
          if (item?.is_local || `${item?.id ?? ''}`.startsWith('local-zakat-')) {
            await deleteCalculatorHistory('zakat', item.id);
          } else {
            await deleteKalkulasiZakat(item.id);
          }
          loadZakatHistory();
        } catch {
          showError('Riwayat zakat gagal dihapus.');
        }
      };

      const renderZakatResult = (amount, label, color = 'primary') => (
        <View style={[styles.resultPanel, { borderColor: color === 'amber' ? '#F59E0B' : color === 'blue' ? '#3B82F6' : colors.primary, borderWidth: 1, marginTop: spacing.md }]}>
          <Text style={[styles.resultLabel, { textAlign: 'center', fontSize: 13 }]}>{label}</Text>
          <Text style={[styles.resultValueStrong, { textAlign: 'center', fontSize: 24 }]}>{formatCurrency(amount)}</Text>
        </View>
      );

      return (
        <Card>
          <CardTitle>{activeFeature.title}</CardTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
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
              <Text style={styles.body}>Zakat 2,5% dari harta bersih yang sudah mencapai nisab dan haul.</Text>
              <Text style={[styles.body, { fontSize: 12, color: colors.muted, marginBottom: spacing.sm }]}>
                Nisab: {formatCurrency(nisab)} (85g emas × {formatCurrency(goldPrice)}/g)
              </Text>
              {renderCurrencyInput({ label: 'Total harta', value: zakat.assets, placeholder: '0', onChangeText: (v) => setZakat((c) => ({ ...c, assets: v })) })}
              {renderCurrencyInput({ label: 'Utang jatuh tempo', value: zakat.debts, placeholder: '0', onChangeText: (v) => setZakat((c) => ({ ...c, debts: v })) })}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Sudah haul (1 tahun)</Text>
                <Switch
                  value={zakatHaul}
                  onValueChange={setZakatHaul}
                  trackColor={{ false: colors.faint, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              <View style={styles.resultPanel}>
                <View style={styles.resultRow}><Text style={styles.resultLabel}>Harta bersih</Text><Text style={styles.resultValue}>{formatCurrency(net)}</Text></View>
                <View style={styles.resultRow}><Text style={styles.resultLabel}>Nisab</Text><Text style={styles.resultValue}>{formatCurrency(nisab)}</Text></View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}><Text style={styles.resultLabelStrong}>Zakat maal 2,5%</Text><Text style={styles.resultValueStrong}>{formatCurrency(zakatMaal)}</Text></View>
              </View>
              {session?.token && zakatMaal > 0 && (
                <Pressable disabled={zakatSaving} onPress={() => handleZakatSave('maal', 'Zakat Maal', zakatMaal, net, nisab)} style={[styles.answerButton, { marginTop: spacing.sm, alignSelf: 'stretch' }]}>
                  <Text style={styles.answerText}>{zakatSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* Zakat Fitrah */}
          {zakatTab === 1 && (
            <>
              <Text style={styles.body}>Zakat fitrah 1 sha' (±2,5 kg) makanan pokok per jiwa.</Text>
              {renderCurrencyInput({ label: 'Harga beras/kg', value: zakatRicePrice, placeholder: '16000', onChangeText: setZakatRicePrice })}
              <View style={styles.heirGrid}>
                <Pressable onPress={() => setZakatFamilyCount(Math.max(1, zakatFamilyCount - 1))} style={styles.heirButton}><Text style={styles.heirButtonText}>−</Text></Pressable>
                <View style={{ alignItems: 'center', paddingHorizontal: spacing.md }}>
                  <Text style={[styles.resultValueStrong, { fontSize: 22 }]}>{zakatFamilyCount}</Text>
                  <Text style={[styles.resultLabel, { fontSize: 11 }]}>Jiwa</Text>
                </View>
                <Pressable onPress={() => setZakatFamilyCount(zakatFamilyCount + 1)} style={styles.heirButton}><Text style={styles.heirButtonText}>+</Text></Pressable>
              </View>
              {renderZakatResult(zakatFitrah, 'Zakat Fitrah', 'amber')}
              {session?.token && zakatFitrah > 0 && (
                <Pressable disabled={zakatSaving} onPress={() => handleZakatSave('fitrah', 'Zakat Fitrah', zakatFitrah)} style={[styles.answerButton, { marginTop: spacing.sm, alignSelf: 'stretch' }]}>
                  <Text style={styles.answerText}>{zakatSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* Zakat Profesi */}
          {zakatTab === 2 && (
            <>
              <Text style={styles.body}>Zakat profesi 2,5% dari penghasilan bulanan jika mencapai nisab per bulan.</Text>
              <Text style={[styles.body, { fontSize: 12, color: colors.muted, marginBottom: spacing.sm }]}>
                Nisab bulanan: {formatCurrency(nisabMonthly)}
              </Text>
              {renderCurrencyInput({ label: 'Penghasilan per bulan', value: zakatMonthlyIncome, placeholder: '0', onChangeText: setZakatMonthlyIncome })}
              {income > 0 && income < nisabMonthly && (
                <Text style={[styles.statusNote, { color: '#D97706', marginBottom: spacing.sm }]}>Penghasilan belum mencapai nisab bulanan.</Text>
              )}
              {renderZakatResult(zakatProfesi, 'Zakat Profesi', 'blue')}
              {session?.token && zakatProfesi > 0 && (
                <Pressable disabled={zakatSaving} onPress={() => handleZakatSave('profesi', 'Zakat Profesi', zakatProfesi, income, nisabMonthly)} style={[styles.answerButton, { marginTop: spacing.sm, alignSelf: 'stretch' }]}>
                  <Text style={styles.answerText}>{zakatSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* Zakat Perdagangan */}
          {zakatTab === 3 && (
            <>
              <Text style={styles.body}>Zakat perdagangan 2,5% dari (modal + stok + piutang − utang) jika ≥ nisab.</Text>
              {renderCurrencyInput({ label: 'Modal usaha (Rp)', value: zakatTradeCapital, placeholder: '0', onChangeText: setZakatTradeCapital })}
              {renderCurrencyInput({ label: 'Nilai stok barang (Rp)', value: zakatTradeStock, placeholder: '0', onChangeText: setZakatTradeStock })}
              {renderCurrencyInput({ label: 'Piutang bisa ditagih (Rp)', value: zakatTradeReceivable, placeholder: '0', onChangeText: setZakatTradeReceivable })}
              {renderCurrencyInput({ label: 'Utang usaha (Rp)', value: zakatTradeDebt, placeholder: '0', onChangeText: setZakatTradeDebt })}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Sudah haul (1 tahun)</Text>
                <Switch
                  value={zakatTradeHaul}
                  onValueChange={setZakatTradeHaul}
                  trackColor={{ false: colors.faint, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              <View style={styles.resultPanel}>
                <View style={styles.resultRow}><Text style={styles.resultLabel}>Aset bersih</Text><Text style={styles.resultValue}>{formatCurrency(tradeNet)}</Text></View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}><Text style={styles.resultLabelStrong}>Zakat dagang 2,5%</Text><Text style={styles.resultValueStrong}>{formatCurrency(zakatTrade)}</Text></View>
              </View>
              {session?.token && zakatTrade > 0 && (
                <Pressable disabled={zakatSaving} onPress={() => handleZakatSave('perdagangan', 'Zakat Perdagangan', zakatTrade, tradeNet, nisab)} style={[styles.answerButton, { marginTop: spacing.sm, alignSelf: 'stretch' }]}>
                  <Text style={styles.answerText}>{zakatSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* Zakat Pertanian */}
          {zakatTab === 4 && (
            <>
              <Text style={styles.body}>Nisab 5 wasq ({NISAB_HARVEST_KG} kg). Irigasi: 5%, tadah hujan: 10%. Wajib tiap panen.</Text>
              {renderCurrencyInput({ label: 'Hasil panen (kg)', value: zakatHarvestWeight, placeholder: '0', onChangeText: setZakatHarvestWeight })}
              {renderCurrencyInput({ label: 'Harga gabah/kg (Rp)', value: zakatRiceKgPrice, placeholder: '16000', onChangeText: setZakatRiceKgPrice })}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Pakai irigasi (tarif 5%)</Text>
                <Switch
                  value={zakatHarvestIrrigated}
                  onValueChange={setZakatHarvestIrrigated}
                  trackColor={{ false: colors.faint, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              {harvest > 0 && harvest < NISAB_HARVEST_KG && (
                <Text style={[styles.statusNote, { color: '#D97706', marginBottom: spacing.sm }]}>Panen kurang dari nisab ({NISAB_HARVEST_KG} kg), belum wajib zakat.</Text>
              )}
              {renderZakatResult(zakatAgriculture, 'Zakat Pertanian', 'primary')}
              {session?.token && zakatAgriculture > 0 && (
                <Pressable disabled={zakatSaving} onPress={() => handleZakatSave('pertanian', 'Zakat Pertanian', zakatAgriculture)} style={[styles.answerButton, { marginTop: spacing.sm, alignSelf: 'stretch' }]}>
                  <Text style={styles.answerText}>{zakatSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* Zakat Emas & Perak */}
          {zakatTab === 5 && (
            <>
              <Text style={styles.body}>Nisab emas 85g, perak 595g. Wajib setelah 1 haul. Tarif 2,5%.</Text>
              {renderCurrencyInput({ label: 'Harga emas/gram (Rp)', value: zakatGoldPrice, placeholder: '1050000', onChangeText: setZakatGoldPrice })}
              {renderCurrencyInput({ label: 'Berat emas (gram)', value: zakatGoldGrams, placeholder: '0', onChangeText: setZakatGoldGrams })}
              {renderCurrencyInput({ label: 'Harga perak/gram (Rp)', value: zakatSilverPrice, placeholder: '14000', onChangeText: setZakatSilverPrice })}
              {renderCurrencyInput({ label: 'Berat perak (gram)', value: zakatSilverGrams, placeholder: '0', onChangeText: setZakatSilverGrams })}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Sudah haul (1 tahun)</Text>
                <Switch
                  value={zakatGoldHaul}
                  onValueChange={setZakatGoldHaul}
                  trackColor={{ false: colors.faint, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              {renderZakatResult(zakatGold, 'Zakat Emas & Perak', 'amber')}
              {session?.token && zakatGold > 0 && (
                <Pressable disabled={zakatSaving} onPress={() => handleZakatSave('emas_perak', 'Zakat Emas & Perak', zakatGold, goldValue + silverValue, goldNisabValue)} style={[styles.answerButton, { marginTop: spacing.sm, alignSelf: 'stretch' }]}>
                  <Text style={styles.answerText}>{zakatSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* Riwayat */}
          {zakatTab === 6 && (
            <>
              <Text style={styles.body}>Riwayat kalkulasi zakat tersimpan.</Text>
              {!session?.token ? (
                <Text style={[styles.statusNote, { marginTop: spacing.sm }]}>
                  Masuk untuk sinkronisasi akun. Riwayat lokal tetap tersimpan di perangkat ini.
                </Text>
              ) : null}
              {zakatHistory.length === 0 ? (
                <Text style={[styles.statusNote, { marginTop: spacing.sm }]}>Belum ada riwayat.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 300 }}>
                  {zakatHistory.map((item) => (
                    <View key={item.id} style={[styles.faraidhHistoryCard, { marginTop: spacing.xs }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: colors.ink }}>{item.nama_jenis}</Text>
                        <Text style={[styles.resultValue, { fontSize: 13 }]}>{formatCurrency(item.jumlah_zakat)}</Text>
                        <Text style={{ fontSize: 11, color: item.is_local ? colors.muted : colors.primary }}>
                          {item.is_local ? 'Perangkat ini' : 'Akun tersinkron'}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.muted }}>{new Date(item.created_at ?? item.createdAt).toLocaleDateString('id-ID')}</Text>
                      </View>
                      <Pressable onPress={() => handleDeleteZakat(item)} style={[styles.heirButton, { borderColor: colors.danger }]}>
                        <Text style={[styles.heirButtonText, { color: colors.danger }]}>Hapus</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          {zakatSavedMsg ? (
            <Text style={{ textAlign: 'center', fontSize: 13, color: colors.primary, marginTop: spacing.sm }}>{zakatSavedMsg}</Text>
          ) : null}
        </Card>
      );
    }

    if (activeFeature.type === 'faraidh') {
      const HEIR_FIELDS = [
        { key: 'suami', max: 1, label: 'Suami' },
        { key: 'istri', max: 4, label: 'Istri' },
        { key: 'anakL', max: 20, label: 'Anak Lk' },
        { key: 'anakP', max: 20, label: 'Anak Pr' },
        { key: 'ayah', max: 1, label: 'Ayah' },
        { key: 'ibu', max: 1, label: 'Ibu' },
        { key: 'kakek', max: 1, label: 'Kakek' },
        { key: 'nenek', max: 4, label: 'Nenek' },
        { key: 'saudaraL', max: 20, label: 'Sdr Lk' },
        { key: 'saudaraP', max: 20, label: 'Sdr Pr' },
      ];

      const setHeir = (key, delta) => {
        const field = HEIR_FIELDS.find((f) => f.key === key);
        setFaraidh((current) => {
          const currentVal = current.heirs[key] ?? 0;
          const next = Math.min(field?.max ?? 20, Math.max(0, currentVal + delta));
          return { ...current, heirs: { ...current.heirs, [key]: next } };
        });
      };

      const wealth = parseNumericInput(faraidh.estate);
      const debts = parseNumericInput(faraidh.debts);
      const requestedBequest = parseNumericInput(faraidh.bequest);
      const maxBequest = Math.floor(wealth / 3);
      const bequest = Math.min(requestedBequest, maxBequest);
      const distributable = Math.max(0, wealth - debts - bequest);
      const bequestCapped = wealth > 0 && requestedBequest > maxBequest;
      const calculation = distributable > 0 ? calculateFaraidh(faraidh.heirs, distributable) : null;

      const handleSaveFaraidh = async () => {
        setSavingFaraidh(true);
        const payload = {
          wealth,
          debt: debts,
          funeral: 0,
          will: bequest,
          heirs_json: JSON.stringify(faraidh.heirs),
          result_summary: calculation
            ? calculation.rows.map((r) => {
                const label = HEIR_LABELS[r.key]?.idn ?? r.key;
                return `${label}: ${Math.round(r.share * 100)}%`;
              }).join(', ')
            : '',
          catatan: faraidhCatatan,
        };
        try {
          if (session?.token) {
            await saveFaraidh(payload);
            showSuccess('Kalkulasi faraidh tersimpan ke akun.');
          } else {
            await saveCalculatorHistory('faraidh', payload);
            showSuccess('Kalkulasi faraidh tersimpan di perangkat.');
          }
          setFaraidhCatatan('');
        } catch (err) {
          showError(err?.message ?? 'Gagal menyimpan.');
        } finally {
          setSavingFaraidh(false);
        }
      };

      const handleLoadFaraidhHistory = async () => {
        try {
          const localItems = await readCalculatorHistory('faraidh');
          const remoteItems = session?.token ? await getFaraidhHistory() : [];
          setFaraidhHistory(mergeCalculatorHistory(remoteItems, localItems));
          setShowFaraidhHistory(true);
        } catch {
          showError('Riwayat belum bisa dimuat.');
        }
      };

      const handleDeleteFaraidh = async (id) => {
        try {
          if (`${id ?? ''}`.startsWith('local-faraidh-')) {
            await deleteCalculatorHistory('faraidh', id);
          } else {
            await deleteFaraidh(id);
          }
          setFaraidhHistory((current) => current.filter((item) => item.id !== id));
          showSuccess('Item riwayat dihapus.');
        } catch {
          showError('Gagal menghapus.');
        }
      };

      if (showFaraidhHistory) {
        return (
          <Card>
            <CardTitle
              meta={`${faraidhHistory.length} item`}
              actions={(
                <ActionPill
                  label="Kembali"
                  onPress={() => setShowFaraidhHistory(false)}
                />
              )}
            >
              Riwayat Faraidh
            </CardTitle>
            {!session?.token ? (
              <Text style={styles.body}>Masuk untuk sinkronisasi akun. Riwayat lokal tetap tersimpan di perangkat ini.</Text>
            ) : null}
            {faraidhHistory.length === 0 ? (
              <Text style={styles.body}>Belum ada kalkulasi yang tersimpan.</Text>
            ) : (
              faraidhHistory.map((item) => (
                <View key={item.id} style={styles.trackerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.faraidhHistoryAmount}>{formatCurrency(item.wealth ?? 0)}</Text>
                    {item.result_summary ? (
                      <Text style={styles.detailLine}>{item.result_summary}</Text>
                    ) : null}
                    <Text style={styles.detailLine}>{item.is_local ? 'Perangkat ini' : 'Akun tersinkron'}</Text>
                    <Text style={styles.detailLine}>
                      {new Date(item.created_at ?? item.createdAt ?? '').toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                  <Pressable
                    android_ripple={{ color: 'rgba(220, 80, 80, 0.12)', borderless: false }}
                    onPress={() => handleDeleteFaraidh(item.id)}
                    style={styles.secondaryButton}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Hapus</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Card>
        );
      }

      return (
        <Card>
          <CardTitle meta="Perencana Waris">{activeFeature.title}</CardTitle>
          <Text style={styles.body}>Hitung pembagian waris sesuai syariah. Pilih ahli waris, atur jumlahnya, dan lihat hasil bagi.</Text>

          {renderCurrencyInput({
            label: 'Harta warisan',
            value: faraidh.estate,
            placeholder: '0',
            onChangeText: (v) => setFaraidh((current) => ({ ...current, estate: v })),
          })}
          {renderCurrencyInput({
            label: 'Utang dan biaya',
            value: faraidh.debts,
            placeholder: '0',
            onChangeText: (v) => setFaraidh((current) => ({ ...current, debts: v })),
          })}
          {renderCurrencyInput({
            label: 'Wasiat',
            value: faraidh.bequest,
            placeholder: '0',
            onChangeText: (v) => setFaraidh((current) => ({ ...current, bequest: v })),
          })}

          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Ahli Waris</Text>
          <View style={styles.heirGrid}>
            {HEIR_FIELDS.map((field) => {
              const count = faraidh.heirs[field.key] ?? 0;
              return (
                <View key={field.key} style={styles.heirItem}>
                  <Text style={styles.heirLabel}>{field.label}</Text>
                  <Text style={styles.heirCount}>{count}</Text>
                  <View style={styles.heirActions}>
                    <Pressable
                      onPress={() => setHeir(field.key, -1)}
                      disabled={count === 0}
                      style={[styles.heirButton, count === 0 && styles.heirButtonDisabled]}
                    >
                      <Text style={styles.heirButtonText}>−</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setHeir(field.key, 1)}
                      disabled={count >= field.max}
                      style={[styles.heirButton, count >= field.max && styles.heirButtonDisabled]}
                    >
                      <Text style={styles.heirButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          {calculation ? (
            <View style={styles.resultPanel}>
              {calculation.applied.musytarakah ? (
                <Text style={[styles.statusNote, styles.statusNoteActive]}>
                  Musytarakah: suami + ibu + saudara berbagi 1/3 bersama.
                </Text>
              ) : null}
              {calculation.applied.aul ? (
                <Text style={[styles.statusNote, styles.statusNoteWarning]}>
                  Aul: penyebut dinaikkan agar total bagian tidak melebihi 1.
                </Text>
              ) : null}
              {calculation.applied.radd ? (
                <Text style={[styles.statusNote, styles.statusNoteActive]}>
                  Radd: sisa harta dikembalikan ke ahli waris (selain suami/istri).
                </Text>
              ) : null}
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Harta awal</Text>
                <Text style={styles.resultValue}>{formatCurrency(wealth)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Wasiat</Text>
                <Text style={styles.resultValue}>{formatCurrency(bequest)}</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabelStrong}>Harta dibagikan</Text>
                <Text style={styles.resultValueStrong}>{formatCurrency(distributable)}</Text>
              </View>
              {bequestCapped ? (
                <Text style={[styles.statusNote, styles.statusNoteWarning]}>
                  Wasiat melebihi batas, dihitung maksimal {formatCurrency(maxBequest)}.
                </Text>
              ) : null}
              <View style={styles.resultDivider} />
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Hasil Bagi</Text>
              {calculation.rows.map((row) => {
                const label = HEIR_LABELS[row.key]?.idn ?? row.key;
                return (
                  <View key={row.key} style={styles.resultRow}>
                    <Text style={styles.resultLabel}>
                      {label}{row.count > 1 ? ` (${row.count} org)` : ''}
                    </Text>
                    <Text style={styles.resultValue}>
                      {row.fraction ? `${row.fraction.num}/${row.fraction.den}` : 'Sisa'}
                      {' '}
                      {Math.round(row.share * 100)}%
                    </Text>
                    <Text style={[styles.resultValue, { minWidth: 90 }]}>{formatCurrency(row.amount)}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.statusNote, { marginTop: spacing.md }]}>
              Pilih total harta dan ahli waris untuk melihat hasil pembagian.
            </Text>
          )}

          <View style={[styles.formActions, { marginTop: spacing.md }]}>
            <Pressable
              accessibilityLabel="Simpan kalkulasi faraidh"
              accessibilityRole="button"
              android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
              disabled={savingFaraidh || distributable <= 0}
              onPress={handleSaveFaraidh}
              style={[styles.primaryButton, styles.formPrimaryButton, (savingFaraidh || distributable <= 0) && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>
                {savingFaraidh ? 'Menyimpan...' : 'Simpan'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Riwayat kalkulasi faraidh"
              accessibilityRole="button"
              android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
              onPress={handleLoadFaraidhHistory}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Riwayat</Text>
            </Pressable>
          </View>
        </Card>
      );
    }

    if (activeFeature.type === 'forum') {
      if (forumView === 'ask') {
        return (
          <Card>
            <CardTitle
              actions={(
                <ActionPill label="Kembali" onPress={() => { setForumView('list'); setForumError(''); }} />
              )}
            >
              Ajukan Pertanyaan
            </CardTitle>
            <TextInput
              onChangeText={setForumAskTitle}
              placeholder="Judul pertanyaan (min 10 karakter)"
              placeholderTextColor={colors.muted}
              style={styles.inputField}
              value={forumAskTitle}
            />
            <TextInput
              multiline
              onChangeText={setForumAskBody}
              placeholder="Isi pertanyaan (min 20 karakter)"
              placeholderTextColor={colors.muted}
              style={[styles.inputField, { minHeight: 120 }]}
              textAlignVertical="top"
              value={forumAskBody}
            />
            <TextInput
              autoCapitalize="none"
              onChangeText={setForumAskTags}
              placeholder="Tag (pisahkan dengan koma, opsional)"
              placeholderTextColor={colors.muted}
              style={styles.inputField}
              value={forumAskTags}
            />
            {forumError ? <Text style={[styles.statusNote, { color: colors.danger }]}>{forumError}</Text> : null}
            <Pressable
              android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
              disabled={forumSaving || forumAskTitle.length < 10 || forumAskBody.length < 20}
              onPress={async () => {
                if (!session?.token) { showInfo('Buka Profil untuk masuk dan bertanya.'); return; }
                setForumSaving(true);
                setForumError('');
                try {
                  const result = await createForumQuestion({
                    title: forumAskTitle.trim(),
                    body: forumAskBody.trim(),
                    tags: forumAskTags.trim(),
                  });
                  const slug = result?.slug ?? '';
                  setForumAskTitle('');
                  setForumAskBody('');
                  setForumAskTags('');
                  if (slug) {
                    setForumLoading(true);
                    try {
                      const detail = await getForumQuestion(slug);
                      setForumDetail(detail.question);
                      setForumAnswers(detail.answers);
                      setForumSlug(slug);
                      setForumView('detail');
                    } finally {
                      setForumLoading(false);
                    }
                  } else {
                    setForumView('list');
                  }
                } catch (err) {
                  setForumError(err?.message ?? 'Gagal mengirim pertanyaan.');
                } finally {
                  setForumSaving(false);
                }
              }}
              style={[styles.primaryButton, (forumSaving || forumAskTitle.length < 10 || forumAskBody.length < 20) && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>
                {forumSaving ? 'Mengirim...' : 'Kirim Pertanyaan'}
              </Text>
            </Pressable>
          </Card>
        );
      }

      if (forumView === 'detail') {
        return (
          <Card>
            <CardTitle
              actions={(
                <ActionPill label="Kembali" onPress={() => { setForumView('list'); setForumDetail(null); setForumAnswers([]); }} />
              )}
            >
              {forumDetail?.title ?? 'Detail'}
            </CardTitle>
            {forumLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : !forumDetail ? (
              <Text style={styles.body}>Pertanyaan tidak ditemukan.</Text>
            ) : (
              <>
                <Text style={styles.body}>{forumDetail.body}</Text>
                {forumDetail.tags?.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm }}>
                    {forumDetail.tags.map((tag) => (
                      <View key={tag} style={styles.badge}>
                        <Text style={styles.badgeText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text style={[styles.statusNote, { marginTop: spacing.sm }]}>
                  {forumDetail.user?.name} · {forumDetail.answerCount} jawaban · {forumDetail.voteCount} suara
                </Text>
                <View style={[styles.answerRow, { justifyContent: 'flex-start', marginTop: spacing.sm }]}>
                  {[
                    { label: '▲ Pertanyaan', value: 1 },
                    { label: '▼ Pertanyaan', value: -1 },
                  ].map((action) => (
                    <Pressable
                      key={action.label}
                      android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                      disabled={forumVotingId === `${forumDetail.id}-${action.value}`}
                      onPress={async () => {
                        if (!session?.token) { showInfo('Buka Profil untuk memberi suara.'); return; }
                        setForumVotingId(`${forumDetail.id}-${action.value}`);
                        try {
                          await voteForum({ targetType: 'question', targetId: forumDetail.id, value: action.value });
                          setForumDetail((current) => current ? { ...current, voteCount: current.voteCount + action.value } : current);
                        } catch {
                          showError('Gagal memberi suara.');
                        }
                        setForumVotingId('');
                      }}
                      style={styles.answerButton}
                    >
                      <Text style={styles.answerText}>{action.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {forumAnswers.length === 0 ? (
                  <Text style={[styles.statusNote, { marginTop: spacing.md }]}>Belum ada jawaban.</Text>
                ) : (
                  forumAnswers.map((answer) => (
                    <View key={answer.id} style={[styles.trackerRow, { alignItems: 'flex-start', marginTop: spacing.sm }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.body}>{answer.body}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
                          <Text style={styles.statusNote}>{answer.user?.name}</Text>
                          {answer.isAccepted ? (
                            <Text style={[styles.badgeText, { color: '#16a34a' }]}>Diterima</Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={{ alignItems: 'center', gap: 4, minWidth: 52 }}>
                        {[1, -1].map((value) => (
                          <Pressable
                            key={value}
                            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                            disabled={forumVotingId === `${answer.id}-${value}`}
                            onPress={async () => {
                              if (!session?.token) { showInfo('Buka Profil untuk memberi suara.'); return; }
                              setForumVotingId(`${answer.id}-${value}`);
                              try {
                                await voteForum({ targetType: 'answer', targetId: answer.id, value });
                                setForumAnswers((prev) => prev.map((a) => a.id === answer.id ? { ...a, voteCount: a.voteCount + value } : a));
                              } catch {
                                showError('Gagal memberi suara.');
                              }
                              setForumVotingId('');
                            }}
                            style={styles.answerButton}
                          >
                            <Text style={styles.answerText}>{value > 0 ? '▲' : '▼'}</Text>
                          </Pressable>
                        ))}
                        <Text style={{ color: colors.text, fontSize: 12 }}>{answer.voteCount}</Text>
                        {session?.token && !answer.isAccepted ? (
                          <Pressable
                            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                            disabled={forumVotingId === `accept-${answer.id}`}
                            onPress={async () => {
                              setForumVotingId(`accept-${answer.id}`);
                              try {
                                await acceptForumAnswer(forumDetail.id, answer.id);
                                const updated = await getForumQuestion(forumSlug);
                                setForumDetail(updated.question);
                                setForumAnswers(updated.answers);
                              } catch {
                                showError('Jawaban belum bisa diterima.');
                              }
                              setForumVotingId('');
                            }}
                            style={styles.answerButton}
                          >
                            <Text style={styles.answerText}>Terima</Text>
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
                      placeholder="Tulis jawaban..."
                      placeholderTextColor={colors.muted}
                      style={[styles.inputField, { minHeight: 80, marginTop: spacing.md }]}
                      textAlignVertical="top"
                      value={forumAnswerDraft}
                    />
                    <Pressable
                      android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
                      disabled={forumSaving || forumAnswerDraft.trim().length < 10}
                      onPress={async () => {
                        setForumSaving(true);
                        try {
                          await createForumAnswer(forumDetail.id, { body: forumAnswerDraft.trim() });
                          setForumAnswerDraft('');
                          const updated = await getForumQuestion(forumSlug);
                          setForumDetail(updated.question);
                          setForumAnswers(updated.answers);
                        } catch {
                          showError('Gagal mengirim jawaban.');
                        }
                        setForumSaving(false);
                      }}
                      style={[styles.primaryButton, (forumSaving || forumAnswerDraft.trim().length < 10) && styles.disabledButton]}
                    >
                      <Text style={styles.primaryButtonText}>
                        {forumSaving ? 'Mengirim...' : 'Kirim Jawaban'}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Text style={[styles.statusNote, { marginTop: spacing.md }]}>
                    Buka Profil untuk masuk dan menjawab pertanyaan.
                  </Text>
                )}
              </>
            )}
          </Card>
        );
      }

      return (
        <Card>
          <CardTitle meta={`${forumTotal} pertanyaan`}>{activeFeature.title}</CardTitle>
          <TextInput
            onChangeText={(v) => { setForumSearch(v); }}
            onSubmitEditing={async () => {
              setForumLoading(true);
              setForumError('');
              try {
                const result = await getForumQuestions({ page: 0, size: 10, q: forumSearch.trim() });
                setForumQuestions(result.items);
                setForumTotal(result.total);
                setForumPage(0);
                setForumHasMore(result.hasMore);
              } catch (err) {
                setForumError(err?.message ?? 'Pencarian gagal.');
              }
              setForumLoading(false);
            }}
            placeholder="Cari pertanyaan..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={styles.inputField}
            value={forumSearch}
          />
          {forumError ? <Text style={[styles.statusNote, { color: colors.danger }]}>{forumError}</Text> : null}
          {forumLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : forumQuestions.length === 0 ? (
            <Text style={[styles.statusNote, { marginTop: spacing.md }]}>Belum ada pertanyaan.</Text>
          ) : (
            forumQuestions.map((q) => (
              <Pressable
                key={q.id}
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                onPress={async () => {
                  setForumLoading(true);
                  setForumError('');
                  try {
                    const detail = await getForumQuestion(q.slug);
                    setForumDetail(detail.question);
                    setForumAnswers(detail.answers);
                    setForumSlug(q.slug);
                    setForumView('detail');
                  } catch (err) {
                    setForumError(err?.message ?? 'Detail belum bisa dimuat.');
                  }
                  setForumLoading(false);
                }}
                style={[styles.trackerRow, { alignItems: 'flex-start' }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.inputLabel, { flex: 1, marginBottom: 0 }]} numberOfLines={2}>
                      {q.title}
                    </Text>
                    {q.isAnswered ? <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>Terjawab</Text> : null}
                  </View>
                  <Text style={[styles.statusNote, { marginTop: 2 }]} numberOfLines={2}>{q.body}</Text>
                  {q.tags?.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {q.tags.slice(0, 3).map((tag) => (
                        <View key={tag} style={styles.badge}>
                          <Text style={styles.badgeText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 4 }}>
                    <Text style={[styles.statusNote, { fontSize: 11 }]}>{q.user?.name}</Text>
                    <Text style={[styles.statusNote, { fontSize: 11 }]}>{q.answerCount} jawaban</Text>
                    <Text style={[styles.statusNote, { fontSize: 11 }]}>{q.voteCount} suara</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
          {forumHasMore ? (
            <Pressable
              android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
              onPress={async () => {
                const nextPage = forumPage + 1;
                setForumLoading(true);
                try {
                  const result = await getForumQuestions({ page: nextPage, size: 10, q: forumSearch.trim() });
                  setForumQuestions((prev) => [...prev, ...result.items]);
                  setForumTotal(result.total);
                  setForumPage(nextPage);
                  setForumHasMore(result.hasMore);
                } catch { /* silent */ }
                setForumLoading(false);
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Muat lebih banyak</Text>
            </Pressable>
          ) : null}
          <View style={{ marginTop: spacing.md }}>
            <Pressable
              android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
              onPress={() => { setForumView('ask'); setForumAskTitle(''); setForumAskBody(''); setForumAskTags(''); setForumError(''); }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Ajukan Pertanyaan</Text>
            </Pressable>
          </View>
        </Card>
      );
    }

    if (activeFeature.type === 'sholat-tracker') {
      const doneCount = PRAYER_ITEMS.filter((p) => sholatLog[p.key]).length;
      return (
        <Card>
          <CardTitle meta={`${doneCount}/5 sholat`}>Sholat Tracker</CardTitle>
          <Text style={styles.body}>Catat sholat yang telah kamu kerjakan hari ini.</Text>
          <View style={styles.trackerList}>
            {PRAYER_ITEMS.map((p) => (
              <Pressable
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                key={p.key}
                onPress={() => togglePrayer(p.key)}
                style={styles.trackerRow}
              >
                {sholatLog[p.key] ? (
                  <CheckCircle2 color={colors.primary} size={22} strokeWidth={2.5} />
                ) : (
                  <Circle color={colors.faint} size={22} strokeWidth={2} />
                )}
                <Text style={[styles.trackerLabel, sholatLog[p.key] && styles.trackerLabelDone]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      );
    }

    if (activeFeature.type === 'notifications') {
      return <NotificationCenter />;
    }

    if (activeFeature.type === 'historical-map') {
      return (
        <Card>
          <CardTitle meta="Lokasi bersejarah">Peta Islam Interaktif</CardTitle>
          <HistoricalMapContent />
        </Card>
      );
    }

    if (activeFeature.type === 'tokoh') {
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
    setError('');
    setActiveNoteRef('');
    setLibraryProgressFilter('');
    if (returnRoute?.tab && returnRoute?.view) {
      navigation?.open?.(returnRoute.tab, returnRoute.view, { returnTab: null });
    }
  };

  const shouldLoadMore = Boolean(
    activeFeature &&
    isPaginatedFeature(activeFeature) &&
    items.length &&
    pagination.hasMore,
  );
  const screenTitle = activeFeature?.title ?? 'Belajar';
  const screenSubtitle = activeFeature
    ? ['Belajar', activeFeature.group, activeFeature.subtitle].filter(Boolean).join(' · ')
    : 'Kajian, referensi Islam, dan fitur personal.';
  const visibleItems =
    activeFeature?.key === 'library' && libraryProgressFilter
      ? items.filter((item) => {
          const bookId = item?.raw?.id ?? item?.id;
          const progress = bookId ? libraryProgressMap[String(bookId)] : null;
          return progress?.status === libraryProgressFilter;
        })
      : items;
  const listFooter = (
    <>
      {pagination.loadingMore ? (
        <View style={styles.loadMoreFooter}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadMoreText}>Memuat data berikutnya...</Text>
        </View>
      ) : null}
      {renderItemActionSheet()}
    </>
  );

  if (selectedItem) {
    return renderDetailScreen();
  }

  return (
    <Screen
      contentStyle={isWebAppLayout ? styles.webAppSurface : null}
      title={screenTitle}
      subtitle={screenSubtitle}
      onEndReached={shouldLoadMore ? loadMoreFeature : undefined}
      listData={activeFeature ? visibleItems : undefined}
      listFooter={activeFeature ? listFooter : undefined}
      listKeyExtractor={(item, index) => `${getExploreItemKey(item)}-${index}`}
      renderListItem={({ item, index }) => renderItem(item, index)}
      actions={
        activeFeature ? (
          <IconActionButton
            Icon={ArrowLeft}
            label="Kembali ke Belajar"
            onPress={clearFeature}
          />
        ) : (
          <IconActionButton
            Icon={UserCircle}
            label="Buka Profil"
            onPress={() => onOpenTab?.('profile')}
          />
        )
      }
    >
      <View testID={isWebAppLayout ? 'explore-web-app-surface' : 'explore-classic-surface'} />
      {!activeFeature && (
        <>
          <PaperSearchInput
            onChangeText={setFeatureSearch}
            placeholder="Cari kajian, tafsir, kamus, perawi, quiz..."
            value={featureSearch}
          />
          <FeatureCatalog
            featureSearch={featureSearch}
            onFeaturePress={loadFeature}
            onTogglePinnedFeature={handleTogglePinnedFeature}
            pinnedFeatureKeys={pinnedFeatureKeys}
            recentFeatureKeys={recentFeatureKeys}
          />
        </>
      )}

      {renderFeatureContent()}
      {renderLibraryProgressFilters()}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {activeFeature?.type === 'quiz' && items.length ? (
        <Text style={styles.result}>
          Dijawab {Object.keys(answers).length}/{items.length}, skor {scoreQuiz()}
        </Text>
      ) : null}
      {!loading && activeFeature && !error && !items.length && !LOCAL_TOOL_TYPES.includes(activeFeature.type) && !(activeFeature.type === 'user-wird' && !session?.token) ? (
        <Text style={styles.empty}>
          {activeFeature.type === 'bookmarks'
            ? 'Belum ada bookmark tersimpan. Buka suatu hadis atau ayat lalu simpan.'
            : activeFeature.type === 'notes'
              ? 'Belum ada catatan. Buka detail konten untuk menambahkan catatan.'
              : activeFeature.type === 'feed'
                ? 'Belum ada post komunitas.'
                : activeFeature.type === 'user-wird'
                  ? 'Belum ada wirid pribadi. Tambahkan bacaan pertamamu dari form di atas.'
                  : 'Belum ada data untuk fitur ini.'}
        </Text>
      ) : null}
      {!loading && activeFeature?.key === 'library' && libraryProgressFilter && items.length > 0 && visibleItems.length === 0 ? (
        <Text style={styles.empty}>Belum ada buku dengan status {getLibraryProgressLabel(libraryProgressFilter)}.</Text>
      ) : null}
      {!loading && activeFeature?.type === 'surah-content' && selectedSurahNumber && !error && !items.length ? (
        <Text style={styles.empty}>Tafsir untuk surah ini belum tersedia. Coba pilih surah lain.</Text>
      ) : null}
      {!activeFeature ? renderItemActionSheet() : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backToExplore: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 42,
  },
  backToExploreText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  webAppSurface: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    marginBottom: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  textArea: {
    minHeight: 86,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  arabicInput: {
    ...arabicTypography.input,
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  wirdField: {
    flex: 1,
  },
  wirdGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  wirdGridItem: {
    flex: 1,
  },
  currencyField: {
    marginTop: spacing.md,
  },
  currencyInputShell: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  currencyPrefix: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginRight: spacing.sm,
  },
  currencyInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    paddingVertical: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  formPrimaryButton: {
    flex: 1,
    minHeight: 42,
  },
  loginButton: {
    marginTop: spacing.md,
    minHeight: 42,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.6,
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  tafsirCard: {
    marginBottom: spacing.md,
    paddingTop: spacing.md,
  },
  itemTitleBlock: {
    marginBottom: spacing.sm,
    minWidth: 0,
    paddingRight: 44,
  },
  itemTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  itemMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    marginTop: 3,
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  feedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  feedAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  feedAvatarText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  feedTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  feedRefPanel: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  feedRefLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 2,
  },
  feedRefText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  detailPanel: {
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  detailLine: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  detailActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  detailArabic: {
    ...arabicTypography.large,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  detailBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  detailTranslationBox: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  detailTranslation: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  detailTafsirPanel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  detailMetaPanel: {
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  libraryProgressPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  librarySourcePanel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  libraryFilterPanel: {
    marginBottom: spacing.md,
  },
  libraryStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  libraryProgressBadgeRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  libraryProgressBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  libraryProgressPageText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  commentsPanel: {
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  commentsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  commentAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  commentAvatarText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  commentCopy: {
    flex: 1,
    minWidth: 0,
  },
  commentAuthor: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  commentText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  commentForm: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    minHeight: 70,
    padding: spacing.sm,
    textAlignVertical: 'top',
  },
  commentSubmit: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 38,
  },
  commentSubmitDisabled: {
    opacity: 0.55,
  },
  commentSubmitText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  arabic: {
    ...arabicTypography.body,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  tafsirArabic: {
    ...arabicTypography.body,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  tafsirTranslationBox: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  tafsirTranslation: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  tafsirPanel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  tafsirPanelSecondary: {
    backgroundColor: colors.bg,
  },
  tafsirSource: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  tafsirSourceSecondary: {
    color: colors.ink,
  },
  tafsirText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  cardReadMore: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  answerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  answerButton: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  answerButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  answerText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  answerTextActive: {
    color: '#ffffff',
  },
  surahSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  surahSearchInput: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    marginTop: spacing.md,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  selectorHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  surahChip: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  surahChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  surahChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  surahChipTextActive: {
    color: '#ffffff',
  },
  counter: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    justifyContent: 'center',
    minHeight: 180,
  },
  counterNumber: {
    color: colors.primaryDark,
    fontSize: 64,
    fontWeight: '900',
  },
  counterLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  result: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  resultPanel: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  resultRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  resultLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  resultLabelStrong: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  resultValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  resultValueStrong: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  resultDivider: {
    backgroundColor: colors.faint,
    height: 1,
    marginBottom: spacing.sm,
  },
  statusNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  statusNoteActive: {
    color: colors.primary,
  },
  statusNoteWarning: {
    color: colors.accent,
  },
  trackerList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  trackerRow: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  trackerLabel: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  trackerLabelDone: {
    color: colors.primary,
    fontWeight: '800',
  },
  loader: {
    marginVertical: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  loadMoreFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  actionSheetRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: spacing.md,
  },
  actionSheetRowActive: {
    backgroundColor: colors.primary,
  },
  actionSheetIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  actionSheetCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionSheetTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSheetTitleActive: {
    color: colors.onPrimary,
  },
  actionSheetSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  actionSheetSubtitleActive: {
    color: colors.onPrimary,
    opacity: 0.8,
  },
  heirGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heirItem: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 72,
    padding: spacing.sm,
  },
  heirLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  heirCount: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  heirActions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  heirButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 28,
  },
  heirButtonDisabled: {
    opacity: 0.3,
  },
  heirButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  faraidhHistoryAmount: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  asmaulHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  asmaulArabic: {
    ...arabicTypography.centered,
    color: colors.ink,
    marginBottom: 4,
  },
  asmaulLatin: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  asmaulArti: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  flashcard: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 250,
    padding: spacing.lg,
  },
  flashcardArabic: {
    ...arabicTypography.hero,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  flashcardHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  flashcardLatin: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  flashcardMeaning: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  flashcardNumber: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  toggleLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
  },
  faraidhHistoryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.sm,
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
