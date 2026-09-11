"use client";

import { useLocale } from "@/context/Locale";
import { isNavLinkActive } from "@/lib/navGroups";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BsSearch } from "react-icons/bs";
import { FaGraduationCap, FaQuran } from "react-icons/fa";
import { ImBook } from "react-icons/im";
import { MdOutlinePlayLesson } from "react-icons/md";
import { useQuranFullscreen } from "@/lib/useQuranFullscreen";

const TABS = [
    { href: "/quran", labelKey: "link.quran", Icon: FaQuran },
    { href: "/hadith", labelKey: "link.hadith", Icon: ImBook },
    {
        href: "/kajian",
        labelKey: "link.kajian_short",
        Icon: MdOutlinePlayLesson,
    },
    { href: "/belajar", labelKey: "link.belajar_short", Icon: FaGraduationCap },
    { href: "/search", labelKey: "link.search", Icon: BsSearch },
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
            className='lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-100 dark:border-slate-800 px-2 pb-2 pt-1.5'
            style={{
                paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
            }}
        >
            <div className='grid grid-cols-5 gap-1 mx-auto max-w-lg'>
                {TABS.map(({ href, labelKey, Icon }) => {
                    const isActive = isNavLinkActive(pathname, href);
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
            </div>
        </nav>
    );
}
