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

export function TokohTarikhContent() {
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

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        onChangeText={setSearch}
        placeholder="Cari tokoh..."
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.searchInput}
        value={search}
      />

      {/* Era filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {ERA_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setEra(f.value === era ? '' : f.value)}
            style={[styles.chip, era === f.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, era === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>Tidak ditemukan</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.resultCount}>{items.length} tokoh</Text>
          {items.map((tokoh) => (
            <Pressable
              key={tokoh.id}
              android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
              onPress={() => setSelected(tokoh)}
              style={styles.card}
            >
              <View style={styles.cardAvatar}>
                {tokoh.image_url ? (
                  <Image source={{ uri: tokoh.image_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarFallback}>
                    {tokoh.nama?.charAt(0) ?? '?'}
                  </Text>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {tokoh.translation?.title_idn ?? tokoh.translation?.title_en ?? tokoh.nama}
                </Text>
                <View style={styles.cardMetaRow}>
                  {(tokoh.era || tokoh.kategori) && (
                    <Text style={styles.cardEra}>{tokoh.era || tokoh.kategori}</Text>
                  )}
                  {tokoh.tahun_lahir && tokoh.tahun_wafat && (
                    <Text style={styles.cardTahun}>
                      {tokoh.tahun_lahir} – {tokoh.tahun_wafat}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Close button */}
                <Pressable style={styles.modalClose} onPress={() => setSelected(null)}>
                  <Text style={styles.modalCloseText}>Tutup</Text>
                </Pressable>

                {/* Avatar */}
                <View style={styles.modalAvatarWrap}>
                  {selected.image_url ? (
                    <Image source={{ uri: selected.image_url }} style={styles.modalAvatar} />
                  ) : (
                    <View style={styles.modalAvatarFallback}>
                      <Text style={styles.modalAvatarFallbackText}>
                        {selected.nama?.charAt(0) ?? '?'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Name */}
                <Text style={styles.modalName}>
                  {selected.translation?.title_idn ?? selected.translation?.title_en ?? selected.nama}
                </Text>

                {/* Era + Kategori badges */}
                <View style={styles.modalBadgeRow}>
                  {selected.era && <Text style={styles.modalBadge}>{selected.era}</Text>}
                  {selected.kategori && (
                    <Text style={[styles.modalBadge, styles.modalBadgeKategori]}>
                      {selected.kategori}
                    </Text>
                  )}
                </View>

                {/* Tahun */}
                {selected.tahun_lahir && selected.tahun_wafat && (
                  <Text style={styles.modalTahun}>
                    {selected.tahun_lahir} – {selected.tahun_wafat}
                  </Text>
                )}

                {/* Biografi */}
                {(selected.translation?.description_idn || selected.translation?.description_en) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Biografi</Text>
                    <Text style={styles.modalBody}>
                      {selected.translation.description_idn ?? selected.translation.description_en}
                    </Text>
                  </View>
                )}

                {/* Kontribusi */}
                {(selected.kontribusi || selected.translation?.en || selected.translation?.idn) && (
                  <View style={[styles.modalSection, styles.modalSectionHighlight]}>
                    <Text style={styles.modalSectionTitle}>Kontribusi</Text>
                    <Text style={styles.modalBody}>
                      {selected.kontribusi || selected.translation?.idn || selected.translation?.en}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
});

export default TokohTarikhContent;
