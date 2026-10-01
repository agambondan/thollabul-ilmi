import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";

export function HistoricalMapView({
    locations = [],
    isWebAppLayout = false,
    webAppTheme = null,
}) {
    return (
        <View
            style={[
                styles.container,
                isWebAppLayout && styles.webAppContainer,
                isWebAppLayout &&
                    webAppTheme && {
                        backgroundColor: webAppTheme.surface,
                        borderColor: webAppTheme.border,
                    },
            ]}
            testID='historical-map-web-fallback'
        >
            <Text
                style={[
                    styles.title,
                    isWebAppLayout && styles.webAppTitle,
                    isWebAppLayout &&
                        webAppTheme && { color: webAppTheme.title },
                ]}
            >
                Peta tersedia di aplikasi native
            </Text>
            <Text
                style={[
                    styles.subtitle,
                    isWebAppLayout && styles.webAppSubtitle,
                    isWebAppLayout &&
                        webAppTheme && { color: webAppTheme.muted },
                ]}
            >
                Expo web menampilkan daftar lokasi agar fitur tarikh tetap bisa
                dibuka dari browser.
            </Text>
            <ScrollView
                contentContainerStyle={styles.list}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
            >
                {locations.slice(0, 8).map((loc) => (
                    <View
                        key={loc.id || loc.name}
                        style={[
                            styles.locationCard,
                            isWebAppLayout && styles.webAppLocationCard,
                            isWebAppLayout &&
                                webAppTheme && {
                                    backgroundColor: webAppTheme.tile,
                                    borderColor: webAppTheme.border,
                                },
                        ]}
                    >
                        <Text
                            style={[
                                styles.locationName,
                                isWebAppLayout && styles.webAppLocationName,
                                isWebAppLayout &&
                                    webAppTheme && { color: webAppTheme.text },
                            ]}
                        >
                            {loc.name}
                        </Text>
                        <Text
                            numberOfLines={2}
                            style={[
                                styles.locationDesc,
                                isWebAppLayout && styles.webAppLocationDesc,
                                isWebAppLayout &&
                                    webAppTheme && { color: webAppTheme.muted },
                            ]}
                        >
                            {loc.description}
                        </Text>
                        {(loc.category || loc.era) && (
                            <View style={styles.tags}>
                                {loc.category ? (
                                    <Text
                                        style={[
                                            styles.tag,
                                            isWebAppLayout
                                                ? {
                                                      backgroundColor:
                                                          webAppTheme.accentSoft,
                                                      color: webAppTheme.accentText,
                                                  }
                                                : styles.tagClassic,
                                        ]}
                                    >
                                        {loc.category}
                                    </Text>
                                ) : null}
                                {loc.era ? (
                                    <Text
                                        style={[
                                            styles.tag,
                                            styles.tagEra,
                                            isWebAppLayout
                                                ? {
                                                      backgroundColor:
                                                          webAppTheme.infoSoft,
                                                      color: webAppTheme.infoText,
                                                  }
                                                : styles.tagEraClassic,
                                        ]}
                                    >
                                        {loc.era}
                                    </Text>
                                ) : null}
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
        backgroundColor: "#f8fafc",
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 360,
        padding: spacing.md,
    },
    title: {
        color: colors.ink,
        fontSize: 15,
        fontWeight: "800",
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
        backgroundColor: "#ffffff",
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        padding: spacing.sm,
    },
    locationName: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0,
    },
    locationDesc: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 3,
    },
    tags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    tag: {
        borderRadius: 8,
        fontSize: 10,
        fontWeight: "700",
        overflow: "hidden",
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
    },
    tagEra: {},
    tagClassic: {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        color: "#10b981",
    },
    tagEraClassic: {
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        color: "#3b82f6",
    },
    webAppContainer: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 16,
        minHeight: 500,
    },
    webAppTitle: {
        color: "#111827",
    },
    webAppSubtitle: {
        color: "#64748b",
        fontWeight: "600",
    },
    webAppLocationCard: {
        borderColor: "#e5e7eb",
    },
    webAppLocationName: {
        color: "#111827",
    },
    webAppLocationDesc: {
        color: "#64748b",
    },
});
