import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import DevPageClient from "./DevPageClient";

export const metadata = {
    title: "Developer API — Thullaabul 'Ilmi",
    description: "Public API documentation for Thullaabul Ilmi developers.",
};

export default function DevPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <DevPageClient />
            </Section>
            <Footer />
        </main>
    );
}
