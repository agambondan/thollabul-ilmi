"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaGraduationCap, FaQuran } from "react-icons/fa";
import { ImBook } from "react-icons/im";
import { MdMenu, MdOutlinePlayLesson } from "react-icons/md";
import { useQuranFullscreen } from "@/lib/useQuranFullscreen";
import MobileMenuDrawer from "@/components/layout/MobileMenuDrawer";

const TABS = [
    { href: "/quran", labelKey: "link.quran", Icon: FaQuran },
    { href: "/hadith", labelKey: "link.hadith", Icon: ImBook },
    {
        href: "/kajian",
        labelKey: "link.kajian_short",
        Icon: MdOutlinePlayLesson,
    },
    { href: "/belajar", labelKey: "link.belajar_short", Icon: FaGraduationCap },
];

// Surfaces with their own navigation, plus the immersive reader.
const HIDDEN_PREFIXES = ["/dashboard", "/admin", "/auth"];

export default function MobileTabBar() {
    const pathname = usePathname();
    const { t } = useLocale();
    const { user } = useAuth();
    const { isFullscreen } = useQuranFullscreen();
    const [menuOpen, setMenuOpen] = useState(false);

    if (
        !pathname ||
        isFullscreen ||
        HIDDEN_PREFIXES.some(
            (p) => pathname === p || pathname.startsWith(`${p}/`),
        )
    ) {
        return null;
    }

    return (
        <>
            <MobileMenuDrawer
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                basePath=''
                userName={user?.name}
            />
            <nav
                aria-label={t("nav.menu")}
                className='md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-100 dark:border-slate-800 px-2 pb-2 pt-1.5'
                style={{
                    paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
                }}
            >
                <div className='grid grid-cols-5 gap-1 mx-auto max-w-lg'>
                    {TABS.map(({ href, labelKey, Icon }) => {
                        const isActive =
                            pathname === href ||
                            pathname.startsWith(`${href}/`);
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                                className={`min-h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                                    isActive
                                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 font-medium"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                <Icon className='text-base' aria-hidden='true' />
                                <span className='max-w-full px-1 truncate'>
                                    {t(labelKey)}
                                </span>
                            </Link>
                        );
                    })}
                    <button
                        type='button'
                        onClick={() => setMenuOpen(true)}
                        aria-label={t("nav.open_menu")}
                        className={`min-h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                            menuOpen
                                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 font-medium"
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
        </>
    );
}
