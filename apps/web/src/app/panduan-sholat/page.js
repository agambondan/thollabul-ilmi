import { PanduanSholatContent } from "./PanduanSholatClient";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/panduan-sholat" },
    title: "Panduan Sholat Lengkap — Thullaabul 'Ilmi Board",
    description:
        "Panduan tata cara sholat wajib 5 waktu dan sholat sunnah lengkap dengan rukun, bacaan Arab, latin, dan terjemahan.",
};

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const normalizeStep = (s) => ({
    step: s.step,
    name: s.name,
    name_en: s.name_en,
    arabic: s.arabic,
    latin: s.latin,
    terjemah: s.terjemah,
    terjemah_en: s.terjemah_en,
    penjelasan: s.penjelasan,
    penjelasan_en: s.penjelasan_en,
    source: s.source,
});

async function getInitialSteps() {
    try {
        const res = await fetch(`${API_URL}/api/v1/panduan-sholat`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.items ?? data ?? [])
            .filter((s) => s.step !== 1)
            .map(normalizeStep);
    } catch {
        return [];
    }
}

export default async function PanduanSholatPage() {
    const initialSteps = await getInitialSteps();

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-navbar'>
                <PanduanSholatContent initialSteps={initialSteps} />
            </div>
        </main>
    );
}
