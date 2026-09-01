import { openGraphFor } from "@/lib/site";
import Section from "@/components/Section";
import ContactPageClient from "./ContactPageClient";

export const metadata = {
    alternates: { canonical: "/contact" },
    openGraph: openGraphFor("/contact"),
    title: "Contact",
    description:
        "Contact the Thullaabul 'Ilmi team for feedback, bug reports, and collaboration.",
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
