"use client";

import ByBook from "@/app/hadith/byBook";
import ByChapter from "@/app/hadith/byChapter";
import ByHadith from "@/app/hadith/byHadith";
import ByTheme from "@/app/hadith/byTheme";
import HadithTab from "@/app/hadith/hadithTab";
import Section from "@/components/Section";
import { hadithTabList } from "@/lib/const";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export const HadithContent = ({
    basePath = "/hadith",
    themeBasePath = "/hadith/theme",
}) => {
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") || "book";
    const activeTab = `#${tab}`;

    return (
        <>
            <div className='py-2' />
            <HadithTab
                tabs={hadithTabList}
                basePath={basePath}
                activeTab={activeTab}
            />
            <div className='py-4' />
            <SwitchComponent
                activeTab={activeTab}
                basePath={basePath}
                themeBasePath={themeBasePath}
            />
        </>
    );
};

const Page = () => {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <Suspense fallback={<div className='py-4' />}>
                    <HadithContent />
                </Suspense>
            </Section>
        </main>
    );
};

export default Page;

const SwitchComponent = ({ activeTab, basePath, themeBasePath }) => {
    switch (activeTab) {
        case "#book":
            return <ByBook basePath={basePath} />;
        case "#theme":
            return <ByTheme themeBasePath={themeBasePath} />;
        case "#chapter":
            return <ByChapter basePath={basePath} />;
        case "#hadith":
            return <ByHadith basePath={basePath} />;
        default:
            return <></>;
    }
};
