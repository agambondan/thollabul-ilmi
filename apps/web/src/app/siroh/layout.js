import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/siroh" },
    openGraph: openGraphFor("/siroh"),
    title: "Sirah Nabawiyah",
    description:
        "Baca sirah (biografi) Nabi Muhammad ﷺ dalam pembahasan yang jelas per bab.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sirah Nabawiyah",
    url: `${SITE_URL}/siroh`,
    description:
        "Biografi Nabi Muhammad ﷺ dalam pembahasan yang jelas per bab.",
    isPartOf: {
        "@type": "WebSite",
        name: "Thullaabul 'Ilmi",
        url: SITE_URL,
    },
};

export default function SirohLayout({ children }) {
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
