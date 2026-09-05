import Section from "@/components/Section";
import SirohClient from "./SirohClient";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialItems() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/siroh/contents?page=0&size=20`,
            { next: { revalidate: 3600 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data?.items ?? (Array.isArray(data) ? data : []);
    } catch {
        return [];
    }
}

const SirohPage = async () => {
    const chapters = await getInitialItems();
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <SirohClient initialChapters={chapters} />
            </Section>
        </main>
    );
};

export default SirohPage;
