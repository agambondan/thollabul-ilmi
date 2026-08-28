export const USER_LOCATION_STORAGE_KEY = "tholabul_user_location";
export const USER_LOCATION_EVENT = "tholabul:user-location-updated";
export const USER_LOCATION_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export const DEFAULT_PRAYER_LOCATION = {
    label: "Jakarta",
    lat: -6.2088,
    lng: 106.8456,
    source: "default",
};

const isFiniteNumber = (value) => Number.isFinite(Number(value));

const normalizeLabel = (
    value,
    fallback = "Lokasi GPS",
    prefixDistrict = true,
) => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return fallback;
    if (/^(kecamatan|kabupaten|kota)\b/i.test(cleaned)) return cleaned;
    return prefixDistrict ? `Kecamatan ${cleaned}` : cleaned;
};

export const readStoredUserLocation = () => {
    if (typeof window === "undefined") return null;
    try {
        const parsed = JSON.parse(
            localStorage.getItem(USER_LOCATION_STORAGE_KEY) || "null",
        );
        if (
            !parsed ||
            !isFiniteNumber(parsed.lat) ||
            !isFiniteNumber(parsed.lng)
        ) {
            return null;
        }
        return {
            label: parsed.label || "Lokasi GPS",
            lat: Number(parsed.lat),
            lng: Number(parsed.lng),
            source: parsed.source || "gps",
            updatedAt: parsed.updatedAt || null,
        };
    } catch {
        return null;
    }
};

export const isStoredUserLocationFresh = (
    location,
    maxAge = USER_LOCATION_MAX_AGE_MS,
) => {
    if (!location?.updatedAt) return false;
    const updatedAt = Number(location.updatedAt);
    return Number.isFinite(updatedAt) && Date.now() - updatedAt <= maxAge;
};

export const writeStoredUserLocation = (location) => {
    if (typeof window === "undefined") return null;
    if (
        !location ||
        !isFiniteNumber(location.lat) ||
        !isFiniteNumber(location.lng)
    ) {
        return null;
    }

    const payload = {
        label: location.label || "Lokasi GPS",
        lat: Number(location.lat),
        lng: Number(location.lng),
        source: location.source || "gps",
        updatedAt: location.updatedAt || Date.now(),
    };

    localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(
        new CustomEvent(USER_LOCATION_EVENT, { detail: payload }),
    );
    return payload;
};

const pickAddressLabel = (address = {}) => {
    const district = address.suburb || address.city_district || address.village;
    if (district) return { value: district, prefixDistrict: true };

    const city =
        address.town || address.city || address.county || address.state;
    if (city) return { value: city, prefixDistrict: false };

    return { value: "", prefixDistrict: false };
};

export const resolveLocationLabel = async (
    lat,
    lng,
    fallback = "Lokasi GPS",
) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
        const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(lat),
            lon: String(lng),
            zoom: "14",
            addressdetails: "1",
        });
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`,
            {
                signal: controller.signal,
            },
        );
        if (!response.ok) return fallback;
        const data = await response.json();
        const label = pickAddressLabel(data?.address);
        return normalizeLabel(label.value, fallback, label.prefixDistrict);
    } catch {
        return fallback;
    } finally {
        clearTimeout(timeoutId);
    }
};

export const requestAndStoreUserLocation = ({
    fallbackLabel = "Lokasi GPS",
    maximumAge = 300000,
    timeout = 10000,
} = {}) =>
    new Promise((resolve) => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            resolve({ ok: false, reason: "unsupported" });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const label = await resolveLocationLabel(
                    lat,
                    lng,
                    fallbackLabel,
                );
                const stored = writeStoredUserLocation({
                    label,
                    lat,
                    lng,
                    source: "gps",
                });
                resolve({ ok: true, location: stored });
            },
            (error) => resolve({ ok: false, reason: error?.code || "error" }),
            { enableHighAccuracy: false, maximumAge, timeout },
        );
    });

export const getLocationPermissionState = async () => {
    if (typeof window === "undefined" || !navigator.permissions?.query)
        return "unknown";
    try {
        const permission = await navigator.permissions.query({
            name: "geolocation",
        });
        return permission.state;
    } catch {
        return "unknown";
    }
};
