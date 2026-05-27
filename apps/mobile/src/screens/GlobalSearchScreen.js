import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Book, BookOpen, Languages, Layers, Search, UserRound } from 'lucide-react-native';
import { getSurahs, searchGlobal } from '../api/client';
import { ContentCard } from '../components/ContentCard';
import { IconActionButton, PaperSearchInput } from '../components/Paper';
import { Screen } from '../components/Screen';
import { allFeatures } from '../data/mobileFeatures';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { readRecentSearches, rememberRecentSearch } from '../storage/recentSearches';
import { colors, radius, shadows, spacing } from '../theme';

const MIN_QUERY_LENGTH = 2;
const PAGE_SIZE = 20;
const PREVIEW_SIZE = 3;
const quickSuggestions = ['shalat', 'sabar', 'zakat', 'tafsir'];
const WEB_APP_SEARCH_DARK = {
  active: '#059669',
  activeText: '#ffffff',
  bg: '#020617',
  chip: '#334155',
  chipText: '#cbd5e1',
  inputText: '#e2e8f0',
  muted: '#94a3b8',
  surface: '#1e293b',
  title: '#f8fafc',
};
const WEB_APP_SEARCH_LIGHT = {
  active: '#059669',
  activeText: '#ffffff',
  bg: '#ffffff',
  chip: '#e2e8f0',
  chipText: '#475569',
  inputText: '#0f172a',
  muted: '#64748b',
  surface: '#ffffff',
  title: '#0f172a',
};
const WEB_APP_SEARCH_ACCENT = '#10b981';

const searchFilters = [
  { key: 'all', label: 'Semua', remoteType: 'all' },
  { key: 'quran', label: 'Quran', remoteType: 'ayah' },
  { key: 'hadith', label: 'Hadis', remoteType: 'hadith' },
  { key: 'doa', label: 'Doa', remoteType: 'doa' },
  { key: 'kajian', label: 'Kajian', remoteType: 'kajian' },
  { key: 'dictionary', label: 'Kamus', remoteType: 'dictionary' },
  { key: 'perawi', label: 'Perawi', remoteType: 'perawi' },
  { key: 'feature', label: 'Fitur', remoteType: 'all' },
];
const searchFilterKeys = new Set(searchFilters.map((item) => item.key));
const remoteSearchFilters = searchFilters.filter((item) => !['all', 'feature'].includes(item.key));
const resultFieldByFilter = {
  dictionary: 'dictionaries',
  doa: 'doas',
  hadith: 'hadiths',
  kajian: 'kajians',
  perawi: 'perawis',
  quran: 'ayahs',
};

const normalizeQuery = (value = '') => value.trim().toLowerCase();
const emptyGlobalResult = { ayahs: [], dictionaries: [], doas: [], hadiths: [], kajians: [], perawis: [], ayahTotal: 0, hadithTotal: 0, dictionaryTotal: 0, doaTotal: 0, kajianTotal: 0, perawiTotal: 0, total: 0 };
const emptyStateByFilter = {
  all: {
    title: 'Belum ada hasil',
    text: 'Coba kata lain, nama surah, nomor hadis, tema doa, atau buka Semua Fitur.',
  },
  dictionary: {
    title: 'Kata belum ditemukan',
    text: 'Coba akar kata Arab, transliterasi, atau istilah yang lebih pendek.',
  },
  doa: {
    title: 'Doa belum ditemukan',
    text: 'Coba cari dengan tema seperti pagi, malam, safar, atau perlindungan.',
  },
  feature: {
    title: 'Fitur belum ditemukan',
    text: 'Coba cari dengan nama fitur seperti kiblat, zakat, dzikir, atau kajian.',
  },
  hadith: {
    title: 'Hadis belum ditemukan',
    text: 'Coba kata kunci tema, nomor hadis, atau nama kitab hadis.',
  },
  kajian: {
    title: 'Kajian belum ditemukan',
    text: 'Coba nama tema, pembicara, atau istilah yang lebih umum.',
  },
  perawi: {
    title: 'Perawi belum ditemukan',
    text: 'Coba nama lengkap, kunyah, atau ejaan latin yang berbeda.',
  },
  quran: {
    title: 'Ayat belum ditemukan',
    text: 'Coba nama surah, nomor ayat, atau kata terjemahan yang lebih umum.',
  },
};

const createEmptyResultsByFilter = () =>
  remoteSearchFilters.reduce((acc, filter) => {
    acc[filter.key] = emptyGlobalResult;
    return acc;
  }, {});

const totalFieldByFilter = {
  dictionary: 'dictionaryTotal',
  doa: 'doaTotal',
  hadith: 'hadithTotal',
  kajian: 'kajianTotal',
  perawi: 'perawiTotal',
  quran: 'ayahTotal',
};

const resultCountForFilter = (result, filterKey) => {
  const totalField = totalFieldByFilter[filterKey];
  if (totalField && result?.[totalField] != null) return result[totalField];
  const field = resultFieldByFilter[filterKey];
  return field ? result?.[field]?.length ?? 0 : 0;
};

const runRemoteFilterSearch = async (filter, query, limit, page = 0) => {
  const result = await searchGlobal(query, { limit, page, type: filter.remoteType });
  return sanitizeRemoteResult(filter.key, result);
};

const sanitizeRemoteResult = (filterKey, result = emptyGlobalResult) => {
  const field = resultFieldByFilter[filterKey];
  const totalField = totalFieldByFilter[filterKey];
  if (!field) return emptyGlobalResult;

  const items = Array.isArray(result?.[field]) ? result[field] : [];
  const rawTotal = Number(result?.[totalField] ?? result?.total ?? items.length);
  const scopedTotal = items.length ? Math.max(rawTotal, items.length) : 0;
  return {
    ...emptyGlobalResult,
    [totalField]: scopedTotal,
    [field]: items,
    total: scopedTotal,
  };
};

const mergeResultsByFilter = (resultsByFilter) => ({
  ...emptyGlobalResult,
  ayahs: resultsByFilter.quran?.ayahs ?? [],
  ayahTotal: resultCountForFilter(resultsByFilter.quran, 'quran'),
  dictionaries: resultsByFilter.dictionary?.dictionaries ?? [],
  dictionaryTotal: resultCountForFilter(resultsByFilter.dictionary, 'dictionary'),
  doas: resultsByFilter.doa?.doas ?? [],
  doaTotal: resultCountForFilter(resultsByFilter.doa, 'doa'),
  hadiths: resultsByFilter.hadith?.hadiths ?? [],
  hadithTotal: resultCountForFilter(resultsByFilter.hadith, 'hadith'),
  kajians: resultsByFilter.kajian?.kajians ?? [],
  kajianTotal: resultCountForFilter(resultsByFilter.kajian, 'kajian'),
  perawis: resultsByFilter.perawi?.perawis ?? [],
  perawiTotal: resultCountForFilter(resultsByFilter.perawi, 'perawi'),
});

const cleanMeta = (value, fallback) => {
  const raw = `${value ?? ''}`.trim();
  if (!raw) return fallback;
  const normalized = raw.toLowerCase();
  if (['backend', 'server', 'storage', 'device', 'perangkat'].includes(normalized)) {
    return fallback;
  }
  return raw;
};

const findFeatureResults = (query) => {
  const normalized = normalizeQuery(query);
  if (normalized.length < MIN_QUERY_LENGTH) return [];

  return allFeatures
    .filter((feature) =>
      [feature.title, feature.subtitle, feature.group, feature.key]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
};

const ResultSection = ({ children, count, title }) => {
  if (!count) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      {children}
    </View>
  );
};

const SeeAllButton = ({ count, filter, onPress }) => (
  <Pressable
    android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
    onPress={() => onPress(filter)}
    style={styles.seeAllButton}
  >
    <Text style={styles.seeAllText}>Lihat semua{count ? ` (${count})` : ''}</Text>
  </Pressable>
);

const ResultRow = ({ Icon, meta, onPress, subtitle, title }) => (
  <ContentCard
    Icon={Icon}
    meta={meta}
    onPress={() => {
      Keyboard.dismiss();
      onPress?.();
    }}
    subtitle={subtitle}
    style={styles.resultRow}
    title={title}
  />
);

const LoadingSearchState = ({ label }) => (
  <View style={styles.loadingCard}>
    <View style={styles.loadingHeader}>
      <ActivityIndicator color={colors.primary} size="small" />
      <Text style={styles.loadingText}>Mencari {label.toLowerCase()}...</Text>
    </View>
    {[0, 1, 2].map((item) => (
      <View key={`search-loading-${item}`} style={styles.loadingSkeleton}>
        <View style={styles.loadingSkeletonIcon} />
        <View style={styles.loadingSkeletonCopy}>
          <View style={styles.loadingSkeletonTitle} />
          <View style={styles.loadingSkeletonLine} />
        </View>
      </View>
    ))}
  </View>
);

export function GlobalSearchScreen({ initialFilter = 'all', initialQuery = '', onBack, onOpenTab }) {
  const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [remoteResultsByFilter, setRemoteResultsByFilter] = useState(createEmptyResultsByFilter);
  const [surahNameByNumber, setSurahNameByNumber] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState('');
  const [pageByFilter, setPageByFilter] = useState({});
  const searchGenRef = useRef(0);
  const loadedFullRef = useRef({});

  const featureResults = useMemo(() => findFeatureResults(query), [query]);
  const selectedFilter = searchFilters.find((item) => item.key === activeFilter) ?? searchFilters[0];
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const mergedRemoteResults = useMemo(() => mergeResultsByFilter(remoteResultsByFilter), [remoteResultsByFilter]);
  const remoteResults =
    activeFilter === 'all'
      ? mergedRemoteResults
      : activeFilter === 'feature'
        ? emptyGlobalResult
        : remoteResultsByFilter[activeFilter] ?? emptyGlobalResult;
  const showAyahs = activeFilter === 'all' || activeFilter === 'quran';
  const showDoas = activeFilter === 'all' || activeFilter === 'doa';
  const showHadiths = activeFilter === 'all' || activeFilter === 'hadith';
  const showKajians = activeFilter === 'all' || activeFilter === 'kajian';
  const showDictionaries = activeFilter === 'all' || activeFilter === 'dictionary';
  const showPerawis = activeFilter === 'all' || activeFilter === 'perawi';
  const showFeatures = activeFilter === 'all' || activeFilter === 'feature';
  const filterCounts = {
    all: remoteSearchFilters.reduce(
      (sum, filter) => sum + resultCountForFilter(remoteResultsByFilter[filter.key], filter.key),
      featureResults.length,
    ),
    dictionary: resultCountForFilter(remoteResultsByFilter.dictionary, 'dictionary'),
    doa: resultCountForFilter(remoteResultsByFilter.doa, 'doa'),
    feature: featureResults.length,
    hadith: resultCountForFilter(remoteResultsByFilter.hadith, 'hadith'),
    kajian: resultCountForFilter(remoteResultsByFilter.kajian, 'kajian'),
    perawi: resultCountForFilter(remoteResultsByFilter.perawi, 'perawi'),
    quran: resultCountForFilter(remoteResultsByFilter.quran, 'quran'),
  };
  const totalResults = filterCounts[activeFilter] ?? 0;
  const displayedFeatureResults = activeFilter === 'all' ? featureResults.slice(0, PREVIEW_SIZE) : featureResults;

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (searchFilterKeys.has(initialFilter)) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    let mounted = true;

    getSurahs()
      .then((items) => {
        if (!mounted) return;
        setSurahNameByNumber(
          items.reduce((acc, surah) => {
            acc[Number(surah.number)] = surah.name;
            return acc;
          }, {}),
        );
      })
      .catch(() => {
        if (mounted) setSurahNameByNumber({});
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    readRecentSearches().then((items) => {
      if (mounted) setRecentSearches(items);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasQuery) {
      setRemoteResultsByFilter(createEmptyResultsByFilter());
      setPageByFilter({});
      loadedFullRef.current = {};
      setLoading(false);
      setMessage('');
      return undefined;
    }

    let cancelled = false;
    const gen = ++searchGenRef.current;
    loadedFullRef.current = {};
    setLoading(true);
    setMessage('');

    const timer = setTimeout(async () => {
      const searchSettled = [];
      for (const filter of remoteSearchFilters) {
        const result = await Promise.resolve(runRemoteFilterSearch(filter, trimmedQuery, PREVIEW_SIZE)).then(
          (value) => ({ status: 'fulfilled', value }),
          (reason) => ({ status: 'rejected', reason }),
        );
        searchSettled.push({ filter, result });
      }

      if (cancelled || gen !== searchGenRef.current) {
        setLoading(false);
        return;
      }

      const nextResultsByFilter = createEmptyResultsByFilter();
      const failedModules = [];
      searchSettled.forEach(({ filter, result }) => {
        if (result.status === 'fulfilled') {
          nextResultsByFilter[filter.key] = sanitizeRemoteResult(filter.key, result.value);
        } else {
          failedModules.push(filter.label);
        }
      });
      const remoteResultCount = remoteSearchFilters.reduce(
        (sum, filter) => sum + resultCountForFilter(nextResultsByFilter[filter.key], filter.key),
        0,
      );

      setRemoteResultsByFilter(nextResultsByFilter);

      if (failedModules.length) {
        setMessage(`Sebagian hasil belum bisa dimuat: ${failedModules.join(', ')}.`);
        if (remoteResultCount || featureResults.length) {
          rememberRecentSearch(trimmedQuery).then((items) => {
            if (!cancelled) setRecentSearches(items);
          });
        }
      } else {
        setMessage('');
        rememberRecentSearch(trimmedQuery).then((items) => {
          if (!cancelled) setRecentSearches(items);
        });
      }

      setLoading(false);
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [featureResults.length, hasQuery, trimmedQuery]);

  useEffect(() => {
    if (!hasQuery || activeFilter === 'all' || activeFilter === 'feature') return undefined;

    const filter = searchFilters.find((item) => item.key === activeFilter);
    const field = resultFieldByFilter[activeFilter];
    if (!filter || !field || filter.remoteType === 'all') return undefined;

    const loadKey = `${activeFilter}:${trimmedQuery}`;
    if (loadedFullRef.current[loadKey]) return undefined;
    loadedFullRef.current[loadKey] = true;

    let cancelled = false;
    const gen = ++searchGenRef.current;
    setLoadingMore(true);

    runRemoteFilterSearch(filter, trimmedQuery, PAGE_SIZE)
      .then((result) => {
        if (cancelled || gen !== searchGenRef.current) return;
        setLoading(false);
        setRemoteResultsByFilter((prev) => ({
          ...prev,
          [activeFilter]: result,
        }));
        setPageByFilter((prev) => ({ ...prev, [activeFilter]: 1 }));
        setMessage('');
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          const currentResult = remoteResultsByFilter[activeFilter] ?? emptyGlobalResult;
          const loaded = currentResult[field]?.length ?? 0;
          if (loaded === 0) {
            setMessage(`${filter.label} belum bisa dimuat penuh. Preview yang tersedia tetap ditampilkan.`);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeFilter, hasQuery, trimmedQuery]);

  const handleLoadMore = async () => {
    if (loadingMore || activeFilter === 'all' || activeFilter === 'feature') return;
    setLoadingMore(true);
    const filter = searchFilters.find((item) => item.key === activeFilter);
    if (!filter || filter.remoteType === 'all') { setLoadingMore(false); return; }

    const gen = ++searchGenRef.current;
    const currentPage = pageByFilter[activeFilter] ?? 1;
    const result = await searchGlobal(trimmedQuery, { limit: PAGE_SIZE, page: currentPage, type: filter.remoteType })
      .then((value) => ({ status: 'fulfilled', value }))
      .catch((reason) => ({ status: 'rejected', reason }));

    if (result.status === 'fulfilled') {
      if (gen !== searchGenRef.current) { setLoadingMore(false); return; }
      const field = resultFieldByFilter[activeFilter];
      const totalField = totalFieldByFilter[activeFilter];
      setPageByFilter((prev) => ({ ...prev, [activeFilter]: currentPage + 1 }));
      setRemoteResultsByFilter((prev) => {
        const next = { ...prev };
        const currentItems = prev[activeFilter]?.[field] ?? [];
        const existingKeys = new Set(currentItems.map((item) => `${item.id ?? item.number ?? JSON.stringify(item)}`));
        const appendedItems = (result.value[field] ?? []).filter((item) => {
          const key = `${item.id ?? item.number ?? JSON.stringify(item)}`;
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        });
        next[activeFilter] = {
          ...prev[activeFilter],
          [totalField]: Math.max(
            Number(result.value[totalField] ?? result.value?.total ?? 0),
            prev[activeFilter]?.[totalField] ?? 0,
          ),
          [field]: [...currentItems, ...appendedItems],
        };
        return next;
      });
      setMessage('');
    } else {
      setMessage(`${selectedFilter.label} belum bisa dimuat. Coba lagi.`);
    }
    setLoadingMore(false);
  };

  const handleSeeAll = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const searchChips = recentSearches.length ? recentSearches : quickSuggestions;
  const chipLabel = recentSearches.length ? 'Terakhir dicari' : 'Cari cepat';
  const resultSummary = `${totalResults} hasil untuk "${trimmedQuery}"`;
  const emptyState = emptyStateByFilter[activeFilter] ?? emptyStateByFilter.all;
  const renderSearchResults = () => (
    <>
      <View testID={isWebAppLayout ? 'global-search-web-app-surface' : 'global-search-classic-surface'} />
      {!hasQuery && !isWebAppLayout ? (
        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Search color={colors.primary} size={22} strokeWidth={2.2} />
          </View>
          <Text style={styles.hintTitle}>Mulai dari dua huruf</Text>
          <Text style={styles.hintText}>Contoh: shalat, sabar, zakat, tafsir, atau nama fitur.</Text>
        </View>
      ) : null}

      {loading ? <LoadingSearchState label={selectedFilter.label} /> : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {hasQuery && !loading && totalResults ? (
        <View style={styles.resultSummary}>
          <Search color={colors.primary} size={15} strokeWidth={2.2} />
          <Text style={styles.resultSummaryText}>{resultSummary}</Text>
        </View>
      ) : null}

      {hasQuery && !loading && !totalResults ? (
        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>{emptyState.title}</Text>
          <Text style={styles.hintText}>{emptyState.text}</Text>
        </View>
      ) : null}

      {showAyahs ? (
        <ResultSection count={remoteResults.ayahTotal || remoteResults.ayahs.length} title="Al-Quran">
          {remoteResults.ayahs.map((item) => {
            const surahName = item.surahName || surahNameByNumber[Number(item.surahNumber)] || '';
            const title =
              [surahName || (item.surahNumber ? `Surah ${item.surahNumber}` : null), item.number ? `Ayah ${item.number}` : null]
                .filter(Boolean)
                .join(' · ') || 'Ayat Quran';
            const meta =
              [item.juzNumber ? `Juz ${item.juzNumber}` : null, item.pageNumber ? `Hal. ${item.pageNumber}` : null]
                .filter(Boolean)
                .join(' · ') || 'Al-Quran';

            return (
              <ResultRow
                Icon={BookOpen}
                key={`ayah-${item.id}`}
                meta={meta}
                onPress={() =>
                  onOpenTab('quran', {
                    ayahId: item.id,
                    ayahNumber: item.number,
                    surahNumber: item.surahNumber,
                  })
                }
                subtitle={item.translation}
                title={title}
              />
            );
          })}
          {activeFilter === 'all' && filterCounts.quran > remoteResults.ayahs.length ? (
            <SeeAllButton count={filterCounts.quran} filter="quran" onPress={handleSeeAll} />
          ) : null}
        </ResultSection>
      ) : null}

      {showHadiths ? (
        <ResultSection count={remoteResults.hadithTotal || remoteResults.hadiths.length} title="Hadis">
          {remoteResults.hadiths.map((item) => (
            <ResultRow
              Icon={Book}
              key={`hadith-${item.id}`}
              meta={cleanMeta(item.book, 'Hadis')}
              onPress={() => onOpenTab('hadith', { hadithId: item.id })}
              subtitle={item.translation}
              title={item.title || `Hadis ${item.id}`}
            />
          ))}
          {activeFilter === 'all' && filterCounts.hadith > remoteResults.hadiths.length ? (
            <SeeAllButton count={filterCounts.hadith} filter="hadith" onPress={handleSeeAll} />
          ) : null}
        </ResultSection>
      ) : null}

      {showDoas ? (
        <ResultSection count={remoteResults.doaTotal || remoteResults.doas.length} title="Doa">
          {remoteResults.doas.map((item) => (
            <ResultRow
              Icon={BookOpen}
              key={`doa-${item.id}`}
              meta={cleanMeta(item.meta, 'Doa')}
              onPress={() => onOpenTab('belajar', { featureKey: 'doa' })}
              subtitle={item.body}
              title={item.title}
            />
          ))}
          {activeFilter === 'all' && filterCounts.doa > remoteResults.doas.length ? (
            <SeeAllButton count={filterCounts.doa} filter="doa" onPress={handleSeeAll} />
          ) : null}
        </ResultSection>
      ) : null}

      {showKajians ? (
        <ResultSection count={remoteResults.kajianTotal || remoteResults.kajians.length} title="Kajian">
          {remoteResults.kajians.map((item) => (
            <ResultRow
              Icon={Book}
              key={`kajian-${item.id}`}
              meta={cleanMeta(item.meta, 'Kajian')}
              onPress={() => onOpenTab('belajar', { featureKey: 'kajian' })}
              subtitle={item.body}
              title={item.title}
            />
          ))}
          {activeFilter === 'all' && filterCounts.kajian > remoteResults.kajians.length ? (
            <SeeAllButton count={filterCounts.kajian} filter="kajian" onPress={handleSeeAll} />
          ) : null}
        </ResultSection>
      ) : null}

      {showFeatures ? (
        <ResultSection count={featureResults.length} title="Fitur">
          {displayedFeatureResults.map((feature) => (
            <ResultRow
              Icon={Layers}
              key={`feature-${feature.key}`}
              meta={cleanMeta(feature.group, 'Fitur')}
              onPress={() => onOpenTab('belajar', { featureKey: feature.key, focusSearch: feature.type === 'kamus' })}
              subtitle={feature.subtitle}
              title={feature.title}
            />
          ))}
          {activeFilter === 'all' && featureResults.length > displayedFeatureResults.length ? (
            <SeeAllButton count={featureResults.length} filter="feature" onPress={handleSeeAll} />
          ) : null}
        </ResultSection>
      ) : null}

      {showDictionaries ? (
        <ResultSection count={remoteResults.dictionaryTotal || remoteResults.dictionaries.length} title="Kamus">
          {remoteResults.dictionaries.map((item) => (
            <ResultRow
              Icon={Languages}
              key={`dictionary-${item.id}`}
              meta={cleanMeta(item.category, 'Kamus')}
              onPress={() => onOpenTab('belajar', { featureKey: 'kamus', focusSearch: true })}
              subtitle={item.body}
              title={item.title}
            />
          ))}
          {activeFilter === 'all' && filterCounts.dictionary > remoteResults.dictionaries.length ? (
            <SeeAllButton count={filterCounts.dictionary} filter="dictionary" onPress={handleSeeAll} />
          ) : null}
        </ResultSection>
      ) : null}

      {showPerawis ? (
        <ResultSection count={remoteResults.perawiTotal || remoteResults.perawis.length} title="Perawi">
          {remoteResults.perawis.map((item) => (
            <ResultRow
              Icon={UserRound}
              key={`perawi-${item.id}`}
              meta={cleanMeta(item.status, 'Perawi')}
              onPress={() => onOpenTab('belajar', { featureKey: 'perawi' })}
              subtitle={item.body}
              title={item.title}
            />
          ))}
          {activeFilter === 'all' && filterCounts.perawi > remoteResults.perawis.length ? (
            <SeeAllButton count={filterCounts.perawi} filter="perawi" onPress={handleSeeAll} />
          ) : null}
        </ResultSection>
      ) : null}

      {activeFilter !== 'all' && activeFilter !== 'feature' && hasQuery && !loading ? (
        (() => {
          const field = resultFieldByFilter[activeFilter];
          const totalField = totalFieldByFilter[activeFilter];
          const total = remoteResults[totalField] ?? remoteResults[field]?.length ?? 0;
          const loaded = remoteResults[field]?.length ?? 0;
          if (loaded < total) {
            return (
              <View style={styles.loadMoreWrap}>
                <Pressable
                  android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                  onPress={handleLoadMore}
                  style={styles.loadMoreButton}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Text style={styles.loadMoreText}>Muat Lainnya</Text>
                  )}
                </Pressable>
              </View>
            );
          }
          return null;
        })()
      ) : null}
    </>
  );

  if (isWebAppLayout) {
    const webAppSearchTheme = isDarkTheme ? WEB_APP_SEARCH_DARK : WEB_APP_SEARCH_LIGHT;
    const webAppFilterOrder = ['all', 'quran', 'hadith', 'doa', 'dictionary', 'kajian', 'perawi'];
    const webAppFilters = webAppFilterOrder
      .map((filterKey) => searchFilters.find((filter) => filter.key === filterKey))
      .filter(Boolean);

    return (
      <ScrollView
        contentContainerStyle={[
          styles.webAppSearchContent,
          { backgroundColor: webAppSearchTheme.bg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={[styles.webAppSearchScroll, { backgroundColor: webAppSearchTheme.bg }]}
        testID="global-search-web-app-scroll"
      >
        <Text style={[styles.webAppSearchTitle, { color: webAppSearchTheme.title }]}>Pencarian</Text>
        <View style={styles.webAppSearchRow}>
          <View
            style={[styles.webAppSearchInputWrap, { backgroundColor: webAppSearchTheme.surface }]}
            testID="global-search-web-app-input-wrap"
          >
            <TextInput
              onChangeText={setQuery}
              placeholder="Cari ayah, hadith, atau terjemahan..."
              placeholderTextColor={webAppSearchTheme.muted}
              style={[styles.webAppSearchInput, { color: webAppSearchTheme.inputText }]}
              testID="search-input"
              value={query}
            />
          </View>
          <Pressable
            onPress={Keyboard.dismiss}
            style={[styles.webAppSearchButton, { backgroundColor: webAppSearchTheme.active }]}
            testID="global-search-web-app-submit"
          >
            <Search color="#ffffff" size={15} strokeWidth={2.2} />
            <Text style={styles.webAppSearchButtonText}>Cari</Text>
          </Pressable>
        </View>
        <View style={styles.webAppFilterWrap}>
          {webAppFilters.map((filter) => {
            const active = filter.key === activeFilter;
            const count = filterCounts[filter.key] ?? 0;
            const label = hasQuery && count ? `${filter.label} ${count}` : filter.label;
            const displayLabel = filter.key === 'quran' ? 'Al-Quran' : filter.key === 'hadith' ? 'Hadith' : label;
            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                style={[
                  styles.webAppFilterChip,
                  { backgroundColor: active ? webAppSearchTheme.active : webAppSearchTheme.chip },
                ]}
              >
                <Text
                  style={[
                    styles.webAppFilterText,
                    { color: active ? webAppSearchTheme.activeText : webAppSearchTheme.chipText },
                  ]}
                >
                  {displayLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.webAppSearchResults}>{renderSearchResults()}</View>
      </ScrollView>
    );
  }

  return (
    <Screen
      actions={<IconActionButton Icon={ArrowLeft} label="Kembali ke Beranda" onPress={onBack} />}
      searchSlot={
        <PaperSearchInput
          autoFocus
          onChangeText={setQuery}
          placeholder="Cari Quran, hadis, fitur, kamus..."
          value={query}
        />
      }
      headerExtra={
        <>
          <ScrollView
            contentContainerStyle={styles.filterContent}
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            {searchFilters.map((filter) => {
              const active = filter.key === activeFilter;
              const count = filterCounts[filter.key] ?? 0;
              const label = hasQuery && count ? `${filter.label} ${count}` : filter.label;
              return (
                <Pressable
                  android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {!hasQuery ? (
            <View style={styles.quickWrap}>
              <Text style={styles.quickLabel}>{chipLabel}</Text>
              <View style={styles.quickChips}>
                {searchChips.slice(0, 6).map((item) => (
                  <Pressable
                    android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                    key={item}
                    onPress={() => setQuery(item)}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </>
      }
      subtitle="Satu tempat untuk menemukan bacaan, hadis, referensi, dan fitur aplikasi."
      title="Cari"
    >
      {renderSearchResults()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  webAppSearchScroll: {
    flex: 1,
  },
  webAppSearchContent: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  webAppSearchTitle: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 32,
    marginBottom: spacing.lg,
  },
  webAppSearchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  webAppSearchInputWrap: {
    borderColor: WEB_APP_SEARCH_ACCENT,
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  webAppSearchInput: {
    color: '#e2e8f0',
    fontSize: 14,
    minHeight: 40,
    padding: 0,
  },
  webAppSearchButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  webAppSearchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  webAppFilterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  webAppFilterChip: {
    borderRadius: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  webAppFilterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  webAppSearchResults: {
    marginTop: spacing.lg,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterContent: {
    paddingRight: spacing.lg,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  hintCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.paper,
  },
  hintIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 44,
  },
  hintText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  hintTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '900',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.paper,
  },
  loadingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  loadingSkeleton: {
    alignItems: 'center',
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingTop: spacing.sm,
  },
  loadingSkeletonCopy: {
    flex: 1,
    minWidth: 0,
  },
  loadingSkeletonIcon: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 34,
    width: 34,
  },
  loadingSkeletonLine: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 9,
    marginTop: spacing.xs,
    width: '58%',
  },
  loadingSkeletonTitle: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 11,
    width: '78%',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  message: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  quickChip: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  quickText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  quickWrap: {
    marginTop: spacing.md,
  },
  resultSummary: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  resultSummaryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  resultRow: {
    marginTop: spacing.sm,
  },
  seeAllButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  loadMoreWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadMoreButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderColor: colors.faint,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionCount: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '900',
  },
});
