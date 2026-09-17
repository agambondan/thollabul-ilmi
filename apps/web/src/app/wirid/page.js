import Section from "@/components/Section";
import ContentWidth from "@/components/layout/ContentWidth";
import WiridClient from "./WiridClient";

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

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
                <ContentWidth compact='max-w-2xl' className='px-4 py-6'>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                        Wirid & Dzikir
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6'>
                        Bacaan wirid harian untuk berbagai kesempatan
                    </p>
                    <WiridClient initialItems={items} />
                </ContentWidth>
            </Section>
        </main>
    );
}
