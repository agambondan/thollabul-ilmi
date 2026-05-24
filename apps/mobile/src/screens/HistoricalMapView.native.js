import MapView, { Callout, Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme';

export function HistoricalMapView({ locations = [] }) {
  return (
    <View style={styles.mapContainer} testID="historical-map-native">
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
                    {loc.category ? <Text style={styles.calloutTag}>{loc.category}</Text> : null}
                    {loc.era ? (
                      <Text style={[styles.calloutTag, styles.calloutTagEra]}>{loc.era}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
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
});
