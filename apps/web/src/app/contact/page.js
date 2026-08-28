import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import ContactPageClient from "./ContactPageClient";

export const metadata = {
    title: "Contact — Thullaabul 'Ilmi",
    description:
        "Contact the Thullaabul 'Ilmi team for feedback, bug reports, and collaboration.",
};

export default function ContactPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <ContactPageClient />
            </Section>
            <Footer />
        </main>
    );
}
