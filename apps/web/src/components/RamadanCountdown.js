"use client";

import { useLocale } from "@/context/Locale";
import { hijriApi } from "@/lib/api";
import { daysUntilRamadan } from "@/lib/puasaSunnah";
import { useEffect, useState } from "react";
import { BsMoonStarsFill } from "react-icons/bs";

export default function RamadanCountdown({ compact = false, initialHijri = null }) {
    const { t } = useLocale();
    const [hijri, setHijri] = useState(initialHijri);
    const [loading, setLoading] = useState(!initialHijri);

    useEffect(() => {
        if (initialHijri) return;
        hijriApi
            .today()
            .then((r) => r.json())
            .then((data) => {
                const h = data?.hijri ?? data;
                setHijri(h);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, [initialHijri]);

    if (loading) {
        return compact ? null : (
            <div className='animate-pulse h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl' />
        );
    }

    if (!hijri) return null;

    const days = daysUntilRamadan(hijri);
    const isRamadan = Number(hijri.month) === 9;
    const inRamadan =
        isRamadan && Number(hijri.day) >= 1 && Number(hijri.day) <= 30;

    if (compact) {
        return (
            <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium'>
                <BsMoonStarsFill />
                {inRamadan ? (
                    <span>
                        {t("hijri.ramadan_today") ?? "Ramadan hari ke"}{" "}
                        <strong>{hijri.day}</strong>
                    </span>
                ) : (
                    <span>
                        {t("hijri.ramadan_in") ?? "Ramadan"}{" "}
                        <strong>{days}</strong>{" "}
                        {t("hijri.days_left") ?? "hari lagi"}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className='bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-700 dark:to-emerald-900 text-white rounded-2xl p-5 shadow-sm'>
            <div className='flex items-center gap-3 mb-2'>
                <div className='w-11 h-11 rounded-full bg-white/15 flex items-center justify-center'>
                    <BsMoonStarsFill className='text-xl text-amber-200' />
                </div>
                <div>
                    <p className='text-xs uppercase tracking-wider text-emerald-100/90'>
                        {inRamadan
                            ? (t("hijri.ramadan_label") ?? "Bulan Ramadan")
                            : (t("hijri.ramadan_countdown_label") ??
                              "Menuju Ramadan")}
                    </p>
                    <p className='text-sm font-medium text-white/90'>
                        {hijri.day} {hijri.month_name ?? `Bulan ${hijri.month}`}{" "}
                        {hijri.year} H
                    </p>
                </div>
            </div>
            <div className='flex items-baseline gap-2 mt-4'>
                <span className='text-5xl font-bold'>
                    {inRamadan ? hijri.day : days}
                </span>
                <span className='text-sm text-emerald-100/90'>
                    {inRamadan
                        ? `/ 30 ${t("hijri.day_unit") ?? "hari"}`
                        : (t("hijri.days_left") ?? "hari lagi")}
                </span>
            </div>
            {!inRamadan && (
                <p className='text-xs text-emerald-100/70 mt-2'>
                    {t("hijri.ramadan_note") ??
                        "Estimasi naive 30 hari/bulan Hijri. Akurasi tergantung penampakan hilal."}
                </p>
            )}
        </div>
    );
}
