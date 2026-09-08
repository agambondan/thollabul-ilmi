import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";
const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

async function getSirohContent(slug) {
    try {
        const res = await fetch(`${API_URL}/api/v1/siroh/contents/${slug}`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export const revalidate = 86400;

export async function generateStaticParams() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/siroh/contents?page=0&size=100`,
            {
                next: { revalidate: 86400 },
            },
        );
        if (!res.ok) return [];
        const data = await res.json();
        const items =
            data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        return items
            .map((it) => ({ slug: String(it.slug ?? it.id ?? "") }))
            .filter((it) => it.slug);
    } catch {
        return [];
    }
}

export async function generateMetadata(props) {
    const params = await props.params;
    const content = await getSirohContent(params.slug);

    const title = content?.title
        ? `${content.title} — Prophet's Biography`
        : `Prophet's Biography — Thullaabul 'Ilmi`;
    const description =
        content?.summary ??
        content?.excerpt ??
        `Read the biography of Prophet Muhammad ﷺ in clear, chapter-based lessons.`;

    const canonicalUrl = `${SITE_URL}/siroh/${params.slug}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title,
            description,
            url: canonicalUrl,
            images: [OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [OG_IMAGE.url],
        },
    };
}

export default async function SirohDetailLayout(props) {
    const params = await props.params;
    const { children } = props;
    const content = await getSirohContent(params?.slug);

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
                name: "Siroh",
                item: `${SITE_URL}/siroh`,
            },
            ...(params?.slug
                ? [
                      {
                          "@type": "ListItem",
                          position: 3,
                          name: content?.title ?? params.slug,
                          item: `${SITE_URL}/siroh/${params.slug}`,
                      },
                  ]
                : []),
        ],
    };

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
