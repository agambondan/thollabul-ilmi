import Section from "@/components/Section";
import FiqhClient from "./FiqhClient";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/fiqh" },
    title: "Fiqh Ringkas — Thullaabul 'Ilmi Board",
    description:
        "Panduan fiqh ibadah dan muamalah ringkas berdasarkan dalil shahih: thaharah, sholat, puasa, zakat, haji, dan lainnya.",
};

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialFiqhData() {
    try {
        const catRes = await fetch(`${API_URL}/api/v1/fiqh`, {
            next: { revalidate: 86400 },
        });

        let categories = [];

        if (catRes.ok) {
            const catData = await catRes.json();
            categories = Array.isArray(catData) ? catData : [];
        }

        return { categories, groupedItems: {} };
    } catch {
        return { categories: [], groupedItems: {} };
    }
}

export default async function FiqhPage() {
    const { categories, groupedItems } = await getInitialFiqhData();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <FiqhClient
                    initialCategories={categories}
                    initialGroupedItems={groupedItems}
                />
            </Section>
        </main>
    );
}
