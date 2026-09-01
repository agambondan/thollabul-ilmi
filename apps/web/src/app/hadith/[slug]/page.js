"use client";
import { use } from "react";

import { HadithDetailContent } from "@/app/dashboard/hadith/[slug]/page";
import Section from "@/components/Section";

const Page = (props) => {
    const params = use(props.params);
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='dark:text-white'>
                    <HadithDetailContent
                        params={params}
                        basePath='/hadith'
                        showSelectors={true}
                    />
                </div>
            </Section>
        </main>
    );
};

export default Page;
