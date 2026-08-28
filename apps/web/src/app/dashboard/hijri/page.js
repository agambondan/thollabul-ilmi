"use client";

import PuasaSunnahPanel from "@/components/PuasaSunnahPanel";
import RamadanCountdown from "@/components/RamadanCountdown";
import { useEffect, useState } from "react";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";

const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const toAladhan = (iso) => {
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
};

const HijriPage = () => {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [todayHijri, setTodayHijri] = useState(null);
    const [inputDate, setInputDate] = useState(todayIso());
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchHijri = async (isoDate) => {
        setLoading(true);
        setResult(null);
        try {
            const aladhan = toAladhan(isoDate);
            const res = await fetch(
                `https://api.aladhan.com/v1/gToH/${aladhan}`,
            );
            const data = await res.json();
            const h = data?.data?.hijri;
            if (h) {
                setResult({
                    day: h.day,
                    monthAr: h.month?.ar ?? "",
                    monthEn: h.month?.en ?? "",
                    year: h.year,
                    weekdayAr: h.weekday?.ar ?? "",
                });
            }
        } catch {}
        setLoading(false);
    };

    useEffect(() => {
        const loadToday = async () => {
            try {
                const aladhan = toAladhan(todayIso());
                const res = await fetch(
                    `https://api.aladhan.com/v1/gToH/${aladhan}`,
                );
                const data = await res.json();
                const h = data?.data?.hijri;
                if (h) {
                    setTodayHijri({
                        day: h.day,
                        monthAr: h.month?.ar ?? "",
                        monthEn: h.month?.en ?? "",
                        year: h.year,
                        weekdayAr: h.weekday?.ar ?? "",
                    });
                    setResult({
                        day: h.day,
                        monthAr: h.month?.ar ?? "",
                        monthEn: h.month?.en ?? "",
                        year: h.year,
                        weekdayAr: h.weekday?.ar ?? "",
                    });
                }
            } catch {}
        };
        loadToday();
    }, []);

    const handleConvert = () => {
        if (inputDate) fetchHijri(inputDate);
    };

    return (
        <div className={isWide ? "px-4 py-6" : "px-4 py-6 max-w-md mx-auto"}>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                {t("hijri.title")}
            </h1>

            {/* Today's hijri */}
            {todayHijri && (
                <div className='bg-emerald-700 dark:bg-emerald-800 rounded-2xl p-6 mb-4 text-center text-white'>
                    <p className='text-xs font-medium text-emerald-200 mb-2'>
                        {t("hijri.today")}
                    </p>
                    <p
                        className='text-3xl font-bold mb-1 arabic-text'
                        dir='rtl'
                    >
                        {todayHijri.day} {todayHijri.monthAr} {todayHijri.year}{" "}
                        هـ
                    </p>
                    <p className='text-base text-emerald-100'>
                        {todayHijri.day} {todayHijri.monthEn} {todayHijri.year}{" "}
                        H
                    </p>
                </div>
            )}

            <div className='mb-6'>
                <RamadanCountdown />
            </div>

            <div className='mb-6'>
                <PuasaSunnahPanel />
            </div>

            {/* Converter */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                <p className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
                    {t("hijri.converter_title")}
                </p>
                <div className='flex gap-2'>
                    <input
                        type='date'
                        value={inputDate}
                        onChange={(e) => setInputDate(e.target.value)}
                        className='flex-1 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    />
                    <button
                        onClick={handleConvert}
                        disabled={loading}
                        className='px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-60 transition-colors'
                    >
                        {loading ? "..." : t("hijri.convert_btn")}
                    </button>
                </div>

                {result && (
                    <div className='mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center'>
                        <p
                            className='text-xl font-bold text-gray-800 dark:text-white arabic-text mb-1'
                            dir='rtl'
                        >
                            {result.day} {result.monthAr} {result.year} هـ
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            {result.day} {result.monthEn} {result.year} H
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HijriPage;
