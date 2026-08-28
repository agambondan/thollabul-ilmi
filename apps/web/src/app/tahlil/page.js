import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { TahlilContent } from "./TahlilClient";

export default function TahlilPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <TahlilContent />
            </Section>
            <Footer />
        </main>
    );
}
