import { PerawiContent } from "@/app/dashboard/perawi/page";
import Section from "@/components/Section";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialPerawi() {
    try {
        const res = await fetch(`${API_URL}/api/v1/perawi?page=0&size=20`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return { items: [], total: 0 };
        const data = await res.json();
        const items = Array.isArray(data?.items ?? data)
            ? (data?.items ?? data)
            : [];
        return {
            items,
            total: data?.total_items ?? data?.total ?? items.length,
        };
    } catch {
        return { items: [], total: 0 };
    }
}

export default async function PerawiPage() {
    const { items, total } = await getInitialPerawi();

    return (
        <main className='min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950'>
            <Section>
                <PerawiContent
                    basePath='/perawi'
                    initialPerawi={items}
                    initialTotal={total}
                />
            </Section>
        </main>
    );
}
