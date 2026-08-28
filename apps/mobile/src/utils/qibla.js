const KAABA = {
    lat: 21.4225,
    lng: 39.8262,
};

const toRad = (value) => (value * Math.PI) / 180;
const toDeg = (value) => (value * 180) / Math.PI;

export const calculateQiblaDirection = (lat, lng) => {
    const dLng = toRad(KAABA.lng - lng);
    const lat1 = toRad(lat);
    const lat2 = toRad(KAABA.lat);
    const x = Math.cos(lat2) * Math.sin(dLng);
    const y =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (toDeg(Math.atan2(x, y)) + 360) % 360;
};

export const calculateKaabaDistance = (lat, lng) => {
    const earthRadiusKm = 6371;
    const dLat = toRad(KAABA.lat - lat);
    const dLng = toRad(KAABA.lng - lng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat)) *
            Math.cos(toRad(KAABA.lat)) *
            Math.sin(dLng / 2) ** 2;
    return Math.round(
        earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
    );
};

export const formatDegrees = (value) => `${Math.round(value)} deg`;
