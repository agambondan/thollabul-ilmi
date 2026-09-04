import { openGraphFor } from "@/lib/site";
import Section from "@/components/Section";
import ExtensionClient from "./ExtensionClient";

export const metadata = {
    alternates: { canonical: "/extension" },
    openGraph: openGraphFor("/extension"),
    title: "Chrome Extension — Thullaabul 'Ilmi Board",
    description:
        "Dashboard New Tab Islami untuk browser Chrome, Brave, dan Edge: jadwal sholat, kalender Hijriyah, checklist sholat, dan kutipan hadits harian.",
};

export default function ExtensionPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <ExtensionClient />
            </Section>
        </main>
    );
}
