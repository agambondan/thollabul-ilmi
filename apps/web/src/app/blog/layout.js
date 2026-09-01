import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/blog" },
    openGraph: openGraphFor("/blog"),
    title: "Islamic Blog",
    description:
        "Read articles on Islamic knowledge, Quran, Hadith, prayer, fasting, and modern Muslim life.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Islamic Blog — Thullaabul 'Ilmi",
    url: `${SITE_URL}/blog`,
    description:
        "Islamic articles on Quran, Hadith, prayer, fasting, and modern Muslim life.",
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
