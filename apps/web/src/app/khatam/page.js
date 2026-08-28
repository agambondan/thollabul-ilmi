"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { progressApi } from "@/lib/api";
import {
    ayahIndex,
    dailyTarget,
    juzProgress,
    progressPct,
    TOTAL_AYAH,
} from "@/lib/khatamHelper";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BsCheckCircleFill, BsCircle, BsFlag } from "react-icons/bs";
import { FaQuran } from "react-icons/fa";

const STORAGE_KEY = "tholabul_khatam_target";

const todayPlus = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

export function KhatamContent({ basePath = "/quran" }) {
    const { isAuthenticated } = useAuth();
    const { t, lang } = useLocale();
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [targetDate, setTargetDate] = useState(() => todayPlus(30));

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setTargetDate(saved);
        } catch {}
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        progressApi
            .getQuran()
            .then((r) => r.json())
            .then((data) => {
                const p = data?.progress ?? data ?? null;
                if (p && p.surah_number) {
                    setProgress({
                        surahNumber: Number(p.surah_number) || 1,
                        ayahNumber: Number(p.ayah_number) || 1,
                        updatedAt: p.updated_at ?? p.last_read_at,
                    });
                } else {
                    setProgress({
                        surahNumber: 1,
                        ayahNumber: 1,
                        updatedAt: null,
                    });
                }
            })
            .catch(() =>
                setProgress({ surahNumber: 1, ayahNumber: 1, updatedAt: null }),
            )
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    const saveTarget = (val) => {
        setTargetDate(val);
        try {
            localStorage.setItem(STORAGE_KEY, val);
        } catch {}
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center py-20'>
                <div className='w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <ContentWidth
                compact='max-w-2xl'
                className='px-4 py-10 text-center'
            >
                <FaQuran className='mx-auto text-5xl text-emerald-300 dark:text-emerald-700 mb-4' />
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white mb-2'>
                    {t("khatam.title") ?? "Khatam Tracker"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                    {t("khatam.login_required") ??
                        "Login untuk melihat progress khatam Quran-mu."}
                </p>
                <Link
                    href='/auth/login'
                    className='inline-block px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    {t("auth.login_btn") ?? "Masuk"}
                </Link>
            </ContentWidth>
        );
    }

    const currentIdx = ayahIndex(progress.surahNumber, progress.ayahNumber);
    const pct = progressPct(progress.surahNumber, progress.ayahNumber);
    const { daysLeft, ayahsLeft, ayahsPerDay } = dailyTarget(
        currentIdx,
        new Date(targetDate),
    );
    const juzList = juzProgress(progress.surahNumber, progress.ayahNumber);

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='text-center mb-6'>
                <FaQuran className='mx-auto text-3xl text-emerald-600 dark:text-emerald-400 mb-2' />
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-1'>
                    {t("khatam.title") ?? "Khatam Tracker"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("khatam.subtitle") ??
                        "Pantau progress khatam Al-Quran kamu"}
                </p>
            </div>

            {/* Big progress card */}
            <div className='bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-700 dark:to-emerald-900 text-white rounded-2xl p-6 mb-5'>
                <div className='flex items-center justify-between mb-3'>
                    <div>
                        <p className='text-xs text-emerald-100/80 uppercase tracking-wider'>
                            {t("khatam.current_progress") ??
                                "Progress saat ini"}
                        </p>
                        <p className='text-3xl font-bold mt-1'>
                            {pct.toFixed(1)}%
                        </p>
                    </div>
                    <div className='text-right'>
                        <p className='text-xs text-emerald-100/80'>
                            {t("khatam.last_read") ?? "Terakhir dibaca"}
                        </p>
                        <p className='text-base font-semibold'>
                            QS. {progress.surahNumber}:{progress.ayahNumber}
                        </p>
                    </div>
                </div>
                <div className='h-3 bg-white/20 rounded-full overflow-hidden'>
                    <div
                        className='h-full bg-amber-300 rounded-full transition-all duration-700'
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className='flex justify-between text-xs text-emerald-100/80 mt-2'>
                    <span>
                        {currentIdx} / {TOTAL_AYAH}{" "}
                        {t("khatam.ayah_unit") ?? "ayat"}
                    </span>
                    <span>
                        {ayahsLeft} {t("khatam.remaining") ?? "tersisa"}
                    </span>
                </div>
            </div>

            {/* Target & daily */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5'>
                <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2'>
                    <BsFlag className='text-amber-500' />
                    {t("khatam.target_section") ?? "Target Khatam"}
                </h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
                    <div>
                        <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                            {t("khatam.target_date") ?? "Tanggal Target"}
                        </label>
                        <input
                            type='date'
                            value={targetDate}
                            onChange={(e) => saveTarget(e.target.value)}
                            className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                    </div>
                    <div className='flex flex-wrap gap-1.5 items-end'>
                        {[
                            { days: 30, label: "30d" },
                            { days: 60, label: "60d" },
                            { days: 90, label: "3 bln" },
                            { days: 180, label: "6 bln" },
                            { days: 365, label: "1 thn" },
                        ].map((p) => (
                            <button
                                key={p.days}
                                type='button'
                                onClick={() => saveTarget(todayPlus(p.days))}
                                className='px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors'
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='grid grid-cols-3 gap-3 mt-3'>
                    <div className='text-center bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3'>
                        <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                            {daysLeft}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                            {t("khatam.days_left") ?? "Hari tersisa"}
                        </p>
                    </div>
                    <div className='text-center bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3'>
                        <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                            {ayahsPerDay}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                            {t("khatam.ayahs_per_day") ?? "Ayat/hari"}
                        </p>
                    </div>
                    <div className='text-center bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3'>
                        <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                            {Math.ceil(ayahsPerDay / 15)}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                            ~ {t("khatam.minutes") ?? "menit/hari"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Per-juz visualization */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
                    {t("khatam.juz_progress") ?? "Progress per Juz"}
                </h2>
                <div className='grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5'>
                    {juzList.map((j) => {
                        const isDone = j.pct === 100;
                        return (
                            <div
                                key={j.juz}
                                title={`Juz ${j.juz}: ${j.read}/${j.total} (${j.pct}%)`}
                                className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                                    isDone
                                        ? "bg-emerald-500 text-white"
                                        : j.pct > 0
                                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                          : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500"
                                } ${j.isCurrent ? "ring-2 ring-amber-400 dark:ring-amber-500" : ""}`}
                            >
                                <span>{j.juz}</span>
                                {j.pct > 0 && j.pct < 100 && (
                                    <span
                                        className='absolute bottom-0 left-0 h-1 bg-emerald-500 rounded-b-lg'
                                        style={{ width: `${j.pct}%` }}
                                    />
                                )}
                                {isDone && (
                                    <BsCheckCircleFill className='absolute top-0.5 right-0.5 text-[10px]' />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className='flex flex-wrap gap-3 mt-4 text-xs'>
                    <span className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400'>
                        <span className='inline-block w-3 h-3 rounded bg-emerald-500' />
                        {t("khatam.juz_done") ?? "Selesai"}
                    </span>
                    <span className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400'>
                        <span className='inline-block w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30' />
                        {t("khatam.juz_partial") ?? "Sebagian"}
                    </span>
                    <span className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400'>
                        <span className='inline-block w-3 h-3 rounded bg-gray-100 dark:bg-slate-700' />
                        {t("khatam.juz_untouched") ?? "Belum dibaca"}
                    </span>
                    <span className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400'>
                        <span className='inline-block w-3 h-3 rounded bg-white dark:bg-slate-800 ring-2 ring-amber-400' />
                        {t("khatam.juz_current") ?? "Saat ini"}
                    </span>
                </div>
                <Link
                    href={basePath}
                    className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsCircle />
                    {t("khatam.continue_reading") ?? "Lanjutkan baca"}
                </Link>
            </div>
        </ContentWidth>
    );
}

export default function KhatamPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <KhatamContent />
            </Section>
            <Footer />
        </main>
    );
}
