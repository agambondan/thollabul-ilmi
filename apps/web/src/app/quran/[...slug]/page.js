import InfiniteScrollAyahPage from "@/app/quran/[...slug]/InfiniteScrollAyahPage";
import Section from "@/components/Section";

export const revalidate = 86400;

export async function generateStaticParams() {
    return Array.from({ length: 114 }, (_, i) => ({
        slug: [String(i + 1)],
    }));
}

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

async function getSurahData(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/surah/name/${encodeURIComponent(slug)}?page=0&size=10`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

const SuratPage = async (props) => {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const rawSlug = params?.slug;
    const slugPart = Array.isArray(rawSlug)
        ? rawSlug[0] === "surah"
            ? rawSlug[1]
            : rawSlug[0]
        : rawSlug;
    const slug = decodeURIComponent(slugPart ?? "1");
    const basePath =
        Array.isArray(params?.slug) && params.slug[0] === "surah"
            ? "/quran/surah"
            : "/quran";

    const initialSurah = await getSurahData(slug);

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='px-4'>
                    <InfiniteScrollAyahPage
                        params={params}
                        searchParams={searchParams}
                        basePath={basePath}
                        initialSurah={initialSurah}
                    />
                </div>
            </Section>
        </main>
    );
};

export default SuratPage;
