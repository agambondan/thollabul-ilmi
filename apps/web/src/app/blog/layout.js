import { openGraphFor, SITE_URL } from "@/lib/site";

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

export default function BlogLayout({ children }) {
    return (
        <>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(collectionJsonLd),
                }}
            />
            {children}
        </>
    );
}
