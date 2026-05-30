import { Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useMobileLocale } from '../../i18n/MobileLocaleProvider';
import { radius, spacing } from '../../theme';
import { normalizeSearchText } from '../ExploreScreen.helpers';

const TABAQAH_LABELS = {
  nabi: 'explore.perawi.tabaqah.nabi',
  sahabat: 'explore.perawi.tabaqah.sahabat',
  tabiin: 'explore.perawi.tabaqah.tabiin',
  tabiut_tabiin: 'explore.perawi.tabaqah.tabiutTabiin',
  atbaut_tabiin: 'explore.perawi.tabaqah.atbautTabiin',
  tabaqah_5: 'explore.perawi.tabaqah.fifth',
  tabaqah_6: 'explore.perawi.tabaqah.sixth',
  tabaqah_7: 'explore.perawi.tabaqah.seventh',
};

const STATUS_ACCENTS = {
  dhaif: { backgroundColor: '#ffedd5', color: '#c2410c' },
  kadzdzab: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  la_baasa_bihi: { backgroundColor: '#cffafe', color: '#0e7490' },
  layyin: { backgroundColor: '#fef3c7', color: '#b45309' },
  majhul: { backgroundColor: '#f3f4f6', color: '#4b5563' },
  maqbul: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  matruk: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  nabi: { backgroundColor: '#fef3c7', color: '#b45309' },
  shaduq: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  tsiqah: { backgroundColor: '#dcfce7', color: '#15803d' },
  tsiqah_tsiqah: { backgroundColor: '#d1fae5', color: '#047857' },
};

const getRaw = (item) => item?.raw ?? {};
const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
const getPerawiId = (item) => getRaw(item).id ?? item?.id ?? getPerawiLatin(item);
const getPerawiArabic = (item) => pickText(getRaw(item).nama_arab, item?.arabic);
const getPerawiLatin = (item, fallback = 'Perawi hadis') =>
  pickText(getRaw(item).nama_latin, getRaw(item).nama_lengkap, item?.title, fallback);
const getTabaqah = (item) => pickText(getRaw(item).tabaqah);
const getDeathYear = (item) => getRaw(item).tahun_wafat ?? getRaw(item).wafat_hijri;
const getStatus = (item) => pickText(getRaw(item).status);

const getTabaqahLabel = (value, t) => {
  if (!value) return '';
  return TABAQAH_LABELS[value] ? t(TABAQAH_LABELS[value]) : value.replace(/_/g, ' ');
};

const getStatusLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ');
};

const uniqueTabaqah = (items) =>
  Array.from(new Set(items.map(getTabaqah).filter(Boolean)));

function TabaqahPill({ active, label, onPress, testID }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabaqahPill, active && styles.tabaqahPillActive]}
      testID={testID}
    >
      <Text style={[styles.tabaqahPillText, active && styles.tabaqahPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const accent = STATUS_ACCENTS[status] ?? { backgroundColor: '#f3f4f6', color: '#4b5563' };
  return (
    <Text style={[styles.statusBadge, accent]}>
      {getStatusLabel(status)}
    </Text>
  );
}

function PerawiCard({ item, onOpen, t }) {
  const arabic = getPerawiArabic(item);
  const latin = getPerawiLatin(item, t('explore.perawi.fallbackTitle'));
  const tabaqah = getTabaqah(item);
  const deathYear = getDeathYear(item);
  const status = getStatus(item);

  return (
    <Pressable onPress={() => onOpen(item)} style={styles.card} testID="web-app-perawi-card">
      <View style={styles.icon}>
        <Users color="#0f766e" size={18} strokeWidth={2.1} />
      </View>
      <View style={styles.cardBody}>
        {arabic ? <Text numberOfLines={1} style={styles.arabic}>{arabic}</Text> : null}
        <Text numberOfLines={1} style={styles.latin}>{latin}</Text>
        <View style={styles.metaRow}>
          {tabaqah ? <Text style={styles.meta}>{getTabaqahLabel(tabaqah, t)}</Text> : null}
          {deathYear ? <Text style={styles.meta}>· {deathYear} H</Text> : null}
        </View>
        <StatusBadge status={status} />
      </View>
    </Pressable>
  );
}

export function WebAppPerawiRoute({
  error,
  items,
  loading,
  onLoadMore,
  onOpenItem,
  pagination,
}) {
  const { t } = useMobileLocale();
  const [search, setSearch] = useState('');
  const [tabaqah, setTabaqah] = useState('');
  const tabaqahOptions = useMemo(() => uniqueTabaqah(items), [items]);
  const filteredItems = useMemo(() => {
    const query = normalizeSearchText(search);
    return items.filter((item) => {
      const raw = getRaw(item);
      const text = [
        getPerawiArabic(item),
        getPerawiLatin(item, t('explore.perawi.fallbackTitle')),
        raw.nama_lengkap,
        getTabaqahLabel(getTabaqah(item), t),
        getStatusLabel(getStatus(item)),
        item?.body,
      ].join(' ');
      return (
        (!query || normalizeSearchText(text).includes(query)) &&
        (!tabaqah || getTabaqah(item) === tabaqah)
      );
    });
  }, [items, search, tabaqah, t]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID="explore-web-app-perawi-surface" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('explore.perawi.title')}</Text>
        {items.length ? <Text style={styles.count}>{t('explore.perawi.count', { count: items.length })}</Text> : null}
      </View>

      <View style={styles.search}>
        <TextInput
          onChangeText={setSearch}
          placeholder={t('explore.perawi.searchPlaceholder')}
          placeholderTextColor="#9ca3af"
          style={styles.input}
          testID="web-app-perawi-search"
          value={search}
        />
      </View>

      <View style={styles.tabaqahRow}>
        <TabaqahPill
          active={!tabaqah}
          label={t('explore.common.all')}
          onPress={() => setTabaqah('')}
          testID="web-app-perawi-tabaqah-all"
        />
        {tabaqahOptions.map((item) => (
          <TabaqahPill
            active={tabaqah === item}
            key={item}
            label={getTabaqahLabel(item, t)}
            onPress={() => setTabaqah(tabaqah === item ? '' : item)}
            testID={`web-app-perawi-tabaqah-${item}`}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{t('explore.common.refreshError', { subject: t('explore.perawi.fallbackTitle') })}</Text> : null}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#0f766e" size="small" />
          <Text style={styles.stateText}>{t('explore.perawi.loading')}</Text>
        </View>
      ) : null}

      {!loading && !error && filteredItems.length ? (
        <View style={styles.grid}>
          {filteredItems.map((item, index) => (
            <PerawiCard
              item={item}
              key={`${getPerawiId(item)}-${index}`}
              onOpen={onOpenItem}
              t={t}
            />
          ))}
        </View>
      ) : null}

      {!loading && !error && !filteredItems.length ? (
        <View style={styles.empty}>
          <Users color="#9ca3af" size={32} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>
            {items.length
              ? t('explore.common.notFound', { subject: t('explore.perawi.fallbackTitle') })
              : t('explore.common.notAvailable', { subject: t('explore.perawi.fallbackTitle') })}
          </Text>
          <Text style={styles.emptyText}>
            {items.length ? t('explore.common.changeSearchOrFilter') : t('explore.common.retryLater')}
          </Text>
        </View>
      ) : null}

      {pagination?.hasMore && !loading && !error ? (
        <View style={styles.loadMoreWrap}>
          <Pressable
            disabled={pagination.loadingMore}
            onPress={onLoadMore}
            style={[styles.loadMoreButton, pagination.loadingMore && styles.loadMoreButtonDisabled]}
            testID="web-app-perawi-load-more"
          >
            <Text style={styles.loadMoreText}>
              {pagination.loadingMore ? t('explore.common.loadingShort') : t('explore.common.loadMore')}
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
  search: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: '#111827',
    fontSize: 14,
    minHeight: 42,
    padding: 0,
  },
  tabaqahRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabaqahPill: {
    backgroundColor: '#f3f4f6',
    borderColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 30,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  tabaqahPillActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  tabaqahPillText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '800',
  },
  tabaqahPillTextActive: {
    color: '#ffffff',
  },
  grid: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#f3f4f6',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  arabic: {
    color: '#1f2937',
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'right',
  },
  latin: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 2,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 6,
  },
  meta: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 7,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: 'capitalize',
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
    backgroundColor: '#0f766e',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
