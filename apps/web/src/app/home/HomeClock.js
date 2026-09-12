"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "@/context/Locale";
import { BsCalendar3 } from "react-icons/bs";
import { FaMoon, FaMosque } from "react-icons/fa";

const DATE_FORMAT_OPTIONS = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
};

const SHORT_DATE_FORMAT_OPTIONS = {
    day: "numeric",
    month: "long",
    year: "numeric",
};

const TIME_FORMAT_OPTIONS = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
};

/*
 * The hero shows a live clock. This used to snapshot Date.now() once at module
 * scope and never notify, so the time froze at first load and the date never
 * rolled over at midnight — and a client-side return to the home page still
 * showed the original timestamp.
 *
 * The store ticks to the top of each minute (the display has minute
 * resolution, so a per-second interval would re-render 60x for nothing) and is
 * shared by every subscriber.
 */
let homeDateSnapshot = null;
let homeDateTimer = null;
const homeDateListeners = new Set();

const emitHomeDate = () => {
    homeDateSnapshot = Date.now();
    homeDateListeners.forEach((listener) => listener());
};

const scheduleHomeDateTick = () => {
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    homeDateTimer = setTimeout(() => {
        emitHomeDate();
        scheduleHomeDateTick();
    }, msToNextMinute + 20);
};

const subscribeHomeDateSnapshot = (listener) => {
    homeDateListeners.add(listener);
    if (homeDateListeners.size === 1) scheduleHomeDateTick();

    return () => {
        homeDateListeners.delete(listener);
        if (homeDateListeners.size === 0) {
            clearTimeout(homeDateTimer);
            homeDateTimer = null;
        }
    };
};

const getServerHomeDateSnapshot = () => null;
const getClientHomeDateSnapshot = () => {
    if (!homeDateSnapshot) {
        homeDateSnapshot = Date.now();
    }

    return homeDateSnapshot;
};

const formatCalendarDate = (date, locale, calendar) => {
    if (!calendar) {
        return new Intl.DateTimeFormat(locale, DATE_FORMAT_OPTIONS).format(
            date,
        );
    }

    const calendarLocales = [
        `${locale}-u-ca-${calendar}`,
        `${locale}-u-ca-islamic`,
    ];

    for (const calendarLocale of calendarLocales) {
        try {
            const formatter = new Intl.DateTimeFormat(
                calendarLocale,
                DATE_FORMAT_OPTIONS,
            );
            if (formatter.resolvedOptions().calendar !== "gregory") {
                return formatter.format(date);
            }
        } catch {
            // Keep the landing page resilient on runtimes with limited Intl calendars.
        }
    }

    return new Intl.DateTimeFormat(locale, DATE_FORMAT_OPTIONS).format(date);
};

const getHomeDates = (lang, dateSnapshot) => {
    const locale = lang === "EN" ? "en-US" : "id-ID";
    const now = new Date(dateSnapshot);

    return {
        hijri: formatCalendarDate(now, locale, "islamic-umalqura"),
        gregorian: formatCalendarDate(now, locale),
        gregorianShort: new Intl.DateTimeFormat(
            locale,
            SHORT_DATE_FORMAT_OPTIONS,
        ).format(now),
        time: new Intl.DateTimeFormat(locale, TIME_FORMAT_OPTIONS).format(now),
    };
};

export default function HomeClock() {
    const { lang, t } = useLocale();
    const dateSnapshot = useSyncExternalStore(
        subscribeHomeDateSnapshot,
        getClientHomeDateSnapshot,
        getServerHomeDateSnapshot,
    );
    const homeDates = dateSnapshot ? getHomeDates(lang, dateSnapshot) : null;

    if (!homeDates) {
        return (
            <div className='h-[280px] rounded-2xl border border-emerald-200/10 bg-emerald-950/40 animate-pulse' />
        );
    }

    return (
        <div className='overflow-hidden rounded-2xl border border-emerald-200/15 bg-emerald-950 text-left shadow-2xl shadow-emerald-950/40'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.24),transparent_32%),linear-gradient(145deg,rgba(20,184,166,0.18),transparent_48%)]' />
            <div className='relative p-5 sm:p-6 lg:p-4'>
                <div className='flex items-start justify-between gap-4'>
                    <div className='inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50'>
                        <BsCalendar3 className='text-gold-300' />
                        {t("home.date_today")}
                    </div>
                    <div className='text-right text-xs leading-relaxed text-emerald-100'>
                        <p className='font-semibold text-white'>
                            {homeDates.gregorianShort}
                        </p>
                        <p className='text-gold-200'>{homeDates.hijri}</p>
                    </div>
                </div>

                <div className='mt-8 lg:mt-3 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end'>
                    <div>
                        <p className='text-sm font-semibold text-emerald-100'>
                            {t("home.date_current_time")}
                        </p>
                        <p className='mt-1 text-5xl font-black tabular-nums text-gold-300 sm:text-6xl lg:text-5xl'>
                            {homeDates.time}
                        </p>
                        <p className='mt-3 lg:mt-1 text-sm leading-relaxed text-emerald-100'>
                            {homeDates.gregorian}
                        </p>
                    </div>

                    <div className='relative h-32 lg:h-20 min-w-40 overflow-hidden rounded-lg bg-emerald-900/30'>
                        <FaMoon className='absolute right-8 top-4 lg:top-2 text-3xl text-gold-300' />
                        <div className='absolute bottom-0 right-3 flex h-24 lg:h-16 w-32 lg:w-24 items-center justify-center rounded-lg bg-gold-400 text-emerald-950 dark:text-emerald-300 shadow-xl shadow-emerald-950/30'>
                            <FaMosque className='text-6xl lg:text-4xl' />
                        </div>
                        <div className='absolute bottom-0 left-0 h-12 lg:h-8 w-28 rounded-tr-lg bg-emerald-700/80' />
                    </div>
                </div>
            </div>

            <div className='relative grid gap-3 bg-emerald-100 p-4 lg:p-3 text-emerald-950 dark:text-emerald-300 sm:grid-cols-2 lg:hidden'>
                <div className='rounded-lg bg-white px-4 py-3 lg:py-2 shadow-sm'>
                    <div className='flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400'>
                        <FaMoon className='text-gold-600' />
                        {t("home.date_hijri")}
                    </div>
                    <p className='mt-2 text-sm font-bold leading-snug'>
                        {homeDates.hijri}
                    </p>
                </div>
                <div className='rounded-lg bg-white px-4 py-3 lg:py-2 shadow-sm'>
                    <div className='flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400'>
                        <BsCalendar3 className='text-gold-600' />
                        {t("home.date_gregorian")}
                    </div>
                    <p className='mt-2 text-sm font-bold leading-snug'>
                        {homeDates.gregorian}
                    </p>
                </div>
            </div>
        </div>
    );
}
