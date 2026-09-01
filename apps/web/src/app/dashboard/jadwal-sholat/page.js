"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/context/Locale";
import { fireAdzanNotification } from "@/lib/adzanNotification";
import { ADZAN_SOUNDS, useSettings } from "@/lib/useSettings";
import { useLayoutMode } from "@/lib/useLayoutMode";
import AdzanQuickControl from "@/components/AdzanQuickControl";
import { toLocalISODate } from "@/lib/date";
import {
    DEFAULT_PRAYER_LOCATION,
    readStoredUserLocation,
    USER_LOCATION_EVENT,
} from "@/lib/userLocation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const PRAYER_MAP = [
    { key: "imsak", label: "Imsak", icon: "🌙", info: true },
    { key: "fajr", label: "Subuh", icon: "🌙" },
    { key: "sunrise", label: "Syuruq", icon: "🌅", info: true },
    { key: "dhuhr", label: "Dzuhur", icon: "☀️" },
    { key: "asr", label: "Ashar", icon: "🌤️" },
    { key: "maghrib", label: "Maghrib", icon: "🌇" },
    { key: "isha", label: "Isya", icon: "🌃" },
];

const parseHour = (timeStr) => {
    if (!timeStr || timeStr === "-") return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + (m ?? 0);
};

const parsePrayerDate = (timeStr) => {
    const mins = parseHour(timeStr);
    if (mins === null) return null;
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        Math.floor(mins / 60),
        mins % 60,
    );
};

const JadwalSholatPage = () => {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const { settings } = useSettings();
    const [prayers, setPrayers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [location, setLocation] = useState(() =>
        typeof window === "undefined"
            ? DEFAULT_PRAYER_LOCATION
            : readStoredUserLocation() || DEFAULT_PRAYER_LOCATION,
    );
    const [now, setNow] = useState(() => new Date());
    const audioRef = useRef(null);
    const lastNotifRef = useRef("");

    useEffect(() => {
        const handleLocationUpdate = (event) => {
            if (event.detail) setLocation(event.detail);
        };
        window.addEventListener(USER_LOCATION_EVENT, handleLocationUpdate);
        return () =>
            window.removeEventListener(
                USER_LOCATION_EVENT,
                handleLocationUpdate,
            );
    }, []);

    useEffect(() => {
        if (
            !Number.isFinite(Number(location?.lat)) ||
            !Number.isFinite(Number(location?.lng))
        ) {
            return;
        }

        const fetchSchedule = async () => {
            setLoading(true);
            setError(false);
            try {
                const today = toLocalISODate();
                const res = await fetch(
                    `${API_URL}/api/v1/sholat-times?lat=${location.lat}&lng=${location.lng}&method=kemenag&madhab=shafi&date=${today}`,
                );
                const data = await res.json();
                setPrayers(data?.data?.prayers ?? data?.prayers ?? null);
            } catch {
                setError(true);
            }
            setLoading(false);
        };
        fetchSchedule();
    }, [location?.lat, location?.lng]);

    useEffect(() => {
        const tick = () => {
            const n = new Date();
            setNow(n);
            if (!prayers || !settings.notifAdzan) return;

            for (const p of PRAYER_MAP.filter((x) => !x.info)) {
                const pt = parsePrayerDate(prayers[p.key]);
                if (pt && n >= pt && n - pt < 10000) {
                    const todayKey = `${toLocalISODate()}-${p.key}`;
                    if (lastNotifRef.current !== todayKey) {
                        lastNotifRef.current = todayKey;
                        const soundSrc =
                            settings.adzanSoundUrl ||
                            ADZAN_SOUNDS.find(
                                (s) => s.value === settings.adzanSound,
                            )?.src ||
                            ADZAN_SOUNDS[0].src;
                        audioRef.current = new Audio(soundSrc);
                        audioRef.current.play().catch(() => {});

                        const nTitle = `Waktu ${p.label}`;
                        const nBody = `Sudah masuk waktu ${p.label}`;
                        fireAdzanNotification(
                            nTitle,
                            nBody,
                            "/dashboard/jadwal-sholat",
                        );
                    }
                    break;
                }
            }
        };
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [
        prayers,
        settings.notifAdzan,
        settings.adzanSound,
        settings.adzanSoundUrl,
    ]);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const prayerRows = PRAYER_MAP.map(({ key, label, icon, info }) => ({
        key,
        label,
        icon,
        info,
        time: prayers?.[key] ?? "-",
    }));

    // Find current prayer: last non-info prayer whose time <= now
    let currentPrayerKey = null;
    if (!loading && !error && prayers) {
        for (const row of prayerRows.filter((r) => !r.info)) {
            const mins = parseHour(row.time);
            if (mins !== null && mins <= nowMinutes) {
                currentPrayerKey = row.key;
            }
        }
    }

    return (
        <div className={isWide ? "px-4 py-6" : "px-4 py-6 max-w-md mx-auto"}>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-1'>
                {t("jadwal.title")}
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-1'>
                {now.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })}
            </p>
            <p className='text-xs text-gray-400 mb-1'>
                {(location || DEFAULT_PRAYER_LOCATION).label} · Metode Kemenag
            </p>
            <p className='text-xs text-gray-400 mb-6'>
                Adzan{" "}
                {settings.notifAdzan
                    ? `aktif · ${settings.adzanSoundLabel || ADZAN_SOUNDS.find((s) => s.value === settings.adzanSound)?.label || ADZAN_SOUNDS[0].label}`
                    : "mati"}
            </p>

            {loading ? (
                <div className='text-center py-16 text-gray-400 text-sm'>
                    {t("jadwal.loading")}
                </div>
            ) : (
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                    {prayerRows.map((row, idx) => {
                        const isCurrent = row.key === currentPrayerKey;
                        return (
                            <div
                                key={row.key}
                                className={`flex items-center justify-between px-5 py-4 ${
                                    idx !== prayerRows.length - 1
                                        ? "border-b border-gray-50 dark:border-slate-700/50"
                                        : ""
                                } ${isCurrent ? "bg-emerald-50 dark:bg-emerald-900/20" : ""} ${
                                    row.info ? "opacity-60" : ""
                                }`}
                            >
                                <div className='flex items-center gap-3'>
                                    <span className='text-xl'>{row.icon}</span>
                                    <span
                                        className={`text-sm font-medium ${
                                            isCurrent
                                                ? "text-emerald-700 dark:text-emerald-400"
                                                : "text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        {row.label}
                                    </span>
                                    {isCurrent && (
                                        <span className='text-[10px] px-1.5 py-0.5 bg-emerald-500 text-white rounded-full font-medium'>
                                            {t("jadwal.current_badge")}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-sm font-bold ${
                                        isCurrent
                                            ? "text-emerald-700 dark:text-emerald-400"
                                            : "text-gray-800 dark:text-white"
                                    }`}
                                >
                                    {row.time}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {error && (
                <p className='text-center text-sm text-red-500 mt-4'>
                    {t("jadwal.error")}
                </p>
            )}

            <div className='mt-6'>
                <AdzanQuickControl compact />
            </div>
        </div>
    );
};

export default JadwalSholatPage;
