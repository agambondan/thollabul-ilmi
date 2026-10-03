import { openGraphFor } from "@/lib/site";
import Section from "@/components/Section";
import PrivacyPageClient from "./PrivacyPageClient";

export const metadata = {
    alternates: { canonical: "/privacy" },
    openGraph: openGraphFor("/privacy"),
    title: "Kebijakan Privasi",
    description:
        "Kebijakan privasi aplikasi dan layanan Thullaabul 'Ilmi (Web & Mobile).",
};

export default function PrivacyPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <PrivacyPageClient />
            </Section>
        </main>
    );
}
