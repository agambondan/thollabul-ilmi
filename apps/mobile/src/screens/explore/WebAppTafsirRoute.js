import { BookOpen, Search } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '../../theme';
import { normalizeSearchText } from '../ExploreScreen.helpers';

const filterSurahs = (surahs, query) => {
  const normalized = normalizeSearchText(query);
  if (!normalized) return surahs;
  return surahs.filter((surah) =>
    normalizeSearchText(`${surah.number} ${surah.name} ${surah.meaning ?? ''} ${surah.arabic ?? ''}`).includes(normalized),
  );
};

function SurahCard({ active, onPress, surah }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.surahCard, active && styles.surahCardActive]}
      testID="web-app-tafsir-surah-card"
    >
      <View style={[styles.surahNumber, active && styles.surahNumberActive]}>
        <Text style={[styles.surahNumberText, active && styles.surahNumberTextActive]}>{surah.number}</Text>
      </View>
      <View style={styles.surahBody}>
        <Text numberOfLines={1} style={styles.surahName}>{surah.name}</Text>
        <Text numberOfLines={1} style={styles.surahMeaning}>{surah.meaning || `${surah.ayahs} ayat`}</Text>
      </View>
    </Pressable>
  );
}

function TafsirResultCard({ item, onOpen }) {
  return (
    <Pressable onPress={() => onOpen(item)} style={styles.resultCard} testID="web-app-tafsir-result-card">
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{item.title || 'Ayat'}</Text>
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
          <Text style={styles.tafsirSource}>Tafsir Kemenag</Text>
          <Text numberOfLines={3} style={styles.tafsirText}>{item.tafsir}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function WebAppTafsirRoute({
  error,
  items,
  loading,
  onOpenItem,
  onSelectSurah,
  onSearchSurah,
  selectedSurahNumber,
  surahSearch,
  surahs,
}) {
  const filteredSurahs = filterSurahs(surahs, surahSearch);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID="explore-web-app-tafsir-surface" />
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <BookOpen color="#047857" size={22} strokeWidth={2.1} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Tafsir</Text>
          <Text style={styles.subtitle}>Pilih surah untuk membaca penjelasan ayat.</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          <Text style={styles.noticeStrong}>Catatan: </Text>
          Data tafsir mengikuti ketersediaan backend dan bisa bertambah bertahap.
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Search color="#9ca3af" size={16} strokeWidth={2} />
        <TextInput
          autoCapitalize="none"
          onChangeText={onSearchSurah}
          placeholder="Cari nama atau nomor surah"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          testID="web-app-tafsir-search"
          value={surahSearch}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#047857" size="small" />
          <Text style={styles.stateText}>Memuat tafsir...</Text>
        </View>
      ) : null}

      {!loading && !filteredSurahs.length ? (
        <View style={styles.empty}>
          <BookOpen color="#cbd5e1" size={38} strokeWidth={1.7} />
          <Text style={styles.emptyText}>Surah tidak ditemukan.</Text>
        </View>
      ) : null}

      {filteredSurahs.length ? (
        <View style={styles.surahGrid}>
          {filteredSurahs.map((surah) => (
            <SurahCard
              active={selectedSurahNumber === surah.number}
              key={surah.number}
              onPress={() => onSelectSurah(surah.number)}
              surah={surah}
            />
          ))}
        </View>
      ) : null}

      {selectedSurahNumber && !loading ? (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Surah {selectedSurahNumber}</Text>
          <Text style={styles.resultsCount}>{items.length} ayat</Text>
        </View>
      ) : null}

      {!loading && selectedSurahNumber && !error && !items.length ? (
        <Text style={styles.emptyText}>Tafsir untuk surah ini belum tersedia. Coba pilih surah lain.</Text>
      ) : null}

      {!loading && items.length ? (
        <View style={styles.results}>
          {items.map((item, index) => (
            <TafsirResultCard item={item} key={`${item?.id ?? 'tafsir'}-${index}`} onOpen={onOpenItem} />
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
  title: {
    color: '#064e3b',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
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
