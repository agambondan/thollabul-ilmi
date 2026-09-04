"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";
import { asmaulHusnaApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    BsArrowCounterclockwise,
    BsChevronLeft,
    BsChevronRight,
    BsHandIndexThumb,
} from "react-icons/bs";
import { MdRefresh } from "react-icons/md";

const STORAGE_KEY = "tholabul_asmaul_wirid_state";
const TOTAL_NAMES = 99;

const safeParse = (raw, fallback) => {
    try {
        const parsed = JSON.parse(raw ?? "");
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

export function AsmaulWiridContent({ basePath = "/asmaul-husna" }) {
    const { t } = useLocale();
    const [names, setNames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [count, setCount] = useState(0);
    const [totalToday, setTotalToday] = useState(0);
    const [vibrate, setVibrate] = useState(true);
    const lastDateRef = useRef("");

    const todayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    useEffect(() => {
        asmaulHusnaApi
            .list()
            .then((r) => r.json())
            .then((data) => {
                const items = (data?.items ?? data ?? []).sort(
                    (a, b) => (a.number ?? 0) - (b.number ?? 0),
                );
                if (items.length > 0) setNames(items);
            })
            .catch((e) => console.error(e))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        const stored = safeParse(localStorage.getItem(STORAGE_KEY), null);
        const today = todayStr();
        lastDateRef.current = today;
        if (stored) {
            setActiveIndex(stored.activeIndex ?? 0);
            setCount(stored.count ?? 0);
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
            totalToday,
            vibrate,
            date: lastDateRef.current || todayStr(),
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {}
    }, [activeIndex, count, totalToday, vibrate]);

    const active = names[activeIndex] ?? null;
    const reachedTarget = count >= TOTAL_NAMES;
    const progressPct = Math.min(100, (count / TOTAL_NAMES) * 100);

    const handleTap = () => {
        const next = count + 1;
        setCount(next);
        setTotalToday((prev) => prev + 1);
        if (vibrate && typeof navigator !== "undefined" && navigator.vibrate) {
            if (next === TOTAL_NAMES) {
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

    const prevName = () => {
        if (activeIndex > 0) {
            setActiveIndex((i) => i - 1);
            setCount(0);
        }
    };

    const nextName = () => {
        if (activeIndex < names.length - 1) {
            setActiveIndex((i) => i + 1);
            setCount(0);
        }
    };

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='text-center mb-6'>
                <Link
                    href={basePath}
                    className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline'
                >
                    ← {t("asmaul.back_to_list") ?? "Kembali ke daftar"}
                </Link>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2 mt-3'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    وِرْدُ الْأَسْمَاءِ
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("asmaul.wirid_title") ?? "Wirid Asmaul Husna"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("asmaul.wirid_subtitle") ??
                        "Hitung wirid dengan 99 nama Allah"}
                </p>
            </div>

            {isLoading ? (
                <div className='bg-white dark:bg-slate-800 rounded-3xl border border-emerald-100 dark:border-slate-700 shadow-sm p-6 mb-5 animate-pulse'>
                    <div className='h-10 bg-gray-200 dark:bg-slate-700 rounded mb-4 w-3/4 mx-auto' />
                    <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded mb-2 w-1/2 mx-auto' />
                    <div className='h-56 bg-gray-200 dark:bg-slate-700 rounded-full w-56 mx-auto' />
                </div>
            ) : active ? (
                <div className='bg-white dark:bg-slate-800 rounded-3xl border border-emerald-100 dark:border-slate-700 shadow-sm p-6 mb-5'>
                    <div className='flex items-center justify-between mb-3'>
                        <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-3 py-1'>
                            #{active.number} / {names.length}
                        </span>
                        <div className='flex items-center gap-1'>
                            <button
                                onClick={prevName}
                                disabled={activeIndex === 0}
                                className='w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-300 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
                            >
                                <BsChevronLeft />
                            </button>
                            <button
                                onClick={nextName}
                                disabled={activeIndex >= names.length - 1}
                                className='w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-300 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
                            >
                                <BsChevronRight />
                            </button>
                        </div>
                    </div>

                    <p
                        dir='rtl'
                        className='font-arabic text-3xl text-center text-emerald-900 dark:text-emerald-300 leading-loose mb-1'
                    >
                        {active.arabic}
                    </p>
                    <p className='text-sm italic text-center text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-1'>
                        {active.transliteration}
                    </p>
                    <p className='text-base font-semibold text-center text-emerald-800 dark:text-emerald-300 mb-5'>
                        {active.indonesian}
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
                                / {TOTAL_NAMES}
                            </span>
                            {reachedTarget && (
                                <span className='absolute -top-2 -right-2 bg-amber-400 text-emerald-900 dark:text-emerald-300 rounded-full w-9 h-9 flex items-center justify-center shadow'>
                                    ✓
                                </span>
                            )}
                        </button>
                    </div>

                    <div className='mb-5'>
                        <div className='h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden'>
                            <div
                                className='h-full bg-emerald-500 rounded-full transition-all duration-300'
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className='text-xs text-gray-400 mt-1.5 text-center'>
                            {Math.round(progressPct)}% · {count}/{TOTAL_NAMES}
                        </p>
                    </div>

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
            ) : null}

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
                        {TOTAL_NAMES}
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

            {!isLoading && names.length === 0 && (
                <p className='text-center text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300 py-4'>
                    {t("asmaul.flashcard_empty") ??
                        "Data Asmaul Husna belum tersedia."}
                </p>
            )}
        </ContentWidth>
    );
}

export default function AsmaulWiridPage() {
    return (
        <main className='min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
            <Section>
                <AsmaulWiridContent />
            </Section>
        </main>
    );
}
