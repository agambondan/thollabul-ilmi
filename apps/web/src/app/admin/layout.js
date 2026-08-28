"use client";

import { useAuth } from "@/context/Auth";
import { Spinner3 } from "@/components/spinner/Spinner";
import AdminMutationToast from "@/components/admin/AdminMutationToast";
import { useLocale } from "@/context/Locale";
import { ConvertFLagLanguage } from "@/lib/converter";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    BsBook,
    BsBookHalf,
    BsBookmark,
    BsCameraVideo,
    BsChevronLeft,
    BsChevronRight,
    BsClock,
    BsFileText,
    BsGrid,
    BsHeart,
    BsJournalText,
    BsList,
    BsListCheck,
    BsMap,
    BsMoon,
    BsMoonStarsFill,
    BsPeople,
    BsQuestionCircle,
    BsRepeat,
    BsStar,
    BsSunFill,
} from "react-icons/bs";
import { MdClose, MdLogout, MdPersonOutline } from "react-icons/md";

const NAV_GROUPS = [
    {
        titleKey: "admin.group.content",
        links: [
            {
                href: "/admin/blog",
                labelKey: "admin.nav.blog",
                icon: <BsFileText />,
            },
            {
                href: "/admin/library",
                labelKey: "admin.nav.library",
                icon: <BsBook />,
            },
            {
                href: "/admin/kajian",
                labelKey: "admin.nav.studies",
                icon: <BsCameraVideo />,
            },
            {
                href: "/admin/siroh",
                labelKey: "admin.nav.sirah",
                icon: <BsJournalText />,
            },
            {
                href: "/admin/sejarah",
                labelKey: "admin.nav.history",
                icon: <BsClock />,
            },
            {
                href: "/admin/asbabun-nuzul",
                labelKey: "admin.nav.asbabun",
                icon: <BsBookmark />,
            },
            {
                href: "/admin/reminders",
                label: "Reminder Carousel",
                icon: <BsStar />,
            },
            {
                href: "/admin/lessons",
                label: "Modul Belajar",
                icon: <BsListCheck />,
            },
            {
                href: "/admin/fiqh",
                labelKey: "admin.nav.fiqh",
                icon: <BsListCheck />,
            },
        ],
    },
    {
        titleKey: "admin.group.worship",
        links: [
            {
                href: "/admin/doa",
                labelKey: "admin.nav.prayers",
                icon: <BsBookHalf />,
            },
            {
                href: "/admin/dzikir",
                labelKey: "admin.nav.dhikr",
                icon: <BsRepeat />,
            },
            {
                href: "/admin/wirid",
                labelKey: "admin.nav.wird",
                icon: <BsHeart />,
            },
            {
                href: "/admin/asmaul-husna",
                labelKey: "admin.nav.asmaul",
                icon: <BsStar />,
            },
            {
                href: "/admin/manasik",
                labelKey: "admin.nav.manasik",
                icon: <BsMap />,
            },
        ],
    },
    {
        titleKey: "admin.group.tools",
        links: [
            {
                href: "/admin/kamus",
                labelKey: "admin.nav.dictionary",
                icon: <BsBook />,
            },
            {
                href: "/admin/quiz",
                labelKey: "admin.nav.quiz",
                icon: <BsQuestionCircle />,
            },
        ],
    },
    {
        titleKey: "admin.group.system",
        links: [
            {
                href: "/admin/users",
                labelKey: "admin.nav.users",
                icon: <BsPeople />,
            },
            { href: "/", labelKey: "admin.back_to_app", icon: <BsGrid /> },
        ],
    },
];

const LANGS = ["ID", "EN"];
const SIDEBAR_STORAGE_KEY = "tholabul_admin_sidebar_collapsed";

const AdminLayout = ({ children }) => {
    const { user, isAuthenticated, isLoading, logout, refetchUser } = useAuth();
    const { t, lang, setLang } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const accountRef = useRef(null);

    // A token without a profile means /auth/me failed with something other than
    // 401 (throttling, 5xx, timeout) — the session is still valid, we just do
    // not know the role yet. Treating that as "not an admin" would bounce the
    // user to the landing page over a transient hiccup.
    // Only meaningful once loading has finished: `token` is restored from
    // localStorage synchronously while /auth/me is still in flight, so this
    // is briefly true on every fresh load. Render the spinner first, or the
    // error screen flashes up during a perfectly normal startup.
    const profileUnavailable = isAuthenticated && !user;

    useEffect(() => {
        if (isLoading || profileUnavailable) return;
        if (!isAuthenticated || user?.role !== "admin") {
            router.push("/");
        }
    }, [isLoading, profileUnavailable, isAuthenticated, user, router]);

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
        const mq = window.matchMedia("(max-width: 767px)");
        const sync = () => setIsMobile(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    // The drawer is an overlay on mobile — leaving it open across a navigation
    // would hide the page the user just picked.
    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

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

    if (isLoading) {
        return <Spinner3 />;
    }

    if (profileUnavailable) {
        return (
            <div className='min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-gray-50 dark:bg-gray-950'>
                <p className='text-base font-semibold text-gray-900 dark:text-white'>
                    {t("admin.profile_error")}
                </p>
                <p className='max-w-sm text-sm text-gray-500 dark:text-gray-400'>
                    {t("admin.profile_error_desc")}
                </p>
                <button
                    type='button'
                    onClick={refetchUser}
                    className='px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors'
                >
                    {t("common.retry")}
                </button>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== "admin") {
        return <Spinner3 />;
    }

    // Collapsing only applies to the docked desktop sidebar; on mobile the same
    // element is an off-canvas drawer and always shows full labels.
    const collapsed = isCollapsed && !isMobile;
    const sidebarWidth = isCollapsed ? "w-72 md:w-16" : "w-72 md:w-60";
    const mainOffset = isCollapsed ? "md:ml-16" : "md:ml-60";
    const sidebarToggleLabel = isCollapsed
        ? t("sidebar.expand")
        : t("sidebar.collapse");

    return (
        <div className='min-h-screen flex bg-gray-50 dark:bg-gray-950'>
            <AdminMutationToast />
            {mobileNavOpen && (
                <button
                    type='button'
                    aria-label={t("nav.close_menu")}
                    onClick={() => setMobileNavOpen(false)}
                    className='md:hidden fixed inset-0 z-40 bg-slate-950/50'
                />
            )}
            <aside
                className={`${sidebarWidth} max-w-[85vw] shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col fixed inset-y-0 left-0 z-50 md:z-40 transform transition-transform duration-200 md:transform-none md:transition-[width] ${
                    mobileNavOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0`}
            >
                <div
                    className={`border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 ${
                        collapsed ? "p-3" : "p-4"
                    }`}
                >
                    <Link
                        href='/admin'
                        title={t("admin.panel")}
                        className={`flex items-center group min-w-0 ${
                            collapsed ? "justify-center" : "gap-2.5"
                        }`}
                    >
                        <div className='w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0'>
                            <span className='text-white text-xs font-bold'>
                                ط
                            </span>
                        </div>
                        {!collapsed && (
                            <div className='min-w-0'>
                                <p className='text-sm font-bold text-gray-900 dark:text-white leading-none truncate'>
                                    {t("admin.panel")}
                                </p>
                                <p className='text-[10px] text-gray-400 mt-0.5 arabic-text'>
                                    طُلَّابُ الْعِلْمِ
                                </p>
                            </div>
                        )}
                    </Link>
                    <button
                        type='button'
                        aria-label={t("nav.close_menu")}
                        onClick={() => setMobileNavOpen(false)}
                        className='md:hidden h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    >
                        <MdClose />
                    </button>
                </div>

                <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-800'>
                    {collapsed ? (
                        <div
                            title={user?.name ?? "Admin"}
                            className='mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        >
                            {(user?.name ?? "A").slice(0, 1).toUpperCase()}
                        </div>
                    ) : (
                        <>
                            <p className='text-sm font-medium text-gray-800 dark:text-white truncate'>
                                {user?.name ?? "Admin"}
                            </p>
                            <p className='text-xs text-gray-400 truncate'>
                                {user?.email ?? ""}
                            </p>
                        </>
                    )}
                </div>

                <div className='px-3 pt-3'>
                    <Link
                        href='/admin'
                        title={t("admin.nav.dashboard")}
                        className={`flex items-center py-2 rounded-lg text-sm font-medium transition-colors ${
                            collapsed ? "justify-center px-0" : "gap-2.5 px-3"
                        } ${
                            pathname === "/admin"
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        <BsGrid className='shrink-0' />
                        {!collapsed && (
                            <span>{t("admin.nav.dashboard")}</span>
                        )}
                    </Link>
                </div>

                <nav className='flex-1 overflow-y-auto px-3 py-2 space-y-4'>
                    {NAV_GROUPS.map((group) => (
                        <div key={group.titleKey}>
                            {collapsed ? (
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
                                                title={
                                                    link.label ??
                                                    t(link.labelKey)
                                                }
                                                className={`flex items-center py-1.5 rounded-lg text-sm transition-colors ${
                                                    collapsed
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
                                                {!collapsed && (
                                                    <span className='truncate'>
                                                        {link.label ??
                                                            t(link.labelKey)}
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

            <main
                className={`${mainOffset} flex-1 min-h-screen overflow-auto transition-[margin] duration-200`}
            >
                <header className='sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-3 md:px-6 h-14'>
                    <div className='flex items-center gap-2 min-w-0'>
                        <button
                            type='button'
                            onClick={() => setMobileNavOpen(true)}
                            aria-label={t("nav.menu")}
                            aria-expanded={mobileNavOpen}
                            className='md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors'
                        >
                            <BsList className='text-lg' />
                        </button>
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
                        <span className='md:hidden text-sm font-bold text-gray-900 dark:text-white truncate'>
                            {t("admin.panel")}
                        </span>
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
                                {user?.name?.split(" ")[0] ?? "Admin"}
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
                                                {user?.name ?? "Admin"}
                                            </p>
                                            <p className='text-xs text-gray-400 truncate'>
                                                {user?.email ?? ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Theme toggle */}
                                <div className='px-4 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-slate-700'>
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
                                <div className='px-4 py-2.5 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700'>
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

                                {/* Account — password changes live on the
                                    shared /profile page; the panel had no way
                                    to reach it. */}
                                <div className='py-1 border-b border-gray-100 dark:border-slate-700'>
                                    <Link
                                        href='/profile'
                                        onClick={() => setAccountOpen(false)}
                                        className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                                    >
                                        <MdPersonOutline className='text-base' />
                                        {t("nav.profile")}
                                    </Link>
                                </div>

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
                {/* Panel screens are always full width: they hold tables and
                    forms, not prose, so the reading-width toggle used by the
                    public pages would only waste horizontal space here. */}
                <div className='w-full'>{children}</div>
            </main>
        </div>
    );
};

export default AdminLayout;
