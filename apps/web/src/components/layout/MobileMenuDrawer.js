"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { useModalA11y } from "@/lib/useModalA11y";
import { getNavGroups, isNavLinkActive } from "@/lib/navGroups";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
    BsBarChart,
    BsBell,
    BsBook,
    BsBookmark,
    BsJournalCheck,
    BsPerson,
    BsShieldLock,
    BsStickyFill,
} from "react-icons/bs";
import {
    MdClose,
    MdFormatListBulleted,
    MdLogout,
    MdMenuBook,
} from "react-icons/md";

const LANGS = ["ID", "EN"];

const ACCOUNT_LINKS = [
    { labelKey: "nav.dashboard", href: "/dashboard", icon: <BsBarChart /> },
    {
        labelKey: "nav.profile_streak",
        href: "/dashboard/profile",
        icon: <BsPerson />,
    },
    {
        labelKey: "nav.bookmarks",
        href: "/dashboard/bookmarks",
        icon: <BsBookmark />,
    },
    {
        labelKey: "nav.memorization",
        href: "/dashboard/hafalan",
        icon: <BsBook />,
    },
    {
        labelKey: "nav.review",
        href: "/dashboard/muroja-ah",
        icon: <MdMenuBook />,
    },
    {
        labelKey: "nav.recitation",
        href: "/dashboard/tilawah",
        icon: <BsJournalCheck />,
    },
    {
        labelKey: "nav.deeds",
        href: "/dashboard/amalan",
        icon: <MdFormatListBulleted />,
    },
    { labelKey: "nav.notes", href: "/dashboard/notes", icon: <BsStickyFill /> },
    {
        labelKey: "nav.notifications",
        href: "/dashboard/notifications",
        icon: <BsBell />,
    },
    {
        labelKey: "nav.statistics",
        href: "/dashboard/stats",
        icon: <BsBarChart />,
    },
];

export default function MobileMenuDrawer({ open, onClose, basePath = "" }) {
    const { t, lang, setLang } = useLocale();
    const { isAuthenticated, user, logout } = useAuth();
    const pathname = usePathname();
    const modalA11y = useModalA11y({
        open,
        onClose,
        label: t("nav.menu"),
    });

    const isDashboard = basePath === "/dashboard";
    const groups = useMemo(() => getNavGroups(basePath), [basePath]);

    if (!open) return null;

    return (
        <div
            className={`${isDashboard ? "md:hidden" : "lg:hidden"} fixed inset-0 z-50`}
        >
            <button
                type='button'
                aria-label={t("nav.close_menu")}
                className='absolute inset-0 bg-slate-950/50 backdrop-blur-sm'
                onClick={onClose}
            />
            <div
                {...modalA11y}
                className='absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-2xl outline-none'
            >
                <div className='sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between'>
                    <div>
                        <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                            {t("nav.menu")}
                        </p>
                        <p className='text-xs text-gray-400'>
                            {user?.name ?? t("common.user")}
                        </p>
                    </div>
                    <button
                        type='button'
                        aria-label={t("nav.close_menu")}
                        onClick={onClose}
                        className='h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
                    >
                        <MdClose className='text-lg' />
                    </button>
                </div>

                {!isDashboard && (
                    <div className='px-4 pt-3 flex items-center justify-between gap-2'>
                        <p
                            id='mobile-menu-lang-label'
                            className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'
                        >
                            {t("nav.language")}
                        </p>
                        <div
                            className='flex gap-1'
                            role='group'
                            aria-labelledby='mobile-menu-lang-label'
                        >
                            {LANGS.map((code) => (
                                <button
                                    key={code}
                                    type='button'
                                    onClick={() => setLang(code)}
                                    aria-pressed={lang?.toUpperCase() === code}
                                    aria-label={`${code} (${
                                        code === "ID" ? "Indonesia" : "English"
                                    })`}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        lang?.toUpperCase() === code
                                            ? "bg-emerald-600 text-white"
                                            : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                    {code}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className='px-4 py-3 space-y-5'>
                    {!isDashboard && isAuthenticated && (
                        <section>
                            <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2'>
                                {t("nav.profile")}
                            </p>
                            <div className='grid grid-cols-2 gap-2'>
                                {ACCOUNT_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={onClose}
                                        className='min-h-11 flex items-center gap-2 rounded-xl border border-gray-100 dark:border-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'
                                    >
                                        <span className='text-base shrink-0'>
                                            {link.icon}
                                        </span>
                                        <span className='truncate'>
                                            {t(link.labelKey)}
                                        </span>
                                    </Link>
                                ))}
                                {user?.role === "admin" && (
                                    <Link
                                        href='/admin'
                                        onClick={onClose}
                                        className='min-h-11 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 transition-colors'
                                    >
                                        <span className='text-base shrink-0'>
                                            <BsShieldLock />
                                        </span>
                                        <span className='truncate'>
                                            {t("nav.admin")}
                                        </span>
                                    </Link>
                                )}
                            </div>
                            <button
                                type='button'
                                onClick={() => {
                                    logout();
                                    onClose();
                                }}
                                className='mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors'
                            >
                                <MdLogout className='text-base' />
                                {t("nav.logout")}
                            </button>
                        </section>
                    )}

                    {groups.map((group) => (
                        <section key={group.titleKey}>
                            <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2'>
                                {t(group.titleKey)}
                            </p>
                            <div className='grid grid-cols-2 gap-2'>
                                {group.links.map((link) => {
                                    const isActive = isNavLinkActive(
                                        pathname,
                                        link.href,
                                        { exact: link.exact },
                                    );
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={onClose}
                                            className={`min-h-11 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                                                isActive
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium"
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
    );
}
