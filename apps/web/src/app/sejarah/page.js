"use client";

import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
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

const SejarahPage = () => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [activeCategory, setActiveCategory] = useState("semua");
    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState(null);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        const params =
            activeCategory === "semua" ? {} : { category: activeCategory };
        historyApi
            .list(params)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setEvents(Array.isArray(data) ? data : []);
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
    }, [activeCategory]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return events;
        return events.filter((ev) =>
            [
                getLocalizedField(ev, "title", lang),
                getLocalizedField(ev, "description", lang),
                formatYear(ev),
                formatHijri(ev),
                ev.category,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q),
        );
    }, [events, search, lang]);

    const toggle = (i) => setOpenId((prev) => (prev === i ? null : i));

    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <div
                    className={
                        isWide
                            ? "w-full px-4"
                            : "container mx-auto px-4 max-w-2xl"
                    }
                >
                    {/* Header */}
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                            <MdTimeline className='text-xl text-emerald-700 dark:text-emerald-400' />
                        </div>
                        <div>
                            <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                                {t("history.title")}
                            </h1>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                {t("history.subtitle")}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                        <BsSearch className='text-gray-400 shrink-0' />
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("history.search_placeholder")}
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

                    {/* Category filter */}
                    <div className='flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide'>
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

                    {!isLoading && !error && (
                        <p className='text-xs text-gray-400 dark:text-gray-500 mb-4'>
                            {filtered.length} {t("history.event_unit")}
                        </p>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className='text-center py-12 text-gray-400 dark:text-gray-500 text-sm'>
                            ...
                        </div>
                    )}

                    {/* Error */}
                    {error && !isLoading && (
                        <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                            <p className='text-red-500 dark:text-red-400 text-sm'>
                                {t("history.load_error")}
                            </p>
                        </div>
                    )}

                    {/* Timeline */}
                    {!isLoading && !error && filtered.length === 0 ? (
                        <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                            <p className='text-gray-500 dark:text-gray-400 text-sm'>
                                {t("history.no_match")}
                            </p>
                        </div>
                    ) : (
                        !isLoading &&
                        !error && (
                            <div className='relative'>
                                {/* Vertical line */}
                                <div className='absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700' />

                                <div className='space-y-4'>
                                    {filtered.map((ev, i) => {
                                        const isOpen = openId === i;
                                        const yearLabel = formatYear(ev);
                                        const hijriLabel = formatHijri(ev);
                                        return (
                                            <div
                                                key={ev.id ?? i}
                                                className='flex gap-4'
                                            >
                                                {/* Dot */}
                                                <div className='flex-shrink-0 relative z-10 mt-3'>
                                                    <div
                                                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                                                            ev.is_significant
                                                                ? "bg-emerald-600 border-emerald-500 text-white"
                                                                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600"
                                                        }`}
                                                    >
                                                        <span className='text-[9px] font-bold leading-none text-center'>
                                                            {ev.is_significant
                                                                ? "★"
                                                                : "•"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Card */}
                                                <div className='flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                                                    <button
                                                        onClick={() =>
                                                            toggle(i)
                                                        }
                                                        className='w-full flex items-start justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                                                    >
                                                        <div className='flex-1 min-w-0'>
                                                            <div className='flex items-center gap-2 flex-wrap mb-1'>
                                                                {yearLabel && (
                                                                    <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0'>
                                                                        {
                                                                            yearLabel
                                                                        }
                                                                    </span>
                                                                )}
                                                                {hijriLabel && (
                                                                    <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                                                                        (
                                                                        {
                                                                            hijriLabel
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                                        CAT_COLOR[
                                                                            ev
                                                                                .category
                                                                        ] ??
                                                                        "bg-gray-100 text-gray-600"
                                                                    }`}
                                                                >
                                                                    {t(
                                                                        CATEGORIES.find(
                                                                            (
                                                                                c,
                                                                            ) =>
                                                                                c.key ===
                                                                                ev.category,
                                                                        )
                                                                            ?.labelKey,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className='text-sm font-semibold text-gray-900 dark:text-white leading-snug'>
                                                                {getLocalizedField(
                                                                    ev,
                                                                    "title",
                                                                    lang,
                                                                )}
                                                            </p>
                                                        </div>
                                                        {isOpen ? (
                                                            <BsChevronUp className='text-gray-400 flex-shrink-0 mt-1' />
                                                        ) : (
                                                            <BsChevronDown className='text-gray-400 flex-shrink-0 mt-1' />
                                                        )}
                                                    </button>

                                                    {isOpen && (
                                                        <div className='px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3'>
                                                            <p className='text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line'>
                                                                {getLocalizedField(
                                                                    ev,
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
                        )
                    )}

                    <p className='text-center text-xs text-gray-400 dark:text-gray-500 mt-8'>
                        {t("history.source_note")}
                    </p>
                </div>
            </Section>
            <Footer />
        </main>
    );
};

export default SejarahPage;
