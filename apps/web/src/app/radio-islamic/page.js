import Section from "@/components/Section";
import { RadioIslamicClientContent } from "./RadioIslamicClient";
import { openGraphFor } from "@/lib/site";
import { radioIslamicApi } from "@/lib/api";

export const revalidate = 3600;

export const metadata = {
    alternates: { canonical: "/radio-islamic" },
    openGraph: openGraphFor("/radio-islamic"),
    title: "Radio Islam Indonesia & Frekuensi Domisili — Thullaabul 'Ilmi",
    description:
        "Daftar radio Islam di Jakarta dan kota-kota di Indonesia berdasarkan frekuensi dan domisili, lengkap dengan streaming online dan penjelasan alokasi frekuensi daerah.",
};

async function getInitialRadios() {
    try {
        const data = await radioIslamicApi.list({ size: 100 });
        return data.data ?? data;
    } catch {
        return { items: [], total: 0 };
    }
}

export default async function RadioIslamicPage() {
    const { items = [], total = 0 } = await getInitialRadios();

    return (
        <main className="min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900">
            <Section>
                <RadioIslamicClientContent initialRadios={items} initialTotal={total} />
            </Section>
        </main>
    );
}