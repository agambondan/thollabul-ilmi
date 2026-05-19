import { useCallback, useEffect, useState } from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
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

const CATEGORIES = [
  { value: '', label: 'Semua' },
  { value: 'kota', label: 'Kota' },
  { value: 'masjid', label: 'Masjid' },
  { value: 'situs', label: 'Situs' },
];

const ERAS = [
  { value: '', label: 'Semua Masa' },
  { value: 'pra-islam', label: 'Pra-Islam' },
  { value: 'khulafa', label: 'Khulafa' },
  { value: 'umayyah', label: 'Umayyah' },
  { value: 'abbasiyah', label: 'Abbasiyah' },
  { value: 'andallus', label: 'Andalusia' },
  { value: 'utsmaniyah', label: 'Utsmaniyah' },
  { value: 'klasik', label: 'Klasik' },
];

export function HistoricalMapContent() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [category, setCategory] = useState('');
  const [era, setEra] = useState('');

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (category) params.category = category;
      if (era) params.era = era;
      params.size = 100;

      const qs = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

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
          loc.name.toLowerCase().includes(search.toLowerCase()) ||
          loc.description.toLowerCase().includes(search.toLowerCase()),
      )
    : locations;

  return (
    <>
      <View style={styles.viewToggle}>
        <Pressable
          onPress={() => setViewMode('map')}
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'map' && styles.toggleBtnTextActive]}>
            Peta
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('list')}
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>
            Jelajahi
          </Text>
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.value}
            onPress={() => setCategory(c.value === category ? '' : c.value)}
            style={[
              styles.chip,
              category === c.value && styles.chipActive,
            ]}
          >
            <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
              {c.label}
            </Text>
          </Pressable>
        ))}
        {ERAS.slice(0, 4).map((e) => (
          <Pressable
            key={e.value}
            onPress={() => setEra(e.value === era ? '' : e.value)}
            style={[styles.chip, styles.chipEra, era === e.value && styles.chipEraActive]}
          >
            <Text style={[styles.chipText, era === e.value && styles.chipTextActive]}>
              {e.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            initialRegion={{
              latitude: 28,
              longitude: 35,
              latitudeDelta: 45,
              longitudeDelta: 45,
            }}
            style={styles.map}
          >
            {locations.map((loc) => (
              <Marker
                key={loc.id || loc.name}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                onPress={() => setActiveLocation(loc.name)}
                title={loc.name}
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{loc.name}</Text>
                    <Text style={styles.calloutDesc} numberOfLines={3}>
                      {loc.description}
                    </Text>
                    {(loc.category || loc.era) && (
                      <View style={styles.calloutTags}>
                        {loc.category && (
                          <Text style={styles.calloutTag}>{loc.category}</Text>
                        )}
                        {loc.era && (
                          <Text style={[styles.calloutTag, styles.calloutTagEra]}>{loc.era}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      ) : (
        <View>
          <TextInput
            onChangeText={setSearch}
            placeholder="Cari lokasi..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
          <Text style={styles.resultCount}>{locations.length} lokasi ditemukan</Text>
          {filtered.map((loc) => (
            <Pressable
              key={loc.id || loc.name}
              android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
              onPress={() => setViewMode('map')}
              style={styles.locationRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.locationName}>{loc.name}</Text>
                <Text style={styles.locationDesc} numberOfLines={2}>
                  {loc.description}
                </Text>
                <View style={styles.rowTags}>
                  {loc.category && <Text style={styles.rowTag}>{loc.category}</Text>}
                  {loc.era && <Text style={[styles.rowTag, styles.rowTagEra]}>{loc.era}</Text>}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: radius.md,
    height: 400,
    overflow: 'hidden',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  callout: {
    maxWidth: 240,
    padding: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  calloutDesc: {
    color: '#555',
    fontSize: 12,
    lineHeight: 16,
  },
  calloutTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  calloutTag: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    color: '#166534',
    fontSize: 10,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  calloutTagEra: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
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
});

export default HistoricalMapContent;
