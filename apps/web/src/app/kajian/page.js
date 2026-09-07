import Section from "@/components/Section";
import KajianClient from "./KajianClient";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialData() {
    try {
        const res = await fetch(`${API_URL}/api/v1/kajian?page=0&size=10`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return { items: [], total: 0 };
        const data = await res.json();
        return {
            items: data?.items ?? (Array.isArray(data) ? data : []),
            total: data?.total ?? (Array.isArray(data) ? data.length : 0),
        };
    } catch {
        return { items: [], total: 0 };
    }
}

export default async function KajianPage(props) {
    const searchParams = await props.searchParams;
    const tab = searchParams?.tab || (searchParams?.q ? "transcript" : "list");
    const q = searchParams?.q || "";
    const { items, total } = await getInitialData();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <KajianClient
                    kajian={items}
                    initialTotal={total}
                    initialTab={tab}
                    initialQuery={q}
                />
            </Section>
        </main>
    );
}
