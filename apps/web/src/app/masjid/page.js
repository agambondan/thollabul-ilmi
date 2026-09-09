import Section from "@/components/Section";
import { MasjidClientContent } from "./MasjidClient";
import { openGraphFor } from "@/lib/site";
import { masjidApi } from "@/lib/api";

export const revalidate = 3600;

export const metadata = {
    alternates: { canonical: "/masjid" },
    openGraph: openGraphFor("/masjid"),
    title: "Daftar Masjid Jakarta & Sekitarnya — Thullaabul 'Ilmi",
    description:
        "Daftar masjid ahlussunnah waljama'ah di Jakarta & Bodetabek: Masjid Jami' Al-Barkah (Rodja), Masjid Nur-Salma Kuningan, Masjid Nurim Blok M, Masjid Sunda Kelapa, Masjid Al-Ikhlas Cipete, Baitussalam Billy Moon, BSD, Cibubur. Cari fasilitas, lokasi, dan jarak GPS.",
};

async function getInitialMasjids() {
    try {
        const data = await masjidApi.list({ size: 100 });
        return data.data ?? data;
    } catch {
        return { items: [], total: 0 };
    }
}

export default async function MasjidPage() {
    const { items = [], total = 0 } = await getInitialMasjids();

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <Section>
                <MasjidClientContent
                    initialMasjids={items}
                    initialTotal={total}
                />
            </Section>
        </main>
    );
}
