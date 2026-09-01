"use client";

import { useLocale } from "@/context/Locale";
import {
    buildSholatTimesUrl,
    extractPrayers,
    useLocalDateKey,
} from "@/lib/prayerTimes";
import { useSettings } from "@/lib/useSettings";
import {
    DEFAULT_PRAYER_LOCATION,
    readStoredUserLocation,
    USER_LOCATION_EVENT,
} from "@/lib/userLocation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    MdAccessTime,
    MdCalendarToday,
    MdNightsStay,
    MdOutlineWbSunny,
    MdWbSunny,
} from "react-icons/md";

const PRAYER_KEYS = [
    { key: "fajr", labelKey: "prayer.fajr", icon: MdNightsStay },
    { key: "dhuhr", labelKey: "prayer.dhuhr", icon: MdWbSunny },
    { key: "asr", labelKey: "prayer.asr", icon: MdOutlineWbSunny },
    { key: "maghrib", labelKey: "prayer.maghrib", icon: MdOutlineWbSunny },
    { key: "isha", labelKey: "prayer.isha", icon: MdNightsStay },
];

const DISPLAY_PRAYERS = [
    { key: "fajr", labelKey: "prayer.fajr", icon: MdNightsStay },
    { key: "sunrise", labelKey: "prayer.sunrise", icon: MdOutlineWbSunny },
    { key: "dhuhr", labelKey: "prayer.dhuhr", icon: MdWbSunny },
    { key: "asr", labelKey: "prayer.asr", icon: MdOutlineWbSunny },
    { key: "maghrib", labelKey: "prayer.maghrib", icon: MdOutlineWbSunny },
    { key: "isha", labelKey: "prayer.isha", icon: MdNightsStay },
];

const parseMinutes = (str) => {
    if (!str) return null;
    const m = str.match(/(\d+):(\d+)/);
    return m ? +m[1] * 60 + +m[2] : null;
};

const formatTime = (value) => {
    if (!value) return "--:--";
    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return value;
    return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const fmtCountdown = (secs) => {
    if (secs < 0) return "00:00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const fmtRemainingText = (t, secs, prayer) => {
    if (secs < 0) return t("prayer_countdown.passed", { prayer });
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h <= 0) {
        return t("prayer_countdown.remaining_m", {
            prayer,
            m: Math.max(1, m),
        });
    }
    return t("prayer_countdown.remaining_hm", { prayer, h, m });
};

const formatHijriDate = (date, lang) => {
    const locale = lang === "EN" ? "en-US" : "id-ID";
    try {
        return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-civil`, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
            .format(date)
            .replace(/\sAH$/i, " H");
    } catch {
        return "";
    }
};

export default function PrayerCountdownWidget({ basePath = "/jadwal-sholat" }) {
    const { t, lang } = useLocale();
    const { settings } = useSettings();
    const dateKey = useLocalDateKey();
    const [location, setLocation] = useState(null);
    const [prayers, setPrayers] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const stored = readStoredUserLocation();
        setLocation(stored || DEFAULT_PRAYER_LOCATION);

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

        let cancelled = false;
        setLoadFailed(false);
        fetch(
            buildSholatTimesUrl({
                lat: location.lat,
                lng: location.lng,
                method: settings.prayerMethod,
                madhab: settings.prayerMadhab,
                date: dateKey,
            }),
        )
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                const next = extractPrayers(d);
                setPrayers(next);
                setLoadFailed(!next);
            })
            .catch(() => {
                if (!cancelled) setLoadFailed(true);
            });

        return () => {
            cancelled = true;
        };
    }, [
        location?.lat,
        location?.lng,
        settings.prayerMethod,
        settings.prayerMadhab,
        dateKey,
    ]);

    useEffect(() => {
        if (!prayers) return undefined;
        const iv = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(iv);
    }, [prayers]);

    if (!prayers) {
        return (
            <div
                className='rounded-2xl border border-emerald-100 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-emerald-900/30 dark:bg-slate-900 dark:text-slate-400'
                role='status'
                aria-live='polite'
            >
                {loadFailed
                    ? t("prayer_countdown.error")
                    : t("prayer_countdown.loading")}
            </div>
        );
    }

    const nowMins = now.getHours() * 60 + now.getMinutes();

    let nextPrayer = null;
    let nextMins = null;
    for (const p of PRAYER_KEYS) {
        const mins = parseMinutes(prayers[p.key]);
        if (mins !== null && mins > nowMins) {
            nextPrayer = p;
            nextMins = mins;
            break;
        }
    }
    if (!nextPrayer) {
        // After Isha, next is Fajr tomorrow.
        nextPrayer = PRAYER_KEYS[0];
        const fajrMins = parseMinutes(prayers["fajr"]);
        nextMins = fajrMins !== null ? fajrMins + 24 * 60 : null;
    }

    const secsLeft =
        nextMins !== null ? (nextMins - nowMins) * 60 - now.getSeconds() : null;
    const hijriDate = formatHijriDate(now, lang);
    const nextPrayerLabel = t(nextPrayer.labelKey);

    return (
        <Link
            href={basePath}
            className='block rounded-2xl border border-emerald-100 bg-white px-4 py-4 text-slate-900 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-700'
            aria-label={t("prayer_countdown.today")}
        >
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'>
                    <MdAccessTime className='text-sm' />
                    <span className='truncate'>{location.label}</span>
                </div>
                <div className='text-right text-xs font-bold text-slate-700 dark:text-slate-200'>
                    {hijriDate ? (
                        <p className='flex items-center justify-end gap-1 text-emerald-700 dark:text-emerald-300'>
                            <MdCalendarToday className='text-sm' />
                            {hijriDate}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className='py-7 text-center'>
                <p className='text-xs font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300'>
                    {t("prayer_schedule.towards")} {nextPrayerLabel}
                </p>
                <p className='mt-2 text-5xl font-extrabold leading-none text-slate-950 tabular-nums dark:text-white'>
                    {formatTime(prayers[nextPrayer.key])}
                </p>
                <p className='mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400'>
                    {secsLeft !== null
                        ? fmtRemainingText(t, secsLeft, nextPrayerLabel)
                        : ""}
                </p>
                <div className='mt-4 inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-800 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200'>
                    <MdAccessTime className='text-emerald-700 dark:text-emerald-300' />
                    <span className='tabular-nums'>
                        {secsLeft !== null
                            ? fmtCountdown(secsLeft)
                            : "--:--:--"}
                    </span>
                </div>
            </div>

            <div className='border-t border-slate-100 pt-3 dark:border-slate-800'>
                <div className='grid grid-cols-3 gap-y-3 min-[390px]:grid-cols-6'>
                    {DISPLAY_PRAYERS.map((prayer) => {
                        const Icon = prayer.icon;
                        const isActive = prayer.key === nextPrayer.key;

                        return (
                            <div
                                key={prayer.key}
                                className={`flex min-w-0 flex-col items-center gap-1 text-center ${
                                    isActive
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : "text-slate-600 dark:text-slate-400"
                                }`}
                            >
                                <span className='text-[11px] font-extrabold leading-tight'>
                                    {t(prayer.labelKey)}
                                </span>
                                <Icon
                                    className={`text-2xl ${
                                        isActive
                                            ? "text-emerald-700 dark:text-emerald-300"
                                            : "text-slate-400 dark:text-slate-500"
                                    }`}
                                    aria-hidden='true'
                                />
                                <span className='text-[11px] font-extrabold tabular-nums leading-tight'>
                                    {isActive
                                        ? t("prayer_countdown.next")
                                        : formatTime(prayers[prayer.key])}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <p className='sr-only'>
                    {t("prayer_schedule.next")}: {nextPrayerLabel}{" "}
                    {formatTime(prayers[nextPrayer.key])}
                    {secsLeft !== null ? `, ${fmtCountdown(secsLeft)}` : ""}
                </p>
            </div>
        </Link>
    );
}
