import { HadithDetailContent } from "@/app/dashboard/hadith/[slug]/page";
import Section from "@/components/Section";
import { getBooks } from "@/lib/api";
import { serializeJsonLd, SITE_URL } from "@/lib/site";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const toArr = (data) =>
    Array.isArray(data?.items ?? data) ? (data?.items ?? data) : [];

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
    const themes = await fetchThemes(params.slug);
    const firstThemeId = themes[0]?.id ?? themes[0]?.theme?.id ?? null;

    const [initialChapters, initialHadiths, fallbackHadiths] =
        await Promise.all([
            firstThemeId
                ? fetchChapters(params.slug, firstThemeId)
                : Promise.resolve([]),
            (async () => {
                if (!firstThemeId) return [];
                const chapters = firstThemeId
                    ? await fetchChapters(params.slug, firstThemeId)
                    : [];
                const firstChapterId = chapters[0]?.id;
                if (!firstChapterId) return [];
                return fetchHadiths(params.slug, firstThemeId, firstChapterId);
            })(),
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

    const books = await getBooks();
    const book = books.find((k) => k.slug === params?.slug);
    const bookName =
        book?.translation?.en ?? book?.translation?.idn ?? params?.slug;

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Beranda",
                item: `${SITE_URL}/`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Hadits",
                item: `${SITE_URL}/hadith`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: `Kitab ${bookName}`,
                item: `${SITE_URL}/hadith/${params.slug}`,
            },
        ],
    };

    return (
        <main className='min-h-screen flex flex-col'>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: serializeJsonLd(breadcrumbJsonLd),
                }}
            />
            <Section>
                <div className='dark:text-white'>
                    <HadithDetailContent
                        params={params}
                        basePath='/hadith'
                        showSelectors={true}
                        initialHadiths={
                            initialHadiths.length
                                ? initialHadiths
                                : fallbackHadiths
                        }
                        initialThemes={themes}
                        initialChapters={initialChapters}
                    />
                </div>
            </Section>
        </main>
    );
};

export default Page;
