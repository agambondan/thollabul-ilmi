import { openGraphFor } from "@/lib/site";
import BelajarPage from '@/app/dashboard/belajar/page';

export const metadata = {
    alternates: { canonical: "/belajar" },
    openGraph: openGraphFor("/belajar"),
    title: 'Pusat Belajar — Thullaabul \'Ilmi',
    description: 'Pusat belajar ilmu Islam komprehensif: modul interaktif, kajian, sejarah, fiqh, dan kamus.',
};

export default function PublicBelajarPage() {
    return <BelajarPage />;
}
