"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "@/context/Locale";
import { BsCalendar3 } from "react-icons/bs";

const DATE_FORMAT_OPTIONS = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
};

/*
 * The hero shows the current date. This used to snapshot Date.now() once at
 * module scope and never notify, so it froze at first load and never rolled
 * over at midnight — and a client-side return to the home page still showed
 * the original timestamp.
 *
 * The store ticks once a minute (a per-second interval would re-render 60x
 * for nothing, since the display only shows the date) and is shared by every
 * subscriber.
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
            <div className='h-[92px] rounded-2xl border border-emerald-200/10 bg-emerald-950/40 animate-pulse' />
        );
    }

    return (
        <div className='relative overflow-hidden rounded-2xl border border-emerald-200/15 bg-emerald-950 text-left shadow-2xl shadow-emerald-950/40'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.24),transparent_32%),linear-gradient(145deg,rgba(20,184,166,0.18),transparent_48%)]' />
            <div className='relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-8'>
                <div className='inline-flex items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50'>
                    <BsCalendar3 className='text-gold-300' />
                    {t("home.date_today")}
                </div>
                <div className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6'>
                    <p className='text-xl font-bold text-white sm:text-2xl'>
                        {homeDates.gregorian}
                    </p>
                    <p className='text-base text-gold-200 sm:text-lg'>
                        {homeDates.hijri}
                    </p>
                </div>
            </div>
        </div>
    );
}
