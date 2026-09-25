import Section from "@/components/Section";
import { TafsirIndexContent } from "@/app/tafsir/TafsirIndexClient";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

async function getSurahs() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/surah?size=114&sort=number`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data?.surahs ?? data?.items ?? data ?? [];
    } catch {
        return [];
    }
}

const TafsirIndexPage = async () => {
    const surahs = await getSurahs();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <TafsirIndexContent initialSurahs={surahs} />
            </Section>
        </main>
    );
};

export { TafsirIndexContent };
export default TafsirIndexPage;
