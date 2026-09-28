import { openGraphFor } from "@/lib/site";
import Section from "@/components/Section";
import ContactPageClient from "./ContactPageClient";

export const metadata = {
    alternates: { canonical: "/contact" },
    openGraph: openGraphFor("/contact"),
    title: "Kontak",
    description:
        "Hubungi tim Thullaabul 'Ilmi untuk kritik, saran, laporan bug, atau kolaborasi.",
};

export default function ContactPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <ContactPageClient />
            </Section>
        </main>
    );
}
