"use client";

import { useEffect, useState } from "react";

import { toLocalISODate } from "@/lib/date";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const PRAYER_METHODS = [
    { value: "kemenag", label: "Kemenag (Indonesia)" },
    { value: "adhango", label: "AdhanGo (MWL)" },
    { value: "jakim", label: "JAKIM (Malaysia)" },
    { value: "mwl", label: "MWL" },
    { value: "isna", label: "ISNA (Amerika)" },
    { value: "egypt", label: "Egypt" },
    { value: "makkah", label: "Umm Al-Qura" },
    { value: "karachi", label: "Karachi" },
];

export const PRAYER_MADHABS = [
    { value: "shafi", labelKey: "prayer_schedule.madhab_shafi" },
    { value: "hanafi", labelKey: "prayer_schedule.madhab_hanafi" },
];

export const DEFAULT_PRAYER_METHOD = "kemenag";
export const DEFAULT_PRAYER_MADHAB = "shafi";

export const PRAYER_METHOD_VALUES = PRAYER_METHODS.map((m) => m.value);
export const PRAYER_MADHAB_VALUES = PRAYER_MADHABS.map((m) => m.value);

export const normalizePrayerMethod = (value) =>
    PRAYER_METHOD_VALUES.includes(value) ? value : DEFAULT_PRAYER_METHOD;

export const normalizePrayerMadhab = (value) =>
    PRAYER_MADHAB_VALUES.includes(value) ? value : DEFAULT_PRAYER_MADHAB;

/**
 * Every caller of /api/v1/sholat-times must build its URL here. Two screens
 * used to hardcode `kemenag`/`shafi` while /jadwal-sholat let the user pick,
 * so a Hanafi user saw Ashar an hour apart depending on which screen they
 * opened.
 */
export const buildSholatTimesUrl = ({ lat, lng, method, madhab, date }) => {
    const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        method: normalizePrayerMethod(method),
        madhab: normalizePrayerMadhab(madhab),
        date: date || toLocalISODate(),
    });
    return `${API_URL}/api/v1/sholat-times?${params.toString()}`;
};

export const extractPrayers = (payload) =>
    payload?.data?.prayers ?? payload?.prayers ?? null;

/**
 * Returns today's local date key and re-renders when the calendar day rolls
 * over, so a tab left open overnight (or a PWA resumed the next morning) does
 * not keep yesterday's schedule. Also re-checks whenever the tab becomes
 * visible again, since timers are throttled in background tabs.
 */
export const useLocalDateKey = () => {
    const [dateKey, setDateKey] = useState(() => toLocalISODate());

    useEffect(() => {
        let timeoutId;

        const sync = () => {
            setDateKey((current) => {
                const next = toLocalISODate();
                return next === current ? current : next;
            });
        };

        const scheduleMidnight = () => {
            const now = new Date();
            const nextMidnight = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0,
                0,
                5,
            );
            timeoutId = setTimeout(() => {
                sync();
                scheduleMidnight();
            }, nextMidnight.getTime() - now.getTime());
        };

        const handleVisibility = () => {
            if (document.visibilityState === "visible") sync();
        };

        scheduleMidnight();
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", sync);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("focus", sync);
        };
    }, []);

    return dateKey;
};
