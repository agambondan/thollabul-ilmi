import Section from "@/components/Section";
import AsmaulHusnaClient from "./AsmaulHusnaClient";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialItems() {
    try {
        const res = await fetch(`${API_URL}/api/v1/asmaul-husna?limit=99`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.items ?? data ?? []).map((item) => ({
            ...item,
            description: item.description ?? item.meaning ?? "",
        }));
    } catch {
        return [];
    }
}

const AsmaulHusnaPage = async () => {
    const names = await getInitialItems();
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <AsmaulHusnaClient initialNames={names} />
            </Section>
        </main>
    );
};

export default AsmaulHusnaPage;
