import ContentWidth from "@/components/layout/ContentWidth";
import MushafPageReader from "@/components/quran/MushafPageReader";
import Section from "@/components/Section";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/quran/page-mushaf" },
    title: "Al-Quran Mushaf Halaman — Thullaabul 'Ilmi Board",
    description:
        "Baca Al-Quran per halaman (mushaf standar 604 halaman) lengkap dengan bantuan mufrodat per kata.",
};

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const getItems = (data) =>
    Array.isArray(data) ? data : (data?.items ?? data?.data?.items ?? []);

async function getInitialMushaf(page) {
    try {
        const [ayahRes, wordRes] = await Promise.all([
            fetch(`${API_URL}/api/v1/ayah/page/${page}`, {
                next: { revalidate: 86400 },
            }),
            fetch(`${API_URL}/api/v1/mufrodat/page/${page}`, {
                next: { revalidate: 86400 },
            }),
        ]);
        if (!ayahRes.ok || !wordRes.ok) {
            return { page, ayahs: [], words: [] };
        }
        const [ayahData, wordData] = await Promise.all([
            ayahRes.json(),
            wordRes.json(),
        ]);
        return {
            page,
            ayahs: getItems(ayahData),
            words: getItems(wordData),
        };
    } catch {
        return { page, ayahs: [], words: [] };
    }
}

const Page = async () => {
    const initial = await getInitialMushaf(1);

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
                    <MushafPageReader
                        initialPage={initial.page}
                        initialAyahs={initial.ayahs}
                        initialWords={initial.words}
                    />
                </ContentWidth>
            </Section>
        </main>
    );
};

export default Page;
