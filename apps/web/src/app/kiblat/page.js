"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { useEffect, useRef, useState } from "react";
import { BsGeoAlt } from "react-icons/bs";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

const calcQiblaAngle = (lat, lng) => {
    const dLng = toRad(KAABA_LNG - lng);
    const lat1 = toRad(lat);
    const lat2 = toRad(KAABA_LAT);
    const x = Math.cos(lat2) * Math.sin(dLng);
    const y =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = toDeg(Math.atan2(x, y));
    return (bearing + 360) % 360;
};

const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function KiblatContent() {
    const { lang, t } = useLocale();
    const [coords, setCoords] = useState(null);
    const [qiblaAngle, setQiblaAngle] = useState(null);
    const [compassHeading, setCompassHeading] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [distance, setDistance] = useState(null);
    const orientationRef = useRef(null);
    const [orientationSupported, setOrientationSupported] = useState(true);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError(t("geo.unsupported"));
            return;
        }
        setLoading(true);
        setError("");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoords({ lat: latitude, lng: longitude });
                const angle = calcQiblaAngle(latitude, longitude);
                setQiblaAngle(angle);
                const dist = calcDistance(
                    latitude,
                    longitude,
                    KAABA_LAT,
                    KAABA_LNG,
                );
                setDistance(Math.round(dist));
                setLoading(false);
            },
            () => {
                setError(t("geo.permission_error"));
                setPermissionDenied(true);
                setLoading(false);
            },
        );
    };

    useEffect(() => {
        getLocation();
    }, []);

    useEffect(() => {
        if (!coords) return;

        let receivedTrustedHeading = false;

        const handleOrientation = (e) => {
            let heading = null;
            if (e.webkitCompassHeading !== undefined) {
                // iOS Safari: nilai ini sudah dikalibrasi magnetometer ke
                // Utara asli, jadi selalu bisa dipercaya.
                heading = e.webkitCompassHeading;
            } else if (e.absolute === true && e.alpha !== null) {
                // Selain iOS, alpha hanya valid sebagai heading kalau browser
                // menandainya absolute (terikat Utara asli/magnetik). Tanpa
                // cek ini, banyak Android mengirim alpha yang cuma relatif ke
                // orientasi HP saat halaman dimuat -- jarum tetap bergerak
                // tapi arahnya salah dibanding kompas sungguhan.
                heading = (360 - e.alpha + 360) % 360;
            }
            if (heading !== null) {
                receivedTrustedHeading = true;
                setCompassHeading(heading);
            }
        };

        // 'deviceorientationabsolute' selalu membawa alpha yang terikat Utara
        // asli di browser yang mendukungnya (Chrome/Android). Utamakan itu
        // daripada 'deviceorientation' polos yang keandalannya berbeda-beda
        // antar perangkat.
        const eventName =
            typeof window !== "undefined" &&
            "ondeviceorientationabsolute" in window
                ? "deviceorientationabsolute"
                : "deviceorientation";

        let fallbackTimer = null;
        const attach = () => {
            window.addEventListener(eventName, handleOrientation);
            orientationRef.current = { eventName, handleOrientation };
            // Kalau dalam beberapa detik belum ada pembacaan yang bisa
            // dipercaya, browser ini kemungkinan tidak menyediakan heading
            // yang valid -- tampilkan sudut statis daripada diam-diam pakai
            // alpha relatif yang menyesatkan.
            fallbackTimer = setTimeout(() => {
                if (!receivedTrustedHeading) setOrientationSupported(false);
            }, 4000);
        };

        if (typeof DeviceOrientationEvent !== "undefined") {
            if (
                typeof DeviceOrientationEvent.requestPermission === "function"
            ) {
                // iOS 13+: webkitCompassHeading selalu bisa dipercaya, jadi
                // tidak perlu event absolute maupun fallback timer.
                DeviceOrientationEvent.requestPermission()
                    .then((perm) => {
                        if (perm === "granted") {
                            window.addEventListener(
                                "deviceorientation",
                                handleOrientation,
                            );
                            orientationRef.current = {
                                eventName: "deviceorientation",
                                handleOrientation,
                            };
                        } else {
                            setOrientationSupported(false);
                        }
                    })
                    .catch(() => setOrientationSupported(false));
            } else {
                attach();
            }
        } else {
            setOrientationSupported(false);
        }

        return () => {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            if (orientationRef.current) {
                window.removeEventListener(
                    orientationRef.current.eventName,
                    orientationRef.current.handleOrientation,
                );
            }
        };
    }, [coords]);

    // The needle angle = qiblaAngle - compassHeading
    const needleAngle =
        qiblaAngle !== null && compassHeading !== null
            ? (qiblaAngle - compassHeading + 360) % 360
            : (qiblaAngle ?? 0);

    // Cincin N/E/S/W diputar balik -compassHeading (sama pola dengan
    // ringRotation di QiblaScreen.js mobile) supaya label N selalu
    // menunjuk Utara geografis yang sebenarnya saat HP diputar. Kalau
    // compassHeading belum ada, cincin diam di posisi Utara-di-atas.
    const ringRotationDeg = compassHeading !== null ? -compassHeading : 0;

    const isPointing =
        qiblaAngle !== null &&
        compassHeading !== null &&
        Math.abs(((qiblaAngle - compassHeading + 540) % 360) - 180) < 10;

    return (
        <ContentWidth compact='max-w-lg' className='flex-1 px-4 pt-6 pb-8'>
            {/* Header */}
            <div className='mb-8 text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                    <span className='text-3xl'>🕋</span>
                </div>
                <h1 className='text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-2'>
                    {t("qibla.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("qibla.subtitle")}
                </p>
            </div>

            {loading && (
                <div className='text-center py-12'>
                    <div className='w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t("qibla.detecting")}
                    </p>
                </div>
            )}

            {error && !loading && (
                <div className='text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-2xl mb-4'>
                    <p className='text-red-600 dark:text-red-400 text-sm mb-3'>
                        {error}
                    </p>
                    <button
                        onClick={getLocation}
                        className='bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700'
                    >
                        {t("common.try_again")}
                    </button>
                </div>
            )}

            {!loading && qiblaAngle !== null && (
                <>
                    {/* Compass */}
                    <div className='flex flex-col items-center mb-8'>
                        <div className='relative w-72 h-72 mt-6'>
                            {/* Compass ring */}
                            <div className='absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 shadow-xl'>
                                {/* Cardinal points */}
                                {[
                                    { label: t("qibla.north_short"), angle: 0 },
                                    { label: t("qibla.east_short"), angle: 90 },
                                    {
                                        label: t("qibla.south_short"),
                                        angle: 180,
                                    },
                                    {
                                        label: t("qibla.west_short"),
                                        angle: 270,
                                    },
                                ].map(({ label, angle }) => (
                                    <div
                                        key={label}
                                        className='absolute w-full h-full transition-transform duration-200'
                                        style={{
                                            transform: `rotate(${angle + ringRotationDeg}deg)`,
                                        }}
                                    >
                                        <span
                                            className='absolute left-1/2 -translate-x-1/2 top-3 text-xs leading-none font-extrabold text-gray-500 dark:text-gray-400'
                                            style={{
                                                transform: `rotate(${-(angle + ringRotationDeg)}deg)`,
                                            }}
                                        >
                                            {label}
                                        </span>
                                    </div>
                                ))}

                                {/* Center dot */}
                                <div className='absolute inset-0 flex items-center justify-center'>
                                    <div className='w-3 h-3 rounded-full bg-emerald-500 z-10' />
                                </div>

                                {/* Qibla needle */}
                                <div
                                    className='absolute inset-0 flex items-center justify-center transition-transform duration-200'
                                    style={{
                                        transform: `rotate(${needleAngle}deg)`,
                                    }}
                                >
                                    {/* Arrow pointing up = qibla direction */}
                                    <div className='relative w-2 h-full flex flex-col items-center'>
                                        {/* Top half (qibla direction) */}
                                        <div className='flex flex-col items-center'>
                                            <div
                                                className={`w-0 h-0 border-l-[8px] border-r-[8px] border-b-[20px] border-l-transparent border-r-transparent ${
                                                    isPointing
                                                        ? "border-b-emerald-500"
                                                        : "border-b-emerald-600"
                                                }`}
                                            />
                                            <div
                                                className={`w-2 h-24 ${isPointing ? "bg-emerald-500" : "bg-emerald-600"} rounded-b`}
                                            />
                                        </div>
                                        {/* Bottom half */}
                                        <div className='flex flex-col items-center'>
                                            <div className='w-2 h-24 bg-gray-300 dark:bg-gray-600 rounded-t' />
                                            <div className='w-0 h-0 border-l-[8px] border-r-[8px] border-t-[20px] border-l-transparent border-r-transparent border-t-gray-300 dark:border-t-gray-600' />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ka'bah target -- di luar cincin, di posisi 12 (arah yang
                                sama dengan needleAngle 0/isPointing) supaya jarum terlihat
                                mengarah ke sini persis saat sudah menghadap kiblat */}
                            <div
                                className={`absolute -top-5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 shadow-md transition-colors duration-200 pointer-events-none ${
                                    isPointing
                                        ? "border-emerald-500 shadow-emerald-300/60 dark:shadow-emerald-900/40"
                                        : "border-emerald-200 dark:border-emerald-800"
                                }`}
                            >
                                <span className='text-xl'>🕋</span>
                            </div>
                        </div>

                        {isPointing && (
                            <div className='mt-4 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-xl text-sm font-bold'>
                                ✅ {t("qibla.facing_qibla")}
                            </div>
                        )}
                    </div>

                    {/* Info cards */}
                    <div className='grid grid-cols-2 gap-4 mb-6'>
                        <div className='bg-white dark:bg-slate-800 rounded-2xl p-4 text-center border border-gray-100 dark:border-slate-700 shadow-sm'>
                            <p className='text-xs text-gray-400 mb-1'>
                                {t("qibla.angle")}
                            </p>
                            <p className='text-2xl font-extrabold text-emerald-700 dark:text-emerald-300'>
                                {Math.round(qiblaAngle)}°
                            </p>
                            <p className='text-xs text-gray-400'>
                                {t("qibla.from_north")}
                            </p>
                        </div>
                        <div className='bg-white dark:bg-slate-800 rounded-2xl p-4 text-center border border-gray-100 dark:border-slate-700 shadow-sm'>
                            <p className='text-xs text-gray-400 mb-1'>
                                {t("qibla.distance_to_kaaba")}
                            </p>
                            <p className='text-2xl font-extrabold text-emerald-700 dark:text-emerald-300'>
                                {distance?.toLocaleString(
                                    lang === "EN" ? "en-US" : "id-ID",
                                )}
                            </p>
                            <p className='text-xs text-gray-400'>km</p>
                        </div>
                    </div>

                    {coords && (
                        <div className='bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-4'>
                            <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1'>
                                <BsGeoAlt /> {t("geo.your_location")}
                            </p>
                            <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {coords.lat.toFixed(4)}° LU,{" "}
                                {coords.lng.toFixed(4)}° BT
                            </p>
                        </div>
                    )}

                    {!orientationSupported && (
                        <div className='bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300'>
                            {t("qibla.no_compass")}
                        </div>
                    )}

                    {orientationSupported && compassHeading !== null && (
                        <div className='bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 text-sm text-emerald-800 dark:text-emerald-300 text-center'>
                            {t("qibla.compass_active")}{" "}
                            {Math.round(compassHeading)}°
                        </div>
                    )}

                    {orientationSupported && compassHeading === null && (
                        <div className='bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-300'>
                            {t("qibla.rotate_device")}
                        </div>
                    )}
                </>
            )}

            <p className='text-center text-xs text-gray-400 mt-6'>
                {t("qibla.gps_note")}
            </p>
        </ContentWidth>
    );
}

export default function KiblatPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-navbar'>
                <KiblatContent />
            </div>
        </main>
    );
}
