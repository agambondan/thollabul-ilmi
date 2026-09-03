"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import {
    buildSholatTimesUrl,
    PRAYER_MADHABS,
    PRAYER_METHODS,
    useLocalDateKey,
} from "@/lib/prayerTimes";
import { ADZAN_SOUNDS, useSettings } from "@/lib/useSettings";
import { requestAndStoreUserLocation } from "@/lib/userLocation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BsBell, BsBellFill, BsGeoAlt } from "react-icons/bs";
import { MdAccessTime, MdTimer } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const PRAYERS = [
    { key: "imsak", labelKey: "prayer.imsak", arabic: "الإمساك", info: true },
    { key: "fajr", labelKey: "prayer.fajr", arabic: "الفجر" },
    {
        key: "sunrise",
        labelKey: "prayer.sunrise",
        arabic: "الشروق",
        info: true,
    },
    { key: "dhuhr", labelKey: "prayer.dhuhr", arabic: "الظهر" },
    { key: "asr", labelKey: "prayer.asr", arabic: "العصر" },
    { key: "maghrib", labelKey: "prayer.maghrib", arabic: "المغرب" },
    { key: "isha", labelKey: "prayer.isha", arabic: "العشاء" },
];

const CITIES = [
    { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
    { name: "Surabaya", lat: -7.2575, lng: 112.7521 },
    { name: "Bandung", lat: -6.9175, lng: 107.6191 },
    { name: "Medan", lat: 3.5952, lng: 98.6722 },
    { name: "Makassar", lat: -5.1477, lng: 119.4327 },
    { name: "Yogyakarta", lat: -7.7956, lng: 110.3695 },
    { name: "Semarang", lat: -7.0051, lng: 110.4381 },
    { name: "Malang", lat: -7.9797, lng: 112.6304 },
    { name: "Palembang", lat: -2.9761, lng: 104.7754 },
    { name: "Banjarmasin", lat: -3.3194, lng: 114.5942 },
    { name: "Denpasar", lat: -8.6705, lng: 115.2126 },
    { name: "Padang", lat: -0.9471, lng: 100.4172 },
    { name: "Pekanbaru", lat: 0.5071, lng: 101.4478 },
    { name: "Pontianak", lat: -0.0263, lng: 109.3425 },
    { name: "Manado", lat: 1.4748, lng: 124.8421 },
];

const REMINDER_LEAD_OPTIONS = [0, 5, 10, 15, 30];
const PRAYER_KEYS_FOR_REMINDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const parseTimeStr = (str) => {
    if (!str) return null;
    const m = str.match(/(\d+):(\d+)/);
    if (!m) return null;
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        +m[1],
        +m[2],
    );
};

export default function JadwalSholatPage() {
    const { lang, t } = useLocale();
    const { settings, updateSetting } = useSettings();
    const dateKey = useLocalDateKey();
    const method = settings.prayerMethod;
    const madhab = settings.prayerMadhab;
    const setMethod = (value) => updateSetting("prayerMethod", value);
    const setMadhab = (value) => updateSetting("prayerMadhab", value);
    const [city, setCity] = useState(CITIES[0]);
    const [prayers, setPrayers] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [now, setNow] = useState(new Date());
    const [geoLabel, setGeoLabel] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [gpsStatus, setGpsStatus] = useState("idle");
    const [countdown, setCountdown] = useState("");
    const [notifGranted, setNotifGranted] = useState(
        () =>
            typeof Notification !== "undefined" &&
            Notification.permission === "granted",
    );
    const gpsTriedRef = useRef(false);
    const audioRef = useRef(null);
    const lastNotifRef = useRef("");
    const lastReminderRef = useRef("");
    const getLeadForPrayer = useCallback(
        (key) => {
            const perPrayer = settings.adzanReminderLeadByPrayer?.[key];
            if (REMINDER_LEAD_OPTIONS.includes(perPrayer)) return perPrayer;
            return REMINDER_LEAD_OPTIONS.includes(settings.adzanReminderLead)
                ? settings.adzanReminderLead
                : 10;
        },
        [settings.adzanReminderLead, settings.adzanReminderLeadByPrayer],
    );
    const adzanOptions =
        settings.adzanSound?.startsWith("custom:") && settings.adzanSoundUrl
            ? [
                  ...ADZAN_SOUNDS,
                  {
                      value: settings.adzanSound,
                      label: settings.adzanSoundLabel || "Upload Adzan",
                      src: settings.adzanSoundUrl,
                  },
              ]
            : ADZAN_SOUNDS;

    const fetchByCoords = (lat, lng, label) => {
        setLoading(true);
        setError("");
        fetch(buildSholatTimesUrl({ lat, lng, method, madhab, date: dateKey }))
            .then((r) => r.json())
            .then((d) => {
                const data = d?.data ?? d;
                if (data?.prayers) {
                    setPrayers(data.prayers);
                    setGeoLabel(label);
                } else {
                    setError(t("prayer_schedule.load_error"));
                }
            })
            .catch(() => setError(t("prayer_schedule.network_error")))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const iv = setInterval(() => setNow(new Date()), 15000);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (gpsTriedRef.current || gpsStatus !== "idle") return;
        if (!navigator.geolocation) return;
        gpsTriedRef.current = true;
        queueMicrotask(() => setGpsStatus("detecting"));
        requestAndStoreUserLocation({ fallbackLabel: t("geo.my_location") })
            .then((result) => {
                if (result.ok && result.location) {
                    fetchByCoords(
                        result.location.lat,
                        result.location.lng,
                        result.location.label,
                    );
                    setGpsStatus("done");
                    return;
                }
                setGpsStatus("error");
            })
            .catch(() => setGpsStatus("error"));
    }, [city.lat, city.lng]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!prayers) return;
        const tick = () => {
            const n = new Date();
            for (const p of PRAYERS.filter((p) => !p.info)) {
                const pt = parseTimeStr(prayers[p.key]);
                if (pt && pt > n) {
                    const diff = pt - n;
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    if (
                        diff < 10000 &&
                        diff >= 0 &&
                        settings.notifAdzan &&
                        lastNotifRef.current !== p.key
                    ) {
                        lastNotifRef.current = p.key;
                        if (audioRef.current) {
                            audioRef.current.play().catch(() => {
                                const play = () =>
                                    audioRef.current?.play().catch(() => {});
                                document.addEventListener("click", play, {
                                    once: true,
                                });
                            });
                        }
                        const nTitle = `${t("prayer_schedule.adzan")} ${t(p.labelKey)}`;
                        const nBody = `${t("prayer_schedule.adzan_body")} ${t(p.labelKey)}`;
                        if (notifGranted) {
                            new Notification(nTitle, {
                                body: nBody,
                                icon: "/icon.png",
                            });
                        }
                        if (
                            "serviceWorker" in navigator &&
                            navigator.serviceWorker.controller
                        ) {
                            navigator.serviceWorker.controller.postMessage({
                                type: "ADZAN_NOTIFICATION",
                                title: nTitle,
                                body: nBody,
                                url: "/jadwal-sholat",
                            });
                        }
                    }
                    const lead = getLeadForPrayer(p.key);
                    if (
                        settings.notifAdzan &&
                        lead > 0 &&
                        diff <= lead * 60 * 1000 &&
                        lastReminderRef.current !== p.key
                    ) {
                        lastReminderRef.current = p.key;
                        const rTitle = `${t("prayer_schedule.reminder_title")} ${t(p.labelKey)}`;
                        const rBody = `${t("prayer_schedule.reminder_body")} ${lead} ${t("prayer_schedule.minutes")}`;
                        if (notifGranted) {
                            new Notification(rTitle, {
                                body: rBody,
                                icon: "/icon.png",
                            });
                        }
                        if (
                            "serviceWorker" in navigator &&
                            navigator.serviceWorker.controller
                        ) {
                            navigator.serviceWorker.controller.postMessage({
                                type: "ADZAN_NOTIFICATION",
                                title: rTitle,
                                body: rBody,
                                url: "/jadwal-sholat",
                            });
                        }
                    }
                    setCountdown(
                        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
                    );
                    return;
                }
            }
            setCountdown("");
            lastNotifRef.current = "";
            lastReminderRef.current = "";
        };
        tick();
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [
        prayers,
        settings.notifAdzan,
        settings.adzanSound,
        settings.adzanReminderLead,
        settings.adzanReminderLeadByPrayer,
        notifGranted,
        t,
        getLeadForPrayer,
    ]);

    useEffect(() => {
        Promise.resolve().then(() =>
            fetchByCoords(city.lat, city.lng, city.name),
        );
    }, [city, method, madhab, dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGeo = () => {
        if (!navigator.geolocation) {
            setError(t("geo.unsupported"));
            return;
        }
        setLoading(true);
        requestAndStoreUserLocation({ fallbackLabel: t("geo.my_location") })
            .then((result) => {
                if (result.ok && result.location) {
                    fetchByCoords(
                        result.location.lat,
                        result.location.lng,
                        result.location.label,
                    );
                    return;
                }
                setLoading(false);
                setError(t("geo.permission_error"));
            })
            .catch(() => {
                setLoading(false);
                setError(t("geo.permission_error"));
            });
    };

    const nextPrayer = (() => {
        if (!prayers) return null;
        for (const p of PRAYERS.filter((p) => !p.info)) {
            const pt = parseTimeStr(prayers[p.key]);
            if (pt && pt > now) return p.key;
        }
        return "fajr";
    })();

    const todayStr = now.toLocaleDateString(lang === "EN" ? "en-US" : "id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <ContentWidth
                compact='max-w-lg'
                className='flex-1 px-4 pt-navbar pb-8'
            >
                {/* Header */}
                <div className='mb-6 text-center'>
                    <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                        <MdAccessTime className='text-3xl text-emerald-600 dark:text-emerald-400' />
                    </div>
                    <h1 className='text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1'>
                        {t("prayer_schedule.title")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {todayStr}
                    </p>
                </div>

                {/* Location picker */}
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-slate-700'>
                    <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3'>
                        {t("prayer_schedule.pick_city")}
                    </p>
                    <div className='flex gap-2'>
                        <button
                            onClick={handleGeo}
                            className='flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap'
                        >
                            <BsGeoAlt />
                            {t("geo.my_location")}
                        </button>
                        <select
                            value={city.name}
                            onChange={(e) => {
                                const found = CITIES.find(
                                    (c) => c.name === e.target.value,
                                );
                                if (found) {
                                    setGeoLabel("");
                                    setCity(found);
                                }
                            }}
                            className='flex-1 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                        >
                            {CITIES.map((c) => (
                                <option key={c.name} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {geoLabel && (
                        <p className='text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1'>
                            <BsGeoAlt /> {geoLabel}
                        </p>
                    )}
                    {gpsStatus === "detecting" && (
                        <p className='text-xs text-gray-400 mt-2 flex items-center gap-1'>
                            <span className='w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                            {t("geo.auto_detecting") ?? "Mendeteksi lokasi..."}
                        </p>
                    )}

                    {/* Method/Madhab settings toggle */}
                    <button
                        type='button'
                        onClick={() => setShowSettings((s) => !s)}
                        className='mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("prayer_schedule.settings") ?? "Pengaturan metode"}{" "}
                        {showSettings ? "▲" : "▼"}
                    </button>
                    {showSettings && (
                        <div className='mt-3 grid grid-cols-2 gap-3'>
                            <div>
                                <label
                                    htmlFor='page-method'
                                    className='block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
                                >
                                    {t("prayer_schedule.method") ??
                                        "Metode Hisab"}
                                </label>
                                <select
                                    id='page-method'
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className='w-full border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                                >
                                    {PRAYER_METHODS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor='page-madhab'
                                    className='block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
                                >
                                    {t("prayer_schedule.madhab") ??
                                        "Madhab Asar"}
                                </label>
                                <select
                                    id='page-madhab'
                                    value={madhab}
                                    onChange={(e) => setMadhab(e.target.value)}
                                    className='w-full border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                                >
                                    {PRAYER_MADHABS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {t(m.labelKey)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    {showSettings && (
                        <div className='mt-3 flex items-center gap-3'>
                            {!notifGranted &&
                                typeof Notification !== "undefined" &&
                                Notification.permission !== "denied" && (
                                    <button
                                        onClick={() =>
                                            Notification.requestPermission().then(
                                                (p) => {
                                                    if (p === "granted")
                                                        setNotifGranted(true);
                                                },
                                            )
                                        }
                                        className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium'
                                    >
                                        <BsBell />{" "}
                                        {t("prayer_schedule.enable_notif") ??
                                            "Aktifkan Notifikasi"}
                                    </button>
                                )}
                            <button
                                onClick={() =>
                                    updateSetting(
                                        "notifAdzan",
                                        !settings.notifAdzan,
                                    )
                                }
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${settings.notifAdzan ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300"}`}
                            >
                                {settings.notifAdzan ? (
                                    <BsBellFill />
                                ) : (
                                    <BsBell />
                                )}
                                {settings.notifAdzan
                                    ? (t("prayer_schedule.adzan_on") ??
                                      "Adzan On")
                                    : (t("prayer_schedule.adzan_off") ??
                                      "Adzan Off")}
                            </button>
                            <select
                                value={settings.adzanSound}
                                onChange={(e) => {
                                    const next = adzanOptions.find(
                                        (s) => s.value === e.target.value,
                                    );
                                    if (!next) return;
                                    updateSetting("adzanSound", next.value);
                                    updateSetting("adzanSoundUrl", next.src);
                                    updateSetting(
                                        "adzanSoundLabel",
                                        next.label,
                                    );
                                }}
                                className='bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs text-gray-900 dark:text-white rounded-lg px-2 py-1.5 focus:ring-emerald-500'
                                aria-label={t("prayer.adhan_sound")}
                            >
                                {adzanOptions.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {showSettings && (
                        <div className='mt-3 flex items-center gap-3'>
                            <span className='text-xs text-gray-500 dark:text-gray-400'>
                                {t("prayer_schedule.reminder_lead")}
                            </span>
                            <select
                                value={settings.adzanReminderLead ?? 10}
                                onChange={(e) =>
                                    updateSetting(
                                        "adzanReminderLead",
                                        Number(e.target.value),
                                    )
                                }
                                className='bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs text-gray-900 dark:text-white rounded-lg px-2 py-1.5 focus:ring-emerald-500'
                                aria-label={t("prayer.reminder_lead")}
                            >
                                {REMINDER_LEAD_OPTIONS.map((m) => (
                                    <option key={m} value={m}>
                                        {m === 0
                                            ? t("prayer_schedule.at_time")
                                            : `${m} ${t("prayer_schedule.minutes")}`}
                                    </option>
                                ))}
                            </select>
                            {PRAYER_KEYS_FOR_REMINDER.map((key) => {
                                const row = PRAYERS.find((p) => p.key === key);
                                const label = row ? t(row.labelKey) : key;
                                const perPrayer =
                                    settings.adzanReminderLeadByPrayer?.[key];
                                return (
                                    <select
                                        key={key}
                                        value={perPrayer ?? "global"}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            const next = {
                                                ...(settings.adzanReminderLeadByPrayer ||
                                                    {}),
                                            };
                                            if (v === "global")
                                                delete next[key];
                                            else next[key] = Number(v);
                                            updateSetting(
                                                "adzanReminderLeadByPrayer",
                                                next,
                                            );
                                        }}
                                        className='bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs text-gray-900 dark:text-white rounded-lg px-2 py-1.5 focus:ring-emerald-500'
                                        aria-label={t(
                                            "prayer.reminder_lead_prayer",
                                            { prayer: key },
                                        )}
                                    >
                                        <option value='global'>
                                            {label}{" "}
                                            {t("prayer_schedule.global")}
                                        </option>
                                        {REMINDER_LEAD_OPTIONS.map((m) => (
                                            <option key={m} value={m}>
                                                {label}{" "}
                                                {m === 0
                                                    ? t(
                                                          "prayer_schedule.at_time",
                                                      )
                                                    : `${m} ${t("prayer_schedule.minutes")}`}
                                            </option>
                                        ))}
                                    </select>
                                );
                            })}
                            <span className='sr-only'>
                                Per-prayer reminder config
                            </span>
                        </div>
                    )}
                </div>

                {/* Current time display */}
                <div className='text-center mb-4'>
                    <span className='text-4xl font-extrabold text-emerald-800 dark:text-emerald-200 tabular-nums'>
                        {now.toLocaleTimeString(
                            lang === "EN" ? "en-US" : "id-ID",
                            {
                                hour: "2-digit",
                                minute: "2-digit",
                            },
                        )}
                    </span>
                    {countdown && nextPrayer && (
                        <div className='mt-2 flex items-center justify-center gap-2'>
                            <MdTimer className='text-emerald-500 dark:text-emerald-400 text-lg' />
                            <span className='text-sm text-gray-500 dark:text-gray-400'>
                                {t("prayer_schedule.towards") ?? "Menuju"}{" "}
                                {t(
                                    PRAYERS.find((p) => p.key === nextPrayer)
                                        ?.labelKey,
                                )}{" "}
                            </span>
                            <span className='text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums'>
                                {countdown}
                            </span>
                        </div>
                    )}
                    {!countdown && prayers && !nextPrayer && (
                        <p className='mt-1 text-xs text-gray-400'>
                            {t("prayer_schedule.all_passed") ??
                                "Semua waktu sholat hari ini telah berlalu"}
                        </p>
                    )}
                </div>

                {/* Timings */}
                {loading && (
                    <div className='text-center py-12'>
                        <div className='w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {t("prayer_schedule.loading")}
                        </p>
                    </div>
                )}
                {error && !loading && (
                    <div className='text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-2xl'>
                        <p className='text-red-600 dark:text-red-400 text-sm'>
                            {error}
                        </p>
                    </div>
                )}
                {!loading && !error && prayers && (
                    <div className='space-y-2'>
                        {PRAYERS.map((p) => {
                            const isNext = p.key === nextPrayer && !p.info;
                            const time = prayers[p.key] ?? "--:--";
                            return (
                                <div
                                    key={p.key}
                                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                                        isNext
                                            ? "bg-emerald-600 dark:bg-emerald-700 border-emerald-500 shadow-lg scale-[1.01]"
                                            : p.info
                                              ? "bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 opacity-70"
                                              : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                                    }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        {isNext && (
                                            <span className='text-[10px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full'>
                                                {t("prayer_schedule.next")}
                                            </span>
                                        )}
                                        <div>
                                            <p
                                                className={`font-bold text-sm ${isNext ? "text-white" : "text-gray-800 dark:text-gray-100"}`}
                                            >
                                                {t(p.labelKey)}
                                            </p>
                                            <p
                                                className={`text-xs ${isNext ? "text-emerald-200" : "text-gray-400"}`}
                                                style={{
                                                    fontFamily: "Amiri, serif",
                                                }}
                                            >
                                                {p.arabic}
                                            </p>
                                        </div>
                                    </div>
                                    <p
                                        className={`text-xl font-extrabold tabular-nums ${
                                            isNext
                                                ? "text-white"
                                                : "text-emerald-700 dark:text-emerald-300"
                                        }`}
                                    >
                                        {time}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                <p className='text-center text-xs text-gray-400 mt-6'>
                    {t("prayer_schedule.source_note_be") ??
                        `${PRAYER_METHODS.find((m) => m.value === method)?.label} · ${t(PRAYER_MADHABS.find((m) => m.value === madhab)?.labelKey)}`}
                </p>
            </ContentWidth>
            {settings.notifAdzan && (
                <audio
                    ref={audioRef}
                    src={
                        settings.adzanSoundUrl ||
                        ADZAN_SOUNDS.find(
                            (s) => s.value === settings.adzanSound,
                        )?.src ||
                        ADZAN_SOUNDS[0].src
                    }
                    preload='auto'
                />
            )}
        </main>
    );
}
