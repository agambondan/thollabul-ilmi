"use client";

import PuasaSunnahPanel from "@/components/PuasaSunnahPanel";
import RamadanCountdown from "@/components/RamadanCountdown";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { useState } from "react";
import { BsCalendar3, BsSearch } from "react-icons/bs";
import InlineError from "@/components/InlineError";

const HIJRI_MONTHS = [
    "Muharram",
    "Safar",
    "Rabiʼ al-Awwal",
    "Rabiʼ al-Akhir",
    "Jumada al-Awwal",
    "Jumada al-Akhir",
    "Rajab",
    "Syaʼban",
    "Ramadan",
    "Syawal",
    "Dzulqaʼdah",
    "Dzulhijjah",
];

const HIJRI_MONTHS_EN = [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Akhir",
    "Jumada al-Awwal",
    "Jumada al-Akhir",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhul Qadah",
    "Dhul Hijjah",
];

const monthNames = (lang) => (lang === "EN" ? HIJRI_MONTHS_EN : HIJRI_MONTHS);

const toAladhanDate = (isoDate) => {
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y}`;
};

const parseAladhanHijri = (data) => ({
    hijri_day: data.hijri.day,
    hijri_month: data.hijri.month.number,
    hijri_year: data.hijri.year,
    hijri_arabic: `${data.hijri.day} ${data.hijri.month.ar} ${data.hijri.year}`,
});

export default function HijriClient({ initialToday = null, initialEvents = [] }) {
    const { lang, t } = useLocale();
    const { isWide } = useLayoutMode();
    const months = monthNames(lang);
    const [todayHijri] = useState(initialToday);

    const [convertDate, setConvertDate] = useState(() =>
        new Date().toISOString().slice(0, 10),
    );
    const [convertResult, setConvertResult] = useState(null);
    const [converting, setConverting] = useState(false);
    const [eventSearch, setEventSearch] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [events] = useState(initialEvents);

    const handleConvert = async (e) => {
        e.preventDefault();
        if (!convertDate) return;
        setConverting(true);
        setConvertResult(null);
        try {
            const res = await fetch(
                `https://api.aladhan.com/v1/gToH/${toAladhanDate(convertDate)}`,
            );
            const json = await res.json();
            if (json.code === 200 && json.data) {
                setConvertResult(parseAladhanHijri(json.data));
            } else {
                setConvertResult({ error: t("hijri.convert_error") });
            }
        } catch {
            setConvertResult({ error: t("common.network_error") });
        } finally {
            setConverting(false);
        }
    };

    const query = eventSearch.trim().toLowerCase();
    const visibleEvents = events.filter((ev) => {
        const eventMonth = String(ev.hijri_month);
        if (selectedMonth && eventMonth !== selectedMonth) return false;
        if (!query) return true;
        const haystack = [
            getLocalizedField(ev, "name", lang),
            getLocalizedField(ev, "description", lang),
            ev.category,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return haystack.includes(query);
    });

    return (
        <div
            className={
                isWide
                    ? "w-full px-4"
                    : "container mx-auto px-4 max-w-2xl"
            }
        >
            <div className='text-center mb-8'>
                <BsCalendar3 className='text-4xl text-emerald-600 dark:text-emerald-400 mx-auto mb-2' />
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("hijri.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("hijri.subtitle")}
                </p>
            </div>

            <div className='mb-6'>
                <RamadanCountdown />
            </div>

            <div className='mb-6'>
                <PuasaSunnahPanel />
            </div>

            {todayHijri ? (
                <div className='bg-emerald-700 dark:bg-emerald-900 rounded-2xl p-6 text-center mb-6 text-white'>
                    <p className='text-xs uppercase tracking-wider text-emerald-200 mb-2'>
                        {t("hijri.today")}
                    </p>
                    <p
                        className='text-3xl mb-1'
                        style={{ fontFamily: "Amiri, serif" }}
                    >
                        {todayHijri.hijri_arabic ?? ""}
                    </p>
                    <p className='text-xl font-bold'>
                        {todayHijri.hijri_day ?? todayHijri.day}{" "}
                        {months[
                            (todayHijri.hijri_month ??
                                todayHijri.month) - 1
                        ] ?? ""}{" "}
                        {todayHijri.hijri_year ??
                            todayHijri.year}{" "}
                        H
                    </p>
                    <p className='text-sm text-emerald-200 mt-1'>
                        {new Date().toLocaleDateString(
                            lang === "EN" ? "en-US" : "id-ID",
                            {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            },
                        )}
                    </p>
                </div>
            ) : (
                <div className='bg-gray-100 dark:bg-slate-800 rounded-2xl p-6 text-center mb-6 text-gray-500 dark:text-gray-300'>
                    {t("hijri.empty_today")}
                </div>
            )}

            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 p-5 mb-6'>
                <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-4'>
                    {t("hijri.convert_title")}
                </h2>
                <form
                    onSubmit={handleConvert}
                    className='flex items-end gap-3'
                >
                    <div className='flex-1'>
                        <input
                            type='date'
                            value={convertDate}
                            onChange={(e) =>
                                setConvertDate(e.target.value)
                            }
                            className='w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={converting}
                        className='px-5 py-2 text-sm rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition'
                    >
                        {converting
                            ? t("common.loading")
                            : t("hijri.convert_btn")}
                    </button>
                </form>

                {convertResult && (
                    <div className='mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-center'>
                        {convertResult.error ? (
                            <p className='text-sm text-red-600'>
                                {convertResult.error}
                            </p>
                        ) : (
                            <>
                                <p
                                    className='text-xl text-emerald-800 dark:text-emerald-300 mb-1'
                                    style={{
                                        fontFamily: "Amiri, serif",
                                    }}
                                >
                                    {convertResult.hijri_arabic}
                                </p>
                                <p className='text-sm font-bold text-emerald-900 dark:text-emerald-200'>
                                    {convertResult.hijri_day}{" "}
                                    {
                                        months[
                                            convertResult.hijri_month -
                                                1
                                        ]
                                    }{" "}
                                    {convertResult.hijri_year} H
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 p-5'>
                <div className='flex items-center justify-between gap-3 mb-4'>
                    <div>
                        <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                            {t("hijri.events_title")}
                        </h2>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                            {t("common.showing")}{" "}
                            {visibleEvents.length} {t("common.of")}{" "}
                            {events.length} {t("hijri.events_unit")}
                        </p>
                    </div>
                </div>

                <div className='flex flex-col sm:flex-row gap-2 mb-4'>
                    <div className='relative flex-1'>
                        <BsSearch className='absolute left-3 top-3 text-gray-400 text-xs' />
                        <input
                            type='text'
                            value={eventSearch}
                            onChange={(e) =>
                                setEventSearch(e.target.value)
                            }
                            placeholder={t(
                                "hijri.events_search_placeholder",
                            )}
                            className='w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                        {eventSearch && (
                            <button
                                type='button'
                                onClick={() => setEventSearch("")}
                                className='absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                aria-label={t("common.clear")}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <select
                        value={selectedMonth}
                        onChange={(e) =>
                            setSelectedMonth(e.target.value)
                        }
                        className='px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    >
                        <option value=''>
                            {t("hijri.all_months")}
                        </option>
                        {months.map((name, i) => (
                            <option key={i + 1} value={String(i + 1)}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='space-y-3'>
                    {visibleEvents.map((ev) => (
                        <div
                            key={ev.id}
                            className='p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-600 transition'
                        >
                            <div className='flex items-start justify-between gap-2 mb-1'>
                                <h3 className='font-semibold text-sm text-gray-900 dark:text-gray-100 dark:text-white'>
                                    {getLocalizedField(
                                        ev,
                                        "name",
                                        lang,
                                    )}
                                </h3>
                                <span className='text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0'>
                                    {ev.hijri_day}{" "}
                                    {months[ev.hijri_month - 1]}
                                </span>
                            </div>
                            <p className='text-xs text-gray-600 dark:text-gray-300'>
                                {getLocalizedField(
                                    ev,
                                    "description",
                                    lang,
                                )}
                            </p>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <p className='text-xs text-center text-gray-400 py-6'>
                            {t("hijri.events_empty")}
                        </p>
                    )}

                    {events.length > 0 && visibleEvents.length === 0 && (
                        <div className='text-center py-6'>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                {t("hijri.events_no_match")}
                            </p>
                            <button
                                type='button'
                                onClick={() => {
                                    setEventSearch("");
                                    setSelectedMonth("");
                                }}
                                className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium'
                            >
                                {t("common.reset_filter")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
