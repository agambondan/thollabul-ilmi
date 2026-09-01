"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import TajweedTable from "@/components/table/Tajweed";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { buildRegisterHref } from "@/lib/authRedirect";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
    BsBarChart,
    BsBell,
    BsBook,
    BsBookHalf,
    BsBookmark,
    BsCalendar3,
    BsChatDots,
    BsFire,
    BsJournalCheck,
    BsPeopleFill,
    BsSearch,
    BsStickyFill,
    BsTrophyFill,
} from "react-icons/bs";
import {
    FaBrain,
    FaCalculator,
    FaGraduationCap,
    FaMoon,
    FaMosque,
    FaQuran,
} from "react-icons/fa";
import { GiCompass, GiOpenBook, GiPrayerBeads } from "react-icons/gi";
import { ImBook } from "react-icons/im";
import {
    MdAccessTime,
    MdArticle,
    MdBookmark,
    MdExplore,
    MdFlag,
    MdFormatListBulleted,
    MdMenuBook,
    MdMosque,
    MdMusicNote,
    MdOutlineAutoStories,
    MdOutlineDirectionsWalk,
    MdOutlinePlayLesson,
    MdRefresh,
    MdSelfImprovement,
    MdStar,
    MdTimeline,
    MdTranslate,
} from "react-icons/md";

const COLOR_MAP = {
    emerald: {
        group: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/40",
        badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
        icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
        heading: "text-emerald-800 dark:text-emerald-300",
    },
    gold: {
        group: "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800/40",
        badge: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
        icon: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
        heading: "text-yellow-800 dark:text-yellow-300",
    },
    teal: {
        group: "bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800/40",
        badge: "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300",
        icon: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
        heading: "text-teal-800 dark:text-teal-300",
    },
    amber: {
        group: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/40",
        badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
        icon: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
        heading: "text-amber-800 dark:text-amber-300",
    },
    purple: {
        group: "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/40",
        badge: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
        icon: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
        heading: "text-purple-800 dark:text-purple-300",
    },
    sky: {
        group: "bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/40",
        badge: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
        icon: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
        heading: "text-sky-800 dark:text-sky-300",
    },
};

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

export default function Home() {
    const { lang, t } = useLocale();
    const { isAuthenticated } = useAuth();
    const dateSnapshot = useSyncExternalStore(
        subscribeHomeDateSnapshot,
        getClientHomeDateSnapshot,
        getServerHomeDateSnapshot,
    );
    const homeDates = dateSnapshot ? getHomeDates(lang, dateSnapshot) : null;
    const personalHref = (href) =>
        isAuthenticated ? href : buildRegisterHref(href);

    const STATS = [
        {
            labelKey: "home.stat.ayah",
            value: new Intl.NumberFormat(
                lang === "EN" ? "en-US" : "id-ID",
            ).format(6236),
        },
        { labelKey: "home.stat.kitab", value: "9" },
        { labelKey: "home.stat.asma", value: "99" },
        { labelKey: "home.stat.fitur", value: "50+" },
    ];

    const FEATURE_GROUPS = [
        {
            groupKey: "home.group.quran",
            color: "emerald",
            features: [
                {
                    icon: <FaQuran />,
                    labelKey: "home.f.baca_quran",
                    descKey: "home.f.baca_quran_d",
                    href: "/quran",
                },
                {
                    icon: <FaGraduationCap />,
                    labelKey: "home.f.tajweed",
                    descKey: "home.f.tajweed_d",
                    href: "/quran",
                },
                {
                    icon: <MdMenuBook />,
                    labelKey: "home.f.tafsir",
                    descKey: "home.f.tafsir_d",
                    href: "/tafsir",
                },
                {
                    icon: <MdTranslate />,
                    labelKey: "home.f.mufrodat",
                    descKey: "home.f.mufrodat_d",
                    href: "/quran",
                },
                {
                    icon: <MdMusicNote />,
                    labelKey: "home.f.audio",
                    descKey: "home.f.audio_d",
                    href: "/quran",
                },
                {
                    icon: <MdTimeline />,
                    labelKey: "home.f.asbabun",
                    descKey: "home.f.asbabun_d",
                    href: "/asbabun-nuzul",
                },
            ],
        },
        {
            groupKey: "home.group.hadith",
            color: "gold",
            features: [
                {
                    icon: <ImBook />,
                    labelKey: "home.f.kitab_hadith",
                    descKey: "home.f.kitab_hadith_d",
                    href: "/hadith",
                },
                {
                    icon: <BsPeopleFill />,
                    labelKey: "home.f.perawi",
                    descKey: "home.f.perawi_d",
                    href: "/perawi",
                },
                {
                    icon: <BsPeopleFill />,
                    labelKey: "home.f.jarh_tadil",
                    descKey: "home.f.jarh_tadil_d",
                    href: "/perawi",
                },
                {
                    icon: <MdBookmark />,
                    labelKey: "home.f.bm_hadith",
                    descKey: "home.f.bm_hadith_d",
                    href: "/dashboard/bookmarks",
                    personal: true,
                },
            ],
        },
        {
            groupKey: "home.group.tracker",
            color: "teal",
            features: [
                {
                    icon: <MdBookmark />,
                    labelKey: "home.f.hafalan",
                    descKey: "home.f.hafalan_d",
                    href: "/dashboard/hafalan",
                    personal: true,
                },
                {
                    icon: <BsJournalCheck />,
                    labelKey: "home.f.tilawah",
                    descKey: "home.f.tilawah_d",
                    href: "/dashboard/tilawah",
                    personal: true,
                },
                {
                    icon: <MdFormatListBulleted />,
                    labelKey: "home.f.amalan",
                    descKey: "home.f.amalan_d",
                    href: "/dashboard/amalan",
                    personal: true,
                },
                {
                    icon: <BsFire />,
                    labelKey: "home.f.streak",
                    descKey: "home.f.streak_d",
                    href: "/dashboard/stats",
                    personal: true,
                },
                {
                    icon: <BsBarChart />,
                    labelKey: "home.f.stats",
                    descKey: "home.f.stats_d",
                    href: "/dashboard/stats",
                    personal: true,
                },
                {
                    icon: <MdMosque />,
                    labelKey: "home.f.sholat_tracker",
                    descKey: "home.f.sholat_tracker_d",
                    href: "/dashboard/sholat-tracker",
                    personal: true,
                },
                {
                    icon: <MdSelfImprovement />,
                    labelKey: "home.f.muhasabah",
                    descKey: "home.f.muhasabah_d",
                    href: "/dashboard/muhasabah",
                    personal: true,
                },
                {
                    icon: <MdFlag />,
                    labelKey: "home.f.goals",
                    descKey: "home.f.goals_d",
                    href: "/dashboard/goals",
                    personal: true,
                },
                {
                    icon: <BsBell />,
                    labelKey: "home.f.notif",
                    descKey: "home.f.notif_d",
                    href: "/dashboard/notifications",
                    personal: true,
                },
            ],
        },
        {
            groupKey: "home.group.konten",
            color: "amber",
            features: [
                {
                    icon: <MdSelfImprovement />,
                    labelKey: "home.f.doa",
                    descKey: "home.f.doa_d",
                    href: "/doa",
                },
                {
                    icon: <GiOpenBook />,
                    labelKey: "home.f.dzikir",
                    descKey: "home.f.dzikir_d",
                    href: "/dzikir",
                },
                {
                    icon: <GiOpenBook />,
                    labelKey: "home.f.wirid",
                    descKey: "home.f.wirid_d",
                    href: "/wirid",
                },
                {
                    icon: <GiPrayerBeads />,
                    labelKey: "home.f.wirid_custom",
                    descKey: "home.f.wirid_custom_d",
                    href: "/dashboard/wirid-custom",
                    personal: true,
                },
                {
                    icon: <MdOutlinePlayLesson />,
                    labelKey: "home.f.kajian",
                    descKey: "home.f.kajian_d",
                    href: "/kajian",
                },
                {
                    icon: <MdStar />,
                    labelKey: "home.f.asmaul",
                    descKey: "home.f.asmaul_d",
                    href: "/asmaul-husna",
                },
                {
                    icon: <MdStar />,
                    labelKey: "home.f.asmaul_flashcard",
                    descKey: "home.f.asmaul_flashcard_d",
                    href: "/asmaul-husna/flashcard",
                },
                {
                    icon: <MdMenuBook />,
                    labelKey: "home.f.siroh",
                    descKey: "home.f.siroh_d",
                    href: "/siroh",
                },
                {
                    icon: <BsPeopleFill />,
                    labelKey: "home.f.tokoh",
                    descKey: "home.f.tokoh_d",
                    href: "/tokoh",
                },
                {
                    icon: <MdArticle />,
                    labelKey: "home.f.blog",
                    descKey: "home.f.blog_d",
                    href: "/blog",
                },
                {
                    icon: <BsBook />,
                    labelKey: "home.f.library",
                    descKey: "home.f.library_d",
                    href: "/library",
                },
                {
                    icon: <MdTimeline />,
                    labelKey: "home.f.sejarah",
                    descKey: "home.f.sejarah_d",
                    href: "/sejarah",
                },
                {
                    icon: <MdExplore />,
                    labelKey: "home.f.peta",
                    descKey: "home.f.peta_d",
                    href: "/peta",
                },
                {
                    icon: <BsChatDots />,
                    labelKey: "home.f.forum",
                    descKey: "home.f.forum_d",
                    href: "/forum",
                },
            ],
        },
        {
            groupKey: "home.group.tools",
            color: "purple",
            features: [
                {
                    icon: <BsSearch />,
                    labelKey: "home.f.search",
                    descKey: "home.f.search_d",
                    href: "/search",
                },
                {
                    icon: <BsCalendar3 />,
                    labelKey: "home.f.hijri",
                    descKey: "home.f.hijri_d",
                    href: "/hijri",
                },
                {
                    icon: <BsTrophyFill />,
                    labelKey: "home.f.leaderboard",
                    descKey: "home.f.leaderboard_d",
                    href: "/dashboard/leaderboard",
                    personal: true,
                },
                {
                    icon: <BsBookmark />,
                    labelKey: "home.f.bookmarks",
                    descKey: "home.f.bookmarks_d",
                    href: "/dashboard/bookmarks",
                    personal: true,
                },
                {
                    icon: <FaBrain />,
                    labelKey: "home.f.quiz",
                    descKey: "home.f.quiz_d",
                    href: "/quiz",
                },
                {
                    icon: <BsStickyFill />,
                    labelKey: "home.f.notes",
                    descKey: "home.f.notes_d",
                    href: "/dashboard/notes",
                    personal: true,
                },
                {
                    icon: <BsBook />,
                    labelKey: "home.f.kamus",
                    descKey: "home.f.kamus_d",
                    href: "/kamus",
                },
            ],
        },
        {
            groupKey: "home.group.daily",
            color: "sky",
            features: [
                {
                    icon: <MdAccessTime />,
                    labelKey: "home.f.jadwal",
                    descKey: "home.f.jadwal_d",
                    href: "/jadwal-sholat",
                },
                {
                    icon: <GiCompass />,
                    labelKey: "home.f.kiblat",
                    descKey: "home.f.kiblat_d",
                    href: "/kiblat",
                },
                {
                    icon: <MdMenuBook />,
                    labelKey: "home.f.panduan_sholat",
                    descKey: "home.f.panduan_sholat_d",
                    href: "/panduan-sholat",
                },
                {
                    icon: <FaCalculator />,
                    labelKey: "home.f.zakat",
                    descKey: "home.f.zakat_d",
                    href: "/zakat",
                },
                {
                    icon: <MdOutlineAutoStories />,
                    labelKey: "home.f.fiqh",
                    descKey: "home.f.fiqh_d",
                    href: "/fiqh",
                },
                {
                    icon: <MdRefresh />,
                    labelKey: "home.f.muroja",
                    descKey: "home.f.muroja_d",
                    href: "/dashboard/muroja-ah",
                    personal: true,
                },
                {
                    icon: <MdOutlineDirectionsWalk />,
                    labelKey: "home.f.manasik",
                    descKey: "home.f.manasik_d",
                    href: "/manasik",
                },
                {
                    icon: <BsCalendar3 />,
                    labelKey: "home.f.imsakiyah",
                    descKey: "home.f.imsakiyah_d",
                    href: "/imsakiyah",
                },
            ],
        },
    ];

    return (
        <main className='bg-parchment-50 dark:bg-slate-900'>
            <NavbarTailwindCss />

            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className='relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800'>
                <div
                    className='absolute inset-0 opacity-5'
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
                        backgroundSize: "20px 20px",
                    }}
                />
                <div className='absolute top-16 right-16 w-80 h-80 rounded-full bg-emerald-700 opacity-25 blur-3xl pointer-events-none' />
                <div className='absolute bottom-32 left-10 w-96 h-96 rounded-full bg-gold-600 opacity-10 blur-3xl pointer-events-none' />

                <div className='relative z-10 text-center text-white px-6 max-w-3xl mx-auto py-28'>
                    <p
                        className='text-4xl md:text-5xl text-gold-300 mb-6 leading-loose'
                        style={{ fontFamily: "Amiri, serif", direction: "rtl" }}
                    >
                        بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ
                    </p>

                    <div className='flex items-center justify-center gap-3 mb-6'>
                        <div className='h-px bg-gold-400 opacity-50 w-16' />
                        <span className='text-gold-400'>✦</span>
                        <div className='h-px bg-gold-400 opacity-50 w-16' />
                    </div>

                    <h1 className='text-5xl md:text-7xl font-extrabold mb-3 text-white tracking-tight'>
                        Thullaabul &apos;Ilmi
                    </h1>
                    <p
                        className='text-2xl md:text-3xl text-gold-300 mb-5 leading-relaxed'
                        style={{ fontFamily: "Amiri, serif", direction: "rtl" }}
                    >
                        طُلَّابُ الْعِلْمِ
                    </p>
                    <p className='text-base md:text-lg text-emerald-200 mb-10 max-w-xl mx-auto leading-relaxed'>
                        {t("home.hero_desc")}
                    </p>

                    {homeDates ? (
                        <div className='relative mx-auto mb-10 max-w-xl overflow-hidden rounded-2xl border border-emerald-200/15 bg-emerald-950 text-left shadow-2xl shadow-emerald-950/40'>
                            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.24),transparent_32%),linear-gradient(145deg,rgba(20,184,166,0.18),transparent_48%)]' />
                            <div className='relative p-5 sm:p-6'>
                                <div className='flex items-start justify-between gap-4'>
                                    <div className='inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50'>
                                        <BsCalendar3 className='text-gold-300' />
                                        {t("home.date_today")}
                                    </div>
                                    <div className='text-right text-xs leading-relaxed text-emerald-100'>
                                        <p className='font-semibold text-white'>
                                            {homeDates.gregorianShort}
                                        </p>
                                        <p className='text-gold-200'>
                                            {homeDates.hijri}
                                        </p>
                                    </div>
                                </div>

                                <div className='mt-8 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end'>
                                    <div>
                                        <p className='text-sm font-semibold text-emerald-100'>
                                            {t("home.date_current_time")}
                                        </p>
                                        <p className='mt-1 text-5xl font-black tabular-nums text-gold-300 sm:text-6xl'>
                                            {homeDates.time}
                                        </p>
                                        <p className='mt-3 text-sm leading-relaxed text-emerald-100'>
                                            {homeDates.gregorian}
                                        </p>
                                    </div>

                                    <div className='relative h-32 min-w-40 overflow-hidden rounded-lg bg-emerald-900/30'>
                                        <FaMoon className='absolute right-8 top-4 text-3xl text-gold-300' />
                                        <div className='absolute bottom-0 right-3 flex h-24 w-32 items-center justify-center rounded-lg bg-gold-400 text-emerald-950 shadow-xl shadow-emerald-950/30'>
                                            <FaMosque className='text-6xl' />
                                        </div>
                                        <div className='absolute bottom-0 left-0 h-12 w-28 rounded-tr-lg bg-emerald-700/80' />
                                    </div>
                                </div>
                            </div>

                            <div className='relative grid gap-3 bg-emerald-100 p-4 text-emerald-950 sm:grid-cols-2'>
                                <div className='rounded-lg bg-white px-4 py-3 shadow-sm'>
                                    <div className='flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700'>
                                        <FaMoon className='text-gold-600' />
                                        {t("home.date_hijri")}
                                    </div>
                                    <p className='mt-2 text-sm font-bold leading-snug'>
                                        {homeDates.hijri}
                                    </p>
                                </div>
                                <div className='rounded-lg bg-white px-4 py-3 shadow-sm'>
                                    <div className='flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700'>
                                        <BsCalendar3 className='text-gold-600' />
                                        {t("home.date_gregorian")}
                                    </div>
                                    <p className='mt-2 text-sm font-bold leading-snug'>
                                        {homeDates.gregorian}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className='flex gap-4 justify-center flex-wrap mb-12'>
                        <Link
                            href={personalHref("/dashboard")}
                            className='bg-gold-500 hover:bg-gold-400 text-emerald-950 px-8 py-3 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2'
                        >
                            <FaQuran />
                            {isAuthenticated
                                ? t("link.dashboard")
                                : t("home.cta_register")}
                        </Link>
                        <Link
                            href='/quran'
                            className='border-2 border-emerald-300 text-emerald-100 hover:bg-emerald-300 hover:text-emerald-950 px-8 py-3 rounded-full font-bold text-base transition-all inline-flex items-center gap-2'
                        >
                            <FaQuran />
                            {t("home.hero_read_quran")}
                        </Link>
                    </div>

                    {/* Stats bar */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto'>
                        {STATS.map((s) => (
                            <div
                                key={s.labelKey}
                                className='bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 border border-white/10'
                            >
                                <p className='text-2xl font-extrabold text-gold-300'>
                                    {s.value}
                                </p>
                                <p className='text-xs text-emerald-200 mt-0.5'>
                                    {t(s.labelKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-950 via-emerald-900/80 to-transparent pointer-events-none' />
            </section>

            {/* ── Semua Fitur ───────────────────────────────────────── */}
            <section className='py-20 px-6 bg-parchment-50 dark:bg-slate-900'>
                <ContentWidth compact='max-w-6xl'>
                    <div className='text-center mb-14'>
                        <span className='inline-block text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3'>
                            {t("home.features_badge")}
                        </span>
                        <h2 className='text-3xl font-bold text-emerald-900 dark:text-emerald-300 mb-4'>
                            {t("home.features_heading")}
                        </h2>
                        <p className='text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm'>
                            {t("home.features_subheading")}
                        </p>
                        <div className='flex items-center justify-center gap-3 mt-4'>
                            <div className='h-px bg-gold-400 opacity-50 w-16' />
                            <span className='text-gold-500'>✦</span>
                            <div className='h-px bg-gold-400 opacity-50 w-16' />
                        </div>
                    </div>

                    <div className='space-y-10'>
                        {FEATURE_GROUPS.map((group) => {
                            const c = COLOR_MAP[group.color];
                            return (
                                <div
                                    key={group.groupKey}
                                    className={`rounded-2xl border p-6 ${c.group}`}
                                >
                                    <div className='flex items-center gap-2 mb-5'>
                                        <span
                                            className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full ${c.badge}`}
                                        >
                                            {t(group.groupKey)}
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                                        {group.features.map((feat) => (
                                            <Link
                                                key={feat.labelKey}
                                                href={
                                                    feat.personal
                                                        ? personalHref(
                                                              feat.href,
                                                          )
                                                        : feat.href
                                                }
                                                className='group flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500 hover:shadow-sm transition-all hover:-translate-y-0.5'
                                            >
                                                <span
                                                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base ${c.icon}`}
                                                >
                                                    {feat.icon}
                                                </span>
                                                <div className='min-w-0'>
                                                    <p className='text-sm font-semibold text-gray-800 dark:text-white leading-tight'>
                                                        {t(feat.labelKey)}
                                                    </p>
                                                    <span
                                                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                            feat.personal
                                                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                        }`}
                                                    >
                                                        {feat.personal
                                                            ? t(
                                                                  "home.feature_personal",
                                                              )
                                                            : t(
                                                                  "home.feature_public",
                                                              )}
                                                    </span>
                                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed'>
                                                        {t(feat.descKey)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ContentWidth>
            </section>

            {/* ── Tajweed Guide ─────────────────────────────────────── */}
            <section className='py-16 px-6 bg-white dark:bg-slate-900 border-t border-parchment-200 dark:border-slate-700'>
                <ContentWidth compact='max-w-5xl'>
                    <div className='text-center mb-10'>
                        <h2 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 mb-2'>
                            {t("home.tajweed_heading")}
                        </h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {t("home.tajweed_desc")}
                        </p>
                    </div>
                    <div className='flex justify-center'>
                        <TajweedTable />
                    </div>
                </ContentWidth>
            </section>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <section className='py-16 px-6 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white'>
                <ContentWidth compact='max-w-2xl' className='text-center'>
                    <p
                        className='text-2xl text-gold-300 mb-3 leading-loose'
                        style={{ fontFamily: "Amiri, serif", direction: "rtl" }}
                    >
                        طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
                    </p>
                    <p className='text-sm text-emerald-300 italic mb-8'>
                        {t("home.cta_quote")} &mdash; {t("home.cta_source")}
                    </p>
                    <div className='flex gap-4 justify-center flex-wrap'>
                        <Link
                            href={personalHref("/dashboard")}
                            className='bg-gold-500 hover:bg-gold-400 text-emerald-950 px-8 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5'
                        >
                            {isAuthenticated
                                ? t("link.dashboard")
                                : t("home.cta_register")}
                        </Link>
                        <Link
                            href='/quran'
                            className='border border-emerald-400 text-emerald-100 hover:bg-emerald-800 px-8 py-3 rounded-full font-bold text-sm transition-all'
                        >
                            {t("home.cta_read")}
                        </Link>
                    </div>
                </ContentWidth>
            </section>

            <Footer />
        </main>
    );
}
