"use client";

import { useLocale } from "@/context/Locale";
import { hijriApi } from "@/lib/api";
import { getPuasaSunnahForDate, PUASA_SUNNAH } from "@/lib/puasaSunnah";
import { useEffect, useState } from "react";
import { BsCalendarCheck, BsInfoCircle } from "react-icons/bs";

const dayNamesId = [
    "Ahad",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
];
const dayNamesEn = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const formatDate = (date, lang) =>
    new Intl.DateTimeFormat(lang === "EN" ? "en-US" : "id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(date);

const labelOf = (item, lang) => (lang === "EN" ? item.label_en : item.label_id);

export default function PuasaSunnahPanel() {
    const { t, lang } = useLocale();
    const [todayHijri, setTodayHijri] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upcoming, setUpcoming] = useState([]);

    useEffect(() => {
        hijriApi
            .today()
            .then((r) => r.json())
            .then(async (data) => {
                const h = data?.hijri ?? data;
                setTodayHijri(h);
                await buildUpcoming(h);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const buildUpcoming = async (currentHijri) => {
        const list = [];
        const today = new Date();
        for (let offset = 1; offset <= 30; offset++) {
            const d = new Date(today);
            d.setDate(today.getDate() + offset);
            const estimatedHijriDay =
                ((Number(currentHijri.day) + offset - 1) % 30) + 1;
            const monthsAdvanced = Math.floor(
                (Number(currentHijri.day) + offset - 1) / 30,
            );
            const estimatedHijriMonth =
                ((Number(currentHijri.month) - 1 + monthsAdvanced) % 12) + 1;
            const matches = getPuasaSunnahForDate(d, {
                day: estimatedHijriDay,
                month: estimatedHijriMonth,
            });
            if (matches.length > 0) {
                list.push({
                    date: d,
                    hijriDay: estimatedHijriDay,
                    hijriMonth: estimatedHijriMonth,
                    matches,
                });
            }
            if (list.length >= 6) break;
        }
        setUpcoming(list);
    };

    if (loading) {
        return (
            <div className='animate-pulse h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl' />
        );
    }
    if (!todayHijri) return null;

    const todayMatches = getPuasaSunnahForDate(new Date(), {
        day: todayHijri.day,
        month: todayHijri.month,
    });

    return (
        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
            <div className='flex items-center gap-2 mb-3'>
                <BsCalendarCheck className='text-emerald-600 dark:text-emerald-400 text-lg' />
                <h2 className='text-base font-semibold text-gray-800 dark:text-gray-200 dark:text-white'>
                    {t("puasa.title") ?? "Puasa Sunnah"}
                </h2>
            </div>

            <div className='mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40'>
                <p className='text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1'>
                    {t("puasa.today") ?? "Hari Ini"}
                </p>
                {todayMatches.length === 0 ? (
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("puasa.no_today") ??
                            "Tidak ada puasa sunnah khusus hari ini."}
                    </p>
                ) : (
                    <ul className='space-y-1'>
                        {todayMatches.map((m) => (
                            <li
                                key={m.id}
                                className='text-sm text-gray-800 dark:text-gray-200'
                            >
                                <span className='font-semibold'>
                                    {labelOf(m, lang)}
                                </span>
                                {m.dalil && (
                                    <span className='block text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                                        {m.dalil}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {upcoming.length > 0 && (
                <div>
                    <p className='text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                        {t("puasa.upcoming") ?? "Akan Datang (30 hari)"}
                    </p>
                    <ul className='space-y-2'>
                        {upcoming.map((entry, idx) => (
                            <li
                                key={idx}
                                className='flex items-start gap-3 text-sm border-b border-gray-50 dark:border-slate-700 last:border-0 pb-2 last:pb-0'
                            >
                                <div className='w-12 text-center shrink-0'>
                                    <p className='text-xs text-gray-400'>
                                        {(lang === "EN"
                                            ? dayNamesEn
                                            : dayNamesId)[
                                            entry.date.getDay()
                                        ].slice(0, 3)}
                                    </p>
                                    <p className='text-base font-bold text-emerald-700 dark:text-emerald-400'>
                                        {entry.date.getDate()}
                                    </p>
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                        {formatDate(entry.date, lang)}
                                    </p>
                                    {entry.matches.map((m) => (
                                        <p
                                            key={m.id}
                                            className='text-sm text-gray-800 dark:text-gray-200'
                                        >
                                            • {labelOf(m, lang)}
                                        </p>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className='mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-start gap-2'>
                <BsInfoCircle className='text-amber-600 dark:text-amber-400 text-xs shrink-0 mt-0.5' />
                <p className='text-xs text-amber-700 dark:text-amber-400'>
                    {t("puasa.disclaimer") ??
                        "Estimasi naive 30 hari/bulan Hijri. Akurasi tergantung penampakan hilal & jadwal lokal."}
                </p>
            </div>

            <details className='mt-3'>
                <summary className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 cursor-pointer hover:text-gray-700 hover:dark:text-gray-200 dark:hover:text-gray-200'>
                    {t("puasa.show_all") ??
                        `Lihat semua ${PUASA_SUNNAH.length} puasa sunnah`}
                </summary>
                <ul className='mt-2 space-y-1.5 pl-3'>
                    {PUASA_SUNNAH.map((p) => (
                        <li key={p.id} className='text-xs'>
                            <p className='font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                {labelOf(p, lang)}
                            </p>
                            {p.dalil && (
                                <p className='text-gray-500 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 mt-0.5'>
                                    {p.dalil}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );
}
