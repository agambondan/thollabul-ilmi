"use client";

import { PerawiContent } from "@/app/dashboard/perawi/page";
import Section from "@/components/Section";

export default function PerawiPage() {
    return (
        <main className='min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950'>
            <Section>
                <PerawiContent basePath='/perawi' />
            </Section>
        </main>
    );
}
