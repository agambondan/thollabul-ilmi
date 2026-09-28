import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/wirid" },
    openGraph: openGraphFor("/wirid"),
    title: "Wirid & Bacaan Sunnah",
    description:
        "Kumpulan wirid dan bacaan sunnah untuk momen-momen khusus, termasuk hari Jumat, Ramadan, hari Arafah, Lailatul Qadar, Idul Fitri, dan Idul Adha.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wirid & Bacaan Sunnah",
    url: `${SITE_URL}/wirid`,
    description:
        "Kumpulan wirid dan bacaan sunnah untuk momen-momen khusus lengkap dengan teks Arab, transliterasi, dan terjemahan.",
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
