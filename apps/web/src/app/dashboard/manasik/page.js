"use client";

import { useLocale } from "@/context/Locale";
import { getLocalizedField, getLocalizedTranslation } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

export default function DashboardManasikPage() {
    const { t, lang } = useLocale();
    const [hajiItems, setHajiItems] = useState([]);
    const [umrahItems, setUmrahItems] = useState([]);
    const [tab, setTab] = useState("haji");
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/manasik?page=0&size=100`,
        )
            .then((r) => r.json())
            .then((d) => {
                const arr = d?.items ?? d ?? [];
                if (!Array.isArray(arr) || arr.length === 0) return;
                const haji = arr
                    .filter((i) => toStr(i.type) === "haji")
                    .sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
                const umrah = arr
                    .filter((i) => toStr(i.type) === "umrah")
                    .sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
                if (haji.length > 0) setHajiItems(haji);
                if (umrah.length > 0) setUmrahItems(umrah);
            })
            .catch((e) => console.error(e));
    }, []);

    const activeItems = tab === "haji" ? hajiItems : umrahItems;

    return (
        <div className='p-6'>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {t("manasik.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
                    {t("manasik.subtitle")}
                </p>
            </div>

            {/* Tab toggle */}
            <div className='flex gap-2 mb-5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-fit'>
                {["haji", "umrah"].map((tabKey) => (
                    <button
                        key={tabKey}
                        onClick={() => {
                            setTab(tabKey);
                            setExpanded(null);
                        }}
                        className={`px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                            tab === tabKey
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        {t(`manasik.${tabKey}`)}
                    </button>
                ))}
            </div>

            {/* Steps */}
            <div className='space-y-2'>
                {activeItems.map((item) => {
                    const id =
                        item.id ?? item._id ?? `${item.type}-${item.step}`;
                    const open = expanded === id;
                    return (
                        <div
                            key={id}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                        >
                            <button
                                onClick={() => setExpanded(open ? null : id)}
                                className='w-full text-left px-4 py-3 flex items-center justify-between gap-3'
                            >
                                <div className='flex items-center gap-3'>
                                    <span className='w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0'>
                                        {item.step}
                                    </span>
                                    <span className='text-sm font-semibold text-gray-900 dark:text-white'>
                                        {getLocalizedField(item, "title", lang)}
                                    </span>
                                </div>
                                {open ? (
                                    <BsChevronUp className='text-gray-400 shrink-0' />
                                ) : (
                                    <BsChevronDown className='text-gray-400 shrink-0' />
                                )}
                            </button>
                            {open && (
                                <div className='px-4 pb-4 border-t border-gray-50 dark:border-slate-700 pt-3 space-y-2'>
                                    {getLocalizedField(
                                        item,
                                        "description",
                                        lang,
                                    ) && (
                                        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                            {getLocalizedField(
                                                item,
                                                "description",
                                                lang,
                                            )}
                                        </p>
                                    )}
                                    {item.arabic && (
                                        <p
                                            dir='rtl'
                                            className='text-lg font-arabic leading-loose text-gray-800 dark:text-gray-200 text-right'
                                        >
                                            {item.arabic}
                                        </p>
                                    )}
                                    {item.latin && (
                                        <p className='text-sm italic text-gray-500 dark:text-gray-400'>
                                            {item.latin}
                                        </p>
                                    )}
                                    {getLocalizedTranslation(
                                        item.translation,
                                        lang,
                                    ) && (
                                        <p className='text-sm text-gray-700 dark:text-gray-300'>
                                            {getLocalizedTranslation(
                                                item.translation,
                                                lang,
                                            )}
                                        </p>
                                    )}
                                    {(item.wajib !== undefined ||
                                        item.is_required !== undefined) && (
                                        <div>
                                            <span
                                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                    (item.wajib ??
                                                    item.is_required)
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400"
                                                }`}
                                            >
                                                {(item.wajib ??
                                                item.is_required)
                                                    ? (t("manasik.required") ??
                                                      "Wajib")
                                                    : (t("manasik.sunnah") ??
                                                      "Sunnah")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
