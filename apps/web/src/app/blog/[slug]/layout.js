import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

async function getBlogPost(slug) {
    try {
        const res = await fetch(`${API_URL}/api/v1/blog/posts/${slug}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata(props) {
    const params = await props.params;
    const post = await getBlogPost(params.slug);

    const title = post?.title ?? `Blog — Thullaabul 'Ilmi`;
    const description =
        post?.excerpt ??
        post?.summary ??
        `Read Islamic articles on Thullaabul 'Ilmi.`;
    const image = post?.image ?? post?.cover_image ?? null;
    const canonicalUrl = `${SITE_URL}/blog/${params.slug}`;

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
            images: image ? [{ url: image }, OG_IMAGE] : [OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: image ? [image] : [OG_IMAGE.url],
        },
    };
}

export default async function BlogSlugLayout(props) {
    const params = await props.params;

    const { children } = props;

    const post = await getBlogPost(params.slug);

    const jsonLd = post
        ? {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.excerpt ?? post.summary ?? "",
              image: post.image ?? post.cover_image ?? `${SITE_URL}/og`,
              datePublished: post.created_at ?? post.published_at ?? undefined,
              dateModified: post.updated_at ?? post.created_at ?? undefined,
              author: {
                  "@type": "Person",
                  name: post.author?.name ?? "Thullaabul 'Ilmi",
              },
              publisher: {
                  "@type": "Organization",
                  name: "Thullaabul 'Ilmi",
                  url: SITE_URL,
              },
              url: `${SITE_URL}/blog/${params.slug}`,
              mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": `${SITE_URL}/blog/${params.slug}`,
              },
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
