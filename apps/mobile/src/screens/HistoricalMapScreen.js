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
import { useMobileLocale } from '../i18n/MobileLocaleProvider';

const CATEGORIES = [
  { value: '', labelKey: 'historicalMap.category.all' },
  { value: 'kota', labelKey: 'historicalMap.category.city' },
  { value: 'masjid', labelKey: 'historicalMap.category.mosque' },
  { value: 'situs', labelKey: 'historicalMap.category.site' },
  { value: 'universitas', labelKey: 'historicalMap.category.university' },
];

const ERAS = [
  { value: '', labelKey: 'historicalMap.era.all' },
  { value: 'pra-islam', labelKey: 'historicalMap.era.preIslam' },
  { value: 'khulafa', labelKey: 'historicalMap.era.khulafa' },
  { value: 'umayyah', labelKey: 'historicalMap.era.umayyah' },
  { value: 'abbasiyah', labelKey: 'historicalMap.era.abbasiyah' },
  { value: 'fatimiyah', labelKey: 'historicalMap.era.fatimiyah' },
  { value: 'andallus', labelKey: 'historicalMap.era.andalusia' },
  { value: 'utsmaniyah', labelKey: 'historicalMap.era.ottoman' },
  { value: 'klasik', labelKey: 'historicalMap.era.classic' },
];

const getLocationName = (loc, fallback = 'Lokasi') => String(loc?.name ?? loc?.title ?? fallback);
const getLocationDescription = (loc) => String(loc?.description ?? loc?.summary ?? '');

const WEB_APP_HISTORICAL_MAP_THEMES = {
  light: {
    accent: '#10b981',
    accentSoft: '#d1fae5',
    accentText: '#059669',
    bg: '#f8fafc',
    border: '#e5e7eb',
    inputBorder: '#d1d5db',
    infoSoft: '#dbeafe',
    infoText: '#1e40af',
    muted: '#64748b',
    surface: '#ffffff',
    text: '#111827',
    tile: '#ffffff',
    title: '#111827',
  },
  dark: {
    accent: '#34d399',
    accentSoft: '#064e3b',
    accentText: '#a7f3d0',
    bg: '#020617',
    border: '#243044',
    inputBorder: '#334155',
    infoSoft: '#1e3a8a',
    infoText: '#bfdbfe',
    mapStyle: [
      { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    ],
    muted: '#94a3b8',
    surface: '#111827',
    text: '#e5e7eb',
    tile: '#1e293b',
    title: '#f8fafc',
  },
};

export function HistoricalMapContent() {
  const { isDarkTheme = false, isWebAppLayout } = useLayoutModePreference();
  const { t } = useMobileLocale();
  const webAppTheme = isDarkTheme ? WEB_APP_HISTORICAL_MAP_THEMES.dark : WEB_APP_HISTORICAL_MAP_THEMES.light;
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [category, setCategory] = useState('');
  const [era, setEra] = useState('');
  const locationFallback = t('historicalMap.locationFallback');
  const categories = CATEGORIES.map((item) => ({ ...item, label: t(item.labelKey) }));
  const eras = ERAS.map((item) => ({ ...item, label: t(item.labelKey) }));

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
          getLocationName(loc, locationFallback).toLowerCase().includes(search.toLowerCase()) ||
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
          isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
          viewMode === 'map' && styles.toggleBtnActive,
          isWebAppLayout && viewMode === 'map' && styles.webAppToggleBtnActive,
          isWebAppLayout && viewMode === 'map' && { backgroundColor: webAppTheme.accent, borderColor: webAppTheme.accent },
        ]}
      >
        <Text
          style={[
            styles.toggleBtnText,
            isWebAppLayout && styles.webAppToggleBtnText,
            isWebAppLayout && { color: webAppTheme.muted },
            viewMode === 'map' && styles.toggleBtnTextActive,
            isWebAppLayout && viewMode === 'map' && { color: '#ffffff' },
          ]}
        >
          {t('historicalMap.view.map')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setViewMode('list')}
        style={[
          styles.toggleBtn,
          isWebAppLayout && styles.webAppToggleBtn,
          isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
          viewMode === 'list' && styles.toggleBtnActive,
          isWebAppLayout && viewMode === 'list' && styles.webAppToggleBtnActive,
          isWebAppLayout && viewMode === 'list' && { backgroundColor: webAppTheme.accent, borderColor: webAppTheme.accent },
        ]}
      >
        <Text
          style={[
            styles.toggleBtnText,
            isWebAppLayout && styles.webAppToggleBtnText,
            isWebAppLayout && { color: webAppTheme.muted },
            viewMode === 'list' && styles.toggleBtnTextActive,
            isWebAppLayout && viewMode === 'list' && { color: '#ffffff' },
          ]}
        >
          {t('historicalMap.view.list')}
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
        {categories.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setCategory(item.value === category ? '' : item.value)}
            style={[
              styles.chip,
              isWebAppLayout && styles.webAppChip,
              isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
              category === item.value && styles.chipActive,
              isWebAppLayout && category === item.value && styles.webAppChipActive,
              isWebAppLayout && category === item.value && { backgroundColor: webAppTheme.accent, borderColor: webAppTheme.accent },
            ]}
          >
            <Text style={[styles.chipText, isWebAppLayout && { color: webAppTheme.muted }, category === item.value && styles.chipTextActive]}>
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
        {eras.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setEra(item.value === era ? '' : item.value)}
            style={[
              styles.chip,
              styles.chipEra,
              isWebAppLayout && styles.webAppChip,
              isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
              era === item.value && styles.chipEraActive,
              isWebAppLayout && era === item.value && styles.webAppChipActive,
              isWebAppLayout && era === item.value && { backgroundColor: webAppTheme.accent, borderColor: webAppTheme.accent },
            ]}
          >
            <Text style={[styles.chipText, isWebAppLayout && { color: webAppTheme.muted }, era === item.value && styles.chipTextActive]}>
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
      placeholder={t('historicalMap.searchPlaceholder')}
      placeholderTextColor={isWebAppLayout ? webAppTheme.muted : colors.muted}
      returnKeyType="search"
      style={[
        styles.searchInput,
        isWebAppLayout && styles.webAppSearchInput,
        isWebAppLayout && {
          backgroundColor: webAppTheme.surface,
          borderColor: webAppTheme.inputBorder,
          color: webAppTheme.text,
        },
      ]}
      testID={isWebAppLayout ? 'historical-map-web-app-search' : undefined}
      value={search}
    />
  );

  const renderList = () => (
    <View>
      {!isWebAppLayout ? renderSearch() : null}
      <Text style={[styles.resultCount, isWebAppLayout && styles.webAppResultCount, isWebAppLayout && { color: webAppTheme.muted }]}>
        {t('historicalMap.resultCount', { count: filtered.length })}
      </Text>
      {filtered.map((loc) => (
        <Pressable
          key={loc.id || getLocationName(loc, locationFallback)}
          android_ripple={{ color: 'rgba(16, 185, 129, 0.12)', borderless: false }}
          onPress={() => setViewMode('map')}
          style={[
            styles.locationRow,
            isWebAppLayout && styles.webAppLocationRow,
            isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
          ]}
        >
          <View style={styles.locationCopy}>
            <Text style={[styles.locationName, isWebAppLayout && styles.webAppLocationName, isWebAppLayout && { color: webAppTheme.text }]}>
              {getLocationName(loc, locationFallback)}
            </Text>
            <Text
              style={[styles.locationDesc, isWebAppLayout && styles.webAppLocationDesc, isWebAppLayout && { color: webAppTheme.muted }]}
              numberOfLines={2}
            >
              {getLocationDescription(loc)}
            </Text>
            <View style={styles.rowTags}>
              {loc.category ? <Text style={[styles.rowTag, isWebAppLayout && { backgroundColor: webAppTheme.accentSoft, color: webAppTheme.accentText }]}>{loc.category}</Text> : null}
              {loc.era ? <Text style={[styles.rowTag, styles.rowTagEra, isWebAppLayout && { backgroundColor: webAppTheme.infoSoft, color: webAppTheme.infoText }]}>{loc.era}</Text> : null}
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderBody = () => (
    <>
      {loading ? (
        <View
          style={[
            styles.loadingContainer,
            isWebAppLayout && styles.webAppLoadingContainer,
            isWebAppLayout && { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border },
          ]}
        >
          <ActivityIndicator size="large" color={isWebAppLayout ? webAppTheme.accent : colors.primary} />
          {isWebAppLayout ? <Text style={[styles.webAppLoadingText, { color: webAppTheme.muted }]}>{t('historicalMap.loadingLocations')}</Text> : null}
        </View>
      ) : viewMode === 'map' ? (
        <HistoricalMapView locations={locations} isWebAppLayout={isWebAppLayout} webAppTheme={webAppTheme} />
      ) : (
        renderList()
      )}
    </>
  );

  if (isWebAppLayout) {
    return (
      <View style={[styles.webAppRoot, { backgroundColor: webAppTheme.bg }]} testID="historical-map-web-app-surface">
        <View style={styles.webAppHeader}>
          <View style={[styles.webAppIcon, { backgroundColor: webAppTheme.accentSoft }]}>
            <Text style={[styles.webAppIconText, { color: webAppTheme.accentText }]}>م</Text>
          </View>
          <Text style={[styles.webAppTitle, { color: webAppTheme.title }]}>{t('historicalMap.title')}</Text>
          <Text style={[styles.webAppSubtitle, { color: webAppTheme.muted }]}>{t('historicalMap.subtitle')}</Text>
        </View>
        <View style={styles.webAppControls}>
          {renderSearch()}
          <View style={styles.webAppMetaRow}>
            <Text style={[styles.webAppMetaText, { color: webAppTheme.muted }]}>
              {loading ? t('historicalMap.loadingShort') : t('historicalMap.locationsCount', { count: locations.length })}
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
