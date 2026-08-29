"use client";
import { use } from "react";

import { HadithDetailContent } from "@/app/dashboard/hadith/[slug]/page";
import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";

const Page = (props) => {
    const params = use(props.params);
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <div className='dark:text-white'>
                    <HadithDetailContent
                        params={params}
                        basePath='/hadith'
                        showSelectors={false}
                    />
                </div>
            </Section>
            <Footer />
        </main>
    );
};

export default Page;
