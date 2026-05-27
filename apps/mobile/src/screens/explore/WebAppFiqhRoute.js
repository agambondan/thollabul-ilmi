import { ChevronDown, Search, Scale } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '../../theme';
import { normalizeSearchText } from '../ExploreScreen.helpers';

const DEFAULT_CATEGORIES = ['thaharah', 'sholat', 'zakat', 'puasa', 'haji', 'muamalah', 'umum'];

const toStr = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name ?? value.title ?? value.label ?? value.value ?? '';
};

const titleCase = (value) =>
  value
    ? value
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
    : '';

const getRaw = (item) => item?.raw ?? {};
const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
const getFiqhId = (item) => getRaw(item).id ?? getRaw(item)._id ?? item?.id ?? getFiqhTitle(item);
const getFiqhTitle = (item) =>
  pickText(
    getRaw(item).title_idn,
    getRaw(item).title_id,
    getRaw(item).title,
    getRaw(item).name,
    item?.title,
    'Materi fiqh',
  );
const getFiqhContent = (item) =>
  pickText(
    getRaw(item).content_idn,
    getRaw(item).content_id,
    getRaw(item).content,
    getRaw(item).description,
    item?.body,
  );
const getFiqhDalil = (item) => toStr(getRaw(item).dalil);
const getFiqhSource = (item) => pickText(getRaw(item).source, item?.meta);
const getFiqhCategory = (item) => toStr(getRaw(item).category ?? item?.meta);

const getCategories = (items) => {
  const seen = new Set();
  return [...DEFAULT_CATEGORIES, ...items.map(getFiqhCategory)]
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
};

function CategoryPill({ active, label, onPress, testID }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryPill, active && styles.categoryPillActive]}
      testID={testID}
    >
      <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FiqhCard({ index, item, onOpen }) {
  const category = getFiqhCategory(item);

  return (
    <Pressable onPress={() => onOpen(item)} style={styles.card} testID="web-app-fiqh-card">
      <View style={styles.cardMain}>
        {category ? (
          <Text style={styles.categoryBadge}>{titleCase(category)}</Text>
        ) : (
          <View style={styles.categoryDash} />
        )}
        <Text numberOfLines={1} style={styles.cardTitle}>
          {getFiqhTitle(item, index)}
        </Text>
      </View>
      <ChevronDown color="#9ca3af" size={22} strokeWidth={2.1} />
    </Pressable>
  );
}

export function WebAppFiqhRoute({
  error,
  items,
  loading,
  onLoadMore,
  onOpenItem,
  pagination,
}) {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const categories = useMemo(() => getCategories(items), [items]);
  const filteredItems = useMemo(() => {
    const query = normalizeSearchText(search);
    return items.filter((item) => {
      const itemCategory = getFiqhCategory(item);
      const text = [
        getFiqhTitle(item),
        getFiqhContent(item),
        getFiqhDalil(item),
        getFiqhSource(item),
        titleCase(itemCategory),
      ].join(' ');

      return (
        (!category || itemCategory === category) &&
        (!query || normalizeSearchText(text).includes(query))
      );
    });
  }, [category, items, search]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID="explore-web-app-fiqh-surface" />
      <View style={styles.header}>
        <Text style={styles.title}>Fiqh Ringkas</Text>
        <Text style={styles.count}>{items.length} materi fiqh</Text>
      </View>

      <View style={styles.filterWrap}>
        <View style={styles.search}>
          <Search color="#9ca3af" size={16} strokeWidth={2} />
          <TextInput
            onChangeText={setSearch}
            placeholder="Cari materi..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
            testID="web-app-fiqh-search"
            value={search}
          />
        </View>
        <CategoryPill
          active={!category}
          label="Semua"
          onPress={() => setCategory('')}
          testID="web-app-fiqh-category-all"
        />
        {categories.map((item) => (
          <CategoryPill
            active={category === item}
            key={item}
            label={titleCase(item)}
            onPress={() => setCategory(category === item ? '' : item)}
            testID={`web-app-fiqh-category-${item}`}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>Materi fiqh belum bisa dimuat. Coba refresh halaman.</Text> : null}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#4d7c0f" size="small" />
          <Text style={styles.stateText}>Memuat materi fiqh...</Text>
        </View>
      ) : null}

      {!loading && !error && filteredItems.length ? (
        <View style={styles.list}>
          {filteredItems.map((item, index) => (
            <FiqhCard
              index={index}
              item={item}
              key={`${getFiqhId(item)}-${index}`}
              onOpen={onOpenItem}
            />
          ))}
        </View>
      ) : null}

      {!loading && !error && !filteredItems.length ? (
        <View style={styles.empty}>
          <Scale color="#9ca3af" size={32} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>
            {items.length ? 'Materi fiqh tidak ditemukan.' : 'Materi fiqh belum tersedia.'}
          </Text>
          <Text style={styles.emptyText}>
            {items.length ? 'Ubah pencarian atau pilih kategori lain.' : 'Coba muat ulang beberapa saat lagi.'}
          </Text>
        </View>
      ) : null}

      {pagination?.hasMore && !loading && !error ? (
        <View style={styles.loadMoreWrap}>
          <Pressable
            disabled={pagination.loadingMore}
            onPress={onLoadMore}
            style={[styles.loadMoreButton, pagination.loadingMore && styles.loadMoreButtonDisabled]}
            testID="web-app-fiqh-load-more"
          >
            <Text style={styles.loadMoreText}>
              {pagination.loadingMore ? 'Memuat...' : 'Muat lebih banyak'}
            </Text>
          </Pressable>
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
    marginBottom: spacing.md,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  count: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  filterWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  search: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 38,
    paddingHorizontal: spacing.sm,
    width: 176,
  },
  input: {
    color: '#111827',
    fontSize: 14,
    minHeight: 36,
    padding: 0,
    width: 128,
  },
  categoryPill: {
    backgroundColor: '#f3f4f6',
    borderColor: '#f3f4f6',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  categoryPillActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  categoryPillText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cardMain: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  categoryBadge: {
    backgroundColor: '#ecfccb',
    borderRadius: 4,
    color: '#4d7c0f',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  categoryDash: {
    backgroundColor: '#d9f99d',
    borderRadius: 999,
    height: 4,
    width: 18,
  },
  cardTitle: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  cardText: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  dalil: {
    borderTopColor: '#f3f4f6',
    borderTopWidth: 1,
    color: '#6b7280',
    fontFamily: 'serif',
    fontSize: 16,
    lineHeight: 28,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    textAlign: 'right',
  },
  source: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 150,
  },
  stateText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '800',
  },
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: radius.md,
    borderWidth: 1,
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#f3f4f6',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 190,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  loadMoreWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loadMoreButton: {
    backgroundColor: '#ffffff',
    borderColor: '#a7f3d0',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
  },
});
