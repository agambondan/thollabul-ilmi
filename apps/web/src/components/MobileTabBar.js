"use client";

import { useLocale } from "@/context/Locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BsHouseDoor, BsJournalBookmark } from "react-icons/bs";
import { FaGraduationCap, FaQuran } from "react-icons/fa";
import { MdMosque } from "react-icons/md";
import { useQuranFullscreen } from "@/lib/useQuranFullscreen";

/*
 * Mirrors the five tabs the mobile app settled on
 * (docs/MOBILE_IA_FINAL_APPROACH.md): Beranda · Quran · Hadis · Ibadah ·
 * Belajar. The web app had no bottom navigation at all, so every move on a
 * phone went through the hamburger menu.
 */
const TABS = [
    { href: "/", labelKey: "link.home", Icon: BsHouseDoor, exact: true },
    { href: "/quran", labelKey: "link.quran", Icon: FaQuran },
    { href: "/hadith", labelKey: "link.hadith", Icon: BsJournalBookmark },
    { href: "/jadwal-sholat", labelKey: "nav.worship", Icon: MdMosque },
    { href: "/belajar", labelKey: "link.belajar_short", Icon: FaGraduationCap },
];

// Surfaces with their own navigation, plus the immersive reader.
const HIDDEN_PREFIXES = ["/dashboard", "/admin", "/auth"];

export default function MobileTabBar() {
    const pathname = usePathname();
    const { t } = useLocale();
    const { isFullscreen } = useQuranFullscreen();

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
        <nav
            aria-label={t("nav.menu")}
            className='fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95'
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <ul className='mx-auto flex max-w-lg items-stretch'>
                {TABS.map(({ href, labelKey, Icon, exact }) => {
                    const isActive = exact
                        ? pathname === href
                        : pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <li key={href} className='flex-1'>
                            <Link
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition-colors ${
                                    isActive
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : "text-slate-500 dark:text-slate-400"
                                }`}
                            >
                                <Icon className='text-lg' aria-hidden='true' />
                                <span className='truncate'>{t(labelKey)}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
