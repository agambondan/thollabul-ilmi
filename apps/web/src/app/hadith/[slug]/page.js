import { HadithDetailContent } from "@/app/dashboard/hadith/[slug]/page";
import Section from "@/components/Section";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialHadiths(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/hadiths/book/${slug}?page=0&size=10&slim=1`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.items) ? data.items : [];
    } catch {
        return [];
    }
}

export async function generateStaticParams() {
    return [
        { slug: "bukhari" },
        { slug: "muslim" },
        { slug: "abu-daud" },
        { slug: "tirmidzi" },
        { slug: "nasai" },
        { slug: "ibnu-majah" },
        { slug: "ahmad" },
        { slug: "malik" },
        { slug: "darimi" },
    ];
}

const Page = async (props) => {
    const params = await props.params;
    const initialHadiths = await getInitialHadiths(params.slug);
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='dark:text-white'>
                    <HadithDetailContent
                        params={params}
                        basePath='/hadith'
                        showSelectors={true}
                        initialHadiths={initialHadiths}
                    />
                </div>
            </Section>
        </main>
    );
};

export default Page;
