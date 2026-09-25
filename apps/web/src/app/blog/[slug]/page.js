import Section from "@/components/Section";
import { BlogDetailContent } from "@/app/blog/[slug]/BlogDetailPageClient";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

async function getPost(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/blog/posts/${encodeURIComponent(slug)}`,
            { next: { revalidate: 3600 } },
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.error) return null;
        return data;
    } catch {
        return null;
    }
}

const BlogDetailPage = async (props) => {
    const params = await props.params;
    const initialPost = await getPost(params.slug);

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <BlogDetailContent
                    params={params}
                    basePath='/blog'
                    initialPost={initialPost}
                />
            </Section>
        </main>
    );
};

export { BlogDetailContent };
export default BlogDetailPage;
