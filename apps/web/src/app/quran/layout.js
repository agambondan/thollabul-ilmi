import { openGraphFor, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/quran" },
    openGraph: openGraphFor("/quran"),
    title: "Al-Quran",
    description:
        "Read the complete 30 juz of the Quran with color-coded Tajweed to support recitation learning.",
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

export default function QuranLayout({ children }) {
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
