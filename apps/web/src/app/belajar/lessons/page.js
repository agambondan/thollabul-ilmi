import Section from "@/components/Section";
import LessonsContent from "@/app/dashboard/belajar/lessons/LessonsContent";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/belajar/lessons" },
    openGraph: openGraphFor("/belajar/lessons"),
    title: "Modul Belajar — Thullaabul 'Ilmi",
    description: "Modul interaktif langkah demi langkah: wudhu, sholat, adzan, tajwid, dan aqidah.",
};

export default function PublicLessonsPage() {
    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <LessonsContent basePath='' />
            </Section>
        </main>
    );
}
