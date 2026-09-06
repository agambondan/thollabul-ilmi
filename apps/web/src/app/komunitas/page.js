import Section from "@/components/Section";
import KomunitasPage from "@/app/dashboard/komunitas/page";
import { openGraphFor } from "@/lib/site";

export const revalidate = 3600;

export const metadata = {
    alternates: { canonical: "/komunitas" },
    openGraph: openGraphFor("/komunitas"),
    title: "Komunitas — Thullaabul 'Ilmi",
    description:
        "Bergabung dengan komunitas Thullaabul 'Ilmi. Diskusi, forum, dan obrolan realtime sesama penuntut ilmu.",
};

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const pickItems = (payload) => {
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
};

async function getInitialData() {
    let blog = [];
    let forum = [];
    let hallOfFame = [];

    try {
        const res = await fetch(`${API_URL}/api/v1/blog?page=0&size=3`, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            const data = await res.json();
            blog = pickItems(data).slice(0, 3);
        }
    } catch {}

    try {
        const res = await fetch(`${API_URL}/api/v1/forum?page=0&size=50&sort=top`, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            const data = await res.json();
            const items = pickItems(data);
            forum = [...items]
                .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                .slice(0, 3);
        }
    } catch {}

    try {
        const res = await fetch(`${API_URL}/api/v1/leaderboard/hafalan`, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            const data = await res.json();
            hallOfFame = pickItems(data).slice(0, 3);
        }
    } catch {}

    return { blog, forum, hallOfFame };
}

export default async function PublicKomunitasPage() {
    const { blog, forum, hallOfFame } = await getInitialData();

    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <KomunitasPage
                    basePath=''
                    initialBlog={blog}
                    initialForum={forum}
                    initialHallOfFame={hallOfFame}
                />
            </Section>
        </main>
    );
}
