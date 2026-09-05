import Section from "@/components/Section";
import AsbabunNuzulContent from "./AsbabunNuzulContent";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/asbabun-nuzul" },
    title: "Asbabun Nuzul Al-Quran — Thullaabul 'Ilmi Board",
    description:
        "Sebab-sebab turunnya ayat Al-Quran (Asbabun Nuzul) berdasarkan riwayat dan tafsir terpercaya (Ibnu Katsir, Al-Wahidi, Al-Baghawi).",
};

export default function AsbabunNuzulPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <AsbabunNuzulContent />
            </Section>
        </main>
    );
}
