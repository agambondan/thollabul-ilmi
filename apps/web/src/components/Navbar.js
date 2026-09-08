"use client";

import MobileMenuDrawer from "@/components/layout/MobileMenuDrawer";
import SmallDropDown from "@/components/dropdown/SmallDropDown";
import { useAuth } from "@/context/Auth";
import { useTheme } from "@/lib/useTheme";
import { useLocale } from "@/context/Locale";
import { usePublicMobileMenu } from "@/context/PublicMobileMenu";
import {
    linksMenu,
    linksMenuContent,
    linksMenuContentGroups,
} from "@/lib/const";
import { ConvertFLagLanguage } from "@/lib/converter";
import classNames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    BsBarChart,
    BsBell,
    BsBookmark,
    BsJournalCheck,
    BsPerson,
    BsSearch,
    BsShieldLock,
} from "react-icons/bs";
import { MdFormatListBulleted, MdMenuBook } from "react-icons/md";
import { IoMoonSharp, IoSunnySharp } from "react-icons/io5";

export const NavbarTailwindCss = () => {
    const { open: isMobileMenuOpen, setOpen: setMobileMenuOpen } =
        usePublicMobileMenu();
    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
    const currentPath = usePathname();
    const [isSmallDropdownOpen, setIsSmallDropdownOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const { lang: language, setLang: setLanguage, t } = useLocale();
    const profileMenuRef = useRef(null);
    const { isAuthenticated, user, logout } = useAuth();
    const { isDark: isDarkMode, toggleTheme } = useTheme();

    const clickSetDarkMode = toggleTheme;

    const toggleSmallDropdown = () =>
        setIsSmallDropdownOpen(!isSmallDropdownOpen);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(e.target)
            ) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsSmallDropdownOpen(false);
        setIsContentMenuOpen(false);
    }, [currentPath, setMobileMenuOpen]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setMobileMenuOpen(false);
                setIsSmallDropdownOpen(false);
                setIsProfileMenuOpen(false);
                setIsContentMenuOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setMobileMenuOpen]);

    const [isContentMenuOpen, setIsContentMenuOpen] = useState(false);
    const contentMenuRef = useRef(null);

    const languages = ["ID", "EN"];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                contentMenuRef.current &&
                !contentMenuRef.current.contains(e.target)
            ) {
                setIsContentMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className='fixed inset-x-0 top-0 z-50 w-full bg-emerald-900 dark:bg-gray-950 text-white shadow-lg border-b border-emerald-800 dark:border-gray-800'>
            <div className='relative max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3'>
                <Link
                    href='/'
                    className='flex items-center gap-2.5 hover:opacity-90 transition-opacity'
                >
                    <div className='w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0 shadow-sm'>
                        <span className='text-white text-xs font-bold'>ط</span>
                    </div>
                    <div className='flex flex-col leading-none'>
                        <span
                            className={classNames({
                                "text-base sm:text-lg font-extrabold tracking-wide": true,
                                "text-gold-400": "/" === currentPath,
                                "text-white": "/" !== currentPath,
                            })}
                        >
                            Thullaabul &apos;Ilmi
                        </span>
                        <span
                            className='text-[10px] sm:text-xs text-emerald-300 leading-tight mt-0.5'
                            style={{ fontFamily: "Amiri, serif" }}
                        >
                            طُلَّابُ الْعِلْمِ
                        </span>
                    </div>
                </Link>

                <div className='flex items-center gap-2 lg:hidden'>
                    <button
                        className='flex h-9 w-9 items-center justify-center rounded-lg text-emerald-200 hover:bg-emerald-800 transition-colors'
                        onClick={clickSetDarkMode}
                        aria-label={isDarkMode ? t("nav.light") : t("nav.dark")}
                        title={isDarkMode ? t("nav.light") : t("nav.dark")}
                    >
                        {isDarkMode ? <IoSunnySharp /> : <IoMoonSharp />}
                    </button>

                    {isAuthenticated ? (
                        <Link
                            href='/dashboard'
                            className='flex items-center justify-center w-8 h-8 rounded-full bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 shadow-sm'
                            title={user?.name ?? t("common.user")}
                        >
                            {(user?.name || "U")[0].toUpperCase()}
                        </Link>
                    ) : (
                        <Link
                            href={`/auth/login?next=${encodeURIComponent(currentPath || "/")}`}
                            className='px-2.5 py-1 rounded-lg bg-emerald-800/90 hover:bg-emerald-800 text-white text-xs font-semibold border border-emerald-700 transition-colors'
                        >
                            {t("nav.login")}
                        </Link>
                    )}

                    <button
                        onClick={toggleMobileMenu}
                        type='button'
                        className='inline-flex items-center justify-center w-9 h-9 rounded-lg border border-emerald-700 text-emerald-100 bg-emerald-950/20 hover:bg-emerald-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        aria-controls='navbar-main'
                        aria-expanded={isMobileMenuOpen}
                    >
                        <span className='sr-only'>
                            {isMobileMenuOpen
                                ? t("nav.close_menu")
                                : t("nav.open_menu")}
                        </span>
                        {isMobileMenuOpen ? (
                            <svg
                                className='w-5 h-5'
                                aria-hidden='true'
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    stroke='currentColor'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M6 6l12 12M18 6 6 18'
                                />
                            </svg>
                        ) : (
                            <svg
                                className='w-5 h-5'
                                aria-hidden='true'
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 17 14'
                            >
                                <path
                                    stroke='currentColor'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M1 1h15M1 7h15M1 13h15'
                                />
                            </svg>
                        )}
                    </button>
                </div>

                <div className='hidden w-full lg:block lg:w-auto'>
                    <ul className='flex flex-row items-center gap-1'>
                        {linksMenu.map((link) => {
                            const isActive =
                                link.href === "/"
                                    ? currentPath === "/"
                                    : currentPath.startsWith(link.href);
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        aria-current={
                                            isActive ? "page" : undefined
                                        }
                                        className={classNames({
                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all": true,
                                            "bg-emerald-800 text-gold-300 font-semibold":
                                                isActive,
                                            "text-emerald-100 hover:bg-emerald-800 hover:text-white":
                                                !isActive,
                                        })}
                                    >
                                        {link.icon}
                                        <span>
                                            {link.labelKey
                                                ? t(link.labelKey)
                                                : link.label}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}

                        <li className='relative' ref={contentMenuRef}>
                            <button
                                onClick={() => setIsContentMenuOpen((p) => !p)}
                                className={classNames({
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all": true,
                                    "bg-emerald-800 text-gold-300 font-semibold":
                                        linksMenuContent.some((l) =>
                                            currentPath.startsWith(l.href),
                                        ),
                                    "text-emerald-100 hover:bg-emerald-800 hover:text-white":
                                        !linksMenuContent.some((l) =>
                                            currentPath.startsWith(l.href),
                                        ),
                                })}
                            >
                                <MdMenuBook />
                                {t("nav.content")} ▾
                            </button>
                            {isContentMenuOpen && (
                                <div className='absolute right-0 top-full z-50 mt-2 max-h-[calc(100vh-96px)] w-[min(92vw,720px)] overflow-y-auto rounded-xl border border-gray-100 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
                                    <div className='grid grid-cols-2 gap-3'>
                                        {linksMenuContentGroups.map((group) => (
                                            <div
                                                key={group.labelKey}
                                                className='rounded-lg border border-gray-100 bg-gray-50/70 p-2 dark:border-slate-700 dark:bg-slate-900/40'
                                            >
                                                <p className='px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400'>
                                                    {t(group.labelKey)}
                                                </p>
                                                <div className='space-y-0.5'>
                                                    {group.items.map((link) => (
                                                        <Link
                                                            key={link.href}
                                                            href={link.href}
                                                            onClick={() =>
                                                                setIsContentMenuOpen(
                                                                    false,
                                                                )
                                                            }
                                                            className={classNames(
                                                                "flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                                                currentPath.startsWith(
                                                                    link.href,
                                                                )
                                                                    ? "bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-900/20 dark:text-emerald-300"
                                                                    : "text-emerald-900 hover:bg-white dark:text-white dark:hover:bg-slate-700",
                                                            )}
                                                        >
                                                            <span className='shrink-0 text-sm'>
                                                                {link.icon}
                                                            </span>
                                                            <span className='leading-5'>
                                                                {link.labelKey
                                                                    ? t(
                                                                          link.labelKey,
                                                                      )
                                                                    : link.label}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </li>

                        <li>
                            <Link
                                href='/search'
                                className={classNames({
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all": true,
                                    "bg-emerald-800 text-gold-300 font-semibold":
                                        currentPath.startsWith("/search"),
                                    "text-emerald-100 hover:bg-emerald-800 hover:text-white":
                                        !currentPath.startsWith("/search"),
                                })}
                            >
                                <BsSearch />
                                {t("nav.search")}
                            </Link>
                        </li>

                        <li>
                            <button
                                className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-emerald-800 hover:text-white transition-all w-full lg:w-auto'
                                onClick={clickSetDarkMode}
                            >
                                {isDarkMode ? (
                                    <>
                                        <IoSunnySharp />
                                        <span>{t("nav.light")}</span>
                                    </>
                                ) : (
                                    <>
                                        <IoMoonSharp />
                                        <span>{t("nav.dark")}</span>
                                    </>
                                )}
                            </button>
                        </li>

                        <li className='px-2 lg:px-0'>
                            <SmallDropDown
                                flag={ConvertFLagLanguage(language)}
                                isSmallDropdownOpen={isSmallDropdownOpen}
                                toggleSmallDropdown={toggleSmallDropdown}
                            >
                                {languages.map((lang) => (
                                    <button
                                        key={lang}
                                        className='flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors text-emerald-900 dark:text-emerald-300 dark:text-white'
                                        onClick={() => {
                                            setLanguage(lang);
                                            toggleSmallDropdown();
                                        }}
                                    >
                                        <span className='inline-flex rounded-sm overflow-hidden ring-1 ring-gray-200 dark:ring-slate-600 leading-none'>
                                            {ConvertFLagLanguage(lang)}
                                        </span>
                                        <span>
                                            {lang === "ID"
                                                ? "Indonesia"
                                                : "English"}
                                        </span>
                                        {language.toLowerCase() ===
                                            lang.toLowerCase() && (
                                            <span className='ml-auto text-emerald-600 dark:text-emerald-400'>
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </SmallDropDown>
                        </li>

                        {isAuthenticated ? (
                            <li className='relative' ref={profileMenuRef}>
                                <button
                                    onClick={() =>
                                        setIsProfileMenuOpen((p) => !p)
                                    }
                                    className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-emerald-800 hover:text-white transition-all'
                                >
                                    <BsPerson />
                                    <span>
                                        {user?.name?.split(" ")[0] ??
                                            t("nav.profile")}
                                    </span>
                                </button>
                                {isProfileMenuOpen && (
                                    <div className='absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50 text-emerald-900 dark:text-emerald-300 dark:text-white'>
                                        <Link
                                            href='/dashboard'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsBarChart />
                                            {t("nav.dashboard")}
                                        </Link>
                                        <hr className='my-1 border-gray-100 dark:border-slate-700' />
                                        <Link
                                            href='/dashboard/profile'
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                            }}
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsPerson />
                                            {t("nav.profile_streak")}
                                        </Link>
                                        <Link
                                            href='/dashboard/bookmarks'
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                            }}
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsBookmark />
                                            {t("nav.bookmarks")}
                                        </Link>
                                        <Link
                                            href='/dashboard/hafalan'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <span className='text-base'>
                                                📖
                                            </span>
                                            {t("nav.memorization")}
                                        </Link>
                                        <Link
                                            href='/dashboard/muroja-ah'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <MdMenuBook />
                                            {t("nav.review")}
                                        </Link>
                                        <Link
                                            href='/dashboard/tilawah'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsJournalCheck />
                                            {t("nav.recitation")}
                                        </Link>
                                        <Link
                                            href='/dashboard/amalan'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <MdFormatListBulleted />
                                            {t("nav.deeds")}
                                        </Link>
                                        <Link
                                            href='/dashboard/notes'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsBookmark />
                                            {t("nav.notes")}
                                        </Link>
                                        <Link
                                            href='/dashboard/notifications'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsBell />
                                            {t("nav.notifications")}
                                        </Link>
                                        <Link
                                            href='/dashboard/stats'
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsBarChart />
                                            {t("nav.statistics")}
                                        </Link>
                                        {user?.role === "admin" && (
                                            <Link
                                                href='/admin'
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                }}
                                                className='flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors font-medium'
                                            >
                                                <BsShieldLock />
                                                {t("nav.admin")}
                                            </Link>
                                        )}
                                        <hr className='my-1 border-gray-100 dark:border-slate-700' />
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsProfileMenuOpen(false);
                                            }}
                                            className='flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                                        >
                                            {t("nav.logout")}
                                        </button>
                                    </div>
                                )}
                            </li>
                        ) : (
                            <li>
                                <Link
                                    href={`/auth/login?next=${encodeURIComponent(currentPath || "/")}`}
                                    className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-700 hover:bg-emerald-600 text-white transition-all'
                                >
                                    <BsPerson />
                                    {t("nav.login")}
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <MobileMenuDrawer
                open={isMobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                basePath=''
            />
        </nav>
    );
};

export function Navbar() {
    return <NavbarTailwindCss />;
}
