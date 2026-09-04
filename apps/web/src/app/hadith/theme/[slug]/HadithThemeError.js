"use client";

import { useLocale } from "@/context/Locale";
import Link from "next/link";

// `empty` covers a theme slug that matched nothing, which used to render an
// entirely blank page; the default covers a failed request.
export default function HadithThemeError({ variant = "error" }) {
    const { t } = useLocale();
    const isEmpty = variant === "empty";

    return (
        <div className='flex flex-col items-center justify-center min-h-[50vh] text-center px-4'>
            <p className='text-4xl mb-3'>{isEmpty ? "📭" : "⚠️"}</p>
            <h2 className='text-lg font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-2'>
                {isEmpty
                    ? t("hadith.theme_empty_title")
                    : t("hadith.load_error_title")}
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-4'>
                {isEmpty ? t("hadith.theme_empty_desc") : t("quran.error_desc")}
            </p>
            <Link
                href='/hadith'
                className='inline-block px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors'
            >
                {t("hadith.back_to_hadith")}
            </Link>
        </div>
    );
}
