import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getFiqhItem(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/fiqh/item/${encodeURIComponent(slug)}`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export const revalidate = 86400;

export async function generateStaticParams() {
    try {
        const res = await fetch(`${API_URL}/api/v1/fiqh/items?size=500`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        return items.map((it) => ({ slug: it.slug })).filter((it) => it.slug);
    } catch {
        return [];
    }
}

export async function generateMetadata(props) {
    const params = await props.params;
    const item = await getFiqhItem(params.slug);

    const title = item?.title
        ? `${item.title} — Fiqh Ringkas`
        : `Fiqh Ringkas — Thullaabul 'Ilmi Board`;
    const description = item?.content
        ? item.content.slice(0, 160)
        : "Panduan fiqh ibadah dan muamalah ringkas berdasarkan dalil shahih.";
    const canonicalUrl = `${SITE_URL}/fiqh/${params.slug}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            type: "article",
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

export default async function FiqhItemLayout(props) {
    const params = await props.params;
    const { children } = props;
    const item = await getFiqhItem(params?.slug);
    const category = item?.category_ref;

    const articleJsonLd = item
        ? {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: item.title,
              image: [`${SITE_URL}${OG_IMAGE.url}`],
              articleBody: item.content,
              ...((item.dalil || item.source) && {
                  citation: item.dalil || item.source,
              }),
              ...(category?.name && { about: category.name }),
              isPartOf: {
                  "@type": "WebPage",
                  url: `${SITE_URL}/fiqh`,
                  name: "Fiqh Ringkas",
              },
              publisher: {
                  "@type": "Organization",
                  name: SITE_NAME,
                  logo: {
                      "@type": "ImageObject",
                      url: `${SITE_URL}/icon-512.png`,
                      width: 512,
                      height: 512,
                  },
              },
          }
        : null;

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
            ...(category?.name
                ? [
                      {
                          "@type": "ListItem",
                          position: 3,
                          name: category.name,
                          item: `${SITE_URL}/fiqh#${category.slug}`,
                      },
                  ]
                : []),
            ...(params?.slug
                ? [
                      {
                          "@type": "ListItem",
                          position: category?.name ? 4 : 3,
                          name: item?.title ?? params.slug,
                          item: `${SITE_URL}/fiqh/${params.slug}`,
                      },
                  ]
                : []),
        ],
    };

    return (
        <>
            {articleJsonLd && (
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{
                        __html: serializeJsonLd(articleJsonLd),
                    }}
                />
            )}
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
