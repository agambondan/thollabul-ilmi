import { openGraphFor, serializeJsonLd, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/tafsir" },
    openGraph: openGraphFor("/tafsir"),
    title: "Tafsir Al-Quran",
    description:
        "Baca tafsir Al-Quran per surah dan ayat untuk memahami makna Al-Quran lebih dalam lewat penjelasan ulama terpercaya.",
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
            name: "Tafsir",
            item: `${SITE_URL}/tafsir`,
        },
    ],
};

export default function TafsirLayout({ children }) {
    return (
        <>
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
