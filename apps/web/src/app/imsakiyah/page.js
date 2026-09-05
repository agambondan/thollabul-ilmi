"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";
import { BsCalendar3, BsGeoAlt } from "react-icons/bs";
import { MdAccessTime } from "react-icons/md";

const CITIES = [
    { label: "Jakarta", lat: -6.2088, lng: 106.8456 },
    { label: "Bandung", lat: -6.9175, lng: 107.6191 },
    { label: "Surabaya", lat: -7.2575, lng: 112.7521 },
    { label: "Yogyakarta", lat: -7.7956, lng: 110.3695 },
    { label: "Semarang", lat: -6.9932, lng: 110.4203 },
    { label: "Medan", lat: 3.5952, lng: 98.6722 },
    { label: "Makassar", lat: -5.1477, lng: 119.4327 },
    { label: "Palembang", lat: -2.9761, lng: 104.7754 },
    { label: "Denpasar", lat: -8.6705, lng: 115.2126 },
    { label: "Padang", lat: -0.9471, lng: 100.4172 },
    { label: "Malang", lat: -7.9666, lng: 112.6326 },
    { label: "Solo", lat: -7.5755, lng: 110.8243 },
    { label: "Bogor", lat: -6.5971, lng: 106.806 },
    { label: "Aceh", lat: 5.5483, lng: 95.3238 },
    { label: "Pontianak", lat: -0.0263, lng: 109.3425 },
];

const DAYS_ID = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
];
const DAYS_EN = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
const MONTHS_ID = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];
const MONTHS_EN = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const stripTz = (t) => (t ? t.split(" ")[0] : "-");

export default function ImsakiyahPage() {
    const { lang, t } = useLocale();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [cityIndex, setCityIndex] = useState(0);
    const [useGps, setUseGps] = useState(false);
    const [gpsCoords, setGpsCoords] = useState(null);
    const [gpsLabel, setGpsLabel] = useState("");
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchGps = () => {
        if (!navigator.geolocation) {
            setError(t("imsakiyah.gps_unavailable"));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setGpsLabel(t("imsakiyah.gps_location"));
                setUseGps(true);
            },
            () => setError(t("imsakiyah.gps_error")),
        );
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const lat = useGps && gpsCoords ? gpsCoords.lat : CITIES[cityIndex].lat;
                const lng = useGps && gpsCoords ? gpsCoords.lng : CITIES[cityIndex].lng;
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
                
                let data = null;
                try {
                    const internalRes = await fetch(
                        `${apiUrl}/api/v1/imsakiyah?lat=${lat}&lng=${lng}&year=${year}&month=${month}`,
                    );
                    if (internalRes.ok) {
                        const json = await internalRes.json();
                        if (json.data?.schedule) {
                            data = json.data.schedule.map((day) => ({
                                dateStr: day.date,
                                imsak: day.prayers?.imsak || "-",
                                fajr: day.prayers?.fajr || "-",
                                sunrise: day.prayers?.sunrise || "-",
                                dhuhr: day.prayers?.dhuhr || "-",
                                asr: day.prayers?.asr || "-",
                                maghrib: day.prayers?.maghrib || "-",
                                isha: day.prayers?.isha || "-",
                            }));
                        }
                    }
                } catch {
                    // Fallback to Aladhan if internal is unreachable
                }

                if (!data) {
                    const aladhanUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=11`;
                    const res = await fetch(aladhanUrl);
                    const json = await res.json();
                    if (json.code === 200 && json.data) {
                        data = json.data.map((day) => {
                            const dStr = day.date?.gregorian?.date || "";
                            const parts = dStr.split("-");
                            const formatted =
                                parts.length === 3
                                    ? `${parts[2]}-${parts[1]}-${parts[0]}`
                                    : dStr;
                            return {
                                dateStr: formatted,
                                imsak: stripTz(day.timings?.Imsak),
                                fajr: stripTz(day.timings?.Fajr),
                                sunrise: stripTz(day.timings?.Sunrise),
                                dhuhr: stripTz(day.timings?.Dhuhr),
                                asr: stripTz(day.timings?.Asr),
                                maghrib: stripTz(day.timings?.Maghrib),
                                isha: stripTz(day.timings?.Isha),
                            };
                        });
                    }
                }

                if (data) {
                    setSchedule(data);
                } else {
                    setError(t("imsakiyah.load_error"));
                }
            } catch {
                setError(t("imsakiyah.load_exception"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [year, month, cityIndex, useGps, gpsCoords, t]);

    const prevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear((y) => y - 1);
        } else setMonth((m) => m - 1);
    };

    const nextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear((y) => y + 1);
        } else setMonth((m) => m + 1);
    };

    const cityName = useGps ? gpsLabel : CITIES[cityIndex].label;
    const monthNames = lang === "EN" ? MONTHS_EN : MONTHS_ID;
    const dayNames = lang === "EN" ? DAYS_EN : DAYS_ID;

    return (
        <main className='min-h-screen bg-parchment-50 dark:bg-slate-900 pb-12'>
            {/* Header */}
            <div className='bg-gradient-to-br from-emerald-900 to-emerald-800 text-white px-6 pt-28 pb-8'>
                <ContentWidth compact='max-w-5xl'>
                    <div className='flex items-center gap-2 mb-1'>
                        <BsCalendar3 className='text-emerald-300' />
                        <span className='text-xs font-semibold uppercase tracking-widest text-emerald-300'>
                            {t("imsakiyah.schedule_label")}
                        </span>
                    </div>
                    <h1 className='text-2xl font-bold mb-1'>
                        {t("imsakiyah.title")}
                    </h1>
                    <p className='text-sm text-emerald-200'>
                        {t("imsakiyah.subtitle")} — {cityName},{" "}
                        {monthNames[month - 1]} {year}
                    </p>
                </ContentWidth>
            </div>

            <ContentWidth compact='max-w-5xl' className='px-4 pt-6 space-y-5'>
                {/* Controls */}
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 space-y-4'>
                    {/* Month navigator */}
                    <div className='flex items-center gap-3'>
                        <button
                            onClick={prevMonth}
                            className='px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                        >
                            ‹
                        </button>
                        <span className='flex-1 text-center font-semibold text-gray-800 dark:text-gray-200 dark:text-white text-sm'>
                            {monthNames[month - 1]} {year}
                        </span>
                        <button
                            onClick={nextMonth}
                            className='px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                        >
                            ›
                        </button>
                    </div>

                    {/* City picker */}
                    <div className='flex flex-wrap gap-2 items-center'>
                        <select
                            value={useGps ? -1 : cityIndex}
                            aria-label='Pilih Kota Imsakiyah'
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                if (v === -1) return;
                                setCityIndex(v);
                                setUseGps(false);
                            }}
                            className='text-sm border border-gray-200 dark:border-gray-700 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        >
                            {useGps && <option value={-1}>{gpsLabel}</option>}
                            {CITIES.map((c, i) => (
                                <option key={c.label} value={i}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={fetchGps}
                            className='flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800'
                        >
                            <BsGeoAlt />
                            GPS
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400'>
                        {error}
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-12 text-center'>
                        <MdAccessTime className='text-4xl text-emerald-400 mx-auto mb-3 animate-spin' />
                        <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                            {t("imsakiyah.loading")}
                        </p>
                    </div>
                ) : schedule.length > 0 ? (
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-xs'>
                                <thead>
                                    <tr className='bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'>
                                        <th className='px-3 py-3 text-left font-semibold whitespace-nowrap'>
                                            {t("common.date_short")}
                                        </th>
                                        <th className='px-3 py-3 text-left font-semibold whitespace-nowrap'>
                                            {t("common.day")}
                                        </th>
                                        <th className='px-3 py-3 text-center font-semibold whitespace-nowrap bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'>
                                            Imsak
                                        </th>
                                        <th className='px-3 py-3 text-center font-semibold whitespace-nowrap'>
                                            {t("prayer.fajr")}
                                        </th>
                                        <th className='px-3 py-3 text-center font-semibold whitespace-nowrap text-gray-400'>
                                            {t("prayer.sunrise")}
                                        </th>
                                        <th className='px-3 py-3 text-center font-semibold whitespace-nowrap'>
                                            {t("prayer.dhuhr")}
                                        </th>
                                        <th className='px-3 py-3 text-center font-semibold whitespace-nowrap'>
                                            {t("prayer.asr")}
                                        </th>
                                        <th className='px-3 py-3 text-center font-semibold whitespace-nowrap bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'>
                                            Maghrib
                                        </th>
                                        <th className='px-3 py-3 text-center font-semibold whitespace-nowrap'>
                                            {t("prayer.isha")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                                    {schedule.map((day, idx) => {
                                        const dateParts = (day.dateStr || "").split("-");
                                        const dateObj =
                                            dateParts.length === 3
                                                ? new Date(
                                                      Number(dateParts[0]),
                                                      Number(dateParts[1]) - 1,
                                                      Number(dateParts[2]),
                                                  )
                                                : null;
                                        const dayName = dateObj
                                            ? dayNames[dateObj.getDay()]
                                            : "-";
                                        const dayNum = dateParts[2] || String(idx + 1);
                                        const isJumat = dateObj?.getDay() === 5;
                                        const isToday =
                                            dateObj &&
                                            dateObj.getDate() ===
                                                now.getDate() &&
                                            dateObj.getMonth() ===
                                                now.getMonth() &&
                                            dateObj.getFullYear() ===
                                                now.getFullYear();

                                        return (
                                            <tr
                                                key={day.dateStr || idx}
                                                className={`transition-colors ${
                                                    isToday
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                                                        : isJumat
                                                          ? "bg-amber-50/40 dark:bg-amber-900/10"
                                                          : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                                }`}
                                            >
                                                <td className='px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-200 dark:text-white whitespace-nowrap'>
                                                    {isToday ? (
                                                        <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold'>
                                                            {dayNum}
                                                        </span>
                                                    ) : (
                                                        dayNum
                                                    )}
                                                </td>
                                                <td
                                                    className={`px-3 py-2.5 whitespace-nowrap ${
                                                        isJumat
                                                            ? "text-amber-700 dark:text-amber-400 font-medium"
                                                            : "text-gray-600 dark:text-gray-300"
                                                    }`}
                                                >
                                                    {dayName}
                                                </td>
                                                <td className='px-3 py-2.5 text-center font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap bg-amber-50/50 dark:bg-amber-900/10'>
                                                    {day.imsak}
                                                </td>
                                                <td className='px-3 py-2.5 text-center text-gray-700 dark:text-gray-200 whitespace-nowrap'>
                                                    {day.fajr}
                                                </td>
                                                <td className='px-3 py-2.5 text-center text-gray-400 whitespace-nowrap'>
                                                    {day.sunrise}
                                                </td>
                                                <td className='px-3 py-2.5 text-center text-gray-700 dark:text-gray-200 whitespace-nowrap'>
                                                    {day.dhuhr}
                                                </td>
                                                <td className='px-3 py-2.5 text-center text-gray-700 dark:text-gray-200 whitespace-nowrap'>
                                                    {day.asr}
                                                </td>
                                                <td className='px-3 py-2.5 text-center font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap bg-rose-50/50 dark:bg-rose-900/10'>
                                                    {day.maghrib}
                                                </td>
                                                <td className='px-3 py-2.5 text-center text-gray-700 dark:text-gray-200 whitespace-nowrap'>
                                                    {day.isha}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className='px-4 py-3 border-t border-gray-100 dark:border-slate-700 text-[11px] text-gray-400'>
                            {t("common.source")}: aladhan.com ·{" "}
                            {t("imsakiyah.method")}: Kemenag RI (11) ·{" "}
                            {cityName}
                        </div>
                    </div>
                ) : null}
            </ContentWidth>
        </main>
    );
}
