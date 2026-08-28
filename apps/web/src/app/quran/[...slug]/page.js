"use client";
import { use } from "react";

import InfiniteScrollAyahPage from "@/app/quran/[...slug]/InfiniteScrollAyahPage";
import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";

const SuratPage = (props) => {
    const searchParams = use(props.searchParams);
    const params = use(props.params);
    const basePath =
        Array.isArray(params.slug) && params.slug[0] === "surah"
            ? "/quran/surah"
            : "/quran";
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <div className='px-4'>
                    <InfiniteScrollAyahPage
                        params={params}
                        searchParams={searchParams}
                        basePath='/quran'
                    />
                </div>
            </Section>
            <Footer />
        </main>
    );
};

export default SuratPage;
