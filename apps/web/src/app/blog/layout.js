import { openGraphFor, serializeJsonLd, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/blog" },
    openGraph: openGraphFor("/blog"),
    title: "Blog Islami",
    description:
        "Baca artikel seputar ilmu Islam, Al-Quran, Hadits, sholat, puasa, dan kehidupan muslim modern.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Islami — Thullaabul 'Ilmi",
    url: `${SITE_URL}/blog`,
    description:
        "Artikel Islami seputar Al-Quran, Hadits, sholat, puasa, dan kehidupan muslim modern.",
    publisher: {
        "@type": "Organization",
        name: "Thullaabul 'Ilmi",
        url: SITE_URL,
    },
};

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
            name: "Blog Islami",
            item: `${SITE_URL}/blog`,
        },
    ],
};

export default function BlogLayout({ children }) {
    return (
        <>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(collectionJsonLd),
                }}
            />
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
