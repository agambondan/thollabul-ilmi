import { BookOpen, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '../../theme';
import { normalizeSearchText } from '../ExploreScreen.helpers';

const DOA_CATEGORIES = [
  { value: '', label: 'Semua' },
  { value: 'pagi', label: 'Pagi' },
  { value: 'petang', label: 'Petang' },
  { value: 'makan', label: 'Makan' },
  { value: 'tidur', label: 'Tidur' },
  { value: 'bangun', label: 'Bangun' },
  { value: 'kamar_mandi', label: 'Kamar mandi' },
  { value: 'masjid', label: 'Masjid' },
  { value: 'safar', label: 'Safar' },
  { value: 'belajar', label: 'Belajar' },
  { value: 'umum', label: 'Umum' },
];

const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
const getRaw = (item) => item?.raw ?? {};
const getTranslation = (item) => getRaw(item)?.translation ?? {};
const getCategory = (item) => getRaw(item)?.category ?? '';
const getCategoryLabel = (value) => DOA_CATEGORIES.find((category) => category.value === value)?.label ?? value;
const getArabic = (item) => pickText(item?.arabic, getTranslation(item).ar, getTranslation(item).arab, getRaw(item).arabic);
const getLatin = (item) => pickText(getTranslation(item).latin_idn, getTranslation(item).latin, getRaw(item).transliteration);
const getBody = (item) =>
  pickText(
    item?.body,
    getTranslation(item).idn,
    getTranslation(item).text_idn,
    getTranslation(item).meaning,
    getRaw(item).description,
    getRaw(item).meaning,
  );
const getSource = (item) => pickText(getRaw(item).source, item?.meta);
const hasAudio = (item) => Boolean(getRaw(item).audio_url ?? item?.audio_url);

const filterDoas = (items, query, category) => {
  const normalizedQuery = normalizeSearchText(query);
  return items.filter((item) => {
    if (category && getCategory(item) !== category) return false;
    if (!normalizedQuery) return true;
    return normalizeSearchText([
      item?.title,
      getArabic(item),
      getLatin(item),
      getBody(item),
      getSource(item),
      getCategoryLabel(getCategory(item)),
    ].filter(Boolean).join(' ')).includes(normalizedQuery);
  });
};

function DoaCard({ item, onOpen }) {
  const category = getCategory(item);
  const arabic = getArabic(item);
  const latin = getLatin(item);
  const body = getBody(item);
  const source = getSource(item);

  return (
    <Pressable onPress={() => onOpen(item)} style={styles.card} testID="web-app-doa-card">
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text numberOfLines={2} style={styles.cardTitle}>{item?.title || 'Doa'}</Text>
          <View style={styles.metaRow}>
            {category ? <Text style={styles.categoryPill}>{getCategoryLabel(category)}</Text> : null}
            {hasAudio(item) ? <Text style={styles.audioPill}>Audio</Text> : null}
          </View>
        </View>
        <BookOpen color="#047857" size={18} strokeWidth={2.1} />
      </View>
      {arabic ? (
        <Text numberOfLines={3} style={styles.arabicText}>{arabic}</Text>
      ) : null}
      {latin ? (
        <Text numberOfLines={2} style={styles.latinText}>{latin}</Text>
      ) : null}
      {body ? (
        <Text numberOfLines={3} style={styles.bodyText}>{body}</Text>
      ) : null}
      {source ? (
        <Text numberOfLines={1} style={styles.sourceText}>{source}</Text>
      ) : null}
    </Pressable>
  );
}

export function WebAppDoaRoute({ error, items, loading, onLoadMore, onOpenItem, pagination }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const filteredItems = useMemo(() => filterDoas(items, query, category), [category, items, query]);
  const countText = query || category
    ? `Menampilkan ${filteredItems.length} dari ${items.length} doa`
    : `${items.length} doa tersedia`;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID="explore-web-app-doa-surface" />
      <View style={styles.header}>
        <Text style={styles.arabicTitle}>الدُّعَاء</Text>
        <Text style={styles.title}>Doa</Text>
        <Text style={styles.subtitle}>Doa harian dan pilihan dalam tampilan dashboard.</Text>
      </View>

      <View style={styles.searchBox}>
        <Search color="#9ca3af" size={16} strokeWidth={2} />
        <TextInput
          onChangeText={setQuery}
          placeholder="Cari doa, kategori, atau sumber"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          testID="web-app-doa-search"
          value={query}
        />
      </View>

      <View style={styles.categoryRow}>
        {DOA_CATEGORIES.map((item) => (
          <Pressable
            key={item.value || 'all'}
            onPress={() => setCategory(item.value)}
            style={[styles.categoryChip, category === item.value && styles.categoryChipActive]}
            testID="web-app-doa-category"
          >
            <Text style={[styles.categoryChipText, category === item.value && styles.categoryChipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{countText}</Text>
        {query ? (
          <Pressable onPress={() => setQuery('')} testID="web-app-doa-reset-search">
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#047857" size="small" />
          <Text style={styles.stateText}>Memuat doa...</Text>
        </View>
      ) : null}
      {!loading && filteredItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{items.length ? 'Tidak ada doa yang cocok.' : 'Data doa belum tersedia.'}</Text>
          <Text style={styles.emptyText}>Coba kata kunci atau kategori lain.</Text>
        </View>
      ) : null}

      <View style={styles.cards}>
        {!loading ? filteredItems.map((item, index) => (
          <DoaCard item={item} key={`${item?.id ?? 'doa'}-${index}`} onOpen={onOpenItem} />
        )) : null}
      </View>

      {!loading && pagination?.hasMore ? (
        <Pressable
          disabled={pagination.loadingMore}
          onPress={onLoadMore}
          style={[styles.loadMoreButton, pagination.loadingMore && styles.disabledButton]}
          testID="web-app-doa-load-more"
        >
          <Text style={styles.loadMoreText}>{pagination.loadingMore ? 'Memuat...' : 'Muat doa lain'}</Text>
        </Pressable>
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
    marginBottom: spacing.xl,
  },
  arabicTitle: {
    color: '#047857',
    fontFamily: 'Kitab-Regular',
    fontSize: 32,
    lineHeight: 44,
    marginBottom: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  title: {
    color: '#064e3b',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  categoryChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  categoryChipActive: {
    backgroundColor: '#047857',
  },
  categoryChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  countRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  countText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
  },
  resetText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  error: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.md,
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
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  cards: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: '#064e3b',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 7,
  },
  categoryPill: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    color: '#047857',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  audioPill: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  arabicText: {
    color: '#064e3b',
    fontFamily: 'Kitab-Regular',
    fontSize: 23,
    lineHeight: 42,
    marginTop: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  latinText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  bodyText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sourceText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  loadMoreButton: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 44,
  },
  disabledButton: {
    opacity: 0.55,
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
