"use client";

import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useState, useEffect } from "react";
import { BsSearch, BsBoxArrowUpRight } from "react-icons/bs";

const CATEGORIES = [
    "aqidah",
    "fiqh",
    "akhlak",
    "tafsir",
    "hadits",
    "sirah",
    "umum",
];

const platformStyle = {
    video: "bg-red-100 text-red-700",
    audio: "bg-green-100 text-green-700",
    text: "bg-blue-100 text-blue-700",
};

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

export default function KajianDashboardPage() {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("");

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/kajian?page=0&size=50`)
            .then((res) => res.json())
            .then((data) => {
                const list = data?.items ?? data ?? [];
                setItems(Array.isArray(list) ? list : []);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const filtered = items.filter((item) => {
        const q = search.toLowerCase();
        const matchSearch =
            getLocalizedField(item, "title", lang).toLowerCase().includes(q) ||
            getLocalizedField(item, "description", lang)
                .toLowerCase()
                .includes(q) ||
            item.speaker?.toLowerCase().includes(q);
        const matchCategory = activeCategory
            ? toStr(item.topic) === activeCategory
            : true;
        return matchSearch && matchCategory;
    });

    const totalKajian = items.length;
    const youtubeCount = items.filter(
        (i) => toStr(i.type).toLowerCase() === "video",
    ).length;
    const categoryCount = new Set(
        items.map((i) => toStr(i.topic)).filter(Boolean),
    ).size;

    return (
        <div className='p-6'>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-1'>
                {t("kajian.title")}
            </h1>
            <p className='text-gray-500 dark:text-gray-400 mb-4'>
                {t("kajian.subtitle")}
            </p>

            {/* Stats */}
            <div className='grid grid-cols-3 gap-2 sm:gap-3 mb-5'>
                <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                        {t("kajian.total_label") ?? "Total"}
                    </p>
                    <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                        {totalKajian}
                    </p>
                </div>
                <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                        Video
                    </p>
                    <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                        {youtubeCount}
                    </p>
                </div>
                <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                    <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                        {t("kajian.categories_label") ?? "Kategori"}
                    </p>
                    <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                        {categoryCount}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className='relative mb-4'>
                <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                    type='text'
                    placeholder={t("kajian.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:bg-slate-800 dark:text-white'
                />
            </div>

            {/* Category pills */}
            <div className='flex flex-wrap gap-2 mb-6'>
                <button
                    onClick={() => setActiveCategory("")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeCategory === ""
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                >
                    {t("common.all")}
                </button>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() =>
                            setActiveCategory(cat === activeCategory ? "" : cat)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                            activeCategory === cat
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading && (
                <p className='text-center text-gray-400 py-10'>
                    {t("kajian.loading")}
                </p>
            )}

            {!loading && filtered.length === 0 && (
                <p className='text-center text-gray-400 py-10'>
                    {t("kajian.not_found")}
                </p>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {filtered.map((item) => {
                    const id = item.id ?? item._id;
                    const platformClass =
                        platformStyle[toStr(item.type).toLowerCase()] ??
                        "bg-gray-100 text-gray-600";

                    const CardContent = (
                        <div className='border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm p-4 h-full hover:shadow-md transition-shadow'>
                            <div className='flex items-start justify-between mb-2'>
                                <div className='flex gap-2 flex-wrap'>
                                    {item.type && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${platformClass}`}
                                        >
                                            {toStr(item.type)}
                                        </span>
                                    )}
                                    {item.topic && (
                                        <span className='px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 capitalize'>
                                            {toStr(item.topic)}
                                        </span>
                                    )}
                                </div>
                                {item.url && (
                                    <BsBoxArrowUpRight className='text-gray-400 flex-shrink-0 text-sm mt-0.5' />
                                )}
                            </div>
                            <h3 className='font-semibold text-gray-800 dark:text-white text-sm mb-1 line-clamp-2'>
                                {getLocalizedField(item, "title", lang)}
                            </h3>
                            <p className='text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1'>
                                {toStr(item.speaker)}
                            </p>
                            {item.duration_seconds ? (
                                <p className='text-xs text-gray-400 mb-2'>
                                    {item.duration_seconds} detik
                                </p>
                            ) : null}
                            {getLocalizedField(item, "description", lang) && (
                                <p className='text-xs text-gray-500 dark:text-gray-400 line-clamp-2'>
                                    {getLocalizedField(
                                        item,
                                        "description",
                                        lang,
                                    )}
                                </p>
                            )}
                        </div>
                    );

                    return item.url ? (
                        <a
                            key={id}
                            href={item.url}
                            target='_blank'
                            rel='noreferrer'
                            className='block'
                        >
                            {CardContent}
                        </a>
                    ) : (
                        <div key={id}>{CardContent}</div>
                    );
                })}
            </div>
        </div>
    );
}
