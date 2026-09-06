import Section from "@/components/Section";
import TokohClient from "./TokohClient";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialTokoh() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/tokoh-tarikh?page=1&size=100`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

export default async function TokohPage() {
    const initialItems = await getInitialTokoh();

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <Section>
                <TokohClient initialItems={initialItems} className='pt-navbar' />
            </Section>
        </main>
    );
}
