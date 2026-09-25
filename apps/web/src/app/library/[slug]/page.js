import Section from "@/components/Section";
import { LibraryDetailContent } from "@/app/library/[slug]/LibraryDetailPageClient";
import { OG_IMAGE, openGraphFor } from "@/lib/site";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

async function getBook(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/library/books/${encodeURIComponent(slug)}`,
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

const normalizeBook = (data) => data?.data ?? data;

export async function generateMetadata(props) {
    const params = await props.params;
    const initialBook = await getBook(params.slug);
    const book = normalizeBook(initialBook);

    if (!book) {
        return { title: `Perpustakaan — Thullaabul 'Ilmi` };
    }

    const bookTitle = book.title || "Kitab";
    const plainDescription = String(book.description || "")
        .replace(/\s+/g, " ")
        .trim();
    const fallbackDescription = book.author
        ? `${bookTitle} oleh ${book.author} — tersedia di Perpustakaan Thullaabul 'Ilmi.`
        : `${bookTitle} tersedia di Perpustakaan Thullaabul 'Ilmi.`;
    const description = plainDescription
        ? plainDescription.length > 155
            ? `${plainDescription.slice(0, 152)}...`
            : plainDescription
        : fallbackDescription;
    const title = `${bookTitle} — Perpustakaan`;
    const canonicalUrl = `/library/${params.slug}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: openGraphFor(canonicalUrl, {
            type: "article",
            title,
            description,
            images: book.cover_url
                ? [{ url: book.cover_url }, OG_IMAGE]
                : [OG_IMAGE],
        }),
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [book.cover_url || OG_IMAGE.url],
        },
    };
}

const LibraryDetailPage = async (props) => {
    const params = await props.params;
    const initialBook = await getBook(params.slug);

    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <LibraryDetailContent
                    params={params}
                    basePath='/library'
                    initialBook={initialBook}
                />
            </Section>
        </main>
    );
};

export { LibraryDetailContent };
export default LibraryDetailPage;
