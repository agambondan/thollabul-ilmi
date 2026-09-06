"use client";

import { contentReportApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useLayoutMode } from "@/lib/useLayoutMode";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BsExclamationTriangleFill, BsCheckCircleFill, BsHourglassSplit, BsXCircleFill } from "react-icons/bs";

const STATUS_BADGE = {
    pending: {
        label: "Menunggu Review",
        labelEn: "Pending Review",
        cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        icon: BsHourglassSplit,
    },
    reviewed: {
        label: "Sedang Ditinjau",
        labelEn: "Under Review",
        cls: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800",
        icon: BsHourglassSplit,
    },
    resolved: {
        label: "Disetujui / Selesai",
        labelEn: "Resolved",
        cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        icon: BsCheckCircleFill,
    },
    rejected: {
        label: "Ditolak",
        labelEn: "Rejected",
        cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        icon: BsXCircleFill,
    },
};

export default function MyReportsPage() {
    const { lang } = useLocale();
    const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
    const { isWide } = useLayoutMode();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAuthenticated) return;
        setLoading(true);
        contentReportApi
            .listMine({ limit: "50" })
            .then((r) => r.json())
            .then((d) => {
                setReports(d?.items || d?.data?.items || []);
            })
            .catch((err) => {
                setError(parseApiError(err) || "Gagal memuat laporan");
            })
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    if (authLoading) return <div className='p-6'>Loading...</div>;

    return (
        <div className={isWide ? "p-4 md:p-6 w-full" : "p-4 md:p-6 max-w-4xl mx-auto w-full"}>
            <div className='mb-6'>
                <Link
                    href='/dashboard/profile'
                    className='inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mb-2'
                >
                    ← {lang === "EN" ? "Back to Profile" : "Kembali ke Profil"}
                </Link>
                <div className='flex items-center gap-2.5'>
                    <BsExclamationTriangleFill className='text-amber-500 text-xl' />
                    <h1 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>
                        {lang === "EN" ? "My Content Reports" : "Laporan Koreksi Saya"}
                    </h1>
                </div>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    {lang === "EN"
                        ? "Track your submitted corrections and review status for dalil and Quran texts."
                        : "Pantau status koreksi dan review yang Anda ajukan untuk teks dalil dan Al-Qur'an."}
                </p>
            </div>

            {error && (
                <div className='mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-xs text-red-600 dark:text-red-400'>
                    {error}
                </div>
            )}

            {loading ? (
                <div className='flex justify-center py-12'>
                    <div className='w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                </div>
            ) : reports.length === 0 ? (
                <div className='rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900'>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {lang === "EN"
                            ? "You haven't submitted any content corrections yet."
                            : "Anda belum pernah mengajukan laporan koreksi konten."}
                    </p>
                    <p className='mt-1 text-xs text-gray-400'>
                        {lang === "EN"
                            ? "Found a mistake in translations or dalil? Click 'Report Error' on any ayah or hadith."
                            : "Menemukan kesalahan terjemahan atau teks dalil? Klik 'Laporkan Kesalahan' pada ayat atau hadits terkait."}
                    </p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {reports.map((r) => {
                        const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                        const BadgeIcon = badge.icon;
                        return (
                            <div
                                key={r.id}
                                className='rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm'
                            >
                                <div className='flex items-start justify-between gap-3 mb-2'>
                                    <div>
                                        <span className='text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full'>
                                            {r.target_type}
                                        </span>
                                        <h3 className='mt-1 text-sm font-bold text-gray-900 dark:text-white'>
                                            {r.target_title || r.target_id}
                                        </h3>
                                    </div>
                                    <div
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.cls}`}
                                    >
                                        <BadgeIcon className='text-xs' />
                                        <span>{lang === "EN" ? badge.labelEn : badge.label}</span>
                                    </div>
                                </div>

                                <div className='space-y-1.5 text-xs text-gray-600 dark:text-gray-300'>
                                    <p>
                                        <strong className='text-gray-700 dark:text-gray-200'>
                                            {lang === "EN" ? "Issue:" : "Kekeliruan:"}
                                        </strong>{" "}
                                        {r.description}
                                    </p>
                                    {r.correction && (
                                        <p className='text-emerald-700 dark:text-emerald-400 italic'>
                                            <strong>{lang === "EN" ? "Suggested:" : "Usulan:"}</strong> {r.correction}
                                        </p>
                                    )}
                                    {r.admin_note && (
                                        <div className='mt-2 rounded-lg bg-gray-50 dark:bg-slate-800/80 p-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-slate-700'>
                                            <strong className='text-gray-900 dark:text-gray-100'>
                                                {lang === "EN" ? "Admin Note:" : "Catatan Admin:"}
                                            </strong>{" "}
                                            {r.admin_note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
