import Section from "@/components/Section";
import KomunitasPage from "@/app/dashboard/komunitas/page";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/komunitas" },
    openGraph: openGraphFor("/komunitas"),
    title: "Komunitas — Thullaabul 'Ilmi",
    description:
        "Bergabung dengan komunitas Thullaabul 'Ilmi. Diskusi, forum, dan obrolan realtime sesama penuntut ilmu.",
};

export default function PublicKomunitasPage() {
    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <KomunitasPage basePath='' />
            </Section>
        </main>
    );
}
