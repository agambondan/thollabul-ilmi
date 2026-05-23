'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BsBell, BsBellFill, BsX } from 'react-icons/bs';
import { notificationApi } from '@/lib/api';
import {
    getPushPermissionStatus,
    registerServiceWorker,
    requestNotificationPermission,
    subscribeToPush,
    subscriptionToPlainObject,
} from '@/lib/pushSubscription';
import { useAuth } from '@/context/Auth';
import {
    getLocationPermissionState,
    readStoredUserLocation,
    requestAndStoreUserLocation,
} from '@/lib/userLocation';

const DISMISSED_KEY = 'tholabul_site_permission_dismissed';

export default function NotificationPermissionPrompt() {
    const { isAuthenticated, isLoading } = useAuth();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const locationRequestedRef = useRef(false);
    const syncedRef = useRef(false);

    const registerPushToken = useCallback(async () => {
        if (typeof window === 'undefined') return false;

        const { supported, registration } = await registerServiceWorker();
        if (!supported || !registration) return false;

        const result = await subscribeToPush(registration);
        if (!result.success) return false;

        if (isAuthenticated) {
            const sub = subscriptionToPlainObject(result.subscription);
            if (sub) {
                await notificationApi.registerPushToken({
                    token: sub.endpoint,
                    platform: 'web',
                    provider: 'web',
                    device_id: `web:${navigator.userAgent?.slice(0, 40) ?? 'unknown'}`,
                    key_p256dh: sub.keys?.p256dh ?? '',
                    key_auth: sub.keys?.auth ?? '',
                });
            }
        }

        return true;
    }, [isAuthenticated]);

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            if (typeof window === 'undefined' || isLoading) return;
            const hasNotification = 'Notification' in window;
            const hasLocation = 'geolocation' in navigator;

            const notificationPermission = hasNotification
                ? await getPushPermissionStatus()
                : 'unsupported';
            const locationPermission = hasLocation
                ? await getLocationPermissionState()
                : 'unsupported';
            const hasStoredLocation = Boolean(readStoredUserLocation());

            if (!hasStoredLocation && locationPermission === 'granted') {
                requestAndStoreUserLocation().catch(() => {});
            }

            const canAskNotification = notificationPermission === 'default';
            const canAskLocation =
                hasLocation &&
                !hasStoredLocation &&
                (locationPermission === 'prompt' || locationPermission === 'unknown');

            if (notificationPermission === 'granted' && isAuthenticated && !syncedRef.current) {
                syncedRef.current = true;
                registerPushToken().catch(() => {
                    syncedRef.current = false;
                });
            }

            if (!canAskNotification && !canAskLocation) return;
            if (localStorage.getItem(DISMISSED_KEY) === '1') return;

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
        localStorage.setItem(DISMISSED_KEY, '1');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className='fixed inset-x-3 bottom-20 z-[70] mx-auto max-w-md rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl shadow-slate-900/15 dark:border-emerald-900/40 dark:bg-slate-900 sm:bottom-5'>
            <button
                type='button'
                onClick={handleDismiss}
                className='absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                aria-label='Tutup'
            >
                <BsX className='text-lg' />
            </button>
            <div className='flex items-start gap-3 pr-7'>
                <span className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                    <BsBellFill />
                </span>
                <div className='min-w-0 flex-1'>
                    <p className='text-sm font-bold text-slate-900 dark:text-white'>
                        Aktifkan lokasi & notifikasi
                    </p>
                    <p className='mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400'>
                        Izinkan lokasi untuk jadwal sholat akurat dan notifikasi untuk pengingat adzan, bacaan harian, serta reminder ibadah.
                    </p>
                    <div className='mt-3 flex flex-wrap gap-2'>
                        <button
                            type='button'
                            onClick={handleEnable}
                            disabled={loading}
                            className='inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            <BsBell />
                            {loading ? 'Mengaktifkan...' : 'Aktifkan lokasi & notifikasi'}
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
