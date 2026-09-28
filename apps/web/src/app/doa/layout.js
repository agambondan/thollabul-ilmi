import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/doa" },
    openGraph: openGraphFor("/doa"),
    title: "Kumpulan Doa",
    description:
        "Kumpulan doa harian dan situasional dari Al-Quran dan Sunnah, mencakup doa pagi, petang, makan, tidur, safar, dan ibadah.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Kumpulan Doa",
    url: `${SITE_URL}/doa`,
    description:
        "Doa harian dan situasional dari Al-Quran dan Sunnah lengkap dengan teks Arab dan terjemahan.",
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
