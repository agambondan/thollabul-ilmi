export const revalidate = 86400;

import Section from "@/components/Section";
import QuranPageClient from "./QuranPageClient";

const QuranPage = async () => {
    let items = [];
    let isError = false;

    try {
        const res = await fetch(
            `${process.env.API_INTERNAL_URL || process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || "https://api-thollabul.jangkauin.site"}/api/v1/surah?size=114&sort=number`,
        );
        const quran = await res.json();
        items = quran?.items ?? (Array.isArray(quran) ? quran : []);
    } catch {
        isError = true;
    }

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <QuranPageClient items={items} isError={isError} />
            </Section>
        </main>
    );
};

export default QuranPage;
