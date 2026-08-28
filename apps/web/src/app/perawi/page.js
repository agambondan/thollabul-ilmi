"use client";

import { PerawiContent } from "@/app/dashboard/perawi/page";
import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";

export default function PerawiPage() {
    return (
        <main className='min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950'>
            <NavbarTailwindCss />
            <Section>
                <PerawiContent basePath='/perawi' />
            </Section>
            <Footer />
        </main>
    );
}
