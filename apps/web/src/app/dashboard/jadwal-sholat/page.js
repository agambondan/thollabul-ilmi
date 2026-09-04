"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/context/Locale";
import { fireAdzanNotification } from "@/lib/adzanNotification";
import {
    ADZAN_SOUNDS,
    resolveAdzanSoundSrc,
    useSettings,
} from "@/lib/useSettings";
import { useLayoutMode } from "@/lib/useLayoutMode";
import AdzanQuickControl from "@/components/AdzanQuickControl";
import { toLocalISODate } from "@/lib/date";
import {
    buildSholatTimesUrl,
    extractPrayers,
    PRAYER_METHODS,
    useLocalDateKey,
} from "@/lib/prayerTimes";
import {
    DEFAULT_PRAYER_LOCATION,
    readStoredUserLocation,
    USER_LOCATION_EVENT,
} from "@/lib/userLocation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const PRAYER_MAP = [
    { key: "imsak", labelKey: "prayer.imsak", icon: "🌙", info: true },
    { key: "fajr", labelKey: "prayer.fajr", icon: "🌙" },
    { key: "sunrise", labelKey: "prayer.sunrise", icon: "🌅", info: true },
    { key: "dhuhr", labelKey: "prayer.dhuhr", icon: "☀️" },
    { key: "asr", labelKey: "prayer.asr", icon: "🌤️" },
    { key: "maghrib", labelKey: "prayer.maghrib", icon: "🌇" },
    { key: "isha", labelKey: "prayer.isha", icon: "🌃" },
];

const REMINDER_LEAD_OPTIONS = [0, 5, 10, 15, 30];
const PRAYER_REMINDER_ROWS = [
    ["fajr", "prayer.fajr"],
    ["dhuhr", "prayer.dhuhr"],
    ["asr", "prayer.asr"],
    ["maghrib", "prayer.maghrib"],
    ["isha", "prayer.isha"],
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
    const { settings, updateSetting, getLeadForPrayer } = useSettings();
    const dateKey = useLocalDateKey();
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
                const res = await fetch(
                    buildSholatTimesUrl({
                        lat: location.lat,
                        lng: location.lng,
                        method: settings.prayerMethod,
                        madhab: settings.prayerMadhab,
                        date: dateKey,
                    }),
                );
                const data = await res.json();
                const next = extractPrayers(data);
                setPrayers(next);
                setError(!next);
            } catch {
                setError(true);
            }
            setLoading(false);
        };
        fetchSchedule();
    }, [
        location?.lat,
        location?.lng,
        settings.prayerMethod,
        settings.prayerMadhab,
        dateKey,
    ]);

    useEffect(() => {
        const tick = () => {
            const n = new Date();
            setNow(n);
            if (!prayers || !settings.notifAdzan) return;

            for (const p of PRAYER_MAP.filter((x) => !x.info)) {
                const pt = parsePrayerDate(prayers[p.key]);
                if (!pt) continue;

                const lead = getLeadForPrayer(p.key);
                const at = pt.getTime() - lead * 60_000;
                const diff = n.getTime() - at;

                if (diff < 0 || diff > 10_000) continue;

                const notifKey = `${toLocalISODate()}-${p.key}-${lead}`;
                if (lastNotifRef.current === notifKey) break;
                lastNotifRef.current = notifKey;

                if (lead === 0 && n >= pt) {
                    const soundSrc = resolveAdzanSoundSrc(
                        settings.adzanSound,
                        settings.adzanSoundUrl,
                    );
                    audioRef.current = new Audio(soundSrc);
                    audioRef.current.play().catch(() => {});
                }

                const prayerName = t(p.labelKey);
                const nTitle = `${t("prayer_schedule.adzan")} ${prayerName}`;
                const nBody =
                    lead === 0
                        ? `${t("prayer_schedule.adzan_body")} ${prayerName}`
                        : `${t("prayer_schedule.reminder_body")} ${lead} ${t("prayer_schedule.minutes")} — ${prayerName}`;
                fireAdzanNotification(
                    nTitle,
                    nBody,
                    "/dashboard/jadwal-sholat",
                );
                break;
            }
        };
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [
        prayers,
        settings.notifAdzan,
        settings.adzanSound,
        settings.adzanSoundUrl,
        settings.adzanReminderLead,
        settings.adzanReminderLeadByPrayer,
        getLeadForPrayer,
        t,
    ]);

    const updateAdzanReminderLead = (value) =>
        updateSetting("adzanReminderLead", Number(value));

    const updateAdzanReminderLeadForPrayer = (key, value) => {
        const next = { ...(settings.adzanReminderLeadByPrayer || {}) };
        if (value === "global") delete next[key];
        else next[key] = Number(value);
        updateSetting("adzanReminderLeadByPrayer", next);
    };

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
            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1'>
                {t("jadwal.title")}
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-1'>
                {now.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })}
            </p>
            <p className='text-xs text-gray-400 mb-1'>
                {(location || DEFAULT_PRAYER_LOCATION).label} ·{" "}
                {t("prayer_schedule.method")}:{" "}
                {PRAYER_METHODS.find((m) => m.value === settings.prayerMethod)
                    ?.label ?? settings.prayerMethod}
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
                                        {t(row.labelKey)}
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

            <div className='mt-6 space-y-3'>
                <section className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-sm font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4 uppercase tracking-wider'>
                        {t("settings.section_notifications")}
                    </h2>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2'>
                        <span className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                            {t("settings.adzan_reminder_lead")}
                        </span>
                        <select
                            value={settings.adzanReminderLead ?? 10}
                            onChange={(e) =>
                                updateAdzanReminderLead(e.target.value)
                            }
                            className='w-full sm:w-auto bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-sm text-gray-900 dark:text-gray-100 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                            aria-label={t("prayer.reminder_lead")}
                        >
                            {REMINDER_LEAD_OPTIONS.map((m) => (
                                <option key={m} value={m}>
                                    {m === 0
                                        ? t("settings.adzan_at_time")
                                        : `${m} ${t("settings.minutes_before")}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='pt-3 border-t border-gray-100 dark:border-slate-700'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                {t("settings.adzan_reminder_per_prayer")}
                            </span>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                            {PRAYER_REMINDER_ROWS.map(([key, labelKey]) => (
                                <label
                                    key={key}
                                    className='flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2'
                                >
                                    <span className='text-xs font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                        {t(labelKey)}
                                    </span>
                                    <select
                                        value={
                                            settings
                                                .adzanReminderLeadByPrayer?.[
                                                key
                                            ] ?? "global"
                                        }
                                        onChange={(e) =>
                                            updateAdzanReminderLeadForPrayer(
                                                key,
                                                e.target.value,
                                            )
                                        }
                                        className='bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-xs text-gray-900 dark:text-gray-100 dark:text-white rounded-md px-2 py-1 focus:ring-emerald-500'
                                        aria-label={t(
                                            "prayer.reminder_lead_prayer",
                                            { prayer: key },
                                        )}
                                    >
                                        <option value='global'>
                                            {t("settings.global")}
                                        </option>
                                        {REMINDER_LEAD_OPTIONS.map((m) => (
                                            <option key={m} value={m}>
                                                {m === 0
                                                    ? t(
                                                          "settings.adzan_at_time",
                                                      )
                                                    : `${m} ${t(
                                                          "settings.minutes_before",
                                                      )}`}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>
                <AdzanQuickControl compact />
            </div>
        </div>
    );
};

export default JadwalSholatPage;
