import { openGraphFor, serializeJsonLd, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/fiqh" },
    openGraph: openGraphFor("/fiqh"),
    title: "Fiqh Ringkas",
    description:
        "Panduan praktis hukum Islam sehari-hari: bersuci, sholat, puasa, zakat, haji, dan muamalah, disertai dalil dari Al-Quran dan Hadits.",
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
            name: "Fiqh Ringkas",
            item: `${SITE_URL}/fiqh`,
        },
    ],
};

export default function FiqhLayout({ children }) {
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
