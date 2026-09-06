import { HadithDetailContent } from "@/app/dashboard/hadith/[slug]/page";
import Section from "@/components/Section";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const toArr = (data) => (Array.isArray(data?.items ?? data) ? (data?.items ?? data) : []);

async function fetchThemes(slug) {
    try {
        const res = await fetch(`${API_URL}/api/v1/themes/book/${slug}`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        return toArr(await res.json());
    } catch {
        return [];
    }
}

async function fetchChapters(slug, themeId) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/chapters/book/${slug}/theme/${themeId}?size=100`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        return toArr(await res.json());
    } catch {
        return [];
    }
}

async function fetchHadiths(slug, themeId, chapterId) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/hadiths/book/${slug}/theme/${themeId}/chapter/${chapterId}?page=0&size=20&slim=1`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        return toArr(await res.json());
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
    const [themes, fallbackHadiths] = await Promise.all([
        fetchThemes(params.slug),
        (async () => {
            try {
                const res = await fetch(
                    `${API_URL}/api/v1/hadiths/book/${params.slug}?page=0&size=10&slim=1`,
                    { next: { revalidate: 86400 } },
                );
                if (!res.ok) return [];
                return toArr(await res.json());
            } catch {
                return [];
            }
        })(),
    ]);

    const firstThemeId = themes[0]?.id ?? themes[0]?.theme?.id ?? null;
    let initialChapters = [];
    let initialHadiths = [];
    if (firstThemeId) {
        initialChapters = await fetchChapters(params.slug, firstThemeId);
        const firstChapter = initialChapters[0];
        const firstChapterId = firstChapter?.id;
        if (firstChapterId) {
            initialHadiths = await fetchHadiths(
                params.slug,
                firstThemeId,
                firstChapterId,
            );
        }
    }

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='dark:text-white'>
                    <HadithDetailContent
                        params={params}
                        basePath='/hadith'
                        showSelectors={true}
                        initialHadiths={initialHadiths.length ? initialHadiths : fallbackHadiths}
                        initialThemes={themes}
                        initialChapters={initialChapters}
                    />
                </div>
            </Section>
        </main>
    );
};

export default Page;
