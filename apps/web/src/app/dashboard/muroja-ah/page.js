"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { hafalanApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BsCheck2Circle, BsChevronDown, BsClockHistory } from "react-icons/bs";
import { MdRefresh } from "react-icons/md";

const REVIEW_KEY = "muroja_ah_reviews";

const loadReviews = () => {
    try {
        return JSON.parse(localStorage.getItem(REVIEW_KEY) ?? "{}");
    } catch {
        return {};
    }
};

const saveReview = (surahNumber) => {
    const reviews = loadReviews();
    reviews[surahNumber] = new Date().toISOString();
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
};

const daysSince = (iso) => {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

const urgencyColor = (days) => {
    if (days === null)
        return "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400";
    if (days >= 14)
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    if (days >= 7)
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
};

const MurojaahPage = () => {
    const { t } = useLocale();
    const { user, isAuthenticated } = useAuth();
    const [hafalan, setHafalan] = useState([]);
    const [reviews, setReviews] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [openSurah, setOpenSurah] = useState(null);
    const [marking, setMarking] = useState(null);

    const urgencyLabel = (days) => {
        if (days === null) return t("murojaah.not_reviewed");
        if (days >= 14) return `${days} ${t("murojaah.urgent_suffix")}`;
        return `${days} ${t("murojaah.days_ago")}`;
    };

    useEffect(() => {
        setReviews(loadReviews());
    }, []);

    useEffect(() => {
        const load = async () => {
            if (isAuthenticated) {
                try {
                    const res = await hafalanApi.list();
                    const data = await res.json();
                    const memorized = (data?.items ?? data ?? []).filter(
                        (s) => s.status === "hafal",
                    );
                    if (memorized.length > 0) {
                        setHafalan(memorized);
                        setLoading(false);
                        return;
                    }
                } catch {}
            }
            try {
                const local = JSON.parse(
                    localStorage.getItem("tholabul_hafalan") ?? "[]",
                );
                setHafalan(local.filter((s) => s.status === "hafal"));
            } catch {}
            setLoading(false);
        };
        load();
    }, [isAuthenticated]);

    const handleMarkReviewed = (surahNumber) => {
        setMarking(surahNumber);
        saveReview(surahNumber);
        setReviews(loadReviews());
        setTimeout(() => setMarking(null), 600);
    };

    const enriched = hafalan.map((s) => {
        const num = s.surah_number ?? s.number;
        const days = daysSince(reviews[num]);
        return { ...s, days, num };
    });

    const filtered = enriched.filter((s) => {
        if (filter === "urgent") return s.days === null || s.days >= 14;
        if (filter === "recent") return s.days !== null && s.days < 7;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (a.days === null && b.days === null) return 0;
        if (a.days === null) return -1;
        if (b.days === null) return 1;
        return b.days - a.days;
    });

    const stats = {
        total: hafalan.length,
        reviewed: enriched.filter((s) => s.days !== null && s.days < 7).length,
        urgent: enriched.filter((s) => s.days === null || s.days >= 14).length,
    };

    if (!loading && hafalan.length === 0) {
        return (
            <div className='px-4 py-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                    {t("muroja.title")}
                </h1>
                <div className='text-center py-16'>
                    <p className='text-4xl mb-3'>📖</p>
                    <p className='text-gray-500 dark:text-gray-400 text-sm mb-4'>
                        {t("muroja.no_hafalan")}
                    </p>
                    <Link
                        href='/dashboard/hafalan'
                        className='inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors'
                    >
                        {t("muroja.manage_hafalan")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className='px-4 py-6'>
            <div className='flex items-center gap-2 mb-2'>
                <MdRefresh className='text-xl text-emerald-600 dark:text-emerald-400' />
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {t("muroja.title")}
                </h1>
            </div>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-5'>
                {hafalan.length} {t("muroja.surah_count")}
            </p>

            {/* Stats */}
            {!loading && hafalan.length > 0 && (
                <div className='grid grid-cols-3 gap-3 mb-5'>
                    {[
                        {
                            label: t("murojaah.stat_total"),
                            value: stats.total,
                            color: "text-emerald-700 dark:text-emerald-400",
                        },
                        {
                            label: t("murojaah.stat_reviewed"),
                            value: stats.reviewed,
                            color: "text-teal-600 dark:text-teal-400",
                        },
                        {
                            label: t("murojaah.stat_urgent"),
                            value: stats.urgent,
                            color: "text-red-600 dark:text-red-400",
                        },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 text-center'
                        >
                            <p className={`text-2xl font-bold ${s.color}`}>
                                {s.value}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            {hafalan.length > 0 && (
                <div className='flex gap-2 mb-4'>
                    {[
                        { value: "all", label: t("murojaah.filter_all") },
                        { value: "urgent", label: t("murojaah.filter_urgent") },
                        { value: "recent", label: t("murojaah.filter_recent") },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filter === f.value
                                    ? "bg-emerald-700 text-white"
                                    : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className='text-center py-12 text-gray-400 dark:text-gray-500 text-sm'>
                    {t("common.loading")}
                </div>
            )}

            {/* Empty filter state */}
            {!loading && sorted.length === 0 && hafalan.length > 0 && (
                <div className='text-center py-8 text-gray-500 dark:text-gray-400 text-sm'>
                    {t("murojaah.no_filter")}
                </div>
            )}

            {/* List */}
            {!loading && sorted.length > 0 && (
                <div className='space-y-2'>
                    {sorted.map((s) => {
                        const isOpen = openSurah === s.num;
                        const isMarking = marking === s.num;
                        return (
                            <div
                                key={s.num}
                                className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                            >
                                <div
                                    className='flex items-center justify-between px-4 py-3 cursor-pointer'
                                    onClick={() =>
                                        setOpenSurah(isOpen ? null : s.num)
                                    }
                                >
                                    <div className='flex items-center gap-3'>
                                        <span className='w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center justify-center shrink-0'>
                                            {s.num}
                                        </span>
                                        <div>
                                            <p className='text-sm font-semibold text-gray-800 dark:text-white'>
                                                {s.surah_name ??
                                                    s.name_latin ??
                                                    s.name}
                                            </p>
                                            <span
                                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${urgencyColor(s.days)}`}
                                            >
                                                <BsClockHistory />
                                                {urgencyLabel(s.days)}
                                            </span>
                                        </div>
                                    </div>
                                    <BsChevronDown
                                        className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    />
                                </div>

                                {isOpen && (
                                    <div className='border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center gap-2'>
                                        <Link
                                            href={`/dashboard/quran/${
                                                s.surah?.translation
                                                    ?.latin_en ??
                                                s.surah_name ??
                                                s.name_latin ??
                                                s.surah_number ??
                                                s.number
                                            }`}
                                            className='flex-1 text-center py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors'
                                        >
                                            {t("muroja.start_review")}
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleMarkReviewed(s.num)
                                            }
                                            disabled={isMarking}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                                isMarking
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-emerald-700 hover:bg-emerald-800 text-white"
                                            }`}
                                        >
                                            <BsCheck2Circle />
                                            {isMarking
                                                ? t("murojaah.marked")
                                                : t("muroja.mark_reviewed")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MurojaahPage;
