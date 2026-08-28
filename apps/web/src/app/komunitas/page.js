import { openGraphFor } from "@/lib/site";
import KomunitasPage from '@/app/dashboard/komunitas/page';

export const metadata = {
    alternates: { canonical: "/komunitas" },
    openGraph: openGraphFor("/komunitas"),
    title: 'Komunitas — Thullaabul \'Ilmi',
    description: 'Bergabung dengan komunitas Thullaabul \'Ilmi. Diskusi, forum, dan obrolan realtime sesama penuntut ilmu.',
};

export default function PublicKomunitasPage() {
    return <KomunitasPage />;
}
