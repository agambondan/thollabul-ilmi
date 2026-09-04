"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BsBell, BsBellFill, BsX } from "react-icons/bs";
import { notificationApi } from "@/lib/api";
import {
    getPushPermissionStatus,
    registerServiceWorker,
    requestNotificationPermission,
    subscribeToPush,
    subscriptionToPlainObject,
} from "@/lib/pushSubscription";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import {
    getLocationPermissionState,
    isStoredUserLocationFresh,
    readStoredUserLocation,
    requestAndStoreUserLocation,
} from "@/lib/userLocation";

const DISMISSED_KEY = "tholabul_site_permission_dismissed";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

const isPromptDismissed = () => {
    if (typeof window === "undefined") return false;
    const value = Number(localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(value) && Date.now() - value < DISMISS_TTL_MS;
};

export default function NotificationPermissionPrompt() {
    const pathname = usePathname() || "";
    const isDashboard = pathname.startsWith("/dashboard");
    const { isAuthenticated, isLoading } = useAuth();
    const { t } = useLocale();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const locationRequestedRef = useRef(false);
    const syncedRef = useRef(false);

    const registerPushToken = useCallback(async () => {
        if (typeof window === "undefined") return false;

        const { supported, registration } = await registerServiceWorker();
        if (!supported || !registration) return false;

        const result = await subscribeToPush(registration, {
            vapidKeyFetcher: notificationApi.getVapidPublicKey,
        });
        if (!result.success) return false;

        if (isAuthenticated) {
            const sub = subscriptionToPlainObject(result.subscription);
            if (sub) {
                const storedLoc = readStoredUserLocation();
                const lat = storedLoc?.lat ? Number(storedLoc.lat) : -6.2088;
                const lng = storedLoc?.lng ? Number(storedLoc.lng) : 106.8456;
                const cityName = storedLoc?.label || "Jakarta";
                const userTimezone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone ||
                    "Asia/Jakarta";
                const tzOffsetMinutes = -new Date().getTimezoneOffset();
                await notificationApi.registerPushToken({
                    token: sub.endpoint,
                    platform: "web",
                    provider: "web",
                    device_id: `web:${navigator.userAgent?.slice(0, 40) ?? "unknown"}`,
                    key_p256dh: sub.keys?.p256dh ?? "",
                    key_auth: sub.keys?.auth ?? "",
                    latitude: lat,
                    longitude: lng,
                    city_name: cityName,
                    timezone: userTimezone,
                    tz_offset_minutes: tzOffsetMinutes,
                });
            }
        }

        return true;
    }, [isAuthenticated]);

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            if (typeof window === "undefined" || isLoading) return;
            const hasNotification = "Notification" in window;
            const hasLocation = "geolocation" in navigator;

            const notificationPermission = hasNotification
                ? await getPushPermissionStatus()
                : "unsupported";
            const locationPermission = hasLocation
                ? await getLocationPermissionState()
                : "unsupported";
            const storedLocation = readStoredUserLocation();
            const hasFreshStoredLocation =
                isStoredUserLocationFresh(storedLocation);

            if (locationPermission === "granted") {
                requestAndStoreUserLocation().catch(() => {});
            }

            const canAskNotification = notificationPermission === "default";
            const canAskLocation =
                hasLocation &&
                !hasFreshStoredLocation &&
                (locationPermission === "prompt" ||
                    locationPermission === "unknown");

            if (
                notificationPermission === "granted" &&
                isAuthenticated &&
                !syncedRef.current
            ) {
                syncedRef.current = true;
                registerPushToken().catch(() => {
                    syncedRef.current = false;
                });
            }

            if (!canAskNotification && !canAskLocation) return;
            if (isPromptDismissed()) return;

            if (!cancelled) setVisible(true);

            if (canAskLocation && !locationRequestedRef.current) {
                locationRequestedRef.current = true;
                requestAndStoreUserLocation().catch(() => {});
            }
        };

        boot();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, isLoading, registerPushToken]);

    const handleEnable = async () => {
        setLoading(true);
        try {
            const [notificationResult] = await Promise.all([
                requestNotificationPermission(),
                requestAndStoreUserLocation().catch(() => null),
            ]);
            if (notificationResult.granted) {
                await registerPushToken().catch(() => {});
            }
            setVisible(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            // z-[45]: above persistent chrome (bottom nav / docked sidebar sit at
            // z-40) but below every modal (z-50+) — a dismissible nag must never be
            // able to sit on top of, and block clicks on, an open dialog.
            className={`fixed inset-x-3 z-[45] mx-auto max-w-md rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl shadow-slate-900/15 dark:border-emerald-900/40 dark:bg-slate-900 ${
                isDashboard ? "bottom-24 sm:bottom-28" : "bottom-20 sm:bottom-5"
            }`}
        >
            <button
                type='button'
                onClick={handleDismiss}
                className='absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 hover:dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                aria-label={t("notification.close")}
            >
                <BsX className='text-lg' />
            </button>
            <div className='flex items-start gap-3 pr-7'>
                <span className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'>
                    <BsBellFill />
                </span>
                <div className='min-w-0 flex-1'>
                    <p className='text-sm font-bold text-slate-900 dark:text-slate-100 dark:text-white'>
                        Aktifkan lokasi & notifikasi
                    </p>
                    <p className='mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300 dark:text-slate-400'>
                        Izinkan lokasi untuk jadwal sholat akurat dan notifikasi
                        untuk pengingat adzan, bacaan harian, serta reminder
                        ibadah.
                    </p>
                    <div className='mt-3 flex flex-wrap gap-2'>
                        <button
                            type='button'
                            onClick={handleEnable}
                            disabled={loading}
                            className='inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            <BsBell />
                            {loading
                                ? "Mengaktifkan..."
                                : "Aktifkan lokasi & notifikasi"}
                        </button>
                        <button
                            type='button'
                            onClick={handleDismiss}
                            className='rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                        >
                            Nanti
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
