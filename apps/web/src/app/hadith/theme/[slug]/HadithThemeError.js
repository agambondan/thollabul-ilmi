"use client";

import { useLocale } from "@/context/Locale";

export default function HadithThemeError() {
    const { t } = useLocale();

    return (
        <div className='flex flex-col items-center justify-center min-h-[50vh] text-center px-4'>
            <p className='text-4xl mb-3'>⚠️</p>
            <h2 className='text-lg font-bold text-emerald-900 dark:text-white mb-2'>
                {t("hadith.load_error_title")}
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                {t("quran.error_desc")}
            </p>
        </div>
    );
}
