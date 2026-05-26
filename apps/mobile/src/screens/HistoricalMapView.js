import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function HistoricalMapView({ locations = [], isWebAppLayout = false }) {
  return (
    <View
      style={[styles.container, isWebAppLayout && styles.webAppContainer]}
      testID="historical-map-web-fallback"
    >
      <Text style={[styles.title, isWebAppLayout && styles.webAppTitle]}>
        Peta tersedia di aplikasi native
      </Text>
      <Text style={[styles.subtitle, isWebAppLayout && styles.webAppSubtitle]}>
        Expo web menampilkan daftar lokasi agar fitur tarikh tetap bisa dibuka dari browser.
      </Text>
      <ScrollView contentContainerStyle={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {locations.slice(0, 8).map((loc) => (
          <View key={loc.id || loc.name} style={[styles.locationCard, isWebAppLayout && styles.webAppLocationCard]}>
            <Text style={[styles.locationName, isWebAppLayout && styles.webAppLocationName]}>
              {loc.name}
            </Text>
            <Text numberOfLines={2} style={[styles.locationDesc, isWebAppLayout && styles.webAppLocationDesc]}>
              {loc.description}
            </Text>
            {(loc.category || loc.era) && (
              <View style={styles.tags}>
                {loc.category ? <Text style={styles.tag}>{loc.category}</Text> : null}
                {loc.era ? <Text style={[styles.tag, styles.tagEra]}>{loc.era}</Text> : null}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 360,
    padding: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  list: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
  },
  locationName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  locationDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagEra: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  webAppContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    minHeight: 500,
  },
  webAppTitle: {
    color: '#111827',
  },
  webAppSubtitle: {
    color: '#64748b',
    fontWeight: '600',
  },
  webAppLocationCard: {
    borderColor: '#e5e7eb',
  },
  webAppLocationName: {
    color: '#111827',
  },
  webAppLocationDesc: {
    color: '#64748b',
  },
});
