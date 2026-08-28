"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { buildLoginHref } from "@/lib/authRedirect";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BsBarChart,
    BsBell,
    BsBook,
    BsBookmark,
    BsCalendar3,
    BsJournalCheck,
    BsPerson,
    BsStickyFill,
    BsTrophyFill,
    BsX,
} from "react-icons/bs";
import { FaBrain, FaQuran } from "react-icons/fa";
import { GiOpenBook } from "react-icons/gi";
import { ImBook } from "react-icons/im";
import {
    MdAccessTime,
    MdCalendarMonth,
    MdFlag,
    MdFormatListBulleted,
    MdMenuBook,
    MdMosque,
    MdOutlineAutoStories,
    MdOutlineDirectionsWalk,
    MdOutlinePlayLesson,
    MdRefresh,
    MdSelfImprovement,
    MdStar,
    MdTimeline,
} from "react-icons/md";

const Sidebar = ({ onClose }) => {
    const pathname = usePathname();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLocale();

    const GROUPS = [
        {
            titleKey: "sidebar.main_reading",
            links: [
                { labelKey: "link.quran", href: "/quran", icon: <FaQuran /> },
                { labelKey: "link.hadith", href: "/hadith", icon: <ImBook /> },
            ],
        },
        {
            titleKey: "sidebar.worship_tracker",
            auth: true,
            links: [
                {
                    labelKey: "link.sholat_tracker",
                    href: "/dashboard/sholat-tracker",
                    icon: <MdMosque />,
                },
                {
                    labelKey: "link.recitation",
                    href: "/dashboard/tilawah",
                    icon: <BsJournalCheck />,
                },
                {
                    labelKey: "link.memorization",
                    href: "/dashboard/hafalan",
                    icon: <BsBook />,
                },
                {
                    labelKey: "link.review",
                    href: "/dashboard/muroja-ah",
                    icon: <MdRefresh />,
                },
                {
                    labelKey: "link.deeds",
                    href: "/dashboard/amalan",
                    icon: <MdFormatListBulleted />,
                },
                {
                    labelKey: "link.muhasabah",
                    href: "/dashboard/muhasabah",
                    icon: <MdSelfImprovement />,
                },
                {
                    labelKey: "link.goals",
                    href: "/dashboard/goals",
                    icon: <MdFlag />,
                },
            ],
        },
        {
            titleKey: "sidebar.islamic_content",
            links: [
                {
                    labelKey: "link.tafsir",
                    href: "/tafsir",
                    icon: <MdOutlineAutoStories />,
                },
                {
                    labelKey: "link.asmaul_husna",
                    href: "/asmaul-husna",
                    icon: <MdStar />,
                },
                {
                    labelKey: "link.doa",
                    href: "/doa",
                    icon: <MdSelfImprovement />,
                },
                {
                    labelKey: "link.dhikr",
                    href: "/dzikir",
                    icon: <GiOpenBook />,
                },
                { labelKey: "link.wird", href: "/wirid", icon: <GiOpenBook /> },
                { labelKey: "link.tahlil", href: "/tahlil", icon: <BsBook /> },
                {
                    labelKey: "link.kajian",
                    href: "/kajian",
                    icon: <MdOutlinePlayLesson />,
                },
                {
                    labelKey: "link.sirah_short",
                    href: "/siroh",
                    icon: <MdMenuBook />,
                },
                {
                    labelKey: "link.brief_fiqh",
                    href: "/fiqh",
                    icon: <MdMenuBook />,
                },
                {
                    labelKey: "link.islamic_history",
                    href: "/sejarah",
                    icon: <MdTimeline />,
                },
                {
                    labelKey: "link.manasik",
                    href: "/manasik",
                    icon: <MdOutlineDirectionsWalk />,
                },
            ],
        },
        {
            titleKey: "sidebar.tools",
            links: [
                {
                    labelKey: "link.prayer_schedule",
                    href: "/jadwal-sholat",
                    icon: <MdAccessTime />,
                },
                {
                    labelKey: "link.hijri_calendar",
                    href: "/hijri",
                    icon: <MdCalendarMonth />,
                },
                {
                    labelKey: "link.arabic_dict",
                    href: "/kamus",
                    icon: <BsBook />,
                },
                { labelKey: "link.quiz", href: "/quiz", icon: <FaBrain /> },
                {
                    labelKey: "link.leaderboard",
                    href: isAuthenticated
                        ? "/dashboard/leaderboard"
                        : buildLoginHref("/dashboard/leaderboard"),
                    icon: <BsTrophyFill />,
                },
                {
                    labelKey: "link.imsakiyah",
                    href: "/imsakiyah",
                    icon: <BsCalendar3 />,
                },
            ],
        },
        {
            titleKey: "sidebar.account",
            auth: true,
            links: [
                {
                    labelKey: "link.dashboard",
                    href: "/dashboard",
                    icon: <BsBarChart />,
                },
                {
                    labelKey: "link.bookmarks",
                    href: "/dashboard/bookmarks",
                    icon: <BsBookmark />,
                },
                {
                    labelKey: "link.notes",
                    href: "/dashboard/notes",
                    icon: <BsStickyFill />,
                },
                {
                    labelKey: "link.statistics",
                    href: "/dashboard/stats",
                    icon: <BsBarChart />,
                },
                {
                    labelKey: "link.notifications",
                    href: "/dashboard/notifications",
                    icon: <BsBell />,
                },
                {
                    labelKey: "link.profile",
                    href: "/dashboard/profile",
                    icon: <BsPerson />,
                },
            ],
        },
    ];

    return (
        <aside className='flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-700/50 overflow-hidden'>
            {/* Header */}
            <div className='flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-700/50 flex-shrink-0'>
                <div className='flex items-center gap-2'>
                    <div className='w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center'>
                        <FaQuran className='text-white text-xs' />
                    </div>
                    <span className='text-sm font-bold text-emerald-900 dark:text-white'>
                        Thullaabul Ilmi
                    </span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        aria-label={t("nav.close_sidebar")}
                    >
                        <BsX className='text-xl' />
                    </button>
                )}
            </div>

            {/* User info */}
            {isAuthenticated && user && (
                <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 flex-shrink-0'>
                    <p className='text-xs font-semibold text-gray-900 dark:text-white truncate'>
                        {user.name ?? user.username ?? t("common.user")}
                    </p>
                    <p className='text-[11px] text-gray-400 dark:text-gray-500 truncate'>
                        {user.email}
                    </p>
                </div>
            )}

            {/* Nav groups */}
            <nav className='flex-1 overflow-y-auto py-3 px-2 space-y-4'>
                {GROUPS.map((group) => {
                    if (group.auth && !isAuthenticated) return null;
                    return (
                        <div key={group.titleKey}>
                            <p className='px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
                                {t(group.titleKey)}
                            </p>
                            <ul className='space-y-0.5'>
                                {group.links.map((link) => {
                                    const isActive =
                                        pathname === link.href ||
                                        (link.href !== "/" &&
                                            pathname.startsWith(
                                                link.href + "/",
                                            ));
                                    return (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                onClick={onClose}
                                                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                                                    isActive
                                                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium"
                                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <span className='text-base flex-shrink-0'>
                                                    {link.icon}
                                                </span>
                                                <span className='truncate'>
                                                    {t(link.labelKey)}
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className='px-4 py-3 border-t border-gray-100 dark:border-slate-700/50 flex-shrink-0'>
                <p className='text-[10px] text-gray-400 dark:text-gray-500 text-center'>
                    Thullaabul Ilmi v2
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;
