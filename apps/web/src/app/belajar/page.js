import Section from "@/components/Section";
import BelajarPage from "@/app/dashboard/belajar/page";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/belajar" },
    openGraph: openGraphFor("/belajar"),
    title: "Pusat Belajar — Thullaabul 'Ilmi",
    description:
        "Pusat belajar ilmu Islam komprehensif: modul interaktif, kajian, sejarah, fiqh, dan kamus.",
};

// basePath="" keeps every module link on the public tree; without it a visitor
// arriving from search lands on /dashboard/* and hits the login gate.
export default function PublicBelajarPage() {
    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <BelajarPage basePath='' />
            </Section>
        </main>
    );
}
