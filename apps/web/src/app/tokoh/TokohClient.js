"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { tokohTarikhApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsPeopleFill, BsSearch } from "react-icons/bs";
import { useModalA11y } from "@/lib/useModalA11y";

const ERA_FILTERS = [
    { value: "", labelKey: "common.all" },
    { value: "Sahabat", labelKey: "tokoh.era_sahabat" },
    { value: "Tabi'in", labelKey: "tokoh.era_tabiin" },
    { value: "Tabi'ut Tabi'in", labelKey: "tokoh.era_tabiut_tabiin" },
    { value: "Ulama Klasik", labelKey: "tokoh.era_klasik" },
    { value: "Ulama Modern", labelKey: "tokoh.era_modern" },
    { value: "Ilmuwan", labelKey: "tokoh.era_ilmuwan" },
    { value: "Khalifah", labelKey: "tokoh.era_khalifah" },
];

export default function TokohClient({ initialItems = [], className = "" }) {
    const { t, lang } = useLocale();
    const [items, setItems] = useState(initialItems);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [era, setEra] = useState("");
    const [selected, setSelected] = useState(null);
    const modalA11y = useModalA11y({
        open: !!selected,
        onClose: () => setSelected(null),
    });

    useEffect(() => {
        if (!search && !era && initialItems.length > 0) {
            setItems(initialItems);
            return;
        }
        setLoading(true);
        const params = { page: "1", size: "100", lang };
        if (search) params.q = search;
        if (era) params.era = era;
        tokohTarikhApi
            .list(params)
            .then((r) => r.json())
            .then((d) => setItems(d?.items ?? []))
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, [search, era, lang, initialItems]);

    return (
        <ContentWidth compact='max-w-4xl' className={`px-4 py-6 ${className}`}>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl mb-4'>
                    <BsPeopleFill className='text-3xl text-indigo-600 dark:text-indigo-400' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1'>
                    {t("tokoh.title") ?? "Tokoh Tarikh"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("tokoh.subtitle") ??
                        "Biografi ulama, ilmuwan, dan tokoh Islam"}
                </p>
            </div>

            {/* Search & Filter */}
            <div className='mb-6 space-y-3'>
                <div className='relative'>
                    <BsSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={
                            t("tokoh.search_placeholder") ??
                            "Cari nama tokoh..."
                        }
                        className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500'
                    />
                </div>

                {/* Era chips */}
                <div className='flex gap-1.5 flex-wrap'>
                    {ERA_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            type='button'
                            onClick={() => setEra(f.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                era === f.value
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                            }`}
                        >
                            {t(f.labelKey) ?? f.value}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className='text-center py-16'>
                    <div className='w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2' />
                    <p className='text-xs text-gray-400'>
                        {t("common.loading")}
                    </p>
                </div>
            ) : items.length === 0 ? (
                <div className='text-center py-16 text-gray-400'>
                    <p className='text-sm'>{t("tokoh.empty") ?? "Tidak ada tokoh yang cocok."}</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {items.map((item) => (
                        <button
                            key={item.id}
                            type='button'
                            onClick={() => setSelected(item)}
                            className='text-left p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:shadow-sm flex flex-col justify-between'
                        >
                            <div>
                                <div className='flex items-start justify-between gap-2 mb-2'>
                                    <h2 className='text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1'>
                                        {item.name}
                                    </h2>
                                    {item.era && (
                                        <span className='shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'>
                                            {item.era}
                                        </span>
                                    )}
                                </div>
                                {item.arabic_name && (
                                    <p
                                        dir='rtl'
                                        className='text-base text-gray-500 dark:text-gray-400 mb-2 font-arabic'
                                    >
                                        {item.arabic_name}
                                    </p>
                                )}
                                <p className='text-xs text-gray-500 dark:text-gray-400 line-clamp-2'>
                                    {item.short_bio ?? item.biography}
                                </p>
                            </div>
                            <div className='mt-3 pt-2 border-t border-gray-50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-gray-400'>
                                <span>
                                    {item.birth_year || item.death_year
                                        ? `${item.birth_year ?? "?"} – ${item.death_year ?? "?"} H`
                                        : null}
                                </span>
                                <span className='text-indigo-600 dark:text-indigo-400 font-medium'>
                                    {t("common.read_more") ?? "Lihat →"}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Modal Detail */}
            {selected && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
                    <div
                        {...modalA11y}
                        className='bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl border border-gray-100 dark:border-slate-700'
                    >
                        <div className='flex items-start justify-between gap-3 mb-3'>
                            <div>
                                <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                                    {selected.name}
                                </h3>
                                {selected.era && (
                                    <span className='inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'>
                                        {selected.era}
                                    </span>
                                )}
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelected(null)}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg p-1'
                            >
                                ✕
                            </button>
                        </div>

                        {selected.arabic_name && (
                            <p
                                dir='rtl'
                                className='text-2xl text-gray-700 dark:text-gray-300 mb-3 font-arabic text-right'
                            >
                                {selected.arabic_name}
                            </p>
                        )}

                        <div className='space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-slate-700 pt-3'>
                            {selected.field && (
                                <p>
                                    <strong className='text-gray-900 dark:text-gray-100'>
                                        {t("tokoh.field") ?? "Bidang"}:
                                    </strong>{" "}
                                    {selected.field}
                                </p>
                            )}
                            {selected.known_for && (
                                <p>
                                    <strong className='text-gray-900 dark:text-gray-100'>
                                        {t("tokoh.known_for") ?? "Dikenal atas"}:
                                    </strong>{" "}
                                    {selected.known_for}
                                </p>
                            )}
                            {selected.major_works && (
                                <p>
                                    <strong className='text-gray-900 dark:text-gray-100'>
                                        {t("tokoh.major_works") ?? "Karya utama"}:
                                    </strong>{" "}
                                    {selected.major_works}
                                </p>
                            )}
                            {selected.biography && (
                                <div className='pt-2'>
                                    <p className='whitespace-pre-line text-sm text-gray-700 dark:text-gray-200'>
                                        {selected.biography}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ContentWidth>
    );
}
