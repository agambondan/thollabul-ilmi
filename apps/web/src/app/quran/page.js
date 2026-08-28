export const dynamic = "force-dynamic";

import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import QuranPageClient from "./QuranPageClient";

const QuranPage = async () => {
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
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <QuranPageClient items={items} isError={isError} />
            </Section>
            <Footer />
        </main>
    );
};

export default QuranPage;
