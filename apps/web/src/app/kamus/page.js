import Section from "@/components/Section";
import { KamusContent } from "./KamusClient";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialWords() {
    try {
        const res = await fetch(`${API_URL}/api/v1/dictionary`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items ?? data ?? [];
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

export default async function KamusPage() {
    const initialWords = await getInitialWords();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <KamusContent initialWords={initialWords} />
            </Section>
        </main>
    );
}
