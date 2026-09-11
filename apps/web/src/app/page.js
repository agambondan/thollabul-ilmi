import { cookies } from "next/headers";
import Link from "next/link";
import ContentWidth from "@/components/layout/ContentWidth";
import { openGraphFor } from "@/lib/site";
import { buildRegisterHref } from "@/lib/authRedirect";
import id from "@/lib/i18n/id";
import en from "@/lib/i18n/en";
import HomeClock from "./home/HomeClock";
import DashboardCTA from "./home/DashboardCTA";
import TajweedSection from "./home/TajweedSection";
import PersonalLinksAuthFix from "./home/PersonalLinksAuthFix";
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

export const metadata = {
    alternates: { canonical: "/" },
    openGraph: openGraphFor("/"),
};

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

/*
 * Server-rendered homepage: this used to be a single "use client" component
 * (HomePageClient.js) that shipped the whole feature grid — 40+ icons, every
 * label/description string, and the color-group data — as client JS just to
 * hydrate static links. Only three things on this page actually need the
 * browser: the live clock (HomeClock), the two auth-aware CTA buttons
 * (DashboardCTA), and the Tajweed table (TajweedSection, unchanged). The rest
 * below is plain server output.
 *
 * Auth state lives only in localStorage (see src/context/Auth.js), so the
 * server can't know if a visitor is signed in. "Personal" feature links are
 * rendered pointing at the register flow — the same default a signed-out
 * visitor (or the pre-hydration client render) always saw — and
 * PersonalLinksAuthFix corrects the href client-side once a session is
 * confirmed.
 */
export default async function Home() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value?.toUpperCase();
    const lang = langCookie === "EN" ? "EN" : "ID";
    const dict = lang === "EN" ? en : id;
    const t = (key) => dict[key] ?? id[key] ?? key;

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
                    keepDescMobile: true,
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
                    keepDescMobile: true,
                },
                {
                    icon: <BsPeopleFill />,
                    labelKey: "home.f.jarh_tadil",
                    descKey: "home.f.jarh_tadil_d",
                    href: "/perawi",
                    keepDescMobile: true,
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
            // Every feature is personal (register-gated); collapse to one
            // summary card instead of 9 near-identical "sign up" prompts.
            collapsed: true,
            collapsedHref: "/dashboard/stats",
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
                    keepDescMobile: true,
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
            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className='pt-navbar relative flex min-h-[78svh] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800'>
                <div
                    className='absolute inset-0 opacity-5'
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
                        backgroundSize: "20px 20px",
                    }}
                />
                <div className='absolute top-16 right-16 w-80 h-80 rounded-full bg-emerald-700 opacity-25 blur-3xl pointer-events-none' />
                <div className='absolute top-2/3 left-10 w-96 h-96 rounded-full bg-gold-600 opacity-10 blur-3xl pointer-events-none' />

                <div className='relative z-10 mx-auto max-w-3xl px-6 py-14 md:py-20 text-center text-white'>
                    <p
                        className='min-h-[4.5rem] md:min-h-[6rem] text-4xl md:text-5xl text-gold-300 mb-4 leading-loose'
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
                        className='min-h-[2.5rem] md:min-h-[3rem] text-2xl md:text-3xl text-gold-300 mb-5 leading-relaxed'
                        style={{ fontFamily: "Amiri, serif", direction: "rtl" }}
                    >
                        طُلَّابُ الْعِلْمِ
                    </p>
                    <p className='text-base md:text-lg text-emerald-200 mb-10 max-w-xl mx-auto leading-relaxed'>
                        {t("home.hero_desc")}
                    </p>

                    <div className='relative mx-auto mb-10 max-w-xl min-h-[280px]'>
                        <HomeClock />
                    </div>

                    <div className='flex gap-4 justify-center flex-wrap mb-12'>
                        <DashboardCTA
                            className='bg-gold-500 hover:bg-gold-400 text-emerald-950 dark:text-emerald-300 px-8 py-3 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2'
                            icon={<FaQuran />}
                        />
                        <Link
                            href='/quran'
                            className='border-2 border-emerald-300 text-emerald-100 hover:bg-emerald-300 hover:text-emerald-950 hover:dark:text-emerald-300 px-8 py-3 rounded-full font-bold text-base transition-all inline-flex items-center gap-2'
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
                        <span className='inline-block text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3'>
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
                                    {group.collapsed ? (
                                        <Link
                                            href={buildRegisterHref(
                                                group.collapsedHref,
                                            )}
                                            data-personal-href={
                                                group.collapsedHref
                                            }
                                            className='group flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500 hover:shadow-sm transition-all'
                                        >
                                            <div className='flex -space-x-2 shrink-0'>
                                                {group.features
                                                    .slice(0, 5)
                                                    .map((feat) => (
                                                        <span
                                                            key={feat.labelKey}
                                                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ring-2 ring-white dark:ring-slate-800 ${c.icon}`}
                                                        >
                                                            {feat.icon}
                                                        </span>
                                                    ))}
                                                <span
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold ring-2 ring-white dark:ring-slate-800 ${c.icon}`}
                                                >
                                                    +{group.features.length - 5}
                                                </span>
                                            </div>
                                            <p className='min-w-0 flex-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed'>
                                                {t(
                                                    `${group.groupKey}_summary_d`,
                                                )}
                                            </p>
                                            <span className='shrink-0 inline-flex items-center justify-center rounded-full bg-emerald-700 group-hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 text-center transition-colors'>
                                                {t(`${group.groupKey}_cta`)}
                                            </span>
                                        </Link>
                                    ) : (
                                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                                            {group.features.map((feat) => (
                                                <Link
                                                    key={feat.labelKey}
                                                    href={
                                                        feat.personal
                                                            ? buildRegisterHref(
                                                                  feat.href,
                                                              )
                                                            : feat.href
                                                    }
                                                    data-personal-href={
                                                        feat.personal
                                                            ? feat.href
                                                            : undefined
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
                                                        <p
                                                            className={`text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed ${
                                                                feat.keepDescMobile
                                                                    ? ""
                                                                    : "hidden md:block"
                                                            }`}
                                                        >
                                                            {t(feat.descKey)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
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
                        <TajweedSection />
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
                        <DashboardCTA className='bg-gold-500 hover:bg-gold-400 text-emerald-950 dark:text-emerald-300 px-8 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5' />
                        <Link
                            href='/quran'
                            className='border border-emerald-400 text-emerald-100 hover:bg-emerald-800 px-8 py-3 rounded-full font-bold text-sm transition-all'
                        >
                            {t("home.cta_read")}
                        </Link>
                    </div>
                </ContentWidth>
            </section>

            <PersonalLinksAuthFix />
        </main>
    );
}
