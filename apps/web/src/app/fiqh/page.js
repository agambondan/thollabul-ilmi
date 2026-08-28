"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import { useLocale } from "@/context/Locale";
import { fiqhApi } from "@/lib/api";
import { getLocalizedField, getLocalizedText } from "@/lib/translation";
import { useEffect, useMemo, useState } from "react";
import { BsChevronDown, BsSearch } from "react-icons/bs";
import { MdOutlineAutoStories } from "react-icons/md";

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

export default function FiqhPage() {
    const { t, lang } = useLocale();
    const [openCategory, setOpenCategory] = useState(null);
    const [openItem, setOpenItem] = useState({});
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [itemsByCategory, setItemsByCategory] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        fiqhApi
            .listCategories()
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
    }, []);

    const loadCategoryItems = async (slug) => {
        if (itemsByCategory[slug]) return;
        try {
            const res = await fiqhApi.categoryBySlug(slug);
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
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <NavbarTailwindCss />
            <ContentWidth
                compact='max-w-2xl'
                className='flex-1 px-4 pt-24 pb-8'
            >
                {/* Header */}
                <div className='mb-8 text-center'>
                    <div className='inline-flex items-center justify-center w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-2xl mb-4'>
                        <MdOutlineAutoStories className='text-3xl text-teal-600 dark:text-teal-400' />
                    </div>
                    <h1 className='text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-2'>
                        {t("fiqh.title")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t("fiqh.subtitle")}
                    </p>
                </div>

                <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                    <BsSearch className='text-gray-400 shrink-0' />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("fiqh.search_placeholder")}
                        className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                    />
                    {search && (
                        <button
                            type='button'
                            onClick={() => setSearch("")}
                            className='text-xs font-medium text-emerald-600 dark:text-emerald-400'
                        >
                            {t("common.clear")}
                        </button>
                    )}
                </div>

                {isLoading && (
                    <div className='text-center py-12 text-gray-400 dark:text-gray-500 text-sm'>
                        ...
                    </div>
                )}

                {error && !isLoading && (
                    <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                        <p className='text-red-500 dark:text-red-400 text-sm'>
                            {t("fiqh.load_error")}
                        </p>
                    </div>
                )}

                {/* Categories */}
                {!isLoading && !error && (
                    <div className='space-y-3'>
                        {filteredCategories.length === 0 ? (
                            <div className='text-center py-16 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                                {t("fiqh.no_match")}
                            </div>
                        ) : (
                            filteredCategories.map((cat, ci) => {
                                const arabic = getLocalizedText(
                                    cat?.translation?.ar,
                                    lang,
                                );
                                return (
                                    <div
                                        key={cat.id ?? cat.slug ?? ci}
                                        className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden'
                                    >
                                        <button
                                            onClick={() =>
                                                toggleCategory(ci, cat.slug)
                                            }
                                            className='w-full flex items-center justify-between px-5 py-4'
                                        >
                                            <div className='flex items-center gap-3'>
                                                <span className='text-2xl'>
                                                    {slugIcon(cat.slug)}
                                                </span>
                                                <div className='text-left'>
                                                    <p className='font-bold text-gray-900 dark:text-white'>
                                                        {getLocalizedField(
                                                            cat,
                                                            "name",
                                                            lang,
                                                        )}
                                                    </p>
                                                    {arabic && (
                                                        <p
                                                            className='text-xs text-gray-400 dark:text-gray-500'
                                                            style={{
                                                                fontFamily:
                                                                    "Amiri, serif",
                                                            }}
                                                        >
                                                            {arabic}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className='text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full'>
                                                    {cat.items?.length ?? 0}{" "}
                                                    {t("fiqh.topic_unit")}
                                                </span>
                                                <BsChevronDown
                                                    className={`text-gray-400 transition-transform ${openCategory === ci ? "rotate-180" : ""}`}
                                                />
                                            </div>
                                        </button>

                                        {openCategory === ci && (
                                            <div className='border-t border-gray-50 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700'>
                                                {(cat.items?.length ?? 0) ===
                                                0 ? (
                                                    <div className='px-5 py-6 text-center text-xs text-gray-400 dark:text-gray-500'>
                                                        {t(
                                                            "fiqh.empty_category",
                                                        )}
                                                    </div>
                                                ) : (
                                                    cat.items.map(
                                                        (item, ii) => {
                                                            const key = `${ci}-${ii}`;
                                                            const isOpen =
                                                                !!openItem[key];
                                                            return (
                                                                <div
                                                                    key={
                                                                        item.id ??
                                                                        item.slug ??
                                                                        ii
                                                                    }
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            toggleItem(
                                                                                ci,
                                                                                ii,
                                                                            )
                                                                        }
                                                                        className='w-full flex items-center justify-between px-5 py-3.5 text-left bg-gray-50/50 dark:bg-slate-800/50'
                                                                    >
                                                                        <span className='text-sm font-semibold text-emerald-800 dark:text-emerald-300'>
                                                                            {getLocalizedField(
                                                                                item,
                                                                                "title",
                                                                                lang,
                                                                            )}
                                                                        </span>
                                                                        <BsChevronDown
                                                                            className={`text-gray-400 text-xs flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                                                        />
                                                                    </button>
                                                                    {isOpen && (
                                                                        <div className='px-5 pb-4 space-y-2'>
                                                                            <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line'>
                                                                                {getLocalizedField(
                                                                                    item,
                                                                                    "content",
                                                                                    lang,
                                                                                )}
                                                                            </p>
                                                                            {item.source && (
                                                                                <p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
                                                                                    {t(
                                                                                        "fiqh.evidence",
                                                                                    )}
                                                                                    :{" "}
                                                                                    {
                                                                                        item.source
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                <p className='text-center text-xs text-gray-400 dark:text-gray-500 mt-8'>
                    {t("fiqh.disclaimer")}
                </p>
            </ContentWidth>
            <Footer />
        </main>
    );
}
