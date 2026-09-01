import { openGraphFor } from "@/lib/site";
import Section from "@/components/Section";
import DevPageClient from "./DevPageClient";

export const metadata = {
    alternates: { canonical: "/dev" },
    openGraph: openGraphFor("/dev"),
    title: "Developer API",
    description: "Public API documentation for Thullaabul Ilmi developers.",
};

export default function DevPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <DevPageClient />
            </Section>
        </main>
    );
}
