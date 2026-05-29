import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { requestJson } from '../api/client';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';

const ERA_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'Sahabat', label: 'Sahabat' },
  { value: "Tabi'in", label: "Tabi'in" },
  { value: "Tabi'ut Tabi'in", label: "Tabi'ut" },
  { value: 'Ulama Klasik', label: 'Ulama Klasik' },
  { value: 'Ulama Modern', label: 'Ulama Modern' },
  { value: 'Ilmuwan', label: 'Ilmuwan' },
  { value: 'Khalifah', label: 'Khalifah' },
];

const getTokohTitle = (tokoh) =>
  tokoh?.translation?.title_idn ??
  tokoh?.translation?.title_en ??
  tokoh?.nama ??
  tokoh?.name ??
  'Tokoh';

const getTokohInitial = (tokoh) => getTokohTitle(tokoh).charAt(0).toUpperCase();

const getTokohMeta = (tokoh) => tokoh?.era || tokoh?.kategori || '';

const getTokohYears = (tokoh) => {
  if (!tokoh?.tahun_lahir && !tokoh?.tahun_wafat) return '';
  return `${tokoh.tahun_lahir || '?'} - ${tokoh.tahun_wafat || '...'}`;
};

const getTokohBio = (tokoh) =>
  tokoh?.biografi ??
  tokoh?.translation?.description_idn ??
  tokoh?.translation?.description_en ??
  '';

const getTokohContribution = (tokoh) =>
  tokoh?.kontribusi ??
  tokoh?.translation?.idn ??
  tokoh?.translation?.en ??
  '';

const WEB_APP_TOKOH_THEMES = {
  light: {
    accent: '#4f46e5',
    accentSoft: '#e0e7ff',
    bg: '#f8fafc',
    border: '#e5e7eb',
    chipText: '#64748b',
    modalHighlight: '#eef2ff',
    muted: '#64748b',
    note: '#94a3b8',
    surface: '#ffffff',
    text: '#111827',
  },
  dark: {
    accent: '#818cf8',
    accentSoft: '#312e81',
    bg: '#020617',
    border: '#334155',
    chipText: '#cbd5e1',
    modalHighlight: '#1e1b4b',
    muted: '#94a3b8',
    note: '#64748b',
    surface: '#111827',
    text: '#f8fafc',
  },
};

export function TokohTarikhContent() {
  const { isDarkTheme = false, isWebAppLayout } = useLayoutModePreference();
  const webAppTheme = isDarkTheme ? WEB_APP_TOKOH_THEMES.dark : WEB_APP_TOKOH_THEMES.light;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [era, setEra] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchTokoh = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: '1', size: '100' };
      if (search) params.q = search;
      if (era) params.era = era;
      const qs = new URLSearchParams(params).toString();
      const data = await requestJson(`/api/v1/tokoh-tarikh?${qs}`);
      setItems(data?.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, era]);

  useEffect(() => {
    fetchTokoh();
  }, [fetchTokoh]);

  const renderSearch = () => (
    <TextInput
      onChangeText={setSearch}
      placeholder="Cari tokoh..."
      placeholderTextColor={isWebAppLayout ? webAppTheme.muted : colors.muted}
      returnKeyType="search"
      style={[
        styles.searchInput,
        isWebAppLayout && styles.webAppSearchInput,
        isWebAppLayout && {
          backgroundColor: webAppTheme.surface,
          borderColor: webAppTheme.border,
          color: webAppTheme.text,
        },
      ]}
      testID={isWebAppLayout ? 'tokoh-web-app-search' : undefined}
      value={search}
    />
  );

  const renderFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
      {ERA_FILTERS.map((f) => (
        <Pressable
          key={f.value}
          onPress={() => setEra(f.value === era ? '' : f.value)}
          style={[
            styles.chip,
            isWebAppLayout && styles.webAppChip,
            isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
            era === f.value && styles.chipActive,
            isWebAppLayout && era === f.value && styles.webAppChipActive,
            isWebAppLayout && era === f.value && { backgroundColor: webAppTheme.accent, borderColor: webAppTheme.accent },
          ]}
        >
          <Text style={[
            styles.chipText,
            isWebAppLayout && { color: webAppTheme.chipText },
            era === f.value && styles.chipTextActive,
          ]}>
            {f.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderLoading = () => (
    <View style={[
      styles.loadingContainer,
      isWebAppLayout && styles.webAppLoadingContainer,
      isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
    ]}>
      <ActivityIndicator size="large" color={isWebAppLayout ? webAppTheme.accent : colors.primary} />
      {isWebAppLayout ? <Text style={[styles.webAppLoadingText, { color: webAppTheme.muted }]}>Memuat tokoh...</Text> : null}
    </View>
  );

  const renderEmpty = () => (
    <View style={[
      isWebAppLayout ? styles.webAppEmpty : null,
      isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
    ]}>
      <Text style={[styles.empty, isWebAppLayout && styles.webAppEmptyText, isWebAppLayout && { color: webAppTheme.note }]}>
        {isWebAppLayout ? 'Belum ada data tokoh.' : 'Tidak ditemukan'}
      </Text>
    </View>
  );

  const renderTokohCard = (tokoh) => {
    const title = getTokohTitle(tokoh);
    const meta = getTokohMeta(tokoh);
    const years = getTokohYears(tokoh);
    const cardStyle = isWebAppLayout
      ? [styles.webAppCard, { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border }]
      : styles.card;
    const avatarStyle = isWebAppLayout
      ? [styles.webAppCardAvatar, { backgroundColor: webAppTheme.accentSoft }]
      : styles.cardAvatar;

    return (
      <Pressable
        key={tokoh.id ?? title}
        android_ripple={{ color: 'rgba(79, 70, 229, 0.12)', borderless: false }}
        onPress={() => setSelected(tokoh)}
        style={cardStyle}
        testID={isWebAppLayout ? 'tokoh-web-app-card' : undefined}
      >
        <View style={avatarStyle}>
          {tokoh.image_url ? (
            <Image source={{ uri: tokoh.image_url }} style={styles.avatarImage} />
          ) : (
            <Text style={[
              styles.avatarFallback,
              isWebAppLayout && styles.webAppAvatarFallback,
              isWebAppLayout && { backgroundColor: webAppTheme.accentSoft, color: webAppTheme.accent },
            ]}>
              {getTokohInitial(tokoh)}
            </Text>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardName, isWebAppLayout && styles.webAppCardName, isWebAppLayout && { color: webAppTheme.text }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.cardMetaRow}>
            {meta ? <Text style={[
              styles.cardEra,
              isWebAppLayout && styles.webAppCardEra,
              isWebAppLayout && { backgroundColor: webAppTheme.accentSoft, color: webAppTheme.accent },
            ]}>{meta}</Text> : null}
            {years ? <Text style={[styles.cardTahun, isWebAppLayout && styles.webAppCardTahun, isWebAppLayout && { color: webAppTheme.muted }]}>{years}</Text> : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderContent = () => (
    <>
      {loading ? (
        renderLoading()
      ) : items.length === 0 ? (
        renderEmpty()
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.resultCount, isWebAppLayout && styles.webAppResultCount, isWebAppLayout && { color: webAppTheme.muted }]}>
            {items.length} tokoh
          </Text>
          <View style={isWebAppLayout ? styles.webAppCardGrid : null}>
            {items.map(renderTokohCard)}
          </View>
        </ScrollView>
      )}
    </>
  );

  const renderDetailModal = () => {
    const title = getTokohTitle(selected);
    const meta = getTokohMeta(selected);
    const years = getTokohYears(selected);
    const bio = getTokohBio(selected);
    const contribution = getTokohContribution(selected);

    return (
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable
            style={[
              styles.modalContent,
              isWebAppLayout && { backgroundColor: webAppTheme.surface },
            ]}
            onPress={() => {}}
          >
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Pressable style={styles.modalClose} onPress={() => setSelected(null)}>
                  <Text style={[styles.modalCloseText, isWebAppLayout && { color: webAppTheme.accent }]}>Tutup</Text>
                </Pressable>

                <View style={styles.modalAvatarWrap}>
                  {selected.image_url ? (
                    <Image source={{ uri: selected.image_url }} style={styles.modalAvatar} />
                  ) : (
                    <View style={[styles.modalAvatarFallback, isWebAppLayout && { backgroundColor: webAppTheme.accentSoft }]}>
                      <Text style={[styles.modalAvatarFallbackText, isWebAppLayout && { color: webAppTheme.accent }]}>
                        {getTokohInitial(selected)}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.modalName, isWebAppLayout && { color: webAppTheme.text }]}>
                  {title}
                </Text>

                <View style={styles.modalBadgeRow}>
                  {meta ? <Text style={[
                    styles.modalBadge,
                    isWebAppLayout && { backgroundColor: webAppTheme.accentSoft, color: webAppTheme.accent },
                  ]}>{meta}</Text> : null}
                  {selected.kategori && selected.kategori !== meta ? (
                    <Text style={[styles.modalBadge, styles.modalBadgeKategori]}>
                      {selected.kategori}
                    </Text>
                  ) : null}
                </View>

                {years ? <Text style={[styles.modalTahun, isWebAppLayout && { color: webAppTheme.muted }]}>{years}</Text> : null}

                {bio ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, isWebAppLayout && { color: webAppTheme.text }]}>Biografi</Text>
                    <Text style={[styles.modalBody, isWebAppLayout && { color: webAppTheme.muted }]}>{bio}</Text>
                  </View>
                ) : null}

                {contribution ? (
                  <View style={[
                    styles.modalSection,
                    styles.modalSectionHighlight,
                    isWebAppLayout && { backgroundColor: webAppTheme.modalHighlight },
                  ]}>
                    <Text style={[styles.modalSectionTitle, isWebAppLayout && { color: webAppTheme.accent }]}>Kontribusi</Text>
                    <Text style={[styles.modalBody, isWebAppLayout && { color: webAppTheme.muted }]}>{contribution}</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  if (isWebAppLayout) {
    return (
      <View style={[styles.webAppRoot, { backgroundColor: webAppTheme.bg }]} testID="tokoh-web-app-surface">
        <View style={styles.webAppHeader}>
          <View style={[styles.webAppIcon, { backgroundColor: webAppTheme.accentSoft }]}>
            <Text style={[styles.webAppIconText, { color: webAppTheme.accent }]}>T</Text>
          </View>
          <Text style={[styles.webAppTitle, { color: webAppTheme.text }]}>Tokoh Tarikh</Text>
          <Text style={[styles.webAppSubtitle, { color: webAppTheme.muted }]}>Biografi ulama, ilmuwan, dan tokoh Islam</Text>
        </View>
        <View style={styles.webAppControls}>
          {renderSearch()}
          {renderFilters()}
        </View>
        {renderContent()}
        {renderDetailModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSearch()}
      {renderFilters()}
      {renderContent()}
      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    marginBottom: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  chip: {
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    height: 300,
    justifyContent: 'center',
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    paddingVertical: spacing.xxl,
    textAlign: 'center',
  },
  resultCount: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardAvatar: {
    borderRadius: 28,
    height: 56,
    marginRight: spacing.md,
    overflow: 'hidden',
    width: 56,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    color: colors.onPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 56,
    textAlign: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  cardEra: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    color: '#166534',
    fontSize: 10,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardTahun: {
    color: colors.muted,
    fontSize: 11,
  },
  // Modal
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    padding: spacing.lg,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  modalCloseText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalAvatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalAvatar: {
    borderRadius: 48,
    height: 96,
    width: 96,
  },
  modalAvatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  modalAvatarFallbackText: {
    color: colors.onPrimary,
    fontSize: 36,
    fontWeight: '700',
  },
  modalName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  modalBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    color: '#166534',
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalBadgeKategori: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  modalTahun: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  modalSection: {
    marginTop: spacing.lg,
  },
  modalSectionHighlight: {
    backgroundColor: '#fefce8',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  modalSectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  modalBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  webAppRoot: {
    backgroundColor: '#f8fafc',
    flex: 1,
    gap: spacing.md,
  },
  webAppHeader: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  webAppIcon: {
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 56,
  },
  webAppIconText: {
    color: '#4f46e5',
    fontSize: 26,
    fontWeight: '900',
  },
  webAppTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  webAppSubtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 4,
    textAlign: 'center',
  },
  webAppControls: {
    gap: spacing.xs,
  },
  webAppSearchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    color: '#111827',
  },
  webAppChip: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  webAppChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  webAppLoadingContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
  },
  webAppLoadingText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  webAppEmpty: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
  },
  webAppEmptyText: {
    color: '#94a3b8',
  },
  webAppResultCount: {
    color: '#64748b',
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  webAppCardGrid: {
    gap: spacing.sm,
  },
  webAppCard: {
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md,
  },
  webAppCardAvatar: {
    borderRadius: 12,
    height: 48,
    marginRight: spacing.md,
    overflow: 'hidden',
    width: 48,
  },
  webAppAvatarFallback: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    color: '#4f46e5',
    fontSize: 20,
    lineHeight: 48,
  },
  webAppCardName: {
    color: '#111827',
  },
  webAppCardEra: {
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
  },
  webAppCardTahun: {
    color: '#94a3b8',
  },
});

export default TokohTarikhContent;
