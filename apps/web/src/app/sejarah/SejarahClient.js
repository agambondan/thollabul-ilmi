"use client";

import { useLocale } from "@/context/Locale";
import { historyApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { useEffect, useMemo, useState } from "react";
import { BsChevronDown, BsChevronUp, BsSearch } from "react-icons/bs";
import { MdTimeline } from "react-icons/md";

const CATEGORIES = [
    { key: "semua", labelKey: "common.all" },
    { key: "nabi", labelKey: "history.cat.prophet" },
    { key: "khulafa", labelKey: "history.cat.khulafa" },
    { key: "dinasti", labelKey: "history.cat.dynasty" },
    { key: "ulama", labelKey: "history.cat.scholar" },
    { key: "peristiwa", labelKey: "history.cat.event" },
];

const CAT_COLOR = {
    nabi: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    khulafa: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    dinasti:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    ulama: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    peristiwa:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const formatYear = (ev) => {
    if (ev.year_miladi == null) return "";
    return ev.year_miladi < 0
        ? `${Math.abs(ev.year_miladi)} SM`
        : `${ev.year_miladi} M`;
};

const formatHijri = (ev) => {
    if (ev.year_hijri == null || ev.year_hijri <= 0) return "";
    return `${ev.year_hijri} H`;
};

export default function SejarahClient({ initialEvents = [] }) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [activeCategory, setActiveCategory] = useState("semua");
    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState(null);
    const [events, setEvents] = useState(initialEvents);
    const [isLoading, setIsLoading] = useState(initialEvents.length === 0);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (initialEvents.length > 0 && activeCategory === "semua" && lang === "ID") return;
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        const params =
            activeCategory === "semua" ? {} : { category: activeCategory };
        historyApi
            .list(params, lang)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setEvents(Array.isArray(data) ? data : (data?.items ?? []));
            })
            .catch(() => {
                if (cancelled) return;
                setError(true);
                setEvents([]);
            })
            .finally(() => {
                if (cancelled) return;
                setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [activeCategory, lang, initialEvents.length]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return events;
        return events.filter((ev) => {
            const title = (getLocalizedField(ev, "title", lang) || "").toLowerCase();
            const desc = (getLocalizedField(ev, "description", lang) || "").toLowerCase();
            const yearM = formatYear(ev).toLowerCase();
            const yearH = formatHijri(ev).toLowerCase();
            return (
                title.includes(q) ||
                desc.includes(q) ||
                yearM.includes(q) ||
                yearH.includes(q)
            );
        });
    }, [events, search, lang]);

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-3xl"
            }
        >
            <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                    <MdTimeline className='text-xl text-emerald-700 dark:text-emerald-400' />
                </div>
                <div>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("history.title")}
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("history.subtitle")}
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 px-3 py-2'>
                <BsSearch className='text-gray-400 shrink-0' />
                <input
                    type='text'
                    placeholder={t("history.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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

            <div className='flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide'>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            activeCategory === cat.key
                                ? "bg-emerald-700 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                        }`}
                    >
                        {t(cat.labelKey)}
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className='space-y-4'>
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 animate-pulse'
                        >
                            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                        </div>
                    ))}
                </div>
            )}

            {error && !isLoading && (
                <div className='text-center py-12 text-gray-400'>
                    <p className='text-sm'>{t("history.load_error")}</p>
                </div>
            )}

            {!isLoading && !error && filtered.length === 0 && (
                <div className='text-center py-12 text-gray-400'>
                    <p className='text-sm'>
                        {search
                            ? t("history.no_search")
                            : t("history.empty_title")}
                    </p>
                </div>
            )}

            {!isLoading && !error && filtered.length > 0 && (
                <div className='relative pl-6 border-l-2 border-emerald-200 dark:border-emerald-800/50 space-y-6'>
                    {filtered.map((ev) => {
                        const isOpen = openId === ev.id;
                        const cat = ev.category || "peristiwa";
                        const badgeColor =
                            CAT_COLOR[cat] ||
                            "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300";
                        const yearM = formatYear(ev);
                        const yearH = formatHijri(ev);
                        const title =
                            getLocalizedField(ev, "title", lang) ||
                            ev.title_id ||
                            ev.title_en ||
                            "-";
                        const desc =
                            getLocalizedField(ev, "description", lang) ||
                            ev.description_id ||
                            ev.description_en ||
                            "";

                        return (
                            <div key={ev.id} className='relative group'>
                                <div className='absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm' />
                                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-700/60 transition-all'>
                                    <div
                                        className='flex items-start justify-between gap-2 cursor-pointer select-none'
                                        onClick={() =>
                                            setOpenId(isOpen ? null : ev.id)
                                        }
                                    >
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center gap-2 flex-wrap mb-1'>
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}
                                                >
                                                    {t(
                                                        `history.cat.${cat}`,
                                                        cat,
                                                    )}
                                                </span>
                                                {(yearM || yearH) && (
                                                    <span className='text-xs font-bold text-emerald-700 dark:text-emerald-400'>
                                                        {[yearM, yearH]
                                                            .filter(Boolean)
                                                            .join(" / ")}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className='text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'>
                                                {title}
                                            </h2>
                                        </div>
                                        <button
                                            type='button'
                                            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 mt-0.5'
                                            aria-label='Toggle detail'
                                        >
                                            {isOpen ? (
                                                <BsChevronUp className='text-sm' />
                                            ) : (
                                                <BsChevronDown className='text-sm' />
                                            )}
                                        </button>
                                    </div>

                                    {isOpen && desc && (
                                        <div className='mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line'>
                                            {desc}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
