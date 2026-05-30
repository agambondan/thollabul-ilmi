import { BookOpen, FileText, Search } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useMobileLocale } from '../../i18n/MobileLocaleProvider';
import { radius, spacing } from '../../theme';
import { normalizeSearchText } from '../ExploreScreen.helpers';

const ASBABUN_QUICK_SURAHS = [1, 2, 4, 18, 36, 67, 112];

const filterSurahs = (surahs, query) => {
  const normalized = normalizeSearchText(query);
  if (!normalized) return surahs;
  return surahs.filter((surah) =>
    normalizeSearchText(`${surah.number} ${surah.name} ${surah.meaning ?? ''} ${surah.arabic ?? ''}`).includes(normalized),
  );
};

const getAsbabunAyahNumber = (item) =>
  item?.raw?.ayah_number ?? item?.raw?.ayah_start ?? item?.raw?.ayah_refs?.[0]?.ayah_number ?? item?.raw?.ayah_id;

const getAsbabunAyahLabel = (item, t) => {
  if (item?.raw?.display_ref) return item.raw.display_ref;
  if (item?.meta) return item.meta;
  if (item?.title) return item.title;
  const start = getAsbabunAyahNumber(item);
  const end = item?.raw?.ayah_end ?? item?.raw?.ayah_refs?.[item?.raw?.ayah_refs?.length - 1]?.ayah_number;
  if (!start) return t('explore.tafsir.ayahFallback');
  return end && Number(end) !== Number(start)
    ? t('explore.tafsir.ayahRange', { end, start })
    : t('explore.tafsir.ayahNumber', { number: start });
};

const getAsbabunSource = (item) => item?.raw?.source ?? item?.source ?? '';
const getAsbabunContent = (item) => item?.body ?? item?.raw?.content ?? item?.raw?.description ?? item?.raw?.text ?? '';

function SurahCard({ active, onPress, surah, t, testID }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.surahCard, active && styles.surahCardActive]}
      testID={testID}
    >
      <View style={[styles.surahNumber, active && styles.surahNumberActive]}>
        <Text style={[styles.surahNumberText, active && styles.surahNumberTextActive]}>{surah.number}</Text>
      </View>
      <View style={styles.surahBody}>
        <Text numberOfLines={1} style={styles.surahName}>{surah.name}</Text>
        <Text numberOfLines={1} style={styles.surahMeaning}>{surah.meaning || t('explore.tafsir.ayahCount', { count: surah.ayahs })}</Text>
      </View>
    </Pressable>
  );
}

function TafsirResultCard({ item, onOpen, t, testID }) {
  return (
    <Pressable onPress={() => onOpen(item)} style={styles.resultCard} testID={testID}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{item.title || t('explore.tafsir.ayahFallback')}</Text>
        {item.meta ? <Text numberOfLines={1} style={styles.resultMeta}>{item.meta}</Text> : null}
      </View>
      {item.arabic ? (
        <Text numberOfLines={2} style={styles.arabicText}>{item.arabic}</Text>
      ) : null}
      {item.body ? (
        <Text numberOfLines={2} style={styles.translationText}>{item.body}</Text>
      ) : null}
      {item.tafsir ? (
        <View style={styles.tafsirPanel}>
          <Text style={styles.tafsirSource}>{t('explore.tafsir.kemenagSource')}</Text>
          <Text numberOfLines={3} style={styles.tafsirText}>{item.tafsir}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function AsbabunResultCard({ item, onOpen, t, testID }) {
  const content = getAsbabunContent(item);
  const source = getAsbabunSource(item);

  return (
    <Pressable onPress={() => onOpen(item)} style={styles.resultCard} testID={testID}>
      <View style={styles.asbabunMetaRow}>
        <Text numberOfLines={1} style={styles.asbabunAyahPill}>
          {getAsbabunAyahLabel(item, t)}
        </Text>
        {source ? (
          <Text numberOfLines={1} style={styles.asbabunSource}>
            {source}
          </Text>
        ) : null}
      </View>
      {content ? (
        <Text style={styles.asbabunContent}>{content}</Text>
      ) : (
        <Text style={styles.emptyText}>{t('explore.tafsir.asbabunSummaryEmpty')}</Text>
      )}
    </Pressable>
  );
}

export function WebAppTafsirRoute({
  arabicTitle,
  error,
  items,
  loading,
  onOpenItem,
  onSelectSurah,
  onSearchSurah,
  selectedSurahNumber,
  surahSearch,
  surahs,
  variant = 'tafsir',
}) {
  const { t } = useMobileLocale();
  const isAsbabun = variant === 'asbabun';
  const filteredSurahs = filterSurahs(surahs, surahSearch);
  const selectedNumber = Number(selectedSurahNumber);
  const selectedSurah = surahs.find((surah) => Number(surah.number) === selectedNumber);
  const typedSurahNumber = Number.parseInt(surahSearch, 10);
  const canSubmitAsbabun = Number.isInteger(typedSurahNumber) && typedSurahNumber >= 1 && typedSurahNumber <= 114;
  const Icon = isAsbabun ? FileText : BookOpen;
  const surfaceTestID = isAsbabun ? 'explore-web-app-asbabun-surface' : 'explore-web-app-tafsir-surface';
  const searchTestID = isAsbabun ? 'web-app-asbabun-search' : 'web-app-tafsir-search';
  const surahCardTestID = isAsbabun ? 'web-app-asbabun-surah-card' : 'web-app-tafsir-surah-card';
  const resultCardTestID = isAsbabun ? 'web-app-asbabun-result-card' : 'web-app-tafsir-result-card';
  const title = isAsbabun ? t('explore.tafsir.asbabunTitle') : t('explore.tafsir.title');
  const subtitle = isAsbabun
    ? t('explore.tafsir.asbabunSubtitle')
    : t('explore.tafsir.subtitle');
  const loadingText = isAsbabun ? t('explore.tafsir.asbabunLoading') : t('explore.tafsir.loading');
  const placeholder = isAsbabun ? t('explore.tafsir.asbabunPlaceholder') : t('explore.tafsir.searchPlaceholder');
  const emptyResultText = isAsbabun
    ? t('explore.tafsir.asbabunEmpty')
    : t('explore.tafsir.empty');
  const showInitialAsbabunState = isAsbabun && !selectedSurahNumber && !loading && !error;

  const handleSubmitAsbabun = () => {
    if (canSubmitAsbabun) onSelectSurah(typedSurahNumber);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID={surfaceTestID} />
      <View style={[styles.header, isAsbabun && styles.headerCentered]}>
        {isAsbabun && arabicTitle ? (
          <Text style={styles.arabicHeading}>{arabicTitle}</Text>
        ) : null}
        <View style={styles.iconWrap}>
          <Icon color="#047857" size={22} strokeWidth={2.1} />
        </View>
        <View style={[styles.headerText, isAsbabun && styles.headerTextCentered]}>
          <Text style={[styles.title, isAsbabun && styles.titleCentered]}>{title}</Text>
          <Text style={[styles.subtitle, isAsbabun && styles.subtitleCentered]}>{subtitle}</Text>
        </View>
      </View>

      {!isAsbabun ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            <Text style={styles.noticeStrong}>{t('explore.tafsir.noticePrefix')} </Text>
            {t('explore.tafsir.noticeText')}
          </Text>
        </View>
      ) : null}

      <View style={isAsbabun ? styles.asbabunSearchRow : null}>
        <View style={[styles.searchBox, isAsbabun && styles.asbabunSearchBox]}>
          <Search color="#9ca3af" size={16} strokeWidth={2} />
          <TextInput
            autoCapitalize="none"
            keyboardType={isAsbabun ? 'number-pad' : 'default'}
            onChangeText={onSearchSurah}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            style={styles.input}
            testID={searchTestID}
            value={surahSearch}
          />
        </View>
        {isAsbabun ? (
          <Pressable
            disabled={!canSubmitAsbabun || loading}
            onPress={handleSubmitAsbabun}
            style={[styles.asbabunSubmit, (!canSubmitAsbabun || loading) && styles.asbabunSubmitDisabled]}
            testID="web-app-asbabun-submit"
          >
            <Text style={styles.asbabunSubmitText}>{loading ? '...' : t('explore.tafsir.searchAction')}</Text>
          </Pressable>
        ) : null}
      </View>

      {isAsbabun ? (
        <View style={styles.quickSection}>
          <Text style={styles.quickLabel}>{t('explore.tafsir.quickExamples')}</Text>
          <View style={styles.quickList}>
            {ASBABUN_QUICK_SURAHS.map((number) => (
              <Pressable
                key={number}
                onPress={() => {
                  onSearchSurah(String(number));
                  onSelectSurah(number);
                }}
                style={[styles.quickPill, selectedNumber === number && styles.quickPillActive]}
                testID="web-app-asbabun-quick-surah"
              >
                <Text style={[styles.quickPillText, selectedNumber === number && styles.quickPillTextActive]}>
                  {t('explore.tafsir.surahNumber', { number })}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#047857" size="small" />
          <Text style={styles.stateText}>{loadingText}</Text>
        </View>
      ) : null}

      {!isAsbabun && !loading && !filteredSurahs.length ? (
        <View style={styles.empty}>
          <BookOpen color="#cbd5e1" size={38} strokeWidth={1.7} />
          <Text style={styles.emptyText}>{t('explore.tafsir.surahNotFound')}</Text>
        </View>
      ) : null}

      {!isAsbabun && filteredSurahs.length ? (
        <View style={styles.surahGrid}>
          {filteredSurahs.map((surah) => (
            <SurahCard
              active={selectedSurahNumber === surah.number}
              key={surah.number}
              onPress={() => onSelectSurah(surah.number)}
              surah={surah}
              t={t}
              testID={surahCardTestID}
            />
          ))}
        </View>
      ) : null}

      {showInitialAsbabunState ? (
        <View style={styles.asbabunInitialState}>
          <Text style={styles.emptyText}>{t('explore.tafsir.asbabunInitial')}</Text>
          <Text style={styles.asbabunSourceHint}>{t('explore.tafsir.asbabunSourceHint')}</Text>
        </View>
      ) : null}

      {selectedSurahNumber && !loading ? (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {selectedSurah ? selectedSurah.name : t('explore.tafsir.surahNumber', { number: selectedSurahNumber })}
          </Text>
          <Text style={styles.resultsCount}>
            {isAsbabun ? t('explore.tafsir.historyCount', { count: items.length }) : t('explore.tafsir.ayahCount', { count: items.length })}
          </Text>
        </View>
      ) : null}

      {!loading && selectedSurahNumber && !error && !items.length ? (
        <Text style={styles.emptyText}>{emptyResultText}</Text>
      ) : null}

      {!loading && items.length ? (
        <View style={styles.results}>
          {items.map((item, index) => (
            isAsbabun ? (
              <AsbabunResultCard
                item={item}
                key={`${item?.id ?? 'asbabun'}-${index}`}
                onOpen={onOpenItem}
                t={t}
                testID={resultCardTestID}
              />
            ) : (
              <TafsirResultCard
                item={item}
                key={`${item?.id ?? 'tafsir'}-${index}`}
                onOpen={onOpenItem}
                t={t}
                testID={resultCardTestID}
              />
            )
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerCentered: {
    flexDirection: 'column',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerText: {
    flex: 1,
  },
  headerTextCentered: {
    alignItems: 'center',
    flex: 0,
  },
  arabicHeading: {
    color: '#047857',
    fontFamily: 'Kitab-Regular',
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  title: {
    color: '#064e3b',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitleCentered: {
    lineHeight: 19,
    maxWidth: 280,
    textAlign: 'center',
  },
  notice: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  noticeText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  noticeStrong: {
    fontWeight: '900',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  asbabunSearchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  asbabunSearchBox: {
    flex: 1,
    marginBottom: 0,
  },
  asbabunSubmit: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  asbabunSubmitDisabled: {
    opacity: 0.45,
  },
  asbabunSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  quickSection: {
    marginBottom: spacing.lg,
  },
  quickLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  quickList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickPill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  quickPillActive: {
    backgroundColor: '#d1fae5',
  },
  quickPillText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  quickPillTextActive: {
    color: '#047857',
  },
  input: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 9,
  },
  surahGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  surahCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 66,
    padding: spacing.sm,
    width: '48%',
  },
  surahCardActive: {
    borderColor: '#34d399',
  },
  surahNumber: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  surahNumberActive: {
    backgroundColor: '#047857',
  },
  surahNumberText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  surahNumberTextActive: {
    color: '#ffffff',
  },
  surahBody: {
    flex: 1,
  },
  surahName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
  },
  surahMeaning: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  resultsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  resultsTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  resultsCount: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  results: {
    gap: spacing.sm,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  resultHeader: {
    marginBottom: spacing.sm,
  },
  resultTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  resultMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  arabicText: {
    color: '#111827',
    fontFamily: 'Kitab-Regular',
    fontSize: 24,
    lineHeight: 36,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translationText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  tafsirPanel: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  tafsirSource: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  tafsirText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  asbabunMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  asbabunAyahPill: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
    maxWidth: 160,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  asbabunSource: {
    color: '#94a3b8',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  asbabunContent: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  asbabunInitialState: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#f1f5f9',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  asbabunSourceHint: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  stateText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
});
