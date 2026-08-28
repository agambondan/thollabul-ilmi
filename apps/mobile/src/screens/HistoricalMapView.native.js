import MapView, { Callout, Marker } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";
import { radius } from "../theme";

const hasValidCoordinate = (loc) =>
    Number.isFinite(Number(loc?.latitude)) &&
    Number.isFinite(Number(loc?.longitude));

export function HistoricalMapView({
    locations = [],
    isWebAppLayout = false,
    webAppTheme = null,
}) {
    const visibleLocations = locations.filter(hasValidCoordinate);

    return (
        <View
            style={[
                styles.mapContainer,
                isWebAppLayout && styles.webAppMapContainer,
                isWebAppLayout &&
                    webAppTheme && {
                        backgroundColor: webAppTheme.surface,
                        borderColor: webAppTheme.border,
                    },
            ]}
            testID='historical-map-native'
        >
            <MapView
                customMapStyle={
                    isWebAppLayout && webAppTheme?.mapStyle
                        ? webAppTheme.mapStyle
                        : undefined
                }
                initialRegion={{
                    latitude: 28,
                    longitude: 35,
                    latitudeDelta: 45,
                    longitudeDelta: 45,
                }}
                style={styles.map}
            >
                {visibleLocations.map((loc) => (
                    <Marker
                        key={loc.id || loc.name}
                        coordinate={{
                            latitude: Number(loc.latitude),
                            longitude: Number(loc.longitude),
                        }}
                        title={loc.name}
                    >
                        <Callout>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>
                                    {loc.name}
                                </Text>
                                <Text
                                    style={styles.calloutDesc}
                                    numberOfLines={3}
                                >
                                    {loc.description}
                                </Text>
                                {(loc.category || loc.era) && (
                                    <View style={styles.calloutTags}>
                                        {loc.category ? (
                                            <Text style={styles.calloutTag}>
                                                {loc.category}
                                            </Text>
                                        ) : null}
                                        {loc.era ? (
                                            <Text
                                                style={[
                                                    styles.calloutTag,
                                                    styles.calloutTagEra,
                                                ]}
                                            >
                                                {loc.era}
                                            </Text>
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
        overflow: "hidden",
    },
    webAppMapContainer: {
        borderColor: "#e5e7eb",
        borderRadius: 16,
        borderWidth: 1,
        height: 500,
    },
    map: {
        height: "100%",
        width: "100%",
    },
    callout: {
        maxWidth: 240,
        padding: 4,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 4,
    },
    calloutDesc: {
        color: "#555",
        fontSize: 12,
        lineHeight: 16,
    },
    calloutTags: {
        flexDirection: "row",
        gap: 4,
        marginTop: 6,
    },
    calloutTag: {
        backgroundColor: "#dcfce7",
        borderRadius: 8,
        color: "#166534",
        fontSize: 10,
        fontWeight: "600",
        overflow: "hidden",
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    calloutTagEra: {
        backgroundColor: "#dbeafe",
        color: "#1e40af",
    },
});
