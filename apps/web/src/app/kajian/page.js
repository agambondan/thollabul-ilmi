import Section from "@/components/Section";
import KajianClient from "./KajianClient";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialItems() {
    try {
        const res = await fetch(`${API_URL}/api/v1/kajian?page=0&size=20`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.items ?? (Array.isArray(data) ? data : []);
    } catch {
        return [];
    }
}

const KajianPage = async () => {
    const kajian = await getInitialItems();
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <KajianClient kajian={kajian} />
           </Section>
       </main>
    );
};

export default KajianPage;
