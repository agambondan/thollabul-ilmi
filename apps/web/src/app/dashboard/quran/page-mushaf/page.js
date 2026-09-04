"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import MushafPageReader from "@/components/quran/MushafPageReader";
import { useLocale } from "@/context/Locale";

const DashboardPageMushafPage = () => {
    const { t } = useLocale();
    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1'>
                {t("mushaf.title")}
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-6'>
                {t("mushaf.subtitle")}
            </p>
            <MushafPageReader />
        </ContentWidth>
    );
};

export default DashboardPageMushafPage;
