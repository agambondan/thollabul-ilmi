import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { radius } from "../theme";

let NativeMapView = null;
let NativeMarker = null;
try {
    const Maps = require("react-native-maps");
    NativeMapView = Maps.default;
    NativeMarker = Maps.Marker;
} catch {}

const hasValidCoordinate = (loc) =>
    Number.isFinite(Number(loc?.latitude)) &&
    Number.isFinite(Number(loc?.longitude));

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const buildPopupHtml = (loc) => {
    const tags = [
        loc.category
            ? `<span class="tag tag-category">${escapeHtml(loc.category)}</span>`
            : "",
        loc.era
            ? `<span class="tag tag-era">${escapeHtml(loc.era)}</span>`
            : "",
    ].join("");
    return `<div class="popup"><div class="popup-title">${escapeHtml(loc.name)}</div><div class="popup-desc">${escapeHtml((loc.description || "").slice(0, 180))}</div>${tags ? `<div class="popup-tags">${tags}</div>` : ""}</div>`;
};

const buildMapHtml = (locations, isDark) => {
    const markerScript = locations
        .map(
            (loc) =>
                `L.marker([${Number(loc.latitude)}, ${Number(loc.longitude)}]).addTo(map).bindPopup(${JSON.stringify(buildPopupHtml(loc))});`,
        )
        .join("\n");

    const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileAttribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const backgroundColor = isDark ? "#020617" : "#f1f5f9";

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<style>
html, body, #map { height: 100%; margin: 0; padding: 0; background: ${backgroundColor}; }
${isDark ? ".leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9); }" : ""}
.leaflet-popup-content-wrapper { border-radius: 12px; }
.popup { max-width: 220px; font-family: -apple-system, Roboto, sans-serif; }
.popup-title { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
.popup-desc { font-size: 12px; color: #555; line-height: 16px; }
.popup-tags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.tag { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 8px; }
.tag-category { background: #dcfce7; color: #166534; }
.tag-era { background: #dbeafe; color: #1e40af; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([28, 35], 3);
L.tileLayer('${tileUrl}', { attribution: '${tileAttribution}', maxZoom: 19, subdomains: 'abc' }).addTo(map);
${markerScript}
</script>
</body>
</html>`;
};

export function HistoricalMapView({
    locations = [],
    isWebAppLayout = false,
    webAppTheme = null,
    useNativeMap = false,
}) {
    const visibleLocations = useMemo(
        () => locations.filter(hasValidCoordinate),
        [locations],
    );
    const isDark = Boolean(webAppTheme?.mapStyle);
    const html = useMemo(
        () => buildMapHtml(visibleLocations, isDark),
        [visibleLocations, isDark],
    );

    if (visibleLocations.length === 0) {
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
            />
        );
    }

    if (useNativeMap && NativeMapView) {
        const initialRegion = {
            latitude: 28,
            longitude: 35,
            latitudeDelta: 60,
            longitudeDelta: 60,
        };
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
                <NativeMapView
                    initialRegion={initialRegion}
                    style={styles.map}
                    testID='mock-mapview'
                >
                    {visibleLocations.map((loc) => (
                        <NativeMarker
                            coordinate={{
                                latitude: Number(loc.latitude),
                                longitude: Number(loc.longitude),
                            }}
                            description={loc.description}
                            key={loc.id}
                            title={loc.name}
                        />
                    ))}
                </NativeMapView>
            </View>
        );
    }

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
            <WebView
                domStorageEnabled
                javaScriptEnabled
                originWhitelist={["*"]}
                source={{ html }}
                style={styles.map}
            />
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
});
