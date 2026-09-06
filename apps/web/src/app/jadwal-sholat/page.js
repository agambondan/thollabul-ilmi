import Section from "@/components/Section";
import { JadwalSholatContent } from "./JadwalSholatClient";
import { openGraphFor } from "@/lib/site";
import { toLocalISODate } from "@/lib/date";

export const revalidate = 3600;

export const metadata = {
    alternates: { canonical: "/jadwal-sholat" },
    openGraph: openGraphFor("/jadwal-sholat"),
    title: "Jadwal Sholat Hari Ini — Thullaabul 'Ilmi",
    description:
        "Jadwal ibadah harian akurat dengan lokasi, metode (Kemenag, MWL, ISNA, dll), dan madhab (Syafi'i, Hanafi).",
};

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialPrayers() {
    try {
        const date = toLocalISODate();
        const res = await fetch(
            `${API_URL}/api/v1/sholat-times?lat=-6.2088&lng=106.8456&method=kemenag&madhab=shafi&date=${date}`,
            { next: { revalidate: 3600 } },
        );
        if (!res.ok) return { prayers: null, label: "" };
        const data = await res.json();
        const payload = data?.data ?? data;
        return {
            prayers: payload?.prayers ?? null,
            label: "Jakarta",
        };
    } catch {
        return { prayers: null, label: "" };
    }
}

export default async function JadwalSholatPage() {
    const { prayers, label } = await getInitialPrayers();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <JadwalSholatContent
                    initialPrayers={prayers}
                    initialLabel={label}
                />
            </Section>
        </main>
    );
}
