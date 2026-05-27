import { Search } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '../../theme';

const toStr = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name ?? value.title ?? value.label ?? value.value ?? '';
};

const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';

const getRaw = (item) => item?.raw ?? {};
const getArabic = (item) =>
  pickText(getRaw(item).arabic, getRaw(item).word_arabic, getRaw(item).term, item?.arabic);
const getLatin = (item) =>
  pickText(getRaw(item).latin, getRaw(item).transliteration, getRaw(item).term, item?.title);
const getMeaning = (item) =>
  pickText(
    getRaw(item).meaning?.idn,
    getRaw(item).meaning?.id,
    getRaw(item).meaning?.en,
    getRaw(item).meaning,
    getRaw(item).definition?.idn,
    getRaw(item).definition?.id,
    getRaw(item).definition?.en,
    getRaw(item).definition,
    item?.body,
  );
const getRoot = (item) => toStr(getRaw(item).root ?? getRaw(item).word_root ?? getRaw(item).origin ?? getRaw(item).source);

function KamusResultCard({ item }) {
  return (
    <View style={styles.resultCard} testID="web-app-kamus-result-card">
      <Text numberOfLines={1} style={styles.arabicText}>
        {getArabic(item) || '-'}
      </Text>
      <View style={styles.resultBody}>
        <Text numberOfLines={1} style={styles.latinText}>
          {getLatin(item) || '-'}
        </Text>
        <Text numberOfLines={3} style={styles.meaningText}>
          {getMeaning(item) || '-'}
        </Text>
        <Text numberOfLines={1} style={styles.rootText}>
          {getRoot(item) || '-'}
        </Text>
      </View>
    </View>
  );
}

export function WebAppKamusRoute({
  dictionaryInputRef,
  dictionaryQuery,
  error,
  focusDictionaryInput,
  items,
  loading,
  onSearch,
  onUpdateQuery,
}) {
  const query = dictionaryQuery.trim();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID="explore-web-app-kamus-surface" />
      <View style={styles.header}>
        <Text style={styles.title}>Kamus Arab</Text>
        <Text style={styles.subtitle}>Cari kata Arab atau Indonesia</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search color="#9ca3af" size={17} strokeWidth={2} />
          <TextInput
            ref={dictionaryInputRef}
            autoCapitalize="none"
            autoFocus={focusDictionaryInput}
            onChangeText={onUpdateQuery}
            onSubmitEditing={onSearch}
            placeholder="Cari kata Arab atau Indonesia"
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            style={styles.input}
            testID="web-app-kamus-search"
            value={dictionaryQuery}
          />
        </View>
        <Pressable onPress={onSearch} style={styles.searchButton} testID="web-app-kamus-submit">
          <Text style={styles.searchButtonText}>Cari</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#059669" size="small" />
          <Text style={styles.stateText}>Mencari kosakata...</Text>
        </View>
      ) : null}

      {!loading && query.length < 2 ? (
        <View style={styles.empty}>
          <Search color="#cbd5e1" size={40} strokeWidth={1.7} />
          <Text style={styles.emptyTitle}>Ketik minimal 2 karakter.</Text>
          <Text style={styles.emptyText}>Hasil kamus akan ditampilkan seperti tabel dashboard.</Text>
        </View>
      ) : null}

      {!loading && query.length >= 2 && !items.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Tidak ada hasil.</Text>
          <Text style={styles.emptyText}>{`Tidak ada kosakata yang cocok dengan "${query}".`}</Text>
        </View>
      ) : null}

      {!loading && items.length ? (
        <View style={styles.results}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.arabicHeader]}>Arab</Text>
            <Text style={styles.headerCell}>Latin</Text>
            <Text style={styles.headerCell}>Makna</Text>
          </View>
          {items.map((item, index) => (
            <KamusResultCard item={item} key={`${item?.id ?? getLatin(item) ?? 'kamus'}-${index}`} />
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
    marginBottom: spacing.lg,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  searchWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.sm,
  },
  input: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 9,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  stateText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: spacing.xs,
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
  results: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerCell: {
    color: '#64748b',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  arabicHeader: {
    textAlign: 'right',
  },
  resultCard: {
    borderColor: '#f1f5f9',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  arabicText: {
    color: '#1f2937',
    flex: 0.9,
    fontFamily: 'Kitab-Regular',
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  resultBody: {
    flex: 2,
    gap: 3,
  },
  latinText: {
    color: '#475569',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  meaningText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  rootText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
});
