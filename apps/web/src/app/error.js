"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "@/context/Locale";

const recoveryBase = (pathname) => {
    if (pathname?.startsWith("/admin")) return "/admin";
    if (pathname?.startsWith("/dashboard")) return "/dashboard";
    return "/";
};

export default function GlobalError({ error, reset }) {
    const { t } = useLocale();
    const pathname = usePathname();
    const homeHref = recoveryBase(pathname);

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className='min-h-screen bg-parchment-50 dark:bg-slate-900 flex items-center justify-center px-4'>
            <div className='text-center max-w-md'>
                <p className='text-5xl mb-4'>⚠️</p>
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white mb-2'>
                    {t("global_error.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed'>
                    {error?.message?.includes("fetch")
                        ? t("global_error.api_unreachable")
                        : t("global_error.unexpected")}
                </p>
                <div className='flex gap-3 justify-center'>
                    <button
                        onClick={reset}
                        className='bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-5 py-2 rounded-full transition-colors'
                    >
                        {t("common.try_again")}
                    </button>
                    <Link
                        href={homeHref}
                        className='border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-sm px-5 py-2 rounded-full transition-colors'
                    >
                        {t("not_found.home")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
