import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";
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

export default async function HadithSlugLayout(props) {
    const params = await props.params;
    const { children } = props;
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
            ...(params?.slug
                ? [
                      {
                          "@type": "ListItem",
                          position: 3,
                          name: bookName ? `Kitab ${bookName}` : params.slug,
                          item: `${SITE_URL}/hadith/${params.slug}`,
                      },
                  ]
                : []),
        ],
    };

    return (
        <>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: serializeJsonLd(breadcrumbJsonLd),
                }}
            />
            {children}
        </>
    );
}
