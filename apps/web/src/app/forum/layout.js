import { openGraphFor, serializeJsonLd, SITE_URL } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/forum" },
    openGraph: openGraphFor("/forum"),
    title: "Islamic Forum & Q&A",
    description:
        "Tanya jawab dan diskusi seputar pemahaman Islam, ibadah, fiqh, dan muamalah bersama komunitas Thullaabul 'Ilmi.",
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
            name: "Forum Diskusi",
            item: `${SITE_URL}/forum`,
        },
    ],
};

export default function ForumLayout({ children }) {
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
