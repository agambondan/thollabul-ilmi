"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/Locale";

const MONTHS = [
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

const PRAYERS = [
    { key: "Imsak", label: "Imsak" },
    { key: "Fajr", label: "Subuh" },
    { key: "Sunrise", label: "Syuruq" },
    { key: "Dhuhr", label: "Dzuhur" },
    { key: "Asr", label: "Ashar" },
    { key: "Maghrib", label: "Maghrib" },
    { key: "Isha", label: "Isya" },
];

const cleanTime = (t) => (t ? t.replace(/ \(.*\)$/, "") : "-");

const todayStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ImsakiyahPage = () => {
    const { t } = useLocale();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        fetch(
            `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=-6.2088&longitude=106.8456&method=11`,
        )
            .then((r) => r.json())
            .then((data) => {
                const days = data?.data ?? [];
                setRows(
                    days.map((day) => ({
                        date: day.date?.gregorian?.date ?? "",
                        day: day.date?.gregorian?.day ?? "",
                        timings: day.timings ?? {},
                    })),
                );
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [month, year]);

    const today = todayStr(now);

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

    return (
        <div className='p-6'>
            <div className='mb-5'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                    {t("imsakiyah.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                    {t("imsakiyah.subtitle")}
                </p>
            </div>

            {/* Month navigator */}
            <div className='flex items-center gap-3 mb-5'>
                <button
                    onClick={prevMonth}
                    className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors'
                >
                    ←
                </button>
                <span className='text-sm font-semibold text-gray-800 dark:text-gray-200 dark:text-white min-w-[140px] text-center'>
                    {MONTHS[month - 1]} {year}
                </span>
                <button
                    onClick={nextMonth}
                    className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors'
                >
                    →
                </button>
            </div>

            {loading && (
                <div className='text-center py-12 text-sm text-gray-400'>
                    {t("imsakiyah.loading")}
                </div>
            )}

            {error && !loading && (
                <div className='text-center py-12 text-sm text-red-500'>
                    {t("imsakiyah.error")}
                </div>
            )}

            {!loading && !error && rows.length > 0 && (
                <div className='overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700'>
                    <table className='w-full text-xs min-w-[640px]'>
                        <thead className='bg-emerald-700 text-white'>
                            <tr>
                                <th className='px-3 py-2.5 text-left font-medium w-10'>
                                    No
                                </th>
                                {PRAYERS.map((p) => (
                                    <th
                                        key={p.key}
                                        className='px-3 py-2.5 text-center font-medium'
                                    >
                                        {p.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className='bg-white dark:bg-slate-800 divide-y divide-gray-50 dark:divide-slate-700/50'>
                            {rows.map((row) => {
                                const isToday =
                                    `${year}-${String(month).padStart(2, "0")}-${String(row.day).padStart(2, "0")}` ===
                                    today;
                                return (
                                    <tr
                                        key={row.date}
                                        className={
                                            isToday
                                                ? "bg-emerald-50 dark:bg-emerald-900/20"
                                                : "hover:bg-gray-50 dark:hover:bg-slate-700"
                                        }
                                    >
                                        <td
                                            className={`px-3 py-2 font-semibold ${
                                                isToday
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : "text-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            {row.day}
                                            {isToday && (
                                                <span className='ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle'></span>
                                            )}
                                        </td>
                                        {PRAYERS.map((p) => (
                                            <td
                                                key={p.key}
                                                className={`px-3 py-2 text-center ${
                                                    p.key === "Imsak"
                                                        ? "font-semibold text-amber-600 dark:text-amber-400"
                                                        : isToday
                                                          ? "text-emerald-700 dark:text-emerald-400"
                                                          : "text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                {cleanTime(row.timings[p.key])}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ImsakiyahPage;
