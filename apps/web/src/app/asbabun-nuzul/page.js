import Section from "@/components/Section";
import AsbabunNuzulContent from "./AsbabunNuzulContent";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/asbabun-nuzul" },
    title: "Asbabun Nuzul Al-Quran — Thullaabul 'Ilmi Board",
    description:
        "Sebab-sebab turunnya ayat Al-Quran (Asbabun Nuzul) berdasarkan riwayat dan tafsir terpercaya (Ibnu Katsir, Al-Wahidi, Al-Baghawi).",
};

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialAsbabun() {
    try {
        const res = await fetch(`${API_URL}/api/v1/asbabun-nuzul/surah/2`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return { items: [], surah: "" };
        const d = await res.json();
        const items = Array.isArray(d) ? d : (d.data ?? []);
        return { items, surah: "2" };
    } catch {
        return { items: [], surah: "" };
    }
}

export default async function AsbabunNuzulPage() {
    const { items, surah } = await getInitialAsbabun();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <AsbabunNuzulContent
                    initialResults={items}
                    initialSurahNumber={surah}
                />
            </Section>
        </main>
    );
}
