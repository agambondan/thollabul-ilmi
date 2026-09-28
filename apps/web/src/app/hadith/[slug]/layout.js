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
    const bookName = book?.translation?.idn ?? book?.translation?.en ?? null;
    const title = bookName ? `Kitab ${bookName} — Hadits` : `Hadits`;
    const description = bookName
        ? `Baca kumpulan hadits lengkap dari Kitab ${bookName}. Jelajahi berdasarkan tema dan bab.`
        : `Baca dan pelajari hadits dari kitab-kitab utama termasuk Bukhari, Muslim, Abu Daud, dan lainnya.`;
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
