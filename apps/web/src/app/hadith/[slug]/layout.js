import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { getBooks } from "@/lib/api";

export async function generateStaticParams() {
    const books = await getBooks();
    return books.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata(props) {
    const params = await props.params;
    const books = await getBooks();
    const book = books.find((k) => k.slug === params.slug);
    const bookName = book?.translation?.en ?? book?.translation?.idn ?? null;
    const title = bookName
        ? `${bookName} — Hadith`
        : `Hadith — Thullaabul 'Ilmi`;
    const description = bookName
        ? `Read the complete hadith collection from ${bookName}. Browse by theme and chapter.`
        : `Read and study hadith from major collections including Bukhari, Muslim, Abu Dawud, and others.`;
    const canonicalUrl = `${SITE_URL}/hadith/${params.slug}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title,
            description,
            url: canonicalUrl,
            images: [OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [OG_IMAGE.url],
        },
    };
}

export default function HadithSlugLayout({ children }) {
    return children;
}
