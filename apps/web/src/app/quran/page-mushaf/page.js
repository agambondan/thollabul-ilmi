"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import MushafPageReader from "@/components/quran/MushafPageReader";
import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";

const PageMushafContent = () => {
    const { t } = useLocale();
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-1'>
                        {t("mushaf.title")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
                        {t("mushaf.subtitle")}
                    </p>
                    <MushafPageReader />
                </ContentWidth>
            </Section>
            <Footer />
        </main>
    );
};

export default PageMushafContent;
