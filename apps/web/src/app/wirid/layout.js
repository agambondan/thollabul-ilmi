import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/wirid" },
    openGraph: openGraphFor("/wirid"),
    title: "Wird & Sunnah Readings",
    description:
        "A collection of wird and sunnah readings for special moments, including Friday, Ramadan, Arafah Day, Laylatul Qadr, Eid al-Fitr, and Eid al-Adha.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wird & Sunnah Readings",
    url: `${SITE_URL}/wirid`,
    description:
        "A collection of wird and sunnah readings for special moments with Arabic text, transliteration, and translation.",
    isPartOf: {
        "@type": "WebSite",
        name: "Thullaabul 'Ilmi",
        url: SITE_URL,
    },
};

export default function WiridLayout({ children }) {
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
