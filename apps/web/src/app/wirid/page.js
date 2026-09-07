import Section from "@/components/Section";
import WiridClient from "./WiridClient";

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialItems() {
    try {
        const res = await fetch(`${API_URL}/api/v1/wirid/occasion/jumat`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const raw = data?.items ?? data ?? [];
        return raw.map((item) => ({
            ...item,
            arabic: item.translation?.ar ?? "",
            latin: item.translation?.latin_idn ?? "",
            count: item.count ?? "",
        }));
    } catch {
        return [];
    }
}

export const metadata = {
    alternates: { canonical: "/wirid" },
    title: "Wirid & Dzikir Harian — Thullaabul 'Ilmi",
    description:
        "Wirid harian untuk berbagai kesempatan: hari Jumat, Arafah, Ramadan, Lailatul Qadar, dan hari raya.",
};

export default async function WiridPage() {
    const items = await getInitialItems();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='container mx-auto px-4 max-w-2xl'>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        Wirid &amp; Dzikir
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6'>
                        Bacaan wirid harian untuk berbagai kesempatan
                    </p>
                    <WiridClient initialItems={items} />
                </div>
            </Section>
        </main>
    );
}
