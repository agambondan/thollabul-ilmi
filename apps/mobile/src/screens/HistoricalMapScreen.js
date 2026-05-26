import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { requestJson } from '../api/client';
import { HistoricalMapView } from './HistoricalMapView';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';

const CATEGORIES = [
  { value: '', label: 'Semua' },
  { value: 'kota', label: 'Kota' },
  { value: 'masjid', label: 'Masjid' },
  { value: 'situs', label: 'Situs' },
  { value: 'universitas', label: 'Universitas' },
];

const ERAS = [
  { value: '', label: 'Semua Masa' },
  { value: 'pra-islam', label: 'Pra-Islam' },
  { value: 'khulafa', label: 'Khulafa & Sahabat' },
  { value: 'umayyah', label: 'Umayyah' },
  { value: 'abbasiyah', label: 'Abbasiyah' },
  { value: 'fatimiyah', label: 'Fatimiyah' },
  { value: 'andallus', label: 'Andalusia' },
  { value: 'utsmaniyah', label: 'Utsmaniyah' },
  { value: 'klasik', label: 'Klasik' },
];

const getLocationName = (loc) => String(loc?.name ?? loc?.title ?? 'Lokasi');
const getLocationDescription = (loc) => String(loc?.description ?? loc?.summary ?? '');

export function HistoricalMapContent() {
  const { isWebAppLayout } = useLayoutModePreference();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [category, setCategory] = useState('');
  const [era, setEra] = useState('');

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category) params.set('category', category);
      if (era) params.set('era', era);
      params.set('size', '100');

      const qs = params.toString();

      const data = await requestJson(`/api/v1/locations${qs ? `?${qs}` : ''}`);
      setLocations(data?.items ?? []);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, era]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const filtered = search.trim()
    ? locations.filter(
        (loc) =>
          getLocationName(loc).toLowerCase().includes(search.toLowerCase()) ||
          getLocationDescription(loc).toLowerCase().includes(search.toLowerCase()),
      )
    : locations;

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <Pressable
        onPress={() => setViewMode('map')}
        style={[
          styles.toggleBtn,
          isWebAppLayout && styles.webAppToggleBtn,
          viewMode === 'map' && styles.toggleBtnActive,
          isWebAppLayout && viewMode === 'map' && styles.webAppToggleBtnActive,
        ]}
      >
        <Text
          style={[
            styles.toggleBtnText,
            isWebAppLayout && styles.webAppToggleBtnText,
            viewMode === 'map' && styles.toggleBtnTextActive,
          ]}
        >
          Peta
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setViewMode('list')}
        style={[
          styles.toggleBtn,
          isWebAppLayout && styles.webAppToggleBtn,
          viewMode === 'list' && styles.toggleBtnActive,
          isWebAppLayout && viewMode === 'list' && styles.webAppToggleBtnActive,
        ]}
      >
        <Text
          style={[
            styles.toggleBtnText,
            isWebAppLayout && styles.webAppToggleBtnText,
            viewMode === 'list' && styles.toggleBtnTextActive,
          ]}
        >
          Jelajahi
        </Text>
      </Pressable>
    </View>
  );

  const renderFilters = () => (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        {CATEGORIES.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setCategory(item.value === category ? '' : item.value)}
            style={[
              styles.chip,
              isWebAppLayout && styles.webAppChip,
              category === item.value && styles.chipActive,
              isWebAppLayout && category === item.value && styles.webAppChipActive,
            ]}
          >
            <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        {ERAS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setEra(item.value === era ? '' : item.value)}
            style={[
              styles.chip,
              styles.chipEra,
              isWebAppLayout && styles.webAppChip,
              era === item.value && styles.chipEraActive,
              isWebAppLayout && era === item.value && styles.webAppChipActive,
            ]}
          >
            <Text style={[styles.chipText, era === item.value && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );

  const renderSearch = () => (
    <TextInput
      onChangeText={setSearch}
      placeholder="Cari lokasi..."
      placeholderTextColor={isWebAppLayout ? '#94a3b8' : colors.muted}
      returnKeyType="search"
      style={[styles.searchInput, isWebAppLayout && styles.webAppSearchInput]}
      value={search}
    />
  );

  const renderList = () => (
    <View>
      {!isWebAppLayout ? renderSearch() : null}
      <Text style={[styles.resultCount, isWebAppLayout && styles.webAppResultCount]}>
        {filtered.length} lokasi ditemukan
      </Text>
      {filtered.map((loc) => (
        <Pressable
          key={loc.id || getLocationName(loc)}
          android_ripple={{ color: 'rgba(16, 185, 129, 0.12)', borderless: false }}
          onPress={() => setViewMode('map')}
          style={[styles.locationRow, isWebAppLayout && styles.webAppLocationRow]}
        >
          <View style={styles.locationCopy}>
            <Text style={[styles.locationName, isWebAppLayout && styles.webAppLocationName]}>
              {getLocationName(loc)}
            </Text>
            <Text
              style={[styles.locationDesc, isWebAppLayout && styles.webAppLocationDesc]}
              numberOfLines={2}
            >
              {getLocationDescription(loc)}
            </Text>
            <View style={styles.rowTags}>
              {loc.category ? <Text style={styles.rowTag}>{loc.category}</Text> : null}
              {loc.era ? <Text style={[styles.rowTag, styles.rowTagEra]}>{loc.era}</Text> : null}
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderBody = () => (
    <>
      {loading ? (
        <View style={[styles.loadingContainer, isWebAppLayout && styles.webAppLoadingContainer]}>
          <ActivityIndicator size="large" color={isWebAppLayout ? '#10b981' : colors.primary} />
          {isWebAppLayout ? <Text style={styles.webAppLoadingText}>Memuat lokasi...</Text> : null}
        </View>
      ) : viewMode === 'map' ? (
        <HistoricalMapView locations={locations} isWebAppLayout={isWebAppLayout} />
      ) : (
        renderList()
      )}
    </>
  );

  if (isWebAppLayout) {
    return (
      <View style={styles.webAppRoot} testID="historical-map-web-app-surface">
        <View style={styles.webAppHeader}>
          <View style={styles.webAppIcon}>
            <Text style={styles.webAppIconText}>م</Text>
          </View>
          <Text style={styles.webAppTitle}>Peta Islam Interaktif</Text>
          <Text style={styles.webAppSubtitle}>Lokasi bersejarah dalam peradaban Islam</Text>
        </View>
        <View style={styles.webAppControls}>
          {renderSearch()}
          <View style={styles.webAppMetaRow}>
            <Text style={styles.webAppMetaText}>
              {loading ? 'Memuat...' : `${locations.length} lokasi`}
            </Text>
            {renderViewToggle()}
          </View>
          {renderFilters()}
        </View>
        {renderBody()}
      </View>
    );
  }

  return (
    <>
      {renderViewToggle()}
      {renderFilters()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : viewMode === 'map' ? (
        <HistoricalMapView locations={locations} />
      ) : (
        renderList()
      )}
    </>
  );
}

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  toggleBtn: {
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#fff',
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  chip: {
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipEra: {
    borderColor: '#93c5fd',
  },
  chipEraActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
    height: 400,
    justifyContent: 'center',
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
  resultCount: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  locationRow: {
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  locationCopy: {
    flex: 1,
  },
  locationName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  locationDesc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  rowTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  rowTag: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    color: '#166534',
    fontSize: 10,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rowTagEra: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  webAppRoot: {
    backgroundColor: '#f8fafc',
    gap: spacing.md,
  },
  webAppHeader: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  webAppIcon: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 56,
  },
  webAppIconText: {
    color: '#059669',
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
  webAppMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  webAppMetaText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  webAppToggleBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  webAppToggleBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  webAppToggleBtnText: {
    color: '#475569',
  },
  webAppChip: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  webAppChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  webAppSearchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 12,
    color: '#111827',
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
  webAppResultCount: {
    color: '#64748b',
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  webAppLocationRow: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  webAppLocationName: {
    color: '#111827',
  },
  webAppLocationDesc: {
    color: '#64748b',
  },
});

export default HistoricalMapContent;
