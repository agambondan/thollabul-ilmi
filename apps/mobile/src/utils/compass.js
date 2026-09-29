import * as Location from "expo-location";
import { Platform } from "react-native";

export const compassSupported = () => Platform.OS !== "web";

const normalizeDegrees = (value) => ((value % 360) + 360) % 360;

export const qiblaOffset = (qiblaDirection, heading) => {
    if (typeof qiblaDirection !== "number" || typeof heading !== "number")
        return null;
    return normalizeDegrees(qiblaDirection - heading);
};

export const signedOffset = (offset) => {
    if (typeof offset !== "number") return null;
    return ((offset + 540) % 360) - 180;
};

export const watchCompassHeading = async (onHeading, onUnavailable, options = {}) => {
    const { interval = 500, distanceFilter = 1, enableHighAccuracy = false } = options;
    if (!compassSupported()) {
        onUnavailable?.("Kompas tersedia di aplikasi mobile.");
        return null;
    }

    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            onUnavailable?.(
                "Izin lokasi diperlukan untuk mengaktifkan kompas.",
            );
            return null;
        }
        const subscription = await Location.watchHeadingAsync(
            {
                interval,
                distanceFilter,
                enableHighAccuracy,
            },
            (event) => {
                // trueHeading returns -1 on Android when GPS fix is unavailable
                const raw =
                    event.trueHeading >= 0
                        ? event.trueHeading
                        : event.magHeading >= 0
                          ? event.magHeading
                          : null;
                if (raw === null) return;
                onHeading(normalizeDegrees(raw));
            },
        );
        return subscription;
    } catch {
        onUnavailable?.("Kompas tidak tersedia di perangkat ini.");
        return null;
    }
};
