"use client";

import { useLocale } from "@/context/Locale";
import Link from "next/link";
import { usePathname } from "next/navigation";

const QUICK_LINKS = [
    { href: "/quran", labelKey: "link.quran" },
    { href: "/hadith", labelKey: "link.hadith" },
    { href: "/doa", labelKey: "link.doa" },
    { href: "/dzikir", labelKey: "link.dhikr" },
    { href: "/blog", labelKey: "link.blog" },
];

const recoveryBase = (pathname) => {
    if (pathname?.startsWith("/admin")) return "/admin";
    if (pathname?.startsWith("/dashboard")) return "/dashboard";
    return "/";
};

const scopedHref = (href, basePath) => {
    if (basePath === "/dashboard") return `/dashboard${href}`;
    return href;
};

export default function NotFoundClient() {
    const { t } = useLocale();
    const pathname = usePathname();
    const homeHref = recoveryBase(pathname);

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4'>
            <div className='text-center max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-6 py-10'>
                <div className='text-8xl font-black text-emerald-100 dark:text-emerald-900/40 leading-none mb-2 select-none'>
                    404
                </div>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
                    {t("not_found.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed'>
                    {t("not_found.desc")}
                </p>

                <div className='flex flex-wrap gap-2 justify-center mb-8'>
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={scopedHref(link.href, homeHref)}
                            className='text-xs px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors'
                        >
                            {t(link.labelKey)}
                        </Link>
                    ))}
                </div>

                <Link
                    href={homeHref}
                    className='inline-block bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-6 py-2.5 rounded-full transition-colors font-medium'
                >
                    {t("not_found.home")}
                </Link>
            </div>
        </div>
    );
}
