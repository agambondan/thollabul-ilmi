"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { kalkulasiZakatApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsTrash } from "react-icons/bs";
import { FaCalculator } from "react-icons/fa";
import { MdInfo } from "react-icons/md";

const JENIS_LABEL = {
    maal: "zakat.maal",
    fitrah: "zakat.fitrah",
    profesi: "zakat.profession",
    perdagangan: "zakat.trade",
    pertanian: "zakat.agriculture",
    emas_perak: "zakat.gold",
};

const JENIS_ICON = {
    maal: "💰",
    fitrah: "🌾",
    profesi: "💼",
    perdagangan: "🏪",
    pertanian: "🌱",
    emas_perak: "🪙",
};

export function ZakatHistoryContent() {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fmt = (n) =>
        new Intl.NumberFormat(lang === "EN" ? "en-US" : "id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n);

    const fetchItems = () => {
        setLoading(true);
        kalkulasiZakatApi
            .list()
            .then((r) => r.json())
            .then((data) => setItems(data?.items ?? data ?? []))
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isAuthenticated) fetchItems();
        else setLoading(false);
    }, [isAuthenticated]);

    const handleDelete = async (id) => {
        await kalkulasiZakatApi.delete(id).catch((e) => console.error(e));
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const formatDate = (v) => {
        if (!v) return "";
        try {
            return new Date(v).toLocaleDateString(
                lang === "EN" ? "en-US" : "id-ID",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                },
            );
        } catch {
            return "";
        }
    };

    if (!isAuthenticated) {
        return (
            <div className='text-center py-16'>
                <p className='text-gray-500 dark:text-gray-400 text-sm'>
                    {t("zakat.login_to_view") ??
                        "Login untuk melihat riwayat zakat."}
                </p>
            </div>
        );
    }

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                    <FaCalculator className='text-3xl text-emerald-600 dark:text-emerald-400' />
                </div>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-1'>
                    {t("zakat.history_title") ?? "Riwayat Zakat"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("zakat.history_subtitle") ??
                        "Kalkulasi zakat yang telah disimpan"}
                </p>
            </div>

            {loading ? (
                <div className='space-y-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className='p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 animate-pulse'
                        >
                            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-3' />
                            <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <p className='text-4xl mb-3'>📋</p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t("zakat.history_empty") ??
                            "Belum ada riwayat kalkulasi zakat."}
                    </p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'
                        >
                            <div className='flex items-start justify-between mb-3'>
                                <div className='flex items-center gap-2'>
                                    <span className='text-lg'>
                                        {JENIS_ICON[item.jenis] ?? "💰"}
                                    </span>
                                    <div>
                                        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                            {item.nama_jenis ||
                                                t(
                                                    JENIS_LABEL[item.jenis] ??
                                                        "zakat.maal",
                                                )}
                                        </p>
                                        <p className='text-xs text-gray-400 dark:text-gray-500'>
                                            {formatDate(item.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className='text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1'
                                >
                                    <BsTrash className='text-sm' />
                                </button>
                            </div>
                            <div className='flex items-end justify-between'>
                                <div className='text-xs text-gray-500 dark:text-gray-400 space-y-0.5'>
                                    {item.nilai_harta > 0 && (
                                        <p>
                                            {t("zakat.total_wealth") ??
                                                "Total Harta"}
                                            : {fmt(item.nilai_harta)}
                                        </p>
                                    )}
                                    {item.nisab > 0 && (
                                        <p>
                                            {t("zakat.current_nisab") ??
                                                "Nisab"}
                                            : {fmt(item.nisab)}
                                        </p>
                                    )}
                                    {item.catatan && (
                                        <p className='italic'>{item.catatan}</p>
                                    )}
                                </div>
                                <div className='text-right'>
                                    <p className='text-xl font-extrabold text-emerald-700 dark:text-emerald-300'>
                                        {fmt(item.jumlah_zakat)}
                                    </p>
                                    <div className='flex items-center gap-2 mt-1 justify-end'>
                                        {item.sudah_dibayar ? (
                                            <span className='text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full'>
                                                {t("zakat.paid") ??
                                                    "Sudah Dibayar"}
                                            </span>
                                        ) : (
                                            <span className='text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full'>
                                                {t("zakat.unpaid") ??
                                                    "Belum Dibayar"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ContentWidth>
    );
}

export default function ZakatHistoryPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <NavbarTailwindCss />
            <div className='pt-24'>
                <ZakatHistoryContent />
            </div>
            <Footer />
        </main>
    );
}
