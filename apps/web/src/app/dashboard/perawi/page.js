"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { BsSearch, BsPeopleFill } from "react-icons/bs";
import { useLocale } from "@/context/Locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const TABAQAH_LABELS = {
    nabi: { id: "Nabi", en: "Prophet" },
    sahabat: { id: "Sahabat", en: "Companion" },
    tabiin: { id: "Tabi'in", en: "Tabi'in" },
    tabiut_tabiin: { id: "Tabi'ut Tabi'in", en: "Tabi'ut Tabi'in" },
    atbaut_tabiin: { id: "Atba'ut Tabi'in", en: "Atba'ut Tabi'in" },
    tabaqah_5: { id: "Tabaqah ke-5", en: "5th Generation" },
    tabaqah_6: { id: "Tabaqah ke-6", en: "6th Generation" },
    tabaqah_7: { id: "Tabaqah ke-7", en: "7th Generation" },
};

const STATUS_COLORS = {
    tsiqah_tsiqah:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    tsiqah: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    shaduq: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    la_baasa_bihi:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    maqbul: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    majhul: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    layyin: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    dhaif: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    matruk: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    kadzdzab: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    nabi: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function StatusBadge({ status }) {
    if (!status) return null;
    const color =
        STATUS_COLORS[status] ??
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    const label = status.replace(/_/g, " ");
    return (
        <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${color}`}
        >
            {label}
        </span>
    );
}

export default function DashboardPerawiPage() {
    return <PerawiContent basePath='/dashboard/perawi' />;
}

export function PerawiContent({
    basePath = "/dashboard/perawi",
    initialPerawi = [],
    initialTotal = 0,
}) {
    const { t, lang } = useLocale();
    const [perawi, setPerawi] = useState(initialPerawi);
    const [total, setTotal] = useState(initialTotal);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [tabaqah, setTabaqah] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(initialPerawi.length === 0);

    const fetchPerawi = useCallback(async (pg, q, tab, reset = false) => {
        setLoading(true);
        try {
            let url;
            if (q) {
                url = `${API_URL}/api/v1/perawi/search?q=${encodeURIComponent(q)}&page=${pg}&size=20`;
            } else if (tab) {
                url = `${API_URL}/api/v1/perawi/tabaqah/${tab}?page=${pg}&size=20`;
            } else {
                url = `${API_URL}/api/v1/perawi?page=${pg}&size=20`;
            }
            const res = await fetch(url);
            const data = await res.json();
            const items = Array.isArray(data?.items ?? data)
                ? (data?.items ?? data)
                : [];
            if (reset) {
                setPerawi(items);
            } else {
                setPerawi((prev) => [...prev, ...items]);
            }
            setTotal(data?.total_items ?? data?.total ?? 0);
            setHasMore(items.length === 20);
        } catch {
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialPerawi.length > 0 && search === "" && tabaqah === "") {
            return;
        }
        setPage(0);
        setHasMore(true);
        fetchPerawi(0, search, tabaqah, true);
    }, [search, tabaqah, fetchPerawi, initialPerawi.length]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput.trim());
    };

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchPerawi(next, search, tabaqah);
    };

    const tabaqahLabel = (key) => {
        const entry = TABAQAH_LABELS[key];
        if (!entry) return key?.replace(/_/g, " ") ?? key;
        return lang === "EN" ? entry.en : entry.id;
    };

    return (
        <div className='p-6'>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                    {t("perawi.title")}
                </h1>
                {total > 0 && (
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                        {total} {t("perawi.unit")}
                    </p>
                )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className='relative mb-4 max-w-lg'>
                <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                    type='text'
                    placeholder={t("perawi.search_placeholder")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className='w-full pl-9 pr-20 py-2.5 border border-gray-200 dark:border-gray-700 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-700'
                />
                <button
                    type='submit'
                    className='absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors'
                >
                    {t("common.search")}
                </button>
            </form>

            {/* Tabaqah filter */}
            <div className='flex flex-wrap gap-2 mb-6'>
                {[
                    { key: "", label: t("perawi.filter_all") },
                    ...Object.keys(TABAQAH_LABELS).map((k) => ({
                        key: k,
                        label: tabaqahLabel(k),
                    })),
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => {
                            setTabaqah(key);
                            setSearch("");
                            setSearchInput("");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            tabaqah === key
                                ? "bg-teal-600 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading && perawi.length === 0 ? (
                <div className='text-center py-16 text-gray-400 text-sm'>
                    {t("perawi.loading")}
                </div>
            ) : perawi.length === 0 ? (
                <div className='text-center py-16 text-gray-400 text-sm'>
                    {t("perawi.empty")}
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {perawi.map((p) => (
                        <Link
                            key={p.id}
                            href={`${basePath}/${p.id}`}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-sm transition-all p-4 group flex gap-3'
                        >
                            <div className='w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 text-lg group-hover:bg-teal-100 transition-colors'>
                                <BsPeopleFill />
                            </div>
                            <div className='min-w-0 flex-1'>
                                <p
                                    dir='rtl'
                                    className='font-arabic text-base text-gray-800 dark:text-gray-200 dark:text-gray-100 leading-snug text-right mb-0.5'
                                >
                                    {p.nama_arab}
                                </p>
                                <p className='text-xs font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 group-hover:text-teal-700 hover:dark:text-teal-400 dark:group-hover:text-teal-400 transition-colors truncate'>
                                    {p.nama_latin}
                                </p>
                                <div className='flex flex-wrap items-center gap-1.5 mt-1.5'>
                                    {p.tabaqah && (
                                        <span className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                            {tabaqahLabel(p.tabaqah)}
                                        </span>
                                    )}
                                    {p.tahun_wafat && (
                                        <span className='text-xs text-gray-400'>
                                            · {p.tahun_wafat}{" "}
                                            {t("perawi.hijri")}
                                        </span>
                                    )}
                                </div>
                                {p.status && (
                                    <div className='mt-1.5'>
                                        <StatusBadge status={p.status} />
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {hasMore && !loading && perawi.length > 0 && (
                <div className='text-center mt-6'>
                    <button
                        onClick={loadMore}
                        className='px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors'
                    >
                        {t("common.load_more") ?? "Muat Lebih"}
                    </button>
                </div>
            )}
        </div>
    );
}
