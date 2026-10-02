import { openGraphFor, serializeJsonLd, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/hadith" },
    openGraph: openGraphFor("/hadith"),
    title: "Koleksi Hadits Shahih",
    description:
        "Baca 9 kitab hadits shahih (Bukhari, Muslim, Abu Daud, Tirmidzi, Nasai, Ibnu Majah, Ahmad, Malik, Darimi) lengkap dengan terjemahan dan pencarian.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Koleksi Hadits Shahih",
    url: `${SITE_URL}/hadith`,
    description:
        "9 kitab hadits shahih (Bukhari, Muslim, Abu Daud, Tirmidzi, Nasai, Ibnu Majah, Ahmad, Malik, Darimi) lengkap dengan terjemahan dan pencarian.",
    isPartOf: {
        "@type": "WebSite",
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
            name: "Hadits",
            item: `${SITE_URL}/hadith`,
        },
    ],
};

export default function HadithLayout({ children }) {
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
