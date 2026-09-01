import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/doa" },
    openGraph: openGraphFor("/doa"),
    title: "Prayer Collection",
    description:
        "A collection of daily and situational prayers from the Quran and Sunnah, including morning, evening, meal, sleep, travel, and worship prayers.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Prayer Collection",
    url: `${SITE_URL}/doa`,
    description:
        "Daily and situational prayers from the Quran and Sunnah with Arabic text and translation.",
    isPartOf: {
        "@type": "WebSite",
        name: "Thullaabul 'Ilmi",
        url: SITE_URL,
    },
};

export default function DoaLayout({ children }) {
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
