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
    ...s,
    title: s.title || s.translation?.idn || "",
    arabic: s.arabic || s.translation?.ar || "",
    latin: s.latin || s.transliteration || s.translation?.latin_idn || "",
    terjemah:
        (typeof s.translation === "string"
            ? s.translation
            : s.translation?.description_idn) ||
        s.translation_text ||
        "",
    note: s.notes || s.description || "",
});

async function getInitialSteps() {
    try {
        const res = await fetch(`${API_URL}/api/v1/panduan-sholat`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.items ?? data ?? []).map(normalizeStep);
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
