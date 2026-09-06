"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { fiqhApi } from "@/lib/api";
import { getLocalizedField, getLocalizedText } from "@/lib/translation";
import { useEffect, useMemo, useState } from "react";
import SourceBadges from "@/components/SourceBadges";

const CATEGORY_ICON = {
    thaharah: "💧",
    sholat: "🕌",
    puasa: "🌙",
    zakat: "💰",
    haji: "🕋",
    umrah: "🕋",
    "jenazah-pemulasaran": "🤲",
    jenazah: "🤲",
    muamalah: "🤝",
    nikah: "💍",
    aqidah: "☪️",
    akhlak: "🌟",
};

const slugIcon = (slug = "") => {
    const key = String(slug).toLowerCase();
    return CATEGORY_ICON[key] ?? "📖";
};

export default function FiqhClient({
    initialCategories = [],
    initialGroupedItems = {},
}) {
    const { t, lang } = useLocale();
    const [openCategory, setOpenCategory] = useState(null);
    const [openItem, setOpenItem] = useState({});
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState(initialCategories);
    const [itemsByCategory, setItemsByCategory] = useState(initialGroupedItems);
    const [isLoading, setIsLoading] = useState(initialCategories.length === 0);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (initialCategories.length > 0 && lang === "ID") return;
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        fiqhApi
            .listCategories(lang)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setCategories(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (cancelled) return;
                setError(true);
                setCategories([]);
            })
            .finally(() => {
                if (cancelled) return;
                setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [lang, initialCategories.length]);

    // Warm up the per-category items in the background so the first open of
    // each category is instant. Skips when SSR already shipped the data.
    useEffect(() => {
        if (Object.keys(initialGroupedItems).length > 0) return;
        if (categories.length === 0) return;
        let cancelled = false;
        Promise.all(
            categories.map((cat) =>
                fiqhApi
                    .categoryBySlug(cat.slug, lang)
                    .then((res) => res.json())
                    .then((data) => {
                        if (cancelled) return;
                        const items = Array.isArray(data?.items)
                            ? data.items
                            : [];
                        setItemsByCategory((prev) => ({
                            ...prev,
                            [cat.slug]: items,
                        }));
                    })
                    .catch(() => {}),
            ),
        );
        return () => {
            cancelled = true;
        };
    }, [categories, lang, initialGroupedItems]);

    useEffect(() => {
        if (Object.keys(initialGroupedItems).length > 0 && lang === "ID") return;
        let cancelled = false;
        fiqhApi
            .listItems(500, lang)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                const items = Array.isArray(data?.items) ? data.items : [];
                if (items.length === 0) return;
                const grouped = {};
                for (const item of items) {
                    const slug = item.category;
                    if (!slug) continue;
                    (grouped[slug] ??= []).push(item);
                }
                setItemsByCategory(grouped);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [lang, initialGroupedItems]);

    const loadCategoryItems = async (slug) => {
        if (itemsByCategory[slug]) return;
        try {
            const res = await fiqhApi.categoryBySlug(slug, lang);
            const data = await res.json();
            setItemsByCategory((prev) => ({
                ...prev,
                [slug]: Array.isArray(data?.items) ? data.items : [],
            }));
        } catch {
            setItemsByCategory((prev) => ({ ...prev, [slug]: [] }));
        }
    };

    const toggleCategory = (i, slug) => {
        const willOpen = openCategory !== i;
        setOpenCategory(willOpen ? i : null);
        setOpenItem({});
        if (willOpen && slug) loadCategoryItems(slug);
    };

    const toggleItem = (ci, ii) => {
        const key = `${ci}-${ii}`;
        setOpenItem((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const enrichedCategories = useMemo(() => {
        return categories.map((cat) => ({
            ...cat,
            items: itemsByCategory[cat.slug] ?? [],
        }));
    }, [categories, itemsByCategory]);

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return enrichedCategories;
        return enrichedCategories
            .map((cat) => {
                const items = (cat.items ?? []).filter((item) => {
                    const haystack = [
                        getLocalizedField(cat, "name", lang),
                        getLocalizedText(cat?.translation?.ar, lang),
                        getLocalizedField(item, "title", lang),
                        getLocalizedField(item, "content", lang),
                        item.source,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();
                    return haystack.includes(query);
                });
                return { ...cat, items };
            })
            .filter(
                (cat) =>
                    (cat.items?.length ?? 0) > 0 ||
                    getLocalizedField(cat, "name", lang)
                        ?.toLowerCase()
                        .includes(query),
            );
    }, [enrichedCategories, search, lang]);

    return (
        <ContentWidth compact='max-w-4xl' className='px-4 py-8'>
            <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                    <svg
                        className='w-5 h-5 text-emerald-700 dark:text-emerald-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                        />
                    </svg>
                </div>
                <div>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("fiqh.title")}
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("fiqh.subtitle")}
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-2 mb-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                <svg
                    className='w-4 h-4 text-gray-400 shrink-0'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                </svg>
                <input
                    type='text'
                    placeholder={t("fiqh.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                />
                {search && (
                    <button
                        type='button'
                        onClick={() => setSearch("")}
                        className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'
                    >
                        {t("common.clear")}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className='space-y-3'>
                    {[1, 2, 3, 4].map((n) => (
                        <div
                            key={n}
                            className='h-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 animate-pulse'
                        />
                    ))}
                </div>
            ) : error ? (
                <div className='text-center py-12 text-gray-500 dark:text-gray-400'>
                    <p className='text-sm'>{t("fiqh.error")}</p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className='text-center py-12 text-gray-400'>
                    <p className='text-sm'>{t("fiqh.not_found")}</p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {filteredCategories.map((cat, ci) => {
                        const isOpen = openCategory === ci;
                        const icon = slugIcon(cat.slug);
                        const itemCount = cat.items?.length ?? 0;
                        const catTitle =
                            getLocalizedField(cat, "name", lang) || cat.slug;
                        const catArabic = getLocalizedText(
                            cat?.translation?.ar,
                            lang,
                        );
                        return (
                            <div
                                key={cat.id ?? cat.slug ?? ci}
                                className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm transition-all'
                            >
                                <button
                                    type='button'
                                    onClick={() =>
                                        toggleCategory(ci, cat.slug)
                                    }
                                    className='w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors'
                                >
                                    <div className='flex items-center gap-3 min-w-0'>
                                        <span className='text-2xl shrink-0'>
                                            {icon}
                                        </span>
                                        <div className='min-w-0'>
                                            <div className='flex items-baseline gap-2 flex-wrap'>
                                                <h2 className='text-sm font-semibold text-gray-800 dark:text-gray-100'>
                                                    {catTitle}
                                                </h2>
                                                {catArabic && (
                                                    <span
                                                        className='text-xs text-emerald-700 dark:text-emerald-400'
                                                        style={{
                                                            fontFamily:
                                                                "Amiri, serif",
                                                        }}
                                                    >
                                                        {catArabic}
                                                    </span>
                                                )}
                                            </div>
                                            <p className='text-xs text-gray-400 mt-0.5'>
                                                {itemCount}{" "}
                                                {t("fiqh.topic_count")}
                                            </p>
                                        </div>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 9l-7 7-7-7'
                                        />
                                    </svg>
                                </button>

                                {isOpen && (
                                    <div className='border-t border-gray-100 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700/50'>
                                        {cat.items?.length === 0 ? (
                                            <p className='p-4 text-xs text-gray-400 text-center'>
                                                {t("fiqh.empty_items")}
                                            </p>
                                        ) : (
                                            cat.items.map((item, ii) => {
                                                const isItemOpen =
                                                    !!openItem[`${ci}-${ii}`];
                                                const itemTitle =
                                                    getLocalizedField(
                                                        item,
                                                        "title",
                                                        lang,
                                                    ) ||
                                                    getLocalizedField(
                                                        item,
                                                        "question",
                                                        lang,
                                                    ) ||
                                                    "";
                                                const itemContent =
                                                    getLocalizedField(
                                                        item,
                                                        "content",
                                                        lang,
                                                    ) ||
                                                    getLocalizedField(
                                                        item,
                                                        "answer",
                                                        lang,
                                                    ) ||
                                                    "";
                                                return (
                                                    <div
                                                        key={
                                                            item.id ??
                                                            item.slug ??
                                                            ii
                                                        }
                                                        className='p-4'
                                                    >
                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                toggleItem(
                                                                    ci,
                                                                    ii,
                                                                )
                                                            }
                                                            className='w-full flex items-center justify-between text-left gap-2'
                                                        >
                                                            <h3 className='text-xs font-semibold text-emerald-900 dark:text-emerald-300'>
                                                                {itemTitle}
                                                            </h3>
                                                            <svg
                                                                className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${isItemOpen ? "rotate-180" : ""}`}
                                                                fill='none'
                                                                viewBox='0 0 24 24'
                                                                stroke='currentColor'
                                                            >
                                                                <path
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                    strokeWidth={2}
                                                                    d='M19 9l-7 7-7-7'
                                                                />
                                                            </svg>
                                                        </button>

                                                        {isItemOpen && (
                                                            <div className='mt-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line'>
                                                                {itemContent}
                                                                {item.source && (
                                                                    <div className='mt-2'>
                                                                        <SourceBadges
                                                                            source={
                                                                                item.source
                                                                            }
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </ContentWidth>
    );
}
