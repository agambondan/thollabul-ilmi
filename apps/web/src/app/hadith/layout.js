import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/hadith" },
    openGraph: openGraphFor("/hadith"),
    title: "Authentic Hadith Collections",
    description:
        "Read 9 authentic Hadith books (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Ahmad, Malik, Darimi) with translations and search.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Authentic Hadith Collections",
    url: `${SITE_URL}/hadith`,
    description:
        "9 authentic Hadith books (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Ahmad, Malik, Darimi) with translations and search.",
    isPartOf: {
        "@type": "WebSite",
        name: "Thullaabul 'Ilmi",
        url: SITE_URL,
    },
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
            {children}
        </>
    );
}
