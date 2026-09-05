"use client";

import dynamic from "next/dynamic";
import ByBook from "@/app/hadith/byBook";
import HadithTab from "@/app/hadith/hadithTab";
import Section from "@/components/Section";
import { hadithTabList } from "@/lib/const";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ByChapter = dynamic(() => import("@/app/hadith/byChapter"), {
    loading: () => <div className='h-48 rounded-xl bg-emerald-900/10 animate-pulse' />,
});
const ByHadith = dynamic(() => import("@/app/hadith/byHadith"), {
    loading: () => <div className='h-48 rounded-xl bg-emerald-900/10 animate-pulse' />,
});
const ByTheme = dynamic(() => import("@/app/hadith/byTheme"), {
    loading: () => <div className='h-48 rounded-xl bg-emerald-900/10 animate-pulse' />,
});

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
