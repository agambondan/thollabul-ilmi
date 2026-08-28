import QuranPageClient from "@/app/quran/QuranPageClient";

export const dynamic = "force-dynamic";

export default async function DashboardQuranPage() {
    let items = [];
    let isError = false;

    try {
        const res = await fetch(
            `${process.env.API_INTERNAL_URL || process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:29900"}/api/v1/surah?size=114&sort=number`,
        );
        const quran = await res.json();
        items = quran?.items ?? (Array.isArray(quran) ? quran : []);
    } catch {
        isError = true;
    }

    return (
        <div className='py-2'>
            <QuranPageClient
                items={items}
                isError={isError}
                basePath='/dashboard/quran'
                mushafPath='/dashboard/quran/page-mushaf'
            />
        </div>
    );
}
