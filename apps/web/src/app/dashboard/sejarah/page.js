"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsChevronDown, BsChevronUp, BsSearch } from "react-icons/bs";

const CATEGORIES = [
    "khulafa",
    "dinasti",
    "peristiwa",
    "perang",
    "ulama",
    "nabi",
    "modern",
    "umum",
];

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

const formatYear = (item) => {
    if (item.year_hijri) return `${item.year_hijri} H`;
    if (item.year_miladi == null) return "";
    return item.year_miladi < 0
        ? `${Math.abs(item.year_miladi)} SM`
        : `${item.year_miladi} M`;
};

export default function SejarahDashboardPage() {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [activeCategory, setActiveCategory] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sejarah?page=0&size=100`,
        )
            .then((res) => res.json())
            .then((data) => {
                const list = data?.items ?? data ?? [];
                setItems(Array.isArray(list) ? list : []);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const filtered = items.filter((item) => {
        const matchCat = activeCategory
            ? toStr(item.category) === activeCategory
            : true;
        if (!matchCat) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return [
            getLocalizedField(item, "title", lang),
            getLocalizedField(item, "description", lang),
            formatYear(item),
            item.year_hijri,
            item.year_miladi,
            toStr(item.category),
        ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q));
    });

    const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-1'>
                {t("sejarah.title")}
            </h1>
            <p className='text-gray-500 dark:text-gray-400 mb-4'>
                {t("sejarah.subtitle")}
            </p>

            {/* Search */}
            <div className='relative mb-4'>
                <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                <input
                    type='text'
                    placeholder={
                        t("sejarah.search_placeholder") ?? "Cari peristiwa..."
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500'
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
                        {cat.replace("-", " ")}
                    </button>
                ))}
            </div>

            {loading && (
                <p className='text-center text-gray-400 py-10'>
                    {t("sejarah.loading")}
                </p>
            )}

            {!loading && filtered.length === 0 && (
                <p className='text-center text-gray-400 py-10'>
                    {t("sejarah.not_found")}
                </p>
            )}

            {/* Timeline */}
            <div className='relative'>
                <div className='absolute left-[2.25rem] top-0 bottom-0 w-0.5 bg-emerald-200' />

                <div className='space-y-4'>
                    {filtered.map((item) => {
                        const id = item.id ?? item._id;
                        const isOpen = expanded === id;
                        return (
                            <div
                                key={id}
                                className='relative flex gap-4 items-start'
                            >
                                {/* Timeline dot */}
                                <div className='relative z-10 flex-shrink-0 w-[4.5rem] flex flex-col items-center pt-3'>
                                    <div className='w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow' />
                                    <span className='text-xs text-emerald-700 font-semibold mt-1 text-center leading-tight'>
                                        {formatYear(item)}
                                    </span>
                                </div>

                                {/* Card */}
                                <div className='flex-1 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden'>
                                    <button
                                        onClick={() => toggle(id)}
                                        className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                                    >
                                        <div className='flex items-center gap-2 flex-wrap'>
                                            <span className='font-semibold text-gray-800 dark:text-white text-sm'>
                                                {getLocalizedField(
                                                    item,
                                                    "title",
                                                    lang,
                                                )}
                                            </span>
                                            {item.category && (
                                                <span className='px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 capitalize'>
                                                    {toStr(item.category)}
                                                </span>
                                            )}
                                        </div>
                                        {isOpen ? (
                                            <BsChevronUp className='text-gray-400 flex-shrink-0' />
                                        ) : (
                                            <BsChevronDown className='text-gray-400 flex-shrink-0' />
                                        )}
                                    </button>

                                    {isOpen && (
                                        <div className='px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3'>
                                            <p className='text-sm text-gray-700 dark:text-gray-300'>
                                                {getLocalizedField(
                                                    item,
                                                    "description",
                                                    lang,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ContentWidth>
    );
}
