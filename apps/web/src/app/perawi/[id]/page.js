import Section from "@/components/Section";
import { PerawiDetailContent } from "@/app/dashboard/perawi/[id]/page";
import { OG_IMAGE, openGraphFor } from "@/lib/site";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

async function getPerawi(id) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/perawi/${encodeURIComponent(id)}`,
            { next: { revalidate: 3600 } },
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.error) return null;
        return data;
    } catch {
        return null;
    }
}

export async function generateMetadata(props) {
    const params = await props.params;
    const perawi = await getPerawi(params.id);

    if (!perawi) {
        return { title: `Perawi Hadits — Thullaabul 'Ilmi` };
    }

    const name = perawi.nama_latin || perawi.nama_lengkap || "Perawi Hadits";
    const rawDescription =
        perawi.biografis ||
        `Profil dan biografi ${name}: status kredibilitas (jarh wa ta'dil), sanad, dan riwayat hadits yang diriwayatkannya.`;
    const plainText = String(rawDescription).replace(/\s+/g, " ").trim();
    const description =
        plainText.length > 160 ? `${plainText.slice(0, 157)}...` : plainText;
    const title = `${name} — Biografi Perawi Hadits`;
    const canonicalUrl = `/perawi/${params.id}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: openGraphFor(canonicalUrl, {
            title,
            description,
        }),
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [OG_IMAGE.url],
        },
    };
}

const PerawiDetailPage = async (props) => {
    const params = await props.params;
    const initialPerawi = await getPerawi(params.id);

    return (
        <main className='min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950'>
            <Section>
                <PerawiDetailContent
                    params={params}
                    basePath='/perawi'
                    initialPerawi={initialPerawi}
                />
            </Section>
        </main>
    );
};

export default PerawiDetailPage;
