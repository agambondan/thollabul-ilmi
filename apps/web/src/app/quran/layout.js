import { openGraphFor, SITE_URL, serializeJsonLd } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/quran" },
    openGraph: openGraphFor("/quran"),
    title: "Al-Quran",
    description:
        "Baca Al-Quran lengkap 30 juz dengan Tajweed berwarna untuk membantu belajar tilawah.",
};

const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Al-Quran",
    alternateName: "Quran",
    bookFormat: "EBook",
    inLanguage: ["ar", "id", "en"],
    url: `${SITE_URL}/quran`,
    isAccessibleForFree: true,
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
            name: "Al-Quran",
            item: `${SITE_URL}/quran`,
        },
    ],
};

export default function QuranLayout({ children }) {
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
