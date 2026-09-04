"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";
import { useEffect, useRef, useState } from "react";
import {
    BsArrowCounterclockwise,
    BsCheckCircleFill,
    BsHandIndexThumb,
} from "react-icons/bs";
import { MdRefresh } from "react-icons/md";

const PRESETS = [
    {
        key: "subhanallah",
        arabic: "سُبْحَانَ اللَّهِ",
        latin: "Subhanallah",
        target: 33,
    },
    {
        key: "alhamdulillah",
        arabic: "الْحَمْدُ لِلَّهِ",
        latin: "Alhamdulillah",
        target: 33,
    },
    {
        key: "allahu_akbar",
        arabic: "اللَّهُ أَكْبَرُ",
        latin: "Allahu Akbar",
        target: 33,
    },
    {
        key: "la_ilaha",
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
        latin: "La ilaha illallah",
        target: 100,
    },
    {
        key: "astaghfirullah",
        arabic: "أَسْتَغْفِرُ اللَّهَ",
        latin: "Astaghfirullah",
        target: 100,
    },
    {
        key: "shalawat",
        arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
        latin: "Allahumma shalli ala Muhammad",
        target: 100,
    },
    {
        key: "hawqala",
        arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        latin: "La hawla wala quwwata illa billah",
        target: 100,
    },
    {
        key: "hasbunallah",
        arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
        latin: "Hasbunallahu wa nimal wakil",
        target: 7,
    },
];

const STORAGE_KEY = "tholabul_tasbih_state";

const safeParse = (raw, fallback) => {
    try {
        const parsed = JSON.parse(raw ?? "");
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

export function TasbihContent() {
    const { t } = useLocale();
    const [activeIndex, setActiveIndex] = useState(0);
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33);
    const [totalToday, setTotalToday] = useState(0);
    const [vibrate, setVibrate] = useState(true);
    const lastDateRef = useRef("");

    const todayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    useEffect(() => {
        const stored = safeParse(localStorage.getItem(STORAGE_KEY), null);
        const today = todayStr();
        lastDateRef.current = today;
        if (stored) {
            setActiveIndex(stored.activeIndex ?? 0);
            setCount(stored.count ?? 0);
            setTarget(stored.target ?? 33);
            setVibrate(stored.vibrate ?? true);
            if (stored.date === today) {
                setTotalToday(stored.totalToday ?? 0);
            } else {
                setTotalToday(0);
            }
        }
    }, []);

    useEffect(() => {
        const payload = {
            activeIndex,
            count,
            target,
            totalToday,
            vibrate,
            date: lastDateRef.current || todayStr(),
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {}
    }, [activeIndex, count, target, totalToday, vibrate]);

    const active = PRESETS[activeIndex] ?? PRESETS[0];
    const reachedTarget = target > 0 && count >= target;
    const progressPct = target > 0 ? Math.min(100, (count / target) * 100) : 0;

    const handleTap = () => {
        const next = count + 1;
        setCount(next);
        setTotalToday((prev) => prev + 1);
        if (vibrate && typeof navigator !== "undefined" && navigator.vibrate) {
            if (target > 0 && next === target) {
                navigator.vibrate([60, 40, 60, 40, 120]);
            } else if (next % 33 === 0) {
                navigator.vibrate([40, 30, 40]);
            } else {
                navigator.vibrate(15);
            }
        }
    };

    const reset = () => setCount(0);
    const resetAll = () => {
        setCount(0);
        setTotalToday(0);
    };

    const choosePreset = (idx) => {
        setActiveIndex(idx);
        setCount(0);
        setTarget(PRESETS[idx].target);
    };

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='text-center mb-6'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    تَسْبِيحٌ
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("tasbih.title") ?? "Tasbih Digital"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("tasbih.subtitle") ??
                        "Hitung dzikir dengan target dan riwayat harian"}
                </p>
            </div>

            <div className='bg-white dark:bg-slate-800 rounded-3xl border border-emerald-100 dark:border-slate-700 shadow-sm p-6 mb-5'>
                <p
                    dir='rtl'
                    className='font-arabic text-3xl text-center text-emerald-900 dark:text-emerald-300 leading-loose mb-1'
                >
                    {active.arabic}
                </p>
                <p className='text-sm italic text-center text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-5'>
                    {active.latin}
                </p>

                <div className='relative flex items-center justify-center mb-5'>
                    <button
                        type='button'
                        onClick={handleTap}
                        className={`relative w-56 h-56 rounded-full flex flex-col items-center justify-center select-none transition-all active:scale-95 shadow-lg ${
                            reachedTarget
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-700 text-white"
                                : "bg-gradient-to-br from-emerald-500 to-emerald-800 text-white hover:from-emerald-400 hover:to-emerald-700"
                        }`}
                    >
                        <span className='text-6xl font-bold tabular-nums'>
                            {count}
                        </span>
                        <span className='text-xs uppercase tracking-wider mt-1 opacity-80'>
                            {target > 0
                                ? `/ ${target}`
                                : (t("tasbih.tap_to_count") ??
                                  "Tap untuk hitung")}
                        </span>
                        {reachedTarget && (
                            <span className='absolute -top-2 -right-2 bg-amber-400 text-emerald-900 dark:text-emerald-300 rounded-full w-9 h-9 flex items-center justify-center shadow'>
                                <BsCheckCircleFill className='text-xl' />
                            </span>
                        )}
                    </button>
                </div>

                {target > 0 && (
                    <div className='mb-5'>
                        <div className='h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden'>
                            <div
                                className='h-full bg-emerald-500 rounded-full transition-all duration-300'
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className='text-xs text-gray-400 mt-1.5 text-center'>
                            {Math.round(progressPct)}%
                        </p>
                    </div>
                )}

                <div className='flex items-center justify-center gap-2 flex-wrap'>
                    <button
                        onClick={reset}
                        className='flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
                    >
                        <BsArrowCounterclockwise />
                        {t("tasbih.reset") ?? "Reset"}
                    </button>
                    <button
                        onClick={resetAll}
                        className='flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
                    >
                        <MdRefresh />
                        {t("tasbih.reset_all") ?? "Reset Semua"}
                    </button>
                    <button
                        onClick={() => setVibrate((v) => !v)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            vibrate
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                        }`}
                    >
                        <BsHandIndexThumb />
                        {vibrate
                            ? (t("tasbih.vibrate_on") ?? "Getar: On")
                            : (t("tasbih.vibrate_off") ?? "Getar: Off")}
                    </button>
                </div>
            </div>

            <div className='grid grid-cols-3 gap-3 mb-6'>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center'>
                    <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                        {count}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                        {t("tasbih.current") ?? "Hitungan"}
                    </p>
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center'>
                    <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                        {target || "∞"}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                        {t("tasbih.target") ?? "Target"}
                    </p>
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center'>
                    <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                        {totalToday}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                        {t("tasbih.total_today") ?? "Total Hari Ini"}
                    </p>
                </div>
            </div>

            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5'>
                <div className='flex items-center justify-between mb-3'>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                        {t("tasbih.target_label") ?? "Atur Target"}
                    </p>
                    <input
                        type='number'
                        min='0'
                        value={target}
                        onChange={(e) =>
                            setTarget(Math.max(0, Number(e.target.value) || 0))
                        }
                        className='w-24 px-3 py-1.5 border border-gray-200 dark:border-gray-700 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    />
                </div>
                <div className='flex flex-wrap gap-2'>
                    {[33, 99, 100, 313, 1000].map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setTarget(preset)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                target === preset
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                            }`}
                        >
                            {preset}
                        </button>
                    ))}
                    <button
                        onClick={() => setTarget(0)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            target === 0
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                        }`}
                    >
                        {t("tasbih.no_limit") ?? "Tanpa Batas"}
                    </button>
                </div>
            </div>

            <div>
                <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-3'>
                    {t("tasbih.preset_title") ?? "Pilihan Dzikir"}
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {PRESETS.map((preset, idx) => (
                        <button
                            key={preset.key}
                            onClick={() => choosePreset(idx)}
                            className={`text-left p-4 rounded-xl border transition-all ${
                                idx === activeIndex
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                                    : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700"
                            }`}
                        >
                            <p
                                dir='rtl'
                                className='font-arabic text-xl text-emerald-900 dark:text-emerald-300 mb-1 leading-loose'
                            >
                                {preset.arabic}
                            </p>
                            <p className='text-xs italic text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                {preset.latin}
                            </p>
                            <p className='text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium'>
                                {t("tasbih.target") ?? "Target"}:{" "}
                                {preset.target}×
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </ContentWidth>
    );
}

export default function TasbihPage() {
    return (
        <main className='min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
            <Section>
                <TasbihContent />
            </Section>
        </main>
    );
}
