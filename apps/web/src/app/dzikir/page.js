import Section from "@/components/Section";
import { DzikirContent } from "./DzikirContent";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

// Rendered on the server so the list is in the HTML: this page was a client
// component that fetched on mount, which meant crawlers (and the first paint)
// saw the navigation and nothing else.
async function getInitialItems() {
    try {
        const res = await fetch(`${API_URL}/api/v1/dzikir?page=0&size=20`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.items ?? (Array.isArray(data) ? data : []);
    } catch {
        return [];
    }
}

const DzikirPage = async () => {
    const initialItems = await getInitialItems();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <DzikirContent initialItems={initialItems} />
            </Section>
        </main>
    );
};

export default DzikirPage;
