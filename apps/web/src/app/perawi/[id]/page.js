"use client";
import { use } from "react";

import { PerawiDetailContent } from "@/app/dashboard/perawi/[id]/page";
import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";

export default function PerawiDetailPage(props) {
    const params = use(props.params);
    return (
        <main className='min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950'>
            <NavbarTailwindCss />
            <Section>
                <PerawiDetailContent params={params} basePath='/perawi' />
            </Section>
            <Footer />
        </main>
    );
}
