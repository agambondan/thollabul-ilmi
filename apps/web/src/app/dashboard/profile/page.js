"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import ProfileContent from "@/components/account/ProfileContent";
import { useLocale } from "@/context/Locale";

/**
 * Dashboard shell for the profile screen — the sidebar and header come from
 * the dashboard layout. The sections are shared with /profile.
 */
const DashboardProfilePage = () => {
    const { t } = useLocale();

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6'>
                {t("profile.title")}
            </h1>
            <ProfileContent />
        </ContentWidth>
    );
};

export default DashboardProfilePage;
