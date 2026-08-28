"use client";

import AdminMutationToast from "@/components/admin/AdminMutationToast";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { ConvertFLagLanguage } from "@/lib/converter";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    BsArrowRepeat,
    BsAward,
    BsBarChart,
    BsBell,
    BsBook,
    BsBookHalf,
    BsBookmark,
    BsCalculator,
    BsCalendar3,
    BsChevronLeft,
    BsChevronRight,
    BsCurrencyDollar,
    BsGear,
    BsGlobe,
    BsJournalCheck,
    BsJournalPlus,
    BsMoonStarsFill,
    BsNewspaper,
    BsPerson,
    BsPeopleFill,
    BsSearch,
    BsStickyFill,
    BsSunFill,
    BsTrophyFill,
} from "react-icons/bs";
import { FaBrain, FaQuran } from "react-icons/fa";
import { GiOpenBook } from "react-icons/gi";
import { ImBook } from "react-icons/im";
import {
    MdAccessTime,
    MdCalendarMonth,
    MdClose,
    MdExplore,
    MdFlag,
    MdFormatListBulleted,
    MdLogout,
    MdMenu,
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

const LANGS = ["ID", "EN"];
const SIDEBAR_STORAGE_KEY = "tholabul_dashboard_sidebar_collapsed";

const DashboardLayout = ({ children }) => {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const { t, lang, setLang } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const accountRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) {
                setAccountOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        try {
            setIsCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1");
        } catch {
            setIsCollapsed(false);
        }
    }, []);

    useEffect(() => {
        const sync = () => {
            const dark = localStorage.getItem("theme") === "dark";
            document.documentElement.classList.toggle("dark", dark);
            setIsDarkMode(dark);
        };
        sync();
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDarkMode);
    }, [isDarkMode]);

    const toggleDark = () => {
        setIsDarkMode((prev) => {
            localStorage.setItem("theme", !prev ? "dark" : "light");
            return !prev;
        });
    };

    const toggleSidebar = () => {
        setIsCollapsed((current) => {
            const next = !current;
            try {
                localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
            } catch {}
            return next;
        });
    };

    const initials = user?.name
        ? user.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()
        : "?";

    const GROUPS = [
        {
            titleKey: "sidebar.main_reading",
            links: [
                {
                    labelKey: "link.quran",
                    href: "/dashboard/quran",
                    icon: <FaQuran />,
                },
                {
                    labelKey: "link.hadith",
                    href: "/dashboard/hadith",
                    icon: <ImBook />,
                },
                {
                    labelKey: "link.perawi",
                    href: "/dashboard/perawi",
                    icon: <ImBook />,
                },
                {
                    labelKey: "link.khatam",
                    href: "/dashboard/khatam",
                    icon: <BsBookHalf />,
                },
            ],
        },
        {
            titleKey: "sidebar.worship_tracker",
            links: [
                {
                    labelKey: "link.sholat_tracker",
                    href: "/dashboard/sholat-tracker",
                    icon: <MdMosque />,
                },
                {
                    labelKey: "link.prayer_guide",
                    href: "/dashboard/panduan-sholat",
                    icon: <MdMenuBook />,
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
                    labelKey: "link.tasbih",
                    href: "/dashboard/tasbih",
                    icon: <BsArrowRepeat />,
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
                    href: "/dashboard/tafsir",
                    icon: <MdOutlineAutoStories />,
                },
                {
                    labelKey: "link.asbabun_nuzul",
                    href: "/dashboard/asbabun-nuzul",
                    icon: <MdOutlineAutoStories />,
                },
                {
                    labelKey: "link.asmaul_husna",
                    href: "/dashboard/asmaul-husna",
                    icon: <MdStar />,
                },
                {
                    labelKey: "link.doa",
                    href: "/dashboard/doa",
                    icon: <MdSelfImprovement />,
                },
                {
                    labelKey: "link.dhikr",
                    href: "/dashboard/dzikir",
                    icon: <GiOpenBook />,
                },
                {
                    labelKey: "link.wird",
                    href: "/dashboard/wirid",
                    icon: <GiOpenBook />,
                },
                {
                    labelKey: "link.wirid_custom",
                    href: "/dashboard/wirid-custom",
                    icon: <BsJournalPlus />,
                },
                {
                    labelKey: "link.belajar",
                    href: "/dashboard/belajar",
                    icon: <MdOutlinePlayLesson />,
                },
                {
                    labelKey: "link.komunitas",
                    href: "/dashboard/komunitas",
                    icon: <BsGlobe />,
                },
                {
                    labelKey: "link.kajian",
                    href: "/dashboard/kajian",
                    icon: <MdOutlinePlayLesson />,
                },
                {
                    labelKey: "link.sirah_short",
                    href: "/dashboard/siroh",
                    icon: <MdMenuBook />,
                },
                {
                    labelKey: "link.brief_fiqh",
                    href: "/dashboard/fiqh",
                    icon: <MdMenuBook />,
                },
                {
                    labelKey: "link.islamic_history",
                    href: "/dashboard/sejarah",
                    icon: <MdTimeline />,
                },
                {
                    labelKey: "link.tokoh",
                    href: "/dashboard/tokoh",
                    icon: <BsPeopleFill />,
                },
                {
                    labelKey: "link.peta",
                    href: "/dashboard/peta",
                    icon: <MdExplore />,
                },
                {
                    labelKey: "link.manasik",
                    href: "/dashboard/manasik",
                    icon: <MdOutlineDirectionsWalk />,
                },
                {
                    labelKey: "link.library",
                    href: "/dashboard/library",
                    icon: <BsBook />,
                },
                {
                    labelKey: "link.blog",
                    href: "/dashboard/blog",
                    icon: <BsNewspaper />,
                },
                {
                    labelKey: "link.feed",
                    href: "/dashboard/feed",
                    icon: <BsGlobe />,
                },
            ],
        },
        {
            titleKey: "sidebar.tools",
            links: [
                {
                    labelKey: "link.prayer_schedule",
                    href: "/dashboard/jadwal-sholat",
                    icon: <MdAccessTime />,
                },
                {
                    labelKey: "link.hijri_calendar",
                    href: "/dashboard/hijri",
                    icon: <MdCalendarMonth />,
                },
                {
                    labelKey: "link.arabic_dict",
                    href: "/dashboard/kamus",
                    icon: <BsBook />,
                },
                {
                    labelKey: "link.kiblat",
                    href: "/dashboard/kiblat",
                    icon: <MdExplore />,
                },
                {
                    labelKey: "link.faraidh",
                    href: "/dashboard/faraidh",
                    icon: <BsCalculator />,
                },
                {
                    labelKey: "link.zakat",
                    href: "/dashboard/zakat",
                    icon: <BsCurrencyDollar />,
                },
                {
                    labelKey: "link.search",
                    href: "/dashboard/search",
                    icon: <BsSearch />,
                },
                {
                    labelKey: "link.quiz",
                    href: "/dashboard/quiz",
                    icon: <FaBrain />,
                },
                {
                    labelKey: "link.leaderboard",
                    href: "/dashboard/leaderboard",
                    icon: <BsTrophyFill />,
                },
                {
                    labelKey: "link.achievements",
                    href: "/dashboard/achievements",
                    icon: <BsAward />,
                },
                {
                    labelKey: "link.imsakiyah",
                    href: "/dashboard/imsakiyah",
                    icon: <BsCalendar3 />,
                },
            ],
        },
    ];

    const ACCOUNT_LINKS = [
        {
            labelKey: "link.profile",
            href: "/dashboard/profile",
            icon: <BsPerson />,
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
            labelKey: "link.settings",
            href: "/dashboard/settings",
            icon: <BsGear />,
        },
    ];

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            const next = encodeURIComponent(pathname);
            router.push(`/auth/login?next=${next}`);
        }
    }, [isLoading, isAuthenticated, router, pathname]);

    if (isLoading || !isAuthenticated) return null;

    const sidebarWidth = isCollapsed ? "w-16" : "w-60";
    const mainOffset = isCollapsed ? "md:ml-16" : "md:ml-60";
    const sidebarToggleLabel = isCollapsed
        ? t("sidebar.expand")
        : t("sidebar.collapse");
    const mobilePrimaryLinks = [
        {
            labelKey: "link.dashboard",
            href: "/dashboard",
            icon: <BsBarChart />,
        },
        { labelKey: "link.quran", href: "/dashboard/quran", icon: <FaQuran /> },
        {
            labelKey: "link.hadith",
            href: "/dashboard/hadith",
            icon: <ImBook />,
        },
        {
            labelKey: "link.belajar",
            href: "/dashboard/belajar",
            icon: <MdOutlinePlayLesson />,
        },
    ];

    return (
        <div className='min-h-screen flex bg-gray-50 dark:bg-gray-950'>
            {/* Sidebar */}
            <aside
                className={`${sidebarWidth} hidden md:flex shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex-col fixed inset-y-0 left-0 z-40 transition-[width] duration-200`}
            >
                {/* Logo */}
                <div
                    className={`border-b border-gray-100 dark:border-slate-800 ${
                        isCollapsed ? "p-3" : "p-4"
                    }`}
                >
                    <Link
                        href='/dashboard'
                        title="Thullaabul 'Ilmi"
                        className={`flex items-center group ${
                            isCollapsed ? "justify-center" : "gap-2.5"
                        }`}
                    >
                        <div className='w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0'>
                            <span className='text-white text-xs font-bold'>
                                ط
                            </span>
                        </div>
                        {!isCollapsed && (
                            <div>
                                <p className='text-sm font-bold text-gray-900 dark:text-white leading-none'>
                                    Thullaabul &apos;Ilmi
                                </p>
                                <p className='text-[10px] text-gray-400 mt-0.5 arabic-text'>
                                    طُلَّابُ الْعِلْمِ
                                </p>
                            </div>
                        )}
                    </Link>
                </div>

                {/* User info */}
                <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-800'>
                    {isCollapsed ? (
                        <div
                            title={user?.name ?? t("common.user")}
                            className='mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        >
                            {(user?.name ?? t("common.user"))
                                .slice(0, 1)
                                .toUpperCase()}
                        </div>
                    ) : (
                        <>
                            <p className='text-sm font-medium text-gray-800 dark:text-white truncate'>
                                {user?.name ?? t("common.user")}
                            </p>
                            <p className='text-xs text-gray-400 truncate'>
                                {user?.email ?? ""}
                            </p>
                        </>
                    )}
                </div>

                {/* Dashboard link */}
                <div className='px-3 pt-3'>
                    <Link
                        href='/dashboard'
                        title={t("link.dashboard")}
                        className={`flex items-center py-2 rounded-lg text-sm font-medium transition-colors ${
                            isCollapsed ? "justify-center px-0" : "gap-2.5 px-3"
                        } ${
                            pathname === "/dashboard"
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        <BsBarChart className='shrink-0' />
                        {!isCollapsed && <span>{t("link.dashboard")}</span>}
                    </Link>
                </div>

                {/* Nav groups */}
                <nav className='flex-1 overflow-y-auto px-3 py-2 space-y-4'>
                    {GROUPS.map((group) => (
                        <div key={group.titleKey}>
                            {isCollapsed ? (
                                <div className='mx-3 mb-1 h-px bg-gray-100 dark:bg-slate-800' />
                            ) : (
                                <p className='px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
                                    {t(group.titleKey)}
                                </p>
                            )}
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
                                                title={t(link.labelKey)}
                                                className={`flex items-center py-1.5 rounded-lg text-sm transition-colors ${
                                                    isCollapsed
                                                        ? "justify-center px-0"
                                                        : "gap-2.5 px-3"
                                                } ${
                                                    isActive
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium"
                                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                            >
                                                <span className='shrink-0 text-base'>
                                                    {link.icon}
                                                </span>
                                                {!isCollapsed && (
                                                    <span className='truncate'>
                                                        {t(link.labelKey)}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <main
                className={`${mainOffset} flex-1 min-h-screen overflow-auto pb-20 md:pb-0 transition-[margin] duration-200`}
            >
                {/* Header */}
                <header className='sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-3 md:px-6 h-14'>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={toggleSidebar}
                            aria-label={sidebarToggleLabel}
                            title={sidebarToggleLabel}
                            className='hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors'
                        >
                            {isCollapsed ? (
                                <BsChevronRight />
                            ) : (
                                <BsChevronLeft />
                            )}
                        </button>
                        <Link
                            href='/dashboard'
                            className='md:hidden flex items-center gap-2 min-w-0'
                            aria-label="Thullaabul 'Ilmi"
                        >
                            <div className='w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0'>
                                <span className='text-white text-xs font-bold'>
                                    ط
                                </span>
                            </div>
                            <span className='text-sm font-bold text-gray-900 dark:text-white truncate'>
                                Thullaabul &apos;Ilmi
                            </span>
                        </Link>
                    </div>

                    {/* Account dropdown */}
                    <div className='relative' ref={accountRef}>
                        <button
                            type='button'
                            onClick={() => setAccountOpen((v) => !v)}
                            className='flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
                        >
                            <div className='w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0'>
                                <span className='text-white text-[11px] font-semibold'>
                                    {initials}
                                </span>
                            </div>
                            <span className='text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate hidden sm:block'>
                                {user?.name?.split(" ")[0] ?? t("common.user")}
                            </span>
                            <svg
                                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${accountOpen ? "rotate-180" : ""}`}
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M19 9l-7 7-7-7'
                                />
                            </svg>
                        </button>

                        {accountOpen && (
                            <div className='absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden'>
                                {/* User identity */}
                                <div className='px-4 py-3.5 border-b border-gray-100 dark:border-slate-700'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center shrink-0'>
                                            <span className='text-white text-sm font-semibold'>
                                                {initials}
                                            </span>
                                        </div>
                                        <div className='min-w-0'>
                                            <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                                                {user?.name ?? t("common.user")}
                                            </p>
                                            <p className='text-xs text-gray-400 truncate'>
                                                {user?.email ?? ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account links */}
                                <div className='py-1'>
                                    {ACCOUNT_LINKS.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() =>
                                                setAccountOpen(false)
                                            }
                                            className='flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <span className='text-base text-gray-400'>
                                                {item.icon}
                                            </span>
                                            {t(item.labelKey)}
                                        </Link>
                                    ))}
                                </div>

                                <div className='h-px bg-gray-100 dark:bg-slate-700' />

                                {/* Theme toggle */}
                                <div className='px-4 py-2.5 flex items-center justify-between'>
                                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                                        {isDarkMode
                                            ? t("nav.dark")
                                            : t("nav.light")}
                                    </span>
                                    <button
                                        type='button'
                                        onClick={toggleDark}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                            isDarkMode
                                                ? "bg-emerald-600"
                                                : "bg-gray-200 dark:bg-slate-600"
                                        }`}
                                    >
                                        <span
                                            className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-transform ${
                                                isDarkMode
                                                    ? "translate-x-6"
                                                    : "translate-x-1"
                                            }`}
                                        >
                                            {isDarkMode ? (
                                                <BsMoonStarsFill className='text-emerald-700 text-[9px]' />
                                            ) : (
                                                <BsSunFill className='text-amber-500 text-[9px]' />
                                            )}
                                        </span>
                                    </button>
                                </div>

                                {/* Language selector */}
                                <div className='px-4 pb-2 flex items-center gap-2'>
                                    {LANGS.map((l) => (
                                        <button
                                            key={l}
                                            type='button'
                                            onClick={() => setLang(l)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                                lang === l
                                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                                    : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500"
                                            }`}
                                        >
                                            <span className='inline-flex rounded-sm overflow-hidden ring-1 ring-gray-200 dark:ring-slate-600 leading-none'>
                                                {ConvertFLagLanguage(l)}
                                            </span>
                                            {l === "ID"
                                                ? "Indonesia"
                                                : "English"}
                                        </button>
                                    ))}
                                </div>

                                <div className='h-px bg-gray-100 dark:bg-slate-700' />

                                {/* Logout */}
                                <div className='py-1'>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setAccountOpen(false);
                                            logout();
                                        }}
                                        className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                                    >
                                        <MdLogout className='text-base' />
                                        {t("nav.logout")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <AdminMutationToast />
                {/* Panel screens are always full width: they hold tables and
                    forms, not prose, so the reading-width toggle used by the
                    public pages would only waste horizontal space here. */}
                <div className='w-full'>{children}</div>

                {mobileMenuOpen && (
                    <div className='md:hidden fixed inset-0 z-50'>
                        <button
                            type='button'
                            aria-label={t("nav.close_menu")}
                            className='absolute inset-0 bg-slate-950/50'
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className='absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-2xl'>
                            <div className='sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                        {t("nav.menu")}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {user?.name ?? t("common.user")}
                                    </p>
                                </div>
                                <button
                                    type='button'
                                    aria-label={t("nav.close_menu")}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className='h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                >
                                    <MdClose />
                                </button>
                            </div>
                            <div className='px-4 py-3 space-y-5'>
                                {GROUPS.map((group) => (
                                    <section key={group.titleKey}>
                                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2'>
                                            {t(group.titleKey)}
                                        </p>
                                        <div className='grid grid-cols-2 gap-2'>
                                            {group.links.map((link) => {
                                                const isActive =
                                                    pathname === link.href ||
                                                    (link.href !== "/" &&
                                                        pathname.startsWith(
                                                            link.href + "/",
                                                        ));
                                                return (
                                                    <Link
                                                        key={link.href}
                                                        href={link.href}
                                                        onClick={() =>
                                                            setMobileMenuOpen(
                                                                false,
                                                            )
                                                        }
                                                        className={`min-h-11 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                                                            isActive
                                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                                : "border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                        }`}
                                                    >
                                                        <span className='text-base shrink-0'>
                                                            {link.icon}
                                                        </span>
                                                        <span className='truncate'>
                                                            {t(link.labelKey)}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <nav className='md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-100 dark:border-slate-800 px-2 pb-2 pt-1.5'>
                    <div className='grid grid-cols-5 gap-1'>
                        {mobilePrimaryLinks.map((link) => {
                            const isActive =
                                pathname === link.href ||
                                (link.href !== "/dashboard" &&
                                    pathname.startsWith(link.href + "/"));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`min-h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                                        isActive
                                            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    <span className='text-base'>
                                        {link.icon}
                                    </span>
                                    <span className='max-w-full px-1 truncate'>
                                        {t(link.labelKey)}
                                    </span>
                                </Link>
                            );
                        })}
                        <button
                            type='button'
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label={t("nav.open_menu")}
                            className={`min-h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                                mobileMenuOpen
                                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                                    : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            <MdMenu className='text-lg' />
                            <span className='max-w-full px-1 truncate'>
                                {t("nav.menu")}
                            </span>
                        </button>
                    </div>
                </nav>
            </main>
        </div>
    );
};

export default DashboardLayout;
