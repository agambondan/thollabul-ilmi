"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
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

export function TokohListContent({ className = "" }) {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [era, setEra] = useState("");
    const [selected, setSelected] = useState(null);
    const modalA11y = useModalA11y({
        open: !!selected,
        onClose: () => setSelected(null),
    });
    const page = 1;

    useEffect(() => {
        setLoading(true);
        const params = { page: "1", size: "100" };
        if (search) params.q = search;
        if (era) params.era = era;
        tokohTarikhApi
            .list(params)
            .then((r) => r.json())
            .then((d) => setItems(d?.items ?? []))
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, [search, era]);

    return (
        <ContentWidth compact='max-w-4xl' className={`px-4 py-6 ${className}`}>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl mb-4'>
                    <BsPeopleFill className='text-3xl text-indigo-600 dark:text-indigo-400' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-1'>
                    {t("tokoh.title") ?? "Tokoh Tarikh"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("tokoh.subtitle") ??
                        "Biografi ulama, ilmuwan, dan tokoh Islam"}
                </p>
            </div>

            <div className='flex items-center gap-2 mb-4 flex-wrap'>
                <div className='flex-1 min-w-[200px] flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                    <BsSearch className='text-gray-400 shrink-0' />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("tokoh.search") ?? "Cari tokoh..."}
                        className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                    />
                </div>
                <select
                    value={era}
                    onChange={(e) => setEra(e.target.value)}
                    className='px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                >
                    {ERA_FILTERS.map((f) => (
                        <option key={f.value} value={f.value}>
                            {t(f.labelKey) || "Semua"}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className='p-5 bg-white dark:bg-slate-800 rounded-2xl border animate-pulse'
                        >
                            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 mb-3' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2' />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border'>
                    <p className='text-sm text-gray-400'>
                        {t("tokoh.empty") ?? "Belum ada data tokoh."}
                    </p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelected(item)}
                            className='text-left p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors'
                        >
                            <div className='flex items-start gap-3'>
                                <div className='w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl shrink-0'>
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            className='w-full h-full rounded-xl object-cover'
                                            alt=''
                                        />
                                    ) : (
                                        "👤"
                                    )}
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <p className='font-semibold text-gray-900 dark:text-white'>
                                        {item.nama}
                                    </p>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {item.era || item.kategori}
                                    </p>
                                    {item.tahun_lahir && (
                                        <p className='text-xs text-gray-400 mt-0.5'>
                                            {item.tahun_lahir} –{" "}
                                            {item.tahun_wafat || "..."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selected && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'
                    onClick={() => setSelected(null)}
                >
                    <div
                        {...modalA11y}
                        className='bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-3xl shrink-0'>
                                {selected.image_url ? (
                                    <img
                                        src={selected.image_url}
                                        className='w-full h-full rounded-xl object-cover'
                                        alt=''
                                    />
                                ) : (
                                    "👤"
                                )}
                            </div>
                            <div>
                                <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                                    {selected.nama}
                                </h2>
                                <p className='text-xs text-gray-500'>
                                    {selected.era || selected.kategori}
                                    {selected.tahun_lahir
                                        ? ` · ${selected.tahun_lahir} – ${selected.tahun_wafat || "..."}`
                                        : ""}
                                </p>
                            </div>
                        </div>
                        <div className='prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap'>
                            {selected.biografi}
                        </div>
                        {selected.kontribusi && (
                            <div className='mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl'>
                                <p className='text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1'>
                                    {t("tokoh.kontribusi") ?? "Kontribusi"}
                                </p>
                                <p className='text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap'>
                                    {selected.kontribusi}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => setSelected(null)}
                            className='mt-4 w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors'
                        >
                            {t("common.close")}
                        </button>
                    </div>
                </div>
            )}
        </ContentWidth>
    );
}

export default function TokohPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <TokohListContent className='pt-navbar' />
        </main>
    );
}
