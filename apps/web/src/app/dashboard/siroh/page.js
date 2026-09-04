"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { sirohApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { BsSearch } from "react-icons/bs";

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

export default function SirohDashboardPage() {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        sirohApi
            .list(0, 50)
            .then((res) => res.json())
            .then((data) => {
                const list = data?.items ?? data ?? [];
                setItems(Array.isArray(list) ? list : []);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className='p-6'>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-200 dark:text-white mb-1'>
                {t("siroh.title")}
            </h1>
            <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-4'>
                {t("siroh.subtitle")}
            </p>

            {/* Search */}
            <div className='relative mb-5'>
                <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                <input
                    type='text'
                    placeholder={
                        t("siroh.search_placeholder") ?? "Cari kisah..."
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400'
                />
            </div>

            {loading && (
                <p className='text-center text-gray-400 py-10'>
                    {t("siroh.loading")}
                </p>
            )}

            {!loading && items.length === 0 && (
                <p className='text-center text-gray-400 py-10'>
                    {t("siroh.not_found")}
                </p>
            )}

            <div className='space-y-3'>
                {items
                    .filter((item) => {
                        if (!search) return true;
                        const q = search.toLowerCase();
                        return [
                            getLocalizedField(item, "title", lang),
                            getLocalizedField(item, "excerpt", lang),
                            toStr(item.category),
                        ]
                            .filter(Boolean)
                            .some((v) => v.toLowerCase().includes(q));
                    })
                    .map((item) => {
                        const id = item.id ?? item._id;
                        return (
                            <Link
                                key={id}
                                href={`/dashboard/siroh/${item.slug ?? id}`}
                                className='block border border-gray-200 dark:border-gray-700 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm p-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all'
                            >
                                <div className='flex items-start gap-3'>
                                    <div className='flex-1 min-w-0'>
                                        <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                            {item.category && (
                                                <span className='px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'>
                                                    {toStr(item.category)}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className='font-bold text-gray-800 dark:text-gray-200 dark:text-white text-sm mb-1'>
                                            {getLocalizedField(
                                                item,
                                                "title",
                                                lang,
                                            )}
                                        </h3>
                                        {getLocalizedField(
                                            item,
                                            "excerpt",
                                            lang,
                                        ) && (
                                            <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 line-clamp-2'>
                                                {getLocalizedField(
                                                    item,
                                                    "excerpt",
                                                    lang,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <span className='text-blue-400 text-xs flex-shrink-0 mt-1'>
                                        →
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
            </div>
        </div>
    );
}
