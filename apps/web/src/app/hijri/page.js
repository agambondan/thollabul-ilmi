"use client";

import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import PuasaSunnahPanel from "@/components/PuasaSunnahPanel";
import RamadanCountdown from "@/components/RamadanCountdown";
import Section from "@/components/Section";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useLocale } from "@/context/Locale";
import { hijriApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { useEffect, useState } from "react";
import { BsCalendar3, BsSearch } from "react-icons/bs";

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

const HijriPage = () => {
    const { lang, t } = useLocale();
    const { isWide } = useLayoutMode();
    const months = monthNames(lang);
    const [todayHijri, setTodayHijri] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [convertDate, setConvertDate] = useState("");
    const [convertResult, setConvertResult] = useState(null);
    const [converting, setConverting] = useState(false);
    const [eventSearch, setEventSearch] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
        setConvertDate(new Date().toISOString().slice(0, 10));
    }, []);

    useEffect(() => {
        hijriApi
            .events()
            .then((r) => r.json())
            .then((data) => setEvents(Array.isArray(data) ? data : []))
            .catch(() => setEvents([]))
            .finally(() => setEventsLoading(false));
    }, []);

    useEffect(() => {
        const load = async () => {
            setError("");
            try {
                const todayIso = new Date().toISOString().slice(0, 10);
                const res = await fetch(
                    `https://api.aladhan.com/v1/gToH/${toAladhanDate(todayIso)}`,
                );
                const json = await res.json();
                if (json.code === 200 && json.data) {
                    setTodayHijri(parseAladhanHijri(json.data));
                }
            } catch {
                setError(t("hijri.load_error"));
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

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
                    <div className='text-center mb-8'>
                        <BsCalendar3 className='text-4xl text-emerald-600 dark:text-emerald-400 mx-auto mb-2' />
                        <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-1'>
                            {t("hijri.title")}
                        </h1>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {t("hijri.subtitle")}
                        </p>
                    </div>

                    <div className='mb-6'>
                        <RamadanCountdown />
                    </div>

                    <div className='mb-6'>
                        <PuasaSunnahPanel />
                    </div>

                    {error && (
                        <div className='mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm text-center'>
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <SkeletonInline rows={4} />
                    ) : (
                        <>
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
                                !error && (
                                    <div className='bg-gray-100 dark:bg-slate-800 rounded-2xl p-6 text-center mb-6 text-gray-500'>
                                        {t("hijri.empty_today")}
                                    </div>
                                )
                            )}

                            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 mb-6'>
                                <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4'>
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
                                            className='w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                        />
                                    </div>
                                    <button
                                        type='submit'
                                        disabled={!convertDate || converting}
                                        className='px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors'
                                    >
                                        {converting
                                            ? "..."
                                            : t("hijri.convert_btn")}
                                    </button>
                                </form>
                                {convertResult && (
                                    <div className='mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-sm'>
                                        {convertResult.error ? (
                                            <p className='text-red-600 dark:text-red-400'>
                                                {convertResult.error}
                                            </p>
                                        ) : (
                                            <p className='text-emerald-700 dark:text-emerald-300 font-medium'>
                                                {convertResult.hijri_day}{" "}
                                                {months[
                                                    convertResult.hijri_month -
                                                        1
                                                ] ?? ""}{" "}
                                                {convertResult.hijri_year} H
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className='flex items-center justify-between gap-3 mb-3'>
                                    <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                        {t("hijri.events_title")}
                                    </h2>
                                    {!eventsLoading && events.length > 0 && (
                                        <span className='text-xs text-gray-400'>
                                            {t("common.showing")}{" "}
                                            {visibleEvents.length}{" "}
                                            {t("common.of")} {events.length}{" "}
                                            {t("hijri.events_unit")}
                                        </span>
                                    )}
                                </div>

                                {eventsLoading ? (
                                    <SkeletonInline rows={4} />
                                ) : (
                                    events.length > 0 && (
                                        <>
                                            <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                                                <BsSearch className='text-gray-400 shrink-0' />
                                                <input
                                                    type='text'
                                                    value={eventSearch}
                                                    onChange={(e) =>
                                                        setEventSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        "hijri.search_placeholder",
                                                    )}
                                                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                                                />
                                                {eventSearch && (
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            setEventSearch("")
                                                        }
                                                        className='text-xs font-medium text-emerald-600 dark:text-emerald-400'
                                                    >
                                                        {t("common.clear")}
                                                    </button>
                                                )}
                                            </div>

                                            <div className='mb-4 overflow-x-auto pb-1'>
                                                <div className='flex gap-2 min-w-max'>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            setSelectedMonth("")
                                                        }
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                            selectedMonth === ""
                                                                ? "bg-emerald-700 text-white"
                                                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                                                        }`}
                                                    >
                                                        {t("hijri.all_months")}
                                                    </button>
                                                    {months.map(
                                                        (month, idx) => {
                                                            const value =
                                                                String(idx + 1);
                                                            return (
                                                                <button
                                                                    key={month}
                                                                    type='button'
                                                                    onClick={() =>
                                                                        setSelectedMonth(
                                                                            (
                                                                                curr,
                                                                            ) =>
                                                                                curr ===
                                                                                value
                                                                                    ? ""
                                                                                    : value,
                                                                        )
                                                                    }
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                                                        selectedMonth ===
                                                                        value
                                                                            ? "bg-emerald-700 text-white"
                                                                            : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                                                                    }`}
                                                                >
                                                                    {month}
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )
                                )}

                                {!eventsLoading && events.length === 0 ? (
                                    <p className='text-center py-8 text-gray-400 dark:text-gray-600 text-sm'>
                                        {t("hijri.events_empty")}
                                    </p>
                                ) : !eventsLoading &&
                                  visibleEvents.length === 0 ? (
                                    <p className='text-center py-8 text-gray-400 dark:text-gray-600 text-sm'>
                                        {t("hijri.events_no_match")}
                                    </p>
                                ) : (
                                    <div className='space-y-2'>
                                        {visibleEvents.map((ev) => (
                                            <div
                                                key={ev.id}
                                                className='flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3'
                                            >
                                                <div className='shrink-0 w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center'>
                                                    <span className='text-xs font-bold text-emerald-700 dark:text-emerald-400'>
                                                        {ev.hijri_day}
                                                    </span>
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-medium text-gray-800 dark:text-white'>
                                                        {getLocalizedField(
                                                            ev,
                                                            "name",
                                                            lang,
                                                        )}
                                                    </p>
                                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                                                        {months[
                                                            ev.hijri_month - 1
                                                        ] ?? ""}
                                                    </p>
                                                    {getLocalizedField(
                                                        ev,
                                                        "description",
                                                        lang,
                                                    ) && (
                                                        <p className='text-xs text-gray-400 mt-1'>
                                                            {getLocalizedField(
                                                                ev,
                                                                "description",
                                                                lang,
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                                {ev.category && (
                                                    <span className='shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'>
                                                        {ev.category}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Section>
            <Footer />
        </main>
    );
};

export default HijriPage;
